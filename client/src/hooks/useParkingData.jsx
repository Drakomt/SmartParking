import axios from "axios";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const useParkingData = (parkingLotId, currentLevel, cityName) => {
  const [parkings, setParkings] = useState([]);
  const [totalLevels, setTotalLevels] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!parkingLotId || parkingLotId === "undefined") return;

    const fetchParkingData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`http://localhost:3000/api/parking/${parkingLotId}/spots`, {
          params: { level: currentLevel }
        });
        const data = response.data;
        console.log("JSON received from Backend for this level:", data);
        setParkings(data.slots || []);
        setTotalLevels(data.totalLevels || 1);
        
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParkingData();
    
  }, [parkingLotId, currentLevel]); 

  useEffect(() => {
    if (!cityName) return;

    const socket = io("http://localhost:3000", {
      query: { city: cityName }
    });

    socket.on("connect", () => {
      console.log(`Connected to socket server for city: ${cityName}`);
    });

    socket.on("parking-spot-updated", (updatedSpot) => {
      console.log("Real-time spot update received in ParkingLotView:", updatedSpot);
      
      setParkings((prevParkings) => {
        const exists = prevParkings.find(s => s._id === updatedSpot.spot?.id);
        if (!exists) return prevParkings; // If the spot is not on this level/lot, ignore it

        return prevParkings.map((spot) => 
          spot._id === updatedSpot.spot?.id ? { ...spot, status: updatedSpot.spot.status } : spot
        );
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [cityName]);

  return { parkings, totalLevels, isLoading, error };
};

export default useParkingData;