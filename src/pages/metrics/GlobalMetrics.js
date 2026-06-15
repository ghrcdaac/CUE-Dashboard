import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  Skeleton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks, Components & Utils
import usePageTitle from '../../hooks/usePageTitle';
import useAuth from '../../hooks/useAuth';
import { parseApiError } from '../../utils/errorUtils';

// API Imports
import * as fileMetricsApi from '../../api/fileMetricsApi';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MoneyIcon from '@mui/icons-material/Money';
import PublicIcon from '@mui/icons-material/Public';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';

const DATE_FORMAT_API_DAYJS = 'YYYY-MM-DD';
const getDefaultStartDate = () => dayjs().subtract(7, 'month');
const getDefaultEndDate = () => dayjs();

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const DAAC_COLORS = [
  '#19577F',
  '#82ca9d',
  '#ffc658',
  '#8884d8',
  '#ff8042',
  '#a4de6c',
  '#d0ed57',
  '#8dd1e1',
];

function GlobalMetrics() {
  usePageTitle('Global Metrics');
  const navigate = useNavigate();
  const { setMenuItems } = useOutletContext();
  const { user } = useAuth();

  // Route protection - check ngroups of logged in user
  const hasGlobalAccess = useMemo(() => {
    return user?.ngroups?.some(
      (g) => g.id === '1675f412-7468-4cd4-adb0-20b08236079b' || g.id === '0259fb55-1146-4461-ade2-57504e0c3ace'
    );
  }, [user]);

  useEffect(() => {
    if (user && !hasGlobalAccess) {
      toast.error('Access denied: You do not have permission to view Global Metrics.');
      navigate('/metrics');
    }
  }, [user, hasGlobalAccess, navigate]);

  // Left Nav Menu Setup
  useEffect(() => {
    const metricsMenuItems = [
      { text: 'Overview', path: '/metrics', icon: <AssessmentIcon /> },
      { text: 'Files by Status', path: '/files-by-status', icon: <FilePresentIcon /> },
      { text: 'Cost', path: '/files-by-cost', icon: <MoneyIcon /> },
    ];
    if (hasGlobalAccess) {
      metricsMenuItems.push({ text: 'Global', path: '/global-metrics', icon: <PublicIcon /> });
    }
    setMenuItems(metricsMenuItems);
    return () => setMenuItems([]);
  }, [setMenuItems, hasGlobalAccess]);

  // Filter States
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [selectedNgroup, setSelectedNgroup] = useState('all');

  const [activeFilters, setActiveFilters] = useState({
    start_date: getDefaultStartDate().format(DATE_FORMAT_API_DAYJS),
    end_date: getDefaultEndDate().format(DATE_FORMAT_API_DAYJS),
    ngroup_id: '',
  });

  // Data States
  const [summaryData, setSummaryData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Dynamically populated list of ngroups for dropdown
  const [ngroupsList, setNgroupsList] = useState([]);

  // Fetch data callback
  const fetchData = useCallback(async (filters) => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const [summaryRes, historicalRes] = await Promise.all([
        fileMetricsApi.getGlobalMetricsSummary(filters),
        fileMetricsApi.getGlobalHistorical(filters),
      ]);
      setSummaryData(summaryRes);
      setHistoricalData(historicalRes || []);

      // Extract unique ngroups list if not set
      if (summaryRes?.by_ngroup) {
        const uniqueNgroups = summaryRes.by_ngroup.map((g) => ({
          id: g.ngroup_id,
          name: g.ngroup_name,
        }));
        setNgroupsList(uniqueNgroups);
      }
    } catch (err) {
      const msg = `Failed to load global metrics data: ${parseApiError(err)}`;
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Fetch on mount or when filters are applied
  useEffect(() => {
    if (hasGlobalAccess) {
      fetchData(activeFilters);
    }
  }, [fetchData, activeFilters, hasGlobalAccess]);

  const handleApplyFilters = () => {
    setActiveFilters({
      start_date: startDate ? startDate.format(DATE_FORMAT_API_DAYJS) : '',
      end_date: endDate ? endDate.format(DATE_FORMAT_API_DAYJS) : '',
      ngroup_id: selectedNgroup === 'all' ? '' : selectedNgroup,
    });
  };

  const handleClearFilters = () => {
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
    setSelectedNgroup('all');
    setActiveFilters({
      start_date: getDefaultStartDate().format(DATE_FORMAT_API_DAYJS),
      end_date: getDefaultEndDate().format(DATE_FORMAT_API_DAYJS),
      ngroup_id: '',
    });
  };

  // Recharts Data Mapping
  const uniqueDaacNames = useMemo(() => {
    if (!historicalData) return [];
    const names = new Set();
    historicalData.forEach((item) => {
      if (item.ngroup_name) {
        names.add(item.ngroup_name);
      }
    });
    return Array.from(names);
  }, [historicalData]);

  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];

    const monthlyGroups = {};
    historicalData.forEach((item) => {
      const monthKey = item.month; // "YYYY-MM"
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { month: monthKey, total_files: 0, total_volume: 0 };
      }
      // Set properties for dynamic drawing
      monthlyGroups[monthKey][item.ngroup_name] = item.distributed_file_count;
      monthlyGroups[monthKey][`${item.ngroup_name}_volume`] = item.total_size_bytes;

      monthlyGroups[monthKey].total_files += item.distributed_file_count;
      monthlyGroups[monthKey].total_volume += item.total_size_bytes;
    });

    return Object.values(monthlyGroups).sort((a, b) => a.month.localeCompare(b.month));
  }, [historicalData]);

  // Show loading skeleton
  if (!hasGlobalAccess) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} disableGutters>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ToastContainer position="top-center" autoClose={3000} />

        {/* Filter Panel at the top */}
        <Card sx={{ marginBottom: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Global Filters
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  maxDate={endDate}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate}
                  maxDate={dayjs()}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="daac-select-label">DAAC (ngroup)</InputLabel>
                  <Select
                    labelId="daac-select-label"
                    value={selectedNgroup}
                    label="DAAC (ngroup)"
                    onChange={(e) => setSelectedNgroup(e.target.value)}
                  >
                    <MenuItem value="all">All DAACs</MenuItem>
                    {ngroupsList.map((ngroup) => (
                      <MenuItem key={ngroup.id} value={ngroup.id}>
                        {ngroup.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container justifyContent="flex-end" spacing={2} sx={{ mt: 1 }}>
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                  disabled={loadingData}
                >
                  Clear Filters
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  startIcon={<FilterListIcon />}
                  disabled={loadingData}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Page Title */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5">Global Metrics Overview</Typography>
        </Box>

        {/* Loading / Error States */}
        {loadingData && (
          <Box>
            <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Skeleton variant="rounded" height={100} />
              </Grid>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Skeleton variant="rounded" height={100} />
              </Grid>
            </Grid>
            <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '100%', p: 1.5 }}>
                <Skeleton variant="rounded" height={300} />
              </Grid>
            </Grid>
            <Grid container sx={{ ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Skeleton variant="rounded" height={350} />
              </Grid>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Skeleton variant="rounded" height={350} />
              </Grid>
            </Grid>
          </Box>
        )}

        {errorMsg && !loadingData && (
          <Alert severity="warning" sx={{ my: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Content Section */}
        {!loadingData && !errorMsg && (
          <Box>
            {/* Counts & Volume Cards */}
            <Grid container sx={{ mb: 3, ml: -1.5, mr: -1.5 }}>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Total Distributed Files
                    </Typography>
                    <Typography variant="h4">
                      {summaryData?.total?.total_distributed_files?.toLocaleString() ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Total Distributed Volume
                    </Typography>
                    <Typography variant="h4">
                      {summaryData?.total?.total_size_bytes
                        ? formatBytes(summaryData.total.total_size_bytes)
                        : '0 Bytes'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* DAAC Contribution Table */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  DAAC Contribution Overview
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>DAAC Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Distributed Files
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Total Volume
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summaryData?.by_ngroup?.map((item) => (
                        <TableRow key={item.ngroup_id} hover>
                          <TableCell>{item.ngroup_name}</TableCell>
                          <TableCell align="right">
                            {item.total_distributed_files.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">{formatBytes(item.total_size_bytes)}</TableCell>
                        </TableRow>
                      ))}
                      {(!summaryData?.by_ngroup || summaryData.by_ngroup.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No DAAC breakdown data available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Historical Charts */}
            <Grid container sx={{ ml: -1.5, mr: -1.5 }}>
              {/* Chart 1: Files */}
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Monthly Distributed Files Trend
                    </Typography>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
                          <Legend />
                          {activeFilters.ngroup_id ? (
                            <Bar
                              dataKey={uniqueDaacNames[0] || 'total_files'}
                              fill="#19577F"
                              name={uniqueDaacNames[0] || 'Files'}
                            />
                          ) : (
                            uniqueDaacNames.map((name, index) => (
                              <Bar
                                key={name}
                                dataKey={name}
                                stackId="a"
                                fill={DAAC_COLORS[index % DAAC_COLORS.length]}
                                name={name}
                              />
                            ))
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No monthly historical count data.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Chart 2: Volume */}
              <Grid item sx={{ width: '50%', p: 1.5 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Monthly Distributed Volume Trend
                    </Typography>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(tick) => formatBytes(tick, 0)} />
                          <Tooltip formatter={(value, name) => [formatBytes(value), name]} />
                          <Legend />
                          {activeFilters.ngroup_id ? (
                            <Bar
                              dataKey={`${uniqueDaacNames[0]}_volume` || 'total_volume'}
                              fill="#82ca9d"
                              name={uniqueDaacNames[0] || 'Volume'}
                            />
                          ) : (
                            uniqueDaacNames.map((name, index) => (
                              <Bar
                                key={name}
                                dataKey={`${name}_volume`}
                                stackId="a"
                                fill={DAAC_COLORS[index % DAAC_COLORS.length]}
                                name={name}
                              />
                            ))
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No monthly historical volume data.
                      </Typography>
                    )}
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

export default GlobalMetrics;
