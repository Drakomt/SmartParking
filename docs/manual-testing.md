# Manual verification checklist

Use test data and sandbox credentials. Do not run database reset routes, PayPal production payments, or the LoRa simulator against production unless the environment was explicitly prepared for that test.

## Responsive and accessibility checks

Check the homepage, all-lots map, parking-lot view, payment page, price list, settings, login, and manager dashboard at these representative viewport sizes:

- Mobile: 390 x 844
- Tablet: 768 x 1024
- Desktop: 1440 x 900

At each size, confirm that navigation remains usable, content does not require unnecessary horizontal scrolling, dialogs fit within the viewport, and parking maps support zoom and pan.

Repeat the main public pages with:

- Dark mode
- Large text mode
- Colorblind mode
- Ocean and Earth color themes

Confirm that text remains readable, status indicators remain distinguishable, keyboard focus is visible, and controls have meaningful accessible names.

## Driver workflow

1. Search for a city and open a parking lot.
2. Switch levels and confirm that live spot availability appears correctly.
3. Open Waze navigation and verify that the generated destination uses the selected lot coordinates.
4. Add and remove a favorite, then reload the page to confirm local persistence.
5. Look up a mock active license plate on the payment page.
6. Complete a PayPal Sandbox payment and confirm the server-calculated amount.
7. Verify that the 15-minute exit countdown appears after capture.
8. Request a receipt and verify delivery through the configured Google Apps Script deployment.

## Manager workflow

1. Sign in with a test manager account.
2. Confirm that only assigned cities and parking lots are visible.
3. Create and edit a test lot, level, and parking spot.
4. Change a spot status and verify that another browser receives the Socket.IO update.
5. Review active parked vehicles and confirm that license plates are visible only to authorized managers.
6. Add and remove an exempt vehicle, then verify that its active session changes between `pass` and payable behavior.
7. Delete only temporary test data and confirm the related spots, sessions, and payments are removed.

## External integrations

- PayPal: use Sandbox accounts and verify create, capture, pending, completed, and webhook flows.
- Email: send one receipt to a controlled address and confirm that payment success remains recorded even if delivery fails.
- LoRa: run the simulator against local development first and verify database persistence before Socket.IO broadcasts.
- Render: request `/health` and confirm `{ "status": "ok" }` without a database-dependent operation.
