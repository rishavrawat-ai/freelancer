// Notification utility - shared socket.io reference for sending notifications
// This avoids circular dependencies between socket.js and controllers

let io = null;

// Set the socket.io instance (called from socket.js when initialized)
export const setIoInstance = (ioInstance) => {
  io = ioInstance;
  console.log("[NotificationUtil] Socket.IO instance set");
};

// Get the socket.io instance
export const getIoInstance = () => io;

// Send a notification to a specific user
export const sendNotificationToUser = (userId, notification) => {
  if (!io || !userId) {
    console.log(`[NotificationUtil] Cannot send - io: ${!!io}, userId: ${userId}`);
    return false;
  }
  
  const roomName = `user:${userId}`;
  const payload = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ...notification,
    createdAt: new Date().toISOString()
  };
  
  io.to(roomName).emit("notification:new", payload);
  
  console.log(`[NotificationUtil] ✅ Sent notification to ${roomName}:`, notification.title, notification.type);
  return true;
};
