import {Box, Button, Menu, MenuItem, Typography} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import {KeyChar} from "./keychar.tsx";
import {ExpandMore} from "@mui/icons-material";
import { useHost } from "../../hooks/host.ts";

function HostSelectDropdown() {
    const {selectedHost, availableHosts, switchMachine, isLoading} = useHost()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.altKey && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                if (!open) {
                    setAnchorEl(buttonRef.current);
                } else {
                    setAnchorEl(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (hostName: string) => {
        switchMachine(hostName).then(() => {
            handleClose();
        });
    };

    return (
        <>
            <Button
                ref={buttonRef}
                id="host-select-button"
                aria-controls={open ? 'host-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleOpen}
                disabled={isLoading}
                variant="outlined"
                sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none', // Keep the text as is
                    color: 'text.primary',
                    borderColor: 'divider',
                    px: 1.5, // Add horizontal padding
                    py: 1.5, // Add vertical padding
                }}
                endIcon={<ExpandMore/>}
            >
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography variant="subtitle1" >
                        {selectedHost || 'Select host...'}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'text.secondary',
                        ml: 2,
                    }}
                >
                    <KeyChar>ALT</KeyChar>
                    <Typography variant="body2">+</Typography>
                    <KeyChar>W</KeyChar>
                </Box>
            </Button>
            <Menu
                id="host-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'host-select-button',
                }}
                PaperProps={{
                    sx: {
                        minWidth: buttonRef.current?.offsetWidth, // Match the button width
                        marginTop: 1,
                    }
                }}
            >
                <MenuItem disabled>
                    <em>{isLoading ? 'Loading...' : 'Select...'}</em>
                </MenuItem>
                {availableHosts.map((hostName) => (
                    <MenuItem
                        key={hostName}
                        selected={hostName === selectedHost}
                        onClick={() => handleSelect(hostName)}
                    >
                        {hostName}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

export default HostSelectDropdown;
