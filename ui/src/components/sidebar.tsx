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
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';

import React, {useCallback, useEffect, useState} from 'react';
import {FileService} from "../gen/files/v1/files_pb.ts";
import {callRPC, useClient} from "../lib/api.ts";
import {Add as AddIcon, Dashboard, Delete as DeleteIcon, Description as FileIcon,} from '@mui/icons-material';
import {useSnackbar} from "./snackbar.tsx";
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

    const handleAddClick = (parentName: string) => {
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

    const handleDelete = (filename: string) => {
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

    const handleAddCancel = () => {
        setNewChildName('');
        setAddDialogOpen(false);
    };

    return (
        <>
            <Drawer
                sx={{width: 300, flexShrink: 0, '& .MuiDrawer-paper': {width: 300, boxSizing: 'border-box'}}}
                variant="permanent"
                anchor="left"
            >
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
                    <Button startIcon={<AddIcon/>} onClick={() => handleAddClick("")}>Add</Button>
                </Toolbar>
                <Divider/>
                <List>{
                    files.map((item) => (
                        <React.Fragment key={item.name}>
                            <ListItemButton component={RouterLink} to={`/files/${item.name}`}
                                            selected={location.pathname === `/files/${item.name}`}>
                                <ListItemIcon><FileIcon/></ListItemIcon>
                                <ListItemText primary={item.name}/>
                                <IconButton size="small" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAddClick(item.name);
                                }}><AddIcon/></IconButton>
                                <IconButton size="small" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(item.name);
                                }}><DeleteIcon/></IconButton>
                            </ListItemButton>
                            {item.children && (
                                <List disablePadding sx={{pl: 4}}>
                                    {item.children.map((child) => (
                                        <ListItemButton key={child} component={RouterLink} to={`/files/${child}`}
                                                        selected={location.pathname === `/files/${child}`}>
                                            <ListItemIcon><FileIcon/></ListItemIcon>
                                            <ListItemText primary={child}/>
                                            <IconButton size="small" onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(child);
                                            }}><DeleteIcon/></IconButton>
                                        </ListItemButton>
                                    ))}
                                </List>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>
            <Dialog open={addDialogOpen} onClose={handleAddCancel} fullWidth>
                <DialogTitle>{currentParent ? `Add subfile to "${currentParent}"` : "Add new root file"}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="File Name" fullWidth variant="outlined"
                               value={newChildName} onChange={(e) => setNewChildName(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleAddConfirm()}/>
                </DialogContent>
                <DialogActions><Button onClick={handleAddCancel}>Cancel</Button><Button onClick={handleAddConfirm}
                                                                                        variant="contained">Add</Button></DialogActions>
            </Dialog>
        </>
    );
}
