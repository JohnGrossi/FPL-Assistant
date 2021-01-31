const functions = require('firebase-functions');            //TODO split into seperate files
const admin = require('firebase-admin');
admin.initializeApp();
const database = admin.firestore(); 
const request = require('request');
const cheerio = require('cheerio');
const lineup = require('./predictedLineups');
const fetch = require("node-fetch");
admin.firestore().settings({ignoreUndefinedProperties: true});
const fplApi = require("fpl-api"); //https://github.com/jeppe-smith/fpl-api#fetchbootstrap
const puppeteer = require('puppeteer');

//"npm --prefix \"%RESOURCE_DIR%\" run lint"
//i removed this from firebase.json, predeploy and all my errors disapeard

//cloud function, sets predicted lineUps in database
exports.predictedTeams = functions.pubsub.schedule('0 18 * * *').onRun(async context => {
    let teams = ['ARSENAL', 'ASTON VILLA', 'BRIGHTON AND HOVE ALBION', 'BURNLEY', 'CHELSEA', 'CRYSTAL PALACE', 'EVERTON', 'FULHAM', 'LEEDS UNITED', 'LEICESTER CITY', 'LIVERPOOL', 'MANCHESTER CITY', 'MANCHESTER UNITED', 'NEWCASTLE UNITED', 'SHEFFIELD UNITED', 'SOUTHAMPTON', 'TOTTENHAM HOTSPUR', 'WEST BROMWICH ALBION', 'WEST HAM UNITED', 'WOLVERHAMPTON WANDERERS'];

    // Get a new write batch
    const batch = database.batch();
    let everything = await compareLineups(teams);

    for(i=0;i<20;i++) {
        const nycRef = database.collection('predictedTeams').doc(teams[i]);
        batch.set(nycRef, everything.get(teams[i]));
    }
    // Commit the batch
    await batch.commit();
});

//cloud function, sets the upcoming fixtures in database
exports.fixtures = functions.pubsub.schedule('0 18 * * *').onRun(async context => {

    let fixtures = await fetchFixtures();
    database.collection('fixtures').doc('currentWeek')
    .set(fixtures);
});

//function - compare the three sites lineUps and conclude a predicted 11 for each team, returns map of teams with their lineUp
async function compareLineups(teams) {
    
    //Get the LineUps from other sites
    let team1 = await ffscoutScrape(teams);
    let team2 = await ffpunditScrape(teams);
    let team3 = await sportitoScrape();
    let players = [];
    let teamANDplayers = new Map();

    for (const key in teams) {
        for (var k = 0; k < 11; k++){
            
            //compare team1 to team2 and team3, add player to array if is found in team lineUps and not already in the array
            if (Object.values(team2.get(teams[key])).includes(Object.values(team1.get(teams[key]))[k]) && !(players.includes(Object.values(team1.get(teams[key]))[k]))) {
                players.push(Object.values(team1.get(teams[key]))[k]);
            } else if (Object.values(team3.get(teams[key])).includes(Object.values(team1.get(teams[key]))[k]) && !(players.includes(Object.values(team1.get(teams[key]))[k]))) {
                players.push(Object.values(team1.get(teams[key]))[k]);
            }
            
            //compare team2 to team1 and team3, add player to array if is found in team lineUps and not already in the array
            if (Object.values(team1.get(teams[key])).includes(Object.values(team2.get(teams[key]))[k]) && !(players.includes(Object.values(team2.get(teams[key]))[k]))) {
                players.push(Object.values(team2.get(teams[key]))[k]);
            } else if (Object.values(team3.get(teams[key])).includes(Object.values(team2.get(teams[key]))[k]) && !(players.includes(Object.values(team2.get(teams[key]))[k]))) {
                players.push(Object.values(team2.get(teams[key]))[k]);
            }
        }

        //each lineUp is assigned to the corresponding team and put in the map, clear array to get next teams predicted 11
        teamANDplayers.set(teams[key], {1: players[0], 2: players[1], 3: players[2], 4: players[3], 5: players[4], 6: players[5], 7: players[6], 8: players[7], 9: players[8], 10: players[9], 11: players[10]});
        players =[];
    }
    return teamANDplayers;
}

