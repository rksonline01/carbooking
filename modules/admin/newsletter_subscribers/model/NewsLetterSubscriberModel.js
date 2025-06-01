const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class NewsLetterSubscriberModel{

    constructor(){
        this.db_collection_name = TABLE_NEWSLETTER_SUBSCRIBERS;
    }

    /**
	 * Function to get newsletter subscriber aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getNewsletterSubscriberAggregateList = (req, res, optionObj) => {
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
   * Function to save newsletter subscriber
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	saveNewletterSubscriber = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.saveInsertOne(req, res, optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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
   * Function to save newsletter subscriber
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	getNewletterSubscriberDetail = (optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.getFindOne(optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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
	 * Function to update newsletter subscriber
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateNewletterSubscriber = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.updateOneRecord(req, res, optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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
	 * Function to delete newsletter subscriber
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	deleteNewletterSubscriber = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.deleteOneRecords(req, res, optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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
}

module.exports = new NewsLetterSubscriberModel;