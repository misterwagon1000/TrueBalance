import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { authService } from '../../lib/auth';

export function SignupForm() {
  const container = document.createElement('div');
  container.className = 'max-w-md mx-auto bg-white p-8 rounded-lg shadow-md';
  
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';
  let success = '';
  
  function render() {
    container.innerHTML = '';
    
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-center mb-6 text-gray-800';
    title.textContent = 'Create Account';
    container.appendChild(title);
    
    if (error) {
      container.appendChild(Alert({ type: 'error', message: error, className: 'mb-4' }));
    }
    
    if (success) {
      container.appendChild(Alert({ type: 'success', message: success, className: 'mb-4' }));
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
      onChange: (value) => { password = value; }
    });
    
    const confirmPasswordInput = Input({
      type: 'password',
      placeholder: 'Confirm Password',
      value: confirmPassword,
      required: true,
      disabled: loading,
      onChange: (value) => { confirmPassword = value; },
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
      disabled: loading || !email || !password || !confirmPassword,
      className: 'w-full',
      children: 'Create Account'
    });
    
    form.appendChild(emailInput);
    form.appendChild(passwordInput);
    form.appendChild(confirmPasswordInput);
    form.appendChild(submitButton);
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit();
    });
    
    container.appendChild(form);
    
    const loginLink = document.createElement('p');
    loginLink.className = 'text-center mt-4 text-gray-600';
    loginLink.innerHTML = `Already have an account? <a href="/login" class="text-blue-600 hover:underline">Sign in</a>`;
    container.appendChild(loginLink);
  }
  
  async function handleSubmit() {
    if (loading) return;
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      render();
      return;
    }
    
    if (password.length < 6) {
      error = 'Password must be at least 6 characters';
      render();
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    render();
    
    try {
      const { error: signUpError } = await authService.signUp(email, password);
      
      if (signUpError) {
        error = signUpError.message;
      } else {
        success = 'Account created successfully! You can now sign in.';
        email = '';
        password = '';
        confirmPassword = '';
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