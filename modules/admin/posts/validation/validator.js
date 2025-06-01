const {body, validationResult } = require('express-validator');

/**
 * Function for edit comment validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editReviewValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('product_name').notEmpty()
	  	.withMessage((value, { req, location, path }) => {
        return req.__('admin.ads.please_select_post', { value, location, path });
			}),
		body('review').notEmpty()
	  	.withMessage((value, { req, location, path }) => {
        return req.__('admin.ads.please_enter_review', { value, location, path });
      }),
    /*body('rating').notEmpty()
	  	.withMessage((value, { req, location, path }) => {
        return req.__('admin.ads.please_select_rating', { value, location, path });
      }),*/
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
  editReviewValidationRules,
  validate,
}
