sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (BaseController) => {
    "use strict";

    return BaseController.extend("ust.access.access.controller.create", {
        onInit: function () {

            var oModel = new sap.ui.model.json.JSONModel();

            this.getView().setModel(oModel, "createModel");
            var oVHModel = new sap.ui.model.json.JSONModel({
                companies: [],
                projects: []
            });
            this.getView().setModel(oVHModel, "vh");

            this.getOwnerComponent()
                .getRouter()
                .getRoute("Create");
        },
        _onRouteMatched: function () {

            this.getView().getModel("createModel").setData({
                
                iasSubject: "",
                fullName: "",
                role: "",
                companies: "",
                projects: "",
                isActive: ""
            });
            var oODataModel = this.getView().getModel();

        },
        onSave: function () {
            console.log('save clicked');

            var oData = this.getView().getModel("createModel").getData();
            var oODataModel = this.getView().getModel();

            console.log(oODataModel);

            oODataModel.create("/UserAccess", oData, {
                success: function () {

                    sap.m.MessageToast.show("Created successfully");

                    oODataModel.refresh(true);

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("Targetuseraccess");

                }.bind(this),

                error: function (oError) {
                    console.error(oError);
                    sap.m.MessageBox.error("Creation failed");
                }
            });
        },
        onCancel: function () {

            this.getView().getModel("createModel").setData({
                iasSubject: "",
                fullName: "",
                role: "",
                companies: "",
                projects: "",
                isActive: ""
            });

            this.getOwnerComponent().getRouter().navTo("Routeuseraccess");
        }

    });
});