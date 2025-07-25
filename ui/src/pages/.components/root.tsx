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

import HostSelectDropdown from "./host-selector.tsx";
import {useAuth} from "../../hooks/auth.ts";

export const TOP_BAR_HEIGHT = 69;
const MAIN_SIDEBAR_WIDTH = 80;

export function RootLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const {logout} = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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
                                gap: 1.1,
                                backgroundColor: 'action.hover',
                                px: 1.5,
                                py: 0.5,
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
                                selected={location.pathname.startsWith('/files')}
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
        </>
    );
}
