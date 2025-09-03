import {Box, Fade} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {downloadFile, uploadFile} from "../../lib/api";
import {MonacoEditor} from "./components/editor.tsx";
import {useSnackbar} from "../../hooks/snackbar.ts";
import {type SaveState} from "./status-hook.ts";

interface EditorProps {
    selectedPage: string;
    setStatus: (status: SaveState) => void;
    handleContentChange: (value: string, onSave: (value: string) => void) => void;
}

export function TabEditor({selectedPage, setStatus, handleContentChange}: EditorProps) {
    const {showError} = useSnackbar();

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
    }, [selectedPage]);

    useEffect(() => {
        fetchDataCallback().then()
    }, [fetchDataCallback]);

    const saveFile = useCallback(async (val: string) => {
        const err = await uploadFile(selectedPage, val);
        if (err) {
            setStatus('error');
            showError(`Autosave failed: ${err}`);
        } else {
            setStatus('success');
        }
    }, [selectedPage, setStatus, showError]);

    function handleEditorChange(value: string | undefined): void {
        const newValue = value!;
        // setFileContent(newValue);
        handleContentChange(newValue, saveFile);
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
                    position: 'relative',
                    display: 'flex',
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                    borderRadius: 1,
                    backgroundColor: 'rgba(0,0,0,0.1)'
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
            </Box>
        </>
    );
}
