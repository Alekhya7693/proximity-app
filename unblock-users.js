const { Client } = require('pg');

async function unblock() {
  const client = new Client({
    connectionString: 'postgresql://postgres:QIBjreSToTcjdkknlyvrpzTLnLjujWlT@hopper.proxy.rlwy.net:31840/railway',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // Check report columns
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'reports'");
  console.log('Report columns:', cols.rows.map(r => r.column_name).join(', '));

  // Delete reports with correct column names
  const repCol = cols.rows.find(r => r.column_name.includes('reported') || r.column_name.includes('Reported'));
  if (repCol) {
    const r3 = await client.query('DELETE FROM reports WHERE "reporterId" IN (SELECT id FROM users WHERE email IN ($1, $2)) RETURNING *', ['demo@myko.app', 'alekhya@mysbscorp.com']);
    console.log('Deleted reports:', r3.rowCount);
  }

  // Delete matches
  const matchCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'matches'");
  console.log('Match columns:', matchCols.rows.map(r => r.column_name).join(', '));

  const r4 = await client.query('DELETE FROM matches WHERE "userId1" IN (SELECT id FROM users WHERE email IN ($1, $2)) AND "userId2" IN (SELECT id FROM users WHERE email IN ($1, $2)) RETURNING *', ['demo@myko.app', 'alekhya@mysbscorp.com']);
  console.log('Deleted matches:', r4.rowCount);

  // Make both onboarding complete
  const r5 = await client.query('UPDATE users SET "isOnboardingComplete" = true WHERE email IN ($1, $2) RETURNING email, "isOnboardingComplete"', ['demo@myko.app', 'alekhya@mysbscorp.com']);
  console.log('Onboarding:', r5.rows);

  await client.end();
}

unblock().catch(console.error);
