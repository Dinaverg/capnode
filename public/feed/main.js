function showProfile() {
    let cookies = document.cookie.split('=')
    let jwt = cookies[1]
    let options = {headers: {'Authorization': `Bearer ${jwt}`}}
    fetch('/users/profile', options)
    .then(response => {
        if (response.ok) {
            return response.json()
        } else if (response.status == 401) {
            renderAuthError()
        } 
        throw new Error(response.statusText)
    })
    .then(responseJson => renderProfile(responseJson))
    .catch(error => console.log(error))
}

function showFeed() {
    let cookies = document.cookie.split('=')
    let jwt = cookies[1]
    let options = {headers: {'Authorization': `Bearer ${jwt}`}}
    fetch('/users/feed', options)
    .then(response => {
        if (response.ok) {
            return response.json()
        } else if (response.status == 401) {
            renderAuthError()
        } 
        throw new Error(response.statusText)
    })
    .then(responseJson => renderFeed(responseJson))
    .catch(error => console.log(error))
}

function renderAuthError() {
    $(".results").empty()
    $(".results").append(`<h2>Unauthorized. Have you logged in properly? <a href="/login/login.html">Login</a><h2>`)
}

function renderProfile(arr) {
    arr.sort(function(a, b) {
        a = new Date(a.saved);
        b = new Date(b.saved);
        return a>b ? -1 : a<b ? 1 : 0;
    });
    let sum = ''
    for (let i = 0; i < arr.length && i < 10; i++) {
        if (arr[i].been) {
            sum += `<div class="profileEntry">You said you've been to <span class="name">${arr[i].name}</span>. <span class="delete">Delete</span></div>`
        } else {
            sum += `<div class="profileEntry">You want to go to <span class="name">${arr[i].name}</span>. <span class="update">Update</span></div>`
        }
    }
    $(".profile").append(sum)
}

function renderFeed(arr) {
    arr.sort(function(a, b) {
        a = new Date(a.saved);
        b = new Date(b.saved);
        return a>b ? -1 : a<b ? 1 : 0;
    });
    //this sort could/should happen on the server side but I'm just tired of the aggregation pipeline
    let sum = ''
    for (let i = 0; i < arr.length && i < 5; i++) {
        sum += `<div class="feedEntry">${arr[i].fullName} has been to ${arr[i].name}</div>`
    }
    if (sum != '') {
        $(".where").css("display", "block")
    }
    $(".feed").append(sum)
}

function updateRestaurant() {
    let cookies = document.cookie.split('=')
    let jwt = cookies[1]
    let options = {
        method: 'put',
        headers: {'Authorization': `Bearer ${jwt}`},
    }
    $(".profile").on('click', '.update', function() {
        let name =  $(this).parent().find('.name')
        fetch(`/users/update?name=${name}`, options)
    })
}

function deleteRestaurant() {
    let cookies = document.cookie.split('=')
    let jwt = cookies[1]
    let options = {
        method: 'delete',
        headers: {'Authorization': `Bearer ${jwt}`},
    }
    $('.profile').on('click', '.delete', function() {
        let name =  $(this).parent().find('.name').text()
        fetch(`/users/delete?name=${name}`, options)
        .then(response => response.json())
        .then(data => console.log(data))
        $(this).parent().css('display', 'none')
    })
    
    
}

$(function() {
    showFeed()
    showProfile()
    deleteRestaurant()
    updateRestaurant()
})