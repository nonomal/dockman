import {useEffect, useState} from "react"
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material"
import {Cancel, CloudDownloadOutlined, Sync} from "@mui/icons-material"
import {callRPC, useClient} from "../lib/api.ts"
import {GitService} from "../gen/git/v1/git_pb.ts"

interface ImportFilesDialogProps {
    open: boolean
    onClose: () => void
    onImportComplete: () => void
    currentBranch: string
}

export function ImportFilesDialog({open, onClose, onImportComplete, currentBranch}: ImportFilesDialogProps) {
    const gitClient = useClient(GitService)

    // Input states
    const [branch, setBranch] = useState('')
    const [fileNameFilter, setFileNameFilter] = useState('')


    const [allBranches, setAllBranches] = useState<string[]>([])
    const [isBranchLoading, setIsBranchLoading] = useState(false)
    const [branchError, setBranchError] = useState<string | null>(null)

    // Data and selection states
    const [allFiles, setAllFiles] = useState<string[]>([])
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

    // UI states for file fetching
    const [isFilesLoading, setIsFilesLoading] = useState(false)
    const [filesError, setFilesError] = useState<string | null>(null)
    const [isImporting, setIsImporting] = useState(false)

    useEffect(() => {
        if (open) {
            const fetchBranches = async () => {
                setIsBranchLoading(true)
                setBranchError(null)

                const {val, err} = await callRPC(() => gitClient.listBranches({}))
                if (err) {
                    setBranchError("Failed to load branches.")
                } else {
                    setAllBranches(val?.branches ?? [])
                }

                setIsBranchLoading(false)
            }
            fetchBranches().then()
        } else {
            // Reset all state on close
            setBranch('')
            setFileNameFilter('')
            setAllFiles([])
            setSelectedFiles(new Set())
            setFilesError(null)
            setIsFilesLoading(false)
            setIsImporting(false)
            setAllBranches([])
            setBranchError(null)
        }
    }, [gitClient, open])


    useEffect(() => {
        // Don't fetch if no branch is selected
        if (!branch) {
            setAllFiles([])
            setSelectedFiles(new Set())
            return
        }

        const fetchFiles = async () => {
            setIsFilesLoading(true)
            setFilesError(null)
            setSelectedFiles(new Set())

            const {val, err} = await callRPC(() => gitClient.listFileFromBranch({branch: branch}))
            if (err) {
                setFilesError("Failed to fetch files from the repository.")
                setAllFiles([])
            } else {
                const res = val?.files ?? []
                setAllFiles(res)
                if (res.length === 0) {
                    setFilesError(`No files found for branch "${branch}".`)
                }
            }

            setIsFilesLoading(false)
        }

        fetchFiles().then()
    }, [branch, gitClient])

    const filteredFiles = allFiles.filter(file =>
        file.toLowerCase().includes(fileNameFilter.toLowerCase())
    )

    const handleToggleSelection = (file: string) => {
        const newSelection = new Set(selectedFiles)
        if (newSelection.has(file)) {
            newSelection.delete(file)
        } else {
            newSelection.add(file)
        }
        setSelectedFiles(newSelection)
    }

    const handleImport = async () => {
        if (selectedFiles.size === 0) return
        setIsImporting(true)

        const {err} = await callRPC(() => gitClient.syncFile({
            branch: branch, filepath: Array.from(selectedFiles)
        }))
        if (err) {
            setFilesError("An error occurred during the import process.")
        } else {
            onImportComplete()
            onClose()
        }
        setIsImporting(false)
    }

    const isImportDisabled = selectedFiles.size === 0 || isImporting

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Sync color="primary"/>
                Import Files from Branch
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                    <TextField
                        select
                        fullWidth
                        label="Branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        disabled={isBranchLoading || !!branchError}
                        error={!!branchError}
                        helperText={branchError || (isBranchLoading ? "Loading branches..." : "Select a branch to see files")}
                    >
                        {isBranchLoading ? (
                            <MenuItem disabled value="">
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                    <CircularProgress size={20}/>
                                    <Typography>Loading...</Typography>
                                </Box>
                            </MenuItem>
                        ) : (
                            allBranches.map((branchName) => (
                                branchName === currentBranch ? <></> :
                                    <MenuItem key={branchName} value={branchName}>
                                        {branchName}
                                    </MenuItem>
                            ))
                        )}
                    </TextField>

                    <TextField
                        fullWidth
                        label="Filter by file name"
                        variant="outlined"
                        value={fileNameFilter}
                        onChange={(e) => setFileNameFilter(e.target.value)}
                        disabled={!branch || allFiles.length === 0}
                    />
                </Box>

                <Typography variant="subtitle2" sx={{mb: 1}}>
                    Files {filteredFiles.length > 0 && `(${selectedFiles.size} selected)`}
                </Typography>

                <Box sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    height: 300,
                    overflow: 'auto',
                    p: 1
                }}>
                    {isFilesLoading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <CircularProgress/>
                        </Box>
                    ) : filteredFiles.length > 0 ? (
                        <List dense>
                            {filteredFiles.map((file) => (
                                <ListItem key={file} disablePadding>
                                    <ListItemButton onClick={() => handleToggleSelection(file)} dense>
                                        <Checkbox edge="start" checked={selectedFiles.has(file)} tabIndex={-1}
                                                  disableRipple/>
                                        <ListItemText primary={file}/>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <Typography color="text.secondary">
                                {filesError || "Select a branch to see available files."}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2, gap: 1.5}}>
                <Button onClick={onClose} startIcon={<Cancel/>}>Close</Button>
                <Button onClick={handleImport} variant="contained" disabled={isImportDisabled}
                        startIcon={isImporting ? <CircularProgress size={20} color="inherit"/> :
                            <CloudDownloadOutlined/>}>
                    {isImporting ? 'Importing...' : 'Import'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}