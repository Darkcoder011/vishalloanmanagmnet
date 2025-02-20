import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { getDatabase, ref, onValue } from 'firebase/database';
import { setMembers } from '../store/slices/memberSlice';

export default function Reports() {
  const dispatch = useDispatch();
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const { members } = useSelector((state) => state.members);
  const loans = members.filter(member => member.loanAmount > 0);

  useEffect(() => {
    const db = getDatabase();
    const membersRef = ref(db, 'members');
    
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const membersArray = Object.entries(data).map(([id, member]) => ({
          id,
          ...member,
          initialDeposit: parseFloat(member.initialDeposit) || 0,
          monthlySavings: parseFloat(member.monthlySavings) || 0,
          loanAmount: parseFloat(member.loanAmount) || 0,
          interestRate: parseFloat(member.interestRate) || 0,
          installment: parseFloat(member.installment) || 0,
          remainingAmount: parseFloat(member.remainingAmount) || 0,
        }));
        dispatch(setMembers(membersArray));
      } else {
        dispatch(setMembers([]));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  const generateMembersReport = () => {
    const membersData = members.map(member => ({
      'नाव': member.name,
      'प्रारंभिक ठेव': member.initialDeposit?.toLocaleString() || '0',
      'मासिक बचत': member.monthlySavings?.toLocaleString() || '0',
      'कर्ज रक्कम': member.loanAmount?.toLocaleString() || '0',
      'व्याज': member.interestRate || '0',
      'हप्ता': member.installment?.toLocaleString() || '0',
      'बाकी रक्कम': member.remainingAmount?.toLocaleString() || '0',
      'तारीख': member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(membersData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'सभासद');
    XLSX.writeFile(wb, 'सभासद_यादी.xlsx');
  };

  const generateLoansReport = () => {
    const loansData = loans.map(member => ({
      'नाव': member.name,
      'प्रारंभिक ठेव': member.initialDeposit?.toLocaleString() || '0',
      'मासिक बचत': member.monthlySavings?.toLocaleString() || '0',
      'कर्ज रक्कम': member.loanAmount?.toLocaleString() || '0',
      'व्याज': member.interestRate || '0',
      'हप्ता': member.installment?.toLocaleString() || '0',
      'बाकी रक्कम': member.remainingAmount?.toLocaleString() || '0',
      'तारीख': member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(loansData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'कर्ज');
    XLSX.writeFile(wb, 'कर्ज_यादी.xlsx');
  };

  const generateAllReport = () => {
    const wb = XLSX.utils.book_new();

    // Members Sheet
    const membersData = members.map(member => ({
      'नाव': member.name,
      'प्रारंभिक ठेव': member.initialDeposit?.toLocaleString() || '0',
      'मासिक बचत': member.monthlySavings?.toLocaleString() || '0',
      'कर्ज रक्कम': member.loanAmount?.toLocaleString() || '0',
      'व्याज': member.interestRate || '0',
      'हप्ता': member.installment?.toLocaleString() || '0',
      'बाकी रक्कम': member.remainingAmount?.toLocaleString() || '0',
      'तारीख': member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '',
    }));
    const membersWs = XLSX.utils.json_to_sheet(membersData);
    XLSX.utils.book_append_sheet(wb, membersWs, 'सभासद');

    // Loans Sheet (members with loans)
    const loansData = loans.map(member => ({
      'नाव': member.name,
      'प्रारंभिक ठेव': member.initialDeposit?.toLocaleString() || '0',
      'मासिक बचत': member.monthlySavings?.toLocaleString() || '0',
      'कर्ज रक्कम': member.loanAmount?.toLocaleString() || '0',
      'व्याज': member.interestRate || '0',
      'हप्ता': member.installment?.toLocaleString() || '0',
      'बाकी रक्कम': member.remainingAmount?.toLocaleString() || '0',
      'तारीख': member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '',
    }));
    const loansWs = XLSX.utils.json_to_sheet(loansData);
    XLSX.utils.book_append_sheet(wb, loansWs, 'कर्ज');

    XLSX.writeFile(wb, 'संपूर्ण_अहवाल.xlsx');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        अहवाल
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">सभासद अहवाल</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                सर्व सभासदांची माहिती डाउनलोड करा
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<FileDownloadIcon />}
                onClick={generateMembersReport}
                fullWidth
              >
                डाउनलोड
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">कर्ज अहवाल</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                सर्व कर्जाची माहिती डाउनलोड करा
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<FileDownloadIcon />}
                onClick={generateLoansReport}
                fullWidth
              >
                डाउनलोड
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">संपूर्ण अहवाल</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                सर्व माहिती एकत्र डाउनलोड करा
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<FileDownloadIcon />}
                onClick={generateAllReport}
                fullWidth
              >
                डाउनलोड
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
