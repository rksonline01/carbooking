const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const User = this;

const addPermissionValidationRules = (req,res) => {
	/** Check validation **/
	
	return   [
	body('first_name').optional().trim()
	  .notEmpty()
	   .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_permissions.please_enter_first_name', { value, location, path });
      }),
	body('last_name').optional().trim()
	  .notEmpty()
	   .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_permissions.please_enter_last_name', { value, location, path });
      }),
	body('user_role')
	  .notEmpty()
	   .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_permissions.please_select_user_role', { value, location, path });
      }),
	body('email').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.admin_permissions.please_enter_mail', { value, location, path });
		}).isEmail().withMessage((value, { req, location, path }) => {
			return req.__('admin.admin_permissions.please_enter_valid_email_address', { value, location, path });
		}).custom((value, { req, location, path  }) => {
			return User.findUserByEmail(value,req).then(user => {
				if (user.status == STATUS_SUCCESS) {
					return Promise.reject(req.__('admin.user.your_email_id_is_already_exist', { value, location, path }));
				}
			});
		}),
	body('password').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.admin_permissions.please_enter_password', { value, location, path });
		}).isLength({ min: PASSWORD_MIN_LENGTH }).withMessage((value, { req, location, path }) => {
			return req.__('admin.admin_permissions.password_length_should_be_minimum_6_character', { value, location, path });
		}).matches(PASSWORD_VALIDATION_REGULAR_EXPRESSION).withMessage((value, { req, location, path }) => {
			return req.__('admin.user.password_must_be_alphanumeric_and_must_contain_special_character', { value, location, path });
		}),
	body('confirm_password').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.user.please_enter_confirm_password', { value, location, path });
		}).isLength({ min: PASSWORD_MIN_LENGTH }).withMessage((value, { req, location, path }) => {
			return req.__('admin.user.password_length_should_be_minimum_6_character', { value, location, path });
		}).matches(PASSWORD_VALIDATION_REGULAR_EXPRESSION).withMessage((value, { req, location, path }) => {
			return req.__('admin.user.password_must_be_alphanumeric_and_must_contain_special_character', { value, location, path });
		}).custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error();
			}
			return true;
			}).withMessage((value, { req, location, path }) => {
			return req.__('admin.user.confirm_password_should_be_same_as_password', { value, location, path });
		}),

  ]
}

const editPermissionValidationRules = (req,res) => {
	/** Check validation **/
	return   [
		body('first_name').optional().trim()
		  .notEmpty()
		   .withMessage((value, { req, location, path }) => {
			return req.__('admin.admin_permissions.please_enter_first_name', { value, location, path });
			}),
		body('last_name').optional().trim()
		  .notEmpty()
		   .withMessage((value, { req, location, path }) => {
			return req.__('admin.admin_permissions.please_enter_last_name', { value, location, path });
		  }),
		body('user_role')
		  .notEmpty()
		   .withMessage((value, { req, location, path }) => {
			return req.__('admin.admin_permissions.please_select_user_role', { value, location, path });
		  }),

		body('password')
			.if((value, { req }) => req.body.password)
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.user.please_enter_password', { value, location, path });
			})

			.isLength({ min: PASSWORD_MIN_LENGTH })
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.user.password_length_should_be_minimum_6_character', { value, location, path });
			}).matches(PASSWORD_VALIDATION_REGULAR_EXPRESSION).withMessage((value, { req, location, path }) => {
				return req.__('admin.user.password_must_be_alphanumeric_and_must_contain_special_character', { value, location, path });
			}),


		body('confirm_password')
			.if((value, { req }) => req.body.password)
			.notEmpty()
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.user.please_enter_confirm_password', { value, location, path });
			})

			.isLength({ min: PASSWORD_MIN_LENGTH })
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.user.confirm_password_length_should_be_minimum_6_character', { value, location, path });
			})
			.matches(PASSWORD_VALIDATION_REGULAR_EXPRESSION).withMessage((value, { req, location, path }) => {
				return req.__('admin.user.password_must_be_alphanumeric_and_must_contain_special_character', { value, location, path });
			})
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error();
				}
				return true;
			})
			.withMessage((value, { req, location, path }) => {
				return req.__('admin.user.confirm_password_should_be_same_as_password', { value, location, path });
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
User.findUserByEmail = (value,req)=>{

	let userId = (req.params.id) ? req.params.id : "";

	return new Promise(resolve=>{
		const user = db.collection(TABLE_USERS);
		let response = {};
		let conditions = {
			is_deleted 	: 	NOT_DELETED,
			$or: [
				{ email: { $regex: "^" + value + "$", $options: "i" } },
				{ temp_email: { $regex: "^" + value + "$", $options: "i" } },
			]
		};
		if(userId !=""){
			conditions["_id"] = {$ne : new ObjectId(userId)};
		}
		let optionObj = {
			conditions: conditions,
			collection: TABLE_USERS,
			fields: {},
		}
		DbClass.getFindOne(optionObj).then(emailDataRes => {
			let responseResult = (emailDataRes.result) ? emailDataRes.result : "";
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
  addPermissionValidationRules,
  editPermissionValidationRules,
  validate,
}
