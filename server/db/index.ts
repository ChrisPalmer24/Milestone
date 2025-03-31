import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema/index";

export function createDatabaseConnection() {

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }

  // Check if we're using a local Neon database
  const isLocalDb = /127.0.0.1|localhost/.test(databaseUrl);
  
  const db = isLocalDb
    ? drizzleNodePostgres({
        connection: databaseUrl,
        schema,
      })
    : drizzleNeon({
        //connection: databaseUrl?.replace('.us-east-2', '-pooler.us-east-2');,
        connection: databaseUrl,
        schema,
        ws: ws,
        // poolConfig: {
        //   maxConns: 5,
        //   maxIdleTimeMs: 30000,
        //   connectionTimeoutMs: 10000
        // }
      });

  return {
    db,
    isLocalDb
  };
}

// Create a singleton instance
const { db, isLocalDb } = createDatabaseConnection();

export { db, isLocalDb }; 

export type Database = typeof db;
