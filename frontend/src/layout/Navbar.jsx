import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Bell, Sun, Moon, User, LogOut } from 'lucide-react';
import { Menu as MuiMenu, MenuItem, Divider, IconButton, Badge } from '@mui/material';
import toast from 'react-hot-toast';

const Navbar = ({ collapsed, onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Apply dark mode theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleProfileMenuClose();
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Left items: Mobile toggle */}
      <div className="flex items-center gap-4">
        <IconButton
          onClick={onMenuToggle}
          edge="start"
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </IconButton>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
          Workspace: <span className="font-bold text-slate-700 dark:text-slate-200">Email Outreach Backend</span>
        </span>
      </div>

      {/* Right items: Notifications, Theme toggle, User Profile */}
      <div className="flex items-center gap-3 font-sans">
        {/* Dark Mode Toggle */}
        <IconButton
          onClick={() => setDarkMode(!darkMode)}
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </IconButton>

        {/* Notifications Bell */}
        <IconButton
          onClick={() => toast.success('You have no new notifications.')}
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Badge badgeContent={0} color="primary">
            <Bell className="h-5 w-5" />
          </Badge>
        </IconButton>

        {/* User profile avatar */}
        <div className="relative">
          <button
            onClick={handleProfileMenuOpen}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-150"
          >
            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center font-bold text-primary-700 dark:text-primary-400 text-sm border border-primary-200 dark:border-primary-800">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
                {user?.name || 'User Name'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium capitalize leading-none mt-0.5">
                {user?.role || 'Team Member'}
              </span>
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          <MuiMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            keepMounted
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              className: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium shadow-lg min-w-[200px] mt-1'
            }}
          >
            <div className="px-4 py-2 flex flex-col font-sans">
              <span className="text-sm font-bold text-slate-850 dark:text-slate-150">
                {user?.name}
              </span>
              <span className="text-xs text-slate-450 dark:text-slate-450">
                {user?.email}
              </span>
            </div>
            <Divider className="border-slate-100 dark:border-slate-800" />
            <MenuItem 
              onClick={handleProfileMenuClose}
              className="text-sm font-sans flex items-center gap-2 py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200"
            >
              <User className="h-4 w-4" /> My Profile
            </MenuItem>
            <MenuItem 
              onClick={handleLogoutClick}
              className="text-sm font-sans flex items-center gap-2 py-2 px-4 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" /> Logout
            </MenuItem>
          </MuiMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
