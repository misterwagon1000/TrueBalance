export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onKeyPress?: (event: KeyboardEvent) => void;
}

export function Input({
  type = 'text',
  placeholder = '',
  value = '',
  required = false,
  disabled = false,
  className = '',
  onChange,
  onKeyPress
}: InputProps) {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  input.required = required;
  input.disabled = disabled;
  input.className = `w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  
  if (onChange) {
    input.addEventListener('input', (e) => {
      onChange((e.target as HTMLInputElement).value);
    });
  }
  
  if (onKeyPress) {
    input.addEventListener('keypress', onKeyPress);
  }
  
  return input;
}