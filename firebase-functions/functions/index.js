const functions = require('firebase-functions');            //TODO split into seperate files
const admin = require('firebase-admin');
admin.initializeApp();
const database = admin.firestore(); 
const request = require('request');
const cheerio = require('cheerio');
const lineup = require('./predictedLineups');
const fixtureList = require('./fixtures');
const playersData = require('./playerData');
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

    //sets the 11 predicted players for the team path to the batch write
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
    database.collection('fixtures').doc('currentWeek').set(fixtures);
});

//const that stops the playerdata method from timing out, takes a little bit to run fully
const runtimeOpts = {
    timeoutSeconds: 300
}
  
//cloud function, sets all player data in database
exports.playerData = functions.pubsub.schedule('0 0 * * 2').onRun(async context => {

    var allTeams = {
        'ARSENAL' : {},
        'ASTON VILLA' : {},
        'BRIGHTON AND HOVE ALBION' : {},
        'BURNLEY' : {},
        'CHELSEA' : {},
        'CRYSTAL PALACE' : {},
        'EVERTON' : {},
        'FULHAM' : {},
        'LEEDS UNITED' : {},
        'LEICESTER CITY' : {},
        'LIVERPOOL' : {},
        'MANCHESTER CITY' : {},
        'MANCHESTER UNITED' : {},
        'NEWCASTLE UNITED' : {},
        'SHEFFIELD UNITED' : {},
        'SOUTHAMPTON' : {},
        'TOTTENHAM HOTSPUR' : {},
        'WEST BROMWICH ALBION' : {},
        'WEST HAM UNITED' : {},
        'WOLVERHAMPTON WANDERERS' : {},
    };
    
    let playerData = await fetchPlayerData(allTeams);

    //for each team: for each player - each batch write is 1 team worth of players as it can only do 500 writes at a time/batch
    for (const keys of Object.entries(playerData)){
        const batch = database.batch();
        for (const [key, value] of Object.entries(playerData[keys[0]])) {
            const nycRef = database.collection('teams/'+keys[0]+'/players/').doc(key);
            batch.set(nycRef, value);
        }
        // Commit the batch
        await batch.commit();
    }

    let teamData = await setTeamStats(allTeams);

    const batch = database.batch();
    for (const [key, value] of Object.entries(teamData)){
        const nycRef = database.collection('teams').doc(key);
        batch.set(nycRef, value);
    }
    await batch.commit();
});

//function - compare the three sites lineUps and conclude a predicted 11 for each team, returns map of teams with their lineUp
async function compareLineups(teams) {
    
    //Get the LineUps from other sites
    let team1 = await ffscoutScrape(teams);
    let team2 = await ffpunditScrape(teams);
    let team3 = await ffscoutScrape(teams);
    let players = [];
    let teamANDplayers = new Map();

    for (const key in teams) {
        for (var k = 0; k < 11; k++){
            
            //2:1 ratio - if a players predicted in at least 2 sites its added
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
                    var n = $(element).text().split(" ");           //removes double-barrel names and just uses last name
                    players.push(n[n.length - 1]);
                });

                //maps team to corresponding players
                let teamANDplayers = new Map(); 
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

                //maps team to corresponding players
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

                //maps team to corresponding players
                let teamANDplayers = new Map();
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
        case "LEEDS":
            return "LEEDS UNITED";
        case "LEICESTER":
            return "LEICESTER CITY";
        case "MAN CITY":
            return "MANCHESTER CITY";
        case "MAN UNITED":
            return "MANCHESTER UNITED";
        case "NEWCASTLE":
            return "NEWCASTLE UNITED";
        case "SHEFFIELD":
            return "SHEFFIELD UNITED";
        case "TOTTENHAM":
            return "TOTTENHAM HOTSPUR";
        case "WEST BROM":
            return "WEST BROMWICH ALBION";
        case "WEST HAM":
            return "WEST HAM UNITED";
        case "WOLVES":
            return "WOLVERHAMPTON WANDERERS";
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

        //waits for page to load fully, normal puppeteer wait functions did not work for some reason
        await sleep(4000);

        //finds class name that corresponds with team names
        const teams = await page.$$('span[class="Fixture__TeamName-sc-7l1xrv-5 guGKwL"]');
        let fixtures = {};

        //find first 2 teams then add to object
        for (let i = 0, k=1; i < teams.length; i+=2, k++) {
            const team1 = await (await teams[i].getProperty('innerText')).jsonValue();
            const team2 = await (await teams[i+1].getProperty('innerText')).jsonValue();

            //creates fixture and adds to fixtures
            fixtures[k] = (team1+ " v " +team2);
        }

        browser.close();

        resolve(fixtures);
    });
} 

