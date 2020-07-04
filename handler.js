'use strict';

const pg = require('pg');

// Heroku PG credentials hard-coded for easy development.
// INSECURE - CHANGE FOR PROD
const pgConfig = {
  max: 1,
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PWD,
  database: process.env.DATABASE_DB,
  ssl: true,
};

// Pool will be reused for each invocation of the backing container.
let pgPool;

const setupPgPool = () => {
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
