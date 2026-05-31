const genres = {
  animals: {
    label: 'Animals',
    prompt: 'a real animal, creature, or living organism from nature. Examples: Elephant, Platypus, Axolotl. Keep it to one or two words maximum.'
  },
  foodAndDrink: {
    label: 'Food & Drink',
    prompt: 'a food item, dish, or drink from any culture. Examples: Sushi, Bubble Tea, Croissant. Keep it to one or two words maximum.'
  },
  natureWeatherGeography: {
    label: 'Nature, Weather & Geography',
    prompt: 'a natural phenomenon, weather event, or geographical feature. Examples: Thunderstorm, Waterfall, Glacier. Keep it to one or two words maximum.'
  },
  entertainmentAndMedia: {
    label: 'Entertainment & Media',
    prompt: 'something related to movies, TV, music, theater or entertainment. Examples: Lightsaber, Karaoke, Red Carpet. Keep it to one to three words maximum.'
  },
  videoGames: {
    label: 'Video Games',
    prompt: 'a video game character, item, mechanic or concept. Examples: Mario, Boss Fight, Speed Run. Keep it to one or two words maximum.'
  },
  animeAndManga: {
    label: 'Anime & Manga',
    prompt: 'a character, item, concept or trope from anime or manga. Examples: Naruto, Final Form, Training Arc. Keep it to one to three words maximum.'
  },
  historicalAndModernFigures: {
    label: 'Historical & Modern Figures',
    prompt: 'a famous historical or modern person known worldwide. Examples: Cleopatra, Einstein, Elon Musk. Keep it to one to three words maximum.'
  },
  brandsAndLogos: {
    label: 'Brands & Logos',
    prompt: 'a famous brand, company or logo known worldwide. Examples: Nike, McDonald\'s, Tesla. Keep it to one or two words maximum.'
  },
  spaceAndSciFi: {
    label: 'Space & Sci-Fi',
    prompt: 'a space, science fiction or futuristic concept. Examples: Black Hole, Wormhole, Terraforming. Keep it to one to three words maximum.'
  },
  idiomsAndPhrases: {
    label: 'Idioms & Phrases',
    prompt: 'a common English idiom or phrase suitable for drawing. Examples: Piece of Cake, Bite the Bullet, Break a Leg. Keep it to two to five words maximum.'
  }
};

const availableGenres = Object.keys(genres);

module.exports = { genres, availableGenres };