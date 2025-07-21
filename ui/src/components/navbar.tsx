import React from 'react';
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    Toolbar,
    Tooltip,
    Typography
} from '@mui/material';
import {Dashboard, FolderOpen, Logout, Settings} from '@mui/icons-material';
import {Link as RouterLink, useLocation, useNavigate} from 'react-router-dom';

import {useAuth} from "../hooks/auth.ts";
import {FileList} from './file-bar.tsx';
import HostSelectDropdown from "./host-selector.tsx";

const MAIN_SIDEBAR_WIDTH = 80;
const FILE_PANEL_WIDTH = 280;
const TOP_BAR_HEIGHT = 72;

interface NavSidebarProps {
    filesPanelOpen: boolean;
    setFilesPanelOpen: (open: boolean) => void;
}

export function RootNavbar({filesPanelOpen, setFilesPanelOpen}: NavSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const {logout} = useAuth();

    // The panel is open if the path is /files or any of its children.
    const isFilesRouteActive = location.pathname.startsWith('/files');

    React.useEffect(() => {
        // Sync the parent state with the route state.
        if (isFilesRouteActive !== filesPanelOpen) {
            setFilesPanelOpen(isFilesRouteActive);
        }
    }, [isFilesRouteActive, filesPanelOpen, setFilesPanelOpen]);


    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // const handleCloseFilesPanel = () => {
    //     // When closing, always navigate to the dashboard.
    //     navigate('/');
    // };

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    height: TOP_BAR_HEIGHT,
                    backgroundColor: 'background.default',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                }}
            >
                <Toolbar sx={{minHeight: `${TOP_BAR_HEIGHT}px !important`, justifyContent: 'space-between'}}>
                    {/* Logo, Title and Host Selector */}
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 4}}>
                        <Box
                            component={RouterLink}
                            to="/"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.2,
                                backgroundColor: 'action.hover',
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                textDecoration: 'none', // Remove underline from link
                                color: 'inherit', // Inherit color from parent
                            }}
                        >
                            <Box
                                component="img"
                                sx={{
                                    height: 45,
                                    width: 45,
                                    objectFit: 'contain',
                                }}
                                alt="Dockman Logo"
                                src="/dockman.svg"
                            />
                            <Typography variant="h6" noWrap sx={{color: 'text.primary', fontWeight: 'medium'}}>
                                Dockman
                            </Typography>
                        </Box>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, p: 1}}>
                            <Typography variant="body1" sx={{fontWeight: 'medium', color: 'text.main'}}>
                                Host:
                            </Typography>
                            <HostSelectDropdown/>
                        </Box>
                    </Box>

                    {/* Right Side Controls */}
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                        {/* Settings Button */}
                        <Tooltip title="Settings">
                            <IconButton
                                component={RouterLink}
                                to="/settings"
                                color={location.pathname === '/settings' ? 'primary' : 'default'}
                            >
                                <Settings/>
                            </IconButton>
                        </Tooltip>

                        {/* Logout Button */}
                        <Tooltip title="Logout">
                            <IconButton onClick={handleLogout} color="default">
                                <Logout/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{display: 'flex'}}>
                {/* Main Navigation Sidebar */}
                <Drawer
                    sx={{
                        width: MAIN_SIDEBAR_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: MAIN_SIDEBAR_WIDTH,
                            boxSizing: 'border-box',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            mt: `${TOP_BAR_HEIGHT}px`,
                            height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`
                        }
                    }}
                    variant="permanent"
                    anchor="left"
                >
                    <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                        {/* Main Navigation */}
                        <List sx={{px: 1, pt: 2}}>
                            <Tooltip title="Dashboard" placement="right">
                                <ListItemButton
                                    component={RouterLink}
                                    to="/"
                                    selected={location.pathname === '/'}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 1,
                                        justifyContent: 'center',
                                        minHeight: 48
                                    }}
                                >
                                    <ListItemIcon sx={{minWidth: 'auto'}}>
                                        <Dashboard/>
                                    </ListItemIcon>
                                </ListItemButton>
                            </Tooltip>

                            <Tooltip title="Files" placement="right">
                                <ListItemButton
                                    onClick={() => navigate('/files')}
                                    selected={isFilesRouteActive}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 1,
                                        justifyContent: 'center',
                                        minHeight: 48
                                    }}
                                >
                                    <ListItemIcon sx={{minWidth: 'auto'}}>
                                        <FolderOpen/>
                                    </ListItemIcon>
                                </ListItemButton>
                            </Tooltip>
                        </List>
                    </Box>
                </Drawer>

                {/* Collapsible Files Panel */}
                <Drawer
                    transitionDuration={0}
                    sx={{
                        width: FILE_PANEL_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: FILE_PANEL_WIDTH,
                            boxSizing: 'border-box',
                            left: MAIN_SIDEBAR_WIDTH,
                            borderLeft: 'none',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            mt: `${TOP_BAR_HEIGHT}px`,
                            height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`
                        }
                    }}
                    variant="persistent"
                    anchor="left"
                    open={filesPanelOpen}
                >
                    <Box sx={{flexGrow: 1, overflow: 'auto'}}>
                        <FileList/>
                    </Box>
                </Drawer>
            </Box>
        </>
    );
}
