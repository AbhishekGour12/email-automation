import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resetPasswordConfirm } from '../../api/auth.api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import toast from 'react-hot-toast';
import { User, KeyRound, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';

const Profile = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const onSubmitPassword = async (data) => {
    if (data.password !== data.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setSubmitting(true);
    try {
      await resetPasswordConfirm(data.password);
      toast.success('Password updated successfully!');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          My Account
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Manage your personal details and security preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center font-extrabold text-primary-700 dark:text-primary-400 text-3xl border border-primary-200 dark:border-primary-800 mb-4">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">
            {user?.name || 'User Name'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 capitalize font-bold">{user?.role || 'Team Member'}</p>
          
          <div className="w-full mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Email:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-250 truncate max-w-[150px]">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-450 font-medium">User ID:</span>
              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[100px]">{user?.uid}</span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium p-6 shadow-premium space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <KeyRound className="h-4 w-4 text-primary-600" /> Change Account Password
          </h3>
          
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.password}
              {...register('password', {
                required: 'New password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword}
              {...register('confirmPassword', {
                required: 'Please confirm password'
              })}
            />

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="w-full mt-2"
            >
              Update Password
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
