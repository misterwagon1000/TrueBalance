import { PricingCard } from '../components/pricing/PricingCard';
import { stripeProducts } from '../stripe-config';
import { authService } from '../lib/auth';

export function PricingPage() {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8';
  
  let isAuthenticated = false;
  
  async function checkAuth() {
    const { user } = await authService.getUser();
    isAuthenticated = !!user;
    render();
  }
  
  function render() {
    container.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'max-w-4xl mx-auto text-center mb-12';
    
    const title = document.createElement('h1');
    title.className = 'text-4xl font-bold text-gray-800 mb-4';
    title.textContent = 'Choose Your Plan';
    
    const subtitle = document.createElement('p');
    subtitle.className = 'text-xl text-gray-600';
    subtitle.textContent = 'Unlock the full potential of your financial management';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    container.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
    
    stripeProducts.forEach(product => {
      const card = PricingCard({
        product,
        isAuthenticated,
        onAuthRequired: () => {
          window.location.href = '/login';
        }
      });
      grid.appendChild(card);
    });
    
    container.appendChild(grid);
  }
  
  checkAuth();
  return container;
}