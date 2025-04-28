import { Card, Button, Dropdown } from "antd";
import { CrudSorting } from "@refinedev/core";
import { FC, useState } from "react";
import { ArrowDownOutlined } from "@ant-design/icons";
import { ArrowUpOutlined } from "@ant-design/icons";

type SortField = {
  label: string;
  field: string;
};

type SortContentProps = {
  sorters: CrudSorting;
  setSorters: (sorters: CrudSorting) => void;
  fields: SortField[];
};

export const SortContent: FC<SortContentProps> = ({
  sorters,
  setSorters,
  fields,
}) => {
  const [sorterVisible, setSorterVisible] = useState(false);
  const currentSorter = sorters?.[0];
  const sortField = currentSorter?.field;
  const sortOrder = currentSorter?.order;

  const handleSort = (field: string) => {
    setSorters([
      {
        field,
        order: sortField === field && sortOrder === "asc" ? "desc" : "asc",
      },
    ]);
  };

  const getArrow = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <Dropdown
      overlay={
        <Card style={{ width: 200, padding: 0 }}>
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

            {fields.map(({ label, field }) => (
              <Button
                key={field}
                type="text"
                style={{
                  textAlign: "left",
                  fontWeight: sortField === field ? "bold" : "normal",
                }}
                onClick={() => handleSort(field)}
              >
                {label} {getArrow(field)}
              </Button>
            ))}
          </div>
        </Card>
      }
      trigger={["click"]}
      placement="bottomLeft"
      open={sorterVisible}
      onOpenChange={(visible) => {
        setSorterVisible(visible);
      }}
    >
      <Button
        icon={sortOrder === "asc" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        title="Сортировка"
      />
    </Dropdown>
  );
};
