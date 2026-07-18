import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { loginUser } from "../authSlice";
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Code2 } from 'lucide-react';
import AuthVisualPanel from '../component/AuthVisualPanel';
import { cn } from '../utils/cn';

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak")
});

const fieldClass = (hasError) =>
  cn(
    'w-full rounded-xl border py-2.5 px-3.5 text-sm font-medium transition-all placeholder:text-white/20 focus:outline-none',
    hasError
      ? 'border-rose-500/30 bg-rose-500/[0.03] text-rose-100 focus:border-rose-500/50'
      : 'border-white/[0.08] bg-white/[0.03] text-white/90 focus:border-orange-500/40 focus:bg-white/[0.05]'
  );

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(loginUser(data));

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
            <h2 className="font-display text-2xl font-800 tracking-tight text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-white/40">Log in to pick up where you left off.</p>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 text-sm text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                  Email
                </label>
                <input type="email" placeholder="john@example.com" className={fieldClass(errors.emailId)} {...register('emailId')} />
                {errors.emailId && <span className="mt-1.5 block text-xs text-rose-400">{errors.emailId.message}</span>}
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
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </button>
            </form>
          </motion.div>

          <p className="mt-6 text-center text-sm text-white/40">
            Don't have an account?{' '}
            <NavLink to="/signup" className="font-semibold text-orange-400 transition-colors hover:text-orange-300">
              Sign up
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;