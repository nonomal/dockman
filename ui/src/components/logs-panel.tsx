import {useEffect, useRef} from 'react';
import {Box, IconButton, Paper, Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LogsTerminal, {type TerminalHandle} from './logs-terminal';

export interface LogsPanelProps {
    title?: string;
    logStream: AsyncIterable<string> | null;
    isMinimized: boolean;
    onError?: (mes: string) => void;
    onSuccess?: () => void;
    onToggle: () => void;
}

const PANEL_CONTENT_HEIGHT = '40vh'; // The height of the terminal area itself
const TRANSITION_DURATION = '0.15s';

export function LogsPanel({title, logStream, isMinimized, onToggle}: LogsPanelProps) {
    const terminalRef = useRef<TerminalHandle>(null);

    useEffect(() => {
        if (!isMinimized) {
            // A delay allows the height transition to complete before fitting the terminal.
            const timer = setTimeout(() => terminalRef.current?.fit(), 250);
            return () => clearTimeout(timer);
        }
    }, [isMinimized]);

    return (
        <Paper
            elevation={8}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#1E1E1E',
                color: '#CCCCCC',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                // This ensures the component doesn't shrink in a flex container
                flexShrink: 0,
            }}
        >
            {/* The header is always visible and acts as the toggle button */}
            <Box
                onClick={onToggle}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: '4px',
                    backgroundColor: '#333333',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        backgroundColor: '#4a4a4a',
                    },
                }}
            >
                <IconButton size="small" sx={{color: 'white'}} title={isMinimized ? "Expand" : "Collapse"}>
                    {isMinimized ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                </IconButton>
                <Typography variant="body2" sx={{textTransform: 'uppercase', fontWeight: 'bold', ml: 1}}>
                    {title || 'LOGS'}
                </Typography>
            </Box>

            {/* This container's height is animated to show/hide the terminal */}
            <Box
                sx={{
                    height: isMinimized ? 0 : PANEL_CONTENT_HEIGHT,
                    overflow: 'hidden',
                    transition: `height ${TRANSITION_DURATION} ease-in-out`,
                    // The terminal needs a relative parent to fill its space
                    position: 'relative',
                    flexGrow: 1,
                    // Add a top border to separate it from the header when open
                    borderTop: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                }}
            >
                <LogsTerminal ref={terminalRef} logStream={logStream}/>
            </Box>
        </Paper>
    );
}