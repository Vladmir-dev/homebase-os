import { ServiceCategory, ServiceSubCategory, ServiceItem } from '../types';

export const MOCK_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-elec',
    name: 'Electrician',
    bannerImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600',
    rating: 4.8,
    totalBookings: '2.3 M bookings',
    hasOffers: true,
  },
  {
    id: 'cat-massage',
    name: 'Massage for Men',
    bannerImage: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=600',
    rating: 4.9,
    totalBookings: '1.2 M bookings',
  }
];

export const MOCK_SUBCATEGORIES: ServiceSubCategory[] = [
  { id: 'sub-socket', categoryId: 'cat-elec', name: 'Switch & socket', icon: 'power' },
  { id: 'sub-fan', categoryId: 'cat-elec', name: 'Fan', icon: 'wind' },
  { id: 'sub-wiring', categoryId: 'cat-elec', name: 'Wiring', icon: 'git-commit' },
];

export const MOCK_SERVICES: ServiceItem[] = [
  {
    id: 'srv-inv-uninstall',
    subCategoryId: 'sub-socket',
    name: 'Inverter uninstallation',
    rating: 4.8,
    reviewsCount: '(2.4K reviews)',
    price: 149,
    durationMinutes: 30,
    descriptionPoints: [
      'Disconnection of inverter & batteries safely',
      'Insulation of open wires to prevent short circuits',
      'Please ensure alternative power setup is ready if needed'
    ],
    image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=300',
  }
];