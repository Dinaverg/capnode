function showFeed() {
    let options = {headers: {'Authorization': `Bearer ${jwt}`}}
    fetch('/users/feed', options)
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
    .then(responseJson => renderFeed(responseJson))
    .catch(error => console.log(error))
}



$(function() {
    showFeed()
})