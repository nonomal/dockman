import React, {type SyntheticEvent, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {TabEditor} from "./tab-editor.tsx";
import {TabDeploy} from "./tab-deploy.tsx";
import {Box, CircularProgress, Fade, Stack, Tab, Tabs, Typography} from '@mui/material';
import {TabStat} from "./tab-stats.tsx";
import {callRPC, useClient} from "../../lib/api.ts";
import {FileService} from "../../gen/files/v1/files_pb.ts";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {FileList} from "./components/file-bar.tsx";
import {DescriptionOutlined} from '@mui/icons-material';
import {TelescopeProvider} from './context/telescope-context.tsx';

export const ComposePage = () => {
    const {file, child} = useParams<{ file: string; child?: string }>();
    const filename = child ? `${file}/${child}` : file;

    return (
        <TelescopeProvider>
            <Box sx={{
                display: 'flex',
                height: '100vh',
                width: '100%',
                overflow: 'hidden',
            }}>
                <Box sx={{width: 280, flexShrink: 0, borderRight: 1, borderColor: 'divider', overflowY: 'auto'}}>
                    <FileList/>
                </Box>

                <Box sx={{flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column'}}>
                    {!filename ?
                        <CoreComposeEmpty/> :
                        <CoreCompose filename={filename}/>
                    }
                </Box>
            </Box>
        </TelescopeProvider>
    );
};

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

function CoreCompose({filename}: { filename: string }) {
    const navigate = useNavigate();
    const fileService = useClient(FileService);
    const [searchParams] = useSearchParams();
    const selectedTab = parseTabType(searchParams.get('tab') ?? "0")

    const [isLoading, setIsLoading] = useState(true);
    const [fileError, setFileError] = useState("");

    useEffect(() => {
        setIsLoading(true);
        setFileError("");

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

    const tabsList: TabDetails[] = useMemo(() => {
        if (!filename) return [];

        const isComposeFile = filename.endsWith(".yml") || filename.endsWith(".yaml");
        const map: TabDetails[] = []

        map.push({
            label: 'Editor',
            component: <TabEditor key={filename} selectedPage={filename}/>
        })
        if (isComposeFile) {
            map.push({
                label: 'Deploy',
                component: <TabDeploy selectedPage={filename}/>
            });
            map.push({
                label: 'Stats',
                component: <TabStat selectedPage={filename}/>
            });
        }

        return map;
    }, [filename]);

    const currentTab = selectedTab ?? 'editor';

    const handleTabChange = (_event: SyntheticEvent, newKey: string) => {
        navigate(`/stacks/${filename}?tab=${newKey}`);
    };

    useEffect(() => {
        if (selectedTab && tabsList.length > 0) {
            navigate(`/stacks/${filename}?tab=${selectedTab}`, {replace: true});
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

function CoreComposeEmpty() {
    const selected = useMemo(() => {
        const messages = [
            {
                title: "Finder? I barely know her.",
                subtitle: "Try the sidebar."
            },
            {
                title: "Nah, I don't know nothin' about no file.",
                subtitle: "Check the sidebar, maybe you'll find what you're lookin' for."
            },
            {
                title: "No file, no problem. Just kidding, we need one.",
                subtitle: "Pick one from the sidebar."
            },
            {
                title: "File not found? Maybe it's under the couch.",
                subtitle: "or the sidebar."
            },
        ];

        const index = Math.floor(Math.random() * messages.length);
        return messages[index];
    }, []);

    return (
        <Box
            component="main"
            sx={{
                display: 'flex',
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
            }}
        >
            <Stack spacing={2} alignItems="center" sx={{textAlign: 'center'}}>
                <DescriptionOutlined sx={{fontSize: '5rem', color: 'grey.400'}}/>
                <Typography variant="h5" component="h1" color="text.secondary">
                    {selected.title}
                </Typography>
                <Typography variant="body1" color="text.disabled">
                    {selected.subtitle}
                </Typography>
            </Stack>
        </Box>
    );
}

function CenteredMessage(
    {
        icon,
        title,
        message
    }:
    {
        icon?: React.ReactNode;
        title: string;
        message?: string;
    }
) {
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
