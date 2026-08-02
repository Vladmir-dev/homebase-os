import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

const mockPush = jest.fn();
const mockCreateMaintenanceRequest = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../services/api", () => ({
  api: {
    getLeases: jest.fn(),
    getRentPayments: jest.fn(),
    getMaintenanceRequests: jest.fn(),
    getUtilityReadings: jest.fn(),
    getReports: jest.fn(),
    getLedgerByAsset: jest.fn(),
    createLeaseByEmail: jest.fn(),
    activateLease: jest.fn(),
    terminateLease: jest.fn(),
    updateLease: jest.fn(),
    initializePayment: jest.fn(),
    createReport: jest.fn(),
  },
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({
    activeAsset: { backendId: 1, name: "Ntinda Unit 1", type: "RENTAL" },
    createMaintenanceRequest: mockCreateMaintenanceRequest,
    userProfile: { phone_number: "+256700111222" },
  }),
}));

import { api } from "../services/api";
import PortfolioWorkspace from "../components/workspace/PortfolioWorkspace";

const ownerProps = { role: "OWNER", assetId: "1" };

describe("<PortfolioWorkspace /> owner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getLeases as jest.Mock).mockResolvedValue([]);
    (api.getRentPayments as jest.Mock).mockResolvedValue([]);
    (api.getMaintenanceRequests as jest.Mock).mockResolvedValue([]);
    (api.getUtilityReadings as jest.Mock).mockResolvedValue([]);
    (api.getReports as jest.Mock).mockResolvedValue([]);
    (api.getLedgerByAsset as jest.Mock).mockResolvedValue({
      entries: [],
      running_balance: 0,
      total_credit: 0,
    });
  });

  test("renders the owner summary cards", async () => {
    const { getByText } = await render(<PortfolioWorkspace {...ownerProps} />);

    getByText("Ledger Balance");
    getByText("Yield Collected");
    getByText("Property Leases & Ledger");
    getByText(/Preview Tenant View/);
  });

  test("owner creates an active lease by tenant email", async () => {
    (api.createLeaseByEmail as jest.Mock).mockResolvedValue({
      id: 10,
      status: "active",
    });
    const { getByText, getByPlaceholderText, getAllByText } = await render(
      <PortfolioWorkspace {...ownerProps} />,
    );

    await fireEvent.press(getByText("+ New Lease"));
    await fireEvent.changeText(
      getByPlaceholderText("tenant@example.com"),
      "demo.tenant@homebase.test",
    );
    await fireEvent.changeText(
      getByPlaceholderText("Start Date (YYYY-MM-DD)"),
      "2026-01-01",
    );
    await fireEvent.changeText(
      getByPlaceholderText("End Date (YYYY-MM-DD)"),
      "2026-12-31",
    );
    await fireEvent.changeText(
      getByPlaceholderText("Monthly Rent"),
      "850000",
    );

    const createButton = getAllByText("Create Lease").at(-1)!;
    await fireEvent.press(createButton);

    await waitFor(() => {
      expect(api.createLeaseByEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: 1,
          tenant_email: "demo.tenant@homebase.test",
          monthly_rent: 850000,
          activate: true,
          currency: "UGX",
        }),
      );
    });
  });

  test("previews the tenant view and exits back", async () => {
    const { getByText, queryByText } = await render(
      <PortfolioWorkspace {...ownerProps} />,
    );

    await fireEvent.press(getByText(/Preview Tenant View/));
    getByText("My Rental Lease Statement");
    getByText(/Previewing the tenant view/);

    await fireEvent.press(getByText("Exit Preview"));
    expect(queryByText(/Previewing the tenant view/)).toBeNull();
    getByText("Property Leases & Ledger");
  });

  test("activate button calls api.activateLease for a draft lease", async () => {
    (api.getLeases as jest.Mock).mockResolvedValue([
      {
        id: 5,
        asset_name: "Ntinda Unit 1",
        status: "draft",
        tenant_email: "demo.tenant@homebase.test",
        monthly_rent: "850000",
      },
    ]);
    (api.activateLease as jest.Mock).mockResolvedValue({ status: "active" });
    const { getByText } = await render(<PortfolioWorkspace {...ownerProps} />);

    await fireEvent.press(getByText("Activate Lease (grants tenant access)"));

    expect(api.activateLease).toHaveBeenCalledWith(5);
  });

  test("terminate button calls api.terminateLease for an active lease", async () => {
    (api.getLeases as jest.Mock).mockResolvedValue([
      {
        id: 5,
        asset_name: "Ntinda Unit 1",
        status: "active",
        tenant_email: "demo.tenant@homebase.test",
        monthly_rent: "850000",
      },
    ]);
    (api.terminateLease as jest.Mock).mockResolvedValue({ status: "terminated" });
    const { getByText } = await render(<PortfolioWorkspace {...ownerProps} />);

    await fireEvent.press(getByText("Terminate Lease"));

    expect(api.terminateLease).toHaveBeenCalledWith(5);
  });

  test("push payment prompt initializes a mobile money transaction", async () => {
    (api.getLeases as jest.Mock).mockResolvedValue([
      {
        id: 5,
        asset_name: "Ntinda Unit 1",
        status: "active",
        tenant_email: "demo.tenant@homebase.test",
        monthly_rent: "850000",
      },
    ]);
    (api.initializePayment as jest.Mock).mockResolvedValue({});
    const { getByText } = await render(<PortfolioWorkspace {...ownerProps} />);

    await fireEvent.press(getByText("Push Mobile Money Prompt"));

    expect(api.initializePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 850000,
        currency: "UGX",
        payment_method: "mobile_money",
        transaction_type: "rent",
        asset_id: 1,
      }),
    );
  });
});

