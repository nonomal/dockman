import {createContext, useContext} from "react";

export interface TabDetails {
    subTabIndex: number;
    row: number;
    col: number;
}

export interface TabsContextType {
    tabs: Record<string, TabDetails>;
    activeTab: string;
    setTabDetails: (filename: string, details: Partial<TabDetails>) => void;
    openTab: (filename: string) => void;
    closeTab: (filename: string) => void;
    renameTab: (oldFilename: string, newFilename: string) => void;
    onTabClick: (filename: string) => void;
}

export const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const useTabs = (): TabsContextType => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabsProvider');
    }
    return context;
};
