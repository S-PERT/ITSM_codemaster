sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"zsp/itsm/codemaster/test/integration/pages/mainList",
	"zsp/itsm/codemaster/test/integration/pages/mainObjectPage"
], function (JourneyRunner, mainList, mainObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('zsp/itsm/codemaster') + '/test/flp.html#app-preview',
        pages: {
			onThemainList: mainList,
			onThemainObjectPage: mainObjectPage
        },
        async: true
    });

    return runner;
});

