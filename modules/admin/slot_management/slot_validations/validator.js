const { validationResult } = require('express-validator');





/**
 * Function for validate error and return
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const validate = (req, res, next) => {
  if (isPost(req)) {
    const allErrors = validationResult(req)
    if (allErrors.isEmpty()) {
      return next()
    }
    let formErrors = parseValidation(allErrors.errors);

    return res.send({
      status: STATUS_ERROR,
      message: formErrors
    });
  } else {
    return next()
  }
}

module.exports = {
  validate,
}
