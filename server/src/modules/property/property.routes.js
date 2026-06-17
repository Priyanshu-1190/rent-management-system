const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const {
  addProperty,
  editProperty,
  listProperties,
  removeProperty,
  updateLeaseAgreement,
  getPropertyImageFile,
  uploadPropertyImages,
  removePropertyImage
} = require("./property.controller");
const { createPropertySchema, leaseAgreementSchema } = require("./property.validation");

// Multer Setup
const uploadDir = path.join(__dirname, "../../../uploads/properties");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

router.post("/", protect, validate(createPropertySchema), addProperty);
router.get("/", protect, listProperties);
router.put("/:id", protect, validate(createPropertySchema), editProperty);
router.put("/:id/lease-agreement", protect, validate(leaseAgreementSchema), updateLeaseAgreement);
router.delete("/:id", protect, removeProperty);

// Property image routes
router.get("/images/:filename", getPropertyImageFile);
router.post("/:id/images", protect, upload.array("images", 10), uploadPropertyImages);
router.delete("/images/:imageId", protect, removePropertyImage);

module.exports = router;


