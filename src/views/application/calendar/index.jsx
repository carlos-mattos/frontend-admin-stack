import { Button, Dialog, useMediaQuery } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';

import Loader from 'ui-component/Loader';
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import AddEventForm from './AddEventForm';
import { AppointmentStatus, getStatusClassName } from './AppointmentStatus';
import BlockEventForm from './BlockEventForm';
import CalendarStyled from './CalendarStyled';
import Toolbar from './Toolbar';

import AddAlarmTwoToneIcon from '@mui/icons-material/AddAlarmTwoTone';
import BlockIcon from '@mui/icons-material/Block';
import { ptBR } from 'date-fns/locale';

import { appointmentsApi } from 'api';
import { formatInTimeZone } from 'date-fns-tz';

const formatEvent = (event) => {
  if (!event || !event.startDate) {
    return null;
  }

  try {
    const timeZone = 'America/Sao_Paulo';
    const startDateTime = new Date(`${event.startDate}T${event.startTime}`);
    const endDateTime = new Date(`${event.endDate}T${event.endTime}`);

    const status = event.status || AppointmentStatus.SCHEDULED;
    const firstService = Array.isArray(event.serviceIds) && event.serviceIds.length ? event.serviceIds[0] : null;

    return {
      id: event._id,
      title:
        event.title !== undefined && event.title !== null
          ? event.title
          : `${event.customerId?.fullName || 'Cliente não definido'} - ${firstService || 'Serviço não definido'}`,
      start: formatInTimeZone(startDateTime, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      end: formatInTimeZone(endDateTime, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      allDay: false,
      color: status,
      textColor: '#ffffff',
      classNames: [getStatusClassName(status)],
      startDateTime,
      endDateTime,
      extendedProps: {
        startDate: event.startDate,
        startTime: event.startTime,
        endDate: event.endDate,
        endTime: event.endTime,
        customer: event.customerId?._id,
        professional: event.professionalId?._id,
        services: event.serviceIds ?? [],
        status: status,
        description: event.description || ''
      }
    };
  } catch (error) {
    console.error('Error formatting event:', error);
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
      console.log('formattedEvents', formattedEvents);

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

  const del = async (id, isPermanent = false) => {
    try {
      if (isPermanent) {
        await appointmentsApi.remove(id);
        setEvents((e) => e.filter((ev) => ev.id !== id));
      } else {
        await appointmentsApi.updateStatus(id, { status: AppointmentStatus.CANCELLED });
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
      startDate: event.extendedProps?.startDate || event.extendedProps.startDate || '',
      startTime: event.extendedProps?.startTime || event.extendedProps.startTime || '',
      endDate: event.extendedProps?.endDate || event.extendedProps.endDate || '',
      endTime: event.extendedProps?.endTime || event.extendedProps.endTime || '',
      startDateTime:
        event.extendedProps?.startDate && event.extendedProps?.startTime
          ? new Date(`${event.extendedProps.startDate}T${event.extendedProps.startTime}`)
          : event.extendedProps.startDate && event.extendedProps.startTime
            ? new Date(`${event.extendedProps.startDate}T${event.extendedProps.startTime}`)
            : null,
      endDateTime:
        event.extendedProps?.endDate && event.extendedProps?.endTime
          ? new Date(`${event.extendedProps.endDate}T${event.extendedProps.endTime}`)
          : event.extendedProps.endDate && event.extendedProps.endTime
            ? new Date(`${event.extendedProps.endDate}T${event.extendedProps.endTime}`)
            : null,
      status: event.extendedProps?.status || event.extendedProps.status,
      customer: event.extendedProps?.customer || event.extendedProps.customer,
      services: event.extendedProps?.services || event.extendedProps.services
    };

    const isBlock = copy.status === AppointmentStatus.BLOCKED || (!copy.customer && (!copy.services || copy.services.length === 0));

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
            eventDrop={({ event }) => {}}
            eventResize={({ event }) => {}}
            eventDidMount={({ el, event }) => {
              const status = event.status?.toLowerCase().replace(' ', '') || AppointmentStatus.SCHEDULED;
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
            onSuccess={loadEvents}
            onCancel={closeModal}
            onDelete={del}
            customersList={customersList}
            professionalsList={professionalsList}
            servicesList={servicesList}
          />
        )}
        {modal.type === 'block' && <BlockEventForm event={modal.event} onSuccess={loadEvents} onCancel={closeModal} onDelete={del} />}
      </Dialog>
    </MainCard>
  );
}
