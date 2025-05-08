import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import ProfessionalDetails from './ProfessionalDetails';
import { professionalsApi } from 'api/index';

export default function ProfessionalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [professionalData, setProfessionalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await professionalsApi.get(id);
        setProfessionalData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar dados do profissional');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [id]);

  if (loading) {
    return (
      <MainCard title="Detalhes do Profissional">
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Detalhes do Profissional">
        <Box p={3}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/apps/profissionais')}>
            Voltar para lista
          </Button>
        </Box>
      </MainCard>
    );
  }

  if (!professionalData) {
    return (
      <MainCard title="Detalhes do Profissional">
        <Box p={3}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Profissional não encontrado
          </Alert>
          <Button variant="contained" onClick={() => navigate('/apps/profissionais')}>
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
          <Button startIcon={<ArrowBack />} variant="text" onClick={() => navigate('/apps/profissionais')} sx={{ mr: 2 }}>
            Voltar
          </Button>
          <Typography variant="h4">Detalhes do Profissional</Typography>
        </Stack>
      }
    >
      <ProfessionalDetails professionalData={professionalData} />
    </MainCard>
  );
}
