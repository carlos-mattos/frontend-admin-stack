import PropTypes from 'prop-types';
import React, { useState, forwardRef } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Button,
  TextField,
  Grid2 as Grid,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { servicesApi } from 'api/index';

const Transition = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

export default function ServiceAddDialog({ open, handleCloseDialog, onServiceCreated }) {
  const [serviceData, setServiceData] = useState({
    name: '',
    category: '',
    duration: '',
    price: '',
    nextContactDays: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setServiceData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validate required fields
      if (!serviceData.name || !serviceData.category || !serviceData.duration || !serviceData.price) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Convert numeric fields
      const dataToSend = {
        ...serviceData,
        duration: parseFloat(serviceData.duration),
        price: parseFloat(serviceData.price),
        nextContactDays: serviceData.nextContactDays ? parseInt(serviceData.nextContactDays, 10) : 0
      };

      await servicesApi.create(dataToSend);
      setSuccess(true);
      setServiceData({
        name: '',
        category: '',
        duration: '',
        price: '',
        nextContactDays: ''
      });
      onServiceCreated?.();
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={handleCloseDialog}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          justifyContent: 'flex-end'
        },
        '& .MuiDialog-paper': {
          margin: 0,
          borderRadius: 0,
          width: 450,
          height: '100vh',
          maxHeight: 'none'
        }
      }}
    >
      {open && (
        <>
          <DialogTitle>Adicionar Serviço</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" onClose={() => setSuccess(false)}>
                  Serviço criado com sucesso!
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item size={12}>
                  <TextField
                    label="Nome do Serviço"
                    name="name"
                    value={serviceData.name}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading}
                  />
                </Grid>
                <Grid item size={12}>
                  <TextField
                    label="Categoria"
                    name="category"
                    value={serviceData.category}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading}
                  />
                </Grid>
                <Grid item size={12}>
                  <TextField
                    label="Duração (horas)"
                    name="duration"
                    value={serviceData.duration}
                    onChange={handleChange}
                    type="number"
                    fullWidth
                    required
                    disabled={loading}
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
                <Grid item size={12}>
                  <TextField
                    label="Preço (R$)"
                    name="price"
                    value={serviceData.price}
                    onChange={handleChange}
                    type="number"
                    fullWidth
                    required
                    disabled={loading}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item size={12}>
                  <TextField
                    label="Retorno (dias)"
                    name="nextContactDays"
                    value={serviceData.nextContactDays}
                    onChange={handleChange}
                    type="number"
                    fullWidth
                    disabled={loading}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : success ? 'Salvo!' : 'Salvar'}
            </Button>
            <Button variant="text" color="error" onClick={handleCloseDialog} disabled={loading}>
              Fechar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

ServiceAddDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleCloseDialog: PropTypes.func.isRequired,
  onServiceCreated: PropTypes.func
};
