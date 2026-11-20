import "server-only";
import postgres from "postgres";

type PostgresClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  __digitalVisitingCardDatabase?: PostgresClient;
};

export function getDatabase(): PostgresClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Copy .env.example and set the PostgreSQL connection details.");
  }
  if (!globalForDatabase.__digitalVisitingCardDatabase) {
    globalForDatabase.__digitalVisitingCardDatabase = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return globalForDatabase.__digitalVisitingCardDatabase;
}
