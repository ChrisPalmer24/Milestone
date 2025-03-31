

/**
 * Gets the temporary user ID from environment variables.
 * This is used for demo purposes in the browser environment.
 */
export const getTempUserId = (): string => {
  const tempUserId = import.meta.env.VITE_TEMP_USER_ID;
  if (!tempUserId) {  
    throw new Error('VITE_TEMP_USER_ID is not set');
  }
  return tempUserId;
};

export const getEndpointPathWithUserId = (path: string) => {
  return path.replace("{userId}", getTempUserId());
};

