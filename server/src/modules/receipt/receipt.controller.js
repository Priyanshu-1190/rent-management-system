const { getReceiptPayment, generateReceipt } = require("./receipt.service");

const downloadReceipt = async (req, res) => {
  try {
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ error: "Valid payment id is required" });
    }

    if (!["owner", "tenant"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const payment = await getReceiptPayment(paymentId, req.user);

    if (!payment) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    return generateReceipt(payment, res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { downloadReceipt };
