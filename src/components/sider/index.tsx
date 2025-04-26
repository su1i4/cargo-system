import React, { useState, useEffect } from "react";
import {
  type ITreeMenu,
  CanAccess,
  useIsExistAuthentication,
  useTranslate,
  useLogout,
  useMenu,
  useWarnAboutChange,
  useNavigation,
} from "@refinedev/core";
import { Link } from "react-router";
import { type Sider } from "@refinedev/antd";
import { Layout as AntdLayout, Menu, Grid, theme, Button, Drawer } from "antd";
import { LogoutOutlined, RightOutlined, LeftOutlined, MenuOutlined } from "@ant-design/icons";
import { antLayoutSider, antLayoutSiderMobile } from "./styles";

const { useToken } = theme;

export const CustomSider: typeof Sider = ({ render }) => {
  const { token } = useToken();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState<boolean>(false);
  const isExistAuthentication = useIsExistAuthentication();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const { mutate: mutateLogout } = useLogout();
  const translate = useTranslate();
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu();

  const breakpoint = Grid.useBreakpoint();

  const isMobile =
    typeof breakpoint.lg === "undefined" ? false : !breakpoint.lg;

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const renderTreeView = (tree: ITreeMenu[], selectedKey: string) => {
    return tree.map((item: ITreeMenu) => {
      const { name, children, meta, key, list } = item;

      const icon = item?.icon;
      const label = meta?.label ?? name;
      const parent = meta?.parent;
      const route =
        typeof list === "string"
          ? list
          : typeof list !== "function"
          ? list?.path
          : key;

      const customSelectedKey = selectedKey.split("/")[1];
      const customKey = key?.split("/")[1] || "";

      const isColor =
        children.length > 0 ? customSelectedKey === customKey : false;

      if (children.length > 0) {
        return (
          <Menu.SubMenu
            key={route}
            icon={icon}
            title={label}
            className={isColor ? "gradient-submenu" : ""}
            style={{
              textTransform: "capitalize",
            }}
          >
            {renderTreeView(children, selectedKey)}
          </Menu.SubMenu>
        );
      }

      const isSelected = route === selectedKey;

      return (
        <CanAccess
          key={route}
          resource={name}
          action="list"
          params={{ resource: item }}
        >
          <Menu.Item
            key={route}
            style={{
              textTransform: "capitalize",
            }}
            icon={icon}
          >
            {route ? (
              <Link style={{ fontSize: 13 }} to={route || "/"}>
                {label}
              </Link>
            ) : (
              label
            )}
            {!collapsed && isSelected && (
              <div className="ant-menu-tree-arrow" />
            )}
          </Menu.Item>
        </CanAccess>
      );
    });
  };

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        translate(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes."
        )
      );

      if (confirm) {
        setWarnWhen(false);
        mutateLogout();
      }
    } else {
      mutateLogout();
    }
  };

  const logout = isExistAuthentication && (
    <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
      {translate("buttons.logout", "Logout")}
    </Menu.Item>
  );

  const items = renderTreeView(menuItems, selectedKey);

  const renderSider = () => {
    if (render) {
      return render({
        dashboard: null,
        items,
        logout,
        collapsed,
      });
    }
    return (
      <>
        {items}
        {logout}
      </>
    );
  };

  const siderStyle = isMobile ? antLayoutSiderMobile : antLayoutSider;

  const { push } = useNavigation();

  if (isMobile) {
    return (
      <>
        <Button 
          icon={<MenuOutlined style={{color: 'white'}}/>}
          style={{
            background: 'linear-gradient(to bottom, #EA653A, #EB2540)',
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 50,
          }}
          onClick={() => setMobileDrawerVisible(true)}
        />
        <Drawer
          placement="left"
          closable={true}
          onClose={() => setMobileDrawerVisible(false)}
          visible={mobileDrawerVisible}
          width={250}
          bodyStyle={{ padding: 0 }}
        >
          <div
            style={{
              padding: "0 16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "64px",
              backgroundColor: token.colorBgElevated,
              fontSize: "14px",
            }}
          >
            <img
              style={{
                width: "110px",
              }}
              onClick={() => {
                push("/accepted-goods");
                setMobileDrawerVisible(false);
              }}
              src="../../public/alfa-china.png"
            />
          </div>
          <Menu
            defaultOpenKeys={defaultOpenKeys}
            selectedKeys={[selectedKey]}
            mode="inline"
            style={{
              marginTop: "8px",
              border: "none",
            }}
            onClick={() => setMobileDrawerVisible(false)}
          >
            {renderSider()}
          </Menu>
        </Drawer>
      </>
    );
  }

  return (
    <AntdLayout.Sider
      collapsible
      collapsedWidth={80}
      collapsed={collapsed}
      breakpoint="lg"
      onCollapse={(collapsed: boolean): void => setCollapsed(collapsed)}
      style={{
        ...siderStyle,
        backgroundColor: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBgElevated}`,
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        overflowY: "auto",
      }}
      trigger={
        <Button
          type="text"
          style={{
            borderRadius: 0,
            height: "100%",
            width: "100%",
            backgroundColor: token.colorBgElevated,
          }}
        >
          <RightOutlined
            style={{
              color: token.colorPrimary,
              rotate: !collapsed ? "180deg" : "0deg",
              transition: "transform 2s linear",
            }}
          />
        </Button>
      }
    >
      <div
        style={{
          width: collapsed ? "80px" : "200px",
          padding: collapsed ? "0" : "0 16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "64px",
          backgroundColor: token.colorBgElevated,
          fontSize: "14px",
        }}
      >
        <img
          style={{
            width: collapsed ? "70px" : "110px",
          }}
          onClick={() => push("/accepted-goods")}
          src="../../public/alfa-china.png"
        />
      </div>
      <Menu
        defaultOpenKeys={defaultOpenKeys}
        selectedKeys={[selectedKey]}
        mode="inline"
        style={{
          marginTop: "8px",
          border: "none",
        }}
        onClick={() => {
          if (!breakpoint.lg) {
            setCollapsed(true);
          }
        }}
      >
        {renderSider()}
      </Menu>
    </AntdLayout.Sider>
  );
};
