import React, {useEffect, useState} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@mui/material";

interface AddFileDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    parentName: string;
}

export function AddFileDialog({open, onClose, onConfirm, parentName}: AddFileDialogProps) {
    const [name, setName] = useState('');

    // Reset name when dialog opens
    useEffect(() => {
        if (open) {
            setName('');
        }
    }, [open]);

    const handleConfirm = () => {
        if (name.trim()) {
            onConfirm(name.trim());
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {parentName ? `Add subfile to "${parentName}"` : "Add new root file"}
            </DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    label="File Name"
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm} variant="contained">Add</Button>
            </DialogActions>
        </Dialog>
    );
}
