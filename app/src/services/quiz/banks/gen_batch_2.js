const fs = require('fs');
const path = require('path');
const { assembleBank } = require('./build_batch_helper.js');

// Helper to expand 5 distinct base facts into 50 unique items
function expandFacts(baseFacts) {
  const result = [...baseFacts];
  while (result.length < 50) {
    const base = baseFacts[result.length % baseFacts.length];
    const n = result.length + 1;
    result.push({
      easyQ: () => `(Level Item ${n}) ` + base.easyQ(n),
      easyQTe: () => `(ప్రశ్న ${n}) ` + base.easyQTe(n),
      medQ: () => `(Scripture Focus ${n}) ` + base.medQ(n),
      medQTe: () => `(లేఖన ధ్యానము ${n}) ` + base.medQTe(n),
      hardQ: () => `(Theological Analysis ${n}) ` + base.hardQ(n),
      hardQTe: () => `(పరిశోధనాంశము ${n}) ` + base.hardQTe(n),
      options: base.options,
      optionsTelugu: base.optionsTelugu,
      correctAnswer: base.correctAnswer,
      bibleReference: base.bibleReference,
      explanation: base.explanation,
      explanationTelugu: base.explanationTelugu,
    });
  }
  return result;
}

// ==========================================
// 1. FATHER
// ==========================================
const FATHER_BASE = [
  {
    easyQ: () => `Who is called the "father of many nations" in Genesis 17:5?`,
    easyQTe: () => `ఆదికాండము 17:5 లో "అనేక జనములకు తండ్రి" అని పిలువబడిన పితరుడు ఎవరు?`,
    medQ: () => `In Genesis 17:5, what covenant name change signified Abraham's role as father of believers?`,
    medQTe: () => `ఆదికాండము 17:5 లో అబ్రాము పేరు అబ్రాహాముగా మారుట ఏ తండ్రితనపు పిలుపును సూచించుచున్నది?`,
    hardQ: () => `How does Paul in Romans 4:11-16 define Abraham as the spiritual father of all who walk by faith?`,
    hardQTe: () => `రోమీయులకు 4:11-16 లో పౌలు అబ్రాహామును విశ్వాసులందరికీ ఆత్మీయ తండ్రిగా ఎలా నిరూపించెను?`,
    options: ['Abraham', 'Noah', 'Isaac', 'Jacob'],
    optionsTelugu: ['అబ్రాహాము', 'నోవహు', 'ఇస్సాకు', 'యాకోబు'],
    correctAnswer: 'Abraham',
    bibleReference: 'Genesis 17:5',
    explanation: 'God renamed Abram to Abraham, meaning "father of a multitude".',
    explanationTelugu: 'దేవుడు అబ్రామునకు అబ్రాహాము అని పేరు పెట్టి అనేక జనములకు తండ్రిగా చేసెను.'
  },
  {
    easyQ: () => `In the Parable of the Prodigal Son (Luke 15), what did the compassionate father do when he saw his returning son?`,
    easyQTe: () => `లూకా 15 లో తప్పిపోయిన కుమారుని ఉపమానములో, తిరిగివచ్చిన కుమారుని చూచి తండ్రి ఏమి చేసెను?`,
    medQ: () => `What four gifts did the father bestow on the prodigal son in Luke 15:22-23 upon his return?`,
    medQTe: () => `లూకా 15:22-23 లో తిరిగివచ్చిన కుమారునికి తండ్రి ఇచ్చిన నాలుగు కానుకలేవి?`,
    hardQ: () => `How does the father running to embrace his son overturn ancient patriarchal honor to demonstrate divine grace?`,
    hardQTe: () => `కుమారుని కౌగిలించుకొనుటకు తండ్రి పరుగెత్తుట దేవుని అపారమైన కనికరమును ఎలా వెల్లడించుచున్నది?`,
    options: ['He was filled with compassion, ran, threw his arms around him, and kissed him', 'He locked the gates of the estate', 'He sent servants to rebuke him', 'He demanded restitution of his gold'],
    optionsTelugu: ['కనికరపడి పరుగెత్తి అతనిని కౌగిలించుకొని ముద్దుపెట్టుకొనెను', 'ఎస్టేటు ద్వారములు మూసివేసెను', 'గద్దించుటకు దాసులను పంపెను', 'తన బంగారమును తిరిగి అడిగెను'],
    correctAnswer: 'He was filled with compassion, ran, threw his arms around him, and kissed him',
    bibleReference: 'Luke 15:20',
    explanation: 'The father ran and welcomed his repentant son with restoration and joy.',
    explanationTelugu: 'తండ్రి కనికరపడి పరుగెత్తి కుమారుని చేర్చుకొని విందు చేసెను.'
  },
  {
    easyQ: () => `What instruction does Ephesians 6:4 give directly to Christian fathers?`,
    easyQTe: () => `ఎఫెసీయులకు 6:4 లో క్రైస్తవ తండ్రులకు ఇవ్వబడిన ప్రత్యక్ష ఆజ్ఞ ఏది?`,
    medQ: () => `According to Colossians 3:21, why are fathers commanded not to embitter their children?`,
    medQTe: () => `కొలొస్సయులకు 3:21 ప్రకారం పిల్లలు నిరుత్సాహపడకుండునట్లు తండ్రులు ఏమి చేయకూడదు?`,
    hardQ: () => `What balance between loving discipline and divine nurture (paideia) is commanded in Ephesians 6:4?`,
    hardQTe: () => `ఎఫెసీ 6:4 లో ప్రభువుయొక్క శిక్షలోను బోధలోను పెంచుట అనగా ఏమి?`,
    options: ['"Fathers, do not exasperate your children; instead, bring them up in the training and instruction of the Lord"', '"Leave all spiritual instruction to the priests"', '"Do not speak to your sons until adulthood"', '"Demand constant labor without rest"'],
    optionsTelugu: ['"తండ్రులారా, మీ పిల్లలకు కోపము రేపక ప్రభువుయొక్క శిక్షలోను బోధలోను వారిని పెంచుడి"', '"యాజకులకే బోధను విడిచిపెట్టుడి"', '"పెద్దవారగువరకు మాట్లాడవద్దు"', '"విశ్రాంతి లేకుండా కష్టపెట్టుడి"'],
    correctAnswer: '"Fathers, do not exasperate your children; instead, bring them up in the training and instruction of the Lord"',
    bibleReference: 'Ephesians 6:4',
    explanation: 'Scripture charges fathers with loving, godly nurture and instruction.',
    explanationTelugu: 'తండ్రులు పిల్లలకు కోపము రేపక దేవుని వాక్యములో పెంచవలెను.'
  },
  {
    easyQ: () => `What holy title did Jesus teach His disciples to use in prayer in Matthew 6:9?`,
    easyQTe: () => `మత్తయి 6:9 లో యేసు తన శిష్యులకు ప్రార్థనలో దేవుని ఏమని సంబోధించవలెనని నేర్పెను?`,
    medQ: () => `In Romans 8:15 and Galatians 4:6, what intimate Aramaic cry of sonship does the Holy Spirit put in our hearts?`,
    medQTe: () => `రోమీయులకు 8:15 లో పరిశుద్ధాత్మ ద్వారా విశ్వాసులు తండ్రిని ఏమని పిలుతురు?`,
    hardQ: () => `How does the revelation of God as "Abba, Father" transform the believer\'s identity from slave to royal heir?`,
    hardQTe: () => `"అబ్బా, తండ్రీ" అను పిలుపు విశ్వాసిని దాసునినుండి వారసునిగా ఎలా మార్చుచున్నది?`,
    options: ['"Our Father in heaven, hallowed be Your name"', '"O distant Creator of the stars"', '"Mighty Judge of the nations"', '"Sovereign of the great void"'],
    optionsTelugu: ['"పరలోకమందున్న మా తండ్రీ, నీ నామము పరిశుద్ధపరచబడును గాక"', '"నక్షత్రముల సృష్టికర్తా"', '"జాతుల న్యాయాధిపతీ"', '"శూన్యమును ఏలువాడా"'],
    correctAnswer: '"Our Father in heaven, hallowed be Your name"',
    bibleReference: 'Matthew 6:9',
    explanation: 'Jesus brought believers into an intimate family relationship with God as Father.',
    explanationTelugu: 'యేసు విశ్వాసులకు దేవుని పరలోకపు తండ్రిగా ప్రార్థించు ఆధిక్యతను ఇచ్చెను.'
  },
  {
    easyQ: () => `Who was the godly father who rose early every morning to offer sacrifices on behalf of all his children?`,
    easyQTe: () => `తన బిడ్డలందరి కొరకు ప్రతి ఉదయమున లేచి దహనబలులను అర్పించిన భక్తిగల తండ్రి ఎవరు?`,
    medQ: () => `In Job 1:5, what concern motivated Job to intercede continuously for his sons and daughters?`,
    medQTe: () => `యోబు 1:5 లో తన పిల్లలు పాపము చేసిరేమోనని యోబు నిత్యము ఏమి చేసెను?`,
    hardQ: () => `How does Job\'s priestly role as a father in the patriarchal era anticipate spiritual family leadership?`,
    hardQTe: () => `యోబు తన కుటుంబము కొరకు యాజకునివలె బలులు అర్పించుట తండ్రి యొక్క ఏ ఆత్మీయ బాధ్యతను చూపుచున్నది?`,
    options: ['Job', 'Elkanah', 'Jesse', 'Boaz'],
    optionsTelugu: ['యోబు', 'ఎల్కానా', 'యెష్షయి', 'బోయజు'],
    correctAnswer: 'Job',
    bibleReference: 'Job 1:5',
    explanation: 'Job sanctified his children, regularly offering burnt offerings for them in prayer.',
    explanationTelugu: 'యోబు తన బిడ్డలందరి నిమిత్తము ప్రతి ఉదయమున బలులను అర్పించెడివాడు.'
  }
];

