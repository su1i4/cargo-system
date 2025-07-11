export const i18nProvider_ru = {
  translate: (key: string) => {
    const translations: Record<string, string> = {
      "pages.login.title": "Вход в систему",
      "pages.login.signin": "Войти",
      "pages.login.errors.requiredEmail": "Заполните поле логин",
      "pages.login.errors.requiredPassword": "Заполните поле пароль",
      "pages.login.forgotPassword": "Забыли пароль?",
      "pages.login.noAccount": "Нет аккаунта? Создайте его.",
      "pages.login.fields.email": "Логин",
      "pages.login.fields.password": "Пароль",
      "pages.login.buttons.rememberMe": "Запомнить",
      "buttons.save": "Сохранить",
      "buttons.create": "Создание",
      "buttons.logout": "Выход",
      "shipments.titles.create": "Создать отправку",
      "receiving.titles.create": "Создать получение",
      "goods-processing.titles.create": "Создать спецификацию",
      "receiving.titles.show": "Просмотр получение",
      "goods-processing.titles.list": "Все товары",
      "shipments.titles.list": "Отправки",
      "buttons.show": "Просмотр",
      "goods-processing.titles.show": "Просмотр Спецификации",
      "goods-processing.titles.edit": "Изменить",
      "shipments.titles.edit": "Изменить",
      "received.titles.show": "Выгруженные товары",
      "receiving.titles.list": "Получение",
      "buttons.edit": "Редактирование",
      "buttons.delete": "Удалить",
      "buttons.refresh": "Обновить",
      "issue.titles.list": "Выдачи",
      "counterparty.titles.list": "Контрагент",
      "cash-back.titles.list": "Кешбек",
      "bank.titles.list": "Банки",
      "bank.titles.create": "Создать Банк",
      "income.titles.list": "Приход",
      "branch.titles.list": "Филиал",
      "under-branch.titles.list": "Пвз",
      "users.titles.list": "Пользователи",
      "notifications.success": "Успешно",
      "notifications.error": "Ошибка",
      "bank.titles.show": "Список операции",
      "remaining-stock.titles.list": "Остатки на складе",
      "branch.titles.create": "Пвз",
      "under-branch.titles.create": "Пвз",
      "buttons.cancel": "Закрыть",
      "exception-code.titles.list": "Исключение",
      "exception-code.titles.create": "Создать исключение",
      "shipments.titles.show": "Просмотр отправки",
      "users.titles.create": "Создание сотрудников",
      "users.titles.show": "Список пользователей",
      "users.titles.edit": "Редактирование пользователя",
      "counterparty.titles.edit": "Редактирование контрагента",
      "counterparty.titles.show": "Просмотр контрагента",
      "discount.titles.list": "Скидки",
      "discount.titles.create": "Создать скидку",
      "discount.titles.show": "Просмотр скидки",
      "discount.titles.edit": "Редактирование скидки",
      "buttons.confirm": "Подтвердить",
      "issued.titles.list": "Выданные посылки",
      "notifications.createSuccess": "Успешно создано",
      "notifications.createError": "Ошибка создания",
      "outcome.titles.list": "Расход",
      "reports.titles.list": "Отчеты",
      "reports.titles.cargoReceived": "Полученные грузы",
      "reports.titles.cargoReceived.searchPlaceholder":
        "Поиск по трек-коду, фио получателя или по коду получателя",
      "accepted-goods.titles.list": "Принятые товары",
      "accepted-goods.titles.show": "Просмотр принятого товара",
      "pages.login.errors.validEmail": "Неверный формат электронной почты",
      "shipment.titles.show": "Подбор товаров",
      "currency.titles.list": "Валюта",
      "currency.titles.create": "Создать валюту",
      "currency.titles.show": "Просмотр валюты",
      "currency.titles.edit": "Редактирование валюты",
      "answer-ready.titles.list": "Триггеры",
      "answer-ready.titles.create": "Создать триггер",
      "answer-ready.titles.show": "Просмотр триггер",
      "answer-ready.titles.edit": "Изменить триггер",
      "shipment-history.titles.list": "История отправлений",
      "receiving-history.titles.list": "История получений",
      "receiving-history-show.titles.show": "Детальная информация",
      "shipment-history-show.titles.show": "Детальная информация",
      "issue.titles.show": "Просмотр посылки",
      "not-paid-goods.titles.list": "Не оплаченные товары",
      "not-paid-goods.titles.show": "Просмотр не оплаченного товара",
      "income.titles.create": "Cоздать приход",
      "notification.titles.list": "Уведомления",
      "notification.titles.create": "Создать уведомление",
      "notifications.editSuccess": "Успешно обновлено",
      "accepted-goods.titles.edit": "Изменить принятый товар",
      "under-branch.titles.edit": "Изменить пвз",
      "under-branch.titles.show": "Просмотр пвз",
      "notifications.deleteSuccess": "Успешно удалено",
      "resend.titles.list": "Переотправка",
      "resend.titles.create": "Создание переотправки",
      "undefined.titles.list": "История переотправлений",
      "resend.titles.show": "Просмотр переотправки",
      "resend.titles.edit": "Изменить переотправку",
      "branch.titles.show": "Просмотр филиала",
      "branch.titles.edit": "Изменить филиал",
      "income.titles.show": "Просмотр прихода",
      "tasks.titles.list": "Задачи",
      "bank.titles.edit": "Редактирование банка",
      "undefined.titles.create": "Создание задачи",
      "tasks.titles.show": "Чат задачи",
      "grooz.titles.list": "Сборные грузы",
      "grooz.titles.show": "Просмотр сборных грузов",
      "nomenclature.titles.list": "Номенклатура",
      "type-product.titles.list": "Тип товара",
      "products.titles.list": "Продукты",
      "packers.titles.list": "Упаковщики",
      "visiting-group.titles.list": "Выездная группа",
      "tariff.titles.list": "Тарифы",
      "cash-back.titles.create": "Создать кешбек",
      "cash-back.titles.show": "Просмотр кешбека",
      "cash-back.titles.edit": "Редактирование кешбека",
    };
    return translations[key] || key;
  },
  changeLocale: () => Promise.resolve(),
  getLocale: () => "ru",
};
