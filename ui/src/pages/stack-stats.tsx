import {Typography} from "@mui/material";

interface StackStatsProps {
    selectedPage: string;
}

export function StatStacksPage({selectedPage}: StackStatsProps) {
    return (
        <Typography>
            Stats !!!! {selectedPage}
        </Typography>
    )
}