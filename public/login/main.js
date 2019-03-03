'use strict'

function signup() {
    $('form').submit(event => {
        event.preventDefault()
        let first = $('#first').val()
        let last = $('#last').val()
        let user = $('#user').val()
        let email = $('#email').val() 
        let pass = $('#pass').val();
        console.log(user)
        fetch('/users/signup', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: first,
                lastName: last,
                username: user,
                email: email,
                password: pass
                })
            })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(err => console.error(err))
    });
}


function renderResponse(arr) {
    $(".results").empty()
    console.log(arr);
    let sum = ``
    for (let i=0; i < arr.length; i++) {
        sum += `<p class="col-3"><a href=${arr[i].url}>${arr[i].name}</a><br>${arr[i].cuisines}</p>`
    }
    $(".results").append(sum)
}

$(signup)