import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { forgotPasswordLink } from '../../api/auth.api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [submitting, setSubmitting] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    setResetLink('');
    try {
      const response = await forgotPasswordLink(data.email);
      toast.success(response.message || 'Reset link generated successfully.');
      if (response.data?.resetLink) {
        setResetLink(response.data.resetLink);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request reset. Verify email.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium shadow-premium p-8">
        
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-primary-500/10 mb-3">
            A
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            Forgot Password
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold mt-1">
            Retrieve password reset details
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john@company.com"
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />

          <Button
            type="submit"
            loading={submitting}
            className="w-full py-2.5 mt-2"
          >
            Send Reset Instructions
          </Button>
        </form>

        {/* Direct Link Output (For Backend-Only Verification / Dev helper) */}
        {resetLink && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs break-all">
            <p className="font-bold text-slate-700 dark:text-slate-350 mb-2">Password Reset Link:</p>
            <a 
              href={resetLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700"
            >
              {resetLink}
            </a>
            <p className="text-[10px] text-slate-400 mt-2">
              (This link is returned directly by Firebase Admin SDK during password request)
            </p>
          </div>
        )}

        {/* Footnote */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-6">
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
