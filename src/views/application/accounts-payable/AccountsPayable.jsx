import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useEffect, useState } from 'react';
import { accountsPayableApi } from '../../../api/index';

dayjs.locale('pt-br');

const AccountsPayable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expenses, setExpenses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    type: 'variable',
    category: '',
    amount: '',
    dueDate: dayjs(),
    vendor: '',
    isRecurring: false,
    recurrencePeriod: 'MONTHLY'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRowId, setMenuRowId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    accountsPayableApi
      .list()
      .then((res) => {
        const data = res.data.map((expense) => ({
          ...expense,
          dueDate: dayjs(expense.dueDate)
        }));
        setExpenses(data);
        setError(null);
        console.log('Despesas carregadas:', data);
      })
      .catch((err) => {
        setError('Erro ao carregar despesas');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      description: '',
      type: 'variable',
      category: '',
      amount: '',
      dueDate: dayjs(),
      vendor: '',
      isRecurring: false,
      recurrencePeriod: 'MONTHLY'
    });
  };

  const handleFormChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const newExpense = {
      ...formData,
      dueDate: formData.dueDate.format('YYYY-MM-DD'),
      status: 'PENDING'
    };
    try {
      await accountsPayableApi.create(newExpense);

      const res = await accountsPayableApi.list();
      const data = res.data.map((expense) => ({
        ...expense,
        dueDate: dayjs(expense.dueDate)
      }));
      setExpenses(data);
      handleCloseForm();
      setError(null);
    } catch (err) {
      setError('Erro ao criar despesa');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    setLoading(true);
    try {
      await accountsPayableApi.update(id, { status: 'PAID' });

      const res = await accountsPayableApi.list();
      const data = res.data.map((expense) => ({
        ...expense,
        dueDate: dayjs(expense.dueDate)
      }));
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError('Erro ao marcar como pago');
    } finally {
      setLoading(false);
    }
  };

  const handleRevertPayment = async (id) => {
    setLoading(true);
    try {
      await accountsPayableApi.update(id, { status: 'PENDING' });
      const res = await accountsPayableApi.list();
      const data = res.data.map((expense) => ({
        ...expense,
        dueDate: dayjs(expense.dueDate)
      }));
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError('Erro ao reverter pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async (id) => {
    setLoading(true);
    try {
      await accountsPayableApi.update(id, { status: 'CANCELLED' });
      const res = await accountsPayableApi.list();
      const data = res.data.map((expense) => ({
        ...expense,
        dueDate: dayjs(expense.dueDate)
      }));
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError('Erro ao cancelar despesa');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setMenuRowId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRowId(null);
  };

  const getStatusColor = (expense) => {
    if (expense.status === 'PAID') return 'success';
    if (expense.status === 'CANCELLED') return 'default';
    if (expense.status === 'OVERDUE') return 'error';
    if (expense.status === 'PENDING') {
      const days = expense.dueDate.diff(dayjs(), 'day');
      if (days < 0) return 'error';
      if (days <= 7) return 'warning';
      return 'warning';
    }
    return 'default';
  };

  const getStatusLabel = (expense) => {
    if (expense.status === 'PAID') return 'Pago';
    if (expense.status === 'CANCELLED') return 'Cancelado';
    if (expense.status === 'OVERDUE') return 'Vencido';
    if (expense.status === 'PENDING') {
      const days = expense.dueDate.diff(dayjs(), 'day');
      if (days < 0) return 'Vencido';
      if (days <= 7) return 'Próximo ao Vencimento';
      return 'Pendente';
    }
    return expense.status;
  };


  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('all');
  };


  const filteredExpenses = expenses.filter((expense) => {
    const matchesDate =
      (!startDate || expense.dueDate.isAfter(startDate) || expense.dueDate.isSame(startDate, 'day')) &&
      (!endDate || expense.dueDate.isBefore(endDate) || expense.dueDate.isSame(endDate, 'day'));
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
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
                    <MenuItem value="OVERDUE">Vencido</MenuItem>
                    <MenuItem value="CANCELLED">Cancelado</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3} display="flex" alignItems="center" justifyContent="flex-end">
                  <Button variant="contained" color="primary" onClick={handleOpenForm}>
                    Nova Despesa
                  </Button>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
        <Card>
          {loading && <Typography sx={{ p: 2 }}>Carregando...</Typography>}
          {error && (
            <Typography color="error" sx={{ p: 2 }}>
              {error}
            </Typography>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Vencimento</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.type === 'fixed' ? 'Fixa' : 'Variável'}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(expense.amount))}
                    </TableCell>
                    <TableCell>{expense.dueDate.format('DD/MM/YYYY')}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(expense)} color={getStatusColor(expense)} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuOpen(e, expense._id)}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && menuRowId === expense._id}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        {(expense.status === 'PENDING' || expense.status === 'OVERDUE') && (
                          <MenuItem
                            onClick={() => {
                              handleMarkAsPaid(expense._id);
                              handleMenuClose();
                            }}
                          >
                            Marcar como Pago
                          </MenuItem>
                        )}
                        {expense.status === 'PAID' && (
                          <MenuItem
                            onClick={() => {
                              handleRevertPayment(expense._id);
                              handleMenuClose();
                            }}
                          >
                            Reverter Pagamento
                          </MenuItem>
                        )}
                        {expense.status === 'CANCELLED' && (
                          <MenuItem
                            onClick={() => {
                              handleRevertPayment(expense._id);
                              handleMenuClose();
                            }}
                          >
                            Reativar Pagamento
                          </MenuItem>
                        )}
                        {(expense.status === 'PENDING' || expense.status === 'PAID' || expense.status === 'OVERDUE') && (
                          <MenuItem
                            onClick={() => {
                              handleCancelPayment(expense._id);
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
            count={filteredExpenses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página"
          />
        </Card>

        <Dialog open={isFormOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="Descrição" value={formData.description} onChange={handleFormChange('description')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Tipo" value={formData.type} onChange={handleFormChange('type')}>
                  <MenuItem value="fixed">Fixa</MenuItem>
                  <MenuItem value="variable">Variável</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Categoria" value={formData.category} onChange={handleFormChange('category')} />
              </Grid>
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
                <TextField fullWidth label="Fornecedor" value={formData.vendor} onChange={handleFormChange('vendor')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data de Vencimento"
                  value={formData.dueDate}
                  onChange={(newValue) => setFormData({ ...formData, dueDate: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                  format="DD/MM/YYYY"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch checked={formData.isRecurring} onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })} />
                  }
                  label="Despesa Recorrente"
                />
              </Grid>
              {formData.isRecurring && (
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Período de Recorrência"
                    value={formData.recurrencePeriod}
                    onChange={handleFormChange('recurrencePeriod')}
                  >
                    <MenuItem value="WEEKLY">Semanal</MenuItem>
                    <MenuItem value="MONTHLY">Mensal</MenuItem>
                    <MenuItem value="QUARTERLY">Trimestral</MenuItem>
                    <MenuItem value="YEARLY">Anual</MenuItem>
                  </TextField>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AccountsPayable;
