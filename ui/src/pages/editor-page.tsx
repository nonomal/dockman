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
import {Save as SaveIcon,} from '@mui/icons-material';
import {useCallback, useEffect, useRef, useState} from "react";
import {callRPC, downloadFile, uploadFile, useClient} from "../lib/api.ts";
import * as monacoEditor from "monaco-editor";
import {GitService} from "../gen/git/v1/git_pb.ts";
import {useSnackbar} from "../components/snackbar.tsx";
import {MonacoEditor} from "../components/editor.tsx";

interface EditorProps {
    selectedPage: string;
}

export function EditorPage({selectedPage}: EditorProps) {
    const gitClient = useClient(GitService);
    const {showSuccess, showError, showWarning} = useSnackbar();

    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>(null);
    const [fileContent, setFileContent] = useState("")

    const [loading, setLoading] = useState(false)
    const [commitMessage, setCommitMessage] = useState("")
    const [openCommitDialog, setOpenCommitDialog] = useState(false)

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
    }, [fetchDataCallback, selectedPage, showWarning]);

    const saveFile = () => {
        setLoading(true)
        uploadFile(selectedPage, getContents()).then(value => {
            if (value) {
                showError(value)
                return;
            }
            showSuccess("Saved successfully");
        }).finally(() => {
            setLoading(false)
        })
    }

    const handleAddCancel = () => {
        setCommitMessage('');
        setOpenCommitDialog(false);
    };

    const handleCommitConfirm = () => {
        if (commitMessage.trim()) {
            uploadFile(selectedPage, getContents()).then((err) => {
                if (err) {
                    showError(`error saving file ${err}`)
                    return;
                }

                callRPC(() => gitClient
                    .commit({file: {name: selectedPage}, message: commitMessage.trim()}))
                    .then(() => {
                        if (err) {
                            showError(err, {duration: 5000})
                        } else {
                            showSuccess("saved and commited")
                        }
                    })
            }).finally(() => {
                setCommitMessage('');
                setOpenCommitDialog(false);
                fetchDataCallback().then()
            })
        }
    };

    const getContents = () => {
        if (!editorRef.current) {
            showWarning("Editor is uninitialized")
            throw Error("Editor is uninitialized")
        }
        return editorRef.current!.getValue();
    }

    function handleEditorChange(): void {}

    function handleEditorDidMount(
        editor: monacoEditor.editor.IStandaloneCodeEditor
    ): void {
        editorRef.current = editor
    }

    // const handleEditingComplete = useCallback((value: string) => {
    //     console.log('Editing complete:', value);
    //     // Your logic here - save to server, validate, etc.
    // }, []);

    // const debouncedEditingComplete = useCallback(
    //     debounce((value: string) => {
    //         handleEditingComplete(value);
    //     }, 500),
    //     [handleEditingComplete]
    // );
    //
    // const handleEditorChange = (value: string | undefined) => {
    //     if (value !== undefined) {
    //         setFileContent(value);
    //         debouncedEditingComplete(value);
    //     }
    // };

    return (
        <>
            <Box sx={{p: 3, height: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                <Box sx={{mb: 2, display: 'flex', alignItems: 'center', gap: 3}}>
                    <Button
                        variant="contained"
                        disabled={loading}
                        onClick={saveFile}
                        startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SaveIcon/>}
                    >
                        Save
                    </Button>

                    <Button
                        variant="contained"
                        disabled={loading}
                        onClick={() => {
                            setOpenCommitDialog(true)
                        }}
                        startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SaveIcon/>}
                    >
                        Commit
                    </Button>

                    <Typography variant="h6" noWrap component="div">
                        {selectedPage}
                    </Typography>
                </Box>
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
                    <MonacoEditor selectedPage={selectedPage}
                                  handleEditorChange={handleEditorChange}
                                  fileContent={fileContent}
                                  handleEditorDidMount={handleEditorDidMount}
                    />
                </Box>
            </Box>

            <Dialog open={openCommitDialog} onClose={handleAddCancel}>
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
                    <Button onClick={handleAddCancel}>Cancel</Button>
                    <Button onClick={handleCommitConfirm} variant="contained">
                        Commit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
