import React, { useEffect, useState } from "react";
import { useModalForm, useSelect } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { Col, DatePicker, Form, Input, Modal, Row, Select, Upload } from "antd";
import dayjs from "dayjs";
import { PaperClipOutlined } from "@ant-design/icons";
import { API_URL } from "../../../App";

export const MyCreateModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { modalProps, formProps, submit } = useModalForm({
    resource: "cash-desk",
    action: "create",
    onMutationSuccess: () => {
      onClose(); // Закрываем модальное окно после успешного создания
    },
  });

  // Сохраняем выбранный id клиента
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<
    string | null
  >(null);

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) =>
      `${item.name} ${item.clientPrefix}-${item.clientCode}`,
    filters: [
      {
        operator: "or",
        value: [
          { field: "name", operator: "contains", value: "" },
          { field: "clientCode", operator: "contains", value: "" },
          { field: "clientPrefix", operator: "contains", value: "" },
        ],
      },
    ],
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

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  const { selectProps: goodSelectProps } = useSelect({
    resource: "goods-processing",
    optionLabel: "name",
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

  // Обработчик выбора клиента в Select
  const handleCounterpartyChange = (value: any) => {
    setSelectedCounterpartyId(value);
  };

  const expenseTypes = [
    { value: "supplier_payment", label: "Оплата поставщику" },
    { value: "repair_payment", label: "Оплата за ремонт" },
    { value: "salary_payment", label: "Выплата заработной платы работнику" },
    { value: "advance_payment", label: "Выдача подотчет" },
  ];

  const incomeTypes = [
    { value: "cash", label: "Оплата наличными" },
    { value: "transfer", label: "Оплата переводом" },
    { value: "transfer_to_card", label: "Оплата перечислением" },
    { value: "bonus", label: "Оплата баллами" },
  ];

  const currentDateDayjs = dayjs();

  useEffect(() => {
    if (open && formProps.form) {
      formProps.form.setFieldsValue({
        date: currentDateDayjs,
      });
    }
  }, [open, formProps.form]);

  enum CurrencyType {
    Usd = "Доллар",
    Rub = "Рубль",
    Som = "Сом",
    Eur = "Евро",
  }

  return (
    <Modal
      {...modalProps}
      title={<h3 style={{ margin: 0 }}>Добавить приход</h3>}
      onOk={submit}
      open={open}
      onCancel={onClose}
      cancelButtonProps={{ style: { display: "none" } }}
      // okButtonProps={{ style: { backgroundColor: "#52c41a" } }}
      width={800}
      okText="Добавить"
      // Пример стилизации "шапки" модалки
    >
      <Form
        {...formProps}
        layout="vertical"
        style={{ marginBottom: 0 }}
        initialValues={{
          type: "income",
          // Не устанавливаем дату здесь, а делаем это через useEffect
        }}
      >
        <Row gutter={[16, 2]}>
          <Col span={12}>
            <Form.Item
              label="Дата поступление"
              name="date"
              style={{ marginBottom: 5 }}
            >
              <DatePicker
                disabled={true}
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm:ss"
                showTime
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Банк"
              name={["bank_id"]}
              rules={[{ required: true, message: "Пожалуйста, выберите Банк" }]}
              // Настройка отступов между лейблом и инпутом
              style={{ marginBottom: 5 }}
            >
              <Select
                {...bankSelectProps}
                placeholder="Выберите код банк"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Вид прихода"
              name={["type_operation"]}
              rules={[
                { required: false, message: "Пожалуйста, выберите Банк" },
              ]}
              // Настройка отступов между лейблом и инпутом
              style={{ marginBottom: 5 }}
            >
              <Select
                options={incomeTypes}
                placeholder="Выберите вид прихода"
                style={{ width: "100%" }}
                mode="tags"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Код Клиента"
              name={["counterparty_id"]}
              rules={[
                { required: true, message: "Пожалуйста, выберите клиента" },
              ]}
              style={{ marginBottom: 5 }}
            >
              <Select
                {...counterpartySelectProps}
                onChange={handleCounterpartyChange}
                placeholder="Выберите код клиента"
                style={{ width: "100%" }}
                showSearch
                filterOption={false}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Трек-код"
              name="name"
              rules={[{ required: false, message: "Укажите имя" }]}
              style={{ marginBottom: 5 }}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Сумма"
              name="amount"
              rules={[{ required: true, message: "Укажите сумму" }]}
              style={{ marginBottom: 5 }}
            >
              <Input
                type="number"
                min={0}
                placeholder="Введите сумму прихода"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="type_currency"
              label="Валюта"
              rules={[{ required: true, message: "Выберите Валюту" }]}
            >
              <Select
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={Object.values(CurrencyType).map((item: any) => ({
                  label: `${item}`,
                  value: item,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Комментарий"
              name="comment"
              rules={[{ required: false }]}
              style={{ marginBottom: 5 }}
            >
              <Input
                placeholder="Комментарий"
                style={{ width: "100%", height: 63 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Чек">
              <Form.Item name="check_file" noStyle>
                <Upload.Dragger
                  name="file"
                  action={`${API_URL}/file-upload`}
                  listType="picture"
                  accept=".png,.jpg,.jpeg"
                  beforeUpload={(file) => {
                    // Создаем объект FormData для отправки файла
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    // Отправляем запрос на сервер для получения пути к файлу
                    fetch(`${API_URL}/file-upload`, {
                      method: 'POST',
                      body: formData,
                    })
                      .then(response => response.json())
                      .then(data => {
                        // Предполагаем, что сервер возвращает объект с путем к файлу
                        const filePath = data.path || data.url || data.filePath;
                        // Устанавливаем путь к файлу в форму
                        if (formProps.form) {
                          formProps.form.setFieldsValue({
                            check_file: filePath
                          });
                        }
                      })
                      .catch(error => {
                        console.error('Ошибка загрузки файла:', error);
                      });
                    
                    // Предотвращаем стандартную загрузку Ant Design
                    return false;
                  }}
                >
                  <p className="ant-upload-text">
                    <PaperClipOutlined /> Прикрепить чек
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
