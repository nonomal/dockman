import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FileService} from "../gen/files/v1/files_pb.ts";
import {callRPC, useClient} from "../lib/api.ts";
import {
    Add as AddIcon,
    AttachFileRounded,
    Dashboard,
    Delete as DeleteIcon,
    Description as FileIcon,
    Logout,
    Search,
    Settings,
} from '@mui/icons-material';
import {useAuth, useSnackbar} from "../context/providers.ts";
import {Link as RouterLink, useLocation, useNavigate} from 'react-router-dom';

interface FileComponent {
    name: string;
    children: string[];
}

export function NavSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const composeClient = useClient(FileService)
    const {showError, showSuccess} = useSnackbar();

    const [files, setFiles] = useState<FileComponent[]>([]);

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [currentParent, setCurrentParent] = useState('');
    const [newChildName, setNewChildName] = useState('');

    const fetchData = useCallback(async () => {
        const {val, err} = await callRPC(() => composeClient.list({}))
        console.log("calling fetchData");
        if (err) {
            showError(err)
        } else {
            if (val) {
                const res = val!.groups.map<FileComponent>(value => {
                    return {name: value.root, children: value.subFiles};
                })
                setFiles(res)
            }
        }
    }, [composeClient, showError]);

    useEffect(() => {
        fetchData().then()
    }, [fetchData]);

    const [searchQuery, setSearchQuery] = useState('');
    const filteredFiles = useMemo(() => {
        if (!searchQuery) return files;
        const lowerCaseQuery = searchQuery.toLowerCase();

        return files
            .map(group => {
                const isParentMatch = group.name.toLowerCase().includes(lowerCaseQuery);
                const matchingChildren = group.children.filter(child =>
                    child.toLowerCase().includes(lowerCaseQuery)
                );

                if (isParentMatch || matchingChildren.length > 0) {
                    return {
                        ...group,
                        children: isParentMatch ? group.children : matchingChildren,
                    };
                }
                return null;
            })
            .filter((group): group is FileComponent => group !== null);
    }, [files, searchQuery]);

    const handleAddDialog = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, parentName: string) => {
        e.preventDefault();
        e.stopPropagation();

        setCurrentParent(parentName);
        setAddDialogOpen(true);
    };

    const handleAddConfirm = () => {
        if (!newChildName.trim()) return;

        callRPC(() => composeClient
            .create({file: {filename: newChildName}, parent: currentParent}))
            .then(({err}) => {
                if (err) {
                    showError(`Error saving file: ${err}`)
                } else {
                    showSuccess(`File saved`)
                }
            })
            .finally(() => {
                setNewChildName('');
                setAddDialogOpen(false);
                fetchData().then()
            })
    };

    const handleAddCancel = () => {
        setNewChildName('');
        setAddDialogOpen(false);
    };

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, filename: string) => {
        e.preventDefault();
        e.stopPropagation();

        callRPC(() => composeClient.delete({filename: filename}))
            .then(({err}) => {
                if (err) {
                    showError(`Error: ${err}`)
                } else {
                    showSuccess(`File deleted`)
                }
            })
            .finally(() => {
                setNewChildName('');
                setAddDialogOpen(false);
                fetchData().then()
            })

        // If the deleted file was the active one, navigate to dashboard
        if (location.pathname === `/files/${filename}`) {
            navigate('/');
        }
    };

    const {logout} = useAuth()
    const handleLogout = () => {
        logout()
        navigate('/');
    }

    return (
        <>
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
                    <Toolbar>
                        <Typography variant="h6" noWrap sx={{flexGrow: 1}}>Files</Typography>
                        <Button startIcon={<AddIcon/>} onClick={(e) => handleAddDialog(e, "")}>Add</Button>
                    </Toolbar>
                    <Divider/>
                    <Box sx={{px: 2, py: 1}}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search/>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Box>
                    <Divider/>
                </Box>
                <Box sx={{overflowY: 'auto', flexGrow: 1}}>
                    <List>
                        {filteredFiles.map((item) => (
                            <React.Fragment key={item.name}>
                                <ListItemButton
                                    component={RouterLink}
                                    to={`/files/${item.name}`}
                                    selected={location.pathname === `/files/${item.name}`}
                                >
                                    <ListItemIcon><FileIcon/></ListItemIcon>
                                    <ListItemText primary={item.name}/>
                                    <IconButton size="small" onClick={(e) => {
                                        handleAddDialog(e, item.name);
                                    }}><AddIcon/></IconButton>
                                    <IconButton size="small" onClick={(e) => {
                                        handleDelete(e, item.name);
                                    }}><DeleteIcon/></IconButton>
                                </ListItemButton>
                                {item.children && (
                                    <List disablePadding sx={{pl: 4}}>
                                        {item.children.map((child) => (
                                            <ListItemButton
                                                key={child}
                                                component={RouterLink}
                                                to={`/files/${child}`}
                                                selected={location.pathname === `/files/${child}`}
                                            >
                                                <ListItemIcon><AttachFileRounded
                                                    sx={{fontSize: '1.25rem'}}/></ListItemIcon>
                                                <ListItemText primary={child}/>
                                                <IconButton size="small" onClick={(e) => {
                                                    handleDelete(e, child);
                                                }}><DeleteIcon/></IconButton>
                                            </ListItemButton>
                                        ))}
                                    </List>
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>

                <Box>
                    <Divider/>
                    <List>
                        <ListItemButton
                            selected={location.pathname === `/settings`}
                            component={RouterLink} to="/settings"
                        >
                            <ListItemIcon><Settings/></ListItemIcon>
                            <ListItemText primary="Settings"/>
                        </ListItemButton>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon><Logout/></ListItemIcon>
                            <ListItemText primary="Logout"/>
                        </ListItemButton>
                    </List>
                </Box>
            </Drawer>

            <Dialog open={addDialogOpen} onClose={handleAddCancel} fullWidth>
                <DialogTitle>{currentParent ? `Add subfile to "${currentParent}"` : "Add new root file"}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus fullWidth
                               margin="dense"
                               label="File Name"
                               variant="outlined"
                               value={newChildName} onChange={(e) => setNewChildName(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleAddConfirm()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddCancel}>Cancel</Button>
                    <Button onClick={handleAddConfirm} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
