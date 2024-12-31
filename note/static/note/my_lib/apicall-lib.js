//import { getCsrfToken } from "./csrf-lib";

function getTopUrl() {
    return window.location.origin + '/';
}
function makeApiUrl(apiPath) {
    // window.location.originでトップページを取得してます
    const BASE_URL = getTopUrl() + 'api/';
    return BASE_URL + apiPath;
}

async function callNoteApi({url,method='GET', data={}, callback=()=>{}} ) {
    const result = fetch(url, {
        method: method,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-CSRFToken': getCsrfToken(),
        },
    })

    result
    .then(res=>res.json())
    .catch(console.error)
    .then(callback)
    .catch(console.error)
    
    console.log(url,'に',method,'リクエストを送りました');

    return await result;
}