import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  placeholder,
  className = '',
  id,
  options = [], // for select type
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const baseInputStyles = 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all duration-150 text-slate-950 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500';
  const borderStyles = error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 dark:border-slate-700';

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      
      {type === 'select' ? (
        <select
          id={inputId}
          ref={ref}
          className={`${baseInputStyles} ${borderStyles}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          ref={ref}
          placeholder={placeholder}
          className={`${baseInputStyles} ${borderStyles} resize-y min-h-[80px]`}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`${baseInputStyles} ${borderStyles}`}
          {...props}
        />
      )}

      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
