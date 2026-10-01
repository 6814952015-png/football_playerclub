const Player = require("../models/player.model");
const catalog = require("../data/playerCatalog");

let seedPromise;

async function ensurePlayerCatalog() {
  const catalogIds = catalog.map((player) => player._id);
  const existingCount = await Player.countDocuments({ _id: { $in: catalogIds } });
  if (existingCount === catalog.length) return;
  if (seedPromise) return seedPromise;

  seedPromise = Player.bulkWrite(
    catalog.map((player) => ({
      updateOne: {
        filter: { _id: player._id },
        update: { $setOnInsert: player },
        upsert: true,
      },
    })),
    { ordered: false }
  )
    .catch((error) => {
      const onlyDuplicateKeys = error.code === 11000
        || (error.writeErrors?.length && error.writeErrors.every((writeError) => writeError.code === 11000));
      if (!onlyDuplicateKeys) throw error;
    })
    .finally(() => { seedPromise = null; });

  return seedPromise;
}

module.exports = ensurePlayerCatalog;
