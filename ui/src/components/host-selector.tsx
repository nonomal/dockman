import {Box, FormControl, InputLabel, MenuItem, Select, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {KeyChar} from "./keychar.tsx";
import {useHost} from "../hooks/host.ts";

function HostSelectDropdown() {
    const {selectedHost, availableHosts, switchMachine, isLoading} = useHost()
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.altKey && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                setOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const label = "Docker Host";
    const labelId = "host-select-label";
    return (
        <FormControl sx={{minWidth: 260}} disabled={isLoading}>
            <InputLabel id={labelId}>{label}</InputLabel>
            <Select
                id="host-machine-select"
                label={label}
                labelId={labelId}
                value={selectedHost}
                onChange={event => {
                    switchMachine(event.target.value ?? "").then();
                }}
                open={open}
                onClose={() => setOpen(false)}
                onOpen={() => setOpen(true)}
                renderValue={(selected) => (
                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                        {/* The selected host name */}
                        <span>{selected}</span>
                        {/* The keyboard hint with icons */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'text.secondary',
                                pointerEvents: 'none',
                            }}
                        >
                            <KeyChar>ALT</KeyChar>
                            <Typography variant="body2">+</Typography>
                            <KeyChar>W</KeyChar>
                        </Box>
                    </Box>
                )}
            >
                <MenuItem value="" disabled>
                    <em>{isLoading ? 'Loading hosts...' : 'Select a host...'}</em>
                </MenuItem>
                {availableHosts.map((hostName) => (
                    <MenuItem key={hostName} value={hostName}>
                        {hostName}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default HostSelectDropdown;