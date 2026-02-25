export function SuccessPage() {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8';
  
  const content = document.createElement('div');
  content.className = 'max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center';
  
  const icon = document.createElement('div');
  icon.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4';
  icon.innerHTML = `
    <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
  `;
  
  const title = document.createElement('h2');
  title.className = 'text-2xl font-bold text-gray-800 mb-2';
  title.textContent = 'Payment Successful!';
  
  const message = document.createElement('p');
  message.className = 'text-gray-600 mb-6';
  message.textContent = 'Thank you for your purchase. Your subscription is now active.';
  
  const button = document.createElement('a');
  button.href = '/';
  button.className = 'inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors';
  button.textContent = 'Continue to Dashboard';
  
  content.appendChild(icon);
  content.appendChild(title);
  content.appendChild(message);
  content.appendChild(button);
  container.appendChild(content);
  
  return container;
}