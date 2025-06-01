const {body, validationResult } = require('express-validator');




/**
 * Function for add Faq validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addFaqValidationRules = (req,res) => {
	/** Check validation **/
	return   [
	 
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.question').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.faq.please_enter_faq_question', { value, location, path });
      }),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.answer').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.faq.please_enter_faq_answer', { value, location, path });
      }),
  ]
}


/**
 * Function for edit Block validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editFaqValidationRules = (req,res) =>{

	return   [
	 
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.question').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.faq.please_enter_faq_question', { value, location, path });
      }),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.answer').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.faq.please_enter_faq_answer', { value, location, path });
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
  editFaqValidationRules,
  addFaqValidationRules,
  validate,
}
