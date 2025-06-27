const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_VtY2S4DcziOR@ep-red-feather-a51gsrxj-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

client.connect()
  .then(() => {
    console.log('✅ Database connected!');
    return client.query('SELECT 1');
  })
  .then(() => {
    console.log('✅ Query successful!');
    client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
  });