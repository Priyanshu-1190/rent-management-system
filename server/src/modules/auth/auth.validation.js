const validateRegister = (body) => {
  const { name, email, password, role } = body;

  if (!name || name.trim().length < 2) {
    return "Name must be at least 2 characters.";
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "A valid email is required.";
  }
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (!role || !["owner", "tenant"].includes(role)) {
    return "Role must be either owner or tenant.";
  }

  return null;
};

const validateLogin = (body) => {
  const { email, password } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "A valid email is required.";
  }
  if (!password) {
    return "Password is required.";
  }

  return null;
};

module.exports = { validateRegister, validateLogin };
