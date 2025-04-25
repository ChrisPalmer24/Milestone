import { Tenant } from "./types";

/**
 * Wrapper function that ensures a tenant exists before executing the given function
 * @param fn The async function to execute if tenant exists
 */
export const requireTenant = async <T>(tenant: Tenant | undefined, fn: (tenant: Tenant) => Promise<T>) => {
  if (!tenant || !tenant.id) {
    throw new Error("Tenant not found");
  }
  return await fn(tenant);
};
