let ioInstance = null;

export const initializeSocket = (io) => {
  ioInstance = io;
};

export const getSocket = () => ioInstance;
