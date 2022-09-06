import * as https from 'https';
import fetch from 'node-fetch';

const members = ['123@abc.com', '456@abc.com'];
const team = 'wicopTest'
const opsgenieKey = 'xxx'

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});


async function deleteTeam(teamName: string, memberList: string[]): Promise<void>{
    try{
        const response = await fetch(`https://api.opsgenie.com/v2/teams/${teamName}?identifierType=name`, {
            method: 'delete',
            headers: {'Authorization': `GenieKey ${opsgenieKey}`},
            agent: httpsAgent,
        })
        const resBody = await response.json()
        console.log(`刪除 team ${teamName}`, resBody)
    }catch(e){
        console.log(`刪除 team ${teamName} 失敗`, e)
    }

    for(const i in memberList){
        await deleteUser(memberList[i])
    }

}

async function deleteUser(user: string): Promise<void>{
    try{
        const response = await fetch(`https://api.opsgenie.com/v2/users/${user}`, {
            method: 'delete',
            headers: {'Authorization': `GenieKey ${opsgenieKey}`},
            agent: httpsAgent,
        })
        const resBody = await response.json()
        console.log(`刪除 user ${user}`, resBody)
    }catch(e){
        console.log(`刪除 user ${user} 失敗`, e)
    }
}

deleteTeam(team, members)