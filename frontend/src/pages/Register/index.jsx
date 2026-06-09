import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

const Register = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      role: 'Team Member'
    }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await registerAuth(data.name, data.email, data.password, data.role);
      navigate('/');
    } catch (err) {
      // Handled in AuthContext
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
            Create Account
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold mt-1">
            Register a new workspace member
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name}
            {...register('name', { required: 'Name is required' })}
          />

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

          <Input
            label="Workspace Role"
            type="select"
            error={errors.role}
            options={[
              { value: 'Team Member', label: 'Team Member' },
              { value: 'Admin', label: 'Admin (Full access)' }
            ]}
            {...register('role', { required: 'Role is required' })}
          />

          <Button
            type="submit"
            loading={submitting}
            className="w-full py-2.5 mt-2"
          >
            Create Account
          </Button>
        </form>

        {/* Footnote */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
