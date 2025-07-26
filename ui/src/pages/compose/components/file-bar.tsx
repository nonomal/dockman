import {useCallback, useEffect, useState} from 'react'
import {Box, CircularProgress, Divider, IconButton, List, styled, Toolbar, Tooltip, Typography} from '@mui/material'
import {Add as AddIcon, Search as SearchIcon, Sync} from '@mui/icons-material'
import {useParams} from 'react-router-dom'
import FileItem from './file-item.tsx'
import {FileDialogCreate} from "./file-dialog-create.tsx"
import {FilesDialogImport} from "./file-dialog-import.tsx";
import {useFiles} from "../../../hooks/files.ts";
import {useHost} from "../../../hooks/host.ts";
import {useTelescope} from "../context/telescope-hook.ts";
import {ShortcutFormatter} from "./shortcut-formatter.tsx";

export function FileList() {
    const {file: currentDir} = useParams<{ file: string }>()
    const {files, isLoading, addFile} = useFiles()
    const {selectedHost} = useHost()
    const {showTelescope} = useTelescope()

    // holds the names of all open directories.
    const [openDirs, setOpenDirs] = useState(new Set<string>())

    const [dialogState, setDialogState] = useState<{ open: boolean; parent: string }>({open: false, parent: ''})

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Ctrl+k on Windows/Linux or Cmd+F on macOS
            if ((event.ctrlKey) && event.key === 'k') {
                event.preventDefault() // Prevent the browser's default find action
                showTelescope()
            }
        }
        // Add the event listener to the window
        window.addEventListener('keydown', handleKeyDown)
        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [selectedHost, showTelescope])

    // if you navigate to a file, its parent directory opens automatically.
    useEffect(() => {
        if (currentDir) {
            // Add the current directory from the URL to the set of open directories
            setOpenDirs(prevOpenDirs => new Set(prevOpenDirs).add(currentDir))
        }
    }, [currentDir, selectedHost])

    const handleToggle = useCallback((dirName: string) => {
        setOpenDirs(prevOpenDirs => {
            const newOpenDirs = new Set(prevOpenDirs)
            if (newOpenDirs.has(dirName)) {
                newOpenDirs.delete(dirName) // If it's open, close it
            } else {
                newOpenDirs.add(dirName) // If it's closed, open it
            }
            return newOpenDirs
        })
    }, [])

    const openAddDialog = (parentName: string) => {
        setDialogState(() => ({open: true, parent: parentName}))
    }

    const closeAddDialog = () => {
        // use a function to prevent modifying state before closing the dialog
        setDialogState(() => ({open: false, parent: ''}))
    }

    const handleAddConfirm = (filename: string) => {
        addFile(filename, dialogState.parent).then(() => {
            closeAddDialog()
        })
    }

    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const handleImportFinished = () => {
        console.log("Import process has finished. Refreshing data...");
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
            }}
        >
            <Toolbar>
                <Typography variant="h6" noWrap sx={{flexGrow: 1}}>
                    Files
                </Typography>

                <Tooltip arrow title={
                    <ShortcutFormatter
                        title="Search"
                        keyCombo={[]}
                    />
                }>
                    <IconButton
                        size="small"
                        onClick={() => showTelescope()}
                        color="primary"
                        aria-label="Search"
                    >
                        <SearchIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>

                <Tooltip arrow title={
                    <ShortcutFormatter
                        title="Add"
                        keyCombo={[]}
                    />
                }>
                    <IconButton
                        size="small"
                        onClick={() => openAddDialog('')}
                        color="success"
                        sx={{ml: 1}} // Add left margin for spacing between buttons
                        aria-label="Add"
                    >
                        <AddIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>

                <Tooltip arrow title={
                    <ShortcutFormatter
                        title="Import"
                        keyCombo={[]}
                    />
                }>
                    <IconButton
                        size="small"
                        onClick={() => setImportDialogOpen(true)}
                        color="info"
                        sx={{ml: 1}} // Add left margin for spacing
                        aria-label="Import"
                    >
                        <Sync fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Toolbar>

            <Divider/>

            <StyledScrollbarBox sx={{flexGrow: 1}}>
                {files.length === 0 && isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress/>
                    </Box>
                ) : (
                    <List>
                        {files.map((group) => (
                            <FileItem
                                key={group.name}
                                group={group}
                                onAdd={openAddDialog}
                                isOpen={openDirs.has(group.name)}
                                onToggle={handleToggle}
                            />
                        ))}
                    </List>
                )}
            </StyledScrollbarBox>

            <FilesDialogImport
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onImportComplete={handleImportFinished}
                currentBranch={selectedHost ?? ""}
            />

            <FileDialogCreate
                open={dialogState.open}
                onClose={closeAddDialog}
                onConfirm={handleAddConfirm}
                parentName={dialogState.parent}
            />
        </Box> // Close the main container Box
    )
}


const StyledScrollbarBox = styled(Box)(({theme}) => ({
    overflowY: 'auto',
    scrollbarGutter: 'stable',
    // Use theme colors for better theming support
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.palette.grey[400]} transparent`,

    '&::-webkit-scrollbar': {
        width: '6px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent', // Makes the track invisible
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.grey[400],
        borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: theme.palette.grey[500],
    },
}))
