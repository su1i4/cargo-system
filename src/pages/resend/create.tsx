import { ArrowLeftOutlined } from "@ant-design/icons";
import { Create, Title, useForm, useSelect } from "@refinedev/antd";
import { useNavigation, useUpdateMany } from "@refinedev/core";
import { Form, Input, DatePicker, Row, Flex, Select, Button } from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

interface IShipment {
  id?: number;
  type: string;
  boxCode: string;
  branch_id: number;
  weight: string;
  length: string;
  width: string;
  height: string;
  cube: string;
  density: string;
  created_at: any;
}

const ResendCreate = () => {
  const { push } = useNavigation();
  const { formProps, saveButtonProps, form } = useForm<IShipment>({
    resource: "shipments",
    redirect: false,
    onMutationSuccess: async (createdShipment) => {
      push("/resend");
    },
  });

  const modifiedFormProps = {
    ...formProps,
    onFinish: async (values: IShipment) => {
      const { cube, ...dataToSubmit } = values;
      if (dataToSubmit.created_at) {
        if (typeof dataToSubmit.created_at === "object") {
          if (dataToSubmit.created_at.$d) {
            dataToSubmit.created_at =
              dataToSubmit.created_at.format("YYYY-MM-DDTHH:mm:ss") + ".100Z";
          } else if (dataToSubmit.created_at instanceof Date) {
            dataToSubmit.created_at = dataToSubmit.created_at.toISOString();
          }
        }
      }
      return formProps.onFinish?.(dataToSubmit);
    },
  };

  const currentDateDayjs = dayjs().tz("Asia/Bishkek");

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        created_at: currentDateDayjs,
      });
    }
  }, []);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const type = [
    "Одежда",
    "Хозка",
    "Обувь",
    "Головные уборы",
    "Смешка",
    "Ткань",
    "Оборудование",
    "Фурнитура",
    "Автозапчасти",
    "Электро товары",
    "Мебель",
    "Инструменты",
    "Аксессуары",
  ];

  //@ts-ignore
  return (
    //@ts-ignore
    <Create
      title={
        <Flex gap={10}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              push("/resend");
            }}
          >
            Назад
          </Button>
          <p>Создание переотправки</p>
        </Flex>
      }
      goBack={false}
      saveButtonProps={saveButtonProps}
    >
      {/* @ts-ignore */}
      <Form {...modifiedFormProps} layout="vertical">
        <Form.Item name="_goods" style={{ display: "none" }}>
          <Input />
        </Form.Item>

        <Row style={{ width: "100%" }}>
          <Flex gap={10}>
            <Form.Item
              label="Дата отправки"
              name="created_at"
              style={{ marginBottom: 5 }}
              rules={[{ required: true }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
                placeholder="Выберите дату"
                showTime
              />
            </Form.Item>
            <Form.Item
              style={{ minWidth: 200 }}
              label="Тип"
              name="type"
              rules={[{ required: true }]}
            >
              <Select
                options={type.map((enumValue) => ({
                  label: enumValue,
                  value: enumValue,
                }))}
              />
            </Form.Item>
            <Form.Item
              style={{ width: 250 }}
              label="Код коробки"
              name="boxCode"
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ width: 250 }}
              label="Номер фуры"
              name="truck_number"
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ width: 250 }}
              name="branch_id"
              label="Пункт назначения"
              rules={[{ required: true, message: "Введите Пункт назначения" }]}
            >
              <Select {...branchSelectProps} />
            </Form.Item>
          </Flex>
        </Row>
        <Row>
          <Flex gap={10}>
            <Form.Item
              style={{ width: 120 }}
              label="Вес"
              name="weight"
              required={false}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item label="Размеры (Д × Ш × В)" required>
              <Input.Group compact>
                <Form.Item
                  name="length"
                  noStyle
                  rules={[
                    // { required: true, message: "Введите длину" },
                    {
                      validator: (_, value) => {
                        if (!value || Number(value) >= 10) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Минимальная длина — 10см")
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    style={{ width: 100, textAlign: "center" }}
                    placeholder="Длина"
                    onChange={() => {
                      form.validateFields(["width", "height", "length"]);
                    }}
                    type="number"
                  />
                </Form.Item>

                <span style={{ padding: "0 8px" }}>×</span>

                <Form.Item
                  name="width"
                  noStyle
                  rules={[
                    // { required: true, message: "Введите ширину" },
                    {
                      validator: (_, value) => {
                        if (!value || Number(value) >= 10) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Минимальная ширина — 10см")
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    style={{ width: 100, textAlign: "center" }}
                    placeholder="Ширина"
                    onChange={() => {
                      form.validateFields(["length", "height", "width"]);
                    }}
                    type="number"
                  />
                </Form.Item>

                <span style={{ padding: "0 8px" }}>×</span>

                <Form.Item
                  name="height"
                  noStyle
                  rules={[
                    // { required: true, message: "Введите высоту" },
                    {
                      validator: (_, value) => {
                        if (!value || Number(value) >= 10) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Минимальная высота — 10см")
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    style={{ width: 100, textAlign: "center" }}
                    placeholder="Высота"
                    onChange={() => {
                      form.validateFields(["length", "width", "height"]);
                    }}
                    type="number"
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
            <Form.Item style={{ width: 120 }} label="Куб" name="cube">
              <Input disabled />
            </Form.Item>
            <Form.Item style={{ width: 120 }} label="Плотность" name="density">
              <Input disabled />
            </Form.Item>
            <Form.Item
              style={{ width: 150 }}
              label="Вес коробки"
              name="box_weight"
            >
              <Input min={0} type="number" />
            </Form.Item>
            <Form.Item
              style={{ width: 20, visibility: "hidden" }}
              label=" "
              initialValue={true}
              name="reshipment"
            >
              <Input disabled min={0} type="number" />
            </Form.Item>
          </Flex>
        </Row>
      </Form>
    </Create>
  );
};

export default ResendCreate;
