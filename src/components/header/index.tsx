import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Flex,
  Grid,
  Space,
  Switch,
  theme,
  Typography,
} from "antd";
import React, { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

const CountryTime: React.FC = () => {
  const [time, setTime] = useState({
    guangzhou: new Date().toLocaleTimeString("ru-RU", {
      timeZone: "Asia/Shanghai",
    }),
    yekaterinburg: new Date().toLocaleTimeString("ru-RU", {
      timeZone: "Asia/Yekaterinburg",
    }),
    omsk: new Date().toLocaleTimeString("ru-RU", { timeZone: "Asia/Omsk" }),
    krasnoyarsk: new Date().toLocaleTimeString("ru-RU", {
      timeZone: "Asia/Krasnoyarsk",
    }),
    bishkek: new Date().toLocaleTimeString("ru-RU", {
      timeZone: "Asia/Bishkek",
    }),
    moscow: new Date().toLocaleTimeString("ru-RU", {
      timeZone: "Europe/Moscow",
    }),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime({
        guangzhou: new Date().toLocaleTimeString("ru-RU", {
          timeZone: "Asia/Shanghai",
        }),
        yekaterinburg: new Date().toLocaleTimeString("ru-RU", {
          timeZone: "Asia/Yekaterinburg",
        }),
        omsk: new Date().toLocaleTimeString("ru-RU", { timeZone: "Asia/Omsk" }),
        krasnoyarsk: new Date().toLocaleTimeString("ru-RU", {
          timeZone: "Asia/Krasnoyarsk",
        }),
        bishkek: new Date().toLocaleTimeString("ru-RU", {
          timeZone: "Asia/Bishkek",
        }),
        moscow: new Date().toLocaleTimeString("ru-RU", {
          timeZone: "Europe/Moscow",
        }),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Flex gap="large" style={{ marginRight: "24px" }}>
      <Flex vertical style={{ textAlign: "center", minWidth: 100 }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Бишкек
        </Text>
        <Text>{time.bishkek}</Text>
      </Flex>
      <Flex vertical style={{ textAlign: "center", minWidth: 100 }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Гуанчжоу
        </Text>
        <Text>{time.guangzhou}</Text>
      </Flex>
      <Flex vertical style={{ textAlign: "center", minWidth: 100 }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Москва
        </Text>
        <Text>{time.moscow}</Text>
      </Flex>
      <Flex vertical style={{ textAlign: "center", minWidth: 100 }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Екатеринбург
        </Text>
        <Text>{time.yekaterinburg}</Text>
      </Flex>
      <Flex vertical style={{ textAlign: "center", minWidth: 100 }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Омск
        </Text>
        <Text>{time.omsk}</Text>
      </Flex>
      <Flex vertical style={{ textAlign: "center", minWidth: 100 }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Красноярск
        </Text>
        <Text>{time.krasnoyarsk}</Text>
      </Flex>
    </Flex>
  );
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);

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

  const breakpoint = Grid.useBreakpoint();

  const isMobile =
    typeof breakpoint.lg === "undefined" ? false : !breakpoint.lg;

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        {!isMobile && <CountryTime />}
        <Space style={{ marginLeft: "8px" }} size="middle">
          {user?.name && <Text strong>{user.name}</Text>}
          {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
        </Space>
      </Space>
    </AntdLayout.Header>
  );
};
