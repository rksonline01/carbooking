/**
 *   Function for Submit form on Enter (Pass Submit Button class in Form data-form-submit-class attribute)
 */
$(document).on('keypress','.on_click_submit',function(e){
	var key = e.which;
	if (key == 13) {
		var className = e.target.className;
		if(className.indexOf('notSubmitOnEnter') < 0){
			if(e.shiftKey == 0 || (e.shiftKey == 1 && $(e.target)[0].type!="textarea")){
				var submitId = $(this).attr('data-submit-btn-id');
				$('#'+submitId).trigger('click');
				return false;
			}
		}
	}
});

/**
 *  For chosen resize function
 *
 **/
$(window).on('resize', resizeChosen);

function resizeChosen() {
   $(".chosen-container").each(function() {
       $(this).attr('style', 'width: 100%');
   });
}

/**
 * Function to change language tabs for multi language form
 *
 * @param selectedLangCode As current selected language
 *
 * @return null
 */
function changeTab(selectedLangCode){
	$('.multilanguage_tab').removeClass('current').addClass('done');
	$('.multilanguage_tab_'+selectedLangCode).removeClass('done').addClass('current');
	$('.multi-lang-tab-pane').removeClass('active');
	$('#multi_lang_'+selectedLangCode).addClass('active');
}//end changeTab()

/**
 *	Function for custom ajax submit
 *
 * 	@param var formId 	As form id for submitting form
 * 	@param var callback As Callback Function
 *
 *	@return null
 */
function ajax_submit(formId,callback){
	var options = {
		success:function(response){
			if(response.status == 'success'){
				callback(true,response);
			}else{
				display_errors(response.message,formId);
				callback(false,response);
			}
		},
		resetForm:false
	};
	/*var options = {
		success:    function(response) {
			if(response.status == 'success'){
				alert('Thanks for your comment!');
			}else{

				display_errors(response.message,formId);
				callback(false,response);
			}

		},
		resetForm:false
	}; */
	$("form#"+formId).ajaxSubmit(options);
}//end ajax_submit()

/**
 *	Function for custom ajax submit for multipart form data with multilevel array
 *
 * 	@param var formId as form id for submitting form
 * 	@param var callback for callback function
 *
 *	@return null
 */
function submit_multipart_form(formId,callback){
	/** take all form input values in Object format */
	var formData	= $('#'+formId).serializeObject();

	/** FormData is used to submit multipart/form-data */
	var fd 			= new FormData();
	if(formData != undefined){
		$.each(formData,function(key,value){
			/** Append all input values into FormData object */
			if(typeof value == 'object'){
				fd.append(key, JSON.stringify(value));
				//fd.append(key, value);
			}else{
				fd.append(key, value);
			}
		});
	}

	/** Form data is used to submit multipart/form-data */
	var fileData	= $('input[type="file"]');
	if(fileData != undefined){
		$.each(fileData,function(key,value){
			if(value.files[0]!= undefined){
				var name = (value.name) ? value.name : '';
				if(value.multiple != undefined && value.multiple != false){
					var filesValue = (value.files) ? value.files : '';
					$.each(filesValue,function(keyFile,valueFile){
						fd.append(name+"["+keyFile+"]", valueFile);
					});
				}else{
					var filesValue = (value.files[0]) ? value.files[0] : '';
					fd.append(name, filesValue);
				}

				/** Append all file input values into FormData object */
			}
		});
	}
	var currentUrl = (window.location && window.location.href) ? window.location.href : '';
	var options = {
		url: currentUrl,
		type: "POST",
		data : fd,
		processData : false,
		contentType : false,
		success:function(response){
			if(response.status == 'success'){
				callback(true,response);
			}else{
				display_errors(response.message,formId);
				callback(false,response);
			}
		}
	};
	$.ajax(options);
}//end submit_multipart_form()

/**
 *	Function for display validation errors
 *
 * 	@param var errors As Array or errors
 * 	@param var formId As Form id for display errors
 *
 *	@return null
 */
