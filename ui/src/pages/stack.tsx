import React, {type SyntheticEvent, useEffect, useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom'; // 1. Import useNavigate
import {StackEditor} from "./stack-editor.tsx";
import {StackDeploy} from "./stack-deploy.tsx";
import {Box, Tab, Tabs, Typography} from '@mui/material';
import {StatStacksPage} from "./stack-stats.tsx";

interface TabDetails {
    label: string;
    component: React.ReactNode;
}

export function Stack() {
    const {filename, selectedTab} = useParams<{ filename: string; selectedTab: string }>();
    const navigate = useNavigate();

    const tabsMap: Map<string, TabDetails> = useMemo(() => {
        const isComposeFile = filename?.endsWith(".yml") || filename?.endsWith(".yaml");
        const map = new Map<string, TabDetails>();

        map.set('editor', {
            label: 'Editor',
            component: <StackEditor key={filename!} selectedPage={filename!}/>
        });

        if (isComposeFile) {
            map.set('deploy', {
                label: 'Deploy',
                component: <StackDeploy selectedPage={filename!}/>
            });
            map.set('stats', {
                label: 'Stats',
                component: <StatStacksPage selectedPage={filename!}/>
            });
        }

        return map;
    }, [filename]);

    const currentTab = selectedTab ?? 'editor';

    const handleTabChange = (_event: SyntheticEvent, newKey: string) => {
        navigate(`/files/${filename}/${newKey}`);
    };

    const activePanel = tabsMap.get(currentTab)?.component;

    useEffect(() => {
        if (selectedTab && !tabsMap.has(selectedTab)) {
            // for bad URL: /files/file.txt/invalid-tab
            // redirect them to the default tab.
            navigate(`/files/${filename}/editor`, {replace: true});
        }
    }, [filename, selectedTab, tabsMap, navigate]);

    if (!filename) {
        return <Typography sx={{p: 3}}>Error: No filename provided.</Typography>;
    }

    return (
        <>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={currentTab} onChange={handleTabChange}>
                    {Array.from(tabsMap.entries()).map(([key, details]) => (
                        <Tab key={key} value={key} label={details.label}/>
                    ))}
                </Tabs>
            </Box>
            {activePanel}
        </>
    );
}