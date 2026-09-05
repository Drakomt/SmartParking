import axios from "axios";
import { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";

const useParkingData = (parkingLotId, currentLevel, cityName) => {
  const socket = useSocket();
  const [parkings, setParkings] = useState([]);
  const [totalLevels, setTotalLevels] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchParkingData = async (levelOverride) => {
    if (!parkingLotId || parkingLotId === "undefined") return;
    
    const targetLevel = levelOverride !== undefined ? levelOverride : currentLevel;
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/parking/${parkingLotId}/spots`, {
        params: { level: targetLevel }
      });
      const data = response.data;
      console.log("JSON received from Backend for this level:", data);
      const sortedSlots = (data.slots || []).sort(
        (a, b) => (Number(a.spotNumber) || 0) - (Number(b.spotNumber) || 0)
      );
      setParkings(sortedSlots);
      setTotalLevels(data.totalLevels || 1);
      
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
  }, [parkingLotId, currentLevel]); 

  useEffect(() => {
    if (!cityName || !socket) return;

    socket.emit("join-city-room", cityName);

    const handleSpotUpdate = (updatedSpot) => {
      console.log("Real-time spot update received in ParkingLotView:", updatedSpot);
      
      setParkings((prevParkings) => {
        const exists = prevParkings.find(s => s._id === updatedSpot.spot?.id);
        if (!exists) return prevParkings;

        return prevParkings.map((spot) => 
          spot._id === updatedSpot.spot?.id ? { ...spot, status: updatedSpot.spot.status, type: updatedSpot.spot.type } : spot
        );
      });
    };

    socket.on("parking-spot-updated", handleSpotUpdate);

    return () => {
      socket.off("parking-spot-updated", handleSpotUpdate);
    };
  }, [cityName, socket]);

  return { parkings, totalLevels, isLoading, error, refreshData: fetchParkingData };
};

export default useParkingData;