function display_errors(errors,formId){
	$firstError = '';
	$('#'+formId+' span.error').html('');
	$('#'+formId).find('.form-line').removeClass('error');
	if(typeof errors == "object"){
		try{
			$.each(errors,function(index,html){

				if(html.path == 'invalid-access'){
					if($firstError == ''){
						$firstError = 'user-defined-notice';
					}
					notice('error',html.msg);
				}else{
					var errorId = html.path;

					if($firstError == ''){
						$firstError = errorId;
					}

					$('#'+formId+' #'+errorId+'_error').prev('.form-line').addClass('error');

					var fields = errorId.split('.');
					var languageId = (fields[1]) ? fields[1] : "";
					if(typeof languageId !== "undefined" && languageId != ""){

						if(languageId == DEFAULT_LANGUAGE_CODE){
							var fieldname 		= (fields[0]) ? fields[0] : "";
							var fieldNameLast 	= (fields[2]) ? fields[2] : "";

							var newErrorId = fieldname+"_"+languageId+"_"+fieldNameLast;
							
							$('#'+newErrorId+'_error').html(html.msg).show();
						}else if(languageId == DEFAULT_LANGUAGE_MONGO_ID){
							var fieldname 		= (fields[0]) ? fields[0] : "";
							var fieldNameLast 	= (fields[2]) ? fields[2] : "";

							var newErrorId = fieldname+"_"+languageId+"_"+fieldNameLast;
							$('#'+newErrorId+'_error').html(html.msg).show();
						}
					}

					

					$('#'+formId+' #'+errorId+'_error').html(html.msg).show();
				}
			});
		} catch (e){


			var errorMsg = "Something went wrong, Please try again.";
			/*if(errors && errors.length > 0){
				var allError = (errors) ? errors[0] : {};
				errorMsg = (allError.msg) ? allError.msg : "";
			}*/
			notice('error',errorMsg);
			$firstError = 'user-defined-notice';
		}
	}else{
		notice('error',errors);
		$firstError = 'user-defined-notice';
	}
	if($firstError != ''){
		var scrollTopId = '#'+$firstError;
		if($firstError != 'user-defined-notice'){
			if($('#'+$firstError+'_error').length > 0){
				$('#'+$firstError+'_error').focus();
			}
			scrollTopId = '#'+formId+' #'+$firstError+'_error';
		}
		if($(scrollTopId).length > 0){
			$("html,body").animate({scrollTop: $(scrollTopId).offset().top - 150}, "slow");
		}
	}
}//end display_errors()

/**
 * Function For For notification messages
 *
 *	@param title 	as Title
 *  @param message 	as Notification Message
 *  @param type 	as Type ('success'/'error'/'info')
 *
 *  @return null
 */
function notice(type,message,timeout){
	timeout = (timeout) ? timeout : 10000;
	$class 	= '';
	switch(type){
		case 'error':
			$class = 'bg-pink';
		break;
		case 'success':
			$class = 'bg-green';
		break
	}
	$html = '<div class="alert '+$class+' alert-dismissible" role="alert">\
				<button type="button" class="close" data-bs-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>\
				'+message+'\
			</div>';
	if(type=="error"){
		$('#user-defined-error-notice').html($html).show();
		if($('#user-defined-error-notice').length > 0){
			$("html,body").animate({scrollTop: $('#user-defined-error-notice').offset().top - 150}, "slow");
		}
		if(timeout != 0){
			setTimeout(function(){
				$('#user-defined-error-notice').fadeOut(500,function(){
					$('#user-defined-error-notice').html('');
				});
			},timeout);
		}
	}
	if(type=="success"){
		$('#user-defined-notice').html($html).show();
		if($('#user-defined-notice').length > 0){
			$("html,body").animate({scrollTop: $('#user-defined-notice').offset().top - 150}, "slow");
		}
		if(timeout != 0){
			setTimeout(function(){
				$('#user-defined-notice').fadeOut(500,function(){
					$('#user-defined-notice').html('');
				});
			},timeout);
		}
	}
}// end notice()

/**
 * Function to show confirm box
 *
 * @param type		As Type of mesage
 * @param title		As Title of comfirm Box
 * @param message	As Confirmation message
 * @param callback  As Callback function
 *
 * @return null
 */
