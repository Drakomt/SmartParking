import { useEffect,useState } from "react";


export default useCities = () =>{

    const [citiesInDatabase, setCitiesInDatabase] = useState([]);

    useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/cities"); 
        if (!response.ok) throw new Error("Failed to fetch cities");
        
        const data = await response.json();
        setCitiesInDatabase(data);
      } catch (err) {
        console.error("שגיאה במשיכת רשימת הערים:", err);

            }
        }
    },[]);
 return citiesInDatabase;
}