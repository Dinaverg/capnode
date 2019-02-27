function searchPOI() {
    $('form').submit(event => {
        event.preventDefault()
        let query = $("#input").val()
        //let url = `https://desolate-gorge-89847.herokuapp.com/search?location=${query}`
        console.log(query)
        fetch(`/search?location=${query}`)
        .then(response => {
            if (response.ok) {
                return response.json()
            }
            throw new Error(response.statusText)
        })
        .then(responseJson => renderResponse(responseJson))
        .catch(error => console.log(error))
    })
}

function renderResponse(arr) {
    $(".results").empty()
    console.log(arr);
    let sum = ``
    for (let i=0; i < arr.length; i++) {
        sum += `<p><a href=${arr[i].url}>${arr[i].name}</a><br>${arr[i].cuisines}</p>`
    }
    $(".results").append(sum)
}

$(searchPOI)