# image-resizer
API v1.0.0

# Get api key
GET /key

200 OK

{
	"status": true,
	"data": {
		"key": ""
	},
	"message": null
}

# Get list of images
GET /images-list?key

200 OK

{
  "status": true,
  "data": {
  	"images": [
	  	{
	  		"url": "",
	  		"width": "",
	  		"height": ""
	  	}
  	]
  },
  "message": null
}

# Resize upload image
POST /image-resize

params:
	@key 	- api key
	@width 	- new width of image
	@height - new height of image
	@image 	- image file

201 Created

{
  "status": true,
  "data": {
    "link": ""
    },
  "message": null
}

# Errors

400 Bad Request 

{
  "status": false,
  "data": null,
  "message": "Invalid parameters"
}


401 Unauthorized

{
  "status": false,
  "data": null,
  "message": "Invalid key"
}


500 Internal server error

{
  "status": false,
  "data": null,
  "message": 'Internal server error'
}