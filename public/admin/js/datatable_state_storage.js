	var pagePathName 	= "search_" +(($('form#searchForm').attr("data-listing-url")) ? $('form#searchForm').attr("data-listing-url") : window.location.pathname);

	$(document).ready(function() {
		/* Setting up the local when any changes are made in form */
		var formId = 'searchForm';
		$('form#'+formId).on('keyup change paste', 'input, select, textarea', function(){
			var str = $( '#' + formId).serializeArray();
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
							localStorage[pagePathName] = 	JSON.stringify(str);
							$(document).ready(function() {
								dataTable.draw();
							});
						}
					});
				}
				else{
					for(let i = 0; i < searchData.length; i++){
						if(searchData[i]){
							if(key){
								if(key == searchData[i]["name"]){
									$('[name="'+ searchData[i]["name"]+'"]').val(searchData[i]["value"]);
								}
							}else{
								$('[name="'+ searchData[i]["name"]+'"]').val(searchData[i]["value"]);
							}
						}
					}

					if($(".bootstrap-select").length >0){
						setTimeout(function(){
						$(".bootstrap-select select").selectpicker('refresh');
					},1)
				}
				}
			}
		}else{
			$('form#searchForm input, select, textarea').each(function(){
				if($(this).val()){
					var str = $( '#searchForm').serializeArray();
					localStorage[pagePathName] = 	JSON.stringify(str);
					$(document).ready(function() {
						dataTable.draw();
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
		dataTable.state.clear();

		if($(this).attr("data-href")){
			window.location.href = $(this).attr("data-href");
		}else{
			window.location.reload();
		}
	});

	/**
	* Function for submit data table
	*/
	$(document).on('click','.submit_datatable_form', function(e){
		dataTable.draw();
	});

	/* Resetting the datatable and local storage*/
	function resetDataTable(){
		localStorage.removeItem(pagePathName);
		dataTable.state.clear();

		dataTable.columns().search('');

		/** Reset form **/
		$("#searchForm").find("input,textarea,select").each(function(index,html){
			$(this).val('');
		});

		if($(".bootstrap-select").length >0){
			 setTimeout(function(){
				$(".bootstrap-select select").selectpicker('refresh');
			},1)
		}
	}// end resetDataTable()

	function openActionButtons(button) {
		 event.stopPropagation(); // Prevents the click from propagating to the document

		// Check if the clicked button already has the 'active' class
		if ($(button).hasClass('active')) {
			$(button).removeClass('active');
		} else {
			$(".action-button").removeClass('active');
			$(button).addClass('active');
		}
	}
