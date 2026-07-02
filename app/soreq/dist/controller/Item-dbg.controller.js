sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("ust.so.soreq.controller.Item", {

        onInit: function () {

            this.getOwnerComponent()
                .getRouter()
                .getRoute("Item")
                .attachPatternMatched(this._onRouteMatched, this);

        },

        _onRouteMatched: function (oEvent) {

            var sID = oEvent.getParameter("arguments").ID;

            var sPath = "/SalesOrderItems(guid'" + sID + "')";

            this.getView().bindElement({
                path: sPath,
                parameters: {
                    expand: "Header"
                }
            });

        }

    });

});