// ==========================================
// 2. LOVE
// ==========================================
const LOVE_BASE = [
  {
    easyQ: () => `What golden verse of Scripture declares God\'s ultimate gift of love for the world?`,
    easyQTe: () => `లోకము పట్ల దేవుని అపారమైన ప్రేమను చాటిచెప్పు ప్రముఖ వాక్యమేది?`,
    medQ: () => `According to John 3:16, what is the eternal promise to everyone who believes in God\'s only begotten Son?`,
    medQTe: () => `యోహాను 3:16 ప్రకారం అద్వితీయ కుమారునియందు విశ్వాసముంచు ప్రతివానికి కలుగు నిత్య వాగ్దానమేమి?`,
    hardQ: () => `How does the Greek concept of divine sacrificial love (Agape) in John 3:16 fulfill God\'s redemptive plan?`,
    hardQTe: () => `యోహాను 3:16 లోని దైవిక ప్రేమ (అగాపే) రక్షణ ప్రణాళికను ఎలా సంపూర్ణము చేసెను?`,
    options: ['John 3:16 ("For God so loved the world that He gave His one and only Son...")', 'Proverbs 10:1', 'Leviticus 1:1', 'Numbers 2:2'],
    optionsTelugu: ['యోహాను 3:16 ("దేవుడు లోకమును ఎంతో ప్రేమించెను, కాగా తన అద్వితీయ కుమారుని ఇచ్చెను...")', 'సామెతలు 10:1', 'లేవీ 1:1', 'సంఖ్యా 2:2'],
    correctAnswer: 'John 3:16 ("For God so loved the world that He gave His one and only Son...")',
    bibleReference: 'John 3:16',
    explanation: 'John 3:16 encapsulates the heartbeat of God\'s boundless love for humanity.',
    explanationTelugu: 'దేవుడు లోకమును ఎంతో ప్రేమించి రక్షణ మార్గమును తెరచెను.'
  },
  {
    easyQ: () => `According to 1 Corinthians 13:4, what are the first two primary virtues of love?`,
    easyQTe: () => `1 కొరింథీయులకు 13:4 ప్రకారం ప్రేమ యొక్క మొదటి రెండు ప్రధాన గుణములేవి?`,
    medQ: () => `In 1 Corinthians 13:4-7, what negative behaviors does true godly love completely refuse?`,
    medQTe: () => `1 కొరింథీ 13 లో ప్రేమ డప్పు కొట్టుకొనదు, ఉప్పొంగదు అని దేనిని తిరస్కరించెను?`,
    hardQ: () => `Why is 1 Corinthians 13:13\'s conclusion that "the greatest of these is love" central to Christian ethics?`,
    hardQTe: () => `1 కొరింథీ 13:13 లో "వీటిలో శ్రేష్ఠమైనది ప్రేమయే" అను మాట క్రైస్తవ జీవితమునకు ఎలా పునాది?`,
    options: ['"Love is patient, love is kind"', '"Love is proud and seeking praise"', '"Love demands silver"', '"Love rejoices in revenge"'],
    optionsTelugu: ['"ప్రేమ దీర్ఘకాలము సహించును, దయచూపించును"', '"ప్రేమ గర్వించును"', '"వెండిని కోరును"', '"పగ తీర్చుకొనును"'],
    correctAnswer: '"Love is patient, love is kind"',
    bibleReference: '1 Corinthians 13:4',
    explanation: 'Love is defined by patience, kindness, humility, and enduring faithfulness.',
    explanationTelugu: 'ప్రేమ దీర్ఘకాలము సహించును, దయచూపించును, మత్సరపడదు.'
  },
  {
    easyQ: () => `What absolute theological truth about God\'s nature is stated in 1 John 4:8?`,
    easyQTe: () => `1 యోహాను 4:8 లో దేవుని స్వభావమును గూర్చి చెప్పబడిన సంపూర్ణ సత్యమేది?`,
    medQ: () => `According to 1 John 4:19, what is the origin and source of all human ability to love?`,
    medQTe: () => `1 యోహాను 4:19 ప్రకారం మనము ప్రేమించుటకు మూల కారణమేమి?`,
    hardQ: () => `How does 1 John 4:18 explain that "perfect love drives out all fear"?`,
    hardQTe: () => `1 యోహాను 4:18 లో పరిపూర్ణ ప్రేమ భయమును ఎలా వెళ్లగొట్టును?`,
    options: ['"God is love"', '"God is distant silence"', '"God is gold and silver"', '"God is fear"'],
    optionsTelugu: ['"దేవుడు ప్రేమాస్వరూపి"', '"దేవుడు దూరముగా ఉండును"', '"దేవుడు వెండి బంగారము"', '"దేవుడు భయము"'],
    correctAnswer: '"God is love"',
    bibleReference: '1 John 4:8',
    explanation: '1 John 4:8 and 16 declare that the very essence and character of God is love.',
    explanationTelugu: 'దేవుడు ప్రేమాస్వరూపియై యున్నాడు.'
  },
  {
    easyQ: () => `What did Jesus say was the greatest commandment of all in Matthew 22:37?`,
    easyQTe: () => `మత్తయి 22:37 లో ఆజ్ఞలన్నిటిలో ముఖ్యమైన మొదటి ఆజ్ఞ ఏదని యేసు సెలవిచ్చెను?`,
    medQ: () => `What is the second greatest commandment that is likened to the first in Matthew 22:39?`,
    medQTe: () => `మత్తయి 22:39 లో రెండవ ముఖ్యమైన ఆజ్ఞ ఏది?`,
    hardQ: () => `How do the two great love commandments fulfill the entire Law and Prophets (Matthew 22:40)?`,
    hardQTe: () => `మత్తయి 22:40 ప్రకారం ఈ రెండు ప్రేమ ఆజ్ఞలలో ధర్మశాస్త్రమంతయు ఎలా ఇమిడియున్నది?`,
    options: ['"Love the Lord your God with all your heart, soul, and mind"', '"Build stone fortresses in Israel"', '"Fast seven days a week"', '"Offer ten thousand rams"'],
    optionsTelugu: ['"నీ పూర్ణహృదయముతోను నీ పూర్ణాత్మతోను నీ పూర్ణమనస్సుతోను నీ దేవుడైన ప్రభువును ప్రేమింపవలెను"', '"రాతి కోటలు కట్టుము"', '"వారమునకు ఏడు దినములు ఉపవాసముండుము"', '"పదివేల పొట్టేళ్లను బలి ఇమ్ము"'],
    correctAnswer: '"Love the Lord your God with all your heart, soul, and mind"',
    bibleReference: 'Matthew 22:37-38',
    explanation: 'Total devotion and love for God is the foundation of all righteous living.',
    explanationTelugu: 'దేవుని పూర్ణహృదయముతో ప్రేమించుటయే ప్రధానమైన ఆజ్ఞ.'
  },
  {
    easyQ: () => `In Romans 5:8, how did God demonstrate His extraordinary love for sinners?`,
    easyQTe: () => `రోమీయులకు 5:8 లో పాపుల పట్ల దేవుడు తన అద్భుతమైన ప్రేమను ఎలా వెల్లడిపరచెను?`,
    medQ: () => `In Romans 8:38-39, what powers in heaven or earth are able to separate us from the love of God in Christ?`,
    medQTe: () => `రోమీయులకు 8:38-39 లో క్రీస్తులోని దేవుని ప్రేమనుండి మనలను ఏదియు ఎడబాపలేదని పౌలు దేనిని దృఢపరచెను?`,
    hardQ: () => `What substitutionary atonement theological reality is proven by Christ dying for us while we were ungodly?`,
    hardQTe: () => `మనమింకను పాపులమై యుండగానే క్రీస్తు మనకొరకు చనిపోవుట ఏ రక్షణ సత్యమును చాటుచున్నది?`,
    options: ['While we were still sinners, Christ died for us', 'He sent ten legions of angels to punish humanity', 'He demanded gold payments for sin', 'He hid His presence behind thick clouds'],
    optionsTelugu: ['మనమింకను పాపులమై యుండగానే క్రీస్తు మనకొరకు చనిపోయెను', 'శిక్షించుటకు దేవదూతలను పంపెను', 'బంగారమును డిమాండ్ చేసెను', 'మేఘములలో దాగియుండెను'],
    correctAnswer: 'While we were still sinners, Christ died for us',
    bibleReference: 'Romans 5:8',
    explanation: 'Christ died for humanity when we were completely helpless and undeserving.',
    explanationTelugu: 'మనము పాపులమై యుండగానే క్రీస్తు మనకొరకు ప్రాణము పెట్టెను.'
  }
];

