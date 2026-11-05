// src/pages/SiteMap.js
// A second way to reach every page (WCAG 2.4.5 Multiple Ways), next to the header and side
// navigation. Lists only the pages the signed-in user can open, using the same privilege
// checks as the header links and side menus.
import React, { useEffect, useMemo } from 'react';
import { Link as RouterLink, useOutletContext } from 'react-router-dom';
import { Card, CardContent, Link, List, ListItem, Typography } from '@mui/material';
import usePrivileges from '../hooks/usePrivileges';
import useAuth from '../hooks/useAuth';
import usePageTitle from '../hooks/usePageTitle';

// DAACs whose members see Global Metrics (same rule as the Metrics side menu).
const GLOBAL_METRICS_NGROUPS = ['1675f412-7468-4cd4-adb0-20b08236079b', '0259fb55-1146-4461-ade2-57504e0c3ace'];

export default function SiteMap() {
    usePageTitle('Site map');
    const { hasPrivilege } = usePrivileges();
    const { user } = useAuth();
    const outlet = useOutletContext();
    const setMenuItems = outlet?.setMenuItems;

    useEffect(() => {
        if (!setMenuItems) return undefined;
        setMenuItems([]);
        return () => setMenuItems([]);
    }, [setMenuItems]);

    const sections = useMemo(() => {
        const showGlobal = user?.ngroups?.some((g) => GLOBAL_METRICS_NGROUPS.includes(g.id));
        return [
            { title: 'Home', links: [{ to: '/', text: 'Home' }] },
            hasPrivilege('collection:page') && { title: 'Collections', links: [{ to: '/collections', text: 'Collections list' }] },
            hasPrivilege('provider:read') && { title: 'Providers', links: [{ to: '/providers', text: 'Providers' }] },
            hasPrivilege('metrics:read') && {
                title: 'Metrics',
                links: [
                    { to: '/metrics', text: 'Metrics overview' },
                    { to: '/files-by-status', text: 'Files by status' },
                    { to: '/files-by-cost', text: 'Cost' },
                    showGlobal && { to: '/global-metrics', text: 'Global metrics' },
                ].filter(Boolean),
            },
            hasPrivilege('user:page') && {
                title: 'Users',
                links: [
                    { to: '/users', text: 'Users' },
                    { to: '/users/pending-requests', text: 'Pending user requests' },
                    { to: '/users/spam-requests', text: 'Spam user requests' },
                ],
            },
            hasPrivilege('egress:read') && { title: 'DAAC', links: [{ to: '/daac', text: 'Egress paths' }] },
            {
                title: 'Profile',
                links: [
                    { to: '/profile', text: 'Profile information' },
                    { to: '/profile/api-keys', text: 'API keys' },
                ],
            },
        ].filter(Boolean);
    }, [hasPrivilege, user]);

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                    Site map
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Every page you can open in the CUE Dashboard.
                </Typography>
                {sections.map((section) => (
                    <section key={section.title} aria-labelledby={`sitemap-${section.title}`}>
                        <Typography id={`sitemap-${section.title}`} variant="h6" component="h3" sx={{ mt: 2 }}>
                            {section.title}
                        </Typography>
                        <List dense disablePadding>
                            {section.links.map((l) => (
                                <ListItem key={l.to} disableGutters>
                                    <Link component={RouterLink} to={l.to}>
                                        {l.text}
                                    </Link>
                                </ListItem>
                            ))}
                        </List>
                    </section>
                ))}
            </CardContent>
        </Card>
    );
}
