import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Collapse,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import { schedulesApi } from 'api/index';

const statusColors = {
  scheduled: 'success',
  cancelled: 'error',
  completed: 'info',
  blocked: 'warning'
};

const statusTranslations = {
  scheduled: 'Agendado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  blocked: 'Bloqueado'
};

const weekDaysTranslations = {
  Monday: 'Segunda-feira',
  Tuesday: 'Terça-feira',
  Wednesday: 'Quarta-feira',
  Thursday: 'Quinta-feira',
  Friday: 'Sexta-feira',
  Saturday: 'Sábado',
  Sunday: 'Domingo'
};

const recurrenceTypes = [
  { value: 'none', label: 'Sem recorrência' },
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'custom', label: 'Personalizado' }
];

function ScheduleRow({ schedule, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr) => {
    // Criar a data em UTC
    const date = new Date(dateStr);
    // Ajustar para o timezone local
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString();
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{formatDate(schedule.startDate)}</TableCell>
        <TableCell>
          {schedule.startTime} - {schedule.endTime}
        </TableCell>
        <TableCell>{recurrenceTypes.find((r) => r.value === schedule.recurrence)?.label || 'Nenhuma'}</TableCell>
        <TableCell>
          <Chip label={statusTranslations[schedule.status]} color={statusColors[schedule.status]} size="small" />
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(schedule._id)} disabled={schedule.status === 'cancelled'}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton size="small" onClick={() => onDelete(schedule._id)} disabled={schedule.status === 'cancelled'}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="subtitle2" gutterBottom component="div">
                Detalhes
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Timezone:</strong> {schedule.timezone}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Dia da Semana:</strong> {weekDaysTranslations[schedule.dayOfWeek] || schedule.dayOfWeek}
                  </Typography>
                </Grid>
                {schedule.recurrence !== 'none' && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Repetir até:</strong> {schedule.repeatUntil ? formatDate(schedule.repeatUntil) : 'Indefinido'}
                    </Typography>
                  </Grid>
                )}
                {schedule.customRecurrenceDays?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Dias Personalizados:</strong>{' '}
                      {schedule.customRecurrenceDays.map((day) => weekDaysTranslations[day] || day).join(', ')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ProfessionalSchedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await schedulesApi.getByProfessional(id, filters);
      setSchedules(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [id, filters]);

  const handleCreateSchedule = () => {
    navigate(`/apps/profissionais/${id}/agenda/novo`);
  };

  const handleEditSchedule = (scheduleId) => {
    navigate(`/apps/profissionais/${id}/agenda/${scheduleId}/editar`);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await schedulesApi.remove(scheduleId);
      await loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao excluir horário');
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleBack = () => {
    navigate('/apps/profissionais');
  };

  // Agrupar horários por série
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = schedule.seriesId || schedule._id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {});

  return (
    <MainCard title="Agenda do Profissional">
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Voltar
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSchedule}>
            Novo Horário
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Status" value={filters.status} onChange={handleFilterChange('status')}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="scheduled">Agendado</MenuItem>
              <MenuItem value="cancelled">Cancelado</MenuItem>
              <MenuItem value="completed">Concluído</MenuItem>
              <MenuItem value="blocked">Bloqueado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Data Inicial"
              value={filters.startDate}
              onChange={handleFilterChange('startDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Data Final"
              value={filters.endDate}
              onChange={handleFilterChange('endDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>Data</TableCell>
                <TableCell>Horário</TableCell>
                <TableCell>Recorrência</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : Object.keys(groupedSchedules).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhum horário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedSchedules).map(([seriesId, seriesSchedules]) => (
                  <React.Fragment key={seriesId}>
                    {seriesSchedules.map((schedule) => (
                      <ScheduleRow key={schedule._id} schedule={schedule} onEdit={handleEditSchedule} onDelete={handleDeleteSchedule} />
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </MainCard>
  );
}
