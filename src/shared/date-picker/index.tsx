import { Button, DatePicker, Dropdown } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import { FC } from "react";
import { CrudFilters } from "@refinedev/core";
import { CalendarOutlined } from "@ant-design/icons";

type DateRangeFilterProps = {
  onFilterChange: (filters: CrudFilters, mode?: "replace" | "append") => void;
  width?: string | number;
  placeholder?: [string, string];
  fieldName?: string;
};

export const DateRangeFilter: FC<DateRangeFilterProps> = ({
  onFilterChange,
  width = 350,
  placeholder = ["Начальная дата", "Конечная дата"],
  fieldName = "created_at",
}) => {
  const handleChange: RangePickerProps["onChange"] = (dates, dateStrings) => {
    if (dates && dateStrings[0] && dateStrings[1]) {
      const filters: CrudFilters = [
        {
          field: fieldName,
          operator: "gte",
          value: dateStrings[0],
        },
        {
          field: fieldName,
          operator: "lte",
          value: dateStrings[1],
        },
      ];

      onFilterChange(filters, "replace");
    } else {
      onFilterChange([], "replace");
    }
  };

  return (
    <Dropdown
      dropdownRender={() => (
        <DatePicker.RangePicker
          style={{ width }}
          placeholder={placeholder}
          showTime={{ format: "HH:mm" }}
          format="YYYY-MM-DD HH:mm"
          onChange={handleChange}
        />
      )}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Button icon={<CalendarOutlined />} className="date-picker-button">
        Дата
      </Button>
    </Dropdown>
  );
};
