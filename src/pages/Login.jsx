import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../store/slices/authSlice';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import * as credentialService from '../services/credentialService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changeCredentialsOpen, setChangeCredentialsOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState({
    oldUsername: '',
    oldPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Initialize default credentials if needed
    credentialService.initializeCredentials();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await credentialService.verifyCredentials(username, password);
      if (isValid) {
        dispatch(setUser({
          id: 'admin',
          username: username,
          role: 'admin',
          name: 'Administrator'
        }));
        navigate('/');
      } else {
        setError('अवैध क्रेडेन्शियल्स');
      }
    } catch (error) {
      setError('लॉगिन करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCredentials = async () => {
    setError('');
    
    // Validate new credentials
    if (newCredentials.newPassword !== newCredentials.confirmPassword) {
      setError('नवीन पासवर्ड जुळत नाही');
      return;
    }

    if (newCredentials.newPassword.length < 6) {
      setError('पासवर्ड किमान 6 अक्षरे असावा');
      return;
    }

    setLoading(true);
    try {
      await credentialService.updateCredentials(
        newCredentials.oldUsername,
        newCredentials.oldPassword,
        newCredentials.newUsername,
        newCredentials.newPassword
      );
      
      setChangeCredentialsOpen(false);
      setError('');
      // Clear all credentials
      setNewCredentials({
        oldUsername: '',
        oldPassword: '',
        newUsername: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('क्रेडेन्शियल्स यशस्वीरित्या अपडेट केले');
    } catch (error) {
      setError(error.message || 'क्रेडेन्शियल्स अपडेट करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ 
            width: '100%', 
            textAlign: 'center', 
            mb: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            py: 3,
            px: 2,
            borderRadius: 2,
            color: 'white',
          }}>
            <Typography variant="h4" component="h1" gutterBottom>
              विशाल शेतकरी संघटना
            </Typography>
            <Typography variant="h6">
              कर्ज व्यवस्थापन प्रणाली
            </Typography>
          </Box>

          <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="वापरकर्ता नाव"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="पासवर्ड"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'लॉगिन करा'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                startIcon={<SettingsIcon />}
                onClick={() => setChangeCredentialsOpen(true)}
                disabled={loading}
              >
                क्रेडेन्शियल्स बदला
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Change Credentials Dialog */}
      <Dialog 
        open={changeCredentialsOpen} 
        onClose={() => setChangeCredentialsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>क्रेडेन्शियल्स बदला</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            label="वर्तमान वापरकर्ता नाव"
            value={newCredentials.oldUsername}
            onChange={(e) => setNewCredentials({
              ...newCredentials,
              oldUsername: e.target.value
            })}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="वर्तमान पासवर्ड"
            type="password"
            value={newCredentials.oldPassword}
            onChange={(e) => setNewCredentials({
              ...newCredentials,
              oldPassword: e.target.value
            })}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="नवीन वापरकर्ता नाव"
            value={newCredentials.newUsername}
            onChange={(e) => setNewCredentials({
              ...newCredentials,
              newUsername: e.target.value
            })}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="नवीन पासवर्ड"
            type="password"
            value={newCredentials.newPassword}
            onChange={(e) => setNewCredentials({
              ...newCredentials,
              newPassword: e.target.value
            })}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="पासवर्ड पुष्टी करा"
            type="password"
            value={newCredentials.confirmPassword}
            onChange={(e) => setNewCredentials({
              ...newCredentials,
              confirmPassword: e.target.value
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setChangeCredentialsOpen(false)}
            disabled={loading}
          >
            रद्द करा
          </Button>
          <Button 
            onClick={handleChangeCredentials}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'अपडेट करा'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
