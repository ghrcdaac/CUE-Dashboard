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
import CreateCollection from "./pages/collections/CreateCollection";
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

function Layout() {
    // This component remains the same
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Header />
                <Outlet />
                <Footer />
            </div>
        </div>
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
            <BrowserRouter>
                <Routes>
                    {/* Protected Routes */}
                    <Route path="/" element={<Layout />}>
                        <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        
                        {/* --- CORRECTED NESTED ROUTES --- */}
                        <Route path="collections" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                            <Route index element={<Collections />} />
                            <Route path="create" element={<CreateCollection />} />
                        </Route>

                        <Route path="metrics" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                            <Route index element={<Metrics />} />
                            <Route path="files-by-status" element={<FilesByStatus />} />
                        </Route>

                        <Route path="users" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                            <Route index element={<Users />} />
                            <Route path="pending-requests" element={<PendingRequests />} />
                            <Route path="rejected-requests" element={<RejectedRequests />} />
                        </Route>
                        
                        <Route path="providers" element={<ProtectedRoute><Providers /></ProtectedRoute>} />
                        <Route path="daac" element={<ProtectedRoute><DAAC /></ProtectedRoute>} />
                        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
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
