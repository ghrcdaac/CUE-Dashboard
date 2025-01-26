import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import Header from "./components/Header";
import SideNav from "./components/SideNav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import Providers from "./pages/Providers";
import Metrics from "./pages/Metrics";
import Users from "./pages/Users";
import DAAC from "./pages/DAAC";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#19577F", // #19577F
    },
    secondary: {
      main: "#f0f0f0",
    },
  },
});

function App() {
  const [selectedMenu, setSelectedMenu] = useState("Overview");

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <SideNav selectedMenu={selectedMenu} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Header
                selectedMenu={selectedMenu}
                onMenuClick={handleMenuClick}
              />
              <Routes>
                <Route
                  path="/"
                  element={<Home setSelectedMenu={() => handleMenuClick("Overview")} />}
                />
                <Route
                  path="/collections"
                  element={<Collections setSelectedMenu={() => handleMenuClick("Collections")} />}
                />
                <Route
                  path="/providers"
                  element={<Providers setSelectedMenu={() => handleMenuClick("Providers")} />}
                />
                <Route
                  path="/metrics"
                  element={<Metrics setSelectedMenu={() => handleMenuClick("Metrics")} />}
                />
                <Route
                  path="/users"
                  element={<Users setSelectedMenu={() => handleMenuClick("Users")} />}
                />
                <Route
                  path="/daac"
                  element={<DAAC setSelectedMenu={() => handleMenuClick("DAAC")} />}
                />
              </Routes>
              <Footer />
            </div>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;