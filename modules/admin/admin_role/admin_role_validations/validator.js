const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');

const AdminRoles = this;

const addRoleValidationRules = (req,res) => {
	/** Check validation **/
	
	return   [
        body('role').optional().trim()
            .notEmpty()
            .withMessage((value, { req, location, path }) => {
                return req.__('admin.admin_role.please_enter_role', { value, location, path });
            })
            .custom((value, { req, location, path  }) => {
                
                return AdminRoles.findRoleByName(value,req).then(role => {
                    if (role.status == STATUS_SUCCESS) {
                        return Promise.reject(req.__('admin.admin_role.role_already_exists', { value, location, path }));
                    }
                });
            }),
	  
	body('module_ids')
        .notEmpty()
        .withMessage((value, { req, location, path }) => {
            return req.__('admin.admin_role.please_select_modules', { value, location, path });
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
AdminRoles.findRoleByName = (value,req)=>{

	let roleId = (req.params.id) ? req.params.id : "";
	
	return new Promise(resolve=>{

		let response = {};
		let conditions = { 
			role_name: { $regex: "^" + value + "$", $options: "i" },
		 };
		if(roleId !="")
		{
			conditions["_id"] 		= 	{$ne : new ObjectId(roleId)};
		}

        let options = {
            conditions : conditions,
            fields : {},
            collection : TABLE_ADMIN_ROLE
        };

        DbClass.getFindOne(options).then(roleResponse=>{
            
			let roleData = roleResponse.result ? roleResponse.result : {};
			/** Send response **/
			if(Object.keys(roleData).length > 0){
				response = {
					status	: 	STATUS_SUCCESS,
					result:	roleData,
				};
				resolve(response);
				
			}else{
				response = {
					status	: 	STATUS_ERROR,
					result:	{},
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
  addRoleValidationRules,
  validate,
}
