const fs = require('node:fs');
const { ObjectId } = require('mongodb');
const util = require('node:util');
const crypto = require('crypto');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const randomstring = require("randomstring");
const asyncEachSeries = require("async/eachSeries");
const CartModel = require("./modules/frontend/api/model/cartModel")
var async = require('async');
var nodemailer = require('nodemailer');
var ejs = require('ejs');
const asyncParallel = require('async/parallel');
const RegistrationModel = require("./modules/frontend/api/model/registrationModel");
const clone = require("clone");
const request = require("request");
const NotificationTypeModel = require(WEBSITE_ADMIN_MODULES_PATH + "/notification_type/model/NotificationType");
const UserModel = require(WEBSITE_ADMIN_MODULES_PATH + "/users/model/user");
const OrderModel = require('./modules/frontend/api/model/orderModel');
const PromoCodeModel = require(WEBSITE_ADMIN_MODULES_PATH + "/promo_code/model/PromoCode")
const XLSX = require("xlsx");
const B2BDiscountModel = require(WEBSITE_ADMIN_MODULES_PATH + "/company_management/model/b2bDiscountModel")
const PushNotificationTypeModel = require(WEBSITE_ADMIN_MODULES_PATH + "/push_notification_type/model/PushNotificationType");
const LeaveManagementModel = require(WEBSITE_ADMIN_MODULES_PATH + "/leave_management/model/LeaveManagement");
const axios = require('axios');
const SlotModel = require(WEBSITE_ADMIN_MODULES_PATH + "/slot_management/model/Slot")
const ProductModel = require(WEBSITE_ADMIN_MODULES_PATH + "/products/model/ProductModel")
const twilio = require('twilio');

/**
 * Function for parse validation
 *
 * @param validationErrors  As validationErrors Array
 * @param req				As Request Data
 *
 * @return array
 */
parseValidation = (validationErrors, req) => {
	let usedFields = [];
	let newValidations = [];
	if (Array.isArray(validationErrors)) {
		validationErrors.map((item) => {
			if (usedFields.indexOf(item.path) == -1) {
				usedFields.push(item.path);
				newValidations.push(item);
			}
		});
		return newValidations;
	} else {
		return false;
	}
}//End parseValidation();


/**
 * To check request method is post or get
 *
 * @param req	As Request Data
 * @param res	As Response Data
 *
 * @return boolean
 */
isPost = (req) => {
	if (typeof req.body !== typeof undefined && Object.keys(req.body).length != 0) {
		return true;
	} else {
		return false;
	}
}//End isPost()


/**
 * function is used to update user wise module flag
 *
 * @param userId as User Id
 * @param data as Data to be updated
 * @param type as update Type : delete/add/get
 *
 * @return regular expression
 */
userModuleFlagAction = (userId, data, type) => {
	var adminModulesList = myCache.get("admin_modules_list");
	if (typeof adminModulesList === typeof undefined) {
		adminModulesList = {};
	}
	if (type == "add") {

		adminModulesList[userId] = data;
		myCache.set("admin_modules_list", adminModulesList, 0);
		return true;
	} else if (type == "delete") {
		delete adminModulesList[userId];
		myCache.set("admin_modules_list", adminModulesList, 0);
		return true;
	} else if (type == "get") {
		return adminModulesList[userId];
	}
}//end userModuleFlagAction


/**
 * Function to get date in any format
 *
 * @param date 		as	Date object
 * @param format 	as 	Date format
 *
 * @return date string
 */
newDate = (date, format) => {
	if (date) {
		var now = new Date(date);
	} else {
		var now = new Date();
	}
	if (format) {
		let dateFormat = require('dateformat');
		return dateFormat(now, format);
	} else {
		return now;
	}
}//end newDate();


/**
 * Function for make string to title case
 *
 * @param str AS String
 *
 * @return string
 */
