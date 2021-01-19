const request = require('request');
const cheerio = require('cheerio');

//later make this be called from index instead of it being in there

// exports.scrape = functions.pubsub.schedule('0 19 * * *').onRun((context) => {
    
//     ffscoutScrape();
//     ffpunditScrape();
//     sportitoScrape();
    
//     //database.doc("timers/timer1").update({ "time": admin.firestore.Timestamp.now() });
//     return console.log('successful timer update');
// });


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
            console.log(test[0]);
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
            var test = Object.values(teamANDplayers.get('WEST HAM UNITED'));
            console.log(test);
        }
    });
}

function sportitoScrape() {
    request('https://blog.sportito.co.uk/lineups-premier-league-2020-2021-2121/', (error, response, html) =>{
        if (!error && response.statusCode == 200) {
            //load HTML
            const $ = cheerio.load(html);
        
            var teams = []; //how to reference (ARSENAL ,ASTON VILLA ,BRIGHTON ,BURNLEY ,CHELSEA ,CRYSTAL PALACE ,EVERTON, FULHAM, LEEDS,LEICESTER ,LIVERPOOL ,MAN CITY ,MAN UNITED ,NEWCASTLE ,SHEFFIELD ,SOUTHAMPTON ,TOTTENHAM ,WEST BROM ,WEST HAM ,WOLVES )
            var players = [];

            //finds all player names and put them in an array
            $('.column-1').each(function (index, element) {
                var teamFull = (($(element).text()).split('(')[0]);
                teams.push(teamFull);
            });

            //finds all player names and put them in an array
            $('.column-2').each(function (index, element) {
                players.push($(element).text());
            });

            let teamANDplayers = new Map();
            for(i=0; i <26; i++) {
                teamANDplayers.set(teams[i], {team: players[i]});
            
            }
            var test = Object.values(teamANDplayers.get('ARSENAL '));
            console.log(test);
        }
    });
}