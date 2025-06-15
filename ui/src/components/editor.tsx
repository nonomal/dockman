import {Editor} from "@monaco-editor/react";
import {getLanguageFromExtension} from "../lib/utils.ts";
import * as monacoEditor from "monaco-editor";


interface MonacoEditorProps {
    selectedPage: string;
    fileContent: string;
    handleEditorChange: (page: string | undefined) => void;
    handleEditorDidMount?: (editor: monacoEditor.editor.IStandaloneCodeEditor) => void;
}

export const MonacoEditor = ({
                                 selectedPage,
                                 fileContent,
                                 handleEditorChange,
                                 handleEditorDidMount,
                             }: MonacoEditorProps
) => {
    return (
        <Editor
            key={selectedPage}
            // height="100vw"
            // width="100vw"
            // No height/width props needed if parent is sized, it will default to 100%
            defaultLanguage={getLanguageFromExtension(selectedPage)}
            value={fileContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
                selectOnLineNumbers: true,
                minimap: {enabled: false}
            }}
        />
    )
}