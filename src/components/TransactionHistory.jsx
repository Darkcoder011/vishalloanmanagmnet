import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Chip,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getDatabase, ref, onValue, query, orderByChild } from 'firebase/database';

const TransactionHistory = ({ open, onClose, memberId, memberName }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    if (!memberId) return;

    const db = getDatabase();
    const transactionsRef = ref(db, `transactions/${memberId}`);
    const transactionsQuery = query(transactionsRef, orderByChild('date'));

    const unsubscribe = onValue(transactionsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsArray = Object.entries(data).map(([id, transaction]) => ({
          id,
          ...transaction,
          date: new Date(transaction.date),
        })).sort((a, b) => b.date - a.date); // Sort by date descending
        console.log('Loaded transactions:', transactionsArray);
        setTransactions(transactionsArray);
        setFilteredTransactions(transactionsArray);
      } else {
        setTransactions([]);
        setFilteredTransactions([]);
      }
    });

    return () => unsubscribe();
  }, [memberId]);

  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Filter by date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(t => t.date >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => t.date <= endDate);
    }

    setFilteredTransactions(filtered);
  }, [filterType, filterCategory, dateRange, transactions]);

  const getTransactionTypeColor = (type) => {
    return type === 'credit' ? 'success' : 'error';
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'initialDeposit': return 'प्रारंभिक ठेव';
      case 'monthlySavings': return 'मासिक बचत';
      case 'loanAmount': return 'कर्ज रक्कम';
      case 'installment': return 'हप्ता';
      case 'interestRate': return 'व्याज दर';
      default: return category;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('mr-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate statistics
  const stats = {
    totalCredit: filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalDebit: filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalTransactions: filteredTransactions.length,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">व्यवहार इतिहास - {memberName}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>प्रकार फिल्टर</InputLabel>
              <Select
                value={filterType}
                label="प्रकार फिल्टर"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">सर्व</MenuItem>
                <MenuItem value="credit">जमा</MenuItem>
                <MenuItem value="debit">वजा</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>श्रेणी फिल्टर</InputLabel>
              <Select
                value={filterCategory}
                label="श्रेणी फिल्टर"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="all">सर्व</MenuItem>
                <MenuItem value="installment">हप्ता</MenuItem>
                <MenuItem value="initialDeposit">प्रारंभिक ठेव</MenuItem>
                <MenuItem value="monthlySavings">मासिक बचत</MenuItem>
                <MenuItem value="loanAmount">कर्ज रक्कम</MenuItem>
                <MenuItem value="interestRate">व्याज दर</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="पासून"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="पर्यंत"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>दिनांक</TableCell>
                <TableCell>प्रकार</TableCell>
                <TableCell>श्रेणी</TableCell>
                <TableCell align="right">रक्कम</TableCell>
                <TableCell align="right">बाकी रक्कम</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.type === 'credit' ? 'जमा' : 'वजा'}
                      size="small"
                      color={getTransactionTypeColor(transaction.type)}
                    />
                  </TableCell>
                  <TableCell>{getCategoryLabel(transaction.category)}</TableCell>
                  <TableCell align="right">₹{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell align="right">₹{transaction.remainingAmount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>सारांश</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">एकूण जमा</Typography>
              <Typography variant="h6" color="success.main">₹{stats.totalCredit.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">एकूण वजा</Typography>
              <Typography variant="h6" color="error.main">₹{stats.totalDebit.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">एकूण व्यवहार</Typography>
              <Typography variant="h6">{stats.totalTransactions}</Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionHistory;
