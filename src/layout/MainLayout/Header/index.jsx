import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import React from 'react';

// project imports
import LogoSection from '../LogoSection';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';

import { IconChevronLeft, IconMenu2 } from '@tabler/icons-react';

export default function Header() {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const { mode, menuOrientation } = useConfig();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Drawer toggler */}
        {!isHorizontal && (
          <IconButton edge="start" onClick={() => handlerDrawerOpen(!drawerOpen)} sx={{ mr: 2 }} size={isSmUp ? 'medium' : 'small'}>
            {drawerOpen ? <IconChevronLeft size={20} /> : <IconMenu2 size={20} />}
          </IconButton>
        )}

        {/* Logo (only when open on md+) */}
        {drawerOpen && isMdUp && (
          <Box sx={{ flexGrow: 1 }}>
            <LogoSection />
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Responsive sections */}
        <Stack direction="row" spacing={1} alignItems="center"></Stack>
      </Toolbar>
    </AppBar>
  );
}
