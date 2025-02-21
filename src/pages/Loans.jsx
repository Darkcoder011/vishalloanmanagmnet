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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { setLoans, addLoan, updateLoan, setLoanLoading, setLoanError } from '../store/slices/loanSlice';
import * as firebaseService from '../services/firebaseService';
import TransactionHistory from '../components/TransactionHistory';

const Loans = () => {
  const dispatch = useDispatch();
  const { loans, isLoading, error } = useSelector((state) => state.loans);
  const [open, setOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('credit');
  const [transactionCategory, setTransactionCategory] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    loanAmount: '',
    interestRate: '',
    tenure: '',
  });

  useEffect(() => {
    console.log('Setting up Firebase listener');
    const unsubscribe = firebaseService.listenToMembers((members) => {
      console.log('Received members from Firebase:', members);
      // Filter only members with loans
      const loansData = members.filter(member => member.loanAmount > 0);
      dispatch(setLoans(loansData));
    });

    return () => {
      console.log('Cleaning up Firebase listener');
      unsubscribe();
    };
  }, [dispatch]);

  const [formData, setFormData] = useState({
    name: '',
    initialDeposit: '',
    monthlySavings: '',
    loanAmount: '',
    interestRate: '',
    installment: '',
    remainingAmount: '',
  });

  // Constants for interest calculation
  const ANNUAL_INTEREST_RATE = 24; // 24% per year
  const MONTHLY_INTEREST_RATE = ANNUAL_INTEREST_RATE / 12; // 2% per month

  // Function to calculate interest for a given period
  const calculateInterest = (principal, months) => {
    return (principal * ANNUAL_INTEREST_RATE * months) / (12 * 100);
  };

  // Function to calculate monthly interest
  const calculateMonthlyInterest = (principal) => {
    return (principal * MONTHLY_INTEREST_RATE) / 100;
  };

  const handleOpen = (loan = null) => {
    if (loan) {
      setSelectedLoan(loan);
      setFormData(loan);
    } else {
      setSelectedLoan(null);
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
    setSelectedLoan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoanLoading(true));
    try {
      const processedData = {
        ...formData,
        initialDeposit: parseFloat(formData.initialDeposit) || 0,
        monthlySavings: parseFloat(formData.monthlySavings) || 0,
        loanAmount: parseFloat(formData.loanAmount) || 0,
        interestRate: parseFloat(formData.interestRate) || 0,
        installment: parseFloat(formData.installment) || 0,
        remainingAmount: parseFloat(formData.loanAmount) || 0,
        updatedAt: new Date().toISOString()
      };

      if (selectedLoan) {
        await firebaseService.updateMember(selectedLoan.id, processedData);
        dispatch(updateLoan({ id: selectedLoan.id, ...processedData }));
      }
      handleClose();
    } catch (error) {
      console.error('Error submitting loan:', error);
      dispatch(setLoanError(error.message));
    } finally {
      dispatch(setLoanLoading(false));
    }
  };

  const handleTransactionOpen = (loan) => {
    setSelectedLoan(loan);
    setTransactionOpen(true);
  };

  const handleTransactionClose = () => {
    setTransactionOpen(false);
    setSelectedLoan(null);
    setTransactionType('credit');
    setTransactionCategory('');
    setTransactionAmount('');
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoanLoading(true));
    try {
      const amount = parseFloat(transactionAmount);
      
      // Input validation
      if (isNaN(amount) || amount <= 0) {
        throw new Error('कृपया 0 पेक्षा जास्त रक्कम टाका');
      }
      if (!transactionCategory) {
        throw new Error('कृपया व्यवहार प्रकार निवडा');
      }
      if (!selectedLoan || !selectedLoan.id) {
        throw new Error('कर्ज निवडलेले नाही');
      }

      // Get current loan data with safe defaults
      const currentValues = {
        loanAmount: Number(selectedLoan.loanAmount || 0),
        remainingAmount: Number(selectedLoan.remainingAmount || 0),
        totalPaid: Number(selectedLoan.totalPaid || 0),
        initialDeposit: Number(selectedLoan.initialDeposit || 0),
        monthlySavings: Number(selectedLoan.monthlySavings || 0),
        installmentsPaid: Number(selectedLoan.installmentsPaid || 0),
        interestRate: Number(selectedLoan.interestRate || 0)
      };

      // Initialize updates with current values
      const updates = { ...currentValues };

      // Process transaction based on type and category
      switch (transactionCategory) {
        case 'initialDeposit':
          // Initial deposit only affects initialDeposit field
          if (transactionType === 'credit') {
            updates.initialDeposit = Number((currentValues.initialDeposit + amount).toFixed(2));
          } else {
            updates.initialDeposit = Number(Math.max(currentValues.initialDeposit - amount, 0).toFixed(2));
          }
          break;

        case 'monthlySavings':
          // Monthly savings only affects monthlySavings field
          if (transactionType === 'credit') {
            updates.monthlySavings = Number((currentValues.monthlySavings + amount).toFixed(2));
          } else {
            updates.monthlySavings = Number(Math.max(currentValues.monthlySavings - amount, 0).toFixed(2));
          }
          break;

        case 'installment':
          // Installment payments affect remainingAmount, totalPaid, and installmentsPaid
          if (transactionType === 'credit') {
            // When paying an installment
            if (amount > currentValues.remainingAmount) {
              throw new Error('हप्त्याची रक्कम बाकी रकमेपेक्षा जास्त आहे');
            }
            updates.totalPaid = Number((currentValues.totalPaid + amount).toFixed(2));
            updates.remainingAmount = Number((currentValues.remainingAmount - amount).toFixed(2));
            updates.installmentsPaid = currentValues.installmentsPaid + 1;
          } else {
            // When reversing an installment payment
            if (amount > currentValues.totalPaid) {
              throw new Error('परत करण्याची रक्कम एकूण भरलेल्या रकमेपेक्षा जास्त आहे');
            }
            updates.totalPaid = Number((currentValues.totalPaid - amount).toFixed(2));
            updates.remainingAmount = Number((currentValues.remainingAmount + amount).toFixed(2));
            updates.installmentsPaid = Math.max(currentValues.installmentsPaid - 1, 0);
          }
          break;

        case 'loanAmount':
          // Loan amount modifications affect both loanAmount and remainingAmount
          if (transactionType === 'credit') {
            updates.loanAmount = Number((currentValues.loanAmount + amount).toFixed(2));
            updates.remainingAmount = Number((currentValues.remainingAmount + amount).toFixed(2));
          } else {
            if (amount > currentValues.loanAmount) {
              throw new Error('कमी करण्याची रक्कम कर्ज रकमेपेक्षा जास्त आहे');
            }
            updates.loanAmount = Number((currentValues.loanAmount - amount).toFixed(2));
            updates.remainingAmount = Number((currentValues.remainingAmount - amount).toFixed(2));
          }
          break;

        case 'interestRate':
          // Interest rate only affects interestRate field
          if (transactionType === 'credit') {
            updates.interestRate = Number((currentValues.interestRate + amount).toFixed(2));
          } else {
            updates.interestRate = Number(Math.max(currentValues.interestRate - amount, 0).toFixed(2));
          }
          break;

        default:
          throw new Error('अवैध व्यवहार प्रकार');
      }

      // Helper function to safely get numeric values
      const safeGetNumber = (value) => {
        return typeof value === 'number' ? Number(value.toFixed(2)) : 0;
      };

      // Create transaction record with proper descriptions
      const getTransactionDescription = (type, category, amount) => {
        const operation = type === 'credit' ? 'जमा' : 'नावे';
        const formattedAmount = amount.toLocaleString('en-IN', { 
          style: 'currency', 
          currency: 'INR' 
        });
        
        switch (category) {
          case 'installment':
            return `हप्ता ${operation} - ${formattedAmount}`;
          case 'initialDeposit':
            return `प्रारंभिक ठेव ${operation} - ${formattedAmount}`;
          case 'monthlySavings':
            return `मासिक बचत ${operation} - ${formattedAmount}`;
          case 'loanAmount':
            return `कर्ज रक्कम ${operation} - ${formattedAmount}`;
          case 'interestRate':
            return `व्याज दर ${operation} - ${amount}%`;
          default:
            return `${operation} - ${formattedAmount}`;
        }
      };

      // Get the previous and new values safely
      const getPreviousValue = (category) => {
        switch (category) {
          case 'installment':
            return safeGetNumber(currentValues.totalPaid);
          case 'initialDeposit':
            return safeGetNumber(currentValues.initialDeposit);
          case 'monthlySavings':
            return safeGetNumber(currentValues.monthlySavings);
          case 'loanAmount':
            return safeGetNumber(currentValues.loanAmount);
          case 'interestRate':
            return safeGetNumber(currentValues.interestRate);
          default:
            return 0;
        }
      };

      const getNewValue = (category) => {
        switch (category) {
          case 'installment':
            return safeGetNumber(updates.totalPaid);
          case 'initialDeposit':
            return safeGetNumber(updates.initialDeposit);
          case 'monthlySavings':
            return safeGetNumber(updates.monthlySavings);
          case 'loanAmount':
            return safeGetNumber(updates.loanAmount);
          case 'interestRate':
            return safeGetNumber(updates.interestRate);
          default:
            return 0;
        }
      };

      const transactionRecord = {
        type: transactionType,
        category: transactionCategory,
        amount: Number(amount.toFixed(2)),
        date: new Date().toISOString(),
        remainingAmount: safeGetNumber(updates.remainingAmount),
        totalPaid: safeGetNumber(updates.totalPaid),
        previousValue: getPreviousValue(transactionCategory),
        newValue: getNewValue(transactionCategory),
        description: getTransactionDescription(transactionType, transactionCategory, amount)
      };

      // Update loan and add transaction using firebaseService
      await firebaseService.updateMember(selectedLoan.id, updates);
      await firebaseService.addPayment(selectedLoan.id, transactionRecord);

      handleTransactionClose();
    } catch (error) {
      console.error('Error processing transaction:', error);
      dispatch(setLoanError(error.message));
    } finally {
      dispatch(setLoanLoading(false));
    }
  };

  const calculatePaymentSchedule = (loanAmount, interestRate, monthlyInstallment) => {
    const schedule = [];
    let remainingAmount = loanAmount;
    let installmentNumber = 1;
    const monthlyRate = interestRate / (12 * 100);

    while (remainingAmount > 0) {
      const interestForMonth = remainingAmount * monthlyRate;
      const principalForMonth = Math.min(monthlyInstallment - interestForMonth, remainingAmount);
      remainingAmount -= principalForMonth;

      schedule.push({
        installmentNumber,
        dueDate: new Date(Date.now() + (installmentNumber * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        totalAmount: monthlyInstallment,
        principalAmount: principalForMonth,
        interestAmount: interestForMonth,
        remainingAmount: remainingAmount,
        status: 'pending'
      });

      installmentNumber++;
      if (installmentNumber > 360) break; // Safety check for maximum 30 years
    }

    return schedule;
  };

  const calculateLoanSummary = (loan) => {
    const totalPaid = (loan.totalPaid || 0) + (loan.initialDeposit || 0);
    const progress = (totalPaid / loan.loanAmount) * 100;
    const totalInterestPaid = loan.totalInterest || 0;
    
    // Calculate next installment details
    const nextInstallment = loan.paymentSchedule?.find(p => p.status === 'pending');
    const isOverdue = nextInstallment && new Date(nextInstallment.dueDate) < new Date();

    return {
      totalPaid,
      progress: Math.min(progress, 100),
      remaining: Math.max(loan.loanAmount - totalPaid, 0),
      totalInterestPaid,
      nextInstallmentDate: nextInstallment?.dueDate,
      nextInstallmentAmount: nextInstallment?.totalAmount,
      isOverdue,
      installmentsPaid: loan.installmentsPaid || 0,
    };
  };

  const handleHistoryOpen = (loan) => {
    setSelectedLoan(loan);
    setHistoryOpen(true);
  };

  const handleHistoryClose = () => {
    setHistoryOpen(false);
    setSelectedLoan(null);
  };

  const handleCalculatorOpen = () => {
    setCalculatorOpen(true);
  };

  const handleCalculatorClose = () => {
    setCalculatorOpen(false);
    setCalculatorData({
      loanAmount: '',
      interestRate: '',
      tenure: '',
    });
  };

  const calculateEMI = () => {
    const P = parseFloat(calculatorData.loanAmount);
    const R = parseFloat(calculatorData.interestRate) / (12 * 100); // Monthly interest rate
    const N = parseFloat(calculatorData.tenure) * 12; // Total number of months

    if (P && R && N) {
      const emi = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1);
      return Math.round(emi);
    }
    return 0;
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
          कर्ज यादी
        </Typography>
        <Button
          variant="contained"
          startIcon={<CalculateIcon />}
          onClick={handleCalculatorOpen}
        >
          हप्ता कॅल्क्युलेटर
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loans.length === 0 ? (
        <Alert severity="info">No loans found. Add loans through the Members page.</Alert>
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
              {loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.name}</TableCell>
                  <TableCell>₹{loan.initialDeposit?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{loan.monthlySavings?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{loan.loanAmount?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{loan.interestRate || 0}</TableCell>
                  <TableCell>₹{loan.installment?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{loan.remainingAmount?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(loan)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleTransactionOpen(loan)} color="success" size="small">
                      <PaymentIcon />
                    </IconButton>
                    <IconButton onClick={() => handleHistoryOpen(loan)} color="info" size="small">
                      <HistoryIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Transaction History Dialog */}
      <TransactionHistory
        open={historyOpen}
        onClose={handleHistoryClose}
        memberId={selectedLoan?.id}
        memberName={selectedLoan?.name}
      />

      {/* EMI Calculator Dialog */}
      <Dialog open={calculatorOpen} onClose={handleCalculatorClose} maxWidth="sm" fullWidth>
        <DialogTitle>हप्ता कॅल्क्युलेटर</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="कर्ज रक्कम"
                  type="number"
                  value={calculatorData.loanAmount}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, loanAmount: e.target.value }))}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="व्याज दर (वार्षिक %)"
                  type="number"
                  value={calculatorData.interestRate}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, interestRate: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="कालावधी (वर्षे)"
                  type="number"
                  value={calculatorData.tenure}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, tenure: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="h6" gutterBottom>मासिक हप्ता (EMI)</Typography>
                  <Typography variant="h4">₹{calculateEMI().toLocaleString()}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCalculatorClose}>बंद करा</Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionOpen} onClose={handleTransactionClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          रक्कम व्यवहार
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleTransactionSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>व्यवहार प्रकार</InputLabel>
                  <Select
                    value={transactionType}
                    label="व्यवहार प्रकार"
                    onChange={(e) => setTransactionType(e.target.value)}
                  >
                    <MenuItem value="credit">जमा करा</MenuItem>
                    <MenuItem value="debit">वजा करा</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>रक्कम प्रकार</InputLabel>
                  <Select
                    value={transactionCategory}
                    label="रक्कम प्रकार"
                    onChange={(e) => setTransactionCategory(e.target.value)}
                  >
                    <MenuItem value="installment">हप्ता</MenuItem>
                    <MenuItem value="initialDeposit">प्रारंभिक ठेव</MenuItem>
                    <MenuItem value="monthlySavings">मासिक बचत</MenuItem>
                    <MenuItem value="loanAmount">कर्ज रक्कम</MenuItem>
                    <MenuItem value="interestRate">व्याज दर</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="रक्कम"
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  InputProps={{
                    startAdornment: '₹',
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTransactionClose}>रद्द करा</Button>
          <Button type="submit" onClick={handleTransactionSubmit} variant="contained" color="primary">
            जतन करा
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          कर्ज माहिती संपादित करा
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
                  disabled
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
                  required
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="व्याज"
                  type="number"
                  fullWidth
                  required
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="हप्ता"
                  type="number"
                  fullWidth
                  required
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

      {/* Interest Information Section */}
      {selectedLoan && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="h6">व्याज माहिती (Interest Information)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography>वार्षिक व्याज दर (Annual Interest Rate): {ANNUAL_INTEREST_RATE}%</Typography>
              <Typography>मासिक व्याज दर (Monthly Interest Rate): {MONTHLY_INTEREST_RATE}%</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>एकूण व्याज (Total Interest Accrued): ₹{(selectedLoan.totalInterest || 0).toFixed(2)}</Typography>
              <Typography>मासिक व्याज (Current Monthly Interest): ₹{calculateMonthlyInterest(selectedLoan.remainingAmount).toFixed(2)}</Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Loans;
