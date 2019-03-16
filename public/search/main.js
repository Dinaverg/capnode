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
    console.log(arr);
    let sum = ``
    for (let i=0; i < arr.length; i++) {
        sum += `<div class="collapsible-container col-3"><p class="collapsible"><span class="id">${arr[i].id}</span><span class="name">${arr[i].name}</span><br><span class="cuisines">${arr[i].cuisines}</span></p>
        <div class="content"><p><span class="address">${arr[i].address}</span><br><span class="rating">${arr[i].user_rating}</span><br>
        <span class="save been">I've been here</span><br><span class="save togo">I want to go here</save></p></div></div>`
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

function save() {
    $(".results").on("click", ".save", function() {
        let options = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({
                id: $(this).parent().parent().parent().find(".id").text(),
                name: $(this).parent().parent().parent().find(".name").text(),
                cuisines: $(this).parent().parent().parent().find(".cuisines").text(),
                address: $(this).parent().parent().parent().find(".address").text(),
                rating: $(this).parent().parent().parent().find(".rating").text()
            })
        }
        let been = true
        if ($(this).hasClass("been")) {
            console.log("foo")
        } else {
            console.log("bar")
            been = false
        }
        fetch(`/users/save?been=${been}`, options)
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
        .then(results => console.log(results))
        .catch(err => console.error(err))
    })
}

function collapsible() {
    $(".results").on("click", ".collapsible", function() {
        $(".active").removeClass("active")
        $(this).parent().toggleClass("active"); 
    });
}

$(function() {
    searchPOI()
    save()
    collapsible()
})