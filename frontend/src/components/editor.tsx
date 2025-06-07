import {type JSX, useState} from "react";
import * as monacoEditor from "monaco-editor";
import {Editor} from "@monaco-editor/react";

export function YamlEditor({content}: { content: string }): JSX.Element {
    const [code, setCode] = useState(content);

    function handleEditorChange(
        value: string | undefined
    ): void {
        setCode(value || "");
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
                    value={code}
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