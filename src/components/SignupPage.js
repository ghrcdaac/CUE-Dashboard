import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import useAuth from '../hooks/useAuth'; // Keep this for navigate
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from "@mui/material/Autocomplete";
import {
    createUserApplication,
    getNgroups,
    getProvidersForNgroup,
} from '../api/userApplicationApi';
import { isValidEmail, isNotEmpty } from '../utils/validation';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';


const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
    },
});

function SignupPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        justification: '',
        ngroup_id: '',
        account_type: 'daac', // Default to DAAC
        provider_id: null,  // Initially null
    });
    const [ngroupOptions, setNgroupOptions] = useState([]);
    const [providerOptions, setProviderOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false); // For the success dialog
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [loadingNgroups, setLoadingNgroups] = useState(false);
    const [loadingProviders, setLoadingProviders] = useState(false);

    const navigate = useNavigate(); // Use useNavigate hook

    useEffect(() => {
        setIsFormExpanded(true);
    }, []);
    // const {  navigate } = useAuth(); // Only need navigate --  REMOVED.  useNavigate() is the correct way.

    const fetchNgroupOptions = async () => {
        setLoadingNgroups(true);
        try {
            const groups = await getNgroups(); // NO accessToken
            setNgroupOptions(groups);

        } catch (error) {
            console.error("Error fetching ngroup options:", error);
            toast.error(`Error fetching ngroup options: ${error.message}`);
        } finally {
            setLoadingNgroups(false);
        }
    };

    // Fetch NGroups
    useEffect(() => {
        fetchNgroupOptions();
    }, []); // Empty dependency array

    // Fetch Providers
    useEffect(() => {
        const fetchProviders = async () => {
            if (formData.account_type === 'provider' && formData.ngroup_id) {
                setLoadingProviders(true);
                try {
                    const providersData = await getProvidersForNgroup(formData.ngroup_id); // NO accessToken
                    setProviderOptions(providersData);

                } catch (error) {
                    console.error('Error fetching providers:', error);
                    toast.error("Failed to fetch providers: " + error.message);
                    setProviderOptions([]);
                } finally {
                    setLoadingProviders(false);
                }
            } else {
                setProviderOptions([]);
            }
        };
        fetchProviders();
    }, [formData.account_type, formData.ngroup_id]);  // Removed accessToken


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
        const newNgroupId = newValue ? newValue.id : '';
        setFormData(prevFormData => ({
            ...prevFormData,
            ngroup_id: newNgroupId,
            provider_id: null,
        }));
        setProviderOptions([]);
        setErrors(prevErrors => ({ ...prevErrors, ngroup_id: '' }));
    };

    const handleProviderChange = (event, newValue) => {
        const newProviderId = newValue ? newValue.id : null;
        setFormData(prevFormData => ({
            ...prevFormData,
            provider_id: newProviderId
        }));
        setErrors(prevErrors => ({ ...prevErrors, provider_id: '' }));
    };



    const validateForm = () => {
        const newErrors = {};

        if (!isNotEmpty(formData.name)) newErrors.name = 'Name is required';
        if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email address';
        if (!isNotEmpty(formData.username)) newErrors.username = 'Username is required';
        if (!isNotEmpty(formData.justification))
            newErrors.justification = 'Justification is required';
        if (!isNotEmpty(formData.ngroup_id)) newErrors.ngroup_id = 'Ngroup is required';
        if (formData.account_type === 'provider' && !isNotEmpty(formData.provider_id)) {
            newErrors.provider_id = 'Provider is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCloseSuccessDialog = () => {
        setOpenSuccessDialog(false);
        navigate('/login'); 
    };
    const handleNewApplication = () => {
        setOpenSuccessDialog(false);
        setFormData({
            name: '',
            email: '',
            username: '',
            justification: '',
            edpub_id: '',
            ngroup_id: '',
            account_type: 'daac',
            provider_id: null,
        });
        setErrors({});
        setSubmissionError('');
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setSubmissionError('');

        const applicationData = {
            ...formData,
            status: "pending"
        };

        try {
            await createUserApplication(applicationData); // NO accessToken
            setOpenSuccessDialog(true);

        } catch (error) {
            setSubmissionError(error.message);
            toast.error(`Error creating user application: ${error.message}`);

        } finally {
            setIsLoading(false);
        }
    };


    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    // padding: '20px',
                }}
            >

                <Paper elevation={5} sx={{ padding: 3, maxWidth: 600, width: '100%', overflowY: 'visible', }} className={`auth-container ${isFormExpanded ? 'expanded' : ''}`}>
                    <Typography component="h1" variant="h5" sx={{ color: theme.palette.primary.main, textAlign: 'center', marginBottom: '1rem' }}>
                        Cloud Upload Environment - New User
                    </Typography>
                    {submissionError && <div className="error-message">{submissionError}</div>}
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField fullWidth label="Name" margin="normal" required name="name"
                            value={formData.name} onChange={handleChange} error={!!errors.name}
                            helperText={errors.name}
                            InputLabelProps={{
                                style: { color: theme.palette.primary.main },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: theme.palette.primary.main },
                                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                }
                            }} />
                        <TextField fullWidth label="Email" margin="normal" required name="email" type="email"
                            value={formData.email} onChange={handleChange} error={!!errors.email}
                            helperText={errors.email}
                            InputLabelProps={{
                                style: { color: theme.palette.primary.main },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: theme.palette.primary.main },
                                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                }
                            }} />
                        <TextField fullWidth label="Username" margin="normal" required name="username"
                            value={formData.username} onChange={handleChange} error={!!errors.username}
                            helperText={errors.username}
                            InputLabelProps={{
                                style: { color: theme.palette.primary.main },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: theme.palette.primary.main },
                                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                }
                            }} />
                        <TextField fullWidth label="EDPub ID (Optional)" margin="normal" name="edpub_id"
                            value={formData.edpub_id} onChange={handleChange}
                            InputLabelProps={{
                                style: { color: theme.palette.primary.main },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: theme.palette.primary.main },
                                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                }
                            }} />
                        <TextField fullWidth label="Justification" margin="normal" required name="justification" multiline rows={4}
                            value={formData.justification} onChange={handleChange} error={!!errors.justification}
                            helperText={errors.justification}
                            InputLabelProps={{
                                style: { color: theme.palette.primary.main },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: theme.palette.primary.main },
                                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                }
                            }} />

                        <FormControl fullWidth margin="normal">
                            <InputLabel id="account-type-label" >Account Type</InputLabel>
                            <Select
                                labelId="account-type-label"
                                id="account_type"
                                name="account_type"
                                value={formData.account_type}
                                onChange={handleChange}
                                label="Account Type"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": { borderColor: theme.palette.primary.main },
                                        "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                        "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                    }
                                }}
                            >
                                <MenuItem value="daac">DAAC</MenuItem>
                                <MenuItem value="provider">Provider</MenuItem>
                            </Select>
                        </FormControl>

                        <Autocomplete
                            fullWidth
                            margin="normal"
                            options={ngroupOptions}
                            getOptionLabel={(option) => option.short_name || ''}
                            value={ngroupOptions.find(option => option.id === formData.ngroup_id) || null}
                            onChange={handleNgroupChange}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            loading={loadingNgroups}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Group"
                                    name="ngroup_id"
                                    margin="normal"
                                    required
                                    error={!!errors.ngroup_id}
                                    helperText={errors.ngroup_id}
                                    InputLabelProps={{
                                        style: { color: theme.palette.primary.main },
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {loadingNgroups ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            "& fieldset": { borderColor: theme.palette.primary.main },
                                            "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                            "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                        }
                                    }}
                                />
                            )}
                        />

                        {formData.account_type === 'provider' && (
                            <Autocomplete
                                fullWidth
                                margin="normal"
                                options={providerOptions}
                                getOptionLabel={(option) => option.short_name || ''}
                                value={providerOptions.find(option => option.id === formData.provider_id) || null}
                                onChange={handleProviderChange}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                loading={loadingProviders}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Provider"
                                        name="provider_id"
                                        margin="normal"
                                        required
                                        error={!!errors.provider_id}
                                        helperText={errors.provider_id}
                                        InputLabelProps={{
                                            style: { color: theme.palette.primary.main },
                                        }}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {loadingProviders ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                "& fieldset": { borderColor: theme.palette.primary.main },
                                                "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                                "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                            }
                                        }}
                                    />
                                )}
                            />
                        )}

                        <Button type="submit" fullWidth variant="contained" color="primary" disabled={isLoading} sx={{ mt: 3, mb: 2 }}>
                            {isLoading ? 'Submitting...' : 'Request Account'}
                        </Button>
                    </Box>
                </Paper>
                <Dialog
                    open={openSuccessDialog}
                    onClose={handleCloseSuccessDialog}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"Success"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Your request has been submitted. You will receive your credentials via
                            email once your request has been approved.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseSuccessDialog} >
                            OK
                        </Button>
                        <Button onClick={handleNewApplication} color="primary" autoFocus>
                            Submit Another Form
                        </Button>
                    </DialogActions>
                </Dialog>
                <ToastContainer position="top-center" />
            </Box>
        </ThemeProvider>
    );
}

export default SignupPage;