/**
 * Function to show confirm box
 *
 * @param type		As Type of mesage
 * @param title		As Title of comfirm Box
 * @param message	As Confirmation message
 * @param callback  As Callback function
 *
 * @return null
 */
 var timer;
 function confirmBox(type,title,message,callback){
	 clearTimeout(timer);
	 swal({
		 title: title,
		 text: message,
		 type: type,
		 showCancelButton: true,
		 confirmButtonColor: "#242424",
		 confirmButtonText: "Ok",
		 closeOnConfirm: false,
		 showLoaderOnConfirm: true,
	 }, function (res) {
		 callback(res);
	 });
 }//end confirmBox()

/**
 * Function to show success message
 *
 * @param type		As Type of mesage
 * @param title 	As Title of comfirm Box
 * @param message	As Confirmation message
 *
 * @return null
 */
function popup_success(type,title,message){
	swal(title, message, type);
	timer = setTimeout(function(){
		swal.close();
	},3000);
}//end popup_success()

/**
 * Function to show html popup message
 *
 * @param type		As Type of mesage
 * @param title 	As Title of comfirm Box
 * @param message	As Confirmation message
 *
 * @return null
 */
function html_popup_success(type,title,message,timerCount){

	swal({
		title: title,
		text: message,
		type : type,
		html: true
	});
	timer = setTimeout(function(){
		swal.close();
	},timerCount);
}//end html_popup_success()

/**
 * This funciton in used replace submit button with loading button
 *
 * @params buttonId = Button Id
 *
 * @return null
 **/
function startTextLoading(buttonId) {
    var button = $('#' + buttonId);

    // Add a spinner if it doesn't already exist
    if (button.find('.spinner-border').length === 0) {
        button.prepend('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>');
    }
	
	$("#overlay1").show();
	
    button.prop('disabled', true); // Disable the button
    button.find('.spinner-border').removeClass('d-none'); // Show the spinner (if it exists)
    button.contents().filter(function() {
        return this.nodeType === 3; // Text node
    }).wrap('<span class="button-text d-none"></span>'); // Hide the button text if not already wrapped
}
/**
 * This funciton in used replace loading button with submit button
 *
 * @params buttonId = Button Id
 *
 * @return null
 **/
function stopTextLoading(buttonId) {
    var button = $('#' + buttonId);
	$("#overlay1").hide();
    button.prop('disabled', false); // Enable the button
    button.find('.spinner-border').remove(); // Remove the spinner
    button.find('.button-text').contents().unwrap(); // Unwrap and show the button text
}

/**
 * This funciton in used replace submit button with loading button
 *
 * @params buttonId = Button Id
 *
 * @return null
 **/
function startTextLoadingInPopUP(buttonId) {
    var button = $('#' + buttonId);

    // Add a spinner if it doesn't already exist
    if (button.find('.spinner-border').length === 0) {
        button.prepend('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>');
    }
	
	
    button.prop('disabled', true); // Disable the button
    button.find('.spinner-border').removeClass('d-none'); // Show the spinner (if it exists)
    button.contents().filter(function() {
        return this.nodeType === 3; // Text node
    }).wrap('<span class="button-text d-none"></span>'); // Hide the button text if not already wrapped
}
/**
 * This funciton in used replace loading button with submit button
 *
 * @params buttonId = Button Id
 *
 * @return null
 **/
function stopTextLoadingInPopUP(buttonId) {
    var button = $('#' + buttonId);
    button.prop('disabled', false); // Enable the button
    button.find('.spinner-border').remove(); // Remove the spinner
    button.find('.button-text').contents().unwrap(); // Unwrap and show the button text
}

/**
 * This funciton in use to update all ckeditor's value in it's textarea element
 *
 * @params void
 *
 * @return null
 **/
function updateCkeditorValue(){
	for (instance in CKEDITOR.instances) {
		CKEDITOR.instances[instance].updateElement();
	}
}//end updateCkeditorValue()

/**
 * This funciton in used to set date time format using moment js
 *
 * @params void
 *
 * @return null
 **/
