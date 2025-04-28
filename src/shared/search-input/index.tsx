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
  useOrLogic?: boolean; // Новое свойство для включения логики OR
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
  useOrLogic = false, // По умолчанию используем AND
}) => {
  const [searchValue, setSearchValue] = useState<string>("");

  // Форматируем поля поиска один раз при инициализации
  const formattedSearchFields = React.useMemo(() => {
    return searchFields.map((field) => {
      if (typeof field === "string") {
        return { field, operator: "containss" as FilterOperator };
      }
      return { ...field, operator: field.operator || "containss" };
    });
  }, [searchFields]);

  // Функция для применения фильтров без debounce
  const applyFilters = React.useCallback((value: string) => {
    console.log("Применяем фильтр:", value);
    
    if (!value && !allowEmpty) {
      console.log("Сбрасываем фильтры");
      setFilters([], filterMode);
      return;
    }

    const searchInput = value || emptyValue;
    const filters: any[] = []; // Основные фильтры
    const regularFieldFilters: any[] = []; // Фильтры для обычных полей
    
    let hasAppliedCombinedFilter = false;

    // Сначала проверяем комбинированные поля с разделителем
    if (combinedFields && combinedFields.length > 0) {
      for (const { fields, separator = "-", operator = "containss" } of combinedFields) {
        if (searchInput.includes(separator)) {
          console.log(`Найден разделитель: "${separator}"`);
          
          const parts = searchInput.split(separator);
          
          if (parts.length >= 2 && fields.length >= 2) {
            const prefix = parts[0].trim();
            const code = parts[1].trim();
            
            console.log(`Префикс: "${prefix}", Код: "${code}"`);
            
            // Только если обе части не пустые, применяем комбинированный фильтр
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
              console.log("Применен комбинированный фильтр");
            }
          }
        }
      }
    }

    // Если комбинированный фильтр не был применен, используем обычные поля
    if (!hasAppliedCombinedFilter) {
      // Добавляем обычные поля поиска
      formattedSearchFields.forEach(({ field, operator }) => {
        console.log(`Добавляем обычный фильтр: поле ${field}, оператор ${operator}`);
        // Сохраняем обычные фильтры в отдельный массив для дальнейшей обработки
        regularFieldFilters.push({
          field,
          operator,
          value: searchInput,
        });
      });
      
    //   // Для кода клиента, если нет разделителя, проверяем является ли ввод больше похожим 
    //   // на префикс или на код
    //   if (combinedFields && combinedFields.length > 0) {
    //     combinedFields.forEach(({ fields }) => {
    //       // Если ввод похож на буквенный код, ищем по префиксу
    //       if (/^[a-zA-Zа-яА-Я]+$/.test(searchInput)) {
    //         console.log(`Ввод "${searchInput}" похож на префикс, ищем по полю ${fields[0]}`);
    //         filters.push({
    //           field: fields[0],
    //           operator: "containss",
    //           value: searchInput,
    //         });
    //       } 
    //       // Если ввод похож на числовой код, ищем по коду
    //       else if (/^\d+$/.test(searchInput)) {
    //         console.log(`Ввод "${searchInput}" похож на код, ищем по полю ${fields[1]}`);
    //         filters.push({
    //           field: fields[1],
    //           operator: "containss",
    //           value: searchInput,
    //         });
    //       }
    //       // Если ввод смешанный, ищем по обоим полям
    //       else {
    //         console.log(`Ввод "${searchInput}" смешанный, ищем по обоим полям`);
    //         fields.forEach(field => {
    //           filters.push({
    //             field,
    //             operator: "containss",
    //             value: searchInput,
    //           });
    //         });
    //       }
    //     });
    //   }
      
      // Добавляем обычные поля поиска в итоговый фильтр с учетом логики OR/AND
      if (regularFieldFilters.length > 0) {
        if (useOrLogic && regularFieldFilters.length > 1) {
          // Если нужна логика OR между обычными полями, создаем объект с оператором OR
          console.log("Применяем логику OR для обычных полей");
          filters.push({
            operator: "or",
            value: regularFieldFilters
          });
        } else {
          // Иначе добавляем все поля как отдельные фильтры (логика AND по умолчанию)
          console.log("Применяем логику AND для обычных полей");
          filters.push(...regularFieldFilters);
        }
      }
    }

    console.log("Итоговые фильтры:", JSON.stringify(filters));
    
    try {
      setFilters(filters, filterMode);
      console.log("Фильтры успешно применены");
    } catch (error) {
      console.error("Ошибка при применении фильтров:", error);
    }
  }, [setFilters, formattedSearchFields, combinedFields, filterMode, allowEmpty, emptyValue, useOrLogic]);

  // Создаем debounced функцию для отложенного вызова
  const debouncedApplyFilters = React.useMemo(
    () => debounce(applyFilters, debounceMs),
    [applyFilters, debounceMs]
  );

  // Обработчик изменения текста
  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Ввод текста:", value);
    setSearchValue(value);
    debouncedApplyFilters(value);
  }, [debouncedApplyFilters]);

  // Обработчик нажатия клавиши Enter
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log("Нажата клавиша Enter, мгновенный поиск:", searchValue);
      // Отменяем debounce и производим мгновенный поиск
      debouncedApplyFilters.cancel();
      applyFilters(searchValue);
    }
  }, [applyFilters, debouncedApplyFilters, searchValue]);

  // Очищаем debounce при размонтировании компонента
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