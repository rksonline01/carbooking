	var pagePathName 	= "search_" +(($('form#searchForm').attr("data-listing-url")) ? $('form#searchForm').attr("data-listing-url") : window.location.pathname);

	$(document).ready(function() {
		/* Setting up the local when any changes are made in form */
		var formId = 'searchForm';
		$('form#'+formId).on('keyup change paste', 'input, select, textarea', function(){
			var str = $( '#' + formId).serializeArray();
			var selectedText = $("#posted_by option:selected").text();
			if( selectedText != ""){
				str.push({ name: "user_id_text", value: selectedText });
			}
			localStorage[pagePathName] = 	JSON.stringify(str);
		});
	});

	fillSearchFromLocalStorage();

	/* Filling up the form from the local storage */
	function fillSearchFromLocalStorage(key = null){
		var urlVariable 	= getUrlVars();
		if(localStorage[pagePathName] && typeof localStorage[pagePathName] != 'undefined'){
			searchData	=	JSON.parse(localStorage[pagePathName]);
			if(searchData){
				if( urlVariable != undefined && urlVariable != "" ){
					$('form#searchForm input, select, textarea').each(function(){
						if($(this).val()){
							var str = $( '#searchForm').serializeArray();
							var selectedText = $("#posted_by option:selected").text();
							if( selectedText != ""){
								str.push({ name: "user_id_text", value: selectedText });
							}
							localStorage[pagePathName] = 	JSON.stringify(str);
							$(document).ready(function() {
								//dataTable.draw();
								showPostDetails('',1);
							});
						}
					});
				}
				else{
					var userIdVal 	= "";
					var userIdtext	= "";
					for(let i = 0; i < searchData.length; i++){
						if(searchData[i]){
							if(key){
								if(key == searchData[i]["name"]){
									$('[name="'+ searchData[i]["name"]+'"]').val(searchData[i]["value"]);
								}
							}else{
								if( "user_id_text" != searchData[i]["name"] && "user_id" != searchData[i]["name"] ){
									$('[name="'+ searchData[i]["name"]+'"]').val(searchData[i]["value"]);
								}
								else{
									if( "user_id" == searchData[i]["name"] ){
										userIdVal 	= searchData[i]["value"];
									}
									else if( "user_id_text" == searchData[i]["name"] ){
										userIdtext 	= searchData[i]["value"];
									}
								}
							}
						}
					}

					if( userIdVal != "" &&  userIdtext != "" ){
						$('#posted_by').append('<option value="'+userIdVal+'" selected="selected">'+userIdtext+'</option>').selectpicker('refresh');
						$('#posted_by').trigger('change');
					}

					/*if($(".bootstrap-select").length >0){
						setTimeout(function(){
							$(".bootstrap-select select").selectpicker('refresh');
						},1)
					}*/
				}
			}
		}else{
			$('form#searchForm input, select, textarea').each(function(){
				if($(this).val()){
					var str = $( '#searchForm').serializeArray();
					var selectedText = $("#posted_by option:selected").text();
					if( selectedText != ""){
						str.push({ name: "user_id_text", value: selectedText });
					}
					localStorage[pagePathName] = 	JSON.stringify(str);
					$(document).ready(function() {
						//dataTable.draw();
						showPostDetails('',1);
					});
				}
			});
		}
	}

	function getUrlVars(){
		var vars = "", hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			if( typeof hash[1] != undefined && hash[1] != undefined ){
				vars += "/"+hash[1];
			}
		}
		return vars;
	}
	
	/* Calling up the reset function for datatable */
	$(document).on("click","#reset",function(){
		resetDataTable();
		//dataTable.state.clear();

		if($(this).attr("data-href")){
			window.location.href = $(this).attr("data-href");
		}else{
			window.location.reload();
		}
	});

	/**
	* Function for submit data table
	
	$(document).on('click','.submit_datatable_form', function(e){
		dataTable.draw();
	});*/

	/* Resetting the datatable and local storage*/
	function resetDataTable(){
		localStorage.removeItem(pagePathName);
		//dataTable.state.clear();

		//dataTable.columns().search('');

		/** Reset form **/
		$("#searchForm").find("input,textarea,select").each(function(index,html){
			$(this).val('');
		});

		$('#posted_by').selectpicker('refresh');

		/*if($(".bootstrap-select").length >0){
			 setTimeout(function(){
				$(".bootstrap-select select").selectpicker('refresh');
			},1)
		}*/
	}// end resetDataTable()
