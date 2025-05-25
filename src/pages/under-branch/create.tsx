import { Create, useForm, useSelect, useTable } from "@refinedev/antd";
import MDEditor from "@uiw/react-md-editor";
import { Col, Flex, Form, Input, Row, Select } from "antd";
import PhoneInput from "react-phone-input-2";

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
    <Create title="Создать филиал" saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            {" "}
            <Form.Item
              label="Название города"
              name={["branch_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select placeholder="Выберите город" {...branchSelectProps} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Название филиала"
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
          label="Телефон"
          name={["phone"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <PhoneInput
            inputStyle={{ width: "100%", height: 32 }}
            country={"kg"}
            onlyCountries={["kg", "ru"]}
          />
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
