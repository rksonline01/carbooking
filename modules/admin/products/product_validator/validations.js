const { body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const Product = this;

/**
 * Function for add product validation
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const addProductValidationRules = (req, res) => {
	/** Check validation **/
	return [
		body('product_image').custom((value, { req }) => {
			if ((typeof req.files == typeof undefined) || (!req.files) || (typeof req.files.product_image == typeof undefined)) {
				throw new Error();
			}
			return true;
		}).withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_select_image', { value, location, path });
		}),

		body('parent_category').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_select_product_category', { value, location, path });
		}),

		body('product_sku').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_product_sku', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return Product.findProductBySku(value, req).then(productResponse => {
				if (productResponse.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.product.please_enter_unique_sku', { value, location, path }));
				}
			});
		}),

		body('price').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_price', { value, location, path });
		}).isFloat({ gt: 0 }).withMessage((value, { req, location, path }) => {
			return req.__('front.product.invalid_price', { value, location, path });
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
		body('quantity').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_quantity', { value, location, path });
		}).isNumeric({gt:0}).withMessage((value, { req, location, path }) => {
			return req.__('front.product.invalid_quantity', { value, location, path });
		}),
		*/

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.product_title').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_name', { value, location, path });
		}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.brief_description').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_brief_description', { value, location, path });
		}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.detailed_description').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_detailed_description', { value, location, path });
		}),

		body('images').custom((value, { req, location, path }) => {
			if (!req.params.id && (!req.files)) {
				return Promise.reject(req.__('admin.product.please_select_min_one_image', { value, location, path }));
			} else {
				return true;
			}
		})

	]
}


/**
 * Function for edit product validation
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const editProductValidationRules = (req, res) => {
	/** Check validation **/
	return [

		body('product_sku').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_product_sku', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return Product.findProductBySku(value, req).then(productResponse => {
				if (productResponse.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.product.please_enter_unique_sku', { value, location, path }));
				}
			});
		}),


		body('price').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_price', { value, location, path });
		}).isFloat({ gt: 0 }).withMessage((value, { req, location, path }) => {
			return req.__('front.product.invalid_price', { value, location, path });
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

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.product_title').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_name', { value, location, path });
		}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.brief_description').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_brief_description', { value, location, path });
		}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.detailed_description').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_detailed_description', { value, location, path });
		}),

	]
}


/**
 * Function for edit product validation
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const stockValidationRules = (req, res) => {
	/** Check validation **/
	return [

		body('quantity').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_enter_quantity', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('front.product.invalid_quantity', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return Product.findProductQuantity(value, req).then(productResponse => {
				if (productResponse.status == STATUS_SUCCESS) {

					let action_type = (req.body.action) ? req.body.action : 0;
					let quantity = (req.body.quantity) ? Number(req.body.quantity) : 0;
					let product_quantity = (productResponse.result.quantity) ? productResponse.result.quantity : 0;

					if (action_type == REMOVE && product_quantity < quantity) {

						return Promise.reject(req.__('admin.product.insufficient_stock_to_complete_the_requested_for_remove', { value, location, path }));
					}
				}
			});
		}),

		body('action').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.product.please_select_action', { value, location, path });
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

/**
 * Function for find Product By SKU
 *
 * @param value As email value
 * @param req As Request Data
 *
 * @return json
 */
Product.findProductBySku = (value, req) => {

	let productId = (req.params.id) ? req.params.id : "";

	return new Promise(resolve => {

		let response = {};
		let conditions = {
			is_deleted: NOT_DELETED,
			product_sku: req.body.product_sku
		};
		if (productId != "") {
			conditions["_id"] = { $ne: new ObjectId(productId) };
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_PRODUCTS,
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
 * Function for find Product By SKU
 *
 * @param value As email value
 * @param req As Request Data
 *
 * @return json
 */
Product.findProductQuantity = (value, req) => {



	let productId = (req.body.product_id) ? req.body.product_id : "";

	return new Promise(resolve => {
		let response = {};
		let conditions = {
			is_deleted: NOT_DELETED,
			_id: new ObjectId(productId)
		};
		let optionObj = {
			conditions: conditions,
			collection: TABLE_PRODUCTS,
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



module.exports = {
	addProductValidationRules,
	editProductValidationRules,
	stockValidationRules,
	validate,
}