import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BalanceIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  SavingsOutlined as SavingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { getDatabase, ref, onValue } from 'firebase/database';
import { setMembers } from '../store/slices/memberSlice';

const StatCard = ({ title, value, subtitle, icon, color, progress }) => {
  const theme = useTheme();
  return (
    <Card 
      elevation={3}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-2px)',
          transition: 'all 0.3s',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}.lighter`,
              color: `${color}.main`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" component="div" color="textPrimary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="h4" component="div" color={color} sx={{ mb: 1 }}>
          {value}
        </Typography>
        {progress !== undefined && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              color={color}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { members, isLoading: membersLoading } = useSelector((state) => state.members);
  const [monthlyStats, setMonthlyStats] = useState({
    totalCollected: 0,
    targetAmount: 0,
  });

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

        // Calculate monthly stats
        const totalMonthlyTarget = membersArray.reduce((sum, member) => {
          return sum + (member.installment || 0);
        }, 0);

        // For demo purposes, assuming 75% collection
        const collectedAmount = totalMonthlyTarget * 0.75;

        setMonthlyStats({
          totalCollected: collectedAmount,
          targetAmount: totalMonthlyTarget,
        });
      } else {
        dispatch(setMembers([]));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (membersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Filter and calculate statistics
  const membersWithLoans = members.filter(member => member.loanAmount > 0);
  const totalLoanAmount = membersWithLoans.reduce((sum, member) => sum + member.loanAmount, 0);
  const totalRemainingAmount = membersWithLoans.reduce((sum, member) => sum + member.remainingAmount, 0);
  const totalDeposits = members.reduce((sum, member) => sum + member.initialDeposit, 0);
  const totalMonthlySavings = members.reduce((sum, member) => sum + member.monthlySavings, 0);
  const collectionProgress = (monthlyStats.totalCollected / monthlyStats.targetAmount) * 100;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 6,
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            mb: 2,
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          विशाल शेतकरी संघटना
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9 }}>
          कर्ज व्यवस्थापन प्रणाली
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="एकूण सभासद"
                value={members.length}
                subtitle="नोंदणीकृत सदस्य"
                icon={<PeopleIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="सक्रिय कर्ज"
                value={membersWithLoans.length}
                subtitle="कर्ज घेतलेले सदस्य"
                icon={<MoneyIcon />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="एकूण कर्ज वितरण"
                value={`₹${totalLoanAmount.toLocaleString()}`}
                subtitle="वितरित कर्ज रक्कम"
                icon={<BalanceIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="बाकी कर्ज रक्कम"
                value={`₹${totalRemainingAmount.toLocaleString()}`}
                subtitle="वसूल करावयाची रक्कम"
                icon={<PaymentIcon />}
                color="warning"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Monthly Collection Progress */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3}
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5">
                  मासिक हप्ता वसुली
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 2 }}>
                {collectionProgress.toFixed(1)}%
              </Typography>
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={collectionProgress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white',
                    }
                  }} 
                />
              </Box>
              <Typography variant="body1">
                वसूल झालेली रक्कम: ₹{monthlyStats.totalCollected.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                लक्ष्य: ₹{monthlyStats.targetAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Stats */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="एकूण ठेवी"
            value={`₹${totalDeposits.toLocaleString()}`}
            subtitle="सदस्यांच्या ठेवी"
            icon={<SavingsIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="मासिक बचत"
            value={`₹${totalMonthlySavings.toLocaleString()}`}
            subtitle="एकूण मासिक बचत"
            icon={<AssessmentIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="कर्ज वसुली प्रगती"
            value={`${((totalLoanAmount - totalRemainingAmount) / totalLoanAmount * 100).toFixed(1)}%`}
            subtitle="एकूण कर्ज वसुली"
            icon={<TrendingUpIcon />}
            color="success"
            progress={((totalLoanAmount - totalRemainingAmount) / totalLoanAmount * 100)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
