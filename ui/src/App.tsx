import {type SyntheticEvent, useState} from 'react';
import {
    Alert,
    type AlertColor,
    Box,
    createTheme,
    CssBaseline,
    Snackbar,
    Tab,
    Tabs,
    ThemeProvider,
    Typography
} from '@mui/material';
import {EditorPage} from './pages/editor-page';
import {DeployPage} from "./pages/deploy-page.tsx";
import {FileSidebar} from "./components/sidebar.tsx";

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


function IdeLayout() {
    const [tabValue, setTabValue] = useState(0);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleCloseSnackbar = (_event: any, reason: string) => {
        if (reason === 'clickaway') return;
        setSnackbar((prev) => ({...prev, open: false}));
    };

    const [selectedFile, setSelectedFile] = useState("")

    return (
        <Box sx={{display: 'flex', height: '100vh', overflow: 'hidden'}}>
            <FileSidebar onFileClick={({filename}) => {
                setSelectedFile(filename)
            }}/>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {selectedFile ? (
                    <>
                        {/* TABS */}
                        <Box sx={{borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper'}}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="main tabs">
                                <Tab label="Editor" id="tab-0"/>
                                <Tab label="Deploy" id="tab-1"/>
                            </Tabs>
                        </Box>
                        {/* TAB PANELS */}
                        {tabValue === 0 && <EditorPage selectedPage={selectedFile}/>}
                        {tabValue === 1 && <DeployPage selectedPage={selectedFile}/>}
                    </>
                ) : (
                    <Typography
                        variant="h5"
                        color="text.secondary"
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            textAlign: 'center'
                        }}
                    >
                        Select a file
                    </Typography>
                )}
            </Box>

            {/* NOTIFICATION COMPONENT */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            >
                <Alert
                    onClose={event => handleCloseSnackbar(event, "")}
                    severity={snackbar.severity as AlertColor}
                    sx={{width: '100%'}}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <IdeLayout/>
        </ThemeProvider>
    );
}
