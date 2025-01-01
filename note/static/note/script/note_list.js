const noteList = JSON.parse(getCookie('note_list')||'[]');
const container = document.getElementById('container');
function createLink(noteData) {
    console.log('aaa',noteData)
    const elm = document.createElement('a');

    elm.setAttribute('href', makeNoteURL(noteData.id));
    elm.setAttribute('id', noteData.id);
    elm.classList.add('note-list-item');
    elm.textContent = noteData.name;
    
    container.appendChild(elm);
}

function makeNoteURL(id) {
    return getTopUrl()+'note/editor/'+id+'/'
}

for (const note_id of noteList) {
    callNoteApi({
        'url': makeApiUrl(`note/${note_id}/`),
        'method': 'GET',
        'callback': createLink
    })
}

console.log(noteList)