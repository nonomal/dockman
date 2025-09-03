import {Editor} from "@monaco-editor/react";
import {getLanguageFromExtension} from "../../../lib/editor";
import {useCallback, useEffect, useRef} from "react";
import * as monacoEditor from "monaco-editor";
import {useTabs} from "../../../hooks/tabs.ts";

interface MonacoEditorProps {
    selectedFile: string;
    fileContent: string;
    handleEditorChange: (value: string | undefined) => void;
}

export function MonacoEditor(
    {
        selectedFile,
        fileContent,
        handleEditorChange,
    }: MonacoEditorProps) {

    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
    const saveLineNum = useSaveLineNum()

    const {tabs, setTabDetails} = useTabs()

    const handleEditorDidMount = (
        editor: monacoEditor.editor.IStandaloneCodeEditor,
    ) => {
        editorRef.current = editor;
        editor.focus();

        // Clear the undo stack for the initial load
        const model = editor.getModel();
        if (model) {
            // console.log("clearing stack for initial load");
            model.pushStackElement();
        }

        // if (editorRef.current) {
        //     const tab = tabs[selectedFile]
        //     const {row, col} = tab;
        //     console.log("Setting cursor pos", row, col);

        // requestAnimationFrame(() => {
        //     editorRef.current!.setPosition({lineNumber: row, column: col});
        //     const padding = 5;
        //     editorRef.current!.revealRangeInCenter({
        //         startLineNumber: Math.max(1, row - padding),
        //         startColumn: 1,
        //         endLineNumber: row + padding,
        //         endColumn: 1,
        //     });
        //     // focus after setting line pos
        // });
        // }

        // Listen to cursor position changes
        editor.onDidChangeCursorPosition((e) => {
            const {lineNumber, column} = e.position;

            saveLineNum({filename: selectedFile, col: column, row: lineNumber}, value => {
                setTabDetails(value.filename, {row: value.row, col: value.col});
            })
        });
    };

    useEffect(() => {
        if (!editorRef.current) return;

        const tab = tabs[selectedFile];
        if (!tab) return;

        const {row, col} = tab;

        const model = editorRef.current.getModel();
        if (!model) return;

        // Clamp row/column to model size
        const lineNumber = Math.min(row, model.getLineCount());
        const column = Math.min(col, model.getLineMaxColumn(lineNumber));

        editorRef.current.setPosition({lineNumber, column});
        const padding = 5;
        editorRef.current.revealRangeInCenter({
            startLineNumber: Math.max(1, lineNumber - padding),
            startColumn: 1,
            endLineNumber: lineNumber + padding,
            endColumn: 1,
        });
        // do not add tabs as dependencies
        // it will mess with the editor as the user types
    }, [fileContent, selectedFile]);

    return (
        <Editor
            key={selectedFile} // This creates a fresh editor for each file
            language={getLanguageFromExtension(selectedFile)}
            value={fileContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
                selectOnLineNumbers: true,
                minimap: {enabled: false},
                automaticLayout: true,
            }}
        />
    );
}

type RowColUpdate = { row: number; col: number; filename: string };

function useSaveLineNum(debounceMs: number = 200) {
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleContentChange = useCallback(
        (value: RowColUpdate, onSave: (value: RowColUpdate) => void) => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }

            debounceTimeout.current = setTimeout(() => {
                onSave(value);
                console.log("Saving cursor position: ", value)
            }, debounceMs);
        },
        [debounceMs]
    );

    useEffect(() => {
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);

    return handleContentChange;
}
