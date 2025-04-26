import { useShow, useResource } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { useEffect } from "react";
import { CargoReceivedReport } from "./cargo-received";
import { CashBookReport } from "./cash-book";
import { CargoTypesReport } from "./cargo-types";
import { IncomeReport } from "./income";
import { ExpenseReport } from "./expense";
import { EmployeesReport } from "./employees";
import { BranchesReport } from "./branches";

export const ReportShow = () => {
  const { id } = useResource();

  // Выбор компонента отчета в зависимости от id
  const renderReport = () => {
    switch (id) {
      case "cargo-received":
        return <CargoReceivedReport />;
      case "cash-book":
        return <CashBookReport />;
      case "cargo-types":
        return <CargoTypesReport />;
      case "income":
        return <IncomeReport />;
      case "expense":
        return <ExpenseReport />;
      case "employees":
        return <EmployeesReport />;
      case "branches":
        return <BranchesReport />;
      default:
        return <div>Отчет не найден</div>;
    }
  };

  return (
    <Show title="Отчет">
      {renderReport()}
    </Show>
  );
};