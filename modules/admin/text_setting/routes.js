/** Model file path for current plugin **/
var controllerPath	=	__dirname+"/TextSettingController";
var modulePath	= 	"/"+ADMIN_NAME+"/text-setting/";

const { addTextSettingValidationRules,validate } = require(__dirname+"/validation/validator.js")
/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get text setting list **/
app.all(modulePath+":type",checkLoggedInAdmin,(req, res)=>{
    var adminTextSetting 	= require(controllerPath);
    adminTextSetting.getTextSettingList(req, res);
});

/** Routing is used to add text setting **/
app.all(modulePath+":type/add",checkLoggedInAdmin,addTextSettingValidationRules(), validate,(req,res,next)=>{
    var adminTextSetting 	= require(controllerPath);
    adminTextSetting.addTextSetting(req, res);
});

/** Routing is used to edit text setting **/
app.all(modulePath+":type/edit/:id",checkLoggedInAdmin,addTextSettingValidationRules(), validate, (req, res, next)=>{
    var adminTextSetting = require(controllerPath);
    adminTextSetting.editTextSetting(req, res);
});


/** Routing is used to edit text setting **/
app.all(modulePath+":type/delete_one/:id",checkLoggedInAdmin, (req, res, next)=>{
    var adminTextSetting = require(controllerPath);
    adminTextSetting.deleteOneTextSettings(req, res);
});

/** Routing is used to edit text setting **/
app.all(modulePath+":type/delete_multiple",checkLoggedInAdmin, (req, res, next)=>{
    var adminTextSetting = require(controllerPath);
    adminTextSetting.deleteMultipleTextSettings(req, res);
});
