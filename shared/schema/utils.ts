import { timestamp } from "drizzle-orm/pg-core";

// Common timestamp columns
export const createdAtColumn = () => ({ createdAt: timestamp("created_at").defaultNow().notNull() });
// Helper function to create an updatedAt column that automatically updates on row changes
export const updatedAtColumn = () => ({ 
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date()) 
});

export const timestampColumns = () => ({ ...createdAtColumn(), ...updatedAtColumn() });
