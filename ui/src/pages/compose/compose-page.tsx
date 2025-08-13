import React, {type SyntheticEvent, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {TabEditor} from "./tab-editor.tsx";
import {TabDeploy} from "./tab-deploy.tsx";
import {Box, CircularProgress, Fade, IconButton, Stack, Tab, Tabs, Tooltip, Typography} from '@mui/material';
import {TabStat} from "./tab-stats.tsx";
import {callRPC, useClient} from "../../lib/api.ts";
import {FileService} from "../../gen/files/v1/files_pb.ts";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {FileList} from "./components/file-bar.tsx";
import {DescriptionOutlined} from '@mui/icons-material';
import {TelescopeProvider} from './context/telescope-context.tsx';
import CloseIcon from '@mui/icons-material/Close';
import {ShortcutFormatter} from "./components/shortcut-formatter.tsx";
import {FilesProvider} from "../../context/file-context.tsx";

export const ComposePage = () => {
    const navigate = useNavigate();
    const {file, child} = useParams<{ file: string; child?: string }>();
    const filename = child ? `${file}/${child}` : file;

    const [openTabs, setOpenTabs] = useState<string[]>([]);
    const TAB_LIMIT = 5;

    // This effect syncs the URL with the open tabs.
    // When the `filename` in the URL changes, it adds it as a new tab if not already open.
    useEffect(() => {
        if (filename) {
            setOpenTabs(prevTabs => {
                if (prevTabs.includes(filename)) {
                    return prevTabs;
                }

                // If we're at the limit, remove the oldest tab (first in array)
                if (prevTabs.length >= TAB_LIMIT) {
                    return [...prevTabs.slice(0, prevTabs.length - 1), filename]; // Remove last, add new at end
                }

                // Add the new filename to tabs
                return [...prevTabs, filename];
            });
        }
    }, [filename]); // Re-run only when the filename from the URL changes

    // Find the index of the currently active tab
    const activeTabIndex = filename ? openTabs.indexOf(filename) : false;


    // Navigate to the correct URL when a tab is clicked
    const handleTabChange = (_event: React.SyntheticEvent, newIndex: number) => {
        const newFilename = openTabs[newIndex];
        navigate(`/stacks/${newFilename}`);
    };


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for the base shortcut combination (Ctrl + Alt)
            if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.repeat) {
                // Test if the pressed key is a single digit ('0'-'9')
                // Convert the key string (e.g., "7") to a number
                const tabIndex = parseInt(e.key, 10) - 1;
                if (!isNaN(tabIndex)) {
                    e.preventDefault();

                    const page = openTabs[tabIndex]
                    if (page) {
                        navigate(`/stacks/${page}`)
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate, openTabs])

    // Close a tab and navigate to an appropriate new tab
    const handleCloseTab = (tabToClose: string) => {
        const closingTabIndex = openTabs.indexOf(tabToClose);
        const newTabs = openTabs.filter(tab => tab !== tabToClose);
        setOpenTabs(newTabs);

        // If the active tab is being closed, determine the next tab to show
        if (filename === tabToClose) {
            if (newTabs.length === 0) {
                navigate('/stacks'); // No tabs left, show empty page
            } else {
                // Default to the tab to the left, or the new first tab
                const newActiveIndex = Math.max(0, closingTabIndex - 1);
                const newFilename = newTabs[newActiveIndex];
                const [newFile, ...newChildParts] = newFilename.split('/');
                const newChild = newChildParts.join('/');

                if (newChild) {
                    navigate(`/stacks/${newFile}/${newChild}`);
                } else {
                    navigate(`/stacks/${newFile}`);
                }
            }
        }
    };

    return (
        <FilesProvider>
            <TelescopeProvider>
                <Box sx={{
                    display: 'flex',
                    height: '100vh',
                    width: '100%',
                    overflow: 'hidden'
                }}>
                    <Box sx={{
                        width: 280,
                        flexShrink: 0,
                        borderRight: 1,
                        borderColor: 'divider',
                        overflowY: 'auto'
                    }}>
                        <FileList closeTab={handleCloseTab}/>
                    </Box>

                    <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                        {/* Tab Bar */}
                        {openTabs.length > 0 && (
                            <Box sx={{borderBottom: 1, borderColor: 'divider', flexShrink: 0}}>
                                <Tabs
                                    value={activeTabIndex === -1 ? false : activeTabIndex}
                                    onChange={handleTabChange}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                >
                                    {openTabs.map((tabFilename, index) => (
                                        <Tooltip title={
                                            <ShortcutFormatter
                                                title=""
                                                keyCombo={["CTRL", `${index + 1}`]}
                                            />
                                        }>
                                            <Tab
                                                key={tabFilename}
                                                sx={{textTransform: 'none', p: 0.5}}
                                                label={
                                                    <Box sx={{display: 'flex', alignItems: 'center', px: 1}}>
                                                        {tabFilename.split('/').pop()}
                                                        <IconButton
                                                            size="small"
                                                            component="div"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevents `handleTabChange` from firing
                                                                handleCloseTab(tabFilename)
                                                            }}
                                                            sx={{ml: 1.5}}
                                                        >
                                                            <CloseIcon sx={{fontSize: '1rem'}}/>
                                                        </IconButton>
                                                    </Box>
                                                }
                                            />
                                        </Tooltip>
                                    ))}
                                </Tabs>
                            </Box>
                        )}

                        {/* Content Area */}
                        <Box sx={{flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column'}}>
                            {!filename ?
                                <CoreComposeEmpty/> :
                                <CoreCompose filename={filename}/>
                            }
                        </Box>
                    </Box>
                </Box>
            </TelescopeProvider>
        </FilesProvider>
    );
};

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

interface TabDetails {
    label: string;
    component: React.ReactElement;
    shortcut: React.ReactElement;
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const path = `/stacks/${filename}`
            if (e.altKey && !e.repeat) {
                switch (e.code) {
                    case "KeyZ":
                        e.preventDefault();
                        navigate(`${path}?tab=0`);
                        break;
                    case "KeyX":
                        e.preventDefault();
                        navigate(`${path}?tab=1`);
                        break;
                    case "KeyC":
                        e.preventDefault();
                        navigate(`${path}?tab=2`);
                        break;
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [filename, navigate]);


    const tabsList: TabDetails[] = useMemo(() => {
        if (!filename) return [];

        const isComposeFile = filename.endsWith(".yml") || filename.endsWith(".yaml");
        const map: TabDetails[] = []

        map.push({
            label: 'Editor',
            component: <TabEditor key={filename} selectedPage={filename}/>,
            shortcut: <ShortcutFormatter title={"Editor"} keyCombo={["ALT", "Z"]}/>,
        })

        if (isComposeFile) {
            map.push({
                label: 'Deploy',
                component: <TabDeploy selectedPage={filename}/>,
                shortcut: <ShortcutFormatter title={"Editor"} keyCombo={["ALT", "X"]}/>,
            });
            map.push({
                label: 'Stats',
                component: <TabStat selectedPage={filename}/>,
                shortcut: <ShortcutFormatter title={"Editor"} keyCombo={["ALT", "C"]}/>,
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
                        <Tooltip title={details.shortcut}>
                            <Tab key={key} value={key} label={details.label}/>
                        </Tooltip>
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
