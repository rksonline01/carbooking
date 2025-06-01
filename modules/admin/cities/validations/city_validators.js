const {body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const City = this;

/**
 * Function for add city validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addCityValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body("country_id").notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.state.please_select_country_name', { value, location, path });
			}),
		body('state_id').notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.state.please_enter_state_name', { value, location, path });
			}),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.city_name').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.state.please_enter_city_name', { value, location, path });
			})
			.custom((value,{req,location,path})=>{
				return City.findCityByName(value,req).then((master)=>{
					if (master.status == STATUS_SUCCESS) {
						return Promise.reject(req.__('admin.city.you_have_already_city', { value, location, path }));
					}
				})
			}),
  	]
}

const editCityValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body("country_id").notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.state.please_select_country_name', { value, location, path });
			}),
		body('state_id').notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.state.please_enter_state_name', { value, location, path });
			}),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.city_name').optional().trim().notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.state.please_enter_city_name', { value, location, path });
			})
			.custom((value,{req,location,path})=>{
				return City.findCityByName(value,req).then((master)=>{
					if (master.status == STATUS_SUCCESS) {
						return Promise.reject(req.__('admin.city.you_have_already_city', { value, location, path }));
					}
				})
			}),
  	]
}

/**
 * Function for find user by email
 *
 * @param value As email value
 * @param req As Request Data
 *
 * @return json
 */
City.findCityByName = (value,req)=>{

	let cityId = (req.params.id) ? req.params.id : "";
	let countryId = (req.body.country_id) ? req.body.country_id : '';
	let stateId = (req.body.state_id) ? req.body.state_id : '';

	return new Promise(resolve=>{
		let response = {};
		let conditions = {
			country_id : new ObjectId(countryId),
			state_id : new ObjectId(stateId),
			city_name : { $regex: "^" + value + "$", $options: "i" } 
		};
		if(cityId !=""){
			conditions["_id"] = {$ne : new ObjectId(cityId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_CITY,
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
    addCityValidationRules,
	editCityValidationRules,
  	validate,
}