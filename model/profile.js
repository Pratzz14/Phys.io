const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema(
	{
        user_id: {type: String},
        email: { type: String },
		name: { type: String },
        fullname: {type: String , default: ''},
        phone: {type: String , default: ''},
        age: {type: Number , default: 0},
        weight: {type: Number , default: 0},
        height: {type: Number , default: 0},
        gender: {type:String , default: 'male'},
        Specify: {type: String , default: ''},
        pain_range: {
            neck: {type: Number , default: 0},
            shoulder: {type: Number , default: 0},
            elbow: {type: Number , default: 0},
            back: {type: Number , default: 0},
            knee: {type: Number , default: 0},
            ankle: {type: Number , default: 0}
        },
        profile_pic: {type: String , default: "https://physioprofile.s3.ap-south-1.amazonaws.com/bg-reg.png"}
		
	},
	{ collection: 'profiles' }
)

const model = mongoose.model('ProfileSchema', ProfileSchema)

module.exports = model