function setDateTimeformat(){
	$('.setDateTimeFormat').each(function(){
		var dateTime 		= ($(this).attr('data-timestamp')) ? parseInt($(this).attr('data-timestamp')) : $(this).attr('data-date-time');
		var dateTimeFormat 	= ($(this).attr('data-time-format')) ? $(this).attr('data-time-format') : DATATABLE_DATE_TIME_FORMAT;
		var newTime 		= moment(dateTime).tz(DEFAULT_TIME_ZONE).format(dateTimeFormat);
		$(this).text(newTime);
	});
}//end setDateTimeformat()
setDateTimeformat();


/**
 * This funciton in used to set date time format using moment js
 *
 * @params void
 *
 * @return null
 **/
function setDateformat(){
	$('.setDateFormat').each(function(){
		var dateTime 		= ($(this).attr('data-timestamp')) ? parseInt($(this).attr('data-timestamp')) : $(this).attr('data-date-time');
		var dateTimeFormat 	= ($(this).attr('data-time-format')) ? $(this).attr('data-time-format') : DATATABLE_DATE_FORMAT;
		var newTime 		= moment(dateTime).tz(DEFAULT_TIME_ZONE).format(dateTimeFormat);
		$(this).text(newTime);
	});
}//end setDateformat()
setDateformat();

/**
 * This funciton in used to replace \n tag with br tag
 *
 * @params void
 *
 * @return null
 **/
function nl2br(html){
	if(html){
		return html.replace(/\n/g, "<br />");
	}else{
		return html;
	}
}//end nl2br()
nl2br();

/**
 *  Function for Confirmation message
 */
 $(document).on('click', '.confirm_box', function(e){
	e.stopImmediatePropagation();
	url 				= $(this).attr('data-href');
	confirmMessage 		= $(this).attr('data-confirm-message');
	confirmHeading 		= $(this).attr('data-confirm-heading');
	confirmBox("warning",confirmHeading,confirmMessage,function(result){
		if(result) window.location.replace(url);
	});
	e.preventDefault();
});
/**
 *  Read more text
 **/
function readMore(){
	// Configure/customize these variables.
	var defaultChar 	= 100;  // default characters value
	var ellipsestext 	= "...";
	var moretext 		= "Read more »";
	var lesstext 		= "Read less »";

	$('.readmore').each(function() {
		if(!($(this).hasClass("readmore_imported"))){
			showChar = ($(this).attr('data-content-length')) ? $(this).attr('data-content-length') : defaultChar;
			var content = $(this).html();
			if(content.length > showChar) {
				var c = content.substr(0, showChar);
				var h = content.substr(showChar, content.length - showChar);
				var html = c + '<span class="moreellipses">' + ellipsestext+ '&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a href="" class="morelink">' + moretext + '</a></span>';
				$(this).addClass('readmore_imported');
				$(this).html(html);
			}
		}
	});

	$(".morecontent span").hide();
}// end readMore()

/**
 *  Call read more function
 *
 **/
readMore();

/**
 * Show and hide text
 **/
$(document).on('click',".morelink",function(){
	var moretext 		= "Read more »";
	var lesstext 		= "Read less »";
	if($(this).hasClass("less")) {
		$(this).removeClass("less");
		$(this).html(moretext);
	} else {
		$(this).addClass("less");
		$(this).html(lesstext);
	}
	$(this).parent().prev().toggle();
	$(this).prev().toggle();
	return false;
});

/**
 *   Function for socket requests to users
 */
/*
if(typeof io !== typeof undefined){
	var client = io.connect(WEBSITE_SOCKET_URL, {'transports': ['websocket']});
	client.on('connect',function (data) {
		client.emit('login', {id: encryptionKey});
	});
}
 */

