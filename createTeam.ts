import * as https from 'https';
import fetch from 'node-fetch';
import * as msal from '@azure/msal-node';

const members = ['123@abc.com', '456@abc.com'];
const team = 'wicopTest'
const opsgenieKey = 'xxx'

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

const msalConfig = {
    auth: {
        clientId: 'xxx',
        clientSecret: 'xxx',
        authority: 'https://login.microsoftonline.com/xxx-xxx-xxx/'
    },
};

async function getToken(): Promise<any> {
    const cca = new msal.ConfidentialClientApplication(msalConfig);
    try{
        return await cca.acquireTokenByClientCredential({
            scopes: ['https://graph.microsoft.com/.default'],
        });
    }catch(e){
        console.log(`取得 Azure Access Token 錯誤: ${e}`);
    }
}

async function addAzureOpsgenieAppRole(userPrincipalName: string): Promise<any> {

    // 駐點人員的 Principal Name 為 : xxxxxxx_abcits.com#EXT#@abc.onmicrosoft.com
    if (userPrincipalName.split('@')[1]==='abcits.com'){
        userPrincipalName = userPrincipalName.replace('@','_').concat('%23EXT%23%40abc.onmicrosoft.com')
    }

    const authResponse = await getToken();
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userPrincipalName}`, {
        method: 'get',
        headers: {'Authorization': `Bearer ${authResponse.accessToken}`},
        agent: httpsAgent
    }).then( response => {
        if(response.ok){
            return response.json();
        }else{
            return Promise.reject(response);
        }
    }).then( data => {
        const createBody = {
            principalId: data.id, 
            resourceId: 'xxx',
            appRoleId: 'xxx'
        }
        return fetch(`https://graph.microsoft.com/v1.0/users/${data.id}/appRoleAssignments`, {
            method: 'post',
            body: JSON.stringify(createBody),
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${authResponse.accessToken}`},
            agent: httpsAgent
        }).then( response => {
            if (response.ok) {
                console.log('成功新增 Azure AD Opsgenie Application User')
                return response.json();
            } else {
                return Promise.reject(response);
            }
        })
    }).catch( e => {
        console.warn('User Assignment 已存在或發生錯誤', e)
    });
}

async function userRegister(memberList: string[]): Promise<any> {
        for(const i in memberList){
            console.log(memberList[i])
            await addAzureOpsgenieAppRole(memberList[i])
            const createBody = {
                username: memberList[i],
                fullName: memberList[i].split('@')[0],
                role: {
                    name: "User"
                }
            }
            const response = await fetch('https://api.opsgenie.com/v2/users', {
                method: 'post',
                body: JSON.stringify(createBody),
                headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
                agent: httpsAgent,
            }).then( response => {
                if(response.ok){
                    return response.json();
                }else{
                    return Promise.reject(response);
                }
            }).then( data => {
                console.log('成功新增 Opsgenie User', data)
            }).catch( e => {
                console.warn('User 已存在或發生錯誤', e)
            })
        }
}


async function createTeam(teamName: string, memberList: string[]): Promise<any>{

    // 建立 user 
    await userRegister(memberList);

    let teamId = ''
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
    const createBody = {
        name: teamName,
        description: `${teamName} Description`,
        members: memArr
    }

    const response = await fetch('https://api.opsgenie.com/v2/teams', {
        method: 'post',
        body: JSON.stringify(createBody),
        headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
        agent: httpsAgent,
    }).then( response => {
        if(response.ok){
            return response.json();
        }else{
            return Promise.reject(response);
        }
    }).then( data => {
        teamId = Object(data.data).id
        console.log('成功建立 Opsgenie Team', data)
    }).catch( e => {
        console.warn('Team 已存在或發生錯誤', e)
    })

    await createPolicy(teamName, teamId)
}

async function createPolicy(teamName: string, teamId: string) {
    const createBody = {
        type: 'alert',
        name: `${teamName} Alert Policy`,
        enabled: 'true',
        filter:{
            type: 'match-all-conditions',
            conditions:[
                {
                    field: 'extra-properties',
                    key: 'team',
                    operation: 'equals',
                    expectedValue: teamName
                }
            ]
        },
        message: '{{message}}',
        responders:[
            {
                type: 'team',
                id: teamId
            }
        ],
    }

    const response = await fetch(`https://api.opsgenie.com/v2/policies?teamId=${teamId}`, {
        method: 'post',
        body: JSON.stringify(createBody),
        headers: {'Authorization': `GenieKey ${opsgenieKey}`, 'Content-Type': 'application/json'},
        agent: httpsAgent,
    }).then( response => {
        if(response.ok){
            console.log(`成功建立 policy`);
            return response.json();
        }else{
            return Promise.reject(response);
        }
    }).then( data => {
        console.log(data)
    }).catch( e => {
        console.warn('policy 已存在或發生錯誤', e)
    })
}

createTeam(team, members)