import { Table } from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const catchDateTable = (title: string, status?: string) => {
  return (
    <Table.Column
      dataIndex="created_at"
      title={title}
      render={(value, record) => {
        const local_status = status || record?.status;
        const findedStatus = record?.tracking_status?.find(
          (item: any) => item.status === local_status
        );
        return value
          ? dayjs(findedStatus?.createdAt || value)
              .utc()
              .format("DD.MM.YYYY HH:mm")
          : "";
      }}
    />
  );
};

export const regularData = () => {
  return (
    <Table.Column
      dataIndex="created_at"
      title="Дата приемки"
      render={(value) =>
        value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
      }
    />
  );
};

export const translateStatus = (status: string) =>
  status === "В Складе" ? "На Cкладе" : status;

export const translateTaskStatus = (status: string) => {
  switch (status) {
    case "new":
      return "Новый";
    case "in_progress":
      return "В процессе";
    case "cancelled":
      return "Отменён";
    case "completed":
      return "Завершён";
    default:
      return "-";
  }
};
