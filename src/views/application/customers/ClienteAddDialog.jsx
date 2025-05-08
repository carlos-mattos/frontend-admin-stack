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
  Checkbox,
  FormControlLabel,
  Grid2 as Grid,
  Alert
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { customersApi } from 'api/index';

const Transition = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

export default function ClienteAddSideDialog({ open, handleCloseDialog, onClientCreated }) {
  const [clientData, setClientData] = useState({
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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setClientData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await customersApi.create(clientData);
      setSuccess(true);
      onClientCreated?.();
      // Limpa o formulário após 1.5 segundos e fecha o diálogo
      setTimeout(() => {
        setClientData({
          fullName: '',
          address: '',
          documents: '',
          phone: '',
          email: '',
          communicationConsent: false
        });
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar cliente');
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
          <DialogTitle>Adicionar Cliente</DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Cliente criado com sucesso!
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item size={12}>
                <TextField label="Nome Completo" name="fullName" value={clientData.fullName} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item size={12}>
                <TextField label="Endereço" name="address" value={clientData.address} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item size={12}>
                <NumericFormat
                  customInput={TextField}
                  label="CPF/CNPJ"
                  name="documents"
                  value={clientData.documents}
                  onChange={handleChange}
                  format={clientData.documents.length <= 11 ? '###.###.###-##' : '##.###.###/####-##'}
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
                  value={clientData.phone}
                  onChange={handleChange}
                  format="(##) #####-####"
                  mask="_"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item size={12}>
                <TextField label="Email" name="email" type="email" value={clientData.email} onChange={handleChange} fullWidth required />
              </Grid>
              <Grid item size={12}>
                <FormControlLabel
                  control={<Checkbox name="communicationConsent" checked={clientData.communicationConsent} onChange={handleChange} />}
                  label="Aceita receber comunicações"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={handleCreate} disabled={loading || success}>
              {loading ? 'Criando...' : success ? 'Criado!' : 'Criar'}
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

ClienteAddSideDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleCloseDialog: PropTypes.func.isRequired,
  onClientCreated: PropTypes.func
};
