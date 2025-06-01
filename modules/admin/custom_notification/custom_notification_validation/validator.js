const { body, validationResult } = require('express-validator');



/**
 * Function for add push notification validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addNotificationValidationRules = (req, res) => {
	/** Check validation **/
	return [
		body("image")
			.custom((value, { req }) => {
				if ((typeof value == typeof undefined) || (!value)) {
					if ((typeof req.files == typeof undefined) || (!req.files.image)) {
						throw new Error();
					}
				}
				return true;
			}).withMessage((value, { req, location, path }) => {
				return req.__('admin.push_notification.please_select_image', { value, location, path });
			}),

		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.title').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.push_notification.please_enter_title', { value, location, path });
			}),
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.message').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {

				return req.__('admin.push_notification.please_enter_message', { value, location, path });
			}),
		body('pages_descriptions.' + DEFAULT_LANGUAGE_CODE + '.redirect_link').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.push_notification.please_enter_redirect_link', { value, location, path });
			}),

		body('schedule_type').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.push_notification.please_select_schedule_type', { value, location, path });
		}),

		body('notification_type').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.push_notification.please_select_notification_type', { value, location, path });
		}),
		body('start_time').custom((value, { req, location, path }) => {



			if (req.body.schedule_type === SCHEDULE_TYPE_IMMEDIATELY && !value) {
				return true;
			}
			
			if (!value) {
				throw new Error(req.__('admin.user.please_select_date', { value, location, path }));
			}

			return true;
		}),
		body('status').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.push_notification.please_select_status', { value, location, path });
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

module.exports = {
	addNotificationValidationRules,
	validate,
}