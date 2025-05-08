import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  FormControlLabel,
  Checkbox,
  FormGroup
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import { schedulesApi } from 'api/index';

const weekDays = [
  { value: 'Monday', label: 'Segunda-feira' },
  { value: 'Tuesday', label: 'Terça-feira' },
  { value: 'Wednesday', label: 'Quarta-feira' },
  { value: 'Thursday', label: 'Quinta-feira' },
  { value: 'Friday', label: 'Sexta-feira' },
  { value: 'Saturday', label: 'Sábado' },
  { value: 'Sunday', label: 'Domingo' }
];

const recurrenceTypes = [
  { value: 'none', label: 'Sem recorrência' },
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'custom', label: 'Personalizado' }
];

export default function ScheduleForm() {
  const { id, scheduleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endTime: '',
    timezone: 'America/Sao_Paulo',
    status: 'scheduled',
    recurrence: 'none',
    repeatUntil: '',
    customRecurrenceDays: []
  });

  useEffect(() => {
    if (scheduleId) {
      loadSchedule();
    }
  }, [scheduleId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const { data } = await schedulesApi.get(scheduleId);
      setFormData({
        ...data,
        startDate: data.startDate.split('T')[0],
        repeatUntil: data.repeatUntil?.split('T')[0] || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar horário');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomDaysChange = (day) => (event) => {
    const checked = event.target.checked;
    setFormData((prev) => ({
      ...prev,
      customRecurrenceDays: checked ? [...prev.customRecurrenceDays, day] : prev.customRecurrenceDays.filter((d) => d !== day)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (formData.recurrence !== 'none' && !formData.repeatUntil) {
        setError('O campo "Repetir até" é obrigatório quando há recorrência');
        setLoading(false);
        return;
      }

      const { _id, ...payloadWithoutId } = formData;
      const payload = {
        ...payloadWithoutId,
        professional: id,
        endDate: formData.startDate
      };

      if (scheduleId) {
        await schedulesApi.update(scheduleId, payload);
      } else {
        await schedulesApi.create(payload);
      }

      navigate(`/apps/profissionais/${id}/agenda`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar horário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard title={scheduleId ? 'Editar Horário' : 'Novo Horário'}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/apps/profissionais/${id}/agenda`)}>
            Voltar
          </Button>
        </Stack>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="date"
                label="Data do Agendamento"
                value={formData.startDate}
                onChange={handleChange('startDate')}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="time"
                label="Horário Inicial"
                value={formData.startTime}
                onChange={handleChange('startTime')}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="time"
                label="Horário Final"
                value={formData.endTime}
                onChange={handleChange('endTime')}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Recorrência"
                value={formData.recurrence}
                onChange={handleChange('recurrence')}
                disabled={loading}
              >
                {recurrenceTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {formData.recurrence !== 'none' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Repetir até"
                  value={formData.repeatUntil}
                  onChange={handleChange('repeatUntil')}
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                  error={formData.recurrence !== 'none' && !formData.repeatUntil}
                  helperText={formData.recurrence !== 'none' && !formData.repeatUntil ? 'Campo obrigatório quando há recorrência' : ''}
                />
              </Grid>
            )}
            {formData.recurrence === 'custom' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Dias da Semana
                </Typography>
                <FormGroup row>
                  {weekDays.map((day) => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={formData.customRecurrenceDays.includes(day.value)}
                          onChange={handleCustomDaysChange(day.value)}
                          disabled={loading}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              </Grid>
            )}
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate(`/apps/profissionais/${id}/agenda`)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              Salvar
            </Button>
          </Stack>
        </form>
      </CardContent>
    </MainCard>
  );
}
