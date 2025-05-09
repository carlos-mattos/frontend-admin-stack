import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { formatCurrency } from 'utils/format';

const PaymentModal = ({ open, onClose, onSubmit, appointment }) => {
  const { methods } = usePaymentMethods();
  const [paymentData, setPaymentData] = useState({
    date: new Date(),
    method: '',
    value: appointment?.value || 0,
    installments: 1
  });

  const selectedMethod = methods.find((m) => m.type === paymentData.method);

  useEffect(() => {
    if (selectedMethod?.allowPartial) {
      setPaymentData((prev) => ({ ...prev, installments: selectedMethod.installments }));
    } else {
      setPaymentData((prev) => ({ ...prev, installments: 1 }));
    }
  }, [selectedMethod]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentData);
  };

  const installmentValue = paymentData.value / paymentData.installments;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar Pagamento</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <DatePicker
                label="Data do Pagamento"
                value={paymentData.date}
                onChange={(date) => setPaymentData({ ...paymentData, date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Método de Pagamento"
                value={paymentData.method}
                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                required
              >
                {methods.map((method) => (
                  <MenuItem key={method.id} value={method.type}>
                    {method.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Valor"
                value={paymentData.value}
                onChange={(e) => setPaymentData({ ...paymentData, value: parseFloat(e.target.value) })}
                required
                InputProps={{
                  startAdornment: 'R$'
                }}
              />
            </Grid>
            {selectedMethod?.allowPartial && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Número de Parcelas"
                    value={paymentData.installments}
                    onChange={(e) => setPaymentData({ ...paymentData, installments: parseInt(e.target.value) })}
                    inputProps={{ min: 1, max: selectedMethod.installments }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">
                    Valor da Parcela: {formatCurrency(installmentValue)}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            Registrar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentModal; 