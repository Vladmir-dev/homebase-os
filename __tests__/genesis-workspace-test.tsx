import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("../services/api", () => ({
  api: {
    getProjectPhases: jest.fn(),
    getSiteDiary: jest.fn(),
    getSiteCameras: jest.fn(),
    getMaterialDeliveries: jest.fn(),
    getLaborAttendance: jest.fn(),
    getConstructionBudget: jest.fn(),
    startProjectPhase: jest.fn(),
    reviewProjectPhase: jest.fn(),
    completeProjectPhase: jest.fn(),
    createSiteDiary: jest.fn(),
    createMaterialDelivery: jest.fn(),
    createLaborAttendance: jest.fn(),
    createReport: jest.fn(),
  },
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({
    activeAsset: { backendId: 5, name: "Ntinda Heights", type: "CONSTRUCTION" },
  }),
}));

import { api } from "../services/api";
import GenesisWorkspace from "../components/workspace/GenesisWorkspace";

const props = { role: "OWNER", assetId: "5" };

describe("<GenesisWorkspace />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getProjectPhases as jest.Mock).mockResolvedValue([]);
    (api.getSiteDiary as jest.Mock).mockResolvedValue([]);
    (api.getSiteCameras as jest.Mock).mockResolvedValue([]);
    (api.getMaterialDeliveries as jest.Mock).mockResolvedValue([]);
    (api.getLaborAttendance as jest.Mock).mockResolvedValue([]);
    (api.getConstructionBudget as jest.Mock).mockResolvedValue(null);
  });

  test("renders empty state when no phases are synced", async () => {
    const { getByText } = await render(<GenesisWorkspace {...props} />);

    getByText("Site Eye Network");
    getByText(/Gate Camera 01/);
    getByText("Structural Milestones (0)");
    getByText("No Structural Milestones Synced");
  });

  test("shows budget as ON TRACK with planned vs actual", async () => {
    (api.getConstructionBudget as jest.Mock).mockResolvedValue({
      budget_planned: 100000000,
      delivery_spend: 40000000,
      remaining: 60000000,
      percent_spent: 40,
      on_track: true,
      phases: [],
    });
    const { getByText } = await render(<GenesisWorkspace {...props} />);

    getByText("Budget vs Actual Spend");
    getByText("ON TRACK");
    getByText("Planned: UGX 100,000,000");
    getByText("Actual (deliveries): UGX 40,000,000");
    getByText(/Remaining: UGX 60,000,000/);
  });

  test("flags the budget as OVER BUDGET when off track", async () => {
    (api.getConstructionBudget as jest.Mock).mockResolvedValue({
      budget_planned: 100000000,
      delivery_spend: 110000000,
      remaining: -10000000,
      percent_spent: 110,
      on_track: false,
      phases: [],
    });
    const { getByText } = await render(<GenesisWorkspace {...props} />);

    getByText("OVER BUDGET");
  });

  test("moves a phase through start, review, and completion", async () => {
    const pending = { id: 1, name: "Foundation", status: "pending", planned_cost: 20000000 };
    const inProgress = { id: 1, name: "Foundation", status: "in_progress", planned_cost: 20000000 };
    const completed = { id: 1, name: "Foundation", status: "completed", planned_cost: 20000000 };
    (api.getProjectPhases as jest.Mock)
      .mockResolvedValueOnce([pending])
      .mockResolvedValueOnce([inProgress])
      .mockResolvedValueOnce([completed]);

    const { getByText, queryByText } = await render(<GenesisWorkspace {...props} />);

    getByText("Foundation");
    getByText("Structural milestone pending");
    await fireEvent.press(getByText("Start Phase"));
    expect(api.startProjectPhase).toHaveBeenCalledWith(1);

    await waitFor(() => getByText("In progress — awaiting engineer review"));
    await fireEvent.press(getByText("Request Engineer Review"));
    expect(api.reviewProjectPhase).toHaveBeenCalledWith(1);

    await waitFor(() => getByText("Verified and completed"));
    expect(api.completeProjectPhase).not.toHaveBeenCalled();
    expect(queryByText("Approve Completion")).toBeNull();
  });

  test("logs a site diary entry through the modal", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <GenesisWorkspace {...props} />,
    );

    await fireEvent.press(getByText("Log Site Diary"));
    getByText("Log Daily Site Diary");
    await fireEvent.changeText(
      getByPlaceholderText(/Enter site notes/),
      "Poured foundation slab",
    );
    await fireEvent.press(getByText("Save Log"));

    expect(api.createSiteDiary).toHaveBeenCalledWith({
      site: 5,
      entry_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      notes: "Poured foundation slab",
      weather: "Sunny / Dry",
      workers_count: 14,
    });
  });

  test("logs a material delivery with QR against the first phase", async () => {
    (api.getProjectPhases as jest.Mock).mockResolvedValue([
      { id: 1, name: "Foundation", status: "in_progress" },
    ]);
    const { getByText, getByPlaceholderText } = await render(
      <GenesisWorkspace {...props} />,
    );

    await fireEvent.press(getByText("Log Delivery QR"));
    getByText("Log Material Delivery");
    await fireEvent.changeText(getByPlaceholderText("qr code"), "QR-CEMENT-001");
    await fireEvent.press(getByText("Save Delivery"));

    expect(api.createMaterialDelivery).toHaveBeenCalledWith({
      phase: 1,
      item: "Cement",
      quantity: 20,
      unit: "bags",
      supplier: "Kampala Hardware",
      unit_cost: 36000,
      qr_code: "QR-CEMENT-001",
      boq_match: true,
    });
  });

  test("checks in a worker and generates the handover pack", async () => {
    const { getByText } = await render(<GenesisWorkspace {...props} />);

    await fireEvent.press(getByText("Worker Check-in"));
    expect(api.createLaborAttendance).toHaveBeenCalledWith(
      expect.objectContaining({
        site: 5,
        status: "present",
        hours_worked: 8,
        daily_wage: 35000,
      }),
    );

    await fireEvent.press(getByText("Handover Pack"));
    expect(api.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        asset_id: 5,
        report_type: "handover",
        title: "Digital Construction Handover Package",
      }),
    );
  });
});