/* If user logged in */
if(typeof encryptionKey !== typeof undefined){
	/**Get Notification Counter*/
	function getHeaderNotificationCounter(){
		$.ajax({
			url : WEBSITE_ADMIN_URL+'notifications/get_header_notifications_counter',
			type: "POST",
			success:function(response){
				/**Notification conter*/
				var notificationCounter = (response.counter) ? response.counter : 0;
				if(notificationCounter){
					if(notificationCounter > 1000){
						notificationCounter = "1000+";
					}
					$("#notificationCounter").text(notificationCounter);
					$("#notificationCounter").removeClass("hide");
				}else{
					$("#notificationCounter").text("");
					$("#notificationCounter").addClass("hide");
				}
			}
		});
	};//End getHeaderNotificationCounter()

	/** Function to get header notification*/
	var isNotificationsLoaded = false;
	function getHeaderNotificaions(){
		if(!isNotificationsLoaded){
			isNotificationsLoaded = true;
			// put loader
			$("#notificationList").html('<li class="text-center"><a href="javascript:void(0);" class="waves-effect waves-block not_anchor"><div class="menu-info"><img src="'+WEBSITE_ADMIN_IMG_URL+'pagination_loader.gif"/> </div></a></li>');
			$("#viewAllNofication").hide();
			$.ajax({
				url : WEBSITE_ADMIN_URL+'notifications/get_header_notifications',
				type: "POST",
				success:function(response){
					if(response){
						$("#notificationList").html("");
						if(typeof response.result !== typeof undefined && response.result && response.result.length > 0){
							var notificationList = (response.result) ? response.result : [];
							notificationList.map(function(notification){
								var iconBgClass 	= (NOTIFICATION_MESSAGES[notification.notification_type] && NOTIFICATION_MESSAGES[notification.notification_type].icon_class) 	? NOTIFICATION_MESSAGES[notification.notification_type].icon_class	: "bg-blue";
								var icon 			= (NOTIFICATION_MESSAGES[notification.notification_type] && NOTIFICATION_MESSAGES[notification.notification_type].icon) 		? NOTIFICATION_MESSAGES[notification.notification_type].icon 		: "notifications";
								var notificaionUrl 	= (notification.url && notification.url != "javascript:void(0);") 	? notification.url 	   		: "javascript:void(0);";
								var unseenClass 	= (notification.is_seen != SEEN) ? "unseen_notification":"";
								var notificaionTime = (notification.created)	? notification.created 		:"";
								var notificaionMsg 	= (notification.message) 	? notification.message 		:"";

								if(notificaionMsg.length > 30){
									notificaionMsg 	= notificaionMsg.substr(0, 30)+'...';
								}

								//Append html
								var notifictioanLi = '<li>'+
									'<a href="'+notificaionUrl+'" class="waves-effect waves-block '+unseenClass+'">'+
										'<div class="icon-circle '+iconBgClass+'">'+
											'<i class="material-icons">'+icon+'</i>'+
										'</div>'+
										'<div class="menu-info">'+
											'<h4 class="font-weight-normal">'+notificaionMsg+'</h4>'+
											'<p><i class="material-icons">access_time</i>'+
												' <span class="setDateTimeFormat" data-date-time="'+notificaionTime+'"></span>'+
											'</p>'+
										'</div>'+
									'</a>'+
								'</li>';
								$("#notificationList").append(notifictioanLi);
								$("#viewAllNofication").show();
							});
							setDateTimeformat(); //to show dates
						}else{
							/**No record found */
							var notifictioanLi = '<li class="text-center">'+
								'<a href="javascript:void(0);" class="waves-effect waves-block not_anchor">'+
									'<div class="menu-info">'+
										'<h4 class="no_record_text">You do not have any notification.</h4>'+
									'</div>'+
								'</a>'+
							'</li>';
							$("#notificationList").append(notifictioanLi);
						}
						$("#notificationCounter").text("");
						$("#notificationCounter").addClass("hide");
					}
				}
			});
		}else{
			$("#notificationCounter").text("");
			$("#notificationCounter").addClass("hide");
			return false;
		}
	};//End getHeaderNotificaions()

	$( document ).ready(function() {
		getHeaderNotificationCounter();//get notification counter
	});

	/**
	 * Function to get new notificaion and update counter
	 */
	// client.on("notification_received",function(data){
	// 	isNotificationsLoaded = false;
	// 	getHeaderNotificationCounter();//get counter
	// });

	/**
	 *  Function to round number
	 */
	function customRound(value, precision){
		try{
			if(!value || isNaN(value)){
				return value;
			}else{
				precision 		= 	(typeof precision != typeof undefined && precision) ? precision :ROUND_PRECISION;
				var multiplier 	= 	Math.pow(10, precision || 0);
				return Math.round(value * multiplier) / multiplier;
			}
		}catch(e){
			return value;
		}
	}//end customRound();

	/**
	 *  Function to convert currency format
	 *
	 * @param amount as currency value
	 *
	 * @return amount after convert currency format
	 */
	function currencyFormat(amount) {
		if(!amount || isNaN(amount)){
			return CURRENCY_SYMBOL+" "+amount;
		}else{

			amount	=	customRound(amount,ROUND_PRECISION);
			amount 	=	amount.toString();
			var afterPoint = '';

			if(amount.indexOf('.') > 0) afterPoint = amount.substring(amount.indexOf('.'),amount.length);
			amount = Math.floor(amount);
			amount = amount.toString();
			var lastThree = amount.substring(amount.length-3);
			var otherNumbers = amount.substring(0,amount.length-3);
			if(otherNumbers != '') lastThree = ',' + lastThree;
			return  CURRENCY_SYMBOL+" "+otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
		}
	}// end currencyFormat()

	/**
	 *  Function to convert numeric value in number format (like 3000 => 3,0000)
	 *
	 * @param value as a numeric value
	 *
	 * @return numeric value after convert format
	 */
	function numberFormat(value){
		if(!value || isNaN(value)){
			return value;
		}else{
			value	=	round(value,ROUND_PRECISION);
			value 	=	value.toString();
			var afterPoint = '';

			if(value.indexOf('.') > 0) afterPoint = value.substring(value.indexOf('.'),value.length);
			value = Math.floor(value);
			value =	value.toString();
			var lastThree = value.substring(value.length-3);
			var otherNumbers = value.substring(0,value.length-3);
			if(otherNumbers != '') lastThree = ',' + lastThree;
			return  otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
		}
	}// end numberFormat()
}


	/**
	* This funciton in used to generate a link for user id according to roles
	*
	* @params userName as User Name
	* @params userId as User Id
	* @params userRoleId as User Role
	*
	* @return html
	**/
	function generateUserLink(userName,userId,userRoleId,userType){
		var html = "";
		if((userName!="" && userId != "" && userRoleId!="" && userType) && (userRoleId == RIDER_USER_ROLE_ID || userRoleId == RIDER_USER_ROLE_ID)){
			html = '<a href="'+WEBSITE_ADMIN_URL+"users/"+userType+"/view/"+userId+'" target="_blank">'+userName+'</a>'
		}else{
			if(userName != ""){
				html = userName;
			}else{
				html = "N/A";
			}
		}
		return html;
	}//end generateUserLink()


