import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import ClienteDetails from './ClienteDetails';
import { customersApi } from 'api/index';

export default function ClienteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await customersApi.get(id);
        setClientData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar dados do cliente');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  if (loading) {
    return (
      <MainCard title="Detalhes do Cliente">
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Detalhes do Cliente">
        <Box p={3}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/apps/clientes')}>
            Voltar para lista
          </Button>
        </Box>
      </MainCard>
    );
  }

  if (!clientData) {
    return (
      <MainCard title="Detalhes do Cliente">
        <Box p={3}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cliente não encontrado
          </Alert>
          <Button variant="contained" onClick={() => navigate('/apps/clientes')}>
            Voltar para lista
          </Button>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBack />} variant="text" onClick={() => navigate('/apps/clientes')} sx={{ mr: 2 }}>
            Voltar
          </Button>
          <Typography variant="h4">Detalhes do Cliente</Typography>
        </Stack>
      }
    >
      <ClienteDetails clientData={clientData} />
    </MainCard>
  );
}
