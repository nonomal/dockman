import {Link as RouterLink, useLocation} from "react-router-dom";
import React from "react";
import {IconButton, List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import {Add as AddIcon, AttachFileRounded, Delete as DeleteIcon, Description as FileIcon} from '@mui/icons-material';
import type {FileGroup} from '../hooks/files.ts';

interface FileItemProps {
    group: FileGroup;
    onAdd: (parentName: string) => void;
    onDelete: (fileName: string) => void;
}

export const FileItem = React.memo(({group, onAdd, onDelete}: FileItemProps) => {
    const location = useLocation();

    const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    return (
        <>
            <ListItemButton
                component={RouterLink}
                to={`/files/${group.name}/editor`}
                selected={location.pathname.startsWith(`/files/${group.name}`)}
            >
                <ListItemIcon><FileIcon/></ListItemIcon>
                <ListItemText primary={group.name}/>
                <IconButton size="small" onClick={(e) => handleActionClick(e, () => onAdd(group.name))}>
                    <AddIcon/>
                </IconButton>
                <IconButton size="small" onClick={(e) => handleActionClick(e, () => onDelete(group.name))}>
                    <DeleteIcon/>
                </IconButton>
            </ListItemButton>
            {group.children.length > 0 && (
                <List disablePadding sx={{pl: 4}}>
                    {group.children.map((child: string) => (
                        <ListItemButton
                            key={child}
                            component={RouterLink}
                            to={`/files/${child}/editor`}
                            selected={location.pathname.startsWith(`/files/${child}`)}
                        >
                            <ListItemIcon><AttachFileRounded sx={{fontSize: '1.25rem'}}/></ListItemIcon>
                            <ListItemText primary={child}/>
                            <IconButton size="small" onClick={(e) => handleActionClick(e, () => onDelete(child))}>
                                <DeleteIcon/>
                            </IconButton>
                        </ListItemButton>
                    ))}
                </List>
            )}
        </>
    );
});
