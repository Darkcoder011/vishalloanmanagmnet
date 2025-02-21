import { getDatabase, ref, push, onValue, remove, update, set, get, child } from 'firebase/database';
import { db } from './firebase';

// Members
export const listenToMembers = (callback) => {
  console.log('Setting up members listener');
  const membersRef = ref(db, 'members');
  
  const unsubscribe = onValue(membersRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Received members data:', data);
    
    const members = data ? Object.entries(data).map(([id, member]) => ({
      id,
      ...member,
      initialDeposit: parseFloat(member.initialDeposit) || 0,
      monthlySavings: parseFloat(member.monthlySavings) || 0,
      loanAmount: parseFloat(member.loanAmount) || 0,
      interestRate: parseFloat(member.interestRate) || 0,
      installment: parseFloat(member.installment) || 0,
      remainingAmount: parseFloat(member.remainingAmount) || 0,
    })) : [];
    
    console.log('Transformed members:', members);
    callback(members);
  }, (error) => {
    console.error('Error listening to members:', error);
  });

  return unsubscribe;
};

export const addMember = async (memberData) => {
  try {
    console.log('Adding member:', memberData);
    const membersRef = ref(db, 'members');
    
    // Process the data
    const processedData = {
      ...memberData,
      initialDeposit: parseFloat(memberData.initialDeposit) || 0,
      monthlySavings: parseFloat(memberData.monthlySavings) || 0,
      loanAmount: parseFloat(memberData.loanAmount) || 0,
      interestRate: parseFloat(memberData.interestRate) || 0,
      installment: parseFloat(memberData.installment) || 0,
      remainingAmount: parseFloat(memberData.loanAmount) || 0,
      createdAt: new Date().toISOString()
    };

    // Add member
    const newMemberRef = await push(membersRef, processedData);
    const memberId = newMemberRef.key;

    // If there's a loan amount, create a loan record
    if (processedData.loanAmount > 0) {
      const loansRef = ref(db, 'loans');
      await push(loansRef, {
        ...processedData,
        memberId,
        createdAt: new Date().toISOString()
      });
    }

    return {
      id: memberId,
      ...processedData
    };
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
};

export const updateMember = async (id, memberData) => {
  try {
    console.log('Updating member:', id, memberData);
    const memberRef = ref(db, `members/${id}`);
    
    // Process the data
    const processedData = {
      ...memberData,
      initialDeposit: parseFloat(memberData.initialDeposit) || 0,
      monthlySavings: parseFloat(memberData.monthlySavings) || 0,
      loanAmount: parseFloat(memberData.loanAmount) || 0,
      interestRate: parseFloat(memberData.interestRate) || 0,
      installment: parseFloat(memberData.installment) || 0,
      remainingAmount: parseFloat(memberData.remainingAmount) || 0,
      updatedAt: new Date().toISOString()
    };

    // Update member
    await update(memberRef, processedData);

    // Update or create loan record
    const loansRef = ref(db, 'loans');
    const loansSnapshot = await new Promise((resolve) => {
      onValue(ref(db, 'loans'), resolve, { onlyOnce: true });
    });
    
    const loansData = loansSnapshot.val() || {};
    const memberLoan = Object.entries(loansData).find(([_, loan]) => loan.memberId === id);

    if (memberLoan) {
      // Update existing loan
      await update(ref(db, `loans/${memberLoan[0]}`), {
        ...processedData,
        memberId: id,
        updatedAt: new Date().toISOString()
      });
    } else if (processedData.loanAmount > 0) {
      // Create new loan
      await push(loansRef, {
        ...processedData,
        memberId: id,
        createdAt: new Date().toISOString()
      });
    }

    return {
      id,
      ...processedData
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

export const deleteMember = async (id) => {
  try {
    console.log('Deleting member:', id);
    
    // Delete member
    await remove(ref(db, `members/${id}`));

    // Delete associated loan
    const loansSnapshot = await new Promise((resolve) => {
      onValue(ref(db, 'loans'), resolve, { onlyOnce: true });
    });
    
    const loansData = loansSnapshot.val() || {};
    const memberLoan = Object.entries(loansData).find(([_, loan]) => loan.memberId === id);

    if (memberLoan) {
      await remove(ref(db, `loans/${memberLoan[0]}`));
    }
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Loans
export const listenToLoans = (callback) => {
  console.log('Setting up loans listener');
  const loansRef = ref(db, 'loans');
  
  const unsubscribe = onValue(loansRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Received loans data:', data);
    
    const loans = data ? Object.entries(data).map(([id, loan]) => ({
      id,
      ...loan,
      initialDeposit: parseFloat(loan.initialDeposit) || 0,
      monthlySavings: parseFloat(loan.monthlySavings) || 0,
      loanAmount: parseFloat(loan.loanAmount) || 0,
      interestRate: parseFloat(loan.interestRate) || 0,
      installment: parseFloat(loan.installment) || 0,
      remainingAmount: parseFloat(loan.remainingAmount) || 0,
    })) : [];
    
    console.log('Transformed loans:', loans);
    callback(loans);
  }, (error) => {
    console.error('Error listening to loans:', error);
  });

  return unsubscribe;
};

export const addLoan = async (loanData) => {
  try {
    console.log('Adding loan:', loanData);
    const loansRef = ref(db, 'loans');
    const newLoanRef = await push(loansRef, {
      ...loanData,
      createdAt: new Date().toISOString()
    });
    return {
      id: newLoanRef.key,
      ...loanData
    };
  } catch (error) {
    console.error('Error adding loan:', error);
    throw error;
  }
};

export const updateLoan = async (id, loanData) => {
  try {
    console.log('Updating loan:', id, loanData);
    const loanRef = ref(db, `loans/${id}`);
    await update(loanRef, {
      ...loanData,
      updatedAt: new Date().toISOString()
    });
    return {
      id,
      ...loanData
    };
  } catch (error) {
    console.error('Error updating loan:', error);
    throw error;
  }
};

export const deleteLoan = async (id) => {
  try {
    console.log('Deleting loan:', id);
    const loanRef = ref(db, `loans/${id}`);
    await remove(loanRef);
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
};

// Payments
export const listenToPayments = (loanId, callback) => {
  console.log('Setting up payments listener');
  const paymentsRef = ref(db, `payments/${loanId}`);
  
  const unsubscribe = onValue(paymentsRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Received payments data:', data);
    
    const payments = data ? Object.entries(data).map(([id, payment]) => ({
      id,
      ...payment,
      amount: parseFloat(payment.amount) || 0
    })) : [];
    
    console.log('Transformed payments:', payments);
    callback(payments);
  }, (error) => {
    console.error('Error listening to payments:', error);
  });

  return unsubscribe;
};

export const addPayment = async (memberId, paymentData) => {
  try {
    // Validate payment data before pushing to Firebase
    const validatedPayment = {
      type: paymentData.type || 'credit',
      category: paymentData.category || 'unknown',
      amount: Number(paymentData.amount || 0).toFixed(2),
      date: paymentData.date || new Date().toISOString(),
      remainingAmount: Number(paymentData.remainingAmount || 0).toFixed(2),
      totalPaid: Number(paymentData.totalPaid || 0).toFixed(2),
      previousValue: Number(paymentData.previousValue || 0).toFixed(2),
      newValue: Number(paymentData.newValue || 0).toFixed(2),
      description: paymentData.description || '',
    };

    const transactionsRef = ref(db, `members/${memberId}/transactions`);
    await push(transactionsRef, validatedPayment);
    return true;
  } catch (error) {
    console.error('Error adding payment:', error);
    throw error;
  }
};

// Reports
export const generateReport = async (startDate, endDate) => {
  try {
    console.log('Generating report');
    const [loans, members, payments] = await Promise.all([
      get(ref(db, 'loans')),
      get(ref(db, 'members')),
      get(ref(db, 'payments'))
    ]);

    return {
      loans: loans.val() || {},
      members: members.val() || {},
      payments: payments.val() || {}
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};