toTitleCase = (str) => {
	return str.replace(/\w\S*/g, (txt) => { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}//end toTitleCase();


consoleLog = (valueconsole) => {
	console.log(util.inspect(valueconsole, false, null, true /* enable colors */))
}


/**
 * Datatable configuration
 *
 * @param req		As	Request Data
 * @param res		As 	Response Data
 * @param options	As Object of data have multiple values
 *
 * @return json
 */
configDatatable = (req, res, options) => {
	return new Promise(resolve => {
		var resultDraw = (req.body.draw) ? req.body.draw : 1;
		var sortIndex = (req.body.order && req.body.order[0]['column']) ? req.body.order[0]['column'] : '';
		var sortOrder = (req.body.order && req.body.order[0]['dir'] && (req.body.order[0]['dir'] == 'asc')) ? SORT_ASC : SORT_DESC;

		/** Searching  **/
		var conditions = {};
		var searchData = (req.body.columns) ? req.body.columns : [];
		if (searchData.length > 0) {
			searchData.forEach((record, index) => {
				let fieldName = ((record.field_name) ? record.field_name : ((record.data) ? record.data : ''));
				let searchValue = (record.search && record.search.value) ? record.search.value.trim() : '';
				let fieldType = (record.field_type) ? record.field_type : '';
				if (searchValue && fieldName) {
					switch (fieldType) {
						case NUMERIC_FIELD:
							conditions[fieldName] = parseInt(searchValue);
							break;
						case OBJECT_ID_FIELD:
							conditions[fieldName] = ObjectId(searchValue);
							break;
						case EXACT_FIELD:
							conditions[fieldName] = searchValue;
							break;
						default:
							try {

								searchValue = cleanRegex(searchValue);

								conditions[fieldName] = { "$regex": searchValue, "$options": "i" };

								//conditions[fieldName] = new RegExp(searchValue, "i");
							} catch (e) {

								conditions[fieldName] = searchValue;
							}
							break;
					}
				}
			});
		}

		/** Sorting **/
		var sortConditions = {};
		if (sortIndex != '') {
			if (searchData[sortIndex]) {
				if (searchData[sortIndex].field_name) {
					if (searchData[sortIndex].field_name == "created") {
						sortConditions[searchData[sortIndex].field_name] = sortOrder;
						sortConditions["_id"] = sortOrder;
					} else {
						sortConditions[searchData[sortIndex].field_name] = sortOrder;

					}

				} else if (searchData[sortIndex].data) {
					if (searchData[sortIndex].data == "created") {
						sortConditions[searchData[sortIndex].data] = sortOrder;
						sortConditions["_id"] = sortOrder;
					} else {
						sortConditions[searchData[sortIndex].data] = sortOrder;
					}
				}
			}
		} else {
			sortConditions['_id'] = sortOrder;
		}

		resolve({
			sort_conditions: sortConditions,
			conditions: conditions,
			result_draw: resultDraw,
			options: options,
		});
	});
}//End configDatatable()


/**
 * Function for get languages list
 *
 * @param defaultLanguage	As Default Language
 *
 * @return json
 */
getLanguages = (req, res) => {
	return new Promise(resolve => {
		try {

			var conditionsObj = { active: ACTIVE };


			/** Get Language List **/
			var languages = db.collection(TABLE_LANGUAGES);
			let optionObj = {
				conditions: conditionsObj,
				collection: TABLE_LANGUAGES,
			}
			DbClass.getFindAll(optionObj).then(languageRes => {

				resolve(languageRes.result);
			})

		} catch (e) {
			consoleLog(e)
			/** Send blank response **/
			resolve([]);
		}
	});
}//End getLanguages()


/**
 * Function for sanitize form data
 *
 * @param data				As Request Body
 * @param notAllowedTags	As Array of not allowed tags
 *
 * @return json
 */
sanitizeData = (data, notAllowedTags) => {
	let sanitized = arrayStripTags(data, notAllowedTags);
	return sanitized;
}//End sanitizeData()


/**
 * Function to strip not allowed tags from array
 *
 * @param array				As Data Array
 * @param notAllowedTags	As Tags to be removed
 *
 * @return array
 */
arrayStripTags = (array, notAllowedTags) => {
	if (array.constructor === Object) {
		var result = {};
	} else {
		var result = [];
	}
	for (let key in array) {
		value = (array[key] != null) ? array[key] : '';
		if (value.constructor === Array || value.constructor === Object) {
			result[key] = arrayStripTags(value, notAllowedTags);
		} else {
			result[key] = stripHtml(value.toString().trim(), notAllowedTags);
		}
	}
	return result;
}//End arrayStripTags()


/**
 * Function to Remove Unwanted tags from html
 *
 * @param html				As Html Code
 * @param notAllowedTags	As Tags to be removed
 *
 * @return html
 */
stripHtml = (html, notAllowedTags) => {
	let unwantedTags = notAllowedTags;
	for (let j = 0; j < unwantedTags.length; j++) {
		html = html.replace(unwantedTags[j], '');
	}
	return html;
}//end stripHtml();


/**
 * Function to get date in any format with utc format
 *
 * @param date 		as	Date object
 * @param format 	as 	Date format
 *
 * @reference Site : https://www.npmjs.com/package/dateformat
 *
 * @return date string
 */
getUtcDate = (date, format) => {
	const moment = require('moment');
	if (date) {
		var now = moment(date, moment.defaultFormat).toDate();
	} else {
		var now = moment().toDate();
	}
	return now;

}//end getUtcDate();



/**
 * Function used to compare bcrypt password.
 *
 * @param options	As data in Object
 *
 * @return json
 */
bcryptCheckPasswordCompare = (userEnterPassword, DbPassword) => {
	return new Promise(resolve => {
		if (userEnterPassword != "" && DbPassword != "") {
			bcrypt.compare(userEnterPassword, DbPassword).then(function (passwordMatched) {
				if (!passwordMatched) {
					return resolve(false);
				} else {
					return resolve(true);
				}
			});
		} else {
			return resolve(false);
		}
	});
}


/**
 *  Function to get dropdown list with html
 *
 * @param req 				As Request Data
 * @param res 				As Response Data
 * @param options			As options
 *
 * @return object
 */
getDropdownList = (req, res, options) => {
	return new Promise(resolve => {
		var collections = (options.collections) ? options.collections : {};
		var responseSend = false;
		var finalHtmlData = {};
		if (collections && collections.length > 0) {
			let index = 0;
			collections.map((collectionRecords, j) => {
				let collection = (collectionRecords["collection"]) ? collectionRecords["collection"] : "";
				let selectedValues = (collectionRecords["selected"]) ? collectionRecords["selected"] : [];
				let columns = (collectionRecords.columns) ? collectionRecords.columns : [];
				let columnKey = (columns[0]) ? columns[0] : "";
				let columnValue = (columns[1]) ? columns[1] : "";
				let columnEmail = (columns[2]) ? columns[2] : "";
				let lang_code = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;

				let conditions = (collectionRecords.conditions) ? collectionRecords.conditions : {};// First parameter should be key, and second should be value

				let finalHtml = "";
				if (columnKey && columnValue && conditions) {
					let sortConditions = {};
					sortConditions[columnValue] = SORT_ASC;

					if (collectionRecords["sort_conditions"]) {
						sortConditions = collectionRecords["sort_conditions"];
					}

					let finalColumns = {};
					finalColumns[columnKey] = 1;
					finalColumns[columnValue] = 1;

					if (collection == TABLE_USERS) {
						if (columnEmail) {
							finalColumns['email'] = 1;
						} else {
							finalColumns['mobile_number'] = 1;

						}
					}

					finalColumns['pages_descriptions'] = 1

					var collectionObject = db.collection(collection);
					let optionObj = {
						conditions: conditions,
						collection: collection,
						fields: finalColumns,
						sort_condition: sortConditions
					}
					DbClass.getFindAllWithoutLimit(optionObj).then(responseData => {
						let responseStatus = (responseData.status) ? responseData.status : "";
						let result = (responseData.result) ? responseData.result : "";
						if (responseStatus == STATUS_ERROR) {
							let resolveResponse = {
								status: STATUS_ERROR,
								message: res.__("admin.system.something_going_wrong_please_try_again"),
								options: options
							}
							return resolve(resolveResponse);
						}
						for (let i = 0; i < result.length; i++) {
							let records = (result[i]) ? result[i] : "";

							let selectedHtml = "";
							for (let i = 0; i < selectedValues.length; i++) {

								if (String(selectedValues[i]) == String(records[columnKey])) {

									selectedHtml = 'selected="selected"';
								}
							}

							if (collection == TABLE_USERS) {
								if (columnEmail) {
									finalHtml += '<option value="' + records[columnKey] + '" ' + selectedHtml + '>' + records[columnValue] + ' (' + records.email + ') </option>';
								} else {
									finalHtml += '<option value="' + records[columnKey] + '" ' + selectedHtml + '>' + records[columnValue] + ' </option>';
								}
							} else {
								let pages_descriptions = (records.pages_descriptions) ? records.pages_descriptions : "";
								var name = (pages_descriptions && pages_descriptions[lang_code] && pages_descriptions[lang_code][columnValue]) ? pages_descriptions[lang_code][columnValue] : records[columnValue];
								finalHtml += '<option value="' + records[columnKey] + '" ' + selectedHtml + '>' + name + '</option>';
							}
						}
						finalHtmlData[j] = finalHtml;
						if (Object.keys(collections).length - 1 == index) {
							if (!responseSend) {
								let resolveResponse = {
									status: STATUS_SUCCESS,
									final_html_data: finalHtmlData,
									options: options
								}
								return resolve(resolveResponse);
							}
						}
						index++;

					})

				} else {
					if (!responseSend) {
						let resolveResponse = {
							status: STATUS_ERROR,
							message: res.__("admin.system.missing_parameters"),
							options: options
						}
						resolve(resolveResponse);
					}
					index++;
				}
			});
		} else {
			let resolveResponse = {
				status: STATUS_ERROR,
				message: res.__("admin.system.missing_parameters"),
				options: options
			}
			resolve(resolveResponse);
		}
	});
}//End getDropdownList()


/**
 * Function to get data base slug
 *
 * @param tableName AS Table Name
 * @param title AS Title
 * @param slugField AS Slug Field Name in database
 *
 * @return string
 */
getDatabaseSlug = (options) => {
	return new Promise(resolve => {
		let tableName = (options && options.table_name) ? options.table_name : "";
		let title = (options && options.title) ? options.title : "";
		let slugField = (options && options.slug_field) ? options.slug_field : "";
		const slug = require('slug');

		if (title == '' || tableName == "") return resolve({ title: "", options: options });

		let convertTitleIntoSlug = slug(title).toLowerCase();
		let collectionName = db.collection(String(tableName));

		/** Set conditions **/
		let conditions = {};
		conditions[slugField] = { $regex: new RegExp(convertTitleIntoSlug, "i") };

		/** Get count from table **/
		let optionObj = {
			conditions: conditions,
			collection: tableName,
		}
		DbClass.getCountDocuments(optionObj).then(countResult => {
			let responseStatus = (countResult.status) ? countResult.status : "";
			let count = (countResult.result) ? countResult.result : "";

			/** Send response **/
			resolve({
				title: (count > 0) ? convertTitleIntoSlug + '-' + count : convertTitleIntoSlug,
				options: options
			});
		});
	});
}//end getDatabaseSlug();


/**
 * Function to upload image
 *
 * @param options	As data in Object
 *
 * @return json
 */
moveUploadedFile = (req, res, options) => {
	return new Promise(resolve => {
		let image = (options && options.image) ? options.image : "";
		let filePath = (options && options.filePath) ? options.filePath : "";
		let oldPath = (options && options.oldPath) ? options.oldPath : "";
		let allowedExtensions = (options && options.allowedExtensions) ? options.allowedExtensions : ALLOWED_IMAGE_EXTENSIONS;
		let allowedImageError = (options && options.allowedImageError) ? options.allowedImageError : ALLOWED_IMAGE_ERROR_MESSAGE;
		let allowedMimeTypes = (options && options.allowedMimeTypes) ? options.allowedMimeTypes : ALLOWED_IMAGE_MIME_EXTENSIONS;
		let allowedMimeError = (options && options.allowedMimeError) ? options.allowedMimeError : ALLOWED_IMAGE_MIME_ERROR_MESSAGE;

		if (image == '') {
			/** Send success response **/
			let response = {
				status: STATUS_SUCCESS,
				fileName: oldPath,
				options: options
			};
			resolve(response);
		} else {
			let fileData = (image.name) ? image.name.split('.') : [];
			let imageName = (image.name) ? image.name : '';
			let extension = (fileData) ? fileData.pop().toLowerCase() : '';
			if (allowedExtensions.indexOf(extension) == -1) {
				/** Send error response **/
				let response = {
					status: STATUS_ERROR,
					message: allowedImageError,
					options: options
				};
				resolve(response);
			} else {
				/** Create new folder of this month **/
				let newFolder = (newDate("", "mmm") + newDate("", "yyyy")).toUpperCase() + '/';
				createFolder(filePath + newFolder);

				let newFileName = newFolder + Date.now() + '-' + changeFileName(imageName);
				//let newFileName =  Date.now() + '-' + changeFileName(imageName);
				//let uploadedFile = filePath + newFileName;
				

				// const path = require('path');
				 let uploadedFile = path.join(filePath, newFileName);


				/** move image to folder*/
				image.mv(uploadedFile, (err) => {
					if (err) {
						/** Send error response **/
						let response = {
							status: STATUS_ERROR,
							message: res.__("admin.system.something_going_wrong_please_try_again"),
							options: options
						};
						resolve(response);
					} else {
						/** check mime type*/
						const child_process = require('child_process');
						child_process.exec('file --mime-type -b ' + uploadedFile, (err, out, code) => {

							if (allowedMimeTypes.indexOf(out.trim()) == -1) {
								fs.unlink(uploadedFile, (err) => {
									if (err) {
										/** Send error response **/
										let response = {
											status: STATUS_ERROR,
											message: res.__("admin.system.something_going_wrong_please_try_again"),
											options: options
										};
										resolve(response);
									} else {
										/** Send error response **/
										let response = {
											status: STATUS_ERROR,
											message: allowedMimeError,
											options: options
										};
										resolve(response);
									}
								});
							} else {
								if (oldPath != '') {
									let imagesData = {
										file_path: filePath + oldPath
									}
									/** remove old images*/
									removeFile(imagesData).then((imageResponse) => {
										/** Send success response **/
										let response = {
											status: STATUS_SUCCESS,
											fileName: newFileName,
											options: options
										};
										resolve(response);
									});
								} else {
									/** Send success response **/
									let response = {
										status: STATUS_SUCCESS,
										fileName: newFileName,
										options: options
									};
									resolve(response);
								}
							}
						});
					}
				});
			}
		}
	});
}//End moveUploadedFile()


/**
 * Function used to generate bcrypt password.
 *
 * @param options	As data in Object
 *
 * @return json
 */
bcryptPasswordGenerate = (passwordString) => {
	return new Promise(resolve => {
		const saltRounds = 10;
		if (passwordString != "") {
			bcrypt.hash(passwordString, saltRounds).then(function (bcryptPassword) {
				return resolve(bcryptPassword);
			});
		} else {
			return resolve('');
		}
	});
}


/**
 * Function to genrate random otp
 *
 * @param null
 *
 * @return OTP
 */
getRandomOTP = (otp_digits = FOUR_DIGIT_OTP) => {
	var random = require("node-random");
	return new Promise(resolve => {
		if (otp_digits == SIX_DIGIT_OTP) {
			//resolve(Math.floor(100000 + Math.random() * 9000));
			resolve(123456);
		}
		else {
			//resolve(Math.floor(1000 + Math.random() * 9000));
			resolve(1234);
		}
	});
}//end getRandomOTP();


/**
Function for use to calculate age of year
**/
calculateAge = (dateofbirth) => {

	var array = new Array();
	//split string and store it into array
	array = dateofbirth.split('-');

	let birth_month = array[1];
	let birth_day = array[0];
	let birth_year = array[2];


	today_date = new Date();
	today_year = today_date.getFullYear();
	today_month = today_date.getMonth();
	today_day = today_date.getDate();
	age = today_year - birth_year;

	if (today_month < (birth_month - 1)) {
		age--;
	}
	if (((birth_month - 1) == today_month) && (today_day < birth_day)) {
		age--;
	}
	return age;
}


sendMail = async (req, res, options = {}) => {
	try {
		// Extract options and defaults
		const to = options.to || "";
		const repArray = options.rep_array || [];
		const action = options.action || "";
		const attachments = options.attachments || "";
		let subject = options.subject || "";

		if (to) {

			// Get email settings from the response locals
			const { settings } = res.locals;
			const userEmail = settings["Email.user_email"];
			const emailHost = settings["Email.host"];
			const emailPassword = settings["Email.password"];
			const emailUserName = settings["Email.user_name"];
			const emailPort = settings["Email.port"];

			// Configure the transporter
			const transporter = nodemailer.createTransport({
				host: emailHost,
				port: emailPort,
				secure: emailPort === 465, // true for port 465, false otherwise
				auth: { user: userEmail, pass: emailPassword },
				tls: { rejectUnauthorized: true },
			});

			const email_templates = db.collection(TABLE_EMAIL_TEMPLATES);
			const email_actions = db.collection(TABLE_EMAIL_ACTIONS);

			// Fetch email template details
			const emailTemplateResult = await email_templates.findOne(
				{ action },
				{ projection: { _id: 1, name: 1, subject: 1, body: 1 } }
			);

			if (!emailTemplateResult) {
				return;
			}

			// Fetch email action details
			const emailAction = await email_actions.findOne(
				{ action },
				{ projection: { _id: 1, options: 1 } }
			);
			if (!emailAction) {
				return;
			}

			const actionOptions = emailAction.options.toString().split(",");
			let body = emailTemplateResult.body;
			subject = subject || emailTemplateResult.subject;

			// Replace placeholders in the email body
			actionOptions.forEach((value, key) => {
				body = body.replace(new RegExp(`{${value}}`, "g"), repArray[key]);
			});

			// Render email layout using EJS
			const htmlTemplatePath = `${WEBSITE_LAYOUT_PATH}email.html`;
			const renderedHtml = await ejs.renderFile(htmlTemplatePath, { settings });

			const htmlContent = renderedHtml.replace(/{{MESSAGE_BODY}}/g, body);

			// Prepare mail options
			const mailOptions = {
				from: emailUserName,
				to,
				subject,
				html: htmlContent,
			};

			if (attachments) {
				mailOptions.attachments = { path: attachments };
			}

			// Send email
			const info = await transporter.sendMail(mailOptions);

			// Log email details
			const email_logs = db.collection(TABLE_EMAIL_LOGS);
			await email_logs.insertOne({
				...mailOptions,
				created: new Date().toISOString(),
				error: null,
			});
		}
	}
	catch (error) {
		// Log the error
		const email_logs = db.collection(TABLE_EMAIL_LOGS);
		await email_logs.insertOne({
			to: options.to,
			subject: options.subject,
			error: error.message,
			created: new Date().toISOString(),
		});
	}
};


/**
 * Function to send Email
 *
 * @param to		As Recipient Email Address
 * @param repArray  As Response Array
 * @param action  	As Email Action
 *
 * @return array
 */
sendMailFromCron = async (req, res, options = {}) => {
	try {
		// Extract options and defaults
		const to = options.to || "";
		const attachments = options.attachments || "";
		let subject = options.subject || "";
		let body = options.message || "";

		if (to) {

			// Get email settings from the response locals
			const { settings } = res.locals;
			const userEmail = settings["Email.user_email"];
			const emailHost = settings["Email.host"];
			const emailPassword = settings["Email.password"];
			const emailUserName = settings["Email.user_name"];
			const emailPort = settings["Email.port"];

			// Configure the transporter
			const transporter = nodemailer.createTransport({
				host: emailHost,
				port: emailPort,
				secure: emailPort === 465, // true for port 465, false otherwise
				auth: { user: userEmail, pass: emailPassword },
				tls: { rejectUnauthorized: true },
			});

			// Render email layout using EJS
			const htmlTemplatePath = `${WEBSITE_LAYOUT_PATH}email.html`;
			const renderedHtml = await ejs.renderFile(htmlTemplatePath, { settings });

			const htmlContent = renderedHtml.replace(/{{MESSAGE_BODY}}/g, body);

			// Prepare mail options
			const mailOptions = {
				from: emailUserName,
				to,
				subject,
				html: htmlContent,
			};

			if (attachments) {
				mailOptions.attachments = { path: attachments };
			}

			// Send email
			const info = await transporter.sendMail(mailOptions);

			// Log email details
			const email_logs = db.collection(TABLE_EMAIL_LOGS);
			await email_logs.insertOne({
				...mailOptions,
				created: new Date().toISOString(),
				error: null,
			});
		}
	}
	catch (error) {
		// Log the error
		const email_logs = db.collection(TABLE_EMAIL_LOGS);
		await email_logs.insertOne({
			to: options.to,
			subject: options.subject,
			error: error.message,
			created: new Date().toISOString(),
		});
	}
};


/**
 *  Function to create a new folder
 *
 * @param path	As	folder path
 *
 * @return Object
 */
createFolder = (path) => {
	return new Promise(resolve => {
		const async = require('async');
		let filePathData = path.split('/');
		let fullPath = "/";
		if (filePathData.length > 0) {
			async.each(filePathData, (folderName, asyncCallback) => {
				if (folderName != "") {
					fullPath += folderName + "/";
				}
				if (!fs.existsSync(fullPath)) {
					fs.mkdirSync(fullPath);
				}
				asyncCallback(null);
			}, asyncErr => {
				/** Send success response **/
				resolve({ status: STATUS_SUCCESS });
			});
		} else {
			/** Send success response **/
			resolve({ status: STATUS_SUCCESS });
		}
	});
}// end createFolder()


/**
 * Function for change file name
 *
 * @param fileName AS File Name
 *
 * @return filename
 */
changeFileName = (fileName) => {
	let fileData = (fileName) ? fileName.split('.') : [];
	let extension = (fileData) ? fileData.pop() : '';
	fileName = fileName.replace('.' + extension, '');
	fileName = fileName.replace(RegExp('[^0-9a-zA-Z\.]+', 'g'), '');
	fileName = fileName.replace('.', '');
	return fileName + '.' + extension;
}//end changeFileName();


/**
 * Function to Make full image path and check file is exist or not
 *
 * @param options As data in Object format (like :-  file url,file path,result,database field name)
 *
 * @return json
 */
appendFileExistData = (options) => {
	return new Promise(resolve => {
		var fileUrl = (options.file_url) ? options.file_url : "";
		var filePath = (options.file_path) ? options.file_path : "";
		var result = (options.result) ? options.result : "";
		var databaseField = (options.database_field) ? options.database_field : "";
		var image_placeholder = (options.image_placeholder) ? options.image_placeholder : IMAGE_FIELD_NAME;
		var noImageAvailable = (options.no_image_available) ? options.no_image_available : NO_IMAGE_AVAILABLE;

		if (result.length > 0) {
			let index = 0;
			result.forEach((record, recordIndex) => {
				var file = (record[databaseField] != '' && record[databaseField] != undefined) ? filePath + record[databaseField] : '';
				result[recordIndex][image_placeholder] = noImageAvailable;
				/** Set check file data **/
				let checkFileData = {
					"file": file,
					"file_url": fileUrl,
					"image_name": record[databaseField],
					"record_index": recordIndex,
					"no_image_available": noImageAvailable
				}

				checkFileExist(checkFileData).then((fileResponse) => {
					let recordIndexResponse = (typeof fileResponse.record_index !== typeof undefined) ? fileResponse.record_index : "";
					let imageResponse = (fileResponse.file_url) ? fileResponse.file_url : "";
					result[recordIndexResponse][image_placeholder] = imageResponse;

					if (result.length - 1 == index) {
						/** Send response **/
						let response = {
							result: result,
							options: options
						};
						resolve(response);
					}
					index++;
				});
			});
		} else {
			/** Send response **/
			let response = {
				result: result,
				options: options
			};
			resolve(response);
		}
	});
}//End appendFileExistData()


/**
 * Function to check a file is exist in folder or not
 *
 * @param options As data in Object format (like :-  file,file url,image name,index)
 *
 * @return  json
 */
checkFileExist = (options) => {
	return new Promise(resolve => {
		var file = (options.file) ? options.file : "";
		var fileUrl = (options.file_url) ? options.file_url : "";
		var imageName = (options.image_name) ? options.image_name : "";
		var recordIndex = (typeof options.record_index !== typeof undefined) ? options.record_index : "";
		var noImageAvailable = (options.no_image_available) ? options.no_image_available : "";

		fs.stat(file, (err, stat) => {
			if (!err) {
				/** Send response **/
				let response = {
					file_url: fileUrl + imageName,
					record_index: recordIndex,
					options: options
				};
				resolve(response);
			} else {
				/** Send response **/
				let response = {
					file_url: (noImageAvailable) ? noImageAvailable : NO_IMAGE_AVAILABLE,
					record_index: recordIndex,
					options: options
				};
				resolve(response);
			}
		});
	})
}//end checkFileExist()


/**
 *  Function to generate a random sting
 *
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options	As options
 *
 * @return string
 */
getRandomString = (req, res, options) => {
	return new Promise(resolve => {
		let srtingLength = (options && options.srting_length) ? parseInt(options.srting_length) : 8;
		/**Generate random string **/

		let unique = randomstring.generate({
			length: srtingLength,
			charset: 'alphanumeric',
			capitalization: 'uppercase'
		});
		return resolve({
			status: STATUS_SUCCESS,
			result: unique,
			options: options
		});
	})
}


/**
 * Function used to convert
 *
 * @param options	As data in Object
 *
 * @return json
 */
convertMultipartReqBody = function (req, res, next) {
	convertMultipartFormData(req, res).then(() => {
		return next();
	})
}


/**
 * Function to convert multipart form data
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
convertMultipartFormData = (req, res) => {
	return new Promise(resolve => {
		if (req.body && Object.keys(req.body).length > 0) {
			Object.keys(req.body).forEach((key) => {
				try {
					req.body[key] = JSON.parse(req.body[key]);
				} catch (e) {
					req.body[key] = req.body[key];
				}
			});
		}
		if (req.files && Object.keys(req.files).length > 0) {
			Object.keys(req.files).forEach((key) => {
				try {
					key = JSON.parse(key);
				} catch (e) {
					key = key;
				}
				try {
					req.files[key] = JSON.parse(req.files[key]);
				} catch (e) {
					req.files[key] = req.files[key];
				}
			});
		}
		resolve();
	});
}//end convertMultipartFormData();


/**
 * Function to convert multipart form data
 *
 * @param req As Request Data
 * @param res As Response Data
 *
 * @return json
 */
convertMultipartFormDataOld = (req, res) => {
	return new Promise(resolve => {
		if (req.body && Object.keys(req.body).length > 0) {
			Object.keys(req.body).forEach((key) => {
				try {
					req.body[key] = JSON.parse(req.body[key]);
				} catch (e) {
					req.body[key] = req.body[key];
				}
			});
		}
		if (req.files && Object.keys(req.files).length > 0) {
			Object.keys(req.files).forEach((key) => {
				try {
					key = JSON.parse(key);
				} catch (e) {
					key = key;
				}
				try {
					req.files[key] = JSON.parse(req.files[key]);
				} catch (e) {
					req.files[key] = req.files[key];
				}
			});
		}
		resolve();
	});
}//end convertMultipartFormData();


/**
 * function is used to clear regular expression string
 *
 * @param regex	As Regular expression
 *
 * @return regular expression
 */
cleanRegex = (regex) => {
	if (NOT_ALLOWED_CHARACTERS_FOR_REGEX && NOT_ALLOWED_CHARACTERS_FOR_REGEX.length > 0) {
		for (let i in NOT_ALLOWED_CHARACTERS_FOR_REGEX) {
			regex = regex.split(NOT_ALLOWED_CHARACTERS_FOR_REGEX[i]).join('\\' + NOT_ALLOWED_CHARACTERS_FOR_REGEX[i]);
		}
		return regex;
	} else {
		return regex;
	}
}//end cleanRegex


/**
 * Function to get current timestamp
 *
 * @param null
 *
 * @return timestamp
 */
currentTimeStamp = () => {
	return new Date().getTime();
};//end currentTimeStamp();


/**
 *  Function is genrate notification url
 *
 * @param req As request Data
 *
 * @return Json
 */
generateNotificationUrl = (req, res, options) => {
	return new Promise(resolve => {
		let notificationList = [];
		let notificationData = (options.result) ? options.result : [];
		if (!notificationData || notificationData.length < 1) {
			return resolve({ data: [], options: options });
		}

		notificationData.map((notification) => {
			let type = (notification.notification_type) ? notification.notification_type : "";
			let extraParams = (notification.extra_parameters) ? notification.extra_parameters : "";

			switch (type) {
				case NOTIFICATION_USER_REGISTER:
					if (extraParams.user_id && extraParams.user_type) {
						notification["url"] = WEBSITE_ADMIN_URL + "users/" + extraParams.user_type + "/view/" + extraParams.user_id;
					} else {
						notification["url"] = "javascript:void(0);";
					}
					break;
				default:
					notification["url"] = "javascript:void(0);";
			}
			notificationList.push(notification);
		});
		resolve({ data: notificationList, options: options });
	});
};//End generateNotificationUrl()


/**
 * Function for remove file from root path
 *
 * @param options As data in file root path
 *
 * @return json
 */
removeFile = (options) => {
	return new Promise(resolve => {
		var filePath = (options.file_path) ? options.file_path : "";
		let response = {
			status: STATUS_SUCCESS,
			options: options
		};

		if (filePath != "") {
			/** remove file **/
			fs.unlink(filePath, (err) => {
				if (!err) {
					/** Send success response **/
					resolve(response);
				} else {
					/** Send error response **/
					response.status = STATUS_ERROR;
					resolve(response);
				}
			});
		} else {
			/** Send error response **/
			response.status = STATUS_ERROR;
			resolve(response);
		}
	})
}//end removeFile()


/** Function used to update attribute name in product whenever it is updated
 * 
 * @param options	As data in Object
 *
 * @return json
 */
updateOptionName = (req, res, options) => {
	return new Promise(resolve => {

		let option_id = (options.option_id) ? options.option_id : '';
		let title = (options.title) ? options.title : '';
		let option_descriptions = (options.option_descriptions) ? options.option_descriptions : {};

		let response = {
			status: STATUS_SUCCESS,
			options: options
		};
		let condition = {};
		let updateData = {};

		if (option_id) {

			condition = {
				'attributes.option_id': new ObjectId(option_id)
			}

			updateData = {
				'attributes.$.option_name': title,
				'pages_descriptions.en.attributes.$.option_name': (option_descriptions[DEFAULT_LANGUAGE_CODE].title) ? option_descriptions[DEFAULT_LANGUAGE_CODE].title : title,
				'pages_descriptions.ar.attributes.$.option_name': (option_descriptions[ARABIC_LANGUAGE_CODE].title) ? option_descriptions[ARABIC_LANGUAGE_CODE].title : ''
			}

			let updateOptions = {
				conditions: condition,
				updateData: { $set: updateData },
				collection: TABLE_PRODUCTS
			}

			DbClass.updateManyRecords(req, res, updateOptions).then(updateResponse => {
				if (updateResponse.status == STATUS_ERROR) {
					/** Send error response **/
					response.status = STATUS_ERROR;
					resolve(response);
				} else {
					resolve(response);
				}
			})
		} else {
			/** Send error response **/
			response.status = STATUS_ERROR;
			resolve(response);
		}
	});
}


/**
 * Function to Check request is called from mobile of web
 *
 * @param req	As Request Data
 * @param res	As Response Data
 *
 * @return boolean
 */
isMobileApi = (req, res) => {
	if (typeof req.headers !== typeof undefined && typeof req.headers.authkey !== undefined && req.headers.authkey == WEBSITE_HEADER_AUTH_KEY && typeof req.route !== typeof undefined && typeof req.route.path !== typeof undefined && req.route.path == '/mobile_api') {
		return true;
	} else {
		return false;
	}
}//End isMobileApi()


/**
	 * Function to get user data by slug
	 *
	 * @param req		As	Request Data
	 * @param res		As 	Response Data
	 * @param options	As  object of data
	 *
	 * @return json
	 **/
getUserDetailBySlug = (req, res, options) => {
	return new Promise(resolve => {
		let conditions = (options.conditions) ? options.conditions : {};
		let fields = (options.fields) ? options.fields : {};

		if (!conditions) {
			/** Send error response **/
			return resolve({
				status: STATUS_ERROR,
				options: options,
				message: res.__("system.something_going_wrong_please_try_again")
			});
		}

		/** Get user details **/
		let aggConditions = [
			{ $match: conditions },
		];

		let userOptions = {
			conditions: aggConditions,
			collection: TABLE_USERS
		}

		DbClass.getAggregateResult(req, res, userOptions).then(userResponse => {
			let status = userResponse.status;
			let result = userResponse.result;
			if (status == STATUS_ERROR) {
				/** Send error response */
				let response = {
					status: STATUS_ERROR,
					options: options,
					message: res.__("system.something_going_wrong_please_try_again")
				};
				return resolve(response);
			}
			if (!result) {
				/** Send success response */
				return resolve({
					status: STATUS_ERROR,
					result: false,
					options: options,
				});
			}

			/** Send success response **/
			if (result) {
				/** Send success response */
				return resolve({
					status: STATUS_SUCCESS,
					result: result[0],
					options: options,
				});
			} else {
				/** Send success response */
				return resolve({
					status: STATUS_ERROR,
					result: false,
					options: options,
				});
			}
		});
	})

}// end getUserDetailBySlug()


/**
 * Function used to return api result
 *
 * @param response	As data in Object
 *
 * @return json
 */
returnApiResult = (req, res, response) => {
	var result = JSON.stringify(response.data);

	var utf8 = require("utf8");
	var myJSON = utf8.encode(result);
	let debugJsonView = req.body.debugJsonView ? req.body.debugJsonView : DEACTIVE;
	let apiType = req.body.api_type ? req.body.api_type : "";
	let isCrypto = req.body.is_crypto ? req.body.is_crypto : "";

	if (debugJsonView == 0) {
		if (apiType == MOBILE_API_TYPE) {
			let convertBtoA = btoa(myJSON);
			let convertEncrypt = encryptCryptoMobile(convertBtoA);
			return res.send({
				response: isCrypto == ACTIVE ? convertEncrypt : convertBtoA,
			});
		} else {
			let convertBtoA = btoa(myJSON);
			let convertEncrypt = encryptCrypto(convertBtoA);
			return res.send({
				response: isCrypto == ACTIVE ? convertEncrypt : convertBtoA,
			});
		}
	} else {
		return res.send({
			response: JSON.parse(myJSON),
		});
	}
};


/**
 *This function is used to string to encrypt crypto convert
 */
encryptCrypto = (textString) => {
	try {
		const cipher = crypto.createCipheriv("aes-256-ctr", CRYPTO_ENCRYPT_DECRYPT_API_KEY, CRYPTO_ENCRYPT_DECRYPT_API_IV);
		let crypted = cipher.update(textString, 'utf8', 'hex');
		crypted += cipher.final('hex');
		return crypted;
	} catch (error) {
		console.error("encryptUsingNodeCrypto: An error occurred: ", error);
		throw error;
	}
}




/**
 * Function to parse validation front api
**/
parseValidationFrontApi = (validationErrors, req) => {
	var usedFields = [];
	var newValidations = [];
	if (Array.isArray(validationErrors)) {
		validationErrors.forEach(function (item) {

			if (usedFields.indexOf(item.path) == -1) {
				usedFields.push(item.path);
				newValidations[item.path] = [];
				newValidations[item.path].push(item.msg);
			}
		});
		let obj = {};
		for (var key in newValidations) {
			obj[key] = newValidations[key]
		}
		return obj;
	} else {
		return false;
	}
}


/**
 * Function used to check attributes are sellected and unique
 *
 * @param options	As data in Object
 *
 * @return json
 */
checkAllAttributesSelectedAndUnique = (req, res) => {
	return new Promise(resolve => {
		req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
		let subCategory = (req.body.sub_category_1) ? (req.body.sub_category_1) : "";
		let productCode = (req.body.product_code) ? (req.body.product_code) : "";
		let attributes = (req.body.attribute) ? (req.body.attribute) : [];


		if (attributes.length == DEACTIVE) {
			/** Send error response if no option selected **/
			finalResponse = {
				status: STATUS_ERROR,
				message: res.__("front.ads.please_select_options_for_all_attributes")
			};
			return resolve(finalResponse);
		}
		else {
			let condition = {
				status: ACTIVE, _id: new ObjectId(subCategory)
			};
			let fields = {
				_id: 1, category_name: 1, attribute_id: 1
			}
			let options = {
				conditions: condition,
				fields: fields,
				collection: TABLE_CATEGORIES
			};

			DbClass.getFindOne(options).then(categoryResponse => {
				var catAttributes = (categoryResponse.result && categoryResponse.result.attribute_id) ? categoryResponse.result.attribute_id : "";
				catAttributes = catAttributes.map(function (e) { return e.toString() });

				/* Check options are selected for all arrtibutes */
				var attributeNotSelected = false;
				var attributeCondition = [];
				asyncEachSeries(attributes, (record, callback) => {
					let attributeId = (record && record.attribute_id) ? new ObjectId(record.attribute_id) : "";
					let optionId = (record && record.option_value) ? new ObjectId(record.option_value) : "";

					/* Attribute id is exists */
					if (catAttributes.indexOf(attributeId.toString()) !== -1 && optionId != "") {
						/* Insert condition for attribute */
						let conditionArr = {
							"attribute.attribute_id": attributeId,
							"attribute.option_id": optionId,
						};
						attributeCondition.push(conditionArr);
					}
					else {
						attributeNotSelected = true;
					}
					callback(null, null);
				}, () => {
					if (attributeNotSelected == true) {
						/** Send error response if no option selected **/
						finalResponse = {
							status: STATUS_ERROR,
							message: res.__("front.ads.please_select_options_for_all_attributes")
						};
						return resolve(finalResponse);
					}
					else if (productCode == "") {
						/** Send success response if product is not selected **/
						finalResponse = {
							status: STATUS_SUCCESS,
						};
						return resolve(finalResponse);
					}
					else {
						let commonConditions = {
							"is_active": ACTIVE,
							"is_deleted": DEACTIVE,
							"is_sold": DEACTIVE,
							"is_block": DEACTIVE,
							"product_code": productCode,
							"sub_category_1": new ObjectId(subCategory),
							"$and": attributeCondition
						};
						let options = {
							conditions: commonConditions,
							collection: TABLE_PRODUCTS
						}
						DbClass.getFindAllWithoutLimit(options).then(productResponse => {

							if (productResponse.result.length > DEACTIVE) {
								/** Send error response if product is already exists with same option selected **/
								finalResponse = {
									status: STATUS_ERROR,
									message: res.__("front.ads.product_is_aready_exists_for_this_option")
								};
								return resolve(finalResponse);
							}
							else {
								/** Send success response if no product is have these option selected **/
								finalResponse = {
									status: STATUS_SUCCESS,
								};
								return resolve(finalResponse);
							}
						});
					}
				});
			});
		}

	});
} // End checkAllAttributesSelectedAndUnique()







































/**
 *  Function to formatProductList
 *
 * @param list array
 *
 * @return list array
 */
formatProductList = (req, res, postResult) => {
	let languageCode = (req.body.lang_code) ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

	return new Promise(resolve => {
		let finalResult = [];

		if (postResult && postResult.length > 0) {
			asyncEachSeries(postResult, function iteratee(records, callback) {
				records.product_title = (records.pages_descriptions && records.pages_descriptions[languageCode] && records.pages_descriptions[languageCode].product_title) ? records.pages_descriptions[languageCode].product_title : ((records.product_title) ? records.product_title : "");
				records.parent_category_name = (records.pages_descriptions && records.pages_descriptions[languageCode] && records.pages_descriptions[languageCode].parent_category_name) ? records.pages_descriptions[languageCode].parent_category_name : ((records.parent_category_name) ? records.parent_category_name : "");
				records.sub_category_1_name = (records.pages_descriptions && records.pages_descriptions[languageCode] && records.pages_descriptions[languageCode].sub_category_1_name) ? records.pages_descriptions[languageCode].sub_category_1_name : ((records.sub_category_1_name) ? records.sub_category_1_name : "");
				records.sub_category_2_name = (records.pages_descriptions && records.pages_descriptions[languageCode] && records.pages_descriptions[languageCode].sub_category_2_name) ? records.pages_descriptions[languageCode].sub_category_2_name : ((records.sub_category_2_name) ? records.sub_category_2_name : "");

				records.detailed_description = (records.pages_descriptions && records.pages_descriptions[languageCode] && records.pages_descriptions[languageCode].detailed_description) ? records.pages_descriptions[languageCode].detailed_description : ((records.detailed_description) ? records.detailed_description : "");
				records.brief_description = (records.pages_descriptions && records.pages_descriptions[languageCode] && records.pages_descriptions[languageCode].brief_description) ? records.pages_descriptions[languageCode].brief_description : ((records.brief_description) ? records.brief_description : "");
				records.attribute = (records.pages_descriptions && records.pages_descriptions[languageCode] && records.pages_descriptions[languageCode].attribute) ? records.pages_descriptions[languageCode].attribute : ((records.attribute) ? records.attribute : []);

				delete records['pages_descriptions'];

				finalResult.push(records);
				callback(null);
			}, () => {
				resolve(finalResult);
			});
		} else {
			resolve(postResult);
		}
	});
}// end formatAdList()


getCartDetail = (req, res, userId) => {
	return new Promise(resolve => {
		let languageCode = (req.body.lang_code) ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let conditions = [
			{ $match: { "user_id": new ObjectId(userId) } },
			{
				$lookup: {
					"from": TABLE_CART_ITEMS,
					"let": { "userId": userId },
					"pipeline": [
						{
							"$match": {
								"$expr": {
									"$eq": ["$user_id", "$$userId"]
								}
							}
						},
						{
							$lookup: {
								"from": TABLE_PRODUCTS,
								"let": { productId: "$product_id" },
								"pipeline": [
									{
										'$match': {
											'$expr': {
												'$and': [
													{ '$eq': ['$_id', '$$productId'] },
												]
											},
										}
									},
									{
										$project: {
											_id: 1,
											main_image_name: 1,
											slug: 1,
											product_title: 1,
											mrp_price: 1,
											offer_price: 1,
											offer_type: 1,
											vat_included: 1,
											price: 1,
											parent_category: 1,
											quantity: 1,
											is_active: 1,
											status: 1,
											created: 1,
										}
									}


								],
								"as": "product_detail",
							}
						},

						{
							$lookup: {
								"from": TABLE_PACKAGES,
								"let": { packageId: "$package_id" },
								"pipeline": [
									{
										'$match': {
											'$expr': {
												'$and': [
													{ '$eq': ['$_id', '$$packageId'] },
												]
											},
										}
									},
									{
										$project: {
											_id: 1,
											package_image: 1,
											package_name: 1,
											car_type: 1,
											provider_type: 1,
											duration: 1,
											is_deleted: 1,
											is_active: 1,
											price: 1,
											mrp_price: 1,
											offer_price: 1,
											offer_type: 1,
											travel_time: 1,
											vat_included: 1,
											slug: 1,
										}
									}


								],
								"as": "package_detail",
							}
						},

						{
							$lookup: {
								"from": TABLE_SUBSCRIPTIONS,
								"let": { subscriptionId: "$subscription_id" },
								"pipeline": [
									{
										'$match': {
											'$expr': {
												'$and': [
													{ '$eq': ['$_id', '$$subscriptionId'] },
												]
											},
										}
									},
									{
										$project: {
											_id: 1,
											subscription_image: 1,
											subscription_name: 1,
											provider_type: 1,
											car_type: 1,
											is_deleted: 1,
											is_active: 1,
											price: 1,
											mrp_price: 1,
											offer_price: 1,
											offer_type: 1,
											vat_included: 1,
											travel_time: 1,
											slug: 1,
											duration: 1,
										}
									}


								],
								"as": "subscription_detail",
							}
						},

					],
					"as": "items",
				}
			},
			{
				$lookup: {
					let: { promoCode: "$promo_code" },
					from: TABLE_PROMO_CODES,
					pipeline: [{
						'$match': {
							'$expr': {
								'$and': [
									{ '$eq': ['$promo_code', '$$promoCode'] },
								]
							},
						}
					},
					{
						$project: {
							_id: 0,
							promo_code: 1,
							code_discount_type: 1,
							discount_value: 1,
							discount_percent: 1,
							min_order_value: 1,
							max_discount_amount: 1,
							code_valid_from: 1,
							code_valid_to: 1
						}
					}],
					as: "promoCodeDetails"
				}
			},
			{
				$lookup: {
					from: TABLE_USERS,
					localField: "user_id",
					foreignField: "_id",
					as: "user_details",
					pipeline: [
						{
							$project: {
								_id: 1,
								full_name: 1,
								email: 1,
								mobile_number: 1,
								b2b_code: 1,
								b2b_status: 1,
								b2b_order_number: 1,
								company_id: 1,
								b2b_code_details: 1,
							}
						}],

				}
			},
			{
				$project: {
					user_id: 1, items: 1, package_data: 1, subscription_data: 1, promocode_applied_ids: 1, latitude: 1, longitude: 1, b2b_discount_code_applied_ids: 1, area_ids: 1, promoCodeDetails: { $arrayElemAt: ["$promoCodeDetails", 0] }, user_details: { $arrayElemAt: ["$user_details", 0] }
				}
			}
		];

		let options = {
			'conditions': conditions
		};

		var totalItemMrpAmount = 0;
		var totalItemVatExcludedAmount = 0;
		var totalItemVatIncludedAmount = 0;
		var totalItemSellingAmount = 0;
		var totalItemDiscountOnMrpPrice = 0;
		var item_count = 0;
		var totalItemDiscount = 0;
		var totalPromoDiscount = 0;
		let newProductList = [];
		let totalItemQuantity = 0;

		let totalNumerOfProducts = 0;
		let totalQuantityOfProducts = 0;
		let totalSellingAmountOfProducts = 0;

		let totalNumerOfPackages = 0;
		let totalQuantityOfPackages = 0;
		let totalSellingAmountOfPackages = 0;

		let totalNumerOfSubscriptions = 0;
		let totalQuantityOfSubscriptions = 0;
		let totalSellingAmountOfSubscriptions = 0;

		/**function for get cart list */
		CartModel.getCartAggregateList(req, res, options).then(detailResponse => {

			let detailStatus = (detailResponse.status) ? detailResponse.status : "";
			let detailResult = (detailResponse.result) ? detailResponse.result : [];
			let cartDetail = (detailResult && detailResult[0]) ? detailResult[0] : {};

			if (detailStatus == STATUS_SUCCESS && detailResult && detailResult.length > 0) {

				let resultCart = cartDetail.items;
				let userDetails = cartDetail.user_details;

				let latitude = (cartDetail.latitude) ? cartDetail.latitude : "";
				let longitude = (cartDetail.longitude) ? cartDetail.longitude : "";
				let areaIds = (cartDetail.area_ids) ? cartDetail.area_ids : [];


				let package_data = (cartDetail.package_data) ? cartDetail.package_data : null;
				let subscription_data = (cartDetail.subscription_data) ? cartDetail.subscription_data : null;
				let promoCodeDetails = cartDetail.promoCodeDetails;

				let b2bDiscountCode = (userDetails && userDetails.b2b_code) ? userDetails.b2b_code : "";

				let promoCodeDiscountAmount = DEACTIVE;
				let promoCodeDiscountType = "";
				let promoCodeDiscountPercent = "";
				let promoCodeMaxDiscountAmount = "";
				let is_b2b_code = false;
				let b2b_code = null;
				let promocodeAppliedIds = [];

				if (b2bDiscountCode) {
					promocodeAppliedIds = (cartDetail && cartDetail.b2b_discount_code_applied_ids) ? cartDetail.b2b_discount_code_applied_ids : [];
					let b2bDiscountCodeDetails = userDetails.b2b_code_details;
					promoCodeDiscountAmount = (b2bDiscountCodeDetails && b2bDiscountCodeDetails.discount_amount) ? b2bDiscountCodeDetails.discount_amount : DEACTIVE;
					promoCodeDiscountType = (b2bDiscountCodeDetails && b2bDiscountCodeDetails.code_discount_type) ? b2bDiscountCodeDetails.code_discount_type : DEACTIVE;
					promoCodeDiscountPercent = (b2bDiscountCodeDetails && b2bDiscountCodeDetails.discount_amount) ? b2bDiscountCodeDetails.discount_amount : DEACTIVE;

					is_b2b_code = true;
					b2b_code = userDetails.b2b_code;
					/* promoCodeMaxDiscountAmount = (b2bDiscountCodeDetails && b2bDiscountCodeDetails.max_discount_amount) ? b2bDiscountCodeDetails.max_discount_amount : 100; */

				}
				else {
					promocodeAppliedIds = (cartDetail && cartDetail.promocode_applied_ids) ? cartDetail.promocode_applied_ids : [];
					promoCodeDiscountAmount = (promoCodeDetails && promoCodeDetails.discount_value) ? promoCodeDetails.discount_value : DEACTIVE;
					promoCodeDiscountType = (promoCodeDetails && promoCodeDetails.code_discount_type) ? promoCodeDetails.code_discount_type : DEACTIVE;
					promoCodeDiscountPercent = (promoCodeDetails && promoCodeDetails.discount_percent) ? promoCodeDetails.discount_percent : DEACTIVE;
					promoCodeMaxDiscountAmount = (promoCodeDetails && promoCodeDetails.max_discount_amount) ? promoCodeDetails.max_discount_amount : DEACTIVE;
				}


				item_count = resultCart.length;


				let totalItemMrpAmount01 = 0;


				/* CALCULATE DISCOUT PERCENTAGE FOR EACH PRODUCT  */
				async.each(resultCart, (records, parentCallback) => {
					let price = 0;
					let recordId = (records._id) ? records._id : DEACTIVE;
					/* check recordId in promocodeAppliedIds if yes then go  */
					if (promocodeAppliedIds.some(id => id.equals(recordId))) {
						let cartQuantity01 = (records.quantity) ? records.quantity : DEACTIVE;

						if (records.product_detail[0] && (typeof records.product_detail[0].price !== 'undefined')) {
							price = (records.product_detail[0].price) ? records.product_detail[0].price : DEACTIVE;
						}
						else if (records.package_detail[0] && (typeof records.package_detail[0].price !== 'undefined')) {
							price = (records.package_detail[0].price) ? records.package_detail[0].price : DEACTIVE;
						}
						else if (records.subscription_detail[0] && (typeof records.subscription_detail[0].price !== 'undefined')) {
							price = (records.subscription_detail[0].price) ? records.subscription_detail[0].price : DEACTIVE;
						}

						let perItemTotalPrice01 = price * cartQuantity01;
						totalItemMrpAmount01 += perItemTotalPrice01;
					}
				})
				
				if (promoCodeDiscountType == COUPON_DISCOUNT_TYPE_FIX) {
					discountInPercentage = (promoCodeDiscountAmount / totalItemMrpAmount01 * 100).toFixed(4);
				}
				else {
					discountInPercentage = promoCodeDiscountPercent;

					totalDiscountAccourdingToPercentage = Number(discountInPercentage * totalItemMrpAmount01) / 100;

					if (!is_b2b_code) {
						if (totalDiscountAccourdingToPercentage > promoCodeMaxDiscountAmount) {
							discountInPercentage = (promoCodeMaxDiscountAmount / totalItemMrpAmount01 * 100).toFixed(4);
						}
					}
				}
				/* CALCULATE DISCOUT PERCENTAGE FOR EACH PRODUCT  */


				async.each(resultCart, (records, parentCallback) => {
					let recordId = (records._id) ? records._id : DEACTIVE;
					records.product_detail['product_id'] = (records.product_detail) ? records.product_detail._id : 0;
					records['category_id'] = (records.product_detail && records.product_detail[0] && records.product_detail[0].parent_category) ? records.product_detail[0].parent_category : 0;

					records.product_detail['product_title'] = (records.product_detail['pages_descriptions'] && records.product_detail['pages_descriptions'][languageCode] && records.product_detail['pages_descriptions'][languageCode].product_title) ? records.product_detail['pages_descriptions'][languageCode].product_title : ((records.product_detail['product_title']) ? records.product_detail['product_title'] : "");

					delete records.product_detail['pages_descriptions'];

					/* details for each product */
					let itemId = records._id;
					let cartQuantity = (records.quantity) ? records.quantity : DEACTIVE;

					let price = 0;
					let discount = 0;
					let mrp_price = 0;
					let discount_on_mrp_price = 0;
					let vat_included_amount = 0;
					let vat_exclude_amount = 0;
					let vatInpercentage = 0;
					let vatExcludedAmount = 0;
					let vatIncludedAmount = 0;

					const vatOnProduct = Number(res.locals.settings["Vat.product_vat_amount"]);
					const vatOnPackage = Number(res.locals.settings["Vat.package_vat_amount"]);
					const vatOnSubscription = Number(res.locals.settings["Vat.subscription_vat_amount"]);


					if (records.product_detail[0] && (typeof records.product_detail[0].price !== 'undefined')) {
						price = (records.product_detail[0].price) ? records.product_detail[0].price : DEACTIVE;
						mrp_price = (records.product_detail[0].mrp_price) ? records.product_detail[0].mrp_price : DEACTIVE;

						/* check recordId in promocodeAppliedIds if yes then go  */
						if (promocodeAppliedIds.some(id => id.equals(recordId))) {
							discount = (price * (discountInPercentage / 100)).toFixed(2);
						}

						vatInpercentage = vatOnProduct;
						vat_included = (records.product_detail[0].vat_included) ? records.product_detail[0].vat_included : DEACTIVE;
						if (!vat_included) {
							vatExcludedAmount = formatToTwo(vatOnProduct * price / 100);
						}
						else {
							vatIncludedAmount = formatToTwo((vatOnProduct * price) / (100 + vatOnProduct));
						}

						totalNumerOfProducts += 1;
						totalQuantityOfProducts += cartQuantity;
						totalSellingAmountOfProducts += ((price - discount) * cartQuantity);
					}
					else if (records.package_detail[0] && (typeof records.package_detail[0].price !== 'undefined')) {
						price = (records.package_detail[0].price) ? records.package_detail[0].price : DEACTIVE;
						mrp_price = (records.package_detail[0].mrp_price) ? records.package_detail[0].mrp_price : DEACTIVE;

						/* check recordId in promocodeAppliedIds if yes then go  */
						if (promocodeAppliedIds.some(id => id.equals(recordId))) {
							discount = (price * (discountInPercentage / 100)).toFixed(2);
						}

						vatInpercentage = vatOnPackage;
						vat_included = (records.package_detail[0].vat_included) ? records.package_detail[0].vat_included : DEACTIVE;
						if (!vat_included) {
							vatExcludedAmount = formatToTwo(vatOnPackage * price / 100);
						}
						else {
							vatIncludedAmount = formatToTwo((vatOnPackage * price) / (100 + vatOnPackage));
						}

						totalNumerOfPackages += 1;
						totalQuantityOfPackages += cartQuantity;
						totalSellingAmountOfPackages += ((price - discount) * cartQuantity);
					}
					else if (records.subscription_detail[0] && (typeof records.subscription_detail[0].price !== 'undefined')) {
						price = (records.subscription_detail[0].price) ? formatToTwo(records.subscription_detail[0].price) : DEACTIVE;
						mrp_price = (records.subscription_detail[0].mrp_price) ? records.subscription_detail[0].mrp_price : DEACTIVE;

						/* check recordId in promocodeAppliedIds if yes then go  */
						if (promocodeAppliedIds.some(id => id.equals(recordId))) {
							discount = (price * (discountInPercentage / 100)).toFixed(2);
						}

						vatInpercentage = vatOnSubscription;
						vat_included = (records.subscription_detail[0].vat_included) ? records.subscription_detail[0].vat_included : DEACTIVE;
						if (!vat_included) {
							vatExcludedAmount = formatToTwo(vatOnSubscription * price / 100);
						}
						else {
							vatIncludedAmount = formatToTwo((vatOnSubscription * price) / (100 + vatOnSubscription));
						}

						totalNumerOfSubscriptions += 1;
						totalQuantityOfSubscriptions += cartQuantity;
						totalSellingAmountOfSubscriptions += ((price - discount) * cartQuantity);
					}


					let perItemPrice = price;
					let perItemDiscount = discount;
					let perItemSellingPrice = price - discount;
					let perItemDiscountOnMrpPrice = mrp_price - price;

					let perItemTotalPrice = perItemPrice * cartQuantity;
					let perItemTotalDiscount = perItemDiscount * cartQuantity;
					let perItemTotalSellingPrice = perItemSellingPrice * cartQuantity;
					let perItemTotalDiscountOnMrpPrice = perItemDiscountOnMrpPrice * cartQuantity;

					let perItemTotalVatExcludedAmount = vatExcludedAmount * cartQuantity;
					let perItemTotalVatIncludedAmount = vatIncludedAmount * cartQuantity;

					perItemTotalSellingPrice = perItemTotalSellingPrice + perItemTotalVatExcludedAmount;

					totalItemQuantity += cartQuantity;
					totalItemMrpAmount += perItemTotalPrice;
					totalItemVatExcludedAmount += perItemTotalVatExcludedAmount;
					totalItemVatIncludedAmount += perItemTotalVatIncludedAmount;
					totalItemDiscount += perItemTotalDiscount;
					totalItemSellingAmount += perItemTotalSellingPrice;
					totalItemDiscountOnMrpPrice += perItemTotalDiscountOnMrpPrice;

					records['cart_quantity'] = cartQuantity;
					records['total_mrp'] = perItemTotalPrice.toFixed(2);;
					records['total_product_discount'] = perItemTotalDiscount.toFixed(2);;
					records['total_selling_amount'] = perItemTotalSellingPrice.toFixed(2);;
					records['vat_in_precentage'] = vatInpercentage.toFixed(2);;
					records['total_vat_excluded_amount'] = perItemTotalVatExcludedAmount.toFixed(2);;
					records['total_vat_included_amount'] = perItemTotalVatIncludedAmount.toFixed(2);;
					records['total_discount_on_mrp'] = perItemTotalDiscountOnMrpPrice.toFixed(2);;

					newProductList.push(records);

					parentCallback(null);

				}, () => {

					cartDetail.package_data = package_data;
					cartDetail.subscription_data = subscription_data;
					cartDetail.product_list = newProductList;
					cartDetail.promo_code_detail = promoCodeDetails;

					cartDetail.item_count = item_count;
					cartDetail.total_item_quantity = totalItemQuantity;
					cartDetail.total_item_discount = totalItemDiscount.toFixed(2);
					cartDetail.total_without_discount_price = totalItemMrpAmount.toFixed(2);
					cartDetail.total_vat_excluded_price = totalItemVatExcludedAmount.toFixed(2);
					cartDetail.total_vat_included_price = totalItemVatIncludedAmount.toFixed(2);
					cartDetail.total_item_price = totalItemSellingAmount.toFixed(2);
					cartDetail.total_discount_on_mrp = totalItemDiscountOnMrpPrice.toFixed(2);
					cartDetail.promo_code_applied = (totalItemDiscount) ? ACTIVE : DEACTIVE;


					cartDetail.total_numer_of_products = totalNumerOfProducts;
					cartDetail.total_quantity_of_products = totalQuantityOfProducts;
					cartDetail.total_price_of_products = totalSellingAmountOfProducts.toFixed(2);

					cartDetail.total_numer_of_packages = totalNumerOfPackages;
					cartDetail.total_quantity_of_packages = totalQuantityOfPackages;
					cartDetail.total_price_of_packages = totalSellingAmountOfPackages.toFixed(2);

					cartDetail.total_numer_of_subscriptions = totalNumerOfSubscriptions;
					cartDetail.total_quantity_of_subscriptions = totalQuantityOfSubscriptions;
					cartDetail.total_price_of_subscriptions = totalSellingAmountOfSubscriptions.toFixed(2);
					cartDetail.is_b2b_code = is_b2b_code;
					cartDetail.b2b_code = b2b_code;
					cartDetail.latitude = latitude;
					cartDetail.longitude = longitude;
					cartDetail.area_ids = areaIds;

					cartDetail.product_image_url = PRODUCT_URL;
					cartDetail.package_image_url = PACKAGE_URL;
					cartDetail.subscription_image_url = SUBSCRIPTION_URL;

					delete cartDetail.items;

					/**send success response */
					finalResponse = {
						status: STATUS_SUCCESS,
						result: cartDetail,
						message: ""
					};
					return resolve(finalResponse);
				});
			}
			else if (detailStatus == STATUS_SUCCESS && detailResult && detailResult.length == 0) {
				/**send error response */
				finalResponse = {
					status: STATUS_SUCCESS,
					result: [],
					message: res.__("front.global.no_record_found")
				};
				return resolve(finalResponse);
			}
			else {
				/**send error response */
				finalResponse = {
					status: STATUS_ERROR,
					result: [],
					message: res.__("front.global.no_record_found")
				};
				return resolve(finalResponse);
			}
		});
	})
}


/**
 * Function to empty user cart
 *
 * @param req		As Request Data
 * @param res		As Response Data
 * @param condition	As Order condition
 *
 * @return json
 */
emptyUserCart = (req, res, userId) => {
	return new Promise(resolve => {
		async.parallel([
			/** items remove from cart  items*/
			(callback) => {

				let options = {
					user_id: new ObjectId(userId),
					collection: TABLE_CART_ITEMS
				}
				DbClass.deleteManyRecords(req, res, options).then((cartItemResponse) => {
					callback(cartItemResponse.error || null, cartItemResponse.result)
				});
			},
			/** items remove from cart  */
			(callback) => {
				let options = {
					user_id: new ObjectId(userId),
					collection: TABLE_CART
				}
				DbClass.deleteOneRecords(req, res, options).then(cartResponse => {
					callback(cartResponse.error || null, cartResponse.result)
				})
			}
		], (err, result) => {
			if (err) {
				/** Send error response */
				let response = {
					status: STATUS_ERROR,
					result: [],
					message: res.__("front.system.something_going_wrong_please_try_again")
				};
				return resolve(response);
			}
			else {
				/** Send success response */
				let response = {
					status: STATUS_SUCCESS,
					result: result,
					message: ''
				};
				return resolve(response);
			}
		});
	});
} // emptyUserCart()


/**
 * Function to add days in given date
 *
 * @param hours AS Number Of Hours to be added
 * @param date AS date in which hours to be added
 * @param type AS hour,min,sec
 *
 * @return date string
 */
addHoursToDate = (Hours, date, type) => {
	type = type ? type : "hour";
	let multiplication = type == "hour" ? 60 * 60 : type == "min" ? 60 : 1;
	let hoursTimestamp = Hours * multiplication * 1000;
	let baseTimestamp = typeof date !== typeof undefined && date ? new Date(date).getTime() : Date.now();
	now = new Date(baseTimestamp + hoursTimestamp);
	return now;
}; //end addHoursToDate()


JWTAuthentication = (req, res, jwtOption) => {
	return new Promise((resolve) => {
		let token = jwtOption && jwtOption.token ? jwtOption.token : "";
		let secretKey = jwtOption && jwtOption.secretKey ? jwtOption.secretKey : "";
		let slug = jwtOption && jwtOption.slug ? jwtOption.slug : "";
		let methodName = jwtOption && jwtOption.methodName ? jwtOption.methodName : "";
		if (slug != "") {
			/** Send success response *
			let response = {
			  status: STATUS_SUCCESS,
			  result: {},
			  message: 'slug not required'
			};
			return resolve(response); */
			try {
				const jwt = require("jsonwebtoken");
				if (token) {
					token = decryptJwtToken(token);

					/** verifies secret and checks exp **/
					jwt.verify(token, secretKey, function (err, decoded) {
						if (err) {
							/** Send error response **/
							let response = {
								status: STATUS_ERROR,
								result: {},
								message: res.__("admin.system.invalid_signature"),
							};
							return resolve(response);
						} else {
							/** Send success response **/
							let response = {
								status: STATUS_SUCCESS,
								result: decoded,
								message: "hello",
							};
							return resolve(response);
						}
					});
				} else {
					/** Send error response **/
					let response = {
						status: STATUS_ERROR,
						result: {},
						message: res.__(
							"admin.system.missing_token"
						),
					};
					resolve(response);
				}
			} catch (e) {
				/** Send error response **/
				let response = {
					status: STATUS_ERROR,
					result: {},
					message: res.__(
						"admin.system.something_going_wrong_please_try_again"
					),
				};
				resolve(response);
			}
		} else {
			/** Send success response **/
			let response = {
				status: STATUS_SUCCESS,
				result: {},
				message: "slug not required",
			};
			return resolve(response);
		}
	});
}; // end JWTAuthentication()


/**
 * Function to send SMS
 *
 * @param req		As 	Request Data
 * @param res		As 	Response Data
 * @param options	As	Data object
 *
 * @return message
 *
 * Account used minal.gupta@fullestop.in/minalgupta1991
 */
sendSMS = (req, res, options) => {
	return new Promise((resolve) => {
		let mobileNumber = options && options.mobile_number ? options.mobile_number : "";
		let userId = options && options.user_id ? new ObjectId(options.user_id) : "";
		let smsType = options && options.type ? parseInt(options.type) : "";
		let messageParams = options && options.params ? options.params : "";

		/** Send error response **/
		if (!mobileNumber)
			return resolve({
				status: STATUS_ERROR,
				options: options,
				message: res.__("system.something_going_wrong_please_try_again"),
			});
		asyncParallel({
			sms_details: (parentCallback) => {
				/** Get sms detail */
				let conditions = {
					sms_type: smsType,
				};
				DbClass.getFindOne({
					conditions: conditions,
					collection: TABLE_SMS_TEMPLATES,
				}).then((response) => {
					let result = response.result ? response.result : "";
					let messageObj = "";
					if (result) {
						/**Extract message descriptions and constants*/
						let descriptions = result.message ? result.message : {};
						let constants = result.constants ? result.constants.split(",") : [];
						let tmpMessage = descriptions ? descriptions : "";

						/** Replace constants with actual values from messageParams*/
						if (messageParams.length > 0 && constants.length > 0) {
							for (let i = 0; i < constants.length; i++) {
								let tmpConstant = constants[i] ? "{" + constants[i].trim() + "}" : "";
								if (tmpMessage && tmpConstant) {
									tmpMessage = tmpMessage.replace(
										new RegExp(tmpConstant, "g"),
										messageParams[i]
									);
								}
							}
						}
						/**Update the message in messageObj after replacing the constants*/
						messageObj = tmpMessage;
					}
					parentCallback(null, messageObj);
				});
			},
		},
			(asyncErr, asyncResponse) => {
				let smsDetails = asyncResponse.sms_details ? asyncResponse.sms_details : {};

				/** Manage sms text according to */
				let msgBody = "";
				if (smsDetails) {
					if (smsDetails && smsDetails.en) {
						msgBody = smsDetails.en; // Set the English message from messageObj
					}
				}

				/** Set sms logs data **/
				let saveData = {};
				saveData["user_id"] = userId;
				saveData["mobile_number"] = mobileNumber;
				saveData["body_descriptions"] = smsDetails;
				saveData["created"] = getUtcDate();
				saveData["type"] = smsType;
				saveData["message"] = clone(msgBody);

				let smsLink = res.locals.settings["Vendorsms.sms_link"];
				let smsPassword = res.locals.settings["Vendorsms.password"];
				let userName = res.locals.settings["Vendorsms.user_name"];
				let flashMessage = res.locals.settings["Vendorsms.flash_message"];
				let unicodeMessage = res.locals.settings["Vendorsms.unicode_message"];
				let senderId = res.locals.settings["Unifonicsms.unifonic_sender_id"];
				let appsid = res.locals.settings["Unifonicsms.app_sid"];
				let token = res.locals.settings["Unifonicsms.token"];
				mobileNumber = mobileNumber.replace(/\s/g, "").replace("'", "");



				const accountSid = 'ytutyututyu';
				const authToken = 'tyutyutyutut';
				const client = new twilio(accountSid, authToken);
				client.messages
					.create({
						body: msgBody,
						from: '+966564410721', // Your Twilio number
						to: mobileNumber	    // Recipient's number
					})
					.then(message => console.log(`Message sent! SID: ${message.sid}`))
					.catch(error => console.error('Error sending SMS:', error));
			}
		);
	});
}; //sendSMS()


/**
 * Function to save sms logs
 *
 * @param options As Data object
 *
 * @return null
 */
saveSmsLogs = (req, res, options) => {
	/** Save sms logs **/
	return new Promise((resolve) => {
		let optionObj = {
			insertData: options,
			collection: TABLE_SMS_LOGS,
		};
		/**insert sms logs */
		DbClass.saveInsertOne(req, res, optionObj).then(() => {
			return resolve();
		});
	});
}; //End saveSmsLogs();


/**
 * Function to generate Jwt token
 */
jwtTokenGenerate = (req, res, jwtUser) => {
	return new Promise((resolve) => {
		const token = jwt.sign(jwtUser, JWT_CONFIG.secret, {
			expiresIn: JWT_CONFIG.tokenLife,
		});
		const refreshToken = jwt.sign(jwtUser, JWT_CONFIG.refreshTokenSecret, {
			expiresIn: JWT_CONFIG.refreshTokenLife,
		});
		return resolve({
			token: encryptJwtToken(token),
			refresh_token: encryptJwtToken(refreshToken),
			token_life: JWT_CONFIG.tokenLife,
		});
	});
};


/**
 *This function is used to string to encrypt crypto convert
 */
encryptJwtToken = (encryptData) => {
	// let mykeyEncrypt = crypto.createCipher(
	// 	"aes-128-cbc",
	// 	JWT_ENCRYPT_DECRYPT_API_KEY
	// );
	// let myStrEncrypt = mykeyEncrypt.update(encryptData, "utf8", "hex");
	// return (myStrEncrypt += mykeyEncrypt.final("hex"));


	const iv = crypto.randomBytes(16); // Initialization vector
	const key = crypto.createHash('sha256').update(JWT_ENCRYPT_DECRYPT_API_KEY).digest(); // Ensure 32-byte key
	
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let encrypted = cipher.update(encryptData, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	
	// Usually you need to store iv + encrypted together
	return iv.toString('hex') + ':' + encrypted;


};


// function encryptJwtToken(text, secretKey) {
// 	const iv = crypto.randomBytes(16); // Initialization vector
// 	const key = crypto.createHash('sha256').update(secretKey).digest(); // Ensure 32-byte key
	
// 	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
// 	let encrypted = cipher.update(text, 'utf8', 'hex');
// 	encrypted += cipher.final('hex');
	
// 	// Usually you need to store iv + encrypted together
// 	return iv.toString('hex') + ':' + encrypted;
//   }






/**
 *This function is used to return price with currency
 */
displayPrice = (price) => {
	return CURRENCY_SYMBOL + " " + price;
};


/**
 *This function is used to return price with persent
 */
displayPriceInPersent = (price) => {
	return price + "" + PERCENT_SYMBOL;
};


/**
 *  Function to Round the number
 *
 * @param value		As Number To be round
 * @param precision As Precision
 *
 * @return number
 */
round = (value, precision) => {
	try {
		if (!value || isNaN(value)) {
			return value;
		} else {
			precision = (typeof precision != typeof undefined) ? precision : ROUND_PRECISION;
			var multiplier = Math.pow(10, precision || 0);
			return Math.round(value * multiplier) / multiplier;
		}
	} catch (e) {
		return value;
	}
}// end round()



/**
* Function for socket request from any where
*
* @param req       As Request Data
* @param res       As Response Data
* @param options   As options
*
* @return null
*/
socketRequest = (req, res, options) => {
	if (typeof options.room_id !== typeof undefined && typeof options.emit_function !== typeof undefined) {
		const clientSideSocket = require('socket.io-client')(WEBSITE_SOCKET_URL);
		clientSideSocket.emit('socketRequest', options);
	} else {
		consoleLog(req)
		return res.__("system.missing_parameters");
	}
}//end socketRequest()






/**
 *  Function to insert notification
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
insertNotifications = (req, res, options) => {
	return new Promise((resolve) => {
		let notiData = options.notification_data ? options.notification_data : {};
		let notiType = notiData["notification_type"] ? parseInt(notiData["notification_type"]) : "";
		let messageParams = notiData["message_params"] ? notiData["message_params"] : "";
		let createdBy = notiData["user_id"] ? notiData["user_id"] : req.session.user && req.session.user._id ? req.session.user._id : "";
		let createdByRoleId = notiData["user_role_id"] ? notiData["user_role_id"] : req.session.user && req.session.user.user_role_id ? req.session.user.user_role_id : "";
		let parentTableId = notiData["parent_table_id"] ? notiData["parent_table_id"] : "";
		let onlyForUserRole = notiData["only_for_user_role"] ? notiData["only_for_user_role"] : false;
		let languageCode = notiData["lang_code"] ? notiData["lang_code"] : DEFAULT_LANGUAGE_CODE;


		/** Get notification types details  */

		NotificationTypeModel.getNotificationTypeFindOne({
			conditions: { notification_type: notiType },
		}).then(notiTypeRes => {
			/** Send error response */
			if (notiTypeRes.status != STATUS_SUCCESS || !notiTypeRes.result) {
				return resolve({
					status: STATUS_ERROR,
					user_list: [],
					message: res.__(
						"admin.system.something_going_wrong_please_try_again"
					),
				});
			}

			let typeResult = notiTypeRes.result ? notiTypeRes.result : {};
			let constants = typeResult.constant ? typeResult.constant.split(",") : [];

			let notiTitle = "";
			let notiMsg = "";

			if (messageParams) {
				let tmpTitle = (typeResult.pages_descriptions && typeResult.pages_descriptions[languageCode] && typeResult.pages_descriptions[languageCode]['title']) ? typeResult.pages_descriptions[languageCode]['title'] : "";
				let tmpMsg = (typeResult.pages_descriptions && typeResult.pages_descriptions[languageCode] && typeResult.pages_descriptions[languageCode]['message']) ? typeResult.pages_descriptions[languageCode]['message'] : "";

				/** Get message from message param parameters **/
				for (let i = 0; i < constants.length; i++) {
					let tmpConstant = constants[i] ? "{" + constants[i].trim() + "}" : "";
					tmpTitle = tmpTitle.replace(
						RegExp(tmpConstant, "g"),
						messageParams[i]
					);
					tmpMsg = tmpMsg.replace(RegExp(tmpConstant, "g"), messageParams[i]);
				}

				notiTitle = tmpTitle;
				notiMsg = tmpMsg;
			}
			asyncParallel(
				{
					admin_details: (callback) => {
						if (createdByRoleId != SUPER_ADMIN_ROLE_ID && createdByRoleId != "")
							return callback(null, null);

						UserModel.getUserDetails({
							conditions: { user_role_id: SUPER_ADMIN_ROLE_ID },
							fields: { _id: 1 },
						}).then(userRes => {
							if (userRes || userRes.status != STATUS_SUCCESS || !userRes.result)
								return callback(null, {});
							callback(null, userRes.result);
						});
					},
				}, (asyncErr, asyncRes) => {

					let iconImageCheck = NOTIFICATION_IMAGE_DROPDOWN.find(item => item.key === notiType);
					let iconImage = iconImageCheck ? iconImageCheck.value : '';

					let saveNotificationData = {
						user_id: "",
						user_role_id: "",
						created_role_id: createdByRoleId,
						created_by: asyncRes.admin_details && asyncRes.admin_details._id ? asyncRes.admin_details._id : new ObjectId(createdBy),
						title: notiTitle ? notiTitle : "",
						message: notiMsg ? notiMsg : "",
						title_descriptions: notiTitle,
						message_descriptions: notiMsg,
						parent_table_id: (parentTableId && new ObjectId(parentTableId)) || "",
						extra_parameters: notiData.extra_parameters ? notiData.extra_parameters : {},
						notification_type: notiType,
						icon_image: iconImage,
						is_seen: DEACTIVE,
						is_read: DEACTIVE,
						created: getUtcDate(),
						modified: getUtcDate(),
					};
					/** Save notification data **/
					saveNotifications(req, res, {
						notification_data: saveNotificationData,
						notification_type: notiType,
						user_ids: notiData.user_ids ? notiData["user_ids"] : [],
						user_role_id: notiData.role_id ? notiData["role_id"] : "",
						only_for_user_role: onlyForUserRole,
					}).then((notiRes) => {
						resolve(notiRes);
					});
				}
			);
		});
	});
}; // end insertNotification()


