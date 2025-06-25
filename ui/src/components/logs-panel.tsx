import {useEffect, useRef} from 'react';
import {Box, Button, IconButton, Paper, Typography} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import LogsTerminal, {type TerminalHandle} from './logs-terminal';

export interface LogsPanelProps {
    title?: string;
    logStream: AsyncIterable<{ message: Uint8Array | string }> | null;
    isMinimized: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function LogsPanel({title, logStream, isMinimized, onToggle, onClose}: LogsPanelProps) {
    const terminalRef = useRef<TerminalHandle>(null);

    useEffect(() => {
        if (!isMinimized) {
            // A small delay allows the CSS transition to start before fitting the terminal.
            const timer = setTimeout(() => terminalRef.current?.fit(), 150);
            return () => clearTimeout(timer);
        }
    }, [isMinimized]);

    return (
        <>
            <Paper
                elevation={8}
                square
                sx={{
                    height: !isMinimized ? '40vh' : '0',
                    transition: 'height 0.12s ease-in-out',
                    display: 'flex',
                    position: 'relative',
                    zIndex: 1202,
                    flexDirection: 'column',
                    backgroundColor: '#1E1E1E',
                    color: '#CCCCCC',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'relative',
                    alignItems: 'center',
                    p: '4px 12px',
                    backgroundColor: '#333333'
                }}>
                    <Typography variant="body2" sx={{textTransform: 'uppercase', fontWeight: 'bold'}}>
                        {title || 'LOGS'}
                    </Typography>
                    <IconButton size="large" onClick={onClose} title="Close Panel">
                        <CloseIcon fontSize="small" sx={{color: 'white'}}/>
                    </IconButton>
                </Box>
                <Box sx={{flexGrow: 1, fontFamily: 'monospace'}}>
                    <LogsTerminal ref={terminalRef} logStream={logStream}/>
                </Box>
            </Paper>
            <Box sx={{
                backgroundColor: '#007ACC',
                color: 'white',
                height: '5vh',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                zIndex: 1201
            }}>
                <Button color="inherit" size="large" startIcon={<TerminalIcon/>}
                        onClick={() => onToggle()}
                        sx={{textTransform: 'none', height: '100%', borderRadius: 0}}>
                    Logs
                </Button>
            </Box>
        </>
    );
}