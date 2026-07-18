import { Server } from 'socket.io';

let ioInstance = null;

const normalizeCityName = (cityName) => {
    return String(cityName || '').trim().toLowerCase();
};

const getCityRoomName = (cityName) => {
    return `city:${normalizeCityName(cityName)}`;
};

const joinCityRoom = (socket, cityName) => {
    const normalizedCityName = normalizeCityName(cityName);

    if (!normalizedCityName) {
        return null;
    }

    const nextRoom = getCityRoomName(normalizedCityName);

    if (socket.data.cityRoom && socket.data.cityRoom !== nextRoom) {
        socket.leave(socket.data.cityRoom);
    }

    socket.join(nextRoom);
    socket.data.cityRoom = nextRoom;

    return nextRoom;
};

const registerConnectionHandlers = (socket) => {
    const { city } = socket.handshake.query;

    if (typeof city === 'string') {
        joinCityRoom(socket, city);
    }

    socket.on('join-city-room', (cityName, ack) => {
        const room = joinCityRoom(socket, cityName);

        if (typeof ack === 'function') {
            ack({ room });
        }
    });
};

const initializeSocketServer = (httpServer) => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || '*',
            methods: ['GET', 'POST'],
        },
    });

    ioInstance.on('connection', registerConnectionHandlers);

    return ioInstance;
};

const emitParkingSpotUpdate = (cityName, payload) => {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(getCityRoomName(cityName)).emit('parking-spot-updated', payload);
};

export { initializeSocketServer, emitParkingSpotUpdate, getCityRoomName, normalizeCityName };