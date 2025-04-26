import {
  ShoppingCartOutlined,
  WalletOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  RobotOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";

export const routes = [
  {
    name: "Продукты",
    icon: <ShoppingCartOutlined />,
    meta: {
      label: "Продукты",
    },
  },
  {
    name: "Контрагенты",
    icon: <UsergroupAddOutlined />,
    meta: {
      label: "Контрагенты",
    },
  },
  {
    name: "Касса",
    icon: <WalletOutlined />,
    meta: {
      label: "Касса",
    },
  },
  {
    name: "Автоматизация",
    icon: <RobotOutlined />,
    meta: {
      label: "Автоматизация",
    },
  },
  {
    name: "Задачи",
    icon: <OrderedListOutlined />,
    meta: {
      label: "Задачи",
    },
  },
  {
    name: "Настройки",
    icon: <SettingOutlined />,
    meta: {
      label: "Настройки",
    },
  },

  {
    name: "accepted-goods",
    list: "/accepted-goods",
    show: "/accepted-goods/show/:id",
    edit: "/accepted-goods/edit/:id",
    meta: {
      canDelete: true,
      label: "Принятые товары",
      parent: "Продукты",
    },
  },
  {
    name: "grooz",
    list: "/grooz",
    show: "/grooz/show/:id",
    edit: "/grooz/edit/:id",
    meta: {
      canDelete: true,
      label: "Сборные грузы",
      parent: "Продукты",
    },
  },
  {
    name: "tasks",
    list: "/tasks",
    show: "/tasks/show/:id",
    edit: "/tasks/edit/:id",
    meta: {
      canDelete: true,
      label: "Задачи",
      parent: "Автоматизация",
    },
  },
  {
    name: "shipments",
    list: "/shipments",
    create: "/shipments/create",
    edit: "/shipments/edit/:id",
    show: "/shipments/show/:id",
    meta: {
      canDelete: true,
      label: "Отправка",
      parent: "Продукты",
    },
  },
  {
    name: "resend",
    list: "/resend",
    create: "/resend/create",
    edit: "/resend/edit/:id",
    show: "/resend/show/:id",
    meta: {
      canDelete: true,
      label: "Переотправка",
      parent: "Продукты",
    },
  },
  {
    name: "shipment",
    list: "/shipments/show/:id/adding",
    meta: {
      parent: "shipments",
      label: "Подбор товаров",
      hide: true,
    },
  },
  {
    name: "shipment-history",
    list: "/shipments/history",
    meta: {
      parent: "shipments",
      label: "История отправлений",
      hide: true,
    },
  },
  {
    name: "shipment-history-show",
    list: "/shipments/history/show/:id",
    meta: {
      parent: "shipment-history",
      label: "Детальная информация",
      hide: true,
    },
  },
  {
    name: "receiving",
    list: "/receiving",
    create: "/receiving/create",
    edit: "/receiving/edit/:id",
    show: "/receiving/show/:id",
    meta: {
      canDelete: true,
      label: "Получение",
      parent: "Продукты",
    },
  },
  {
    name: "received",
    list: "/receiving/show/:id/received",
    meta: {
      parent: "receiving",
      label: "Выгруженные товары",
      hide: true,
    },
  },
  {
    name: "receiving-history",
    list: "/receiving/history",
    meta: {
      parent: "receiving",
      label: "История получений",
      hide: true,
    },
  },
  {
    name: "receiving-history-show",
    list: "/receiving/history/show/:id",
    meta: {
      parent: "receiving-history",
      label: "Детальная информация",
      hide: true,
    },
  },
  {
    name: "issue",
    list: "/issue",
    show: "/issue/show/:id",
    meta: {
      canDelete: true,
      label: "Выдача",
      parent: "Продукты",
    },
  },
  {
    name: "issued",
    list: "/issue/received",
    meta: {
      parent: "issue",
      label: "Выданные посылки",
      hide: true,
    },
  },
  {
    name: "remaining-stock",
    list: "/remaining-stock",
    show: "/remaining-stock/show/:id",
    meta: {
      canDelete: true,
      label: "Остатки на складе",
      parent: "Продукты",
    },
  },
  {
    name: "goods-processing",
    list: "/goods-processing",
    create: "/goods-processing/create",
    edit: "/goods-processing/edit/:id",
    show: "/goods-processing/show/:id",
    meta: {
      canDelete: true,
      label: "Все товары",
      parent: "Продукты",
    },
  },
  {
    name: "not-paid-goods",
    list: "/not-paid-goods",
    show: "/not-paid-goods/show/:id",
    meta: {
      canDelete: true,
      label: "Не оплаченные товары",
      parent: "Продукты",
    },
  },
  {
    name: "branch",
    list: "/branch",
    create: "/branch/create",
    edit: "/branch/edit/:id",
    show: "/branch/show/:id",
    meta: {
      canDelete: true,
      label: "Филиал",
      parent: "Настройки",
    },
  },
  {
    name: "under-branch",
    list: "/under-branch",
    create: "/under-branch/create",
    edit: "/under-branch/edit/:id",
    show: "/under-branch/show/:id",
    meta: {
      canDelete: true,
      label: "Пвз",
      parent: "Настройки",
    },
  },
  {
    name: "users",
    list: "/users",
    create: "/users/create",
    edit: "/users/edit/:id",
    show: "/users/show/:id",
    meta: {
      canDelete: true,
      label: "Пользователи",
      parent: "Настройки",
    },
  },
  {
    name: "counterparty",
    list: "/counterparty",
    create: "/counterparty/create",
    edit: "/counterparty/edit/:id",
    show: "/counterparty/show/:id",
    meta: {
      canDelete: true,
      label: "Контрагент",
      parent: "Контрагенты",
    },
  },
  {
    name: "cash-back",
    list: "/cash-back",
    create: "/cash-back/create",
    edit: "/cash-back/edit/:id",
    show: "/cash-back/show/:id",
    meta: {
      canDelete: true,
      label: "Кешбек",
      parent: "Контрагенты",
    },
  },

  {
    name: "discount",
    list: "/discount",
    create: "/discount/create",
    edit: "/discount/edit/:id",
    show: "/discount/show/:id",
    meta: {
      canDelete: true,
      label: "Скидки",
      parent: "Контрагенты",
    },
  },
  {
    name: "bank",
    list: "/bank",
    create: "/bank/create",
    edit: "/bank/edit/:id",
    show: "/bank/show/:id",
    meta: {
      canDelete: true,
      label: "Банк",
      parent: "Касса",
    },
  },

  {
    name: "income",
    list: "/income",
    create: "/income/create",
    edit: "/income/edit/:id",
    show: "/income/show/:id",
    meta: {
      canDelete: true,
      label: "Приход",
      parent: "Касса",
    },
  },

  {
    name: "outcome",
    list: "/outcome",
    create: "/bank/outcome",
    edit: "/bank/outcome/:id",
    show: "/bank/outcome/:id",
    meta: {
      canDelete: true,
      label: "Расход",
      parent: "Касса",
    },
  },
  {
    name: "currency",
    list: "/currency",
    create: "/currency/create",
    edit: "/currency/edit/:id",
    show: "/currency/show/:id",
    meta: {
      canDelete: true,
      label: "Валюта",
      parent: "Касса",
    },
  },
  {
    name: "exception-code",
    list: "/exception-code",
    create: "/exception-code/create",
    meta: {
      canDelete: true,
      label: "Исключение",
      parent: "Настройки",
    },
  },
  {
    name: "reports",
    list: "/reports",
    create: "/reports/create",
    edit: "/reports/:id",
    show: "/reports/:id",
    meta: {
      canDelete: true,
      label: "Отчеты",
      parent: "Автоматизация",
    },
  },
  {
    name: "notification",
    list: "/notification",
    create: "/notification/create",
    meta: {
      canDelete: true,
      label: "Уведомления",
      parent: "Автоматизация",
    },
  },
  {
    name: "chatbot-history",
    list: "/chatbot-history",
    create: "/chatbot-history/create",
    edit: "/chatbot-history/edit/:id",
    show: "/chatbot-history/show/:id",
    meta: {
      canDelete: true,
      label: "История чат-бота",
      parent: "Автоматизация",
    },
  },
  {
    name: "answer-ready",
    list: "/answer-ready",
    create: "/answer-ready/create",
    edit: "/answer-ready/edit/:id",
    show: "/answer-ready/show/:id",
    meta: {
      canDelete: true,
      label: "Триггеры",
      parent: "Автоматизация",
    },
  },
];
