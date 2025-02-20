import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import * as firebaseService from '../services/firebaseService';
import * as XLSX from 'xlsx';

const History = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.listenToMembers((membersData) => {
      setMembers(membersData || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMembers = members.filter(member => 
    member && member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberClick = (memberId) => {
    navigate(`/member-history/${memberId}`);
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredMembers.map(member => ({
      'नाव': member.name,
      'कर्ज रक्कम': member.loanAmount || 0,
      'बाकी रक्कम': member.remainingAmount || 0,
      'एकूण हप्ते भरले': member.installmentsPaid || 0,
      'मासिक बचत': member.monthlySavings || 0,
      'व्याज दर': member.interestRate || 0,
      'प्रारंभिक ठेव': member.initialDeposit || 0,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'सदस्य यादी');
    
    // Save file
    XLSX.writeFile(wb, 'सदस्य_यादी.xlsx');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            सदस्य व्यवहार इतिहास
          </Typography>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            disabled={filteredMembers.length === 0}
          >
            एक्सेल डाउनलोड करा
          </Button>
        </Box>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="सदस्य शोधा..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredMembers.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          कोणतेही सदस्य सापडले नाहीत
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>नाव</TableCell>
                <TableCell>कर्ज रक्कम</TableCell>
                <TableCell>बाकी रक्कम</TableCell>
                <TableCell>एकूण व्यवहार</TableCell>
                <TableCell>कृती</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow 
                  key={member.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleMemberClick(member.id)}
                >
                  <TableCell>{member.name}</TableCell>
                  <TableCell>₹{member.loanAmount?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{member.remainingAmount?.toLocaleString() || 0}</TableCell>
                  <TableCell>{member.installmentsPaid || 0}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMemberClick(member.id);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default History;
