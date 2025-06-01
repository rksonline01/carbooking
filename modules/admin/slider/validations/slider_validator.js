const {body, validationResult } = require('express-validator');

const Splash = this;



/**
 * Function for add Splash validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addsliderValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.title').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
       	  return req.__('admin.slider.please_enter_title', { value, location, path });
        }),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.sub_title').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_sub_title', { value, location, path });
		}),
		body('order_number').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_order_number', { value, location, path });
		}).isInt({gt:0}).withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.invalid_order_number', { value, location, path });
		}),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.label_text').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_label_text', { value, location, path });
		}),
		body('image').custom((value, {req})=>{
			if((typeof req.files == typeof undefined)|| (!req.files) || (typeof req.files.image == typeof undefined)){
				throw new Error();
			}
			return true;
		}).withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_select_image', { value, location, path });
		}),
		body('redirect_link').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_redirect_link', { value, location, path });
		}),
		body('start_time').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_select_start_time', { value, location, path });
		}),
		body('end_time').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_select_end_time', { value, location, path });
		}),
		body('status').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_select_status', { value, location, path });
		}),
	]
}


/**
 * Function for edit Splash validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editsliderValidationRules = (req,res) =>{
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.title').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_title', { value, location, path });
	    }),
	    body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.sub_title').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		   return req.__('admin.slider.please_enter_sub_title', { value, location, path });
	    }),
		body('order_number').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_order_number', { value, location, path });
		}).isInt({ min: 1 }).withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.invalid_order_number', { value, location, path });
		}),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.label_text').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_label_text', { value, location, path });
		}),
		body('redirect_link').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_enter_redirect_link', { value, location, path });
		}),
		body('start_time').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_select_start_time', { value, location, path });
		}),
		body('end_time').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_select_end_time', { value, location, path });
		}),
		body('status').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.slider.please_select_status', { value, location, path });
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
  editsliderValidationRules,
  addsliderValidationRules,
  validate,
}
