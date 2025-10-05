import { List, useTable } from "@refinedev/antd";
import {
  Table,
  Button,
  Row,
  Col,
  message,
  Checkbox,
  Modal,
  Dropdown,
  Card,
  Select,
} from "antd";
import {
  FileOutlined,
  FileExcelOutlined,
  PlusOutlined,
  MinusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDocumentTitle } from "@refinedev/react-router";
import { useSelect } from "@refinedev/antd";
import { API_URL } from "../../../App";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import * as XLSX from "xlsx";

export interface Shipment {
  id: number;
  truck_number: string;
  driver: string;
  destination: string;
}

dayjs.extend(utc);
dayjs.extend(timezone);

export const WarehouseStockGoodsReport = () => {
  const setTitle = useDocumentTitle();

  const { tableProps: tableShipmentProps } = useTable({
    resource: "shipments",
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
    syncWithLocation: false,
    pagination: {
      pageSize: 100,
    },
  });

  const [data, setData] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [shipmentData, setShipmentData] = useState<Shipment | null>(null);
  const [showBags, setShowBags] = useState(false);
  const [showTagan, setShowTagan] = useState(false);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [sortField, setSortField] = useState<
    "id" | "created_at" | "sender.name" | "recipient.name" | "bag_number"
  >("recipient.name");
  const [sorterVisible, setSorterVisible] = useState(false);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    optionValue: "id",
  });

  useEffect(() => {
    setTitle("Все товары");
  }, []);

  const [downloadLoading, setDownloadLoading] = useState(false);

  const getShipmentData = async () => {
    let url = `${API_URL}/report/reportGoodInFlight?shipment_id=${shipmentData?.id}`;

    const response = await fetch(url);
    const data = await response.json();
    return data;
  };

  useEffect(() => {
    if (shipmentData) {
      getShipmentData().then((data) => {
        setData(data);
      });
    }
  }, [shipmentData]);

  const prepareExportData = () => {
    const dataSource = selectedCity
      ? sortedData.filter((item: any) => item.destination?.id === selectedCity)
      : sortedData;

    const exportData: any[] = [];
    let totalSum = 0;
    let totalBagSum = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let totalBagsCount = 0;
    let totalWeight = 0;

    // Убираем заголовки из exportData, они будут добавлены через headerInfo
    dataSource.forEach((record: any, index: number) => {
      const taganSum =
        record.products
          ?.filter(
            (item: any) =>
              item.name.includes("Таганский рынок") ||
              item.name === "Таганский рынок"
          )
          ?.reduce((acc: number, item: any) => acc + item.quantity * 400, 0) ||
        0;

      const mainRow: any = {
        "№": String(index + 1),
        "Фио отправителя": record.sender?.name || "",
        "Фио получателя": record.recipient?.name || "",
        Город: record.destination?.name || "",
        Досыл: record.sent_back?.name || "",
        "Номер получателя": record.recipient?.phoneNumber || "",
        "Номера мешков":
          record.services
            ?.map((item: any) => item.bag_number_numeric)
            .join(", ") || "",
        "Вес, кг": record.weight
          ? String(Number(record.weight).toFixed(2))
          : "",
        "Кол-во мешков": String(record.services?.length || 0),
        Сумма: String(Number(record.amount || 0)
          .toFixed(2)),
        "Сумма за мешки": String(Number(
          record.avgProductPrice - (showTagan ? taganSum : 0) || 0
        )
          .toFixed(2)),
        Оплачено: String(Number(record.paid_sum || 0)
          .toFixed(2)),
      };

      if (!showTagan) {
        mainRow["Долг"] = String(
          (Number(record.amount || 0) - Number(record.paid_sum || 0)).toFixed(2)
        );
      }

      if (showTagan) {
        mainRow["Сумма за Таганский рынок"] = String(Number(taganSum).toFixed(2));

        mainRow["Долг с Таганским рынком"] = String(
          (Number(record.amount || 0) - Number(record.paid_sum || 0)).toFixed(2)
        );
        mainRow["Долг без Таганского рынка"] = String(
          (Number(record.amount || 0) -
          (Number(record.paid_sum || 0) + Number(taganSum || 0))).toFixed(2)
        );
      }

      totalSum += Number(record.amount || 0);
      totalBagSum +=
        record.products?.reduce(
          (acc: number, item: any) => acc + Number(item.sum),
          0
        ) || 0;
      totalPaid += Number(record.paid_sum || 0);
      totalDebt += Number(record.amount || 0) - Number(record.paid_sum || 0);
      totalBagsCount += record.services?.length || 0;
      totalWeight += Number(record.weight || 0);

      exportData.push(mainRow);

      if (showBags && record.services && record.services.length > 0) {
        record.services.forEach((service: any) => {
          const serviceRow = {
            "№": "",
            "Фио отправителя": "",
            "Фио получателя": "",
            Город: "",
            Досыл: "",
            "Номер получателя": "",
            "Номера мешков": service.bag_number_numeric || "",
            "Вес, кг": service.weight
              ? String(Number(service.weight).toFixed(2))
              : "",
            "Кол-во мешков": "1",
            Сумма: String(Number(service.sum || 0)
              .toFixed(2)),
            "Сумма за мешки": "0",
            Оплачено: String(Number(service.paid_sum || 0)
              .toFixed(2)),
            Долг: String(
              (Number(service.sum || 0) - Number(service.paid_sum || 0)).toFixed(2)
            )
          };

          totalSum += service.sum || 0;
          totalBagsCount += 1;

          exportData.push(serviceRow);
        });
      }
    });

    const totalRow = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      Досыл: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": String(Number(totalWeight).toFixed(2)),
      "Кол-во мешков": String(totalBagsCount),
      Сумма: String(Number(totalSum).toFixed(2)),
      "Сумма за мешки": String(Number(totalBagSum).toFixed(2)),
      Оплачено: String(Number(totalPaid).toFixed(2)),
      Долг: String(Number(totalDebt).toFixed(2)),
    };

    const totalRow2 = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      Досыл: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": "",
      "Кол-во мешков": "",
      Сумма: "",
      "Сумма за мешки": "",
      Оплачено: "",
      Долг: "",
    };

    const totalRow3 = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      Досыл: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": "",
      "Кол-во мешков": "",
      Сумма: "",
      "Сумма за мешки": "",
      Оплачено: "",
      Долг: "",
      Статус: "",
    };

    const totalRow4 = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      Досыл: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": "",
      "Кол-во мешков": "",
      Сумма: "",
      "Сумма за мешки": "",
      Оплачено: "",
      Долг: "",
    };

    exportData.push(totalRow, totalRow2, totalRow3, totalRow4);

    return exportData;
  };

  const downloadXLSX = async () => {
    try {
      setDownloadLoading(true);
      const exportData = prepareExportData();

      if (!exportData || exportData.length === 0) {
        message.warning("Нет данных для экспорта");
        return;
      }

      const shipmentRecordForHeader = tableShipmentProps.dataSource?.find((item: any) => {
        return item.id === shipmentData?.id;
      });
      
      const headerTruckNumber = shipmentRecordForHeader?.truck_number || "";
      const headerDriver = driverName || "";
      const shipmentDateForHeader = shipmentRecordForHeader?.created_at 
        ? dayjs(shipmentRecordForHeader.created_at).utc().format("DD.MM.YYYY")
        : dayjs().format("DD.MM.YYYY");

      // Создаем шапку с информацией в downloadXLSX
      const headerInfo = [
        {
          [Object.keys(exportData[0] || {})[0] || 'info']: `РЕЙС: ${headerTruckNumber} | ВОДИТЕЛЬ: ${headerDriver} | ДАТА: ${shipmentDateForHeader}`,
          ...Object.fromEntries(
            Object.keys(exportData[0] || {}).slice(1).map(key => [key, ''])
          )
        }
      ];

      const dataWithHeader = [...headerInfo, ...exportData];
      const worksheet = XLSX.utils.json_to_sheet(dataWithHeader);

      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

      const colWidths: any[] = [];
      const headers = Object.keys(exportData[0] || {});

      headers.forEach((header, colIndex) => {
        let maxLength = header.length;
        exportData.forEach((row) => {
          const cellValue = String(row[header] || "");
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });
        colWidths.push({ wch: Math.min(Math.max(maxLength + 2, 10), 50) });
      });

      worksheet["!cols"] = colWidths;

      try {
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
            if (!worksheet[cellAddress]) continue;

            if (typeof worksheet[cellAddress].v === "number") {
              worksheet[cellAddress].z = "#,##0.00";
            }
          }
        }
      } catch (styleError) {}

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет");

      const shipmentRecordForFile = tableShipmentProps.dataSource?.find((item: any) => {
        return item.id === shipmentData?.id;
      });
      
      const truckNumber = shipmentRecordForFile?.truck_number || "report";
      const shipmentDate = shipmentRecordForFile?.created_at 
        ? dayjs(shipmentRecordForFile.created_at).utc().format("DD.MM.YYYY.HH-mm")
        : dayjs().format("DD.MM.YYYY.HH-mm");

      const fileName = `${
        shipmentData?.destination
      } #${truckNumber} ${driverName} от (${shipmentDate}).xlsx`;

      XLSX.writeFile(workbook, fileName);

      message.success("Файл XLSX успешно скачан");
    } catch (error) {
      console.error("Ошибка при скачивании XLSX файла:", error);
      message.error("Ошибка при скачивании XLSX файла");
    } finally {
      setDownloadLoading(false);
    }
  };

  const downloadXLSX2 = async () => {
    try {
      setDownloadLoading(true);
      const exportData = prepareExportData();

      if (!exportData || exportData.length === 0) {
        message.warning("Нет данных для экспорта");
        return;
      }

      // Получаем данные об отправке для генерации имени файла и заголовков
      const shipmentRecord = tableShipmentProps.dataSource?.find(
        (item) => item.id === shipmentData?.id
      );

      // ===== 1. Создаем новую рабочую книгу =====
      const workbook = XLSX.utils.book_new();

      // ===== 2. Определяем заголовки в зависимости от showTagan =====
      const baseHeaders = [
        "Отправитель",
        "",
        "Получатель",
        "",
        "Досыл",
        "№ Сумки",
        "Наименование",
        "Кол-во",
        "Вес сумки",
        "К оплате",
        "Сумма",
      ];

      const taganHeaders = showTagan
        ? ["Сумма за Таганский рынок", "Сумма за мешки"]
        : [];
      const mainHeaders = [...baseHeaders, ...taganHeaders];

      // ===== 3. Шапка документа =====
      const headerTruckNumber = shipmentRecord?.truck_number || "";
      const headerDriver = driverName || "";
      const shipmentDateForHeader = shipmentRecord?.created_at 
        ? dayjs(shipmentRecord.created_at).utc().format("DD.MM.YYYY")
        : dayjs().format("DD.MM.YYYY");

      const headerData = [
        [
          `РЕЙС: ${headerTruckNumber}`,
          `ВОДИТЕЛЬ: ${headerDriver}`,
          `ДАТА: ${shipmentDateForHeader}`,
          "РОССкарго",
          "",
          "",
        ]
      ];

      // ===== 4. Подготовка данных для таблицы =====
      const tableData = [];

      // Инициализация итогов
      let totalWeight = 0;
      let totalBagsCount = 0;
      let totalToPaySum = 0;
      let totalSum = 0;
      let totalTaganSum = 0;
      let total200Sum = 0;

      const dataSource = selectedCity
        ? sortedData.filter(
            (item: any) => item.destination?.id === selectedCity
          )
        : sortedData;

      // Убираем mainHeaders и подзаголовки из headerData, они будут в tableData
      dataSource.forEach((record: any) => {
        const senderName = record.sender?.name || "";
        const senderPhone = record.sender?.phoneNumber || "";
        const recipientName = record.recipient?.name || "";
        const recipientPhone = record.recipient?.phoneNumber || "";

        // Группируем услуги по отправлению
        const services = record.services || [];

        // Расчет Таганского рынка для этого отправления
        const taganSum =
          record.products
            ?.filter(
              (item: any) =>
                item.name.includes("Таганский рынок") ||
                item.name === "Таганский рынок"
            )
            ?.reduce(
              (acc: number, item: any) => acc + item.quantity * 400,
              0
            ) || 0;

        // Общая сумма услуг для этого отправления
        const totalServicesSum = services.reduce(
          (acc: number, item: any) => acc + Number(item.sum || 0),
          0
        );

        // К оплате = общая сумма отправления
        const debtAmount = record.services?.reduce(
          (acc: number, item: any) => acc + Number(item.sum || 0),
          0
        );

        // Основная сумма отправления
        const mainAmount = Number(record.amount || 0);

        if (services.length === 0) {
          // Если нет услуг, добавляем одну строку с основной информацией
          const weight = Number(record.weight || 0);

          const row = [
            senderName,
            senderPhone,
            recipientName,
            recipientPhone,
            record.sent_back?.name || "",
            "",
            "",
            "",
            weight > 0 ? weight.toFixed(2).replace(".", ",") : "",
            debtAmount > 0 ? String(debtAmount.toFixed(0)) : "",
            mainAmount > 0 ? String(mainAmount.toFixed(0)) : "",
          ];

          if (showTagan) {
            row.push(record?.avgProductPrice ? String(record.avgProductPrice) : "");
          }

          tableData.push(row);

          // Обновляем итоги
          totalWeight += weight;
          totalBagsCount += 1; // Считаем как один мешок если нет услуг
          totalToPaySum += debtAmount;
          totalSum += mainAmount;
          totalTaganSum += taganSum;
        } else {
          // Для каждой услуги создаем строку
          services.forEach((service: any, serviceIndex: number) => {
            const bagNumber = service.bag_number_numeric || "";
            const description = service.nomenclature?.name || "";
            const quantity = Number(service.quantity || 0);
            const weight = Number(service.weight || 0);
            const serviceSum = Number(service.sum || 0);

            // Отправитель и получатель только в первой строке группы
            const isFirstService = serviceIndex === 0;

            const row = [
              isFirstService ? senderName : "",
              isFirstService ? senderPhone : "",
              isFirstService ? recipientName : "",
              isFirstService ? recipientPhone : "",
              isFirstService ? (record.sent_back?.name || "") : "",
              bagNumber,
              description,
              quantity > 0 ? String(quantity) : "",
              weight > 0 ? weight.toFixed(2).replace(".", ",") : "",
              isFirstService && debtAmount > 0 ? String(debtAmount.toFixed(0)) : "", // К оплате только в первой строке
              serviceSum > 0 ? String(serviceSum.toFixed(0)) : "", // Сумма услуги
            ];

            if (showTagan) {
              row.push(
                isFirstService && record?.avgProductPrice > 0 ? String(record?.avgProductPrice.toFixed(0)) : "" // Таганский только в первой строке
              );
            }

            tableData.push(row);

            // Обновляем итоги для каждой услуги
            totalWeight += weight;
            totalBagsCount += quantity;
            totalSum += serviceSum;

            // К оплате и Таганский считаем только один раз для отправления
            if (isFirstService) {
              totalToPaySum += debtAmount;
              totalTaganSum += taganSum;
            }
          });
        }
      });

      // Добавляем итоговую строку
      const totalRow = [
        "ИТОГО:",
        "",
        "",
        "",
        "",
        "",
        "",
        String(totalBagsCount), // Итого количество
        totalWeight > 0 ? totalWeight.toFixed(2).replace(".", ",") : "0", // Итого вес
        totalToPaySum > 0 ? String(totalToPaySum.toFixed(0)) : "0", // Итого к оплате
        totalSum > 0 ? String(totalSum.toFixed(0)) : "0", // Итого сумма
      ];

      if (showTagan) {
        totalRow.push(
          totalTaganSum > 0 ? String(totalTaganSum.toFixed(0)) : "0", // Итого 400 руб
          total200Sum > 0 ? String(total200Sum.toFixed(0)) : "0" // Итого 200 руб
        );
      }

      tableData.push(totalRow);

      // ===== 5. Объединяем все данные =====
      const allData = [...headerData, ...tableData];

      // ===== 6. Создаем лист =====
      const worksheet = XLSX.utils.aoa_to_sheet(allData);

      // ===== 7. Настройка ширины колонок =====
      const colWidths = [
        { wch: 15 }, // Ф.И.О отправителя
        { wch: 12 }, // Номер тел. отправителя
        { wch: 15 }, // Ф.И.О получателя
        { wch: 12 }, // Номер тел. получателя
        { wch: 10 }, // Досыл
        { wch: 8 }, // № Сумки
        { wch: 20 }, // Наименование
        { wch: 8 }, // Кол-во
        { wch: 10 }, // Вес сумки
        { wch: 10 }, // К оплате
        { wch: 10 }, // Сумма
      ];

      if (showTagan) {
        colWidths.push(
          { wch: 10 }, // 400 руб
          { wch: 8 } // 200 руб
        );
      }

      worksheet["!cols"] = colWidths;

      // ===== 8. Стилизация =====
      const createCellStyle = (options: any = {}) => ({
        font: {
          name: "Arial",
          sz: options.fontSize || 10,
          bold: options.bold || true,
          color: options.fontColor ? { rgb: options.fontColor } : undefined,
        },
        alignment: {
          horizontal: options.align || "left",
          vertical: "center",
          wrapText: options.wrapText || false,
          indent: options.indent || 0,
        },
        fill: options.bgColor
          ? { fgColor: { rgb: options.bgColor } }
          : undefined,
        border: options.border
          ? {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            }
          : undefined,
      });

      // Стили
      const headerInfoStyle = createCellStyle({
        fontSize: 12,
        bold: true,
        align: "left",
        bgColor: "F5F5F5"
      });

      const companyStyle = createCellStyle({
        fontSize: 12,
        bold: true,
        align: "right",
        bgColor: "F5F5F5"
      });

      const tableHeaderMainStyle = createCellStyle({
        fontSize: 10,
        bold: true,
        align: "center",
        border: true,
        bgColor: "E6E6FA",
      });

      const tableHeaderSubStyle = createCellStyle({
        fontSize: 9,
        bold: true,
        align: "center",
        border: true,
        bgColor: "F0F8FF",
      });

      const tableCellStyle = createCellStyle({
        fontSize: 10,
        bold: false,
        border: true,
        align: "center",
      });

      const tableCellLeftStyle = createCellStyle({
        fontSize: 10,
        bold: false,
        border: true,
        align: "left",
        indent: 1,
      });

      const totalRowStyle = createCellStyle({
        fontSize: 10,
        bold: true,
        border: true,
        align: "center",
        bgColor: "FFE4B5",
      });

      // ===== 9. Применение стилей =====
      const setCellStyle = (address: any, style: any) => {
        if (!worksheet[address]) worksheet[address] = { t: "s", v: "" };
        worksheet[address].s = style;
      };

      // Применяем стили к строке с информацией о рейсе
      for (let col = 0; col < 3; col++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: col });
        setCellStyle(addr, headerInfoStyle);
      }
      setCellStyle(XLSX.utils.encode_cell({ r: 0, c: 3 }), companyStyle);

      // Данные таблицы
      const dataStartRow = 1; // Данные начинаются сразу после информации о рейсе
      const totalRowIndex = allData.length - 1;
      const totalCols = showTagan ? 13 : 11;

      for (let row = dataStartRow; row < allData.length; row++) {
        for (let col = 0; col < totalCols; col++) {
          const addr = XLSX.utils.encode_cell({ r: row, c: col });

          // Стиль для итоговой строки
          if (row === totalRowIndex) {
            setCellStyle(addr, totalRowStyle);
          } else {
            // Левое выравнивание для ФИО, досыла и наименований
            if (col === 0 || col === 2 || col === 4 || col === 6) {
              setCellStyle(addr, tableCellLeftStyle);
            } else {
              setCellStyle(addr, tableCellStyle);
            }
          }
        }
      }

      // ===== 11. Установка высоты строк =====
      worksheet["!rows"] = [
        { hpt: 25 }, // Строка с информацией о рейсе
      ];

      // Добавляем высоту для строк данных
      for (let i = dataStartRow; i < allData.length; i++) {
        worksheet["!rows"][i] = { hpt: i === totalRowIndex ? 18 : 15 };
      }

      // ===== 12. Генерация имени файла =====
      const truckNumber = shipmentRecord?.truck_number || "report";
      const shipmentDate = shipmentRecord?.created_at 
        ? dayjs(shipmentRecord.created_at).utc().format("DD.MM.YYYY.HH-mm")
        : dayjs().format("DD.MM.YYYY.HH-mm");

      const fileName = `${
        shipmentData?.destination || "Export"
      } #${truckNumber} ${driverName || ""} от (${shipmentDate}).xlsx`;

      // ===== 13. Сохранение файла =====
      XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет");
      XLSX.writeFile(workbook, fileName);

      message.success("Файл XLSX успешно скачан");
    } catch (error) {
      console.error("Ошибка при скачивании XLSX файла:", error);
      message.error("Ошибка при скачивании XLSX файла");
    } finally {
      setDownloadLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const exportData = prepareExportData();

      if (!exportData || exportData.length === 0) {
        message.warning("Нет данных для экспорта");
        return;
      }

      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header];
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      const shipmentRecordForCSV = tableShipmentProps.dataSource?.find((item: any) => {
        return item.id === shipmentData?.id;
      });
      
      const truckNumber = shipmentRecordForCSV?.truck_number || "report";
      const shipmentDate = shipmentRecordForCSV?.created_at 
        ? dayjs(shipmentRecordForCSV.created_at).utc().format("DD.MM.YYYY.HH-mm")
        : dayjs().format("DD.MM.YYYY.HH-mm");

      link.setAttribute(
        "download",
        `${
          shipmentData?.destination
        } #${truckNumber} ${driverName} от (${shipmentDate}).csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Файл CSV успешно скачан");
    } catch (error) {
      console.error("Ошибка при скачивании CSV файла:", error);
      message.error("Ошибка при скачивании CSV файла");
    }
  };

  const sortData = (data: any, sortField: any, sortDirection: any) => {
    if (!data || data.length === 0) return data;

    return [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "created_at":
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case "sender.name":
          aValue = a.sender?.name || "";
          bValue = b.sender?.name || "";
          break;
        case "recipient.name":
          aValue = a.recipient?.name || "";
          bValue = b.recipient?.name || "";
          break;
        case "bag_number":
          aValue =
            a.services
              ?.map((item: any) => item.bag_number_numeric)
              .join(", ") || "";
          bValue =
            b.services
              ?.map((item: any) => item.bag_number_numeric)
              .join(", ") || "";
          break;
        case "id":
        default:
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue, "ru", {
          numeric: true,
        });
        return sortDirection === "ASC" ? comparison : -comparison;
      }

      if (aValue < bValue) {
        return sortDirection === "ASC" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "ASC" ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedData = useMemo(() => {
    return sortData(data, sortField, sortDirection);
  }, [data, sortField, sortDirection]);

  const filteredData = useMemo(() => {
    return selectedCity
      ? sortedData.filter((item: any) => item.destination?.id === selectedCity)
      : sortedData;
  }, [sortedData, selectedCity]);

  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortDirection("ASC");
    }
    setSorterVisible(false);
  };

  const sortContent = (
    <Card style={{ width: 200, padding: "0px !important" }}>
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

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "created_at" ? "bold" : "normal",
          }}
          onClick={() => handleSort("created_at")}
        >
          Дате создания{" "}
          {sortField === "created_at" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "sender.name" ? "bold" : "normal",
          }}
          onClick={() => handleSort("sender.name")}
        >
          По фио отправителя{" "}
          {sortField === "sender.name" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "recipient.name" ? "bold" : "normal",
          }}
          onClick={() => handleSort("recipient.name")}
        >
          По фио получателя{" "}
          {sortField === "recipient.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "bag_number" ? "bold" : "normal",
          }}
          onClick={() => handleSort("bag_number")}
        >
          По номеру мешка{" "}
          {sortField === "bag_number" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const chooseExport = () => {
    if (showBags) {
      return downloadXLSX2();
    }
    return downloadXLSX();
  };

  const expandedRowColumns = useMemo(() => [
    {
      title: "№",
      key: "index",
      render: (_: any, __: any, index: number) => index + 1,
      width: 50,
    },
    {
      title: "Номер мешка",
      dataIndex: "bag_number_numeric",
      key: "bag_number_numeric",
      width: 120,
    },
    {
      title: "Вес, кг",
      dataIndex: "weight",
      key: "weight",
      render: (value: any) =>
        value
          ? String(value).replace(".", ",").slice(0, 5)
          : "",
      width: 100,
    },
    {
      title: "Сумма",
      dataIndex: "sum",
      key: "sum",
      width: 100,
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      render: (value: any) => value || "-",
    },
  ], []);

  const renderExpandedRow = useCallback((record: any) => {
    if (!record.services || record.services.length === 0) {
      return (
        <div 
          key={`no-services-${record.id}`}
          style={{ padding: "10px", color: "#666" }}
        >
          Нет информации о мешках
        </div>
      );
    }

    return (
      <div key={`expanded-${record.id}`}>
        <Table
          columns={expandedRowColumns}
          dataSource={record.services || []}
          pagination={false}
          rowKey={(item: any, index?: number) =>
            `service-${record.id}-${item.bag_number_numeric || item.id || index || 0}`
          }
          size="small"
          style={{ margin: "10px 0" }}
        />
      </div>
    );
  }, [expandedRowColumns]);

  const renderExpandIcon = useCallback(({ expanded, onExpand, record }: any) => (
    <Button
      key={`expand-btn-${record.id}`}
      type="text"
      size="small"
      icon={expanded ? <MinusOutlined /> : <PlusOutlined />}
      onClick={(e) => {
        e.stopPropagation();
        onExpand(record, e);
      }}
    />
  ), []);

  return (
    <List
      title="Отчет по задолженности представительств по рейсам"
      headerButtons={() => false}
    >
      <Modal
        title="Отчет по задолженности представительств по рейсам"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCity(null);
        }}
        footer={null}
        width={1800}
      >
        <Row
          gutter={[16, 16]}
          align="middle"
          style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}
        >
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
          <Col>
            <Select
              placeholder="Выберите город"
              allowClear
              style={{ width: 200 }}
              value={selectedCity}
              onChange={(value) => setSelectedCity(value as number)}
              onClear={() => setSelectedCity(null)}
              options={branchSelectProps.options}
              loading={branchSelectProps.loading}
            />
          </Col>
          <Col>
            <Checkbox
              checked={showBags}
              onChange={(e) => setShowBags(e.target.checked)}
              style={{ marginRight: 8 }}
            >
              Показать мешки
            </Checkbox>
          </Col>
          <Col>
            <Checkbox
              checked={showTagan}
              onChange={(e) => setShowTagan(e.target.checked)}
              style={{ marginRight: 8 }}
            >
              Таганский рынок
            </Checkbox>
          </Col>
          <Col>
            <Button
              icon={<FileExcelOutlined />}
              type="primary"
              ghost
              style={{
                backgroundColor: "white",
                borderColor: "#28a745",
                color: "#28a745",
              }}
              loading={downloadLoading}
              onClick={chooseExport}
            >
              XLSX
            </Button>
          </Col>
          <Col>
            <Button
              icon={<FileOutlined />}
              type="primary"
              ghost
              style={{
                backgroundColor: "white",
                borderColor: "#17a2b8",
                color: "#17a2b8",
              }}
              onClick={downloadCSV}
            >
              CSV
            </Button>
          </Col>
        </Row>
        <Table
          key={`main-table-${showBags ? 'with-bags' : 'no-bags'}-${selectedCity || 'all'}`}
          size="small"
          dataSource={filteredData}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1000 }}
          expandable={
            showBags
              ? {
                  expandedRowRender: renderExpandedRow,
                  expandIcon: renderExpandIcon,
                  expandRowByClick: false,
                  defaultExpandAllRows: false,
                }
              : undefined
          }
        >
          <Table.Column
            title="№"
            width={50}
            render={(value, record, index) => index + 1}
          />
          <Table.Column
            dataIndex="sender"
            title="Фио отправителя"
            render={(value) => value?.name}
          />
          <Table.Column
            dataIndex="recipient"
            title="Фио получателя"
            render={(value) => value?.name}
          />
          <Table.Column
            dataIndex="recipient"
            title="Номер получателя"
            render={(value) => value?.phoneNumber}
          />
          <Table.Column
            dataIndex="destination"
            render={(value) => value?.name}
            title="Город"
          />
          <Table.Column
            dataIndex="sent_back"
            render={(value) => value?.name || ""}
            title="Досыл"
          />
          <Table.Column
            dataIndex="services"
            title="Номера мешков"
            render={(value) =>
              value?.map((item: any) => item.bag_number_numeric).join(", ") ||
              ""
            }
            width={200}
          />
          <Table.Column
            dataIndex="weight"
            title="Вес, кг"
            render={(value) => String(value).replace(".", ",").slice(0, 5)}
          />
          <Table.Column
            dataIndex="services"
            title="Кол-во мешков"
            render={(value) => value?.length}
          />
          <Table.Column
            dataIndex="amount"
            title="Сумма"
            render={(value) => {
              return Number(value).toFixed(2);
            }}
          />
          <Table.Column
            dataIndex="avgProductPrice"
            title="Сумма за мешки"
            render={(value, record) => {
              const taganSum =
                record.products
                  ?.filter(
                    (item: any) =>
                      item.name.includes("Таганский рынок") ||
                      item.name === "Таганский рынок"
                  )
                  ?.reduce(
                    (acc: number, item: any) => acc + item.quantity * 400,
                    0
                  ) || 0;

              return Number(value - (showTagan ? taganSum : 0)).toFixed(2);
            }}
          />
          {showTagan && (
            <Table.Column
              dataIndex="avgProductPrice"
              title="Сумма за Таганский рынок"
              render={(value, record) => {
                const taganSum =
                  record.products
                    ?.filter(
                      (item: any) =>
                        item.name.includes("Таганский рынок") ||
                        item.name === "Таганский рынок"
                    )
                    ?.reduce(
                      (acc: number, item: any) => acc + item.quantity * 400,
                      0
                    ) || 0;
                return taganSum.toFixed(2).toString().replace(".", ",");
              }}
            />
          )}
          <Table.Column dataIndex="paid_sum" title="Оплачено" render={(value) => Number(value).toFixed(2)} />

          <Table.Column
            dataIndex="id"
            title={showTagan ? "Долг с Таганским рынком" : "Долг"}
            render={(_, record) => {
              return Number(
                Number(record?.amount || 0) - Number(record?.paid_sum || 0)
              ).toFixed(2);
            }}
          />

          {showTagan && (
            <Table.Column
              dataIndex="id"
              title="Долг без Таганского рынка"
              render={(_, record) => {
                const taganSum =
                  record.products
                    ?.filter(
                      (item: any) =>
                        item.name.includes("Таганский рынок") ||
                        item.name === "Таганский рынок"
                    )
                    ?.reduce(
                      (acc: number, item: any) => acc + item.quantity * 400,
                      0
                    ) || 0;

                return (
                  Number(record?.amount) -
                  Number(Number(record?.paid_sum) + taganSum)
                )
                  .toFixed(2)
                  .toString()
                  .replace(".", ",");
              }}
            />
          )}
        </Table>
      </Modal>
      <Table
        onRow={(record) => {
          return {
            onDoubleClick: () => {
              setShipmentData({
                id: record.id as number,
                truck_number: record.truck_number as string,
                driver: record.driver as string,
                destination: record.branch?.name as string,
              });
              setDriverName(record.driver);
              setModalVisible(true);
            },
          };
        }}
        {...tableShipmentProps}
        rowKey="id"
      >
        <Table.Column
          width={10}
          title="№"
          dataIndex="number"
          render={(value, record, index) => index + 1}
        />
        <Table.Column
          title="Дата отправки"
          dataIndex="created_at"
          width={50}
          render={(value) => dayjs(value).utc().format("DD.MM.YYYY HH:mm")}
        />
        <Table.Column width={50} title="Номер рейса" dataIndex="truck_number" />
        <Table.Column
          width={50}
          title="Пункт погрузки"
          dataIndex="employee"
          render={(value) => value?.branch?.name}
        />
        <Table.Column
          width={50}
          title="Количество мест"
          dataIndex="totalService"
        />
        <Table.Column
          width={50}
          title="Вес (кг)"
          dataIndex="totalServiceWeight"
          render={(value) => value?.toFixed(2)}
        />
        <Table.Column
          width={50}
          title="Пункт назначения"
          dataIndex="branch"
          render={(value) => value?.name}
        />
        <Table.Column width={50} title="Водитель" dataIndex="driver" />
        <Table.Column width={50} title="Статус" dataIndex="status" />
        <Table.Column
          width={50}
          title="Сотрудник"
          dataIndex="employee"
          render={(value) => `${value?.firstName} ${value?.lastName}`}
        />
        <Table.Column width={50} title="Статус" dataIndex="status" />
      </Table>
    </List>
  );
};
