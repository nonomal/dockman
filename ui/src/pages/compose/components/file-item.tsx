import {Link as RouterLink, useLocation, useNavigate} from 'react-router-dom';
import {Box, Collapse, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip} from '@mui/material';
import {Add, Analytics, Delete, ExpandLess, ExpandMore, Folder, RocketLaunch} from '@mui/icons-material';
import {type FileGroup, useFiles} from "../../../hooks/files.ts";
import React from "react";
import FileIcon, {DockerFolderIcon} from "./file-icon.tsx";
import {amber} from "@mui/material/colors";

interface FileItemProps {
    group: FileGroup,
    isOpen: boolean,
    onToggle: (name: string) => void,
    onAdd: (name: string) => void,
    isSelected?: boolean;
    level?: number;
}

const COMPOSE_EXTENSIONS = ['compose.yaml', 'compose.yml'];

function isComposeFile(filename: string): boolean {
    return COMPOSE_EXTENSIONS.some(ext => filename.endsWith(ext));
}

// Transform FileGroup into a normalized structure for easier rendering
interface NormalizedFileGroup {
    type: 'file' | 'folder' | 'promoted-compose';
    name: string;
    displayName: string;
    composePath?: string; // Full path to compose file for promoted folders
    supportingFiles: string[]; // Supporting files for promoted compose folders
    allChildren: string[]; // All children for regular folders
    isCompose: boolean;
}

function normalizeFileGroup(group: FileGroup): NormalizedFileGroup {
    const isFile = group.children.length === 0;

    if (isFile) {
        return {
            type: 'file',
            name: group.name,
            displayName: group.name,
            supportingFiles: [],
            allChildren: [],
            isCompose: isComposeFile(group.name)
        };
    }

    // It's a folder - check for compose file promotion
    const composeFiles = group.children.filter(isComposeFile);

    if (composeFiles.length === 1) {
        // Single compose file - promote it
        const composeFile = composeFiles[0];
        const supportingFiles = group.children.filter(child => !isComposeFile(child));

        return {
            type: 'promoted-compose',
            name: group.name,
            displayName: composeFile,
            composePath: `${group.name}/${composeFile}`,
            supportingFiles,
            allChildren: group.children,
            isCompose: true
        };
    }

    // Multiple compose files or no compose files - display as regular folder
    return {
        type: 'folder',
        name: group.name,
        displayName: group.name,
        supportingFiles: [],
        allChildren: group.children,
        isCompose: false
    };
}

const FileItem = React.memo(({group, onAdd, isOpen, onToggle}: FileItemProps) => {
    const {deleteFile} = useFiles();
    const normalized = normalizeFileGroup(group);

    const onDelete = (filename: string) => {
        deleteFile(filename).then();
    };

    const handleToggle = () => {
        onToggle(group.name);
    };

    // Render a simple file
    if (normalized.type === 'file') {
        return (
            <FileListItem
                filename={normalized.name}
                displayName={normalized.displayName}
                isCompose={normalized.isCompose}
                onDelete={() => onDelete(normalized.name)}
            />
        );
    }

    // Render a promoted compose folder or regular folder
    const shouldShowAsNavigable = normalized.type === 'promoted-compose';
    const hasChildren = normalized.type === 'promoted-compose'
        ? normalized.supportingFiles.length > 0
        : normalized.allChildren.length > 0;

    return (
        <>
            <FolderListItem
                folderName={normalized.name}
                displayName={normalized.displayName}
                composePath={normalized.composePath}
                isCompose={normalized.isCompose}
                navigable={shouldShowAsNavigable}
                hasChildren={hasChildren}
                isOpen={isOpen}
                onAdd={() => onAdd(normalized.name)}
                onDelete={() => onDelete(normalized.name)}
                onToggle={handleToggle}
            />

            {hasChildren && (
                <Collapse in={isOpen} timeout={125} unmountOnExit>
                    <List disablePadding sx={{pl: 4}}>
                        {(normalized.type === 'promoted-compose'
                                ? normalized.supportingFiles
                                : normalized.allChildren
                        ).map((child: string) => {
                            const childPath = `${normalized.name}/${child}`;
                            return (
                                <FileListItem
                                    key={child}
                                    filename={childPath}
                                    displayName={child}
                                    isCompose={isComposeFile(child)}
                                    onDelete={() => onDelete(childPath)}
                                />
                            );
                        })}
                    </List>
                </Collapse>
            )}
        </>
    );
});

// Extracted component for file list items
interface FileListItemProps {
    filename: string;
    displayName: string;
    isCompose: boolean;
    onDelete: () => void;
}

