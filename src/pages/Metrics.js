import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Skeleton,
  Container,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useOutletContext } from 'react-router-dom';

// Hooks & Components
import useAuth from '../hooks/useAuth';
import usePageTitle from '../hooks/usePageTitle';
import sessionService from '../services/sessionService';
import MetricsFilter from './metrics/MetricsFilter';
import ExportMenu from './reports/ExportMenu';
import { generateMetricsReport } from './reports/PdfReport';

// API Imports
import * as fileMetricsApi from '../api/fileMetricsApi';
import { parseApiError } from '../utils/errorUtils';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';

const DATE_FORMAT_API_DAYJS = 'YYYY-MM-DD';
const getDefaultStartDate = () => dayjs().subtract(7, 'day');
const getDefaultEndDate = () => dayjs();


/**
 * Converts a file size in bytes to a human-readable string (e.g., KB, MB, GB).
 * @param {number} bytes - The file size in bytes.
 * @param {number} [decimals=2] - The number of decimal places to display.
 * @returns {string} A formatted file size string.
 */
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};


const statusColors = {
  uploading: '#bbdefb', // light blue
  unscanned: '#fff9c4', // light yellow
  clean: '#c8e6c9', // light green
  distributed: '#c8e6c9', // light green
  infected: '#ffcdd2', // light red
  scan_failed: '#ffecb3', // light orange/amber
  default: '#f5f5f5', // default grey
};
const getStatusColor = (status) =>
  statusColors[status?.toLowerCase()] || statusColors.default;

