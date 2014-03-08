/*jshint laxbreak: true, laxcomma: true, unused:false, newcap:false */
/*global noja_option:false, $:false, console:false */
/*! のじゃー縦書リーダー ver.1.13.* (c) 2013 ◆TkfnIljons */
$(document).ready(function(){
	'use strict';

	// constとして扱うものは全大文字

	//バージョンはアップデートの前に書き換えろよ！　絶対だかんな！
	var NOJA_VERSION = '1.13.901.2+p10+kai-p4';

	//なろうapiにアクセスするときのgetパラメータ
	var NAROUAPI_AJAX_GET_OPT = noja_option.ajax_get_opt;
	//同データタイプ
	//var NAROUAPI_AJAX_DATA_TYPE = noja_option.ajax_data_type;

	//リソースのURL

	//のじゃーのメインビュー
	// bodyにappendされるので普通にアクセスできる
	var NOJA_VIEW_HTML = noja_option.noja_view_html;
	//評価フォーム
	// NOJA_VIEW_HTMLの中にappendされる
	var HYOUKA_HTML = noja_option.hyouka_html;
	//感想フォームの選択部分
	var HYOUKANAVI_HTML = noja_option.hyoukanavi_html;
	//感想・レビューフォーム
	var KANSOU_HTML = noja_option.kansou_html;
	//ツイッターのバナー
	var IMG_TWITTER_BANNER = noja_option.twitter_banner;
	//読み込み中アイコン小(ステータスバー用)
	var ICON_LOADING1 = noja_option.loading1;
	//読み込み中アイコン大(目次用)
	var ICON_LOADING2 = noja_option.loading2;

	//上記リソースを読み込む用関数。
	//実際はacync:falseで(ローカルにあるファイルだから
	// 同期しちゃって大丈夫)ajaxやってるだけなんだけど、
	//火狐版だとこのスクリプトからはクロスドメインできないんだよ……
	var fncLsc = noja_option.loadSubContent;

	var fncSave = noja_option.save;
	// key省略のときはvalue.ncodeがデフォルトになるようだ(ncode専用)
	var fncSave_ncode = function (value) {
		fncSave ('ncode', value);
	};
	var fncSave_global = function (key, value) {
		fncSave ('global', value, key);
	};

	// fncLoadは非同期callbackだったがdefferedに変更
	var fncLoad = noja_option.load;
	var fncDeleteItem = noja_option.deleteItem;

	//定数

	//ここらへんは変更できるようにするかも


	$.templates('canvasFontTmpl', '{{:fontWeight}} {{:fontSize}}px {{:fontFamily}}');

	//フォントのウェイト。大きく描いて縮小すると微妙に細くなるので太めに
	var FONTWEIGHT = 800;
	//メニュー項目などの小さいフォントのサイズ
	var FONTSMALL = '10.5pt';
	//ページナビゲーションの小さいフォントのサイズ
	var FONTXSMALL = '7pt';

	//ここからは不変

	//半角文字列の列挙
	var HANKAKU = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ｧｱｨｲｩｳｪｴｫｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂｯﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝﾞﾟ･';
	//１文字で縦中横の対象になる文字
	var TATECHUYOKO = '0123456789!?';
	//全角で回転の対象になる文字
	var ZENKAKUKAITEN = '―－－｜￣＿‐‥…＜＞≦≧＝≠≡∈∋⊆⊇⊂⊃（）「」｛｝《》〈〉『』【】［］〔〕〘〙〚〛～｜─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂≪≫←↑→↓〜⇒⇔≒：；';
	//行末禁則処理で調べる文字
	var GYOUMATSUKINSOKU = '（「｛〈《『【［〔〘〚〝“‘';
	//行頭禁則処理のうち、追い出しをする文字
	var GYOUTOUKINSOKU = '!?！？・：；:;‐-=＝〜～ゝゞーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎ\u3095\u3096\u31F0\u31F1\u31F2\u31F3\u31F4\u31F5\u31F6\u31F7\u31F8\u31F9\u31F7\u31FA\u31FB\u31FC\u31FD\u31FE\u31FF\u3005\u303B';
	//行頭禁則処理のうち、ぶら下げをする文字
	var BURASAGE = '、。，．）」｝〉》』】］〕〙〛〟”’　';
	//表示位置を変更する小文字
	var KOMOJI = 'ぃゃぃゃぉゅぁっぃょュゎァッィぅぇゥェォヵヶャョヮ\u3095\u3096\u31F0\u31F1\u31F2\u31F3\u31F4\u31F5\u31F6\u31F7\u31F8\u31F9\u31F7\u31FA\u31FB\u31FC\u31FD\u31FE\u31FF';
	//標準的な明朝体フォントの列挙
	var FONTFAMILY_MINCHO = '"ＭＳ 明朝","MS Mincho","ヒラギノ明朝 ProN W3","Hiragino Mincho ProN","ヒラギノ明朝 Pro W3","Hiragino Mincho Pro","Takao明朝","TakaoMincho","IPA モナー 明朝","IPA mona Mincho","さざなみ明朝","Sazanami Mincho","IPA明朝","IPAMincho","東風明朝","kochi Mincho"';
	var FONTTYPE_MINCHO = 'mincho';
	//標準的なゴシック体フォントの列挙
	var FONTFAMILY_GOTHIC = '"ＭＳ ゴシック","MS Gothic","ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","ヒラギノ角ゴ Pro W3","Hiragino Kaku Gothic Pro","Takaoゴシック","TakaoGothic","IPA モナー ゴシック","IPA mona ゴシック","VL ゴシック","VL Gothic","IPAゴシック","IPAGothic","Osaka－等幅","Osaka-Mono","東風ゴシック","Kochi Gothic"';
	var FONTTYPE_GOTHIC = 'gothic';

	//ダウンロードファイルにコメントで仕込むデータ。
	var DOWNLOAD_ID = '@noja{7B87A1A7-2920-4281-A6D9-08556503D3E5}';


	// 固定パラメータ
	var getMarginOfPageNumber = function (fontSize) {
		return {
			x: fontSize * 2,	// 両端2文字空け
			y: fontSize * 1,
		};
	};
	// 上柱領域・ノンブル領域の処理(右ページ)
	var getMarginOfUpperRunningHead = function (fontSize) {
		return {
			x: 4 * fontSize,
			y: 2 * fontSize,	// 実際には2～3行or 2.5行
			// 2～3行目の2行分を1行で使う場合のy位置
			y_center: 2.5 * fontSize,
		};
	};
	var alignRight = function (x, ctx, text) {
		return x - ctx.measureText(text).width;
	};
	var alignLeft = function (x, ctx, text) {
		return x;
	};
	//追加:1画面あたりのページ数(単ページ対応への布石)
	var gPagesPerCanvas = 2;
	// 判型可変化への対応
	var gEnableFlexibleAspect = true;

	//プロパティ
	//
	//なろうapiで取って来るgeneral_all_no。つまり全話数。
	//まあ目次読み込んだらいいって話もあるんだけど。
	var gGeneralAllNo = null;

	//表示部分のサイズ。実際のサイズの2倍
	var gMainSize = {
		width: 0,
		height: 0,
	};
	//文字サイズ。デフォルトはページ縦幅/48
	var gCharFontSize;
	//ページあたりの行数
	var gLinesPerCanvas;
	//行あたりの文字数
	var gCharsPerLine;

	//ページナビゲーションのサムネイルの幅と高さ。横800固定。実際の表示サイズはこの1/5
	var gThumbSize = {
		width:  800,
		height: 800 / Math.sqrt(2)
	};
	//ページナビゲーションのサムネイルの文字サイズ。
	var gThumbFontSize = gThumbSize.height / 48;

	var gLineRatio = 1.7;	// ルビ分で0.7追加

	//のじゃーが起動しているか否かのフラグ
	var gIsNojaOpen = false;
	//読み込み中にセットされるページとセクション番号。
	//読み込み前に保存した数が終了後と同じだったらそのまま新しく読み込んだ話にジャンプ
	//そうでなかったらユーザーの操作で移動したことになるため、ジャンプしない
	var gNextPage = 0;
	var gNextSection;
	//現在のセクションの合計表示ページ数。
	var gTotalPages;
	//画像onLoad時にページナビゲーションを再描写するかどうか決めるために使う
	var gLoadSection;
	//メイン画面のコンテキスト。
	var gMainContext;


	// objectとして隠蔽する

	//目次が読み込まれているかどうかのフラグ。ture:読み込まれている、false:読み込み失敗、null:読み込むな（短編）
	var gIsIndexPageAvailable;

	var INDEXPAGE_READY = true;
	var INDEXPAGE_NOTREADY = false;
	var INDEXPAGE_DISABLE = null;
	var INDEXPAGE_NOWLOADING = 0;

	var setIndexPageStatus = function (status) {
		gIsIndexPageAvailable = status;
	};
	var getIndexPageStatus = function () {
		return gIsIndexPageAvailable;
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

	//////////////////////////////////////////////////////////////////////
	//データ

	//////////////////////////////
	//現在読んでいる話(第一話が1)
	var gCurrentSection = {};
	gCurrentSection.id = 0;		// constなデータというよりはview側の事情
	//現在表示しているページ(ページ番号はこれ+1)
	gCurrentSection.page = 0;		// constなデータというよりはview側の事情
	//////////////////////////////
	//話データの配列。
	var sections = [];
		// これらの5要素が保存される
		// ただし、文章部分はraw側が保存される
		//章タイトル
		gCurrentSection.chapter_title = null;
		//サブタイトル
		gCurrentSection.subtitle = null;
		//本文と前書きと後書きをパースしたデータ
		//
		//
		gCurrentSection.honbun  = null;	// [0] body [1] ruby
		gCurrentSection.maegaki = null;	// [0] body [1] ruby
		gCurrentSection.atogaki = null;
	//////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//読み込み中フラグ
	var gLoading = 0;

	//////////////////////////////////////////////////////////////////////
	//設定
	var gSetting = {};
	//var fncSave_ncode = function (setting) {

	//////////// 保存される設定
	//フォントタイプ(FONTTYPE_MINCHO | FONTTYPE_GOTHIC)
	var gFontType;
	//前書き、後書きのレイアウト（枠線を付けるか否か）
	var gLayout;	//
	//ページ読み込み直後に開くかどうか
	var gAlwaysOpen;	//
	//累計ページ数を表示するかどうか
	var gAllpage;	//

	//文字サイズ設定スライドバーの位置
	var gSlidePos;
	//縦書リーダーなのに横書で読みたいという酔狂な人のために
	var gYokogaki = true;




	////////// これは保存されない設定
	// せっかく取ってきたデータだし、ページに埋め込もうぜ、と
	var gAutoPage = false;



	// font_type : font_familyのmapをどうするか？
	// 補正倍率は文字コードのmapのほうが汎用的だが…
	var gFontTypeTable = {
		'mincho': {
			family: FONTFAMILY_MINCHO,
			metric: {x: 11/12, y: 5/6},	// 'ー'の補正倍率
		},
		'gothic': {
			family: FONTFAMILY_GOTHIC,
			metric: {x: 5/6, y: 7/8},	// 'ー'の補正倍率
		},
	};
	//フォントファミリ
	var getFontFamily = function (font_type, default_value) {
		font_type = (font_type === undefined)
			? gFontType : font_type;
		return (font_type in gFontTypeTable)
			? gFontTypeTable[font_type].family
			: (default_value === undefined) ? '' : default_value
			;
	};
	var getFontMetric = function (font_type, default_value) {
		font_type = (font_type === undefined) ? gFontType : font_type;
		return (font_type in gFontTypeTable)
			? gFontTypeTable[font_type].metric
			: (default_value === undefined) ? {x: 1, y:1} : default_value
			;
	};

	var setFontType = function (font_type, save) {
		gFontType = font_type;
		if (save) {
			fncSave_global ('fontType', gFontType);
		}
	};





	//////////////////////////////////////////////////////////////////////
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
	var splitContentsBody;

	//指定話の指定ページにジャンプ
	var jumpTo;
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





	//////////////////////////////////////////////////////////////////////
	var gSiteParser;

	var CURRENT_SECTION_NO_WITH_RELOAD = -1;
	var FIRST_SECTION_NO = 1;
	var FIRST_PAGE_NO = 0;
	var LAST_PAGE_NO = -1;	// 負のindexはend-x(endは最終+1)

	//////////////////////////////////////////////////////////////////////
	//こっから関数の実体定義
	valid = function (x) { return typeof x !== 'undefined'; };

	var getObj = function (selector, ctx, default_value) {
		default_value = (default_value === undefined) ? null : default_value;
		var obj = $(selector, ctx);
		return (obj.size()) ? obj : default_value;
	};
	var getHtml = function (selector, ctx, default_value) {
		default_value = (default_value === undefined) ? null : default_value;
		var obj = $(selector, ctx);
		return (obj.size()) ? obj.html() : default_value;
	};
	var getText = function (selector, ctx, default_value) {
		default_value = (default_value === undefined) ? '' : default_value;
		var obj = $(selector, ctx);
		return (obj.size()) ? obj.text() : default_value;
	};



	// 変数props検索&関数callの基本コスト分だけオーバーヘッドがあるが
	// コード内で文字列が飛び交うのは好みではないので…
	// (それでなくても文字列だらけになるものだし)
	var menuFrame = {
		duration: 100,
		id: 'noja_menu',
		selector: '#noja_menu',
		////
		$: function () {
			return $('#noja_menu');
		},
		////
		// どうもshow()とshow(0)では違うという話
		// show(undefined)とかshow(false)とかshow(null)とか
		// なにか適切にすればいけるのだろうが面倒なので別関数
		// そのまま名前を投げるようにしたほうがいいのか？
		show: function () {
			$('#noja_menu').show(menuFrame.duration);
		},
		showNow: function () {
			$('#noja_menu').show();
		},
		hide: function () {
			$('#noja_menu').hide(menuFrame.duration);
		},
		hideNow: function () {
			$('#noja_menu').hide();
		},
		////
		height: function () {
			$('#noja_menu').height();
		},
	};

	var rootFrame = {
		duration: 100,
		id: 'noja_container',
		selector: '#noja_container',
		////
		$: function () {
			return $('#noja_container');
		},
		////
		show: function () {
			$('#noja_container').show(rootFrame.duration);
		},
		showNow: function () {
			$('#noja_container').show();
		},
		hide: function () {
			$('#noja_container').hide(rootFrame.duration);
		},
		hideNow: function () {
			$('#noja_container').hide();
		},
		////
	};

	var navigationFrame = {
		duration: 100,
		id: 'noja_pages',
		selector: '#noja_pages',
		////
		$: function () {
			return $('#noja_pages');
		},
		$div: function () {
			return $('#noja_pages > div');
		},
		////
		show: function () {
			$('#noja_pages').show(navigationFrame.duration);
		},
		showNow: function () {
			$('#noja_pages').show();
		},
		hide: function () {
			$('#noja_pages').hide(navigationFrame.duration);
		},
		hideNow: function () {
			$('#noja_pages').hide();
		},
		////
	};

	$.templates('statusBarLoadingTmpl', '<img src="{{:src}}">読み込み中...');
	var statusFrame = {
		duration: 100,
		autoHideDuration: 3000,
		timeoutID: null,	//ステータスバーを閉じるためにsetTimeoutした場合のID
		id: 'noja_status',
		selector: '#noja_status',
		////
		$: function () {
			return $('#noja_status');
		},
		////
		show: function () {
			$('#noja_status').show(statusFrame.duration);
		},
		showNow: function () {
			$('#noja_status').show();
		},
		hide: function () {
			$('#noja_status').hide(statusFrame.duration);
		},
		hideNow: function () {
			$('#noja_status').hide();
		},
		////
		showMessage: function (html) {
			$('#noja_status').html(html).show();
			if (statusFrame.timeoutID !== null) {
				clearTimeout (statusFrame.timeoutID);
			}
			statusFrame.timeoutID = setTimeout(
				function() {
					$('#noja_status').hide(statusFrame.duration);
				}
				, statusFrame.autoHideDuration
			);
		},
		//ステータスバーに読み込み中を通知する。
		showLoading: function () {
			$('#noja_status')
				.html($.render.statusBarLoadingTmpl({src: ICON_LOADING1}))
				.show(statusFrame.duration);
		},
	};

	var indexFrame = {
		duration: 100,
		id: 'noja_index',
		selector: '#noja_index',
		////
		$: function () {
			return $('#noja_index');
		},
		// extra
		$div: function () {
			return $('#noja_index > div');
		},
		$updateAnchor: function () {
			return $('#noja_index > a');
		},
		////
		show: function () {
			$('#noja_index').show(indexFrame.duration);
		},
		showNow: function () {
			$('#noja_index').show();
		},
		hide: function () {
			$('#noja_index').hide(indexFrame.duration);
		},
		hideNow: function () {
			$('#noja_index').hide();
		},
		////
		clearDivContents: function () {
			$('#noja_index > div').empty();
		},
		setLoadMessage: function (html) {
			var target = $('#noja_loading');
			if (!target.size()) {
				$('#noja_index > div').prepend($('<div/>').attr('id', 'noja_loading'));
				// prependするために作ったdiv自体がtargetになりそうな気がするが
				target = $('#noja_loading');
			}
			target.html(html);
		},
	};


	// 色々バリエーションが出てくるなら
	// menuList自体を更に構造化管理する
	var popupMenu = {
		menuList: [
			'#noja_config',
			'#noja_config2',
			'#noja_saveload',
			'#noja_link',
			'#noja_help',
			'#noja_version',
			'#noja_hyouka',
			'#noja_booklist_view',
			'#noja_download_view',
		],
		iterate: function (op) {
			for (var i = 0; i < popupMenu.menuList.length; ++i) {
				if (op(popupMenu.menuList[i])) {
					return true;
				}
			}
			return false;
		},
		//ポップアップを閉じる
		close: function (id) {
			if (id === undefined) {
				popupMenu.iterate (function (menu) {
					$(menu).hide();
					return false;
				});
			} else {
				popupMenu.iterate (function (menu) {
					if (menu === id) {
						$(menu).hide();
					}
					return false;
				});
			}
		},
		/////////////////////
		//指定したIDのポップアップをトグルする。それ以外は全て閉じる
		toggle: function (id) {
			popupMenu.iterate (function (menu) {
				if (menu === id) {
					$(menu).toggle();
				} else {
					$(menu).hide();
				}
				return false;
			});
		},
		/////////////////////
		//ポップアップが表示されているかどうか調べる
		isOpen: function() {
			return popupMenu.iterate (function (menu) {
				if ($(menu).css('display') != 'none') {
					return true;
				}
			});
		},
	};

	$.templates('twitterTextTmpl'
		, '{{:url}}\n'
		+ '「{{:title}}」読んだ！\n'
		+ '#{{:hash1}} #{{:hash2}}'
		);
	var Twitter = {
		tweetURL: 'http://twitter.com/intent/tweet',
		createURL: function (params) {
			var text = $.render.twitterTextTmpl(params);
			return Twitter.tweetURL + '?text=' + encodeURIComponent(text);
		},
	};


	//////////////////////////////////////////////////////////////////////
	//ncode.syosetu.com(なろう)かnovel18.syosetu.com(のくむん)
	//またはダミーでnaroufav.wkeya.com(配布サイト)
	//var site;
	//novelcom.syosetu.com(なろう)かnovelcom18.syosetu.com(のくむん)。またはダミーで（ｒｙ
	//site2: 感想・レビュー・評価のサイト
	//api: なろうAPIのURL
	//login : ログインしているかどうかのフラグ
	// token: セキュリティトークン
	// bgImage: 背景画像
	// bgColor: 背景色
	// color: 文字色
	//ncode: nコード
	//ncode2: novelcom.～の方に使うnコード
	// このあたりは別途objectにまとめるほうがいいのかも
	//   author: 作者
	//   title 小説タイトル
	//
	// site,ncode,api関連はまとめる
	// ncodeを取りだしsetした時にsetterでurlgeneratorも再初期化

	function AppModeSite (url) {
		this.siteName = AppModeSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = false;
		this.maxSection = 0;
		this.login = false;
		this.token = '';
		this.bgImage = null;
		this.bgColor = $('body').css('background-color');
		this.color ='#000';
		this.ncode = null;
		this.ncode2 = null;
		this.author = null;
		this.title = null;

		//
		gCurrentSection.id = 1;
		gCurrentSection.page = 0;
		this.site = 'http://naroufav.wkeya.com/noja/';
		this.site2 = 'http://naroufav.wkeya.com/noja/';
		this.api = '';
	}
	// AppModeSite.prototype = {
	//	method_A: function () {},
	//	method_B: function () {},
	// }
	AppModeSite.siteName = 'アプリモード';
	AppModeSite.isSupportedURL = function (url) {
		return (url === 'chrome://noja/content/app/index.html');
	};
	AppModeSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	AppModeSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	AppModeSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};
	// '{{:site2}}novelpoint/register/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getNovelPointRegisterURL = function () {
		return this.site2 + 'novelpoint/register/ncode/' + this.ncode2 + '/';
	};
	// '{{:site2}}impression/confirm/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getImpressionConfirmURL = function () {
		return this.site2 + 'impression/confirm/ncode/' + this.ncode2 + '/';
	};

	// '{{:site2}}impression/list/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getImpressionListURL = function () {
		return this.site2 + 'impression/list/ncode/' + this.ncode2 + '/';
	};
	// '{{:site2}}novelreview/list/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getNovelReviewListURL = function () {
		return this.site2 + 'novelreview/list/ncode/' + this.ncode2 + '/';
	};
	AppModeSite.prototype.getNovelReviewConfirmURL = function () {
		return this.site2 + 'novelreview/confirm/ncode/' + this.ncode2 + '/';
	};
	AppModeSite.prototype.getNovelViewInfotopURL = function () {
		return this.site + 'novelview/infotop/ncode/' + this.ncode + '/';
	};


	AppModeSite.prototype.startAsyncProcess = function () {
	};

	AppModeSite.prototype.isReloadSection = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD);
	};
	AppModeSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD || sec >= 1);
	};
	// maxSectionは現在読み込まれている最大の話。
	// 最新話から前に戻る時にはgGeneralAllNoを取得しなくても大丈夫なように。
	AppModeSite.prototype.canJumpToSection = function (sec) {
		return (sec <= this.maxSection);
	};
	AppModeSite.prototype.updateMaxSection = function (sec, force) {
		this.maxSection = (force === true) ? sec : Math.max(this.maxSection, sec);
	};


	AppModeSite.prototype.rebuild_form_user_type = function () {
		['#noja_impression_usertype', '#noja_novelreview_usertype']
			.forEach(function (elem) {
				$(elem).empty();
			});
	};

	AppModeSite.prototype.rebuild_twitter_link = function (link) {
		link.attr('href', Twitter.createURL ({
			url: this.getNovelBaseURL(),
			title: this.title,
			hash1: '#narou',
			hash2: '#narou' + this.ncode.toUpperCase(),
		}))
		.find('img').attr('src', IMG_TWITTER_BANNER);
	};

	// とりあえずダミー
	AppModeSite.prototype.rebuild_impression_form = function () {
		var form = $('#noja_f_cr > form');
		form.attr('action', '');
		// idついているのでは？
		form.children('div:eq(0)').children('a:eq(0)').attr('href', '');
		form.children('div:eq(0)').children('div:eq(0)').before('※ダミーです');
	};

	AppModeSite.prototype.rebuild_review_form = function () {
		var form = $('#noja_r_fc > form');
		form.attr('action', '');
		// idついているのでは？
		form.children('div:eq(0)').children('a:eq(0)').attr('href', '');
		form.children('div:eq(0)').children('div:eq(0)').before('※ダミーです');
	};

	// これはmixinにする
	var setupFormRadiobox = function (form_selector) {
		var total_no = 0;
		$(form_selector).find('.RadioboxBigOrb a').each(function() {
			var selector = form_selector;
			var no = ((total_no++) % 5) + 1;
			var handler = function () {
				var group_name = $(this).attr('name');
				var input_id = '#noja_' + group_name + no;
				$(selector).find('.RadioboxBigOrb a[name="' + group_name + '"]')
					.removeClass('RadioboxCheckedBigOrb')
					.addClass('RadioboxUncheckedBigOrb');
				$(this).addClass('RadioboxCheckedBigOrb')
					.removeClass('RadioboxUncheckedBigOrb');
				// 外側のspanをclickした時、内側に置いてるinputのcheckを変える
				$(input_id).prop('checked', true);
			};
			// ここのthisはeachの見つかったanchorを指す
			$(this).bind('click', handler).bind('press', handler);
		});
	};


	// 評価formの構築
	AppModeSite.prototype.buildReputationForm = function() {
		var h = $('#noja_hyouka');
		h.find('.novel_hyouka form').attr('action', '');
		h.find('.novel_hyouka .agree').html('※ダミーです');
		this.setupReputationFormRadioBox ('#noja_hyouka');
		setupFormRadiobox (h);
		this.rebuild_impression_form ();
		this.rebuild_review_form ();
		this.rebuild_twitter_link (h.find('.hyouka_in:eq(1) > a'));
	};

	AppModeSite.prototype.rebuild_forms = function () {
		this.rebuild_form_user_type ();
	};


	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	AppModeSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	//////////////////////////////////////////////////////////////////
	function NarouSite(url) {
		this.siteName = NarouSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = true;	// @@ ここをfalseにする @@
		this.maxSection = 0;
		this.login = false;
		this.token = '';
		this.bgImage = null;
		this.bgColor = $('body').css('background-color');
		this.color = $('#novel_color').css('color');
		this.ncode = null;
		this.ncode2 = null;
		this.author = null;
		this.title = null;

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		this.api   = 'http://api.syosetu.com/novelapi/api/';
		this.site  = 'http://ncode.syosetu.com/';
		this.site0 = 'http://syosetu.com';	//
		this.site2 = 'http://novelcom.syosetu.com/';
		url.match(/http:\/\/ncode.syosetu.com\/([nN][^\/]*)\/([0-9]*)/);
		this.ncode = RegExp.$1.toLowerCase();
		// 短編のときは$2が空になるはず(=0)
		gCurrentSection.id = parseInt(RegExp.$2);
	}
	// なろう系の場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない
	NarouSite.siteName = '小説家になろう';
	NarouSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/ncode\.syosetu\.com\/[nN]/
		) === 0);
	};

	// その作品のtopページ
	NarouSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// その作品のindexページ
	NarouSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	NarouSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};
	NarouSite.prototype.getLoginURL = function () {
		return 'http://syosetu.com/login/input/';
	};
	NarouSite.prototype.getUserTopURL = function () {
		return 'http://syosetu.com/user/top/';
	};
	NarouSite.prototype.getBookmarkImageURL = function () {
		return 'http://static.syosetu.com/view/images/bookmarker.gif';
	};

	NarouSite.prototype.getLoginOrUserTopURL = function () {
		return (this.login) ? this.getUserTopURL() : this.getLoginURL();
	};
	NarouSite.prototype.getLoginOrUserTopMsg = function () {
		return (this.login) ? 'マイページ' : 'ログイン';
	};

	// '{{:site2}}novelpoint/register/ncode/{{:ncode2}}/'
	NarouSite.prototype.getNovelPointRegisterURL = function () {
		return this.site2 + 'novelpoint/register/ncode/' + this.ncode2 + '/';
	};
	// '{{:site2}}impression/confirm/ncode/{{:ncode2}}/'
	NarouSite.prototype.getImpressionConfirmURL = function () {
		return this.site2 + 'impression/confirm/ncode/' + this.ncode2 + '/';
	};
	// '{{:site2}}impression/list/ncode/'
	NarouSite.prototype.getImpressionListBaseURL = function () {
		return this.site2 + 'impression/list/ncode/';
	};
	// '{{:site2}}impression/list/ncode/{{:ncode2}}/'
	NarouSite.prototype.getImpressionListURL = function () {
		return this.site2 + 'impression/list/ncode/' + this.ncode2 + '/';
	};
	// '{{:site2}}novelreview/list/ncode/{{:ncode2}}/'
	NarouSite.prototype.getNovelReviewListURL = function () {
		return this.site2 + 'novelreview/list/ncode/' + this.ncode2 + '/';
	};
	NarouSite.prototype.getNovelReviewConfirmURL = function () {
		return this.site2 + 'novelreview/confirm/ncode/' + this.ncode2 + '/';
	};
	NarouSite.prototype.getNovelViewInfotopURL = function () {
		return this.site + 'novelview/infotop/ncode/' + this.ncode + '/';
	};



	NarouSite.prototype.isReloadSection = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD);
	};
	NarouSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD || sec >= 1);
	};

	// maxSectionはgeneralALlNo未取得で話数確定していないときでも
	// initial page以前の部分は確実にコンテンツが存在するとして
	// 移動できるようにするもの(prev移動用途)
	// 下限sectionはno=1
	NarouSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec >= 1);
	};
	NarouSite.prototype.canJumpToSection = function (sec) {
		return (sec <= this.maxSection);
	};
	NarouSite.prototype.updateMaxSection = function (sec, force) {
		this.maxSection = (force === true) ? sec : Math.max(this.maxSection, sec);
	};

	$.templates('narouShioriURLTmpl'
		, 'http://syosetu.com/bookmarker/add/ncode/{{:ncode2}}/no/{{:section_no}}/?token={{:token}}');

	NarouSite.prototype.getShioriPrefixURL = function() {
		return 'http://syosetu.com/bookmarker/add/ncode/';
	};


	NarouSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentSection.id : section_no;
		return $.render.narouShioriURLTmpl({
			ncode2: this.ncode2,
			section_no: section_no,
			token: this.token
		});
	};
	NarouSite.prototype.changeSection = function(section_no) {
		$('#noja_shiori').attr('href', this.getShioriURL(section_no));
	};
	// 元の構造はnoja_view.html側で定義されている
	NarouSite.prototype.setupLinkMenu = function (linkmenu) {
		var a = linkmenu.find('a');
		a.eq(1).attr('href', this.getLoginOrUserTopURL())
			.text(this.getLoginOrUserTopMsg());
		a.eq(2).attr('href', this.getNovelViewInfotopURL());
		a.eq(3).attr('href', this.getImpressionListURL());
		a.eq(4).attr('href', this.getNovelReviewListURL());

		// '#noja_shiori'部分は読み込み時に更新する
		if (this.login) {
			linkmenu.append(
				'<div><img src="'
				+ this.getBookmarkImageURL()
				+ '" alt="しおり"><a id="noja_shiori" href="'
				+ this.getShioriURL()
				+ '" target="_blank">しおりを挿む</a></div>'
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
		linkmenu.append($('<div>').append($('#sasieflag').clone()));
	};

	NarouSite.prototype.rebuild_form_user_type = function () {
		['#noja_impression_usertype', '#noja_novelreview_usertype']
			.forEach(function (elem) {
				$(elem).empty();
			});
	};

	NarouSite.prototype.rebuild_twitter_link = function (link) {
		link.attr('href', Twitter.createURL ({
			url: this.getNovelBaseURL(),
			title: this.title,
			hash1: '#narou',
			hash2: '#narou' + this.ncode.toUpperCase(),
		}))
		.find('img').attr('src', IMG_TWITTER_BANNER);
	};

	var attrTableEntryGenFactory = function (base_selector) {
		var $genFunc = function (base_selector, opt_attr) {
			var $selector = function (selector) {
				return ((selector.startsWith('#'))
					? '' : base_selector + ' ') + selector;
			};
			if (opt_attr === undefined) {
				// 3 args版
				return function (selector, attr, gen) {
					return {
						selector: $selector(selector),
						attr: attr,
						gen: gen,
					};
				};
			} else {
				// 2 args版
				return function (selector, gen) {
					return {
						selector: $selector(selector),
						attr: opt_attr,
						gen: gen,
					};
				};
			}
		};
		// 戻すものはbase_selectorに特殊化した関数テーブル
		return {
			_: $genFunc (base_selector),
			a: $genFunc (base_selector, 'action'),
			h: $genFunc (base_selector, 'href'),
		};
	};

	// method名を同じにすればNarou,NocMoonで同一にできる
	NarouSite.rebuild_forms_table = (function () {
		var u = attrTableEntryGenFactory('#noja_hyouka');
		return [
			u.a ('.novel_hyouka form', 'getNovelPointRegisterURL'),
			u.a ('#noja_f_cr form', 'getImpressionConfirmURL'),
			// これはrestoreのときだけでimportでは更新してなかった
			u.a ('#noja_r_fc form', 'getNovelReviewConfirmURL'),
			// これはimportのときだけでrestoreでは更新してなかった
			u.h ('#noja_impression_list', 'getImpressionListURL'),
			// これはimportのときだけでrestoreでは更新してなかった
			u.h ('#noja_novelreview_list', 'getNovelReviewListURL'),
		];
	})();

	NarouSite.prototype.rebuild_forms = function () {
		NarouSite.rebuild_forms_table.forEach (function(elem, index) {
			if (elem.gen in this.prototype) {
				$(elem.selector).attr(elem.attr
					, elem.prototype[elem.gen].call(this));
			} else {
				console.debug('missing prototype:', elem.gen);
			}
		}, this);
	};

	var genTagInput = function (v) {
		return '<input type="' + v.type + '" class="' + v.class + '" value="' + v.value + '" id="' + v.id + '" />';
	};

	// 評価formの構築
	NarouSite.prototype.buildReputationForm = function() {
		var submitPointInput = {
			type: 'submit',
			id: 'pointinput',
			class: 'button',
			value: '評価する',
		};
		var submitImpressionConfirm = {
			type: 'submit',
			id: 'impressionconfirm',
			class: 'button',
			value: '感想を書く',
		};
		var submitIReviewInput = {
			type: 'submit',
			id: 'reviewinput',
			class: 'button',
			value: 'レビュー追加',
		};

		var hiddenToken = {
			type: 'hidden',
			name: 'token',
			value: '',
		};
		var h = $('#noja_hyouka');
		h.find('.novel_hyouka form').attr('action', this.getNovelPointRegisterURL());
		h.find('.novel_hyouka .agree')
			.html(gSiteParser.login
				? ('<input type="hidden" value="' + gSiteParser.token + '" name="token" />'
					+ genTagInput(submitPointInput))
				: ('<input type="hidden" value="" name="token" />'
					+ '※評価するにはログインしてください。')
			);
		setupFormRadiobox (h);

		var build_impression_review_submit = function (forms) {
			forms.forEach (function (info) {
				var form = $(info.selector + ' > form');
				form.attr('action', info.confirmURL);
				// idついているのでは？
				form.children('div:eq(0)').children('a:eq(0)')
					.attr('href', info.listURL);
				if (gSiteParser.login) {
					form.append(info.submitTag);
				} else {
					form.children('div:eq(0)').children('div:eq(0)')
						.before('※' + info.desc + 'を書く場合は'
							+ '<a href="' + this.getLoginURL() + '" style="color:#0033cc;">'
							+ 'ログイン</a>してください。<br>');
				}
			}, this);
		};

		var formsInfo = [
			{
				selector: '#noja_f_cr',
				confirmURL: this.getImpressionConfirmURL(),
				listURL: this.getImpressionListURL(),
				submitTag: genTagInput(submitImpressionConfirm),
				desc: '感想',
			},
			{
				selector: '#noja_r_fc',
				confirmURL: this.getNovelReviewConfirmURL(),
				listURL: this.getNovelReviewListURL(),
				submitTag: genTagInput(submitIReviewInput),
				desc: 'レビュー',
			},
		];
		build_impression_review_submit (formsInfo);

		this.rebuild_twitter_link(h.find('.hyouka_in:eq(1) > a'));
	};


	////////////////////////////////////////////////////////
	// oneshotしか使ってないが保守性向上のため類似部分の近くに分離
	//$(document.documentElement)でcontextを作ってそれでparseを共通化したほうがいい
	// 1: min checking
	// 2: color関連
	// 3: title,author関連
	// 4: subtitle等section情報
	// token,ncodeはsection側の話？
	// bookにglobalなものはthis側に持つ
	// tokenはpage固有っぽいからglobal state?
	// 栞関連の一部もそうか？
	// section,authorはhtml parser側と共通だがその他は独自
	/////////////
	// '#container'がcontentsになる

	// これはbodyで拾うので実は次話移動等の部分では使えないが…
	NarouSite.prototype.updateThemeAtSection = function (contents) {
		this.bgImage = $('body').css('background-image');
		if (this.bgImage === 'none' || this.bgImage === '') {
			this.bgImage = null;
		} else {
			this.bgImage = $('<img />')
				.attr('src', this.bgImage.match(/^url\((.*)\)$/)[1])
				.bind('load', function(){showPage();})
				.get(0);
			this.bgColor = '#FFFFFF';
		}
	};


	NarouSite.prototype.updateAutherAtSection = function (contents) {
		if (this.isSingleSection) {
			// 短編の場合は'.contents1'以前の領域
			this.author = $('.novel_writername', contents).contents()
				.not('a[href^="'+this.getShioriPrefixURL()+'"]')
				.text().slice(4, -3);
		} else {
			// 一応読み込んだものから著者は再設定しておく？
			// @@ これだけはグローバルな書き換えになる @@
			// 作者にanchorがない場合もある
			this.author = $('<div>')
				.html(
					$('.contents1', contents).html()
					.replace(/\r|\n/g, '')
					.match(/作者：(.*)(<p.*?<\/p>)?/)[1]
				)
				.text();
		}
	};
	// 短編と長編でタイトルを取れるdiv領域が違う
	NarouSite.prototype.updateTitleAtSection = function (contents) {
		if (this.isSingleSection) {
			// 短編
			this.title = getText('.novel_title', contents);
		} else {
			// 連載
			// タイトルは必ず
			this.title = $('.contents1 >a:eq(0)', contents)
				.not('a[href="' + this.site0 + '"]').text();
		}
	};


	// ここの判定はなんとか変更したいところ
	// タイトル: タイトルアンカーが取れれば連載ページ
	NarouSite.prototype.parseSectionType = function (contents) {
		var t = $('.contents1 >a:eq(0)')
			.not('a[href="' + this.site0 + '"]');
		console.debug(t);
		return (!t.size());
	};
	// 絞るべきcontextは'#container'のレベルのようだ
	// 短編と長編でタイトルを取れるdiv領域が違う等、
	// これ以上は絞れない
	NarouSite.prototype.setupVolumeInfo = function (contents) {
		this.isSingleSection = this.parseSectionType();

		// 短編かどうかの判断はtitleが取れたかどうかで行う
		// title関連の調整とtoken取得等
		if (this.isSingleSection) {
			// 短編
			setIndexPageDisabled ();
			gCurrentSection.id = 1;
			gGeneralAllNo = 1;
		} else {
			// 連載
			setIndexPageNotReady();
		}
		// なろうの場合は短編と連載でトークンの取る位置が違う？
		var t;
		if (this.isSingleSection) {
			t = $('div.novel_writername > a[href^="'+this.getShioriPrefixURL()+'"]');
		} else {
			t = $('#novel_contents a[href^="'+this.getShioriPrefixURL()+'"]');
		}
		this.token = (t.size()) ? t.attr('href').match(/=([0-9a-f]*)$/)[1] : null;
		if (this.token) {
			this.login = true;
			noja_option.setToken(this.token);
		} else {
			this.login = false;
		}
		t = $('#head_nav a[href^="' + this.getImpressionListBaseURL () + '"]');
		this.ncode2 = (t.size()) ? t.attr('href').match(/([0-9]*)\/$/)[1] : null;
	};

	NarouSite.prototype.parseHtmlCommon = function (contents, section) {
		this.updateAutherAtSection (contents);
		// コンテンツの内容の解析
		var sec = {};
		if (this.isSingleSection) {
			// 短編
			sec.chapter_title = '';
			sec.subtitle = this.title;
		} else {
			// 連載
			sec.chapter_title = getText('.chapter_title', contents);
			sec.subtitle = getText('.novel_subtitle', contents);
		}
		sec._maegaki = getHtml('#novel_p', contents);
		sec._atogaki = getHtml('#novel_a', contents);
		sec._honbun = getHtml('#novel_honbun', contents);

		sec = splitContentsBody (sec, gCurrentSection.id);

		return sec;
	};


	////////////////////////////////////////////////////////
	// のじゃーが張り付いた初期ページの解析
	NarouSite.prototype.parseInitialPage = function () {
		if (!$('#novel_honbun').size()) {
			return false;
		}
		var contents = $('#container');
		this.setupVolumeInfo (contents);
		this.updateThemeAtSection (contents);
		this.updateTitleAtSection (contents);

		//
		sections[gCurrentSection.id] = this.parseHtmlCommon (contents, gCurrentSection.id);
		//
		setupCurrentSectionInfo(gCurrentSection.id);
		return true;
	};

	////////////////////////////////////////////////////////
	// ページ遷移時に読み込んだhtmldocの解析
	NarouSite.prototype.parseHtmlContents = function(htmldoc, section) {
		// データ取得に必要なcontextに限定して
		// 最低限そのチェックをしてから呼び出す
		// '#container'がbody直下のため$('#container',htmldoc)等ではまずい
		var contents = $('<div/>').append($.parseHTML(htmldoc))
			.find('#container');
		// minimum check
		if (!contents.size()) {
			console.debug('min check failed');
			return null;
		}
		// 登録は呼出し元管轄
		return this.parseHtmlCommon (contents, section);
	};


	///////////////////////////////////////////
	NarouSite.prototype.loadIndex = function () {
		var dfrd = new $.Deffered();
		$.get(this.getNovelIndexURL()).then(
			//success:
			function(data) {
				var index = $('.novel_title, .novel_writername, #novel_ex, .index_box'
					, data);
				var indexDiv = indexFrame.$div ();
				indexDiv.html(index);

				this.author = $('.novel_writername', indexDiv)
					.contents()
					.not('a[href^="'+this.getShioriPrefixURL()+'"]')
					.text().slice(3);

				// シリーズのlinkを絶対リンク化
				// (contentsページからの位置とindexページからの位置で階層が違う)
				var a_series = $('div.series > a', indexDiv);
				if (a_series.size()) {
					a_series.attr('href', this.site + a_series.attr('href').slice(1));
				}
				// @@ とりあえずstyle側の修正だけで様子見
				//$('.index_box', indexDiv)
				//	.css('margin', '')
				//	.css('width', '')
				//	;
				// [オリジナルindex_box]
				//   margin: 0 auto 30px;
				//   width: 720px;
				var total_sec_no = 0;
				$('.index_box a', indexDiv)
					.attr('href', null)
					.css('cursor', 'pointer')
					.each(function(){
						var sec_no = ++total_sec_no;
						$(this).bind('click', function(){
							jumpTo (sec_no, FIRST_PAGE_NO);
							indexFrame.hide();
						});
					});
				dfrd.resolve (total_sec_no);
			},
			// error:
			function() {
				dfrd.reject ();
			}
		);
		return dfrd.promise();
	};

	//ajaxでなろう小説APIからデータを受け取る
	// データタイプはjsonなのでdecodeされてdataのpropになっている?
	// どうせjsonであることに依存しているのだから
	// getJSONにする(deffered対応でfailも処理できるし)
	NarouSite.prototype.loadMaxSectionNo = function () {
		var dfrd = new $.Deffered();
		$.getJSON (gSiteParser.api + NAROUAPI_AJAX_GET_OPT + this.ncode)
		.then(
			// success: 成功
			function (data) {
				console.debug('api return with:', data);
				dfrd.resolve (parseInt (data[1].general_all_no));
			},
			// error
			function(data) {
				dfrd.reject ();
			}
		);
		return dfrd.promise ();
	};
	NarouSite.prototype.startAsyncProcess = function () {
	};

	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	NarouSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	///////////////////////////////////////////////////
	function NocMoonSite(url) {
		this.siteName = NocMoonSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = true;	// @@ ここをfalseにする @@
		this.maxSection = 0;
		this.login = false;
		this.token = '';
		this.bgImage = null;
		this.bgColor = $('body').css('background-color');
		this.color = $('#novel_color').css('color');
		this.ncode = null;
		this.ncode2 = null;
		this.author = null;
		this.title = null;

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		this.api   = 'http://api.syosetu.com/novel18api/api/';
		this.site  = 'http://novel18.syosetu.com/';
		this.site2 = 'http://novelcom18.syosetu.com/';
		this.site0 = 'http://syosetu.com';	// 共通で使ってる場所がある？
		url.match(/http:\/\/novel18.syosetu.com\/([nN][^\/]*)\/([0-9]*)/);
		this.ncode = RegExp.$1.toLowerCase();
		// 短編のときは$2が空になるはず(=0)
		gCurrentSection.id = parseInt(RegExp.$2);

	}
	// なろう系の場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない
	NocMoonSite.siteName = 'ノクターン・ムーンライト';
	NocMoonSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/novel18\.syosetu\.com\/n/
		) === 0);
	};
	// その作品のtopページ
	NocMoonSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// その作品のindexページ
	NocMoonSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	NocMoonSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};
	NocMoonSite.prototype.getLoginURL = function () {
		return 'http://syosetu.com/login/input/';
	};

	NocMoonSite.prototype.getUserTopURL = function () {
		return 'http://syosetu.com/user/top/';
	};
	NocMoonSite.prototype.getBookmarkImageURL = function () {
		return 'http://static.syosetu.com/view/images/bookmarker.gif';
	};

	NocMoonSite.prototype.getLoginOrUserTopURL = function () {
		return (this.login) ? this.getUserTopURL() : this.getLoginURL();
	};
	NocMoonSite.prototype.getLoginOrUserTopMsg = function () {
		return (this.login) ? 'マイページ' : 'ログイン';
	};


	// '{{:site2}}novelpoint/register/ncode/{{:ncode2}}/'
	NocMoonSite.prototype.getNovelPointRegisterURL = function () {
		return this.site2 + 'novelpoint/register/ncode/' + this.ncode2 + '/';
	};
	// '{{:site2}}impression/confirm/ncode/{{:ncode2}}/'
	NocMoonSite.prototype.getImpressionConfirmURL = function () {
		return this.site2 + 'impression/confirm/ncode/' + this.ncode2 + '/';
	};

	// '{{:site2}}impression/list/ncode/{{:ncode2}}/'
	NocMoonSite.prototype.getImpressionListBaseURL = function () {
		return this.site2 + 'impression/list/ncode/';
	};

	// '{{:site2}}impression/list/ncode/{{:ncode2}}/'
	NocMoonSite.prototype.getImpressionListURL = function () {
		return this.site2 + 'impression/list/ncode/' + this.ncode2 + '/';
	};


	// '{{:site2}}novelreview/list/ncode/{{:ncode2}}/'
	NocMoonSite.prototype.getNovelReviewListURL = function () {
		return this.site2 + 'novelreview/list/ncode/' + this.ncode2 + '/';
	};
	NocMoonSite.prototype.getNovelReviewConfirmURL = function () {
		return this.site2 + 'novelreview/confirm/ncode/' + this.ncode2 + '/';
	};
	NocMoonSite.prototype.getNovelViewInfotopURL = function () {
		return this.site + 'novelview/infotop/ncode/' + this.ncode + '/';
	};


	NocMoonSite.prototype.isReloadSection = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD);
	};
	NocMoonSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD || sec >= 1);
	};

	NocMoonSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec >= 1);
	};
	NocMoonSite.prototype.canJumpToSection = function (sec) {
		return (sec <= this.maxSection);
	};
	NocMoonSite.prototype.updateMaxSection = function (sec, force) {
		this.maxSection = (force === true) ? sec : Math.max(this.maxSection, sec);
	};

	$.templates('nocMoonShioriURLTmpl'
		, 'http://syosetu.com/bookmarker/add/ncode/{{:ncode2}}/no/{{:section_no}}/?token={{:token}}');
	NocMoonSite.prototype.getShioriPrefixURL = function() {
		return 'http://syosetu.com/bookmarker/add/ncode/';
	};

	NocMoonSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentSection.id : section_no;
		return $.render.nocMoonShioriURLTmpl({
			ncode2: this.ncode2,
			section_no: section_no,
			token: this.token
		});
	};
	NocMoonSite.prototype.getFavnovelmain18BaseURL = function () {
		return 'http://syosetu.com/favnovelmain18/';
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
	};

	NocMoonSite.prototype.setupLinkMenu = function (linkmenu) {
		var a = linkmenu.find('a');
		a.eq(1).attr('href', this.getLoginOrUserTopURL())
			.text(this.getLoginOrUserTopURL());
		a.eq(2).attr('href', this.getNovelViewInfotopURL());
		a.eq(3).attr('href', this.getImpressionListURL());
		a.eq(4).attr('href', this.getNovelReviewListURL());

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
		if (this.login) {
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
		linkmenu.append($('<div>').append($('#sasieflag').clone()));
	};

	NocMoonSite.prototype.rebuild_form_user_type = function () {
		['#noja_impression_usertype', '#noja_novelreview_usertype']
			.forEach(function (elem) {
				$(elem).html(
					'<select name="usertype">'
					+ '<option value="xuser">Xアカウントで書き込み</option>'
					+ '<option value="">通常アカウントで書き込み</option>'
					+ '</select>'
				);
		});
	};

	NocMoonSite.prototype.rebuild_twitter_link = function (link) {
		link.attr('href', Twitter.createURL ({
			url: this.getNovelBaseURL(),
			title: this.title,
			hash1: '#narou',
			hash2: '#narou' + this.ncode.toUpperCase(),
		}))
		.find('img').attr('src', IMG_TWITTER_BANNER);
	};


	NocMoonSite.prototype.rebuild_forms = function () {
		this.rebuild_form_user_type();
		//
		$('#noja_hyouka .novel_hyouka form')
			.attr('action', this.getNovelPointRegisterURL());
		$('#noja_hyouka #noja_f_cr form')
			.attr('action', this.getImpressionConfirmURL());
		// これはrestoreのときだけでimportでは更新してなかった
		$('#noja_hyouka #noja_r_fc form')
			.attr('action', this.getNovelReviewConfirmURL());
		// これはimportのときだけでrestoreでは更新してなかった
		$('#noja_impression_list')
			.attr('href', this.getImpressionListURL());
		// これはimportのときだけでrestoreでは更新してなかった
		$('#noja_novelreview_list')
			.attr('href', this.getNovelReviewListURL());
	};


	// 評価formの構築
	NocMoonSite.prototype.buildReputationForm = function() {
		var h = $('#noja_hyouka');
		h.find('.novel_hyouka form').attr('action', this.getNovelPointRegisterURL());
		h.find('.novel_hyouka .agree')
			.html('<input type="hidden" value="'
			+ (gSiteParser.login
				? (gSiteParser.token + '" name="token" /><input type="submit" class="button" value="評価する" id="pointinput" />')
				:  ('" name="token" />※評価するにはログインしてください。')
			));
		this.rebuild_form_user_type();

		setupFormRadiobox (h);

		var impr_form = $('#noja_f_cr > form');
		impr_form.attr('action', this.getImpressionConfirmURL());
		// idついているのでは？
		impr_form.children('div:eq(0)').children('a:eq(0)')
			.attr('href', this.getImpressionListURL());
		if (gSiteParser.login) {
			impr_form.append('<input type="submit" class="button" value="感想を書く" id="impressionconfirm">');
		} else {
			impr_form.children('div:eq(0)').children('div:eq(0)')
				.before('※感想を書く場合は<a href="' + this.getLoginURL() + '" style="color:#0033cc;">ログイン</a>してください。<br>');
		}

		var revw_form = $('#noja_r_fc > form');
		revw_form.attr('action', this.getNovelReviewConfirmURL());
		revw_form.children('div:eq(0)').children('a:eq(0)')
			.attr('href', this.getNovelReviewListURL());
		if (gSiteParser.login) {
			revw_form.append('<input type="submit" class="button" value="レビュー追加" id="reviewinput">');
		} else {
			revw_form.children('div:eq(0)').children('div:eq(0)')
				.before('※レビューを書く場合は<a href="' + this.getLoginURL() + '" style="color:#0033cc;">ログイン</a>してください。<br>');
		}


		this.rebuild_twitter_link = (h.find('.hyouka_in:eq(1) > a'));
	};

	////////////////////////////////////////////////////////
	NocMoonSite.prototype.updateAutherAtSection = function (contents) {
		if (this.isSingleSection) {
			// 短編の場合は'.contents1'以前の領域
			this.author = $('.novel_writername', contents).contents()
				.not('a[href^="' + this.getShioriPrefixURL() + '"]')
				.text().slice(4, -3);
		} else {
			// 一応読み込んだものから著者は再設定しておく？
			// @@ これだけはグローバルな書き換えになる @@
			// 作者にanchorがない場合もある
			this.author = $('<div>')
				.html(
					$('.contents1', contents).html()
					.replace(/\r|\n/g, '')
					.match(/作者：(.*)(<p.*?<\/p>)?/)[1]
				)
				.text();
		}
	};

	NocMoonSite.prototype.parseHtmlCommon = function (contents, section) {
		this.updateAutherAtSection(contents);

		var sec = {};

		if (this.isSingleSection) {
			sec.chapter_title = '';
			sec.subtitle = this.title;
		} else {
			sec.chapter_title = getText('.chapter_title', contents);
			sec.subtitle = getText('.novel_subtitle', contents);
		}

		//前書きデータ取得
		sec._maegaki = getHtml('#novel_p', contents);
		//後書きデータ取得
		sec._atogaki = getHtml('#novel_a', contents);
		//本文データ取得
		sec._honbun = getHtml('#novel_honbun', contents);

		sec = splitContentsBody (sec, section);
		// データオブジェクトを返す
		return sec;
	};


	////////////////////////////////////////////////////////
	NocMoonSite.prototype.updateThemeAtSection = function (contents) {
		this.bgImage = $('body').css('background-image');
		if (this.bgImage === 'none' || this.bgImage === '') {
			this.bgImage = null;
		} else {
			this.bgImage = $('<img />')
				.attr('src', this.bgImage.match(/^url\((.*)\)$/)[1])
				.bind('load', function(){showPage();})
				.get(0);
			this.bgColor = '#FFFFFF';
		}
	};

	// 短編と長編でタイトルを取れるdiv領域が違う
	NocMoonSite.prototype.updateTitleAtSection = function (contents) {
		if (this.isSingleSection) {
			this.title = getText('.novel_title', contents);
		} else {
			// タイトルは必ず
			this.title = $('.contents1 >a:eq(0)', contents)
				.not('a[href="' + this.site0 + '"]').text();
		}
	};
	NocMoonSite.prototype.parseSectionType = function (contents) {
		// ここの判定はなんとか変更したいところ
		// タイトル: タイトルアンカーが取れれば連載ページ
		var t = $('.contents1 >a:eq(0)')
			.not('a[href="' + this.site0 + '"]');
		return (!t.size());
	};
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
			gCurrentSection.id = 1;
			gGeneralAllNo = 1;
		} else {
			// 連載
			setIndexPageNotReady();
		}
		var t = $('#bkm a[href^="' + this.getFavnovelmain18BaseURL() + '"]');
		this.token = (t.size()) ? t.attr('href').match(/=([0-9a-f]*)$/)[1] : null;
		if (this.token) {
			this.login = true;
			noja_option.setToken(this.token);
		} else {
			this.login = false;
		}
		t = $('#head_nav a[href^="' + this.getImpressionListBaseURL() + '"]');
		this.ncode2 = (t.size()) ? t.attr('href').match(/([0-9]*)\/$/)[1] : null;

	};

	NocMoonSite.prototype.parseInitialPage = function () {
		if (!$('#novel_honbun').size()) {
			return false;
		}
		var contents = $('#container');
		this.setupVolumeInfo (contents);
		this.updateThemeAtSection (contents);
		this.updateTitleAtSection (contents);
		//
		sections[gCurrentSection.id] = this.parseHtmlCommon(contents, gCurrentSection.id);
		//
		setupCurrentSectionInfo(gCurrentSection.id);
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
			console.debug('min check failed');
			return null;
		}
		// 登録は呼出し元管轄
		return this.parseHtmlCommon (contents, section);
	};

	NocMoonSite.prototype.loadIndex = function () {
		var dfrd = new $.Deffered();
		$.get (this.getNovelIndexURL()).then(
			//success:
			function(data) {
				var indexDiv = indexFrame.$div ();
				var index = $('.novel_title, .novel_writername, #novel_ex, .index_box'
					, data);
				indexDiv.html(index);

				this.author = $('.novel_writername', indexDiv)
					.contents()
					.not('a[href^="' + this.getShioriPrefixURL() + '"]')
					.text().slice(3);

				// シリーズのlinkを絶対リンク化
				// (contentsページからの位置とindexページからの位置で階層が違う)
				var a_series = $('div.series > a', indexDiv);
				if (a_series.size()) {
					a_series.attr('href', this.site + a_series.attr('href').slice(1));
				}
				// @@ とりあえずstyle側の修正だけで様子見
				//$('.index_box', indexDiv)
				//	.css('margin', '')
				//	.css('width', '')
				//	;
				// [オリジナルindex_box]
				//   margin: 0 auto 30px;
				//   width: 720px;
				var total_sec_no = 0;
				$('.index_box a', indexDiv)
					.attr('href', null)
					.css('cursor', 'pointer')
					.each(function() {
						var sec_no = ++total_sec_no;
						$(this).bind('click', function(){
							jumpTo (sec_no, FIRST_PAGE_NO);
							indexFrame.hide();
						});
					});
				dfrd.resolve (total_sec_no);
			},
			// error:
			function() {
				dfrd.reject ();
			}
		);
		return dfrd.promise();
	};

	//ajaxでなろう小説APIからデータを受け取る
	// データタイプはjsonなのでdecodeされてdataのpropになっている?
	// どうせデコードされていることが前提となるコードなので
	// getJSONを呼び出してもいいはず
	NocMoonSite.prototype.loadMaxSectionNo = function () {
		var dfrd = new $.Deffered();
		$.getJSON (gSiteParser.api + NAROUAPI_AJAX_GET_OPT + this.ncode)
		.then(
			// success: 成功
			function (data) {
				console.debug('api return with:', data);
				dfrd.resolve (parseInt (data[1].general_all_no));
			},
			// error:
			function(data) {
				dfrd.reject ();
			}
		);
		return dfrd.promise ();
	};

	NocMoonSite.prototype.startAsyncProcess = function () {
	};


	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	NocMoonSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	/////////////////////////////////////////////////////////////////
	function AkatsukiSite(url) {
		this.siteName = AkatsukiSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = false;
		this.maxSection = 0;
		this.login = false;
		this.token = '';
		this.bgImage = null;
		this.bgColor = $('body').css('background-color');
		this.color = '#000';
		this.ncode = null;
		this.ncode2 = null;
		this.author = null;
		this.title = null;

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		this.site = 'about:blank';
		this.api = 'about:blank/';
		this.site2 = 'about:blank/';
		url.match(/http:\/\/www\.akatsuki-novels\.com\/stories\/view\/(\d+)\/novel_id~(\d+)/);
		//this.ncode = parseInt(RegExp.$2);	// 別に数値にする必然性はない
		this.ncode = RegExp.$2;
		// $1はsection id
		gCurrentSection.id = null;	// mapがわからないと対応が取れない
		this.currentSectionId = RegExp.$1;
		// 逆方向はjQueryの$.inArray(id, sectioNo2Id)でindexで取る
		// どうせ初期ページがsectionどこにあたるのかを知るためだけ
		this.sectionNo2Id = [];
		// 多分prototypeでobjectが作られてからctorが呼ばれるはずなので
		// 呼び出して問題ないはず
		this.indexPages = [];
		this.fetchIndexPage();

	}
	AkatsukiSite.siteName = '暁';
	AkatsukiSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/www\.akatsuki-novels\.com\/stories\/view\/\d+\/novel_id~\d+/
		) === 0);
	};
	//http://www.akatsuki-novels.com/stories/index/novel_id~{ncode}
	//http://www.akatsuki-novels.com/stories/index/page~{idx_pg}/novel_id~{ncode}
	//現1ページ／全16ページ、20件／全306件、1～20件を表示 
	// これだと20話毎か？
	// どうも閾値か設定か何かあるようだ

	// こちらはtopページ
	AkatsukiSite.prototype.getNovelBaseURL = function (novel_id) {
		novel_id = (novel_id === undefined) ? this.ncode : novel_id;
		return 'http://www.akatsuki-novels.com/stories/index/novel_id~' + novel_id;
	};

	// こちらは個別ページ
	AkatsukiSite.prototype.getNovelIndexURL = function (novel_id, index_page_no) {
		// index指定なければベースurlにしておく
		if (index_page_no === undefined) {
			return this.getNovelBaseURL(novel_id);
		}
		// indexがtrueならall list扱いにしたいところだが、
		// allは読んでみないとわからない
		novel_id = (novel_id === undefined) ? this.ncode : novel_id;
		return 'http://www.akatsuki-novels.com/stories/index/page~'
			+index_page_no+'/novel_id~'+novel_id;
	};
	AkatsukiSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};
	AkatsukiSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentSection.id : section_no;
		return '';
	};
	AkatsukiSite.prototype.changeSection = function(section_no) {
		// formatは分かっているものの…
		// しおり自体の構成が動的に変動するので扱いが微妙
		// とりあえず落ちないようにする対策のみ
		// ここに来る条件が少し不明なり
		console.debug('Akatsuki change section');
		//$('#noja_shiori').attr('href', this.getShioriURL(section_no));
	};
	AkatsukiSite.prototype.setupLinkMenu = function (linkmenu) {
	};




	AkatsukiSite.prototype.isReloadSection = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD);
	};
	AkatsukiSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD || sec >= 1);
	};

	AkatsukiSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec >= 1);
	};
	AkatsukiSite.prototype.canJumpToSection = function (sec) {
		return (sec <= this.maxSection);
	};
	AkatsukiSite.prototype.updateMaxSection = function (sec, force) {
		this.maxSection = (force === true) ? sec : Math.max(this.maxSection, sec);
	};

	AkatsukiSite.prototype.rebuild_forms = function () {
		$('#noja_impression_usertype').empty();
		$('#noja_novelreview_usertype').empty();
	};

	// 評価formの構築
	AkatsukiSite.prototype.buildReputationForm = function() {
	};

	////////////////////////////////////////////////////////
	AkatsukiSite.prototype.parseHtmlCommon = function(story, novels, section) {
		// divの中に"作者："があってその後にaがあるもの
		this.author = $('div a:eq(0)', story).text();
		//console.debug("author:", this.author);

		var sec = {};

		var h2 = $('h2:eq(0)', story);
		//console.debug("h2:", h2);
		//console.debug("h2-text:",h2.text());
		// <h2>第一部　「絆の仲間たち」<br>
		//第一章 「出会いはいつも唐突に」<br>
		//&nbsp;&nbsp;第二話「校舎裏の死闘」</h2>
		// 単独のサブタイトルの場合は1行
		//
		// これでそれぞれの行が取れてはいるはず
		var t = h2.contents().filter(function(){return (this.nodeType === 3);});
		//console.debug('t:',t.size(),':', t);
		switch (t.size()) {
		case 3:	// part--chapter--section(subtitle)
			if (false) {
				//sec.part_title = t.eq(0).text();
				sec.chapter_title = t.eq(1).text();
			} else {
				// temporary : conbine part+chapter title
				var part_title = t.eq(0).text();
				sec.chapter_title = part_title + ' ' + t.eq(1).text();
			}
			sec.subtitle = t.eq(2).text();
			break;
		case 2:	// chapter--section(subtitle)
			//sec.part_title = '';
			sec.chapter_title = t.eq(0).text();
			sec.subtitle = t.eq(1).text();
			break;
		case 1:	// section(subtitle)
			//sec.part_title = '';
			sec.chapter_title = '';
			sec.subtitle = t.eq(0).text();
			break;
		default:
			sec.chapter_title = '';
			sec.subtitle = (t.size() > 0) ? t.text() : '';
			break;
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
		};
		var pre = findScript('前書き', story);
		var post = findScript('後書き', story);
		var body = novels.not(pre, post);
		//
		//console.debug("pre:", pre);
		//console.debug("post:", post);
		//console.debug("body:", body);


		//
		sec._honbun = (body) ? body.html() : null;
		sec._maegaki = (pre) ? pre.html() : null;
		sec._atogaki = (post) ? post.html() : null;
		//console.debug("_honbun:", sec._honbun);
		//console.debug("_maegaki:", sec._maegaki);
		//console.debug("_atogaki:", sec._atogaki);

		sec = splitContentsBody (sec, section);
		//
		console.debug(sec);
		//
		return sec;
	};

	AkatsukiSite.prototype.updateThemeAtSection = function (story, novels) {
		this.bgImage = null;
		this.bgColor = '#FFFFFF';
		this.color = novels.css('color');
//		this.bgImage = $('body').css('background-image');
//		if (this.bgImage === 'none' || this.bgImage === '') {
//			this.bgImage = null;
//		} else {
//			this.bgImage = $('<img />')
//				.attr('src', this.bgImage.match(/^url\((.*)\)$/)[1])
//				.bind('load', function(){showPage();})
//				.get(0);
//			this.bgColor = '#FFFFFF';
//		}
	};

	AkatsukiSite.prototype.updateTitleAtSection = function (story, novels) {
		// ここの判定はなんとか変更したいところ
		// タイトル関連
		this.title = $('h1:eq(0)', story).text();
		console.debug('title:', this.title);
	};


	AkatsukiSite.prototype.parseHtmlContents = function(htmldoc, section) {
		// '#contents-inner2'がbody直下でなければ仮divにつけなくてもよいが
		// 保守性を考え仮divにつけておく
		var story = $('<div/>').append($.parseHTML(htmldoc))
			.find('#contents-inner2 > div.story > div.story');
		var novels = (story.size()) ? $('div.body-novel', story) : null;
		// minimum check
		if (!novels) {
			console.debug('min check failed');
			return null;
		}
		return this.parseHtmlCommon (story, novels, section);
	};

	// 初期化のときのparser stub
	// カラー指定の扱いとtoken関連は調整がいる
	AkatsukiSite.prototype.parseInitialPage = function () {
		console.debug('parseInitialPage');
		var story = $('#contents-inner2 > div.story > div.story');
		var novels = (story.size()) ? $('div.body-novel', story) : null;
		// minimum check
		if (!novels) {
			console.debug('min check failed');
			return false;
		}
		// [強制短編設定]
		gCurrentSection.id = 1;
		setIndexPageDisabled ();
		gGeneralAllNo = 1;
		// その他
		// 解析した中身によって本来変更すべきもの
		this.login = false;
		this.token = null;
		this.ncode2 = null;

		this.updateThemeAtSection (story, novels);
		this.updateTitleAtSection (story, novels);

		// htmlの共通parserにかける前に
		// 雀牌画像の逆変換をして独自タグに戻すべき
		sections[gCurrentSection.id] = this.parseHtmlCommon (story, novels, gCurrentSection.id);
		setupCurrentSectionInfo(gCurrentSection.id);

		return true;
	};

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
	AkatsukiSite.prototype.loadIndex = function () {
		var dfrd = new $.Deffered();
		$.get(this.getNovelIndexURL()).then(
			//success:
			function(data) {
				var indexDiv = indexFrame.$div ();
				// とりあえず作者部分は放置,storyも放置
				var index = $('#LookNovel, div.story table.list', data);
				indexDiv.html(index);

				// これは付けたものによる
				//this.author = $('.novel_writername', indexDiv)
				//	.contents()
				//	.not('a[href^="'+this.getShioriPrefixURL()+'"]')
				//	.text().slice(3);

				// @@ タグ等引っ張ってきた部分にlinkがあれば
				// @@ 目次階層とコンテンツ階層でリンク補正が必要になる

				// build dict: sec_no => sec_id
				// 
				this.sectionMap = {};
				var total_sec_no = 0;
				var a = $('table.list a', indexDiv);
				a.attr('href', null)
					.css('cursor', 'pointer')
					.each(function() {
						var sec_no = ++total_sec_no;
						$(this).bind('click', function(){
							jumpTo (sec_no, FIRST_PAGE_NO);
							indexFrame.hide();
						});
					});
				dfrd.resolve (total_sec_no);
			},
			//error:
			function() {
				dfrd.reject ();
			}
		);
		return dfrd.promise();
	};

	// 非同期にmaxだけもらうことはできないのでloadIndexする
	// callbackの仕様が同一なのでそのままrelayするだけ?
	// と思ったが折角loadIndexするのでready設定はすべき
	AkatsukiSite.prototype.loadMaxSectionNo = function () {
		var dfrd = new $.Deffered();
		this.loadIndex().then(
			function (maxSectionNo) {
				setIndexPageReady();
				dfrd.resolve (maxSectionNo);
			},
			function () {
				dfrd.reject ();
			}
		);
		return dfrd.promise ();
	};

	AkatsukiSite.prototype.fetchIndexPage = function () {
		if (false) {
			// まず1ページだけ取ってみる
			var url = this.getNovelBaseURL();
			console.debug('Akatsuki: load base page', url);
			var buildIndexMap = function (htmlDocList) {
				htmlDocList.forEach(function () {
				});
			};
			$.get(url).done(function(data) {
				// /html/body/div/div[2]/div/div/div[2]/div/div/div[2]
				// #contents-inner2 div.box div.box div.body-x1 div.paging-top
				// "#contents-inner2"はbody直下ではないので問題ないはず
				var paging_top = $('#contents-inner2 div.paging-top', data);
				if (paging_top.size()) {
					console.debug('multiple index pages');
					// pagingのnextのpの中にtotal等がある
					var info = paging_top.next('p');
					if (!info.size()) {
						console.debug('multiple index get info failed');
						return;
					}
					//現1ページ／全220ページ、20件／全4384件、1～20件を表示
				} else {
					buildIndexMap([data]);
				}
			})
			.fail(function() {
				console.debug('fetch first index failed');
				// どうしよう？
			});
			//always, then, $.when(a,b,...)
		}
	};


	// 自動loadIndexさせないとid:secnoのmapが作れない
	AkatsukiSite.prototype.startAsyncProcess = function () {
		//
	};


	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	AkatsukiSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	////////////////////////////////////////////
	function HamelnSite(url) {
		this.siteName = HamelnSite.siteName;
		this.basePageURL = url;
		this.enableReputationForm = false;
		this.maxSection = 0;
		this.login = false;
		this.token = '';
		this.bgImage = null;
		this.bgColor = $('body').css('background-color');
		this.color = '#000';
		this.ncode = null;
		this.ncode2 = null;
		this.author = null;
		this.title = null;

		this.site = 'http://novel.syosetu.org/';
		this.api = 'about:blank';
		this.site2 = 'about:blank';

		// 短編判定と設定はここでしてしまう
		var m = HamelnSite.reURL.exec(url);
		if (m) {
			this.ncode = m[1];
			if (!m[2]  || m[2] == 'index.html') {
				// 中身のparseをしないと区別がつかない
				// 少なくとも連載ではないので仮設定は短編
				console.debug('短編 or 目次:', m[2]);
				this.isShortStory = true;
				gCurrentSection.id = 1;
				gGeneralAllNo = 1;
				setIndexPageDisabled ();
			} else {
				this.isShortStory = false;
				gCurrentSection.id = parseInt(m[3]);
				console.debug('連載:', gCurrentSection.id);
				gGeneralAllNo = null;
				setIndexPageNotReady();
			}
		} else {
			console.debug('!m:', m);
		}
	}
	HamelnSite.reURL = /http:\/\/novel\.syosetu\.org\/(\d+)\/(|index\.html|(\d+)\.html)?/;
	// ハーメルンの場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない
	HamelnSite.siteName = 'ハーメルン';
	HamelnSite.isSupportedURL = function (url) {
		// (m = reURL.exec(URL)) && m.index == 0
		console.debug('url', url, url.search(HamelnSite.reURL));
		return (url.search(HamelnSite.reURL) === 0);
	};
	// その作品のtopページ
	HamelnSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// その作品のindexページ
	HamelnSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	HamelnSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '.html';
	};

	HamelnSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentSection.id : section_no;
		return '';
	};
	HamelnSite.prototype.changeSection = function(section_no) {
		// formatは分かっているものの…
		// しおり自体の構成が動的に変動するので扱いが微妙
		// とりあえず落ちないようにする対策のみ
		// ここに来る条件が少し不明なり
		console.debug('Hameln change section');
		//$('#noja_shiori').attr('href', this.getShioriURL(section_no));
	};
	HamelnSite.prototype.setupLinkMenu = function (linkmenu) {
	};


	HamelnSite.prototype.isReloadSection = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD);
	};
	HamelnSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec == CURRENT_SECTION_NO_WITH_RELOAD || sec >= 1);
	};

	HamelnSite.prototype.isSectionInLowerBound = function (sec) {
		return (sec >= 1);
	};
	HamelnSite.prototype.canJumpToSection = function (sec) {
		return (sec <= this.maxSection);
	};
	HamelnSite.prototype.updateMaxSection = function (sec, force) {
		this.maxSection = (force === true) ? sec : Math.max(this.maxSection, sec);
	};

	HamelnSite.prototype.rebuild_forms = function () {
		$('#noja_impression_usertype').empty();
		$('#noja_novelreview_usertype').empty();
	};

	// 評価formの構築
	HamelnSite.prototype.buildReputationForm = function() {
	};












	/////////////////////////////////////////////////////////////
	// カラー指定の扱いとtoken関連は調整がいる
	HamelnSite.prototype.parseHtmlCommon = function (contents, section) {
		// 著者はfontの直後のa
		this.author = $('p:eq(0) > font[size="+2"]:eq(0) + a:eq(0)', contents).text();
		//console.debug("author:", this.author);

		var sec = {};

		//console.debug("title:", this.title);
		// subtitleはfontsizeで識別する
		//http://novel.syosetu.org/22690/4.html
		//明けない梅雨空 第一章　一話　明けない梅雨空　桐乃view
		//のようにベタっぽい
		// 見出しのほうでみると"明けない梅雨空"が章題っぽいが
		// 構造化されていないので単体では識別不能
		// 後で使うので保存
		var o_subtitle = $('font[size="+1"]:eq(0)', contents);
		//console.debug("subtitle:", o_subtitle.text());
		sec.chapter_title = '';
		sec.subtitle = o_subtitle.text();


		// 文章はdiv.ssの子の階層に全部ある
		// #maegakiはdivでid指定の同階層
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
			var script = $(descript + ':eq(0)', ctx);
			return (script.size()) ? script : null;
		};
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
				// #atogakiは上階層なので影響しない
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


		sec._honbun = (body) ? body.html() : null;
		sec._maegaki = (pre) ? pre.html() : null;
		sec._atogaki = (post) ? post.html() : null;
		//
		//console.debug("_honbun", sec._honbun);
		//console.debug("_maegaki", sec._maegaki);
		//console.debug("_atogaki", sec._atogaki);
		//
		sec = splitContentsBody (sec, section);
		//console.debug(sec);
		return sec;
	};

	HamelnSite.prototype.updateThemeAtSection = function (contents) {
		this.bgImage = null;
		this.bgColor = '#FFFFFF';
		this.color = contents.css('color');
//		this.bgImage = $('body').css('background-image');
//		if (this.bgImage === 'none' || this.bgImage === '') {
//			this.bgImage = null;
//		} else {
//			this.bgImage = $('<img />')
//				.attr('src', this.bgImage.match(/^url\((.*)\)$/)[1])
//				.bind('load', function(){showPage();})
//				.get(0);
//			this.bgColor = '#FFFFFF';
//		}
	};

	HamelnSite.prototype.updateTitleAtSection = function (contents) {
		// ここの判定はなんとか変更したいところ
		// タイトル関連
		// タイトルはfontの中のa
		this.title = $('p:eq(0) > font[size="+2"]:eq(0) > a:eq(0)', contents).text();
		//console.debug("title:", this.title);
	};

	HamelnSite.prototype.parseHtmlContents = function (htmldoc, section) {
		// '#maind'がbody直下でなければ仮divにつけなくてもよいが
		// 保守性を考え仮divにつけておく
		var contents = $('<div/>').append($.parseHTML(htmldoc))
			.find('#maind > div.ss:eq(0)');
		// minimum check
		if (!contents.size()) {
			console.debug('min check failed');
			return null;
		}
		return this.parseHtmlCommon (contents, section);
	};

	// カラー指定の扱いとtoken関連は調整がいる
	// 初期段階ではURLしかみていないため、
	// トップページが短編本文ページなのか目次ページなのか
	// 区別できない仕様なので、中身がないこともありうる
	HamelnSite.prototype.parseInitialPage = function () {
		var contents = $('#maind > div.ss:eq(0)');
		// minimum check
		if (!contents.size() || !contents.find('font[size="+2"]:eq(0) > a').size()) {
			console.debug('min check failed');
			return false;
		}
		// ログイン関連はとりあえず無効
		this.login = false;
		this.token = null;
		this.ncode2 = null;

		this.updateThemeAtSection (contents);
		this.updateTitleAtSection (contents);

		sections[gCurrentSection.id] = this.parseHtmlCommon (contents, gCurrentSection.id);
		setupCurrentSectionInfo(gCurrentSection.id);

		return true;
	};

	// gSiteParser内で持つ情報は更新しても
	// globalな情報は呼出し元で更新させる
	HamelnSite.prototype.loadIndex = function () {
		var dfrd = new $.Deffered();
		$.get (this.getNovelIndexURL()).then(
			// success: .done
			function (data) {
				// '#maind'はbody直下ではないからOkのはず
				var index = $('#maind > div.ss:lt(3)', data);
				var indexDiv = indexFrame.$div ();
				indexDiv.html(index);

				// @@ タグ等引っ張ってきた部分にlinkがあれば
				// @@ 目次階層とコンテンツ階層でリンク補正が必要になる

				// これは付けたものによる
				//this.author = $('.novel_writername', indexDiv)
				//	.contents()
				//	.not('a[href^="'+this.getShioriPrefixURL()+'"]')
				//	.text().slice(3);

				// レイアウト等の調整は放置
				// htmlやcssでいじるほうがいいのかどうか…
				var total_sec_no = 0;
				$('div.ss:eq(2) a', indexDiv).each(function() {
					var no = $(this).attr('href').match(/([0-9]+)\.html$/)[1];
					$(this).attr('href', null)
						.css('cursor', 'pointer');
					var sec_no = ++total_sec_no;
					//console.debug("no, sec_no:", no, sec_no);
					$(this).bind('click', function(){
						jumpTo (sec_no, FIRST_PAGE_NO);
						indexFrame.hide();
					});
				});
				dfrd.resolve (total_sec_no);
			},
			// error: .fail
			function () {
				console.debug ('load index: failed');
				dfrd.reject ();
			}
		);
		return dfrd.promise();
	};

	// 非同期にmaxだけもらうことはできないのでloadIndexする
	// callbackの仕様が同一なのでそのままrelayするだけ?
	// と思ったが折角loadIndexするのでready設定はすべき
	// 小説情報ページ等から取ってくる手もあるが、
	// どうせhtmldocを1ページ取得するならindexのほうがいい
	HamelnSite.prototype.loadMaxSectionNo = function () {
		var dfrd = new $.Deffered();
		this.loadIndex().then(
			function (maxSectionNo) {
				setIndexPageReady();
				dfrd.resolve (maxSectionNo);
			},
			function () {
				dfrd.reject ();
			}
		);
		return dfrd.promise ();
	};

	HamelnSite.prototype.startAsyncProcess = function () {
		// 自動loadIndexさせてもいいのだがどうしよう？
	};

	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	HamelnSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	////////////////////////////////////////////////////////////
	var gSiteParserList = [
		AppModeSite,
		NarouSite,
		NocMoonSite,
		AkatsukiSite,
		HamelnSite
	];
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	// 単ページ対応:切り上げ
	var getPagesAlinedCanvas = function (npages) {
		var rem = npages % gPagesPerCanvas;
		if (rem !== 0) {
			npages += (gPagesPerCanvas - rem);
		}
		return npages;
	};
	// 偶数ページ化(右ページ):切り捨て
	var getFirstPageAlinedCanvas = function (page_no) {
		return page_no - (page_no % gPagesPerCanvas);
	};

	var isLastPageInSection = function (page) {
		return (page >= (gTotalPages + (gTotalPages % gPagesPerCanvas) - gPagesPerCanvas));
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
		font_weight = (font_weight === undefined) ? FONTWEIGHT : font_weight;
		if (font_weight === null) {
			font_weight = '';
		}
		return $.render.canvasFontTmpl({
			fontWeight: font_weight,
			fontSize: font_size,
			fontFamily: getFontFamily()
		});
	};

	var get_thumb_font = function () {
		return get_canvas_font (gThumbFontSize);
	};

	// prefix省略ならselector id : ''指定ならid attribute
	var get_thumb_id = function (page, prefix) {
		page = (page === undefined) ? gCurrentSection.page : page;
		prefix = (prefix === undefined) ? '#' : prefix;
		return prefix + 'noja_page_' + page;
	};

	// サムネ画面を作る(右スライダー内)
	var drawThumbPage = function (page) {
		var thumb = $(get_thumb_id(page));
		if (!thumb.size()) {
			console.debug ('drawThumbPage: thumb not found');
		}
		var ctx = thumb.get(0).getContext('2d');
		ctx.font = get_thumb_font();
		drawPage(ctx
			, gThumbFontSize
			, gThumbSize
			, page
			, gThumbSize.width / gMainSize.width);
	};


	var is_beginning_of_halfwidth_string = function (text, pos) {
		return (pos === 0 || HANKAKU.indexOf(text[pos - 1]) < 0);
	};
	// "([0-9!?]{2})"
	var is_hankaku_lr_tb_string = function (s) {
		for (var i = 0; i < s.length; ++i) {
			if (TATECHUYOKO.indexOf(s[i]) < 0) {
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
		while (HANKAKU.indexOf(text[idx]) >= 0) {
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
	};

	////////////////////////////////////////////////////////
	// ルビ用の幅数え
	getCol_for_ruby_yokogaki = function (text) {
		var col = 0;
		for (var i = 0; i < text.length; ++i) {
			if (HANKAKU.indexOf (text[i]) >= 0) {
				col+=0.5;
			} else if (i === 0 || '゛゜\u3099\u309A'.indexOf(text[i])<0) {
				++col;
			}
		}
		return col;
	};
	getCol_for_ruby_tategaki = function (text) {
		var col = 0;
		for (var i = 0; i < text.length; ++i) {
			if (HANKAKU.indexOf (text[i]) >= 0) {
				if ((i === 0 || HANKAKU.indexOf(text[i-1]) < 0) &&
					TATECHUYOKO.indexOf(text[i]) >= 0 &&
					((i+1) == text.length || HANKAKU.indexOf(text[i-1]) < 0)) {
					++col;
				} else {
					col+=0.5;
				}
			} else if (i === 0 || '゛゜\u3099\u309A'.indexOf(text[i]) < 0) {
				++col;
			}
		}
		return col;
	};
	////////////////////////////////////////////////////////
	splitPage = function(text, line_num, char_num, space) {
		/*
			パース規則
			40col/行; 17行/ページ
			全角文字は1col、半角文字は0.5colとする
			１・２桁の半角数値及び半角の感嘆符・疑問符(!?)は縦中横とする。
			（一文字でも二文字でも1col）
			濁点、半濁点は前の文字に重ねて描画する（行頭に来ない限り0col）
			禁則文字
			'!?！？・：；:;‐-=＝〜～ゝゞーァィゥェォッャュョヮヵヶ
			ぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇷ゚ㇺㇻㇼㇽㇾㇿ々〻'
			の前の文字は、追い出しを行う。
			'、。，．）」｝〉》』】］〕〙〛〟”’'
			は、ぶら下げを行う。
			'（「｛〈《『【［〔〘〚〝“‘'
			は、追い出しを行う
		*/
		if (space === undefined || space === null) {
			space = 4;
		}
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
			if (gSetting.kaigyou) {
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
		var getCol_for_ruby = (gYokogaki)
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
							//none
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
						//    return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
						// });
						pos=p;
						r.push([col, l, t]);
						col+=l;
					} else if (text[pos] == 'i') {
						p = text.indexOf('>', pos)+1;
						var tt = $(text.slice(pos-1, p));	// <img>タグ全体
						var s = $(tt).attr('src');
						if (s === null) {
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
								var section = gLoadSection;	// parse中のコンテンツのsection
								// 対応済のはずだが未確認
								var pgno = getFirstPageAlinedCanvas(arr.length);
								arr.push($('<img>').attr('src', s)
									.bind('load', function() {
										// 実際に表示しようとしたload時のhook
										if (gCurrentSection.id == section) {
											if (gCurrentSection.page == pgno) {
												// canvasエリア描画がトリガー
												showPage();
											} else {
												// jump sliderページの表示がトリガー
												drawThumbPage (pgno);
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
							//none
						}
					}
					break;
				case '゛':
				case '゜':
				case '\u3099':	// 単独濁点
				case '\u309A':	// 単独半濁点
						var target;
						if(ln==='') {
							if(pageData.length === 0) {
								var target = arr[arr.length-1];
								target[target.length-1]+=text[pos];
							}
							else {
								pageData[pageData.length-1]+=text[pos];
							}
						}
						else {
							ln += text[pos];
						}
						++pos;
						break;
				case '&':
						while (text[p++] != ';') {
							// none
						}
						ch = $('<span>'+text.substr(pos, p-pos)+'</span>').text();
						/* falls through */
				default:
					if (HANKAKU.indexOf(ch) >= 0) {
						if((ln===''||HANKAKU.indexOf(text[pos-1])<0||text[pos-1]=='>')&&
							TATECHUYOKO.indexOf(ch)>=0&&
							(p>=text.length||text[p]=='<'||HANKAKU.indexOf(text[p])<0)) {
							++col;
						}
						else col += 0.5;
					}
					else {
						++col;
					}
					var _pos = pos;
					pos=p;
					if(col>=char_num-1 && GYOUMATSUKINSOKU.indexOf(text[pos])>=0) {
						ln+=ch;
						newLine();
					}
					else if(col >= char_num - 0.5) {
						if (BURASAGE.indexOf(text[pos])>=0) {
							ln+=ch+text[pos];
							++pos;
						}
						else if (GYOUTOUKINSOKU.indexOf(text[pos])>=0) {
							pos=_pos;
						}
						else {
							ln+=ch;
						}
						if(text[pos]!=='<') newLine();
					}
					else ln+=ch;
					break;
				}
				if(pos>=len) {
					newLine();
					break;
				}
				if (pos>=len||line >= line_num) break;
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
	// 前書き・後書き用(レイアウト時に字下げするため文字数を減らす)
	splitPageEx = function(text, nlines, nchars, space) {
		if (text === null) {
			return null;
		}
		// レイアウトするときは
		if (gLayout) {
			return splitPage(text, nlines, nchars - 2, space);
		} else {
			return splitPage(text, nlines, nchars, space);
		}
	};
	////////////////////////////////////////////////////////
	splitContentsBody = function (sec, sec_id) {
		console.debug('split contents body: sec_id', sec_id);
		console.debug('lc', gLinesPerCanvas, gCharsPerLine);
		if (sec_id !== undefined) {
			gLoadSection = sec_id;	// splitPageでimg関連で必要になる
		}
		sec.honbun  =   splitPage(sec._honbun,  gLinesPerCanvas, gCharsPerLine);
		sec.maegaki = splitPageEx(sec._maegaki, gLinesPerCanvas, gCharsPerLine, 2);
		sec.atogaki = splitPageEx(sec._atogaki, gLinesPerCanvas, gCharsPerLine, 2);
		return sec;
	};
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
		} else if (gAutoPage) {
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
	// 一部で有無checkを_maegakiのraw側でしている部分もあったが
	var countPages = function (section) {
		var nPages = sections[section].honbun[0].length;
		if (sections[section].maegaki !== null && gSetting.fMaegaki) {
			nPages += sections[section].maegaki[0].length;
		}
		if (sections[section].atogaki !== null && gSetting.fAtogaki) {
			nPages += sections[section].atogaki[0].length;
		}
		return nPages;
	};
	// アライメント補正はなし
	// 数える対象はグローバル変数に入ったもの
	var countPagesInCurrentSection = function () {
		var nPages = gCurrentSection.honbun[0].length;
		if (gCurrentSection.maegaki !== null && gSetting.fMaegaki) {
			nPages += gCurrentSection.maegaki[0].length;
		}
		if (gCurrentSection.atogaki !== null && gSetting.fAtogaki) {
			nPages += gCurrentSection.atogaki[0].length;
		}
		return nPages;
	};
	////////////////////////////////////////////////////////
	// 指定section範囲のページ数を計算
	var countPagesInSections = function (beginSection, endSection) {
		beginSection = (beginSection === undefined) ? 1 : beginSection;
		endSection   = (endSection   === undefined) ? gCurrentSection.id : endSection;
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
		gCurrentSection.id = section;
		// このあたりはsection構造そのままcopyでいいはず
		gCurrentSection.chapter_title = sections[gCurrentSection.id].chapter_title;
		gCurrentSection.subtitle = sections[gCurrentSection.id].subtitle;
		gCurrentSection.maegaki = sections[gCurrentSection.id].maegaki;
		gCurrentSection.atogaki = sections[gCurrentSection.id].atogaki;
		gCurrentSection.honbun = sections[gCurrentSection.id].honbun;
	};



	////////////////////////////////////////////////////////
	var showNavigationCursor = function (page) {
		var cursor = $(get_thumb_id(page));
		if (cursor.size()) {
			cursor.addClass('noja_page_select')
				.css('border-color', '');
		}
	};
	var hideNavigationCursor = function (page, without_border) {
		var cursor = $(get_thumb_id(page));
		if (cursor.size()) {
			cursor.removeClass('noja_page_select')
				.css('border-color', gSiteParser.color);
		}
	};


	////////////////////////////////////////////////////////
	// 右スライダーのページナビ
	$.templates('updateNaviIndexTmpl', '<div>{{:page}}ページ</div>');
	// canvasもtemplate化したほうがいいが、html側にもっていくべき

	updateNavigation = function() {
		var navi = navigationFrame.$div();
		navi.empty();
		gTotalPages = countPagesInCurrentSection();
		var canvas_attr = {
			width: gThumbSize.width + 'px',
			height: gThumbSize.height + 'px',
		};
		// @@ 一応単ページ対応
		for (var no = 0; no < gTotalPages; no += gPagesPerCanvas) {
			canvas_attr.id = get_thumb_id(no, '');
			(function() {
				// bindのfunction objectで使うためのコンテキスト
				var jump = {section: gCurrentSection.id, page_no: no};
				navi.append($.render.updateNaviIndexTmpl({page: (no + 1)}))
					.append(
						$('<canvas/>')
						.attr(canvas_attr)
						.css('border-color', gSiteParser.color)
						.bind('click', function() {
							jumpTo (jump.section, jump.page_no);
						})
					);
				drawThumbPage (no);
			})();
		}
		showNavigationCursor ();
	};


	////////////////////////////////////////////////////////
	var isNetworkBusy = function (msg) {
		if (gLoading && msg) {
			statusFrame.showMessage ('川・◊・)ねっとわーく接続中なのじゃー。' + msg);
		}
		return gLoading;
	};

	////////////////////////////////////////////////////////
	//各話の各ページにジャンプする関数。toPageに負の値を渡すと最後尾ページにジャンプ。

	jumpTo = function(section, toPage) {
		var show_hyouka_form = function() {
			statusFrame.showMessage('川・◊・)いま投稿されているのはここまでなのじゃー。感想を書いてあげるといいのじゃー。');
			if (gSiteParser.enableReputationForm) {
				$('#noja_hyouka').show();
			}
		};
		if (!gSiteParser.isSectionInLowerBound(section)) {
			statusFrame.showMessage('(´・ω・｀)ここが最初の話だよ');
			return;
		}
		//ジャンプ先が全話数より多ければ終了
		if (gGeneralAllNo && section > gGeneralAllNo) {
			console.debug("gGeneralAllNo, section", gGeneralAllNo, section);
			show_hyouka_form();
			return;
		}
		//isChangeSection===trueなら話移動が必要
		var isChangeSection = (section != gCurrentSection.id);
		//sectionに負の値を渡すと現在の話を強制再読み込み。
		if (gSiteParser.isReloadSection(section)) {
			section = gCurrentSection.id;
			isChangeSection = true;
		}
		//まだ読み込まれていない
		if (!(section in sections) || sections[section] === false
			|| sections[section] === null) {
			//読み込み終了までにこれが変更されてなかったら読み込み終了後にジャンプ
			gNextPage = toPage;
			gNextSection = section;
			//読み込み中はtrueをマークする
			sections[section] = true;
			++gLoading;
			//読み込み関数
			var load_section_main = function() {
				statusFrame.showLoading ();
				//ajaxでページを読み込む。
				$.get(gSiteParser.getNovelSectionURL (section))
				.then (
					// success: 成功
					function (data) {
						//データを登録
						sections[section] = gSiteParser.parseHtmlContents(data, section);
						autoPagerize(sections[section], section);
						--gLoading;
						//ステータスバーに成功を通知
						statusFrame.showMessage('(｀・ω・´)成功!!');
						gSiteParser.updateMaxSection(section);
						if (gNextPage != gCurrentSection.page
							|| gNextSection != gCurrentSection.id) {
							// ロードが終わったので再度本体関数を呼び出す
							jumpTo (gNextSection, gNextPage);
						}
						if (gSetting.autoSave) {
							nojaSave(false);
						}
					},
					// error: ステータスバーに失敗を通知
					function() {
						statusFrame.showMessage('失敗(´・ω・｀)……');
						//失敗時はfalseをマークする。
						sections[section] = false;
						--gLoading;
					}
				);
			};
			// ・存在が確認済の場合:無条件にload
			// ・最大話数が取得されていないなら取得しチェックしてからload
			// ・取得途中なら待ち
			if (gSiteParser.canJumpToSection(section)) {
				// 読み込まれていないが現在の最大セクションよりも小さいセクションを
				// 要求した場合は確実に存在するのでロードすればよい
				load_section_main();
			} else if (gGeneralAllNo === null) {
				console.debug('load max section no');
				//話数カウントされていない場合
				//読み込み中をマーク
				gGeneralAllNo = false;
				statusFrame.showLoading ();
				/// max取得成功した場合は引き続いてメインを呼ぶので
				// gLoadingはまだonにしたまま
				// 失敗したときだけoffにする
				gSiteParser.loadMaxSectionNo().then(
					// 成功
					function (maxSectionNo) {
						//話数を設定
						gGeneralAllNo = maxSectionNo;
						gSiteParser.updateMaxSection(gGeneralAllNo, true);
						if (section <= gGeneralAllNo) {
							// 存在が確認できたのでsection本体のロードを開始
							load_section_main();
						} else {
							show_hyouka_form();
							sections[section] = false;
						}
					},
					// 失敗
					function (maxSectionNo) {
						statusFrame.showMessage ('失敗(´・ω・｀)……');
						sections[section] = false;
						--gLoading;
						gGeneralAllNo = null;
					}
				);
			} else if (gGeneralAllNo === false) {
				/// max取得成功した場合は引き続いてメインを呼ぶので
				// gLoadingはまだonにしたまま
				// 本当はこれもgSiteParser側に移動したいところ
				// 読み込み中でまだ完了してないなら
				var wait_for_section_info = function() {
					if (gGeneralAllNo === false) {
						// まだ終わってないなら待ち
						setTimeout (wait_for_section_info, 100);
					} else if (gGeneralAllNo === null || section > gGeneralAllNo) {
						// 読み終わったが最大セクション数不定
						// ジャンプ先セクションが最大を超える
						// 場合は諦める
						sections[section] = false;
						--gLoading;
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
		// reMake後の状態でsections[]側は変わっているので
		// そっちをベースにすれば問題ないはずか。
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
			&& (toPage == gCurrentSection.page || !(toPage >= 0 && toPage < nPages))) {
			return;
		}
		gNextPage = toPage;
		gNextSection = section;

		// このあたりがちょい問題
		// reMakeとの同期が取れていないはず(オリジナルから)
		//
		// これって話数移動したら最大ページ数も変化するので
		// selectorでの指定先がない場合もあるのだがいいのかな？
		// (先にnavigation updateしないと)
		// 一応Cursor処理側でなくてもエラーにはならないようにしたが、
		// カーソルが消えることがあるかも？
		// (section移動:page=0だから実際にはありえない話か？)
		hideNavigationCursor();
		gCurrentSection.page = toPage;
		showNavigationCursor();
		//
		if (isChangeSection) {
			// 話の移動だった場合は情報更新
			setupCurrentSectionInfo (section);
			gSiteParser.changeSection (section);
			updateNavigation();
		}
		showPage();
	};
	////////////////////////////////////////////////////////
	var drawCanvasBackground = function (ctx, drawCanvasSize, fontSize, drawZoomRatio) {
		ctx.fillStyle = gSiteParser.bgColor;
		ctx.fillRect (0, 0, drawCanvasSize.width, drawCanvasSize.height);
		//
		var debug_draw_grid = false;
		if (debug_draw_grid) {
			var padding = 0;	// 10
			for (var xx = 0; xx <= drawCanvasSize.width; xx += fontSize) {
				ctx.moveTo (0.5 + xx + padding,                     0 + padding);
				ctx.lineTo (0.5 + xx + padding, drawCanvasSize.height + padding);
			}
			for (var yy = 0; yy <= drawCanvasSize.height; yy += fontSize) {
				ctx.moveTo (                   0 + padding, 0.5 + yy + padding);
				ctx.lineTo (drawCanvasSize.width + padding, 0.5 + yy + padding);
			}
			ctx.strokeStyle = 'blue';
			ctx.stroke();
			if (false) {
				if (gYokogaki) {
					for (var yy = 0; yy <= drawCanvasSize.height; yy += fontSize * gLineRatio) {
						ctx.moveTo (                   0 + padding, 0.5 + yy + padding);
						ctx.lineTo (drawCanvasSize.width + padding, 0.5 + yy + padding);
					}
				} else {
					for (var xx = 0; xx <= drawCanvasSize.width; xx += fontSize * gLineRatio) {
						ctx.moveTo (0.5 + xx + padding,                     0 + padding);
						ctx.lineTo (0.5 + xx + padding, drawCanvasSize.height + padding);
					}
				}
				ctx.strokeStyle = "red";
				ctx.stroke ();
			}
		}
		if (gSiteParser.bgImage) {
			var bgimage = gSiteParser.bImage;
			var bgSize = {
				width:  bgImage.width  * 2 * drawZoomRatio,
				height: bgImage.height * 2 * drawZoomRatio,
			};
			if (bgSize.width && bgSize.height) {
				for (var yy = 0; yy < drawCanvasSize.height; yy += bgSize.height) {
					for (var xx = 0; xx < drawCanvasSize.width; xx += bgSize.width) {
						ctx.drawImage (bgImage, xx, yy, bgSize.width, bgSize.height);
					}
				}
			}
		}
		if (false) {
			/*なんか微妙にイマイチだなって*/
			var mk_rgb = function (rgb, ratio) {
				if (ratio == 1) {
					return 'rgb(' + rgb.r + ', ' + rgb.b + ', ' + rgb.r + ')';
				} else {
					return 'rgb('
						+ Math.floor (rgb.r * ratio)
						+ ', '
						+ Math.floor (rgb.g * ratio)
						+ ', '
						+ Math.floor (rgb.b * ratio)
						+ ')';
				}
			};
			// y関連の引数がdrawCanvasSize.widthだったがheightの間違い？
			var grad = ctx.createLinearGradient(
				drawCanvasSize.width * 0.48, 0
				, drawCanvasSize.height * 0.52, 0);
			var m = /rgb\(([0-9]*),\s*([0-9]*),\s*([0-9]*)\)/g.exec(gSiteParser.bgColor);
			var rgb = {
				r: parseInt (m[1]),
				g: parseInt (m[2]),
				b: parseInt (m[3]),
			};
			[
				[0.00, 1.00],
				[0.20, 0.95],
				[0.25, 0.91],
				[0.30, 0.85],
				[0.40, 0.69],
				[0.50, 0.50],
				[0.60, 0.69],
				[0.70, 0.85],
				[0.75, 0.91],
				[0.80, 0.95],
				[1.00, 1.00],
			].forEach (function (elem) {
				grad.addColorStop (elem[0],  mk_rgb (rgb, elem[1]));
			});
			ctx.fillStyle = grad;
			ctx.fillRect (0, 0, drawCanvasSize.width, drawCanvasSize.height);
		}
		ctx.fillStyle = gSiteParser.color;
		ctx.strokeStyle = gSiteParser.color;
	};

	////////////////////////////////////////////////////////
	// drawPage内部関数だが内部に入れたままだと本体を読みづらいので外出し
	var calcEmbeddedImageSize = function (imageSize, pageSize) {
		var size = {
			width: imageSize.width,
			height: imageSize.height,
		};
		// @@TODO@@ 元はルート長方形固定だったがとりあえず限定解除してみる
		var aspect = Math.sqrt(2);
		if (gEnableFlexibleAspect) {
			aspect = (pageSize.height / pageSize.width);
		}
		if ((size.height / size.width) > aspect) {
			// 想定aspectよりも縦長
			if (size.height > pageSize.height) {
				// canvasよりも縦が長くてはみ出すなら
				// 縦をheightに縮小し縦縮小率に合わせて横も補正
				size.width *= pageSize.height / size.height;
				size.height = pageSize.height;
			}
		} else {
			// 想定aspectよりも横長
			if (size.width > pageSize.width) {
				// ページに収まるようなサイズ
				size.height *= pageSize.width / size.width;
				size.width = pageSize.width;
			}
		}
		return size;
	};

	////////////////////////////////////////////////////////
	// @@ TODO @@ 単ページ対応がいる
	// canvas contextに指定ページを描画する
	// thumb用もあるのでここの内部ではbodyFontSizeで指定する
	// drawPageは見開きのcanvas全体を書く
	// 多分bodyFontSize * gLineRatioがルビ・マージンも含めた行の幅
	// 
	drawPage = function (ctx, bodyFontSize, drawSize, pageIndex, drawZoomRatio) {
		drawZoomRatio = (drawZoomRatio === undefined) ? 1 : drawZoomRatio;
		////////////////////////////////
		var rubyFontSize = bodyFontSize / 2;
		// x,yをtypoしそうな気配
		// (Point classのような抽象化をするならoperatorも定義しないと使いづらい)
		// x,y独立フォントサイズになった場合は全面修正
		var $xy = function (x_y) {
			return bodyFontSize * x_y;
		};
		var $x = $xy;
		var $y = $xy;
		var $rxy = function (x_y) {
			return rubyFontSize * x_y;
		};
		var $rx = $rxy;
		var $ry = $rxy;
		////////////////////////////////
		// drawRubyBlock,drawTextBlockは縦書き横書きでmethodを分ける
		var drawRubyBlock;
		var drawTextBlock;
		if (gYokogaki) {
			// rubyFontSize, $rx,$ryに外部依存
			drawRubyBlock = function (text, x, y, fontSize, col) {
				ctx.save();
				if (text.match (/、+|・+/) == text) {
					ctx.font = get_canvas_font (rubyFontSize * 2);
					if (text[0] == '、') {
						ctx.translate ($rx(0.3), $ry(-0.6));
					} else {
						ctx.translate ($rx(0), $ry(0.1));
					}
				} else {
					ctx.font = get_canvas_font (rubyFontSize);
				}
				var dy = getCol_for_ruby_yokogaki(text) - (col * 2);
				var size_col = rubyFontSize;
				if (dy > 0) {
					// body側のカラム数が大きくて普通の状態だと置けない
					// 字間を90%に縮小
					// 幅不足分は左右均等に振り分け(90%縮小後の値で振り分け)
					dy *= 0.9;
					size_col *= 0.9;
					y -= $ry(dy / 2);
				} else {
					// body側の最大幅以内なので普通のサイズで置ける
					// 字間は均等割り
					dy = -dy;
					var span = $ry(dy) / text.length;
					size_col += span;
					// 4文字の文字列なら両端0.5*span文字、字間(1.0*span)*3
					y += span * 0.5;
				}
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					ctx.save();
					// (2,3.6)は本文位置の基本オフセット？
					// ruby_sizeでの位置なので本文カラムでいうと(1.0,1.8)
					ctx.translate (x + $rx(2), y + $ry(3.6));
					if (HANKAKU.indexOf (ch) >= 0) {
						x += size_col;	// 0.5では？
					} else {
						x += size_col;
					}
					ctx.fillText (ch, 0, 0);
					ctx.restore ();
				}
				ctx.restore ();
			};
			// x方向に1文字分shiftした位置になっている
			// y方向は0.85文字分下げ
			// draw団塊で配慮が必要なのは独立濁点半濁点の前結合
			drawTextBlock = function (text, x, y, fontSize) {
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//ctx.strokeRect(x, y + fontSize, fontSize, fontSize);
					ctx.save();
					ctx.translate(x + $x(1.0), y + $y(0.85));
					if (HANKAKU.indexOf (ch) >= 0) {
						x += $x(0.5);
					} else if ('゛゜\u3099\u309A'.indexOf (ch) >= 0) {
						ctx.translate ($x(-0.25), $y(0));
					} else {
						x += $x(1.0);
					}
					ctx.fillText (ch, 0, 0);
					ctx.restore ();
				}
			};
/////////
		} else {
			// 縦書き
			drawRubyBlock = function(text, x, y, fontSize, col) {
				ctx.save();
				if (text.match (/、+|・+/) == text) {
					// 縦書きルビだとどっちも同じ位置合わせでいいのかな？
					ctx.font = get_canvas_font (rubyFontSize * 2);
					// x方向は本文に寄せるのだろうy方向の調整は不明
					ctx.translate($rx(-0.5), $ry(0.5));
				} else {
					ctx.font = get_canvas_font (rubyFontSize);
				}
				var yy = getCol_for_ruby_tategaki (text) - (col * 2);
				var size_col = fontSize;
				if (yy > 0) {
					y -= fontSize * yy * 0.9 / 2;
					size_col *= 0.9;
				} else {
					var span = -yy * fontSize / text.length;
					size_col += span;
					y += span * 0.5;
				}
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//ctx.strokeRect(x + fontSize * 2, y + fontSize * 2, fontSize, size_col);
					ctx.save();
					ctx.translate (x + fontSize * 2, y + fontSize * 2.9);
					if (HANKAKU.indexOf(ch) >= 0) {
						// このあたりでルビ内半角の縦中横処理
						var halfwidth_string
							= get_hankaku_lr_tb_string(text, j);
						if (halfwidth_string.length == 2) {
							// "([0-9!?]{2})|([0-9][.,])"
							if (hankaku_narrow_width.indexOf(halfwidth_string[1]) >= 0) {
								// translate()引数が全省略でいいのか？
								// 多分drawTextBlock側での"1."等の場合の中央寄せ処理の残滓
								//ctx.translate();
							}
							ctx.fillText(ch, 0, 0);
							ch = text[++j];
							ctx.translate (fontSize / 2, 0);
							y+=size_col;
						} else if (halfwidth_string.length == 1) {
							// 半角1文字"[0-9!?]{1}"
							ctx.translate (fontSize / 4, 0);
							y+=size_col;
						} else {
							// 一般の半角1文字を縦書きで
							ctx.translate (fontSize / 6, - fontSize * 5/6);
							ctx.rotate(Math.PI / 2);
							y+=size_col * 0.5;
						}
					} else if (ZENKAKUKAITEN.indexOf(ch) >= 0) {
						ctx.translate(fontSize / 6, -fontSize * 5/6);
						ctx.rotate(Math.PI / 2);
						y+=size_col;
					} else if (ch=='ー') {
						ctx.translate(fontSize * 11/12, -fontSize * 5/6);
						ctx.rotate(Math.PI / 2);
						ctx.scale(1, -1);
						y+=size_col;
					} else if ('。、．，'.indexOf(ch) >= 0) {
						ctx.translate(fontSize * 3/5, -fontSize*3/5);
						y+=size_col;
					} else if (KOMOJI.indexOf(ch) >= 0) {
						ctx.translate(fontSize / 10, - fontSize / 8);
						y+=size_col;
					} else {
						y+=size_col;
					}
					ctx.fillText(ch, 0, 0);
					ctx.restore();
				}
				ctx.restore();
			};
			// y方向に1.9文字分の補正:xは指定した値のまま
			drawTextBlock = function(text, x, y, fontSize) {
				var font_metric = getFontMetric();
				for (var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//ctx.strokeRect(x, y + fontSize, fontSize, fontSize);
					ctx.save();
					ctx.translate(x, y + fontSize * 1.9);
					if (HANKAKU.indexOf(ch) >= 0) {
						var halfwidth_string
							= get_hankaku_lr_tb_string(text, j);
						if (halfwidth_string.length == 2) {
							// "([0-9!?]{2})|([0-9][.,])"
							// "1."の場合は"."が小さい幅なので1/4ほど中央に寄せる
							if (hankaku_narrow_width.indexOf(halfwidth_string[1]) >= 0) {
								ctx.translate(fontSize / 4, 0);
							}
							ctx.fillText(ch, 0, 0);
							ch = text[++j];
							ctx.translate(fontSize / 2, 0);
							y += fontSize;
						} else if (halfwidth_string.length == 1) {
							// 半角1文字"[0-9!?]{1}"
							ctx.translate(fontSize / 4, 0);
							y += fontSize;
						} else {
							// 一般の半角1文字を縦書きで
							ctx.translate(fontSize / 6, -fontSize * 5/6);
							ctx.rotate(Math.PI / 2);
							y += fontSize * 0.5;
						}
					} else if (ZENKAKUKAITEN.indexOf(ch) >= 0) {
						ctx.translate (fontSize / 6, -fontSize * 5/6);
						ctx.rotate(Math.PI / 2);
						y += fontSize;
					} else if (ch=='ー') {
						ctx.translate(fontSize * font_metric.x, -fontSize * font_metric.y);
						ctx.rotate(Math.PI / 2);
						ctx.scale(1, -1);
						y+=fontSize;
					} else if ('。、．，'.indexOf(ch) >= 0) {
						ctx.translate(fontSize*3/5, -fontSize*3/5);
						y+=fontSize;
					} else if ('“〝'.indexOf(ch) >= 0) {
						ctx.translate(0, fontSize/2);
						y+=fontSize;
					} else if (KOMOJI.indexOf(ch) >= 0) {
						ctx.translate(fontSize/10, -fontSize/8);
						y+=fontSize;
					} else if ('゛゜\u3099\u309A'.indexOf(ch) >= 0) {
						// 3099-309Cまでの記号
						// 3099は濁点の右上位置にあるもの(合成用？)
						// 309Aは半濁点の右上位置にあるもの(合成用？)
						// 309Bは単体の濁点(左上位置)
						// 309Cは単体の半濁点(左上位置)
						ctx.translate(fontSize * 0.75, -fontSize);
					} else if ('☹☺☻☼♠♡♢♣♤♥♦♧♫♬♮'.indexOf(ch) >= 0) {
						// 特殊記号を大き目に
						ctx.font = get_canvas_font (fontSize * 1.5, null);
						ctx.translate(fontSize * 0.175, fontSize * 0.15);
						y+=fontSize;
					} else {
						y+=fontSize;
					}
					ctx.fillText(ch, 0, 0);
					ctx.restore();
				}
			};
		}

		// Line = 1 Block
		var drawTextLine = function (bodyLine, bodyOffset, bodyCharFontSize) {
			drawTextBlock (bodyLine, bodyOffset.x, bodyOffset.y, bodyCharFontSize);
		};

		// [0] offset位置
		// [1] blockのカラム幅(被ルビの本文側の幅)
		// [2] text
		// 実際にはルビは半分のサイズ
		var drawRubyLine;
		if (gYokogaki) {
			drawRubyLine = function (rubyBlocks, rubyOffset
				, bodyCharFontSize, rubyCharFontSize) {
				rubyBlocks.forEach (function (ruby) {
					drawRubyBlock (
						ruby[2]
						, rubyOffset.x + (bodyCharFontSize * ruby[0])
						, rubyOffset.y
						, rubyCharFontSize
						, ruby[1]
					);
				}, this);
			};
		} else {
			drawRubyLine = function (rubyBlocks, rubyOffset
				, bodyCharFontSize, rubyCharFontSize) {
				rubyBlocks.forEach (function (ruby) {
					drawRubyBlock (
						ruby[2]
						, rubyOffset.x
						, rubyOffset.y + (bodyCharFontSize * ruby[0])
						, rubyCharFontSize
						, ruby[1]
					);
				}, this);
			};
		}

		/////////////////////////////////////
		// このあたりが処理コア部分
		drawCanvasBackground (ctx, drawSize, bodyFontSize, drawZoomRatio);

		// ページ内の充填行数は気にせず最大領域でrect boxを書く
		// 関数として共通のためis_first_pageで判定する
		var draw_layout_box;
		if (gYokogaki) {
			//  first : 左ページ: bias = 0
			// !first : 右ページ: bias = -2
			// biasは見開き左右対称にレイアウトするために位置が単純offsetではないため
			// (外側にa文字、内側にb文字というような形式)
			draw_layout_box = function (ctx, is_first_page, page_width) {
				var xoffset = (is_first_page) ? 0 : page_width - (bodyFontSize * 2);
				ctx.strokeRect(
					xoffset + bodyFontSize * (3.5)
					, bodyFontSize * 4.3
					, bodyFontSize * (gCharsPerLine + 1.1)
					, bodyFontSize * (gLinesPerCanvas * gLineRatio + 0.7)
				);
			};
		} else {
			draw_layout_box = function (ctx, is_first_page, page_width) {
				// 右: hwidth + csz*1.4
				//		hwidth + csz*1.4 + csz*gLineRatio*ln + csz*0.6 - 1
				//		hwidth + csz*2 + csz*gLineRatio*ln - 1
				// 左: hwidth - csz*gLineRatio*ln - csz*2
				//		hwidth - csz*gLineRatio*ln - csz*2 + csz*gLineRatio*ln + csz*0.6 - 1
				//		hwidth - csz*1.4 - 1
				// 2つ分位置が違う
				var xoffset = (is_first_page)
					? page_width
					: page_width - bodyFontSize * ((gLinesPerCanvas + 2) * gLineRatio)
				;
				ctx.strokeRect(
					xoffset + bodyFontSize * (1.4)
					, bodyFontSize*4.3
					, bodyFontSize*(gLinesPerCanvas*gLineRatio+0.6)	// 0.3づつ外に幅をつけるのかな？
					, bodyFontSize*(gCharsPerLine-1+0.4)
				);
				if (false && !is_first_page) {
					ctx.save();
					ctx.strokeStyle = 'rgb(0, 0, 200)';
					ctx.strokeRect(
						bodyFontSize * 4.2
						, bodyFontSize * 1.3
						, bodyFontSize * (gLinesPerCanvas * gLineRatio + 0.6)
						, bodyFontSize * (gCharsPerLine - 1 + 0.4)
					);
					ctx.restore();
				}
			};
		}


		// ノンブル領域
		var page_number_margin = getMarginOfPageNumber (bodyFontSize);
		// 上柱領域
		var upper_running_head_margin = getMarginOfUpperRunningHead (bodyFontSize);


		// 全話つなげるならgCurrentSection.id手前までのページ数を計算
		var page_base = (gAllpage) ? countPagesInSections (1, gCurrentSection.id) : 0;
		// tposはsubtitleを書くページ位置(main text開始ページ)
		// 前書きがあれば前書き終了後の次ページ
		var tpos = (gCurrentSection.maegaki !== null && gSetting.fMaegaki)
			? gCurrentSection.maegaki[0].length : 0;
		var apos = tpos + gCurrentSection.honbun[0].length;

		var FRONT_MATTER = 0;
		var MAIN_TEXT = 1;
		var BACK_MATTER = 2;

		var getTextType = function (page_no) {
			if (page_no < tpos) {
				return FRONT_MATTER;
			} else if (page_no < apos) {
				return MAIN_TEXT;
			}
			return BACK_MATTER;
		};
		var isMainTextFirstPage = function (page_no) {
			return (page_no == tpos);
		};

		var isMainTextPage = function (page_no) {
			return (getTextType (page_no) == MAIN_TEXT);
		};

		var getPageText = function (page_no) {
			switch (getTextType (page_no)) {
			case FRONT_MATTER:
				return {
					bodyLines: gCurrentSection.maegaki[0][page_no - 0],
					rubyLines: gCurrentSection.maegaki[1][page_no - 0],
				};
			case MAIN_TEXT:		// 本文
				return {
					bodyLines: gCurrentSection.honbun[0][page_no - tpos],
					rubyLines: gCurrentSection.honbun[1][page_no - tpos],
				};
			case BACK_MATTER:	// 後書き
				return {
					bodyLines: gCurrentSection.atogaki[0][page_no - apos],
					rubyLines: gCurrentSection.atogaki[1][page_no - apos],
				};
			}
			return {};
		};

		///////////////////////////////////////
		// 左右ページの描画
		var page_size = {
			width: (drawSize.width / gPagesPerCanvas),
			height: drawSize.height,
		};
		console.debug("drawSize", drawSize);
		console.debug("page_size", page_size);
		var end_page = Math.min(pageIndex + gPagesPerCanvas, gTotalPages);
		for (var currentDrawPage = pageIndex; currentDrawPage < end_page; ++currentDrawPage) {
			// pageIndexはもともとintだから型変換比較でいいはず
			var is_first_page = (currentDrawPage == pageIndex);
			console.debug("is_first_page", is_first_page);
			console.debug("page_size", page_size);
			// 左右マージンの違いを考慮しないページ全体としてのオフセット
			// 横書き:
			//    (左ページ,右ページ) : 0 * page_size.width : 1 * page_size.width
			// 縦書き:
			//    (右ページ,左ページ) : 1 * page_size.width : 0 * page_size.width
			var offsetOfPage_x;
			if (gYokogaki) {
				offsetOfPage_x = ((is_first_page) ? 0 : 1) * page_size.width;
			} else {
				offsetOfPage_x = ((is_first_page) ? 1 : 0) * page_size.width;
			}
			console.debug("offsetOfPage_x", offsetOfPage_x);
			var offsetOfPageRight_x = (offsetOfPage_x + page_size.width);
			console.debug("offsetOfPageRight_x", offsetOfPageRight_x);

			// 左右ページで違うマージン補正用
			// 
			var offsetOfPageWithAlign_x = offsetOfPage_x;
			if (gYokogaki) {
				offsetOfPageWithAlign_x += ((is_first_page) ? 0 : -(bodyFontSize * 2));
			}
			console.debug("offsetOfPageWithAlign_x", offsetOfPageWithAlign_x);
			var is_left_page = (gYokogaki) ? is_first_page : !is_first_page;
			var is_right_page = !is_left_page;
			console.debug("left, right", is_left_page, is_right_page);

			var displayPageNo = page_base + currentDrawPage + 1;
			console.debug("display page no", displayPageNo);

			// サブタイトル表示
			if (isMainTextFirstPage (currentDrawPage)) {
				var subtitleFontSize = bodyFontSize * 1.4;
				ctx.save();
				ctx.font = get_canvas_font (subtitleFontSize);
				var text = gCurrentSection.subtitle;
				// @@ TODO@@ この判定はgSiteParser.isShortStory()等のほうが良い
				if (isIndexPageDisable()) {
					text += '　　　' + gSiteParser.author;
				}
				var offset = { x: 0, y: bodyFontSize * 6};
				if (gYokogaki) {
					// 左だと6+1字下げ(+1はdrawTextBlock内)
					// 右だと4+1字下げっぽい(+1はdrawTextBlock内)
					offset.x = offsetOfPageWithAlign_x + bodyFontSize * 6;
				} else {
					// 縦書きの倍、基準点はページ左端なので
					// 行数分だけ戻す
					// 右:page_size.widthが基点
					// 左:0が基点
					// 文字幅*gLineRatio * 行数のページ先頭位置？
					offset.x = offsetOfPage_x
						+ bodyFontSize * gLinesPerCanvas * gLineRatio;
				}
				drawTextBlock(text
					, offset.x
					, offset.y
					, subtitleFontSize
				);
				ctx.restore();
			}

			var pageText = getPageText (currentDrawPage);

			// 前書き・後書き:囲いbox部分のみ先行描画
			// 本文の字下げ(横だと左ページ基準での字下げ数)
			var bodyIndent = 3;
			if (!isMainTextPage (currentDrawPage)) {
				if (gLayout) {
					draw_layout_box (ctx, is_first_page, page_size.width);
					++bodyIndent;	// 追加1字下げ
				}
			}

			// 選んだ領域の該当ページにimgがあった場合の処理
			// ノンブル等もなしでベタの1page画像
			if (Object.prototype.toString.call(pageText.bodyLines)
				.slice(8, -1) === 'HTMLImageElement') {
				// drawZoomRatioはdrawPageの引数でデフォルト1
				//  page index部の場合に使われる
				// 2倍サイズで計算(canvas自体が2倍サイズなので)
				var image = pageText.bodyLines;
				var image_size = calcEmbeddedImageSize (
					{
						width: image.width * 2 * drawZoomRatio,
						height: image.height * 2 * drawZoomRatio
					}
					, page_size
				);
				// センターアライメントで書く
				ctx.drawImage(
					image
					, offsetOfPage_x + (page_size.width - image_size.width) / 2
					, (page_size.height - image_size.height) / 2
					, image_size.width
					, image_size.height
				);
				continue;
			}

			// 上柱領域:横書き
			if (is_right_page) {
				// 右4文字マージン,縦は上から2.5文字の位置 or 2,3文字の位置(高:2文字)
				var offset_x = offsetOfPageRight_x - upper_running_head_margin.x;
				var text1 = gCurrentSection.chapter_title;
				var text2 = gCurrentSection.subtitle;
				if (text1 === '') {
					// 章タイトルがない場合は2～3行領域に上下中央寄せでサブタイのみ
					ctx.fillText (
						text2
						, alignRight (offset_x, ctx, text2)
						, upper_running_head_margin.y_center
					);
				} else {
					ctx.fillText (
						text1
						, alignRight (offset_x, ctx, text1)
						, upper_running_head_margin.y + (bodyFontSize * 0)
					);
					ctx.fillText (
						text2
						, alignRight (offset_x, ctx, text2)
						, upper_running_head_margin.y + (bodyFontSize * 1)
					);
				}
				// ページ区切り線
				// 中央から右に幅0.6
				ctx.fillRect (page_size.width, 0, 0.6, page_size.height);
			} else {
				// 上柱領域の処理(左ページ)
				// 左寄せ
				var offset_x = offsetOfPage_x + upper_running_head_margin.x;
				ctx.fillText (
					gSiteParser.title
					, offset_x
					, upper_running_head_margin.y_center
				);
				// ページ区切り線
				// 中央-0.6から右に幅0.6(中央から左に幅0.6)
				ctx.fillRect (page_size.width - 0.6, 0, 0.6, page_size.height);
			}

			// ノンブル領域
			if (is_right_page) {
				// 右ページ ノンブル領域
				// 右寄せ2文字空け: 全体幅 - マージン - 文字列幅
				var offset = {
					x: offsetOfPageRight_x - page_number_margin.x,
					y: page_size.height - page_number_margin.y,
				};
				ctx.fillText (displayPageNo
					, alignRight(offset.x, ctx, displayPageNo), offset.y);
			} else {
				// 左ページ ノンブル領域
				// 左寄せ2文字空け
				var offset = {
					x: 0 + page_number_margin.x,
					y: page_size.height - page_number_margin.y,
				};
				ctx.fillText (displayPageNo, offset.x, offset.y);
			}


			// 選んだ領域の該当ページの中身部分
			// base+ruby
			// 縦書き横書きの判定はループ外へ
			if (gYokogaki) {
				// bodyIndent補正がx方向に効いてくる
				// bodyIndent値の本来の値は3で3文字下げ
				// レイアウト時は左ページだと4 : drawTextBlock側補正後5
				//               右ページだと2 : drawTextBlock側補正後3
				// その他のケースは3 :
				//    左ページだとdrawTextBlock側補正後4
				//    右ページだとdrawTextBlock側補正後(4 - 3) + 1(補正)=2
				// 左ページ基準になるので左ページ左余白4と右ページ左余白2の
				// 補正として右ページの場合base-2位置をxoffsetとする
				// オリジナルだとbodyIndentを左右で変えたり式の上では-bodyIndentしたりしていたが
				// offsetを調整して左右で同じ式になるように細工したほうがいいので変更
				var xoffset = offsetOfPageWithAlign_x + bodyFontSize * bodyIndent;
				for (var i = 0; i < pageText.bodyLines.length; ++i) {
					var ypos = bodyFontSize * (i * gLineRatio);
					// bodyと指定が違うのはバグでは？
					var bodyoffset = { x: xoffset, y: ypos + (bodyFontSize * 5)};
					var rubyoffset = { x: xoffset, y: ypos + (bodyFontSize * 3)};
					drawTextLine (pageText.bodyLines[i], bodyoffset, bodyFontSize);
					drawRubyLine (pageText.rubyLines[i], rubyoffset, bodyFontSize, rubyFontSize);
				}
			} else {
				// 縦書き
				// bodyIndentは字下げ位置
				// bodyIndent値の本来の値は3で3文字下げ
				// 左ページ:左余白5右余白2になる？
				// 右ページ:左余白2右余白5になる？
				var offset_y = bodyFontSize * bodyIndent;
				var bodyWithRubyFontSize = bodyFontSize * gLineRatio;
				for (var i = 0; i < pageText.bodyLines.length; ++i) {
					// 左ページ:-3 + 1=-2行の右余白:+1はその行の左上始点のため
					// left - 3 -i*gLineRatio
					// 右ページ:-6 + 1=-5行の右余白:
					// right + (nl-1)*gLineRatio -i*gLineRatio + 2
					// ****x方向にdrawTextLine内で補正はかからない****
					// 左-3=-1.3-gLineRatioで右余白1.3で文字の左位置が-gLineRatioということ
					// 右は2あるなあ。(i max=gLinesPerCanvas-1なので0*gLineRatioになる
					// 中央についてはノーマル3行分の余白が基準
					// ただし、それについては1.7の幅がとられるので
					// 実質ノーマルサイズでの余白は1.3行分になる
					// 多分、上柱位置を考えると端4の中央2で6/ページの余白？
					//
					// オリジナル
					// pagesize + fontsize*1.7*(nline-1-i) + fontsize*2
					//   内側2文字余白+1行目の左位置
					//   こっちも1文字分調整
					//   or
					// pagesize - fontsize*1.7*(i) - fontsize * 3
					//   これだと内側(3 - 1.7)=1.3文字が左位置？
					// ルビなしの場合に実質は内側2文字
					//   調整で1文字左にしないと合わない？
					var xpos = (is_first_page
						? page_size.width + (bodyFontSize * 3)
							+ (bodyWithRubyFontSize * (gLinesPerCanvas - 1))
							- (bodyWithRubyFontSize * i)
						: page_size.width - (bodyFontSize * (3 + 1))
							- (bodyWithRubyFontSize * i)
						);
					var bodyoffset = {x: xpos, y: offset_y};
					var rubyoffset = {x: xpos, y: offset_y};
					drawTextLine (pageText.bodyLines[i], bodyoffset, bodyFontSize);
					drawRubyLine (pageText.rubyLines[i], rubyoffset, bodyFontSize, rubyFontSize);
				}
			}
		}
	};
	////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////
	showPage = function() {
		console.debug('showPage', gCurrentSection.page);
		drawPage(gMainContext, gCharFontSize, gMainSize, gCurrentSection.page);
		drawThumbPage(gCurrentSection.page);
	};

	///////////////////////////////////////////
	// 目次読み込み
	// silentモード対応にして
	// Hameln等のmaxSectioNo関連はこっちを使うようにしたいところ
	//
	$.templates('loadIndexTmpl'
		, '目次の読み込み中...<br /><img src="{{:image}}" />');

	loadIndex = function() {
		if (getIndexPageStatus() === INDEXPAGE_NOWLOADING) {
			return;
		}
		indexFrame.setLoadMessage($.render.loadIndexTmpl({image: ICON_LOADING2}));
		// 
		var prev = getIndexPageStatus();
		setIndexPageStatus (INDEXPAGE_NOWLOADING);
		++gLoading;
		// .done(),.fail(),.always()は単なるregist機能で同期化機構はない
		// .then()は同期化があり、funcが終わってから後続が発火していく
		gSiteParser.loadIndex().then(
			function (maxSectionNo) {
				gGeneralAllNo = maxSectionNo;
				gSiteParser.updateMaxSection(gGeneralAllNo, true);
				setIndexPageReady();
			},
			function () {
				setIndexPageStatus (prev);
				indexFrame.setLoadMessage('目次の読み込みに失敗しました');
			}
		).always(function() {
			// あまり同期化の意味はないが、then部分が終わってから実行
			--gLoading;
		});
	};
	////////////////////////////////////////////////////////
	// @@ 単ページ対応済 @@
	loadNext = function() {
		var new_page = gCurrentSection.page + gPagesPerCanvas;
		var new_section = gCurrentSection.id;
		if (new_page >= gTotalPages) {
			new_page = 0;
			new_section += 1;
		}
		jumpTo (new_section, new_page);
	};
	loadPrev = function() {
		var new_page = gCurrentSection.page - gPagesPerCanvas;
		var new_section = gCurrentSection.id;
		if (new_page < 0) {
			new_page = -1;
			new_section -= 1;
		}
		jumpTo (new_section, new_page);
	};
	var load_next_direction = function (isNext, invertIfYokogaki) {
		if (!invertIfYokogaki) {
			invertIfYokogaki = false;
		}
		if (((invertIfYokogaki && gYokogaki) ? !isNext : isNext)) {
			loadNext();
		} else {
			loadPrev();
		}
	};
	///////////////////////////////////////////
	// 一部ではsec !== nullがないベタ展開コードがあったが問題ないので統合
	// 一部でstart=1で呼び出している箇所があるが謎
	//
	// デフォルト引数はFirefox系じゃないとサポートしてない(ECMA Script 6の仕様内)
	// http://kangax.github.io/es5-compat-table/es6/
	// しょうがないからまだおとなしく普通にかいておく
	//
	reMake = function (start) {
		console.debug("remake pages called");
		start = (start === undefined) ? 0 : start;
		for (var i = start; i < sections.length; ++i) {
			var sec = sections[i];
			if (i in sections && sec !== false && sec !== null) {
				console.debug("remake page:", i);
				console.debug("param lc:", gLinesPerCanvas, gCharsPerLine);
				sec = splitContentsBody (sec, i);
			}
		}
	};




	// [2^0,2^2] = [1,4] 2.0が基準
	// min:gCharsPerLine=20 gLinesPerCanvas=17/2=8.5 で丸めて8.0
	// mid:gCharsPerLine=40 gLinesPerCanvas=17
	// max:gCharsPerLine=80 gLinesPerCanvas=17*2=34
	// 実際にはvalueは200にならない？
	// maxにしてgCharsPerLine=19
	// 横で13,10
	// 1行文字数計算はそのままでOkだが、横幅は修正がいる
	// 仮値をいれておくことはできない
	// change->lc計算->split(remake)->resizeでdrawなので
	// lcは次段で必要になる
	// 40*17行
	// (gLineRatio=1.7)

	// @@ TODO @@ ここのマジックナンバーはレイアウト変更に影響する
	var gMarginLinesYokogaki = 6;
	var gMarginLinesTategaki = 8;

	var STANDARD_LC_TATEGAKI = {
		nchars: 40,
		nlines: 17,	// (40 / sqrt(2)) / 1.7 が大体これくらい
	};
	// 29*24.5行?
	var STANDARD_LC_YOKOGAKI = {
		nchars: 29,			// こっちは29*sqrt(2)/1.7
		nlines: 24.5,		// initializeでは23.5だったがtypo?
	};
	// withUpdateのときは変更したかどうかboolを返す
	// (lcは変更値を参照する)
	// !withUpdateのときは計算したLCを返す
	var updateLC = function (zoomRatio, withUpdate) {
		var lc = {
			nchars: 0,
			nlines: 0,
		};
		var std_lc = (gYokogaki) ? STANDARD_LC_YOKOGAKI : STANDARD_LC_TATEGAKI;
		lc.nchars = Math.floor (std_lc.nchars * (zoomRatio / 2.0));
		if (gEnableFlexibleAspect) {
			var aspect = (gMainSize.width / gMainSize.height);
			console.debug ("gMainSize, aspect:", gMainSize, aspect);
			// ルビなしのカラムサイズで比率計算して、
			// その後ルビ付の行数に補正する
			console.debug ("lc.nchars:", lc.nchars);
			if (true) {
				if (gYokogaki) {
					var dpc = (gMainSize.width / gPagesPerCanvas)
						/ (lc.nchars + gMarginLinesYokogaki);
					console.debug ("dpc:", dpc);
					// マージン設定は上下方向のマージンなので仮に使っている
					var nlines = 
						(gMainSize.height + gMarginLinesTategaki) / dpc;
					console.debug ("nlines:", nlines);
					lc.nlines = Math.floor (nlines / gLineRatio);
				} else {
					// 余白計算
					// ノーマル(4+2) + (2+4)が見開きでの確保量
					// 縦の確保量でdpiが出る
					var dpc = gMainSize.height / (lc.nchars + gMarginLinesTategaki);
					console.debug ("dpc:", dpc);
					// ここで、page_width = (2+4)*dpi + nlines*dpi*1.7
					// nlines = (page_width - (margin)*dpi)/(1.7*dpi)
					var page_width = (gMainSize.width / gPagesPerCanvas);
					var nlines = (page_width - gMarginLinesYokogaki * dpc)
						/ (dpc * gLineRatio);
					console.debug ("nlines:", nlines);
					lc.nlines = Math.floor (nlines);
				}
			} else {
				if (gYokogaki) {
					lc.nlines = Math.floor ((lc.nchars * aspect) / gLineRatio);
				} else {
					lc.nlines = Math.floor ((lc.nchars / aspect) / gLineRatio);
				}
			}
		} else {
			lc.nlines = Math.floor (std_lc.nlines * lc.nchars / std_lc.nchars);
		}
		console.debug ("lc:", lc);
		if (withUpdate) {
			var isChanged = !(gCharsPerLine == lc.nchars && gLinesPerCanvas == lc.nlines);
			gCharsPerLine = lc.nchars;
			gLinesPerCanvas = lc.nlines;
			console.debug ("change global lc:", lc);
			return isChanged;
		}
		return lc;
	};
	////////////////////////////////////////////////////////
	// 縦書き:ノンブル等本文以外の上下領域が縦書きだと8文字分
	// 横書き:ページwidthに対して左右余白が6文字分
	//  この横書きの6文字は縦書きのときも余白行として4(両端):2(中央)で使われる
	var calcRealCharFontSize = function (nCharsPerLine) {
		var charFontSize;
		if (gYokogaki) {
			charFontSize = (gMainSize.width / gPagesPerCanvas)
				/ (nCharsPerLine + gMarginLinesYokogaki);
		} else {
			charFontSize = gMainSize.height
				/ (nCharsPerLine + gMarginLinesTategaki);
		}
		return charFontSize;
	};
	////////////////////////////////////////////////////////
	// globalな変数と衝突するローカル引数名になっているので中では参照先はローカル
	// ここも実寸2倍サイズで書いてるのか？
	// canvasのw,h指定の半分でcss指定しているので1/2
	var remake_noja_charsize = function (charFontSize, nchars, nlines) {
		var size = {width: 8 * charFontSize, height: 2 * charFontSize};
		var location = {x: 1 * charFontSize, y: 1.5 * charFontSize};
		//
		// example部分の更新:width=8,height=2の文字数サイズにする
		// id自体はcanvasタグなのでcanvasサイズ指定が2倍サイズ
		// css指定が表示領域サイズ:実サイズ
		$('#noja_charsize').get(0).width  = size.width;
		$('#noja_charsize').get(0).height = size.height;
		$('#noja_charsize').css({
			width:  size.width / 2,
			height: size.height / 2,
		});
		// height=1.5位置に例文を書く
		var ctx = $('#noja_charsize').get(0).getContext('2d');
		ctx.font = get_canvas_font (charFontSize);
		ctx.fillStyle = '#FFFFFF';	// これはresize時にはないが問題ないはず
		ctx.fillRect(0, 0, size.width, size.height);
		ctx.fillStyle = '#000000';	// これはresize時にはないが問題ないはず
		ctx.fillText('あア漢Ａ１', location.x, location.y);
		$('#noja_char_line').text(
			(charFontSize / 2).toFixed (2)+'px, '
			+ nchars + '文字/行, '
			+ nlines + '行/ページ'
		);
	};
	////////////////////////////////////////////////////////
	var updateMainSize = function () {
		// どうもobjで書き換えるとpropがうまく更新されない感じがある
		gMainSize.width = $('#noja_main').width();
		gMainSize.height = $('#noja_main').height();
		console.debug ("gMainSize", gMainSize);
		var style;
		// 親のnoja_mainが
		//#noja_main {
		//   width:100%; height:100%;
		//   position:fixed;
		//   top:0px; left:0px; right:0px;
		//  z-index:100; background-color:#CCC; overflow:hidden
		//}
		var aspect = Math.sqrt(2);
		if (gEnableFlexibleAspect) {
			aspect = (gMainSize.width / gMainSize.height);
			console.debug('aspect', aspect);
		}
		if ((gMainSize.width / gMainSize.height) > aspect) {
			// ルート長方形より横長:縦そのままで横補正
			var modified_width = Math.floor(gMainSize.height * aspect);
			gMainSize.width = modified_width;
			console.debug('mod width', modified_width);
			// positionデフォルトなのでstatic指定？
			// leftのデフォルトはautoなのでセンター？
			style = {
				width: gMainSize.width,
				height: gMainSize.height,
				top: '',
				left: '',
				position: ''
			};
		} else {
			// ルート長方形より縦長:横そのままで縦補正して上マージン設定
			console.debug ("gMainSize", gMainSize);
			console.debug ("gMainSize.width", gMainSize.width);
			var modified_height = Math.floor(gMainSize.width / aspect);
			console.debug('mod height calc', gMainSize.width / aspect);
			var top_margin = (gMainSize.height - modified_height) / 2;
			gMainSize.height = modified_height;
			console.debug('mod height', modified_height);
			// 上下はautoにしてしまうと上に詰まるので半分の位置にマージン設定している
			style = {
				width: gMainSize.width,
				height: gMainSize.height,
				top: top_margin,
				left: 0,
				position: 'absolute'
			};
		}
		// 実際のcanvasは2倍拡大したcanvas
		gMainSize.width  *= 2;
		gMainSize.height *= 2;
		console.debug ("gMainSize", gMainSize);
		$('#noja_canvas_main').get(0).width  = gMainSize.width;
		$('#noja_canvas_main').get(0).height = gMainSize.height;
		// スタイル側は実サイズ(2倍する前にdict設定済)
		$('#noja_canvas_main').css(style);

		if (gEnableFlexibleAspect) {
			// サイズに併せて更新しないとまずいか？
			return updateLC(slidePos2ZoomRatio (gSlidePos), true);
		}
		return false;
	};
	onResize = function () {
		var needRemake = updateMainSize();
		// 1行n文字等は設定で指定してる。それに従って
		// 実際のフォントサイズが決まる
		// gCharsPerLineからgCharFontSizeを計算
		gCharFontSize = calcRealCharFontSize (gCharsPerLine);
		// ページの作り直し
		gMainContext = $('#noja_canvas_main').get(0).getContext('2d');
		gMainContext.font = get_canvas_font (gCharFontSize);
		// 表示menu部分の文字サイズ指定部分の作り直し
		remake_noja_charsize (gCharFontSize, gCharsPerLine, gLinesPerCanvas);
		if (needRemake) {
			// この場合reMakeとcurrent更新はペアじゃないといけない
			console.debug("remake pages calling");
			// reMake()は後処理の段取りが別途必要なので要改善
			reMake();
			setupCurrentSectionInfo (gCurrentSection.id);
			updateNavigation();
			jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
		}
		showPage();
	};
	/////////////////////

	nojaOpen = function() {
		rootFrame.showNow();
		//
		$('body').css('overflow', 'hidden');
		$('#novel_header').hide();
		//
		onResize();
		gIsNojaOpen = true;
	};
	/////////////////////
	nojaClose = function() {
		rootFrame.hideNow();
		menuFrame.hideNow();
		indexFrame.hideNow();
		navigationFrame.hideNow();
		statusFrame.hideNow();
		popupMenu.close();
		//
		$('#novel_header').show();
		$('body').css('overflow', 'visible');
		//
		gIsNojaOpen = false;
	};
	///////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////
	// @@ 互換性のためtypoをそのまま残すか？(auther)
	// indexPageStatusの評価部分が少しview側に依存した感じ
	var createImportedInfoFromJSON = function (json) {
		var info = {};
		infos.site   = json.site[0];
		infos.site2  = json.site[1];
		//
		infos.ncode  = json.ncode[0];
		infos.ncode2 = json.ncode[1];
		infos.author = json.auther;
		infos.generalAllNo = json.general_all_no;
		infos.indexPageStatus = json.tanpen;	// 仮設定(後で変換がいる)
		return infos;
	};

	var parseImportedHtmlNojaHeader = function (htmldoc) {
		var pos = htmldoc.indexOf(DOWNLOAD_ID);
		if (pos < 0) {
			return false;
		}
		pos += DOWNLOAD_ID.length;
		var json = $.parseJSON(htmldoc.substr(pos).match(/{[^}]*}/)[0]);
		// site,ncodeはそれぞれ2要素の配列
		// 常に短編設定値があるはず
		// (不定長の場合はlength=nullに設定)
		var isValidNojaHeader = true;
		$.each({site: 2, ncode: 2, tanpen:1 }, function(name, length) {
			if (!(name in json) || (length !== null && json[name].length != length)) {
				isValidNojaHeader = false;
				return false;	// break each loop
			}
		});
		return (isValidNojaHeader)
			? createImportedInfoFromJSON (json) : false;
	};


	function MinMaxRecorder() {
		this.min = 0x7fffffff;
		this.max = 0;
	}
	MinMaxRecorder.prototype = {
		update: function (value) {
			this.min = Math.min (this.min, value);
			this.max = Math.max (this.max, value);
			return this;
		},
	};

	// dataRoot直下のdivから各download_sectionを取り出す
	var getSectionsFromNojaDownloadSection = function (dest_sections, dataRoot) {
		min_max_sec_no = new MinMaxRecorder();
		dataRoot.children('div').each(function () {
			var sec_no = parseInt(
				$(this).attr('id').substr('noja_download_section_'.length)
			);
			min_max_sec_no.update(sec_no);
			var sec = {};
			sec.chapter_title = getText('.noja_download_chapter_title', this);
			//
			sec.subtitle = getText('.noja_download_subtitle', this);
			//
			sec._maegaki = getHtml('.noja_download_maegaki', this);
			sec._atogaki = getHtml('.noja_download_atogaki', this);
			sec._honbun = getHtml('.noja_download_honbun', this);

			sec = splitContentsBody (sec, sec_no);
			//
			dest_sections[sec_no] = sec;
		});
		return min_sec_no;
	};

	// このあたりは通常のコンテンツ読み込み時の処理と共通化できる
	var getColorInfoFromDownloadFile = function (info, infoRoot) {
		info.color = infoRoot.css('color');
		info.bgColor = infoRoot.css('background-color');
		info.bgImage = infoRoot.css('background-image');
		if (info.bgImage === null || info.bgImage === 'none' || info.bgImage === '') {
			info.bgImage = null;
		} else {
			info.bgImage = info.bgImage
				.match(/url\(([^\)]*)\)/)[1];
			info.bgImage = $('<img>')
				.attr('src', info.bgImage)
				.bind('load', function() {showPage();})
				.get(0);
			info.bgColor = '#FFFFFF';
		}
	};

	var replaceFullSections = function (new_sections, dataRoot) {
		sections = new_sections;
		$('#noja').empty().append(dataRoot);
		gGeneralAllNo = imported_infos.generalAllNo;
		gCurrentSection.id = imported_infos.currentSection;
		gCurrentSection.page = 0;
	};


	var margeSections = function (new_section) {
		var prev = null;
		for (var sec_no = 1; sec_no < new_sections.length; ++sec_no) {
			var sec_id = 'noja_download_section_' + sec_no;
			if (sec_no in new_sections) {
				var sec = new_sections[sec_no];
				if (!(sec_no in sections)) {
					// 新規なのでdivを作る
					if (prev === null) {
						$('#noja_download_file_main')
							.prepend('<div id="' + sec_id + '">');
					} else {
						prev = prev.after('<div id="' + sec_id + '">');
					}
				}
				prev = $('#' + sec_id);
				prev.empty();
				if (sec._maegaki !== null) {
					prev.append('<div class="noja_download_maegaki">'
						+ sec._maegaki + '</div>');
				}
				if (sec.chapter_title !== '') {
					prev.append('<div class="noja_download_chapter_title">'
						+ sec.chapter_title + '</div>');
				}
				prev.append('<div class="noja_download_subtitle">'
					+ sec.subtitle + '</div>');
				prev.append('<div class="noja_download_honbun">'
					+ sec._honbun + '</div>');
				if (sec._atogaki !== null) {
					prev.append('<div class="noja_download_atogaki">'
						+ sec._atogaki + '</div>');
				}
				sections[sec_no] = sec;
			} else if (sec_no in sections) {
				// 既存でnew側にはない番号の場合はprev更新だけ
				prev = $('#' + sec_id);
			}
		}
	};

	var updateSettingMenuCheckbox = function (strring) {
		$('#noja_maegaki').prop('checked', setting.fMaegaki);
		$('#noja_atogaki').prop('checked', setting.fAtogaki);
		$('#noja_kaigyou').prop('checked', setting.kaigyou);
		$('#noja_autosave').prop('checked', setting.autoSave);
		$('#noja_autorestore').prop('checked', setting.autoRestore);
		$('#noja_olddata').prop('checked', setting.oldData);
	};

	/////// siteParserはnewしなおさないと意味がない
	var reCreateSiteParser = function (imported_infos) {
		gSiteParser.site    = imported_infos.site;
		gSiteParser.site2   = imported_infos.site2;
		gSiteParser.ncode   = imported_infos.ncode;
		gSiteParser.ncode2  = imported_infos.ncode2;
		gSiteParser.author  = imported_infos.author;
		gSiteParser.title   = imported_infos.title;
		gSiteParser.color   = imported_infos.color;
		gSiteParser.bgColor = imported_infos.bgColor;
		gSiteParser.bgImage = imported_infos.bgImage;
	};

	///////////////////////////////////////////////////////////////
	// import/save/load関連

	// 例外のときの処理はこれだったが不要か？
	// statusFrame.showMessage('(´・ω・｀)読み込みエラーが発生したよ。');
	// dfrd.reject();


	nojaImport = function (htmldoc) {
		var dfrd = new $.Deffered();
		if (isNetworkBusy ('読み込みするのは後にするのじゃー。')) {
			return;
		}
		var json = parseImportedHtmlNojaHeader(htmldoc);
		if (!json) {
			statusFrame.showMessage('(´・ω・｀)このhtmlはのじゃー用ファイルじゃないよ');
			dfrd.reject();
			return dfrd.promise();
		}

		var imported_sections = [];
		var imported_infos = {};
		var _kaigyou = gSetting.kaigyou;	// これは使ってない？
		// indexPageStatusだけは意味を変換しないといけない
		imported_infos.indexPageStatus = 
			(imported_infos.indexPageStatus)
			? INDEXPAGE_DISABLE : INDEXPAGE_NOTREADY;
		// comment部のheader以外のhtmlとして取り出すcontent

		var content = $($.parseHTML(htmldoc));
		var downloadFileMain = $('#noja_download_file_main', content);

		imported_infos.title = content.filter('title').text();
		getColorInfoFromDownloadFile(imported_infos, downloadFileMain);
		var min_max_sec_no = getSectionsFromNojaDownloadSection (
			imported_sections, downloadFileMain.children('div'));
		imported_infos.currentSection = min_max_sec_no.min;

		fncLoad ('ncode', imported_infos.ncode)
		.then(
			function (data) {
				// ncodeに対応する設定をloadした後の処理
				gSetting = data;
			},
			function() {
				// 設定がなかったらデフォルトで作って新規保存
				gSetting = {
					ncode: imported_infos.ncode,
					kaigyou: false,
					fMaegaki: true,
					fAtogaki:true
				};
				fncSave_ncode (gSetting);
				return $.Deffered().resolve().promise();
			}
		)
		.then(function() {
			// currentの設定を更新
			gSetting.autoSave    = (gSetting.autoSave === true);
			gSetting.autoRestore = (gSetting.autoRestore === true);
			gSetting.oldData     = (gSetting.oldData === true);
		}).then(function() {
			// imported_sectionsにデータ形式で全セクション構築
			getSectionsFromNojaDownloadSection(imported_sections);
			if (imported_infos.ncode !== gSiteParser.ncode) {
				// importしたものが別のコンテンツなら
				replaceFullSections (imported_sections, downloadFileMain);
			} else {
				// 同一ncodeなら部分的な更新
				margeSections (imported_section);

				$('#noja_download_file_main').css({
					color: imported_infos.color,
					backgroundColor: imported_infos.bgColor
				});
				if (imported_infos.bgImage) {
					$('#noja_download_file_main')
						.css('background-image'
							, 'url(' + imported_infos.bgImage + ')');
				}
				if (imported_infos.generalAllNo && gGeneralAllNo) {
					gGeneralAllNo = Math.max(gGeneralAllNo, imported_infos.generalAllNo);
				}
			}
			recCeateSiteParser (imported_infos);
			//
			setIndexPageStatus (imported_infos.indexPageStatus);
			$('title').text(gSiteParser.title);

			setupCurrentSectionInfo (gCurrentSection.id);
			if (gGeneralAllNo) {
				gSiteParser.updateMaxSection(gGeneralAllNo, true);
			} else {
				gGeneralAllNo = null;
				gSiteParser.updateMaxSection(sections.length, true);
			}
			gSiteParser.rebuild_forms ();
			updateSettingMenuCheckbox(gStrring);
			$('#noja').css({
				color: gSiteParser.color,
				backgroundColor: gSiteParser.bgColor,
				backgroundImage: gSiteParser.bgImage
					? 'url(' + gSiteParser.bgImage.src + ')':'none'
			});
			$('#noja_download_file_main').css({
				color: '',
				backgroundColor: '',
				backgroundImage:''
			});
			dfrd.resolve ();
		});
		return dfrd.promise();
	};
	/////////////////////

	var buildSaveDataContentsData = function (data, sections, startSecNo, endSecNo) {
		startSecNo = (startSecNo === undefined) ? 1 : startSecNo;
		endSecNo = (endSecNo === undefined) ? sections.length : endSecNo;

		if (isIndexPageReady()) {
			data.index = $('<div>')
				.append(gSiteParser.selectNojaIndexData().clone())
				.html();
		}
		// @@ 互換性のためtypoをそのまま残すか？
		data.tanpen = isIndexPageDisable();
		data.generalAllNo = Math.max (gGeneralAllNo, data.generalAllNo);
		data.title = gSiteParser.title;
		data.color = gSiteParser.color;
		data.bgColor = gSiteParser.bgColor;
		data.auther = gSiteParser.author;
		data.bgImage = gSiteParser.bgImage
			? $(gSiteParser.bgImage).attr('src') : null;
		//セクションデータ
		for(var i = startSecNo; i < endSecNo.length; ++i) {
			var sec = sections[i];
			if (sec === null || (gSetting.oldData && i in data.sections)) {
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
	};

	var buildSaveDataSiteInfo = function () {
		return {
			site:   gSiteParser.site,
			site2:  gSiteParser.site2,
			// これらsiteじゃなくてbook情報だが
			ncode:  gSiteParser.ncode,
			ncode2: gSiteParser.ncode2,
			generalAllNo: gGeneralAllNo,
			sections: [],
		};
	};


	var save_saveData = function () {
		var dfrd = new $.Deffered ();
		var data = buildSaveDataSiteInfo();
		fncLoad ('saveData', gSiteParser.ncode).then(
			function(readData) {
				data = readData();
			},
			function() {
				// 失敗時はデフォルトデータを使って成功状態で継続処理
				return new $.Deffered().resolve().promise();
			}
		).then(	// 直前のthenで同期化した後の新promiseなのでalways()でいいのかも
			function () {
				buildSaveDataContentsData(data, sections);
				fncSave('saveData', data);
				dfrd.resolve ();
			},
			function () {
				// failのときは考えない
				dfrd.reject ();
			}
		);
		return dfrd.promise ();
	};


	// デフォルト指定があった時は成功扱い
	var loadGlobalBookList = function (default_data) {
		var dfrd = new $.Deffered ();
		fncLoad ('global', 'bookList').then(
			function(data) {
				dfrd.resolve (data);
			},
			function () {
				if (default_data === undefined) {
					dfrd.reject ();
				} else {
					dfrd.resolve (default_data);
				}
			}
		);
		return dfrd.promise ();
	};

	// 省略でグローバルなカレント値
	// saveのI/Fがステータスを返さないので常に成功扱い
	var saveGlobalBookList = function (data, data_id, register_data) {
		if (register_id === undefined) {
			register_id = gSiteParser.ncode;
		}
		if (register_data === undefined) {
			// @@ 互換性のためautherのtypoをそのまま残すか？
			register_data = {
				title: gSiteParser.title,
				auther: gSiteParser.author,
				savetime: parseInt((new Date()) / 1000),
			};
		}
		var dfrd = new $.Deffered ();
		data[register_id] = register_data;
		fncSave_global ('bookList', data);
		dfrd.resolve ();
		return dfrd.promise ();
	};

	var deleteGlobalBookList = function (data_id) {
		var dfrd = new $.Deffered ();
		loadGlobalBookList().then(
			function (data) {
				delete data[data_id];
				fncSave_global ('bookList', data).then (
					function () {
						dfrd.resolve ();
					},
					function () {
						dfrd.reject ();
					}
				);
			},
			function () {
				// 削除の場合はデータがないときも削除成功扱い
				dfrd.resolve ();
			}
		);
		return dfrd.promise ();
	};

	// BookListのデータベースをRmWで更新
	var saveUpdatedBookList = function () {
		var dfrd = new $.Deffered ();
		loadGlobalBookList({}).then(
			function(data) {
				// 省略でグローバルなカレント値
				saveGlobalBookList (data);
				dfrd.resolve ();
			},
			function () {
				// デフォルト指定しているので失敗はない
				dfrd.reject ();
			}
		);
		return dfrd.promise ();
	};

	nojaSave = function (isShowMessage) {
		isShowMessage = (isShowMessage === undefined) ? true : isShowMessage;
		if (isShowMessage && isNetworkBusy ('せーぶするのは後にするのじゃー。')) {
			return;
		}
		$.when(save_saveData, saveUpdatedBookList).then(
			function() {
				if (isShowMessage) {
					statusFrame.showMessage('(｀・ω・´)保存したよ！');
				}
			}
		);
	};
	/////////////////////
	var restoreSections = function (sourceSections) {
		for (var i = 1; i < sourceSections.length; ++i) {
			var sec = sourceSections[i];
			if (!(i in sections) && sec !== null) {
				sections[i] = sec;
				if (sec === null) {
					continue;
				}
				sec._maegaki = ('_maegaki' in sec) ? sec._maegaki : null;
				sec._atogaki = ('_atogaki' in sec) ? sec._atogaki : null;
				//
				sec = splitContentsBody (sec, i);
				autoPagerize (sec, i);
			}
		}
	};

	var buildSettings = function (new_ncode) {
		var dfrd = new $.Deffered();
		if (new_ncode != gSiteParser.ncode) {
			var new_setting = gSetting;
			sections = [];
			fncLoad ('ncode', new_ncode).then(
				function(data) {
					new_setting = data;
				},
				function () {
					new_setting = {
						ncode:    new_ncode,
						fMaegaki: true,
						fAtogaki: true,
						kaigyou:  false,
					};
					return new $.Deffered().resolve().promise();
				}
			).always ( function () {
				new_setting.autoSave    = new_setting.autoSave === true;
				new_setting.autoRestore = new_setting.autoRestore === true;
				new_setting.oldData     = new_setting.oldData === true;
				dfrd.resolve (new_setting);
			});
		} else {
			dfrd.resolve (gSetting);
		}
		return dfrd.promise();
	};

	var applySetting = function (new_setting) {
		// @@ 互換性のためtypoをそのまま残すか？(auther)
		gSetting = new_setting;
		$('#noja_fMaegaki').prop('checked', gSetting.fMaegaki);
		$('#noja_fAtogaki').prop('checked', gSetting.fAtogaki);
		$('#noja_kaigyou').prop('checked', gSetting.kaigyou);
		$('#noja_autosave').prop('checked', gSetting.autoSave);
		$('#noja_autorestore').prop('checked', gSetting.autoRestore);
		$('#noja_olddata').prop('checked', gSetting.oldData);
	};


	var restoreBookData = function (new_ncode, data) {
		// download_file等のrestore
		if (gSiteParser.ncode != new_ncode) {
			$('#noja_download_file_main').empty();
		}
		restoreSections(data.sections);
		if (data.tanpen) {
			setIndexPageDisabled ();
		} else if (data.index
			&& (!isIndexPageReady() || gSiteParser.ncode != new_ncode)) {
			// 連載でindex pageがある場合
			setIndexPageReady();
			var indexDiv = indexFrame.$div ();
			indexDiv.html(data.index);
			// @@ この部分は統合する
			var no = 0;
			$('.index_box a', indexDiv).each(function() {
				var sec_no = ++no;
				$(this).bind('click', function() {
					jumpTo (sec_no, FIRST_PAGE_NO);
					indexFrame.hide ();
				});
			});
		}
		/////// siteParserはnewしなおさないと意味がない
		gSiteParser.ncode2 = data.ncode2;
		gSiteParser.site   = data.site;
		gSiteParser.site2  = data.site2;
		if (gSiteParser.ncode != new_ncode) {
			if (!data.index) {
				setIndexPageDisabled ();
				indexFrame.clearDivContents ();
			}
			gSiteParser.title = data.title;
			$('title').text(gSiteParser.title);
			gSiteParser.rebuild_forms ();
			if (data.generalAllNo) {
				gGeneralAllNo = data.generalAllNo;
				gSiteParser.updateMaxSection(gGeneralAllNo, true);
			} else {
				gGeneralAllNo = null;
				gSiteParser.updateMaxSection(sections.length, true);
			}
			gSiteParser.ncode = data.ncode;
			var first_avail_section;
			for(first_avail_section = 1;
				first_avail_section < sections.length
				&& sections[first_avail_section] === null;
				++first_avail_section) {
				// none
			}
			gSiteParser.color   = data.color;
			gSiteParser.bgColor = data.bgColor;
			gSiteParser.bgImage = data.bgImage;
			$('#noja').css({
				color: gSiteParser.color,
				backgroundColor: gSiteParser.bgColor
			});
			if (gSiteParser.bgImage && gSiteParser.bgImage !== 'none') {
				$('#noja').css('background-image', 'url(' + gSiteParser.bgImage + ')');
				gSiteParser.bgImage = $('<img>').attr('src', gSiteParser.bgImage)
					.bind('load', function() { showPage(); }).get(0);
			} else {
				$('#noja').css('background-image', 'none');
			}
			gSiteParser.author = data.auther;
		} else {
			// ncodeが変わらなかった場合
			gGeneralAllNo =  Math.max(gGeneralAllNo, data.generalAllNo);
			gSiteParser.updateMaxSection(gGeneralAllNo, true);
		}
	};

	nojaRestore = function (new_ncode, isShowMessage) {
		var dfrd = new $.Deffered();
		isShowMessage = (isShowMessage === undefined) ? true : isShowMessage;
		if (isShowMessage && isNetworkBusy ('ろーどするのは後にするのじゃー。')) {
			dfrd.reject(true);	// pendingによるreject
			return dfrd.promise ();
		}
		var new_setting = gSetting;
		buildSettings (new_ncode)
		.then(fncLoad ('saveData', new_ncode))
		.then(
			function(data) {
				applySetting (new_setting);
				restoreBookData (new_ncode, data);
				if (gSiteParser.ncode != new_ncode) {
					var sec_no = (first_avail_section === gCurrentSection.id)
						? CURRENT_SECTION_NO_WITH_RELOAD
						: first_avail_section
						;
					jumpTo (sec_no, FIRST_PAGE_NO);
				} else {
					// ncodeが変わらなかった場合
					showPage ();
				}
				if (isShowMessage) {
					statusFrame.showMessage('(｀・ω・´)読み込んだよ！');
				}
				dfrd.resolve ();	// 成功
			},
			function () {
				if (isShowMessage) {
					statusFrame.showMessage('(´・ω・｀)保存されたデータがないよ');
				}
				dfrd.reject(false);	// load失敗によるreject
			}
		);
		return dfrd.promise();
	};
	/////////////////////
	nojaDelete = function (del_ncode) {
		fncDeleteItem ('saveData', del_ncode);
		deleteGlobalBookList (del_ncode);
	};
	/////////////////////
	// @@ TODO @@ template化
	// site固有情報とgenericな情報をどう分けるか？
	createSaveData = function (min, max) {
		var buffer = '<?xml version="1.0" encoding="utf-8"?>\n'
			+ '<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml">\n'
			+ '<!--\n'
			+ DOWNLOAD_ID + '\n'
			+ '{\n'
			+ '"version":"' + NOJA_VERSION + '",\n'
			+ '"site":["' + gSiteParser.site + '","' + gSiteParser.site2 + '"],\n'
			+ '"ncode":["' + gSiteParser.ncode + '","' + gSiteParser.ncode2 + '"],\n'
			;
		if (gGeneralAllNo) {
			buffer += '"general_all_no":' + gGeneralAllNo + ',\n';
		}
		// @@ 互換性のためtypoをそのまま残すか？
		buffer += '"auther":' + gSiteParser.author + ',\n';
		buffer += '"tanpen":' + (isIndexPageDisable()) + '\n'
			+ '}\n'
			+ '-->\n'
			+ '<head>\n'
			+ '<title>'
			+ $('<div>').text(gSiteParser.title).html()
			+ '</title>\n'
			+ '<meta charset="utf-8" />\n'
			+ '</head>\n'
			+ '<body>\n'
			+ '<div>\n'
			+ '<div id="noja_download_file_main" style="color:'
			+ gSiteParser.color
			+ ';background-color:' + gSiteParser.bgColor + ';'
			;
		if (gSiteParser.bgImage) {
			buffer+='background-image:url('+gSiteParser.bgImage.src+');';
		}
		buffer+='">\n';

		for (var i = min; i <= max; ++i) {
			if (i in sections && sections[i] !== false && sections[i] !== null) {
				var section = sections[i];
				buffer += '<div id="noja_download_section_' + i + '">\n';
				if (section._maegaki) {
					buffer += '<div class="noja_download_maegaki">'
						+ section._maegaki.replace(/\r|\n/g, '') + '</div>\n';
				}
				if (section.chapter_title !== '') {
					buffer += '<div class="noja_download_chapter_title">'
						+ $('<div>').text(section.chapter_title).html() + '</div>\n';
				}
				buffer += '<div class="noja_download_subtitle">'
					+ $('<div>').text(section.subtitle).html() + '</div>\n';
				buffer += '<div class="noja_download_honbun">'
					+ section._honbun.replace(/\r|\n/g, '') + '</div>\n';
				if (section._atogaki) {
					buffer += '<div class="noja_download_atogaki">'
						+ section._atogaki.replace(/\r|\n/g, '') + '</div>\n';
				}
				buffer += '</div>\n';
			}
		}
		buffer += '</div>\n'
			+'</div>\n'
			+'</body>\n'
			+'</html>';
		return new Blob(
			[buffer.replace(/(<br|<img[^>]*)>/g, '$1 />')]
			, {type:'application/octet-stream'}
		);
	};







	// valueは[0.083... , 200.083..]が実測値
	var slidePos2ZoomRatio = function (value) {
		return Math.pow(2, (200 - value) / 100);
	};


	var buildAndShowBookList = function () {
		fncLoad ('global', 'bookList', function (data) {
			var list = '';
			if (!valid(data)) {
				list = '保存した小説はありません。';
			} else {
				// @@ TODO @@ 互換性のためtypoをそのまま残すか？
				var buf = [];
				for (var k in data) {
					var v = data[k];
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
			$('#noja_booklist_view').html(
				'<div class="noja_close_popup">'
				+ '<a id="noja_closebv">[閉じる]</a>'
				+ '</div>'
				+ '<div>' + list + '</div>'
			);
			$('#noja_booklist_view a.noja_book').bind('click', function(){
				nojaRestore($(this).attr('id').match(/noja_book_(.*)/)[1]);
				popupMenu.close(); 
			});
			$('#noja_booklist_view a.noja_book_delete').bind('click', function(){
				var del_ncode = $(this).attr('id')
					.match(/noja_book_delete_(.*)/)[1];
				nojaDelete(del_ncode);
				$('#noja_book_container_' + del_ncode).remove();
				console.log($('#noja_book_container_' + del_ncode));
			});
			$('#noja_closebv').bind('click', function() { $('#noja_booklist_view').hide(); });
			$('#noja_saveload').hide();
			$('#noja_booklist_view').show();
		});
	};

	var sleepTimer = function (duration) {
		var dfrd = new $.Deffered();
		setTimeout(function () {dfrd.resolve();}, duration);
		return dfrd.promise();
	};

	var waitForNetworkReady = function (duration, retry_count) {
		var retry = 0;
		var dfrd = new $.Deffered();
		(function loop () {
			if (isNetworkBusy()) {
				if (++retry <= retry_count) {
					setTimeout(loop, duration);
				} else {
					dfrd.reject();
				}
			} else {
				dfrd.resolve();
			}
		})();
		return dfrd.promise();
	};

	// エラーの時は？
	var readFile = function (fileData) {
		var dfrd = new $.Deffered();
		var reader = new FileReader();
		reader.onload = function(e) {
			dfrd.resolv (e.target.result);
		};
		reader.readAsText(fileData);
		return dfrd.promise();
	};

	// errorHandler->falseを返した場合は終了
	var importFiles = function(files, errorHandler) {
		if (!errorHandler) {
			errorHandler = function(error) { return true; };
		}
		var fifo = [];
		queue.push (files);
		var dfrd = new $.Deffered();
		(function loop () {
			if (dfrd.state == 'pending') {
				if (files.length === 0) {
					dfrd.resolve ();
				} else {
					var fileData = fifo.shift();
					if (fileData.type != 'text/html' && !errorHandler()) {
						dfrd.reject();
					} else {
						readFile(fileData)
						.then(nojaImport, function() {
							// read fail
							if (!errorHandler('read')) {
								dfrd.reject();
							} else {
								// resume then
								return new $.Deffered.resolve().promise();
							}
						}).then(null, function () {
							// import fail
							// format mismatchでエラーが出ることはあるが無視
							if (!errorHandler('import')) {
								dfrd.reject();
							} else {
								// resume then
								return new $.Deffered.resolve().promise();
							}
						}).then(loop);
					}
				}
			}
		})();
		return dfrd.promise();
	};

	var findMinSectionNo = function () {
		var sec_no;
		for (sec_no = 1;
			sec_no < sections.length && !(sec_no in sections);
			++sec_no) {
			// none
		}
		return sec_no;
	};

	// appのfile load関連のhandler
	var app_fileLoadHandler = function() {
		waitForNetworkReady(100, 50).then(function() {
			var files = $('#noja_file').prop('files');
			if (!files.length) {
				return;
			}
			var old_ncode = gSiteParser.ncode;
			statusFrame.showLoading ();
			importFiles(files, function(error) {
				statusFrame.showMessage('(´・ω・｀)ファイルタイプが違うよ');
				return true;	// エラーが出ても継続
			}).then(function () {
				statusFrame.showMessage ('(｀・ω・´)読み込み終了！');
				// book自体が変更されていないならshowでOk?
				if (gSiteParser.ncode === old_ncode) {
					showPage();
				} else {
					// 読み込んだ中で最も小さいsection_noを使う
					var sec_no = findMinSectionNo();
					// たまたま同一sectionにいたのなら強制リロード
					if (sec_no == gCurrentSection.id) {
						sec_no = CURRENT_SECTION_NO_WITH_RELOAD;
					}
					jumpTo (sec_no, FIRST_PAGE_NO);
				}
			});
		});
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
			// $.eachを使えばいいのか
			for (var i = 0; i < gSiteParserList.length; ++i) {
				var site_parser = gSiteParserList[i];
				//console.dir(site_parser);
				if (site_parser.isSupportedURL(url)) {
					gSiteParser = new site_parser(url);
					console.debug('select: [' + i + '] ' + site_parser.siteName);
					return true;
				}
			}
			console.debug('select: none');
			return false;
		};
		if (!selectSiteParser (document.URL)) {
			return;
		}

		////////////////////////////////////////////
		// initializeのstage1
		// グローバル設定の読み込み完了後にここにくる
		var initialize_stage1 = function() {
			fncSave_global ('fontType', gFontType);
			fncSave_global ('alwaysOpen', gAlwaysOpen);
			fncSave_global ('allpage', gAllpage);
			fncSave_global ('layout', gLayout);
			fncSave_global ('slidePos', gSlidePos);

			// ページ末尾にのじゃー作業用の領域を確保
			$('body').append(fncLsc (NOJA_VIEW_HTML));
			// 「のじゃー」ラベルを元ページに貼り付け
			// 位置が悪い？
			// $('#head_nav')
			//	.append('<li><a id="noja_open" class="menu">のじゃー縦書リーダー</a></li>');

			$('#novelnavi_right')
				.append('<a id="noja_open" style="cursor:pointer;font-size:'
					+ FONTSMALL
					+ '; display:block; margin-top:10px;">のじゃー縦書リーダー</a>');
			// のじゃー作業用領域のフォントサイズ指定？
			rootFrame.$().css('font-size', FONTSMALL);


			// これがないと計算ができないので位置を移動
			updateMainSize ();
			console.debug ("gMainSize", gMainSize);
			// 計算して出す変数の設定処理
			updateLC(slidePos2ZoomRatio (gSlidePos), true);
			console.debug ("gCharsPerLine, gLinesPerCanvas", gCharsPerLine, gLinesPerCanvas);

			// 基本情報を設定して次ステージへ
			if (noja_option.appmode) {
				// アプリモードだと元ページは解析済なので直接stage3へ
				noja_option.getToken(function(data) {
					gSiteParser.token = data;
					gSiteParser.login = (gSiteParser.token !== '');
					initialize_stage3 ();
				});
			} else {
				// ncodeをキーとして個別設定を取り出しstage2へ
				fncLoad ('ncode', gSiteParser.ncode, initialize_stage2);
			}
		};

		////////////////////////////////////////////
		// initializeのstage2
		// 非アプリモード
		// ncodeをキーとして読み込んだ設定オブジェクトがresult引数
		// 各小説毎の固有設定を読み込んだ後
		// 貼り付け元ページの解析
		var initialize_stage2 = function (result) {
			console.debug ('initialize stage2');
			gSetting = result;
			if (!valid (gSetting)) {
				gSetting = {
					ncode:    gSiteParser.ncode,
					kaigyou:  false,	// 改行詰め
					fMaegaki: true,	// 前書き表示
					fAtogaki: true	// 後書き表示
				};
				fncSave_ncode (gSetting);
			}
			///////////////////////////////////////
			// 元ページ解析
			if (!gSiteParser.parseInitialPage ()) {
				// 解析失敗した場合はindex page等のじゃーが表示できない画面
				console.debug ('not supported page');
				return;
			}
			////////// menu側のcheckに状態を反映させる
			$('#noja_maegaki').prop('checked', gSetting.fMaegaki);
			$('#noja_atogaki').prop('checked', gSetting.fAtogaki);
			$('#noja_kaigyou').prop('checked', gSetting.kaigyou);
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', gCurrentSection.id);
			initialize_stage3();
		};


		///////////////////////////////////////////////
		// 多分抜き出しても大丈夫だと思うが変数束縛はチェックしていない
		var rebuild_appmode_menu = function () {
			$('#noja_link')
				.empty()
				.append(
					$('<div style="text-align:right; border-bottom-width:1px; border-bottom-style:solid;">'
					+ '<a id="noja_closelink">[閉じる]</a>'
					+ '</div>'
					).bind('click', function() { $('#noja_link').hide(); })
				);
			$('#noja_import_container')
				.html('<h4>読み込み</h4>'
				+ '<div id="noja_file_back">'
				+ '<input id="noja_file" type="file" value="" accept="text/html, application/zip" multiple="true" >'
				+ '</div>'
				+ '<br /><br /><a id="noja_yomikomi">保存・読み込み機能について</a>'
				);
			$('#noja_saveload_container')
				.append('<br /><a id="noja_booklist">保存した小説リスト</a>');
			$('#noja_version')
				.append('<br /><br /><a id="noja_kokuhaku">関係のない話</a>');
			$('#noja_booklist').bind('click', function() {
				buildAndShowBookList();
			});
			$('#noja_file').bind('change', app_fileLoadHandler());
			//
			var app_builtin_content_load_handler = function (res) {
				nojaImport(fncLsc (res)).then(
					function() {
						jumpTo ((gCurrentSection.id == FIRST_SECTION_NO)
							? CURRENT_SECTION_NO_WITH_RELOAD
							: FIRST_SECTION_NO
							, FIRST_PAGE_NO);
					}
					// format mismatchでエラーが出ることはあるが無視
				);
			};
			$('#noja_yomikomi').bind('click', function(){
				app_builtin_content_load_handler (noja_option.app_yomikomi_setumei);
			});
			$('#noja_kokuhaku').bind('click', function(){
				app_builtin_content_load_handler (noja_option.app_kokuhaku);
			});
		};
		///////////////////////////////////////////////
		// アプリモードと共通のstage3
		// 設定したりないメニュー関連等を設定する
		var initialize_stage3 = function() {
			console.debug ('initialize stage3');
			gSetting.autoSave    = gSetting.autoSave === true;
			gSetting.autoRestore = gSetting.autoRestore === true;
			gSetting.oldData     = gSetting.oldData === true;
			gNextSection         = gCurrentSection.id;
			gSiteParser.updateMaxSection (gCurrentSection.id, true);
			$('#noja_autosave').prop('checked', gSetting.autoSave);
			$('#noja_autorestore').prop('checked', gSetting.autoRestore);
			$('#noja_olddata').prop('checked', gSetting.oldData);
			$('#noja_always_open').prop('checked', gAlwaysOpen);
			$('#noja_layout').prop('checked', gLayout);
			$('#noja_mincho').prop('checked', gFontType === FONTTYPE_MINCHO);
			$('#noja_yokogaki').prop('checked', gYokogaki);
			$('#noja_gothic').prop('checked', gFontType === FONTTYPE_GOTHIC);
			$('#noja_allpage').prop('checked', gAllpage);

			$('#noja_drag').css('left', gSlidePos - 5);

			////////// 「関連」 menu /////////
			gSiteParser.setupLinkMenu ($('noja_link'));
			console.debug('setupLinkMenu done');

			////////// version menu /////////
			$('#noja_version h4').text('のじゃー縦書リーダー ver.' + NOJA_VERSION);
			////////// open closeのメニュー //////
			$('#noja_open').bind('click', nojaOpen);
			$('#noja_close').bind('click', nojaClose);

			///////// コンテンツメイン画面のイベントハンドラ ////////////
			$('#noja_main').bind('mousemove', function(e) {
				if (e.clientY < 10) {
					// menu popup
					menuFrame.show();
				} else if (!isIndexPageDisable() && e.clientX < 10) {
					// 目次slide slider
					if (isIndexPageNotReady()) {
						loadIndex();
					}
					indexFrame.show ();
				} else if ($(this).width() - e.clientX < 10) {
					// page jump index slider
					navigationFrame.show();
				} else {
					// その他ならall hide
					menuFrame.hide();
					navigationFrame.hide();
					indexFrame.hide ();

				}
			})
			.bind('click', function(e) {
				// popupがopenしていたら最初のはclose操作
				if (popupMenu.isOpen ()) {
					popupMenu.close();
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
				if (popupMenu.isOpen ()) {
					// popup openのとき:評価dialogだけ特殊
					// closeしない条件は
					// 評価popup中
					// forward移動
					// 最終話の最終ページ
					if ($('#noja_hyouka').css('display') != 'none'
						&& isForward
						&& gCurrentSection.id === gGeneralAllNo
						&& isLastPageInSection(gCurrentSection.page)
						) {
						return;
					}
					popupMenu.close();
					return;
				}
				load_next_direction (isForward, false);
			};
			// firefox以外？(chrome)
			$('#noja_main').get(0).addEventListener('mousewheel', function(e) {
				mouseWheelHandler(e.wheelDelta / 40);
			});
			// firefox用
			$('#noja_main').get(0).addEventListener('DOMMouseScroll', function(e) {
				mouseWheelHandler(-e.detail);	// 移動量がFirefox以外とは逆
			});
			var joutai = null;
			$(window).bind('resize', onResize).bind('keydown', function(e) {
				var VK_R = 82;
				var VK_S = 83;
				if (gIsNojaOpen && e.ctrlKey && e.which===VK_S) {
					nojaSave();
					e.preventDefault();
					return;
				}
				if (gIsNojaOpen && e.ctrlKey && e.which===VK_R) {
					nojaRestore(gSiteParser.ncode);
					e.preventDefault();
					return;
				}
				var VK_ESC = 27;
				if (popupMenu.isOpen ()) {
					if(e.which === VK_ESC) {
						popupMenu.close();
						e.preventDefault();
					}
					return;
				}
				if (!gIsNojaOpen) {
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
					jumpTo (gCurrentSection.id - 1, FIRST_PAGE_NO);
					break;
				case VK_DOWN:
					//console.debug('gCurrentSection.id', gCurrentSection.id);
					jumpTo (gCurrentSection.id + 1, FIRST_PAGE_NO);
					break;
				case VK_PAGEUP:
				case VK_HOME:
					// 現在のsectionの先頭
					jumpTo (gCurrentSection.id, FIRST_PAGE_NO);
					break;
				case VK_PAGEDOWN:
				case VK_END:
					// 現在のsectionの最終
					jumpTo (gCurrentSection.id, LAST_PAGE_NO);
					break;
				case VK_ESC:
					nojaClose();
					break;
				case VK_SPACE:
					// 前書き後書き表示をtoggle disable,enable,restore
					if (gSetting.fMaegaki && gSetting.fAtogaki) {
						$('#noja_maegaki').prop('checked', gSetting.fMaegaki = false);
						$('#noja_atogaki').prop('checked', gSetting.fAtogaki = false);
					} else if (joutai) {
						$('#noja_maegaki').prop('checked', gSetting.fMaegaki = joutai.m);
						$('#noja_atogaki').prop('checked', gSetting.fAtogaki = joutai.a);
						joutai = null;
					} else {
						if (gSetting.fMaegaki !== gSetting.fAtogaki) {
							joutai = {
								m: gSetting.fMaegaki,
								a: gSetting.fAtogaki
							};
							$('#noja_maegaki').prop('checked', gSetting.fMaegaki = true);
							$('#noja_atogaki').prop('checked', gSetting.fAtogaki = true);
						}
					}
					// 前書き後書き表示を変更したのでreload
					jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
					fncSave_ncode (gSetting);
					statusFrame.showMessage('前書き表示：'
						+ (gSetting.fMaegaki ? 'ON' : 'OFF')
						+'　後書き表示：'+(gSetting.fAtogaki ? 'ON' : 'OFF'));
					break;
				default:
					return;
				}
				e.preventDefault();
			});
			////// menu関連のcheckbox等
			$('#noja_maegaki').bind('click', function() {
				joutai = null;
				gSetting.fMaegaki = $(this).prop('checked');
				fncSave_ncode (gSetting);
				if (gCurrentSection.maegaki !== null) {
					if (gSetting.fMaegaki) {
						// disable->enableなのでページ数が前書き分増える
						jumpTo (CURRENT_SECTION_NO_WITH_RELOAD
							, gCurrentSection.page + gCurrentSection.maegaki[0].length);
					} else {
						// enable->disableなのでページ数が前書き分減る
						// 前書き内にいた場合は0で先頭へ
						jumpTo (CURRENT_SECTION_NO_WITH_RELOAD
							, Math.max(FIRST_PAGE_NO
							, gCurrentSection.page - gCurrentSection.maegaki[0].length));
					}
				}
			});
			$('#noja_atogaki').bind('click', function() {
				joutai = null;
				gSetting.fAtogaki = $(this).prop('checked');
				fncSave_ncode (gSetting);
				if (gCurrentSection.atogaki !== null) {
					var pgno = gCurrentSection.page;
					if (!gSetting.fAtogaki) {
						var len = gCurrentSection.honbun[0].length;
						if (gSetting.fMaegaki && gCurrentSection.maegaki !== null) {
							len += gCurrentSection.maegaki[0].length;
						}
						if (pgno >= len) {
							pgno = len - 1;
						}
					}
					jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, pgno);
				}
			});
			$('#noja_layout').bind('click', function() {
				gLayout = $(this).prop('checked');
				fncSave_global ('layout', gLayout);
				reMake();	// nullcheckが入ってないがほぼ同じなので統合
				// レイアウト変更の場合はページ位置は移動しなくてOk?
				jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, gCurrentSection.page);
			});

			var fontChangeHandler = function (font_type) {
				setFontType (font_type, true);
				gMainContext.font = get_canvas_font (gCharFontSize);
				showPage();
			};
			$('#noja_mincho').bind('click', function() {
				fontChangeHandler(FONTTYPE_MINCHO);
			});
			$('#noja_gothic').bind('click', function() {
				fontChangeHandler(FONTTYPE_GOTHIC);
			});
			$('#noja_kaigyou').bind('click', function() {
				gSetting.kaigyou = $(this).prop('checked');
				fncSave_ncode (gSetting);
				reMake();
				jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
			});
			$('#noja_always_open').bind('click', function() {
				gAlwaysOpen = $(this).prop('checked');
				fncSave_global ('alwaysOpen', gAlwaysOpen);
			});
			$('#noja_autosave').bind('click', function() {
				gSetting.autoSave = $(this).prop('checked');
				fncSave_ncode (gSetting);
			});
			$('#noja_autorestore').bind('click', function() {
				gSetting.autoRestore = $(this).prop('checked');
				fncSave_ncode (gSetting);
			});
			$('#noja_olddata').bind('click', function() {
				gSetting.oldData = $(this).prop('checked');
				fncSave_ncode (gSetting);
			});
			$('#noja_allpage').bind('click', function() {
				gAllpage = $(this).prop('checked');
				showPage();
				fncSave_global ('allpage', gAllpage);
			});
			$('#noja_yokogaki').bind('click', function() {
				gYokogaki = $(this).prop('checked');
				updateLC(slidePos2ZoomRatio (gSlidePos), true);
				// @@ 入れ替えてみるべきかも？ @@
				reMake();
				onResize();
				jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
				fncSave_global ('yokogaki', gYokogaki);
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
					gSlidePos = $('#noja_drag').offset().left
						+ 4 - $('#noja_dragback').offset().left;
					updateLC(slidePos2ZoomRatio (gSlidePos), true);
					fncSave_global ('slidePos', gSlidePos);
					// cacheをpurgeして再構築
					// ほぼreMake()だが判定がちょい単純化されているのが謎
					// (null checkがない)
					// startが1なのも違う
					reMake(1);	// 開始が1になっているのが謎な部分
					onResize();
					jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
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
					$('#noja_drag').css('left', value - 5);
					var lc = updateLC(slidePos2ZoomRatio (value), false);
					remake_noja_charsize (calcRealCharFontSize (lc.nchars)
						, lc.nchars, lc.nlines);
				}
			});
			////////////////
			// 更新link
			indexFrame.$updateAnchor().bind('click', loadIndex);
			//
			var adjusting_menu_open_handler = function (menu, menu_open) {
				popupMenu.toggle (menu);
				var left = $(menu_open).offset().left;
				var width = $(menu).width();
				var max = $('#noja_main').width();
				if (left + width + 22 > max) {
					left = max - width - 22;
				}
				$(menu).css({
					left: left,
					top: menuFrame.height()
				});
			};

			$('#noja_openconfig').bind('click', function() {
				adjusting_menu_open_handler ('#noja_config', '#noja_openconfig');
			});
			$('#noja_openconfig2').bind('click', function() {
				adjusting_menu_open_handler ('#noja_config2', '#noja_openconfig2');
			});
			$('#noja_closeconfig').bind('click', function() {
				$('#noja_config').hide();
			});
			$('#noja_closeconfig2').bind('click', function() {
				$('#noja_config2').hide();
			});
			$('#noja_opensaveload').bind('click', function() {
				popupMenu.toggle ('#noja_saveload');
			});
			$('#noja_closesaveload').bind('click', function() {
				$('#noja_saveload').hide();
			});
			$('#noja_openlink').bind('click', function() {
				adjusting_menu_open_handler ('#noja_link', '#noja_openlink');
			});
			$('#noja_closelink').bind('click', function() {
				$('#noja_link').hide();
			});
			$('#noja_openhelp').bind('click', function() {
				popupMenu.toggle ('#noja_help');
			});
			$('#noja_closehelp').bind('click', function() {
				$('#noja_help').hide();
			});
			$('#noja_openversion').bind('click', function() {
				popupMenu.toggle ('#noja_version');
			});
			$('#noja_closeversion').bind('click', function() {
				$('#noja_version').hide();
			});
			$('#noja_openhyouka').bind('click', function() {
				popupMenu.toggle ('#noja_hyouka');
			});
			$('#noja_closehyouka').bind('click', function() {
				$('#noja_hyouka').hide();
			});
			$('#noja_closedv').bind('click', function() {
				$('#noja_download_view').hide();
			});
			$('#noja_save').bind('click', function() {
				nojaSave();
			});
			$('#noja_restore').bind('click', function() {
				nojaRestore(gSiteParser.ncode);
			});
			$('#noja_download').bind('click', function() {
				var evt = document.createEvent('MouseEvents');
				evt.initMouseEvent('click', true, true, window
					, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				$('<a>')
					.attr({
						href: URL.createObjectURL(createSaveData(1, sections.length - 1)),
						download: gSiteParser.title + '.noja.html'
					})
					.get(0)
					.dispatchEvent(evt);
			});
			$('#noja_download2').bind('click', function() {
				var evt = document.createEvent('MouseEvents');
				evt.initMouseEvent('click', true, true, window
					, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				var datetime_now = (function () {
					var w2 = function (i) {
						return (i < 10) ? '0' + i : '' + i;
					};
					var dt = new Date ();
					var Y = dt.getFullYear ();
					var M = w2 (dt.getMonth () + 1);
					var D = w2 (dt.getDate ());
					var h = w2 (dt.getHours ());
					var m = w2 (dt.getMinutes ());
					var s = w2 (dt.getSeconds ());
					return '' + Y + '-' + M + '-' + D + ' ' + h + '-' + m + '-' + s;
				})();
				$('<a>')
					.attr({
						href: URL.createObjectURL(createSaveData(1, sections.length-1)),
						download: gSiteParser.title+'(' + datetime_now + ').noja.html',
					})
					.get(0)
					.dispatchEvent(evt);
			});
			$('#noja_download3').bind('click', function() {
				$('#noja_dv_main').empty();
				for (var i = 1; i < sections.length; ++i) {
					if (i in sections) {
						$('#noja_dv_main')
							.append(
								$('<a>').attr({
									href: URL.createObjectURL(createSaveData(i, i)),
									download: gSiteParser.title+' - '+i+' - '+sections[i].subtitle
										+'.noja.html'
								}).html(''+i+'. '+sections[i].subtitle)
							).append('<br>');
					}
				}
				popupMenu.close();
				$('#noja_download_view').show();
			});
			//////////////////////////////////
			// 評価form部分をhtmlリソースからロード
			$('#noja_hyouka td:eq(0)').html(fncLsc (HYOUKA_HTML));
			$('#noja_hyouka td:eq(1)').empty()
				.append(fncLsc (HYOUKANAVI_HTML))
				.append(fncLsc (KANSOU_HTML));
			$('#noja_hyouka .hyoukanavi a:eq(0)')
				.bind('click', function(){
					$('#noja_f_cr').show();
					$('#noja_r_fc').hide();
				});
			$('#noja_hyouka .hyoukanavi a:eq(1)')
				.bind('click', function(){
					$('#noja_f_cr').hide();
					$('#noja_r_fc').show();
				});
			//////////////////////////////////////////////
			//////////////////////////////////////////////
			// appmodeならlink部分は作り直し
			//////////////////////////////////////////////
			if (noja_option.appmode) {
				rebuild_appmode_menu ();
			}
			//////////////////
			// 次stageへのchain: appmodeだとコンテンツ読み込み経由の非同期
			var dfrd = null;
			if (noja_option.appmode) {
				dfrd = nojaImport (fncLsc (noja_option.app_setumei));
			}
			$.when(dfrd).then(
				initialize_stage4
				// format mismatchでエラーが出ることはあるが無視
			);
		};

		///////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////
		var initialize_stage4 = function() {
			console.debug('stage4: updateNavigation');
			updateNavigation();
			console.debug('stage4: build reputation form');
			gSiteParser.buildReputationForm ();
			///////////////////////////////////////////////////
			// 設定が終わったのでresizeでジオメトリを更新
			console.debug('stage4: onResize');
			onResize();
			// ある条件のときのみ非同期になるなら
			// $.Deffered().resolve().promise()を入れるよりも
			// $.when()にdeffered,promiseでないものを与えた時の
			// 即時resolveとして扱う仕様を使うほうがいいか？
			var dfrd = null;	// as resolved immediately
			if (gSetting.autoRestore) {
				dfrd = nojaRestore(gSiteParser.ncode, false);
			}
			$.when(dfrd).then(
				function() {
					if (gSetting.autoSave) {
						nojaSave(false);
					}
					if (gAlwaysOpen) {
						rootFrame.$().ready(nojaOpen());
					}
					initialize_stage5();
				}
			);
		};
		///////////////
		// 暁のindex等勝手に動いて欲しいasyncなものを起動させる
		var initialize_stage5 = function() {
			gSiteParser.startAsyncProcess();
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
					case 'noja_alwaysOpen': buf1.alwaysOpen = (v === 'true'); break;
					case 'noja_allpage':    buf1.allpage    = (v === 'true'); break;
					case 'noja_layout':     buf1.layout     = (v === 'true'); break;
					case 'noja_fontType':   buf1.fontType   = v; break;
					case 'noja_slidePos':   buf1.slidePos   = parseInt(v); break;
					default:
						k.match(/(noja)_([^_]*)_(fMaegaki|fAtogaki|kaigyou)/);
						if (RegExp.$1 === 'noja') {
							if (RegExp.$2 === 'undefined' || RegExp.$2 === 'novelview') {
								break;
							}
							if (!(RegExp.$2 in buf2)) {
								buf2[RegExp.$2] = {
									ncode: RegExp.$2
								};
							}
							buf2[RegExp.$2][RegExp.$3] = (v === true);
						} else {
							continue;
						}
					}
					buf3.push(k);
				}
				for (var i in buf1) {
					fncSave_global(i, buf1[i]);
				}
				for (var i in buf2) {
					fncSave_ncode (buf2[i]);
				}
				for (var i = 0; i < buf3.length; ++i) {
					ls.removeItem(buf3[i]);
				}
			}
		})(noja_option.localStorage);

		// deffered化済
		$.when(
			fncLoad ('global', 'fontType')
			, fncLoad ('global', 'alwaysOpen')
			, fncLoad ('global', 'allpage')
			, fncLoad ('global', 'yokogaki')
			, fncLoad ('global', 'layout')
			, fncLoad ('global', 'slidePos')
		).then (
			function (fontType, alwaysOpen, allpage, yokogaki, layout,slidePos) {
				setFontType (fontType);
				gAlwaysOpen = (noja_option.appmode)
					? (alwaysOpen !== false) : (alwaysOpen === true);
				gAllpage = (allpage === true);
				gYokogaki = (yokogaki === true);
				gLayout = (layout === true);
				gSlidePos = (!valid(slidePos)) ? 100 : slidePos;
			},
			function () {
				// 読めなかった時は？
			}
		).then(
			// thenを分ける意味はないものの論理構造としては
			// 分けておくべきか。
			//
			// (function object登録なのでここでは名前だけ書けばよい)
			initialize_stage1
		);

	};

	//最後に初期化して終了。
	initialize();
});
