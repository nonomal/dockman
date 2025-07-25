import React from 'react';
import {Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Link, Typography} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChangelogPopupProps {
    isVisible: boolean;
    changelog: string;
    onDismiss: () => void;
    githubUrl: string;
    isLoading: boolean;
}

const GithubMarkdownPopup: React.FC<ChangelogPopupProps> = (
    {
        isVisible,
        changelog,
        onDismiss,
        isLoading,
        githubUrl,
    }) => {
    return (
        <Dialog
            open={isVisible}
            onClose={onDismiss}
            maxWidth="md"
            fullWidth
            scroll="paper"
            aria-labelledby="changelog-dialog-title"
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: '#1e293b', // Dark slate background for main dialog
                        border: '1px solid #334155',
                        borderRadius: 2,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                        color: '#f1f5f9',
                    }
                }
            }}
        >
            <DialogTitle
                id="changelog-dialog-title"
                sx={{
                    backgroundColor: '#232a40', // Darker slate background for header
                    color: '#f1f5f9',
                    position: 'relative',
                    borderRadius: '8px 8px 0 0',
                    borderBottom: '1px solid #334155',
                }}
            >
                <Typography variant="h5" component="span">
                    New version detected
                </Typography>
                {onDismiss ? (
                    <IconButton
                        aria-label="close"
                        onClick={onDismiss}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'rgba(241, 245, 249, 0.7)',
                            '&:hover': {
                                color: '#f1f5f9',
                                backgroundColor: 'rgba(241, 245, 249, 0.1)',
                            }
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                ) : null}
            </DialogTitle>
            <DialogContent
                dividers
                sx={{
                    backgroundColor: '#1e293b', // Match main dialog background
                    borderColor: '#334155',
                    color: '#f1f5f9',
                }}
            >
                {/* New note section */}
                <Typography
                    variant="body2"
                    gutterBottom
                    sx={{
                        backgroundColor: '#1e40af', // Dark blue background for notice
                        padding: 2,
                        borderRadius: 1,
                        border: '1px solid #3b82f6',
                        marginBottom: 2,
                        color: '#dbeafe',
                    }}
                >
                    Make sure to check for any breaking changes (If any), or don't I am a sign not a cop,
                    {githubUrl && (
                        <>
                            {' '}
                            <Link
                                href={githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Read more on GitHub (opens in a new tab)"
                                sx={{
                                    color: '#60a5fa',
                                    fontWeight: 'medium',
                                    '&:hover': {
                                        color: '#93c5fd',
                                    }
                                }}
                            >
                                Release link
                            </Link>
                        </>
                    )}
                    .
                </Typography>

                {isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '200px',
                        }}
                    >
                        <CircularProgress/>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            backgroundColor: '#0f172a', // Darker background for changelog content
                            padding: 2,
                            borderRadius: 1,
                            border: '1px solid #475569',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                            color: '#e2e8f0',
                            '& h1, & h2, & h3, & h4, & h5, & h6': {
                                color: '#f1f5f9',
                                borderBottom: '1px solid #475569',
                                paddingBottom: '0.5rem',
                            },
                            '& code': {
                                backgroundColor: '#334155',
                                color: '#e2e8f0',
                                padding: '0.125rem 0.25rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.875em',
                            },
                            '& pre': {
                                backgroundColor: '#334155',
                                border: '1px solid #475569',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                overflow: 'auto',
                                color: '#e2e8f0',
                            },
                            '& ul, & ol': {
                                paddingLeft: '1.5rem',
                            },
                            '& blockquote': {
                                borderLeft: '4px solid #475569',
                                paddingLeft: '1rem',
                                margin: '1rem 0',
                                fontStyle: 'italic',
                                color: '#94a3b8',
                            },
                            '& a': {
                                color: '#60a5fa',
                                '&:hover': {
                                    color: '#93c5fd',
                                }
                            }
                        }}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {changelog}
                        </ReactMarkdown>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default GithubMarkdownPopup;