//----------------------------------------------------------------------------------------------------------------------------------------------------

//function - webscrapes fixtures from the upcoming gw, returns object of fixtures e.g '1: spurs v burnley'
async function fetchPlayerData(teams) { 
    return new Promise(async function(resolve, reject) {
        //4 lines below remove accents/check if they have accents 'very fast script based on the Unicode standard'
        //https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
        var Latinise={};Latinise.latin_map={"Á":"A","Ă":"A","Ắ":"A","Ặ":"A","Ằ":"A","Ẳ":"A","Ẵ":"A","Ǎ":"A","Â":"A","Ấ":"A","Ậ":"A","Ầ":"A","Ẩ":"A","Ẫ":"A","Ä":"A","Ǟ":"A","Ȧ":"A","Ǡ":"A","Ạ":"A","Ȁ":"A","À":"A","Ả":"A","Ȃ":"A","Ā":"A","Ą":"A","Å":"A","Ǻ":"A","Ḁ":"A","Ⱥ":"A","Ã":"A","Ꜳ":"AA","Æ":"AE","Ǽ":"AE","Ǣ":"AE","Ꜵ":"AO","Ꜷ":"AU","Ꜹ":"AV","Ꜻ":"AV","Ꜽ":"AY","Ḃ":"B","Ḅ":"B","Ɓ":"B","Ḇ":"B","Ƀ":"B","Ƃ":"B","Ć":"C","Č":"C","Ç":"C","Ḉ":"C","Ĉ":"C","Ċ":"C","Ƈ":"C","Ȼ":"C","Ď":"D","Ḑ":"D","Ḓ":"D","Ḋ":"D","Ḍ":"D","Ɗ":"D","Ḏ":"D","ǲ":"D","ǅ":"D","Đ":"D","Ƌ":"D","Ǳ":"DZ","Ǆ":"DZ","É":"E","Ĕ":"E","Ě":"E","Ȩ":"E","Ḝ":"E","Ê":"E","Ế":"E","Ệ":"E","Ề":"E","Ể":"E","Ễ":"E","Ḙ":"E","Ë":"E","Ė":"E","Ẹ":"E","Ȅ":"E","È":"E","Ẻ":"E","Ȇ":"E","Ē":"E","Ḗ":"E","Ḕ":"E","Ę":"E","Ɇ":"E","Ẽ":"E","Ḛ":"E","Ꝫ":"ET","Ḟ":"F","Ƒ":"F","Ǵ":"G","Ğ":"G","Ǧ":"G","Ģ":"G","Ĝ":"G","Ġ":"G","Ɠ":"G","Ḡ":"G","Ǥ":"G","Ḫ":"H","Ȟ":"H","Ḩ":"H","Ĥ":"H","Ⱨ":"H","Ḧ":"H","Ḣ":"H","Ḥ":"H","Ħ":"H","Í":"I","Ĭ":"I","Ǐ":"I","Î":"I","Ï":"I","Ḯ":"I","İ":"I","Ị":"I","Ȉ":"I","Ì":"I","Ỉ":"I","Ȋ":"I","Ī":"I","Į":"I","Ɨ":"I","Ĩ":"I","Ḭ":"I","Ꝺ":"D","Ꝼ":"F","Ᵹ":"G","Ꞃ":"R","Ꞅ":"S","Ꞇ":"T","Ꝭ":"IS","Ĵ":"J","Ɉ":"J","Ḱ":"K","Ǩ":"K","Ķ":"K","Ⱪ":"K","Ꝃ":"K","Ḳ":"K","Ƙ":"K","Ḵ":"K","Ꝁ":"K","Ꝅ":"K","Ĺ":"L","Ƚ":"L","Ľ":"L","Ļ":"L","Ḽ":"L","Ḷ":"L","Ḹ":"L","Ⱡ":"L","Ꝉ":"L","Ḻ":"L","Ŀ":"L","Ɫ":"L","ǈ":"L","Ł":"L","Ǉ":"LJ","Ḿ":"M","Ṁ":"M","Ṃ":"M","Ɱ":"M","Ń":"N","Ň":"N","Ņ":"N","Ṋ":"N","Ṅ":"N","Ṇ":"N","Ǹ":"N","Ɲ":"N","Ṉ":"N","Ƞ":"N","ǋ":"N","Ñ":"N","Ǌ":"NJ","Ó":"O","Ŏ":"O","Ǒ":"O","Ô":"O","Ố":"O","Ộ":"O","Ồ":"O","Ổ":"O","Ỗ":"O","Ö":"O","Ȫ":"O","Ȯ":"O","Ȱ":"O","Ọ":"O","Ő":"O","Ȍ":"O","Ò":"O","Ỏ":"O","Ơ":"O","Ớ":"O","Ợ":"O","Ờ":"O","Ở":"O","Ỡ":"O","Ȏ":"O","Ꝋ":"O","Ꝍ":"O","Ō":"O","Ṓ":"O","Ṑ":"O","Ɵ":"O","Ǫ":"O","Ǭ":"O","Ø":"O","Ǿ":"O","Õ":"O","Ṍ":"O","Ṏ":"O","Ȭ":"O","Ƣ":"OI","Ꝏ":"OO","Ɛ":"E","Ɔ":"O","Ȣ":"OU","Ṕ":"P","Ṗ":"P","Ꝓ":"P","Ƥ":"P","Ꝕ":"P","Ᵽ":"P","Ꝑ":"P","Ꝙ":"Q","Ꝗ":"Q","Ŕ":"R","Ř":"R","Ŗ":"R","Ṙ":"R","Ṛ":"R","Ṝ":"R","Ȑ":"R","Ȓ":"R","Ṟ":"R","Ɍ":"R","Ɽ":"R","Ꜿ":"C","Ǝ":"E","Ś":"S","Ṥ":"S","Š":"S","Ṧ":"S","Ş":"S","Ŝ":"S","Ș":"S","Ṡ":"S","Ṣ":"S","Ṩ":"S","Ť":"T","Ţ":"T","Ṱ":"T","Ț":"T","Ⱦ":"T","Ṫ":"T","Ṭ":"T","Ƭ":"T","Ṯ":"T","Ʈ":"T","Ŧ":"T","Ɐ":"A","Ꞁ":"L","Ɯ":"M","Ʌ":"V","Ꜩ":"TZ","Ú":"U","Ŭ":"U","Ǔ":"U","Û":"U","Ṷ":"U","Ü":"U","Ǘ":"U","Ǚ":"U","Ǜ":"U","Ǖ":"U","Ṳ":"U","Ụ":"U","Ű":"U","Ȕ":"U","Ù":"U","Ủ":"U","Ư":"U","Ứ":"U","Ự":"U","Ừ":"U","Ử":"U","Ữ":"U","Ȗ":"U","Ū":"U","Ṻ":"U","Ų":"U","Ů":"U","Ũ":"U","Ṹ":"U","Ṵ":"U","Ꝟ":"V","Ṿ":"V","Ʋ":"V","Ṽ":"V","Ꝡ":"VY","Ẃ":"W","Ŵ":"W","Ẅ":"W","Ẇ":"W","Ẉ":"W","Ẁ":"W","Ⱳ":"W","Ẍ":"X","Ẋ":"X","Ý":"Y","Ŷ":"Y","Ÿ":"Y","Ẏ":"Y","Ỵ":"Y","Ỳ":"Y","Ƴ":"Y","Ỷ":"Y","Ỿ":"Y","Ȳ":"Y","Ɏ":"Y","Ỹ":"Y","Ź":"Z","Ž":"Z","Ẑ":"Z","Ⱬ":"Z","Ż":"Z","Ẓ":"Z","Ȥ":"Z","Ẕ":"Z","Ƶ":"Z","Ĳ":"IJ","Œ":"OE","ᴀ":"A","ᴁ":"AE","ʙ":"B","ᴃ":"B","ᴄ":"C","ᴅ":"D","ᴇ":"E","ꜰ":"F","ɢ":"G","ʛ":"G","ʜ":"H","ɪ":"I","ʁ":"R","ᴊ":"J","ᴋ":"K","ʟ":"L","ᴌ":"L","ᴍ":"M","ɴ":"N","ᴏ":"O","ɶ":"OE","ᴐ":"O","ᴕ":"OU","ᴘ":"P","ʀ":"R","ᴎ":"N","ᴙ":"R","ꜱ":"S","ᴛ":"T","ⱻ":"E","ᴚ":"R","ᴜ":"U","ᴠ":"V","ᴡ":"W","ʏ":"Y","ᴢ":"Z","á":"a","ă":"a","ắ":"a","ặ":"a","ằ":"a","ẳ":"a","ẵ":"a","ǎ":"a","â":"a","ấ":"a","ậ":"a","ầ":"a","ẩ":"a","ẫ":"a","ä":"a","ǟ":"a","ȧ":"a","ǡ":"a","ạ":"a","ȁ":"a","à":"a","ả":"a","ȃ":"a","ā":"a","ą":"a","ᶏ":"a","ẚ":"a","å":"a","ǻ":"a","ḁ":"a","ⱥ":"a","ã":"a","ꜳ":"aa","æ":"ae","ǽ":"ae","ǣ":"ae","ꜵ":"ao","ꜷ":"au","ꜹ":"av","ꜻ":"av","ꜽ":"ay","ḃ":"b","ḅ":"b","ɓ":"b","ḇ":"b","ᵬ":"b","ᶀ":"b","ƀ":"b","ƃ":"b","ɵ":"o","ć":"c","č":"c","ç":"c","ḉ":"c","ĉ":"c","ɕ":"c","ċ":"c","ƈ":"c","ȼ":"c","ď":"d","ḑ":"d","ḓ":"d","ȡ":"d","ḋ":"d","ḍ":"d","ɗ":"d","ᶑ":"d","ḏ":"d","ᵭ":"d","ᶁ":"d","đ":"d","ɖ":"d","ƌ":"d","ı":"i","ȷ":"j","ɟ":"j","ʄ":"j","ǳ":"dz","ǆ":"dz","é":"e","ĕ":"e","ě":"e","ȩ":"e","ḝ":"e","ê":"e","ế":"e","ệ":"e","ề":"e","ể":"e","ễ":"e","ḙ":"e","ë":"e","ė":"e","ẹ":"e","ȅ":"e","è":"e","ẻ":"e","ȇ":"e","ē":"e","ḗ":"e","ḕ":"e","ⱸ":"e","ę":"e","ᶒ":"e","ɇ":"e","ẽ":"e","ḛ":"e","ꝫ":"et","ḟ":"f","ƒ":"f","ᵮ":"f","ᶂ":"f","ǵ":"g","ğ":"g","ǧ":"g","ģ":"g","ĝ":"g","ġ":"g","ɠ":"g","ḡ":"g","ᶃ":"g","ǥ":"g","ḫ":"h","ȟ":"h","ḩ":"h","ĥ":"h","ⱨ":"h","ḧ":"h","ḣ":"h","ḥ":"h","ɦ":"h","ẖ":"h","ħ":"h","ƕ":"hv","í":"i","ĭ":"i","ǐ":"i","î":"i","ï":"i","ḯ":"i","ị":"i","ȉ":"i","ì":"i","ỉ":"i","ȋ":"i","ī":"i","į":"i","ᶖ":"i","ɨ":"i","ĩ":"i","ḭ":"i","ꝺ":"d","ꝼ":"f","ᵹ":"g","ꞃ":"r","ꞅ":"s","ꞇ":"t","ꝭ":"is","ǰ":"j","ĵ":"j","ʝ":"j","ɉ":"j","ḱ":"k","ǩ":"k","ķ":"k","ⱪ":"k","ꝃ":"k","ḳ":"k","ƙ":"k","ḵ":"k","ᶄ":"k","ꝁ":"k","ꝅ":"k","ĺ":"l","ƚ":"l","ɬ":"l","ľ":"l","ļ":"l","ḽ":"l","ȴ":"l","ḷ":"l","ḹ":"l","ⱡ":"l","ꝉ":"l","ḻ":"l","ŀ":"l","ɫ":"l","ᶅ":"l","ɭ":"l","ł":"l","ǉ":"lj","ſ":"s","ẜ":"s","ẛ":"s","ẝ":"s","ḿ":"m","ṁ":"m","ṃ":"m","ɱ":"m","ᵯ":"m","ᶆ":"m","ń":"n","ň":"n","ņ":"n","ṋ":"n","ȵ":"n","ṅ":"n","ṇ":"n","ǹ":"n","ɲ":"n","ṉ":"n","ƞ":"n","ᵰ":"n","ᶇ":"n","ɳ":"n","ñ":"n","ǌ":"nj","ó":"o","ŏ":"o","ǒ":"o","ô":"o","ố":"o","ộ":"o","ồ":"o","ổ":"o","ỗ":"o","ö":"o","ȫ":"o","ȯ":"o","ȱ":"o","ọ":"o","ő":"o","ȍ":"o","ò":"o","ỏ":"o","ơ":"o","ớ":"o","ợ":"o","ờ":"o","ở":"o","ỡ":"o","ȏ":"o","ꝋ":"o","ꝍ":"o","ⱺ":"o","ō":"o","ṓ":"o","ṑ":"o","ǫ":"o","ǭ":"o","ø":"o","ǿ":"o","õ":"o","ṍ":"o","ṏ":"o","ȭ":"o","ƣ":"oi","ꝏ":"oo","ɛ":"e","ᶓ":"e","ɔ":"o","ᶗ":"o","ȣ":"ou","ṕ":"p","ṗ":"p","ꝓ":"p","ƥ":"p","ᵱ":"p","ᶈ":"p","ꝕ":"p","ᵽ":"p","ꝑ":"p","ꝙ":"q","ʠ":"q","ɋ":"q","ꝗ":"q","ŕ":"r","ř":"r","ŗ":"r","ṙ":"r","ṛ":"r","ṝ":"r","ȑ":"r","ɾ":"r","ᵳ":"r","ȓ":"r","ṟ":"r","ɼ":"r","ᵲ":"r","ᶉ":"r","ɍ":"r","ɽ":"r","ↄ":"c","ꜿ":"c","ɘ":"e","ɿ":"r","ś":"s","ṥ":"s","š":"s","ṧ":"s","ş":"s","ŝ":"s","ș":"s","ṡ":"s","ṣ":"s","ṩ":"s","ʂ":"s","ᵴ":"s","ᶊ":"s","ȿ":"s","ɡ":"g","ᴑ":"o","ᴓ":"o","ᴝ":"u","ť":"t","ţ":"t","ṱ":"t","ț":"t","ȶ":"t","ẗ":"t","ⱦ":"t","ṫ":"t","ṭ":"t","ƭ":"t","ṯ":"t","ᵵ":"t","ƫ":"t","ʈ":"t","ŧ":"t","ᵺ":"th","ɐ":"a","ᴂ":"ae","ǝ":"e","ᵷ":"g","ɥ":"h","ʮ":"h","ʯ":"h","ᴉ":"i","ʞ":"k","ꞁ":"l","ɯ":"m","ɰ":"m","ᴔ":"oe","ɹ":"r","ɻ":"r","ɺ":"r","ⱹ":"r","ʇ":"t","ʌ":"v","ʍ":"w","ʎ":"y","ꜩ":"tz","ú":"u","ŭ":"u","ǔ":"u","û":"u","ṷ":"u","ü":"u","ǘ":"u","ǚ":"u","ǜ":"u","ǖ":"u","ṳ":"u","ụ":"u","ű":"u","ȕ":"u","ù":"u","ủ":"u","ư":"u","ứ":"u","ự":"u","ừ":"u","ử":"u","ữ":"u","ȗ":"u","ū":"u","ṻ":"u","ų":"u","ᶙ":"u","ů":"u","ũ":"u","ṹ":"u","ṵ":"u","ᵫ":"ue","ꝸ":"um","ⱴ":"v","ꝟ":"v","ṿ":"v","ʋ":"v","ᶌ":"v","ⱱ":"v","ṽ":"v","ꝡ":"vy","ẃ":"w","ŵ":"w","ẅ":"w","ẇ":"w","ẉ":"w","ẁ":"w","ⱳ":"w","ẘ":"w","ẍ":"x","ẋ":"x","ᶍ":"x","ý":"y","ŷ":"y","ÿ":"y","ẏ":"y","ỵ":"y","ỳ":"y","ƴ":"y","ỷ":"y","ỿ":"y","ȳ":"y","ẙ":"y","ɏ":"y","ỹ":"y","ź":"z","ž":"z","ẑ":"z","ʑ":"z","ⱬ":"z","ż":"z","ẓ":"z","ȥ":"z","ẕ":"z","ᵶ":"z","ᶎ":"z","ʐ":"z","ƶ":"z","ɀ":"z","ﬀ":"ff","ﬃ":"ffi","ﬄ":"ffl","ﬁ":"fi","ﬂ":"fl","ĳ":"ij","œ":"oe","ﬆ":"st","ₐ":"a","ₑ":"e","ᵢ":"i","ⱼ":"j","ₒ":"o","ᵣ":"r","ᵤ":"u","ᵥ":"v","ₓ":"x"};
        String.prototype.latinise=function(){return this.replace(/[^A-Za-z0-9\[\] ]/g,function(a){return Latinise.latin_map[a]||a})};
        String.prototype.latinize=String.prototype.latinise;
        String.prototype.isLatin=function(){return this==this.latinise()}
        
        var player = {};

        //gets all player info from API
        let players = await fplApi.fetchBootstrap();

        //iterate trough each player
        for (i = 0; i < players.elements.length; i++) {

            //get last name (matches the image when searching for it)
            var n = players.elements[i].second_name.split(" ");
            players.elements[i].second_name = n[n.length-1];
            
            //remove accents
            if (players.elements[i].second_name.isLatin() == false) {
                players.elements[i].second_name = players.elements[i].second_name.latinise();
            }
            if (players.elements[i].second_name.includes('ß')) { //.Latinise doesnt remove this letter
                players.elements[i].second_name = players.elements[i].second_name.replace('ß','ss');
            }

            //get players past fixture information from API
            let fixtures = await fplApi.fetchElementSummary(players.elements[i].id)

            try {
                //depneding what position, set the attributes
                if (players.elements[i].element_type == 1) {
                    teams[getTeamName(players.elements[i].team)][players.elements[i].second_name] = {'team': getTeamName(players.elements[i].team), 'price': players.elements[i].now_cost, 'position': getPosition(players.elements[i].element_type), 'fitness': players.elements[i].chance_of_playing_this_round, 'pointsTotal': players.elements[i].total_points, 'cleanSheetTotal': players.elements[i].clean_sheets, 'penaltySaves': players.elements[i].penalties_saved, 'lastFixture': getResult(fixtures.history[fixtures.history.length-2].team_h_score, fixtures.history[fixtures.history.length-2].team_a_score, fixtures.history[fixtures.history.length-2].was_home), 'secondLastFixture': getResult(fixtures.history[fixtures.history.length-3].team_h_score, fixtures.history[fixtures.history.length-3].team_a_score, fixtures.history[fixtures.history.length-3].was_home), 'thirdLastFixture': getResult(fixtures.history[fixtures.history.length-4].team_h_score, fixtures.history[fixtures.history.length-4].team_a_score, fixtures.history[fixtures.history.length-4].was_home), 'lastPoints': fixtures.history[fixtures.history.length-2].total_points, 'secondLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'thirdLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'nextFixture': getFixture(players.elements[i].team, fixtures.fixtures[0].team_h, fixtures.fixtures[0].team_a), 'secondNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[1].team_h, fixtures.fixtures[1].team_a), 'thirdNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[2].team_h, fixtures.fixtures[2].team_a)};
                } else if (players.elements[i].element_type == 2) {
                    teams[getTeamName(players.elements[i].team)][players.elements[i].second_name] = {'team': getTeamName(players.elements[i].team), 'price': players.elements[i].now_cost, 'position': getPosition(players.elements[i].element_type), 'fitness': players.elements[i].chance_of_playing_this_round, 'pointsTotal': players.elements[i].total_points, 'cleanSheetTotal': players.elements[i].clean_sheets, 'goalsTotal': players.elements[i].goals_scored, 'assistTotal': players.elements[i].assists, 'lastFixture': getResult(fixtures.history[fixtures.history.length-2].team_h_score, fixtures.history[fixtures.history.length-2].team_a_score, fixtures.history[fixtures.history.length-2].was_home), 'secondLastFixture': getResult(fixtures.history[fixtures.history.length-3].team_h_score, fixtures.history[fixtures.history.length-3].team_a_score, fixtures.history[fixtures.history.length-3].was_home), 'thirdLastFixture': getResult(fixtures.history[fixtures.history.length-4].team_h_score, fixtures.history[fixtures.history.length-4].team_a_score, fixtures.history[fixtures.history.length-4].was_home), 'lastPoints': fixtures.history[fixtures.history.length-2].total_points, 'secondLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'thirdLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'nextFixture': getFixture(players.elements[i].team, fixtures.fixtures[0].team_h, fixtures.fixtures[0].team_a), 'secondNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[1].team_h, fixtures.fixtures[1].team_a), 'thirdNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[2].team_h, fixtures.fixtures[2].team_a)};
                } else if (players.elements[i].element_type == 3) {
                    teams[getTeamName(players.elements[i].team)][players.elements[i].second_name] = {'team': getTeamName(players.elements[i].team), 'price': players.elements[i].now_cost, 'position': getPosition(players.elements[i].element_type), 'fitness': players.elements[i].chance_of_playing_this_round, 'pointsTotal': players.elements[i].total_points, 'goalsTotal': players.elements[i].goals_scored, 'assistTotal': players.elements[i].assists, 'lastFixture': getResult(fixtures.history[fixtures.history.length-2].team_h_score, fixtures.history[fixtures.history.length-2].team_a_score, fixtures.history[fixtures.history.length-2].was_home), 'secondLastFixture': getResult(fixtures.history[fixtures.history.length-3].team_h_score, fixtures.history[fixtures.history.length-3].team_a_score, fixtures.history[fixtures.history.length-3].was_home), 'thirdLastFixture': getResult(fixtures.history[fixtures.history.length-4].team_h_score, fixtures.history[fixtures.history.length-4].team_a_score, fixtures.history[fixtures.history.length-4].was_home), 'lastPoints': fixtures.history[fixtures.history.length-2].total_points, 'secondLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'thirdLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'nextFixture': getFixture(players.elements[i].team, fixtures.fixtures[0].team_h, fixtures.fixtures[0].team_a), 'secondNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[1].team_h, fixtures.fixtures[1].team_a), 'thirdNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[2].team_h, fixtures.fixtures[2].team_a)};
                } else if (players.elements[i].element_type == 4) {
                    teams[getTeamName(players.elements[i].team)][players.elements[i].second_name] = {'team': getTeamName(players.elements[i].team), 'price': players.elements[i].now_cost, 'position': getPosition(players.elements[i].element_type), 'fitness': players.elements[i].chance_of_playing_this_round, 'pointsTotal': players.elements[i].total_points, 'goalsTotal': players.elements[i].goals_scored, 'assistTotal': players.elements[i].assists, 'lastFixture': getResult(fixtures.history[fixtures.history.length-2].team_h_score, fixtures.history[fixtures.history.length-2].team_a_score, fixtures.history[fixtures.history.length-2].was_home), 'secondLastFixture': getResult(fixtures.history[fixtures.history.length-3].team_h_score, fixtures.history[fixtures.history.length-3].team_a_score, fixtures.history[fixtures.history.length-3].was_home), 'thirdLastFixture': getResult(fixtures.history[fixtures.history.length-4].team_h_score, fixtures.history[fixtures.history.length-4].team_a_score, fixtures.history[fixtures.history.length-4].was_home), 'lastPoints': fixtures.history[fixtures.history.length-2].total_points, 'secondLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'thirdLastPoints': fixtures.history[fixtures.history.length-3].total_points, 'nextFixture': getFixture(players.elements[i].team, fixtures.fixtures[0].team_h, fixtures.fixtures[0].team_a), 'secondNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[1].team_h, fixtures.fixtures[1].team_a), 'thirdNextFixture': getFixture(players.elements[i].team, fixtures.fixtures[2].team_h, fixtures.fixtures[2].team_a)};
                }
            } catch (error) {
                console.log(players.elements[i].second_name);
                console.log(players.elements[i].id);
                console.log(error);
            }
        }
        resolve(teams);
    });
}

