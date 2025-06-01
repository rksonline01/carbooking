/**
 * Web.js
 *
 * This file is required by index.js. It sets up event listeners
 *
 * NODE.Js (http://nodejs.org)
 * Copyright Linux Foundation Collaborative (http://collabprojects.linuxfoundation.org/)
 *
 * @copyright     Linux Foundation Collaborative (http://collabprojects.linuxfoundation.org/)
 * @link          http://nodejs.org NODE.JS
 * @package       routes.js
 * @since         NODE.JS Latest version
 * @license       http://collabprojects.linuxfoundation.org Linux Foundation Collaborative
 */

/** Including contants file */
require("./../config/global_constant");

/** include breadcrumb file **/
require(WEBSITE_ROOT_PATH + "breadcrumbs");

/** Including i18n for languages */
var i18n 				= require("i18n");

/** node cache module */
var NodeCache 			= require("node-cache");
	myCache 			= new NodeCache();

/** Including common function */
require(WEBSITE_ROOT_PATH + "utility");

require(WEBSITE_ROOT_PATH + "config/general_functions");

//const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
//let developerObj = new Student();
var cors	= 	require('cors');

/**
 * Export a function, so that we can pass the app and io instances from app.js
 *
 * @param router As Express Object
 * @param io As Socket Io Object
 * @param mongo As Mongo db Object
 *
 * @return void.
 */
