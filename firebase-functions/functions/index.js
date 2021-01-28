const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const database = admin.firestore(); 
const request = require('request');
const cheerio = require('cheerio');
const lineup = require('./predictedLineups');
const fetch = require("node-fetch");
admin.firestore().settings({ignoreUndefinedProperties: true});
const fplApi = require("fpl-api"); //https://github.com/jeppe-smith/fpl-api#fetchbootstrap

//"npm --prefix \"%RESOURCE_DIR%\" run lint"
//i removed this from firebase.json, predeploy and all my errors disapeard

exports.scrape = functions.pubsub.schedule('* 1 * * *').onRun(async context => {
    let teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];

    // Get a new write batch
    const batch = database.batch();
    let everything = await compareLineups();

    for(i=0;i<20;i++) {
        const nycRef = database.collection('predictedTeams').doc(teams[i]);
        batch.set(nycRef, everything.get(teams[i]));
    }
    // Commit the batch
    await batch.commit();
});

//tesT emulator
// exports.testScrape = functions.firestore.document('predictedTeams/ARSENAL').onCreate(async snap => {
//     let teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];

//     // Get a new write batch
//     const batch = database.batch();
//     let everything = await compareLineups();

//     for(i=0;i<20;i++) {
//         const nycRef = database.collection('predictedTeams').doc(teams[i]);
//         batch.set(nycRef, everything.get(teams[i]));
//     }
//     // Commit the batch
//     await batch.commit();
// });

async function compareLineups() {
    let teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];
    let team1 = await ffscoutScrape();
    let team2 = await ffpunditScrape();
    let team3 = await sportitoScrape();
    let players = [];
    let teamANDplayers = new Map();

    //for (var i = 0; i < teams.length; i++) {
    for (const key in teams) {
        for (var k = 0; k < 11; k++){
            
            //compare team1 to 2 and 3
            if (Object.values(team2.get(teams[key])).includes(Object.values(team1.get(teams[key]))[k]) && !(players.includes(Object.values(team1.get(teams[key]))[k]))) {
                players.push(Object.values(team1.get(teams[key]))[k]);
            } else if (Object.values(team3.get(teams[key])).includes(Object.values(team1.get(teams[key]))[k]) && !(players.includes(Object.values(team1.get(teams[key]))[k]))) {
                players.push(Object.values(team1.get(teams[key]))[k]);
            }
            
            if (Object.values(team1.get(teams[key])).includes(Object.values(team2.get(teams[key]))[k]) && !(players.includes(Object.values(team2.get(teams[key]))[k]))) {
                players.push(Object.values(team2.get(teams[key]))[k]);
            } else if (Object.values(team3.get(teams[key])).includes(Object.values(team2.get(teams[key]))[k]) && !(players.includes(Object.values(team2.get(teams[key]))[k]))) {
                players.push(Object.values(team2.get(teams[key]))[k]);
            }
        }
        teamANDplayers.set(teams[key], {1: players[0], 2: players[1], 3: players[2], 4: players[3], 5: players[4], 6: players[5], 7: players[6], 8: players[7], 9: players[8], 10: players[9], 11: players[10]});
        players =[];
    }
    return teamANDplayers;
}

async function ffscoutScrape() {
    return new Promise(function(resolve, reject) {
        request('https://www.fantasyfootballscout.co.uk/team-news/', function (error, response, html) {
            if (!error && response.statusCode == 200) {
                //load HTML
                const $ = cheerio.load(html);
            
                let teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];
                let players = [];

                //finds all player names and put them in an array
                $('.player-name').each(function (index, element) {
                    var n = $(element).text().split(" ");
                    
                    players.push(n[n.length - 1]);
                });

                let teamANDplayers = new Map();
                for(i=0, j=0; j <20; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                
                }
                resolve(teamANDplayers);
            }
        });
    });    
}

async function ffpunditScrape() {
    return new Promise(function(resolve, reject) {
        request('https://www.fantasyfootballpundit.com/fantasy-premier-league-team-news/', function (error, response, html) {
            if (!error && response.statusCode == 200) {
                //load HTML
                const $ = cheerio.load(html);
            
                var teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];
                var players = [];

                //finds all player names and put them in an array
                $('.da-vfv-player-name').each(function (index, element) {
                    players.push($(element).text());
                });

                let teamANDplayers = new Map();
                for(i=0, j=0; j <20; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                
                }
                resolve(teamANDplayers);
            }
        });
    });
}

//FUCK THIS PIECE OF SHIT WEBSITE
async function sportitoScrape() {
    return new Promise(function(resolve, reject) {
        request('https://blog.sportito.co.uk/lineups-premier-league-2020-2021-2121/', function (error, response, html) {
            if (!error && response.statusCode == 200) {
                //load HTML
                const $ = cheerio.load(html);
            
                var teams = []; 
                var players = [];
                var p = [];

                //finds all teams names and put them in an array, WHY COULN'T YOU BE NORMAL
                $('.column-1').each(function (index, element) {
                    var teamFull = (($(element).text()).split('(')[0]);
                    teamFull = fixStupidNames(teamFull.substring(0, teamFull.length - 1));
                    teams.push(teamFull);
                });

                //finds all player names and put them in an array
                $('.column-2').each(function (index, element) {
                    var t = ($(element).text()).split(/;|,|\./);
                    p = p.concat(t.map(Function.prototype.call, String.prototype.trim));

                    players = p.filter(function (el) {
                        return el != '';
                    });
                });

                let teamANDplayers = new Map();
                for(i=6, j=6; j <26; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                }
                resolve(teamANDplayers);
            }
        });
    });
}

function fixStupidNames(name){
    switch(name) {
        case "BRIGHTON":
            return "BRIGHTON AND HOVE ALBION";
            break;
        case "LEEDS":
            return "LEEDS UNITED";
            break;
        case "LEICESTER":
            return "LEICESTER CITY";
            break;
        case "MAN CITY":
            return "MANCHESTER CITY";
            break;
        case "MAN UNITED":
            return "MANCHESTER UNITED";
            break;
        case "NEWCASTLE":
            return "NEWCASTLE UNITED";
            break;
        case "SHEFFIELD":
            return "SHEFFIELD UNITED";
            break;
        case "TOTTENHAM":
            return "TOTTENHAM HOTSPUR";
            break;
        case "WEST BROM":
            return "WEST BROMWICH ALBION";
            break;
        case "WEST HAM":
            return "WEST HAM UNITED";
            break;
        case "WOLVES":
            return "WOLVERHAMPTON WANDERERS";
            break;
        default:
            return name;
    }
}
//-----------------------------------------------------------------------------------------------------------------------------------------------------
async function fetchApi() { 
    let allData = await fplApi.fetchBootstrap(); 
    let players = allData.elements; //642
    
    for(i=0;i < players.length ; i++) { 
        console.log(players[i]); 
    } 
} 
fetchApi();