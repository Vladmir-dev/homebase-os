import React, { createContext, useContext, useState } from 'react';
import { ServiceItem, CartItem } from '../types';

interface AppContextType {
  cart: CartItem[];
  addToCart: (service: ServiceItem) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  login: (username: string, password: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const addToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.service.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.service.id === serviceId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const clearCart = () => setCart([]);

  const login = (username: string, password: string) => {
    // Implement login logic here (e.g., API call)
    console.log('Logging in with', username, password);
    setIsAuthenticated(true); // Step 8: Sets isAuthenticated to true on successful login
  };
  
  const logout = () => {
    // Implement logout logic here (e.g., clear tokens, reset state)
    console.log('Logging out');
    setIsAuthenticated(false);
  };

  return (
    <AppContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount, login, logout, isAuthenticated }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};