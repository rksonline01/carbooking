/** Controller file path for current plugin **/
var controllerPath   =	__dirname+"/franchiseContractsController";
var modulePath	= 	"/"+ADMIN_NAME+"/franchise_contracts/";

const { franchiseContractsValidationRules, validate } = require(__dirname+"/franchise_contracts_validator/validator.js")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
 next();
});

/** Routing is used to get newsletter subscriber list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var franchiseContract = require(controllerPath);
	franchiseContract.getContractList(req, res);
});

/** Routing is used to add newsletter subscriber **/
app.all(modulePath+"add",checkLoggedInAdmin,franchiseContractsValidationRules(),validate,(req, res,next) => {
	var franchiseContract = require(controllerPath);
	franchiseContract.addContract(req,res,next);
});


/** Routing is used to delete newsletter subscriber **/
app.all(modulePath+"view/:id",checkLoggedInAdmin,(req, res,next) => {
	var franchiseContract = require(controllerPath);
	franchiseContract.viewContract(req,res,next);
});

/** Routing is used to delete newsletter subscriber **/
app.all(modulePath+"delete/:id",checkLoggedInAdmin,(req, res,next) => {
	var franchiseContract = require(controllerPath);
	franchiseContract.deleteContract(req,res,next);
});

/** Routing is used to update newsletter subscriber status **/
app.all(modulePath+"update_contract_status/:id/:status",checkLoggedInAdmin,(req, res,next) => {
	var franchiseContract = require(controllerPath);
	franchiseContract.updateContractStatus(req,res,next);
});
