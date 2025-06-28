import {Box, createTheme, CssBaseline, ThemeProvider} from '@mui/material';
import {SnackbarProvider} from "./context/snackbar-context.tsx";
import {Stack} from "./pages/stack.tsx";
import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";
import {DashboardPage} from "./pages/dashboard-page.tsx";
import {NavSidebar} from "./components/sidebar.tsx";
import {SettingsPage} from "./pages/settings-page.tsx";
import {AuthProvider} from "./context/auth-context.tsx";
import {AuthPage} from './pages/auth-page.tsx';
import NotFoundPage from "./components/not-found.tsx";
import React from 'react';
import {useAuth} from "./hooks/auth.ts";

export default function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <SnackbarProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="auth" element={<AuthPage/>}/>
                            <Route element={<PrivateRoute/>}>
                                <Route path="/" element={<HomePage/>}>
                                    <Route index element={<DashboardPage/>}/>
                                    <Route path="files/:file/:child" element={<Stack/>}/>
                                    <Route path="files/:file" element={<Stack/>}/>
                                    <Route path="settings" element={<SettingsPage/>}/>
                                </Route>
                            </Route>
                            <Route path="/not-found" element={<NotFoundPage/>}/>
                            <Route path="*" element={<NotFoundPage/>}/>
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </SnackbarProvider>
        </ThemeProvider>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    loadingWrapper: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
    },
    spinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        borderLeftColor: '#09f', // Or your brand color
        animation: 'spin 1s ease infinite',
        marginBottom: '20px',
    },
    loadingText: {
        fontSize: '1.1rem',
        color: '#555',
    }
};

const PrivateRoute = () => {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
        return (
            <div style={styles.loadingWrapper}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Verifying your session...</p>
            </div>
        )
    }

    return isAuthenticated ? <Outlet/> : <Navigate to="/auth"/>;
};

function HomePage() {
    return (
        <Box sx={{display: 'flex', height: '100vh', overflow: 'hidden'}}>
            <NavSidebar/>
            <Box component="main" sx={{
                flexGrow: 1,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
            }}>
                <Outlet/>
            </Box>
        </Box>
    );
}


const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
        },
        secondary: {
            main: '#f48fb1',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1a1a1a',
                },
            },
        },
    },
});

