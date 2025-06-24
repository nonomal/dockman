import {useCallback, useEffect, useMemo, useState} from "react";
import {type Commit, GitService} from "../gen/git/v1/git_pb";
import {callRPC, useClient} from "../lib/api";
import {useSnackbar} from "../hooks/snackbar.ts";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Typography
} from "@mui/material";
import {ExpandMore} from "@mui/icons-material";

interface CommitListProps {
    selectedFile: string;
    selectedCommit: string;
    chooseCommit: (commit: string) => void;
}

interface GroupedCommits {
    [date: string]: Commit[];
}

export function GitCommitList({selectedFile, selectedCommit, chooseCommit}: CommitListProps) {
    const gitClient = useClient(GitService); // useClient is now mocked
    const {showError} = useSnackbar(); // useSnackbar is now mocked
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCommitCallback = useCallback(async () => {
        if (!selectedFile) {
            setCommits([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        // callRPC is now mocked
        const {val, err} = await callRPC(() => gitClient.listCommits({name: selectedFile}));
        if (err) {
            showError(String(err));
            setCommits([]);
        } else {
            setCommits(val?.commits ?? []);
        }
        setLoading(false);
    }, [gitClient, selectedFile, showError]);

    // Fetch commits when the component mounts or the selected file changes
    useEffect(() => {
        fetchCommitCallback().then();
    }, [fetchCommitCallback]);

    /**
     * Groups and sorts the fetched commits by date.
     * useMemo ensures this expensive computation only runs when commits change.
     */
    const groupedCommits = useMemo(() => {
        const sortedCommits = [...commits].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

        return sortedCommits.reduce((acc: GroupedCommits, commit) => {
            const commitDate = new Date(commit.when).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            if (!acc[commitDate]) {
                acc[commitDate] = [];
            }
            acc[commitDate].push(commit);
            return acc;
        }, {});
    }, [commits]);

    const handleShowDiff = (commitHash: string) => {
        if (commitHash === selectedCommit) {
            // clear hash if already selected
            chooseCommit("")
        } else {
            chooseCommit(commitHash)
        }
    };

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (Object.keys(groupedCommits).length === 0) {
        return (
            <Box sx={{p: 2, textAlign: 'center'}}>
                <Typography color="text.secondary">No commit history found for this file.</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {Object.entries(groupedCommits).map(([date, commitsOnDate]) => (
                <Accordion key={date} defaultExpanded sx={{'&.Mui-expanded:first-of-type': {marginTop: 0}}}>
                    <AccordionSummary
                        expandIcon={<ExpandMore/>}
                        aria-controls={`panel-content-${date}`}
                        id={`panel-header-${date}`}
                    >
                        <Typography variant="subtitle1" component="div" sx={{flexGrow: 1}}>
                            {date}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{p: 0}}>
                        <List dense disablePadding>
                            {commitsOnDate.map((commit) => (
                                <ListItem
                                    key={commit.hash}
                                    divider
                                    secondaryAction={
                                        <Button
                                            variant={commit.hash === selectedCommit ? 'contained' : 'outlined'}
                                            size="small"
                                            onClick={() => handleShowDiff(commit.hash)}
                                            sx={{mr: 1}}
                                        >
                                            Show Diff
                                        </Button>
                                    }
                                >
                                    <ListItemText
                                        primary={commit.message}
                                        secondary={`by ${commit.author} at ${new Date(commit.when).toLocaleTimeString()}`}
                                        slotProps={{
                                            primary: {style: {whiteSpace: 'pre-wrap'}}
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
}
