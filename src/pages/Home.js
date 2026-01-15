import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Alert,
    Container,
    CardActionArea,
    Divider,
    CircularProgress 
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// Icons for the cards
import CollectionsIcon from '@mui/icons-material/Collections';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import OutputIcon from '@mui/icons-material/Output';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import BugReportIcon from '@mui/icons-material/BugReport';
import StorageIcon from '@mui/icons-material/Storage';

import usePageTitle from "../hooks/usePageTitle";
import useAuth from '../hooks/useAuth';
import usePrivileges from '../hooks/usePrivileges';
import { parseApiError } from '../utils/errorUtils';

import * as fileMetricsApi from '../api/fileMetricsApi';
import { fetchCollections, fetchProviders, fetchEgresses, fetchUsers } from '../app/reducers/dataCacheSlice';


const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
  
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const StatCard = ({ title, value, icon, onClick, loading }) => (
    <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
            <CardActionArea onClick={onClick} sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {icon}
                    <Typography variant="h6" color="text.secondary">{title}</Typography>
                </Box>
                {loading ? (
                    <CircularProgress size={48} sx={{ my: 0.5 }} />
                ) : (
                    <Typography variant="h3" color="primary">{value}</Typography>
                )}
            </CardActionArea>
        </Card>
    </Grid>
);

const MetricCard = ({ title, value, icon, color = "inherit", loading }) => (
    <Grid item xs={12} sm={4}>
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ py: 2, px: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {icon}
                    <Typography variant="h6" color="text.secondary">{title}</Typography>
                </Box>
                {loading ? (
                    <Box sx={{ py: 4, display: 'flex', alignItems: 'center' }}>
                         <CircularProgress size={48} />
                    </Box>
                ) : (
                    <Typography  sx={{py:4}} variant="h3" color={color}>{value}</Typography>
                )}
            </CardContent>
        </Card>
    </Grid>
);

export default function Home() {
    usePageTitle("Home");
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { activeNgroupId } = useAuth();
    // Get the hasPrivilege function from the hook
    const { hasPrivilege } = usePrivileges();

    const { collections, providers, egresses, users } = useSelector((state) => state.dataCache);
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (activeNgroupId) {
            if (collections.status === 'idle') dispatch(fetchCollections());
            if (providers.status === 'idle') dispatch(fetchProviders());
            if (egresses.status === 'idle') dispatch(fetchEgresses());
            //Conditionally fetch users based on privilege
            if (users.status === 'idle' && hasPrivilege('user:page')) {
                dispatch(fetchUsers());
            }
        }
    }, [activeNgroupId, collections.status, providers.status, egresses.status, users.status, dispatch, hasPrivilege]);
    
    const fetchMetricsSummary = useCallback(async () => {
        if (!activeNgroupId) { setLoadingSummary(false); return; }
        setLoadingSummary(true);
        setError(null);
        try {
            const params = {
                start_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
                end_date: dayjs().format('YYYY-MM-DD'),
            };
            const summaryData = await fileMetricsApi.getMetricsSummary(params);
            setSummary(summaryData);
        } catch (err) {
            setError(parseApiError(err));
        } finally {
            setLoadingSummary(false);
        }
    }, [activeNgroupId]);

    useEffect(() => {
        fetchMetricsSummary();
    }, [fetchMetricsSummary]);

    const infectedCount = useMemo(() => {
        if (!summary?.status_counts) return 0;
        const infectedItem = summary.status_counts.find(item => item.status === 'infected');
        return infectedItem ? infectedItem.count : 0;
    }, [summary]);
    
    if (error) {
        return <Alert severity="error" sx={{ m: 3 }}>Failed to load dashboard data: {error}</Alert>;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
         <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>Cloud Upload Environment (CUE)</Typography>
            <Grid container spacing={3} justifyContent="center">
                <StatCard title="Collections" value={collections.data.length} onClick={() => navigate('/collections')} icon={<CollectionsIcon color="action" />} loading={collections.status === 'loading'} />
                <StatCard title="Providers" value={providers.data.length} onClick={() => navigate('/providers')} icon={<AccountBoxIcon color="action" />} loading={providers.status === 'loading'} />
                <StatCard title="Egress" value={egresses.data.length} onClick={() => navigate('/daac')} icon={<OutputIcon color="action" />} loading={egresses.status === 'loading'} />
                {/* The Users card is now only rendered if the user has the 'user:page' privilege. */}
                {hasPrivilege("user:page") && (
                    <StatCard title="Users" value={users.data.length} onClick={() => navigate('/users')} icon={<GroupIcon color="action" />} loading={users.status === 'loading'} />
                )}
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>Metrics Summary (Last 7 Days)</Typography>
            
            <Grid container justifyContent="center" sx={{ mb: 4 }}>
                <Grid item xs={12} lg={10}>
                    <Grid container spacing={3}>
                        <MetricCard title="Total Files" value={summary?.overall_count?.value?.toLocaleString() || 0} icon={<DescriptionIcon color="action" />} loading={loadingSummary} />
                        <MetricCard title="Infected Files" value={infectedCount.toLocaleString()} color={infectedCount > 0 ? "error.main" : "inherit"} icon={<BugReportIcon color="action" />} loading={loadingSummary} />
                        {/* The value uses the corrected formatBytes function with the 'overall_volume' in bytes. */}
                        <MetricCard title="Total Volume" value={formatBytes(summary?.overall_volume?.value) || '0 Bytes'} icon={<StorageIcon color="action" />} loading={loadingSummary} />
                    </Grid>
                </Grid>
            </Grid>
            <Divider sx={{ my: 4 }} />
        </Container>
    );
}