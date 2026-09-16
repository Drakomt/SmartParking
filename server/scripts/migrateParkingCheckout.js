import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LEGACY_STATUSES = { PAYABLE: 'Payable', COMPLETED: 'paid', EXPIRED: 'Payable' };

// Explicit opt-in: by default this only reports changes, never touches records/indexes.
export const migrateParkingCheckout = async (db, { apply = false } = {}) => {
  const sessions = db.collection('parkingsessions');
  const payments = db.collection('parkingpayments');
  const counts = await sessions.aggregate([
    { $group: { _id: '$checkoutStatus', count: { $sum: 1 } } },
  ]).toArray();
  const indexes = await payments.indexes().catch((error) => {
    if (error.code === 26) return [];
    throw error;
  });
  const oldUniqueIndexes = indexes.filter((index) => (
    index.unique && Object.keys(index.key).length === 1 && index.key.parkingSession === 1
  ));
  const allowed = new Set([null, 'Payable', 'paid', 'pass', ...Object.keys(LEGACY_STATUSES)]);
  const unsupported = counts.filter(({ _id }) => !allowed.has(_id));
  const report = {
    apply,
    sessionStatuses: counts,
    replaceUniqueSessionIndexes: oldUniqueIndexes.map((index) => index.name),
    unsupportedStatuses: unsupported,
  };
  if (!apply) return report;
  if (unsupported.length) {
    throw new Error('Review/archive CANCELLED or unknown-status sessions before migration; they will not be silently reopened.');
  }

  // Preserve old receipt/capture credentials before a subsequent lookup rotates them.
  for await (const session of sessions.find({ checkoutId: { $type: 'string' }, checkoutTokenHash: { $type: 'string' } })) {
    await payments.updateMany(
      { parkingSession: session._id, checkoutId: session.checkoutId, checkoutTokenHash: { $exists: false } },
      { $set: { checkoutTokenHash: session.checkoutTokenHash } },
    );
  }
  for (const [from, to] of Object.entries(LEGACY_STATUSES)) {
    await sessions.updateMany({ checkoutStatus: from }, { $set: { checkoutStatus: to } });
  }
  await sessions.updateMany({ checkoutStatus: null }, { $set: { checkoutStatus: 'Payable' } });
  for await (const payment of payments.find({ paypalPaymentStatus: { $in: ['CREATED', 'APPROVED', 'PENDING', 'FAILED'] } })) {
    await sessions.updateOne(
      { _id: payment.parkingSession, checkoutId: payment.checkoutId },
      { $set: { checkoutPaymentStarted: true } },
    );
  }

  // Drop only the obsolete unique single-session index, never other payment indexes.
  for (const index of oldUniqueIndexes) await payments.dropIndex(index.name);
  if (!indexes.some((index) => (
    !index.unique && Object.keys(index.key).length === 1 && index.key.parkingSession === 1
  ))) {
    await payments.createIndex({ parkingSession: 1 });
  }
  return { ...report, completed: true };
};

const main = async () => {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  if (
    process.argv.slice(2).some((arg) => !['--apply', '--dry-run'].includes(arg))
    || (process.argv.includes('--apply') && process.argv.includes('--dry-run'))
  ) {
    throw new Error('Use --dry-run (default) or --apply');
  }
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  try {
    console.log(JSON.stringify(await migrateParkingCheckout(mongoose.connection.db, {
      apply: process.argv.includes('--apply'),
    }), null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.name === 'Error' ? error.message : 'Checkout migration failed; check database access/configuration.');
    process.exitCode = 1;
  });
}
