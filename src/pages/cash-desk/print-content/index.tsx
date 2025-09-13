import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const PrintContent = ({
  data,
  selectedCurrency,
  convertAmount,
  client,
  showBagDetails = false,
}: {
  data: any;
  selectedCurrency: string;
  convertAmount: (
    amount: number,
    currency: string,
    createdAt: string
  ) => number;
  client: any;
  showBagDetails?: boolean;
}) => {
  const records = data?.data?.data || [];
  
  if (!records.length) {
    return (
      <div style={{ width: "100%", padding: "20px", textAlign: "center" }}>
        <h3>Нет данных для отображения</h3>
      </div>
    );
  }

  const dates = records.map((item: any) => new Date(item.created_at)).filter((date: Date) => !isNaN(date.getTime()));

  let earliest: Date;
  let latest: Date;

  if (dates.length > 0) {
    earliest = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
    latest = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
  } else {
    earliest = new Date();
    latest = new Date();
  }

  const thStyle = {
    border: "1px solid #000",
    padding: "4px",
    backgroundColor: "#f0f0f0",
    textAlign: "left" as const,
    fontSize: "12px",
    fontWeight: "bold",
  };

  const tdStyle = {
    border: "1px solid #000",
    padding: "4px",
    fontSize: "12px",
  };

  // Calculate totals
  const totalAmount = records.reduce((sum: number, record: any) => {
    const amount = Number(record.totalServiceAmountSum || 0) + Number(record.totalProductAmountSum || 0);
    return sum + convertAmount(amount, selectedCurrency, record.created_at);
  }, 0);

  const totalPaidAmount = records.reduce((sum: number, record: any) => {
    const paidAmount = Number(record.paid_sum || 0);
    return sum + convertAmount(paidAmount, selectedCurrency, record.created_at);
  }, 0);

  const totalWeight = records.reduce((sum: number, record: any) => {
    return sum + Number(record.totalServiceWeight || 0);
  }, 0);

  const totalItems = records.reduce((sum: number, record: any) => {
    return sum + (record.services?.length || 0);
  }, 0);

  const currencySymbol = selectedCurrency === "Доллар" ? "USD" : selectedCurrency === "Рубль" ? "руб" : "сом";

  return (
    <div style={{ width: "100%", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
          marginBottom: 20,
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
          <h3 style={{ fontWeight: 600, margin: 0 }}>Сводная выписка по товарам для прихода</h3>
        </div>
        <p style={{ fontSize: 12, margin: 0 }}>
          <strong>Клиент:</strong> {client?.name || client?.label || 'Не указан'}
        </p>
        <p style={{ fontSize: 12, margin: 0 }}>
          <strong>Код клиента:</strong> {
            client?.clientPrefix && client?.clientCode 
              ? `${client.clientPrefix}-${client.clientCode}` 
              : client?.value
              ? `${client.value}`
              : 'Не указан'
          }
        </p>
        <p style={{ fontSize: 12, margin: 0 }}>
          <strong>Валюта отчета:</strong> {selectedCurrency}
        </p>
        <p style={{ fontSize: 12, margin: 0 }}>
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
            <th style={thStyle}>№</th>
            <th style={thStyle}>Дата приемки</th>
            <th style={thStyle}>№ накладной</th>
            <th style={thStyle}>Пункт приема</th>
            <th style={thStyle}>Код отправителя</th>
            <th style={thStyle}>ФИО отправителя</th>
            <th style={thStyle}>Код получателя</th>
            <th style={thStyle}>ФИО получателя</th>
            <th style={thStyle}>Пункт назначения</th>
            <th style={thStyle}>Вес</th>
            <th style={thStyle}>Кол-во мешков</th>
            {showBagDetails && <th style={thStyle}>Детали мешков</th>}
            <th style={thStyle}>Сумма</th>
            <th style={thStyle}>Оплачено</th>
            <th style={thStyle}>К доплате</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record: any, index: number) => {
            const totalAmount =
              Number(record.totalServiceAmountSum || 0) +
              Number(record.totalProductAmountSum || 0);
            const paidAmount = Number(record.paid_sum || 0);
            
            const convertedTotalAmount = convertAmount(totalAmount, selectedCurrency, record.created_at);
            const convertedPaidAmount = convertAmount(paidAmount, selectedCurrency, record.created_at);
            const remainingAmount = convertedTotalAmount - convertedPaidAmount;

            return (
              <tr key={record.id || index}>
                <td style={tdStyle}>
                  {index + 1}
                </td>
                <td style={tdStyle}>
                  {record.created_at
                    ? dayjs(record.created_at).utc().format("DD.MM.YYYY HH:mm")
                    : "-"}
                </td>
                <td style={tdStyle}>{record.invoice_number || "-"}</td>
                <td style={tdStyle}>
                  {record.employee?.branch?.name ? 
                    `${record.employee.branch.name}${record.employee?.under_branch?.address ? `, ${record.employee.under_branch.address}` : ''}` 
                    : "-"}
                </td>
                <td style={tdStyle}>
                  {record.sender?.clientPrefix && record.sender?.clientCode 
                    ? `${record.sender.clientPrefix}-${record.sender.clientCode}`
                    : "-"}
                </td>
                <td style={tdStyle}>{record.sender?.name || "-"}</td>
                <td style={tdStyle}>
                  {record.recipient?.clientPrefix && record.recipient?.clientCode
                    ? `${record.recipient.clientPrefix}-${record.recipient.clientCode}`
                    : "-"}
                </td>
                <td style={tdStyle}>{record.recipient?.name || "-"}</td>
                <td style={tdStyle}>{record.destination?.name || "-"}</td>
                <td style={tdStyle}>
                  {record.totalServiceWeight ? `${record.totalServiceWeight.toFixed(2)} кг` : "0.00 кг"}
                </td>
                <td style={tdStyle}>{record.services?.length || 0} шт</td>
                {showBagDetails && (
                  <td style={tdStyle}>
                    {record.services && record.services.length > 0 ? (
                      <div style={{ fontSize: "10px", lineHeight: "1.1" }}>
                        {record.services.map((service: any, index: number) => (
                          <div key={index} style={{ marginBottom: "1px" }}>
                            <strong>М{index + 1}:</strong> {service.weight}кг
                            {service.comment && (
                              <div style={{ color: "#666", fontSize: "9px" }}>
                                {service.comment}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                <td style={tdStyle}>
                  {convertedTotalAmount.toFixed(2)} {currencySymbol}
                </td>
                <td style={tdStyle}>
                  {convertedPaidAmount.toFixed(2)} {currencySymbol}
                </td>
                <td style={tdStyle}>
                  <strong>{remainingAmount.toFixed(2)} {currencySymbol}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: "#f8f8f8" }}>
            <td style={{ ...tdStyle, fontWeight: "bold" }} colSpan={9}>ИТОГО:</td>
            <td style={{ ...tdStyle, fontWeight: "bold" }}>{totalWeight.toFixed(2)} кг</td>
            <td style={{ ...tdStyle, fontWeight: "bold" }}>{totalItems} шт</td>
            {showBagDetails && <td style={{ ...tdStyle, fontWeight: "bold" }}>-</td>}
            <td style={{ ...tdStyle, fontWeight: "bold" }}>{totalAmount.toFixed(2)} {currencySymbol}</td>
            <td style={{ ...tdStyle, fontWeight: "bold" }}>{totalPaidAmount.toFixed(2)} {currencySymbol}</td>
            <td style={{ ...tdStyle, fontWeight: "bold", color: "#d32f2f" }}>
              {(totalAmount - totalPaidAmount).toFixed(2)} {currencySymbol}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};