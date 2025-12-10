import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup,
  FormControlLabel, Radio, FormControl, FormLabel, Checkbox, Box, Typography,
  CircularProgress, Autocomplete, FormGroup // --- NEW: Import FormGroup for better layout
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
import { parseApiError } from '../../utils/errorUtils';

export default function CreateApiKeyModal({ open, onClose, onKeyCreated }) {
  const [keyName, setKeyName] = React.useState('');
  const [ownerType, setOwnerType] = React.useState('self');
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [proxyUserName, setProxyUserName] = React.useState('');
  const [expirationType, setExpirationType] = React.useState('5');
  const [customExpirationDate, setCustomExpirationDate] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState([]);
  const [isUsersLoading, setIsUsersLoading] = React.useState(false);
  const [newKey, setNewKey] = React.useState(null);
  const [usersPage, setUsersPage] = React.useState(1);
  const [usersPageSize] = React.useState(50);
  const [usersTotal, setUsersTotal] = React.useState(0);
  const [fetchedPages, setFetchedPages] = React.useState(new Set());
  const [keyNameError, setKeyNameError] = React.useState('');

  
  // --- NEW: State to manage scope checkboxes. Both are enabled by default. ---
  const [scopes, setScopes] = React.useState({
    'file:upload': true,
    'file:read': true,
  });

  const { user, hasPrivilege } = usePrivileges();
  const { activeNgroupId } = useAuth(); 

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  React.useEffect(() => {
    if (open && hasPrivilege('api-key:create')) {
      setIsUsersLoading(true);
      fetchUsersPage(usersPage);
    }
  }, [open, hasPrivilege]);

  const fetchUsersPage = async (pageNumber) => {
    if (fetchedPages.has(pageNumber) || isUsersLoading) return; // guard against duplicates
    setIsUsersLoading(true);
    
    try {
      const response = await listCueusers(pageNumber, usersPageSize);
      const data = response; // assuming axios
      
      setUsers(prev => [
        ...prev,
        ...data.users.filter(u => !prev.some(pu => pu.id === u.id))
      ]);
      setUsersTotal(data.total);
      setUsersPage(pageNumber);
      
      setFetchedPages(prev => new Set(prev).add(pageNumber)); // mark page as fetched
    } catch (err) {
      toast.error("Could not load user list.");
    } finally {
      setIsUsersLoading(false);
    }
  };



  const handleClose = () => {
    if (isSubmitting) return;
    setKeyName('');
    setOwnerType('self');
    setSelectedUser(null);
    setProxyUserName('');
    setExpirationType('5');
    setCustomExpirationDate(null);
    setNewKey(null);
    // --- Reset scopes state on close ---
    setScopes({ 'file:upload': true, 'file:read': true });
    onClose();
  };
  
  // --- NEW: Handler for changing scope checkboxes ---
  const handleScopeChange = (event) => {
    setScopes({
      ...scopes,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSubmit = async () => {
    if (!keyName.trim()) {
      toast.error("A key name is required.");
      return;
    }
    
    if (!activeNgroupId) {
      toast.error("An active DAAC must be selected to create a key.");
      return;
    }

    // --- MODIFIED: Build scopes array from state ---
    const selectedScopes = Object.entries(scopes)
      .filter(([key, value]) => value)
      .map(([key]) => key);

    // --- MODIFIED: Add validation for at least one scope ---
    if (selectedScopes.length === 0) {
      toast.error("At least one permission must be selected.");
      return;
    }

    const payload = {
      name: keyName.trim(),
      scopes: selectedScopes // Use the dynamically built array
    };

    if (ownerType === 'self') {
      payload.key_type = 'personal';
      payload.ngroup_id = activeNgroupId;
    } else if (ownerType === 'user') {
      payload.key_type = 'managed_user';
      payload.target_user_id = selectedUser.id;
      payload.ngroup_id = activeNgroupId;
    } else if (ownerType === 'proxy') {
      payload.key_type = 'proxy';
      payload.proxy_user_name = proxyUserName.trim();
      payload.ngroup_id = activeNgroupId;
    }
    
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

  // --- MODIFIED: Add scope validation to the disabled check ---
  const atLeastOneScopeSelected = Object.values(scopes).some(v => v);
  const isFormInvalid =
    !keyName.trim() ||
    keyName.trim().length < 3 ||
    !activeNgroupId ||
    (ownerType === 'user' && !selectedUser) ||
    (ownerType === 'proxy' && !proxyUserName.trim()) ||
    (expirationType === 'custom' && !customExpirationDate) ||
    !atLeastOneScopeSelected; // <-- New validation rule

  const renderForm = () => (
      <>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            label="Key Name"
            fullWidth
            value={keyName}
            onChange={(e) => {
              setKeyName(e.target.value);
              if (keyNameError) setKeyNameError(''); // clear error while typing
            }}
            onBlur={() => {
              if (keyName.trim().length > 0 && keyName.trim().length < 3) {
                setKeyNameError('The minimum characters required is 3');
              }
            }}
            error={!!keyNameError}
            helperText={keyNameError}
            sx={{ mb: 3 }}
          />

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
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              loading={isUsersLoading}
              value={users.find(u => u.id === selectedUser?.id) || null}
              onChange={(event, newValue) => setSelectedUser(newValue ? { id: newValue.id } : null)}
              renderInput={(params) => <TextField {...params} label="Search for a user..." variant="outlined" />}
              ListboxProps={{
                onScroll: (event) => {
                  const listboxNode = event.currentTarget;
                  const scrollTop = listboxNode.scrollTop;
                  const scrollHeight = listboxNode.scrollHeight;
                  const clientHeight = listboxNode.clientHeight;

                  // scroll down
                  if (scrollTop + clientHeight >= scrollHeight - 20 && users.length < usersTotal) {
                    fetchUsersPage(usersPage + 1);
                  }

                  // scroll up
                  if (scrollTop <= 20 && usersPage > 1) {
                    fetchUsersPage(usersPage - 1);
                  }
                }
              }}
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
                  maxDate={maxDate}
                />
              </LocalizationProvider>
            </Box>
          )}

          {/* --- MODIFIED: Permissions section is now interactive --- */}
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Permissions</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scopes['file:upload']}
                    onChange={handleScopeChange}
                    name="file:upload"
                  />
                }
                label="File Upload (file:upload)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scopes['file:read']}
                    onChange={handleScopeChange}
                    name="file:read"
                  />
                }
                label="File Read/List (file:read)"
              />
            </FormGroup>
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