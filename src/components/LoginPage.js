import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import usePageTitle from '../hooks/usePageTitle';
import useAuth from '../hooks/useAuth';

// theme consistent with other pages


function LoginPage() {
    const { login, isLoading } = useAuth();
    usePageTitle('Sign in');

    const handleLogin = (event) => {
        // Prevent default link behavior if this is called from the link
        event.preventDefault(); 
        if (!isLoading) {
            login();
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box
                component="main"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    padding: '20px',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 4,
                        paddingTop: 10,
                    }}
                >
                    <img src="/nasa_logo.png" alt="NASA Logo" width="150" height="125" style={{ width: '150px', height: 'auto', marginBottom: '20px' }} />
                    <Typography variant="h5" component="p" sx={{ mt: 1 }}>
                        Cloud Upload Environment
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <Typography variant="h6" component="h1" gutterBottom sx={{ color: 'primary.main' }}>
                        Sign In
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                        To continue, please sign in with your NASA Earthdata Login.
                    </Typography>
                    <Button
                        onClick={handleLogin}
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{ mt: 1, mb: 2, p: 1.2, fontSize: '1rem' }}
                    >
                        {isLoading ? 'Redirecting...' : 'Login with IDFS'}
                    </Button>
                    <Grid container justifyContent="center">
                        <Grid item>
                            {/* This link now triggers the same login flow */}
                            <Link component="button" type="button" onClick={handleLogin} variant="body2" sx={{ color: 'primary.main' }}>
                                New User? Request an Account
                            </Link>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </ThemeProvider>
    );
}

export default LoginPage;
