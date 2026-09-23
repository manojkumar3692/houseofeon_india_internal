import type { Metadata } from 'next';
import NegotiatedCheckout from './view';
export const metadata: Metadata = { title: 'Your agreed offer | House of EON', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <NegotiatedCheckout id={(await params).id} />;
}
