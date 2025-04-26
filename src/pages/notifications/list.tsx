import { List, useTable } from "@refinedev/antd";
import { Table, Image, Space } from "antd";
import {
  PictureOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../App";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const NotificationsList = () => {
  const { tableProps } = useTable({
    resource: "notification",
  });

  const parseJSON = (jsonString: any) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return [];
    }
  };

  const PhotosCell = ({ photos }: any) => {
    const photoArray = parseJSON(photos);

    if (!photoArray || photoArray.length === 0) {
      return <span>Нет фото</span>;
    }

    return (
      <Space size="small">
        {photoArray.map((photo: any, index: any) => (
          <Image
            key={index}
            src={`${API_URL.replace("/api", "")}/${photo}`}
            width={50}
            height={50}
            style={{ objectFit: "cover" }}
            preview={{
              src: `${API_URL}/${photo}`,
              mask: <PictureOutlined />,
            }}
          />
        ))}
      </Space>
    );
  };

  const VideosCell = ({ videos }: any) => {
    const videoArray = parseJSON(videos);

    if (!videoArray || videoArray.length === 0) {
      return <span>Нет видео</span>;
    }

    return (
      <Space size="small">
        {videoArray.map((video: any, index: any) => (
          <div
            key={index}
            style={{ position: "relative", width: 50, height: 50 }}
          >
            <video
              src={`${API_URL.replace("/api", "")}/${video}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <a
              href={`${API_URL.replace("/api", "")}/${video}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <VideoCameraOutlined style={{ color: "white", fontSize: 18 }} />
            </a>
          </div>
        ))}
      </Space>
    );
  };

  return (
    <List>
      <Table {...tableProps}>
        <Table.Column
          dataIndex="created_at"
          title="Дата создания"
          render={(value) =>
            value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
          }
        />
        <Table.Column dataIndex="notification" title="Сообщение" />
        <Table.Column
          dataIndex="photos"
          title="Фото"
          render={(photos) => <PhotosCell photos={photos} />}
        />
        <Table.Column
          dataIndex="videos"
          title="Видео"
          render={(videos) => <VideosCell videos={videos} />}
        />
      </Table>
    </List>
  );
};
