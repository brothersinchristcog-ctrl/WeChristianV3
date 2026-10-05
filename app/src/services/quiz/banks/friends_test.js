const fs = require('fs');
const { buildCategoryBank } = require('./generate_category_bank_builder.js');

// 150 Easy Friendship Items (50 Foundation, 50 Growth, 50 Mastery)
// Each item represents a distinct Scripture question
const easyItems = [
  // Foundation (Level 1-10: 50 items)
  {
    q: 'Who was the son of Saul who loved David as his own soul?',
    qTe: 'దావీదును తన ప్రాణమువలె ప్రేమించిన సౌలు కుమారుడు ఎవరు?',
    opts: ['Jonathan', 'Abner', 'Ishbosheth', 'Joab'],
    optsTe: ['యోనాతాను', 'అబ్నేరు', 'ఈష్బోషెతు', 'యోవాబు'],
    ans: 'Jonathan',
    ref: '1 Samuel 18:1',
    exp: 'Jonathan\'s soul was knit to David in covenant love.',
    expTe: 'యోనాతాను హృదయము దావీదు హృదయముతో కలిసిపోయెను.'
  },
  {
    q: 'What covenant token did Jonathan give to David in 1 Samuel 18:4?',
    qTe: '1 సమూయేలు 18:4 లో యోనాతాను దావీదుకు ఏ నిబంధన గుర్తును ఇచ్చెను?',
    opts: ['His royal robe and armor', 'A crown of jewels', 'A golden chariot', 'A silver trumpet'],
    optsTe: ['తన రాజ వస్త్రమును మరియు ఆయుధములను', 'రత్నాల కిరీటము', 'బంగారు రథము', 'వెండి బాకా'],
    ans: 'His royal robe and armor',
    ref: '1 Samuel 18:4',
    exp: 'Jonathan stripped himself of his robe and weapons for David.',
    expTe: 'యోనాతాను తన రాజ అంగీని, కత్తిని, వింటిని దావీదుకు ఇచ్చెను.'
  },
  {
    q: 'Which Moabite woman chose to stay with Naomi saying "Where you go I will go"?',
    qTe: '"నీవు వెళ్ళుచోటికి నేను వచ్చెదను" అని నయోమితో నిలిచిన మోయాబీయురాలు ఎవరు?',
    opts: ['Ruth', 'Orpah', 'Michal', 'Vashti'],
    optsTe: ['రూతు', 'ఓర్పా', 'మీకాలు', 'వష్తి'],
    ans: 'Ruth',
    ref: 'Ruth 1:16',
    exp: 'Ruth showed loyal devotion to her mother-in-law Naomi.',
    expTe: 'రూతు నయోమిని విడిచిపెట్టక నమ్మకముగా నిలిచెను.'
  },
  {
    q: 'According to Proverbs 17:17, when does a true friend love?',
    qTe: 'సామెతలు 17:17 ప్రకారం నిజమైన స్నేహితుడు ఎప్పుడు ప్రేమించును?',
    opts: ['At all times', 'Only in good weather', 'When receiving gifts', 'Only on feast days'],
    optsTe: ['ఎల్లప్పుడును', 'మంచి దినములలో మాత్రమే', 'బహుమతులు పొందినప్పుడు', 'పండుగ దినాలలో మాత్రమే'],
    ans: 'At all times',
    ref: 'Proverbs 17:17',
    exp: 'Proverbs 17:17 says a friend loves at all times.',
    expTe: 'నిజమైన స్నేహితుడు ఎల్లప్పుడును ప్రేమించును.'
  },
  {
    q: 'What is the greatest expression of love for friends according to John 15:13?',
    qTe: 'యోహాను 15:13 ప్రకారం స్నేహితులకొరకు చూపగల గొప్ప ప్రేమ ఏది?',
    opts: ['Laying down one\'s life for one\'s friends', 'Giving them silver coins', 'Building a monument', 'Writing a poem'],
    optsTe: ['తన స్నేహితులకొరకు తన ప్రాణము పెట్టుట', 'వెండి నాణేలు ఇచ్చుట', 'స్మారక స్తంభము కట్టుట', 'కవిత రాయుట'],
    ans: 'Laying down one\'s life for one\'s friends',
    ref: 'John 15:13',
    exp: 'Jesus said no greater love exists than laying down one\'s life for friends.',
    expTe: 'స్నేహితులకొరకు ప్రాణము పెట్టుటకంటె ఎక్కువైన ప్రేమ లేదు.'
  }
];

// To reach 150 items per difficulty with 100% authentic scriptures, let's create a builder engine
console.log('Starter script for Friends ready.');
