const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
Country = this;

/**
 * Function for add Country  validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addCountryValidationRules = (req,res) => {
	/** Check validation **/	
	return   [  
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.country_name').optional().trim()
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
		
        		return req.__('admin.country.please_enter_country_name', { value, location, path });
     	 	})
            .custom((value,{req,location,path})=>{
				return Country.findCountryByName(value,req).then((master)=>{
					if (master.status == STATUS_SUCCESS) {
						return Promise.reject(req.__('admin.country.your_country_is_already_exist', { value, location, path }));
					}
				})
			}),
		body('country_iso_code').optional().trim()
			.notEmpty()  
			.withMessage((value, { req, location, path }) => {
				
				return req.__('admin.country.please_enter_country_iso_code', { value, location, path });
			})
            .custom((value,{req,location,path})=>{
				return Country.findCountryByISOCode(value,req).then((master)=>{
					if (master.status == STATUS_SUCCESS) {
						return Promise.reject(req.__('admin.country.your_country_iso_code_is_already_exist', { value, location, path }));
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
const editCountryValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
	body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.country_name').optional().trim()
		.notEmpty()
		.withMessage((value, { req, location, path }) => {
		
		return req.__('admin.country.please_enter_country_name', { value, location, path });
		})
        .custom((value,{req,location,path})=>{
            return Country.findCountryByName(value,req).then((master)=>{
                if (master.status == STATUS_SUCCESS) {
                    return Promise.reject(req.__('admin.country.your_country_is_already_exist', { value, location, path }));
                }
            })
        }),
	body('country_code').isNumeric()
	.withMessage((value, { req, location, path }) => {
			
		return req.__('admin.country.please_enter_valid_country_code', { value, location, path });
	}),
	body('country_iso_code').optional().trim()
		.notEmpty()   
		.withMessage((value, { req, location, path }) => {
			
			return req.__('admin.country.please_enter_country_iso_code', { value, location, path });
		})
        .custom((value,{req,location,path})=>{
            return Country.findCountryByISOCode(value,req).then((master)=>{
                if (master.status == STATUS_SUCCESS) {
                    return Promise.reject(req.__('admin.country.your_country_iso_code_is_already_exist', { value, location, path }));
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
Country.findCountryByISOCode = (value,req)=>{

	let countryId = (req.params.id) ? req.params.id : "";

	return new Promise(resolve=>{
		let response = {};
		let conditions = {
			country_iso_code : { $regex: "^" + value + "$", $options: "i" } 
		};
		if(countryId !=""){
			conditions["_id"] = {$ne : new ObjectId(countryId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_COUNTRY,
			fields: {},
		}
		DbClass.getFindOne(optionObj).then(isoCodeRes => {
			let responseResult = (isoCodeRes.result) ? isoCodeRes.result : "";
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
 * Function for find user by email
 *
 * @param value As email value
 * @param req As Request Data
 *
 * @return json
 */
Country.findCountryByName = (value,req)=>{

	let countryId = (req.params.id) ? req.params.id : "";

	return new Promise(resolve=>{
		let response = {};
		let conditions = {
			country_name : { $regex: "^" + value + "$", $options: "i" } 
		};
		if(countryId !=""){
			conditions["_id"] = {$ne : new ObjectId(countryId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_COUNTRY,
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
    addCountryValidationRules,
	editCountryValidationRules,
  validate,
}
