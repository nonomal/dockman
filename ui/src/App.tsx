import {createTheme, CssBaseline, ThemeProvider} from '@mui/material';
import {SnackbarProvider} from "./components/snackbar.tsx";
import {HomePage} from "./pages/main-page.tsx";

export default function App() {
    return (
        <SnackbarProvider>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline/>
                <HomePage/>
            </ThemeProvider>
        </SnackbarProvider>
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

