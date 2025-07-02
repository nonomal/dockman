import {
    Box,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography
} from '@mui/material';
import {Dashboard, Logout} from '@mui/icons-material';
import {Link as RouterLink, useLocation, useNavigate} from 'react-router-dom';

import {useAuth} from "../hooks/auth.ts";
import {FileList} from './file-bar.tsx';
import HostSelectDropdown from "./host-selector.tsx";

export function NavSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const {logout} = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <Drawer
            sx={{width: 300, flexShrink: 0, '& .MuiDrawer-paper': {width: 300, boxSizing: 'border-box'}}}
            variant="permanent"
            anchor="left"
        >
            <Box>
                <Toolbar>
                    <Box component="img" sx={{height: 40, width: 40, mr: 2}} alt="Logo" src="/dockmanTBD.png"/>
                    <Typography variant="h5" noWrap>Dockman</Typography>
                </Toolbar>
                <Divider/>
                <List>
                    <ListItemButton component={RouterLink} to="/" selected={location.pathname === '/'}>
                        <ListItemIcon><Dashboard/></ListItemIcon>
                        <ListItemText slotProps={{primary: {variant: 'h6'}}} primary="Dashboard"/>
                    </ListItemButton>
                </List>
                <Divider/>
                <ListItem>
                    <HostSelectDropdown/>
                </ListItem>
                <Divider/>
            </Box>

            <FileList/>

            <Box>
                <Divider/>
                <List>
                    {/*<ListItemButton selected={location.pathname === `/settings`} component={RouterLink} to="/settings">*/}
                    {/*    <ListItemIcon><Settings/></ListItemIcon>*/}
                    {/*    <ListItemText primary="Settings"/>*/}
                    {/*</ListItemButton>*/}
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon><Logout/></ListItemIcon>
                        <ListItemText primary="Logout"/>
                    </ListItemButton>
                </List>
            </Box>
        </Drawer>
    );
}