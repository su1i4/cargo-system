import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const PrintContent = ({
  data,
  pageSize,
  selectedCurrency,
  convertAmount,
  client,
}: {
  data: any;
  pageSize: number;
  selectedCurrency: string;
  convertAmount: (
    amount: number,
    currency: string,
    createdAt: string
  ) => number;
  client: any;
}) => {
  const dates = data?.data?.data?.map((item: any) => new Date(item.created_at));

  const earliest = new Date(Math.min(...dates));
  const latest = new Date(Math.max(...dates));

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <img src="/rosscargo.png" alt="logo" style={{ width: "150px" }} />
          <h3 style={{ fontWeight: 600 }}>Сводная выписка по задолженности</h3>
        </div>
        <p style={{ fontSize: 12 }}>
          <strong>Клиент:</strong> {client?.label || client}
        </p>
        <p style={{ fontSize: 12 }}>
          <strong>Период:</strong> {dayjs(earliest).utc().format("DD.MM.YYYY")}{" "}
          - {dayjs(latest).utc().format("DD.MM.YYYY")}
        </p>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr>
            <th>№</th>
            <th>Дата приемки</th>
            <th>№ накладной</th>
            <th>Пункт приема</th>
            <th>Код отправителя</th>
            <th>ФИО отправителя</th>
            <th>Код получателя</th>
            <th>ФИО получателя</th>
            <th>Пункт назначения</th>
            <th>Вес</th>
            <th>Кол-во мешков</th>
            <th>Сумма</th>
            <th>Оплачено</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.data?.map((record: any, index: number) => {
            const totalAmount =
              Number(record.totalServiceAmountSum) +
              Number(record.totalProductAmountSum);
            const paidAmount = record.paid_sum || 0;
            const currencySymbol =
              selectedCurrency === "Доллар"
                ? "USD"
                : selectedCurrency === "Рубль"
                ? "руб"
                : "сом";

            return (
              <tr key={record.id}>
                <td style={tdStyle}>
                  {(data?.data?.page - 1) * pageSize + index + 1}
                </td>
                <td style={tdStyle}>
                  {record.created_at
                    ? dayjs(record.created_at).utc().format("DD.MM.YYYY HH:mm")
                    : ""}
                </td>
                <td style={tdStyle}>{record.invoice_number}</td>
                <td style={tdStyle}>
                  {record.employee?.branch?.name},{" "}
                  {record.employee?.under_branch?.address || ""}
                </td>
                <td style={tdStyle}>
                  {record.sender?.clientPrefix}-{record.sender?.clientCode}
                </td>
                <td style={tdStyle}>{record.sender?.name}</td>
                <td style={tdStyle}>
                  {record.recipient?.clientPrefix}-
                  {record.recipient?.clientCode}
                </td>
                <td style={tdStyle}>{record.recipient?.name}</td>
                <td style={tdStyle}>{record.destination?.name}</td>
                <td style={tdStyle}>
                  {record.totalServiceWeight?.toFixed(2)} кг
                </td>
                <td style={tdStyle}>{record.services?.length} шт</td>
                <td style={tdStyle}>
                  {convertAmount(
                    totalAmount,
                    selectedCurrency,
                    record.created_at
                  ).toFixed(2)}{" "}
                  {currencySymbol}
                </td>
                <td style={tdStyle}>
                  {convertAmount(
                    paidAmount,
                    selectedCurrency,
                    record.created_at
                  ).toFixed(2)}{" "}
                  {currencySymbol}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  border: "1px solid #000",
  padding: "4px",
  backgroundColor: "#f0f0f0",
  textAlign: "left",
};

const tdStyle = {
  border: "1px solid #000",
  padding: "4px",
};
