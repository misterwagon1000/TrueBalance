import { stripeService } from '../../lib/stripe';
import { stripeProducts } from '../../stripe-config';
import type { SubscriptionData } from '../../lib/stripe';

export function SubscriptionStatus() {
  const container = document.createElement('div');
  container.className = 'bg-white rounded-lg shadow-md p-6 border border-gray-200';
  
  let subscription: SubscriptionData | null = null;
  let loading = true;
  
  async function loadSubscription() {
    try {
      subscription = await stripeService.getUserSubscription();
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      loading = false;
      render();
    }
  }
  
  function render() {
    container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-800 mb-4';
    title.textContent = 'Subscription Status';
    container.appendChild(title);
    
    if (loading) {
      const loadingText = document.createElement('p');
      loadingText.className = 'text-gray-600';
      loadingText.textContent = 'Loading subscription status...';
      container.appendChild(loadingText);
      return;
    }
    
    if (!subscription || subscription.subscription_status === 'not_started') {
      const noSubscription = document.createElement('p');
      noSubscription.className = 'text-gray-600';
      noSubscription.textContent = 'No active subscription';
      container.appendChild(noSubscription);
      return;
    }
    
    const product = stripeProducts.find(p => p.priceId === subscription.price_id);
    
    if (product) {
      const productName = document.createElement('div');
      productName.className = 'flex items-center justify-between mb-2';
      
      const name = document.createElement('span');
      name.className = 'font-medium text-gray-800';
      name.textContent = product.name;
      
      const status = document.createElement('span');
      status.className = getStatusClass(subscription.subscription_status);
      status.textContent = formatStatus(subscription.subscription_status);
      
      productName.appendChild(name);
      productName.appendChild(status);
      container.appendChild(productName);
    }
    
    if (subscription.current_period_end) {
      const periodEnd = document.createElement('p');
      periodEnd.className = 'text-sm text-gray-600';
      const endDate = new Date(subscription.current_period_end * 1000);
      periodEnd.textContent = `${subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on ${endDate.toLocaleDateString()}`;
      container.appendChild(periodEnd);
    }
    
    if (subscription.payment_method_brand && subscription.payment_method_last4) {
      const paymentMethod = document.createElement('p');
      paymentMethod.className = 'text-sm text-gray-600 mt-2';
      paymentMethod.textContent = `Payment: ${subscription.payment_method_brand.toUpperCase()} •••• ${subscription.payment_method_last4}`;
      container.appendChild(paymentMethod);
    }
  }
  
  function getStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'trialing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'past_due':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'canceled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }
  
  function formatStatus(status: string): string {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  loadSubscription();
  return container;
}