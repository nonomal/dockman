import React, {useEffect, useState} from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'
import {Box} from "@mui/material"

interface FileDialogDeleteProps {
    fileToDelete: string
    onClose: () => void
    handleDelete: (fileName: string) => void
}

const FileDialogDelete: React.FC<FileDialogDeleteProps> = (
    {
        fileToDelete,
        onClose,
        handleDelete,
    }) => {

    const [open, setOpen] = useState(false)

    useEffect(() => {
        setOpen(!!fileToDelete)
    }, [fileToDelete]);

    const onCancel = () => {
        setOpen(false)
    }

    const onDelete = () => {
        if (fileToDelete) {
            handleDelete(fileToDelete)
        }
        onCancel()
    }

    const fileName = fileToDelete || ''

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            slotProps={{
                transition: {
                    onExited: onClose
                },
                paper: {
                    sx: {
                        backgroundColor: "#000000",
                        color: "#d6d6d6",
                        borderRadius: 3,
                        border: "2px solid #444",
                        p: 2
                    }
                }
            }}
        >
            <DialogTitle sx={{
                border: "3px solid #444",
                borderRadius: 1,
                p: 3,
            }}>
                Delete
                <Box component="span" sx={{
                    color: "#ff6b6b",
                    pl: 1,
                }}>
                    {fileName}
                </Box>
            </DialogTitle>

            <DialogActions sx={{pt: 3}}>
                <Button
                    onClick={onCancel}
                    variant="outlined"
                    sx={{
                        borderColor: "#666",
                        color: "#fff",
                        borderRadius: 2,
                        "&:hover": {
                            borderColor: "#888",
                            backgroundColor: "#2a2a2a"
                        }
                    }}
                >
                    Cancel
                </Button>

                <Button
                    onClick={onDelete}
                    variant="outlined"
                    color="error"
                    sx={{
                        borderColor: "#ff4d4d",
                        borderRadius: 2,
                        "&:hover": {
                            borderColor: "#ff6666",
                            backgroundColor: "rgba(255,77,77,0.1)"
                        }
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default FileDialogDelete