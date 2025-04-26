import React, { useState } from "react";
import { List } from "@refinedev/antd";
import { 
  Card, 
  Table, 
  DatePicker, 
  Button, 
  Row, 
  Col, 
  Select, 
  Form, 
  Typography,
  Space,
  Statistic
} from "antd";
import { useCustom } from "@refinedev/core";
import { 
  SearchOutlined, 
  FileExcelOutlined, 
  PrinterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_URL } from "../../../App";

const { RangePicker } = DatePicker;
const { Title } = Typography;

export const CashBookReport = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });

  // Получение списка филиалов
  const { data: branchesData } = useCustom<any>({
    url: `${API_URL}/branch`,
    method: "get",
  });

  const branches = branchesData?.data?.data || [];

  const fetchReport = () => {
    if (!dateRange) return;

    setLoading(true);
    
    const [startDate, endDate] = dateRange;
    
    const params = {
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
      ...(branch && { branchId: branch }),
    };

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_URL}/reports/cash-book?${new URLSearchParams(params as any).toString()}`
        );
        const result = await response.json();
        setData(result?.data || []);
        
        // Расчет итогов
        const totalIncome = result?.data?.reduce((sum: number, item: any) => 
          item.type === 'income' ? sum + item.amount : sum, 0) || 0;
        
        const totalExpense = result?.data?.reduce((sum: number, item: any) => 
          item.type === 'expense' ? sum + item.amount : sum, 0) || 0;
        
        setSummary({
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense
        });
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  const columns = [
    {
      title: "Дата",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD.MM.YYYY"),
    },
    {
      title: "Филиал",
      dataIndex: "branch",
      key: "branch",
    },
    {
      title: "Тип операции",
      dataIndex: "type",
      key: "type",
      render: (type: string) => type === 'income' ? 'Приход' : 'Расход',
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Сумма",
      dataIndex: "amount",
      key: "amount",
      sorter: (a: any, b: any) => a.amount - b.amount,
      render: (amount: number, record: any) => (
        <span style={{ color: record.type === 'income' ? 'green' : 'red' }}>
          {record.type === 'income' ? '+' : '-'} {amount.toFixed(2)} сом
        </span>
      ),
    },
    {
      title: "Сотрудник",
      dataIndex: "employee",
      key: "employee",
    },
  ];

  const exportToExcel = () => {
    // Логика экспорта в Excel
  };

  const printReport = () => {
    // Логика печати отчета
    window.print();
  };

  return (
    <List title="Кассовая книга">
      <Card>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item label="Период">
                <RangePicker
                  style={{ width: "100%" }}
                  onChange={(dates) => {
                    setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item label="Филиал">
                <Select
                  style={{ width: "100%" }}
                  placeholder="Выберите филиал"
                  allowClear
                  onChange={(value) => setBranch(value)}
                >
                  {branches.map((branch: any) => (
                    <Select.Option key={branch.id} value={branch.id}>
                      {branch.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} style={{ display: "flex", alignItems: "flex-end" }}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={fetchReport}
                disabled={!dateRange}
              >
                Сформировать отчет
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {data.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="Общий приход"
                value={summary.totalIncome}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<ArrowUpOutlined />}
                suffix="сом"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Общий расход"
                value={summary.totalExpense}
                precision={2}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ArrowDownOutlined />}
                suffix="сом"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Баланс"
                value={summary.balance}
                precision={2}
                valueStyle={{ color: summary.balance >= 0 ? '#3f8600' : '#cf1322' }}
                suffix="сом"
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <Title level={4}>Операции</Title>
          <Space>
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={exportToExcel}
              disabled={data.length === 0}
            >
              Экспорт в Excel
            </Button>
            <Button 
              icon={<PrinterOutlined />} 
              onClick={printReport}
              disabled={data.length === 0}
            >
              Печать
            </Button>
          </Space>
        </div>
        <Table 
          dataSource={data} 
          columns={columns} 
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong>Итого</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{summary.balance.toFixed(2)} сом</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </List>
  );
}; 