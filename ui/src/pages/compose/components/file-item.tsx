import {Link as RouterLink, useLocation} from 'react-router-dom';
import {Box, Collapse, IconButton, List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import {Add, Delete, ExpandLess, ExpandMore, Folder} from '@mui/icons-material';
import {type FileGroup, useFiles} from "../../../hooks/files.ts";
import React from "react";
import FileIcon, {DockerFolderIcon} from "./file-icon.tsx";
import {amber} from "@mui/material/colors";

interface FileItemProps {
    group: FileGroup,
    isOpen: boolean,
    onToggle: (name: string) => void,
    onAdd: (name: string) => void,
    isSelected?: boolean; // Add this
    level?: number; // Add this
}

const FileItem = React.memo(({group, onAdd, isOpen, onToggle}: FileItemProps) => {
    const location = useLocation();
    const {deleteFile} = useFiles()

    const isDirectory = group.children.length > 0;
    const isRootFile = !isDirectory;

    // For root files, check if it's a compose file
    const isRootComposeFile = isRootFile && group.name.endsWith('compose.yaml');

    const onDelete = (filename: string) => {
        deleteFile(filename, location.pathname).then()
    }

    // Extract compose file and supporting files from directory
    const extractComposeInfo = () => {
        if (!isDirectory) return {compose: null, support: []};

        let compose: string | null = null;
        const support: string[] = [];

        for (const child of group.children) {
            if (!compose && child.endsWith('compose.yaml')) {
                compose = child;
            } else {
                support.push(child);
            }
        }

        return {compose, support};
    };

    const {compose, support} = extractComposeInfo();
    const hasCompose = Boolean(compose);

    const handleToggle = () => {
        if (isDirectory) {
            onToggle(group.name);
        }
    };

    // Render root file (non-directory)
    if (isRootFile) {
        return (
            <ListItemButton
                component={RouterLink}
                to={`/files/${group.name}`}
                selected={location.pathname === `/files/${group.name}`}
                sx={{py: isRootComposeFile ? 1.25 : 1}}
            >
                <ListItemIcon sx={{minWidth: 32}}>
                    <FileIcon filename={group.name}/>
                </ListItemIcon>

                <Box sx={{flex: 1, mr: 1}}>
                    <ListItemText
                        primary={group.name}
                        slotProps={{
                            primary: {sx: {fontSize: '0.85rem'}}
                        }}
                    />
                    {isRootComposeFile && <ComposeActions urlPath={`files/${group.name}`}/>}
                </Box>

                <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, () => onDelete(group.name))}
                    color="error"
                >
                    <Delete fontSize="small"/>
                </IconButton>
            </ListItemButton>
        );
    }

    // Render directory
    const composePath = compose ? `${group.name}/${compose}` : null;
    const composeUrlPath = composePath ? `/files/${composePath}` : null;

    // Handle click for compose folders - navigate on first click, toggle on subsequent clicks
    const handleMainItemClick = () => {
        if (hasCompose && composeUrlPath) {
            // If already selected (open), toggle instead of navigate
            if (location.pathname === composeUrlPath) {
                handleToggle();
                return;
            }
            // If not selected, let RouterLink handle navigation
        } else {
            handleToggle();
        }
    };

    // Determine main item props based on whether compose file exists
    const mainItemProps = hasCompose && composeUrlPath ? {
        component: RouterLink,
        to: composeUrlPath,
        selected: location.pathname === composeUrlPath,
        onClick: handleMainItemClick
    } : {
        onClick: handleToggle
    };

    return (
        <>
            {/* Main directory item */}
            <ListItemButton
                {...mainItemProps}
                sx={{py: hasCompose ? 1.25 : 1}}
            >
                <ListItemIcon sx={{minWidth: 32}}>
                    {hasCompose ? (
                        <DockerFolderIcon/>
                    ) : (
                        <Folder sx={{color: amber[800], fontSize: '1.1rem'}}/>
                    )}
                </ListItemIcon>

                <Box sx={{flex: 1, mr: 1}}>
                    <ListItemText
                        primary={hasCompose ? compose : group.name}
                        slotProps={{
                            primary: {sx: {fontSize: '0.85rem'}}
                        }}
                    />
                    {hasCompose && composeUrlPath && (
                        <ComposeActions urlPath={composeUrlPath}/>
                    )}
                </Box>

                {/* Directory actions */}
                <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, () => onAdd(group.name))}
                    color="success"
                >
                    <Add fontSize="small"/>
                </IconButton>

                <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, () => onDelete(group.name))}
                    color="error"
                >
                    <Delete fontSize="small"/>
                </IconButton>

                {/* Show expand/collapse icon */}
                {(hasCompose ? support.length > 0 : group.children.length > 0) && (
                    <IconButton
                        size="small"
                        onClick={(e) => handleActionClick(e, handleToggle)}
                        sx={{ml: 0.5}}
                    >
                        {isOpen ? <ExpandLess fontSize="small"/> : <ExpandMore fontSize="small"/>}
                    </IconButton>
                )}
            </ListItemButton>

            {/* Collapsible children section */}
            {isDirectory && (
                <Collapse in={isOpen} timeout={125} unmountOnExit>
                    <List disablePadding sx={{pl: 4}}>
                        {(hasCompose ? support : group.children).map((child: string) => {
                            const childBase = `${group.name}/${child}`;
                            const childPath = `/files/${childBase}`;
                            const isChildComposeFile = child.endsWith('compose.yaml');

                            return (
                                <ListItemButton
                                    key={child}
                                    component={RouterLink}
                                    to={childPath}
                                    selected={location.pathname === childPath}
                                    sx={{py: isChildComposeFile ? 1.25 : 1}}
                                >
                                    <ListItemIcon sx={{minWidth: 32}}>
                                        <FileIcon filename={child}/>
                                    </ListItemIcon>

                                    <Box sx={{flex: 1, mr: 1}}>
                                        <ListItemText
                                            primary={child}
                                            slotProps={{
                                                primary: {sx: {fontSize: '0.85rem'}}
                                            }}
                                        />
                                        {isChildComposeFile && (
                                            <ComposeActions urlPath={childPath}/>
                                        )}
                                    </Box>

                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleActionClick(e, () => onDelete(childBase))}
                                        color="error"
                                    >
                                        <Delete fontSize="small"/>
                                    </IconButton>
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Collapse>
            )}
        </>
    );
});

// eslint-disable-next-line no-empty-pattern
function ComposeActions({}: { urlPath: string }) {
    // const navigate = useNavigate();
    // todo
    return (<></>
        //     <Box sx={{mt: 0.5}}>
        //         <Tooltip title="Deploy" arrow>
        //             <IconButton
        //                 size="small"
        //                 onClick={(e) => handleActionClick(e, () => navigate(`${urlPath}?tab=1`))}
        //                 color="primary"
        //             >
        //                 <RocketLaunch fontSize="small"/>
        //             </IconButton>
        //         </Tooltip>
        //         <Tooltip title="Stats" arrow>
        //             <IconButton
        //                 size="small"
        //                 onClick={(e) => handleActionClick(e, () => navigate(`${urlPath}?tab=2`))}
        //                 color="secondary"
        //             >
        //                 <Analytics fontSize="small"/>
        //             </IconButton>
        //         </Tooltip>
        //     </Box>
    );
}

// Helper to stop click from propagating to parent ListItemButton
const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault(); // Prevent default link behavior
    e.stopPropagation(); // Stop the click event from bubbling up
    action();
};

export default FileItem;
