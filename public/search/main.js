function searchPOI() {
    $('form').submit(event => {
        event.preventDefault()
        let query = $("#input").val()
        //let url = `https://desolate-gorge-89847.herokuapp.com/search?location=${query}`
        console.log(query)
        let start = 0
        let cookies = document.cookie.split('=')
        let jwt = cookies[1]
        let options = {headers: {'Authorization': `Bearer ${jwt}`}}
        fetch(`/search?location=${query}`, options)
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
        sum += `<p class="col-3"><a href=${arr[i].url}>${arr[i].name}</a><br>${arr[i].cuisines}</p>`
    }
    $(".results").append(sum)
    //$("footer").css("display", "inline-block")
}

/* function nextPage() {
    let i = 1
    $("footer").click(event => {
        fetch(`/nextPage?page=${i}`)
        .then(response => response.json())
        .then(responseJson => renderResponse(responseJson))
        .catch(err => console.error(err))
        i++
    })
} */

$(searchPOI)
//$(nextPage)