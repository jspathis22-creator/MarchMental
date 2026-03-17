// ===== ESPN IDs =====
export const TEAM_IDS = {Duke:150,Arizona:12,Michigan:130,Florida:57,UConn:41,Purdue:2509,"Iowa State":66,Houston:248,"Michigan State":127,Gonzaga:2250,Virginia:258,Illinois:356,Kansas:2305,Arkansas:8,Alabama:333,Nebraska:158,"St. John's":2599,Wisconsin:275,"Texas Tech":2641,Vanderbilt:238,Louisville:97,BYU:252,Tennessee:2633,"North Carolina":153,UCLA:26,"Ohio State":194,Kentucky:96,"Miami FL":2390,Georgia:61,Iowa:2294,"Saint Louis":139,UCF:2116,"Utah State":328,"South Florida":58,VCU:2670,"NC State":152,Texas:251,SMU:2567,"Miami OH":193,"Northern Iowa":2460,McNeese:2377,"High Point":2272,Hofstra:2275,"Cal Baptist":2856,Troy:2653,Akron:2006,Hawaii:62,"North Dakota State":2449,Penn:219,"Wright State":2750,Furman:231,Siena:2561,UMBC:2692,Howard:47,LIU:2344,Lehigh:2348,"Prairie View A&M":2504,"Kennesaw State":338,Idaho:70,"Tennessee State":2590,"Queens NC":3101,"Santa Clara":2491,Villanova:222,Clemson:228,Missouri:142,"Texas A&M":245,"Saint Mary's":2608,"Hofstra":2275};

export const PLAYER_IDS = {"Cameron Boozer":5041935,"Cayden Boozer":5041937,"Isaiah Evans":5061585,"Brayden Burries":5082206,"Koa Peat":5041953,"Jaden Bradley":4432737,"Yaxel Lendeborg":5175737,"Thomas Haugh":5080489,"Kingston Flemings":5149077,"Emanuel Sharp":5106058,"Graham Ike":4703396,"AJ Dybantsa":5142718,"Labaron Philon Jr":4873090,"Jeremy Fears Jr":4711255,"Braden Smith":5105854,"Fletcher Loyer":5105853,"Milan Momcilovic":4848637,"Joshua Jefferson":4870564,"Tamin Lipsey":5106254,"Darryn Peterson":5041955,"Alex Karaban":4917149,"Solo Ball":4895737,"Tarris Reed Jr":5105809,"Ryan Conwell":5107157,"Darius Acuff Jr":5142620,"Keaton Wagler":5254165,"Pryce Sandfort":4858604,"Alex Condon":5174657,"Boogie Fland":5238195,"Rueben Chinyelu":5174971,"Xaivian Lee":5107169,"Christian Anderson":5060701,"Tyler Tanner":5187600,"Duke Miles":4702049,"Ja'Kobi Gillespie":5107968,"Zuby Ejiofor":5106262,"Nick Boyd":4702654,"Elliot Cadeau":4869764,"Morez Johnson Jr":4873153,"Aday Mara":5174983,"Motiejus Krivas":5174954,"Trey Kaufman-Renn":5105855,"Bruce Thornton":4711257,"Jaxon Kohler":4898392,"Seth Trimble":4870570,"Andrej Stojakovic":5106044,"Bryce Hopkins":4870560,"David Mirkovic":5175740,"Bennett Stirtz":5107782,"Patrick Ngongba":4873209,"Braylon Mullins":5196916,"Flory Bidunga":5044426,"Kylan Boswell":4684269,"Trey McKenney":5041954,"Donovan Dent":5107782,"John Blackwell":5103630,"TJ Power":5105860,"Nate Ament":5164559,"Milos Uzan":5106272,"Otega Oweh":5174970,"Joseph Tugler":5060700,"Tavari Johnson":5107355,"Robert Wright III":5060709,"Cruz Davis":5196920,"Tyler Bilodeau":5175005,"Oscar Cluff":5107160,"Malik Reneau":4895747,"Tomislav Ivisic":5313010};

export const teamLogo = (t) => TEAM_IDS[t] ? `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${TEAM_IDS[t]}.png&w=64&h=64` : "";
export const playerImg = (n) => PLAYER_IDS[n] ? `https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${PLAYER_IDS[n]}.png` : "";

