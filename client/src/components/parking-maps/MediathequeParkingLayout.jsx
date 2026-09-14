import ParkingMapLayout from "./ParkingMapLayout";

const STALL_WIDTH = 3.28;
const STALL_HEIGHT = 7;

const MEDIATHEQUE_COORDINATES = (() => {
  const coordinates = [];
  const columns = 18;
  const startX = 21.1;
  const columnGap = 3.5;
  const rows = [
    { y: 22.3, facing: "up" },
    { y: 36, facing: "down" },
    { y: 43, facing: "up" },
    { y: 55.5, facing: "down" },
    { y: 62.5, facing: "up" },
  ];

  for (const row of rows) {
    for (let column = 0; column < columns; column += 1) {
      coordinates.push({
        x: startX + column * columnGap,
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

// A future image-based parking lot only needs a configuration like this.
const MEDIATHEQUE_MAP = {
  imageSrc: "/mediatheque-rectangular.jpg",
  imageAlt: "חניון המדיטק",
  aspectRatio: "1024 / 686",
  coordinates: MEDIATHEQUE_COORDINATES,
};

export default function MediathequeParkingLayout(props) {
  return <ParkingMapLayout {...props} map={MEDIATHEQUE_MAP} />;
}
