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
  Alert,
  CircularProgress,
  Autocomplete,
  Chip
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { professionalsApi, servicesApi } from 'api/index';

const Transition = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

export default function ProfessionalEditSideDialog({ open, professionalData, handleCloseDialog, onProfessionalUpdated }) {
  const [editedData, setEditedData] = useState({
    fullName: '',
    crm: '',
    contact: '',
    documents: '',
    serviceHandled: [],
    acceptedInsurances: []
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  // Limpa os estados quando o diálogo é fechado
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(false);
      setLoading(false);
      setServicesLoaded(false);
    }
  }, [open]);

  // Carrega os serviços disponíveis
  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        const { data } = await servicesApi.list();
        setServices(data);
        setServicesLoaded(true);
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

  // Atualiza os dados quando um novo profissional é selecionado
  useEffect(() => {
    if (professionalData && servicesLoaded) {


      // Normaliza serviceHandled ─ sempre um array de IDs
      const processedServiceHandled = (professionalData.serviceHandled ?? []).map((s) => (typeof s === 'string' ? s : s._id));

      setEditedData({
        ...professionalData,
        serviceHandled: processedServiceHandled
      });
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [professionalData, servicesLoaded]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (event, newValue) => {
   
    setEditedData((prev) => ({
      ...prev,
      serviceHandled: newValue.map((service) => service._id)
    }));
  };

  const getSelectedServices = () => {
    if (!editedData.serviceHandled || !services.length) {
      return [];
    }
    const selectedServices = services.filter((service) => editedData.serviceHandled.includes(service._id));
    return selectedServices;
  };

  const handleUpdate = async () => {
    if (!professionalData?._id) {
      setError('Dados do profissional não encontrados');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await professionalsApi.update(professionalData._id, editedData);
      setSuccess(true);
      onProfessionalUpdated?.();
      // Fecha o diálogo após 1.5 segundos
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar profissional');
    } finally {
      setLoading(false);
    }
  };

  if (!professionalData) {
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
          <DialogTitle>Editar Profissional</DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profissional atualizado com sucesso!
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item size={12}>
                <TextField
                  label="Nome Completo"
                  name="fullName"
                  value={editedData.fullName}
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
                  value={editedData.crm}
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
                  value={editedData.contact}
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
                  value={editedData.documents}
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
                  value={getSelectedServices()}
                  onChange={handleServiceChange}
                  loading={servicesLoading}
                  isOptionEqualToValue={(opt, val) => opt._id === val._id}
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
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={handleUpdate} disabled={loading || success}>
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

ProfessionalEditSideDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  professionalData: PropTypes.object,
  handleCloseDialog: PropTypes.func.isRequired,
  onProfessionalUpdated: PropTypes.func
};
