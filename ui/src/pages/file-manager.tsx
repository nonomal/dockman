import {type SyntheticEvent, useEffect, useState} from "react";
import {Box, Tab, Tabs, Typography} from "@mui/material";
import {EditorPage} from "./editor-page.tsx";
import {DeployPage} from "./deploy-page.tsx";
import {useParams} from "react-router-dom";

export function FileManagerPage() {
    const {filename} = useParams();
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        setTabValue(0);
    }, [filename]);

    if (!filename) {
        return <Typography sx={{p: 3}}>Error: No filename provided.</Typography>;
    }

    return (
        <>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Editor"/>
                    <Tab label="Deploy" disabled={!(filename.endsWith(".yml") || filename.endsWith(".yaml"))}/>
                </Tabs>
            </Box>
            {tabValue === 0 && <EditorPage selectedPage={filename}/>}
            {tabValue === 1 && <DeployPage selectedPage={filename}/>}
        </>
    );
}
