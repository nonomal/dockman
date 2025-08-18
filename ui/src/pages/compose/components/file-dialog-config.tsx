import {useConfig} from "../../../hooks/config.ts";
import {type ChangeEvent, useState} from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions, DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Switch,
    Typography
} from "@mui/material";

export function FileConfigDialog({open, onClose}: { open: boolean, onClose: () => void }) {
    const {config, updateSettings} = useConfig()
    const [localConfig, setLocalConfig] = useState(config)

    // uses the name attribute from the Switch component to determine which key in the localConfig object to update.
    const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = event.target
        setLocalConfig(prevConfig => ({
            ...prevConfig,
            [name]: checked
        }))
    }

    const handleSave = () => {
        console.log('Saving config:')
        updateSettings(localConfig).then()
        onClose()
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="file-config-dialog-title"
            slotProps={{
                paper: {
                    // sx: {
                    //     backgroundColor: '#2d2d2d', // Darker background color
                    //     color: '#f5f5f5',         // Light text color for contrast
                    // }
                },
            }}
        >
            <DialogTitle
                id="file-config-dialog-title"
                sx={{borderBottom: 1, borderColor: 'grey.700'}}
            >
                File Display Config
            </DialogTitle>
            <DialogContent
                sx={{
                    borderBottom: 1,
                    borderColor: 'grey.700',
                    paddingY: '24px'
                }}
            >
                <DialogContentText sx={{color: 'grey.400', marginBottom: 3}}>
                    Configure your file settings here.
                </DialogContentText>

                <Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localConfig.useComposeFolders}
                                onChange={handleSwitchChange}
                                name="useComposeFolders"
                            />
                        }
                        label="Use compose folders"
                    />
                    <Typography variant="caption" display="block" sx={{color: 'grey.500', mt: 0.5, ml: 4}}>
                        Convert all folders with a single compose file into a top-level compose file. The folder remains
                        under the hood; only how the folder is displayed is changed.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions
                // Add padding to the button section
                sx={{padding: '16px 24px'}}
            >
                <Button onClick={onClose} sx={{color: 'white'}}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}
