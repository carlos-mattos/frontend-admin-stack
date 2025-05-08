// assets
import {
  IconArticle,
  IconCalendar,
  IconClipboardList,
  IconDashboard,
  IconDeviceAnalytics,
  IconFileInvoice,
  IconLifebuoy
} from '@tabler/icons-react';

const icons = {
  IconDashboard: IconDashboard,
  IconDeviceAnalytics: IconDeviceAnalytics,
  IconFileInvoice: IconFileInvoice,
  IconArticle: IconArticle,
  IconLifebuoy: IconLifebuoy
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'dashboard',
  title: '',
  icon: icons.IconDashboard,
  type: 'group',
  children: [
    {
      id: 'default',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.IconDashboard,
      breadcrumbs: false
    },
    {
      id: 'register',
      title: 'Cadastros',
      type: 'collapse',
      icon: IconClipboardList,
      children: [
        {
          id: 'customers',
          title: 'Clientes',
          type: 'item',
          url: '/apps/clientes',
          breadcrumbs: false
        },
        {
          id: 'professionals',
          title: 'Profissionais',
          type: 'item',
          url: '/apps/profissionais',
          breadcrumbs: false
        },
        {
          id: 'services',
          title: 'Serviços',
          type: 'item',
          url: '/apps/servicos',
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'calendar',
      title: 'Calendário',
      type: 'item',
      url: '/apps/calendario',
      icon: IconCalendar,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
