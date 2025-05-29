export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  PRE_SCHEDULED: 'PRE_SCHEDULED',
  CANCELLED: 'CANCELLED',
  BLOCKED: 'BLOCKED'
};

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELED: 'CANCELED'
};

export const getStatusColor = (status) => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return '#2196f3';
    case AppointmentStatus.PRE_SCHEDULED:
      return '#8c8c8c';
    case AppointmentStatus.CANCELLED:
      return '#f44336';
    case AppointmentStatus.BLOCKED:
      return '#faad14';
    default:
      return '#2196f3';
  }
};

export const getStatusClassName = (status) => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return 'scheduled';
    case AppointmentStatus.PRE_SCHEDULED:
      return 'pre-scheduled';
    case AppointmentStatus.CANCELLED:
      return 'cancelled';
    case AppointmentStatus.BLOCKED:
      return 'blocked';
    default:
      return 'scheduled';
  }
};
