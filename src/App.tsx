import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import authProvider from "./authProvider";

import {
  useNotificationProvider,
  ThemedLayoutV2,
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
import {
  GoodsCreate,
  GoodsShow,
  GoogsProcessingList,
  GoodsEdit,
} from "./pages/goods-processing";
import { AcceptedGoodsList, AcceptedGoodsShow } from "./pages/accepted-goods";
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
import { CashBackList } from "./pages/cash-back";
import { BankCreate, BankEdit, BankList, BankShow } from "./pages/bank";
import { CashDeskCreate, CashDeskList } from "./pages/cash-desk";
import { CashDeskOutcomeList } from "./pages/cash-desk/outcome";
import { RemainingStockProcessingList } from "./pages/remaining-stock";
import { ExeptionCodeCreate, ExeptionCodeList } from "./pages/exception-code";
import {
  UnderBranchCreate,
  UnderBranchEdit,
  UnderBranchList,
  UnderBranchShow,
} from "./pages/under-branch";
import {
  ReportCreate,
  ReportEdit,
  ReportList,
  ReportShow,
  CargoReceivedReport,
  CashBookReport,
  CargoTypesReport,
  IncomeReport,
  ExpenseReport,
  EmployeesReport,
  BranchesReport,
  CashOperationsReport,
  IncomingFundsReport,
  ExpenseFinanceReport,
} from "./pages/reports";
import {
  ChatbotCreate,
  ChatbotEdit,
  ChatbotList,
  ChatbotShow,
} from "./pages/chatbot-history";
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
import { ShipmentHistory } from "./pages/shipments/ShipmentHistory";
import { ReceivingHistory } from "./pages/receiving/ReceivingHistory";
import { ReceivingHistoryShow } from "./pages/receiving/ReceivingHistoryShow";
import { ShipmentHistoryShow } from "./pages/shipments/ShipmentHistoryShow";
import { NotPaidGoodsList } from "./pages/not-paid-goods/list";
import { NotPaidGoodsShow } from "./pages/not-paid-goods/show";
import { routes } from "./lib/routes";
import { TriggersEdit } from "./pages/triggers/edit";
import { TriggersShow } from "./pages/triggers/show";
import { NotificationsList } from "./pages/notifications/list";
import { NotificationsCreate } from "./pages/notifications/create";
import { AcceptedGoodsEdit } from "./pages/accepted-goods/edit";
import { ScrollRestoration } from "./hooks/save-scroll";
import ResendList from "./pages/resend/list";
import ResendCreate from "./pages/resend/create";
import ResendShow from "./pages/resend/show";
import ResendEdit from "./pages/resend/edit";
import { ResendHistory } from "./pages/resend/history";
import { ResendHistoryShow } from "./pages/resend/history-show";
import ReceivingAll from "./pages/receiving/ReceivingAll";
import { IncomeShow } from "./pages/cash-desk/incomeShow";
import { TasksList } from "./pages/tasks/list";
import { TasksCreate } from "./pages/tasks/create";
// import { TasksyShow } from "./pages/tasks/show";
import { TasksEdit } from "./pages/tasks/edit";
import TasksyShow from "./pages/tasks/show";
import { liveProvider } from "./contexts/liveProvider";
import { TasksArchive } from "./pages/tasks/archive";
import { IncomeShowReport } from "./pages/reports/income-report/show";
import { CounterpartyGrooz } from "./pages/grooz/list";
import { GroozShow } from "./pages/grooz/show";
import { RepresentativeReport } from "./pages/reports/representative";
export const API_URL = import.meta.env.VITE_DEV_URL;

function App() {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("access_token");
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
      const refresh_token = localStorage.getItem("refresh_token");
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
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      return data.accessToken;
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("firstName");
      localStorage.removeItem("lastName");
      localStorage.removeItem("id");
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
              liveProvider={liveProvider}
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider}
              routerProvider={routerBindings}
              authProvider={authProvider}
              i18nProvider={i18nProvider_ru}
              accessControlProvider={{
                can: async ({ resource, action }) => {
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
              }}
              onLiveEvent={(event) => {}}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-routes"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <ThemedLayoutV2
                        Header={() => <Header sticky />}
                        Sider={(props) => <CustomSider {...props} />}
                      >
                        <Outlet />
                      </ThemedLayoutV2>
                    </Authenticated>
                  }
                >
                  <Route
                    index
                    element={<NavigateToResource resource="accepted-goods" />}
                  />

                  <Route path="/goods-processing">
                    <Route index element={<GoogsProcessingList />} />
                    <Route path="create" element={<GoodsCreate />} />
                    <Route path="edit/:id" element={<GoodsEdit />} />
                    <Route path="show/:id" element={<GoodsShow />} />
                  </Route>

                  <Route path="/accepted-goods">
                    <Route index element={<AcceptedGoodsList />} />
                    <Route path="show/:id" element={<AcceptedGoodsShow />} />
                    <Route path="edit/:id" element={<AcceptedGoodsEdit />} />
                  </Route>

                  <Route path="/not-paid-goods">
                    <Route index element={<NotPaidGoodsList />} />
                    <Route path="show/:id" element={<NotPaidGoodsShow />} />
                  </Route>

                  <Route path="/grooz">
                    <Route index element={<CounterpartyGrooz />} />
                    <Route path="show/:id" element={<GroozShow />} />
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

                  <Route path="/resend">
                    <Route index element={<ResendList />} />
                    <Route path="create" element={<ResendCreate />} />
                    <Route path="show/:id" element={<ResendShow />} />
                    <Route path="edit/:id" element={<ResendEdit />} />
                    <Route path="history" element={<ResendHistory />} />
                    <Route
                      path="history/show/:id"
                      element={<ResendHistoryShow />}
                    />
                  </Route>

                  <Route path="/counterparty">
                    <Route index element={<CounterpartyList />} />
                    <Route path="create" element={<CounterpartyCreate />} />
                    <Route path="show/:id" element={<CounterpartyShow />} />
                    <Route path="edit/:id" element={<CounterpartyEdit />} />
                  </Route>

                  <Route path="/tasks">
                    <Route index element={<TasksList />} />
                    <Route path="create" element={<TasksCreate />} />
                    <Route path="show/:id" element={<TasksyShow />} />
                    <Route path="edit/:id" element={<TasksEdit />} />
                    <Route path="archive" element={<TasksArchive />} />
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
                    <Route path="create" element={<ReceivingCreate />} />
                    <Route path="show/:id" element={<ReceivingShow />} />
                    <Route path="edit/:id" element={<ReceivingEdit />} />
                  </Route>

                  <Route path="/discount">
                    <Route index element={<DiscountList />} />
                    <Route path="create" element={<DiscountCreate />} />
                    <Route path="show/:id" element={<DiscountShow />} />
                    <Route path="edit/:id" element={<DiscountEdit />} />
                  </Route>

                  <Route path="/reports">
                    <Route index element={<ReportList />} />
                    <Route path="create" element={<ReportCreate />} />
                    <Route path="show/:id" element={<ReportShow />} />
                    <Route path="edit/:id" element={<ReportEdit />} />

                    <Route
                      path="cargo-received"
                      element={<CargoReceivedReport />}
                    />
                    <Route path="cash-book" element={<CashBookReport />} />
                    <Route path="cargo-types" element={<CargoTypesReport />} />
                    <Route path="income" element={<IncomeReport />} />
                    <Route path="expense" element={<ExpenseReport />} />
                    <Route path="employees" element={<EmployeesReport />} />
                    <Route path="branches" element={<BranchesReport />} />
                    <Route
                      path="cash-operations"
                      element={<CashOperationsReport />}
                    />
                    <Route
                      path="incoming-funds"
                      element={<IncomingFundsReport />}
                    />
                    <Route
                      path="incoming-funds/:id"
                      element={<IncomeShowReport />}
                    />
                    <Route
                      path="expense-finance"
                      element={<ExpenseFinanceReport />}
                    />
                    <Route
                      path="expense-representative"
                      element={<RepresentativeReport />}
                    />
                  </Route>

                  <Route path="/notification">
                    <Route index element={<NotificationsList />} />
                    <Route path="create" element={<NotificationsCreate />} />
                  </Route>

                  <Route path="/chatbot-history">
                    <Route index element={<ChatbotList />} />
                    <Route path="create" element={<ChatbotCreate />} />
                    <Route path="show/:id" element={<ChatbotShow />} />
                    <Route path="edit/:id" element={<ChatbotEdit />} />
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
                    {/*<Route path="show/:id" element={<ReceivingShow />} />*/}
                    {/*<Route path="edit/:id" element={<ReceivingEdit />} />*/}
                  </Route>

                  <Route path="/currency">
                    <Route index element={<CurrencyList />} />
                    <Route path="create" element={<CurrencyCreate />} />
                    <Route path="show/:id" element={<CurrencyShow />} />
                    <Route path="edit/:id" element={<CurrencyEdit />} />
                  </Route>

                  <Route path="/remaining-stock">
                    <Route index element={<RemainingStockProcessingList />} />
                    {/*<Route path="create" element={<BankCreate />} />*/}
                    {/*<Route path="show/:id" element={<ReceivingShow />} />*/}
                    {/*<Route path="edit/:id" element={<ReceivingEdit />} />*/}
                  </Route>

                  <Route path="/exception-code">
                    <Route index element={<ExeptionCodeList />} />
                    <Route path="create" element={<ExeptionCodeCreate />} />
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
                          src="/alfa-china.png" // Путь к логотипу в public
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
