import { useState, useCallback } from 'react';
import { appointmentsApi } from 'api';

export const useAppointmentsFinance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shouldTrackFinance = useCallback((appointmentData) => {
    return appointmentData.status !== 'Bloqueio';
  }, []);

  const createExpectedRevenue = useCallback(async (appointmentId, amount) => {
    try {
      setLoading(true);
      const response = await appointmentsApi.updateStatus(appointmentId, {
        finance: {
          amount,
          status: 'expected'
        }
      });
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateToPending = useCallback(async (appointmentId) => {
    try {
      setLoading(true);
      const response = await appointmentsApi.updateStatus(appointmentId, {
        finance: {
          status: 'pending'
        }
      });
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerPayment = useCallback(async (appointmentId, method) => {
    try {
      setLoading(true);
      const response = await appointmentsApi.updateStatus(appointmentId, {
        finance: {
          status: 'paid',
          method
        }
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
        // Create appointment with initial finance status if not a block
        const createData = { ...appointmentData };

        if (shouldTrackFinance(appointmentData)) {
          createData.finance = {
            amount: appointmentData.services.reduce((total, service) => total + (service.price || 0), 0),
            status: 'expected'
          };
        }

        const appointment = await appointmentsApi.create(createData);
        return appointment.data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [shouldTrackFinance]
  );

  const handleAppointmentUpdate = useCallback(
    async (appointmentId, appointmentData) => {
      try {
        setLoading(true);
        // Update appointment and finance if services changed and not a block
        const updateData = { ...appointmentData };

        if (shouldTrackFinance(appointmentData) && appointmentData.services) {
          updateData.finance = {
            amount: appointmentData.services.reduce((total, service) => total + (service.price || 0), 0),
            status: 'expected'
          };
        }

        const appointment = await appointmentsApi.update(appointmentId, updateData);
        return appointment.data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [shouldTrackFinance]
  );

  const handleAppointmentComplete = useCallback(
    async (appointmentId, appointmentData) => {
      try {
        setLoading(true);
        // Update appointment status and finance to pending if not a block
        const updateData = {
          status: 'Concluído'
        };

        if (shouldTrackFinance(appointmentData)) {
          updateData.finance = {
            status: 'pending'
          };
        }

        const appointment = await appointmentsApi.updateStatus(appointmentId, updateData);
        return appointment.data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [shouldTrackFinance]
  );

  return {
    loading,
    error,
    createExpectedRevenue,
    updateToPending,
    registerPayment,
    handleAppointmentCreate,
    handleAppointmentUpdate,
    handleAppointmentComplete,
    shouldTrackFinance
  };
};
