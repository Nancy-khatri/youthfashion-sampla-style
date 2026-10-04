import { placeholderImages as img } from './categories';
import type { Product } from './types';
// DEMO ONLY — sample items for testing the layout. Delete this file's rows once real products are loaded.
const rows: [string, string, string, number, string, string, string[], string, boolean, boolean][] = [
  ['black-printed-tshirt', 'Black Printed T-Shirt', 'T-Shirts', 499, img.tshirt, 'Black', ['S', 'M', 'L', 'XL'], 'Casual', true, false],
  ['oversized-graphic-tshirt', 'Oversized Graphic T-Shirt', 'T-Shirts', 599, img.graphic, 'Charcoal', ['S', 'M', 'L', 'XL'], 'Street Style', true, true],
  ['premium-casual-shirt', 'Premium Casual Shirt', 'Shirts', 899, img.shirt, 'Off-white', ['S', 'M', 'L', 'XL'], 'Smart Casual', true, false],
  ['mens-casual-shoes', 'Men’s Casual Shoes', 'Shoes', 1499, img.shoes, 'Off-white', ['7', '8', '9', '10'], 'Everyday', true, true],
  ['relaxed-fit-jeans', 'Relaxed Fit Jeans', 'Jeans & Trousers', 1199, img.jeans, 'Blue', ['28', '30', '32', '34'], 'Everyday', false, true],
  ['essential-track-pants', 'Essential Track Pants', 'Lower / Track Pants', 699, img.track, 'Charcoal', ['S', 'M', 'L', 'XL'], 'Casual', false, true],
  ['classic-leather-belt', 'Classic Leather Belt', 'Belts', 399, img.belt, 'Black', ['30', '32', '34', '36'], 'Smart Casual', false, false],
];
export const demoProducts: Product[] = rows.map(([id, name, category, price, image, color, sizes, tag, featured, newArrival], i) => {
  const date = `2026-10-0${7 - i}`;
  return { id, name, category, price, images: [image], colors: [color], sizes, tags: [tag], description: 'Demo product — real description, fabric and measurements will be added with the real collection.', stock: 10, sku: `DEMO-YF-${i + 1}`, brand: 'Youth Fashion', featured, newArrival, active: true, isDemo: true, createdAt: date, updatedAt: date };
});
