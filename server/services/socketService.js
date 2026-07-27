import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import userRepo from '../repositories/userRepo.js';
import cityRepo from '../repositories/cityRepo.js';

let ioInstance = null;

const normalizeCityName = (cityName) => {
    return String(cityName || '').trim().toLowerCase();
};

const getCityRoomName = (cityName) => {
    return `city:${normalizeCityName(cityName)}`;
};

const getUserRoomName = (userId) => {
    return `user:${String(userId)}`;
};

const authenticateSocket = async (socket) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userRepo.findUserById(decoded.id);
        if (!user) {
            return null;
        }

        socket.data.user = user;
        socket.join(getUserRoomName(user._id));
        return user;
    } catch (error) {
        return null;
    }
};

const joinCityRoom = async (socket, cityName) => {
    if (!socket.data.user) {
        return null;
    }

    const normalizedCityName = normalizeCityName(cityName);
    if (!normalizedCityName) {
        return null;
    }

    const city = await cityRepo.findCityByName(normalizedCityName);
    if (!city) {
        return null;
    }

    const authorizedCities = socket.data.user.authorizedCities || [];
    if (!authorizedCities.some((id) => id.toString() === city._id.toString())) {
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
    authenticateSocket(socket).then(() => {
        const { city } = socket.handshake.query;

        if (typeof city === 'string') {
            joinCityRoom(socket, city);
        }
    });

    socket.on('join-city-room', async (cityName, ack) => {
        const room = await joinCityRoom(socket, cityName);

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

const emitParkingSpotUpdateToAuthorizedUsers = async (cityId, payload) => {
    if (!ioInstance) {
        return;
    }

    const users = await userRepo.findUsersByAuthorizedCity(cityId);
    users.forEach((user) => {
        ioInstance.to(getUserRoomName(user._id)).emit('parking-spot-updated', payload);
    });
};

const emitParkingSessionUpdateToAuthorizedUsers = async (cityId, payload) => {
    if (!ioInstance) {
        return;
    }

    const users = await userRepo.findUsersByAuthorizedCity(cityId);
    users.forEach((user) => {
        ioInstance.to(getUserRoomName(user._id)).emit('parking-session-updated', payload);
    });
};

export { initializeSocketServer, emitParkingSpotUpdate, emitParkingSpotUpdateToAuthorizedUsers, emitParkingSessionUpdateToAuthorizedUsers, getCityRoomName, normalizeCityName };