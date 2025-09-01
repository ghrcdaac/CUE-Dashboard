// src/pages/Profile/CreateApiKeyModal.js

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup,
  FormControlLabel, Radio, FormControl, FormLabel, Checkbox, Box, Typography,
  CircularProgress, Autocomplete
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';

import useAuth from '../../hooks/useAuth';
import usePrivileges from '../../hooks/usePrivileges';
import { createApiKey } from '../../api/apiKeys';
import { listCueusers } from '../../api/cueUser';

// Helper for date calculation
const calculateDaysUntil = (futureDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  futureDate.setHours(0, 0, 0, 0);
  const diffTime = futureDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function CreateApiKeyModal({ open, onClose, onKeyCreated }) {
  // All state and functions remain the same
  const [keyName, setKeyName] = useState('');
  const [ownerType, setOwnerType] = useState('self');
  const [selectedUser, setSelectedUser] = useState(null);
  const [proxyUserName, setProxyUserName] = useState('');
  const [expirationType, setExpirationType] = useState('90');
  const [customExpirationDate, setCustomExpirationDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const { hasPrivilege } = usePrivileges();
  const { user, activeNgroupId } = useAuth(); 

  useEffect(() => {
    if (open && hasPrivilege('api-key:create')) {
      setIsUsersLoading(true);
      listCueusers()
        .then(data => setUsers(data))
        .catch(err => toast.error("Could not load user list."))
        .finally(() => setIsUsersLoading(false));
    }
  }, [open, hasPrivilege]);

  const handleClose = () => {
    if (isSubmitting) return;
    setKeyName('');
    setOwnerType('self');
    setSelectedUser(null);
    setProxyUserName('');
    setExpirationType('90');
    setCustomExpirationDate(null);
    setNewKey(null);
    onClose();
  };

  const handleSubmit = async () => {
    const payload = {
      name: keyName.trim(),
      scopes: ["file:upload"]
    };

    if (ownerType === 'self') {
      payload.target_user_id = user.id;
    } else if (ownerType === 'user') {
        if (!selectedUser) {
            toast.error("Please select a CUE user.");
            return;
        }
      payload.target_user_id = selectedUser.id;
    } else if (ownerType === 'proxy') {
        if (!proxyUserName.trim()) {
            toast.error("Proxy User Name is required.");
            return;
        }
      payload.proxy_user_name = proxyUserName.trim();
      payload.ngroup_id = activeNgroupId;
    }
    
    if (expirationType === 'custom') {
      if (!customExpirationDate) {
        toast.error("Please select a custom expiration date.");
        return;
      }
      const days = calculateDaysUntil(customExpirationDate);
      if (days <= 0) {
        toast.error("Custom date must be in the future.");
        return;
      }
      payload.expires_in_days = days;
    } else {
      payload.expires_in_days = parseInt(expirationType, 10);
    }

    setIsSubmitting(true);
    try {
      const result = await createApiKey(payload);
      setNewKey(result.key);
      onKeyCreated();
    } catch (error) {
      toast.error(`Failed to create key: ${error.response?.detail || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(newKey);
    toast.success("Key copied to clipboard!");
  };

  const isManager = hasPrivilege('api-key:create');

  const isFormInvalid =
    !keyName.trim() ||
    (ownerType === 'user' && !selectedUser) ||
    (ownerType === 'proxy' && !proxyUserName.trim()) ||
    (expirationType === 'custom' && !customExpirationDate);

  const renderForm = () => (
     <>
      <DialogTitle>Create New API Key</DialogTitle>
      <DialogContent dividers>
        <TextField autoFocus label="Key Name" fullWidth value={keyName} onChange={(e) => setKeyName(e.target.value)} sx={{ mb: 3 }} />
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Key Owner</FormLabel>
          <RadioGroup row value={ownerType} onChange={(e) => setOwnerType(e.target.value)}>
            <FormControlLabel value="self" control={<Radio />} label="My Account" />
            {isManager && <FormControlLabel value="user" control={<Radio />} label="Another CUE User" />}
            {isManager && <FormControlLabel value="proxy" control={<Radio />} label="An External (Proxy) User" />}
          </RadioGroup>
        </FormControl>

        {ownerType === 'user' && (
          <Autocomplete
            options={users}
            // --- THE FIX: Use 'cueusername' instead of 'username' ---
            getOptionLabel={(option) => `${option.name} (@${option.cueusername})`}
            loading={isUsersLoading}
            value={selectedUser}
            onChange={(event, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => <TextField {...params} label="Search for a user..." variant="outlined" />}
            sx={{ mb: 3 }}
          />
        )}
        
        {ownerType === 'proxy' && (
          <TextField label="Proxy User Name" fullWidth value={proxyUserName} onChange={(e) => setProxyUserName(e.target.value)} sx={{ mb: 3 }} />
        )}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Expiration</FormLabel>
          <RadioGroup row value={expirationType} onChange={(e) => setExpirationType(e.target.value)}>
            <FormControlLabel value="30" control={<Radio />} label="30 Days" />
            <FormControlLabel value="90" control={<Radio />} label="90 Days" />
            <FormControlLabel value="custom" control={<Radio />} label="Custom Date" />
          </RadioGroup>
        </FormControl>
        {expirationType === 'custom' && (
           <Box sx={{ mb: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiration Date"
                value={customExpirationDate}
                onChange={(newValue) => setCustomExpirationDate(newValue)}
                minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              />
            </LocalizationProvider>
          </Box>
        )}
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <FormLabel component="legend">Permissions</FormLabel>
          <FormControlLabel control={<Checkbox checked disabled />} label="File Upload (file:upload)" />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isFormInvalid || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "Create Key"}
        </Button>
      </DialogActions>
    </>
  );

  const renderSuccess = () => (
     <>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>API Key Created Successfully</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please copy this key and store it in a secure location.<br /><strong>For security reasons, you will not be able to see it again.</strong>
        </Typography>
        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', my: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1, wordBreak: 'break-all' }}>{newKey}</Typography>
          <Button startIcon={<ContentCopyIcon />} onClick={handleCopyToClipboard} sx={{ ml: 2 }}>Copy</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained">Close</Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      {newKey ? renderSuccess() : renderForm()}
    </Dialog>
  );
}