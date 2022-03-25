const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
	{
        email: { type: String, required: true, unique: true },
		name: { type: String, required: true, unique: true },
		passwd: { type: String, required: true }
	},
	{ collection: 'users' }
)

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model