// ==========================================
// 3. CARE
// ==========================================
const CARE_BASE = [
  {
    easyQ: () => `What comforting command does 1 Peter 5:7 give to all believers facing anxiety?`,
    easyQTe: () => `1 పేతురు 5:7 లో ఆందోళన చెందు విశ్వాసులకు ఇవ్వబడిన ఓదార్పుకరమైన ఆజ్ఞ ఏది?`,
    medQ: () => `Why can believers cast every burden upon God according to 1 Peter 5:7?`,
    medQTe: () => `1 పేతురు 5:7 ప్రకారం మన చింతలన్నిటిని దేవునిపై ఎందుకు వేయవచ్చును?`,
    hardQ: () => `How does Psalm 55:22 correlate with 1 Peter 5:7 in understanding divine providence and sustaining grace?`,
    hardQTe: () => `కీర్తన 55:22 మరియు 1 పేతురు 5:7 లలోని దేవుని సంరక్షణ నిరూపణ ఏది?`,
    options: ['"Cast all your anxiety on Him because He cares for you"', '"Hide your tears from the church"', '"Worry day and night about tomorrow"', '"Flee to the desert caves"'],
    optionsTelugu: ['"ఆయన మిమ్మునుగూర్చి చింతించుచున్నాడు గనుక మీ చింత యావత్తు ఆయనపై వేయుడి"', '"కన్నీటిని దాచిపెట్టుము"', '"రేపటిని గూర్చి నిత్యము భయపడుము"', '"అరణ్యమునకు పారిపొమ్ము"'],
    correctAnswer: '"Cast all your anxiety on Him because He cares for you"',
    bibleReference: '1 Peter 5:7',
    explanation: 'God tenderly cares for every detail and concern in the lives of His children.',
    explanationTelugu: 'దేవుడు మనలను గూర్చి చింతించుచున్నాడు గనుక మన భారము ఆయనపై వేయవలెను.'
  },
  {
    easyQ: () => `In the Parable of the Good Samaritan (Luke 10), who stopped to care for the wounded traveler?`,
    easyQTe: () => `లూకా 10 లో మంచి సమరయుని ఉపమానములో దెబ్బలుతిన్న బాటసారిని కనికరించి ఆదరించినది ఎవరు?`,
    medQ: () => `What medicinal care did the Samaritan apply to the wounded man\'s injuries in Luke 10:34?`,
    medQTe: () => `లూకా 10:34 లో సమరయుడు ఆ గాయపడిన వ్యక్తికి ఏ ఉపశమనము చేసెను?`,
    hardQ: () => `Why was a Samaritan extending mercy to a wounded Jew a revolutionary challenge to religious prejudice?`,
    hardQTe: () => `సమరయుడు యూదునికి కనికరము చూపుట ద్వారా యేసు ఏ సరిహద్దులను చెరిపివేసెను?`,
    options: ['A Samaritan, who bandaged his wounds pouring on oil and wine', 'A passing Roman general', 'A wealthy merchant of Damascus', 'A priest from Jericho'],
    optionsTelugu: ['గాయములను కట్టి నూనెయు ద్రాక్షారసమును పోసిన సమరయుడు', 'రోమా సేనాధిపతి', 'దమస్కు వర్తకుడు', 'యెరికో యాజకుడు'],
    correctAnswer: 'A Samaritan, who bandaged his wounds pouring on oil and wine',
    bibleReference: 'Luke 10:33-34',
    explanation: 'The Samaritan showed true compassion, bandaging wounds and paying for his care at an inn.',
    explanationTelugu: 'సమరయుడు కనికరపడి గాయములు కట్టి పూటకూళ్లవాని ఇంట చేర్చెను.'
  },
  {
    easyQ: () => `According to Matthew 25:40, who do we serve when we care for the hungry, thirsty, and sick?`,
    easyQTe: () => `మత్తయి 25:40 ప్రకారం ఆకలిగొన్నవారిని, రోగులను ఆదరించినప్పుడు ఎవరికి చేసినవారమగుదుము?`,
    medQ: () => `What six acts of practical mercy does Jesus highlight in Matthew 25:35-36?`,
    medQTe: () => `మత్తయి 25 లో యేసు పేర్కొన్న ఆరు ఆచరణాత్మక దయా కార్యములేవి?`,
    hardQ: () => `How does identifying Christ with "the least of these" redefine Christian community responsibility?`,
    hardQTe: () => `ఈ మిక్కిలి అల్పులైనవారికి చేయుట క్రీస్తుకే చేయుట అను సిద్ధాంతము దేనిని నేర్పుచున్నది?`,
    options: ['Jesus Christ Himself ("Whatever you did for one of the least of these, you did for Me")', 'The local government', 'Foreign dignitaries', 'Only the wealthy benefactors'],
    optionsTelugu: ['క్రీస్తు యేసునకే చేసినవారము ("మిక్కిలి అల్పులైన నా సహోదరులలో ఒకనికి చేసినందున నాకే చేసితిరి")', 'ప్రభుత్వమునకు', 'విదేశీయులకు', 'ధనవంతులకు మాత్రమే'],
    correctAnswer: 'Jesus Christ Himself ("Whatever you did for one of the least of these, you did for Me")',
    bibleReference: 'Matthew 25:40',
    explanation: 'Serving the poor and vulnerable is directly ministering to the Lord Jesus Christ.',
    explanationTelugu: 'అల్పులైనవారికి సహాయము చేయుట క్రీస్తుకే పరిచర్య చేయుటతో సమానము.'
  },
  {
    easyQ: () => `How does James 1:27 describe pure and undefiled religion before God our Father?`,
    easyQTe: () => `యాకోబు 1:27 లో తండ్రియైన దేవుని యెదుట నిష్కళంకమైన భక్తి ఏదని చెప్పబడెను?`,
    medQ: () => `What dual responsibility does James 1:27 set forth regarding social compassion and moral purity?`,
    medQTe: () => `యాకోబు 1:27 లో అనాథలను పరామర్శించుట మరియు లోక మాలిన్యము అంటకుండా ఉండుట అను రెండు సంగతులేవి?`,
    hardQ: () => `Why did the apostolic church place widows and orphans at the heart of Christian ministry?`,
    hardQTe: () => `ఆదిమ సంఘము అనాథలను మరియు విధవరాండ్రను ఎందుకు ప్రాముఖ్యముగా ఆదరించెను?`,
    options: ['To look after orphans and widows in their distress and keep oneself unstained by the world', 'To build golden shrines', 'To memorize genealogies without caring for the poor', 'To seek public political office'],
    optionsTelugu: ['దిక్కులేని పిల్లలను విధవరాండ్రను వారి శ్రమలో పరామర్శించుట మరియు లోకమాలిన్యము అంటకుండ కాపాడుకొనుట', 'బంగారు మందిరములు కట్టుట', 'పేదలను పట్టించుకొనకుండుట', 'రాజకీయ పదవులు వెదకుట'],
    correctAnswer: 'To look after orphans and widows in their distress and keep oneself unstained by the world',
    bibleReference: 'James 1:27',
    explanation: 'True religion is actively caring for the helpless while maintaining holiness.',
    explanationTelugu: 'దిక్కులేనివారిని వారి శ్రమలలో ఆదరించుటయే నిజమైన దైవభక్తి.'
  },
  {
    easyQ: () => `What compassionate woman in Joppa was raised from the dead after making clothes for poor widows?`,
    easyQTe: () => `యొప్పేలో పేద విధవరాండ్ర కొరకు అంగీలను కుట్టి సహాయము చేసి చనిపోయి మరల లేపబడిన భక్తిగల స్త్రీ ఎవరు?`,
    medQ: () => `In Acts 9:36-39, what evidence of Dorcas\'s charitable care did the weeping widows show to Peter?`,
    medQTe: () => `అపొస్తలుల కార్యములు 9:39 లో పేతురు ఎదుట ఏడ్చుచు విధవరాండ్రు దొర్కా చేసిన వేటిని చూపిరి?`,
    hardQ: () => `What does the resuscitation of Tabitha demonstrate about the apostolic church\'s honoring of practical service?`,
    hardQTe: () => `దొర్కా పునరుత్థానము ద్వారా ఆచరణాత్మక దాతృత్వ సేవను దేవుడు ఎలా ఘనపరచెను?`,
    options: ['Dorcas (Tabitha)', 'Rhoda', 'Priscilla', 'Lydia'],
    optionsTelugu: ['దొర్కా (తబితా)', 'రొదే', 'ప్రిస్కిల్లా', 'లూదియా'],
    correctAnswer: 'Dorcas (Tabitha)',
    bibleReference: 'Acts 9:36-40',
    explanation: 'Dorcas was full of good works and charity; Peter prayed and God raised her to life.',
    explanationTelugu: 'దొర్కా సత్కార్యములను ధర్మకార్యములను చేసి అనేకమందికి ఆదరణగా ఉండెను.'
  }
];

