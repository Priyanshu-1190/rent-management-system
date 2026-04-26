const { createProperty, getOwnerProperties } = require("./property.service");

const addProperty = async (req, res) => {
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
    return res.status(500).json({ error: error.message });
  }
};

const listProperties = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const properties = await getOwnerProperties(req.user.id);
    return res.json(properties);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { addProperty, listProperties };
