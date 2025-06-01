/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/FaqController";
var modulePath	= 	"/"+ADMIN_NAME+"/faq/";
const { addFaqValidationRules, editFaqValidationRules,validate } = require(__dirname+"/faq_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});


/** Routing is used to get faq list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
    var adminFaq = require(modelPath);
    adminFaq.getFaqList(req, res);
});


/** Routing is used to add faq **/
app.all(modulePath+"add",checkLoggedInAdmin,addFaqValidationRules(),validate,(req,res,next) => {
    var adminFaq = require(modelPath);
    adminFaq.addFaq(req,res,next);
});

/** Routing is used to edit faq **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editFaqValidationRules(),validate,(req,res,next) => {
    var adminFaq = require(modelPath);
    adminFaq.editFaq(req,res,next);
});
/** Routing is used to view faq details **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	let adminFaq = require(modelPath);
	adminFaq.viewFaqDetails(req, res, next);
});
/** Routing is used to update faq status **/
app.all(modulePath+"update-status/:id/:status",checkLoggedInAdmin,(req, res, next) => {
	let adminFaq = require(modelPath);
	adminFaq.updateFaqStatus(req, res, next);
});

/** Routing is used to change order of gallery **/
app.all(modulePath+"change_display_priority",checkLoggedInAdmin,(req, res) => {
	var adminFaq = require(modelPath);
	adminFaq.changeDisplayPriority(req, res);
});

/**  Routing is used to delete faq **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
	var adminFaq = require(modelPath);
	adminFaq.deleteFaq(req,res);
});










