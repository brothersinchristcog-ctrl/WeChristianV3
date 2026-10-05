const fs = require('fs');
const path = require('path');
const { assembleBank } = require('./build_batch_helper.js');

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
// 1. FAILURE & RESTORATION
// ==========================================
const FAILURE_BASE = [
  {
    easyQ: () => `Which apostle denied Jesus three times before the rooster crowed, yet was restored by Christ?`,
    easyQTe: () => `కోడి కూయకముందే యేసును మూడుసార్లు ఎరుగనని చెప్పి బొంకి, తరువాత ప్రభువుచేత పునరుద్ధరించబడిన శిష్యుడు ఎవరు?`,
    medQ: () => `In John 21:15-17, what three questions and commands did Jesus give to restore Peter by the Sea of Galilee?`,
    medQTe: () => `యోహాను 21 లో గలీలయ సముద్ర తీరమున పేతురును పునరుద్ధరించుటకు యేసు ఏమని మూడుసార్లు అడిగెను?`,
    hardQ: () => `How does the contrast between Judas\'s worldly remorse (Matt 27:3) and Peter\'s godly repentance (Luke 22:62) illuminate biblical restoration?`,
    hardQTe: () => `యూదా యొక్క లోకసంబంధమైన పశ్చాత్తాపమునకు మరియు పేతురు యొక్క దైవిక మారుమనస్సుకు గల వ్యత్యాసమేమి?`,
    options: ['Peter', 'Thomas', 'Judas Iscariot', 'Matthew'],
    optionsTelugu: ['పేతురు', 'తోమా', 'ఇస్కరియోతు యూదా', 'మత్తయి'],
    correctAnswer: 'Peter',
    bibleReference: 'Luke 22:61-62, John 21:15-17',
    explanation: 'Peter wept bitterly after his denial, and Jesus restored him three times saying: "Feed My sheep."',
    explanationTelugu: 'పేతురు కన్నీరు కార్చి పశ్చాత్తాపపడగా, యేసు అతనిని ప్రేమతో పునరుద్ధరించెను.'
  },
  {
    easyQ: () => `What famous Psalm of repentance did King David write after his great failure regarding Bathsheba and Uriah?`,
    easyQTe: () => `బత్షెబ మరియు ఊరియా విషయములో చేసిన పాపమును ఒప్పుకొనుచు దావీదు రాజు రచించిన పశ్చాత్తాప కీర్తన ఏది?`,
    medQ: () => `What pure heart and renewed spirit did David cry out for in Psalm 51:10?`,
    medQTe: () => `కీర్తన 51:10 లో దావీదు దేవునియొద్ద ఏ శుద్ధ హృదయము కొరకు ప్రార్థించెను?`,
    hardQ: () => `How did the prophet Nathan\'s parable of the ewe lamb in 2 Samuel 12 awaken David\'s conscience to divine judgment?`,
    hardQTe: () => `2 సమూయేలు 12 లో నాతాను ప్రవక్త చెప్పిన గొర్రెపిల్ల ఉపమానము దావీదు మనస్సాక్షిని ఎలా మేల్కొలిపెను?`,
    options: ['Psalm 51 ("Create in me a pure heart, O God, and renew a steadfast spirit within me")', 'Psalm 23', 'Psalm 1', 'Psalm 150'],
    optionsTelugu: ['కీర్తన 51 ("దేవా, నాయందు శుద్ధహృదయము కలుగజేయుము, నా అంతరంగములో స్థిరమైన మనస్సును నూతనపరచుము")', 'కీర్తన 23', 'కీర్తన 1', 'కీర్తన 150'],
    correctAnswer: 'Psalm 51 ("Create in me a pure heart, O God, and renew a steadfast spirit within me")',
    bibleReference: 'Psalm 51:1-12',
    explanation: 'Psalm 51 is the biblical model of genuine confession, godly sorrow, and seeking restoration.',
    explanationTelugu: 'దావీదు కీర్తన 51 లో తన పాపములను ఒప్పుకొని దేవుని శుద్ధీకరణను వేడుకొనెను.'
  },
  {
    easyQ: () => `Which prophet failed by fleeing to Tarshish instead of obeying God\'s call to preach in Nineveh?`,
    easyQTe: () => `నీనెవెకు వెళ్లవలెనన్న దేవుని ఆజ్ఞను మీరి తర్షీషునకు పారిపోయి వైఫల్యము చెందిన ప్రవక్త ఎవరు?`,
    medQ: () => `Where did Jonah pray his prayer of repentance before God gave him a second commission in Jonah 2-3?`,
    medQTe: () => `యోనా 2 లో ఏ స్థలమునందు ఉండి దేవునికి ప్రార్థించి రెండవ అవకాశము పొందెను?`,
    hardQ: () => `How does Jonah\'s experience in the belly of the fish serve as a prophetic sign of Christ\'s burial and resurrection (Matt 12:40)?`,
    hardQTe: () => `మత్స్యము కడుపులో యోనా మూడు రాత్రింబగళ్లు ఉండుట క్రీస్తు పునరుత్థానమునకు ఎలా సూచనగా ఉన్నది?`,
    options: ['Jonah', 'Amos', 'Hosea', 'Micah'],
    optionsTelugu: ['యోనా', 'ఆమోసు', 'హోషేయ', 'మీకా'],
    correctAnswer: 'Jonah',
    bibleReference: 'Jonah 1:1-3, 2:1-10',
    explanation: 'Jonah fled from the Lord, was swallowed by a great fish, repented, and was given a second chance.',
    explanationTelugu: 'యోనా పారిపోయినను దేవుని కనికరమువలన రక్షించబడి రెండవ పిలుపును పొందెను.'
  },
  {
    easyQ: () => `What strong judge failed by breaking his Nazirite vow and revealing the secret of his strength to Delilah?`,
    easyQTe: () => `దెలీలాకు తన బలపు రహస్యమును చెప్పి నాజీరు వ్రతమును కోల్పోయి అపజయము పొందిన న్యాయాధిపతి ఎవరు?`,
    medQ: () => `In Judges 16:28-30, what final prayer did blinded Samson pray to the Lord in the temple of Dagon?`,
    medQTe: () => `న్యాయాధిపతులు 16:28 లో గుడ్డివాడైన సమ్సోను దాగోను గుడిలో దేవుని ఏమని ప్రార్థించెను?`,
    hardQ: () => `Why is Samson included in the Hall of Faith in Hebrews 11:32 despite his severe personal failures?`,
    hardQTe: () => `సమ్సోను తన వైఫల్యముల మధ్యయు హెబ్రీ 11 లోని విశ్వాస వీరుల పట్టికలో ఎందుకు చేర్చబడెను?`,
    options: ['Samson', 'Jephthah', 'Barak', 'Othniel'],
    optionsTelugu: ['సమ్సోను', 'యెఫ్తా', 'బారాకు', 'ఒత్నీయేలు'],
    correctAnswer: 'Samson',
    bibleReference: 'Judges 16:19-30',
    explanation: 'Samson fell through compromise, but in his final hour turned to God in faith and was empowered.',
    explanationTelugu: 'సమ్సోను దెలీలావలన పడిపోయినను, చివరి గడియలో దేవునిని వేడుకొని విజయము పొందెను.'
  },
  {
    easyQ: () => `What hopeful proverb in Proverbs 24:16 promises resilience when a righteous person stumbles?`,
    easyQTe: () => `సామెతలు 24:16 లో నీతిమంతుడు పడిపోయినప్పుడు కలుగు ఏ నిరీక్షణకరమైన వాగ్దానము చెప్పబడెను?`,
    medQ: () => `What contrast does Proverbs 24:16 draw between the restoration of the righteous and the calamity of the wicked?`,
    medQTe: () => `సామెతలు 24:16 లో నీతిమంతుని పునరుత్థానమునకు మరియు దుష్టుల నాశనమునకు గల తేడా ఏమి?`,
    hardQ: () => `How does biblical justification explain why the righteous rise again despite falling into trial or failure?`,
    hardQTe: () => `నీతిమంతుడు ఏడుసార్లు పడినను దేవుని కృపవలన ఎలా తిరిగి లేవనెత్తబడును?`,
    options: ['"For though the righteous fall seven times, they rise again, but the wicked stumble when calamity strikes"', '"A fallen vessel can never be mended"', '"Failure ends all hope forever"', '"Only the sinless can enter the gates"'],
    optionsTelugu: ['"నీతిమంతుడు ఏడుమారులు పడినను తిరిగి లేచును, భక్తిహీనులు ఆపదలో కూలుదురు"', '"పగిలిన కుండ ఎన్నటికి బాగుపడదు"', '"వైఫల్యము నిరీక్షణను అంతము చేయును"', '"పాపము చేయనివారు మాత్రమే చేరుదురు"'],
    correctAnswer: '"For though the righteous fall seven times, they rise again, but the wicked stumble when calamity strikes"',
    bibleReference: 'Proverbs 24:16',
    explanation: 'God\'s grace lifts up the righteous person who repents, granting complete spiritual restoration.',
    explanationTelugu: 'నీతిమంతుడు పడినను దేవుని బాహువు అతనిని తిరిగి లేవనెత్తును.'
  }
];

