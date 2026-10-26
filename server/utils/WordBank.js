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
             'kite','ladder','magnet','nest','oven'],
  wordle: [
    'acorn', 'alarm', 'album', 'alien', 'altar', 'angel', 'ankle', 'anvil', 'apple', 'apron',
    'arena', 'armor', 'arrow', 'ascot', 'atlas', 'attic', 'auger', 'bacon', 'badge', 'bagel',
    'baker', 'banjo', 'barge', 'basin', 'baton', 'beach', 'beans', 'beard', 'belly', 'bench',
    'beret', 'berry', 'bidet', 'biker', 'bingo', 'birch', 'bison', 'blimp', 'block', 'bones',
    'bongo', 'booth', 'boots', 'boxer', 'braid', 'brain', 'brake', 'bread', 'briar', 'brick',
    'bride', 'brook', 'broom', 'brush', 'bugle', 'bunny', 'cabin', 'cable', 'cacti', 'camel',
    'canal', 'candy', 'canoe', 'cargo', 'cello', 'chain', 'chair', 'chalk', 'chart', 'cheek',
    'chess', 'chest', 'chick', 'chili', 'chime', 'chimp', 'chute', 'cider', 'cigar', 'clamp',
    'cleat', 'cliff', 'cloak', 'clock', 'cloud', 'clove', 'clown', 'coach', 'cobra', 'comet',
    'condo', 'conga', 'coral', 'corgi', 'couch', 'coupe', 'crane', 'crate', 'cream', 'creek',
    'crepe', 'crest', 'crook', 'cross', 'crowd', 'crown', 'crumb', 'crust', 'crypt', 'cupid',
    'curry', 'daisy', 'dance', 'darts', 'decal', 'decoy', 'delta', 'demon', 'denim', 'depot',
    'derby', 'detox', 'devil', 'diary', 'diner', 'disco', 'divan', 'diver', 'donut', 'dowel',
    'drain', 'drake', 'drama', 'drape', 'dress', 'drill', 'drone', 'drool', 'druid', 'drums',
    'dryer', 'dummy', 'dunes', 'duvet', 'dwarf', 'eagle', 'earth', 'easel', 'elbow', 'ember',
    'envoy', 'epoxy', 'erupt', 'fairy', 'femur', 'fence', 'ferry', 'fiber', 'filet', 'flail',
    'flair', 'flake', 'flame', 'flank', 'flare', 'flash', 'flask', 'fleck', 'flint', 'flock',
    'floss', 'flour', 'flume', 'flute', 'folio', 'forge', 'forum', 'foyer', 'frame', 'friar',
    'fries', 'frill', 'frock', 'frond', 'frost', 'froth', 'fudge', 'fungi', 'gator', 'gauge',
    'gauze', 'gavel', 'gears', 'gecko', 'genie', 'ghost', 'giant', 'glade', 'gland', 'glare',
    'glass', 'glaze', 'gleam', 'glide', 'glint', 'globe', 'glove', 'gnome', 'golem', 'goose',
    'gorge', 'gouge', 'grail', 'grain', 'grape', 'graph', 'grass', 'grate', 'grave', 'gravy',
    'grief', 'grill', 'grime', 'grind', 'groin', 'groom', 'grout', 'grove', 'gruel', 'guava',
    'gulch', 'gully', 'gumbo', 'guppy', 'gypsy', 'habit', 'harem', 'harpy', 'hatch', 'haven',
    'hazel', 'heart', 'heath', 'heave', 'hedge', 'helix', 'heron', 'hinge', 'hippo', 'hoard',
    'hoist', 'holly', 'homer', 'honey', 'horde', 'horns', 'horse', 'hotel', 'hound', 'house',
    'hovel', 'hover', 'humus', 'hunch', 'hutch', 'hyena', 'icing', 'idiot', 'igloo', 'image',
    'inbox', 'index', 'ingot', 'inlay', 'inlet', 'input', 'irony', 'islet', 'ivory', 'jeans',
    'jelly', 'jetty', 'jewel', 'joint', 'joist', 'joker', 'joust', 'judge', 'juice', 'jumbo',
    'kayak', 'kazoo', 'kebab', 'khaki', 'kiosk', 'knack', 'knead', 'knelt', 'knife', 'knoll',
    'koala', 'krill', 'label', 'ladle', 'lance', 'lapel', 'laser', 'lasso', 'latch', 'lathe',
    'latte', 'leash', 'leech', 'lemon', 'lever', 'light', 'lilac', 'limbo', 'linen', 'liner',
    'liver', 'llama', 'lobby', 'locus', 'lodge', 'logic', 'login', 'lorry', 'lotus', 'louse',
    'lover', 'lumen', 'lunar', 'lunch', 'lunge', 'lyric', 'macho', 'macro', 'madam', 'mafia',
    'magic', 'magma', 'maize', 'major', 'maker', 'mambo', 'manga', 'mango', 'manor', 'manta',
    'maple', 'march', 'marsh', 'mason', 'match', 'mayor', 'mecca', 'medal', 'media', 'medic',
    'melee', 'melon', 'mercy', 'metal', 'meter', 'metro', 'micro', 'midge', 'mimic', 'mince',
    'miner', 'minor', 'miser', 'mixer', 'mocha', 'mochi', 'model', 'modem', 'mogul', 'molar',
    'money', 'month', 'moose', 'moped', 'moral', 'motel', 'motor', 'motto', 'mound', 'mount',
    'mouse', 'mouth', 'movie', 'mower', 'mucus', 'mulch', 'mummy', 'munch', 'mural', 'music',
    'nacho', 'nanny', 'navel', 'niece', 'night', 'ninja', 'noble', 'noise', 'nomad', 'noose',
    'north', 'notch', 'novel', 'nudge', 'nurse', 'nylon', 'nymph', 'oasis', 'ocean', 'olive',
    'omega', 'onion', 'opera', 'opium', 'optic', 'orbit', 'order', 'organ', 'otter', 'ounce',
    'ovary', 'oxide', 'ozone', 'paddy', 'pagan', 'paint', 'panda', 'panel', 'panic', 'pants',
    'paper', 'parka', 'party', 'pasta', 'paste', 'patch', 'patio', 'pause', 'peace', 'peach',
    'pearl', 'pecan', 'pedal', 'penne', 'penny', 'perch', 'pesto', 'petal', 'phase', 'phone',
    'photo', 'piano', 'piece', 'piggy', 'pilot', 'pinch', 'pinky', 'pinto', 'piper', 'pitch',
    'pivot', 'pixel', 'pixie', 'pizza', 'place', 'plain', 'plait', 'plane', 'plank', 'plant',
    'plate', 'plaza', 'pleat', 'plier', 'pluck', 'plumb', 'plume', 'plump', 'plush', 'point',
    'poise', 'poker', 'polar', 'polka', 'polyp', 'pooch', 'poppy', 'porch', 'posse', 'pouch',
    'pound', 'power', 'prank', 'prawn', 'press', 'price', 'prick', 'pride', 'prime', 'print',
    'prior', 'prism', 'prize', 'probe', 'prong', 'proof', 'prose', 'prowl', 'proxy', 'prune',
    'psalm', 'pulse', 'punch', 'pupil', 'puppy', 'puree', 'purse', 'pygmy', 'quail', 'quake',
    'quart', 'queen', 'query', 'quest', 'queue', 'quiet', 'quill', 'quilt', 'quirk', 'quota',
    'quote', 'rabbi', 'racer', 'radar', 'radii', 'radio', 'rainy', 'rajah', 'rally', 'ramen',
    'ranch', 'range', 'rapid', 'ratio', 'raven', 'rayon', 'razor', 'reach', 'react', 'realm',
    'rebar', 'relic', 'remix', 'rhino', 'river', 'robin', 'robot', 'rodeo', 'rotor', 'rover',
    'ruins', 'ruler', 'salad', 'salsa', 'santa', 'sauce', 'scale', 'scarf', 'screw', 'sedan',
    'shark', 'sheep', 'sheet', 'shelf', 'shell', 'shirt', 'shrub', 'sieve', 'skate', 'skirt',
    'skull', 'skunk', 'slate', 'slide', 'sloth', 'smile', 'smoke', 'snail', 'snake', 'socks',
    'solar', 'spade', 'spear', 'spool', 'spoon', 'squid', 'stage', 'stair', 'stamp', 'star',
    'steak', 'stone', 'stool', 'storm', 'stove', 'straw', 'stump', 'sushi', 'swamp', 'swing',
    'sword', 'syrup', 'table', 'tacos', 'taffy', 'talon', 'teddy', 'tepee', 'thorn', 'thumb',
    'tiger', 'timer', 'toast', 'tongs', 'tooth', 'torch', 'totem', 'towel', 'tower', 'train',
    'trash', 'trike', 'troll', 'truck', 'trunk', 'tulip', 'tunic', 'tusks', 'udder', 'valve',
    'vault', 'vinyl', 'viper', 'visor', 'wafer', 'wagon', 'watch', 'wedge', 'whale', 'wheat',
    'wheel', 'whisk', 'winch', 'wings', 'wiper', 'witch', 'wreck', 'wrist', 'yacht', 'zebra'
  ]
};

async function getWordChoices(settings) {
  const { gameMode, selectedGenres, customWords, wordCount = 3 } = settings;

  // Try Gemini AI first (returns null if key missing, mode is custom/wordle, or API fails)
  const aiWords = await generateAIWords(settings);
  if (aiWords) return aiWords;

  // --- Static fallback ---
  let pool = [];

  if (gameMode === 'wordle') {
    pool = [...wordBank.wordle];
  } else if (gameMode === 'custom') {
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