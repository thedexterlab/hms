import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { loginSchema, type LoginFormValues } from './login.schema';
import { PasswordInput } from './PasswordInput';
import { AuthError } from './auth.types';
import { login, setCurrentSession } from './auth.service';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onSuccess?: (user: { fullName: string; roles: string[] }) => void;
  onStatusChange?: (status: 'online' | 'offline') => void;
}

export function LoginForm({ onSuccess, onStatusChange }: LoginFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      usernameOrEmail: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerMessage(null);

    try {
      const response = await login({
        usernameOrEmail: values.usernameOrEmail,
        password: values.password,
        rememberMe: values.rememberMe ?? false,
      });

      setCurrentSession(
        {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn,
          user: response.user,
        },
        values.rememberMe ?? false,
      );

      setFailedAttempts(0);
      onStatusChange?.('online');
      onSuccess?.({
        fullName: response.user.fullName,
        roles: response.user.roles,
      });
    } catch (error) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (error instanceof AuthError) {
        if (nextAttempts >= 3) {
          setServerMessage('Too many sign-in attempts. Please wait a moment and try again.');
        } else {
          setServerMessage(error.message);
        }
        onStatusChange?.(error.code === 'NETWORK_ERROR' ? 'offline' : 'online');
      } else {
        setServerMessage('Unable to connect to the hospital server. Please try again.');
        onStatusChange?.('offline');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-4">
        <div>
          <label htmlFor="usernameOrEmail" className="mb-2 flex items-center text-sm font-semibold text-slate-800">
            <UserRound className="mr-2 h-4 w-4 text-teal-700" aria-hidden="true" />
            Username or Email
          </label>
          <input
            id="usernameOrEmail"
            type="text"
            autoComplete="username"
            placeholder="Enter username or email"
            aria-invalid={Boolean(errors.usernameOrEmail)}
            aria-describedby={errors.usernameOrEmail ? 'usernameOrEmail-error' : undefined}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200 ${errors.usernameOrEmail ? 'border-red-400' : 'border-slate-200'}`}
            {...register('usernameOrEmail')}
          />
          {errors.usernameOrEmail ? (
            <p id="usernameOrEmail-error" role="alert" className="mt-2 text-sm text-red-600">
              {errors.usernameOrEmail.message}
            </p>
          ) : null}
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          disabled={isSubmitting}
          autoComplete="current-password"
          inputProps={register('password')}
        />
      </div>

      {serverMessage ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{serverMessage}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500" {...register('rememberMe')} />
          Remember me
        </label>
        <Link to="/forgot-password" className="rounded font-semibold text-teal-700 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-teal-400"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span role="status">Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-teal-800">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Secure access for authorized hospital personnel only.
        </div>
      </div>
    </form>
  );
}
