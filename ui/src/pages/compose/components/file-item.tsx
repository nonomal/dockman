import {Link as RouterLink, useLocation, useNavigate} from 'react-router-dom';
import {Box, Collapse, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip} from '@mui/material';
import {Add, Analytics, Delete, ExpandLess, ExpandMore, Folder, RocketLaunch} from '@mui/icons-material';
import React from "react";
import {amber} from "@mui/material/colors";
import FileIcon from "./file-icon.tsx";
import type {FileGroup} from "../../../hooks/files.ts";

interface FileItemProps {
    group: FileGroup;
    isOpen: boolean;
    onToggle: (name: string) => void;
    onAdd: (name: string) => void;
    onDelete: (name: string) => void;
}

const FileItem = React.memo(({group, onAdd, onDelete, isOpen, onToggle}: FileItemProps) => {
        const location = useLocation();
        const isDirectory = group.children.length !== 0;
        const isComposeFile = !isDirectory && group.name.endsWith('compose.yaml');

        const handleToggle = () => {
            if (isDirectory) {
                onToggle(group.name);
            }
        };

        const ParentProps = !isDirectory ? {
            component: RouterLink,
            to: `/files/${group.name}`,
            selected: location.pathname === `/files/${group.name}`,
        } : {
            onClick: handleToggle,
        };

        return (
            <>
                <ListItemButton {...ParentProps} sx={{py: isComposeFile ? 1.25 : 1}}>
                    <ListItemIcon>
                        {isDirectory
                            ? <Folder sx={{color: amber[800]}}/>
                            : <FileIcon filename={group.name}/>
                        }
                    </ListItemIcon>

                    <Box sx={{flex: 1, mr: 1}}>
                        <ListItemText
                            primary={group.name}
                            slotProps={{
                                primary: {sx: {fontSize: '0.95rem'}}
                            }}
                        />
                        {isComposeFile && <ComposeActions urlPath={`files/${group.name}`}/>}
                    </Box>

                    {/* Actions on the far right */}
                    {isDirectory && (
                        <IconButton size="small" onClick={(e) => handleActionClick(e, () => onAdd(group.name))}
                                    color="success">
                            <Add fontSize="small"/>
                        </IconButton>
                    )}
                    <IconButton size="small" onClick={(e) => handleActionClick(e, () => onDelete(group.name))}
                                color="error">
                        <Delete fontSize="small"/>
                    </IconButton>
                    {isDirectory && (isOpen ? <ExpandLess/> : <ExpandMore/>)}
                </ListItemButton>

                {isDirectory && (
                    <Collapse in={isOpen} timeout={125} unmountOnExit>
                        <List disablePadding sx={{pl: 4}}>
                            {group.children.map((child: string) => {
                                const childBase = `${group.name}/${child}`;
                                const childPath = `/files/${childBase}`;
                                const isChildComposeFile = child.endsWith('compose.yaml');

                                return (
                                    <ListItemButton
                                        key={child}
                                        component={RouterLink}
                                        to={`${childPath}`}
                                        selected={location.pathname === childPath}
                                        sx={{py: isChildComposeFile ? 1.25 : 1}}
                                    >
                                        <ListItemIcon>
                                            <FileIcon filename={child}/>
                                        </ListItemIcon>
                                        <Box sx={{flex: 1, mr: 1}}>
                                            <ListItemText
                                                primary={child}
                                                slotProps={{
                                                    primary: {sx: {fontSize: '0.95rem'}}
                                                }}
                                            />
                                            {isChildComposeFile && <ComposeActions urlPath={childPath}/>}
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
    }
);

function ComposeActions({urlPath}: { urlPath: string }) {
    const navigate = useNavigate();
    return (
        <Box sx={{mt: 0.5}}>
            <Tooltip title="Deploy" arrow>
                <IconButton
                    size="small"
                    // Use the helper to navigate without triggering the parent
                    onClick={(e) => handleActionClick(e, () => navigate(`${urlPath}?tab=1`))}
                    color="primary"
                >
                    <RocketLaunch fontSize="small"/>
                </IconButton>
            </Tooltip>
            <Tooltip title="Stats" arrow>
                <IconButton
                    size="small"
                    // Corrected the onClick and used the helper
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
    e.preventDefault(); // Prevent default link behavior
    e.stopPropagation(); // Stop the click event from bubbling up
    action();
};

export default FileItem;