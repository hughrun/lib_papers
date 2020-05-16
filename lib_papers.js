/* #####################################################################
    Library Conference - a twitter and mastodon bot
    Copyright (C) 2017 - 2019 Hugh Rundle

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    To contact Hugh:
    * Twitter @hughrundle
    * Mastodon @hugh@ausglam.space
    * email hugh [at] hughrundle [dot] net
 ##################################################################### */

// require modules
const axios = require('axios') // axios to make http requests to wikipedia
const Masto = require('mastodon') // For interacting with the Mastodon API
const { Random } = require('random-js') // for random choices: Math.random is unreliable
const Twit = require('twit') // For interacting with the Twitter API
const WordPOS = require('wordpos') // Word Parts Of Speech for random nouns
const feedparser = require('feedparser-promised'); // for parsing RSS/Atom

// require locals
const phrases = require('./phrases.js') // phrases is now a module rather than the text file in verson 1
const settings = require('./settings.json') // keep twitter and mastodon secrets out of github

// initiate wordpos
wordpos = new WordPOS();

// initiate random
const random = new Random()

// initiate twit
const T = new Twit({
  consumer_key: settings.TWITTER_CONSUMER_KEY,
  consumer_secret: settings.TWITTER_CONSUMER_SECRET,
  access_token: settings.TWITTER_ACCESS_TOKEN,
  access_token_secret: settings.TWITTER_ACCESS_TOKEN_SECRET
})

// initiate masto
var M = new Masto({
  access_token: settings.MASTO_TOKEN,
  timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
  api_url: `${settings.MASTO_URL}/api/v1/`
})

// title case - capitalise each word in the string
const titleCase = function (string) {
  var phrase = ""
  // Capitalise
  // abbreviations like E.P.A.
  // Hyphenated-Words
  // where they are 2 to 3 letter words
  const regex = /(\.[a-z])|(\-[a-z])|^([a-z]){2,3}$/g
  string = string.replace(regex, function(x) {
    return x.toUpperCase()
  })
  var arr = string.split(" ");
  for (i=0; i < arr.length; i++) {
    str = arr[i];
    var first = str[0];
    // if the word includes a quote mark at the start, capitalise the next character instead
    if (first === '"' || first === "'") {
      try {
        newStr = str.charAt(0) + str.charAt(1).toUpperCase() + str.slice(2);
      } catch (err) {
        console.log(`ERROR titlecasing at ${new Date().toLocaleString('en-AU')}`)
        console.error(err)
        publish() // try again
      }

    // if it's already capitalised, just send it back - this avoids dropping the case on an acronym
    // note this will also mean we ignore numbers
  } else if (first && first == first.toUpperCase()){
      newStr = str;
    } else {
      try {
        newStr = str.charAt(0).toUpperCase() + str.slice(1);
      } catch (err) {
        console.log(`ERROR titlecasing at ${new Date().toLocaleString('en-AU')}`)
        console.error(err)
        publish() // try again
      }
    }
    phrase += (" " + newStr);
  }
    return phrase.trim();
}

// return functions for wikipedia Promise
const success = function(res){
  data = (res.data.query && res.data.query.random[0].title) ? res.data.query.random[0].title : 'ERROR'
  return data
}

const failure = function(res) {
  return res.status
}

