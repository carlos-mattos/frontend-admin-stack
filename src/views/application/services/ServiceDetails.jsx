import React from 'react';
import PropTypes from 'prop-types';
import { Grid2 as Grid, Stack, Typography, Divider } from '@mui/material';
import SubCard from 'ui-component/cards/SubCard';
import { gridSpacing } from 'store/constant';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ServiceDetails({ serviceData }) {
  if (!serviceData) return null;

  const formatDate = (date) => {
    if (!date) return 'Não informado';
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'Não informado';
    return `R$ ${Number(price).toFixed(2).replace('.', ',')}`;
  };

  const formatDuration = (duration) => {
    if (duration === undefined || duration === null) return 'Não informado';
    return `${duration} hora${duration !== 1 ? 's' : ''}`;
  };

  const formatDays = (days) => {
    if (days === undefined || days === null) return 'Não informado';
    return `${days} dia${days !== 1 ? 's' : ''}`;
  };

  return (
    <Grid container spacing={gridSpacing}>
      <Grid item size={12}>
        <SubCard title="Informações do Serviço">
          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography variant="body1">
                <strong>Nome do Serviço:</strong> {serviceData.name || 'Não informado'}
              </Typography>
              <Typography variant="body1">
                <strong>Categoria:</strong> {serviceData.category || 'Não informado'}
              </Typography>
              <Typography variant="body1">
                <strong>Duração:</strong> {formatDuration(serviceData.duration)}
              </Typography>
              <Typography variant="body1">
                <strong>Preço:</strong> {formatPrice(serviceData.price)}
              </Typography>
              <Typography variant="body1">
                <strong>Retorno:</strong> {formatDays(serviceData.nextContactDays)}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="body1">
                <strong>Data de Cadastro:</strong> {formatDate(serviceData.createdAt)}
              </Typography>
              <Typography variant="body1">
                <strong>Última Atualização:</strong> {formatDate(serviceData.updatedAt)}
              </Typography>
            </Stack>
          </Stack>
        </SubCard>
      </Grid>
    </Grid>
  );
}

ServiceDetails.propTypes = {
  serviceData: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    category: PropTypes.string,
    duration: PropTypes.number,
    price: PropTypes.number,
    nextContactDays: PropTypes.number,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    __v: PropTypes.number
  }).isRequired
};
