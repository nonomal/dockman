import {Link as RouterLink, useLocation} from 'react-router-dom';
import {Collapse, IconButton, List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import {
    Add as AddIcon,
    Article as ArticleIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon,
    ExpandLess,
    ExpandMore,
    Folder as FolderIcon
} from '@mui/icons-material';
import type {FileGroup} from "../hooks/files.ts";
import React from "react";

export interface FileItemProps {
    group: FileGroup;
    onAdd: (name: string) => void;
    onDelete: (name: string) => void;
    isOpen: boolean;
    onToggle: (name: string) => void;
}

export const FileItem = React.memo(({group, onAdd, onDelete, isOpen, onToggle}: FileItemProps) => {
    const location = useLocation();
    const isDirectory = group.children.length !== 0;

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    const handleToggle = () => {
        if (isDirectory) {
            onToggle(group.name);
        }
    };

    const ParentProps = !isDirectory ? {
        component: RouterLink,
        to: `/files/${group.name}?tab=editor`,
        selected: location.pathname === `/files/${group.name}`,
    } : {
        onClick: handleToggle,
    };

    return (
        <>
            <ListItemButton {...ParentProps}>
                <ListItemIcon>
                    {isDirectory ? <FolderIcon/> : <DescriptionIcon/>}
                </ListItemIcon>
                <ListItemText primary={group.name}/>

                {isDirectory && (isOpen ? <ExpandLess/> : <ExpandMore/>)}
                {/* Show Add button only for directories */}
                {isDirectory && (
                    <IconButton size="small" onClick={(e) => handleActionClick(e, () => onAdd(group.name))}>
                        <AddIcon fontSize="small"/>
                    </IconButton>
                )}

                <IconButton size="small" onClick={(e) => handleActionClick(e, () => onDelete(group.name))}>
                    <DeleteIcon fontSize="small"/>
                </IconButton>

            </ListItemButton>

            {isDirectory && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{pl: 4}}>
                        {group.children.map((child: string) => {
                            const childBase = `${group.name}/${child}`;
                            const childPath = `/files/${childBase}`;
                            return (
                                <ListItemButton
                                    key={child}
                                    component={RouterLink}
                                    to={`${childPath}?tab=editor`}
                                    selected={location.pathname === childPath}
                                >
                                    <ListItemIcon><ArticleIcon sx={{fontSize: '1.25rem'}}/></ListItemIcon>
                                    <ListItemText primary={child}/>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleActionClick(e, () => onDelete(childBase))}
                                    >
                                        <DeleteIcon fontSize="small"/>
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