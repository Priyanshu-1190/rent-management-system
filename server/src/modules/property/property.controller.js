const { createProperty, getOwnerProperties, deleteOwnerProperty, updateOwnerProperty, updatePropertyLeaseAgreement } = require("./property.service");

const addProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, address, lease_agreement } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Property name is required" });
    }

    const property = await createProperty(req.user.id, {
      name: String(name).trim(),
      address: address ? String(address).trim() : null,
      lease_agreement: lease_agreement ? String(lease_agreement) : null,
    });

    return res.status(201).json(property);
  } catch (error) {
    return next(error);
  }
};

const editProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ error: "Valid property id is required" });
    }

    const { name, address } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Property name is required" });
    }

    const updated = await updateOwnerProperty(req.user.id, propertyId, {
      name: String(name).trim(),
      address: address ? String(address).trim() : null,
    });

    if (!updated) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

const listProperties = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const properties = await getOwnerProperties(req.user.id);
    return res.json(properties);
  } catch (error) {
    return next(error);
  }
};

const removeProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ error: "Valid property id is required" });
    }

    const deleted = await deleteOwnerProperty(req.user.id, propertyId);
    if (!deleted) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.json({ message: "Property deleted" });
  } catch (error) {
    return next(error);
  }
};

const updateLeaseAgreement = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ error: "Valid property id is required" });
    }

    const { lease_agreement } = req.body;
    const leaseText = lease_agreement !== undefined && lease_agreement !== null ? String(lease_agreement) : null;

    const updated = await updatePropertyLeaseAgreement(req.user.id, propertyId, leaseText);

    if (!updated) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

const path = require("path");
const fs = require("fs");
const { addPropertyImage, deletePropertyImage } = require("./property.service");

const uploadDir = path.join(__dirname, "../../../uploads/properties");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const getPropertyImageFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Image not found" });
    }
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
};

const uploadPropertyImages = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ error: "Valid property id is required" });
    }

    const ownerProperties = await getOwnerProperties(req.user.id);
    const hasProperty = ownerProperties.some((p) => p.id === propertyId);
    if (!hasProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const savedImages = [];
    for (const file of req.files) {
      const saved = await addPropertyImage(propertyId, file.filename);
      savedImages.push(saved);
    }

    return res.status(201).json(savedImages);
  } catch (error) {
    return next(error);
  }
};

const removePropertyImage = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const imageId = Number(req.params.imageId);
    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.status(400).json({ error: "Valid image id is required" });
    }

    const deletedImage = await deletePropertyImage(req.user.id, imageId);
    if (!deletedImage) {
      return res.status(404).json({ error: "Image not found or not owned by you" });
    }

    const filePath = path.join(uploadDir, deletedImage.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ message: "Image deleted", id: imageId });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addProperty,
  editProperty,
  listProperties,
  removeProperty,
  updateLeaseAgreement,
  getPropertyImageFile,
  uploadPropertyImages,
  removePropertyImage
};