describe("<PortfolioWorkspace /> tenant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getLeases as jest.Mock).mockResolvedValue([]);
    (api.getRentPayments as jest.Mock).mockResolvedValue([]);
    (api.getMaintenanceRequests as jest.Mock).mockResolvedValue([]);
    (api.getUtilityReadings as jest.Mock).mockResolvedValue([]);
    (api.getReports as jest.Mock).mockResolvedValue([]);
    (api.getLedgerByAsset as jest.Mock).mockResolvedValue({
      entries: [],
      running_balance: 0,
      total_credit: 0,
    });
  });

  const tenantProps = { role: "TENANT", assetId: "1" };

  test("renders the lease statement with rent and pay action", async () => {
    (api.getLeases as jest.Mock).mockResolvedValue([
      {
        id: 9,
        asset_name: "Ntinda Unit 1",
        status: "active",
        tenant_email: "demo.tenant@homebase.test",
        monthly_rent: "850000",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
      },
    ]);
    const { getByText } = await render(
      <PortfolioWorkspace {...tenantProps} />,
    );

    getByText("My Rental Lease Statement");
    getByText("UGX 850,000");
    getByText(/Pay Rent via Mobile Money/);
    getByText("Lease Period: 2026-01-01 - 2026-12-31");
  });

  test("shows the empty state when there is no lease", async () => {
    const { getByText } = await render(<PortfolioWorkspace {...tenantProps} />);

    getByText(/No lease details are available yet/);
    expect(() => getByText("New Lease")).toThrow();
  });

  test("tenant logs a maintenance request through the modal", async () => {
    (api.getLeases as jest.Mock).mockResolvedValue([
      {
        id: 9,
        asset_name: "Ntinda Unit 1",
        status: "active",
        tenant_email: "demo.tenant@homebase.test",
        monthly_rent: "850000",
      },
    ]);
    mockCreateMaintenanceRequest.mockResolvedValue({});
    const { getByText, getByPlaceholderText } = await render(
      <PortfolioWorkspace {...tenantProps} />,
    );

    await fireEvent.press(getByText(/Log Maintenance Request/));
    await fireEvent.changeText(
      getByPlaceholderText("Title (e.g. Plumbing Leak)"),
      "Leaking tap",
    );
    await fireEvent.changeText(
      getByPlaceholderText("Describe the issue in detail..."),
      "Kitchen tap drips constantly.",
    );
    await fireEvent.press(getByText("Submit"));

    expect(mockCreateMaintenanceRequest).toHaveBeenCalledWith(
      "Leaking tap",
      "Kitchen tap drips constantly.",
    );
  });
});
