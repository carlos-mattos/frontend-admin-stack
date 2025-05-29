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

import { appointmentsApi, customersApi, professionalsApi } from 'api';
import { useAppointmentsFinance } from 'hooks/useAppointmentsFinance';
import { gridSpacing } from 'store/constant';
import { AppointmentStatus } from './AppointmentStatus';

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
  status: AppointmentStatus.SCHEDULED
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
  status: Yup.string().oneOf(Object.values(AppointmentStatus), 'Status inválido')
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

  const now = new Date();
  return {
    ...BASE_EVENT,
    startDateTime: now,
    endDateTime: null,
    startDate: now.toISOString().split('T')[0],
    startTime: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    endDate: '',
    endTime: ''
  };
};

export default function AddEventForm({ event, range, onSuccess, onCancel, onDelete }) {
  const isReadOnly = event?.status === AppointmentStatus.CANCELLED;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  const { handleAppointmentCreate, handleAppointmentUpdate } = useAppointmentsFinance();

  const isEditMode = !!(event && event.id);

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
          if (values.allDay) {
            values.endDate = values.startDate;
            values.endTime = '23:59';
          }

          const availabilityCheck = await appointmentsApi.checkAvailability({
            professional: values.professional,
            startDate: values.startDate,
            startTime: values.startTime,
            endDate: values.endDate,
            endTime: values.endTime,
            excludeId: event?.id || null
          });

          if (!availabilityCheck.data.available) {
            setConflictError('Não é possível agendar neste horário. Por favor, selecione outro.');
            helpers.setSubmitting(false);
            return;
          }

          const amount = (values.services || []).reduce((total, serviceId) => {
            const serviceObj = availableServices.find((s) => s.id === serviceId);
            return total + (serviceObj?.price || 0);
          }, 0);

          const payload = {
            ...values,
            services: values.services,
            startDate: values.startDate,
            endDate: values.endDate,
            startTime: values.startTime,
            endTime: values.endTime,
            timezone: 'America/Sao_Paulo',
            amount
          };

          delete payload.schedule;

          if (event?.id) {
            await handleAppointmentUpdate(event.id, payload);
          } else {
            await handleAppointmentCreate(payload);
          }
          if (onSuccess) onSuccess();
          onCancel();
        } catch (error) {
          console.error('Error in form submission:', error);
          setError(
            <>
              Erro ao salvar o agendamento. Verifique se o profissional possui agenda no horário selecionado.{' '}
              <a
                href={`professionals/${values.professional}/schedule`}
                style={{ color: '#1976d2', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                aqui
              </a>
              .
            </>
          );
        } finally {
          helpers.setSubmitting(false);
        }
      },
      [event, onSuccess, onCancel, isDeleting, isReadOnly, handleAppointmentCreate, handleAppointmentUpdate, availableServices]
    )
  });

  const { values, errors, touched, isSubmitting, getFieldProps, setFieldValue } = formik;

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
          (response.data || []).map(({ _id, name, duration, price }) => ({
            id: _id,
            name,
            duration,
            price
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

  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true);
      const isPermanent = event?.status === AppointmentStatus.CANCELLED;
      await onDelete(event.id, isPermanent);
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
                  disabled={isReadOnly}
                />
              </Grid>

              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="allDay"
                      checked={values.allDay}
                      onChange={(e, checked) => {
                        if (!isReadOnly && !isEditMode) setFieldValue('allDay', checked);
                      }}
                      disabled={isEditMode}
                    />
                  }
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
                  disabled={isEditMode}
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
                  disabled={isEditMode}
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
                  onChange={
                    isEditMode
                      ? () => {}
                      : (e) => {
                          const selected = e.target.value;
                          setFieldValue('services', Array.isArray(selected) ? selected : []);
                        }
                  }
                  error={Boolean(touched.services && errors.services)}
                  helperText={touched.services && errors.services}
                  disabled={isEditMode}
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
                  onChange={
                    isEditMode
                      ? () => {}
                      : (date) => {
                          setFieldValue('startDateTime', date);
                          setFieldValue('startDate', date.toISOString().split('T')[0]);
                          setFieldValue('startTime', date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
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
                  }
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
                        ),
                        readOnly: isEditMode,
                        disabled: isEditMode
                      }
                    }
                  }}
                  disabled={isEditMode}
                />
              </Grid>

              {!values.allDay ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <MobileDateTimePicker
                    label="Data e Hora de Término"
                    value={values.endDateTime}
                    format="dd/MM/yyyy HH:mm"
                    onChange={
                      isEditMode
                        ? () => {}
                        : (date) => {
                            setFieldValue('endDateTime', date);
                            setFieldValue('endDate', date.toISOString().split('T')[0]);
                            setFieldValue('endTime', date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                          }
                    }
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
                          ),
                          readOnly: isEditMode,
                          disabled: isEditMode
                        }
                      }
                    }}
                    disabled={isEditMode}
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
                    {event?.status === AppointmentStatus.CANCELLED ? 'Excluir Permanentemente' : 'Cancelar Evento'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outlined" onClick={onCancel} disabled={isSubmitting || isDeleting || isReadOnly}>
                    Cancelar
                  </Button>
                  {!isReadOnly && (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting || isDeleting || isReadOnly}
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
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};
