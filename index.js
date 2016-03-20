var express = require('express');
var bodyParser = require('body-parser');
var sizeOf = require('image-size');
var uuid = require('uuid');
var path = require('path');
var formidable = require('express-formidable');
var multer  = require('multer');
var im = require('imagemagick');
var fs = require('fs');
var md5 = require('md5');

var app = express();
var projectDir = process.cwd();
var storageOfImages = path.join(projectDir, 'storageOfImages');
var tmp = path.join(projectDir, 'temp');

if (!fs.existsSync(tmp)) {
    fs.mkdirSync(tmp);
}

if (!fs.existsSync(storageOfImages)) {
    fs.mkdirSync(storageOfImages);
}


function createUserStorage (hash) {
	fs.mkdirSync( path.join(storageOfImages, hash) );
}

function getListOfDir (hash) {
	var pathToStorage = hash ? path.join(storageOfImages, hash) : storageOfImages;
    return fs.readdirSync(pathToStorage);
}

function getSizeImage (hash,  file) {
	var pathToImg = path.join(storageOfImages, hash, file);
	if (fs.existsSync(pathToImg)) {
	    return sizeOf( pathToImg );
	};
}




function apiVersion (req, res) {
	res.status(200);
	res.send({
		"status": true,
		"data": [],
		"message": "Image resizer API version: 1.0.0"
	});
}


function getKey (req, res) {
	var key = uuid.v4();
	var hashKey = md5(key);
	createUserStorage(hashKey);

	res.status(200);
	res.send({
		"status": true,
		"data": {
			"key": key
		},
		"message": null
	});
}

function checkKey (req, res, next) {
	var keys;
	var hash;
	var userKey = req.method === 'GET' ? req.query.key : req.body.key;
	var indexKey = -1;

	if (userKey) {
		keys = getListOfDir();
		hash = md5(userKey);
		indexKey = keys.indexOf(hash);
	}
	
	if (indexKey !== -1) return next();

	res.status(401);
	res.send({
	  "status": false,
	  "data": null,
	  "message": "Invalid key"
	});
}

function getUserImageList(req, res) {
	var key = req.query.key;
	var hash = md5(key);
	var images = getListOfDir(hash);
	images = images.filter(function (img) {
		return img.charAt(0) !== '.';
	});
	images = images.map(function (img) {
		var imgSize = getSizeImage(hash, img);
		return {
	  		"url": path.join('/images/', hash, img),
	  		"width": imgSize.width,
	  		"height": imgSize.height
	  	};
	});

	res.status(200);
	res.send({
	  "status": true,
	  "data": {
	  	"images": images
	  },
	  "message": null
	});
}

function resizeImage(req, res) {
	if (!req.files.image || !req.files.image.length) {
		res.status(400);
		res.send({
		  "status": false,
		  "data": null,
		  "message": "Required parameter is absent"
		});
		return;
	}

	var key = req.body.key;
	var hash = md5(key);
	var width = req.body.width;
	var height = req.body.height;
	var file = req.files.image[0];
	var imageName = file.originalname;
	var storagePath = path.join(storageOfImages, hash, imageName);
	var ext = path.extname(imageName);

	im.resize({
		format: ext,
		srcPath: file.path,
		dstPath: storagePath,
		width: width,
		height: height
	}, function(err, stdout, stderr) {
		if (err) {
			res.status(500);
			res.send({
				"status": false,
				"data": null,
				"message": 'Internal server error'
			});
			return;
		}
		
		fs.unlinkSync(file.path);
		
		res.status(201);
		res.send({
			"status": true,
			"data": {
				"link": path.join('/images', hash,  imageName)
			},
			"message": null
		});
	});
}



var storage = multer.diskStorage({
  destination: function (req, file, cb) {
	var hash = md5(req.body.key);
  	var fileToPath = path.join(storageOfImages, hash, file.originalname);
  	var isExists = fs.existsSync(fileToPath);
  	if (isExists) fs.unlinkSync(fileToPath);
    cb(null, tmp);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

var upload = multer({ storage: storage });

app.use(bodyParser());

app.get('/', apiVersion);

app.use('/images', express.static('storageOfImages'));

app.get('/key', getKey);

app.use(upload.fields([{ name: 'image', maxCount: 1 }]));

app.use(checkKey);

app.get('/images-list', getUserImageList);

app.post('/image-resize', resizeImage);

app.listen(3000);
