export default function ParkingButton({children,onClick}){
    return (
        <button  onClick={onClick} className="bg-blue-500 hover:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 mb-6 mx-2">
            {children}
        </button>
    )
};