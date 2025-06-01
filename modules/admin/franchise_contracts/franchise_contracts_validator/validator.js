const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
 

/**
 * Function for add newsletter subscriber
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const franchiseContractsValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('contract_file').custom((value, {req})=>{
			if((typeof req.files == typeof undefined)|| (!req.files) || (typeof req.files.contract_file == typeof undefined)){
				throw new Error();
			}
			return true;
		}).withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_select_contract_file', { value, location, path });
		}),
	    body('franchise').optional().trim()
		.notEmpty()
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_select_franchise', { value, location, path });
		}),
		body('area_id').optional().trim()
		.notEmpty()
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_select_area', { value, location, path });
		}),
		body('start_date').optional().trim()
		.notEmpty()
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_select_start_date', { value, location, path });
		}),
		body('end_date').optional().trim()
		.notEmpty()
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_select_end_date', { value, location, path });
		}),

		body('purely_amount_commission_store').optional().trim()
		.notEmpty()
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_enter_purely_amount_commission_store', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.user.invalid_purely_amount_commission_store', { value, location, path });
		}),

		body('purely_amount_commission').optional().trim()
		.notEmpty()
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_enter_purely_amount_commission', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.user.invalid_purely_amount_commission', { value, location, path });
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
    franchiseContractsValidationRules,
    validate,
}