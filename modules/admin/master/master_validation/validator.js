const {body, validationResult } = require('express-validator');
const DbClass = require("../../../../classes/dbClass")
const { ObjectId } = require('mongodb');
//const User = this;
const Master = this;



/**
 * Function for add Block validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addMasterValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.name').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.master.please_enter_name', { value, location, path });
			})
			.custom((value,{req,location,path})=>{
				return Master.findMasterByName(value,req).then((master)=>{
					if (master.status == STATUS_SUCCESS) {
						return Promise.reject(req.__('admin.master.entered_name_already_exists', { value, location, path }));
					}
				})
			}),
		body('master_image').if((value, { req }) => req.params.type == 'category')
			.custom((value, {req})=>{
				if( (typeof value == typeof undefined) || (!value)){
					if((typeof req.files == typeof undefined)|| (!req.files)){
						throw new Error();
					}
				}
				return true;
			}).withMessage((value, { req, location, path }) => {
				return req.__('admin.masters.please_select_image', { value, location, path });
			}),
  	]
}


/**
 * Function for edit Block validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editMasterValidationRules = (req,res) =>{
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.name').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.master.please_enter_name', { value, location, path });
			})
			.custom((value, { req, location, path  }) => {
				return Master.findMasterByName(value,req).then(master => {
					if (master.status == STATUS_SUCCESS) {
						return Promise.reject(req.__('admin.master.entered_name_already_exists', { value, location, path }));
					}
				});
			}),
		body('master_image').if((value, { req }) => req.params.type == 'category')
			.custom((value, {req})=>{
				if( req.body.old_image == "" ){
					if((typeof req.files == typeof undefined)|| (!req.files)){
						throw new Error();
					}
				}
				return true;
			}).withMessage((value, { req, location, path }) => {
				return req.__('admin.masters.please_select_image', { value, location, path });
			}),
  	]
}



/**
 * Function for find master by name
 *
 * @param value As name value
 * @param req As Request Data
 *
 * @return json
 */
Master.findMasterByName = (value,req)=>{

	let masterId 	= (req.params.id) ? req.params.id : "";
	let masterType	=	(req.params.type)	?	req.params.type	: "";
	
	return new Promise(resolve=>{
		
		let response = {};
		let conditions = { 
			dropdown_type	:	masterType,
			$or: [
				{ name: { $regex: "^" + value + "$", $options: "i" } },
			]
		 };
		if(masterId !="")
		{
			conditions["_id"] 		= 	{$ne : new ObjectId(masterId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_MASTERS,
			fields: {},
		}
		consoleLog(optionObj)
		DbClass.getFindOne(optionObj).then((masterResponse)=>{
			let responseResult = (masterResponse.result) ? masterResponse.result : {};
			consoleLog(responseResult);
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
  editMasterValidationRules,
  addMasterValidationRules,
  validate,
}
