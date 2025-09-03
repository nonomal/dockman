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

        if (editorRef.current) {
            const tab = tabs[selectedFile]
            const {row, col} = tab;

            const padding = 5; // number of lines above and below
            editorRef.current!.revealRangeInCenter({
                startLineNumber: Math.max(1, row - padding),
                startColumn: 1,
                endLineNumber: row + padding,
                endColumn: 1,
            });

            editorRef.current!.setPosition({lineNumber: row, column: col});
        }

        // Listen to cursor position changes
        editor.onDidChangeCursorPosition((e) => {
            const {lineNumber, column} = e.position;

            saveLineNum({filename: selectedFile, col: column, row: lineNumber}, value => {
                setTabDetails(value.filename, {row: value.row, col: value.col});
            })
        });
    };

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

function useSaveLineNum(debounceMs: number = 500) {
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleContentChange = useCallback(
        (value: RowColUpdate, onSave: (value: RowColUpdate) => void) => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }

            debounceTimeout.current = setTimeout(() => {
                onSave(value);
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
