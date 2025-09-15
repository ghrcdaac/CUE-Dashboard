import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from "@mui/material/Autocomplete";
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Grid } from '@mui/material';
import { isValidEmail, isNotEmpty } from '../utils/validation';
import { createUserApplication } from '../api/userApplicationApi';
import { getNgroupsForApplication } from '../api/ngroupApi';
import { getProvidersForApplication } from '../api/providerApi';
import { getUserClaims } from '../api/authApi';
// --- ADDED IMPORT ---
import useAuth from '../hooks/useAuth';

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
    },
});

function SignupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    // --- ADDED HOOK ---
    const { logout } = useAuth();

    const [formData, setFormData] = useState({
        name: location.state?.name || '',
        email: location.state?.email || '',
        username: location.state?.username || '',
        justification: '',
        ngroup_id: '',
        account_type: 'daac',
        provider_id: null,
    });

    const [ngroupOptions, setNgroupOptions] = useState([]);
    const [providerOptions, setProviderOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const [loadingNgroups, setLoadingNgroups] = useState(false);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [isUserDataLocked, setIsUserDataLocked] = useState(!!location.state?.name);

    useEffect(() => {
        const fetchUserClaims = async () => {
            if (!location.state?.name) {
                try {
                    const userClaims = await getUserClaims();
                    setFormData(prev => ({
                        ...prev,
                        name: userClaims.name || '',
                        email: userClaims.email || '',
                        username: userClaims.cueusername || '',
                    }));
                    setIsUserDataLocked(true);
                } catch (error) {
                    console.error("Failed to fetch user claims:", error);
                    setSubmissionError("Could not retrieve your user details. Please try logging in again.");
                }
            }
        };
        fetchUserClaims();
    }, [location.state]);

    useEffect(() => {
        const fetchNgroupOptions = async () => {
            setLoadingNgroups(true);
            try {
                const groups = await getNgroupsForApplication();
                setNgroupOptions(groups);
            } catch (error) {
                console.error("Error fetching ngroup options:", error);
                setSubmissionError(`Error fetching groups: ${error.message}`);
            } finally {
                setLoadingNgroups(false);
            }
        };
        fetchNgroupOptions();
    }, []);

    useEffect(() => {
        const fetchProviders = async () => {
            if (formData.account_type === 'provider' && formData.ngroup_id) {
                setLoadingProviders(true);
                try {
                    const providersData = await getProvidersForApplication(formData.ngroup_id);
                    setProviderOptions(providersData);
                } catch (error) {
                    console.error('Error fetching providers:', error);
                    setSubmissionError(`Failed to fetch providers: ${error.message}`);
                    setProviderOptions([]);
                } finally {
                    setLoadingProviders(false);
                }
            } else {
                setProviderOptions([]);
            }
        };
        fetchProviders();
    }, [formData.account_type, formData.ngroup_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        if (name === 'account_type' && value === 'daac') {
            updatedFormData.provider_id = null;
        }
        setFormData(updatedFormData);
        setErrors({ ...errors, [name]: '' });
    };

    const handleNgroupChange = (event, newValue) => {
        setFormData(prev => ({ ...prev, ngroup_id: newValue ? newValue.id : '', provider_id: null }));
        setProviderOptions([]);
        setErrors(prev => ({ ...prev, ngroup_id: '' }));
    };

    const handleProviderChange = (event, newValue) => {
        setFormData(prev => ({ ...prev, provider_id: newValue ? newValue.id : null }));
        setErrors(prev => ({ ...prev, provider_id: '' }));
    };
    
    const validateForm = () => {
        const newErrors = {};
        if (!isNotEmpty(formData.name)) newErrors.name = 'Name is required';
        if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email address';
        if (!isNotEmpty(formData.username)) newErrors.username = 'Username is required';
        if (!isNotEmpty(formData.justification)) newErrors.justification = 'Justification is required';
        if (!isNotEmpty(formData.ngroup_id)) newErrors.ngroup_id = 'Group is required';
        if (formData.account_type === 'provider' && !formData.provider_id) {
            newErrors.provider_id = 'Provider is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setSubmissionError('');

        try {
            await createUserApplication(formData);
            setOpenSuccessDialog(true);
        } catch (error) {
            setSubmissionError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCloseSuccessDialog = () => {
        setOpenSuccessDialog(false);
        navigate('/pending-approval'); 
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'primary.main', p: 2 }}>
                <Paper elevation={5} sx={{ padding: 3, maxWidth: 600, width: '100%' }}>
                    <Typography component="h1" variant="h5" sx={{ color: 'primary.main', textAlign: 'center', mb: 2 }}>
                        Cloud Upload Environment - New User Application
                    </Typography>
                    {submissionError && <Typography color="error" align="center">{submissionError}</Typography>}
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField 
                            fullWidth 
                            label="Name" 
                            margin="normal" 
                            required 
                            name="name"
                            value={formData.name} 
                            onChange={handleChange} 
                            error={!!errors.name}
                            helperText={errors.name}
                            InputProps={{ readOnly: isUserDataLocked }}
                        />
                        <TextField 
                            fullWidth 
                            label="Email" 
                            margin="normal" 
                            required 
                            name="email"
                            value={formData.email} 
                            onChange={handleChange} 
                            error={!!errors.email}
                            helperText={errors.email}
                            InputProps={{ readOnly: isUserDataLocked }}
                        />
                        <TextField 
                            fullWidth 
                            label="Username" 
                            margin="normal" 
                            required 
                            name="username"
                            value={formData.username} 
                            onChange={handleChange} 
                            error={!!errors.username}
                            helperText={errors.username}
                            InputProps={{ readOnly: isUserDataLocked }}
                        />
                        <TextField fullWidth label="Justification" margin="normal" required name="justification" multiline rows={4}
                            value={formData.justification} onChange={handleChange} error={!!errors.justification}
                            helperText={errors.justification}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="account-type-label">Account Type</InputLabel>
                            <Select
                                labelId="account-type-label"
                                name="account_type"
                                value={formData.account_type}
                                onChange={handleChange}
                                label="Account Type"
                            >
                                <MenuItem value="daac">DAAC</MenuItem>
                                <MenuItem value="provider">Provider</MenuItem>
                            </Select>
                        </FormControl>
                        <Autocomplete
                            options={ngroupOptions}
                            getOptionLabel={(option) => option.short_name || ''}
                            value={ngroupOptions.find(opt => opt.id === formData.ngroup_id) || null}
                            onChange={handleNgroupChange}
                            loading={loadingNgroups}
                            renderInput={(params) => (
                                <TextField {...params} label="Group" required error={!!errors.ngroup_id} helperText={errors.ngroup_id} />
                            )}
                        />
                        {formData.account_type === 'provider' && (
                            <Autocomplete
                                options={providerOptions}
                                getOptionLabel={(option) => option.short_name || ''}
                                value={providerOptions.find(opt => opt.id === formData.provider_id) || null}
                                onChange={handleProviderChange}
                                loading={loadingProviders}
                                renderInput={(params) => (
                                    <TextField {...params} label="Provider" required error={!!errors.provider_id} helperText={errors.provider_id} margin="normal" />
                                )}
                            />
                        )}
                        {/* --- ADDED: Cancel button and Grid for layout --- */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} sm={6}>
                                <Button 
                                    onClick={() => logout()}
                                    fullWidth 
                                    variant="outlined"
                                >
                                    Cancel & Go Back
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button 
                                    type="submit" 
                                    fullWidth 
                                    variant="contained" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? <CircularProgress size={24} /> : 'Submit Application'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
                <Dialog open={openSuccessDialog} onClose={handleCloseSuccessDialog}>
                    <DialogTitle>Success</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Your application has been submitted for review.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseSuccessDialog}>OK</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}

export default SignupPage;
