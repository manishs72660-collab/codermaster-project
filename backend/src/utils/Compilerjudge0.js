// compilerJudge0.js
// Judge0 helper used ONLY by the standalone "playground" compiler
// (compilerController.js). Kept separate from probelmutlity.js on
// purpose — that file backs the problem submission/run flow and
// expects plaintext (base64_encoded=false) responses. This file uses
// base64 end-to-end instead, because arbitrary playground output can
// contain bytes that aren't valid UTF-8, which makes Judge0's
// plaintext mode fail with:
//   "some attributes for one or more submissions cannot be
//    converted to UTF-8, use base64_encoded=true query parameter"
// Changing probelmutlity.js to fix that would silently affect the
// problem flow too, so it stays untouched.

const axios = require('axios');

const BASE_URL = "https://ce.judge0.com";

const LANGUAGE_IDS = {
  "c++": 54,
  "java": 62,
  "javascript": 63,
  "python": 71,
};

const getLanguageById = (lang) => {
  return LANGUAGE_IDS[lang?.toLowerCase()]; // undefined if unsupported
};

const encodeBase64 = (value) => Buffer.from(value ?? '', 'utf-8').toString('base64');
const decodeBase64 = (value) => (value ? Buffer.from(value, 'base64').toString('utf-8') : value);

const decodeResult = (submission) => ({
  ...submission,
  stdout: decodeBase64(submission.stdout),
  stderr: decodeBase64(submission.stderr),
  compile_output: decodeBase64(submission.compile_output),
  message: decodeBase64(submission.message),
});

const submitBatch = async (submissions) => {
  const encodedSubmissions = submissions.map((s) => ({
    ...s,
    source_code: encodeBase64(s.source_code),
    stdin: encodeBase64(s.stdin),
  }));

  const options = {
    method: 'POST',
    url: `${BASE_URL}/submissions/batch`,
    params: { base64_encoded: 'true' },
    headers: { 'Content-Type': 'application/json' },
    data: { submissions: encodedSubmissions },
  };
  const response = await axios.request(options);
  return response.data;
};

const waiting = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const submitToken = async (resultToken) => {
  const options = {
    method: 'GET',
    url: `${BASE_URL}/submissions/batch`,
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'true',
      fields: '*',
    },
  };

  const maxAttempts = 20; // ~20s ceiling instead of polling forever
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.request(options);
      const result = response.data;
      const isResultObtained = result.submissions.every((r) => r.status_id > 2);
      if (isResultObtained) return result.submissions.map(decodeResult);
    } catch (err) {
      // Surface Judge0's actual error body instead of the generic
      // "Request failed with status code 400" axios message.
      console.error("Judge0 GET /submissions/batch failed:", {
        status: err.response?.status,
        data: err.response?.data,
        tokensSent: resultToken,
      });
      throw new Error(
        err.response?.data ? JSON.stringify(err.response.data) : err.message
      );
    }
    await waiting(1000);
  }
  throw new Error("Judge0 took too long to respond (timed out after 20s).");
};

module.exports = { getLanguageById, submitBatch, submitToken };