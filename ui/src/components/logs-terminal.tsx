import {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalComponentProps {
    logStream: AsyncIterable<string> | null;
}

export interface TerminalHandle {
    fit: () => void;
}

const LogsTerminal = forwardRef<TerminalHandle, TerminalComponentProps>(({logStream}, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const term = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);

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
        xterm.write('\x1b[?25l'); // hide cursor

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
            for await (const item of logStream) {
                currentTerm.write(`${item}\n`)
            }
        };

        processStream().then();
    }, [logStream]);

    return <div ref={terminalRef} style={{width: '100%', height: '100%'}}/>;
});

export default LogsTerminal;