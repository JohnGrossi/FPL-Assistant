//const functions = require('firebase-functions');
//const admin = require('firebase-admin');
//admin.initializeApp();
//const database = admin.firestore();
const request = require('request');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const lineup = require('./predictedLineups');

// exports.scrape = functions.pubsub.schedule('0 19 * * *').onRun((context) => {
    
//     ffscoutScrape();
//     ffpunditScrape();
//     sportitoScrape();
    
//     //database.doc("timers/timer1").update({ "time": admin.firestore.Timestamp.now() });
//     return console.log('successful timer update');
// });

function predictLineups(){
    const lineUp1 = ffscoutScrape();
    const lineUp2 = ffpunditScrape();
    const lineUp3 = sportitoScrape();
    let finalLineUps = new Map();

}

function ffscoutScrape() {
    request('https://www.fantasyfootballscout.co.uk/team-news/', (error, response, html) =>{
        if (!error && response.statusCode == 200) {
            //load HTML
            const $ = cheerio.load(html);
        
            var teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];
            var players = [];

            //finds all player names and put them in an array
            $('.player-name').each(function (index, element) {
                players.push($(element).text());
            });

            let teamANDplayers = new Map();
            for(i=0, j=0; j <20; i+=11, j++) {
                teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
               
            }
            
            var test = Object.values(teamANDplayers.get('ARSENAL'));
            console.log(test);

            return teamANDplayers;
        }
    });
}

function ffpunditScrape() {
    request('https://www.fantasyfootballpundit.com/fantasy-premier-league-team-news/', (error, response, html) =>{
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

            return teamANDplayers;
        }
    });
}


//FUCK THIS PIECE OF SHIT WEBSITE
// function sportitoScrape() {
//     request('https://blog.sportito.co.uk/lineups-premier-league-2020-2021-2121/', (error, response, html) =>{
//         if (!error && response.statusCode == 200) {
//             //load HTML
//             const $ = cheerio.load(html);
        
//             var teams = []; //how to reference (ARSENAL ,ASTON VILLA ,BRIGHTON ,BURNLEY ,CHELSEA ,CRYSTAL PALACE ,EVERTON, FULHAM, LEEDS,LEICESTER ,LIVERPOOL ,MAN CITY ,MAN UNITED ,NEWCASTLE ,SHEFFIELD ,SOUTHAMPTON ,TOTTENHAM ,WEST BROM ,WEST HAM ,WOLVES )
//             var players = [];
//             var p = [];

//             //finds all teams names and put them in an array
//             $('.column-1').each(function (index, element) {
//                 var teamFull = (($(element).text()).split('(')[0]);
//                 teamFull = teamFull.substring(0, teamFull.length - 1);
//                 teams.push(teamFull);
//             });

//             //finds all player names and put them in an array
//             $('.column-2').each(function (index, element) {
//                 var t = ($(element).text()).split(/;|,|\./)
//                 p = p.concat(t);

//                 players = p.filter(function (el) {
//                     return el != '';
//                   });
//             });

//             let teamANDplayers = new Map();
//             for(i=6, j=6; j <20; i+=11, j++) {
//                 teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
//             }
//             var test = Object.values(teamANDplayers.get('WOLVES'));
//             console.log(teamANDplayers);

//             return teamANDplayers;
//         }
//     });
// }
    
function ffpunditScrape() {
    request('https://www.fiso.co.uk/fanteam-predicted-line-ups/', (error, response, html) =>{
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

            return teamANDplayers;
        }
    });
}
