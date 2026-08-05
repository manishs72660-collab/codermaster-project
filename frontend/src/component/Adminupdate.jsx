import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import BackButton from './backbutton';
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp', 'string']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript', 'python']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).min(1, 'At least one language required'),
  driverCode: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript', 'python']),
      code: z.string().min(1, 'Driver code is required')
    })
  ).min(1, 'At least one driver code required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript', 'python']),
      solutionCode: z.string().min(1, 'Solution code is required')
    })
  ).min(1, 'At least one solution required')
});

const languages = [
  { value: 'c++',        label: 'C++' },
  { value: 'java',       label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python',     label: 'Python' }
];

function AdminUpdate() {
  const { problemId } = useParams();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [],
      hiddenTestCases: [],
      startCode: [],
      driverCode: [],
      referenceSolution: []
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({ control, name: 'visibleTestCases' });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({ control, name: 'hiddenTestCases' });

  // ================= FETCH EXISTING PROBLEM =================
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setPageLoading(true);
        setLoadError(null);
        const response = await axiosClient.get(`/problem/admin/${problemId}`);
        const problem = response.data;

        // helper: make sure all 4 languages exist for code-array fields,
        // in the same fixed order the form expects
        const normalizeCodeArray = (arr, key) => {
          const byLang = Object.fromEntries((arr || []).map((item) => [item.language, item]));
          return languages.map(({ value }) => ({
            language: value,
            [key]: byLang[value]?.[key] ?? ''
          }));
        };

        reset({
          title: problem.title || '',
          description: problem.description || '',
          difficulty: problem.difficulty || 'easy',
          tags: problem.tags || 'array',
          visibleTestCases: problem.visibleTestCases?.length ? problem.visibleTestCases : [],
          hiddenTestCases: problem.hiddenTestCases?.length ? problem.hiddenTestCases : [],
          startCode: normalizeCodeArray(problem.startCode, 'initialCode'),
          driverCode: normalizeCodeArray(problem.driverCode, 'code'),
          referenceSolution: normalizeCodeArray(problem.referenceSolution, 'solutionCode')
        });
      } catch (err) {
        console.error("Fetch failed:", err.response?.data || err.message);
        setLoadError(err.response?.data || "Failed to load problem.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, reset]);

  // ================= SUBMIT UPDATE =================
  const onSubmit = async (data) => {
    setSubmitStatus(null);
    try {
      const res = await axiosClient.put(`/problem/updateproblem/${problemId}`, data);
      setSubmitStatus({
        type: 'success',
        message: res?.data?.message || `Problem "${data.title}" was updated successfully.`
      });
      setTimeout(() => navigate('/admin/update'), 1200);
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data || error.message || 'Something went wrong while updating the problem.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-orange-500"></span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl px-6 py-4">
          {typeof loadError === 'string' ? loadError : 'Failed to load problem.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
         <BackButton></BackButton>
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Update Problem</h1>
          <p className="text-white/50 mt-2">Editing: {problemId}</p>
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
                {submitStatus.type === 'success' ? 'Problem updated' : 'Update failed'}
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

        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#111111] border border-white/10 rounded-3xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
              <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p className="text-white/80 font-medium">Updating problem…</p>
              <p className="text-white/40 text-sm">Re-running reference solutions against test cases.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* ── Basic Information ── */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
                <input
                  {...register("title")}
                  className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none transition-colors ${
                    errors?.title ? "border-red-500" : "border-white/10 focus:border-orange-500"
                  }`}
                />
                {errors?.title && <p className="text-red-400 text-sm mt-2">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                <textarea
                  {...register("description")}
                  rows={8}
                  className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 outline-none resize-none transition-colors ${
                    errors?.description ? "border-red-500" : "border-white/10 focus:border-orange-500"
                  }`}
                />
                {errors?.description && <p className="text-red-400 text-sm mt-2">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Difficulty</label>
                  <select
                    {...register("difficulty")}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Tag</label>
                  <select
                    {...register("tags")}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  >
                    <option value="array">Array</option>
                    <option value="linkedList">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="dp">Dynamic Programming</option>
                    <option value="string">String</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Visible Test Cases ── */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Visible Test Cases</h2>
              <button
                type="button"
                onClick={() => appendVisible({ input: "", output: "", explanation: "" })}
                className="bg-orange-500 hover:bg-orange-400 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Add Visible Case
              </button>
            </div>
            {errors?.visibleTestCases?.message && <p className="text-red-400 text-sm mb-4">{errors.visibleTestCases.message}</p>}
            <div className="space-y-6">
              {visibleFields.map((field, index) => (
                <div key={field.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-white/80">Test Case #{index + 1}</h3>
                    <button type="button" onClick={() => removeVisible(index)} className="text-red-400 hover:text-red-300 text-sm font-medium">Remove</button>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      {...register(`visibleTestCases.${index}.input`)}
                      rows={3}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none resize-none font-mono text-sm"
                    />
                    <input
                      {...register(`visibleTestCases.${index}.output`)}
                      placeholder="Output"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                    />
                    <textarea
                      {...register(`visibleTestCases.${index}.explanation`)}
                      rows={3}
                      placeholder="Explanation"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Hidden Test Cases ── */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Hidden Test Cases</h2>
              <button
                type="button"
                onClick={() => appendHidden({ input: "", output: "" })}
                className="bg-orange-500 hover:bg-orange-400 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Add Hidden Case
              </button>
            </div>
            {errors?.hiddenTestCases?.message && <p className="text-red-400 text-sm mb-4">{errors.hiddenTestCases.message}</p>}
            <div className="space-y-6">
              {hiddenFields.map((field, index) => (
                <div key={field.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-white/80">Hidden Case #{index + 1}</h3>
                    <button type="button" onClick={() => removeHidden(index)} className="text-red-400 hover:text-red-300 text-sm font-medium">Remove</button>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      {...register(`hiddenTestCases.${index}.input`)}
                      rows={3}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none resize-none font-mono text-sm"
                    />
                    <input
                      {...register(`hiddenTestCases.${index}.output`)}
                      placeholder="Output"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Code Templates ── */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-2">Code Templates</h2>
            <div className="space-y-10">
              {languages.map(({ value, label }, index) => (
                <div key={value} className="border border-white/10 rounded-2xl p-6 bg-[#1a1a1a]">
                  <h3 className="text-xl font-semibold mb-6 text-orange-500">{label}</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Initial Code <span className="text-white/30 font-normal">(shown to user)</span>
                      </label>
                      <textarea
                        {...register(`startCode.${index}.initialCode`)}
                        rows={6}
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm outline-none resize-none focus:border-orange-500"
                      />
                      {errors?.startCode?.[index]?.initialCode && (
                        <p className="text-red-400 text-sm mt-2">{errors.startCode[index].initialCode.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Driver Code <span className="text-white/30 font-normal">(backend only)</span>
                      </label>
                      <textarea
                        {...register(`driverCode.${index}.code`)}
                        rows={8}
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm outline-none resize-none focus:border-orange-500"
                      />
                      {errors?.driverCode?.[index]?.code && (
                        <p className="text-red-400 text-sm mt-2">{errors.driverCode[index].code.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Reference Solution <span className="text-white/30 font-normal">(function only)</span>
                      </label>
                      <textarea
                        {...register(`referenceSolution.${index}.solutionCode`)}
                        rows={10}
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm outline-none resize-none focus:border-orange-500"
                      />
                      {errors?.referenceSolution?.[index]?.solutionCode && (
                        <p className="text-red-400 text-sm mt-2">{errors.referenceSolution[index].solutionCode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            {isSubmitting ? 'Updating Problem…' : 'Update Problem'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AdminUpdate;