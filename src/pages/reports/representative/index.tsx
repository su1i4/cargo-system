import { List, useSelect } from "@refinedev/antd";
import {
  Space,
  Table,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Card,
  Modal,
  Checkbox,
  Select,
  message,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SettingOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom, useNavigation, useUpdate } from "@refinedev/core";
import dayjs from "dayjs";
import { API_URL } from "../../../App";
import { useSearchParams } from "react-router";
import { operationStatus } from "../../../shared";
import * as XLSX from "xlsx";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateStatus } from "../../../lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export const RepresentativeReport = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([
    { trackCode: { $contL: "" } },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10000);
  const [search, setSearch] = useState("");

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [
          ...searchFilters,
          { operation_id: { $eq: null } },
          { status: { $in: ["Выдали", "Готов к выдаче"] } },
        ],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: currentPage * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const [sorterVisible, setSorterVisible] = useState(false);
  const [settingVisible, setSettingVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fixed: Update filters function that properly formats filters
  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }

    // We'll refetch in useEffect after state updates
  };

  // Fixed: Add effect to trigger refetch when filters or sorting changes
  useEffect(() => {
    if (!searchparams.get("page") && !searchparams.get("size")) {
      searchparams.set("page", String(currentPage));
      searchparams.set("size", String(pageSize));
      setSearchParams(searchparams);
    } else {
      const page = searchparams.get("page");
      const size = searchparams.get("size");
      setCurrentPage(Number(page));
      setPageSize(Number(size));
    }
    refetch();
  }, [searchFilters, sortDirection, currentPage, pageSize]);

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          // Fixed: Use consistent filter format
          setFilters(
            [
              {
                created_at: {
                  $gte: dateStrings[0],
                  $lte: dateStrings[1],
                },
              },
            ],
            "replace"
          );
        }
      }}
    />
  );

  const sortContent = (
    <Card style={{ width: 200, padding: "0px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div
          style={{
            marginBottom: "8px",
            color: "#666",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Сортировать по
        </div>
        {/* Сортировка по дате создания */}
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "counterparty.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("counterparty.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По фио{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Получаем актуальные данные из хука useCustom
  const dataSource = data?.data?.data || [];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedKeys);
    },
  };

  const { mutateAsync: update } = useUpdate();

  const [mainChecked, setMainChecked] = useState(false);

  const clickAll = () => {
    setMainChecked(!mainChecked);
    if (!mainChecked) {
      // Выбираем только те строки, где visible: false
      const allFalseIds = dataSource
        .filter((item: any) => !item.visible)
        .map((item: any) => item.id);
      setSelectedRowKeys(allFalseIds);
    } else {
      // Снимаем все выделения
      setSelectedRowKeys([]);
    }
  };

  const handleCheckboxChange = (record: any) => {
    // Если запись уже visible: true, не позволяем её изменить
    if (record.visible) return;

    const newSelectedKeys = selectedRowKeys.includes(record.id)
      ? selectedRowKeys.filter((id) => id !== record.id)
      : [...selectedRowKeys, record.id];
    setSelectedRowKeys(newSelectedKeys);

    // Обновляем mainChecked в зависимости от состояния всех чекбоксов
    const allFalseItems = dataSource.filter((item: any) => !item.visible);
    const allFalseSelected = allFalseItems.every((item: any) =>
      newSelectedKeys.includes(item.id)
    );
    setMainChecked(allFalseSelected);
  };

  const handleSaveChanges = async () => {
    const filteredItems = dataSource.filter(
      (item: any) => !item.visible && selectedRowKeys.includes(item.id)
    );
    const selectedItems = filteredItems.map((item: any) => ({
      id: item.id,
      // Если запись уже visible: true, оставляем её true
      visible: item.visible ? true : selectedRowKeys.includes(item.id),
    }));

    try {
      await Promise.all(
        selectedItems.map((item: any) =>
          update({
            resource: "goods-processing",
            id: item.id,
            values: { visible: item.visible },
          })
        )
      );
      refetch();
      // Сбрасываем выбранные строки
      setSelectedRowKeys([]);
      setMainChecked(false);
    } catch (error) {
      console.error("Ошибка при обновлении", error);
    }
  };

  const checkboxContent = (
    <Card style={{ padding: 10 }}>
      <Button onClick={handleSaveChanges}>Показать клиенту</Button>
    </Card>
  );

  const { show, push } = useNavigation();

  // Создаем функции для пагинации, которые обычно предоставляет tableProps
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    searchparams.set("page", pagination.current);
    searchparams.set("size", pagination.pageSize);
    setSearchParams(searchparams);
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    // Обрабатываем сортировку, если она пришла из таблицы
    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  useEffect(() => {
    const value = searchparams.get("value");
    if (value) {
      setFilters(
        [
          {
            $or: [
              { trackCode: { $contL: value } },
              { "counterparty.clientCode": { $contL: value } },
              { "counterparty.name": { $contL: value } },
            ],
          },
        ],
        "replace"
      );
    }
    setSearch(value || "");
  }, []);

  // Формируем пропсы для таблицы из данных useCustom
  const tableProps = {
    dataSource: dataSource,
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
  };

  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  // Функция для экспорта данных в Excel
  const exportToExcel = () => {
    if (!dataSource || dataSource.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    // Преобразование данных для экспорта
    const exportData = dataSource.map((item: any) => ({
      "Дата приемки": item.created_at
        ? dayjs(item.created_at).utc().format("DD.MM.YYYY HH:mm")
        : "",
      "Трек-код": item.trackCode,
      "Тип груза": item.cargoType,
      "Код получателя": item.counterparty
        ? `${item.counterparty.clientPrefix}-${item.counterparty.clientCode}`
        : "",
      "ФИО получателя": item.counterparty ? item.counterparty.name : "",
      "Пункт назначения, Пвз": item.counterparty
        ? `${item.counterparty.branch?.name}, ${
            item.counterparty.under_branch?.address || ""
          }`
        : "",
      "Вес": item.weight ? item.weight.replace(".", ",") + " кг" : "",
      "Тариф клиента": item.counterparty
        ? `${(
            Number(item.counterparty.branch?.tarif || 0) -
            Number(item.counterparty?.discount?.discount || 0)
          ).toFixed(2)}`
        : "",
      "Сумма": item.amount ? item.amount.replace(".", ",") + " $" : "",
      "Скидка": `${(
        Number(item.discount) + Number(item.discount_custom || 0)
      ).toFixed(2)}`,
      "Статус": translateStatus(item.status),
      "Сотрудник": item.employee
        ? `${item.employee.firstName}-${item.employee.lastName}`
        : "",
      "Комментарий": item.comments,
    }));

    // Создание Excel файла
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Отчет по представителям"
    );

    // Сохранение файла
    XLSX.writeFile(workbook, "representative_report.xlsx");
  };

  // Функция для экспорта данных в Google Sheets (CSV)
  const exportToGoogleSheets = () => {
    if (!dataSource || dataSource.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    try {
      // Преобразование данных для экспорта (такие же как для Excel)
      const exportData = dataSource.map((item: any) => ({
        "Дата приемки": item.created_at
          ? dayjs(item.created_at).utc().format("DD.MM.YYYY HH:mm")
          : "",
        "Трек-код": item.trackCode,
        "Тип груза": item.cargoType,
        "Код получателя": item.counterparty
          ? `${item.counterparty.clientPrefix}-${item.counterparty.clientCode}`
          : "",
        "ФИО получателя": item.counterparty ? item.counterparty.name : "",
        "Пункт назначения, Пвз": item.counterparty
          ? `${item.counterparty.branch?.name}, ${
              item.counterparty.under_branch?.address || ""
            }`
          : "",
        "Вес": item.weight ? item.weight.replace(".", ",") + " кг" : "",
        "Тариф клиента": item.counterparty
          ? `${(
              Number(item.counterparty.branch?.tarif || 0) -
              Number(item.counterparty?.discount?.discount || 0)
            ).toFixed(2)}`
          : "",
        "Сумма": item.amount ? item.amount.replace(".", ",") + " $" : "",
        "Скидка": `${(
          Number(item.discount) + Number(item.discount_custom || 0)
        ).toFixed(2)}`,
        "Статус": translateStatus(item.status),
        "Сотрудник": item.employee
          ? `${item.employee.firstName}-${item.employee.lastName}`
          : "",
        "Комментарий": item.comments,
      }));

      // Создание CSV для Google Sheets
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Создание Blob и ссылки для скачивания
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Создание элемента для скачивания
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "representative_report.csv");
      document.body.appendChild(link);

      // Имитация клика для скачивания
      link.click();

      // Очистка
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("Файл готов для импорта в Google Sheets");
    } catch (error) {
      console.error("Ошибка при экспорте в Google Sheets:", error);
      message.error("Ошибка при экспорте данных");
    }
  };

  return (
    <List headerButtons={() => (
      <Space>
        <Button
          icon={<FileExcelOutlined />}
          onClick={exportToExcel}
          type="primary"
          ghost
          style={{
            backgroundColor: "white",
            borderColor: "#4285F4",
            color: "#4285F4",
          }}
        >
          XLSX
        </Button>
        <Button
          icon={<FileOutlined />}
          onClick={exportToGoogleSheets}
          type="primary"
          ghost
          style={{
            backgroundColor: "white",
            borderColor: "#4285F4",
            color: "#4285F4",
          }}
        >
          CSV
        </Button>
      </Space>
    )}>
      <Row
        gutter={[16, 16]}
        align="middle"
        style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}
      >
        <Col>
          <Space size="middle">
            <Dropdown
              overlay={sortContent}
              trigger={["click"]}
              placement="bottomLeft"
              open={sorterVisible}
              onOpenChange={(visible) => {
                setSorterVisible(visible);
              }}
            >
              <Button
                icon={
                  sortDirection === "ASC" ? (
                    <ArrowUpOutlined />
                  ) : (
                    <ArrowDownOutlined />
                  )
                }
              ></Button>
            </Dropdown>
          </Space>
        </Col>
        <Col>
          <Select
            {...branchSelectProps}
            placeholder="Выберите филиал"
            style={{ width: 300 }}
            value={selectedBranch || undefined} // Убедитесь, что пустое значение не передается как null
            allowClear // Разрешает очистку
            onChange={(e) => {
              setSelectedBranch(e || null); // Сбрасываем в null при очистке
              if (!e) {
                setFilters(
                  [
                    {
                      status: {
                        $in: ["В Складе", "Готов к выдаче"],
                      },
                    },
                  ],
                  "replace"
                );
                return;
              }
              setFilters(
                [
                  {
                    status: {
                      $in: ["Готов к выдаче"],
                    },
                  },
                  {
                    "counterparty.branch_id": e,
                  },
                ],
                "replace"
              );
            }}
          />
        </Col>
        <Col>
          <Dropdown
            overlay={datePickerContent}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button icon={<CalendarOutlined />} className="date-picker-button">
              Дата
            </Button>
          </Dropdown>
        </Col>
      </Row>

      <Modal
        title="Новая спецификация"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form layout="vertical">
          <Form.Item label="Треккод">
            <Input />
          </Form.Item>
          <Form.Item label="Тип груза">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: "max-content" }}
        onRow={(record) => ({
          onClick: () => {
            push("/not-paid-goods/show/" + record.id);
          },
        })}
      >
        {/* <Table.Column
          dataIndex="visible"
          title={<Checkbox checked={mainChecked} onChange={clickAll} />}
          render={(value, record) => {
            if (value) {
              return <EyeOutlined />;
            } else {
              return (
                <Checkbox 
                  checked={selectedRowKeys.includes(record.id)}
                  onChange={() => handleCheckboxChange(record)}
                />
              );
            }
          }}
        /> */}
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (data?.data?.page - 1) * pageSize + index + 1;
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title="Дата приемки"
          render={(value) =>
            value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
          }
        />
        <Table.Column dataIndex="trackCode" title="Трек-код" />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
          render={(value) => {
            return value?.clientPrefix + "-" + value?.clientCode;
          }}
        />
        <Table.Column
          dataIndex="counterparty"
          title="ФИО получателя"
          render={(value) => value?.name}
        />
        <Table.Column
          dataIndex="counterparty"
          render={(value) => (
            <p
              style={{
                width: "200px",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {`${value?.branch?.name}, ${value?.under_branch?.address || ""}`}
            </p>
          )}
          title="Пункт назначения, Пвз"
        />
        <Table.Column
          dataIndex="weight"
          title="Вес"
          render={(value) => value.replace(".", ",") + " кг"}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Тариф клиента"
          render={(value, record) => {
            return `${(
              Number(value?.branch?.tarif || 0) -
              Number(record?.counterparty?.discount?.discount || 0)
            ).toFixed(2)}`;
          }}
        />

        <Table.Column
          dataIndex="amount"
          title="Сумма"
          render={(value) => value.replace(".", ",") + " $"}
        />
        <Table.Column
          dataIndex="discount"
          title="Скидка"
          render={(value, record) => {
            return `${(Number(value) + Number(record?.discount_custom)).toFixed(
              2
            )}`;
          }}
        />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
        {operationStatus()}
        <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName}-${value?.lastName}`;
          }}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    </List>
  );
};