const asyncParallel = require('async/parallel');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
var async = require('async');
const RegistrationModel = require('../model/registrationModel');
const OrderModel = require('../model/orderModel');


function Registration() {

    /**
    * Function for user registration
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next	As Callback argument to the middleware function
    *
    * @return json
    **/
    this.userRegistration = (req, res, next) => {
        let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let email = (req.body.email) ? req.body.email.toLowerCase() : "";
        let fullName = (req.body.full_name) ? req.body.full_name : "";
        let mobile = (req.body.mobile_number) ? req.body.mobile_number : "";
        let mobileCode = (req.body.mobile_code) ? req.body.mobile_code : "";
        let gender = (req.body.gender) ? parseInt(req.body.gender) : "";
        let language = (req.body.language) ? req.body.language : "";
        let termsConditions = (req.body.terms_conditions) ? true : false;
        let mobileNumber = mobileCode + mobile;
        let userType = (req.body.user_type) ? req.body.user_type : "";

        asyncParallel({
            slug: (callback) => {
                /** Get slug **/
                getDatabaseSlug({ 'title': fullName, 'table_name': TABLE_USERS, 'slug_field': "slug" }).then(slugRes => {
                    callback(null, slugRes && slugRes.title || "");
                }).catch(next);
            },
            email_otp: (otpCallback) => {
                /** Get otp number **/
                getRandomOTP().then(otp => {
                    otpCallback(null, otp);
                }).catch(next);
            },
            mobile_otp: (otpCallback) => {
                /** Get otp number **/
                getRandomOTP().then(otp => {
                    otpCallback(null, otp);
                }).catch(next);
            },
        }, (asyncErr, asyncRes) => {
            if (!asyncErr && asyncRes) {

                let slug = asyncRes.slug;
                let emailOtpCode = asyncRes.email_otp;
                let mobileOtpCode = asyncRes.mobile_otp;
                let otpExpireTime = addHoursToDate(OTP_EXPIRE_TIME, getUtcDate(), "sec");
                let userId = new ObjectId();
                let validateString = crypto.createHash("md5").update(currentTimeStamp() + email).digest("hex");

                /** Save insert user data */
                let userData = {
                    '_id': userId,
                    'user_role_id': FRONT_ADMIN_ROLE_ID,
                    'user_type': CUSTOMER_USER_TYPE,
                    'full_name': fullName,
                    'email': email,
                    'mobile_code': mobileCode,
                    'mobile_number': mobileNumber,
                    'mobile': mobile,
                    'gender': gender,
                    'language': language,
                    'email_otp': emailOtpCode,
                    'mobile_otp': mobileOtpCode,
                    'is_email_verified': NOT_VERIFIED,
                    'is_mobile_verified': NOT_VERIFIED,
                    'is_verified': NOT_VERIFIED,
                    'email_otp_expire_time': otpExpireTime,
                    'mobile_otp_expire_time': otpExpireTime,
                    'validate_string': validateString,
                    'is_deleted': NOT_DELETED,
                    'status': ACTIVE,
                    'slug': slug,
                    'terms_conditions': termsConditions,
                    'consent_with_policy': DEACTIVE,
                    'wallet_amount': DEACTIVE,
                    'otp_type': OTP_TYPE_REGISTRATION,
                    'first_booking': ACTIVE,
                    'created': getUtcDate(),
                    'modified': getUtcDate()
                }

                let option = {
                    insertData: userData
                };

                RegistrationModel.saveUser(req, res, option).then(saveResponse => {
                    if (saveResponse.status == STATUS_ERROR) {
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.system.something_going_wrong_please_try_again"),
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    } else {

                        /** Set options for send email 
                        let emailOptions = {
                            to: email,
                            action: "front_email_verify_otp",
                            rep_array: [fullName, emailOtpCode],
                        };
                        sendMail(req, res, emailOptions); 
						***/

                       // sendSMS(req, res, { "mobile_number": mobileNumber, "type": "1", "params": [mobileOtpCode] });

                        finalResponse = {
                            'data': {
                                status: STATUS_SUCCESS,
                                result: {
                                    'email': email,
                                    'full_name': fullName,
                                    'validate_string': validateString,
                                    'email_otp': emailOtpCode,
                                    'mobile_otp': mobileOtpCode,
                                    'otp_type': OTP_TYPE_REGISTRATION
                                },
                                message: res.__("front.user.user_added_successfully"),
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                });
            }
        });
    }


    /**
    * Function for verify otp
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next	As Callback argument to the middleware function
    *
    * @return json
    **/
    this.verifyOtp = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let validateString = (req.body.validate_string) ? req.body.validate_string : "";
        let mobileOTP = (req.body.otp) ? parseInt(req.body.otp) : '';
        let otpType = (req.body.otp_type) ? req.body.otp_type : '';

        let finalResponse = {};

        if (!validateString) {
            finalResponse = {
                'data': {
                    'status': STATUS_ERROR,
                    'result': {},
                    'message': res.__("system.missing_parameters")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**get user details */
        RegistrationModel.getUserDetail({ conditions: { 'validate_string': validateString, 'otp_type': otpType } }).then(async userRes => {
            /** Send error response **/
            if (!userRes.result) {
                finalResponse = {
                    'data': {
                        'status': STATUS_ERROR,
                        'result': {},
                        'message': res.__("front.user.user_not_found_please_enter_correct_mobile")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            let resultData = userRes.result;
            let userId = new ObjectId(resultData._id);
            let dataBaseOTP = resultData.mobile_otp || "";
            let OTPExpireTime = resultData.mobile_otp_expire_time || "";
            let email = resultData.email || "";
            let tempUserData = resultData.temp_user_data || "";

            /** Check entered otp is matched or not **/
            if (getUtcDate() > OTPExpireTime) {
                finalResponse = {
                    'data': {
                        'status': STATUS_ERROR,
                        'result': {},
                        'message': res.__("front.user.otp_expired_please_resend_otp")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            /**compare both otp */
            if (mobileOTP != dataBaseOTP) {
                finalResponse = {
                    'data': {
                        'status': STATUS_ERROR,
                        'result': {},
                        'message': res.__("front.user.otp_does_not_match_enter_correct_otp")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            let updateDetails = {
                'is_verified': VERIFIED,
                'is_mobile_verified': VERIFIED,
                'modified': getUtcDate(),
            }

            let updateUnsetData = {
                'mobile_otp': 1,
                'validate_string': 1,
                'mobile_otp_expire_time': 1,
            }

            if (otpType == OTP_TYPE_PROFILE_UPDATE && tempUserData) {
                Object.assign(updateDetails, tempUserData);
                updateUnsetData['temp_user_data'] = 1;
            }

            /** Set update data */
            let updatedData = {
                $set: updateDetails,
                $unset: updateUnsetData
            };

            let options = {
                'conditions': { _id: userId },
                'updateData': updatedData,
            }

            /**query for update one record */
            RegistrationModel.updateUser(req, res, options).then((updateRes) => {
                if (updateRes.status == STATUS_ERROR) {
                    finalResponse = {
                        'data': {
                            'status': STATUS_ERROR,
                            'result': resultData,
                            'token': "",
                            'token_life': "",
                            'message': res.__("front.system.something_going_wrong_please_try_again")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);

                }
                /** Success msg and generate token*/
                jwtTokenGenerate(req, res, { "email": email, "user_id": userId }).then(jwtResponse => {

                    if (tempUserData) {
                        delete resultData.temp_user_data
                    }
                    
                    let profileImage = (resultData.profile_image) ? resultData.profile_image : "";
					
					getUserDetailBySlug(req, res, { conditions: { '_id': new ObjectId(userId) } }).then(userDetailResponse => {
						let finalResponse = {
							'data': {
								status: STATUS_SUCCESS,
								result: (userDetailResponse.result) ? userDetailResponse.result : {},
								'token': (jwtResponse.token) ? jwtResponse.token : "",
								'token_life': (jwtResponse.token_life) ? jwtResponse.token_life : "",
                                "profile_image": profileImage,
                                "image_url": USERS_URL,
								'message': res.__("front.user.otp_verified_successfully")
							}
						};
						return returnApiResult(req, res, finalResponse);
					});
                });
            });
        });
    };


    /**
    * Function for resend otp
    *
    * @param req	As	Request Data
    * @param res	As	Response Data
    * @param next	As	Callback argument to the middleware function
    *
    * @return json
    */
    this.resendOtp = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let validateString = (req.body.validate_string) ? req.body.validate_string : "";
        let otpType = (req.body.otp_type) ? req.body.otp_type : '';

        let finalResponse = {};

        /** Check invalid params */
        if (!validateString || !otpType) {
            finalResponse = {
                'data': {
                    'status': STATUS_ERROR,
                    'message': res.__("system.missing_parameters")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**get user details */
        RegistrationModel.getUserDetail({ conditions: { 'validate_string': validateString, 'otp_type': otpType } }).then(async response => {

            if (response.status != STATUS_SUCCESS || !response.result) {
                /** Return error response */
                finalResponse = {
                    'data': {
                        'status': STATUS_ERROR,
                        'result': {},
                        'message': res.__("front.user.user_not_found_please_enter_correct_mobile")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            let result = (response.result) ? response.result : "";
            let email = (result.email) ? result.email : "";
            let mobileNumber = (result.mobile_number) ? result.mobile_number : "";
			let userType 	= 	(result.user_type) ? result.user_type : "";
          

			let	otpDigit	=	SIX_DIGIT_OTP;
		
			if(userType == CUSTOMER_USER_TYPE){
				otpDigit	=	FOUR_DIGIT_OTP;
			}
			
			
            let otp = await getRandomOTP(otpDigit);
            let otpExpireTime = addHoursToDate(OTP_EXPIRE_TIME, getUtcDate(), "sec");
            let validateString = crypto.createHash("md5").update(currentTimeStamp() + email).digest("hex");


            /** Update otp number **/
            let dataToBeUpdated = { 'modified': getUtcDate() };

            if (otpExpireTime) {
                dataToBeUpdated["mobile_otp"] = otp;
                dataToBeUpdated["mobile_otp_expire_time"] = otpExpireTime;
                dataToBeUpdated['validate_string'] = validateString;
                dataToBeUpdated['otp_type'] = otpType;
            }

            let options = {
                'conditions': { _id: new ObjectId(result._id) },
                'updateData': { $set: dataToBeUpdated },
            }

            /**query for update one record */
            RegistrationModel.updateUser(req, res, options).then((updateRes) => {

                if (updateRes.status == STATUS_ERROR) {
                    finalResponse = {
                        'data': {
                            'status': STATUS_ERROR,
                            'message': res.__("front.system.something_going_wrong_please_try_again")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);

                }

                /**send sms on mobile */
              //  sendSMS(req, res, { "mobile_number": mobileNumber, "type": "1", "params": [otp] });

                /** return success response */
                finalResponse = {
                    'data': {
                        'status': STATUS_SUCCESS,
                        'result': { 'validate_string': validateString, 'mobile_otp': otp, 'otp_type': otpType },
                        'message': res.__("front.user.otp_sent_successfully_on", mobileNumber)
                    }
                };
                return returnApiResult(req, res, finalResponse);
            });
        });
    };//End resendOtp()


    /**
    * Function for login user
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next	As Callback argument to the middleware function
    *
    * @return json
    **/
    this.login = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let mobileNumber 	= 	(req.body.mobile_number) ? req.body.mobile_number : '';
        let mobileCode 		= 	(req.body.mobile_code) ? req.body.mobile_code : "";
        let userType 		= 	(req.body.user_type) ? req.body.user_type : "";
		let	otpDigit		=	SIX_DIGIT_OTP;
		
		if(userType == CUSTOMER_USER_TYPE){
			otpDigit	=	FOUR_DIGIT_OTP;
		}
		
        let finalResponse = {};
        /** Set options data for get user details **/
        let userOptions = {
            conditions: {
                'mobile': mobileNumber,
                'mobile_code': mobileCode,
                'is_deleted': NOT_DELETED,
                'user_type': userType
            },
        };

        /** Get user details **/
        RegistrationModel.getUserDetail(userOptions).then(async userResponse => {

            let resultData = (userResponse.result) ? userResponse.result : "";

            /** Send error/success response **/
            if (!resultData) {
                finalResponse = {
                    'data': {
                        'status': STATUS_ERROR,
                        'result': {},
                        'token': "",
                        'refresh_token': "",
                        'token_life': JWT_CONFIG.tokenLife,
                        'param': "email",
                        'message': res.__("front.user.user_not_found_first_signup")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            };

            /** Send error response if account is not active**/
            if (resultData.status != ACTIVE) {
                /**send error response */
                finalResponse = {
                    'data': {
                        'status': STATUS_ERROR,
                        'result': {},
                        'token': "",
                        'refresh_token': "",
                        'token_life': JWT_CONFIG.tokenLife,
                        'message': res.__("front.user.account_temporarily_disabled")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            let otp = await getRandomOTP(otpDigit);
            let email = (resultData.email) ? resultData.email : "";
            let mobileNumber = (resultData.mobile_number) ? resultData.mobile_number : "";
            let otpExpireTime = addHoursToDate(OTP_EXPIRE_TIME, getUtcDate(), "sec");
            let validateString = crypto.createHash("md5").update(currentTimeStamp() + email).digest("hex");


            /** Update otp number **/
            let dataToBeUpdated = { 'modified': getUtcDate() };

            if (otpExpireTime) {
                dataToBeUpdated["mobile_otp"] = otp;
                dataToBeUpdated["mobile_otp_expire_time"] = otpExpireTime;
                dataToBeUpdated['validate_string'] = validateString;
                dataToBeUpdated['otp_type'] = OTP_TYPE_LOGIN;
            }

            let options = {
                'conditions': { _id: new ObjectId(resultData._id) },
                'updateData': { $set: dataToBeUpdated },
            }

            /**query for update one record */
            RegistrationModel.updateUser(req, res, options).then((updateRes) => {

                if (updateRes.status == STATUS_ERROR) {
                    finalResponse = {
                        'data': {
                            'status': STATUS_ERROR,
                            'message': res.__("front.system.something_going_wrong_please_try_again")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

                /**send sms on mobile */
                sendSMS(req, res, { "mobile_number": mobileNumber, "type": "1", "params": [otp] });

                RegistrationModel.saveLoginLogs(req,res,resultData).then(loginActivityResponse=>{});
				
				/** return success response */
                finalResponse = {
                    'data': {
                        'status': STATUS_SUCCESS,
                        'result': { 'validate_string': validateString, 'mobile_otp': otp, 'otp_type': OTP_TYPE_LOGIN },
                        'message': res.__("front.user.otp_sent_successfully_on", mobileNumber)
                    }
                };
                return returnApiResult(req, res, finalResponse);
            });
        }).catch(() => {
            /**send error response */
            finalResponse = {
                'data': {
                    'status': STATUS_ERROR,
                    'result': {},
                    'token': "",
                    'refresh_token': "",
                    'token_life': JWT_CONFIG.tokenLife,
                    'message': res.__("front.user.mobile_not_registered")
                }
            };
            return returnApiResult(req, res, finalResponse);
        });

    }//End login()


    /**
	 * Function to logout
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next	As Callback argument to the middleware function
	 *
	 * @return json
	 **/
	this.logOut = (req, res, next)=>{
		let finalResponse = {};
		req.body 		= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
		let loginUserData 	=   (req.user_data) ?   req.user_data   :	"";
		let userId 		= 	(loginUserData._id) ?   loginUserData._id   :"";
		let deviceType 	= 	(loginUserData.device_details && loginUserData.device_details[0].device_type) ? 	loginUserData.device_details[0].device_type : null;
		let deviceToken = 	(loginUserData.device_details && loginUserData.device_details[0].device_token) ? 	loginUserData.device_details[0].device_token : null;
		/** Send error response **/
		if (!userId) {
			finalResponse = {
				'data': {
					status: STATUS_ERROR,
					result:{} ,
					message: res.__("system.missing_parameters"),
				}
			};
			return returnApiResult(req, res,finalResponse);
		}
		 
		let options = {
			conditions: { '_id': new ObjectId(userId) },
			updateData: { 
				$pull: {
					device_details: {
						device_type	: deviceType, 
						device_token: deviceToken
					}
				},
				$set: {
					is_user_logged_in	: DEACTIVE,
					modified	:	getUtcDate()
				}
			}
		}

		RegistrationModel.findAndupdateOneUser(req, res, options).then(userResponse => {
		
			if (userResponse.status == STATUS_SUCCESS) {
				
				let finalResponse = {
					'data': {
						status: STATUS_SUCCESS,
						result: {},
						message: res.__("user.you_have_logged_out_successfully"),
					}
				};
				return returnApiResult(req, res, finalResponse);
				
			} 
			else {
				let finalResponse = {
					'data': {
						status: STATUS_ERROR,
						result: '',
						message: res.__('front.system.something_going_wrong_please_try_again'),
					}
				};
				return returnApiResult(req, res, finalResponse)
			}
		});
	};//End logOut()
	
	
	/**
    * Function for edit profile
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next	As Callback argument to the middleware function
    *
    * @return json
    **/
    this.updateUserProfile = (req, res, next) => {
        let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
		let userType = 	(loginUserData.user_type) ? loginUserData.user_type : "";
		let	otpDigit =	SIX_DIGIT_OTP;
		
		if(userType == CUSTOMER_USER_TYPE){
			otpDigit	=	FOUR_DIGIT_OTP;
		}
		
        if (!userId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")

                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let email = (req.body.email) ? req.body.email.toLowerCase() : "";
        let fullName = (req.body.full_name) ? req.body.full_name : "";
        let mobile = (req.body.mobile_number) ? req.body.mobile_number : "";
        let mobileCode = (req.body.mobile_code) ? req.body.mobile_code : "";
        let gender = (req.body.gender) ? parseInt(req.body.gender) : "";
        let profileImage = (req.files && req.files.profile_image) ? req.files.profile_image : "";

        let mobileNumber = mobileCode + mobile;

        /** Set options for upload image **/
        let oldimage = (req.body.old_image) ? req.body.old_image : "";


        asyncParallel({
            already_exist_mobile: (callback) => {
                /**get user details */
                RegistrationModel.getUserDetail({ conditions: { '_id': userId, 'mobile': mobile, 'mobile_code': mobileCode, } }).then(response => {
                    let resultData = (response.result) ? response.result : "";
                    callback(null, resultData);
                });
            },
        }, async (asyncErr, asyncRes) => {
            if (!asyncErr && asyncRes) {

                let userMobile = (asyncRes && asyncRes.already_exist_mobile) ? asyncRes.already_exist_mobile : "";

                let otpExpireTime = addHoursToDate(OTP_EXPIRE_TIME, getUtcDate(), "sec");
                let validateString = crypto.createHash("md5").update(currentTimeStamp() + email).digest("hex");

                let mobileOtpCode = await getRandomOTP(otpDigit);

                let imageOptions = {
                    'image': profileImage,
                    'filePath': USERS_FILE_PATH,
                    'oldPath': oldimage
                };

                /** Upload user  image **/
                moveUploadedFile(req, res, imageOptions).then(response => {
                    if (response.status == STATUS_ERROR) {
                        /** Send error response **/
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR_INVALID_ACCESS,
                                result: {},
                                message: response.message,
                            }
                        };
                        return returnApiResult(req, res, finalResponse);

                    }

                    let imageName = (response.fileName) ? response.fileName : "";

                    let updateTempData = {
                        'display_name': fullName,
                        'full_name': fullName,
                        'email': email,
                        'mobile_code': mobileCode,
                        'mobile_number': mobileNumber,
                        'mobile': mobile,
                        'gender': gender,
                        'profile_image': imageName,
                        'otp_type': OTP_TYPE_PROFILE_UPDATE,
                    };

                    let updateUserData = {
                        'otp_type': OTP_TYPE_PROFILE_UPDATE,
                        'modified': getUtcDate()
                    };

                    if (!userMobile) {
                        updateUserData['mobile_otp'] = mobileOtpCode;
                        updateUserData['mobile_otp_expire_time'] = otpExpireTime;
                        updateUserData['is_mobile_verified'] = NOT_VERIFIED;
                        updateUserData['validate_string'] = validateString;
                        updateUserData['is_verified'] = NOT_VERIFIED;
                        updateUserData['temp_user_data'] = updateTempData;

                    } else {
                        updateUserData = updateTempData;
                    }

                    let options = {
                        conditions: { '_id': new ObjectId(userId), 'user_type': CUSTOMER_USER_TYPE },
                        updateData: { $set: updateUserData }
                    }

                    RegistrationModel.updateUser(req, res, options).then(userResponse => {
                        if (userResponse.status == STATUS_SUCCESS) {
                            if (userMobile) {
                                /**get user details */
                                getUserDetailBySlug(req, res, { conditions: { '_id': new ObjectId(userId) } }).then(userDetailResponse => {
                                    let finalResponse = {
                                        'data': {
                                            status: STATUS_SUCCESS,
                                            result: (userDetailResponse.result) ? userDetailResponse.result : {},
                                            message: res.__('front.user.user_details_updated_successfully'),
                                        }
                                    };
                                    return returnApiResult(req, res, finalResponse);
                                });
                            } else {

                                let finalResponse = {
                                    'data': {
                                        status: STATUS_SUCCESS,
                                        result: {
                                            'validate_string': validateString,
                                            'mobile_otp': mobileOtpCode,
                                            'otp_type': OTP_TYPE_PROFILE_UPDATE
                                        },
                                        message: res.__('front.user.verify_your_account'),
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);
                            }
                        } else {
                            let finalResponse = {
                                'data': {
                                    status: STATUS_ERROR,
                                    result: '',
                                    message: res.__('front.system.something_going_wrong_please_try_again'),
                                }
                            };
                            return returnApiResult(req, res, finalResponse)
                        }
                    });
                });
            }
        });
    }


	  
	/**
    * Function for update User Language
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next	As Callback argument to the middleware function
    *
    * @return json
    **/
    this.updateUserLanguage = (req, res, next) => {
        let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let loginUserData 	= (req.user_data) ? req.user_data : "";
        let userId 			= (loginUserData._id) ? loginUserData._id : "";
		let language 		= (req.body.language) ? req.body.language : "";
		
        if (!userId || !language) {
            let finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
		
		
		if((language != DEFAULT_LANGUAGE_CODE) && ((language != HINDI_LANGUAGE_CODE))) {
            let finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.something_going_wrong_please_try_again")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let updateData = {
            'language': language,
            'modified': getUtcDate()
        };

        let options = {
            conditions: { '_id': new ObjectId(userId) },
            updateData: { $set: updateData }
        }

        RegistrationModel.findAndupdateOneUser(req, res, options).then(userResponse => {
            if (userResponse.status == STATUS_SUCCESS) {
                /**get user details */
                getUserDetailBySlug(req, res, { conditions: { '_id': new ObjectId(userId) } }).then(userDetailResponse => {
                    let finalResponse = {
                        'data': {
                            status: STATUS_SUCCESS,
                            result: (userDetailResponse.result) ? userDetailResponse.result : {},
                            message: res.__('front.user.user_language_updated_successfully'),
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                })
            } else {
                let finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: '',
                        message: res.__('front.system.something_going_wrong_please_try_again'),
                    }
                };
                return returnApiResult(req, res, finalResponse)
            }
        });
    }

	
	/**
    * Function for get Provider profile
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next	As Callback argument to the middleware function
    *
    * @return json
    **/
	this.getProviderprofile = (req, res, next) => {
		let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
		let userType = 	(loginUserData.user_type) ? loginUserData.user_type : "";
		const today = new Date();
		
		if (!userId || (userType != SERVICE_PROVIDER_USER_TYPE)){
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")

                }
            };
            return returnApiResult(req, res, finalResponse);
        }		 
		
		let projectFields = {
            _id: 1,
            full_name: 1,
            email: 1,
            gender: 1,
            mobile_number: 1,
            status: 1,
            is_email_verified: 1,
            is_mobile_verified: 1,
            created: 1,
            is_verified: 1,
            zip: 1,
            profile_image: 1,
            rating : 1,
			rating_count :1,
			provider_type: 1,
			area_name: { $arrayElemAt: ["$areaDetail.title", 0] },
			language_name: { $arrayElemAt: ["$langDetail.title", 0] },
			franchise_name: { $arrayElemAt: ["$franchise_info.franchise_name", 0] },
			franchise_start_date: { $arrayElemAt: ["$franchise_info.start_date", 0] },
			franchise_end_date: { $arrayElemAt: ["$franchise_info.end_date", 0] },
			franchise_status: { $arrayElemAt: ["$franchise_info.status", 0] },
        }
		 
        let aggregateCondition = [
            {
                $match: { _id: userId, is_deleted : NOT_DELETED}
            },
			{
                $lookup: {
                    from: TABLE_LANGUAGES,
                    let: { language: "$language" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$lang_code", "$$language"] }]
                                }
                            }
                        }
                    ],
                    as: "langDetail"
                }
            },
            {
				$lookup: {
					from: TABLE_AREAS,
					let: { areaId: "$area_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ["$_id", "$$areaId"] }]
								}
							}
						}
					],
					as: "areaDetail"
				}
			},
			{
				$lookup: {
					from: TABLE_FRANCHISE_CONTRACTS,
					let: { user_id: "$_id" }, // Passing user_id from the main collection
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{$in: ["$$user_id", "$service_provider_in_area"]}, // Check if user_id exists in service_provider_in_area
										{$in: ["$status", [CONTRACT_STATUS_ACTIVE, CONTRACT_STATUS_INACTIVE]] },
										{$gte: [today, "$start_date"]},
										{$lte: [today, "$end_date"]},
									]
								}
							}
						},
						{
							$lookup: {
								from: TABLE_USERS,
								localField: "franchise_id", // Using franchise_id from TABLE_FRANCHISE_CONTRACTS
								foreignField: "_id", // Matching with _id in TABLE_USERS
								as: "franchise_details"
							}
						},
						{
							$unwind: {
								path: "$franchise_details",
								preserveNullAndEmptyArrays: true // Keep even if no match is found
							}
						},                        
						{
							$project: {
								_id: 0,
								franchise_id: 1,
								start_date: 1,
								end_date: 1,
								status: 1,
								franchise_id: 1,
								franchise_name: "$franchise_details.display_name" // Extract display_name
							}
						}
					],
					as: "franchise_info" // Output array field in main collection
				}
			},
            {
                $project: projectFields
            }
        ]
		
		let optionObj = {
            conditions: aggregateCondition
        }

        RegistrationModel.getUserViewDetails(req, res, optionObj).then(response => {
            let result = (response.result) ? response.result : {};
            let status = (response.status) ? response.status : "";
			
            if (status == STATUS_SUCCESS) {
                
                /** Set options for append image full path **/
                let options = {
                    "file_url": USERS_URL,
                    "file_path": USERS_FILE_PATH,
                    "result": [result],
                    "database_field": "profile_image"
                };

                /** Append image with full path **/
                appendFileExistData(options).then(async fileResponse => {
 
				// Get the count of assigned orders (both store and service) for a specific service provider
                let assignOrderResult = await OrderModel.getOrderCount({
                    conditions: {
                        service_provider_id: new ObjectId(userId), // Filter by service provider ID
                        $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }], // Either store or service booking
                        status: { $ne: BOOKING_STATUS_CANCELLED } // Exclude cancelled orders
                    }
                });

                let assignOrderCount = (assignOrderResult.result) ? assignOrderResult.result : 0; // Default to 0 if no result
    
				let finalResponse = {
					data: {
						status: STATUS_SUCCESS,
						result: (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {},
						assign_order_count: assignOrderCount,
						message: ''
					}
				};
				return returnApiResult(req, res, finalResponse);
					
					 
                });
            } 
			else {
                
				let finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.global.no_record_found")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
	}


   

    /**
    * Function for get Customer Profile
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next	As Callback argument to the middleware function
    *
    * @return json
    **/
	this.getCustomerProfile = (req, res, next) => {
		let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
		let userType = 	(loginUserData.user_type) ? loginUserData.user_type : "";
		const today = new Date();
		
		if (!userId || (userType != CUSTOMER_USER_TYPE)){
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")

                }
            };
            return returnApiResult(req, res, finalResponse);
        }		 
	 
        getUserDetailBySlug(req, res, { conditions: { '_id': new ObjectId(userId) } }).then(response => {

            let result = (response.result) ? response.result : {};
            let status = (response.status) ? response.status : "";
			
            if (status == STATUS_SUCCESS) {
                
                /** Set options for append image full path **/
                let options = {
                    "file_url": USERS_URL,
                    "file_path": USERS_FILE_PATH,
                    "result": [result],
                    "database_field": "profile_image"
                };

                /** Append image with full path **/
                appendFileExistData(options).then(async fileResponse => {

				let finalResponse = {
					data: {
						status: STATUS_SUCCESS,
						result: (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {},
				 
						message: ''
					}
				};
				return returnApiResult(req, res, finalResponse);
					
					 
                });
            } 
			else {
                
				let finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.global.no_record_found")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
	}

    
}
module.exports = new Registration();