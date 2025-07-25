import {Link as RouterLink} from 'react-router-dom';
import {Box, Button, Stack, Typography} from '@mui/material'; // 👈 1. Import Stack

const NotFoundPage = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
            }}
        >
            {/* 👇 2. Wrap the content in a Stack */}
            <Stack spacing={8} sx={{alignItems: 'center', textAlign: 'center', maxWidth: 'md', px: 2}}>
                <Typography variant="h3" component="h1">
                    Page Not Found
                </Typography>

                <Typography variant="h6" color="text.secondary">
                    Page not in the sudoers file. This incident will be reported.
                </Typography>

                <Button
                    variant="contained"
                    component={RouterLink}
                    to="/"
                >
                    Go to Homepage... Go on. I dare you.
                </Button>
            </Stack>
        </Box>
    );
};

export default NotFoundPage;