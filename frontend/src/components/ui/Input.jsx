import React from 'react';

const Input = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <label htmlFor={id} className="flex w-full flex-col gap-1.5">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        id={id}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : ''} ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
};

export default Input;
