import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import History from './pages/History';
import MemberHistory from './pages/MemberHistory';

function App() {
  const auth = useSelector((state) => state.auth);
  const { user, isLoading } = auth || { user: null, isLoading: false };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/members" element={user ? <Members /> : <Navigate to="/login" />} />
            <Route path="/loans" element={user ? <Loans /> : <Navigate to="/login" />} />
            <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
            <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
            <Route path="/member-history/:memberId" element={user ? <MemberHistory /> : <Navigate to="/login" />} />
          </Route>

          {/* Redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
