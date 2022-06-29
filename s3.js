require("dotenv").config()
const S3 = require("aws-sdk/clients/s3")
const fs = require("fs")

const bucket_name = process.env.AWS_BUCKET_NAME
const bucket_region = process.env.AWS_BUCKET_REGION
const access_key = process.env.AWS_ACCESS_KEY
const secret_key = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region: bucket_region,
    accessKeyId: access_key,
    secretAccessKey: secret_key
})

//upload a file to s3
function uploadFile(file){
    const filestream = fs.createReadStream(file.path)
    
    const uploadParams = {
        Bucket: bucket_name,
        Body: filestream,
        Key: file.filename
    }

    return s3.upload(uploadParams).promise()
}
exports.uploadFile = uploadFile

//download a file from s3
function getFileStream(fileKey){

    const downloadParams = {
        Key: fileKey,
        Bucket: bucket_name
    }

    return s3.getObject(downloadParams).createReadStream()
}
exports.getFileStream = getFileStream

