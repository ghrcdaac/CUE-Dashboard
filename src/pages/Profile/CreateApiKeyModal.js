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
import { parseApiError } from '../../utils/errorUtils'; // Added for better error messages

export default function CreateApiKeyModal({ open, onClose, onKeyCreated }) {
  const [keyName, setKeyName] = useState('');
  const [ownerType, setOwnerType] = useState('self');
  const [selectedUser, setSelectedUser] = useState(null);
  const [proxyUserName, setProxyUserName] = useState('');
  const [expirationType, setExpirationType] = useState('5');
  const [customExpirationDate, setCustomExpirationDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [newKey, setNewKey] = useState(null);
  
  const { hasPrivilege } = usePrivileges();
  const { user, activeNgroupId } = useAuth(); 

  // --- NEW: Calculate the maximum selectable date for the custom option ---
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

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
    setExpirationType('5');
    setCustomExpirationDate(null);
    setNewKey(null);
    onClose();
  };

  const handleSubmit = async () => {
    // Basic validation is handled by the disabled button, but this is a final check.
    if (!keyName.trim()) {
        toast.error("A key name is required.");
        return;
    }

    const payload = {
      name: keyName.trim(),
      scopes: ["file:upload"]
    };

    if (ownerType === 'self') {
      payload.target_user_id = user.id;
    } else if (ownerType === 'user') {
      payload.target_user_id = selectedUser.id;
    } else if (ownerType === 'proxy') {
      payload.proxy_user_name = proxyUserName.trim();
      payload.ngroup_id = activeNgroupId;
    }
    
    // --- UPDATED: This logic correctly sends either expires_at OR expires_in_days ---
    if (expirationType === 'custom') {
      if (!customExpirationDate) {
        toast.error("Please select a custom expiration date.");
        return;
      }
      payload.expires_at = customExpirationDate.toISOString();
    } else {
      payload.expires_in_days = parseInt(expirationType, 10);
    }

    setIsSubmitting(true);
    try {
      const result = await createApiKey(payload);
      setNewKey(result.key);
      onKeyCreated();
    } catch (error) {
      toast.error(parseApiError(error));
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
            <FormControlLabel value="5" control={<Radio />} label="5 Days" />
            <FormControlLabel value="10" control={<Radio />} label="10 Days" />
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
                // --- NEW: Add the maxDate prop to limit selection ---
                maxDate={maxDate}
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
        <Button onClick={handleSubmit} variant="contained" disabled={isFormInvalid || isSubmitting}>
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