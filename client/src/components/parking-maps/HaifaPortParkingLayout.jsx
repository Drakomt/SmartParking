import ParkingMapLayout from "./ParkingMapLayout";

const IMAGE_SIZE = { width: 1291, height: 860 };
const RING_CENTER = { x: 51, y: 48.9 };
const STALL_WIDTH = 2.9;
const STALL_HEIGHT = 6.8;

const HAIFA_PORT_COORDINATES = (() => {
  const coordinates = [];
  const rings = [
    // The outer ring sits just inside the tree line.
    { count: 40, radius: { x: 26.5, y: 39 }, facing: "up" },
    // This ring follows the inner circle and opens in the opposite direction.
    { count: 20, radius: { x: 17.4, y: 26.1 }, facing: "down" },
  ];

  // The outer ring is listed first, so it receives the first 40 parking spots.
  for (const ring of rings) {
    for (let index = 0; index < ring.count; index += 1) {
      // The lower position is intentionally omitted: it is the entrance.
      if (ring.count === 40 && index === 20) continue;

      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / ring.count;
      const centerX = RING_CENTER.x + ring.radius.x * Math.cos(angle);
      const centerY = RING_CENTER.y + ring.radius.y * Math.sin(angle);
      // Rotation is calculated in image pixels, not percentage units, so the
      // stalls follow the circular road without becoming visually skewed.
      const radialAngle = Math.atan2(
        ring.radius.y * IMAGE_SIZE.height * Math.sin(angle),
        ring.radius.x * IMAGE_SIZE.width * Math.cos(angle),
      );

      coordinates.push({
        x: centerX - STALL_WIDTH / 2,
        y: centerY - STALL_HEIGHT / 2,
        width: STALL_WIDTH,
        height: STALL_HEIGHT,
        rotation: (radialAngle * 180) / Math.PI + 90,
        facing: ring.facing,
      });
    }
  }

  return coordinates;
})();

const HAIFA_PORT_MAP = {
  imageSrc: "/haifa-port-parking.jpg",
  imageAlt: "חניון הנמל בחיפה",
  aspectRatio: "1291 / 860",
  coordinates: HAIFA_PORT_COORDINATES,
  getDisplayedSpotNumber: (spot, index) => {
    const currentNumber = Number(spot.spotNumber);
    const levelPrefix = Math.floor(currentNumber / 100) * 100;
    return levelPrefix + index + 1;
  },
};

export default function HaifaPortParkingLayout(props) {
  return <ParkingMapLayout {...props} map={HAIFA_PORT_MAP} />;
}
