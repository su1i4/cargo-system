import { useTable, useModalForm } from "@refinedev/antd";
import { useCreate, CrudFilter } from "@refinedev/core";
import {
  Typography,
  Flex,
  Button,
  Modal,
  Form,
  Input,
  Dropdown,
  Menu,
  Checkbox,
} from "antd";
import { useEffect, useState } from "react";
import {
  FilterOutlined,
  SearchOutlined,
  MessageOutlined,
  EditOutlined,
} from "@ant-design/icons";
import YandexMap from "./map";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const TrackList = () => {
  const { tableProps, tableQueryResult, setFilters } = useTable({
    resource: "shipments",
    sorters: {
      permanent: [{ field: "id", order: "desc" }],
    },
    pagination: {
      mode: "off",
    },
    syncWithLocation: false,
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    form: createForm,
    show: showCreateModal,
  } = useModalForm({
    resource: "history",
    action: "create",
    redirect: false,
    onMutationSuccess: () => {
      tableQueryResult.refetch();
    },
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    form: editForm,
    show: showEditModal,
  } = useModalForm({
    resource: "history",
    action: "edit",
    redirect: false,
    onMutationSuccess: () => {
      tableQueryResult.refetch();
    },
  });

  const [searchValue, setSearchValue] = useState<string>("");
  const [filtersState, setFiltersState] = useState<any[]>([
    "В пути",
    "Выгрузили",
  ]);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState<{
    [key: string]: boolean;
  }>({});

  const handleCreateMessage = (shipment: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    setDropdownVisible((prev) => ({
      ...prev,
      [shipment.id]: false,
    }));

    setSelectedShipment(shipment);
    showCreateModal();

    setTimeout(() => {
      createForm.setFieldsValue({
        shipment_id: shipment.id,
      });
    }, 0);
  };

  const handleEditMessage = (
    history: any,
    shipmentId: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    setDropdownVisible((prev) => ({
      ...prev,
      [shipmentId]: false,
    }));

    showEditModal(history.id);

    setTimeout(() => {
      editForm.setFieldsValue({
        message: history.message,
      });
    }, 0);
  };

  const handleDropdownVisibleChange = (
    visible: boolean,
    shipmentId: string
  ) => {
    setDropdownVisible((prev) => ({
      ...prev,
      [shipmentId]: visible,
    }));
  };

  useEffect(() => {
    if (createModalProps.open && selectedShipment) {
      createForm.setFieldsValue({
        shipment_id: selectedShipment.id,
      });
    }
  }, [createModalProps.open, selectedShipment, createForm]);

  useEffect(() => {
    const filterValue: CrudFilter[] =
      filtersState.length > 0
        ? filtersState.map((item: any) => ({
            field: "status",
            operator: "eq",
            value: item,
          }))
        : [
            {
              field: "status",
              operator: "eq",
              value: "Не найдено",
            },
          ];

    setFilters(filterValue, "replace");
  }, [filtersState]);

  return (
    <Flex
      style={{
        width: "100%",
        height: "calc(100vh - 64px)",
        position: "relative",
      }}
    >
      <Modal {...createModalProps} title="Создание истории рейса">
        <Form {...createFormProps} layout="vertical">
          <Form.Item name="shipment_id" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item
            label="Сообщение"
            name="message"
            rules={[{ required: true, message: "Введите сообщение" }]}
          >
            <Input />
          </Form.Item>
          {process.env.NODE_ENV === "development" && (
            <div style={{ marginTop: 10, color: "#666", fontSize: 12 }}>
              Debug - Shipment ID: {selectedShipment?.id}
            </div>
          )}
        </Form>
      </Modal>
      <Modal {...editModalProps} title="Редактирование истории рейса">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Сообщение"
            name="message"
            rules={[{ required: true, message: "Введите сообщение" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <YandexMap
        from={{
          latitude: selectedShipment?.employee?.branch?.latitude || 42.875408,
          longitude: selectedShipment?.employee?.branch?.longitude || 74.685079,
        }}
        to={{
          latitude: selectedShipment?.branch?.latitude || 42.870063,
          longitude: selectedShipment?.branch?.longitude || 74.638062,
        }}
      />
      <Flex
        style={{
          width: "40%",
          height: "100%",
          overflowY: "auto",
          backgroundColor: "#CDCDCD80",
          padding: "20px",
          gap: "10px",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        vertical
      >
        <Typography.Title style={{ lineHeight: "10px" }} level={5}>
          Рейсы
        </Typography.Title>
        <div
          style={{
            position: "relative",
          }}
        >
          <input
            style={{
              width: "100%",
              height: "40px",
              borderRadius: "10px",
              border: "1px solid #CDCDCD",
              outline: "none",
              padding: "0 30px",
            }}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setFilters([
                {
                  field: "truck_number",
                  operator: "contains",
                  value: e.target.value,
                },
              ]);
            }}
          />
          <SearchOutlined
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#B4B3BC",
            }}
            size={24}
          />
          <Dropdown
            trigger={["click"]}
            placement="bottomLeft"
            overlay={
              <Menu>
                <Menu.Item onClick={(e: any) => e.stopPropagation()}>
                  <Flex gap="10px">
                    <Checkbox
                      checked={filtersState.includes("В пути")}
                      onChange={(e) => {
                        e.stopPropagation();
                        setFiltersState(
                          e.target.checked
                            ? [...filtersState, "В пути"]
                            : filtersState.filter((item) => item !== "В пути")
                        );
                      }}
                    />
                    <Typography.Text>В пути</Typography.Text>
                  </Flex>
                </Menu.Item>
                <Menu.Item onClick={(e: any) => e.stopPropagation()}>
                  <Flex gap="10px">
                    <Checkbox
                      checked={filtersState.includes("Выгрузили")}
                      onChange={(e) => {
                        e.stopPropagation();
                        setFiltersState(
                          e.target.checked
                            ? [...filtersState, "Выгрузили"]
                            : filtersState.filter(
                                (item) => item !== "Выгрузили"
                              )
                        );
                      }}
                    />
                    <Typography.Text>Выгрузили</Typography.Text>
                  </Flex>
                </Menu.Item>
              </Menu>
            }
          >
            <FilterOutlined
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#B4B3BC",
              }}
              size={24}
            />
          </Dropdown>
        </div>
        <Flex
          vertical
          gap="10px"
          style={{ overflowY: "auto", maxHeight: "90vh" }}
        >
          {tableProps?.dataSource?.map((item) => (
            <Flex
              key={item.id}
              style={{
                width: "100%",
                height: "300px",
                backgroundColor: "white",
                borderRadius: "10px",
                border:
                  selectedShipment?.id === item.id
                    ? "2px solid #5932EA"
                    : "2px solid #F0F2F5",
                padding: "20px",
                cursor: "pointer",
                gap: "10px",
                position: "relative",
              }}
              vertical
              onClick={() => {
                setSelectedShipment(item);
                setTimeout(() => {
                  createForm.setFieldsValue({
                    shipment_id: item.id,
                  });
                }, 0);
              }}
            >
              <Button
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  color: "white",
                  outline: "none",
                  border: "1px solid #5932EA",
                  backgroundColor: "#5932EA",
                }}
                onClick={(e) => handleCreateMessage(item, e)}
                icon={<MessageOutlined size={24} color="white" />}
              />
              <Flex
                justify="space-between"
                style={{
                  width: "100%",
                  borderBottom: "1px solid #E5E5E5",
                  height: "fit-content",
                }}
              >
                <Flex vertical>
                  <Typography.Text
                    style={{
                      fontSize: "14px",
                      color: "#606877",
                      lineHeight: "18px",
                      fontWeight: "300",
                    }}
                  >
                    Номер рейса
                  </Typography.Text>
                  <Typography.Text
                    style={{
                      fontSize: "16px",
                      color: "#1B1725",
                      lineHeight: "20px",
                    }}
                  >
                    {item.truck_number}
                  </Typography.Text>
                  <Dropdown
                    trigger={["click"]}
                    placement="bottomLeft"
                    open={dropdownVisible[String(item.id)] || false}
                    onOpenChange={(visible) =>
                      handleDropdownVisibleChange(visible, String(item.id))
                    }
                    overlay={
                      <Menu
                        style={{
                          width: "400px",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        {item.history?.length > 0 ? (
                          item.history.map((history: any) => (
                            <Menu.Item
                              key={history.id}
                              style={{ height: "auto", padding: "8px 12px" }}
                            >
                              <Flex
                                justify="space-between"
                                align="flex-start"
                                gap="10px"
                              >
                                <Typography.Text
                                  style={{
                                    flex: 1,
                                    wordBreak: "break-word",
                                    whiteSpace: "normal",
                                  }}
                                >
                                  {history.message}
                                </Typography.Text>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={(e) =>
                                    handleEditMessage(
                                      history,
                                      String(item.id),
                                      e
                                    )
                                  }
                                  style={{
                                    minWidth: "24px",
                                    height: "24px",
                                    padding: "0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                />
                              </Flex>
                              {history.created_at && (
                                <Typography.Text
                                  style={{
                                    fontSize: "10px",
                                    color: "#999",
                                    marginTop: "4px",
                                    display: "block",
                                  }}
                                >
                                  {dayjs
                                    .utc(history.created_at)
                                    .format("DD.MM.YYYY HH:mm")}
                                </Typography.Text>
                              )}
                            </Menu.Item>
                          ))
                        ) : (
                          <Menu.Item disabled>
                            <Typography.Text type="secondary">
                              История сообщений отсутствует
                            </Typography.Text>
                          </Menu.Item>
                        )}
                      </Menu>
                    }
                  >
                    <Typography.Text
                      style={{
                        color: "#5932EA",
                        fontSize: "12px",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100px",
                        width: "100px",
                        overflow: "hidden",
                        cursor: "pointer",
                        borderBottom: "1px dashed #5932EA",
                      }}
                    >
                      {item.history && item.history.length > 0
                        ? item.history[item.history.length - 1]?.message ||
                          "Нет сообщений"
                        : "Нет сообщений"}
                    </Typography.Text>
                  </Dropdown>
                </Flex>
                <img
                  src="/truck.svg"
                  alt="image"
                  style={{
                    width: "155px",
                    height: "70px",
                  }}
                />
              </Flex>
              <Flex
                style={{
                  width: "100%",
                  borderBottom: "1px solid #E5E5E5",
                  height: "fit-content",
                  paddingBottom: "10px",
                }}
                vertical
                gap="10px"
              >
                <Flex gap="10px">
                  <img src="/punct-from.svg" alt="image" />
                  <Flex vertical>
                    <Typography.Text>
                      {item.employee?.branch?.name}
                    </Typography.Text>
                    <Typography.Text>
                      {item.employee?.branch?.address}
                    </Typography.Text>
                  </Flex>
                </Flex>
                <Flex gap="10px">
                  <img src="/punct-to.svg" alt="image" />
                  <Flex vertical>
                    <Typography.Text>{item.branch?.name}</Typography.Text>
                    <Typography.Text>{item.branch?.address}</Typography.Text>
                  </Flex>
                </Flex>
              </Flex>
              <Flex vertical gap="0px">
                <Typography.Text>Водитель:</Typography.Text>
                <Typography.Text>{item.driver}</Typography.Text>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
};
