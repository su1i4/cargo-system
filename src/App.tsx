import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import authProvider from "./authProvider";

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

import { App as AntdApp, Layout as AntLayout } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/header";
import { CustomSider } from "./components/sider";
import { ColorModeContextProvider } from "./contexts/color-mode";
import {
  GoodsCreate,
  GoodsShow,
  GoogsProcessingList,
  GoodsEdit,
} from "./pages/goods-processing";
import {
  BranchCreate,
  BranchEdit,
  BranchList,
  BranchShow,
} from "./pages/branch";
import { UserCreate, UserEdit, UserList, UserShow } from "./pages/user";
import { List, Create, Show, Edit } from "./pages/shipments";
import {
  CounterpartyCreate,
  CounterpartyEdit,
  CounterpartyList,
  CounterpartyShow,
} from "./pages/counterparties";
import ReceivingList from "./pages/receiving/ReceivingList";
import ReceivingCreate from "./pages/receiving/ReceivingCreate";
import ReceivingShow from "./pages/receiving/ReceivingShow";
import ReceivingEdit from "./pages/receiving/ReceivingEdit";
import { i18nProvider_ru } from "./i18n/ru";
import { IssueProcessingList } from "./pages/Issue";
import { CashBackCreate, CashBackList, CashBackShow, CashBackEdit } from "./pages/cash-back";
import { BankCreate, BankEdit, BankList, BankShow } from "./pages/bank";
import { BankPermissionList } from "./pages/bank-permission/list";
import { BankPermissionCreate } from "./pages/bank-permission/create";
import { CashDeskCreate, CashDeskList } from "./pages/cash-desk";
import { CashDeskOutcomeList } from "./pages/cash-desk/outcome";
import {
  UnderBranchCreate,
  UnderBranchEdit,
  UnderBranchList,
  UnderBranchShow,
} from "./pages/under-branch";
import ReceivingShowReceived from "./pages/receiving/ReceivingShowReceived";
import { DiscountList } from "./pages/discount/list";
import { DiscountCreate } from "./pages/discount/create";
import { DiscountShow } from "./pages/discount/show";
import { DiscountEdit } from "./pages/discount/edit";
import { IssueProcessingListReceived } from "./pages/Issue/listReceived";
import "./styles/global.css";
import ShipmentAdd from "./pages/shipments/ShipmentAdd";
import { CurrencyCreate } from "./pages/currency/create";
import { CurrencyList } from "./pages/currency/list";
import { CurrencyShow } from "./pages/currency/show";
import { CurrencyEdit } from "./pages/currency/edit";
import { TriggersList } from "./pages/triggers/list";
import { TriggersCreate } from "./pages/triggers/create";
import ShipmentHistory from "./pages/shipments/ShipmentHistory";
import { ReceivingHistory } from "./pages/receiving/ReceivingHistory";
import { ReceivingHistoryShow } from "./pages/receiving/ReceivingHistoryShow";
import ShipmentHistoryShow from "./pages/shipments/ShipmentHistoryShow";
import { routes } from "./lib/routes";
import { TriggersEdit } from "./pages/triggers/edit";
import { TriggersShow } from "./pages/triggers/show";
import { NotificationsList } from "./pages/notifications/list";
import { NotificationsCreate } from "./pages/notifications/create";
import { ScrollRestoration } from "./components/save-scroll";
import ReceivingAll from "./pages/receiving/ReceivingAll";
import { IncomeShow } from "./pages/cash-desk/incomeShow";
import { NomenklaturaList } from "./pages/nomenklatura/list";
import { BrandList } from "./pages/brand/list";
import { ProductsList } from "./pages/products/list";
import { PackersList } from "./pages/packers/list";
import { OutGroupList } from "./pages/out-group/list";
import { TariffList } from "./pages/tarif/list";
import { TrackList } from "./pages/track/list";
import { CustomLayout } from "./components/layout";
import { SentTheCityList } from "./pages/sent-the-city";
import { ReportList } from "./pages/reports/list";
import { CargoReceivedReport } from "./pages/reports/cargo-received";
import { IncomeReport } from "./pages/reports/income";
import { CargoTypesReport } from "./pages/reports/cargo-types";
import { StockReport } from "./pages/reports/stock";
import { MyCompany } from "./pages/my-company";
import { IssueReport } from "./pages/reports/issue";
import { BankReport } from "./pages/reports/bank";
import { ShipmentReport } from "./pages/reports/receiving";
import { CashDeskReport } from "./pages/reports/cash-desk";
import { CashDeskIncomeReport } from "./pages/reports/cash-desk-income";
import { CashDeskOutcomeReport } from "./pages/reports/cash-desk-outcome";
import { WarehouseStockReport } from "./pages/reports/warehouse-stock";

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
                        <Outlet />
                      </CustomLayout>
                    </Authenticated>
                  }
                >
                  <Route
                    index
                    element={<NavigateToResource resource="goods-processing" />}
                  />

                  <Route path="/goods-processing">
                    <Route index element={<GoogsProcessingList />} />
                    <Route path="create" element={<GoodsCreate />} />
                    <Route path="edit/:id" element={<GoodsEdit />} />
                    <Route path="show/:id" element={<GoodsShow />} />
                  </Route>

                  <Route path="/issue">
                    <Route index element={<IssueProcessingList />} />
                    <Route path="show/:id" element={<GoodsShow />} />
                    <Route
                      path="received"
                      element={<IssueProcessingListReceived />}
                    />
                  </Route>

                  <Route path="/branch">
                    <Route index element={<BranchList />} />
                    <Route path="create" element={<BranchCreate />} />
                    <Route path="edit/:id" element={<BranchEdit />} />
                    <Route path="show/:id" element={<BranchShow />} />
                  </Route>

                  <Route path="/under-branch">
                    <Route index element={<UnderBranchList />} />
                    <Route path="create" element={<UnderBranchCreate />} />
                    <Route path="edit/:id" element={<UnderBranchEdit />} />
                    <Route path="show/:id" element={<UnderBranchShow />} />
                  </Route>

                  <Route path="/users">
                    <Route index element={<UserList />} />
                    <Route path="create" element={<UserCreate />} />
                    <Route path="edit/:id" element={<UserEdit />} />
                    <Route path="show/:id" element={<UserShow />} />
                  </Route>

                  <Route path="/bank-permission">
                    <Route index element={<BankPermissionList />} />
                    <Route path="create" element={<BankPermissionCreate />} />
                  </Route>

                  <Route path="/shipments">
                    <Route index element={<List />} />
                    <Route path="create" element={<Create />} />
                    <Route path="show/:id" element={<Show />} />
                    <Route path="edit/:id" element={<Edit />} />
                    <Route path="show/:id/adding" element={<ShipmentAdd />} />
                    <Route path="history" element={<ShipmentHistory />} />
                    <Route
                      path="history/show/:id"
                      element={<ShipmentHistoryShow />}
                    />
                  </Route>

                  <Route path="/counterparty">
                    <Route index element={<CounterpartyList />} />
                    <Route path="create" element={<CounterpartyCreate />} />
                    <Route path="show/:id" element={<CounterpartyShow />} />
                    <Route path="edit/:id" element={<CounterpartyEdit />} />
                  </Route>

                  <Route path="/receiving">
                    <Route index element={<ReceivingList />} />
                    <Route path="create" element={<ReceivingCreate />} />
                    <Route path="show/:id" element={<ReceivingShow />} />
                    <Route
                      path="show/:id/received"
                      element={<ReceivingShowReceived />}
                    />
                    <Route path="edit/:id" element={<ReceivingEdit />} />
                    <Route path="history" element={<ReceivingHistory />} />
                    <Route path="all" element={<ReceivingAll />} />
                    <Route
                      path="history/show/:id"
                      element={<ReceivingHistoryShow />}
                    />
                  </Route>

                  <Route path="/cash-back">
                    <Route index element={<CashBackList />} />
                    <Route path="create" element={<CashBackCreate />} />
                    <Route path="show/:id" element={<CashBackShow />} />
                    <Route path="edit/:id" element={<CashBackEdit />} />
                  </Route>

                  <Route path="/discount">
                    <Route index element={<DiscountList />} />
                    <Route path="create" element={<DiscountCreate />} />
                    <Route path="show/:id" element={<DiscountShow />} />
                    <Route path="edit/:id" element={<DiscountEdit />} />
                  </Route>

                  <Route path="/reports">
                    <Route index element={<ReportList />} />

                    <Route
                      path="cargo-received"
                      element={<CargoReceivedReport />}
                    />
                    <Route path="nomenclature" element={<CargoTypesReport />} />
                    <Route path="borrow" element={<IncomeReport />} />
                    <Route path="stock" element={<StockReport />} />
                    <Route path="issue" element={<IssueReport />} />
                    <Route path="bank" element={<BankReport />} />
                    <Route path="receiving" element={<ShipmentReport />} />
                    <Route path="cash-desk" element={<CashDeskReport />} />
                    <Route path="cash-desk-income" element={<CashDeskIncomeReport />} />
                    <Route path="cash-desk-outcome" element={<CashDeskOutcomeReport />} />
                    <Route path="warehouse-stock" element={<WarehouseStockReport />} />
                  </Route>

                  <Route path="/notification">
                    <Route index element={<NotificationsList />} />
                    <Route path="create" element={<NotificationsCreate />} />
                  </Route>

                  <Route path="/answer-ready">
                    <Route index element={<TriggersList />} />
                    <Route path="create" element={<TriggersCreate />} />
                    <Route path="edit/:id" element={<TriggersEdit />} />
                    <Route path="show/:id" element={<TriggersShow />} />
                  </Route>

                  <Route path="/bank">
                    <Route index element={<BankList />} />
                    <Route path="create" element={<BankCreate />} />
                    <Route path="show/:id" element={<BankShow />} />
                    <Route path="edit/:id" element={<BankEdit />} />
                  </Route>

                  <Route path="/income">
                    <Route index element={<CashDeskList />} />
                    <Route path="create" element={<CashDeskCreate />} />
                    <Route path="show/:id" element={<IncomeShow />} />
                    {/*<Route path="edit/:id" element={<ReceivingEdit />} />*/}
                  </Route>

                  <Route path="/outcome">
                    <Route index element={<CashDeskOutcomeList />} />
                    <Route path="create" element={<CashDeskCreate />} />
                  </Route>

                  <Route path="/currency">
                    <Route index element={<CurrencyList />} />
                    <Route path="create" element={<CurrencyCreate />} />
                    <Route path="show/:id" element={<CurrencyShow />} />
                    <Route path="edit/:id" element={<CurrencyEdit />} />
                  </Route>

                  <Route path="/shipment">
                    <Route index element={<TrackList />} />
                  </Route>

                  <Route path="/nomenclature">
                    <Route index element={<NomenklaturaList />} />
                  </Route>

                  <Route path="/type-product">
                    <Route index element={<BrandList />} />
                  </Route>

                  <Route path="/products">
                    <Route index element={<ProductsList />} />
                  </Route>

                  <Route path="/packers">
                    <Route index element={<PackersList />} />
                  </Route>

                  <Route path="/visiting-group">
                    <Route index element={<OutGroupList />} />
                  </Route>

                  <Route path="/tariff">
                    <Route index element={<TariffList />} />
                  </Route>

                  <Route path="/sent-the-city">
                    <Route index element={<SentTheCityList />} />
                  </Route>

                  <Route path="/my-company" element={<MyCompany />} />

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