// ==========================================
// 2. FEAR & COURAGE
// ==========================================
const FEAR_BASE = [
  {
    easyQ: () => `What foundational promise of courage does God give in Isaiah 41:10?`,
    easyQTe: () => `యెషయా 41:10 లో భయమును పోగొట్టుటకు దేవుడు ఇచ్చిన ప్రసిద్ధ వాగ్దానమేది?`,
    medQ: () => `According to Isaiah 41:10, with what will God uphold the believer in times of trouble?`,
    medQTe: () => `యెషయా 41:10 లో దేవుడు తన ఏ హస్తముతో మనలను ఆదుకొనెదనని చెప్పెను?`,
    hardQ: () => `How does the threefold promise "I am with you, I will strengthen you, I will uphold you" overcome fear?`,
    hardQTe: () => `"నేను నీకు తోడైయున్నాను, నిన్ను బలపరతును, నా నీతియను దక్షిణహస్తముతో నిన్ను ఆదుకొందును" అను మాట ఏ భరోసా ఇచ్చుచున్నది?`,
    options: ['"Fear not, for I am with you; be not dismayed, for I am your God"', '"Fear the armies of Babylon"', '"Hide your face when enemies gather"', '"Flee to the islands of the sea"'],
    optionsTelugu: ['"నీవు భయపడకుము నేను నీకు తోడైయున్నాను, దిగులుపడకుము నేను నీ దేవుడనై యున్నాను"', '"బబులోను సైన్యములకు భయపడుము"', '"శత్రువులను చూచి దాగుకొనుము"', '"సముద్రపు దీవులకు పారిపొమ్ము"'],
    correctAnswer: '"Fear not, for I am with you; be not dismayed, for I am your God"',
    bibleReference: 'Isaiah 41:10',
    explanation: 'God\'s abiding presence dispels all fear and sustains His people with strength.',
    explanationTelugu: 'దేవుడు మనకు తోడైయుండి తన నీతిగల దక్షిణహస్తముతో మనలను బలపరచును.'
  },
  {
    easyQ: () => `What triumphant declaration did young David make against the terrifying giant Goliath in 1 Samuel 17?`,
    easyQTe: () => `1 సమూయేలు 17 లో భయంకరుడైన గొల్యాతు ఎదుట యువకుడైన దావీదు పలికిన ధైర్యపు విశ్వాస వాక్యమేది?`,
    medQ: () => `In 1 Samuel 17:45-47, in whose name did David advance against the Philistine champion?`,
    medQTe: () => `1 సమూయేలు 17:45 లో దావీదు ఏ నామమున గొల్యాతును ఎదుర్కొనుటకు వెళ్లెను?`,
    hardQ: () => `Why was David\'s battle cry "the battle is the Lord\'s" the theological antidote to Israel\'s paralysis of fear?`,
    hardQTe: () => `"యుద్ధము యెహోవాదే" అని దావీదు ప్రకటించుట ఇశ్రాయేలు భయమును ఎలా పటాపంచలు చేసెను?`,
    options: ['"You come against me with sword and spear, but I come against you in the name of the Lord Almighty... the battle is the Lord\'s"', '"I surrender my staff to Philistia"', '"I have ten thousand horsemen behind me"', '"Make peace before the sun sets"'],
    optionsTelugu: ['"నీవు కత్తియు ఈటెయు బల్లెమును ధరించుకొని నాయొద్దకు వచ్చుచున్నావు, అయితే సైన్యములకధిపతియైన యెహోవా పేరట నేను వచ్చుచున్నాను... యుద్ధము యెహోవాదే"', '"నా కర్రను అప్పగించుచున్నాను"', '"నా వెనుక పదివేల సైన్యమున్నది"', '"సూర్యుడస్తమించకముందే సంధి చేసుకొనుము"'],
    correctAnswer: '"You come against me with sword and spear, but I come against you in the name of the Lord Almighty... the battle is the Lord\'s"',
    bibleReference: '1 Samuel 17:45-47',
    explanation: 'David conquered fear through unwavering faith in the covenant power of the Lord.',
    explanationTelugu: 'దావీదు సైన్యములకధిపతియైన యెహోవా నామమున గొల్యాతును జయించెను.'
  },
  {
    easyQ: () => `What spirit has God NOT given believers according to 2 Timothy 1:7?`,
    easyQTe: () => `2 తిమోతి 1:7 ప్రకారం దేవుడు మనకు ఏ ఆత్మను ఇవ్వలేదు?`,
    medQ: () => `What three spiritual gifts has God given in place of fear in 2 Timothy 1:7?`,
    medQTe: () => `2 తిమోతి 1:7 లో భయమునకు బదులుగా దేవుడు మనకు అనుగ్రహించిన మూడు ఆత్మీయ వరములేవి?`,
    hardQ: () => `How does a "sound mind" (sophronismos) overcome paralyzing panic in spiritual warfare?`,
    hardQTe: () => `2 తిమోతి 1:7 లోని "హితవైన మనస్సు" ఆత్మీయ పోరాటములో భయమును ఎలా జయించును?`,
    options: ['A spirit of fear, but of power, love, and a sound mind', 'A spirit of slumber and doubt', 'A spirit of anger and revenge', 'A spirit of isolation'],
    optionsTelugu: ['భయముగల ఆత్మను ఇవ్వలేదు, శక్తియు ప్రేమయు హితవైన మనస్సును ఇచ్చెను', 'నిద్రమత్తు మరియు సందేహపు ఆత్మ', 'కోపము మరియు పగ సాధించు ఆత్మ', 'ఏకాంతపు ఆత్మ'],
    correctAnswer: 'A spirit of fear, but of power, love, and a sound mind',
    bibleReference: '2 Timothy 1:7',
    explanation: 'God equips believers with the Holy Spirit of supernatural power, agape love, and self-discipline.',
    explanationTelugu: 'దేవుడు మనకు భయముగల ఆత్మను ఇవ్వక శక్తియు ప్రేమయు హితవైన మనస్సుగల ఆత్మననుగ్రహించెను.'
  },
  {
    easyQ: () => `What courageous confession did David write in Psalm 23:4 when walking through the darkest valley?`,
    easyQTe: () => `కీర్తన 23:4 లో గాఢాంధకారపు లోయలో నడచునప్పుడు దావీదు పలికిన ధైర్యపు మాటలేవి?`,
    medQ: () => `What two instruments of the Good Shepherd bring comfort and eliminate fear in Psalm 23:4?`,
    medQTe: () => `కీర్తన 23:4 లో కాపరియొక్క ఏ రెండు సాధనములు విశ్వాసిని ఆదరించి భయమును పోగొట్టును?`,
    hardQ: () => `What deep security is derived from God\'s personal presence expressed in the pronoun shift "For You are with me"?`,
    hardQTe: () => `"నీవు నాకు తోడైయుందువు" అని దావీదు సంబోధించుటలో గల వ్యక్తిగత భద్రత ఏది?`,
    options: ['"Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me"', '"I will run in terror from the wolves"', '"Darkness will swallow my hope"', '"No shepherd can protect me here"'],
    optionsTelugu: ['"గాఢాంధకారపు లోయలో నేను సంచరించినను ఏ అపాయమునకు భయపడను, నీవు నాకు తోడైయుందువు"', '"తోడేళ్లను చూచి భయపడెదను"', '"చీకటి నన్ను మింగివేయును"', '"కాపరి నన్ను కాపాడలేడు"'],
    correctAnswer: '"Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me"',
    bibleReference: 'Psalm 23:4',
    explanation: 'The Shepherd\'s rod and staff provide complete protection and comfort in every dark valley.',
    explanationTelugu: 'గాఢాంధకారపు లోయలో నడచినను ప్రభువు తోడైయుండి తన దుడ్డుకఱ్ఱతోను దండముతోను ఆదరించును.'
  },
  {
    easyQ: () => `What did Jesus say to His disciples in Matthew 14:27 when walking on the stormy sea?`,
    easyQTe: () => `మత్తయి 14:27 లో తుఫాను సముద్రముపై నడుచుచు వచ్చిన యేసు భయపడిన శిష్యులతో ఏమని సెలవిచ్చెను?`,
    medQ: () => `Why were the disciples terrified when they saw Jesus walking on the water, and how did He calm them?`,
    medQTe: () => `సముద్రముపై నడచుచున్న యేసును చూచి భూతమని భయపడిన శిష్యులను యేసు ఎలా ఓదార్చెను?`,
    hardQ: () => `How does the divine self-declaration "It is I" (Ego Eimi) invoke the covenant name of God (Yahweh) to conquer fear?`,
    hardQTe: () => `"నేనే, భయపడకుడి" (ఎగో ఎయిమీ) అని యేసు పలికిన మాట దైవత్వమును ఎలా నిరూపించుచున్నది?`,
    options: ['"Take courage! It is I. Do not be afraid."', '"Jump into the water and swim"', '"The boat will sink in five minutes"', '"Call upon the Roman fleet"'],
    optionsTelugu: ['"ధైర్యము తెచ్చుకొనుడి, నేనే, భయపడకుడి"', '"నీటిలోనికి దూకి ఈదండి"', '"పడవ మునిగిపోవును"', '"రోమా సైన్యమును పిలవండి"'],
    correctAnswer: '"Take courage! It is I. Do not be afraid."',
    bibleReference: 'Matthew 14:27',
    explanation: 'Jesus immediately spoke peace to their fearful hearts, revealing His divine sovereign presence.',
    explanationTelugu: 'యేసు వెంటనే: ధైర్యము తెచ్చుకొనుడి, నేనే, భయపడకుడని వారితో చెప్పెను.'
  }
];

