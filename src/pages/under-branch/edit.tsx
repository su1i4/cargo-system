import {
  DeleteButton,
  Edit,
  EditButton,
  useForm,
  useSelect,
} from "@refinedev/antd";
import { Col, Form, Input, Row, Select } from "antd";
import PhoneInput from "react-phone-input-2";

export const UnderBranchEdit = () => {
  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const { selectProps: currencySelectProps } = useSelect({
    resource: "currency",
    optionLabel: "name",
  });

  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      headerButtons={() => false}
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
    >
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            {" "}
            <Form.Item
              label={"Название города"}
              name={["branch_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select placeholder="Выберите филиал" {...branchSelectProps} />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>

        <Form.Item
          label={"Название филиала"}
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
    </Edit>
  );
};
