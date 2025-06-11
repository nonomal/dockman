import {
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    RestartAlt as RestartAltIcon,
    Stop as StopIcon,
    Sync as UpdateIcon,
} from '@mui/icons-material';
import {Box, Button, Typography} from "@mui/material";


interface DeployPageProps {
    selectedPage: string
}

// const [loadingStates, setLoadingStates] = useState({
//         save: false,
//         start: false,
//         stop: false,
//         remove: false,
//         restart: false,
//         update: false,
//     });


export function DeployPage({selectedPage}: DeployPageProps) {
    const deployActions = [
        {
            name: 'start', icon: <PlayArrowIcon/>, handler: () => {
            }
        },
        {
            name: 'stop', icon: <StopIcon/>, handler: () => {
            }
        },
        {
            name: 'remove', icon: <DeleteIcon/>, handler: () => {
            }
        },
        {
            name: 'restart', icon: <RestartAltIcon/>, handler: () => {
            }
        },
        {
            name: 'update', icon: <UpdateIcon/>, handler: () => {
            }
        },
    ];

    return (
        <Box sx={{p: 3, height: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
                {deployActions.map((action) => (
                    <Button
                        key={action.name}
                        variant="outlined"
                        disabled={true}
                        onClick={action.handler}
                        // startIcon={loadingStates[action.name] ?
                        //     <CircularProgress size={20} color="inherit"/> : action.icon}
                        startIcon={action.icon}
                    >
                        {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                    </Button>
                ))}
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    border: '2px dashed',
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                    borderRadius: 1,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)'
                }}
            >
                {selectedPage ?
                    <Typography variant="h5" color="text.secondary">
                        Deployment Status and Logs Placeholder
                    </Typography> :
                    <Typography variant="h5" color="text.secondary">
                        Select a page
                    </Typography>}
            </Box>
        </Box>
    );
}
