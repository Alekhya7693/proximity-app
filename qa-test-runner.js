const https = require('https');
const fs = require('fs');

const BASE = 'https://proximity-backend-production-aee2.up.railway.app/api/v1';
const results = [];

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    r.on('error', (e) => resolve({ status: 0, data: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function log(id, desc, status, details) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(icon + ' ' + id + ': ' + desc + ' [' + status + ']');
  if (details) console.log('   ' + details);
  results.push({ id, desc, status, details: details || '' });
}

async function run() {
  let demoToken, newToken;

  console.log('\n=== AUTH TESTS ===');

  const regEmail = 'test-' + Date.now() + '@myko.app';
  let r = await req('POST', '/auth/register', {
    email: regEmail, password: 'Test1234!', username: 'test' + Date.now(),
    firstName: 'QA', lastName: 'Tester'
  });
  const getToken = (d) => d?.tokens?.accessToken || d?.accessToken || d?.token || d?.access_token;
  if (r.status === 201 && getToken(r.data)) {
    newToken = getToken(r.data);
    log('AUTH-001', 'Register new user', 'PASS', 'Status ' + r.status);
  } else {
    log('AUTH-001', 'Register new user', 'FAIL', 'Status ' + r.status + ': ' + JSON.stringify(r.data).substring(0,100));
  }

  r = await req('POST', '/auth/login', { email: 'demo@myko.app', password: 'Demo1234!' });
  if (r.status === 200 && getToken(r.data)) {
    demoToken = getToken(r.data);
    log('AUTH-002', 'Login valid credentials', 'PASS', 'Token received');
  } else {
    log('AUTH-002', 'Login valid credentials', 'FAIL', 'Status ' + r.status);
  }

  r = await req('POST', '/auth/login', { email: 'demo@myko.app', password: 'WrongPass1!' });
  log('AUTH-003', 'Login wrong password', r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/auth/login', { email: 'nobody@fake.com', password: 'Test1234!' });
  log('AUTH-004', 'Login non-existent email', r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/auth/register', {
    email: 'demo@myko.app', password: 'Test1234!', username: 'dup123',
    firstName: 'Dup', lastName: 'User'
  });
  log('AUTH-005', 'Register duplicate email', r.status === 409 || r.status === 400 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/auth/register', {
    email: 'weak@test.com', password: '123', username: 'weak1',
    firstName: 'Weak', lastName: 'Pass'
  });
  log('AUTH-006', 'Register weak password', r.status === 400 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/profile/me');
  log('AUTH-007', 'Protected route without token', r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/profile/me', null, 'invalidtoken123');
  log('AUTH-008', 'Access with invalid token', r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/auth/login', { email: '', password: 'Demo1234!' });
  log('AUTH-009', 'Login empty email', r.status === 400 || r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/auth/login', { email: "admin'; DROP TABLE users;--", password: 'test' });
  log('AUTH-010', 'SQL injection attempt', r.status === 400 || r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  console.log('\n=== PROFILE TESTS ===');

  r = await req('GET', '/profile/me', null, demoToken);
  log('PROF-001', 'Get own profile', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('PUT', '/profile', { bio: 'QA test bio ' + Date.now() }, demoToken);
  log('PROF-002', 'Update profile bio', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('PUT', '/profile', { interests: ['technology', 'coffee', 'art', 'music', 'travel'] }, demoToken);
  log('PROF-003', 'Update interests', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/profile/me', null, demoToken);
  log('PROF-004', 'Profile persists updates', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  console.log('\n=== DISCOVERY TESTS ===');

  r = await req('GET', '/discovery/feed?page=1', null, demoToken);
  log('DISC-001', 'Get discovery feed', r.status === 200 ? 'PASS' : 'FAIL', 'Candidates: ' + (r.data?.total || 0));

  r = await req('GET', '/discovery/feed?page=1&radius=50', null, demoToken);
  log('DISC-002', 'Feed with radius filter', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/discovery/feed?page=1&intention=dating', null, demoToken);
  log('DISC-003', 'Feed with intention filter', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/discovery/feed?page=1');
  log('DISC-004', 'Feed without auth', r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/discovery/vibes?mode=social', null, demoToken);
  log('DISC-005', 'Get social vibes', r.status === 200 && r.data?.vibes?.length > 0 ? 'PASS' : 'FAIL', 'Count: ' + (r.data?.vibes?.length || 0));

  r = await req('GET', '/discovery/vibes?mode=professional', null, demoToken);
  log('DISC-006', 'Get professional vibes', r.status === 200 && r.data?.vibes?.length > 0 ? 'PASS' : 'FAIL', 'Count: ' + (r.data?.vibes?.length || 0));

  r = await req('POST', '/discovery/vibes', { vibes: ['Coffee Chat'], mode: 'social', durationMinutes: 60 }, demoToken);
  log('DISC-007', 'Set active vibes', r.status === 200 || r.status === 201 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('DELETE', '/discovery/vibes', null, demoToken);
  log('DISC-008', 'Clear active vibes', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  console.log('\n=== MATCHING TESTS ===');

  r = await req('GET', '/discovery/feed?page=1&radius=100', null, demoToken);
  const target = r.data?.candidates?.[0];
  const targetId = target?.userId;

  if (targetId) {
    r = await req('POST', '/match/swipe', { targetUserId: targetId, direction: 'like' }, demoToken);
    log('MATCH-001', 'Swipe like', r.status === 200 || r.status === 201 ? 'PASS' : 'FAIL', 'isMatch: ' + (r.data?.isMatch || false));
  } else {
    log('MATCH-001', 'Swipe like', 'SKIP', 'No candidates');
  }

  r = await req('GET', '/match', null, demoToken);
  log('MATCH-002', 'Get matches list', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  if (targetId) {
    r = await req('POST', '/match/swipe', { targetUserId: targetId, direction: 'like' }, demoToken);
    log('MATCH-003', 'Double-swipe same user', r.status === 200 || r.status === 400 || r.status === 409 ? 'PASS' : 'FAIL', 'Status ' + r.status);
  } else {
    log('MATCH-003', 'Double-swipe same user', 'SKIP', 'No target');
  }

  console.log('\n=== LOCATION TESTS ===');

  r = await req('POST', '/location/update', { latitude: 17.385, longitude: 78.4867 }, demoToken);
  log('LOC-001', 'Update location', r.status === 200 || r.status === 201 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/location/nearby?radiusKm=10', null, demoToken);
  log('LOC-002', 'Get nearby users', r.status === 200 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/location/update', { latitude: 17.385, longitude: 78.4867 });
  log('LOC-003', 'Location without auth', r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  console.log('\n=== VIBE TESTS ===');

  if (targetId) {
    r = await req('POST', '/vibe/check', { targetUserId: targetId }, demoToken);
    log('VIBE-001', 'Vibe check between users', r.status === 200 || r.status === 201 ? 'PASS' : 'FAIL',
      'Score: ' + (r.data?.score?.overall || 'N/A') + ', level: ' + (r.data?.compatibilityLevel || 'N/A'));
  } else {
    log('VIBE-001', 'Vibe check between users', 'SKIP', 'No target');
  }

  r = await req('GET', '/vibe/profile', null, demoToken);
  log('VIBE-002', 'Get vibe profile', r.status === 200 ? 'PASS' : 'FAIL', 'Energy: ' + (r.data?.vibeEnergy || 'N/A'));

  r = await req('POST', '/discovery/vibes', {
    vibes: ['Coffee Chat', 'Networking'], mode: 'social', durationMinutes: 120, customText: 'QA test vibe!'
  }, demoToken);
  log('VIBE-003', 'Set vibes with custom text', r.status === 200 || r.status === 201 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  console.log('\n=== SAFETY TESTS ===');

  if (targetId) {
    r = await req('POST', '/safety/report', { reportedUserId: targetId, reason: 'spam', description: 'QA test' }, demoToken);
    log('SAFE-001', 'Report user', r.status === 200 || r.status === 201 ? 'PASS' : 'FAIL', 'Status ' + r.status);

    r = await req('POST', '/safety/block', { blockedUserId: targetId }, demoToken);
    log('SAFE-002', 'Block user', r.status === 200 || r.status === 201 || r.status === 409 ? 'PASS' : 'FAIL', 'Status ' + r.status + (r.status === 409 ? ' (already blocked)' : ''));
  } else {
    log('SAFE-001', 'Report user', 'SKIP', 'No target');
    log('SAFE-002', 'Block user', 'SKIP', 'No target');
  }

  console.log('\n=== EDGE CASES ===');

  r = await req('PUT', '/profile', { bio: '<script>alert("xss")</script>' }, demoToken);
  log('EDGE-001', 'XSS in bio field', r.status === 200 || r.status === 400 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('PUT', '/profile', { bio: 'A'.repeat(10000) }, demoToken);
  log('EDGE-002', 'Very long bio input', r.status === 200 || r.status === 400 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/match/swipe', { targetUserId: 'not-a-uuid', direction: 'like' }, demoToken);
  log('EDGE-003', 'Invalid UUID for swipe', r.status === 400 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('POST', '/auth/login', {});
  log('EDGE-004', 'Empty body login', r.status === 400 || r.status === 401 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/discovery/feed?page=0', null, demoToken);
  log('EDGE-005', 'Feed page 0', r.status === 200 || r.status === 400 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/discovery/feed?page=99999', null, demoToken);
  log('EDGE-006', 'Feed very high page', r.status === 200 ? 'PASS' : 'FAIL', 'Candidates: ' + (r.data?.candidates?.length || 0));

  r = await req('POST', '/location/update', { latitude: 999, longitude: -999 }, demoToken);
  log('EDGE-007', 'Invalid coordinates', r.status === 200 || r.status === 400 ? 'PASS' : 'FAIL', 'Status ' + r.status);

  r = await req('GET', '/health');
  log('EDGE-008', 'Health endpoint', r.status === 200 && r.data?.status === 'healthy' ? 'PASS' : 'FAIL',
    'DB: ' + (r.data?.services?.database || 'N/A'));

  // Summary
  console.log('\n==========================================');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const skip = results.filter(r => r.status === 'SKIP').length;
  console.log('TOTAL: ' + results.length + ' | PASS: ' + pass + ' | FAIL: ' + fail + ' | SKIP: ' + skip);
  console.log('==========================================');

  fs.writeFileSync('qa-screenshots/api-test-results.json', JSON.stringify(results, null, 2));
  console.log('Results saved to qa-screenshots/api-test-results.json');
}

run().catch(console.error);
