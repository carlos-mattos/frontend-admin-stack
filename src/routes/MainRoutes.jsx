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
const AppAccountsReceivable = Loadable(lazy(() => import('views/application/accounts-receivable/AccountsReceivable')));
const AppAccountsPayable = Loadable(lazy(() => import('views/application/accounts-payable/AccountsPayable')));
const AppCashFlowReport = Loadable(lazy(() => import('views/application/cash-flow-report/CashFlowReport')));
const AppPaymentMethods = Loadable(lazy(() => import('views/application/payment-methods/PaymentMethods')));

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
      path: '/dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: '/customers',
      children: [
        {
          path: '',
          element: <AppClientes />
        },
        {
          path: ':id',
          element: <AppCustomerDetails />
        }
      ]
    },
    {
      path: '/professionals',
      children: [
        {
          path: '',
          element: <AppProfessionals />
        },
        {
          path: ':id',
          element: <AppProfessionalsDetails />
        },
        {
          path: ':id/schedule',
          element: <AppProfessionalSchedule />
        },
        {
          path: ':id/schedule/new',
          element: <AppProfessionalScheduleForm />
        }
      ]
    },
    {
      path: '/services',
      children: [
        {
          path: '',
          element: <AppServices />
        },
        {
          path: ':id',
          element: <AppServicesDetails />
        }
      ]
    },
    {
      path: '/calendar',
      children: [
        {
          path: '',
          element: <AppCalendar />
        }
      ]
    },
    {
      path: '/accounts-receivable',
      children: [
        {
          path: '',
          element: <AppAccountsReceivable />
        }
      ]
    },
    {
      path: '/accounts-payable',
      children: [
        {
          path: '',
          element: <AppAccountsPayable />
        }
      ]
    },
    {
      path: '/cash-flow-report',
      children: [
        {
          path: '',
          element: <AppCashFlowReport />
        }
      ]
    },
    {
      path: '/payment-methods',
      element: <AppPaymentMethods />
    }
  ]
};

export default MainRoutes;
