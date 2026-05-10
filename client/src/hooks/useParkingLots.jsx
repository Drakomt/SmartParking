import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/parking";

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

  return { parkingLotsCity, loading, error };
};

export default useParkingLots;
