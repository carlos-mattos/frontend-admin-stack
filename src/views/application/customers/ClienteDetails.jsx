import React from 'react';
import PropTypes from 'prop-types';
import { Stack, Typography, Grid2 as Grid, Divider, Chip } from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SubCard from 'ui-component/cards/SubCard';
import { gridSpacing } from 'store/constant';

const formatDate = (dateString) => {
  if (!dateString) return 'Não informado';
  return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const formatPhone = (phone) => {
  if (!phone) return 'Não informado';
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const formatDocument = (document) => {
  if (!document) return 'Não informado';
  return document.length <= 11
    ? document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export default function ClientDetails({ clientData }) {
  if (!clientData) return null;

  return (
    <Grid container spacing={gridSpacing}>
      <Grid item xs={12}>
        <SubCard title="Informações Pessoais">
          <Stack spacing={2} mt={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Nome Completo:
              </Typography>
              <Typography variant="body1">{clientData.fullName}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Email:
              </Typography>
              <Typography variant="body1">{clientData.email}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Telefone:
              </Typography>
              <Typography variant="body1">{formatPhone(clientData.phone)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Documento:
              </Typography>
              <Typography variant="body1">{formatDocument(clientData.documents)}</Typography>
            </Stack>
          </Stack>
        </SubCard>
      </Grid>

      <Grid item xs={12}>
        <SubCard title="Endereço">
          <Stack spacing={2} mt={2}>
            <Typography variant="body1">{clientData.address || 'Não informado'}</Typography>
          </Stack>
        </SubCard>
      </Grid>

      <Grid item xs={12}>
        <SubCard title="Preferências">
          <Stack spacing={2} mt={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Comunicação:
              </Typography>
              <Chip
                label={clientData.communicationConsent ? 'Aceita receber comunicações' : 'Não aceita receber comunicações'}
                color={clientData.communicationConsent ? 'success' : 'error'}
                size="small"
              />
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Data de Registro:
              </Typography>
              <Typography variant="body1">{formatDate(clientData.createdAt)}</Typography>
            </Stack>
          </Stack>
        </SubCard>
      </Grid>
    </Grid>
  );
}

ClientDetails.propTypes = {
  clientData: PropTypes.object.isRequired
};
