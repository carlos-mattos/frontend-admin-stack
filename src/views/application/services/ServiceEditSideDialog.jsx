import PropTypes from 'prop-types';
import React, { useState, useEffect, forwardRef } from 'react';
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

export default function ServiceEditSideDialog({ open, serviceData, handleCloseDialog, onServiceUpdated }) {
  const [editedService, setEditedService] = useState({
    name: '',
    category: '',
    duration: '',
    price: '',
    nextContactDays: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (serviceData) {
      setEditedService({
        name: serviceData.name || '',
        category: serviceData.category || '',
        duration: serviceData.duration || '',
        price: serviceData.price || '',
        nextContactDays: serviceData.nextContactDays || ''
      });
    }
  }, [serviceData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditedService((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validate required fields
      if (!editedService.name || !editedService.category || !editedService.duration || !editedService.price) {
        setError('Por favor, preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Convert numeric fields
      const dataToSend = {
        ...editedService,
        duration: parseFloat(editedService.duration),
        price: parseFloat(editedService.price),
        nextContactDays: editedService.nextContactDays ? parseInt(editedService.nextContactDays, 10) : 0
      };

      await servicesApi.update(serviceData._id, dataToSend);
      setSuccess(true);

      // Reset form and close dialog after success
      setEditedService({
        name: '',
        category: '',
        duration: '',
        price: '',
        nextContactDays: ''
      });

      // Call the update callback before closing
      onServiceUpdated?.();

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        handleCloseDialog();
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar serviço');
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
          <DialogTitle>Editar Serviço</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" onClose={() => setSuccess(false)}>
                  Serviço atualizado com sucesso!
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item size={12}>
                  <TextField
                    label="Nome do Serviço"
                    name="name"
                    value={editedService.name}
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
                    value={editedService.category}
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
                    value={editedService.duration}
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
                    value={editedService.price}
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
                    value={editedService.nextContactDays}
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
          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="contained"
              onClick={handleUpdate}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : success ? 'Salvo!' : 'Salvar alterações'}
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

ServiceEditSideDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  serviceData: PropTypes.object,
  handleCloseDialog: PropTypes.func.isRequired,
  onServiceUpdated: PropTypes.func
};
