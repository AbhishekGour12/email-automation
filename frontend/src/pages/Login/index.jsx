import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Redirect to original page if navigated via ProtectedRoute, otherwise dashboard root
  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      // Errors handled inside AuthContext via toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium shadow-premium p-8">
        
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-primary-500/10 mb-3">
            A
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            Sign In
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold mt-1">
            Access your Email Outreach & Automation CRM
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />

          <div className="relative">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <div className="absolute right-0 top-0 mt-0.5">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            loading={submitting}
            className="w-full py-2.5 mt-2"
          >
            Sign In
          </Button>
        </form>

        {/* Footnote */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-6">
          New to Abhi Services?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
