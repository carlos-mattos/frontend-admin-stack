import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Stack, Typography } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import ServiceDetails from './ServiceDetails';
import { servicesApi } from 'api/index';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await servicesApi.get(id);
        setServiceData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar dados do serviço');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [id]);

  if (loading) {
    return (
      <MainCard>
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard>
        <Stack spacing={2}>
          <Alert severity="error">{error}</Alert>
          <Button variant="contained" onClick={() => navigate('/apps/servicos')}>
            Voltar para Lista
          </Button>
        </Stack>
      </MainCard>
    );
  }

  return (
    <MainCard>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button variant="text" onClick={() => navigate('/apps/servicos')}>
            ← Voltar
          </Button>
          <Typography variant="h2">Detalhes do Serviço</Typography>
        </Stack>
        <ServiceDetails serviceData={serviceData} />
      </Stack>
    </MainCard>
  );
}
