const {body, validationResult } = require('express-validator');
const Block = this;


/**
 * Function for add Area Page validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const areaValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('area_name').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => { 
				return req.__('admin.area.please_select_area_name', { value, location, path });
			}),
			
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.body').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.cms.please_enter_page_description', { value, location, path });
			}),
		  
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.title').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.cms.please_enter_title', { value, location, path });
			}),
		body('country_id').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.locations.please_select_country', { value, location, path });
		}),
		body('state_id').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_select_state', { value, location, path });
		}),
		body('city_id').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.locations.please_select_city_id', { value, location, path });
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
  areaValidationRules,
  validate,
}
