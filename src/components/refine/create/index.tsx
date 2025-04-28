import React, { useEffect, useState } from "react";
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
  FormProps,
} from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { RcFile } from "antd/lib/upload";

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bishkek");

// Define field types
export type FieldType =
  | "varchar"
  | "text"
  | "decimal"
  | "enum"
  | "date"
  | "timestamp"
  | "number";

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  enumValues?: string[];
  multiple?: boolean;
  span?: number;
  min?: number;
  max?: number;
  format?: string;
  showTime?: boolean;
}

export interface SelectField {
  name: string;
  label: string;
  type: "select";
  resource?: string; // Теперь необязательный параметр
  required?: boolean;
  span?: number;
  placeholder?: string;
  optionLabel?: string | ((record: any) => string);
  optionValue?: string;
  onSearch?: (value: string) => any[];
  filters?: any[];
  setFilters?: (form: any) => any[];
  filterMode?: "or" | "and";
  showSearch?: boolean;
  options?: Array<{ label: string; value: string | number }>; // Собственные значения
}

export interface NumberField {
  name: string;
  label: string;
  type: "number";
  required?: boolean;
  min?: number;
  max?: number;
  span?: number;
  placeholder?: string;
}

export interface TextField {
  name: string;
  label: string;
  type: "text";
  required?: boolean;
  span?: number;
  placeholder?: string;
}

export type AdditionalField = SelectField | NumberField | TextField;

export interface UploadConfig {
  name: string;
  label?: string;
  accept?: string;
  uploadText?: string;
}

export interface DateFormatConfig {
  format: string;
  showTime: boolean;
}

