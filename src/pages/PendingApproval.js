import { Box, Typography, Paper, Button, createTheme, ThemeProvider } from '@mui/material';
// --- ADDED IMPORT ---
import useAuth from '../hooks/useAuth';

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
    },
});

function PendingApproval() {
    // --- ADDED HOOK ---
    const { logout } = useAuth();

    return (
        <ThemeProvider theme={theme}>
            <Box
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
                    <img src="/nasa_logo.png" alt="NASA Logo" style={{ width: '150px', height: 'auto', marginBottom: '20px' }} />
                    <Typography variant="h5" component="h2" sx={{ mt: 1 }}>
                        Cloud Upload Environment
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: '500px' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                        Application Submitted
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Thank you for your request. Your application is currently under review by our administrators.
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                        You will be notified via email once your account has been approved.
                    </Typography>
                    {/* --- UPDATED: Button now calls logout() --- */}
                    <Button
                        variant="contained"
                        onClick={() => logout()}
                        sx={{ mt: 3, width: '100%' }}
                    >
                        Back to Login
                    </Button>
                </Paper>
            </Box>
        </ThemeProvider>
    );
}

export default PendingApproval;
