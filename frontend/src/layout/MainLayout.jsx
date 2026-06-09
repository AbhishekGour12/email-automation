import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Drawer as MuiDrawer } from '@mui/material';

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* 1. Desktop Sidebar */}
      <div className={`hidden md:block shrink-0 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* 2. Mobile Drawer Sidebar */}
      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileMenuToggle}
        ModalProps={{ keepMounted: true }} // Better open performance on mobile
        PaperProps={{
          className: 'w-64 bg-slate-900 border-r border-slate-800'
        }}
        className="md:hidden"
      >
        <Sidebar collapsed={false} setCollapsed={() => {}} />
      </MuiDrawer>

      {/* 3. Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar collapsed={collapsed} onMenuToggle={handleMobileMenuToggle} />
        
        <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
