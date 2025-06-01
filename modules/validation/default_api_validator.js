const {body, validationResult } = require('express-validator');

const User = this;


/**
 * Function for review validate
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const addReviewValidate = (req, res) => {
	/** Check validation **/
	return [
		body('rating').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_give_rating', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('front.user.rating_must_be_numeric_value', { value, location, path });
		}),
		body('review').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_enter_review', { value, location, path });
		})
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
		let formErrors = "";
		let apiType = (req.body.api_type) 	? req.body.api_type : ADMIN_API_TYPE;

		if((apiType)==MOBILE_API_TYPE || (apiType)==WEP_API_TYPE){

			if(apiType == MOBILE_API_TYPE){
				formErrors = parseValidationFrontApi(allErrors.errors);
			}
			else{
				formErrors = parseValidationFrontApi(allErrors.errors);
			}
			
			let finalResponse = {
				'data': {
					status: STATUS_ERROR,
					errors: formErrors,
					message: formErrors,
				}
			};
			returnApiResult(req, res,finalResponse);
		}else{
			formErrors = parseValidation(allErrors.errors);
		
			return res.send({
				status : STATUS_ERROR,
				message : formErrors
			});
		}
	}else{
		return next()
	}

}


/**
 * Function for validate error and return
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
authenticateAccess = (req, res, next) => {
	/** JWT Authentication **/
	let jwtOption = {
		token: (req.headers.authorization) ? req.headers.authorization : "",
		secretKey: JWT_CONFIG.secret,
		slug: (req.body.slug) ? req.body.slug : "",
	}

	JWTAuthentication(req, res, jwtOption).then(responseData => {
		
		if (responseData.status == STATUS_ERROR) {
			return res.send({
				status : STATUS_ERROR,
				message : {}
			});
		} else {
			return res.send({
				status : STATUS_SUCCESS,
				message : {}
			});
		}
	});	
}


module.exports = {
  validate,
  authenticateAccess,
  addReviewValidate
}
