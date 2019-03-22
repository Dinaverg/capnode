'use strict'

function signup() {
    $('.signup').submit(event => {
        event.preventDefault()
        let first = $('#first').val()
        let last = $('#last').val()
        let user = $('#newuser').val()
        let email = $('#email').val() 
        let pass = $('#newpass').val();
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
        .then(response => {
            if (response.ok) {
                return response.json()
            } else if (response.status == 422) {
                return validationError(response)
            } 
            throw new Error(response.statusText)
        })
        .then(data => signupSuccess())
        .catch(err => console.error(err))
    });
}

function validationError(obj) {
    makeToast(obj.status)
    console.log(obj)
}

function signupSuccess() {
    $('.signup').css('display', 'none')
    $('.login').css('display', 'inline-block')
    $('footer').html('<p><a href="">Sign up instead</a></p>')
}

function showLogin() {
    $('#already').click(event => {
        event.preventDefault()
        $('.signup').css('display', 'none')
        $('.login').css('display', 'inline-block')
        $('footer').html('<p><a href="">Sign up instead</a></p>')
    })
}

function login() {
    $('.login').submit(event => {
        event.preventDefault()
        let user = $('#user').val()
        let pass = $('#pass').val()

        fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user,
                password: pass
            })
        })
        .then(function(response) {
            if (response.status == 401) {
                validationError(response)
            } else if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        })
        .then(data => authorized(data))
        .catch(err => console.error(err))
    })
}

function authorized(data) {
    console.log(data.authToken)
    window.location.replace(`/search/search.html`)
}

function makeToast(data) {
    $('.toaster').empty()
    $('.toaster').append(`<div id="toast">${data}</div>`)
    launch_toast()
}

function launch_toast() {
    var x = document.getElementById("toast")
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

$(function() {
    signup()
    showLogin()
    login()
})