// ===== SEED DESIGNATIONS =====
export const SEED6_TEAMS = ["Louisville","BYU","Tennessee","North Carolina"];
export const SEED11_TEAMS = ["South Florida","VCU","NC State","Texas","SMU","Miami OH"];

// ===== PLAYER BUILDER =====
const P = (name, team, seed, ppg, pos, hi, threes) => ({
  name, team, seed, ppg, pos, hi, threes,
  pts: 0, eliminated: false, games: [], gamesPlayed: 0
});

// ===== DRAFTERS =====
export const DRAFTERS = ["Edel","Iger","Feder","Warren","Spathis","Glover","Jeff","Clay","Sack","Stein","Rob","Ghost of Tib"];

// ===== FULL DRAFT BOARD - 88 PICKS =====
export const PICKS = {
  Edel: [
    P("Cameron Boozer","Duke",1,22.7,"F",38,5),
    P("Jeremy Fears Jr","Michigan State",3,15.5,"G",28,3),
    P("Boogie Fland","Florida",1,11.6,"G",24,5),
    P("Rueben Chinyelu","Florida",1,11.4,"C",22,0),
    P("Xaivian Lee","Florida",1,11.6,"G",26,4),
    P("Tyler Bilodeau","Arizona",1,10.5,"F",20,2),
    P("Terry Anderson","Houston",2,8.2,"G",18,3),
    P("Latrell Wrightsell","Duke",1,8.8,"G",22,4),
  ],
  Iger: [
    P("Yaxel Lendeborg","Michigan",1,14.3,"F",26,2),
    P("Emanuel Sharp","Houston",2,15.8,"G",30,7),
    P("Ryan Conwell","Louisville",6,18.7,"G",34,6),
    P("Duke Miles","Vanderbilt",5,15.9,"G",28,4),
    P("Motiejus Krivas","Arizona",1,8.0,"C",16,0),
    P("Dailyn Swain","Duke",1,7.5,"G",16,3),
    P("Dame Sarr","Kentucky",8,9.4,"G",18,2),
    P("Tomislav Ivisic","UConn",2,11.2,"C",22,1),
  ],
  Feder: [
    P("Thomas Haugh","Florida",1,17.2,"F",32,3),
    P("Koa Peat","Arizona",1,13.8,"F",28,2),
    P("Morez Johnson Jr","Michigan",1,8.7,"F",18,1),
    P("Ja'Kobi Gillespie","Tennessee",6,18.0,"G",34,5),
    P("Fletcher Loyer","Purdue",2,13.6,"G",28,7),
    P("Tavari Johnson","Akron",13,17.6,"G",32,5),
    P("Carson Cooper","Michigan",1,7.8,"C",14,0),
    P("Joseph Tugler","Houston",2,8.0,"C",16,0),
  ],
  Warren: [
    P("Darius Acuff Jr","Arkansas",4,22.2,"G",49,6),
    P("Trey Kaufman-Renn","Purdue",2,12.8,"F",24,1),
    P("Tarris Reed Jr","UConn",2,13.8,"C",26,0),
    P("Christian Anderson","Texas Tech",5,19.2,"G",42,7),
    P("Pryce Sandfort","Nebraska",4,17.9,"G",30,6),
    P("Oscar Cluff","BYU",6,8.4,"G",16,2),
    P("Dominique Daniels","Arkansas",4,6.8,"G",14,2),
    P("Mikey Lewis","Kansas",4,8.5,"G",20,3),
  ],
  Spathis: [
    P("Brayden Burries","Arizona",1,16.0,"G",30,5),
    P("Milan Momcilovic","Iowa State",2,17.0,"G",32,8),
    P("Tyler Tanner","Vanderbilt",5,19.2,"G",34,5),
    P("Alex Karaban","UConn",2,12.9,"F",24,3),
    P("Bruce Thornton","Ohio State",8,16.2,"G",28,4),
    P("Paulius Murauskas","Michigan State",3,8.8,"F",18,2),
    P("Patrick Ngongba","Duke",1,10.7,"F",20,1),
    P("Jaron Pierre Jr","Michigan State",3,8.5,"G",18,3),
  ],
  Glover: [
    P("Isaiah Evans","Duke",1,14.5,"G",26,4),
    P("Braden Smith","Purdue",2,14.9,"G",24,3),
    P("Aday Mara","Michigan",1,7.5,"C",14,0),
    P("Tamin Lipsey","Iowa State",2,13.3,"G",22,2),
    P("Thijs de Ridder","Virginia",3,14.2,"F",24,3),
    P("Robert Wright III","BYU",6,14.8,"G",26,4),
    P("Cruz Davis","Hofstra",12,13.1,"G",24,4),
    P("Cayden Boozer","Duke",1,6.5,"G",16,2),
  ],
  Jeff: [
    P("Jaden Bradley","Arizona",1,13.4,"G",24,3),
    P("Alex Condon","Florida",1,14.8,"F",28,3),
    P("Andrej Stojakovic","Illinois",3,12.6,"F",24,4),
    P("Bryce Hopkins","Kentucky",8,14.2,"F",26,2),
    P("Nate Ament","Tennessee",6,16.4,"F",28,1),
    P("Wes Enis","Iowa State",2,6.8,"G",14,2),
    P("Braylon Mullins","UConn",2,10.2,"G",22,4),
    P("Izaiyah Nelson","Florida",1,5.4,"F",12,0),
  ],
  Clay: [
    P("Kingston Flemings","Houston",2,16.5,"G",42,5),
    P("Darryn Peterson","Kansas",4,19.9,"G",34,5),
    P("David Mirkovic","Nebraska",4,8.5,"F",16,2),
    P("Ivan Kharchenkov","Georgia",8,9.2,"F",18,1),
    P("Milos Uzan","Houston",2,11.5,"G",20,2),
    P("Malik Reneau","Alabama",4,10.8,"F",22,1),
    P("Chris Cenac Jr","Alabama",4,7.2,"F",14,1),
    P("Kylan Boswell","Illinois",3,13.3,"G",24,3),
  ],
  Sack: [
    P("Graham Ike","Gonzaga",3,19.7,"C",32,0),
    P("Keaton Wagler","Illinois",3,17.9,"G",46,7),
    P("Zuby Ejiofor","St. John's",5,16.0,"C",28,0),
    P("Jaxon Kohler","Michigan State",3,10.2,"F",20,1),
    P("Otega Oweh","Kentucky",8,15.4,"G",26,3),
    P("Rienk Mast","Wisconsin",5,9.6,"F",18,1),
    P("Trevon Brazile","Alabama",4,7.8,"F",16,1),
    P("Trey McKenney","Michigan",1,12.1,"G",22,3),
  ],
  Stein: [
    P("AJ Dybantsa","BYU",6,23.1,"F",43,6),
    P("Joshua Jefferson","Iowa State",2,16.6,"F",28,2),
    P("Solo Ball","UConn",2,13.9,"G",26,4),
    P("Elliot Cadeau","Michigan",1,9.8,"G",18,2),
    P("Meleek Thomas","Ohio State",8,14.8,"G",28,5),
    P("John Blackwell","Wisconsin",5,18.3,"G",32,4),
    P("Terrence Hill Jr","NC State",11,12.4,"G",24,4),
    P("Boopie Miller","Illinois",3,8.2,"G",18,3),
  ],
  Rob: [
    P("Labaron Philon Jr","Alabama",4,21.5,"G",36,5),
    P("Nick Boyd","Wisconsin",5,11.7,"G",22,4),
    P("Seth Trimble","North Carolina",6,10.8,"G",22,3),
    P("Bennett Stirtz","Iowa",9,14.5,"G",28,5),
    P("Coen Carr","Michigan State",3,8.4,"G",18,2),
    P("TJ Power","Penn",14,18.7,"F",44,4),
    P("Flory Bidunga","Kansas",4,11.2,"C",18,0),
    P("Donovan Dent","UCLA",7,15.8,"G",28,4),
  ],
  "Ghost of Tib": [],
};