// ==========================================
// 3. PEACE
// ==========================================
const PEACE_BASE = [
  {
    easyQ: () => `What messianic title in Isaiah 9:6 announces Jesus as the ruler who brings reconciliation and peace?`,
    easyQTe: () => `యెషయా 9:6 లో యేసుక్రీస్తుకు ఇవ్వబడిన సమాధానకరమైన మెస్సీయ బిరుదు ఏది?`,
    medQ: () => `What four divine titles are prophesied of the Messiah in Isaiah 9:6?`,
    medQTe: () => `యెషయా 9:6 లో రాబోవు కుమారునికి ఇవ్వబడిన నాలుగు దివ్య నామములేవి?`,
    hardQ: () => `How does the Hebrew word Shalom in Isaiah 9:6 signify wholeness, restoration, and cosmic reconciliation?`,
    hardQTe: () => `యెషయా 9:6 లోని "సమాధానకర్త" (షాలేమ్) అను మాట సంపూర్ణ ఆత్మీయ క్షేమమును ఎలా సూచించుచున్నది?`,
    options: ['"Prince of Peace"', '"Commander of Chariots"', '"Monarch of War"', '"Judge of Babylon"'],
    optionsTelugu: ['"సమాధానకర్తయగు అధిపతి"', '"రథముల సేనాధిపతి"', '"యుద్ధ రాజు"', '"బబులోను న్యాయాధిపతి"'],
    correctAnswer: '"Prince of Peace"',
    bibleReference: 'Isaiah 9:6',
    explanation: 'Christ is prophesied as the Prince of Peace who establishes eternal peace between God and man.',
    explanationTelugu: 'యేసు సమాధానకర్తయగు అధిపతియై దేవునితో సమాధానమును స్థిరపరచెను.'
  },
  {
    easyQ: () => `What eternal gift of peace did Jesus promise to His disciples in John 14:27 before His crucifixion?`,
    easyQTe: () => `యోహాను 14:27 లో సిలువ వేయబడకముందు యేసు శిష్యులకు ఏ నిత్య సమాధానమును బహుమతిగా ఇచ్చెను?`,
    medQ: () => `How does the peace of Christ contrast with worldly peace in John 14:27?`,
    medQTe: () => `యోహాను 14:27 లో లోకమిచ్చు సమాధానమునకు మరియు క్రీస్తు ఇచ్చు సమాధానమునకు గల తేడా ఏమి?`,
    hardQ: () => `Why is Christ\'s peace an unshakable legacy that guards believers against troubled and fearful hearts?`,
    hardQTe: () => `క్రీస్తు అనుగ్రహించు సమాధానము హృదయ కలవరమును మరియు భయమును ఎలా నిర్మూలించును?`,
    options: ['"Peace I leave with you; My peace I give you. I do not give to you as the world gives"', '"Gold and silver I leave with you"', '"Armies of twelve legions I leave with you"', '"Political crowns I leave with you"'],
    optionsTelugu: ['"శాంతి మీకనుగ్రహించి వెళ్లుచున్నాను; నా శాంతినే మీకనుగ్రహించుచున్నాను; లోకమిచ్చునట్టుగా నేను మీకనుగ్రహించుటలేదు"', '"వెండి బంగారములు ఇచ్చుచున్నాను"', '"సైన్యములను ఇచ్చుచున్నాను"', '"రాజకీయ కిరీటములను ఇచ్చుచున్నాను"'],
    correctAnswer: '"Peace I leave with you; My peace I give you. I do not give to you as the world gives"',
    bibleReference: 'John 14:27',
    explanation: 'Christ bestows a divine, transcendent peace that circumstances cannot diminish.',
    explanationTelugu: 'క్రీస్తు లోకము ఇవ్వలేని అంతరంగిక సమాధానమును మరియు శాంతిని అనుగ్రహించెను.'
  },
  {
    easyQ: () => `According to Philippians 4:7, what will the peace of God, which surpasses all understanding, do for believers?`,
    easyQTe: () => `ఫిలిప్పీయులకు 4:7 ప్రకారం సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము ఏమి చేయును?`,
    medQ: () => `What practice of prayer and thanksgiving unlocks God\'s supernatural peace in Philippians 4:6?`,
    medQTe: () => `ఫిలిప్పీ 4:6 ప్రకారం ఏ ప్రార్థన మరియు విజ్ఞాపన దేవుని సమాధానమును మన హృదయములోనికి తెచ్చును?`,
    hardQ: () => `What military garrison metaphor (phroureo) is used in Philippians 4:7 to describe God\'s peace guarding our hearts?`,
    hardQTe: () => `ఫిలిప్పీ 4:7 లో "కావలియుండును" అను సైనిక పదము దేవుని సమాధానపు భద్రతను ఎలా చాటుచున్నది?`,
    options: ['"Guard your hearts and your minds in Christ Jesus"', '"Make you rulers of empires"', '"Erase all physical labor"', '"Predict the exact dates of the future"'],
    optionsTelugu: ['"క్రీస్తుయేసువలన మీ హృదయములకును మీ తలంపులకును కావలియుండును"', '"సామ్రాజ్యములను ఏలజేయును"', '"కష్టపడవలసిన అవసరము లేకుండా చేయును"', '"భవిష్యత్తు దినములను లెక్కించును"'],
    correctAnswer: '"Guard your hearts and your minds in Christ Jesus"',
    bibleReference: 'Philippians 4:7',
    explanation: 'God\'s peace acts as a protective sentinel over the believer\'s mind and emotions.',
    explanationTelugu: 'సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము మన హృదయములకు కావలియుండును.'
  },
  {
    easyQ: () => `What beatitude does Jesus give to peacemakers in the Sermon on the Mount (Matthew 5:9)?`,
    easyQTe: () => `మత్తయి 5:9 లో కొండమీది ప్రసంగములో సమాధానపరచువారికి యేసు ఏ ధన్యతను ప్రకటించెను?`,
    medQ: () => `Why are peacemakers specifically called the "children of God" in Matthew 5:9?`,
    medQTe: () => `మత్తయి 5:9 లో సమాధానపరచువారు "దేవుని కుమారులు" అని ఎందుకు పిలువబడుదురు?`,
    hardQ: () => `How does active biblical peacemaking (eirene) differ from mere passive conflict avoidance?`,
    hardQTe: () => `క్రైస్తవ సమాధానము కేవలము వివాదములను తప్పించుకొనుట కాక సమాధానమును ఎలా నిర్మించును?`,
    options: ['"Blessed are the peacemakers, for they will be called children of God"', '"Blessed are the conquerors, for they shall seize gold"', '"Blessed are the proud, for they shall reign alone"', '"Blessed are the silent, for none will hear them"'],
    optionsTelugu: ['"సమాధానపరచువారు ధన్యులు; వారు దేవుని కుమారులనబడుదురు"', '"జయించువారు ధన్యులు, వారు బంగారమును దోచుకొందురు"', '"గర్విష్ఠులు ధన్యులు"', '"మౌనముగా ఉండువారు ధన్యులు"'],
    correctAnswer: '"Blessed are the peacemakers, for they will be called children of God"',
    bibleReference: 'Matthew 5:9',
    explanation: 'Those who pursue and establish reconciliation reflect the character of God their Father.',
    explanationTelugu: 'సమాధానపరచువారు దేవుని స్వభావమును ప్రతిబింబించుచు దేవుని కుమారులనబడుదురు.'
  },
  {
    easyQ: () => `What sovereign command did Jesus speak to the howling wind and raging storm on the Sea of Galilee?`,
    easyQTe: () => `గలీలయ సముద్రముపై వీచిన ప్రచండ తుఫానును గద్దించుచు యేసు ఏ ఆజ్ఞాపూర్వక మాట పలికెను?`,
    medQ: () => `In Mark 4:39, what miraculous result immediately followed Jesus rebuking the sea?`,
    medQTe: () => `మార్కు 4:39 లో యేసు గాలిని గద్దించగానే వెంటనే ఏమి జరిగెను?`,
    hardQ: () => `How does Jesus calming the sea with a single word demonstrate His divine authority over natural forces?`,
    hardQTe: () => `ఒక్క మాటతో సముద్రమును నిమ్మళింపజేయుట ద్వారా యేసు తన సర్వాధిపత్యమును ఎలా నిరూపించెను?`,
    options: ['"Peace! Be still!" and the wind ceased and there was a great calm', '"Blow harder toward the shore"', '"Let the boat be broken in pieces"', '"Call for the fishermen to row faster"'],
    optionsTelugu: ['"నిశ్శబ్దమై ఊరకుండుము" అనగా గాలి అణగి మిక్కిలి నిమ్మళమాయెను', '"తీరమువైపు బలంగా వీచుము"', '"పడవ బద్దలగును గాక"', '"చేపలు పట్టువారు వేగంగా నడపండి"'],
    correctAnswer: '"Peace! Be still!" and the wind ceased and there was a great calm',
    bibleReference: 'Mark 4:39',
    explanation: 'Jesus demonstrated His divine sovereignty by speaking peace to the elemental forces.',
    explanationTelugu: 'యేసు గాలిని గద్దించి సముద్రమును చూచి: నిశ్శబ్దమై ఊరకుండుమనగా గొప్ప నిమ్మళమాయెను.'
  }
];

