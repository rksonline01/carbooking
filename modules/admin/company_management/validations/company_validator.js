const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const B2BDiscount = this;


/**
 * Function for add Splash validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addcompanyValidationRules = (req,res) => {
	/** Check validation **/	
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.company_name').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
       	  return req.__('admin.company.please_enter_company_name', { value, location, path });
        }),
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.contact_person_name').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_contact_person_name', { value, location, path });
		}),
		body('contact_person_email').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_contact_person_email', { value, location, path });
		}).isEmail().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_valid_email_address', { value, location, path });
		}),
		body('contact_person_phone').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_contact_person_phone', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.invalid_phone_number', { value, location, path });
		}),
		body('image').custom((value, {req})=>{
			if((typeof req.files == typeof undefined)|| (!req.files) || (typeof req.files.image == typeof undefined)){
				throw new Error();
			}
			return true;
		}).withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_select_image', { value, location, path });
		}),
		body('contract_file').custom((value, {req})=>{
			if((typeof req.files == typeof undefined)|| (!req.files) || (typeof req.files.contract_file == typeof undefined)){
				throw new Error();
			}
			return true;
		}).withMessage((value, {req, location, path})=>{
			return req.__("admin.company.please_select_contract_file",  { value, location, path })
		})
	]
}


/**
 * Function for edit Splash validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editcompanyValidationRules = (req,res) =>{
	return   [
		body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.company_name').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_company_name', { value, location, path });
	   }),
	   body('pages_descriptions.'+DEFAULT_LANGUAGE_CODE+'.contact_person_name').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		   return req.__('admin.company.please_enter_contact_person_name', { value, location, path });
	   }),
	   body('contact_person_email').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		   return req.__('admin.company.please_enter_contact_person_email', { value, location, path });
	   }),
	   body('contact_person_phone').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		   return req.__('admin.company.please_enter_contact_person_phone', { value, location, path });
	   }),
  	]
}



/**
 * Function for edit Splash validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addB2BDiscountValidationRules = (req,res) =>{
	return   [
		body("promo_code").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_promo_code', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return B2BDiscount.findCodeByName(value, req).then(user => {
			if (user.status == STATUS_SUCCESS) {
				return Promise.reject(req.__('admin.company.promo_code_already_exists', { value, location, path }));
			}
			});
		}),
		body("code_discount_type").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_select_code_discount_type', { value, location, path });
		}),
		body("code_valid_from").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_start_date', { value, location, path });
		}),
		body("code_valid_to").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_end_date', { value, location, path });
		}).custom((value, { req, location, path }) => {
		if (req.body.code_valid_to < req.body.code_valid_from) {
			throw new Error();
		}
		return true;
		}).withMessage((value, { req, location, path }) => {
			return req.__('admin.company.date_should_grater_than_start_date', { value, location, path });
		}),
		body("number_of_washes_per_user").trim().optional({checkFalsy: true}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.numeric_value_only', { value, location, path });
		}),
		body("number_of_user").trim().optional({checkFalsy: true}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.numeric_value_only', { value, location, path });
		}),
		 
		body("maximum_number_of_washes").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.enter_maximum_number_of_washes', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.numeric_value_only', { value, location, path });
		}),
		body("discount_amount")
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('Please enter discount amount.', { value, location, path });
			})
			.isNumeric()
			.withMessage((value, { req, location, path }) => {
				return req.__('Please enter valid value.', { value, location, path });
			})
		
		.if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_PERCENT)
			.custom(discountValue => {
				if ((discountValue > 0 && discountValue < 100)) {
					return true;
				}
			}).withMessage((value, { req, location, path }) => {
				return req.__('Please enter value grater than 0 and less than 100.', { value, location, path });
			}),		
			body("min_order_value").notEmpty().withMessage((value, { req, location, path }) => {
				return req.__('admin.company.please_enter_minimum_order_amount', { value, location, path });
			}).isNumeric().withMessage((value, { req, location, path }) => {
				return req.__('admin.company.numeric_value_only', { value, location, path });
			}),
  	]
}


/**
 * Function for edit Splash validation 
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editB2BDiscountValidationRules = (req,res) =>{
	return   [
		body("promo_code").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_promo_code', { value, location, path });
		}).custom((value, { req, location, path }) => {
			return B2BDiscount.findCodeByName(value, req).then(user => {
			if (user.status == STATUS_SUCCESS) {
				return Promise.reject(req.__('admin.company.promo_code_already_exists', { value, location, path }));
			}
			});
		}),
		body("code_discount_type").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_select_code_discount_type', { value, location, path });
		}),
		body("code_valid_from").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_start_date', { value, location, path });
		}),
		body("code_valid_to").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.please_enter_end_date', { value, location, path });
		}).custom((value, { req, location, path }) => {
		if (req.body.code_valid_to < req.body.code_valid_from) {
			throw new Error();
		}
		return true;
		}).withMessage((value, { req, location, path }) => {
			return req.__('admin.company.date_should_grater_than_start_date', { value, location, path });
		}),

		body("number_of_washes_per_user").trim().optional({checkFalsy: true}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.numeric_value_only', { value, location, path });
		}),
		body("number_of_user").trim().optional({checkFalsy: true}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.numeric_value_only', { value, location, path });
		}),
		body("maximum_number_of_washes").notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.enter_maximum_number_of_washes', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.company.numeric_value_only', { value, location, path });
		}),
		body("discount_amount")
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('Please enter discount amount.', { value, location, path });
			})
			.isNumeric()
			.withMessage((value, { req, location, path }) => {
				return req.__('Please enter valid value.', { value, location, path });
			})
		
		.if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_PERCENT)
			.custom(discountValue => {
				if ((discountValue > 0 && discountValue < 100)) {
					return true;
				}
			}).withMessage((value, { req, location, path }) => {
				return req.__('Please enter value grater than 0 and less than 100.', { value, location, path });
			}),

			body("min_order_value").notEmpty().withMessage((value, { req, location, path }) => {
				return req.__('admin.company.please_enter_minimum_order_amount', { value, location, path });
			}).isNumeric().withMessage((value, { req, location, path }) => {
				return req.__('admin.company.numeric_value_only', { value, location, path });
			}),
  	]
}


/**
 * Function for find color by name
 *
 * @param value As color name value
 * @param req As Request Data
 *
 * @return json
 */
B2BDiscount.findCodeByName = (value, req) => {

  let codeId = (req.params.id) ? req.params.id : "";
 
  return new Promise(resolve => {

	let response = {};
	let conditions = {
	  is_deleted: NOT_DELETED,
	  promo_code: new RegExp(["^", value, "$"].join(""), "i")
	};
	if (codeId != "") {
	  conditions["_id"] = { $ne: new ObjectId(codeId) };
	}
	let optionObj = {
	  conditions: conditions,
	  collection: TABLE_B2B_DISCOUNT,
	  fields: { _id: 1 },
	}
	DbClass.getFindOne(optionObj).then(promocodeData => {
	  let responseResult = (promocodeData.result) ? promocodeData.result : "";
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
  editcompanyValidationRules,
  addcompanyValidationRules,
  addB2BDiscountValidationRules,
  editB2BDiscountValidationRules,
  validate,
}
