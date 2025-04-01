import { createId } from "@paralleldrive/cuid2";
import { customType, timestamp } from "drizzle-orm/pg-core";
// Create a custom CUID type that auto-generates IDs by default
export const cuid = customType<{ data: string; config: { mode: 'string' } }>({
  dataType() {
    return 'text';
  },
  toDriver(value: unknown): string {
    // Always generate a new ID for undefined/null values
    if (value === undefined || value === null) {
      return createId();
    }
    return String(value);
  },
  fromDriver(value: unknown): string {
    return String(value);
  }
});

// Helper for ID columns to ensure consistent setup
export const idColumn = () => cuid("id").primaryKey().notNull().$defaultFn(() => createId());

// Common timestamp columns
export const createdAtColumn = () => ({ createdAt: timestamp("created_at").defaultNow().notNull() });
// Helper function to create an updatedAt column that automatically updates on row changes
export const updatedAtColumn = () => ({ 
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date()) 
});

export const timestampColumns = () => ({ ...createdAtColumn(), ...updatedAtColumn() });
