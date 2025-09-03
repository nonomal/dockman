import {Editor} from "@monaco-editor/react";
import {getLanguageFromExtension} from "../../../lib/editor";
import {useRef} from "react";
import * as monacoEditor from "monaco-editor";

// This MUST match the language ID your LSP server expects.
// const MY_CUSTOM_LANGUAGE_ID = 'compose.yaml';

interface MonacoEditorProps {
    selectedPage: string;
    fileContent: string;
    handleEditorChange: (value: string | undefined) => void;
}

export function MonacoEditor(
    {
        selectedPage,
        fileContent,
        handleEditorChange,
    }: MonacoEditorProps) {

    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount = (
        editor: monacoEditor.editor.IStandaloneCodeEditor,
    ) => {
        editorRef.current = editor;
        editor.focus();

        // Clear the undo stack for the initial load
        const model = editor.getModel();
        if (model) {
            console.log("clearing stack for initial load");
            model.pushStackElement();
        }

        const val = sessionStorage.getItem(selectedPage);
        if (editorRef.current && val) {
            const [row, col] = sessionStorage.getItem(selectedPage)?.split(',').map(Number) || [];
            // editorRef.current!.revealPositionInCenter({lineNumber: row, column: col});
            editorRef.current!.setPosition({lineNumber: row, column: col});
        }

        // Listen to cursor position changes
        editor.onDidChangeCursorPosition((e) => {
            const {lineNumber, column} = e.position;
            sessionStorage.setItem(selectedPage, `${lineNumber},${column}`);
        });
    };

    return (
        <Editor
            key={selectedPage} // This creates a fresh editor for each file
            language={getLanguageFromExtension(selectedPage)}
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
