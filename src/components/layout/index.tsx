import React from "react";
import { Grid, Layout as AntdLayout } from "antd";

import { ThemedSiderV2 as DefaultSider } from "@refinedev/antd"; // Используем дефолтный сайдер
import { ThemedHeaderV2 as DefaultHeader } from "@refinedev/antd";
import type { RefineThemedLayoutV2Props } from "@refinedev/antd";
import { ThemedLayoutContextProvider } from "@refinedev/antd";
import { useLocation } from "react-router";

export const CustomLayout: React.FC<RefineThemedLayoutV2Props> = ({
  children,
  Header,
  Sider,
  Title,
  Footer,
  OffLayoutArea,
  initialSiderCollapsed,
  onSiderCollapsed,
}) => {
  const breakpoint = Grid.useBreakpoint();
  const SiderToRender = Sider ?? DefaultSider;
  const HeaderToRender = Header ?? DefaultHeader;
  const hasSider = !!SiderToRender({ Title });
  const { pathname } = useLocation();
  
  return (
    <ThemedLayoutContextProvider
      initialSiderCollapsed={initialSiderCollapsed}
      onSiderCollapsed={onSiderCollapsed}
    >
      <AntdLayout style={{ minHeight: "100vh" }} hasSider={hasSider}>
        <SiderToRender Title={Title} />
        <AntdLayout>
          <HeaderToRender />
          <AntdLayout.Content>
            <div
              style={{
                minHeight: 360,
                padding: pathname === "/shipment" ? 0 : 24,
              }}
            >
              {children}
            </div>
            {OffLayoutArea && <OffLayoutArea />}
          </AntdLayout.Content>
          {Footer && <Footer />}
        </AntdLayout>
      </AntdLayout>
    </ThemedLayoutContextProvider>
  );
};
