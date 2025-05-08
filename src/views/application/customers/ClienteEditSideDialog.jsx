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
  Checkbox,
  FormControlLabel,
  Grid2 as Grid,
  Alert
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { customersApi } from 'api/index';

const Transition = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

export default function ClienteEditSideDialog({ open, clientData, handleCloseDialog, onClientUpdated }) {
  const [editedData, setEditedData] = useState({
    fullName: '',
    address: '',
    documents: '',
    phone: '',
    email: '',
    communicationConsent: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Limpa os estados quando o diálogo é fechado
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [open]);

  // Atualiza os dados quando um novo cliente é selecionado
  useEffect(() => {
    if (clientData) {
      setEditedData(clientData);
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [clientData]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdate = async () => {
    if (!clientData?._id) {
      setError('Dados do cliente não encontrados');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await customersApi.update(clientData._id, editedData);
      setSuccess(true);
      onClientUpdated?.();
      // Fecha o diálogo após 1.5 segundos
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!clientData) {
    return null;
  }

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
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Cliente atualizado com sucesso!
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item size={12}>
                <TextField label="Nome Completo" name="fullName" value={editedData.fullName} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item size={12}>
                <TextField label="Endereço" name="address" value={editedData.address} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item size={12}>
                <NumericFormat
                  customInput={TextField}
                  label="CPF/CNPJ"
                  name="documents"
                  value={editedData.documents}
                  onChange={handleChange}
                  format={editedData.documents.length <= 11 ? '###.###.###-##' : '##.###.###/####-##'}
                  mask="_"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item size={12}>
                <NumericFormat
                  customInput={TextField}
                  label="Telefone"
                  name="phone"
                  value={editedData.phone}
                  onChange={handleChange}
                  format="(##) #####-####"
                  mask="_"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item size={12}>
                <TextField label="Email" name="email" type="email" value={editedData.email} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item size={12}>
                <FormControlLabel
                  control={<Checkbox name="communicationConsent" checked={editedData.communicationConsent} onChange={handleChange} />}
                  label="Aceita receber comunicações"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={handleUpdate} disabled={loading || success}>
              {loading ? 'Salvando...' : success ? 'Salvo!' : 'Salvar alterações'}
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

ClienteEditSideDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  clientData: PropTypes.object,
  handleCloseDialog: PropTypes.func.isRequired,
  onClientUpdated: PropTypes.func
};
