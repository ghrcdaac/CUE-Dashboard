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
import { getUserNotification, createUserNotification, updateUserNotification } from '../../api/PreferenceApi';
import { useNavigate } from 'react-router-dom';

function NotificationPreferences() {
  const { accessToken } = useAuth();
  const ngroupId = localStorage.getItem('CUE_ngroup_id');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({
    emailReports: false
  });

  // preferences = { infected_file: { id: uuid, frequency: 'weekly' }, clean_file: {...} }
  const [preferences, setPreferences] = useState({});

  const navigate = useNavigate();

  // Fetch user preferences
  const [notificationIdList, setNotificationIdList] = useState([]);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserNotification(accessToken);

      if (Array.isArray(data) && data.length > 0) {
        // Store notification IDs for update
        setNotificationIdList(data.map(notif => ({
          id: notif.id,
          report_type: notif.report_type
        })));

        // Map fetched data into preferences state
        const prefMap = {};
        data.forEach(notif => {
          prefMap[notif.report_type] = notif.frequency || "none";
        });
        setPreferences(prefMap);
      } else {
        // No data → defaults
        setPreferences({
          infected_file: "none",
          // clean_file: "none",
          // failed_scan: "none"
        });
        setNotificationIdList([]);
      }
    } catch (err) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleChange = (event, reportType) => {
    const value = event.target.value; // This will be "weekly", "daily", etc.
    setPreferences((prev) => ({
      ...prev,
      [reportType]: value
    }));
  };


  // Save preferences
  const handleSave = async () => {
    // If emailReports is enabled, ensure no empty selections
    if (!prefs.emailReports) {
      //call disable notifications if needed

    }

    setSaving(true);
    try {
      // Create payload array from preferences object
      const payload = Object.entries(preferences)
        .filter(([_, freq]) => freq) // only selected
        .map(([type, freq]) => ({
          report_type: type,
          frequency: freq  // Already a plain string now
        }));

      if (!notificationIdList || notificationIdList.length === 0) {
        // No notifications exist → CREATE
        const data = await createUserNotification(payload, accessToken);
        if (Array.isArray(data) && data.length > 0) {
        // Store notification IDs for update
        setNotificationIdList(data.map(notif => ({
          id: notif.id,
          report_type: notif.report_type
        })));

        // Map fetched data into preferences state
        const prefMap = {};
        data.forEach(notif => {
          prefMap[notif.report_type] = notif.frequency || "none";
        });
        setPreferences(prefMap);
      }
      } else {
        // Notifications exist → UPDATE each by ID
        await Promise.all(
          notificationIdList.map((notif) => {
            const freq = preferences[notif.report_type];
            return updateUserNotification(notif.id, { 
              report_type: notif.report_type, 
              frequency: freq 
            }, accessToken);
          })
        );
      }

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
          <CardContent sx={{ width: '100%', maxWidth: 600 }}>
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
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mb: 3, gap: 2 }}>
                  <Typography variant="subtitle1">
                    Send Email Reports
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={prefs.emailReports}
                        onChange={(e) =>
                          setPrefs(prev => ({ ...prev, emailReports: e.target.checked }))
                        }
                      />
                    }
                    label=""
                  />
                </Box>

                {/* Infected File Report Frequency */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mb: 3, gap: 2 }}>
                  <Typography variant="subtitle1">
                    Infected File Scan Report Frequency
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={preferences.infected_file}
                      onChange={(e) => handleChange(e, 'infected_file')}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="biweekly">Biweekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Save Button */}
                <Box sx={{ mt: 5, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
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
