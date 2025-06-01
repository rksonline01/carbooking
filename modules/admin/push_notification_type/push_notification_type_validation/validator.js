const {body, validationResult } = require('express-validator');
const DbClass = require("../../../../classes/dbClass")
const { ObjectId } = require('mongodb');
const PushNotificationType = this;
/**
 * Function for add notification type validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addEditPushNotificationTypeValidationRules = (req,res, next) => {

	/** Check validation **/
	return   [
		
	body('type').notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.notification_types.please_enter_type', { value, location, path });
      })
	  .custom((value,{req,location,path})=>{
		return PushNotificationType.findNotificationByType(value,req, res, next).then((type)=>{

			if (type.status == STATUS_SUCCESS) {
				return Promise.reject(req.__('admin.notification_type.entered_type_already_exists', { value, location, path }));
			}
		})
	}),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.title').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		return req.__('admin.notification_types.please_enter_title', { value, location, path });
   	}),
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.message').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		return req.__('admin.notification_types.please_enter_message', { value, location, path });
   	}),	
  ]
}

/**
 * Function for find notification by type
 *
 * @param value As name value
 * @param req As Request Data
 *
 * @return json
 */
PushNotificationType.findNotificationByType = (value,req, res, next)=>{

	let notificationId 	= (req.params.id) ? req.params.id : "";
	
	return new Promise(resolve=>{
		
		let response = {};
		let conditions = { 
			notification_type: parseInt(value)
		};
		if(notificationId !=""){
			conditions["_id"] 		= 	{$ne : new ObjectId(notificationId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_PUSH_NOTIFICATION_TYPES,
			fields: {},
		}
		DbClass.getFindOne(optionObj).then((masterResponse)=>{
			let responseResult = (masterResponse.result) ? masterResponse.result : {};
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
	addEditPushNotificationTypeValidationRules,
  	validate,
}
