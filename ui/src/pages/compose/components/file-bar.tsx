import {useCallback, useEffect, useState} from 'react'
import {Box, CircularProgress, Divider, IconButton, List, styled, Toolbar, Tooltip, Typography} from '@mui/material'
import {Add, Search} from '@mui/icons-material'
import {useParams} from 'react-router-dom'
import FileBarItem from './file-bar-item.tsx'
import {useFiles} from "../../../hooks/files.ts"
import {useHost} from "../../../hooks/host.ts"
import {ShortcutFormatter} from "./shortcut-formatter.tsx"
import {useTelescope} from "../dialogs/search/search-hook.ts";
import {useAddFile} from "../dialogs/add/add-hook.ts";
import {useFileDelete} from "../dialogs/delete/delete-hook.ts";

interface FileListProps {
    closeTab: (tabToClose: string) => void
}

export function FileList({closeTab}: FileListProps) {
    const {file: currentDir} = useParams<{ file: string }>()

    const {selectedHost} = useHost()
    const {files, isLoading, renameFile} = useFiles()

    const {showTelescope} = useTelescope()
    // const {showDialog: showGitImport} = useGitImport()
    const {showDialog: showAddFile} = useAddFile()
    const {showDialog: showDeleteFile} = useFileDelete()

    // holds the names of all open directories.
    const [openDirs, setOpenDirs] = useState(new Set<string>())

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
                showAddFile("")
            }
        }
        // Add the event listener to the window
        window.addEventListener('keydown', handleKeyDown)
        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [selectedHost])

    const handleDelete = (file: string) => {
        closeTab(file)
        showDeleteFile(file)
    }

    // file list toggles
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
    ////////////////////////////////////////////////////////////////////////////////////

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
                <Typography variant={"h6"}>
                    Files
                </Typography>

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
                        <Search fontSize="small"/>
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
                        onClick={() => showAddFile('')}
                        color="success"
                        sx={{ml: 1}} // Add left margin for spacing between buttons
                        aria-label="Add"
                    >
                        <Add fontSize="small"/>
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
                            <FileBarItem
                                key={group.name}
                                group={group}
                                onAdd={showAddFile}
                                onDelete={handleDelete}
                                isOpen={openDirs.has(group.name)}
                                onRename={renameFile}
                                onToggle={handleToggle}
                            />
                        ))}
                    </List>
                )}
            </StyledScrollbarBox>
        </Box>
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
