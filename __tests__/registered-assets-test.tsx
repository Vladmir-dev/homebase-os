import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

const mockPush = jest.fn();
const mockCreateAsset = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({ assets: mockAssets, createAsset: mockCreateAsset }),
}));

import RegisteredAssetsScreen from "../app/(tabs)/registered-assets";

let mockAssets: any[] = [];

const rentalAsset = {
  id: "1",
  name: "Ntinda Unit 1",
  type: "RENTAL",
  role: "OWNER",
  location: "Kampala",
  description: "2-bedroom unit",
};

describe("<RegisteredAssetsScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssets = [];
  });

  test("shows the empty state when there are no assets", async () => {
    const { getByText } = await render(<RegisteredAssetsScreen />);

    getByText("No registered assets yet");
    getByText("0 items");
  });

  test("lists registered assets with role", async () => {
    mockAssets = [rentalAsset];
    const { getByText } = await render(<RegisteredAssetsScreen />);

    getByText("Ntinda Unit 1");
    getByText("OWNER");
    getByText("1 item");
  });

  test("requires an asset name before creating", async () => {
    const { getByText } = await render(<RegisteredAssetsScreen />);

    await fireEvent.press(getByText("Create asset"));
    await fireEvent.press(getByText("Create Asset"));

    getByText("Please enter an asset name");
    expect(mockCreateAsset).not.toHaveBeenCalled();
  });

  test("requires monthly rent when creating a rental unit", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <RegisteredAssetsScreen />,
    );

    await fireEvent.press(getByText("Create asset"));
    await fireEvent.press(getByText("Rental"));
    await fireEvent.changeText(
      getByPlaceholderText("Enter asset name"),
      "Ntinda Unit 2",
    );
    await fireEvent.changeText(
      getByPlaceholderText("Enter location"),
      "Ntinda",
    );
    await fireEvent.press(getByText("Create Asset"));

    getByText("Monthly rent is required for rental units");
    expect(mockCreateAsset).not.toHaveBeenCalled();
  });

  test("creates a rental unit with rent amount and UGX currency", async () => {
    mockCreateAsset.mockResolvedValue({});
    const { getByText, getByPlaceholderText } = await render(
      <RegisteredAssetsScreen />,
    );

    await fireEvent.press(getByText("Create asset"));
    await fireEvent.press(getByText("Rental"));
    await fireEvent.changeText(
      getByPlaceholderText("Enter asset name"),
      "Ntinda Unit 2",
    );
    await fireEvent.changeText(
      getByPlaceholderText("Enter location"),
      "Ntinda",
    );
    await fireEvent.changeText(
      getByPlaceholderText("Enter monthly rent"),
      "850000",
    );
    await fireEvent.press(getByText("Create Asset"));

    await waitFor(() => {
      expect(mockCreateAsset).toHaveBeenCalledWith(
        "Ntinda Unit 2",
        "rental_unit",
        "Ntinda",
        expect.objectContaining({
          rent_amount: 850000,
          currency: "UGX",
        }),
      );
    });
    expect(mockPush).toHaveBeenCalled();
  });

  test("requires a planned budget for construction sites", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <RegisteredAssetsScreen />,
    );

    await fireEvent.press(getByText("Create asset"));
    await fireEvent.press(getByText("Construction"));
    await fireEvent.changeText(
      getByPlaceholderText("Enter asset name"),
      "Site A",
    );
    await fireEvent.changeText(
      getByPlaceholderText("Enter location"),
      "Industrial Area",
    );
    await fireEvent.press(getByText("Create Asset"));

    getByText("Budget planned is required for construction sites");
    expect(mockCreateAsset).not.toHaveBeenCalled();
  });
});
