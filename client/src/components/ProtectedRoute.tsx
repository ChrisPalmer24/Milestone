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

  // Don't render anything until we've confirmed authorization
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
