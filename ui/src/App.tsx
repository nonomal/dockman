import {Box, createTheme, CssBaseline, ThemeProvider} from '@mui/material';
import {SnackbarProvider} from "./components/snackbar.tsx";
import {FileManagerPage} from "./pages/file-manager.tsx";
import {BrowserRouter, Outlet, Route, Routes} from "react-router-dom";
import {DashboardPage} from "./pages/dashboard-page.tsx";
import {NavSidebar} from "./components/sidebar.tsx";

export default function App() {
    return (
        <SnackbarProvider>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline/>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<HomePage/>}>
                            <Route index element={<DashboardPage/>}/>
                            <Route path="files/:filename" element={<FileManagerPage/>}/>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </SnackbarProvider>
    );
}


function HomePage() {
    return (
        <Box sx={{display: 'flex', height: '100vh', overflow: 'hidden'}}>
            <NavSidebar/>
            <Box component="main" sx={{flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column'}}>
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

