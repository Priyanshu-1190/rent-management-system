const { generateMonthlyRent, addPayment } = require("./rent.service");

const createRent = async (req, res) => {
  const { tenancy_id, month, year } = req.body;
  const rent = await generateMonthlyRent(tenancy_id, month, year);
  res.json(rent);
};

const payRent = async (req, res) => {
  const result = await addPayment(req.params.id, req.body);
  res.json(result);
};

module.exports = { createRent, payRent };