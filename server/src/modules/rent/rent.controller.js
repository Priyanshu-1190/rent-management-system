const { generateMonthlyRent, addPayment } = require("./rent.service");

const createRent = async (req, res, next) => {
  try {
    const { tenancy_id, month, year } = req.body;
    const rent = await generateMonthlyRent(tenancy_id, month, year);
    return res.status(201).json(rent);
  } catch (error) {
    return next(error);
  }
};

const payRent = async (req, res, next) => {
  try {
    const result = await addPayment(req.params.id, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { createRent, payRent };
