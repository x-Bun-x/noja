var noja_option = {
	ajax_get_opt :'?of=ga&out=jsonp&callback=?&ncode=',
	ajax_data_type : 'json',
	loading1 : 'resource://noja/images/loading1.gif',
	loading2 : 'resource://noja/images/loading2.gif',
	twitter_banner : 'resource://noja/images/twitter_b.gif',
	noja_view_html : 'resource://noja/html/noja_view.html',
	hyouka_html : 'resource://noja/html/hyouka.html',
	hyoukanavi_html : 'resource://noja/html/hyoukanavi.html',
	kansou_html : 'resource://noja/html/kansou.html',

	// この関数はnoja.jsと同じcontextで実効されるので
	// noja側との間ではdefferedなI/Fは可能
	// overlay.js側の_loadとの間では無理なようなので
	// 素直にcallbackするしかない。
	load: function(db, key, callback) {
		// for deferred support
		var dfrd = new $.Deferred();
		if (callback !== undefined) {
			dfrd.done(callback);
		}
		// @@ 諦め
		//noja_option._load(db, key).done(function (result) {
		noja_option._load(db, key, function (result) {
			if (typeof result === 'string') {
				dfrd.resolve($.parseJSON(result));
			} else {
				dfrd.reject();
			}
		});
		return dfrd.promise();
	},
	// deffered化対応のためproxyとして
	// overlay.js側contextに中継する
	// 互換性のため、callbackのI/Fも残す
	getToken: function (callback) {
		// for deferred support
		var dfrd = new $.Deferred ();
		if (callback !== undefined) {
			dfrd.done (callback);
		}
		noja_option._getToken (function (token) {
			dfrd.resolve (token);
		});
		return dfrd.promise ();
	},
	// save
	// deleteItem
	// setToken
	// loadSubContent
	// はcallbackなしで同期実行のみなので
	// 特にproxyは不要
	// loadSubContentはasync=falseな$ajax()
};
