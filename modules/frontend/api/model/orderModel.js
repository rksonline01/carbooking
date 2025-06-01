const DbClass = require('../../../../classes/dbClass')
class OrderModel {

    constructor() {
        this.db_collection_name = TABLE_ORDERS;
        this.db_incr_collection_name = TABLE_INCREMENTALS;
        this.db_order_item_collection = TABLE_ORDER_ITEMS;
        this.db_user_point_logs_collection = TABLE_USER_POINT_LOGS;
        this.db_order_sp_location_history_collection = TABLE_ORDER_SP_LOCATION_HISTORY;
        this.db_washing_commission_collection = TABLE_WASHING_COMMISSION_LOGS;
        this.db_collection_provider_earning = TABLE_PROVIDER_EARNING;
        
    }

    /**
     * Function to get order number
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    generateOrderNumber = (req, res) => {
        return new Promise(resolve => {
            let condition = {
                slug: 'order_number'
            }
            let updateData = {
                '$inc': { number: 1 }
            }
            let options = {
                conditions: condition,
                updateData: updateData,
                collection: this.db_incr_collection_name
            }
            DbClass.findAndupdateOneRecord(req, res, options).then(response => {
                let responseStatus = (response.status) ? response.status : "";
                let responseResult = (response.result) ? response.result : "";
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    var orderId = responseResult.prefix + responseResult.number;
                    let response = {
                        status: STATUS_SUCCESS,
                        result: orderId,
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
    saveOrder = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_collection_name;

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
     * Function to save order 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    saveInsertOrderItems = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_order_item_collection;
            DbClass.saveInsertMany(req, res, option).then(insertManyResponse => {
                let responseStatus = (insertManyResponse.status) ? insertManyResponse.status : "";
                let responseResult = (insertManyResponse.result) ? insertManyResponse.result : "";
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
    updateOrder = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_collection_name;

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
            option["collection"] = this.db_order_item_collection;

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
            option["collection"] = this.db_order_item_collection;
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
    * Function to update one order item
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    updateOneOrderItem = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_order_item_collection;

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
	
	/**
     * Function to get order list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
    */
    getAllOrderList = (option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_collection_name;

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
     * Function to get list of oreder items
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getOrderDetail = (option) => {
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
     * Function to get booking number
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    generateBookingNumber = (req, res) => {
        return new Promise(resolve => {
            let condition = {
                slug: 'booking_number'
            }
            let updateData = {
                '$inc': { number: 1 }
            }
            let options = {
                conditions: condition,
                updateData: updateData,
                collection: this.db_incr_collection_name
            }
            DbClass.findAndupdateOneRecord(req, res, options).then(response => {
                let responseStatus = (response.status) ? response.status : "";
                let responseResult = (response.result) ? response.result : "";
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    var orderId = responseResult.prefix + responseResult.number;
                    let response = {
                        status: STATUS_SUCCESS,
                        result: orderId,
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
     * Function to get order booking list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
    */
    getOrderBookingList = (option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_collection_name;

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
    * Function to get order booking 
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    getBookingAggregateList = (req, res, optionObj) => {
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
     * Function to get order booking count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getOrderBookingCount = (options) => {
        return new Promise(resolve => {
            options["collection"] = this.db_collection_name;
            DbClass.getCountDocuments(options).then(bookingResponse => {
                let responseStatus = (bookingResponse.status) ? bookingResponse.status : "";
                let responseResult = (bookingResponse.result) ? bookingResponse.result : "";

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
     * Function to save Points 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    savePointsLogs = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_user_point_logs_collection;

            DbClass.saveInsertOne(req, res, option).then(savePointsResponse => {
                let responseStatus = (savePointsResponse.status) ? savePointsResponse.status : "";
                let responseResult = (savePointsResponse.result) ? savePointsResponse.result : "";
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
     * Function to get Point logs list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getPointAggregateList = (req, res, optionObj) => {
        return new Promise(resolve => {
            optionObj["collection"] = this.db_user_point_logs_collection;

            DbClass.getAggregateResult(req, res, optionObj).then((pointsResponse) => {
                let responseStatus = (pointsResponse.status) ? pointsResponse.status : "";
                let responseResult = (pointsResponse.result) ? pointsResponse.result : "";

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
     * Function to get order count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getOrderItemCount = (options) => {
        return new Promise(resolve => {
            options["collection"] = this.db_order_item_collection;
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
     * Function to save order sp location 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
      saveOrderSPLocationOrder = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_order_sp_location_history_collection;

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
    * Function to get order booking 
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    getProviderEarningAggregateList = (req, res, optionObj) => {
        return new Promise(resolve => {
            optionObj["collection"] = this.db_collection_provider_earning;

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
    * Function to get order booking 
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    getWashingCommissionAggregateList = (req, res, optionObj) => {
        return new Promise(resolve => {
            optionObj["collection"] = this.db_washing_commission_collection;

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



}
module.exports = new OrderModel;