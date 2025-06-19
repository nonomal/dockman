import React, {useState} from 'react';
import {Box, Button, Container, Paper, TextField, Typography,} from '@mui/material';
import {callRPC, useClient} from "../lib/api.ts";
import {AuthService} from "../gen/auth/v1/auth_pb.ts";
import {useAuth, useSnackbar} from "../context/providers.ts";
import {useNavigate} from "react-router-dom";

export function AuthPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const authClient = useClient(AuthService)
    const {showError} = useSnackbar()
    const navigate = useNavigate();
    const {refreshAuthStatus} = useAuth()

    const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        callRPC(() => authClient.login({username: username, password: password})).then(value => {
            if (value.err) {
                showError(value.err)
            }
            refreshAuthStatus()
            navigate('/');
        })
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3}
                   sx={{marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{mt: 1, width: '100%'}}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="user"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: 3, mb: 2}}
                    >
                        Sign In
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}