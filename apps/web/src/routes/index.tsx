// File: apps/web/src/routes/AppRouter.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Dashboard from '../pages/Dashboard/Dashboard';
import Login from '../pages/Login';
import { UsersPage } from '../pages/users/UsersPage';
import { UserDetailsPage } from '../pages/users/UserDetailsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { CategoriesPage } from '../pages/settings/CategoriesPage';
import { CitiesPage } from '../pages/settings/CitiesPage';
import { UnitsPage } from '../pages/settings/UnitsPage';
import { SubcategoriesPage } from '../pages/settings/SubcategoriesPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { PurchasesPage } from '../pages/purchases/PurchasesPage';
import { PettyCashPage } from '../pages/petty-cash/PettyCashPage';
import { FarmsPage } from '../pages/farms/FarmsPage';
import { FarmDetailsPage } from '../pages/farms/FarmDetailsPage';
import { RoutesPage } from '../pages/routes-management/RoutesPage';
import { RouteDetailPage } from '../pages/routes-management/route-detail/RouteDetailPage';
import { MyRoutesPage } from '../pages/my-routes/MyRoutesPage';
import { ActiveRoutePage } from '../pages/my-routes/active-route/ActiveRoutePage';
import { WaypointDetailPage } from '../pages/my-routes/active-route/waypoint-detail/WaypointDetailPage';
import { DriverGuidesPage } from '../pages/my-routes/DriverGuidesPage';
import { DriverPhotosPage } from '../pages/my-routes/DriverPhotosPage';
import { GuidesPage } from '../pages/guides/GuidesPage';
import { AdminPhotosPage } from '../pages/photos/AdminPhotosPage';
import { VehiclesPage } from '../pages/vehicles/VehiclesPage';
import { PeajesPage } from '../pages/gas-stations/PeajesPage';
import { BanksPage } from '../pages/settings/BanksPage';
import { SuppliersPage } from '../pages/suppilers/SuppliersPage';
import { SuppliersDetailsPage } from '../pages/suppilers/SuppliersDetailsPage';
import { PurchasesDetailsPage } from '../pages/purchases/PurchasesDetailsPage';
import { CompanyAccountsPage } from '../pages/company-accounts/CompanyAccountsPage';
import { AssetsPage } from '../pages/assets/AssetsPage';
import { BotiquinPage } from '../pages/settings/BotiquinPage';
import { ServiciosPage } from '../pages/settings/ServiciosPage';
import { ItfPage } from '../pages/settings/ItfPage';
import { IngresosPage } from '../pages/income/IngresosPage';
import { IngresoDetailPage } from '../pages/income/IngresoDetailPage';
import { MovimientosPage } from '../pages/movements/MovimientosPage';
import { AccountStatementPage } from '../pages/company-accounts/AccountStatementPage';
import { GastosRentaPage } from '../pages/rent-expenses/GastosRentaPage';
import { OperationsPage } from '../pages/operations/OperationsPage';
import { OperationDetailPage } from '../pages/operations/OperationDetailPage';
import { ExpirationsPage } from '../pages/expirations/ExpirationsPage';
import { InventoryOutputsPage } from '../pages/inventory-outputs/InventoryOutputsPage';
import { InventoryOutputDetailPage } from '../pages/inventory-outputs/InventoryOutputDetailPage';
import { ValesPage } from '../pages/fuel-vouchers/ValesPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/users', element: <UsersPage /> },
      { path: '/users/:userId', element: <UserDetailsPage /> },
      { path: '/suppliers', element: <SuppliersPage /> },
      { path: '/suppliers/:supplierId', element: <SuppliersDetailsPage /> },
      { path: '/vehicles', element: <VehiclesPage /> },
      { path: '/peajes', element: <PeajesPage /> },
      { path: '/ingresos', element: <IngresosPage /> },
      { path: '/ingresos/:id', element: <IngresoDetailPage /> },
      { path: '/company-accounts', element: <CompanyAccountsPage /> },
      { path: '/account-statement', element: <AccountStatementPage /> },
      { path: '/assets', element: <AssetsPage /> },
      { path: '/movimientos', element: <MovimientosPage /> },
      { path: '/vales', element: <ValesPage /> },
      { path: '/gastos-renta', element: <GastosRentaPage /> },
      { path: 'operaciones', element: <OperationsPage /> },
      { path: 'operaciones/:id', element: <OperationDetailPage /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/purchases', element: <PurchasesPage /> },
      { path: '/purchases/:purchaseId', element: <PurchasesDetailsPage /> },
      { path: '/petty-cash', element: <PettyCashPage /> },
      { path: '/vencimientos', element: <ExpirationsPage /> },
      { path: '/salidas', element: <InventoryOutputsPage /> },
      { path: '/salidas/:id', element: <InventoryOutputDetailPage /> },
      { path: '/farms', element: <FarmsPage /> },
      { path: '/farms/:farmId', element: <FarmDetailsPage /> },
      { path: '/routes', element: <RoutesPage /> },
      { path: '/routes/list/:id', element: <RouteDetailPage /> },
      { path: '/mis-rutas', element: <MyRoutesPage /> },
      { path: '/mis-rutas/:id', element: <ActiveRoutePage /> },
      { path: '/mis-rutas/:id/parada/:waypointId', element: <WaypointDetailPage /> },
      { path: '/mis-guias', element: <DriverGuidesPage /> },
      { path: '/mis-fotos', element: <DriverPhotosPage /> },
      { path: '/guias', element: <GuidesPage /> },
      { path: '/imagenes', element: <AdminPhotosPage /> },
      {
        path: '/settings',
        element: <SettingsPage />,
        children: [
          { index: true, element: <Navigate to="/settings/categories" replace /> },
          { path: 'botiquin', element: <BotiquinPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'subcategories', element: <SubcategoriesPage /> },
          { path: 'cities', element: <CitiesPage /> },
          { path: 'servicios', element: <ServiciosPage /> },
          { path: 'units', element: <UnitsPage /> },
          { path: 'banks', element: <BanksPage /> },
          { path: 'itf', element: <ItfPage /> },
        ]
      },
      { path: '*', element: <div><h1>404 - Página no encontrada</h1></div> }
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};