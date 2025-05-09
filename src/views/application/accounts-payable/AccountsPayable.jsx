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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

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
    value: '',
    dueDate: dayjs(),
    isRecurring: false,
    recurrencePeriod: 'monthly'
  });

  // Mock data - Replace with actual API call
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        description: 'Aluguel',
        type: 'fixed',
        category: 'Operacional',
        value: 2500.0,
        dueDate: dayjs('2024-03-25'),
        status: 'pending',
        isRecurring: true,
        recurrencePeriod: 'monthly'
      },
      {
        id: 2,
        description: 'Material de Escritório',
        type: 'variable',
        category: 'Operacional',
        value: 350.0,
        dueDate: dayjs('2024-03-15'),
        status: 'paid',
        isRecurring: false
      }
    ];
    setExpenses(mockData);
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
      value: '',
      dueDate: dayjs(),
      isRecurring: false,
      recurrencePeriod: 'monthly'
    });
  };

  const handleFormChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = () => {
    const newExpense = {
      id: expenses.length + 1,
      ...formData,
      status: 'pending'
    };
    setExpenses([...expenses, newExpense]);
    handleCloseForm();
  };

  const handleMarkAsPaid = (id) => {
    setExpenses(expenses.map((expense) => (expense.id === id ? { ...expense, status: 'paid' } : expense)));
  };

  const getStatusColor = (expense) => {
    if (expense.status === 'paid') return 'success';

    const daysUntilDue = expense.dueDate.diff(dayjs(), 'day');
    if (daysUntilDue < 0) return 'error';
    if (daysUntilDue <= 7) return 'warning';
    return 'default';
  };

  const getStatusLabel = (expense) => {
    if (expense.status === 'paid') return 'Pago';

    const daysUntilDue = expense.dueDate.diff(dayjs(), 'day');
    if (daysUntilDue < 0) return 'Vencido';
    if (daysUntilDue <= 7) return 'Próximo ao Vencimento';
    return 'Pendente';
  };

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleOpenForm}>
          Nova Despesa
        </Button>
      </Card>

      <Card>
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
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.type === 'fixed' ? 'Fixa' : 'Variável'}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(expense.value)}
                  </TableCell>
                  <TableCell>{expense.dueDate.format('DD/MM/YYYY')}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(expense)} color={getStatusColor(expense)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    {expense.status !== 'paid' && (
                      <Button variant="contained" color="primary" size="small" onClick={() => handleMarkAsPaid(expense.id)}>
                        Marcar como Pago
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
          count={expenses.length}
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
                value={formData.value}
                onChange={handleFormChange('value')}
                InputProps={{
                  startAdornment: 'R$'
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Data de Vencimento"
                  value={formData.dueDate}
                  onChange={(newValue) => setFormData({ ...formData, dueDate: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
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
                  <MenuItem value="weekly">Semanal</MenuItem>
                  <MenuItem value="monthly">Mensal</MenuItem>
                  <MenuItem value="quarterly">Trimestral</MenuItem>
                  <MenuItem value="yearly">Anual</MenuItem>
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
  );
};

export default AccountsPayable;
