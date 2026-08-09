import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

const mockBack = jest.fn();
const mockAddToCart = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ categoryId: "1" }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
}));

jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: (props: any) => React.createElement(View, props),
  };
});

jest.mock("../services/api", () => ({
  api: {
    getCategories: jest.fn(),
    getServices: jest.fn(),
    getSubcategories: jest.fn(),
  },
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({
    cart: [],
    addToCart: mockAddToCart,
    removeFromCart: jest.fn(),
    cartTotal: 0,
    cartCount: 0,
  }),
}));

import CategoryDetailScreen from "../app/category/[categoryId]";
import { api } from "../services/api";

const getCategories = api.getCategories as jest.Mock;
const getServices = api.getServices as jest.Mock;
const getSubcategories = api.getSubcategories as jest.Mock;

const category = {
  id: 1,
  name: "Cleaning & Household",
  slug: "cleaning",
  icon: "sparkles",
  professionals_count: 2,
};

const subcategories = [
  { id: 10, name: "Deep Cleaning", icon: "sparkles", image_url: null },
  { id: 11, name: "Bathroom", icon: "water", image_url: "http://x/sub.jpeg" },
];

const services = [
  {
    id: 100,
    provider: 1,
    provider_email: "pro@homebase.com",
    provider_name: "Alex Kaba",
    category: 1,
    category_name: "Cleaning & Household",
    subcategory: 10,
    subcategory_name: "Deep Cleaning",
    name: "Cleaning Service",
    description: "Professional home cleaning",
    price: "65000.00",
    currency: "UGX",
    duration_minutes: 120,
    is_active: true,
    rating: 4.8,
    reviews_count: 12,
    created_at: "2026-01-01T00:00:00Z",
    images: [
      { id: 1, url: "http://x/a.jpeg", position: 0 },
      { id: 2, url: "http://x/b.jpeg", position: 1 },
      { id: 3, url: "http://x/c.jpeg", position: 2 },
    ],
  },
];

describe("<CategoryDetailScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCategories.mockResolvedValue([category]);
    getServices.mockResolvedValue(services);
    getSubcategories.mockResolvedValue(subcategories);
  });

  test("renders subcategory names from the API", async () => {
    const { getByText } = await render(<CategoryDetailScreen />);

    await waitFor(() => {
      getByText("Deep Cleaning");
      getByText("Bathroom");
    });
  });

  test("opens service detail modal with all images and dots", async () => {
    const { getByText, getAllByTestId } = await render(
      <CategoryDetailScreen />,
    );

    await waitFor(() => {
      getByText("Cleaning Service");
    });

    fireEvent.press(getByText("View details"));

    await waitFor(() => {
      getByText("What's included");
    });

    expect(getAllByTestId("modal-gallery-image").length).toBe(3);
    expect(getAllByTestId("modal-gallery-dot").length).toBe(3);
  });

  test("adds a service to cart from the modal", async () => {
    const { getByText } = await render(<CategoryDetailScreen />);

    await waitFor(() => {
      getByText("Cleaning Service");
    });

    fireEvent.press(getByText("View details"));

    await waitFor(() => {
      getByText("Add to Cart - UGX 65000");
    });

    fireEvent.press(getByText("Add to Cart - UGX 65000"));

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
  });
});
