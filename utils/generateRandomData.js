

export const generateRandomSentence = (wordCount = 10, maxWordLength = 8) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  const words = [];

  for (let i = 0; i < wordCount; i++) {
    let word = '';
    const wordLength = Math.floor(Math.random() * maxWordLength) + 1;
    for (let j = 0; j < wordLength; j++) {
      word += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    words.push(word);
  }

  return words.join(' ');
};
