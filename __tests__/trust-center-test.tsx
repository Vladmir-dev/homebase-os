import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("../services/api", () => ({
  api: {
    getTrustSummary: jest.fn(),
  },
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({
    activeAsset: { backendId: 1, name: "Home Base", type: "HOUSEHOLD" },
  }),
}));

import { api } from "../services/api";
import TrustCenterScreen from "../app/trust-center";

const strongSummary = {
  trust_score: 88,
  trust_band: "strong",
  user: { reliability_score: 76, reliability_band: "good", unresolved_strikes: 0 },
  asset: {
    name: "Home Base",
    total_evidence: 14,
    verified_evidence: 14,
    chain_valid: true,
  },
  strikes: [],
};

describe("<TrustCenterScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getTrustSummary as jest.Mock).mockResolvedValue(strongSummary);
  });

  test("renders a strong trust score and clean record", async () => {
    const { getByText } = await render(<TrustCenterScreen />);

    await waitFor(() => getByText("Platform Trust Score"));
    expect(api.getTrustSummary).toHaveBeenCalledWith(1);

    getByText("Trust Center");
    getByText(/88/);
    getByText("STRONG");
    getByText("76/100");
    getByText("good");
    getByText("Intact");
    getByText("No open strikes. Your record is clean.");
    getByText("Refresh Trust Summary");
  });

  test("flags a broken hash chain and lists open strikes", async () => {
    (api.getTrustSummary as jest.Mock).mockResolvedValue({
      trust_score: 41,
      trust_band: "building",
      user: { reliability_score: 45, reliability_band: "building", unresolved_strikes: 2 },
      asset: {
        name: "Home Base",
        total_evidence: 9,
        verified_evidence: 7,
        chain_valid: false,
        broken_evidence_id: 3,
      },
      strikes: [
        { id: 1, severity: "high", created_at: "2026-07-28T10:00:00Z", reason: "Missed rent payment" },
      ],
    });
    const { getByText } = await render(<TrustCenterScreen />);

    await waitFor(() => getByText("BUILDING"));
    getByText("Broken");
    getByText(/Record #3 failed hash linkage/);
    getByText("Open Strikes");
    getByText("Missed rent payment");
  });

  test("refresh re-fetches the summary", async () => {
    const { getByText } = await render(<TrustCenterScreen />);
    await waitFor(() => getByText("Platform Trust Score"));

    await fireEvent.press(getByText("Refresh Trust Summary"));

    expect(api.getTrustSummary).toHaveBeenCalledTimes(2);
  });
});
