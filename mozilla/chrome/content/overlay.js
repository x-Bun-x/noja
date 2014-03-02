(function(){
'use strict';
//jQuery
var $;
var jQuery = $ = window.$.noConflict(true);

var Cc = Components.classes;
var Ci = Components.interfaces;
var Application = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
var SubscriptLoader=Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
var console = Application.console;

$(document).ready(function(){
	var button = $('#noja-button');
	var navBar = $('#nav-bar');
	//インストール時にアプリケーションページを開いてボタンを追加
	Application.getExtensions(function(extensions){
		var extension = extensions.get('{7B87A1A7-2920-4281-A6D9-08556503D3E5}');
		if (extension.firstRun) {
			gBrowser.selectedTab = gBrowser.addTab( 'chrome://noja/content/app/index.html');
			navBar.append(button).attr('currentset', navBar.prop('currentSet'));
			document.persist('nav-bar', 'currentset');
		}
	});
});

var directoryService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);

var getLocalDirectory = function() {
  var localDir = directoryService.get("ProfD", Ci.nsIFile);

  localDir.append("noja");

  if (!localDir.exists() || !localDir.isDirectory()) {
    localDir.create(Ci.nsIFile.DIRECTORY_TYPE, 508);
  }

  return localDir;
};

var subDirectory = function(dir, name) {
  dir.append(name);

  if (!dir.exists() || !dir.isDirectory()) {
    dir.create(Ci.nsIFile.DIRECTORY_TYPE, 508);
  }
  return dir;
};


//新しくウィンドウ（タブ）がロードされたら呼ばれる関数
var onLoad = function() {
	//appcontentが存在するならアプリケーション(Firefox)
	var appcontent = document.getElementById("appcontent");
	if(appcontent==null) return;
	appcontent.addEventListener("DOMContentLoaded", onPageLoad, true);
};

var token = '';

//ページ読み込みごとに呼ばれる関数
var onPageLoad = function(e) {
	var window = e.originalTarget.defaultView.wrappedJSObject;
	var document = window.document;
	//なろう、のくむん、アプリケーションページで動作
	// 定義を外部に出したいところだが、どうしよう？
	var reURLList = [
		/chrome:\/\/noja\/content\/app\/index\.html/,
		/http:\/\/(ncode|novel18)\.syosetu\.com\/n/,
		/http:\/\/www\.akatsuki-novels\.com\/stories\/view\/\d+\/novel_id~\d+/,
		/http:\/\/novel\.syosetu\.org\/\d+\/\d+\.html/
	];
	var matched = false;
	var url = document.URL;
	for (var i = 0; i < reURLList.length; ++i) {
		var re = reURLList[i];
		if (url.search(re) == 0) {
			matched = true;
			break;
		}
	}
	if (!matched) {
		return;
	}
//	if (document.URL.search(/http:\/\/(ncode|novel18)\.syosetu\.com\/n/) != 0
//		&& document.URL !== 'chrome://noja/content/app/index.html') {
//		return;
//	}
	loadSubScript('chrome://noja/content/scripts/jquery.js', window.content);
	loadSubScript('chrome://noja/content/scripts/jsrender.js', window.content);
	loadSubScript('chrome://noja/content/config.js', window.content);
	window.content.noja_option.loadSubContent = function(url) { return $.ajax({url:url, async:false}).responseText; }
	window.content.noja_option.save = function(db, data, key) {
		var escapeUnicode = function(str) {
		  return str.replace(/[^ -~]|\\/g, function(m0) {
			var code = m0.charCodeAt(0);
			return '\\u' + ((code < 0x10)? '000' : 
							(code < 0x100)? '00' :
							(code < 0x1000)? '0' : '') + code.toString(16);
		  });
		};
		var fs = getLocalDirectory();
		subDirectory(fs, db);
		if(typeof key==='undefined') key = data.ncode;
		fs.append(key+'.dat');
		if(!fs.exists() || fs.isDirectory()) {
			fs.create(Ci.nsIFile.NORMAL_FILE_TYPE, 508);
		}
		var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
		file.initWithPath(fs.path);
		var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
		var text = escapeUnicode(JSON.stringify(data));
		foStream.init(file, 0x02 | 0x08 | 0x20, 436, 0); // write, create, truncate
		foStream.write(text, text.length);
		foStream.close();
	};
	window.content.noja_option._load=function(db, key, callback) {
		var unescapeUnicode = function(str) {
		  return str.replace(/\\u([a-fA-F0-9]{4})/g, function(m0, m1) {
			return String.fromCharCode(parseInt(m1, 16));
		  });
		};
		var fs = getLocalDirectory();
		subDirectory(fs, db);
		if(typeof key==='undefined') key = data.ncode;
		fs.append(key+'.dat');
		if(!fs.exists() || fs.isDirectory()) {
			callback();
			return;
		}
		var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
		file.initWithPath(fs.path);
		var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
		istream.init(file, 0x01, 292, 0);
		setTimeout(function(){
			istream.QueryInterface(Components.interfaces.nsILineInputStream);
			var line = {}, text = '', hasmore;
			do {
			  hasmore = istream.readLine(line);
			  text+='\n'+line.value; 
			} while(hasmore);
			istream.close();
			callback(unescapeUnicode(text));
		}, 0);
	};
	window.content.noja_option.deleteItem = function(db, key) {
		var fs = getLocalDirectory();
		subDirectory(fs, db);
		if(typeof key==='undefined') key = data.ncode;
		fs.append(key+'.dat');
		if(!fs.exists()) return;
		var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
		file.initWithPath(fs.path);
		file.remove(true);
	};
	window.content.noja_option.setToken = function(t) {
		if(typeof t !== 'undefined') token = t;
	};
	window.content.noja_option.getToken = function(callback) {
		callback(token);
	};
	if(document.URL==='chrome://noja/content/app/index.html') {
		loadSubScript('chrome://noja/content/app_config.js', window.content);
		window.content.noja_option.localStorage = null;
	}
	else {
		window.content.noja_option.localStorage = window.localStorage;
		window.content.$('body').append('<link rel="stylesheet" href="resource://noja/styles/style.css">');
	}
	window.content.console.log = function(data){ console.log(data); };
	loadSubScript('chrome://noja/content/scripts/noja.js', window.content);
};

var loadSubScript=function(path, namespace) { SubscriptLoader.loadSubScript(path, namespace, 'utf-8'); };

window.addEventListener('load', onLoad, true);

$(document).ready(function(){
	$('#noja-button').bind('command', function(){
		gBrowser.selectedTab = gBrowser.addTab( 'chrome://noja/content/app/index.html');
	});
});

})();