const FileListItem = React.memo(({filename, displayName, isCompose, onDelete}: FileListItemProps) => {
    const location = useLocation();
    const filePath = `/stacks/${filename}`;

    return (
        <ListItemButton
            component={RouterLink}
            to={filePath}
            selected={location.pathname === filePath}
            sx={{py: isCompose ? 1.25 : 1}}
        >
            <ListItemIcon sx={{minWidth: 32}}>
                <FileIcon filename={displayName}/>
            </ListItemIcon>

            <Box sx={{flex: 1, mr: 1}}>
                <ListItemText
                    primary={displayName}
                    slotProps={{
                        primary: {sx: {fontSize: '0.85rem'}}
                    }}
                />
                {isCompose && <ComposeActions urlPath={filePath}/>}
            </Box>

            <IconButton
                size="small"
                onClick={(e) => handleActionClick(e, onDelete)}
                color="error"
            >
                <Delete fontSize="small"/>
            </IconButton>
        </ListItemButton>
    );
});

// Extracted component for folder list items
interface FolderListItemProps {
    folderName: string;
    displayName: string;
    composePath?: string;
    isCompose: boolean;
    navigable: boolean;
    hasChildren: boolean;
    isOpen: boolean;
    onAdd: () => void;
    onDelete: () => void;
    onToggle: () => void;
}

const FolderListItem = React.memo(
    ({
         displayName,
         composePath,
         isCompose,
         navigable,
         hasChildren,
         isOpen,
         onAdd,
         onDelete,
         onToggle
     }: FolderListItemProps) => {
        const location = useLocation();

        const handleMainItemClick = () => {
            if (navigable && composePath) {
                const composeUrlPath = `/stacks/${composePath}`;
                // If already selected, toggle instead of navigate
                if (location.pathname === composeUrlPath) {
                    onToggle();
                    return;
                }
                // Otherwise let RouterLink handle navigation
            } else {
                onToggle();
            }
        };

        // Determine main item props based on whether it's navigable
        const mainItemProps = navigable && composePath ? {
            component: RouterLink,
            to: `/stacks/${composePath}`,
            selected: location.pathname === `/stacks/${composePath}`,
            onClick: handleMainItemClick
        } : {
            onClick: onToggle
        };

        return (
            <ListItemButton
                {...mainItemProps}
                sx={{py: isCompose ? 1.25 : 1}}
            >
                <ListItemIcon sx={{minWidth: 32}}>
                    {isCompose ? (
                        <DockerFolderIcon/>
                    ) : (
                        <Folder sx={{color: amber[800], fontSize: '1.1rem'}}/>
                    )}
                </ListItemIcon>

                <Box sx={{flex: 1, mr: 1}}>
                    <ListItemText
                        primary={displayName}
                        slotProps={{
                            primary: {sx: {fontSize: '0.85rem'}}
                        }}
                    />
                    {isCompose && composePath && (
                        <ComposeActions urlPath={`/stacks/${composePath}`}/>
                    )}
                </Box>

                {/* Folder actions */}
                <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, onAdd)}
                    color="success"
                >
                    <Add fontSize="small"/>
                </IconButton>

                <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, onDelete)}
                    color="error"
                >
                    <Delete fontSize="small"/>
                </IconButton>

                {/* Show expand/collapse icon */}
                {hasChildren && (
                    <IconButton
                        size="small"
                        onClick={(e) => handleActionClick(e, onToggle)}
                        sx={{ml: 0.5}}
                    >
                        {isOpen ? <ExpandLess fontSize="small"/> : <ExpandMore fontSize="small"/>}
                    </IconButton>
                )}
            </ListItemButton>
        );
    });

function ComposeActions({urlPath}: { urlPath: string }) {
    const navigate = useNavigate();

    return (<Box sx={{mt: 0.5}}>
            <Tooltip title="Deploy" arrow>
                <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, () => navigate(`${urlPath}?tab=1`))}
                    color="primary"
                >
                    <RocketLaunch fontSize="small"/>
                </IconButton>
            </Tooltip>
            <Tooltip title="Stats" arrow>
                <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, () => navigate(`${urlPath}?tab=2`))}
                    color="secondary"
                >
                    <Analytics fontSize="small"/>
                </IconButton>
            </Tooltip>
        </Box>
    );
}

// Helper to stop click from propagating to parent ListItemButton
const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
};

FileItem.displayName = 'FileItem';
FileListItem.displayName = 'FileListItem';
FolderListItem.displayName = 'FolderListItem';

export default FileItem;
