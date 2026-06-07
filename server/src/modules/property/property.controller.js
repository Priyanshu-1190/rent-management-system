const { createProperty, getOwnerProperties, deleteOwnerProperty, updateOwnerProperty, updatePropertyLeaseAgreement } = require("./property.service");

const addProperty = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, address } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Property name is required" });
    }

    const property = await createProperty(req.user.id, {
      name: String(name).trim(),
      address: address ? String(address).trim() : null,
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

module.exports = { addProperty, editProperty, listProperties, removeProperty, updateLeaseAgreement };

