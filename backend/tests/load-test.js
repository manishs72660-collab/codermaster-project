import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const PROBLEM_ID = '6a782f90a171715df2a29fd8';// ⚠️ Apna real Problem ID
const TOTAL_USERS = 100;
const PASSWORD = 'TestPass123';

export const options = {
  setupTimeout: '180s', // Zyada buffer
  stages: [
    { duration: '10s', target: 100 },
    { duration: '30s', target: 100 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

// 🔥 SETUP: Parallel logins via http.batch() — 100 logins in ~5s
export function setup() {
  console.log('🔐 Logging in 100 users via parallel batch...');
  const start = Date.now();

  const sessions = [];
  const BATCH_SIZE = 25; // 25 at a time, server overwhelm na ho

  for (let startIdx = 0; startIdx < TOTAL_USERS; startIdx += BATCH_SIZE) {
    const batchRequests = [];
    for (let i = startIdx; i < Math.min(startIdx + BATCH_SIZE, TOTAL_USERS); i++) {
      batchRequests.push({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        body: JSON.stringify({ emailId: `loadtest_${i}@cm.com`, password: PASSWORD }),
        params: { headers: { 'Content-Type': 'application/json' } },
      });
    }

    const responses = http.batch(batchRequests);

    responses.forEach((res, idx) => {
      const globalIdx = startIdx + idx;
      if (res.status === 200 && res.cookies) {
        const cookieStr = Object.entries(res.cookies)
          .map(([k, v]) => `${k}=${v[0].value}`)
          .join('; ');
        sessions.push({ email: `loadtest_${globalIdx}@cm.com`, cookie: cookieStr });
      }
    });

    console.log(`   Batch done: ${Math.min(startIdx + BATCH_SIZE, TOTAL_USERS)}/${TOTAL_USERS}`);
  }

  console.log(`✅ ${sessions.length}/${TOTAL_USERS} sessions ready in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  
  if (sessions.length === 0) {
    throw new Error('No sessions! Run `node tests/seed-users.js` first.');
  }
  return sessions;
}

// ✅ MAIN: Sirf submit karo
export default function (sessions) {
  const session = sessions[(__VU - 1) % sessions.length];

  const payload = JSON.stringify({
    language: 'javascript',
    code: 'function solve() { return true; }',
  });

  const res = http.post(`${BASE_URL}/code/submit/${PROBLEM_ID}`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': session.cookie,
    },
    tags: { name: 'Submit Code' },
  });

  check(res, {
    'Queued (202)': (r) => r.status === 202 || r.status === 201,
    'Response < 500ms': (r) => r.timings.duration < 500,
    'Not Rate Limited (429)': (r) => r.status !== 429,
    'Not Auth Error (401)': (r) => r.status !== 401,
  });

  sleep(1.5);
}