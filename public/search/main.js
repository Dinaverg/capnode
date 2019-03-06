function searchPOI() {
    $('form').submit(event => {
        event.preventDefault()
        let query = $("#input").val()
        //let url = `https://desolate-gorge-89847.herokuapp.com/search?location=${query}`
        console.log(query)
        let start = 0
        let cookies = document.cookie.split('=')
        jwt = cookies[1]
        //global
        let options = {headers: {'Authorization': `Bearer ${jwt}`}}
        fetch(`/search?location=${query}&start=${start}`, options)
        .then(response => {
            if (response.ok) {
                return response.json()
            } else if (response.status == 401) {
                renderAuthError()
            } else if (response.status == 400) {
                badRequest()
            }
            throw new Error(response.statusText)
        })
        .then(responseJson => renderResponse(responseJson))
        .catch(error => console.log(error))
        nextPage(query)
    })
}

function renderAuthError() {
    $(".results").append(`<h2>Unauthorized. Have you logged in properly? <a href="/login/login.html">Login</a><h2>`)
}

function badRequest() {
    $(".results").append(`<h3>Bad Request. For cities, use full names (e.g. New York City, not just New York), or use a zipcode instead`)
}

function renderResponse(arr) {
    $(".results").empty()
    //console.log(arr);
    let sum = ``
    for (let i=0; i < arr.length; i++) {
        sum += `<div class="collapsible-container col-3"><p class="collapsible"><span>${arr[i].name}</span>${arr[i].cuisines}</p>
        <div class="content"><p>${arr[i].address}<br>${arr[i].user_rating}</p></div></div>`
    }
    $(".results").append(sum)
    $("footer").css("display", "inline-block")
}

function nextPage(query) {
    let i = 0
    $("footer").click(event => {
        i++
        start = i * 20
        let options = {headers: {'Authorization': `Bearer ${jwt}`}}
        fetch(`/search?location=${query}&start=${start}`, options)
        .then(response => {
            if (response.ok) {
                return response.json()
            } else if (response.status == 401) {
                renderAuthError()
            } else if (response.status == 400) {
                badRequest()
            }
            throw new Error(response.statusText)
        })
        .then(responseJson => renderResponse(responseJson))
        .catch(error => console.log(error))
    })
}

function collapsible() {
    $(".results").on("click", ".collapsible", function(event) {
        $(".active").removeClass("active")
        $(this).parent().toggleClass("active"); 
    });
}

$(function() {
    searchPOI()
    collapsible()
})