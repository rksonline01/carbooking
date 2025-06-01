const {body, validationResult} = require("express-validator");

/**
 * Function for edit Block validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editEmailTemplateRules = (req,res) =>{

return   [
	body('name').optional().trim()
        .notEmpty()
	    .withMessage((value, { req, location, path }) => {
            return req.__('admin.email_template.please_enter_name', { value, location, path });
        }),
	body('subject').optional().trim()
        .notEmpty()
	    .withMessage((value, { req, location, path }) => {
            return req.__('admin.email_template.please_enter_subject', { value, location, path });
        }),
	body('body').optional().trim()
        .notEmpty()
	    .withMessage((value, { req, location, path }) => {
		    return req.__('admin.email_template.please_enter_email_body', { value, location, path });
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
	editEmailTemplateRules,
    validate,
}
