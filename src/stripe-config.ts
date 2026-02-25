export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1T4Wn3GxPMnASKqeGwljD55X',
    name: 'TrueBalance',
    description: 'Begin unlocking financial security like never before!',
    mode: 'subscription',
    price: 9.99,
    currency: 'usd'
  }
];