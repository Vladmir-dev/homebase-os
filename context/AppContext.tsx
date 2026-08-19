import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { CartItem, ServiceItem } from "../types";

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
  backendId?: number;
  name: string;
  type: AssetType;
  role: UserRole;
  scopes: string[]; // RBAC array (e.g., ['read:ledger', 'write:milestone'])
  balance: number;
  location?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  reliability_score?: number;
  reliability_strikes?: number;
  reliability_band?: string;
  is_verified?: boolean;
}

interface AppContextType {
  // Existing state fields
  cart: CartItem[];
  addToCart: (service: ServiceItem) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Auth API state & actions
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;

  // Multi-Tenant Architecture & Data
  activeAsset: Asset | null;
  assets: Asset[];
  setActiveAssetById: (assetId: string) => void;
  refreshAssets: () => Promise<void>;
  createAsset: (
    name: string,
    assetType: string,
    location?: string,
    payload?: Record<string, unknown>,
  ) => Promise<any>;
  isOffline: boolean;
  hasScope: (requiredScope: string) => boolean;

  // Backend Quick Action Helpers
  createMaintenanceRequest: (
    title: string,
    description: string,
    priority?: "low" | "medium" | "high" | "emergency",
  ) => Promise<any>;
  createBookingOrder: (
    service: ServiceItem,
    description?: string,
  ) => Promise<any>;
  processCheckoutPayment: (phone: string, method?: string) => Promise<any>;

  // Escrow & ledger
  escrowFeeRate: number;
  serviceFee: number;
  grandTotal: number;
  refreshAssetBalances: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Architecture States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Escrow terms, sourced from the backend config endpoint (default 5%).
  const [escrowFeeRate, setEscrowFeeRate] = useState(5);

  const STORAGE_KEY_ASSETS = "@homebase_os:cached_assets";
  const STORAGE_KEY_ACTIVE_ID = "@homebase_os:active_asset_id";

  const clearAssetSession = async () => {
    setAssets([]);
    setActiveAsset(null);
    await AsyncStorage.removeItem(STORAGE_KEY_ASSETS);
    await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
  };

