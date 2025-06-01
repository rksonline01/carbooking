const {body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const Category = this;

/**
 * Function for add city validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addCategoryValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.category_name').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.category.please_enter_category_name', { value, location, path });
			}),
        body("category_image")
            .custom((value, {req})=>{
                if( (typeof value == typeof undefined) || (!value)){
                    if((typeof req.files == typeof undefined)|| (!req.files)){
                        throw new Error();
                    }
                }
                return true;
            }).withMessage((value, { req, location, path }) => {
                return req.__('admin.masters.please_select_image', { value, location, path });
            }),
  	]
}

const editCategoryValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.category_name').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.category.please_enter_category_name', { value, location, path });
			}),
        body("category_image")
            .custom((value, {req})=>{
                if( (req.body.old_image == "")){
                    if((typeof req.files == typeof undefined)|| (!req.files)){
                        throw new Error();
                    }
                }
                return true;
            }).withMessage((value, { req, location, path }) => {
                return req.__('admin.masters.please_select_image', { value, location, path });
            }),
  	]
}

const assignAttributeValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('attribute')
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.category.please_select_attribute', { value, location, path });
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
		const allErrors = validationResult(req);
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
    addCategoryValidationRules,
	editCategoryValidationRules,
	assignAttributeValidationRules,
  	validate,
}