/**
 *  Function to save notifications
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
saveNotifications = (req, res, options) => {
	return new Promise((resolve) => {
		let userIds = options.user_ids ? options.user_ids : [];
		let notiType = options.notification_type ? options.notification_type : "";
		let onlyForRole = options.only_for_user_role ? options.only_for_user_role : "";

		if ((userIds.length > 0 || onlyForRole) && notiType) {
			let saveNotiData = options.notification_data ? options.notification_data : [];
			let messageDescriptions = saveNotiData.message_descriptions ? saveNotiData.message_descriptions : "";
			let extra_parameters = saveNotiData.extra_parameters ? saveNotiData.extra_parameters : "";
			let notiUserRoleId = options.user_role_id ? options.user_role_id : "";
			let notisList = [];

			if (!onlyForRole) {
				/** Set insertable data **/
				userIds.map((records) => {
					let tmpData = {
						...saveNotiData,
						...{ user_id: new ObjectId(records), user_role_id: notiUserRoleId },
					};
					notisList.push(tmpData);
				});
			} else {
				if (notiUserRoleId.constructor !== Array)
					notiUserRoleId = [notiUserRoleId];

				/** Send multiple  role id */
				notisList = notiUserRoleId.map((roleRecords) => {
					let tempNotiData = {
						...saveNotiData,
						...{ user_role_id: roleRecords },
					};

					return tempNotiData;
				});
			}


			/** Insert in notification table **/
			DbClass.saveInsertMany(req, res, {
				insertData: notisList,
				collection: TABLE_NOTIFICATIONS,
			}).then((saveResult) => {
				/** Send error response **/
				if (saveResult.status != STATUS_SUCCESS)
					return resolve({ status: STATUS_ERROR, user_list: [] });

				let allowedTypes = [NOTIFICATION_TO_SERVICE_PROVIDER_NEW_BOOKING, NOTIFICATION_TO_USER_CONFIRM_BOOKING, NOTIFICATION_TO_USER_CHECKOUT_ORDER_FROM_WALLET, NOTIFICATION_TO_USER_COMPLETE_BOOKING, NOTIFICATION_TO_USER_ACCEPT_BOOKING, NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING, NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING, NOTIFICATION_TO_USER_START_BOOKING, NOTIFICATION_TO_USER_FINISH_BOOKING, NOTIFICATION_TO_USER_DELIVERED_PRODUCT, NOTIFICATION_TO_CUSTOM_NOTIFICATION];

				if (allowedTypes.includes(notiType)) {
					if (userIds && userIds.length > 0) {
						userIds.map(user_id => {
							socketRequest(req, res, {
								userId: user_id,
								room_id: user_id,
								message: messageDescriptions,
								extra_parameters: extra_parameters,
								emit_function: "notification_message_received",
							});
						});
					}
				}

				/** Send success response **/
				resolve({ status: STATUS_SUCCESS, user_list: notisList });
			});

		} else {
			/** Send error response **/
			resolve({
				status: STATUS_ERROR,
				user_list: [],
				message: res.__("admin.users.no_user_selected"),
			});
		}
	});
};

