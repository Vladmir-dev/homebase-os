import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockAddToCart = jest.fn();
const mockRemoveFromCart = jest.fn();
const mockClearCart = jest.fn();
const mockProcessCheckoutPayment = jest.fn();
const mockRefreshAssetBalances = jest.fn();

let mockCart: any[] = [];
let mockCartTotal = 0;
let mockServiceFee = 0;
let mockGrandTotal = 0;

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

jest.mock("../services/api", () => ({
  api: {
    checkPaymentStatus: jest.fn(),
  },
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({
    cart: mockCart,
    cartTotal: mockCartTotal,
    serviceFee: mockServiceFee,
    grandTotal: mockGrandTotal,
    escrowFeeRate: 5,
    clearCart: mockClearCart,
    processCheckoutPayment: mockProcessCheckoutPayment,
    refreshAssetBalances: mockRefreshAssetBalances,
    addToCart: mockAddToCart,
    removeFromCart: mockRemoveFromCart,
    userProfile: {
      phone_number: "+256700111222",
      email: "demo.owner@homebase.test",
    },
  }),
}));

import { api } from "../services/api";
import CartScreen from "../app/(tabs)/cart";
import CheckoutScreen from "../app/checkout";

const cleaning = { id: 1, name: "Cleaning", price: 10000, image: "" };

describe("<CartScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCart = [];
    mockCartTotal = 0;
  });

  test("shows the empty state and offers browsing", async () => {
    const { getByText } = await render(<CartScreen />);

    getByText("Your cart is empty");
    await fireEvent.press(getByText("Browse Services"));
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  test("lists cart items with totals and quantity controls", async () => {
    mockCart = [{ service: cleaning, quantity: 2 }];
    mockCartTotal = 20000;
    const { getByText, getAllByText } = await render(<CartScreen />);

    getByText("Cleaning");
    getByText("UGX 10000");
    getAllByText("2");

    await fireEvent.press(getAllByText("+")[0]);
    expect(mockAddToCart).toHaveBeenCalledWith(cleaning);

    await fireEvent.press(getAllByText("-")[0]);
    expect(mockRemoveFromCart).toHaveBeenCalledWith(1);

    await fireEvent.press(getByText("Proceed to Checkout"));
    expect(mockPush).toHaveBeenCalledWith("/checkout");
  });
});

describe("<CheckoutScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCart = [{ service: cleaning, quantity: 2 }];
    mockCartTotal = 20000;
    mockServiceFee = 1000;
    mockGrandTotal = 21000;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders the order summary and totals", async () => {
    const { getByText, getAllByText, getByDisplayValue } = await render(<CheckoutScreen />);

    getByText("Order Summary (1 items)");
    getByText("Cleaning");
    expect(getAllByText("UGX 20,000")).toHaveLength(2);
    getByText("UGX 1,000");
    getByText("UGX 21,000");
    getByText("Confirm & Pay UGX 21,000");
    getByDisplayValue("+256700111222");
    getByText("demo.owner@homebase.test");
  });

  test("requires a mobile money phone number before ordering", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText, getByDisplayValue } = await render(<CheckoutScreen />);

    await fireEvent.changeText(getByDisplayValue("+256700111222"), "");
    await fireEvent.press(getByText(/Confirm & Pay/));

    expect(alertSpy).toHaveBeenCalledWith(
      "Phone Required",
      expect.stringContaining("Mobile Money"),
    );
    expect(mockProcessCheckoutPayment).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test("shows the pending payment modal after placing the order", async () => {
    mockProcessCheckoutPayment.mockResolvedValue({
      payment_id: 42,
      next_action: {
        payment_instruction: { note: "Prompt sent to +256700111222." },
      },
    });
    const { getByText } = await render(<CheckoutScreen />);

    await fireEvent.press(getByText(/Confirm & Pay/));

    expect(mockProcessCheckoutPayment).toHaveBeenCalledWith("+256700111222");
    getByText("Payment Processing");
    getByText("Prompt sent to +256700111222.");
  });

  test("confirms a successful payment via polling and clears the cart", async () => {
    jest.useFakeTimers();
    mockProcessCheckoutPayment.mockResolvedValue({
      payment_id: 42,
      next_action: {},
    });
    (api.checkPaymentStatus as jest.Mock).mockResolvedValue({
      status: "successful",
    });
    const { getByText } = await render(<CheckoutScreen />);

    await fireEvent.press(getByText(/Confirm & Pay/));

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(api.checkPaymentStatus).toHaveBeenCalledWith(42);
    getByText("Payment Confirmed & Escrowed");
    expect(mockRefreshAssetBalances).toHaveBeenCalled();

    await fireEvent.press(getByText("Return to Dashboard"));
    expect(mockClearCart).toHaveBeenCalled();
  });

  test("shows a failed payment and offers retry", async () => {
    jest.useFakeTimers();
    mockProcessCheckoutPayment.mockResolvedValue({
      payment_id: 43,
      next_action: {},
    });
    (api.checkPaymentStatus as jest.Mock).mockResolvedValue({
      status: "failed",
    });
    const { getByText, queryByText } = await render(<CheckoutScreen />);

    await fireEvent.press(getByText(/Confirm & Pay/));

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    getByText("Payment Not Completed");
    getByText("Try Again");

    await fireEvent.press(getByText("Try Again"));
    expect(queryByText("Payment Not Completed")).toBeNull();
  });

  test("handles a payment initialization error", async () => {
    mockProcessCheckoutPayment.mockRejectedValue(new Error("network"));
    const { getByText } = await render(<CheckoutScreen />);

    await fireEvent.press(getByText(/Confirm & Pay/));

    getByText("Payment Not Completed");
    getByText(/Payment request recorded/);
  });
});
