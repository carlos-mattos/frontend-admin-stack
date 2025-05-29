import {
  Box,
  Button,
  Card,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useEffect, useState } from 'react';
import { accountsReceivableApi, appointmentsApi, servicesApi, paymentMethodsApi } from '../../../api/index';
import { formatCurrency } from '../../../utils/format';
import Autocomplete from '@mui/material/Autocomplete';

dayjs.locale('pt-br');

const AccountsReceivable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [statusFilter, setStatusFilter] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await accountsReceivableApi.list();
        const receivables = response.data;
        // Busca dados de cliente e serviço para cada recebível
        const data = await Promise.all(
          receivables.map(async (item) => {
            let clientName = '-';
            let serviceName = '-';
            // Busca serviço via appointment
            if (item.appointmentId) {
              try {
                const appointmentRes = await appointmentsApi.get(item.appointmentId);
                clientName = appointmentRes.data.customerId.fullName || '-';
                // Se houver serviceIds, buscar os nomes dos serviços
                if (appointmentRes.data.serviceIds && Array.isArray(appointmentRes.data.serviceIds)) {
                  const serviceNames = await Promise.all(
                    appointmentRes.data.serviceIds.map(async (serviceId) => {
                      try {
                        const serviceRes = await servicesApi.get(serviceId);
                        return serviceRes.data.name || '-';
                      } catch {
                        return '-';
                      }
                    })
                  );
                  serviceName = serviceNames.join(', ');
                } else if (appointmentRes.data.service && appointmentRes.data.service.name) {
                  serviceName = appointmentRes.data.service.name;
                } else if (appointmentRes.data.services && Array.isArray(appointmentRes.data.services)) {
                  serviceName = appointmentRes.data.services.map((s) => s.name).join(', ');
                }
              } catch {}
            }
            return {
              id: item.id || item._id,
              client: clientName,
              service: serviceName,
              date: dayjs(item.dueDate),
              value: item.amount,
              status: item.status?.toLowerCase() || '-',
              paymentMethod: item.paymentMethodId || item.paymentMethod || ''
            };
          })
        );
        setAppointments(data);
        // Buscar métodos de pagamento
        const paymentMethodsRes = await paymentMethodsApi.list();
        setPaymentMethods(paymentMethodsRes.data);
      } catch (error) {
        setAppointments([]);
        setPaymentMethods([]);
      }
    };
    fetchData();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePaymentClick = async (appointment) => {
    try {
      await accountsReceivableApi.update(appointment.id, { status: 'PAID' });

      setAppointments((prev) => prev.map((item) => (item.id === appointment.id ? { ...item, status: 'paid' } : item)));
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
    }
  };

  const handleRevertPaymentClick = async (appointment) => {
    try {
      await accountsReceivableApi.update(appointment.id, { status: 'PENDING' });
      setAppointments((prev) => prev.map((item) => (item.id === appointment.id ? { ...item, status: 'pending' } : item)));
    } catch (err) {
      console.error('Erro ao reverter pagamento:', err);
    }
  };

  const handlePaymentMethodChange = async (appointment, paymentMethodId) => {
    try {
      await accountsReceivableApi.update(appointment.id, { paymentMethodId });
      setAppointments((prev) => prev.map((item) => (item.id === appointment.id ? { ...item, paymentMethod: paymentMethodId } : item)));
    } catch (err) {
      console.error('Erro ao atualizar método de pagamento:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success.main';
      case 'pending':
        return 'warning.main';
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Data Inicial"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Data Final"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="paid">Pago</MenuItem>
                    <MenuItem value="pending">Pendente</MenuItem>
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
                      <TableCell>
                        <Autocomplete
                          options={paymentMethods}
                          getOptionLabel={(option) => option.name}
                          value={paymentMethods.find((m) => m._id === appointment.paymentMethod) || null}
                          onChange={(_, newValue) => handlePaymentMethodChange(appointment, newValue ? newValue._id : '')}
                          renderInput={(params) => <TextField {...params} label="Forma de Pagamento" size="small" />}
                          isOptionEqualToValue={(option, value) => option._id === value._id}
                        />
                      </TableCell>
                      <TableCell>
                        {appointment.status === 'pending' && (
                          <Button variant="contained" color="primary" onClick={() => handlePaymentClick(appointment)}>
                            Registrar Pagamento
                          </Button>
                        )}
                        {appointment.status === 'paid' && (
                          <Button variant="outlined" color="primary" onClick={() => handleRevertPaymentClick(appointment)}>
                            Reverter Pagamento
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
      </Box>
    </LocalizationProvider>
  );
};

export default AccountsReceivable;
