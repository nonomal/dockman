import {Box, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent, Typography} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {callRPC, useClient} from "../lib/api";
import {useSnackbar} from "../hooks/snackbar";
import {HostManagerService} from "../gen/host_manager/v1/host_manager_pb.ts";
import {KeyChar} from "./keychar.tsx";

function HostSelectDropdown() {
    const [availableHosts, setAvailableHosts] = useState<string[]>([]);
    const [selectedHost, setSelectedHost] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [open, setOpen] = useState(false);

    const hostManagerClient = useClient(HostManagerService);
    const {showError} = useSnackbar();

    const switchMachine = useCallback(async (machine: string) => {
        if (!machine) return;
        console.log(`Switching to machine: ${machine}`);
        const {err} = await callRPC(() => hostManagerClient.switchClient({machineID: machine}));
        if (err) {
            showError(err);
        }
    }, [hostManagerClient, showError]);

    useEffect(() => {
        const fetchHosts = async () => {
            setLoading(true);
            const {val, err} = await callRPC(() => hostManagerClient.list({}));
            if (err) {
                showError(err);
                setLoading(false);
                return;
            }

            setAvailableHosts(val?.machines.map(value => value.name) || []);
            setSelectedHost(val?.activeClient || "")
            setLoading(false);
        };

        fetchHosts();
    }, [hostManagerClient, showError]);

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

    const handleChange = (event: SelectChangeEvent) => {
        const newHost = event.target.value;
        setOpen(false);
        setSelectedHost(newHost);
        switchMachine(newHost).then();
    };


    const label = "Docker Host";
    const labelId = "host-select-label";
    return (
        <FormControl sx={{minWidth: 260}} disabled={loading}>
            <InputLabel id={labelId}>{label}</InputLabel>
            <Select
                id="host-machine-select"
                label={label}
                labelId={labelId}
                value={selectedHost}
                onChange={handleChange}
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
                    <em>{loading ? 'Loading hosts...' : 'Select a host...'}</em>
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