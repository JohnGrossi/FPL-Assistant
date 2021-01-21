//const functions = require('firebase-functions');
//const admin = require('firebase-admin');
//admin.initializeApp();
//const database = admin.firestore();
const request = require('request');
const cheerio = require('cheerio');
//const puppeteer = require('puppeteer');

const lineup = require('./predictedLineups');

// exports.scrape = functions.pubsub.schedule('0 19 * * *').onRun((context) => {   
//     database.doc("timers/timer1").update({ "time": admin.firestore.Timestamp.now() });
//     return console.log('successful timer update');
// });

async function compareLineups() {
    let teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];
    let team1 = await ffscoutScrape();
    let team2 = await ffpunditScrape();
    let team3 = await sportitoScrape();
    let players = [];

    //for (var i = 0; i < teams.length; i++) {
    for (const key in teams) {
        for (var k = 0; k < 11; k++){
            if (Object.values(team2.get(teams[key])).includes(Object.values(team1.get(teams[key]))[k])) {
                players.push(Object.values(team1.get(teams[key]))[k]);
            } else if (Object.values(team3.get(teams[key])).includes(Object.values(team1.get(teams[key]))[k])) {
                players.push(Object.values(team1.get(teams[key]))[k]);
            }
//CHECK TEAM2 TO 1 AND 3 //CABI CEBIOS HAS TO BE CEBIOS
        }
        
    }
    console.log(players);
    //(Object.values(team1.get('WOLVERHAMPTON WANDERERS')))[0]
}
compareLineups();

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
                    players.push($(element).text());
                });

                let teamANDplayers = new Map();
                for(i=0, j=0; j <20; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                
                }
                
                var test = Object.values(teamANDplayers.get('ARSENAL'));
                //console.log(teamANDplayers);

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
                var test = Object.values(teamANDplayers.get('ARSENAL'));
                //console.log(players);

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
            
                var teams = []; // 'ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS
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
                    p = p.concat(t);

                    players = p.filter(function (el) {
                        return el != '';
                    });
                });

                let teamANDplayers = new Map();
                for(i=6, j=6; j <26; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                }
                //var test = Object.values(teamANDplayers.get('WOLVERHAMPTON WANDERERS'));
                //console.log(teamANDplayers);

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

//BACK- UP
//function ffpunditScrape() {
    // request('https://www.fiso.co.uk/fanteam-predicted-line-ups/', (error, response, html) =>{
    //     if (!error) {
    //         //load HTML
    //         const $ = cheerio.load(html);
        
    //         var teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];
    //         var players = [];

    //         //finds all player names and put them in an array
    //         $('.sorting_2').each(function (index, element) {
    //             players.push($(element).text());
    //         });
    //         $('.even td').each(function (index, element) {
    //             players.push($(element).text());
    //         });

    //         let teamANDplayers = new Map();
    //         for(i=0, j=0; j <20; i+=11, j++) {
    //             teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});           
    //         }
    //         var test = Object.values(teamANDplayers.get('ARSENAL'));
            
    //         console.log(players);

    //         return teamANDplayers;
    //     }
    // });
//}