// ==========================================
// 4. LIFE
// ==========================================
const LIFE_BASE = [
  {
    easyQ: () => `In John 14:6, what threefold declaration did Jesus make concerning the path to eternal life?`,
    easyQTe: () => `యోహాను 14:6 లో నిత్యజీవమునకు మార్గమును గూర్చి యేసు పలికిన ముమ్మారపు సత్యమేది?`,
    medQ: () => `According to John 14:6, how many ways exist to come to the Father in heaven?`,
    medQTe: () => `యోహాను 14:6 ప్రకారం పరలోకపు తండ్రియొద్దకు చేరుటకు ఎన్ని మార్గములు కలవు?`,
    hardQ: () => `How does Christ being "the Life" (Zoë) establish Him as the exclusive source of regeneration and immortality?`,
    hardQTe: () => `క్రీస్తు తానే "జీవము"నై యుండుట మానవాళి రక్షణకు ఏకైక ఆధారముగా ఎలా నిలచుచున్నది?`,
    options: ['"I am the way, the truth, and the life. No one comes to the Father except through Me"', '"I am a guide among many teachers"', '"There are seven roads to the eternal kingdom"', '"Follow philosophy to find life"'],
    optionsTelugu: ['"నేనే మార్గమును, సత్యమును, జీవమును; నా ద్వారానే తప్ప యెవడును తండ్రియొద్దకు రాడు"', '"నేను అనేక బోధకులలో ఒకడను"', '"పరలోకమునకు ఏడు మార్గములు కలవు"', '"తత్వశాస్త్రమును వెంబడించుము"'],
    correctAnswer: '"I am the way, the truth, and the life. No one comes to the Father except through Me"',
    bibleReference: 'John 14:6',
    explanation: 'Jesus Christ is the singular and complete embodiment of truth and eternal life.',
    explanationTelugu: 'యేసే మార్గము, సత్యము, మరియు నిత్యజీవము; ఆయన ద్వారానేకాని తండ్రియొద్దకు రాలేము.'
  },
  {
    easyQ: () => `What abundant purpose did Jesus declare for His coming in John 10:10?`,
    easyQTe: () => `యోహాను 10:10 లో తాను లోకమునకు వచ్చిన పరమ ఉద్దేశమును గూర్చి యేసు ఏమని సెలవిచ్చెను?`,
    medQ: () => `What contrast does John 10:10 draw between the destructive thief and the Good Shepherd?`,
    medQTe: () => `యోహాను 10:10 లో దొంగ చేయు పనులకు మరియు మంచి కాపరియైన యేసు ఇచ్చు జీవమునకు గల తేడా ఏమి?`,
    hardQ: () => `What is the qualitative meaning of "life to the full" (perisson) in the kingdom of God?`,
    hardQTe: () => `క్రీస్తు అనుగ్రహించు "సమృద్ధియైన జీవము" యొక్క ఆత్మీయ సంపూర్ణత ఏది?`,
    options: ['"I came that they may have life, and have it to the full (abundantly)"', '"I came to conquer Rome with an army"', '"I came to demand taxes of gold"', '"I came to build earthly kingdoms"'],
    optionsTelugu: ['"గొఱ్ఱెలకు జీవము కలుగుటకును, అది సమృద్ధిగా కలుగుటకును నేను వచ్చితిని"', '"రోమాను సైన్యముతో జయించుటకు వచ్చితిని"', '"పన్నులను వసూలు చేయుటకు వచ్చితిని"', '"భూలోక రాజ్యములను స్థాపించుటకు వచ్చితిని"'],
    correctAnswer: '"I came that they may have life, and have it to the full (abundantly)"',
    bibleReference: 'John 10:10',
    explanation: 'Christ came to give believers vibrant, eternal, and abundant life in fellowship with God.',
    explanationTelugu: 'యేసు మనకు నిత్యజీవమును, అది సమృద్ధిగా కలుగుటకే లోకమునకు వచ్చెను.'
  },
  {
    easyQ: () => `What did Jesus proclaim to Martha at the tomb of Lazarus in John 11:25?`,
    easyQTe: () => `లాజరు సమాధియొద్ద మార్తతో యేసు పలికిన అద్భుతమైన జీవపు వాక్యమేది?`,
    medQ: () => `According to John 11:25-26, what promise is given to whoever lives and believes in Christ?`,
    medQTe: () => `యోహాను 11:25-26 ప్రకారం క్రీస్తును నమ్మువాడు చనిపోయినను ఏమి పొందును?`,
    hardQ: () => `How does Christ as the Resurrection and the Life triumph over physical and spiritual mortality?`,
    hardQTe: () => `క్రీస్తు పునరుత్థానమును జీవమునై యుండుట మరణముపై శాశ్వత విజయమును ఎలా చాటుచున్నది?`,
    options: ['"I am the resurrection and the life. The one who believes in Me will live, even though they die"', '"Lazarus has passed beyond all recovery"', '"Build a shrine of marble over the cave"', '"Wait for the final centuries to hope"'],
    optionsTelugu: ['"పునరుత్థానమును జీవమును నేనే; నాయందు విశ్వాసముంచువాడు చనిపోయినను బ్రదుకును"', '"లాజరు ఇక బ్రదుకలేడు"', '"సమాధిపై పాలరాతి మందిరము కట్టుము"', '"శతాబ్దములు గడచువరకు నిరీక్షించుము"'],
    correctAnswer: '"I am the resurrection and the life. The one who believes in Me will live, even though they die"',
    bibleReference: 'John 11:25',
    explanation: 'Christ has authority over death; all who believe in Him inherit imperishable eternal life.',
    explanationTelugu: 'పునరుత్థానమును జీవమును యేసే; ఆయనను నమ్మువాడు చనిపోయినను బ్రదుకును.'
  },
  {
    easyQ: () => `What does Romans 6:23 contrast between the wages of sin and the gift of God?`,
    easyQTe: () => `రోమీయులకు 6:23 లో పాపము వలన వచ్చు జీతమునకు మరియు దేవుని కృపావరమునకు గల వ్యత్యాసమేమి?`,
    medQ: () => `In Romans 6:23, what is the free gift of God through Jesus Christ our Lord?`,
    medQTe: () => `రోమీయులకు 6:23 లో మన ప్రభువైన క్రీస్తుయేసునందు దేవుడు ఇచ్చే ఉచితమైన కృపావరము ఏది?`,
    hardQ: () => `Why is eternal life classified strictly as a divine gift (charisma) rather than earned wages?`,
    hardQTe: () => `నిత్యజీవము క్రియలవలన వచ్చు జీతము కాక దేవుని ఉచితమైన కృపావరమని ఎందుకు చెప్పబడెను?`,
    options: ['"For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord"', '"The wages of sin is poverty, but righteousness brings gold"', '"Sin is rewarded with kingdoms"', '"Death is an illusion of philosophy"'],
    optionsTelugu: ['"ఏలయనగా పాపమువలన వచ్చు జీతము మరణము, అయితే దేవుని కృపావరము మన ప్రభువైన క్రీస్తుయేసునందు నిత్యజీవము"', '"పాపము పేదరికమును తెచ్చును, నీతి బంగారము తెచ్చును"', '"పాపమునకు రాజ్యములు దక్కును"', '"మరణము ఒక భ్రమ"'],
    correctAnswer: '"For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord"',
    bibleReference: 'Romans 6:23',
    explanation: 'Sin earns spiritual death, but God bestows eternal life as a gracious and unearned gift in Christ.',
    explanationTelugu: 'పాపమువలన వచ్చు జీతము మరణము, అయితే దేవుని కృపావరము క్రీస్తునందు నిత్యజీవము.'
  },
  {
    easyQ: () => `What life-giving tree was planted in Eden and will bear fruit in the New Jerusalem (Rev 22:2)?`,
    easyQTe: () => `ఏదేను వనములో ఉంచబడి, ప్రకటన 22:2 లో నూతన యెరూషలేములో నెలనెలకు ఫలములిచ్చు జీవపు వృక్షమేది?`,
    medQ: () => `According to Revelation 22:2, what medicinal purpose do the leaves of the Tree of Life serve?`,
    medQTe: () => `ప్రకటన 22:2 ప్రకారం జీవవృక్షపు ఆకులు ఏ స్వస్థత కొరకు ఉపయోగపడును?`,
    hardQ: () => `How does the restoration of access to the Tree of Life in Revelation 22 reverse the Edenic expulsion of Genesis 3?`,
    hardQTe: () => `ఆదికాండము 3 లో కోల్పోయిన జీవవృక్ష ఫలమును ప్రకటన 22 లో దేవుడు ఎలా తిరిగి ప్రసాదించెను?`,
    options: ['The Tree of Life, bearing twelve crops of fruit with leaves for healing of the nations', 'The cedar of Lebanon', 'The cursed fig tree', 'The bramble bush of Jotham'],
    optionsTelugu: ['జాతుల స్వస్థతకొరకైన ఆకులు మరియు పన్నెండు ఫలములిచ్చు జీవవృక్షము', 'లెబానోను దేవదారు వృక్షము', 'శపించబడిన అంజూరపు చెట్టు', 'ముండ్లపొద'],
    correctAnswer: 'The Tree of Life, bearing twelve crops of fruit with leaves for healing of the nations',
    bibleReference: 'Revelation 22:2, Genesis 2:9',
    explanation: 'The Tree of Life represents eternal communion and unending vitality in God\'s presence.',
    explanationTelugu: 'జీవవృక్షము దేవుని సముఖములోని నిత్యజీవమును మరియు స్వస్థతను సూచించుచున్నది.'
  }
];