/**function for calculate points from amount */
calculatePoints = (amount, valuePerCoin, totalBalanceForCoins) => {
	let totalAmount = amount + totalBalanceForCoins;

	let totalPoints = Math.floor(Number(totalAmount) / Number(valuePerCoin));
	let remainder = Number(totalAmount) % Number(valuePerCoin);

	return { totalPoints: totalPoints, remainder: remainder };
}

/**function for convert points to amount */
convertPointsToAmount = (points, perPointPrice) => {
	return (points * Number(perPointPrice)).toFixed(2);
}


/**
 * Function to get date in any format with utc format
 *
 * @param date 		as	Date object
 * @param format 	as 	Date format
 * 
 * @return date string
 */
convertToISO = (date) => {
	const moment = require('moment');
	return moment(date, DATATABLE_DATE_FORMAT).utc().toDate(); // Convert to UTC Date
}//end getUtcDate();


/**
 * Funcion to update the service provider in contract on area selection on add or edit service provider
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
updateServiceProviderInContract = (req, res, options) => {
	return new Promise((resolve) => {
		let serviceProviderId = options.service_provider_id ? new ObjectId(options.service_provider_id) : "";
		let serviceProviderIds = options.service_provider_ids ? options.service_provider_ids : "";

		let areaId = options.area_id ? new ObjectId(options.area_id) : "";

		let currentDateTime = new Date();
		let currentTimeStamp = currentDateTime.getTime();

		let optionObj = {
			collection: TABLE_FRANCHISE_CONTRACTS,
			conditions: { area_id: areaId, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
		}
		DbClass.getFindOne(optionObj).then((response) => {
			let responseStatus = response.status ? response.status : "";
			let contractData = response.result ? response.result : "";

			if (responseStatus == STATUS_SUCCESS && contractData) {
				let contractId = contractData._id ? contractData._id : "";
				let serviceProviderData = contractData.service_provider_in_area ? contractData.service_provider_in_area : [];


				if (serviceProviderIds) {
					serviceProviderData = serviceProviderIds;
				}
				else {
					// Convert all ObjectIds to strings for comparison
					const existingIds = serviceProviderData.map(id => id.toString());
					const newServiceProviderId = serviceProviderId.toString();

					// Add only if it doesn't already exist
					if (!existingIds.includes(newServiceProviderId)) {
						serviceProviderData.push(new ObjectId(newServiceProviderId));
					}
				}

				let updateData = {
					service_provider_in_area: serviceProviderData, // Corrected array format
					modified: getUtcDate()
				};


				let updateOption = {
					collection: TABLE_FRANCHISE_CONTRACTS,
					conditions: { _id: contractId },
					updateData: { $set: updateData }
				}
				DbClass.updateOneRecord(req, res, updateOption).then((updateResponse) => {
					if (updateResponse.status == STATUS_SUCCESS) {
						resolve()
					}
					else {
						resolve()
					}
				})
			} else {
				resolve()
			}
		})
	});
}//end updateServiceProviderInContract();


/**
 * Function for geting user form slug 
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
getUserFromSlug = (req, res, options) => {
	return new Promise((resolve) => {
		let slug = options.slug ? options.slug : "";

		let optionObj = {
			collection: TABLE_USERS,
			conditions: { slug: slug }
		}

		DbClass.getFindOne(optionObj).then((response) => {
			let responseStatus = response.status ? response.status : "";
			let userData = response.result ? response.result : "";

			if (responseStatus == STATUS_SUCCESS && userData) {
				resolve(userData)
			} else {
				resolve()
			}
		})
	});
}//end getUserFromSlug();


/**
 * Function to check if a point is inside a polygon
 *
 * @param point As point object with lat and lng
 * @param polygon As array of coordinates
 *
 * @return boolean
 */
