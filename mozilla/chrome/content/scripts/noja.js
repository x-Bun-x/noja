/*jshint laxbreak: true, laxcomma: true, unused:false, newcap:false */
/*global noja_option:false, $:false, console:false */

/*! のじゃー縦書リーダー ver.1.13.* (c) 2013 ◆TkfnIljons */
$(document).ready(function(){
	'use strict';

	// constとして扱うものは全大文字
	//バージョンはアップデートの前に書き換えろよ！　絶対だかんな！
	var NOJA_VERSION = '1.13.901.2+p10+kai-p5';


	/////////////////////////////////////////////////////
	var createProxyAccessor = function (target, entry, origin, mode) {
		if (mode === undefined) {
			mode = createProxyAccessor.ACCESSOR;
		}
		var props = {};
		if (mode & createProxyAccessor.GETTER) {
			props.get = function () { return origin[entry]; };
		}
		if (mode & createProxyAccessor.SETTER) {
			props.set = function (value) { origin[entry] = value; };
		}
		if (Object.keys(props).length) {
			Object.defineProperty(target, entry, props);
		}
	};
	createProxyAccessor.GETTER   = 1;
	createProxyAccessor.SETTER   = 2;
	createProxyAccessor.ACCESSOR = 3;	// bit or: GETTER|SETTER
	//
	createProxyAccessor.generate = function (target, origin, props) {
		// $.eachでthis指定ができるならそれでいい
		$.each(props, function (entry, mode) {
			createProxyAccessor (target, entry, origin, mode);
		});
	};
	// JsRenderのrenderを
	// method--template--basepropsでbindするためのもの
	// 普通に全引数を渡して呼ぶ
	// named functionにしても意味がない
	// bindされている変数名が取れないと…
	// Functionをダイナミックに作って
	// '$.render.' + method + '($....)'
	// みたいな形で扱う？
	var applyTemplate = function (method, baseProps, props) {
		if (props === undefined) {
			props = {};
		}
		return $.render[method]($.extend({}, baseProps, props));
	};
	// objectのpropsに部分適用したメソッドを定義する
	// 動的に変動させるprops以外はbindする
	// ただし、baseProps自体はobjectなので多分中身が変われば
	// それに対応して束縛したものも変わることになるのではなかろうか？
	// 完全にローカルコピーされてしまうならctorでbindするのは
	// ctor段階で定まっている定数値だけになってしまう
	applyTemplate.generate = function (that, templates, baseProps) {
		// $.eachでthis指定ができるならそれでいい
		$.each(templates, function (method, template) {
			$.templates(method, template);
			that[method] = applyTemplate.bind(that, method, baseProps);
		});
	};

	// dest省略時は新規objectに抜き出したものを入れて返す
	// ['hoge']式の記述
	// {hoge:0}式の記述
	// 単純コピーは$.extend(dest,src)等(keys省略する用途)
	// 引数順序げ辺なのは後でbindで部分適用する都合
	var filterCopyProperties = function (dest, keys, src) {
		if (arguments.length == 2) {
			src = dest;
			dest = {};
		}
		var filter = (Array.isArray(keys)) ?	// ES5
			// 配列なら抜出のみ
			function (index, key) {
				if (key in src) {
					dest[key] = src[key];
				}
			}
			:
			// propsなら変換&中身によってdon't copy or delete dest
			// ができる
			// key-valueで与えてそれをそのまま返せば通常のcopyと同じ
			// result.statusを付けて、
			//    trueならresult.valueをdest[result.key]に書き込み
			//    falseならcopyしない
			//    nullならdelete dest[result.key]
			// key名の入れ替え・dest側削除まではできる
			function (key, fx) {
				if (key in src) {
					if ($.isFunction(fx)) {
						var result = fx({key: key, value: src[key]});
						if (!(status in result)) {
							result.status = true;
						}
						if (result.status === true) {
							dest[result.key] = result.value;
						//} else if (result.status === false) {
						//
						} else if (result.status === null) {
							delete dest[result.key];
						}
					} else {
						dest[key] = src[key];
					}
				}
			};
		$.each(src, filter);
		return dest;
	};

	/////////////////////////////////////////////////////

	// 素のwhenの場合failがshort-circuitに発火してしまうので
	// ワンクッション被せて上位whenにはresolveを返すことで全完了待ちをする
	// 完了時のdoneは各deferredsの結果が、[promise, arguments]で入る
	// promise.state()でもいいのだが、
	// .promise(obj)でpromise化したobjを扱う場合、
	// callback内から直接objを参照できたほうが便利
	// whenとは違い、promise以外のものは扱わない
	// (それをやりだすとコードが少し複雑化する)
	var $$waitForAllFinished = function (promisses) {
		return $.when.apply($, $.map(promisses, function(promise) {
			var wrapDeferred = new $.Deferred();
			promise.always(function() {
				wrapDeferred.resolve (promise, arguments);
			});
			return wrapDeferred.promise();
		}));
	};

	// カリー化とかやりはじめると切りがないのでやめ
	// 本当はデフォルト値部分特殊化とかできたほうが便利なのかもしれないが
	// そこまで効率が必要なものでなし…
	var ensureFactory = function (validator, default_value) {
		if (arguments.length == 1) {
			return function (value, default_value) {
				var ensured_value = validator(value);
				return (ensured_value !== undefined) ? ensured_value : default_value;
			};
		} else {
			var ensure = function fx (value) {
				var ensured_value = validator(value);
				return (ensured_value !== undefined) ? ensured_value : fx.default_value;
			};
			ensure.default_value = default_value;
			return ensure;
		}
	};
	// あまりプリミティブな部分まで関数化しまくってもしょうがないか？
	var isBool = function (value) {
		return (typeof value === 'boolean');
	};
	var ensureBool = ensureFactory (function (value) {
		return (typeof value === 'boolean') ? value : undefined;
	});
	var ensureBoolFactory = function (default_value) {
		ensureFactory (function (value) {
			return (typeof value === 'boolean') ? value : undefined;
		}, default_value);
	};
	// 厳密に文字列としてのboolean値をevalするキレイなコードは何だろう？
	var ensureParseBool = function (value, default_value) {
		if (value === 'true') {
			return true;
		} else if (value === 'false') {
			return false;
		}
		return default_value;
	};


	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	// 話数id管理タイプ用途
	// 各話ページの相対リンクも仮対応
	function SectionMap (getSectionIdFromUrl) {
		var cls = SectionMap;
		this.chapterTitle = '';
		this.prevSectionId = null;
		this.idMap = [];
		// stats
		this.firstSectionId = null;
		this.lastSectionId = null;
		this.totalSections = 0;
		this.relativeInfo = {currentId: null, prevId: null, nextId:null};
		//
		this.$getSectionIdFromUrl = getSectionIdFromUrl;
	}
	SectionMap.prototype = {
		// chapterTitle: text
		pushChapter: function (chapterTitle) {
			this.chapterTitle = chapterTitle;
		},
		// sectionInfo = {
		//  url: text
		//  subtitle: text
		//  publishedDateTime: text
		// };
		pushSection: function (sectionInfo) {
			var sectionId = this.$getSectionIdFromUrl (sectionInfo.url);
			if (sectionId === null) {
				console.debug('sectionInfo parse failed:'
					, sectionInfo.url
					, sectionInfo.subtitle
					, sectionInfo.publishedDateTime
				);
				return;
			}
			if (sectionId in this.idMap) {
				console.debug('sectionId is already registerd:', sectionId);
				return;
			}
			var prevId = this.prevSectionId;
			var sectionNode = $.extend(
				{
					prev: prevId,
					next: null,
					chapterTitle: this.chapterTitle,
				}
				, sectionInfo
			);
			if (prevId !== null) {
				if (!(prevId in this.idMap)) {
					console.debug('prevId is not registerd:', prevId);
					return;
				}
				if (this.idMap[prevId] === null) {
					console.debug('idMap[prevId] is null');
					return;
				}
				this.idMap[prevId].next = sectionId;
			}
			this.idMap[sectionId] = sectionNode;
			this.prevSectionId = sectionId;
			// stats
			if (this.firstSectionId === null) {
				this.firstSectionId = sectionId;
			}
			this.lastSectionId = sectionId;
			++(this.totalSections);
		},
		// 以下問い合わせ系
		exists: function (secId) {
			return (secId in this.idMap);
		},
		get: function (secId) {
			if (!(secId in this.idMap)) {
				console.debug('not registerd section', secId);
				return null;
			}
			return this.idMap[secId];
		},
		// 内部的にチェック用途
		// 構築中にそれ依然に定義したpropsを参照できるのか？
		// assert: this.get,
		assert: function (secId) {
			return this.get(secId);
		},
		setRelative: function (relativeInfo) {
			if (typeof relativeInfo === 'number') {
				var currentId = relativeInfo;
				var info = this.get(currentId);
				if (info === null) {
					return false;
				}
				relativeInfo = {
					current: currentId,
					prev: info.prev,
					next: info.next,
				};
			}
			this.relativeInfo = $.extend({}, relativeInfo);
			// 後は単なるassertion
			console.debug('current: ', this.relativeInfo.current);
			console.debug('prev: ', this.relativeInfo.prev);
			console.debug('next: ', this.relativeInfo.next);
			if (this.relativeInfo.current !== null) {
				this.assert(this.relativeInfo.current);
			}
			if (this.relativeInfo.prev !== null) {
				this.assert(this.relativeInfo.prev);
			}
			if (this.relativeInfo.next !== null) {
				this.assert(this.relativeInfo.next);
			}
			return true;
		},
		existsRelative: function (secId) {
			return (secId === this.relativeInfo.current
				|| secId === this.relativeInfo.prev
				|| secId === this.relativeInfo.next);
		},
		queryExists: function (secId) {
			if (secId in this.idMap) {
				return true;
			}
			return this.existsRelative(secId);
		},
		// 大小で判断するのはふさわしくない
		// 第一話を更新した場合、idの数値としてはno1 > no2になる
		queryMin: function (secId) {
			if (this.firstSectionId !== null) {
				return this.firstSectionId;
			}
			// 真面目にするならsecIdがcurrentかチェック
			return this.relativeInfo.prev;
		},
		// lastを超えた移動かどうかはこれでは判断できない
		// 現在位置がlastかどうかは分かる
		queryMax: function (secId) {
			if (this.lastSectionId !== null) {
				return this.lastSectionId;
			}
			// 真面目にするならsecIdがcurrentかチェック
			return this.relativeInfo.next;
		},
		queryPrev: function (secId) {
			var prev;
			if (secId in this.idMap) {
				prev = this.idMap[secId].prev;
				if (prev !== null) {
					return prev;
				}
			}
			if (this.relativeInfo.current == secId) {
				prev = this.relativeInfo.prev;
			}
			return (prev !== null) ? prev : secId;
		},
		queryNext: function (secId) {
			var next;
			if (secId in this.idMap) {
				next = this.idMap[secId].next;
				if (next !== null) {
					return next;
				}
			}
			if (this.relativeInfo.current == secId) {
				next = this.relativeInfo.next;
			}
			return (next !== null) ? next : secId;
		},
	};

	/////////////////////////////////////////////////////
	// constとして扱うものは全大文字

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

	var APP_YOMIKOMI_SETUMEI = noja_option.app_yomikomi_setumei;
	var APP_KOKUHAKU = noja_option.app_kokuhaku;
	var APP_SETUMEI = noja_option.app_setumei;


	//上記リソースを読み込む用関数。
	//実際はacync:falseで(ローカルにあるファイルだから
	// 同期しちゃって大丈夫)ajaxやってるだけなんだけど、
	//火狐版だとこのスクリプトからはクロスドメインできないんだよ……
	var ResourceManager = {
		load: noja_option.loadSubContent,
	};

	// オリジナルではloadで読めなかったときはnullを返していたが
	// deferred化でrejectするようにしたので、
	// 読んだ時の処理に対応が必要
	function SaveLoadManager(dbName) {
		this.dbName = dbName;
	}
	SaveLoadManager.prototype = {
		// dbName=='ncode'だけは特殊で、
		// key省略のときはvalue.ncodeがデフォルトkeyになる
		save: function (key, value) {
			//console.debug('save key,value:', key, value);
			noja_option.save (this.dbName, value, key);
		},
		// loadは非同期callbackだったがDeferredに変更
		load: function (key, fx) {
			return noja_option.load (this.dbName, key, fx);
		},
		// 読めた時も読めなかった時も値を保証する
		// success: 読めた値をensure()で判定して返す
		// fail: 元のloadがfail時はensureのpropからデフォルト値を取る
		loadEnsureAdaptor: function (ensurer, default_value) {
			ensurer.default_value = default_value;
			return ensurer;
		},
		loadEnsure: function (key, ensure, fx) {
			var dfrd = new $.Deferred();
			var promise = noja_option.load (this.dbName, key, fx);
			promise.done(function (data) {
				// loadのpromiseをthisにして呼び出す?
				// dfrd.resolveWith (promise, ensure(arguments));
				// 第一引数に成功かどうかのboolean
				// deprecated .isResolved()
				//console.debug('<done> key:', key);
				//console.debug('arguments:', arguments);
				//console.debug('ensured_value:', ensure(data));
				dfrd.resolve (ensure(data));
			}).fail(function () {
				//console.debug('<fail> key:', key);
				//console.debug('arguments:', arguments);
				//console.debug('ensure.defaukt_value:', ensure.default_value);
				dfrd.resolve (ensure.default_value);
			});
			return dfrd.promise();
		},
		delete: function (key) {
			return noja_option.deleteItem (key);
		},
		saveAll: function (props) {
			$.each(props, function (k, v) {
				this.save (k, v);
			});
		},
		/*
		// 個別にfxでvalidateする？
		// 元々のcallbackに拘らないならdefferedで呼ぶものがfxか？
		// loadAll自体はwhenで全体終了のpromiseを返す
		loadAll: function (keys) {
			var dfrd = [];
			$.each(keys, function (key, fx) {
				dfrd.push (this.load (key, fx);
			});
			return $.when(dfrd);
		},
		*/
	};

	var gGlobalSettingManager = new SaveLoadManager ('global');
	var gSaveDataManager = new SaveLoadManager ('saveData');

	// gCustomSettingManagerだけはkey省略可能
	// key省略のときはvalue.ncodeがデフォルトkeyになる
	var gCustomSettingManager = new SaveLoadManager ('ncode');
	gCustomSettingManager.save = function (props) {
			//console.debug('save props:', props);
			noja_option.save (this.dbName, props);
	};

	// なろうにログインした状態で一度のじゃーを動かして
	// tokenをとっておき、それを使ってappmodeのときにも
	// 評価等ができるようにするらしい
	// (contextをまたいでブラウザでグローバルな変数として管理)
	// setするのはなろう系をparseしたとき
	// getするのはappmodeの初期化
	// setするほうは、なろう固有の話なのでなろう系parserのみ実行
	// getするappmode側はtokenなしの可能性もあるがそれは元々の話なので
	// 他サイトが増えても問題ない
	var gTokenManager = {
		get: noja_option.getToken,	// deferred
		set: noja_option.setToken,
	};

	// noja_option.appmode
	//  拡張の呼出し側が設定する値

	// noja_option.localStorage
	//  初期化時にlocalStorageのkey-valueをglobal等に変換している
	//  保存はしてないから過去の互換性？

	//定数

	var RE_G_LINEBREAK = /\r|\n/g;

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

	var gHtmlPortManager;


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


	var sleepTimer = function (duration) {
		if (duration === undefined) {
			duration = sleepTimer.DEFAULT_DURATION;
		}
		var dfrd = new $.Deferred();
		setTimeout(function () {
			dfrd.resolve();
		}, duration);
		return dfrd.promise();
	};
	sleepTimer.DEFAULT_DURATION = 100;

	//読み込み中フラグ
	// 裏でindexerが動いている場合にbusyしまくるので
	// 移動できずにまずい状態になりかねない
	var gNetworkManager = {
		isLoading: 0,
		isReady: function () {
			return this.isLoading === 0;
		},
		isBusy: function () {
			return this.isLoading !== 0;
		},
		acquire: function () {
			//console.debug('acquire this', this);
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
		RETRY_FOREVER: 0,
		DEFAULT_DURATION: 100,
		DEFAULT_RETRY_COUNT: 0,	// forever
		waitFor: function (withAcquire, retry_count, duration) {
			if (retry_count === undefined) {
				retry_count = this.DEFAULT_RETRY_COUNT;
			}
			if (duration === undefined) {
				duration = this.DEFAULT_DURATION;
			}
			var isOk = (withAcquire) ? this.acquire : this.isReady;
			var self = this;
			//console.debug('waitFor', isOk);
			var retry = 0;
			var dfrd = new $.Deferred();
			(function loop () {
				if (!isOk.call(self)) {
					++retry;
					dfrd.notify(retry);
					if (retry_count == self.RETRY_FOREVER || retry <= retry_count) {
						setTimeout(loop, duration);
					} else {
						dfrd.reject();
					}
				} else {
					dfrd.resolve();
				}
			})();
			return dfrd.promise();
		},
		waitForReady: function (retry_count, duration) {
			return this.waitFor (false, retry_count, duration);
		},
		waitForAcquire: function (retry_count, duration) {
			return this.waitFor (true, retry_count, duration);
		},
	};

	// ui
	var uiIsNetworkBusy = function (msg) {
		var status = gNetworkManager.isBusy();
		if (status && msg) {
			statusFrame.showMessage ('川・◊・)ねっとわーく接続中なのじゃー。' + msg);
		}
		return status;
	};


	// objectとして隠蔽する
	// loadIndexもこれの配下に置く
	// 
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
		isIndexPageDisable: function () {
			return this.isIndexPageAvailable === this.INDEXPAGE_DISABLE;
		},
		// disableも含めてnotReady:あまりよくないので
		// 呼出し側で!isIndexPageReady()等明確に使うべきだろう
		isIndexPageNotReady: function () {
			return !this.isIndexPageReady();
		},

		// @@ TODO @@
		// 各項目ごとに処理がいるか？
		// 各項目rootのdivにsaveData用のidを付ける(autoPager用？)
		// 形式を標準化する
		// title: div#noja_toc_title
		// author: div#noja_toc_author
		// description: div#noja_toc_description
		// toc: div#noja_toc_index
		// [a]要素
		//  ・絶対パス化or位置調整済とする
		//  ・のじゃーがページジャンプとして扱うべきリンクはnoja_jumpToを付ける
		// 統合
		registIndex: function (tocInfo, fullIndex) {
			if (fullIndex === undefined) {
				fullIndex = true;
			}
			if (fullIndex) {
				indexFrame.$div().empty();
			}
			console.debug('registIndex', tocInfo);
			console.debug('registIndex', tocInfo.totalSections);
			// keyとは別のsuffixにするならk-vのvに設定するように変更
			$.each ({series:0, title:1, author:2, description:3, index:4}, function(key, value) {
				var item;
				if (key in tocInfo) {
					item = tocInfo[key];
					if (item.jquery) {
						// linkのclick action登録
						item.find('[noja_jumpTo]').each(function() {
							var secNo = parseInt($(this).attr('noja_jumpTo'));
							$(this).on('click'
								, autoHideClickJumpHandlerFactory (indexFrame
									, secNo, FIRST_PAGE_NO));
						});
					}
				} else {
					// 登録データになくても、dom上ではデータを作っておかないと
					// appendやexportするときに手間がかかる
					item = $('<div/>');
				}
				var item_id = 'noja_toc_' + key;
				item.attr('id', item_id);
				if (fullIndex) {
					indexFrame.$div().append(item);
				} else {
					var t = indexFrame.$div().find('#' + item_id);
					if (t.size()) {
						t.append(item.contents());
					} else {
						// 初回だけで発生
						// 次回以降は、初回で作った場所が見つかるはず
						indexFrame.$div().append(item);
					}
				}
			});
			if ('index_accordion_header' in tocInfo) {
				$('#noja_toc_index').accordion({
					header: tocInfo.index_accordion_header,
					heightStyle: 'content',
				});
			}
			this.setIndexPageReady ();
		},

		// コンテキストスイッチが関数call単位で発生するなら色々まずいが、
		// 非同期関数以外では明示的なコンテキストスイッチは発生しないはず。
		// check & go-message & callの間で他のreqが入ることはなかろう。
		ERROR_ALREADY_LOADING: -1,
		ERROR_LOAD_FAILURE: -2,
		load: function() {
			var self = this;
			if (this.isIndexPageNowLoading()) {
				// 自前のerror statusを返す
				return new $.Deferred()
					.reject(self.ERROR_ALREADY_LOADING).promise();
			}
			this.setLoadingStart();
			// deferred callbackの中ではthisが違う
			// 特に変数を束縛してまでthisを取る必要はないので
			// 直接オブジェクトを指定して呼ぶ
			return gSiteParser.loadIndex().then(
				function (tocInfo) {
					self.setLoadingSuccess();
					self.forceSetGeneralAllNo(tocInfo.totalSections);
					self.registIndex (tocInfo);
					return new $.Deferred()
						.resolve(tocInfo.totalSections).promise();
				},
				function () {
					self.setLoadingFailed();
					// 自前のerror statusを返す
					return new $.Deferred()
						.reject (self.ERROR_LOAD_FAILURE).promise();
				}
			);
		},

		// もはやimport/restoreくらいしか使わない
		// gSiteParserに管理はまかせて中継のみ
		// restore/importでこれがないことによる弊害
		// * restore:サイト固有のparserなので現状onlineから
		//   必要情報が取れる前提
		//   parser側が話数情報を管理するので、updateさせていかないといけない
		//   (section登録時)
		//   問題になるのは内部データ形式だと相対リンクが取れない点
		//   * 最新話ページ表示時点でのrestoreなら問題ないが…
		//   * 
		generalAllNo: null,
		get GeneralAllNo () {
			// cast to number
			return this.generalAllNo - 0;
		},
		forceSetGeneralAllNo: function (x) {
			this.generalAllNo = x;
			gSiteParser.updateMaxSection(this.generalAllNo, true);
		},
		set GeneralAllNo (x) {
			this.forceSetGeneralAllNo (Math.max(this.generalAllNo, x));
		},

		// 最終セクション判定だけは機能として必要
		isLastSection: function (secNo) {
			// 同じ値を返して来たらそれは次に進めない
			return (gSiteParser.getNextSection (secNo) == secNo);
		},

	};
	//[ES5] Object.defineProperty()
	// 初期化子以外でのsetter/getter付与、readonly設定等細かいこともできる
	// 複数propsまとめてやるObject.defineProperties()もある
	//
	// objectの監視は
	// ES6ではobserve系API?
	// mozilla: 非標準watch(),unwatch()
	//
	// [ES6] Proxy API
	//http://hagino3000.blogspot.jp/2012/03/javascript.html
	// 型チェックできるのは便利かなあ

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
		isSingleSection: true,
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
			if (singleSection === undefined) {
				singleSection = true;
			}
			this.isSingleSection = singleSection;
			if (singleSection) {
				// 短編
				gIndexManager.setIndexPageDisabled ();
				gIndexManager.forceSetGeneralAllNo(1);
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
		setCurrent: function (secId, pageNo) {
			if (pageNo === undefined) {
				pageNo = 0;
			}
			//console.debug('setCurrent', secId, gSectionManager.getData(secId));
			this.id = secId;
			this.page = pageNo;		// pageも初期化がいる？
			if (typeof this.id === 'number') {
				// このあたりはsection構造そのままcopyでいいはず
				this.sectionData = gSectionManager.getData (secId);
				if (this.sectionData === null) {
					// 初期parse時に先にsetCurrentしているのが問題
					console.debug('setCurrent secData is null', secId);
					gSectionManager.debugDump();
				} else {
					this.updateTotalPages(gSetting);
					gPageNavigationManager.update();
				}
			}
		},
		// アライメント補正はなし
		// 数える対象はグローバル変数に入ったもの
		countPages: function (setting) {
			return gSectionManager.countPages (this.sectionData, setting);
		},
		// setting切り替えに伴って変化するのだが…
		updateTotalPages: function (setting) {
			this.totalPages = this.countPages (setting);
			console.debug("updateTotalPages: ", this.totalPages);
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
			return (this.page >= (this.totalPages
				+ (this.totalPages % this.pagesPerCanvas) - this.pagesPerCanvas));
		},
		// @@ 単ページ対応済 @@
		getNextPage: function () {
			var newPageNo = this.page + this.pagesPerCanvas;
			// total pageを超えたらnullを返す
			// 意味的にはNaNのほうが好ましいが
			// ES6じゃないとNumber.isNaN()がなくて
			// GlobalなisNaN(x)はnumberへのcast可能性の評価なので
			// NaNは扱いづらい
			// (FFとChromeだからつかってもいいのだろうが)
			console.debug('getNextPage', this.page, this.pagesPerCanvas, this.totalPages);
			if (newPageNo >= this.totalPages) {
				return null;
			}
			return newPageNo;
		},
		getPrevPage: function () {
			var newPageNo = this.page - this.pagesPerCanvas;
			// 0を下回ったらnullを返す
			console.debug('getPrevPage', this.page, this.pagesPerCanvas, this.totalPages);
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

		getNextSection: function() {
			var secId = gSiteParser.getNextSection (this.id);
			return (secId != this.id) ? secId : null;
		},
		getPrevSection: function() {
			var secId = gSiteParser.getPrevSection (this.id);
			return (secId != this.id) ? secId : null;
		},
		getNextLocation: function() {
			var location = {
				page: this.getNextPage(),
				section: this.id,
				valid: true,
			};
			location.isChangeSection = (location.page === null);
			if (location.isChangeSection) {
				location.section = gSiteParser.getNextSection (this.id);
				// 同じ値を返して来たらそれは次に進めない
				if (location.section != this.id) {
					location.page = FIRST_PAGE_NO;
				} else {
					location.page = LAST_PAGE_NO;
					location.valid = false;
				}
			}
			return location;
		},
		getPrevLocation: function() {
			var location = {
				page: this.getPrevPage(),
				section: this.id,
				valid: true,
			};
			location.isChangeSection = (location.page === null);
			if (location.isChangeSection) {
				location.section = gSiteParser.getPrevSection (this.id);
				// 同じ値を返して来たらそれは次に進めない
				if (location.section != this.id) {
					location.page = LAST_PAGE_NO;
				} else {
					location.page = FIRST_PAGE_NO;
					location.valid = false;
				}
			}
			return location;
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


	//  sectionDBのエントリがstatusを兼ねるのはやめる
	// そうしないとloading cancelができない
	var gSectionManager = {
		// remake対策でformat paramを覚えておくほうがいいか？
		sectionDB: {},
		clear: function () {
			this.sectionDB = {};
		},
		SECTION_STATUS_INVALID: null,
		SECTION_STATUS_LOADING: false,
		SECTION_STATUS_READY: true,

		// @@ TODO @@
		// 再読み込みがかかったときに、元データの状態をloadingにしてしまうと
		// 後でfailedになったときに戻せない
		isSectionReady: function (secId) {
			if (secId in this.sectionDB) {
				var secEntry = this.sectionDB[secId];
				if (secEntry.status === this.SECTION_STATUS_READY) {
					return true;
				}
			}
			return false;
		},
		isSectionLoading: function (secId) {
			if (secId in this.sectionDB) {
				var secEntry = this.sectionDB[secId];
				if (secEntry.status === this.SECTION_STATUS_LOADING) {
					return true;
				}
			}
			return false;
		},
		// readyだけはinternal use(Data登録のI/Fしか外部は使わない)
		setStatusReady: function (secId) {
			var secEntry;
			if (secId in this.sectionDB) {
				secEntry = this.sectionDB[secId];
			} else {
				secEntry = this.sectionDB[secId] = {};
			}
			secEntry.status = this.SECTION_STATUS_READY;
		},
		setStatusInvalid: function (secId) {
			var secEntry;
			if (secId in this.sectionDB) {
				secEntry = this.sectionDB[secId];
			} else {
				secEntry = this.sectionDB[secId] = {};
			}
			secEntry.status = this.SECTION_STATUS_INVALID;
		},
		setStatusLoading: function (secId) {
			var secEntry;
			if (secId in this.sectionDB) {
				secEntry = this.sectionDB[secId];
			} else {
				secEntry = this.sectionDB[secId] = {};
			}
			secEntry.status = this.SECTION_STATUS_LOADING;
		},
		// プリミティブすぎるが使っている
		isExist: function (secId) {
			return (secId in this.sectionDB);
		},
		// とりあえずこれはlocalなmethodなので存在チェックはしない
		isNeedRemake: function (secId) {
			var secData = this.sectionDB[secId].secData;
			if (!('formatSpec' in secData)) {
				console.debug('getData: formatSpec missing:', secId, secData);
				return true;
			}
			var formatSpec = secData.formatSpec;
			if (formatSpec.linesPerCanvas != gLinesPerCanvas
				|| formatSpec.charsPerLine != gCharsPerLine) {
				console.debug('getData: format spec mismatch:', secId, secData);
				return true;
			}
			return false;
		},
		getData: function (secId) {
			if (!(secId in this.sectionDB)) {
				console.debug('getData: invalid no entry', secId);
				return null;
			}

			var secEntry = this.sectionDB[secId];
			var format_invalid = false;
			$.each ({status: true, secData: true}, function (entry, isCheck) {
				if (!(entry in secEntry)) {
					format_invalid = true;
				}
			});
			if (format_invalid) {
				console.debug('gettData: invalid entry format: '
					+ entry + 'missing: ', secId, secEntry);
				return null;
			}

			if (secEntry.status != this.SECTION_STATUS_READY) {
				console.debug('getData: invalid type', secId, secEntry);
				// loading中(更新中)のものを読み出すことも認める
			}
			var secData = secEntry.secData;

			// 取り出し時は必須のものだけチェック
			// 常にcheckなのでisCheckは意味なし
			$.each ({_honbun: true,}, function (entry, isCheck) {
				if (!(entry in secData)) {
					console.debug('gettData: invalid format: '
						+ entry + 'missing: ', secId, secData);
				}
			});
			if (this.isNeedRemake(secId)) {
				this.reMake (secId);
				secData = this.sectionDB[secId].secData;
			}
			
			return secData;
		},
		WITH_OVERWRITE: true,
		WITHOUT_OVERWRITE: false,
		// これは完全データであることを保証する
		registData: function (secId, secData, with_overwrite) {
			//console.debug('registData: dump secData', secId, secData);
			if (with_overwrite === undefined) {
				with_overwrite = this.WITHOUT_OVERWRITE;
			}
			if (secData === undefined || secData === null) {
				console.debug('registData: invalid type', secId, secData);
			}
			// cleanup secData form
			$.each ({_honbun: true, _maegaki: false, _atogaki: false,}
				, function (entry, isCheck) {
				if (!(entry in secData)) {
					if (isCheck) {
						console.debug('registData: invalid format: '
							+ entry + 'missing: ', secId, secData);
					}
					secData[entry] = null;
				}
			});
			secData = splitContentsBody (secData, secId);
			// 登録
			// loading中なら後から新しいものが来る可能性があるが…
			if (!with_overwrite && !this.isSectionReady(secId)) {
				// overwriteではなくてnot readyなら
				// 完全新規かinvalidかloadingだが、
				// エントリがあるかどうかは未確定
				if (!(secId in this.sectionDB)) {
					this.sectionDB[secId] = {};
				}
				// 状態はloadingの場合はそのままにしておく
				if (!this.isSectionLoading()) {
					this.setStatusReady (secId);
				}
				// データ部は書き換える
				// loading cancel時は今回書くものが最新
				// loading doneならその時点で最新のものに入れ替えられる
				with_overwrite = true;
			} else {
				this.setStatusReady (secId);
			}
			if (with_overwrite) {
				this.sectionDB[secId].secData = secData;
			}
			// cleanupしたデータを返す(autoPager用途)
			return secData;
		},
		getPageMap: function (secData, setting) {
			return new PageMap(secData, setting);
		},
		////////////////////////////////////////////////////////
		// 文章領域のページ数を計算する
		// 一部で有無checkを_maegakiのraw側でしている部分もあったが
		countPages: function (secData, setting) {
			if (secData === null) {
				console.debug('countPages: current id', gCurrentManager.id);
				console.debug('countPages: dump secData', secData);
				this.debugDump();
			}
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
				if (!(i in this.sectionDB)
					|| this.sectionDB[i].status !== this.SECTION_STATUS_READY) {
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
			$.each(this.sectionDB, function (secId, secEntry) {
				fn(secId, secEntry.secData);
			});
		},
		rangedEach: function (min, max, fn) {
			for (var i = min; i <= max; ++i) {
				if (i in this.sectionDB
					&& this.sectionDB[i].status === this.SECTION_STATUS_READY) {
					if (!fn (i, this.sectionDB[i].secData)) {
						break;
					}
				}
			}
		},
		debugDump: function () {
			console.debug('debugDump', this.sectionDB);
			this.each (function (secId, secData) {
				console.debug('secDB[' + secId + '].secData:', secData);
			});
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
				&& (!(secId in this.sectionDB)
				|| this.sectionDB[secId].status !== this.SECTION_STATUS_READY);
				++secId) {
				// none
			}
			return secId;
		},
		// download形式の中身を作る
		// html encodeはjsRender
		// 改行削除だけ行う
		// jQuery objectを戻すほうは改行除去はなかったが
		// 機能としては共通化しても問題ないはずなので統一
		renderToHtmlDiv: $.templates('noja_section_div_template'),
		toDivHtml: function (secId, secData, prefix) {
			var param = {
				idPrefix: prefix,
				secId: secId,
				secData: $.extend({}, secData),
			};
			$.each({_maegaki: false, _honbun:true, _atogaki:false}
			, function(key,value) {
				if (param.secData[key] !== null && param.secData[key] !== '') {
					param.secData[key]
						= param.secData[key].replace(RE_G_LINEBREAK, '');
				}
			});
			return this.renderToHtmlDiv(param);
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
		// id指定でのremakeは意味がないので廃止するか？
		// 無理に残すとしたら探しながら巡回する
		reMakeAll: function (beginId, endId) {
			console.debug("remake pages called");
			beginId = (beginId === undefined) ? 0 : beginId;
			endId = (endId === undefined) ? this.sectionDB.length : endId;
			for (var secId = beginId; secId < endId; ++secId) {
				if (this.isSectionReady(secId)) {
					var secData = this.sectionDB[secId].secData;
					console.debug("remake page:", secId);
					console.debug("param lc:", gLinesPerCanvas, gCharsPerLine);
					splitContentsBody (secData, secId);
				}
			}
		},
		// とりあえず目的ページだけでいいはず
		reMake: function (secId) {
			if (secId === undefined) {
				secId = gCurrentManager.id;
			}
			console.debug("remake page called");
			if (this.isSectionReady(secId)) {
				var secData = this.sectionDB[secId].secData;
				console.debug("remake page:", secId);
				console.debug("param lc:", gLinesPerCanvas, gCharsPerLine);
				splitContentsBody (secData, secId);
			}
		},
		// loadコンテンツがらみなのでそのまま置き換えるべきか
		// validateすべきか悩むところ
		// 構造を変えたので単純に代入ではすまず少し形式変換
		replaceDataBase: function (secDB) {
			this.clear();
			var self = this;
			$.each (secDB, function (index, secData) {
				self.sectionDB[index] = {
					status: self.SECTION_STATUS_READY,
					secData: secData,
				};
			});
		},

		// saveData形式を生成:dataが与えられなければcreate,そうでない場合はreplace
		createSaveData: function (data, srcDB, startSecNo, endSecNo) {
			srcDB = (srcDB === undefined) ? this.sectionDB : sec_sections;
			startSecNo = (startSecNo === undefined) ? 1 : startSecNo;
			endSecNo = (endSecNo === undefined) ? srcDB.length : endSecNo;
			data = (data === undefined) ? {} : data;

			// index部分を作る
			// or結合なselectorなので4要素のものが戻ってきて
			// それをそのままindexに入れるのが元仕様
			if (gIndexManager.isIndexPageReady()) {
				data.index = $('<div>')
					.append(gSiteParser.selectNojaIndexData().clone())
					.html();
			}
			// @@ 互換性のためtypoをそのまま残すか？
			data.tanpen = gCurrentManager.isSingleSection;
			// restoreしていない場合、data側のmaxのほうが大きい可能性もある
			data.generalAllNo = Math.max (gIndexManager.GeneralAllNo, data.generalAllNo);
			data.title = gSiteParser.getTitle();
			data.color = gThemeManager.color.color;
			// 内部形式でのdumpになる
			data.bgColor = gThemeManager.color.bgColor;
			data.auther = gSiteParser.getAuthor();
			data.bgImage = gThemeManager.color.bgImage
				? $(gThemeManager.color.bgImage).attr('src') : null;

			//セクションデータ
			for (var i = startSecNo; i < endSecNo.length; ++i) {
				var sec = srcDB[i].secData;
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

	// カスタム設定はまとめてsettingのsaveという形だった。
	// それは4項目のみ?違う
	// なしで作られwritebackされるデフォルトが4項目のみで、
	// その後保存が行われるような設定変更操作をしなければ
	// 4項目のものが出来上がるというだけ。
	// 動作過程でinitのstage2あたりで値が正しくtrueか
	// さもなくばその他は全部falseで初期化される。
	var WITH_SAVE = true;
	var WITHOUT_SAVE = false;
	// withoutが必要なのは初期化のときに
	// local-storage

	// ncodeはこれが持つべきなのか謎
	var gSetting = {};

	// 新規読み込み時等で値が未定義の場合もありそれを修正
	// 新規objectとして返す
	var getSettingDefault = function () {
		return {
			ncode: null,	// novel ID   : 保存されるべき
			fMaegaki: true,	// 前書き表示 : 保存されるべき
			fAtogaki:true,	// 後書き表示 : 保存されるべき
			kaigyou: false,	// 改行詰め : 保存されるべき
			// 以下デフォルト生成では設定されない
			// true以外は全false扱いでvalidateされる
			// autoSave:,
			// autoRestore:,
			// oldData:,
		};
	};
	// デフォルトとncodeを合成した新規setting
	// デフォルトは新規objectなのでextendで書き込んでも問題ない
	var createNewSetting = function (novelId) {
		return $.extend(getSettingDefault (), {ncode: novelId});
	};
	// instance method化する
	var validateSetting = function (setting) {
		setting = (setting === undefined) ? gSetting : setting;
		setting.autoSave    = (setting.autoSave === true);
		setting.autoRestore = (setting.autoRestore === true);
		setting.oldData     = (setting.oldData === true);
	};
	// まとめて:これはobjectが変わる
	// initからの呼出し
	var setSetting = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting = value;
		if (with_save) {
			gCustomSettingManager.save (gSetting);
		}
	};
	// UI側からのnotify的なもの
	var setSettingKaigyou = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.kaigyou = value;
		if (with_save) {
			gCustomSettingManager.save (gSetting);
		}
	};
	var setSettingFMaegaki = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.fMaegaki = value;
		if (with_save) {
			gCustomSettingManager.save (gSetting);
		}
	};
	var setSettingFAtogaki = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.fAtogaki = value;
		if (with_save) {
			gCustomSettingManager.save (gSetting);
		}
	};

	var setSettingAutoSave = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.autoSave = value;
		if (with_save) {
			gCustomSettingManager.save (gSetting);
		}
	};
	var setSettingAutoRestore = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.autoRestore = value;
		if (with_save) {
			gCustomSettingManager.save (gSetting);
		}
	};
	var setSettingOldData = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSetting.oldData = value;
		if (with_save) {
			gCustomSettingManager.save (gSetting);
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
			gGlobalSettingManager.save ('layout', gLayout);
		}
	};
	//ページ読み込み直後に開くかどうか
	var gAlwaysOpen;	//
	var setGlobalAlwaysOpen = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gAlwaysOpen = value;
		if (with_save) {
			gGlobalSettingManager.save ('alwaysOpen', gAlwaysOpen);
		}
	};
	//累計ページ数を表示するかどうか
	var gAllpage;	//
	var setGlobalAllpage = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gAllpage = value;
		if (with_save) {
			gGlobalSettingManager.save ('allpage', gAllpage);
		}
	};

	//文字サイズ設定スライドバーの位置
	var ZOOM_SLIDER = {
		MIN: 0,
		DEFAULT: 100,
		MAX: 200,
	};
	var gSlidePos;
	var setGlobalSlidePos = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gSlidePos = value;
		if (with_save) {
			gGlobalSettingManager.save ('slidePos', gSlidePos);
		}
	};

	// valueは[0.083... , 200.083..]が実測値
	var slidePos2ZoomRatio = function (value) {
		return Math.pow(2, (200 - value) / 100);
	};


	//縦書リーダーなのに横書で読みたいという酔狂な人のために
	var gYokogaki = true;
	var setGlobalYokogaki = function (value, with_save) {
		with_save = (with_save === undefined) ? true : with_save;
		gYokogaki = value;
		if (with_save) {
			gGlobalSettingManager.save ('yokogaki', gYokogaki);
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
			gGlobalSettingManager.save ('fontType', gFontType);
		}
	};


	// globalからのload->propsにセット(ensured)->save
	// set&saveはwithoutにする意味はないのではないか？
	// table化すべき
	var ensureGlobalSettingAll = function () {
		var dfrd = new $.Deferred();
		var ensure_allpage, ensure_yokogaki, ensure_layout;
		ensure_allpage = ensure_yokogaki = ensure_layout
		= gGlobalSettingManager.loadEnsureAdaptor(
			ensureFactory (function (value) {
				return (typeof value === 'boolean') ? value : undefined;
			}, false)
		);
		var ensure_alwayeOpen = gGlobalSettingManager.loadEnsureAdaptor(
			ensureFactory (function (value) {
				return (typeof value === 'boolean') ? value : undefined;
			}, gSiteParser.alwaysOpenDefault)
		);
		var ensure_slidePos = gGlobalSettingManager.loadEnsureAdaptor(
			ensureFactory (function (value) {
				return (typeof value === 'number')
					// && (value >= ZOOM_SLIDER.MIN && value <= ZOOM_SLIDER.MAX)
					? value : undefined;
			}, ZOOM_SLIDER.DEFAULT)
		);
		var ensure_fontType = gGlobalSettingManager.loadEnsureAdaptor(
			ensureFactory (function (value) {
				return (typeof value === 'string') ? value : undefined;
			}, '')
		);

		// multi-loadのwhen待ちだとreject(fail)で問題がでるが、
		// loadEnsureはreject時にもensure_fxを使ってデフォルト値でresolveする
		$.when(
			gGlobalSettingManager.loadEnsure ('fontType', ensure_fontType)
			, gGlobalSettingManager.loadEnsure ('alwaysOpen', ensure_alwayeOpen)
			, gGlobalSettingManager.loadEnsure ('allpage', ensure_allpage)
			, gGlobalSettingManager.loadEnsure ('yokogaki', ensure_yokogaki)
			, gGlobalSettingManager.loadEnsure ('layout', ensure_layout)
			, gGlobalSettingManager.loadEnsure ('slidePos', ensure_slidePos)
		).then (
			function (fontType, alwaysOpen, allpage, yokogaki, layout, slidePos) {
				setGlobalFontType (fontType, WITHOUT_SAVE);
				setGlobalAlwaysOpen (alwaysOpen, WITHOUT_SAVE);
				setGlobalAllpage (allpage, WITHOUT_SAVE);
				setGlobalYokogaki (yokogaki, WITHOUT_SAVE);
				setGlobalLayout (layout, WITHOUT_SAVE);
				setGlobalSlidePos (slidePos, WITHOUT_SAVE);
			}
		).then(
			function () {
				// 何故か横書きだけは保存してなかった
				gGlobalSettingManager.save ('fontType', gFontType);
				gGlobalSettingManager.save ('alwaysOpen', gAlwaysOpen);
				gGlobalSettingManager.save ('allpage', gAllpage);
				gGlobalSettingManager.save ('yokogaki', gYokogaki);
				gGlobalSettingManager.save ('layout', gLayout);
				gGlobalSettingManager.save ('slidePos', gSlidePos);
			}
		).then(function() {
			dfrd.resolve();
		});
		return dfrd.promise();
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
	// jumpTo内でもjumpTo.LAST_PAGE_NO
	// としないといけない
	// gJumpController.jumpToにして
	// gJumpController.FIRST_SECTION_NO
	// としておけば、this.FIRST_SECTION_NOでいい
	// 関数呼び出しかメソッド呼出しかの違いだが…
	// 使う側からすればどれも似たような感じ
	var CURRENT_SECTION_ID_WITH_REDRAW = -2;
	var CURRENT_SECTION_ID_WITH_RELOAD = -1;
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

	// widget系はbindするものにattrでjump先を仕込んで
	// handlerではそれを読み出して移動するようにして
	// 完全共通ハンドラにしてしまう

	// 汎用:ページナビでも使っているがcloseはいらないのか？
	var clickJumpHandlerFactory = function (secId, pageNo) {
		// bindのfunction objectで使うためのコンテキスト
		var ctx = {secId: secId, pageNo: pageNo};
		return function() {
			jumpTo (ctx.secId, ctx.pageNo);
		};
	};
	// indexからのjump
	var autoHideClickJumpHandlerFactory = function (frame, secId, pageNo) {
		var ctx = {
			frame: frame,
			secId: secId,
			pageNo: pageNo,
		};
		return function() {
			jumpTo (ctx.secId, ctx.pageNo);
			ctx.frame.hide();
		};
	};

	////////////////////////////////////////////////////////

	// colorTheme関連はどこから取るかはsite毎だが、
	// 値を管理するのは別にサイト側objectでする必要はない
	// 内部形式同士の場合はbgColor,bgImageで
	// cssの場合はbackground-color等
	// backgroundColorはDOM？
	var gThemeManager = {
		color: {
			color: '#000',
			bgColor: '#ffffff',
			bgImage: null,
		},
		// onLoad handlerはどうせ変更することはなかろう
		onLoadHandler: showPage,

		$setBackgroundByUrl: function (theme, url) {
			theme.bgImage = $('<img>').get(0).attr('src', url);
			if (this.onLoadHander !== undefined) {
				theme.bgImage.on('load', this.onLoadHandler);
			}
			return theme;
		},

		// 引数は([theme], props|jquery)で省略時はthis.color
		// 省略時の戻りはthisそのもの(theme指定時はthemeを戻す)
		// bgImageを設定した時、bgColorを適切に設定するのは呼出し側の責務
		// ただし、ctxの場合はこちらで行う
		setColorTheme: function (theme, props) {
			var ret = theme;
			if (props === undefined) {
				props = theme;
				theme = this.color;
				ret = this;
			}
			if (props.jquery) {
				var ctx = props;
				theme.color = ctx.css('color');
				this.setBackground (theme, ctx);
			} else {
				$.extend(theme, props);
				if (theme.bgImage !== null
					&& theme.bgImage !== 'none' && theme.bgImage !== '') {
					this.$setBackgroundByUrl(theme, theme.bgImage);
					// theme.bgColor = '#ffffff';
				}
			}
			return ret;
		},
		setBackground: function (theme, ctx) {
			var ret = theme;
			if (ctx === undefined) {
				ctx = theme;
				theme = this.color;
				ret = this;
			}
			theme.bgImage = ctx.css('background-image');
			theme.bgColor = ctx.css('background-color');
			if (theme.bgImage === null
				|| theme.bgImage === 'none' || theme.bgImage === '') {
				theme.bgImage = null;
			} else {
				var url = this.bgImage.match(/^url\(([^\)]*)\)/)[1];
				this.$setBackgroundByUrl (theme, url);
				theme.bgColor = '#ffffff';
			}
			return ret;
		},
		toTextColorTheme: function () {
			var s = 'color: ' + this.color.color + ';'
				+ 'background-color: ' + this.color.bgColor + ';'
				;
			if (this.color.bgImage) {
				s += 'background-image: url(' + this.color.bgImage.src + ');';
			}
			return s;
		},
		toCssColorTheme: function (dest) {
			if (dest === undefined) {
				dest = {};
			}
			dest.color = this.color.color;
			dest.backgroundColor = this.color.bgColor;
			dest.backgroundImage = (this.color.bgImage === null) ? null
					: 'url(' + this.color.bgImage.src + ')';
			return dest;
		},
		// onloadはいいのかな？
		applyColorTheme: function (ctx, theme) {
			if (theme === undefined) {
				theme = this.color;
			}
			ctx.css({
				color: theme.color,
				backgroundColor: theme.bgColor,	// DOM css name?
			});
			if (theme.bgImage && theme.bgImage !== 'none') {
				ctx.css('background-image', 'url(' + theme.bgImage + ')');
			} else {
				ctx.css('background-image', 'none');
			}
		},
		applyNone: function (ctx) {
			ctx.css({
				color: '',
				backgroundColor: '',
				backgroundImage:'',
			});
		},
	};


	/////////////////////////////////////////////////////////////////
	// ダウンロード関連のDOM管理等
	// * これは'noja_download_*'部分のマネージメントだけを行う
	// html import/exportの下請け
	var gDownloadFileManager = {
		$idPrefix: 'noja_download_',
		$id: 'noja_download_file_main',
		$selector: '#noja_download_file_main',
		get $ () {
			return $('#noja_download_file_main');
		},
		// アプリモードのtagを想定しているので、アプリモード前提になる
		// これはimportもアプリモード機能だから
		replaceAll: function (downloadFileMain) {
			// 画面側('#noja'はapp/index.htmlの中にあるtag
			$('#noja').empty().append(downloadFileMain);
		},
		// 順番に並ぶようにprev管理しながら挿入しているが、
		// div単位でsection毎にtreeでまとまっているなら
		// 後からsortしてもよいのでは？(重複チェックが面倒か？)
		// notifyはdb側のレコード更新のためのhook
		margeSections: function (new_section, notifyFn) {
			if (notifyFn === undefined) {
				notifyFn = null;
			}
			var idPrefix = this.$idPrefix;
			var prev = null;
			for (var sec_no = 1; sec_no < new_sections.length; ++sec_no) {
				var sec_id = idPrefix + 'section_' + sec_no;
				var existInDest = gSectionManager.isExist(sec_no);
				if (sec_no in new_sections) {
					var sec = new_sections[sec_no];
					var itemDiv = $(gSectionManager.toDivHtml (
						sec_no, sec, idPrefix));
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
							$(this.$selector)
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
		// この２つはtarget ctxが管理課のfile_mainになるのでgThemeManagerとは独立
		// 引数のbindしていない後続部分はgThemeManagerと同一にしておくこと
		// jQuery objectがうまく取れないようならprops側をgetter化して対応するので
		// こちらは変えない。
		setColorTheme: gThemeManager.applyColorTheme
			.bind(gThemeManager, this.$),
		resetColorTheme: gThemeManager.applyNone
			.bind(gThemeManager, this.$),
		// dataRoot直下のdivから各download_sectionを取り出す
		// 取り込みだけでsplitするのは凶悪なので呼出し側に任せる
		// fnはsection毎のprogress
		// @@ TODO @@
		// destに貯めるようになっているが、progress経由で呼出し側が
		// stockするように変更する？
		// deferred化してpipeline処理できるようにする
		// prefix省略は内蔵デフォルト値を意味する
		// prefixなしを指定する場合は明示的に''を指定する
		toDataAll: function (dest_sections, dataRoot, fn, prefix) {
			if (prefix === undefined) {
				prefix = this.$idPrefix;
			}
			if (fn === undefined) {
				fn = null;
			}
			var cs = function (clsName) {
				return '.' + prefix + clsName;
			};
			var getIdValue = function (idString) {
				var sectionPrefix = prefix + 'section_';
				if (idString !== null && idString.startsWith(sectionPrefix)) {
					return parseInt(idString.substr(sectionPrefix.length));
				}
				return null;
			};
			var min_max_sec_no = new MinMaxRecorder();
			dataRoot.children('div').each(function () {
				console.debug('this', this, $(this));
				console.debug('id', $(this).attr('id'));
				var secId = getIdValue($(this).attr('id'));
				min_max_sec_no.update(secId);
				var sec = {};
				sec.chapter_title = getText(cs('chapter_title'), this);
				//
				sec.subtitle = getText(cs('subtitle'), this);
				//
				sec._maegaki = getHtml(cs('maegaki'), this);
				sec._atogaki = getHtml(cs('atogaki'), this);
				sec._honbun = getHtml(cs('honbun'), this);
				if (fn !== null) {
					if (!fn(sec, secId)) {
						return false;
					}
				}
				dest_sections[secId] = sec;
				return true;
			});
			return min_max_sec_no;
		},
		// download_file領域への貼り付けで使う
		// @@ TODO @@ Idタイプのサイトの場合に検索に困る
		insertSection: function (secId, secData) {
			var idPrefix = this.$idPrefix;
			var reId = RegExp(idPrefix + 'section_(.*)');
			var root = $('#' + idPrefix + 'file_main');
			// idの数値部分で探す
			var prev = (function (elems, secId) {
				var prev = null;
				for (var i = 0; i < elems.size(); ++i) {
					var t = elems.eq(i);
					var n = t.attr('id').match(reId)[1];
					if (n >= secId) {
						break;
					} else {
						prev = t;
					}
				}
				return prev;
			})(root.children('div'), secId);
			var divHtml = gSectionmanager.toDivHtml (secId, secData, idPrefix);
			if (prev === null) {
				root.prepend(divHtml);
			} else {
				prev.after(divHtml);
			}
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
			return popupMenu.iterate (function (menu) {
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

	$.templates('twitterTextTmpl','#TwitterText');
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
			$(this).on('click', handler)
				.on('press', handler);
		});
	};





//////////////////////////////////////////////////////////////////////

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

	// noja_option.appmode: これは廃止

	function AppModeSite (url, templates) {
		this.cls = AppModeSite;
		if (templates === undefined) {
			templates = this.cls.templates;
		}
		console.debug('ctor start');
		// templateで使うもの+import/exportで使うもの
		// author,titleあたりはgetter/setterを定義して
		// top階層からアクセスできるようにするほうがいいのかも
		// (厳密にはsiteInfoじゃなくて作品info部分)
		this.siteInfo = {
			siteName: this.cls.siteInfo.siteName,
			site:     this.cls.siteInfo.site,
			site2:    this.cls.siteInfo.site2,
			api:      this.cls.siteInfo.api,
			//
			basePageURL: url,
			// 主にテンプレとimport/export
			ncode: "",
			ncode2: "",
			author: null,
			title: null,
			//
			token: '',
			// login可否でテンプレ切り替えすることがある
			login: false,
		};
		// ちょっと記述効率が悪い:mapすべきか
		if (false) {
			createProxyAccessor.generate (this, this.siteInfo, {
				siteName: createProxyAccessor.ACCESSOR,
				basePageURL: createProxyAccessor.ACCESSOR,
				api: createProxyAccessor.ACCESSOR,
				site: createProxyAccessor.ACCESSOR,
				site2: createProxyAccessor.ACCESSOR,
				ncode: createProxyAccessor.ACCESSOR,
				ncode2: createProxyAccessor.ACCESSOR,
				author: createProxyAccessor.ACCESSOR,
				title: createProxyAccessor.ACCESSOR,
				token: createProxyAccessor.ACCESSOR,
				login: createProxyAccessor.ACCESSOR,
			});
		}

		console.debug('bind template');
		applyTemplate.generate (this, templates, this.siteInfo);
		console.debug('import method');
		this.parseURL = this.cls.parseURL.bind(this.cls);


		//// mixinというかdispatcherというか… ////
		console.debug('bind dispatcher');
		// (dest,key,src)のdestを固定して、汎用で、(key,src)を指定する
		this.setSiteInfoGeneric = filterCopyProperties.bind(this, this.siteInfo);
		this.setSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, api:0,
		});
		// restore機能用
		this.restoreSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode2:0,
		});
		// import用
		this.restoreSiteInfoForImport = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode:0, ncode2:0, author:0, title:0,
		});
		// filterCopyProperties(keys, src)の全束縛
		// あるいは
		// filterCopyProperties({}, keys, src)の全束縛
		// にしてしまってもよいが…
		this.getSiteInfoForSaveData = filterCopyProperties.bind(this, {
			site: 0, site2:0, ncode:0, ncode2:0,
		}, this.siteInfo);


		// NovelIdによるカスタム設定を初期設定に読み込むか？
		this.isInitializeByCustomSetting = false;
		//
		this.enableReputationForm = false;
		//
		this.alwaysOpenDefault = true;

		// 内部用
		this.maxSectionNo = 1;

		console.debug('ctor done');
	}
	// AppModeSite.prototype = {
	//	method_A: function () {},
	//	method_B: function () {},
	// }
	AppModeSite.siteInfo = {
		siteName: 'アプリモード',
		site:  'http://naroufav.wkeya.com/noja/',
		site2: 'http://naroufav.wkeya.com/noja/',	// private
		api:   '',
		//
		$reURL: /chrome:\/\/noja\/content\/app\/index\.html/,
	};
	AppModeSite.parseURL = function (url, relative) {
		if (relative === true) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.siteInfo.site + url;
		}
		var m = this.siteInfo.$reURL.exec (url);
		if (m) {
			return {m: m, };
		}
		return null;
	};
	// ダミー
	AppModeSite.templates = {
		$getSiteURL:				'{{:site}}{{:path}}',
		$getNovelBaseURL:			'{{:site}}{{:ncode}}/',
		$getNovelIndexURL:			'{{:site}}{{:ncode}}/',
		$getNovelSectionURL:		'{{:site}}{{:ncode}}/{{:sectionId}}/',
		//
	};
	// 相対pathなら絶対path化する
	AppModeSite.prototype.$toAbsoluteURL = function (url) {
		if (!url.startsWith(this.siteInfo.site)) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.$getSiteURL ({path: url});
		}
		return url;
	};


	// 「のじゃー」ラベルを元ページに貼り付け
	AppModeSite.prototype.initialize = function () {
		// AppModeだと不要のはず？
		$('#novelnavi_right').append(getNojaLabel());

		gThemeManager.setColorTheme({
			color: '#000',
			bgColor: $('body').css('background-color'),
			bgImage: null,
		});
	};

	// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	AppModeSite.prototype.onReadyNoja = function () {
		//
	};


	AppModeSite.prototype.onOpenNoja = function () {
		this.prepareUiOnOpenNoja ();
		// openのタイミングで非同期に動かすならここに書く
	};

	AppModeSite.prototype.onCloseNoja = function () {
		this.prepareUiOnCloseNoja ();
	};

	// ncode,ncode2,site,site2はいる
	AppModeSite.prototype.getNovelId = function () {
		return this.siteInfo.ncode;
	};

	AppModeSite.prototype.getTitle = function () {
		return this.siteInfo.title;
	};
	AppModeSite.prototype.getAuthor = function () {
		return this.siteInfo.title;
	};

	AppModeSite.prototype.setToken = function (token) {
		this.siteInfo.token = token;
		this.siteInfo.login = (token !== '');
	};

	// Deferred objectを返す
	// ページを読み込みparseして返す
	AppModeSite.prototype.getNovelSection = function (secId) {
		var self = this;
		if (!gNetworkManager.acquire()) {
			return new $.Deferred().reject().promise();
		}
		return $.get(this.$getNovelSectionURL (secId))
		.always(function () {
			gNetworkManager.release();
		}).then(function (htmldoc) {
			return new $.Deferred()
				.resolve(self.parseHtmlContents(htmldoc, secId));
		});
	};
	// これは上で使われる:template化
	AppModeSite.prototype.$getNovelSectionURL = function (section) {
		return this.siteInfo.site + this.siteInfo.ncode + '/' + section + '/';
	};

	/////////////// 後は全部class内部でframe構築等で使っているもの
	// Twitterリンク用→未使用予定
	AppModeSite.prototype.$getNovelBaseURL = function (novel_code) {
		return this.siteInfo.site + this.siteInfo.ncode + '/';
	};


	AppModeSite.prototype.getNextSection = function (secId) {
		return secId;
	};

	AppModeSite.prototype.getPrevSection = function (secId) {
		return secId;
	};
	// maxSectionNoは現在読み込まれている最大の話。
	AppModeSite.prototype.isLoadableSection = function (sec) {
		return false;
		//return (sec <= this.maxSectionNo);
	};
	AppModeSite.prototype.updateMaxSection = function (secId, force) {
		//this.maxSectionNo = (force === true) ? secId : Math.max(this.maxSectionNo, secId);
	};





	AppModeSite.prototype.prepareUiOnOpenNoja = function () {
		$('body').css('overflow', 'hidden');
	};
	AppModeSite.prototype.prepareUiOnCloseNoja = function () {
		$('body').css('overflow', 'visible');
	};


	AppModeSite.prototype.$rebuild_form_user_type = function () {
		['#noja_impression_usertype', '#noja_novelreview_usertype']
			.forEach(function (elem) {
				$(elem).empty();
			});
	};


	// アプリモードだと元ページは解析不要
	// tokenを取り出す
	// これはtabをまたいでlogin tokenを使いまわすための仕組みらしい
	// ただし、login以前に開いたtabに通知が来るわけではない
	AppModeSite.prototype.parseInitialPage = function () {
		gCurrentManager.setSingleSection ();
		return gTokenManager.get ().then(
			function(token) {
				gSiteParser.setToken(token);
			},
			function () {
				// 読まなかったときのことは考えないない
			}
		);
	};

	AppModeSite.prototype.$rebuild_twitter_link = function (link) {
		link.attr('href', Twitter.createURL ({
			url: this.$getNovelBaseURL(),
			title: this.siteInfo.title,
			hash1: '#narou',
			hash2: '#narou' + this.siteInfo.ncode.toUpperCase(),
		}))
		.find('img').attr('src', IMG_TWITTER_BANNER);
	};

	// とりあえずダミー
	AppModeSite.prototype.$rebuild_impression_form = function () {
		var form = $('#noja_f_cr > form');
		form.attr('action', '');
		// idついているのでは？
		form.children('div:eq(0)').children('a:eq(0)').attr('href', '');
		form.children('div:eq(0)').children('div:eq(0)').before('※ダミーです');
	};

	AppModeSite.prototype.$rebuild_review_form = function () {
		var form = $('#noja_r_fc > form');
		form.attr('action', '');
		// idついているのでは？
		form.children('div:eq(0)').children('a:eq(0)').attr('href', '');
		form.children('div:eq(0)').children('div:eq(0)').before('※ダミーです');
	};



	// 評価formの構築
	// 初期化最終段階:コンテンツimport後
	AppModeSite.prototype.$buildReputationForm = function() {
		var h = $('#noja_hyouka');
		h.find('.novel_hyouka form').attr('action', '');
		h.find('.novel_hyouka .agree').html('※ダミーです');
		setupFormRadiobox (h);
		this.$rebuild_impression_form ();
		this.$rebuild_review_form ();
		this.$rebuild_twitter_link (h.find('.hyouka_in:eq(1) > a'));
	};

	// restore,importで使われる
	AppModeSite.prototype.rebuildFormsOnImportRestore = function () {
		this.$rebuild_form_user_type ();
	};


	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	AppModeSite.prototype.selectNojaIndexData = function () {
		var indexSelector = '#noja_index';
		return $(
			[
				'div.novel_title',
				'div.novel_writername',
				'#novel_ex',
				'div.index_box'
			].map(function (selector) {
				return indexSelector + ' ' + selector;
			}).join(', ')
		);
	};

	// セクション変更毎に設定しなおすもの
	AppModeSite.prototype.rebuildUiOnChangeSection = function(section_no) {
		// linkmenu等
	};


	AppModeSite.prototype.$setupLinkMenu = function (linkmenu) {
		// none
		// @@ TODO @@
		// 一から構築しないといけない
	};

	// 多分抜き出しても大丈夫だと思うが変数束縛はチェックしていない
	// 初期化段階でのメニューカスタマイズ
	AppModeSite.prototype.uiCustomSetup = function () {
		this.$setupLinkMenu ($('#noja_link'));
		this.$buildReputationForm ();
		$('#noja_link').empty();
		$('#noja_link').append($('#AppModeSite_linkmenu').render({}));
		$('#noja_import_container')
			.html($('#AppModeSite_import_menuitem').render({
				url: APP_YOMIKOMI_SETUMEI,
			}));
		$('#noja_saveload_container')
			.append($('#AppModeSite_saveload_booklist_menuitem').render({}));
		$('#noja_version')
			.append($('#AppModeSite_version_extra_menuitem').render({
				url: APP_KOKUHAKU,
			}));


		$('#noja_closelink').on('click', function() { $('#noja_link').hide(); });
		$('#noja_file').on('change', app_fileLoadHandler);
		$('#noja_booklist').on('click', buildAndShowBookList);

		// アプリモードでの内蔵htmlリソース読み込みの場合は整形式なので
		// そのまま直接gHtmlPortManager.nojaImportを呼ぶ
		// 読み込み関連はattrでファイル名を指定する共通ハンドラ化したほうがいい？
		var app_builtin_content_load_handler = function () {
			gHtmlPortManager.nojaImport(ResourceManager.load (
				$(this).attr('noja_import_file_url'))
			).then(
				jumpToTop
				// format mismatchでエラーが出ることはあるが無視
			);
		};
		$.each(['#noja_yomikomi', '#noja_kokuhaku'], function(index, selecttor) {
			$(selector).on('click', app_builtin_content_load_handler);
		});
	};

	// Deferred interface
	AppModeSite.prototype.importInitialContents = function () {
		return gHtmlPortManager.nojaImport (ResourceManager.load (APP_SETUMEI));
	};


	AppModeSite.prototype.replaceImageURL = function (url) {
		return url;
	};

	// download_file領域への貼り付け
	// アプリモードで取り込む場合は画面内の置場に貯めておかないと
	// のじゃーcloseしたときに困るので常時enable
	AppModeSite.prototype.autoPagerize = function (secId, secData) {
		gDownloadFileManager.insertSection (secId, secData);
	};


	//////////////////////////////////////////////////////////////////
	function NarouNocMoonSite() {
		// place holder for common method
	}
	//////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////
	function NarouSite(url, templates) {
		this.cls = NarouSite;
		if (templates === undefined) {
			templates = this.cls.templates;
		}
		// これは$.extend(this.siteInfo, cls.siteInfo, {custom});
		// とかでマージした方がよさそう
		this.siteInfo = {
			siteName: this.cls.siteInfo.siteName,
			site:     this.cls.siteInfo.site,
			site0:    this.cls.siteInfo.site0,
			site2:    this.cls.siteInfo.site2,
			siteS:    this.cls.siteInfo.siteS,
			api:      this.cls.siteInfo.api,
			//
			basePageURL: url,
			ncode: null,
			ncode2: null,
			author: null,
			title: null,
			//
			token: '',
			login: false,
		};

		applyTemplate.generate (this, templates, this.siteInfo);
		this.parseURL = this.cls.parseURL.bind(this.cls);

		////// mixinというかproxy /////
		// 汎用で、(keys,src)を指定する
		this.setSiteInfoGeneric = filterCopyProperties.bind(this, this.siteInfo);
		this.setSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, api:0,
		});
		// restore機能用
		this.restoreSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode2:0,
		});
		// import用
		this.restoreSiteInfoForImport = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode:0, ncode2:0, author:0, title:0,
		});
		// filterCopyProperties(keys, src)の全束縛
		// あるいは
		// filterCopyProperties({}, keys, src)の全束縛
		// にしてしまってもよいが…
		this.getSiteInfoForSaveData = filterCopyProperties.bind(this, {
			site: 0, site2:0, ncode:0, ncode2:0,
		}, this.siteInfo);





		// NovelIdによるカスタム設定を初期設定に読み込むか？
		this.isInitializeByCustomSetting = true;
		//
		this.enableReputationForm = true;	// @@ ここをfalseにする @@
		//
		this.alwaysOpenDefault = false;


		var m = this.parseURL (url);
		if (m) {
			this.siteInfo.ncode = m.novelId;
			this.secNo = m.sectionId;
			// 目次ページと短編の識別ができていない状態なので仮設定
			this.isSingleSection = m.isBaseURL;
		} else {
			// 本来formatがあっていてcreateされているはずなので有りえない
		}
		this.maxSectionNo = this.secNo;

	}


	// なろう系の場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない

	NarouSite.siteInfo = {
		siteName: '小説家になろう',
		site:  'http://ncode.syosetu.com/',
		site2: 'http://novelcom.syosetu.com/',
		api:   'http://api.syosetu.com/novelapi/api/',
		// extra
		site0: 'http://syosetu.com/',	//
		siteS: 'http://static.syosetu.com/',
		//
		// m[2]はleading '/'を含んだ文字列
		// 短編のときはm[2]とm[3]が空になるはず
		$reURL: /http:\/\/ncode\.syosetu\.com\/([nN][0-9A-Za-z]+)(\/([0-9]+))?/,
	};
	NarouSite.parseURL = function (url, relative) {
		if (relative === true) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.siteInfo.site + url;
		}
		var m = this.siteInfo.$reURL.exec(url);
		if (m) {
			return {
				novelId: m[1].toLowerCase(),
				sectionId: parseInt(m[3]),
				isBaseURL: !m[2],
				//
				m: m,
			};
		}
		console.debug('parseURL failed: !m');
		return null;
	};
	NarouSite.prototype.$getSectionIdFromURL = function (url) {
		var m = this.parseURL (url, true);
		if (m) {
			return m.sectionId;
		}
		return null;
	};


	NarouSite.templates = {
		$getLoginURL:				'{{:site0}}login/input/',
		$getUserTopURL:				'{{:site0}}user/top/',
		$getApiGANURL:				'{{:api}}' + NAROUAPI_AJAX_GET_OPT + '{{:ncode}}',
		//
		$getSiteURL:				'{{:site}}{{:path}}',
		$getNovelBaseURL:			'{{:site}}{{:ncode}}/',
		$getNovelIndexURL:			'{{:site}}{{:ncode}}/',
		$getNovelSectionURL:		'{{:site}}{{:ncode}}/{{:sectionId}}/',
		//
		$getNovelViewInfotopURL:	'{{:site}}novelview/infotop/ncode/{{:ncode}}/',
		//
		// list baseはncode2取り出しで使うもの
		$getImpressionConfirmURL:	'{{:site2}}impression/confirm/ncode/{{:ncode2}}/',
		$getImpressionListBaseURL:	'{{:site2}}impression/list/ncode/',
		$getImpressionListURL:		'{{:site2}}impression/list/ncode/{{:ncode2}}/',
		//
		$getNovelReviewConfirmURL:	'{{:site2}}novelreview/confirm/ncode/{{:ncode2}}/',
		$getNovelReviewListURL:		'{{:site2}}novelreview/list/ncode/{{:ncode2}}/',
		//
		$getNovelPointRegisterURL:	'{{:site2}}novelpoint/register/ncode/{{:ncode2}}/',
		//
		// しおり関連はなろうとのくむんで違う
		$getBookmarkImageURL:		'{{:siteS}}view/images/bookmarker.gif',
		$getShioriPrefixURL:		'{{:site0}}bookmarker/add/ncode/',
		$getShioriURL:				'{{:site0}}bookmarker/add/ncode/{{:ncode2}}/no/{{:sectionId}}/?token={{:token}}',
	};

	// 相対pathなら絶対path化する
	NarouSite.prototype.$toAbsoluteURL = function (url) {
		if (!url.startsWith(this.siteInfo.site)) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.$getSiteURL ({path: url});
		}
		return url;
	};


	// 「のじゃー」ラベルを元ページに貼り付け
	// 位置が悪い？
	// $('#head_nav')
	//	.append('<li><a id="noja_open" class="menu">のじゃー縦書リーダー</a></li>');
	NarouSite.prototype.initialize = function () {
		$('#novelnavi_right').append(getNojaLabel());

		// ここでsetだとnullのsplitをしにいくのであまりよくないが…
		gCurrentManager.setSingleSection (this.isSingleSection);
		if (!this.isSingleSection) {
			gCurrentManager.setCurrent (this.secNo);
		}

		gThemeManager.setColorTheme({
			color: $('#novel_color').css('color'),
			bgColor: $('body').css('background-color'),
			bgImage: null,
		});

		// uiが絡まず軽い部分は裏で動かしたいところだが
		// まだページparseが終わっていないので目次ページ排除しておらず
		// 無駄なアクセスになる可能性がある
		// 初期ページのparseが終わって文章ページと確定するまで保留
	};

	// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	NarouSite.prototype.onReadyNoja = function () {
		// 目次取得はもう少し早いタイミング
		// (初期ページのparse最後)
	};


	NarouSite.prototype.onOpenNoja = function () {
		this.prepareUiOnOpenNoja ();
		// openのタイミングで非同期に動かすならここに書く
	};

	NarouSite.prototype.onCloseNoja = function () {
		this.prepareUiOnCloseNoja ();
	};



	// apiはflow-control外なので常に動かせるとする
	NarouSite.prototype.$fetchMaxSectionNo = function () {
		var dfrd = new $.Deferred();
		var self = this;
		//console.debug(this.$getApiGANURL());
		$.getJSON (this.$getApiGANURL())
		.then(
			// success: 成功
			function (json) {
				// 還ってこない場合がある？
				//[  0] 最初の要素には全小説出力数が入る(1reqなのでallcount=1)
				//[1～] 一作品ずつ情報が入る。
				//console.debug(json);
				if (json[0].allcount >= 1) {
					if (json[0].allcount != 1) {
						console.debug('api returns with too many data');
					}
					var maxSectionNo = parseInt (json[1].general_all_no);
					console.debug('api got maxSectionNo', maxSectionNo);
					self.maxSectionNo = maxSectionNo;
					if (this.isSingleSection && maxSectionNo != 1) {
						console.debug('singleSection mode: api return != 1:', maxSectionNo);
					}
					dfrd.resolve (maxSectionNo);
				} else {
					// allcount==0を返すこともあるようだ
					console.debug('getJSON: api return no data');
					dfrd.reject ("getJSON no data");
				}
			},
			// error
			function() {
				dfrd.reject ("getJSON failed");
			}
		);
		return dfrd.promise ();
	};


	// ncode,ncode2,site,site2はいる
	NarouSite.prototype.getNovelId = function () {
		return this.siteInfo.ncode;
	};

	NarouSite.prototype.getTitle = function () {
		return this.siteInfo.title;
	};
	NarouSite.prototype.getAuthor = function () {
		return this.siteInfo.author;
	};

	NarouSite.prototype.setToken = function (token) {
		this.siteInfo.token = token;
		this.siteInfo.login = (token !== '');
	};


	// Deferred objectを返す
	NarouSite.prototype.getNovelSection = function (secId) {
		var self = this;
		if (!gNetworkManager.acquire()) {
			return new $.Deferred().reject().promise();
		}
		return $.get(this.$getNovelSectionURL ({sectionId: secId}))
		.always(function () {
			gNetworkManager.release();
		}).then(function (htmldoc) {
			return new $.Deferred()
				.resolve(self.parseHtmlContents(htmldoc, secId));
		});
	};



	// Deferred interface
	NarouSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};


	NarouSite.prototype.replaceImageURL = function (url) {
		// 画像src(@みてみん)のリンクを修正
		// これはなろう固有の話
		return  url.replace('viewimagebig', 'viewimage');
	};

	NarouSite.prototype.getNextSection = function (secId) {
		var newSecId = secId + 1;
		return (newSecId <= this.maxSectionNo) ? newSecId : secId;
	};
	NarouSite.prototype.getPrevSection = function (secId) {
		var newSecId = secId - 1;
		return (newSecId >= 1) ? newSecId : secId;
	};
	NarouSite.prototype.isLoadableSection = function (sec) {
		return (sec <= this.maxSectionNo);
	};
	// APIで取れなかった時
	// 取れても読んでいるうちに更新された時など
	// 変化するのでupdateが必要
	// 殆ど内部用途だが、現状restore,import等から使われるので
	// public扱い
	NarouSite.prototype.updateMaxSection = function (secId, force) {
		//console.debug ('update max', secId, this.maxSectionNo);
		this.maxSectionNo = (force === true)
			? secId : Math.max(this.maxSectionNo, secId);
		//console.debug ('new max', this.maxSectionNo);
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
	NarouSite.prototype.$updateThemeAtSection = function (contents) {
		gThemeManager.setBackground($('body'));
	};


	NarouSite.prototype.$updateAutherAtSection = function (contents) {
		if (this.isSingleSection) {
			// 短編の場合は'.contents1'以前の領域
			this.siteInfo.author = contents.find('.novel_writername')
				.contents()
				.not('a[href^="'+this.$getShioriPrefixURL()+'"]')
				.text().slice(4, -3);
		} else {
			// 一応読み込んだものから著者は再設定しておく？
			// div.contents1の中は
			// span.attention : なろうでの警告は未調査
			// "作者："
			// 作者にanchorがない場合もある
			// p.chapter_titleの手前まで
			// なろうでもR-15のattentionが付く場合はある
			var contents1 = $('<div/>').append(
				contents.find('.contents1')
				.contents()
				.not('span.attention, p.chapter_title')
				.clone()	// cloneしないでappendすると元ページから消える
			).text();
			var author = contents1.match(/\s*作者：\s*(.*)\s*$/)[1];
			this.siteInfo.author = author;	//.replace(RE_G_LINEBREAK, '');
		}
		console.debug('got author', '"' + this.siteInfo.author + '"');
	};

	// 短編と長編でタイトルを取れるdiv領域が違う
	NarouSite.prototype.$updateTitleAtSection = function (contents) {
		if (this.isSingleSection) {
			// 短編
			this.siteInfo.title = getText('.novel_title', contents);
		} else {
			// 連載
			// タイトルは必ずlink付
			var a = contents.find('.contents1 >a:eq(0)');
			var t = a.attr('href');
			if (t == this.siteInfo.site0.slice(0,-1)) {
				// 18禁移動リンクを取ってしまった(短編識別に失敗している？)
				console.debug('missparsed:', t);
			} else {
				this.siteInfo.title = a.text();
			}
		}
	};

	// link解析がindexのa書き換えと同じなのでprivate methodでまとめる
	// nobel_bnは上下2か所になるので上だけ使う
	NarouSite.prototype.$updateRelativeSectionAtSection = function (contents, secId) {
		var relativeLinks = contents.find('#novel_color > div.novel_bn:eq(0) > a');
		var maxSecId = secId;
		var self = this;
		if (relativeLinks.size()) {
			relativeLinks.each (function() {
				var url = $(this).attr('href');
				//console.debug('got relative link', url);
				var relSecId = self.$getSectionIdFromURL(url);
				if (relSecId !== null) {
					maxSecId = Math.max(maxSecId, relSecId);
				}
			});
		}
		//console.debug('update max', maxSecId);
		this.updateMaxSection (maxSecId);
	};


	// ここの判定はなんとか変更したいところ
	// 目次ページは事前に除外されているので、
	// 連載の文章ページor短編の文章ページの識別
	// 短編:18禁移動のリンクアンカー
	// 連載:タイトルページへのリンクアンカー
	// なろうだとattentionはない？
	NarouSite.prototype.$parseSectionType = function (contents) {
		var url = contents.find('.contents1 >a:eq(0)').attr('href');
		// どうもhref要素側URLは'/'がないようだ。
		return (url == this.siteInfo.site0.slice(0, -1));
	};
	// 絞るべきcontextは'#container'のレベルのようだ
	// 短編と長編でタイトルを取れるdiv領域が違う等、
	// これ以上は絞れない
	NarouSite.prototype.$setupVolumeInfo = function (contents) {
		this.isSingleSection = this.$parseSectionType(contents);

		// 短編かどうかの判断はtitleが取れたかどうかで行う
		// title関連の調整とtoken取得等
		gCurrentManager.setSingleSection (this.isSingleSection);
		// なろうの場合は短編と連載でトークンの取る位置が違う？
		var t;
		if (this.isSingleSection) {
			t = contents.find('div.novel_writername > a[href^="'+this.$getShioriPrefixURL()+'"]');
		} else {
			t = contents.find('#novel_contents a[href^="'+this.$getShioriPrefixURL()+'"]');
		}
		this.siteInfo.token = (t.size()) ? t.attr('href').match(/=([0-9a-f]*)$/)[1] : null;
		if (this.siteInfo.token) {
			this.siteInfo.login = true;
			gTokenManager.set (this.siteInfo.token);
		} else {
			this.siteInfo.login = false;
		}
		t = contents.find('#head_nav a[href^="' + this.$getImpressionListBaseURL () + '"]');
		this.siteInfo.ncode2 = (t.size()) ? t.attr('href').match(/([0-9]*)\/$/)[1] : null;
	};

	// '#container'レベルで取ってきたcontents
	NarouSite.prototype.$parseHtmlCommon = function (contents, section) {
		this.$updateRelativeSectionAtSection (contents, section);
		this.$updateAutherAtSection (contents);
		// コンテンツの内容の解析
		var sec = {};
		if (this.isSingleSection) {
			// 短編
			sec.chapter_title = '';
			sec.subtitle = this.siteInfo.title;
		} else {
			// 連載
			sec.chapter_title = getText('.chapter_title', contents);
			sec.subtitle = getText('.novel_subtitle', contents);
		}
		sec._maegaki = getHtml('#novel_p', contents);
		sec._atogaki = getHtml('#novel_a', contents);
		sec._honbun  = getHtml('#novel_honbun', contents);

		return sec;
	};


	////////////////////////////////////////////////////////
	// のじゃーが張り付いた初期ページの解析
	NarouSite.prototype.parseInitialPage = function () {
		var dfrd = new $.Deferred ();
		if (!$('#novel_honbun').size()) {
			return dfrd.reject ();
		}
		var contents = $('#container');
		this.$setupVolumeInfo (contents);
		this.$updateThemeAtSection (contents);
		this.$updateTitleAtSection (contents);

		//
		gSectionManager.registData (gCurrentManager.id
			, this.$parseHtmlCommon (contents, gCurrentManager.id));
		//
		gCurrentManager.setCurrent (gCurrentManager.id);
		// autoPagerが貼り付ける先に独自attrを付ける
		$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
			.attr('data-noja', gCurrentManager.id);
		////////////////////////////////////////
		// 文章ページと確定したので
		// maxNoは取ってしまう
		// 短編のときには実際には不要だが
		// 念のため取得してチェックする
		var self = this;
		this.$fetchMaxSectionNo ().then(
			function (maxSectionNo) {
				// fetch側で設定は行っているので他にすることはない
			}
			// errorならそのまま？
		);
		if (!this.isSingleSection) {
			this.loadIndex ().then(
				function (tocInfo) {
					// 登録処理
					gIndexManager.registIndex (tocInfo);
				}
				// errorならそのまま？
			);
		}
		////////////////////////////////////////
		return dfrd.resolve ();
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
		return this.$parseHtmlCommon (contents, section);
	};


	// @@ TODO @@
	//  標準形式化するところまでを行い、resolveの値として
	// 非同期でdone待ちしているgIndexManagerに一般処理はやらせる
	// (indexページ部分の構造とレイアウトはそちら管轄)
	// 要素をpropsに収めた塊を渡すべきだろう
	// jumpToは汎用化するために、linkのタグにnoja-hogehogeな属性で
	// secNoを埋めておき、ハンドラはそれを拾って飛んでいくようにする
	// (secIdが数値ではないもの対策)
	//
	// @@ とりあえずstyle側の修正だけで様子見
	//$('.index_box', indexDiv)
	//	.css('margin', '')
	//	.css('width', '')
	//	;
	// [オリジナルindex_box]
	//   margin: 0 auto 30px;
	//   width: 720px;

	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	NarouSite.prototype.selectNojaIndexData = function () {
		var indexSelector = '#noja_index';
		return $(
			[
				'div.novel_title',
				'div.novel_writername',
				'#novel_ex',
				'div.index_box'
			].map(function (selector) {
				return indexSelector + ' ' + selector;
			}).join(', ')
		);
	};

	NarouNocMoonSite.prototype.$reformIndex = function (toc_index) {
		var chapterTitles = toc_index.find('>.chapter_title');
		var endIndex = chapterTitles.size();
		if (endIndex) {
			// 
			chapterTitles.each(function (index) {
				var startPos = toc_index.children().index($(this)) + 1;
				var children;
				if ((index + 1) == endIndex) {
					children = toc_index.children().slice(startPos);
				} else {
					var next = chapterTitles.eq(index + 1);
					var endPos = toc_index.children().index(next);
					children = toc_index.children().slice(startPos, endPos);
				}
				$(this).after($('<div/>').append(children));
				$(this).removeClass('chapter_title');
				$(this).addClass('noja_toc_index_chapter_title');
			});
		}
		// 元ページのスタイル指定を外すためにclassを消す
		//toc_index.find('.novel_sublist2').removeClass('novel_sublist2');
		//toc_index.find('.subtitle').removeClass('subtitle');
		//toc_index.find('.long_update').removeClass('long_update');
	};


	NarouSite.prototype.$reformIndex = NarouNocMoonSite.prototype.$reformIndex;


	// 未修正だったauthorとシリーズも対応
	// シリーズはタイトル部と一緒にする
	// @@ TODO @@ toc部分linkはcleanにしたがjavascript経由のjumpはcleanではない
	NarouSite.prototype.$parseIndexPage = function (htmldoc) {
		var self = this;
		// もうちょい限定したほうがいい？意味的には一つ上位の'#novel_contents'だが
		// parseHTMLが戻すのはDOM element arrayなのでobject化してから使う
		var indexPage = $($.parseHTML(htmldoc)).find('#novel_color');
		var tocInfo = {
			totalSections: this.maxSectionNo,	// 取得失敗なら0のまま
			series:      indexPage.find('p.series_title'),	// 確認済
			title:       indexPage.find('p.novel_title'),
			author:      indexPage.find('div.novel_writername'),
			description: indexPage.find('#novel_ex'),	// div
			index:       indexPage.find('div.index_box'),
			index_accordion_header: '>div.noja_toc_index_chapter_title',
		};
		console.debug(tocInfo);

		// シリーズのlinkを絶対リンク化
		// (contentsページからの位置とindexページからの位置で階層が違う)
		tocInfo.series.find('a').each(function() {
			var url = $(this).attr('href');
			$(this).attr('href', self.$toAbsoluteURL(url));
		});

		// title:内部保存の変数を更新する
		var title = tocInfo.title.text();
		if (title != this.siteInfo.title) {
			// this.siteInfo.title = title;
			console.debug('index title mismatch:', title, this.siteInfo.title);
		}

		// author:内部保存の変数を更新する
		// "作者："を削る
		var author = tocInfo.author.contents();
		if (author.size()) {
			author = author.text().match(/\s*作者：(.*)\s*$/)[1];
			if (author != this.siteInfo.author) {
				//this.siteInfo.author = author;
				console.debug('index author mismatch: author', '"' + author + '"');
				console.debug('index author mismatch: kept author', '"' + this.siteInfo.author + '"');
			}
		}

		// あらすじ部分:特になし

		// index部分
		// href無効化、css設定、click handler設定
		// 多分、urlからsecIdを出すほうがいいはず
		// マウスカーソルをlinkクリック可能な表示に変えるためのcss指定
		var indexItemStyle = {
			'cursor': 'pointer',
		};
		// 指定を付ける要素が違う？
		// どこに何がついているか調べなおさないといけない
		// div.index_box
		//   div.chapter_title : 章題分けていない場合は付かない
		//   dl.novel_sublist2 : onclickでlocation.href変更jump:03/20になくなった
		//    dd.subtitle > a  : hrefにlink
		//    dt.long_update   : 更新日時
		// 章題～章題が章内(div.chapter_title内に入っていない
		this.$reformIndex(tocInfo.index);
		// 
		// apiが値を返さないこともあるのでmaxは計算しないといけない
		// 2014/03/20のなろうの仕様変更でjavascriptでのjumpがなくなったようだ
		// 結局サブタイ部分のanchorでのjumpのみに戻った(Chromeのwheel関連の都合らしい)
		var totalSections = 0;
		var maxSectionNo = 0;
		// aで回さずにdl.novel_sublist2で回すべきか？
		$(tocInfo.index).find('a').each(function () {
			var url = $(this).attr('href');
			var secId = self.$getSectionIdFromURL(url);
			if (secId !== null) {
				$(this).attr('noja_jumpTo', secId);
				maxSectionNo = Math.max(maxSectionNo, secId);
				++totalSections;
			}
			$(this).attr('href', null)		// @@ TODO @@ Javascript側のcleanup
			.css(indexItemStyle)
			;
		});
		if (totalSections != maxSectionNo) {
			console.debug('totalSections != maxSectionNo', totalSections, maxSectionNo);
		}
		// APIで取れないことや、コンテンツ更新されるタイミングもあるので更新する
		this.updateMaxSection (maxSectionNo);
		tocInfo.totalSections = maxSectionNo;
		return tocInfo;
	};

	///////////////////////////////////////////
	// indexは帯域制御外とする
	// ただし、自分自身の多重loadだけは避ける
	NarouSite.prototype.loadIndex = function () {
		// 既に動いている途中ならそれを返す
		if (('deferredFetchIndex' in this)
			&& this.deferredFetchIndex !== null
			&& this.deferredFetchIndex.state() == 'pending') {
			return this.deferredFetchIndex;
		}
		// 初回or完了済の更新
		var self = this;
		this.deferredFetchIndex = $.get (this.$getNovelIndexURL()).then(
			//success:
			function(htmldoc) {
				var tocInfo = self.$parseIndexPage (htmldoc);
				return new $.Deferred().resolve (tocInfo).promise();
			}
			// error: そのままgetのfailを返す
		);
		return this.deferredFetchIndex.promise();
	};




	NarouSite.prototype.prepareUiOnOpenNoja = function () {
		$('body').css('overflow', 'hidden');
		$('#novel_header').hide();
	};
	NarouSite.prototype.prepareUiOnCloseNoja = function () {
		$('#novel_header').show();
		$('body').css('overflow', 'visible');
	};


	NarouSite.prototype.uiCustomSetup = function () {
		// 初期化段階でのメニューカスタマイズ
		this.$setupLinkMenu ($('noja_link'));
		this.$buildReputationForm ();
	};

	NarouSite.prototype.rebuildUiOnChangeSection = function(secId) {
		this.$setShioriLink(secId);
	};




	// なろう系のみ:linkMenuの最初の項目
	NarouSite.prototype.$getLoginOrUserTopInfo = function () {
		if (this.siteInfo.login) {
			return {
				url: this.$getUserTopURL(),
				text: 'マイページ',
			};
		} else {
			return {
				url: this.$getLoginURL(),
				text: 'ログイン',
			};
		}
	};


	NarouSite.prototype.$setShioriLink = function(secId) {
		$('#noja_shiori').attr('href', this.$getShioriURL({sectionId: secId}));
	};



	// 元の構造はnoja_view.html側で定義されている
	NarouSite.prototype.$setupLinkMenu = function (linkmenu) {
		var a = linkmenu.find('a');
		var loginOrUserTop = this.$getLoginOrUserTopInfo();
		a.eq(1).attr('href', loginOrUserTop.url).text(loginOrUserTop.text);
		a.eq(2).attr('href', this.$getNovelViewInfotopURL());
		a.eq(3).attr('href', this.$getImpressionListURL());
		a.eq(4).attr('href', this.$getNovelReviewListURL());

		// '#noja_shiori'部分は読み込み時に更新する
		if (this.login) {
			// linkのidは'noja_shiori'
			linkmenu.append(
				$('#NarouSite_bookmark').render({src: this.$getBookmarkImageURL()})
			);
			this.$setShioriLink(gCurrentManager.id);
			// 登録済のときは単なるtextで未登録のときはa付のリンクになっている
			// @@ TODO @@ お気に入り解除のBoomarklet機能をimportするか？
			linkmenu.append(
				$('<div/>').append($('#head_nav > li:contains("登録")').clone())
			);
		}
		// img tagそのものを引っ張ってくるのにhtml()が使えないので
		// 要素としてつける
		// @@ TODO @@ clone後のidの変更対応
		// のじゃー→オリジナル画面で挿絵モード変更→のじゃーのときの状態反映
		linkmenu.append($('<div>').append($('#sasieflag').clone()));
	};

	NarouSite.prototype.$rebuild_form_user_type = function () {
		['#noja_impression_usertype', '#noja_novelreview_usertype']
			.forEach(function (elem) {
				$(elem).empty();
			});
	};

	NarouSite.prototype.$rebuild_twitter_link = function (link) {
		link.attr('href', Twitter.createURL ({
			url: this.$getNovelBaseURL(),
			title: this.siteInfo.title,
			hash1: '#narou',
			hash2: '#narou' + this.siteInfo.ncode.toUpperCase(),
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
	NarouSite.$rebuild_forms_table = (function () {
		var u = attrTableEntryGenFactory('#noja_hyouka');
		return [
			// ポイントformの送信先
			// formにname属性はあるがidはない
			u.a ('.novel_hyouka form', '$getNovelPointRegisterURL'),
			// 感想formの送信先
			u.a ('#noja_f_cr form', '$getImpressionConfirmURL'),
			// レビューformの送信先
			u.a ('#noja_r_fc form', '$getNovelReviewConfirmURL'),
			// 感想一覧
			// これはimportのときだけでrestoreでは更新してなかった
			u.h ('#noja_impression_list', '$getImpressionListURL'),
			// レビュー一覧
			// これはimportのときだけでrestoreでは更新してなかった
			u.h ('#noja_novelreview_list', '$getNovelReviewListURL'),
		];
	})();

	// import,restore時にncode,tokenが変わるので呼び出される
	// (login状態は変わらないと仮定するのでmenuの書き換えはない)
	NarouSite.prototype.rebuildFormsOnImportRestore = function () {
		NarouSite.$rebuild_forms_table.forEach (function(elem, index) {
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
	// 初期化最終段階:コンテンツimport後
	NarouSite.prototype.$buildReputationForm = function() {
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
		// ポイントformの送信先
		h.find('.novel_hyouka form').
			attr('action', this.$getNovelPointRegisterURL());
		// divで場所だけ確保している部分
		// loginしていればhiddenでtokenを埋め込む
		h.find('.novel_hyouka .agree')
			.html($('#NarouNocMoonSite_vote_point').render({
				login: this.siteInfo.login,
				token: this.siteInfo.token,
				type:  'submit',
				id:    'pointinput',
				class: 'button',
				value: '評価する',
			}));
		setupFormRadiobox (h);

		var build_impression_review_submit = function (forms, that) {
			forms.forEach (function (info) {
				var form = $(info.selector + ' > form');
				form.attr('action', info.confirmURL);
				// 感想一覧・レビュー一覧のurl
				form.find(info.listSelector).attr('href', info.listURL);
				// ログインしていない場合は警告
				// ログインしていればsubmitボタンのタグを追加
				if (this.siteInfo.login) {
					form.append(info.submitTag);
				} else {
					// userTypeの手前
					form.find(info.userTypeSelector)
						.before($('#NarouNocMoonSite_login_warning')
							.render({
								itemTitle: info.desc,
								loginURL: this.$getLoginURL()
							})
						);
				}
			}, that);
		};

		var formsInfo = [
			{
				selector: '#noja_f_cr',
				listSelector: '#noja_impression_list',
				userTypeSelector: '#noja_impression_usertype',
				confirmURL: this.$getImpressionConfirmURL(),
				listURL: this.$getImpressionListURL(),
				submitTag: genTagInput(submitImpressionConfirm),
				desc: '感想',
			},
			{
				selector: '#noja_r_fc',
				listSelector: '#noja_novelreview_list',
				userTypeSelector: '#noja_novelreview_usertype',
				confirmURL: this.$getNovelReviewConfirmURL(),
				listURL: this.$getNovelReviewListURL(),
				submitTag: genTagInput(submitIReviewInput),
				desc: 'レビュー',
			},
		];
		build_impression_review_submit (formsInfo, this);

		// Tweitterのアンカーにid,class指定はないので位置で知るしかない
		this.$rebuild_twitter_link(h.find('.hyouka_in:eq(1) > a'));
	};

	// 個別サイトのよって付ける場所が違う
	//  parse時にdata-nojaをマークしておき
	//  そこに話数順にappend
	//  逆順等で先頭へのprependになる場合はサイト毎の先頭位置タグがいる
	// つけるもののデータ形式もサイト毎に異なる
	// 元サイトでのタグに合わせた形式っぽい
	// @@ TODO @@ 新デザイン対応
	NarouSite.prototype.autoPagerize = function (secId, secData) {
		if (!gAutoPage) {
			return;
		}
		var render = $.templates('#noja_data_noja_section_template');
		// サイト毎の元ページへの貼り付け
		// @@ TODO @@ サイト毎にカスタムにしないといけないか？
		var prev = (function (secId) {
			var prev = null;
			for (var i = 1; i < secId; ++i) {
				var t = $('div[data-noja="' + i + '"]:last');
				if (t.size()) {
					prev = t;
				}
			}
		})(secId);
		var dataHtml = $(render({
			secId: secId, 
			style: '',	// これはなしでいいのか？本文のcss style指定
			secData: secData,
		}));
		if (prev === null) {
			// 先頭挿入するときは直前のdivを拾ってそのafter
			$('div.novel_pn:first').after('<hr>').after(dataHtml.children());
		} else {
			prev.after(dataHtml.children()).after('<hr>');
		}
	};






	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	function NocMoonSite(url, templates) {
		this.cls = NocMoonSite;
		if (templates === undefined) {
			templates = this.cls.templates;
		}
		// これは$.extend(this.siteInfo, cls.siteInfo, {custom});
		// とかでマージした方がよさそう
		this.siteInfo = {
			siteName: this.cls.siteInfo.siteName,
			site:     this.cls.siteInfo.site,
			site2:    this.cls.siteInfo.site2,
			site0:    this.cls.siteInfo.site0,
			siteS:    this.cls.siteInfo.siteS,
			api:      this.cls.siteInfo.api,
			//
			basePageURL: url,
			ncode: null,
			ncode2: null,
			author: null,
			title: null,
			//
			login: false,
			token: '',
		};

		applyTemplate.generate (this, templates, this.siteInfo);
		this.parseURL = this.cls.parseURL.bind(this.cls);

		// 汎用で、(keys,src)を指定する
		this.setSiteInfoGeneric = filterCopyProperties.bind(this, this.siteInfo);
		this.setSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, api:0,
		});
		// restore機能用
		this.restoreSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode2:0,
		});
		// import用
		this.restoreSiteInfoForImport = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode:0, ncode2:0, author:0, title:0,
		});
		// filterCopyProperties(keys, src)の全束縛
		// あるいは
		// filterCopyProperties({}, keys, src)の全束縛
		// にしてしまってもよいが…
		this.getSiteInfoForSaveData = filterCopyProperties.bind(this, {
			site: 0, site2:0, ncode:0, ncode2:0,
		}, this.siteInfo);



		// NovelIdによるカスタム設定を初期設定に読み込むか？
		this.isInitializeByCustomSetting = true;
		// 最終話より後方への移動で評価フォームを出すかどうか
		this.enableReputationForm = true;	// @@ ここをfalseにする @@
		// 起動時openのデフォルト
		this.alwaysOpenDefault = false;

		//

		var m = this.parseURL (url);
		if (m) {
			this.siteInfo.ncode = m.novelId;
			this.secNo = m.sectionId;
			// 目次ページと短編の識別ができていない状態なので仮設定
			this.isSingleSection = m.isBaseURL;
		} else {
			// 本来formatがあっていてcreateされているはずなので有りえない
		}
		this.maxSectionNo = this.secNo;
	}
	// なろう系の場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない
	
	NocMoonSite.siteInfo = {
		siteName: 'ノクターン・ムーンライト',
		site:  'http://novel18.syosetu.com/',
		site2: 'http://novelcom18.syosetu.com/',
		site0: 'http://syosetu.com/',	// 共通で使ってる場所がある？
		siteS: 'http://static.syosetu.com/',
		api:   'http://api.syosetu.com/novel18api/api/',
		$reURL: /http:\/\/novel18\.syosetu\.com\/([nN][0-9A-Za-z]+)(\/([0-9]+))?/,
	};
	NocMoonSite.parseURL = function (url, relative) {
		if (relative === true) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.siteInfo.site + url;
		}
		var m = this.siteInfo.$reURL.exec(url);
		if (m) {
			return {
				novelId: m[1].toLowerCase(),
				sectionId: parseInt(m[3]),
				isBaseURL: !m[2],
				//
				m: m,
			};
		}
		console.debug('parseURL failed: !m');
		return null;
	};

	NocMoonSite.templates = {
		$getLoginURL:				'{{:site0}}login/input/',
		$getUserTopURL:				'{{:site0}}user/top/',
		$getApiGANURL:				'{{:api}}' + NAROUAPI_AJAX_GET_OPT + '{{:ncode}}',
		//
		$getSiteURL:				'{{:site}}{{:path}}',
		$getNovelBaseURL:			'{{:site}}{{:ncode}}/',
		$getNovelIndexURL:			'{{:site}}{{:ncode}}/',
		$getNovelSectionURL:		'{{:site}}{{:ncode}}/{{:sectionId}}/',
		//
		$getNovelViewInfotopURL:	'{{:site}}novelview/infotop/ncode/{{:ncode}}/',
		//
		// list baseはncode2取り出しで使うもの
		$getImpressionConfirmURL:	'{{:site2}}impression/confirm/ncode/{{:ncode2}}/',
		$getImpressionListBaseURL:	'{{:site2}}impression/list/ncode/',
		$getImpressionListURL:		'{{:site2}}impression/list/ncode/{{:ncode2}}/',
		//
		$getNovelReviewConfirmURL:	'{{:site2}}novelreview/confirm/ncode/{{:ncode2}}/',
		$getNovelReviewListURL:		'{{:site2}}novelreview/list/ncode/{{:ncode2}}/',
		//
		$getNovelPointRegisterURL:	'{{:site2}}novelpoint/register/ncode/{{:ncode2}}/',
		//

		// これはなろうと違うので変更しないといけないか？
		$getBookmarkImageURL:		'{{:siteS}}view/images/bookmarker.gif',
		$getShioriPrefixURL:		'{{:site0}}bookmarker/add/ncode/',
		$getShioriURL:				'{{:site0}}bookmarker/add/ncode/{{:ncode2}}/no/{{:sectionId}}/?token={{:token}}',
		$getFavnovelmain18BaseURL:	'{{:site0}}favnovelmain18/',
	};

	// 相対pathなら絶対path化する
	NocMoonSite.prototype.$toAbsoluteURL = function (url) {
		if (!url.startsWith(this.siteInfo.site)) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.$getSiteURL ({path: url});
		}
		return url;
	};
	NocMoonSite.prototype.$getSectionIdFromURL = function (url) {
		var m = this.parseURL (url, true);
		if (m) {
			return m.sectionId;
		}
		return null;
	};





	// 「のじゃー」ラベルを元ページに貼り付け
	// 位置が悪い？
	// $('#head_nav')
	//	.append('<li><a id="noja_open" class="menu">のじゃー縦書リーダー</a></li>');
	NocMoonSite.prototype.initialize = function () {
		$('#novelnavi_right').append(getNojaLabel());

		// 連載のときは覆ることはない
		// 短編のときも目次と識別ができていないだけで
		// 連載と誤認することはないのでこの設定でOk
		// カレントをSessionManagerから取ろうとしてnullを取ってしまう等
		// 無駄な動きをするが実害はないのでここで呼び出してもOk
		gCurrentManager.setSingleSection (this.isSingleSection);
		if (!this.isSingleSection) {
			gCurrentManager.setCurrent (this.secNo);
		}

		gThemeManager.setColorTheme({
			color: $('#novel_color').css('color'),
			bgColor: $('body').css('background-color'),
			bgImage: null,
		});

		// uiが絡まず軽い部分は裏で動かしたいところだが
		// まだページparseが終わっていないので目次ページ排除しておらず
		// 無駄なアクセスになる可能性がある
		// 初期ページのparseが終わって文章ページと確定するまで保留
	};




	// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	NocMoonSite.prototype.onReadyNoja = function () {
		// 目次取得はもう少し早いタイミング
		// (初期ページのparse最後)
	};

	NocMoonSite.prototype.onOpenNoja = function () {
		this.prepareUiOnOpenNoja ();
		// openのタイミングで非同期に動かすならここに書く
	};

	NocMoonSite.prototype.onCloseNoja = function () {
		this.prepareUiOnCloseNoja ();
	};



	// apiはflow-control外なので常に動かせるとする
	NocMoonSite.prototype.$fetchMaxSectionNo = function () {
		var dfrd = new $.Deferred();
		var self = this;
		//console.debug(this.$getApiGANURL());
		$.getJSON (this.$getApiGANURL())
		.then(
			// success: 成功
			function (json) {
				//[  0] 最初の要素には全小説出力数が入る(1reqなのでallcount=1)
				//[1～] 一作品ずつ情報が入る。
				if (json[0].allcount >= 1) {
					if (json[0].allcount != 1) {
						console.debug('api returns with too many data', json);
					}
					var maxSectionNo = parseInt (json[1].general_all_no);
					console.debug('api got maxSectionNo', maxSectionNo);
					self.maxSectionNo = maxSectionNo;
					if (this.isSingleSection && maxSectionNo != 1) {
						console.debug('singleSection mode: api return != 1:', maxSectionNo);
					}
					dfrd.resolve (maxSectionNo);
				} else {
					// allcount==0を返すこともあるようだ
					console.debug('getJSON: api return no data');
					dfrd.reject ("getJSON no data");
				}
			},
			// error
			function() {
				dfrd.reject ("getJSON failed");
			}
		);
		return dfrd.promise ();
	};





	// ncode,ncode2,site,site2はいる
	NocMoonSite.prototype.getNovelId = function () {
		return this.siteInfo.ncode;
	};

	NocMoonSite.prototype.getTitle = function () {
		return this.siteInfo.title;
	};
	NocMoonSite.prototype.getAuthor = function () {
		return this.siteInfo.author;
	};

	NocMoonSite.prototype.setToken = function (token) {
		this.siteInfo.token = token;
		this.siteInfo.login = (token !== '');
	};



	// Deferred objectを返す
	NocMoonSite.prototype.getNovelSection = function (secId) {
		var self = this;
		if (!gNetworkManager.acquire()) {
			return new $.Deferred().reject().promise();
		}
		return $.get(this.$getNovelSectionURL ({sectionId: secId}))
		.always(function () {
			gNetworkManager.release();
		}).then(function (htmldoc) {
			return new $.Deferred()
				.resolve(self.parseHtmlContents(htmldoc, secId));
		});
	};




	// Sequenceなのでそのままinc/dec: 範囲チェックはしない
	NocMoonSite.prototype.getNextSection = function (secId) {
		var newSecId = secId + 1;
		return (newSecId <= this.maxSectionNo) ? newSecId : secId;
	};
	NocMoonSite.prototype.getPrevSection = function (secId) {
		var newSecId = secId - 1;
		return (newSecId >= 1) ? newSecId : secId;
	};
	NocMoonSite.prototype.isLoadableSection = function (sec) {
		return (sec <= this.maxSectionNo);
	};
	// APIで取れなかった時
	// 取れても読んでいるうちに更新された時など
	// 変化するのでupdateが必要
	// 殆ど内部用途だが、現状restore,import等から使われるので
	// public扱い
	NocMoonSite.prototype.updateMaxSection = function (secId, force) {
		this.maxSectionNo = (force === true) ? secId : Math.max(this.maxSectionNo, secId);
	};


	// Deferred interface
	NocMoonSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};

	NocMoonSite.prototype.replaceImageURL = function (url) {
		// 画像src(@みてみん)のリンクを修正
		// これはなろう固有の話
		return  url.replace('viewimagebig', 'viewimage');
	};



	////////////////////////////////////////////////////////
	NocMoonSite.prototype.$updateThemeAtSection = function (contents) {
		gThemeManager.setBackground($('body'));
	};

	NocMoonSite.prototype.$updateAutherAtSection = function (contents) {
		if (this.isSingleSection) {
			console.debug('single check author', contents);
			// 短編の場合は'.contents1'以前の領域
			this.siteInfo.author = $('.novel_writername', contents).contents()
				.not('a[href^="' + this.$getShioriPrefixURL() + '"]')
				.text().slice(4, -3);
		} else {
			console.debug('multi check author', contents);
			// 一応読み込んだものから著者は再設定しておく？
			// div.contents1の中は
			// span.attention : R18警告(ない場合もある？, R15かもしれない？)
			// "作者："
			// 作者にanchorがない場合もある
			// p.chapter_titleの手前まで

			var contents1 = $('<div/>').append(
				contents.find('.contents1')
				.contents()
				.not('span.attention, p.chapter_title')
				.clone()	// cloneしないでappendすると元ページから消える
			).text();
			var author = contents1.match(/\s*作者：\s*(.*)\s*$/)[1];
			this.siteInfo.author = author;	//.replace(RE_G_LINEBREAK, '');
		}
		console.debug('got author', '"' + this.siteInfo.author + '"');
	};

	// 短編と長編でタイトルを取れるdiv領域が違う
	NocMoonSite.prototype.$updateTitleAtSection = function (contents) {
		if (this.isSingleSection) {
			this.siteInfo.title = getText('.novel_title', contents);
		} else {
			// タイトルは必ずlink付
			var a = contents.find('.contents1 >a:eq(0)');
			var t = a.attr('href');
			if (t == this.siteInfo.site0.slice(0,-1)) {
				// 18禁移動リンクを取ってしまった(短編識別に失敗している？)
				console.debug('missparsed:', t);
			} else {
				this.siteInfo.title = a.text();
			}
		}
	};

	// link解析がindexのa書き換えと同じなのでprivate methodでまとめる
	// nobel_bnは上下2か所になるので上だけ使う
	NocMoonSite.prototype.$updateRelativeSectionAtSection = function (contents, secId) {
		var relativeLinks = contents.find('#novel_color > div.novel_bn:eq(0) > a');
		var maxSecId = secId;
		var self = this;
		if (relativeLinks.size()) {
			relativeLinks.each (function() {
				var url = $(this).attr('href');
				var relSecId = self.$getSectionIdFromURL (url);
				if (relSecId !== null) {
					maxSecId = Math.max(maxSecId, relSecId);
				}
			});
		}
		//console.debug('update max', maxSecId);
		this.updateMaxSection (maxSecId);
	};

	// ここの判定はなんとか変更したいところ
	// 目次ページは事前に除外されているので、
	// 連載の文章ページor短編の文章ページの識別
	// 短編:18禁移動のリンクアンカー (== this.siteInfo.site0.slice(0,-1))
	// 連載:タイトルページへのリンクアンカー
	NocMoonSite.prototype.$parseSectionType = function (contents) {
		var url = contents.find('.contents1 >a:eq(0)').attr('href');
		// どうもhref要素側URLは'/'がないようだ。
		return (url == this.siteInfo.site0.slice(0,-1));
	};

	// 絞るべきcontextは'#container'のレベルのようだ
	// 短編と長編でタイトルを取れるdiv領域が違う等、
	// これ以上は絞れない
	NocMoonSite.prototype.$setupVolumeInfo = function (contents) {
		// url判定で、(目次|短編) vs 連載で、isSingleSection自体は仮決定済
		// min checkで目次を排除しているので、
		// 実はisSingleSectionは調べるまでもなく最終決定済
		var isSingleSection = this.$parseSectionType(contents);
		if (isSingleSection != this.isSingleSection) {
			console.debug ('isSingleSection check mismatch');
			this.isSingleSection = isSingleSection;
			gCurrentManager.setSingleSection (this.isSingleSection);
		}

		// tokenとncode2の取得等
		var t = contents.find('#bkm a[href^="' + this.$getFavnovelmain18BaseURL() + '"]');
		this.token = (t.size()) ? t.attr('href').match(/=([0-9a-f]*)$/)[1] : null;
		if (this.token) {
			this.login = true;
			gTokenManager.set (this.token);
		} else {
			this.login = false;
		}
		t = contents.find('#head_nav a[href^="' + this.$getImpressionListBaseURL() + '"]');
		this.siteInfo.ncode2 = (t.size()) ? t.attr('href').match(/([0-9]*)\/$/)[1] : null;

	};

	NocMoonSite.prototype.$parseHtmlCommon = function (contents, section) {
		this.$updateRelativeSectionAtSection (contents, section);
		this.$updateAutherAtSection(contents);

		var sec = {};

		if (this.isSingleSection) {
			sec.chapter_title = '';
			sec.subtitle = this.siteInfo.title;
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

		// データオブジェクトを返す
		return sec;
	};


	////////////////////////////////////////////////////////


	NocMoonSite.prototype.parseInitialPage = function () {
		var dfrd = new $.Deferred ();
		if (!$('#novel_honbun').size()) {
			// 目次ページを排除
			return dfrd.reject ();
		}
		
		var contents = $('#container');
		this.$setupVolumeInfo (contents);
		this.$updateThemeAtSection (contents);
		this.$updateTitleAtSection (contents);
		//
		gSectionManager.registData (gCurrentManager.id
			, this.$parseHtmlCommon(contents, gCurrentManager.id));
		//
		gCurrentManager.setCurrent (gCurrentManager.id);
		// autoPagerが貼り付ける先に独自attrを付ける
		$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
			.attr('data-noja', gCurrentManager.id);
		////////////////////////////////////////
		// 文章ページと確定したので
		// maxNoは取ってしまう
		// 短編のときには実際には不要だが
		// 念のため取得してチェックする
		var self = this;
		this.$fetchMaxSectionNo ().then(
			function (maxSectionNo) {
				// fetch側で設定は行っているので他にすることはない
			}
			// errorならそのまま？
		);
		if (!this.isSingleSection) {
			this.loadIndex ().then(
				function (tocInfo) {
					// 登録処理
					gIndexManager.registIndex (tocInfo);
				}
				// errorならそのまま？
			);
		}
		////////////////////////////////////////
		return dfrd.resolve ();
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
		return this.$parseHtmlCommon (contents, section);
	};



	///////////////////////////////////////
	//
	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	NocMoonSite.prototype.selectNojaIndexData = function () {
		var indexSelector = '#noja_index';
		return $(
			[
				'div.novel_title',
				'div.novel_writername',
				'#novel_ex',
				'div.index_box'
			].map(function (selector) {
				return indexSelector + ' ' + selector;
			}).join(', ')
		);
	};

	NocMoonSite.prototype.$reformIndex = NarouNocMoonSite.prototype.$reformIndex;
	// 形式を標準化する
	NocMoonSite.prototype.$parseIndexPage = function (htmldoc) {
		var self = this;
		// parseHTMLが戻すのはDOM element arrayなのでobject化してから使う
		var indexPage = $($.parseHTML(htmldoc)).find('#novel_color');
		var tocInfo = {
			totalSections: this.maxSectionNo,	// 取得失敗なら0のまま
			series:      indexPage.find('p.series_title'),
			title:       indexPage.find('p.novel_title'),
			author:      indexPage.find('div.novel_writername'),
			description: indexPage.find('#novel_ex'),	// div
			index:       indexPage.find('div.index_box'),
			index_accordion_header: '>div.noja_toc_index_chapter_title',
		};
		console.debug(tocInfo);

		// シリーズのlinkを絶対リンク化
		// (contentsページからの位置とindexページからの位置で階層が違う)
		tocInfo.series.find('a').each(function() {
			var url = $(this).attr('href');
			$(this).attr('href', self.$toAbsoluteURL(url));
		});


		// title:内部保存の変数を更新する
		var title = tocInfo.title.text();
		if (title != this.siteInfo.title) {
			// this.siteInfo.title = title;
			console.debug('index title mismatch:', title, this.siteInfo.title);
		}

		// author:内部保存の変数を更新する
		// "作者："を削る
		var author = tocInfo.author.contents();
		if (author.size()) {
			author = author.text().match(/\s*作者：(.*)\s*$/)[1];
			if (author != this.siteInfo.author) {
				//this.siteInfo.author = author;
				console.debug('index author mismatch: author', '"' + author + '"');
				console.debug('index author mismatch: kept author', '"' + this.siteInfo.author + '"');
			}
		}

		// あらすじ部分:特になし

		// index部分
		// href無効化、css設定、click handler設定
		// 多分、urlからsecIdを出すほうがいいはず
		// マウスカーソルをlinkクリック可能な表示に変えるためのcss指定
		var indexItemStyle = {
			'cursor': 'pointer',
		};
		// 指定を付ける要素が違う？
		// どこに何がついているか調べなおさないといけない
		// div.index_box
		//   div.chapter_title
		//   dl.novel_sublist2 : onclickでlocation.href変更jump
		//    dd.subtitle > a  : hrefにlink
		//    dt.long_update   : 更新日時
		// 章題～章題が章内(div.chapter_title内に入っていない
		this.$reformIndex(tocInfo.index);

		// apiが値を返さないこともあるのでmaxは計算しないといけない
		// 2014/03/20のなろうの仕様変更でjavascriptでのjumpがなくなったようだ
		// 結局サブタイ部分のanchorでのjumpのみに戻った(Chromeのwheel関連の都合らしい)
		var totalSections = 0;
		var maxSectionNo = 0;
		// aで回さずにdl.novel_sublist2で回すべきか？
		$(tocInfo.index).find('a').each(function () {
			var url = $(this).attr('href');
			var secId = self.$getSectionIdFromURL(url);
			if (secId !== null) {
				$(this).attr('noja_jumpTo', secId);
				maxSectionNo = Math.max(maxSectionNo, secId);
				++totalSections;
			}
			$(this).attr('href', null)		// @@ TODO @@ Javascript側のcleanup
			.css(indexItemStyle)
			;
		});
		if (totalSections != maxSectionNo) {
			console.debug('totalSections != maxSectionNo', totalSections, maxSectionNo);
		}
		// APIで取れないことや、コンテンツ更新されるタイミングもあるので更新する
		this.updateMaxSection (maxSectionNo);
		tocInfo.totalSections = maxSectionNo;
		return tocInfo;
	};



	// indexは帯域制御外とする
	// ただし、自分自身の多重loadだけは避ける
	NocMoonSite.prototype.loadIndex = function () {
		// 既に動いている途中ならそれを返す
		if (('deferredFetchIndex' in this)
			&& this.deferredFetchIndex !== null
			&& this.deferredFetchIndex.state() == 'pending') {
			return this.deferredFetchIndex;
		}
		// 初回or完了済の更新
		var self = this;
		this.deferredFetchIndex = $.get (this.$getNovelIndexURL()).then(
			//success:
			function(htmldoc) {
				var tocInfo = self.$parseIndexPage (htmldoc);
				return new $.Deferred().resolve (tocInfo).promise();
			}
			// error: そのままgetのfailを返す
		);
		return this.deferredFetchIndex.promise();
	};





	/////////////
	NocMoonSite.prototype.prepareUiOnOpenNoja = function () {
		$('body').css('overflow', 'hidden');
		$('#novel_header').hide();
	};
	NocMoonSite.prototype.prepareUiOnCloseNoja = function () {
		$('#novel_header').show();
		$('body').css('overflow', 'visible');
	};


	// なろう系のみ:linkMenuの最初の項目
	NocMoonSite.prototype.$getLoginOrUserTopInfo = function () {
		if (this.login) {
			return {
				url: this.$getUserTopURL(),
				text: 'マイページ',
			};
		} else {
			return {
				url: this.$getLoginURL(),
				text: 'ログイン',
			};
		}
	};

	NocMoonSite.prototype.$linkMenuItems = [
		{a:1, fx: function (a) {
			var loginOrUserTop = this.$getLoginOrUserTopInfo();
			a.attr('href', loginOrUserTop.url).text(loginOrUserTop.text);
		}},
		{a:2, href: '$getNovelViewInfotopURL'},
		{a:3, href: '$getImpressionListURL'},
		{a:4, href: '$getNovelReviewListURL'},
	];

	NocMoonSite.prototype.buildlinkMenuItems = function (a) {
		$.each(this.$linkMenuItems, function (index, item) {
			var t = a.eq(item.a);
			if ('fx' in item) {
				item.fx(t);
			} else {
				t.attr('href', this.call(item.href));
			}
			return true;
		});
	};

	NocMoonSite.prototype.uiCustomSetup = function () {
		// 初期化段階でのメニューカスタマイズ
		this.$setupLinkMenu ($('noja_link'));
		this.$buildReputationForm ();
	};


	// しおり関連の更新用
	NocMoonSite.prototype.rebuildUiOnChangeSection = function(section_no) {
		// formatは分かっているものの…
		// しおり自体の構成が動的に変動するので扱いが微妙
		// とりあえず落ちないようにする対策のみ
		// ここに来る条件が少し不明なり
		console.debug('shiori parameter change @@ TODO @@');
		if (false) {
			$('#noja_shiori').attr('href', this.$getShioriURL({sectionId: section_no}));
		}
	};

	NocMoonSite.prototype.$setupLinkMenu = function (linkmenu) {
		var a = linkmenu.find('a');
		var loginOrUserTop = this.$getLoginOrUserTopInfo();
		a.eq(1).attr('href', loginOrUserTop.url).text(loginOrUserTop.text);
		a.eq(2).attr('href', this.$getNovelViewInfotopURL());
		a.eq(3).attr('href', this.$getImpressionListURL());
		a.eq(4).attr('href', this.$getNovelReviewListURL());

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

	NocMoonSite.prototype.$rebuild_form_user_type = function () {
		['#noja_impression_usertype', '#noja_novelreview_usertype']
			.forEach(function (elem) {
				$(elem).html($('#NocMoonSite_select_account_type').render({}));
		});
	};

	NocMoonSite.prototype.$rebuild_twitter_link = function (link) {
		link.attr('href', Twitter.createURL ({
			url: this.$getNovelBaseURL(),
			title: this.siteInfo.title,
			hash1: '#narou',
			hash2: '#narou' + this.siteInfo.ncode.toUpperCase(),
		}))
		.find('img').attr('src', IMG_TWITTER_BANNER);
	};


	NocMoonSite.$rebuild_forms_table = function () {
		var u = attrTableEntryGenFactory('#noja_hyouka');
		return [
			// ポイントformの送信先
			// formにname属性はあるがidはない
			u.a ('.novel_hyouka form', '$getNovelPointRegisterURL'),


			// 感想formの送信先
			u.a ('#noja_f_cr form', '$getImpressionConfirmURL'),
			// レビューformの送信先
			u.a ('#noja_r_fc form', '$getNovelReviewConfirmURL'),
			// 感想一覧
			// これはimportのときだけでrestoreでは更新してなかった
			u.h ('#noja_impression_list', '$getImpressionListURL'),
			// レビュー一覧
			// これはimportのときだけでrestoreでは更新してなかった
			u.h ('#noja_novelreview_list', '$getNovelReviewListURL'),
		];
	};
	// import,restore時にncode,tokenが変わるので呼び出される
	// (login状態は変わらないと仮定するのでmenuの書き換えはない)
	NocMoonSite.prototype.rebuildFormsOnImportRestore = function () {
		this.$rebuild_form_user_type();
		NocMoonSite.$rebuild_forms_table.forEach (function(elem, index) {
			if (elem.gen in this.prototype) {
				$(elem.selector).attr(elem.attr
					, elem.prototype[elem.gen].call(this));
			} else {
				console.debug('missing prototype:', elem.gen);
			}
		}, this);
	};

	// 評価formの構築
	NocMoonSite.prototype.$buildReputationForm = function() {
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
		h.find('.novel_hyouka form')
			.attr('action', this.$getNovelPointRegisterURL());
		h.find('.novel_hyouka .agree')
			.html($('#NarouNocMoonSite_vote_point').render({
				login: this.siteInfo.login,
				token: this.siteInfo.token,
				type:  'submit',
				id:   "pointinput",
				class: 'button',
				value:"評価する",
			}));
		this.$rebuild_form_user_type();

		setupFormRadiobox (h);


		var build_impression_review_submit = function (forms, that) {
			forms.forEach (function (info) {
				var form = $(info.selector + ' > form');
				form.attr('action', info.confirmURL);
				// 感想一覧・レビュー一覧のurl
				form.find(info.listSelector).attr('href', info.listURL);
				// ログインしていない場合は警告
				// ログインしていればsubmitボタンのタグを追加
				if (this.siteInfo.login) {
					form.append(info.submitTag);
				} else {
					// userTypeの手前
					form.find(info.userTypeSelector)
						.before($('#NarouNocMoonSite_login_warning')
							.render({
								itemTitle: info.desc,
								loginURL: this.$getLoginURL()
							})
						);
				}
			}, that);
		};

		var formsInfo = [
			{
				selector: '#noja_f_cr',
				listSelector: '#noja_impression_list',
				userTypeSelector: '#noja_impression_usertype',
				confirmURL: this.$getImpressionConfirmURL(),
				listURL: this.$getImpressionListURL(),
				submitTag: genTagInput(submitImpressionConfirm),
				desc: '感想',
			},
			{
				selector: '#noja_r_fc',
				listSelector: '#noja_novelreview_list',
				userTypeSelector: '#noja_novelreview_usertype',
				confirmURL: this.$getNovelReviewConfirmURL(),
				listURL: this.$getNovelReviewListURL(),
				submitTag: genTagInput(submitIReviewInput),
				desc: 'レビュー',
			},
		];
		build_impression_review_submit (formsInfo, this);

		this.$rebuild_twitter_link = (h.find('.hyouka_in:eq(1) > a'));
	};


	// 個別サイトのよって付ける場所が違う
	//  parse時にdata-nojaをマークしておき
	//  そこに話数順にappend
	//  逆順等で先頭へのprependになる場合はサイト毎の先頭位置タグがいる
	// つけるもののデータ形式もサイト毎に異なる
	// 元サイトでのタグに合わせた形式っぽい
	// @@ TODO @@ 新デザイン対応
	NocMoonSite.prototype.autoPagerize = function (secId, secData) {
		if (!gAutoPage) {
			return;
		}
		var render = $.templates('#noja_data_noja_section_template');
		// サイト毎の元ページへの貼り付け
		// @@ TODO @@ サイト毎にカスタムにしないといけないか？
		var prev = (function (secId) {
			var prev = null;
			for (var i = 1; i < secId; ++i) {
				var t = $('div[data-noja="' + i + '"]:last');
				if (t.size()) {
					prev = t;
				}
			}
		})(secId);
		var dataHtml = $($.render.dataNojaSectionTmpl({
			secId: secId, 
			style: '',	// これはなしでいいのか？本文のcss style指定
			secData: secData,
		}));
		if (prev === null) {
			// 先頭挿入するときは直前のdivを拾ってそのafter
			$('div.novel_pn:first').after('<hr>').after(dataHtml.children());
		} else {
			prev.after(dataHtml.children()).after('<hr>');
		}
	};









	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	function AkatsukiSite(url, templates) {
		this.cls = AkatsukiSite;
		if (templates === undefined) {
			templates = this.cls.templates;
		}
		this.siteInfo = {
			siteName: this.cls.siteInfo.siteName,
			site:     this.cls.siteInfo.site,
			site2:    this.cls.siteInfo.site2,
			api:      this.cls.siteInfo.api,
			//
			basePageURL: url,
			//
			ncode: null,
			ncode2: null,
			author: null,
			title: null,
			token: '',
			login: false,
		};

		applyTemplate.generate (this, templates, this.siteInfo);
		this.parseURL = this.cls.parseURL.bind(this.cls);

		// 汎用で、(keys,src)を指定する
		this.setSiteInfoGeneric = filterCopyProperties.bind(this, this.siteInfo);
		this.setSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, api:0,
		});
		// restore機能用
		this.restoreSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode2:0,
		});
		// import用
		this.restoreSiteInfoForImport = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode:0, ncode2:0, author:0, title:0,
		});
		// filterCopyProperties(keys, src)の全束縛
		// あるいは
		// filterCopyProperties({}, keys, src)の全束縛
		// にしてしまってもよいが…
		this.getSiteInfoForSaveData = filterCopyProperties.bind(this, {
			site: 0, site2:0, ncode:0, ncode2:0,
		}, this.siteInfo);




		// NovelIdによるカスタム設定を初期設定に読み込むか？
		this.isInitializeByCustomSetting = true;
		//
		this.enableReputationForm = false;
		//
		this.alwaysOpenDefault = false;

		var m = this.parseURL (url);
		if (m) {
			this.siteInfo.ncode = m.novelId;
			this.currentSectionId = m.sectionId;
		} else {
			// 本来formatがあっていてcreateされているはずなので有りえない
		}

		// 逆方向はjQueryの$.inArray(id, sectioNo2Id)でindexで取る
		// どうせ初期ページがsectionどこにあたるのかを知るためだけ
		this.sectionIdMap = new SectionMap(this.$getSectionIdFromURL.bind(this));
		// 多分prototypeでobjectが作られてからctorが呼ばれるはずなので
		// 呼び出して問題ないはず
		this.indexTable = null;
	}

	AkatsukiSite.siteInfo = {
		siteName: '暁',
		site:  'http://www.akatsuki-novels.com/',
		site2: 'http://www.akatsuki-novels.com/',
		api:    '',
		// [1]=prefix(使わない:サイト内リングのroot指定の都合で最後のslash手前まで)
		// [2]=secId
		// [3]=novelId
		$reURL: /^http:\/\/www\.akatsuki-novels\.com\/stories\/view\/(\d+)\/novel_id~(\d+)/,
	};
	AkatsukiSite.parseURL = function (url, relative) {
		if (relative === true) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.siteInfo.site + url;
		}
		var m = this.siteInfo.$reURL.exec (url);
		if (m) {
			return {
				novelId: parseInt(m[2]),
				sectionId: parseInt(m[1]),
				//
				m: m,
			};
		}
		console.debug('parseURL failed: !m');
		return null;
	};


	AkatsukiSite.templates = {
		//
		$getSiteURL:			'{{:site}}{{:path}}',
		$getNovelBaseURL:		'{{:site}}stories/index/novel_id~{{:ncode}}/',
		$getNovelIndexBaseURL:	'{{:site}}stories/index/novel_id~{{:ncode}}/',
		$getNovelIndexURL:		'{{:site}}stories/index/page~{{:indexPageNo}}/novel_id~{{:ncode}}',
		$getNovelSectionURL:	'{{:site}}stories/view/{{:sectionId}}/novel_id~{{:ncode}}',
	};

	// 相対pathなら絶対path化する
	AkatsukiSite.prototype.$toAbsoluteURL = function (url) {
		if (!url.startsWith(this.siteInfo.site)) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.$getSiteURL ({path: url});
		}
		return url;
	};

	// sectionIdを拾う:idmapでも使う
	AkatsukiSite.prototype.$getSectionIdFromURL = function (url) {
		var m = this.parseURL (url, true);
		if (m) {
			return m.sectionId;
		}
		return null;
	};




	// 「のじゃー」ラベルを元ページに貼り付け
	AkatsukiSite.prototype.initialize = function () {
		//$('#novelnavi_right').append(getNojaLabel());

		gCurrentManager.setSingleSection (false);
		gCurrentManager.setCurrent (this.currentSectionId);

		gThemeManager.setColorTheme({
			color: '#000',
			bgColor: $('body').css('background-color'),
			bgImage: null,
		});

		// 暁の場合、短編と連載に区別がないので
		// この段階でfetch開始しても問題ない
		this.loadIndex().then(
			function (tocInfo) {
				// 登録処理
				gIndexManager.registIndex (tocInfo);
			}
			// errorならそのまま？
		);
	};

	// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	AkatsukiSite.prototype.onReadyNoja = function () {
		//
	};

	AkatsukiSite.prototype.onOpenNoja = function () {
		this.prepareUiOnOpenNoja ();
		// openのタイミングで非同期に動かすならここに書く
	};

	AkatsukiSite.prototype.onCloseNoja = function () {
		this.prepareUiOnCloseNoja ();
	};




	// ncode,ncode2,site,site2はいる
	AkatsukiSite.prototype.getNovelId = function () {
		return this.siteInfo.ncode;
	};

	AkatsukiSite.prototype.getTitle = function () {
		return this.siteInfo.title;
	};
	AkatsukiSite.prototype.getAuthor = function () {
		return this.siteInfo.author;
	};

	AkatsukiSite.prototype.setToken = function (token) {
		this.siteInfo.token = token;
		this.siteInfo.login = (token !== '');
	};





	// Deferred objectを返す
	AkatsukiSite.prototype.getNovelSection = function (secId) {
		var self = this;
		if (!gNetworkManager.acquire()) {
			return new $.Deferred().reject().promise();
		}
		return $.get(this.$getNovelSectionURL ({sectionId: secId}))
		.always(function () {
			gNetworkManager.release();
		}).then(function (htmldoc) {
			return new $.Deferred()
				.resolve(self.parseHtmlContents(htmldoc, secId));
		});
	};



	// section変更毎に更新しなければいけない仕事がればここで
	AkatsukiSite.prototype.rebuildUiOnChangeSection = function(section_no) {
		// linkMenu等
	};

	AkatsukiSite.prototype.$setupLinkMenu = function (linkmenu) {
		// linkMenu等
	};






	// idが純粋にidなのでlinkから取る
	AkatsukiSite.prototype.getNextSection = function (secId) {
		return this.sectionIdMap.queryNext(secId);
	};
	// idが純粋にidなのでlinkから取る
	AkatsukiSite.prototype.getPrevSection = function (secId) {
		return this.sectionIdMap.queryPrev(secId);
	};
	AkatsukiSite.prototype.isLoadableSection = function (secId) {
		return this.sectionIdMap.queryExists (secId);
	};
	AkatsukiSite.prototype.updateMaxSection = function (secId, force) {
		this.sectionIdMap.assert (secId);
	};



	AkatsukiSite.prototype.rebuildFormsOnImportRestore = function () {
		$('#noja_impression_usertype').empty();
		$('#noja_novelreview_usertype').empty();
	};

	// 評価formの構築
	AkatsukiSite.prototype.$buildReputationForm = function() {
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
	AkatsukiSite.prototype.parseRelativeSectionLink = function (secId, story) {
		var paging = $('.paging_for_view:eq(0)', story);
		//console.debug($('.paging_for_view:eq(0)', story).html());
		// 最新・最終のときはaがないのでselect結果が空になる
		var prev = $('span.prev > a', paging);
		var next = $('span.next > a', paging);
		//console.debug('paging: ', paging);
		//console.debug('prev: ', prev, prev.attr('href'));
		//console.debug('next: ', next, next.attr('href'));

		this.sectionIdMap.setRelative({
			current: secId,
			prev: (prev.size())
				? this.$getSectionIdFromURL(prev.attr('href')) : null,
			next: (next.size())
				? this.$getSectionIdFromURL(next.attr('href')) : null,
		});
	};

	AkatsukiSite.prototype.$parseHtmlCommon = function(story, novels, section) {

		// 処理を介する前に前処理で
		// 雀牌画像の逆変換をして独自タグに戻すべき？
		// というか文章部分だけにしてからでいい

		this.parseRelativeSectionLink (section, story);
		// divの中に"作者："があってその後にaがあるもの
		this.siteInfo.author = $('div a:eq(0)', story).text();
		//console.debug("author:", this.siteInfo.author);

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

		//
		console.debug(sec);
		//
		return sec;
	};

	AkatsukiSite.prototype.$updateThemeAtSection = function (story, novels) {
		gThemeManager.setColorTheme({
			color  : novels.css('color'),
			bgColor: '#ffffff',
			bgImage: null,
		});
		if (false) {
			gThemeManager.setBackground($('body'));
		}
	};

	AkatsukiSite.prototype.$updateTitleAtSection = function (story, novels) {
		// ここの判定はなんとか変更したいところ
		// タイトル関連
		this.siteInfo.title = $('h1:eq(0)', story).text();
		console.debug('title:', this.siteInfo.title);
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
		var secData = this.$parseHtmlCommon (story, novels, section);
		this.sectionIdMap.assert(section);
		return secData;
	};

	// 初期化のときのparser stub
	// カラー指定の扱いとtoken関連は調整がいる
	AkatsukiSite.prototype.parseInitialPage = function () {
		var dfrd = new $.Deferred ();
		console.debug('parseInitialPage');
		var story = $('#contents-inner2 > div.story > div.story');
		var novels = (story.size()) ? $('div.body-novel', story) : null;
		// minimum check
		if (!novels) {
			console.debug('min check failed');
			return dfrd.reject ();
		}
		// [強制短編設定]
		if (false) {
			gCurrentManager.setSingleSection ();
		}
		// その他
		// 解析した中身によって本来変更すべきもの
		this.siteInfo.login = false;
		this.siteInfo.token = null;
		this.siteInfo.ncode2 = null;

		this.$updateThemeAtSection (story, novels);
		this.$updateTitleAtSection (story, novels);

		gSectionManager.registData (gCurrentManager.id
			, this.$parseHtmlCommon (story, novels, gCurrentManager.id));
		gCurrentManager.setCurrent (gCurrentManager.id);
		gSectionManager.debugDump();

		// autoPagerが貼り付ける先に独自attrを付ける
		if (false) {
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', gCurrentManager.id);
		}
		return dfrd.resolve ();
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

	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	AkatsukiSite.prototype.selectNojaIndexData = function () {
		var indexSelector = '#noja_index';
		return $(
			[
				'div.novel_title',
				'div.novel_writername',
				'#novel_ex',
				'div.index_box'
			].map(function (selector) {
				return indexSelector + ' ' + selector;
			}).join(', ')
		);
	};


	// indexは帯域制御外とする
	// ただし、自分自身の多重loadだけは避ける
	AkatsukiSite.prototype.loadIndex = function () {
		// 既に動いている途中ならそれを返す
		if (('deferredFetchIndex' in this)
			&& this.deferredFetchIndex !== null
			&& this.deferredFetchIndex.state() == 'pending') {
			return this.deferredFetchIndex;
		}
		// 初回or完了済の更新
		var self = this;
		this.deferredFetchIndex = this.$fetchAsyncIndexPage().then(
			// fetcherのdoneを受ける
			// 最後のprogressは終わっているはず
			// (所詮シングルスレッド非同期だから…)
			function (indexPageNo, indexPageInfo) {
				// 目次は監視側が登録する
				var dfrd = new $.Deferred();
				dfrd.resolve (self.tocInfo);
				// 中身を投げたので不要になったものは消す
				delete self.tocInfo;
				return dfrd.promise();
			}
			, null
			, self.$appendIndexPage.bind(self)
		);
		return this.deferredFetchIndex.promise();
	};


	// '/html/body/div/div[2]/div/div/div[2]/div/div/div[2]'
	// '#contents-inner2 div.box div.box div.body-x1 div.paging-top'
	// "#contents-inner2"はbody直下ではないので問題ないはず
	// 中身は
	// 各ページは'span >a:eq(0)'
	//   '<a href="/stories/index/novel_id~{{:novelId}}/page~{{:pageNo}}">2</a>'
	// カレントは'span.current'でこれは子aなし
	// 'span.prev >a:eq(0)': 前ページ/ない場合は子aなしで'.disabled'も付く
	//   'span.prev >a[rel="prev"]'
	//     urlは他ページと同様
	//     nextも同様
	// 総話数等はpaging-top直後のp
	// <p>現1ページ／全220ページ、20件／全4400件、1～20件を表示</p>
	// 総話数が分かっても
	//
	//http://www.akatsuki-novels.com/novels/view/{{:novelId}}
	// '/html/body/div/div[2]/div/div/div[2]/div/table/tbody/tr[3]/td'
	// 'html body#novel div#wrapper div#container2 div#contents2 div#contents-inner2 div.box div.box-entry table tbody tr td.data'
	// '#contents-inner2 div.box div.box-entry table tbody tr td.data'
	// だと他と識別できないので、indexで指定しないといけない
	// '連載〔全32話〕'から総話数を取ることはできるが…

	// 目次項目
	// /html/body/div/div[2]/div/div/div[2]/div/div/div[4]/table/thead
	// html body#novel div#wrapper div#container2 div#contents2
	//     div#contents-inner2 div.box div.box div.body-x1 div.font-bb table.list thead
	// /html/body/div/div[2]/div/div/div[2]/div/div/div[4]/table/tbody
	// html body#novel div#wrapper div#container2 div#contents2
	//      div#contents-inner2 div.box div.box div.body-x1 div.font-bb table.list tbody

	// fetcherのnotifyを受けるので、これはthis contextでは動かない
	// 登録時にbindでthisを決めているのでthisは本来のinstanceを指す
	// divの下につけた全要素がcontents
	AkatsukiSite.prototype.$appendIndexPage
		= function (indexPageNo, indexPageInfo, contents) {
		// doneかつerrorでpageNo=1の場合は単一indexで、その場合
		// errorなのでtotal系の情報はinvalid
		contents = contents.find('#contents-inner2 >div.story >div.story');
		var table = contents.find('div.font-bb table');
		// 最初のページではテーブルの初期構築
		if (indexPageNo == 1) {
			var info = contents.find('h3.font-bb');
			//console.debug (info);
			this.tocInfo = {
				totalSections:	0,
				//series:			null,	// ない場合は項目自体なしでOk
				title:			info.eq(0),	// find('#LookNovel'),
				author:			info.eq(1),	// もう少しうまい取り方をしたほうがいい？
				//#contents-inner2 div.story div.story div.body-x1 p
				// body-x1の子のfirstがpでhr+br+div(desc)+br+hr+br
				// くらいまでの間が対象
				// 原作とあらすじ
				description:	$('<div/>').append(contents
								.find('div:not(".txt-c")').eq(0)
								.find('>p:eq(0), >div:eq(0)')
								),
				index:			$('<table />')
								.append(table.find('thead'))
								.append('<tbody />'),
			};
			//console.debug(this.tocInfo);
		}
		var tr = table.find('tbody > tr');
		//console.debug('index table', this.indexTable);
		this.tocInfo.index.find('tbody').append(tr);

		// 後はsectionIdmapを作るのと、目次ページ用タグ調整
		// index部分
		// href無効化、css設定、click handler設定
		// 多分、urlからsecIdを出すほうがいいはず
		// マウスカーソルをlinkクリック可能な表示に変えるためのcss指定
		var indexItemStyle = {
			'cursor': 'pointer',
		};

		var self = this;
		//console.debug(this.sectionIdMap);
		tr.each(function () {
			//console.debug(self.sectionIdMap);
			// td:eq(0)がlinkとsub-title
			// td:eq(1)が更新日時(text)
			var td = $(this).children('td');
			switch(td.size()) {
			case 1:
				// 章のtdは1要素でtextだけ
				var chapterTitle = td.text();
				self.sectionIdMap.pushChapter(chapterTitle);
				//console.debug('chapter_title:', chapterTitle);
				break;
			case 2:
				var a = td.eq(0).children('a:eq(0)');
				var url = a.attr('href');
				var sectionInfo = {
					url: url,
					subtitle: a.text(),
					publishedDateTime: td.eq(1).text(),
				};
				++self.tocInfo.totalSections;
				self.sectionIdMap.pushSection(sectionInfo);
				// urlについてherfを削って独自attrを付ける
				var secId = self.$getSectionIdFromURL(url);
				if (secId !== null) {
					a.attr('noja_jumpTo', secId);
				}
				a.attr('href', null).css(indexItemStyle);
				break;
			}
		});
		//console.debug(this.tocInfo);
	};

	// pagingの中身はあまりチェックせず、総話数等の表示だけparse
	// divの下につけた全要素がcontents
	AkatsukiSite.prototype.$parseIndexPagingNavi = function (indexPageNo, contents) {
		//console.debug(contents);
		var paging_top = $('#contents-inner2 div.paging-top', contents);

		var indexPageInfo = {
			currentPage: 1,
			totalPages: 1,
			totalSections: 0,
			// 最初のページでpagingがない:単一indexpage
			done: (indexPageNo == 1 && !paging_top.size()),
			// 最初以外のページでpagingがない
			error: (indexPageNo != 1 && !paging_top.size()),
		};
		if (!indexPageInfo.done && !indexPageInfo.error) {
			//console.debug('multiple index pages:', indexPageNo);
			// pagingのnextのpの中にtotal等がある
			var text = $(paging_top).next('p').text();
			//console.debug('$parseIndexPagingNavi: text:', text);
			var m = /現(\d+)ページ.+全(\d+)ページ.+全(\d+)件/.exec(text);
			if (!m) {
				console.debug('$parseIndexPagingNavi: regexp failed');
			} else {
				indexPageInfo.currentPage = parseInt(m[1]);
				indexPageInfo.totalPages = parseInt(m[2]);
				indexPageInfo.totalSections = parseInt(m[3]);
				indexPageInfo.done
					= (indexPageInfo.currentPage == indexPageInfo.totalPages);
				indexPageInfo.error
					= (indexPageInfo.currentPage != indexPageNo);
			}
		}
		console.debug('$parseIndexPagingNavi: no total page, sections'
			, indexPageNo, indexPageInfo.totalPages, indexPageInfo.totalSections);
		return indexPageInfo;
	};

	// dfrdで状態通知
	// * notifyを見張っている側が
	//   this.indexItemQueue = [] に解析した要素を詰め込む
	// * doneを見張っている側が
	//   fetch完了後に、gIndexManager等が動けるようになってから登録する
	// @@ TODO @@
	//   flow-control
	//   表のfetchを阻害してしまうので、キューを分けるか
	//   優先度付のキューで行うようにすべき
	AkatsukiSite.prototype.$fetchAsyncIndexPage = function () {
		var interval = 100;
		var dfrd = new $.Deferred();
		// まず1ページだけ取ってみる
		var self = this;
		// ダイレクトにloopさせてネストがまずいなら
		// setTimeout()経由で切らないといけないか？
		(function loop (url, indexPageNo) {
			console.debug('fetch: ', indexPageNo);
			//console.debug('Akatsuki: load index page', url);
			gNetworkManager.waitForAcquire().then(function() {
				$.get(url).always(function () {
					gNetworkManager.release();
				}).then(function(data) {
					var contents = $('<div/>').append($.parseHTML(data));
					var indexPageInfo = self.$parseIndexPagingNavi(indexPageNo, contents);
					dfrd.notify(indexPageNo, indexPageInfo, contents);
					if (indexPageInfo.done) {
						console.debug('fetch done: ', indexPageNo);
						dfrd.resolve (indexPageNo, indexPageInfo);
					} else {
						++indexPageNo;
						var url = self.$getNovelIndexURL({indexPageNo: indexPageNo});
						//loop (url, indexPageNo);
						setTimeout(loop.bind(self, url, indexPageNo), interval);
					}
				},
				function() {
					//console.debug('fetch index pagefailed', url);
					// どうしよう？とりあえずリトライ
					loop (url, indexPageNo);
				});
			});
		})(self.$getNovelIndexBaseURL(), 1);
		return dfrd.promise();
	};


	///////////////////
	AkatsukiSite.prototype.prepareUiOnOpenNoja = function () {
		$('body').css('overflow', 'hidden');
	};
	AkatsukiSite.prototype.prepareUiOnCloseNoja = function () {
		$('body').css('overflow', 'visible');
	};




	AkatsukiSite.prototype.uiCustomSetup = function () {
		// 初期化段階でのメニューカスタマイズ
		this.$setupLinkMenu ($('noja_link'));
		this.$buildReputationForm ();
	};

	// Deferred interface
	AkatsukiSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};


	AkatsukiSite.prototype.replaceImageURL = function (url) {
		return  url;
	};

	// 個別サイトのよって付ける場所が違う
	//  parse時にdata-nojaをマークしておき
	//  そこに話数順にappend
	//  逆順等で先頭へのprependになる場合はサイト毎の先頭位置タグがいる
	// つけるもののデータ形式もサイト毎に異なる
	// 元サイトでのタグに合わせた形式っぽい
	AkatsukiSite.prototype.autoPagerize = function (secId, secData) {
		if (!gAutoPage) {
			return;
		}
		// @@ TODO @@ 実装
	};








	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	function HamelnSite(url, templates) {
		this.cls = HamelnSite;
		if (templates === undefined) {
			templates = this.cls.templates;
		}

		this.siteInfo = {
			siteName: this.cls.siteInfo.siteName,
			site:     this.cls.siteInfo.site,
			site2:    this.cls.siteInfo.site2,
			api:      this.cls.siteInfo.api,
			//
			basePageURL: url,
			//
			ncode: null,
			ncode2: null,
			author: null,
			title: null,
			//
			token: '',
			login: false,
		};
		applyTemplate.generate (this, templates, this.siteInfo);
		this.parseURL = this.cls.parseURL.bind(this.cls);

		// 汎用で、(keys,src)を指定する
		this.setSiteInfoGeneric = filterCopyProperties.bind(this, this.siteInfo);
		this.setSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, api:0,
		});
		// restore機能用
		this.restoreSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode2:0,
		});
		// import用
		this.restoreSiteInfoForImport = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode:0, ncode2:0, author:0, title:0,
		});
		// filterCopyProperties(keys, src)の全束縛
		// あるいは
		// filterCopyProperties({}, keys, src)の全束縛
		// にしてしまってもよいが…
		this.getSiteInfoForSaveData = filterCopyProperties.bind(this, {
			site: 0, site2:0, ncode:0, ncode2:0,
		}, this.siteInfo);



		// NovelIdによるカスタム設定を初期設定に読み込むか？
		this.isInitializeByCustomSetting = true;
		//
		this.enableReputationForm = false;
		//
		this.alwaysOpenDefault = false;
		//

		// 連載の基礎判定はここでする
		// 短編or目次系ページの判定は中身次第
		var m = this.parseURL (url);
		if (m) {
			this.siteInfo.ncode = m.novelId;
			this.secId = m.sectionId;
			this.isSingleSection = m.isBaseURL;
		} else {
			// 本来formatがあっていてcreateされているはずなので有りえない
		}
		this.maxSectionNo = this.secId;
	}

	HamelnSite.siteInfo = {
		siteName: 'ハーメルン',
		site:  'http://novel.syosetu.org/',
		site2: 'http://novel.syosetu.org/',
		api:   '',
		$reURL: /http:\/\/novel\.syosetu\.org\/(\d+)\/(|index\.html|(\d+)\.html)?/,
	};
	// ハーメルンの場合は短編の場合、
	// 作品topページ=コンテンツページなので、
	// コンテンツページに限定することはできない
	HamelnSite.parseURL = function (url, relative) {
		if (relative === true) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.siteInfo.site + url;
		}
		var m = this.siteInfo.$reURL.exec(url);
		if (m) {
			return {
				novelId: parseInt (m[1]),
				sectionId: parseInt(m[3]),
				isBaseURL: !m[3],
				//
				m: m,
			};
		}
		console.debug('parseURL failed: !m');
		return null;
	};

	HamelnSite.templates = {
		//
		$getSiteURL:				'{{:site}}{{:path}}',
		$getNovelBaseURL:			'{{:site}}{{:ncode}}/',
		$getNovelIndexURL:			'{{:site}}{{:ncode}}/',
		$getNovelSectionURL:		'{{:site}}{{:ncode}}/{{:sectionId}}.html',
	};

	// 相対pathなら絶対path化する
	HamelnSite.prototype.$toAbsoluteURL = function (url) {
		if (!url.startsWith(this.siteInfo.site)) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.$getSiteURL ({path: url});
		}
		return url;
	};

	// TOCだと'./1.html'のような形式らしい
	HamelnSite.prototype.$getSectionIdFromURL = function (url) {
		var m = /(\d+)\.html$/.exec (url);
		if (m) {
			return parseInt(m[1]);
		}
		return null;
	};


	// ctorではできない他Managerとの間の処理等
	// 「のじゃー」ラベルを元ページに貼り付け
	HamelnSite.prototype.initialize = function () {
		//$('#novelnavi_right').append(getNojaLabel());
		gCurrentManager.setSingleSection (this.isSingleSection);
		if (!this.isSingleSection) {
			gCurrentManager.setCurrent (this.secId);
		}
		gThemeManager.setColorTheme({
			color: '#000',
			bgColor: $('body').css('background-color'),
			bgImage: null,
		});

		// まだ目次ページ排除していないのでfetchIndexはできない
	};

	// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	HamelnSite.prototype.onReadyNoja = function () {
		// 目次取得はもう少し早いタイミング
		// (初期ページのparse最後)
	};

	HamelnSite.prototype.onOpenNoja = function () {
		this.prepareUiOnOpenNoja ();
		// openのタイミングで非同期に動かすならここに書く
	};

	HamelnSite.prototype.onCloseNoja = function () {
		this.prepareUiOnCloseNoja ();
	};

	// ncode,ncode2,site,site2はいる
	HamelnSite.prototype.getNovelId = function () {
		return this.siteInfo.ncode;
	};

	HamelnSite.prototype.getTitle = function () {
		return this.siteInfo.title;
	};
	HamelnSite.prototype.getAuthor = function () {
		return this.siteInfo.author;
	};

	HamelnSite.prototype.setToken = function (token) {
		this.siteInfo.token = token;
		this.siteInfo.login = (token !== '');
	};


	// Deferred objectを返す
	HamelnSite.prototype.getNovelSection = function (secId) {
		var self = this;
		if (!gNetworkManager.acquire()) {
			return new $.Deferred().reject().promise();
		}
		return $.get(this.$getNovelSectionURL ({sectionId: secId}))
		.always(function () {
			gNetworkManager.release();
		}).then(function (htmldoc) {
			return new $.Deferred()
				.resolve(self.parseHtmlContents(htmldoc, secId));
		});
	};

	// セクション変更時に設定しないといけないlinkmenu類更新用途
	HamelnSite.prototype.rebuildUiOnChangeSection = function(section_no) {
		//
	};
	// 初期のメニュー設定
	HamelnSite.prototype.$setupLinkMenu = function (linkmenu) {
		//
	};



	// 
	HamelnSite.prototype.getNextSection = function (secId) {
		var newSecId = secId + 1;
		return (newSecId <= this.maxSectionNo) ? newSecId : secId;
	};
	HamelnSite.prototype.getPrevSection = function (secId) {
		var newSecId = secId - 1;
		return (newSecId >= 1) ? newSecId : secId;
	};
	HamelnSite.prototype.isLoadableSection = function (sec) {
		return (sec <= this.maxSectionNo);
	};
	// 目次から話数が取れていても読んでいるうちに更新された時など
	// 変化するのでupdateが必要
	// 殆ど内部用途だが、現状restore,import等から使われるので
	// public扱い
	HamelnSite.prototype.updateMaxSection = function (secId, force) {
		this.maxSectionNo = (force === true) ? secId : Math.max(this.maxSectionNo, secId);
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
	// link解析がindexのa書き換えと同じなのでprivate methodでまとめる
	// nobel_bnは上下2か所になるので上だけ使う
	// @@ TODO @@
	HamelnSite.prototype.$updateRelativeSectionAtSection = function (contents, secId) {
		if (false) {
			var relativeLinks = contents.find('#novel_color > div.novel_bn:eq(0) > a');
			var maxSecId = secId;
			var self = this;
			if (relativeLinks.size()) {
				relativeLinks.each (function() {
					var url = $(this).attr('href');
					//console.debug('got relative link', url);
					var relSecId = self.$getSectionIdFromURL(url);
					if (relSecId !== null) {
						maxSecId = Math.max(maxSecId, relSecId);
					}
				});
			}
			//console.debug('update max', maxSecId);
			this.updateMaxSection (maxSecId);
		}
	};


	//
	// カラー指定の扱いとtoken関連は調整がいる
	HamelnSite.prototype.$parseHtmlCommon = function (contents, section) {
		this.$updateRelativeSectionAtSection (contents, section);
		// 著者はfontの直後のa
		this.siteInfo.author = $('p:eq(0) > font[size="+2"]:eq(0) + a:eq(0)', contents).text();
		//console.debug("author:", this.siteInfo.author);

		var sec = {};

		//console.debug("title:", this.siteInfo.title);
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
		//console.debug(sec);
		return sec;
	};

	HamelnSite.prototype.$updateThemeAtSection = function (contents) {
		gThemeManager.setColorTheme({
			color  : contents.css('color'),
			bgColor: '#ffffff',
			bgImage: null,
		});
		if (false) {
			gThemeManager.setBackground($('body'));
		}
	};

	HamelnSite.prototype.$updateTitleAtSection = function (contents) {
		// ここの判定はなんとか変更したいところ
		// タイトル関連
		// タイトルはfontの中のa
		this.siteInfo.title = $('p:eq(0) > font[size="+2"]:eq(0) > a:eq(0)', contents).text();
		//console.debug("title:", this.siteInfo.title);
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
		return this.$parseHtmlCommon (contents, section);
	};

	// カラー指定の扱いとtoken関連は調整がいる
	// 初期段階ではURLしかみていないため、
	// トップページが短編本文ページなのか目次ページなのか
	// 区別できない仕様なので、中身がないこともありうる
	HamelnSite.prototype.parseInitialPage = function () {
		var dfrd = new $.Deferred ();
		var contents = $('#maind > div.ss:eq(0)');
		// minimum check
		if (!contents.size() || !contents.find('font[size="+2"]:eq(0) > a').size()) {
			console.debug('min check failed');
			return dfrd.reject ();
		}
		// ログイン関連はとりあえず無効
		this.siteInfo.login = false;
		this.siteInfo.token = null;
		this.siteInfo.ncode2 = null;

		this.$updateThemeAtSection (contents);
		this.$updateTitleAtSection (contents);

		gSectionManager.registData (gCurrentManager.id
			, this.$parseHtmlCommon (contents, gCurrentManager.id));
		gCurrentManager.setCurrent (gCurrentManager.id);

		// autoPagerが貼り付ける先に独自attrを付ける
		if (false) {
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', gCurrentManager.id);
		}

		////////////////////////////////////////
		// 文章ページと確定したので目次を取得する
		if (!this.isSingleSection) {
			this.loadIndex ().then(
				function (tocInfo) {
					// 登録処理
					gIndexManager.registIndex (tocInfo);
				}
				// errorならそのまま？
			);
		}
		//////////////////////////////////////
		return dfrd.resolve ();
	};



	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	HamelnSite.prototype.selectNojaIndexData = function () {
		var indexSelector = '#noja_index';
		return $(
			[
				'div.novel_title',
				'div.novel_writername',
				'#novel_ex',
				'div.index_box'
			].map(function (selector) {
				return indexSelector + ' ' + selector;
			}).join(', ')
		);
	};

	// urlの絶対パス化(or index位置と元ページ位置の違いを補正)
	// jumpしてほしいリンクには独自attrでジャンプ先を指定しておく
	// (sectionNoを割り当てる)
	HamelnSite.prototype.$parseIndexPage = function (htmldoc) {

		var self = this;
		var indexPage = $($.parseHTML(htmldoc)).find('#maind');
		var info = indexPage.find('div.ss:eq(0)');
		var tocInfo = {
			totalSections: this.maxSectionNo,
			//series:      null,	// ない場合は項目自体なしでOk
			title:       info.find('font[size="+2"]:eq(0)'),
			author:      info.find('a:eq(0)'),	// 本当はtitleの後というほうが正しい？
			description: indexPage.find('div.ss:eq(1)'),	// 後ろにhrが付いている
			index:       indexPage.find('div.ss:eq(2)'),
		};
		console.debug(tocInfo);

		// titleとauthorについては内部で持っているものと違うなら更新
		// 別に不要なので放置
		// 本来はlink位置の調整がいるがroot path指定ならいらない
		// authorのリンクはフルURLなので不要
		// descriptionもすることがない

		// index部分
		// href無効化、css設定、click handler設定
		// 多分、urlからsecIdを出すほうがいいはず
		// マウスカーソルをlinkクリック可能な表示に変えるためのcss指定
		var indexItemStyle = {
			'cursor': 'pointer',
		};
		var totalSections = 0;
		var maxSectionNo = 0;
		$(tocInfo.index).find('a').each(function () {
			var url = $(this).attr('href');
			var secId = self.$getSectionIdFromURL(url);
			if (secId !== null) {
				$(this).attr('noja_jumpTo', secId);
				maxSectionNo = Math.max(maxSectionNo, secId);
				++totalSections;
			}
			$(this).attr('href', null)		// @@ TODO @@ Javascript側のcleanup
			.css(indexItemStyle)
			;
		});
		if (totalSections != maxSectionNo) {
			console.debug('totalSections != maxSectionNo', totalSections, maxSectionNo);
		}
		// コンテンツ更新されるタイミングもあるので更新する
		this.updateMaxSection (maxSectionNo);
		tocInfo.totalSections = maxSectionNo;
		return tocInfo;
	};

	// indexは帯域制御外とする
	// ただし、自分自身の多重loadだけは避ける
	HamelnSite.prototype.loadIndex = function () {
		// 既に動いている途中ならそれを返す
		if (('deferredFetchIndex' in this)
			&& this.deferredFetchIndex !== null
			&& this.deferredFetchIndex.state() == 'pending') {
			return this.deferredFetchIndex;
		}
		// 初回or完了済の更新
		var self = this;
		this.deferredFetchIndex = $.get (this.$getNovelIndexURL()).then(
			// success: .done
			function (htmldoc) {
				var tocInfo = self.$parseIndexPage (htmldoc);
				return new $.Deferred().resolve (tocInfo).promise();
			}
			// error: そのままgetのfailを返す
		);
		return this.deferredFetchIndex.promise();
	};


	// Deferred interface
	HamelnSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};


	HamelnSite.prototype.replaceImageURL = function (url) {
		return  url;
	};



	//////////

	HamelnSite.prototype.prepareUiOnOpenNoja = function () {
		$('body').css('overflow', 'hidden');
	};
	HamelnSite.prototype.prepareUiOnCloseNoja = function () {
		$('body').css('overflow', 'visible');
	};

	HamelnSite.prototype.rebuildFormsOnImportRestore = function () {
		//
	};

	// 評価formの構築
	HamelnSite.prototype.$buildReputationForm = function() {
		//
	};


	HamelnSite.prototype.uiCustomSetup = function () {
		// 初期化段階でのメニューカスタマイズ
		this.$setupLinkMenu ($('noja_link'));
		this.$buildReputationForm ();
	};

	// 個別サイトのよって付ける場所が違う
	//  parse時にdata-nojaをマークしておき
	//  そこに話数順にappend
	//  逆順等で先頭へのprependになる場合はサイト毎の先頭位置タグがいる
	// つけるもののデータ形式もサイト毎に異なる
	// 元サイトでのタグに合わせた形式っぽい
	HamelnSite.prototype.autoPagerize = function (secId, secData) {
		if (!gAutoPage) {
			return;
		}
		// @@ TODO @@ 実装
	};




	////////////////////////////////////////////////////////////

	function PixivSite(url, templates) {
		this.cls = PixivSite;
		if (templates === undefined) {
			templates = this.cls.templates;
		}

		this.siteInfo = {
			siteName: this.cls.siteInfo.siteName,
			site:     this.cls.siteInfo.site,
			site2:    this.cls.siteInfo.site2,
			api:      this.cls.siteInfo.api,
			//
			basePageURL: url,
			//
			ncode: null,
			ncode2: null,
			author: null,
			title: null,
			//
			token: '',
			login: false,
		};

		applyTemplate.generate (this, templates, this.siteInfo);
		this.parseURL = this.cls.parseURL.bind(this.cls);

		// 汎用で、(keys,src)を指定する
		this.setSiteInfoGeneric = filterCopyProperties.bind(this, this.siteInfo);
		this.setSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, api:0,
		});
		// restore機能用
		this.restoreSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode2:0,
		});
		// import用
		this.restoreSiteInfoForImport = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode:0, ncode2:0, author:0, title:0,
		});
		// filterCopyProperties(keys, src)の全束縛
		// あるいは
		// filterCopyProperties({}, keys, src)の全束縛
		// にしてしまってもよいが…
		this.getSiteInfoForSaveData = filterCopyProperties.bind(this, {
			site: 0, site2:0, ncode:0, ncode2:0,
		}, this.siteInfo);


		// NovelIdによるカスタム設定を初期設定に読み込むか？
		this.isInitializeByCustomSetting = true;
		//
		this.enableReputationForm = false;
		//
		this.alwaysOpenDefault = false;


		var m = this.parseURL (url);
		if (m) {
			this.siteInfo.ncode = m.novelId;
			this.isSingleSection = true;
			this.secId = 1;
		} else {
			// 本来formatがあっていてcreateされているはずなので有りえない
		}
		this.maxSectionNo = this.secId;
	}

	PixivSite.siteInfo = {
		siteName: 'pixiv',
		site:  'http://www.pixiv.net/novel/',
		site2: 'http://www.pixiv.net/novel/',
		api:   '',
		// http://www.pixiv.net/novel/show.php?id={{:novelId}}
		$reURL: /http:\/\/www\.pixiv\.net\/novel\/show.php\?id=(\d+)/,
	};
	PixivSite.parseURL = function (url, relative) {
		if (relative === true) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.siteInfo.site + url;
		}
		var m = this.siteInfo.$reURL.exec(url);
		if (m) {
			return {
				novelId: m[1],
				//
				m: m,
			};
		}
		console.debug('parseURL failed: !m');
		return null;
	};

	PixivSite.templates = {
		//
		$getSiteURL:				'{{:site}}{{:path}}',
		//$getNovelBaseURL:			'{{:site}}{{:ncode}}/',
		//$getNovelIndexURL:			'{{:site}}{{:ncode}}/',
		//$getNovelSectionURL:		'{{:site}}{{:ncode}}/{{:sectionId}}/',
	};
	// 相対pathなら絶対path化する
	PixivSite.prototype.$toAbsoluteURL = function (url) {
		if (!url.startsWith(this.siteInfo.site)) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.$getSiteURL ({path: url});
		}
		return url;
	};


	// ctorではできない他Managerとの間の処理等
	// 「のじゃー」ラベルを元ページに貼り付け
	PixivSite.prototype.initialize = function () {
		//$('#novelnavi_right').append(getNojaLabel());
		gCurrentManager.setSingleSection (this.isSingleSection);
		gCurrentManager.setCurrent (this.secId);
		//if (!this.isSingleSection) {
		//	gCurrentManager.setCurrent (this.secId);
		//}
		gThemeManager.setColorTheme({
			color: '#000',
			bgColor: $('body').css('background-color'),
			bgImage: null,
		});
	};

	// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	PixivSite.prototype.onReadyNoja = function () {
		//
	};

	PixivSite.prototype.onOpenNoja = function () {
		this.prepareUiOnOpenNoja ();
		// openのタイミングで非同期に動かすならここに書く
	};

	PixivSite.prototype.onCloseNoja = function () {
		this.prepareUiOnCloseNoja ();
	};


	// ncode,ncode2,site,site2はいる
	PixivSite.prototype.getNovelId = function () {
		return this.siteInfo.ncode;
	};

	PixivSite.prototype.getTitle = function () {
		return this.siteInfo.title;
	};
	PixivSite.prototype.getAuthor = function () {
		return this.siteInfo.author;
	};

	PixivSite.prototype.setToken = function (token) {
		this.siteInfo.token = token;
		this.siteInfo.login = (token !== '');
	};


	// Deferred interface
	PixivSite.prototype.getNovelSection = function (secId) {
		return $.Deferred().reject().promise();
	};

	// セクション変更毎に設定しなおすもの
	PixivSite.prototype.rebuildUiOnChangeSection = function(section_no) {
		// linkmenu等
	};



	PixivSite.prototype.getNextSection = function (secId) {
		return secId;
	};
	PixivSite.prototype.getPrevSection = function (secId) {
		return secId;
	};
	PixivSite.prototype.isLoadableSection = function (sec) {
		return false;
		//return (sec <= this.maxSectionNo);
	};
	PixivSite.prototype.updateMaxSection = function (secId, force) {
		//this.maxSectionNo = (force === true) ? secId : Math.max(this.maxSectionNo, secId);
	};


	// カラー指定の扱いとtoken関連は調整がいる
	PixivSite.prototype.$parseHtmlCommon = function (novelInfo, contents, section) {
		var userData = $('div.userData', novelInfo);
		// どうせなら著者とタイトルは一緒に更新する？
		// this.updateTitleAuthorAtSection (novelInfo);
		this.siteInfo.author = userData.children('h2.name').text();
		//
		//var datetime = userData.children('span.date');

		// caption,tagは #tag_area等で直接指定可能
		// '#wrapper div,caption-tag-container > #caption_long'
		var tags = $('#tag_area', novelInfo);

		//console.debug("author:", this.siteInfo.author);

		var sec = {};

		sec.chapter_title = '';
		sec.subtitle = this.siteInfo.title;

		var pre = $('#caption_long', novelInfo);
		var body = contents;
		var post = null;

		// contentsの事前フィルタがいるもの
		// [pixivimage:42077349-2]
		// [newpage]

		sec._honbun = (body) ? body.html() : null;
		sec._maegaki = (pre) ? pre.html() : null;
		sec._atogaki = (post) ? post.html() : null;
		//
		//console.debug("_honbun", sec._honbun);
		//console.debug("_maegaki", sec._maegaki);
		//console.debug("_atogaki", sec._atogaki);
		//
		//console.debug(sec);
		console.debug(sec);
		return sec;
	};

	PixivSite.prototype.$updateThemeAtSection = function (novelInfo) {
		gThemeManager.setColorTheme({
			color  : novelInfo.css('color'),
			bgColor: '#ffffff',
			bgImage: null,
		});
		if (false) {
			gThemeManager.setBackground($('body'));
		}
	};

	PixivSite.prototype.$updateTitleAuthorAtSection = function (novelInfo) {
		var userData = $('div.userData', novelInfo);
		this.siteInfo.title = userData.children('h1.title').text();
		this.siteInfo.author = userData.children('h2.name').text();
		//console.debug("title:", this.siteInfo.title);
	};

	PixivSite.prototype.parseHtmlContents = function (htmldoc, section) {
		// '#maind'がbody直下でなければ仮divにつけなくてもよいが
		// 保守性を考え仮divにつけておく
		var contents = $('<div/>').append($.parseHTML(htmldoc))
			.find('#maind > div.ss:eq(0)');
		// minimum check
		if (!contents.size()) {
			console.debug('min check failed');
			return null;
		}
		return this.$parseHtmlCommon (contents, section);
	};

	// カラー指定の扱いとtoken関連は調整がいる
	// 初期段階ではURLしかみていないため、
	// トップページが短編本文ページなのか目次ページなのか
	// 区別できない仕様なので、中身がないこともありうる
	PixivSite.prototype.parseInitialPage = function () {
		var dfrd = new $.Deferred ();
		var novelInfo = $('#wrapper .novelbody-container');
		//console.debug(novelInfo.html());

		// noscriptの中に埋まっているフルテキストを拾う
		//console.debug( $('noscript', novelInfo));
		var contents = $($('noscript', novelInfo).text());
		//console.debug(contents);

		// minimum check
		if (!contents.size()) {
			console.debug('min check failed');
			return dfrd.reject ();
		}
		// ログイン関連はとりあえず無効
		this.siteInfo.login = false;
		this.siteInfo.token = null;
		this.siteInfo.ncode2 = null;

		this.$updateThemeAtSection (novelInfo);
		this.$updateTitleAuthorAtSection (novelInfo);

		gSectionManager.registData (gCurrentManager.id
			, this.$parseHtmlCommon (novelInfo, contents, gCurrentManager.id));
		gCurrentManager.setCurrent (gCurrentManager.id);

		// autoPagerが貼り付ける先に独自attrを付ける
		if (false) {
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', gCurrentManager.id);
		}
		return dfrd.resolve ();
	};



	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	PixivSite.prototype.selectNojaIndexData = function () {
		var indexSelector = '#noja_index';
		return $(
			[
				'div.novel_title',
				'div.novel_writername',
				'#novel_ex',
				'div.index_box'
			].map(function (selector) {
				return indexSelector + ' ' + selector;
			}).join(', ')
		);
	};

	// Deferred interface
	// 内部で持つ情報は更新しても
	// globalな情報は呼出し元で更新させる
	PixivSite.prototype.loadIndex = function () {
		return new $.Deferred().reject().promise();
	};


	// Deferred interface
	PixivSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};


	PixivSite.prototype.replaceImageURL = function (url) {
		return  url;
	};

	// 


	//////////

	PixivSite.prototype.prepareUiOnOpenNoja = function () {
		$('body').css('overflow', 'hidden');
	};
	PixivSite.prototype.prepareUiOnCloseNoja = function () {
		$('body').css('overflow', 'visible');
	};

	PixivSite.prototype.rebuildFormsOnImportRestore = function () {
		//
	};

	// 評価formの構築
	PixivSite.prototype.$buildReputationForm = function() {
		//
	};

	// 初期設定
	PixivSite.prototype.$setupLinkMenu = function (linkmenu) {
		// linkmenu等
	};

	PixivSite.prototype.uiCustomSetup = function () {
		// 初期化段階でのメニューカスタマイズ
		this.$setupLinkMenu ($('noja_link'));
		this.$buildReputationForm ();
	};




	// 個別サイトのよって付ける場所が違う
	//  parse時にdata-nojaをマークしておき
	//  そこに話数順にappend
	//  逆順等で先頭へのprependになる場合はサイト毎の先頭位置タグがいる
	// つけるもののデータ形式もサイト毎に異なる
	// 元サイトでのタグに合わせた形式っぽい
	PixivSite.prototype.autoPagerize = function (secId, secData) {
		if (!gAutoPage) {
			return;
		}
		// @@ TODO @@ 実装
	};

	//////////////////////////////////////////////////////////////////////////////

	function ArcadiaSite(url, templates) {
		this.cls = ArcadiaSite;
		if (templates === undefined) {
			templates = this.cls.templates;
		}

		this.siteInfo = {
			siteName: this.cls.siteInfo.siteName,
			site:     this.cls.siteInfo.site,
			site2:    this.cls.siteInfo.site2,
			api:      this.cls.siteInfo.api,
			//
			basePageURL: url,
			//
			ncode: null,
			ncode2: null,
			author: null,
			title: null,
			//
			token: '',
			login: false,
			//
			categoryId: '',
		};

		applyTemplate.generate (this, templates, this.siteInfo);
		this.parseURL = this.cls.parseURL.bind(this.cls);

		// 汎用で、(keys,src)を指定する
		this.setSiteInfoGeneric = filterCopyProperties.bind(this, this.siteInfo);
		this.setSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, api:0,
		});
		// restore機能用
		this.restoreSiteInfo = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode2:0,
		});
		// import用
		this.restoreSiteInfoForImport = filterCopyProperties.bind(this, this.siteInfo, {
			site:0, site2:0, ncode:0, ncode2:0, author:0, title:0,
		});
		// filterCopyProperties(keys, src)の全束縛
		// あるいは
		// filterCopyProperties({}, keys, src)の全束縛
		// にしてしまってもよいが…
		this.getSiteInfoForSaveData = filterCopyProperties.bind(this, {
			site: 0, site2:0, ncode:0, ncode2:0,
		}, this.siteInfo);


		// NovelIdによるカスタム設定を初期設定に読み込むか？
		this.isInitializeByCustomSetting = true;
		//
		this.enableReputationForm = false;
		//
		this.alwaysOpenDefault = false;


		var m = this.parseURL (url);
		if (m) {
			this.siteInfo.ncode = m.novelId;
			this.isSingleSection = false;
			this.secId = m.sectionId;
			this.siteInfo.categoryId = m.categoryId;
		} else {
			// 本来formatがあっていてcreateされているはずなので有りえない
		}
		this.maxSectionNo = this.secId;
	}

	ArcadiaSite.siteInfo = {
		siteName: 'Arcadia',
		site:  'http://www.mai-net.net/',
		site2: 'http://www.mai-net.net/',
		api:   '',
		// listから移動するtopにはcount=1がついている場合もあるようだが詳細は謎
		$reURL: /http:\/\/www\.mai-net\.net\/bbs\/sst\/sst\.php\?act=dump&cate=([-0-9A-Za-z_]+)&all=(\d+)&n=(\d+)/,
	};
	ArcadiaSite.parseURL = function (url, relative) {
		if (relative === true) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.siteInfo.site + url;
		}
		var m = this.siteInfo.$reURL.exec(url);
		if (m) {
			return {
				categoryId: m[1],
				novelId: parseInt(m[2]),
				sectionId: parseInt(m[3]),
				//
				m: m,
			};
		}
		console.debug('parseURL failed: !m');
		return null;
	};

	ArcadiaSite.templates = {
		//
		$getSiteURL:				'{{:site}}{{:path}}',
		$getNovelBaseURL:			'{{:site}}bbs/sst/sst.php?act=dump&cate={{:categoryId}}8&all={{:ncode}}&n=0&count=1',
		$getNovelIndexURL:			'{{:site}}bbs/sst/sst.php?act=dump&cate={{:categoryId}}8&all={{:ncode}}&n=0&count=1',
		$getNovelSectionURL:		'{{:site}}bbs/sst/sst.php?act=dump&cate={{:categoryId}}8&all={{:ncode}}&n={{:sectionId}}',
	};
	// 相対pathなら絶対path化する
	ArcadiaSite.prototype.$toAbsoluteURL = function (url) {
		if (!url.startsWith(this.siteInfo.site)) {
			if (url.startsWith('/')) {
				url = url.slice(1);
			}
			url = this.$getSiteURL ({path: url});
		}
		return url;
	};


	// ctorではできない他Managerとの間の処理等
	// 「のじゃー」ラベルを元ページに貼り付け
	ArcadiaSite.prototype.initialize = function () {
		//$('#novelnavi_right').append(getNojaLabel());
		gCurrentManager.setSingleSection (this.isSingleSection);
		gCurrentManager.setCurrent (this.secId);
		gThemeManager.setColorTheme({
			color: '#000',
			bgColor: $('body').css('background-color'),
			bgImage: null,
		});
	};

	// 初期化終了直前に非同期になにか動かしたいものがあればここに書く
	ArcadiaSite.prototype.onReadyNoja = function () {
		//
	};

	ArcadiaSite.prototype.onOpenNoja = function () {
		this.prepareUiOnOpenNoja ();
		// openのタイミングで非同期に動かすならここに書く
	};

	ArcadiaSite.prototype.onCloseNoja = function () {
		this.prepareUiOnCloseNoja ();
	};


	// ncode,ncode2,site,site2はいる
	ArcadiaSite.prototype.getNovelId = function () {
		return this.siteInfo.ncode;
	};

	ArcadiaSite.prototype.getTitle = function () {
		return this.siteInfo.title;
	};
	ArcadiaSite.prototype.getAuthor = function () {
		return this.siteInfo.author;
	};

	ArcadiaSite.prototype.setToken = function (token) {
		this.siteInfo.token = token;
		this.siteInfo.login = (token !== '');
	};


	// Deferred interface
	ArcadiaSite.prototype.getNovelSection = function (secId) {
		var self = this;
		if (!gNetworkManager.acquire()) {
			return new $.Deferred().reject().promise();
		}
		return $.get(this.$getNovelSectionURL ({sectionId: secId}))
		.always(function () {
			gNetworkManager.release();
		}).then(function (htmldoc) {
			return new $.Deferred()
				.resolve(self.parseHtmlContents(htmldoc, secId)).promise();
		});
	};

	// セクション変更毎に設定しなおすもの
	ArcadiaSite.prototype.rebuildUiOnChangeSection = function(section_no) {
		// linkmenu等
	};



	ArcadiaSite.prototype.getNextSection = function (secId) {
		var newSecId = secId + 1;
		return (newSecId <= this.maxSectionNo) ? newSecId : secId;
	};
	// Arcadiaの場合はsecId == 0も有効なsection
	ArcadiaSite.prototype.getPrevSection = function (secId) {
		var newSecId = secId - 1;
		return (newSecId >= 0) ? newSecId : secId;
	};
	ArcadiaSite.prototype.isLoadableSection = function (sec) {
		return (sec <= this.maxSectionNo);
	};
	ArcadiaSite.prototype.updateMaxSection = function (secId, force) {
		this.maxSectionNo = (force === true)
			? secId : Math.max(this.maxSectionNo, secId);
	};

	// '#table'
	ArcadiaSite.prototype.$parseIndexPage = function (index) {
		var self = this;
		var tr = index.find('tr').filter(function() {
			return ($(this).find('>td').size() == 4);
		});
		var info = tr.eq(0);
		var title = info.find('>td:eq(1) a');
		var author = info.find('>td:eq(2)');
		var title_text = title.text();
		var author_text = author.text().replace(/\[([^\]]+)\]/, '$1');
		this.siteInfo.title = title_text;
		this.siteInfo.author = author_text;
		var totalSections = tr.size();
		var tocInfo = {
			totalSections: tr.size(),
			//series:      null,	// ない場合は項目自体なしでOk
			title:       title.clone(),
			author:      author.clone(),
			//description: ,
			index:       index.clone(),
		};
		this.updateMaxSection (totalSections - 1);
		return tocInfo;
	};

	// カラー指定の扱いとtoken関連は調整がいる
	ArcadiaSite.prototype.$parseHtmlCommon = function (contents, tocInfo, section) {
		var info = contents.find('td.bgc > table:eq(0)');
		var author = info.find('tt:eq(0)').text().replace(/Name:\s+/,'');
		// infoのtd[align=right]にrelative linkがある
		// どうせなら著者とタイトルは一緒に更新する？
		// this.updateTitleAuthorAtSection (novelInfo);
		this.siteInfo.author = author;
		//
		// 'Date: YYYY/MM/DD hh:mm'
		var datetime = contents.find('td.bgc > tt:eq(0)');

		var sec = {};

		sec.chapter_title = '';
		sec.subtitle = contents.find('td.bgb > font[size=4]').text();

		var pre = null;
		var body = contents.find('td.bgc > blockquote > div');
		var post = null;

		// textNodeの先頭がsubtitleと同一ならそこをremoveしたほうがいい

		sec._honbun = (body) ? body.html() : null;
		sec._maegaki = (pre) ? pre.html() : null;
		sec._atogaki = (post) ? post.html() : null;
		//
		//console.debug("_honbun", sec._honbun);
		//console.debug("_maegaki", sec._maegaki);
		//console.debug("_atogaki", sec._atogaki);
		//
		//console.debug(sec);
		console.debug(sec);
		return sec;
	};

	ArcadiaSite.prototype.$updateThemeAtSection = function (novelInfo) {
		gThemeManager.setColorTheme({
			color  : novelInfo.css('color'),
			bgColor: '#ffffff',
			bgImage: null,
		});
		if (false) {
			gThemeManager.setBackground($('body'));
		}
	};

	ArcadiaSite.prototype.$updateTitleAuthorAtSection = function (novelInfo) {
		var userData = $('div.userData', novelInfo);
		this.siteInfo.title = userData.children('h1.title').text();
		this.siteInfo.author = userData.children('h2.name').text();
		//console.debug("title:", this.siteInfo.title);
	};

	ArcadiaSite.prototype.parseHtmlContents = function (htmldoc, section) {
		// '#maind'がbody直下でなければ仮divにつけなくてもよいが
		// 保守性を考え仮divにつけておく
		var t = $('<div/>').append($.parseHTML(htmldoc));
		var tocInfo = t.find('#table');
		var contents = t.find('table.brdr');
		// minimum check
		if (!contents.size()) {
			console.debug('min check failed');
			return null;
		}
		return this.$parseHtmlCommon (contents, tocInfo, section);
	};

	// カラー指定の扱いとtoken関連は調整がいる
	// 'a[name="kiji"]'の直後のtable
	// 'table.brdr'
	ArcadiaSite.prototype.parseInitialPage = function () {
		var dfrd = new $.Deferred ();
		var tocInfo = $('#table');
		var contents = $('table.brdr');

		// minimum check
		if (!contents.size()) {
			console.debug('min check failed');
			return dfrd.reject ().promise();
		}
		// ログイン関連はとりあえず無効
		this.siteInfo.login = false;
		this.siteInfo.token = null;
		this.siteInfo.ncode2 = null;

		//this.$updateThemeAtSection (novelInfo);
		//this.$updateTitleAuthorAtSection (novelInfo);

		gSectionManager.registData (gCurrentManager.id
			, this.$parseHtmlCommon (contents, tocInfo, gCurrentManager.id));
		gCurrentManager.setCurrent (gCurrentManager.id);

		gIndexManager.registIndex (this.$parseIndexPage (tocInfo));

		// autoPagerが貼り付ける先に独自attrを付ける
		if (false) {
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a')
				.attr('data-noja', gCurrentManager.id);
		}
		return dfrd.resolve ().promise();
	};



	// 目次ページを作ったときのtag要素に依存するデータ構造
	// saveDataで利用する
	ArcadiaSite.prototype.selectNojaIndexData = function () {
		var indexSelector = '#noja_index';
		return $(
			[
				'div.novel_title',
				'div.novel_writername',
				'#novel_ex',
				'div.index_box'
			].map(function (selector) {
				return indexSelector + ' ' + selector;
			}).join(', ')
		);
	};

	// Deferred interface
	// 内部で持つ情報は更新しても
	// globalな情報は呼出し元で更新させる
	ArcadiaSite.prototype.loadIndex = function () {
		return new $.Deferred().reject().promise();
	};


	// Deferred interface
	ArcadiaSite.prototype.importInitialContents = function () {
		// なにもないのでresolveしたDeferredのpromiseを返す
		return new $.Deferred().resolve().promise();
	};


	ArcadiaSite.prototype.replaceImageURL = function (url) {
		return  url;
	};

	// 


	//////////

	ArcadiaSite.prototype.prepareUiOnOpenNoja = function () {
		$('body').css('overflow', 'hidden');
	};
	ArcadiaSite.prototype.prepareUiOnCloseNoja = function () {
		$('body').css('overflow', 'visible');
	};

	ArcadiaSite.prototype.rebuildFormsOnImportRestore = function () {
		//
	};

	// 評価formの構築
	ArcadiaSite.prototype.$buildReputationForm = function() {
		//
	};

	// 初期設定
	ArcadiaSite.prototype.$setupLinkMenu = function (linkmenu) {
		// linkmenu等
	};

	ArcadiaSite.prototype.uiCustomSetup = function () {
		// 初期化段階でのメニューカスタマイズ
		this.$setupLinkMenu ($('noja_link'));
		this.$buildReputationForm ();
	};




	// 個別サイトのよって付ける場所が違う
	//  parse時にdata-nojaをマークしておき
	//  そこに話数順にappend
	//  逆順等で先頭へのprependになる場合はサイト毎の先頭位置タグがいる
	// つけるもののデータ形式もサイト毎に異なる
	// 元サイトでのタグに合わせた形式っぽい
	ArcadiaSite.prototype.autoPagerize = function (secId, secData) {
		if (!gAutoPage) {
			return;
		}
		// @@ TODO @@ 実装
	};







	////////////////////////////////////////////////////////////
	var createSiteParser = function (url) {
		var site_parser = (function (parserList) {
			for (var i = 0; i < parserList.length; ++i) {
				var site_parser = parserList[i];
				if (site_parser.parseURL(url) !== null) {
					return site_parser;
				}
			}
			return null;
		})([
			AppModeSite,
			NarouSite,
			NocMoonSite,
			AkatsukiSite,
			HamelnSite,
			PixivSite,
			ArcadiaSite
		]);
		if (site_parser !== null) {
			console.debug('selected siteParser: ' + site_parser.siteInfo.siteName);
			return new site_parser(url);
		}
		console.debug('select: no parser');
		return null;
	};

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


