import {
    Box,
    Button,
    CircularProgress,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
    Tooltip,
    Typography
} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {callRPC, downloadFile, transformAsyncIterable, uploadFile, useClient} from "../../lib/api";
import {MonacoEditor} from "./components/editor.tsx";
import {useSnackbar} from "../../hooks/snackbar.ts";
import {type SaveState} from "./status-hook.ts";
import {CloudUploadOutlined, ErrorOutlineOutlined} from "@mui/icons-material";
import {DockerService} from "../../gen/docker/v1/docker_pb.ts";
import {isComposeFile} from "../../lib/editor.ts";
import {
    activeActionAtom,
    activeTerminalAtom,
    deployActionsConfig,
    isTerminalPanelOpenAtom,
    type LogTab,
    openTerminalsAtom
} from "./state.tsx";
import {useAtom} from "jotai";
import {useDockerCompose} from "../../hooks/docker-compose.ts";

interface EditorProps {
    selectedPage: string;
    setStatus: (status: SaveState) => void;
    handleContentChange: (value: string, onSave: (value: string) => void) => void;
}

export function TabEditor({selectedPage, setStatus, handleContentChange}: EditorProps) {
    const {showError, showWarning} = useSnackbar();
    const dockerClient = useClient(DockerService)

    const [errors, setErrors] = useState<string[]>([])

    const [fileContent, setFileContent] = useState("")
    const fetchDataCallback = useCallback(async () => {
        if (selectedPage !== "") {
            const {file, err} = await downloadFile(selectedPage)
            if (err) {
                showError(`Error downloading file ${err}`)
            } else {
                setFileContent(file)
            }
        }
        // eslint-disable-next-line
    }, [selectedPage]);

    useEffect(() => {
        fetchDataCallback().then()
    }, [fetchDataCallback]);

    const actions = {
        errors: {
            element: <EditorErrorWidget errors={errors}/>,
            icon: <ErrorOutlineOutlined/>,
            label: 'Show validation errors',
        },
        deploy: {
            element: <EditorDeployWidget selectedPage={selectedPage}/>,
            icon: <CloudUploadOutlined/>,
            label: 'Deploy project',
        },
    } as const;
    const [activeAction, setActiveAction] = useState<keyof typeof actions | null>(null);


    const saveFile = useCallback(async (val: string) => {
        const err = await uploadFile(selectedPage, val);
        if (err) {
            setStatus('error');
            showError(`Autosave failed: ${err}`);
        } else {
            setStatus('success');
        }

        if (isComposeFile(selectedPage)) {
            const {val: errs, err: err2} = await callRPC(
                () => dockerClient.composeValidate({
                    filename: selectedPage
                }))
            if (err2) {
                showWarning(`Error validating file ${err2}`);
            }
            const ssd = errs?.errs.map((err) => err.toString())

            if (ssd && ssd.length !== 0) {
                setErrors(ssd)
                setActiveAction('errors')
            } else {
                setErrors([])
                setActiveAction(null)
            }
        }
        // eslint-disable-next-line
    }, [selectedPage, setStatus]);

    function handleEditorChange(value: string | undefined): void {
        const newValue = value!
        handleContentChange(newValue, saveFile)
    }

    return (
        <>
            <Box sx={{
                p: 0.7,
                height: '100%',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                    borderRadius: 1,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    {/* Editor Container */}
                    <Box sx={{
                        flexGrow: 1,
                        position: 'relative',
                        display: 'flex',
                    }}>
                        <Fade in={true} key={'diff'} timeout={280}>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    p: 0.1,
                                    display: 'flex'
                                }}
                            >
                                <MonacoEditor
                                    selectedFile={selectedPage}
                                    fileContent={fileContent}
                                    handleEditorChange={handleEditorChange}
                                />
                            </Box>
                        </Fade>
                    </Box>

                    <Box sx={{
                        width: activeAction !== null ? '250px' : '0px',
                        transition: 'width 0.2s ease-in-out',
                        overflow: 'hidden',
                        backgroundColor: '#1E1E1E',
                    }}>
                        {/* Inner wrapper to prevent content from wrapping during animation */}
                        <Box sx={{p: 2, width: '250px'}}>
                            {(activeAction) && actions[activeAction].element}
                        </Box>
                    </Box>

                    {/*  Side Widget Panel */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#252727',
                            borderLeft: '1px solid',
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                        }}
                    >
                        {Object.entries(actions).map(([key, {icon, label}]) => {
                            const isActive = activeAction === key;

                            return (
                                <Tooltip key={key} title={label} placement="left">
                                    <Box
                                        sx={{
                                            backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            },
                                        }}
                                        onClick={() => setActiveAction(isActive ? null : (key as keyof typeof actions))}
                                    >
                                        <IconButton size="small" aria-label={label}>
                                            <IconButton
                                                size="small"
                                                aria-label={label}
                                                sx={{
                                                    color: isActive ? 'primary.main' : 'white', // change colors here
                                                }}
                                            >
                                                {icon}
                                            </IconButton>
                                        </IconButton>
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        </>
    );
}

const EditorErrorWidget = ({errors}: { errors: string[] }) => {
    return (
        errors.length === 0 ? (
            <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'bold', whiteSpace: 'nowrap'}}>
                No errors detected
            </Typography>
        ) : <>
            <Typography
                variant="subtitle1"
                sx={{mb: 1, fontWeight: 'bold', whiteSpace: 'nowrap'}}
            >
                Errors
            </Typography>

            {errors.map((value, index) => (
                <Box
                    key={index}
                    sx={{
                        p: 1.5,
                        mb: 3,
                        backgroundColor: 'rgba(211, 47, 47, 0.1)', // Faint red background
                        border: '1px solid rgba(211, 47, 47, 0.4)',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: '#ffcdd2', // Light red text for dark mode
                        whiteSpace: 'pre-wrap', // Allows the text to wrap
                        wordBreak: 'break-all', // Breaks long unbreakable strings (like paths)
                    }}
                >
                    {value}
                </Box>
            ))}
        </>
    );
};

