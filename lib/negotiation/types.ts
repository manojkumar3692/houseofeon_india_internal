export type Cart = {
  currency: string;
  lines: [{ productId: string; variantId: string; quantity: number }];
  promotionCodes: string[];
  paymentMethod: 'prepaid' | 'partial_cod' | 'cod';
  destination: { country: string; postalCode: string } | null;
};
export type Quote = {
  id: string; cart: Cart; amountMinor: number; shippingMinor: number;
  currency: string; expiresAt: string; contextRevision: string;
};
