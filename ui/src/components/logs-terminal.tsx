import {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface LogMessage {
    message: Uint8Array | string;
}

interface TerminalComponentProps {
    logStream: AsyncIterable<LogMessage> | null;
}

export interface TerminalHandle {
    fit: () => void;
}

const LogsTerminal = forwardRef<TerminalHandle, TerminalComponentProps>(({logStream}, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const term = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const decoder = useRef(new TextDecoder('utf-8'));

    useImperativeHandle(ref, () => ({
        fit: () => fitAddon.current?.fit(),
    }));

    useEffect(() => {
        if (!terminalRef.current) return;

        const xterm = new Terminal({
            cursorBlink: false,
            disableStdin: true,
            convertEol: true,
            scrollback: 2500,
            theme: {background: '#1E1E1E', foreground: '#CCCCCC'},
            fontFamily: 'monospace',
        });

        const addon = new FitAddon();
        fitAddon.current = addon;
        term.current = xterm;

        xterm.loadAddon(addon);
        xterm.open(terminalRef.current);
        addon.fit();

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
    }, []);

    useEffect(() => {
        if (!logStream || !term.current) return;

        const currentTerm = term.current;
        currentTerm.clear();

        const processStream = async () => {
            /*
              Docker logs needs a way to send both standard output (stdout) and standard error (stderr) over the same single data stream.
              it multiplexes the streams by prepending an 8-byte header to log data.
              The header is structured:
                Byte 0: Stream type.
                0x01 means the following payload is from stdout.
                0x02 means the following payload is from stderr.
                Bytes 1-3: Reserved for future use (currently all zeroes).
                Bytes 4-7: A 32-bit unsigned integer in big-endian format, representing the size (length) of the log message payload that follows.
            * */
            try {
                for await (const mes of logStream) {
                    // Ensure mes.message is a Uint8Array. If it's a string from compose actions,
                    // we can write it directly without parsing.
                    if (typeof mes.message === 'string') {
                        currentTerm.write(`${mes.message}\n`);
                        continue;
                    }

                    if (mes.message.length <= 8) {
                        continue;
                    }

                    // The actual log content is everything AFTER the 8-byte header.
                    const payload = mes.message.slice(8);
                    const text = decoder.current.decode(payload, {stream: true});
                    currentTerm.write(`${text}\n`);
                }
            } catch (e) {
                console.error("Log stream error:", e);
                currentTerm.write(`\n\n--- STREAM CLOSED DUE TO ERROR ---\n${(e as Error).message}`);
            }
        };

        processStream();
    }, [logStream]);

    return <div ref={terminalRef} style={{width: '100%', height: '100%'}}/>;
});

export default LogsTerminal;