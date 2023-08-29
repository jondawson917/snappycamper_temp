var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var dd = new AWS.DynamoDB();
var s3 = new AWS.S3();
var bucketName = 'my-bucket';

AWS.config.update({region:'us-west-1'});