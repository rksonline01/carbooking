const { body, validationResult } = require('express-validator');

/**
 * Function for add leave
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addLeaveManagementValidationRules = (req, res) => {
  /** Check validation **/
  return [

    body("date").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('admin.leave_management.please_enter_date', { value, location, path });
    }),

    body("leave_reason").optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('admin.leave_management.please_enter_leave_reason', { value, location, path });
    }),
  ]
}


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
  addLeaveManagementValidationRules,
  validate,
}
