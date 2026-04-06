const https = require('https');
const BASE = 'https://proximity-backend-production-aee2.up.railway.app/api/v1';

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const opts = { hostname: url.hostname, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = https.request(opts, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve({s:res.statusCode,d:JSON.parse(d)})}catch{resolve({s:res.statusCode,d})} }); });
    r.on('error', e => resolve({s:0,d:e.message}));
    if (body) r.write(JSON.stringify(body)); r.end();
  });
}

async function setup() {
  // Login both
  let r1 = await req('POST', '/auth/login', {email:'demo@myko.app', password:'Demo1234!'});
  const demoToken = r1.d?.tokens?.accessToken;
  console.log('Demo login:', r1.s, demoToken ? 'OK' : 'FAIL');

  let r2 = await req('POST', '/auth/login', {email:'alekhya@mysbscorp.com', password:'Demo1234!'});
  const alekToken = r2.d?.tokens?.accessToken;
  console.log('Alekhya login:', r2.s, alekToken ? 'OK' : 'FAIL');

  // Set locations nearby
  r1 = await req('POST', '/location/update', {latitude: 17.3850, longitude: 78.4867}, demoToken);
  console.log('Demo location:', r1.s);
  r2 = await req('POST', '/location/update', {latitude: 17.3855, longitude: 78.4870}, alekToken);
  console.log('Alekhya location:', r2.s);

  // Unblock if needed
  r1 = await req('GET', '/safety/blocked', null, demoToken);
  console.log('Demo blocked:', r1.s, JSON.stringify(r1.d).substring(0, 200));

  // Check discovery
  r1 = await req('GET', '/discovery/feed?page=1&radius=50', null, demoToken);
  console.log('Demo feed:', r1.s, 'total:', r1.d?.total, 'candidates:', r1.d?.candidates?.length);
  if (r1.d?.candidates) r1.d.candidates.forEach(c => console.log('  -', c.displayName || c.firstName, c.userId?.substring(0,8)));

  r2 = await req('GET', '/discovery/feed?page=1&radius=50', null, alekToken);
  console.log('Alekhya feed:', r2.s, 'total:', r2.d?.total, 'candidates:', r2.d?.candidates?.length);
  if (r2.d?.candidates) r2.d.candidates.forEach(c => console.log('  -', c.displayName || c.firstName, c.userId?.substring(0,8)));
}

setup().catch(console.error);
