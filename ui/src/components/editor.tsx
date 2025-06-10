import {type JSX} from "react";
import * as monacoEditor from "monaco-editor";
import {Editor} from "@monaco-editor/react";

export function YamlEditor({content, contentChange}: { content: string, contentChange: (code :string) => void }): JSX.Element {
    function handleEditorChange(
        value: string | undefined
    ): void {
        contentChange(value || "");
    }

    function handleEditorDidMount(
        _editor: monacoEditor.editor.IStandaloneCodeEditor
    ): void {

    }

    return (
        <div className="app-container">
            {/* You could have a small header/toolbar here if needed */}
            {/* <header>My Awesome Editor</header> */}
            <div className="editor-wrapper">
                <Editor
                    height="100vw"
                    width="100vw"
                    // No height/width props needed if parent is sized, it will default to 100%
                    defaultLanguage="yaml"
                    value={content}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                        selectOnLineNumbers: true,
                        minimap: {enabled: false}
                    }}
                />
            </div>
        </div>
    )
}