/////////////////////////////////////////////////////////////////////////
	// 右スライダーのページナビ
	// canvasにtagでsection idとpage noを埋め込んだ方がいいのかもしれず
	// $('<div/>').append(document.createTextNode(page + 'ページ'));
	// のほうがまともか？
	$.templates('updateNaviIndexTmpl', '<div>{{:page}}ページ</div>');
	// canvasもtemplate化したほうがいいが、html側にもっていくべき

	var gPageNavigationManager = {
		_id: 'noja_page_',
		_selector: '#noja_page_',
		_getCanvasFont: function () {
			return get_canvas_font (gThumbFontSize);
		},

		// prefix省略ならselector id : ''指定ならid attribute
		_getPageId: function (page) {
			return this._id + page;
		},
		_getPageSelector: function (page) {
			return this._selector + page;
		},

		////////////////////////////////////////////////////////
		showCursor: function (page) {
			var cursor = $(this._getPageSelector(page));
			if (cursor.size()) {
				cursor.addClass('noja_page_select')
					.css('border-color', '');
			}
		},
		hideCursor: function (page) {
			var cursor = $(this._getPageSelector(page));
			if (cursor.size()) {
				cursor.removeClass('noja_page_select')
					.css('border-color', gThemeManager.color.color);
			}
		},

		////////////////////////////////////////////////////////
		// ページを描画
		drawPage: function (page) {
			var thumb = $(this._getPageSelector(page));
			if (!thumb.size()) {
				console.debug ('drawPage: thumb not found');
			}
			var ctx = thumb.get(0).getContext('2d');
			ctx.font = this._getCanvasFont();
			drawPage(ctx
				, gThumbFontSize
				, gThumbSize
				, page
				, gThumbSize.width / gMainSize.width);
		},

		////////////////////////////////////////////////////////
		// この関数自体は
		// ・レイアウト切り替え(gSettingの変化)
		// ・フォントサイズ等viewパラメータの変化
		// ・セクション移動
		// に付随して呼ばれるべきもの
		update: function() {
			var navi = navigationFrame.$div();
			navi.empty();
			var canvas_attr = {
				width: gThumbSize.width + 'px',
				height: gThumbSize.height + 'px',
			};
			// @@ 一応単ページ対応
			var secId = gCurrentManager.id;
			console.debug('create thumb:', 0, gCurrentManager.totalPages, gCurrentManager.pagesPerCanvas);
			for (var pageNo = 0;
				pageNo < gCurrentManager.totalPages;
				pageNo += gCurrentManager.pagesPerCanvas) {
				canvas_attr.id = this._getPageId(pageNo, '');
				navi.append($.render.updateNaviIndexTmpl({page: (pageNo + 1)}))
					.append(
						$('<canvas />')
						.attr(canvas_attr)
						.css('border-color', gThemeManager.color.color)
						.on('click',  clickJumpHandlerFactory (secId, pageNo))
					);
				this.drawPage (pageNo);
			}
			this.showCursor ();
		},
	};

