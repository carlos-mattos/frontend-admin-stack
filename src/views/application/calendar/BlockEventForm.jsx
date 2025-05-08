import { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  InputAdornment,
  FormHelperText,
  Stack,
  IconButton,
  Grid2 as Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DeleteIcon from '@mui/icons-material/Delete';

import { LocalizationProvider, MobileDateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';

import { gridSpacing } from 'store/constant';
import { professionalsApi } from 'api';

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
  status: 'Bloqueio'
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
    endDateTime: now,
    startDate: format(now, 'yyyy-MM-dd'),
    startTime: format(now, 'HH:mm'),
    endDate: format(now, 'yyyy-MM-dd'),
    endTime: format(now, 'HH:mm')
  };
};

const BlockEventForm = ({ event, onCancel, handleCreate, handleDelete }) => {
  const isReadOnly = event?.status === 'Cancelado';
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

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

        const startDate = format(values.startDateTime, 'yyyy-MM-dd');
        const startTime = format(values.startDateTime, 'HH:mm');
        const endDate = format(values.endDateTime, 'yyyy-MM-dd');
        const endTime = format(values.endDateTime, 'HH:mm');

        const payload = {
          title: values.title,
          description: values.description,
          professional: values.professional,
          startDate,
          startTime,
          endDate,
          endTime,
          status: 'Bloqueio'
        };

        try {
          await handleCreate(payload);
          helpers.resetForm();
          onCancel();
        } catch (err) {
          console.error('Erro ao salvar:', err);
          if (err.response?.data?.message === 'The professional already has an appointment scheduled during this time.') {
            const conflMsg = 'Conflito: profissional já possui agendamento neste horário.';

            helpers.setFieldError('startDate', conflMsg);
            helpers.setFieldError('endDate', conflMsg);

            setConflictError('O profissional já possui um agendamento neste horário.\nPor favor, escolha outro horário.');
          } else {
            setError('Erro ao salvar o bloqueio. Por favor, tente novamente.');
          }
          helpers.setSubmitting(false);
        }
      },
      [handleCreate, onCancel, isDeleting, isReadOnly]
    )
  });

  const { values, errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue } = formik;

  // Dia inteiro → endDateTime sempre 23:59 do mesmo dia
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
        <Form noValidate onSubmit={handleSubmit} autoComplete="off">
          <DialogTitle>Bloqueio</DialogTitle>
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
                <FormControlLabel control={<Switch {...getFieldProps('allDay')} checked={values.allDay} />} label="Dia Inteiro" />
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

              <Grid size={{ xs: 12, md: 6 }}>
                <MobileDateTimePicker
                  label="Data e Hora de Início"
                  value={values.startDateTime}
                  format="dd/MM/yyyy HH:mm"
                  onChange={(d) => {
                    setFieldValue('startDateTime', d);
                    setFieldValue('startDate', format(d, 'yyyy-MM-dd'));
                    setFieldValue('startTime', format(d, 'HH:mm'));
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
                    onChange={(d) => {
                      setFieldValue('endDateTime', d);
                      setFieldValue('endDate', format(d, 'yyyy-MM-dd'));
                      setFieldValue('endTime', format(d, 'HH:mm'));
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
                    <Button type="submit" variant="contained" disabled={isSubmitting || isDeleting}>
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
};

BlockEventForm.propTypes = {
  event: PropTypes.object,
  onCancel: PropTypes.func.isRequired,
  handleCreate: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired
};

export default BlockEventForm;
