import { Create, useForm } from "@refinedev/antd";
import { Checkbox, Col, Form, Input, Row } from "antd";
import PhoneInput from "react-phone-input-2";

export const BranchCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create title="Создать город" saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Form.Item
              label="Название города"
              name="name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Телефон"
              name="phone"
              rules={[{ required: true }]}
            >
              <PhoneInput
                onlyCountries={["kg", "cn", "kz", "ru"]}
                inputStyle={{ width: "100%", height: 32 }}
                country={"kg"}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Адрес"
              name="address"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Рабочее время" name="workingHours" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Досыльный город" name="is_sent" valuePropName="checked">
              <Checkbox />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="latitude" name="latitude">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="longitude" name="longitude">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
