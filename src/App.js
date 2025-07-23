// App.js (Corrected)
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Header from "./components/Header";
import SideNav from "./components/SideNav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import Providers from "./pages/Providers";
import Metrics from "./pages/Metrics";
import Users from "./pages/Users";
import DAAC from "./pages/DAAC";
import LoginPage from "./components/LoginPage";
import ChangePassword from "./components/ChangePassword";
import ForgotPassword from "./components/ForgotPassword";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch
import Profile from './pages/Profile';
import useAuth from "./hooks/useAuth";
import { logoutSuccess } from './app/reducers/authSlice'; // Import logoutSuccess
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from './components/SignupPage';
import PendingRequests from "./pages/users/PendingRequests";
import RejectedRequests from "./pages/users/RejectedRequests";
import { CircularProgress } from "@mui/material";
import FilesByStatus from './pages/metrics/FilesByStatus';
import FilesByCost from './pages/metrics/FilesByCost';
import { Box } from '@mui/material';
import CollectionFileBrowser from "./pages/collections/CollectionFileBrowser";

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

function AppLayout() {
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
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const challengeName = useSelector((state) => state.auth.challengeName);
    const isLoading = useSelector((state) => state.auth.isLoading); // Get loading state
    const { initializeAuth } = useAuth();
    const dispatch = useDispatch(); // Get dispatch


    useEffect(() => {
      const checkAuthentication = async () => {
          const storedUsername = localStorage.getItem('CUE_username');
          const storedRefreshToken = localStorage.getItem('CUE_refreshToken');

          if (!storedUsername || !storedRefreshToken) {
            // If no user is logged in, set auth state to false.
            dispatch(logoutSuccess());
        }
            initializeAuth();

      };
        checkAuthentication();
    }, [initializeAuth, dispatch]); //  dispatch in the dependency array


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
                        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    </Route>
                    <Route element={<AppLayout />}>
                        <Route path="collections" element={<ProtectedRoute><Collections /></ProtectedRoute>}>
                           <Route index element={<Collections />} />
                           <Route path="create" element={<CollectionFileBrowser />} />
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
                    </Route>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/change-password" element={challengeName === 'NEW_PASSWORD_REQUIRED' ? <ChangePassword /> : <Navigate to="/login" />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/signup" element={<SignupPage />} />

                    { <Route path="*" element={<Navigate to="/" replace />} /> }
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;