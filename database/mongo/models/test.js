(function ( schema ) {
	var
	goose = require('mongoose'),
	Schema = goose.Schema;

	schema.HelloWorld = goose.model(
		'HelloWorld',
		new Schema({
			name: String
		}),
		'helloworld');

}(module.exports));