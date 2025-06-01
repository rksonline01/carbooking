const {body, validationResult } = require('express-validator');



/**
 * Function for add push notification validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addNotificationValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
	body('notification_descriptions.'+DEFAULT_LANGUAGE_CODE+'.message').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.push_notification.please_enter_message', { value, location, path });
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
	if(isPost(req)){
		const allErrors = validationResult(req)
		if (allErrors.isEmpty()) {
			return next()
		}
		let formErrors = parseValidation(allErrors.errors);	
		
		return res.send({
			status : STATUS_ERROR,
			message : formErrors
		});
	}else{
		return next()
	}
}

module.exports = {
  addNotificationValidationRules,
  validate,
}