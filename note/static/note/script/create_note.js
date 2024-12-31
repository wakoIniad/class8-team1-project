const buttonElm = document.getElementById("submit");
const inputElm = document.getElementById("note_name");

function onclick(e) {
    e.preventDefault();
    const note_name = inputElm.value;

    function callback(result) {
        const id = result['assigned_id'];

        function callback(result) {
            const noteList = getCookie('note_list')||'[]';
            setCookie('note_list',JSON.stringify([...JSON.parse(noteList), id]));
            window.open(result['short_url'], '_blank');
        }
        callNoteApi({
            'url': makeApiUrl('share/SYSTEM/'),
            'method': 'PUT',
            'data': {
                'target': id
            },
            'callback': callback
        })
    }

    callNoteApi({
        'url': makeApiUrl('note/SYSTEM/'),
        'method': 'PUT',
        'data': {
            'name': note_name
        },
        'callback': callback
    });
    
}

buttonElm.onclick = onclick;