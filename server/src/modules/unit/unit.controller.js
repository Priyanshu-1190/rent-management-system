const { getOwnerPropertyById, getUnitByNameAndPropertyId, createUnit, deleteOwnerUnit, getUnitsByProperty, updateOwnerUnit, getUnitById } = require("./unit.service");

const addUnit = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const propertyId = Number(req.params.propertyId);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ error: "Valid propertyId is required" });
    }

    const { name, rent_amount, due_day, late_fee_percentage, grace_period_days } = req.body;
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
      late_fee_percentage: Number(late_fee_percentage || 0),
      grace_period_days: Number(grace_period_days || 0),
    });

    return res.status(201).json(unit);
  } catch (error) {
    return next(error);
  }
};

const editUnit = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const unitId = Number(req.params.unitId);
    if (!Number.isInteger(unitId) || unitId <= 0) {
      return res.status(400).json({ error: "Valid unit id is required" });
    }

    const { name, rent_amount, due_day, late_fee_percentage, grace_period_days } = req.body;
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

    // Check if the unit exists and get its current property_id
    const unit = await getUnitById(unitId);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }
    const propertyId = unit.property_id;

    // Check for name conflict (if name is changed)
    const existingUnit = await getUnitByNameAndPropertyId(propertyId, String(name).trim());
    if (existingUnit && existingUnit.id !== unitId) {
      return res.status(400).json({ error: "Another unit with this name already exists" });
    }

    const updatedUnit = await updateOwnerUnit(req.user.id, unitId, {
      name: String(name).trim(),
      rent_amount: Number(rent_amount),
      due_day: safeDueDay,
      late_fee_percentage: Number(late_fee_percentage || 0),
      grace_period_days: Number(grace_period_days || 0),
    });

    if (!updatedUnit) {
      return res.status(404).json({ error: "Unit not found or unauthorized" });
    }

    return res.json(updatedUnit);
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

module.exports = { addUnit, editUnit, removeUnit, listUnits };
