    //Javascriptは同時に一つの処理しかできない言語なので、普通に実行すると
    //結果が返ってくるのを待たずに、次の行に移されます(Promiseというものが代わりに返されます)
    //以下のようにawait <Promiseの値>とすると、待つようになります。
    
    function test() {
         var a = 'This is not Promise';
         return Promise.resolve(a); // 意味はないけどテストのためにプロマイズを出す
    }
    
    var t = test(); //プロマイズの値が入る
    await t; //ここで待ってくれる
    
    var t = await test(); //これでもOK

    //ただ、awaitを使っている文が、async関数の中に入っていないといけないです。
    //async関数はfunctionの前にasyncと書くだけで作れます。
    //ただ、asyncをつけると、今度はこの関数が返す値がPromiseに変わります。
    
    async function asyncProcess() {
         function test() {
              var a = 'This is not Promise';
              return Promise.resolve(a); // 意味はないけどテストのためにプロマイズを出す
         }
         
         var t = test(); プロマイズの値が入る
         await t; //ここで待ってくれる
         
         var t = await test(); //これでもOK
         t; //awaitすると、promiseではなくなる。
         return t
    }
    let s = asyncProcess();// 返ってくる値はpromise
     