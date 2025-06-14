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
import {useCallback, useEffect, useState} from "react";
import {callRPC, downloadFile, uploadFile, useClient} from "../lib/api.ts";
import {Editor} from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";
import {GitService} from "../gen/git/v1/git_pb.ts";

interface EditorProps {
    selectedPage: string;
}

// EditorPage Component
export function EditorPage({selectedPage}: EditorProps) {
    const [loading, setLoading] = useState(false)
    const [fileContent, setFileContent] = useState("")
    let saveContent = ""

    const fetchData = useCallback(async () => {
        if (selectedPage !== "") {
            const {file, err} = await downloadFile(selectedPage)
            if (err) {
                console.error(err)
            } else {
                setFileContent(file)
            }
        }
    }, [selectedPage]);

    useEffect(() => {
        fetchData().then(() => {
        })
    }, [fetchData]);


    const saveFile = () => {
        setLoading(true)
        uploadFile(selectedPage, saveContent).then(value => {
            if (value) {
                console.error(value)
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    const gitClient = useClient(GitService);

    function handleEditorChange(
        value: string | undefined
    ): void {
        saveContent = value ?? ""
    }

    function handleEditorDidMount(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _editor: monacoEditor.editor.IStandaloneCodeEditor
    ): void {
    }

    const [openCommitDialog, setOpenCommitDialog] = useState(false)

    const handleAddCancel = () => {
        setCommitMessage('');
        setOpenCommitDialog(false);
    };

    const handleCommitConfirm = () => {
        if (commitMessage.trim()) {
            uploadFile(selectedPage, saveContent).then((err) => {
                if (err) {
                    console.error(err)
                    return;
                }

                callRPC(() => gitClient
                    .commit({file: {name: selectedPage}, message: commitMessage.trim()}))
                    .then(() => {
                        // setSnackbarOpen(true);
                        //
                        // if (err) {
                        //     setSnackbarSeverity('error');
                        //     setSnackbarMessage(`Error: ${err}`)
                        // } else {
                        //     setSnackbarSeverity('success');
                        //     setSnackbarMessage("File Added")
                        // }
                    })
            }).finally(() => {
                setCommitMessage('');
                setOpenCommitDialog(false);
                fetchData().then(() => {
                })
            })
        }
    };

    const [commitMessage, setCommitMessage] = useState("")

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
                    <Editor
                        key={selectedPage}
                        // height="100vw"
                        // width="100vw"
                        // No height/width props needed if parent is sized, it will default to 100%
                        defaultLanguage="yaml"
                        value={fileContent}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        theme="vs-dark"
                        options={{
                            selectOnLineNumbers: true,
                            minimap: {enabled: false}
                        }}
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
