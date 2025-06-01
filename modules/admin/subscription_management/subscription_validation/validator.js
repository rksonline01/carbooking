const { body, validationResult } = require('express-validator');
//const User = this;
const Block = this;



/**
 * Function for add Subscription Page validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addSubscriptionValidationRules = (req, res) => {
	/** Check validation **/

	const validations = [];

	validations.push(
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.subscription_name').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_subscription_name', { value, location, path });
			}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.body').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_subscription_description', { value, location, path });
			}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.short_description').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_short_description', { value, location, path });
			}),

		body("subscription_image")
			.custom((value, { req }) => {
				if ((typeof value == typeof undefined) || (!value)) {
					if ((typeof req.files == typeof undefined) || (!req.files.subscription_image)) {
						throw new Error();
					}
				}
				return true;
			}).withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_select_subscription_image', { value, location, path });
			}),	

		body('car_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_select_car_type', { value, location, path });
			}),
		body('provider_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_select_provider_type', { value, location, path });
			}),

		

		body('price').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_price', { value, location, path });
			})
			.isFloat({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.invalid_price', { value, location, path });
			}),

		body('total_service').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_total_service', { value, location, path });
			})
			.isInt({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.invalid_total_service', { value, location, path });
			}),

		body('validity_period').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_validity_period', { value, location, path });
			})
			.isInt({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.invalid_validity_period', { value, location, path });
			}),

			/*
		body('offer_price').optional({ checkFalsy: true }).trim().isFloat({ gt: 0 }).withMessage((value, { req, location, path }) => {
			return req.__('admin.package.invalid_price', { value, location, path });
		}).custom((value, { req, location, path }) => {

			if (req.body.offer_type === PERCENT_OF_AMOUNT) {
				if (value >= 0 && value < 100) {
					return true;
				}
			} else if (req.body.offer_type === FLAT_AMOUNT) {
				return true;
			}
		}).withMessage((value, { req, location, path }) => {
			return req.__('admin.system.please_value_0_99', { value, location, path });
		}),
		*/

		body('offer_price')
		.custom((value, { req, location, path }) => {
			const offerType = req.body.offer_type;

			// Case 1: offerType exists but offer_price is empty
			if (offerType && (value === undefined || value === null || value === '')) {
				throw new Error(req.__('admin.package.required_price', { location, path }));
			}

			// If value is empty and offerType isn't given, skip validation
			if (!value) return true;

			// Convert value to float for comparison
			const floatValue = parseFloat(value);
			if (isNaN(floatValue) || floatValue <= 0) {
				throw new Error(req.__('admin.package.invalid_price', { value, location, path }));
			}

			// Case 2: If type is percent, value must be between 0 and 100
			if (offerType === PERCENT_OF_AMOUNT) {
				if (floatValue >= 0 && floatValue < 100) return true;
				throw new Error(req.__('admin.system.please_value_0_99', { value, location, path }));
			}

			// Case 3: If type is flat amount
			if (offerType === FLAT_AMOUNT) {
				return true;
			}

			// Fallback: Unknown offerType
			throw new Error(req.__('admin.system.select_offer_type_before_insert_offer_price', { value, location, path }));
		}),

		
	)

	return validations;
}



/**
 * Function for edit Subscription Page validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editSubscriptionValidationRules = (req, res) => {
	/** Check validation **/

	const validations = [];

	validations.push(
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.subscription_name').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {

				return req.__('admin.subscription.please_enter_subscription_name', { value, location, path });
			}),
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.body').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {

				return req.__('admin.subscription.please_enter_subscription_description', { value, location, path });
			}),
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.short_description').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {

				return req.__('admin.subscription.please_enter_short_description', { value, location, path });
			}),

		body('car_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_select_car_type', { value, location, path });
			}),
		body('provider_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_select_provider_type', { value, location, path });
			}),
		
		body('price').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_price', { value, location, path });
			}).isFloat({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.invalid_price', { value, location, path });
			}),
		body('total_service').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_total_service', { value, location, path });
			}).isInt({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.invalid_total_service', { value, location, path });
			}),
		body('validity_period').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.please_enter_validity_period', { value, location, path });
			}).isInt({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.subscription.invalid_validity_period', { value, location, path });
			}),
			

		body('offer_price')
		.custom((value, { req, location, path }) => {
			const offerType = req.body.offer_type;

			// Case 1: offerType exists but offer_price is empty
			if (offerType && (value === undefined || value === null || value === '')) {
				throw new Error(req.__('admin.package.required_price', { location, path }));
			}

			// If value is empty and offerType isn't given, skip validation
			if (!value) return true;

			// Convert value to float for comparison
			const floatValue = parseFloat(value);
			if (isNaN(floatValue) || floatValue <= 0) {
				throw new Error(req.__('admin.package.invalid_price', { value, location, path }));
			}

			// Case 2: If type is percent, value must be between 0 and 100
			if (offerType === PERCENT_OF_AMOUNT) {
				if (floatValue >= 0 && floatValue < 100) return true;
				throw new Error(req.__('admin.system.please_value_0_99', { value, location, path }));
			}

			// Case 3: If type is flat amount
			if (offerType === FLAT_AMOUNT) {
				return true;
			}

			// Fallback: Unknown offerType
			throw new Error(req.__('admin.system.select_offer_type_before_insert_offer_price', { value, location, path }));
		}),

	
	)

	return validations;
}





/**
 * Function for validate error and return
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const validate = (req, res, next) => {
	if (isPost(req)) {
		const allErrors = validationResult(req)
		if (allErrors.isEmpty()) {
			return next()
		}
		let formErrors = parseValidation(allErrors.errors);

		return res.send({
			status: STATUS_ERROR,
			message: formErrors
		});
	} else {
		return next()
	}
}

module.exports = {
	editSubscriptionValidationRules,
	addSubscriptionValidationRules,
	validate,
}