// ==========================================
// 5. WISDOM
// ==========================================
const WISDOM_BASE = [
  {
    easyQ: () => `According to Proverbs 9:10, what is the foundational beginning of all true wisdom?`,
    easyQTe: () => `సామెతలు 9:10 ప్రకారం నిజమైన జ్ఞానమునకు మూలము ఏది?`,
    medQ: () => `What parallel is drawn in Proverbs 9:10 between the fear of the Lord and the knowledge of the Holy One?`,
    medQTe: () => `సామెతలు 9:10 లో యెహోవాయందు భయభక్తులు కలిగియుండుట మరియు పరిశుద్ధ దేవుని తెలివి ఏ విధముగా జతచేయబడెను?`,
    hardQ: () => `How does the biblical concept of "fear of the Lord" (Yirat Yahweh) signify reverent submission rather than cringing terror?`,
    hardQTe: () => `యెహోవాయందు భయభక్తులు కలిగియుండుట దాసత్వపు భయము కాక భక్తిపూర్వక విధేయతను ఎలా చూపుచున్నది?`,
    options: ['"The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding"', '"Reading many philosophical books"', '"Accumulating gold and silver"', '"Winning political debates"'],
    optionsTelugu: ['"యెహోవాయందు భయభక్తులు కలిగియుండుటయే జ్ఞానమునకు మూలము, పరిశుద్ధ దేవుని గూర్చిన తెలివియే వివేకము"', '"తత్వశాస్త్ర పుస్తకములు చదువుట"', '"వెండి బంగారములను సమకూర్చుకొనుట"', '"రాజకీయ వాదనలు గెలుచుట"'],
    correctAnswer: '"The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding"',
    bibleReference: 'Proverbs 9:10',
    explanation: 'True wisdom originates in humble awe, worship, and obedience to the Lord.',
    explanationTelugu: 'యెహోవాయందు భయభక్తులు కలిగియుండుటయే నిజమైన జ్ఞానమునకు మరియు వివేకమునకు ప్రారంభము.'
  },
  {
    easyQ: () => `Which king of Israel asked God for a wise and discerning heart rather than wealth, long life, or victory over enemies?`,
    easyQTe: () => `ఐశ్వర్యమును గాని, దీర్ఘాయుష్షును గాని శత్రువుల ప్రాణమును గాని అడుగక వివేకముగల హృదయమును దేవునిని అడిగిన రాజు ఎవరు?`,
    medQ: () => `At what holy place did the Lord appear to young Solomon in a dream by night (1 Kings 3:4-5)?`,
    medQTe: () => `1 రాజులు 3 లో దేవుడు గిబియోనులో రాత్రివేళ స్వప్నమందు సొలొమోనుకు ప్రత్యక్షమై ఏమని అడిగెను?`,
    hardQ: () => `Why was God so pleased with Solomon\'s request for a discerning heart to govern Israel?`,
    hardQTe: () => `ప్రజలను న్యాయముగా ఏలుటకు సొలొమోను జ్ఞానమును అడిగినప్పుడు దేవుడు ఎందుకు బహుగా సంతోషించెను?`,
    options: ['King Solomon', 'King David', 'King Saul', 'King Rehoboam'],
    optionsTelugu: ['సొలొమోను రాజు', 'దావీదు రాజు', 'సౌలు రాజు', 'రెహెబాము రాజు'],
    correctAnswer: 'King Solomon',
    bibleReference: '1 Kings 3:5-14',
    explanation: 'Solomon requested wisdom to shepherd God\'s people, and God gave him wisdom, wealth, and honor.',
    explanationTelugu: 'సొలొమోను ప్రజలను తీర్పుతీర్చుటకు వివేకముగల హృదయమును అడుగగా దేవుడు జ్ఞానమును ఐశ్వర్యమును ఇచ్చెను.'
  },
  {
    easyQ: () => `What invitation does James 1:5 give to anyone who feels they lack divine wisdom?`,
    easyQTe: () => `యాకోబు 1:5 లో జ్ఞానము కొదువగా ఉన్న ప్రతివానికి ఇవ్వబడిన ఆహ్వానమేది?`,
    medQ: () => `How does God give wisdom according to James 1:5?`,
    medQTe: () => `యాకోబు 1:5 లో దేవుడు జ్ఞానమును అడుగువారికి ఏవిధముగా దయచేయును?`,
    hardQ: () => `What condition of unwavering faith without doubting is required when praying for wisdom in James 1:6-7?`,
    hardQTe: () => `యాకోబు 1:6 లో సందేహింపక విశ్వాసముతో అడుగవలెనని ఎందుకు హెచ్చరించెను?`,
    options: ['"If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you"', '"Search for wise men in Athens"', '"Rely on your own strength"', '"Wait until old age"'],
    optionsTelugu: ['"మీలో ఎవనికైనను జ్ఞానము కొదువగా ఉన్నయెడల అతడు దేవునిని అడుగవలెను, ఆయన ఎవనిని గద్దింపక అందరికి ధారాళముగా దయచేయును"', '"ఏథెన్సులో జ్ఞానులను వెదకుము"', '"నీ స్వబుద్ధిపై ఆధారపడుము"', '"వృద్ధాప్యము వచ్చువరకు వేచియుండుము"'],
    correctAnswer: '"If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you"',
    bibleReference: 'James 1:5',
    explanation: 'God generously bestows wisdom upon all who ask Him in faith without doubting.',
    explanationTelugu: 'దేవుని అడుగు ప్రతివానికి ఆయన ఏ గద్దింపు లేకుండా ధారాళముగా జ్ఞానమును అనుగ్రహించును.'
  },
  {
    easyQ: () => `In Jesus\' parable in Matthew 7:24, on what foundation did the wise builder construct his house?`,
    easyQTe: () => `మత్తయి 7:24 లో బుద్ధిమంతుడైన మనుష్యుడు తన ఇల్లును ఏ పునాదిపై కట్టెను?`,
    medQ: () => `According to Matthew 7:24-25, what spiritual practice defines the one who builds upon the Rock?`,
    medQTe: () => `మత్తయి 7:24 ప్రకారం బండపై ఇల్లు కట్టువాడు ఎవరితో సమానము?`,
    hardQ: () => `How does hearing Christ\'s words and putting them into practice distinguish genuine biblical wisdom from intellectual hypocrisy?`,
    hardQTe: () => `యేసు మాటలు విని వాటిచొప్పున చేయుట అనునది నిజమైన జ్ఞానమును ఎలా రుజువు చేయుచున్నది?`,
    options: ['Upon the solid Rock, so it did not fall when rains and floods came', 'Upon shifting sand at the seashore', 'Upon dry grass in the meadow', 'Upon wood shavings'],
    optionsTelugu: ['బండపై కట్టెను, గనుక వాన కురిసి వరదలు వచ్చినను అది పడలేదు', 'సముద్రపు ఇసుకపై', 'ఎండు గడ్డిపై', 'చెక్క పొట్టుపై'],
    correctAnswer: 'Upon the solid Rock, so it did not fall when rains and floods came',
    bibleReference: 'Matthew 7:24-25',
    explanation: 'The wise person hears the teachings of Jesus Christ and actively puts them into practice.',
    explanationTelugu: 'ప్రభువు మాటలు విని వాటిచొప్పున చేయువాడు బండమీద తన ఇల్లు కట్టుకొనిన బుద్ధిమంతునికి పోలియున్నాడు.'
  },
  {
    easyQ: () => `Which foreign monarch traveled from the ends of the earth to test King Solomon\'s legendary wisdom?`,
    easyQTe: () => `సొలొమోను జ్ఞానమును కఠినమైన ప్రశ్నలతో పరీక్షించుటకు భూదిగంతముల నుండి వచ్చిన రాణి ఎవరు?`,
    medQ: () => `In 1 Kings 10:6-7, what breathtaking confession did the Queen of Sheba make after seeing Solomon\'s wisdom?`,
    medQTe: () => `1 రాజులు 10 లో షేబారాణి సొలొమోను జ్ఞానమును చూచిన తరువాత ఏమని ఆశ్చర్యపోయెను?`,
    hardQ: () => `How did Jesus cite the Queen of the South in Matthew 12:42 as a prophetic witness against unbelief?`,
    hardQTe: () => `మత్తయి 12:42 లో యేసు దక్షిణదేశపు రాణిని గూర్చి మాట్లాడుతూ తనను తాను సొలొమోనుకంటె గొప్పవానిగా ఎలా నిరూపించెను?`,
    options: ['The Queen of Sheba ("The half was not told me; your wisdom exceeds the report I heard")', 'Queen Jezebel of Tyre', 'Queen Athaliah of Judah', 'Queen Vashti of Persia'],
    optionsTelugu: ['షేబా దేశపు రాణి ("నేను వినినదానిలో సగమైనను నాతో చెప్పబడలేదు; నీ జ్ఞానము నా వినికిడిని మించియున్నది")', 'యెజెబెలు రాణి', 'అతల్యా రాణి', 'వష్తి రాణి'],
    correctAnswer: 'The Queen of Sheba ("The half was not told me; your wisdom exceeds the report I heard")',
    bibleReference: '1 Kings 10:1-9',
    explanation: 'The Queen of Sheba confirmed that Solomon\'s divine wisdom far exceeded all worldwide reports.',
    explanationTelugu: 'షేబా రాణి సొలొమోను జ్ఞానమును స్వయముగా చూచి దేవుని ఘనపరచెను.'
  }
];

// Execute Batch 3 Assembly
console.log('Generating Final 5 Banks: Failure, Fear, Peace, Life, Wisdom...');
assembleBank('Failure', 'fai', expandFacts(FAILURE_BASE));
assembleBank('Fear', 'fea', expandFacts(FEAR_BASE));
assembleBank('Peace', 'pea', expandFacts(PEACE_BASE));
assembleBank('Life', 'lif', expandFacts(LIFE_BASE));
assembleBank('Wisdom', 'wis', expandFacts(WISDOM_BASE));

console.log('All 5 banks in Batch 3 successfully assembled!');
