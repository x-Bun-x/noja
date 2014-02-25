noja_option.appmode=true,
noja_option.app_setumei='../../resource/html/setumei.noja.html';
noja_option.app_yomikomi_setumei='../../resource/html/yomikomi_setumei.noja.html';
noja_option.app_kokuhaku='../../resource/html/kokuhaku.noja.html';
noja_option.loadSubContent = function(url){ return $.ajax({url:url, async:false}).responseText; };
