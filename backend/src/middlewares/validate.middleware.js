const { validateSchema } = require('../utils/validator');

/**
 * Validation Middleware generator
 * @param {Object} schemas - Schema mapping e.g. { body: rules, query: rules, params: rules }
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        validateSchema(req.body, schemas.body);
      }
      if (schemas.query) {
        validateSchema(req.query, schemas.query);
      }
      if (schemas.params) {
        validateSchema(req.params, schemas.params);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
