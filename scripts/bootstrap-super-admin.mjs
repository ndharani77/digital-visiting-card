import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";
import postgres from "postgres";

nextEnv.loadEnvConfig(process.cwd());
const connectionString = process.env.DATABASE_URL;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!connectionString) throw new Error("DATABASE_URL is required.");
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Set BOOTSTRAP_ADMIN_EMAIL to a valid email address.");
}
if (!password || password.length < 14) {
  throw new Error("Set BOOTSTRAP_ADMIN_PASSWORD to a unique password with at least 14 characters.");
}

const sql = postgres(connectionString, { max: 1, connect_timeout: 10, prepare: false });
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (${randomUUID()}, ${email}, ${passwordHash}, 'SUPER_ADMIN')
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  if (!user) throw new Error("An account with this email already exists; no password was changed.");
  console.log("Super Admin account created.");
} finally {
  await sql.end();
}
