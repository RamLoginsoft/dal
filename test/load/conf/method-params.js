(function ( parameterConfig ) {

	var moment = require('moment');

	parameterConfig.methodParameters = {

		// lightweight
		getTransactionStates: [],
		getPayPalOrganization: [{
			organizationId: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433',
			payerId: 'Test'
			}],
		getRoles: [],
		getTestBridges: [''],
		getPaymentHistory: [{
				organizationId: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433'
			}],
		getTransactionQuantity: [{
				id: '3'
			}],
		getOrganization: [{
				organizationId: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433'
			}],
		getRelationships: [{
				organizationId: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433'
			}],
		getSyndicationItems: [{
				channel: '4'
			}],
		getInstances: [{
				organizationId: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433'
			}],
		getAccessApiKey: [{
				accessId: '27541728-1BC5-4457-8752-4AF2DD0B58D4'
			}],
		getBridge: [{
				instanceid: '8B4F7616-D0E9-4CF7-A941-75985B3E6ABE',
				organizationid: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433'
			}],
		getAPIKeyData: [{
				key: 'E2B640F4-4AD3-4F83-9845-00B335A0A33F'
			}],
		getUsers: [{
				organizationid: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433'
			}],

		// heavy
		getBridgeActivityIntervalSummary: [{
				reportType: 'totalRequests',
				OrganizationID: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433',
				Range: '30',
				Interval: 'day',
				offset: '0',
				accessID: '',
				bridgeID: '',
				ownerID: '',
				requestorID: ''
			}],
		getBridgeActivityRoutesSummary: [{
				OrganizationID: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433',
				Range: '30',
				Interval: 'day',
				offset: '0',
				accessID: '',
				bridgeId: '',
				ownerID: '',
				requestorID: ''
			}],
		getRequestLogBySession: [{
				SessionID: '',  // fill in real values
				OrganizationID: 'BB6115B9-B00C-4F1E-B74B-674B7F3D8433'
				}],
		getRequestLogDetail: [{
				requestId: ''  // fill in real values
			}]

		//mongo
		// _getRequestLog: [{
		// 	dataTimeFromApp: { $gte: moment().utc().subtract(7, 'days').hours(0).minutes(0).milliseconds(0).format() },
		// 	organizationID: '2454DFF2-B2DC-49D7-9F4E-3079614C6973',
		// }]
		// 	,
		// invoiceReport: [{
		// 		billDate: '08-01-2015',
		// 		minVolume: 500
		// 	}]
	};

}(module.exports));