import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8';
  
  container.appendChild(LoginForm());
  
  return container;
}