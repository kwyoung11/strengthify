import pg from 'pg';

const axios = require('axios');
const parsePgConnStr = require('pg-connection-string').parse;

const herokuApiKey = process.env.HEROKU_API_KEY;
const herokuPostgresId = process.env.HEROKU_POSTGRES_ID;

const herokuApi = axios.create({
  baseURL: 'https://api.heroku.com/',
  headers: {
    'Authorization': `Bearer ${herokuApiKey}`,
    'Accept': 'application/vnd.heroku+json; version=3',
  },
});

// Pool will be reused for each invocation of the backing container.
let pgPool;

const setupPgPool = async () => {
  const herokuRes = await herokuApi.get(`addons/${herokuPostgresId}/config`);
  const pgConnStr = herokuRes.data[0].value;
  const pgConfig = {
    ...parsePgConnStr(pgConnStr),
    max: 1,
    ssl: { rejectUnauthorized: false },
  };
  pgPool = new pg.Pool(pgConfig);
};

export const hello = async () => {
  if (!pgPool) {
    // "Cold start". Get Heroku Postgres creds and create connection pool.
    await setupPgPool();
  }
  // Else, backing container "warm". Use existing connection pool.

  try {
    const result = await pgPool.query('SELECT now()');

    // Response body must be JSON.
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Go Serverless v1.0!`,
        output: {
          currTimePg: result.rows[0].now,
        },
      }),
    };
  } catch (e) {
    // Return error message in response body for easy debugging.
    // INSECURE - CHANGE FOR PROD
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e.message,
      }),
    };
  }
};
