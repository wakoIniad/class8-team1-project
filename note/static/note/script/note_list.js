const noteList = JSON.parse(getCookie('note_list')||'[]');
const container = document.getElementById('container');
function createLink(noteData) {
    const elm = document.createElement('a');
    elm.setAttribute('href',noteData[2]);
    elm.setAttribute('id', noteData[0]);
    elm.textContent = noteData[1];
    container.appendChild(elm);
}

for (const note of noteList) {
    createLink(note);
}

console.log(noteList)