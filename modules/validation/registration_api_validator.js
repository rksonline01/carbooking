const { body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

const User = this;


/**
 * Function for add user validation 
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const registrationValidate = (req, res) => {
	/** Check validation **/
	return [
		body('full_name').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_full_name', { value, location, path });
		}),
		body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_valid_email_address', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return User.findUserByEmail(value, req).then(user => {
				if (user.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.user.your_email_id_is_already_exist', { value, location, path }));
				}
			});
		}),
		body('mobile_code').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_select_mobile_code', { value, location, path });
		}),
		body('mobile_number').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_mobile_number', { value, location, path });
		}).isNumeric().matches(/^\d{10}$/).withMessage((value, { req, location, path }) => {
			return req.__('admin.user.invalid_mobile_number', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return User.findUserByMobile(value, req).then(user => {
				if (user.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.user.your_mobile_number_is_already_exist', { value, location, path }));
				}
			});
		}),
		body('terms_conditions').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_checked_terms_conditions', { value, location, path });
		}),
	]
}


/**
 * Function to validation for otp form
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const otpValidate = (req, res) => {
	/** Check validation **/
	return [
		body('validate_string').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_enter_validate_string', { value, location, path });
		}),
		body('otp').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.otp.please_enter_otp', { value, location, path });
		}),
		body('otp_type').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.otp.please_enter_otp_type', { value, location, path });
		}),
	]
}


/**
 * Function to validation for login form
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const loginValidate = (req, res) => {
	/** Check validation **/
	return [
		body('mobile_number').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_enter_mobile_number', { value, location, path });
		}),
		body('mobile_code').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_select_mobile_code', { value, location, path });
		}),
	]
}



/**
 * Function for add user validation 
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const updateProfileValidate = (req, res) => {
	/** Check validation **/
	return [
		body('full_name').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_full_name', { value, location, path });
		}),
		body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_valid_email_address', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return User.findUserByEmail(value, req).then(user => {
				if (user.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.user.your_email_id_is_already_exist', { value, location, path }));
				}
			});
		}),
		body('mobile_code').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_select_mobile_code', { value, location, path });
		}),
		body('mobile_number').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_mobile_number', { value, location, path });
		}).isNumeric().matches(/^\d{10}$/).withMessage((value, { req, location, path }) => {
			return req.__('admin.user.invalid_mobile_number', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return User.findUserByMobile(value, req).then(user => {
				if (user.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.user.your_mobile_number_is_already_exist', { value, location, path }));
				}
			});
		}),
		body('gender').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_select_gender', { value, location, path });
		}),
	]
}



/**
 * Function to validation for login form
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const addGiftValidate = (req, res) => {
	/** Check validation **/
	return [
		body('mobile_number').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_enter_mobile_number', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return User.findUserByMobileWithDialCode(value, req).then(user => {
				if (user.status == STATUS_ERROR) {
					return Promise.reject(req.__('admin.user.your_mobile_number_is_not_exist', { value, location, path }));
				}
			});
		}),

		body('mobile_code').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_select_mobile_code', { value, location, path });
		}),

		body('amount').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_enter_ammount', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.user.invalid_amount', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return User.findSenderAmount(value, req).then(user => {
				if (user.status == STATUS_SUCCESS) {
					let userWalletAmount = (user.result && user.result.wallet_amount) ? user.result.wallet_amount : 0;
					if (Number(userWalletAmount) < Number(value)) {
						return Promise.reject(req.__('admin.user.your_wallet_amount_is_less_then_amount', { value, location, path }));
					}
				}
			});
		}),
		body('message').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_enter_message', { value, location, path });
		}),
		body('gift_template_id').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.user.please_select_gift_template', { value, location, path });
		}),
	]
}

/**
 * Function for find user by mobile number
 *
 * @param value As mobile number
 * @param req As Request Data
 *
 * @return json
 */
User.findUserByMobile = (value, req) => {

	let slug = (req.body.slug) ? req.body.slug : "";

	return new Promise(resolve => {
		let mobileNumber = (req.body.mobile_number) ? req.body.mobile_number : "";
		let conditions = {
			is_deleted: NOT_DELETED,
			mobile: mobileNumber,
		};

		if (slug) {
			conditions["slug"] = { $ne: slug } 
		}

		let response = {};

		let optionObj = {
			conditions: conditions,
			collection: TABLE_USERS,
			fields: { _id: 1 },
		}
		DbClass.getFindOne(optionObj).then(mobileDataRes => {
			let responseResult = (mobileDataRes.result) ? mobileDataRes.result : "";
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
 * Function for find user by mobile number
 *
 * @param value As mobile number
 * @param req As Request Data
 *
 * @return json
 */
User.findUserByMobileWithDialCode = (value, req) => {

	let slug = (req.body.slug) ? req.body.slug : "";

	return new Promise(resolve => {
		let mobileNumber = (req.body.mobile_number) ? req.body.mobile_number : "";
		let mobileCode = (req.body.mobile_code) ? req.body.mobile_code : "";
		let conditions = {
			is_deleted: NOT_DELETED,
			mobile: mobileNumber,
			mobile_code: mobileCode,
		};

		if (slug) {
			conditions["slug"] = { $ne: slug }
		}

		let response = {};

		let optionObj = {
			conditions: conditions,
			collection: TABLE_USERS,
			fields: { _id: 1 },
		}
		DbClass.getFindOne(optionObj).then(mobileDataRes => {
			let responseResult = (mobileDataRes.result) ? mobileDataRes.result : "";
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
 * Function for find user by email 
 *
 * @param value As mobile number
 * @param req As Request Data
 *
 * @return json
 */
User.findUserByEmail = (value, req) => {

	let slug = (req.body.slug) ? req.body.slug : "";

	return new Promise(resolve => {
		let email = (req.body.email) ? req.body.email : "";
		let conditions = {
			'is_deleted': NOT_DELETED,
			'email': { $regex: "^" + email + "$", $options: "i" },
		};

		if (slug) {
			conditions["slug"] = { $ne: slug }
		}

		let response = {};

		let optionObj = {
			conditions: conditions,
			collection: TABLE_USERS,
			fields: { _id: 1 },
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
 * Function for find sender amount
 *
 * @param value As mobile number
 * @param req As Request Data
 *
 * @return json
 */
User.findSenderAmount = (value, req) => {
	let slug = (req.body.slug) ? req.body.slug : "";

	return new Promise(resolve => {
		let conditions = {
			slug: slug,
		};

		let response = {};

		let optionObj = {
			conditions: conditions,
			collection: TABLE_USERS
		}
		
		DbClass.getFindOne(optionObj).then(userRes => {
			let responseResult = (userRes.result) ? userRes.result : "";
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

module.exports = {
	registrationValidate,
	loginValidate,
	otpValidate,
	updateProfileValidate,
	addGiftValidate
}
