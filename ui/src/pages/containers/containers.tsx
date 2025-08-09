import {Box, Container, Divider, Typography} from '@mui/material';

const ContainersPage = () => {
    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    textAlign: 'center',
                    py: 8
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 300,
                        color: 'text.secondary',
                        mb: 2
                    }}
                >
                    Containers
                </Typography>

                <Divider sx={{width: 60, mb: 3}}/>

                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 'normal'
                    }}
                >
                    Coming soon to a theatre near you
                </Typography>
            </Box>
        </Container>
    );
};

export default ContainersPage;