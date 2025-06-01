const {body, param,validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const State = this;

/**
 * Function for add Country  validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addStateValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body("country_id")
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				
				return req.__('admin.state.please_select_country_name', { value, location, path });
			}),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.state_name')  
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				
				return req.__('admin.states.please_enter_states_name', { value, location, path });
			})
            .custom((value,{req,location,path})=>{
                return State.findStateByName(value,req).then((master)=>{
                    if (master.status == STATUS_SUCCESS) {
                        return Promise.reject(req.__('admin.states.you_have_already_state', { value, location, path }));
                    }
                })
            }),
  	]
}

/**
 * Function for edit Country validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editStateValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body("country_id")
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				
				return req.__('admin.state.please_select_country_name', { value, location, path });
			}),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.state_name')
			.notEmpty()  
			.withMessage((value, { req, location, path }) => {
				
				return req.__('admin.states.please_enter_states_name', { value, location, path });
			}) 
            .custom((value,{req,location,path})=>{
                return State.findStateByName(value,req).then((master)=>{
                    if (master.status == STATUS_SUCCESS) {
                        return Promise.reject(req.__('admin.states.you_have_already_state', { value, location, path }));
                    }
                })
            }),
    ]
}

/**
 * Function for find country by
 *
 * @param value As email value
 * @param req As Request Data
 *
 * @return json
 */
State.findStateByName = (value,req)=>{

	let stateId = (req.params.id) ? req.params.id : "";
    let countryId = (req.body.country_id) ? req.body.country_id : '';
	return new Promise(resolve=>{
		let response = {};
		let conditions = {
            country_id : new ObjectId(countryId),
			state_name : { $regex: "^" + value + "$", $options: "i" } 
		};

		if(stateId !=""){
			conditions["_id"] = {$ne : new ObjectId(stateId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_STATES,
			fields: {},
		}
		DbClass.getFindOne(optionObj).then(nameRes => {
			let responseResult = (nameRes.result) ? nameRes.result : "";
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
    addStateValidationRules,
	editStateValidationRules,
  validate,
}
