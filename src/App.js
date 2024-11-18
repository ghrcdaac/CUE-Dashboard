import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import Header from './components/Header';
import SideNav from './components/SideNav';
import Footer from './components/Footer';
import Home from './pages/Home';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#004d40',
    },
    secondary: {
      main: '#d7ccc8',
    },
  },
});

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header isDrawerOpen={isDrawerOpen} toggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)} />
            <SideNav isDrawerOpen={isDrawerOpen} toggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)} />
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;