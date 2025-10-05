import { useState, useEffect } from "react";
import {
  type ITreeMenu,
  useIsExistAuthentication,
  useTranslate,
  useLogout,
  useMenu,
  useWarnAboutChange,
  useNavigation,
} from "@refinedev/core";
import { Link } from "react-router";
import { type Sider } from "@refinedev/antd";
import {
  Layout as AntdLayout,
  Menu,
  Grid,
  theme,
  Button,
  Drawer,
  message,
} from "antd";
import { LogoutOutlined, RightOutlined, MenuOutlined } from "@ant-design/icons";
import { antLayoutSider, antLayoutSiderMobile } from "./styles";
import { API_URL } from "../../App";

const { useToken } = theme;

export const CustomSider: typeof Sider = ({ render }) => {
  const { token } = useToken();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [mobileDrawerVisible, setMobileDrawerVisible] =
    useState<boolean>(false);
  const isExistAuthentication = useIsExistAuthentication();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const { mutate: mutateLogout } = useLogout();
  const translate = useTranslate();
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu();
  const role = localStorage.getItem("cargo-system-role");

  const breakpoint = Grid.useBreakpoint();

  const isMobile =
    typeof breakpoint.lg === "undefined" ? false : !breakpoint.lg;

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (role !== "admin") {
      getUserPermissions();
    }
  }, []);

  const getUserPermissions = async () => {
    try {
      const response = await fetch(`${API_URL}/users/permissions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
      });
      const data = await response.json();
      setUserPermissions(data);
    } catch (error: any) {
      message.error(error?.message || "Ошибка при получении прав пользователя");
    }
  };

  const checkPermission = (name: string) => {
    const findPermission = userPermissions.find(
      (permission) => permission.endpoint.path === name
    );
    // return findPermission?.show || findPermission?.create || findPermission?.delete || findPermission?.edit;
    return true;
  };

  const renderTreeView = (tree: ITreeMenu[], selectedKey: string) => {
    return tree.map((item: ITreeMenu) => {
      const { name, children, meta, key, list } = item;

      const icon = item?.icon;
      const label = meta?.label ?? name;
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
            className={isColor ? "cargo-color-submenu" : ""}
            style={{
              textTransform: "capitalize",
            }}
          >
            {renderTreeView(children, selectedKey)}
          </Menu.SubMenu>
        );
      }

      const isSelected = route === selectedKey;

      const canShow = role === "admin" ? true : checkPermission(name);

      return (
        <Menu.Item
          key={route}
          style={{
            textTransform: "capitalize",
            display: canShow ? "block" : "none",
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
          {!collapsed && isSelected && <div className="ant-menu-tree-arrow" />}
        </Menu.Item>
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
          icon={<MenuOutlined style={{ color: "white" }} />}
          style={{
            background: "#5932EA",
            position: "fixed",
            top: "16px",
            left: "16px",
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
                push("/goods-processing");
                setMobileDrawerVisible(false);
              }}
              src="../../public/cargo-system-logo.png"
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
          gap: "10px",
        }}
      >
        <img
          style={{
            width: "100px",
          }}
          onClick={() => push("/goods-processing")}
          src="../../public/cargo-system-logo.png"
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
