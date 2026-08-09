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
  images: string[];
}

export interface CartItem {
  service: ServiceItem;
  quantity: number;
}
