/**
 * Light-weight Request Validation Strategy Helper
 */

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.isOperational = true;
    this.errors = errors;
  }
}

/**
 * Validates an object against field rule specifications.
 * @param {Object} data - Payload object (e.g. req.body)
 * @param {Object} rules - Rules definition object { fieldName: { required: boolean, type: string, min: number, max: number } }
 */
const validateSchema = (data = {}, rules = {}) => {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `${field} is required` });
      continue;
    }

    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        errors.push({ field, message: `${field} must be of type ${rule.type}` });
      }

      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors.push({ field, message: `${field} must be at least ${rule.min}` });
      }

      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors.push({ field, message: `${field} must be at most ${rule.max}` });
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return true;
};

module.exports = {
  ValidationError,
  validateSchema,
};
