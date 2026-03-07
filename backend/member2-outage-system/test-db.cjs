const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://electricity_user:electricity_pass@localhost:5433/electricity_db',
});

client.connect()
  .then(() => {
    console.log('Connected successfully');
    return client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    client.end();
  });
