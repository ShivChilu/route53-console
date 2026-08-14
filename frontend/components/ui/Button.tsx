import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  size?: 'xs' | 'sm' | 'md';
  loading?: boolean;
}

export default function Button({
  children,
  variant = 'secondary',
  size = 'sm',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // AWS style square/slightly rounded buttons
  const baseStyle = "inline-flex items-center justify-center font-bold border focus:outline-none transition-colors select-none";
  
  const variants = {
    primary: "bg-aws-orange text-white border-[#d56209] hover:bg-[#d56209] disabled:bg-[#f2ca9b] disabled:border-[#f2ca9b] disabled:text-white",
    secondary: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200",
    danger: "bg-red-600 text-white border-red-700 hover:bg-red-700 disabled:bg-red-300",
    link: "bg-transparent text-aws-blue border-transparent hover:text-aws-hoverblue hover:underline p-0 m-0 shadow-none border-none font-normal"
  };

  const sizes = {
    xs: "px-2 py-0.5 text-xs rounded-sm",
    sm: "px-3 py-1.5 text-xs rounded-sm",
    md: "px-4 py-2 text-sm rounded-sm"
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
      {children}
    </button>
  );
}
