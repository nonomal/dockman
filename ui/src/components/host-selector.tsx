import {Box, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {callRPC, useClient} from "../lib/api";
import {useSnackbar} from "../hooks/snackbar";
import {HostManagerService} from "../gen/host_manager/v1/host_manager_pb.ts";


function HostSelectDropdown() {
    const [availableHosts, setAvailableHosts] = useState<string[]>([]);
    const [selectedHost, setSelectedHost] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const hostManagerClient = useClient(HostManagerService);
    const {showError} = useSnackbar();

    const label = "Host Machine";
    const labelId = "host-select-label";

    const switchMachine = useCallback(async (machine: string) => {
        if (!machine) return;
        console.log(`Switching to machine: ${machine}`);
        const {err} = await callRPC(() => hostManagerClient.switchClient({machineID: machine}));
        if (err) {
            showError(err);
        }
    }, [hostManagerClient]);

    useEffect(() => {
        const fetchHosts = async () => {
            setLoading(true);
            const {val, err} = await callRPC(() => hostManagerClient.list({}));
            if (err) {
                showError(err);
                return;
            }

            setAvailableHosts(val?.machines.map(value => value.name) || []);
        };

        fetchHosts().then(() => {
            setLoading(false);
        });
    }, [hostManagerClient]);


    const handleChange = (event: SelectChangeEvent<string>) => {
        const newHost = event.target.value;
        setSelectedHost(newHost);
        switchMachine(newHost);
    };

    return (
        <Box sx={{minWidth: 200, maxWidth: 350}}>
            {/* The FormControl provides context and structure */}
            <FormControl fullWidth disabled={loading}>
                <InputLabel id={labelId}>{label}</InputLabel>
                <Select
                    labelId={labelId}
                    id="host-machine-select"
                    value={selectedHost}
                    label={label}
                    onChange={handleChange}
                >
                    {/* Show a helpful message based on the loading state */}
                    <MenuItem value="" disabled>
                        <em>{loading ? 'Loading hosts...' : 'Select a host...'}</em>
                    </MenuItem>

                    {/* Map over the fetched hosts to create the options */}
                    {availableHosts.map((hostName) => (
                        <MenuItem key={hostName} value={hostName}>
                            {hostName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}

export default HostSelectDropdown;