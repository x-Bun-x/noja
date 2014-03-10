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

	// fncLoadは非同期callbackだったがDeferredに変更
	var fncLoad = noja_option.load;
	var fncDeleteItem = noja_option.deleteItem;

	//定数

	var reAllLineBreak = /\r|\n/g;

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

	// 3099-309Cまでの記号
	// 3099は濁点の右上位置にあるもの(合成用？)
	// 309Aは半濁点の右上位置にあるもの(合成用？)
	// 309Bは単体の濁点(左上位置)
	// 309Cは単体の半濁点(左上位置)
	// COMBINING KATAKANA-HIRAGANA VOICED SOUND MARK (U+3099)
	// COMBINING KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK (U+309A)
	// KATAKANA-HIRAGANA VOICED SOUND MARK (U+309B)
	// KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK (U+309C)
	var VOICED_SOUND_MARK = '゛゜\u3099\u309A';

	// 大き目にする特殊記号
	var TOWIDEWIDTHSYMBOLS = '☹☺☻☼♠♡♢♣♤♥♦♧♫♬♮';


	//標準的な明朝体フォントの列挙
	var FONTFAMILY_MINCHO = '"ＭＳ 明朝","MS Mincho","ヒラギノ明朝 ProN W3","Hiragino Mincho ProN","ヒラギノ明朝 Pro W3","Hiragino Mincho Pro","Takao明朝","TakaoMincho","IPA モナー 明朝","IPA mona Mincho","さざなみ明朝","Sazanami Mincho","IPA明朝","IPAMincho","東風明朝","kochi Mincho"';
	var FONTTYPE_MINCHO = 'mincho';
	//標準的なゴシック体フォントの列挙
	var FONTFAMILY_GOTHIC = '"ＭＳ ゴシック","MS Gothic","ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","ヒラギノ角ゴ Pro W3","Hiragino Kaku Gothic Pro","Takaoゴシック","TakaoGothic","IPA モナー ゴシック","IPA mona ゴシック","VL ゴシック","VL Gothic","IPAゴシック","IPAGothic","Osaka－等幅","Osaka-Mono","東風ゴシック","Kochi Gothic"';
	var FONTTYPE_GOTHIC = 'gothic';

	//ダウンロードファイルにコメントで仕込むデータ。
	var DOWNLOAD_ID = '@noja{7B87A1A7-2920-4281-A6D9-08556503D3E5}';


	var validateBool = function (value, default_value) {
		if (value !== true && value !== false) {
			value = default_value;
		}
		return value;
	};


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
	// 判型可変化への対応
	var gEnableFlexibleAspect = true;

	//プロパティ
	//
	//なろうapiで取って来るgeneral_all_no。つまり全話数。
	//まあ目次読み込んだらいいって話もあるんだけど。
	// これは
	//  null(未確定)→false(load中)→数値(確定値)
	// の状態遷移をする
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

	//画像onLoad時にページナビゲーションを再描写するかどうか決めるために使う
	var gParseSectionId;
	//メイン画面のコンテキスト。
	var gMainContext;

	//読み込み中フラグ
	var gNetworkManager = {
		isLoading: 0,
		isBusy: function () {
			return this.isLoading !== 0;
		},
		get: function () {
			if (this.isLoading === 0) {
				++this.isLoading;
				return true;
			}
			return false;
		},
		release: function () {
			if (this.isLoading !== 0) {
				--this.isLoading;
				return true;
			}
			return false;
		},
	};
	// objectとして隠蔽する
	// loadIndexもこれの配下に置く
	var gIndexManager = {
		INDEXPAGE_READY: true,
		INDEXPAGE_NOTREADY: false,
		INDEXPAGE_DISABLE: null,
		INDEXPAGE_NOWLOADING: 0,
		//目次が読み込まれているかどうかのフラグ。
		//ture:読み込まれている、false:読み込み失敗、null:読み込むな（短編）
		isIndexPageAvailable: null,
		previousStatus: null,
		//
		reset: function () {
			this.isIndexPageAvailable = this.INDEXPAGE_DISABLE;
		},
		setIndexPageStatus: function (status) {
			this.isIndexPageAvailable = status;
		},
		getIndexPageStatus: function () {
			return this.isIndexPageAvailable;
		},
		//
		setIndexPageReady: function () {
			this.isIndexPageAvailable = this.INDEXPAGE_READY;
		},
		setIndexPageNotReady: function () {
			this.isIndexPageAvailable = this.INDEXPAGE_NOTREADY;
		},
		setIndexPageDisabled: function () {
			this.isIndexPageAvailable = this.INDEXPAGE_DISABLE;
		},
		setLoadingStart: function () {
			this.previousStatus = this.isIndexPageAvailable;
			this.isIndexPageAvailable = this.INDEXPAGE_NOWLOADING;
		},
		setLoadingSuccess: function () {
			this.isIndexPageAvailable = this.INDEXPAGE_NOTREADY;
		},
		setLoadingFailed: function () {
			this.isIndexPageAvailable = this.previousStatus;
		},
		isIndexPageNowLoading: function () {
			return this.isIndexPageAvailable === this.INDEXPAGE_NOWLOADING;
		},
		isIndexPageReady: function () {
			return this.isIndexPageAvailable === this.INDEXPAGE_READY;
		},
		isIndexPageNotReady: function () {
			return this.isIndexPageAvailable === this.INDEXPAGE_NOTREADY;
		},
		isIndexPageDisable: function () {
			return this.isIndexPageAvailable === this.INDEXPAGE_DISABLE;
		},
		// コンテキストスイッチが関数call単位で発生するなら色々まずいが、
		// 非同期関数以外では明示的なコンテキストスイッチは発生しないはず。
		// check & go-message & callの間で他のreqが入ることはなかろう。
		ERROR_ALREADY_LOADING: -1,
		ERROR_LOAD_FAILURE: -2,
		load: function() {
			if (this.isIndexPageNowLoading()) {
				// 自前のerror statusを返す
				return $.Deferred()
					.reject(this.ERROR_ALREADY_LOADING).promise();
			}
			gIndexManager.setLoadingStart();
			return gSiteParser.loadIndex().then(
				function (maxSectionNo) {
					gIndexManager.setLoadingSuccess();
				},
				function () {
					gIndexManager.setLoadingFailed();
					// 自前のerror statusを返す
					return $.Deferred()
						.reject (this.ERROR_LOAD_FAILURE).promise();
				}
			);
		},
	};
	//////////////////////////////////////////////////////////////////////
	//データ

	//////////////////////////////
	//現在読んでいる話(第一話が1)
	var gCurrentManager = {
		id: -1,		// constなデータというよりはview側の事情
		//現在表示しているページ(ページ番号はこれ+1)
		page: -1,		// constなデータというよりはview側の事情
		//現在のセクションの合計表示ページ数。
		totalPages: -1,
		sectionData: null,
		//追加:1画面あたりのページ数(単ページ対応への布石)
		pagesPerCanvas: 2,
		//
		reset: function () {
			this.id = -1;
			this.page = -1;
			this.totalPages = -1;
			this.sectionData = null;
			this.pagesPerCanvas = 2;
		},
		// このあたりの外部連動する部分は
		// デフォルトでbindされたobserverへのnotifyだと見做しておく
		// 一々監視者側の初期化でregistしにくるのも面倒だし
		// そこまで汎用的なモジュール化をしたいわけでもなし
		setSingleSection: function (singleSection) {
			if (singleSection) {
				// 短編
				gIndexManager.setIndexPageDisabled ();
				gGeneralAllNo = 1;
				this.setCurrent (1);
			} else {
				// 連載
				gIndexManager.setIndexPageNotReady();
			}
		},
		getPageMap: function (setting) {
			return new PageMap (this.sectionData, setting);
		},

		// 値コピーじゃなくてrefを設定するだけでいいのかも？
		setCurrent: function (secId) {
			//console.debug('setCurrent', secId, gSectionManager.getData(secId));
			this.id = secId;
			this.page = 0;		// pageも初期化がいる？
			// このあたりはsection構造そのままcopyでいいはず
			this.sectionData = gSectionManager.getData (secId);
		},
		// アライメント補正はなし
		// 数える対象はグローバル変数に入ったもの
		countPages: function (setting) {
			return gSectionManager.countPages (this.sectionData, setting);
		},
		// setting切り替えに伴って変化するのだが…
		updateTotalPages: function (setting) {
			this.totalPages = this.countPages (this.sectionData, setting);
		},
		hasMaegaki: function () {
			return (this.sectionData.maegaki !== null);
		},
		hasAtogaki: function () {
			return (this.sectionData.atogaki !== null);
		},
		getTitle: function () {
			return {
				subtitle: this.sectionData.subtitle,
				chapter_title: this.sectionData.chapter_title,
			};
		},
		isLastPage: function () {
			return (this.page >= (this.totalPages + 
				(this.totalPages % this.pagesPerCanvas) - this.pagesPerCanvas));
		},
		// @@ 単ページ対応済 @@
		getNextPage: function () {
			var newPageNo = this.page + this.pagesPerCanvas;
			// total pageを超えたらnullを返す
			if (newPageNo >= this.totalPages) {
				return null;
			}
			return newPageNo;
		},
		getPrevPage: function () {
			var newPageNo = this.page - this.pagesPerCanvas;
			// 0を下回ったらnullを返す
			if (newPageNo < 0) {
				return null;
			}
			return newPageNo;
		},
		// 単ページ対応:切り上げ
		getPagesAlinedCanvas: function (npages) {
			var rem = npages % this.pagesPerCanvas;
			if (rem !== 0) {
				npages += (this.pagesPerCanvas - rem);
			}
			return npages;
		},
		// 偶数ページ化(右ページ):切り捨て
		getFirstPageAlinedCanvas: function (pageNo) {
			return pageNo - (pageNo % this.pagesPerCanvas);
		},

	};
	//////////////////////////////
	//話データ
	// 5要素が保存される
	// 文章部分はraw側が保存される
	function SectionData () {
		// 章タイトル
		this.chapter_title = null;
		// サブタイトル
		this.subtitle = null;
		// raw: html data
		this._honbun  = null;
		this._maegaki = null;
		this._atogaki = null;
		// parsed: 本文と前書きと後書きをパースしたデータ
		this.honbun  = null;	// [0] body [1] ruby
		this.maegaki = null;	// [0] body [1] ruby
		this.atogaki = null;	// [0] body [1] ruby
	}

	// 各パーツのページ数は.size (.lengthはちょいリスキーかな？)
	function PageMap (secData, setting) {
		this.FRONT_MATTER = 0;
		this.MAIN_TEXT    = 1;
		this.BACK_MATTER  = 2;

		this.text = secData;
		this.setting = setting;

		var n = 0;
		//
		this.begin = n;
		//
		this.maegaki = {};
		this.maegaki.begin = n;
		if (setting.fMaegaki && secData.maegaki !== null
			&& secData.maegaki !== undefined) {
			n += secData.maegaki[0].length;
		}
		this.maegaki.end = n;
		this.maegaki.size = this.maegaki.end - this.maegaki.begin;
		//
		this.honbun = {};
		this.honbun.begin = n;
		if (secData.honbun !== null && secData.honbun !== undefined) {
			n += secData.honbun[0].length;
		}
		this.honbun.end = n;
		this.honbun.size = this.honbun.end - this.honbun.begin;
		//
		this.atogaki = {};
		this.atogaki.begin = n;
		if (setting.fAtogaki && secData.atogaki !== null
			&& secData.atogaki !== undefined) {
			n += secData.atogaki[0].length;
		}
		this.atogaki.end = n;
		this.atogaki.size = this.atogaki.end - this.atogaki.begin;
		//
		this.end = n;
		this.size = this.end - this.begin;
		//
	}
	PageMap.prototype = {
		getPageInfo: function (pageNo) {
			if (pageNo < this.maegaki.end) {
				return {
					type: this.FRONT_MATTER,
					offset: pageNo - this.maegaki.begin,
				};
			} else if (pageNo < this.honbun.end) {
				return {
					type: this.MAIN_TEXT,
					offset: pageNo - this.honbun.begin,
				};
			}
			return {
				type: this.BACK_MATTER,
				offset: pageNo - this.atogaki.begin,
			};
		},
		isMainTextFirstPage: function (pageNo) {
			return (pageNo == this.honbun.begin);
		},
		isMainTextPage: function (pageNo) {
			return (this.getPageInfo (pageNo).type == this.MAIN_TEXT);
		},
		getPageText: function (pageNo) {
			var pageInfo = this.getPageInfo (pageNo);
			var text = null;
			switch (pageInfo.type) {
			case this.FRONT_MATTER:		// 前書き
				text = this.text.maegaki;
				break;
			case this.MAIN_TEXT:		// 本文
				text = this.text.honbun;
				break;
			case this.BACK_MATTER:		// 後書き
				text = this.text.atogaki;
				break;
			}
			return {
				bodyLines: text[0][pageInfo.offset],
				rubyLines: text[1][pageInfo.offset],
			};
		},
	};


	// 
	var gSectionManager = {
		// remake対策でformat paramを覚えておくほうがいいか？
		sectionDB: {},
		clear: function () {
			sectionDB = {};
		},
		//SECTION_STATUS_TRUE: true,
		SECTION_STATUS_LOADING: true,
		SECTION_STATUS_INVALID: false,

		isSectionReady: function (secId) {
			return ((secId in this.sectionDB) && this.sectionDB[secId] !== null
				&& this.sectionDB[secId] !== true
				&& this.sectionDB[secId] !== false
			);
		},
		isSectionNotLoading: function (secId) {
			return (!(secId in this.sectionDB) || this.sectionDB[secId] === null
				|| this.sectionDB[secId] === this.SECTION_STATUS_INVALID
			);
		},
		isSectionLoading: function (secId) {
			return (this.sectionDB[secId] === this.SECTION_STATUS_LOADING);
		},
		setStatusInvalid: function (secId) {
			this.sectionDB[secId] = this.SECTION_STATUS_INVALID;
		},
		setStatusLoading: function (secId) {
			this.sectionDB[secId] = this.SECTION_STATUS_LOADING;
		},
		// プリミティブすぎる
		isExist: function (secId) {
			return (secId in this.sectionDB);
		},
		getData: function (secId) {
			return (secId in this.sectionDB) ? this.sectionDB[secId] : null;
		},
		WITH_OVERWRITE: true,
		WITHOUT_OVERWRITE: false,
		// これは完全データであることを保証する
		registData: function (secId, secData, with_overwrite) {
			//console.debug('registData: dump secData', secId, secData);
			if (with_overwrite === undefined) {
				with_overwrite = this.WITHOUT_OVERWRITE;
			}
			if (with_overwrite
				|| !(secId in this.sectionDB) || !this.isRectionReady(secId)) {
				this.sectionDB[secId] = secData;
			}
			return this.sectionDB[secId];
		},
		registIncompleteData: function (secId, secData, with_overwrite) {
			//console.debug('dump secData', secData);
			if (with_overwrite === undefined) {
				with_overwrite = WITHOUT_OVERWRITE;
			}
			if (with_overwrite
				|| !(secId in this.sectionDB) && this.sectionDB[secId] !== null) {
				this.sectionDB[secId] = secData;
				var sec = this.sectionDB[secId];
				sec._maegaki = ('_maegaki' in sec) ? sec._maegaki : null;
				sec._atogaki = ('_atogaki' in sec) ? sec._atogaki : null;
				//
				sec = splitContentsBody (sec, secId);
				return sec;
			}
			return null;
		},
		getPageMap: function (secData, setting) {
			return new PageMap(secData, setting);
		},
		////////////////////////////////////////////////////////
		// 文章領域のページ数を計算する
		// 一部で有無checkを_maegakiのraw側でしている部分もあったが
		countPages: function (secData, setting) {
			//console.debug('countPages: dump secData', secData);
			var nPages = secData.honbun[0].length;
			if (secData.maegaki !== null && setting.fMaegaki) {
				nPages += secData.maegaki[0].length;
			}
			if (secData.atogaki !== null && setting.fAtogaki) {
				nPages += secData.atogaki[0].length;
			}
			return nPages;
		},
		// 指定section範囲のページ数を計算
		countSectionPages: function (beginSection, endSection, setting) {
			beginSection = (beginSection === undefined) ? 1 : beginSection;
			endSection   = (endSection   === undefined) ? this.length : endSection;
			var nPages = 0;
			for (var i = beginSection; i < endSection; ++i) {
				if (!(i in this.sectionDB) || this.sectionDB[i] === false) {
					return null;
				}
				var n = this.countPages(this.getData(i), setting);
				// キャンバス内ページ数可変対応済
				nPages += gCurrentManager.getPagesAlinedCanvas(n);
			}
			return nPages;
		},

		// $.each()ではthisでもvalueにアクセスできるが
		// thisは単純な値でもobject化するので注意
		each: function (fn) {
			$.each(this.sectionDB, fn);
		},
		rangedEach: function (min, max, fn) {
			for (var i = min; i <= max; ++i) {
				if (i in this.sectionDB && this.sectionDB[i] !== false
					&& this.sectionDB[i] !== null) {
					if (!fn (i, this.sectionDB[i])) {
						break;
					}
				}
			}
		},
		length: function () {
			return this.sectionDB.length;
		},
		// 用途によって、idがある(がnull)のminを探したい場合と
		// 完全にデータがreadyのものを探したい場合があるかも？
		minId: function () {
			var secId;
			for (secId = 1;
				secId < this.sectionDB.length
				&& (!(secId in this.sectionDB) || this.sectionDB[secId] === null);
				++secId) {
				// none
			}
			return secId;
		},
		// download形式の中身を作る
		toHtmlDiv: function (secId, secData, prefix) {
			var s = '<div id="' + prefix + 'section_' + secId + '">\n';
			if (secData._maegaki) {
				s += '<div class="' + prefix + 'maegaki">'
					+ secData._maegaki.replace(reAllLineBreak, '') + '</div>\n';
			}
			if (secData.chapter_title !== '') {
				s += '<div class="' + prefix + 'chapter_title">'
					+ $('<div>').text(sectData.chapter_title).html() + '</div>\n';
			}
			s += '<div class="' + prefix + 'subtitle">'
				+ $('<div>').text(secData.subtitle).html() + '</div>\n';
			s += '<div class="' + prefix + 'honbun">'
				+ secData._honbun.replace(reAllLineBreak, '') + '</div>\n';
			if (secData._atogaki) {
				s += '<div class="' + prefix + 'atogaki">'
					+ secData._atogaki.replace(reAllLineBreak, '') + '</div>\n';
			}
			s += '</div>\n';
			return s;
		},
		toDiv: function (secId, secData, prefix) {
			var divRoot = $('<div id="' + prefix + 'section_' + secId + '">');
			if (sec._maegaki !== null) {
				divRoot.append('<div class="' + prefix + 'maegaki">'
					+ sec._maegaki + '</div>');
			}
			if (sec.chapter_title !== '') {
				divRoot.append('<div class="' + prefix + 'chapter_title">'
					+ sec.chapter_title + '</div>');
			}
			divRoot.append('<div class="' + prefix + 'subtitle">'
				+ sec.subtitle + '</div>');
			divRoot.append('<div class="' + prefix + 'honbun">'
				+ sec._honbun + '</div>');
			if (sec._atogaki !== null) {
				divRoot.append('<div class="' + prefix + 'atogaki">'
					+ sec._atogaki + '</div>');
			}
			return divRoot;
		},
		restore: function (sourceSections, fn, with_overwrite) {
			if (with_overwrite === undefined) {
				with_overwrite = WITHOUT_OVERWRITE;
			}
			if (fn === undefined) {
				fn = null;
			} else if (fn === WITH_OVERWRITE || fn === WITHOUT_OVERWRITE) {
				with_overwrite = fn;
				fn = null;
			}
			$.each (sourceSections, function (secId, secData) {
				var sec = gSectionManager.registInComplateData(secId, secData);
				if (sec !== null && fn !== null) {
					// thisが変わってしまうのでまずいかも？
					if (!fn (sec, secId)) {
						return false;
					}
				}
				return true;
			});
		},

		///////////////////////////////////////////
		// 一部ではsec !== nullがないベタ展開コードがあったが問題ないので統合
		// 一部でstart=1で呼び出している箇所があるが謎
		//
		// デフォルト引数はFirefox系じゃないとサポートしてない(ECMA Script 6の仕様内)
		// http://kangax.github.io/es5-compat-table/es6/
		// しょうがないからまだおとなしく普通にかいておく
		//
		reMake: function (beginId, endId) {
			console.debug("remake pages called");
			beginId = (beginId === undefined) ? 0 : beginId;
			endId = (endId === undefined) ? this.sectionDB.length : endId;
			for (var secId = beginId; secId < endId; ++secId) {
				var secData = this.sectionDB[secId];
				if (secId in this.sectionDB && secData !== false && secData !== null) {
					console.debug("remake page:", secId);
					console.debug("param lc:", gLinesPerCanvas, gCharsPerLine);
					secData = splitContentsBody (secData, secId);
				}
			}
		},
		// loadコンテンツがらみなのでそのまま置き換えるべきか
		// validateすべきか悩むところ
		replaceDataBase: function (secDB) {
			this.clear();
			this.sectionDB = secDB;
		},

		// saveData形式を生成:dataが与えられなければcreate,そうでない場合はreplace
		createSaveData: function (data, src_sections, startSecNo, endSecNo) {
			src_sections = (src_sections === undefined) ? this.sectionDB : sec_sections;
			startSecNo = (startSecNo === undefined) ? 1 : startSecNo;
			endSecNo = (endSecNo === undefined) ? src_sections.length : endSecNo;
			data = (data === undefined) ? {} : data;

			if (gIndexManager.isIndexPageReady()) {
				data.index = $('<div>')
					.append(gSiteParser.selectNojaIndexData().clone())
					.html();
			}
			// @@ 互換性のためtypoをそのまま残すか？
			data.tanpen = gIndexManager.isIndexPageDisable();
			data.generalAllNo = Math.max (gGeneralAllNo, data.generalAllNo);
			data.title = gSiteParser.title;
			data.color = gSiteParser.color;
			data.bgColor = gSiteParser.bgColor;
			data.auther = gSiteParser.author;
			data.bgImage = gSiteParser.bgImage
				? $(gSiteParser.bgImage).attr('src') : null;
			//セクションデータ
			for(var i = startSecNo; i < endSecNo.length; ++i) {
				var sec = src_sections[i];
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
		},
		// autoPagerize(secData, secId)は微妙にManagerが管理すべきか悩む
	};

	//////////////////////////////
	var getDateTimeNow = function () {
		var w2 = function (v) {
			return (v < 10) ? '0' + v : '' + v;
		};
		var dt = new Date ();
		var Y = dt.getFullYear ();
		var M = w2 (dt.getMonth () + 1);
		var D = w2 (dt.getDate ());
		var h = w2 (dt.getHours ());
		var m = w2 (dt.getMinutes ());
		var s = w2 (dt.getSeconds ());
		return '' + Y + '-' + M + '-' + D + ' ' + h + '-' + m + '-' + s;
	};
	//////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	//設定
	var WITH_SAVE = true;
	var WITHOUT_SAVE = false;

	var gSetting = {};
	//var fncSave_ncode = function (setting) {
	// 新規読み込み時等で値が未定義の場合もありそれを修正
	var getSettingDefault = function () {
		return {
			ncode: null,
			fMaegaki: true,	// 前書き表示
			fAtogaki:true,	// 後書き表示
			kaigyou: false,	// 改行詰め
			// autoSave:,
			// autoRestore:,
			// oldData:,
		};
	};
	var createSettingNew = function (ncode) {
		return $.extend(getSettingDefault (), {ncode: ncode});
	};
	// instance method化する
	var validateSetting = function (setting) {
		setting = (setting === undefined) ? gSetting : setting;
		setting.autoSave    = (setting.autoSave === true);
		setting.autoRestore = (setting.autoRestore === true);
		setting.oldData     = (setting.oldData === true);
	};
	// まとめて
	var setSetting = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting = value;
		if (with_save) {
			fncSave_ncode (gSetting);
		}
	};
	var setSettingKaigyou = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.kaigyou = value;
		if (with_save) {
			fncSave_ncode (gSetting);
		}
	};
	var setSettingFMaegaki = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.fMaegaki = value;
		if (with_save) {
			fncSave_ncode (gSetting);
		}
	};
	var setSettingFAtogaki = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.fAtogaki = value;
		if (with_save) {
			fncSave_ncode (gSetting);
		}
	};

	var setSettingAutoSave = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.autoSave = value;
		if (with_save) {
			fncSave_ncode (gSetting);
		}
	};
	var setSettingAutoRestore = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.autoRestore = value;
		if (with_save) {
			fncSave_ncode (gSetting);
		}
	};
	var setSettingOldData = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.oldData = value;
		if (with_save) {
			fncSave_ncode (gSetting);
		}
	};

	//////////// 保存される設定

	//フォントタイプ(FONTTYPE_MINCHO | FONTTYPE_GOTHIC)
	var gFontType;
	//前書き、後書きのレイアウト（枠線を付けるか否か）
	var gLayout;	//
	// そのうちsetter or watcherに変更する
	var setGlobalLayout = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gLayout = value;
		if (with_save) {
			fncSave_global ('layout', gLayout);
		}
	};
	//ページ読み込み直後に開くかどうか
	var gAlwaysOpen;	//
	var setGlobalAlwaysOpen = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gAlwaysOpen = value;
		if (with_save) {
			fncSave_global ('alwaysOpen', gAlwaysOpen);
		}
	};
	//累計ページ数を表示するかどうか
	var gAllpage;	//
	var setGlobalAllpage = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gAllpage = value;
		if (with_save) {
			fncSave_global ('allpage', gAllpage);
		}
	};

	//文字サイズ設定スライドバーの位置
	var gSlidePos;
	var setGlobalSlidePos = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSlidePos = value;
		if (with_save) {
			fncSave_global ('slidePos', gSlidePos);
		}
	};
	//縦書リーダーなのに横書で読みたいという酔狂な人のために
	var gYokogaki = true;
	var setGlobalYokogaki = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gYokogaki = value;
		if (with_save) {
			fncSave_global ('yokogaki', gYokogaki);
		}
	};



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

	var setGlobalFontType = function (font_type, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gFontType = font_type;
		if (with_save) {
			fncSave_global ('fontType', gFontType);
		}
	};


	// 元ページに張り付けるのジャーラベルのデフォルト文字列
	var getNojaLabel = function () {
		return '<a id="noja_open" style="cursor:pointer;font-size:'
			+ FONTSMALL
			+ '; display:block; margin-top:10px;">のじゃー縦書リーダー</a>';
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

	// jumpToにbindした場合は
	// jumpTo内でもJumpTo.LAST_PAGE_NO
	// としないといけない
	// gJumpController.jumpToにして
	// gJumpController.FIRST_SECTION_NO
	// としておけば、this.FIRST_SECTION_NOでいい
	// 関数呼び出しかメソッド呼出しかの違いだが…
	// 使う側からすればどれも似たような感じ
	var CURRENT_SECTION_NO_WITH_RELOAD = -1;
	var FIRST_SECTION_NO = 1;
	var FIRST_PAGE_NO = 0;
	var LAST_PAGE_NO = -1;	// 負のindexはend-x(endは最終+1)

	//////////////////////////////////////////////////////////////////////
	//こっから関数の実体定義
	valid = function (x) { return typeof x !== 'undefined'; };

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


	/////////////////////////////////////////////////////////////////
	// ダウンロード関連のDOM管理等
	var downloadFileManager = {
		replaceAll: function (downloadFileMain) {
			$('#noja').empty().append(downloadFileMain);
		},
		margeSections: function (new_section, notifyFn) {
			if (notifyFn === undefined) {
				notifyFn = null;
			}
			var prev = null;
			for (var sec_no = 1; sec_no < new_sections.length; ++sec_no) {
				var sec_id = 'noja_download_section_' + sec_no;
				var existInDest = gSectionManager.isExist(sec_no);
				if (sec_no in new_sections) {
					var sec = new_sections[sec_no];
					var itemDiv = gSectionManager.toDiv (sec_no, sec, 'noja_download_');
					if (existInDest) {
						prev = $('#' + sec_id).replaceWith(itemDiv);
					} else {
						// DOM側にはないはずの新規
						var oldItem = $('#' + sec_id);
						if (oldItem.size()) {
							console.debug('DOMにないはずのitemがあった', sec_id);
							oldItem.remove();
						}
						if (prev === null) {
							$('#noja_download_file_main')
								.prepend(itemDiv);
						} else {
							prev = prev.after(itemDiv);
						}
					}
					prev = $('#' + sec_id);
					if (notifyFn !== null) {
						notifyFn (sec_no, sec);
					}
				} else if (existInDest) {
					// 既存でnew側にはない番号の場合はprev更新だけ
					prev = $('#' + sec_id);
				}
			}
		},
		setColorTheme: function (colorInfo) {
			$('#noja_download_file_main').css({
				color: colorInfo.color,
				backgroundColor: colorInfo.bgColor
			});
			if (colorInfo.bgImage) {
				$('#noja_download_file_main')
					.css('background-image'
						, 'url(' + colorInfo.bgImage + ')');
			}
		},
		resetColorTheme: function () {
			$('#noja_download_file_main').css({
				color: '',
				backgroundColor: '',
				backgroundImage:''
			});
		},
		// このあたりは通常のコンテンツ読み込み時の処理と共通化できる
		parseColorTheme: function (info, infoRoot) {
			info.color = infoRoot.css('color');
			info.bgColor = infoRoot.css('background-color');
			info.bgImage = infoRoot.css('background-image');
			if (info.bgImage === null
				|| info.bgImage === 'none'
				|| info.bgImage === '') {
				info.bgImage = null;
			} else {
				var url = info.bgImage.match(/url\(([^\)]*)\)/)[1];
				info.bgImage = $('<img>')
					.attr('src', url)
					.bind('load', function() {showPage();})
					.get(0);
				info.bgColor = '#FFFFFF';
			}
			return info;
		},

		// dataRoot直下のdivから各download_sectionを取り出す
		// 取り込みだけでsplitするのは凶悪なので呼出し側に任せる
		toDataAll: function (dest_sections, dataRoot, prefix, fn) {
			prefix = (prefix === undefined) ? '' : prefix;
			fn = (fn === undefined) ? null : fn;
			min_max_sec_no = new MinMaxRecorder();
			dataRoot.children('div').each(function () {
				var secId = parseInt(
					$(this).attr('id').substr(prefix + 'section_'.length)
				);
				min_max_sec_no.update(secId);
				var sec = {};
				sec.chapter_title = getText('.' + prefix + 'chapter_title', this);
				//
				sec.subtitle = getText('.' + prefix + 'subtitle', this);
				//
				sec._maegaki = getHtml('.' + prefix + 'maegaki', this);
				sec._atogaki = getHtml('.' + prefix + 'atogaki', this);
				sec._honbun = getHtml('.' + prefix + 'honbun', this);
				if (fn !== null) {
					if (!fn(sec, secId)) {
						return false;
					}
				}
				dest_sections[secId] = sec;
				return true;
			});
			return min_sec_no;
		},
	};
	/////////////////////////////////////////////////////////////////
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
		this.alwaysOpenDefault = true;

		//
		setCurrent.setCurrent (-1);
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

	// ajaxでページを読み込む
	// Deferred objectを返す
	AppModeSite.prototype.getNovelSection = function (section) {
		if (!gNetworkManager.get()) {
			return $.Deferred().reject().promise();
		}
		return $.get(this.getNovelSectionURL (section))
		.always(function () {
			gNetworkManager.release();
		});
	};
	// これは上で使われる
	AppModeSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};

	/////////////// 後は全部class内部でframe構築等で使っているもの
	// Twitterリンク用→未使用予定
	AppModeSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// 未使用
	AppModeSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// 未使用
	// '{{:site2}}novelpoint/register/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getNovelPointRegisterURL = function () {
		return this.site2 + 'novelpoint/register/ncode/' + this.ncode2 + '/';
	};
	// 未使用
	// '{{:site2}}impression/confirm/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getImpressionConfirmURL = function () {
		return this.site2 + 'impression/confirm/ncode/' + this.ncode2 + '/';
	};
	// 未使用
	// '{{:site2}}impression/list/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getImpressionListURL = function () {
		return this.site2 + 'impression/list/ncode/' + this.ncode2 + '/';
	};
	// 未使用
	// '{{:site2}}novelreview/list/ncode/{{:ncode2}}/'
	AppModeSite.prototype.getNovelReviewListURL = function () {
		return this.site2 + 'novelreview/list/ncode/' + this.ncode2 + '/';
	};
	// 未使用
	AppModeSite.prototype.getNovelReviewConfirmURL = function () {
		return this.site2 + 'novelreview/confirm/ncode/' + this.ncode2 + '/';
	};
	// 未使用
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


	// 多分抜き出しても大丈夫だと思うが変数束縛はチェックしていない
	// 初期化段階でのメニューカスタマイズ
	AppModeSite.prototype.customizeMenu = function () {
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
			+ '<br /><br />'
			+ '<a id="noja_yomikomi">保存・読み込み機能について</a>'
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
					jumpTo ((gCurrentManager.id == FIRST_SECTION_NO)
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

	// Deferred interface
	AppModeSite.prototype.importInitialContents = function () {
		return nojaImport (fncLsc (noja_option.app_setumei));
	};

	// 「のじゃー」ラベルを元ページに貼り付け
	AppModeSite.prototype.attachNoja = function () {
		// AppModeだと不要のはず？
		$('#novelnavi_right').append(getNojaLabel());
	};

	AppModeSite.prototype.replaceImageURL = function (url) {
		return url;
	};

	AppModeSite.prototype.getNextSection = function (secId) {
		return ++secId;
	};

	AppModeSite.prototype.getPrevSection = function (secId) {
		return --secId;
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
		this.alwaysOpenDefault = false;

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		this.api   = 'http://api.syosetu.com/novelapi/api/';
		this.site  = 'http://ncode.syosetu.com/';
		this.site0 = 'http://syosetu.com/';	//
		this.site2 = 'http://novelcom.syosetu.com/';
		this.siteS = 'http://static.syosetu.com/';
		var m = NarouSite.reURL.exec(url);
		if (m) {
			this.ncode = m[1].toLowerCase();
			// 短編のときはm[2]が空になるはず(=0)
			var secNo = parseInt(m[2]);
			if (secNo === null || secNo === 0) {
				gCurrentManager.setSingleSection ();
			} else {
				gCurrentManager.setCurrent (secNo);
			}
		} else {
			console.debug('!m:', m);
		}
	}
	NarouSite.reURL = /http:\/\/ncode.syosetu.com\/([nN][^\/]*)\/([0-9]*)/;
	// なろう系の場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない
	NarouSite.siteName = '小説家になろう';
	NarouSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/ncode\.syosetu\.com\/[nN]/
		) === 0);
	};
	// ajaxでページを読み込む
	// Deferred objectを返す
	NarouSite.prototype.getNovelSection = function (section) {
		if (!gNetworkManager.get()) {
			return $.Deferred().reject().promise();
		}
		return $.get(gSiteParser.getNovelSectionURL (section))
		.always(function () {
			gNetworkManager.release();
		});
	};
	// これは上で使われる
	NarouSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};

	/////////////// 後は全部class内部でframe構築等で使っているもの
	// その作品のtopページ
	NarouSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// その作品のindexページ
	NarouSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	NarouSite.prototype.getLoginURL = function () {
		return this.site0 + 'login/input/';
	};
	NarouSite.prototype.getUserTopURL = function () {
		return this.site0 + 'user/top/';
	};
	NarouSite.prototype.getBookmarkImageURL = function () {
		return this.siteS + 'view/images/bookmarker.gif';
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
		return this.site0 + 'bookmarker/add/ncode/';
	};


	NarouSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentManager.id : section_no;
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
					.replace(reAllLineBreak, '')
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
		gCurrentManager.setSingleSection (this.isSingleSection);
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

		sec = splitContentsBody (sec, gCurrentManager.id);

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
		gSectionManager.registData (gCurrentManager.id
			, this.parseHtmlCommon (contents, gCurrentManager.id));
		//
		gCurrentManager.setCurrent (gCurrentManager.id);
		// autoPagerが貼り付ける先に独自attrを付ける
		$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
			.attr('data-noja', gCurrentManager.id);
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
		var dfrd = new $.Deferred();
		if (!gNetworkManager.get()) {
			return dfrd.reject().promise();
		}
		$.get(this.getNovelIndexURL()).always(function () {
			gNetworkManager.release();
		}).then(
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
	// getJSONにする(Deferred対応でfailも処理できるし)
	NarouSite.prototype.loadMaxSectionNo = function () {
		var dfrd = new $.Deferred();
		if (!gNetworkManager.get()) {
			return $.Deferred().reject().promise();
		}
		$.getJSON (this.api + NAROUAPI_AJAX_GET_OPT + this.ncode)
		.always(function () {
			gNetworkManager.release();
		})
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
		// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	};

	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	NarouSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	NarouSite.prototype.customizeMenu = function () {
		// 初期化段階でのメニューカスタマイズ
	};

	// Deferred interface
	NarouSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};

	// 「のじゃー」ラベルを元ページに貼り付け
	// 位置が悪い？
	// $('#head_nav')
	//	.append('<li><a id="noja_open" class="menu">のじゃー縦書リーダー</a></li>');
	NarouSite.prototype.attachNoja = function () {
		$('#novelnavi_right').append(getNojaLabel());
	};

	NarouSite.prototype.replaceImageURL = function (url) {
		// 画像src(@みてみん)のリンクを修正
		// これはなろう固有の話
		return  url.replace('viewimagebig', 'viewimage');
	};

	NarouSite.prototype.getNextSection = function (secId) {
		return ++secId;
	};

	NarouSite.prototype.getPrevSection = function (secId) {
		return --secId;
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
		this.alwaysOpenDefault = false;

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		this.api   = 'http://api.syosetu.com/novel18api/api/';
		this.site  = 'http://novel18.syosetu.com/';
		this.site2 = 'http://novelcom18.syosetu.com/';
		this.site0 = 'http://syosetu.com/';	// 共通で使ってる場所がある？
		this.siteS = 'http://static.syosetu.com/';
		var m = NocMoonSite.reURL.exec (url);
		if (m) {
			this.ncode = m[1].toLowerCase();
			// 短編のときはm[2]が空になるはず(=0)
			var secNo = parseInt(m[2]);
			if (secNo === null || secNo === 0) {
				gCurrentManager.setSingleSection ();
			} else {
				gCurrentManager.setCurrent (secNo);
			}
		} else {
			console.debug('!m:', m);
		}
	}
	NocMoonSite.reURL = /http:\/\/novel18.syosetu.com\/([nN][^\/]*)\/([0-9]*)/;
	// なろう系の場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない
	NocMoonSite.siteName = 'ノクターン・ムーンライト';
	NocMoonSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/novel18\.syosetu\.com\/n/
		) === 0);
	};
	// ajaxでページを読み込む
	// Deferred objectを返す
	NocMoonSite.prototype.getNovelSection = function (section) {
		if (!gNetworkManager.get()) {
			return $.Deferred().reject().promise();
		}
		return $.get(gSiteParser.getNovelSectionURL (section))
		.always(function () {
			gNetworkManager.release();
		});
	};
	// これは上で使われる
	NocMoonSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};

	/////////////// 後は全部class内部でframe構築等で使っているもの
	// その作品のtopページ
	NocMoonSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// その作品のindexページ
	NocMoonSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	NocMoonSite.prototype.getLoginURL = function () {
		return this.site0 + 'login/input/';
	};

	NocMoonSite.prototype.getUserTopURL = function () {
		return this.site0 + 'user/top/';
	};
	NocMoonSite.prototype.getBookmarkImageURL = function () {
		return this.siteS + 'view/images/bookmarker.gif';
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
		return this.site0 + 'bookmarker/add/ncode/';
	};

	NocMoonSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentManager.id : section_no;
		return $.render.nocMoonShioriURLTmpl({
			ncode2: this.ncode2,
			section_no: section_no,
			token: this.token
		});
	};
	NocMoonSite.prototype.getFavnovelmain18BaseURL = function () {
		return this.site0 + 'favnovelmain18/';
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
					.replace(reAllLineBreak, '')
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
		//後書きデータ取得
		//本文データ取得
		sec._maegaki = getHtml('#novel_p', contents);
		sec._atogaki = getHtml('#novel_a', contents);
		sec._honbun  = getHtml('#novel_honbun', contents);

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

		gCurrentManager.setSingleSection (this.isSingleSection);
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
		gSectionManager.registData (gCurrentManager.id
			, this.parseHtmlCommon(contents, gCurrentManager.id));
		//
		gCurrentManager.setCurrent (gCurrentManager.id);
		// autoPagerが貼り付ける先に独自attrを付ける
		$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
			.attr('data-noja', gCurrentManager.id);
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
		var dfrd = new $.Deferred();
		if (!gNetworkManager.get()) {
			return dfrd.reject().promise();
		}
		$.get (this.getNovelIndexURL()).always(function() {
			gNetworkManager.release();
		}).then(
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
		var dfrd = new $.Deferred();
		if (!gNetworkManager.get()) {
			return $.Deferred().reject().promise();
		}
		$.getJSON (this.api + NAROUAPI_AJAX_GET_OPT + this.ncode)
		.always(function () {
			gNetworkManager.release();
		})
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
		// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	};


	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	NocMoonSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	NocMoonSite.prototype.customizeMenu = function () {
		// 初期化段階でのメニューカスタマイズ
	};

	// Deferred interface
	NocMoonSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};

	// 「のじゃー」ラベルを元ページに貼り付け
	// 位置が悪い？
	// $('#head_nav')
	//	.append('<li><a id="noja_open" class="menu">のじゃー縦書リーダー</a></li>');
	NocMoonSite.prototype.attachNoja = function () {
		$('#novelnavi_right').append(getNojaLabel());
	};

	NocMoonSite.prototype.replaceImageURL = function (url) {
		// 画像src(@みてみん)のリンクを修正
		// これはなろう固有の話
		return  url.replace('viewimagebig', 'viewimage');
	};

	NocMoonSite.prototype.getNextSection = function (secId) {
		return ++secId;
	};

	NocMoonSite.prototype.getPrevSection = function (secId) {
		return --secId;
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
		this.alwaysOpenDefault = false;

		//ctorで外部変数を更新するのもナニだがとりあえずそのまま
		this.site = 'about:blank';
		this.api = 'about:blank/';
		this.site2 = 'about:blank/';
		var m = AkatsukiSite.reURL.exec (url);
		if (m) {
			// m[1]はsection id
			this.currentSectionId = m[1];
			this.ncode = m[2];
			//this.ncode = parseInt(m[2]);	// 別に数値にする必然性はない

			// map{id: secNo}がわからないと対応が取れないが
			gCurrentManager.setCurrent (this.currentSectionId);
		} else {
			console.debug('!m:', m);
		}
		// 逆方向はjQueryの$.inArray(id, sectioNo2Id)でindexで取る
		// どうせ初期ページがsectionどこにあたるのかを知るためだけ
		this.sectionNo2Id = [];
		// 多分prototypeでobjectが作られてからctorが呼ばれるはずなので
		// 呼び出して問題ないはず
		this.indexPages = [];
		this.fetchIndexPage();

	}
	AkatsukiSite.reURL = /http:\/\/www\.akatsuki-novels\.com\/stories\/view\/(\d+)\/novel_id~(\d+)/;
	AkatsukiSite.siteName = '暁';
	AkatsukiSite.isSupportedURL = function (url) {
		return (url.search(
			/http:\/\/www\.akatsuki-novels\.com\/stories\/view\/\d+\/novel_id~\d+/
		) === 0);
	};
	// ajaxでページを読み込む
	// Deferred objectを返す
	AkatsukiSite.prototype.getNovelSection = function (section) {
		if (!gNetworkManager.get()) {
			return $.Deferred().reject().promise();
		}
		return $.get(gSiteParser.getNovelSectionURL (section))
		.always(function () {
			gNetworkManager.release();
		});
	};
	// これは上で使われる
	AkatsukiSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '/';
	};

	/////////////// 後は全部class内部でframe構築等で使っているもの

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
	AkatsukiSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentManager.id : section_no;
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
	//html body#novel div#wrapper div#container2 div#contents2 div#contents-inner2 div.box div.box div.paging_for_view
	// これがページ移動 #contents-inner2を取ってくるので情報は取れる
	// html body#novel div#wrapper div#container2 div#contents2 div#contents-inner2 div.box div.box div.paging_for_view span.next
	// disableのときは disabledも付く
	// html body#novel div#wrapper div#container2 div#contents2 div#contents-inner2 div.box div.box div.paging_for_view span.prev
	// <div class="paging_for_view">
	//<span class="prev disabled">< 前ページ</span>
	//<span class="next">
	//<a rel="next" href="/stories/view/79203/novel_id~6791">次ページ ></a>
	//</span>
	//an class="table_of_contents">
	//<a rel="table_of_contents" href="/stories/index/novel_id~6791">目次</a>
	//</span>
	//</div>
	//
	//<div class="paging_for_view">
	//<span class="prev">
	//<a rel="prev" href="/stories/view/83476/novel_id~6791">< 前ページ</a>
	//</span>
	//<span class="next disabled">次ページ ></span>
	//<span class="table_of_contents">
	//<a rel="table_of_contents" href="/stories/index/novel_id~6791">目次</a>
	//</span>
	//</div>
	// rel属性が論理的なrelationなのでそれを使う
	// paging_for_viewは上下にあるので1つ目を使うべし

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
		gCurrentManager.setSingleSection ();
		// その他
		// 解析した中身によって本来変更すべきもの
		this.login = false;
		this.token = null;
		this.ncode2 = null;

		this.updateThemeAtSection (story, novels);
		this.updateTitleAtSection (story, novels);

		// htmlの共通parserにかける前に
		// 雀牌画像の逆変換をして独自タグに戻すべき
		gSectionManager.registData (gCurrentManager.id
			, this.parseHtmlCommon (story, novels, gCurrentManager.id));
		gCurrentManager.setCurrent (gCurrentManager.id);

		// autoPagerが貼り付ける先に独自attrを付ける
		if (false) {
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', gCurrentManager.id);
		}
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
	// html body#novel div#wrapper div#container2 div#contents2
	//   div#contents-inner2 div.box
	// とりあえずcontents-inner2の中に全部ある
	AkatsukiSite.prototype.loadIndex = function () {
		var dfrd = new $.Deferred();
		if (!gNetworkManager.get()) {
			return dfrd.reject().promise();
		}
		$.get(this.getNovelIndexURL()).always(function () {
			gNetworkManager.release();
		}).then(
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
		var dfrd = new $.Deferred();
		this.loadIndex().then(
			function (maxSectionNo) {
				gIndexManager.setIndexPageReady();
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
			if (!gNetworkManager.get()) {
				return $.Deferred().reject().promise();
			}
			$.get(url).always(function () {
				gNetworkManager.release();
			}).then(function(data) {
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
			},
			function() {
				console.debug('fetch first index failed');
				// どうしよう？
			});
		}
	};


	// 自動loadIndexさせないとid:secnoのmapが作れない
	AkatsukiSite.prototype.startAsyncProcess = function () {
		// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	};


	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	AkatsukiSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	AkatsukiSite.prototype.customizeMenu = function () {
		// 初期化段階でのメニューカスタマイズ
	};

	// Deferred interface
	AkatsukiSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};

	// 「のじゃー」ラベルを元ページに貼り付け
	AkatsukiSite.prototype.attachNoja = function () {
		//$('#novelnavi_right').append(getNojaLabel());
	};

	AkatsukiSite.prototype.replaceImageURL = function (url) {
		return  url;
	};

	// idが純粋にidなのでlinkから取る
	AkatsukiSite.prototype.getNextSection = function (secId) {
		return ++secId;
	};

	// idが純粋にidなのでlinkから取る
	AkatsukiSite.prototype.getPrevSection = function (secId) {
		return --secId;
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
		this.alwaysOpenDefault = false;

		this.site = 'http://novel.syosetu.org/';
		this.api = 'about:blank';
		this.site2 = 'about:blank';

		// 短編判定と設定はここでしてしまう
		var m = HamelnSite.reURL.exec(url);
		if (m) {
			this.ncode = m[1];
			this.isShortStory = (!m[2]  || m[2] == 'index.html');
			if (this.isShortStory) {
				// 中身のparseをしないと区別がつかない
				// 少なくとも連載ではないので仮設定は短編
				gCurrentManager.setSingleStory ();
				console.debug('短編 or 目次:', m[2]);
			} else {
				gCurrentManager.setCurrent (parseInt(m[3]));
				console.debug('連載:', gCurrentManager.id);
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

	// ajaxでページを読み込む
	// Deferred objectを返す
	HamelnSite.prototype.getNovelSection = function (section) {
		if (!gNetworkManager.get()) {
			return $.Deferred().reject().promise();
		}
		return $.get(gSiteParser.getNovelSectionURL (section))
		.always(function () {
			gNetworkManager.release();
		});
	};
	// これは上で使われる
	HamelnSite.prototype.getNovelSectionURL = function (section) {
		return this.site + this.ncode + '/' + section + '.html';
	};
	/////////////// 後は全部class内部でframe構築等で使っているもの
	// その作品のtopページ
	HamelnSite.prototype.getNovelBaseURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};
	// その作品のindexページ
	HamelnSite.prototype.getNovelIndexURL = function (novel_code) {
		return this.site + this.ncode + '/';
	};

	HamelnSite.prototype.getShioriURL = function(section_no) {
		section_no = (section_no === undefined) ? gCurrentManager.id : section_no;
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
	// next,prevのリンクを拾って次話移動判定に使う
	// これでindex loadが不要になる
	// /html/body/div/div/div[2]/div/p/a[2]
	// html body div#container div#page div#maind div.ss p a
	//   '<< 前の話'
	// /html/body/div/div/div[2]/div/p/a[3]
	// html body div#container div#page div#maind div.ss p a
	//   '次の話 >>'
	// a[3]は最終話のときは要素自体なし
	//<p>
	//<font size="+2">
	//(
	//<a href="http://syosetu.org/?mode=user&uid=${作者id}">${作者名}</a>
	//)
	//<br>
	//<a href="./27.html"><< 前の話</a>
	//<br>
	//</p>
	// pの中の作者にリンクがないケースが有り得るのか不明
	// (設定次第？)
	// 先頭も同じ
	// 結局pの中のリンクで、絶対指定じゃなくて/(\d+\).html/なものを抜いてきて
	// currentとの間のmin,maxで前後を判定するのが妥当
	// pは確実に著者取りで使っているのでcontentsで含まれる領域
	// pの中に本文が埋まっているケースもあるので
	// font size=+2のあと、font size=+1の前で取る
	// タイトル～サブタイトルの間
	//
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

		gSectionManager.registData (gCurrentManager.id, this.parseHtmlCommon (contents, gCurrentManager.id));
		gCurrentManager.setCurrent (gCurrentManager.id);

		// autoPagerが貼り付ける先に独自attrを付ける
		if (false) {
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', gCurrentManager.id);
		}
		return true;
	};

	// gSiteParser内で持つ情報は更新しても
	// globalな情報は呼出し元で更新させる
	HamelnSite.prototype.loadIndex = function () {
		var dfrd = new $.Deferred();
		if (!gNetworkManager.get()) {
			return dfrd.reject().promise();
		}
		$.get (this.getNovelIndexURL()).always(function () {
			gNetworkManager.release();
		}).then(
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
		var dfrd = new $.Deferred();
		this.loadIndex().then(
			function (maxSectionNo) {
				gIndexManager.setIndexPageReady();
				dfrd.resolve (maxSectionNo);
			},
			function () {
				dfrd.reject ();
			}
		);
		return dfrd.promise ();
	};

	// 自動loadIndexさせてもいいのだがどうしよう？
	HamelnSite.prototype.startAsyncProcess = function () {
		// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	};

	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	HamelnSite.prototype.selectNojaIndexData = function () {
		return $(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box');
	};

	HamelnSite.prototype.customizeMenu = function () {
		// 初期化段階でのメニューカスタマイズ
	};

	// Deferred interface
	HamelnSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};

	// 「のじゃー」ラベルを元ページに貼り付け
	HamelnSite.prototype.attachNoja = function () {
		//$('#novelnavi_right').append(getNojaLabel());
	};

	HamelnSite.prototype.replaceImageURL = function (url) {
		return  url;
	};

	// 
	HamelnSite.prototype.getNextSection = function (secId) {
		return ++secId;
	};

	HamelnSite.prototype.getPrevSection = function (secId) {
		return --secId;
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
		page = (page === undefined) ? gCurrentManager.page : page;
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
			} else if (i === 0 || VOICED_SOUND_MARK.indexOf(text[i])<0) {
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
			} else if (i === 0 || VOICED_SOUND_MARK.indexOf(text[i]) < 0) {
				++col;
			}
		}
		return col;
	};


	////////////////////////////////////////////////////////
	var imageLoadHandlerFactory = function (section, page_no) {
		var ctx = {
			section_id: section,
			page_no: page_no,
		};
		return function() {
			// 実際に表示しようとしたload時のhook
			if (gCurrentManager.id == ctx.section_id) {
				if (gCurrentManager.page == ctx.page_no) {
					// canvasエリア描画がトリガー
					showPage();
				} else {
					// jump sliderページの表示がトリガー
					drawThumbPage (ctx.page_no);
				}
			}
		};
	};
	////////////////////////////////////////////////////////
	var createImageDOMElement = function (url, section_id, page_no) {
		return $('<img>')
			.attr('src', url)
			.bind('load', imageLoadHandlerFactory (section_id, page_no))
			.get(0)
		;
	};
	// '<img>'要素を直接データとして置くのでこのオブジェクトになる
	var isImagePage = function (pageData) {
		return (Object.prototype.toString.call(pageData)
			.slice(8, -1) === 'HTMLImageElement');
	};
	////////////////////////////////////////////////////////
	// lastPageが画像のDOM elementの可能性がある
	var isEmptyLastPage = function (arr) {
		var page = arr[arr.length - 1];
		if (isImagePage (page)) {
			return false;
		}
		for (var i = 0; i < page.length; ++i) {
			if (page[i] !== '') {
				return false;
			}
		}
		return true;
	};

	////////////////////////////////////////////////////////
	// @@ TODO @@
	// 禁則の関係で先読みpeekが発生する
	// そこでtag開始や文字参照についての扱いが少しまずい可能性がある
	// 
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
	splitPage = function(text, line_num, char_num, space) {
		if (space === undefined || space === null) {
			space = 4;
		}
		text = text.replace(reAllLineBreak, '');
		var arr = [];
		var ruby = [];
		var pos = 0;
		var line = space;
		var col = 0;
		var len = text.length;
		var pageData = [];
		var rb = [];
		// 先頭padding
		while (space--) {
			pageData.push('');
			rb.push([]);
		}
		var ln = '';
		var r = [];
		var isPrevDeleted = true;

		var newPage = function () {
			line = 0;
			col = 0;
			arr.push(pageData);
			ruby.push(rb);
			pageData = [];
			rb = [];
		};
		var raw_newLine = function() {
			++line;
			col = 0;
			pageData.push (ln);
			rb.push (r);
			ln = '';
			r = [];
		};
		var newLine;
		if (gSetting.kaigyou) {
			newLine = function() {
				if (ln === '') {
					if (isPrevDeleted) {
						isPrevDeleted = false;
						return;
					} else {
						isPrevDeleted = true;
					}
				} else {
					isPrevDeleted = true;
				}
				raw_newLine();
			};
		} else {
			newLine = raw_newLine;
		}
		var skipToTerminator = function (idx, terminator) {
			while (text[idx++] != terminator) {
				//none
			}
			return idx;
		};
		var skipToTagEnd = function (idx) {
			return skipToTerminator(idx, '>');
		};
		var skipToString = function (idx, target) {
			return text.indexOf(target, idx) + target.length;
		};
		var getCol_for_ruby = (gYokogaki)
			? getCol_for_ruby_yokogaki : getCol_for_ruby_tategaki;

		while(true) {
			while(true) {
				var ch  = text[pos];
				var p = pos + 1;
				switch (ch) {
				case '<':
					++pos;
					if (text[pos] == 'b') {
						pos = skipToTagEnd (pos);
						newLine();
					} else if (text[pos] == 'r') {
						// html5で除外された'<rb>'タグに頼るのはあまりよくないが
						// 真面目にするとなると'<rp>'を抜いて…等手間が多いので
						// TODOとしてpending
						p = skipToString (pos, '</ruby>');
						var tt = $(text.substr(pos - 1, p - pos - 1));
						var b = $('rb', tt).text();
						var l = getCol_for_ruby(b);
						if (col + l > char_num) {
							newLine();
						}
						ln += b;
						var t = $('rt', tt).text();
						pos = p;
						r.push([col, l, t]);
						col += l;
					} else if (text[pos] == 'i') {
						p = skipToTagEnd (pos);
						var tt = $(text.slice(pos - 1, p));	// <img>タグ全体
						var srcUrl = $(tt).attr('src');
						if (srcUrl !== null) {
							// 画像は改ページして1ページに表示する
							// 処理開始前に諸々flush等
							newLine();
							newPage();
							srcUrl = gSiteParser.replaceImageURL(srcUrl);
							// parse中のコンテンツのsection
							// 対応済のはずだが未確認
							pageData = createImageDOMElement (
								srcUrl
								, gParseSectionId
								, gCurrentManager.getFirstPageAlinedCanvas(arr.length)
							);
							newPage();
						}
						pos = p;
					} else {
						pos = skipToTagEnd (pos);
					}
					break;
				case '&':
					// tagで作って実体値をchに入れる
					p = skipToTerminator (p, ';');
					ch = $('<span>' + text.substr(pos, p - pos) + '</span>').text();
					/* falls through */
				default:
					if (VOICED_SOUND_MARK.indexOf(ch) >= 0) {
						// @@ TODO @@  ページ切り替えをまたぐとうまくいかない
						// ただし、前ページがimgだった場合など色々考えないといけない。
						var target;
						if (ln === '') {
							if (pageData.length === 0) {
								var target = arr[arr.length - 1];
								target[target.length - 1] += text[pos];
							} else {
								pageData[pageData.length - 1] += text[pos];
							}
						} else {
							ln += text[pos];
						}
						++pos;
						break;
					}
					if (HANKAKU.indexOf(ch) >= 0) {
						// (行頭の半角 or 半角領域先頭 or tag終了直後の半角)
						// かつ、縦中横 かつ、
						// かつ、(文字列末尾or次がタグ開始or半角領域1文字)
						// @@ TODO@@ 次文字が&による参照である場合に問題
						if ((ln === '' || HANKAKU.indexOf (text[pos - 1]) < 0
							|| text[pos - 1] == '>')
							&& TATECHUYOKO.indexOf(ch) >= 0
							&& (p >= text.length || text[p] == '<'
								|| HANKAKU.indexOf(text[p]) < 0)) {
							++col;
						} else {
							// 縦中横にならない場合は半角=0.5カラム
							col += 0.5;
						}
					} else {
						++col;
					}
					// @@TODO@@ 次文字lookupでtag,&の関連がまずい可能性がある
					var _pos = pos;	// 現文字
					pos = p;	// 次文字
					if (col >= char_num - 1
						&& GYOUMATSUKINSOKU.indexOf(text[pos]) >= 0) {
						// 次文字が行末禁則なら現文字が0.5カラム文字だろうと
						// 改行させる
						ln += ch;
						newLine();
					} else if (col >= char_num - 0.5) {
						// 行末:次がtagでない限り改行するが、
						// 禁則関連で処理が変わる
						if (BURASAGE.indexOf(text[pos]) >= 0) {
							// 次文字がぶら下げ文字なら現在行に入れてしまう
							ln += ch + text[pos];
							++pos;
						} else if (GYOUTOUKINSOKU.indexOf(text[pos]) >= 0) {
							// 次文字が行頭禁則なら
							// 現在の文字を一度捨てて改行させる
							// (現在の文字を次行に送り込み)
							pos = _pos;
						} else {
							ln += ch;
						}
						if (text[pos] !== '<') {
							newLine();
						}
					} else {
						ln += ch;
					}
					break;
				}
				// 1文字分の処理終わり
				// 改ページ判定
				if (pos >= len) {	// text end
					newLine();
					break;
				}
				if (pos >= len || line >= line_num) {
					break;
				}
			}
			// 1ページ分の処理終わり
			// 改ページ
			newPage();
			if (pos >= len) {
				break;
			}
		}
		// 最終ページが空ページだった場合に除去
		if (isEmptyLastPage(arr)) {
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
	// 本文がnullの可能性はないとしておく
	splitContentsBody = function (secData, secId) {
		console.debug('split contents body: secId', secId);
		console.debug('lc', gLinesPerCanvas, gCharsPerLine);
		if (secId !== undefined) {
			gParseSectionId = secId;	// splitPageでimg関連で必要になる
		}
		secData.honbun  =   splitPage(secData._honbun,  gLinesPerCanvas, gCharsPerLine);
		secData.maegaki = splitPageEx(secData._maegaki, gLinesPerCanvas, gCharsPerLine, 2);
		secData.atogaki = splitPageEx(secData._atogaki, gLinesPerCanvas, gCharsPerLine, 2);
		return secData;
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



	////////////////////////////////////////////////////////



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
	// canvasにtagでsection idとpage noを埋め込んだ方がいいのかもしれず
	$.templates('updateNaviIndexTmpl', '<div>{{:page}}ページ</div>');
	// canvasもtemplate化したほうがいいが、html側にもっていくべき

	var navigationClickHandlerFactory = function (secId, pageNo) {
		// bindのfunction objectで使うためのコンテキスト
		var jumpInfo = {secId: secId, pageNo: pageNo};
		return function() {
			jumpTo (jumpInfo.secId, jumpInfo.pageNo);
		};
	};

	// この関数自体は
	// ・レイアウト切り替え(gSettingsの変化)
	// ・フォントサイズ等viewパラメータの変化
	// ・セクション移動
	// に付随して呼ばれるべきもの
	updateNavigation = function() {
		var navi = navigationFrame.$div();
		navi.empty();
		var canvas_attr = {
			width: gThumbSize.width + 'px',
			height: gThumbSize.height + 'px',
		};
		// @@ 一応単ページ対応
		var secId = gCurrentManager.id;
		for (var pageNo = 0;
			pageNo < gCurrentManager.totalPages;
			pageNo += gCurrentManager.pagesPerCanvas) {
			canvas_attr.id = get_thumb_id(pageNo, '');
			navi.append($.render.updateNaviIndexTmpl({page: (pageNo + 1)}))
				.append(
					$('<canvas/>')
					.attr(canvas_attr)
					.css('border-color', gSiteParser.color)
					.bind('click', 
						navigationClickHandlerFactory (secId, pageNo)
					)
				);
			drawThumbPage (pageNo);
		}
		showNavigationCursor ();
	};


	////////////////////////////////////////////////////////
	var isNetworkBusy = function (msg) {
		var status = gNetworkManage.isBusy();
		if (status && msg) {
			statusFrame.showMessage ('川・◊・)ねっとわーく接続中なのじゃー。' + msg);
		}
		return status;
	};


	////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////
	//各話の各ページにジャンプする関数。toPageに負の値を渡すと最後尾ページにジャンプ。

	//関数に直接くっつけたので不要
	//読み込み中にセットされるページとセクション番号。
	//読み込み前に保存した数が終了後と同じだったらそのまま新しく読み込んだ話にジャンプ
	//そうでなかったらユーザーの操作で移動したことになるため、ジャンプしない
	var gLoadSectionInfo = {
		pageNo: 0,
		sectionId: 0,
		set: function (sectionId, pageNo) {
			this.sectionId = sectionId;
			this.pageNo = pageNo;
		},
		equals: function (secionId, pageNo) {
			return (this.sectionId == section.id) && (this.pageNo == pageNo);
		},
	};

	var gLoadSectionManager = {
		ERROR_FIRST_SECTION: -1,
		ERROR_LAST_SECTION:  -2,
		ERROR_REQUESTED_SECTION:  -3,	// 読み込み中
		ERROR_NETWORK_FAILED: -4,		//
		interval: 100,
		// ・存在が確認済の場合:無条件にload
		// ・最大話数が取得されていないなら取得しチェックしてからload
		// ・取得途中なら待ち
		isSectionLoadable: function (section) {
			var dfrd = new $.Deferred();
			if (gSiteParser.canJumpToSection(section)) {
				// 読み込まれていないが現在の最大セクションよりも小さいセクションを
				// 要求した場合は確実に存在するのでロードすればよい
				return dfrd.resolve(section).promise();
			} else if (gGeneralAllNo === null) {
				console.debug('load max section no');
				//話数カウントされていない場合
				//読み込み中をマーク
				gGeneralAllNo = false;
				statusFrame.showLoading ();
				gSiteParser.loadMaxSectionNo().then(
					// 成功
					function (maxSectionNo) {
						//話数を設定
						gGeneralAllNo = maxSectionNo;
						gSiteParser.updateMaxSection(gGeneralAllNo, true);
						if (section <= gGeneralAllNo) {
							// 存在が確認できたのでload Ok
							dfrd.resolve(section);
						} else {
							dfrd.reject(this.ERROR_LAST_SECTION);
						}
					},
					// 失敗
					function (maxSectionNo) {
						gGeneralAllNo = null;
						dfrd.reject(this.ERROR_NETWORK_FAILED);
					}
				);
			} else if (gGeneralAllNo === false) {
				// 他reqによる取得中でまだ完了してないなら
				var wait_for_section_info = function() {
					if (gGeneralAllNo === false) {
						// まだ終わってないなら待ち
						setTimeout (wait_for_section_info, this.interval);
					} else if (gGeneralAllNo === null) {
						// 他req完了したが、最大セクション数不明(getがエラー)
						dfrd.reject(this.ERROR_NETWORK_FAILED);
					} else {
						if(section > gGeneralAllNo) {
							// ジャンプ先セクションが最大を超える場合はエラー
							dfrd.reject(this.ERROR_LAST_SECTION);
						} else {
							// 情報取得しおわり、セクション指定も範囲内と確認できたので
							// 実体のコンテンツ取得を呼ぶ
							dfrd.resolve(section);
						}
					}
				};
				setTimeout (wait_for_section_info, this.interval);
			}
			return dfrd.promise();
		},
		// secNoのセクションがSectionManagerのDBにあるかどうかは関係なく
		// 指定されたsecNoのものを読んでくる
		// rawなI/Fとして常に指定secNoのものを読むモード
		// 呼出し側で既存チェックし再利用するか強制ロードするかを決める
		load: function(secNo, force) {
			if (force === undefined) {
				force = false;
			}
			var dfrd = $.Deferred();
			// 再読み込みではなくDB上にある
			if (!force && gSectionManager.isSectionReady(secNo)) {
				return dfrd.resolve(secNo, false).promise();
			}
			// 下限エラー
			if (!gSiteParser.isSectionInLowerBound(secNo)) {
				return dfrd.reject(this.ERROR_FIRST_SECTION).promise();
			}
			// 上限エラー
			if (gGeneralAllNo && secNo > gGeneralAllNo) {
				return dfrd.reject(this.ERROR_LAST_SECTION).promise();
			}
			// 既に読み込み中ならエラー
			if (gSectionManager.isSectionLoading(secNo)) {
				return dfrd.reject(this.ERROR_REQUESTED_SECTION).promise();
			}
			// まだ読み込まれていない場合は
			// まずmax情報を確認する
			// 読み込み中はtrueをマークする
			gSectionManager.setStatusLoading(secNo);
			this.isSectionLoadable(secNo).then(function () {
				dfrd.notify(secNo);		// progress通知
				// 指定secNoを読み込む
				gSiteParser.getNovelSection (secNo).then (
					function (data) {
						//console.debug('load success', data);
						// 成功した場合はデータを登録
						// この場合、読み込み前にLoadingにしてあるので
						// forceにしないとまずい？
						// そこは直したが、
						// gSectionManager.setStatusInvalid(secNo);
						var secData = gSectionManager.registData (secNo
							, gSiteParser.parseHtmlContents(data, secNo), true);
						autoPagerize(secData, secNo);
						gSiteParser.updateMaxSection(secNo);
						// 新しいsecNoを登録したので自動saveするならsaveが動く
						if (gSetting.autoSave) {
							nojaSave(false);
						}
						dfrd.resolve(secNo, true);
					},
					function () {
						return $.Deferred().reject(this.ERROR_NETWORK_FAILED).promise();
					}
				);
			}).fail(function() {
				// loadableチェック失敗 or loadそのものが失敗
				//失敗時はfalseをマークする。
				gSectionManager.setStatusInvalid(secNo);
				dfrd.reject(err);
			});
			return dfrd.promise();
		},
	};




	jumpTo = function(section, toPage) {
		//isChangeSection===trueなら話移動が必要
		var force = false;
		var isChangeSection = (section != gCurrentManager.id);
		//sectionに負の値を渡すと現在の話を強制再読み込み。
		if (gSiteParser.isReloadSection(section)) {
			section = gCurrentManager.id;
			isChangeSection = true;
			force = true;
		}
		//開始
		console.debug('jumpTo:', section, force);
		gLoadSectionManager.load (section, force).then(
			function (loadSecNo, isLoaded) {
				console.debug('load success', loadSecNo, isLoaded);
				// 実際にロードせずにdbにあった場合は!isLoaded
				if (isLoaded) {
					// 実際にロードした場合はステータスバーに成功を通知
					statusFrame.showMessage('(｀・ω・´)成功!!');
				}
				// ロードが終わった段階で
				// 他の操作で別ページが表示されたりしていない場合
				if (!force && !jumpTo.waiting) {
					// 読み込み中に別ページに移動して
					// それが正常に完了した状態なのでジャンプそのものは行わない
					return $.Deferred().reject().promise();
				}
				// forceの時はpending中に他のjumpが完了したかどうか判断できない
				// というかequalで見る必要はないのかも？
			},
			function (err) {
				console.debug('load failed', err);
				switch (err) {
				case gLoadSectionManager.ERROR_FIRST_SECTION:
					statusFrame.showMessage('(´・ω・｀)ここが最初の話だよ');
					break;
				case gLoadSectionManager.ERROR_LAST_SECTION:
					console.debug("gGeneralAllNo, section", gGeneralAllNo, section);
					statusFrame.showMessage('川・◊・)いま投稿されているのはここまでなのじゃー。感想を書いてあげるといいのじゃー。');
					if (gSiteParser.enableReputationForm) {
						$('#noja_hyouka').show();
					}
					break;
				case gLoadSectionManager.ERROR_REQUESTED_SECTION:
					//読み込み中ならサイレント
					break;
				case gLoadSectionManager.ERROR_NETWORK_FAILED:
					statusFrame.showMessage ('失敗(´・ω・｀)……');
					break;
				}
			},
			function () {	// 実際のロード開始直前に呼ばれるprogress
				console.debug('load started async');
				jumpTo.waiting = true;
			}
		).then(function () {
			console.debug('and then');
			// 文章領域のページ数を計算する
			var nPages = gSectionManager.countPages(gSectionManager.getData(section), gSetting);
			// 負のページ数指定はendからのページ位置に変換
			if (toPage < 0) {
				toPage += nPages;
			}
			// @@ 単ページモード対応済
			toPage = gCurrentManager.getFirstPageAlinedCanvas(toPage);	// 偶数ページ化(右ページ)

			// 次話強制ではない場合、
			// 同ページのまま or toPageの計算が範囲外なら処理終了
			if (!isChangeSection
				&& (toPage == gCurrentManager.page || !(toPage >= 0 && toPage < nPages))) {
				return;
			}
			jumpTo.pending = false;

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
			gCurrentManager.page = toPage;
			showNavigationCursor();
			//
			if (isChangeSection) {
				// 話の移動だった場合は情報更新
				gCurrentManager.setCurrent (section);
				gSiteParser.changeSection (section);
				gCurrentManager.updateTotalPages(gSetting);
				updateNavigation();
			}
			showPage();
		});
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
					} else if (VOICED_SOUND_MARK.indexOf (ch) >= 0) {
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
					} else if (VOICED_SOUND_MARK.indexOf(ch) >= 0) {
						// 前の文字に合成するような形にする濁点半濁点
						ctx.translate(fontSize * 0.75, -fontSize);
					} else if (TOWIDEWIDTHSYMBOLS.indexOf(ch) >= 0) {
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


		// 全話つなげるならgCurrentManager.id手前までのページ数を計算
		var page_base = (gAllpage)
			? gSectionManager.countSectionPages (1, gCurrentManager.id, gSetting)
			: 0;
		var pageMap = gCurrentManager.getPageMap(gSetting);

		///////////////////////////////////////
		// 左右ページの描画
		var page_size = {
			width: (drawSize.width / gCurrentManager.pagesPerCanvas),
			height: drawSize.height,
		};
		//console.debug("drawSize", drawSize);
		//console.debug("page_size", page_size);
		var end_page = Math.min(pageIndex + gCurrentManager.pagesPerCanvas, pageMap.size);
		for (var currentDrawPage = pageIndex;
			currentDrawPage < end_page;
			++currentDrawPage) {
			// pageIndexはもともとintだから型変換比較でいいはず
			var is_first_page = (currentDrawPage == pageIndex);
			//console.debug("is_first_page", is_first_page);
			//console.debug("page_size", page_size);
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
			//console.debug("offsetOfPage_x", offsetOfPage_x);
			var offsetOfPageRight_x = (offsetOfPage_x + page_size.width);
			//console.debug("offsetOfPageRight_x", offsetOfPageRight_x);

			// 左右ページで違うマージン補正用
			// 
			var offsetOfPageWithAlign_x = offsetOfPage_x;
			if (gYokogaki) {
				offsetOfPageWithAlign_x += ((is_first_page) ? 0 : -(bodyFontSize * 2));
			}
			//console.debug("offsetOfPageWithAlign_x", offsetOfPageWithAlign_x);
			var is_left_page = (gYokogaki) ? is_first_page : !is_first_page;
			var is_right_page = !is_left_page;
			//console.debug("left, right", is_left_page, is_right_page);

			var displayPageNo = page_base + currentDrawPage + 1;
			//console.debug("display page no", displayPageNo);

			var titleInfo = gCurrentManager.getTitle ();

			// サブタイトル表示
			if (pageMap.isMainTextFirstPage (currentDrawPage)) {
				var subtitleFontSize = bodyFontSize * 1.4;
				ctx.save();
				ctx.font = get_canvas_font (subtitleFontSize);
				var text = titleInfo.subtitle;
				// @@ TODO@@ この判定はgSiteParser.isShortStory()等のほうが良い
				if (gIndexManager.isIndexPageDisable()) {
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

			var pageText = pageMap.getPageText (currentDrawPage);

			// 前書き・後書き:囲いbox部分のみ先行描画
			// 本文の字下げ(横だと左ページ基準での字下げ数)
			var bodyIndent = 3;
			if (!pageMap.isMainTextPage (currentDrawPage)) {
				if (gLayout) {
					draw_layout_box (ctx, is_first_page, page_size.width);
					++bodyIndent;	// 追加1字下げ
				}
			}

			// 選んだ領域の該当ページにimgがあった場合の処理
			// ノンブル等もなしでベタの1page画像
			if (isImagePage (pageText.bodyLines)) {
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
				var text1 = titleInfo.chapter_title;
				var text2 = titleInfo.subtitle;
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
					drawRubyLine (pageText.rubyLines[i], rubyoffset
						, bodyFontSize, rubyFontSize);
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
					drawRubyLine (pageText.rubyLines[i], rubyoffset
						, bodyFontSize, rubyFontSize);
				}
			}
		}
	};
	////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////
	showPage = function() {
		console.debug('showPage', gCurrentManager.page);
		drawPage(gMainContext, gCharFontSize, gMainSize, gCurrentManager.page);
		drawThumbPage(gCurrentManager.page);
	};

	///////////////////////////////////////////
	// 目次読み込み
	// silentモード対応にして
	// Hameln等のmaxSectioNo関連はこっちを使うようにしたいところ
	//
	$.templates('loadIndexTmpl'
		, '目次の読み込み中...<br /><img src="{{:image}}" />');

	loadIndex = function() {
		if (gIndexManager.isIndexPageNowLoading()) {
			return;
		}
		indexFrame.setLoadMessage($.render.loadIndexTmpl({image: ICON_LOADING2}));
		gIndexManager.load().then(
			function (maxSectionNo) {
				gGeneralAllNo = maxSectionNo;
				gSiteParser.updateMaxSection(gGeneralAllNo, true);
			},
			function (error_code) {
				indexFrame.setLoadMessage('目次の読み込みに失敗しました');
			}
		);
	};
	////////////////////////////////////////////////////////


	// @@ 単ページ対応済 @@
	// @@ id化対応済 @@
	loadNext = function() {
		var new_page = gCurrentManager.getNextPage();
		var new_section = gCurrentManager.id;
		if (new_page === null) {
			new_page = FIRST_PAGE_NO;
			new_section = gSiteParser.getNextSection (new_section);
		}
		jumpTo (new_section, new_page);
	};
	loadPrev = function() {
		var new_page = gCurrentManager.getPrevPage();
		var new_section = gCurrentManager.id;
		if (new_page === null) {
			new_page = LAST_PAGE_NO;	// last page
			new_section = gSiteParser.getPrevSection (new_section);
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
					var dpc = (gMainSize.width / gCurrentManager.pagesPerCanvas)
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
					var page_width = (gMainSize.width / gCurrentManager.pagesPerCanvas);
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
			charFontSize = (gMainSize.width / gCurrentManager.pagesPerCanvas)
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
			// この場合gSectionManager.reMakeとcurrent更新はペアじゃないといけない
			console.debug("remake pages calling");
			// gSectionManager.reMake()は後処理の段取りが別途必要なので要改善
			gSectionManager.reMake();
			gCurrentManager.setCurrent (gCurrentManager.id);
			gCurrentManager.updateTotalPages(gSetting);
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
	// saveは新形式
	// loadは旧形式対応とする
	// 判定:
	//   site,ncodeが2要素配列
	//   tanpenにbool設定値があること
	//  というオリジナルの判定を継承する
	// 新形式を旧のじゃーで読むことはないとする
	// (データ部は互換性を確保:AozoraEpub3で共通extract.txtを使えるように)
	// どれが必要でどれが必要でないのかは微妙なことろなので
	// 最低限parserが切り替えられないといけないので
	// コンテンツのベースURLになるものは必要
	// データ部にない
	//   ・author: headerにいるか新たにデータ部にfieldを作るか？
	//   ・title : title要素から取るようだ
	// なろうの場合、ncodeはURLから取れるが
	// ncode2はどこかコンテンツページを取らないと分からない
	// bookmark関連等、importしたもので操作ができないほうが安全なのかもしれない
	// import=読み専ならbaseURLがあるならncode,ncode2もいらない
	// site,ncodeはbaseURLで代替してしまう
	// restoreの場合はベースになるページを開いて起動されているはずなので
	// site情報等は不要？登録コンテンツから別作品へ移動restoreだとまずい？
	// 削除作品等の場合もあるので、
	// restoreの場合は裏も切り替えてみて、作品があるようならlive view
	// 削除されている場合はimport扱いのread-onlyとすべきかな？
	//
	//<!--
	//@noja{7B87A1A7-2920-4281-A6D9-08556503D3E5}
	//{
	//"version":"1.13.826.2",
	//"site":["http://naroufav.wkeya.com/noja/","http://naroufav.wkeya.com/noja/"],
	//"ncode":["noja100","000100"],
	//"general_all_no":1,
	//"auther":"◆TkfnIljons",
	//"tanpen":true
	//}
	//-->
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
		$.each({site: 2, ncode: 2, tanpen:null }, function(name, length) {
			if (!(name in json) || (length !== null && json[name].length != length)) {
				isValidNojaHeader = false;
				return false;	// break each loop
			}
		});
		return (isValidNojaHeader)
			? createImportedInfoFromJSON (json) : false;
	};






	// setting省略時:gSetting
	// with_layout省略時: true
	// ([setting = gSetting], [with_layout = true])
	// settingのみ省略も可能
	var updateSettingMenuCheckbox = function (setting, with_layout) {
		if (setting === true || setting === false) {
			with_layout = setting;
			setting = gSetting;
		} else if (setting === undefined) {
			setting = gSetting;
		}
		with_layout = (with_layout === undefined) ? true : with_layout;
		if (with_layout) {
			// 名前がmaegaki,atogakiについてはfなし
			$('#noja_maegaki').prop('checked', setting.fMaegaki);
			$('#noja_atogaki').prop('checked', setting.fAtogaki);
			$('#noja_kaigyou').prop('checked', setting.kaigyou);
		}
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
	// import/save/load(restore)関連

	// 例外のときの処理はこれだったが不要か？
	// statusFrame.showMessage('(´・ω・｀)読み込みエラーが発生したよ。');
	// dfrd.reject();


	nojaImport = function (htmldoc) {
		var dfrd = new $.Deferred();
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
		downloadFileManager.parseColorTheme (imported_infos, downloadFileMain);
		var min_max_sec_no = downloadFileManager.toDataAll (
			imported_sections, downloadFileMain.children('div')
			, 'noja_download_', function (secId, secData) {
				// importするだけでsplitするのは凶悪
				secData = splitContentsBody (secData, secId);
				return true;
		});


		imported_infos.currentSection = min_max_sec_no.min;

		fncLoad ('ncode', imported_infos.ncode)
		.then(
			function (data) {
				// ncodeに対応する設定をloadした後の処理
				gSetting = data;
			},
			function() {
				// 設定がなかったらデフォルトで作って新規保存
				gSetting = createSettingNew (imported_infos.ncode);
				fncSave_ncode (gSetting);
				return $.Deferred().resolve().promise();
			}
		)
		.then(function() {
			// currentの設定を更新
			validateSetting();
		}).then(function() {
			// imported_sectionsにデータ形式で全セクション構築
			downloadFileManager.toDataAll (imported_sections
				, downloadFileMain.children('div')
				, 'noja_download_', function (secId, secData) {
				// importするだけでsplitするのは凶悪
				secData = splitContentsBody (secData, secId);
				return true;
			});
			if (imported_infos.ncode !== gSiteParser.ncode) {
				// importしたものが別のコンテンツなら
				gSectionManager.replaceDataBase (imported_sections);
				downloadFileManager.replaceAll (downloadFileMain);
				gGeneralAllNo = imported_infos.generalAllNo;
				gCurrentManager.id = imported_infos.currentSection;
				gCurrentManager.page = 0;
			} else {
				// 同一ncodeなら部分的な更新
				downloadFileManager.margeSections (imported_section
					, function (secId, secData) {
					gSectionManager.registData(secId, secData);
				});
				downloadFileManager.setColorTheme (imported_infos);
				if (imported_infos.generalAllNo && gGeneralAllNo) {
					gGeneralAllNo = Math.max(gGeneralAllNo, imported_infos.generalAllNo);
				}
			}
			reCreateSiteParser (imported_infos);
			//
			gIndexManager.setIndexPageStatus (imported_infos.indexPageStatus);
			$('title').text(gSiteParser.title);
			// @@ table側は登録済なのでカレントを設定するだけでいいはず
			gCurrentManager.setCurrent (gCurrentManager.id);
			if (gGeneralAllNo) {
				gSiteParser.updateMaxSection(gGeneralAllNo, true);
			} else {
				gGeneralAllNo = null;
				gSiteParser.updateMaxSection(gSectionManager.length(), true);
			}
			gSiteParser.rebuild_forms ();
			updateSettingMenuCheckbox();
			$('#noja').css({
				color: gSiteParser.color,
				backgroundColor: gSiteParser.bgColor,
				backgroundImage: gSiteParser.bgImage
					? 'url(' + gSiteParser.bgImage.src + ')':'none'
			});
			downloadFileManager.resetColorTheme ();
			dfrd.resolve ();
		});
		return dfrd.promise();
	};
	/////////////////////


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
		var dfrd = new $.Deferred ();
		var data = buildSaveDataSiteInfo();
		fncLoad ('saveData', gSiteParser.ncode).then(
			function(readData) {
				data = readData();
			},
			function() {
				// 失敗時はデフォルトデータを使って成功状態で継続処理
				return new $.Deferred().resolve().promise();
			}
		).then(	// 直前のthenで同期化した後の新promiseなのでalways()でいいのかも
			function () {
				gSectionManager.createSaveData (data);
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


	// BookListItem = {
	//  title: gSiteParser.title,
	//  auther: gSiteParser.author,
	//  savetime: parseInt((new Date()) / 1000),
	// }
	// デフォルト指定があった時は成功扱い
	var loadGlobalBookList = function (default_data) {
		var dfrd = new $.Deferred ();
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
	var saveGlobalBookList = function (data, register_id, register_data) {
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
		var dfrd = new $.Deferred ();
		data[register_id] = register_data;
		fncSave_global ('bookList', data);
		dfrd.resolve ();
		return dfrd.promise ();
	};

	var deleteGlobalBookList = function (data_id) {
		var dfrd = new $.Deferred ();
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
		var dfrd = new $.Deferred ();
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

	var buildSettings = function (new_ncode) {
		var dfrd = new $.Deferred();
		if (new_ncode != gSiteParser.ncode) {
			var new_setting = gSetting;
			gSectionManager.clear();
			fncLoad ('ncode', new_ncode).then(
				function(data) {
					new_setting = data;
				},
				function () {
					new_setting = createSettingNew (new_ncode);
					return new $.Deferred().resolve().promise();
				}
			).always ( function () {
				validateSetting(new_setting);
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
		updateSettingMenuCheckbox ();
	};


	var restoreBookData = function (new_ncode, data) {
		// download_file等のrestore
		if (gSiteParser.ncode != new_ncode) {
			$('#noja_download_file_main').empty();
		}
		gSectionManager.restore (data.sections, function (secId, secData) {
			// thisが変わってしまうのでまずいかも？
			autoPagerize (secData, secId);
			return true;
		} /* , WITHOUT_OVERWRITE */);
		if (data.tanpen) {
			gIndexManager.setIndexPageDisabled ();
		} else if (data.index
			&& (!gIndexManager.isIndexPageReady() || gSiteParser.ncode != new_ncode)) {
			// 連載でindex pageがある場合
			gIndexManager.setIndexPageReady();
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
				gIndexManager.setIndexPageDisabled ();
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
				gSiteParser.updateMaxSection(gSectionManager.length(), true);
			}
			gSiteParser.ncode = data.ncode;
			var first_avail_section = gSectionManager.minId();
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
		var dfrd = new $.Deferred();
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
					var sec_no = (first_avail_section === gCurrentManager.id)
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
	var getColorStyleTagText = function () {
		var s = 'color: ' + gSiteParser.color + ';'
			+ 'background-color: ' + gSiteParser.bgColor + ';'
			;
		if (gSiteParser.bgImage) {
			s += 'background-image: url(' + gSiteParser.bgImage.src + ');';
		}
		return s;
	};
	/////////////////////
	// @@ TODO @@ template化
	// site固有情報とgenericな情報をどう分けるか？
	var createDownloadData = function (min, max) {
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
		buffer += '"tanpen":' + (gIndexManager.isIndexPageDisable()) + '\n'
			+ '}\n'
			+ '-->\n'
			;

		buffer += '<head>\n'
			+ '<title>'
			+ $('<div>').text(gSiteParser.title).html()
			+ '</title>\n'
			+ '<meta charset="utf-8" />\n'
			+ '</head>\n'
			;

		buffer += '<body>\n'
			+ '<div>\n'
			+ '<div id="noja_download_file_main"'
			+ ' style="' + getColorStyleTagText() + '">\n';

		gSectionManager.rangedEach (min, max, function (secId, secData) {
			buffer += gSectionManager.toHtmlDiv (secId, secData, 'noja_download_');
		});
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


	// @@ TODO @@ 互換性のためtypoをそのまま残すか？
	var createBookListHtml = function (bookListContainer) {
		var items = [];
		$.each(bookListContainer, function (key, value) {
			items.push({
				id: key,
				title: value.title,
				auther: value.auther,
				savetime: value.savetime,
			});
		});
		// 時間でソート
		items.sort(function(a, b) {
			if (a.savetime > b.savetime) {
				return -1;
			} else if (a.savetime < b.savetime) {
				return 1;
			}
			return 0;
		});
		var list = '';
		$.each(items, function (index, item) {
			list += '<div id="noja_book_container_'+item.id + '">'
				+ '<a id="noja_book_delete_' + item.id + '"'
				+ ' class="noja_book_delete">削除</a>'
				+ ' <a id="noja_book_' + items.id + '"'
				+ ' class="noja_book">'
				+ items.title
				+ '</a>'
				+ '　作者：' + item.auther
				+'</div>';
		});
		return list;
	};

	// booklist = [booklistItem,...]
	// 配列のindexはnovel_id
	var buildAndShowBookList = function () {
		var list = '';
		fncLoad ('global', 'bookList').then(
			function (data) {
				list = createBookListHtml (data);
			},
			function () {
				list = '保存した小説はありません。';
			}
		).then(
			function () {
				var blv = $('#noja_booklist_view');
				blv.html(
					'<div class="noja_close_popup">'
					+ '<a id="noja_closebv">[閉じる]</a>'
					+ '</div>'
					+ '<div>' + list + '</div>'
				);
				// タイトル選択した場合のハンドラを登録
				blv.find('a.noja_book').bind('click', function() {
					var item_id = $(this).attr('id')
						.match(/noja_book_(.*)/)[1];
					nojaRestore(item_id);
					popupMenu.close(); 
				});
				// タイトル削除のハンドラを登録
				blv.find('a.noja_book_delete').bind('click', function() {
					var item_id = $(this).attr('id')
						.match(/noja_book_delete_(.*)/)[1];
					nojaDelete(item_id);
					$('#noja_book_container_' + item_id).remove();
					console.log($('#noja_book_container_' + item_id));
				});
				$('#noja_closebv').bind('click', function() {
					blv.hide();
				});
				$('#noja_saveload').hide();
				blv.show();
			}
		);
	};

	var sleepTimer = function (duration) {
		var dfrd = new $.Deferred();
		setTimeout(function () {dfrd.resolve();}, duration);
		return dfrd.promise();
	};

	var waitForNetworkReady = function (duration, retry_count) {
		var retry = 0;
		var dfrd = new $.Deferred();
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
		var dfrd = new $.Deferred();
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
		var dfrd = new $.Deferred();
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
								return new $.Deferred.resolve().promise();
							}
						}).then(null, function () {
							// import fail
							// format mismatchでエラーが出ることはあるが無視
							if (!errorHandler('import')) {
								dfrd.reject();
							} else {
								// resume then
								return new $.Deferred.resolve().promise();
							}
						}).then(loop);
					}
				}
			}
		})();
		return dfrd.promise();
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
					var sec_no = gSectionManager.minId();
					// たまたま同一sectionにいたのなら強制リロード
					if (sec_no == gCurrentManager.id) {
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
		////////////////////////////////////////////
		// initializeのstage1
		// グローバル設定の読み込み完了後にここにくる
		var initialize_stage1 = function() {
			// 少しだけuiがらみの設定をする
			// ページ末尾にのじゃー作業用の領域を確保
			$('body').append(fncLsc (NOJA_VIEW_HTML));
			// 「のじゃー」ラベルを元ページに貼り付け
			gSiteParser.attachNoja();
			// のじゃー作業用領域のフォントサイズ指定？
			rootFrame.$().css('font-size', FONTSMALL);

			// これがないと計算ができないので位置を移動
			updateMainSize ();
			console.debug ("gMainSize", gMainSize);
			// 計算して出す変数の設定処理
			updateLC(slidePos2ZoomRatio (gSlidePos), true);
			console.debug ("gCharsPerLine, gLinesPerCanvas"
				, gCharsPerLine, gLinesPerCanvas);

			// 基本情報を設定して次ステージへ
			var dfrd;
			if (noja_option.appmode) {
				// アプリモードだと元ページは解析不要
				// tokenを取り出すだけ
				dfrd = noja_option.getToken().then(
					function(token) {
						gSiteParser.token = token;
						gSiteParser.login = (gSiteParser.token !== '');
					},
					function () {
						// 読まなかったときのことは考えないない
					}
				);
			} else {
				// ncodeをキーとして個別設定を取り出しstage2へ
				dfrd = fncLoad ('ncode', gSiteParser.ncode).then(
					function (setting) {
						// ncodeをキーとして読み出した設定をストア
						gSetting = setting;
					},
					function () {
						// 個別設定がないならデフォルトを作って設定
						setSetting(createSettingNew(gSiteParser.ncode));
						// resolveに状態を変えて継続
						return new $.Deferred().resolve().promise();
					}
				).then(
					function () {
						// menu側のcheckに状態を反映させる
						$('#noja_maegaki').prop('checked', gSetting.fMaegaki);
						$('#noja_atogaki').prop('checked', gSetting.fAtogaki);
						$('#noja_kaigyou').prop('checked', gSetting.kaigyou);
					}
				).then(
					function () {
						// 元ページ解析
						if (!gSiteParser.parseInitialPage ()) {
							// 解析失敗した場合はindex page等のじゃーが表示できない画面
							console.debug ('not supported page');
							// rejectに状態を変えて継続
							return new $.Deferred().reject().promise();
						}
					}
				);
			}
			dfrd.then (
				// 成功のときは次ステージへ
				initialize_stage3,
				function () {
					// 失敗のときは次ステージに行かずに終了
				}
			);
		};

		///////////////////////////////////////////////
		///////////////////////////////////////////////
		// メニュー関連の設定やイベントハンドラ等UIがらみの設定が中心
		// 設定したりないメニュー関連等を設定する
		var initialize_stage3 = function() {
			console.debug ('initialize stage3');
			validateSetting ();
			gLoadSectionInfo.set (gCurrentManager.id, 0);
			gSiteParser.updateMaxSection (gCurrentManager.id, true);
			updateSettingMenuCheckbox (false);

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
				} else if (!gIndexManager.isIndexPageDisable() && e.clientX < 10) {
					// 目次slide slider
					if (gIndexManager.isIndexPageNotReady()) {
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
						&& gCurrentManager.id === gGeneralAllNo
						&& gCUrrentManager.isLastPage ()
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
			// 前書き後書きのモード変更
			var MaegakiAtogakiModeController = (function () {
				var statefMaegakifAtogaki = null;
				return {
					toggle: function () {
						if (gSetting.fMaegaki && gSetting.fAtogaki) {
							gSetting.fMaegaki = false;
							gSetting.fAtogaki = false;
						} else if (statefMaegakifAtogaki) {
							gSetting.fMaegaki = statefMaegakifAtogaki.fMaegaki;
							gSetting.fAtogaki = statefMaegakifAtogaki.fAtogaki;
							statefMaegakifAtogaki = null;
						} else {
							if (gSetting.fMaegaki !== gSetting.fAtogaki) {
								statefMaegakifAtogaki = {
									fMaegaki: gSetting.fMaegaki,
									fAtogaki: gSetting.fAtogaki
								};
								gSetting.fMaegaki = true;
								gSetting.fAtogaki = true;
							}
						}
						// 前書き後書き表示を変更したのでreload
						jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
						fncSave_ncode (gSetting);
						statusFrame.showMessage('前書き表示：'
							+ (gSetting.fMaegaki ? 'ON' : 'OFF')
							+'　後書き表示：'+(gSetting.fAtogaki ? 'ON' : 'OFF'));
					},
					changeMaegaki: function (value) {
						statefMaegakifAtogaki = null;
						setSettingFMaegaki (value);
						if (gCurrentManager.hasMaegaki()) {
							var pageMap = gCurrentManager.getPageMap(gSetting);
							if (gSetting.fMaegaki) {
								// disable->enableなのでページ位置が前書き分増える
								jumpTo (CURRENT_SECTION_NO_WITH_RELOAD
									, gCurrentManager.page + pageMap.maegaki.size);
							} else {
								// enable->disableなのでページ位置が前書き分減る
								// 前書き内にいた場合は0とのmaxで0になり先頭へ
								jumpTo (CURRENT_SECTION_NO_WITH_RELOAD
									, Math.max(FIRST_PAGE_NO
									, gCurrentManager.page - pageMap.maegaki.size)
								);
							}
						}
					},
					changeAtogaki: function (value) {
						statefMaegakifAtogaki = null;
						setSettingFAtogaki (value);
						// 後書きがあるセクションでのみview変化がある
						if (gCurrentManager.hasAtogaki()) {
							var pageNo = gCurrentManager.page;
							var pageMap = gCurrentManager.getPageMap(gSetting);
							// 後書きON->OFFの場合は後書き部にいた場合は補正がいる
							// OFF->ONの場合は影響がない
							if (!gSetting.fAtogaki) {
								if (pageNo >= pageMap.end) {
									pageNo = pageMap.end - 1;
								}
							}
							jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, pageNo);
						}
					},
				};
			})();



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
					jumpTo (gSiteParser.getPrevSection(gCurrentManager.id)
						, FIRST_PAGE_NO);
					break;
				case VK_DOWN:
					//console.debug('gCurrentManager.id', gCurrentManager.id);
					jumpTo (gSiteParser.getNextSection(gCurrentManager.id)
						, FIRST_PAGE_NO);
					break;
				case VK_PAGEUP:
				case VK_HOME:
					// 現在のsectionの先頭
					jumpTo (gCurrentManager.id, FIRST_PAGE_NO);
					break;
				case VK_PAGEDOWN:
				case VK_END:
					// 現在のsectionの最終
					jumpTo (gCurrentManager.id, LAST_PAGE_NO);
					break;
				case VK_ESC:
					nojaClose();
					break;
				case VK_SPACE:
					// 前書き後書き表示をtoggle disable,enable,restore
					MaegakiAtogakiModeController.toggle ();
					// menu側に反映
					$('#noja_maegaki').prop('checked', gSetting.fMaegaki);
					$('#noja_atogaki').prop('checked', gSetting.fAtogaki);
					break;
				default:
					return;
				}
				e.preventDefault();
			});
			/////////////////////////////////////////////////
			////// menu関連のcheckbox等

			$('#noja_maegaki').bind('click', function() {
				MaegakiAtogakiModeController.changeMaegaki ($(this).prop('checked'));
			});
			$('#noja_atogaki').bind('click', function() {
				MaegakiAtogakiModeController.changeAtogaki ($(this).prop('checked'));
			});
			$('#noja_layout').bind('click', function() {
				setGlobalLayout ($(this).prop('checked'));
				gSectionManager.reMake();	// nullcheckが入ってないがほぼ同じなので統合
				// レイアウト変更の場合はページ位置は移動しなくてOk?
				jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, gCurrentManager.page);
			});

			var fontChangeHandler = function (font_type) {
				setGlobalFontType (font_type);
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
				setSettingKaigyou ($(this).prop('checked'));
				gSectionManager.reMake();
				jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
			});


			$('#noja_always_open').bind('click', function() {
				setGlobalAlwaysOpen ($(this).prop('checked'));
			});
			$('#noja_autosave').bind('click', function() {
				setSettingAutoSave ($(this).prop('checked'));
			});
			$('#noja_autorestore').bind('click', function() {
				setSettingAutoRestore ($(this).prop('checked'));
			});
			$('#noja_olddata').bind('click', function() {
				setSettingOldData ($(this).prop('checked'));
			});
			$('#noja_allpage').bind('click', function() {
				setGlobalAllpage ($(this).prop('checked'));
				showPage();
			});
			$('#noja_yokogaki').bind('click', function() {
				setGlobalYokogaki($(this).prop('checked'));
				updateLC(slidePos2ZoomRatio (gSlidePos), true);
				// @@ 入れ替えてみるべきかも？ @@
				gSectionManager.reMake();
				onResize();
				jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
			});
			///////// フォントサイズスライダー /////////
			// ui widget部分とlogicを分離
			var fontSizeSliderProgressHandler = function (slidePos) {
				var lc = updateLC(slidePos2ZoomRatio (slidePos), false);
				remake_noja_charsize (calcRealCharFontSize (lc.nchars)
					, lc.nchars, lc.nlines);
			};
			var fontSizeSliderDoneHandler = function (slidePos) {
				setGlobalSlidePos (slidePos);
				updateLC(slidePos2ZoomRatio (gSlidePos), true);
				// cacheをpurgeして再構築
				// ほぼgSectionManager.reMake()だが判定がちょい単純化されているのが謎
				// (null checkがない)
				// startが1なのも違う
				gSectionManager.reMake();	// 開始が1になっているのが謎な部分
				onResize();
				jumpTo (CURRENT_SECTION_NO_WITH_RELOAD, FIRST_PAGE_NO);
			};
			// widget部分
			(function (drag, dragback, bar_width) {
				var dragging = false;
				var span;
				var w = bar_width;
				var saturate = function (value, minmax) {
					if (value < minmax.min) {
						value = minmax.min;
					} else if (value > minmax.max) {
						value = minmax.max;
					}
					return value;
				};
				$(drag).bind('mousedown', function(e) {
					dragging = true;
					span = e.clientX - $(drag).offset().left - w;
				});
				$(document).bind('mouseup', function(){
					if (dragging) {
						dragging = false;
						// [0.083... , 200.083..]が実測値
						var slidePos = $(drag).offset().left + w - 1
							- $(dragback).offset().left;
						fontSizeSliderDoneHandler (slidePos);
					}
				});
				$(document).bind('mousemove', function(e) {
					if (dragging) {
						var left = e.clientX;
						// マウス座標とスライダーの位置関係で値を決める
						var slidePos = e.clientX - $(dragback).offset().left - span;
						// スライダー値を補正
						slidePos = saturate (slidePos
							, {min: 0, max: $(dragback).width()});
						$(drag).css('left', slidePos - w);
						fontSizeSliderProgressHandler (slidePos);
					}
				});
			})('#noja_drag', '#noja_dragback', 5);
			////////////////
			// 更新link
			indexFrame.$updateAnchor().bind('click', loadIndex);

			/////////////////////////////////////////
			// このあたりはメニュー項目
			var adjusting_menu_open_handler = function (menu_open, menu) {
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
			var createCloseHandler = function (selector) {
				return function () {
					$(selector).hide();
				};
			};

			var createToggleHandler = function (selector) {
				return function () {
					popupMenu.toggle (selector);
				};
			};

			$.each({
				'#noja_openconfig':  '#noja_config',
				'#noja_openconfig2': '#noja_config2',
				'#noja_openlink':    '#noja_link',
			}, function (click_target_selector, open_target_selector) {
				$(click_target_selector).bind('click', function() {
					adjusting_menu_open_handler (click_target_selector
						, open_target_selector);
				});
			});

			$.each({
				'#noja_opensaveload': '#noja_saveload',
				'#noja_openhelp':     '#noja_help',
				'#noja_openversion':  '#noja_version',
				'#noja_openhyouka':   '#noja_hyouka',
			}, function (click_target_selector, toggle_target_selector) {
				$(click_target_selector).bind('click'
					, createToggleHandler (toggle_target_selector)
				);
			});

			// 命名規則がイレギュラーなものが一つだけある
			// 全部もっと規則的な名前にすべきかも
			// foo_close -> foo
			// あるいは構造が$(this).parent().hide()
			// で済むならそのほうが完全共通ハンドラになり機能的
			$.each({
				'#noja_closeconfig':   '#noja_config',
				'#noja_closeconfig2':  '#noja_config2',
				'#noja_closesaveload': '#noja_saveload',
				'#noja_closelink':     '#noja_link',
				'#noja_closehelp':     '#noja_help',
				'#noja_closeversion':  '#noja_version',
				'#noja_closehyouka':   '#noja_hyouka',
				'#noja_closedv':       '#noja_download_view',
			}, function (click_target_selector, close_target_selector) {
				$(click_target_selector).bind('click'
					, createCloseHandler(close_target_selector)
				);
			});

			$('#noja_save').bind('click', function() {
				nojaSave();
			});
			$('#noja_restore').bind('click', function() {
				nojaRestore(gSiteParser.ncode);
			});

			// @@ TODO @@ start,endの概念が1～maxに依存している
			var createDownloadLink = function (start, end, suffix) {
				return $('<a>').attr({
					url: URL.createObjectURL(createDownloadData(start, end)),
					download: gSiteParser.title + suffix + '.noja.html',
				}).get(0);
			};

			var handle_DownloadDispatchHandler = function (start, end, suffix) {
				suffix = (suffix === undefined || suffix === null) ? '' : suffix;
				var evt = document.createEvent('MouseEvents');
				evt.initMouseEvent('click', true, true, window
					, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				createDownloadLink(start, end, suffix).dispatchEvent(evt);
			};

			$('#noja_download').bind('click', function() {
				handle_DownloadDispatchHandler (1, gSectionManager.length() - 1);
			});
			$('#noja_download2').bind('click', function() {
				handle_DownloadDispatchHandler (1, gSectionManager.length() - 1
					, '(' + getDateTimeNow() + ')');
			});
			$('#noja_download3').bind('click', function() {
				$('#noja_dv_main').empty();
				// @@ TODO @@ secIdが話数番号ではないものの検討
				gSectionManager.each(function (secId, secData) {
					$('#noja_dv_main')
						.append(
							createDownloadLink(secId, secId, 
									+ ' - ' + secId + ' - '
									+ secData.subtitle
							).html('' + secId + '. ' + secData.subtitle)
						).append('<br>');
				});
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
			// サイト毎のメニュー再構築
			gSiteParser.customizeMenu ();
			//////////////////////////////////////////////
			// 次stageへのchain: 非同期 Deferred interface
			// アプリモードだとコンテンツ読み込み等
			gSiteParser.importInitialContents().then(
				initialize_stage4
				// format mismatchでエラーが出ることはあるが無視
			);
		};

		///////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////
		// 初期化完了手前の最終段階
		var initialize_stage4 = function() {
			console.debug('stage4: updateNavigation');
			gCurrentManager.updateTotalPages(gSetting);
			updateNavigation();
			console.debug('stage4: build reputation form');
			gSiteParser.buildReputationForm ();
			///////////////////////////////////////////////////
			// 設定が終わったのでresizeでジオメトリを更新
			console.debug('stage4: onResize');
			onResize();
			// ある条件のときのみ非同期になるなら
			// $.Deferred().resolve().promise()を入れるよりも
			// $.when()にDeferred,promiseでないものを与えた時の
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
					gSiteParser.startAsyncProcess();
				}
			);
		};

		///////////////////////////////////////////////////////
		// まずローカルストレージからの設定取り出し
		(function(ls) {
			if (ls) {
				var buf1 = {};
				var buf2 = {};
				var buf3 = [];
				var re = /(noja)_([^_]*)_(fMaegaki|fAtogaki|kaigyou)/;
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
						var m = re.exec(k);
						if (m) {
							if (m[2] === 'undefined' || m[2] === 'novelview') {
								break;
							}
							if (!(m[2] in buf2)) {
								buf2[m[2]] = {
									ncode: m[2]
								};
							}
							buf2[m[2]][m[3]] = (v === true);
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

		// Deferred化済
		$.when(
			fncLoad ('global', 'fontType')
			, fncLoad ('global', 'alwaysOpen')
			, fncLoad ('global', 'allpage')
			, fncLoad ('global', 'yokogaki')
			, fncLoad ('global', 'layout')
			, fncLoad ('global', 'slidePos')
		).then (
			function (fontType, alwaysOpen, allpage, yokogaki, layout,slidePos) {
				setGlobalFontType (fontType, WITHOUT_SAVE);
				setGlobalAlwaysOpen (validateBool(alwaysOpen
					, gSiteParser.alwaysOpenDefault), WITHOUT_SAVE);
				setGlobalAllpage (validateBool(allpage, false), WITHOUT_SAVE);
				setGlobalYokogaki (validateBool(yokogaki, false), WITHOUT_SAVE);
				setGlobalLayout (validateBool(layout, false), WITHOUT_SAVE);
				setGlobalSlidePos ((!valid(slidePos)) ? 100 : slidePos, WITHOUT_SAVE);
			},
			function () {
				// 読めなかった時は？
			}
		).then(
			function () {
				// 何故か横書きだけは保存してなかった
				fncSave_global ('fontType', gFontType);
				fncSave_global ('alwaysOpen', gAlwaysOpen);
				fncSave_global ('allpage', gAllpage);
				fncSave_global ('layout', gLayout);
				fncSave_global ('slidePos', gSlidePos);
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
