var
goose = require('mongoose'),
Schema = goose.Schema;

var models = module.exports = function ( connection ) {
  connection = connection || goose;

  return connection.model('Candidate',
                          new Schema(CandidateSchema()),
                          'candidate');
};

function CandidateSchema ( ) {
  return {
    applyUrl: {type:String, required: true},
    destination: {type:String, required: false},
    employerAuthType: {type:String, required: false},
    employerKey: {type:String, required: false},
    employerId: {type:String, required: false},
    employerPassword: {type:String, required: false},
    employerUsername: {type:String, required: false},
    jobBoardEmployerId: {type:String, required: false},
    job: {
      _id: false,
      company: {type:String},
      requisitionId: {type: String, required: false}},
    candidate: {
      _id:false,
      availableDate:{type: Date},
      awards: [{
        _id: false,
        dateReceived:{type:Date},
        description:{type:String},
        organization:{type:String},
        title:{type:String}}],
      candidateAddresses:[{
        _id:false,
        address1:{type:String},
        address2:{type:String},
        city:{type:String},
        state:{type:String},
        county:{type:String},
        country:{type:String},
        isPrimary:{type:Boolean},
        postalCode:{type:String},
        type:{type:String}
      }],
      candidateSourceId:{type:String},
      candidateSourceName:{type:String},
      candidateSourceUrl:{type:String},
      certifications:[{
        _id:false,
        name:{type:String},
        date:{type:Date},
        organization:{type:String},
        description:{type:String}
      }],
      clearanceExpirationDate:{type:String},
      clearanceIssuingAgency:{type:String},
      clearanceLevel:{type:String},
      clearanceStatus:{type:String},
      coverLetterText:{type:String},
      currencyType:{type:String},
      desiredSalary:{type:Number},
      desiredSalaryType:{type:String},
      documents:[{
        _id:false,
        documentFile:{_id:false,
                      fileName:{type:String},
                      fileType:{type:String},
                      fileContent:{type:String}},
        documentType:{type:String}
      }],
      education:[{
        _id:false,
        schoolName:{type:String},
        city:{type:String},
        state:{type:String},
        country:{type:String},
        startDate:{type:Date},
        endDate:{type:Date},
        graduationDate:{type:Date},
        degree:{type:String},
        major:{type:String},
        minor:{type:String},
        gpa:{type:Number}
      }],
      email:{type:String},
      emails:[{
        _id:false,
        type:{type:String},
        value:{type:String}
      }],
      employmentHistory:[{
        _id:false,
        current:{type:Boolean},
        employer:{type:String},
        employerAddress:{
          _id:false,
          address1:{type:String},
          address2:{type:String},
          city:{type:String},
          country:{type:String},
          county:{type:String},
          postalCode:{type:String},
          state:{type:String},
          type:{type:String}
        },
        endDate:{type:Date},
        function:{type:String},
        positionTitle:{type:String},
        reasonForLeaving:{type:String},
        startDate:{type:Date},
        supervisorEmail:{type:String},
        supervisorName:{type:String},
        supervisorPhone:{type:String}
      }],
      ethnicity:{type:String},
      firstName:{type:String},
      gender:{type:String},
      homePhone:{type:String},
      id:{type:String},
      lastName:{type:String},
      maidenName:{type:String},
      middleName:{type:String},
      militaryBranch:{type:String},
      militaryDischargeReason:{type:String},
      militaryHighestRankAchieved:{type:String},
      militaryHistory:[{
        _id:false,
        branch:{type:String},
        city:{type:String},
        country:{type:String},
        description:{type:String},
        dischargeReason:{type:String},
        endDate:{type:Date},
        highestRankAchieved:{type:String},
        startDate:{type:Date},
        state:{type:String},
        title:{type:String}
      }],
      militaryServiceStartDate:{type:Date},
      militaryServiceEndDate:{type:Date},
      militaryVeteranUS:{type:Boolean},
      mobilePhone:{type:String},
      patents:[{
        _id:false,
        dateReceived:{type:Date},
        description:{type:String},
        inventors:[String],
        number:{type:String},
        title:{type:String},
        organization:{type:String}
      }],
      preferredContactMethod:{type:String},
      publications:[{
        _id:false,
        authors:[{_id:false,
                  firstName:{type:String},
                  lastName:{type:String}}],
        date:{type:Date},
        description:{type:String},
        publisher:{_id:false,
                   address:{type:String},
                   city:{type:String},
                   country:{type:String},
                   name:{type:String},
                   postalCode:{type:String}},
        title:{type:String}
      }],
      references:[{
        _id:false,
        name:{type:String},
        email:{type:String},
        phone:{type:String},
        companyName:{type:String},
        jobTitle:{type:String},
        relationshipType:{type:String},
        relationshipDesc:{type:String}
      }],
      resumeText:{type:String},
      sourceCandidateId:{type:String},
      websites:[{
        _id:false,
        description:{type:String},
        url:{type:String}
      }],
      workAuthorizedUS:{type:Boolean},
      workPhone:{type:String}}
  };
}
