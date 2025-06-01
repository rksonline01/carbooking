/** Model file path for current plugin **/
var modelPath   =	__dirname+"/countryStateCityController";
var modulePath	= 	"/"+ADMIN_NAME+"/country_state_city/";


/** Routing is used to get state list country wise **/
app.all(modulePath+"get_state_list_country_wise/:country_id",checkLoggedInAdmin,(req, res)=>{    
    var adminUser = require(modelPath);
    adminUser.getStateListCountryWise(req, res);
});

/** Routing is used to get city list stste wise **/
app.all(modulePath+"get_city_list_state_wise/:state_id",checkLoggedInAdmin,(req, res)=>{
     var adminUser = require(modelPath);
     adminUser.getCityListStateWise(req, res);
});