/** ##########  Function for IntlTel Input  ########################*/
function phoneNumValidate(phone_field,error_box_id,valid_msg_id){

    var telInput;
    telInput = $("#"+phone_field),
    errorMsg = $("#"+error_box_id),
    validfield = $("#"+valid_msg_id);
    var isvalid_number = 0;

    // initialise plugin
    telInput.intlTelInput({
        utilsScript: WEBSITE_ADMIN_JS_PATH+"intl-tel-input/utils.js",
        formatOnDisplay : false
    });
    var reset = function() {
        telInput.removeClass("error");
        // errorMsg.addClass("hide");
        if(validfield.length) validfield.val("");
    };

    // on blur: validate
    telInput.blur(function() {

        //reset();
        if ($.trim(telInput.val())) {

            var tesval = telInput.intlTelInput("isValidNumber");


            if(tesval == false){

				var intlNumber = $(telInput).intlTelInput("getNumber");
				var countryData = $(telInput).intlTelInput("getSelectedCountryData");
				alert(intlNumber);
				var countryCode = countryData.dialCode; // using updated doc, code has been replaced with dialCode
				countryCode = "+" + countryCode; // convert 1 to +1
				var newNo = intlNumber.replace(countryCode, "" + countryCode+ "" );

                $(".not_valid_mobile").html('Please enter valid mobile number.');
                $(telInput).val(newNo);
                validfield.val("");

                return false;
            }else if(tesval == true){

				var countryData = telInput.intlTelInput("getSelectedCountryData");
				var countryCode = countryData.dialCode;
				countryCode = "+" + countryCode; // convert 1 to +1

				if(countryCode != '')
				{
				$('.dilecode').val(countryCode);
				}
                var numberType = telInput.intlTelInput("getNumberType");
                if((numberType == intlTelInputUtils.numberType.MOBILE)  || (numberType == intlTelInputUtils.numberType.FIXED_LINE_OR_MOBILE)){
                    isvalid_number = 1;
                }
                if (isvalid_number==0) {
                    // is a mobile number
                    $(".not_valid_mobile").html('Please enter valid mobile number.');
                    validfield.val("");
                    return false;
                }
                telInput.val( telInput.intlTelInput("getNumber"));
                if(validfield.length)
                    validfield.val(telInput.intlTelInput("getNumber"));
                $(".not_valid_mobile").html('');
                return true;

            }
        }
    }).trigger('blur');


    // on keyup / change flag: reset
    telInput.on("keyup change", reset);

}