isPointInPolygon = (point, polygon) => {
	let x = point.lat, y = point.lng;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		let xi = parseFloat(polygon[i].lat), yi = parseFloat(polygon[i].lng);
		let xj = parseFloat(polygon[j].lat), yj = parseFloat(polygon[j].lng);

		let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
}


/**
 * Function to get an array of area IDs where the selected location falls within.
 *
 * @param latitude As latitude value
 * @param longitude As longitude value
 *
 * @return Promise resolving to an array of area IDs
 */
getAreasForAddress = (latitude, longitude) => {
	return new Promise(resolve => {
		let matchedAreas = [];
		let optionObj = {
			collection: TABLE_AREAS,
			conditions: { is_deleted: NOT_DELETED },
			fields: { _id: 1, coordinates: 1 },
		};

		DbClass.getFindAll(optionObj).then(areaDataRes => {
			let areas = areaDataRes.result ? areaDataRes.result : [];
			for (let area of areas) {
				if (isPointInPolygon({ lat: latitude, lng: longitude }, area.coordinates)) {
					matchedAreas.push(area._id);
				}
			}
			resolve(matchedAreas);
		});
	});
};


/**
 * Formats a timestamp into a human-readable date/time or duration.
 * 
 * @param {number} timestamp - The timestamp in milliseconds.
 * @param {boolean} [isDuration=false] - Whether the value represents a duration.
 * @returns {string} - A formatted date/time string or a duration in hours & minutes.
 */
convertTimestampOrDurationData = (timestamp, isDuration = false) => {
	const moment = require('moment');
	if (isDuration) {
		// Convert duration (in milliseconds) to hours and minutes
		let minutes = Math.floor(timestamp / 60000);
		let hours = Math.floor(minutes / 60);
		minutes %= 60;
		return hours > 0 ? `${hours} Hour ${minutes} Min` : `${minutes} Min`;
	} else {
		// Convert timestamp (in milliseconds) to a human-readable date and time
		let date = moment(timestamp).format(DATATABLE_DATE_TIME_FORMAT);// Convert to UTC Date
		return date
	}
}


/**
 *  Function is used to export data in excel file
 *
 * @param value as a numeric value
 *
 * @return numeric value after convert format
 */
exportToExcel = (req, res, options) => {
	let fileName = "Untitled";
	if (options.file_name) {
		fileName = (options.file_name) ? options.file_name : "";
	} else if (options.file_prefix) {
		fileName = options.file_prefix + "_" + newDate("", DATABASE_DATE_FORMAT);
	}

	const XLSX = require("xlsx");
	let wb = XLSX.utils.book_new();
	let headingColumns = (options.heading_columns) ? options.heading_columns : [];
	let exportData = (options.export_data) ? options.export_data : [];
	let finalArray = [];
	finalArray.push(headingColumns);
	let ws = XLSX.utils.aoa_to_sheet(finalArray.concat(exportData));

	/** Add the worksheet to the workbook **/
	XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
	let wbbuf = XLSX.write(wb, {
		type: "base64",
	});

	let finalFileName = "attachment; filename=" + fileName + ".xlsx";
	res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	res.setHeader("Content-Disposition", finalFileName);
	res.end(new Buffer(wbbuf, "base64"));
}// end exportToExcel()


