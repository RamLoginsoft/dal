var
jaSchema = require('../mongo/models/jobApplications'),
JobApplications = jaSchema.JobApplications;
//console.log("JobApplications DDBBS- "+JSON.stringify(jaSchema));

module.exports = function(input, type, cb) {
console.log("JobApplications DDBB- "+input.reportName);
  var result = {
        success: true
      };
    var
      from = new Date(input.fromDate),
      to = new Date(input.toDate);
    console.log("JobApplications from- "+from);
    var match = {
      "timestamp.in": {
        $gte: from,
        $lt: to
      },
      productName: "SmartRecruiters",
      genericEndpoint: {$in: ["/apply", "/apply/{requisitionId}/"]}   //, "/candidate"
    };
    var group = {
      productName: "$productName",
      applyUrlEmployer: "$applyUrlEmployer",
      applyUrlJob: "$applyUrlJob"
    };
    var pipeline = [
      {$match: match},
      {$group: {
        _id: group,
        applyStarts: {
          $sum: {
            $cond: [
              { $eq: ["$genericEndpoint", "/apply/{requisitionId}/"]},
              1,
              0
            ]
           }
        },
        applyCompletes: {
          $sum: {
            $cond: [
              { $eq: ["$genericEndpoint", "/apply"]},
              1,
              0
            ]
          }
        },
        mobileApplyStarts: {
          $sum: {
            $cond: [
              { $and: [{
                $eq: ["$genericEndpoint", "/apply/{requisitionId}/"]
              }, {
                $eq: ["$isMobile", true]
              }
                ]},
              1,
              0
            ]
          }
        },
        mobileApplyCompletes: {
          $sum: {
            $cond: [ 
              { $and: [{ 
                $eq: ["$genericEndpoint", "/apply"]
              }, {
                $eq: ["$isMobile", true]
              }
                ]},
              1, 
              0
            ]
          }
        },
        pcApplyStarts: {
          $sum: {
            $cond: [ 
              { $and: [{ 
                $eq: ["$genericEndpoint", "/apply/{requisitionId}/"]
              }, {
                $eq: ["$isMobile", false]
              }
                ]},
              1, 
              0
            ]
          }
        },
        pcApplyCompletes: {
          $sum: {
            $cond: [ 
              { $and: [{ 
                $eq: ["$genericEndpoint", "/apply"]
              }, {
                $eq: ["$isMobile", false]
              }
                ]},
              1, 
              0
            ]
          }
        }
      }
    },
      {
        $group: {
          _id: {
            productName: "$_id.productName",
            applyUrlEmployer: "$_id.applyUrlEmployer"
          },
          applyStarts: {$sum: "$applyStarts"},
          applyCompletes: {$sum: "$applyCompletes"},
          mobileApplyStarts: {$sum: "$mobileApplyStarts"},
          mobileApplyCompletes: {$sum: "$mobileApplyCompletes"},
          pcApplyStarts: {$sum: "$pcApplyStarts"},
          pcApplyCompletes: {$sum: "$pcApplyCompletes"},
          numberOfJobs: {$sum: 1}
        }
      },
      {$sort: {"_id": 1}}
    ];

    result = JobApplications.aggregate(pipeline);

    cb(null, result);
     
};