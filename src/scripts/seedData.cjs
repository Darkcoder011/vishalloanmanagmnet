const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAoNLt4Jp6_AYJuDZYAyOxh7mB8xjhK1Rw",
  authDomain: "loan-management-app-3b0c3.firebaseapp.com",
  databaseURL: "https://loan-management-app-3b0c3-default-rtdb.firebaseio.com",
  projectId: "loan-management-app-3b0c3",
  storageBucket: "loan-management-app-3b0c3.appspot.com",
  messagingSenderId: "1051890712871",
  appId: "1:1051890712871:web:f4cb8f0c2b3e5e4a6c0001"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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

const seedDatabase = async () => {
  try {
    const membersRef = ref(db, 'members');
    const loansRef = ref(db, 'loans');
    
    // Add each member and their corresponding loan to the database
    for (const member of dummyMembers) {
      const { name, initialDeposit, monthlySavings, loanAmount, interestRate, installment, remainingAmount } = member;
      
      // Add member
      const memberData = {
        name,
        initialDeposit,
        monthlySavings,
        createdAt: new Date().toISOString()
      };
      
      const memberRef = await push(membersRef, memberData);
      console.log('Added member:', name);

      // Add loan for this member
      const loanData = {
        name,
        loanAmount,
        interestRate,
        installment,
        remainingAmount,
        memberId: memberRef.key,
        createdAt: new Date().toISOString()
      };
      
      await push(loansRef, loanData);
      console.log('Added loan for:', name);
    }
    
    console.log('Data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Run the seeding function
seedDatabase().then(() => {
  console.log('Seeding complete. You can now delete this file.');
});
