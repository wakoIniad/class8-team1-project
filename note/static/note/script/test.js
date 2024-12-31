const buttonElement = document.getElementById("submit");
const inputTextElement = document.getElementById("name");

function Submit_button_was_clicked(e) {
    e.preventDefault();
    const inputted_name_by_user = inputTextElement.value;

    function callback(result) {
        const id = result['assigned_id'];

        function callback(result) {
            alert(result['short_url']);
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
            'name': inputted_name_by_user
        },
        'callback': callback
    });
    
}

buttonElement.onclick = Submit_button_was_clicked;