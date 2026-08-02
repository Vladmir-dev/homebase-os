import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("../services/api", () => ({
  api: {
    getMedicines: jest.fn(),
    getDoctors: jest.fn(),
    getHealthBookings: jest.fn(),
    discoverPharmacies: jest.fn(),
    getPrescriptions: jest.fn(),
    getAmbulanceDispatches: jest.fn(),
    triageSymptoms: jest.fn(),
    createHealthBooking: jest.fn(),
    cancelHealthBooking: jest.fn(),
    requestAmbulance: jest.fn(),
  },
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({
    activeAsset: { backendId: 1, name: "Home Base", location: "Ntinda, Kampala" },
    userProfile: { id: 7, email: "demo.owner@homebase.test" },
  }),
}));

import { api } from "../services/api";
import HealthServicesScreen from "../app/health-services";

describe("<HealthServicesScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getMedicines as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: "Paracetamol",
        price: 5000,
        pharmacy: 3,
        pharmacy_name: "City Chemist",
        quantity: 20,
      },
    ]);
    (api.getDoctors as jest.Mock).mockResolvedValue([
      {
        id: 1,
        user_name: "Dr. Sarah Nabirye",
        specialization: "General Medicine",
        consultation_fee: 50000,
        available: true,
      },
    ]);
    (api.getHealthBookings as jest.Mock).mockResolvedValue([
      { id: 1, booking_type: "consultation", status: "pending" },
    ]);
    (api.discoverPharmacies as jest.Mock).mockResolvedValue({
      results: [
        {
          id: 1,
          name: "City Chemist",
          location: "Kampala Rd",
          phone_number: "+256700000099",
          medicine_count: 120,
          stock_level: 40,
          operating_hours: "8AM-9PM",
        },
      ],
    });
    (api.getPrescriptions as jest.Mock).mockResolvedValue([
      { id: 1, medicines: [{ name: "Cough syrup" }], notes: "Take twice daily" },
    ]);
    (api.getAmbulanceDispatches as jest.Mock).mockResolvedValue([]);
  });

  test("runs a triage check and shows the result summary", async () => {
    (api.triageSymptoms as jest.Mock).mockResolvedValue({
      severity: "medium",
      risk_score: 42,
      summary: "Likely a viral infection.",
      results: [
        {
          symptom: "fever",
          severity: "medium",
          recommendation: "Rest and hydrate.",
        },
      ],
      providers: ["kampala_hospital"],
    });
    const { getByText, getAllByText } = await render(<HealthServicesScreen />);

    getByText("Health Services");
    getByText("LOW");

    await fireEvent.press(getByText("Run Triage Check"));

    await waitFor(() => {
      expect(api.triageSymptoms).toHaveBeenCalledWith({ symptoms: ["fever"] });
      getByText("MEDIUM");
      getByText("Risk score 42/100");
      getByText("Likely a viral infection.");
      getByText("kampala hospital");
      getByText("Rest and hydrate.");
    });
    getAllByText("medium");
  });

  test("shows emergency dispatch button and requests ambulance", async () => {
    (api.triageSymptoms as jest.Mock).mockResolvedValue({
      severity: "emergency",
      risk_score: 95,
      summary: "Critical signs detected.",
      results: [{ symptom: "chest_pain", severity: "emergency", recommendation: "Seek urgent care." }],
    });
    const { getByText } = await render(<HealthServicesScreen />);

    await fireEvent.press(getByText("Run Triage Check"));
    await fireEvent.press(getByText("Dispatch Ambulance Now"));

    expect(api.requestAmbulance).toHaveBeenCalledWith(
      expect.objectContaining({ location: "Ntinda, Kampala" }),
    );
  });

  test("orders medicine delivery from the pharmacy panel", async () => {
    const { getByText } = await render(<HealthServicesScreen />);

    await fireEvent.press(getByText("Meds"));
    getByText("Nearby Pharmacies (1)");
    getByText("City Chemist");
    getByText("Available Medicines (1)");
    getByText("UGX 5,000");

    await fireEvent.press(getByText("Request Delivery"));

    expect(api.createHealthBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        pharmacy: 3,
        booking_type: "prescription",
        notes: "Medicine delivery request: Paracetamol",
      }),
    );
  });

  test("books a doctor ticket and cancels a pending booking", async () => {
    const { getByText } = await render(<HealthServicesScreen />);

    await fireEvent.press(getByText("Doctor"));
    getByText("Dr. Sarah Nabirye");
    getByText("Available");
    getByText(/General Medicine/);
    getByText("My Tickets (1)");
    getByText(/Ticket HBH-1/);

    await fireEvent.press(getByText("Book QR Ticket"));
    expect(api.createHealthBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        doctor: 1,
        booking_type: "consultation",
        scheduled_time: expect.any(String),
      }),
    );

    await fireEvent.press(getByText("Cancel"));
    expect(api.cancelHealthBooking).toHaveBeenCalledWith(1);
  });

  test("requests an ambulance from the SOS panel", async () => {
    (api.getAmbulanceDispatches as jest.Mock).mockResolvedValue([
      { id: 2, status: "en_route", location: "Ntinda", estimated_arrival: "2026-08-02T12:00:00Z" },
    ]);
    const { getByText } = await render(<HealthServicesScreen />);

    await fireEvent.press(getByText("SOS"));
    getByText("Emergency Dispatch");
    getByText("Active Dispatches (1)");
    getByText("en_route");

    await fireEvent.press(getByText("Request Ambulance SOS"));
    expect(api.requestAmbulance).toHaveBeenCalledWith(
      expect.objectContaining({
        location: "Ntinda, Kampala",
        notes: "Emergency request from demo.owner@homebase.test",
      }),
    );
  });
});
