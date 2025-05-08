import { Button, Dialog, useMediaQuery } from '@mui/material';
import { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';

import AddEventForm from './AddEventForm';
import BlockEventForm from './BlockEventForm';
import Toolbar from './Toolbar';
import CalendarStyled from './CalendarStyled';
import Loader from 'ui-component/Loader';
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';

import AddAlarmTwoToneIcon from '@mui/icons-material/AddAlarmTwoTone';
import BlockIcon from '@mui/icons-material/Block';
import { ptBR } from 'date-fns/locale';

import { appointmentsApi } from 'api';

const normalize = (src) => {
  if (src.start instanceof Date) {
    return {
      ...src.extendedProps,
      startDate: format(src.start, 'yyyy-MM-dd'),
      startTime: format(src.start, 'HH:mm'),
      endDate: format(src.end, 'yyyy-MM-dd'),
      endTime: format(src.end, 'HH:mm')
    };
  }
  return src;
};

const formatEvent = (event) => {
  if (!event || !event.startDate || !event.startTime) {
    return null;
  }

  try {
    const startDateTime = new Date(`${event.startDate}T${event.startTime}:00`);
    const endDateTime = new Date(`${event.endDate}T${event.endTime}:00`);

    const status = event.status || 'Agendado';
    const firstService = Array.isArray(event.services) && event.services.length ? event.services[0] : event.service;

    return {
      id: event._id,
      title: event.title || `${event.customer?.fullName || 'Cliente não definido'} - ${firstService?.name || 'Serviço não definido'}`,
      start: startDateTime,
      end: endDateTime,
      allDay: false,
      color: event.status,
      textColor: '#ffffff',
      customer: event.customer?._id,
      professional: event.professional?._id,
      services: event.services?.map((s) => s._id) ?? [],
      status: event.status,
      description: event.description || '',
      classNames: [status.toLowerCase().replace(' ', '')],
      startDateTime,
      endDateTime
    };
  } catch (error) {
    return null;
  }
};

export default function Calendar({ initialEvents = [], customersList = [], professionalsList = [], servicesList = [] }) {
  const ref = useRef(null);
  const sm = useMediaQuery((t) => t.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(sm ? 'listWeek' : 'dayGridMonth');
  const [modal, setModal] = useState({ type: null, event: null, range: null });

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentsApi.list();
      const formattedEvents = response.data.map(formatEvent).filter(Boolean);
      setEvents(formattedEvents);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const api = () => ref.current?.getApi();
  const navigate = (method) => {
    api()?.[method]();
    setDate(api()?.getDate());
  };
  const changeView = (v) => {
    api()?.changeView(v);
    setView(v);
  };
  useEffect(() => changeView(sm ? 'listWeek' : 'dayGridMonth'), [sm]);

  const handleCreate = async (raw) => {
    try {
      const data = normalize(raw);
      const payload = { ...data, timezone: 'America/Sao_Paulo' };

      const availabilityCheck = await appointmentsApi.checkAvailability({
        professional: payload.professional,
        startDate: payload.startDate,
        startTime: payload.startTime,
        endDate: payload.endDate,
        endTime: payload.endTime,
        excludeId: null
      });

      if (!availabilityCheck.data.available) {
        throw new Error('Conflito de horário detectado');
      }

      const response = await appointmentsApi.create({
        ...payload,
        schedule: availabilityCheck.data.scheduleId
      });

      if (response.data) {
        await loadEvents();
      }
    } catch (error) {
      throw error;
    }
  };

  const handleUpdate = async (id, raw) => {
    try {
      const data = normalize(raw);
      const payload = { ...data, timezone: 'America/Sao_Paulo' };

      const availabilityCheck = await appointmentsApi.checkAvailability({
        professional: payload.professional,
        startDate: payload.startDate,
        startTime: payload.startTime,
        endDate: payload.endDate,
        endTime: payload.endTime,
        excludeId: id
      });

      if (!availabilityCheck.data.available) {
        throw new Error('Conflito de horário detectado');
      }

      const response = await appointmentsApi.update(id, {
        ...payload,
        schedule: availabilityCheck.data.scheduleId
      });

      if (response.data) {
        await loadEvents();
      }
    } catch (error) {
      throw error;
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentsApi.updateStatus(id, { status });
      await loadEvents();
    } catch (error) {
      throw error;
    }
  };

  const del = async (id, isPermanent = false) => {
    try {
      const event = events.find((e) => e.id === id);

      if (isPermanent) {
        await appointmentsApi.remove(id);
        setEvents((e) => e.filter((ev) => ev.id !== id));
      } else {
        const payload = {
          ...event,
          status: 'Cancelado',
          startDate: event.startDate,
          startTime: event.startTime,
          endDate: event.endDate,
          endTime: event.endTime
        };

        await appointmentsApi.update(id, payload);
        await loadEvents();
      }
    } catch (error) {}
  };

  const openModal = (type, payload = {}) => setModal({ type, ...payload });
  const closeModal = () => setModal({ type: null, event: null, range: null });

  const onSelectRange = (arg) => {
    api().unselect();
    openModal('event', { range: { start: arg.start, end: arg.end } });
  };

  const onSelectEvent = ({ event }) => {
    const copy = {
      id: event.id,
      title: event.title,
      ...event.extendedProps,
      startDateTime: new Date(event.start),
      endDateTime: new Date(event.end),
      startDate: event.start.toISOString().split('T')[0],
      startTime: event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      endDate: event.end.toISOString().split('T')[0],
      endTime: event.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const isBlock = copy.status === 'Bloqueio' || (!copy.customer && (!copy.services || copy.services.length === 0));

    openModal(isBlock ? 'block' : 'event', { event: copy });
  };

  if (loading) return <Loader />;

  return (
    <MainCard
      title=" "
      secondary={
        <>
          <Button variant="contained" color="secondary" onClick={() => openModal('event')} sx={{ mr: 1 }}>
            <AddAlarmTwoToneIcon fontSize="small" sx={{ mr: 0.75 }} /> Novo
          </Button>
          <Button
            variant="outlined"
            onClick={() => openModal('block')}
            startIcon={<BlockIcon />}
            sx={{ color: (t) => t.palette.grey[700], borderColor: (t) => t.palette.grey[500] }}
          >
            Bloqueio
          </Button>
        </>
      }
    >
      <CalendarStyled>
        <Toolbar
          date={date}
          view={view}
          onClickToday={() => navigate('today')}
          onClickPrev={() => navigate('prev')}
          onClickNext={() => navigate('next')}
          onChangeView={changeView}
        />
        <SubCard>
          <FullCalendar
            ref={ref}
            plugins={[listPlugin, dayGridPlugin, timelinePlugin, timeGridPlugin, interactionPlugin]}
            locale={ptBR}
            events={events}
            height={sm ? 'auto' : 720}
            initialDate={date}
            initialView={view}
            selectable
            editable
            droppable
            eventDisplay="block"
            dayMaxEventRows={3}
            headerToolbar={false}
            allDayMaintainDuration
            eventResizableFromStart
            select={onSelectRange}
            eventClick={onSelectEvent}
            eventDrop={({ event }) => handleUpdate(event.id, event)}
            eventResize={({ event }) => handleUpdate(event.id, event)}
            eventDidMount={({ el, event }) => {
              const status = event.status?.toLowerCase().replace(' ', '') || 'agendado';
              el.classList.add(status);
            }}
            timeZone="America/Sao_Paulo"
          />
        </SubCard>
      </CalendarStyled>

      <Dialog maxWidth="sm" fullWidth open={!!modal.type} onClose={closeModal} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
        {modal.type === 'event' && (
          <AddEventForm
            event={modal.event}
            range={modal.range}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            handleDelete={del}
            onCancel={closeModal}
            customersList={customersList}
            professionalsList={professionalsList}
            servicesList={servicesList}
          />
        )}
        {modal.type === 'block' && (
          <BlockEventForm
            event={modal.event}
            handleCreate={async (data) => {
              try {
                if (modal.event?.id) {
                  await handleUpdate(modal.event.id, { ...data, status: 'Bloqueio' });
                } else {
                  await handleCreate({ ...data, status: 'Bloqueio' });
                }
                await loadEvents();
              } catch (error) {
                throw error;
              }
            }}
            handleDelete={del}
            onCancel={closeModal}
          />
        )}
      </Dialog>
    </MainCard>
  );
}
