import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import AuthGuard from 'utils/route-guard/AuthGuard';

const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));
const AppClientes = Loadable(lazy(() => import('views/application/customers')));
const AppCustomerDetails = Loadable(lazy(() => import('views/application/customers/ClienteDetailsPage')));
const AppProfessionals = Loadable(lazy(() => import('views/application/professionals')));
const AppProfessionalsDetails = Loadable(lazy(() => import('views/application/professionals/ProfessionalDetailsPage')));
const AppProfessionalSchedule = Loadable(lazy(() => import('views/application/professionals/ProfessionalSchedulePage')));
const AppProfessionalScheduleForm = Loadable(lazy(() => import('views/application/professionals/ScheduleForm')));
const AppServices = Loadable(lazy(() => import('views/application/services')));
const AppServicesDetails = Loadable(lazy(() => import('views/application/services/ServiceDetailsPage')));
const AppCalendar = Loadable(lazy(() => import('views/application/calendar')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: '/apps/clientes',
      element: <AppClientes />
    },
    {
      path: '/apps/clientes/detalhes/:id',
      element: <AppCustomerDetails />
    },
    {
      path: '/apps/profissionais',
      element: <AppProfessionals />
    },
    {
      path: '/apps/profissionais/detalhes/:id',
      element: <AppProfessionalsDetails />
    },
    {
      path: '/apps/profissionais/:id/agenda',
      element: <AppProfessionalSchedule />
    },
    {
      path: '/apps/profissionais/:id/agenda/novo',
      element: <AppProfessionalScheduleForm />
    },
    {
      path: '/apps/profissionais/:id/agenda/:scheduleId/editar',
      element: <AppProfessionalScheduleForm />
    },
    {
      path: '/apps/servicos',
      element: <AppServices />
    },
    {
      path: '/apps/servicos/detalhes/:id',
      element: <AppServicesDetails />
    },
    {
      path: '/apps/calendario',
      element: <AppCalendar />
    },
    {
      path: '/dashboard/default',
      element: <DashboardDefault />
    }
  ]
};

export default MainRoutes;
