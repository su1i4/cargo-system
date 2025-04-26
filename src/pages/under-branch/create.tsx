import { Create, useForm, useSelect, useTable } from "@refinedev/antd";
import MDEditor from "@uiw/react-md-editor";
import { Col, Flex, Form, Input, Row, Select } from "antd";

export const UnderBranchCreate = () => {
  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const { selectProps: currencySelectProps } = useSelect({
    resource: "currency",
    optionLabel: "name",
  });
  
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            {" "}
            <Form.Item
              label={"Филлиал"}
              name={["branch_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                placeholder="Выберите филиал"
                {...branchSelectProps}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={"Валюта"}
              name={["currency_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                placeholder="Выберите валюту"
                {...currencySelectProps}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={"Адрес"}
          name={["address"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={"Рабочее время"}
          name={["work_schedule"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
