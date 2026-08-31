export const normalizeLicensePlate = (value) => String(value ?? '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '');

export const isAuthorizedVehicle = (lot, licensePlate) => {
  const plate = normalizeLicensePlate(licensePlate);
  return plate !== '' && (lot?.authorizedVehicles || [])
    .some((authorizedPlate) => normalizeLicensePlate(authorizedPlate) === plate);
};
