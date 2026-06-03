import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";
let socket = null;

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  const auth = token || localStorage.getItem("token");
  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: {
      token: auth,
    },
    autoConnect: true,
  });

  return socket;
};

export const subscribeToEvent = (event, callback) => {
  if (!socket) {
    return () => {};
  }

  socket.on(event, callback);

  return () => {
    socket.off(event, callback);
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
