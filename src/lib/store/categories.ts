import tshirt from '@/assets/tshirt.jpg';
import graphic from '@/assets/graphic.jpg';
import shirt from '@/assets/shirt.jpg';
import jeans from '@/assets/jeans.jpg';
import track from '@/assets/track.jpg';
import shoes from '@/assets/shoes.jpg';
import belt from '@/assets/belt.jpg';
import type { Category } from './types';
// Initial categories. Will be loaded from the database once connected (editable in admin).
export const categories: Category[] = [
  { name: 'T-Shirts', image: tshirt },
  { name: 'Shirts', image: shirt },
  { name: 'Jeans & Trousers', image: jeans },
  { name: 'Lower / Track Pants', image: track },
  { name: 'Shoes', image: shoes },
  { name: 'Belts', image: belt },
];
// "New Arrivals" is driven by each product's newArrival flag, not a fixed product category.
export const NEW_ARRIVALS = 'New Arrivals';
export const newArrivalsCategory: Category = { name: NEW_ARRIVALS, image: graphic, virtual: true };
export const placeholderImages = { tshirt, graphic, shirt, jeans, track, shoes, belt };
