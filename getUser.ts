async function getUser(): Promise<any> {
    const response = await fetch('https://api.opsgenie.com/v2/users', {
        method: 'get',
        headers: {'Authorization': 'GenieKey xxx'},
    })
    return response.json();
}