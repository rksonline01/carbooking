const {body, validationResult } = require('express-validator');
//const User = this;
const Block = this;



/**
 * Function for add CMS Page validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addCMSValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.name').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_page_name', { value, location, path });
      }),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.body').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_page_description', { value, location, path });
      }),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.meta_title').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_meta_title', { value, location, path });
      }), 
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.meta_description').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_meta_description', { value, location, path });
      }), 
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.meta_keyword').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_meta_keyword', { value, location, path });
      }),  
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.title').optional().trim().notEmpty()
	.withMessage((value, { req, location, path }) => {
		
	return req.__('admin.cms.please_enter_title', { value, location, path });
	}),  

	// body("content_image")
	// .custom((value, {req})=>{
	// 	if( (typeof value == typeof undefined) || (!value)){
	// 		if((typeof req.files == typeof undefined)|| (!req.files.content_image)){
	// 			throw new Error();
	// 		}
	// 	}
	// 	return true;
	// }).withMessage((value, { req, location, path }) => {
	// 	return req.__('admin.cms.please_select_content_image', { value, location, path });
	// }),
	// body("banner_image")
	// .custom((value, {req})=>{
	// 	if( (typeof value == typeof undefined) || (!value)){
	// 		if((typeof req.files == typeof undefined)|| (!req.files.banner_image)){
	// 			throw new Error();
	// 		}
	// 	}
	// 	return true;
	// }).withMessage((value, { req, location, path }) => {
	// 	return req.__('admin.cms.please_select_banner_image', { value, location, path });
	// }) 
  ]
}


/**
 * Function for edit CMS Page validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editCMSValidationRules = (req,res) =>{

	return   [
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.name').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_page_name', { value, location, path });
      }),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.body').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_page_description', { value, location, path });
      }),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.meta_title').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_meta_title', { value, location, path });
      }), 
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.meta_description').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_meta_description', { value, location, path });
      }), 
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.meta_keyword').optional().trim().notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.cms.please_enter_meta_keyword', { value, location, path });
      }),  
	  body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.title').optional().trim().notEmpty()
	.withMessage((value, { req, location, path }) => {
		
	return req.__('admin.cms.please_enter_title', { value, location, path });
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
  editCMSValidationRules,
  addCMSValidationRules,
  validate,
}
