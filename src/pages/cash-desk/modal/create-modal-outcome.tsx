import React, { useEffect, useState } from "react";
import { useModalForm, useSelect } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { DatePicker, Form, Input, Modal, Select, Upload, AutoComplete } from "antd";
import { API_URL } from "../../../App";
import { PaperClipOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { CurrencyType } from "../create";

export const MyCreateModalOutcome: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const { modalProps, formProps, submit } = useModalForm({
    resource: "cash-desk",
    action: "create",
    onMutationSuccess: () => {
      onSuccess();
      onClose(); // Закрываем модальное окно после успешного создания
    },
  });

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: "code",
  });

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  const { selectProps: goodSelectProps } = useSelect({
    resource: "goods-processing",
    optionLabel: "name",
  });

  const { selectProps: userSelectProps } = useSelect({
    resource: "users",
    optionLabel: "firstName",
  });

  // Сохраняем выбранный id клиента
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<
    string | null
  >(null);

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

  // Обработчик выбора клиента в Select
  const handleCounterpartyChange = (value: string, option: any) => {
    setSelectedCounterpartyId(value);
  };

  const expenseTypes = [
    { value: "Оплата поставщику", label: "Оплата поставщику" },
    { value: "Оплата за ремонт", label: "Оплата за ремонт" },
    { value: "Выплата заработной платы работнику", label: "Выплата заработной платы работнику" },
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
  ];

  const incomeTypes = [{ value: "cash", label: "Оплата наличными" }];

  const currentDateDayjs = dayjs();

  useEffect(() => {
    if (open && formProps.form) {
      formProps.form.setFieldsValue({
        date: currentDateDayjs,
      });
    }
  }, [open, formProps.form]);

  // Custom styles for form with reduced gap
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
            disabled={true}
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
          name="type_currency"
          label="Валюта"
          rules={[{ required: true, message: "Выберите Валюту" }]}
          style={formItemStyle}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Выберите валюту"
            options={Object.values(CurrencyType).map((item: any) => ({
              label: `${item}`,
              value: item,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Статья расходов"
          name="type_operation"
          rules={[
            { required: false, message: "Пожалуйста, выберите или введите статью расходов" },
          ]}
          style={formItemStyle}
        >
          <AutoComplete
            options={expenseTypes}
            placeholder="Выберите или введите статью расходов"
            style={{ width: "100%" }}
            filterOption={(inputValue, option) =>
              option?.label?.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
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
          rules={[{ required: true, message: "Укажите сумму" }]}
          style={formItemStyle}
        >
          <Input
            placeholder="Введите сумму прихода"
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
