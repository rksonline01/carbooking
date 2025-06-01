/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/sliderController";
var modulePath	= 	"/"+ADMIN_NAME+"/slider/";
const { addsliderValidationRules, editsliderValidationRules,validate } = require(__dirname+"/validations/slider_validator.js")


/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
    req.rendering.views	=	__dirname + "/views";
    next();
 });

/** Routing is used to get slider list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    var sliderItems	= require(modelPath);
    sliderItems.getSliderList(req, res);
});

// /** Routing is used to add slider **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addsliderValidationRules(),validate,(req,res,next) => {	
    var sliderItems	= require(modelPath);
    sliderItems.addSlider(req,res,next);
});

/** Routing is used to edit slider **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editsliderValidationRules(),validate,(req,res,next) => {	
    var sliderItems	= require(modelPath);
    sliderItems.editSlider(req,res,next);
});


/** Routing is used to add slider status **/
app.all(modulePath+"update_slider_status/:id/:status/:status_type",checkLoggedInAdmin,(req,res,next) => {	
    var sliderItems	= require(modelPath);
    sliderItems.updateSliderStatus(req,res,next);
});


/** Routing is used to delete slider **/
app.all(modulePath+"delete_slider/:id",checkLoggedInAdmin,(req,res,next) => {	
    var sliderItems	= require(modelPath);
    sliderItems.deleteSlider(req,res,next);
});


/** Routing is used to change order number of slider **/
app.all(modulePath+"change_order_number",checkLoggedInAdmin,(req, res) => {
	var sliderItems	= require(modelPath);
	sliderItems.changeOrderNumber(req, res);
});