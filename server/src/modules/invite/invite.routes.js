const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const {
  sendInvite,
  listSentInvites,
  listReceivedInvites,
  acceptInvite,
  declineInvite,
  removeInvite,
  listAvailableUnits,
} = require("./invite.controller");

// Owner endpoints
router.post("/", protect, sendInvite);
router.get("/sent", protect, listSentInvites);
router.get("/available-units", protect, listAvailableUnits);
router.delete("/:id", protect, removeInvite);

// Tenant endpoints
router.get("/received", protect, listReceivedInvites);
router.post("/:id/accept", protect, acceptInvite);
router.post("/:id/decline", protect, declineInvite);

module.exports = router;