//////////////////////////////////////////////////////////////////////////


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
					gPageNavigationManager.drawPage (ctx.page_no);
				}
			}
		};
	};
	////////////////////////////////////////////////////////
	var createImageDOMElement = function (url, section_id, page_no) {
		return $('<img>')
			.attr('src', url)
			.on('load', imageLoadHandlerFactory (section_id, page_no))
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
		text = text.replace(RE_G_LINEBREAK, '');
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
	var gFormatSpec = {
		indent: {
			layoutBox:   2,
			mainText:    0,
			frontMatter: 2,
			backMatter:  2,
		},
	};
	// 前書き・後書き用(レイアウト時に字下げするため文字数を減らす)
	splitPageEx = function(text, nlines, nchars, space) {
		if (text === null) {
			return null;
		}
		// レイアウトするときは
		if (gLayout) {
			return splitPage(text, nlines, nchars - gFormatSpec.indent.layoutBox, space);
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
		if (!('_honbun' in secData) || (secData._honbun === null)) {
			console.debug('splitContentsBody: _honbun missing:', secId, secData);
		}
		secData.honbun  =   splitPage(secData._honbun,  gLinesPerCanvas, gCharsPerLine);
		secData.maegaki = splitPageEx(secData._maegaki, gLinesPerCanvas, gCharsPerLine
			, gFormatSpec.indent.frontMatter);
		secData.atogaki = splitPageEx(secData._atogaki, gLinesPerCanvas, gCharsPerLine
			, gFormatSpec.indent.backMatter);
		secData.formatSpec = {
			linesPerCanvas: gLinesPerCanvas,
			charsPerLine:   gCharsPerLine,
			indent: {
				layoutBox:   gFormatSpec.indent.layoutBox,
				mainText:    gFormatSpec.indent.mainText,
				frontMatter: gFormatSpec.indent.frontMatter,
				backMatter:  gFormatSpec.indent.backMatter,
			},
		};
		return secData;
	};


	////////////////////////////////////////////////////////
	// これ全体gIndexManagerに収容すべき
	////////////////////////////////////////////////////////


	// rangeオーバー理由の判定は不要になったのと
	// maxSectionのdeferredな取得はなしにしたので構造が単純化
	var gLoadSectionManager = {
		ERROR_INVALID_SECTION:   -1,	// 
		ERROR_REQUESTED_SECTION: -2,	// 読み込み中
		ERROR_NETWORK_FAILED:    -3,	//
		interval: 100,
		// secNoのセクションがSectionManagerのDBにあるかどうかは関係なく
		// 指定されたsecNoのものを読んでくる
		// rawなI/Fとして常に指定secNoのものを読むモード
		// 呼出し側で既存チェックし再利用するか強制ロードするかを決める
		load: function(secNo, force) {
			if (force === undefined) {
				force = false;
			}
			var self = this;
			// load開始直前の通知がいるので自前のdfrdがいる
			var dfrd = new $.Deferred();
			// まずSectionManagerのもつキャッシュに問い合わせ
			// 再読み込みではないケースで、既にDB上にある
			if (!force && gSectionManager.isSectionReady(secNo)) {
				return dfrd.resolve(secNo, false).promise();
			}
			// 既に読み込み中ならエラー
			if (gSectionManager.isSectionLoading(secNo)) {
				return dfrd.reject(self.ERROR_REQUESTED_SECTION).promise();
			}
			// 読み込み可能なセクションかを問い合わせて確認する
			if (!gSiteParser.isLoadableSection(secNo)) {
				return dfrd.reject(self.ERROR_INVALID_SECTION).promise();
			}
			// ステータスを読み込み中にして処理開始
			gSectionManager.setStatusLoading(secNo);
			// 開始することを通知
			dfrd.notify();
			gSiteParser.getNovelSection (secNo).then (
				function (secData) {
					// 登録でstatusも更新される
					var secData
						= gSectionManager.registData (secNo, secData, true);
					gSiteParser.autoPagerize (secNo, secData);
					gSiteParser.updateMaxSection(secNo);
					// 新しいsecNoを登録したので自動saveするならsaveが動く
					if (gSetting.autoSave) {
						nojaSave(false);
					}
					dfrd.resolve(secNo, true);
				},
				function () {
					gSectionManager.setStatusInvalid(secNo);
					console.debug('siteParser said error');
					dfrd.reject(self.ERROR_NETWORK_FAILED);
				}
			);
			return dfrd.promise();
		},
	};


	//各話の各ページにジャンプする関数。
	//toPageに負の値を渡すと最後尾ページにジャンプ。
	// goTo経由で来た場合、lower,upperのチェックは済んでいる
	// その他の直接呼出しだとrange関連は未解決だが、
	// 範囲外でinvaliになるかどうかだけが問題で、
	// 上限・下限オーバーのような理由の区別までは不要
	//
	// できればjumpToのui機能と非ui機能を分ける?
	// 一応deferred objectを返すようにしておく
	// (showPageが終わった段階で発火)
	jumpTo = function(secNo, toPage) {
		//isChangeSection===trueなら話移動が必要
		var force = false;
		var section = secNo;
		var isChangeSection = (section != gCurrentManager.id);
		//sectionに負の値を渡すと現在の話を強制再読み込み。
		if (section == CURRENT_SECTION_ID_WITH_REDRAW) {
			section = gCurrentManager.id;
			isChangeSection = true;
		} else if (section == CURRENT_SECTION_ID_WITH_RELOAD) {
			section = gCurrentManager.id;
			isChangeSection = true;
			force = true;
		}
		//開始
		console.debug('jumpTo:', secNo, toPage, gCurrentManager.id, section, force);
		return gLoadSectionManager.load (section, force).then(
			function (loadSecNo, isLoaded) {
				console.debug('load success', loadSecNo, isLoaded);
				// 実際にロードせずにdbにあった場合は!isLoaded
				if (isLoaded) {
					// 実際にロードした場合はステータスバーに成功を通知
					statusFrame.showMessage('(｀・ω・´)成功!!');
					// ロードが終わった段階で
					// 他の操作で別ページが表示されたりしていない場合
					if (!force && !jumpTo.waiting) {
						console.debug('not force not waiting');
						// 読み込み中に別ページに移動して
						// それが正常に完了した状態なのでジャンプそのものは行わない
						return new $.Deferred().reject().promise();
					}
				}
				// forceの時はpending中に他のjumpが完了したかどうか判断できない
				// というかequalで見る必要はないのかも？
			},
			function (err) {
				console.debug('load failed', err);
				switch (err) {
				case gLoadSectionManager.ERROR_INVALID_SECTION:
					console.debug("gIndexManager: invalid section error: section", section);
					break;
				case gLoadSectionManager.ERROR_REQUESTED_SECTION:
					console.debug("gIndexManager. already requested error: section", section);
					//読み込み中ならサイレント
					break;
				case gLoadSectionManager.ERROR_NETWORK_FAILED:
					console.debug("gIndexManager. network error: section", section);
					statusFrame.showMessage ('失敗(´・ω・｀)……');
					break;
				}
			},
			function () {	// 実際のロード開始直前に呼ばれるprogress
				console.debug('load started async: jumpTo.waiting=true');
				jumpTo.waiting = true;
			}
		).then(function () {
			console.debug('and then: page calc');
			// 文章領域のページ数を計算する
			var nPages = gSectionManager.countPages(gSectionManager.getData(section)
				, gSetting);
			// 負のページ数指定はendからのページ位置に変換
			console.debug('nPages:', nPages);
			console.debug('toPage:', toPage);
			if (toPage < 0) {
				toPage += nPages;
			}
			console.debug('(mod)toPage:', toPage);
			// 先頭ページにアライメント
			toPage = gCurrentManager.getFirstPageAlinedCanvas(toPage);
			console.debug('(mod2)toPage:', toPage);

			// 次話強制ではない場合、
			// 同ページのまま or toPageの計算が範囲外なら処理終了
			if (!isChangeSection
				&& (toPage == gCurrentManager.page
					|| !(toPage >= 0 && toPage < nPages))) {
				console.debug('stay same page: current', gCurrentManager.page);
				console.debug('  toPage nPages', toPage, nPages);
				return;
			}
			console.debug('jumpTo.waiting=false');
			jumpTo.waiting = false;

			// このあたりがちょい問題
			// reMakeとの同期が取れていないはず(オリジナルから)
			//
			// これって話数移動したら最大ページ数も変化するので
			// selectorでの指定先がない場合もあるのだがいいのかな？
			// (先にnavigation updateしないと)
			// 一応Cursor処理側でなくてもエラーにはならないようにしたが、
			// カーソルが消えることがあるかも？
			// (section移動:page=0だから実際にはありえない話か？)
			gPageNavigationManager.hideCursor();
			//とりあえずhideは現在ページ設定で行う
			if (isChangeSection) {
				// 話の移動だった場合は情報更新
				// ここでページ指定がリセットされている
				// prevでsection移動したときなどこれではまずい
				gCurrentManager.setCurrent (section, gCurrentManager.page);
				gSiteParser.rebuildUiOnChangeSection (section);
				gCurrentManager.updateTotalPages(gSetting);
				gPageNavigationManager.update();
			}
			// showはナビ更新後
			gCurrentManager.page = toPage;
			gPageNavigationManager.showCursor();
			showPage();
		});
	};
	//
	var jumpToTop = function () {
		jumpTo ((gCurrentManager.id == FIRST_SECTION_NO)
			? CURRENT_SECTION_ID_WITH_REDRAW
			: FIRST_SECTION_NO
			, FIRST_PAGE_NO);
	};

	// 相対移動はこれを使ってmin,maxの範囲オーバーに対応する

	var goTo = function (direction, invertIfYokogaki) {
		var self = goTo;
		if (invertIfYokogaki === undefined) {
			invertIfYokogaki = false;
		}
		if (invertIfYokogaki && gYokogaki) {
			isNext = -isNext;
		}
		switch (direction) {
		case self.NEXT_PAGE:
			self.NextPage();
			break;
		case self.PREV_PAGE:
			self.PrevPage();
			break;
		case self.NEXT_SECTION_FIRST_PAGE:
			self.NextSectionFirstPage();
			break;
		case self.PREV_SECTION_FIRST_PAGE:
			self.PrevSectionFirstPage();
			break;
		}
	};
	goTo.NEXT_PAGE =  1;
	goTo.PREV_PAGE = -1;
	goTo.NEXT_SECTION_FIRST_PAGE =  2;
	goTo.PREV_SECTION_FIRST_PAGE = -2;
	goTo.AFFECT_YOKOGAKI = true;
	goTo.AFFECT_NONE     = false;
	// カレントの場合はそのままjumpToするだけ
	goTo.CurrentSectionFirstPage = function () {
		jumpTo (gCurrentManager.id, FIRST_PAGE_NO);
	};
	goTo.CurrentSectionLastPage = function () {
		jumpTo (gCurrentManager.id, LAST_PAGE_NO);
	};
	goTo.CurrentSectionPage = function (pageNo) {
		jumpTo (gCurrentManager.id, pageNo);
	};
	goTo.CurrentSectionPageWithRedraw = function (pageNo) {
		jumpTo (CURRENT_SECTION_ID_WITH_REDRAW, pageNo);
	};
	goTo.NextSectionFirstPage = function () {
		var location = {
			section: gCurrentManager.getNextSection(),
			page: FIRST_PAGE_NO,
			direction: +1,
		};
		location.valid = (location.section !== null);
		this.$jumpToLocation (location);
	};
	goTo.PrevSectionFirstPage = function () {
		var location = {
			section: gCurrentManager.getPrevSection(),
			page: FIRST_PAGE_NO,
			direction: -1,
		};
		location.valid = (location.section !== null);
		this.$jumpToLocation (location);
	};
	//次ページ読み込み
	goTo.NextPage = function() {
		var location = gCurrentManager.getNextLocation();
		location.direction = +1;
		this.$jumpToLocation (location);
	};
	//前ページ読み込み
	goTo.PrevPage = function() {
		var location = gCurrentManager.getPrevLocation();
		location.direction = -1;
		this.$jumpToLocation (location);
	};
	goTo.$jumpToLocation = function(location) {
		if (location.valid) {
			console.debug('location valid: ', location.section, location.page);
			console.debug('location valid: ', location);
			jumpTo (location.section, location.page);
		} else {
			if (location.direction > 0) {
				this.uiOverflowErrorHandler ();
			} else {
				this.uiUnderflowErrorHandler ();
			}
		}
	};
	goTo.uiUnderflowErrorHandler = function () {
		statusFrame.showMessage('(´・ω・｀)ここが最初の話だよ');
	};
	goTo.uiOverflowErrorHandler = function () {
		statusFrame.showMessage('川・◊・)いま投稿されているのはここまでなのじゃー。感想を書いてあげるといいのじゃー。');
		if (gSiteParser.enableReputationForm) {
			$('#noja_hyouka').show();
		}
	};

	////////////////////////////////////////////////////////
	var drawCanvasBackground = function (ctx, drawCanvasSize, fontSize, drawZoomRatio) {
		ctx.fillStyle = gThemeManager.color.bgColor;
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
		if (gThemeManager.color.bgImage) {
			var bgimage = gThemeManager.color.bgImage;
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
			var m = /rgb\(([0-9]*),\s*([0-9]*),\s*([0-9]*)\)/g.exec(gThemeManager.color.bgColor);
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
		ctx.fillStyle = gThemeManager.color.color;
		ctx.strokeStyle = gThemeManager.color.color;
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
				if (gCurrentManager.isSingleSection) {
					text += '　　　' + gSiteParser.getAuthor();
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
			// @@ TODO @@ 長いタイトル等への対策
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
					gSiteParser.getTitle()
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
	// 画像のonLoad等のハンドラとしてもbindされてredrawを行う
	showPage = function() {
		console.debug('showPage', gCurrentManager.page);
		drawPage(gMainContext, gCharFontSize, gMainSize, gCurrentManager.page);
		gPageNavigationManager.drawPage(gCurrentManager.page);
	};

	///////////////////////////////////////////
	// 目次読み込み
	// silentモード対応にして
	// Hameln等のmaxSectioNo関連はこっちを使うようにしたいところ
	//
	$.templates('loadIndexTmpl'
		, '目次の読み込み中...<br /><img src="{{:image}}" />');

	loadIndex = function (force) {
		if (force === undefined) {
			force = false;
		}
		// リロード強制ではなくindexが出来ているならそれを使う
		if (!force && gIndexManager.isIndexPageReady()) {
			return;
		}
		// ロードすべき状況で、既に動いているならそちらに任せる
		if (gIndexManager.isIndexPageNowLoading()) {
			return;
		}
		indexFrame.setLoadMessage($.render.loadIndexTmpl({image: ICON_LOADING2}));
		gIndexManager.load().then(
			function (totalSections) {
				// 特に何もすることはない
			},
			function (error_code) {
				indexFrame.setLoadMessage('目次の読み込みに失敗しました');
			}
		);
	};
	////////////////////////////////////////////////////////







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
		//console.debug('zoomRatio:', zoomRatio);
		lc.nchars = Math.floor (std_lc.nchars * (zoomRatio / 2.0));
		if (gEnableFlexibleAspect) {
			var aspect = (gMainSize.width / gMainSize.height);
			//console.debug ("gMainSize, aspect:", gMainSize, aspect);
			// ルビなしのカラムサイズで比率計算して、
			// その後ルビ付の行数に補正する
			//console.debug ("lc.nchars:", lc.nchars);
			if (true) {
				if (gYokogaki) {
					var dpc = (gMainSize.width / gCurrentManager.pagesPerCanvas)
						/ (lc.nchars + gMarginLinesYokogaki);
					//console.debug ("dpc:", dpc);
					// マージン設定は上下方向のマージンなので仮に使っている
					var nlines = 
						(gMainSize.height + gMarginLinesTategaki) / dpc;
					//console.debug ("nlines:", nlines);
					lc.nlines = Math.floor (nlines / gLineRatio);
				} else {
					// 余白計算
					// ノーマル(4+2) + (2+4)が見開きでの確保量
					// 縦の確保量でdpiが出る
					var dpc = gMainSize.height / (lc.nchars + gMarginLinesTategaki);
					//console.debug ("dpc:", dpc);
					// ここで、page_width = (2+4)*dpi + nlines*dpi*1.7
					// nlines = (page_width - (margin)*dpi)/(1.7*dpi)
					var page_width = (gMainSize.width / gCurrentManager.pagesPerCanvas);
					var nlines = (page_width - gMarginLinesYokogaki * dpc)
						/ (dpc * gLineRatio);
					//console.debug ("nlines:", nlines);
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
		//console.debug ("lc:", lc);
		if (withUpdate) {
			var isChanged = !(gCharsPerLine == lc.nchars && gLinesPerCanvas == lc.nlines);
			gCharsPerLine = lc.nchars;
			gLinesPerCanvas = lc.nlines;
			//console.debug ("change global lc:", lc);
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
		//console.debug ("gMainSize", gMainSize);
		//console.debug ("gMainSize.width, .height", gMainSize.width, gMainSize.height);
		//console.debug ("#noja main width, .height"
		//, $('#noja_main').width(), $('#noja_main').height());
		gMainSize.width = $('#noja_main').width();
		gMainSize.height = $('#noja_main').height();
		//console.debug ("gMainSize", gMainSize);
		//console.debug ("gMainSize.width, .height", gMainSize.width, gMainSize.height);

		//console.debug ("#noja main width, .height"
		//, $('#noja_main').width(), $('#noja_main').height());
		//console.debug ("gMainSize", gMainSize);
		//console.debug ("gMainSize.width, .height", gMainSize.width, gMainSize.height);

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
			//console.debug('aspect', aspect);
		}
		if ((gMainSize.width / gMainSize.height) > aspect) {
			// ルート長方形より横長:縦そのままで横補正
			var modified_width = Math.floor(gMainSize.height * aspect);
			gMainSize.width = modified_width;
			//console.debug('mod width', modified_width);
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
			//console.debug ("gMainSize", gMainSize);
			//console.debug ("gMainSize.width", gMainSize.width);
			var modified_height = Math.floor(gMainSize.width / aspect);
			//console.debug('mod height calc', gMainSize.width / aspect);
			var top_margin = (gMainSize.height - modified_height) / 2;
			gMainSize.height = modified_height;
			//console.debug('mod height', modified_height);
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
		//console.debug ("gMainSize", gMainSize);
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
		//console.debug('needRemake', needRemake);
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
			//console.debug("remake pages calling");
			// gSectionManager.reMake()は後処理の段取りが別途必要なので要改善
			gSectionManager.reMake();
			// page数も変わるのでリセットされてしょうがない
			gCurrentManager.setCurrent (gCurrentManager.id);
			gCurrentManager.updateTotalPages(gSetting);
			gPageNavigationManager.update();
			goTo.CurrentSectionPageWithRedraw (FIRST_PAGE_NO);
		}
		showPage ();
	};
	/////////////////////

	nojaOpen = function() {
		gSiteParser.onOpenNoja();
		//
		rootFrame.showNow();
		//
		//console.debug('nojaOpen: before onResize');
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
		gSiteParser.onCloseNoja();
		//
		gIsNojaOpen = false;
	};
	///////////////////////////////////////////////////////////////
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

	///////////////////////////////////////////////////////////////
	/////// siteParserはnewしなおさないと意味がない
	var reCreateSiteParser = function (imported_infos) {
		gSiteParser.restoreSiteInfoForImport (imported_infos);
		// 管轄替え
		gThemeManager.setColorTheme({
			color:   imported_infos.color,
			bgColor: imported_infos.bgColor,
			bgImage: imported_infos.bgImage,
		});
	};
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

	///////////////////////////////////////////////////////////////
	// import/save/load(restore)関連

	// importはdownload保存したhtml形式の読み込み
	// indexはない
	// コメント部分にヘッダ情報jsonがあり
	// データ本体はdownload形式で作ったDOMが入っている
	//
	// ・importファイル選択したものを読み込み
	// ・appModeで内蔵リソースから読み込んだもの
	// 読み込み方法が異なるので、読み込んだhtml文字列が引数となる
	//
	// ・AppModeファイル読み込みのメニュー経由の場合
	//   複数ファイル選択が可能で、その場合追記取り込みになる
	//   初回は必要であればnovelId切り替わり処理
	//   次回以降は同novelIdでの追記取り込み

	// 例外のときの処理はこれだったが不要か？
	// statusFrame.showMessage('(´・ω・｀)読み込みエラーが発生したよ。');
	// dfrd.reject();

	// 元々アプリモード前提だったのと複数site想定してなかったので
	// site切り替えに工夫がいる
	// ヘッダを読まないとサイトは決まらない
	// 複数読み込みの場合、先に全部のヘッダチェックするとなると二度読み
	// それを避けるとなると、
	//  * 追記初回のnovelId切り替わり
	//  * 追記途中での異novelId検出(error)
	// を区別しないといけない

	// restoreと共通部分多いはず
	gHtmlPortManager = {
		// import可能な形式のdownloadFileを作るdumper部分
		// どうせ読み込み側もJSONなので出力もJSONに任せるのが筋
		// @@ TODO @@ template化
		// site固有情報とgenericな情報をどう分けるか？
		$createDownloadHeader: function () {
			return JSON.stringify({
				version: NOJA_VERSION,
				site: [gSiteParser.getSite(), gSiteParser.getSite2()],
				ncode: [gSiteParser.getNovelId(), gSiteParser.getNovelId2()],
				general_all_no: gIndexManager.GeneralAllNo,
				// @@ 互換性のためtypoをそのまま残すか？
				auther: gSiteParser.getAuthor(),
				tanpen: gCurrentManager.isSingleSection,
			});
		},
		// @@ 互換性のためtypoをそのまま残すか？(auther)
		// isIndexPageReadyの評価部分が少しview側に依存した感じ
		$createImportedInfoFromJSON: function (json) {
			var infos = {};
			infos.site   = json.site[0];
			infos.site2  = json.site[1];
			//
			infos.ncode  = json.ncode[0];
			infos.ncode2 = json.ncode[1];
			//
			infos.author = json.auther;
			infos.generalAllNo = json.general_all_no;
			infos.isIndexPageReady = json.tanpen;	// 名称変換
			return infos;
		},
		$parseImportedHtmlNojaHeader: function (htmldoc) {
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
				? this.$createImportedInfoFromJSON (json) : false;
		},

		nojaImport: function (htmldoc) {
			console.debug('gHtmlPortManager.nojaImport with:', htmldoc);
			var dfrd = new $.Deferred();
			//
			// これは他がload中だからimportするなということ
			if (uiIsNetworkBusy ('読み込みするのは後にするのじゃー。')) {
				return;
			}
			var imported_infos = this.$parseImportedHtmlNojaHeader(htmldoc);
			if (!imported_infos) {
				statusFrame.showMessage('(´・ω・｀)このhtmlはのじゃー用ファイルじゃないよ');
				dfrd.reject();
				return dfrd.promise();
			}

			var imported_sections = [];
			var _kaigyou = gSetting.kaigyou;	// これは使ってない？


			// comment部のheader以外のhtmlとして取り出すcontent
			var content = $($.parseHTML(htmldoc));
			var downloadFileMain = $('#noja_download_file_main', content);
			// タイトルはヘッダのタイトルから取る
			imported_infos.title = content.filter('title').text();
			// カラーは'#noja_download_file_main'のstyle
			gThemeManager.setColorTheme(imported_infos, downloadFileMain);
		/// 新規かどうかでSection Managerにclear指示がいる

			// imported_sectionsにデータ形式で全セクション構築
			// こいつは非同期ではなくたんなるnotify callback
			var min_max_sec_no = gDownloadFileManager.toDataAll (
				imported_sections, downloadFileMain
				, function (secId, secData) {
					return true;
			});


			// 実際の登録開始:データ以外の周辺部の設定

			imported_infos.currentSection = min_max_sec_no.min;

			// このあたり少し同じようなコードがいくつかある
			gCustomSettingManager.load (imported_infos.ncode)
			.then(
				function (data) {
					// novelIdに対応する設定をloadした後の処理
					gSetting = data;
				},
				function() {
					// 設定がなかったらデフォルトで作って新規保存
					gSetting = createNewSetting (imported_infos.ncode);
					gCustomSettingManager.save (gSetting);
					return new $.Deferred().resolve().promise();
				}
			)
			.then(function() {
				// currentの設定を更新
				validateSetting();
			}).then(function() {
				if (imported_infos.ncode !== gSiteParser.getNovelId()) {
					// importしたものが別のコンテンツなら
					// ただし、imported_sectionsのデータ部をdbに所有権移行
					gSectionManager.replaceDataBase (imported_sections);
					// 張り付きページ部分の入れ替え
					// 多分ごっそり入れ替えるのでカラーも変わる
					gDownloadFileManager.replaceAll (downloadFileMain);
					// IndexManagerが管理する情報の更新
					gIndexManager.forceSetGeneralAllNo (imported_infos.generalAllNo);
					// CurrentManagerが管理する情報の更新
					gCurrentManager.id = imported_infos.currentSection;
					gCurrentManager.page = 0;
				} else {
					// 同一novelIdなら部分的な更新
					// 複数ファイルの追加取り込みのケースでは同一novelIdがありうる
					gDownloadFileManager.margeSections (imported_sections
						, function (secId, secData) {
						gSectionManager.registData (secId, secData);
					});
					// 入れ替えのときは設定はしなくてよくてマージだけ？
					// 入れ替えのときは大元のタグからごっそり入れ替えているので
					// それで切り替わる
					gDownloadFileManager.setColorTheme (imported_infos);
					// import側でmax有効でgIndexManager側でも同様に有効なら
					// max比較してupdate
					// とりあえず常にgIndexManager側では有効だとしてしまう
					if (imported_infos.generalAllNo) {
						// これはupdate max
						gIndexManager.GeneralAllNo = imported_infos.generalAllNo;
					}
				}
				reCreateSiteParser (imported_infos);

				// ヘッダのtanpenから変換したstatus情報で更新(disable or not readyになる)
				// 元々はjson形式ヘッダ部分のtanpen設定 (bool)
				if (imported_infos.isIndexPageReady) {
					gIndexManager.setIndexPageDisabled();
				} else {
					gIndexManager.setIndexPageNotReady();
				}

				$('title').text(gSiteParser.getTitle());
				// SectionManager側は登録済なのでCurrentManagerに変更指示するだけでいいはず
				// ページ位置もリセットされるだろうが問題ないはず
				gCurrentManager.setCurrent (gCurrentManager.id);
				// 作品が切り替わった時は上でforceSetしている
				// その値自体がunavailの可能性はあるのか。
				gIndexManager.GeneralAllNo = imported_infos.generalAllNo;
				// ui関連の設定
				gSiteParser.rebuildFormsOnImportRestore ();
				updateSettingMenuCheckbox();
				// 大元のほうに色設定
				// 画面側('#noja'はapp/index.html
				$('#noja').css(gThemeManager.toCssColorTheme());
				// 大元の子孫になるfile側はリセット
				gDownloadFileManager.resetColorTheme ();
				dfrd.resolve ();
			});
			return dfrd.promise();
		},

		// sectionがidタイプだと範囲指定が難しい
		// もう少しbreak-downしてcontainerで渡されたものをdumpする？
		renderDownloadData: $.templates('#noja_download_data_template'),
		createDownloadData: function (minSec, maxSec) {
			var idPrefix = 'noja_download_';
			// ここの部分はjsRenderのforとincludeで賄える話なのかもしれず
			// html取り込み時に正しく改行除去してあれば
			// あとはifとforで済む話
			var secDataHtml = '';
			gSectionManager.rangedEach (minSec, maxSec, function (secId, secData) {
				secDataHtml += gSectionManager.toDivHtml (secId, secData, idPrefix);
			});
			// 実際のrendering
			var buffer = this.renderDownloadData({
				downloadId: DOWNLOAD_ID,
				id: idPrefix + 'file_main',
				info: gHtmlPortManager.$createDownloadHeader(),
				title: gSiteParser.getTitle(),	// html converter
				style: gThemeManager.toTextColorTheme(),
				contents: secDataHtml,
			});
			// 単独で閉じるタグの形式を整形式にしておく
			return new Blob(
				[buffer.replace(/(<br|<img[^>]*)>/g, '$1 />')]
				, {type:'application/octet-stream'}
			);
		},
	};

	////////////////////////////////////////////////////////////////
	//
	// save/load(restore):内部形式でのデータの保存・復元
	// indexも保存されている
	//  listからの選択でloadするときだけはnovelIdが異なるloadになる
	//  saveについては常に現在作品となるはず
	//
	// 新形式:ヘッダ部分、データ部分に形式を表す新設propsを作る
	// それがなければ旧形式として変換読み込み

	// bookListの作品単位のデータ部分

	var buildSaveDataSiteInfo = function () {
		return $.extend(gSiteParser.getSiteInfoForSaveData(), {
			generalAllNo: gIndexManager.GeneralAllNo,
			sections: [],
		});
	};

	var save_saveData = function () {
		var dfrd = new $.Deferred ();
		// siteInfo等を設定(デフォ)
		var data = buildSaveDataSiteInfo();
		gSaveDataManager.load (gSiteParser.getNovelId()).then(
			// ロードしたもの優先
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
				gSaveDataManager.save (data);
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
	// BookListのindex: map(key=ncode, value=BookListItem)
	//
	// index部分のI/O
	// デフォルト指定があった時は成功扱い
	var loadGlobalBookList = function (default_data) {
		var dfrd = new $.Deferred ();
		gGlobalSettingManager.load ('bookList').then(
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

	// index部分のI/O
	// 省略でグローバルなカレント値
	// saveのI/Fがステータスを返さないので常に成功扱い
	var saveGlobalBookList = function (data, register_id, register_data) {
		if (register_id === undefined) {
			register_id = gSiteParser.getNovelId();
		}
		if (register_data === undefined) {
			// @@ 互換性のためautherのtypoをそのまま残すか？
			register_data = {
				title: gSiteParser.getTitle(),
				auther: gSiteParser.getAuthor(),
				savetime: parseInt((new Date()) / 1000),
			};
		}
		var dfrd = new $.Deferred ();
		data[register_id] = register_data;
		gGlobalSettingManager.save ('bookList', data);
		dfrd.resolve ();
		return dfrd.promise ();
	};

	// index部分のI/O
	var deleteGlobalBookList = function (data_id) {
		var dfrd = new $.Deferred ();
		loadGlobalBookList().then(
			function (data) {
				delete data[data_id];
				gGlobalSettingManager.save ('bookList', data).then (
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

	// index部分のI/O
	// BookListのデータベースをRmWで更新
	// というか、読めた場合はそのまま書き戻し
	// 読めなければ新規にデフォルト値でエントリ生成してるだけ？
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
		if (isShowMessage && uiIsNetworkBusy ('せーぶするのは後にするのじゃー。')) {
			return;
		}
		$.when(save_saveData, saveUpdatedBookList).then(
			function() {
				if (isShowMessage) {
					statusFrame.showMessage('(｀・ω・´)保存したよ！');
				}
			}
			// どちらかfailになることは考えない？
		);
	};


	///////////////////////////////////////////////////////////////////
	/////////////////////
	// novelIdが切り替わった場合
	// novelIdに対応するカスタム設定を読み込む
	// なければデフォルトで新設
	// resolveで設定を戻す(rejectはない)
	var loadCustomSetting = function (novelId) {
		var dfrd = new $.Deferred();
		if (novelId != gSiteParser.getNovelId()) {
			var new_setting;
			gSectionManager.clear();
			gCustomSettingManager.load (novelId).then(
				function(setting) {
					new_setting = setting;
				},
				function () {
					new_setting = createNewSetting (novelId);
					return new $.Deferred().resolve().promise();
				}
			).always ( function () {
				// 最終的にはnew_settingを検査してresolveで返す
				validateSetting(new_setting);
				dfrd.resolve (new_setting);
			});
		} else {
			dfrd.resolve (gSetting);
		}
		return dfrd.promise();
	};

	// settingの所有権がgSettingに移動することに注意
	// 
	var applySetting = function (setting) {
		gSetting = setting;
		updateSettingMenuCheckbox ();
	};


	// importとかなり同一のはず
	// 実行順序を再考
	// novelIdが変更されたかどうかで挙動が変わる
	// 既存の場合はsection,index(必要があれば),maxの追加・更新のみ
	// 切り替わりならまずSiteParserの切り替えを行うべき
	// gCurrentManagerが保持するid等も変更しないといけない
	// (restore後にjumpしたりreloadする際にjumpToが判断するため
	//
	// indexの戻しはsave/load機能固有の話か？
	//
	// 戻すのは最初に有効なセクション(novelId切り替わった時)
	// 切り替わりなしならnullを返すだけ
	//
	// 新形式:ヘッダ部分、データ部分に形式を表す新設propsを作る
	// それがなければ旧形式として変換読み込み
	var restoreBookData = function (novelId, restoreData) {
		// download_file等のrestore
		if (gSiteParser.getNovelId() != novelId) {
			$('#noja_download_file_main').empty();
		}
		gSectionManager.restore (restoreData.sections, function (secId, secData) {
			// 1section登録する毎に呼ばれる
			// thisに依存する場合まずいかも？
			gSiteParser.autoPagerize (secId, secData);
			return true;
		} /* , WITHOUT_OVERWRITE */);
		// SectionManagerへの登録が終わった後
		//
		// SectionManagerがdumpするsaveData形式は
		// header + sections[]でheader内にtanpen等がある
		gCurrentManager.setSingleSection (restoreData.tanpen);
		if (!gCurrentManager.isSingleSection && restoreData.index
			&& (!gIndexManager.isIndexPageReady() || gSiteParser.getNovelId() != novelId)) {
			// 連載, データにindexがあり、かつ
			//    ・novelIdが切り替わった
			// or ・現在indexがreadyではない状態
			// なら、restoreDataのindexを取り込む
			gIndexManager.setIndexPageReady();
			// indexのdivの下に置くもの丸ごとが入っている
			var indexDiv = indexFrame.$div ();
			indexDiv.html(restoreData.index);
			// event handlerはdumpされないのでそれは自前で戻す
			// @@ この部分は統合する
			// 今はなろう系のselectorに依存しているので
			// 統一してgIndexManagerか何かがbindするように変更
			var no = 0;
			$('.index_box a', indexDiv).each(function() {
				$(this).on('click', 
					autoHideClickJumpHandlerFactory (indexFrame
						, ++no, FIRST_PAGE_NO)
				);
			});
		}
		/////// siteParserはnewしなおさないと意味がない
		// このあたりからが共通っぽい部分
		if (novelId != gSiteParser.getNovelId()) {
			// novelIdが変更されない場合にnovelId2,site,site2を上書きする必要はないはず
			// 少なくともrestore側の情報のほうが新しいはずはないので。
			// このあたりの処理では、各managerがgSiteParserに依存する
			// 部分があった場合、変更順序に依存性が生じている可能性がある
			gSiteParser.restoreSiteInfo (restoreData);
			// indexがあった場合は上で更新している
			if (!restoreData.index) {
				gIndexManager.setIndexPageDisabled ();
				indexFrame.clearDivContents ();
			}
			gSiteParser.setTitle(restoreData.title);
			$('title').text(gSiteParser.title);
			gSiteParser.rebuildFormsOnImportRestore ();
			// @@ TODO @@
			// gSiteParserがカウントを持つのはやめよう
			// カウント自体意味がない
			if (restoreData.generalAllNo) {
				// restoreするsaveDataにgeneralAllNoがあればその値を使う
				// update max
				gIndexManager.generalAllNo = restoreData.generalAllNo;
			} else {
				// なければIndex側未定義にしてgSiteParserはmax更新扱い
				gSiteParser.updateMaxSection(gSectionManager.length(), true);
			}
			gSiteParser.setNovelId(restoreData.ncode);
			var first_avail_section = gSectionManager.minId();

			// noja画面側の設定とgSiteParser側の再設定の両方が含まれる
			gThemeManager.setColorTheme({
				color:   restoreData.color,
				bgColor: restoreData.bgColor,
				bgImage: restoreData.bgImage,	// url
			});
			// 画面側('#noja'はapp/index.html
			gThemeManager.applyColorTheme($('#noja'));
			gSiteParser.setAuthor (restoreData.auther);
			return first_avail_section;
		} else {
			// novelIdが変わらなかった場合
			// Sectionの登録、連載でindexを取り込む必要があれば取り込み
			// が済んでいるので、maxの更新のみ
			// 実際にはmax update
			gIndexManager.GeneralAllNo = restoreData.generalAllNo;
			return null;	// novelIdが変更されなかったことを意味する
		}
	};

	// トップレベルのコマンド
	// bookListからのload以外はカレント作品へのload
	// 自動ロードの時だけメッセージ非表示
	nojaRestore = function (novelId, isShowMessage) {
		var dfrd = new $.Deferred();
		isShowMessage = (isShowMessage === undefined) ? true : isShowMessage;
		if (isShowMessage && uiIsNetworkBusy ('ろーどするのは後にするのじゃー。')) {
			return dfrd.reject(true).promise ();	// pendingによるreject
		}
		// novelIdが切り替わるかどうかにかかわらず
		// 設定はロードし適用する
		loadCustomSetting (novelId)
		.then(function (setting) {
			applySetting (setting);
			// データ本体の読み込み
			return gSaveDataManager.load (novelId);
		}).then(
			// savedataのロードが終わった段階
			// saveDataはjson形式でdumpされたものをundump
			function (restoreData) {
				var first_avail_section = restoreBookData (novelId, restoreData);
				// novelIdが切り替わった場合は作品先頭に移動
				// 同作品のrestoreならページ表示するだけ
				if (first_avail_section !== null) {
					var sec_no = (first_avail_section === gCurrentManager.id)
						? CURRENT_SECTION_ID_WITH_REDRAW
						: first_avail_section
						;
					jumpTo (sec_no, FIRST_PAGE_NO);
				} else {
					// novelIdが変わらなかった場合
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
	// save/loadの一覧から削除を選んだ時のtop-levelの処理コマンド
	nojaDelete = function (novelId) {
		gSaveDataManager.delete (novelId);
		deleteGlobalBookList (novelId);
	};


	//////////////////////////////////////////////////////////////////

	// save/loadのload機能用のui
	//
	// リスト画面を作る
	// コンテナは読み込んだbookListのindexデータ
	//   key:novelId => value:(title,auther,savetime)
	// @@ TODO @@ 互換性のためtypoをそのまま残すか？
	var createBookList = function (bookListContainer) {
		// 時間ソート表示のために配列に詰め替え
		// 
		var items = [];
		$.each(bookListContainer, function (key, value) {
			// 新形式にするなら、value.format_typeか何かに形式名を入れて
			// それの有無で切り替える
			items.push({
				id: key,
				title: value.title,
				author: value.auther,
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
		return items;
	};

	// テンプレ側で
	// id名にidをprefix+idで埋め込んでいるが、
	// novelIdはnovelIdで独立属性としたほうが好ましいか？

	// メインのsave/loadメニューdialogから呼び出される独立dialog
	// 中身の生成(+handler登録)とshow()まで行う
	//
	// booklist = [booklistItem,...]
	// 配列のindexはnovel_id
	var buildAndShowBookList = function () {
		var items = [];
		gGlobalSettingManager.load ('bookList').then(
			function (data) {
				items = createBookList (data);
			},
			function () {
				list = '';
			}
		).then(
			function () {
				var bookListRestoreHandler = function() {
					var novelId = $(this).attr('noja_novel_id');
					nojaRestore(novelId);
					popupMenu.close();
				};
				var bookListDeleteHandler = function() {
					var novelId = $(this).attr('noja_novel_id');
					nojaDelete(novelId);
					$('#noja_book_container_' + novelId).remove();
					console.log($('#noja_book_container_' + novelId));
				};
				var blv = $('#noja_booklist_view');
				blv.html($('#nojaBookListView').render({contents: items}));
				// noja_novel_id="{{attr:id}}で埋め込んである
				// タイトル選択した場合のハンドラを登録
				// タイトル削除のハンドラを登録
				blv.find('a.noja_book').on('click', bookListRestoreHandler);
				blv.find('a.noja_book_delete').on('click', bookListDeleteHandler);
				$('#noja_closebv').on('click', function() {
					blv.hide();
				});
				$('#noja_saveload').hide();
				blv.show();
			}
		);
	};


	//////////////////////////////////////////////////////////////////
	// 内蔵リソースhtmlの読み込みは整形式なので直接importを呼ぶが
	// ユーザー操作によるimportの場合はread fileしたものを渡す
	//////////////////////////////////////////////////////////////////

	// エラーの時は？
	// 引数はFile object
	var readFile = function (file) {
		console.debug('start readFile', file);
		var dfrd = new $.Deferred();
		var reader = new FileReader();
		reader.onerror = function(evt) {
			console.debug('read error with', evt);
			dfrd.reject ('fileReadError');
		};
		reader.onload = function(evt) {
			console.debug('read done with', evt.target.result);
			dfrd.resolve (evt.target.result);
		};
		reader.readAsText(file);
		return dfrd.promise();
	};

	// メニューからのimportは複数ファイルを連続的に読める仕様
	// ただし、ファイル読み込み自体アプリモード前提になるので
	// それに依存した部分がある
	//  htmlを張り付けて保存しておくtagがアプリモードのindex.html内tag想定
	// 
	// errorHandler->falseを返した場合は終了
	// fileListはFileList object
	var importFiles = function(fileList) {
		console.debug('importFiles with:', fileList);
		var self = this;
		var end = fileList.length;
		var dfrd = new $.Deferred();
		// dfrd.state()でcanceled判定してもいいのかも？
		var canceled = false;
		var errorHandler = function (reason) {
			console.debug('error handler: abort', reason);
			if (!canceled) {
				// notify先がいない場合はcancelがデフォルト動作
				var errctx = {reason: reason, cancel: true};
				dfrd.notify(errctx);
				canceled = errctx.cancel;
			}
			return canceled;
		};
		console.debug('start loop');
		(function loop (no) {
			if (dfrd.state() == 'pending') {
				if (no >= end) {
					console.debug('all done');
					dfrd.resolve ();
				} else {
					var fileSpec = fileList[no];
					console.debug('loop fileSpec', fileSpec);
					if (fileSpec.type != 'text/html' && !errorHandler('fileTypeError')) {
						dfrd.reject();
					} else {
						readFile(fileSpec)
						// 読めたらgHtmlPortManager.nojaImportを呼ぶ
						// 読めなければnofity経由でcancel問い合わせ
						.then(gHtmlPortManager.nojaImport, function(err) {
							// read fail
							console.debug('readFile error occured', err);
							if (errorHandler('readError')) {
								dfrd.reject();
							} else {
								// resume then
								return new $.Deferred.resolve().promise();
							}
						}).then(null, function () {
							// import fail or cancel
							// format mismatchでエラーが出ることはあるが無視
							if (!errorHandler('readError')) {
								dfrd.reject();
							} else {
								// resume then
								return new $.Deferred.resolve().promise();
							}
						}).then(loop.bind(self, no + 1));
					}
				}
			}
		})(0);
		return dfrd.promise();
	};


	// appModeのfile load関連のhandler
	// input-fileのtagからfilesを取り出してimportを呼び出してhtmlを取り込む
	// 後処理としてはimport後に移動する先の決定
	// たまたまnovelIdが不変だったなら現在ページを表示
	// novelId自体が切り替わったらその作品全体の先頭ページへ
	var app_fileLoadHandler = function() {
		gNetworkManager.waitForReady(/* retry, duration */)
		.progress(function(retry) {
			// retry 1回毎に通知が来る
		}).then(function() {
			var files = $('#noja_file').prop('files');
			console.debug("files", files);
			if (!files.length) {
				console.debug("no selection");
				return;
			}
			var old_novelId = gSiteParser.getNovelId();
			statusFrame.showLoading ();
			importFiles(files).then(
				function () {
					statusFrame.showMessage ('(｀・ω・´)読み込み終了！');
					// book自体が変更されていないならshowでOk?
					if (gSiteParser.getNovelId() === old_novelId) {
						showPage();
					} else {
						// 読み込んだ中で最も小さいsection_noを使う
						var sec_no = gSectionManager.minId();
						// たまたま同一sectionにいたのなら強制リロード
						if (sec_no == gCurrentManager.id) {
							sec_no = CURRENT_SECTION_ID_WITH_REDRAW;
						}
						jumpTo (sec_no, FIRST_PAGE_NO);
					}
				},
				null,	// エラーで終わったときは特に通知なし
				function(errctx) {
					// progress: エラー発生時の問い合わせ
					// ファイル毎にstatus表示する等普通のprogress用途も入れるべきか？
					if (errctx.reason == 'read') {
						statusFrame.showMessage('(´・ω・｀)読み込みに失敗したよ');
					} else if (errctx.reason == 'import') {
						statusFrame.showMessage('(´・ω・｀)ファイルタイプが違うよ');
					}
					errctx.cancel = false;	// エラーが出ても継続
				}
			);
		}, function () {
			// retry timeout
		});
	};

	//////////////////////////////////////////////////////////////////

	// novelIdをキーとして個別設定を取り出し設定
	var uiLoadCustomSetting = function (novelId) {
		return gCustomSettingManager.load (novelId).then(
			function (setting) {
				// novelIdをキーとして読み出した設定をストア
				gSetting = setting;
			},
			function () {
				// 個別設定がないならデフォルトを作って設定
				// 引数のobject自体が使われる
				setSetting (createNewSetting(gSiteParser.getNovelId()));
				// resolveに状態を変えて継続
				return new $.Deferred().resolve().promise();
			}
		).then(
			// 失敗はない
			function () {
				// menu側のcheckに状態を反映させる
				$('#noja_maegaki').prop('checked', gSetting.fMaegaki);
				$('#noja_atogaki').prop('checked', gSetting.fAtogaki);
				$('#noja_kaigyou').prop('checked', gSetting.kaigyou);
			}
		);
	};

	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////
	initialize = function() {
		// 有効なサイトであることは保証されているものの
		// 有効なページかどうかは不明で、
		// なんであってもある程度nojaの初期化が行われている
		gSiteParser = createSiteParser(document.URL);
		if (gSiteParser === null) {
			return;
		}

		////////////////////////////////////////////
		////////////////////////////////////////////
		// initializeのstage1
		// グローバル設定の読み込み完了後にここにくる
		var initialize_stage1 = function() {
			console.debug('initialize stage 1');
			// 少しだけuiがらみの設定をする
			// ページ末尾にのじゃー作業用の領域を確保
			$('body').append(ResourceManager.load (NOJA_VIEW_HTML));
			// 「のじゃー」ラベルを元ページに貼り付けたり
			gSiteParser.initialize();
			// のじゃー作業用領域のフォントサイズ指定？
			rootFrame.$().css('font-size', FONTSMALL);

			// これがないと計算ができないので位置を移動
			// initialpageの解析→登録→splitterでサイズがいる
			updateMainSize ();
			console.debug ("gMainSize", gMainSize);
			console.debug ("gMainSize.width, .height", gMainSize.width, gMainSize.height);
			console.debug ("#noja main width, .height"
			, $('#noja_main').width(), $('#noja_main').height());

			// 計算して出す変数の設定処理
			updateLC(slidePos2ZoomRatio (gSlidePos), true);
			console.debug ("gCharsPerLine, gLinesPerCanvas"
				, gCharsPerLine, gLinesPerCanvas);

			// 基本情報を設定して次ステージへ
			var dfrd = new $.Deferred();
			// ctor段階でnovelIdが取れていなかった場合はfalse
			// appModeの場合もfalse
			if (gSiteParser.isInitializeByCustomSetting) {
				dfrd = uiLoadCustomSetting (gSiteParser.getNovelId());
			} else {
				dfrd.resolve();
			}
			// カスタム設定が終わったら初期ページ解析
			dfrd.then (
				// 元ページ解析
				function () {
					// こうしておかないとthisが正しくない
					// dfrdのresolveが別にresolveWith()を強制していない
					return gSiteParser.parseInitialPage();
				}
			).then (
				// 成功のときは次ステージへ
				initialize_stage2,
				function () {
					// 解析失敗した場合はindex page等のじゃーが表示できない画面
					console.debug ('not supported page');
					// 失敗のときは次ステージに行かずに終了
				}
			);
		};

		///////////////////////////////////////////////
		///////////////////////////////////////////////
		// メニュー関連の設定やイベントハンドラ等UIがらみの設定が中心
		// 設定したりないメニュー関連等を設定する
		var initialize_stage2 = function() {
			console.debug ('initialize stage2');
			console.debug ("gMainSize", gMainSize);
			console.debug ("gMainSize.width, .height", gMainSize.width, gMainSize.height);
			console.debug ("#noja main width, .height"
			, $('#noja_main').width(), $('#noja_main').height());


			validateSetting ();
			updateSettingMenuCheckbox (false);

			$('#noja_always_open').prop('checked', gAlwaysOpen);
			$('#noja_layout').prop('checked', gLayout);
			$('#noja_mincho').prop('checked', gFontType === FONTTYPE_MINCHO);
			$('#noja_yokogaki').prop('checked', gYokogaki);
			$('#noja_gothic').prop('checked', gFontType === FONTTYPE_GOTHIC);
			$('#noja_allpage').prop('checked', gAllpage);

			$('#noja_drag').css('left', gSlidePos - 5);


			////////// version menu /////////
			$('#noja_version h4').text('のじゃー縦書リーダー ver.' + NOJA_VERSION);
			////////// open closeのメニュー //////
			$('#noja_open').on('click', nojaOpen);
			$('#noja_close').on('click', nojaClose);

			///////// コンテンツメイン画面のイベントハンドラ ////////////
			$('#noja_main').on('mousemove', function(e) {
				if (e.clientY < 10) {
					// menu popup
					menuFrame.show();
				} else if (!gCurrentManager.isSingleSection && e.clientX < 10) {
					// 目次slide slider
					if (!gIndexManager.isIndexPageDisable()) {
						if (!gIndexManager.isIndexPageReady()) {
							// loadingかもしれないがそれはloadIndexが判断する
							loadIndex();
						}
						indexFrame.show ();
					}
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
			.on('click', function(e) {
				// popupがopenしていたら最初のはclose操作
				if (popupMenu.isOpen ()) {
					popupMenu.close();
					return;
				}
				var isLeftPage = (e.clientX < $('#noja_main').width() / 2);
				// 横書きの影響を受ける
				goTo ((isLeftPage) ? goTo.NEXT_PAGE : goTo.PREV_PAGE
				, goTo.AFFECT_YOKOGAKI);
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
						&& gIndexManager.isLastSection (gCurrentManager.id)
						&& gCUrrentManager.isLastPage ()
						) {
						return;
					}
					popupMenu.close();
					return;
				}
				// 横書きの影響を受けない
				goTo ((isForward) ? goTo.NEXT_PAGE : goTo.PREV_PAGE
					, goTo.AFFECT_NONE);
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
						// 前書き後書き表示を変更したのでredraw
						goTo.CurrentSectionPageWithRedraw (FIRST_PAGE_NO);
						gCustomSettingManager.save (gSetting);
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
								goTo.CurrentSectionPageWithRedraw (
									gCurrentManager.page + pageMap.maegaki.size);
							} else {
								// enable->disableなのでページ位置が前書き分減る
								// 前書き内にいた場合は0とのmaxで0になり先頭へ
								goTo.CurrentSectionPageWithRedraw (
									Math.max(FIRST_PAGE_NO
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
							goTo.CurrentSectionPageWithRedraw (pageNo);
						}
					},
				};
			})();

			$(window).on('resize', onResize);

			$(window).on('keydown', function(e) {
				var VK_R = 82;
				var VK_S = 83;
				if (gIsNojaOpen && e.ctrlKey && e.which===VK_S) {
					nojaSave();
					e.preventDefault();
					return;
				}
				if (gIsNojaOpen && e.ctrlKey && e.which===VK_R) {
					nojaRestore(gSiteParser.getNovelId());
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
					// 横書き対応の移動
					goTo (goTo.NEXT_PAGE, goTo.AFFECT_YOKOGAKI);
					break;
				case VK_RIGHT:
					// 横書き対応の移動
					goTo (goTo.PREV_PAGE, goTo.AFFECT_YOKOGAKI);
					break;
				case VK_UP:
					goTo.PrevSectionFirstPage ();
					break;
				case VK_DOWN:
					goTo.NextSectionFirstPage ();
					break;
				case VK_PAGEUP:
				case VK_HOME:
					// 現在のsectionの先頭
					goTo.CurrentSectionFirstPage ();
					break;
				case VK_PAGEDOWN:
				case VK_END:
					// 現在のsectionの最終
					goTo.CurrentSectionLastPage ();
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

			$('#noja_maegaki').on('click', function() {
				MaegakiAtogakiModeController.changeMaegaki ($(this).prop('checked'));
			});
			$('#noja_atogaki').on('click', function() {
				MaegakiAtogakiModeController.changeAtogaki ($(this).prop('checked'));
			});
			$('#noja_layout').on('click', function() {
				setGlobalLayout ($(this).prop('checked'));
				gSectionManager.reMake();	// nullcheckが入ってないがほぼ同じなので統合
				// レイアウト変更の場合はページ位置は移動しなくてOk?
				goTo.CurrentSectionPageWithRedraw (gCurrentManager.page);
			});

			var fontChangeHandler = function (font_type) {
				setGlobalFontType (font_type);
				gMainContext.font = get_canvas_font (gCharFontSize);
				showPage();
			};
			$('#noja_mincho').on('click', function() {
				fontChangeHandler(FONTTYPE_MINCHO);
			});
			$('#noja_gothic').on('click', function() {
				fontChangeHandler(FONTTYPE_GOTHIC);
			});
			$('#noja_kaigyou').on('click', function() {
				setSettingKaigyou ($(this).prop('checked'));
				gSectionManager.reMake();
				goTo.CurrentSectionPageWithRedraw (FIRST_PAGE_NO);
			});


			$('#noja_always_open').on('click', function() {
				setGlobalAlwaysOpen ($(this).prop('checked'));
			});
			$('#noja_autosave').on('click', function() {
				setSettingAutoSave ($(this).prop('checked'));
			});
			$('#noja_autorestore').on('click', function() {
				setSettingAutoRestore ($(this).prop('checked'));
			});
			$('#noja_olddata').on('click', function() {
				setSettingOldData ($(this).prop('checked'));
			});
			$('#noja_allpage').on('click', function() {
				setGlobalAllpage ($(this).prop('checked'));
				showPage();
			});
			$('#noja_yokogaki').on('click', function() {
				setGlobalYokogaki($(this).prop('checked'));
				updateLC(slidePos2ZoomRatio (gSlidePos), true);
				// @@ 入れ替えてみるべきかも？ @@
				gSectionManager.reMake();
				onResize();
				goTo.CurrentSectionPageWithRedraw (FIRST_PAGE_NO);
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
				goTo.CurrentSectionPageWithRedraw (FIRST_PAGE_NO);
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
				$(drag).on('mousedown', function(e) {
					dragging = true;
					span = e.clientX - $(drag).offset().left - w;
				});
				$(document).on('mouseup', function(){
					if (dragging) {
						dragging = false;
						// [0.083... , 200.083..]が実測値
						var slidePos = $(drag).offset().left + w - 1
							- $(dragback).offset().left;
						fontSizeSliderDoneHandler (slidePos);
					}
				});
				$(document).on('mousemove', function(e) {
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
			indexFrame.$updateAnchor().on('click', loadIndex.bind(this, true));

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
				$(click_target_selector).on('click', function() {
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
				$(click_target_selector).on('click'
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
				$(click_target_selector).on('click'
					, createCloseHandler(close_target_selector)
				);
			});

			$('#noja_save').on('click', function() {
				nojaSave();
			});
			$('#noja_restore').on('click', function() {
				nojaRestore(gSiteParser.getNovelId());
			});

			// @@ TODO @@ start,endの概念が1～maxに依存している
			var createDownloadLink = function (start, end, suffix) {
				return $('<a>').attr({
					url: URL.createObjectURL(gHtmlPortManager.createDownloadData(start, end)),
					download: gSiteParser.getTitle() + suffix + '.noja.html',
				}).get(0);
			};

			var handle_DownloadDispatchHandler = function (start, end, suffix) {
				suffix = (suffix === undefined || suffix === null) ? '' : suffix;
				var evt = document.createEvent('MouseEvents');
				evt.initMouseEvent('click', true, true, window
					, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				createDownloadLink(start, end, suffix).dispatchEvent(evt);
			};

			$('#noja_download').on('click', function() {
				handle_DownloadDispatchHandler (1, gSectionManager.length() - 1);
			});
			$('#noja_download2').on('click', function() {
				handle_DownloadDispatchHandler (1, gSectionManager.length() - 1
					, '(' + getDateTimeNow() + ')');
			});
			$('#noja_download3').on('click', function() {
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
			$('#noja_hyouka td:eq(0)').html(ResourceManager.load (HYOUKA_HTML));
			$('#noja_hyouka td:eq(1)').empty()
				.append(ResourceManager.load (HYOUKANAVI_HTML))
				.append(ResourceManager.load (KANSOU_HTML));
			// タブ設定
			$('#noja_hyouka .hyoukanavi a:eq(0)')
				.on('click', function(){
					$('#noja_f_cr').show();
					$('#noja_r_fc').hide();
				});
			$('#noja_hyouka .hyoukanavi a:eq(1)')
				.on('click', function(){
					$('#noja_f_cr').hide();
					$('#noja_r_fc').show();
				});
			//////////////////////////////////////////////
			// サイト毎のメニュー再構築
			console.debug('stage2: site and book specific ui initialize');
			gSiteParser.uiCustomSetup ();
			//////////////////////////////////////////////
			// 次stageへ
			initialize_stage3 ();
		};

		///////////////////////////////////////////////////////////
		var initialize_stage3 = function() {
			console.debug ('initialize stage3');
			//////////////////////////////////////////////
			// 次stageへのchain: 非同期 Deferred interface
			// アプリモードだとコンテンツ読み込み等
			gSiteParser.importInitialContents().then(
				initialize_stage4
				// format mismatchでエラーが出ることはあるが無視
			);
		};
		///////////////////////////////////////////////////////////
		// 初期化完了手前の最終段階
		var initialize_stage4 = function() {
			console.debug ("gMainSize", gMainSize);
			console.debug ("gMainSize.width, .height", gMainSize.width, gMainSize.height);
			console.debug ("#noja main width, .height"
			, $('#noja_main').width(), $('#noja_main').height());
			//
			console.debug('stage4: PageNavigation update');
			gCurrentManager.updateTotalPages(gSetting);
			gPageNavigationManager.update();
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
				dfrd = nojaRestore(gSiteParser.getNovelId(), false);
			}
			$.when(dfrd).then(
				function() {
					if (gSetting.autoSave) {
						nojaSave(false);
					}
					if (gAlwaysOpen) {
						rootFrame.$().ready(nojaOpen());
					}
					gSiteParser.onReadyNoja();
				}
			);
		};

		///////////////////////////////////////////////////////
		// まずローカルストレージからの設定取り出し
		// 少し変更:'noja_'プレフィックスがあって認識しないものは
		// 全部deprecated扱いとする
		// オリジナルではregexpにマッチしない'noja_'prefix付のものは
		// ignore扱いだった
		// これは旧形式互換のため？
		// 現状でローカルストレージに保存はしてないような？
		(function(ls) {
			if (ls) {
				console.debug('ls:', ls);
				var globalSetting = {};
				var customSetting = {};
				var deprecated = [];
				var parseGlobalSetting = function (k,v) {
					switch(k) {
					case 'noja_alwaysOpen':
					case 'noja_allpage':
					case 'noja_layout':
					case 'noja_yokogaki':	// @@ 追加
						globalSetting[k] = ensureParseBool (v, false);
						return true;
					case 'noja_fontType':
						globalSetting[k] = v;
						return true;
					case 'noja_slidePos':
						globalSetting[k] = parseInt(v);
						return true;
					}
					return false;
				};
				var re = /(noja)_([^_]*)_(fMaegaki|fAtogaki|kaigyou)/;
				var parseCustomSetting = function (k,v) {
					var m = re.exec(k);
					if (m && m[2] !== 'undefined' && m[2] !== 'novelview') {
						if (!(m[2] in customSetting)) {
							customSetting[m[2]] = {
								ncode: m[2]
							};
						}
						// 何故かこっちはstringではなくtrueとの直接validateだった
						customSetting[m[2]][m[3]] = ensureBool(v, false);
						return true;
					}
					return false;
				};
				for (var i = 0; i < ls.length; ++i) {
					var k = ls.key(i);
					var v = ls.getItem(k);
					if (k.startsWith('noja_')) {
						if (!parseGlobalSetting(k,v)
							&& !parseCustomSetting(k,v)) {
							deprecated.push(k);
						}
					}
				}
				if (Object.keys(globalSetting).length) {
					gGlobalSettingManager.saveAll (globalSetting);
				}
				if (Object.keys(customSetting).length) {
					gCustomSettingManager.save (customSetting);
				}
				for (var i = 0; i < deprecated.length; ++i) {
					ls.removeItem(deprecated[i]);
				}
			}
		})(noja_option.localStorage);

		// local-storage -> typecheck -> save -> load -> set props -> save
		// local-storageにあればそれを保存しているだけで
		// ないものはデフォルトが作られていない

		// 機能的にはglobal setting関連の基本機能みたいな部分なので
		// load->set props ->save部分はそちらに移動
		ensureGlobalSettingAll ().then(
			initialize_stage1
		);
	};

	//最後に初期化して終了。
	initialize();
});
