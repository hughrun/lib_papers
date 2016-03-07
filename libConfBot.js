 // #####################################
// Library Conference Papers Bot v 1.1 ##
// ######################################

// Create a simple server to keep the bot running
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Library Conference Proposals Bot\n');
}).listen(8080);

// REQUIRE packages
 require('dotenv').load();
var random = require("random-js")();
var fs =require("fs");
var request = require("request");
var FeedParser = require ("feedparser");
var WordPOS = require('wordpos');
var Twit = require('twit');

// initiate wordpos
wordpos = new WordPOS();

// initiate simple-twitter
var T = new Twit({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// capitalisation function
var capitalise = function(x) {
    return x.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

// stop words - if any of these are in the words from Reuters, we try again.
stopWords = ['by', 'Exclusive','Exclusive:','opinion','Opinion:','says','say','source','Source','sources','Sources','to']
// function to check
function checkStopWords(arr, val) {
    return arr.some(function(arrVal) {
        return val === arrVal;
    });
};

// Set timeout to loop the whole thing every 2.1 hours
var timerVar = setInterval (function () {writeAbstracts()}, 7.56e+6);

// Run the bot when the timer expires
function writeAbstracts() {

var sArray = []

	// set a Date variable for yesterday.
	var dateNow = new Date();
	var newest = dateNow - 8.64e+7;

	// generate a random value between 1 and however many lines there are in the phrases.txt file, minus one
	var intgr = random.integer(1, 60);
	// use the random value to pick a line from the phrases.txt file.
	var phrases = fs.readFileSync('phrases.txt').toString().split('\n');
	cliche = phrases[intgr];

	// Get Reuters tech news from their RSS feed
	var req = request("http://feeds.reuters.com/reuters/technologyNews");
	var feedparser = new FeedParser();

	// deal with any errors in FeedParser
	req.on('error', function (error) {
	  console.error(error); 
	});

	req.on('response', function (res) {
	  var stream = this;
	  // deal with any errors in the feed
	  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
	  stream.pipe(feedparser);
	});

	// deal with any errors in the code
	feedparser.on('error', function(error) {
	  console.error(error); 
	});

	feedparser.on('readable', function() {
	  // here we go... 
	  var stream = this
	      , meta = this.meta
	      , item;	

	  while (item = stream.read()) {
		t = item.title;

			// split the headline into an array of words
			var pHead = t.split(" ");
			// Get the first, second and last words.
			// If any of them match the stopWords list, simply get rid of it.
			// get the first word
			var newTitleOne = pHead[0];
			var noGood = checkStopWords(stopWords, newTitleOne);
			if (noGood) {
				newTitleOne = "";
			};				
			// get second word
			var newTitleTwo = pHead[1];
			var noGoodTwo = checkStopWords(stopWords, newTitleTwo);
			if (noGoodTwo) {
				newTitleTwo = "";
			} else newTitleTwo = " " + newTitleTwo;
			// get the last word
			var sEnd = pHead.length;
			var end = sEnd - 1;
			var	lastWord = pHead[end];
			var noGoodLast = checkStopWords(stopWords, lastWord);
			if (noGoodLast) {
				lastWord = "";
			} else lastWord = " " + lastWord;

			var newStr = newTitleOne + newTitleTwo + lastWord;
			// make a sentence and push to sArray
			var mySentence = newStr + ': what it means for ' + cliche + '.';			
			sArray.push(mySentence);
			// the feed will have 20 headlines, so once we've got that many we choose one at random
			if (sArray.length > 19) {
				var x = random.integer(0,19);
				choice = sArray[x];
				var option1 = '\n' + choice;
				// then we push it to the options.txt file
				fs.appendFileSync('options.txt', option1);
			}
		}
	});
	// generate some random nouns.
	var rNoun = wordpos.randNoun({count: 2}, function(rN){
		// define a variable to find underscores
		var cleanup = /_/g;
		// use it to replace underscores with spaces in each noun
		// we need to do this because wordpos creates them with underscores
		var noun1 = rN[0];
		var noun2 = rN[1];
		var cleanFirst = noun1.replace(cleanup, " ");
		var cleanSecond = noun2.replace(cleanup, " ");
		// initial capitalise
		var capOne = capitalise(cleanFirst);
		var capTwo = capitalise(cleanSecond);
		// if it's a three-letter word, it's probably a TLA so capitalise it.
		if (capOne.length == 3) {
			var cleanOne = capOne.toUpperCase();
		} else var cleanOne = capOne;
		if (capTwo.length == 3) {
			var cleanTwo = capTwo.toUpperCase();
		} else var cleanTwo = capTwo;
		// check for abbreviations
		var oneHasDots = /\w\./ig.test(cleanOne);
		var twoHasDots = /\w\./ig.test(cleanTwo);
		if (oneHasDots) {
			var clean1 = cleanOne.toUpperCase();
		} else var clean1 = cleanOne;
		if (twoHasDots) {
			var clean2 = cleanTwo.toUpperCase();
		} else var clean2 = cleanTwo;

		// randomly choose one of the top ten trending topics from Australian Twitter
		// remember if you're testing this that you can only hit the REST API 15 times
		// each 15 minutes (i.e. once every 60000 milliseconds)
		var rTrend = random.integer(1,11);
		var rT = rTrend - 1;
		T.get('trends/place', {id:'23424748'}, function(err, data, response){
			var trends = data[0];
			var tTopic = trends.trends[rT].name;
			// add a second sentence to options.txt
			var Option2 = '\n' + "How " + tTopic + " Can Transform " + cliche + ".";
			fs.appendFileSync('options.txt', Option2);
		});

		// append the final two sentences to options.txt
		var pairs = ["Why " + clean1 + " Could be the " + clean2 + " of Libraries.", "How Libraries are Bringing " + clean1 + " and " + clean2 + " Together at Last."]
		var Option3 = '\n' + random.pick(pairs);
		fs.appendFileSync('options.txt', Option3);
		var futurePast = ["Is " + clean1 + " the Future of Libraries?","Are Libraries the Original " + clean1 + "?"]
		var Option4 = '\n' + random.pick(futurePast);
		fs.appendFileSync('options.txt', Option4);

	});

	// generate a random value between 1 and however many lines there are in the phrases.txt file
	var k = random.integer(1, 4);
	// use the random value to pick one of the lines we created in the phrases.txt file.
	var options = fs.readFileSync('options.txt').toString().split('\n');
	tweet = options[k];

	//tweet the title!
	T.post('statuses/update', {status: tweet}, function(err, data, response){
		if (err) {
			console.log(err);
		}
	})

	// record when it looped to help with troubleshooting if needed
	var loopDate = new Date();
	console.log('looped at ' + loopDate);

	// clear out the file for the next run.
	fs.writeFileSync('options.txt', " ");
}