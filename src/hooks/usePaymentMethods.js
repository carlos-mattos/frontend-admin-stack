import { useState, useEffect, useCallback } from 'react';
import { PaymentMethod } from 'types/payment';

const STORAGE_KEY = 'payment_methods';

export const usePaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load methods from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMethods(JSON.parse(stored));
      } else {
        // Initialize with default methods
        const defaultMethods = [
          { id: 1, type: PaymentMethod.CASH, name: 'Dinheiro', allowPartial: false, installments: 1 },
          { id: 2, type: PaymentMethod.CREDIT, name: 'Cartão de Crédito', allowPartial: true, installments: 12 },
          { id: 3, type: PaymentMethod.DEBIT, name: 'Cartão de Débito', allowPartial: false, installments: 1 },
          { id: 4, type: PaymentMethod.PIX, name: 'PIX', allowPartial: false, installments: 1 },
          { id: 5, type: PaymentMethod.TRANSFER, name: 'Transferência', allowPartial: false, installments: 1 }
        ];
        setMethods(defaultMethods);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMethods));
      }
    } catch (err) {
      setError('Erro ao carregar métodos de pagamento');
    }
  }, []);

  const saveMethods = useCallback((newMethods) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMethods));
      setMethods(newMethods);
    } catch (err) {
      setError('Erro ao salvar métodos de pagamento');
    }
  }, []);

  const createMethod = useCallback(
    (methodData) => {
      try {
        setLoading(true);
        const newMethod = {
          id: Date.now(),
          ...methodData
        };
        const newMethods = [...methods, newMethod];
        saveMethods(newMethods);
        return newMethod;
      } catch (err) {
        setError('Erro ao criar método de pagamento');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [methods, saveMethods]
  );

  const updateMethod = useCallback(
    (id, methodData) => {
      try {
        setLoading(true);
        const newMethods = methods.map((method) =>
          method.id === id ? { ...method, ...methodData } : method
        );
        saveMethods(newMethods);
        return newMethods.find((method) => method.id === id);
      } catch (err) {
        setError('Erro ao atualizar método de pagamento');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [methods, saveMethods]
  );

  const deleteMethod = useCallback(
    (id) => {
      try {
        setLoading(true);
        const newMethods = methods.filter((method) => method.id !== id);
        saveMethods(newMethods);
      } catch (err) {
        setError('Erro ao excluir método de pagamento');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [methods, saveMethods]
  );

  return {
    methods,
    loading,
    error,
    createMethod,
    updateMethod,
    deleteMethod
  };
}; 