import { Button } from '../ui/Button';
import { stripeService } from '../../lib/stripe';
import type { StripeProduct } from '../../stripe-config';

export interface PricingCardProps {
  product: StripeProduct;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

export function PricingCard({ product, isAuthenticated, onAuthRequired }: PricingCardProps) {
  const container = document.createElement('div');
  container.className = 'bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow';
  
  let loading = false;
  
  function render() {
    container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.className = 'text-xl font-bold text-gray-800 mb-2';
    title.textContent = product.name;
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'text-gray-600 mb-4';
    description.textContent = product.description;
    container.appendChild(description);
    
    const priceContainer = document.createElement('div');
    priceContainer.className = 'mb-6';
    
    const price = document.createElement('div');
    price.className = 'text-3xl font-bold text-gray-800';
    price.textContent = `$${product.price}`;
    
    const period = document.createElement('span');
    period.className = 'text-lg text-gray-600 ml-1';
    period.textContent = product.mode === 'subscription' ? '/month' : '';
    
    price.appendChild(period);
    priceContainer.appendChild(price);
    container.appendChild(priceContainer);
    
    const button = Button({
      loading,
      disabled: loading,
      className: 'w-full',
      children: loading ? 'Processing...' : `Get ${product.name}`,
      onClick: handlePurchase
    });
    
    container.appendChild(button);
  }
  
  async function handlePurchase() {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    
    if (loading) return;
    
    loading = true;
    render();
    
    try {
      const { url } = await stripeService.createCheckoutSession(product.priceId, product.mode);
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      loading = false;
      render();
    }
  }
  
  render();
  return container;
}