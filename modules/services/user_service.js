//var ObjectId		= require('mongodb').ObjectID;
const { ObjectId } = require('mongodb');
var crypto = require('crypto');
const asyncParallel = require("async/parallel");
const moment = require('moment');
const { area } = require('@turf/turf');
const UserModel = require(WEBSITE_ADMIN_MODULES_PATH + "users/model/user");
function UserService() {

	/**
	* function for add rider user
	*
	* param null
	* */
	this.addUser = (req, res, next, callback) => {
		return new Promise(resolve => {
			/** Sanitize Data **/
			let finalResponse = {};
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			
			let userType = (req.params.user_type) ? req.params.user_type : "";
			let fullName = (req.body.full_name) ? req.body.full_name : "";
			let email = (req.body.email) ? req.body.email : "";
			let requestFrom = (req.body.request_from) ? req.body.request_from : "";

			let apiType = (req.body.api_type) ? req.body.api_type : ADMIN_API_TYPE;
			let gender = (req.body.gender) ? Number(req.body.gender) : FEMALE;
			let mobileCode = (req.body.mobile_code) ? req.body.mobile_code : "";
			let mobile = (req.body.mobile) ? req.body.mobile : "";
			let mobileNumber = (req.body.mobile_number) ? req.body.mobile_number : "";
			let dob = (req.body.dob) ? req.body.dob : "";
			let country_id = (req.body.country_id) ? new ObjectId(req.body.country_id) : "";
			let state_id = (req.body.state_id) ? new ObjectId(req.body.state_id) : "";
			let city_id = (req.body.city_id) ? new ObjectId(req.body.city_id) : "";
			let zipCode = (req.body.zip) ? Number(req.body.zip) : "";
			let areaId 			= (req.body.area_id) ? req.body.area_id : "";
			let language 		= (req.body.language) ? req.body.language : DEFAULT_LANGUAGE_CODE;
			let providerType 	= (req.body.provider_type) ? req.body.provider_type : '';
			let franchiseType 	= (req.body.franchise_type) ? req.body.franchise_type : '';
			let franchiseNumber = (req.body.franchise_number) ? req.body.franchise_number : '';
			
		
			/** Set options for upload image **/
			let image = (req.files && req.files.profile_image) ? req.files.profile_image : "";

			/** Configure user unique conditions **/
			const users = db.collection(TABLE_USERS);

			let errMessageArray = [];
			let options = {
				'image': image,
				'filePath': USERS_FILE_PATH,
			};
			/** Upload user image **/
			moveUploadedFile(req, res, options).then(response => {
				if (response.status == STATUS_ERROR) {
					/** Send error response **/
					errMessageArray.push({ 'path': 'profile_image', 'msg': response.message });
					if (errMessageArray.length > 0) {
						finalResponse = {
							status: STATUS_ERROR_FORM_VALIDATION,
							errors: errMessageArray,
							message: "Errors",
						};
						return resolve(finalResponse);
					}
				}
				let slugOptions = {
					title: fullName,
					table_name: TABLE_USERS,
					slug_field: "slug"
				};
				var imageName = (response.fileName) ? response.fileName : "";

				asyncParallel({
					/** Genrate OTP for email **/
					email_otp: (callback) => {
						getRandomOTP().then(email_otp => {
							callback(null, email_otp);
						})
					},
					/** Genrate slug **/
					slug: (callback) => {
						getDatabaseSlug(slugOptions).then(slugResponse => {
							callback(null, slugResponse);
						})
					},
				}, (err, responseAll) => {
					let emailOtpCode = responseAll.email_otp;
					let slugName = responseAll.slug.title;

					let isEmailVerified = (requestFrom == REQUEST_FROM_ADMIN) ? VERIFIED : NOT_VERIFIED;
					let isMobileVerified = (requestFrom == REQUEST_FROM_ADMIN) ? VERIFIED : NOT_VERIFIED;

					let currentTimeStamp = new Date().getTime();
					var validateString = crypto.createHash('md5').update(currentTimeStamp + email).digest("hex");

					let age = DEACTIVE;
					if (dob != "") {
						age = calculateAge(dob);
					}

					let insertUserData = {
						display_name: fullName,
						full_name: fullName,
						email: email,
						email_otp: emailOtpCode,
						is_email_verified: isEmailVerified,
						is_mobile_verified: isMobileVerified,
						date_joined: getUtcDate(),
						request_from: requestFrom,
						slug: slugName,
						usr_slug: slugName,
						last_login: getUtcDate(),
						is_blocked: UN_BLOCK,
						status: ACTIVE,
						api_type: apiType,
						is_deleted: NOT_DELETED,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						user_type: userType,
						validate_string: validateString,
						age: age,
						dob: dob,
						gender: gender,
						profile_image: imageName,
						zip: zipCode,
						language: language,
						country_id: country_id,
						state_id: state_id,
						city_id: city_id,
						mobile_code: mobileCode,
						mobile: mobile,
						mobile_number: mobileNumber,
						wallet_status: ACTIVE,
						franchise_type: franchiseType,
						franchise_number: franchiseNumber,
						activated_at: getUtcDate(),
						created: getUtcDate(),
						modified: getUtcDate()
					};

					/**condition for area */
					if ([ SERVICE_PROVIDER_USER_TYPE].includes(userType)) {
						insertUserData['area_id'] = (areaId) ? new ObjectId(areaId) : "";
						insertUserData['provider_type'] = providerType
					}

					/**condition for customer wallet status */
					if ([CUSTOMER_USER_TYPE ].includes(userType)) {
						insertUserData['wallet_status'] = ACTIVE
					}

					/** Insert record*/
					let optionObj = {
						insertData: insertUserData,
						collection: TABLE_USERS
					}
					UserModel.saveUserData(req, res, optionObj).then(async(saveResult) => {
						let responseStatus = (saveResult.status) ? saveResult.status : "";
						let responseResult = (saveResult.result) ? saveResult.result : "";


						if(userType == SERVICE_PROVIDER_USER_TYPE){
							let optionsObject = {
								area_id : areaId,
								service_provider_id : responseResult.insertedId
							}
	
							await updateServiceProviderInContract(req, res, optionsObject);
						}
	
						finalResponse = {
							status: STATUS_SUCCESS,
							result: {
								email: email,
								// password: password,
								fullName: fullName,
								validateString: validateString,
								emailOtpCode: emailOtpCode,
								lastInsertId: responseResult.insertedId,
							},
							message: STATUS_SUCCESS,
						};
						return resolve(finalResponse);
					})
				});

			});
		}).catch(next);
	};


	/**
	* function for edit  user
	* param null
	* */
	this.editUser = (req, res, next, callback) => {
		return new Promise(resolve => {
			/** Sanitize Data **/
			let finalResponse = {};
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			let loginUserData = (req.body) ? req.body : "";
			let userId = (loginUserData.id) ? loginUserData.id : "";
			let userType = (loginUserData.user_type) ? loginUserData.user_type : "";

			if (!userId) {
				finalResponse = {
					status: STATUS_ERROR_INVALID_ACCESS,
					result: {},
					message: res.__("front.system.you_are_not_allowed_to_access_this_page")
				};
				return resolve(finalResponse);
			}
			
			let fullName = (req.body.full_name) ? req.body.full_name : "";
			let email = (req.body.email) ? req.body.email : "";
			let gender = (req.body.gender) ? Number(req.body.gender) : FEMALE;
			let mobileCode = (req.body.mobile_code) ? req.body.mobile_code : "";
			let mobile = (req.body.mobile) ? req.body.mobile : "";
			let mobileNumber 	= (req.body.mobile_number) ? req.body.mobile_number : "";
			let dob 			= (req.body.dob) ? req.body.dob : "";
			let zipCode			= (req.body.zip) ? Number(req.body.zip) : "";
			let country_id 		= (req.body.country_id) ? new ObjectId(req.body.country_id) : "";
			let state_id 		= (req.body.state_id) ? new ObjectId(req.body.state_id) : "";
			let city_id 		= (req.body.city_id) ? new ObjectId(req.body.city_id) : "";
			let areaId 			= (req.body.area_id) ? req.body.area_id : "";
			let language 		= (req.body.language) ? req.body.language : DEFAULT_LANGUAGE_CODE;
			let providerType 	= (req.body.provider_type) ? req.body.provider_type : '';
			let franchiseType 	= (req.body.franchise_type) ? req.body.franchise_type : '';
			let franchiseNumber = (req.body.franchise_number) ? req.body.franchise_number : '';
		
			/** Set options for upload image **/
			let oldimage = (req.body.old_image) ? req.body.old_image : "";
			let image = (req.files && req.files.profile_image) ? req.files.profile_image : "";
			let options = {
				'image': image,
				'filePath': USERS_FILE_PATH,
				'oldPath': oldimage
			};

			/** Upload user  image **/
			moveUploadedFile(req, res, options).then(response => {
				if (response.status == STATUS_ERROR) {
					/** Send error response **/
					finalResponse = {
						status: STATUS_ERROR_INVALID_ACCESS,
						result: "",
						message: response.message
					};
					return callback(finalResponse);
				}
				let imageName = (response.fileName) ? response.fileName : "";

				/** Set update data **/
				let updateData = {
					email: email,
					display_name: fullName,
					full_name: fullName,
					dob: dob,
					gender: gender,
					profile_image: imageName,
					zip: zipCode,
					language: language,
					country_id: country_id,
					state_id: state_id,
					city_id: city_id,
					mobile_code: mobileCode,
					mobile: mobile,
					mobile_number: mobileNumber,
					franchise_type: franchiseType,
					franchise_number: franchiseNumber,
					modified: getUtcDate()
				};

				/**condition for area */
				if ([SERVICE_PROVIDER_USER_TYPE].includes(userType)) {
					updateData['area_id'] = (areaId) ? new ObjectId(areaId) : "";
					updateData['provider_type'] = providerType
				}


				/** Save and update user data **/
				let conditionsObj = { _id: new ObjectId(userId) };
				let optionObj = {
					conditions: conditionsObj,
					updateData: { $set: updateData },
					collection: TABLE_USERS
				}
				UserModel.updateOneUser(req, res, optionObj).then(async(updateResult) => {
					let responseStatus = (updateResult.status) ? updateResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						finalResponse = {
							status: STATUS_ERROR,
							result: {},
							message: res.__("admin.system.something_going_wrong_please_try_again"),
						};
						return resolve(finalResponse);
					} else {

						if(userType == SERVICE_PROVIDER_USER_TYPE){
							let optionsObject = {
								area_id : areaId,
								service_provider_id : userId
							}
	
							await updateServiceProviderInContract(req, res, optionsObject);
						}

						/** Send success response **/
						finalResponse = {
							status: STATUS_SUCCESS,
							result: {},
							message: res.__("front.user.profile_has_been_updated_successfully"),
						};
						return resolve(finalResponse);
					}
				});

			}).catch(next);
		});
	};


}
module.exports = new UserService();
