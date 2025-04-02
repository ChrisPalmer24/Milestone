import { ReactNode, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useSession } from "../hooks/use-session";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isInitialUserLoading, isAuthenticated } = useSession();
  const [, navigate] = useLocation();

  const path = window.location.pathname;

  const redirectUnAuth = useCallback(() => {
    if (!isAuthenticated) {
      navigate(`${redirectTo}?rt=${encodeURIComponent(path)}`);
    }
    // We only want the function to change if requireAuth or isAuthenticated changes
    //We do not want to change the the function for every render or if path changes.
  }, [isAuthenticated]);

  useEffect(() => {
    // For protected routes
    if (!isInitialUserLoading) {
      redirectUnAuth();
    }
  }, [isInitialUserLoading]);

  // Show loading state while checking authentication
  if (isInitialUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="h-12 w-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading your data...</p>
      </div>
    );
  }
  
  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
