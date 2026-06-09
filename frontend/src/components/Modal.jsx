import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Zoom } from '@mui/material';
import { X } from 'lucide-react';

const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm', // xs, sm, md, lg, xl
  fullWidth = true
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Zoom}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        className: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-1'
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <DialogTitle className="p-0 text-lg font-bold text-slate-900 dark:text-slate-50 font-sans">
          {title}
        </DialogTitle>
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
      
      <DialogContent className="px-5 py-4 font-sans text-slate-800 dark:text-slate-200">
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
