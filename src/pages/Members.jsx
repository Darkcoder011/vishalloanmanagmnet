import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { setMembers, addMember, updateMember, setMemberLoading, setMemberError } from '../store/slices/memberSlice';
import * as firebaseService from '../services/firebaseService';

const Members = () => {
  const dispatch = useDispatch();
  const { members, isLoading, error } = useSelector((state) => state.members);
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    initialDeposit: '',
    monthlySavings: '',
    loanAmount: '',
    interestRate: '',
    installment: '',
    remainingAmount: '',
  });

  useEffect(() => {
    console.log('Setting up Firebase listener');
    const unsubscribe = firebaseService.listenToMembers((members) => {
      console.log('Received members from Firebase:', members);
      dispatch(setMembers(members));
    });

    return () => {
      console.log('Cleaning up Firebase listener');
      unsubscribe();
    };
  }, [dispatch]);

  // Debug: Log members whenever they change
  useEffect(() => {
    console.log('Current members in state:', members);
  }, [members]);

  const handleOpen = (member = null) => {
    if (member) {
      setSelectedMember(member);
      setFormData(member);
    } else {
      setSelectedMember(null);
      setFormData({
        name: '',
        initialDeposit: '',
        monthlySavings: '',
        loanAmount: '',
        interestRate: '',
        installment: '',
        remainingAmount: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMember(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setMemberLoading(true));
    try {
      const memberData = {
        ...formData,
        initialDeposit: parseFloat(formData.initialDeposit) || 0,
        monthlySavings: parseFloat(formData.monthlySavings) || 0,
        loanAmount: parseFloat(formData.loanAmount) || 0,
        interestRate: parseFloat(formData.interestRate) || 0,
        installment: parseFloat(formData.installment) || 0,
        remainingAmount: parseFloat(formData.loanAmount) || 0,
      };

      console.log('Submitting member data:', memberData);

      if (selectedMember) {
        const updatedMember = await firebaseService.updateMember(selectedMember.id, memberData);
        dispatch(updateMember(updatedMember));
      } else {
        const newMember = await firebaseService.addMember(memberData);
        dispatch(addMember(newMember));
      }
      handleClose();
    } catch (error) {
      console.error('Error submitting member:', error);
      dispatch(setMemberError(error.message));
    } finally {
      dispatch(setMemberLoading(false));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      dispatch(setMemberLoading(true));
      try {
        await firebaseService.deleteMember(id);
      } catch (error) {
        console.error('Error deleting member:', error);
        dispatch(setMemberError(error.message));
      } finally {
        dispatch(setMemberLoading(false));
      }
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          सभासद यादी
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          नवीन सभासद
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {members.length === 0 ? (
        <Alert severity="info">No members found. Add some members to get started.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>नाव</TableCell>
                <TableCell>प्रारंभिक ठेव</TableCell>
                <TableCell>मासिक बचत</TableCell>
                <TableCell>कर्ज रक्कम</TableCell>
                <TableCell>व्याज</TableCell>
                <TableCell>हप्ता</TableCell>
                <TableCell>बाकी रक्कम</TableCell>
                <TableCell>कृती</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>₹{member.initialDeposit?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{member.monthlySavings?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{member.loanAmount?.toLocaleString() || 0}</TableCell>
                  <TableCell>{member.interestRate || 0}%</TableCell>
                  <TableCell>₹{member.installment?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{member.remainingAmount?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(member)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(member.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMember ? 'सभासद माहिती संपादित करा' : 'नवीन सभासद जोडा'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="नाव"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="प्रारंभिक ठेव"
                  type="number"
                  fullWidth
                  required
                  value={formData.initialDeposit}
                  onChange={(e) => setFormData({ ...formData, initialDeposit: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="मासिक बचत"
                  type="number"
                  fullWidth
                  required
                  value={formData.monthlySavings}
                  onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="कर्ज रक्कम"
                  type="number"
                  fullWidth
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="व्याज"
                  type="number"
                  fullWidth
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="हप्ता"
                  type="number"
                  fullWidth
                  value={formData.installment}
                  onChange={(e) => setFormData({ ...formData, installment: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="बाकी रक्कम"
                  type="number"
                  fullWidth
                  value={formData.remainingAmount}
                  onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>रद्द करा</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? 'जतन करत आहे...' : 'जतन करा'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Members;
