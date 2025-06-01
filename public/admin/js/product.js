function getSubCategory(select,fieldName,callAttr,selected_value) {
    let parent_category = select.value;
    if(parent_category && fieldName){
        var option  = '';
        $('#'+fieldName).selectpicker('destroy');
        $.ajax({
            'type': 'POST',
            url:  admin_list_url+'/get_sub_category',
            'data': { parent_id : parent_category },
            'success': function (response) {
                var result = (typeof response.result !== typeof undefined && response.result) ? response.result : [];
                option = '<option value="">Select Category</option>';
            
                result.map(category=>{
                    let selected = (selected_value == category._id) ? "selected" : '';
                    option += "<option value="+category._id+" "+selected+">"+category.category_name+"</option>"
                })
                
            
                $("#"+fieldName).html(option);
                
                $('#'+fieldName).selectpicker('render');
                $("#"+fieldName+"_div").removeClass("d-none")
            }
        });
    }else{
        $("#"+fieldName+"_div").addClass("d-none")
    }
    if(callAttr){
        getAttrributeOption(parent_category)
    }
}

function getAttrributeOption(category) {
    var option = '';
    if(category){
        $.ajax({
            'type': 'POST',
            url:  admin_list_url+'/get_attribute_options',
            'data': { category_id : category },
            'success': function (response) {
                var result = (typeof response.result !== typeof undefined && response.result) ? response.result : [];
                result.map((attribute,index)=>{
                    let title = attribute.title;
                    let title_lower = attribute.title.toLowerCase();
                    let optionList = attribute.optionData;
                    option+='<div class="col-sm-6"><div class="form-group"><div class="form-line"><label for='+title_lower+' class="control-label">'+title+'<span class="required"> * </span> :</label><select class="form-control show-tick" id='+title_lower+' name="attribute['+index+'][option_value]"><option value="">Select '+title+'</option>';
                    optionList.map(attrOp=>{
                        option+='<option value='+attrOp._id+'>'+attrOp.title+'</option>'
                    });
                    option+='</select><input type="hidden" name="attribute['+index+'][attribute_id]" value="'+attribute._id+'"></div></div></div>';
                }) 

                $("#attr_div").html(option);
                $("#attr_div").removeClass("d-none")
            }
        });
    }else{
        $("#attr_div").html('');
        $("#attr_div").addClass("d-none")
    }
    
}

function getAttributes(category,selectedAttribute) {
    var option = '';
    if(category){
        $.ajax({
            'type': 'POST',
            url:  admin_list_url+'/get_attribute_options',
            'data': { category_id : category },
            'success': function (response) {
                var result = (typeof response.result !== typeof undefined && response.result) ? response.result : [];
                result.map((attribute,index)=>{
                    let title = attribute.title;
                    let title_lower = attribute.title.toLowerCase();
                    let optionList = attribute.optionData;
                    option+='<div class="col-sm-6"><div class="form-group"><div class="form-line"><label for='+title_lower+' class="control-label">'+title+'<span class="required"> * </span> :</label><select class="form-control show-tick" id='+title_lower+' name="attribute['+index+'][option_value]"><option value="">Select '+title+'</option>';
                    optionList.map(attrOp=>{
                        option+='<option value='+attrOp._id+'>'+attrOp.title+'</option>'
                    });
                    option+='</select><input type="hidden" name="attribute['+index+'][attribute_id]" value="'+attribute._id+'"></div></div></div>';
                }) 

                $("#attr_div").html(option);
                $("#attr_div").removeClass("d-none")
            }
        });
    }else{
        $("#attr_div").html('');
        $("#attr_div").addClass("d-none")
    }
    
}

function getProductDetail(id){
    if(id){
        $.ajax({
            'type': 'POST',
            url:  admin_list_url+'/get_product_detail',
            'data': { product_id : id },
            'success': function (response) {
                let product_details = response.result;
                let parent_category_id = (product_details.parent_category) ? product_details.parent_category : '';
                let sub_category_1 = (product_details.sub_category_1) ? product_details.sub_category_1 : '';
                let sub_category_2 = (product_details.sub_category_2) ? product_details.sub_category_2 : '';
                let price = (product_details.price) ? product_details.price : 0;
                let price_without_discount = (product_details.price_without_discount) ? product_details.price_without_discount : 0;
                let vat = (product_details.vat) ? product_details.vat : 0;
                let quantity = (product_details.quantity) ? product_details.quantity :0;
                let product_code = (product_details.product_code) ? product_details.product_code : "";
                let en_product_title = (product_details["pages_descriptions"] && product_details["pages_descriptions"]["en"] && product_details["pages_descriptions"]["en"]["product_title"]) ? product_details["pages_descriptions"]["en"]["product_title"]: "";
                let ar_product_title = (product_details["pages_descriptions"] && product_details["pages_descriptions"]["ar"] && product_details["pages_descriptions"]["ar"]["product_title"]) ? product_details["pages_descriptions"]["ar"]["product_title"]: "";
                let en_brief_description = (product_details["pages_descriptions"] && product_details["pages_descriptions"]["en"] && product_details["pages_descriptions"]["en"]["brief_description"]) ? product_details["pages_descriptions"]["en"]["brief_description"]: "";
                let ar_brief_description = (product_details["pages_descriptions"] && product_details["pages_descriptions"]["ar"] && product_details["pages_descriptions"]["ar"]["brief_description"]) ? product_details["pages_descriptions"]["ar"]["brief_description"]: "";
                let en_detailed_description = (product_details["pages_descriptions"] && product_details["pages_descriptions"]["en"] && product_details["pages_descriptions"]["en"]["detailed_description"]) ? product_details["pages_descriptions"]["en"]["detailed_description"]: "";
                let ar_detailed_description = (product_details["pages_descriptions"] && product_details["pages_descriptions"]["ar"] && product_details["pages_descriptions"]["ar"]["detailed_description"]) ? product_details["pages_descriptions"]["ar"]["detailed_description"]: "";
                $('#parent_category').selectpicker('destroy');
                $('#parent_category').val(parent_category_id);
                $('#parent_category').selectpicker('render');
                if(sub_category_1){
                    setTimeout(()=>{
                        let obj = {value : parent_category_id}
                        getSubCategory(obj,'sub_category_1',0,sub_category_1);
                        getAttrributeOption(sub_category_1)
                    },200)
                }
                if(sub_category_2){
                    setTimeout(()=>{
                        let obj = {value : sub_category_1}
                        getSubCategory(obj,'sub_category_2',0,sub_category_2)
                    },200)
                }
                $("#price").val(price);
                $("#price_without_discount").val(price_without_discount);
                $("#vat").val(vat);
                $("#product_code").val(product_code);
                $("#quantity").val(quantity);
                $("#product_title_en").val(en_product_title);
                $("#product_title_ar").val(ar_product_title);
                $("#brief_description_en").html(en_brief_description);
                $("#brief_description_ar").html(ar_brief_description);
                $("#detailed_description_en").html(en_detailed_description);
                CKEDITOR.instances['detailed_description_en'].setData(en_detailed_description)
                CKEDITOR.instances['detailed_description_ar'].setData(ar_detailed_description)
            }
        });
    }
}

