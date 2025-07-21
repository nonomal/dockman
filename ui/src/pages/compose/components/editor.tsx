import {Editor} from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";
import {MonacoLanguageClient} from 'monaco-languageclient';
import {toSocket, WebSocketMessageReader, WebSocketMessageWriter} from 'vscode-ws-jsonrpc';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {initialize} from '@codingame/monaco-vscode-api';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import { API_URL } from "../../../lib/api";
import { getLanguageFromExtension } from "../../../lib/editor";

// This MUST match the language ID your LSP server expects.
const MY_CUSTOM_LANGUAGE_ID = 'compose.yaml';

interface MonacoEditorProps {
    selectedPage: string;
    fileContent: string;
    handleEditorChange: (value: string | undefined) => void;
    // handleEditorDidMount?: (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) => void;
}

export function MonacoEditor(
    {
        selectedPage,
        fileContent,
        handleEditorChange,
    }: MonacoEditorProps) {

    const handleEditorDidMount = async (
        editor: monacoEditor.editor.IStandaloneCodeEditor,
        monaco: typeof monacoEditor
    ) => {
        await initialize({
            ...getLanguagesServiceOverride()
        });

        monaco.languages.register({
            id: MY_CUSTOM_LANGUAGE_ID,
            extensions: ['compose.yaml'], // Associate with a file extension
            aliases: ['docker-compose'],
            mimetypes: ['application/docker-compose'],
        });

        const pa = new URL(API_URL)
        let wsProtocol = `ws://`
        if (pa.protocol == "https:") {
            wsProtocol = "wss://"
        }
        const url = `${wsProtocol}${pa.host}/api/lsp/`
        const webSocket = new ReconnectingWebSocket(url);
        const socket = toSocket(webSocket as WebSocket);

        const client = new MonacoLanguageClient({
            messageTransports: {
                reader: new WebSocketMessageReader(socket),
                writer: new WebSocketMessageWriter(socket),
            },
            name: 'docker-compose',
            clientOptions: {
                documentSelector: [MY_CUSTOM_LANGUAGE_ID],
                errorHandler: {
                    error: () => ({action: 1}),
                    closed: () => ({action: 1})
                }
            }
        });

        client.start().then();

        // Dispose of the client when the component unmounts
        editor.onDidDispose(() => {
            client.stop().then();
            webSocket.close();
        });
    };

    return (
        <Editor
            key={selectedPage}
            // Ensure the language prop is set to your custom language ID for the correct files
            language={getLanguageFromExtension(selectedPage) === 'mylang' ? MY_CUSTOM_LANGUAGE_ID : getLanguageFromExtension(selectedPage)}
            value={fileContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount} // This is the magic!
            theme="vs-dark"
            options={{
                selectOnLineNumbers: true,
                minimap: {enabled: false}
            }}
        />
    );
}

// You might need to update your getLanguageFromExtension helper
// to recognize your new extension.
// For example:
/*
export function getLanguageFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
            return 'javascript';
        case 'ts':
            return 'typescript';
        case 'json':
            return 'json';
        case 'mylang': // Add your custom language
            return 'mylang';
        default:
            return 'plaintext';
    }
}
*/