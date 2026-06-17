import { useState, useEffect } from "react";

const useParkingData = (parkingLotId, currentLevel) => {
  const [parkings, setParkings] = useState([]);
  const [totalLevels, setTotalLevels] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!parkingLotId) return;

    const fetchParkingData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        
        const response = await fetch(`http://localhost:3000/api/parking/${parkingLotId}/spots?level=${currentLevel}`);
        if (!response.ok) {
          throw new Error("שגיאה במשיכת נתוני החניון");
        }

        const data = await response.json();
        console.log(data);
        console.log(data);
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
  
  return { parkings, totalLevels, isLoading, error };
};

export default useParkingData;