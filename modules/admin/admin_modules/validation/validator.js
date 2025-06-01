const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const adminModules = this;

const addModuleValidationRules = (req,res) => {
	/** Check validation **/
	return   [
	body('page_descriptions.'+DEFAULT_LANGUAGE_CODE+'.title').optional().trim()
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_module.please_enter_title', { value, location, path });
      }),
	
	body('path').optional().trim()
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_module.please_enter_path', { value, location, path });
      }),
	body('group_path').optional().trim()
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_module.please_enter_group_path', { value, location, path });
      }),
	 
	body('order')
	  .notEmpty()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_module.please_enter_order', { value, location, path });
      })
	  .isNumeric()
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_module.order_must_be_numeric', { value, location, path });
      })
	  .isLength({ min: ACTIVE })
	  .withMessage((value, { req, location, path }) => {
        return req.__('admin.admin_module.order_must_be_greater_then_0', { value, location, path });
      })
	  /*
	 Uncomment if order need to make unique. 
	  .custom((value, { req, location, path  }) => {
		  return adminModules.findOrderExist(value,req).then(user => {
			  
			if (user.status == STATUS_SUCCESS) {
				return Promise.reject(req.__('admin.admin_module.order_is_already_exist', { value, location, path }));
			}
		  });
		}),*/
		
	

  ]
}
/*
adminModules.findOrderExist = (value,req)=>{
	return new Promise(resolve=>{
		let moduleId = (req.params.id)	? req.params.id	: "";
		
		const adminModules = db.collection(TABLE_ADMIN_MODULES);
		let response = {};
		let parentId	= (req.body.parent)		? ObjectId(req.body.parent)	: 0;
		
		let matchCondition = {
			parent_id	: parentId,
			order 		: parseInt(value),
		}
		if(moduleId && moduleId != ""){
			matchCondition['_id'] = {$ne :ObjectId(moduleId)}
		} 
		adminModules.findOne(matchCondition,{projection: {
			_id:1,order:1
		}},(err,result)=>{
			result = result ? result : {};
			 
			if(Object.keys(result).length > 0){
				response = {
					status	: 	STATUS_SUCCESS,
					result	:	result,
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
}*/



adminModules.findOrderExist = (value,req)=>{
	
	let moduleId = (req.params.id)	? req.params.id	: "";
	return new Promise(resolve=>{
	 
		let response = {};
		let parentId	= (req.body.parent)		? new ObjectId(req.body.parent)	: 0;
	 
		let matchCondition = {
			parent_id	: parentId,
			order 		: parseInt(value),
		}
		if(moduleId && moduleId != ""){
			matchCondition['_id'] = {$ne :	new ObjectId(moduleId)}
		} 
		let optionObj = {
			conditions 			:	matchCondition,
			collection 			:	TABLE_ADMIN_MODULES,
			fields 				: {_id:1},
		}
		DbClass.getFindOne(optionObj).then(textSettinRes=>{
			let responseResult = (textSettinRes.result) ? textSettinRes.result : "";
			if(Object.keys(responseResult).length > 0){
				response = {
					status	: 	STATUS_SUCCESS,
					result:	responseResult,
				};
				resolve(response);
				
			}else{
				response = {
					status	: 	STATUS_ERROR,
					result:	{},
				};
				resolve(response);
			}
			
		});
		 
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
  addModuleValidationRules,
  validate,
}