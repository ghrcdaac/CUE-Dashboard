// src/App.js

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SideNav from "./components/SideNav";
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import Providers from "./pages/Providers";
import Metrics from "./pages/Metrics";
import Users from "./pages/Users";
import DAAC from "./pages/DAAC";
import Profile from './pages/Profile';
import SignupPage from './components/SignupPage';
import PendingRequests from "./pages/users/PendingRequests";
import RejectedRequests from "./pages/users/RejectedRequests";
import FilesByStatus from './pages/metrics/FilesByStatus';

import ProtectedRoute from "./components/ProtectedRoute";
import RequirePrivilege from "./components/RequirePrivilege";
import { SkipLink } from "./components/a11y";
import { ToastContainer } from "react-toastify";
import "./utils/toastSetup";
import useAuth from "./hooks/useAuth";
import { useSelector } from 'react-redux';
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import { CircularProgress, Box } from "@mui/material";

import LoginPage from "./components/LoginPage";
import AuthCallback from './pages/AuthCallback';
import PendingApproval from './pages/PendingApproval';

import FilesByCost from './pages/metrics/FilesByCost';
import GlobalMetrics from './pages/metrics/GlobalMetrics';
import CollectionFileBrowser from "./pages/collections/CollectionFileBrowser";
import CollectionOverview from "./pages/collections/CollectionOverview";

import ProfileInfo from "./pages/Profile/ProfileInfo";
import ApiKeys from "./pages/Profile/ApiKeys";

function SimpleLayout() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', height: { xs: 'auto', md: '100vh' } }}>
            <SkipLink />
            <Header />
            <Box
                component="main"
                id="main-content"
                tabIndex={-1}
                sx={{
                    flexGrow: 1,
                    overflowY: { xs: 'visible', md: 'auto' },
                    p: 3,
                    backgroundColor: '#f4f6f8',
                }}
            >
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
}


function Layout() {
    // Starts collapsed on narrow screens / high zoom so content has room to reflow (WCAG 1.4.10).
    const [sideNavOpen, setSideNavOpen] = useState(
        () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(min-width: 900px)').matches
    );
    const [menuItems, setMenuItems] = useState([]);

    const handleToggleSideNav = () => {
        setSideNavOpen(!sideNavOpen);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', height: { xs: 'auto', md: '100vh' } }}>
            <SkipLink />
            <Header />
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: { xs: 'visible', md: 'hidden' } }}>
                <SideNav
                    menuItems={menuItems}
                    open={sideNavOpen}
                    onToggle={handleToggleSideNav}
                />
                <Box
                    component="main"
                    id="main-content"
                    tabIndex={-1}
                    sx={{
                        outline: 'none',
                        // UPDATED: This is the definitive fix for the content area
                        flex: 1,
                        minWidth: 0, // A flexbox failsafe to allow shrinking
                        overflowY: { xs: 'visible', md: 'auto' },
                        p: 3,
                        backgroundColor: '#f4f6f8',
                    }}
                >
                    <Outlet context={{ setMenuItems }} />
                </Box>
            </Box>
            <Footer />
        </Box>

    );
}

function App() {
    const { isLoading } = useSelector((state) => state.auth);
    const { initializeAuth } = useAuth();

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress aria-label="Loading CUE Dashboard" />
            </div>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <ToastContainer position="top-center" />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                 <Routes>
                    {/* Signed-in area: ProtectedRoute guards each layout once, so no page can be left out.
                        RequirePrivilege matches the privilege that shows the page's link in the Header. */}
                    <Route element={<ProtectedRoute><SimpleLayout /></ProtectedRoute>}>
                        <Route path="/" element={<Home />} />
                    </Route>
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="collections" element={<RequirePrivilege privilege="collection:page"><Collections /></RequirePrivilege>}>
                            <Route index element={<Collections />} />
                            <Route path="create" element={<CollectionOverview />} />
                            <Route path="files" element={<CollectionFileBrowser />} />
                        </Route>

                        <Route path="providers" element={<RequirePrivilege privilege="provider:read"><Providers /></RequirePrivilege>} />
                        <Route path="metrics" element={<RequirePrivilege privilege="metrics:read"><Metrics /></RequirePrivilege>} />
                        <Route path="files-by-status" element={<RequirePrivilege privilege="metrics:read"><FilesByStatus /></RequirePrivilege>} />
                        <Route path="files-by-cost" element={<RequirePrivilege privilege="metrics:read"><FilesByCost /></RequirePrivilege>} />
                        <Route path="global-metrics" element={<RequirePrivilege privilege="metrics:read"><GlobalMetrics /></RequirePrivilege>} />
                        <Route path="users" element={<RequirePrivilege privilege="user:page"><Users /></RequirePrivilege>}>
                           <Route index element={<Users />} />
                            <Route path="pending-requests" element={<PendingRequests />} />
                            <Route path="spam-requests" element={<RejectedRequests />} />
                        </Route>

                        <Route path="daac" element={<RequirePrivilege privilege="egress:read"><DAAC /></RequirePrivilege>} />

                        <Route path="profile" element={<Profile />} >
                            <Route index element={<ProfileInfo />} />
                            <Route path="api-keys" element={<ApiKeys />} />
                        </Route>
                    </Route>

                    {/* Public Authentication Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/callback" element={<AuthCallback />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/pending-approval" element={<PendingApproval />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                 </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;