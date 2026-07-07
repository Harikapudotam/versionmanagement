sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("ust.access.access.controller.useraccess", {
        onInit() {
            var oRoleModel = new JSONModel({
                role: ""
            });

             this.getOwnerComponent().setModel(oRoleModel, "roleModel");
            console.log("MODEL", this.getView().getModel());



            console.log(
    "Component Model",
    this.getOwnerComponent().getModel()
);
            this.getOwnerComponent().getModel().callFunction("/whoAmI", {

                method: "GET",

                success: function (oData) {
                    console.log("whoAmI Response:", oData);
                    console.log("User Role:", oData.whoAmI.role);
                    console.log("Email:", oData.whoAmI.email);

                    this.getOwnerComponent()
                        .getModel("roleModel")
                        .setProperty("/role", oData.whoAmI.role);

                }.bind(this),

                error: function (oError) {
                    console.error(oError);
                }
            });

        },
        onCreatePress: function () {
            // Navigate to the create view
            console.log("Navigating to Create View");
            this.getOwnerComponent().getRouter().navTo("create");
        },
    });
});