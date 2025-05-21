import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import { Layout as AntdLayout, Avatar, Space, theme, Typography } from "antd";
import React, { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
    zIndex: 10,
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 10;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space style={{ marginLeft: "8px" }} size="middle">
        {user?.name && <Text strong>{user.name}</Text>}
      </Space>
    </AntdLayout.Header>
  );
};