  // Check stored auth session on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      await api.init();
      const token = api.getAccessToken();
      if (token) {
        try {
          const profile = await api.getProfile();
          setUserProfile(profile);
          setIsAuthenticated(true);
        } catch (e) {
          console.warn("Stored auth token validation failed:", e);
          setIsAuthenticated(false);
        }
      }
    };
    checkAuthStatus();
  }, []);

  // Fetch real platform assets whenever authenticated state changes
  const fetchAssetsFromBackend = async () => {
    if (!isAuthenticated) {
      await clearAssetSession();
      return;
    }

    try {
      const rawAssets = await api.getAssets();
      setIsOffline(false);

      if (Array.isArray(rawAssets) && rawAssets.length > 0) {
        const mappedAssets: Asset[] = rawAssets.map((raw: any) => {
          let assetType: AssetType = "HOUSEHOLD";
          if (raw.asset_type === "rental_unit") assetType = "RENTAL";
          else if (raw.asset_type === "construction_site")
            assetType = "CONSTRUCTION";
          else if (raw.asset_type === "estate") assetType = "ESTATE";

          return {
            id: `asset-${raw.id}`,
            backendId: raw.id,
            name: raw.name,
            type: assetType,
            role:
              raw.my_role === "owner"
                ? "OWNER"
                : (raw.my_role || "tenant").toUpperCase(),
            scopes:
              Array.isArray(raw.scopes) && raw.scopes.length
                ? raw.scopes
                : ["*"],
            balance: 0,
            location: raw.location || "",
          };
        });

        setAssets(mappedAssets);
        await AsyncStorage.setItem(
          STORAGE_KEY_ASSETS,
          JSON.stringify(mappedAssets),
        );

        await refreshAssetBalances(mappedAssets);

        const storedActiveId = await AsyncStorage.getItem(
          STORAGE_KEY_ACTIVE_ID,
        );
        const match =
          mappedAssets.find((a) => a.id === storedActiveId) || mappedAssets[0];
        setActiveAsset(match);
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ID, match.id);
        return;
      }

      if (Array.isArray(rawAssets)) {
        await clearAssetSession();
        return;
      }
    } catch (error) {
      console.warn("Backend assets fetch failed:", error);
      setIsOffline(true);

      // Offline-first: restore the last-known cached asset session.
      try {
        const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY_ASSETS);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached) && cached.length > 0) {
            setAssets(cached);
            const storedActiveId = await AsyncStorage.getItem(
              STORAGE_KEY_ACTIVE_ID,
            );
            const match =
              cached.find((a) => a.id === storedActiveId) || cached[0];
            setActiveAsset(match);
            return;
          }
        }
      } catch (cacheError) {
        console.warn("Cached assets restore failed:", cacheError);
      }

      setAssets([]);
      setActiveAsset(null);
      return;
    }
  };

  // Pull real per-asset ledger balances from the backend and merge them into
  // the asset list. Falls back to the last-known cached balance when the
  // ledger API is unreachable (offline).
  const refreshAssetBalances = async (assetList: Asset[] = assets) => {
    if (!assetList.length) return;
    let updated = assetList;
    try {
      const withBalances = await Promise.all(
        assetList.map(async (asset) => {
          if (!asset.backendId) return asset;
          try {
            const ledger = await api.getLedgerByAsset(asset.backendId);
            const balance = Number(ledger.running_balance ?? 0);
            return Number.isFinite(balance) ? { ...asset, balance } : asset;
          } catch (e) {
            return asset;
          }
        }),
      );
      updated = withBalances;
      setAssets(withBalances);
      setActiveAsset((current) =>
        current
          ? withBalances.find((a) => a.id === current.id) || current
          : current,
      );
      await AsyncStorage.setItem(
        STORAGE_KEY_ASSETS,
        JSON.stringify(withBalances),
      );
    } catch (error) {
      console.warn("Ledger balance fetch failed:", error);
      return;
    }
  };

  useEffect(() => {
    fetchAssetsFromBackend();
  }, [isAuthenticated]);

  // Pull the platform escrow terms from the backend config endpoint.
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const config = await api.getEscrowConfig();
        if (typeof config?.fee_rate === "number") {
          setEscrowFeeRate(config.fee_rate);
        }
      } catch (e) {
        console.warn("Escrow config fetch failed:", e);
      }
    })();
  }, [isAuthenticated]);

  // Cart operations
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

  // Real Auth Actions
  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      if (data.user) {
        setUserProfile(data.user);
      }
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      console.error("Login failed:", error);
      return { success: false, error: error.message || "Invalid credentials" };
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string = "",
  ) => {
    try {
      await api.register(email, password, firstName, lastName);
      await api.clearTokens();
      await clearAssetSession();
      setUserProfile(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error: any) {
      console.error("Registration failed:", error);
      return { success: false, error: error.message || "Registration failed" };
    }
  };

  const logout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setUserProfile(null);
    await clearAssetSession();
    clearCart();
  };

  const createAsset = async (
    name: string,
    assetType: string,
    location?: string,
    payload: Record<string, unknown> = {},
  ) => {
    const requestPayload = {
      name,
      asset_type: assetType,
      location: location || "",
      ...payload,
    };
    const result = await api.createAsset(requestPayload);
    await fetchAssetsFromBackend();
    return result;
  };

  const setActiveAssetById = async (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (target) {
      setActiveAsset(target);
      clearCart();
      try {
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ID, assetId);
      } catch (e) {
        console.warn("Failed tracking active asset ID:", e);
      }
    }
  };

  const hasScope = (requiredScope: string): boolean => {
    if (!activeAsset) return false;
    if (activeAsset.scopes.includes("*")) return true;
    return activeAsset.scopes.includes(requiredScope);
  };

  // Helper actions
  const createMaintenanceRequest = async (
    title: string,
    description: string,
    priority: "low" | "medium" | "high" | "emergency" = "medium",
  ) => {
    if (!activeAsset?.backendId) throw new Error("No active asset selected");
    return api.createMaintenanceRequest({
      asset_id: activeAsset.backendId,
      title,
      description,
      priority,
    });
  };

  const createBookingOrder = async (
    service: ServiceItem,
    description?: string,
  ) => {
    return api.createBooking({
      price: service.price,
      description:
        description || service.descriptionPoints?.join(", ") || service.name,
      asset_id: activeAsset?.backendId,
    });
  };

  const processCheckoutPayment = async (
    phone: string,
    method: string = "mobile_money",
  ) => {
    const paymentRes = await api.initializePayment({
      amount: cartTotal,
      currency: "UGX",
      payment_method: method,
      phone_number: phone,
      description: `Homebase OS Cart Purchase (${cartCount} items)`,
      asset_id: activeAsset?.backendId,
      transaction_type: "service",
    });

    return paymentRes;
  };

  // Escrow fee & grand total derived from the backend fee rate (default 5%).
  const serviceFee = Math.round(cartTotal * (escrowFeeRate / 100));
  const grandTotal = cartTotal + serviceFee;

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
        register,
        logout,
        isAuthenticated,
        userProfile,
        activeAsset,
        assets,
        setActiveAssetById,
        refreshAssets: fetchAssetsFromBackend,
        createAsset,
        isOffline,
        hasScope,
        createMaintenanceRequest,
        createBookingOrder,
        processCheckoutPayment,
        escrowFeeRate,
        serviceFee,
        grandTotal,
        refreshAssetBalances,
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
