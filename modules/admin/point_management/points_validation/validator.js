const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const Points = this;



/**
 * Function for add point validation
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const addPointRules = (req, res) => {
	/** Check validation **/
	return [
		
		body('customer').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.please_select_customer', { value, location, path });
		}),
		body('point').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.please_enter_point', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.point_should_be_a_number', { value, location, path });
		})
		.isFloat({ gt: 0 }).withMessage((value, { req }) => {
			return req.__('admin.points.point_should_be_positive', { value });
		}),
		body('note').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.please_enter_note', { value, location, path });
		}),
		// body('transaction_reason').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		// 	return req.__('admin.points.please_select_transaction_reason', { value, location, path });
		// }),
	]
}


/**
 * Function for deduct point validation
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
const deductPointRules = (req, res) => {
	/** Check validation **/
	return [
		
		body('customer').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.please_select_customer', { value, location, path });
		}),
		body('point').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.please_enter_point', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.point_should_be_a_number', { value, location, path });
		})
		.isFloat({ gt: 0 }).withMessage((value, { req }) => {
			return req.__('admin.points.point_should_be_positive', { value });
		})
		.custom(async(value, { req }) => {
			if((await Points.checkWithUserPoint(value, req))){
				throw new Error();
			}
			return true;
		})
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.points.deduct_point_can_not_bigger_then_existing_points', { value, location, path });
		}),
		body('note').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.points.please_enter_note', { value, location, path });
		}),
		// body('transaction_reason').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
		// 	return req.__('admin.points.please_select_transaction_reason', { value, location, path });
		// }),
	]
}


Points.checkWithUserPoint = (value, req)=>{
	return new Promise(async(resolve)=>{
		let user_id = (req.body.customer) ? new ObjectId(req.body.customer) :'';

		const options = {
			collection: TABLE_USERS,
			conditions: [
				{ $match: { _id: user_id } },
				{
					$project: {
						total_points: { $ifNull: ["$total_points", DEACTIVE] },
					}
				}
			]
		};

		const [userDetails] = await Promise.all([
			DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {})
		]);

		let userPoints = Number(userDetails.total_points);
		let points = Number(value);
		if(points > userPoints){
			resolve(true)
		}else{
			resolve(false)
		}

	})
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
	addPointRules,
	deductPointRules,
  validate,
}
