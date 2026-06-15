import React, { createContext, useContext, useState, useEffect } from "react";
import { ServiceItem, CartItem } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1. Define strict domain types for the multi-tenant architecture
export type AssetType = "HOUSEHOLD" | "RENTAL" | "CONSTRUCTION" | "ESTATE";
export type UserRole =
  | "OWNER"
  | "ELDER"
  | "TENANT"
  | "SITE_MANAGER"
  | "FOREMAN"
  | "GUARDIAN";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  role: UserRole;
  scopes: string[]; // RBAC array (e.g., ['read:ledger', 'write:milestone'])
  balance: number;
}

interface AppContextType {
  // Existing state fields
  cart: CartItem[];
  addToCart: (service: ServiceItem) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  login: (username: string, password: string) => void;
  logout: () => void;
  isAuthenticated: boolean;

  // NEW: Multi-Tenant Architecture additions
  activeAsset: Asset | null;
  assets: Asset[];
  setActiveAssetById: (assetId: string) => void;
  isOffline: boolean;
  hasScope: (requiredScope: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Existing states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // NEW: Architecture States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const STORAGE_KEY_ASSETS = "@homebase_os:cached_assets";
  const STORAGE_KEY_ACTIVE_ID = "@homebase_os:active_asset_id";

  // Simulating loading user assets upon authenticated state mutation
  useEffect(() => {
    const hydratePlatformData = async () => {
      if (isAuthenticated) {
        try {
          // Attempt reading structural payloads from local storage first
          const storedAssets = await AsyncStorage.getItem(STORAGE_KEY_ASSETS);
          const storedActiveId = await AsyncStorage.getItem(
            STORAGE_KEY_ACTIVE_ID,
          );

          if (storedAssets) {
            const parsed = JSON.parse(storedAssets);
            setAssets(parsed);
            if (storedActiveId) {
              setActiveAsset(
                parsed.find((a: Asset) => a.id === storedActiveId) || parsed[0],
              );
            } else {
              setActiveAsset(parsed[0]);
            }
          } else {
            // Fallback Default data load if first launch setup configuration parameters are blank
            const fallbackAssets: Asset[] = [
              {
                id: "asset-1",
                name: "Kansanga Heights",
                type: "HOUSEHOLD",
                role: "OWNER",
                scopes: ["*"],
                balance: 1420000,
              },
              {
                id: "asset-2",
                name: "Ntinda Unit 2",
                type: "RENTAL",
                role: "TENANT",
                scopes: [
                  "read:lease",
                  "create:maintenance_req",
                  "write:rent_payment",
                ],
                balance: 0,
              },
              {
                id: "asset-3",
                name: "Mukono Site",
                type: "CONSTRUCTION",
                role: "OWNER",
                scopes: [
                  "read:site_data",
                  "write:milestone",
                  "approve:payment",
                ],
                balance: 8500000,
              },
            ];
            setAssets(fallbackAssets);
            setActiveAsset(fallbackAssets[0]);

            // Flash write payloads directly to disk storage layers asynchronously
            await AsyncStorage.setItem(
              STORAGE_KEY_ASSETS,
              JSON.stringify(fallbackAssets),
            );
            await AsyncStorage.setItem(
              STORAGE_KEY_ACTIVE_ID,
              fallbackAssets[0].id,
            );
          }
        } catch (error) {
          console.error("Failed reading data from storage engines:", error);
        }
      } else {
        setAssets([]);
        setActiveAsset(null);
      }
    };

    hydratePlatformData();
  }, [isAuthenticated]);

  // Existing implementation methods
  const addToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.service.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.service.id === serviceId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.service.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const login = (username: string, password: string) => {
    console.log("Logging in with", username, password);
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log("Logging out");
    setIsAuthenticated(false);
    clearCart();
  };

  // NEW: Architecture Mutation Methods
  const setActiveAssetById = async (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (target) {
      setActiveAsset(target);
      clearCart(); // Clear contextual cart when switching properties to prevent data leak leaks
      try {
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ID, assetId);
      } catch (e) {
        console.warn(
          "Failed tracking active application scope mutation preference persistent keys:",
          e,
        );
      }
    }
  };

  const hasScope = (requiredScope: string): boolean => {
    if (!activeAsset) return false;
    if (activeAsset.scopes.includes("*")) return true; // Owner wildcard access bypass
    return activeAsset.scopes.includes(requiredScope);
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        login,
        logout,
        isAuthenticated,
        // New Exposures
        activeAsset,
        assets,
        setActiveAssetById,
        isOffline,
        hasScope,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