/**
 * Function for geting user form slug 
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
getProductFromSlug = (req, res, options) => {
	return new Promise((resolve) => {
		let slug = options.slug ? options.slug : "";
		let optionObj = {
			collection: TABLE_PRODUCTS,
			conditions: { slug: slug }
		}

		DbClass.getFindOne(optionObj).then((response) => {
			let responseStatus = response.status ? response.status : "";
			let userData = response.result ? response.result : "";

			if (responseStatus == STATUS_SUCCESS && userData) {
				resolve(userData)
			} else {
				resolve()
			}
		})
	});
}//end getUserFromSlug();


formatToTwo = (amount) => {
	amount = Number(amount)
	return Number((amount).toFixed(2))
}


/**
 *  Function to check Organization Code
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
checkOrganizationCode = (req, res, options) => {
	return new Promise((resolve) => {
		let userId = (options.user_id) ? new ObjectId(options.user_id) : "";
		let promoCode = (options.promo_code) ? options.promo_code : "";

		if (userId && promoCode) {

			let options = {
				conditions: {
					'_id': userId,
					'status': ACTIVE,
					'is_deleted': NOT_DELETED
				}
			};

			UserModel.getUserDetails(options).then(async userResponse => {

				if (userResponse.status == STATUS_ERROR) {
					/** Send error response **/
					let response = {
						'status': STATUS_ERROR,
						'message': userResponse.message
					};
					return resolve(response);
				}
				else {
					let userResponseData = (userResponse.result) ? userResponse.result : "";

					if (userResponseData != "") {
						let applyCode = (userResponseData.b2b_code) ? userResponseData.b2b_code : "";

						/**check apply b2b code */
						if (applyCode != "") {
							let response = {
								'status': STATUS_ERROR,
								'message': res.__("front.order.b2b_code_already_exists")
							};
							return resolve(response);

						}
						else {

							let promoCodeCondition = {
								'promo_code': promoCode,
								'is_active': ACTIVE,
								'is_deleted': NOT_DELETED
							};

							let promoCodeOption = {
								conditions: promoCodeCondition
							};

							/**get promo_code details */
							B2BDiscountModel.B2BDiscountDetails(req, res, promoCodeOption).then(async promoCodeResponse => {

								if (promoCodeResponse.status == STATUS_ERROR) {
									/** Send error response **/
									let response = {
										'status': STATUS_ERROR,
										'message': res.__("front.promo_code.promo_code_not_found")
									};
									return resolve(response);
								}
								else {

									let promoCodeDetails = (promoCodeResponse.result) ? promoCodeResponse.result : "";

									if (promoCodeDetails != "") {
										let codeValidFrom = (promoCodeDetails.code_valid_from) ? promoCodeDetails.code_valid_from : "";
										let codeValidTo = (promoCodeDetails.code_valid_to) ? promoCodeDetails.code_valid_to : "";
										let maximumNumberOfWashes = (promoCodeDetails.maximum_number_of_washes) ? promoCodeDetails.maximum_number_of_washes : 0;
										let maximumNumberOfUsers = (promoCodeDetails.number_of_user) ? promoCodeDetails.number_of_user : 0;

										const today = new Date();

										/**check valid from or valid to */
										if (codeValidFrom && codeValidTo) {
											let code_valid_from = new Date(codeValidFrom);
											let code_valid_to = new Date(codeValidTo);
											if (today < code_valid_from || today > code_valid_to) {
												let response = {
													'status': STATUS_ERROR,
													'message': res.__("front.order.the_promo_code_is_not_valid_today")
												};
												return resolve(response);
											}
										}
										
										
										/* CHECK MAXIMUM NUMBER OF USERS  */
										let totalb2bUserCondition = {
											conditions: {
												"b2b_code": promoCode
											},
											collection: TABLE_USERS
										}

										let totalb2bDiscountUserResponse = await UserModel.getUserCount(req, res, totalb2bUserCondition);
										let totalb2bDiscountUser = (totalb2bDiscountUserResponse.result) ? totalb2bDiscountUserResponse.result : DEACTIVE
								 
										if (maximumNumberOfUsers) {
											if (totalb2bDiscountUser >= maximumNumberOfUsers) {
												let response = {
													'status': STATUS_ERROR,
													'message': res.__("front.order.already_used_maximum_user_quantity")
												};
												return resolve(response);
											}
										}
										 

										/* CHECK MAXIMUM NUMBER OF ORDERS   */
										let totalb2borderCondition = {
											conditions: {
												"b2b_code": promoCode,
												"is_b2b_code": true,
												"order_status": ORDER_PLACED,
												"status": { $ne: BOOKING_STATUS_CANCELLED }
											}
										}

										let totalb2bDiscountOrderResponse = await OrderModel.getOrderCount(totalb2borderCondition);
										let totalb2bDiscountOrder = (totalb2bDiscountOrderResponse.result) ? totalb2bDiscountOrderResponse.result : DEACTIVE


										/**check maximum quantity */
										if (maximumNumberOfWashes) {
											if (totalb2bDiscountOrder >= maximumNumberOfWashes) {
												let response = {
													'status': STATUS_ERROR,
													'message': res.__("front.order.already_used_maximum_quantity")
												};
												return resolve(response);
											}
										}
 
										let response = {
											'status': STATUS_SUCCESS,
											'promoCodeDetails': promoCodeDetails,
											'message': ""
										};
										return resolve(response);

									}
									else {
										let response = {
											'status': STATUS_ERROR,
											'message': res.__("front.promo_code.promo_code_not_found")
										};
										return resolve(response);
									}
								}
							})
						}

					}
					else {
						let response = {
							'status': STATUS_ERROR,
							'message': userResponse.message
						};
						return resolve(response);
					}
				}
			})





		} else {
			/** Send error response **/
			let response = {
				'status': STATUS_ERROR,
				'message': res.__("api.global.parameter_missing")
			};
			return resolve(response);
		}

	});
}


/**
 * Function to unique transaction id for wallet
 *
 * @param req		As	Request Data
 * @param res		As 	Response Data
 * @param options	As  object of data
 *
 * @return json
 **/
getUniqueWalletTransactionId = (req, res) => {
	return new Promise(resolve => {
		let conditions = { "slug": "wallet_transaction_id" };
		if (!conditions) {
			/** Send error response **/
			return resolve({
				status: STATUS_ERROR,
				message: res.__("system.something_going_wrong_please_try_again")
			});
		}
		let incrementalsOptions = {
			conditions: conditions,
			collection: TABLE_INCREMENTALS,
			fields: { _id: 1, prefix: 1, number: 1 }
		}
		DbClass.getFindOne(incrementalsOptions).then(incrementalsResponse => {

			let result = incrementalsResponse.result
			let status = result.status
			let prefix = result.prefix;
			let number = result.number;
			let id = incrementalsResponse._id;

			let walletTransactionId = prefix + (number + 1)

			let updateOptions = {
				conditions: conditions,
				collection: TABLE_INCREMENTALS,
				updateData: { $set: { modified: getUtcDate() }, $inc: { number: 1 } }
			}

			DbClass.updateOneRecord(req, res, updateOptions).then(response => {

				if (status == STATUS_ERROR) {
					/** Send error response */
					let response = {
						status: STATUS_ERROR,
						message: res.__("system.something_going_wrong_please_try_again")
					};
					return resolve(response);
				}
				if (!result) {
					/** Send success response */
					return resolve({
						status: STATUS_ERROR,
						result: false,
					});
				}

				/** Send success response **/
				if (result) {
					/** Send success response */
					return resolve({
						status: STATUS_SUCCESS,
						result: walletTransactionId,
					});
				} else {
					/** Send success response */
					return resolve({
						status: STATUS_ERROR,
						result: false,
					});
				}
			})
		});
	})
}// end getUniqueWalletTransactionId()


/**
 * Function to unique transaction id for wallet
 *
 * @param req		As	Request Data
 * @param res		As 	Response Data
 * @param options	As  object of data
 *
 * @return json
 **/
updatePointTransactionLogStats = (req, res, options) => {
	return new Promise(async (resolve) => {
		var isRedeem = options.is_redeem || DEACTIVE;
		var points = options.points || DEACTIVE;
		var redeemPoints = options.redeem_points || DEACTIVE;
		var redeemAmount = options.redeem_amount || DEACTIVE;
		var userId = (options.user_id) ? new ObjectId(options.user_id) : '';

		var userConditions = {};
		var conditions = {};
		conditions['slug'] = 'all_point_logs_stats';

		if (userId) {
			userConditions['_id'] = userId;
		}


		var findDashboardStatOptions = {
			collection: TABLE_ADMIN_DASHBOARD_STATS,
			conditions: conditions,
		}


		var findUserStatOptions = {
			collection: TABLE_USERS,
			conditions: userConditions,
		}

		var [dashboardStat, userStat] = await Promise.all([
			DbClass.getFindOne(findDashboardStatOptions).then(res => res?.result || {}),
			((userId) ? DbClass.getFindOne(findUserStatOptions).then(res => res?.result || {}) : null),
		])


		let totalEarnedPoints = dashboardStat?.total_earned_points || DEACTIVE;
		let totalRedeemPoints = dashboardStat?.total_redeem_points || DEACTIVE;
		let totalRedeemAmount = dashboardStat?.total_redeem_amount || DEACTIVE;

		let updateData = {
			modified: getUtcDate()
		}
		if (isRedeem) {
			updateData['total_redeem_points'] = Number(totalRedeemPoints) + Number(redeemPoints);
			updateData['total_redeem_amount'] = Number(totalRedeemAmount) + Number(redeemAmount);
		} else {
			updateData['total_earned_points'] = Number(totalEarnedPoints) + Number(points);
		}


		var updateDashboardOptions = {
			collection: TABLE_ADMIN_DASHBOARD_STATS,
			conditions: conditions,
			updateData: { $set: updateData },
		}


		if (userStat) {
			let totalUserEarnedPoints = userStat?.total_earned_points || DEACTIVE;
			let totalUserRedeemPoints = userStat?.total_redeem_points || DEACTIVE;
			let totalUserRedeemAmount = userStat?.total_redeem_amount || DEACTIVE;

			let updateUserData = {};

			if (isRedeem) {
				updateUserData['total_redeem_points'] = Number(totalUserRedeemPoints) + Number(redeemPoints);
				updateUserData['total_redeem_amount'] = Number(totalUserRedeemAmount) + Number(redeemAmount);
			} else {
				updateUserData['total_earned_points'] = Number(totalUserEarnedPoints) + Number(points);
			}


			let updateUserOptions = {
				collection: TABLE_USERS,
				conditions: userConditions,
				updateData: { $set: updateUserData },
			}
			await DbClass.updateOneRecord(req, res, updateUserOptions)
		}

		await DbClass.updateOneRecord(req, res, updateDashboardOptions)

		resolve({ status: STATUS_SUCCESS })
	})
}


/**save user Points */
saveUserPoints = (req, res, options) => {
	return new Promise(resolve => {
		let userId = (options.user_id) ? new ObjectId(options.user_id) : "";
		let orderId = (options.order_id) ? new ObjectId(options.order_id) : "";
		let orderNumber = (options.order_number) ? options.order_number : "";
		let points = (options.points) ? Number(options.points) : DEACTIVE;
		let amountSinglePoint = (options.amount_for_single_point) ? Number(options.amount_for_single_point) : DEACTIVE;
		let totalUserPoints = (options.total_user_points) ? Number(options.total_user_points) : DEACTIVE;
		let totalSellingAmount = (options.total_selling_amount) ? Number(options.total_selling_amount) : DEACTIVE;
		let totalBalanceForPoints = (options.total_balance_for_points) ? Number(options.total_balance_for_points) : DEACTIVE;
		let remainder = (options.remainder) ? Number(options.remainder) : DEACTIVE;

		let isRedeem = (options.is_redeem) ? parseInt(options.is_redeem) : DEACTIVE;
		let totalRedeemPoints = (options.total_redeem_points) ? Number(options.total_redeem_points) : DEACTIVE;
		let totalRedeemAmount = (options.total_redeem_amount) ? Number(options.total_redeem_amount) : DEACTIVE;
		let type = (options.type) ? options.type : DEACTIVE;
		let transaction_reason = (options.transaction_reason) ? Number(options.transaction_reason) : DEACTIVE;
		let note = (options.note) ? options.note : "";
		let langCode = (options.lang_code != "") ? options.lang_code : DEFAULT_LANGUAGE_CODE;


		let option = {
			insertData: {
				"user_id": userId,
				"order_id": orderId,
				"order_number": orderNumber,
				"points": points,
				"type": type,
				"transaction_reason": transaction_reason,
				"total_user_points": Number(Number(totalUserPoints) + Number(points)),
				"total_selling_amount": Number(totalSellingAmount),
				"previous_balance_for_points": Number(totalBalanceForPoints),
				"total_amount_for_points": Number(Number(totalSellingAmount) + Number(totalBalanceForPoints)),
				"now_remaining_amount_for_point": Number(remainder),
				"amount_for_single_point": Number(amountSinglePoint),
				"is_redeem": isRedeem,
				"note": note,
				"total_redeem_points": totalRedeemPoints,
				"total_redeem_amount": totalRedeemAmount,
				"created": getUtcDate()
			}
		};

		/**save points logs */
		OrderModel.savePointsLogs(req, res, option).then(() => {

			let totalPoints = totalUserPoints + points;

			let options = {
				'conditions': { _id: userId },
				'updateData': {
					$set: { 'total_points': Number(totalPoints), 'total_balance_for_points': Number(remainder), 'modified': getUtcDate() }
				},
			}

			/**query for update sender wallet ammount */
			UserModel.updateOneUser(req, res, options).then(async (updatePointsRes) => {

				if (updatePointsRes.status == STATUS_SUCCESS) {


					let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(userId) }, fields: { 'total_points': 1, 'total_balance_for_points': 1, 'full_name': 1 } });

					let customerResult = (userDetails.result) ? userDetails.result : "";
					let fullName = (customerResult.full_name) ? customerResult.full_name : "";
					/* SEND NOTIFICATION START */
					let extraParametersObj = {
						order_id: orderId,
						order_number: orderNumber,
						user_id: new ObjectId(userId),
					}

					let notificationType = '';
					let pushNotificationType = '';
					if (type == POINT_TYPE_EARNED) {
						notificationType = NOTIFICATION_TO_USER_POINTS_EARNED;
						pushNotificationType = PUSH_NOTIFICATION_TO_USER_POINTS_EARNED;
					}


					if (type == REDEEM_POINS) {
						notificationType = NOTIFICATION_TO_USER_POINTS_REDEEM;
						pushNotificationType = PUSH_NOTIFICATION_TO_USER_POINTS_REDEEM;
					}


					let notificationOptions = {
						notification_data: {
							notification_type: notificationType,
							message_params: [fullName, orderNumber, points],
							user_id: userId,
							user_ids: [userId],
							lang_code: langCode,
							extra_parameters: extraParametersObj,
							user_role_id: FRONT_ADMIN_ROLE_ID,
							role_id: FRONT_ADMIN_ROLE_ID,
							created_by: userId
						}
					};
					await insertNotifications(req, res, notificationOptions);


					let pushNotificationOptions = {
						notification_data: {
							notification_type: pushNotificationType,
							message_params: [fullName, orderNumber, points],
							user_id: userId,
							lang_code: langCode,
							user_role_id: FRONT_ADMIN_ROLE_ID,
							role_id: FRONT_ADMIN_ROLE_ID,
							created_by: userId
						}
					};
					await pushNotification(req, res, pushNotificationOptions);
					/* SEND NOTIFICATION END */

					/** Send success response **/
					let response = {
						'status': STATUS_SUCCESS,
						'message': res.__("front.user.points_saved_successfully")
					};
					return resolve(response);
				} else {
					let response = {
						'status': STATUS_ERROR,
						'message': res.__("front.system.something_going_wrong_please_try_again")
					};
					return resolve(response);
				}

			});
		});
	});
}


checkB2BDiscountCodeORpromoCode = (req, res, options) => {
	return new Promise(resolve => {
		let userResult = (options.user_result) ? options.user_result : "";
		let userId = (options.user_id) ? options.user_id : "";
		let cartDetail = (options.cart_detail) ? options.cart_detail : "";


		let b2bDiscountCode = (userResult.b2b_code) ? userResult.b2b_code : "";
		let b2b_status = (userResult.b2b_status) ? userResult.b2b_status : "";
		let b2bCodeDetails = (userResult.b2b_code_details) ? userResult.b2b_code_details : "";

		if (b2bDiscountCode) {

			checkB2BDiscountCode(req, res, { "user_id": userId, "b2b_code": b2bDiscountCode, "b2b_status": b2b_status, 'cart_details': cartDetail, "b2b_code_details": b2bCodeDetails }).then(async (b2bDiscountCodeResponse) => {

				response = { status: STATUS_SUCCESS, message: null };
				return resolve(finalResponse);

			});
		}
		else {
			let promoCodeDetail = (cartDetail && cartDetail.result && cartDetail.result.promo_code_detail) ? cartDetail.result.promo_code_detail : "";

			let promoCode = (promoCodeDetail && promoCodeDetail.promo_code) ? promoCodeDetail.promo_code : "";

			if (promoCode) {
				checkPromoCode(req, res, { "user_id": userId, "promo_code": promoCode, 'cart_details': cartDetail }).then(async (promoCodeResponse) => {

					response = { status: STATUS_SUCCESS, message: null };
					return resolve(finalResponse);
				});
			}
			else {

				response = { status: STATUS_SUCCESS, message: null };
				return resolve(finalResponse);
			}
		}
	});
}


