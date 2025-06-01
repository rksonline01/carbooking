/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/popupAdsController";
var modulePath	= 	"/"+ADMIN_NAME+"/popup_ads/";
const { addPopupAdsValidationRules, editPopupAdsValidationRules,validate } = require(__dirname+"/validations/popup_ads_validator.js")


/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
    req.rendering.views	=	__dirname + "/views";
    next();
 });

/** Routing is used to get PopupAds list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    var popupAdsItems	= require(modelPath);
    popupAdsItems.getPopupAdsList(req, res);
});

// /** Routing is used to add PopupAds **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addPopupAdsValidationRules(),validate,(req,res,next) => {	
    var popupAdsItems	= require(modelPath);
    popupAdsItems.addPopupAds(req,res,next);
});

/** Routing is used to edit PopupAds **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editPopupAdsValidationRules(),validate,(req,res,next) => {	
    var popupAdsItems	= require(modelPath);
    popupAdsItems.editPopupAds(req,res,next);
});


/** Routing is used to add PopupAds status **/
app.all(modulePath+"update_popup_ads_status/:id/:status/:status_type",checkLoggedInAdmin,(req,res,next) => {	
    var popupAdsItems	= require(modelPath);
    popupAdsItems.updatePopupAdsStatus(req,res,next);
});


/** Routing is used to delete PopupAds **/
app.all(modulePath+"delete_popup_ads/:id",checkLoggedInAdmin,(req,res,next) => {	
    var popupAdsItems	= require(modelPath);
    popupAdsItems.deletePopupAds(req,res,next);
});


/** Routing is used to change order number of PopupAds **/
app.all(modulePath+"change_order_number",checkLoggedInAdmin,(req, res) => {
	var popupAdsItems	= require(modelPath);
	popupAdsItems.changeOrderNumber(req, res);
});