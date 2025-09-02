import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {type TabDetails, TabsContext} from "../hooks/tabs.ts";
import {useHost} from "../hooks/host.ts";
import {useConfig} from "../hooks/config.ts";

interface TabsProviderProps {
    children: ReactNode
}

export function TabsProvider({children}: TabsProviderProps) {
    const {selectedHost} = useHost()
    const {dockYaml} = useConfig()
    const tabLimit = dockYaml?.tabLimit ?? 5

    const navigate = useNavigate();
    const location = useLocation(); // current location
    const {file, child} = useParams<{ file: string; child?: string }>();
    const filename = child ? `${file}/${child}` : file;

    const [curTab, setCurTab] = useState("")
    const [openTabs, setOpenTabs] = useState<Record<string, TabDetails>>({})

    useEffect(() => {
        // reset tabs on changing host
        setOpenTabs({})
        setCurTab("")
    }, [selectedHost])

    // handler for when someone clicks on a tab
    const handleTabClick = useCallback((filename: string) => {
        const tabDetail = openTabs[filename];
        navigate(`/stacks/${filename}?tab=${tabDetail.subTabIndex ?? 0}`);
    }, [openTabs, navigate]);

    const handleOpenTab = useCallback((filename: string) => {
        const params = new URLSearchParams(location.search);

        setOpenTabs(prevTabs => {
            // If tab already exists, just navigate
            if (prevTabs[filename]) {
                const tab = Number(params.get("tab") ?? "0")
                return {
                    ...prevTabs,
                    [filename]: {...prevTabs[filename], subTabIndex: tab},
                }
            }

            const newTabs = {...prevTabs};
            // Enforce tab limit
            const keys = Object.keys(newTabs);
            if (keys.length >= tabLimit) {
                const firstKey = keys[0];
                delete newTabs[firstKey];
            }

            // Add new tab with default subTabIndex
            newTabs[filename] = {subTabIndex: 0};
            return newTabs;
        });
    }, [location.search, tabLimit]);

    const handleCloseTab = useCallback((filename: string) => {
        setOpenTabs(prevTabs => {
            const newTabs = {...prevTabs};
            delete newTabs[filename];

            if (Object.keys(newTabs).length < 1) {
                navigate("/stacks")
            }

            return newTabs;
        });
    }, [navigate]);

    const handleTabRename = useCallback((oldFilename: string, newFilename: string) => {
        setOpenTabs(prevTabs => {
            const tab = prevTabs[oldFilename];
            if (!tab) return prevTabs; // nothing to rename

            const newTabs = {...prevTabs, [newFilename]: tab};
            delete newTabs[oldFilename];

            // Optional: navigate to renamed tab
            navigate(`/stacks/${newFilename}?tab=${tab.subTabIndex}`);

            return newTabs;
        });
    }, [navigate]);


    // This effect syncs the URL with the open tabs.
    // When the `filename` in the URL changes, it adds it as a new tab if not already open.
    useEffect(() => {
        if (!location.pathname.startsWith("/stacks")) return;

        const tabToOpen = filename ?? curTab;
        if (!tabToOpen) return;

        handleOpenTab(tabToOpen);

        if (filename && filename !== curTab) {
            setCurTab(filename);
        }
    }, [filename, curTab, handleOpenTab, location.pathname]);

    // const activeTabName = filename ? !!openTabs[filename] : false;

    const value = {
        tabs: openTabs,
        activeTab: curTab,
        openTab: handleOpenTab,
        closeTab: handleCloseTab,
        renameTab: handleTabRename,
        onTabClick: handleTabClick
    }

    return (
        <TabsContext.Provider value={value}>
            {children}
        </TabsContext.Provider>
    )
}
