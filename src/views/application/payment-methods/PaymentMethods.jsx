import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import { paymentMethodsApi } from '../../../api/index';

const PaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  // Carregar métodos da API
  const fetchMethods = async () => {
    setLoading(true);
    try {
      const response = await paymentMethodsApi.list();
      setMethods(response.data);
    } catch (err) {
      setError('Erro ao carregar métodos de pagamento');
    } finally {
      setLoading(false);
    }
  };

  // Carrega ao montar
  React.useEffect(() => {
    fetchMethods();
  }, []);

  const handleOpen = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: ''
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
    setLoading(true);
    try {
      if (editingMethod) {
        await paymentMethodsApi.update(editingMethod._id, formData);
      } else {
        await paymentMethodsApi.create(formData);
      }
      handleClose();
      fetchMethods();
    } catch (err) {
      setError('Erro ao salvar método');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await paymentMethodsApi.remove(id);
      fetchMethods();
    } catch (err) {
      setError('Erro ao excluir método');
    } finally {
      setLoading(false);
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
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method._id || method.id}>
                    <TableCell>{method.name}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpen(method)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(method._id || method.id)} color="error">
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
                  fullWidth
                  label="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
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
