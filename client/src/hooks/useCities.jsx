import { useEffect, useState } from "react";
import axios from "axios";

const useCities = () => {
  const [citiesInDatabase, setCitiesInDatabase] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/parking/cities"); 
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