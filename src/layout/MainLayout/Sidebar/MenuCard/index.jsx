import PropTypes from 'prop-types';
import { memo } from 'react';

// material-ui
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { linearProgressClasses } from '@mui/material/LinearProgress';

// project imports
import { ThemeMode } from 'config';

// ==============================|| PROGRESS BAR WITH LABEL ||============================== //

function LinearProgressWithLabel({ value, ...others }) {
  const theme = useTheme();

  return (
    <Grid container direction="column" spacing={1} sx={{ mt: 1.5 }}>
      <Grid>
        <Grid container sx={{ justifyContent: 'space-between' }}>
          <Grid>
            <Typography variant="h6" sx={{ color: theme.palette.mode === ThemeMode.DARK ? 'dark.light' : 'primary.800' }}>
              Progress
            </Typography>
          </Grid>
          <Grid>
            <Typography variant="h6" color="inherit">{`${Math.round(value)}%`}</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid>
        <LinearProgress
          aria-label="progress of theme"
          variant="determinate"
          value={value}
          {...others}
          sx={{
            height: 10,
            borderRadius: 30,
            [`&.${linearProgressClasses.colorPrimary}`]: {
              bgcolor: 'background.paper'
            },
            [`& .${linearProgressClasses.bar}`]: {
              borderRadius: 5,
              bgcolor: 'primary.dark'
            }
          }}
        />
      </Grid>
    </Grid>
  );
}

// ==============================|| SIDEBAR - MENU CARD ||============================== //

function MenuCard() {
  const theme = useTheme();

  return (
    <Card
      sx={{
        bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.main' : 'primary.light',
        mb: 2.75,
        overflow: 'hidden',
        position: 'relative',
        '&:after': {
          content: '""',
          position: 'absolute',
          width: 157,
          height: 157,
          bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.dark' : 'primary.200',
          borderRadius: '50%',
          top: -105,
          right: -96
        }
      }}
    ></Card>
  );
}

export default memo(MenuCard);

LinearProgressWithLabel.propTypes = { value: PropTypes.number, others: PropTypes.any };
