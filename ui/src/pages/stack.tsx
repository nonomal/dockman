import React, {type SyntheticEvent, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {StackEditor} from "./stack-editor.tsx";
import {StackDeploy} from "./stack-deploy.tsx";
import {Box, CircularProgress, Fade, Tab, Tabs, Typography} from '@mui/material';
import {StatStacksPage} from "./stack-stats.tsx";
import {callRPC, useClient} from "../lib/api.ts";
import {FileService} from "../gen/files/v1/files_pb.ts";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface TabDetails {
    label: string;
    component: React.ReactElement;
}

export function Stack() {
    const {filename, selectedTab} = useParams<{ filename: string; selectedTab: string }>();
    const navigate = useNavigate();
    const fileService = useClient(FileService);

    const [isLoading, setIsLoading] = useState(true);
    const [fileError, setFileError] = useState("");

    useEffect(() => {
        setIsLoading(true);
        setFileError("");

        if (!filename) {
            setFileError("No filename provided in the URL.");
            setIsLoading(false);
            return;
        }

        callRPC(() => fileService.exists({filename: filename}))
            .then(value => {
                if (value.err) {
                    console.error("API error checking file existence:", value.err);
                    setFileError(`An API error occurred: ${value.err}`);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, [filename, fileService]);

    const tabsMap: Map<string, TabDetails> = useMemo(() => {
        // Return an empty map if there's no filename to avoid errors
        if (!filename) return new Map();

        const isComposeFile = filename.endsWith(".yml") || filename.endsWith(".yaml");
        const map = new Map<string, TabDetails>();

        map.set('editor', {
            label: 'Editor',
            component: <StackEditor key={filename} selectedPage={filename}/>
        });

        if (isComposeFile) {
            map.set('deploy', {
                label: 'Deploy',
                component: <StackDeploy selectedPage={filename}/>
            });
            map.set('stats', {
                label: 'Stats',
                component: <StatStacksPage selectedPage={filename}/>
            });
        }

        return map;
    }, [filename]);

    const currentTab = selectedTab ?? 'editor';

    const handleTabChange = (_event: SyntheticEvent, newKey: string) => {
        navigate(`/files/${filename}/${newKey}`);
    };

    useEffect(() => {
        if (selectedTab && tabsMap.size > 0 && !tabsMap.has(selectedTab)) {
            navigate(`/files/${filename}/editor`, {replace: true});
        }
    }, [filename, selectedTab, tabsMap, navigate]);

    if (isLoading) {
        return <CenteredMessage icon={<CircularProgress/>} title=""/>;
    }

    if (fileError) {
        return (
            <CenteredMessage
                icon={<ErrorOutlineIcon color="error" sx={{fontSize: 60}}/>}
                title={`Unable to load file: ${filename}`}
                message={fileError}
            />
        );
    }

    const activePanel = tabsMap.get(currentTab)?.component;
    return (
        <>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={currentTab} onChange={handleTabChange}>
                    {Array.from(tabsMap.entries()).map(([key, details]) => (
                        <Tab key={key} value={key} label={details.label}/>
                    ))}
                </Tabs>
            </Box>
            {activePanel && (
                <Fade in={true} timeout={200} key={currentTab}>
                    <Box sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                    }}>
                        {activePanel}
                    </Box>
                </Fade>
            )}
        </>
    );
}

interface CenteredMessageProps {
    icon?: React.ReactNode;
    title: string;
    message?: string;
}

export function CenteredMessage({icon, title, message}: CenteredMessageProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '80vh',
                textAlign: 'center',
                p: 3,
                color: 'text.secondary', // Use a softer color for the text
            }}
        >
            {icon && <Box sx={{mb: 2}}>{icon}</Box>}
            <Typography variant="h5" component="h2" gutterBottom sx={{color: 'text.primary'}}>
                {title}
            </Typography>
            {message && <Typography variant="body1">{message}</Typography>}
        </Box>
    );
}