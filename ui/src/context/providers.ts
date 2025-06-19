import React, {createContext, type ReactNode, useContext} from "react";
import type {AlertColor} from "@mui/material";


export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    refreshAuthStatus: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);


export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


export interface SnackbarOptions {
    severity?: AlertColor;
    duration?: number;
    action?: ReactNode;
}

export interface SnackbarContextType {
    showSnackbar: (message: string, options?: SnackbarOptions) => void;
    showSuccess: (message: string, options?: Omit<SnackbarOptions, 'severity'>) => void;
    showError: (message: string, options?: Omit<SnackbarOptions, 'severity'>) => void;
    showWarning: (message: string, options?: Omit<SnackbarOptions, 'severity'>) => void;
    showInfo: (message: string, options?: Omit<SnackbarOptions, 'severity'>) => void;
    hideSnackbar: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}

export const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = (): SnackbarContextType => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};
