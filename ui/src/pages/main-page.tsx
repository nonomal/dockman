import {type SyntheticEvent, useState} from "react";
import {Box, Tab, Tabs, Typography} from "@mui/material";
import {FileSidebar} from "../components/sidebar.tsx";
import {EditorPage} from "./editor-page.tsx";
import {DeployPage} from "./deploy-page.tsx";

export function HomePage() {
    const [tabValue, setTabValue] = useState(0);
    const [selectedFile, setSelectedFile] = useState("")

    const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{display: 'flex', height: '100vh', overflow: 'hidden'}}>
            <FileSidebar onFileClick={({filename}) => {
                setSelectedFile(filename)
            }}/>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {selectedFile ? (
                    <>
                        {/* TABS */}
                        <Box sx={{borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper'}}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="main tabs">
                                <Tab label="Editor" id="tab-0"/>
                                <Tab label="Deploy" id="tab-1"
                                     disabled={!(selectedFile.endsWith("yaml") ||
                                         selectedFile.endsWith("yml"))}/>
                            </Tabs>
                        </Box>
                        {/* TAB PANELS */}
                        {tabValue === 0 && <EditorPage selectedPage={selectedFile}/>}
                        {tabValue === 1 && <DeployPage selectedPage={selectedFile}/>}
                    </>
                ) : (
                    <Typography
                        variant="h5"
                        color="text.secondary"
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            textAlign: 'center'
                        }}
                    >
                        Select a file
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
