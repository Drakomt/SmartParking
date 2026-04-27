import { useState } from "react"
import ParkingButton from "../components/ParkingButton"
import ParkingLotView from "../components/ParkingLotView"
export default function ParkinLotPage (){

    const [parkings,setParkings]=useState(null);
    const onBack=()=>{setParkings(null)}
    const handleUpdateLocation=(event)=>{
       console.log(event.target.innerText);
      setParkings(map[event.target.innerText])
    }

    let HITParkings=[
        { id: 'A1', type: 'regular', isAvilable: false },
        { id: 'A2', type: 'regular', isAvilable: true },
        { id: 'A3', type: 'disabled', isAvilable: false },
        { id: 'A4', type: 'regular', isAvilable: true },
        { id: 'A5', type: 'regular', isAvilable: false },
        { id: 'A6', type: 'disabled', isAvilable: true },
        { id: 'A7', type: 'regular', isAvilable: true },
        { id: 'A8', type: 'dean', isAvilable: false },
        { id: 'A9', type: 'disabled', isAvilable: true },
    ]
    let teheranParkings=[
        { id: 'A1', type: 'regular', isAvilable: false },
        { id: 'A2', type: 'regular', isAvilable: false },
        { id: 'A3', type: 'regular', isAvilable: false },
        { id: 'A4', type: 'dean', isAvilable: true },
        { id: 'A5', type: 'regular', isAvilable: false },
        { id: 'A6', type: 'disabled', isAvilable: true },
        { id: 'A7', type: 'regular', isAvilable: false },
        { id: 'A8', type: 'dean', isAvilable: false },
        { id: 'A9', type: 'disabled', isAvilable: true },
    ]

    let map={"HIT":HITParkings,"טהרן":teheranParkings}

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 font-sans" dir="rtl">
      
      {parkings?<ParkingLotView parkings={parkings} onBack={onBack}/>:
      <div className="text-center p-8 sm:p-10 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-lg">
        
        
        <p className="text-lg text-slate-300 mb-8 font-medium">
          ברוכים הבאים למערכת ניהול החנייה החכמה. <br />
          אנא בחרו חניון רצוי:
        </p>


        <div className="grid grid-cols-2 gap-4">
          <ParkingButton onClick={(e)=>handleUpdateLocation(e)}>HIT</ParkingButton>
          <ParkingButton onClick={(e)=>handleUpdateLocation(e)}>עזריאלי</ParkingButton>
          <ParkingButton onClick={(e)=>handleUpdateLocation(e)}>ספרייה</ParkingButton>
          <ParkingButton onClick={(e)=>handleUpdateLocation(e)}>טהרן</ParkingButton>
        </div>
        
      </div>
            }
    </div>
    )
  };
  {/* <div className="relative mb-8">
    <input 
      type="text"
      placeholder="חיפוש חניון..." 
      className="w-full bg-slate-700/50 text-white placeholder-slate-400 px-5 py-4 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
    />
  </div> */}