import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { SignupPage } from './pages/signup';
import { PricingPage } from './pages/pricing';
import { SuccessPage } from './pages/success';

export interface Route {
  path: string;
  component: () => HTMLElement;
}

const routes: Route[] = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignupPage },
  { path: '/pricing', component: PricingPage },
  { path: '/success', component: SuccessPage }
];

export function router() {
  const path = window.location.pathname;
  const route = routes.find(r => r.path === path) || routes[0];
  return route.component();
}

// Handle navigation
window.addEventListener('popstate', () => {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '';
    app.appendChild(router());
  }
});