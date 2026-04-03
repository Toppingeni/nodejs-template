import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { DecodedUser } from "../../shared/types/index";
import { authApi } from "./api";
import { clearToken, decodeToken, getToken, isTokenExpired, saveToken } from "./tokens";

interface LoginParams {
    userId: string;
    password: string;
    org?: string;
    trackingstatus?: "T" | "F";
    remember?: boolean;
}

interface AuthContextValue {
    user: DecodedUser | null;
    token: string | null;
    isLoading: boolean;
    loginWithCredentials: (params: LoginParams) => Promise<void>;
    loginWithToken: (token: string, opts?: { remember?: boolean }) => void;
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

async function verifyToken(token: string): Promise<boolean> {
    try {
        const response = await authApi.post(
            "/api/user/verify",
            { Token: token },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.status === 200 && response.data === "OK";
    } catch {
        return false;
    }
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
        if (!existingToken) {
            setIsLoading(false);
            return;
        }

        if (isTokenExpired(existingToken)) {
            clearToken();
            setIsLoading(false);
            return;
        }

        const decoded = decodeToken(existingToken);
        if (!decoded) {
            clearToken();
            setIsLoading(false);
            return;
        }

        verifyToken(existingToken)
            .then((isValid) => {
                if (isValid) {
                    setToken(existingToken);
                    setUser(decoded);
                } else {
                    clearToken();
                }
                setIsLoading(false);
            })
            .catch(() => {
                clearToken();
                setIsLoading(false);
            });
    }, []);

    const loginWithCredentials = useCallback(async (params: LoginParams) => {
        const response = await authApi.post("/api/user/login", {
            userId: params.userId,
            password: params.password,
            org: params.org ?? "OPP",
            trackingstatus: params.trackingstatus ?? "F",
        });

        const newToken = response.data?.token as string | undefined;
        if (!newToken) {
            throw new Error("ไม่ได้รับ token จากเซิร์ฟเวอร์");
        }

        const decoded = decodeToken(newToken);
        if (!decoded) {
            throw new Error("ไม่สามารถถอดรหัส token ได้");
        }

        saveToken(newToken, params.remember ?? true);
        setToken(newToken);
        setUser(decoded);
    }, []);

    const loginWithToken = useCallback((newToken: string, opts?: { remember?: boolean }) => {
        const decoded = decodeToken(newToken);
        if (!decoded || isTokenExpired(newToken)) {
            throw new Error("Invalid or expired token");
        }
        saveToken(newToken, opts?.remember ?? true);
        setToken(newToken);
        setUser(decoded);
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setUser(null);
        window.location.href = "/login";
    }, []);

    const value = useMemo(
        () => ({ user, token, isLoading, loginWithCredentials, loginWithToken, logout }),
        [user, token, isLoading, loginWithCredentials, loginWithToken, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
    }
    return ctx;
}
