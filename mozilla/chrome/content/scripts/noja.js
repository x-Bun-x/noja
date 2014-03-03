/*! のじゃー縦書リーダー ver.1.13.* (c) 2013 ◆TkfnIljons */
$(document).ready(function(){
	'use strict';

	//バージョンはアップデートの前に書き換えろよ！　絶対だかんな！
	var version = '1.13.901.2+p10+kai-p1';

	//なろうapiにアクセスするときのgetパラメータ
	var ajax_get_opt = noja_option.ajax_get_opt;
	//同データタイプ
	var ajax_data_type = noja_option.ajax_data_type;

	//リソースのURL

	//のじゃーのメインビュー
	// bodyにappendされるので普通にアクセスできる
	var noja_view_html = noja_option.noja_view_html;
	//評価フォーム
	// noja_view_htmlの中にappendされる
	var hyouka_html = noja_option.hyouka_html;
	//感想フォームの選択部分
	var hyoukanavi_html = noja_option.hyoukanavi_html;
	//感想・レビューフォーム
	var kansou_html = noja_option.kansou_html;
	//ツイッターのバナー
	var twitter_banner = noja_option.twitter_banner;
	//読み込み中アイコン小(ステータスバー用)
	var loading1 = noja_option.loading1;
	//読み込み中アイコン大(目次用)
	var loading2 = noja_option.loading2;
	
	//上記リソースを読み込む用関数。
	//実際はacync:falseで(ローカルにあるファイルだから
	// 同期しちゃって大丈夫)ajaxやってるだけなんだけど、
	//火狐版だとこのスクリプトからはクロスドメインできないんだよ……
	var lsc = noja_option.loadSubContent;

	var save = noja_option.save;
	var load = noja_option.load;
	var deleteItem = noja_option.deleteItem;
	
	//定数
	
	//ここらへんは変更できるようにするかも


	$.templates('canvasFontTmpl', '{{:fontWeight}} {{:fontSize}}px {{:fontFamily}}');

	//フォントのウェイト。大きく描いて縮小すると微妙に細くなるので太めに
	var fontWeight = 800;
	//メニュー項目などの小さいフォントのサイズ
	var fontSmall = '10.5pt';
	//ページナビゲーションの小さいフォントのサイズ
	var fontXSmall = '7pt';
	
	//ここからは不変
	
	//半角文字列の列挙
	var hankaku = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ｧｱｨｲｩｳｪｴｫｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂｯﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝﾞﾟ･';
	//１文字で縦中横の対象になる文字
	var tatechuyoko = '0123456789!?';
	//全角で回転の対象になる文字
	var zenkakukaiten = '―－－｜￣＿‐‥…＜＞≦≧＝≠≡∈∋⊆⊇⊂⊃（）「」｛｝《》〈〉『』【】［］〔〕〘〙〚〛～｜─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂≪≫←↑→↓〜⇒⇔≒：；';
	//行末禁則処理で調べる文字
	var gyoumatsukinsoku = '（「｛〈《『【［〔〘〚〝“‘';
	//行頭禁則処理のうち、追い出しをする文字
	var gyoutoukinsoku = '!?！？・：；:;‐-=＝〜～ゝゞーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎ\u3095\u3096\u31F0\u31F1\u31F2\u31F3\u31F4\u31F5\u31F6\u31F7\u31F8\u31F9\u31F7\u31FA\u31FB\u31FC\u31FD\u31FE\u31FF\u3005\u303B';
	//行頭禁則処理のうち、ぶら下げをする文字
	var burasage = '、。，．）」｝〉》』】］〕〙〛〟”’　';
	//表示位置を変更する小文字
	var komoji = 'ぃゃぃゃぉゅぁっぃょュゎァッィぅぇゥェォヵヶャョヮ\u3095\u3096\u31F0\u31F1\u31F2\u31F3\u31F4\u31F5\u31F6\u31F7\u31F8\u31F9\u31F7\u31FA\u31FB\u31FC\u31FD\u31FE\u31FF';
	//標準的な明朝体フォントの列挙
	var mincho = '"ＭＳ 明朝","MS Mincho","ヒラギノ明朝 ProN W3","Hiragino Mincho ProN","ヒラギノ明朝 Pro W3","Hiragino Mincho Pro","Takao明朝","TakaoMincho","IPA モナー 明朝","IPA mona Mincho","さざなみ明朝","Sazanami Mincho","IPA明朝","IPAMincho","東風明朝","kochi Mincho"';
	//標準的なゴシック体フォントの列挙
	var gothic = '"ＭＳ ゴシック","MS Gothic","ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","ヒラギノ角ゴ Pro W3","Hiragino Kaku Gothic Pro","Takaoゴシック","TakaoGothic","IPA モナー ゴシック","IPA mona ゴシック","VL ゴシック","VL Gothic","IPAゴシック","IPAGothic","Osaka－等幅","Osaka-Mono","東風ゴシック","Kochi Gothic"';
	//ダウンロードファイルにコメントで仕込むデータ。
	var download_id = '@noja{7B87A1A7-2920-4281-A6D9-08556503D3E5}';

	//プロパティ
	
	//フォントファミリ
	var fontFamily = mincho;
	//現在読んでいる話(第一話が1)
	var currentSection;
	//現在表示しているページ(ページ番号はこれ+1)
	var page = 0;
	//追加:1画面あたりのページ数(単ページ対応への布石)
	var pages_per_canvas = 2;
	//
	//なろうapiで取って来るgeneral_all_no。つまり全話数。
	//まあ目次読み込んだらいいって話もあるんだけど。
	var generalAllNo = null;
	//表示部分のサイズ。実際のサイズの2倍
	var size;
	//文字サイズ。デフォルトはページ縦幅/48
	var char_size;
	//ページナビゲーションのサムネイルの幅と高さ。横800固定。実際の表示サイズはこの1/5
	var thumb_size = {
		width:  800,
		height: 800 / Math.sqrt(2)
	};

	//ページナビゲーションのサムネイルの文字サイズ。
	var thumb_fontsize = thumb_size.height / 48;
	//ncode.syosetu.com(なろう)かnovel18.syosetu.com(のくむん)
	//またはダミーでnaroufav.wkeya.com(配布サイト)
	var site;
	//novelcom.syosetu.com(なろう)かnovelcom18.syosetu.com(のくむん)。またはダミーで（ｒｙ
	//感想・レビュー・評価のサイト
	var site2;
	//なろうAPIのURL
	var api;
	//のじゃーが起動しているか否かのフラグ
	var isOpen = false;
	//読み込み中にセットされるページとセクション番号。
	//読み込み前に保存した数が終了後と同じだったらそのまま新しく読み込んだ話にジャンプ
	//そうでなかったらユーザーの操作で移動したことになるため、ジャンプしない
	var nextPage = 0;
	var nextSection;
	//現在読み込まれている最大の話。最新話から前に戻る時にはgeneralAllNoを取得しなくても大丈夫なように。
	var maxSection;
	//現在のセクションの合計表示ページ数。
	var total;
	//ステータスバーを閉じるためにsetTimeoutした場合のID
	var timeoutID = null;
	//画像onLoad時にページナビゲーションを再描写するかどうか決めるために使う
	var loadSection;
	//メイン画面のコンテキスト。
	var context;
	//目次が読み込まれているかどうかのフラグ。ture:読み込まれている、false:読み込み失敗、null:読み込むな（短編）
	var isIndexPageAvailable;
	var INDEXPAGE_READY = true;
	var INDEXPAGE_NOTREADY = false;
	var INDEXPAGE_DISABLE = null;
	var INDEXPAGE_NOWLOADING = 0;

	var setIndexPageStatus = function (status) {
		isIndexPageAvailable = status;
	};
	var getIndexPageStatus = function () {
		return isIndexPageAvailable;
	};
	// 
	var setIndexPageReady = function () {
		setIndexPageStatus (INDEXPAGE_READY);
	};
	var setIndexPageNotReady = function () {
		setIndexPageStatus (INDEXPAGE_NOTREADY);
	};
	var setIndexPageDisabled = function () {
		setIndexPageStatus (INDEXPAGE_DISABLE);
	};
	var isIndexPageReady = function () {
		return getIndexPageStatus() === INDEXPAGE_READY;
	};
	var isIndexPageNotReady = function () {
		return getIndexPageStatus() === INDEXPAGE_NOTREADY;
	};
	var isIndexPageDisable = function () {
		return getIndexPageStatus() === INDEXPAGE_DISABLE;
	};

	//データ

	//話データの配列。
	var sections = [];
	//nコード
	var ncode;
	//novelcom.～の方に使うnコード
	var ncode2 = null;
	//小説タイトル
	var title;
	//作者
	var auther;
	//章タイトル
	var chapter_title;
	//サブタイトル
	var subtitle;
	//本文と前書きと後書きをパースしたデータ
	// このあたりはどうしよう？
	// section objectにすべきだなあ
	var honbun;
	var maegaki;
	var atogaki;
	//文字色
	var color = $('#novel_color').css('color');
	//背景色
	var bgColor = $('body').css('background-color');
	//背景画像
	var bgImage;
	//セキュリティトークン
	var token = '';
	//ログインしているかどうかのフラグ
	var login = false;
	//読み込み中フラグ
	var loading = 0;

	//設定
	
	var setting = {};
	//フォントタイプ('mincho'|'gothic')
	var fontType;
	//前書き、後書きのレイアウト（枠線を付けるか否か）
	var layout;
	//ページ読み込み直後に開くかどうか
	var alwaysOpen;
	//累計ページ数を表示するかどうか
	var allpage;
	//ページあたりの行数
	var line_num;
	//行あたりの文字数
	var char_num;
	//文字サイズ設定スライドバーの位置
	var slidePos;
	//せっかく取ってきたデータだし、ページに埋め込もうぜ、と
	var autoPage = false;
	//縦書リーダーなのに横書で読みたいという酔狂な人のために
	var yokogaki = true;

	//関数

	//現在のページを更新する
	var showPage;
	//渡されたデータを描画
	var drawPage;
	//渡された文字列の文字幅を.5刻みで取得
	var getCol_for_ruby_yokogaki;
	var getCol_for_ruby_tategaki;
	//ページの生HTMLデータを分割して返す
	var splitPage;
	//後書きと前書き用バージョン
	var splitPageEx;
	//指定話の指定ページにジャンプ
	var jumpTo;
	//ステータスバーにメッセージを送る。HTML使用可。
	var showStatusMessage;
	//初期化
	var initialize;
	//前ページ読み込み
	var loadPrev;
	//次ページ読み込み
	var loadNext;
	//ページナビゲーションを更新する
	var updateNavigation;
	//画面リサイズ時に呼ばれる
	var onResize;
	//のじゃーを起動する
	var nojaOpen;
	//のじゃーを閉じる
	var nojaClose;
	//ポップアップを全て閉じる
	var closePopup;
	//指定したIDのポップアップをトグルする。それ以外は全て閉じる
	var togglePopup;
	//ポップアップが表示されているかどうか調べる
	var isPopup;
	//ダウンロードデータの作成
	var createSaveData;
	//ファイルからデータを読み込む
	var nojaImport;
	//現在読み込んだ部分をデータベースに保存する。
	var nojaSave;
	var nojaRestore;
	var nojaDelete;
	//存在するかどうかのチェック
	var valid;
	//AutoPagerizeとかAutoPatchworkとかそれ系の動きをするアレ
	var autoPagerize;
	//データ全体の再構築
	var reMake;
	//目次の読み込み
	var loadIndex;

	var siteParser;


	//////////////////////////////////////////////////////////////////////
	//こっから関数の実体定義
	valid = function(x) { return typeof x !=='undefined'; }

	var getObj = function (selector, ctx, default_value) {
		default_value = (default_value === undefined) ? null : default_value;
		var obj = $(selector, ctx);
		return (obj.size()) ? obj : default_value;
	}
	var getHtml = function (selector, ctx, default_value) {
		default_value = (default_value === undefined) ? null : default_value;
		var obj = $(selector, ctx);
		return (obj.size()) ? obj.html() : default_value;
	}
	var getText = function (selector, ctx, default_value) {
		default_value = (default_value === undefined) ? '' : default_value;
		var obj = $(selector, ctx);
		return (obj.size()) ? obj.text() : default_value;
	}

	//////////////////////////////////////////////////////////////////////
	// そのうちSite定義側に吸収する予定
	// '{{:site2}}novelpoint/register/ncode/{{:ncode2}}/'
	var getNovelPointRegisterURL = function () {
		return site2+'novelpoint/register/ncode/'+ncode2+'/';
	}
	// '{{:site2}}impression/confirm/ncode/{{:ncode2}}/'
	var getImpressionConfirmURL = function () {
		return site2+'impression/confirm/ncode/'+ncode2+'/';
	}
	// '{{:site2}}impression/list/ncode/{{:ncode2}}/'
	var getImpressionListURL = function () {
		return site2+'impression/list/ncode/'+ncode2+'/';
	}
	// '{{:site2}}novelreview/list/ncode/{{:ncode2}}/'
	var getNovelReviewListURL = function () {
		return site2+'novelreview/list/ncode/'+ncode2+'/'
	}
	var getNovelReviewConfirmURL = function () {
		return site2+'novelreview/confirm/ncode/'+ncode2+'/';
	}
	var getNovelViewInfotopURL = function () {
		return site+'novelview/infotop/ncode/'+ncode+'/';
	}
	var getNovelBaseURL = function (section) {
		return site+ncode+'/';
	}
	var getNovelSectionURL = function (section) {
		return site+ncode+'/'+section+'/';
	}

	//////////////////////////////////////////////////////////////////////
	function AppModeSite(url) {
		this.siteName = AppModeSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = false;

		// 
		currentSection = 1;
		page = 0;
		site = 'http://naroufav.wkeya.com/noja/';
		site2 = 'http://naroufav.wkeya.com/noja/';
	};
	// AppModeSite.prototype = {
	//	method_A: function () {}, 
	//	method_B: function () {}, 
	// }
	AppModeSite.siteName = 'アプリモード';
	AppModeSite.isSupportedURL = function (url) {
		return (url === 'chrome://noja/content/app/index.html');
	}
	//////////
	function NarouSite(url) {
		this.siteName = NarouSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = true;	// @@ ここをfalseにする @@

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		site = 'http://ncode.syosetu.com/';
		api = 'http://api.syosetu.com/novelapi/api/';
		site2 = 'http://novelcom.syosetu.com/'
		url.match(/http:\/\/ncode.syosetu.com\/([nN][^\/]*)\/([0-9]*)/);
		ncode = RegExp.$1.toLowerCase();
		// 短編のときは$2が空になるはず(=0)
		currentSection = parseInt(RegExp.$2);
	};
	NarouSite.siteName = '小説家になろう';
	NarouSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/ncode\.syosetu\.com\/[nN]/
		) == 0);
	}


	//////////
	function NocMoonSite(url) {
		this.siteName = NocMoonSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = true;	// @@ ここをfalseにする @@

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		site = 'http://novel18.syosetu.com/';
		api = 'http://api.syosetu.com/novel18api/api/';
		site2 = 'http://novelcom18.syosetu.com/'
		url.match(/http:\/\/novel18.syosetu.com\/([nN][^\/]*)\/([0-9]*)/);
		ncode = RegExp.$1.toLowerCase();
		// 短編のときは$2が空になるはず(=0)
		currentSection = parseInt(RegExp.$2);

	}
	NocMoonSite.siteName = 'ノクターン・ムーンライト';
	NocMoonSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/novel18\.syosetu\.com\/n/
		) == 0);
	}
	//////////
	function AkatsukiSite(url) {
		this.siteName = AkatsukiSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = false;

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		site = 'about:blank';
		api = 'about:blank/';
		site2 = 'about:blank/'
		ncode = 'akatsuki_xxx';
		// 短編のときは$2が空になるはず(=0)
		currentSection = 1;

	}
	AkatsukiSite.siteName = '暁';
	AkatsukiSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/www\.akatsuki-novels\.com\/stories\/view\/\d+\/novel_id~\d+/
		) == 0);
	}
	//////////
	function HamelnSite(url) {
		this.siteName = HamelnSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = false;

		site = 'about:blank';
		api = 'about:blank/';
		site2 = 'about:blank/'
		ncode = 'hameln_xxx';
		// 短編のときは$2が空になるはず(=0)
		currentSection = 1;
	}
	HamelnSite.siteName = 'ハーメルン';
	HamelnSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/novel\.syosetu\.org\/\d+\/\d+\.html/
		) == 0);
	}
	//////////
	var siteParserList = [
		AppModeSite,
		NarouSite,
		NocMoonSite,
		AkatsukiSite,
		HamelnSite
	];


	AkatsukiSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? currentSection : section_no;
		return '';
	};
	AkatsukiSite.prototype.changeSection = function(section_no) {
		// formatは分かっているものの…
		// しおり自体の構成が動的に変動するので扱いが微妙
		// とりあえず落ちないようにする対策のみ
		// ここに来る条件が少し不明なり
		console.debug('Akatsuki change section');
		//$('#noja_shiori').attr('href', this.getShioriURL(section_no));
	}
	AkatsukiSite.prototype.setupLinkMenu = function (linkmenu) {
	}


	//////////////////////////////////////////////////////
	HamelnSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? currentSection : section_no;
		return '';
	};
	HamelnSite.prototype.changeSection = function(section_no) {
		// formatは分かっているものの…
		// しおり自体の構成が動的に変動するので扱いが微妙
		// とりあえず落ちないようにする対策のみ
		// ここに来る条件が少し不明なり
		console.debug('Hameln change section');
		//$('#noja_shiori').attr('href', this.getShioriURL(section_no));
	}
	HamelnSite.prototype.setupLinkMenu = function (linkmenu) {
	}



	//////////////////////////////////////////////////////
	$.templates('narouShioriURLTmpl'
		, 'http://syosetu.com/bookmarker/add/ncode/{{:ncode2}}/no/{{:section_no}}/?token={{:token}}');

	NarouSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? currentSection : section_no;
		return $.render.narouShioriURLTmpl({
			ncode2: ncode2,
			section_no: section_no,
			token: token
		});
	};
	NarouSite.prototype.changeSection = function(section_no) {
		$('#noja_shiori').attr('href', this.getShioriURL(section_no));
	}
	// 元の構造はnoja_view.html側で定義されている
	NarouSite.prototype.setupLinkMenu = function (linkmenu) {
		var a = linkmenu.find('a');
		a.eq(1).attr('href', login
				? 'http://syosetu.com/user/top/'
				: 'http://syosetu.com/login/input'
			).text(login ? 'マイページ' : 'ログイン');
		a.eq(2).attr('href', getNovelViewInfotopURL());
		a.eq(3).attr('href', getImpressionListURL());
		a.eq(4).attr('href', getNovelReviewListURL());

		// '#noja_shiori'部分は読み込み時に更新する
		if (login) {
			linkmenu.append(
				'<div><img src="http://static.syosetu.com/view/images/bookmarker.gif" alt="しおり"><a id="noja_shiori" href="'+this.getShioriURL()+'" target="_blank">しおりを挿む</a></div>'
			);
			// 登録済のときは単なるtextで未登録のときはa付のリンクになっている
			// @@ TODO @@ お気に入り解除のBoomarklet機能をimportするか？
			linkmenu.append(
				'<div>'+$('#head_nav > li:contains("登録")').html()+'</div>'
			);
		}
		// img tagそのものを引っ張ってくるのにhtml()が使えないので
		// 要素としてつける
		// @@ TODO @@ clone後のidの変更対応
		// のじゃー→オリジナル画面で挿絵モード変更→のじゃーのときの状態反映
		linkmenu.append($('<div>').append($("#sasieflag").clone()));
	}


	//////////////////////////////////////////////////////
	$.templates('nocMoonShioriURLTmpl'
		, 'http://syosetu.com/bookmarker/add/ncode/{{:ncode2}}/no/{{:section_no}}/?token={{:token}}');
	NocMoonSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? currentSection : section_no;
		return $.render.nocMoonShioriURLTmpl({
			ncode2: ncode2,
			section_no: section_no,
			token: token
		});
	};
	NocMoonSite.prototype.changeSection = function(section_no) {
		// formatは分かっているものの…
		// しおり自体の構成が動的に変動するので扱いが微妙
		// とりあえず落ちないようにする対策のみ
		// ここに来る条件が少し不明なり
		console.debug('shiori parameter change @@ TODO @@');
		if (false) {
			$('#noja_shiori').attr('href', this.getShioriURL(section_no));
		}
	}

	NocMoonSite.prototype.setupLinkMenu = function (linkmenu) {
		var a = linkmenu.find('a');
		a.eq(1).attr('href', login
			? 'http://syosetu.com/user/top/'
			: 'http://syosetu.com/login/input'
		).text(login ? 'マイページ' : 'ログイン');
		a.eq(2).attr('href', getNovelViewInfotopURL());
		a.eq(3).attr('href', getImpressionListURL());
		a.eq(4).attr('href', getNovelReviewListURL());

		// 元はa:eq(4)の兄弟要素としてafter()で入れていたが
		// 階層的に変な気がするのでflatに入れるように変更
		// しおりとお気に入り登録部分
		// @@TODO@@ のくむんでは個別対応が必要
		// しおり:表示自体は行われているが機能として正しいか不明
		// お気に入り:元ページから拾えずundefined状態
		// のじゃー内でsection移動しても再構成されない
		// booklist登録有無は問題なし
		// なろうの場合はしおりはグローバルなので既取得情報から得るurlの一部変更でOk
		// のくむんの場合は各話なのとしおりページornotでbookmark_nowかどうか変化する
		// そのあたりを対応しないといけない
		if (login) {
			// bookmark&しおりは#bkm内で一連の状態なのでそのままcopyしてしまう
			// 普通にappendすると移動になるのでcloneする
			// 多分'#bkm'を指定してscriptが動くことはないと思うが
			// 一応idを付け替えておく
			// @@ TODO @@
			//  '#bkm > img'のサイズをどうするか？
			// @@ TODO @@
			//  しおりの左のイメージはどうもcssでbackground指定でつけてるようだ
			// 一度挟んだしおりは位置は動かせるが削除はできない模様
			linkmenu.append(
				$('<div>').append(
					$('#bkm').clone().attr('id','noja_bkm')
				)
			);
		}
		// img tagそのものを引っ張ってくるのにhtml()が使えないので
		// 要素としてつける
		// @@ TODO @@ clone後のidの変更対応
		// のじゃー→オリジナル画面で挿絵モード変更→のじゃーのときの状態反映
		linkmenu.append($('<div>').append($("#sasieflag").clone()));
	}


	//////////////////////////////////////////////////////////////////////
	// 単ページ対応:切り上げ
	var getPagesAlinedCanvas = function (npages) {
		var rem = npages % pages_per_canvas;
		if (rem != 0) {
			npages += (pages_per_canvas - rem);
		}
		return npages;
	}
	// 偶数ページ化(右ページ):切り捨て
	var getFirstPageAlinedCanvas = function (page_no) {
		return page_no - (page_no % pages_per_canvas);
	}

	var isLastPageInSection = function (page) {
		return (page >= (total + (total % pages_per_canvas) - pages_per_canvas));
	}

	// 関数にするまでもないのだがベタに文字列比較するコードが
	// 頻発するは気持ちが悪いので…
	// (本来もう少し上の階層で定義すべきultility functionなのだが…)
	var is_site_novel18 = function () {
		return (site.indexOf('http://novel18') >= 0);
	};




	// css font propsと同じ形式らしい
	// 1.font-style, font-variant, font-weight (順不同)
	// 2.font-size
	// 3.line-height	("/150%"みたいな"/"で区切る形式)
	// 4.font-familly
	// とりあえずnormal用途だと3指定
	// たまにweightなしのものがある
	// なにかjQueryのidiom的にいいものがあるのかもしれないが…
	var get_canvas_font = function (font_size, font_weight) {
		font_weight = (font_weight === undefined) ? fontWeight : font_weight;
		if (font_weight == null) {
			font_weight = '';
		}
		return $.render.canvasFontTmpl({
			fontWeight: font_weight,
			fontSize: font_size,
			fontFamily: fontFamily
		});
	}

	var get_thumb_font = function () {
		return get_canvas_font (thumb_fontsize);
	}

	// サムネ画面を作る
	var drawThumbPage = function (page) {
		// '#noja_pages #noja_page_${page}'は右スライダー？
		var ctx = $('#noja_page_'+page).get(0).getContext('2d');
		ctx.font = get_thumb_font();
		drawPage(ctx
			, thumb_fontsize
			, thumb_size
			, page
			, thumb_size.width / size.width);
	};


	var is_beginning_of_halfwidth_string = function (text, pos) {
		return (pos == 0 || hankaku.indexOf(text[pos - 1]) < 0);
	};
	// "([0-9!?]{2})"
	var is_hankaku_lr_tb_string = function (s) {
		for (var i = 0; i < s.length; ++i) {
			if (tatechuyoko.indexOf(s[i]) < 0) {
				return false;
			}
		}
		return true;
	};
	// "([0-9!?]{2})|([0-9][.,])"
	var hankaku_narrow_width = '.,';
	var hankaku_number = '0123456789';

	var is_hankaku_lr_tb_string_ex = function (s) {
		if (is_hankaku_lr_tb_string(s)) {
			return true;
		}
		if (s.length != 2) {
			return false;
		}
		if (hankaku_number.indexOf(s[0]) >= 0
			&& hankaku_narrow_width.indexOf(s[1]) >= 0) {
			return true;
		}
		return false;
	};

	// utilities for halfwidth lr-tb
	var get_halfwidth_string = function (text, pos) {
		var idx = pos;
		while (hankaku.indexOf(text[idx]) >= 0) {
			if (++idx == text.length) {
				break;
			}
		}
		return text.slice(pos,idx);
	};

	var get_hankaku_lr_tb_string = function (text, pos) {
		if (is_beginning_of_halfwidth_string(text, pos)) {
			var s = get_halfwidth_string(text, pos);
			if (s.length == 2 && is_hankaku_lr_tb_string_ex(s)) {
				return s;
			} else if (s.length == 1 && is_hankaku_lr_tb_string(s)) {
				return s;
			}
		}
		return '';
	}

	////////////////////////////////////////////////////////
	// ルビ用の幅数え
	getCol_for_ruby_yokogaki = function(text) {
		var col = 0;
		for (var i = 0; i < text.length; ++i) {
			if (hankaku.indexOf (text[i]) >= 0) {
				col+=0.5;
			} else if (i==0 || '゛゜\u3099\u309A'.indexOf(text[i])<0) {
				++col;
			}
		}
		return col;
	}
	getCol_for_ruby_tategaki = function(text) {
		var col = 0;
		for (var i = 0; i < text.length; ++i) {
			if (hankaku.indexOf (text[i]) >= 0) {
				if ((i==0||hankaku.indexOf(text[i-1])<0)&&
					tatechuyoko.indexOf(text[i])>=0&&
					(i+1==text.length||hankaku.indexOf(text[i-1])<0)) {
					++col;
				} else {
					col+=0.5;
				}
			} else if (i==0 || '゛゜\u3099\u309A'.indexOf(text[i])<0) {
				++col;
			}
		}
		return col;
	}
	////////////////////////////////////////////////////////
	splitPage = function(text, line_num, char_num, space) {
		/*
			パース規則
			40col/行; 17行/ページ
			全角文字は1col、半角文字は0.5colとする
			１・２桁の半角数値及び半角の感嘆符・疑問符(!?)は縦中横とする。（一文字でも二文字でも1col）
			濁点、半濁点は前の文字に重ねて描画する（行頭に来ない限り0col）
			禁則文字
			'!?！？・：；:;‐-=＝〜～ゝゞーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇷ゚ㇺㇻㇼㇽㇾㇿ々〻'
			の前の文字は、追い出しを行う。
			'、。，．）」｝〉》』】］〕〙〛〟”’'
			は、ぶら下げを行う。
			'（「｛〈《『【［〔〘〚〝“‘'
			は、追い出しを行う
		*/
		if (space==null) space=4;
		text = text.replace(/\r|\n/g, '');
		var arr = [];
		var ruby = [];
		var pos = 0;
		var line = space;
		var col = 0;
		var len = text.length;
		var pageData = [];
		var rb = [];
		while(space--) {
			pageData.push('');
			rb.push([]);
		}
		var ln = '';
		var r = [];
		var del = true;
		var newLine = function() {
			if(setting.kaigyou) {
				if(ln==='') {
					if(del) {
						del = false;
						return;
					}
					else del = true;
				}
				else del = true;
			}
			++line;
			col=0;
			pageData.push(ln);
			rb.push(r);
			ln='';
			r=[];
		};
		var getCol_for_ruby = (yokogaki)
			? getCol_for_ruby_yokogaki : getCol_for_ruby_tategaki;
		while(true) {
			while(true) {
				var ch  =text[pos];
				var p = pos+1;
				switch(ch) {
				case '<':
					++pos;
					if (text[pos]=='b') {
						while (text[pos++] != '>') {
							;
						}
						newLine();
					} else if(text[pos]=='r') {
						// html5で除外された'<rb>'タグに頼るのはあまりよくないが
						// 真面目にするとなると'<rp>'を抜いて…等手間が多いので
						// TODOとしてpending
						p = text.indexOf('</ruby>', pos)+7;
						var tt = $(text.substr(pos-1, p-pos-1));
						var b = $('rb', tt).text();
						var l = getCol_for_ruby(b);
						if(col+l>char_num) newLine();
						ln+=b;
						var t = $('rt', tt).text();
						// テンポラリ修正:ルビ内半角数字→全角数字
						// t = t.replace(/[0-9]/g, function(s) {
						// 	return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
						// });
						pos=p;
						r.push([col, l, t]);
						col+=l;
					} else if (text[pos] == 'i') {
						p = text.indexOf('>', pos)+1;
						var tt = $(text.slice(pos-1, p));	// <img>タグ全体
						var s = $(tt).attr('src');
						if (s == null) {
							// src指定がないならtag skip
							pos = p;
						} else {
							// 画像は改ページ？
							// 処理開始前に諸々flush等
							newLine();
							arr.push(pageData);
							ruby.push(rb);
							pos = p;
							// 画像src(@みてみん)のリンクを修正
							// これはなろう固有の話
							s = s.replace('viewimagebig', 'viewimage');
							(function(){
								var section = loadSection;	// parse中のコンテンツのsection
								// 対応済のはずだが未確認
								var p = getFirstPageAlinedCanvas(arr.length);
								arr.push($('<img>').attr('src', s)
									.bind('load', function() {
										// 実際に表示しようとしたload時のhook
										if (currentSection == section) {
											if (page == p) {
												// contextエリア描画がトリガー
												showPage();
											} else {
												// jump sliderページの表示がトリガー
												drawThumbPage (p);
											}
										}
									}).get(0)
								);
							})();
							ruby.push([]);
							line = 0;
							col = 0;
							pageData = [];
							rb = [];
						}
					} else {
						while (text[pos++]!='>') {
							;
						}
					}
					break;
				case '゛':
				case '゜':
				case '\u3099':	// 単独濁点
				case '\u309A':	// 単独半濁点
						var target;
						if(ln==='') {
							if(pageData.length==0) {
								var target = arr[arr.length-1];
								target[target.length-1]+=text[pos];
							}
							else {
								pageData[pageData.length-1]+=text[pos];
							}
						}
						else {
							ln+=text[pos];;
						}
						++pos;
						break;
				case '&':
						while(text[p++]!=';');
						ch = $('<span>'+text.substr(pos, p-pos)+'</span>').text();
				default:
					if (hankaku.indexOf(ch) >= 0){
						if((ln==''||hankaku.indexOf(text[pos-1])<0||text[pos-1]=='>')&&
							tatechuyoko.indexOf(ch)>=0&&
							(p>=text.length||text[p]=='<'||hankaku.indexOf(text[p])<0)) {
							++col;
						}
						else col+=.5;
					}
					else {
						++col;
					}
					var _pos = pos;
					pos=p;
					if(col>=char_num-1&&gyoumatsukinsoku.indexOf(text[pos])>=0) {
						ln+=ch;
						newLine();
					}
					else if(col>=char_num-.5) {
						if(burasage.indexOf(text[pos])>=0) {
							ln+=ch+text[pos];
							++pos;
						}
						else if(gyoutoukinsoku.indexOf(text[pos])>=0) {
							pos=_pos;
						}
						else {
							ln+=ch;
						}
						if(text[pos]!=='<') newLine();
					}
					else ln+=ch;
				}
				if(pos>=len) {
					newLine();
					break;
				}
				if(pos>=len||line>=line_num) break;
			}
			arr.push(pageData);
			ruby.push(rb);
			if(pos>=len) break;
			line = 0;
			col = 0;
			pageData = [];
			rb = [];
		}
		var _a = arr[arr.length-1];
		var flag = true;
		for(var i = 0; i < _a.length; ++i) {
			if(_a[i]!=='') {
				flag = false;
			}
		}
		if(flag) {
			arr.pop();
			ruby.pop();
		}
		return [arr, ruby];
	};
	// まえがき後書き用(レイアウト時に字下げするため文字数を減らす)
	splitPageEx = function(text, line_num, char_num, space) {
		if (text == null) {
			return null;
		}
		// レイアウトするときは
		if (layout) {
			return splitPage(text, line_num, char_num - 2, space);
		} else {
			return splitPage(text, line_num, char_num, space);
		}
	}
	////////////////////////////////////////////////////////
	showStatusMessage =function(text) {
		$('#noja_status').html(text).show();
		if (timeoutID != null) {
			clearTimeout(timeoutID);
		}
		timeoutID = setTimeout(
			function() { $('#noja_status').hide(100); }
			, 3000
		);
	};
	//ステータスバーに読み込み中を通知する。
	$.templates('statusBarLoadingTmpl', '<img src="{{:src}}">読み込み中...');
	var showStatusMessageLoading = function () {
		$('#noja_status').html($.render.statusBarLoadingTmpl({src: loading1})).show(100);
	}

	////////////////////////////////////////////////////////
	$.templates('downloadSectionTmpl', '#noja_download_section_template');
	$.templates('dataNojaSectionTmpl', '#noja_data_noja_section_template');
	autoPagerize = function(sec, num) {
		if (noja_option.appmode) {
			var divs = $('#noja_download_file_main > div');
			var prev = null;
			for (var i = 0; i < divs.size(); ++i) {
				var div = divs.eq(i);
				var j = div.attr('id').match(/noja_download_section_(.*)/)[1];
				if (j >= num) {
					break;
				} else {
					prev = div;
				}
			}
			// {section_no: no, sec: sec}にしたほうがいいのかも？
			var div = $.render.downloadSectionTmpl($.extend({section_no: num}, sec));
			if (prev === null) {
				$('#noja_download_file_main').prepend(div);
			} else {
				prev.after(div);
			}
		} else if (autoPage) {
			var prev = null;
			for (var i = 1; i < num; ++i) {
				var div = $('div[data-noja="'+i+'"]:last');
				if (div.size()) {
					prev = div;
				}
			}
			var c = $.render.dataNojaSectionTmpl($.extend({section_no: num}, sec));
			if (prev === null) {
				$('div.novel_pn:first').after('<hr>').after(c.children());
			} else {
				prev.after(c.children()).after('<hr>');
			}
		}
	};

	////////////////////////////////////////////////////////
	// 文章領域のページ数を計算する
	// 一部checkを_maegaki名護raw側でしている部分もあったが
	var countPages = function (section) {
		var nPages = sections[section].honbun[0].length;
		if (sections[section].maegaki != null && setting.fMaegaki) {
			nPages += sections[section].maegaki[0].length;
		}
		if (sections[section].atogaki != null && setting.fAtogaki) {
			nPages += sections[section].atogaki[0].length;
		}
		return nPages;
	};
	// アライメント補正はなし
	// 数える対象はグローバル変数に入ったもの
	var countPagesInCurrentSection = function () {
		var nPages = honbun[0].length;
		if (maegaki != null && setting.fMaegaki) {
			nPages += maegaki[0].length;
		}
		if (atogaki != null && setting.fAtogaki) {
			nPages += atogaki[0].length;
		}
		return nPages;
	}
	////////////////////////////////////////////////////////
	// 指定section範囲のページ数を計算
	var countPagesInSections = function (beginSection, endSection) {
		beginSection = (beginSection === undefined) ? 1 : beginSection;
		endSection   = (endSection   === undefined) ? currentSection : endSection;
		var nPages = 0;
		for (var i = beginSection; i < endSection; ++i) {
			if (!(i in sections) || sections[i] === false) {
				return null;
			}
			var n = countPages(i);	// checkを_maegaki側でしていたようだがまあいいか
			// キャンバス内ページ数可変対応済
			nPages += getPagesAlinedCanvas(n);
		}
		return nPages;
	};



	////////////////////////////////////////////////////////
	var setupCurrentSectionInfo = function (section) {
		currentSection = section;
		chapter_title = sections[currentSection].chapter_title;
		subtitle = sections[currentSection].subtitle;
		maegaki = sections[currentSection].maegaki;
		atogaki = sections[currentSection].atogaki;
		honbun = sections[currentSection].honbun;
	}



	////////////////////////////////////////////////////////
	// oneshotしか使ってないが保守性向上のため類似部分の近くに分離
	//$(document.documentElement)でcontextを作ってそれでparseを共通化したほうがいい
	// 1: min checking
	// 2: color関連
	// 3: title,auther関連
	// 4: subtitle等section情報
	// token,ncodeはsection側の話？
	// bookにglobalなものはthis側に持つ
	// tokenはpage固有っぽいからglobal state?
	// 栞関連の一部もそうか？
	// section,autherはhtml parser側と共通だがその他は独自
	NarouSite.prototype.parseInitialPage = function () {
		if (!$('#novel_honbun').size()) {
			return false;
		}
		bgImage = $('body').css('background-image');
		if (bgImage === 'none' || bgImage === '') {
			bgImage = null;
		} else {
			bgImage = $('<img />')
				.attr('src', bgImage.match(/^url\((.*)\)$/)[1])
				.bind('load', function(){showPage();})
				.get(0);
			bgColor = '#FFFFFF';
		}

		var section_data = {};
		// ここの判定はなんとか変更したいところ
		// タイトル関連
		title = $('.contents1 >a:eq(0)').not('a[href="http://syosetu.com"]').text();
		// 旧構造: ".subtitle > .chapter_title"
		section_data.chapter_title = $('.chapter_title');	// 変更なしだがsubtitle分離不要
		section_data.subtitle = $('.novel_subtitle');	// 変更なしだがsubtitle分離不要

		// 短編かどうかの判断はtitleが取れたかどうかで行う
		// title関連の調整とtoken取得等
		if (title == '') {
			// 短編
			title = $('.novel_title').text();	// 先頭改行削除不要
			section_data.subtitle = title;
			section_data.chapter_title = '';
			currentSection = 1;
			setIndexPageDisabled ();
			generalAllNo = 1;
			token = $('div.novel_writername > a[href^="http://syosetu.com/bookmarker/add/ncode/"]');
			if (token.size()) {
				login = true;
				token = token.attr('href').match(/=([0-9a-f]*)$/)[1];
			} else {
				login = false;
				token = null;
			}
			auther = $('.novel_writername').contents()
				.not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]')
				.text().slice(4, -3);
		} else {
			token = $('#novel_contents a[href^="http://syosetu.com/bookmarker/add/ncode/"]');
			if (token.size()) {
				login = true;
				token = token.attr('href').match(/=([0-9a-f]*)$/)[1];
			} else {
				login = false;
				token = null;
			}
			if (section_data.chapter_title.size()) {
				section_data.chapter_title = section_data.chapter_title.text();
				section_data.subtitle = section_data.subtitle.text();
			} else {
				section_data.chapter_title = '';
				section_data.subtitle = section_data.subtitle.text();
			}
			setIndexPageNotReady();
			auther = $('<div>')
				.html(
					$('.contents1').html()
					.replace(/\r|\n/g, '')
					.match(/作者：(.*)(<p.*?<\/p>)?/)[1]
				)
				.text();
		}
		if (token) {
			noja_option.setToken(token);
		}
		ncode2 = $('#head_nav a[href^="'+site2+'impression/list/ncode/"]')
			.attr('href').match(/([0-9]*)\/$/)[1];

		// コンテンツの内容の解析
		loadSection = currentSection;	// splitPageでimg関連で必要になる

		section_data._honbun = $('#novel_honbun').eq(0).html();
		section_data.honbun = splitPage(section_data._honbun, line_num, char_num);

		section_data._maegaki = $('#novel_p').eq(0).html();
		section_data.maegaki = splitPageEx(section_data._maegaki, line_num, char_num, 2);

		section_data._atogaki = $('#novel_a').eq(0).html();
		section_data.atogaki = splitPageEx(section_data._atogaki, line_num, char_num, 2);
		//
		sections[currentSection] = section_data;
		//
		setupCurrentSectionInfo(currentSection);
		return true;
	};

	////////////////////////////////////////////////////////
	//読み込んだデータをとりあえずJQueryにぶち込んで解析
	// @@ TODO @@ index読み込みの汎用サイト対応化
	// @@ TODO @@ のくむんだとそのページのしおり関連を拾わないといけない
	// 汎用化のためにparse部分を分離
	// @@ auther再設定だけはグローバルな変数書き換え @@
	NarouSite.prototype.parseHtmlContents = function(htmldoc, section) {
		// split時にimgタグのurlを収容するのに必要
		// (parseから呼ばれる)
		loadSection = section;
		// できればfindで絞っておく @@ TODO @@
		var contents = $('<div/>').append($.parseHTML(htmldoc));

		var section_data = {};

		// 新デザインでは章タイトル・サブタイトルは
		// 別々に取得できるので分離処理は不要
		section_data.chapter_title = $('.chapter_title', contents);
		if (section_data.chapter_title.size()) {
			section_data.chapter_title = section_data.chapter_title.text();
		} else {
			section_data.chapter_title = '';
		}
		section_data.subtitle = $('.novel_subtitle', contents);
		if (section_data.subtitle.size()) {
			section_data.subtitle = section_data.subtitle.text();
		} else {
			section_data.subtitle = '';
		}
		// 一応読み込んだものから著者は再設定しておく？
		// @@ これだけはグローバルな書き換えになる @@
		auther = $('<div>')
			.html(
				$('.contents1', contents).html()
				.replace(/\r|\n/g, '')
				.match(/作者：(.*)(<p.*?<\/p>)?/)[1]
			)
			.text();
		//前書きデータ取得
		section_data._maegaki = $('#novel_p', contents).html();
		section_data.maegaki = splitPageEx(section_data._maegaki, line_num, char_num, 2);
		//後書きデータ取得
		section_data._atogaki = $('#novel_a', contents).html();
		section_data.atogaki = splitPageEx(section_data._atogaki, line_num, char_num, 2);
		//本文データ取得
		section_data._honbun = $('#novel_honbun', contents).html();
		section_data.honbun = splitPage(section_data._honbun, line_num, char_num);
		// データオブジェクトを返す
		return section_data;
	};


	////////////////////////////////////////////////////////
	NocMoonSite.prototype.updateAutherAtSection = function (contents) {
		if (this.isSingleSection) {
			// 短編の場合は'.contents1'以前の領域
			auther = $('.novel_writername', contents).contents()
				.not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]')
				.text().slice(4, -3);
		} else {
			// 一応読み込んだものから著者は再設定しておく？
			// @@ これだけはグローバルな書き換えになる @@
			// 作者にanchorがない場合もある
			console.debug(contents);
			auther = $('<div>')
				.html(
					$('.contents1', contents).html()
					.replace(/\r|\n/g, '')
					.match(/作者：(.*)(<p.*?<\/p>)?/)[1]
				)
				.text();
		}
	}
	//読み込んだデータをとりあえずJQueryにぶち込んで解析
	// @@ TODO @@ index読み込みの汎用サイト対応化
	// @@ TODO @@ のくむんだとそのページのしおり関連を拾わないといけない
	// 汎用化のためにparse部分を分離
	// @@ auther再設定だけはグローバルな変数書き換え @@
	NocMoonSite.prototype.parseHtmlCommon = function (contents, section) {
		this.updateAutherAtSection(contents);

		// split時にimgタグのurlを収容するのに必要
		// (parseから呼ばれる)
		loadSection = section;
		var sec = {};

		if (this.isSingleSection) {
			sec.chapter_title = '';
			sec.subtitle = title;
		} else {
			sec.chapter_title = getText('.chapter_title', contents);
			sec.subtitle = getText('.novel_subtitle', contents);
		}

		//前書きデータ取得
		sec._maegaki = getHtml('#novel_p', contents);
		sec.maegaki = splitPageEx(sec._maegaki, line_num, char_num, 2);
		//後書きデータ取得
		sec._atogaki = getHtml('#novel_a', contents);
		sec.atogaki = splitPageEx(sec._atogaki, line_num, char_num, 2);
		//本文データ取得
		sec._honbun = getHtml('#novel_honbun', contents);
		sec.honbun = splitPage(sec._honbun, line_num, char_num);
		// データオブジェクトを返す
		return sec;
	};


	////////////////////////////////////////////////////////
	NocMoonSite.prototype.updateThemeAtSection = function (contents) {
		bgImage = $('body').css('background-image');
		if (bgImage === 'none' || bgImage === '') {
			bgImage = null;
		} else {
			bgImage = $('<img />')
				.attr('src', bgImage.match(/^url\((.*)\)$/)[1])
				.bind('load', function(){showPage();})
				.get(0);
			bgColor = '#FFFFFF';
		}
	}

	// 短編と長編でタイトルを取れるdiv領域が違う
	NocMoonSite.prototype.updateTitleAtSection = function (contents) {
		if (this.isSingleSection) {
			title = getText('.novel_title', contents);
		} else {
			// タイトルは必ず
			title = $('.contents1 >a:eq(0)', contents)
				.not('a[href="http://syosetu.com"]').text();
		}
	}
	NocMoonSite.prototype.parseSectionType = function (contents) {
		// ここの判定はなんとか変更したいところ
		// タイトル: タイトルアンカーが取れれば連載ページ
		var t = $('.contents1 >a:eq(0)').not('a[href="http://syosetu.com"]');
		return (!t.size());
	}
	// 絞るべきcontextは'#container'のレベルのようだ
	// 短編と長編でタイトルを取れるdiv領域が違う等、
	// これ以上は絞れない
	NocMoonSite.prototype.setupVolumeInfo = function (contents) {
		this.isSingleSection = this.parseSectionType();

		// 短編かどうかの判断はtitleが取れたかどうかで行う
		// title関連の調整とtoken取得等
		if (this.isSingleSection) {
			// 短編
			setIndexPageDisabled ();
			currentSection = 1;
			generalAllNo = 1;
		} else {
			// 連載
			setIndexPageNotReady();
		}
		var t = $('#bkm a[href^="http://syosetu.com/favnovelmain18/"]');
		token = (t.size()) ? t.attr('href').match(/=([0-9a-f]*)$/)[1] : null;
		if (token) {
			login = true;
			noja_option.setToken(token);
		} else {
			login = false;
		}
		t = $('#head_nav a[href^="'+site2+'impression/list/ncode/"]');
		ncode2 = (t.size()) ? t.attr('href').match(/([0-9]*)\/$/)[1] : null;

	}

	NocMoonSite.prototype.parseInitialPage = function () {
		if (!$('#novel_honbun').size()) {
			return false;
		}
		var contents = $('#container');
		this.setupVolumeInfo (contents);
		this.updateThemeAtSection (contents);
		this.updateAutherAtSection (contents);
		this.updateTitleAtSection (contents);
		//
		sections[currentSection] = this.parseHtmlCommon(contents, currentSection);
		//
		setupCurrentSectionInfo(currentSection);
		return true;
	};

	// jQueryでhtml,head,body等を取る必要がある場合は色々細工がいる
	// それ以外なら仮divにつけてdiv treeからのfindでOk
	// $(htmldoc).find('#hoge')は'#hoge'がbody直下だった場合に失敗する
	// $(htmldoc)や$.parseHTML()の戻すものはDOM elem配列であり
	// jQuery objectではない(&内部的にもnodeの下につける形で
	// engine側の機能としてparseしているので、
	// 階層位置がおかしくなるタグはなくなるようだ)
	// $(htmldoc)の場合も結局完全なtreeではなく
	// まともに扱える要素の階層での要素配列になっていて、
	// findが効かないことがある
	// ($(htmldoc) は $($.parseHTML(htmldoc))で配列をjQuery化している？)
	// '#container'は'body'直下なので配列の要素に入り、
	// findは子孫検索であり最上位の配列要素(self)階層のidは探さない
	// 汎用性を考えると呼出し側で変な加工せずにhtmldocで送ってきて
	// site parser側がうまく扱うべきだろう
	// (titleタグからしか情報が取れないとか、
	// 消える部分の情報がいる場合等を想定してrawで送る)
	NocMoonSite.prototype.parseHtmlContents = function (htmldoc, section) {
		// データ取得に必要なcontextに限定して
		// 最低限そのチェックをしてから呼び出す
		// '#container'がbody直下のため$('#container',htmldoc)等ではまずい
		var contents = $('<div/>').append($.parseHTML(htmldoc))
			.find('#container');
		// minimum check
		if (!contents.size()) {
			console.debug("min check failed");
			return null;
		}
		// 登録は呼出し元管轄
		return this.parseHtmlCommon (contents, section);
	}

	////////////////////////////////////////////////////////
	//読み込んだデータをとりあえずJQueryにぶち込んで解析
	// @@ TODO @@ index読み込みの汎用サイト対応化
	// 汎用化のためにparse部分を分離
	// @@ auther再設定だけはグローバルな変数書き換え @@
	AkatsukiSite.prototype.parseHtmlCommon = function(story, novels, section) {
		// globalなautherは再設定される
		// divの中に"作者："があってその後にaがあるもの
		auther = $('div a:eq(0)', story).text();
		//console.debug("auther:"+auther);

		var section_data = {};

		var h2 = $('h2:eq(0)', story);
		//console.debug("h2:", h2);
		//console.debug("h2-text:",h2.text());
		// <h2>第一部　「絆の仲間たち」<br>
		//第一章 「出会いはいつも唐突に」<br>
		//&nbsp;&nbsp;第二話「校舎裏の死闘」</h2>
		// 単独のサブタイトルの場合は1行
		//
		// これでそれぞれの行が取れてはいるはず
		var t = h2.contents().filter(function(){return this.nodeType === 3});
		//console.debug("t:"+t.size()+":", t);
		switch (t.size()) {
		case 3:	// part--chapter--section(subtitle)
			if (false) {
				//section_data.part_title = t.eq(0).text();
				section_data.chapter_title = t.eq(1).text();
			} else {
				// temporary : conbine part+chapter title
				var part_title = t.eq(0).text();
				section_data.chapter_title = part_title + ' ' + t.eq(1).text();
			}
			section_data.subtitle = t.eq(2).text();
			break;
		case 2:	// chapter--section(subtitle)
			//section_data.part_title = '';
			section_data.chapter_title = t.eq(0).text();
			section_data.subtitle = t.eq(1).text();
		case 1:	// section(subtitle)
			//section_data.part_title = '';
			section_data.chapter_title = '';
			section_data.subtitle = t.eq(0).text();
		default:
			section_data.chapter_title = '';
			section_data.subtitle = (t.size() > 0) ? t.text() : '';
		}


		// ある場合は
		//<div>
		//  <b>前書き</b>
		//</div>
		//<div class="body-novel">中身</div>
		//<hr width="100%">
		//<div> </div>
		//// 前書きがない場合はh2の直後にここになる
		//<div class="body-novel">本文中身</div>
		//<div> </div>
		//
		//<hr width="100%">
		//<div> </div>
		//<div>
		//  <b>後書き</b>
		//</div>
		//<div class="body-novel">中身</div>
		//
		// <b>の文字列は固定で入るようだ
		//<div><b>前書き</b></div>のあとのdiv.body-novelが前書き
		var findScript = function (descript, ctx) {
			var script = $('div > b:contains("'+descript+'")', ctx);
			return (script.size()) ? script.parent().next('div.body-novel') : null;
		}
		var pre = findScript('前書き', story);
		var post = findScript('後書き', story);
		var body = novels.not(pre, post);
		//
		//console.debug("pre:", pre);
		//console.debug("post:", post);
		//console.debug("body:", body);


		// loadSection設定はsplit時にimgタグのurlを収容するのに必要
		// splitPage関連
		loadSection = section;
		//
		section_data._honbun = (body) ? body.html() : null;
		//console.debug("_honbun:", section_data._honbun);
		section_data.honbun = splitPage(section_data._honbun, line_num, char_num);

		section_data._maegaki = (pre) ? pre.html() : null;
		//console.debug("_maegaki:", section_data._maegaki);
		//section_data._maegaki = $('div.body-novel').eq(0).html();
		section_data.maegaki = splitPageEx(section_data._maegaki, line_num, char_num, 2);

		section_data._atogaki = (post) ? post.html() : null;;
		//console.debug("_atogaki:", section_data._atogaki);
		//section_data._atogaki = $('div.body-novel').eq(0).html();
		section_data.atogaki = splitPageEx(section_data._atogaki, line_num, char_num, 2);
		//
		console.debug(section_data);
		//
		return section_data;
	};

	AkatsukiSite.prototype.updateThemeAtSection = function (story, novels) {
		bgImage = null;
		bgColor = '#FFFFFF';
		color = novels.css('color');
//		bgImage = $('body').css('background-image');
//		if (bgImage === 'none' || bgImage === '') {
//			bgImage = null;
//		} else {
//			bgImage = $('<img />')
//				.attr('src', bgImage.match(/^url\((.*)\)$/)[1])
//				.bind('load', function(){showPage();})
//				.get(0);
//			bgColor = '#FFFFFF';
//		}
	}

	AkatsukiSite.prototype.updateTitleAtSection = function (story, novels) {
		// ここの判定はなんとか変更したいところ
		// タイトル関連
		title = $('h1:eq(0)', story).text();
		console.debug("title:",title);
	}


	AkatsukiSite.prototype.parseHtmlContents = function(htmldoc, section) {
		// '#contents-inner2'がbody直下でなければ仮divにつけなくてもよいが
		// 保守性を考え仮divにつけておく
		var story = $('<div/>').append($.parseHTML(htmldoc))
			.find('#contents-inner2 > div.story > div.story');
		var novels = (story.size()) ? $('div.body-novel', story) : null;
		// minimum check
		if (!novels) {
			console.debug("min check failed");
			return null;
		}
		return this.parseHtmlCommon (story, novels, section);
	}

	// 初期化のときのparser stub
	// カラー指定の扱いとtoken関連は調整がいる
	AkatsukiSite.prototype.parseInitialPage = function () {
		console.debug("parseInitialPage");
		var story = $('#contents-inner2 > div.story > div.story');
		var novels = (story.size()) ? $('div.body-novel', story) : null;
		// minimum check
		if (!novels) {
			console.debug("min check failed");
			return false;
		}
		// 解析した中身によって本来変更すべきもの
		currentSection = 1;
		setIndexPageDisabled ();
		generalAllNo = 1;
		login = false;
		token = null;
		ncode2 = null;

		this.updateThemeAtSection (story, novels);
		this.updateTitleAtSection (story, novels);

		// htmlの共通parserにかける前に
		// 雀牌画像の逆変換をして独自タグに戻すべき
		sections[currentSection] = this.parseHtmlCommon (story, novels, currentSection);
		setupCurrentSectionInfo(currentSection);

		return true;
	}


	/////////////////////////////////////////////////////////////
	// カラー指定の扱いとtoken関連は調整がいる
	HamelnSite.prototype.parseHtmlCommon = function (contents, section) {
		// 著者はfontの直後のa
		auther = $('p:eq(0) > font[size="+2"]:eq(0) + a:eq(0)', contents).text();
		//console.debug("auther:"+auther);

		var section_data = {};

		//console.debug("title:", title);
		// subtitleはfontsizeで識別する
		//http://novel.syosetu.org/22690/4.html
		//明けない梅雨空 第一章　一話　明けない梅雨空　桐乃view
		//のようにベタっぽい
		// 見出しのほうでみると"明けない梅雨空"が章題っぽいが
		// 構造化されていないので単体では識別不能
		// 後で使うので保存
		var o_subtitle = $('font[size="+1"]:eq(0)', contents);
		//console.debug("subtitle:", o_subtitle.text());
		section_data.chapter_title = '';
		section_data.subtitle = o_subtitle.text();


		// 文章はdiv.ssの子の階層に全部ある
		// maegakiはdivでid指定の同階層
		// 前書きの後にfontでサブタイがありそれは確実
		// サブタイ以前の部分は除去してOk
		// 本文も子要素としてそのままある
		// 後書きはdivで同階層にある
		// 前書き後書きは多分
		// 'div.ss > div.#maegaki'なのだろうが
		// id指定なのでtag要素は指定する必要がない
		//http://novel.syosetu.org/5565/36.html
		//これの場合はどうも構造が違う
		// 前書きなしの場合
		// ss > pの中に本文が入るのか？
		// ss > divで後書きなのは変わらず
		var findScript = function (descript, ctx) {
			var script = $(descript+":eq(0)", ctx);
			return (script.size()) ? script : null;
		}
		var pre = findScript('#maegaki', contents);
		var post = findScript('#atogaki', contents);
		var body = null;

		// subtitle部分が見つからないことは想定しない
		// テンポラリのdivの中にcloneで本文有効範囲を構築する
		var body_candidate = contents.contents();
		// console.debug("body_candidate: ", body_candidate);
		// startIdxはこの段階ではstart - 1を指す
		var startIdx = body_candidate.index(o_subtitle);
		if (startIdx < 0) {
			// ss直下にsubtitleがない場合、#maegakiなしで
			// pの中に本文が埋まっている
			body_candidate = $('p:eq(0)', contents).contents();
			startIdx = body_candidate.index(o_subtitle);
			if (startIdx < 0) {
				// 分離をを諦めて全部を本文扱いにしておく
				body = contents;
			} else {
				// pに本文が埋まっている場合、
				// atogakiは上階層なので影響しない
				// (startIdx以降全部取り出せばOk)
				startIdx += 1;
				body = body_candidate.slice(startIdx)
					.clone().wrapAll('<div/>').parent();
			}
		} else {
			// ss直下にsubtitleがくるのは#maegakiありの場合
			// その場合は#atogakiの分離が必要
			startIdx += 1;
			var endIdx = (post)
				? body_candidate.index(post) : body_candidate.size();
			//console.debug("startIdx, endidx: ", startIdx, endIdx);
			body = body_candidate.slice(startIdx, endIdx)
				.clone().wrapAll('<div/>').parent();
		}
		// console.debug("body: ", body);


		// コンテンツの内容の解析
		loadSection = section;	// splitPageでimg関連で必要になる

		section_data._honbun = (body) ? body.html() : null;
		//console.debug("_honbun", section_data._honbun);
		section_data.honbun = splitPage(section_data._honbun, line_num, char_num);

		section_data._maegaki = (pre) ? pre.html() : null;
		//console.debug("_maegaki", section_data._maegaki);
		section_data.maegaki = splitPageEx(section_data._maegaki, line_num, char_num, 2);

		section_data._atogaki = (post) ? post.html() : null;
		//console.debug("_atogaki", section_data._atogaki);
		section_data.atogaki = splitPageEx(section_data._atogaki, line_num, char_num, 2);
		//
		console.debug(section_data);
		return section_data;
	}

	HamelnSite.prototype.updateThemeAtSection = function (contents) {
		bgImage = null;
		bgColor = '#FFFFFF';
		color = contents.css('color');
//		bgImage = $('body').css('background-image');
//		if (bgImage === 'none' || bgImage === '') {
//			bgImage = null;
//		} else {
//			bgImage = $('<img />')
//				.attr('src', bgImage.match(/^url\((.*)\)$/)[1])
//				.bind('load', function(){showPage();})
//				.get(0);
//			bgColor = '#FFFFFF';
//		}
	}

	HamelnSite.prototype.updateTitleAtSection = function (contents) {
		// ここの判定はなんとか変更したいところ
		// タイトル関連
		// タイトルはfontの中のa
		title = $('p:eq(0) > font[size="+2"]:eq(0) > a:eq(0)', contents).text();
		//console.debug("title:", title);
	}

	//読み込んだデータをとりあえずJQueryにぶち込んで解析
	// @@ TODO @@ index読み込みの汎用サイト対応化
	// @@ TODO @@ のくむんだとそのページのしおり関連を拾わないといけない
	// 汎用化のためにparse部分を分離
	// @@ auther再設定だけはグローバルな変数書き換え @@
	HamelnSite.prototype.parseHtmlContents = function (htmldoc, section) {
		// '#maind'がbody直下でなければ仮divにつけなくてもよいが
		// 保守性を考え仮divにつけておく
		var contents = $('<div/>').append($.parseHTML(htmldoc))
			.find('#maind > div.ss:eq(0)');
		// minimum check
		if (!contents.size()) {
			console.debug("min check failed");
			return null;
		}
		return this.parseHtmlCommon (contents, section);
	};

	// カラー指定の扱いとtoken関連は調整がいる
	HamelnSite.prototype.parseInitialPage = function () {
		var contents = $('#maind > div.ss:eq(0)');
		// minimum check
		if (!contents.size()) {
			console.debug("min check failed");
			return false;
		}

		currentSection = 1;
		setIndexPageDisabled ();
		generalAllNo = 1;
		login = false;
		token = null;
		ncode2 = null;

		this.updateThemeAtSection (contents);
		this.updateTitleAtSection (contents);

		sections[currentSection] = this.parseHtmlCommon (contents, currentSection);
		setupCurrentSectionInfo(currentSection);

		return true;
	}




	////////////////////////////////////////////////////////
	//各話の各ページにジャンプする関数。toPageに負の値を渡すと最後尾ページにジャンプ。

	jumpTo = function(section, toPage) {
		var shouHyouka = function() {
			showStatusMessage('川・◊・)いま投稿されているのはここまでなのじゃー。感想を書いてあげるといいのじゃー。');
			if (siteParser.enableReputationForm) {
				$('#noja_hyouka').show();
			}
		};
		if (section == 0) {
			showStatusMessage('(´・ω・｀)ここが最初の話だよ');
			return;
		}
		//ジャンプ先が全話数より多ければ終了
		if (generalAllNo && section > generalAllNo) {
			shouHyouka();
			return;
		}
		//isChangeSection===trueなら話移動が必要
		var isChangeSection = (section != currentSection);
		//sectionに負の値を渡すと現在の話を強制再読み込み。
		if (section < 0) {
			section = currentSection;
			isChangeSection = true;
		}
		//まだ読み込まれていない
		if (!(section in sections) || sections[section] === false
			|| sections[section] === null) {
			//読み込み終了までにこれが変更されてなかったら読み込み終了後にジャンプ
			nextPage = toPage;
			nextSection = section;
			//読み込み中はtrueをマークする
			sections[section] = true;
			++loading;
			//読み込み関数
			var load_section_main = function() {
				showStatusMessageLoading ();
				//ajaxでページを読み込む。
				$.ajax({
					url: getNovelSectionURL (section),
					//成功
					success: function (data) {
						//データを登録
						sections[section] = siteParser.parseHtmlContents(data, section);
						autoPagerize(sections[section], section);
						--loading;
						//ステータスバーに成功を通知
						showStatusMessage('(｀・ω・´)成功!!');
						maxSection = Math.max(maxSection, section);
						if (nextPage != page || nextSection != currentSection) {
							// ロードが終わったので再度本体関数を呼び出す
							jumpTo(nextSection, nextPage);
						}
						if (setting.autoSave) {
							nojaSave(false);
						}
					},
					error: function() {
						//ステータスバーに失敗を通知
						showStatusMessage('失敗(´・ω・｀)……')
						//失敗時はfalseをマークする。
						sections[section] = false;
						--loading;
					}
				});
			}
			// ・存在が確認済の場合:無条件にload
			// ・最大話数が取得されていないなら取得しチェックしてからload
			// ・取得途中なら待ち
			if (section <= maxSection) {
				// 読み込まれていないが現在の最大セクションよりも小さいセクションを
				// 要求した場合は確実に存在するのでロードすればよい
				load_section_main();
			} else if (generalAllNo === null) {
				//話数カウントされていない場合
				//読み込み中をマーク
				generalAllNo = false;
				showStatusMessageLoading ();
				//ajaxでなろう小説APIからデータを受け取る
				$.ajax({
					url: api + ajax_get_opt + ncode,
					dataType: ajax_data_type,
					//成功
					success: function (data) {
						var flag = (generalAllNo === false);
						//話数を設定
						generalAllNo = parseInt (data[1].general_all_no);
						maxSection = generalAllNo;
						//話数が多ければさらに読み込み
						if (section <= generalAllNo) {
							// 存在が確認できたのでsection本体のロードを開始
							load_section_main();
						} else {
							shouHyouka();
							sections[section] = false;
						}
					},
					error: function(data) {
						showStatusMessage('失敗(´・ω・｀)……')
						sections[section] = false;
						--loading;
						generalAllNo = null;
					}
				});
			} else if (generalAllNo === false) {
				// 読み込み中でまだ完了してないなら
				var wait_for_section_info = function() {
					if (generalAllNo === false) {
						// まだ終わってないなら待ち
						setTimeout (wait_for_section_info, 100);
					} else if (generalAllNo === null || section > generalAllNo) {
						// 読み終わったが最大セクション数不定
						// ジャンプ先セクションが最大を超える
						// 場合は諦める
						sections[section] = false;
						--loading;
					} else {
						// 情報取得しおわり、セクション指定も範囲内と確認できたので
						// 実体のコンテンツ取得を呼ぶ
						load_section_main();
					}
				};
				setTimeout (wait_for_section_info, 100);
			}
			// いずれにせよ非同期読み込みが終わって再度callされるまでは
			// することがないので終了
			return;
		}
		//読み込み中なので終了。
		if (sections[section] === true) {
			return;
		}
		// 文章領域のページ数を計算する
		var nPages = countPages(section);
		// 負のページ数指定はendからのページ位置に変換
		if (toPage < 0) {
			toPage += nPages;
		}
		// @@ 単ページモード対応済
		toPage = getFirstPageAlinedCanvas(toPage);	// 偶数ページ化(右ページ)

		// 次話強制ではない場合、
		// 同ページのまま or toPageの計算が範囲外なら処理終了
		if (!isChangeSection
			&& (toPage == page || !(toPage >= 0 && toPage < nPages))) {
			return;
		}
		nextPage = toPage;
		nextSection = section;
		// 右sliderのindex部分のcurrentを移動?枠部分のstyle
		$('#noja_page_'+page).removeClass('noja_page_select')
			.css('border-color', color);
		// これって話数移動したら最大ページ数も変化するので
		// selectorでの指定崎がない場合もあるのだがいいのかな？
		page = toPage;
		$('#noja_page_'+page).addClass('noja_page_select')
			.css('border-color', '');
		//
		if (isChangeSection) {
			// 話の移動だった場合は情報更新
			setupCurrentSectionInfo (section);
			siteParser.changeSection (section);
			updateNavigation();
		}
		showPage();
	};
	////////////////////////////////////////////////////////
	// 右スライダーのページナビ
	$.templates('updateNaviIndexTmpl', '<div>{{:page}}ページ</div>');
	// canvasもtemplate化したほうがいいが、html側にもっていくべき

	updateNavigation = function() {
		$('#noja_pages > div').empty();
		total = countPagesInCurrentSection();
		// @@ 一応単ページ対応
		for (var i = 0; i < total; i += pages_per_canvas) {
			(function() {
				var p = i;	// 
				var section = currentSection;
				$('#noja_pages > div')
					.append($.render.updateNaviIndexTmpl({page: (i+1)}))
					.append(
						$('<canvas/>').attr({
							id: 'noja_page_'+i,
							width: thumb_size.width+"px",
							height: thumb_size.height+"px"
						}).css('border-color', (i === page) ? '' : color)
						.bind('click', function() { jumpTo(section, p); } )
					);
				drawThumbPage (i);
			})();
		}
		$('#noja_page_'+page).addClass('noja_page_select');
	}
	////////////////////////////////////////////////////////
	// @@ TODO @@ 単ページ対応がいる
	// canvas contextに指定ページを描画する
	// thumb用もあるのでここの内部ではchar_sizeは引数の変数
	// drawPageは見開きのcanvas全体を書く
	drawPage = function(context, char_size, size, page, bairitu) {
		if (bairitu === undefined) bairitu = 1;
		////////////////////////////////
		// drawRuby,drawTextは縦書き横書きでmethodを分ける
		var drawRuby;
		var drawText;
		if (yokogaki) {
			drawRuby = function(text, x, y, size, col) {
				context.save();
				if (text.match(/、+|・+/)==text) {
					context.font = get_canvas_font (size*2);
					if (text[0]=='、') {
						context.translate(size * 0.3, -size * 0.6);
					} else {
						context.translate(0, size * 0.1);
					}
				} else {
					context.font = get_canvas_font (size);
				}
				var yy = getCol_for_ruby_yokogaki(text)-col*2;
				var size_col = size;
				if (yy > 0) {
					y-=yy*size * 0.45;
					size_col*=.9;
				} else {
					var span =-yy*size/text.length;
					size_col += span;
					y+=span * 0.5;
				}
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					context.save();
					context.translate(x+size*2, y+size*3.6);
					if (hankaku.indexOf(ch) >= 0) {
						x+=size_col;	// 0.5では？
					} else {
						x+=size_col;
					}
					context.fillText(ch, 0, 0);
					context.restore();
				}
				context.restore();
			};
			// x方向に1文字分shiftした位置になっている
			// y方向は0.85文字分下げ
			drawText = function(text, x, y, size) {
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//context.strokeRect(x, y+size, size, size);
					context.save();
					context.translate(x+size, y+size * 0.85);
					if (hankaku.indexOf(ch) >= 0) {
						x+=size * 0.5;
					} else if ('゛゜\u3099\u309A'.indexOf(ch) >= 0) {
						context.translate(-size * 0.25, 0);
					} else {
						x+=size;
					}
					context.fillText(ch, 0, 0);
					context.restore();
				}
			};
