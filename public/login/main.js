'use strict'

function signup() {
    $('.signup').submit(event => {
        event.preventDefault()
        let first = $('#first').val()
        let last = $('#last').val()
        let user = $('#newuser').val()
        let email = $('#email').val() 
        let pass = $('#newpass').val();
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
        .then(data => showLogin())
        .catch(err => console.error(err))
    });
}

function showLogin() {
    $('#already').click(event => {
        event.preventDefault()
        $('.signup').css('display', 'none')
        $('.login').css('display', 'inline-block')
        $('footer').empty()
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
            if (!response.ok) {
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



$(function() {
    signup()
    showLogin()
    login()
})