function EditorDeployWidget({selectedPage}: { selectedPage: string }) {
    const dockerService = useClient(DockerService);
    const {fetchContainers} = useDockerCompose(selectedPage);

    const [composeErrorDialog, setComposeErrorDialog] = useState<{ dialog: boolean; message: string }>({
        dialog: false,
        message: ''
    });
    const closeErrorDialog = () => setComposeErrorDialog(p => ({...p, dialog: false}));
    const showErrorDialog = (message: string) => setComposeErrorDialog({dialog: true, message});
    const {showSuccess} = useSnackbar();
    const [activeAction, setActiveAction] = useAtom(activeActionAtom);

    const [, setLogTabs] = useAtom(openTerminalsAtom);
    const [, setActiveTabId] = useAtom(activeTerminalAtom);

    const [, setIsLogPanelMinimized] = useAtom(isTerminalPanelOpenAtom);
    const createStream = <T, >(
        {
            id, getStream, transform, title, onSuccess, onFinalize, inputFn
        }:
        {
            id: string;
            getStream: (signal: AbortSignal) => AsyncIterable<T>;
            transform: (item: T) => string;
            title: string;
            inputFn?: (cmd: string) => void,
            onSuccess?: () => void;
            onFinalize?: () => void;
        }) => {
        const newController = new AbortController();
        const sourceStream = getStream(newController.signal);

        const transformedStream = transformAsyncIterable(sourceStream, {
            transform,
            onComplete: () => onSuccess?.(),
            onError: (err) => {
                // Don't show an error dialog if the stream was intentionally aborted
                if (!newController.signal.aborted) {
                    showErrorDialog(`Error streaming container logs: ${err}`);
                }
            },
            onFinally: () => onFinalize?.(),
        });

        const newTab: LogTab = {
            id,
            title,
            stream: transformedStream,
            controller: newController,
            inputFn: inputFn
        };

        setLogTabs(prev => [...prev, newTab]);
        setActiveTabId(id);
        setIsLogPanelMinimized(false); // Always expand panel for a new tab
    };

    const handleComposeAction = (
        name: typeof deployActionsConfig[number]['name'],
        message: string,
        rpcName: typeof deployActionsConfig[number]['rpcName'],
    ) => {
        setActiveAction(name);
        // unique ID and title for the new tab
        const tabId = `${name}-${Date.now()}`;
        const tabTitle = `${name} - ${selectedPage.split('/').pop() || selectedPage}`;

        createStream({
            id: tabId,
            title: tabTitle,
            getStream: signal => dockerService[rpcName]({
                filename: selectedPage,
                selectedServices: [], // services by default
            }, {signal}),
            transform: item => item.message,
            onSuccess: () => {
                showSuccess(`Deployment ${message} successfully`)
                setIsLogPanelMinimized(true);
            },
            onFinalize: () => {
                setActiveAction('');
                fetchContainers().then();
            }
        });
    };

    return (
        <>
            <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, flexShrink: 0}}>
                {deployActionsConfig.map((action) => (
                    <Button
                        key={action.name}
                        variant="outlined"
                        disabled={!!activeAction}
                        onClick={() => handleComposeAction(action.name, action.message, action.rpcName)}
                        startIcon={activeAction === action.name ?
                            <CircularProgress size={20} color="inherit"/> : action.icon}
                    >
                        {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                    </Button>
                ))}
            </Box>

            <Dialog open={composeErrorDialog.dialog} onClose={closeErrorDialog}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    <Typography sx={{whiteSpace: 'pre-wrap'}}>{composeErrorDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeErrorDialog} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}


