import LogsTerminal, {type TerminalHandle} from "../compose/components/logs-terminal.tsx";
import {useEffect, useRef, useState} from "react";
import {transformAsyncIterable, useClient} from "../../lib/api.ts";
import {Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton} from '@mui/material'; // Or your preferred UI library
import {DockerService, type LogsMessage} from "../../gen/docker/v1/docker_pb.ts";
import {useSnackbar} from "../../hooks/snackbar.ts";
import CloseIcon from "@mui/icons-material/Close";


interface LogsDialogProps {
    show: boolean;
    hide: () => void;
    name: string;
    containerID: string;
}

export const LogsDialog = ({show, hide, name, containerID}: LogsDialogProps) => {
    const dockerService = useClient(DockerService);
    const {showError} = useSnackbar();

    const [panelTitle, setPanelTitle] = useState('');
    const [logStream, setLogStream] = useState<AsyncIterable<string> | null>(null);

    const terminalRef = useRef<TerminalHandle>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (containerID) {
            setPanelTitle(`Logs - ${name}`);
            manageStream<LogsMessage>({
                getStream: signal => dockerService.containerLogs({containerID: containerID}, {signal}),
                transform: item => item.message,
            });
        }

        return () => {
            abortControllerRef.current?.abort()
            setPanelTitle('')
            setLogStream(null)
        };
    }, [containerID, dockerService, name]);

    const manageStream = <T, >({getStream, transform}: {
        getStream: (signal: AbortSignal) => AsyncIterable<T>;
        transform: (item: T) => string;
    }) => {
        // Close any previous stream before starting a new one
        abortControllerRef.current?.abort("User started a new action");
        const newController = new AbortController();
        abortControllerRef.current = newController;

        const sourceStream = getStream(newController.signal);
        const transformedStream = transformAsyncIterable(sourceStream, {
            transform,
            onComplete: () => {
                console.log("Stream completed successfully.");
            },
            onError: error => showError(error),
            onFinally: () => {
                if (abortControllerRef.current === newController) {
                    abortControllerRef.current = null;
                }
            },
        });

        setLogStream(transformedStream);
    };

    /**
     * Handles closing the dialog. This function will:
     * 1. Abort the active network request for the log stream.
     * 2. Clear the log stream state.
     * 3. Call the parent's `hide` function to update visibility state.
     */
    const handleClose = () => {
        abortControllerRef.current?.abort("Dialog closed by user");
        setLogStream(null);
        hide();
    };

    return (
        <Dialog
            open={show}
            onClose={handleClose}
            fullWidth
            maxWidth="xl"
            scroll="paper"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '12px',
                        backgroundColor: '#2e2e2e',
                        color: '#ffffff'
                    }
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#2e2e2e',
                color: '#ffffff',
                borderBottom: '1px solid #333'
            }}>
                {panelTitle}
                <IconButton
                    onClick={handleClose}
                    sx={{
                        color: '#ffffff',
                        '&:hover': {
                            backgroundColor: '#333'
                        }
                    }}
                >
                    <CloseIcon/>
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{
                p: 0,
                backgroundColor: '#000',
                // borderColor: '#858484',
            }}>
                <LogsTerminal logStream={logStream} ref={terminalRef}/>
            </DialogContent>
            <DialogActions sx={{
                backgroundColor: '#2e2e2e',
                borderTop: '1px solid #333'
            }}>
                <Box sx={{height: '25px'}}/>
            </DialogActions>
        </Dialog>
    )
}

export default LogsDialog;