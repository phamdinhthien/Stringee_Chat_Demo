
// Edit your script here
function getAccessToken() {
	var now = Math.floor(Date.now() / 1000);
	var exp = now + 30*86400;

	//var header = {cty: "stringee-api;v=1"};
	var payload = {
		jti: apiKeySid + "-" + now,
		iss: apiKeySid,
		exp: exp,
		userId: userId,
		userName: userName,
		avatar: avatar,
        rest_api: true
	};

	var jwt = require('jsonwebtoken'); 
	var token = jwt.sign(payload, apiKeySecret, {algorithm: 'HS256'})
	return token;
}
const apiKeySid = 'SKu9uo4qgPYeRXF22Ff2qbUX8IDZYnesP5';
const apiKeySecret = 'UTJ5Q055Z2x0NmM3ajNNd05pM1RIdDRMVFRURmpPaA==';

arr = [
{userId: "11", userName:"Phan Van A", avatar: "https://www.w3schools.com/howto/img_avatar2.png"},
{userId: "12", userName:"Le Thi B", avatar: "https://www.w3schools.com/w3images/avatar2.png"}
]
for(let i = 0; i < arr.length; i++){
	userId = arr[i].userId;
	userName = arr[i].userName;
	avatar = arr[i].avatar;
	var token = getAccessToken();
	console.log(token);
	console.log("---------------------------------------------------------------------------------------------------")
}
