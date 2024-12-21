//やりやすいようにcookieとAPI呼び出し用のライブラリを作ったので、使って

//注: 下でインポートしているものは、JavaScriptに元からあるものではないので、
//どういう操作をやってるか知りたければ、static/note/libの中に入ってるファイルを見て

import { getCookie, setCookie } from '../lib/cookie-lib.js'
import { getCsrfToken } from '../lib/csrf-lib.js'
import { makeApiUrl, callNoteApi } from '../lib/apicall-lib.js';

// 注：constはconstant(定数)の略。再代入はできない。(正確には値が変わる場合があるので定数ではない)
// let: 再代入可、再宣言不可
// var: 再代入、再宣言どっちも可
// 宣言: 下みたいに最初に変数を定義してるところ
const buttonElement = document.getElementById("submit");
const inputTextElement = document.getElementById("name");

function Submit_button_was_clicked(e) {
    // ブラウザ側が自動でやる処理をキャンセルする
    // 例: 例えば、フォームならブラウザが勝手にフォームの情報を送信してくれる
    //     preventDefaultすることでキャンセルして自分の定義した処理だけ実行されるようになる
    e.preventDefault();
    const inputted_name_by_user = inputTextElement.value;

    //urlを作る関数を作りました
    const url_for_api_calling = makeApiUrl('note');

    //下で実際にAPIを使っています
    //注: APIを呼んでから、結果が返ってくるまでに時間がかかります
    //Javascriptは同時に一つの処理しかできない言語なので、普通に実行すると
    //結果が返ってくるのを待たずに、次の行に移されます
    //そして、Promise(約束)というものが代わりに返されます。
    //Promiseしていた処理が実際には終わっていてもPromiseを解決するまで、中の値は見えません。
    //解決するには、awaitしたりthenを使ったりする方法があります。
    //awaitを使った方法はlib/instruction.jsに書きました。

    //lib/apicall-lib.jsでは、使いやすいように、thenとかawaitを使わなくても、
    //callback関数を指定すれば、そこの引数に結果が渡されるようにしました。
    //callbackの実行にはthenを使っているので、lib/apicall-lib.jsのcallNoteApiを見てみてください

    function callback(result) {
        const generatedId = result['id-generated'];
        
    }

    callNoteApi({
        'url': url_for_api_calling,
        'method': 'PUT',
        'name': inputted_name_by_user,
        'callback': callback
    });
    
}

buttonElement.onclick = Submit_button_was_clicked;