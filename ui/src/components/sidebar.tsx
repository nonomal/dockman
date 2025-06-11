import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Snackbar,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';

import React, {useCallback, useEffect, useState} from 'react';
import {ComposeService} from "../gen/compose/v1/compose_pb.ts";
import {callRPC, useClient} from "../lib/api.ts";
import {Add as AddIcon, Delete as DeleteIcon, Description as FileIcon,} from '@mui/icons-material';

const DRAWER_WIDTH = 300;

interface FileComponent {
    name: string;
    children: string[];
}

interface SidebarProps {
    onFileClick: (params: { filename: string }) => void;
}

export function FileSidebar({onFileClick}: SidebarProps) {
    const [files, setFiles] = useState<FileComponent[]>([]);
    const [internalSelectedFile, setInternalSelectedFile] = useState("");

    const composeClient = useClient(ComposeService)

    const fetchData = useCallback(async () => {
        const {val, err} = await callRPC(() => composeClient.list({}))
        console.log("calling fetchData");
        if (err) {
            setSnackbarSeverity("error")
            setSnackbarMessage(err)
        } else {
            if (val) {
                const res = val!.groups.map<FileComponent>(value => {
                    return {name: value.root, children: value.subFiles};
                })
                setFiles(res)
            }
        }
    }, [composeClient]);

    useEffect(() => {
        fetchData().then(() => {
        })
    }, [fetchData]);

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [currentParent, setCurrentParent] = useState('');
    const [newChildName, setNewChildName] = useState('');

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const handleAddClick = (parentName: string) => {
        setCurrentParent(parentName);
        setAddDialogOpen(true);
    };

    const handleAddConfirm = () => {
        if (newChildName.trim()) {
            callRPC(() => composeClient
                .create({file: {filename: newChildName}, parent: currentParent}))
                .then(({err}) => {
                    setSnackbarOpen(true);

                    if (err) {
                        setSnackbarSeverity('error');
                        setSnackbarMessage(`Error: ${err}`)
                    } else {
                        setSnackbarSeverity('success');
                        setSnackbarMessage("File Added")
                    }
                })
                .finally(() => {
                    setNewChildName('');
                    setAddDialogOpen(false);
                    fetchData().then(() => {
                    })
                })
        }
    };

    const handleDeleteParent = (filename: string) => {
        callRPC(() => composeClient.delete({filename: filename}))
            .then(({err}) => {
                setSnackbarOpen(true);
                if (err) {
                    setSnackbarSeverity('error');
                    setSnackbarMessage(`Error: ${err}`)
                } else {
                    setSnackbarSeverity('success');
                    setSnackbarMessage("File Deleted")
                }
            })
            .finally(() => {
                setNewChildName('');
                setAddDialogOpen(false);
                fetchData().then(() => {
                })
            })
    }

    const handleAddCancel = () => {
        setNewChildName('');
        setAddDialogOpen(false);
    };

    return (
        <>
            <Drawer
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Files
                    </Typography>

                    <Button
                        startIcon={<AddIcon/>}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddClick("");
                        }}
                        sx={{marginLeft: 'auto'}}
                    >
                        Add
                    </Button>
                </Toolbar>
                <Divider/>
                <List>{
                    files.map((item) => (
                        <React.Fragment key={item.name}>
                            <ListItem
                                selected={internalSelectedFile === item.name}
                                button
                                onClick={() => {
                                    setInternalSelectedFile(item.name)
                                    onFileClick({filename: item.name})
                                }}>
                                <ListItemIcon> <FileIcon/> </ListItemIcon>
                                <ListItemText primary={item.name}/>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddClick(item.name);
                                    }}
                                    sx={{mr: 1}}
                                >
                                    <AddIcon/>
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteParent(item.name)
                                    }}
                                >
                                    <DeleteIcon/>
                                </IconButton>
                            </ListItem>
                            {item.children && (
                                <List disablePadding sx={{pl: 4}}>
                                    {item.children.map((child) => (
                                        <ListItem
                                            selected={internalSelectedFile === child}
                                            button key={child}
                                            onClick={() => {
                                                setInternalSelectedFile(child)
                                                onFileClick({filename: child})
                                            }}>
                                            <ListItemIcon><FileIcon/></ListItemIcon>
                                            <ListItemText primary={child}
                                                          primaryTypographyProps={{style: {fontStyle: 'italic'}}}/>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteParent(child);
                                                }}>
                                                <DeleteIcon/>
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{width: '100%'}}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Dialog open={addDialogOpen} onClose={handleAddCancel}>
                {currentParent ?
                    <DialogTitle>Add New Child to "{currentParent}"</DialogTitle> :
                    <DialogTitle>Add New root file</DialogTitle>}
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Child Name"
                        fullWidth
                        variant="outlined"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAddConfirm();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddCancel}>Cancel</Button>
                    <Button onClick={handleAddConfirm} variant="contained">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
