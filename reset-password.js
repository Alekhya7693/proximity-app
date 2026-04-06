const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function resetPassword() {
  const client = new Client({
    connectionString: 'postgresql://postgres:QIBjreSToTcjdkknlyvrpzTLnLjujWlT@hopper.proxy.rlwy.net:31840/railway',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // First check column names
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
  console.log('User columns:', cols.rows.map(r => r.column_name).join(', '));

  const hash = await bcrypt.hash('Demo1234!', 10);

  // Try with the correct column name
  const pwCol = cols.rows.find(r => r.column_name.toLowerCase().includes('password'));
  console.log('Password column:', pwCol?.column_name);

  if (pwCol) {
    const colName = '"' + pwCol.column_name + '"';
    const res = await client.query('UPDATE users SET ' + colName + ' = $1 WHERE email = $2 RETURNING id, email', [hash, 'alekhya@mysbscorp.com']);
    console.log('Updated:', res.rows);
  }

  const users = await client.query('SELECT id, email, username, "firstName", status FROM users ORDER BY "createdAt" DESC LIMIT 10');
  console.log('Users:');
  users.rows.forEach(u => console.log(' ', u.email, u.username, u.firstName, u.status));

  await client.end();
}

resetPassword().catch(console.error);
