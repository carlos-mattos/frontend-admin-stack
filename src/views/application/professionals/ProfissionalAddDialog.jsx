import PropTypes from 'prop-types';
import React, { useState, forwardRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Button,
  TextField,
  Grid2 as Grid,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { professionalsApi, servicesApi } from 'api/index';

const Transition = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

export default function ProfissionalAddDialog({ open, handleCloseDialog, onProfessionalCreated }) {
  const [formData, setFormData] = useState({
    fullName: '',
    crm: '',
    contact: '',
    documents: '',
    serviceHandled: [],
    acceptedInsurances: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        const { data } = await servicesApi.list();
        setServices(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar serviços');
      } finally {
        setServicesLoading(false);
      }
    };

    if (open) {
      loadServices();
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      serviceHandled: newValue.map((service) => service._id)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await professionalsApi.create(formData);
      setSuccess(true);
      onProfessionalCreated?.();
      // Limpa o formulário após 1.5 segundos e fecha o diálogo
      setTimeout(() => {
        setFormData({
          fullName: '',
          crm: '',
          contact: '',
          documents: '',
          serviceHandled: [],
          acceptedInsurances: []
        });
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar profissional');
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
          <DialogTitle>Adicionar Profissional</DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Profissional criado com sucesso!
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item size={12}>
                  <TextField
                    label="Nome Completo"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading || success}
                  />
                </Grid>
                <Grid item size={12}>
                  <TextField
                    label="CRM"
                    name="crm"
                    value={formData.crm}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading || success}
                  />
                </Grid>
                <Grid item size={12}>
                  <NumericFormat
                    customInput={TextField}
                    label="Contato"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    format="(##) #####-####"
                    mask="_"
                    fullWidth
                    required
                    disabled={loading || success}
                  />
                </Grid>
                <Grid item size={12}>
                  <NumericFormat
                    customInput={TextField}
                    label="CPF"
                    name="documents"
                    value={formData.documents}
                    onChange={handleChange}
                    format="###.###.###-##"
                    mask="_"
                    fullWidth
                    required
                    disabled={loading || success}
                  />
                </Grid>
                <Grid item size={12}>
                  <Autocomplete
                    multiple
                    options={services}
                    getOptionLabel={(option) => option.name}
                    value={services.filter((service) => formData.serviceHandled.includes(service._id))}
                    onChange={handleServiceChange}
                    loading={servicesLoading}
                    disabled={loading || success}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Serviços Prestados"
                        required
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {servicesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => <Chip key={option._id} label={option.name} {...getTagProps({ index })} />)
                    }
                  />
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={handleSubmit} disabled={loading || success}>
              {loading ? <CircularProgress size={24} /> : success ? 'Criado!' : 'Criar'}
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

ProfissionalAddDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleCloseDialog: PropTypes.func.isRequired,
  onProfessionalCreated: PropTypes.func
};
