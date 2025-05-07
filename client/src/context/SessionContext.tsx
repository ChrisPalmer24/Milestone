import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useReducer,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
//import { setAuthenticated } from "../lib/query-client";
import { SessionUser } from "shared/schema";

// Auth state interface
interface SessionState {
  user: SessionUser | null;
  isLoginLoading: boolean;
  isInitialUserLoading: boolean;
  isInitialUserLoadFailed: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  profileImage: string | null;
}

// Auth actions
type SessionAction =
  | { type: "LOGIN_LOADING" }
  | { type: "LOGIN_COMPLETE" }
  | { type: "INITIAL_USER_LOADING" }
  | { type: "INITIAL_USER_LOADED"; payload: SessionUser | null }
  | { type: "INITIAL_USER_LOAD_FAILED" }
  | { type: "AUTH_SUCCESS"; payload: SessionUser }
  | { type: "AUTH_ERROR"; payload: Error }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_INITIALIZED" }
  | { type: "UPDATE_PROFILE_IMAGE"; payload: string | null };

// Initial state
const initialState: SessionState = {
  user: null,
  isLoginLoading: false,
  isInitialUserLoading: true,
  isInitialUserLoadFailed: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
  profileImage: null,
};

// Original AuthContext type for backward compatibility
// Now only includes state properties, no methods
interface SessionContextType {
  user: SessionUser | null;
  isLoginLoading: boolean;
  isInitialUserLoading: boolean;
  isInitialUserLoadFailed: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  profileImage: string | null;
}

// Auth reducer
const sessionReducer = (
  state: SessionState,
  action: SessionAction
): SessionState => {
  switch (action.type) {
    case "LOGIN_LOADING":
      return { ...state, isLoginLoading: true, error: null };
    case "LOGIN_COMPLETE":
      return { ...state, isLoginLoading: false };
    case "INITIAL_USER_LOADING":
      return {
        ...state,
        isInitialUserLoading: true,
        isInitialUserLoadFailed: false,
      };
    case "INITIAL_USER_LOADED":
      return {
        ...state,
        isInitialUserLoading: false,
        isInitialUserLoadFailed: false,
        ...(action.payload
          ? {
              user: action.payload,
              isAuthenticated: true,
            }
          : {}),
      };
    case "INITIAL_USER_LOAD_FAILED":
      return {
        ...state,
        isInitialUserLoading: false,
        isInitialUserLoadFailed: true,
        isAuthenticated: false,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isLoginLoading: false,
        isInitialUserLoading: false,
        isInitialUserLoadFailed: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        isLoginLoading: false,
        isInitialUserLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        isLoginLoading: false,
        isInitialUserLoading: false,
        isInitialUserLoadFailed: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case "AUTH_INITIALIZED":
      return {
        ...state,
        isInitialized: true,
        isInitialUserLoading: false,
      };
    case "UPDATE_PROFILE_IMAGE":
      return {
        ...state,
        profileImage: action.payload,
      };
    default:
      return state;
  }
};

// Create contexts for state and dispatch
const SessionStateContext = createContext<SessionState | undefined>(undefined);
const SessionDispatchContext = createContext<
  React.Dispatch<SessionAction> | undefined
>(undefined);

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Initialize profile image from localStorage
  useEffect(() => {
    const savedProfileImage = localStorage.getItem("profileImage");
    if (savedProfileImage) {
      dispatch({ type: "UPDATE_PROFILE_IMAGE", payload: savedProfileImage });
    }
  }, []);

  // Remove the initial session check query since it's now handled by useUser hook

  // Update query client authentication state when auth state changes
  // useEffect(() => {
  //   setAuthenticated(state.isAuthenticated);
  // }, [state.isAuthenticated]);

  // Provide both the new state/dispatch contexts and the original context for backward compatibility
  return (
    <SessionStateContext.Provider value={state}>
      <SessionDispatchContext.Provider value={dispatch}>
        <SessionContext.Provider
          value={{
            user: state.user,
            isLoginLoading: state.isLoginLoading,
            isInitialUserLoading: state.isInitialUserLoading,
            isInitialUserLoadFailed: state.isInitialUserLoadFailed,
            error: state.error,
            isAuthenticated: state.isAuthenticated,
            profileImage: state.profileImage,
          }}
        >
          {children}
        </SessionContext.Provider>
      </SessionDispatchContext.Provider>
    </SessionStateContext.Provider>
  );
}

// Hook to access auth state
export function useSessionState() {
  const context = useContext(SessionStateContext);
  if (context === undefined) {
    throw new Error("useSessionState must be used within an SessionProvider");
  }
  return context;
}

// Hook to access auth dispatch
export function useSessionDispatch() {
  const context = useContext(SessionDispatchContext);
  if (context === undefined) {
    throw new Error(
      "useSessionDispatch must be used within an SessionProvider"
    );
  }
  return context;
}

// Original useAuth hook for backward compatibility
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within an SessionProvider");
  }
  return context;
}