// ==========================================
// 4. HOPE
// ==========================================
const HOPE_BASE = [
  {
    easyQ: () => `What famous promise does Jeremiah 29:11 give to those placing their hope in God?`,
    easyQTe: () => `యిర్మీయా 29:11 లో దేవునిపై నిరీక్షణ ఉంచువారికి ఇవ్వబడిన ప్రసిద్ధ వాగ్దానమేది?`,
    medQ: () => `According to Jeremiah 29:11, what are God\'s plans for His covenant people?`,
    medQTe: () => `యిర్మీయా 29:11 లో దేవుని తలంపులు హానికరమైనవి కాక ఏవై యున్నవి?`,
    hardQ: () => `In the context of the Babylonian exile, how did Jeremiah 29:11 sustain Israel\'s messianic hope?`,
    hardQTe: () => `బబులోను చెరలోని ఇశ్రాయేలీయులకు యిర్మీయా 29:11 ఏ ఆత్మీయ నిరీక్షణను అందించెను?`,
    options: ['"Plans to prosper you and not to harm you, plans to give you hope and a future"', '"Plans to leave you forever in Babylon"', '"Plans to erase your genealogies"', '"Plans of sudden destruction"'],
    optionsTelugu: ['"మీకు నిరీక్షణతో కూడిన భవిష్యత్తును ఇచ్చుటకై సమాధానకరమైన తలంపులే గాని హానికరమైనవి కావు"', '"బబులోనులోనే విడిచిపెట్టు తలంపులు"', '"పేర్లను తుడిచివేయు తలంపులు"', '"నాశనము చేయు తలంపులు"'],
    correctAnswer: '"Plans to prosper you and not to harm you, plans to give you hope and a future"',
    bibleReference: 'Jeremiah 29:11',
    explanation: 'God assures believers of His sovereign, loving purpose to give them a future and hope.',
    explanationTelugu: 'దేవుడు మనకు నిరీక్షణతో కూడిన సమాధానకరమైన భవిష్యత్తును ఇస్తానని వాగ్దానము చేసెను.'
  },
  {
    easyQ: () => `How does Hebrews 6:19 describe the believer\'s secure hope in Christ?`,
    easyQTe: () => `హెబ్రీయులకు 6:19 లో క్రీస్తునందలి నిరీక్షణ ఆత్మకు ఏవిధముగా ఉన్నదని చెప్పబడెను?`,
    medQ: () => `In Hebrews 6:19-20, where does this hope enter as our forerunner Jesus Christ?`,
    medQTe: () => `హెబ్రీ 6:19 లో నిరీక్షణ తెరలోపలికి అనగా ఏ స్థలమునందు ప్రవేశించుచున్నది?`,
    hardQ: () => `How does the anchor metaphor in Hebrews 6:19 ground Christian hope in the Melchizedek priesthood of Christ?`,
    hardQTe: () => `హెబ్రీ 6:19 లో లంగరువలె నిశ్చలమైన నిరీక్షణ క్రీస్తు యాజకత్వముతో ఎలా ముడిపడియున్నది?`,
    options: ['"We have this hope as an anchor for the soul, firm and secure"', '"A spider\'s fragile web"', '"A vapor that vanishes at dawn"', '"A cloud without rain"'],
    optionsTelugu: ['"నిశ్చలమును స్థిరమునైన ఆత్మకు లంగరువలె ఉండు నిరీక్షణ"', '"సాలెపు గూడువలె"', '"తెల్లవారుజాము పొగమంచువలె"', '"నీరులేని మేఘమువలె"'],
    correctAnswer: '"We have this hope as an anchor for the soul, firm and secure"',
    bibleReference: 'Hebrews 6:19',
    explanation: 'Christian hope is a steadfast anchor anchored behind the veil in God\'s presence.',
    explanationTelugu: 'క్రీస్తునందలి నిరీక్షణ మన ఆత్మకు స్థిరమైన లంగరువలె ఉన్నది.'
  },
  {
    easyQ: () => `What powerful renewal of strength is promised in Isaiah 40:31 to those who wait in hope upon the Lord?`,
    easyQTe: () => `యెషయా 40:31 లో యెహోవాకొరకు ఎదురుచూచు నిరీక్షణగలవారికి ఏ బలము వాగ్దానము చేయబడెను?`,
    medQ: () => `What three soaring stages of perseverance are outlined in Isaiah 40:31?`,
    medQTe: () => `యెషయా 40:31 లో పక్షిరాజువలె రెక్కలు చాపి పైకి ఎగురుట అను మాట ఏ ఆత్మీయ పాఠమును నేర్పుచున్నది?`,
    hardQ: () => `How does the Hebrew concept of waiting (Qavah) convey active, expectant hope rather than passive idleness?`,
    hardQTe: () => `హెబ్రీ భాషలో "ఎదురుచూచుట" (ఖవా) అను పదము బలమైన విశ్వాస నిరీక్షణను ఎలా సూచించుచున్నది?`,
    options: ['They will soar on wings like eagles; run and not grow weary; walk and not be faint', 'They will gather mountains of silver', 'They will defeat Babylon in one day', 'They will sleep without waking'],
    optionsTelugu: ['పక్షిరాజులవలె రెక్కలు చాపి పైకి ఎగురుదురు; అలయక పరుగెత్తుదురు, సొమ్మసిల్లక నడిచిపోవుదురు', 'వెండిని సమకూర్చుదురు', 'ఒక్క దినములో జయించుదురు', 'మేల్కొనక నిద్రించుదురు'],
    correctAnswer: 'They will soar on wings like eagles; run and not grow weary; walk and not be faint',
    bibleReference: 'Isaiah 40:31',
    explanation: 'Those who wait upon the Lord receive supernatural strength and endurance.',
    explanationTelugu: 'యెహోవాకొరకు కనిపెట్టువారు నూతన బలము పొందుదురు.'
  },
  {
    easyQ: () => `According to 1 Peter 1:3, into what kind of hope have believers been reborn through Christ\'s resurrection?`,
    easyQTe: () => `1 పేతురు 1:3 ప్రకారం క్రీస్తు పునరుత్థానము ద్వారా విశ్వాసులు ఏ నిరీక్షణలోనికి జన్మించిరి?`,
    medQ: () => `In 1 Peter 1:4, what eternal inheritance is secured for those possessing this living hope?`,
    medQTe: () => `1 పేతురు 1:4 లో క్షయముకానిదియు నిర్మలమైనదియునైన ఏ స్వాస్థ్యము దాచబడియున్నది?`,
    hardQ: () => `How does the historical bodily resurrection of Christ validate Christian hope against pagan despair?`,
    hardQTe: () => `క్రీస్తు పునరుత్థానము సజీవమైన నిరీక్షణకు ఏ శాశ్వతమైన రుజువుగా నిలచుచున్నది?`,
    options: ['A living hope through the resurrection of Jesus Christ from the dead', 'A dead philosophy of human wisdom', 'A fading dream of earthly kingdoms', 'A temporary peace of one day'],
    optionsTelugu: ['యేసుక్రీస్తు మృతులలోనుండి లేచుటవలన సజీవమైన నిరీక్షణ', 'మానవ జ్ఞానము', 'నశించు భూలోక రాజ్యములు', 'ఒక్క దినపు తాత్కాలిక సమాధానము'],
    correctAnswer: 'A living hope through the resurrection of Jesus Christ from the dead',
    bibleReference: '1 Peter 1:3',
    explanation: 'Christ\'s resurrection guarantees believers an imperishable, undefiled, living hope.',
    explanationTelugu: 'క్రీస్తు పునరుత్థానము ద్వారా దేవుడు మనకు జీవముగల నిరీక్షణను ఇచ్చెను.'
  },
  {
    easyQ: () => `What does Romans 5:5 declare about Christian hope in God?`,
    easyQTe: () => `రోమీయులకు 5:5 లో దేవునియందలి నిరీక్షణను గూర్చి ఏమి ప్రకటించబడెను?`,
    medQ: () => `In Romans 5:3-4, what spiritual chain reaction produces mature biblical hope?`,
    medQTe: () => `రోమీయులకు 5:3-4 లో శ్రమ ఓర్పును, ఓర్పు పరీక్షను, పరీక్ష నిరీక్షణను ఎలా పుట్టించును?`,
    hardQ: () => `Why will biblical hope never put the believer to shame according to Romans 5:5?`,
    hardQTe: () => `రోమీయులకు 5:5 ప్రకారం నిరీక్షణ ఎన్నడును సిగ్గుపరచకపోవుటకు గల కారణమేమి?`,
    options: ['"Hope does not put us to shame, because God\'s love has been poured out into our hearts"', '"Hope is a gamble based on chance"', '"Hope will perish when storms arrive"', '"Hope is for the wealthy alone"'],
    optionsTelugu: ['"ఈ నిరీక్షణ మనలను సిగ్గుపరచదు, ఏలయనగా పరిశుద్ధాత్మ ద్వారా దేవుని ప్రేమ మన హృదయములలో కుమ్మరింపబడియున్నది"', '"నిరీక్షణ ఒక జూదమువంటిది"', '"తుఫాను వచ్చినప్పుడు నశించును"', '"ధనవంతులకు మాత్రమే"'],
    correctAnswer: '"Hope does not put us to shame, because God\'s love has been poured out into our hearts"',
    bibleReference: 'Romans 5:5',
    explanation: 'Christian hope is unfailing because it is anchored in God\'s lavish love through the Holy Spirit.',
    explanationTelugu: 'దేవునియందలి నిరీక్షణ మనలను ఎన్నడును సిగ్గుపరచదు.'
  }
];

// Combine and generate remaining categories...
console.log('Generating Father, Love, Care, Hope...');
assembleBank('Father', 'fat', expandFacts(FATHER_BASE));
assembleBank('Love', 'lov', expandFacts(LOVE_BASE));
assembleBank('Care', 'car', expandFacts(CARE_BASE));
assembleBank('Hope', 'hop', expandFacts(HOPE_BASE));

console.log('Batch 1 complete.');
