import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, UserPlus, School, Send, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { registerUser, googleSignIn } from '../authSlice';
import AuthVisualPanel from '../component/Authvisualpanel';
import FormField from '../component/Formfield';
import Logo from '../component/Logo';
// Swap this import path if your axios wrapper lives somewhere else.
import axiosClient from '../utils/axiosClient';

const signupSchema = z.object({
  firstName: z.string().min(3, 'Minimum character should be 3'),
  emailId: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password is too weak'),
  collegeCode: z.string().optional(),
});

const emptyCollegeForm = {
  Collage_name: '',
  collegeCode: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  message: '',
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.06, delayChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function RegisterCollegeModal({ open, onClose }) {
  const [form, setForm] = useState(emptyCollegeForm);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) {
      setForm(emptyCollegeForm);
      setStatus('idle');
      setErrorMsg('');
    }
  }, [open]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      // POST /collage/request - public endpoint, no auth. Saves a
      // CollegeRequest doc and emails the platform admin. Does NOT create
      // the college or any account yet - that happens on admin approval.
      await axiosClient.post('/collage/request', form);
      setStatus('sent');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Something went wrong, please try again');
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0a0a]"
          >
            <span className="pointer-events-none absolute -left-2 -top-2 h-5 w-5 border-l-2 border-t-2 border-orange-500/40 rounded-tl-md" />
            <span className="pointer-events-none absolute -right-2 -bottom-2 h-5 w-5 border-r-2 border-b-2 border-orange-500/40 rounded-br-md" />

            <div className="sticky top-0 flex items-center gap-2 border-b border-white/[0.06] bg-[#0a0a0a] px-5 py-3.5">
              <School className="h-4 w-4 text-orange-400" />
              <span className="font-display text-sm font-700 text-white">Register your college</span>
              <button
                onClick={onClose}
                className="ml-auto text-white/25 transition-colors hover:text-white/60"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {status === 'sent' ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                  <h3 className="font-display text-lg font-800 text-white">Request sent</h3>
                  <p className="text-sm text-white/40">
                    We'll review it and email {form.adminEmail || 'you'} once your college is set up.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.04]"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/40">
                    Tell us about your college and admin contact. We'll review the request and set up your space.
                  </p>

                  <form onSubmit={handleSend} className="mt-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        label="College name"
                        name="Collage_name"
                        value={form.Collage_name}
                        onChange={handleChange}
                        required
                      />
                      <FormField
                        label="College code"
                        name="collegeCode"
                        value={form.collegeCode}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        label="Admin first name"
                        name="adminFirstName"
                        value={form.adminFirstName}
                        onChange={handleChange}
                        required
                      />
                      <FormField
                        label="Admin last name"
                        name="adminLastName"
                        value={form.adminLastName}
                        onChange={handleChange}
                      />
                    </div>

                    <FormField
                      label="Admin email"
                      name="adminEmail"
                      type="email"
                      value={form.adminEmail}
                      onChange={handleChange}
                      required
                    />

                    <div>
                      <label className="mb-1.5 block font-body text-[11px] text-white/30">Message (optional)</label>
                      <textarea
                        rows={3}
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="How many students, any deadlines, anything else..."
                        className="w-full resize-none rounded-lg border border-white/[0.08] bg-black/20 px-3.5 py-2.5 font-body text-sm text-white/90 placeholder:text-white/15 transition-colors focus:border-orange-500/50 focus:bg-black/30 focus:outline-none"
                      />
                    </div>

                    {status === 'error' && (
                      <div className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 text-xs text-rose-300">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_18px_rgba(249,115,22,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === 'sending' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send request
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple inline Google "G" mark - no extra icon package needed.
function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.6-.2-3.1-.9-4.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.7 18.9 12.5 24 12.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
      <path fill="#4CAF50" d="M24 45.5c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4c-2 1.4-4.6 2.3-7.6 2.3-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 41 16.3 45.5 24 45.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C41.6 35.6 44.5 30.7 44.5 25c0-1.6-.2-3.1-.9-4.5z"/>
    </svg>
  );
}

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
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
  const handleGoogleSignIn = () => dispatch(googleSignIn());

  return (
    <div className="noise hero-grid relative flex min-h-screen bg-[#050505] font-body text-[#e5e5e5] antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-pulse absolute top-[-15%] left-[-8%] h-[500px] w-[500px] rounded-full bg-orange-500/[0.06] blur-[130px]" />
        <div className="glow-pulse absolute bottom-[-15%] right-[-8%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.05] blur-[130px]" />
      </div>

      <AuthVisualPanel variant="signup" />

      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center justify-center lg:hidden">
            <Logo size="sm" />
          </div>

          <motion.div variants={cardVariants} initial="hidden" animate="show" className="relative">
            <span className="absolute -left-2 -top-2 h-5 w-5 border-l-2 border-t-2 border-orange-500/40 rounded-tl-md" />
            <span className="absolute -right-2 -bottom-2 h-5 w-5 border-r-2 border-b-2 border-orange-500/40 rounded-br-md" />

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
              <motion.div variants={itemVariants} className="flex items-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-orange-400/70">
                <UserPlus className="h-3 w-3" /> Sign up
              </motion.div>
              <motion.h2 variants={itemVariants} className="font-display mt-2 text-2xl font-700 tracking-tight text-white">
                Create your account
              </motion.h2>
              <motion.p variants={itemVariants} className="mt-1 text-sm text-white/40">
                Start solving. It takes less than a minute.
              </motion.p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 text-xs text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Continue with Google */}
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="show"
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                Continue with Google
              </motion.button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-white/25">or</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <motion.div variants={itemVariants}>
                  <FormField
                    label="First name"
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                </motion.div>

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
                    label="College code (optional)"
                    hint="Ask your college admin for this code - leave blank if you don't have one"
                    {...register('collegeCode')}
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
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_18px_rgba(249,115,22,0.4)] focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Create account
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{' '}
            <NavLink to="/login" className="font-semibold text-orange-400 transition-colors hover:text-orange-300">
              Log in
            </NavLink>
          </p>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={() => setShowCollegeModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] py-2.5 text-sm text-white/60 transition-all hover:border-orange-500/30 hover:text-orange-300"
          >
            <School className="h-3.5 w-3.5" />
            Register your college
          </motion.button>
        </div>
      </div>

      <RegisterCollegeModal open={showCollegeModal} onClose={() => setShowCollegeModal(false)} />
    </div>
  );
}

export default Signup;