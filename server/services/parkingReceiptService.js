import AppError from '../errors/AppError.js';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';
import parkingPaymentRepo from '../repositories/parkingPaymentRepo.js';
import { verifyCheckoutToken } from '../utils/checkoutCredentials.js';
import { formatMinorUnits } from '../utils/money.js';
import mailService from './mailService.js';

const toId = (value) => String(value?._id || value || '');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatPaymentDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Receipt is not currently available', {
      statusCode: 409,
      code: 'RECEIPT_NOT_AVAILABLE',
    });
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jerusalem',
  }).format(date);
};

const buildReceipt = ({ session, payment }) => {
  const licensePlate = String(session.carLicensePlate);
  const parkingLotName = String(session.parkingLot.name);
  const amount = `${formatMinorUnits(payment.amountMinor, payment.currency)} ${payment.currency}`;
  const paymentDate = formatPaymentDate(payment.paidAt || payment.fulfilledAt);

  const text = [
    'Smart Parking receipt',
    '',
    `License plate: ${licensePlate}`,
    `Amount paid: ${amount}`,
    `Payment date: ${paymentDate}`,
    `Parking lot: ${parkingLotName}`,
    '',
    'Thank you for using Smart Parking.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#17212b;">
    <div style="max-width:560px;margin:32px auto;padding:0 16px;">
      <div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 4px 18px rgba(0,0,0,0.08);">
        <h1 style="margin:0 0 8px;font-size:24px;">Payment receipt</h1>
        <p style="margin:0 0 28px;color:#52616b;">Thank you for using Smart Parking.</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:16px;">
          <tr><td style="padding:10px 0;color:#66737f;">License plate</td><td style="padding:10px 0;text-align:right;font-weight:600;">${escapeHtml(licensePlate)}</td></tr>
          <tr><td style="padding:10px 0;color:#66737f;">Amount paid</td><td style="padding:10px 0;text-align:right;font-weight:600;">${escapeHtml(amount)}</td></tr>
          <tr><td style="padding:10px 0;color:#66737f;">Payment date</td><td style="padding:10px 0;text-align:right;font-weight:600;">${escapeHtml(paymentDate)}</td></tr>
          <tr><td style="padding:10px 0;color:#66737f;">Parking lot</td><td style="padding:10px 0;text-align:right;font-weight:600;">${escapeHtml(parkingLotName)}</td></tr>
        </table>
      </div>
    </div>
  </body>
</html>`;

  return { text, html };
};

export const createParkingReceiptService = ({
  sessionRepo = parkingSessionRepo,
  paymentRepo = parkingPaymentRepo,
  mailer = mailService,
} = {}) => {
  const sendReceipt = async ({ email, checkoutId, checkoutToken }) => {
    const payment = await paymentRepo.findByCheckoutId(checkoutId);
    let session = await sessionRepo.findByCheckoutIdWithLot(checkoutId);
    const verifiedPaymentToken = payment && verifyCheckoutToken(checkoutToken, payment.checkoutTokenHash);
    if (!session && verifiedPaymentToken) {
      session = await sessionRepo.findSessionByIdWithLot(payment.parkingSession);
    }
    if (
      !session
      || !session.parkingLot
      || !(verifiedPaymentToken || verifyCheckoutToken(checkoutToken, session.checkoutTokenHash))
    ) {
      throw new AppError('Checkout is not available', {
        statusCode: 404,
        code: 'CHECKOUT_NOT_AVAILABLE',
      });
    }

    if (
      payment?.paypalPaymentStatus !== 'COMPLETED'
      || toId(payment.parkingSession) !== toId(session)
    ) {
      throw new AppError('Payment must be completed before requesting a receipt', {
        statusCode: 409,
        code: 'PAYMENT_NOT_COMPLETED',
      });
    }

    const receipt = buildReceipt({ session, payment });
    try {
      await mailer.sendMail({
        to: email,
        subject: 'Your Smart Parking payment receipt',
        ...receipt,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Receipt email delivery failed');
      throw new AppError('Unable to send receipt email', {
        statusCode: 502,
        code: 'RECEIPT_DELIVERY_FAILED',
        cause: error,
      });
    }

    return { message: 'Receipt sent successfully' };
  };

  return { sendReceipt };
};

export default createParkingReceiptService();
