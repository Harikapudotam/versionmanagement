sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"ust/ua/useraccess/test/integration/pages/UserAccessList",
	"ust/ua/useraccess/test/integration/pages/UserAccessObjectPage"
], function (JourneyRunner, UserAccessList, UserAccessObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('ust/ua/useraccess') + '/test/flp.html#app-preview',
        pages: {
			onTheUserAccessList: UserAccessList,
			onTheUserAccessObjectPage: UserAccessObjectPage
        },
        async: true
    });

    return runner;
});

