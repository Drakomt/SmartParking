import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://localhost:3000/api/parking";

const useParkingLots = (cityName) => {
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
        const response = await axios.get(`${API_URL}/lotsbycity`, {
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
    if (!cityName) return;

    const socket = io("http://localhost:3000", {
      query: { city: cityName }
    });

    socket.on("parking-spot-updated", (updatedSpot) => {
      console.log("Real-time spot update received in Search Results:", updatedSpot);
      
      setParkingLotsCity((prevLots) => {
        return prevLots.map(lot => {
          // Check if this lot owns the updated spot
          if (lot._id === updatedSpot.parkingLot?.id) {
            return {
              ...lot,
              spots: lot.spots ? lot.spots.map(spot => 
                spot._id === updatedSpot.spot?.id ? { ...spot, status: updatedSpot.spot.status } : spot
              ) : []
            };
          }
          return lot;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [cityName]);

  return { parkingLotsCity, loading, error };
};

export default useParkingLots;
