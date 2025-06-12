// @ts-ignore
import { Pool } from "pg";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function getAllUsers(): Promise<User[]> {
  const { rows } = await pool.query(
    "SELECT id, email, password, name FROM users"
  );
  return rows;
}

export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  const { rows } = await pool.query(
    "SELECT id, email, password, name FROM users WHERE email = $1",
    [email]
  );
  return rows[0];
}

export async function validateUser(
  email: string,
  password: string
): Promise<User | undefined> {
  const { rows } = await pool.query(
    "SELECT id, email, password, name FROM users WHERE email = $1 AND password = $2",
    [email, password]
  );
  return rows[0];
}

export async function addUser(user: Omit<User, "id">): Promise<User> {
  const { rows } = await pool.query(
    "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, password, name",
    [user.email, user.password, user.name]
  );
  return rows[0];
}

export async function findUsersByEmails(
  emails: string[]
): Promise<{ id: string; email: string; name: string }[]> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, email, name FROM users WHERE email = ANY($1)`,
      [emails]
    );
    return rows;
  } finally {
    client.release();
  }
}
