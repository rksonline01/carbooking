const {body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const Order = this;

/**
 * Function for add validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const changeStatusValidationRules = (req,res) => {
	/** Check validation **/
	return   [
		body('order_status')
			.notEmpty().withMessage((value, { req, location, path }) => {
				return req.__('vendor.orders.please_select_status', { value, location, path });
			}),

		body("reason")
			.custom((value, {req})=>{
				if(req.body.order_status == ORDER_CANCELLED){
					if((req.body.reason == "")|| (!req.body.reason)){
						throw new Error();
					}
				}
				return true;
			}).withMessage((value, { req, location, path }) => {
				return req.__('vendor.orders.please_enter_reason', { value, location, path });
			})
	]
};

/**
 * Function for add validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const acceptOrderValidationRules = (req,res) => {
	/** Check validation **/
	return   [
		body('service_provider_id').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.orders.please_select_service_provider_id', { value, location, path });
		}),
    
	]
};

/**
 * Function for add validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const cancelOrderValidationRules = (req,res) => {
	/** Check validation **/
	return   [
		body('cancel_reason').notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.orders.please_enter_cancel_reason', { value, location, path });
		}),
    
	]
};

/**
 * Function for add validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const refundProductAmountValidationRules = (req,res) => {
	/** Check validation **/
	return   [
		body('amount').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.wallet.please_enter_amount', { value, location, path });
		}).isNumeric().withMessage((value, { req, location, path }) => {
			return req.__('admin.wallet.amount_should_be_a_number', { value, location, path });
		})
		.isFloat({ gt: 0 }).withMessage((value, { req }) => {
			return req.__('admin.wallet.amount_should_be_positive', { value });
		})
		.custom(async(value, { req }) => {
			if(!(await Order.checkRefundAmount(value, req))){
				throw new Error();
			}
			return true;
		})
		.withMessage((value, { req, location, path }) => {
			return req.__('admin.wallet.amount_can_not_bigger_then_paid_amount', { value, location, path });
		}),
		
		body('note').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.wallet.please_enter_note', { value, location, path });
		})
	]
};

Order.checkRefundAmount = (value, req)=>{
	let productId = (req.params.product_id) ? new ObjectId(req.params.product_id) : "";

	return new Promise(async (resolve)=>{
		const options = {
			collection: TABLE_ORDER_ITEMS,
			conditions: [
				{ $match: { _id: productId } },
			]
		};
		const [itemDetails] = await Promise.all([
			DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {})
		]);

		let paidAmount = (itemDetails?.total_selling_amount ) ? Number(itemDetails?.total_selling_amount)  : '';
		let refundAmount = Number(value);

		if(0 < refundAmount && refundAmount < paidAmount ){
			resolve(true)
		}else{
			resolve(false)
		}
	})
}

/**
 * Function for add validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const changeDateTimeValidationRules = (req,res) => {
	/** Check validation **/
	return   [

		body('booking_date_time').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.order.please_select_booking_date_time', { value, location, path });
		}),
		body('booking_time').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.order.please_select_booking_time', { value, location, path });
		})
		/*
		body('booking_date_time').optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
			return req.__('admin.order.please_select_booking_date_time', { value, location, path });
		})
		.custom((value, { req }) => {
			const dateTime = value.trim();


			const [bookingDate, bookingTime] = dateTime.split(' ');

			// Create a Date object
			const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
			const currentDateTime = new Date();

			if (bookingDateTime.getTime() <= currentDateTime.getTime()) {
				throw new Error();
			}

			return true;
		}).withMessage((value, { req, location, path }) => {
			return req.__('admin.order.booking_date_must_be_future', { value, location, path });
		}),
		*/
	]
};




/**
 * Function for validate error and return
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const validate = (req, res, next) => {
	if(isPost(req)){
		const allErrors = validationResult(req);

		if (allErrors.isEmpty()) {
			return next()
		};

		let formErrors = parseValidation(allErrors.errors);

		return res.send({
			status : STATUS_ERROR,
			message : formErrors
		});
	}else{
		return next()
	};
};

module.exports = {
	changeStatusValidationRules,
	acceptOrderValidationRules,
	refundProductAmountValidationRules,
	changeDateTimeValidationRules,
	cancelOrderValidationRules,
	validate
}
