import { Select } from "antd";
import { useSelect } from "@refinedev/antd";

interface BranchSelectProps {
  resource: string;
  setFilters: (filters: any[], mode: "replace" | "merge") => void;
  width: number | string;
  field: any[];
  placeholder: string;
}

export const BranchSelect = ({
  resource,
  setFilters,
  width = "100%",
  field,
  placeholder,
}: BranchSelectProps) => {
  const { selectProps } = useSelect({
    resource,
  });

  return (
    <Select
      {...selectProps}
      placeholder={placeholder}
      style={{ width }}
      allowClear
      onChange={(branchId) => {
        if (!branchId) {
          setFilters([], "replace");
          return;
        }

        setFilters(field, "replace");
      }}
    />
  );
};
