const {body, validationResult } = require('express-validator');

const contact = this;



/**
 * Function for contactReplyValidationRules
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const contactReplyValidationRules = (req,res) => {
	
			
	/** Check validation **/	
	return   [
		
    	body('reply_message').optional().trim().notEmpty()
	  	.withMessage((value, { req, location, path }) => {
        	return req.__('admin.contact.please_enter_message', { value, location, path });
    	})
				     					
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
  contactReplyValidationRules,
  validate,
}