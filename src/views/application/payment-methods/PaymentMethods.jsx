import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControlLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { PaymentMethod, PaymentMethodLabel } from 'types/payment';

const PaymentMethods = () => {
  const { methods, loading, error, createMethod, updateMethod, deleteMethod } = usePaymentMethods();
  const [open, setOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    allowPartial: false,
    installments: 1
  });

  const handleOpen = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData(method);
    } else {
      setEditingMethod(null);
      setFormData({
        type: '',
        name: '',
        allowPartial: false,
        installments: 1
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMethod(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await updateMethod(editingMethod.id, formData);
      } else {
        await createMethod(formData);
      }
      handleClose();
    } catch (err) {
      console.error('Erro ao salvar método:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este método de pagamento?')) {
      try {
        await deleteMethod(id);
      } catch (err) {
        console.error('Erro ao excluir método:', err);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h3">Métodos de Pagamento</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Novo Método
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Permite Parcelamento</TableCell>
                  <TableCell>Parcelas</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>{method.name}</TableCell>
                    <TableCell>{PaymentMethodLabel[method.type]}</TableCell>
                    <TableCell>{method.allowPartial ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{method.installments}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpen(method)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(method.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMethod ? 'Editar Método' : 'Novo Método'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Tipo"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  {Object.entries(PaymentMethod).map(([key, value]) => (
                    <MenuItem key={value} value={value}>
                      {PaymentMethodLabel[value]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowPartial}
                      onChange={(e) => setFormData({ ...formData, allowPartial: e.target.checked })}
                    />
                  }
                  label="Permitir Pagamento Parcial"
                />
              </Grid>
              {formData.allowPartial && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Número de Parcelas"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
                    inputProps={{ min: 1, max: 12 }}
                    required
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {editingMethod ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PaymentMethods; 