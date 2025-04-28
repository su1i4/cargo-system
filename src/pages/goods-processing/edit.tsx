import React, { useState, useEffect } from "react";
import {
  Create,
  getValueFromEvent,
  useForm,
  Edit,
  useSelect,
  useTable,
} from "@refinedev/antd";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Row,
  Col,
  Flex,
  message,
} from "antd";
import { CalendarOutlined, InboxOutlined } from "@ant-design/icons";
import { EntityMetadata } from "typeorm";
import { API_URL } from "../../App";
import dayjs from "dayjs";
// import { entityFields } from "./create";

export const GoodsEdit = () => {
  const { formProps, saveButtonProps, queryResult, form } = useForm();
  const [fileList, setFileList] = useState<any>([]);

  const record = queryResult?.data?.data;

  // Handle initializing the file list when the record is loaded
  useEffect(() => {
    if (record?.photo) {
      // If the photo is a string URL
      if (typeof record.photo === "string") {
        setFileList([
          {
            uid: "-1",
            name: "Current Photo",
            status: "done",
            url: record.photo.startsWith("http")
              ? record.photo
              : `${API_URL}/${record.photo}`,
          },
        ]);
      }
      // If photo is already an array of file objects
      else if (Array.isArray(record.photo)) {
        setFileList(record.photo);
      }
    }
  }, [record]);

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.name}, ${record?.clientPrefix}-${record?.clientCode}`;
    },
    onSearch: (value) => {
      // Check if the search value contains only digits
      const isOnlyDigits = /^\d+$/.test(value);

      if (isOnlyDigits) {
        // If only digits, search by clientCode
        return [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
        ];
      } else {
        // If contains any non-digit characters, search by name
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

  // Custom upload change handler
  const handleUploadChange = (info: any) => {
    // Ensure we're working with an array
    const newFileList = Array.isArray(info.fileList) ? info.fileList : [];
    setFileList(newFileList);

    // Show success message when upload is complete
    if (info.file.status === "done") {
      message.success(`${info.file.name} успешно загружен`);
    } else if (info.file.status === "error") {
      message.error(`Ошибка загрузки ${info.file.name}`);
    }
  };

  // Custom normalization function for the form
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList || [];
  };


  return (
    <Edit headerButtons={() => false} saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="horizontal"
        onFinish={(values: any) => {
          // Handle the photo field specially
          if (
            values.photo &&
            Array.isArray(values.photo) &&
            values.photo.length > 0
          ) {
            // If file is already uploaded, extract the response
            if (values.photo[0].response) {
              // Check if response is an object with filePath property
              if (values.photo[0].response.filePath) {
                values.photo = values.photo[0].response.filePath;
              } else if (values.photo[0].response.url) {
                values.photo = values.photo[0].response.url;
              } else {
                values.photo = values.photo[0].response;
              }
            }
            // If file is existing and hasn't changed
            else if (values.photo[0].url) {
              values.photo = values.photo[0].url;
            }
          } else if (!Array.isArray(values.photo)) {
            // If photo is not an array, preserve the original value
            values.photo = record?.photo || null;
          }

          // Call the original onFinish
          formProps.onFinish && formProps.onFinish(values);
        }}
      >
        <Row gutter={16}>
          {/* {entityFields.map((field, index) => (
            <Col span={6} key={field.name}>
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
                    mode="tags"
                    options={field?.enumValues?.map((enumValue) => ({
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
          ))} */}
          <Col span={8}>
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
              <Form.Item
                name="photo"
                valuePropName="fileList"
                getValueProps={(value) => ({
                  fileList: Array.isArray(value) ? value : fileList,
                })}
                getValueFromEvent={normFile}
                noStyle
              >
                <Upload.Dragger
                  name="file"
                  action={`${API_URL}/file-upload`}
                  listType="picture"
                  accept=".png,.jpg,.jpeg"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  maxCount={1}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Загрузите Фото</p>
                  <p className="ant-upload-hint">
                    Поддерживаются форматы: .png, .jpg, .jpeg
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
