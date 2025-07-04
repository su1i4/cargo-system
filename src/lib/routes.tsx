import {
  SettingOutlined,
  OrderedListOutlined,
  AppstoreOutlined,
  ContactsOutlined,
  BankOutlined,
  HomeOutlined,
} from "@ant-design/icons";

export const routes = [
  {
    name: "Продукты",
    icon: <AppstoreOutlined />,
    meta: {
      label: "Продукты",
    },
  },
  {
    name: "Контрагенты",
    icon: <ContactsOutlined />,
    meta: {
      label: "Контрагенты",
    },
  },
  {
    name: "Касса",
    icon: <BankOutlined />,
    meta: {
      label: "Касса",
    },
  },
  {
    name: "Автоматизация",
    icon: <HomeOutlined />,
    meta: {
      label: "Компания",
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
    name: "shipment",
    list: "/shipment",
    show: "/shipment/show/:id",
    create: "/shipment/create",
    edit: "/shipment/edit/:id",
    meta: {
      canDelete: true,
      label: "Рейсы",
      parent: "Продукты",
    },
  },
  {
    name: "nomenclature",
    list: "/nomenclature",
    show: "/nomenclature/show/:id",
    meta: {
      canDelete: true,
      label: "Номенклатура",
      parent: "Настройки",
    },
  },
  {
    name: "type-product",
    list: "/type-product",
    show: "/type-product/show/:id",
    meta: {
      canDelete: true,
      label: "Тип товара",
      parent: "Настройки",
    },
  },
  {
    name: "products",
    list: "/products",
    show: "/products/show/:id",
    meta: {
      canDelete: true,
      label: "Наши продукты",
      parent: "Настройки",
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
    name: "tariff",
    list: "/tariff",
    create: "/tariff/create",
    edit: "/tariff/edit/:id",
    show: "/tariff/show/:id",
    meta: {
      canDelete: true,
      label: "Тарифы",
      parent: "Настройки",
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
    name: "issued",
    list: "/issue/received",
    meta: {
      parent: "issue",
      label: "Выданные посылки",
      hide: true,
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
      label: "Города",
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
      label: "Филиалы",
      parent: "Настройки",
    },
  },
  {
    name: "sent-the-city",
    list: "/sent-the-city",
    create: "/sent-the-city/create",
    edit: "/sent-the-city/edit/:id",
    show: "/sent-the-city/show/:id",
    meta: {
      canDelete: true,
      label: "Досыльные города",
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
    name: "permission-bank",
    list: "/bank-permission",
    create: "/bank-permission/create",
    meta: {
      canDelete: true,
      label: "Права доступа к банкам",
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
    name: "packers",
    list: "/packers",
    meta: {
      canDelete: true,
      label: "Упаковщики",
      parent: "Настройки",
    },
  },
  {
    name: "visiting-group",
    list: "/visiting-group",
    meta: {
      canDelete: true,
      label: "Выездная группа",
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
    name: "my-company",
    list: "/my-company",
    create: "/my-company/create",
    edit: "/my-company/:id",
    show: "/my-company/:id",
    meta: {
      canDelete: true,
      label: "Моя компания",
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
