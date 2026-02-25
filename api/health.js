const getPool = require("../lib/db");

module.exports = async (req, res) => {
  try {
    const db = getPool();
    await db.query("SELECT 1");

    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};