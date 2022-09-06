import * as https from 'https';
import fetch from 'node-fetch';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

const opsgenieKey = 'xxx'

async function createSchedule(teamName: string, participantsArr: any[]) {
    const createBody = {
        name: `${teamName} Schedule`,
        description: `${teamName}'s default schedule`,
        timezone: 'Asia/Taipei',
        enabled: true,
        ownerTeam: {
            name: teamName
        },
        rotations: [
            {
                name: `${teamName} Rotation`,
                startDate: '2022-01-01T00:00:00Z',
                type: 'daily',
                length: 1,
                participants: participantsArr,
            }
        ]
    }

    const response = await fetch('https://api.opsgenie.com/v2/schedules', {
        method: 'post',
        body: JSON.stringify(createBody),
        headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
        agent: httpsAgent,
    }).then((response) => {
        if(response.ok){
            console.log(`成功建立 schedule`);
            return response.json();
        }else{
            return Promise.reject(response);
        }
    }).then( data => {
        console.log(data)
    }).catch( e => {
        console.warn('schedule 已存在或發生錯誤', e)
    })
    
}

async function createEscalation(teamName: string) {
    const createBody = {
        name : `${teamName} Escalation`,
        rules : [
            {
                delay: {
                    timeAmount : 1
                },
                recipient:{
                    type : 'schedule',
                    name: `${teamName} Schedule`
                },
                notifyType : 'default',
                condition: 'if-not-acked'
            }
        ],
        ownerTeam : {
            name: teamName
        },
        repeat: {
          waitInterval: 10,
          count: 1,
          resetRecipientStates: true,
          closeAlertAfterAll: false
        }
    }

    const response = await fetch('https://api.opsgenie.com/v2/escalations', {
        method: 'post',
        body: JSON.stringify(createBody),
        headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
        agent: httpsAgent,
    }).then((response) => {
        if(response.ok){
            console.log(`成功建立 escalation`);
            return response.json();
        }else{
            return Promise.reject(response);
        }
    }).then( data => {
        console.log(data)
    }).catch( e => {
        console.warn('escalation 已存在或發生錯誤', e)
    })
    
}


async function createRoutingRule(teamName: string) {
    const createBody = {
        name: `${teamName} Routing Rule`,
        order: 0,
        timezone: 'Asia/Taipei',
        criteria: {
            type: 'match-any-condition',
            conditions: [
                {
                    field: 'extra-properties',
                    key: 'team',
                    operation: 'equals',
                    expectedValue: teamName,
                    not: false,
                }
            ]
        },
        notify: {
            name:`${teamName} Escalation`,
            type: 'escalation'
        }
    }

    const response = await fetch(`https://api.opsgenie.com/v2/teams/${teamName}/routing-rules`, {
        method: 'post',
        body: JSON.stringify(createBody),
        headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
        agent: httpsAgent,
    }).then((response) => {
        if(response.ok){
            console.log(`成功建立 Routing Rule`);
            return response.json();
        }else{
            return Promise.reject(response);
        }
    }).then( data => {
        console.log(data)
    }).catch( e => {
        console.warn('Routing Rule 已存在或發生錯誤', e)
    })
    
}