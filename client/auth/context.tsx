import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResponse, DecodedUser } from "../../shared/types/index";
import { authApi } from "./api";
import { clearToken, decodeToken, getToken, isTokenExpired, saveToken } from "./tokens";

interface AuthContextValue {
    user: DecodedUser | null;
    token: string | null;
    isLoading: boolean;
    loginWithCredentials: (
        userId: string,
        password: string,
        remember: boolean,
        trackingStatus: boolean,
    ) => Promise<void>;
    loginWithToken: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

const MOCK_USER: DecodedUser = {
    nameid: "dev_user",
    UserName: "นักพัฒนา (Dev Bypass)",
    UserType: "admin",
    ORG: "DEV",
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<DecodedUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (BYPASS_AUTH) {
            setUser(MOCK_USER);
            setToken("bypass");
            setIsLoading(false);
            return;
        }

        const existingToken = getToken();
        if (existingToken && !isTokenExpired(existingToken)) {
            const decoded = decodeToken(existingToken);
            if (decoded) {
                setUser(decoded);
                setToken(existingToken);
            } else {
                clearToken();
            }
        } else if (existingToken) {
            clearToken();
        }

        setIsLoading(false);
    }, []);

    const loginWithCredentials = useCallback(
        async (userId: string, password: string, remember: boolean, trackingStatus: boolean) => {
            const response = await authApi.post<AuthResponse>("/auth/login", {
                UserId: userId,
                Password: password,
                Org: "OPP",
                TrackingStatus: trackingStatus ? "T" : "F",
            });

            const { token: newToken } = response.data;
            const decoded = decodeToken(newToken);

            if (!decoded) {
                throw new Error("ไม่สามารถถอดรหัส token ได้");
            }

            saveToken(newToken, remember);
            setToken(newToken);
            setUser(decoded);
        },
        [],
    );

    const loginWithToken = useCallback((newToken: string) => {
        const decoded = decodeToken(newToken);
        if (!decoded) {
            throw new Error("ไม่สามารถถอดรหัส token ได้");
        }
        saveToken(newToken, false);
        setToken(newToken);
        setUser(decoded);
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setUser(null);
        window.location.href = "/login";
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                loginWithCredentials,
                loginWithToken,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
    }
    return ctx;
}
