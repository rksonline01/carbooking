const {body, validationResult } = require('express-validator');
//const User = this;
const Block = this;



/**
 * Function for add Block validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addNotificationValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
	body('user_type').notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.push_notification.please_select_user_type', { value, location, path });
      }),
	body('notification_descriptions.'+DEFAULT_LANGUAGE_MONGO_ID+'.message').notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.push_notification.please_enter_message', { value, location, path });
      }),

  ]
}


/**
 * Function for edit Block validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editNotificationValidationRules = (req,res) =>{

return   [
	body('page_name').notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.block.please_enter_page_name', { value, location, path });
      }),
	body('blocks_descriptions.'+DEFAULT_LANGUAGE_MONGO_ID+'.block_name').notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.block.please_enter_block_name', { value, location, path });
      }),
	body('blocks_descriptions.'+DEFAULT_LANGUAGE_MONGO_ID+'.description').notEmpty()
	  .withMessage((value, { req, location, path }) => {
		 
        return req.__('admin.block.please_enter_block_description', { value, location, path });
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
  editNotificationValidationRules,
  addNotificationValidationRules,
  validate,
}