/////////
		} else {
			// 縦書き
			drawRuby = function(text, x, y, size, col) {
				context.save();
				if (text.match(/、+|・+/)==text) {
					// 縦書きルビだとどっちも同じ位置合わせでいいのかな？
					context.font = get_canvas_font (size * 2);
					// x方向は本文に寄せるのだろうy方向の調整は不明
					context.translate(-size * 0.5, size * 0.5);
				} else {
					context.font = get_canvas_font (size);
				}
				var yy = getCol_for_ruby_tategaki(text) - col * 2;
				var size_col = size;
				if (yy > 0) {
					y -= yy * size * 0.45;
					size_col *= 0.9;
				} else {
					var span = -yy * size / text.length;
					size_col += span;
					y += span * 0.5;
				}
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//context.strokeRect(x+size*2, y+size*2, size, size_col);
					context.save();
					context.translate(x+size*2, y+size*2.9);
					if (hankaku.indexOf(ch) >= 0) {
						// このあたりでルビ内半角の縦中横処理
						var halfwidth_string
							 = get_hankaku_lr_tb_string(text, j);
						if (halfwidth_string.length == 2) {
							// "([0-9!?]{2})|([0-9][.,])"
							if (hankaku_narrow_width.indexOf(halfwidth_string[1]) >= 0) {
								// translate()引数が全省略でいいのか？
								// 多分drawText側での"1."等の場合の中央寄せ処理の残滓
								//context.translate();
							}
							context.fillText(ch, 0, 0);
							ch = text[++j];
							context.translate(size/2, 0);
							y+=size_col;
						} else if (halfwidth_string.length == 1) {
							// 半角1文字"[0-9!?]{1}"
							context.translate(size/4, 0);
							y+=size_col;
						} else {
							// 一般の半角1文字を縦書きで
							context.translate(size/6, -size*5/6);
							context.rotate(Math.PI / 2);
							y+=size_col * 0.5;
						}
					} else if (zenkakukaiten.indexOf(ch) >= 0) {
						context.translate(size/6, -size*5/6);
						context.rotate(Math.PI / 2);
						y+=size_col;
					} else if (ch=='ー') {
						context.translate(size*11/12, -size*5/6);
						context.rotate(Math.PI / 2);
						context.scale(1, -1);
						y+=size_col;
					} else if ('。、．，'.indexOf(ch) >= 0) {
						context.translate(size*3/5, -size*3/5);
						y+=size_col;
					} else if (komoji.indexOf(ch) >= 0) {
						context.translate(size/10, -size/8);
						y+=size_col;
					} else {
						y+=size_col;
					}
					context.fillText(ch, 0, 0);
					context.restore();
				}
				context.restore();
			};
			// y方向に1.9文字分の補正:xは指定した値のまま
			drawText = function(text, x, y, size) {
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//context.strokeRect(x, y+size, size, size);
					context.save();
					context.translate(x, y+size*1.9);
					if (hankaku.indexOf(ch) >= 0) {
						var halfwidth_string
							 = get_hankaku_lr_tb_string(text, j);
						if (halfwidth_string.length == 2) {
							// "([0-9!?]{2})|([0-9][.,])"
							// "1."の場合は"."が小さい幅なので1/4ほど中央に寄せる
							if (hankaku_narrow_width.indexOf(halfwidth_string[1]) >= 0) {
								context.translate(size/4, 0);
							}
							context.fillText(ch, 0, 0);
							ch = text[++j];
							context.translate(size/2, 0);
							y+=size;
						} else if (halfwidth_string.length == 1) {
							// 半角1文字"[0-9!?]{1}"
							context.translate(size/4, 0);
							y+=size;
						} else {
							// 一般の半角1文字を縦書きで
							context.translate(size/6, -size*5/6);
							context.rotate(Math.PI / 2);
							y+=size * 0.5;
						}
					} else if (zenkakukaiten.indexOf(ch) >= 0) {
						context.translate(size/6, -size*5/6);
						context.rotate(Math.PI / 2);
						y+=size;
					} else if (ch=='ー') {
						if(fontType=='mincho') context.translate(size*11/12, -size*5/6);
						else  context.translate(size*5/6, -size*7/8);
						context.rotate(Math.PI / 2);
						context.scale(1, -1);
						y+=size;
					} else if ('。、．，'.indexOf(ch) >= 0) {
						context.translate(size*3/5, -size*3/5);
						y+=size;
					} else if ('“〝'.indexOf(ch) >= 0) {
						context.translate(0, size/2);
						y+=size;
					} else if (komoji.indexOf(ch) >= 0) {
						context.translate(size/10, -size/8);
						y+=size;
					} else if ('゛゜\u3099\u309A'.indexOf(ch) >= 0) {
						// 3099-309Cまでの記号
						// 3099は濁点の右上位置にあるもの(合成用？)
						// 309Aは半濁点の右上位置にあるもの(合成用？)
						// 309Bは単体の濁点(左上位置)
						// 309Cは単体の半濁点(左上位置)
						context.translate(size * 0.75, -size);
					} else if ('☹☺☻☼♠♡♢♣♤♥♦♧♫♬♮'.indexOf(ch) >= 0) {
						// 特殊記号を大き目に
						context.font = get_canvas_font (size * 1.5, null);
						context.translate(size * 0.175, size * 0.15);
						y+=size;
					} else {
						y+=size;
					}
					context.fillText(ch, 0, 0);
					context.restore();
				}
			};
		}
		/////////////////////////////////////
		// このあたりが処理コア部分
		context.fillStyle = bgColor;
		context.fillRect (0, 0, size.width, size.height);
		//
		var debug_draw_grid = false;
		if (debug_draw_grid) {
			var padding = 0;	// 10
			for (var xx = 0; xx <= size.width; xx += char_size) {
				context.moveTo(0.5 + xx + padding,           0 + padding);
				context.lineTo(0.5 + xx + padding, size.height + padding);
			}
			for (var yy = 0; yy <= size.height; yy += char_size) {
				context.moveTo(         0 + padding, 0.5 + yy + padding);
				context.lineTo(size.width + padding, 0.5 + yy + padding);
			}
			context.strokeStyle = "blue";
			context.stroke();
			//if (yokogaki) {
			//	for (var yy = 0; yy <= size.height; yy += char_size*1.7) {
			//		context.moveTo(         0 + padding, 0.5 + yy + padding);
			//		context.lineTo(size.width + padding, 0.5 + yy + padding);
			//	}
			//} else {
			//	for (var xx = 0; xx <= size.width; xx += char_size*1.7) {
			//		context.moveTo(0.5 + xx + padding,           0 + padding);
			//		context.lineTo(0.5 + xx + padding, size.height + padding);
			//	}
			//}
			//context.strokeStyle = "red";
			//context.stroke();
		}
		if (bgImage) {
			var bgWidth = bgImage.width*2*bairitu;
			var bgHeight = bgImage.height*2*bairitu;
			if(bgWidth&&bgHeight) {
				for(var yy = 0; yy < size.height; yy+=bgHeight) {
					for(var xx = 0; xx < size.width; xx+=bgWidth) {
						context.drawImage(bgImage, xx, yy, bgWidth, bgHeight);
					}
				}
			}
		}
		/*なんか微妙にイマイチだなって
		var grad = context.createLinearGradient(size.width * 0.48, 0, size.width * 0.52, 0);
		bgColor.match(/rgb\(([0-9]*), ([0-9]*), ([0-9]*)\)/g);
		var r = parseInt(RegExp.$1), g = parseInt(RegExp.$2), b = parseInt(RegExp.$3);
		grad.addColorStop(0, bgColor);
		grad.addColorStop(.2, 'rgb('+Math.floor(r * 0.95)+', '+Math.floor(g * 0.95)+', '+Math.floor(b * 0.95)+')');
		grad.addColorStop(.25, 'rgb('+Math.floor(r * 0.91)+', '+Math.floor(g * 0.91)+', '+Math.floor(b * 0.91)+')');
		grad.addColorStop(.3, 'rgb('+Math.floor(r * 0.85)+', '+Math.floor(g * 0.85)+', '+Math.floor(b * 0.85)+')');
		grad.addColorStop(.4, 'rgb('+Math.floor(r * 0.69)+', '+Math.floor(g * 0.69)+', '+Math.floor(b * 0.69)+')');
		grad.addColorStop(.5, 'rgb('+Math.floor(r * 0.5)+', '+Math.floor(g * 0.5)+', '+Math.floor(b * 0.5)+')');
		grad.addColorStop(.6, 'rgb('+Math.floor(r * 0.69)+', '+Math.floor(g * 0.69)+', '+Math.floor(b * 0.69)+')');
		grad.addColorStop(.7, 'rgb('+Math.floor(r * 0.85)+', '+Math.floor(g * 0.85)+', '+Math.floor(b * 0.85)+')');
		grad.addColorStop(.75, 'rgb('+Math.floor(r * 0.91)+', '+Math.floor(g * 0.91)+', '+Math.floor(b * 0.91)+')');
		grad.addColorStop(.8, 'rgb('+Math.floor(r * 0.95)+', '+Math.floor(g * 0.95)+', '+Math.floor(b * 0.95)+')');
		grad.addColorStop(1, bgColor);
		context.fillStyle=grad;
		context.fillRect(0, 0, size.width, size.height);
		*/
		context.fillStyle = color;
		context.strokeStyle = color;
		// 全話つなげるならcurrentSection手前までのページ数を計算
		var page_base = (allpage) ? countPagesInSections (1, currentSection) : 0;

		// ページ内の充填行数は気にせず最大領域でrect boxを書く
		var draw_layout_box;
		if (yokogaki) {
			draw_layout_box = function (context, is_first_page, page_width) {
				var xoffset = (is_first_page) ? 0 : page_width - (char_size * 2);
				context.strokeRect(
					xoffset + char_size * (3.5)
					, char_size * 4.3
					, char_size * (char_num + 1.1)
					, char_size * (line_num * 1.7 + 0.7)
				);
			};
		} else {
			draw_layout_box = function (context, is_first_page, page_width) {
				// 右: hwidth + csz*1.4
				//		hwidth + csz*1.4 + csz*1.7*ln + csz*0.6 - 1
				//		hwidth + csz*2 + csz*1.7*ln - 1
				// 左: hwidth - csz*1.7*ln - csz*2
				//		hwidth - csz*1.7*ln - csz*2 + csz*1.7*ln + csz*0.6 - 1
				//		hwidth - csz*1.4 - 1
				// 2つ分位置が違う
				var xoffset = (is_first_page)
					? page_width
					: page_width - char_size * ((line_num + 2) * 1.7)
				;
				context.strokeRect(
					xoffset + char_size * (1.4)
					, char_size*4.3
					, char_size*(line_num*1.7+0.6)	// 0.3づつ外に幅をつけるのかな？
					, char_size*(char_num-1+0.4)
				);
				if (false && !is_first_page) {
					context.save();
					context.strokeStyle = "rgb(0, 0, 200)";
					context.strokeRect(
						char_size * 4.2
						, char_size*1.3
						, char_size*(line_num*1.7+0.6)
						, char_size*(char_num-1+.4)
					);
					context.restore();
				}
			};
		}

		var calcEmbeddedImageSize = function (imagesize, pagesize) {
			var w = imagesize.width;
			var h = imagesize.height;
			if (h / w > Math.sqrt(2)) {
				if (h > pagesize.height) {	// canvasよりも大きいなら
					// 縦にはみ出すなら縦をheightに縮小
					w *= pagesize.height / h;	// 縦縮小率に合わせて横も補正
					h = pagesize.height;
				}
			} else {
				// ベースaspectよりも横長?
				if (w > pagesize.width) {
					h *= pagesize.width / w;	// ページに収まるようなサイズ
					w = pagesize.width;
				}
			}
			return {width: w, height: h};
		};

		// tposはsubtitleを書くページ位置
		// まえがきがあれば前書き終了後の次ページ
		// 多分char_size * 1.7がルビ・マージンも含めた行の幅
		var tpos = (maegaki != null && setting.fMaegaki) ? maegaki[0].length : 0;
		var apos = tpos+ honbun[0].length;
		// 左右ページの描画
		var page_size = {width:(size.width / 2), height:size.height};
		var end_page = Math.min(page + pages_per_canvas, total);
		for (var k = page; k < end_page; ++k) {
			var right_left = k - page;	// 0:right 1:left
			var is_first_page = (k == page);	// pageはもともとintだから型変換比較でいいはず
			var base_x = (yokogaki ? (k - page) : (1 - (k - page))) * page_size.width;
			var yokogaki_xoffset = base_x + ((is_first_page) ? 0 : -(char_size * 2));

			// サブタイトル表示
			if (k == tpos) {
				context.save();
				context.font = get_canvas_font (char_size * 1.4);
				var text = subtitle;
				if (isIndexPageDisable()) {
					text+='　　　'+auther;
				}
				if (yokogaki) {
					// 左だと6+1字下げ(+1はdrawText内)
					// 右だと4+1字下げっぽい(+1はdrawText内)
					drawText(text
						, yokogaki_xoffset + char_size * 6
						, char_size*6	// y
						, char_size*1.4	// size
					);
				} else {
					drawText(text
						// 右:page_size.widthが基点
						// 左:0が基点
						// 文字幅*1.7 * 行数のページ先頭位置？
						, base_x + char_size * line_num * 1.7
						, char_size*6	// y
						, char_size*1.4
					);
				}
				context.restore();
			}
			// 前書き:囲いbox部分のみ先行描画
			var p;
			var rb;
			var yy = 3;	// 本文の字下げ(横だと左ページ基準での字下げ数)
			if (k < tpos) {
				p = maegaki[0][k - 0];
				rb = maegaki[1][k - 0];
				if (layout) {
					draw_layout_box (context, is_first_page, page_size.width);
					++yy;	// 追加1字下げ
				}
			}
			// 本文
			else if (k < apos) {
				p = honbun[0][k - tpos];
				rb = honbun[1][k - tpos];
			}
			// 後書き:囲いbox部分のみ先行描画
			else {
				p = atogaki[0][k - apos];
				rb = atogaki[1][k - apos];
				if (layout) {
					draw_layout_box (context, is_first_page, page_size.width);
					++yy;	// 追加1字下げ
				}
			}
			// 選んだ領域の該当ページにimgがあった場合の処理
			if (Object.prototype.toString.call(p).slice(8, -1)==='HTMLImageElement') {
				// bairitsuはdrawPageの引数でデフォルト1 : page index部の場合に使われる
				// 2倍サイズで計算(canvas自体が2倍サイズなので)
				var image_size = calcEmbeddedImageSize (
					{width: p.width * 2 * bairitu, height:p.height * 2 * bairitu}
					, page_size
				);
				// センターアライメントで書く
				context.drawImage(
					p
					, base_x + (page_size.width - image_size.width) / 2
					, (page_size.height - image_size.height) / 2
					, image_size.width
					, image_size.height
				);
				continue;
			}
			// 肩領域・ノンブル領域の処理(右ページ)
			else if (is_first_page) {
				var right_offset = size.width - char_size*4;
				if (chapter_title == '') {
					// 章タイトルがない場合は2～3行領域に上下中央寄せでサブタイのみ
					context.fillText (
						subtitle
						, right_offset - context.measureText(subtitle).width
						, char_size*2.5
					);
				} else {
					context.fillText (
						chapter_title
						, right_offset - context.measureText(chapter_title).width
						, char_size*2
					);
					context.fillText (
						subtitle
						, right_offset - context.measureText(subtitle).width
						, char_size*3
					);
				}
				var pageNo = page_base + page + (yokogaki ? 1 : 0) + 1;
				// 2文字あけの右寄せ
				var nb_right_offset = size.width - char_size*2;
				context.fillText (
					pageNo
					, nb_right_offset - context.measureText(pageNo).width
					, page_size.height - char_size*1
				);
				// ページ区切り線?
				context.fillRect (page_size.width, 0, .6, page_size.height);
			}
			// 肩領域・ノンブル領域の処理(左ページ)
			else {
				// ページ区切り線?
				context.fillRect (page_size.width - .6, 0, .6, page_size.height);
				var pageNo = page_base + page + (yokogaki ? 0 : 1) + 1;
				// 2文字明けの左寄せ
				var nb_left_offset = char_size*2;
				context.fillText (
					pageNo
					, nb_left_offset
					, page_size.height - char_size
				);
				var title_left_offset = char_size*4;
				context.fillText (title, title_left_offset, char_size*2.5);
			}
			// 選んだ領域の該当ページの中身部分
			// base+ruby
			// 縦書き横書きの判定はループ外へ
			if (yokogaki) {
				// yy補正がx方向に効いてくる
				// yy値の本来の値は3で3文字下げ
				// レイアウト時は左ページだと4 : drawText側補正後5
				//               右ページだと2 : drawText側補正後3
				// その他のケースは3 : 
				//    左ページだとdrawText側補正後4
				//    右ページだとdrawText側補正後(4 - 3) + 1(補正)=2
				// 左ページ基準になるので左ページ左余白4と右ページ左余白2の
				// 補正として右ページの場合base-2位置をxoffsetとする
				// オリジナルだとyyを左右で変えたり式の上では-yyしたりしていたが
				// offsetを調整して左右で同じ式になるように細工したほうがいいので変更
				for (var i = 0; i < p.length; ++i) {
					drawText (
						p[i]
						, yokogaki_xoffset + char_size * (yy + 0)
						, char_size*(i*1.7+5)
						, char_size
					);
					var r = rb[i];
					for (var j = 0; j < r.length; ++j) {
						drawRuby (
							r[j][2]
							, yokogaki_xoffset + char_size * (yy + r[j][0])
							, char_size*(i*1.7+3)
							, char_size/2
							, r[j][1]
						);
					}
				}
			} else {
				// 縦書き
				// yyは字下げ位置
				// yy値の本来の値は3で3文字下げ
				// 左ページ:左余白5右余白2になる？
				// 右ページ:左余白2右余白5になる？
				var offset_y = char_size*yy;
				var ruby_char_size = char_size / 2;
				for (var i = 0; i < p.length; ++i) {
					// 左ページ:-3 + 1=-2行の右余白(+1はdrawText内補正)
					// left - 3 -i*1.7
					// 右ページ:-6 + 1=-5行の右余白(+1はdrawText内補正)
					// right + (nl-1)*1.7 -i*1.7 + 2
					// x方向に補正はかからない
					// 左-3=-1.3-1.7で右余白1.3で文字の左位置が-1.7ということ
					// 右は2あるなあ。(i max=line_num-1なので0*1.7になる
					var xpos = (is_first_page
						 ? page_size.width + char_size*((line_num-1-i)*1.7 + 2)
						 : page_size.width + char_size*(-i*1.7-3)
						  );
					drawText (p[i]
						, xpos, offset_y + 0
						, char_size
					);
					var r = rb[i];
					// ルビは半分のサイズ
					for (var j = 0; j < r.length; ++j) {
						drawRuby (r[j][2]
							, xpos, offset_y + char_size*r[j][0]
							, ruby_char_size
							, r[j][1]
						);
					}
				}
			}
		}
	}
	////////////////////////////////////////////////////////
	showPage = function() {
		console.debug("showPage"+page);
		drawPage(context, char_size, size, page);
		drawThumbPage(page);
	}

	////////////////////////////////////////////////////////
	// @@ 単ページ対応済 @@
	loadNext = function() {
		var new_page = page + pages_per_canvas;
		var new_section = currentSection;
		if (new_page >= total) {
			new_page = 0;
			new_section += 1;
		}
		jumpTo(new_section, new_page);
	}
	loadPrev = function() {
		var new_page = page - pages_per_canvas;
		var new_section = currentSection;
		if (new_page < 0) {
			new_page = -1;
			new_section -= 1;
		}
		jumpTo(new_section, new_page);
	}
	var load_next_direction = function (isNext, invertIfYokogaki) {
		if (!invertIfYokogaki) {
			invertIfYokogaki = false;
		}
		if (((invertIfYokogaki && yokogaki) ? !isNext : isNext)) {
			loadNext();
		} else {
			loadPrev();
		}
	}
	////////////////////////////////////////////////////////
	// ノンブル等本文以外の領域が縦書きだと8文字分
	// 横書きの場合はhalf_widthに対して左右余白が6文字分
	var calcCharSize = function(nchars) {
		var csize;
		if (yokogaki) {
			csize = (size.width / 2) / (nchars + 6);
		} else {
			csize = size.height / (nchars + 8);
		}
		return csize;
	};
	////////////////////////////////////////////////////////
	// globalな変数と衝突するローカル引数名になっているので中では参照先はローカル
	var remake_noja_charsize = function (char_size, char_num, line_num) {
		// example部分の更新:width=8,height=2のサイズにする
		// height=1.5位置に例文を書く
		$('#noja_charsize').get(0).width = char_size*8;
		$('#noja_charsize').get(0).height = char_size*2;
		$('#noja_charsize').css({width:char_size*4, height:char_size});
		var context2 = $('#noja_charsize').get(0).getContext('2d');
		context2.font = get_canvas_font (char_size);
		context2.fillStyle = '#FFFFFF';	// これはresize時にはないが問題ないはず
		context2.fillRect(0, 0, char_size*8, char_size*2);
		context2.fillStyle = '#000000';	// これはresize時にはないが問題ないはず
		context2.fillText('あア漢Ａ１', char_size*1, char_size*1.5);
		$('#noja_char_line').text(
			(char_size/2).toFixed(2)+'px, '
			+char_num+'文字/行, '
			+line_num+'行/ページ'
		);
	};
	////////////////////////////////////////////////////////
	onResize = function() {
		size = {
			width: $('#noja_main').width(),
			height: $('#noja_main').height()
		};
		var style;
		// 親のnoja_mainが
		//#noja_main {
		//   width:100%; height:100%;
		//   position:fixed;
		//   top:0px; left:0px; right:0px;
		//  z-index:100; background-color:#CCC; overflow:hidden
		//}
		var aspect = Math.sqrt(2);
		//var aspect = (size.width / size.height);
		if ((size.width / size.height) > aspect) {
			// ルート長方形より横長:縦そのままで横補正
			var modified_width = Math.floor(size.height * aspect);
			size.width = modified_width;
			// positionデフォルトなのでstatic指定？
			// leftのデフォルトはautoなのでセンター？
			style = {
				width: size.width,
				height: size.height,
				top: '',
				left: '',
				position: ''
			};
		} else {
			// ルート長方形より縦長:横そのままで縦補正して上マージン設定
			var modified_height = Math.floor(size.width / aspect);
			var top_margin = (size.height - modified_height) / 2;
			size.height = modified_height;
			// 上下はautoにしてしまうと上に詰まるので半分の位置にマージン設定している
			style = {
				width: size.width,
				height: size.height,
				top: top_margin,
				left: 0,
				position: 'absolute'
			};
		}
		// 実際のcanvasは2倍拡大したcanvas
		size.width*=2;
		size.height*=2;
		$('#noja_canvas_main').get(0).width=size.width;
		$('#noja_canvas_main').get(0).height=size.height;
		$('#noja_canvas_main').css(style);
		// char_numからchar_sizeを計算
		char_size = calcCharSize(char_num);
		// ページの作り直し
		context = $('#noja_canvas_main').get(0).getContext('2d');
		context.font = get_canvas_font (char_size);
		showPage();
		// 表示menu部分の文字サイズ指定部分の作り直し
		remake_noja_charsize(char_size, char_num, line_num);
	};
	/////////////////////
	// 色々バリエーションが出てくるならpropで管理する
	var popupMenuList = [
		'#noja_config',
		'#noja_config2',
		'#noja_saveload',
		'#noja_link',
		'#noja_help',
		'#noja_version',
		'#noja_hyouka',
		'#noja_booklist_view',
		'#noja_download_view'
	];
	var iteratePopupMenus = function(op) {
		for (var i = 0; i < popupMenuList.length; ++i) {
			if (op(popupMenuList[i])) {
				return true;
			}
		}
		return false;
	}


	nojaOpen = function() {
		$('#noja_container').show();
		$('body').css('overflow', 'hidden');
		$('#novel_header').hide();
		onResize();
		isOpen = true;
	};
	/////////////////////
	nojaClose = function() {
		$('#noja_container').hide();
		$('#noja_menu').hide();
		$('#noja_index').hide();
		$('#noja_pages').hide();
		$('#noja_status').hide();
		closePopup();
		$('#novel_header').show();
		$('body').css('overflow', 'visible');
		isOpen = false;
	};
	/////////////////////
	closePopup = function() {
		iteratePopupMenus (function (menu) {
			$(menu).hide();
			return false;
		});
	}
	/////////////////////
	togglePopup = function(id) {
		iteratePopupMenus (function (menu) {
			if (menu === id) {
				$(menu).toggle();
			} else {
				$(menu).hide();
			}
			return false;
		});
	}
	/////////////////////
	isPopup = function() {
		return iteratePopupMenus (function (menu) {
			if ($(menu).css('display') != 'none') {
				return true;
			}
		});
	}
	/////////////////////
	nojaImport = function(text, callback){
		if(loading) {
			showStatusMessage('川・◊・)ねっとわーく接続中なのじゃー。読み込みするのは後にするのじゃー。');
			return;
		}
		var _sections = [];
		var _infos = {};
		var _kaigyou = setting.kaigyou;
		try {
			var pos = text.indexOf(download_id);
			if(pos<0) {
				showStatusMessage('(´・ω・｀)このhtmlはのじゃー用ファイルじゃないよ');
				callback(false);
			}
			pos+=download_id.length;
			var json = $.parseJSON(text.substr(pos).match(/{[^}]*}/)[0]);
			if(!valid( (_infos.site = json.site[0]) )) throw 0;
			if(!valid( (_infos.site2 = json.site[1]) )) throw 0;
			if(!valid( (_infos.ncode = json.ncode[0]) )) throw 0;
			if(!valid( (_infos.ncode2 = json.ncode[1]) )) throw 0;
			_infos.auther = json.auther;
			_infos.generalAllNo = json.general_all_no;
			if (!valid(json.tanpen)) throw 0;
			_infos.indexPageStatus = (json.tanpen)
				? INDEXPAGE_DISABLE : INDEXPAGE_NOTREADY;
			var content = $(text);
			_infos.title = content.filter('title').text();
			var main = $('#noja_download_file_main', content);
			_infos.color = main.css('color');
			_infos.bgColor = main.css('background-color');
			_infos.bgImage = main.css('background-image');
			if(_infos.bgImage===null||_infos.bgImage==='none'||_infos.bgImage==='') _infos.bgImage = null;
			else {
				_infos.bgImage = _infos.bgImage.match(/url\(([^\)]*)\)/)[1];
				_infos.bgImage = $('<img>').attr('src', _infos.bgImage).bind('load', function(){showPage();}).get(0);
				_infos.bgColor = '#FFFFFF';
			}
			_infos.currentSection = 0x7FFFFFFF;
			var fn = function(data) {
				setting = data;
				if(!valid( setting )) {
					setting = { ncode:_infos.ncode, kaigyou:false, fMaegaki:true, fAtogaki:true };
					save('ncode', setting);
				}
				setting.autoSave = setting.autoSave===true;
				setting.autoRestore = setting.autoRestore===true;
				setting.oldData = setting.oldData===true;
				main.children('div').each(function(){
					var i = parseInt($(this).attr('id').
						substr('noja_download_section_'.length));
					loadSection = i;
					_infos.currentSection = Math.min(_infos.currentSection, i);
					var sec_data = {};
					sec_data.chapter_title = $('.noja_download_chapter_title', this);
					sec_data.chapter_title = (sec_data.chapter_title.size())
						? sec_data.chapter_title.text() : '';
					//
					sec_data.subtitle = $('.noja_download_subtitle', this).text();
					//
					sec_data._maegaki = $('.noja_download_maegaki', this);
					sec_data._maegaki = (sec_data._maegaki.size()) ? sec_data._maegaki.html() : null;
					sec_data.maegaki = splitPageEx(sec_data._maegaki, line_num, char_num);
					//
					sec_data._atogaki = $('.noja_download_atogaki', this);
					sec_data._atogaki = (sec_data._atogaki.size()) ? sec_data._atogaki.html() : null;
					sec_data.atogaki = splitPageEx(sec_data._atogaki, line_num, char_num);
					//
					sec_data._honbun = $('.noja_download_honbun', this).html();
					sec_data.honbun = splitPage(sec_data._honbun, line_num, char_num);
					//
					_sections[i] = sec_data;
				});
				if(_infos.ncode!==ncode) {
					sections = _sections;
					$('#noja').empty().append(main);
					generalAllNo = _infos.generalAllNo;
					currentSection = _infos.currentSection;
					page=0;
				}
				else {
					var prev = null;
					for(var i = 1; i < _sections.length; ++i) {
						if(i in _sections) {
							if(!(i in sections)) {
								if(prev==null) $('#noja_download_file_main').prepend('<div id="noja_download_section_'+i+'">');
								else prev = prev.after('<div id="noja_download_section_'+i+'">');
							}
							prev = $('#noja_download_section_'+i);
							prev.empty();
							if (_sections[i]._maegaki !== null) {
								prev.append('<div class="noja_download_maegaki">'+_sections[i]._maegaki+'</div>');
							}
							if (_sections[i].chapter_title !== '') {
								prev.append('<div class="noja_download_chapter_title">'+_sections[i].chapter_title+'</div>');
							}
							prev.append('<div class="noja_download_subtitle">'+_sections[i].subtitle+'</div>')
							prev.append('<div class="noja_download_honbun">'+_sections[i]._honbun+'</div>');
							if (_sections[i]._atogaki!==null) {
								prev.append('<div class="noja_download_atogaki">'+_sections[i]._atogaki+'</div>');
							}
							sections[i] = _sections[i];
						} else if(i in sections) {
							prev = $('#noja_download_section_'+i);
						}
					}
					$('#noja_download_file_main').css({
						color: _infos.color,
						backgroundColor:_infos.bgColor
					});
					if(_infos.bgImage) $('#noja_download_file_main').css('background-image', 'url('+_infos.bgImage+')');
					if (_infos.generalAllNo && generalAllNo) {
						generalAllNo = Math.max(generalAllNo, _infos.generalAllNo);
					}
				}
				site = _infos.site;
				site2 = _infos.site2;
				ncode = _infos.ncode;
				ncode2 = _infos.ncode2;
				setIndexPageStatus (_infos.indexPageStatus);
				auther = _infos.auther;
				title = _infos.title;
				$('title').text(title);
				color = _infos.color;
				bgColor = _infos.bgColor;
				bgImage = _infos.bgImage;
				chapter_title = sections[currentSection].chapter_title;
				subtitle = sections[currentSection].subtitle;
				maegaki = sections[currentSection].maegaki;
				honbun = sections[currentSection].honbun;
				atogaki = sections[currentSection].atogaki;
				if (generalAllNo) {
					maxSection = generalAllNo;
				} else {
					generalAllNo = null;
					maxSection = sections.length;
				}
				if(site.indexOf('http://ncode.syosetu.com/')==0) {
					$('#noja_impression_usertype').empty();
					$('#noja_novelreview_usertype').empty();
					api = 'http://api.syosetu.com/novelapi/api/';
				}
				else if(site.indexOf('http://novel18.syosetu.com/')==0) {
					$('#noja_impression_usertype').html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
					$('#noja_novelreview_usertype').html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
					api = 'http://api.syosetu.com/novel18api/api/';
				}
				else {
					$('#noja_impression_usertype').empty();
					$('#noja_novelreview_usertype').empty();
					api='';
				}
				$('#noja_maegaki').prop('checked', setting.fMaegaki); 
				$('#noja_atogaki').prop('checked', setting.fAtogaki); 
				$('#noja_kaigyou').prop('checked', setting.kaigyou); 
				$('#noja_autosave').prop('checked', setting.autoSave);
				$('#noja_autorestore').prop('checked', setting.autoRestore);
				$('#noja_olddata').prop('checked', setting.oldData);
				$('#noja').css({color:color, backgroundColor:bgColor, backgroundImage:bgImage?'url('+bgImage.src+')':'none' });
				$('#noja_download_file_main').css({color:'', backgroundColor:'', backgroundImage:''});
				$('#noja_hyouka .novel_hyouka form').attr('action', getNovelPointRegisterURL());
				$('#noja_hyouka #noja_f_cr form').attr('action', getImpressionConfirmURL());
				$('#noja_impression_list').attr('href', getImpressionListURL());
				$('#noja_novelreview_list').attr('href', getNovelReviewListURL());
				callback(true);
			}
			load('ncode', _infos.ncode, fn);
		}
		catch(e) {
			showStatusMessage('(´・ω・｀)読み込みエラーが発生したよ。');
			callback(false);
		}
	}
	/////////////////////
	nojaSave = function(showmessage){
		showmessage = (showmessage === undefined) ? true : showmessage;
		if(loading) {
			showStatusMessage('川・◊・)ねっとわーく接続中なのじゃー。せーぶするのは後にするのじゃー。');
			return;
		}
		var fn = function() { if(showmessage) showStatusMessage('(｀・ω・´)保存したよ！'); };
		var flag = false;
		load('saveData', ncode, function(data) {
			if(!valid(data)) {
				data = {
					site: site,
					site2: site2,
					ncode: ncode,
					ncode2: ncode2,
					generalAllNo: generalAllNo,
					sections: [],
				};
			}
			if (isIndexPageReady()) {
				data.index = $('<div>')
					.append($(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box').clone()).html();
			}
			data.tanpen = isIndexPageDisable();
			data.generalAllNo = Math.max(generalAllNo, data.generalAllNo);
			data.title=title;
			data.color=color;
			data.bgColor=bgColor;
			data.auther = auther;
			data.bgImage=bgImage?$(bgImage).attr('src'):null;
			for(var i = 1; i < sections.length; ++i) {
				var sec = sections[i];
				if (sec == null || (setting.oldData && i in data.sections)) {
					continue;
				}
				data.sections[i] = {
					chapter_title: sec.chapter_title,
					subtitle: sec.subtitle,
					_maegaki: sec._maegaki,
					_atogaki: sec._atogaki,
					_honbun: sec._honbun
				};
			}
			save('saveData', data);
			if(flag) fn();
			flag = true;
		});
		load('global', 'bookList', function(data) {
			if(!valid(data)) data = {};
			data[ncode] = {title:title, auther:auther, savetime:parseInt((new Date)/1000)}
			save('global', data, 'bookList');
			if(flag) fn();
			flag = true;
		})
	};
	/////////////////////
	nojaRestore = function(_ncode, showmessage, callback) {
		showmessage = (showmessage === undefined) ? true : showmessage;
		if(loading) {
			showStatusMessage('川・◊・)ねっとわーく接続中なのじゃー。ろーどするのは後にするのじゃー。');
			return;
		}
		var _setting = setting;
		var fn = function(data) {
			if(!valid(data)) {
				if(showmessage) showStatusMessage('(´・ω・｀)保存されたデータがないよ');
				callback(false);
				return;
			}
			setting = _setting;
			$('#noja_fMaegaki').prop('checked', setting.fMaegaki);
			$('#noja_fAtogaki').prop('checked', setting.fAtogaki);
			$('#noja_kaigyou').prop('checked', setting.kaigyou);
			$('#noja_autosave').prop('checked', setting.autoSave);
			$('#noja_autorestore').prop('checked', setting.autoRestore);
			$('#noja_olddata').prop('checked', setting.oldData);
			if(ncode != _ncode) $('#noja_download_file_main').empty();
			for(var i = 1; i < data.sections.length; ++i) {
				var sec = data.sections[i];
				if(!(i in sections)&&sec!=null) {
					sections[i] = sec;
					if(sec===null) continue;
					loadSection = i;	// parseする前に設定が必要
					sec.maegaki = null;
					sec.atogaki = null;
					if ('_maegaki' in sec) {
						sec.maegaki = splitPageEx(sec._maegaki, line_num, char_num);
					}
					if ('_atogaki' in sec) {
						sec.atogaki = splitPageEx(sec._atogaki, line_num, char_num);
					}
					sec.honbun = splitPage(sec._honbun, line_num, char_num);
					autoPagerize(sec, i);
				}
			}
			if (data.tanpen) {
				setIndexPageDisabled ();
			} else if (data.index && (!isIndexPageReady() || ncode != _ncode)) {
				setIndexPageReady();
				$('#noja_index > div').html(data.index);
				var i = 0;
				$('#noja_index > div > .index_box a').each(function(){
					var ii = ++i;
					$(this).bind('click', function(){
						jumpTo(ii, 0);
						$('#noja_index').hide(100);
					});
				});
			}
			ncode2 = data.ncode2;
			site = data.site;
			site2 = data.site2;
			if(ncode!=_ncode) {
				if(!data.index) {
					setIndexPageDisabled ();
					$('#noja_index > div').empty();
				}
				title = data.title;
				$('title').text(title);
				if(site.indexOf('http://ncode')>=0) {
					$('#noja_impression_usertype').empty();
					$('#noja_novelreview_usertype').empty();
					api = 'http://api.syosetu.com/novelapi/api/';
				} else if(site.indexOf('http://novel18')>=0) {
					$('#noja_impression_usertype')
						.html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
					$('#noja_novelreview_usertype')
						.html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
					api = 'http://api.syosetu.com/novel18api/api/';
				}
				else {
					$('#noja_impression_usertype').empty();
					$('#noja_novelreview_usertype').empty();
					api='';
				}
				if (data.generalAllNo) {
					maxSection = generalAllNo = data.generalAllNo;
				} else {
					generalAllNo = null;
					maxSection = sections.length;
				}
				ncode = data.ncode;
				var i;
				for(i = 1; i < sections.length && sections[i]===null; ++i) {
					;
				}
				color = data.color;
				bgColor = data.bgColor;
				bgImage = data.bgImage;
				$('#noja').css({color:color, backgroundColor:bgColor});
				if(bgImage&&bgImage!=='none') {
					$('#noja').css('background-image', 'url('+bgImage+')');
					bgImage = $('<img>').attr('src', bgImage)
						.bind('load', function(){showPage(); }).get(0);
				} else {
					$('#noja').css('background-image', 'none');
				}
				auther = data.auther;
				$('#noja_hyouka .novel_hyouka form')
					.attr('action', getNovelPointRegisterURL());
				$('#noja_hyouka #noja_f_cr form')
					.attr('action', getImpressionConfirmURL());
				$('#noja_hyouka #noja_r_fc form')
					.attr('action', getNovelReviewConfirmURL());
				if(i===currentSection) jumpTo(-1, 0);
				else jumpTo(i, 0);
			}
			else {
				maxSection = generalAllNo =  Math.max(generalAllNo, data.generalAllNo);
				showPage();
			}
			if(showmessage) showStatusMessage('(｀・ω・´)読み込んだよ！');
			if(callback) callback(true);
		};
		if(ncode!=_ncode) {
			sections = [];
			load('ncode', _ncode, function(data) {
				if(valid(data)) _setting = data;
				else _setting = {ncode:_ncode, fMaegaki:true, fAtogaki:true, kaigyou:false}
				_setting.autoSave = _setting.autoSave === true;
				_setting.autoRestore = _setting.autoRestore === true;
				_setting.oldData = _setting.oldData === true;
				load('saveData', _ncode, fn);
			});
		}
		else load('saveData', _ncode, fn);
	};
	/////////////////////
	nojaDelete = function(_ncode) {
		deleteItem('saveData', _ncode);
		load('global', 'bookList', function(data) {
			if(!valid(data)) return;
			delete data[_ncode];
			save('global', data, 'bookList');
		});
	};
	/////////////////////
	// @@ TODO @@ template化
	createSaveData = function(min, max) {
		var buffer='<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml">\n<!--\n'+download_id+'\n{\n'+
		'"version":"'+version+'",\n'+
		'"site":["'+site+'","'+site2+'"],\n'+
		'"ncode":["'+ncode+'","'+ncode2+'"],\n';
		if (generalAllNo) {
			buffer+='"general_all_no":'+generalAllNo+',\n';
		}
		'"auther":'+auther+',\n';
		buffer+='"tanpen":'+(isIndexPageDisable())+'\n'+'}\n-->\n<head>\n<title>'
			+$('<div>').text(title).html()
			+'</title>\n<meta charset="utf-8" />\n</head>\n<body>\n<div>\n<div id="noja_download_file_main" style="color:'
			+color+';background-color:'+bgColor+';';
		if (bgImage) {
			buffer+='background-image:url('+bgImage.src+');';
		}
		buffer+='">\n';
		for(var i = min; i <= max; ++i) {
			if(i in sections&&sections[i]!==false&&sections[i]!==null) {
				var section = sections[i];
				buffer+='<div id="noja_download_section_'+i+'">\n';
				if (section._maegaki) {
					buffer += '<div class="noja_download_maegaki">'
						+section._maegaki.replace(/\r|\n/g, '')+'</div>\n';
				}
				if (section.chapter_title!=='') {
					buffer += '<div class="noja_download_chapter_title">'
						+$('<div>').text(section.chapter_title).html()+'</div>\n';
				}
				buffer += '<div class="noja_download_subtitle">'
					+$('<div>').text(section.subtitle).html()+'</div>\n';
				buffer += '<div class="noja_download_honbun">'
					+section._honbun.replace(/\r|\n/g, '')+'</div>\n';
				if (section._atogaki) {
					buffer += '<div class="noja_download_atogaki">'
						+section._atogaki.replace(/\r|\n/g, '')+'</div>\n';
				}
				buffer+='</div>\n';
			}
		}
		buffer += '</div>\n</div>\n</body>\n</html>';
		return new Blob([buffer.replace(/(<br|<img[^>]*)>/g, '$1 />')]
			,{type:'application/octet-stream'});
	};
	///////////////////////////////////////////
	// 一部ではsec !== nullがないベタ展開コードがあったが問題ないので統合
	// 一部でstart=1で呼び出している箇所があるが謎
	// デフォルト引数はFirefox系じゃないとサポートしてない(ECMA Script 6の仕様内)
	// http://kangax.github.io/es5-compat-table/es6/
	reMake = function (start) {
		if (!start) start = 0;
		for (var i = start; i < sections.length; ++i) {
			var sec = sections[i]
			if (i in sections && sec !== false && sec !== null) {
				sec.maegaki = splitPageEx(sec._maegaki, line_num, char_num, 2);
				sec.atogaki = splitPageEx(sec._atogaki, line_num, char_num, 2);
				sec.honbun = splitPage(sec._honbun, line_num, char_num);
			}
		}
	}


	///////////////////////////////////////////
	NarouSite.prototype.loadIndex = function (postprocess) {
		$.ajax({
			url: getNovelBaseURL(),
			success: function(data) {
				var index = $('.novel_title, .novel_writername, #novel_ex, .index_box'
					, data);
				$('#noja_index > div').html(index);

				var a_series = $('#noja_index div.series > a');
				if (a_series.size()) {
					a_series.attr('href', site + a_series.attr('href').slice(1));
				}
				// @@ とりあえずstyle側の修正だけで様子見
				//$('#noja_index > div > .index_box')
				//	.css('margin', '')
				//	.css('width', '')
				//	;
				// [オリジナルindex_box]
				//   margin: 0 auto 30px;
				//   width: 720px;
				var i = 0;
				$('#noja_index > div > .index_box a')
					.attr('href', null)
					.css('cursor', 'pointer')
					.each(function(){
						var ii = ++i;
						$(this).bind('click', function(){
							jumpTo(ii, 0);
							$('#noja_index').hide(100);
						});
					});
				generalAllNo = i;
				maxSection = i;
				auther = $('#noja_index .novel_writername')
					.contents()
					.not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]')
					.text().slice(3);
				postprocess (true);
			},
			error: function() {
				postprocess (false);
			}
		});
	}
	NocMoonSite.prototype.loadIndex = function (postprocess) {
		$.ajax({
			url: getNovelBaseURL(),
			success: function(data) {
				var index = $('.novel_title, .novel_writername, #novel_ex, .index_box'
					, data);
				$('#noja_index > div').html(index);
				var a_series = $('#noja_index div.series > a');
				if (a_series.size()) {
					a_series.attr('href', site + a_series.attr('href').slice(1));
				}
				// @@ とりあえずstyle側の修正だけで様子見
				//$('#noja_index > div > .index_box')
				//	.css('margin', '')
				//	.css('width', '')
				//	;
				// [オリジナルindex_box]
				//   margin: 0 auto 30px;
				//   width: 720px;
				var i = 0;
				$('#noja_index > div > .index_box a')
					.attr('href', null)
					.css('cursor', 'pointer')
					.each(function(){
						var ii = ++i;
						$(this).bind('click', function(){
							jumpTo(ii, 0);
							$('#noja_index').hide(100);
						});
					});
				generalAllNo = i;
				maxSection = i;
				auther = $('#noja_index .novel_writername')
					.contents()
					.not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]')
					.text().slice(3);
				postprocess (true);
			},
			error: function() {
				postprocess (false);
			}
		});
	}

	// 暁には全話表示モードもあるがそれはサポートしない
	// indexが20話毎という話だったが何故かallになっている
	//http://www.akatsuki-novels.com/stories/index/novel_id~6791
	// この場合でもpage~1でページは取れる
	// linkがあるかどうかで判定するしかないか？
	// タグ等の有無で判定できるかも
	// 'div.paging' or "div.paging-top"があるかないか？
	// pagingは常にlastのlinkがあるのでmax数は分かる
	// (last pageは分かる)
	// 
	//
	//http://www.akatsuki-novels.com/stories/index/novel_id~3628
	//http://www.akatsuki-novels.com/stories/index/page~16/novel_id~3628
	//現1ページ／全16ページ、20件／全306件、1～20件を表示 
	// これだと20話毎か？
	// どうも閾値か設定か何かあるようだ
	AkatsukiSite.prototype.getNovelBaseURL = function (novel_id) {
		novel_id = (novel_id === undefined) ? ncode : novel_id;
		return "http://www.akatsuki-novels.com/stories/index/novel_id~"+novel_id;
	}
	AkatsukiSite.prototype.loadIndex = function (postprocess) {
		$.ajax({
			url: this.getNovelBaseURL(),
			success: function(data) {
				// とりあえず作者部分は放置,storyも放置
				var index = $('#LookNovel, div.story table.list', data);
				$('#noja_index > div').html(index);
				// シリーズ？
				//var a_series = $('#noja_index div.series > a');
				//if (a_series.size()) {
				//	a_series.attr('href', site + a_series.attr('href').slice(1));
				//}
				//http://www.akatsuki-novels.com/stories/view/${section_id}/novel_id~${novel_id}
				// build dict: sec_no => sec_id
				// 
				this.sectionMap = {};
				var i = 0;
				var a = $('#noja_index > div > table.list a');
				a.attr('href', null)
					.css('cursor', 'pointer')
					.each(function(){
						var ii = ++i;
						$(this).bind('click', function(){
							jumpTo(ii, 0);
							$('#noja_index').hide(100);
						});
					});
				generalAllNo = i;
				maxSection = i;
				//auther = $('#noja_index .novel_writername')
				//	.contents()
				//	.not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]')
				//	.text().slice(3);
				postprocess (true);
			},
			error: function() {
				postprocess (false);
			}
		});
	}

	//http://novel.syosetu.org/1350/
	//http://novel.syosetu.org/1350/8.html
	HamelnSite.prototype.loadIndex = function (postprocess) {
		$.ajax({
			url: getNovelBaseURL(),
			success: function(data) {
				var index = $('.novel_title, .novel_writername, #novel_ex, .index_box'
					, data);
				$('#noja_index > div').html(index);
				var a_series = $('#noja_index div.series > a');
				if (a_series.size()) {
					a_series.attr('href', site + a_series.attr('href').slice(1));
				}
				// @@ とりあえずstyle側の修正だけで様子見
				//$('#noja_index > div > .index_box')
				//	.css('margin', '')
				//	.css('width', '')
				//	;
				// [オリジナルindex_box]
				//   margin: 0 auto 30px;
				//   width: 720px;
				var i = 0;
				$('#noja_index > div > .index_box a')
					.attr('href', null)
					.css('cursor', 'pointer')
					.each(function(){
						var ii = ++i;
						$(this).bind('click', function(){
							jumpTo(ii, 0);
							$('#noja_index').hide(100);
						});
					});
				generalAllNo = i;
				maxSection = i;
				auther = $('#noja_index .novel_writername')
					.contents()
					.not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]')
					.text().slice(3);
				postprocess (true);
			},
			error: function() {
				postprocess (false);
			}
		});
	}

	///////////////////////////////////////////
	// 目次読み込み
	$.templates("loadIndexTmpl"
		, '目次の読み込み中...<br /><img src="{{:image}}" />');

	loadIndex = function() {
		if (getIndexPageStatus() === INDEXPAGE_NOWLOADING) {
			return;
		}
		if (!$('#noja_loading').size()) {
			$('#noja_index > div').prepend($('<div/>').attr('id', 'noja_loading'));
		}
		$('#noja_loading').html($.render.loadIndexTmpl({image:loading2}));
		// 
		var prev = getIndexPageStatus();
		setIndexPageStatus (INDEXPAGE_NOWLOADING);
		++loading;
		siteParser.loadIndex(function (success) {
			--loading;
			if (success) {
				setIndexPageReady();
			} else {
				setIndexPageStatus (prev);
				$('#noja_loading').html('目次の読み込みに失敗しました');
			}
		});
	}

	// [2^0,2^2] = [1,4] 2.0が基準
	// min:char_num=20 line_num=17/2=8.5 で丸めて8.0
	// mid:char_num=40 line_num=17
	// max:char_num=80 line_num=17*2=34
	// 実際にはvalueは200にならない？
	// maxにしてchar_num=19
	// 横で13,10
	var calcLC = function (zoomRatio) {
		var nchars;
		var nlines;
		if (yokogaki) {
			nchars = Math.floor (14 * zoomRatio);
			nlines = Math.floor (24.5 * nchars / 29);	// initializeでは23.5だったがtypo?
		} else {
			nchars = Math.floor (20 * zoomRatio);
			nlines = Math.floor (17 * nchars / 40);
		}
		return {char_num: nchars, line_num: nlines};
	};
	// valueは[0.083... , 200.083..]が実測値
	var slidePos2ZoomRatio = function (value) {
		return Math.pow(2, (200 - value) / 100);
	};




	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////
	initialize = function() {
		// 有効なサイトであることは保証されているものの
		// 有効なページかどうかは不明で、
		// なんであってもある程度nojaの初期化が行われている
		var selectSiteParser = function(url) {
			// array.forEach: callback_fn(element, index, array)
			// 例外でしかbreakできないので素直にloopする
			for (var i = 0; i < siteParserList.length; ++i) {
				var site_parser = siteParserList[i];
				//console.dir(site_parser);
				if (site_parser.isSupportedURL(url)) {
					siteParser = new site_parser(url);
					console.debug("select: ["+i+"] "+site_parser.siteName);
					return true;
				}
			}
			console.debug("select: none");
			return false;
		}
		if (!selectSiteParser (document.URL)) {
			return;
		}

		////////////////////////////////////////////
		// initializeのstage1
		// グローバル設定の読み込み完了後にここにくる
		var initialize_stage1 = function() {
			save('global', fontType, 'fontType');
			save('global', alwaysOpen, 'alwaysOpen');
			save('global', allpage, 'allpage');
			save('global', layout, 'layout');
			save('global', slidePos, 'slidePos');
			// 計算して出す変数の設定処理
			var lc = calcLC(slidePos2ZoomRatio (slidePos));
			char_num = lc.char_num;
			line_num = lc.line_num;
			// ページ末尾にのじゃー作業用の領域を確保
			$('body').append(lsc(noja_view_html));
			// 「のじゃー」ラベルを元ページに貼り付け
			// 位置が悪い？
			// $('#head_nav')
			//	.append('<li><a id="noja_open" class="menu">のじゃー縦書リーダー</a></li>');
			$('#novelnavi_right')
				.append('<a id="noja_open" style="cursor:pointer;font-size:'
					+fontSmall
					+'; display:block; margin-top:10px;">のじゃー縦書リーダー</a>');
			// のじゃー作業用領域のフォントサイズ指定？
			$('#noja_container').css('font-size', fontSmall);

			// 基本情報を設定して次ステージへ
			if (noja_option.appmode) {
				// アプリモードだと元ページは解析済なので直接stage3へ
				noja_option.getToken(function(data) {
					token = data;
					login = (token !== '');
					color ='#000';
					initialize_stage3 ();
				});
			} else {
				// ncodeをキーとして個別設定を取り出しstage2へ
				load('ncode', ncode, initialize_stage2);
			}
		}

		////////////////////////////////////////////
		// initializeのstage2
		// 非アプリモード
		// ncodeをキーとして読み込んだ設定オブジェクトがresult引数
		// 各小説毎の固有設定を読み込んだ後
		// 貼り付け元ページの解析
		var initialize_stage2 = function (result) {
			setting = result;
			if (!valid(setting)) {
				setting = {
					ncode: ncode,
					kaigyou: false,	// 改行詰め
					fMaegaki: true,	// 前書き表示
					fAtogaki: true	// 後書き表示
				};
				save('ncode', setting);
			}
			///////////////////////////////////////
			// 元ページ解析
			if (!siteParser.parseInitialPage ()) {
				// 解析失敗した場合はindex page等のじゃーが表示できない画面
				return;
			}
			////////// menu側のcheckに状態を反映させる
			$('#noja_maegaki').prop('checked', setting.fMaegaki); 
			$('#noja_atogaki').prop('checked', setting.fAtogaki); 
			$('#noja_kaigyou').prop('checked', setting.kaigyou); 
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', currentSection);
			initialize_stage3();
		};


		///////////////////////////////////////////////
		// 多分抜き出しても大丈夫だと思うが変数束縛はチェックしていない
		var rebuild_appmode_menu = function () {
			$('#noja_link')
				.empty()
				.append(
					$('<div style="text-align:right; border-bottom-width:1px; border-bottom-style:solid;"><a id="noja_closelink">[閉じる]</a></div>')
					.bind('click', function() { $('#noja_link').hide(); })
				);
			$('#noja_import_container').html('<h4>読み込み</h4><div id="noja_file_back"><input id="noja_file" type="file" value="" accept="text/html, application/zip" multiple="true" ></div><br /><br /><a id="noja_yomikomi">保存・読み込み機能について</a>');
			$('#noja_saveload_container').append('<br /><a id="noja_booklist">保存した小説リスト</a>');
			$('#noja_version').append('<br /><br /><a id="noja_kokuhaku">関係のない話</a>');
			$('#noja_booklist').bind('click', function() {
				load('global', 'bookList', function(data) {
					var list = '';
					if(!valid(data)) list = '保存した小説はありません。'
					else {
						var buf = [];
						for(var k in data) {
							var v =  data[k];
							buf.push([k, v.title, v.auther, v.savetime]);
						}
						buf.sort(function(a, b){
							if(a[3]>b[3]) return -1;
							else if(a[3]<b[3]) return 1;
							return 0;
						});
						for (var i = 0; i < buf.length; ++i) {
							list += '<div id="noja_book_container_'+buf[i][0]
								+'"><a id="noja_book_delete_'+buf[i][0]
								+'" class="noja_book_delete">削除</a> <a id="noja_book_'+buf[i][0]
								+'" class="noja_book">'+buf[i][1]
								+'</a>　作者：'+buf[i][2]+'</div>';
						}
					}
					$('#noja_booklist_view').html('<div class="noja_close_popup"><a id="noja_closebv">[閉じる]</a></div><div>'+list+'</div>');
					$('#noja_booklist_view a.noja_book').bind('click', function(){ nojaRestore($(this).attr('id').match(/noja_book_(.*)/)[1]); closePopup(); });
					$('#noja_booklist_view a.noja_book_delete').bind('click', function(){ 
						var ncode = $(this).attr('id').match(/noja_book_delete_(.*)/)[1];
						nojaDelete(ncode);
						$('#noja_book_container_'+ncode).remove();
						console.log($('#noja_book_container_'+ncode));
					});
					$('#noja_closebv').bind('click', function() { $('#noja_booklist_view').hide(); });
					$('#noja_saveload').hide();
					$('#noja_booklist_view').show();
				});
			});
			// appのfile load関連のhandler
			var fn5 = function() {
				if (loading) {
					setTimeout(fn5, 100);
				} else {
					var files = $('#noja_file').prop('files');
					if(!files.length) return;
					var _ncode = ncode;
					// 再帰的にfilesのファイルを読み込んでいく
					// callbackはdone_callback
					var fn = function(i, callback) {
						if (i>=files.length) { callback(); return; }
						var fileData = files[i];
						if (fileData.type != "text/html"){
							showStatusMessage('(´・ω・｀)ファイルタイプが違うよ');
							return;
						}
						var reader = new FileReader();
						reader.onload = function(e){
							nojaImport(e.target.result, function(f){
								if(f) fn(i+1, callback);
							});
						}
						reader.readAsText(fileData);
					};
					showStatusMessageLoading();
					fn(0, function(){
						showStatusMessage('(｀・ω・´)読み込み終了！');
						if (ncode===_ncode) {
							showPage();
						} else {
							var i;
							for(i = 1; i < sections.length&&!(i in sections); ++i);
							if(i==currentSection) i = -1;
							jumpTo(i, 0);
						}
					}); 
				}
			};
			$("#noja_file").bind('change', fn5);
			$("#noja_yomikomi").bind('click', function(){
				nojaImport(lsc(noja_option.app_yomikomi_setumei), function(){
					jumpTo(currentSection==1?-1:1, 0);
				});
			});
			$("#noja_kokuhaku").bind('click', function(){
				nojaImport(lsc(noja_option.app_kokuhaku), function(){
					jumpTo(currentSection==1?-1:1, 0);
				});
			});
		};
		///////////////////////////////////////////////
		// アプリモードと共通のstage3
		// 設定したりないメニュー関連等を設定する
		var initialize_stage3 = function() {
			setting.autoSave = setting.autoSave===true;
			setting.autoRestore = setting.autoRestore===true;
			setting.oldData = setting.oldData===true;
			nextSection = currentSection;
			maxSection = currentSection;
			$('#noja_autosave').prop('checked', setting.autoSave);
			$('#noja_autorestore').prop('checked', setting.autoRestore);
			$('#noja_olddata').prop('checked', setting.oldData);
			$('#noja_always_open').prop('checked', alwaysOpen);
			$('#noja_layout').prop('checked', layout); 
			$('#noja_mincho').prop('checked', fontType==='mincho'); 
			$('#noja_yokogaki').prop('checked', yokogaki); 
			$('#noja_gothic').prop('checked', fontType==='gothic'); 
			$('#noja_allpage').prop('checked', allpage); 
			$('#noja_drag').css('left', slidePos - 5);

			////////// 「関連」 menu /////////
			siteParser.setupLinkMenu ($('noja_link'));
			console.debug("setupLinkMenu done");

			////////// version menu /////////
			$('#noja_version h4').text('のじゃー縦書リーダー ver.'+version);
			////////// open closeのメニュー //////
			$('#noja_open').bind('click', nojaOpen);
			$('#noja_close').bind('click', nojaClose);

			///////// コンテンツメイン画面のイベントハンドラ ////////////
			$('#noja_main').bind('mousemove', function(e){
				if (e.clientY < 10) {
					// menu popup
					$('#noja_menu').show(100);
				} else if (!isIndexPageDisable() && e.clientX < 10) {
					// 目次slide slider
					if (isIndexPageNotReady()) {
						loadIndex();
					}
					$('#noja_index').show(100);
				} else if ($(this).width() - e.clientX < 10) {
					// page jump index slider
					$('#noja_pages').show(100);
				} else {
					// その他ならall hide
					$('#noja_menu').hide(100);
					$('#noja_pages').hide(100);
					$('#noja_index').hide(100);
				}
			})
			.bind('click', function(e) {
				// popupがopenしていたら最初のはclose操作
				if (isPopup()) {
					closePopup();
					return;
				}
				// 左半分かどうかのboolとyokogakiモードのboolで判定
				// 左かつ縦書き||右かつ横書きならnext
				var isLeftPage = (e.clientX < $('#noja_main').width() / 2);
				// invert if yokogaki mode
				load_next_direction (isLeftPage, true);
			});
			var mouseWheelHandler = function (delta) {
				var isForward = (delta < 0);	//wheel移動量が負(forward)
				if (isPopup()) {
					// popup openのとき:評価dialogだけ特殊
					// closeしない条件は
					// 評価popup中
					// forward移動
					// 最終話の最終ページ
					if ($('#noja_hyouka').css('display') != 'none'
						&& isForward
						&& currentSection === generalAllNo
						&& isLastPageInSection(page)
						) {
						return;
					}
					closePopup();
					return;
				}
				load_next_direction (isForward, false);
			};
			// firefox以外？(chrome)
			$('#noja_main').get(0).addEventListener("mousewheel" , function(e) {
				mouseWheelHandler(e.wheelDelta / 40);
			});
			// firefox用
			$('#noja_main').get(0).addEventListener("DOMMouseScroll" , function(e) {
				mouseWheelHandler(-e.detail);	// 移動量がFirefox以外とは逆
			});
			var joutai = null;
			$(window).bind('resize', onResize).bind('keydown', function(e) {
				var VK_R = 82;
				var VK_S = 83;
				if (isOpen && e.ctrlKey && e.which===VK_S) {
					nojaSave();
					e.preventDefault();
					return;
				}
				if (isOpen && e.ctrlKey && e.which===VK_R) {
					nojaRestore(ncode);
					e.preventDefault();
					return;
				}
				var VK_ESC = 27;
				if (isPopup()) {
					if(e.which === VK_ESC) {
						closePopup();
						e.preventDefault();
					}
					return;
				}
				if (!isOpen) {
					if (e.which === VK_ESC) {
						nojaOpen();
					}
					return;
				}
				var VK_PAGEUP   = 33;
				var VK_PAGEDOWN = 34;
				var VK_END      = 35;
				var VK_HOME     = 36;
				var VK_LEFT     = 37;
				var VK_UP       = 38;
				var VK_RIGHT    = 39;
				var VK_DOWN     = 40;
				var VK_SPACE    = 32;
				switch (e.which) {
				case VK_LEFT:
					// dirction_next=false, invert if yokogaki
					load_next_direction (true, true);
					break;
				case VK_RIGHT:
					// dirction_next=false, invert if yokogaki
					load_next_direction (false, true);
					break;
				case VK_UP:
					jumpTo(currentSection - 1, 0);
					break;
				case VK_DOWN:
					jumpTo(currentSection + 1, 0);
					break;
				case VK_PAGEUP:
				case VK_HOME:
					// 現在のsectionの先頭
					jumpTo (currentSection, 0);
					break;
				case VK_PAGEDOWN:
				case VK_END:
					// 現在のsectionの最終
					jumpTo (currentSection, -1);
					break;
				case VK_ESC:
					nojaClose();
					break;
				case VK_SPACE:
					// 前書き後書き表示をtoggle disable,enable,restore
					if (setting.fMaegaki && setting.fAtogaki) {
						$('#noja_maegaki').prop('checked', setting.fMaegaki = false);
						$('#noja_atogaki').prop('checked', setting.fAtogaki = false);
					} else if (joutai) {
						$('#noja_maegaki').prop('checked', setting.fMaegaki = joutai.m);
						$('#noja_atogaki').prop('checked', setting.fAtogaki = joutai.a);
						joutai = null;
					} else {
						if (setting.fMaegaki !== setting.fAtogaki) {
							joutai = {
								m: setting.fMaegaki,
								a: setting.fAtogaki
							};
							$('#noja_maegaki').prop('checked', setting.fMaegaki = true);
							$('#noja_atogaki').prop('checked', setting.fAtogaki = true);
						}
					}
					jumpTo (-1, 0);	// 前書き後書き表示を変更したのでreload
					save('ncode', setting);
					showStatusMessage('前書き表示：'+(setting.fMaegaki ? 'ON' : 'OFF')
						+'　後書き表示：'+(setting.fAtogaki ? 'ON' : 'OFF'));
					break;
				default:
					return;
				}
				e.preventDefault();
			});
			////// menu関連のcheckbox等
			$('#noja_maegaki').bind('click', function() {
				joutai = null;
				setting.fMaegaki = $(this).prop('checked');
				save('ncode', setting);
				if (maegaki != null) {
					if (setting.fMaegaki) {
						// disable->enableなのでページ数が前書き分増える
						jumpTo(-1, page + maegaki[0].length);
					} else {
						// enable->disableなのでページ数が前書き分減る
						// 前書き内にいた場合は0で先頭へ
						jumpTo(-1, Math.max(0, page - maegaki[0].length));
					}
				}
			});
			$('#noja_atogaki').bind('click', function() {
				joutai = null;
				setting.fAtogaki = $(this).prop('checked');
				save('ncode', setting);
				if (atogaki != null) {
					if (!setting.fAtogaki) {
						var len = honbun[0].length;
						var p = page;
						if (setting.fMaegaki && maegaki != null) {
							len += maegaki[0].length;
						}
						if (p >= len) {
							p = len - 1;
						}
						jumpTo(-1, p);
					} else {
						jumpTo(-1, page);
					}
				}
			});
			$('#noja_layout').bind('click', function() {
				layout = $(this).prop('checked');
				save('global', layout, 'layout');
				reMake();	// nullcheckが入ってないがほぼ同じなので統合
				jumpTo(-1, page);	// レイアウト変更の場合はページ位置は移動しなくてOk?
			});

			var fontChangeHandler = function (font_type, font_family) {
				fontType = font_type;
				fontFamily = font_family;
				save('global', fontType, 'fontType');
				context.font = get_canvas_font (char_size);
				showPage();
			}

			$('#noja_mincho').bind('click', function() {
				fontChangeHandler('mincho', mincho);
			});
			$('#noja_gothic').bind('click', function() {
				fontChangeHandler('gothic', gothic);
			});
			$('#noja_kaigyou').bind('click', function() {
				setting.kaigyou = $(this).prop('checked');
				save('ncode', setting);
				reMake();
				jumpTo(-1, 0);
			});
			$('#noja_always_open').bind('click', function() {
				alwaysOpen = $(this).prop('checked');
				save('global', alwaysOpen, 'alwaysOpen');
			});
			$('#noja_autosave').bind('click', function() {
				setting.autoSave = $(this).prop('checked');
				save('ncode', setting);
			});
			$('#noja_autorestore').bind('click', function() {
				setting.autoRestore = $(this).prop('checked');
				save('ncode', setting);
			});
			$('#noja_olddata').bind('click', function() {
				setting.oldData = $(this).prop('checked');
				save('ncode', setting);
			});
			$('#noja_allpage').bind('click', function() {
				allpage = $(this).prop('checked');
				showPage();
				save('global', allpage, 'allpage');
			});
			$('#noja_yokogaki').bind('click', function() {
				yokogaki = $(this).prop('checked');
				var lc = calcLC(slidePos2ZoomRatio (slidePos));
				char_num = lc.char_num;
				line_num = lc.line_num;
				reMake();
				onResize();
				jumpTo(-1, 0);
				save('global', yokogaki, 'yokogaki');
			});
			///////// フォントサイズスライダー /////////
			var dragging = false;
			var span;
			$('#noja_drag').bind('mousedown', function(e) {
				dragging = true;
				span = e.clientX-$('#noja_drag').offset().left-5;
			});
			$(document).bind('mouseup', function(){
				if (dragging) {
					dragging = false;
					// [0.083... , 200.083..]が実測値
					slidePos = $('#noja_drag').offset().left + 4 - $('#noja_dragback').offset().left;
					var lc = calcLC(slidePos2ZoomRatio (slidePos));
					char_num = lc.char_num;
					line_num = lc.line_num;
					save('global', slidePos, 'slidePos');
					// cacheをpurgeして再構築
					// ほぼreMake()だが判定がちょい単純化されているのが謎
					// (null checkがない)
					// startが1なのも違う
					reMake(1);	// 開始が1になっているのが謎な部分
					onResize();
					jumpTo(-1, 0);
				}
			});
			$(document).bind('mousemove', function(e){
				if (dragging) {
					var left = e.clientX;
					// マウス座標とスライダーの位置関係で値を決める
					var value = e.clientX-$('#noja_dragback').offset().left-span;
					// スライダーからはみ出したとき
					if (value < 0) {
						value = 0;
					} else if (value > $('#noja_dragback').width()) {
						value = $('#noja_dragback').width();
					}
					$('#noja_drag').css('left', value-5);
					var lc = calcLC(slidePos2ZoomRatio (value));
					var char_num = lc.char_num;
					var line_num = lc.line_num;
					remake_noja_charsize(calcCharSize(char_num), char_num, line_num);
				}
			});
			////////////////
			$('#noja_index > a').bind('click', loadIndex);
			$('#noja_openconfig').bind('click', function() {
				togglePopup('#noja_config');
				var left = $('#noja_openconfig').offset().left;
				var width = $('#noja_config').width();
				var max = $('#noja_main').width();
				if (left + width + 22 > max) left = max-width-22;
				$('#noja_config').css({left:left, top:$('#noja_menu').height()});
			});
			$('#noja_openconfig2').bind('click', function() {
				togglePopup('#noja_config2');
				var left = $('#noja_openconfig2').offset().left;
				var width = $('#noja_config2').width();
				var max = $('#noja_main').width();
				if (left + width + 22 > max) left = max-width-22;
				$('#noja_config2').css({left:left, top:$('#noja_menu').height()});
			});
			$('#noja_closeconfig').bind('click', function() { $('#noja_config').hide(); });
			$('#noja_closeconfig2').bind('click', function() { $('#noja_config2').hide(); });
			$('#noja_opensaveload').bind('click', function() { togglePopup('#noja_saveload'); });
			$('#noja_closesaveload').bind('click', function() { $('#noja_saveload').hide(); });
			$('#noja_openlink').bind('click', function() {
				togglePopup('#noja_link');
				var left = $('#noja_openlink').offset().left;
				var width = $('#noja_link').width();
				var max = $('#noja_main').width();
				if (left + width + 22 > max) left = max-width-22;
				$('#noja_link').css({left:left, top:$('#noja_menu').height()});
			});
			$('#noja_closelink').bind('click', function() { $('#noja_link').hide(); });
			$('#noja_openhelp').bind('click', function() { togglePopup('#noja_help');});
			$('#noja_closehelp').bind('click', function() { $('#noja_help').hide(); });
			$('#noja_openversion').bind('click', function() { togglePopup('#noja_version'); });
			$('#noja_closeversion').bind('click', function() { $('#noja_version').hide(); });
			$('#noja_openhyouka').bind('click', function() { togglePopup('#noja_hyouka') });
			$('#noja_closehyouka').bind('click', function() { $('#noja_hyouka').hide(); });
			$('#noja_closedv').bind('click', function() { $('#noja_download_view').hide(); });
			$('#noja_save').bind('click', function() { nojaSave(); });
			$('#noja_restore').bind('click', function() { nojaRestore(ncode); });
			$('#noja_download').bind('click', function() {
				var evt = document.createEvent("MouseEvents");
				evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				$('<a>').attr({href:URL.createObjectURL(createSaveData(1, sections.length-1)), download:title+'.noja.html'}).get(0).dispatchEvent(evt);
			});
			$('#noja_download2').bind('click', function() {
				var evt = document.createEvent("MouseEvents");
				evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				var f=function(i){return i<10?'0'+i:''+i; };
				var D = new Date();
				var Y = D.getFullYear(); 
				var m  = f(D.getMonth()+1); 
				var d = f(D.getDate());
				var h = f(D.getHours()); 
				var i  = f(D.getMinutes()); 
				var s  = f(D.getSeconds());
				$('<a>').attr({href:URL.createObjectURL(createSaveData(1, sections.length-1)), download:title+'('+Y+'-'+m+'-'+d+' '+h+'-'+i+'-'+s+').noja.html'}).get(0).dispatchEvent(evt);
			});
			$('#noja_download3').bind('click', function() {
				$('#noja_dv_main').empty();
				for (var i = 1; i < sections.length; ++i) {
					if (i in sections) {
						$('#noja_dv_main')
							.append(
								$('<a>').attr({
									href: URL.createObjectURL(createSaveData(i, i)),
									download: title+' - '+i+' - '+sections[i].subtitle
										+'.noja.html'
								}).html(''+i+'. '+sections[i].subtitle)
							).append('<br>');
					}
				}
				closePopup();
				$('#noja_download_view').show();
			});
			$('#noja_hyouka td:eq(0)').html(lsc(hyouka_html));
			$('#noja_hyouka td:eq(1)').empty()
				.append(lsc(hyoukanavi_html))
				.append(lsc(kansou_html));
			$('#noja_hyouka .hyoukanavi a:eq(0)').bind('click', function(){
				$('#noja_f_cr').show();
				$('#noja_r_fc').hide();
			});
			$('#noja_hyouka .hyoukanavi a:eq(1)').bind('click', function(){
				$('#noja_f_cr').hide();
				$('#noja_r_fc').show();
			});
			size = {width:800};
			//////////////////////////////////////////////
			// appmodeならlink部分は作り直し
			//////////////////////////////////////////////
			if (noja_option.appmode) {
				rebuild_appmode_menu ();
			}
			//////////////////
			// 次stageへのchain: appmodeだとコンテンツ読み込み経由の非同期
			if (noja_option.appmode) {
				nojaImport(lsc(noja_option.app_setumei), function(){
					initialize_stage4();
				});
			} else {
				initialize_stage4();
			}
		}

		///////////////////////////////////////////////////////////
		// 評価formの構築
		// 変数束縛は確認していない
		var build_hyouka_form = function() {
			var h = $('#noja_hyouka');
			h.find('.novel_hyouka form').attr('action', getNovelPointRegisterURL());
			h.find('.novel_hyouka .agree')
				.html('<input type="hidden" value="'
				+(login
					? (token+'" name="token" /><input type="submit" class="button" value="評価する" id="pointinput" />')
					:  ('" name="token" />※評価するにはログインしてください。')
				));
			if (!noja_option.appmode
				&& site.indexOf('http://novel18.syosetu.com/') == 0) {
				['#noja_impression_usertype', '#noja_novelreview_usertype']
					.forEach(function (elem) {
						$(elem).html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
				});
			}
			var i = 0;
			h.find('.RadioboxBigOrb a').each(function() {
				var ii = ((i++) % 5) + 1;
				var fn = function() {
					h.find('.RadioboxBigOrb a[name="'+$(this).attr('name')+'"]')
						.removeClass('RadioboxCheckedBigOrb')
						.addClass('RadioboxUncheckedBigOrb');
					$(this).addClass('RadioboxCheckedBigOrb')
						.removeClass('RadioboxUncheckedBigOrb');
					$('#noja_'+$(this).attr('name')+ii).prop('checked', true);
				};
				$(this).bind('click', fn).bind('press', fn);
			});

			var impr_form = $('#noja_f_cr > form');
			impr_form.attr('action', getImpressionConfirmURL());
			// idついているのでは？
			impr_form.children('div:eq(0)').children('a:eq(0)')
				.attr('href', getImpressionListURL());
			if (login) {
				impr_form.append('<input type="submit" class="button" value="感想を書く" id="impressionconfirm">');
			} else {
				impr_form.children('div:eq(0)').children('div:eq(0)')
					.before('※感想を書く場合は<a href="http://syosetu.com/login/input/" style="color:#0033cc;">ログイン</a>してください。<br>');
			}

			var revw_form = $('#noja_r_fc > form');
			revw_form.attr('action', getNovelReviewConfirmURL());
			revw_form.children('div:eq(0)').children('a:eq(0)')
				.attr('href', getNovelReviewListURL());
			if (login) {
				revw_form.append('<input type="submit" class="button" value="レビュー追加" id="reviewinput">');
			} else {
				revw_form.children('div:eq(0)').children('div:eq(0)')
					.before('※レビューを書く場合は<a href="http://syosetu.com/login/input/" style="color:#0033cc;">ログイン</a>してください。<br>');
			}


			h.find('.hyouka_in:eq(1) > a')
				.attr('href', 'http://twitter.com/intent/tweet?text='
					+encodeURIComponent(getNovelBaseURL()+'\n「'+title
						+'」読んだ！\n#narou #narou'+ncode.toUpperCase())
				).find('img').attr('src', twitter_banner);
		};
		///////////////////////////////////////////////////////////
		var initialize_stage4 = function() {
			console.debug("stage4: updateNavigation");
			updateNavigation();
			console.debug("stage4: build hyouka form");
			build_hyouka_form();
			///////////////////////////////////////////////////
			// 設定が終わったのでresizeでジオメトリを更新
			console.debug("stage4: onResize");
			onResize();
			if (setting.autoRestore) {
				nojaRestore(ncode, false, function(){
					if (setting.autoSave) {
						nojaSave(false);
					}
					if (alwaysOpen) {
						$('#noja_container').ready(nojaOpen());
					}
				});
			} else {
				if (setting.autoSave) {
					nojaSave(false);
				}
				if (alwaysOpen) {
					$('#noja_container').ready(nojaOpen());
				}
			}
		};

		///////////////////////////////////////////////////////
		// まずローカルストレージからの設定取り出し
		(function(ls) {
			if (ls) {
				var buf1 = {};
				var buf2 = {};
				var buf3 = [];
				for(var i = 0; i < ls.length; ++i) {
					var k = ls.key(i);
					var v = ls.getItem(k);
					switch(k) {
					case 'noja_alwaysOpen': buf1.alwaysOpen = v==='true'; break;
					case 'noja_allpage': buf1.allpage = v==='true'; break;
					case 'noja_layout': buf1.layout = v==='true'; break;
					case 'noja_fontType': buf1.fontType = v; break;
					case 'noja_slidePos': buf1.slidePos = parseInt(v); break;
					default:
						k.match(/(noja)_([^_]*)_(fMaegaki|fAtogaki|kaigyou)/);
						if(RegExp.$1==='noja') {
							if(RegExp.$2==='undefined'||RegExp.$2 === 'novelview') break;
							if (!(RegExp.$2 in buf2)) buf2[RegExp.$2] = { ncode:RegExp.$2 }; 
							buf2[RegExp.$2][RegExp.$3] = v===true;
						}
						else continue;
					}
					buf3.push(k);
				}
				for (var i in buf1) save('global', buf1[i], i);
				for (var i in buf2) save('ncode', buf2[i]);
				for (var i = 0; i < buf3.length; ++i) ls.removeItem(buf3[i]);
			}
		})(noja_option.localStorage);

		// 非同期に設定を読み込んでいるのでどれがどの順番で読まれるか不明
		// 終わった段階でinitialize_stage1()が呼ばれる
		var i = 6;
		load('global', 'fontType', function(result){
			fontType = (result !=='gothic') ? 'mincho' : 'gothic';
			if (fontType === 'gothic') {
				fontFamily = gothic;
			}
			if (--i===0) initialize_stage1();
		});
		load('global', 'alwaysOpen', function(result){
			alwaysOpen = (noja_option.appmode)
				? (result !== false) : (result === true);
			if (--i===0) initialize_stage1();
		});
		load('global', 'allpage', function(result){
			allpage = result === true;
			if (--i===0) initialize_stage1();
		});
		load('global', 'yokogaki', function(result){
			yokogaki = result === true;
			if (--i===0) initialize_stage1();
		});
		load('global', 'layout', function(result){
			layout = result === true;
			if (--i===0) initialize_stage1();
		});
		load('global', 'slidePos', function(result){
			slidePos = (!valid(result)) ? 100 : result;
			if (--i===0) initialize_stage1();
		});

	};

	//最後に初期化して終了。
	initialize();
});
