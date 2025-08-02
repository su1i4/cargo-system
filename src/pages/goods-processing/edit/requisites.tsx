import { useEffect } from "react";
import { useSelect } from "@refinedev/antd";
import { Col, Form, Input, Row, Select } from "antd";
import Title from "antd/es/typography/Title";

interface DiscountOrCashBackItem {
  id: string;
  type: "discount" | "cashback";
  label: string;
  value: number;
  counterpartyId?: number;
  originalData: any;
}

interface GoodsProcessingEditRequisitesProps {
  values: any;
  record: any;
  sentCityData: any[];
  discountCashBackOptions: DiscountOrCashBackItem[];
  selectedDiscountOption: DiscountOrCashBackItem | null;
  setSelectedDiscountOption: (option: DiscountOrCashBackItem | null) => void;
  setDiscountCashBackOptions: (options: DiscountOrCashBackItem[]) => void;
  cashBacks: any[];
  counterpartiesWithDiscounts: any[];
  form: any;
}

export const GoodsProcessingEditRequisites = ({
  values,
  record,
  sentCityData,
  discountCashBackOptions,
  selectedDiscountOption,
  setSelectedDiscountOption,
  setDiscountCashBackOptions,
  cashBacks,
  counterpartiesWithDiscounts,
  form,
}: GoodsProcessingEditRequisitesProps) => {
  
  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) =>
      `${record?.name}${record?.is_sent ? " (досыльный)" : ""}`,
    filters: [
      {
        field: "name",
        operator: "ne",
        value: "Бишкек",
      },
    ],
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
  });

  const { selectProps: counterpartySelectPropsSender } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) =>
      `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}`,
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "sender",
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
          {
            field: "clientPrefix",
            operator: "contains",
            value,
          },
          {
            field: "name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

  const { selectProps: counterpartySelectPropsReceiver } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) =>
      `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}`,
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "receiver",
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
          {
            field: "clientPrefix",
            operator: "contains",
            value,
          },
          {
            field: "name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

  const { selectProps: branchSelectPropsIsSent } = useSelect({
    resource: "sent-the-city",
    optionLabel: (record: any) => `${record?.sent_city?.name}`,
    filters: [
      {
        field: "city_id",
        operator: "eq",
        value: values?.destination_id,
      },
    ],
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
  });

  // Обновляем опции скидок и кешбека
  useEffect(() => {
    const options: DiscountOrCashBackItem[] = [];

    // Фильтруем контрагентов со скидками по выбранным отправителю и получателю
    const relevantCounterparties = counterpartiesWithDiscounts.filter((record: any) => {
      const hasDiscount = record?.discount?.discount > 0;
      const isSelectedParty = record.id === values?.sender_id || record.id === values?.recipient_id;
      return hasDiscount && isSelectedParty;
    });

    relevantCounterparties.forEach((record: any) => {
      options.push({
        id: `discount-${record.id}`,
        type: "discount",
        label: `Скидка: ${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, '${record?.discount?.discount}' руб`,
        value: record.discount.discount,
        counterpartyId: record.id,
        originalData: record,
      });
    });

    cashBacks.forEach((cashBack) => {
      if (
        cashBack.counterparty_id === values?.sender_id ||
        cashBack.counterparty_id === values?.recipient_id
      ) {
        options.push({
          id: `cashback-${cashBack.id}`,
          type: "cashback",
          label: `Кешбек: ${cashBack.counterparty?.clientPrefix}-${cashBack.counterparty?.clientCode}, ${cashBack.counterparty?.name}, '${cashBack.amount}' руб`,
          value: cashBack.amount,
          counterpartyId: cashBack.counterparty_id,
          originalData: cashBack,
        });
      }
    });

    setDiscountCashBackOptions(options);
  }, [
    counterpartiesWithDiscounts,
    cashBacks,
    values?.sender_id,
    values?.recipient_id,
    setDiscountCashBackOptions,
  ]);

  // Автовыбор скидки/кешбека
  useEffect(() => {
    if (
      discountCashBackOptions.length > 0 &&
      (values?.sender_id || values?.recipient_id)
    ) {
      const cashBackOption = discountCashBackOptions.find(
        (option) => option.type === "cashback"
      );

      if (cashBackOption) {
        setSelectedDiscountOption(cashBackOption);
        const cashBackTarget =
          cashBackOption.counterpartyId === values?.sender_id
            ? "sender"
            : "receiver";
        form?.setFieldsValue({
          cash_back_id: cashBackOption.id,
          cash_back_target: cashBackTarget,
        });
      } else {
        const discountOption = discountCashBackOptions.find(
          (option) => option.type === "discount"
        );

        if (discountOption) {
          setSelectedDiscountOption(discountOption);
          form?.setFieldsValue({
            discount_id: discountOption.id,
          });
        }
      }
    } else if (discountCashBackOptions.length === 0) {
      setSelectedDiscountOption(null);
      form?.setFieldsValue({
        cash_back_id: null,
        cash_back_target: null,
        discount_id: null,
      });
    }
  }, [discountCashBackOptions, values?.sender_id, values?.recipient_id, setSelectedDiscountOption, form]);

  return (
    <>
      <Title level={5}>Реквизиты</Title>
      <Row gutter={16}>
        <Col span={4}>
          <Form.Item
            rules={[{ required: true, message: "Город назначения обязателен" }]}
            label="Город назначения"
            name="destination_id"
          >
            <Select
              onChange={(val, record: any) => {
                const sentCityRecord = sentCityData.find(
                  (item: any) => item.sent_city_id === val
                );

                if (sentCityRecord) {
                  form?.setFieldsValue({
                    destination_id: sentCityRecord.city_id,
                    sent_back_id: sentCityRecord.id,
                  });
                  return;
                }

                form?.setFieldsValue({
                  destination_id: val,
                  sent_back_id: null,
                });
              }}
              {...branchSelectProps}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col span={9}>
          <Form.Item
            rules={[{ required: true, message: "Отправитель обязателен" }]}
            label="Отправитель"
            name="sender_id"
          >
            <Select {...counterpartySelectPropsSender} allowClear />
          </Form.Item>
        </Col>
        <Col span={9}>
          <Form.Item
            rules={[{ required: true, message: "Получатель обязателен" }]}
            label="Получатель"
            name="recipient_id"
          >
            <Select {...counterpartySelectPropsReceiver} allowClear />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Комментарий" name="comments">
            <Input />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Досыльные города" name="sent_back_id">
            <Select {...branchSelectPropsIsSent} allowClear />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            rules={[{ required: true, message: "Способ оплаты обязателен" }]}
            label="Способ оплаты"
            name="payment_method"
            initialValue="Наличные"
          >
            <Select
              showSearch
              allowClear
              placeholder="Выберите способ оплаты"
              options={[
                { label: "Наличные", value: "Наличные" },
                { label: "Безналичные", value: "Безналичные" },
                { label: "Перечислением", value: "Перечислением" },
              ]}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Скидка" name="discount_id">
            <Select
              placeholder="Выберите скидку"
              onChange={(value: string) => {
                const selectedOption = discountCashBackOptions.find(
                  (opt) => opt.id === value && opt.type === "discount"
                );
                
                if (selectedOption) {
                  form?.setFieldsValue({
                    discount_id: selectedOption.originalData.id,
                  });
                } else {
                  form?.setFieldsValue({
                    discount_id: null,
                  });
                }
              }}
              allowClear
              options={discountCashBackOptions
                .filter((option) => option.type === "discount")
                .map((option) => ({
                  label: option.label.replace("Скидка: ", ""),
                  value: option.id,
                }))}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Кешбек" name="cash_back_id">
            <Select
              placeholder="Выберите кешбек"
              onChange={(value: string) => {
                const selectedOption = discountCashBackOptions.find(
                  (opt) => opt.id === value && opt.type === "cashback"
                );
                
                if (selectedOption) {
                  const cashBackTarget =
                    selectedOption.counterpartyId === values?.sender_id
                      ? "sender"
                      : "receiver";
                  form?.setFieldsValue({
                    cash_back_target: cashBackTarget,
                    cash_back_id: selectedOption.id,
                  });
                } else {
                  form?.setFieldsValue({
                    cash_back_id: null,
                    cash_back_target: null,
                  });
                }
              }}
              allowClear
              options={discountCashBackOptions
                .filter((option) => option.type === "cashback")
                .map((option) => ({
                  label: option.label.replace("Кешбек: ", ""),
                  value: option.id,
                }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="cash_back_target" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="cash_back_id" hidden>
        <Input />
      </Form.Item>
    </>
  );
}; 