// server/utils/WordBank.js

const { generateAIWords } = require('../services/aiWordGenerator');

const wordBank = {
  animals: ['elephant','giraffe','platypus','chameleon','octopus','penguin','flamingo',
            'rhinoceros','chimpanzee','crocodile','jellyfish','kangaroo','wolverine',
            'armadillo','narwhal','axolotl','capybara','pangolin','meerkat','peacock'],
  foodAndDrink: ['sushi','taco','milkshake','croissant','avocado','burrito','dumplings',
                 'paella','tiramisu','pretzel','waffle','nachos','ramen','churros',
                 'fondue','smoothie','quesadilla','bruschetta','macaroon','empanada'],
  nature: ['thunderstorm','waterfall','avalanche','volcano','rainbow','tornado','glacier',
           'canyon','tsunami','eclipse','tundra','swamp','coral reef','desert','blizzard',
           'geyser','stalactite','mangrove','aurora','dune'],
  entertainment: ['lightsaber','superhero','blockbuster','sitcom','screenplay','animation',
                  'podcast','documentary','cliffhanger','director','audition','stuntman',
                  'cameo','monologue','sequel','hologram','ventriloquist','intermission'],
  videoGames: ['controller','dungeon','respawn','inventory','checkpoint','leaderboard',
               'boss fight','loot box','speedrun','glitch','crafting','open world',
               'achievement','tutorial','multiplayer','hitpoints','stealth','cutscene'],
  anime: ['samurai','mecha','shinobi','isekai','protagonist','bento','sensei','dojo',
          'katana','torii','onigiri','cosplay','filler','arc','power level',
          'tournament','transformation','flashback','rivalry','guild'],
  historical: ['pharaoh','gladiator','astronaut','pioneer','renaissance','colosseum',
               'guillotine','catapult','scroll','aqueduct','hieroglyphics','chariot',
               'trebuchet','longbow','compass','printing press','siege','dynasty'],
  brands: ['logo','trademark','advertisement','mascot','slogan','billboard','jingle',
           'packaging','sponsorship','endorsement','franchise','rebrand','campaign',
           'tagline','storefront','loyalty card','commercial','merchandise','coupon'],
  space: ['blackhole','nebula','asteroid','galaxy','cosmonaut','supernova','comet',
          'orbit','satellite','telescope','rover','spacewalk','docking','wormhole',
          'dark matter','quasar','solar flare','exoplanet','launch pad','reentry'],
  idioms: ['piece of cake','under the weather','bite the bullet','break a leg',
           'spill the beans','hit the sack','beat around the bush',
           'costs an arm and a leg','let the cat out of the bag','kick the bucket',
           'once in a blue moon','barking up the wrong tree','miss the boat',
           'on thin ice','pull someones leg','burning bridges','cutting corners',
           'hit the nail on the head','blessing in disguise','bite off more than you can chew'],
  standard: ['apple','bicycle','castle','dragon','explosion','fireplace','guitar',
             'hospital','island','jungle','kangaroo','lighthouse','mountain','notebook',
             'ocean','parachute','quicksand','robot','submarine','treasure','umbrella',
             'volcano','waterfall','xylophone','yacht','zipper','bridge','compass',
             'doorbell','envelope','fountain','ghost','hammer','igloo','jigsaw',
             'kite','ladder','magnet','nest','oven']
};

async function getWordChoices(settings) {
  const { gameMode, selectedGenres, customWords, wordCount = 3 } = settings;

  // Try Gemini AI first (returns null if key missing, mode is custom/wordle, or API fails)
  const aiWords = await generateAIWords(settings);
  if (aiWords) return aiWords;

  // --- Static fallback ---
  let pool = [];

  if (gameMode === 'custom') {
    pool = [...(customWords || [])];

  } else if (gameMode === 'genre' && selectedGenres && selectedGenres.length > 0) {
    selectedGenres.forEach(genre => {
      // "Food & Drink" → "foodanddrink", "Anime & Manga" → "animemanga"
      const key = genre.toLowerCase().replace(/[^a-z]/g, '');
      // Handle the key mapping manually since some names differ
      const keyMap = {
        'animals':          'animals',
        'fooddrink':        'foodAndDrink',
        'nature':           'nature',
        'entertainment':    'entertainment',
        'videogames':       'videoGames',
        'animemanga':       'anime',
        'historicalfigures':'historical',
        'brandslogos':      'brands',
        'spacescifi':       'space',
        'idioms':           'idioms',
      };
      const bankKey = keyMap[key];
      if (bankKey && wordBank[bankKey]) {
        pool = [...pool, ...wordBank[bankKey]];
      }
    });

  } else {
    // Standard mode — pool from all categories
    Object.values(wordBank).forEach(list => {
      pool = [...pool, ...list];
    });
  }

  // Deduplicate, shuffle, return wordCount+1 choices
  const unique = [...new Set(pool)];
  const shuffled = unique.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, wordCount + 1);
}

module.exports = { wordBank, getWordChoices };