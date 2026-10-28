// tests/seed-users.js
// Run ONCE to pre-create 100 load-test users
// Usage: node tests/seed-users.js

const BASE_URL = 'http://localhost:3000';
const TOTAL_USERS = 100;
const PASSWORD = 'TestPass123';

async function registerUser(i) {
  const email = `loadtest_${i}@cm.com`;
  const payload = {
    firstName: 'Load',
    lastName: `User${i}`,
    emailId: email,
    password: PASSWORD,
  };

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (res.status === 201) return { email, status: 'created' };
    if (res.status === 409) return { email, status: 'exists' };
    return { email, status: `failed_${res.status}` };
  } catch (err) {
    return { email, status: `error_${err.message}` };
  }
}

async function main() {
  console.log(`🚀 Registering ${TOTAL_USERS} users...`);
  const start = Date.now();

  // Batch me 10 parallel requests (server ko overwhelm na karein)
  const BATCH = 10;
  const results = [];

  for (let i = 0; i < TOTAL_USERS; i += BATCH) {
    const batch = [];
    for (let j = i; j < Math.min(i + BATCH, TOTAL_USERS); j++) {
      batch.push(registerUser(j));
    }
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    console.log(`   Progress: ${Math.min(i + BATCH, TOTAL_USERS)}/${TOTAL_USERS}`);
  }

  const created = results.filter(r => r.status === 'created').length;
  const exists = results.filter(r => r.status === 'exists').length;
  const failed = results.filter(r => r.status.startsWith('failed') || r.status.startsWith('error'));

  console.log(`\n✅ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`   Created: ${created}`);
  console.log(`   Already existed: ${exists}`);
  console.log(`   Failed: ${failed.length}`);
  if (failed.length) console.log('   Failed emails:', failed.map(f => f.email).slice(0, 5));
}

main();