import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
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
import useAuth from "./hooks/useAuth";
import { useSelector } from 'react-redux';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CircularProgress, Box } from "@mui/material";

// --- NEW IMPORTS ---
import LoginPage from "./components/LoginPage"; // The new login page
import AuthCallback from './pages/AuthCallback'; // The new callback page
import PendingApproval from './pages/PendingApproval'; // A simple new page

import FilesByCost from './pages/metrics/FilesByCost';
import { Box } from '@mui/material';
import CollectionFileBrowser from "./pages/collections/CollectionFileBrowser";
import CollectionOverview from "./pages/collections/CollectionOverview";
import NotificationPreferences from "./pages/Profile/NotificationPreference";


const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
        secondary: {
            main: "#f0f0f0",
        },
    },
});
function SimpleLayout() {
    return (
        <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
            <Header />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
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
    const [sideNavOpen, setSideNavOpen] = useState(true);
    const [menuItems, setMenuItems] = useState([]);

    const handleToggleSideNav = () => {
        setSideNavOpen(!sideNavOpen);
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
            <Header />
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                <SideNav
                    menuItems={menuItems}
                    open={sideNavOpen}
                    onToggle={handleToggleSideNav}
                />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
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
        // The initializeAuth function now handles checking for a valid session
        initializeAuth();
    }, [initializeAuth]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </div>
        );
    }

    return (
        <ThemeProvider theme={theme}>

            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                 <Routes>
                    <Route element={<SimpleLayout />}>
                        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    </Route>
                    <Route element={<Layout />}>
                        <Route path="collections" element={<ProtectedRoute><Collections /></ProtectedRoute>}>

                            <Route index element={<Collections />} />
                            <Route path="create" element={<CollectionOverview />} />
                            <Route path="files" element={<CollectionFileBrowser />} />
                        </Route>

                        <Route path="providers" element={<ProtectedRoute><Providers /></ProtectedRoute>} />
                        <Route path="metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />
                        <Route path="files-by-status" element={<FilesByStatus />} />
                        <Route path="files-by-cost" element={<FilesByCost/>} />
                        <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>}>
                           <Route index element={<Users />} />
                            <Route path="pending-requests" element={<PendingRequests />} />
                            <Route path="rejected-requests" element={<RejectedRequests />} />
                        </Route>

                        <Route path="daac" element={<ProtectedRoute><DAAC /></ProtectedRoute>} />
                        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} >
                            <Route index element={<Navigate to="notification" replace />} />
                            <Route path="notification" element={<NotificationPreferences />} />
                        </Route>
                    </Route>

                    {/* Public Authentication Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/callback" element={<AuthCallback />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/pending-approval" element={<PendingApproval />} />

                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
