/** Model file path for current plugin **/
var modelPath = __dirname +"/PromoCodeController";
var modulePath	= 	"/"+ADMIN_NAME+"/promo_codes/";
const { addPromoCodeValidationRules,editPromoCodeValidationRules,validate } = require(__dirname+"/promo_code_validations/validator.js")
/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get promo code list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
	var adminPromoCode = require(modelPath);
	adminPromoCode.list(req, res);
});


/** Routing is used to add category **/
app.all(modulePath+"add",checkLoggedInAdmin,addPromoCodeValidationRules(),validate,(req,res,next) => {
	var adminPromoCode = require(modelPath);
	adminPromoCode.addEditPromoCode(req, res);
});

/** Routing is used to update promo code details  **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editPromoCodeValidationRules(),validate,(req, res,next) => {
	var adminPromoCode = require(modelPath);
	adminPromoCode.addEditPromoCode(req, res,next);
});

/** Routing is used to view promo code details  **/
app.all(modulePath+"view/:id",checkLoggedInAdmin,(req, res,next) => {
	var adminPromoCode = require(modelPath);
	adminPromoCode.view(req, res,next);
});

/** Routing is used to update promo code status  **/
app.all(modulePath+"update-status/:id/:status",checkLoggedInAdmin,(req, res,next) => {
	var adminPromoCode = require(modelPath);
	adminPromoCode.updatePromoCodeStatus(req, res,next);
});

/** Routing is used to update  export user details **/
app.all(modulePath+"export_data/:export_type",checkLoggedInAdmin,(req, res,next)=>{
    var adminUser	= require(modelPath);
    adminUser.exportData(req,res,next);
});
/** Routing is used to update  export user details **/
app.all(modulePath+"update_multiple_status",checkLoggedInAdmin,(req, res,next)=>{
    var adminUser	= require(modelPath);
    adminUser.updateMultipleStatus(req,res,next);
});

/** Routing is used to delete promo code details  **/
app.all(modulePath+"delete/:id",checkLoggedInAdmin,(req, res,next) => {
	var adminPromoCode = require(modelPath);
	adminPromoCode.deletePromoCode(req, res,next);
});

/** Routing is used to get user list  **/
app.all(modulePath+"get_user_list/:keyword",checkLoggedInAdmin,(req,res,next)=>{
	var adminPromoCode = require(modelPath);
	adminPromoCode.getUserListUserTypeWise(req, res,next);
});

/** Routing is use to get suggestion list */
app.all(modulePath+"get_suggestions",checkLoggedInAdmin , (req,res)=>{
	var adminPromoCode = require(modelPath);
    adminPromoCode.getSuggestionList(req,res);
})

/** Routing is use to get suggestion list */
app.all(modulePath+"get_random_string",checkLoggedInAdmin , (req,res)=>{
	var adminPromoCode = require(modelPath);
    adminPromoCode.getRandomCode(req,res);
})