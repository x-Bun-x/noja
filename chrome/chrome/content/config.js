//オプションを定義するだけ。グローバルだけど……いいよね？
var noja_option = {
	ajax_get_opt :'?of=ga&out=json&ncode=',
	ajax_data_type : 'json',
	loading1 : chrome.extension.getURL('chrome/resource/images/loading1.gif'),
	loading2 : chrome.extension.getURL('chrome/resource/images/loading2.gif'),
	twitter_banner : chrome.extension.getURL('chrome/resource/images/twitter_b.gif'),
	noja_view_html : chrome.extension.getURL('chrome/resource/html/noja_view.html'),
	hyouka_html : chrome.extension.getURL('chrome/resource/html/hyouka.html'),
	hyoukanavi_html : chrome.extension.getURL('chrome/resource/html/hyoukanavi.html'),
	kansou_html : chrome.extension.getURL('chrome/resource/html/kansou.html'),
	appmode:false,
	loadSubContent: function(url){ return $.ajax({url:url, async:false}).responseText; },
	save:function(db, data, key) {
		chrome.runtime.sendMessage({type:'save', db:db, data:data, key:key});
	},
	load:function(db, key, callback) {
		chrome.runtime.sendMessage({type:'load', db:db, key:key}, function(response) {
			callback(response.value);
		});
	},
	deleteItem:function(db, key) {
		chrome.runtime.sendMessage({type:'delete', db:db, key:key});
	},
	setToken:function(token) {
		if(typeof token==='undefined') return;
		chrome.runtime.sendMessage({type:'token', token:token});
	},
	getToken:function(callback) {
		chrome.runtime.sendMessage({type:'token'}, function(response) {
			callback(response.value);
		});
	},
	localStorage:window.localStorage
};
