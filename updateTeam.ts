import * as https from 'https';
import fetch from 'node-fetch';

const members = ['123@abc.com', '456@abc.com','789@abc.com'];
const team = 'wicopTest'
const opsgenieKey = 'xxx'

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

// updata team 會順便做 delete user, 在裡面比較缺少的, 並加以刪除 user account

async function updateTeam(teamName: string, memberList: string[]): Promise<any>{
    // update team all schedule's all rotation first
    await updateScedule(teamName, memberList)
    
    try{
        const teamRes = await fetch(`https://api.opsgenie.com/v2/teams/${teamName}?identifierType=name`, {
            method: 'get',
            headers: {'Authorization': `GenieKey ${opsgenieKey}`},
            agent: httpsAgent,
        })
    
        const teamInfo = await teamRes.json()
        const oldMem = []

        // get old members list in team
        for(const i in Object(Object(teamInfo).data).members){
            oldMem.push(Object(Object(Object(Object(teamInfo).data).members[i]).user).username)
        }
        // get memeber to delete
        let memRmv = oldMem.filter(function(i){
            return !memberList.some(function(j) {
                return i == j
            })
        })
        for(const i in memRmv){
            await deleteUser(memRmv[i])
        }

        let memArr = []
        for(const i in memberList){
            let obj = {
                user: {
                    username: memberList[i]
                },
                role: "admin"
            }
            memArr.push(obj)
        }
    
        let createBody = {
            members: memArr
        }

        // update team memeber
        const response = await fetch(`https://api.opsgenie.com/v2/teams/${Object(Object(teamInfo).data).id}`, {
            method: 'patch',
            headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(createBody),
            agent: httpsAgent,
        }).then( response => {
            if(response.ok){
                return response.json();
            }else{
                return Promise.reject(response);
            }
        }).then( data => {
            console.log(`成功更新 Opsgenie Team ${teamName}`, data);
        })
    }catch(e){
        console.warn('更新 Team 發生錯誤', e)
    }
}

async function updateScedule(teamName: string, memberList: string[]): Promise<void>{
    try{
        const teamScdRotaList = await getTeamScheduleRota(teamName)

        const participantsArr = []
        for(const i in memberList){
            let obj = {
                type: 'user',
                username: memberList[i]
            }
            participantsArr.push(obj)
        }
    
        let createBody = {
            participants: participantsArr
        }
    
        for(const i in teamScdRotaList){
            for(const j in Object(teamScdRotaList[i]).rotationList){
                const response = await fetch(`https://api.opsgenie.com/v2/schedules/${Object(teamScdRotaList[i]).scheduleId}/rotations/${Object(teamScdRotaList[i]).rotationList[j]}`, {
                    method: 'patch',
                    headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
                    body: JSON.stringify(createBody),
                    agent: httpsAgent,
                })
                const resBody = await response.json()
                console.log('更新 schedule 成功', resBody)
            }
        }
    }catch(e){
        console.log('更新 schedule 失敗', e)
    }
}

async function getTeamScheduleRota(teamName: string): Promise<object[]>{
    const teamScdRotaList = []
    const schedules = await fetch('https://api.opsgenie.com/v2/schedules', {
        method: 'get',
        headers: {'Authorization': `GenieKey ${opsgenieKey}`},
        agent: httpsAgent,
    })
    let allScdData = await schedules.json();

    // console.log(Object(data).data)
    
    for(const i in Object(allScdData).data){
        // console.log(Object(data).data[i])
        if(Object(Object(allScdData).data[i].ownerTeam).name === teamName) {
            // scheduleId.push(Object(data).data[i].id)
            const eachSchdule = await fetch(`https://api.opsgenie.com/v2/schedules/${Object(allScdData).data[i].id}`, {
                method: 'get',
                headers: {'Authorization': `GenieKey ${opsgenieKey}`},
                agent: httpsAgent,
            })
            let allRotaData = await eachSchdule.json()
            let rotaList = []
            for(const j in Object(Object(allRotaData).data).rotations){
                rotaList.push(Object(Object(Object(allRotaData).data).rotations[j]).id)
            }
            teamScdRotaList.push({
                scheduleId: Object(allScdData).data[i].id,
                rotationList: rotaList
            })
        }
    }
    return teamScdRotaList
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

updateTeam(team, members)