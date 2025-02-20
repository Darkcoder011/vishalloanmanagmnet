import React, { useState } from 'react';
import { Button, Alert, Snackbar } from '@mui/material';
import { getDatabase, ref, push } from 'firebase/database';

const dummyMembers = [
  {
    name: 'राजेश पाटील',
    initialDeposit: 25000,
    monthlySavings: 2000,
    loanAmount: 100000,
    interestRate: 12,
    installment: 9300,
    remainingAmount: 100000,
  },
  {
    name: 'सुनील देशमुख',
    initialDeposit: 30000,
    monthlySavings: 2500,
    loanAmount: 150000,
    interestRate: 12,
    installment: 14000,
    remainingAmount: 150000,
  },
  {
    name: 'प्रकाश जाधव',
    initialDeposit: 20000,
    monthlySavings: 1500,
    loanAmount: 80000,
    interestRate: 12,
    installment: 7500,
    remainingAmount: 80000,
  },
  {
    name: 'अनिल शिंदे',
    initialDeposit: 35000,
    monthlySavings: 3000,
    loanAmount: 200000,
    interestRate: 12,
    installment: 18700,
    remainingAmount: 200000,
  },
  {
    name: 'विजय काळे',
    initialDeposit: 15000,
    monthlySavings: 1000,
    loanAmount: 50000,
    interestRate: 12,
    installment: 4700,
    remainingAmount: 50000,
  },
  {
    name: 'संतोष मोरे',
    initialDeposit: 40000,
    monthlySavings: 3500,
    loanAmount: 250000,
    interestRate: 12,
    installment: 23400,
    remainingAmount: 250000,
  },
  {
    name: 'महेश सावंत',
    initialDeposit: 28000,
    monthlySavings: 2200,
    loanAmount: 120000,
    interestRate: 12,
    installment: 11200,
    remainingAmount: 120000,
  },
  {
    name: 'दिनेश कुलकर्णी',
    initialDeposit: 45000,
    monthlySavings: 4000,
    loanAmount: 300000,
    interestRate: 12,
    installment: 28100,
    remainingAmount: 300000,
  },
  {
    name: 'रमेश गायकवाड',
    initialDeposit: 22000,
    monthlySavings: 1800,
    loanAmount: 90000,
    interestRate: 12,
    installment: 8400,
    remainingAmount: 90000,
  },
  {
    name: 'किरण जोशी',
    initialDeposit: 33000,
    monthlySavings: 2800,
    loanAmount: 180000,
    interestRate: 12,
    installment: 16800,
    remainingAmount: 180000,
  }
];

const SeedData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSeedData = async () => {
    if (!window.confirm('This will add dummy data to your database. Are you sure you want to continue?')) {
      return;
    }

    setIsLoading(true);
    try {
      const db = getDatabase();
      const membersRef = ref(db, 'members');

      // Add each member to the database
      for (const member of dummyMembers) {
        await push(membersRef, {
          ...member,
          createdAt: new Date().toISOString()
        });
      }

      setSnackbar({
        open: true,
        message: 'डेटा यशस्वीरित्या जोडला गेला!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      setSnackbar({
        open: true,
        message: 'डेटा जोडताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleSeedData}
        disabled={isLoading}
      >
        {isLoading ? 'डेटा जोडत आहे...' : 'टेस्ट डेटा जोडा'}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SeedData;
