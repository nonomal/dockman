import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Box, CircularProgress, Divider, IconButton, List, styled, Toolbar, Tooltip, Typography} from '@mui/material'
import {Add as AddIcon, Search as SearchIcon, Sync} from '@mui/icons-material'
import {useParams} from 'react-router-dom'
import FileBarItem from './file-bar-item.tsx'
import {useFiles} from "../../../hooks/files.ts"
import {useHost} from "../../../hooks/host.ts"
import {ShortcutFormatter} from "./shortcut-formatter.tsx"
import {useTelescope} from "../dialogs/search/search-hook.ts";
import {useGitImport} from "../dialogs/import/import-hook.ts";
import {useAddFile} from "../dialogs/add/add-hook.ts";
import {useFileDelete} from "../dialogs/delete/delete-hook.ts";
import {useAtom} from "jotai";
import {openFiles, sideBarState} from "../state.tsx";
import {useTabs} from "../../../hooks/tabs.ts";

export function FileList() {
    const {file: currentDir} = useParams<{ file: string }>()

    const {closeTab} = useTabs();

    const {selectedHost} = useHost()
    const {files, isLoading, renameFile} = useFiles()

    const {showTelescope} = useTelescope()
    const {showDialog: showGitImport} = useGitImport()
    const {showDialog: showAddFile} = useAddFile()
    const {showDialog: showDeleteFile} = useFileDelete()

    const [openDirs, setOpenDirs] = useAtom(openFiles)

    const [isSidebarCollapsed] = useAtom(sideBarState)
    const [sidebarWidth, setSidebarWidth] = useState(280)
    const [isResizing, setIsResizing] = useState(false)
    const sidebarRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.altKey) && event.key === 's') {
                event.preventDefault()
                showTelescope()
            }
            if ((event.altKey) && event.key === 'a') {
                event.preventDefault()
                showAddFile("")
            }
            if ((event.altKey) && event.key === 'i') {
                event.preventDefault()
                showGitImport()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedHost])

    const handleDelete = (file: string) => {
        closeTab(file)
        showDeleteFile(file)
    }

    useEffect(() => {
        if (currentDir) {
            setOpenDirs(prevOpenDirs => new Set(prevOpenDirs).add(currentDir))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDir, selectedHost])

    const handleToggle = useCallback((dirName: string) => {
        setOpenDirs(prevOpenDirs => {
            const newOpenDirs = new Set(prevOpenDirs)
            if (newOpenDirs.has(dirName)) {
                newOpenDirs.delete(dirName)
            } else {
                newOpenDirs.add(dirName)
            }
            return newOpenDirs
        })
    }, [setOpenDirs])

    // Resize functionality
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return

            const newWidth = e.clientX
            // Set min and max width constraints
            if (newWidth >= 200 && newWidth <= 600) {
                setSidebarWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing])

    return (
        <>
            {/* Sidebar Panel */}
            <Box
                ref={sidebarRef}
                sx={{
                    width: isSidebarCollapsed ? 0 : sidebarWidth,
                    flexShrink: 0,
                    borderRight: isSidebarCollapsed ? 0 : 1,
                    borderColor: 'divider',
                    overflowY: 'auto',
                    transition: isSidebarCollapsed ? 'width 0.15s ease' : 'width 0.15s ease',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative',
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
                            onClick={() => showAddFile('')}
                            color="success"
                            sx={{ml: 1}}
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
                            onClick={() => showGitImport()}
                            color="info"
                            sx={{ml: 1}}
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

                {/* Resize Handle */}
                {!isSidebarCollapsed && (
                    <Box
                        onMouseDown={handleMouseDown}
                        sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            cursor: 'col-resize',
                            backgroundColor: 'transparent',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'primary.main',
                            },
                            zIndex: 1300,
                        }}
                    />
                )}
            </Box>


        </>
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
