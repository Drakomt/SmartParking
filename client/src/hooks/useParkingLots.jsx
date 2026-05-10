import { useEffect, useState } from "react";
import axios from "axios";

const useParkingLots = () => {
  const [parkingLotsCity, setParkingLotsCity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //   let HITParkings = [
  //     { id: "A1", type: "regular", isAvilable: false },
  //     { id: "A2", type: "regular", isAvilable: true },
  //     { id: "A3", type: "disabled", isAvilable: false },
  //     { id: "A4", type: "regular", isAvilable: true },
  //     { id: "A5", type: "regular", isAvilable: false },
  //     { id: "A6", type: "disabled", isAvilable: true },
  //     { id: "A7", type: "regular", isAvilable: true },
  //     { id: "A8", type: "dean", isAvilable: false },
  //     { id: "A9", type: "disabled", isAvilable: true },
  //   ];
  //   let teheranParkings = [
  //     { id: "A1", type: "regular", isAvilable: false },
  //     { id: "A2", type: "regular", isAvilable: false },
  //     { id: "A3", type: "regular", isAvilable: false },
  //     { id: "A4", type: "dean", isAvilable: true },
  //     { id: "A5", type: "regular", isAvilable: false },
  //     { id: "A6", type: "disabled", isAvilable: true },
  //     { id: "A7", type: "regular", isAvilable: false },
  //     { id: "A8", type: "dean", isAvilable: false },
  //     { id: "A9", type: "disabled", isAvilable: true },
  //   ];

  //   const mockDatabase = [
  //     { lotId: "HIT 1", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 2", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 3", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 4", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 5", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 6", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 7", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 8", city: "חולון", spots: HITParkings },
  //     { lotId: "HIT 9", city: "חולון", spots: HITParkings },
  //     { lotId: "חניון טהרן", city: "תל אביב", spots: teheranParkings },
  //   ];

  useEffect(() => {
    let isMounted = true;

    const fetchParkingLots = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = axios.get("API");
        if (!response.ok) {
          throw new Error(`Failed to load parking lots: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setParkingLotsCity(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      //   try {
      //     await new Promise((resolve) => setTimeout(resolve, 500));

      //     if (isMounted) {
      //       setParkingLotsCity(mockDatabase);
      //     }
      //   } catch (fetchError) {
      //     if (isMounted) {
      //       setError(fetchError);
      //     }
      //   } finally {
      //     if (isMounted) {
      //       setLoading(false);
      //     }
      //   }
    };

    fetchParkingLots();

    return () => {
      isMounted = false;
    };
  }, []);

  return { parkingLotsCity, loading, error };
};

export default useParkingLots;
