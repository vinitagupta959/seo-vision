/**
 * Recursively deletes any keys starting with '$' to prevent MongoDB operator injection.
 * @param {object} obj - Object to sanitize
 */
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });
  }
};

// MongoDB Operator Injection Prevention
exports.mongoSanitize = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);
  next();
};

/**
 * Escapes characters to prevent cross-site scripting (XSS) vulnerabilities.
 * @param {string} val - String to clean
 */
const cleanString = (val) => {
  if (typeof val === 'string') {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  return val;
};

const sanitizeXss = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = cleanString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeXss(obj[key]);
      }
    });
  }
};

// XSS Protection
exports.xssClean = (req, res, next) => {
  sanitizeXss(req.body);
  next();
};
