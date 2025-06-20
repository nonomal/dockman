import {Box, createTheme, CssBaseline, ThemeProvider} from '@mui/material';
import {SnackbarProvider} from "./context/snackbar.tsx";
import {FileManagerPage} from "./pages/file-manager.tsx";
import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";
import {DashboardPage} from "./pages/dashboard-page.tsx";
import {NavSidebar} from "./components/sidebar.tsx";
import {SettingsPage} from "./pages/settings-page.tsx";
import {AuthProvider} from "./context/auth.tsx";
import {AuthPage} from './pages/auth-page.tsx';
import {useAuth} from "./context/providers.ts";
import NotFoundPage from "./components/not-found.tsx";

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
                                    <Route path="files/:filename" element={<FileManagerPage/>}/>
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


const PrivateRoute = () => {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
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

