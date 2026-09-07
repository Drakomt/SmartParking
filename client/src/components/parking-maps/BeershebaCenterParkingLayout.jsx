import ParkingMapLayout from "./ParkingMapLayout";

const STALL_WIDTH = 2.25;
const STALL_HEIGHT = 5.6;
const COLUMN_GAP = 0.25;
const ROWS = [
  { count: 2, x: 46.2, y: 13.3, facing: "up" },
  { count: 5, x: 47, y: 27, facing: "down" },
  { count: 8, x: 48, y: 36.1, facing: "up" },
  { count: 11, x: 49, y: 52, facing: "down" },
  { count: 14, x: 50.5, y: 61, facing: "up" },
  { count: 18, x: 52, y: 76.2, facing: "down" },
  { count: 20, x: 52, y: 86, facing: "up" },
];

const BEERSHEBA_CENTER_COORDINATES = (() => {
  const coordinates = [];
  for (const row of ROWS) {
    const rowWidth = row.count * STALL_WIDTH + (row.count - 1) * COLUMN_GAP;
    const startX = row.x - rowWidth / 2;

    for (let column = 0; column < row.count; column += 1) {
      coordinates.push({
        x: startX + column * (STALL_WIDTH + COLUMN_GAP),
        y: row.y,
        width: STALL_WIDTH,
        height: STALL_HEIGHT,
        rotation: 0,
        facing: row.facing,
      });
    }
  }

  return coordinates;
})();

export const BEERSHEBA_CENTER_MAP = {
  imageSrc: "/beersheba-center-parking.jpg",
  imageAlt: "חניון באר שבע מרכז",
  aspectRatio: "2422 / 1760",
  coordinates: BEERSHEBA_CENTER_COORDINATES,
};

export default function BeershebaCenterParkingLayout(props) {
  return <ParkingMapLayout {...props} map={BEERSHEBA_CENTER_MAP} />;
}
