仮想環境を有効にしたうえで下の２つをお願いします

・データベースを変更したので、マイグレーションしてください。
```
python manage.py makemigrations
python manage.py migrate
```

・ライブラリのインストール
```
pip install requests
```


・APIの構造を決めました
    : API用のURLに(必要な場合はデータを添えて)リクエストを送ると、辞書形式のデータが返ってきます。

    ・リクエスト先のURLについて
        noteに関するAPI
        /api/note/<note_id or "SYSTEM">/
        
        shareAPI: ノートのシェア用の自由にカスタマイズできるURLを作成するAPIです
        /api/share/<url_id or "SYSTEM">/
        ```
        | 取得,削除,更新など既に存在するものに対する操作には、<urlのid>や<noteのid>を入れます。
        |
        | 作成時は、まだデータベース上になくidがないため代わりに、SYSTEM を入れます。
        ```


    ・リクエストメソッドの指定について
        作成する場合:  `PUT`

        更新する場合: `POST`

        削除する場合: `DELETE`

        情報を取得する場合: `GET`

    ・返信データの形式について
        - 作成系API (PUT) 、
            note(PUT): `{ 'assigned_id': 生成されたID }`
            shareAPI(PUT): `{ 'assigned_id': 生成されたID, 'short_url': URL }`
            ```assigned_idを保存すれば、次回から情報の変更に使えます```

        - 更新(POST), 削除(DELETE)は、それが成功したかどうかが書かれている辞書が返されます。

        - 取得(GET)は、下記の表の情報が返されます。
            note
            ``` 
{
    "id": self.id,
    "updated_at": self.updated_at,
    "created_at": self.created_at,
    "name": self.name,
}
            ```
    
            share
            ```
{
    "target": ノートのID,
    "path": share用のid,
    "dumped": 現在、使用を取りやめているかどうか,
    "short_url": url
}
            ```

    ・APIリクエスト時に送信する情報について
        GET: なし (URLだけ)
        DELETE: なし (URLだけ)
        PUT: 
```
note -> { name: 'なまえ' }
share -> { target: '転送先のノートのID' }
```
        POST:
            ```
note, share 共通 -> {
    #更新したい値の名前を入れる
    update_keys: ['target', 'dumped' ...] 
    #update_keysと対応するように更新後の値を入れる
    update_values: ['note-1111', true, ...] 
}
    ```

ーーーーーーーーーーーーーーーーーーーー
    ・API呼び出しライブラリの使い方(例)
        ```
        function myCallback(result) {
            console.log(result)
        }
        callNoteApi({

            // methodは上で説明してます
            'method': 'PUT',

            //PUTで新しく作るので SYSTEM/ にする
            //makeApiUrlで note/SYSTEM/ より前の部分は作ってくれる
            'url': makeApiUrl('note/SYSTEM/'), 

            'data': {
                'name': 'my_note_01'
            },

            //下で説明します
            'callback': myCallback,
        })
        ```

    ・非同期処理
        APIリクエストを出すと当然、応答が返ってくるまでに時間がかかります
        JavaScriptは1度に１つの処理しかできないので、これを待っていると実行が遅くなる
        ⇒時間がかかる処理 は、Promiseという処理が終わった後から値を見れるものを返します

        ここら辺がめんどくさいかもしれないので、このライブラリではcallback関数を指定するだけで値が見れるようにしています

        callback関数: 処理内で実行してもらうために関数に渡す関数
        callback関数はそういう目的で作られる関数の総称なので、実際に作る関数の名前はなんでもいいです。
        今回の処理では、callback関数は、API呼び出しの結果を引数に入れたうえで実行されます。

        ちなみに、本来はthenとかawaitを使います。
        callback関数を指定せずにthenとかawaitでやることもできるので、余裕があったらやってみてください。
        例:
            
            callNoteApi({
                ....
            }).then(callback)
            
            (async(){
                const result = await callNoteApi({
                    ...
                })
            })()
            



API呼び出しとCookie操作用のライブラリを作りました。
今あるページには全部読み込んであります。

必要な場合は↓で読み込み
```
<script src="{% static 'note/lib/apicall-lib.js' %}"></script>
<script src="{% static 'note/lib/cookie-lib.js' %}"></script>
<script src="{% static 'note/lib/csrf-lib.js' %}"></script>
```
使い方
API呼び出し
```

```


・各ページに　`{% csrf_token %}`　を追加してあります。
これは、API使用時の認証に使うものです。