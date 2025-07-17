import { Create, useForm } from "@refinedev/antd";
import { Form } from "antd";
import Title from "antd/es/typography/Title";
import { GoodsProcessingCreateRequisites } from "./requisites";
import { useState } from "react";
import { GoodsProcessingCreateServices } from "./services";

export const GoodsProcessingCreate = () => {
  const { formProps, saveButtonProps, form } = useForm();

  const [services, setServices] = useState<any[]>([]);

  return (
    <Create>
      <Form {...formProps} layout="vertical">
        <Title level={5}>Реквизиты</Title>
        <GoodsProcessingCreateRequisites />
        <GoodsProcessingCreateServices services={services} setServices={setServices} />
      </Form>
    </Create>
  );
};
