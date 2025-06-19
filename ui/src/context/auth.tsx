import React, {type ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import {AuthContext} from './providers';
import {callRPC, useClient} from "../lib/api.ts";
import {AuthService} from "../gen/auth/v1/auth_pb.ts";

export interface AuthProviderProps {
    children: ReactNode;
}
;
export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [authVersion, setAuthVersion] = useState(0);

    const refreshAuthStatus = useCallback(() => {
        setAuthVersion(v => v + 1);
    }, []);

    useEffect(() => {
        setIsLoading(true);

        const checkAuthStatus = async () => {
            try {
                console.log("Checking authentication status with server...");
                const response = await fetch('/auth/ping');
                setIsAuthenticated(response.ok);
                console.log(`Server response OK: ${response.ok}. isAuthenticated is now: ${response.ok}`);
            } catch (error) {
                console.error("Authentication check failed:", error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, [authVersion]);

    const userClient = useClient(AuthService)

    const logout = useCallback(async () => {
        const {err} = await callRPC(() => userClient.logout({}))
        if (err) {
            console.warn(err)
        }

        refreshAuthStatus();
    }, [refreshAuthStatus]);

    const contextValue = useMemo(
        () => ({
            isAuthenticated,
            isLoading,
            logout,
            refreshAuthStatus,
        }),
        [isAuthenticated, isLoading, logout, refreshAuthStatus]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};