// ===== TOURNAMENT BRACKET (for matchup info) =====
export const BRACKET = {
  East: [
    {seed:1,team:"Duke",opp:"Siena",oppSeed:16,date:"Mar 19",time:"TBD",location:"Greenville"},
    {seed:8,team:"Ohio State",opp:"TCU",oppSeed:9,date:"Mar 19",time:"TBD",location:"Greenville"},
    {seed:5,team:"St. John's",opp:"Northern Iowa",oppSeed:12,date:"Mar 19",time:"TBD",location:"San Diego"},
    {seed:4,team:"Kansas",opp:"Cal Baptist",oppSeed:13,date:"Mar 19",time:"TBD",location:"San Diego"},
    {seed:6,team:"Louisville",opp:"South Florida",oppSeed:11,date:"Mar 19",time:"TBD",location:"Buffalo"},
    {seed:3,team:"Michigan State",opp:"North Dakota State",oppSeed:14,date:"Mar 19",time:"TBD",location:"Buffalo"},
    {seed:7,team:"UCLA",opp:"UCF",oppSeed:10,date:"Mar 20",time:"TBD",location:"Philadelphia"},
    {seed:2,team:"UConn",opp:"Furman",oppSeed:15,date:"Mar 20",time:"TBD",location:"Philadelphia"},
  ],
  South: [
    {seed:1,team:"Florida",opp:"Prairie View A&M/Lehigh",oppSeed:16,date:"Mar 20",time:"TBD",location:"Tampa"},
    {seed:8,team:"Clemson",opp:"Iowa",oppSeed:9,date:"Mar 20",time:"TBD",location:"Tampa"},
    {seed:5,team:"Vanderbilt",opp:"McNeese",oppSeed:12,date:"Mar 20",time:"TBD",location:"Oklahoma City"},
    {seed:4,team:"Nebraska",opp:"Troy",oppSeed:13,date:"Mar 20",time:"TBD",location:"Oklahoma City"},
    {seed:6,team:"North Carolina",opp:"Miami OH/SMU",oppSeed:11,date:"Mar 19",time:"TBD",location:"Greenville"},
    {seed:3,team:"Illinois",opp:"Kennesaw State",oppSeed:14,date:"Mar 19",time:"TBD",location:"Greenville"},
    {seed:7,team:"Santa Clara",opp:"Saint Mary's",oppSeed:10,date:"Mar 20",time:"TBD",location:"St. Louis"},
    {seed:2,team:"Houston",opp:"Idaho",oppSeed:15,date:"Mar 20",time:"TBD",location:"St. Louis"},
  ],
  Midwest: [
    {seed:1,team:"Michigan",opp:"UMBC/Howard",oppSeed:16,date:"Mar 20",time:"TBD",location:"Portland"},
    {seed:8,team:"Georgia",opp:"Missouri",oppSeed:9,date:"Mar 20",time:"TBD",location:"Portland"},
    {seed:5,team:"Texas Tech",opp:"High Point",oppSeed:12,date:"Mar 19",time:"TBD",location:"Oklahoma City"},
    {seed:4,team:"Alabama",opp:"Akron",oppSeed:13,date:"Mar 19",time:"TBD",location:"Oklahoma City"},
    {seed:6,team:"Tennessee",opp:"Texas/NC State",oppSeed:11,date:"Mar 20",time:"TBD",location:"St. Louis"},
    {seed:3,team:"Virginia",opp:"Penn",oppSeed:14,date:"Mar 20",time:"TBD",location:"St. Louis"},
    {seed:7,team:"Villanova",opp:"Texas A&M",oppSeed:10,date:"Mar 19",time:"TBD",location:"Buffalo"},
    {seed:2,team:"Iowa State",opp:"Tennessee State",oppSeed:15,date:"Mar 19",time:"TBD",location:"Buffalo"},
  ],
  West: [
    {seed:1,team:"Arizona",opp:"LIU",oppSeed:16,date:"Mar 20",time:"TBD",location:"San Diego"},
    {seed:8,team:"Kentucky",opp:"Saint Louis",oppSeed:9,date:"Mar 20",time:"TBD",location:"San Diego"},
    {seed:5,team:"Wisconsin",opp:"Hofstra",oppSeed:12,date:"Mar 19",time:"TBD",location:"Portland"},
    {seed:4,team:"Arkansas",opp:"Hawaii",oppSeed:13,date:"Mar 19",time:"TBD",location:"Portland"},
    {seed:6,team:"BYU",opp:"VCU/SMU",oppSeed:11,date:"Mar 20",time:"TBD",location:"Tampa"},
    {seed:3,team:"Gonzaga",opp:"Wright State",oppSeed:14,date:"Mar 20",time:"TBD",location:"Tampa"},
    {seed:7,team:"Miami FL",opp:"Utah State",oppSeed:10,date:"Mar 19",time:"TBD",location:"Philadelphia"},
    {seed:2,team:"Purdue",opp:"Queens NC",oppSeed:15,date:"Mar 19",time:"TBD",location:"Philadelphia"},
  ],
};
