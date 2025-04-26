import {
  Show,
  TextField,
  DateField,
  EditButton,
  DeleteButton,
} from "@refinedev/antd";
import { useNavigation, useParsed, useShow } from "@refinedev/core";
import { Typography, Row, Col, Button } from "antd";
import { MyEditModal } from "./modal/edit-modal";
import { useState } from "react";
import { MyCreateModal } from "./modal/create-modal";
import { DiscountModal } from "./modal/fuck-modal";

const { Title } = Typography;

export const CounterpartyShow: React.FC = () => {
  const { id } = useParsed();
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  const record = data?.data;

  const totalWeight = record?.goods.reduce(
    (acc: number, curr: any) => acc + Number(curr.weight),
    0
  );
  const totalAmount = record?.goods.reduce(
    (acc: number, curr: any) => acc + Number(curr.amount),
    0
  );

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { push } = useNavigation();

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          <Button
            onClick={() => {
              if (record?.discount?.id) {
                push(`/discount/edit/${record?.discount?.id}`);
              } else {
                setEditId(Number(record?.id));
                setOpenEdit(true);
              }
            }}
          >
            {record?.discount?.id ? "Изменить скидку" : "Добавить скидку"}
          </Button>
          {editButtonProps && <EditButton {...editButtonProps} />}
          {deleteButtonProps && <DeleteButton {...deleteButtonProps} />}
        </>
      )}
      isLoading={isLoading}
    >
      <DiscountModal
        id={editId || 0}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
      />
      <Row gutter={[16, 16]}>
        {/* Левая колонка */}
        <Col xs={24} sm={12}>
          <Title level={5}>ID</Title>
          <TextField value={record?.id} />

          <Title level={5}>Код клиента</Title>
          <TextField
            value={`${record?.clientPrefix}-${String(
              record?.clientCode
            ).padStart(4, "0")}`}
          />

          <Title level={5}>ФИО</Title>
          <TextField value={record?.name} />

          <Title level={5}>Пвз</Title>
          <TextField
            value={`${record?.branch?.name}-${
              record?.under_branch?.address|| ""
            }`}
          />

          <Title level={5}>Номер телефона</Title>
          <TextField value={record?.phoneNumber} />

          <Title level={5}>Email</Title>
          <TextField value={record?.email || "-"} />
        </Col>

        {/* Правая колонка */}
        <Col xs={24} sm={12}>
          <Title level={5}>Тариф клиента</Title>
          <TextField
            value={`${
              Number(record?.branch?.tarif) -
              Number(record?.discount?.discount || 0)
            }$`}
          />

          <Title level={5}>Скидка</Title>
          <TextField value={record?.discount?.discount || "0$"} />

          <Title level={5}>Общий вес (кг)</Title>
          <TextField value={`${totalWeight} кг`} />

          <Title level={5}>Общая сумма (USD)</Title>
          <TextField value={`${totalAmount} $`} />

          <Title level={5}>Комментарий</Title>
          <TextField value={record?.comment || "-"} />

          {record?.createdAt && (
            <>
              <Title level={5}>Дата создания</Title>
              <DateField value={record?.createdAt} />
            </>
          )}
        </Col>
      </Row>
    </Show>
  );
};
