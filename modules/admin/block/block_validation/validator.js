const {body, validationResult } = require('express-validator');
//const User = this;
const Block = this;



/**
 * Function for add Block validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addBlockValidationRules = (req,res) => {
	/** Check validation **/
	return   [
	body('page_name').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.block.please_enter_page_name', { value, location, path });
      }),
	body('blocks_descriptions.'+DEFAULT_LANGUAGE_CODE+'.block_name').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.block.please_enter_block_name', { value, location, path });
      }),
	body('blocks_descriptions.'+DEFAULT_LANGUAGE_CODE+'.description').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.block.please_enter_block_description', { value, location, path });
      }),
  ]
}


/**
 * Function for edit Block validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editBlockValidationRules = (req,res) =>{

return   [
	body('page_name').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.block.please_enter_page_name', { value, location, path });
      }),
	body('blocks_descriptions.'+DEFAULT_LANGUAGE_CODE+'.block_name').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.block.please_enter_block_name', { value, location, path });
      }),
	body('blocks_descriptions.'+DEFAULT_LANGUAGE_CODE+'.description').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {

        return req.__('admin.block.please_enter_block_description', { value, location, path });
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
		consoleLog("formErrors")
		consoleLog(formErrors)
		return res.send({
			status : STATUS_ERROR,
			message : formErrors
		});
	}else{
		return next()
	}
}

module.exports = {
  editBlockValidationRules,
  addBlockValidationRules,
  validate,
}
