import {useEffect, useRef} from 'react';
import {Box, IconButton, Paper, Typography} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

interface TerminalPopupProps {
    title: string;
    messages: string[];
    isOpen: boolean;
    isMinimized: boolean;
    onClose: () => void;
    onMinimizeToggle: () => void;
}

const TerminalPopup = ({title, messages, isOpen, isMinimized, onClose, onMinimizeToggle}: TerminalPopupProps) => {
    const terminalBodyRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom when new messages are added
    useEffect(() => {
        if (terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) {
        return null;
    }

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'fixed',
                bottom: 0,
                right: 190,
                width: '60%',
                height: isMinimized ? '48px' : '350px',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                transition: 'height 0.3s ease-in-out',
                zIndex: 1300, // Ensure it's above other content
            }}
        >
            {/* Terminal Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    p: '4px 12px',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    cursor: 'pointer',
                }}
                onClick={onMinimizeToggle}
            >
                <Typography variant="body2" sx={{fontFamily: 'monospace', fontWeight: 'bold'}}>
                    {title}
                </Typography>
                <Box>
                    <IconButton size="small" onClick={onMinimizeToggle} sx={{color: 'primary.contrastText'}}>
                        {isMinimized ? <OpenInFullIcon fontSize="small"/> : <MinimizeIcon fontSize="small"/>}
                    </IconButton>
                    <IconButton size="small" onClick={onClose} sx={{color: 'primary.contrastText', ml: 1}}>
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                </Box>
            </Box>

            {/* Terminal Body */}
            <Box
                ref={terminalBodyRef}
                sx={{
                    flexGrow: 1,
                    backgroundColor: '#1e1e1e',
                    color: '#f1f1f1',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    p: 2,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap', // To wrap long lines
                    wordBreak: 'break-all',
                    display: isMinimized ? 'none' : 'block',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                    },
                }}
            >
                {messages.map((msg, index) => (
                    <div key={index}>{`> ${msg}`}</div>
                ))}
            </Box>
        </Paper>
    );
};

export default TerminalPopup;