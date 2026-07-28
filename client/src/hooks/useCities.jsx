import { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

const useCities = () => {
  const [citiesInDatabase, setCitiesInDatabase] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/parking/cities`);
        setCitiesInDatabase(response.data);
      } catch (err) {
        console.error("שגיאה במשיכת רשימת הערים:", err);
      }
    };

    fetchCities();
  }, []);

  return citiesInDatabase;
};

export default useCities;
