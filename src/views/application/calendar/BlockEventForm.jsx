import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  Grid2 as Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField
} from '@mui/material';

import { LocalizationProvider, MobileDateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';

import { professionalsApi } from 'api';
import { gridSpacing } from 'store/constant';
import { AppointmentStatus } from './AppointmentStatus';
import { appointmentsApi } from 'api';
import { useAppointmentsFinance } from 'hooks/useAppointmentsFinance';

const BASE_VALUES = {
  title: '',
  description: '',
  professional: '',
  allDay: false,
  startDateTime: null,
  endDateTime: null,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  status: AppointmentStatus.BLOCKED
};

const BlockSchema = Yup.object({
  title: Yup.string().required('Nome é obrigatório'),
  description: Yup.string(),
  professional: Yup.string().required('Seleção do profissional é obrigatória'),
  startDate: Yup.string().required('Data de início é obrigatória'),
  startTime: Yup.string().required('Horário de início é obrigatório'),
  endDate: Yup.string().required('Data de término é obrigatória'),
  endTime: Yup.string().required('Horário de término é obrigatório')
});

const buildInitial = (event) => {
  if (event) {
    return {
      ...BASE_VALUES,
      ...event,
      startDateTime: event.startDateTime || new Date(`${event.startDate}T${event.startTime || '00:00'}`),
      endDateTime: event.endDateTime || new Date(`${event.endDate}T${event.endTime || '00:00'}`)
    };
  }

  const now = new Date();
  return {
    ...BASE_VALUES,
    startDateTime: now,
    endDateTime: null,
    startDate: format(now, 'yyyy-MM-dd'),
    startTime: format(now, 'HH:mm'),
    endDate: '',
    endTime: ''
  };
};

const BlockEventForm = ({ event, onSuccess, onCancel, onDelete }) => {
  const isReadOnly = event?.status === AppointmentStatus.CANCELLED;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  const isEditMode = !!(event && event.id);

  const { handleAppointmentCreate, handleAppointmentUpdate, loading: financeLoading, error: financeError } = useAppointmentsFinance();

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await professionalsApi.list();
        setProfessionals(
          (response.data || []).map(({ _id, fullName }) => ({
            id: _id,
            name: fullName
          }))
        );
      } catch (error) {
        setError('Erro ao carregar profissionais. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  const initialValues = useMemo(() => buildInitial(event), [event]);

  const formik = useFormik({
    initialValues,
    validationSchema: BlockSchema,
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
            setConflictError('Não é possível bloquear neste horário. Por favor, selecione outro.');
            helpers.setSubmitting(false);
            return;
          }

          const payload = {
            title: values.title,
            description: values.description,
            professional: values.professional,
            startDate: values.startDate,
            startTime: values.startTime,
            endDate: values.endDate,
            endTime: values.endTime,
            status: AppointmentStatus.BLOCKED
          };

          if (event?.id) {
            await handleAppointmentUpdate(event.id, payload);
          } else {
            await handleAppointmentCreate(payload);
          }
          if (onSuccess) onSuccess();
          onCancel();
        } catch (error) {
          console.error('Erro ao salvar o bloqueio:', error);
          setError('Erro ao salvar o bloqueio. Verifique se o profissional possui agenda no horário selecionado.');
        } finally {
          helpers.setSubmitting(false);
        }
      },
      [onSuccess, onCancel, isDeleting, isReadOnly, event, handleAppointmentCreate, handleAppointmentUpdate]
    )
  });

  const { values, errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue } = formik;

  useEffect(() => {
    if (values.allDay && values.startDateTime) {
      const endOfDay = new Date(values.startDateTime);
      endOfDay.setHours(23, 59, 0, 0);

      setFieldValue('endDateTime', endOfDay);
      setFieldValue('endDate', format(endOfDay, 'yyyy-MM-dd'));
      setFieldValue('endTime', format(endOfDay, 'HH:mm'));
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
        <Form noValidate onSubmit={handleSubmit} autoComplete="off">
          <DialogTitle>Bloqueio</DialogTitle>
          <Divider />

          <DialogContent sx={{ p: 3 }}>
            {(conflictError || error || financeError) && (
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
                {conflictError || error || financeError}
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
                  control={<Switch {...getFieldProps('allDay')} checked={values.allDay} disabled={isEditMode} />}
                  label="Dia Inteiro"
                />
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

              <Grid size={{ xs: 12, md: 6 }}>
                <MobileDateTimePicker
                  label="Data e Hora de Início"
                  value={values.startDateTime}
                  format="dd/MM/yyyy HH:mm"
                  onChange={
                    isEditMode
                      ? () => {}
                      : (d) => {
                          setFieldValue('startDateTime', d);
                          setFieldValue('startDate', format(d, 'yyyy-MM-dd'));
                          setFieldValue('startTime', format(d, 'HH:mm'));
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
                        : (d) => {
                            setFieldValue('endDateTime', d);
                            setFieldValue('endDate', format(d, 'yyyy-MM-dd'));
                            setFieldValue('endTime', format(d, 'HH:mm'));
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
                  <Button variant="outlined" onClick={onCancel} disabled={isSubmitting || isDeleting || isReadOnly || financeLoading}>
                    Cancelar
                  </Button>
                  {!isReadOnly && (
                    <Button type="submit" variant="contained" disabled={isSubmitting || isDeleting || isReadOnly || financeLoading}>
                      {isSubmitting || financeLoading ? 'Salvando...' : 'Salvar'}
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
};

BlockEventForm.propTypes = {
  event: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default BlockEventForm;
