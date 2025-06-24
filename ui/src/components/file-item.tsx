import {Link as RouterLink, useLocation} from 'react-router-dom';
import {Collapse, IconButton, List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import {Add as AddIcon, Delete as DeleteIcon, ExpandLess, ExpandMore, Folder as FolderIcon} from '@mui/icons-material';
import type {FileGroup} from "../hooks/files.ts";
import React from "react";
import {amber} from "@mui/material/colors";
import FileIcon from "./file-icon.tsx";

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
            to: `/files/${group.name}`,
            selected: location.pathname === `/files/${group.name}`,
        } : {
            onClick: handleToggle,
        };

        return (
            <>
                <ListItemButton {...ParentProps}>
                    <ListItemIcon>
                        {isDirectory
                            ? <FolderIcon sx={{color: amber[800]}}/>
                            : <FileIcon filename={group.name}/>
                        }
                    </ListItemIcon>
                    <ListItemText primary={group.name}/>

                    {isDirectory && (isOpen ? <ExpandLess/> : <ExpandMore/>)}
                    {isDirectory && (
                        <IconButton size="small" onClick={(e) => handleActionClick(e, () => onAdd(group.name))}
                                    color="success">
                            <AddIcon fontSize="small"/>
                        </IconButton>
                    )}
                    <IconButton size="small" onClick={(e) => handleActionClick(e, () => onDelete(group.name))}
                                color="error">
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
                                        to={`${childPath}`}
                                        selected={location.pathname === childPath}
                                    >
                                        <ListItemIcon>
                                            <FileIcon filename={child}/>
                                        </ListItemIcon>
                                        <ListItemText primary={child}/>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleActionClick(e, () => onDelete(childBase))}
                                            color="error"
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
    }
);