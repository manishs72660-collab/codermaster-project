import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, Code2 } from 'lucide-react';
import { registerUser, googleSignIn } from '../authSlice';
import AuthVisualPanel from '../component/AuthVisualPanel';
import { cn } from '../utils/cn';

const signupSchema = z.object({
  firstName: z.string().min(3, "Minimum character should be 3"),
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak"),
  collegeCode: z.string().optional(),
});

const fieldClass = (hasError) =>
  cn(
    'w-full rounded-xl border py-2.5 px-3.5 text-sm font-medium transition-all placeholder:text-white/20 focus:outline-none',
    hasError
      ? 'border-rose-500/30 bg-rose-500/[0.03] text-rose-100 focus:border-rose-500/50'
      : 'border-white/[0.08] bg-white/[0.03] text-white/90 focus:border-orange-500/40 focus:bg-white/[0.05]'
  );

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(registerUser(data));
  const handleGoogleSignup = () => dispatch(googleSignIn());

  return (
    <div className="noise hero-grid relative flex min-h-screen bg-[#050505] font-body text-[#e5e5e5] antialiased">
      {/* ambient blobs, same treatment as Homepage */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-pulse absolute top-[-15%] left-[-8%] h-[500px] w-[500px] rounded-full bg-orange-500/[0.06] blur-[130px]" />
        <div className="glow-pulse absolute bottom-[-15%] right-[-8%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.05] blur-[130px]" />
      </div>

      <AuthVisualPanel />

      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* mobile-only compact logo, since the panel hides below lg */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-800 text-white">
              CodeMaster<span className="text-orange-500">Dark</span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
          >
            <h2 className="font-display text-2xl font-800 tracking-tight text-white">Create your account</h2>
            <p className="mt-1 text-sm text-white/40">Start solving. It takes less than a minute.</p>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 text-sm text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {/* First Name */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                  First name
                </label>
                <input type="text" placeholder="John" className={fieldClass(errors.firstName)} {...register('firstName')} />
                {errors.firstName && <span className="mt-1.5 block text-xs text-rose-400">{errors.firstName.message}</span>}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                  Email
                </label>
                <input type="email" placeholder="john@example.com" className={fieldClass(errors.emailId)} {...register('emailId')} />
                {errors.emailId && <span className="mt-1.5 block text-xs text-rose-400">{errors.emailId.message}</span>}
              </div>

              {/* College code (optional) */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                  College code <span className="normal-case text-white/20">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. EXU01 - leave blank if you're not joining a college"
                  className={fieldClass(false)}
                  {...register('collegeCode')}
                />
                <span className="mt-1.5 block text-xs text-white/20">Ask your college admin for this code if you have one.</span>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={cn(fieldClass(errors.password), 'pr-10')}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-orange-400"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="mt-1.5 block text-xs text-rose-400">{errors.password.message}</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="font-display mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-700 text-black transition-all hover:shadow-[0_0_18px_rgba(249,115,22,0.4)] focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Signing up...
                  </>
                ) : (
                  'Sign up'
                )}
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/[0.07]" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/20">Or</span>
                <span className="h-px flex-1 bg-white/[0.07]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-semibold text-white/80 transition-all hover:border-white/15 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-4 w-4" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.2 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
                </svg>
                Continue with Google
              </button>
            </form>
          </motion.div>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{' '}
            <NavLink to="/login" className="font-semibold text-orange-400 transition-colors hover:text-orange-300">
              Log in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;