function Metrics() {
  usePageTitle('Metrics Overview');
  const { user: currentUser } = useAuth();
  const ngroupId = useMemo(
    () => sessionService.getSession()?.active_ngroup_id || null,
    [],
  );

  const [activeFilters, setActiveFilters] = useState({
    start_date: getDefaultStartDate().format(DATE_FORMAT_API_DAYJS),
    end_date: getDefaultEndDate().format(DATE_FORMAT_API_DAYJS),
  });
  const [dailyVolumeData, setDailyVolumeData] = useState([]);
  const [dailyCountData, setDailyCountData] = useState([]);
  const [statusCountsData, setStatusCountsData] = useState([]);
  const [overallVolumeData, setOverallVolumeData] = useState(null);
  const [overallCountData, setOverallCountData] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState(null);

  const { setMenuItems } = useOutletContext();
  useEffect(() => {
    const metricsMenuItems = [
      { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
      { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
      { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> },
    ];
    setMenuItems(metricsMenuItems);
    return () => setMenuItems([]);
  }, [setMenuItems]);

  const fetchMetrics = useCallback(
    async (filtersToUse) => {
      if (!ngroupId) {
        setLoadingMetrics(false);
        setErrorMetrics('Cannot fetch metrics. No NGROUP ID found.');
        return;
      }
      setLoadingMetrics(true);
      setErrorMetrics(null);
      
      try {
        const summaryData = await fileMetricsApi.getMetricsSummary(filtersToUse);
        if (summaryData) {
          setDailyVolumeData(summaryData.daily_volume || []);
          setDailyCountData(summaryData.daily_count || []);
          setStatusCountsData(summaryData.status_counts || []);
          setOverallCountData(summaryData.overall_count ? { total_count: summaryData.overall_count.value } : null);
          // MODIFICATION: Switched from 'total_volume_gb' to 'total_volume_bytes' to match the new API response.
          setOverallVolumeData(summaryData.overall_volume ? { total_volume_bytes: summaryData.overall_volume.value } : null);
        }
      } catch (error) {
        const message = `Failed to load metrics: ${parseApiError(error)}`;
        setErrorMetrics(message);
        toast.error(message);
      } finally {
        setLoadingMetrics(false);
      }
    },
    [ngroupId],
  );

  useEffect(() => {
    fetchMetrics(activeFilters);
  }, [fetchMetrics, activeFilters]); // MODIFICATION: Added activeFilters to dependency array for correctness.

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    // fetchMetrics is now called by the useEffect above when activeFilters changes.
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      start_date: getDefaultStartDate().format(DATE_FORMAT_API_DAYJS),
      end_date: getDefaultEndDate().format(DATE_FORMAT_API_DAYJS),
    };
    setActiveFilters(defaultFilters);
    // fetchMetrics is now called by the useEffect above when activeFilters changes.
  };

  const handleExport = (format) => {
    if (format !== 'pdf') return;
    const summaryData = {
        // MODIFICATION: Updated to use the new 'total_volume_bytes' state property.
        "Total Volume": overallVolumeData ? formatBytes(overallVolumeData.total_volume_bytes) : 'N/A',
        "Total Files": overallCountData ? overallCountData.total_count.toLocaleString() : 'N/A',
    };
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const userInfo = {
        name: currentUser?.name || '',
        start: activeFilters?.start_date || sevenDaysAgo.toISOString().split('T')[0],
        end: activeFilters?.end_date || now.toISOString().split('T')[0]
    };
    generateMetricsReport(summaryData,statusCountsData,dailyVolumeData,dailyCountData, userInfo);
  };

  // MODIFICATION: Updated chart formatters to use the new formatBytes function.
  const volumeTooltipFormatter = (value) => [formatBytes(value), 'Volume'];
  const yAxisVolumeFormatter = (tick) => formatBytes(tick);
  const countTooltipFormatter = (value) => [value.toLocaleString(), 'Files'];

  return (
    <Container maxWidth={false} disableGutters>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ToastContainer position="top-center" autoClose={3000} />
        <MetricsFilter
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          isDataLoading={loadingMetrics}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Metrics Overview</Typography>
            <ExportMenu onExport={handleExport} />
        </Box>

        {loadingMetrics && (
          <Box>
            <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '33.333%', p: 1.5 }}><Skeleton variant="rounded" height={100} /></Grid>
              <Grid item sx={{ width: '33.333%', p: 1.5 }}><Skeleton variant="rounded" height={100} /></Grid>
              <Grid item sx={{ width: '33.333%', p: 1.5 }}><Skeleton variant="rounded" height={100} /></Grid>
            </Grid>
            <Grid container sx={{ ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '50%', p: 1.5 }}><Skeleton variant="rounded" height={350} /></Grid>
              <Grid item sx={{ width: '50%', p: 1.5 }}><Skeleton variant="rounded" height={350} /></Grid>
            </Grid>
          </Box>
        )}
        {errorMetrics && !loadingMetrics && (
          <Alert severity="warning" sx={{ my: 2 }}>{errorMetrics}</Alert>
        )}

        {!loadingMetrics && !errorMetrics && (
          <Box>
            <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '33.333%', p: 1.5 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Total Volume</Typography>
                    {/* MODIFICATION: Updated to use 'total_volume_bytes' from state. */}
                    <Typography variant="h4">{overallVolumeData ? formatBytes(overallVolumeData.total_volume_bytes) : 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item sx={{ width: '33.333%', p: 1.5 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Total Files</Typography>
                    <Typography variant="h4">{overallCountData ? overallCountData.total_count.toLocaleString() : 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item sx={{ width: '33.333%', p: 1.5 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Status Distribution</Typography>
                    {statusCountsData && statusCountsData.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', minHeight: 50 }}>
                        {statusCountsData.map((item) => (
                          <Chip key={item.status} label={`${item.status}: ${item.count.toLocaleString()}`} sx={{ backgroundColor: getStatusColor(item.status), fontWeight: 500, fontSize: '1rem', padding: '6px 0' }}/>
                        ))}
                      </Box>
                    ) : ( <Typography variant="body2" color="text.secondary">No status data.</Typography> )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container sx={{ ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Card>
                  <CardContent>
                    {/* MODIFICATION: Changed static title from "(GB)" to a more general "Daily Volume". */}
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Daily Volume</Typography>
                    {dailyVolumeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        {/* MODIFICATION: Added y-axis tick formatter and updated tooltip and line name. */}
                        <LineChart data={dailyVolumeData} margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis tickFormatter={yAxisVolumeFormatter} />
                          <Tooltip formatter={volumeTooltipFormatter} />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#8884d8" name="Volume" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : ( <Typography variant="body2" color="text.secondary">No daily volume data.</Typography> )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Daily File Count</Typography>
                    {dailyCountData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyCountData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip formatter={countTooltipFormatter} />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Files" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : ( <Typography variant="body2" color="text.secondary">No daily file count data.</Typography> )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </LocalizationProvider>
    </Container>
  );
}

export default Metrics;