import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import authProvider from "./authProvider";
import { Suspense, lazy } from "react";

import {
  useNotificationProvider,
  ErrorComponent,
  AuthPage,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import nestjsxCrudDataProvider, {
  axiosInstance,
} from "@refinedev/nestjsx-crud";
import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/header";
import { CustomSider } from "./components/sider";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { GoodsEdit } from "./pages/goods-processing/edit";

import { PackerShow } from "./pages/packers/show";
import { PackersTop } from "./pages/packers/top";

const GoodsProcessingCreate = lazy(() =>
  import("./pages/goods-processing").then((m) => ({
    default: m.GoodsProcessingCreate,
  }))
);
const GoogsProcessingList = lazy(() =>
  import("./pages/goods-processing").then((m) => ({
    default: m.GoogsProcessingList,
  }))
);
const GoodsShow = lazy(() =>
  import("./pages/goods-processing").then((m) => ({ default: m.GoodsShow }))
);

const BranchCreate = lazy(() =>
  import("./pages/branch").then((m) => ({ default: m.BranchCreate }))
);
const BranchEdit = lazy(() =>
  import("./pages/branch").then((m) => ({ default: m.BranchEdit }))
);
const BranchList = lazy(() =>
  import("./pages/branch").then((m) => ({ default: m.BranchList }))
);
const BranchShow = lazy(() =>
  import("./pages/branch").then((m) => ({ default: m.BranchShow }))
);

const UserCreate = lazy(() =>
  import("./pages/user").then((m) => ({ default: m.UserCreate }))
);
const UserEdit = lazy(() =>
  import("./pages/user").then((m) => ({ default: m.UserEdit }))
);
const UserList = lazy(() =>
  import("./pages/user").then((m) => ({ default: m.UserList }))
);
const UserShow = lazy(() =>
  import("./pages/user").then((m) => ({ default: m.UserShow }))
);

const ShipmentList = lazy(() =>
  import("./pages/shipments").then((m) => ({ default: m.List }))
);
const ShipmentCreate = lazy(() =>
  import("./pages/shipments").then((m) => ({ default: m.Create }))
);
const ShipmentShow = lazy(() =>
  import("./pages/shipments").then((m) => ({ default: m.Show }))
);
const ShipmentEdit = lazy(() =>
  import("./pages/shipments").then((m) => ({ default: m.Edit }))
);

const ReceivingList = lazy(() => import("./pages/receiving/ReceivingList"));
const ReceivingCreate = lazy(() => import("./pages/receiving/ReceivingCreate"));
const ReceivingShow = lazy(() => import("./pages/receiving/ReceivingShow"));
const ReceivingEdit = lazy(() => import("./pages/receiving/ReceivingEdit"));

const IssueProcessingList = lazy(() =>
  import("./pages/Issue").then((m) => ({ default: m.IssueProcessingList }))
);
const IssueProcessingListReceived = lazy(() =>
  import("./pages/Issue/listReceived").then((m) => ({
    default: m.IssueProcessingListReceived,
  }))
);

const CashBackCreate = lazy(() =>
  import("./pages/cash-back").then((m) => ({ default: m.CashBackCreate }))
);
const CashBackList = lazy(() =>
  import("./pages/cash-back").then((m) => ({ default: m.CashBackList }))
);
const CashBackShow = lazy(() =>
  import("./pages/cash-back").then((m) => ({ default: m.CashBackShow }))
);
const CashBackEdit = lazy(() =>
  import("./pages/cash-back").then((m) => ({ default: m.CashBackEdit }))
);

const BankCreate = lazy(() =>
  import("./pages/bank").then((m) => ({ default: m.BankCreate }))
);
const BankEdit = lazy(() =>
  import("./pages/bank").then((m) => ({ default: m.BankEdit }))
);
const BankList = lazy(() =>
  import("./pages/bank").then((m) => ({ default: m.BankList }))
);
const BankShow = lazy(() =>
  import("./pages/bank").then((m) => ({ default: m.BankShow }))
);

const BankPermissionList = lazy(() =>
  import("./pages/bank-permission/list").then((m) => ({
    default: m.BankPermissionList,
  }))
);
const BankPermissionCreate = lazy(() =>
  import("./pages/bank-permission/create").then((m) => ({
    default: m.BankPermissionCreate,
  }))
);

const CashDeskCreate = lazy(() =>
  import("./pages/cash-desk").then((m) => ({ default: m.CashDeskCreate }))
);
const CashDeskList = lazy(() =>
  import("./pages/cash-desk").then((m) => ({ default: m.CashDeskList }))
);
const CashDeskOutcomeList = lazy(() =>
  import("./pages/cash-desk/outcome").then((m) => ({
    default: m.CashDeskOutcomeList,
  }))
);
const Audit = lazy(() =>
  import("./pages/audit").then((m) => ({ default: m.Audit }))
);

const UnderBranchCreate = lazy(() =>
  import("./pages/under-branch").then((m) => ({ default: m.UnderBranchCreate }))
);
const UnderBranchEdit = lazy(() =>
  import("./pages/under-branch").then((m) => ({ default: m.UnderBranchEdit }))
);
const UnderBranchList = lazy(() =>
  import("./pages/under-branch").then((m) => ({ default: m.UnderBranchList }))
);
const UnderBranchShow = lazy(() =>
  import("./pages/under-branch").then((m) => ({ default: m.UnderBranchShow }))
);

const ReceivingShowReceived = lazy(
  () => import("./pages/receiving/ReceivingShowReceived")
);

const DiscountList = lazy(() =>
  import("./pages/discount/list").then((m) => ({ default: m.DiscountList }))
);
const DiscountCreate = lazy(() =>
  import("./pages/discount/create").then((m) => ({ default: m.DiscountCreate }))
);
const DiscountShow = lazy(() =>
  import("./pages/discount/show").then((m) => ({ default: m.DiscountShow }))
);
const DiscountEdit = lazy(() =>
  import("./pages/discount/edit").then((m) => ({ default: m.DiscountEdit }))
);

const ShipmentAdd = lazy(() => import("./pages/shipments/ShipmentAdd"));

const CurrencyCreate = lazy(() =>
  import("./pages/currency/create").then((m) => ({ default: m.CurrencyCreate }))
);
const CurrencyList = lazy(() =>
  import("./pages/currency/list").then((m) => ({ default: m.CurrencyList }))
);
const CurrencyShow = lazy(() =>
  import("./pages/currency/show").then((m) => ({ default: m.CurrencyShow }))
);
const CurrencyEdit = lazy(() =>
  import("./pages/currency/edit").then((m) => ({ default: m.CurrencyEdit }))
);

const ShipmentHistory = lazy(() => import("./pages/shipments/ShipmentHistory"));
const ReceivingHistory = lazy(() =>
  import("./pages/receiving/ReceivingHistory").then((m) => ({
    default: m.ReceivingHistory,
  }))
);
const ReceivingHistoryShow = lazy(() =>
  import("./pages/receiving/ReceivingHistoryShow").then((m) => ({
    default: m.ReceivingHistoryShow,
  }))
);
const ShipmentHistoryShow = lazy(
  () => import("./pages/shipments/ShipmentHistoryShow")
);

const ReceivingAll = lazy(() => import("./pages/receiving/ReceivingAll"));
const IncomeShow = lazy(() =>
  import("./pages/cash-desk/incomeShow").then((m) => ({
    default: m.IncomeShow,
  }))
);

const NomenklaturaList = lazy(() =>
  import("./pages/nomenklatura/list").then((m) => ({
    default: m.NomenklaturaList,
  }))
);
const BrandList = lazy(() =>
  import("./pages/brand/list").then((m) => ({ default: m.BrandList }))
);
const ProductsList = lazy(() =>
  import("./pages/products/list").then((m) => ({ default: m.ProductsList }))
);
const PackersList = lazy(() =>
  import("./pages/packers/list").then((m) => ({ default: m.PackersList }))
);
const OutGroupList = lazy(() =>
  import("./pages/out-group/list").then((m) => ({ default: m.OutGroupList }))
);
const TariffList = lazy(() =>
  import("./pages/tarif/list").then((m) => ({ default: m.TariffList }))
);
const EndpointList = lazy(() =>
  import("./pages/endpoints").then((m) => ({ default: m.EndpointList }))
);

const TrackingPage = lazy(() =>
  import("./pages/track/tracking").then((m) => ({ default: m.TrackingPage }))
);
const SentTheCityList = lazy(() =>
  import("./pages/sent-the-city").then((m) => ({ default: m.SentTheCityList }))
);

const ReportList = lazy(() =>
  import("./pages/reports/list").then((m) => ({ default: m.ReportList }))
);

const BranchNomenclatureList = lazy(() =>
  import("./pages/branch-nomenclature/list").then((m) => ({
    default: m.BranchNomenclatureList,
  }))
);
const BranchNomenclatureCreate = lazy(() =>
  import("./pages/branch-nomenclature/create").then((m) => ({
    default: m.BranchNomenclatureCreate,
  }))
);
const BranchNomenclatureEdit = lazy(() =>
  import("./pages/branch-nomenclature/edit").then((m) => ({
    default: m.BranchNomenclatureEdit,
  }))
);
const BranchNomenclatureShow = lazy(() =>
  import("./pages/branch-nomenclature/show").then((m) => ({
    default: m.BranchNomenclatureShow,
  }))
);

const CargoReceivedReport = lazy(() =>
  import("./pages/reports/cargo-received").then((m) => ({
    default: m.CargoReceivedReport,
  }))
);
const IncomeReport = lazy(() =>
  import("./pages/reports/income").then((m) => ({ default: m.IncomeReport }))
);
const CargoTypesReport = lazy(() =>
  import("./pages/reports/cargo-types").then((m) => ({
    default: m.CargoTypesReport,
  }))
);
const StockReport = lazy(() =>
  import("./pages/reports/stock").then((m) => ({ default: m.StockReport }))
);
const MyCompany = lazy(() =>
  import("./pages/my-company").then((m) => ({ default: m.MyCompany }))
);
const IssueReport = lazy(() =>
  import("./pages/reports/issue").then((m) => ({ default: m.IssueReport }))
);
const BankReport = lazy(() =>
  import("./pages/reports/bank").then((m) => ({ default: m.BankReport }))
);
const ShipmentReport = lazy(() =>
  import("./pages/reports/receiving").then((m) => ({
    default: m.ShipmentReport,
  }))
);
const CashDeskReport = lazy(() =>
  import("./pages/reports/cash-desk").then((m) => ({
    default: m.CashDeskReport,
  }))
);
const CashDeskIncomeReport = lazy(() =>
  import("./pages/reports/cash-desk-income").then((m) => ({
    default: m.CashDeskIncomeReport,
  }))
);
const CashDeskOutcomeReport = lazy(() =>
  import("./pages/reports/cash-desk-outcome").then((m) => ({
    default: m.CashDeskOutcomeReport,
  }))
);
const WarehouseStockReport = lazy(() =>
  import("./pages/reports/warehouse-stock").then((m) => ({
    default: m.WarehouseStockReport,
  }))
);
const CounterpartyList = lazy(() =>
  import("./pages/counterparties/list").then((m) => ({
    default: m.CounterpartyList,
  }))
);
const WarehouseStockGoodsReport = lazy(() =>
  import("./pages/reports/shipment-lam").then((m) => ({
    default: m.WarehouseStockGoodsReport,
  }))
);
const TrackList = lazy(() =>
  import("./pages/track/list").then((m) => ({ default: m.TrackList }))
);
const KudaList = lazy(() =>
  import("./pages/reports/kuda-list").then((m) => ({ default: m.KudaList }))
);

import { i18nProvider_ru } from "./i18n/ru";
import { routes } from "./lib/routes";
import { ScrollRestoration } from "./components/save-scroll";
import { CustomLayout } from "./components/layout";

import "./styles/global.css";

// Оптимизированный компонент загрузки
const PageLoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      background: "#f5f5f5",
    }}
  >
    <div
      style={{
        width: "48px",
        height: "48px",
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #1890ff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
    <div
      style={{
        marginTop: "16px",
        color: "#666",
        fontSize: "14px",
      }}
    >
      Загрузка...
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export const API_URL = import.meta.env.VITE_DEV_URL;

function App() {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("cargo-system-token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Функция обновления токена
  const refreshToken = async () => {
    try {
      const refresh_token = localStorage.getItem("cargo-system-refresh-token");
      if (!refresh_token) throw new Error("No refresh token available");

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refresh_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      localStorage.setItem("cargo-system-token", data.accessToken);
      localStorage.setItem("cargo-system-refresh-token", data.refreshToken);
      return data.accessToken;
    } catch (error) {
      localStorage.removeItem("cargo-system-token");
      localStorage.removeItem("cargo-system-refresh-token");
      localStorage.removeItem("cargo-system-email");
      localStorage.removeItem("cargo-system-role");
      localStorage.removeItem("cargo-system-firstName");
      localStorage.removeItem("cargo-system-lastName");
      localStorage.removeItem("cargo-system-id");
      window.location.href = "/login";
      return null;
    }
  };

  // Перехватываем 401 и обновляем токен
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        const originalRequest = error.config;
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          const newAccessToken = await refreshToken();
          if (newAccessToken) {
            axiosInstance.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
        }
      }
      return Promise.reject(error);
    }
  );

  const dataProvider = nestjsxCrudDataProvider(API_URL, axiosInstance);

  // @ts-ignore
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <Refine
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider}
              routerProvider={routerBindings}
              authProvider={authProvider}
              i18nProvider={i18nProvider_ru}
              accessControlProvider={{
                can: async ({ resource }) => {
                  const role = localStorage.getItem("role");

                  if (role === "user" && resource === "users") {
                    return { can: false };
                  }

                  return { can: true };
                },
              }}
              resources={routes}
              Title={() => <img src="/cargo-system-logo.png" alt="Logo" />}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
                liveMode: "auto",
                title: {
                  icon: <img src="/cargo-system-logo.png" alt="Logo" />,
                  text: "Cargo System",
                },
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-routes"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <CustomLayout
                        Header={() => <Header sticky />}
                        Sider={(props) => <CustomSider {...props} />}
                      >
                        <Suspense fallback={<PageLoadingFallback />}>
                          <Outlet />
                        </Suspense>
                      </CustomLayout>
                    </Authenticated>
                  }
                >
                  <Route
                    index
                    element={<NavigateToResource resource="goods-processing" />}
                  />

                  <Route path="/goods-processing">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <GoogsProcessingList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <GoodsProcessingCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <GoodsEdit />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <GoodsShow />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/issue">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <IssueProcessingList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <GoodsShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="received"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <IssueProcessingListReceived />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/branch">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchEdit />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchShow />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/under-branch">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UnderBranchList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UnderBranchCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UnderBranchEdit />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UnderBranchShow />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/branch-nomenclature">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchNomenclatureList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchNomenclatureCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchNomenclatureEdit />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BranchNomenclatureShow />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/users">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UserList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UserCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UserEdit />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <UserShow />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/bank-permission">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BankPermissionList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BankPermissionCreate />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/shipments">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentEdit />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id/adding"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentAdd />
                        </Suspense>
                      }
                    />
                    <Route
                      path="history"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentHistory />
                        </Suspense>
                      }
                    />
                    <Route
                      path="history/show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentHistoryShow />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/counterparty">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CounterpartyList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/receiving">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id/received"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingShowReceived />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingEdit />
                        </Suspense>
                      }
                    />
                    <Route
                      path="history"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingHistory />
                        </Suspense>
                      }
                    />
                    <Route
                      path="all"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingAll />
                        </Suspense>
                      }
                    />
                    <Route
                      path="history/show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReceivingHistoryShow />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/cash-back">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashBackList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashBackCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashBackShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashBackEdit />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/discount">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <DiscountList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <DiscountCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <DiscountShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <DiscountEdit />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/reports">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ReportList />
                        </Suspense>
                      }
                    />

                    <Route
                      path="cargo-received"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CargoReceivedReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="nomenclature"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CargoTypesReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="borrow"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <IncomeReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="stock"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <StockReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="issue"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <IssueReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="bank"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BankReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="receiving"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ShipmentReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="cash-desk"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashDeskReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="cash-desk-income"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashDeskIncomeReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="cash-desk-outcome"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashDeskOutcomeReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="warehouse-stock"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <WarehouseStockReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="warehouse-stock-goods"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <WarehouseStockGoodsReport />
                        </Suspense>
                      }
                    />
                    <Route
                      path="oo-kuda-list"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <KudaList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/bank">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BankList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BankCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BankShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BankEdit />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/income">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashDeskList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashDeskCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <IncomeShow />
                        </Suspense>
                      }
                    />
                    {/*<Route path="edit/:id" element={<ReceivingEdit />} />*/}
                  </Route>

                  <Route path="/outcome">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashDeskOutcomeList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CashDeskCreate />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/currency">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CurrencyList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="create"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CurrencyCreate />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CurrencyShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="edit/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <CurrencyEdit />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/shipment">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <TrackList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/tracking">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <TrackingPage />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/nomenclature">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <NomenklaturaList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/type-product">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <BrandList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/products">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <ProductsList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/packers">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <PackersList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="show/:id"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <PackerShow />
                        </Suspense>
                      }
                    />
                    <Route
                      path="top"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <PackersTop />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/visiting-group">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <OutGroupList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/tariff">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <TariffList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/endpoint">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <EndpointList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="/sent-the-city">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <SentTheCityList />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route
                    path="/my-company"
                    element={
                      <Suspense fallback={<PageLoadingFallback />}>
                        <MyCompany />
                      </Suspense>
                    }
                  />

                  <Route path="/audit">
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <Audit />
                        </Suspense>
                      }
                    />
                  </Route>

                  <Route path="*" element={<ErrorComponent />} />
                </Route>

                <Route
                  path="/login"
                  element={
                    <AuthPage
                      type="login"
                      registerLink={false}
                      forgotPasswordLink={false}
                      title={
                        <img
                          src="/cargo-system-logo.png"
                          alt="Logo"
                          style={{
                            width: 150,
                            marginBottom: 16,
                            backgroundColor: "transparent",
                          }}
                        />
                      }
                    />
                  }
                />
              </Routes>

              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
