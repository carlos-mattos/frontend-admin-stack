// CalendarStyled.jsx
import { styled } from '@mui/material/styles';
import { ThemeMode } from 'config';

const ExperimentalStyled = styled('div')(({ theme }) => ({
  // hide license message
  '& .fc-license-message': {
    display: 'none'
  },

  // basic style for FullCalendar
  '& .fc': {
    '--fc-bg-event-opacity': 1,
    '--fc-border-color': theme.palette.divider,
    '--fc-daygrid-event-dot-width': '10px',
    '--fc-today-bg-color': theme.palette.mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.primary.light,
    '--fc-list-event-dot-width': '10px',
    '--fc-event-border-color': theme.palette.primary.dark,
    '--fc-now-indicator-color': theme.palette.error.main,
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily
  },

  // date text styling
  '& .fc .fc-daygrid-day-top': {
    display: 'grid',
    '& .fc-daygrid-day-number': {
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 12
    }
  },

  // weekday header
  '& .fc .fc-col-header-cell': {
    backgroundColor: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark.main : theme.palette.grey[50]
  },

  '& .fc .fc-col-header-cell-cushion': {
    color: theme.palette.grey[900],
    padding: 16
  },
  '& .fc-theme-standard .fc-list': {
    overflowX: 'auto'
  },

  // events margins and border radius
  '& .fc-direction-ltr .fc-daygrid-event.fc-event-end, .fc-direction-rtl .fc-daygrid-event.fc-event-start': {
    marginLeft: 4,
    marginBottom: 6,
    borderRadius: '6px'
  },

  '& .fc-direction-ltr .fc-daygrid-event.fc-event-start, .fc-direction-rtl .fc-daygrid-event.fc-event-end': {
    marginLeft: 4,
    marginBottom: 6,
    borderRadius: '6px'
  },

  '& .fc-h-event .fc-event-main': {
    padding: 4,
    paddingLeft: 8
  },

  // popover when multiple events
  '& .fc .fc-more-popover': {
    border: 'none',
    borderRadius: '14px'
  },

  '& .fc .fc-more-popover .fc-popover-body': {
    backgroundColor: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.grey[200],
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px'
  },

  '& .fc .fc-popover-header': {
    padding: 12,
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    backgroundColor: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.grey[200],
    color: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark.light : theme.palette.text.primary
  },

  // agenda view
  '& .fc-theme-standard .fc-list-day-cushion': {
    backgroundColor: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark.main : theme.palette.grey[100]
  },

  '& .fc .fc-list-event:hover td': {
    backgroundColor: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.grey[100]
  },

  '& .fc-timegrid-event-harness-inset .fc-timegrid-event, .fc-timegrid-event.fc-event-mirror, .fc-timegrid-more-link': {
    padding: 8,
    margin: 2
  },

  '.agendado': {
    backgroundColor: '#2196f3',
    '& .fc-event-title': {
      color: '#ffffff'
    }
  },

  '.preagendado': {
    backgroundColor: '#8c8c8c',
    '& .fc-event-title': {
      color: '#ffffff'
    }
  },

  '.cancelado': {
    backgroundColor: '#f44336',
    '& .fc-event-title': {
      color: '#ffffff',
      textDecoration: 'line-through'
    }
  },

  '.bloqueio': {
    backgroundColor: '#faad14',
    '& .fc-event-title': {
      color: '#ffffff'
    }
  },

  '& .fc-list-event': {
    '&:hover': {
      backgroundColor: theme.palette.mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.grey[100]
    }
  }
}));

export default ExperimentalStyled;