/**
 *  Function to check promo code
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
checkB2BDiscountCode = (req, res, options) => {
	return new Promise(async (resolve) => {
		let userId = (options.user_id) ? options.user_id : "";
		let b2b_code = (options.b2b_code) ? options.b2b_code : "";
		let b2b_status = (options.b2b_status) ? options.b2b_status : "";
		let cartDetail = (options.cart_details) ? options.cart_details : "";
		let b2bCodeDetails = (options.b2b_code_details) ? options.b2b_code_details : "";

		if (userId && b2b_code && cartDetail && b2bCodeDetails) {

			if (b2b_status != ACTIVE) {
				/** Send error response **/
				let response = {
					'status': STATUS_ERROR,
					'message': res.__("front.promo_code.promo_code_not_found")
				};
				return resolve(response);
			} else {

				if (b2bCodeDetails) {
					const b2bDiscountCodeAppliedItems = [];
					let codeValidFrom = (b2bCodeDetails.code_valid_from) ? b2bCodeDetails.code_valid_from : "";
					let codeValidTo = (b2bCodeDetails.code_valid_to) ? b2bCodeDetails.code_valid_to : "";
					let numberOfWashesPerUser = (b2bCodeDetails.number_of_washes_per_user) ? b2bCodeDetails.number_of_washes_per_user : "";
					let maximumNumberOfWashes = (b2bCodeDetails.maximum_number_of_washes) ? b2bCodeDetails.maximum_number_of_washes : "";
					let numberOfUser = (b2bCodeDetails.number_of_user) ? b2bCodeDetails.number_of_user : "";
					let minOrderValue = (b2bCodeDetails.min_order_value) ? b2bCodeDetails.min_order_value : "";

					/* let usedQuantity = (b2bCodeDetails.used_quantity) ? b2bCodeDetails.used_quantity : 0; */
					let categoryId = (b2bCodeDetails.category_id) ? b2bCodeDetails.category_id : [];
					let packageId = (b2bCodeDetails.package_id) ? b2bCodeDetails.package_id : [];
					let subscriptionId = (b2bCodeDetails.subscription_id) ? b2bCodeDetails.subscription_id : [];
					let totalOrderPrice = (cartDetail && cartDetail.result && cartDetail.result.total_without_discount_price) ? cartDetail.result.total_without_discount_price : 0;
					let cartProductList = (cartDetail && cartDetail.result && cartDetail.result.product_list) ? cartDetail.result.product_list : [];
					let cartPackageData = (cartDetail && cartDetail.result && cartDetail.result.package_data) ? cartDetail.result.package_data : "";
					let cartPackageId = (cartPackageData && cartPackageData._id) ? cartPackageData._id : "";
					let cartSubscriptionData = (cartDetail && cartDetail.result && cartDetail.result.subscription_data) ? cartDetail.result.subscription_data : "";
					let cartSubscriptionId = (cartSubscriptionData && cartSubscriptionData._id) ? cartSubscriptionData._id : "";

					const today = new Date();

					/**check valid from or valid to */
					if (codeValidFrom && codeValidTo) {
						let code_valid_from = new Date(codeValidFrom);
						let code_valid_to = new Date(codeValidTo);
						if (today < code_valid_from || today > code_valid_to) {
							let response = {
								'status': STATUS_ERROR,
								'message': null
							};
							return resolve(response);
						}
					}

					/**check min Order Value */
					if (minOrderValue) {
						if (minOrderValue > totalOrderPrice) {
							let response = {
								'status': STATUS_ERROR,
								'message': null
							};
							return resolve(response);
						}
					}




					let userOrderCondition = {
						conditions: {
							"user_id": new ObjectId(userId),
							"b2b_code": b2b_code,
							"is_b2b_code": true,
							"order_status": ORDER_PLACED,
							"status": { $ne: BOOKING_STATUS_CANCELLED }
						}
					}

					let userB2bDiscountOrderResponse = await OrderModel.getOrderCount(userOrderCondition);
					let userB2bDiscountOrderCount = (userB2bDiscountOrderResponse.result) ? userB2bDiscountOrderResponse.result : DEACTIVE

					/**check quantity */
					if (numberOfWashesPerUser) {
						if (userB2bDiscountOrderCount >= numberOfWashesPerUser) {
							let response = {
								'status': STATUS_ERROR,
								'message': res.__("front.order.already_used_quantity")
							};
							return resolve(response);
						}
					}

					let totalb2borderCondition = {
						conditions: {
							"b2b_code": b2b_code,
							"is_b2b_code": true,
							"order_status": ORDER_PLACED,
							"status": { $ne: BOOKING_STATUS_CANCELLED }
						}
					}

					let totalb2bDiscountOrderResponse = await OrderModel.getOrderCount(totalb2borderCondition);
					let totalb2bDiscountOrder = (totalb2bDiscountOrderResponse.result) ? totalb2bDiscountOrderResponse.result : DEACTIVE


					/**check maximum quantity */
					if (maximumNumberOfWashes) {
						if (totalb2bDiscountOrder >= maximumNumberOfWashes) {
							let response = {
								'status': STATUS_ERROR,
								'message': res.__("front.order.already_used_maximum_quantity")
							};
							return resolve(response);
						}
					}


					if (cartProductList.length > DEACTIVE) {

						for (const records of cartProductList) {

							const itemType = records.item_type || '';
							const itemId = records._id || '';

							if (itemType === ITEM_TYPE_PRODUCT) {
								const formattedRecords = records.product_detail?.[0] || {};
								const cartCategoryId = formattedRecords.parent_category ? new ObjectId(formattedRecords.parent_category) : '';

								if (categoryId.length > 0 && cartCategoryId) {
									if (categoryId.some(cat => cat.toString() === cartCategoryId.toString())) {
										b2bDiscountCodeAppliedItems.push(itemId);
									}
								}
							}

							if (itemType === ITEM_TYPE_SUBSCRIPTION) {
								const formattedRecords = records.subscription_detail?.[0] || {};
								const cartSubscriptionId = formattedRecords._id ? new ObjectId(formattedRecords._id) : '';

								if (subscriptionId.length > 0 && cartSubscriptionId) {
									if (subscriptionId.some(subscription => subscription.toString() === cartSubscriptionId.toString())) {
										b2bDiscountCodeAppliedItems.push(itemId);
									}
								}
							}

							if (itemType === ITEM_TYPE_PACKAGE) {
								const formattedRecords = records.package_detail?.[0] || {};
								const cartPackageId = formattedRecords._id ? new ObjectId(formattedRecords._id) : '';

								if (packageId.length > 0 && cartPackageId) {
									if (packageId.some(pkg => pkg.toString() === cartPackageId.toString())) {
										b2bDiscountCodeAppliedItems.push(itemId);
									}
								}
							}
						}
					}
					if (b2bDiscountCodeAppliedItems.length > 0) {
						let updateData = {
							b2b_code: b2b_code,
							b2b_discount_code_applied_ids: b2bDiscountCodeAppliedItems,
							modified: getUtcDate()
						};

						let condition = { user_id: new ObjectId(userId) }
						let option = { conditions: condition, updateData: { $set: updateData } }

						CartModel.updateCartData(req, res, option).then(cartUpdateResponse => {
							if (cartUpdateResponse.status == STATUS_SUCCESS) {
								let response = {
									'status': STATUS_SUCCESS,
									'message': res.__("front.system.apply_b2b_code")
								};
								return resolve(response);
							}
							else {
								finalResponse = {
									'data': {
										status: STATUS_ERROR,
										message: res.__("front.system.invalid_b2b_codeA")
									}
								};
								return returnApiResult(req, res, finalResponse);
							}
						});
					}
					else {
						let response = {
							'status': STATUS_ERROR,
							'message': res.__("front.system.invalid_b2b_codeB")
						};
						return resolve(response);

					}
				}
				else {
					let response = {
						'status': STATUS_ERROR,
						'message': res.__("front.system.invalid_b2b_codeC")
					};
					return resolve(response);
				}
			}


		}
		else {
			/** Send error response **/
			let response = {
				'status': STATUS_ERROR,
				'message': res.__("api.global.parameter_missing")
			};
			return resolve(response);
		}

	});
}


/**
 *  Function to check promo code
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
checkPromoCode = (req, res, options) => {
	return new Promise((resolve) => {
		let userId = (options.user_id) ? options.user_id : "";
		let promoCode = (options.promo_code) ? options.promo_code : "";
		let cartDetail = (options.cart_details) ? options.cart_details : "";

		if (userId && promoCode && cartDetail) {
			let promoCodeCondition = {
				'promo_code': promoCode,
				'status': ACTIVE,
				'is_deleted': NOT_DELETED
			};

			let promoCodeOption = {
				conditions: promoCodeCondition
			};
			/**get promo_code details */
			PromoCodeModel.getPromoCodeFindOne(promoCodeOption).then(async promoCodeResponse => {

				if (promoCodeResponse.status == STATUS_ERROR) {
					/** Send error response **/
					let response = {
						'status': STATUS_ERROR,
						'message': res.__("front.promo_code.promo_code_not_found")
					};
					return resolve(response);
				} else {
					let promoCodeDetails = (promoCodeResponse.result) ? promoCodeResponse.result : "";

					if (promoCodeDetails) {

						const promocodeAppliedItems = [];

						let codeValidFrom = (promoCodeDetails.code_valid_from) ? promoCodeDetails.code_valid_from : "";
						let codeValidTo = (promoCodeDetails.code_valid_to) ? promoCodeDetails.code_valid_to : "";
						let quantity = (promoCodeDetails.quantity) ? promoCodeDetails.quantity : "";
						let usedQuantity = (promoCodeDetails.used_quantity) ? promoCodeDetails.used_quantity : "";
						let weekDsays = (promoCodeDetails.week_days) ? promoCodeDetails.week_days : [];
						let startHours = (promoCodeDetails.start_hours) ? promoCodeDetails.start_hours : "";
						let endHours = (promoCodeDetails.end_hours) ? promoCodeDetails.end_hours : "";
						let categoryId = (promoCodeDetails.category_id) ? promoCodeDetails.category_id : [];
						let packageId = (promoCodeDetails.package_id) ? promoCodeDetails.package_id : [];
						let subscriptionId = (promoCodeDetails.subscription_id) ? promoCodeDetails.subscription_id : [];
						let cuponType = (promoCodeDetails.cupon_type) ? promoCodeDetails.cupon_type : "";
						let minOrderValue = (promoCodeDetails.min_order_value) ? promoCodeDetails.min_order_value : 0;
						let areaIds = (promoCodeDetails.area_id) ? promoCodeDetails.area_id : [];


						let totalOrderPrice = (cartDetail && cartDetail.result && cartDetail.result.total_without_discount_price) ? cartDetail.result.total_without_discount_price : 0;
						let cartProductList = (cartDetail && cartDetail.result && cartDetail.result.product_list) ? cartDetail.result.product_list : [];
						let cartPackageData = (cartDetail && cartDetail.result && cartDetail.result.package_data) ? cartDetail.result.package_data : "";
						let cartPackageId = (cartPackageData && cartPackageData._id) ? cartPackageData._id : "";
						let cartSubscriptionData = (cartDetail && cartDetail.result && cartDetail.result.subscription_data) ? cartDetail.result.subscription_data : "";
						let cartSubscriptionId = (cartSubscriptionData && cartSubscriptionData._id) ? cartSubscriptionData._id : "";
						let cartAreaId = (cartDetail && cartDetail.result && cartDetail.result.area_ids) ? cartDetail.result.area_ids : [];

						let removePromoCodeOptions = { user_id: userId };


						const today = new Date();
						/**check valid from or valid to */
						if (codeValidFrom && codeValidTo) {
							let code_valid_from = new Date(codeValidFrom);
							let code_valid_to = new Date(codeValidTo);
							if (today < code_valid_from || today > code_valid_to) {

								removePromoCode(req, res, removePromoCodeOptions);

								let response = {
									'status': STATUS_ERROR,
									'message': res.__("front.order.the_promo_code_is_not_valid_today")
								};
								return resolve(response);
							}
						}

						/**check minimum order value */
						if (minOrderValue > totalOrderPrice) {
							removePromoCode(req, res, removePromoCodeOptions);

							let response = {
								'status': STATUS_ERROR,
								'message': res.__("front.order.minimum_order_value_does_not_match")
							};
							return resolve(response);
						}

						/**check quantity */
						let totalOrderCondition = {
							conditions: {
								"promo_code_detail": { $ne: null },
								"promo_code_detail.promo_code": promoCode,
								"order_status": ORDER_PLACED,
								"status": { $ne: BOOKING_STATUS_CANCELLED }
							}
						}

						let totalDiscountOrderResponse = await OrderModel.getOrderCount(totalOrderCondition);
						let totalDiscountOrder = (totalDiscountOrderResponse.result) ? totalDiscountOrderResponse.result : DEACTIVE

						/**check maximum quantity */
						if (quantity) {
							if (totalDiscountOrder >= quantity) {
								removePromoCode(req, res, removePromoCodeOptions);

								let response = {
									'status': STATUS_ERROR,
									'message': res.__("front.order.already_used_maximum_quantity")
								};
								return resolve(response);
							}
						}

						/**check weekdays */
						const day = today.getDay().toString();
						if (weekDsays.length > 0) {
							if (!weekDsays.includes(day)) {

								removePromoCode(req, res, removePromoCodeOptions);

								let response = {
									'status': STATUS_ERROR,
									'message': res.__("front.order.today_is_not_in_the_allowed_week_days")
								};
								return resolve(response);
							}
						}

						/**check start hours and end hours*/
						if (startHours && endHours) {
							let currentHour = new Date().getHours().toString().padStart(2, "0"); // Get current hour in "HH" format
							if (currentHour < startHours || currentHour > endHours) {

								removePromoCode(req, res, removePromoCodeOptions);

								let response = {
									'status': STATUS_ERROR,
									'message': res.__("front.order.current_hour_is_outside_the_range")
								};
								return resolve(response);

							}
						}

						/**check coupon type */
						if (cuponType) {
							/**check one time use promocode */
							if (cuponType == ONE_TIME_USE) {
								let orderCondition = {
									conditions: {
										"user_id": userId,
										"promo_code_detail": { $ne: null },
										"promo_code_detail.promo_code": promoCode
									}
								}
								let countOrder = await OrderModel.getOrderCount(orderCondition);

								if (countOrder.status == STATUS_SUCCESS && countOrder.result > 0) {

									removePromoCode(req, res, removePromoCodeOptions);

									let response = {
										'status': STATUS_ERROR,
										'message': res.__("front.order.already_use_this_promo_code")
									};
									return resolve(response);

								}
							}

							/**check first booking only promocode */
							if (cuponType == FIRST_BOOKING_ONLY) {
								let orderCondition = {
									conditions: {
										"user_id": userId,
									}
								}
								let countOrder = await OrderModel.getOrderCount(orderCondition);

								if (countOrder.status == STATUS_SUCCESS && countOrder.result > 0) {

									removePromoCode(req, res, removePromoCodeOptions);

									let response = {
										'status': STATUS_ERROR,
										'message': res.__("front.order.this_promo_code_applicable_on_first_booking_only")
									};
									return resolve(response);

								}
							}
						}

						if (areaIds.length > 0) {
							let hasCommonId = cartAreaId.some(cartId =>
								areaIds.some(areaId => areaId.toString() === cartId.toString())
							);
							if (hasCommonId != true) {
								removePromoCode(req, res, removePromoCodeOptions);

								let response = {
									'status': STATUS_ERROR,
									'message': res.__("front.order.this_promo_code_not_applicable_for_your_location")
								};
								return resolve(response);
							}
						}
						else {

							removePromoCode(req, res, removePromoCodeOptions);

							finalResponse = {
								'data': {
									status: STATUS_ERROR,
									message: res.__("front.order.this_promo_code_not_applicable_for_your_location")
								}
							};
							return returnApiResult(req, res, finalResponse);
						}


						if (cartProductList.length > DEACTIVE) {

							for (const records of cartProductList) {

								const itemType = records.item_type || '';
								const itemId = records._id || '';

								if (itemType === ITEM_TYPE_PRODUCT) {
									const formattedRecords = records.product_detail?.[0] || {};
									const cartCategoryId = formattedRecords.parent_category ? new ObjectId(formattedRecords.parent_category) : '';

									if (categoryId.length > 0 && cartCategoryId) {
										if (categoryId.some(cat => cat.toString() === cartCategoryId.toString())) {
											promocodeAppliedItems.push(itemId);
										}
									}
								}


								if (itemType === ITEM_TYPE_SUBSCRIPTION) {
									const formattedRecords = records.subscription_detail?.[0] || {};
									const cartSubscriptionId = formattedRecords._id ? new ObjectId(formattedRecords._id) : '';

									if (subscriptionId.length > 0 && cartSubscriptionId) {
										if (subscriptionId.some(subscription => subscription.toString() === cartSubscriptionId.toString())) {
											promocodeAppliedItems.push(itemId);
										}
									}
								}


								if (itemType === ITEM_TYPE_PACKAGE) {
									const formattedRecords = records.package_detail?.[0] || {};
									const cartPackageId = formattedRecords._id ? new ObjectId(formattedRecords._id) : '';

									if (packageId.length > 0 && cartPackageId) {
										if (packageId.some(pkg => pkg.toString() === cartPackageId.toString())) {
											promocodeAppliedItems.push(itemId);
										}
									}
								}

							}
						}


						if (promocodeAppliedItems.length > 0) {

							let updateData = {
								promo_code: promoCode,
								promocode_applied_ids: promocodeAppliedItems,
								modified: getUtcDate()
							};

							let condition = { user_id: new ObjectId(userId) }

							let option = { conditions: condition, updateData: { $set: updateData } }

							CartModel.updateCartData(req, res, option).then(cartUpdateResponse => {
								if (cartUpdateResponse.status == STATUS_SUCCESS) {
									let response = {
										'status': STATUS_SUCCESS,
										'message': res.__("front.system.apply_promo_code")
									};
									return resolve(response);
								}
								else {

									removePromoCode(req, res, removePromoCodeOptions);

									finalResponse = {
										'data': {
											status: STATUS_ERROR,
											message: res.__("front.system.invalid_promo_code")
										}
									};
									return returnApiResult(req, res, finalResponse);
								}
							});
						}
						else {

							removePromoCode(req, res, removePromoCodeOptions);

							let response = {
								'status': STATUS_SUCCESS,
								'message': ''
							};
							return resolve(response);

						}
					}
					else {
						let response = {
							'status': STATUS_ERROR,
							'message': res.__("front.system.invalid_promo_code")
						};
						return resolve(response);
					}
				}
			})

		} else {
			/** Send error response **/
			let response = {
				'status': STATUS_ERROR,
				'message': res.__("api.global.parameter_missing")
			};
			return resolve(response);
		}

	});
}



/**
 *  Function to remove promo code
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
removePromoCode = (req, res, options) => {
	return new Promise((resolve) => {
		let userId = (options.user_id) ? options.user_id : "";
		let option = {
			conditions: { 'user_id': new ObjectId(userId) },
			updateData: { $set: { 'modified': getUtcDate() }, $unset: { "promo_code": 1, "promocode_applied_ids": 1 } }
		}

		CartModel.updateCartData(req, res, option).then(cartUpdateResponse => {
			if (cartUpdateResponse.status == STATUS_SUCCESS) {
				return resolve(true);
			} else {
				return resolve(false);
			}
		});
	});
}



/**
 * Function for push notification
 *
 * @param req 		As 	Request Data
 * @param res 		As 	Response Data
 * @param options	As	Object data
 *
 * @return null

 */

const firebaseAdmin = require("firebase-admin");
const path = require("path");


// Load Firebase Service Account JSON
const serviceAccount = require(path.join(__dirname, "car-wash-24467-firebase-adminsdk-fbsvc-25130c504a.json"));

// Initialize Firebase Admin
if (!firebaseAdmin.apps.length) {
	firebaseAdmin.initializeApp({
		credential: firebaseAdmin.credential.cert(serviceAccount),
	});
} else {
	firebaseAdmin.app();
}


