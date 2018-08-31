var
goose = require('mongoose'),
Schema = goose.Schema;

// Collection for Taleo Business Enterprise
//  proof-of-concept "form module" solution.
var models = module.exports = function ( connection ) {
  connection = connection || goose;

  return connection.model('TBECandidate',
                          new Schema(tbeCandidateSchema()),
                          'tbeCandidate');
};

function tbeCandidateSchema ( ) {
  return {availableDate:{type: Date},
          awards:[{dateReceived:{type:Date},
                   description:{type:String},
                   organization:{type:String},
                   title:{type:String}}],
          candidateAddresses:[{address1:{type:String},
                               address2:{type:String},
                               city:{type:String},
                               state:{type:String},
                               county:{type:String},
                               country:{type:String},
                               isPrimary:{type:Boolean},
                               postalCode:{type:String},
                               type:{type:String}}],
          candidateSourceId:{type:String},
          candidateSourceName:{type:String},
          candidateSourceUrl:{type:String},
          certifications:[{name:{type:String},
                           date:{type:Date},
                           organization:{type:String},
                           description:{type:String}}],
          coverLetterText:{type:String},
          currencyType:{type:String},
          desiredSalary:{type:Number},
          desiredSalaryType:{type:String},
          documents:[{documentFile:{fileName:{type:String},
                                    fileType:{type:String},
                                    fileContent:{type:String}},
                      documentType:{type:String}}],
          education:[{schoolName:{type:String},
                      city:{type:String},
                      state:{type:String},
                      country:{type:String},
                      startDate:{type:Date},
                      endDate:{type:Date},
                      graduationDate:{type:Date},
                      degree:{type:String},
                      major:{type:String},
                      minor:{type:String},
                      gpa:{type:Number}}],
          email:{type:String},
          emails:[{type:{type:String},
                   value:{type:String}}],
          employmentHistory:[{current:{type:Boolean},
                              employer:{type:String},
                              employerAddress:{address1:{type:String},
                                               address2:{type:String},
                                               city:{type:String},
                                               country:{type:String},
                                               county:{type:String},
                                               postalCode:{type:String},
                                               state:{type:String},
                                               type:{type:String}},
                              endDate:{type:Date},
                              function:{type:String},
                              positionTitle:{type:String},
                              reasonForLeaving:{type:String},
                              startDate:{type:Date},
                              supervisorEmail:{type:String},
                              supervisorName:{type:String},
                              supervisorPhone:{type:String}}],
          firstName:{type:String},
          homePhone:{type:String},
          id:{type:String},
          lastName:{type:String},
          maidenName:{type:String},
          middleName:{type:String},
          militaryBranch:{type:String},
          militaryDischargeReason:{type:String},
          militaryHighestRankAchieved:{type:String},
          militaryHistory:[{branch:{type:String},
                            city:{type:String},
                            country:{type:String},
                            description:{type:String},
                            dischargeReason:{type:String},
                            endDate:{type:Date},
                            highestRankAchieved:{type:String},
                            startDate:{type:Date},
                            state:{type:String},
                            title:{type:String}}],
          militaryServiceStartDate:{type:Date},
          militaryServiceEndDate:{type:Date},
          mobilePhone:{type:String},
          patents:[{dateReceived:{type:Date},
                    description:{type:String},
                    inventors:[String],
                    number:{type:String},
                    title:{type:String},
                    organization:{type:String}}],
          preferredContactMethod:{type:String},
          publications:[{authors:[{firstName:{type:String},
                                   lastName:{type:String}}],
                         date:{type:Date},
                         description:{type:String},
                         publisher:{address:{type:String},
                                    city:{type:String},
                                    country:{type:String},
                                    name:{type:String},
                                    postalCode:{type:String}},
                         title:{type:String}}],
          references:[{name:{type:String},
                       email:{type:String},
                       phone:{type:String},
                       companyName:{type:String},
                       jobTitle:{type:String},
                       relationshipType:{type:String},
                       relationshipDesc:{type:String}}],
          resumeText:{type:String},
          sourceCandidateId:{type:String},
          websites:[{description:{type:String},
                     url:{type:String}}],
          workAuthorizedUS:{type:Boolean},
          workPhone:{type:String}};
}