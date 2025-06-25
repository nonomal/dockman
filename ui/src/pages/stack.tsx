import React, {type SyntheticEvent, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
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

enum TabType {
    EDITOR,
    DEPLOY,
    STATS,
}

function parseTabType(input: string | null): TabType {
    const tabValueInt = parseInt(input ?? '0', 10)
    const isValidTab = TabType[tabValueInt] !== undefined
    return isValidTab ? tabValueInt : TabType.EDITOR
}

export function Stack() {
    const {file, child} = useParams<{ file: string; child?: string }>();
    const navigate = useNavigate();
    const fileService = useClient(FileService);
    const [searchParams] = useSearchParams();
    const selectedTab = parseTabType(searchParams.get('tab') ?? "0")

    const filename = child ? `${file}/${child}` : file

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

    }, [filename, fileService, child]);

    const tabsList: TabDetails[] = useMemo(() => {
        if (!filename) return [];

        const isComposeFile = filename.endsWith(".yml") || filename.endsWith(".yaml");
        const map: TabDetails[] = []

        map.push({
            label: 'Editor',
            component: <StackEditor key={filename} selectedPage={filename}/>
        })
        if (isComposeFile) {
            map.push({
                label: 'Deploy',
                component: <StackDeploy selectedPage={filename}/>
            });
            map.push({
                label: 'Stats',
                component: <StatStacksPage selectedPage={filename}/>
            });
        }

        return map;
    }, [filename]);

    const currentTab = selectedTab ?? 'editor';

    const handleTabChange = (_event: SyntheticEvent, newKey: string) => {
        navigate(`/files/${filename}?tab=${newKey}`);
    };

    useEffect(() => {
        if (selectedTab && tabsList.length > 0) {
            navigate(`/files/${filename}?tab=${selectedTab}`, {replace: true});
        }
    }, [filename, selectedTab, tabsList, navigate]);

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

    const activePanel = tabsList[currentTab].component;
    return (
        <>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={currentTab} onChange={handleTabChange} slotProps={{
                    indicator: {
                        sx: {
                            transition: '0.09s',
                        }
                    }
                }}>
                    {tabsList.map((details, key) => (
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