import React, { useState, useEffect } from 'react';
import { Button, Badge, Drawer, Space, Typography, Spin } from 'antd';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import { API_URL } from '../../../App';

const { Text } = Typography;

interface ChatComponentProps {
  currentUserId: number;
  currentUserName: string;
  taskId?: number;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ 
  currentUserId, 
  currentUserName,
  taskId 
}) => {
  const [socket, setSocket] = useState<any>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Initialize socket connection just for notification purposes
  useEffect(() => {
    // Connect to the socket server
    const newSocket = io(API_URL, {
      query: { 
        userId: currentUserId,
        userName: currentUserName,
        taskId: taskId || 'general'
      }
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [currentUserId, currentUserName, taskId]);
  
  // Set up socket event listeners for unread counts
  useEffect(() => {
    if (!socket) return;
    
    // Listen for incoming messages to update unread count
    socket.on('message', (newMessage: any) => {
      // If drawer is closed and message is not from current user, increment unread count
      if (!isDrawerVisible && newMessage.sender.id !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    });
    
    // Get unread count on load
    socket.emit('getUnreadCount', { 
      userId: currentUserId,
      taskId: taskId || 'general'
    }, (count: number) => {
      setUnreadCount(count);
    });
    
    return () => {
      socket.off('message');
    };
  }, [socket, isDrawerVisible, currentUserId, taskId]);
  
  // Mark messages as read when drawer opens
  useEffect(() => {
    if (isDrawerVisible && unreadCount > 0 && socket) {
      setUnreadCount(0);
      
      // Emit event to mark messages as read
      socket.emit('markAsRead', { 
        userId: currentUserId,
        taskId: taskId || 'general'
      });
    }
  }, [isDrawerVisible, unreadCount, currentUserId, socket, taskId]);
  
  const showDrawer = () => {
    setIsDrawerVisible(true);
  };
  
  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };
  
  return (
    <>
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button 
          type="primary" 
          shape="circle" 
          icon={<MessageOutlined />} 
          size="large"
          onClick={showDrawer}
          style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            zIndex: 1000,
            boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
          }}
        />
      </Badge>
      
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{taskId ? `Чат задачи #${taskId}` : 'Общий чат'}</span>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={closeDrawer} 
              style={{ marginRight: -12 }}
            />
          </div>
        }
        placement="right"
        onClose={closeDrawer}
        open={isDrawerVisible}
        width={350}
        headerStyle={{ padding: '12px 16px' }}
        bodyStyle={{ padding: 0 }}
        closable={false}
      >
        <iframe
          src={`/_chat?userId=${currentUserId}&userName=${encodeURIComponent(currentUserName)}&taskId=${taskId || ''}&embedded=true`}
          style={{
            border: 'none',
            width: '100%',
            height: '100%'
          }}
          title="Chat"
        />
      </Drawer>
    </>
  );
};

export default ChatComponent;