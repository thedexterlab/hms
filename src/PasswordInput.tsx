import { Eye, EyeOff, Lock } from 'lucide-react';
import { useId, useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface PasswordInputProps {
  id?: string;
  name: string;
  label: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  inputProps?: UseFormRegisterReturn;
}

export function PasswordInput({
  id,
  name,
  label,
  placeholder,
  error,
  disabled,
  autoComplete,
  inputProps,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 flex items-center text-sm font-semibold text-slate-800">
        <Lock className="mr-2 h-4 w-4 text-teal-700" aria-hidden="true" />
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200 ${error ? 'border-red-400' : 'border-slate-200'}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-1 right-1 flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
