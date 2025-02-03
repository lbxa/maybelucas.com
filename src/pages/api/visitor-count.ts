import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const { TURSO_DB_URL, TURSO_DB_AUTH_TOKEN } = import.meta.env;

if (!TURSO_DB_URL || !TURSO_DB_AUTH_TOKEN) {
  throw new Error('Missing required environment variables TURSO_DB_URL or TURSO_DB_AUTH_TOKEN');
}

const client = createClient({
  url: TURSO_DB_URL,
  authToken: TURSO_DB_AUTH_TOKEN
});

export const GET: APIRoute = async () => {
  try {
    // Initialize the counter table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS visitor_counter (
        id INTEGER PRIMARY KEY,
        count INTEGER DEFAULT 0
      )
    `);

    // Insert initial counter if it doesn't exist
    await client.execute(`
      INSERT OR IGNORE INTO visitor_counter (id, count) VALUES (1, 0)
    `);

    // Increment and get the new count
    const result = await client.execute({
      sql: "UPDATE visitor_counter SET count = count + 1 WHERE id = 1 RETURNING count",
      args: []
    });

    return new Response(JSON.stringify({
      count: result.rows[0].count
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update visitor count',
      stack: error
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 