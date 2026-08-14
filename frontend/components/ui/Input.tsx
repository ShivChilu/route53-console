import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col space-y-1 select-none">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-1.5 bg-white border rounded-sm text-xs leading-normal text-gray-900 focus:outline-none focus:border-aws-blue focus:ring-1 focus:ring-aws-blue transition-colors ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs font-semibold text-red-600">{error}</span>
      )}
      {helperText && !error && (
        <span className="text-[11px] text-aws-graytext font-normal">{helperText}</span>
      )}
    </div>
  );
}
