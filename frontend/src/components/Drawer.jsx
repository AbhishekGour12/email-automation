import React from 'react';
import { Drawer as MuiDrawer, IconButton } from '@mui/material';
import { X } from 'lucide-react';

const Drawer = ({
  open,
  onClose,
  title,
  children,
  width = '450px',
  anchor = 'right'
}) => {
  return (
    <MuiDrawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      PaperProps={{
        style: { width: typeof width === 'number' ? `${width}px` : width, maxWidth: '100%' },
        className: 'bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800'
      }}
    >
      <div className="flex flex-col h-full font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          {onClose && (
            <IconButton 
              onClick={onClose}
              size="small"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </IconButton>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-800 dark:text-slate-200">
          {children}
        </div>
      </div>
    </MuiDrawer>
  );
};

export default Drawer;
