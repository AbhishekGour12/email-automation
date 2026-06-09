import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';

// Import Pages
import Dashboard from '../pages/Dashboard';
import Leads from '../pages/Leads';
import Campaigns from '../pages/Campaigns';
import Templates from '../pages/Templates';
import EmailBuilder from '../pages/Templates/EmailBuilder';
import Inbox from '../pages/Inbox';
import Analytics from '../pages/Analytics';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';

const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },

  // Protected Core App Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/leads',
        element: <Leads />
      },
      {
        path: '/campaigns',
        element: <Campaigns />
      },
      {
        path: '/templates',
        element: <Templates />
      },
      {
        path: '/templates/builder/:id',
        element: <EmailBuilder />
      },
      {
        path: '/inbox',
        element: <Inbox />
      },
      {
        path: '/analytics',
        element: <Analytics />
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute allowedRoles={['Admin']}>
            <Settings />
          </ProtectedRoute>
        )
      },
      {
        path: '/profile',
        element: <Profile />
      }
    ]
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
