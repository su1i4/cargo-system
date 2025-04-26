import { useEffect } from "react";
import { Create, useForm, useSelect } from "@refinedev/antd";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Row,
  Col,
} from "antd";
import { API_URL } from "../../App"; // Импорт для типа (если вы можете получить реальные метаданные TypeORM)
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

export const entityFields = [
  { name: "trackCode", label: "Трек-код", type: "varchar", required: true },

  {
    name: "cargoType",
    label: "Тип груза",
    type: "enum",
    required: true,
    enumValues: [
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
    ],
  },
  {
    name: "packageType",
    label: "Упаковать в",
    type: "enum",
    // required: true,
    enumValues: [
      "коробку с скотчем",
      "коробку, водонепроницаемый мешок и скотч",
      "картонные уголки",
      "деревянную обрешетку",
      "деревянный паллет",
      "мешок и скотч",
      "скотч",
      "мешок",
      "водонепроницаемый мешок и скотч",
    ],
  },

  {
    name: "pricePackageType",
    label: "Цена за упаковку ",
    type: "decimal",
    // required: true,
  },
  { name: "weight", label: "Вес", type: "decimal", required: true },
  { name: "comments", label: "Комментарии", type: "text", required: false },
];

// Интерфейс для значений формы
interface GoodsFormValues {
  trackCode?: string;
  cargoType?: string[];
  packageType?: string[];
  pricePackageType?: number;
  weight?: number;
  comments?: string;
  counterparty_id?: string | number;
  discount_custom?: number;
  created_at?: any;
  photo?: {
    file?: {
      response?: {
        filePath?: string;
      };
    };
  };
}

export const GoodsCreate = () => {
  const { formProps, saveButtonProps, form } = useForm<GoodsFormValues>({
    onMutationSuccess: (data, variables: GoodsFormValues, context) => {
      if (variables.photo) {
        const cleanedPhoto = {
          file: {
            response: {
              filePath: variables.photo.file?.response?.filePath,
            },
          },
        };
        variables.photo = cleanedPhoto;
      }
    },
  });

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.name}, ${record?.clientPrefix}-${record?.clientCode}`;
    },
    onSearch: (value) => {
      const isOnlyDigits = /^\d+$/.test(value);

      if (isOnlyDigits) {
        return [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
        ];
      } else {
        return [
          {
            field: "name",
            operator: "contains",
            value,
          },
        ];
      }
    },
  });

  const currentDateDayjs = dayjs().tz("Asia/Bishkek");

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        created_at: currentDateDayjs,
      });
    }
  }, []);

  const handleFormSubmit = (values: any) => {
    const submitValues: GoodsFormValues = { ...values };

    if (submitValues.created_at) {
      if (typeof submitValues.created_at === "object") {
        if (submitValues.created_at.$d) {
          submitValues.created_at =
            submitValues.created_at.format("YYYY-MM-DDTHH:mm:ss") + ".100Z";
        } else if (submitValues.created_at instanceof Date) {
          submitValues.created_at = submitValues.created_at.toISOString();
        }
      }
    }

    console.log(submitValues.photo);

    if (submitValues.photo) {
      submitValues.photo = {
        file: {
          response: {
            filePath: submitValues.photo?.file?.response?.filePath,
          },
        },
      };
    }

    if (formProps.onFinish) {
      formProps.onFinish(submitValues);
    }
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="horizontal" onFinish={handleFormSubmit}>
        <Row gutter={16}>
          <Form.Item
            label="Дата создание"
            name="created_at"
            style={{ marginBottom: 5 }}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD HH:mm"
              placeholder="Выберите дату"
              onChange={(time) => {
                if (time) {
                  form.setFieldValue("created_at", time);
                }
              }}
              showTime
            />
          </Form.Item>
          {entityFields.map((field, index) => (
            <Col span={8} key={field.name}>
              <Form.Item
                label={field.label}
                name={field.name}
                rules={field.required ? [{ required: true }] : []}
              >
                {field.type === "varchar" || field.type === "text" ? (
                  <Input />
                ) : field.type === "decimal" ? (
                  <InputNumber style={{ width: "100%" }} />
                ) : field.type === "enum" ? (
                  <Select
                    // mode="tags"
                    style={{ width: "100%" }}
                    // @ts-ignore
                    options={field?.enumValues.map((enumValue) => ({
                      label: enumValue,
                      value: enumValue,
                    }))}
                    onChange={(value) => {
                      // Ограничиваем выбор только одним значением
                      if (Array.isArray(value) && value.length > 1) {
                        // Берем только последнее выбранное значение
                        form.setFieldValue(field.name, [
                          value[value.length - 1],
                        ]);
                      }
                    }}
                  />
                ) : field.type === "date" || field.type === "timestamp" ? (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD HH:mm:ss"
                    showTime
                  />
                ) : (
                  <Input />
                )}
              </Form.Item>
            </Col>
          ))}
          <Col span={12}>
            <Form.Item
              label={"Код Клиента"}
              name={["counterparty_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select {...counterpartySelectProps} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={"Скидка"} name={["discount_custom"]}>
              <Input
                type="number"
                min={0}
                max={100}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Поле загрузки фото - на отдельной строке */}
        <Row>
          <Col span={24}>
            <Form.Item label="Фото">
              <Form.Item name="photo" noStyle>
                <Upload.Dragger
                  name="file"
                  action={`${API_URL}/file-upload`}
                  listType="picture"
                  accept=".png,.jpg,.jpeg"
                  onChange={(info) => {
                    if (info.file.status === "done") {
                      form.setFieldsValue({
                        photo: {
                          file: {
                            response: {
                              filePath: info.file.response.filePath,
                            },
                          },
                        },
                      });
                    }
                  }}
                >
                  <p className="ant-upload-text">Загрузите Фото</p>
                </Upload.Dragger>
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
