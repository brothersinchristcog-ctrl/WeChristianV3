const { buildBank } = require('./bank_builder.js');

// 50 Foundation Facts for Wisdom (Proverbs foundational wisdom, Fear of the Lord, Solomon's request, Job's inquiry)
function buildWisdomFoundation() {
  const data = [
    [
      "Proverbs 1:7 the fear of the Lord as the foundation of knowledge: 'The fear of the Lord is the beginning of knowledge, but fools despise wisdom and instruction'",
      "సామెతలు 1:7 జ్ఞానమునకు మూలమైన యెహోవాయందలి భయభక్తులు: 'యెహోవాయందు భయభక్తులు కలిగియుండుట తెలివికి మూలము; మూర్ఖులు జ్ఞానమును ఉపదేశమును తిరస్కరింతురు'",
      "Proverbs 1:7",
      "The fear of the Lord is the beginning of knowledge, but fools despise wisdom and instruction",
      "యెహోవాయందు భయభక్తులు కలిగియుండుట తెలివికి మూలము; మూర్ఖులు జ్ఞానమును ఉపదేశమును తిరస్కరింతురు",
      "True wisdom does not begin in human philosophy, but in humble, reverent surrender to the transcendent holy Creator.",
      "మానవ తత్వములలో కాక యెహోవాయందలి పవిత్ర భయభక్తులలోనే సమస్త నిజమైన జ్ఞానము ఆరంభమగును."
    ],
    [
      "Proverbs 2:6 the Lord giving wisdom from His mouth: 'For the Lord gives wisdom; from His mouth come knowledge and understanding'",
      "సామెతలు 2:6 యెహోవాయే జ్ఞానమిచ్చువాడు: 'యెహోవాయే జ్ఞానమిచ్చువాడు; తెలివియు వివేచనయు ఆయన నోటనుండి వచ్చును'",
      "Proverbs 2:6",
      "For the Lord gives wisdom; from His mouth come knowledge and understanding",
      "యెహోవాయే జ్ఞానమిచ్చువాడు; తెలివియు వివేచనయు ఆయన నోటనుండి వచ్చును",
      "Wisdom is neither self-generated nor innate to mortal flesh; it is an unmerited gift proceeding directly from divine utterance.",
      "జ్ఞానము మానవ ఆలోచనలవలన కలుగునది కాదు; అది దేవుని పరిశుద్ధ నోటి మాటలనుండి అనుగ్రహింపబడు వరము."
    ],
    [
      "Proverbs 3:13-14 the blessedness of finding wisdom exceeding silver and gold: 'Happy is the man who finds wisdom, and the man who gains understanding; for her proceeds are better than the profits of silver, and her gain than fine gold'",
      "సామెతలు 3:13-14 వెండి బంగారములకంటె శ్రేష్ఠమైన జ్ఞానము: 'జ్ఞానము సంపాదించినవాడు ధన్యుడు, వివేచన కలిగినవాడు ధన్యుడు; దాని వ్యాపారము వెండి వ్యాపారముకంటెను దాని లాభము మేలిమి బంగారముకంటెను మంచిది'",
      "Proverbs 3:13-14",
      "Happy is the man who finds wisdom, and the man who gains understanding; for her proceeds are better than the profits of silver, and her gain than fine gold",
      "జ్ఞానము సంపాదించినవాడు ధన్యుడు, వివేచన కలిగినవాడు ధన్యుడు; దాని వ్యాపారము వెండి వ్యాపారముకంటెను దాని లాభము మేలిమి బంగారముకంటెను మంచిది",
      "Earthly bullion tarnishes and vanishes, but divine wisdom enriches the spirit with eternal treasures that cannot perish.",
      "భౌతిక సంపదలకంటె దైవిక జ్ఞానమును వివేచనను సంపాదించుకొనుట శాశ్వతమైన ఆత్మీయ భాగ్యము."
    ],
    [
      "Proverbs 3:17-18 wisdom's ways being pleasantness and a tree of life: 'Her ways are ways of pleasantness, and all her paths are peace. She is a tree of life to those who take hold of her'",
      "సామెతలు 3:17-18 జీవవృక్షమైన దైవిక జ్ఞానము: 'దాని మార్గములు రమ్యమైన మార్గములు, దాని త్రోవలన్నియు సమాధానకరములు; దాని నవలంబించువారికి అది జీవవృక్షము'",
      "Proverbs 3:17-18",
      "Her ways are ways of pleasantness, and all her paths are peace. She is a tree of life to those who take hold of her",
      "దాని మార్గములు రమ్యమైన మార్గములు, దాని త్రోవలన్నియు సమాధానకరములు; దాని నవలంబించువారికి అది జీవవృక్షము",
      "God's wisdom produces unfeigned inner harmony, leading travelers along quiet avenues of shalom into eternal vitality.",
      "జ్ఞానమార్గములలో నడుచువారికి సమాధానము కలుగును; దానిని గట్టిగా పట్టుకొనువారికి అది జీవవృక్షమువలె నిత్య ఫలములనిచ్చును."
    ],
    [
      "Proverbs 4:5-7 getting wisdom as the principal thing: 'Wisdom is the principal thing; therefore get wisdom. And in all your getting, get understanding'",
      "సామెతలు 4:7 జ్ఞానమే ముఖ్యమైనది: 'జ్ఞానము సంపాదించుకొనుటయే ముఖ్యము, జ్ఞానము సంపాదించుకొనుము; నీ సంపాదన అంతయు ఇచ్చి వివేచన సంపాదించుకొనుము'",
      "Proverbs 4:7",
      "Wisdom is the principal thing; therefore get wisdom. And in all your getting, get understanding",
      "జ్ఞానము సంపాదించుకొనుటయే ముఖ్యము, జ్ఞానము సంపాదించుకొనుము; నీ సంపాదన అంతయు ఇచ్చి వివేచన సంపాదించుకొనుము",
      "In the hierarchy of mortal values, obtaining divine wisdom stands supreme above every temporal title and achievement.",
      "సమస్త మానవ కార్యములలో దేవుని జ్ఞానమును వివేచనను సంపాదించుకొనుటయే అత్యున్నతమైన పరమ కర్తవ్యము."
    ],
    [
      "Proverbs 8:11 wisdom better than rubies: 'For wisdom is better than rubies, and all the things one may desire cannot be compared with her'",
      "సామెతలు 8:11 ముత్యములకంటె విలువైన జ్ఞానము: 'జ్ఞానము ముత్యములకంటె శ్రేష్ఠమైనది, ఇష్టమైనవేవియు దానితో సాటి కావు'",
      "Proverbs 8:11",
      "For wisdom is better than rubies, and all the things one may desire cannot be compared with her",
      "జ్ఞానము ముత్యములకంటె శ్రేష్ఠమైనది, ఇష్టమైనవేవియు దానితో సాటి కావు",
      "The most exquisite gems mined from the earth pale into insignificance when placed beside the luminescent beauty of divine wisdom.",
      "లోకములోని అత్యంత ఖరీదైన రత్నములు మరియు సమస్త ఆశలు దైవిక జ్ఞానపు వెలుగుతో ఏమాత్రము సాటిరావు."
    ],
    [
      "Proverbs 8:12 wisdom dwelling with prudence: 'I, wisdom, dwell with prudence, and find out knowledge and discretion'",
      "సామెతలు 8:12 వివేకముతో నివసించు జ్ఞానము: 'జ్ఞానమును నేను వివేకమును నా నివాసముగా చేసికొనియున్నాను, విచక్షణాజ్ఞానమును కనుగొందును'",
      "Proverbs 8:12",
      "I, wisdom, dwell with prudence, and find out knowledge and discretion",
      "జ్ఞానమును నేను వివేకమును నా నివాసముగా చేసికొనియున్నాను, విచక్షణాజ్ఞానమును కనుగొందును",
      "True wisdom is not reckless impulse; it walks hand in hand with disciplined prudence, sound judgment, and moral discretion.",
      "నిజమైన జ్ఞానము వివేకముతో కూడి విచక్షణతో నడుచుకొనుటకు దైవిక ఆలోచనను అనుగ్రహించును."
    ],
    [
      "Proverbs 8:22 the Lord possessing wisdom at the beginning: 'The Lord possessed me at the beginning of His way, before His works of old'",
      "సామెతలు 8:22 పూర్వకాలమునందు దేవుడు జ్ఞానమును కలిగియుండుట: 'పూర్వకాలమునందు తన కార్యసిద్ధికి మొదట తన మార్గమునకు పూర్వము యెహోవా నన్ను పొందెను'",
      "Proverbs 8:22",
      "The Lord possessed me at the beginning of His way, before His works of old",
      "పూర్వకాలమునందు తన కార్యసిద్ధికి మొదట తన మార్గమునకు పూర్వము యెహోవా నన్ను పొందెను",
      "Divine wisdom was not an afterthought in creation, but the primordial co-architect present before the cosmos unfolded.",
      "సృష్టి ఆరంభమునకు పూర్వమే దైవిక జ్ఞానము దేవునియొద్ద ఉండి సమస్త నిర్మాణములో ప్రధాన పాత్ర వహించెను."
    ],
    [
      "Proverbs 9:1 wisdom building her house with seven pillars: 'Wisdom has built her house, she has hewn out her seven pillars'",
      "సామెతలు 9:1 ఏడు స్తంభములతో జ్ఞానము నిర్మించిన గృహము: 'జ్ఞానము తన యిల్లు కట్టుకొనియున్నది, అది తన యేడు స్తంభములను చెక్కుకొనియున్నది'",
      "Proverbs 9:1",
      "Wisdom has built her house, she has hewn out her seven pillars",
      "జ్ఞానము తన యిల్లు కట్టుకొనియున్నది, అది తన యేడు స్తంభములను చెక్కుకొనియున్నది",
      "God's wisdom constructs a perfectly balanced, unshakable temple of truth supported by complete spiritual perfection.",
      "పరిపూర్ణతను సూచించే ఏడు స్తంభములపై దైవిక జ్ఞానము భద్రమైన సత్య గృహమును నిర్మించి పిలుచుచున్నది."
    ],
    [
      "Proverbs 9:10 fear of the Lord as the beginning of wisdom: 'The fear of the Lord is the beginning of wisdom, and the knowledge of the Holy One is understanding'",
      "సామెతలు 9:10 పరిశుద్ధ దేవుని ఎరుగుటయే వివేచన: 'యెహోవాయందు భయభక్తులు కలిగియుండుటయే జ్ఞానమునకు మూలము, పరిశుద్ధ దేవుని గూర్చిన తెలివియే వివేచన'",
      "Proverbs 9:10",
      "The fear of the Lord is the beginning of wisdom, and the knowledge of the Holy One is understanding",
      "యెహోవాయందు భయభక్తులు కలిగియుండుటయే జ్ఞానమునకు మూలము, పరిశుద్ధ దేవుని గూర్చిన తెలివియే వివేచన",
      "Understanding cannot ripen in an atheist mind; knowing the character of the Holy One is the sole bedrock of intellectual clarity.",
      "పరిశుద్ధుడైన దేవుని గుణలక్షణములను ఎరిగియుండుటయే మానవుని హృదయములో వివేచనకు పునాది."
    ],
    [
      "Proverbs 10:1 a wise son making a glad father: 'A wise son makes a glad father, but a foolish son is the grief of his mother'",
      "సామెతలు 10:1 జ్ఞానముగల కుమారుడు తండ్రిని సంతోషపెట్టుట: 'జ్ఞానముగల కుమారుడు తండ్రిని సంతోషపరచును, బుద్ధిలేని కుమారుడు తన తల్లికి దుఃఖము తెచ్చును'",
      "Proverbs 10:1",
      "A wise son makes a glad father, but a foolish son is the grief of his mother",
      "జ్ఞానముగల కుమారుడు తండ్రిని సంతోషపరచును, బుద్ధిలేని కుమారుడు తన తల్లికి దుఃఖము తెచ్చును",
      "Wisdom is evidenced domestically; righteous choices bring profound joy to parents while foolish rebellions break parental hearts.",
      "పిల్లలు జ్ఞానముతో ప్రవర్తించినప్పుడు కుటుంబములో తండ్రికి ఆనందము కలుగును; మూర్ఖత తల్లిదండ్రులకు దుఃఖహేతువు."
    ],
    [
      "Proverbs 11:2 wisdom with the humble: 'When pride comes, then comes shame; but with the humble is wisdom'",
      "సామెతలు 11:2 వినయముగలవారియొద్ద జ్ఞానముండుట: 'అహంకారము వచ్చినవెంటనే అవమానము వచ్చును, వినయముగలవారియొద్ద జ్ఞానము కలదు'",
      "Proverbs 11:2",
      "When pride comes, then comes shame; but with the humble is wisdom",
      "అహంకారము వచ్చినవెంటనే అవమానము వచ్చును, వినయముగలవారియొద్ద జ్ఞానము కలదు",
      "Arrogance blinds the soul to moral reality, but humility creates an empty vessel ready to receive divine illumination.",
      "గర్వము పతనమును అవమానమును తేగా, నమ్రతగల దీనుల హృదయములో దేవుని జ్ఞానము వర్ధిల్లును."
    ],
    [
      "Proverbs 12:15 the wise man heeding counsel: 'The way of a fool is right in his own eyes, but he who heeds counsel is wise'",
      "సామెతలు 12:15 ఆలోచన వినువాడు జ్ఞానముగలవాడు: 'మూఢుని మార్గము వాని దృష్టికి సరియైనదిగా కనబడును, ఆలోచన వినువాడు జ్ఞానముగలవాడు'",
      "Proverbs 12:15",
      "The way of a fool is right in his own eyes, but he who heeds counsel is wise",
      "మూఢుని మార్గము వాని దృష్టికి సరియైనదిగా కనబడును, ఆలోచన వినువాడు జ్ఞానముగలవాడు",
      "Fools are trapped in an echo chamber of self-delusion, whereas the wise welcome correction and constructive guidance.",
      "తన ఆలోచనయే సరైనదని మొండిగా భావించువాడు మూర్ఖుడు; పెద్దల దైవిక సలహాను వినువాడు నిజమైన జ్ఞాని."
    ],
    [
      "Proverbs 13:20 walking with wise men becoming wise: 'He who walks with wise men will be wise, but the companion of fools will be destroyed'",
      "సామెతలు 13:20 జ్ఞానుల సహవాసము జ్ఞానమునిచ్చుట: 'జ్ఞానుల సహవాసము చేయువాడు జ్ఞానము గలవాడగును, మూర్ఖుల సహవాసము చేయువాడు చెడిపోవును'",
      "Proverbs 13:20",
      "He who walks with wise men will be wise, but the companion of fools will be destroyed",
      "జ్ఞానుల సహవాసము చేయువాడు జ్ఞానము గలవాడగును, మూర్ఖుల సహవాసము చేయువాడు చెడిపోవును",
      "Character is contagious; sustained fellowship with godly minds transfers wisdom, while worldly friendships corrupt morality.",
      "భక్తిగల జ్ఞానులతో కలిసి నడుచువాడు జ్ఞానమును పొందును; అవివేకులతో సహవాసము వినాశనమునకు దారితీయును."
    ],
    [
      "Proverbs 14:1 the wise woman building her house: 'The wise woman builds her house, but the foolish pulls it down with her hands'",
      "సామెతలు 14:1 జ్ఞానవంతురాలైన స్త్రీ తన యిల్లు కట్టుకొనుట: 'జ్ఞానవంతురాలైన స్త్రీ తన యిల్లు కట్టును, మూఢురాలు తన చేతులతో దానిని ఊడబీకును'",
      "Proverbs 14:1",
      "The wise woman builds her house, but the foolish pulls it down with her hands",
      "జ్ఞానవంతురాలైన స్త్రీ తన యిల్లు కట్టును, మూఢురాలు తన చేతులతో దానిని ఊడబీకును",
      "Domestic flourishing requires persistent, wise cultivation; foolish emotionalism tears down the domestic sanctuary.",
      "జ్ఞానవంతురాలైన స్త్రీ ప్రార్థనతో వివేకముతో కుటుంబాన్ని నిర్మించును; మూర్ఖత గృహపు సమాధానాన్ని నాశనము చేయును."
    ],
    [
      "Proverbs 14:8 the wisdom of the prudent to understand his way: 'The wisdom of the prudent is to understand his way, but the folly of fools is deceit'",
      "సామెతలు 14:8 తన మార్గమును వివేచించుకొను జ్ఞానము: 'తన మార్గమును వివేచించుకొనుట వివేకియొక్క జ్ఞానము, మూర్ఖుల బుద్ధిహీనత మోసకరమైనది'",
      "Proverbs 14:8",
      "The wisdom of the prudent is to understand his way, but the folly of fools is deceit",
      "తన మార్గమును వివేచించుకొనుట వివేకియొక్క జ్ఞానము, మూర్ఖుల బుద్ధిహీనత మోసకరమైనది",
      "Prudence continually audits personal direction by the Word of God, avoiding the tragic self-deceptions of folly.",
      "వివేకి నిరంతరము తన ప్రవర్తనను దేవుని వాక్యపు వెలుగులో సరిచూచుకొనుచు నడుచును."
    ],
    [
      "Proverbs 14:33 wisdom resting in the heart of understanding: 'Wisdom rests in the heart of him who has understanding, but what is in the heart of fools is made known'",
      "సామెతలు 14:33 వివేకముగలవాని హృదయమందు జ్ఞానము నిలుచుట: 'వివేకముగలవాని హృదయమందు జ్ఞానము నిలుచును, మూర్ఖుల అంతరంగములో ఉన్నది బయలుపడును'",
      "Proverbs 14:33",
      "Wisdom rests in the heart of him who has understanding, but what is in the heart of fools is made known",
      "వివేకముగలవాని హృదయమందు జ్ఞానము నిలుచును, మూర్ఖుల అంతరంగములో ఉన్నది బయలుపడును",
      "Wisdom maintains a serene, quiet sanctuary in the thoughtful soul, while foolishness erupts in loud, boastful exhibitions.",
      "దైవిక జ్ఞానము వివేకి హృదయములో నెమ్మదిగా విశ్రమించును; మూర్ఖుడు తన అజ్ఞానాన్ని అందరియెదుట ప్రదర్శించుకొనును."
    ],
    [
      "Proverbs 15:33 the instruction of wisdom and humility before honor: 'The fear of the Lord is the instruction of wisdom, and before honor is humility'",
      "సామెతలు 15:33 ఘనతకు ముందు వినయముండుట: 'యెహోవాయందు భయభక్తులు కలిగియుండుట జ్ఞానాభ్యాసము, ఘనతకు ముందు వినయము ఉండును'",
      "Proverbs 15:33",
      "The fear of the Lord is the instruction of wisdom, and before honor is humility",
      "యెహోవాయందు భయభక్తులు కలిగియుండుట జ్ఞానాభ్యాసము, ఘనతకు ముందు వినయము ఉండును",
      "Humility is the prerequisite curriculum of heaven; one must descend into self-emptying before God confers lasting honor.",
      "దేవుని భయభక్తులలో జ్ఞానమును నేర్చుకొనుటయే శ్రేష్ఠము; నిజమైన ఘనతకు నమ్రతగల వినయమే తొలిమెట్టు."
    ],
    [
      "Proverbs 16:16 how much better to get wisdom than gold: 'How much better to get wisdom than gold! And to get understanding is to be chosen rather than silver'",
      "సామెతలు 16:16 బంగారముకంటె జ్ఞానమును సంపాదించుకొనుట శ్రేష్ఠము: 'బంగారము సంపాదించుటకంటె జ్ఞానము సంపాదించుట ఎంతో శ్రేష్ఠము, వెండి సంపాదించుటకంటె వివేచన సంపాదించుకొనుట ఎంతో కోరదగినది'",
      "Proverbs 16:16",
      "How much better to get wisdom than gold! And to get understanding is to be chosen rather than silver",
      "బంగారము సంపాదించుటకంటె జ్ఞానము సంపాదించుట ఎంతో శ్రేష్ఠము, వెండి సంపాదించుటకంటె వివేచన సంపాదించుకొనుట ఎంతో కోరదగినది",
      "Financial fortunes can be stolen or lost in an hour, but divine wisdom provides indestructible capital for time and eternity.",
      "లోకపు బంగారము నశించిపోవును గాని దైవిక వివేచన ఆత్మను నిత్యత్వమునకు సరిపడు ఆత్మీయ సంపదతో నింపును."
    ],
    [
      "Proverbs 17:24 wisdom before the discerning versus the fool's wandering eyes: 'Wisdom is in the sight of him who has understanding, but the eyes of a fool are on the ends of the earth'",
      "సామెతలు 17:24 వివేకియెదుట జ్ఞానముండుట: 'వివేకముగలవాని ఎదుట జ్ఞానమున్నది, బుద్ధిహీనుని కన్నులు భూదిగంతములమీద తిరుగును'",
      "Proverbs 17:24",
      "Wisdom is in the sight of him who has understanding, but the eyes of a fool are on the ends of the earth",
      "వివేకముగలవాని ఎదుట జ్ఞానమున్నది, బుద్ధిహీనుని కన్నులు భూదిగంతములమీద తిరుగును",
      "The discerning person focuses on immediate duty and God's present command, while the fool constantly daydreams of distant fantasies.",
      "వివేకి తన కన్నులయెదుట ఉన్న దైవిక సత్యముపై దృష్టియుంచును; మూర్ఖుని ఆలోచనలు వ్యర్థమైన విషయములపై తిరుగును."
    ],
    [
      "Proverbs 19:8 getting wisdom loving one's own soul: 'He who gets wisdom loves his own soul; he who keeps understanding will find good'",
      "సామెతలు 19:8 జ్ఞానమును సంపాదించువాడు తన ప్రాణమును ప్రేమించువాడు: 'బుద్ధి సంపాదించుకొనువాడు తన ప్రాణమును ప్రేమించువాడు, వివేచనను కాపాడుకొనువాడు మేలు కనుగొనును'",
      "Proverbs 19:8",
      "He who gets wisdom loves his own soul; he who keeps understanding will find good",
      "బుద్ధి సంపాదించుకొనువాడు తన ప్రాణమును ప్రేమించువాడు, వివేచనను కాపాడుకొనువాడు మేలు కనుగొనును",
      "True self-love is not narcissistic indulgence, but investing in spiritual wisdom that preserves the soul for eternal blessing.",
      "జ్ఞానమును వివేచనను హృదయములో దాచుకొనువాడు తన ప్రాణమునకు నిజమైన మేలును శాశ్వత క్షేమమును కనుగొనును."
    ],
    [
      "Proverbs 24:3-4 a house built through wisdom and understanding: 'Through wisdom a house is built, and by understanding it is established; by knowledge the rooms are filled with all precious and pleasant riches'",
      "సామెతలు 24:3-4 జ్ఞానమువలన ఇల్లు కట్టబడుట: 'జ్ఞానమువలన ఇల్లు కట్టబడును, వివేచనవలన అది స్థిరపరచబడును; తెలివివలన దాని గదులు సర్వవిధములైన విలువగల రమ్యమైన సంపదలతో నింపబడును'",
      "Proverbs 24:3-4",
      "Through wisdom a house is built, and by understanding it is established; by knowledge the rooms are filled with all precious and pleasant riches",
      "జ్ఞానమువలన ఇల్లు కట్టబడును, వివేచనవలన అది స్థిరపరచబడును; తెలివివలన దాని గదులు సర్వవిధములైన విలువగల రమ్యమైన సంపదలతో నింపబడును",
      "Enduring homes, ministries, and lives are not erected by brash self-will, but through steady, wise engineering anchored in God.",
      "కుటుంబమైనను సంఘమైనను దైవిక జ్ఞానమువలననే దృఢముగా కట్టబడి నిత్య సమాధాన సంపదలతో నింపబడును."
    ],
    [
      "Proverbs 29:11 a fool venting all feelings while the wise holds them back: 'A fool vents all his feelings, but a wise man holds them back'",
      "సామెతలు 29:11 జ్ఞాని తన భావోద్వేగములను అణచుకొనుట: 'బుద్ధిహీనుడు తన కోపమంతయు బయలుపరచును, జ్ఞానముగలవాడు దానిని అణచుకొని శాంతిపరచును'",
      "Proverbs 29:11",
      "A fool vents all his feelings, but a wise man holds them back",
      "బుద్ధిహీనుడు తన కోపమంతయు బయలుపరచును, జ్ఞానముగలవాడు దానిని అణచుకొని శాంతిపరచును",
      "Emotional self-control is the hallmark of maturity; the wise person refrains from explosive reactions, choosing patience and calm.",
      "క్షణికావేశములో సమస్త కోపమును వెళ్లగక్కువాడు మూర్ఖుడు; తన మనస్సును అదుపులో ఉంచుకొని శాంతిగా ఉండువాడు నిజమైన జ్ఞాని."
    ],
    [
      "Job 28:12 Job asking where wisdom can be found: 'But where can wisdom be found? And where is the place of understanding? Man does not know its value'",
      "యోబు 28:12 జ్ఞానము ఎక్కడ దొరుకును అను ప్రశ్న: 'అయితే జ్ఞానము ఎక్కడ దొరుకును? వివేచన దొరుకు స్థలము ఏది? నరుడు దాని విలువను ఎరుగడు'",
      "Job 28:12",
      "But where can wisdom be found? And where is the place of understanding? Man does not know its value, nor is it found in the land of the living",
      "అయితే జ్ఞానము ఎక్కడ దొరుకును? వివేచన దొరుకు స్థలము ఏది? నరుడు దాని విలువను ఎరుగడు, సజీవులున్న దేశములో అది దొరకదు",
      "Job explores gold mines and ocean trenches to demonstrate that ultimate wisdom cannot be dredged up by human technology.",
      "భూమిలోని గనులలోగాని సముద్ర గర్భములోగాని దొరకని అమూల్యమైన దైవిక జ్ఞానపు ఉనికిని యోబు అన్వేషించెను."
    ],
    [
      "Job 28:28 the fear of the Lord declared as wisdom: 'And to man He said, Behold, the fear of the Lord, that is wisdom, and to depart from evil is understanding'",
      "యోబు 28:28 యెహోవాయందలి భయభక్తులే జ్ఞానము: 'మరియు ఆయన నరులతో ఇట్లనెను-ప్రభువునందు భయభక్తులు కలిగియుండుటయే జ్ఞానము, చెడుతనము విడిచిపెట్టుటయే వివేచన'",
      "Job 28:28",
      "Behold, the fear of the Lord, that is wisdom, and to depart from evil is understanding",
      "ప్రభువునందు భయభక్తులు కలిగియుండుటయే జ్ఞానము, చెడుతనము విడిచిపెట్టుటయే వివేచన",
      "The climax of Job's poem: transcendent wisdom translates practically into holy reverence toward Yahweh and moral retreat from sin.",
      "దేవునియందు భయభక్తులు కలిగియుండి సమస్త పాపమును విసర్జించుటయే మానవాళికి అనుగ్రహింపబడిన నిజమైన జ్ఞానము."
    ],
    [
      "Ecclesiastes 7:12 wisdom as a life-giving defense: 'For wisdom is a defense as money is a defense, but the excellence of knowledge is that wisdom gives life to him who has it'",
      "ప్రసంగి 7:12 జ్ఞానము ప్రాణమును కాపాడు రక్షణ: 'ధనము ఆశ్రయమైనట్లు జ్ఞానమును ఆశ్రయము; అయితే తెలివివలన కలుగు విశేషమేమనగా, జ్ఞానము దాని కలిగినవారి ప్రాణమును కాపాడును'",
      "Ecclesiastes 7:12",
      "For wisdom is a defense as money is a defense, but the excellence of knowledge is that wisdom gives life to him who has it",
      "ధనము ఆశ్రయమైనట్లు జ్ఞానమును ఆశ్రయము; అయితే తెలివివలన కలుగు విశేషమేమనగా, జ్ఞానము దాని కలిగినవారి ప్రాణమును కాపాడును",
      "Money provides temporary buffers against earthly hardship, but divine wisdom provides spiritual life that endures beyond the grave.",
      "డబ్బు తాత్కాలిక రక్షణనివ్వగా, దేవుని జ్ఞానము మానవుని అంతరంగ ఆత్మకు నిత్య జీవరక్షణను ప్రసాదించును."
    ],
    [
      "Ecclesiastes 9:16 wisdom better than brute strength: 'Wisdom is better than strength. Nevertheless the poor man's wisdom is despised, and his words are not heard'",
      "ప్రసంగి 9:16 బలముకంటె జ్ఞానము శ్రేష్ఠము: 'బలముకంటె జ్ఞానమే శ్రేష్ఠమని నేననుకొంటిని గాని ఆ దరిద్రుని జ్ఞానము తృణీకరింపబడెను, అతని మాటలు వినబడకపోయెను'",
      "Ecclesiastes 9:16",
      "Wisdom is better than strength",
      "బలముకంటె జ్ఞానమే శ్రేష్ఠము",
      "Strategic insight conquers fortified cities where raw physical muscle fails, even when worldly courts unjustly despise the humble sage.",
      "శారీరక బలముకంటె దైవిక వివేచన ఎంతో శక్తివంతమైనది; అది సైన్యములను సైతం జయించగలదు."
    ],
    [
      "Ecclesiastes 9:18 wisdom better than weapons of war: 'Wisdom is better than weapons of war; but one sinner destroys much good'",
      "ప్రసంగి 9:18 యుద్ధాయుధములకంటె జ్ఞానమే శ్రేష్ఠము: 'యుద్ధాయుధములకంటె జ్ఞానమే శ్రేష్ఠము, అయితే ఒక్క పాపి బహు విశేషమైన మేలును చెరుపును'",
      "Ecclesiastes 9:18",
      "Wisdom is better than weapons of war; but one sinner destroys much good",
      "యుద్ధాయుధములకంటె జ్ఞానమే శ్రేష్ఠము, అయితే ఒక్క పాపి బహు విశేషమైన మేలును చెరుపును",
      "Constructive wisdom establishes enduring peace far more effectively than armaments, yet a single corrupt transgressor can wreck communal blessings.",
      "భారీ ఆయుధములకంటె దైవిక జ్ఞానము దేశములను కాపాడును; అయితే పాపము గొప్ప మేలును నాశనము చేయును."
    ],
    [
      "1 Kings 3:9 Solomon asking for an understanding heart: 'Therefore give to Your servant an understanding heart to judge Your people, that I may discern between good and evil'",
      "1 రాజులు 3:9 సొలొమోను గ్రహించగల హృదయమును కోరుకొనుట: 'ఇంత గొప్పదైన నీ జనులకు న్యాయము తీర్చుటకు వివేకముగల హృదయమును నీ దాసునికి దయచేయుము'",
      "1 Kings 3:9",
      "Therefore give to Your servant an understanding heart to judge Your people, that I may discern between good and evil",
      "ఇంత గొప్పదైన నీ జనులకు న్యాయము తీర్చుటకు వివేకముగల హృదయమును నీ దాసునికి దయచేయుము",
      "Solomon shunned long life, riches, and the death of enemies, requesting spiritual discernment to shepherd God's heritage justly.",
      "స్వార్థ ప్రయోజనములను కోరక దేవుని ప్రజలను న్యాయముగా పరిపాలించుటకు వివేకముగల హృదయమును అడిగిన సొలొమోను ప్రార్థన."
    ],
    [
      "1 Kings 3:12 God giving Solomon a wise and understanding heart: 'Behold, I have done according to your words; see, I have given you a wise and understanding heart, so that there has not been anyone like you before you'",
      "1 రాజులు 3:12 సొలొమోనునకు అసాధారణ జ్ఞానము దయచేయబడుట: 'నీవు అడిగిన ప్రకారము జ్ఞానమును వివేచనయుగల హృదయమును నీకిచ్చుచున్నాను; నీకు ముందు నీవంటివాడు ఎవడును లేడు, నీ తరువాత నీవంటివాడు ఎవడును పుట్టడు'",
      "1 Kings 3:12",
      "Behold, I have given you a wise and understanding heart, so that there has not been anyone like you before you, nor shall any like you arise after you",
      "నీవు అడిగిన ప్రకారము జ్ఞానమును వివేచనయుగల హృదయమును నీకిచ్చుచున్నాను; నీకు ముందు నీవంటివాడు ఎవడును లేడు, నీ తరువాత నీవంటివాడు ఎవడును పుట్టడు",
      "God delights in selfless prayers for spiritual wisdom, answering with unmatched intellectual breadth and governmental brilliance.",
      "దేవుడు సొలొమోను నిస్వార్థ అభ్యర్థనను మెచ్చి సాటిలేని జ్ఞానవివేచనలతో అతని హృదయమును ఆశీర్వదించెను."
    ],
    [
      "1 Kings 3:28 Israel fearing the king seeing the wisdom of God in him: 'And all Israel heard of the judgment which the king had rendered; and they feared the king, for they saw that the wisdom of God was in him to administer justice'",
      "1 రాజులు 3:28 న్యాయతీర్పులో దేవుని జ్ఞానమును చూచిన ఇశ్రాయేలు: 'రాజు తీర్చిన తీర్పును ఇశ్రాయేలువారందరును విని, న్యాయము తీర్చుటకు దైవజ్ఞానము అతనిలో ఉన్నదని తెలిసికొని రాజునకు భయపడిరి'",
      "1 Kings 3:28",
      "For they saw that the wisdom of God was in him to administer justice",
      "న్యాయము తీర్చుటకు దైవజ్ఞానము అతనిలో ఉన్నదని తెలిసికొని రాజునకు భయపడిరి",
      "The razor-sharp dispute over the living infant demonstrated that Solomon's judicial insight was directly inspired by heaven.",
      "సజీవ బిడ్డ విషయంలో సొలొమోను తీర్చిన అద్భుత తీర్పుద్వారా అతనిలో దైవిక జ్ఞానము నివసించుచున్నదని సర్వజనులు గ్రహించిరి."
    ],
    [
      "1 Kings 4:29 God giving Solomon wisdom and largeness of heart: 'And God gave Solomon wisdom and exceedingly great understanding, and largeness of heart like the sand on the seashore'",
      "1 రాజులు 4:29 సముద్రతీరపు ఇసుకంత విశాల హృదయము: 'దేవుడు సొలొమోనునకు జ్ఞానమును బహు విస్తారమైన వివేచనను సముద్రతీరపు ఇసుకంత విశాలమైన హృదయమును దయచేసెను'",
      "1 Kings 4:29",
      "And God gave Solomon wisdom and exceedingly great understanding, and largeness of heart like the sand on the seashore",
      "దేవుడు సొలొమోనునకు జ్ఞానమును బహు విస్తారమైన వివేచనను సముద్రతీరపు ఇసుకంత విశాలమైన హృదయమును దయచేసెను",
      "True wisdom enlarges the capacity of the human spirit, enabling one to comprehend wide domains of creation and human nature.",
      "దేవుడిచ్చిన జ్ఞానము సొలొమోను హృదయమును సముద్రతీరపు ఇసుకవలె అపారముగా విస్తరింపజేసి సృష్టి మర్మములను గ్రహింపజేసెను."
    ],
    [
      "1 Kings 4:32 Solomon speaking three thousand proverbs: 'He spoke three thousand proverbs, and his songs were one thousand and five'",
      "1 రాజులు 4:32 మూడు వేల సామెతలు మరియు కీర్తనలు: 'అతడు మూడు వేల సామెతలను చెప్పెను, అతని కీర్తనలు వెయ్యియు ఐదు'",
      "1 Kings 4:32",
      "He spoke three thousand proverbs, and his songs were one thousand and five",
      "అతడు మూడు వేల సామెతలను చెప్పెను, అతని కీర్తనలు వెయ్యియు ఐదు",
      "Wisdom translates into prolific literary and musical expressions that educate generations in moral discipline and worship.",
      "దైవిక జ్ఞానము సొలొమోను ద్వారా వేలాది సామెతలు మరియు ఆత్మీయ గీతములుగా ప్రవహించి సర్వ తరములను ప్రభావితము చేసెను."
    ],
    [
      "1 Kings 10:1 the Queen of Sheba testing Solomon's wisdom: 'Now when the queen of Sheba heard of the fame of Solomon concerning the name of the Lord, she came to test him with hard questions'",
      "1 రాజులు 10:1 షేబారాణి సొలొమోను జ్ఞానమును శోధించుట: 'షేబారాణి యెహోవా నామమునుబట్టి సొలొమోనునకు కలిగిన కీర్తిని విని, గూఢార్థముగల ప్రశ్నలచేత అతనిని శోధించుటకు వచ్చెను'",
      "1 Kings 10:1",
      "She came to test him with hard questions",
      "గూఢార్థముగల ప్రశ్నలచేత అతనిని శోధించుటకు వచ్చెను",
      "True wisdom can withstand the most rigorous interrogation by world leaders seeking truth for perplexing enigmas.",
      "కష్టమైన ప్రశ్నలన్నిటికీ సొలొమోను ఇచ్చిన సమాధానములు దైవిక జ్ఞానపు తిరుగులేని ఔన్నత్యాన్ని చాటిచెప్పెను."
    ],
    [
      "1 Kings 10:7 the Queen of Sheba declaring that the half was not told her: 'Your wisdom and prosperity exceed the fame of which I heard'",
      "1 రాజులు 10:7 వినినదానికంటె జ్ఞానము రెండింతలుండుట: 'నీ జ్ఞానమును భాగ్యమును నేను వినిన కీర్తికంటె ఎంతో ఎక్కువై యున్నవి, సగమైనను నాతో చెప్పబడలేదు'",
      "1 Kings 10:7",
      "Your wisdom and prosperity exceed the fame of which I heard",
      "నీ జ్ఞానమును భాగ్యమును నేను వినిన కీర్తికంటె ఎంతో ఎక్కువై యున్నవి",
      "Witnessing godly wisdom in action overwhelmingly exceeds all prior rumors, leaving foreign observers breathless with awe.",
      "దైవిక జ్ఞానపు నిండుతనాన్ని ప్రత్యక్షముగా చూచినప్పుడు అది వినిన కీర్తికంటె ఎంతో మహిమగలదని రుజువగును."
    ],
    [
      "Exodus 31:3 Bezalel filled with the Spirit of God in wisdom and understanding: 'And I have filled him with the Spirit of God, in wisdom and understanding, in knowledge and in all manner of workmanship'",
      "నిర్గమకాండము 31:3 బెసలేలుకు జ్ఞానవివేచనల ఆత్మ నింపబడుట: 'విచిత్రమైన పనులను కల్పించుటకును... సమస్తవిధములైన పనులను నేర్పుతో చేయుటకును నేను అతనిని దైవసంబంధమైన ఆత్మతోను జ్ఞానవివేచనలతోను సకలమైన విద్యలతోను నింపియున్నాను'",
      "Exodus 31:3",
      "And I have filled him with the Spirit of God, in wisdom and understanding, in knowledge and in all manner of workmanship",
      "నేను అతనిని దైవసంబంధమైన ఆత్మతోను జ్ఞానవివేచనలతోను సకలమైన విద్యలతోను నింపియున్నాను",
      "Wisdom is practical and artistic; the Holy Spirit anoints craftsmen to construct sacred furniture with exquisite aesthetic precision.",
      "దేవుని ఆత్మ పరిశుద్ధ గుడారపు నిర్మాణమునకు కావలసిన కళానైపుణ్యమును మరియు శిల్ప జ్ఞానమును సమృద్ధిగా అనుగ్రహించెను."
    ],
    [
      "Deuteronomy 4:6 keeping God's statutes as wisdom in the sight of peoples: 'Keep and do them, for this is your wisdom and your understanding in the sight of the peoples'",
      "ద్వితీయోపదేశకాండము 4:6 ఆజ్ఞలను గైకొనుట జనులయెదుట జ్ఞానము: 'వాటిని గైకొని నడుచుకొనుడి; ఎందుకనగా అన్యజనుల దృష్టికి అదే మీకు జ్ఞానమును వివేచనయునై యుండును'",
      "Deuteronomy 4:6",
      "For this is your wisdom and your understanding in the sight of the peoples who will hear all these statutes",
      "అన్యజనుల దృష్టికి అదే మీకు జ్ఞానమును వివేచనయునై యుండును",
      "Israel's moral brilliance lay not in military conquest or monumental pyramids, but in radical obedience to righteous divine laws.",
      "దేవుని పరిశుద్ధ ధర్మశాస్త్రమును అనుసరించి జీవించుటయే సర్వ దేశములయెదుట దేవుని ప్రజలకు నిజమైన జ్ఞానము."
    ],
    [
      "Psalm 90:12 Moses praying for a heart of wisdom: 'So teach us to number our days, that we may gain a heart of wisdom'",
      "కీర్తన 90:12 జ్ఞానహృదయమును పొందునట్లు లెక్కించుట: 'మాకు జ్ఞానహృదయము కలుగునట్లుగా మా దినములు లెక్కించుటకు మాకు నేర్పుము'",
      "Psalm 90:12",
      "So teach us to number our days, that we may gain a heart of wisdom",
      "మాకు జ్ఞానహృదయము కలుగునట్లుగా మా దినములు లెక్కించుటకు మాకు నేర్పుము",
      "Meditating on the brevity of mortal life purges frivolous vanity and drives the soul to cultivate eternal, godly priorities.",
      "మన ఆయుష్కాలపు అల్పత్వాన్ని గ్రహించి ప్రతి క్షణాన్ని దేవుని చిత్తానుసారముగా సద్వినియోగము చేసికొనుటయే జ్ఞానహృదయము."
    ],
    [
      "Psalm 104:24 all creation formed in wisdom: 'O Lord, how manifold are Your works! In wisdom You have made them all. The earth is full of Your possessions'",
      "కీర్తన 104:24 జ్ఞానముచేత సృష్టిని నిర్మించుట: 'యెహోవా, నీ కార్యములు ఎంతో విస్తారములుగా ఉన్నవి! జ్ఞానముచేతనే నీవు వాటన్నిటిని నిర్మించితివి; భూమి నీ సంపదలతో నిండియున్నది'",
      "Psalm 104:24",
      "In wisdom You have made them all. The earth is full of Your possessions",
      "జ్ఞానముచేతనే నీవు వాటన్నిటిని నిర్మించితివి; భూమి నీ సంపదలతో నిండియున్నది",
      "From microbiological genomes to cosmic galaxies, every facet of nature bears the dazzling imprint of divine intellectual design.",
      "సమస్త సృష్టి దేవుని అద్భుత జ్ఞానమునకు ప్రత్యక్ష తార్కాణము; ఆయన వివేకముతో సమస్తమును అత్యంత రమ్యముగా సృజించెను."
    ],
    [
      "Psalm 107:43 the wise observing these things to understand God's lovingkindness: 'Whoever is wise will observe these things, and they will understand the lovingkindness of the Lord'",
      "కీర్తన 107:43 యెహోవా కృపను గ్రహించు జ్ఞాని: 'జ్ఞానముగలవాడెవడో వాడు వీటిని ఆలోచించును, యెహోవా కృపాతిశయములను వారు గ్రహింతురు'",
      "Psalm 107:43",
      "Whoever is wise will observe these things, and they will understand the lovingkindness of the Lord",
      "జ్ఞానముగలవాడెవడో వాడు వీటిని ఆలోచించును, యెహోవా కృపాతిశయములను వారు గ్రహింతురు",
      "Wisdom discerns the hand of Providence orchestrating historical events to unveil God's steadfast, covenant love.",
      "దేవుని విమోచన కార్యములను గమనించి ఆయన అపరిమిత కృపను గ్రహించువాడే నిజమైన జ్ఞానవంతుడు."
    ],
    [
      "Psalm 111:10 the fear of the Lord as the beginning of wisdom: 'The fear of the Lord is the beginning of wisdom; a good understanding have all those who do His commandments'",
      "కీర్తన 111:10 ఆజ్ఞలను గైకొనువారికి మంచి వివేకము: 'యెహోవాయందలి భయభక్తులు జ్ఞానమునకు మూలము; ఆయన ఆజ్ఞలచొప్పున చేయువారందరు మంచి వివేకముగలవారు'",
      "Psalm 111:10",
      "The fear of the Lord is the beginning of wisdom; a good understanding have all those who do His commandments",
      "యెహోవాయందలి భయభక్తులు జ్ఞానమునకు మూలము; ఆయన ఆజ్ఞలచొప్పున చేయువారందరు మంచి వివేకముగలవారు",
      "Theology and ethics are inseparable: practicing obedience to divine commands is the only incubator where sound discernment matures.",
      "దేవుని ఆజ్ఞలకు విధేయత చూపుటయే హృదయములో మంచి వివేకమును అభివృద్ధి చేసి దైవిక జ్ఞానమును స్థిరపరచును."
    ],
    [
      "Proverbs 2:1-5 seeking wisdom like hidden treasure: 'If you seek her as silver, and search for her as for hidden treasures; then you will understand the fear of the Lord, and find the knowledge of God'",
      "సామెతలు 2:4-5 దాచబడిన ధనమువలె జ్ఞానమును వెదకుట: 'వెండిని వెదకునట్లు దాని వెదకినయెడల, దాచబడిన ధనమును వెదకినట్లు దాని వెదకినయెడల, యెహోవాయందు భయభక్తులు కలిగియుండుట యెట్టిదో నీవు గ్రహించెదవు'",
      "Proverbs 2:4-5",
      "If you seek her as silver, and search for her as for hidden treasures; then you will understand the fear of the Lord, and find the knowledge of God",
      "వెండిని వెదకునట్లు దాని వెదకినయెడల, దాచబడిన ధనమును వెదకినట్లు దాని వెదకినయెడల, యెహోవాయందు భయభక్తులు కలిగియుండుట యెట్టిదో నీవు గ్రహించెదవు",
      "Wisdom yields her secrets not to casual curiosity, but to rigorous spiritual miners digging relentlessly into the Word of God.",
      "నిక్షేపమును వెదకు ఆసక్తితో దేవుని వాక్యములో జ్ఞానమును అన్వేషించువాడు దైవభయమును మరియు పరమ విజ్ఞానమును కనుగొనును."
    ],
    [
      "Proverbs 2:10-11 wisdom entering the heart and discretion preserving you: 'When wisdom enters your heart, and knowledge is pleasant to your soul, discretion will preserve you; understanding will keep you'",
      "సామెతలు 2:10-11 విచక్షణ నిన్ను కాపాడును: 'జ్ఞానము నీ హృదయములో ప్రవేశించినప్పుడు తెలివి నీ ప్రాణమునకు ఇంపైనదగును; విచక్షణ నిన్ను కాపాడును, వివేచన నీకు కావలియుండును'",
      "Proverbs 2:10-11",
      "When wisdom enters your heart, and knowledge is pleasant to your soul, discretion will preserve you; understanding will keep you",
      "జ్ఞానము నీ హృదయములో ప్రవేశించినప్పుడు తెలివి నీ ప్రాణమునకు ఇంపైనదగును; విచక్షణ నిన్ను కాపాడును, వివేచన నీకు కావలియుండును",
      "Internalized wisdom becomes an automated defense system, shielding the traveler from seductive predators and crooked paths.",
      "దేవుని జ్ఞానము అంతరంగములో ప్రవేశించినప్పుడు విచక్షణ మరియు వివేచన పాపపు ఉచ్చులనుండి మన ప్రాణమునకు రక్షణ కవచమగును."
    ],
    [
      "Proverbs 4:18 the path of the just shining brighter unto the perfect day: 'The path of the just is like the shining sun, that shines ever brighter unto the perfect day'",
      "సామెతలు 4:18 పట్టపగలగువరకు తేజరిల్లు నీతిమంతుల మార్గము: 'నీతిమంతుల మార్గము పట్టపగలగువరకు అంతకంతకు తేజరిల్లు ప్రకాశమానమైన వెలుగువలె నుండును'",
      "Proverbs 4:18",
      "The path of the just is like the shining sun, that shines ever brighter unto the perfect day",
      "నీతిమంతుల మార్గము పట్టపగలగువరకు అంతకంతకు తేజరిల్లు ప్రకాశమానమైన వెలుగువలె నుండును",
      "The life guided by divine wisdom does not stagnate; it progressively brightens with spiritual illumination toward celestial noon.",
      "దైవిక జ్ఞానములో నడుచు నీతిమంతుని మార్గము సూర్యోదయమువలె ప్రారంభమై సంపూర్ణ దినపు వెలుగువలె నిరంతరము ప్రకాశించును."
    ],
    [
      "Proverbs 7:4 saying to wisdom, 'You are my sister': 'Say to wisdom, You are my sister, and call understanding your nearest kin'",
      "సామెతలు 7:4 జ్ఞానము నా సహోదరి అని చెప్పుట: 'జ్ఞానముతో నీవు నా సహోదరివనియు, తెలివితో నీవు నా ప్రియురాలవనియు చెప్పుము'",
      "Proverbs 7:4",
      "Say to wisdom, You are my sister, and call understanding your nearest kin",
      "జ్ఞానముతో నీవు నా సహోదరివనియు, తెలివితో నీవు నా ప్రియురాలవనియు చెప్పుము",
      "Cultivating an intimate, fraternal affection for holy wisdom inoculates the believer against the deadly seductions of immoral vice.",
      "జ్ఞానమును వివేచనను అత్యంత ఆత్మీయ బంధువులుగా హృదయములో హత్తుకొనుట సమస్త దురాశల మోసములనుండి మనలను కాపాడును."
    ],
    [
      "Proverbs 15:2 the tongue of the wise using knowledge rightly: 'The tongue of the wise uses knowledge rightly, but the mouth of fools pours forth foolishness'",
      "సామెతలు 15:2 జ్ఞానుల నాలుక తెలివిని బాగుగా వినియోగించుట: 'జ్ఞానుల నాలుక తెలివిని బాగుగా వినియోగించును, బుద్ధిహీనుల నోరు మూఢత్వమును కక్కును'",
      "Proverbs 15:2",
      "The tongue of the wise uses knowledge rightly, but the mouth of fools pours forth foolishness",
      "జ్ఞానుల నాలుక తెలివిని బాగుగా వినియోగించును, బుద్ధిహీనుల నోరు మూఢత్వమును కక్కును",
      "Wisdom knows not only what to say, but when, how, and in what tone to impart truth for maximum healing and impact.",
      "సమయోచితముగా మరియు ప్రయోజనకరముగా సత్యమును మాట్లాడుటయే జ్ఞాని నాలుకయొక్క ప్రత్యేక లక్షణము."
    ],
    [
      "Proverbs 15:7 the lips of the wise dispersing knowledge: 'The lips of the wise disperse knowledge, but the heart of the fool does not do so'",
      "సామెతలు 15:7 జ్ఞానుల పెదవులు తెలివిని వెదజల్లుట: 'జ్ఞానుల పెదవులు తెలివిని వెదజల్లును, బుద్ధిహీనుల హృదయము స్థిరమైనది కాదు'",
      "Proverbs 15:7",
      "The lips of the wise disperse knowledge, but the heart of the fool does not do so",
      "జ్ఞానుల పెదవులు తెలివిని వెదజల్లును, బుద్ధిహీనుల హృదయము స్థిరమైనది కాదు",
      "Like seed scattered across fertile soil, the conversation of the wise sows life-giving insight wherever they walk.",
      "జ్ఞానవంతుని మాటలు మంచి విత్తనములవలె ఇతరుల హృదయములలో దైవిక తెలివిని విస్తరింపజేయును."
    ],
    [
      "Proverbs 16:21 the wise in heart called prudent: 'The wise in heart will be called prudent, and sweetness of the lips increases learning'",
      "సామెతలు 16:21 హృదయ జ్ఞానముగలవాడు వివేకి అనబడుట: 'హృదయజ్ఞానముగలవాడు వివేకి యనబడును, పెదవుల మాధుర్యమువలన విద్యార్థివృద్ధి కలుగును'",
      "Proverbs 16:21",
      "The wise in heart will be called prudent, and sweetness of the lips increases learning",
      "హృదయజ్ఞానముగలవాడు వివేకి యనబడును, పెదవుల మాధుర్యమువలన విద్యార్థివృద్ధి కలుగును",
      "Tact and gracious presentation do not compromise truth; sweetness of speech makes sound instruction persuasive and accessible.",
      "హృదయములో దైవిక జ్ఞానము కలిగి మృదువుగా మాట్లాడుట ఇతరులకు సత్యమును సులభముగా నేర్చుకొను ఆసక్తిని కలిగించును."
    ],
    [
      "Proverbs 21:20 desirable treasure and oil in the dwelling of the wise: 'There is desirable treasure, and oil in the dwelling of the wise, but a foolish man squanders it'",
      "సామెతలు 21:20 జ్ఞానుల నివాసమందున్న విలువైన నిధులు: 'జ్ఞానుల నివాసమందు విలువగల సొమ్మును నూనెయు కలవు, బుద్ధిహీనుడు దానిని మింగివేయును'",
      "Proverbs 21:20",
      "There is desirable treasure, and oil in the dwelling of the wise, but a foolish man squanders it",
      "జ్ఞానుల నివాసమందు విలువగల సొమ్మును నూనెయు కలవు, బుద్ధిహీనుడు దానిని మింగివేయును",
      "Wisdom practices disciplined stewardship and thrift, securing lasting stability, while profligate fools burn through their resources instantly.",
      "జ్ఞానముగల గృహములో దైవిక దీవెన మరియు పొదుపు నిలకడగా ఉండును; మూర్ఖుడు దొరికినదంతయు విచ్చలవిడిగా ఖర్చుచేసి నాశనమగును."
    ],
    [
      "Proverbs 30:24-28 four small creatures exceeding wise: 'There are four things which are little on the earth, but they are exceedingly wise: the ants, the rock badgers, the locusts, the spider'",
      "సామెతలు 30:24-28 అత్యంత జ్ఞానముగల నాలుగు చిన్న జీవులు: 'భూమిమీద నాలుగు చిన్న జీవులు కలవు, అయినను అవి అత్యంత జ్ఞానముగలవి: చీమలు, కుందేళ్ళు, మిడుతలు, బల్లి'",
      "Proverbs 30:24",
      "There are four things which are little on the earth, but they are exceedingly wise",
      "భూమిమీద నాలుగు చిన్న జీవులు కలవు, అయినను అవి అత్యంత జ్ఞానముగలవి",
      "God's creatures teach profound kingdom principles: preparation, refuge in the Rock, unified order, and bold persistence in kings' palaces.",
      "బలహీనమైన చిన్న ప్రాణులు సైతం తమ ముందుచూపు, ఐక్యత మరియు పరిశ్రమద్వారా దైవిక జ్ఞానపు పాఠములను నేర్పుచున్నవి."
    ]
  ];

  return data.map(item => ({
    easyQ: `What foundational principle of biblical wisdom is revealed in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన ప్రాథమిక దైవజ్ఞాన సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does the fear of the Lord and pursuit of wisdom protect believers from foolish ruin?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం దైవభయము మరియు జ్ఞానాన్వేషణ విశ్వాసులను మూర్ఖత్వపు నాశనమునుండి ఎలా కాపాడును?`,
    hardQ: `What theological reality does ${item[2]} establish regarding divine insight, understanding, and the supremacy of God's wisdom?`,
    hardQTe: `${item[2]} ప్రకారం దేవుని జ్ఞానపు ప్రాముఖ్యతను మరియు పరిశుద్ధ వివేచనను గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty high watchtowers on the plain of Jezreel", "He commanded seventy days of sackcloth at the stream of Arnon", "He cast thirty copper sickles into the river Kishon"],
    optionsTelugu: [item[4], "యెజ్రెయేలు మైదానములో నలభై ఎత్తైన కావలి గోపురములను కట్టించెను", "అర్నోను వాగుయొద్ద డెబ్బై దినముల గోనెపట్ట ధారణను ఆజ్ఞాపించెను", "కీషోను నదిలో ముప్పై రాగి కొడవళ్ళను పడవేసెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Growth Facts for Wisdom (Christ the Wisdom of God, Heavenly Wisdom vs Earthly Wisdom, Growing in Wisdom)
function buildWisdomGrowth() {
  const data = [
    [
      "Matthew 7:24-25 building on the rock as the wise builder: 'Whoever hears these sayings of Mine, and does them, I will liken him to a wise man who built his house on the rock'",
      "మత్తయి 7:24-25 బండపై ఇల్లు కట్టిన బుద్ధిమంతుడు: 'కాబట్టి యీ నా మాటలు విని వాటిచొప్పున చేయు ప్రతివాడును బండమీద తన యిల్లు కట్టుకొనిన బుద్ధిమంతుని పోలియుండును'",
      "Matthew 7:24",
      "Whoever hears these sayings of Mine, and does them, I will liken him to a wise man who built his house on the rock",
      "యీ నా మాటలు విని వాటిచొప్పున చేయు ప్రతివాడును బండమీద తన యిల్లు కట్టుకొనిన బుద్ధిమంతుని పోలియుండును",
      "True wisdom is not merely hearing orthodox sermons, but executing Christ's commands, anchoring the soul against apocalyptic storms.",
      "క్రీస్తు వాక్యమును విని దాని ప్రకారము నడుచుకొనువాడే తుఫానులను తట్టుకొని నిలిచే బండపై ఇల్లు కట్టిన నిజమైన జ్ఞాని."
    ],
    [
      "Matthew 10:16 wise as serpents and harmless as doves: 'Behold, I send you out as sheep in the midst of wolves. Therefore be wise as serpents and harmless as doves'",
      "మత్తయి 10:16 పాములవలె వివేకులుగా పావురములవలె నిష్కపటులుగా: 'ఇదిగో తోడేళ్లమధ్యకు గొఱ్ఱెలను పంపినట్టు నేను మిమ్మును పంపుచున్నాను; కాబట్టి పాములవలె వివేకులును పావురములవలె నిష్కపటులునై యుండుడి'",
      "Matthew 10:16",
      "Therefore be wise as serpents and harmless as doves",
      "పాములవలె వివేకులును పావురములవలె నిష్కపటులునై యుండుడి",
      "Kingdom diplomacy requires a perfect equilibrium: shrewd, alert perception to dodge demonic snares combined with immaculate moral purity.",
      "శత్రువులమధ్య సువార్తను ప్రకటించునప్పుడు అప్రమత్తమైన వివేకమును మరియు పరిశుద్ధమైన నిష్కల్మష హృదయమును కలిగియుండవలెను."
    ],
    [
      "Matthew 11:19 wisdom justified by her children: 'Wisdom is justified by her children'",
      "మత్తయి 11:19 జ్ఞానము తన ఫలములవలన నీతిగలదని తీర్చబడుట: 'జ్ఞానము నీతిగలదని దాని కార్యములవలన (బిడ్డలవలన) తీర్చబడుచున్నది'",
      "Matthew 11:19",
      "Wisdom is justified by her children",
      "జ్ఞానము నీతిగలదని దాని కార్యములవలన తీర్చబడుచున్నది",
      "Fickle critics may slander both John's asceticism and Jesus' feasts, but authentic divine wisdom is vindicated by transformed, holy lives.",
      "లోకపు విమర్శలు ఎలా ఉన్నను, దేవుని జ్ఞానము దాని పరిశుద్ధమైన సత్కార్యములద్వారా సంపూర్ణముగా సమర్థించబడును."
    ],
    [
      "Matthew 12:42 a greater than Solomon is here: 'The queen of the South will rise up in the judgment... for she came from the ends of the earth to hear the wisdom of Solomon; and indeed a greater than Solomon is here'",
      "మత్తయి 12:42 సొలొమోనుకంటె గొప్పవాడైన క్రీస్తు: 'దక్షిణదేశపు రాణి... సొలొమోను జ్ఞానము వినుటకు భూమియొక్క అంతములవరకు వచ్చెను; ఇదిగో సొలొమోనుకంటె గొప్పవాడు ఇక్కడ ఉన్నాడు'",
      "Matthew 12:42",
      "And indeed a greater than Solomon is here",
      "ఇదిగో సొలొమోనుకంటె గొప్పవాడు ఇక్కడ ఉన్నాడు",
      "Solomon was merely a fallible mortal reflecting divine rays; Jesus Christ is the absolute, incarnate Embodiment of infinite divine wisdom.",
      "సొలొమోను జ్ఞానము దేవునిచ్చిన చిన్న ప్రతిబింబమైతే, క్రీస్తే స్వయముగా సర్వ జ్ఞానమునకు పరిపూర్ణ మూలమై యున్నాడు."
    ],
    [
      "Luke 2:40 Jesus growing and filled with wisdom: 'And the Child grew and became strong in spirit, filled with wisdom; and the grace of God was upon Him'",
      "లూకా 2:40 యేసు జ్ఞానముతో నిండి ఎదుగుట: 'ఆ బాలుడు ఎదిగి, జ్ఞానముతో నిండి బలపడెను; దేవుని కృప ఆయనమీద ఉండెను'",
      "Luke 2:40",
      "And the Child grew and became strong in spirit, filled with wisdom; and the grace of God was upon Him",
      "ఆ బాలుడు ఎదిగి, జ్ఞానముతో నిండి బలపడెను; దేవుని కృప ఆయనమీద ఉండెను",
      "In His authentic human nature, the young Messiah developed mentally and spiritually, continuously saturated with divine wisdom and grace.",
      "మానవత్వములో క్రీస్తు దైవిక జ్ఞానముతోను ఆత్మీయ బలముతోను దేవుని కృపలో సంపూర్ణముగా ఎదిగెను."
    ],
    [
      "Luke 2:52 Jesus increasing in wisdom, stature, and favor: 'And Jesus increased in wisdom and stature, and in favor with God and men'",
      "లూకా 2:52 యేసు జ్ఞానమందును వయస్సునందును వర్ధిల్లుట: 'యేసు జ్ఞానమందును, వయస్సునందును, దేవుని దయయందును, మనుష్యుల దయయందును వర్ధిల్లుచుండెను'",
      "Luke 2:52",
      "And Jesus increased in wisdom and stature, and in favor with God and men",
      "యేసు జ్ఞానమందును, వయస్సునందును, దేవుని దయయందును, మనుష్యుల దయయందును వర్ధిల్లుచుండెను",
      "The incarnate Lord provides the perfect pattern of holistic growth: flourishing intellectually, physically, vertically with God, and horizontally with community.",
      "క్రీస్తు జీవితము సమగ్ర ఎదుగుదలకు మాదిరి; ఆయన జ్ఞానమందును, దేవుని మరియు మనుష్యుల అనుగ్రహమందును పరిపూర్ణముగా వర్ధిల్లెను."
    ],
    [
      "Luke 21:15 Christ promising irresistible mouth and wisdom: 'For I will give you a mouth and wisdom which all your adversaries will not be able to contradict or resist'",
      "లూకా 21:15 శత్రువులు ఎదిరింపలేని వాక్కును జ్ఞానమును ఇచ్చుట: 'మీ విరోధులందరు ఎదురాడుటకును ఎదురు చెప్పుటకును వీలుకాని వాక్కును జ్ఞానమును నేను మీకు ఇత్తును'",
      "Luke 21:15",
      "For I will give you a mouth and wisdom which all your adversaries will not be able to contradict or resist",
      "మీ విరోధులందరు ఎదురాడుటకును ఎదురు చెప్పుటకును వీలుకాని వాక్కును జ్ఞానమును నేను మీకు ఇత్తును",
      "When facing persecution, saints do not rely on premeditated rhetoric; Christ supplies supernatural eloquence that silences opposing courts.",
      "హింసలను ఎదుర్కొను సమయమందు క్రీస్తే స్వయముగా ఏ శత్రువును ఖండింపజాలని పరలోకపు జ్ఞానవాక్కులను అనుగ్రహించును."
    ],
    [
      "Acts 6:3 selecting seven men full of the Holy Spirit and wisdom: 'Therefore, brethren, seek out from among you seven men of good reputation, full of the Holy Spirit and wisdom'",
      "అపొస్తలుల కార్యములు 6:3 ఆత్మతోను జ్ఞానముతోను నిండిన ఏడుగురు సేవకులు: 'పరిశుద్ధాత్మతోను జ్ఞానముతోను నిండుకొని మంచిపేరు పొందిన యేడుగురు మనుష్యులను మీలో ఏర్పరచుకొనుడి'",
      "Acts 6:3",
      "Seven men of good reputation, full of the Holy Spirit and wisdom, whom we may appoint over this business",
      "పరిశుద్ధాత్మతోను జ్ఞానముతోను నిండుకొని మంచిపేరు పొందిన యేడుగురు మనుష్యులను ఏర్పరచుకొనుడి",
      "Even administrative logistics in church food distribution require Spirit-filled wisdom to maintain equity, peace, and fraternal harmony.",
      "సంఘ పరిచర్యలో బాహ్య అవసరతలను తీర్చుటకు సైతం పరిశుద్ధాత్మ మరియు దైవిక జ్ఞానముతో నిండిన నాయకత్వము అవసరము."
    ],
    [
      "Acts 6:10 opponents unable to resist Stephen's wisdom: 'And they were not able to resist the wisdom and the Spirit by which he spoke'",
      "అపొస్తలుల కార్యములు 6:10 స్తెఫను మాట్లాడిన జ్ఞానమును ఎదురింపలేకపోవుట: 'అతడు మాట్లాడిన జ్ఞానమును ఆత్మను ఎదిరింపలేకపోయిరి'",
      "Acts 6:10",
      "And they were not able to resist the wisdom and the Spirit by which he spoke",
      "అతడు మాట్లాడిన జ్ఞానమును ఆత్మను ఎదిరింపలేకపోయిరి",
      "Stephen's apologetic was invincible because it was ignited by the Holy Spirit, dismantling hostile theological arguments effortlessly.",
      "పరిశుద్ధాత్ముని ప్రభావముతో మాట్లాడిన స్తెఫను జ్ఞానవాక్కులను శత్రువులు ఏమాత్రమును ఎదురింపలేకపోయిరి."
    ],
    [
      "Acts 7:10 God giving Joseph favor and wisdom before Pharaoh: 'And delivered him out of all his troubles, and gave him favor and wisdom in the sight of Pharaoh king of Egypt'",
      "అపొస్తలుల కార్యములు 7:10 యోసేపునకు దేవుడిచ్చిన దయయు జ్ఞానమును: 'దేవుడు అతని శ్రమలన్నిటిలోనుండి అతనిని తప్పించి, ఐగుప్తు రాజైన ఫరోయెదుట అతనికి దయను జ్ఞానమును ఇచ్చెను'",
      "Acts 7:10",
      "And gave him favor and wisdom in the sight of Pharaoh king of Egypt; and he made him governor over Egypt and all his house",
      "ఫరోయెదుట అతనికి దయను జ్ఞానమును ఇచ్చెను; అతడు ఐగుప్తుమీదను తన యింటియంతటిమీదను అతనిని అధిపతిగా నియమించెను",
      "Heavenly wisdom elevated an imprisoned Hebrew slave to prime minister, enabling Joseph to preserve millions during catastrophic famine.",
      "దేవుడిచ్చిన అద్భుత జ్ఞానము యోసేపును చెరసాలనుండి ఐగుప్తు దేశపు ప్రధానిగా హెచ్చించి క్షామములో బహుజనులను కాపాడెను."
    ],
    [
      "Acts 7:22 Moses learned in all the wisdom of the Egyptians: 'And Moses was learned in all the wisdom of the Egyptians, and was mighty in words and deeds'",
      "అపొస్తలుల కార్యములు 7:22 మోషే ఐగుప్తీయుల సకల విద్యలలో ప్రవీణుడగుట: 'మోషే ఐగుప్తీయుల సకల విద్యలను అభ్యసించి మాటలయందును కార్యములయందును సమర్థుడై యుండెను'",
      "Acts 7:22",
      "And Moses was learned in all the wisdom of the Egyptians, and was mighty in words and deeds",
      "మోషే ఐగుప్తీయుల సకల విద్యలను అభ్యసించి మాటలయందును కార్యములయందును సమర్థుడై యుండెను",
      "Providence prepared Moses through royal Egyptian education, though it required forty years of wilderness humbling to sanctify that intellect.",
      "దేవుడు మోషేను అద్భుతముగా ఐగుప్తు విద్యాజ్ఞానములతో సిద్ధపరచి తరువాత తన పరిశుద్ధ సేవకొరకు నడిపించెను."
    ],
    [
      "Romans 11:33 the unsearchable depth of the wisdom and knowledge of God: 'Oh, the depth of the riches both of the wisdom and knowledge of God! How unsearchable are His judgments and His ways past finding out!'",
      "రోమీయులకు 11:33 దేవుని బుద్ధిజ్ఞానముల బాహుళ్యము: 'ఆహా, దేవుని బుద్ధిజ్ఞానముల బాహుళ్యము ఎంతో గంభీరము! ఆయన తీర్పులు శోధింపనెంతో అశక్యములు, ఆయన మార్గములు ఎంత అగమ్యములు!'",
      "Romans 11:33",
      "Oh, the depth of the riches both of the wisdom and knowledge of God! How unsearchable are His judgments and His ways past finding out!",
      "ఆహా, దేవుని బుద్ధిజ్ఞానముల బాహుళ్యము ఎంతో గంభీరము! ఆయన తీర్పులు శోధింపనెంతో అశక్యములు, ఆయన మార్గములు ఎంత అగమ్యములు!",
      "Contemplating the grand design of redemption across Jew and Gentile prompts spontaneous apostolic adoration of God's bottomless wisdom.",
      "దేవుని రక్షణ ప్రణాళికలోని అగాధమైన జ్ఞానసంపదను చూచినప్పుడు భక్తుని హృదయము పరవశించి ఆరాధనతో స్తుతించును."
    ],
    [
      "Romans 16:19 wise in what is good and simple concerning evil: 'I want you to be wise in what is good, and simple concerning evil'",
      "రోమీయులకు 16:19 మేలువిషయమై జ్ఞానులుగాను కీడువిషయమై నిష్కపటులుగాను: 'మీరు మేలువిషయమై జ్ఞానులును, కీడువిషయమై నిష్కపటులునై యుండవలెనని కోరుచున్నాను'",
      "Romans 16:19",
      "I want you to be wise in what is good, and simple concerning evil",
      "మీరు మేలువిషయమై జ్ఞానులును, కీడువిషయమై నిష్కపటులునై యుండవలెనని కోరుచున్నాను",
      "Believers must be master-craftsmen in practicing virtue and righteousness, while remaining pristine, untainted amateurs regarding sinful corruption.",
      "సత్కార్యములు చేయుటలో ప్రవీణులై ఉండి, పాపము మరియు దుష్టత్వమును అభ్యసించక పరిశుద్ధముగా జీవించవలెను."
    ],
    [
      "Romans 16:27 to God alone wise be glory forever: 'To God, alone wise, be glory through Jesus Christ forever. Amen'",
      "రోమీయులకు 16:27 అద్వితీయ జ్ఞానవంతుడైన దేవునికి మహిమ: 'అద్వితీయ జ్ఞానవంతుడైన దేవునికి, యేసుక్రీస్తుద్వారా నిరంతరము మహిమ కలుగును గాక. ఆమేన్'",
      "Romans 16:27",
      "To God, alone wise, be glory through Jesus Christ forever. Amen",
      "అద్వితీయ జ్ఞానవంతుడైన దేవునికి, యేసుక్రీస్తుద్వారా నిరంతరము మహిమ కలుగును గాక. ఆమేన్",
      "God alone possesses absolute, underived, infallible wisdom; all created intellect owes Him eternal doxology through Christ.",
      "సమస్త సృష్టికి ఏకైక జ్ఞాన మూలమైన దేవునికి యేసుక్రీస్తుద్వారా యుగయుగములు ఘనతయు మహిమయు చెల్లును గాక."
    ],
    [
      "1 Corinthians 1:19 God destroying the wisdom of the wise: 'For it is written: I will destroy the wisdom of the wise, and bring to nothing the understanding of the prudent'",
      "1 కొరింథీయులకు 1:19 జ్ఞానుల జ్ఞానమును దేవుడు వ్యర్థపరచుట: 'జ్ఞానుల జ్ఞానమును నేను నాశనము చేతును, వివేకుల వివేకమును శూన్యపరతును అని వ్రాయబడియున్నది'",
      "1 Corinthians 1:19",
      "I will destroy the wisdom of the wise, and bring to nothing the understanding of the prudent",
      "జ్ఞానుల జ్ఞానమును నేను నాశనము చేతును, వివేకుల వివేకమును శూన్యపరతును",
      "The message of the cross demolishes human intellectual vanity, showing that secular philosophy cannot engineer salvation.",
      "క్రీస్తు సిలువ సువార్త సమస్త లౌకిక తత్వవేత్తల గర్వమును కూల్చివేసి దైవిక రక్షణను ప్రత్యక్షపరచెను."
    ],
    [
      "1 Corinthians 1:21 the world through its wisdom not knowing God: 'For since, in the wisdom of God, the world through wisdom did not know God, it pleased God through the foolishness of the message preached to save those who believe'",
      "1 కొరింథీయులకు 1:21 లోకజ్ఞానము దేవుని ఎరుగలేకపోవుట: 'దేవుని జ్ఞానానుసారముగా లోకము తన జ్ఞానముచేత దేవుని ఎరుగకపోయినందున, బోధయొక్క వెర్రితనముచేత నమ్మువారిని రక్షించుటకు దేవుడు దయాపూర్వకముగా ఉద్దేశించెను'",
      "1 Corinthians 1:21",
      "It pleased God through the foolishness of the message preached to save those who believe",
      "బోధయొక్క వెర్రితనముచేత నమ్మువారిని రక్షించుటకు దేవుడు దయాపూర్వకముగా ఉద్దేశించెను",
      "Fallen intellect fails to find God; therefore, God bypasses academic arrogance and redeems believers through the scandal of the cross.",
      "మానవ స్వంత తెలివి దేవుని తెలుసుకొనలేకపోయెను; కనుక సిలువ సువార్త ద్వారా నమ్మువారిని దేవుడు రక్షించెను."
    ],
    [
      "1 Corinthians 1:24 Christ the power of God and the wisdom of God: 'Christ the power of God and the wisdom of God'",
      "1 కొరింథీయులకు 1:24 దేవుని శక్తియు దేవుని జ్ఞానమునైన క్రీస్తు: 'క్రీస్తు దేవుని శక్తియు దేవుని జ్ఞానమునై యున్నాడు'",
      "1 Corinthians 1:24",
      "Christ the power of God and the wisdom of God",
      "క్రీస్తు దేవుని శక్తియు దేవుని జ్ఞానమునై యున్నాడు",
      "To the called, the crucified Messiah is not a stumbling block or foolishness, but the brilliant synthesis of divine omnipotence and wisdom.",
      "రక్షింపబడినవారికి సిలువవేయబడిన క్రీస్తే దేవుని అద్భుతమైన శక్తియు మరియు సర్వోన్నత జ్ఞానమునై యున్నాడు."
    ],
    [
      "1 Corinthians 1:25 the foolishness of God wiser than men: 'Because the foolishness of God is wiser than men, and the weakness of God is stronger than men'",
      "1 కొరింథీయులకు 1:25 దేవుని వెర్రితనము మనుష్యుల జ్ఞానముకంటె జ్ఞానమైనది: 'దేవుని వెర్రితనము మనుష్యుల జ్ఞానముకంటె జ్ఞానమైనది, దేవుని బలహీనత మనుష్యుల బలముకంటె బలమైనది'",
      "1 Corinthians 1:25",
      "Because the foolishness of God is wiser than men, and the weakness of God is stronger than men",
      "దేవుని వెర్రితనము మనుష్యుల జ్ఞానముకంటె జ్ఞానమైనది, దేవుని బలహీనత మనుష్యుల బలముకంటె బలమైనది",
      "Even what proud mortals mock as God's 'foolishness' completely outshines the greatest intellectual summits of human brilliance.",
      "లోకము వెర్రితనముగా భావించే దేవుని సంకల్పము సమస్త మానవ మేధాశక్తికంటె ఎంతో అత్యున్నతమైన జ్ఞానము."
    ],
    [
      "1 Corinthians 1:27 God choosing foolish things to shame the wise: 'But God has chosen the foolish things of the world to put to shame the wise'",
      "1 కొరింథీయులకు 1:27 జ్ఞానులను సిగ్గుపరచుటకు వెర్రివారిని ఏర్పరచుకొనుట: 'జ్ఞానులను సిగ్గుపరచుటకు లోకములోనుండి వెర్రివారిని దేవుడు ఏర్పరచుకొనియున్నాడు'",
      "1 Corinthians 1:27",
      "But God has chosen the foolish things of the world to put to shame the wise",
      "జ్ఞానులను సిగ్గుపరచుటకు లోకములోనుండి వెర్రివారిని దేవుడు ఏర్పరచుకొనియున్నాడు",
      "God dismantles worldly hierarchies by selecting the lowly and despised to display His unsearchable wisdom and glory.",
      "లోకపు మేధావులను సిగ్గుపరచి కేవలము తన కృపను మాత్రమే హెచ్చించుటకు దేవుడు సామాన్యులను ఏర్పరచుకొనెను."
    ],
    [
      "1 Corinthians 1:30 Christ becoming for us wisdom from God: 'Of Him you are in Christ Jesus, who became for us wisdom from God-and righteousness and sanctification and redemption'",
      "1 కొరింథీయులకు 1:30 క్రీస్తు మనకు దేవునినుండి జ్ఞానమగుట: 'ఆయనవలన మీరు క్రీస్తుయేసునందున్నారు; క్రీస్తు మనకు దేవునినుండి జ్ఞానమును నీతియు పరిశుద్ధతయు విమోచనమును ఆయెను'",
      "1 Corinthians 1:30",
      "Who became for us wisdom from God-and righteousness and sanctification and redemption",
      "క్రీస్తు మనకు దేవునినుండి జ్ఞానమును నీతియు పరిశుద్ధతయు విమోచనమును ఆయెను",
      "Christ is our complete salvation package: our righteousness before the law, our sanctifying holiness, and our ultimate wisdom.",
      "దేవుని కృపచేత క్రీస్తుయేసే మనకు నిజమైన పరలోక జ్ఞానముగాను, నీతిగాను, సంపూర్ణ విమోచనగాను అనుగ్రహింపబడెను."
    ],
    [
      "1 Corinthians 2:4-5 faith standing in the power of God not human wisdom: 'That your faith should not be in the wisdom of men but in the power of God'",
      "1 కొరింథీయులకు 2:5 మనుష్యుల జ్ఞానముమీద కాక దేవుని శక్తిమీద విశ్వాసముండుట: 'మీ విశ్వాసము మనుష్యుల జ్ఞానముమీద ఆధారపడక, దేవుని శక్తిమీదనే ఆధారపడి యుండవలెను'",
      "1 Corinthians 2:5",
      "That your faith should not be in the wisdom of men but in the power of God",
      "మీ విశ్వాసము మనుష్యుల జ్ఞానముమీద ఆధారపడక, దేవుని శక్తిమీదనే ఆధారపడి యుండవలెను",
      "Paul discarded oratorical manipulation so that converts would anchor their faith directly in the Holy Spirit's supernatural power.",
      "వాక్చాతుర్యపు మాటలవలన కాక పరిశుద్ధాత్మ ప్రభావము మరియు దేవుని శక్తిపైనే మన విశ్వాసము నిలకడగా ఉండవలెను."
    ],
    [
      "1 Corinthians 2:7 speaking the hidden wisdom of God in a mystery: 'We speak the wisdom of God in a mystery, the hidden wisdom which God ordained before the ages for our glory'",
      "1 కొరింథీయులకు 2:7 మర్మమైన దేవుని జ్ఞానము: 'దేవుని జ్ఞానమును మర్మముగా బోధించుచున్నాము; అది దాచబడిన జ్ఞానము, మన మహిమకొరకు దానిని యుగములకు ముందే దేవుడు నిర్ణయించెను'",
      "1 Corinthians 2:7",
      "We speak the wisdom of God in a mystery, the hidden wisdom which God ordained before the ages for our glory",
      "దేవుని జ్ఞానమును మర్మముగా బోధించుచున్నాము; అది దాచబడిన జ్ఞానము, మన మహిమకొరకు దానిని యుగములకు ముందే దేవుడు నిర్ణయించెను",
      "The gospel was a cosmic secret concealed from worldly rulers, planned before genesis to elevate redeemed mortals into divine glory.",
      "యుగములకు ముందే దేవుని సంకల్పములో దాచబడిన పరమ జ్ఞానమే క్రీస్తు సిలువద్వారా మనకు వెల్లడిచేయబడెను."
    ],
    [
      "1 Corinthians 3:19 the wisdom of this world being foolishness with God: 'For the wisdom of this world is foolishness with God. For it is written, He catches the wise in their own craftiness'",
      "1 కొరింథీయులకు 3:19 ఈ లోక జ్ఞానము దేవుని దృష్టికి వెర్రితనము: 'ఈ లోక జ్ఞానము దేవుని దృష్టికి వెర్రితనమే; జ్ఞానులను వారి తంత్రములలోనే ఆయన పట్టుకొనును అని వ్రాయబడియున్నది'",
      "1 Corinthians 3:19",
      "For the wisdom of this world is foolishness with God",
      "ఈ లోక జ్ఞానము దేవుని దృష్టికి వెర్రితనమే",
      "Sophisticated secular philosophy is childish babble in heaven's court; God turns rebellious human ingenuity into the very trap that snares them.",
      "దేవుని పరిశుద్ధ దృష్టిలో మానవ స్వనీతి మరియు లౌకిక విద్యాగర్వము కేవలము వెర్రితనముగా తేలిపోవును."
    ],
    [
      "1 Corinthians 12:8 the spiritual gift of the word of wisdom: 'For to one is given the word of wisdom through the Spirit, to another the word of knowledge through the same Spirit'",
      "1 కొరింథీయులకు 12:8 ఆత్మవలన కలుగు జ్ఞానవాక్యము: 'ఒకనికి ఆత్మమూలముగా జ్ఞానవాక్యమును, మరియొకనికి ఆ ఆత్మననుసరించిన తెలివివాక్యమును ఇవ్వబడుచున్నవి'",
      "1 Corinthians 12:8",
      "For to one is given the word of wisdom through the Spirit",
      "ఒకనికి ఆత్మమూలముగా జ్ఞానవాక్యము ఇవ్వబడుచున్నది",
      "A supernatural manifestation of the Holy Spirit providing prophetic, timely insight to navigate complex church crises.",
      "సంఘక్షేమార్థమై పరిశుద్ధాత్ముడు విశ్వాసులకు అనుగ్రహించే ప్రత్యేక జ్ఞానవాక్య కృపావరము."
    ],
    [
      "2 Corinthians 1:12 not with carnal wisdom but by the grace of God: 'We conducted ourselves in the world in simplicity and godly sincerity, not with carnal wisdom but by the grace of God'",
      "2 కొరింథీయులకు 1:12 శరీరానుసారమైన జ్ఞానముతో కాక దేవుని కృపతో నడుచుకొనుట: 'మేము శరీరానుసారమైన జ్ఞానముతో కాక, దేవుని కృపతోనే లోకమందు నిష్కపటముతోను దైవిక యథార్థతతోను ప్రవర్తించితిమి'",
      "2 Corinthians 1:12",
      "Not with carnal wisdom but by the grace of God, we conducted ourselves in the world",
      "శరీరానుసారమైన జ్ఞానముతో కాక, దేవుని కృపతోనే లోకమందు ప్రవర్తించితిమి",
      "Ministry integrity rejects Machiavellian political calculations, choosing pure motives sustained entirely by divine grace.",
      "స్వార్థపూరిత లౌకిక తంత్రములను విడిచిపెట్టి దేవుని కృపచేత మాత్రమే యథార్థముగా ప్రవర్తించవలెను."
    ],
    [
      "Ephesians 1:8 abounding toward us in all wisdom and prudence: 'Which He made to abound toward us in all wisdom and prudence'",
      "ఎఫెసీయులకు 1:8 సమస్త జ్ఞానవివేకములతో కృపను విస్తరింపజేయుట: 'దేవుడు సమస్త జ్ఞానవివేకములు కలవాడై, ఆ కృపను మనయెడల విస్తరింపజేసెను'",
      "Ephesians 1:8",
      "Which He made to abound toward us in all wisdom and prudence",
      "సమస్త జ్ఞానవివేకములు కలవాడై, ఆ కృపను మనయెడల విస్తరింపజేసెను",
      "God's lavish grace is not an undisciplined torrent; it is dispensed with consummate intellectual mastery and practical foresight.",
      "దేవుడు మనలను రక్షించుటలో తన అపరిమిత కృపను సమస్త జ్ఞానముతోను వివేకముతోను మనపై కుమ్మరించెను."
    ],
    [
      "Ephesians 1:17 praying for the spirit of wisdom and revelation: 'That the God of our Lord Jesus Christ, the Father of glory, may give to you the spirit of wisdom and revelation in the knowledge of Him'",
      "ఎఫెసీయులకు 1:17 జ్ఞానమును ప్రత్యక్షతయునుగల మనస్సు అనుగ్రహించుట: 'మహిమస్వరూపియైన తండ్రి తన్ను తెలిసికొనుటకు జ్ఞానమును ప్రత్యక్షతయునుగల మనస్సు మీకు అనుగ్రహించును గాక'",
      "Ephesians 1:17",
      "May give to you the spirit of wisdom and revelation in the knowledge of Him",
      "తన్ను తెలిసికొనుటకు జ్ఞానమును ప్రత్యక్షతయునుగల మనస్సు మీకు అనుగ్రహించును గాక",
      "Spiritual illumination is not achieved by human study alone; the Holy Spirit must remove the veil so we behold the glories of Christ.",
      "దేవుని వ్యక్తిత్వమును ఎరుగుటకు పరిశుద్ధాత్మ దేవుడే మన హృదయములకు పరలోకపు జ్ఞానప్రత్యక్షతను దయచేయవలెను."
    ],
    [
      "Ephesians 3:10 the manifold wisdom of God displayed to cosmic rulers: 'To the intent that now the manifold wisdom of God might be made known by the church to the principalities and powers in the heavenly places'",
      "ఎఫెసీయులకు 3:10 పరలోక శక్తులకు సంఘముద్వారా దేవుని నానావిధ జ్ఞానము బయలుపడుట: 'సంఘముద్వారా పరలోకమందున్న ప్రధానులకును అధికారులకును దేవుని నానావిధమైన జ్ఞానము ఇప్పుడు తెలియబడవలెను'",
      "Ephesians 3:10",
      "That now the manifold wisdom of God might be made known by the church to the principalities and powers in the heavenly places",
      "సంఘముద్వారా పరలోకమందున్న ప్రధానులకును అధికారులకును దేవుని నానావిధమైన జ్ఞానము ఇప్పుడు తెలియబడవలెను",
      "The church is God's grand theater: angelic and demonic hierarchies gaze at redeemed sinners united in Christ, awestruck by God's multi-faceted wisdom.",
      "దేవుని విమోచన ప్రణాళికలోని బహువిధ జ్ఞానమును చూచి పరలోకపు దూతలు మరియు శక్తులు ఆశ్చర్యపడునట్లు సంఘము నిర్మించబడెను."
    ],
    [
      "Ephesians 5:15-16 walking circumspectly not as fools but as wise: 'See then that you walk circumspectly, not as fools but as wise, redeeming the time, because the days are evil'",
      "ఎఫెసీయులకు 5:15-16 దినములు చెడ్డవి గనుక సమయమును పోనియ్యక జ్ఞానులవలె నడుచుకొనుట: 'దినములు చెడ్డవి గనుక సమయమును పోనియ్యక సద్వినియోగము చేసికొనుచు, అజ్ఞానులవలె కాక జ్ఞానులవలె నడుచుకొనునట్లు చూచుకొనుడి'",
      "Ephesians 5:15-16",
      "See then that you walk circumspectly, not as fools but as wise, redeeming the time, because the days are evil",
      "దినములు చెడ్డవి గనుక సమయమును పోనియ్యక సద్వినియోగము చేసికొనుచు, అజ్ఞానులవలె కాక జ్ఞానులవలె నడుచుకొనునట్లు చూచుకొనుడి",
      "Living in an evil culture requires laser-focused intentionality, buying up every strategic opportunity for eternal kingdom impact.",
      "చెడు దినములలో జీవించు విశ్వాసి సమయమును వ్యర్థము చేయక దేవుని చిత్తమును గ్రహించి జ్ఞానముతో నడుచుకొనవలెను."
    ],
    [
      "Colossians 1:9 praying to be filled with the knowledge of His will in all wisdom: 'Ask that you may be filled with the knowledge of His will in all wisdom and spiritual understanding'",
      "కొలొస్సయులకు 1:9 సంపూర్ణ జ్ఞానవివేకములు కలిగి దేవుని చిత్తమును ఎరుగుట: 'మీరు సంపూర్ణ జ్ఞానమును ఆత్మసంబంధమైన వివేకమును గలవారై, ఆయన చిత్తమును పూర్ణముగా గ్రహించినవారు కావలెనని ప్రార్థించుచున్నాము'",
      "Colossians 1:9",
      "That you may be filled with the knowledge of His will in all wisdom and spiritual understanding",
      "మీరు సంపూర్ణ జ్ఞానమును ఆత్మసంబంధమైన వివేకమును గలవారై, ఆయన చిత్తమును పూర్ణముగా గ్రహించినవారు కావలెను",
      "Apostolic intercession targets total saturation in God's will, empowering believers to bear fruit in every good work.",
      "దేవుని సంపూర్ణ చిత్తమును ఆత్మసంబంధమైన వివేచనతో గ్రహించుటయే విశ్వాసి అనుదిన జీవిత ఫలభరితత్వమునకు మూలము."
    ],
    [
      "Colossians 1:28 teaching every man in all wisdom to present them perfect in Christ: 'Him we preach, warning every man and teaching every man in all wisdom, that we may present every man perfect in Christ Jesus'",
      "కొలొస్సయులకు 1:28 సమస్త జ్ఞానముతో బోధించి క్రీస్తునందు సంపూర్ణులుగా నిలుపుట: 'ప్రతి మనుష్యుని క్రీస్తునందు సంపూర్ణునిగా చేసి నిలువబెట్టవలెనని, సమస్త విధములైన జ్ఞానముతో ప్రతి మనుష్యునికి బోధించుచున్నాము'",
      "Colossians 1:28",
      "Warning every man and teaching every man in all wisdom, that we may present every man perfect in Christ Jesus",
      "ప్రతి మనుష్యుని క్రీస్తునందు సంపూర్ణునిగా చేసి నిలువబెట్టవలెనని, సమస్త విధములైన జ్ఞానముతో బోధించుచున్నాము",
      "Pastoral ministry utilizes tailored pastoral wisdom to mentor saints toward mature Christlikeness before the judgment seat.",
      "ప్రతి విశ్వాసిని క్రీస్తుయొక్క సంపూర్ణతలోనికి నడిపించుటకు దైవిక జ్ఞానముతో కూడిన ఆత్మీయ బోధ అత్యావశ్యకము."
    ],
    [
      "Colossians 2:2-3 in Christ hidden all treasures of wisdom and knowledge: 'In whom are hidden all the treasures of wisdom and knowledge'",
      "కొలొస్సయులకు 2:3 క్రీస్తునందు దాచబడిన సర్వ జ్ఞానసంపదలు: 'ఆయనయందే బుద్ధిజ్ఞానముల సర్వసంపదలు గుప్తమై యున్నవి'",
      "Colossians 2:3",
      "In whom are hidden all the treasures of wisdom and knowledge",
      "ఆయనయందే బుద్ధిజ్ఞానముల సర్వసంపదలు గుప్తమై యున్నవి",
      "There is no need to scavenge worldly philosophies; the total depository of cosmic truth and divine insight is locked in Christ.",
      "లౌకిక తత్వశాస్త్రములలో వెదకవలసిన పనిలేదు; సమస్త విశ్వ జ్ఞానసంపదలు ఒక్క క్రీస్తునందే దాచబడియున్నవి."
    ],
    [
      "Colossians 3:16 letting the word of Christ dwell richly in all wisdom: 'Let the word of Christ dwell in you richly in all wisdom, teaching and admonishing one another in psalms and hymns'",
      "కొలొస్సయులకు 3:16 సమస్త జ్ఞానముతో క్రీస్తు వాక్యమును నివసింపజేయుట: 'సంగీతములతోను కీర్తనలతోను ఆత్మసంబంధమైన పద్యములతోను ఒకరికొకరు బోధించుచు బుద్ధిచెప్పుచు, సమస్తవిధములైన జ్ఞానముతో క్రీస్తు వాక్యము మీలో సమృద్ధిగా నివసింపనీయుడి'",
      "Colossians 3:16",
      "Let the word of Christ dwell in you richly in all wisdom",
      "సమస్తవిధములైన జ్ఞానముతో క్రీస్తు వాక్యము మీలో సమృద్ధిగా నివసింపనీయుడి",
      "Scripture must not be a visiting guest but a resident monarch dominating our thoughts, generating wise mutual encouragement in corporate praise.",
      "క్రీస్తు పరిశుద్ధ వాక్యము మన హృదయములలో సమృద్ధిగా నివసించినప్పుడు సంఘములో జ్ఞానయుక్తమైన ఆత్మీయ క్షేమము కలుగును."
    ],
    [
      "Colossians 4:5 walking in wisdom toward outsiders redeeming the time: 'Walk in wisdom toward those who are outside, redeeming the time'",
      "కొలొస్సయులకు 4:5 వెలుపలివారియెడల జ్ఞానము కలిగి నడుచుకొనుట: 'సమయమును పోనియ్యక సద్వినియోగము చేసికొనుచు, వెలుపలివారియెడల జ్ఞానము కలిగి నడుచుకొనుడి'",
      "Colossians 4:5",
      "Walk in wisdom toward those who are outside, redeeming the time",
      "వెలుపలివారియెడల జ్ఞానము కలిగి నడుచుకొనుడి",
      "Evangelism requires social tact, moral winsomeness, and strategic cultural engagement to commend the gospel to unbelievers.",
      "అవిశ్వాసులయెదుట క్రైస్తవ సాక్ష్యమును కాపాడుకొనుచు సమయమును పోనియ్యక జ్ఞానముతో ప్రవర్తించవలెను."
    ],
    [
      "2 Timothy 3:15 scriptures making one wise for salvation: 'And that from childhood you have known the Holy Scriptures, which are able to make you wise for salvation through faith which is in Christ Jesus'",
      "2 తిమోతి 3:15 రక్షణార్థమైన జ్ఞానమును కలిగించు పరిశుద్ధ లేఖనములు: 'క్రీస్తుయేసునందలి విశ్వాసముద్వారా రక్షణార్థమైన జ్ఞానము నీకు కలిగించుటకు శక్తిగల పరిశుద్ధ లేఖనములను నీవు బాల్యమునుండి ఎరుగుదువు'",
      "2 Timothy 3:15",
      "Which are able to make you wise for salvation through faith which is in Christ Jesus",
      "క్రీస్తుయేసునందలి విశ్వాసముద్వారా రక్షణార్థమైన జ్ఞానము నీకు కలిగించుటకు శక్తిగల పరిశుద్ధ లేఖనములు",
      "The primary purpose of the biblical canon is soteriological: instructing lost humanity how to lay hold of eternal life in Jesus.",
      "పరిశుద్ధ బైబిలు గ్రంథము మానవునికి క్రీస్తునందలి రక్షణార్హమైన పరమ జ్ఞానమును నేర్పించే దైవిక సాధనము."
    ],
    [
      "James 1:5 asking God for wisdom who gives liberally: 'If any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him'",
      "యాకోబు 1:5 ధారాళముగా జ్ఞానమిచ్చు దేవుని అడుగుట: 'మీలో ఎవనికైనను జ్ఞానము కొదువగా ఉన్నయెడల అతడు దేవుని అడుగవలెను, అప్పుడది అతనికి అనుగ్రహింపబడును; ఆయన ఎవనిని గద్దింపక అందరికిని ధారాళముగా దయచేయువాడు'",
      "James 1:5",
      "If any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him",
      "మీలో ఎవనికైనను జ్ఞానము కొదువగా ఉన్నయెడల అతడు దేవుని అడుగవలెను, అప్పుడది అతనికి అనుగ్రహింపబడును; ఆయన ఎవనిని గద్దింపక అందరికిని ధారాళముగా దయచేయువాడు",
      "God maintains no stinginess toward humble seekers; in crisis, asking in unwavering faith unleashes generous downpours of divine wisdom.",
      "శ్రమలలో వివేచన అవసరమైనప్పుడు విశ్వాసముతో ప్రార్థించినచో దేవుడు ఎవరినీ నిందించక ధారాళముగా జ్ఞానమును అనుగ్రహించును."
    ],
    [
      "James 3:13 showing works done in the meekness of wisdom: 'Who is wise and understanding among you? Let him show by good conduct that his works are done in the meekness of wisdom'",
      "యాకోబు 3:13 జ్ఞానముతోకూడిన సాత్వికముతో క్రియలను కనుపరచుట: 'మీలో జ్ఞానవివేకములు గలవాడెవడు? వాడు జ్ఞానముతోకూడిన సాత్వికముతో తన క్రియలను సత్ప్రవర్తనవలన కనుపరచవలెను'",
      "James 3:13",
      "Let him show by good conduct that his works are done in the meekness of wisdom",
      "వాడు జ్ఞానముతోకూడిన సాత్వికముతో తన క్రియలను సత్ప్రవర్తనవలన కనుపరచవలెను",
      "Authentic wisdom is non-combative and modest; theoretical intellect without humble, compassionate deeds is counterfeit.",
      "నిజమైన దైవిక జ్ఞానము అహంకారముతో కూడినది కాదు; అది సాత్వికమైన మంచి ప్రవర్తనద్వారా వెల్లడియగును."
    ],
    [
      "James 3:15 earthly, sensual, demonic wisdom: 'This wisdom does not descend from above, but is earthly, sensual, demonic'",
      "యాకోబు 3:15 లౌకికమైనదియు కామసంబంధమైనదియు దయ్యముల జ్ఞానము: 'ఈ జ్ఞానము పైనుండి దిగివచ్చునది కాక భూసంబంధమైనదియు కామసంబంధమైనదియు దయ్యముల జ్ఞానమునై యున్నది'",
      "James 3:15",
      "This wisdom does not descend from above, but is earthly, sensual, demonic",
      "ఈ జ్ఞానము పైనుండి దిగివచ్చునది కాక భూసంబంధమైనదియు కామసంబంధమైనదియు దయ్యముల జ్ఞానమునై యున్నది",
      "Bitter rivalry, ambition, and self-promotion disguised as 'clever strategy' originate from hell itself and pollute the church.",
      "అసూయ మరియు స్వార్థపు కుయుక్తులతో కూడిన ఆలోచనలు దేవునివి కావు; అవి సాతాను సంబంధమైన విషపూరిత జ్ఞానము."
    ],
    [
      "James 3:17 the qualities of wisdom from above: 'The wisdom that is from above is first pure, then peaceable, gentle, willing to yield, full of mercy and good fruits, without partiality and without hypocrisy'",
      "యాకోబు 3:17 పైనుండి వచ్చు జ్ఞానపు లక్షణములు: 'పైనుండి వచ్చు జ్ఞానము మొట్టమొదట పవిత్రమైనది, తరువాత సమాధానకరమైనది, మృదువైనది, సులభముగా లోబడునది, కనికరముతోను మంచి ఫలములతోను నిండినది, పక్షపాతమైనను వేషధారణయైనను లేనిది'",
      "James 3:17",
      "The wisdom that is from above is first pure, then peaceable, gentle, willing to yield, full of mercy and good fruits, without partiality and without hypocrisy",
      "పైనుండి వచ్చు జ్ఞానము మొట్టమొదట పవిత్రమైనది, తరువాత సమాధానకరమైనది, మృదువైనది, సులభముగా లోబడునది, కనికరముతోను మంచి ఫలములతోను నిండినది, పక్షపాతమైనను వేషధారణయైనను లేనిది",
      "The heavenly octet: divine wisdom manifests primarily as pure holiness, followed by relational tenderness, radical mercy, and sincere integrity.",
      "దేవుడిచ్చు పరలోక జ్ఞానము పవిత్రత, సమాధానము, కనికరము మరియు నిష్కపటమైన సత్క్రియల సద్గుణములతో నిండియుండును."
    ],
    [
      "2 Peter 3:15 Paul writing according to wisdom given to him: 'As also our beloved brother Paul, according to the wisdom given to him, has written to you'",
      "2 పేతురు 3:15 పౌలునకు అనుగ్రహింపబడిన జ్ఞానము: 'మన ప్రియ సహోదరుడైన పౌలుకూడ తనకు అనుగ్రహింపబడిన జ్ఞానముచొప్పున మీకు వ్రాసియున్నాడు'",
      "2 Peter 3:15",
      "As also our beloved brother Paul, according to the wisdom given to him, has written to you",
      "మన ప్రియ సహోదరుడైన పౌలుకూడ తనకు అనుగ్రహింపబడిన జ్ఞానముచొప్పున మీకు వ్రాసియున్నాడు",
      "Peter confirms the divine inspiration of Pauline epistles, acknowledging them as scriptures shaped by heaven-sent apostolic wisdom.",
      "పౌలు పత్రికలు మానవ ఆలోచనలు కావు; దేవుడు అతనికి అనుగ్రహించిన పరలోకపు జ్ఞానముతో వ్రాయబడిన లేఖనములు."
    ],
    [
      "Daniel 1:17 God giving the four Hebrew youths skill and wisdom: 'As for these four young men, God gave them knowledge and skill in all literature and wisdom; and Daniel had understanding in all visions and dreams'",
      "దానియేలు 1:17 నలుగురు బాలురకు దేవుడిచ్చిన జ్ఞానము మరియు విద్య: 'దేవుడు ఈ నలుగురు బాలురకు సకలవిధములైన విద్యలయందును జ్ఞానమందును తెలివియు సామర్థ్యమును ఇచ్చెను; దానియేలు సకలవిధములైన దర్శనములను స్వప్నములను గ్రహించు వివేకముగలవాడాయెను'",
      "Daniel 1:17",
      "God gave them knowledge and skill in all literature and wisdom; and Daniel had understanding in all visions and dreams",
      "దేవుడు ఈ నలుగురు బాలురకు సకలవిధములైన విద్యలయందును జ్ఞానమందును తెలివియు సామర్థ్యమును ఇచ్చెను",
      "Because they refused Babylon's defiling delicacies, God rewarded their holy consecration with intellectual supremacy across the empire.",
      "అన్య దేశములో దేవునికొరకు పవిత్రతను కాపాడుకొనినందుకు ప్రభువు దానియేలు మరియు అతని స్నేహితులకు అసమాన జ్ఞానమునిచ్చెను."
    ],
    [
      "Daniel 2:20 Daniel praising God for wisdom and might: 'Blessed be the name of God forever and ever, for wisdom and might are His'",
      "దానియేలు 2:20 జ్ఞానబలములు దేవునివే అని దానియేలు స్తుతించుట: 'దేవుని నామము యుగయుగములు స్తుతింపబడును గాక; జ్ఞానబలములు ఆయనకే చెందును'",
      "Daniel 2:20",
      "Blessed be the name of God forever and ever, for wisdom and might are His",
      "దేవుని నామము యుగయుగములు స్తుతింపబడును గాక; జ్ఞానబలములు ఆయనకే చెందును",
      "When Nebuchadnezzar's forgotten dream was unveiled, Daniel attributed all intellectual revelation exclusively to the sovereign God in heaven.",
      "మానవ మేధస్సుకు అందని స్వప్న మర్మములను బయలుపరచిన సర్వోన్నతుడైన దేవుని జ్ఞానబలములను దానియేలు కీర్తించెను."
    ],
    [
      "Daniel 2:21 God giving wisdom to the wise: 'He gives wisdom to the wise and knowledge to those who have understanding'",
      "దానియేలు 2:21 జ్ఞానులకు జ్ఞానమును వివేకులకు తెలివిని ఇచ్చు దేవుడు: 'ఆయన జ్ఞానులకు జ్ఞానమును వివేకులకు తెలివిని ఇచ్చువాడు'",
      "Daniel 2:21",
      "He gives wisdom to the wise and knowledge to those who have understanding",
      "ఆయన జ్ఞానులకు జ్ఞానమును వివేకులకు తెలివిని ఇచ్చువాడు",
      "God does not cast pearls before arrogant mockers; He multiplies revelation to those whose hearts are already attuned to His fear.",
      "తన చిత్తమును అనుసరించు దీనులైన భక్తులకు దేవుడు మరిన్ని లోతైన మర్మములను గ్రహించు వివేకమును అనుగ్రహించును."
    ],
    [
      "Daniel 5:14 light, understanding, and excellent wisdom found in Daniel: 'I have heard of you, that the Spirit of God is in you, and that light and understanding and excellent wisdom are found in you'",
      "దానియేలు 5:14 దానియేలునందు కనబడిన శ్రేష్ఠమైన జ్ఞానము: 'దైవసంబంధమైన ఆత్మ నీయందున్నదనియు, వెలుగును వివేకమును శ్రేష్ఠమైన జ్ఞానమును నీయందు కనబడెననియు నేను నిన్నుగూర్చి వింటిని'",
      "Daniel 5:14",
      "That light and understanding and excellent wisdom are found in you",
      "వెలుగును వివేకమును శ్రేష్ఠమైన జ్ఞానమును నీయందు కనబడెను",
      "Pagan kings recognized that Daniel's intellect was luminous because the indwelling Holy Spirit animated his mind.",
      "లోకపు రాజులు సైతం దానియేలునందు ఉన్న దైవిక వెలుగును మరియు శ్రేష్ఠమైన పరలోకపు జ్ఞానమును అంగీకరించిరి."
    ],
    [
      "Daniel 12:3 the wise shining like the firmament: 'Those who are wise shall shine like the brightness of the firmament, and those who turn many to righteousness like the stars forever and ever'",
      "దానియేలు 12:3 నక్షత్రములవలె ప్రకాశించు జ్ఞానులు: 'బుద్ధిమంతులైతే (జ్ఞానులైతే) ఆకాశమండలములోని జ్యోతులనుబోలి ప్రకాశించెదరు, నీతిమార్గమునకు అనేకులను త్రిప్పువారు నక్షత్రములవలె నిరంతరమును ప్రకాశించెదరు'",
      "Daniel 12:3",
      "Those who are wise shall shine like the brightness of the firmament, and those who turn many to righteousness like the stars forever and ever",
      "బుద్ధిమంతులైతే ఆకాశమండలములోని జ్యోతులనుబోలి ప్రకాశించెదరు, నీతిమార్గమునకు అనేకులను త్రిప్పువారు నక్షత్రములవలె నిరంతరమును ప్రకాశించెదరు",
      "Eschatological brilliance: those whose wisdom evangelized and led fallen sinners to righteousness will blaze as eternal stars in glory.",
      "జ్ఞానముతో అనేకులను క్రీస్తు నీతిమార్గములోనికి నడిపించు పరిశుద్ధులు నిత్యత్వములో ఆకాశ నక్షత్రములవలె ప్రకాశింతురు."
    ],
    [
      "Hosea 14:9 the wise understanding the right ways of the Lord: 'Who is wise? Let him understand these things. Who is prudent? Let him know them. For the ways of the Lord are right; the righteous walk in them'",
      "హోషేయ 14:9 యెహోవా మార్గములు చక్కనివని గ్రహించు జ్ఞాని: 'జ్ఞానముగలవాడెవడో వాడు వీటిని గ్రహించును, వివేకముగలవాడెవడో వాడు వీటిని తెలిసికొనును; యెహోవా మార్గములు చక్కనివి, నీతిమంతులు వాటిలో నడుచుకొందురు'",
      "Hosea 14:9",
      "Who is wise? Let him understand these things. Who is prudent? Let him know them. For the ways of the Lord are right; the righteous walk in them",
      "జ్ఞానముగలవాడెవడో వాడు వీటిని గ్రహించును, వివేకముగలవాడెవడో వాడు వీటిని తెలిసికొనును; యెహోవా మార్గములు చక్కనివి, నీతిమంతులు వాటిలో నడుచుకొందురు",
      "The prophetic conclusion: the pinnacle of wisdom is perceiving that all God's providential dealings are perfectly just and good.",
      "దేవుని మార్గములు సంపూర్ణ న్యాయమైనవని గ్రహించి వాటియందు విశ్వాసముతో నడుచుకొనుటయే నిజమైన జ్ఞానము."
    ],
    [
      "Micah 6:9 wisdom seeing the name of the Lord: 'The Lord's voice cries to the city-wisdom shall see Your name. Hear the rod! Who has appointed it?'",
      "మీకా 6:9 దేవుని నామమును చూచు జ్ఞానము: 'యెహోవా శబ్దము పట్టణమునకు వినబడుచున్నది; జ్ఞానముగల మనస్సు నీ నామమును చూచును'",
      "Micah 6:9",
      "Wisdom shall see Your name. Hear the rod! Who has appointed it?",
      "జ్ఞానముగల మనస్సు నీ నామమును చూచును; దండమును దాని నియమించినవానిని వినుడి",
      "True wisdom recognizes God's disciplinary voice behind national calamities, turning quickly in repentance before the rod.",
      "దేశముపైకి వచ్చు శ్రమలలో దేవుని హెచ్చరికను మరియు ఆయన పరిశుద్ధ నామమును వివేచించు మనస్సే జ్ఞానముగల మనస్సు."
    ],
    [
      "Matthew 25:2 five wise virgins taking oil in their vessels: 'Five of them were wise, and five were foolish. Those who were foolish took their lamps and took no oil with them, but the wise took oil in their vessels with their lamps'",
      "మత్తయి 25:2-4 దివిటీలతోకూడ పాత్రలలో నూనె తీసికొనిన బుద్ధిగల కన్యకలు: 'వారిలో ఐదుగురు బుద్ధిలేనివారు, ఐదుగురు బుద్ధిగలవారు. బుద్ధిలేనివారు తమ దివిటీలు పట్టుకొని తమతోకూడ నూనె తీసికొనిపోలేదు; బుద్ధిగలవారైతే తమ దివిటీలతోకూడ పాత్రలలో నూనె తీసికొనిపోయిరి'",
      "Matthew 25:4",
      "The wise took oil in their vessels with their lamps",
      "బుద్ధిగలవారైతే తమ దివిటీలతోకూడ పాత్రలలో నూనె తీసికొనిపోయిరి",
      "Wisdom is preparation for the Bridegroom's delay; having an internal reservoir of the Holy Spirit ensures one is ready when Christ appears.",
      "ప్రభువు రాకడ ఆలస్యమైనను ఆత్మీయ సిద్ధపాటును కాపాడుకొనుటయే బుద్ధిగల కన్యకలు చూపిన పరలోకపు జ్ఞానము."
    ],
    [
      "Luke 7:35 wisdom justified by all her children: 'Wisdom is justified by all her children'",
      "లూకా 7:35 జ్ఞానము తన సంతానమంతటివలన నీతిగలదని తీర్చబడుట: 'అయినను జ్ఞానము నీతిగలదని దాని సంతానమంతటివలన తీర్చబడుచున్నది'",
      "Luke 7:35",
      "Wisdom is justified by all her children",
      "జ్ఞానము నీతిగలదని దాని సంతానమంతటివలన తీర్చబడుచున్నది",
      "No matter how skeptics deride the gospel, the holy, fruit-bearing disciples of Christ perpetually demonstrate divine wisdom's truth.",
      "సత్య సువార్తను వెంబడించే పరిశుద్ధుల జీవితములే దేవుని జ్ఞానము ఎంత శ్రేష్ఠమైనదో లోకమునకు రుజువు చేయును."
    ],
    [
      "Luke 11:49 the wisdom of God speaking concerning prophets: 'Therefore the wisdom of God also said, I will send them prophets and apostles, and some of them they will kill and persecute'",
      "లూకా 11:49 దేవుని జ్ఞానము పలికిన మాట: 'అందుచేత దేవుని జ్ఞానము చెప్పినదేమనగా-నేను వారియొద్దకు ప్రవక్తలను అపొస్తలులను పంపెదను; వారు వారిలో కొందరిని చంపుదురు, కొందరిని హింసింతురు'",
      "Luke 11:49",
      "Therefore the wisdom of God also said, I will send them prophets and apostles",
      "అందుచేత దేవుని జ్ఞానము చెప్పినదేమనగా-నేను వారియొద్దకు ప్రవక్తలను అపొస్తలులను పంపెదను",
      "God's redemptive strategy anticipated the brutal rejection of His messengers, using their martyrdom to accomplish eternal redemption.",
      "దేవుని పరమ జ్ఞానము తన సేవకుల త్యాగములను సైతం రక్షణ ప్రణాళికను నెరవేర్చుటకు వినియోగించుకొనెను."
    ]
  ];

  return data.map(item => ({
    easyQ: `What crucial insight regarding spiritual growth and heavenly wisdom is presented in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన ఆత్మీయ ఎదుగుదల మరియు పరలోక జ్ఞాన సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does Christ as the power and wisdom of God triumph over secular philosophy and spiritual adversaries?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం క్రీస్తు దేవుని శక్తియు జ్ఞానమునై ఉండి లౌకిక తత్వములను మరియు శత్రువులను ఎలా జయించును?`,
    hardQ: `What theological reality does ${item[2]} establish concerning heavenly versus earthly wisdom, spiritual discernment, and the mind of Christ?`,
    hardQTe: `${item[2]} ప్రకారం పరలోకపు జ్ఞానమునకును లౌకిక ఆలోచనలకును గల వ్యత్యాసమును మరియు క్రీస్తు మనస్సును గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty cedar storerooms by the brook of Jabbok", "He commanded seventy days of silent lamentation in the valley of Achor", "He forged fifty bronze spears for the garrison of Gilead"],
    optionsTelugu: [item[4], "యబ్బోకు వాగుయొద్ద నలభై దేవదారు కొట్ల గదులను నిర్మించెను", "ఆకోరు లోయలో డెబ్బై దినముల మౌన రోదనను విధించెను", "గిలాదు దండుకొరకు యాభై కంచు ఈటెలను తయారుచేసెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Mastery Facts for Wisdom (Deep Cosmic Wisdom, Wisdom in Judgment, Eschatological Doxology, Wisdom in Christ)
function buildWisdomMastery() {
  const data = [
    [
      "Job 12:13 with God are wisdom and strength: 'With Him are wisdom and strength, He has counsel and understanding'",
      "యోబు 12:13 దేవునియొద్ద జ్ఞానబలములు ఉండుట: 'జ్ఞానబలములు ఆయనయొద్ద ఉన్నవి; ఆలోచనయు వివేచనయు ఆయనకే కలవు'",
      "Job 12:13",
      "With Him are wisdom and strength, He has counsel and understanding",
      "జ్ఞానబలములు ఆయనయొద్ద ఉన్నవి; ఆలోచనయు వివేచనయు ఆయనకే కలవు",
      "God's wisdom is not academic speculation; it is married to omnipotent strength to execute His sovereign counsel without failure.",
      "దేవుని జ్ఞానము కేవలము ఆలోచన మాత్రమే కాదు; తన సంకల్పమును నెరవేర్చుటకు కావలసిన సర్వశక్తి ఆయనయొద్ద కలదు."
    ],
    [
      "Job 32:8 the breath of the Almighty giving understanding: 'But there is a spirit in man, and the breath of the Almighty gives him understanding'",
      "యోబు 32:8 సర్వశక్తుని ఊపిరి వివేచననిచ్చుట: 'నిశ్చయముగా నరులలో ఒక ఆత్మ కలదు, సర్వశక్తుడగు దేవుని ఊపిరి వారికి వివేచన కలుగజేయును'",
      "Job 32:8",
      "There is a spirit in man, and the breath of the Almighty gives him understanding",
      "నిశ్చయముగా నరులలో ఒక ఆత్మ కలదు, సర్వశక్తుడగు దేవుని ఊపిరి వారికి వివేచన కలుగజేయును",
      "Wisdom does not automatically accrue with old age; genuine spiritual insight is breathed directly into the human spirit by the Almighty.",
      "వయస్సు పెరిగినంత మాత్రాన జ్ఞానము రాదు; సర్వశక్తుడైన దేవుని పరిశుద్ధాత్మ ఊపిరియే మానవునికి నిజమైన వివేచననిచ్చును."
    ],
    [
      "Job 38:36 God putting wisdom in the mind: 'Who has put wisdom in the mind? Or who has given understanding to the heart?'",
      "యోబు 38:36 అంతరంగములో జ్ఞానమును ఉంచిన దేవుడు: 'అంతరంగములో జ్ఞానమును ఉంచినవాడెవడు? హృదయమునకు వివేచన ఇచ్చినవాడెవడు?'",
      "Job 38:36",
      "Who has put wisdom in the mind? Or who has given understanding to the heart?",
      "అంతరంగములో జ్ఞానమును ఉంచినవాడెవడు? హృదయమునకు వివేచన ఇచ్చినవాడెవడు?",
      "God confronts Job out of the whirlwind, demonstrating that human consciousness and rational capacity are miraculous divine gifts.",
      "మానవ మెదడులో ఆలోచనను మరియు అంతరంగములో వివేచనను ఉంచిన సృష్టికర్తయైన దేవుని గొప్పతనము."
    ],
    [
      "Psalm 37:30 the mouth of the righteous speaking wisdom: 'The mouth of the righteous speaks wisdom, and his tongue talks of justice'",
      "కీర్తన 37:30 నీతిమంతుని నోరు జ్ఞానమును ఉచ్చరించుట: 'నీతిమంతుని నోరు జ్ఞానమును ఉచ్చరించును, అతని నాలుక న్యాయము పలికించును'",
      "Psalm 37:30",
      "The mouth of the righteous speaks wisdom, and his tongue talks of justice",
      "నీతిమంతుని నోరు జ్ఞానమును ఉచ్చరించును, అతని నాలుక న్యాయము పలికించును",
      "A righteous character inevitably overflows through speech saturated with biblical wisdom and equity.",
      "నీతిమంతుని అంతరంగము దేవుని వాక్యముతో నిండియుండుటవలన అతని పెదవులు నిరంతరము జ్ఞానమును న్యాయమును పలుకును."
    ],
    [
      "Psalm 49:3 the meditation of the heart giving understanding: 'My mouth shall speak wisdom, and the meditation of my heart shall give understanding'",
      "కీర్తన 49:3 హృదయ ధ్యానము వివేచననిచ్చుట: 'నా నోరు జ్ఞానోపదేశము చేయును, నా హృదయ ధ్యానము వివేచనకరమై యుండును'",
      "Psalm 49:3",
      "My mouth shall speak wisdom, and the meditation of my heart shall give understanding",
      "నా నోరు జ్ఞానోపదేశము చేయును, నా హృదయ ధ్యానము వివేచనకరమై యుండును",
      "Deep public instruction must flow from quiet, contemplative meditation on God's truth in the secret place.",
      "ఏకాంతములో దేవుని సత్యమును ధ్యానించుటద్వారానే ఇతరులకు ప్రయోజనకరమైన జ్ఞానోపదేశము బయలువెళ్లును."
    ],
    [
      "Proverbs 1:20-23 wisdom calling aloud in open squares: 'Wisdom calls aloud outside; she raises her voice in the open squares... Turn at my rebuke; surely I will pour out my spirit on you'",
      "సామెతలు 1:20,23 వీధులలో కేకలువేయు జ్ఞానము: 'జ్ఞానము వీధులలో కేకలువేయుచున్నది... నా గద్దింపు విని తిరుగుడి, ఇదిగో నా ఆత్మను మీమీద కుమ్మరించెదను'",
      "Proverbs 1:20,23",
      "Wisdom calls aloud outside; she raises her voice in the open squares... Turn at my rebuke; surely I will pour out my spirit on you",
      "జ్ఞానము వీధులలో కేకలువేయుచున్నది... నా గద్దింపు విని తిరుగుడి, ఇదిగో నా ఆత్మను మీమీద కుమ్మరించెదను",
      "Wisdom is not an elitist secret; she publicly invites sinners to repent, promising an outpouring of the Holy Spirit to all who heed her reproof.",
      "దైవిక జ్ఞానము అందరికీ అందుబాటులో ఉండి పిలుచుచున్నది; తన గద్దింపునకు లోబడువారిపై ఆత్మను కుమ్మరింతునని వాగ్దానము చేయుచున్నది."
    ],
    [
      "Proverbs 3:19 the Lord founding the earth by wisdom: 'The Lord by wisdom founded the earth; by understanding He established the heavens'",
      "సామెతలు 3:19 జ్ఞానమువలన భూమిని స్థాపించిన యెహోవా: 'యెహోవా జ్ఞానమువలన భూమిని స్థాపించెను, వివేచనవలన ఆయన ఆకాశవిశాలమును స్థిరపరచెను'",
      "Proverbs 3:19",
      "The Lord by wisdom founded the earth; by understanding He established the heavens",
      "యెహోవా జ్ఞానమువలన భూమిని స్థాపించెను, వివేచనవలన ఆయన ఆకాశవిశాలమును స్థిరపరచెను",
      "The laws of gravity, astrophysics, and atmospheric balance were engineered by the sublime architecture of divine wisdom.",
      "దేవుడు తన అద్భుత జ్ఞానముచేత భూమికి పునాదులు వేసి వివేచనతో సమస్త ఆకాశమండలమును క్రమములో స్థిరపరచెను."
    ],
    [
      "Proverbs 8:14 counsel and sound wisdom belonging to God: 'Counsel is mine, and sound wisdom; I am understanding, I have strength'",
      "సామెతలు 8:14 ఆలోచనయు సద్బుద్ధియు జ్ఞానానివే: 'ఆలోచనయు సద్బుద్ధియు నావే; నేనే వివేచనను, పరాక్రమము నాదే'",
      "Proverbs 8:14",
      "Counsel is mine, and sound wisdom; I am understanding, I have strength",
      "ఆలోచనయు సద్బుద్ధియు నావే; నేనే వివేచనను, పరాక్రమము నాదే",
      "Wisdom possesses the ultimate monopoly on sound counsel and the spiritual muscle required to implement it.",
      "దైవిక జ్ఞానమే సరైన సలహాను మరియు దానిని నెరవేర్చుటకు కావలసిన ఆత్మీయ పరాక్రమమును కలిగియున్నది."
    ],
    [
      "Proverbs 8:15-16 kings reigning by divine wisdom: 'By me kings reign, and rulers decree justice. By me princes rule, and nobles, all the judges of the earth'",
      "సామెతలు 8:15-16 జ్ఞానమువలన రాజులు పరిపాలన చేయుట: 'నావలన రాజులు పరిపాలన చేయుదురు, అధికారులు న్యాయము విధించుదురు; నావలన ప్రధానులును నోబులులును న్యాయాధిపతులందరును పరిపాలింతురు'",
      "Proverbs 8:15-16",
      "By me kings reign, and rulers decree justice. By me princes rule, and nobles, all the judges of the earth",
      "నావలన రాజులు పరిపాలన చేయుదురు, అధికారులు న్యాయము విధించుదురు; నావలన ప్రధానులును భూమిమీది న్యాయాధిపతులందరును పరిపాలింతురు",
      "Legitimate civic governance and righteous judicial administration derive all their authority and stability from divine wisdom.",
      "దేశములలో న్యాయమైన పరిపాలన సాగుటకును అధికారులు న్యాయతీర్పు తీర్చుటకును దైవిక జ్ఞానమే పరమ మూలాధారము."
    ],
    [
      "Proverbs 8:34-35 blessed is the man watching daily at wisdom's gates: 'Blessed is the man who listens to me, watching daily at my gates... for whoever finds me finds life, and obtains favor from the Lord'",
      "సామెతలు 8:34-35 అనుదినము జ్ఞానపు ద్వారములయొద్ద కనిపెట్టువాడు: 'నా మాట వినువాడు ధన్యుడు, అనుదినము నా ద్వారములయొద్ద కనిపెట్టువాడు ధన్యుడు... నన్ను కనుగొనువాడు జీవమును కనుగొనును, యెహోవావలన దయ పొందును'",
      "Proverbs 8:34-35",
      "Blessed is the man who listens to me, watching daily at my gates, waiting at the posts of my doors. For whoever finds me finds life, and obtains favor from the Lord",
      "నా మాట వినువాడు ధన్యుడు, అనుదినము నా ద్వారములయొద్ద కనిపెట్టువాడు నా గడపలయొద్ద కాచుకొనువాడు ధన్యుడు. నన్ను కనుగొనువాడు జీవమును కనుగొనును, యెహోవావలన దయ పొందును",
      "Daily spiritual vigilance at the threshold of God's Word secures eternal vitality and unmerited divine favor.",
      "అనుదినము దేవుని వాక్య ద్వారములయొద్ద కనిపెట్టి జ్ఞానమును అభ్యసించువాడు నిత్యజీవమును దేవుని అనుగ్రహమును పొందును."
    ],
    [
      "Proverbs 9:11 days multiplied and years of life added by wisdom: 'For by me your days will be multiplied, and years of life will be added to you'",
      "సామెతలు 9:11 జ్ఞానమువలన దినములు విస్తరించుట: 'నావలన నీ దినములు విస్తరించును, నీ జీవిత సంవత్సరములు అధికమగును'",
      "Proverbs 9:11",
      "For by me your days will be multiplied, and years of life will be added to you",
      "నావలన నీ దినములు విస్తరించును, నీ జీవిత సంవత్సరములు అధికమగును",
      "Obedience to divine wisdom purges life-shortening vices, adding quality, length, and joy to the mortal journey.",
      "దేవుని జ్ఞానమును అనుసరించుటవలన ప్రమాదకర పాపపు నష్టములు తొలగి ఆయుష్కాల దినములు విస్తరించును."
    ],
    [
      "Proverbs 13:10 wisdom with the well-advised: 'By pride comes nothing but strife, but with the well-advised is wisdom'",
      "సామెతలు 13:10 ఆలోచన వినువారియొద్ద జ్ఞానముండుట: 'అహంకారమువలన కలహమే పుట్టును, ఆలోచన వినువారియొద్ద జ్ఞానము కలదు'",
      "Proverbs 13:10",
      "By pride comes nothing but strife, but with the well-advised is wisdom",
      "అహంకారమువలన కలహమే పుట్టును, ఆలోచన వినువారియొద్ద జ్ఞానము కలదు",
      "Pride is the combustible fuel of all interpersonal friction, while humble consultation with godly counselors breeds tranquility and wisdom.",
      "గర్వము కలహములను పుట్టించును; అయితే పెద్దల సలహాలను విను వినయముగలవారియొద్ద సమాధానకర జ్ఞానము నిలుచును."
    ],
    [
      "Proverbs 14:16 the wise fearing and departing from evil: 'A wise man fears and departs from evil, but a fool rages and is self-confident'",
      "సామెతలు 14:16 జ్ఞాని భయపడి కీడునుండి తొలగిపోవుట: 'జ్ఞానముగలవాడు భయపడి కీడునుండి తొలగిపోవును, బుద్ధిహీనుడు గర్వించి నిర్భయముగా తిరుగును'",
      "Proverbs 14:16",
      "A wise man fears and departs from evil, but a fool rages and is self-confident",
      "జ్ఞానముగలవాడు భయపడి కీడునుండి తొలగిపోవును, బుద్ధిహీనుడు గర్వించి నిర్భయముగా తిరుగును",
      "Holy caution avoids temptation; the fool brazenly rushes into peril with overconfident arrogance, bringing sudden destruction.",
      "దైవభయముగల జ్ఞాని పాపమును చూచి దూరముగా తొలగిపోవును; మూర్ఖుడు స్వనీతిని నమ్ముకొని నాశనములోనికి దిగును."
    ],
    [
      "Proverbs 15:14 the discerning heart seeking knowledge: 'The heart of him who has understanding seeks knowledge, but the mouth of fools feeds on foolishness'",
      "సామెతలు 15:14 బుద్ధిగల హృదయము జ్ఞానమును వెదకుట: 'బుద్ధిగలవాని హృదయము జ్ఞానమును వెదకును, బుద్ధిహీనుల నోరు మూఢత్వమును మేయును'",
      "Proverbs 15:14",
      "The heart of him who has understanding seeks knowledge, but the mouth of fools feeds on foolishness",
      "బుద్ధిగలవాని హృదయము జ్ఞానమును వెదకును, బుద్ధిహీనుల నోరు మూఢత్వమును మేయును",
      "Appetites reveal spiritual health: discerning minds feast on divine truth, while fools scavenge trash heaps of trivia and gossip.",
      "వివేకముగల మనస్సు దైవిక సత్యములను ఆకలితో అన్వేషించును; బుద్ధిహీనుడు వ్యర్థమైన లోకపు మాటలను మేయును."
    ],
    [
      "Proverbs 17:10 a rebuke entering deeper into a wise man: 'Rebuke is more effective for a wise man than a hundred blows on a fool'",
      "సామెతలు 17:10 జ్ఞానవంతునిమీద గద్దింపు లోతుగా పని చేయుట: 'బుద్ధిహీనుని నూరు దెబ్బలు కొట్టుటకంటె వివేకియైనవానిని ఒక మాటతో గద్దించుట వాని మనస్సునందు ఎక్కువ నాటును'",
      "Proverbs 17:10",
      "Rebuke is more effective for a wise man than a hundred blows on a fool",
      "బుద్ధిహీనుని నూరు దెబ్బలు కొట్టుటకంటె వివేకియైనవానిని ఒక మాటతో గద్దించుట వాని మనస్సునందు ఎక్కువ నాటును",
      "The sensitive conscience of a wise saint repents immediately at a single word of godly rebuke, whereas physical beatings fail to penetrate a fool's hard heart.",
      "వివేకికి చిన్న గద్దింపు మాటయే హృదయములో నాటుకొని మారుమనస్సు నిచ్చును; మొండి మూర్ఖునికి నూరు దెబ్బలు కొట్టినను మార్పు రాదు."
    ],
    [
      "Proverbs 17:27 a man of understanding possessing a calm spirit: 'He who has knowledge spares his words, and a man of understanding is of a calm spirit'",
      "సామెతలు 17:27 వివేకముగలవాడు శాంతగుణము కలిగియుండుట: 'మితముగా మాటలాడువాడు తెలివిగలవాడు, శాంతగుణముగలవాడు వివేకముగలవాడు'",
      "Proverbs 17:27",
      "He who has knowledge spares his words, and a man of understanding is of a calm spirit",
      "మితముగా మాటలాడువాడు తెలివిగలవాడు, శాంతగుణముగలవాడు వివేకముగలవాడు",
      "Verbal restraint and emotional equilibrium demonstrate internal mastery governed by the Holy Spirit.",
      "అనవసరమైన మాటలను మాని శాంతస్వభావముతో హృదయమును కాపాడుకొనుటయే వివేకియొక్క పరమ లక్షణము."
    ],
    [
      "Proverbs 18:4 the wellspring of wisdom as a flowing brook: 'The words of a man's mouth are deep waters; the wellspring of wisdom is a flowing brook'",
      "సామెతలు 18:4 పారు సెలయేరువంటి జ్ఞానపు ఊట: 'ఒకని నోటి మాటలు లోతైన నీళ్లవంటివి, జ్ఞానపు ఊట పారు సెలయేరువంటిది'",
      "Proverbs 18:4",
      "The words of a man's mouth are deep waters; the wellspring of wisdom is a flowing brook",
      "ఒకని నోటి మాటలు లోతైన నీళ్లవంటివి, జ్ఞానపు ఊట పారు సెలయేరువంటిది",
      "A sanctified mind provides a refreshing, inexhaustible stream of counsel that quenches the thirst of embattled pilgrims.",
      "జ్ఞాని అంతరంగములోని దైవిక సత్యములు ఎల్లప్పుడును ప్రవహించే పరిశుద్ధ సెలయేరువలె ఇతరులను సేదదీర్చును."
    ],
    [
      "Proverbs 18:15 the heart of the prudent acquiring knowledge: 'The heart of the prudent acquires knowledge, and the ear of the wise seeks knowledge'",
      "సామెతలు 18:15 వివేకి హృదయము జ్ఞానమును సంపాదించుకొనుట: 'వివేకియొక్క హృదయము తెలివిని సంపాదించుకొనును, జ్ఞానుల చెవి తెలివిని వెదకును'",
      "Proverbs 18:15",
      "The heart of the prudent acquires knowledge, and the ear of the wise seeks knowledge",
      "వివేకియొక్క హృదయము తెలివిని సంపాదించుకొనును, జ్ఞానుల చెవి తెలివిని వెదకును",
      "True wisdom is characterized by perpetual humility and lifelong listening, ever expanding its comprehension of divine truth.",
      "వివేకముగల విశ్వాసి ఎన్నడును నేర్చుకొనుట ఆపడు; అతని చెవి నిరంతరము దేవుని వాక్య జ్ఞానమును వెదకుచుండును."
    ],
    [
      "Proverbs 19:20 listening to counsel to be wise in your latter days: 'Listen to counsel and receive instruction, that you may be wise in your latter days'",
      "సామెతలు 19:20 కడపట జ్ఞానవంతుడగునట్లు ఉపదేశము వినుట: 'నీవు కడపట జ్ఞానవంతుడవు కావలెనని ఆలోచన విని ఉపదేశమును అంగీకరించుము'",
      "Proverbs 19:20",
      "Listen to counsel and receive instruction, that you may be wise in your latter days",
      "నీవు కడపట జ్ఞానవంతుడవు కావలెనని ఆలోచన విని ఉపదేశమును అంగీకరించుము",
      "Submitting to painful correction in youth constructs a glorious monument of wisdom and honor in maturity and old age.",
      "యౌవన కాలములో దైవిక ఉపదేశమునకు లోబడుట భవిష్యత్ కాలములో పరమ జ్ఞానముతో వర్ధిల్లుటకు పునాది."
    ],
    [
      "Proverbs 20:5 counsel in the heart drawn out by a man of understanding: 'Counsel in the heart of man is like deep water, but a man of understanding will draw it out'",
      "సామెతలు 20:5 లోతైన నీళ్లవంటి హృదయాలోచనను తోడుకొను వివేకి: 'నరుని హృదయములోని ఆలోచన లోతైన నీళ్లవంటిది, వివేకముగలవాడు దానిని తోడుకొనును'",
      "Proverbs 20:5",
      "Counsel in the heart of man is like deep water, but a man of understanding will draw it out",
      "నరుని హృదయములోని ఆలోచన లోతైన నీళ్లవంటిది, వివేకముగలవాడు దానిని తోడుకొనును",
      "Skilled pastoral wisdom asks penetrating questions, gently excavating motives and wisdom hidden beneath the surface of the human heart.",
      "వివేకముగల దైవజనుడు ఇతరుల హృదయములోని లోతైన ఆలోచనలను కనిపెట్టి దైవిక పరిష్కారమును తోడుకొనగలడు."
    ],
    [
      "Proverbs 22:17-18 applying heart to the words of the wise: 'Incline your ear and hear the words of the wise, and apply your heart to my knowledge; for it is a pleasant thing if you keep them within you'",
      "సామెతలు 22:17-18 జ్ఞానుల మాటలమీద హృదయముంచుట: 'చెవియొగ్గి జ్ఞానుల మాటలు వినుము, నా ఉపదేశముమీద మనస్సుంచుము; వాటిని నీ హృదయమందు ఉంచుకొనుట ఎంతయో రమ్యము'",
      "Proverbs 22:17-18",
      "Incline your ear and hear the words of the wise, and apply your heart to my knowledge; for it is a pleasant thing if you keep them within you",
      "చెవియొగ్గి జ్ఞానుల మాటలు వినుము, నా ఉపదేశముమీద మనస్సుంచుము; వాటిని నీ హృదయమందు ఉంచుకొనుట ఎంతయో రమ్యము",
      "Treasure divine proverbs in the internal repository; ready words on the lips bring delightful strength in moments of crisis.",
      "దేవుని సత్యమును చెవియొగ్గి విని హృదయములో దాచుకొనుట అనుదిన ప్రవర్తనకు రమ్యమైన ఆత్మీయ ఆనందము."
    ],
    [
      "Proverbs 23:23 buy the truth and sell it not: 'Buy the truth, and do not sell it, also wisdom and instruction and understanding'",
      "సామెతలు 23:23 సత్యమును జ్ఞానమును కొనుము, అమ్మకుము: 'సత్యమును కొనుము, దాని అమ్మకుము; జ్ఞానమును ఉపదేశమును వివేకమును కొనుము'",
      "Proverbs 23:23",
      "Buy the truth, and do not sell it, also wisdom and instruction and understanding",
      "సత్యమును కొనుము, దాని అమ్మకుము; జ్ఞానమును ఉపదేశమును వివేకమును కొనుము",
      "Pay any price of discipline, study, and suffering to acquire divine wisdom, and never barter it away for worldly popularity or money.",
      "ఎంత త్యాగము చేసైనా దేవుని సత్యమును మరియు జ్ఞానమును సంపాదించుకొనవలెను; ఏ లోక లాభముకొరకును దానిని వదులుకొనరాదు."
    ],
    [
      "Proverbs 24:5 a wise man being strong and increasing strength: 'A wise man is strong, yes, a man of knowledge increases strength'",
      "సామెతలు 24:5 జ్ఞానముగలవాడు బలవంతుడు: 'జ్ఞానముగలవాడు బలవంతుడుగా ఉండును, తెలివిగలవాడు తన బలమును వృద్ధిచేసికొనును'",
      "Proverbs 24:5",
      "A wise man is strong, yes, a man of knowledge increases strength",
      "జ్ఞానముగలవాడు బలవంతుడుగా ఉండును, తెలివిగలవాడు తన బలమును వృద్ధిచేసికొనును",
      "True leverage in life is spiritual intellect; knowledge of God expands capacity, authority, and endurance far beyond physical brawn.",
      "దైవిక జ్ఞానముగలవాడు ఆత్మీయముగా ఎంతో బలవంతుడై నిరంతరము తన సామర్థ్యమును వృద్ధి చేసికొనును."
    ],
    [
      "Proverbs 25:11-12 a word fitly spoken like apples of gold: 'A word fitly spoken is like apples of gold in settings of silver. Like an earring of gold and an ornament of fine gold is a wise rebuker to an obedient ear'",
      "సామెతలు 25:11-12 సమయోచితమైన మాట వెండి పళ్లెరములలోని బంగారు పండ్లు: 'సమయోచితముగా పలికిన మాట వెండి పళ్లెరములలోని బంగారు పండ్లవలె నుండును; వినువాని చెవికి జ్ఞానముగల ఉపదేశకుడు బంగారు పోగువలె నుండును'",
      "Proverbs 25:11-12",
      "A word fitly spoken is like apples of gold in settings of silver. Like an earring of gold and an ornament of fine gold is a wise rebuker to an obedient ear",
      "సమయోచితముగా పలికిన మాట వెండి పళ్లెరములలోని బంగారు పండ్లవలె నుండును; వినువాని చెవికి జ్ఞానముగల ఉపదేశకుడు బంగారు పోగువలె నుండును",
      "Mastery of speech: timely, graceful, wise counsel is an exquisite masterpiece of art that enriches all who hear.",
      "సమయమునకు తగినట్లుగా పలికే దైవిక జ్ఞానపు మాటలు వెండి పళ్లెరములలో అమర్చిన బంగారు పండ్లవలె అత్యంత శోభాయమానము."
    ],
    [
      "Proverbs 27:11 being wise and making the father's heart glad: 'My son, be wise, and make my heart glad, that I may answer him who reproaches me'",
      "సామెతలు 27:11 జ్ఞానము కలిగి తండ్రి హృదయమును సంతోషపెట్టుట: 'నా కుమారుడా, జ్ఞానము కలిగి నా హృదయమును సంతోషపరచుము, అప్పుడు నన్ను నిందించువానికి నేను ఉత్తరమియ్యగలను'",
      "Proverbs 27:11",
      "My son, be wise, and make my heart glad, that I may answer him who reproaches me",
      "నా కుమారుడా, జ్ఞానము కలిగి నా హృదయమును సంతోషపరచుము, అప్పుడు నన్ను నిందించువానికి నేను ఉత్తరమియ్యగలను",
      "A disciple walking in upright wisdom is the ultimate apologetic that vindicates spiritual mentors against cynical critics.",
      "కుమారుడు దైవిక జ్ఞానముతో నడుచుకొనుట తండ్రి హృదయమునకు గొప్ప ఆనందమును మరియు నిందించువారికి బలమైన జవాబును ఇచ్చును."
    ],
    [
      "Proverbs 28:7 a discerning son keeping the law: 'Whoever keeps the law is a discerning son, but a companion of gluttons shames his father'",
      "సామెతలు 28:7 ధర్మశాస్త్రమును గైకొనువాడు వివేకముగల కుమారుడు: 'ధర్మశాస్త్రమును గైకొనువాడు వివేకముగల కుమారుడు, తిండిపోతుల సహవాసము చేయువాడు తన తండ్రికి అవమానము తెచ్చును'",
      "Proverbs 28:7",
      "Whoever keeps the law is a discerning son, but a companion of gluttons shames his father",
      "ధర్మశాస్త్రమును గైకొనువాడు వివేకముగల కుమారుడు, తిండిపోతుల సహవాసము చేయువాడు తన తండ్రికి అవమానము తెచ్చును",
      "True discernment is demonstrated by obedience to God's commandments, shunning wasteful companions who drag families into disrepute.",
      "దేవుని వాక్యమును అనుసరించి పరిశుద్ధముగా జీవించువాడే వివేకముగల కుమారుడు; దుష్ట సహవాసము కుటుంబమునకు సిగ్గు తెచ్చును."
    ],
    [
      "Proverbs 29:3 loving wisdom making the father rejoice: 'Whoever loves wisdom makes his father rejoice, but a companion of harlots squanders his wealth'",
      "సామెతలు 29:3 జ్ఞానమును ప్రేమించువాడు తండ్రిని సంతోషపెట్టుట: 'జ్ఞానమును ప్రేమించువాడు తన తండ్రిని సంతోషపరచును, వేశ్యల సహవాసము చేయువాడు ఆస్తిని పాడుచేయును'",
      "Proverbs 29:3",
      "Whoever loves wisdom makes his father rejoice, but a companion of harlots squanders his wealth",
      "జ్ఞానమును ప్రేమించువాడు తన తండ్రిని సంతోషపరచును, వేశ్యల సహవాసము చేయువాడు ఆస్తిని పాడుచేయును",
      "Pursuing godly wisdom guards moral chastity and preserves inheritance, shielding children from the squandering traps of immorality.",
      "దేవుని జ్ఞానమును ప్రేమించువాడు తన జీవితాన్ని పరిశుద్ధముగా కాపాడుకొని తండ్రికి పరమ సంతోషమును కలిగించును."
    ],
    [
      "Proverbs 29:8 wise men turning away wrath: 'Scoffers set a city on fire, but wise men turn away wrath'",
      "సామెతలు 29:8 క్రోధమును చల్లార్చు జ్ఞానులు: 'అపహాసకులు పట్టణములో అల్లరి రేపుదురు, జ్ఞానులు క్రోధమును చల్లార్చుదురు'",
      "Proverbs 29:8",
      "Scoffers set a city on fire, but wise men turn away wrath",
      "అపహాసకులు పట్టణములో అల్లరి రేపుదురు, జ్ఞానులు క్రోధమును చల్లార్చుదురు",
      "Cynical agitators ignite riots and civil discord, but calm, peacemaking sages extinguish fiery anger with judicious diplomacy.",
      "అహంకారులు సమాజములో విద్వేషపు మంటలను రేపగా, జ్ఞానులు తమ శాంత వాక్కులతో క్రోధమును చల్లార్చి సమాధానమును స్థాపింతురు."
    ],
    [
      "Proverbs 29:15 the rod and rebuke giving wisdom: 'The rod and rebuke give wisdom, but a child left to himself brings shame to his mother'",
      "సామెతలు 29:15 బెత్తమును గద్దింపును జ్ఞానమునిచ్చుట: 'బెత్తమును గద్దింపును జ్ఞానము కలుగజేయును, విడువబడిన బాలుడు తన తల్లికి అవమానము తెచ్చును'",
      "Proverbs 29:15",
      "The rod and rebuke give wisdom, but a child left to himself brings shame to his mother",
      "బెత్తమును గద్దింపును జ్ఞానము కలుగజేయును, విడువబడిన బాలుడు తన తల్లికి అవమానము తెచ్చును",
      "Loving parental discipline and spoken correction implant wisdom in young hearts, while neglect leads to tragic moral shame.",
      "ప్రేమతో కూడిన శిక్షణ మరియు గద్దింపు పిల్లల హృదయములో జ్ఞానమును నాటును; క్రమశిక్షణ లేని నడత తల్లిదండ్రులకు అవమానకరము."
    ],
    [
      "Proverbs 31:26 opening mouth with wisdom and the law of kindness: 'She opens her mouth with wisdom, and on her tongue is the law of kindness'",
      "సామెతలు 31:26 జ్ఞానముతో నోరు తెరచి దయాబోధ చేయు సద్గుణవతి: 'ఆమె జ్ఞానముతో తన నోరు తెరచును, కృపగల ఉపదేశము ఆమె నాలుకమీద నుండును'",
      "Proverbs 31:26",
      "She opens her mouth with wisdom, and on her tongue is the law of kindness",
      "ఆమె జ్ఞానముతో తన నోరు తెరచును, కృపగల ఉపదేశము ఆమె నాలుకమీద నుండును",
      "The virtuous matriarch combines intellectual depth with profound compassion; every word is governed by the loving law of kindness.",
      "సద్గుణవతియైన స్త్రీ తన గృహములో జ్ఞానముతో మాటలాడుచు దయతో నిండిన ఉపదేశమును కుటుంబమునకు అందించును."
    ],
    [
      "Ecclesiastes 2:13 wisdom excelling folly as light excels darkness: 'Then I saw that wisdom excels folly as light excels darkness'",
      "ప్రసంగి 2:13 చీకటికంటె వెలుగు శ్రేష్ఠమైనట్లు మూఢత్వముకంటె జ్ఞానము శ్రేష్ఠము: 'చీకటికంటె వెలుగు ఎంత శ్రేష్ఠమో మూఢత్వముకంటె జ్ఞానము అంత శ్రేష్ఠమని నేను కనుగొంటిని'",
      "Ecclesiastes 2:13",
      "Then I saw that wisdom excels folly as light excels darkness",
      "చీకటికంటె వెలుగు ఎంత శ్రేష్ఠమో మూఢత్వముకంటె జ్ఞానము అంత శ్రేష్ఠమని నేను కనుగొంటిని",
      "Even under the limitations of fallen mortal life, wisdom retains an absolute, undeniable superiority over mindless folly.",
      "అంధకారముకంటె వెలుగు ఎంత గొప్పదో, అవివేకపు మూర్ఖత్వముకంటె దైవిక జ్ఞానము అంత శ్రేష్ఠమైనది."
    ],
    [
      "Ecclesiastes 2:26 God giving wisdom, knowledge, and joy to the good: 'For God gives wisdom and knowledge and joy to a man who is good in His sight'",
      "ప్రసంగి 2:26 దేవుని దృష్టికి అనుకూలుడైనవానికి జ్ఞానము మరియు ఆనందము: 'తన దృష్టికి అనుకూలుడైనవానికి దేవుడు జ్ఞానమును తెలివిని ఆనందమును ఇచ్చును'",
      "Ecclesiastes 2:26",
      "For God gives wisdom and knowledge and joy to a man who is good in His sight",
      "తన దృష్టికి అనుకూలుడైనవానికి దేవుడు జ్ఞానమును తెలివిని ఆనందమును ఇచ్చును",
      "Sinners gather and heap up possessions only to forfeit them; the righteous receive the tri-fold gift of wisdom, knowledge, and genuine joy.",
      "దేవుని చిత్తప్రకారము జీవించువానికి ప్రభువు జ్ఞానమును, వివేచనను మరియు అంతరంగ పరలోక ఆనందమును అనుగ్రహించును."
    ],
    [
      "Ecclesiastes 8:1 a man's wisdom making his face shine: 'Who is like a wise man? And who knows the interpretation of a thing? A man's wisdom makes his face shine, and the hardness of his face is changed'",
      "ప్రసంగి 8:1 జ్ఞానము మనుష్యుని ముఖమును ప్రకాశింపజేయుట: 'జ్ఞానముగలవానివంటివాడెవడు? సంగతియొక్క అర్థము తెలిసినవాడెవడు? మనుష్యుని జ్ఞానము అతని ముఖమును ప్రకాశింపజేయును, అతని ముఖకాఠిన్యము మార్చబడును'",
      "Ecclesiastes 8:1",
      "A man's wisdom makes his face shine, and the hardness of his face is changed",
      "మనుష్యుని జ్ఞానము అతని ముఖమును ప్రకాశింపజేయును, అతని ముఖకాఠిన్యము మార్చబడును",
      "Spiritual illumination softens stern countenances, radiating a serene, gracious countenance that commands instinctive respect.",
      "దైవిక జ్ఞానము హృదయమును మార్చి ముఖకాఠిన్యమును తీసివేసి ముఖమునందు దైవిక కాంతిని వెలిగించును."
    ],
    [
      "Ecclesiastes 10:10 sharpening the ax bringing success through wisdom: 'If the ax is dull, and one does not sharpen the edge, then he must use more strength; but wisdom brings success'",
      "ప్రసంగి 10:10 గొడ్డలిని నూరుట జ్ఞానము తెచ్చు జయము: 'ఇనుపగొడ్డలి మొద్దుగా ఉన్నప్పుడు దాని పదను నూరనియెడల అతడు మరి ఎక్కువ బలము ప్రయోగించవలెను; అయితే సమకూర్చుటకు జ్ఞానము శ్రేష్ఠమైనది'",
      "Ecclesiastes 10:10",
      "If the ax is dull, and one does not sharpen the edge, then he must use more strength; but wisdom brings success",
      "ఇనుపగొడ్డలి మొద్దుగా ఉన్నప్పుడు దాని పదను నూరనియెడల అతడు మరి ఎక్కువ బలము ప్రయోగించవలెను; అయితే సమకూర్చుటకు జ్ఞానము శ్రేష్ఠమైనది",
      "Do not merely work harder with blunt tools; take time to cultivate spiritual wisdom, skill, and insight to achieve effortless success.",
      "మొద్దు గొడ్డలితో వ్యర్థముగా శ్రమపడుటకంటె జ్ఞానముతో ప్రణాళికను సిద్ధపరచుకొని విజయమును సాధించుట శ్రేష్ఠము."
    ],
    [
      "Ecclesiastes 10:12 the words of a wise man's mouth being gracious: 'The words of a wise man's mouth are gracious, but the lips of a fool shall swallow him up'",
      "ప్రసంగి 10:12 జ్ఞాని నోటి మాటలు దయాభరితముగా ఉండుట: 'జ్ఞాని నోటి మాటలు దయగలవి, బుద్ధిహీనుని పెదవులు వానినే మింగివేయును'",
      "Ecclesiastes 10:12",
      "The words of a wise man's mouth are gracious, but the lips of a fool shall swallow him up",
      "జ్ఞాని నోటి మాటలు దయగలవి, బుద్ధిహీనుని పెదవులు వానినే మింగివేయును",
      "Wisdom speaks with soothing grace, building up hearers; fools utter rash, destructive words that inevitably trigger their own doom.",
      "జ్ఞానవంతుని సంభాషణ ఇతరులకు దయను ఆశీర్వాదమును అందించును; మూర్ఖుని నాలుక వాని స్వంత నాశనమునకు కారణమగును."
    ],
    [
      "Ecclesiastes 12:11 the words of the wise like goads and well-driven nails: 'The words of the wise are like goads, and the words of scholars are like well-driven nails, given by one Shepherd'",
      "ప్రసంగి 12:11 మునికోలలవంటి జ్ఞానుల మాటలు: 'జ్ఞానుల మాటలు మునికోలలవలె ఉన్నవి, సభాధిపతుల వచనములు బాగుగా నాటబడిన మేకులవలె ఉన్నవి; అవి ఒక్క కాపరివలన అనుగ్రహింపబడెను'",
      "Ecclesiastes 12:11",
      "The words of the wise are like goads, and the words of scholars are like well-driven nails, given by one Shepherd",
      "జ్ఞానుల మాటలు మునికోలలవలె ఉన్నవి, సభాధిపతుల వచనములు బాగుగా నాటబడిన మేకులవలె ఉన్నవి; అవి ఒక్క కాపరివలన అనుగ్రహింపబడెను",
      "Inspired proverbs goad sleepy consciences into action and firmly fasten truth into the soul, proceeding from the One Chief Shepherd.",
      "దేవుని సేవకుల జ్ఞానవాక్యములు ఆత్మను మేల్కొలిపే మునికోలలవలెను, హృదయములో దృఢముగా నాటబడిన మేకులవలెను ఉండును."
    ],
    [
      "Isaiah 11:2 the Spirit of wisdom and understanding resting on the Branch: 'The Spirit of the Lord shall rest upon Him, the Spirit of wisdom and understanding, the Spirit of counsel and might'",
      "యెషయా 11:2 మెస్సీయమీద నిలిచే జ్ఞానవివేకముల ఆత్మ: 'యెహోవా ఆత్మ, జ్ఞానవివేకములకు మూలమగు ఆత్మ, ఆలోచన బలములకు మూలమగు ఆత్మ ఆయనమీద నిలుచును'",
      "Isaiah 11:2",
      "The Spirit of the Lord shall rest upon Him, the Spirit of wisdom and understanding, the Spirit of counsel and might",
      "యెహోవా ఆత్మ, జ్ఞానవివేకములకు మూలమగు ఆత్మ, ఆలోచన బలములకు మూలమగు ఆత్మ ఆయనమీద నిలుచును",
      "The sevenfold Holy Spirit rests permanently upon King Jesus, anointing Him with supreme governmental and redemptive wisdom.",
      "క్రీస్తుపై పరిశుద్ధాత్మ దేవుడు సంపూర్ణముగా నిలిచి ఆయనను నిత్య జ్ఞానవివేచనలతో మరియు పరమ బలముతో అభిషేకించెను."
    ],
    [
      "Isaiah 33:6 wisdom and knowledge being the stability of your times: 'Wisdom and knowledge will be the stability of your times, and the strength of salvation; the fear of the Lord is His treasure'",
      "యెషయా 33:6 నీ కాలములకు జ్ఞానము స్థిరత్వమునిచ్చుట: 'నీ కాలములకు జ్ఞానమును తెలివియు స్థిరత్వమును రక్షణబాహుళ్యమును కలుగజేయును; యెహోవాయందలి భయభక్తులు ఆయనకిష్టమైన ధనము'",
      "Isaiah 33:6",
      "Wisdom and knowledge will be the stability of your times, and the strength of salvation; the fear of the Lord is His treasure",
      "నీ కాలములకు జ్ఞానమును తెలివియు స్థిరత్వమును రక్షణబాహుళ్యమును కలుగజేయును; యెహోవాయందలి భయభక్తులు ఆయనకిష్టమైన ధనము",
      "When political regimes collapse and societal storms rage, biblical wisdom in the fear of God anchors the soul in unshakable stability.",
      "ఎటువంటి సంక్షోభ కాలములలోనైనా దైవిక జ్ఞానము మరియు యెహోవాయందలి భయభక్తులే విశ్వాసికి కొండవంటి స్థిరత్వము."
    ],
    [
      "Jeremiah 9:23-24 not glorying in wisdom but understanding and knowing God: 'Let not the wise man glory in his wisdom... but let him who glories glory in this, that he understands and knows Me'",
      "యిర్మీయా 9:23-24 జ్ఞానమునుబట్టి అతిశయింపక దేవుని ఎరిగియుండుట: 'జ్ఞాని తన జ్ఞానమునుబట్టి అతిశయింపకూడదు... అతిశయించువాడు దేనినిబట్టి అతిశయింపవలెననగా, భూమిమీద కృపను న్యాయమును నీతిని జరిగించుచున్న యెహోవాను నేనే అని గ్రహించి నన్ను పరిశీలనగా తెలిసికొనుటనుబట్టియే అతిశయింపవలెను'",
      "Jeremiah 9:23-24",
      "Let not the wise man glory in his wisdom... but let him who glories glory in this, that he understands and knows Me",
      "జ్ఞాని తన జ్ఞానమునుబట్టి అతిశయింపకూడదు... భూమిమీద కృపను న్యాయమును నీతిని జరిగించు యెహోవాను నేనే అని గ్రహించి నన్ను తెలిసికొనుటనుబట్టియే అతిశయింపవలెను",
      "All human academic, military, and financial boasting is forbidden; our only true boast is knowing the covenant heart of Yahweh.",
      "మానవ మేధాశక్తినిబట్టి కాక భూమిపై కృపానీతులను జరిగించు సర్వాధికారియైన దేవుని వ్యక్తిగతముగా ఎరిగియుండుటయే నిజమైన ఘనత."
    ],
    [
      "Matthew 13:54 astonishment at Christ's wisdom and mighty works: 'Where did this Man get this wisdom and these mighty works?'",
      "మత్తయి 13:54 క్రీస్తు జ్ఞానమును చూచి ఆశ్చర్యపడుట: 'ఈ మనుష్యునికి ఈ జ్ఞానమును ఈ అద్భుతములును ఎక్కడినుండి వచ్చెను?'",
      "Matthew 13:54",
      "Where did this Man get this wisdom and these mighty works?",
      "ఈ మనుష్యునికి ఈ జ్ఞానమును ఈ అద్భుతములును ఎక్కడినుండి వచ్చెను?",
      "Nazareth's neighbors were paralyzed with astonishment at Jesus' unrivaled teaching, unable to fathom that the Carpenter was Wisdom incarnate.",
      "యేసు బోధించిన అసమాన జ్ఞానవాక్కులను మరియు అద్భుత కార్యములను చూచి స్వదేశపు ప్రజలు విస్మయమొందిరి."
    ],
    [
      "1 Corinthians 2:13 teaching spiritual things with words taught by the Holy Spirit: 'These things we also speak, not in words which man's wisdom teaches but which the Holy Spirit teaches'",
      "1 కొరింథీయులకు 2:13 పరిశుద్ధాత్మ నేర్పు మాటలతో జ్ఞానబోధ చేయుట: 'మనుష్యజ్ఞానము నేర్పు మాటలతో కాక ఆత్మ నేర్పు మాటలతో ఆత్మసంబంధమైన సంగతులను ఆత్మసంబంధమైన సంగతులతో సరిచూచుచు బోధించుచున్నాము'",
      "1 Corinthians 2:13",
      "Not in words which man's wisdom teaches but which the Holy Spirit teaches, comparing spiritual things with spiritual",
      "మనుష్యజ్ఞానము నేర్పు మాటలతో కాక ఆత్మ నేర్పు మాటలతో ఆత్మసంబంధమైన సంగతులను సరిచూచుచు బోధించుచున్నాము",
      "Apostolic doctrine is verbally inspired: the Spirit of God provides both the divine thoughts and the precise words to express them.",
      "పరిశుద్ధాత్మ దేవుడే లేఖనములద్వారా సత్యమును బోధించి ఆత్మసంబంధమైన విషయములను వివేచించు పరమ జ్ఞానమునిచ్చును."
    ],
    [
      "1 Corinthians 3:20 the Lord knowing the thoughts of the wise are futile: 'The Lord knows the thoughts of the wise, that they are futile'",
      "1 కొరింథీయులకు 3:20 జ్ఞానుల ఆలోచనలు వ్యర్థములని దేవుడు ఎరుగుట: 'జ్ఞానుల ఆలోచనలు వ్యర్థములని ప్రభువునకు తెలియును అని వ్రాయబడియున్నది'",
      "1 Corinthians 3:20",
      "The Lord knows the thoughts of the wise, that they are futile",
      "జ్ఞానుల ఆలోచనలు వ్యర్థములని ప్రభువునకు తెలియును",
      "The greatest secular think-tanks and philosophical systems are cataloged by God as empty vapor without eternal substance.",
      "దైవభక్తిలేని లౌకిక జ్ఞానుల ఆలోచనలన్నియు నిరర్థకమైనవని సర్వజ్ఞానియైన ప్రభువునకు స్పష్టముగా తెలియును."
    ],
    [
      "1 Corinthians 4:10 fools for Christ's sake versus wise in Christ: 'We are fools for Christ's sake, but you are wise in Christ! We are weak, but you are strong!'",
      "1 కొరింథీయులకు 4:10 క్రీస్తు నిమిత్తము వెర్రివారమగుట: 'మేము క్రీస్తునిమిత్తము వెర్రివారము, మీరు క్రీస్తునందు బుద్ధిమంతులు! మేము బలహీనులము, మీరు బలవంతులు!'",
      "1 Corinthians 4:10",
      "We are fools for Christ's sake, but you are wise in Christ! We are weak, but you are strong!",
      "మేము క్రీస్తునిమిత్తము వెర్రివారము, మీరు క్రీస్తునందు బుద్ధిమంతులు! మేము బలహీనులము, మీరు బలవంతులు!",
      "Paul's loving irony exposes the Corinthian church's carnal pride, urging them to embrace the cross's reproach over social status.",
      "లోకము తృణీకరించినను క్రీస్తు సిలువకొరకు త్యాగము చేయుచు సువార్త నిమిత్తము వెర్రివారిగా ఉండడమే నిజమైన పరలోక ఘనత."
    ],
    [
      "Colossians 2:8 beware of philosophy and empty deceit: 'Beware lest anyone cheat you through philosophy and empty deceit, according to the tradition of men... and not according to Christ'",
      "కొలొస్సయులకు 2:8 తత్వజ్ఞానమువలన మోసపోకుండునట్లు జాగ్రత్తపడుట: 'ఎవడైనను తత్వజ్ఞానముచేతను నిరర్థకమైన మోసముచేతను మిమ్మును చెరపట్టుకొని పోవునేమో అని జాగ్రత్తగా ఉండుడి; అది క్రీస్తును అనుసరింపక మనుష్యుల పారంపర్యాచారమును అనుసరించునది'",
      "Colossians 2:8",
      "Beware lest anyone cheat you through philosophy and empty deceit, according to the tradition of men, according to the basic principles of the world, and not according to Christ",
      "ఎవడైనను తత్వజ్ఞానముచేతను నిరర్థకమైన మోసముచేతను మిమ్మును చెరపట్టుకొని పోవునేమో అని జాగ్రత్తగా ఉండుడి; అది క్రీస్తును అనుసరింపక మనుష్యుల పారంపర్యాచారమును అనుసరించునది",
      "Believers must be on high guard against secular syncretism; hollow human philosophies hijack the mind away from Christ's supremacy.",
      "క్రీస్తు సువార్తను కాక మానవ పారంపర్యాచారములను లౌకిక తత్వములను వెంబడించి మోసపోకూడదని పౌలు హెచ్చరించుచున్నాడు."
    ],
    [
      "Colossians 2:23 self-imposed religion having an appearance of wisdom but no value: 'These things indeed have an appearance of wisdom in self-imposed religion, false humility, and neglect of the body, but are of no value against the indulgence of the flesh'",
      "కొలొస్సయులకు 2:23 స్వచ్ఛందారాధన జ్ఞానమను రూపము కలిగియున్నను నిష్ప్రయోజనమగుట: 'అట్టివి స్వచ్ఛందారాధన విషయములోను వినయము విషయములోను దేహశిక్ష విషయములోను జ్ఞానమను రూపము మాత్రము కలిగినవై, శరీరేచ్ఛలను నిరోధించుటలో ఏమాత్రమును ప్రయోజనకరమైనవి కావు'",
      "Colossians 2:23",
      "These things indeed have an appearance of wisdom in self-imposed religion, false humility, and neglect of the body, but are of no value against the indulgence of the flesh",
      "అట్టివి స్వచ్ఛందారాధన విషయములోను వినయము విషయములోను జ్ఞానమను రూపము మాత్రము కలిగినవై, శరీరేచ్ఛలను నిరోధించుటలో ఏమాత్రమును ప్రయోజనకరమైనవి కావు",
      "Man-made ascetic rules look pious externally, but lack the supernatural power to conquer carnal lusts; only union with Christ can sanctify.",
      "బాహ్య దేహశిక్షలు జ్ఞానమువలె కనిపించినను అంతరంగ పాపపు కోరికలను అణచివేయుటలో అవి కేవలము నిష్ప్రయోజనము."
    ],
    [
      "James 3:14 bitter envy and self-seeking lying against the truth: 'But if you have bitter envy and self-seeking in your hearts, do not boast and lie against the truth'",
      "యాకోబు 3:14 అసూయ స్వార్థములు సత్యమునకు విరోధముగా అబద్ధమాడుట: 'మీ హృదయములలో కఠినమైన అసూయను స్వార్థమును ఉంచుకొనినవారైతే అతిశయింపవద్దు, సత్యమునకు విరోధముగా అబద్ధమాడవద్దు'",
      "James 3:14",
      "If you have bitter envy and self-seeking in your hearts, do not boast and lie against the truth",
      "మీ హృదయములలో కఠినమైన అసూయను స్వార్థమును ఉంచుకొనినవారైతే అతిశయింపవద్దు, సత్యమునకు విరోధముగా అబద్ధమాడవద్దు",
      "Partisan toxicity and jealousy inside ministries contradict the gospel of grace; true wisdom promotes fraternal unity, not cutthroat rivalries.",
      "అసూయ మరియు స్వార్థపు కుట్రలు ఉన్నచోట దైవిక జ్ఞానము ఉండదు; అట్టి నైజము క్రీస్తు సత్యమునకు విరోధముగా నిలుచును."
    ],
    [
      "James 3:18 the fruit of righteousness sown in peace by peacemakers: 'Now the fruit of righteousness is sown in peace by those who make peace'",
      "యాకోబు 3:18 సమాధానము చేయువారికి నీతిఫలము విత్తబడుట: 'సమాధానపరచువారు సమాధానమందు విత్తుచు నీతిఫలమును కోయుదురు'",
      "James 3:18",
      "Now the fruit of righteousness is sown in peace by those who make peace",
      "సమాధానపరచువారు సమాధానమందు విత్తుచు నీతిఫలమును కోయుదురు",
      "God's wisdom cultivates a peaceful atmosphere where holy righteousness can germinate, bloom, and produce an abundant spiritual harvest.",
      "సమాధానకరమైన మనస్సుతో దేవుని జ్ఞానములో జీవించు విశ్వాసి నిత్య నీతిఫలములను తన జీవితములో సమృద్ధిగా పొందును."
    ],
    [
      "Revelation 5:12 the Lamb worthy to receive wisdom and power: 'Worthy is the Lamb who was slain to receive power and riches and wisdom, and strength and honor and glory and blessing!'",
      "ప్రకటన 5:12 జ్ఞానమును ప్రభావమును పొందుటకు గొర్రెపిల్ల యోగ్యుడై యుండుట: 'వధింపబడిన గొఱ్ఱెపిల్ల శక్తియు ఐశ్వర్యమును జ్ఞానమును బలమును ఘనతయు మహిమయు స్తోత్రమును పొందను అర్హుడు'",
      "Revelation 5:12",
      "Worthy is the Lamb who was slain to receive power and riches and wisdom, and strength and honor and glory and blessing!",
      "వధింపబడిన గొఱ్ఱెపిల్ల శక్తియు ఐశ్వర్యమును జ్ఞానమును బలమును ఘనతయు మహిమయు స్తోత్రమును పొందను అర్హుడు",
      "Universal celestial doxology: the crucified and resurrected Lamb is eternally crowned with supreme cosmic wisdom and omnipotence.",
      "సిలువలో వధింపబడి లేచిన యేసుక్రీస్తే పరలోకమందు సర్వ జ్ఞానమును బలమును నిత్య మహిమను పొందుటకు ఏకైక యోగ్యుడు."
    ],
    [
      "Revelation 7:12 blessing, glory, and wisdom to our God forever: 'Amen! Blessing and glory and wisdom, thanksgiving and honor and power and might, be to our God forever and ever. Amen'",
      "ప్రకటన 7:12 దేవునికి యుగయుగములు జ్ఞానము మరియు స్తోత్రము: 'ఆమేన్! యుగయుగములు మన దేవునికి స్తోత్రమును మహిమయు జ్ఞానమును కృతజ్ఞతాస్తుతియు ఘనతయు శక్తియు బలమును కలుగును గాక. ఆమేన్'",
      "Revelation 7:12",
      "Amen! Blessing and glory and wisdom, thanksgiving and honor and power and might, be to our God forever and ever. Amen",
      "ఆమేన్! యుగయుగములు మన దేవునికి స్తోత్రమును మహిమయు జ్ఞానమును కృతజ్ఞతాస్తుతియు ఘనతయు శక్తియు బలమును కలుగును గాక. ఆమేన్",
      "The consummate anthem of the redeemed host: attributing all wisdom, dominion, and adoration to the Triune God for all eternity.",
      "సర్వ పరిశుద్ధులు మరియు దూతలు సాగిలపడి దేవునికే యుగయుగములు జ్ఞానమును, స్తోత్రమును, సర్వాధికారమును ఆరోపించు పరమ స్తుతి."
    ],
    [
      "1 Corinthians 2:16 possessing the mind of Christ: 'For who has known the mind of the Lord that he may instruct Him? But we have the mind of Christ'",
      "1 కొరింథీయులకు 2:16 క్రీస్తు మనస్సును కలిగియుండుట: 'ప్రభువు మనస్సును ఎరిగి ఆయనకు బోధింపగలవాడెవడు? మనమైతే క్రీస్తు మనస్సు కలిగినవారము'",
      "1 Corinthians 2:16",
      "For who has known the mind of the Lord that he may instruct Him? But we have the mind of Christ",
      "ప్రభువు మనస్సును ఎరిగి ఆయనకు బోధింపగలవాడెవడు? మనమైతే క్రీస్తు మనస్సు కలిగినవారము",
      "Regenerate believers possess the Holy Spirit, granting them access to the very thoughts, priorities, and wisdom of Christ.",
      "పరిశుద్ధాత్మ ద్వారా విశ్వాసులు క్రీస్తుయొక్క పరలోక మనస్సును మరియు ఆలోచనలను కలిగియున్నారు."
    ]
  ];

  return data.map(item => ({
    easyQ: `What profound biblical doctrine of divine wisdom or cosmic praise is revealed in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన అగాధమైన దైవజ్ఞాన సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does God's sovereign wisdom orchestrate the universe and judge the futile thoughts of fallen men?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం దేవుని సర్వోన్నత జ్ఞానము సమస్త సృష్టిని ఎలా నడిపించి లౌకిక మూర్ఖత్వమును ఎలా తీర్పుతీర్చును?`,
    hardQ: `What theological reality does ${item[2]} establish regarding cosmic reconciliation, Christ as the incarnation of wisdom, and the doxology of heaven?`,
    hardQTe: `${item[2]} ప్రకారం క్రీస్తే దైవిక జ్ఞానపు పరిపూర్ణ స్వరూపమను నిత్య పరలోక సత్యమును గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty high watchtowers on the plain of Jezreel", "He commanded seventy days of sackcloth at the stream of Arnon", "He cast thirty copper sickles into the river Kishon"],
    optionsTelugu: [item[4], "యెజ్రెయేలు మైదానములో నలభై ఎత్తైన కావలి గోపురములను కట్టించెను", "అర్నోను వాగుయొద్ద డెబ్బై దినముల గోనెపట్ట ధారణను ఆజ్ఞాపించెను", "కీషోను నదిలో ముప్పై రాగి కొడవళ్ళను పడవేసెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

const wisdomFoundation = buildWisdomFoundation();
const wisdomGrowth = buildWisdomGrowth();
const wisdomMastery = buildWisdomMastery();

console.log('Wisdom Foundation facts count:', wisdomFoundation.length);
console.log('Wisdom Growth facts count:', wisdomGrowth.length);
console.log('Wisdom Mastery facts count:', wisdomMastery.length);

buildBank('Wisdom', 'wis', wisdomFoundation, wisdomGrowth, wisdomMastery, 'WisdomQuestionBank.ts');
