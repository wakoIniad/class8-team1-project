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
    const config = {
        method: method,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-CSRFToken': getCsrfToken(),
        },
    };
    if(method !== 'GET') {
        config.body = JSON.stringify(data)
    }
    const result = fetch(url, config);

    result
    .then(res=>res.json())
    .catch(console.error)
    .then(callback)
    .catch(console.error)
    console.log(url,'に',method,'リクエストを送りました');
    return await result;
}