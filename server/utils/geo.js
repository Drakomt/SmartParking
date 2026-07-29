const EARTH_RADIUS_KM = 6371.0088;

const toRadians = (degrees) => degrees * (Math.PI / 180);

export const calculateHaversineDistanceKm = (origin, destination) => {
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const originLatitude = toRadians(origin.lat);
  const destinationLatitude = toRadians(destination.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude)
    * Math.cos(destinationLatitude)
    * Math.sin(longitudeDelta / 2) ** 2;
  const normalizedHaversine = Math.min(1, Math.max(0, haversine));

  const angularDistance = 2 * Math.atan2(
    Math.sqrt(normalizedHaversine),
    Math.sqrt(1 - normalizedHaversine),
  );

  return EARTH_RADIUS_KM * angularDistance;
};
