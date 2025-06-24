import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    InputAdornment,
    List,
    TextField,
    Toolbar,
    Typography
} from '@mui/material';
import {Add as AddIcon, Search as SearchIcon} from '@mui/icons-material';
import {useLocation, useParams} from 'react-router-dom';
import type {FileGroup} from '../hooks/files.ts';
import {useFiles} from "../hooks/files.ts";
import {FileItem} from './file-item.tsx';
import {AddFileDialog} from "./file-dialog.tsx";

export function FileList() {
    const location = useLocation();
    const {file: currentDir} = useParams<{ file: string }>();
    const {files, isLoading, addFile, deleteFile} = useFiles();

    // holds the names of all open directories.
    const [openDirs, setOpenDirs] = useState(new Set<string>());

    const [searchQuery, setSearchQuery] = useState('');
    const [dialogState, setDialogState] = useState<{ open: boolean; parent: string }>({open: false, parent: ''});

    // if you navigate to a file, its parent directory opens automatically.
    useEffect(() => {
        if (currentDir) {
            // Add the current directory from the URL to the set of open directories
            setOpenDirs(prevOpenDirs => new Set(prevOpenDirs).add(currentDir));
        }
    }, [currentDir]); // only when the URL parameter changes

    const handleToggle = useCallback((dirName: string) => {
        setOpenDirs(prevOpenDirs => {
            const newOpenDirs = new Set(prevOpenDirs);
            if (newOpenDirs.has(dirName)) {
                newOpenDirs.delete(dirName); // If it's open, close it
            } else {
                newOpenDirs.add(dirName); // If it's closed, open it
            }
            return newOpenDirs;
        });
    }, []);

    const openAddDialog = (parentName: string) => {
        setDialogState({open: true, parent: parentName});
    };

    const closeAddDialog = () => {
        setDialogState({open: false, parent: ''})
    };

    const handleAddConfirm = (filename: string) => {
        addFile(filename, dialogState.parent).then()
        closeAddDialog()
    };

    const handleDelete = (filename: string) => {
        deleteFile(filename, location.pathname).then()
    };

    const filteredFiles = useMemo(() => {
        if (!searchQuery) return files;
        const lowerCaseQuery = searchQuery.toLowerCase();

        return files.map(group => {
            const isParentMatch = group.name.toLowerCase().includes(lowerCaseQuery);
            const matchingChildren = group.children.filter(child => child.toLowerCase().includes(lowerCaseQuery));

            if (isParentMatch || matchingChildren.length > 0) {
                // If parent matches, show all children. Otherwise, show only matching children.
                return {...group, children: isParentMatch ? group.children : matchingChildren};
            }
            return null;
        }).filter((group): group is FileGroup => group !== null);
    }, [files, searchQuery]);

    return (
        <>
            <Toolbar>
                <Typography variant="h6" noWrap sx={{flexGrow: 1}}>Files</Typography>
                <Button startIcon={<AddIcon/>} onClick={() => openAddDialog('')}>Add</Button>
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
                                <InputAdornment position="start"><SearchIcon/></InputAdornment>
                            ),
                        }
                    }}
                />
            </Box>
            <Divider/>

            <Box sx={{overflowY: 'auto', flexGrow: 1}}>
                {files.length === 0 && isLoading  ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress/>
                    </Box>
                ) : (
                    <List>
                        {filteredFiles.map((group) => (
                            <FileItem
                                key={group.name}
                                group={group}
                                onAdd={openAddDialog}
                                onDelete={handleDelete}
                                isOpen={openDirs.has(group.name)}
                                onToggle={handleToggle}
                            />
                        ))}
                    </List>
                )}
            </Box>

            <AddFileDialog
                open={dialogState.open}
                onClose={closeAddDialog}
                onConfirm={handleAddConfirm}
                parentName={dialogState.parent}
            />
        </>
    );
}