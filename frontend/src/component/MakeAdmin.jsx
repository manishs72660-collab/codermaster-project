import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import BackButton from './backbutton';
const adminSchema = z.object({
  firstName: z.string().min(3, 'First name must be at least 3 characters').max(20, 'First name cannot exceed 20 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  emailId: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  profileImage: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  role: z.enum(['Admin', 'User', 'CollageAdmin']),
  collegeId: z.string().optional()
}).refine(
  (data) => data.role === 'Admin' || (data.collegeId && data.collegeId.trim().length > 0),
  { message: 'College is required for User and CollageAdmin roles', path: ['collegeId'] }
);

function MakeAdmin() {
  const navigate = useNavigate();
  const [submitStatus, setSubmitStatus] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      emailId: '',
      password: '',
      profileImage: '',
      role: 'Admin',
      collegeId: ''
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setSubmitStatus(null);
    try {
      const payload = { ...data };
      if (!payload.profileImage) delete payload.profileImage;
      if (payload.role === 'Admin') delete payload.collegeId;

      const res = await axiosClient.post('/auth/admin/register', payload);
      setSubmitStatus({
        type: 'success',
        message: res?.data?.message || `Admin "${data.firstName}" was created successfully.`
      });
      setTimeout(() => navigate('/admin'), 1200);
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Something went wrong while creating the admin.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <BackButton></BackButton>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Make Admin</h1>
          <p className="text-white/50 mt-2">Register a new admin account.</p>
        </div>

        {submitStatus && (
          <div
            role="status"
            className={`mb-6 flex items-start gap-3 rounded-2xl border px-5 py-4 ${
              submitStatus.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold">
                {submitStatus.type === 'success' ? 'Admin created' : 'Creation failed'}
              </p>
              <p className="text-sm opacity-90 mt-0.5">{submitStatus.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitStatus(null)}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">First Name</label>
              <input
                {...register("firstName")}
                placeholder="John"
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none transition-colors ${
                  errors?.firstName ? "border-red-500" : "border-white/10 focus:border-orange-500"
                }`}
              />
              {errors?.firstName && <p className="text-red-400 text-sm mt-2">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Last Name</label>
              <input
                {...register("lastName")}
                placeholder="Doe"
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none transition-colors ${
                  errors?.lastName ? "border-red-500" : "border-white/10 focus:border-orange-500"
                }`}
              />
              {errors?.lastName && <p className="text-red-400 text-sm mt-2">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
            <input
              type="email"
              {...register("emailId")}
              placeholder="admin@example.com"
              className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none transition-colors ${
                errors?.emailId ? "border-red-500" : "border-white/10 focus:border-orange-500"
              }`}
            />
            {errors?.emailId && <p className="text-red-400 text-sm mt-2">{errors.emailId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none transition-colors ${
                errors?.password ? "border-red-500" : "border-white/10 focus:border-orange-500"
              }`}
            />
            {errors?.password && <p className="text-red-400 text-sm mt-2">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Role</label>
            <select
              {...register("role")}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="Admin">Admin</option>
              <option value="User">User</option>
              <option value="CollageAdmin">College Admin</option>
            </select>
          </div>

          {selectedRole !== 'Admin' && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">College ID</label>
              <input
                {...register("collegeId")}
                placeholder="College ObjectId"
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none transition-colors ${
                  errors?.collegeId ? "border-red-500" : "border-white/10 focus:border-orange-500"
                }`}
              />
              {errors?.collegeId && <p className="text-red-400 text-sm mt-2">{errors.collegeId.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Profile Image URL <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <input
              {...register("profileImage")}
              placeholder="https://..."
              className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none transition-colors ${
                errors?.profileImage ? "border-red-500" : "border-white/10 focus:border-orange-500"
              }`}
            />
            {errors?.profileImage && <p className="text-red-400 text-sm mt-2">{errors.profileImage.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg flex items-center justify-center gap-3 ${
              isSubmitting
                ? 'bg-orange-500/50 text-black/60 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-400 text-black'
            }`}
          >
            {isSubmitting ? 'Creating…' : 'Create Admin'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default MakeAdmin;