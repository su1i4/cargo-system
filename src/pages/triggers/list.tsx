import { List, useTable } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Button, message, Table } from "antd";
import { CopyOutlined } from "@ant-design/icons";

export const TriggersList = () => {
  const { tableProps } = useTable({
    resource: "answer-ready",
  });

  const { show } = useNavigation();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => message.success("Текст скопирован в буфер обмена!"),
      () => message.error("Не удалось скопировать текст")
    );
  };

  return (
    <List>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            show("answer-ready", record.id as number);
          },
        })}
        {...tableProps}
      >
        <Table.Column dataIndex="name" title="Название" />
        <Table.Column dataIndex="description" title="Описание" />
        <Table.Column
          dataIndex="description"
          title="Копировать"
          render={(value) => (
            <Button
              icon={<CopyOutlined onClick={() => handleCopy(value)} />}
            ></Button>
          )}
        />
      </Table>
    </List>
  );
};
