import { useEffect, useState } from "react";
import api from "../lib/api";

const useCities = () => {
  const [citiesInDatabase, setCitiesInDatabase] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get("/api/parking/cities");
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
