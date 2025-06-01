/**
 * Function to accept assign attribute from 
 */
$(".btn-assign-attribute").click(function(){
    var btnId = $(this).attr("id");
	startTextLoading(btnId);
	ajax_submit("assign_attribute",function(status,response){
		if(status){
			window.location.href = response.redirect_url;
		}else{
			stopTextLoading(btnId);
		}
	});
});


/**
* function to open assign attribute modal
*
* @param  user login string
*
* @return void
*/
function assignAttribute(event){
	var currentTarget = event.currentTarget;
	if(currentTarget != ""){
		let categoryId = $(currentTarget).attr('data-id');
        let url = $(currentTarget).attr('data-href');
        getAttributeList(url)
		$('#overlay1').show();	
        $("#attribute_error").html('');
		$('#categoryId').val(categoryId);
		$('#assign-attribute-modal-box').modal('show');
		$('#overlay1').hide();				
	}
}//end assignAttribute()

function getAttributeList(url) {
    var option  = '';
    $('#attribute').selectpicker('destroy');
    $.ajax({
        'type': 'POST',
        url:  url,
        'data': {  },
        'success': function (response) {
            var result = (typeof response.result !== typeof undefined && response.result) ? response.result : [];
             option = '<option value="">Select Attribute</option>';
        
            option+=result;
          
            $("#attribute").html(option);
            
            $('#attribute').selectpicker('render');
        }
    });
}
		
		