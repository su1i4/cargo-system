import React, { useEffect, useCallback } from "react";
import { useSelect } from "@refinedev/antd";
import { Col, Row, Select, InputNumber, Form } from "antd";
import Title from "antd/es/typography/Title";

interface GoodsProcessingCreateOthersProps {
  values: any;
  form?: any;
}

const packerSelectConfig = {
  resource: "packers",
  optionLabel: (record: any) => `${record?.first_name || ''} ${record?.last_name || ''}`.trim(),
  onSearch: (value: string) => [
    {
      operator: "or" as const,
      value: [
        {
          field: "first_name",
          operator: "contains" as const,
          value,
        },
        {
          field: "last_name",
          operator: "contains" as const,
          value,
        },
      ],
    },
  ],
};

const visitingGroupSelectConfig = {
  resource: "visiting-group",
  optionLabel: (record: any) => `${record?.first_name || ''} ${record?.last_name || ''}`.trim(),
  onSearch: (value: string) => [
    {
      operator: "or" as const,
      value: [
        {
          field: "first_name",
          operator: "contains" as const,
          value,
        },
        {
          field: "last_name",
          operator: "contains" as const,
          value,
        },
      ],
    },
  ],
};

export const GoodsProcessingCreateOthers = React.memo(
  ({ values, form }: GoodsProcessingCreateOthersProps) => {
    const { selectProps: packerSelectProps } = useSelect(packerSelectConfig);
    const { selectProps: visitingGroupSelectProps } = useSelect(visitingGroupSelectConfig);

    const calculateCommissionAmount = useCallback((
      declaredValue: number,
      commissionPercent: number
    ): number => {
      return (declaredValue * commissionPercent) / 100;
    }, []);

    useEffect(() => {
      if (values?.declared_value && values?.commission && form) {
        const declaredValue = Number(values.declared_value);
        const commissionPercent = Number(values.commission);

        if (!isNaN(declaredValue) && !isNaN(commissionPercent)) {
          const commissionAmount = calculateCommissionAmount(
            declaredValue,
            commissionPercent
          );
          form.setFieldValue("amount_commission", commissionAmount);
        }
      }
    }, [values?.declared_value, values?.commission, form, calculateCommissionAmount]);

    return (
      <>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Процент скидки" name="discount_custom">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Процент наценки" name="markup">
              <InputNumber style={{ width: "100%" }} min={0} addonAfter="%" />
            </Form.Item>
          </Col>
        </Row>
        
        <Title style={{ marginTop: 10 }} level={5}>
          Гарантия
        </Title>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Объявленная ценность" name="declared_value">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Введите объявленную ценность"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Комиссия" name="commission">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={100}
                placeholder="Введите процент комиссии"
                addonAfter="%"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Сумма комиссии" name="amount_commission">
              <InputNumber style={{ width: "100%" }} min={0} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Title style={{ marginTop: 10 }} level={5}>
          Упаковщики
        </Title>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Выберите упаковщика" name="packers">
              <Select {...packerSelectProps} mode="multiple" allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Выездная группа" name="visiting_group_ids">
              <Select
                {...visitingGroupSelectProps}
                mode="multiple"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }
);