module.exports = {
	configure: function(router,io,mongo) {
		mongodb		= mongo;
		db			= mongodb.getDb();
		//ObjectId	= require("mongodb").ObjectID;
		app 		= router;
		
		/** Middlewares **/

		/** Function to check admin is logged in or not */
		checkLoggedInAdmin = function(req, res, next) {
			res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
			if(typeof req.session.user !== typeof undefined && typeof req.session.user._id !== typeof undefined && typeof req.session.user.user_role_id !== typeof undefined){
				if(req.session.user.user_role_id == SUPER_ADMIN_ROLE_ID){
					return next();
				}else if( req.session.user.user_role_id != FRONT_ADMIN_ROLE_ID ){
					
					let userId 			= (req.session.user._id) ? req.session.user._id : "";
					let currentPath 	= (req.route.path) 	? req.route.path 			: "";
					
					/**
					 *  Remove /admin/ from url
					 *  eg . url : "/admin/dashboard" after replace it will be "dashboard"
					 **/
					let currentSiteUrl 	= 	(req.url)	? req.url.replace("/"+ADMIN_NAME+"/","") : "";
					let moduleIds		=	userModuleFlagAction(userId,"","get");
					let validUrl		= 	false;

					/**
					 *  Add "/" (if not exists) after url
					 *  eg. /admin/master/faq = /admin/master/faq/
					 **/
					let fullSiteUrl	= (req.url) ? req.url : "";
					let tempUrlData = (fullSiteUrl) ? fullSiteUrl.split('/') : [];
					if(tempUrlData[tempUrlData.length-1] != "/"){
						fullSiteUrl	= fullSiteUrl+"/";
					}

					for(let i in moduleIds){
						let groupPath 		= (moduleIds[i].group_path) ? moduleIds[i].group_path.split(',') : [];
						let childs 			= (moduleIds[i].childs) 	? moduleIds[i].childs 	 	 		 : [];
						let currentPathData = (currentPath) 			? currentPath.split('/')			 : [];

						/**
						 * path : /admin/dashboard ,
						 * path Data : [ '', 'admin', 'dashboard' ]
						 * active path is always on 2 index
						 * 0 index is blank 1 index is admin and 2 index is active path
						 **/
						let activePath		= (currentPathData[2]) 		? currentPathData[2] 				 : "";

						if(childs.length>0){
							for(let k in childs){
								let childGroupPath = (childs[k].group_path) ? childs[k].group_path.split(',') : [];
								for(let j in childGroupPath){
									let singleGroupPath = (childGroupPath[j]) ? childGroupPath[j] : '';

									if(activePath == singleGroupPath || currentSiteUrl == singleGroupPath || fullSiteUrl.indexOf("/"+singleGroupPath+"/") > -1){
										validUrl = true;
										break;
									}
								}
								if(validUrl){
									break;
								}
							}
						}else{
							for(let j in groupPath){
								let singleGroupPath = (groupPath[j]) ? groupPath[j] : '';
								if(activePath == singleGroupPath || currentSiteUrl == singleGroupPath){
									validUrl = true;
									break;
								}
							}
						}
						if(validUrl){
							break;
						}
					}

					if(validUrl || currentSiteUrl == "dashboard" || currentSiteUrl == "edit_profile"){
						return next();
						/*if(currentSiteUrl == "dashboard" && req.session.user.user_role_id == CORPORATE_USER_ROLE_ID){
							res.redirect('/admin/corporate_dashboard');
						}else if(currentSiteUrl == "dashboard" && req.session.user.user_role_id == FLEET_USER_ROLE_ID){
							res.redirect('/admin/dashboard');
						}else{
							return next();
						}*/
					}else{
						req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
						res.redirect('/admin/dashboard');
					}
						
				}else{
					res.redirect(WEBSITE_ADMIN_URL+"login");
				}
			}else{
				res.redirect(WEBSITE_ADMIN_URL+"login");
			}
		}
		
		
		

		/** Function to check user is logged in or not **/
		checkLoggedIn = function(req, res, next) {
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			if(typeof req.session.user !== typeof undefined && typeof req.session.user._id !== typeof undefined && typeof req.session.user.user_role_id !== typeof undefined){
				res.redirect('/login');
			}else{
				res.redirect('/login');
			}
		}

		/** Function to check if user is logged in then redirect him/her to dashboard */
		isLoggedIn = function(req, res, next){
			res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
			if(typeof req.session !== typeof undefined && typeof req.session.user !== typeof undefined){
				if (typeof req.session.user._id !== typeof undefined && typeof req.session.user.user_role_id !== typeof undefined){
					res.redirect(WEBSITE_ADMIN_URL+"dashboard");
				}else{
					return next();
				}
			}else{
				return next();
			}
		}

		/** Before Filter **/
		app.use(function(req, res, next) {
			process.setMaxListeners(0);
			var sess = req.session;
			var lang 		= (sess.lang != undefined) ? sess.lang : DEFAULT_LANGUAGE_CODE;

			res.locals.admin_language = lang;
			var langData 	= (sess.lang != undefined) ? sess.lang : DEFAULT_LANGUAGE_CODE;

			if(langData == "en"){
				DATABLE_LANG_CDN = DATABLE_EN_CDN;
			}else{
				DATABLE_LANG_CDN = DATABLE_AR_CDN;
			}
			
			i18n.setLocale(langData);
			res.setLocale(langData);
			req.setLocale(langData)
			/** Function to get unhandled errors and prevent to stop nodejs server **/
			process.on("uncaughtException", function (err) {
				console.log("error name ---------"+err.name);    // Print the error name
				console.log("error date ---------"+newDate('',DATABASE_DATE_TIME_FORMAT));    // Print the error name
				console.log("error message ---------"+err.message); // Print the error message
				console.log("error stack ---------"+err.stack);   // Print the stack trace
			});

			/** Rendering options to set views and layouts */
			req.rendering = {};

			res.locals.auth 	= 	"";
			if(req.session.user !== "undefined" && req.session.user){
				res.locals.auth = req.session.user;
			}

			res.locals.site_url = 	req.url;

			/** Configure success flash message **/
			res.locals.success_flash_message	= "";
			res.locals.success_status			= "";

			/** Configure error flash message **/
			res.locals.error_flash_message	= "";
			res.locals.error_status			= "";

			if(typeof req.session.flash !== "undefined") {
				if(typeof req.session.flash.success !== "undefined") {
					res.locals.success_status			=	STATUS_SUCCESS;
					res.locals.success_flash_message 	=	req.session.flash.success;
				}
				if(typeof req.session.flash.error !== "undefined") {
					res.locals.error_status			=	STATUS_ERROR;
					res.locals.error_flash_message 	=	req.session.flash.error;
				}
			}

			/** Set default views folder path **/
			app.set("views", __dirname + "/views");

			/** Read/write Basic settings from/in Cache **/
			var settings    = myCache.get( "settings" );
			if ( settings == undefined ){
				var fs  = require("fs");
				fs.readFile(WEBSITE_ROOT_PATH+"config/settings.json", "utf8", function readFileCallback(err, data){
					if(err){
						next();
					}else{
						settings    		=    JSON.parse(data);
						myCache.set( "settings", settings, 0 );
						res.locals.settings =   settings;
						next();
					}
				});
			}else{
				res.locals.settings =   settings;
				next();
			}

		});
		
		app.use(cors());
		/** admin route start here **/

		/** Admin Before Filter **/
		app.use(FRONT_END_NAME+ADMIN_NAME+"/",function(req, res, next) {
		
			res.locals.active_path 		=	req.path.split("/")[1];

			res.locals.admin_list_url 	= 	WEBSITE_ADMIN_URL+res.locals.active_path ;
			res.locals.breadcrumb		= 	req.breadcrumbs();
			
			res.locals.active_path1 	=	req.path.split("/")[1];
			res.locals.active_path2 	=	req.path.split("/")[2];

			if(res.locals.active_path2 == 'export_pdf'){
				req.rendering.layout = WEBSITE_ADMIN_LAYOUT_PATH+"blank_layout";
			}else{
				/** Set default layout for admin **/
				req.rendering.layout = WEBSITE_ADMIN_LAYOUT_PATH+"default";
			}

			/** Read/write admin Modules from/in Cache **/
			if(!isPost(req) && typeof req.session.user !== typeof undefined){
				let userId = (req.session.user._id) ? req.session.user._id : "";
				var moduleLists = userModuleFlagAction(userId,"","get");
				if ( moduleLists == undefined){

					// Need to change 

					var adminModules = require(WEBSITE_ADMIN_MODULES_PATH+"admin_modules/model/AdminModule");
					adminModules.getAdminModulesListing(req,res).then(function(moduleResponse){
						
						res.locals.admin_modules_list = moduleResponse.result;
						userModuleFlagAction(userId,moduleResponse.result,"add");
						next();
					});
				
				}else{
					res.locals.admin_modules_list 	= moduleLists;
					next();
				}
			}else{
				res.locals.admin_modules_list =   [];
				next();
			}
		});

		/** Load all modules route */
		require('./modules_route')
		
		/** Route is used to render 404 page */
		app.get(FRONT_END_NAME+ADMIN_NAME+"/*", function(req, res){
			let layout404 = WEBSITE_ADMIN_LAYOUT_PATH+"404";
			if(res.locals.auth && res.locals.auth._id){
				layout404 = WEBSITE_ADMIN_LAYOUT_PATH+"default";
			}
			/** Set current view folder **/
			req.rendering.views		=	WEBSITE_ADMIN_MODULES_PATH+"elements/";

			/** Set layout  404 **/
			req.rendering.layout	=	layout404;

			/**Render 404 page*/
			res.render("404");
		});

		/** front route start here */

		/** Front Before Filter */
		app.use(FRONT_END_NAME,function(req, res, next) {
			res.locals.active_path 	= req.path.split("/")[1];
			res.locals.active_tab 	= req.path.split("/")[2];
			res.locals.list_url 	= WEBSITE_URL + res.locals.active_path;

			/** Set default layout for front **/
			req.rendering.layout = WEBSITE_LAYOUT_PATH+"default";
			next();
		});



		 
		/** Routing for socket connection **/
		io.on("connection", function (socket) {
			// console.log("Here in connection",socket);
			var socketModel = require(WEBSITE_MODULES_PATH+"socket/model/socket");
			socketModel.init(io,socket);
		});
				

		/** Routing for socket connection *
		io.on("connection", function (socket) {
			var socketModel	= require(WEBSITE_MODULES_PATH+"socket/model/socket");
			socketModel.init(io,socket);
		});*/

		/** Include Home Module **
		require(WEBSITE_MODULES_PATH+"home/routes");

		/** Include Registration Module **
		require(WEBSITE_MODULES_PATH+"registration/routes");

		/** Include User Module **
		require(WEBSITE_MODULES_PATH+"user/routes");*/
		
		

		/** Route is used to test mobile apis for development purpose only */
		app.get(FRONT_END_NAME+'get_mobile_api/:auth_key', function(req, res){
			if(req.params && req.params.auth_key && req.params.auth_key == WEBSITE_HEADER_AUTH_KEY){
				res.render(WEBSITE_MODULES_PATH+"api/views/get_mobile_api",{
					layout:false
				});
			}else{
				/** Set current view folder **/
				req.rendering.views		=	WEBSITE_LAYOUT_PATH;

				/**Render 404 page*/
				res.render("404",{
					layout : false
				});
			}
		});

		/** Routing is used for testing purpose only **/
		app.post( FRONT_END_NAME+"post_mobile_api/:auth_key", function( req, res, next ) {
			if(req.params && req.params.auth_key && req.body.data && req.params.auth_key == WEBSITE_HEADER_AUTH_KEY){
				try{
					req.body		=	JSON.parse(req.body.data);
					var methodName	=	req.body.method;
					var moduleName	=	req.body.model;

					try{
						require(WEBSITE_MODULES_PATH+'api/model/'+moduleName)[methodName](req, res,next).then(response=>{
							res.result = response;
							next();
						}).catch(next);
					}catch(e){
						console.log(e)
						res.result = {
							status	:	STATUS_ERROR,
							message	: 	res.__("admin.system.something_going_wrong_please_try_again-1")
						};
						next();
					}
				}catch(e){
					console.log(e)
					res.result = {
						status	: STATUS_ERROR,
						message	: res.__("admin.system.something_going_wrong_please_try_again-2")
					};
					next();
				}
			}else{
				res.result = {
					status	:	STATUS_ERROR,
					message	:	res.__("admin.system.invalid_access")
				};
				next();
			}
		});

		/** routing is used for mobile api */
		app.post(FRONT_END_NAME+"mobile_api", function( req, res, next ) {
			
			if(req.headers.authkey == WEBSITE_HEADER_AUTH_KEY){
				try{
					var base64		=	require('base-64');
					var decoded 	=	base64.decode(req.body.data);
					req.body		=	JSON.parse(decoded);
		
					var methodName	=	req.body.method;
					var moduleName	=	req.body.model;

					
					try{
						require(WEBSITE_MODULES_PATH+'api/model/'+moduleName)[methodName](req, res,next).then(response=>{
							res.result = response;
							next();
						}).catch(next);
					}catch(e){
						res.result = {
							status	:	STATUS_ERROR,
							message	:	res.__("admin.system.something_going_wrong_please_try_again-3")
						};
						next();
					}
				}catch(e){
					res.result = {
						status	: STATUS_ERROR,
						message	: res.__("admin.system.something_going_wrong_please_try_again-4")
					};
					next();
				}
			}else{
				res.result = {
					status	:	STATUS_ERROR,
					message	:	res.__("admin.system.invalid_access")
				};
				next();
			}
		});
		
		/** Route is used to for 404 page */
		app.get("*", function(req, res){
			res.redirect(WEBSITE_ADMIN_URL);
			return;
		});
			
		/** Route is used to for 404 page *
		app.get("*", function(req, res){
			/** Set current view folder **
			req.rendering.views		=	WEBSITE_LAYOUT_PATH;

			/**Render 404 page*
			res.render("404",{
				layout : false
			});
		}); 
 
		/** After Filter */
		app.use( function( req, res, next ) {
			if(typeof req.route !== typeof undefined && typeof req.route.path !== typeof undefined && req.route.path == FRONT_END_NAME+'mobile_api'){
				/** Send respo **/
				var result 		= 	res.result;
				if(typeof result.status === typeof undefined){
					result.status = STATUS_SUCCESS;
				}
				if(result.status == STATUS_SUCCESS || result.status == STATUS_ERROR){
					if(typeof result.message !== typeof undefined){
						if(typeof result.message == 'string'){
							var oldMessage = result.message;
							result.message = [{
								msg : oldMessage,
								param : result.status
							}];
						}
					}else{
						result.message = [{
							msg : STATUS_SUCCESS,
							param : STATUS_SUCCESS
						}];
					}
				}

				var methodName			=	req.body.method;
				var modelName			=	req.body.model;
				result["_method_name"] 	= 	methodName;
				result["_model_name"] 	= 	modelName;
				result					= 	JSON.stringify(result);
				var base64				=	require('base-64');
				var utf8				=	require('utf8');
				var bytes				=	utf8.encode(result);
				var encoded 			=	base64.encode(bytes);
				res.send(encoded);
			}else{
				var methodName			=	(req.body.method) ? req.body.method : "";
				var modelName			=	(req.body.model) ? req.body.model : "";
				//~ if(methodName) res.result["_method_name"] 	= 	methodName;
				//~ if(modelName) res.result["_model_name"] 	= 	modelName;
				res.send(res.result);
			}
			next();
		});

		/** Error Handling */
		app.use(function (err,req,res,next) {
			console.log('Error handeled in web.js routing');
			if(err.stack){
				console.error(err.stack);
			}else{
				console.error(err);
			}

			let currentPanel = (req.path.split("/")[1]) ? req.path.split("/")[1] : "";
			if(req.method == "POST"){
				/** If request is from admin panel */
				if(currentPanel == ADMIN_NAME){
					/** This response is work for both listing requests and other requests */
					return res.send({
						status: STATUS_ERROR,
						message:res.__("admin.system.something_going_wrong_please_try_again-6"),
						draw: 0,
						data: [],
						recordsFiltered: 0,
						recordsTotal: 0
					}); 
				}else{
					if(isMobileApi(req,res)){
						var result				=	{};
						var methodName			=	req.body.method;
						var modelName			=	req.body.model;
						result["_method_name"] 	= 	methodName;
						result["_model_name"] 	= 	modelName;
						result["status"] 		= 	STATUS_ERROR;
						result["message"] 		= 	res.__("admin.system.something_going_wrong_please_try_again-7");
						result					= 	JSON.stringify(result);
						var base64				=	require('base-64');
						var utf8				=	require('utf8');
						var bytes				=	utf8.encode(result);
						var encoded 			=	base64.encode(bytes);
						return res.send(encoded);
					} 
					return res.send({
						status: STATUS_ERROR,
						message:res.__("admin.system.something_going_wrong_please_try_again-88"),
					});
				}
			}
			let	viewPath	 = WEBSITE_LAYOUT_PATH;
			/* If request is from admin panel */
			if(currentPanel == ADMIN_NAME){
				/* Set view path to elements folder in admin panel */
				viewPath = WEBSITE_ADMIN_MODULES_PATH+"elements/";
				/* Set layout path */
				let layout404 = WEBSITE_ADMIN_LAYOUT_PATH+"404";
				if(res.locals.auth && res.locals.auth._id){
					layout404 = WEBSITE_ADMIN_LAYOUT_PATH+"default";
				}
				/** Set layout  404 **/
				req.rendering.layout	=	layout404;

				/** Set current view folder **/
				req.rendering.views		=	viewPath;

				/**Render error page*/
				return res.render("error");
			}

			/** Set current view folder **/
			req.rendering.views		=	viewPath;

			/**Render error page*/
			return res.render("404",{
				layout : false
			});

		});




		 

	}
};
