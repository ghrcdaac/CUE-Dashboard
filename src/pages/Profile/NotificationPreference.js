// src/pages/NotificationPreferences.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  InputLabel,
  MenuItem,
  FormControl,
  Select
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { getUserPreferences, updateUserPreferences } from '../../api/PreferenceApi';
import { useNavigate } from 'react-router-dom';


function NotificationPreferences() {
  const { accessToken } = useAuth();
  const ngroupId = localStorage.getItem('CUE_ngroup_id');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({
    emailReports: false,
    emailInfectedFiles: false,
  });

  const [preference, setPreference] = useState('');

  const handleChange = (event) => {
    setPreference(event.target.value);
  };

  const navigate = useNavigate();


  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserPreferences(ngroupId, accessToken);
      setPrefs({
        emailReports: data.emailReports ?? false,
        emailInfectedFiles: data.emailInfectedFiles ?? false,
      });
      setPreference(data.reportFrequency || ''); // load frequency if available
    } catch (err) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, [ngroupId, accessToken]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Save preferences
  const handleSave = async () => {
    if (prefs.emailReports && !preference) {
        toast.error("Please select a frequency for Infected File Scan Report");
        return;
    }
    setSaving(true);
    try {
        await updateUserPreferences(ngroupId, { ...prefs, reportFrequency: preference }, accessToken);
        toast.success("Preferences saved"); 
    } catch (err) {
        toast.error("Failed to save preferences");
    } finally {
        setSaving(false);
    }
};

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 150px - 30px)' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Notification Preferences
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Email Reports Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, ml: 30 }}>
                    <Typography variant="subtitle1" sx={{ width: 400 }}>
                        Send Email Reports
                    </Typography>
                    <FormControlLabel
                        control={
                        <Checkbox
                            checked={prefs.emailReports}
                            onChange={(e) =>
                            setPrefs((prev) => ({
                                ...prev,
                                emailReports: e.target.checked,
                            }))
                            }
                        />
                        }
                        label=""  // we already show the label via Typography
                    />
                </Box>

                {/* Infected Scan Report Frequency */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, ml:30 }}>
                    <Typography variant="subtitle1" sx={{ width: 400 }}>
                        Infected File Scan Report Frequency
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="frequency-select-label">Frequency</InputLabel>
                        <Select
                        labelId="frequency-select-label"
                        id="frequency-select"
                        value={preference}
                        label="Frequency"
                        onChange={handleChange}
                        >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="biweekly">Biweekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                    </FormControl>
                </Box>


                {/* Save Button */}
                <Box sx={{ mt: 10, display: 'flex', gap: 3, justifyContent: 'left', ml: 50}}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Preferences"}
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => navigate('/')}
                    >
                        Cancel
                    </Button>
                </Box> 
                <ToastContainer position="top-center" />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default NotificationPreferences;
