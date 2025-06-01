const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class RatingModel{

    constructor(){
        this.db_collection_name 		=	TABLE_RATING;
		this.db_user_collection_name 	=	TABLE_USERS;
		this.db_product_collection_name	=	TABLE_PRODUCTS;
    }

    /**
	 * Function to get rating aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getRatingAggregateList = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getAggregateResult(req, res, optionObj).then(newsletterResponse => {

				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseCount = (newsletterResponse.result) ? newsletterResponse.result : "";
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
					result: responseCount,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}

	 /**
   * Function to get update one
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	 updateOneRating = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj.collection = this.db_collection_name;
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
     * 
     * to get detail of rating
     */
	ratingDetails = (req,res, option)=>{
        return new Promise(resolve=>{
  			 
			option.collection = this.db_collection_name;
             DbClass.getFindOne(option).then(companyResponse=>{
                let responseStatus = (companyResponse.status) ? companyResponse.status : "";
				let responseResult = (companyResponse.result) ? companyResponse.result : "";
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
		 * Function to get all rating list
		 *
		 * @param req As Request Data
		 * @param res As Response Data
		 *
		 * @return render/json
		 */
		getAllRatingList = (option) => {
			return new Promise(resolve => {
				option.collection = this.db_collection_name;
				DbClass.getFindAllWithoutLimit(option).then(response => {
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
		* Function to update user
		*
		* @param req As Request Data
		* @param res As Response Data
		*
		* @return render/json
		*/
		updateUser = (req, res, option) => {
			return new Promise(resolve => {
				option.collection = this.db_user_collection_name;
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
		* Function to update user
		*
		* @param req As Request Data
		* @param res As Response Data
		*
		* @return render/json
		*/
		updateProduct = (req, res, option) => {
			return new Promise(resolve => {
				option.collection = this.db_product_collection_name;
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

module.exports = new RatingModel;