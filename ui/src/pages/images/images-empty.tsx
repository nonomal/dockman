import {Link, Paper, Typography} from "@mui/material";
import {Storage} from '@mui/icons-material'

export const ImagesEmpty = ({searchTerm}: { searchTerm: string }) => {
    return (
        <Paper sx={{
            p: 6,
            textAlign: 'center',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <Storage sx={{
                fontSize: 48,
                color: 'text.secondary',
                mb: 2,
                mx: 'auto'
            }}/>

            <Typography variant="h6" sx={{mb: 1}}>
                {searchTerm ? 'No images found' : 'No images available'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
                {searchTerm ? (
                    'Try adjusting your search criteria.'
                ) : (
                    <>
                        Run some apps, treat yourself, {' '}
                        <Link
                            href="https://selfh.st/apps/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            https://selfh.st/apps/
                        </Link>
                    </>
                )}
            </Typography>
        </Paper>
    );
};
