const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
NewsletterSubscriber = this;


/**
 * Function for add newsletter subscriber
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const newsletterSubscriberValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
	    body('email').optional().trim()
            .notEmpty()
            .withMessage((value, { req, location, path }) => {
                return req.__('admin.user.please_enter_email', { value, location, path });
            })
            .isEmail()
            .withMessage((value, { req, location, path }) => {
                return req.__('admin.subscriber.please_enter_valid_email_address', { value, location, path });
            })
            .custom((value, { req, location, path  }) => {
                return NewsletterSubscriber.findUserByEmail(value,req).then(user => {
                    if (user.status == STATUS_SUCCESS) {
                        return Promise.reject(req.__('admin.user.your_email_id_is_already_exist', { value, location, path }));
                    }
                });
            }),

  ]
}

/**
 * Function for find user by email
 *
 * @param value As email value
 * @param req As Request Data
 *
 * @return json
 */
NewsletterSubscriber.findUserByEmail = (value,req)=>{

	let userId = (req.params.id) ? req.params.id : "";

	return new Promise(resolve=>{
		let response = {};
		let conditions = {
            email: { $regex: "^" + value + "$", $options: "i" } ,
			
		};
		if(userId !=""){
			conditions["_id"] = {$ne : new ObjectId(userId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_NEWSLETTER_SUBSCRIBERS,
			fields: {},
		}
        DbClass.getFindOne(optionObj).then(emailDataRes => {
            let responseResult = (emailDataRes.result) ? emailDataRes.result : "";
			if (Object.keys(responseResult).length > 0) {
				response = {
					status: STATUS_SUCCESS,
					result: responseResult,
				};
				resolve(response);

			} else {
				response = {
					status: STATUS_ERROR,
					result: {},
				};
				resolve(response);
			}
		})

	});
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
    newsletterSubscriberValidationRules,
    validate,
}