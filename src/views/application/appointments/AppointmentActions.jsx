import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Alert, Box } from '@mui/material';
import { useAppointmentsFinance } from 'hooks/useAppointmentsFinance';
import { formatCurrency } from 'utils/format';

const AppointmentActions = ({ appointment, onComplete }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState(null);
  const { loading, handleAppointmentComplete, registerPayment, shouldTrackFinance } = useAppointmentsFinance();

  const handleComplete = async () => {
    try {
      setError(null);
      await handleAppointmentComplete(appointment.id, appointment);
      onComplete?.();
    } catch (err) {
      setError('Erro ao concluir atendimento');
    }
  };

  const handlePayment = async () => {
    try {
      setError(null);
      await registerPayment(appointment.id, paymentMethod);
      setIsPaymentModalOpen(false);
      onComplete?.();
    } catch (err) {
      setError('Erro ao registrar pagamento');
    }
  };

  const getFinanceStatus = () => {
    if (!shouldTrackFinance(appointment)) {
      return { label: 'Não aplicável', color: 'default' };
    }

    switch (appointment.finance?.status) {
      case 'expected':
        return { label: 'Previsto', color: 'info' };
      case 'pending':
        return { label: 'Pendente', color: 'warning' };
      case 'paid':
        return { label: 'Pago', color: 'success' };
      default:
        return { label: 'Não definido', color: 'default' };
    }
  };

  const financeStatus = getFinanceStatus();

  // Não mostrar ações financeiras para bloqueios
  if (!shouldTrackFinance(appointment)) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <strong>Valor:</strong> {formatCurrency(appointment.finance?.amount || 0)}
        <br />
        <strong>Status Financeiro:</strong>{' '}
        <Box component="span" sx={{ color: `${financeStatus.color}.main` }}>
          {financeStatus.label}
        </Box>
        {appointment.finance?.method && (
          <>
            <br />
            <strong>Forma de Pagamento:</strong> {appointment.finance.method}
          </>
        )}
      </Box>

      {appointment.status !== 'Concluído' && (
        <Button variant="contained" color="primary" onClick={handleComplete} disabled={loading} sx={{ mr: 2 }}>
          Concluir Atendimento
        </Button>
      )}

      {appointment.status === 'Concluído' && appointment.finance?.status === 'pending' && (
        <Button variant="contained" color="success" onClick={() => setIsPaymentModalOpen(true)} disabled={loading}>
          Registrar Pagamento
        </Button>
      )}

      <Dialog open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)}>
        <DialogTitle>Registrar Pagamento</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Forma de Pagamento"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="cash">Dinheiro</MenuItem>
                <MenuItem value="credit">Cartão de Crédito</MenuItem>
                <MenuItem value="debit">Cartão de Débito</MenuItem>
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="transfer">Transferência</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
          <Button onClick={handlePayment} variant="contained" color="primary" disabled={!paymentMethod}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentActions;
