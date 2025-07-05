import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    InputAdornment,
    List,
    styled,
    TextField,
    Toolbar,
    Typography
} from '@mui/material'
import {Add as AddIcon, Search as SearchIcon, Sync} from '@mui/icons-material'
import {useLocation, useParams} from 'react-router-dom'
import type {FileGroup} from '../hooks/files.ts'
import {useFiles} from "../hooks/files.ts"
import {FileItem} from './file-item.tsx'
import {AddFileDialog} from "./file-dialog.tsx"
import {useHost} from "../hooks/host.ts";
import {ImportFilesDialog} from "./file-import.tsx";

export function FileList() {
    const location = useLocation()
    const {file: currentDir} = useParams<{ file: string }>()
    const {files, isLoading, addFile, deleteFile} = useFiles()
    const {selectedHost} = useHost()

    // holds the names of all open directories.
    const [openDirs, setOpenDirs] = useState(new Set<string>())

    const [searchQuery, setSearchQuery] = useState('')
    const [dialogState, setDialogState] = useState<{ open: boolean; parent: string }>({open: false, parent: ''})

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Ctrl+k on Windows/Linux or Cmd+F on macOS
            if ((event.ctrlKey) && event.key === 'k') {
                event.preventDefault() // Prevent the browser's default find action
                if (searchInputRef.current) {
                    searchInputRef.current.focus() // Focus the search input field
                }
            }
        }
        // Add the event listener to the window
        window.addEventListener('keydown', handleKeyDown)
        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [selectedHost])

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

    const filteredFiles = useMemo(() => {
        if (!searchQuery) return files
        const lowerCaseQuery = searchQuery.toLowerCase()

        return files.map(group => {
            const isParentMatch = group.name.toLowerCase().includes(lowerCaseQuery)
            const matchingChildren = group.children.filter(child => child.toLowerCase().includes(lowerCaseQuery))

            if (isParentMatch || matchingChildren.length > 0) {
                // If parent matches, show all children. Otherwise, show only matching children.
                return {...group, children: isParentMatch ? group.children : matchingChildren}
            }
            return null
        }).filter((group): group is FileGroup => group !== null)
    }, [files, searchQuery, selectedHost])

    const openAddDialog = (parentName: string) => {
        setDialogState({open: true, parent: parentName})
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

    const handleDelete = (filename: string) => {
        deleteFile(filename, location.pathname).then()
    }


    // State for the new "Import" dialog
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    // A function to be called after import is done, e.g., to refresh a file list
    const handleImportFinished = () => {
        console.log("Import process has finished. Refreshing data...");
        // Add your logic here to re-fetch the main file list for your page
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

                <Button
                    startIcon={<AddIcon/>}
                    onClick={() => openAddDialog('')}
                >
                    Add
                </Button>

                <Button
                    startIcon={<Sync/>}
                    onClick={() => setImportDialogOpen(true)}
                    sx={{ml: 1}} // Adds a little space between the buttons
                >
                    Import
                </Button>
            </Toolbar>

            <Divider/>

            <Box sx={{px: 2, py: 1}}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Search files...     CTRL + K"
                    inputRef={searchInputRef}
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

            <StyledScrollbarBox sx={{flexGrow: 1}}>
                {files.length === 0 && isLoading ? (
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
            </StyledScrollbarBox>

            <ImportFilesDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onImportComplete={handleImportFinished}
                currentBranch={selectedHost ?? ""}
            />

            <AddFileDialog
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