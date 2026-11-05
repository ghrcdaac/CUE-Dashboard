import React, { useEffect } from 'react';
import { Link as RouterLink, useOutletContext } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import usePrivileges from '../hooks/usePrivileges';
import usePageTitle from '../hooks/usePageTitle';

/** Shown instead of a page the user doesn't have the privilege for. */
export function NoAccess() {
    usePageTitle('No access');
    const outlet = useOutletContext();
    const setMenuItems = outlet?.setMenuItems;
    useEffect(() => {
        if (!setMenuItems) return undefined;
        setMenuItems([]);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    return (
        <Card>
            <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        You don't have access to this page
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Your role doesn't include this page. If you need it, ask your DAAC administrator.
                    </Typography>
                    <Button variant="contained" component={RouterLink} to="/">
                        Go to Home
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}

/** Renders its children only when the user has `privilege`; otherwise the NoAccess view. */
export default function RequirePrivilege({ privilege, children }) {
    const { hasPrivilege } = usePrivileges();
    return hasPrivilege(privilege) ? children : <NoAccess />;
}
