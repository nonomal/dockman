import {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import "@xterm/xterm/css/xterm.css";

interface TerminalComponentProps {
    logStream: AsyncIterable<string> | null;
    inputFunc?: (cmd: string) => void,
}

export interface TerminalHandle {
    fit: () => void;
}

const hideCursorByte = '\x1b[?25l';
const LogsTerminal = forwardRef<TerminalHandle, TerminalComponentProps>((
        {logStream, inputFunc}, ref
    ) => {
        const terminalRef = useRef<HTMLDivElement>(null);
        const term = useRef<Terminal | null>(null);
        const fitAddon = useRef<FitAddon | null>(null);
    const inputBuffer = useRef<string>('');

        useImperativeHandle(ref, () => ({
            fit: () => fitAddon.current?.fit(),
        }));

        useEffect(() => {
            if (!terminalRef.current) return;

            terminalRef.current.focus()

            const xterm = new Terminal({
                cursorBlink: true,
                disableStdin: inputFunc == undefined,
                convertEol: true,
                scrollback: 2500,
                theme: {background: '#1E1E1E', foreground: '#CCCCCC'},
                fontFamily: 'monospace',
                lineHeight: 1.5,
            });
            xterm.onKey(({domEvent}) => {
                // Check for Ctrl+C or Cmd+C
                if ((domEvent.ctrlKey || domEvent.metaKey) && domEvent.key === 'c') {
                    const selection = xterm.getSelection();
                    if (selection) {
                        navigator.clipboard.writeText(selection).then();
                    } else {
                        // Since disableStdin is true, we don't need to do anything else.
                        // We have successfully intercepted the key press.
                        // Example of writing to a backend process
                        // pty.write(key);
                    }
                }
            })

            const addon = new FitAddon();
            fitAddon.current = addon;
            term.current = xterm;

            xterm.loadAddon(addon);
            xterm.open(terminalRef.current);
            addon.fit();
            if (!inputFunc) {
                // hide cursor
                xterm.write(hideCursorByte);
            }

            xterm.onData((data) => {
                if (data === "\r") {
                    // Send the full command and clear buffer
                    if (inputFunc) {
                        const lineLength = inputBuffer.current.length;

                        if (inputBuffer.current === "clear") {
                            xterm.clear()
                            xterm.write('\r' + ' '.repeat(lineLength) + '\r');
                        } else {
                            inputFunc(inputBuffer.current);
                            xterm.write('\r\n'); // Move to next line
                        }

                        inputBuffer.current = '';
                    }
                } else if (data === "\u007f") { // Backspace
                    if (inputBuffer.current.length > 0) {
                        inputBuffer.current = inputBuffer.current.slice(0, -1);
                        xterm.write('\b \b'); // Move back, write space, move back again
                    }
                } else if (data === "\u0015") { // Ctrl+U (clear line)
                    const lineLength = inputBuffer.current.length;
                    inputBuffer.current = '';
                    xterm.write('\r' + ' '.repeat(lineLength) + '\r'); // Clear current line
                } else {
                    // Add character to buffer and echo to terminal
                    inputBuffer.current += data;
                    xterm.write(data);
                }
            })

            // Use ResizeObserver for more robust fitting
            const resizeObserver = new ResizeObserver(() => {
                addon.fit();
            });
            resizeObserver.observe(terminalRef.current);

            return () => {
                resizeObserver.disconnect();
                xterm.dispose();
                term.current = null;
            };
        }, [inputFunc]);

        useEffect(() => {
            if (!logStream || !term.current) return;

            const currentTerm = term.current;
            currentTerm.clear();

            const processStream = async () => {
                for await (const item of logStream) {
                    currentTerm.write(item)
                }
            };

            processStream().then();
        }, [logStream]);

        return <div
            ref={terminalRef}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                // Firefox
                scrollbarWidth: 'thin',
                scrollbarColor: '#555 #2a2a2a',
            }}
        />;
    })
;

export default LogsTerminal;