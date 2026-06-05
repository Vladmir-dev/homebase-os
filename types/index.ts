export interface ServiceCategory {
  id: string;
  name: string;
  bannerImage: string;
  rating: number;
  totalBookings: string;
  hasOffers?: boolean;
}

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  icon: string; // We will map these to Lucide or Expo Vector Icons
}

export interface ServiceItem {
  id: string;
  subCategoryId: string;
  name: string;
  rating: number;
  reviewsCount: string;
  price: number;
  durationMinutes: number;
  descriptionPoints: string[];
  image: string;
}

export interface CartItem {
  service: ServiceItem;
  quantity: number;
}