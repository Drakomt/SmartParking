import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:3000/api/parking";

export const useUserParkingLots = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserParkingLots = async () => {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("לא נמצא משתמש מחובר");
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Backend return an array of lots
        setParkingLots(response.data);
      } catch (err) {
        console.error("שגיאה במשיכת חניוני משתמש:", err);
        
        // Security check: if token is invalid/expired
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event("authChange"));
          navigate('/login');
          return;
        }

        // Fallback for when backend is not fully supported
        setParkingLots([]);
        setError("לא הצלחנו למשוך נתונים מהשרת (או שהשרת לא תומך עדיין)");
      } finally {
        setLoading(false);
      }
    };

    fetchUserParkingLots();
  }, [navigate]);

  return { parkingLots, loading, error };
};
