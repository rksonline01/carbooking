const { ObjectId } = require('mongodb');
const async = require("async");
const Model = require("./model/country_state_city");
const clone				= 	require('clone');

function countryStateCityController(){

    this.getStateListCountryWise = (req,res,next)=>{

        let countryId = (req.params.country_id) ? req.params.country_id : "";
        if(countryId){

            let conditions = {
                country_id : new ObjectId(countryId),
                is_deleted : NOT_DELETED,
			    status	   : ACTIVE,
            }

            let sort_conditions = {
                state_name: SORT_ASC
            }

            let fields = {
                _id			:	1,
			    state_name	:	1,
            };

            let optionObj = {
                conditions : conditions,
                sort_conditions : sort_conditions,
                fields : fields
            }

            Model.getStateListCountryWise(optionObj).then(state_response=>{
                if(state_response.status == STATUS_ERROR){
                    res.send({
                        status	:STATUS_ERROR,
                        result	:[],
                        message	:res.__("admin.system.something_going_wrong_please_try_again")
                    });
                }else{
                    res.send({
                        status:STATUS_SUCCESS,
                        result:state_response.result
                    });
                }
            })

        }else{
            res.send({
                status	:STATUS_ERROR,
                result	:[],
                message	:res.__("admin.system.something_going_wrong_please_try_again")
            });
        }
    }
	
	
	
	
	this.getCityListStateWise = (req,res,next)=>{

        let stateId = (req.params.state_id) ? req.params.state_id : "";
        if(stateId){

            let conditions = {
                state_id : new ObjectId(stateId),
                is_deleted : NOT_DELETED,
			    status	   : ACTIVE,
            }

            let sort_conditions = {
                city_name: SORT_ASC
            }

            let fields = {
                _id			:	1,
			    city_name	:	1,
            };

            let optionObj = {
                conditions : conditions,
                sort_conditions : sort_conditions,
                fields : fields
            }

            Model.getCityListStateWise(optionObj).then(state_response=>{
                if(state_response.status == STATUS_ERROR){
                    res.send({
                        status	:STATUS_ERROR,
                        result	:[],
                        message	:res.__("admin.system.something_going_wrong_please_try_again")
                    });
                }else{
                    res.send({
                        status:STATUS_SUCCESS,
                        result:state_response.result
                    });
                }
            })

        }else{
            res.send({
                status	:STATUS_ERROR,
                result	:[],
                message	:res.__("admin.system.something_going_wrong_please_try_again")
            });
        }
    }

    

}

module.exports = new countryStateCityController();