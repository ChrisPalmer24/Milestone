import { timestamp } from "drizzle-orm/pg-core";
import { InferInsertModel as DrizzleInferInsertModel, Table } from "drizzle-orm";

// Common timestamp columns
export const createdAtColumn = () => ({ createdAt: timestamp("created_at").defaultNow() });
// Helper function to create an updatedAt column that automatically updates on row changes
export const updatedAtColumn = () => ({ 
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date()) 
});

export const timestampColumns = () => ({ ...createdAtColumn(), ...updatedAtColumn() });

// Wrapper type around drizzle's InferInsertModel that preserves all arguments
// Its purpose is to remove the custom cuid column from the inferred model as it the InferInsertModel
// does not support custom types
export type InferInsertModelBasic<
  TTable extends Table, 
  TConfig extends {
    dbColumnNames: boolean;
    override?: boolean;
  } = {
    dbColumnNames: false;
    override: false;
  }
> = Omit<DrizzleInferInsertModel<TTable, TConfig>, "id" | "createdAt" | "updatedAt">;


