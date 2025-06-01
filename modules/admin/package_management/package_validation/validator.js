const { body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const Package = this;



/**
 * Function for add package Page validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addPackageValidationRules = (req, res) => {
	/** Check validation **/

	const validations = [];

	validations.push(
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.package_name').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_package_name', { value, location, path });
			}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.body').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_page_description', { value, location, path });
			}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.short_description').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_short_description', { value, location, path });
			}),

		body("package_image")
			.custom((value, { req }) => {
				if ((typeof value == typeof undefined) || (!value)) {
					if ((typeof req.files == typeof undefined) || (!req.files.package_image)) {
						throw new Error();
					}
				}
				return true;
			}).withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_package_image', { value, location, path });
			}),

		body("package_video")
			.custom((value, { req }) => {
				if ((typeof value == typeof undefined) || (!value)) {
					if ((typeof req.files == typeof undefined) || (!req.files.package_video)) {
						throw new Error();
					}
				}
				return true;
			}).withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_package_video', { value, location, path });
			}),

		body('car_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_car_type', { value, location, path });
			}),
		body('provider_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_provider_type', { value, location, path });
			}),
		body('duration').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_duration', { value, location, path });
			}),
		/*
		.custom((value, { req, location, path  }) => {
			return Package.findPackageByCartypeAndDuration(value,req).then(packageResponse => {
				if (packageResponse.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.package.package_is_already_exist_for_same_duration_and_car_type', { value, location, path }));
				}
			});
		}),*/

		body('price').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_price', { value, location, path });
			})
			.isFloat({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.package.invalid_price', { value, location, path });
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



		/*
		body('travel_time').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_travel_time', { value, location, path });
			}),
	
		*/
	)

	return validations;
}


/**
 * Function for find Package By Cartype And Duration
 *
 * @param value As email value
 * @param req As Request Data
 *
 * @return json
 */
Package.findPackageByCartypeAndDuration = (value, req) => {

	let packageId = (req.params.id) ? req.params.id : "";

	return new Promise(resolve => {

		let response = {};
		let conditions = {
			is_deleted: NOT_DELETED,
			duration: value,
			car_type: req.body.car_type
		};
		if (packageId != "") {
			conditions["_id"] = { $ne: new ObjectId(packageId) };
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_PACKAGES,
			fields: {},
		}
		DbClass.getFindOne(optionObj).then(packageResponse => {
			let responseResult = (packageResponse.result) ? packageResponse.result : "";
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
 * Function for edit package Page validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editPackageValidationRules = (req, res) => {
	/** Check validation **/

	const validations = [];

	validations.push(
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.package_name').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_package_name', { value, location, path });
			}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.body').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_page_description', { value, location, path });
			}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.short_description').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_short_description', { value, location, path });
			}),

		body('car_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_car_type', { value, location, path });
			}),
		body('provider_type').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_provider_type', { value, location, path });
			}),
		body('duration').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_duration', { value, location, path });
			}),
		/*
		.custom((value, { req, location, path  }) => {
			return Package.findPackageByCartypeAndDuration(value,req).then(packageResponse => {
				if (packageResponse.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.package.package_is_already_exist_for_same_duration_and_car_type', { value, location, path }));
				}
			});
		}),*/

		body('price').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_enter_price', { value, location, path });
			})
			.isFloat({ gt: 0 }).withMessage((value, { req, location, path }) => {
				return req.__('admin.package.invalid_price', { value, location, path });
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


		/*
		body('travel_time').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.package.please_select_travel_time', { value, location, path });
			}),
		*/
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
	editPackageValidationRules,
	addPackageValidationRules,
	validate,
}
