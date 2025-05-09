import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import PaymentModal from './PaymentModal';
import { formatCurrency } from '../../../utils/format';
import { generateReceipt } from '../../../utils/pdfGenerator';
import { useAppointmentsFinance } from 'hooks/useAppointmentsFinance';

dayjs.locale('pt-br');

const AccountsReceivable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const { loading, error, registerPayment } = useAppointmentsFinance();

  // Mock data - Replace with actual API call
  useEffect(() => {
    const mockAppointments = [
      {
        id: 1,
        client: 'João Silva',
        service: 'Corte de Cabelo',
        date: dayjs(),
        value: 50,
        status: 'pending',
        paymentMethod: null
      },
      {
        id: 2,
        client: 'Maria Santos',
        service: 'Manicure',
        date: dayjs().subtract(1, 'day'),
        value: 35,
        status: 'paid',
        paymentMethod: 'credit'
      }
    ];
    setAppointments(mockAppointments);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePaymentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      await registerPayment(selectedAppointment.id, paymentData.method);
      // Update local state or refetch data
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error('Error registering payment:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success.main';
      case 'pending':
        return 'warning.main';
      case 'expected':
        return 'info.main';
      default:
        return 'text.primary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'expected':
        return 'Previsto';
      default:
        return status;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesDate =
      (!startDate || appointment.date.isAfter(startDate) || appointment.date.isSame(startDate, 'day')) &&
      (!endDate || appointment.date.isBefore(endDate) || appointment.date.isSame(endDate, 'day'));
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Data Inicial"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Data Final"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="paid">Pago</MenuItem>
                  <MenuItem value="pending">Pendente</MenuItem>
                  <MenuItem value="expected">Previsto</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Serviço</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Forma de Pagamento</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.client}</TableCell>
                    <TableCell>{appointment.service}</TableCell>
                    <TableCell>{appointment.date.format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{formatCurrency(appointment.value)}</TableCell>
                    <TableCell sx={{ color: getStatusColor(appointment.status) }}>{getStatusLabel(appointment.status)}</TableCell>
                    <TableCell>{appointment.paymentMethod || '-'}</TableCell>
                    <TableCell>
                      {appointment.status === 'pending' && (
                        <Button variant="contained" color="primary" onClick={() => handlePaymentClick(appointment)}>
                          Registrar Pagamento
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAppointments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página"
          />
        </Grid>
      </Grid>

      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        appointment={selectedAppointment}
      />
    </Box>
  );
};

export default AccountsReceivable;
