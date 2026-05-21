#!/usr/bin/env node
const axios = require('axios');

const base = process.argv[2] || process.env.BASE_URL || 'http://localhost:8000';
const timeout = 8000;

const endpoints = [
  '/',
  '/api/auth/me/',
  '/api/schools/settings/',
  '/api/terms/',
  '/api/healthz/',
];

async function run() {
  console.log(`Running smoke tests against: ${base}`);
  const results = [];

  for (const ep of endpoints) {
    const url = new URL(ep, base).toString();
    try {
      const res = await axios.get(url, { timeout });
      results.push({ endpoint: ep, status: res.status });
      console.log(`OK  ${ep} -> ${res.status}`);
    } catch (err) {
      const code = err.response ? err.response.status : 'NO_RESPONSE';
      console.error(`ERR ${ep} -> ${code}`);
      results.push({ endpoint: ep, status: code, error: err.message });
    }
  }

  const failed = results.filter(r => typeof r.status !== 'number' || r.status >= 400);
  if (failed.length > 0) {
    console.error('\nSmoke tests failed for endpoints:');
    failed.forEach(f => console.error(` - ${f.endpoint}: ${f.status}`));
    process.exit(2);
  }

  console.log('\nAll smoke tests passed');
}

run();
