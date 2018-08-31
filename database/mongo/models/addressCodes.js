var
    goose = require('mongoose'),
    Schema = goose.Schema;

var models = module.exports = function(connection) {
    connection = connection || goose;

    return connection.model('AddressCodes',
        new Schema(AddressCodes()),
        'addressCodes');
};

function AddressCodes() {
    return {
        _id: { type: String },
        countryShortCode:{ type: String },
        countryLongCode: { type: String },
        countryNumberCode: { type: Number },
        regions: [
            {
                regionName : { type: String },
                regionType : { type: String },
                regionCode : { type: String },
                regionNumberCode : { type: Number }
            }
        ]
    }
}