//function - webscrapes site and returns the predicted 11 of each team
async function ffscoutScrape(teams) {
    return new Promise(function(resolve, reject) {
        request('https://www.fantasyfootballscout.co.uk/team-news/', function (error, response, html) {
            if (!error && response.statusCode == 200) {
                
                //load HTML
                const $ = cheerio.load(html);
            
                let players = [];

                //finds all player names and put them in an array
                $('.player-name').each(function (index, element) {
                    var n = $(element).text().split(" ");           //removes double-barrel names and just uses last name //ADD SPECIAL CHARACTER FILTER
                    players.push(n[n.length - 1]);
                });

                let teamANDplayers = new Map(); //maps team to corresponding players
                for(i=0, j=0; j <20; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                
                }
                resolve(teamANDplayers);
            }
        });
    });    
}

//function - webscrapes site and returns the predicted 11 of each team
async function ffpunditScrape(teams) {
    return new Promise(function(resolve, reject) {
        request('https://www.fantasyfootballpundit.com/fantasy-premier-league-team-news/', function (error, response, html) {
            if (!error && response.statusCode == 200) {
                
                //load HTML
                const $ = cheerio.load(html);
            
                var players = [];

                //finds all player names and put them in an array
                $('.da-vfv-player-name').each(function (index, element) {
                    players.push($(element).text());
                });

                let teamANDplayers = new Map();   //maps team to corresponding players
                for(i=0, j=0; j <20; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                
                }
                resolve(teamANDplayers);
            }
        });
    });
}

//function - webscrapes site and returns the predicted 11 of each team
async function sportitoScrape() {
    return new Promise(function(resolve, reject) {
        request('https://blog.sportito.co.uk/lineups-premier-league-2020-2021-2121/', function (error, response, html) {
            if (!error && response.statusCode == 200) {
                
                //load HTML
                const $ = cheerio.load(html);
            
                var teams = []; 
                var players = [];
                var p = [];

                //finds all teams names and put them in an array, lineups aren't in a-z so had to scrape them, weird structure so had to fix names a bit
                $('.column-1').each(function (index, element) {
                    var teamFull = (($(element).text()).split('(')[0]);
                    teamFull = fixStupidNames(teamFull.substring(0, teamFull.length - 1));
                    teams.push(teamFull);
                });

                //finds all player names and put them in an array, had to split by ;,.  really annoying
                $('.column-2').each(function (index, element) {
                    var t = ($(element).text()).split(/;|,|\./);
                    p = p.concat(t.map(Function.prototype.call, String.prototype.trim));

                    players = p.filter(function (el) { //remove empty values from array
                        return el != '';
                    });
                });

                let teamANDplayers = new Map(); //maps team to corresponding players
                for(i=6, j=6; j <26; i+=11, j++) {
                    teamANDplayers.set(teams[j], {1: players[i], 2: players[i+1], 3: players[i+2], 4: players[i+3], 5: players[i+4], 6: players[i+5], 7: players[i+6], 8: players[i+7], 9: players[i+8], 10: players[i+9], 11: players[i+10]});
                }
                resolve(teamANDplayers);
            }
        });
    });
}

//function - changes names from sportioscrape to be full names, match the first 2
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

//function - webscrapes fixtures from the upcoming gw, returns object of fixtures e.g '1: spurs v burnley'
async function fetchFixtures() { 
    return new Promise(async function(resolve, reject) {
        
        //had js things that cheerio seemed to not catch so used puppeteer
        //loads up fixture page
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://fantasy.premierleague.com/fixtures')

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        //waits for page to load fully, normal puppeteer wait functions did not work
        await sleep(4000);

        //finds class name that corresponds with team names
        const teams = await page.$$('span[class="Fixture__TeamName-sc-7l1xrv-5 guGKwL"]');
        //const times = await page.$$('span[class="Fixture__FixtureKOTime-sc-7l1xrv-7 bToSHF"]');
        let fixtures = {};

        //find first 2 teams then add to object
        for (let i = 0, k=1; i < teams.length; i+=2, k++) {
            const team1 = await (await teams[i].getProperty('innerText')).jsonValue();
            const team2 = await (await teams[i+1].getProperty('innerText')).jsonValue();
            //const time = await (await times[k-1].getProperty('innerText')).jsonValue();

            fixtures[k] = (team1+ " v " +team2);
        }

        browser.close();

        resolve(fixtures);
    });
} 
