import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { loginUser } from '../authSlice';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Code2, LogIn, AlertCircle } from 'lucide-react';
import AuthVisualPanel from '../component/AuthVisualPanel';
import FormField from '../component/FormField';

const loginSchema = z.object({
  emailId: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password is too weak'),
});

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07, delayChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-pulse absolute top-[-15%] left-[-8%] h-[500px] w-[500px] rounded-full bg-orange-500/[0.06] blur-[130px]" />
        <div className="glow-pulse absolute bottom-[-15%] right-[-8%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.05] blur-[130px]" />
      </div>

      <AuthVisualPanel variant="login" />

      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-800 text-white">
              Code<span className="text-orange-500">Master</span>
            </span>
          </div>

          <motion.div variants={cardVariants} initial="hidden" animate="show" className="relative">
            {/* accent corner brackets — signature detail replacing the old editor-tab chrome */}
            <span className="absolute -left-2 -top-2 h-5 w-5 border-l-2 border-t-2 border-orange-500/40 rounded-tl-md" />
            <span className="absolute -right-2 -bottom-2 h-5 w-5 border-r-2 border-b-2 border-orange-500/40 rounded-br-md" />

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
              <motion.div variants={itemVariants} className="flex items-center gap-1.5 font-code text-[11px] uppercase tracking-[0.15em] text-orange-400/70">
                <LogIn className="h-3 w-3" /> Log in
              </motion.div>
              <motion.h2 variants={itemVariants} className="font-display mt-2 text-2xl font-800 tracking-tight text-white">
                Welcome back
              </motion.h2>
              <motion.p variants={itemVariants} className="mt-1 text-sm text-white/40">
                Enter your credentials to resume your session.
              </motion.p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 font-code text-xs text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <motion.div variants={itemVariants}>
                  <FormField
                    label="Email"
                    type="email"
                    error={errors.emailId?.message}
                    {...register('emailId')}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    error={errors.password?.message}
                    rightSlot={
                      <button
                        type="button"
                        className="text-white/25 transition-colors hover:text-orange-400"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    {...register('password')}
                  />
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="font-code mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_18px_rgba(249,115,22,0.4)] focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-3.5 w-3.5" />
                      Log in
                    </>
                  )}
                </motion.button>
              </form>
            </div>
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