//function - returns the next teams oppenent. API just returns the two team id's and a boolean if they are the home team or no. So this returns the opponent
function getFixture(playersTeam, hTeam, aTeam) {
    if (playersTeam == hTeam) {
        return getTeamName(aTeam);
    } else {
        return getTeamName(hTeam);
    }
}

//function - returns score of fixture. again api has everything seperate so put score into one variable and an indicator if they won, lost or drew for front end
function getResult(homeScore, awayScore, was_home) {
    var fixture = homeScore +'-'+ awayScore;

    if (was_home == true && homeScore > awayScore || was_home == false && homeScore < awayScore) {
        fixture = fixture + " W";
    } else if (was_home == true && homeScore < awayScore || was_home == false && homeScore > awayScore) {
        fixture = fixture + " L";
    } else {
        fixture = fixture + " D";
    }

    return fixture;
}

//function - changes numerical id to a readable string
function getTeamName(id) {
    switch(id) {
        case 1:
            return "ARSENAL";
        case 2:
            return "ASTON VILLA";
        case 3:
            return "BRIGHTON AND HOVE ALBION";
        case 4:
            return "BURNLEY";
        case 5:
            return "CHELSEA";
        case 6:
            return "CRYSTAL PALACE";
        case 7:
            return "EVERTON";
        case 8:
            return "FULHAM";
        case 9:
            return "LEEDS UNITED";
        case 10:
            return "LEICESTER CITY";
        case 11:
            return "LIVERPOOL";
        case 12:
            return "MANCHESTER CITY";
        case 13:
            return "MANCHESTER UNITED";
        case 14:
            return "NEWCASTLE UNITED";
        case 15:
            return "SHEFFIELD UNITED";
        case 16:
            return "SOUTHAMPTON";
        case 17:
            return "TOTTENHAM HOTSPUR";
        case 18:
            return "WEST BROMWICH ALBION";
        case 19:
            return "WEST HAM UNITED";
        case 20:
            return "WOLVERHAMPTON WANDERERS";
    }        
}

//function - change position ID to a readable string
function getPosition(id) {
    switch(id) {
        case 1:
            return "GK";
        case 2:
            return "DEF";
        case 3:
            return "MID";
        case 4:
            return "FWD";
    }
}

//function - set teams stats
async function setTeamStats (teams){
    return new Promise(async function(resolve, reject) {

        let teamStats = await fplApi.fetchBootstrap();

        let i = 0;
        for(team in teams) {
            teams[team] = {'strength': teamStats.teams[i].strength, 'attack_home': teamStats.teams[i].strength_attack_home, 'attack_away': teamStats.teams[i].strength_attack_away, 'defence_home': teamStats.teams[i].strength_defence_home, 'defence_away': teamStats.teams[i].strength_defence_away};
            i++;
        }
        resolve(teams);
    });
}
