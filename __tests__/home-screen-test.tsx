import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

const mockPush = jest.fn();
const mockSetActiveAssetById = jest.fn();
const mockGetCategories = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: (props: any) => React.createElement(View, props),
  };
});

jest.mock("../services/api", () => ({
  api: { getCategories: mockGetCategories },
}));

jest.mock("../components/workspace/PortfolioWorkspace", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(Text, null, "PORTFOLIO_WORKSPACE"),
  };
});

jest.mock("../components/workspace/GenesisWorkspace", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(Text, null, "GENESIS_WORKSPACE"),
  };
});

jest.mock("../context/AppContext", () => ({
  useApp: () => mockAppContext,
}));

import HomeScreen from "../app/(tabs)/index";

let mockAppContext: any = {};

const baseContext = {
  activeAsset: null,
  assets: [],
  setActiveAssetById: mockSetActiveAssetById,
  isOffline: false,
  hasScope: jest.fn(() => true),
};

const rentalAsset = {
  id: "1",
  name: "Ntinda Unit 1",
  type: "RENTAL",
  role: "OWNER",
  balance: 1700000,
};

const constructionAsset = {
  id: "2",
  name: "Site A",
  type: "CONSTRUCTION",
  role: "OWNER",
  balance: 5000000,
};

const householdAsset = {
  id: "3",
  name: "Home Base",
  type: "HOUSEHOLD",
  role: "OWNER",
  balance: 0,
};

describe("<HomeScreen /> context dispatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategories.mockResolvedValue([]);
    mockAppContext = { ...baseContext };
  });

  test("shows the identity selector placeholder with no active asset", async () => {
    const { getByText } = await render(<HomeScreen />);

    getByText("Select Identity Asset");
    expect(() => getByText("PORTFOLIO_WORKSPACE")).toThrow();
    expect(() => getByText("GENESIS_WORKSPACE")).toThrow();
  });

  test("dispatches to the rental workspace for a rental asset", async () => {
    mockAppContext = {
      ...baseContext,
      activeAsset: rentalAsset,
      assets: [rentalAsset],
    };
    const { getByText } = await render(<HomeScreen />);

    getByText("PORTFOLIO_WORKSPACE");
    expect(() => getByText("GENESIS_WORKSPACE")).toThrow();
  });

  test("dispatches to the construction workspace for a construction site", async () => {
    mockAppContext = {
      ...baseContext,
      activeAsset: constructionAsset,
      assets: [constructionAsset],
    };
    const { getByText } = await render(<HomeScreen />);

    getByText("GENESIS_WORKSPACE");
    expect(() => getByText("PORTFOLIO_WORKSPACE")).toThrow();
  });

  test("shows resident command, health, and trust buttons for a household", async () => {
    mockAppContext = {
      ...baseContext,
      activeAsset: householdAsset,
      assets: [householdAsset],
    };
    const { getByText } = await render(<HomeScreen />);

    getByText("Open Resident Command");
    getByText("Open Health Services");
    getByText("Open Trust Center");
    expect(() => getByText("PORTFOLIO_WORKSPACE")).toThrow();
  });

  test("switches the active asset from the dropdown", async () => {
    mockAppContext = {
      ...baseContext,
      activeAsset: constructionAsset,
      assets: [rentalAsset, constructionAsset],
    };
    const { getByText } = await render(<HomeScreen />);

    await fireEvent.press(getByText("Site A"));
    getByText("Ntinda Unit 1 (OWNER)");
    await fireEvent.press(getByText("Ntinda Unit 1 (OWNER)"));

    expect(mockSetActiveAssetById).toHaveBeenCalledWith("1");
  });
});
