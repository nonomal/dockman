import React, {useEffect, useState} from "react"
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,} from "@mui/material"
import {Add, AddCircleOutline, Cancel, InfoOutlined, WarningAmberOutlined} from "@mui/icons-material"

interface AddFileDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: (name: string) => void
    parentName: string
}

export function FileDialogCreate({open, onClose, onConfirm, parentName}: AddFileDialogProps) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    // Reset state when the dialog opens or closes
    useEffect(() => {
        if (open) {
            setName('')
            setError('')
        }
    }, [open])

    const handleConfirm = () => {
        // Proceed only if the name is not empty and there are no errors
        if (name.trim() && !error) {
            onConfirm(name.trim())
            onClose()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm()
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setName(value)

        // Validation: Prevent subdirectories if a parentName is set
        if (parentName && value.includes('/')) {
            setError("Subdirectories cannot be created here. Please enter a valid file name.")
        } else {
            setError('')
        }
    }

    const dialogTitle = parentName
        ? `Add file to "${parentName}"`
        : "Add new file"

    const helperBullets = parentName ? [
            // !W are special bullet points and will be rendered as warnings
            `${WarningBullet}File name cannot contain slashes ('/').`,
            `${WarningBullet}Cannot create child folders inside existing folders.`,
        ]
        : [
            "Directories will be created automatically.",
            "Empty directories will not be shown or created: folder -> will be considered a text file ",
            "e.g., my-file.txt or new-folder/file.txt",
            "directories with compose files will be considered special"
        ]

    const helperTextContent = (
        <Box>
            <InfoMessages bullets={helperBullets}/>
        </Box>
    )

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
                    sx={{
                        '& .MuiFormHelperText-root': {
                            mt: 1, // Adds 8px margin-top
                        },
                    }}
                />
            </DialogContent>

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
    )
}

const WarningBullet = "!W"

function InfoMessages({bullets}: { bullets: string[] }) {
    return (
        <Box>
            {bullets.map((text, index) => {
                const isWarning = text.startsWith(WarningBullet);
                const message = isWarning ? text.slice(WarningBullet.length).trimStart() : text;

                return (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: index === 0 ? 0 : 0.5,
                        }}
                    >
                        {isWarning ? (
                            <WarningAmberOutlined color="error" sx={{fontSize: '1rem'}}/>
                        ) : (
                            <InfoOutlined color="action" sx={{fontSize: '1rem'}}/>
                        )}
                        <Typography component="span" variant="body2">
                            {message}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}