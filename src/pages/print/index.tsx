import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Card, Space, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { GoodsShow } from '../goods-processing/show';

const { Title } = Typography;

export const PrintPage: React.FC = () => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    pageStyle: `
      @page { 
        size: A4; 
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .ant-card {
          box-shadow: none !important;
          border: none !important;
        }
        .ant-card-head, .print-controls {
          display: none !important;
        }
      }
    `,
    documentTitle: 'Накладная',
    // @ts-ignore
    content: () => componentRef.current,
  });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div className="print-controls" style={{ 
        padding: '20px', 
        background: '#f0f2f5', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <Space direction="vertical" size="small">
          <Title level={4} style={{ margin: 0 }}>Управление печатью</Title>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={() => handlePrint()}
            size="large"
            style={{
              height: '50px',
              padding: '0 40px',
              fontSize: '16px'
            }}
          >
            Распечатать накладную
          </Button>
        </Space>
      </div>

      <Card>
        <div ref={componentRef}>
          <GoodsShow />
        </div>
      </Card>
    </Space>
  );
}; 