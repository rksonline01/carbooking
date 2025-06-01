const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class OrderModel {

	constructor() {
		this.db_collection_name = TABLE_ORDERS;
		this.db_collection_order_items = TABLE_ORDER_ITEMS;
		this.db_washing_commission_collection = TABLE_WASHING_COMMISSION_LOGS;
        
	}


	/**
	 * Function to get order list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getOrderAggregateList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_collection_name;

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
	 * Function to get order items
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getOrderItemsAggregateList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_collection_order_items;

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
   * Function to update one order
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	updateOneOrder = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_collection_name

			DbClass.updateOneRecord(req, res, optionObj).then(updateResult => {

				let responseStatus = (updateResult.status) ? updateResult.status : "";
				let responseResult = (updateResult.result) ? updateResult.result : {};

				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
			});

		});
	}


	/**
	 * 
	 * to get order find one
	 */
	orderFindOne = (option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_collection_name;
			DbClass.getFindOne(option).then(orderResponse => {
				let responseStatus = (orderResponse.status) ? orderResponse.status : "";
				let responseResult = (orderResponse.result) ? orderResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: false,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		})
	}


	/**
	* 
	* to get order find all
	*/
	orderFindAllList = (option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_collection_name;
			DbClass.getFindAllWithoutLimit(option).then(orderResponse => {
				let responseStatus = (orderResponse.status) ? orderResponse.status : "";
				let responseResult = (orderResponse.result) ? orderResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: false,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}



	/**
	 * Function to get list of oreder items
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getOrderItemList = (option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_collection_order_items;

			DbClass.getFindAll(option).then(orderItemResponse => {
				let responseStatus = (orderItemResponse.status) ? orderItemResponse.status : "";
				let responseResult = (orderItemResponse.result) ? orderItemResponse.result : "";
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
	 * Function to update order items
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateOrderItems = (req, res, option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_collection_order_items;
			DbClass.updateManyRecords(req, res, option).then(updateManyResponse => {
				let responseStatus = (updateManyResponse.status) ? updateManyResponse.status : "";
				let responseResult = (updateManyResponse.result) ? updateManyResponse.result : "";
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
	* Function to update order booking
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	updateOrderBooking = (req, res, option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_collection_name;

			DbClass.findAndupdateOneRecord(req, res, option).then(updateOrderResponse => {
				let responseStatus = (updateOrderResponse.status) ? updateOrderResponse.status : "";
				let responseResult = (updateOrderResponse.result) ? updateOrderResponse.result : "";
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
	 * Function to get order booking details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getOrderBookingDetail = (option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_collection_name;
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
	 * Function to get order count
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getOrderItemCount = (options) => {
		return new Promise(resolve => {
			options["collection"] = this.db_collection_order_items;
			DbClass.getCountDocuments(options).then(orderResponse => {
				let responseStatus = (orderResponse.status) ? orderResponse.status : "";
				let responseResult = (orderResponse.result) ? orderResponse.result : 0;

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
	 * Function to get order count
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getOrderCount = (options) => {
		 
		return new Promise(resolve => {
			options["collection"] = this.db_collection_name;
			DbClass.getCountDocuments(options).then(orderResponse => {
				let responseStatus = (orderResponse.status) ? orderResponse.status : "";
				let responseResult = (orderResponse.result) ? orderResponse.result : 0;

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
	 * Function to get list of oreder items
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getWashingCommissionDetail = (option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_washing_commission_collection;
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




	saveWashingCommission = (req, res, option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_washing_commission_collection;

			DbClass.saveInsertOne(req, res, option).then(saveOrderResponse => {
				let responseStatus = (saveOrderResponse.status) ? saveOrderResponse.status : "";
				let responseResult = (saveOrderResponse.result) ? saveOrderResponse.result : "";
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
		* Function to save order 
		*
		* @param req As Request Data
		* @param res As Response Data
		*
		* @return render/json
		*/
		 updateWashingCommission = (req, res, option) => {
			return new Promise(resolve => {
				option["collection"] = this.db_washing_commission_collection;
	
				DbClass.updateOneRecord(req, res, option).then(updateOrderResponse => {
					let responseStatus = (updateOrderResponse.status) ? updateOrderResponse.status : "";
					let responseResult = (updateOrderResponse.result) ? updateOrderResponse.result : "";
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
	
	
			
}
module.exports = new OrderModel();