pushNotification = (req, res, options) => {
	return new Promise(resolve => {
		let notiData = options.notification_data || {};
		let notiType = parseInt(notiData["notification_type"]) || "";
		let messageParams = notiData["message_params"] || "";
		let createdBy = notiData["created_by"] || (req.session.user?._id || "");
		let createdByRoleId = notiData["user_role_id"] || (req.session.user?.user_role_id || "");
		let languageCode = notiData["lang_code"] || DEFAULT_LANGUAGE_CODE;
		let userId = notiData["user_id"] || "";
		let bookingId = notiData["booking_id"] || "";
		let bookingStatus = notiData["booking_status"] || null;
		let userIds = notiData["user_ids"] || [];

		// Get Notification Type Details
		PushNotificationTypeModel.getPushNotificationTypeFindOne({ conditions: { notification_type: notiType } })
			.then(notiTypeRes => {
				if (notiTypeRes.status !== STATUS_SUCCESS || !notiTypeRes.result) {
					return resolve({ status: STATUS_ERROR, message: res.__("Something went wrong, please try again") });
				}

				let typeResult = notiTypeRes.result || {};
				let constants = typeResult.constant ? typeResult.constant.split(",") : [];

				// Generate Notification Title & Body
				let pnTitle = typeResult.pages_descriptions?.[languageCode]?.title || "";
				let pnBody = typeResult.pages_descriptions?.[languageCode]?.message || "";

				if (messageParams) {
					constants.forEach((constant, i) => {
						let placeholder = `{${constant.trim()}}`;
						pnTitle = pnTitle.replace(new RegExp(placeholder, "g"), messageParams[i]);
						pnBody = pnBody.replace(new RegExp(placeholder, "g"), messageParams[i]);
					});
				}

				// Define Query for Users
				let condition = userIds.length > 0
					? { _id: { $in: userIds.map(id => new ObjectId(id)) }, is_deleted: NOT_DELETED }
					: { _id: new ObjectId(userId), is_deleted: NOT_DELETED };

				let optionsObj = { conditions: condition, fields: { _id: 1, full_name: 1, device_details: 1 }, collection: TABLE_USERS };

				DbClass.getFindAllWithoutLimit(optionsObj).then(userDeviceResponse => {
					let userResult = userDeviceResponse.result || [];

					if (userResult.length === 0) {
						return resolve({ status: STATUS_ERROR, result: {} });
					}

					async.each(userResult, function (user, callback) {
						let insertUserId = user._id || "";
						let deviceType = user.device_details?.[0]?.device_type || "ios";
						let deviceToken = user.device_details?.[0]?.device_token || "";

						//let deviceToken = user.device_details?.[0]?.device_token || "cxvgtAxoS0bussK-4fj0MX:APA91bFz7IzhEfV_xZhBOPIBa0cI55Zqho3AOez5m7xzDDCv2XDqeTwlQChCRXLp3V-BoI9cOHx63eSNkvYd_IQ_h7-9_su0_SFnpBAZ0lCMWKXKMRmO3mI";

						if (!deviceToken) {
							// console.log(`❌ No Device Token for User: ${insertUserId}`);
							return callback(null);
						}

						let messagePayloadData = { user_id: String(insertUserId), notification_type: String(notiType) };

						if (bookingId) {
							messagePayloadData.booking_id = String(bookingId);
						}

						if (bookingStatus != null) {
							messagePayloadData.booking_status = String(bookingStatus);
						}
						else {
							messagePayloadData.booking_status = '0';
						}

						let messagePayload = {
							token: deviceToken,
							notification: {
								title: pnTitle,
								body: pnBody
							},
							data: messagePayloadData,
							android: {
								priority: "high",
								notification: {
									sound: "default",
								}
							},
							apns: {
								payload: {
									aps: {
										alert: {
											title: pnTitle,
											body: pnBody
										},
										sound: "default",
										badge: 1,
										content_available: true
									}
								}
							}
						};

						firebaseAdmin.messaging().send(messagePayload)
							.then(response => {
								let savePushNotificationData = {
									user_id: insertUserId,
									created_role_id: createdByRoleId,
									created_by: createdBy ? new ObjectId(createdBy) : "",
									title: pnTitle,
									message: pnBody,
									title_descriptions: pnTitle,
									message_descriptions: pnBody,
									extra_parameters: notiData.extra_parameters || {},
									notification_type: notiType,
									device_type: deviceType,
									device_token: deviceToken,
									request: messagePayload,
									response: JSON.stringify(response),
									sentStatus: true,
									created: getUtcDate(),
									modified: getUtcDate(),
								};

								savePNRequest(req, res, savePushNotificationData);
								callback(null);
							})
							.catch(async error => {


								let options = {
									conditions: { _id: new ObjectId(insertUserId) },
									updateData: {
										$set: { device_details: "" }
									},
								};

								await UserModel.updateOneUser(req, res, options);


								console.error("❌ Firebase Error:", error);
								callback(null);
							});
					}, function done() {
						return resolve({ status: STATUS_SUCCESS, result: [] });
					});

				});
			});
	});
};


/**Function to save pn log */
savePNRequest = (req, res, options) => {
	let option = {
		insertData: options,
		collection: TABLE_PN_LOGS
	}
	DbClass.saveInsertOne(req, res, option).then(saveResponse => {

	});
	return;
}//End savePNRequest();


/**
 * Function for add Days in today date
 *
 * @param date 		As 	Request date
 * @param days 		As 	Response days
 *
 * @return null
 */
addDays = (date, days) => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result.toISOString().split('T')[0];
}


/**
 * Function for push notification
 *
 * @param req 		As 	Request Data
 * @param res 		As 	Response Data
 * @param options	As	Object data
 *
 * @return null

 */
checkAvailableTimeSlot = (req, res, options) => {
	return new Promise(resolve => {
		let userId = (options.user_id) ? options.user_id : "";
		let areaIds = (options.area_ids) ? options.area_ids : [];
		let bookingDate = (options.booking_date) ? options.booking_date : "";
		let timeSlot = (options.time_slot) ? options.time_slot : "";
		let providerType = (options.provider_type) ? options.provider_type : "";

		let timeSlotAvailable = true;

		let objectAreaIds = areaIds.map(id => new ObjectId(id));

		if (userId && timeSlot && bookingDate) {

			bookingDateTime = new Date(bookingDate + 'T' + timeSlot);
			booking_timestamp = bookingDateTime.getTime();

			let timestamp_after_one_hours = booking_timestamp - 3600000;



			let date_time = new Date();
			let currentTimeStamp = date_time.getTime();

			if (timestamp_after_one_hours <= currentTimeStamp) {
				let resolveResponse = {
					status: STATUS_ERROR,
					result: false,
					message: res.__("admin.system.something_going_wrong_please_try_again"),

				}
				return resolve(resolveResponse);
			}



			let conditions = {
				date: bookingDate
			};

			let leaveDateOptions = {
				conditions: conditions,
				fields: { _id: 1, date: 1, leave_reason: 1 }
			}



			let serviceProviderCondition =
			{
				area_id: { '$in': objectAreaIds },
				is_deleted: DEACTIVE,
				status: ACTIVE,
				user_type: SERVICE_PROVIDER_USER_TYPE,
				provider_type: providerType

			};

			let serviceProviderOptionObj = {
				conditions: serviceProviderCondition,
				collection: TABLE_USERS,
			};

			DbClass.getFindAllWithoutLimit(serviceProviderOptionObj).then(providerRes => {

				let responseStatus = (providerRes.status) ? providerRes.status : "";
				let ProviderResult = (providerRes.result) ? providerRes.result : "";
				if (responseStatus == STATUS_ERROR) {
					let resolveResponse = {
						status: STATUS_ERROR,
						result: false,
						message: res.__("admin.system.something_going_wrong_please_try_again"),

					}
					return resolve(resolveResponse);
				} else {

					if (ProviderResult.length > 0) {

						let totalAreaProvider = ProviderResult.length;

						let optionObj = {
							collection: TABLE_BOOK_SLOT,
							conditions: {
								date: bookingDate,
								slot_time: timeSlot,
							}
						};

						DbClass.getFindOne(optionObj).then((response) => {
							let responseStatus = response.status ? response.status : "";
							let bookSlotData = response.result ? response.result : "";

							let totalAcceptProvider = bookSlotData.service_providers ? bookSlotData.service_providers.length : 0;

							if (responseStatus == STATUS_SUCCESS) {

								if (totalAreaProvider > totalAcceptProvider) {

									let response = {
										'status': STATUS_SUCCESS,
										"result": timeSlotAvailable,
										'message': ""
									};
									return resolve(response);
								}
								else {

									timeSlotAvailable = false;

									let response = {
										'status': STATUS_SUCCESS,
										"result": timeSlotAvailable,
										'message': ""
									};
									return resolve(response);
								}
							}

						})

					} else {
						let response = {
							'status': STATUS_ERROR,
							"result": false,
							'message': res.__("front.global.no_record_found")
						};
						return resolve(response);
					}
				}
			})
		}
		else {
			/** Send error response **/
			let response = {
				'status': STATUS_ERROR,
				"result": false,
				'message': res.__("api.global.parameter_missing")
			};
			return resolve(response);
		}

	})
}//End checkAvailableTimeSlot()




updateServiceProviderTimeSlot = async (req, res, options) => {
	return new Promise(async (resolve, reject) => {
		let bookingStartDateTime = options.booking_start_timestamp || "";
		let bookingEndDateTime = options.booking_end_timestamp || "";
		const timeSlotInterval = TIME_SLOT_INTERVAL; // 30 minutes in milliseconds

		let timeRemaining = bookingStartDateTime % timeSlotInterval;
		if (timeRemaining !== 0) {
			bookingStartDateTime -= timeRemaining;
		}

		let timeSlots = [];
		let currentTime = bookingStartDateTime;
		let promises = [];

		while (currentTime <= bookingEndDateTime) {
			let date = new Date(currentTime);
			let bookingDate = date.toISOString().split('T')[0]; // Extracts "YYYY-MM-DD"
			let formattedTime = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

			let timeSlotOptions = {
				date: bookingDate,
				slot_time: formattedTime,
				booking_status: options.booking_status || "",
				service_provider_id: options.service_provider_id || null,
				booking_id: options.booking_id || null,
				order_number: options.order_number || null,
			};

			// Push promises into an array
			promises.push(addMultipleTimeSlotBook(req, res, timeSlotOptions));


			currentTime += timeSlotInterval;
		}

		// Wait for all time slots to be processed
		await Promise.all(promises);

		console.log("Generated Time Slots:", timeSlots);
		resolve(timeSlots);
	});
};


addMultipleTimeSlotBook = (req, res, options) => {
	return new Promise((resolve, reject) => {
		let date = options.date ? options.date : "";
		let slotTime = options.slot_time ? options.slot_time : "";
		let bookingStatus = options.booking_status ? options.booking_status : "";
		let serviceProviderId = options.service_provider_id ? options.service_provider_id : "";
		let bookingId = options.booking_id ? options.booking_id : "";
		let orderNumber = options.order_number ? options.order_number : "";
		let booking_timestamp = null;
		let bookingDateTime = null;

		/** Condition for booking date and time */
		if (date && slotTime) {
			bookingDateTime = new Date(date + 'T' + slotTime);
			booking_timestamp = bookingDateTime.getTime();
		}

		let optionObj = {
			collection: TABLE_BOOK_SLOT,
			conditions: {
				booking_date_time: bookingDateTime
			}
		};

		DbClass.getFindOne(optionObj)
			.then((response) => {
				let responseStatus = response.status ? response.status : "";
				let bookSlotData = response.result ? response.result : "";

				if (responseStatus == STATUS_SUCCESS && bookSlotData) {
					let updateData = {
						modified: getUtcDate(),
						date: date,
						slot_time: slotTime,
						booking_slot_timestamp: booking_timestamp,
						booking_date_time: bookingDateTime
					};

					let updateOptionObj = {
						collection: TABLE_BOOK_SLOT,
						conditions: { _id: new ObjectId(bookSlotData._id) },
					};

					if (bookingStatus === BOOKING_STATUS_CANCELLED) {
						// Remove service provider from array
						updateOptionObj.updateData = {
							$set: updateData,
							$pull: { service_providers: { user_id: new ObjectId(serviceProviderId) } }
						};
					} else {
						// Add service provider to array
						updateOptionObj.updateData = {
							$set: updateData,
							$addToSet: {
								service_providers:
								{
									user_id: new ObjectId(serviceProviderId),
									booking_id: new ObjectId(bookingId),
									order_number: orderNumber,
								}
							}
						};
					}

					DbClass.updateOneRecord(req, res, updateOptionObj)
						.then(() => resolve({ status: 1 }))
						.catch((error) => reject({ status: 0, error }));
				} else {
					if (bookingStatus !== BOOKING_STATUS_CANCELLED) {
						let insertOptionObj = {
							collection: TABLE_BOOK_SLOT,
							insertData: {
								date: date,
								slot_time: slotTime,
								service_providers: [
									{
										user_id: new ObjectId(serviceProviderId),
										booking_id: new ObjectId(bookingId),
										order_number: orderNumber,
									}
								],
								booking_slot_timestamp: booking_timestamp,
								booking_date_time: bookingDateTime,
								created: getUtcDate(),
								modified: getUtcDate()
							}
						};

						DbClass.saveInsertOne(req, res, insertOptionObj)
							.then(() => resolve({ status: 1 }))
							.catch((error) => reject({ status: 0, error }));
					} else {
						// If booking type is cancel but no record exists, return success without inserting
						resolve({ status: 1 });
					}
				}
			})
			.catch((error) => reject({ status: 0, error }));
	});
};




getTimeSlotList = async (req, res, options) => {
	return new Promise(async (resolve, reject) => {
		try {
			let langCode = options.lang_code || DEFAULT_LANGUAGE_CODE;
			let userId = options._id || "";
			let userType = options.user_type || "";
			let bookingDate = options.booking_date || new Date().toISOString().split('T')[0];
			let latitude = options.latitude || null;
			let longitude = options.longitude || null;
			let providerType = options.provider_type || SERVICE_PROVIDER_TYPE_BIKE_FLEET;

			let todayDate = new Date().toISOString().split('T')[0];
			let next7DaysDate = addDays(todayDate, 6);

			// Validation
			if (!userId || !bookingDate || !latitude || !longitude) {
				return resolve({
					status: STATUS_ERROR,
					result: {},
					message: res.__("api.global.parameter_missing")
				});
			}

			if (userType !== CUSTOMER_USER_TYPE) {
				return resolve({
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.system.you_are_not_allowed_to_access_this_page")
				});
			}

			if (bookingDate < todayDate || bookingDate > next7DaysDate) {
				return resolve({
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.global.invalid_date")
				});
			}

			let leaveConditions = { date: bookingDate };
			let leaveDateOptions = {
				conditions: leaveConditions,
				fields: { _id: 1, date: 1, leave_reason: 1 }
			};

			let leaveResponse = await LeaveManagementModel.getLeaveManagementFindOne(leaveDateOptions);
			if (leaveResponse.status === STATUS_SUCCESS && leaveResponse.result) {
				return resolve({
					status: STATUS_ERROR,
					result: leaveResponse.result,
					message: res.__("front.user.this_date_on_leave")
				});
			}

			const getDayName = (dateStr) => {
				const date = new Date(dateStr);
				const options = { weekday: 'long' };
				return date.toLocaleDateString('en-US', options).toLowerCase();
			};

			let dayName = getDayName(bookingDate);

			let slotResponse = await SlotModel.getSlotFindOne({
				conditions: { is_deleted: NOT_DELETED }
			});

			if (slotResponse.status !== STATUS_SUCCESS) {
				return resolve({
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.system.something_going_wrong_please_try_again")
				});
			}

			let timeSlots = slotResponse.result?.time_slot?.[dayName] || {};
			let areaIds = await getAreaIdsArrayFromLatLong(req, res, { latitude, longitude });

			let itemSlotList = [];

			for (const [key, slot] of Object.entries(timeSlots)) {
				let checkOptions = {
					area_ids: areaIds,
					user_id: userId,
					booking_date: bookingDate,
					time_slot: slot,
					provider_type: providerType
				};

				try {
					let timeSlotResponse = await checkAvailableTimeSlot(req, res, checkOptions);
					itemSlotList.push({
						key,
						value: slot,
						time_slot_available: timeSlotResponse.result || false
					});
				} catch (err) {
					console.error("Error checking time slot availability:", err);
					itemSlotList.push({
						key,
						value: slot,
						time_slot_available: false
					});
				}
			}

			// Final resolved response
			return resolve({
				status: STATUS_SUCCESS,
				result: itemSlotList,
				message: ""
			});
		} catch (error) {
			console.error("getTimeSlotList error:", error);
			return reject({
				status: STATUS_ERROR,
				result: {},
				message: res.__("front.system.something_going_wrong_please_try_again")
			});
		}
	});
};






addQuantityIntoProduct = (req, res, options) => {
	return new Promise(async (resolve, reject) => {

		try {
			let userId = options.user_id ? options.user_id : "";
			let bookingId = options.booking_id ? options.booking_id : "";

			let ordCondition = {
				order_id: bookingId
			};
			let orderItemOptionObj = {
				conditions: ordCondition,
				fields: { product_id: 1, item_type: 1, product_cart_quantity: 1 }
			};

			await OrderModel.getOrderItemList(orderItemOptionObj).then(orderItemResponse => {

				if (orderItemResponse.status == STATUS_SUCCESS) {
					async.each(orderItemResponse.result, async (records, childCallback) => {

						let itemType = (records.item_type) ? records.item_type : '';

						/**condition for product */
						if (itemType === ITEM_TYPE_PRODUCT) {
							let productId = (records.product_id) ? new ObjectId(records.product_id) : '';
							let productQuantity = (records.product_cart_quantity) ? parseInt(records.product_cart_quantity) : DEACTIVE;

							//   product order log insert
							let productCondition = {
								_id: productId
							}
							let optionObjProduct = {
								conditions: productCondition,
							}

							await ProductModel.productFindOne(optionObjProduct).then(async productDetailResponse => {
								if (productDetailResponse.status == STATUS_SUCCESS) {

									console.log("productDetailResponse", productDetailResponse);

									let product_quantity = (productDetailResponse.result.quantity) ? Number(productDetailResponse.result.quantity) : 0;
									let new_product_quantity = product_quantity + productQuantity;

									let optionObj = {
										insertData: {
											create_by: new ObjectId(userId),
											product_id: productId,
											order_id: bookingId,
											post_quantity: product_quantity,
											new_quantity: new_product_quantity,
											quantity: productQuantity,
											action: ADD,
											note: res.__("admin.system.cancel_booking"),
											created: getUtcDate(),
											modified: getUtcDate(),
										}
									}

									console.log("optionObj", optionObj);

									await ProductModel.saveOneStockLog(req, res, optionObj);



								}
							})

							//   product order log insert
							let productOption = {
								conditions: { _id: productId },
								updateData: {
									$inc: { quantity: +productQuantity },
									$set: { modified: getUtcDate() }
								}
							};
							/**update product quantity*/
							let productUpdateResponse = await ProductModel.updateOneProduct(req, res, productOption);
							if (productUpdateResponse.status == STATUS_SUCCESS) {
								return resolve(true);
							}
							else {
								return resolve(false);
							}
						}
					});
				}
			})

		} catch (error) {
			return resolve(false);
		}
	});
};
