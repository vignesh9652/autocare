import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { useState } from 'react';
import { authApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { Stepper } from '@/components/ui/Stepper';

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') });
const otpSchema = z.object({ otp: z.string().length(6, 'Enter the 6-digit OTP') });
const resetSchema = z
  .object({ password: z.string().min(6, 'At least 6 characters'), confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema) });
  const resetForm = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  const sendOtp = async (values: z.infer<typeof emailSchema>) => {
    try {
      const res = await authApi.forgotPassword(values.email);
      setEmail(values.email);
      setDevOtp(res.otp); // demo: OTP echoed back since no email infra
      setStep(2);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const verifyOtp = async (values: z.infer<typeof otpSchema>) => {
    try {
      const res = await authApi.verifyOtp(email, values.otp);
      if (!res.valid) {
        toast('Invalid OTP', 'error');
        return;
      }
      setStep(3);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const resetPw = async (values: z.infer<typeof resetSchema>) => {
    try {
      await authApi.resetPassword(email, otpForm.getValues('otp'), values.password);
      toast('Password reset! Sign in with your new password.', 'success');
      navigate('/login');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll send you a one-time code to verify it's you">
      <Stepper steps={['Email', 'Verify OTP', 'New password']} current={step - 1} />

      {step === 1 && (
        <form onSubmit={emailForm.handleSubmit(sendOtp)} className="space-y-4">
          <Input label="Email" id="email" type="email" placeholder="you@example.com"
            error={emailForm.formState.errors.email?.message} {...emailForm.register('email')} />
          <Button type="submit" loading={emailForm.formState.isSubmitting} className="w-full">
            Send OTP
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
          {devOtp && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
              <p className="font-medium text-brand-700 dark:text-brand-400">Demo OTP: <span className="font-mono font-bold">{devOtp}</span></p>
              <p className="mt-0.5 text-xs text-ink-500">In production this is sent by email/SMS.</p>
            </div>
          )}
          <Input label="Enter 6-digit OTP" id="otp" inputMode="numeric" maxLength={6} placeholder="••••••"
            error={otpForm.formState.errors.otp?.message} {...otpForm.register('otp')} />
          <Button type="submit" loading={otpForm.formState.isSubmitting} className="w-full">
            <ShieldCheck className="h-5 w-5" /> Verify
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={resetForm.handleSubmit(resetPw)} className="space-y-4">
          <Input label="New Password" id="password" type="password" placeholder="Min. 6 characters"
            error={resetForm.formState.errors.password?.message} {...resetForm.register('password')} />
          <Input label="Confirm Password" id="confirm" type="password" placeholder="Repeat your password"
            error={resetForm.formState.errors.confirm?.message} {...resetForm.register('confirm')} />
          <Button type="submit" loading={resetForm.formState.isSubmitting} className="w-full">
            <Lock className="h-5 w-5" /> Reset Password
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-500">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          <KeyRound className="mr-0.5 inline h-3.5 w-3.5" /> Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
