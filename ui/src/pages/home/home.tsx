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
import {Logout, Settings} from '@mui/icons-material';
import {Link as RouterLink, useLocation, useNavigate} from 'react-router-dom';

import HostSelectDropdown from "../.components/host-selector.tsx";
import {useAuth} from "../../hooks/auth.ts";
import {ShortcutFormatter} from "../compose/components/shortcut-formatter.tsx";
import React, {useEffect, useMemo} from "react";
import {
    ContainerIcon,
    ImagesIcon,
    NetworkIcon,
    StacksIcon,
    StatsIcon,
    VolumeIcon
} from "../compose/components/file-icon.tsx";

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

    const navigationItems = useMemo(() => [
        {
            id: 'files',
            title: 'Stacks',
            path: '/stacks',
            icon: StacksIcon,
            keyCombo: ['ALT', '1'],
            exact: false, // for startsWith matching
            onClick: () => navigate('/stacks'),
        },
        {
            id: 'dashboard',
            title: 'Stats',
            path: '/stats',
            icon: StatsIcon,
            keyCombo: ['ALT', '2'],
            exact: true, // for exact path matching
        },

        {
            id: 'containers',
            title: 'Containers',
            path: '/containers',
            icon: ContainerIcon,
            keyCombo: ['ALT', '3'],
            exact: false, // for startsWith matching
            onClick: () => navigate('/containers'),
        },
        {
            id: 'images',
            title: 'Images',
            path: '/images',
            icon: ImagesIcon,
            keyCombo: ['ALT', '4'],
            exact: false, // for startsWith matching
            onClick: () => navigate('/images'),
        },
        {
            id: 'volumes',
            title: 'Volumes',
            path: '/volumes',
            icon: VolumeIcon,
            keyCombo: ['ALT', '5'],
            exact: false, // for startsWith matching
            onClick: () => navigate('/volumes'),
        },
        {
            id: 'networks',
            title: 'Networks',
            path: '/networks',
            icon: NetworkIcon,
            keyCombo: ['ALT', '6'],
            exact: false, // for startsWith matching
            onClick: () => navigate('/networks'),
        }
    ], [navigate]);

    useEffect(() => {
        // Create a map of key codes to navigation actions
        const shortcutMap = navigationItems.reduce((acc, item) => {
            const [modifier, key] = item.keyCombo;
            if (modifier === 'ALT') {
                acc[`Digit${key}`] = item;
            }
            return acc;
        }, {} as Record<string, typeof navigationItems[0]>);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && !e.repeat) {
                const matchedItem = shortcutMap[e.code];
                if (matchedItem) {
                    e.preventDefault();
                    if (matchedItem.onClick) {
                        matchedItem.onClick();
                    } else {
                        navigate(matchedItem.path);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate, navigationItems]);

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
                    {/* Main Sidebar */}
                    <List sx={{px: 1, pt: 2}}>
                        {navigationItems.map((item) => {
                            const IconComponent = item.icon as React.ComponentType;
                            const isSelected = item.exact
                                ? location.pathname === item.path
                                : location.pathname.startsWith(item.path);

                            const buttonContent = (
                                <ListItemIcon sx={{minWidth: 'auto'}}>
                                    <IconComponent/>
                                </ListItemIcon>
                            );

                            const buttonProps = {
                                selected: isSelected,
                                sx: {
                                    borderRadius: 1,
                                    mb: 1,
                                    justifyContent: 'center',
                                    minHeight: 48
                                }
                            };

                            return (
                                <Tooltip
                                    key={item.id}
                                    placement="right"
                                    title={<ShortcutFormatter title={item.title} keyCombo={item.keyCombo}/>}
                                >
                                    {item.onClick ? (
                                        <ListItemButton
                                            onClick={item.onClick}
                                            {...buttonProps}
                                        >
                                            {buttonContent}
                                        </ListItemButton>
                                    ) : (
                                        <ListItemButton
                                            component={RouterLink}
                                            to={item.path}
                                            {...buttonProps}
                                        >
                                            {buttonContent}
                                        </ListItemButton>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </List>
                </Box>
            </Drawer>
        </>
    );
}
