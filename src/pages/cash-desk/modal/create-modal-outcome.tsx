import React, { useEffect, useState } from "react";
import { useModalForm, useSelect } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import {
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Upload,
  AutoComplete,
  message,
} from "antd";
import { API_URL } from "../../../App";
import { PaperClipOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { CurrencyType } from "../create";

export const MyCreateModalOutcome: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const { modalProps, formProps, submit, form } = useModalForm({
    resource: "cash-desk",
    action: "create",
    onMutationSuccess: () => {
      onSuccess();
      onClose(); // Закрываем модальное окно после успешного создания
    },
  });

  const role = localStorage.getItem("cargo-system-role");

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  // Сохраняем выбранный id клиента
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<
    string | null
  >(null);
  const [isBalanceOperation, setIsBalanceOperation] = useState(false);

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) =>
      `${item.name} ${item.clientPrefix}-${item.clientCode}`,
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          { field: "name", operator: "contains", value },
          { field: "clientCode", operator: "contains", value },
          { field: "clientPrefix", operator: "contains", value },
        ],
      },
    ],
  });

  // Получаем данные клиента по выбранному id с помощью useOne
  const {
    data: counterpartyData,
    isLoading: isCounterpartyLoading,
    isError: isCounterpartyError,
  } = useOne({
    resource: "counterparty",
    id: selectedCounterpartyId ?? "",
    queryOptions: {
      enabled: !!selectedCounterpartyId, // Хук активен только если выбран id
    },
  });

  // При получении данных обновляем поле "Имя" в форме
  useEffect(() => {
    if (counterpartyData && counterpartyData.data) {
      // @ts-ignore
      formProps.form.setFieldsValue({
        name: counterpartyData.data.name, // Предполагается, что данные клиента содержат поле name
      });
    }
  }, [counterpartyData, formProps.form]);

  const expenseTypes = [
    { value: "Оплата поставщику", label: "Оплата поставщику" },
    { value: "Оплата за ремонт", label: "Оплата за ремонт" },
    { value: "Контрагент с баланса", label: "Контрагент с баланса" },
    {
      value: "Выплата заработной платы работнику",
      label: "Выплата заработной платы работнику",
    },
    {
      value: "Выплата учредителю",
      label: "Выплата учредителю",
    },
    { value: "Выдача подотчет", label: "Выдача подотчет" },
    { value: "Фрахт", label: "Фрахт" },
    { value: "Проходы КЗ", label: "Проходы КЗ" },
    { value: "Проходы РФ", label: "Проходы РФ" },
    { value: "Встречка", label: "Встречка" },
    { value: "Грузчики", label: "Грузчики" },
    { value: "Газель", label: "Газель" },
    { value: "Аренда офиса", label: "Аренда офиса" },
    { value: "Аренда Склада", label: "Аренда Склада" },
    { value: "Бонус", label: "Бонус" },
    { value: "Заработная оплата", label: "Заработная оплата" },
    { value: "Мобильная связь", label: "Мобильная связь" },
    { value: "Канц товары", label: "Канц товары" },
    { value: "ГСМ", label: "ГСМ" },
    { value: "Возврат депозита", label: "Возврат депозита" },
    { value: "Мешки", label: "Мешки" },
    { value: "Электроэнергия", label: "Электроэнергия" },
    { value: "Оплата за мусор", label: "Оплата за мусор" },
    { value: "Фрахт стандарт", label: "Фрахт стандарт" },
    { value: "Фрахт за экспресс", label: "Фракт за экспресс" },
    { value: "Граница", label: "Граница" },
    { value: "Документы", label: "Документы" },
    { value: "Обратная дорога экспресс", label: "Обратная дорога экспресс" },
    { value: "Обслуживание ТС", label: "Обслуживание ТС" },
    { value: "ГСМ", label: "ГСМ" },
    { value: "Склад", label: "Склад" },
    { value: "Аренда", label: "Аренда" },
    { value: "Коммунальные Услуги", label: "Коммунальные Услуги" },
    { value: "Охрана", label: "Охрана" },
    { value: "Хоз товары", label: "Хоз товары" },
    { value: "Канц товары", label: "Канц товары" },
    { value: "Зп сотрудникам", label: "Зп сотрудникам" },
    { value: "Погрузка", label: "Погрузка" },
  ];

  const currentDateDayjs = dayjs();

  useEffect(() => {
    if (open && formProps.form) {
      formProps.form.setFieldsValue({
        date: currentDateDayjs,
      });
    }
  }, [open, formProps.form]);

  const formItemStyle = {
    marginBottom: 8, // Reduced margin between form items
  };

  return (
    <Modal
      {...modalProps}
      title={<h2 style={{ margin: 0 }}>Добавить Расход</h2>}
      onOk={submit}
      open={open}
      onCancel={onClose}
      cancelButtonProps={{ style: { display: "none" } }}
      width={483}
      okText="Добавить"
      bodyStyle={{
        height: "auto",
        overflow: "visible",
        paddingRight: 0,
      }}
    >
      <Form
        {...formProps}
        layout="vertical"
        style={{ marginBottom: 0 }}
        initialValues={{
          type: "outcome",
        }}
      >
        <Form.Item label="Дата расход" name="date" style={formItemStyle}>
          <DatePicker
            disabled={role === "admin" ? false : true}
            style={{ width: "100%" }}
            format="YYYY-MM-DD HH:mm:ss"
            showTime
          />
        </Form.Item>

        <Form.Item
          label="Банк"
          name={["bank_id"]}
          rules={[{ required: true, message: "Пожалуйста, выберите Банк" }]}
          style={formItemStyle}
        >
          <Select
            {...bankSelectProps}
            placeholder="Выберите код банк"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Статья расходов"
          name="type_operation"
          rules={[
            {
              required: true,
              message: "Пожалуйста, выберите или введите статью расходов",
            },
          ]}
          style={formItemStyle}
        >
          <AutoComplete
            options={expenseTypes}
            placeholder="Выберите или введите статью расходов"
            style={{ width: "100%" }}
            filterOption={(inputValue, option) =>
              option?.label?.toLowerCase().indexOf(inputValue.toLowerCase()) !==
              -1
            }
            onSelect={(value) => {
              if (value === "Контрагент с баланса") {
                setIsBalanceOperation(true);
                form.setFieldValue("type_currency", "Рубль");
              } else {
                setIsBalanceOperation(false);
              }
            }}
          />
        </Form.Item>

        {isBalanceOperation && (
          <>
            <Form.Item
              label="Код клиента"
              name="counterparty_id"
              rules={[
                { required: true, message: "Пожалуйста, выберите клиента" },
              ]}
              style={formItemStyle}
            >
              <Select
                {...counterpartySelectProps}
                placeholder="Выберите клиента"
                style={{ width: "100%" }}
                showSearch
                filterOption={false}
                onChange={(value) => setSelectedCounterpartyId(String(value))}
              />
            </Form.Item>
            {counterpartyData?.data?.ross_coin !== undefined && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#f0f2f5",
                  borderRadius: "6px",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                <strong>Баланс контрагента:</strong>{" "}
                {counterpartyData.data.ross_coin || 0} руб
              </div>
            )}
          </>
        )}

        <Form.Item
          name="type_currency"
          label="Валюта"
          rules={[{ required: true, message: "Выберите Валюту" }]}
          style={formItemStyle}
        >
          <Select
            showSearch
            disabled={isBalanceOperation}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Выберите валюту"
            options={
              isBalanceOperation
                ? [{ label: "Рубль", value: "Рубль" }]
                : Object.values(CurrencyType).map((item: any) => ({
                    label: `${item}`,
                    value: item,
                  }))
            }
          />
        </Form.Item>

        <Form.Item
          label="Вид операции"
          name="type"
          rules={[{ required: false, message: "Укажите имя" }]}
          style={{ ...formItemStyle, display: "none" }}
        >
          <Input disabled style={{ backgroundColor: "#f5f5f5" }} />
        </Form.Item>

        <Form.Item
          label="Сумма"
          name="amount"
          rules={[
            { required: true, message: "Укажите сумму" },
            {
              validator: (_, value) => {
                if (isBalanceOperation) {
                  const balance = Number(
                    counterpartyData?.data?.ross_coin || 0
                  );
                  if (Number(value) > balance) {
                    return Promise.reject(
                      new Error(
                        "Сумма расхода не может превышать баланс контрагента."
                      )
                    );
                  }
                  if (Number(value) <= 0) {
                    return Promise.reject(
                      new Error("Сумма расхода должна быть больше нуля.")
                    );
                  }
                }
                return Promise.resolve();
              },
            },
          ]}
          style={formItemStyle}
        >
          <Input
            type="number"
            onKeyPress={(event) => {
              if (!/[0-9]/.test(event.key)) {
                event.preventDefault();
              }
            }}
            max={
              isBalanceOperation &&
              counterpartyData?.data?.ross_coin !== undefined
                ? Number(counterpartyData.data.ross_coin)
                : undefined
            }
            placeholder="Введите сумму расхода"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Комментарий"
          name="comment"
          rules={[{ required: false }]}
          style={formItemStyle}
        >
          <Input placeholder="Комментарий" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Чек" style={formItemStyle}>
          <Form.Item name="photo" noStyle>
            <Upload.Dragger
              name="file"
              action={`${API_URL}/file-upload`}
              listType="picture"
              accept=".png,.jpg,.jpeg"
              beforeUpload={(file) => {
                const formData = new FormData();
                formData.append("file", file);
                fetch(`${API_URL}/file-upload`, {
                  method: "POST",
                  body: formData,
                })
                  .then((response) => response.json())
                  .then((data) => {
                    const filePath = data.path || data.url || data.filePath;
                    if (formProps.form) {
                      formProps.form.setFieldsValue({
                        photo: filePath,
                      });
                    }
                  })
                  .catch((error) => {
                    console.error("Ошибка загрузки файла:", error);
                  });
                return false;
              }}
            >
              <p className="ant-upload-text">
                <PaperClipOutlined /> Прикрепить чек
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form.Item>
      </Form>
    </Modal>
  );
};
