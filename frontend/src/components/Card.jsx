import React from 'react';

const Card = ({
  title,
  value,
  trend, // { type: 'up' | 'down', value: '12%' }
  description,
  icon: Icon,
  className = '',
  children
}) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div className="p-2 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 rounded-lg">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
      
      {value !== undefined && (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            {value}
          </span>
          {trend && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend.type === 'up'
                  ? 'bg-green-150 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              }`}
            >
              {trend.type === 'up' ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
      )}

      {description && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {description}
        </p>
      )}

      {children}
    </div>
  );
};

export default Card;
