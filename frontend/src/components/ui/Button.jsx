import React from 'react';

const variantClasses = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
};

const Button = ({
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  children,
  ...props
}) => {
  const classes = [
    'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[variant] || variantClasses.primary,
    className,
  ].join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
