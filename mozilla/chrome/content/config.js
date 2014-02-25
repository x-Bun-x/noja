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
	load:function(db, key, callback) {
		noja_option._load(db, key, function(result){
			if(typeof result === 'string') callback($.parseJSON(result));
			else callback();
		});
	}
};