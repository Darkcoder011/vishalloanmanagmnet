import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarTodayIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { getDatabase, ref, onValue, query, orderByChild } from 'firebase/database';
import * as firebaseService from '../services/firebaseService';
import * as XLSX from 'xlsx';

const MemberHistory = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    // Fetch member details
    const unsubscribeMember = firebaseService.listenToMembers((members) => {
      const foundMember = members.find(m => m.id === memberId);
      if (foundMember) {
        setMember(foundMember);
      }
    });

    // Fetch transactions
    const db = getDatabase();
    const transactionsRef = ref(db, `transactions/${memberId}`);
    const transactionsQuery = query(transactionsRef, orderByChild('date'));

    const unsubscribeTransactions = onValue(transactionsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsArray = Object.entries(data).map(([id, transaction]) => ({
          id,
          ...transaction,
          date: new Date(transaction.date),
        })).sort((a, b) => b.date - a.date);
        setTransactions(transactionsArray);
      } else {
        setTransactions([]);
      }
    });

    return () => {
      unsubscribeMember();
      unsubscribeTransactions();
    };
  }, [memberId]);

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType !== 'all' && transaction.type !== filterType) return false;
    if (filterCategory !== 'all' && transaction.category !== filterCategory) return false;
    return true;
  });

  const stats = {
    totalCredit: filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
    totalDebit: filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
    totalTransactions: filteredTransactions.length,
  };

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

  const exportToExcel = () => {
    if (!member || !transactions.length) return;

    // 1. Member Details Sheet
    const memberDetails = {
      'नाव': member.name,
      'कर्ज रक्कम': member.loanAmount || 0,
      'बाकी रक्कम': member.remainingAmount || 0,
      'एकूण हप्ते भरले': member.installmentsPaid || 0,
      'मासिक बचत': member.monthlySavings || 0,
      'व्याज दर': member.interestRate || 0,
      'प्रारंभिक ठेव': member.initialDeposit || 0,
    };

    // 2. Transaction Summary Sheet
    const summary = {
      'प्रारंभिक ठेव': {
        'जमा': 0,
        'वजा': 0,
      },
      'मासिक बचत': {
        'जमा': 0,
        'वजा': 0,
      },
      'कर्ज रक्कम': {
        'जमा': 0,
        'वजा': 0,
      },
      'हप्ता': {
        'जमा': 0,
        'वजा': 0,
      },
      'व्याज': {
        'जमा': 0,
        'वजा': 0,
      },
    };

    // Calculate summary
    transactions.forEach(transaction => {
      const category = transaction.category;
      const type = transaction.type;
      const amount = parseFloat(transaction.amount) || 0;

      if (summary[getCategoryLabel(category)]) {
        summary[getCategoryLabel(category)][type === 'credit' ? 'जमा' : 'वजा'] += amount;
      }
    });

    // Convert summary to rows
    const summaryRows = Object.entries(summary).map(([category, values]) => ({
      'श्रेणी': category,
      'एकूण जमा': values.जमा,
      'एकूण वजा': values.वजा,
      'निव्वळ रक्कम': values.जमा - values.वजा,
    }));

    // 3. Monthly Summary Sheet
    const monthlyData = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          'जमा': 0,
          'वजा': 0,
        };
      }
      
      const amount = parseFloat(transaction.amount) || 0;
      monthlyData[monthYear][transaction.type === 'credit' ? 'जमा' : 'वजा'] += amount;
    });

    const monthlyRows = Object.entries(monthlyData).map(([monthYear, values]) => ({
      'महिना': monthYear,
      'एकूण जमा': values.जमा,
      'एकूण वजा': values.वजा,
      'निव्वळ रक्कम': values.जमा - values.वजा,
    })).sort((a, b) => {
      const [aMonth, aYear] = a.महिना.split('/');
      const [bMonth, bYear] = b.महिना.split('/');
      return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
    });

    // 4. Detailed Transactions Sheet
    const transactionsData = transactions
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(transaction => ({
        'दिनांक': new Date(transaction.date).toLocaleDateString('mr-IN'),
        'प्रकार': transaction.type === 'credit' ? 'जमा' : 'वजा',
        'श्रेणी': getCategoryLabel(transaction.category),
        'रक्कम': transaction.amount || 0,
        'बाकी रक्कम': transaction.remainingAmount || 0,
        'टिप्पणी': transaction.note || '',
      }));

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new();

    // 1. Member Details Sheet
    const wsDetails = XLSX.utils.json_to_sheet([memberDetails]);
    XLSX.utils.book_append_sheet(wb, wsDetails, 'सदस्य माहिती');

    // 2. Transaction Summary Sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'व्यवहार सारांश');

    // 3. Monthly Summary Sheet
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'मासिक सारांश');

    // 4. Detailed Transactions Sheet
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'संपूर्ण व्यवहार');

    // Auto-size columns for all sheets
    const sheets = ['सदस्य माहिती', 'व्यवहार सारांश', 'मासिक सारांश', 'संपूर्ण व्यवहार'];
    sheets.forEach(sheet => {
      const ws = wb.Sheets[sheet];
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let max = 0;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && cell.v) {
            const length = cell.v.toString().length;
            if (length > max) max = length;
          }
        }
        ws['!cols'] = ws['!cols'] || [];
        ws['!cols'][C] = { wch: max + 2 };
      }
    });

    // Save file with current date
    const today = new Date().toLocaleDateString('mr-IN').replace(/\//g, '-');
    XLSX.writeFile(wb, `${member.name}_व्यवहार_इतिहास_${today}.xlsx`);
  };

  if (!member) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/history')}
          >
            मागे जा
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            disabled={!member || transactions.length === 0}
          >
            एक्सेल डाउनलोड करा
          </Button>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          {member.name} - व्यवहार इतिहास
        </Typography>
      </Box>

      {/* Member Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">कर्ज रक्कम</Typography>
              </Box>
              <Typography variant="h4">₹{member.loanAmount?.toLocaleString() || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">बाकी रक्कम</Typography>
              </Box>
              <Typography variant="h4">₹{member.remainingAmount?.toLocaleString() || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">एकूण व्यवहार</Typography>
              </Box>
              <Typography variant="h4">{stats.totalTransactions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">हप्ते भरले</Typography>
              </Box>
              <Typography variant="h4">{member.installmentsPaid || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>व्यवहार प्रकार</InputLabel>
            <Select
              value={filterType}
              label="व्यवहार प्रकार"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">सर्व</MenuItem>
              <MenuItem value="credit">जमा</MenuItem>
              <MenuItem value="debit">वजा</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>रक्कम प्रकार</InputLabel>
            <Select
              value={filterCategory}
              label="रक्कम प्रकार"
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
      </Grid>

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
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
                <TableCell>
                  {transaction.date.toLocaleDateString('mr-IN')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={transaction.type === 'credit' ? 'जमा' : 'वजा'}
                    color={getTransactionTypeColor(transaction.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{getCategoryLabel(transaction.category)}</TableCell>
                <TableCell align="right">₹{transaction.amount?.toLocaleString()}</TableCell>
                <TableCell align="right">₹{transaction.remainingAmount?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>सारांश</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">एकूण जमा</Typography>
            <Typography variant="h5" color="success.main">
              ₹{stats.totalCredit.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">एकूण वजा</Typography>
            <Typography variant="h5" color="error.main">
              ₹{stats.totalDebit.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">एकूण व्यवहार</Typography>
            <Typography variant="h5">
              {stats.totalTransactions}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default MemberHistory;
