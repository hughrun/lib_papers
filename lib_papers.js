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
const WordPOS = require('wordpos') // Word Parts of Speech for random nouns

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
  // strings longer than 2 letters with no vowels like KLF
  const regex = /(\.[a-z])|(\-[a-z])|^([bcdfghjklmnpqrstvwxyz]){3,4}$/g
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
      return x
    })
    .catch( (err) => {
      console.log(`WIKIPEDIA ERROR at ${new Date().toLocaleString('en-AU')}`)
      console.error(err)
      publish() // try again
    })

  // Get Twitter trends that aren't hashtags
  const twitter = T.get(
    'trends/place',
    {id:'23424748', exclude: 'hashtags'})
    .then( res => {
      let response = res.data[0].trends
      let trends = response.map(x => {
        return x.name
      })
      return random.pick(trends) // return a random trend
    })
    .catch( (err) => {
      console.log(`TWITTER TRENDS ERROR at ${new Date().toLocaleString('en-AU')}`)
      console.error(err)
      publish() // try again
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
      publish() // try again
    })

  // construct a title and post to twitter and masto
  // Use Promise.all() to await the three promise functions
  // Once they're all finished we end up with an array like this:
  // [wikipedia_title, twitter_trend, [wordpos1, wordpos2, wordpos3, wordpos4] ]
  Promise.all([wikipedia, twitter, nouns]).then(vals => {
    const words = [vals[0], vals[1]].concat(vals[2]) // flatten the two arrays into one
    const terms = random.sample(words, 2) // pick two random terms from the six options
    // choose the various components
    const cliche = random.pick(phrases.cliches)
    const adverb = random.pick(phrases.adverbs)
    const changeWord = random.pick(phrases.changeWords)
    const actions = random.pick(phrases.actions)
    const users = random.pick(phrases.users)
    const titles =
    [
      `Is ${terms[0]} The Future Of Libraries?`,
      `Are Libraries The Original ${terms[0]}?`,
      `Is ${terms[1]} Making Libraries Obsolete?`,
      `${adverb} Every Library Can Use ${terms[0]}`,
      `${terms[1]}: A Game Changer For Libraries`,
      `${adverb} This Year's Library Journal Movers and Shakers Are ${actions} ${terms[1]}`,
      `${adverb} Libraries Should be ${actions} ${terms[1]}`,
      `${adverb} ${terms[0]} Could Be The ${terms[1]} Of Libraries`,
      `${adverb} Our Library Used ${terms[1]} To ${changeWord} ${cliche}`,
      `Is ${terms[0]} The New ${cliche}?`,
      `Improving Library User Outcomes For ${users} With ${terms[1]}`,
      `What Our Library Learned By ${actions} ${terms[1]}`,
      `Combining ${cliche} With ${terms[1]} To Build Better Outcomes For ${users}`,
      `${adverb} Our Library Attracted More ${users} With ${terms[0]}`,
      `Working With ${users} To Put ${terms[0]} In ${cliche}`,
      `Librarians Prefer ${cliche} Over ${terms[0]}: A Longitudinal Study`
    ]

    // pick a random status construction from the list above
    const status = random.pick(titles)

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
      console.log(`POSTING ERROR at ${new Date().toLocaleString('en-AU')}`)
      console.error(error)
      // do something with the error
    })
  })
}

// Set loop to run publish() every 5 hours
const timer = setInterval (function () {publish()}, 18e+6)