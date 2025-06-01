const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class CountryStateCity {

	constructor(){
		this.state_db_name = TABLE_STATES
		this.city_db_name = TABLE_CITY
	}
	/**
	 *  Function for get states list for dropdown	 
	*/
	getStateListCountryWise	= 	(optionObj)=>{
		return new Promise(resolve=>{
			optionObj["collection"] = this.state_db_name;

			DbClass.getFindAllWithoutLimit(optionObj).then(stateResponse=>{
				let responseStatus = (stateResponse.status) ? stateResponse.status : "";
                let responseResult = (stateResponse.result) ? stateResponse.result : "";

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
	};// getStateListCountryWise

	
	
	/**
	 *  Function for get states list for dropdown	 
	*/
	getCityListStateWise	= 	(optionObj)=>{
		return new Promise(resolve=>{
			optionObj["collection"] = this.city_db_name;

			DbClass.getFindAllWithoutLimit(optionObj).then(stateResponse=>{
				let responseStatus = (stateResponse.status) ? stateResponse.status : "";
                let responseResult = (stateResponse.result) ? stateResponse.result : "";

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
	};// getCityListStateWise
}
module.exports = new CountryStateCity;
