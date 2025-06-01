/** defining controller and module path */
var controllerPath 	= __dirname+"/stateController";
var modulePath	= "/"+ADMIN_NAME+"/states/";

const {addStateValidationRules,editStateValidationRules,validate} = require(__dirname+"/validations/state_validators")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used for list page **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => { 
	var state = require(controllerPath);
	state.getStatesList(req, res);
});

/** Routing is used for list page **/
app.all(modulePath+"add",checkLoggedInAdmin,addStateValidationRules(),validate,(req, res) => { 
	var state = require(controllerPath);
	state.addState(req, res);
});

/** Routing is used to edit state **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editStateValidationRules(),validate,(req,res,next)=>{
    var state	= require(controllerPath);
    state.editState(req,res,next);
});

/** Routing is used to update state status **/
app.all(modulePath+"update_state_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    var state	= require(controllerPath);
    state.updateStateStatus(req, res);
});