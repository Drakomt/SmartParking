import { useState } from "react"

export default function SearchInput(){

const [inputValue,setInputValue] = useState("");
const HandleSubmit= (event) => {
    event.preventDefault();
    const FormData=new formData(event.currnetTarget)
    const cityName=FormData.get("cityInput")
}

return (
    <form>
        <input type="text"
              placeholder="חיפוש חניון..." 
              className="w-full bg-slate-700/50 text-white placeholder-slate-400 px-5 py-4 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              name="cityInput"
            />
        <button type="button" onClick={HandleSubmit}>
            חפש
        </button>
        
    </form>
)}
