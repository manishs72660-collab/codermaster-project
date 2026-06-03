const axios = require('axios');

const BASE_URL = "https://ce.judge0.com";

const getLanguageById = (lang) => {
  const language = {
    "c++": 54,
    "java": 62,
    "javascript": 63
  };
  const id = language[lang.toLowerCase()];
  if (!id) throw new Error(`Unsupported language: ${lang}`);
  return id;
};

const submitBatch = async (submissions) => {
  const options = {
    method: 'POST',
    url: `${BASE_URL}/submissions/batch`,
    params: { base64_encoded: 'false' },
    headers: { 'Content-Type': 'application/json' },
    data: { submissions }
  };
  const response = await axios.request(options);
  return response.data;
};

const waiting = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const submitToken = async (resultToken) => {
  const options = {
    method: 'GET',
    url: `${BASE_URL}/submissions/batch`,
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'false',
      fields: '*'
    }
  };

  while (true) {
    const response = await axios.request(options);
    const result = response.data;
    const isResultObtained = result.submissions.every((r) => r.status_id > 2);
    if (isResultObtained) return result.submissions;
    await waiting(1000);
  }
};

module.exports = { getLanguageById, submitBatch, submitToken };