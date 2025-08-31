import {Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton} from '@mui/material'; // Or your preferred UI library
import CloseIcon from "@mui/icons-material/Close";
import {useSnackbar} from "../../../hooks/snackbar.ts";
import {callRPC, transformAsyncIterable, useClient} from "../../../lib/api.ts";
import LogsTerminal, {type TerminalHandle} from "../../compose/components/logs-terminal.tsx";
import {useEffect, useRef, useState} from "react";
import {DockerService, type LogsMessage} from "../../../gen/docker/v1/docker_pb.ts";


interface ExecDialogProps {
    show: boolean;
    hide: () => void;
    name: string;
    containerID: string;
}

export const ExecDialog = ({show, hide, name, containerID}: ExecDialogProps) => {
    const {showError} = useSnackbar()
    const dockerService = useClient(DockerService);

    const [panelTitle, setPanelTitle] = useState('');
    const [logStream, setLogStream] = useState<AsyncIterable<string> | null>(null);

    const terminalRef = useRef<TerminalHandle>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (containerID) {
            setPanelTitle(`Logs - ${name}`);
            manageStream<LogsMessage>({
                getStream: signal => dockerService.containerExecOutput({containerID: containerID, execCmd: "/bin/sh"}, {signal}),
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
            onError: error => {
                console.log(`Stream error: ${error}`);
            },
            onFinally: () => {
                if (abortControllerRef.current === newController) {
                    abortControllerRef.current = null;
                }
            },
        });

        setLogStream(transformedStream);
    };

    function handleInput(cmd: string) {
        callRPC(() => dockerService.containerExecInput(
            {containerID: containerID, userCmd: cmd}
        )).catch((err) => {
            showError(`unable to send cmd: ${err}`)
        })
    }

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
            onClose={hide}
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
                {name}
                <IconButton
                    onClick={hide}
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
                <LogsTerminal
                    ref={terminalRef}
                    logStream={logStream}
                    inputFunc={handleInput}
                />
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

export default ExecDialog;
