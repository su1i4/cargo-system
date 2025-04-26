import React, { useEffect } from "react";
import { useModalForm, useSelect } from "@refinedev/antd";
import {
  DatePicker,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  notification,
} from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  box_weight: string;
  truck_number: string;
  reshipment: boolean;
}

export const CreateReshipment: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const [notificationApi, contextHolder] = notification.useNotification();

  //@ts-ignore
  const { modalProps, formProps, submit, form } = useModalForm<any>({
    resource: "shipments",
    action: "create",
    redirect: false,
    onMutationSuccess: () => {
      notificationApi.success({
        message: "Успешно создано!",
        description: `Переотправка успешно создана`,
        placement: "topRight",
        duration: 4,
      });
      onSuccess();
      handleClose()
    },
    successNotification: false, // Disable default notifications to prevent errors
    errorNotification: false, // Disable default error notifications
  });

  const modifiedFormProps: typeof formProps = {
    ...formProps,
    onFinish: async (values: any) => {
      try {
        // Remove calculated fields
        const { cube, density, ...dataToSubmit } = values;

        // Format date
        if (dataToSubmit.created_at) {
          const offsetMinutes = 360;
          dataToSubmit.created_at = dayjs(dataToSubmit.created_at)
            .add(offsetMinutes, "minute")
            .format("YYYY-MM-DD HH:mm:ss");
        }

        // Ensure reshipment is set to true
        dataToSubmit.reshipment = true;

        return formProps.onFinish?.(dataToSubmit);
      } catch (error) {
        notificationApi.error({
          message: "Ошибка!",
          description: "Произошла ошибка при создании переотправки",
          placement: "topRight",
          duration: 4,
        });
        return Promise.reject(error);
      }
    },
  };

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const types = [
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

  const handleInputChange = (field: string, value: string) => {
    form.setFieldsValue({ [field]: value });
  };

  const currentDateDayjs = dayjs();

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        created_at: currentDateDayjs,
      });
    }
  }, [open]);

  return (
    <>
      {contextHolder}
      <Modal
        title={<h2 style={{ margin: 0 }}>Создать переотправку</h2>}
        onOk={() => {
          try {
            form
              .validateFields()
              .then(() => {
                submit();
              })
              .catch((errorInfo) => {
              });
          } catch (error) {
            console.error("Error submitting form:", error);
          }
        }}
        open={open}
        onCancel={handleClose}
        cancelButtonProps={{ style: { display: "none" } }}
        width={483}
        okText="Добавить"
        style={{ minWidth: "85vw", zIndex: 99999 }}
        // {...modalProps}
      >
        <Form<IShipment>
          {...(modifiedFormProps as any)}
          layout="vertical"
          style={{ marginBottom: 0 }}
          initialValues={{
            weight: "0",
            cube: "0",
            density: "0",
            reshipment: true,
            height: 0,
            width: 0,
            length: 0,
          }}
          form={form}
        >
          <Row style={{ width: "100%" }}>
            <Flex gap={10}>
              <Form.Item
                label="Дата отправки"
                name="created_at"
                style={{ marginBottom: 5 }}
                rules={[{ required: true, message: "Выберите дату отправки" }]}
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
                rules={[{ required: true, message: "Выберите тип" }]}
              >
                <Select
                  options={types.map((enumValue) => ({
                    label: enumValue,
                    value: enumValue,
                  }))}
                  placeholder="Выберите тип"
                />
              </Form.Item>
              <Form.Item
                style={{ width: 250 }}
                label="Код коробки"
                name="boxCode"
              >
                <Input placeholder="Введите код коробки" />
              </Form.Item>
              <Form.Item
                style={{ width: 250 }}
                label="Номер фуры"
                name="truck_number"
              >
                <Input placeholder="Введите номер фуры" />
              </Form.Item>
              <Form.Item
                style={{ width: 250 }}
                name="branch_id"
                label="Пункт назначения"
                rules={[
                  { required: true, message: "Выберите пункт назначения" },
                ]}
              >
                <Select
                  {...branchSelectProps}
                  placeholder="Выберите пункт назначения"
                />
              </Form.Item>
            </Flex>
          </Row>
          <Row>
            <Flex gap={10}>
              <Form.Item style={{ width: 120 }} label="Вес" name="weight">
                <Input
                  type="number"
                  min={0}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="Вес"
                />
              </Form.Item>
              <Form.Item label="Размеры (Д × Ш × В)">
                <Input.Group compact>
                  <Form.Item name="length" noStyle>
                    <Input
                      style={{ width: 100, textAlign: "center" }}
                      placeholder="Длина"
                      onChange={(e) =>
                        handleInputChange("length", e.target.value)
                      }
                      type="number"
                      min={10}
                    />
                  </Form.Item>

                  <span style={{ padding: "0 8px" }}>×</span>

                  <Form.Item name="width" noStyle>
                    <Input
                      style={{ width: 100, textAlign: "center" }}
                      placeholder="Ширина"
                      onChange={(e) =>
                        handleInputChange("width", e.target.value)
                      }
                      type="number"
                      min={10}
                    />
                  </Form.Item>

                  <span style={{ padding: "0 8px" }}>×</span>

                  <Form.Item name="height" noStyle>
                    <Input
                      style={{ width: 100, textAlign: "center" }}
                      placeholder="Высота"
                      onChange={(e) =>
                        handleInputChange("height", e.target.value)
                      }
                      type="number"
                      min={10}
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
              <Form.Item style={{ width: 120 }} label="Куб" name="cube">
                <Input disabled />
              </Form.Item>
              <Form.Item
                style={{ width: 120 }}
                label="Плотность"
                name="density"
              >
                <Input disabled />
              </Form.Item>
              <Form.Item
                style={{ width: 150 }}
                label="Вес коробки"
                name="box_weight"
              >
                <Input min={0} type="number" placeholder="Вес коробки" />
              </Form.Item>
              <Form.Item
                style={{ width: 20, visibility: "hidden" }}
                label=" "
                initialValue={true}
                name="reshipment"
              >
                <Input disabled type="hidden" />
              </Form.Item>
            </Flex>
          </Row>
        </Form>
      </Modal>
    </>
  );
};