// this is where the action is
function publish() {
  // get a random Wikipedia page title using the API
  const url = 'https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json'
  const wikipedia = axios.get(url).then(success, failure)
    .then(x => {
      return titleCase(x)
    })
    .catch( (err) => {
      console.log(`WIKIPEDIA ERROR at ${new Date().toLocaleString('en-AU')}`)
      console.error(err)
      return 'Internet' // default value on error
    })

  // use wordpos to get four random nouns
  const nouns = wordpos.randNoun({count: 4})
    .then( x => {
      let spacer = x.map(n => n.replace(/_/g, ' ')) // replace underscores with spaces
      let nouns = spacer.map(n => titleCase(n)) // Title case words
      return nouns
    })
    .catch( (err) => {
      console.log(`WORDPOS ERROR at ${new Date().toLocaleString('en-AU')}`)
      console.error(err)
      return ['Books', 'Revolution'] // default value on error
    })

  const theAge = feedparser.parse('https://www.theage.com.au/rss/technology.xml')
                    .then( items => {
                      let picks = random.sample(items, 4) // pick four random headlines
                      let headlines = picks.map(item => titleCase(item.title))
                      return headlines
                    })
                    .catch( err => {
                      console.error(err)
                      return ['The Age RSS Feed is Down', 'No Technology News From Fairfax']
                    })

  // construct a title and post to twitter and masto
  // Use Promise.all() to await the three promise functions

  Promise.all([nouns, wikipedia, theAge]).then(vals => {
    const words = vals[0].concat([vals[1]]) // flatten the nouns array and combine with wikipedia title in a new array
    const headlines = vals[2]
    const terms = random.sample(words, 2) // pick two random terms from the options
    // choose the various components
    const cliche = random.pick(phrases.cliches)
    const adverb = random.pick(phrases.adverbs)
    const changeWord = random.pick(phrases.changeWords)
    const actions = random.pick(phrases.actions)
    const users = random.pick(phrases.users)
    const titlesOne =
    [
      `Is ${random.pick(terms)} The Future Of Libraries?`,
      `Are Libraries The Original ${random.pick(terms)}?`,
      `Is ${random.pick(terms)} Making Libraries Obsolete?`,
      `${adverb} Every Library Can Use ${random.pick(terms)}`,
      `${random.pick(terms)}: A Game Changer For Libraries`,
      `${adverb} This Year's Library Journal Movers and Shakers Are ${actions} ${random.pick(terms)}`,
      `${adverb} Libraries Should be ${actions} ${random.pick(terms)}`,
      `${adverb} ${terms[0]} Could Be The ${terms[1]} Of Libraries`,
      `${adverb} Our Library Used ${random.pick(terms)} To ${changeWord} ${cliche}`,
      `Is ${random.pick(terms)} The New ${cliche}?`,
      `Improving Library User Outcomes For ${users} With ${random.pick(terms)}`,
      `What Our Library Learned By ${actions} ${random.pick(terms)}`,
      `Combining ${cliche} With ${random.pick(terms)} To Build Better Outcomes For ${users}`,
      `${adverb} Our Library Attracted More ${users} With ${random.pick(terms)}`,
      `Working With ${users} To Put ${random.pick(terms)} In ${cliche}`,
      `Librarians Prefer ${cliche} Over ${random.pick(terms)}: A Longitudinal Study`
    ]

    const titlesTwo = [
      `${random.pick(headlines)} - Ramifications for ${users}`,
      `${random.pick(headlines)} - Librarians ${random.pick(["Aren't Impressed", "Are Embracing It", "Are In Disarray", "Are Ready"])}`,
      `${random.pick(headlines)} - But ${adverb} are Librarians ${actions} ${random.pick(terms)}?`,
      `${random.pick(headlines)} - Is This ${adverb} Librarians are ${actions} ${cliche}?`,
      `${random.pick(headlines)} - ${adverb} Libraries are Preparing ${users}`,
      `${random.pick(headlines)} - Is This the End of ${cliche}?`
    ]

    // pick a random status construction from the list above
    const status = random.pick(random.pick([titlesOne, titlesTwo]))
    // post to mastodon
    M.post('statuses', { status: status})
    .then( () => {
      // post to twitter
      T.post('statuses/update', { status: status})
    })
    .then( () => {
      // log
      console.log(`"${status}" posted at ${new Date().toLocaleString('en-AU')}`)
    })
    .catch( (err) => {
      console.log(`ERROR POSTING at ${new Date().toLocaleString('en-AU')}`)
      console.error(err)
      console.log('\n')
    })
  })
}

// post on load
publish()
// Set loop to run publish() every 5 hours
const timer = setInterval (function () {publish()}, 18e+6)