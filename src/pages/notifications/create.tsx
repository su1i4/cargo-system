import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Button, Popover, Upload } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { API_URL } from "../../App";
import { InboxOutlined } from "@ant-design/icons";

export const NotificationsCreate = () => {
  const { formProps, saveButtonProps, form } = useForm();

  const modifiedFormProps = {
    ...formProps,
    onFinish: (values: any) => {
      const photosJson = JSON.stringify(photos);
      const videosJson = JSON.stringify(videos);

      if (formProps.onFinish) {
        return formProps.onFinish({
          ...values,
          photos: photosJson,
          videos: videosJson,
        });
      }
      return {
        ...values,
        photos: photosJson,
        videos: videosJson,
      };
    },
  };

  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [fileListPhotos, setFileListPhotos] = useState([]);
  const [fileListVideos, setFileListVideos] = useState([]);
  const [text, setText] = useState("");

  // Обновляем поле notification при изменении текста
  useEffect(() => {
    form.setFieldsValue({
      notification: text,
    });
  }, [text, form]);

  // Обновляем поля photos и videos при изменении соответствующих состояний
  useEffect(() => {
    form.setFieldsValue({
      photos,
    });
  }, [photos, form]);

  useEffect(() => {
    form.setFieldsValue({
      videos,
    });
  }, [videos, form]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData?.emoji);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleFileUpload = (
    info: any,
    fieldName: "photos" | "videos",
    setFileList: any,
    setFilesState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setFileList(info.fileList);

    if (info.file.status === "done") {
      const uploadedFileUrl = info.file.response.filePath;
      // Обновляем состояние
      const newFiles = [
        ...(fieldName === "photos" ? photos : videos),
        uploadedFileUrl,
      ];
      setFilesState(newFiles);

      // Обновляем значение формы
      form.setFieldsValue({
        [fieldName]: newFiles,
      });
    }

    if (info.file.status === "removed") {
      const removedUrl = info.file.response?.filePath || info.file.url;
      // Обновляем состояние
      const newFiles = (fieldName === "photos" ? photos : videos).filter(
        (url) => url !== removedUrl
      );
      setFilesState(newFiles);

      // Обновляем значение формы
      form.setFieldsValue({
        [fieldName]: newFiles,
      });
    }
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...modifiedFormProps} layout="vertical">
        {/* Сообщение */}
        <Form.Item
          rules={[{ required: true }]}
          label="Сообщение"
          name="notification"
        >
          <TextArea
            value={text}
            onChange={handleTextChange}
            placeholder="Введите сообщение"
          />
          <Popover
            content={<EmojiPicker onEmojiClick={handleEmojiClick} />}
            trigger="click"
            visible={isEmojiPickerVisible}
            onVisibleChange={setIsEmojiPickerVisible}
          >
            <Button type="link">😀</Button>
          </Popover>
        </Form.Item>

        {/* Фото */}
        <Form.Item label="Фото" name="photos">
          <Upload.Dragger
            name="file"
            action={`${API_URL}/file-upload`}
            listType="picture"
            accept=".png,.jpg,.jpeg"
            fileList={fileListPhotos}
            onChange={(info) =>
              handleFileUpload(info, "photos", setFileListPhotos, setPhotos)
            }
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Нажмите или перетащите файлы в эту область для загрузки
            </p>
            <p className="ant-upload-hint">
              Поддерживаются форматы PNG, JPG, JPEG
            </p>
          </Upload.Dragger>
        </Form.Item>

        {/* Видео */}
        <Form.Item label="Видео" name="videos">
          <Upload.Dragger
            name="file"
            action={`${API_URL}/file-upload`}
            listType="picture"
            accept=".mp4,.webm,.mov"
            fileList={fileListVideos}
            onChange={(info) =>
              handleFileUpload(info, "videos", setFileListVideos, setVideos)
            }
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Нажмите или перетащите файлы в эту область для загрузки
            </p>
            <p className="ant-upload-hint">
              Поддерживаются форматы MP4, WebM, MOV
            </p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Create>
  );
};
