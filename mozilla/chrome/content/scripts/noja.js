/*! のじゃー縦書リーダー ver.1.13.* (c) 2013 ◆TkfnIljons */
$(document).ready(function(){
	'use strict';

	//バージョンはアップデートの前に書き換えろよ！　絶対だかんな！
	var version='1.13.901.2+p9';

	//なろうapiにアクセスするときのgetパラメータ
	var ajax_get_opt = noja_option.ajax_get_opt;
	//同データタイプ
	var ajax_data_type = noja_option.ajax_data_type;

	//リソースのURL

	//のじゃーのメインビュー
	var noja_view_html = noja_option.noja_view_html;
	//評価フォーム
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
	//実際はacync:falseで(ローカルにあるファイルだから同期しちゃって大丈夫)ajaxやってるだけなんだけど、
	//火狐版だとこのスクリプトからはクロスドメインできないんだよ……
	var lsc = noja_option.loadSubContent;

	var save = noja_option.save;
	var load = noja_option.load;
	var deleteItem = noja_option.deleteItem;
	
	//定数
	
	//ここらへんは変更できるようにするかも

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
	var fontFamilly = mincho;
	//現在読んでいる話(第一話が1)
	var currentSection;
	//現在表示しているページ(ページ番号はこれ+1)
	var page=0;
	//なろうapiで取って来るgeneral_all_no。つまり全話数。
	//まあ目次読み込んだらいいって話もあるんだけど。
	var generalAllNo = null;
	//表示部分のサイズ。実際のサイズの2倍
	var size;
	//文字サイズ。デフォルトはページ縦幅/48
	var char_size;
	//ページナビゲーションのサムネイルの幅と高さ。横800固定。実際の表示サイズはこの1/5
	var sumWidth = 800;
	var sumHeight = sumWidth/Math.sqrt(2);
	//ページナビゲーションのサムネイルの文字サイズ。
	var sum_char = sumHeight/48;
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
	var mokuji;

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
	var honbun, maegaki, atogaki;
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
	var getCol;
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

	//こっから関数の実体定義
	valid = function(x) { return typeof x !=='undefined'; }
	getCol = function(text) {
		var col = 0;
		for(var i = 0; i < text.length; ++i) {
			if(hankaku.indexOf(text[i])>=0) {
				if(yokogaki) col+=0.5;
				else if((i==0||hankaku.indexOf(text[i-1])<0)&&
				tatechuyoko.indexOf(text[i])>=0&&
				(i+1==text.length||hankaku.indexOf(text[i-1])<0)) ++col;
				else col+=0.5;
			}
			else if(i==0||'゛゜\u3099\u309A'.indexOf(text[i])<0) ++col;
		}
		return col;
	}
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
		if(space==null) space=4;
		text=text.replace(/\r|\n/g, '');
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
		while(true) {
			while(true) {
				var ch  =text[pos];
				var p = pos+1;
				switch(ch) {
				case '<':
					++pos;
					if(text[pos]=='b') {
						while(text[pos++]!='>');
						 newLine();
					}
					else if(text[pos]=='r') {
						p = text.indexOf('</ruby>', pos)+7;
						var tt = $(text.substr(pos-1, p-pos-1));
						var b =$('rb', tt).text();
						var l = getCol(b);
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
					}
					else if(text[pos]=='i') {
						p = text.indexOf('>', pos)+1;
						var tt = $(text.slice(pos-1, p));
						var s = $(tt).attr('src');
						if(s == null) {
							pos=p;
						}
						else {
							newLine();
							arr.push(pageData);
							ruby.push(rb);
							pos=p;
							s = s.replace('viewimagebig', 'viewimage');
							(function(){
								var section = loadSection;
								var p = arr.length-arr.length%2;
								arr.push($('<img>').attr('src', s).bind('load', function(){
									if(currentSection == section) {
										if(page==p) showPage();
										else {
											var context2 = $('#noja_page_'+p).get(0).getContext('2d');
											context2.font= fontWeight+' '+sum_char+'px '+fontFamilly;
											drawPage(context2, sum_char, {width:sumWidth, height:sumHeight}, p, sumWidth/size.width);
										}
									}
								}).get(0));
							})();
							ruby.push([]);
							line = 0;
							col = 0;
							pageData = [];
							rb = [];
						}
					}
					else {
						while(text[pos++]!='>');
					}
					break;
				case '゛':
				case '゜':
				case '\u3099':
				case '\u309A':
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
							'01234567890!?'.indexOf(ch)>=0&&
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
	splitPageEx = function(text, line_num, char_num, space) {
		if(layout) return splitPage(text, line_num, char_num-2, space);
		else return splitPage(text, line_num, char_num, space);
	}
	showStatusMessage =function(text) {
		$('#noja_status').html(text).show();
		if(timeoutID!=null) clearTimeout(timeoutID);
		timeoutID = setTimeout(function(){$('#noja_status').hide(100);}, 3000);
	};

	autoPagerize = function(sec, num) {
		if(noja_option.appmode) {
			var divs = $('#noja_download_file_main > div');
			var prev = null;
			for(var i = 0; i < divs.size(); ++i) {
				var div = divs.eq(i);
				var j = div.attr('id').match(/noja_download_section_(.*)/)[1];
				if(j < num) prev = div;
				else break;
			}
			var div = $('<div id="noja_download_section_'+num+'"></div>');	
			if(sec._maegaki!=null) div.append('<div class="noja_download_maegaki">'+sec._maegaki+'</div>');
			if(sec.chapter_title!=='') div.append('<div class="noja_download_chapter_title">'+sec.chapter_title+'</div>');
			div.append('<div class="noja_download_subtitle">'+sec.subtitle+'</div>')
			div.append('<div class="noja_download_honbun">'+sec._honbun+'</div>');
			if(sec._atogaki!=null) div.append('<div class="noja_download_atogaki">'+sec._atogaki+'</div>');
			if(prev===null) $('#noja_download_file_main').prepend(div);
			else prev.after(div);
		}
		else if(autoPage) {
			var prev = null;
			for(var i = 1; i < num; ++i) {
				var div = $('div[data-noja="'+i+'"]:last');
				if(div.size()) prev = div;
			}
			var c = $('<div>');
			if(sec._maegaki!=null) c.append('<div class="novel_p" data-noja="'+num+'"><div class="novel_view">'+sec._maegaki+'</div></div>');
			if(sec.chapter_title!=='') c.append('<div class="novel_subtitle" data-noja="'+num+'"><div class="chapter_title">'+sec.chapter_title+'</div>'+sec.subtitle+'</div>');
			else c.append('<div class="novel_subtitle" data-noja="'+num+'">'+sec.subtitle+'</div>')
			c.append('<div class="novel_view" id="novel_view" style="'+$('#novel_view').attr('style')+'" data-noja="'+num+'">'+sec._honbun+'</div>');
			if(sec._atogaki!=null) c.append('<div class="novel_a" data-noja="'+num+'"><div class="novel_view">'+sec._atogaki+'</div></div>');
			if(prev===null) $('div.novel_pn:first').after('<hr>').after(c.children());
			else prev.after(c.children()).after('<hr>');
		}
	};
	//各話の各ページにジャンプする関数。pに負の値を渡すと最後尾ページにジャンプ。
	jumpTo = function(section, p) {
		var shouHyouka = function(){
			showStatusMessage('川・◊・)いま投稿されているのはここまでなのじゃー。感想を書いてあげるといいのじゃー。');
			$('#noja_hyouka').show();
		};
		if(section==0) { showStatusMessage('(´・ω・｀)ここが最初の話だよ'); return; }
		//ジャンプ先が全話数より多ければ終了
		if(generalAllNo&&section>generalAllNo) {
			shouHyouka();
			return;
		}
		//f===trueなら話移動が必要
		var f = section!=currentSection;
		//sectionに負の値を渡すと現在の話を強制再読み込み。
		if(section<0) {
			section = currentSection;
			f = true;
		}
		//まだ読み込まれていない
		if(!(section in sections)||sections[section]===false||sections[section]===null){
			//読み込み終了までにこれが変更されてなかったら読み込み終了後にジャンプ
			nextPage = p;
			nextSection = section;
			//読み込み中はtrueをマークする
			sections[section]=true;
			++loading;
			//読み込み関数
			var fn = function() {
				//ステータスバーに読み込み中を通知する。
				$('#noja_status').html('<img src="'+loading1+'">読み込み中...').show(100);
				//ajaxでページを読み込む。
				$.ajax({
					url:site+ncode+'/'+section+'/',
					//成功
					success:function(data) {
						//読み込んだデータをとりあえずJQueryにぶち込んで解析
						var contents = $(data);
						var chapter_title = $('.chapter_title', contents);
						//サブタイトル取得
						var subtitle = $('.novel_subtitle', contents);
						//章タイトルがあるかどうか判別
						if($('.chapter_title', subtitle).size()) {
							//章タイトル取得後、サブタイトルから章タイトルを削除
							chapter_title = chapter_title.text();
							subtitle = subtitle.text();
						}
						else {
							//サブタイトル取得。章タイトルは空文字列
							subtitle = subtitle.text();
							chapter_title = '';
						}
						auther = $('<div>')
							.html(
								$('.contents1').html()
								.replace(/\r|\n/g, '')
								.match(/作者：(.*)(<p.*?<\/p>)?/)[1]
							)
							.text();
						//前書きデータ取得
						var maegaki = $('#novel_p', contents).html();
						//後書きデータ取得
						var atogaki = $('#novel_a', contents).html();
						var _maegaki = maegaki;
						var _atogaki = atogaki;
						loadSection = section;
						if(maegaki!=null) maegaki=splitPageEx(maegaki, line_num, char_num, 2);
						if(atogaki!=null) atogaki=splitPageEx(atogaki, line_num, char_num, 2);
						//本文データ取得
						var _honbun = $('#novel_honbun', contents).html();
						var honbun = splitPage(_honbun, line_num, char_num);
						//データを登録
						sections[section] = {
							chapter_title:chapter_title,
							subtitle:subtitle,
							maegaki:maegaki,
							atogaki:atogaki,
							honbun:honbun,
							_maegaki:_maegaki,
							_atogaki:_atogaki,
							_honbun:_honbun
						};
						autoPagerize(sections[section], section);
						--loading;
						//ステータスバーに成功を通知
						showStatusMessage('(｀・ω・´)成功!!');
						maxSection = Math.max(maxSection, section);
						if(nextPage!=page||nextSection!=currentSection) jumpTo(nextSection, nextPage);
						if(setting.autoSave) nojaSave(false);
					},
					error:function() {
						//ステータスバーに失敗を通知
						showStatusMessage('失敗(´・ω・｀)……')
						//失敗時はfalseをマークする。
						sections[section] = false;
						--loading;
					}
				});
			}
			if(section<=maxSection) {
				fn();
				return;
			}
			//話数カウントされていない場合
			if(generalAllNo===null) {
				//読み込み中をマーク
				generalAllNo = false;
				//ステータスバーに読み込み中を通知する。
				$('#noja_status').html('<img src="'+loading1+'">読み込み中...').show(100);
				//ajaxでなろう小説APIからデータを受け取る
				$.ajax({
					url:api+ajax_get_opt+ncode,
					dataType:ajax_data_type,
					//成功
					success:function(data) {
						var flag = generalAllNo===false;
						//話数を設定
						generalAllNo=parseInt(data[1].general_all_no);
						maxSection=generalAllNo;
						//話数が多ければさらに読み込み
						if(section<=generalAllNo) fn();
						else {
							shouHyouka();
							sections[section] = false;
						}
					},
					error:function(data) {
						showStatusMessage('失敗(´・ω・｀)……')
						sections[section] = false;
						--loading;
						generalAllNo = null;
					}
				});
			}
			else if(generalAllNo===false) {
				var fn2 = function(){
					if(generalAllNo===false) {
						setTimeout(fn2, 100);
						return;
					}
					if(generalAllNo===null||section>generalAllNo) { sections[section] = false; --loading; }
					else fn();
				};
				setTimeout(fn2, 100);
			}
			return;
		}
		//読み込み中なので終了。
		if(sections[section]===true) return;
		var len= sections[section].honbun[0].length;
		if(sections[section].maegaki!=null&&setting.fMaegaki) len+=sections[section].maegaki[0].length
		if(sections[section].atogaki!=null&&setting.fAtogaki) len+=sections[section].atogaki[0].length
		if(p<0) { p += len; }
		p = p-p%2;
		if((!f&&p==page)||p>=len||p<0) return;
		nextPage = p;
		nextSection = section;
		$('#noja_page_'+page).removeClass('noja_page_select').css('border-color', color);
		page = p;
		$('#noja_page_'+page).addClass('noja_page_select').css('border-color', '');
		if(f) {
			currentSection = section;
			chapter_title=sections[currentSection].chapter_title;
			subtitle=sections[currentSection].subtitle;
			maegaki=sections[currentSection].maegaki;
			atogaki=sections[currentSection].atogaki;
			honbun=sections[currentSection].honbun;
			$('#noja_shiori').attr('href', 'http://syosetu.com/bookmarker/add/ncode/'+ncode2+'/no/'+currentSection+'/?token='+token);
			updateNavigation();
		}
		showPage();
	};
	updateNavigation=function() {
		$('#noja_pages > div').empty();
		total = honbun[0].length;
		if(maegaki!=null&&setting.fMaegaki) total+=maegaki[0].length
		if(atogaki!=null&&setting.fAtogaki) total+=atogaki[0].length
		for(var i = 0; i < total; i+=2) {
			(function(){
				var p = i;
				var section = currentSection;
				$('#noja_pages > div').append('<div>'+(i+1)+'ページ</div>').append($('<canvas id="noja_page_'+i+'" width="'+sumWidth+'px" height="'+sumHeight+'px" style="border-color:'+(i===page?'':color)+'" >').bind('click', function(){ jumpTo(section, p); }));
				var context2 = $('#noja_page_'+i).get()[0].getContext('2d');
				context2.font=fontWeight+' '+sum_char+'px '+fontFamilly;
				drawPage(context2, sum_char, {width:sumWidth, height:sumHeight}, i, sumWidth/size.width);
			})();
		}
		$('#noja_page_'+page).addClass('noja_page_select');
	}
	drawPage = function(context, char_size, size, page, bairitu) {
		if(!bairitu) bairitu = 1;
		var drawRuby = function(text, x, y, size, col) {
			context.save();
			if(text.match(/、+|・+/)==text) {
				if(text[0]=='、') {
					context.font=fontWeight+' '+(size*2)+'px '+fontFamilly;
					if(yokogaki) context.translate(size*.3, -size*.6);
					else context.translate(-size*.5, size*.5);
				}
				else {
					context.font=fontWeight+' '+(size*2)+'px '+fontFamilly;
					if(yokogaki) context.translate(0, size*.1);
					else context.translate(-size*.5, size*.5);
				}
			}
			else context.font=fontWeight+' '+(size)+'px '+fontFamilly;
			if(yokogaki) {
				var yy = getCol(text)-col*2;
				var size_col = size;
				if(yy>0) {
					y-=yy*size*.45;
					size_col*=.9;
				}
				else {
					var span =-yy*size/text.length;
					size_col += span;
					y+=span*.5;
				}
				for(var j = 0; j < text.length; ++j) {
					var ch = text[j];
					context.save();
					context.translate(x+size*2, y+size*3.6);
					if (hankaku.indexOf(ch) >= 0) x+=size_col;
					else x+=size_col;
					context.fillText(ch, 0, 0);
					context.restore();
				}
			}
			else {
				var yy = getCol(text)-col*2;
				var size_col = size;
				if(yy>0) {
					y-=yy*size*.45;
					size_col*=.9;
				}
				else {
					var span =-yy*size/text.length;
					size_col += span;
					y+=span*.5;
				}
				// utilities for halfwidth lr-tb
				var get_halfwidth_string = function (text, pos) {
					var idx = pos;
					while (hankaku.indexOf(text[idx]) >= 0) {
						if (++idx == text.length) {
							break;
						}
					}
					return text.slice(pos,idx);
				}
				var is_beginning_of_halfwidth_string = function (text, pos) {
					return (pos==0||hankaku.indexOf(text[pos-1])<0);
				}
				var is_hankaku_lr_tb_string = function (s) {
					var nandatte = '!?';
					var num = '0123456789';
					if (s == nandatte) {
						return true;
					}
					for (var i = 0; i < s.length; ++i) {
						if (num.indexOf(s[i]) < 0) {
							return false;
						}
					}
					return true;
				}
				for(var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//context.strokeRect(x+size*2, y+size*2, size, size_col);
					context.save();
					context.translate(x+size*2, y+size*2.9);
					if (hankaku.indexOf(ch) >= 0){
						// このあたりでルビ内半角の縦中横処理
						var halfwidth_string = get_halfwidth_string(text,j);
						//    半角領域先頭
						// && 半角領域が2文字だけ
						// && (半角数字2文字 || nandatte)
						if (is_beginning_of_halfwidth_string(text, j)
						&& halfwidth_string.length <= 2
						&& is_hankaku_lr_tb_string (halfwidth_string)
						){
							if (halfwidth_string.length == 2) {
								// translate()引数が全省略でいいのか？
								// 多分drawText側での"1."等の場合に詰める処理の残滓
								//context.translate();
								context.fillText(ch, 0, 0);
								ch = text[++j];
								context.translate(size/2, 0);
								y+=size_col;
							} else {
								// 半角数字1文字
								context.translate(size/4, 0);
								y+=size_col;
							}
						}
						else {
							context.translate(size/6, -size*5/6);
							context.rotate(Math.PI / 2);
							y+=size_col*.5;
						}
					}
					else if (zenkakukaiten.indexOf(ch) >= 0){

						context.translate(size/6, -size*5/6);
						context.rotate(Math.PI / 2);
						y+=size_col;
					}
					else if (ch=='ー') {
						context.translate(size*11/12, -size*5/6);
						context.rotate(Math.PI / 2);
						context.scale(1, -1);
						y+=size_col;
					}
					else if ('。、．，'.indexOf(ch) >= 0){
						context.translate(size*3/5, -size*3/5);
						y+=size_col;
					}
					else if (komoji.indexOf(ch) >= 0){
						context.translate(size/10, -size/8);
						y+=size_col;
					}
					else {
						y+=size_col;
					}
					context.fillText(ch, 0, 0);
					context.restore();
				}
			}
			context.restore();
		};
		var drawText = function(text, x, y, size) {
			if(yokogaki) {
				for(var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//context.strokeRect(x, y+size, size, size);
					context.save();
					context.translate(x+size, y+size*.85);
					if (hankaku.indexOf(ch) >= 0) x+=size*.5;
					else if ('゛゜\u3099\u309A'.indexOf(ch) >= 0){
						context.translate(-size*.25, 0);
					}
					else x+=size;
					context.fillText(ch, 0, 0);
					context.restore();
				}
			}
			else {
				for(var j = 0; j < text.length; ++j) {
					var ch = text[j];
					//context.strokeRect(x, y+size, size, size);
					context.save();
					context.translate(x, y+size*1.9);
					if (hankaku.indexOf(ch) >= 0){
						var nandatte = '!?';
						var num = '0123456789';
						if((j==0||hankaku.indexOf(text[j-1])<0)&&
						((num.indexOf(ch) >= 0&&(num+'.,').indexOf(text[j+1])>=0)||
						(nandatte.indexOf(ch) >= 0&&nandatte.indexOf(text[j+1])>=0))&&
						(j+2==text.length||hankaku.indexOf(text[j+2])<0)){
							if('.,'.indexOf(text[j+1])>=0) context.translate(size/4, 0);
							context.fillText(ch, 0, 0);
							ch = text[++j];
							context.translate(size/2, 0);
							y+=size;
						}
						else if((j==0||hankaku.indexOf(text[j-1])<0)&&
						(num.indexOf(ch) >= 0||nandatte.indexOf(ch) >= 0)&&
						(j+1==text.length||hankaku.indexOf(text[j+1])<0)){
							context.translate(size/4, 0);
							y+=size;
						}
						else {
							context.translate(size/6, -size*5/6);
							context.rotate(Math.PI / 2);
							y+=size*.5;
						}
					}
					else if (zenkakukaiten.indexOf(ch) >= 0){
						context.translate(size/6, -size*5/6);
						context.rotate(Math.PI / 2);
						y+=size;
					}
					else if (ch=='ー') {
						if(fontType=='mincho') context.translate(size*11/12, -size*5/6);
						else  context.translate(size*5/6, -size*7/8);
						context.rotate(Math.PI / 2);
						context.scale(1, -1);
						y+=size;
					}
					else if ('。、．，'.indexOf(ch) >= 0){
						context.translate(size*3/5, -size*3/5);
						y+=size;
					}
					else if ('“〝'.indexOf(ch) >= 0){
						context.translate(0, size/2);
						y+=size;
					}
					else if (komoji.indexOf(ch) >= 0){
						context.translate(size/10, -size/8);
						y+=size;
					}
					else if ('゛゜\u3099\u309A'.indexOf(ch) >= 0){
						context.translate(size*.75, -size);
					}
					else if ('☹☺☻☼♠♡♢♣♤♥♦♧♫♬♮'.indexOf(ch) >= 0){
						context.font=''+(size*1.5)+'px '+fontFamilly;
						context.translate(size*.175, size*.15);
						y+=size;
					}
					else {
						y+=size;
					}
					context.fillText(ch, 0, 0);
					context.restore();
				}
			}
		};
		context.fillStyle=bgColor;
		context.fillRect(0, 0, size.width, size.height);
		if(bgImage) {
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
		var grad = context.createLinearGradient(size.width*.48, 0, size.width*.52, 0);
		bgColor.match(/rgb\(([0-9]*), ([0-9]*), ([0-9]*)\)/g);
		var r = parseInt(RegExp.$1), g = parseInt(RegExp.$2), b = parseInt(RegExp.$3);
		grad.addColorStop(0, bgColor);
		grad.addColorStop(.2, 'rgb('+Math.floor(r*.95)+', '+Math.floor(g*.95)+', '+Math.floor(b*.95)+')');
		grad.addColorStop(.25, 'rgb('+Math.floor(r*.91)+', '+Math.floor(g*.91)+', '+Math.floor(b*.91)+')');
		grad.addColorStop(.3, 'rgb('+Math.floor(r*.85)+', '+Math.floor(g*.85)+', '+Math.floor(b*.85)+')');
		grad.addColorStop(.4, 'rgb('+Math.floor(r*.69)+', '+Math.floor(g*.69)+', '+Math.floor(b*.69)+')');
		grad.addColorStop(.5, 'rgb('+Math.floor(r*.5)+', '+Math.floor(g*.5)+', '+Math.floor(b*.5)+')');
		grad.addColorStop(.6, 'rgb('+Math.floor(r*.69)+', '+Math.floor(g*.69)+', '+Math.floor(b*.69)+')');
		grad.addColorStop(.7, 'rgb('+Math.floor(r*.85)+', '+Math.floor(g*.85)+', '+Math.floor(b*.85)+')');
		grad.addColorStop(.75, 'rgb('+Math.floor(r*.91)+', '+Math.floor(g*.91)+', '+Math.floor(b*.91)+')');
		grad.addColorStop(.8, 'rgb('+Math.floor(r*.95)+', '+Math.floor(g*.95)+', '+Math.floor(b*.95)+')');
		grad.addColorStop(1, bgColor);
		context.fillStyle=grad;
		context.fillRect(0, 0, size.width, size.height);
		*/
		context.fillStyle=color;
		context.strokeStyle=color;
		var page_base = 0;
		(function(){
			if(allpage) {
				var j = 0;
				for(var i = 1; i < currentSection; ++i) {
					if(!(i in sections)||sections[i]===false) return;
					j+=sections[i].honbun[0].length;
					if(setting.fMaegaki&&sections[i]._maegaki!=null) j+=sections[i].maegaki[0].length;
					if(setting.fAtogaki&&sections[i]._atogaki!=null) j+=sections[i].atogaki[0].length;
					j+=j%2;
				}
				page_base = j;
			}
		})();
		var tpos = 0;
		if(maegaki!=null&&setting.fMaegaki) tpos = maegaki[0].length;
		var apos = tpos+ honbun[0].length;
		for(var k = page; k < page+2 && k < total; ++k) {
			if(k==tpos) {
				context.save();
				context.font=fontWeight+' '+char_size*1.4+'px '+fontFamilly;
				var text = subtitle;
				if(mokuji===null) {
					text+='　　　'+auther;
				}
				if(yokogaki) drawText(text, (k===page?char_size*6:(size.width-char_size*(char_num+2))), char_size*6, char_size*1.4);
				else drawText(text, (page+1-k)*size.width/2+char_size*line_num*1.7, char_size*6, char_size*1.4);
				context.restore();
			}
			var p;
			var rb;
			var yy = 3;
			if(k<tpos) {
				p = maegaki[0][k];
				rb = maegaki[1][k];
				if(layout) {
					if(yokogaki) context.strokeRect(size.width/2+char_size*(k!=page?1.5:-(char_num+2.5)), char_size*4.3, char_size*(char_num+1.1), char_size*(line_num*1.7+.7));
					else context.strokeRect(size.width/2+char_size*(k==page?1.4:-((line_num)*1.7+2)), char_size*4.3, char_size*((line_num)*1.7+0.6), char_size*(char_num-1+.4));
					if(yokogaki&&k!==page) yy = 2;
					else yy = 4;
				}
			}
			else if(k<apos) {
				p = honbun[0][k-tpos];
				rb = honbun[1][k-tpos];
			}
			else {
				p = atogaki[0][k-apos];
				rb = atogaki[1][k-apos];
				if(layout) {
					if(yokogaki) context.strokeRect(size.width/2+char_size*(k!=page?1.5:-(char_num+2.5)), char_size*4.3, char_size*(char_num+1.1), char_size*(line_num*1.7+.7));
					else context.strokeRect(size.width/2+char_size*(k==page?1.4:-((line_num)*1.7+2)), char_size*4.3, char_size*((line_num)*1.7+0.6), char_size*(char_num-1+.4));
					if(yokogaki&&k!==page) yy = 2;
					else yy = 4;
				}
			}
			if(Object.prototype.toString.call(p).slice(8, -1)==='HTMLImageElement') {
				var w = p.width*2*bairitu;
				var h = p.height*2*bairitu;
				if(h/w>Math.sqrt(2)) {
					if(h>size.height){
						w*=size.height/h;
						h = size.height;
					}
				}
				else {
					if(w>size.width/2){
						h*=size.width/(w*2);
						w = size.width/2;
					}
				}
				context.drawImage(p, (yokogaki?(k-page):(1+page-k))*size.width/2+(size.width/2-w)/2, (size.height-h)/2, w, h);
				continue;
			}
			else if(k===page+(yokogaki?1:0)) {
				if(chapter_title=='') {
					context.fillText(subtitle, size.width-context.measureText(subtitle).width - char_size*4, char_size*2.5);
				}
				else {
					context.fillText(chapter_title, size.width-context.measureText(chapter_title).width - char_size*4, char_size*2);
					context.fillText(subtitle, size.width-context.measureText(subtitle).width - char_size*4, char_size*3);
				}
				context.fillText(page_base+page+(yokogaki?2:1), size.width-context.measureText(page_base+page+(yokogaki?2:1)).width - char_size*2, size.height-char_size);
				context.fillRect(size.width/2, 0, .6, size.height);
			}
			else {
				context.fillRect(size.width/2-.6, 0, .6, size.height);
				context.fillText(page_base+page+(yokogaki?1:2), char_size*2, size.height-char_size);
				context.fillText(title, char_size*4, char_size*2.5);
			}
			for(var i = 0; i < p.length; ++i) {
				if(yokogaki) drawText(p[i], (k===page?char_size*yy:(size.width-char_size*(char_num+yy+2))), char_size*(i*1.7+5), char_size);
				else drawText(p[i], size.width/2+char_size*(k==page?(line_num-1-i)*1.7+2:-i*1.7-3), char_size*yy, char_size);
				var r = rb[i];
				for(var j = 0; j < r.length; ++j) {
					if(yokogaki) drawRuby(r[j][2], (k===page?char_size*(yy+r[j][0]):(size.width-char_size*(char_num+yy+2-r[j][0]))), char_size*(i*1.7+3), char_size/2, r[j][1]);
					else drawRuby(r[j][2], size.width/2+char_size*(k==page?(line_num-1-i)*1.7+2:-i*1.7-3), char_size*(yy+r[j][0]), char_size/2, r[j][1]);
				}
			}
		}
	}
	showPage = function() {
		var context2 = $('#noja_page_'+page).get(0).getContext('2d');
		context2.font=fontWeight+' '+sum_char+'px '+fontFamilly;
		drawPage(context, char_size, size, page);
		drawPage(context2, sum_char, {width:sumWidth, height:sumHeight}, page, sumWidth/size.width);
	};
	loadNext = function() {
		if(page+2<total) jumpTo(currentSection, page+2);
		else {
			jumpTo(currentSection+1, 0);
		}
	}
	loadPrev = function() {
		if(page-2>=0) jumpTo(currentSection, page-2);
		else {
			jumpTo(currentSection-1, -1);
		}
	}
	onResize = function() {
		size = { width:$('#noja_main').width(), height:$('#noja_main').height()};
		var style;
		if(size.width/size.height>Math.sqrt(2)) {
			var w = size.width;
			size.width = Math.floor(size.height*Math.sqrt(2));
			style = {width:size.width, height:size.height, top:'', left:'', position:''};
		}
		else {
			var h = Math.floor(size.width/Math.sqrt(2));
			style = {width:size.width, height:h, top:((size.height-h)/2), left:0, position:'absolute'};
			size.height = h;
		}
		size.width*=2;
		size.height*=2;
		$('#noja_canvas_main').get(0).width=size.width;
		$('#noja_canvas_main').get(0).height=size.height;
		$('#noja_canvas_main').css(style);
		if(yokogaki) char_size = size.width/((char_num+6)*2);
		else char_size = size.height/(char_num+8);
		context = $('#noja_canvas_main').get(0).getContext('2d');
		context.font=fontWeight+' '+char_size+'px '+fontFamilly;
		showPage();
		$('#noja_charsize').get(0).width = char_size*8;
		$('#noja_charsize').get(0).height = char_size*2;
		$('#noja_charsize').css({width:char_size*4, height:char_size});
		var context2 = $('#noja_charsize').get(0).getContext('2d');
		context2.font=fontWeight+' '+char_size+'px '+fontFamilly;
		context2.fillText('あア漢Ａ１', char_size, char_size*1.5);
		$('#noja_char_line').text((char_size/2).toFixed(2)+'px, '+char_num+'文字/行, '+line_num+'行/ページ');
	};
	nojaOpen = function() {
		$('#noja_container').show();
		$('body').css('overflow', 'hidden');
		$('#novel_header').hide();
		onResize();
		isOpen = true;
	};
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
	closePopup = function() {
		$('#noja_config').hide();
		$('#noja_config2').hide();
		$('#noja_saveload').hide();
		$('#noja_link').hide();
		$('#noja_help').hide();
		$('#noja_version').hide();
		$('#noja_hyouka').hide();
		$('#noja_download_view').hide();
		$('#noja_booklist_view').hide();
	}
	togglePopup = function(id) {
		var list = ['#noja_config','#noja_config2','#noja_saveload','#noja_link','#noja_help',
			'#noja_version','#noja_hyouka','#noja_download_view','#noja_booklist_view'];
		for(var i = 0; i < list.length; ++i) {
			if(list[i]===id) $(id).toggle();
			else $(list[i]).hide();
		}
	}
	isPopup = function() {
		return $('#noja_config').css('display')!='none'
			||$('#noja_config2').css('display')!='none'
			||$('#noja_saveload').css('display')!='none'
			||$('#noja_link').css('display')!='none'
			||$('#noja_help').css('display')!='none'
			||$('#noja_version').css('display')!='none'
			||$('#noja_hyouka').css('display')!='none'
			||$('#noja_booklist_view').css('display')!='none'
			||$('#noja_download_view').css('display')!='none';
	}
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
			if(!valid(json.tanpen)) throw 0;
			_infos.mokuji = json.tanpen?null:false;
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
					var i = parseInt($(this).attr('id').substr('noja_download_section_'.length));
					loadSection = i;
					_infos.currentSection = Math.min(_infos.currentSection, i);
					var chapter_title = $('.noja_download_chapter_title', this);
					if(chapter_title.size()) chapter_title = chapter_title.text();
					else chapter_title = '';
					var subtitle = $('.noja_download_subtitle', this).text();
					var maegaki = $('.noja_download_maegaki', this);
					var _maegaki = null, _atogaki = null;
					if(maegaki.size()) {
						_maegaki = maegaki.html();
						maegaki = splitPageEx(_maegaki, line_num, char_num);
					}
					else maegaki = null;
					var atogaki = $('.noja_download_atogaki', this);
					if(atogaki.size()) {
						_atogaki = atogaki.html();
						atogaki = splitPageEx(_atogaki, line_num, char_num);
					}
					else atogaki = null;
					var _honbun = $('.noja_download_honbun', this).html();
					var honbun = splitPage(_honbun, line_num, char_num);
					_sections[i] = {
						chapter_title:chapter_title,
						subtitle:subtitle,
						maegaki:maegaki,
						honbun:honbun,
						atogaki:atogaki,
						_maegaki:_maegaki,
						_honbun:_honbun,
						_atogaki:_atogaki,
					}
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
							if(_sections[i]._maegaki!==null) prev.append('<div class="noja_download_maegaki">'+_sections[i]._maegaki+'</div>');
							if(_sections[i].chapter_title!=='') prev.append('<div class="noja_download_chapter_title">'+_sections[i].chapter_title+'</div>');
							prev.append('<div class="noja_download_subtitle">'+_sections[i].subtitle+'</div>')
							prev.append('<div class="noja_download_honbun">'+_sections[i]._honbun+'</div>');
							if(_sections[i]._atogaki!==null) prev.append('<div class="noja_download_atogaki">'+_sections[i]._atogaki+'</div>');
							sections[i] = _sections[i];
						}
						else if(i in sections) {
							prev = $('#noja_download_section_'+i);
						}
					}
					$('#noja_download_file_main').css({
						color: _infos.color,
						backgroundColor:_infos.bgColor
					});
					if(_infos.bgImage) $('#noja_download_file_main').css('background-image', 'url('+_infos.bgImage+')');
					if(_infos.generalAllNo&&generalAllNo) generalAllNo = Math.max(generalAllNo, _infos.generalAllNo);
				}
				site = _infos.site;
				site2 = _infos.site2;
				ncode = _infos.ncode;
				ncode2 = _infos.ncode2;
				mokuji = _infos.mokuji;
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
				if(generalAllNo) maxSection = generalAllNo;
				else generalAllNo=null, maxSection = sections.length;
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
				$('#noja_hyouka .novel_hyouka form').attr('action', site2+'novelpoint/register/ncode/'+ncode2+'/');
				$('#noja_hyouka #noja_f_cr form').attr('action', site2+'impression/confirm/ncode/'+ncode2+'/');
				$('#noja_impression_list').attr('href', site2+'impression/list/ncode/'+ncode2+'/');
				$('#noja_novelreview_list').attr('href', site2+'novelreview/list/ncode/'+ncode2+'/');
				callback(true);
			}
			load('ncode', _infos.ncode, fn);
		}
		catch(e) {
			showStatusMessage('(´・ω・｀)読み込みエラーが発生したよ。');
			callback(false);
		}
	}
	nojaSave = function(showmessage){
		if(typeof showmessage==='undefined') showmessage = true;
		if(loading) {
			showStatusMessage('川・◊・)ねっとわーく接続中なのじゃー。せーぶするのは後にするのじゃー。');
			return;
		}
		var fn = function() { if(showmessage) showStatusMessage('(｀・ω・´)保存したよ！'); };
		var flag = false;
		load('saveData', ncode, function(data) {
			if(!valid(data)) {
				data = {
					site:site,
					site2:site2,
					ncode:ncode,
					ncode2:ncode2,
					generalAllNo:generalAllNo,
					sections:[],
				};
			}
			if(mokuji) {
				data.index = $('<div>').append($(' #noja_index .novel_title, #noja_index .novel_writername, #noja_index #novel_ex, #noja_index .index_box').clone()).html();
			}
			data.tanpen = mokuji===null;
			data.generalAllNo = Math.max(generalAllNo, data.generalAllNo);
			data.title=title;
			data.color=color;
			data.bgColor=bgColor;
			data.auther = auther;
			data.bgImage=bgImage?$(bgImage).attr('src'):null;
			for(var i = 1; i < sections.length; ++i) {
				var sec= sections[i];
				if(sec==null) continue;
				if(setting.oldData&&i in data.sections) continue;
				data.sections[i] = {
					chapter_title:sec.chapter_title,
					subtitle:sec.subtitle,
					_maegaki:sec._maegaki,
					_atogaki:sec._atogaki,
					_honbun:sec._honbun
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
	nojaRestore = function(_ncode, showmessage, callback) {
		if(typeof showmessage==='undefined') showmessage = true;
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
					loadSection = i;
					sec.maegaki = sec.atogaki = null;
					if('_maegaki' in sec && sec._maegaki!=null) sec.maegaki = splitPageEx(sec._maegaki, line_num, char_num);
					if('_atogaki' in sec && sec._atogaki!=null) sec.atogaki = splitPageEx(sec._atogaki, line_num, char_num);
					sec.honbun = splitPage(sec._honbun, line_num, char_num);
					autoPagerize(sec, i);
				}
			}
			if(data.tanpen) mokuji=null;
			else if(data.index&&(!mokuji||ncode!=_ncode)) {
				mokuji = true;
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
					mokuji = null;
					$('#noja_index > div').empty();
				}
				title = data.title;
				$('title').text(title);
				if(site.indexOf('http://ncode')>=0) {
					$('#noja_impression_usertype').empty();
					$('#noja_novelreview_usertype').empty();
					api = 'http://api.syosetu.com/novelapi/api/';
				}
				else if(site.indexOf('http://novel18')>=0) {
					$('#noja_impression_usertype').html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
					$('#noja_novelreview_usertype').html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
					api = 'http://api.syosetu.com/novel18api/api/';
				}
				else {
					$('#noja_impression_usertype').empty();
					$('#noja_novelreview_usertype').empty();
					api='';
				}
				if(data.generalAllNo) maxSection = generalAllNo = data.generalAllNo;
				else generalAllNo = null, maxSection = sections.length;
				ncode = data.ncode;
				var i;
				for(i = 1; i < sections.length&&sections[i]===null; ++i);
				color = data.color;
				bgColor = data.bgColor;
				bgImage = data.bgImage;
				$('#noja').css({color:color, backgroundColor:bgColor});
				if(bgImage&&bgImage!=='none') {
					$('#noja').css('background-image', 'url('+bgImage+')');
					bgImage = $('<img>').attr('src', bgImage).bind('load', function(){showPage(); }).get(0);
				}
				else {
					$('#noja').css('background-image', 'none');
				}
				auther = data.auther;
				$('#noja_hyouka .novel_hyouka form').attr('action', site2+'novelpoint/register/ncode/'+ncode2+'/');
				$('#noja_hyouka #noja_f_cr form').attr('action', site2+'impression/confirm/ncode/'+ncode2+'/');
				$('#noja_hyouka #noja_r_fc form').attr('action', site2+'novelreview/confirm/ncode/'+ncode2+'/');
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
	nojaDelete = function(_ncode) {
		deleteItem('saveData', _ncode);
		load('global', 'bookList', function(data) {
			if(!valid(data)) return;
			delete data[_ncode];
			save('global', data, 'bookList');
		});
	};
	createSaveData = function(min, max) {
		var buffer='<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml">\n<!--\n'+download_id+'\n{\n'+
		'"version":"'+version+'",\n'+
		'"site":["'+site+'","'+site2+'"],\n'+
		'"ncode":["'+ncode+'","'+ncode2+'"],\n';
		if(generalAllNo) buffer+='"general_all_no":'+generalAllNo+',\n';
		'"auther":'+auther+',\n';
		buffer+='"tanpen":'+(mokuji===null)+'\n'+
		'}\n-->\n<head>\n<title>'+$('<div>').text(title).html()+'</title>\n<meta charset="utf-8" />\n</head>\n<body>\n<div>\n<div id="noja_download_file_main" style="color:'+color+';background-color:'+bgColor+';';
		if(bgImage) buffer+='background-image:url('+bgImage.src+');';
		buffer+='">\n';
		for(var i = min; i <= max; ++i) {
			if(i in sections&&sections[i]!==false&&sections[i]!==null) {
				var section = sections[i];
				buffer+='<div id="noja_download_section_'+i+'">\n';
				if(section._maegaki) buffer+='<div class="noja_download_maegaki">'+section._maegaki.replace(/\r|\n/g, '')+'</div>\n';
				if(section.chapter_title!=='') buffer+='<div class="noja_download_chapter_title">'+$('<div>').text(section.chapter_title).html()+'</div>\n';
				buffer+='<div class="noja_download_subtitle">'+$('<div>').text(section.subtitle).html()+'</div>\n';
				buffer+='<div class="noja_download_honbun">'+section._honbun.replace(/\r|\n/g, '')+'</div>\n';
				if(section._atogaki) buffer+='<div class="noja_download_atogaki">'+section._atogaki.replace(/\r|\n/g, '')+'</div>\n';
				buffer+='</div>\n';
			}
		}
		buffer+='</div>\n</div>\n</body>\n</html>';
		return new Blob([buffer.replace(/(<br|<img[^>]*)>/g, '$1 />')],{type:'application/octet-stream'});
	};
	reMake = function() {
		for(var i = 0; i < sections.length; ++i) {
			var sec = sections[i]
			if(i in sections&&sec!==false&&sec!==null) {
				if(sec._maegaki!=null) sec.maegaki=splitPageEx(sec._maegaki, line_num, char_num, 2);
				if(sec._atogaki!=null) sec.atogaki=splitPageEx(sec._atogaki, line_num, char_num, 2);
				sec.honbun=splitPage(sec._honbun, line_num, char_num);
			}
		}
	}
	loadIndex = function() {
		if(mokuji===0) return;
		if($('#noja_loading').size()) $('#noja_loading').html('目次の読み込み中...<br /><img src="'+loading2+'" />');
		else $('#noja_index > div').prepend('<div id="noja_loading">目次の読み込み中...<br /><img src="'+loading2+'" /></div>');
		var prev = mokuji;
		mokuji=0;
		++loading;
		$.ajax({
			url:site+ncode+'/',
			success:function(data) {
				--loading;
				mokuji=true;
				var index = $('.novel_title, .novel_writername, #novel_ex, .index_box', data);
				$('#noja_index > div').html(index);
				var series = $('#noja_index div.series > a');
				if(series.size()) series.attr('href', site+series.attr('href').slice(1));
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
				auther = $('#noja_index .novel_writername').contents().not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]').text().slice(3);
			},
			error:function() {
				--loading;
				mokuji=prev;
				$('#noja_loading').html('目次の読み込みに失敗しました');
			}
		});
	}
	initialize = function() {

		var fn1 = function() {
			save('global', fontType, 'fontType');
			save('global', alwaysOpen, 'alwaysOpen');
			save('global', allpage, 'allpage');
			save('global', layout, 'layout');
			save('global', slidePos, 'slidePos');
			if(yokogaki) {
				char_num = Math.floor(14*Math.pow(2, (200-slidePos)/100));
				line_num = Math.floor(23.5*char_num/29);
			}
			else {
				char_num = Math.floor(20*Math.pow(2, (200-slidePos)/100));
				line_num = Math.floor(17*char_num/40);
			}
			$('body').append(lsc(noja_view_html));
			// 位置が悪い？
			// $('#head_nav').append('<li><a id="noja_open" class="menu">のじゃー縦書リーダー</a></li>');
			$('#novelnavi_right').append('<a id="noja_open" style="cursor:pointer;font-size:'+fontSmall+'; display:block; margin-top:10px;">のじゃー縦書リーダー</a>');

			$('#noja_container').css('font-size', fontSmall);
			if(noja_option.appmode) {
				currentSection=1; page=0;
				site = 'http://naroufav.wkeya.com/noja/';
				site2 = 'http://naroufav.wkeya.com/noja/';
				noja_option.getToken(function(data) {
					token = data; login = token!==''; color='#000';
					fn3();
				});
			}
			else {
				if(document.URL.indexOf('novel18')>=0) {
					document.URL.match(/http:\/\/novel18.syosetu.com\/((n|N)[^\/]*)\/([0-9]*)/);
					site = 'http://novel18.syosetu.com/';
					api = 'http://api.syosetu.com/novel18api/api/';
					site2 = 'http://novelcom18.syosetu.com/'
				}
				else {
					document.URL.match(/http:\/\/ncode.syosetu.com\/((n|N)[^\/]*)\/([0-9]*)/);
					site = 'http://ncode.syosetu.com/';
					api = 'http://api.syosetu.com/novelapi/api/';
					site2 = 'http://novelcom.syosetu.com/'
				}
				ncode = RegExp.$1.toLowerCase();
				currentSection = parseInt(RegExp.$3);
				load('ncode', ncode, fn2);
			}
		}

		var fn2 = function(result){
			setting = result;
			if(!valid(setting)) {
				setting = { ncode:ncode, kaigyou:false, fMaegaki:true, fAtogaki:true };
				save('ncode', setting);
			}
			honbun = $('#novel_honbun');
			if(!honbun.size()) return;
			bgImage = $('body').css('background-image');
			if(bgImage==='none'||bgImage==='') bgImage=null;
			else {
				bgImage = $('<img />').attr('src', bgImage.match(/^url\((.*)\)$/)[1]).bind('load', function(){showPage();}).get(0);
				bgColor = '#FFFFFF';
			}
			title = $('.contents1 > a:eq(0)').text();
			// 旧構造: ".subtitle > .chapter_title"
			chapter_title = $('.chapter_title');	// 変更なし
			subtitle = $('.novel_subtitle');	// 変更なし
			if(title=='') {
				// 短編
				title = $('.novel_title').text();	// 先頭改行削除不要
				subtitle = title;
				chapter_title = '';
				currentSection=1;
				mokuji = null;
				generalAllNo=1;
				// 変更なし
				token = $('div.novel_writername > a[href^="http://syosetu.com/bookmarker/add/ncode/"]');
				if(token.size()) {
					login = true;
					token = token.attr('href').match(/=([0-9a-f]*)$/)[1];
				}
				else {
					login = false;
					token = null;
				}
				auther = $('.novel_writername').contents().not('a[href^="http://syosetu.com/bookmarker/add/ncode/"]').text().slice(4, -3);
			}
			else {
				token = $('#novel_contents a[href^="http://syosetu.com/bookmarker/add/ncode/"]');
				if(token.size()) {
					login = true;
					token = token.attr('href').match(/=([0-9a-f]*)$/)[1];
				}
				else {
					login = false;
					token = null;
				}
				if(chapter_title.size()) {
					chapter_title = chapter_title.text();
					subtitle = subtitle.text();
				}
				else {
					chapter_title = '';
					subtitle = subtitle.text();
				}
				mokuji = false;
				auther = $('<div>')
					.html(
						$('.contents1').html()
						.replace(/\r|\n/g, '')
						.match(/作者：(.*)(<p.*?<\/p>)?/)[1]
					)
					.text();
			}
			if(token) noja_option.setToken(token);
			ncode2 = $('#head_nav a[href^="'+site2+'impression/list/ncode/"]').attr('href').match(/([0-9]*)\/$/)[1];
			honbun = $('#novel_honbun').eq(0).html();
			loadSection = currentSection;
			var _honbun = honbun;
			maegaki = $('#novel_p').eq(0).html();
			var _maegaki = maegaki;
			if(maegaki!=null) maegaki=splitPageEx(maegaki, line_num, char_num, 2);
			atogaki = $('#novel_a').eq(0).html();
			var _atogaki = atogaki;
			if(atogaki!=null) atogaki=splitPageEx(atogaki, line_num, char_num, 2);
			honbun = splitPage(honbun, line_num, char_num);
			sections[currentSection] = {
				chapter_title:chapter_title,
				subtitle:subtitle,
				maegaki:maegaki,
				atogaki:atogaki,
				honbun:honbun,
				_maegaki:_maegaki,
				_atogaki:_atogaki,
				_honbun:_honbun
			};
			$('#noja_maegaki').prop('checked', setting.fMaegaki); 
			$('#noja_atogaki').prop('checked', setting.fAtogaki); 
			$('#noja_kaigyou').prop('checked', setting.kaigyou); 
			$('.novel_subtitle, #novel_honbun, #novel_p, #novel_a').attr('data-noja', currentSection);
			fn3();
		};

		var fn3 = function() {
			setting.autoSave=setting.autoSave===true;
			setting.autoRestore=setting.autoRestore===true;
			setting.oldData=setting.oldData===true;
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
			$('#noja_drag').css('left', slidePos-5);
			// 元の構造はnoja_view.html側で定義されている
			$('#noja_link')
				.find('a:eq(1)')
					.attr('href', login
						? 'http://syosetu.com/user/top/'
						: 'http://syosetu.com/login/input'
					)
					.text(login ? 'マイページ' : 'ログイン')
				.end().find('a:eq(2)')
					.attr('href', site+'novelview/infotop/ncode/'+ncode+'/')
				.end().find('a:eq(3)')
					.attr('href', site2+'impression/list/ncode/'+ncode2+'/')
				.end().find('a:eq(4)')
					.attr('href', site2+'novelreview/list/ncode/'+ncode2+'/')
				// 元はa:eq(4)の兄弟要素としてafter()で入れていたが
				// 階層的に変な気がするのでflatに入れるように変更
				.end().append(
					(login
						? '<div><img src="http://static.syosetu.com/view/images/bookmarker.gif" alt="しおり"><a id="noja_shiori" href="http://syosetu.com/bookmarker/add/ncode/'+ncode2+'/no/'+currentSection+'/?token='+token+'" target="_blank">しおりを挿む</a></div>'
						: ''
					)
					+
			  		(login
			  			? ('<div>'+$('#head_nav > li:contains("登録")').html()+'</div>')
			  			: ''
			  		)
				)
				// img tagそのものを引っ張ってくるのにhtml()が使えないので
				// 要素としてつける
				// after()の戻りはa:ref(4)要素っぽいのでparentにつけないといけないようだ
				.append($('<div>').append($("#sasieflag").clone()));
				;
			$('#noja_version h4').text('のじゃー縦書リーダー ver.'+version);
			$('#noja_open').bind('click', nojaOpen);
			$('#noja_close').bind('click', nojaClose);
			$('#noja_main').bind('mousemove', function(e){
				if(e.clientY<10) {
					$('#noja_menu').show(100);
				}
				else if(mokuji!==null&&e.clientX<10) {
					if(mokuji===false) {
						loadIndex();
					}
					$('#noja_index').show(100);
				}
				else if($(this).width()-e.clientX<10) {
					$('#noja_pages').show(100);
				}else {
					$('#noja_menu').hide(100);
					$('#noja_pages').hide(100);
					$('#noja_index').hide(100);
				}
			})
			.bind('click', function(e) {
				if(isPopup()) {
					closePopup();
					return;
				}
				if((e.clientX < $('#noja_main').width()/2)!==yokogaki) loadNext();
				else loadPrev();
			});
			$('#noja_main').get(0).addEventListener("mousewheel" , function(e) {
				var delta = e.wheelDelta / 40;
				if(isPopup()) {
					if($('#noja_hyouka').css('display')!='none'&&delta<0&&currentSection===generalAllNo&&page>=(total+total%2-2)) return;
					closePopup();
					return;
				}
				if(delta<0) loadNext();
				else loadPrev();
			});
			$('#noja_main').get(0).addEventListener("DOMMouseScroll" , function(e) {
				if(isPopup()) {
					if($('#noja_hyouka').css('display')!='none'&&delta<0&&currentSection===generalAllNo&&page>=(total-total%2)) return;
					closePopup();
					return;
				}
				var delta = -e.detail;
				if(delta<0) loadNext();
				else loadPrev();
			});
			var joutai = null;
			$(window).bind('resize', onResize).bind('keydown', function(e) {
				var VK_R = 82;
				var VK_S = 83;
				if(isOpen&&e.ctrlKey&&e.which===VK_S)  { nojaSave(); e.preventDefault(); return; }
				if(isOpen&&e.ctrlKey&&e.which===VK_R)  { nojaRestore(ncode); e.preventDefault(); return; }
				var VK_ESC = 27;
				if(isPopup()) {
					if(e.which === VK_ESC) {
						closePopup();
						e.preventDefault();
					}
					return;
				}
				if(!isOpen) { if(e.which === VK_ESC) nojaOpen(); return; }
				var VK_PAGEUP= 33;
				var VK_PAGEDOWN= 34;
				var VK_END= 35;
				var VK_HOME= 36;
				var VK_LEFT = 37;
				var VK_UP= 38;
				var VK_RIGHT= 39;
				var VK_DOWN= 40;
				var VK_SPACE = 32;
				switch(e.which) {
				case VK_LEFT: yokogaki?loadPrev():loadNext(); break;
				case VK_RIGHT: yokogaki?loadNext():loadPrev(); break;
				case VK_UP: jumpTo(currentSection-1, 0); break;
				case VK_DOWN: jumpTo(currentSection+1, 0); break;
				case VK_PAGEUP: case VK_HOME: jumpTo(currentSection, 0); break;
				case VK_PAGEDOWN: case VK_END: jumpTo(currentSection, -1); break;
				case VK_ESC: nojaClose(); break;
				case VK_SPACE:
					if(setting.fMaegaki&&setting.fAtogaki) {
						$('#noja_maegaki').prop('checked', setting.fMaegaki = false);
						$('#noja_atogaki').prop('checked', setting.fAtogaki = false);
					}
					else if(joutai) {
						$('#noja_maegaki').prop('checked', setting.fMaegaki = joutai.m);
						$('#noja_atogaki').prop('checked', setting.fAtogaki = joutai.a);
						joutai = null;
					}
					else {
						if(setting.fMaegaki!==setting.fAtogaki) joutai = {m:setting.fMaegaki, a:setting.fAtogaki};
						$('#noja_maegaki').prop('checked', setting.fMaegaki = true);
						$('#noja_atogaki').prop('checked', setting.fAtogaki = true);
					}
					jumpTo(-1, 0);
					save('ncode', setting);
					showStatusMessage('前書き表示：'+(setting.fMaegaki?'ON':'OFF')+'　後書き表示：'+(setting.fAtogaki?'ON':'OFF'));
					break;
				default: return;
				}
				e.preventDefault();
			});
			$('#noja_maegaki').bind('click', function() {
				joutai = null;
				setting.fMaegaki = $(this).prop('checked');
				save('ncode', setting);
				if(maegaki!=null) {
					if(setting.fMaegaki) jumpTo(-1, page+maegaki[0].length);
					else jumpTo(-1, Math.max(0, page-maegaki[0].length));
				}
			});
			$('#noja_atogaki').bind('click', function() {
				joutai = null;
				setting.fAtogaki = $(this).prop('checked');
				save('ncode', setting);
				if(atogaki!=null) {
					if(!setting.fAtogaki) {
						var len = honbun[0].length;
						var p = page;
						if(setting.fMaegaki&&maegaki!=null) len+=maegaki[0].length;
						if(p>=len) p=len-1;
						jumpTo(-1, p);
					}
					else jumpTo(-1, page);
				}
			});
			$('#noja_layout').bind('click', function() {
				layout = $(this).prop('checked');
				save('global', layout, 'layout');
				for(var i = 0; i < sections.length; ++i) {
					if(i in sections&&sections[i]!==false) {
						if(sections[i]._maegaki!=null) sections[i].maegaki=splitPageEx(sections[i]._maegaki, line_num, char_num, 2);
						if(sections[i]._atogaki!=null) sections[i].atogaki=splitPageEx(sections[i]._atogaki, line_num, char_num, 2);
					}
				}
				jumpTo(-1, page);
			});

			$('#noja_mincho').bind('click', function() {
				fontType = 'mincho';
				save('global', 'mincho', 'fontType');
				fontFamilly = mincho;
				context.font=fontWeight+' '+char_size+'px '+fontFamilly;
				showPage();
			});
			$('#noja_gothic').bind('click', function() {
				fontType = 'gothic';
				save('global', 'gothic', 'fontType');
				fontFamilly = gothic;
				context.font=fontWeight+' '+char_size+'px '+fontFamilly;
				showPage();
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
				if(yokogaki) {
					char_num = Math.floor(14*Math.pow(2, (200-slidePos)/100));
					line_num = Math.floor(24.5*char_num/29);
				}
				else {
					char_num = Math.floor(20*Math.pow(2, (200-slidePos)/100));
					line_num = Math.floor(17*char_num/40);
				}
				reMake();
				onResize();
				jumpTo(-1, 0);
				save('global', yokogaki, 'yokogaki');
			});
			var dragging = false;
			var span;
			$('#noja_drag').bind('mousedown', function(e){
				dragging = true;
				span = e.clientX-$('#noja_drag').offset().left-5;
			});
			$(document).bind('mouseup', function(){
				if (dragging) {
					dragging = false;
					slidePos = $('#noja_drag').offset().left+4-$('#noja_dragback').offset().left;
					if(yokogaki) {
						char_num = Math.floor(14*Math.pow(2, (200-slidePos)/100));
						line_num = Math.floor(24.5*char_num/29);
					}
					else {
						char_num = Math.floor(20*Math.pow(2, (200-slidePos)/100));
						line_num = Math.floor(17*char_num/40);
					}
					save('global', slidePos, 'slidePos');
					for(var i = 1; i < sections.length; ++i) {
						if(i in sections&&sections[i]!==false) {
							if(sections[i]._maegaki!=null) sections[i].maegaki=splitPageEx(sections[i]._maegaki, line_num, char_num, 2);
							if(sections[i]._atogaki!=null) sections[i].atogaki=splitPageEx(sections[i]._atogaki, line_num, char_num, 2);
							sections[i].honbun=splitPage(sections[i]._honbun, line_num, char_num);
						}
					}
					onResize();
					jumpTo(-1, 0);
				}
			});
			$(document).bind('mousemove', function(e){
				if(dragging){
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
					var char_num;
					var line_num;
					if(yokogaki) {
						char_num = Math.floor(14*Math.pow(2, (200-value)/100));
						line_num = Math.floor(24.5*char_num/29);
					}
					else {
						char_num = Math.floor(20*Math.pow(2, (200-value)/100));
						line_num = Math.floor(17*char_num/40);
					}
					var char_size;
					if(yokogaki) char_size = size.width/((char_num+6)*2);
					else char_size = size.height/(char_num+8);
					$('#noja_charsize').get(0).width = char_size*8;
					$('#noja_charsize').get(0).height = char_size*2;
					$('#noja_charsize').css({width:char_size*4, height:char_size});
					var context2 = $('#noja_charsize').get(0).getContext('2d');
					context2.font=fontWeight+' '+char_size+'px '+fontFamilly;
					context2.fillStyle = '#FFFFFF';
					context2.fillRect(0, 0, char_size*8, char_size*2);
					context2.fillStyle = '#000000';
					context2.fillText('あア漢Ａ１', char_size, char_size*1.5);
					$('#noja_char_line').text((char_size/2).toFixed(2)+'px, '+char_num+'文字/行, '+line_num+'行/ページ');
				}
			});
			$('#noja_index > a').bind('click', loadIndex);
			$('#noja_openconfig').bind('click', function() {
				togglePopup('#noja_config');
				var left = $('#noja_openconfig').offset().left;
				var width = $('#noja_config').width();
				var max = $('#noja_main').width();
				if(left+width+22>max) left = max-width-22;
				$('#noja_config').css({left:left, top:$('#noja_menu').height()});
			});
			$('#noja_openconfig2').bind('click', function() {
				togglePopup('#noja_config2');
				var left = $('#noja_openconfig2').offset().left;
				var width = $('#noja_config2').width();
				var max = $('#noja_main').width();
				if(left+width+22>max) left = max-width-22;
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
				if(left+width+22>max) left = max-width-22;
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
				for(var i = 1; i < sections.length; ++i) {
					if(i in sections) $('#noja_dv_main').append($('<a>').attr({href:URL.createObjectURL(createSaveData(i, i)), download:title+' - '+i+' - '+sections[i].subtitle+'.noja.html'}).html(''+i+'. '+sections[i].subtitle)).append('<br>');
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
			if(noja_option.appmode) {
				$('#noja_link')
					.empty()
					.append(
						$('<div style="text-align:right; border-bottom-width:1px; border-bottom-style:solid;"><a id="noja_closelink">[閉じる]</a></div>')
						.bind('click', function() { $('#noja_link').hide(); })
					);
				$('#noja_import_container').html('<h4>読み込み</h4><div id="noja_file_back"><input id="noja_file" type="file" value="" accept="text/html, application/zip" multiple="true" ></div><br /><br /><a id="noja_yomikomi">保存・読み込み機能について</a>');
				$('#noja_saveload_container').append('<br /><a id="noja_booklist">保存した小説リスト</a>');
				$('#noja_version').append('<br /><br /><a id="noja_kokuhaku">関係のない話</a>');
				$('#noja_booklist').bind('click', function(){
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
							for(var i = 0; i < buf.length; ++i) list+='<div id="noja_book_container_'+buf[i][0]+'"><a id="noja_book_delete_'+buf[i][0]+'" class="noja_book_delete">削除</a> <a id="noja_book_'+buf[i][0]+'" class="noja_book">'+buf[i][1]+'</a>　作者：'+buf[i][2]+'</div>';
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
				var fn5 = function() {
					if(loading) setTimeout(fn5, 100);
					else {
						var files = $('#noja_file').prop('files');
						if(!files.length) return;
						var _ncode = ncode;
						var fn = function(i, callback) {
							if(i>=files.length) { callback(); return; }
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
						$('#noja_status').html('<img src="'+loading1+'">読み込み中...').show(100);
						fn(0, function(){
							showStatusMessage('(｀・ω・´)読み込み終了！');
							if(ncode===_ncode) showPage();
							else {
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
					nojaImport(lsc(noja_option.app_yomikomi_setumei), function(){ jumpTo(currentSection==1?-1:1, 0); });
				});
				$("#noja_kokuhaku").bind('click', function(){
					nojaImport(lsc(noja_option.app_kokuhaku), function(){ jumpTo(currentSection==1?-1:1, 0); });
				});
				nojaImport(lsc(noja_option.app_setumei), function(){ fn4(); });
			}
			else fn4();
		}

		var fn4 = function(){
			updateNavigation();
			$('#noja_hyouka .novel_hyouka form').attr('action', site2+'novelpoint/register/ncode/'+ncode2+'/');
			$('#noja_hyouka .novel_hyouka .agree').html('<input type="hidden" value="'+(
				login?(token+'" name="token" /><input type="submit" class="button" value="評価する" id="pointinput" />'):
				('" name="token" />※評価するにはログインしてください。')));
			if(!noja_option.appmode&&site.indexOf('http://novel18.syosetu.com/')==0) {
				$('#noja_impression_usertype').html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
				$('#noja_novelreview_usertype').html('<select name="usertype"><option value="xuser">Xアカウントで書き込み</option><option value="">通常アカウントで書き込み</option></select>');
			}
			var i = 0;
			$('#noja_hyouka .RadioboxBigOrb a').each(function(){
				var ii = (i++)%5+1;
				var fn = function() {
					$('#noja_hyouka .RadioboxBigOrb a[name="'+$(this).attr('name')+'"]').removeClass('RadioboxCheckedBigOrb').addClass('RadioboxUncheckedBigOrb');
					$(this).addClass('RadioboxCheckedBigOrb').removeClass('RadioboxUncheckedBigOrb');
					$('#noja_'+$(this).attr('name')+ii).prop('checked', true);
				};
				$(this).bind('click', fn).bind('press', fn);
			});
			$('#noja_f_cr form').attr('action', site2+'impression/confirm/ncode/'+ncode2+'/');
			$('#noja_r_fc form').attr('action', site2+'novelreview/confirm/ncode/'+ncode2+'/');
			$('#noja_f_cr form > div:eq(0) > a:eq(0)').attr('href', site2+'impression/list/ncode/'+ncode2+'/');
			$('#noja_r_fc form > div:eq(0) > a:eq(0)').attr('href', site2+'novelreview/list/ncode/'+ncode2+'/');
			if(login) {
				$('#noja_f_cr > form').append('<input type="submit" class="button" value="感想を書く" id="impressionconfirm">');
				$('#noja_r_fc > form').append('<input type="submit" class="button" value="レビュー追加" id="reviewinput">');
			}
			else {
				$('#noja_f_cr > form > div > div:eq(0)').before('※感想を書く場合は<a href="http://syosetu.com/login/input/" style="color:#0033cc;">ログイン</a>してください。<br>');
				$('#noja_r_fc > form > div > div:eq(0)').before('※レビューを書く場合は<a href="http://syosetu.com/login/input/" style="color:#0033cc;">ログイン</a>してください。<br>');
			}
			$('#noja_hyouka .hyouka_in:eq(1) > a')
				.attr('href', 'http://twitter.com/intent/tweet?text='+encodeURIComponent(site+ncode+'/\n「'+title+'」読んだ！\n#narou #narou'+ncode.toUpperCase()))
				.find('img').attr('src', twitter_banner);
			onResize();
			if(setting.autoRestore) {
				nojaRestore(ncode, false, function(){
					if(setting.autoSave) nojaSave(false);
					if(alwaysOpen) $('#noja_container').ready(nojaOpen());
				});
			}
			else {
				if(setting.autoSave) nojaSave(false);
				if(alwaysOpen) $('#noja_container').ready(nojaOpen());
			}
		};

		(function(ls) {
		if(ls) {
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
			for(var i in buf1) save('global', buf1[i], i);
			for(var i in buf2) save('ncode', buf2[i]);
			for(var i = 0; i < buf3.length; ++i) ls.removeItem(buf3[i]);
		}})(noja_option.localStorage);
		var i = 6;
		load('global', 'fontType', function(result){
			fontType = result !=='gothic'?'mincho':'gothic';
			if(fontType==='gothic') fontFamilly = gothic;
			if(--i==0) fn1();
		});
		load('global', 'alwaysOpen', function(result){
			if(noja_option.appmode) alwaysOpen = result !== false;
			else alwaysOpen = result === true;
			if(--i==0) fn1();
		});
		load('global', 'allpage', function(result){
			allpage = result === true;
			if(--i==0) fn1();
		});
		load('global', 'yokogaki', function(result){
			yokogaki = result === true;
			if(--i==0) fn1();
		});
		load('global', 'layout', function(result){
			layout = result === true;
			if(--i==0) fn1();
		});
		load('global', 'slidePos', function(result){
			slidePos = result;
			if(!valid( slidePos )) slidePos = 100;
			else slidePos = slidePos;
			if(--i==0) fn1();
		});

	}

	//最後に初期化して終了。
	initialize();
});
