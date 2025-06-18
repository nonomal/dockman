import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography
} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import {Commit, Schedule,} from '@mui/icons-material';
import {useCallback, useEffect, useRef, useState} from "react";
import {callRPC, downloadFile, uploadFile, useClient} from "../lib/api.ts";
import * as monacoEditor from "monaco-editor";
import {GitService} from "../gen/git/v1/git_pb.ts";
import {useSnackbar} from "../components/snackbar.tsx";
import {MonacoEditor} from "../components/editor.tsx";
import {CommitList} from "../components/commit-list.tsx";
import {DiffViewer} from "../components/diff.tsx";

interface EditorProps {
    selectedPage: string;
}

type SaveState = 'idle' | 'typing' | 'saving' | 'success' | 'error'

export function EditorPage({selectedPage}: EditorProps) {
    const gitClient = useClient(GitService);
    const {showSuccess, showError} = useSnackbar();

    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>(null);
    const [fileContent, setFileContent] = useState("")

    const [loading, setLoading] = useState(false)
    const [commitMessage, setCommitMessage] = useState("")
    const [openCommitDialog, setOpenCommitDialog] = useState(false)
    const [commitListKey, setCommitListKey] = useState(0);

    const [diffCommitId, setDiffCommitId] = useState("")

    const [status, setStatus] = useState<SaveState>('idle');
    const debounceTimeout = useRef<null | number>(null);

    const fetchDataCallback = useCallback(async () => {
        if (selectedPage !== "") {
            const {file, err} = await downloadFile(selectedPage)
            if (err) {
                showError(`Error downloading file ${err}`)
            } else {
                setFileContent(file)
            }
        }
    }, [selectedPage, showError]);

    useEffect(() => {
        fetchDataCallback().then()
    }, [fetchDataCallback]);


    const commitAndSave = async () => {
        const {err} = await callRPC(
            () => gitClient.commit(
                {
                    file: {name: selectedPage},
                    message: commitMessage.trim()
                })
        )
        if (err) {
            showError(`error saving file ${err}`)
            return;
        }

        setCommitListKey(prevState => prevState + 1) // rerender commit list
        showSuccess("saved and commited");
    }

    const saveFile = (val: string) => {
        setLoading(true);
        uploadFile(selectedPage, val).then(err => {
            if (err) {
                showError(`Autosave failed: ${err}`);
                return;
            }

            setStatus("success")
        }).finally(() => {
            setLoading(false);
        });
    }

    function handleEditorChange(value: string | undefined): void {
        // When typing starts, clear any existing debounce timer
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        // Set the status to 'typing' immediately
        setStatus('typing');
        setFileContent(value!);

        // Set a new timer. If the user keeps typing, this timer will be cleared and reset.
        // If they stop, the timer will fire, triggering the save.
        debounceTimeout.current = setTimeout(() => {
            saveFile(value!);
        }, 800); // 1-second delay
    }

    // When the status becomes 'success' or 'error', revert to 'idle' after a delay
    useEffect(() => {
        if (status === 'success' || status === 'error') {
            const timer = setTimeout(() => {
                setStatus('idle');
            }, 2000); // Show the checkmark or error for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [status]);

    const StatusIndicator = () => {
        switch (status) {
            case 'typing':
                return <><CircularProgress size={20} sx={{mr: 1.5}}/> Typing...</>;
            case 'saving':
                return <><CircularProgress size={20} sx={{mr: 1.5}}/> Saving...</>;
            case 'success':
                return <><CheckIcon color="success" sx={{mr: 1.5}}/> Saved</>;
            case 'error':
                return <><ErrorIcon color="error" sx={{mr: 1.5}}/> Save Failed</>;
            case 'idle':
            default:
                return <><Schedule color="primary" sx={{mr: 1.5}}/> Idle</>;
        }
    };

    function handleEditorDidMount(
        editor: monacoEditor.editor.IStandaloneCodeEditor
    ): void {
        editorRef.current = editor
        // editor.onDidChangeModelContent(() => {
        //     const currentValue = editor.getValue();
        //     setFileContent(currentValue);
        // });
    }

    const handleCommitConfirm = () => {
        if (commitMessage.trim()) {
            commitAndSave().finally(() => {
                setCommitMessage('');
                setOpenCommitDialog(false);
                fetchDataCallback().then()
            })
        }
    };

    const handleCommitCancel = () => {
        setCommitMessage('');
        setOpenCommitDialog(false);
    };

    return (
        <>
            <Box sx={{p: 3, height: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                <Box sx={{mb: 2, display: 'flex', alignItems: 'center', gap: 3}}>
                    <Button
                        variant="contained"
                        disabled={loading}
                        onClick={() => {
                            setOpenCommitDialog(true)
                        }}
                        startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <Commit/>}
                    >
                        Commit
                    </Button>
                    <Typography variant="body1" noWrap component="div">
                        {selectedPage}
                    </Typography>
                    <Box sx={{height: '32px', display: 'flex', alignItems: 'center'}}>
                        <Typography variant="body2" color="text.secondary" sx={{display: 'flex', alignItems: 'center'}}>
                            <StatusIndicator/>
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{display: 'flex', flexDirection: 'row', gap: 2, height: '85vh'}}>
                    <Box
                        sx={{
                            flexGrow: 1,
                            border: '1px dashed',
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                            borderRadius: 1,
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.1)'
                        }}
                    >
                        {diffCommitId ? (
                            <DiffViewer
                                selectedFile={selectedPage}
                                commitId={diffCommitId}
                                currentContent={fileContent}
                            />
                        ) : (
                            <MonacoEditor
                                selectedPage={selectedPage}
                                fileContent={fileContent}
                                handleEditorChange={handleEditorChange}
                                handleEditorDidMount={handleEditorDidMount}
                            />
                        )}
                    </Box>
                    <Box sx={{
                        width: 270,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <CommitList
                            key={commitListKey}
                            chooseCommit={commit => {
                                setDiffCommitId(commit)
                            }}
                            selectedCommit={diffCommitId}
                            selectedFile={selectedPage}
                        />
                    </Box>
                </Box>
            </Box>

            <Dialog open={openCommitDialog} onClose={handleCommitCancel}>
                <DialogTitle>Commit {selectedPage}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Commit"
                        variant="outlined"
                        multiline
                        rows={4}
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleCommitConfirm();
                            }
                        }}
                        sx={{
                            width: '400px',
                            height: '120px',
                            '& .MuiInputBase-root': {
                                height: '100%',
                            },
                            '& .MuiInputBase-input': {
                                height: '100% !important',
                                overflow: 'auto !important',
                            }
                        }}
                    /> </DialogContent>
                <DialogActions>
                    <Button onClick={handleCommitCancel}>Cancel</Button>
                    <Button onClick={handleCommitConfirm} variant="contained">
                        Commit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
