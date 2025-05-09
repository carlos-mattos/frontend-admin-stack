// assets
import {
  IconArticle,
  IconCalendar,
  IconClipboardList,
  IconDashboard,
  IconDeviceAnalytics,
  IconFileInvoice,
  IconLifebuoy,
  IconCash,

} from '@tabler/icons-react';

const icons = {
  IconDashboard: IconDashboard,
  IconDeviceAnalytics: IconDeviceAnalytics,
  IconFileInvoice: IconFileInvoice,
  IconArticle: IconArticle,
  IconLifebuoy: IconLifebuoy,
  IconCash: IconCash,
  
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'dashboard',
  title: 'Dashboard',
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
          url: '/customers',
          breadcrumbs: false
        },
        {
          id: 'professionals',
          title: 'Profissionais',
          type: 'item',
          url: '/professionals',
          breadcrumbs: false
        },
        {
          id: 'services',
          title: 'Serviços',
          type: 'item',
          url: '/services',
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financeiro',
      type: 'collapse',
      icon: IconCash,
      children: [
        {
          id: 'contas-receber',
          title: 'Contas a Receber',
          type: 'item',
          url: '/accounts-receivable',
          breadcrumbs: false
        },
        {
          id: 'contas-pagar',
          title: 'Contas a Pagar',
          type: 'item',
          url: '/accounts-payable',
          breadcrumbs: false
        },
        {
          id: 'fluxo-caixa',
          title: 'Fluxo de Caixa',
          type: 'item',
          url: '/cash-flow-report',
          breadcrumbs: false
        },
        {
          id: 'payment-methods',
          title: 'Métodos de Pagamento',
          type: 'item',
          url: '/payment-methods',
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'calendar',
      title: 'Calendário',
      type: 'item',
      url: '/calendar',
      icon: IconCalendar,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
