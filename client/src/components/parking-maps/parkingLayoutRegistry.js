export const PARKING_LAYOUT = Object.freeze({
  MEDIATHEQUE: "mediatheque",
  HAIFA_PORT: "haifa-port",
  BEERSHEBA_CENTER: "beersheba-center",
});

const imageLotMatchers = [
  {
    layout: PARKING_LAYOUT.MEDIATHEQUE,
    matches: (name) => name.includes("מדיטק") || name.includes("mediatheque"),
    capacity: 90,
  },
  {
    layout: PARKING_LAYOUT.HAIFA_PORT,
    matches: (name) => name.includes("חניון הנמל") || name.includes("haifa port"),
    capacity: 59,
  },
  {
    layout: PARKING_LAYOUT.BEERSHEBA_CENTER,
    matches: (name) => name.includes("באר שבע מרכז") || name.includes("beersheba center"),
    capacity: 78,
  },
];

export const getParkingLayout = (lotName) => {
  const normalizedName = String(lotName || "").trim().toLowerCase();
  return imageLotMatchers.find((candidate) => candidate.matches(normalizedName)) || null;
};
