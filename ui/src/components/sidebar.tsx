import {
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
import {Add as AddIcon, Delete as DeleteIcon, Description as FileIcon,} from '@mui/icons-material';
import {useSnackbar} from "./snackbar.tsx";

const DRAWER_WIDTH = 300;

interface FileComponent {
    name: string;
    children: string[];
}

interface SidebarProps {
    onFileClick: (params: { filename: string }) => void;
}

export function FileSidebar({onFileClick}: SidebarProps) {
    const composeClient = useClient(FileService)
    const {showError, showSuccess} = useSnackbar()

    const [files, setFiles] = useState<FileComponent[]>([]);
    const [internalSelectedFile, setInternalSelectedFile] = useState("");

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
        fetchData().then(() => {
        })
    }, [fetchData]);

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [currentParent, setCurrentParent] = useState('');
    const [newChildName, setNewChildName] = useState('');

    const handleAddClick = (parentName: string) => {
        setCurrentParent(parentName);
        setAddDialogOpen(true);
    };

    const handleAddConfirm = () => {
        if (newChildName.trim()) {
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
                    fetchData().then(() => {
                    })
                })
        }
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
                            <ListItemButton
                                selected={internalSelectedFile === item.name}
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
                                    {/* Your icon here */}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(item.name);
                                    }}
                                    sx={{mr: 1}}
                                >
                                    <DeleteIcon/>
                                </IconButton>
                            </ListItemButton>
                            {item.children && (
                                <List disablePadding sx={{pl: 4}}>
                                    {item.children.map((child) => (
                                        <ListItemButton
                                            selected={internalSelectedFile === child}
                                            key={child}
                                            onClick={() => {
                                                setInternalSelectedFile(child)
                                                onFileClick({filename: child})
                                            }}>
                                            <ListItemIcon><FileIcon/></ListItemIcon>
                                            <ListItemText primary={child}
                                                          slotProps={{
                                                              primary: {style: {fontStyle: 'italic'}}
                                                          }}/>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(child);
                                                }}>
                                                <DeleteIcon/>
                                            </IconButton>
                                        </ListItemButton>
                                    ))}
                                </List>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>

            <Dialog open={addDialogOpen} onClose={handleAddCancel}>
                {currentParent ?
                    <DialogTitle>Add subfile to "{currentParent}"</DialogTitle> :
                    <DialogTitle>Add new root file</DialogTitle>}
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Child Name"
                        fullWidth
                        variant="outlined"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        onKeyDown={(e) => {
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
