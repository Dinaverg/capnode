function signup() {
    $('form').ajaxForm(function() {
        console.log('submitted')
    })
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