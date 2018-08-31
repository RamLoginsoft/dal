(function(models) {
  var
  goose = require('mongoose'),
  Schema = goose.Schema;

  
  models.register = function(existingConnection) {

    var connection = existingConnection || goose;
    
    models.schemas = (function( schemas ) {

      schemas.JobApplications = new Schema({
        _id: {
            type: String,
            required: true
        },
        accessId: {
            type: String,
            required: false
        },
        applyUrl: {
            type: String,
            required: false
        },
        applyUrlEmployer: {
            type: String,
            required: false
        },
        applyUrlHostname: {
            type: String,
            required: false
        },
        applyUrlJob: {
            type: String,
            required: false
        },
        applyurl: {
            type: String,
            required: false
        },
        candidate: {
            applyUrl: {
                type: String,
                required: false
            },
            atsCandidateId: {
                type: String,
                required: false
            },
            candidateAddresses: {
                city: {
                    type: String,
                    required: false
                },
                country: {
                    type: String,
                    required: false
                },
                state: {
                    type: String,
                    required: false
                }
            },
            candidateId: {
                type: String,
                required: false
            },
            currencyType: {
                type: String,
                required: false
            },
            desiredSalary: {
                type: String,
                required: false
            },
            desiredSalaryType: [ String ],
            educationDegrees: [ String ],
            employmentPositionsHeld: {
                type: Array,
                required: false
            },
            ethnicity: {
                type: String,
                required: false
            },
            gender: {
                type: String,
                required: false
            },
            jobBoardCandidateId: {
                type: String,
                required: false
            },
            militaryBranch: {
                type: String,
                required: false
            },
            polygraph: {
                type: String,
                required: false
            },
            requisitionId: {
                type: String,
                required: false
            },
            workAuthorizedUS: {
                type: Boolean,
                required: false
            }
        },
        employerId: {
            type: String,
            required: false
        },
        employerName: {
            type: String,
            required: false
        },
        employerid: {
            type: String,
            required: false
        },
        employername: {
            type: String,
            required: false
        },
        entity: {
            type: String,
            required: false
        },
        genericEndpoint: {
            type: String,
            required: false
        },
        grantee: {
            type: String,
            required: false
        },
        hostname: {
            type: String,
            required: false
        },
        httpMethod: {
            type: String,
            required: false
        },
        isMobile: {
            type: String,
            required: false
        },
        job: {
            employerRequisitionId: {
                type: String,
                required: false
            },
            jobBoardRequisitionId: {
                type: String,
                required: false
            },
            jobDescriptionText: {
                type: String,
                required: false
            },
            requisitionId: {
                type: String,
                required: false
            }
        },
        jobBoardEmployerId: {
            type: String,
            required: false
        },
        jobboardemployerid: {
            type: String,
            required: false
        },
        organizationId: {
            type: String,
            required: false
        },
        productName: {
            type: String,
            required: false
        },
        requestChainId: {
            type: String,
            required: false
        },
        simpleApiKey: {
            type: String,
            required: false
        },
        simpleApiProductName: {
            type: String,
            required: false
        },
        simpleapiproductname: {
            type: String,
            required: false
        },
        statusCode: {
            type: String,
            required: false
        },
        timestamp: { in : {
                type: Date,
                required: false
            },
            out: {
                type: Date
            },
            hour: {
                type: Date,
                required: false
            },
            day: {
                type: Date,
                required: false
            },
            elapsed: {
                type: Number
            },
            D: {
                type: Number,
                required: false
            },
            h: {
                type: Number,
                required: false
            },
            hA: {
                type: String,
                required: false
            },
            H: {
                type: Number,
                required: false
            },
            A: {
                type: String,
                required: false
            }
        },
        userAgent: {
            type: String,
            required: false
        },
        useragent: {
            type: String,
            required: false
        }
      });
      return schemas;
    })({});

    models.JobApplications =  connection.model('JobApplicationStats',
        models.schemas.JobApplications,
        'jobApplicationStats');

    return models;
  };

}(module.exports));
