import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { authService } from '../../lib/auth';

export function LoginForm() {
  const container = document.createElement('div');
  container.className = 'max-w-md mx-auto bg-white p-8 rounded-lg shadow-md';
  
  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  
  function render() {
    container.innerHTML = '';
    
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-center mb-6 text-gray-800';
    title.textContent = 'Sign In';
    container.appendChild(title);
    
    if (error) {
      container.appendChild(Alert({ type: 'error', message: error, className: 'mb-4' }));
    }
    
    const form = document.createElement('form');
    form.className = 'space-y-4';
    
    const emailInput = Input({
      type: 'email',
      placeholder: 'Email',
      value: email,
      required: true,
      disabled: loading,
      onChange: (value) => { email = value; }
    });
    
    const passwordInput = Input({
      type: 'password',
      placeholder: 'Password',
      value: password,
      required: true,
      disabled: loading,
      onChange: (value) => { password = value; },
      onKeyPress: (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }
    });
    
    const submitButton = Button({
      type: 'submit',
      loading,
      disabled: loading || !email || !password,
      className: 'w-full',
      children: 'Sign In'
    });
    
    form.appendChild(emailInput);
    form.appendChild(passwordInput);
    form.appendChild(submitButton);
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit();
    });
    
    container.appendChild(form);
    
    const signupLink = document.createElement('p');
    signupLink.className = 'text-center mt-4 text-gray-600';
    signupLink.innerHTML = `Don't have an account? <a href="/signup" class="text-blue-600 hover:underline">Sign up</a>`;
    container.appendChild(signupLink);
  }
  
  async function handleSubmit() {
    if (loading) return;
    
    loading = true;
    error = '';
    render();
    
    try {
      const { error: signInError } = await authService.signIn(email, password);
      
      if (signInError) {
        error = signInError.message;
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
    } finally {
      loading = false;
      render();
    }
  }
  
  render();
  return container;
}