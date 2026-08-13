import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="label" htmlFor={props.id}>{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'input',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="label" htmlFor={props.id}>{label}</label>}
      <textarea ref={ref} className={cn('input min-h-[90px]', error && 'border-red-400', className)} {...props} />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="label" htmlFor={props.id}>{label}</label>}
      <select ref={ref} className={cn('input', error && 'border-red-400', className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
