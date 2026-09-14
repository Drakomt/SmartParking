import { useEffect, useState } from "react";
import api from "../lib/api";
import { useSocket } from "../contexts/SocketContext";

const API_URL = "/api/parking";

const useParkingLots = (cityName) => {
  const socket = useSocket();
  const [parkingLotsCity, setParkingLotsCity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cityName) {
      setParkingLotsCity([]);
      return;
    }

    let isMounted = true;

    const fetchParkingLots = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`${API_URL}/lotsbycity`, {
          params: { city: cityName },
        });

        if (isMounted) {
          setParkingLotsCity(response.data);
        }
      } catch (fetchError) {
        if (isMounted) {
          if (fetchError.response && fetchError.response.status === 404) {
            setParkingLotsCity([]);
          } else {
            setError(fetchError.message);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchParkingLots();

    return () => {
      isMounted = false;
    };
  }, [cityName]);

  useEffect(() => {
    if (!cityName || !socket) return;

    socket.emit("join-city-room", cityName);

    const handleSpotUpdate = (updatedSpot) => {
      setParkingLotsCity((prevLots) => {
        return prevLots.map(lot => {
          if (lot._id === updatedSpot.parkingLot?.id) {
            let newSpots = lot.spots ? [...lot.spots] : [];
            
            if (updatedSpot.action === 'created') {
              if (!newSpots.some((spot) => spot._id === updatedSpot.spot.id)) {
                newSpots.push({ ...updatedSpot.spot, _id: updatedSpot.spot.id });
              }
            } else if (updatedSpot.action === 'deleted') {
              newSpots = newSpots.filter(s => s._id !== updatedSpot.spot.id);
            } else {
              newSpots = newSpots.map(spot => 
                spot._id === updatedSpot.spot?.id 
                  ? { ...spot, status: updatedSpot.spot.status, type: updatedSpot.spot.type } 
                  : spot
              );
            }

            return {
              ...lot,
              totalSpots: updatedSpot.parkingLot.totalSpots ?? lot.totalSpots,
              spots: newSpots
            };
          }
          return lot;
        });
      });
    };

    socket.on("parking-spot-updated", handleSpotUpdate);

    return () => {
      socket.off("parking-spot-updated", handleSpotUpdate);
    };
  }, [cityName, socket]);

  const refreshLots = async () => {
    if (!cityName) return;
    try {
      const response = await api.get(`${API_URL}/lotsbycity`, {
        params: { city: cityName },
      });
      setParkingLotsCity(response.data);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to refresh lots", err);
    }
  };

  return { parkingLotsCity, loading, error, refreshLots };
};

export default useParkingLots;
