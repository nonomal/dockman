import {Box, Button, CircularProgress, Typography} from "@mui/material";
import {Save as SaveIcon,} from '@mui/icons-material';
import {useCallback, useEffect, useState} from "react";
import {downloadFile, uploadFile} from "../lib/api.ts";
import {Editor} from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";

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
            console.error(value)
        }).finally(() => {
            setLoading(false)
        })
    }

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


    return (
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
                {
                    fileContent ?
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
                        /> :
                        <Typography variant="h5" color="text.secondary">
                            Select or create a file
                        </Typography>
                }
            </Box>
        </Box>
    );
}
