import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project imports
import BorderRadius from './BorderRadius';
import FontFamily from './FontFamily';
import PresetColor from './PresetColor';
import ThemeModeLayout from './ThemeMode';

import { ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';
import MainCard from 'ui-component/cards/MainCard';
import AnimateButton from 'ui-component/extended/AnimateButton';

// assets
import { IconPlus, IconSettings } from '@tabler/icons-react';

function CustomTabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

export default function Customization() {
  const theme = useTheme();
  const { mode, onReset } = useConfig();

  // drawer on/off
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen(!open);
  };

  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      {/* toggle button */}
      <Tooltip title="Live Customize">
        <Fab
          component="div"
          onClick={handleToggle}
          size="medium"
          variant="circular"
          color="secondary"
          sx={{
            borderRadius: 0,
            borderTopLeftRadius: '50%',
            borderBottomLeftRadius: '50%',
            borderTopRightRadius: '50%',
            borderBottomRightRadius: '4px',
            top: '25%',
            position: 'fixed',
            right: 10,
            zIndex: 1200,
            boxShadow: theme.customShadows.secondary
          }}
        >
          <AnimateButton type="rotate">
            <IconButton color="inherit" size="large" disableRipple aria-label="live customize">
              <IconSettings />
            </IconButton>
          </AnimateButton>
        </Fab>
      </Tooltip>
      <Drawer anchor="right" onClose={handleToggle} open={open} PaperProps={{ sx: { width: 375 } }}>
        {open && (
          <PerfectScrollbar>
            <MainCard content={false} border={false}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}>
                <Typography variant="h5">Personalização</Typography>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Button variant="outlined" color="error" size="small" onClick={() => onReset()}>
                    Resetar
                  </Button>
                  <IconButton sx={{ p: 0, color: 'grey.600' }} onClick={handleToggle}>
                    <IconPlus size={24} style={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                </Stack>
              </Stack>
              <Divider />
              <Box sx={{ width: '100%' }}>
                <Tabs
                  value={value}
                  sx={{
                    bgcolor: mode === ThemeMode.DARK ? 'dark.800' : 'grey.50',
                    minHeight: 56,
                    '& .MuiTabs-flexContainer': { height: '100%' }
                  }}
                  centered
                  onChange={handleChange}
                  aria-label="basic tabs example"
                ></Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                <Grid container spacing={2.5}>
                  <Grid size={12}>
                    {/* layout type */}
                    <ThemeModeLayout />
                    <Divider />
                  </Grid>

                  <Grid size={12}>
                    {/* Theme Preset Color */}
                    <PresetColor />
                    <Divider />
                  </Grid>
                </Grid>
              </CustomTabPanel>
              <CustomTabPanel value={value} index={1}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    {/* font family */}
                    <FontFamily />
                    <Divider />
                  </Grid>
                  <Grid size={12}>
                    {/* border radius */}
                    <BorderRadius />
                    <Divider />
                  </Grid>
                </Grid>
              </CustomTabPanel>
            </MainCard>
          </PerfectScrollbar>
        )}
      </Drawer>
    </>
  );
}

CustomTabPanel.propTypes = { children: PropTypes.node, value: PropTypes.number, index: PropTypes.number, other: PropTypes.any };
