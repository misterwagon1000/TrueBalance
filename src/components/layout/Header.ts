import { authService } from '../../lib/auth';
import { Button } from '../ui/Button';
import type { User } from '@supabase/supabase-js';

export function Header() {
  const header = document.createElement('header');
  header.className = 'bg-white shadow-sm border-b border-gray-200';
  
  let user: User | null = null;
  
  async function loadUser() {
    const { user: currentUser } = await authService.getUser();
    user = currentUser;
    render();
  }
  
  function render() {
    header.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
    
    const nav = document.createElement('nav');
    nav.className = 'flex items-center justify-between h-16';
    
    const logo = document.createElement('a');
    logo.href = '/';
    logo.className = 'text-xl font-bold text-blue-600';
    logo.textContent = 'Finance Sorter';
    
    const navItems = document.createElement('div');
    navItems.className = 'flex items-center space-x-4';
    
    if (user) {
      const pricingLink = document.createElement('a');
      pricingLink.href = '/pricing';
      pricingLink.className = 'text-gray-600 hover:text-gray-800 transition-colors';
      pricingLink.textContent = 'Pricing';
      
      const userEmail = document.createElement('span');
      userEmail.className = 'text-sm text-gray-600';
      userEmail.textContent = user.email || '';
      
      const signOutButton = Button({
        variant: 'outline',
        size: 'sm',
        children: 'Sign Out',
        onClick: async () => {
          await authService.signOut();
          window.location.href = '/';
        }
      });
      
      navItems.appendChild(pricingLink);
      navItems.appendChild(userEmail);
      navItems.appendChild(signOutButton);
    } else {
      const loginLink = document.createElement('a');
      loginLink.href = '/login';
      loginLink.className = 'text-gray-600 hover:text-gray-800 transition-colors';
      loginLink.textContent = 'Sign In';
      
      const signupButton = Button({
        size: 'sm',
        children: 'Sign Up',
        onClick: () => {
          window.location.href = '/signup';
        }
      });
      
      navItems.appendChild(loginLink);
      navItems.appendChild(signupButton);
    }
    
    nav.appendChild(logo);
    nav.appendChild(navItems);
    container.appendChild(nav);
    header.appendChild(container);
  }
  
  loadUser();
  
  // Listen for auth state changes
  authService.onAuthStateChange((newUser) => {
    user = newUser;
    render();
  });
  
  return header;
}