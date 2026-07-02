sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (BaseController) => {
    "use strict";

    return BaseController.extend("ust.so.soreq.controller.Create", {

        onInit: function () {

            var oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "createModel");

            // Value Help Model
            var oVHModel = new sap.ui.model.json.JSONModel({
                companies: [],
                projects: []
            });

            this.getView().setModel(oVHModel, "vh");

            this.getOwnerComponent()
                .getRouter()
                .getRoute("Create")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {

            this.getView().getModel("createModel").setData({
                CustomerId: "",
                CustomerName: "",
                Factory: "",
                OrderDate: "",
                RequestedDate: "",
                Currency: "",
                project: "",
                companyCode: "",
                Items: []
            });

            var oODataModel = this.getView().getModel();

            // Company Codes
            oODataModel.callFunction("/getCompanyCodes", {
                method: "GET",
                success: function (oData) {

                    this.getView()
                        .getModel("vh")
                        .setProperty("/companies", oData.d.results);

                }.bind(this),

                error: function (oError) {
                    console.error(oError);
                }
            });

            // Projects
            oODataModel.callFunction("/getProjects", {
                method: "GET",
                success: function (oData) {

                    this.getView()
                        .getModel("vh")
                        .setProperty("/projects", oData.d.results);

                }.bind(this),

                error: function (oError) {
                    console.error(oError);
                }
            });
        },

        onAddItem: function () {

            var oModel = this.getView().getModel("createModel");
            var aItems = oModel.getProperty("/Items");

            aItems.push({
                ItemNo: "",
                MaterialNo: "",
                Quantity: ""
            });

            oModel.setProperty("/Items", aItems);
        },

        onSave: function () {

            var oData = this.getView().getModel("createModel").getData();
            var oODataModel = this.getView().getModel();

            if (oData.OrderDate) {
                oData.OrderDate = new Date(oData.OrderDate);
            }

            if (oData.RequestedDate) {
                oData.RequestedDate = new Date(oData.RequestedDate);
            }

            oODataModel.create("/SalesOrderHeaders", oData, {

                success: function () {

                    sap.m.MessageToast.show("Created successfully");

                    oODataModel.refresh(true);

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("RouteSO");

                }.bind(this),

                error: function (oError) {
                    console.error(oError);
                    sap.m.MessageBox.error("Creation failed");
                }

            });

        },

        onCancel: function () {

            this.getView().getModel("createModel").setData({
                CustomerId: "",
                CustomerName: "",
                Factory: "",
                OrderDate: "",
                RequestedDate: "",
                Currency: "",
                project: "",
                companyCode: "",
                Items: []
            });

            this.getOwnerComponent().getRouter().navTo("RouteSO");

        },

        onProjectValueHelp: function () {

            if (!this._oProjectDialog) {

                this._oProjectDialog = new sap.m.SelectDialog({
                    title: "Select Project",
                    confirm: this.onProjectConfirm.bind(this)
                });

                this._oProjectDialog.setModel(this.getView().getModel("vh"));

                this._oProjectDialog.bindItems({
                    path: "vh>/projects",
                    template: new sap.m.StandardListItem({
                        title: "{vh>value}"
                    })
                });

                this.getView().addDependent(this._oProjectDialog);
            }

            this._oProjectDialog.open();
        },

        onCompanyCodeValueHelp: function () {

            if (!this._oCompanyDialog) {

                this._oCompanyDialog = new sap.m.SelectDialog({
                    title: "Select Company Code",
                    confirm: this.onCompanyCodeConfirm.bind(this)
                });

                this._oCompanyDialog.setModel(this.getView().getModel("vh"));

                this._oCompanyDialog.bindItems({
                    path: "vh>/companies",
                    template: new sap.m.StandardListItem({
                        title: "{vh>value}"
                    })
                });

                this.getView().addDependent(this._oCompanyDialog);
            }

            this._oCompanyDialog.open();
        },

        onProjectConfirm: function (oEvent) {

            var oItem = oEvent.getParameter("selectedItem");

            if (oItem) {
                this.getView()
                    .getModel("createModel")
                    .setProperty("/project", oItem.getTitle());
            }
        },

        onCompanyCodeConfirm: function (oEvent) {

            var oItem = oEvent.getParameter("selectedItem");

            if (oItem) {
                this.getView()
                    .getModel("createModel")
                    .setProperty("/companyCode", oItem.getTitle());
            }
        }

    });
});