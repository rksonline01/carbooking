const { body, validationResult } = require('express-validator');



/**
 * Function for add user validation 
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const addUserAddressValidate = (req, res) => {
	/** Check validation **/
	return [
        body('full_name').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_full_name', { value, location, path });
		}),
        body('zip_code').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_zip_code', { value, location, path });
		}),
		body('longitude').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_longitude', { value, location, path });
		}),
        body('latitude').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_latitude', { value, location, path });
		}),
        body('address_line_1').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_address_line_1', { value, location, path });
		}),
        body('address_line_2').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('front.home.please_enter_address_line_2', { value, location, path });
		}),
	]
}


module.exports = {
	addUserAddressValidate,
	
}
