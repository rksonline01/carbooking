const { body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
CustomerAddrs = this;

/**
 * Function for add newsletter subscriber
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editCustomerAddrsValidationRules = (req, res) => {
	/** Check validation **/
	return [
		body('full_name').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.customer_address.please_enter_full_name', { value, location, path });
			}),
		/* body('country_id').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.customer_address.please_select_country', { value, location, path });
			}),
		body('state_id').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.customer_address.please_select_state', { value, location, path });
			}),
		body('city_id').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.customer_address.please_select_city', { value, location, path });
			}), */
		body('address_line_1').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.customer_address.please_enter_address_line_1', { value, location, path });
			}),
		body('address_line_2').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.customer_address.please_enter_address_line_2', { value, location, path });
			}),
		
		body('marker').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.customer_address.please_mark_location', { value, location, path });
			})
			.custom((value, { req }) => {
				const latitude = parseFloat(req.body.latitude);
				const longitude = parseFloat(req.body.longitude);
				return CustomerAddrs.checkAddressInArea(latitude, longitude).then(isInArea => {
					if (!isInArea) {
						return Promise.reject(req.__('admin.customer_address.address_not_in_service_area'));
					}
				});
			}),
	];
}

/**
 * Function for checking the selected address is in the service providable area or not.
 *
 * @param latitude As latitude value
 * @param longitude As longitude value
 *
 * @return boolean
 */
CustomerAddrs.checkAddressInArea = (latitude, longitude) => {
	return new Promise(resolve => {
		let response = false;
		let optionObj = {
			collection: TABLE_AREAS,
			conditions: {is_deleted: NOT_DELETED},
			fields: { coordinates: 1 },
		}
		DbClass.getFindAll(optionObj).then(areaDataRes => {
			let areas = (areaDataRes.result) ? areaDataRes.result : [];
			for (let area of areas) {
				if (isPointInPolygon({ lat: latitude, lng: longitude }, area.coordinates)) {
					response = true;
					break;
				}
			}
			resolve(response);
		});
	});
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
	editCustomerAddrsValidationRules,
	validate,
}