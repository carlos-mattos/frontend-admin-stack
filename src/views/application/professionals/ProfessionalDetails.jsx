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
  return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export default function ProfessionalDetails({ professionalData }) {
  if (!professionalData) return null;

  return (
    <Grid container spacing={gridSpacing}>
      <Grid item size={12}>
        <SubCard title="Informações Pessoais">
          <Stack spacing={2} mt={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Nome Completo:
              </Typography>
              <Typography variant="body1">{professionalData.fullName}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                CRM:
              </Typography>
              <Typography variant="body1">{professionalData.crm}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Telefone:
              </Typography>
              <Typography variant="body1">{formatPhone(professionalData.contact)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                CPF:
              </Typography>
              <Typography variant="body1">{formatDocument(professionalData.documents)}</Typography>
            </Stack>
          </Stack>
        </SubCard>
      </Grid>

      <Grid item size={12}>
        <SubCard title="Serviços Prestados">
          <Stack spacing={2} mt={2}>
            {professionalData.serviceHandled?.length > 0 ? (
              professionalData.serviceHandled.map((service) => (
                <Chip key={service._id} label={service.name} color="primary" size="small" sx={{ mr: 1, mb: 1 }} />
              ))
            ) : (
              <Typography variant="body1">Nenhum serviço cadastrado</Typography>
            )}
          </Stack>
        </SubCard>
      </Grid>

      <Grid item size={12}>
        <SubCard title="Informações Adicionais">
          <Stack spacing={2} mt={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Data de Registro:
              </Typography>
              <Typography variant="body1">{formatDate(professionalData.createdAt)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Última Atualização:
              </Typography>
              <Typography variant="body1">{formatDate(professionalData.updatedAt)}</Typography>
            </Stack>
          </Stack>
        </SubCard>
      </Grid>
    </Grid>
  );
}

ProfessionalDetails.propTypes = {
  professionalData: PropTypes.object.isRequired
};
