import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import useAuth from '../hooks/useAuth';
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
import { FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material'; // Added Grid


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
        provider_id: null,  // Initially null
    });
    const [ngroupOptions, setNgroupOptions] = useState([]);
    const [providerOptions, setProviderOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false); // For the success dialog
    const [isFormExpanded, setIsFormExpanded] = useState(false);

      useEffect(() => {
        setIsFormExpanded(true);
      }, []);
    const { accessToken } = useAuth();
    const navigate = useNavigate();

     const fetchNgroupOptions = async () => {
        try {
            const groups = await getNgroups(accessToken); //Pass token
            setNgroupOptions(groups);

        } catch (error) {
            console.error("Error fetching ngroup options:", error);
            toast.error(`Error fetching ngroup options: ${error.message}`); // Show error
        }
    };

    // Fetch NGroups
    useEffect(() => {
       fetchNgroupOptions();
    }, [accessToken]);

    // Fetch Providers (only when ngroup_id is selected and account_type is provider)
     useEffect(() => {
        const fetchProviders = async () => {
            if (formData.account_type === 'provider' && formData.ngroup_id) {
                try {
                    const providersData = await getProvidersForNgroup(formData.ngroup_id, accessToken); //Pass token
                    setProviderOptions(providersData);

                } catch (error) {
                    console.error('Error fetching providers:', error);
                    toast.error("Failed to fetch providers: " + error.message);
                    setProviderOptions([]); // Reset on error, good practice
                }
            } else {
                setProviderOptions([]); // Clear providers if not provider or no ngroup
            }
        };
        fetchProviders();
    }, [formData.account_type, formData.ngroup_id, accessToken]);


  const handleChange = (e) => {
    const { name, value } = e.target;

    // Create a new formData object to ensure immutability
    const updatedFormData = { ...formData, [name]: value };

    // If account_type changes to 'daac', clear provider_id
    if (name === 'account_type' && value === 'daac') {
      updatedFormData.provider_id = null;
    }

    setFormData(updatedFormData);
    setErrors({ ...errors, [name]: '' });
  };

  // Handle Autocomplete changes for ngroup
  const handleNgroupChange = (event, newValue) => {
    const newNgroupId = newValue ? newValue.id : ''; // Get the ID, or empty string if null
    setFormData(prevFormData => ({
      ...prevFormData,
      ngroup_id: newNgroupId,
      provider_id: null, // Clear provider_id whenever ngroup changes
    }));
    setErrors(prevErrors => ({ ...prevErrors, ngroup_id: '' })); // Clear ngroup error
  };

  // Handle Autocomplete changes for provider
    const handleProviderChange = (event, newValue) => {
        const newProviderId = newValue ? newValue.id : null; // Get id, or null
        setFormData(prevFormData => ({
            ...prevFormData,
            provider_id: newProviderId
        }));
         setErrors(prevErrors => ({ ...prevErrors, provider_id: '' })); // Clear provider error
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
    navigate('/login'); // Navigate to login on "OK"
  };
  const handleNewApplication = () => {
        setOpenSuccessDialog(false);
        setFormData({
            name: '',
            email: '',
            username: '',
            justification: '',
            ngroup_id: '',
            account_type: 'daac',
            provider_id: null,
        });
        setErrors({}); // Clear errors
        setSubmissionError(''); // Clear any submission errors

        // Optionally, scroll to the top of the form
        window.scrollTo(0, 0);
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmissionError('');

        // Add "status": "pending" to the form data
        const applicationData = {
            ...formData,
            status: "pending"  // Add the status field
        };

    try {
      await createUserApplication(applicationData, accessToken);  //Pass token
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

            <Paper elevation={5} sx={{padding: 3, maxWidth: 600, width: '100%', overflowY: 'visible', }}  className={`auth-container ${isFormExpanded ? 'expanded' : ''}`}>
            <Typography component="h1" variant="h5"  sx={{color: theme.palette.primary.main, textAlign: 'center', marginBottom:'1rem'}}>
                    Cloud Upload Environment - New User 
                </Typography>
                {submissionError && <div className="error-message">{submissionError}</div>}
                <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField fullWidth label="Name" margin="normal" required name="name"
                        value={formData.name} onChange={handleChange}  error={!!errors.name}
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
                        }}/>
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
                        }}/>
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
                        }}/>
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
                            }}/>
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
                        }}/>

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
                        getOptionLabel={(option) => option.short_name || ''}  // Handle null/undefined
                        value={ngroupOptions.find(option => option.id === formData.ngroup_id) || null}
                        onChange={handleNgroupChange}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Ngroup"
                                name="ngroup_id"
                                margin="normal"
                                required
                                error={!!errors.ngroup_id}
                                helperText={errors.ngroup_id}
                                 InputLabelProps={{
                                    style: { color: theme.palette.primary.main },
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
                            getOptionLabel={(option) => option.short_name || ''} // Handle null/undefined
                            value={providerOptions.find(option => option.id === formData.provider_id) || null}
                            onChange={handleProviderChange}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
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