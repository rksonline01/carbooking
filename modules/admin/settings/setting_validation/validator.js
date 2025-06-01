const {body, validationResult } = require('express-validator');

const User = this;



/**
 * Function for edit Setting validation 
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const editSettingValidationRules = (req,res) =>{

	return   [

		body('title')
		  .notEmpty()
		  .withMessage((value, { req, location, path }) => {
			return req.__('admin.setting.please_enter_title', { value, location, path });
		  }),
		body('value')
		  .notEmpty()
		  .withMessage((value, { req, location, path }) => {
			return req.__('admin.setting.please_enter_value', { value, location, path });
		  }), 
		body('key_value')
		  .notEmpty()
		  .withMessage((value, { req, location, path }) => {
			return req.__('admin.setting.please_enter_key_value', { value, location, path });
		  }),   
		body('input_type')
		  .notEmpty()
		  .withMessage((value, { req, location, path }) => {
			return req.__('admin.setting.please_select_input_type', { value, location, path });
		  }),   
	
	  ]
	
	
}

/**
 * Function for add Setting validation 
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const addSettingValidationRules = (req,res) => {
	/** Check validation **/	
	return   [

	body('title')
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.setting.please_enter_title', { value, location, path });
      }),
	body('value')
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.setting.please_enter_value', { value, location, path });
      }), 
	body('key_value')
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.setting.please_enter_key_value', { value, location, path });
      }),   
	body('input_type')
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.setting.please_select_input_type', { value, location, path });
      }),   

  ]
}










/**
 * Function for validate error and return
 *
 * @param req As Request Data
 * @param res As Response Data
 *
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
	addSettingValidationRules,
	editSettingValidationRules,
    validate,
}
