import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
//import { Provider } from "react-redux"; // REMOVE THIS
import { store } from "./app/store";  //KEEP THIS
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
import ChangePassword from "./components/ChangePassword"; // Import ChangePassword
import ForgotPassword from "./components/ForgotPassword";     // Import ForgotPassword
//import ConfirmForgotPassword from "./components/ConfirmForgotPassword"; // Import ConfirmForgotPassword
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useSelector } from 'react-redux'; // Import useSelector
import Profile from './pages/Profile'; // Import
import useAuth from "./hooks/useAuth"; // Import the useAuth hook
//import { useNavigate } from 'react-router-dom'; // Import useNavigate --Removed
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from './components/SignupPage';
import CreateCollection from "./pages/collections/CreateCollection"; // Import
import PendingRequests from "./pages/users/PendingRequests"; // Import
import RejectedRequests from "./pages/users/RejectedRequests";


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

// Create a Layout component
function Layout() {
    const [selectedMenu, setSelectedMenu] = useState("Overview");

    const handleMenuClick = (menu) => {
        setSelectedMenu(menu);
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* <SideNav selectedMenu={selectedMenu} /> */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Header  />
                
                <Outlet/>
                <Footer />
            </div>
        </div>
    );
}

function App() {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated); // Get authentication status
    const challengeName = useSelector((state) => state.auth.challengeName); // Get challenge name
    const isLoading = useSelector((state) => state.auth.isLoading);
     const { initializeAuth } = useAuth(); // Get initializeAuth
    //const navigate = useNavigate(); // Get navigate in component --Removed

    // Call initializeAuth *once* on app load
    useEffect(() => {
         initializeAuth(); // remove navigate
    }, [initializeAuth]);

    if (isLoading) {
      return <div>Loading...</div>; // wait for the page to load
  }

  return (
   <ThemeProvider theme={theme}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Use the Layout component for all routes EXCEPT /login */}
            <Route path="/" element={<Layout />}>
              <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="collections" element={<ProtectedRoute><Collections /></ProtectedRoute>}>
                            <Route index element={<Collections />} />  {/*  use collections for index*/}
                            <Route path="create" element={<CreateCollection />} />

                        </Route>


              <Route path="providers" element={<ProtectedRoute><Providers /></ProtectedRoute>} />
              <Route path="metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />

              <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>}>
                            <Route index element={<Users/>} /> {/*  New component */}
                            <Route path="pending-requests" element={<PendingRequests />} />
                            <Route path="rejected-requests" element={<RejectedRequests />} />
                        </Route>
              <Route path="daac" element={<ProtectedRoute><DAAC /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>
            {/* LoginPage is OUTSIDE the Layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/change-password" element={challengeName === 'NEW_PASSWORD_REQUIRED' ? <ChangePassword /> : <Navigate to="/login" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* { <Route path="*" element={ <Navigate to="/" replace />} /> } */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
  );
}

export default App;