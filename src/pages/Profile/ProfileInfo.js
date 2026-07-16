// src/pages/Profile/ProfileInfo.js

import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import useAuth from '../../hooks/useAuth';

// Helper function to create initials from a name
const getInitials = (name = '') => {
  const parts = name.split(' ');
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper to format date in local time
const formatLocalDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
};

function ProfileInfo() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading user profile...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{ bgcolor: 'primary.main', width: 80, height: 80, fontSize: '2.5rem' }}
            >
              {getInitials(user.name)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" component="h1">{user.name}</Typography>
            <Typography color="text.secondary">-- {user.cueusername}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
            <Box>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography>{user.name || 'N/A'}</Typography>
            </Box>
            <Box>
                <Typography variant="subtitle2" color="text.secondary">Email Address</Typography>
                <Typography>{user.email || 'N/A'}</Typography>
            </Box>
            <Box>
                <Typography variant="subtitle2" color="text.secondary">Registered On</Typography>
                {/* Use user.registered for the timestamp */}
                <Typography>{formatLocalDate(user.registered)}</Typography>
            </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Box>
          <Typography variant="h6" gutterBottom>
            Assigned Roles
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Chip
                  key={role}
                  label={role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  variant="outlined"
                  color="primary"
                />
              ))
            ) : (
              <Typography color="text.secondary">No roles assigned.</Typography>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />
        <Box>
          <Typography variant="h6" gutterBottom>
            Associated DAACs
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {user.ngroups && user.ngroups.length > 0 ? (
              user.ngroups.map((ngroup) => (
                <Chip
                  key={ngroup.id}
                  // Use ngroup.short_name for the label
                  label={ngroup.short_name}
                  variant="outlined"
                />
              ))
            ) : (
              <Typography color="text.secondary">Not associated with any DAACs.</Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ProfileInfo;