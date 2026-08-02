import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("../services/api", () => ({
  api: {
    getDomesticStaff: jest.fn(),
    getChamaContributions: jest.fn(),
    getAssetRoles: jest.fn(),
    getGroceryOrders: jest.fn(),
    createDomesticStaff: jest.fn(),
    createChamaContribution: jest.fn(),
    confirmChamaContribution: jest.fn(),
    createGroceryOrder: jest.fn(),
    cancelGroceryOrder: jest.fn(),
  },
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({
    activeAsset: {
      backendId: 1,
      name: "Home Base",
      location: "Ntinda, Kampala",
    },
    userProfile: { id: 7 },
  }),
}));

import { api } from "../services/api";
import ResidentCommandScreen from "../app/resident-command";

const staffMember = {
  id: 1,
  first_name: "Grace",
  last_name: "Achieng",
  role: "House Manager",
  phone_number: "+256700000001",
  salary: 250000,
  nssf_contribution: 25000,
  status: "active",
};

describe("<ResidentCommandScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getDomesticStaff as jest.Mock).mockResolvedValue([staffMember]);
    (api.getChamaContributions as jest.Mock).mockResolvedValue([
      {
        id: 1,
        contribution_number: 3,
        amount: 50000,
        due_date: "2026-08-05",
        status: "pending",
      },
    ]);
    (api.getAssetRoles as jest.Mock).mockResolvedValue([]);
    (api.getGroceryOrders as jest.Mock).mockResolvedValue([
      {
        id: 1,
        items: [{ name: "Sugar 1kg" }, { name: "Rice 2kg" }],
        mode: "kadogo",
        status: "pending",
        created_at: "2026-08-01T10:00:00Z",
      },
    ]);
  });

  test("renders the staff panel with household staff", async () => {
    const { getByText } = await render(<ResidentCommandScreen />);

    getByText("Resident Command");
    getByText("Grace Achieng");
    getByText(/House Manager/);
  });

  test("registers a staff member through the modal", async () => {
    (api.createDomesticStaff as jest.Mock).mockResolvedValue({});
    const { getByText, getByPlaceholderText } = await render(
      <ResidentCommandScreen />,
    );

    await fireEvent.press(getByText("Register Staff Member"));
    await fireEvent.changeText(
      getByPlaceholderText("first name"),
      "John",
    );
    await fireEvent.changeText(
      getByPlaceholderText("phone number"),
      "+256700000002",
    );
    await fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(api.createDomesticStaff as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: 1,
          first_name: "John",
          phone_number: "+256700000002",
          permissions: { errands: true, maintenance_access: true },
        }),
      );
    });
  });

  test("marks a pending chama contribution as paid", async () => {
    (api.confirmChamaContribution as jest.Mock).mockResolvedValue({});
    const { getByText } = await render(<ResidentCommandScreen />);

    await fireEvent.press(getByText("Chama"));
    getByText("Round #3");
    await fireEvent.press(getByText("Mark Paid"));

    expect(api.confirmChamaContribution as jest.Mock).toHaveBeenCalledWith(1);
  });

  test("submits a grocery order and can cancel it", async () => {
    (api.createGroceryOrder as jest.Mock).mockResolvedValue({});
    (api.cancelGroceryOrder as jest.Mock).mockResolvedValue({});
    const { getByText } = await render(<ResidentCommandScreen />);

    await fireEvent.press(getByText("Grocery"));
    await fireEvent.press(getByText("Submit Grocery Order"));

    await waitFor(() => {
      expect(api.createGroceryOrder as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "kadogo",
          delivery_address: "Ntinda, Kampala",
          items: expect.arrayContaining([
            expect.objectContaining({ name: "Sugar 1kg" }),
            expect.objectContaining({ name: "Rice 2kg" }),
            expect.objectContaining({ name: "Soap" }),
          ]),
        }),
      );
    });

    getByText(/Sugar 1kg, Rice 2kg/);
    await fireEvent.press(getByText("Cancel Order"));
    expect(api.cancelGroceryOrder as jest.Mock).toHaveBeenCalledWith(1);
  });

  test("shows the family link code and roles", async () => {
    (api.getAssetRoles as jest.Mock).mockResolvedValue([
      { id: 1, user_email: "family@homebase.test", role: "owner", asset_name: "Home Base" },
    ]);
    const { getByText } = await render(<ResidentCommandScreen />);

    await fireEvent.press(getByText("Family"));
    getByText("Family Link Code");
    getByText(/HB-1-7/);
    getByText("family@homebase.test");
  });
});