export interface DynamicFormProps {
  fields: FieldDefinition[];
  resource: string;
  apiUrl?: string;
  additionalFields?: Record<string, AdditionalField>;
  onSuccess?: (data: any, variables: any, context: any) => void;
  initialValues?: Record<string, any>;
  children?: React.ReactNode;
  showDateCreated?: boolean;
  dateFormat?: DateFormatConfig;
  showUpload?: boolean;
  uploadConfig?: UploadConfig;
  layout?: "horizontal" | "vertical" | "inline";
  formProps?: FormProps;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  resource,
  apiUrl,
  additionalFields = {},
  onSuccess,
  initialValues = {},
  children,
  showDateCreated = true,
  dateFormat = {
    format: "YYYY-MM-DD HH:mm",
    showTime: true,
  },
  showUpload = false,
  uploadConfig = {
    name: "photo",
    label: "Фото",
    accept: ".png,.jpg,.jpeg",
  },
  layout = "horizontal",
  formProps = {},
}) => {
  const labelCol = { span: 24 };
  const wrapperCol = { span: 24 };
  const {
    formProps: defaultFormProps,
    saveButtonProps,
    form,
  } = useForm({
    resource,
    onMutationSuccess: (data: any, variables: any, context: any) => {
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    ...(Object.keys(initialValues).length > 0 && { initialValues }),
  });

  const values = Form.useWatch([], form);

  const mergedFormProps = { ...defaultFormProps, ...formProps };

  // Handle selects for any resource fields in additionalFields
  const selectsData: Record<string, ReturnType<typeof useSelect>> = {};

  // Process additionalFields to check for select resources
  Object.keys(additionalFields).forEach((key) => {
    const field = additionalFields[key];
    if (field.type === "select" && field.resource) {
    //   eslint-disable-next-line react-hooks/rules-of-hooks
      selectsData[key] = useSelect({
        resource: field.resource,
        optionLabel:
          typeof field.optionLabel === "string"
            ? (item) => item[field.optionLabel as string] || item["title"]
            : field.optionLabel,
        onSearch: field.onSearch,
        filters: field.setFilters ? field.setFilters(form) : field.filters,
      });
    }
  });

  const currentDateDayjs = dayjs().tz("Asia/Bishkek");

  useEffect(() => {
    if (form) {
      // Set created_at default value
      if (showDateCreated) {
        form.setFieldsValue({
          created_at: currentDateDayjs,
        });
      }

      // Set any additional initial values
      if (Object.keys(initialValues).length > 0) {
        form.setFieldsValue(initialValues);
      }
    }
  }, [form, showDateCreated, currentDateDayjs, initialValues]);

  const handleFormSubmit = (values: Record<string, any>) => {
    const submitValues = { ...values };

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

    // Handle file uploads
    Object.keys(submitValues).forEach((key) => {
      if (
        submitValues[key] &&
        typeof submitValues[key] === "object" &&
        submitValues[key].file &&
        submitValues[key].file.response &&
        submitValues[key].file.response.filePath
      ) {
        submitValues[key] = {
          file: {
            response: {
              filePath: submitValues[key].file.response.filePath,
            },
          },
        };
      }
    });

    if (mergedFormProps.onFinish) {
      mergedFormProps.onFinish(submitValues);
    }
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...mergedFormProps}
        layout={layout}
        onFinish={handleFormSubmit}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        key={values}
      >
        <Row gutter={16}>
          {/* Date Created Field */}
          {showDateCreated && (
            <Col span={8}>
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
                  format={dateFormat.format}
                  placeholder="Выберите дату"
                  onChange={(time) => {
                    if (time) {
                      form.setFieldValue("created_at", time);
                    }
                  }}
                  showTime={dateFormat.showTime}
                />
              </Form.Item>
            </Col>
          )}

          {/* Dynamic Fields */}
          {fields.map((field) => (
            <Col span={field.span || 8} key={field.name}>
              <Form.Item
                label={field.label}
                name={field.name}
                rules={field.required ? [{ required: true }] : []}
              >
                {field.type === "varchar" || field.type === "text" ? (
                  <Input />
                ) : field.type === "decimal" || field.type === "number" ? (
                  <InputNumber
                    style={{ width: "100%" }}
                    min={field.min}
                    max={field.max}
                  />
                ) : field.type === "enum" ? (
                  <Select
                    style={{ width: "100%" }}
                    mode={field.multiple ? "multiple" : undefined}
                    options={field.enumValues?.map((enumValue) => ({
                      label: enumValue,
                      value: enumValue,
                    }))}
                    onChange={(value) => {
                      // Limit to one value if not multiple
                      if (
                        !field.multiple &&
                        Array.isArray(value) &&
                        value.length > 1
                      ) {
                        form.setFieldValue(field.name, [
                          value[value.length - 1],
                        ]);
                      }
                    }}
                  />
                ) : field.type === "date" || field.type === "timestamp" ? (
                  <DatePicker
                    style={{ width: "100%" }}
                    format={field.format || "YYYY-MM-DD HH:mm:ss"}
                    showTime={
                      field.showTime !== undefined ? field.showTime : true
                    }
                  />
                ) : (
                  <Input />
                )}
              </Form.Item>
            </Col>
          ))}

          {/* Additional Fields */}
          {Object.keys(additionalFields).map((key) => {
            const field = additionalFields[key];
            return (
              <Col span={field.span || 8} key={key}>
                <Form.Item
                  label={field.label}
                  name={field.type === "select" ? [field.name] : field.name}
                  rules={field.required ? [{ required: true }] : []}
                >
                  {field.type === "select" ? (
                    field.resource ? (
                      <Select
                        {...(selectsData[key]?.selectProps || {})}
                        placeholder={
                          field.placeholder || `Выберите ${field.label}`
                        }
                        showSearch={field.showSearch}
                      />
                    ) : (
                      <Select
                        placeholder={
                          field.placeholder || `Выберите ${field.label}`
                        }
                        showSearch={field.showSearch}
                        options={field.options}
                      />
                    )
                  ) : field.type === "number" ? (
                    <Input
                      type="number"
                      min={(field as NumberField).min}
                      max={(field as NumberField).max}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <Input placeholder={field.placeholder} />
                  )}
                </Form.Item>
              </Col>
            );
          })}
        </Row>

        {/* File Upload Field */}
        {showUpload && apiUrl && (
          <Row>
            <Col span={24}>
              <Form.Item label={uploadConfig.label || "File"}>
                <Form.Item name={uploadConfig.name} noStyle>
                  <Upload.Dragger
                    name="file"
                    action={`${apiUrl}/file-upload`}
                    listType="picture"
                    accept={uploadConfig.accept || "*"}
                    onChange={(info) => {
                      if (info.file.status === "done") {
                        form.setFieldsValue({
                          [uploadConfig.name]: {
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
                    <p className="ant-upload-text">
                      {uploadConfig.uploadText || "Upload Files"}
                    </p>
                  </Upload.Dragger>
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Additional content */}
        {children}
      </Form>
    </Create>
  );
};
