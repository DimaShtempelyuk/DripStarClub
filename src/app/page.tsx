import { getAllProducts } from '@/lib/shopify';
import MagazineHome from '@/components/MagazineHome';

export const revalidate = 60;

export default async function HomePage() {
  const products = await getAllProducts();
  return <MagazineHome products={products} />;
}
