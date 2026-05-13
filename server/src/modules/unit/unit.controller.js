const { getOwnerPropertyById, getUnitByNameAndPropertyId, createUnit, deleteOwnerUnit, getUnitsByProperty } = require("./unit.service");

const addUnit = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const propertyId = Number(req.params.propertyId);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ error: "Valid propertyId is required" });
    }

    const { name, rent_amount, due_day } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Unit name is required" });
    }

    if (rent_amount === undefined || Number(rent_amount) <= 0) {
      return res.status(400).json({ error: "Rent amount must be greater than 0" });
    }

    const safeDueDay = due_day != null ? Number(due_day) : 1;
    if (!Number.isInteger(safeDueDay) || safeDueDay < 1 || safeDueDay > 31) {
      return res.status(400).json({ error: "Due day must be between 1 and 31" });
    }

    const property = await getOwnerPropertyById(req.user.id, propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const existingUnit = await getUnitByNameAndPropertyId(propertyId, String(name).trim());
    if (existingUnit) {
      return res.status(400).json({ error: "Unit already exists" });
    }

    const unit = await createUnit(propertyId, {
      name: String(name).trim(),
      rent_amount: Number(rent_amount),
      due_day: safeDueDay,
    });

    return res.status(201).json(unit);
  } catch (error) {
    return next(error);
  }
};

const removeUnit = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const unitId = Number(req.params.unitId);
    if (!Number.isInteger(unitId) || unitId <= 0) {
      return res.status(400).json({ error: "Valid unit id is required" });
    }

    const deleted = await deleteOwnerUnit(req.user.id, unitId);
    if (!deleted) {
      return res.status(404).json({ error: "Unit not found" });
    }

    return res.json({ message: "Unit deleted" });
  } catch (error) {
    return next(error);
  }
};

const listUnits = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const propertyId = Number(req.params.propertyId);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ error: "Valid propertyId is required" });
    }

    const units = await getUnitsByProperty(req.user.id, propertyId);
    return res.json(units);
  } catch (error) {
    return next(error);
  }
};

module.exports = { addUnit, removeUnit, listUnits };
