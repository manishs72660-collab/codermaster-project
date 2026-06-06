import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
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
      language: z.enum(['c++', 'javascript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).min(1, 'At least one language required'),

  // ✅ NEW: driver boilerplate per language
  driverCode: z.array(
    z.object({
      language: z.enum(['c++', 'javascript']),
      code: z.string().min(1, 'Driver code is required')
    })
  ).min(1, 'At least one driver code required'),

  // ✅ CHANGED: solutionCode = function only (no I/O boilerplate)
  referenceSolution: z.array(
    z.object({
      language: z.enum(['c++', 'javascript']),
      solutionCode: z.string().min(1, 'Solution code is required')
    })
  ).min(1, 'At least one solution required')
});

function AdminPanel() {
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [
        { language: 'c++',        initialCode: 'int linearSearch(vector<int>& nums, int target) {\n    // Write your code here\n}' },
        { language: 'javascript', initialCode: 'function linearSearch(nums, target) {\n  // Write your code here\n}' }
      ],
      driverCode: [
        {
          language: 'c++',
          code: 'int main() {\n    string line;\n    getline(cin, line);\n    vector<int> nums;\n    int num = 0; bool inNumber = false;\n    for (char c : line) {\n        if (isdigit(c)) { num = num*10+(c-\'0\'); inNumber=true; }\n        else if (inNumber) { nums.push_back(num); num=0; inNumber=false; }\n    }\n    if (inNumber) nums.push_back(num);\n    int target; cin >> target;\n    cout << linearSearch(nums, target);\n    return 0;\n}'
        },
        {
          language: 'javascript',
          code: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nconst nums = JSON.parse(input[0]);\nconst target = parseInt(input[1]);\nconsole.log(linearSearch(nums, target));"
        }
      ],
      referenceSolution: [
        { language: 'c++',        solutionCode: '' },
        { language: 'javascript', solutionCode: '' }
      ]
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

  const onSubmit = async (data) => {
    try {
      await axiosClient.post('/problem/create', data);
      alert('Problem created successfully!');
      navigate('/');
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const languages = [
    { value: 'c++',        label: 'C++' },
    { value: 'javascript', label: 'JavaScript' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Create New Problem</h1>
          <p className="text-white/50 mt-2">
            Add coding challenges, test cases, and reference solutions.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* ── Basic Information ── */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
                <input
                  {...register("title")}
                  placeholder="Two Sum"
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
                  placeholder="Write the complete problem description..."
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
            {errors?.visibleTestCases && <p className="text-red-400 text-sm mb-4">{errors.visibleTestCases.message}</p>}
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
    placeholder={"[4,2,7,1,9]\n7"}
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
            {errors?.hiddenTestCases && <p className="text-red-400 text-sm mb-4">{errors.hiddenTestCases.message}</p>}
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
    placeholder={"[4,2,7,1,9]\n7"}
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
            <p className="text-white/40 text-sm mb-8 font-mono">
              Each language needs 3 things: what the user sees, the I/O driver, and your reference solution function.
            </p>

            <div className="space-y-10">
              {languages.map(({ value, label }, index) => (
                <div key={value} className="border border-white/10 rounded-2xl p-6 bg-[#1a1a1a]">
                  <h3 className="text-xl font-semibold mb-6 text-orange-500">{label}</h3>

                  <div className="space-y-6">

                    {/* Initial Code — shown to user */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Initial Code <span className="text-white/30 font-normal">(shown to user — function signature only)</span>
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

                    {/* Driver Code — backend only */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Driver Code <span className="text-white/30 font-normal">(never shown to user — reads stdin, calls function, prints output)</span>
                      </label>
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg px-4 py-2 mb-2 text-xs text-orange-300/70 font-mono">
                        ⚠ This is injected by your backend before sending to Judge0. Do not include the function here.
                      </div>
                      <textarea
                        {...register(`driverCode.${index}.code`)}
                        rows={8}
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm outline-none resize-none focus:border-orange-500"
                      />
                      {errors?.driverCode?.[index]?.code && (
                        <p className="text-red-400 text-sm mt-2">{errors.driverCode[index].code.message}</p>
                      )}
                    </div>

                    {/* Reference Solution — function only */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Reference Solution <span className="text-white/30 font-normal">(function only — no I/O boilerplate)</span>
                      </label>
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-2 mb-2 text-xs text-green-300/70 font-mono">
                        ✓ Backend will wrap this with Driver Code above to validate against test cases.
                      </div>
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
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg"
          >
            Create Problem
          </button>

        </form>
      </div>
    </div>
  );
}

export default AdminPanel;