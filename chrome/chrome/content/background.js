
chrome.runtime.onInstalled.addListener(function(){
	chrome.tabs.create({url:'chrome/content/app/index.html'});
});

var token = '';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var req = window.webkitIndexedDB.open('noja', 1);
	req.onupgradeneeded = function(ev) {
		var db = this.result;
		console.log(ev, db, this);
		var global = db.createObjectStore('global', { autoIncrement: false });
		var ncode = db.createObjectStore('ncode', { keyPath:'ncode', autoIncrement: false });
		var saveData = db.createObjectStore('saveData', { keyPath:'ncode', autoIncrement: false });
	};
	switch(request.type) {
	case 'save':
		req.onsuccess = function(ev) {
			var db = this.result;
			var transaction  = db.transaction([request.db], 'readwrite');
			var store = transaction.objectStore(request.db);
			store.put(request.data, request.key);
		};
		break;
	case 'load':
		req.onsuccess = function(ev) {
			var db = this.result;
			var transaction  = db.transaction([request.db]);
			var store = transaction.objectStore(request.db);
			var req2 = store.get(request.key);
			req2.onsuccess = function(ev) {
				sendResponse({value:this.result});
			};
		};
		return true;
	case 'delete':
		req.onsuccess = function(ev) {
			var db = this.result;
			var transaction  = db.transaction([request.db], 'readwrite');
			var store = transaction.objectStore(request.db);
			var req2 = store.delete(request.key);
		};
	break;
	case 'token':
		if(typeof request.token === 'undefined') {
			sendResponse({value:token});
			return true;
		}
		else token = request.token;
	}
	return false;
});

chrome.browserAction.onClicked.addListener(function(tab){
	if(tab.url.search(/http:\/\/n(code|ovel18)\.syosetu\.com\/(n|N)/)==0) {
		chrome.tabs.create({url:'chrome/content/app/index.html'});
	}
	else {
		chrome.tabs.update(tab.id, {url:chrome.extension.getURL('chrome/content/app/index.html')});
	}
});
