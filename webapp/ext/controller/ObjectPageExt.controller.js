sap.ui.define(['sap/ui/core/mvc/ControllerExtension'
,"sap/m/MessageToast"
], function (ControllerExtension
	,MessageToast
	) {
	'use strict';

	return ControllerExtension.extend('zsp.itsm.codemaster.ext.controller.ObjectPageExt', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf zsp.itsm.codemaster.ext.controller.ObjectPageExt
             */
			onInit: function () {
				let route = this.base.getAppComponent().getRouter().getRoute("mainObjectPage");
				route.attachPatternMatched(this.onRoutePatternMatched, this);
			}
		},
		onRoutePatternMatched : function(){
			//Rich text editor 초기화
			//url주소에서 IsActiveEntity= 해당값의 value로 edit/display 상태확인
			var editable = this.getEditableflag("IsActiveEntity=");
			this.initRichTextEditor("createRTE", editable, "{Content}");
		 },
		getEditableflag: function(param){
            var complete_url = window.location.href;
            var pieces = complete_url.split(param);
            if (pieces.length == 2){
                var acDocumentArr = pieces[1].split(`)`);
				if (acDocumentArr[0]=="true"){
					return false
				} else{
					return true
				}

			}
            else {
                return "false";
            }
        },
		initRichTextEditor: function (sId, Editflag, value) {
			var that = this;
			if (that.oRichTextEditor) {
				that.oRichTextEditor.destroy();
			};
			sap.ui.require(["sap/ui/richtexteditor/RichTextEditor",
				"sap/ui/richtexteditor/library"],
				function (RTE, library) {
					that.oRichTextEditor = new RTE(sId, {
						editorType: library.EditorType.TinyMCE6,
						width: "100%",
						height: "970px",
						editable: Editflag,
						customToolbar: true,
						showGroupFont: true,
						showGroupLink: true,
						showGroupInsert: true,
						sanitizeValue:false,
						value: value,
						ready: function () {
							this.addButtonGroup("styles").addButtonGroup("table")
						}
					});
					that.getView().byId("zsp.itsm.codemaster::mainObjectPage--fe::CustomSubSection::Richtexteditor--idEditorContainer").addItem(that.oRichTextEditor);
				});
		},
	});
});
