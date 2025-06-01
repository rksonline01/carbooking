const DbClass = require("../../../../classes/dbClass");

class CartModel {
	constructor() {
		this.db_cart_collection_name = TABLE_CART;
		this.db_cart_items_collection_name = TABLE_CART_ITEMS;
	}

	/**
	 * Function to save cart items data
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	saveCartItemsData = (req, res, optionObj) => {
		optionObj.collection = this.db_cart_items_collection_name
		return new Promise(resolve => {
			DbClass.saveInsertOne(req, res, optionObj).then(saveResult => {
				let responseStatus = (saveResult.status) ? saveResult.status : "";
				let responseResult = (saveResult.result) ? saveResult.result : {};
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
			})
		})
	}


	/**
	 * Function to update cart item data
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateCartItemData = (req, res, optionObj) => {
		optionObj.collection = this.db_cart_items_collection_name;
		return new Promise(resolve => {
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
			})
		})
	}


	/**
	 * Function to update cart data
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateCartData = (req, res, optionObj) => {
		optionObj.collection = this.db_cart_collection_name;
		return new Promise(resolve => {
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
			})
		})
	}


	/**
	 * Function to get cart list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getCartAggregateList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_cart_collection_name;

			DbClass.getAggregateResult(req, res, optionObj).then((cartResponse) => {
				let responseStatus = (cartResponse.status) ? cartResponse.status : "";
				let responseResult = (cartResponse.result) ? cartResponse.result : "";

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
	 * Function to delete cart item
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	deleteCartItem = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_cart_items_collection_name
			DbClass.deleteOneRecords(req, res, optionObj).then(deleteResult => {

				let responseStatus = (deleteResult.status) ? deleteResult.status : "";
				let responseResult = (deleteResult.result) ? deleteResult.result : {};

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
			})
		})
	}


	getCartItemDetails = (options) => {
		/** Get user Details **/
		const cartItem = db.collection(TABLE_CART_ITEMS);
		let conditions = (options.conditions) ? options.conditions : {};

		let fields = (options.fields) ? options.fields : {};
		return new Promise(async resolve => {
			try {
				let cartItemData = await cartItem.findOne(conditions, { projection: fields });

				if (cartItemData) {
					let response = {
						status: STATUS_SUCCESS,
						result: cartItemData,
						error: false,
						message: ""
					};
					return resolve(response);
				}
				else {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					};
					return resolve(response);
				}

			}
			catch (error) {
				let response = {
					status: STATUS_ERROR,
					result: {},
					error: true,
					message: "in error case"
				};
				return resolve(response);
			}
			//return "Hello";
		});
	}


	/**
	 * Function to get cart details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getCartDetails = (options) => {
		/** Get user Details **/
		options.collection = this.db_cart_collection_name;
		return new Promise(async resolve => {
			try {
				DbClass.getFindOne(options).then(cartResponse => {

					let responseStatus = (cartResponse.status) ? cartResponse.status : "";
					let responseResult = (cartResponse.result) ? cartResponse.result : "";
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
			} catch (error) {
				let response = {
					status: STATUS_ERROR,
					result: {},
					error: true,
					message: "in error case"
				};
				return resolve(response);
			}
		});
	}



	/**
	 * Function to get cart item list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getCartItemAggregateList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_cart_items_collection_name;

			DbClass.getAggregateResult(req, res, optionObj).then((cartResponse) => {
				let responseStatus = (cartResponse.status) ? cartResponse.status : "";
				let responseResult = (cartResponse.result) ? cartResponse.result : "";

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

}

module.exports = new CartModel;