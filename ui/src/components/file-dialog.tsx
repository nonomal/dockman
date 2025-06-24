import React, {useEffect, useState} from "react";
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,} from "@mui/material";
import {Add, AddCircleOutline, Cancel, InfoOutlined, WarningAmberOutlined} from "@mui/icons-material";

interface AddFileDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    parentName: string;
}

export function AddFileDialog({open, onClose, onConfirm, parentName}: AddFileDialogProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    // Reset state when the dialog opens or closes
    useEffect(() => {
        if (open) {
            setName('');
            setError('');
        }
    }, [open]);

    const handleConfirm = () => {
        // Proceed only if the name is not empty and there are no errors
        if (name.trim() && !error) {
            onConfirm(name.trim());
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);

        // Validation: Prevent subdirectories if a parentName is set
        if (parentName && value.includes('/')) {
            setError("Subdirectories cannot be created here. Please enter a valid file name.");
        } else {
            setError('');
        }
    };

    const dialogTitle = parentName
        ? `Add file to "${parentName}"`
        : "Add new file";

    const helperTextContent = parentName ? (
        <Box>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                <WarningAmberOutlined color="error" sx={{fontSize: '1rem'}}/>
                <Typography component="span" variant="body2">
                    File name cannot contain slashes ('/').
                </Typography>
            </Box>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5}}>
                <WarningAmberOutlined color="error" sx={{fontSize: '1rem'}}/>
                <Typography component="span" variant="body2">
                    Cannot create child folders inside existing folders.
                </Typography>
            </Box>
        </Box>
    ) : (
        <Box>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                <InfoOutlined color="action" sx={{fontSize: '1rem'}}/>
                <Typography component="span" variant="body2">
                    e.g., my-file.txt or new-folder/file.txt
                </Typography>
            </Box>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5}}>
                <InfoOutlined color="action" sx={{fontSize: '1rem'}}/>
                <Typography component="span" variant="body2">
                    Directories will be created automatically.
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">

            <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <AddCircleOutline color="primary"/>
                {dialogTitle}
            </DialogTitle>

            <DialogContent dividers sx={{pt: 2.5}}>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    label="File Name"
                    variant="outlined"
                    value={name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    error={!!error}
                    helperText={error || helperTextContent}
                    // --- 3. Add Spacing between TextField and HelperText ---
                    sx={{
                        '& .MuiFormHelperText-root': {
                            mt: 1, // Adds 8px margin-top
                        },
                    }}
                />
            </DialogContent>

            {/* --- 4. Dialog Actions with Icons and improved spacing --- */}
            <DialogActions sx={{px: 3, py: 2, gap: 1.5}}>
                <Button onClick={onClose} startIcon={<Cancel/>}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={!name.trim() || !!error}
                    startIcon={<Add/>}
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
    ;
}