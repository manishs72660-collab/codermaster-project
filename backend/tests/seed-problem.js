const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  console.log('🔌 Connecting to:', process.env.CONNECT_STRING?.slice(0, 30) + '...');
  await mongoose.connect(process.env.CONNECT_STRING);
  console.log('✅ DB connected');

  const problemSchema = new mongoose.Schema({
    title: String,
    description: String,
    difficulty: String,
    tags: String,
    visibleTestCases: Array,
    hiddenTestCases: Array,
    startCode: Array,
    driverCode: Array,
    referenceSolution: Array,
    problemCreator: mongoose.Schema.Types.ObjectId,
  });

  const Problem = mongoose.models.problem || mongoose.model('problem', problemSchema);

  const existing = await Problem.findOne({ title: 'Load Test Dummy Problem' });
  if (existing) {
    console.log('\n✅ Problem already exists. ID:', existing._id.toString());
    await mongoose.disconnect();
    return;
  }

  const problem = await Problem.create({
    title: 'Load Test Dummy Problem',
    description: 'Dummy problem for load testing',
    difficulty: 'easy',
    tags: 'array',
    visibleTestCases: [{ input: '1 2', output: '3', explanation: 'Basic addition' }],
    hiddenTestCases: [
      { input: '1 2', output: '3' },
      { input: '3 4', output: '7' },
    ],
    startCode: [
      { language: 'javascript', initialCode: 'function solve() { return true; }' },
      { language: 'cpp', initialCode: 'bool solve() { return true; }' },
      { language: 'java', initialCode: 'class Main { static boolean solve() { return true; } }' },
      { language: 'python', initialCode: 'def solve(): return True' },
    ],
    driverCode: [
      { language: 'javascript', code: 'console.log(solve());' },
      { language: 'cpp', code: 'int main() { cout << solve(); }' },
      { language: 'java', code: 'public static void main(String[] args) { System.out.println(solve()); }' },
      { language: 'python', code: 'print(solve())' },
    ],
    referenceSolution: [],
    problemCreator: new mongoose.Types.ObjectId(),
  });

  console.log('\n🎯 NEW LOCAL PROBLEM_ID:', problem._id.toString());
  console.log('👉 Copy this ID and paste in tests/load-test.js\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});