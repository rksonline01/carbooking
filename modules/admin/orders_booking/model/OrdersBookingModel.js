const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class OrderModel {

	constructor() {
		this.db_order_booking_collection = TABLE_ORDER_BOOKING;
	}


	/**
	* Function to get order booking 
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getBookingAggregateList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_order_booking_collection;

			DbClass.getAggregateResult(req, res, optionObj).then((orderResponse) => {
				let responseStatus = (orderResponse.status) ? orderResponse.status : "";
				let responseResult = (orderResponse.result) ? orderResponse.result : "";

				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					};
					return resolve(response);

				} else {
					let response = {
						status: STATUS_SUCCESS,
						result: responseResult,
						error: false,
						message: ""
					};
					return resolve(response);

				}

			});
		});

	}


	/**
	* Function to get order booking details
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getOrderBookingDetail = (option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_order_booking_collection;
			DbClass.getFindOne(option).then(orderResponse => {

				let responseStatus = (orderResponse.status) ? orderResponse.status : "";
				let responseResult = (orderResponse.result) ? orderResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					};
					return resolve(response);

				} else {
					let response = {
						status: STATUS_SUCCESS,
						result: responseResult,
						error: false,
						message: ""
					};
					return resolve(response);
				}
			})
		})
	}


	/**
	 * Function to get Order Booking list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getAllOrderBookingList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj.collection = this.db_order_booking_collection
			DbClass.getFindAll(optionObj).then(blockRes => {

				let responseStatus = (blockRes.status) ? blockRes.status : "";
				let responseResult = (blockRes.result) ? blockRes.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					};
					return resolve(response);

				} else {
					let response = {
						status: STATUS_SUCCESS,
						result: responseResult,
						error: false,
						message: ""
					};
					return resolve(response);

				}
			})
		});
	}

}
module.exports = new OrderModel();