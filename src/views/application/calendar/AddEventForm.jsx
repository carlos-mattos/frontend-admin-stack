import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import DateRangeIcon from '@mui/icons-material/DateRange';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField
} from '@mui/material';
import Grid from '@mui/material/Grid2';

import { LocalizationProvider, MobileDateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';

import { useCallback, useMemo } from 'react';

import { customersApi, professionalsApi } from 'api';
import { gridSpacing } from 'store/constant';

const BASE_EVENT = {
  title: '',
  description: '',
  customer: '',
  professional: '',
  services: [],
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  status: 'Agendado'
};

const validationSchema = Yup.object().shape({
  title: Yup.string().required('Título é obrigatório'),
  customer: Yup.string().required('Cliente é obrigatório'),
  professional: Yup.string().required('Profissional é obrigatório'),
  services: Yup.array().min(1, 'Pelo menos um serviço é obrigatório'),
  startDate: Yup.string().required('Data de início é obrigatória'),
  startTime: Yup.string().required('Horário de início é obrigatório'),
  endDate: Yup.string().required('Data de término é obrigatória'),
  endTime: Yup.string().required('Horário de término é obrigatório'),
  status: Yup.string().oneOf(['Agendado', 'Cancelado', 'Bloqueio', 'Pré-Agendado'], 'Status inválido')
});

const buildInitialValues = (event, range) => {
  if (event) {
    return {
      ...BASE_EVENT,
      ...event,
      startDateTime: event.startDateTime || new Date(`${event.startDate}T${event.startTime}`),
      endDateTime: event.endDateTime || new Date(`${event.endDate}T${event.endTime}`),
      services: event.services || []
    };
  }

  if (range) {
    return {
      ...BASE_EVENT,
      startDateTime: range.start,
      endDateTime: range.end,
      startDate: range.start.toISOString().split('T')[0],
      startTime: range.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      endDate: range.end.toISOString().split('T')[0],
      endTime: range.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  }

  return BASE_EVENT;
};

export default function AddEventForm({ event, range, handleDelete, handleCreate, handleUpdate, onCancel }) {
  const isReadOnly = event?.status === 'Cancelado';
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [customersResponse, professionalsResponse] = await Promise.all([customersApi.list(), professionalsApi.list()]);

        setCustomers(
          (customersResponse.data || []).map(({ _id, fullName }) => ({
            id: _id,
            name: fullName
          }))
        );

        setProfessionals(
          (professionalsResponse.data || []).map(({ _id, fullName }) => ({
            id: _id,
            name: fullName
          }))
        );
      } catch (error) {
        setError('Erro ao carregar dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const initialValues = useMemo(() => buildInitialValues(event, range), [event, range]);

  const formik = useFormik({
    initialValues,
    validationSchema: validationSchema,
    onSubmit: useCallback(
      async (values, helpers) => {
        if (isReadOnly || isDeleting) {
          return;
        }

        setConflictError(null);
        setError(null);

        try {
          const payload = {
            ...values,
            services: values.services,
            startDate: values.startDate,
            endDate: values.endDate,
            startTime: values.startTime,
            endTime: values.endTime,
            timezone: 'America/Sao_Paulo'
          };

          // Remove schedule from payload since it's not being used
          delete payload.schedule;

          console.log('Sending payload:', payload);

          if (event?.id) {
            await handleUpdate(event.id, payload);
          } else {
            await handleCreate(payload);
          }
          onCancel();
        } catch (error) {
          console.error('Error in form submission:', error);
          setError('Erro ao salvar o agendamento');
        } finally {
          helpers.setSubmitting(false);
        }
      },
      [event, handleCreate, handleUpdate, onCancel, isDeleting, isReadOnly]
    )
  });

  const { values, errors, touched, isSubmitting, getFieldProps, handleSubmit, setFieldValue } = formik;

  useEffect(() => {
    const loadProfessionalServices = async () => {
      if (!values.professional) {
        setAvailableServices([]);
        return;
      }

      try {
        setLoading(true);
        const response = await professionalsApi.getServices(values.professional);
        setAvailableServices(
          (response.data || []).map(({ _id, name, duration }) => ({
            id: _id,
            name,
            duration
          }))
        );
      } catch (error) {
        setError('Erro ao carregar serviços do profissional. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadProfessionalServices();
  }, [values.professional]);

  useEffect(() => {
    if (values.allDay && values.startDateTime) {
      const endOfDay = new Date(values.startDateTime);
      endOfDay.setHours(23, 59, 0, 0);

      setFieldValue('endDateTime', endOfDay);
      setFieldValue('endDate', endOfDay.toISOString().split('T')[0]);
      setFieldValue('endTime', endOfDay.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [values.allDay, values.startDateTime, setFieldValue]);

  const getSelectedServices = () => {
    if (!values.services || !services.length) {
      return [];
    }
    return services.filter((service) => values.services.includes(service.id));
  };

  const handleServiceChange = (event, newValue) => {
    const selectedServices = Array.isArray(newValue) ? newValue : [newValue];
    setFieldValue('services', selectedServices);

    // Calculate end time based on service duration
    if (selectedServices.length > 0 && values.startDate && values.startTime) {
      const totalDuration = selectedServices.reduce((acc, service) => {
        const serviceData = availableServices.find((s) => s.id === service);
        return acc + (serviceData?.duration || 0);
      }, 0);

      if (totalDuration > 0) {
        const [hours, minutes] = values.startTime.split(':').map(Number);
        const startDate = new Date(values.startDate);
        startDate.setHours(hours, minutes);

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + totalDuration);

        setFieldValue('endDate', endDate.toISOString().split('T')[0]);
        setFieldValue('endTime', endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    }
  };

  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true);
      const isPermanent = event?.status === 'Cancelado';

      await handleDelete(event.id, isPermanent);
      onCancel();
    } catch (error) {
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <FormikProvider value={formik}>
        <Form
          noValidate
          onSubmit={(e) => {
            console.log('Form submit event triggered');
            formik.handleSubmit(e);
          }}
          autoComplete="off"
          disabled={isReadOnly}
        >
          <DialogTitle>Agendamento</DialogTitle>
          <Divider />

          <DialogContent sx={{ p: 3 }}>
            {(conflictError || error) && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  '& .MuiAlert-message': {
                    whiteSpace: 'pre-line'
                  }
                }}
                onClose={() => {
                  setConflictError(null);
                  setError(null);
                }}
              >
                {conflictError || error}
              </Alert>
            )}
            <Grid container spacing={gridSpacing}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Título"
                  {...getFieldProps('title')}
                  error={Boolean(touched.title && errors.title)}
                  helperText={touched.title && errors.title}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descrição"
                  {...getFieldProps('description')}
                  error={Boolean(touched.description && errors.description)}
                  helperText={touched.description && errors.description}
                />
              </Grid>

              <Grid size={12}>
                <FormControlLabel
                  control={<Switch name="allDay" checked={values.allDay} onChange={(e, checked) => setFieldValue('allDay', checked)} />}
                  label="Dia Inteiro"
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  select
                  fullWidth
                  label="Cliente"
                  {...getFieldProps('customer')}
                  error={Boolean(touched.customer && errors.customer)}
                  helperText={touched.customer && errors.customer}
                  disabled={loading || isReadOnly}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) return;
                      const customer = customers.find((c) => c.id === selected);
                      return customer ? customer.name : selected;
                    }
                  }}
                >
                  {loading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Carregando...
                    </MenuItem>
                  ) : error ? (
                    <MenuItem disabled>{error}</MenuItem>
                  ) : customers.length === 0 ? (
                    <MenuItem disabled>Nenhum cliente encontrado</MenuItem>
                  ) : (
                    customers.map(({ id, name }) => (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              <Grid size={12}>
                <TextField
                  select
                  fullWidth
                  label="Profissional"
                  {...getFieldProps('professional')}
                  error={Boolean(touched.professional && errors.professional)}
                  helperText={touched.professional && errors.professional}
                  disabled={loading || isReadOnly}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) return;
                      const professional = professionals.find((p) => p.id === selected);
                      return professional ? professional.name : selected;
                    }
                  }}
                >
                  {loading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Carregando...
                    </MenuItem>
                  ) : error ? (
                    <MenuItem disabled>{error}</MenuItem>
                  ) : professionals.length === 0 ? (
                    <MenuItem disabled>Nenhum profissional encontrado</MenuItem>
                  ) : (
                    professionals.map(({ id, name }) => (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              <Grid size={12}>
                <TextField
                  select
                  fullWidth
                  multiple
                  label="Serviços"
                  value={Array.isArray(values.services) ? values.services : []}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFieldValue('services', Array.isArray(selected) ? selected : []);
                  }}
                  error={Boolean(touched.services && errors.services)}
                  helperText={touched.services && errors.services}
                  disabled={loading || isReadOnly || !values.professional}
                  SelectProps={{
                    multiple: true,
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected || !Array.isArray(selected) || !selected.length) return '';
                      return selected
                        .map((id) => {
                          const service = availableServices.find((s) => s.id === id);
                          return service ? service.name : id;
                        })
                        .filter(Boolean)
                        .join(', ');
                    }
                  }}
                >
                  {loading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Carregando...
                    </MenuItem>
                  ) : error ? (
                    <MenuItem disabled>{error}</MenuItem>
                  ) : !values.professional ? (
                    <MenuItem disabled>Selecione um profissional primeiro</MenuItem>
                  ) : availableServices.length === 0 ? (
                    <MenuItem disabled>Nenhum serviço disponível para este profissional</MenuItem>
                  ) : (
                    availableServices.map(({ id, name }) => (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <MobileDateTimePicker
                  label="Data e Hora de Início"
                  value={values.startDateTime}
                  format="dd/MM/yyyy HH:mm"
                  onChange={(date) => {
                    if (date) {
                      setFieldValue('startDateTime', date);
                      setFieldValue('startDate', date.toISOString().split('T')[0]);
                      setFieldValue('startTime', date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

                      // Recalculate end time if services are selected
                      if (values.services && values.services.length > 0) {
                        const totalDuration = values.services.reduce((acc, service) => {
                          const serviceData = availableServices.find((s) => s.id === service);
                          return acc + (serviceData?.duration || 0);
                        }, 0);

                        if (totalDuration > 0) {
                          const endDate = new Date(date);
                          endDate.setHours(endDate.getHours() + totalDuration);
                          setFieldValue('endDateTime', endDate);
                          setFieldValue('endDate', endDate.toISOString().split('T')[0]);
                          setFieldValue('endTime', endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                        }
                      }
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(touched.startDate && errors.startDate),
                      helperText: touched.startDate && errors.startDate,
                      InputProps: {
                        endAdornment: (
                          <InputAdornment position="end" sx={{ cursor: 'pointer' }}>
                            <DateRangeIcon />
                          </InputAdornment>
                        )
                      }
                    }
                  }}
                />
              </Grid>

              {!values.allDay ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <MobileDateTimePicker
                    label="Data e Hora de Término"
                    value={values.endDateTime}
                    format="dd/MM/yyyy HH:mm"
                    onChange={(date) => {
                      if (date) {
                        setFieldValue('endDateTime', date);
                        setFieldValue('endDate', date.toISOString().split('T')[0]);
                        setFieldValue('endTime', date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: Boolean(touched.endDate && errors.endDate),
                        helperText: touched.endDate && errors.endDate,
                        InputProps: {
                          endAdornment: (
                            <InputAdornment position="end" sx={{ cursor: 'pointer' }}>
                              <DateRangeIcon />
                            </InputAdornment>
                          )
                        }
                      }
                    }}
                  />
                </Grid>
              ) : (
                <Grid size={12}>
                  <FormHelperText>Em evento de dia inteiro, término igual ao início.</FormHelperText>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            {event ? (
              <IconButton onClick={() => setConfirmingDelete(true)} size="large" disabled={confirmingDelete || isDeleting}>
                <DeleteIcon color="error" />
              </IconButton>
            ) : (
              <span />
            )}

            <Stack direction="row" spacing={2}>
              {confirmingDelete ? (
                <>
                  <Button variant="outlined" onClick={() => setConfirmingDelete(false)} disabled={isDeleting}>
                    Voltar
                  </Button>
                  <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={isDeleting}>
                    {event?.status === 'Cancelado' ? 'Excluir Permanentemente' : 'Cancelar Evento'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outlined" onClick={onCancel} disabled={isSubmitting || isDeleting}>
                    Cancelar
                  </Button>
                  {!isReadOnly && (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting || isDeleting}
                      onClick={() => {
                        console.log('Save button clicked');
                        console.log('Form values:', formik.values);
                        console.log('Form errors:', formik.errors);
                      }}
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </DialogActions>
        </Form>
      </FormikProvider>
    </LocalizationProvider>
  );
}

AddEventForm.propTypes = {
  event: PropTypes.object,
  range: PropTypes.object,
  handleDelete: PropTypes.func.isRequired,
  handleCreate: PropTypes.func.isRequired,
  handleUpdate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
