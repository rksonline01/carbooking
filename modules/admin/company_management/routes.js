/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/companyController";
var modulePath	= 	"/"+ADMIN_NAME+"/company_management/";
const { addcompanyValidationRules, editcompanyValidationRules,addB2BDiscountValidationRules,editB2BDiscountValidationRules,validate } = require(__dirname+"/validations/company_validator.js")


/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
    req.rendering.views	=	__dirname + "/views";
    next();
 });

/** Routing is used to get company list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    var companyItems	= require(modelPath);
    companyItems.getCompanyList(req, res);
});

// /** Routing is used to add company **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addcompanyValidationRules(),validate,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.addCompany(req,res,next);
});

/** Routing is used to edit company **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editcompanyValidationRules(),validate,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.editCompany(req,res,next);
});


/** Routing is used to add company status **/
app.all(modulePath+"update_company_status/:id/:status/:status_type",checkLoggedInAdmin,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.updateCompanyStatus(req,res,next);
});


/** Routing is used to edit b2b discount configuration **/
app.all(modulePath+"b2b_discount_configuration/:companyid",checkLoggedInAdmin,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.getB2BDiscountList(req,res,next);
});

// /** Routing is used to add B2BDiscount **/
app.all(modulePath+"b2b_discount_configuration/:companyid/add",checkLoggedInAdmin,convertMultipartReqBody,addB2BDiscountValidationRules(),validate,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.addB2BDiscount(req,res,next);
});

// /** Routing is used to edit B2BDiscount **/
app.all(modulePath+"b2b_discount_configuration/:companyid/edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editB2BDiscountValidationRules(),validate,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.editB2BDiscount(req,res,next);
});

// /** Routing is used to edit B2BDiscount **/
app.all(modulePath+"b2b_discount_configuration/update_status/:company_id/:id/:status/:status_type",checkLoggedInAdmin,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.updateB2BDiscountStatus(req,res,next);
});


/** Routing is used to edit b2b discount employee list **/
app.all(modulePath+"b2b_discount_employee_list/:companyid",checkLoggedInAdmin,(req,res,next) => {	
    var companyItems	= require(modelPath);
    companyItems.getB2BDiscountEmployeeList(req,res,next);
});

/** Routing is used to edit b2b discount employee list **/
app.all(modulePath+"b2b_discount_employee_list/:companyid/view/:userId",checkLoggedInAdmin,(req,res,next) => {	
    var companyItems	= require(modelPath);  
    companyItems.getB2BDiscountEmployeeView(req,res,next);
});

/** Routing is used to edit b2b discount employee list **/
app.all(modulePath+"b2b_discount_employee_list/:companyid/update_b2b_discount_status/:userId/:status",checkLoggedInAdmin,(req,res,next) => {	
    var companyItems	= require(modelPath);  
    companyItems.chanceB2bStatus(req,res,next);
});

/** Routing is used to update  export company details **/
app.all(modulePath+"export-company",checkLoggedInAdmin,(req, res,next)=>{
    var companyData = require(modelPath);
    companyData.exportCompanyData(req,res,next);
});

/** Routing is used to export b2b discount **/
app.all(modulePath+"export-b2b-discount",checkLoggedInAdmin,(req, res,next)=>{
    var companyItems = require(modelPath);
    companyItems.exportB2BDiscountData(req,res,next);
});

/** Routing is used to export b2b discount employee list **/
app.all(modulePath+"export-b2b-discount-employee-list",checkLoggedInAdmin,(req, res,next)=>{
    var companyItems = require(modelPath);
    companyItems.exportB2BDiscountEmployeeListData(req,res,next);
});