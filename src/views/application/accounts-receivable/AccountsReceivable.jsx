import MoreVertIcon from '@mui/icons-material/MoreVert';
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
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useEffect, useState } from 'react';
import { accountsReceivableApi, appointmentsApi, customersApi, paymentMethodsApi, servicesApi } from '../../../api/index';
import { formatCurrency } from '../../../utils/format';

dayjs.locale('pt-br');

const AccountsReceivable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [receivables, setReceivables] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRowId, setMenuRowId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    dueDate: null,
    status: 'PENDING',
    customerId: null
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await accountsReceivableApi.list();
        const receivables = response.data;
        const data = await Promise.all(
          receivables.map(async (item) => {
            let clientName = '-';
            let serviceName = '-';
            if (item.appointmentId) {
              try {
                const appointmentRes = await appointmentsApi.get(item.appointmentId);
                clientName = appointmentRes.data.customerId.fullName || '-';
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
            if (item.customerId) {
              const customerRes = await customersApi.get(item.customerId);
              clientName = customerRes.data.fullName || '-';
            }
            return {
              _id: item._id,
              client: clientName,
              service: serviceName,
              date: dayjs(item.dueDate),
              value: item.amount,
              status: item.status || '-',
              paymentMethod: item.paymentMethodId || item.paymentMethod || ''
            };
          })
        );
        setReceivables(data);
        const paymentMethodsRes = await paymentMethodsApi.list();
        setPaymentMethods(paymentMethodsRes.data);
      } catch (error) {
        setReceivables([]);
        setPaymentMethods([]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    customersApi
      .list()
      .then((res) => setCustomers(res.data))
      .catch(() => setCustomers([]));
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePaymentClick = async (receivable) => {
    try {
      await accountsReceivableApi.update(receivable._id, { status: 'PAID' });
      setReceivables((prev) => prev.map((item) => (item._id === receivable._id ? { ...item, status: 'PAID' } : item)));
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
    }
  };

  const handleRevertPaymentClick = async (receivable) => {
    try {
      console.log(receivable);

      await accountsReceivableApi.update(receivable._id, { status: 'PENDING' });
      setReceivables((prev) => prev.map((item) => (item._id === receivable._id ? { ...item, status: 'PENDING' } : item)));
    } catch (err) {
      console.error('Erro ao reverter pagamento:', err);
    }
  };

  const handlePaymentMethodChange = async (receivable, paymentMethodId) => {
    try {
      await accountsReceivableApi.update(receivable._id, { paymentMethodId });
      setReceivables((prev) => prev.map((item) => (item._id === receivable._id ? { ...item, paymentMethod: paymentMethodId } : item)));
    } catch (err) {
      console.error('Erro ao atualizar método de pagamento:', err);
    }
  };

  const handleCancelClick = async (receivable) => {
    try {
      await accountsReceivableApi.update(receivable._id, { status: 'CANCELLED' });
      setReceivables((prev) => prev.map((item) => (item._id === receivable._id ? { ...item, status: 'CANCELLED' } : item)));
    } catch (err) {
      console.error('Erro ao cancelar recebível:', err);
    }
  };

  const getStatusColor = (receivable) => {
    if (receivable.status === 'PAID') return 'success';
    if (receivable.status === 'CANCELLED') return 'default';
    if (receivable.status === 'PENDING') return 'warning';
    return 'default';
  };

  const getStatusLabel = (receivable) => {
    if (receivable.status === 'PAID') return 'Pago';
    if (receivable.status === 'CANCELLED') return 'Cancelado';
    if (receivable.status === 'PENDING') return 'Pendente';
    return receivable.status;
  };

  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setMenuRowId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRowId(null);
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      amount: '',
      dueDate: null,
      status: 'PENDING',
      customerId: null
    });
    setFormError(null);
  };

  const handleFormChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleFormDateChange = (date) => {
    setFormData({
      ...formData,
      dueDate: date
    });
  };

  const handleCustomerChange = (_, value) => {
    setFormData({
      ...formData,
      customerId: value ? value._id : null
    });
  };

  const handleSubmit = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('O valor é obrigatório.');
      return;
    }
    setFormLoading(true);
    try {
      await accountsReceivableApi.create({
        ...formData,
        dueDate: formData.dueDate.format('YYYY-MM-DD'),
        amount: Number(formData.amount),
        customerId: formData.customerId
      });
    
      const response = await accountsReceivableApi.list();
      const receivablesData = response.data.map((item) => ({
        ...item,
        date: dayjs(item.dueDate),
        value: item.amount,
        status: item.status || '-',
        paymentMethod: item.paymentMethodId || item.paymentMethod || ''
      }));
      setReceivables(receivablesData);
      handleCloseForm();
    } catch (err) {
      setFormError('Erro ao criar recebível');
    } finally {
      setFormLoading(false);
    }
  };

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
                    format="DD/MM/YYYY"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Data Final"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                    format="DD/MM/YYYY"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="PENDING">Pendente</MenuItem>
                    <MenuItem value="PAID">Pago</MenuItem>
                    <MenuItem value="CANCELLED">Cancelado</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3} display="flex" alignItems="center" justifyContent="flex-end">
                  <Button variant="contained" color="primary" onClick={handleOpenForm}>
                    Novo Recebível
                  </Button>
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
                  {receivables.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((receivable) => (
                    <TableRow key={receivable._id}>
                      <TableCell>{receivable.client}</TableCell>
                      {Array.isArray(receivable.service) ? (
                        <TableCell>
                          {receivable.service.map((srv, idx) => (
                            <span key={srv._id || idx}>{srv.name}</span>
                          ))}
                        </TableCell>
                      ) : (
                        <TableCell>{receivable.service}</TableCell>
                      )}
                      <TableCell>{receivable.date.format('DD/MM/YYYY')}</TableCell>
                      <TableCell>{formatCurrency(receivable.value)}</TableCell>
                      <TableCell>
                        <Chip label={getStatusLabel(receivable)} color={getStatusColor(receivable)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          options={paymentMethods}
                          getOptionLabel={(option) => option.name}
                          value={paymentMethods.find((m) => m._id === receivable.paymentMethod) || null}
                          onChange={(_, newValue) => handlePaymentMethodChange(receivable, newValue ? newValue._id : '')}
                          renderInput={(params) => <TextField {...params} label="Forma de Pagamento" size="small" />}
                          isOptionEqualToValue={(option, value) => option._id === value._id}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleMenuOpen(e, receivable._id)}>
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && menuRowId === receivable._id}
                          onClose={handleMenuClose}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          {receivable.status === 'PENDING' && (
                            <MenuItem
                              key={`registrar-${receivable._id}`}
                              onClick={() => {
                                handlePaymentClick(receivable);
                                handleMenuClose();
                              }}
                            >
                              Registrar Pagamento
                            </MenuItem>
                          )}
                          {receivable.status === 'PAID' && (
                            <MenuItem
                              key={`reverter-${receivable._id}`}
                              onClick={() => {
                                handleRevertPaymentClick(receivable);
                                handleMenuClose();
                              }}
                            >
                              Reverter Pagamento
                            </MenuItem>
                          )}
                          {receivable.status === 'CANCELLED' && (
                            <MenuItem
                              key={`reativar-${receivable._id}`}
                              onClick={() => {
                                handleRevertPaymentClick(receivable);
                                handleMenuClose();
                              }}
                            >
                              Reativar Pagamento
                            </MenuItem>
                          )}
                          {(receivable.status === 'PENDING' || receivable.status === 'PAID') && (
                            <MenuItem
                              key={`cancelar-${receivable._id}`}
                              onClick={() => {
                                handleCancelClick(receivable);
                                handleMenuClose();
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              Cancelar Pagamento
                            </MenuItem>
                          )}
                        </Menu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={receivables.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Itens por página"
            />
          </Grid>
        </Grid>
        <Dialog open={isFormOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
          <DialogTitle>Novo Recebível</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valor"
                  type="number"
                  value={formData.amount}
                  onChange={handleFormChange('amount')}
                  InputProps={{
                    startAdornment: 'R$'
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data de Vencimento"
                  value={formData.dueDate}
                  onChange={handleFormDateChange}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.fullName || option.name || ''}
                  value={customers.find((c) => c._id === formData.customerId) || null}
                  onChange={handleCustomerChange}
                  renderInput={(params) => <TextField {...params} label="Cliente" fullWidth />}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Status" value={formData.status} onChange={handleFormChange('status')}>
                  <MenuItem key="PENDING" value="PENDING">
                    Pendente
                  </MenuItem>
                  <MenuItem key="PAID" value="PAID">
                    Pago
                  </MenuItem>
                  <MenuItem key="CANCELLED" value="CANCELLED">
                    Cancelado
                  </MenuItem>
                </TextField>
              </Grid>
            </Grid>
            {formError && (
              <Typography color="error" sx={{ mt: 2 }}>
                {formError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary" disabled={formLoading}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AccountsReceivable;
