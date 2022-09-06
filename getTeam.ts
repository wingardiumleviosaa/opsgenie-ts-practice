async function getTeam(teamName: string, memberList: string[]): Promise<any>{
    const response = await fetch('https://api.opsgenie.com/v2/teams', {
        method: 'get',
        headers: {'Authorization': `GenieKey xxx`},
    }).then((response) => {
        if(response.ok){
            return response.json();
        }else{
            return Promise.reject(response);
        }
    })
    .then(data=>{
        console.log(data)
    })
    .catch( e => {
        console.warn(e);
    })

}