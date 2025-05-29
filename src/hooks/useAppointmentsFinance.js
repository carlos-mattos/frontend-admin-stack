import { useState, useCallback } from 'react';
import { appointmentsApi, appointmentsFinanceApi } from 'api';
import { AppointmentStatus, PaymentStatus } from '../views/application/calendar/AppointmentStatus';

export const useAppointmentsFinance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shouldTrackFinance = useCallback((appointmentData) => {
    return appointmentData.status !== AppointmentStatus.BLOCKED;
  }, []);

  const registerPayment = useCallback(async (appointmentId, method) => {
    try {
      setLoading(true);
      const response = await appointmentsApi.update(appointmentId, {
        paymentStatus: PaymentStatus.PAID,
        paymentMethodId: method
      });
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAppointmentCreate = useCallback(
    async (appointmentData) => {
      try {
        setLoading(true);

        if (shouldTrackFinance(appointmentData)) {
          const servicesArray = Array.isArray(appointmentData.services)
            ? appointmentData.services.map((s) => (typeof s === 'string' ? s : s.id))
            : [];

          const financePayload = {
            title: appointmentData.title,
            description: appointmentData.description,
            customer: appointmentData.customer,
            professional: appointmentData.professional,
            services: servicesArray,
            startDate: appointmentData.startDate,
            startTime: appointmentData.startTime,
            endDate: appointmentData.endDate,
            endTime: appointmentData.endTime,
            status: appointmentData.status,
            amount: appointmentData.amount
          };
          const response = await appointmentsFinanceApi.create(financePayload);
          return response.data;
        } else {
          const response = await appointmentsApi.create(appointmentData);
          return response.data;
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [shouldTrackFinance]
  );

  const handleAppointmentUpdate = useCallback(async (appointmentId, appointmentData) => {
    try {
      setLoading(true);
      const minimalPayload = {
        title: appointmentData.title,
        description: appointmentData.description
      };
      const response = await appointmentsApi.update(appointmentId, minimalPayload);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    registerPayment,
    handleAppointmentCreate,
    handleAppointmentUpdate,
    shouldTrackFinance
  };
};
