import React, { useState, useEffect, FC } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { CrudFilters, LogicalFilter } from "@refinedev/core";
import debounce from "lodash/debounce";

type FilterOperator =
  | "eq"
  | "ne"
  | "lt"
  | "gt"
  | "lte"
  | "gte"
  | "in"
  | "nin"
  | "contains"
  | "ncontains"
  | "containss" 
  | "ncontainss"
  | "between"
  | "nbetween"
  | "null"
  | "nnull"
  | "startswith"
  | "startswiths"
  | "nstartswith"
  | "nstartswiths"
  | "endswith"
  | "endswiths"
  | "nendswith"
  | "nendswiths";

interface SearchField {
  field: string;
  operator?: FilterOperator;
  placeholder?: string;
}

interface CombinedSearchField {
  fields: string[];
  separator?: string;
  operator?: FilterOperator;
}

interface SearchFilterProps {
  setFilters: (filters: CrudFilters, filterBehavior?: any) => void;
  searchFields: (SearchField | string)[];
  combinedFields?: CombinedSearchField[];
  placeholder?: string;
  debounceMs?: number;
  filterMode?: any;
  prefix?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  allowEmpty?: boolean;
  emptyValue?: string;
  useOrLogic?: boolean;
}

export const SearchFilter: FC<SearchFilterProps> = ({
  setFilters,
  searchFields,
  combinedFields = [],
  placeholder = "Search...",
  debounceMs = 20,
  filterMode = "replace",
  prefix = <SearchOutlined />,
  style,
  className,
  allowEmpty = false,
  emptyValue = "",
  useOrLogic = false,
}) => {
  const [searchValue, setSearchValue] = useState<string>("");

  const formattedSearchFields = React.useMemo(() => {
    return searchFields.map((field) => {
      if (typeof field === "string") {
        return { field, operator: "containss" as FilterOperator };
      }
      return { ...field, operator: field.operator || "containss" };
    });
  }, [searchFields]);

  const applyFilters = React.useCallback((value: string) => {
    
    if (!value && !allowEmpty) {
      setFilters([], filterMode);
      return;
    }

    const searchInput = value || emptyValue;
    const filters: any[] = [];
    const regularFieldFilters: any[] = [];
    
    let hasAppliedCombinedFilter = false;

    if (combinedFields && combinedFields.length > 0) {
      for (const { fields, separator = "-", operator = "containss" } of combinedFields) {
        if (searchInput.includes(separator)) {
          
          const parts = searchInput.split(separator);
          
          if (parts.length >= 2 && fields.length >= 2) {
            const prefix = parts[0].trim();
            const code = parts[1].trim();
            
            
            if (prefix && code) {
              filters.push({
                field: fields[0],
                operator,
                value: prefix
              });
              
              filters.push({
                field: fields[1],
                operator,
                value: code
              });
              
              hasAppliedCombinedFilter = true;
            }
          }
        }
      }
    }

    if (!hasAppliedCombinedFilter) {
      formattedSearchFields.forEach(({ field, operator }) => {
        regularFieldFilters.push({
          field,
          operator,
          value: searchInput,
        });
      });
      
      
      if (regularFieldFilters.length > 0) {
        if (useOrLogic && regularFieldFilters.length > 1) {
          filters.push({
            operator: "or",
            value: regularFieldFilters
          });
        } else {
          filters.push(...regularFieldFilters);
        }
      }
    }

    
    try {
      setFilters(filters, filterMode);
    } catch (error) {
    }
  }, [setFilters, formattedSearchFields, combinedFields, filterMode, allowEmpty, emptyValue, useOrLogic]);

  const debouncedApplyFilters = React.useMemo(
    () => debounce(applyFilters, debounceMs),
    [applyFilters, debounceMs]
  );

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedApplyFilters(value);
  }, [debouncedApplyFilters]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      debouncedApplyFilters.cancel();
      applyFilters(searchValue);
    }
  }, [applyFilters, debouncedApplyFilters, searchValue]);

  useEffect(() => {
    return () => {
      debouncedApplyFilters.cancel();
    };
  }, [debouncedApplyFilters]);

  return (
    <Input
      placeholder={placeholder}
      prefix={prefix}
      value={searchValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      style={style}
      className={className}
      allowClear
    />
  );
};