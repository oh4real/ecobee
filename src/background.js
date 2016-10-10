'use strict';
var timerId;
function getExtensionId() {
	return chrome.runtime.id;
}
function getClient() {
	return APP_KEYS[getExtensionId()];
}
function getAuthUrl() {
	return 'https://api.ecobee.com/authorize?response_type=code&client_id=' + getClient().id + '&scope=smartRead&redirect_uri=https://' + getExtensionId() + '.chromiumapp.org/provider_ec#';
}
function getInitialTokenUrl() {
	return 'https://api.ecobee.com/token?grant_type=authorization_code&redirect_uri=https://' + getExtensionId() + '.chromiumapp.org/provider_ec&client_id=' + getClient().id + '&code=';
}

function startRequest() {
	stopRequest();
	// instead of writing badgeTest as ? while processing, i'd like to rotate hte badge icon
	chrome.browserAction.setBadgeText({text:'?'});
	getStatus();
	timerId = window.setTimeout(startRequest, getClient().interval);
}

function stopRequest() {
	window.clearTimeout(timerId);
}

function getStatus() {
	if (localStorage.hasOwnProperty(TOKEN_NAMESPACE)) {
		var tokenData = JSON.parse(localStorage.getItem(TOKEN_NAMESPACE));
		/**
			Content-Type: application/json;charset=UTF-8
			Authorization: Bearer 9BwUG2zsmtjoxW83uUHg10YySwhiEow7
		*/
		var headers = {'Content-Type':'application/json;charset=UTF-8', 'Authorization':'Bearer ' + tokenData.access_token};
		var refreshUrl = 'https://api.ecobee.com/1/thermostat?json={"selection":{"includeAlerts":"true","selectionType":"registered","includeEvents":"false","includeSettings":"false","includeRuntime":"true","includeEquipmentStatus":"true"}}';
		$.ajax(refreshUrl, {'headers': headers}).then(loadBadge, refreshToken);
	} else {
		stopRequest();
		authorizeUser();
	}
}

function loadBadge(data) {
	var colorObj = {color:'#000'};
	// always grabs first thermostat, hopefully it's the one the user wants
	var thermostat = data.thermostatList[0];
	var status = heatCoolFilter(thermostat.equipmentStatus);
	switch(status.type) {
		case 'cool':
			colorObj.color = '#03f';
			break;
		case 'heat':
			colorObj.color = '#f71';
			break;
	}
	chrome.browserAction.setBadgeBackgroundColor(colorObj);
	chrome.browserAction.setBadgeText({text:(Math.round(thermostat.runtime.actualTemperature/10) + "")});
	chrome.browserAction.setTitle({'title':'Ecobee (v' + chrome.app.getDetails().version + ')\n' + new Date().toTimeString()});
}

function refreshToken() {
	var tokenData = JSON.parse(localStorage.getItem(TOKEN_NAMESPACE));
	if (tokenData.refresh_token.length) {
		// try to get new access token with refresh_token
		$.post('https://api.ecobee.com/token?grant_type=refresh_token&client_id=' + getClient().id + '&refresh_token=' + tokenData.refresh_token)
			.success(function(data){
				console.log("refreshToken: post.success()");
				localStorage.setItem(TOKEN_NAMESPACE, JSON.stringify(data));
				getStatus();
			})
			.fail(function(data){
				console.log("refreshToken: post.fail()", data);
				stopRequest();
				authorizeUser();
			});
	} else {
		// trigger get PIN and start that whole thing
		stopRequest();
		authorizeUser();
	}
}

function authorizeUser() {
	chrome.identity.launchWebAuthFlow(
		{'url': getAuthUrl(), 'interactive': true},
		function(responseUrl) {
			if (responseUrl && responseUrl.search('code=') >= 0) {
				// console.log(responseUrl);
				var code = responseUrl.substring(responseUrl.search('=') + 1);
				$.post(getInitialTokenUrl() + code)
					.success(function(data){
						console.log("authorizeUser: post.success()");
						localStorage.setItem(TOKEN_NAMESPACE, JSON.stringify(data));
						startRequest();
					})
					.fail(function(data){
						console.log("authorizeUser: post.fail()", data);
						stopRequest();
					});
			}
		}
	);
}

function heatCoolFilter(propertyString) {
	var insertObj = {type:''},
	running = propertyString.split(','),
	heating = ["heatPump", "heatPump2", "heatPump3", "auxHeat1", "auxHeat2", "auxHeat3"],
	cooling = ["compCool1", "compCool2"],
	arrayContains = function(needle, haystack) {
		var found = false;
		needle.forEach(function(element){
			if (haystack.indexOf(element) > -1) {
				found = true;
			}
		});
		return found;
	};
	return arrayContains(running, heating) && (insertObj.type = "heat"),
	arrayContains(running, cooling) && (insertObj.type = "cool"),
	insertObj;
}

chrome.browserAction.onClicked.addListener(function(){
	stopRequest();
	startRequest();
	chrome.tabs.query({url:"https://www.ecobee.com/*"}, function(result) {
		if (result.length === 0) {
			chrome.tabs.create({url: "https://www.ecobee.com/consumerportal/index.html"});
		} else {
			var tab = result.shift();
			chrome.tabs.update(tab.id, {selected: true});
		}
	});
});

startRequest();