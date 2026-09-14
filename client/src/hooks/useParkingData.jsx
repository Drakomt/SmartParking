import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import { useSocket } from "../contexts/SocketContext";

const useParkingData = (parkingLotId, currentLevel, cityName) => {
  const socket = useSocket();
  const [parkings, setParkings] = useState([]);
  const [totalLevels, setTotalLevels] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchParkingData = useCallback(async (levelOverride) => {
    if (!parkingLotId || parkingLotId === "undefined") return;
    
    const targetLevel = levelOverride !== undefined ? levelOverride : currentLevel;
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/parking/${parkingLotId}/spots`, {
        params: { level: targetLevel }
      });
      const data = response.data;
      const sortedSlots = (data.slots || []).sort(
        (a, b) => (Number(a.spotNumber) || 0) - (Number(b.spotNumber) || 0)
      );
      setParkings(sortedSlots);
      setTotalLevels(data.totalLevels || 1);
      
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error loading parking data", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentLevel, parkingLotId]);

  useEffect(() => {
    fetchParkingData();
  }, [fetchParkingData]);

  useEffect(() => {
    if (!cityName || !socket) return;

    socket.emit("join-city-room", cityName);

    const handleSpotUpdate = (updatedSpot) => {
      if (
        updatedSpot.parkingLot?.id !== parkingLotId
        || Number(updatedSpot.spot?.level) !== Number(currentLevel)
      ) return;

      setParkings((previous) => {
        const spotId = updatedSpot.spot?.id;
        if (!spotId) return previous;

        if (updatedSpot.action === "created") {
          if (previous.some((spot) => spot._id === spotId)) return previous;
          return [...previous, { ...updatedSpot.spot, _id: spotId }]
            .sort((a, b) => (Number(a.spotNumber) || 0) - (Number(b.spotNumber) || 0));
        }

        if (updatedSpot.action === "deleted") {
          return previous.filter((spot) => spot._id !== spotId);
        }

        return previous.map((spot) => (
          spot._id === spotId
            ? { ...spot, ...updatedSpot.spot, _id: spotId }
            : spot
        ));
      });
    };

    socket.on("parking-spot-updated", handleSpotUpdate);

    return () => {
      socket.off("parking-spot-updated", handleSpotUpdate);
    };
  }, [cityName, currentLevel, parkingLotId, socket]);

  return { parkings, totalLevels, isLoading, error, refreshData: fetchParkingData };
};

export default useParkingData;