/**
 * Function for make string to title case
 *
 * @param str AS String
 *
 * @return string
 */
toTitleCase = (str)=>{
	return str.replace(/\w\S*/g,(txt)=>{return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}//end toTitleCase();




/**
 * Allow only numbers to be typed in a textbox [duplicate]
 * **/
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}



/** Function for use to return the number of minutes in hours and minutes*/
function timeConvert(n) {
	var num = n;
	var hours = (num / 60);
	var rhours = Math.floor(hours);
	var minutes = (hours - rhours) * 60;
	var rminutes = Math.round(minutes);
	return num + " Minutes = " + rhours + " Hour and " + rminutes + " Minute.";
}



/**
 * Function to get date in any format with utc format
 *
 * @param date 		as	Date object
 * @param format 	as 	Date format
 *
 *
 *
 * @return date string
 */
function getTimeAgo(dateString) {
	var rightNow = new Date();
	var then = new Date(dateString);

	var diff = rightNow - then;

	var second = 1000,
		minute = second * 60,
		hour = minute * 60,
		day = hour * 24,
		week = day * 7;

	if (isNaN(diff) || diff < 0) {
		return ""; // return blank string if unknown
	}

	if (diff < second * 2) {
		// within 2 seconds
		return "right now";
	}

	if (diff < minute) {
		return Math.floor(diff / second) + " seconds ago";
	}

	if (diff < minute * 2) {
		return "1 minute ago";
	}

	if (diff < hour) {
		return Math.floor(diff / minute) + " minutes ago";
	}

	if (diff < hour * 2) {
		return "1 hour ago";
	}

	if (diff < day) { return Math.floor(diff / hour) + " hours ago"; } if (diff > day && diff < day * 2) {
		return "yesterday";
	}

	if (diff < day * 365) {
		return Math.floor(diff / day) + " days ago";
	}

	else {
		return "over a year ago";
	}
}



/**
 *	Function for custom ajax submit
 *
 * 	@param var formId 	As form id for submitting form
 * 	@param var callback As Callback Function
 *
 *	@return null
 */
function ajax_submit_new(formId,callback){
	var options = {
		success:function(response){
			if(response.status == 'success'){
				callback(true,response);
			}else{
				display_new_errors(response.message,formId);
				callback(false,response);
			}
		},
		resetForm:false
	};

	$("form#"+formId).ajaxSubmit(options);
}//end ajax_submit()

function display_new_errors(errors,formId){

	$firstError = '';
	$('#'+formId+' span.error').html('');
	$('#'+formId).find('.form-line').removeClass('error');
	if(typeof errors == "object"){
		try{
			$.each(errors,function(index,html){
				if(html.param == 'invalid-access'){
					if($firstError == ''){
						$firstError = 'user-defined-notice';
					}
					notice('error',html.msg);
				}else{

					for (var key of Object.keys(html)) {

						var errorMsg = html[key].message;
						$('#'+formId+' #'+key+'_error').html(errorMsg).show();
					}
					/*var errorId = html.param;

					if($firstError == ''){
						$firstError = errorId;
					}

					$('#'+formId+' #'+errorId+'_error').prev('.form-line').addClass('error');

					var fields = errorId.split('.');
					var languageId = (fields[1]) ? fields[1] : "";
					if(typeof languageId !== "undefined" && languageId != ""){

						if(languageId == DEFAULT_LANGUAGE_CODE){
							var fieldname 		= (fields[0]) ? fields[0] : "";
							var fieldNameLast 	= (fields[2]) ? fields[2] : "";

							var newErrorId = fieldname+"_"+languageId+"_"+fieldNameLast;
							$('#'+newErrorId+'_error').html(html.msg).show();
						}
					}



					$('#'+formId+' #'+errorId+'_error').html(html.msg).show();*/
				}
			});
		}catch(e){
			console.log(e);
			notice('error','Something went wrong, Please try again.');
			$firstError = 'user-defined-notice';
		}
	}else{
		notice('error',errors);
		$firstError = 'user-defined-notice';
	}
	if($firstError != ''){
		var scrollTopId = '#'+$firstError;
		if($firstError != 'user-defined-notice'){
			if($('#'+$firstError+'_error').length > 0){
				$('#'+$firstError+'_error').focus();
			}
			scrollTopId = '#'+formId+' #'+$firstError+'_error';
		}
		if($(scrollTopId).length > 0){
			$("html,body").animate({scrollTop: $(scrollTopId).offset().top - 150}, "slow");
		}
	}
}//end display_errors()



function functionHideModel(){
	$("#form_modal").modal("hide");
}


/**
 * Function is used to send ajax requests
 *
 * @params options As options
 */
function ajaxRequest(options,callback){
	var url 	= (options.url) 	? options.url	: "";
	var method	= (options.method)  ? options.method: "";
	var data	= (options.data) 	? options.data	: {};
	if(url && data && method){
		$.ajax({
			'type'	    : method,
			'url'	    : url,
			'data'	    : data,
			'beforeSend': function(xhr){
				xhr.setRequestHeader('request-type', 'ajax')
			},
			'success'   : function (response){
				callback(response);
			},
			'error' : function (response){
				callback(response);
			}
		});
	}else{
		callback({status:'<%=STATUS_ERROR%>',message:"Missing parameters" });
	}
}// end ajaxRequest()

/**
 * Fetch data function is used to fetch data using ajax request
 * url is used for ajax url and admin url is used to replace current url, like if current url is /stores and if i select any restarurant like store-1 in that case admin url is /stores/store-1
 */
function fetchData(){
	var selectorId 	= "main-container";
	var self		= $("#"+selectorId);
	var url  		= self.data("url");
	var isModal		= self.data("open-modal");
	var modalId		= self.data("modal-id");
	var container	= self.data("container");
	var sameTabHtml	= self.data("same-tab-html");

	modalId = isModal ? ((modalId) ? modalId : "form_modal") : "";
	if(url){
		ajaxRequest({url: url, method: "GET"},function(response){
			if(response.status == 400){
				if(sameTabHtml){
					$("#"+container).html($("."+sameTabHtml).html()).removeClass("hideMe");
				}else{
					var responseJSON 	=	(response && response.responseJSON) ? response.responseJSON :{};
					var message 		= 	(responseJSON.message) ? responseJSON.message : "";
					if(message) notice("error",message);

					if(responseJSON.redirect_url){
						window.location.href = responseJSON.redirect_url;
					}
				}
			}else{
				if(isModal && modalId){
					$("#"+modalId).html(response).modal("show");
					if($("#"+modalId).find(".modal-header h2 .modal-close").length == 0) $("#"+modalId).find(".modal-header").append('<button type="button" class="btn-close modal-close" data-bs-dismiss="modal" aria-label="Close"></button>');
				}else if(container){
					$("#"+container).html(response);
				}else{
					$("#main-container").html(response);
				}
			}
		});
	}
}

/* Event triggered when any link with action button class clicked */
$(document).on('click','.action-btn, .old-assignment',function(e){

	e.preventDefault();
	var selectorId = "main-container";
	
	var type		= $(this).data("type");
	var isModal 	= $(this).data("open-modal");
	// var url			= $(this).attr("href");
	var url			= $(this).attr("data-action-url") ? $(this).attr("data-action-url") : $(this).attr("href");
	var container 	= $(this).data("container");
	var sameTabHtml	= $(this).data("same-tab-html");

	$("#"+selectorId).data("selected-type",type)
		.data("open-modal",(isModal) ? true : false)
		.data("url",url)
		.data("container",(container) ? container : "")
		.data("same-tab-html",(sameTabHtml) ? sameTabHtml : false);
	fetchData();
});