/** Model file path for current plugin **/
var controllerPath   =	__dirname+"/citiesController";
var modulePath	= 	"/"+ADMIN_NAME+"/cities/";
var cities	    =   require(controllerPath);

const { addCityValidationRules,editCityValidationRules,validate} = require(__dirname+"/validations/city_validators.js")

/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
   req.rendering.views	=	__dirname + "/views";
   next();
});

/** Routing is used to get cities list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    cities.getCityList(req, res);
});

/** Routing is used to add city **/
app.all(modulePath+"add",checkLoggedInAdmin,addCityValidationRules(),validate,(req,res,next) => {	
    cities.addCity(req,res,next);
});

/** Routing is used to edit city **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editCityValidationRules(),validate,(req,res,next)=>{
    cities.editCity(req,res,next);
});

/** Routing is used to update city status **/
app.all(modulePath+"update_city_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    cities.updateCityStatus(req, res);
});