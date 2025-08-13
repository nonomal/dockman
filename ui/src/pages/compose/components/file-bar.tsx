import {type ChangeEvent, useCallback, useEffect, useState} from 'react'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    List,
    styled,
    Switch,
    Toolbar,
    Tooltip,
    Typography
} from '@mui/material'
import {Add as AddIcon, Search as SearchIcon, Sync} from '@mui/icons-material'
import {useParams} from 'react-router-dom'
import FileItem from './file-item.tsx'
import {FileDialogCreate} from "./file-dialog-create.tsx"
import {FilesDialogImport} from "./file-dialog-import.tsx";
import {useFiles} from "../../../hooks/files.ts";
import {useHost} from "../../../hooks/host.ts";
import {useTelescope} from "../context/telescope-hook.ts";
import {ShortcutFormatter} from "./shortcut-formatter.tsx";
import {useConfig} from "../../../hooks/config.ts";

interface FileListProps {
    closeTab: (tabToClose: string) => void
}

export function FileList({closeTab}: FileListProps) {
    const {file: currentDir} = useParams<{ file: string }>()
    const {files, isLoading, addFile} = useFiles()
    const {selectedHost} = useHost()
    const {showTelescope} = useTelescope()
    const {deleteFile} = useFiles()

    // holds the names of all open directories.
    const [openDirs, setOpenDirs] = useState(new Set<string>())

    const [dialogState, setDialogState] = useState<{ open: boolean; parent: string }>({open: false, parent: ''})

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // alt+k to open search
            if ((event.altKey) && event.key === 's') {
                event.preventDefault() // Prevent the browser's default find action
                showTelescope()
            }
            // alt + a for creating files
            if ((event.altKey) && event.key === 'a') {
                event.preventDefault()
                openAddDialog("")
            }

            // alt + s for importing files
            if ((event.altKey) && event.key === 'i') {
                event.preventDefault()
                setImportDialogOpen(() => true)
            }
        }
        // Add the event listener to the window
        window.addEventListener('keydown', handleKeyDown)
        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [selectedHost, showTelescope])

    const onDelete = (file: string) => {
        deleteFile(file).then()
        closeTab(file)
    };

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

    const [fileConfigDialogOpen, setFileConfigDialogOpen] = useState(false);

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
                <Tooltip title={"Configure how files are displayed"}>
                    <Button
                        variant="text"
                        onClick={() => setFileConfigDialogOpen(true)}
                        sx={{
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            fontSize: '1.25rem', // h6 font size
                            fontWeight: 500, // h6 font weight
                            color: 'text.primary',
                            padding: '8px 12px',
                            minWidth: 'auto',
                            width: 'fit-content',
                            border: '1px solid transparent',
                            borderRadius: '6px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'rgba(255, 255, 255, 0.12)',
                                color: 'text.primary',
                            },
                            '&:focus': {
                                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'text.primary',
                            }
                        }}
                        aria-label="Open File Config"
                    >
                        Files
                    </Button>
                </Tooltip>

                <Box sx={{flexGrow: 1}}/>

                <Tooltip arrow title={
                    <ShortcutFormatter
                        title="Search"
                        keyCombo={["ALT", "S"]}
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
                        keyCombo={["ALT", "A"]}
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
                        keyCombo={["ALT", "I"]}
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
                                onDelete={onDelete}
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
            <FileConfigDialog open={fileConfigDialogOpen} onClose={() => setFileConfigDialogOpen(false)}/>
        </Box>
    )
}

function FileConfigDialog({open, onClose}: { open: boolean, onClose: () => void }) {
    const {config, updateSettings} = useConfig()
    const [localConfig, setLocalConfig] = useState(config)

    // uses the name attribute from the Switch component to determine which key in the localConfig object to update.
    const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = event.target;
        setLocalConfig(prevConfig => ({
            ...prevConfig,
            [name]: checked
        }));
    };

    const handleSave = () => {
        console.log('Saving config:');
        updateSettings(localConfig).then();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="file-config-dialog-title"
            slotProps={{
                paper: {
                    // sx: {
                    //     backgroundColor: '#2d2d2d', // Darker background color
                    //     color: '#f5f5f5',         // Light text color for contrast
                    // }
                },
            }}
        >
            <DialogTitle
                id="file-config-dialog-title"
                sx={{borderBottom: 1, borderColor: 'grey.700'}}
            >
                File Display Config
            </DialogTitle>
            <DialogContent
                sx={{
                    borderBottom: 1,
                    borderColor: 'grey.700',
                    paddingY: '24px'
                }}
            >
                <DialogContentText sx={{color: 'grey.400', marginBottom: 3}}>
                    Configure your file settings here.
                </DialogContentText>

                <Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localConfig.useComposeFolders}
                                onChange={handleSwitchChange}
                                name="useComposeFolders"
                            />
                        }
                        label="Use compose folders"
                    />
                    <Typography variant="caption" display="block" sx={{color: 'grey.500', mt: 0.5, ml: 4}}>
                        Convert all folders with a single compose file into a top-level compose file. The folder remains
                        under the hood; only how the folder is displayed is changed.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions
                // Add padding to the button section
                sx={{padding: '16px 24px'}}
            >
                <Button onClick={onClose} sx={{color: 'white'}}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
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
