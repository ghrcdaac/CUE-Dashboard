import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom"; // Import Navigate
import { Provider } from "react-redux";
import store from "./app/store";
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
import ConfirmForgotPassword from "./components/ConfirmForgotPassword"; // Import ConfirmForgotPassword
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useSelector } from 'react-redux';

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
            <SideNav selectedMenu={selectedMenu} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Header selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />
                {/* Pass setSelectedMenu to the Outlet via context*/}
                <Outlet context={{ setSelectedMenu }} />
                <Footer />
            </div>
        </div>
    );
}

function App() {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated); // Get authentication status
    const challengeName = useSelector((state) => state.auth.challengeName); // Get challenge name

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <BrowserRouter>
                    <Routes>
                        {/* Use the Layout component for all routes EXCEPT /login */}
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Home />} />
                            <Route path="collections" element={<Collections />} />
                            <Route path="providers" element={<Providers />} />
                            <Route path="metrics" element={<Metrics />} />
                            <Route path="users" element={<Users />} />
                            <Route path="daac" element={<DAAC />} />
                        </Route>
                        {/* LoginPage is OUTSIDE the Layout */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/change-password" element={challengeName === 'NEW_PASSWORD_REQUIRED' ? <ChangePassword /> : <Navigate to="/" />} />
                         <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/confirm-forgot-password" element={<ConfirmForgotPassword />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </Provider>
    );
}

export default App;