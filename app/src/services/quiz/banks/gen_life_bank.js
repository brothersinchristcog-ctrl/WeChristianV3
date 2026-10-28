const { buildBank } = require('./bank_builder.js');

// 50 Foundation Facts for Life (Creation, Breath of Life, Proverbs wisdom of life, Christ the Life)
function buildLifeFoundation() {
  const data = [
    [
      "Genesis 2:7 the divine inbreathing of the breath of life: 'And the Lord God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living being'",
      "ఆదికాండము 2:7 దేవుడు నరుని నాసికారంధ్రములలో జీవవాయువును ఊదుట: 'దేవుడైన యెహోవా నేలమంటితో నరుని నిర్మించి వాని నాసికారంధ్రములలో జీవవాయువును ఊదగా నరుడు జీవాత్మ ఆయెను'",
      "Genesis 2:7",
      "And the Lord God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living being",
      "దేవుడైన యెహోవా నేలమంటితో నరుని నిర్మించి వాని నాసికారంధ్రములలో జీవవాయువును ఊదగా నరుడు జీవాత్మ ఆయెను",
      "Human life is not a chemical accident; it is the sacred breath of the Almighty infused directly into clay.",
      "మానవ జీవము దైవిక సృష్టి; దేవుని జీవవాయువు మానవునిలో ప్రవేశించినప్పుడే అతడు జీవాత్మ ఆయెను."
    ],
    [
      "Deuteronomy 30:19 the great covenant choice between life and death: 'I call heaven and earth as witnesses today against you, that I have set before you life and death, blessing and cursing; therefore choose life'",
      "ద్వితీయోపదేశకాండము 30:19 జీవమరణములమధ్య నిర్ణయము: 'నేను జీవమును మరణమును, ఆశీర్వాదమును శాపమును నీ యెదుట ఉంచియున్నాను; కాబట్టి నీవును నీ సంతానమును బ్రదుకుచుండునట్లు జీవమును కోరుకొనుడి'",
      "Deuteronomy 30:19",
      "I have set before you life and death, blessing and cursing; therefore choose life, that both you and your descendants may live",
      "నేను జీవమును మరణమును ఆశీర్వాదమును శాపమును నీ యెదుట ఉంచియున్నాను; కాబట్టి నీవును నీ సంతానమును బ్రదుకుచుండునట్లు జీవమును కోరుకొనుడి",
      "God respects human agency by placing destiny before us, pleading with paternal love that we choose life through obedience.",
      "దేవుడు మనము ఆశీర్వదింపబడి వర్ధిల్లునట్లు జీవమును ఎన్నుకొనవలెనని ప్రేమతో హెచ్చరించుచున్నాడు."
    ],
    [
      "Deuteronomy 8:3 man living by the word of God: 'Man shall not live by bread alone; but man lives by every word that proceeds from the mouth of the Lord'",
      "ద్వితీయోపదేశకాండము 8:3 దేవుని వాక్యమువలన జీవించుట: 'మనుష్యుడు రొట్టెవలన మాత్రమే కాదు గాని యెహోవా నోటనుండి వచ్చు ప్రతి మాటవలన జీవించును'",
      "Deuteronomy 8:3",
      "Man shall not live by bread alone; but man lives by every word that proceeds from the mouth of the Lord",
      "మనుష్యుడు రొట్టెవలన మాత్రమే కాదు గాని యెహోవా నోటనుండి వచ్చు ప్రతి మాటవలన జీవించును",
      "Physical calories sustain temporary tissue, but the eternal spoken word of God sustains immortal spiritual vitality.",
      "శరీరమునకు భౌతిక ఆహారము ఎంత అవసరమో ఆత్మకు దేవుని వాక్యమంత ప్రాణాధారము."
    ],
    [
      "Psalm 16:11 the path of life in God's presence: 'You will show me the path of life; in Your presence is fullness of joy; at Your right hand are pleasures forevermore'",
      "కీర్తన 16:11 జీవమార్గము మరియు నిత్య సంతోషము: 'జీవమార్గమును నీవు నాకు తెలియజేసెదవు; నీ సన్నిధిని సంపూర్ణ సంతోషము కలదు, నీ కుడిచేతిలో నిత్యము సుఖములు కలవు'",
      "Psalm 16:11",
      "You will show me the path of life; in Your presence is fullness of joy; at Your right hand are pleasures forevermore",
      "జీవమార్గమును నీవు నాకు తెలియజేసెదవు; నీ సన్నిధిని సంపూర్ణ సంతోషము కలదు, నీ కుడిచేతిలో నిత్యము సుఖములు కలవు",
      "True life is geographical proximity to God; unending delight and perpetual vitality reside at His right hand.",
      "దేవుని సన్నిధిలో మాత్రమే సంపూర్ణ ఆనందము మరియు నిత్య జీవపు మాధుర్యము లభించును."
    ],
    [
      "Psalm 27:1 the Lord as the stronghold of life: 'The Lord is my light and my salvation; whom shall I fear? The Lord is the strength of my life; of whom shall I be afraid?'",
      "కీర్తన 27:1 యెహోవాయే ప్రాణదుర్గము: 'యెహోవా నాకు వెలుగును రక్షణయునై యున్నాడు, నేను ఎవరికి భయపడుదును? యెహోవా నా ప్రాణదుర్గము, నేను ఎవరికి వెరతును?'",
      "Psalm 27:1",
      "The Lord is my light and my salvation; whom shall I fear? The Lord is the strength of my life; of whom shall I be afraid?",
      "యెహోవా నాకు వెలుగును రక్షణయునై యున్నాడు, నేను ఎవరికి భయపడుదును? యెహోవా నా ప్రాణదుర్గము, నేను ఎవరికి వెరతును?",
      "When Yahweh is the impenetrable citadel guarding our life, terror loses all jurisdiction over our days.",
      "దేవుడే ప్రాణమునకు రక్షక దుర్గముగా ఉన్నప్పుడు ఏ భయమును మానవుని జయించలేదు."
    ],
    [
      "Psalm 36:9 the fountain of life: 'For with You is the fountain of life; in Your light we see light'",
      "కీర్తన 36:9 జీవపు ఊట: 'నీయొద్ద జీవపు ఊట కలదు; నీ వెలుగును చూచుచునే మేము వెలుగు చూచుచున్నాము'",
      "Psalm 36:9",
      "For with You is the fountain of life; in Your light we see light",
      "నీయొద్ద జీవపు ఊట కలదు; నీ వెలుగును చూచుచునే మేము వెలుగు చూచుచున్నాము",
      "God is the unoriginated spring from which all consciousness, heartbeat, and eternal salvation flow perpetually.",
      "సమస్త సృష్టికి జీవపు ఊట దేవుడే; ఆయన వెలుగులోనే మనము నిజమైన సత్యమును గ్రహింపగలము."
    ],
    [
      "Proverbs 3:1-2 the commandment adding length of life: 'My son, do not forget my law... for length of days and long life and peace they will add to you'",
      "సామెతలు 3:1-2 దీర్ఘాయువునిచ్చు దైవిక ఉపదేశము: 'నా కుమారుడా, నా ఉపదేశమును మరువకుము... అవి దీర్ఘాయువును సంపూర్ణ జీవమును సమాధానమును నీకు కలుగజేయును'",
      "Proverbs 3:1-2",
      "For length of days and long life and peace they will add to you",
      "అవి దీర్ఘాయువును సంపూర్ణ జీవమును సమాధానమును నీకు కలుగజేయును",
      "Biblical wisdom preserves the nervous system, averts reckless folly, and multiplies quality years filled with divine peace.",
      "దేవుని ఆజ్ఞలను గైకొనుటవలన దీర్ఘాయువు మరియు సమాధానభరితమైన జీవనము ప్రాప్తించును."
    ],
    [
      "Proverbs 4:23 the heart as the wellspring of life: 'Keep your heart with all diligence, for out of it spring the issues of life'",
      "సామెతలు 4:23 హృదయపు జీవధారలు: 'నీ హృదయములోనుండి జీవధారలు బయలుదేరును గనుక అన్నిటికంటె ముఖ్యముగా నీ హృదయమును భద్రముగా కాపాడుకొనుము'",
      "Proverbs 4:23",
      "Keep your heart with all diligence, for out of it spring the issues of life",
      "నీ హృదయములోనుండి జీవధారలు బయలుదేరును గనుక అన్నిటికంటె ముఖ్యముగా నీ హృదయమును భద్రముగా కాపాడుకొనుము",
      "The internal reservoir of desires, motives, and convictions dictates the entire trajectory of earthly and eternal existence.",
      "హృదయమే సమస్త జీవన ప్రవర్తనకు మూలము గనుక దానిని దేవుని వాక్యముతో నిరంతరము భద్రపరచుకొనవలెను."
    ],
    [
      "Proverbs 8:35 finding wisdom is finding life: 'For whoever finds me finds life, and obtains favor from the Lord'",
      "సామెతలు 8:35 జ్ఞానమును పొందుట జీవమును పొందుటే: 'నన్ను కనుగొనువాడు జీవమును కనుగొనును, యెహోవావలన దయ పొందును'",
      "Proverbs 8:35",
      "For whoever finds me finds life, and obtains favor from the Lord",
      "నన్ను కనుగొనువాడు జీవమును కనుగొనును, యెహోవావలన దయ పొందును",
      "To discover divine wisdom is to unlock authentic vitality and walk wrapped in the gracious smile of the Creator.",
      "దైవిక జ్ఞానమును సంపాదించుకొనువాడు జీవమును మరియు దేవుని అనుగ్రహమును పొందును."
    ],
    [
      "Proverbs 10:11 the mouth of the righteous as a well of life: 'The mouth of the righteous is a well of life, but violence covers the mouth of the wicked'",
      "సామెతలు 10:11 నీతిమంతుని నోరు జీవపు ఊట: 'నీతిమంతుని నోరు జీవపు ఊట, భక్తిహీనుల నోరు బలాత్కారమును దాచిపెట్టును'",
      "Proverbs 10:11",
      "The mouth of the righteous is a well of life, but violence covers the mouth of the wicked",
      "నీతిమంతుని నోరు జీవపు ఊట, భక్తిహీనుల నోరు బలాత్కారమును దాచిపెట్టును",
      "Edifying, truthful speech refreshes weary souls like cool water pumped from a subterranean spring of holiness.",
      "నీతిమంతుని పవిత్ర సంభాషణ ఇతరులకు ఆత్మీయ జీవమును మరియు ఆదరణను అందించు అమృతధార."
    ],
    [
      "Proverbs 11:30 the fruit of the righteous as a tree of life: 'The fruit of the righteous is a tree of life, and he who wins souls is wise'",
      "సామెతలు 11:30 నీతిమంతుని ఫలము జీవవృక్షము: 'నీతిమంతుని ఫలము జీవవృక్షము, ఆత్మలను రక్షించువాడు జ్ఞానముగలవాడు'",
      "Proverbs 11:30",
      "The fruit of the righteous is a tree of life, and he who wins souls is wise",
      "నీతిమంతుని ఫలము జీవవృక్షము, ఆత్మలను రక్షించువాడు జ్ఞానముగలవాడు",
      "A sanctified life produces life-nourishing fruits that draw dying souls toward eternal salvation.",
      "నీతిమంతుని జీవితము జీవవృక్షమువలె ఇతరులకు రక్షణ ఫలములను ప్రసాదించి ఆత్మలను క్రీస్తుతట్టు నడిపించును."
    ],
    [
      "Proverbs 12:28 righteousness leading to immortality: 'In the way of righteousness is life, and in its pathway there is no death'",
      "సామెతలు 12:28 నీతిమార్గమందు జీవముండుట: 'నీతిమార్గమందు జీవము కలదు, దాని త్రోవలో మరణమే లేదు'",
      "Proverbs 12:28",
      "In the way of righteousness is life, and in its pathway there is no death",
      "నీతిమార్గమందు జీవము కలదు, దాని త్రోవలో మరణమే లేదు",
      "The highway of holy obedience bypasses the realm of spiritual extinction and leads straight into everlasting glory.",
      "దేవుని నీతిమార్గములో నడుచువానికి మరణపు ముల్లు ఉండదు; అది నిత్య జీవమునకు నడిపించు రాజమార్గము."
    ],
    [
      "Proverbs 13:14 the law of the wise as a fountain of life: 'The law of the wise is a fountain of life, to turn one away from the snares of death'",
      "సామెతలు 13:14 జ్ఞానుల ఉపదేశము జీవపు ఊట: 'జ్ఞానుల ఉపదేశము జీవపు ఊట, అది మరణపాశములలోనుండి మనుష్యులను తప్పించును'",
      "Proverbs 13:14",
      "The law of the wise is a fountain of life, to turn one away from the snares of death",
      "జ్ఞానుల ఉపదేశము జీవపు ఊట, అది మరణపాశములలోనుండి మనుష్యులను తప్పించును",
      "Wise counsel alerts the traveler to hidden moral landmines, delivering them safely from fatal traps.",
      "దైవభక్తిగల పెద్దల జ్ఞానోపదేశము ప్రమాదకరమైన మరణ ఉచ్చుల నుండి ప్రాణమును రక్షించును."
    ],
    [
      "Proverbs 14:27 the fear of the Lord as a fountain of life: 'The fear of the Lord is a fountain of life, to turn one away from the snares of death'",
      "సామెతలు 14:27 యెహోవాయందలి భయభక్తులు జీవపు ఊట: 'యెహోవాయందు భయభక్తులు కలిగియుండుట జీవపు ఊట, అది మరణపాశములనుండి తప్పించును'",
      "Proverbs 14:27",
      "The fear of the Lord is a fountain of life, to turn one away from the snares of death",
      "యెహోవాయందు భయభక్తులు కలిగియుండుట జీవపు ఊట, అది మరణపాశములనుండి తప్పించును",
      "Reverential awe toward God purges deadly compromises and releases a bubbling geyser of spiritual vitality.",
      "యెహోవాయందు భయభక్తులు కలిగియుండుట సమస్త పాపపు ఉచ్చుల నుండి విడిపించే జీవధార."
    ],
    [
      "Proverbs 15:4 a wholesome tongue as a tree of life: 'A wholesome tongue is a tree of life, but perverseness in it breaks the spirit'",
      "సామెతలు 15:4 హితవు చెప్పు నాలుక జీవవృక్షము: 'హితవు చెప్పు నాలుక జీవవృక్షము, దానిలోని కుటిలత మనస్సును నలగగొట్టును'",
      "Proverbs 15:4",
      "A wholesome tongue is a tree of life, but perverseness in it breaks the spirit",
      "హితవు చెప్పు నాలుక జీవవృక్షము, దానిలోని కుటిలత మనస్సును నలగగొట్టును",
      "Healing words minister restoration and peace, whereas deceitful venom crushes the human spirit.",
      "ఆదరణకరమైన దైవిక మాటలు ఇతరుల హృదయములకు జీవవృక్షమువలె నిత్య స్వస్థతను చేకూర్చును."
    ],
    [
      "Proverbs 16:22 understanding as a wellspring of life: 'Understanding is a wellspring of life to him who has it. But the correction of fools is folly'",
      "సామెతలు 16:22 వివేకము జీవపు ఊట: 'వివేకముగలవానికి వాని వివేకము జీవపు ఊట, మూఢులకు వారి మూఢత్వమే శిక్ష'",
      "Proverbs 16:22",
      "Understanding is a wellspring of life to him who has it",
      "వివేకముగలవానికి వాని వివేకము జీవపు ఊట, మూఢులకు వారి మూఢత్వమే శిక్ష",
      "Spiritual insight into God's revealed will functions like an artesian well, continuously nourishing sound judgments.",
      "ఆత్మీయ వివేచన కలిగి జీవించువానికి అతని జ్ఞానమే అంతరంగ జీవజల ప్రవాహముగా ఉండును."
    ],
    [
      "Proverbs 18:21 death and life in the tongue: 'Death and life are in the power of the tongue, and those who love it will eat its fruit'",
      "సామెతలు 18:21 నాలుక వశమందు జీవమరణములుండుట: 'జీవమరణములు నాలుక వశము, దానియందు ప్రీతిపడువారు దాని ఫలము తిందురు'",
      "Proverbs 18:21",
      "Death and life are in the power of the tongue, and those who love it will eat its fruit",
      "జీవమరణములు నాలుక వశము, దానియందు ప్రీతిపడువారు దాని ఫలము తిందురు",
      "Words possess generative spiritual gravity; spoken blessings plant life while curses unleash ruin.",
      "నోటి మాటలకు అపారమైన శక్తి కలదు; దైవిక మాటలు జీవమును ఫలింపజేయగా దుష్ట మాటలు నాశనమును తెచ్చును."
    ],
    [
      "Proverbs 19:23 the fear of the Lord leading to satisfied life: 'The fear of the Lord leads to life, and he who has it will abide in satisfaction; he will not be visited with evil'",
      "సామెతలు 19:23 యెహోవాయందలి భయభక్తులు జీవసాధనము: 'యెహోవాయందలి భయభక్తులు జీవసాధనము, అవి కలిగినవాడు తృప్తుడై జీవించును, కీడు వానిని ముట్టదు'",
      "Proverbs 19:23",
      "The fear of the Lord leads to life, and he who has it will abide in satisfaction; he will not be visited with evil",
      "యెహోవాయందలి భయభక్తులు జీవసాధనము, అవి కలిగినవాడు తృప్తుడై జీవించును, కీడు వానిని ముట్టదు",
      "Holy reverence secures inner fulfillment, shielding the faithful believer from the devastating visits of evil.",
      "దైవభయముగల విశ్వాసి పరిపూర్ణ తృప్తితో సమాధానముగా జీవించును; ఏ దుష్టత్వము వానికి హాని చేయలేదు."
    ],
    [
      "Proverbs 21:21 pursuing righteousness and mercy finding life: 'He who follows righteousness and mercy finds life, righteousness, and honor'",
      "సామెతలు 21:21 నీతికనికరములను వెంటాడువాడు జీవమును పొందుట: 'నీతిని కనికరమును అనుసరించువాడు జీవమును నీతిని ఘనతను పొందును'",
      "Proverbs 21:21",
      "He who follows righteousness and mercy finds life, righteousness, and honor",
      "నీతిని కనికరమును అనుసరించువాడు జీవమును నీతిని ఘనతను పొందును",
      "God lavishly rewards the relentless pursuit of holiness and compassion with abundant life and divine honor.",
      "నీతిని మరియు కనికరమును వెంబడించు భక్తునికి దేవుడు నిత్య జీవమును మరియు శాశ్వత ఘనతను అనుగ్రహించును."
    ],
    [
      "Ecclesiastes 9:9 enjoying life with the wife of your youth: 'Live joyfully with the wife whom you love all the days of your vain life which He has given you under the sun'",
      "ప్రసంగి 9:9 ప్రియ భార్యతో సంతోషముగా జీవించుట: 'సూర్యుని క్రింద దేవుడు నీకనుగ్రహించిన వ్యర్థమైన ఆయుష్కాలమంతయు నీవు ప్రేమించు నీ భార్యతో సుఖించుము'",
      "Ecclesiastes 9:9",
      "Live joyfully with the wife whom you love all the days of your vain life which He has given you under the sun",
      "సూర్యుని క్రింద దేవుడు నీకనుగ్రహించిన వ్యర్థమైన ఆయుష్కాలమంతయు నీవు ప్రేమించు నీ భార్యతో సుఖించుము",
      "Covenant marital companionship is God's designated earthly balm to sweeten mortal labor under the sun.",
      "దేవుడిచ్చిన ఆయుష్కాలములో కుటుంబముతోను భార్యతోను ప్రేమసంతోషములతో జీవించుట దైవిక ఈవి."
    ],
    [
      "Isaiah 38:16 Hezekiah praising the life of his spirit: 'O Lord, by these things men live; and in all these things is the life of my spirit; so You will restore me and make me live'",
      "యెషయా 38:16 హిజ్కియా చేసిన స్తుతి: 'ప్రభువా, వీటివలన మనుష్యులు బ్రదుకుదురు, వీటివలననే నా ఆత్మ జీవించుచున్నది; నన్ను బాగుచేసి నన్ను బ్రదికింపుము'",
      "Isaiah 38:16",
      "O Lord, by these things men live; and in all these things is the life of my spirit; so You will restore me and make me live",
      "ప్రభువా, వీటివలన మనుష్యులు బ్రదుకుదురు, వీటివలననే నా ఆత్మ జీవించుచున్నది; నన్ను బాగుచేసి నన్ను బ్రదికింపుము",
      "Trials sanctified by divine grace revive the inner spirit and manifest the healing resuscitation of God.",
      "దేవుని వాక్యము మరియు స్వస్థతా హస్తము రోగగ్రస్తుడైన మానవుని ప్రాణమును మరల సజీవముగా నిలబెట్టును."
    ],
    [
      "Jeremiah 21:8 the two roads set before Jerusalem: 'Behold, I set before you the way of life and the way of death'",
      "యిర్మీయా 21:8 జీవమార్గము మరియు మరణమార్గము: 'ఇదిగో నేను మీ యెదుట జీవమార్గమును మరణమార్గమును ఉంచుచున్నాను'",
      "Jeremiah 21:8",
      "Behold, I set before you the way of life and the way of death",
      "ఇదిగో నేను మీ యెదుట జీవమార్గమును మరణమార్గమును ఉంచుచున్నాను",
      "God unambiguously outlines the stark alternative: submitting to divine sovereign decrees brings preservation and life.",
      "దేవుని చిత్తమునకు లోబడుటయే జీవమార్గము; తిరుగుబాటు చేయుట వినాశకర మరణమార్గము."
    ],
    [
      "Ezekiel 18:23 God taking no pleasure in the death of the wicked: 'Do I have any pleasure at all that the wicked should die? says the Lord God, and not that he should turn from his ways and live?'",
      "యెహెజ్కేలు 18:23 దుష్టుల మరణము దేవునికి ఇష్టము లేకుండుట: 'దుష్టుడు మరణించుటవలన నాకేమైన సంతోషము కలుగునా? వాడు తన ప్రవర్తనను దిద్దుకొని బ్రదుకుటయే నాకు సంతోషము గదా అని ప్రభువైన యెహోవా సెలవిచ్చుచున్నాడు'",
      "Ezekiel 18:23",
      "Do I have any pleasure at all that the wicked should die? says the Lord God, and not that he should turn from his ways and live?",
      "దుష్టుడు మరణించుటవలన నాకేమైన సంతోషము కలుగునా? వాడు తన ప్రవర్తనను దిద్దుకొని బ్రదుకుటయే నాకు సంతోషము గదా అని ప్రభువైన యెహోవా సెలవిచ్చుచున్నాడు",
      "The divine heart beats with passionate longing for sinner's repentance and genuine, flourishing life.",
      "పాపి నాశనమగుట దేవుని అభీష్టము కాదు; అతడు పశ్చాత్తాపపడి జీవము పొందవలెననియే ప్రభువు ఆశించుచున్నాడు."
    ],
    [
      "Ezekiel 18:32 the urgent call to turn and live: 'For I have no pleasure in the death of one who dies, says the Lord God. Therefore turn and live!'",
      "యెహెజ్కేలు 18:32 తిరుగుడి, బ్రదుకుడి అను పిలుపు: 'మరణించువాడు మరణించుటవలన నాకు సంతోషము లేదు గనుక మీరు మనస్సు మార్చుకొని బ్రదుకుడి అని ప్రభువైన యెహోవా సెలవిచ్చుచున్నాడు'",
      "Ezekiel 18:32",
      "For I have no pleasure in the death of one who dies, says the Lord God. Therefore turn and live!",
      "మరణించువాడు మరణించుటవలన నాకు సంతోషము లేదు గనుక మీరు మనస్సు మార్చుకొని బ్రదుకుడి అని ప్రభువైన యెహోవా సెలవిచ్చుచున్నాడు",
      "Repentance is the urgent turning point where doomed mortals pivot away from the grave into the light of life.",
      "మనస్సు మార్చుకొని దేవునితట్టు తిరుగుటయే నశించు మానవునికి నిజమైన జీవద్వారము."
    ],
    [
      "Ezekiel 33:11 the divine oath concerning life: 'As I live, says the Lord God, I have no pleasure in the death of the wicked... Turn, turn from your evil ways! For why should you die?'",
      "యెహెజ్కేలు 33:11 దేవుని ప్రమాణ పూర్వక పిలుపు: 'నా జీవముతోడు దుష్టుడు మరణించుటవలన నాకు సంతోషము లేదు... తిరుగుడి తిరుగుడి, మీ దుర్మార్గతనుండి తిరుగుడి; మీరు ఎందుకు చావవలెను?'",
      "Ezekiel 33:11",
      "As I live, says the Lord God, I have no pleasure in the death of the wicked, but that the wicked turn from his way and live. Turn, turn from your evil ways! For why should you die",
      "నా జీవముతోడు దుష్టుడు మరణించుటవలన నాకు సంతోషము లేదు, దుష్టుడు తన మార్గమునుండి తిరిగి బ్రదుకుటయే నాకు సంతోషము. తిరుగుడి తిరుగుడి, మీ దుర్మార్గతను విడిచి తిరుగుడి; ఇశ్రాయేలువారలారా, మీరెందుకు చావవలెను?",
      "God seals His plea with His own existence: He desires our rescue, begging us to turn and experience true life.",
      "దేవుడు తన స్వంత జీవముతోడు ప్రమాణము చేసి దుర్మార్గతను విడిచి బ్రదుకవలెనని మానవాళిని ఆహ్వానించుచున్నాడు."
    ],
    [
      "Ezekiel 37:5 breath entering dry bones to live: 'Thus says the Lord God to these bones: Surely I will cause breath to enter into you, and you shall live'",
      "యెహెజ్కేలు 37:5 ఎండిన ఎముకలలోకి జీవాత్మ ప్రవేశించుట: 'ప్రభువైన యెహోవా ఈ యెముకలకు సెలవిచ్చునదేమనగా-నేను మీలోనికి జీవాత్మను రప్పించెదను, మీరు బ్రదికెదరు'",
      "Ezekiel 37:5",
      "Surely I will cause breath to enter into you, and you shall live",
      "నేను మీలోనికి జీవాత్మను రప్పించెదను, మీరు బ్రదికెదరు",
      "No spiritual graveyard is beyond hope; the Holy Spirit can revive dry, desiccated remnants into a mighty living army.",
      "పరిశుద్ధాత్మ దేవుడు నిర్జీవమైన ఎండిపోయిన ఎముకలవంటి పరిస్థితులను సైతం నూతన జీవముతో లేపగలడు."
    ],
    [
      "Habakkuk 2:4 the foundational declaration of life by faith: 'Behold the proud, his soul is not upright in him; but the just shall live by his faith'",
      "హబక్కూకు 2:4 విశ్వాసమువలన నీతిమంతుడు బ్రదుకుట: 'గర్విష్ఠిని చూడుము, వాని మనస్సు యథార్థమైనది కాదు; అయితే నీతిమంతుడు తన విశ్వాసమువలన బ్రదుకును'",
      "Habakkuk 2:4",
      "Behold the proud, his soul is not upright in him; but the just shall live by his faith",
      "గర్విష్ఠిని చూడుము, వాని మనస్సు యథార్థమైనది కాదు; అయితే నీతిమంతుడు తన విశ్వాసమువలన బ్రదుకును",
      "Faith is not an intellectual exercise but the life-support system of the righteous in an unstable world.",
      "ఈ లోకపు కల్లోలములో నీతిమంతునికి దేవునియందలి తిరుగులేని విశ్వాసమే ప్రాణాధారము."
    ],
    [
      "Matthew 4:4 Jesus resisting Satan with the source of life: 'Man shall not live by bread alone, but by every word that proceeds from the mouth of God'",
      "మత్తయి 4:4 యేసు సాతానును ఎదిరించిన జీవసత్యము: 'మనుష్యుడు రొట్టెవలన మాత్రమే కాదు గాని దేవుని నోటనుండి వచ్చు ప్రతి మాటవలనను జీవించును'",
      "Matthew 4:4",
      "Man shall not live by bread alone, but by every word that proceeds from the mouth of God",
      "మనుష్యుడు రొట్టెవలన మాత్రమే కాదు గాని దేవుని నోటనుండి వచ్చు ప్రతి మాటవలనను జీవించును",
      "Christ demonstrates that physical survival must never be prioritized over spiritual obedience to divine revelation.",
      "భౌతిక ఆకలికంటె పరలోకపు తండ్రి వాక్యమునకు విధేయత చూపుటయే మానవుని ప్రథమ జీవ నియమము."
    ],
    [
      "Matthew 7:14 the narrow gate that leads to life: 'Because narrow is the gate and difficult is the way which leads to life, and there are few who find it'",
      "మత్తయి 7:14 జీవమునకు పోవు ఇరుకు మార్గము: 'జీవమునకు పోవు ద్వారము ఇరుకును, ఆ దారి సంకుచితమునై యున్నది, దాని కనుగొనువారు కొందరే'",
      "Matthew 7:14",
      "Because narrow is the gate and difficult is the way which leads to life, and there are few who find it",
      "జీవమునకు పోవు ద్వారము ఇరుకును, ఆ దారి సంకుచితమునై యున్నది, దాని కనుగొనువారు కొందరే",
      "The path to eternal life requires radical discipleship, cross-bearing, and separation from popular worldly currents.",
      "నిత్య జీవపు మార్గము త్యాగపూరితమైనది; లోక ఆకర్షణలను విడిచి ఇరుకు ద్వారమున ప్రవేశించువారే దానిని కనుగొందురు."
    ],
    [
      "Matthew 10:39 losing life to find true life: 'He who finds his life will lose it, and he who loses his life for My sake will find it'",
      "మత్తయి 10:39 ప్రాణమును కోల్పోయి నిజమైన జీవమును పొందుట: 'తన ప్రాణమును రక్షించుకొనువాడు దానిని పోగొట్టుకొనును; నా నిమిత్తము తన ప్రాణమును పోగొట్టుకొనువాడు దానిని దక్కించుకొనును'",
      "Matthew 10:39",
      "He who finds his life will lose it, and he who loses his life for My sake will find it",
      "తన ప్రాణమును రక్షించుకొనువాడు దానిని పోగొట్టుకొనును; నా నిమిత్తము తన ప్రాణమును పోగొట్టుకొనువాడు దానిని దక్కించుకొనును",
      "Selfish self-preservation guarantees spiritual forfeiture, while sacrificial surrender to Jesus secures indestructible life.",
      "స్వార్థముతో లోకములో ప్రాణమును కాపాడుకొనగోరువాడు నశించును; క్రీస్తుకొరకు త్యాగము చేయువాడు నిత్య జీవమును పొందును."
    ],
    [
      "Matthew 16:25 the paradox of the kingdom life: 'For whoever desires to save his life will lose it, but whoever loses his life for My sake will find it'",
      "మత్తయి 16:25 సిలువ శిష్యత్వపు జీవసత్యము: 'తన ప్రాణమును రక్షించుకొనగోరువాడు దానిని పోగొట్టుకొనును; నా నిమిత్తము తన ప్రాణమును పోగొట్టుకొనువాడు దానిని దక్కించుకొనును'",
      "Matthew 16:25",
      "For whoever desires to save his life will lose it, but whoever loses his life for My sake will find it",
      "తన ప్రాణమును రక్షించుకొనగోరువాడు దానిని పోగొట్టుకొనును; నా నిమిత్తము తన ప్రాణమును పోగొట్టుకొనువాడు దానిని దక్కించుకొనును",
      "True soul-preservation is discovered only when one gladly lays all personal ambitions at the feet of the crucified Master.",
      "క్రీస్తు రాజ్యముకొరకు సమస్తమును సమర్పించినప్పుడే మానవుడు పరిపూర్ణమైన దైవిక జీవమును అనుభవించగలడు."
    ],
    [
      "Matthew 19:17 entering into life through obedience: 'If you want to enter into life, keep the commandments'",
      "మత్తయి 19:17 జీవములో ప్రవేశించుటకు ఆజ్ఞలు: 'నీవు జీవములో ప్రవేశింపగోరినయెడల ఆజ్ఞలను గైకొనుము'",
      "Matthew 19:17",
      "If you want to enter into life, keep the commandments",
      "నీవు జీవములో ప్రవేశింపగోరినయెడల ఆజ్ఞలను గైకొనుము",
      "Jesus reveals that genuine fellowship with God demands holiness and uncompromising alignment with His holy law.",
      "దేవుని జీవములో ప్రవేశించుటకు ఆయన పరిశుద్ధ ఆజ్ఞలకు హృదయపూర్వకముగా లోబడవలెను."
    ],
    [
      "Mark 8:36 the inestimable value of the soul's life: 'For what will it profit a man if he gains the whole world, and loses his own soul?'",
      "మార్కు 8:36 ప్రాణపు అమూల్య విలువ: 'ఒకడు సర్వలోకమును సంపాదించుకొని తన ప్రాణమును పోగొట్టుకొంటే వానికి ఏమి ప్రయోజనము?'",
      "Mark 8:36",
      "For what will it profit a man if he gains the whole world, and loses his own soul?",
      "ఒకడు సర్వలోకమును సంపాదించుకొని తన ప్రాణమును పోగొట్టుకొంటే వానికి ఏమి ప్రయోజనము?",
      "All earthly empires, fortunes, and honors are worthless trinkets compared to the eternal destiny of an individual soul.",
      "సర్వ సంపదలకంటె మానవుని అమరమైన ఆత్మ జీవము ఎంతో వెలకట్టలేనిది."
    ],
    [
      "Luke 12:15 life not consisting in the abundance of possessions: 'Take heed and beware of covetousness, for one's life does not consist in the abundance of the things he possesses'",
      "లూకా 12:15 ఆస్తి సమృద్ధిలో జీవము లేకుండుట: 'ఏ విధమైన లోభమునకును చోటియ్యక జాగ్రత్తపడుడి; ఒకని జీవితము అతనికి సమృద్ధిగా ఉన్న ఆస్తిమీద ఆధారపడదు'",
      "Luke 12:15",
      "Take heed and beware of covetousness, for one's life does not consist in the abundance of the things he possesses",
      "ఏ విధమైన లోభమునకును చోటియ్యక జాగ్రత్తపడుడి; ఒకని జీవితము అతనికి సమృద్ధిగా ఉన్న ఆస్తిమీద ఆధారపడదు",
      "Consumerism is a deceptive illusion; accumulating material wealth cannot add a single heartbeat of eternal significance.",
      "భౌతిక వస్తువుల సమృద్ధి నిజమైన జీవితము కాదు; లోభత్వమును విడిచి దేవుని దృష్టిలో ధనవంతులు కావలెను."
    ],
    [
      "Luke 12:22-23 life being more than food: 'Do not worry about your life, what you will eat; nor about the body, what you will put on. Life is more than food'",
      "లూకా 12:22-23 ఆహారముకంటె ప్రాణము గొప్పది: 'మీ ప్రాణముకొరకు ఏమి తిందుమో అనియైనను, మీ శరీరముకొరకు ఏమి ధరించుకొందుమో అనియైనను చింతింపకుడి; ఆహారముకంటె ప్రాణమును, వస్త్రముకంటె శరీరమును గొప్పవి గదా'",
      "Luke 12:22-23",
      "Life is more than food, and the body is more than clothing",
      "ఆహారముకంటె ప్రాణమును, వస్త్రముకంటె శరీరమును గొప్పవి గదా",
      "Anxious obsession over biological necessities forgets that the God who granted life will certainly preserve it.",
      "ప్రాణమునిచ్చిన దేవుడు దానిని పోషించుటకు సమర్థుడు గనుక అనుదిన అవసరతలకై ఆందోళన చెందరాదు."
    ],
    [
      "John 1:4 the Word as the fountain of light and life: 'In Him was life, and the life was the light of men'",
      "యోహాను 1:4 వాక్యములో జీవముండుట: 'ఆయనలో జీవముండెను; ఆ జీవము మనుష్యులకు వెలుగై యుండెను'",
      "John 1:4",
      "In Him was life, and the life was the light of men",
      "ఆయనలో జీవముండెను; ఆ జీవము మనుష్యులకు వెలుగై యుండెను",
      "Christ is the primordial origin of all being; His uncreated life illuminates human intellect and awakens the spirit.",
      "క్రీస్తే నిత్య జీవపు ఊట; ఆయన జీవమే అంధకారములో ఉన్న మానవాళికి సత్యపు వెలుగును ప్రసాదించెను."
    ],
    [
      "John 3:16 everlasting life through faith in the Son: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life'",
      "యోహాను 3:16 కుమారునియందలి విశ్వాసముద్వారా నిత్యజీవము: 'దేవుడు లోకమును ఎంతో ప్రేమించెను, కాగా ఆయన తన అద్వితీయకుమారునిగా పుట్టిన వానియందు విశ్వాసముంచు ప్రతివాడును నశింపక నిత్యజీవము పొందునట్లు ఆయనను అనుగ్రహించెను'",
      "John 3:16",
      "That whoever believes in Him should not perish but have everlasting life",
      "ఆయనయందు విశ్వాసముంచు ప్రతివాడును నశింపక నిత్యజీవము పొందునట్లు ఆయనను అనుగ్రహించెను",
      "The zenith of divine benevolence: the Father sent His Son to rescue humanity from eternal perishing into everlasting life.",
      "దేవుని అపరిమిత ప్రేమ క్రీస్తును బలిగా ఇచ్చెను; ఆయనను విశ్వసించు ప్రతివాడు నిత్య నాశనము నుండి తప్పింపబడి నిత్య జీవము పొందును."
    ],
    [
      "John 3:36 possessing life versus wrath: 'He who believes in the Son has everlasting life; and he who does not believe the Son shall not see life, but the wrath of God abides on him'",
      "యోహాను 3:36 నిత్యజీవము వర్సెస్ దేవుని ఉగ్రత: 'కుమారునియందు విశ్వాసముంచువాడే నిత్యజీవముగలవాడు; కుమారునికి విధేయుడు కానివాడు జీవము చూడడు గాని దేవుని ఉగ్రత వానిమీద నిలిచియుండును'",
      "John 3:36",
      "He who believes in the Son has everlasting life; and he who does not believe the Son shall not see life, but the wrath of God abides on him",
      "కుమారునియందు విశ్వాసముంచువాడే నిత్యజీవముగలవాడు; కుమారునికి విధేయుడు కానివాడు జీవము చూడడు గాని దేవుని ఉగ్రత వానిమీద నిలిచియుండును",
      "Eternal life is a present spiritual possession for the believer, while stubborn unbelief leaves divine judgment intact.",
      "క్రీస్తును విశ్వసించువాడు ఇప్పుడే నిత్య జీవమును కలిగియున్నాడు; అవిధేయునిపై దేవుని న్యాయమైన ఉగ్రత నిలుచును."
    ],
    [
      "John 4:14 the internal spring of water into everlasting life: 'The water that I shall give him will become in him a fountain of water springing up into everlasting life'",
      "యోహాను 4:14 నిత్యజీవపు ఊటగా మారు జీవజలము: 'నేనిచ్చు నీళ్లు త్రాగువాడు ఎన్నటికిని దప్పిగొనడు; నేనతనికిచ్చు నీళ్లు నిత్యజీవమునకై వానిలో ఊరుచున్న నీటిబుగ్గగా ఉండును'",
      "John 4:14",
      "The water that I shall give him will become in him a fountain of water springing up into everlasting life",
      "నేనతనికిచ్చు నీళ్లు నిత్యజీవమునకై వానిలో ఊరుచున్న నీటిబుగ్గగా ఉండును",
      "Christ places an autonomous spiritual geyser within the redeemed heart that continuously overflows toward eternity.",
      "క్రీస్తు అనుగ్రహించే పరిశుద్ధాత్మ అను జీవజలము విశ్వాసి అంతరంగములో నిత్యజీవపు ఊటగా ప్రవహించును."
    ],
    [
      "John 5:21 the Son giving life to whom He wills: 'For as the Father raises the dead and gives life to them, even so the Son gives life to whom He will'",
      "యోహాను 5:21 కుమారుడు తనకిష్టమైనవారికి జీవమిచ్చుట: 'తండ్రి మృతులను ఏలాగు లేపి జీవింపచేయునో అలాగే కుమారుడును తనకిష్టము వచ్చినవారిని జీవింపచేయును'",
      "John 5:21",
      "For as the Father raises the dead and gives life to them, even so the Son gives life to whom He will",
      "తండ్రి మృతులను ఏలాగు లేపి జీవింపచేయునో అలాగే కుమారుడును తనకిష్టము వచ్చినవారిని జీవింపచేయును",
      "Jesus possesses sovereign, resurrecting omnipotence equal with the Father, quickening both dead bodies and dead souls.",
      "తండ్రితో సమానమైన సార్వభౌమత్వముతో క్రీస్తు మృతులను సజీవులుగా లేపి జీవమును అనుగ్రహించును."
    ],
    [
      "John 5:24 passing from death to life: 'He who hears My word and believes in Him who sent Me has everlasting life, and shall not come into judgment, but has passed from death into life'",
      "యోహాను 5:24 మరణములోనుండి జీవములోనికి దాటుట: 'నా మాట విని నన్ను పంపినవానియందు విశ్వాసముంచువాడు నిత్యజీవము గలవాడు, వాడు తీర్పులోనికి రాక మరణములోనుండి జీవములోనికి దాటియున్నాడు'",
      "John 5:24",
      "Has passed from death into life",
      "తీర్పులోనికి రాక మరణములోనుండి జీవములోనికి దాటియున్నాడు",
      "The moment of saving faith executes an immediate legal and ontological relocation from the realm of death to life.",
      "సువార్తను విని నమ్మిన క్షణముననే విశ్వాసి మరణపు పరిధి నుండి శాశ్వత జీవ రాజ్యములోనికి దాటిపోవును."
    ],
    [
      "John 5:26 the Father granting the Son to have life in Himself: 'For as the Father has life in Himself, so He has granted the Son to have life in Himself'",
      "యోహాను 5:26 తనలోతానే జీవము కలిగియుండుట: 'తండ్రి ఏలాగు తనంతట తానే జీవముగలవాడై యున్నాడో ఆలాగే కుమారుడును తనంతట తానే జీవము కలిగియుండునట్లు కుమారునికి అధికారము ఇచ్చెను'",
      "John 5:26",
      "For as the Father has life in Himself, so He has granted the Son to have life in Himself",
      "తండ్రి ఏలాగు తనంతట తానే జీవముగలవాడై యున్నాడో ఆలాగే కుమారుడును తనంతట తానే జీవము కలిగియుండునట్లు కుమారునికి అధికారము ఇచ్చెను",
      "The doctrine of aseity: Christ does not borrow life from creation; He possesses self-existent divine life inherent to His deity.",
      "క్రీస్తు సృష్టివలె ఆధారపడినవాడు కాడు; ఆయన తనయందే నిత్య స్వయంభూ జీవము గల దేవుడు."
    ],
    [
      "John 5:40 the tragedy of refusing to come to Christ for life: 'But you are not willing to come to Me that you may have life'",
      "యోహాను 5:40 జీవముకొరకు క్రీస్తునొద్దకు రారొల్లకపోవుట: 'అయినను మీకు జీవము కలుగునట్లు మీరు నాయొద్దకు రానొల్లరు'",
      "John 5:40",
      "But you are not willing to come to Me that you may have life",
      "అయినను మీకు జీవము కలుగునట్లు మీరు నాయొద్దకు రానొల్లరు",
      "Religious pride and stubborn self-righteousness close the door to the only source of eternal vitality.",
      "శాస్త్రులు లేఖనములను శోధించినను జీవదాతయైన క్రీస్తునొద్దకు వచ్చుటకు ఇష్టపడకపోయిరి."
    ],
    [
      "John 6:33 the bread of God giving life to the world: 'For the bread of God is He who comes down from heaven and gives life to the world'",
      "యోహాను 6:33 లోకమునకు జీవమిచ్చు పరలోకపు రొట్టె: 'పరలోకమునుండి దిగివచ్చి లోకమునకు జీవమునిచ్చునది దేవుడిచ్చు ఆహారమై యున్నది'",
      "John 6:33",
      "For the bread of God is He who comes down from heaven and gives life to the world",
      "పరలోకమునుండి దిగివచ్చి లోకమునకు జీవమునిచ్చునది దేవుడిచ్చు ఆహారమై యున్నది",
      "Christ's incarnation is heavenly nutrition sent to a starving world dying in the desert of sin.",
      "పరలోకమునుండి దిగివచ్చిన క్రీస్తే సమస్త లోకమునకు జీవమును అనుగ్రహించే నిజమైన ఆహారము."
    ],
    [
      "John 6:35 the Bread of Life quenching spiritual hunger: 'I am the bread of life. He who comes to Me shall never hunger, and he who believes in Me shall never thirst'",
      "యోహాను 6:35 జీవాహారమైన యేసు: 'యేసు వారితో ఇట్లనెను-నేనే జీవాహారము; నాయొద్దకు వచ్చువాడు ఏమాత్రమును ఆకలిగొనడు, నాయందు విశ్వాసముంచువాడు ఎప్పుడును దప్పిగొనడు'",
      "John 6:35",
      "I am the bread of life. He who comes to Me shall never hunger, and he who believes in Me shall never thirst",
      "నేనే జీవాహారము; నాయొద్దకు వచ్చువాడు ఏమాత్రమును ఆకలిగొనడు, నాయందు విశ్వాసముంచువాడు ఎప్పుడును దప్పిగొనడు",
      "Union with Christ completely extinguishes the existential starvation and thirst of the human soul.",
      "క్రీస్తునొద్దకు వచ్చువాడు ఎన్నడును ఆకలిదప్పులతో అలమటించడు; ఆయనయే ఆత్మకు నిత్య తృప్తినిచ్చు జీవాహారము."
    ],
    [
      "John 6:40 the Father's will of everlasting life and resurrection: 'Everyone who sees the Son and believes in Him may have everlasting life; and I will raise him up at the last day'",
      "యోహాను 6:40 అంత్యదినమున లేపబడు నిత్యజీవ వాగ్దానము: 'కుమారుని చూచి ఆయనయందు విశ్వాసముంచు ప్రతివాడును నిత్యజీవము పొందుటయే నా తండ్రి చిత్తము; అంత్యదినమున నేను వానిని లేపుదును'",
      "John 6:40",
      "Everyone who sees the Son and believes in Him may have everlasting life; and I will raise him up at the last day",
      "కుమారుని చూచి ఆయనయందు విశ్వాసముంచు ప్రతివాడును నిత్యజీవము పొందుటయే నా తండ్రి చిత్తము; అంత్యదినమున నేను వానిని లేపుదును",
      "Eternal life includes the physical resurrection of the body at Christ's triumphant return.",
      "క్రీస్తును విశ్వసించు ప్రతివానికి ఆత్మయందు నిత్యజీవము మాత్రమే గాక అంత్యదినమున పునరుత్థాన మహిమ కలుగును."
    ],
    [
      "John 6:48 the definitive proclamation of the Bread of Life: 'I am the bread of life'",
      "యోహాను 6:48 నేను జీవాహారమై యున్నాను అను ప్రకటన",
      "John 6:48",
      "I am the bread of life",
      "నేనే జీవాహారము",
      "A majestic crystalline claim: absolute sustenance for eternity is found solely in Jesus Christ.",
      "క్రీస్తు తానే సమస్త మానవాళికి అమరత్వమును ఇచ్చే జీవాహారమై యున్నాడు."
    ],
    [
      "John 6:51 living forever through eating the living bread: 'I am the living bread which came down from heaven. If anyone eats of this bread, he will live forever'",
      "యోహాను 6:51 యుగయుగములు జీవించు జీవపు రొట్టె: 'పరలోకమునుండి దిగివచ్చిన జీవాహారము నేనే. ఎవడైనను ఈ ఆహారము భుజించితే వాడెల్లప్పుడును జీవించును'",
      "John 6:51",
      "I am the living bread which came down from heaven. If anyone eats of this bread, he will live forever",
      "పరలోకమునుండి దిగివచ్చిన జీవాహారము నేనే. ఎవడైనను ఈ ఆహారము భుజించితే వాడెల్లప్పుడును జీవించును",
      "Spiritual partaking of Christ's sacrificial broken body imparts everlasting, indestructible existence.",
      "క్రీస్తు బలియాగపు శరీరమును విశ్వాసముతో స్వీకరించువాడు నిత్య నిరంతరము దేవునితో జీవించును."
    ],
    [
      "John 6:63 the Spirit giving life through Christ's words: 'It is the Spirit who gives life; the flesh profits nothing. The words that I speak to you are spirit, and they are life'",
      "యోహాను 6:63 ఆత్మయే జీవింపచేయును: 'ఆత్మయే జీవింపచేయుచున్నది, శరీరము కేవలము నిష్ప్రయోజనము. నేను మీతో చెప్పియున్న మాటలు ఆత్మయు జీవమునై యున్నవి'",
      "John 6:63",
      "It is the Spirit who gives life; the flesh profits nothing. The words that I speak to you are spirit, and they are life",
      "ఆత్మయే జీవింపచేయుచున్నది, శరీరము కేవలము నిష్ప్రయోజనము. నేను మీతో చెప్పియున్న మాటలు ఆత్మయు జీవమునై యున్నవి",
      "Carnal ritualism accomplishes zero spiritual regeneration; life is generated exclusively by the Spirit through Christ's spoken truth.",
      "మానవ శరీర ప్రయత్నములు నిరర్థకము; పరిశుద్ధాత్మయు మరియు యేసు పలికిన జీవపు మాటలే ఆత్మను బ్రదికించును."
    ],
    [
      "John 6:68 Peter recognizing the words of eternal life: 'Lord, to whom shall we go? You have the words of eternal life'",
      "యోహాను 6:68 పేతురు ఒప్పుకోలు: 'ప్రభువా, ఎవనియొద్దకు వెళ్లుదుము? నీవే నిత్యజీవపు మాటలు గలవాడవు'",
      "John 6:68",
      "Lord, to whom shall we go? You have the words of eternal life",
      "ప్రభువా, ఎవనియొద్దకు వెళ్లుదుము? నీవే నిత్యజీవపు మాటలు గలవాడవు",
      "When fickle crowds turned away, true disciples clung to Jesus, knowing eternal destiny rests solely in His speech.",
      "సమస్త లోకములో ఎవ్వరియొద్దను లేని నిత్యజీవపు వాక్కులు ఒక్క క్రీస్తునొద్ద మాత్రమే ఉన్నవని పేతురు విశ్వసించెను."
    ]
  ];

  return data.map(item => ({
    easyQ: `What foundational biblical revelation regarding life is established in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన ప్రాథమిక జీవ సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does God's sovereign gift of life sustain believers and preserve them from destruction?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం దేవుడిచ్చు జీవపు దానము విశ్వాసులను ఎలా కాపాడి నిత్యత్వమునకు నడిపించును?`,
    hardQ: `What theological truth does ${item[2]} declare concerning the breath, origin, and divine preservation of life?`,
    hardQTe: `${item[2]} ప్రకారం సమస్త జీవమునకు మూలమైన దేవుని శక్తిని మరియు జీవాత్మ ప్రభావమును గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty high walls around the brook of Cherith", "He commanded seventy brass vessels filled with mountain honey", "He decreed thirty days of fast before the gates of Nineveh"],
    optionsTelugu: [item[4], "కెరీతు వాగు చుట్టూ నలభై ఎత్తైన ప్రాకారములను నిర్మించెను", "కొండ తేనెతో నిండిన డెబ్బై ఇత్తడి పాత్రలను సిద్ధపరచెను", "నీనెవె గుమ్మములయెదుట ముప్పై దినముల ఉపవాసమును విధించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Growth Facts for Life (Abundant Life, Resurrection and Life, Walking in the Spirit of Life, Reigning in Life)
function buildLifeGrowth() {
  const data = [
    [
      "John 8:12 the Light of Life: 'I am the light of the world. He who follows Me shall not walk in darkness, but have the light of life'",
      "యోహాను 8:12 జీవపు వెలుగు: 'నేనే లోకమునకు వెలుగును, నన్ను వెంబడించువాడు చీకటిలో నడువక జీవపు వెలుగును కలిగియుండును'",
      "John 8:12",
      "I am the light of the world. He who follows Me shall not walk in darkness, but have the light of life",
      "నేనే లోకమునకు వెలుగును, నన్ను వెంబడించువాడు చీకటిలో నడువక జీవపు వెలుగును కలిగియుండును",
      "Following Christ eradicates moral confusion and bathes the believer's steps in the radiant luminescence of true life.",
      "క్రీస్తును అనుసరించువాడు చీకటిలో నడవక ఆత్మను ప్రకాశింపజేసే జీవపు వెలుగును నిత్యము అనుభవించును."
    ],
    [
      "John 10:10 the purpose of Christ's incarnation for abundant life: 'The thief does not come except to steal, and to kill, and to destroy. I have come that they may have life, and that they may have it more abundantly'",
      "యోహాను 10:10 సమృద్ధియైన జీవము: 'దొంగ దొంగతనమును హత్యను నాశనమును చేయుటకు వచ్చును గాని మరి దేనికిని రాడు; గొఱ్ఱెలకు జీవము కలుగుటకును అది సమృద్ధిగా కలుగుటకును నేను వచ్చితిని'",
      "John 10:10",
      "I have come that they may have life, and that they may have it more abundantly",
      "గొఱ్ఱెలకు జీవము కలుగుటకును అది సమృద్ధిగా కలుగుటకును నేను వచ్చితిని",
      "Satan brings spiritual robbery and slaughter, but Jesus imparts overflowing vitality, divine fullness, and eternal joy.",
      "సాతాను నాశనము చేయుటకు ప్రయత్నించగా, క్రీస్తు మనకు ఆత్మీయ సమృద్ధిని మరియు సంపూర్ణ జీవమును ప్రసాదించుటకు వచ్చెను."
    ],
    [
      "John 10:28 Christ granting eternal security in life: 'And I give them eternal life, and they shall never perish; neither shall anyone snatch them out of My hand'",
      "యోహాను 10:28 నిత్యజీవ భద్రత: 'నేను వాటికి నిత్యజీవమునిచ్చుచున్నాను, అవి ఎన్నటికిని నశింపవు, ఎవడును వాటిని నా చేతిలోనుండి అపహరింపడు'",
      "John 10:28",
      "And I give them eternal life, and they shall never perish; neither shall anyone snatch them out of My hand",
      "నేను వాటికి నిత్యజీవమునిచ్చుచున్నాను, అవి ఎన్నటికిని నశింపవు, ఎవడును వాటిని నా చేతిలోనుండి అపహరింపడు",
      "Believers possessing eternal life are held in the omnipotent grip of the Good Shepherd; no demon or power can abduct them.",
      "క్రీస్తు తన గొర్రెలకు ఇచ్చే నిత్యజీవము ఎన్నడును నశించదు; ఏ శత్రువును ఆయన హస్తమునుండి వారిని లాగివేయలేడు."
    ],
    [
      "John 11:25-26 Christ as the Resurrection and the Life: 'I am the resurrection and the life. He who believes in Me, though he may die, he shall live'",
      "యోహాను 11:25-26 పునరుత్థానమును జీవమునైన యేసు: 'నేనే పునరుత్థానమును జీవమును; నాయందు విశ్వాసముంచువాడు చనిపోయినను బ్రదుకును'",
      "John 11:25",
      "I am the resurrection and the life. He who believes in Me, though he may die, he shall live",
      "నేనే పునరుత్థానమును జీవమును; నాయందు విశ్వాసముంచువాడు చనిపోయినను బ్రదుకును",
      "Physical mortality is stripped of its finality; Jesus embodies the resurrecting power that raises the faithful to everlasting glory.",
      "శారీరక మరణము విశ్వాసి జీవితమునకు ముగింపు కాదు; క్రీస్తు పునరుత్థాన శక్తి మృతులను సజీవులుగా లేపును."
    ],
    [
      "John 12:25 keeping life for eternity by not clinging to this world: 'He who loves his life will lose it, and he who hates his life in this world will keep it for eternal life'",
      "యోహాను 12:25 లోకపు ప్రాణమును తృణీకరించి నిత్యజీవమును కాపాడుకొనుట: 'తన ప్రాణమును ప్రేమించువాడు దానిని పోగొట్టుకొనును; ఈ లోకములో తన ప్రాణమును ద్వేషించువాడు నిత్యజీవముకొరకు దానిని కాపాడుకొనును'",
      "John 12:25",
      "He who loves his life will lose it, and he who hates his life in this world will keep it for eternal life",
      "తన ప్రాణమును ప్రేమించువాడు దానిని పోగొట్టుకొనును; ఈ లోకములో తన ప్రాణమును ద్వేషించువాడు నిత్యజీవముకొరకు దానిని కాపాడుకొనును",
      "Detachment from temporary worldly applause and willingness to suffer for the cross preserves the soul for eternal splendors.",
      "లోకభోగములను విసర్జించి క్రీస్తు నిమిత్తము జీవించువాడు నిత్యజీవమునకై తన ఆత్మను భద్రపరచుకొనును."
    ],
    [
      "John 14:6 Christ as the exclusive Way, Truth, and Life: 'I am the way, the truth, and the life. No one comes to the Father except through Me'",
      "యోహాను 14:6 మార్గము, సత్యము, జీవము: 'నేనే మార్గమును, సత్యమును, జీవమును; నా ద్వారానే తప్ప ఎవడును తండ్రియొద్దకు రాడు'",
      "John 14:6",
      "I am the way, the truth, and the life. No one comes to the Father except through Me",
      "నేనే మార్గమును, సత్యమును, జీవమును; నా ద్వారానే తప్ప ఎవడును తండ్రియొద్దకు రాడు",
      "Jesus does not merely point the direction or teach doctrines of vitality; He Himself is the living highway to the Father.",
      "పరలోకపు తండ్రియొద్దకు చేరుటకు క్రీస్తే ఏకైక జీవ మార్గము; ఆయన ద్వారానే మానవుడు దేవునితో సమాధానపడగలడు."
    ],
    [
      "John 14:19 living because Christ lives: 'Because I live, you will live also'",
      "యోహాను 14:19 క్రీస్తు జీవించుటవలన మనము జీవించుట: 'నేను జీవించుచున్నాను గనుక మీరును జీవింతురు'",
      "John 14:19",
      "Because I live, you will live also",
      "నేను జీవించుచున్నాను గనుక మీరును జీవింతురు",
      "The ongoing, indestructible life of the resurrected Lord is the absolute guarantee of the believer's immortality.",
      "మృత్యుంజయుడైన క్రీస్తు నిరంతరము సజీవుడు గనుక ఆయనయందున్న విశ్వాసులును నిత్యము జీవింతురు."
    ],
    [
      "John 17:2 authority given to the Son to give eternal life: 'As You have given Him authority over all flesh, that He should give eternal life to as many as You have given Him'",
      "యోహాను 17:2 సర్వశరీరులమీద అధికారము మరియు నిత్యజీవము: 'నీవు ఆయనకిచ్చిన వారికందరికిని ఆయన నిత్యజీవము ఇచ్చునట్లు సర్వశరీరులమీదను ఆయనకు అధికారమిచ్చితివి'",
      "John 17:2",
      "That He should give eternal life to as many as You have given Him",
      "నీవు ఆయనకిచ్చిన వారికందరికిని ఆయన నిత్యజీవము ఇచ్చునట్లు సర్వశరీరులమీదను ఆయనకు అధికారమిచ్చితివి",
      "The sovereign covenant of redemption: the Father entrusts the elect to the Son, who guarantees their eternal inheritance.",
      "తండ్రి కుమారునికి అప్పగించిన ప్రతి విశ్వాసికి నిత్యజీవమును ప్రసాదించుటకు క్రీస్తుకు సంపూర్ణ అధికారము కలదు."
    ],
    [
      "John 17:3 the supreme definition of eternal life: 'And this is eternal life, that they may know You, the only true God, and Jesus Christ whom You have sent'",
      "యోహాను 17:3 నిత్యజీవపు నిర్వచనము: 'అద్వితీయ సత్యదేవుడవైన నిన్నును, నీవు పంపిన యేసుక్రీస్తును ఎరుగుటయే నిత్యజీవము'",
      "John 17:3",
      "And this is eternal life, that they may know You, the only true God, and Jesus Christ whom You have sent",
      "అద్వితీయ సత్యదేవుడవైన నిన్నును, నీవు పంపిన యేసుక్రీస్తును ఎరుగుటయే నిత్యజీవము",
      "Eternal life is not merely infinite chronological duration; it is experiential, intimate union with the Triune Godhead.",
      "కేవలము కాలపరిమితి లేకుండుట మాత్రమే కాదు గాని అద్వితీయ దేవునిని క్రీస్తును వ్యక్తిగతముగా ఎరిగియుండుటయే నిత్యజీవము."
    ],
    [
      "John 20:31 the purpose of John's Gospel to produce life through belief: 'That believing you may have life in His name'",
      "యోహాను 20:31 క్రీస్తు నామమందు జీవము పొందుట: 'విశ్వసించి ఆయన నామమందు జీవము పొందునట్లు ఇవి వ్రాయబడెను'",
      "John 20:31",
      "That believing you may have life in His name",
      "మీరు విశ్వసించి ఆయన నామమందు జీవము పొందునట్లు ఇవి వ్రాయబడెను",
      "Apostolic testimony exists to ignite saving faith in Jesus the Messiah, unlocking the treasure of divine life in His name.",
      "యేసు దేవుని కుమారుడైన క్రీస్తని విశ్వసించి ఆయన నామమందు జీవమును అనుభవించుటకే లేఖనములు వ్రాయబడెను."
    ],
    [
      "Acts 2:28 Peter quoting David on the ways of life: 'You have made known to me the ways of life; You will make me full of joy in Your presence'",
      "అపొస్తలుల కార్యములు 2:28 జీవమార్గములు బయలుపరచబడుట: 'నీవు నాకు జీవమార్గములను తెలియజేసితివి, నీ సన్నిధిని నన్ను సంతోషముతో నింపుదువు'",
      "Acts 2:28",
      "You have made known to me the ways of life; You will make me full of joy in Your presence",
      "నీవు నాకు జీవమార్గములను తెలియజేసితివి, నీ సన్నిధిని నన్ను సంతోషముతో నింపుదువు",
      "The resurrection of Christ opens the authentic highways of life, flooding the redeemed soul with celestial gladness.",
      "పునరుత్థానుడైన క్రీస్తు తన ప్రజలకు పరిశుద్ధ జీవమార్గములను చూపి తన సన్నిధి ఆనందముతో వారిని నింపును."
    ],
    [
      "Acts 3:15 Peter indicting Jerusalem while exalting the Prince of Life: 'And killed the Prince of life, whom God raised from the dead, of which we are witnesses'",
      "అపొస్తలుల కార్యములు 3:15 జీవాధిపతియైన యేసు: 'జీవాధిపతిని మీరు చంపితిరి గాని దేవుడు ఆయనను మృతులలోనుండి లేపెను; అందుకు మేము సాక్షులమై యున్నాము'",
      "Acts 3:15",
      "And killed the Prince of life, whom God raised from the dead, of which we are witnesses",
      "జీవాధిపతిని మీరు చంపితిరి గాని దేవుడు ఆయనను మృతులలోనుండి లేపెను; అందుకు మేము సాక్షులమై యున్నాము",
      "Fallen humanity executed the very Author and Champion of existence, yet God vindicated Him through bodily resurrection.",
      "మానవులు జీవాధిపతిని సిలువ వేసినను, దేవుడు ఆయనను మృతులలోనుండి లేపి జీవపు అధిపతిగా ఘనపరచెను."
    ],
    [
      "Acts 5:20 the angel commanding the apostles to proclaim this life: 'Go, stand in the temple and speak to the people all the words of this life'",
      "అపొస్తలుల కార్యములు 5:20 ఈ జీవపు మాటలన్నిటిని ప్రకటించుట: 'మీరు వెళ్లి దేవాలయములో నిలిచి, ఈ జీవపు మాటలన్నిటిని ప్రజలతో చెప్పుడని ఆజ్ఞాపించెను'",
      "Acts 5:20",
      "Go, stand in the temple and speak to the people all the words of this life",
      "మీరు వెళ్లి దేవాలయములో నిలిచి, ఈ జీవపు మాటలన్నిటిని ప్రజలతో చెప్పుడని ఆజ్ఞాపించెను",
      "The apostolic gospel is essentially the message of 'this life'-a revolutionary, supernatural power invading mortality.",
      "సువార్త సందేశము కేవలము మత సిద్ధాంతము కాదు; అది మానవాళిని బ్రతికించే పరలోకపు జీవ వాక్కుల సమాహారము."
    ],
    [
      "Acts 11:18 the Jerusalem council rejoicing over repentance to life: 'Then God has also granted to the Gentiles repentance to life'",
      "అపొస్తలుల కార్యములు 11:18 అన్యజనులకు జీవార్థమైన మారుమనస్సు: 'అట్లయితే దేవుడు అన్యజనులకును జీవార్థమైన మారుమనస్సు దయచేసియున్నాడని చెప్పుకొని దేవుని మహిమపరచిరి'",
      "Acts 11:18",
      "Then God has also granted to the Gentiles repentance to life",
      "అట్లయితే దేవుడు అన్యజనులకును జీవార్థమైన మారుమనస్సు దయచేసియున్నాడని చెప్పుకొని దేవుని మహిమపరచిరి",
      "Repentance is a gracious divine endowment that shatters ethnic boundaries, drawing all nations into eternal life.",
      "దేవుడు యూదులకే కాక సర్వ లోక అన్యజనులకు సైతం జీవమును ప్రసాదించే మారుమనస్సును అనుగ్రహించెను."
    ],
    [
      "Acts 13:46 Paul turning to the Gentiles when Jews judge themselves unworthy of life: 'Since you judge yourselves unworthy of everlasting life, behold, we turn to the Gentiles'",
      "అపొస్తలుల కార్యములు 13:46 నిత్యజీవమునకు అయోగ్యులుగా తీర్చుకొనుట: 'మీరు నిత్యజీవమునకు మిమ్మును అయోగ్యులుగా ఎంచుకొనుచున్నారు గనుక ఇదిగో మేము అన్యజనులయొద్దకు వెళ్లుచున్నాము'",
      "Acts 13:46",
      "Since you reject it, and judge yourselves unworthy of everlasting life, behold, we turn to the Gentiles",
      "మీరు నిత్యజీవమునకు మిమ్మును అయోగ్యులుగా ఎంచుకొనుచున్నారు గనుక ఇదిగో మేము అన్యజనులయొద్దకు వెళ్లుచున్నాము",
      "Rejecting the gospel of grace is self-inflicted spiritual suicide, forfeiting the gift of everlasting life.",
      "దేవుని సత్య సువార్తను తృణీకరించుటవలన ప్రజలు తమకుతామే నిత్యజీవ భాగ్యమును పోగొట్టుకొనుచున్నారు."
    ],
    [
      "Acts 13:48 appointed to eternal life believing: 'And as many as had been appointed to eternal life believed'",
      "అపొస్తలుల కార్యములు 13:48 నిత్యజీవమునకు నిర్ణయింపబడినవారు విశ్వసించుట: 'నిత్యజీవమునకు నిర్ణయింపబడినవారందరును విశ్వసించిరి'",
      "Acts 13:48",
      "And as many as had been appointed to eternal life believed",
      "నిత్యజీవమునకు నిర్ణయింపబడినవారందరును విశ్వసించిరి",
      "God's electing grace orchestrates history so that every designated heir of eternal life responds in faith to the gospel.",
      "దేవుని కృపా సంకల్పములో నిత్యజీవమునకు నియమింపబడిన ప్రతి హృదయము క్రీస్తును విశ్వసించును."
    ],
    [
      "Acts 17:25 God giving to all life, breath, and all things: 'Nor is He worshiped with men's hands, as though He needed anything, since He gives to all life, breath, and all things'",
      "అపొస్తలుల కార్యములు 17:25 అందరికిని జీవమును ఊపిరిని సమస్తమును ఇచ్చు దేవుడు: 'ఆయనే అందరికిని జీవమును ఊపిరిని సమస్తమును దయచేయువాడు గనుక, తనకు ఏదైనను కొదువయున్నట్టు మనుష్యుల చేతులతో సేవింపబడవలసినవాడు కాడు'",
      "Acts 17:25",
      "Since He gives to all life, breath, and all things",
      "ఆయనే అందరికిని జీవమును ఊపిరిని సమస్తమును దయచేయువాడు",
      "The Creator is totally self-sufficient, sustaining every respiration and heartbeat across the entire global population.",
      "సమస్త సృష్టికి ప్రాణమును, శ్వాసను, సర్వసంపదలను అనుగ్రహించే దేవుడు ఎవరి సేవలపైనా ఆధారపడడు."
    ],
    [
      "Acts 17:28 in Him we live and move and have our being: 'For in Him we live and move and have our being'",
      "అపొస్తలుల కార్యములు 17:28 ఆయనయందే జీవించుచున్నాము: 'మనమాయనయందు జీవించుచున్నాము, చలించుచున్నాము, ఉనికి కలిగియున్నాము'",
      "Acts 17:28",
      "For in Him we live and move and have our being",
      "మనమాయనయందు జీవించుచున్నాము, చలించుచున్నాము, ఉనికి కలిగియున్నాము",
      "Our very existence is submerged in the omnipresent sphere of God's sustaining grace.",
      "దేవుని దైవిక ఉనికి మరియు సంరక్షణలోనే మన ఉనికి, చలనము మరియు జీవనము నిలిచియున్నవి."
    ],
    [
      "Romans 1:17 the righteous living by faith: 'For in it the righteousness of God is revealed from faith to faith; as it is written, The just shall live by faith'",
      "రోమీయులకు 1:17 విశ్వాసమూలముగా నీతిమంతుడు జీవించుట: 'నీతిమంతుడు విశ్వాసమూలముగా జీవించును అని వ్రాయబడిన ప్రకారము విశ్వాసమూలముగా నీతి బయలుపరచబడుచున్నది'",
      "Romans 1:17",
      "For in it the righteousness of God is revealed from faith to faith; as it is written, The just shall live by faith",
      "నీతిమంతుడు విశ్వాసమూలముగా జీవించును అని వ్రాయబడిన ప్రకారము విశ్వాసమూలముగా నీతి బయలుపరచబడుచున్నది",
      "The gospel reveals that spiritual animation and eternal life flow exclusively through trusting reliance on Christ.",
      "క్రియలవలన కాక క్రీస్తునందలి విశ్వాసమువలననే విశ్వాసి దేవునియెదుట నీతిమంతుడై బ్రదుకును."
    ],
    [
      "Romans 2:7 eternal life to those seeking glory, honor, and immortality: 'Eternal life to those who by patient continuance in doing good seek for glory, honor, and immortality'",
      "రోమీయులకు 2:7 సత్క్రియలను చేయువారికి నిత్యజీవము: 'సత్క్రియలను ఓపికగా చేయుచు, మహిమను ఘనతను అక్షయతను వెదకువారికి నిత్యజీవమును ఇచ్చును'",
      "Romans 2:7",
      "Eternal life to those who by patient continuance in doing good seek for glory, honor, and immortality",
      "సత్క్రియలను ఓపికగా చేయుచు, మహిమను ఘనతను అక్షయతను వెదకువారికి నిత్యజీవమును ఇచ్చును",
      "Persevering fidelity in righteous conduct demonstrates the presence of regenerate life destined for eternal glory.",
      "ఓపికతో దేవుని చిత్తమును నెరవేర్చుచు మహిమను వెదకువారికి దేవుడు నిత్యజీవ బహుమానమును దయచేయును."
    ],
    [
      "Romans 5:10 saved by His life: 'For if when we were enemies we were reconciled to God through the death of His Son, much more, having been reconciled, we shall be saved by His life'",
      "రోమీయులకు 5:10 క్రీస్తు జీవమువలన రక్షింపబడుట: 'శత్రువులమై యుండగా ఆయన కుమారుని మరణముద్వారా మనము దేవునితో సమాధానపరచబడినయెడల, సమాధానపరచబడినవారమై ఆయన జీవించుటచేత మరి నిశ్చయముగా రక్షింపబడుదుము'",
      "Romans 5:10",
      "Much more, having been reconciled, we shall be saved by His life",
      "సమాధానపరచబడినవారమై ఆయన జీవించుటచేత మరి నిశ్చయముగా రక్షింపబడుదుము",
      "If Christ's death was powerful enough to reconcile rebels, His resurrected life is infinitely sufficient to preserve them forever.",
      "క్రీస్తు మరణము మనలను దేవునితో సమాధానపరచగా, ఆయన సజీవత్వము మనలను నిత్యత్వములో భద్రపరచి రక్షించును."
    ],
    [
      "Romans 5:17 reigning in life through the abundance of grace: 'Much more those who receive abundance of grace and of the gift of righteousness will reign in life through the One, Jesus Christ'",
      "రోమీయులకు 5:17 జీవమందు ఏలుబడి చేయుట: 'కృపాబాహుళ్యమును నీతిదానమును పొందువారు యేసుక్రీస్తు అను ఒకనిద్వారానే జీవముగలవారై మరి నిశ్చయముగా ఏలుదురు'",
      "Romans 5:17",
      "Much more those who receive abundance of grace and of the gift of righteousness will reign in life through the One, Jesus Christ",
      "కృపాబాహుళ్యమును నీతిదానమును పొందువారు యేసుక్రీస్తు అను ఒకనిద్వారానే జీవముగలవారై మరి నిశ్చయముగా ఏలుదురు",
      "Believers are not doomed to spiritual defeat; they are crowned royalty empowered to conquer sin and reign in victorious life.",
      "క్రీస్తు అనుగ్రహించిన కృపయు నీతియు విశ్వాసులను పాపముపై విజయము పొంది జీవములో రాజ్యమేలునట్లు చేయును."
    ],
    [
      "Romans 5:18 justification of life for all men: 'Through one righteous act the free gift came to all men, resulting in justification of life'",
      "రోమీయులకు 5:18 జీవప్రదమైన నీతితీర్పు: 'ఒకని నీతి కార్యమువలన మనుష్యులకందరికిని జీవప్రదమైన నీతితీర్పు సిద్ధించెను'",
      "Romans 5:18",
      "Through one righteous act the free gift came to all men, resulting in justification of life",
      "ఒకని నీతి కార్యమువలన మనుష్యులకందరికిని జీవప్రదమైన నీతితీర్పు సిద్ధించెను",
      "Adam's singular transgression brought condemnation, but Jesus' singular obedience at the cross confers justification that produces eternal life.",
      "క్రీస్తు సిలువ త్యాగమను ఏకైక నీతికార్యము మానవాళికి జీవమును తెచ్చే నీతితీర్పును సిద్ధపరచెను."
    ],
    [
      "Romans 5:21 grace reigning through righteousness to eternal life: 'So grace might reign through righteousness to eternal life through Jesus Christ our Lord'",
      "రోమీయులకు 5:21 నిత్యజీవమునకు నడిపించు కృప: 'మన ప్రభువైన యేసుక్రీస్తుద్వారా నిత్యజీవము కలుగుటకై కృపయు నీతిద్వారా ఏలునట్లు పాపము మరణమునందు ఏలెను'",
      "Romans 5:21",
      "Grace might reign through righteousness to eternal life through Jesus Christ our Lord",
      "మన ప్రభువైన యేసుక్రీస్తుద్వారా నిత్యజీవము కలుగుటకై కృపయు నీతిద్వారా ఏలును",
      "Grace out-thrones sin and death, establishing a sovereign dominion of righteousness that culminates in everlasting life.",
      "పాపపు మరణ పరిపాలన అంతమై, క్రీస్తుద్వారా దేవుని కృప నిత్యజీవమునకు నడిపించే నీతిని ఏలజేయుచున్నది."
    ],
    [
      "Romans 6:4 walking in newness of life: 'Just as Christ was raised from the dead by the glory of the Father, even so we also should walk in newness of life'",
      "రోమీయులకు 6:4 నూతన జీవము కలిగి నడుచుకొనుట: 'తండ్రి మహిమవలన క్రీస్తు మృతులలోనుండి ఏలాగు లేపబడెనో, ఆలాగే మనమును నూతనజీవము పొందినవారమై నడుచుకొనునట్లు ఆయనతోకూడ బాప్తిస్మమువలన మరణములో పాతిపెట్టబడితివి'",
      "Romans 6:4",
      "Even so we also should walk in newness of life",
      "మనమును నూతనజీవము పొందినవారమై నడుచుకొనునట్లు",
      "Baptism signifies burial with Christ, followed by resurrection into a radically altered, Spirit-empowered daily lifestyle.",
      "క్రీస్తుతోకూడ పాతిపెట్టబడిన విశ్వాసి పునరుత్థాన శక్తితో నూతన జీవముగలవాడై నడుచుకొనవలెను."
    ],
    [
      "Romans 6:11 alive to God in Christ Jesus: 'Likewise you also, reckon yourselves to be dead indeed to sin, but alive to God in Christ Jesus our Lord'",
      "రోమీయులకు 6:11 దేవుని నిమిత్తము సజీవులుగా ఎంచుకొనుట: 'అలాగే మీరును పాపము విషయమై మృతులుగాను, దేవుని విషయమై క్రీస్తుయేసునందు సజీవులు గాను ఎంచుకొనుడి'",
      "Romans 6:11",
      "Reckon yourselves to be dead indeed to sin, but alive to God in Christ Jesus our Lord",
      "మీరును పాపము విషయమై మృతులుగాను, దేవుని విషయమై క్రీస్తుయేసునందు సజీవులు గాను ఎంచుకొనుడి",
      "Sanctification begins with mental reckoning: we must reckon our union with Christ as absolute reality-dead to sin, alive to God.",
      "పాపపు బానిసత్వమునకు చనిపోయి, క్రీస్తుయేసునందు దేవునికొరకు సజీవులముగా జీవించుటయే ఆత్మీయ విజయం."
    ],
    [
      "Romans 6:13 presenting members alive from the dead: 'Present yourselves to God as being alive from the dead, and your members as instruments of righteousness to God'",
      "రోమీయులకు 6:13 మృతులలోనుండి సజీవులమై అంగములను సమర్పించుట: 'మృతులలోనుండి సజీవులమనుకొని మిమ్మును మీరే దేవునికి అప్పగించుకొనుడి, మీ అవయవములను నీతిసాధనములుగా దేవునికి సమర్పించుడి'",
      "Romans 6:13",
      "Present yourselves to God as being alive from the dead, and your members as instruments of righteousness to God",
      "మృతులలోనుండి సజీవులమనుకొని మిమ్మును మీరే దేవునికి అప్పగించుకొనుడి, మీ అవయవములను నీతిసాధనములుగా దేవునికి సమర్పించుడి",
      "Resurrected life expresses itself through bodily dedication; hands, eyes, and tongue become consecrated weapons for holiness.",
      "పాపమునుండి విడుదల పొందిన విశ్వాసి తన దేహావయవములను దేవుని నీతికార్యములకు ఆయుధములుగా సమర్పించవలెను."
    ],
    [
      "Romans 6:22 freedom from sin resulting in everlasting life: 'Having been set free from sin, and having become slaves of God, you have your fruit to holiness, and the end, everlasting life'",
      "రోమీయులకు 6:22 పరిశుద్ధతయను ఫలము మరియు నిత్యజీవము: 'పాపమునుండి విముక్తులై దేవునికి దాసులైనందున పరిశుద్ధత కలుగుటయే మీకు ఫలము; దాని అంతము నిత్యజీవము'",
      "Romans 6:22",
      "You have your fruit to holiness, and the end, everlasting life",
      "పరిశుద్ధత కలుగుటయే మీకు ఫలము; దాని అంతము నిత్యజీవము",
      "Deliverance from sin bears the visible harvest of sanctification, culminating ultimately in consummate everlasting life.",
      "దేవునికి సమర్పించుకొనుటవలన పరిశుద్ధ జీవితమను ఫలము లభించును; ఆ మార్గపు పరమ గమ్యము నిత్యజీవము."
    ],
    [
      "Romans 6:23 the free gift of eternal life: 'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord'",
      "రోమీయులకు 6:23 దేవుని ఉచిత వరమైన నిత్యజీవము: 'ఏలయనగా పాపమువలన వచ్చు జీతము మరణము; అయితే దేవుని కృపావరము మన ప్రభువైన క్రీస్తుయేసునందు నిత్యజీవము'",
      "Romans 6:23",
      "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord",
      "పాపమువలన వచ్చు జీతము మరణము; అయితే దేవుని కృపావరము మన ప్రభువైన క్రీస్తుయేసునందు నిత్యజీవము",
      "Sin pays an earned paycheck of eternal condemnation, whereas God bestows an unearned, infinite endowment of life in Jesus.",
      "పాపమునకు లభించే జీతము మరణమై యుండగా, క్రీస్తుయేసునందు దేవుడు ఉచితముగా అనుగ్రహించే వరము నిత్యజీవము."
    ],
    [
      "Romans 7:10 the commandment meant to bring life: 'And the commandment, which was to bring life, I found to bring death'",
      "రోమీయులకు 7:10 ఆజ్ఞ జీవార్థమైనదైనను మరణము తెచ్చుట: 'జీవార్థమైన ఆజ్ఞయే నాకు మరణకరమైనదిగా కనబడెను'",
      "Romans 7:10",
      "And the commandment, which was to bring life, I found to bring death",
      "జీవార్థమైన ఆజ్ఞయే నాకు మరణకరమైనదిగా కనబడెను",
      "The moral law is inherently holy and good, but when exposed to fallen flesh, it exposes corruption and sentences sinners to death.",
      "ధర్మశాస్త్రము పరిశుద్ధమైనదైనను మానవ పాపనైజము దానిని నెరవేర్చలేక మరణ శిక్షకు పాత్రుడాయెను."
    ],
    [
      "Romans 8:2 the law of the Spirit of life setting free from death: 'For the law of the Spirit of life in Christ Jesus has made me free from the law of sin and death'",
      "రోమీయులకు 8:2 క్రీస్తుయేసునందలి జీవాత్మ నియమము: 'క్రీస్తుయేసునందు జీవమునిచ్చు ఆత్మయొక్క నియమము పాపమరణముల నియమమునుండి నన్ను విడిపించెను'",
      "Romans 8:2",
      "For the law of the Spirit of life in Christ Jesus has made me free from the law of sin and death",
      "క్రీస్తుయేసునందు జీవమునిచ్చు ఆత్మయొక్క నియమము పాపమరణముల నియమమునుండి నన్ను విడిపించెను",
      "Like aerodynamics overpowering the law of gravity, the higher law of the Spirit of life breaks the enslaving pull of sin and death.",
      "పరిశుద్ధాత్మ దేవుని జీవ నియమము విశ్వాసిని పాపపు మరియు మరణపు సంకెళ్ళనుండి సంపూర్ణముగా విడుదల చేసెను."
    ],
    [
      "Romans 8:6 spiritual mindedness being life and peace: 'For to be carnally minded is death, but to be spiritually minded is life and peace'",
      "రోమీయులకు 8:6 ఆత్మానుసారమైన మనస్సు జీవమును సమాధానమును: 'శరీరానుసారమైన మనస్సు మరణము; ఆత్మానుసారమైన మనస్సు జీవమును సమాధానమునై యున్నది'",
      "Romans 8:6",
      "For to be carnally minded is death, but to be spiritually minded is life and peace",
      "శరీరానుసారమైన మనస్సు మరణము; ఆత్మానుసారమైన మనస్సు జీవమును సమాధానమునై యున్నది",
      "Fixing thoughts on carnal appetites generates spiritual numbness, but surrendering intellect to the Spirit generates overflowing life and tranquility.",
      "లౌకిక ఆశలపై మనస్సుంచుట మరణహేతువు; పరిశుద్ధాత్మ ఆలోచనలపై మనస్సుంచుటయే నిత్య జీవము మరియు సమాధానము."
    ],
    [
      "Romans 8:10 the Spirit being life because of righteousness: 'And if Christ is in you, the body is dead because of sin, but the Spirit is life because of righteousness'",
      "రోమీయులకు 8:10 నీతినిబట్టి ఆత్మ జీవమై యుండుట: 'క్రీస్తు మీలో ఉన్నయెడల శరీరం పాపవిషయమై మృతమైనను, ఆత్మ నీతివిషయమై జీవమై యున్నది'",
      "Romans 8:10",
      "The body is dead because of sin, but the Spirit is life because of righteousness",
      "శరీరము పాపవిషయమై మృతమైనది గాని, ఆత్మ నీతివిషయమై జీవము కలిగియున్నది",
      "Though physical bodies remain mortal under the lingering curse of Adam, the indwelling Holy Spirit radiates vibrant spiritual vitality.",
      "క్రీస్తు విశ్వాసిలో నివసించుటవలన, శరీరము మర్త్యమైనదైనను ఆత్మ దేవుని నీతిద్వారా సజీవముగా వర్ధిల్లును."
    ],
    [
      "Romans 8:11 the Spirit giving life to mortal bodies: 'He who raised Christ from the dead will also give life to your mortal bodies through His Spirit who dwells in you'",
      "రోమీయులకు 8:11 మర్త్యశరీరములకు జీవమిచ్చు పరిశుద్ధాత్మ: 'యేసును మృతులలోనుండి లేపినవాని ఆత్మ మీలో నివసించినయెడల... మీలో నివసించుచున్న తన ఆత్మద్వారా మీ మర్త్యశరీరములను జీవింపజేయును'",
      "Romans 8:11",
      "Will also give life to your mortal bodies through His Spirit who dwells in you",
      "మీలో నివసించుచున్న తన ఆత్మద్వారా మీ మర్త్యశరీరములను జీవింపజేయును",
      "The same divine agent who raised Jesus' broken body on Easter morning guarantees the bodily resurrection and revitalization of saints.",
      "క్రీస్తును లేపిన పరిశుద్ధాత్మయే అంత్యదినమున విశ్వాసుల మర్త్య శరీరములను అమరత్వముతో సజీవముగా లేపును."
    ],
    [
      "Romans 8:13 mortifying deeds of the body to live: 'For if you live according to the flesh you will die; but if by the Spirit you put to death the deeds of the body, you will live'",
      "రోమీయులకు 8:13 శరీరానుసార క్రియలను చంపి జీవించుట: 'మీరు శరీరానుసారముగా ప్రవర్తించినయెడల చావవలసినవారవుదురు; గాని ఆత్మచేత శరీరపు క్రియలను చంపినయెడల జీవింతురు'",
      "Romans 8:13",
      "If by the Spirit you put to death the deeds of the body, you will live",
      "ఆత్మచేత శరీరపు క్రియలను చంపినయెడల జీవింతురు",
      "Sanctified life is preserved by continuous spiritual warfare, using the Holy Spirit's power to execute sinful habits.",
      "పరిశుద్ధాత్ముని బలముచేత శారీరక దురాశలను సంహరించువాడే నిజమైన ఆత్మీయ జీవమును అనుభవించును."
    ],
    [
      "Romans 14:8 living and dying unto the Lord: 'For if we live, we live to the Lord; and if we die, we die to the Lord. Therefore, whether we live or die, we are the Lord's'",
      "రోమీయులకు 14:8 బ్రదికినను చనిపోయినను ప్రభువువారమై యుండుట: 'మనము బ్రదికినను ప్రభువుకోసమే బ్రదుకుచున్నాము, చనిపోయినను ప్రభువుకోసమే చనిపోవుచున్నాము; కాబట్టి మనము బ్రదికినను చనిపోయినను ప్రభువువారమై యున్నాము'",
      "Romans 14:8",
      "For if we live, we live to the Lord; and if we die, we die to the Lord. Therefore, whether we live or die, we are the Lord's",
      "మనము బ్రదికినను ప్రభువుకోసమే బ్రదుకుచున్నాము, చనిపోయినను ప్రభువుకోసమే చనిపోవుచున్నాము; కాబట్టి మనము బ్రదికినను చనిపోయినను ప్రభువువారమై యున్నాము",
      "Christian life has one supreme axis: complete ownership by Jesus Christ in every breath, sickness, health, and passing.",
      "విశ్వాసియొక్క సమస్త జీవితము ప్రభువుకే అంకితము; బ్రదికినను చనిపోయినను ఆయన స్వాస్థ్యముగా ఉండుటయే ధన్యత."
    ],
    [
      "1 Corinthians 15:22 made alive in Christ: 'For as in Adam all die, even so in Christ all shall be made alive'",
      "1 కొరింథీయులకు 15:22 క్రీస్తునందు అందరును బ్రదికింపబడుట: 'ఆదామునందు అందరు ఏలాగు మృతిపొందుచున్నారో, ఆలాగే క్రీస్తునందు అందరును బ్రదికింపబడుదురు'",
      "1 Corinthians 15:22",
      "For as in Adam all die, even so in Christ all shall be made alive",
      "ఆదామునందు అందరు ఏలాగు మృతిపొందుచున్నారో, ఆలాగే క్రీస్తునందు అందరును బ్రదికింపబడుదురు",
      "Federal headship: fallen humanity inherits mortality from Adam, but all united to Christ receive resurrecting life.",
      "మొదటి ఆదాముద్వారా మరణము సంక్రమించగా, క్రీస్తుద్వారా విశ్వాసులకందరికిని పునరుత్థాన జీవము సిద్ధించెను."
    ],
    [
      "1 Corinthians 15:45 the Last Adam as a life-giving spirit: 'The first man Adam became a living being. The last Adam became a life-giving spirit'",
      "1 కొరింథీయులకు 15:45 కడపటి ఆదాము జీవింపచేయు ఆత్మ: 'మొదటి మనుష్యుడైన ఆదాము జీవాత్మ ఆయెను, కడపటి ఆదాము జీవింపచేయు ఆత్మ ఆయెను'",
      "1 Corinthians 15:45",
      "The first man Adam became a living being. The last Adam became a life-giving spirit",
      "మొదటి మనుష్యుడైన ఆదాము జీవాత్మ ఆయెను, కడపటి ఆదాము జీవింపచేయు ఆత్మ ఆయెను",
      "Adam was merely a recipient of animated breath, but the glorified Christ is the inexhaustible dispenser of eternal life.",
      "మొదటి ఆదాము జీవమును పొందినవాడైతే, క్రీస్తే సమస్త విశ్వాసులను జీవింపజేసే ఆత్మయై యున్నాడు."
    ],
    [
      "2 Corinthians 2:16 the aroma of life leading to life: 'To the one we are the aroma of death leading to death, and to the other the aroma of life leading to life'",
      "2 కొరింథీయులకు 2:16 జీవార్థమైన జీవపు సువాసన: 'నశించువారికి మరణార్థమైన మరణపు వాసనగాను, రక్షింపబడువారికి జీవార్థమైన జీవపు వాసనగాను ఉన్నాము'",
      "2 Corinthians 2:16",
      "To the one we are the aroma of death leading to death, and to the other the aroma of life leading to life",
      "నశించువారికి మరణార్థమైన మరణపు వాసనగాను, రక్షింపబడువారికి జీవార్థమైన జీవపు వాసనగాను ఉన్నాము",
      "The proclamation of the gospel carries supernatural fragrance: imparting eternal life to the receptive, while sealing judgment on the rebellious.",
      "సువార్త సేవకుల పరిచర్య రక్షింపబడువారికి నిత్యజీవ సువాసనగాను, అవిశ్వాసులకు తీర్పుగాను ఉన్నది."
    ],
    [
      "2 Corinthians 3:6 the Spirit giving life over the letter: 'Who also made us sufficient as ministers of the new covenant, not of the letter but of the Spirit; for the letter kills, but the Spirit gives life'",
      "2 కొరింథీయులకు 3:6 అక్షరము చంపును గాని ఆత్మ జీవింపచేయును: 'అక్షరము చంపును గాని ఆత్మ జీవింపచేయును; దేవుడు మమ్మును నిబంధనయొక్క పరిచారకులగుటకు సమర్థులనుగా చేసెను'",
      "2 Corinthians 3:6",
      "For the letter kills, but the Spirit gives life",
      "అక్షరము చంపును గాని ఆత్మ జీవింపచేయును",
      "External legalism only condemns and slaughters sinners, but the Holy Spirit's new covenant grace regenerates and quickens hearts.",
      "బాహ్య ధర్మశాస్త్రపు నియమములు పాపమును గద్దించి చంపును గాని పరిశుద్ధాత్ముడే హృదయమును బ్రతికించి జీవమిచ్చును."
    ],
    [
      "2 Corinthians 4:10 manifesting the life of Jesus in our mortal body: 'Always carrying about in the body the dying of the Lord Jesus, that the life of Jesus also may be manifested in our body'",
      "2 కొరింథీయులకు 4:10 యేసుయొక్క జీవము శరీరమందు ప్రత్యక్షపరచబడుట: 'యేసుయొక్క జీవము మా శరీరమందు ప్రత్యక్షపరచబడుటకై, యేసుయొక్క మరణానుభవమును మా శరీరమందు ఎల్లప్పుడును మోసికొని తిరుగుచున్నాము'",
      "2 Corinthians 4:10",
      "That the life of Jesus also may be manifested in our body",
      "యేసుయొక్క జీవము మా శరీరమందు ప్రత్యక్షపరచబడుటకై",
      "Apostolic suffering is the dark backdrop against which the radiant, supernatural resilience of Jesus' life shines brilliantly.",
      "క్రీస్తుకొరకు శ్రమలను అనుభవించుటద్వారా ఆయన పునరుత్థాన జీవము విశ్వాసి శరీరమందు మహిమగా బయలుపడును."
    ],
    [
      "2 Corinthians 4:11 life of Jesus in mortal flesh: 'For we who live are always delivered to death for Jesus' sake, that the life of Jesus also may be manifested in our mortal flesh'",
      "2 కొరింథీయులకు 4:11 మర్త్యశరీరమందు యేసు జీవము: 'యేసుయొక్క జీవము మా మర్త్యశరీరమందు ప్రత్యక్షపరచబడుటకై, జీవించుచున్న మేము ఎల్లప్పుడును యేసునిమిత్తము మరణమునకు అప్పగింపబడుచున్నాము'",
      "2 Corinthians 4:11",
      "That the life of Jesus also may be manifested in our mortal flesh",
      "యేసుయొక్క జీవము మా మర్త్యశరీరమందు ప్రత్యక్షపరచబడుటకై",
      "Vulnerability and persecution showcase the indestructible reality of Jesus actively sustaining His fragile earthen vessels.",
      "బలహీనమైన మట్టిఘటములవంటి శరీరములో క్రీస్తు జీవశక్తి సంరక్షించబడి ఇతరులకు సాక్ష్యముగా నిలుచును."
    ],
    [
      "2 Corinthians 4:12 death working in apostles but life in the church: 'So then death is working in us, but life in you'",
      "2 కొరింథీయులకు 4:12 మాలో మరణము మీలో జీవము: 'కాబట్టి మరణము మాలో కార్యసాధకమగుచున్నది గాని జీవము మీలో కార్యసాధకమగుచున్నది'",
      "2 Corinthians 4:12",
      "So then death is working in us, but life in you",
      "మరణము మాలో కార్యసాధకమగుచున్నది గాని జీవము మీలో కార్యసాధకమగుచున్నది",
      "Sacrificial pastoral endurance absorbs hardship and martyrdom so that divine life may flourish across the congregation.",
      "సేవకుల త్యాగపూరిత శ్రమలద్వారా సంఘములో క్రీస్తుయొక్క ఆత్మీయ జీవము పరిమళించును."
    ],
    [
      "2 Corinthians 5:4 mortality swallowed up by life: 'That mortality may be swallowed up by life'",
      "2 కొరింథీయులకు 5:4 మర్త్యమైనది జీవముచేత మింగివేయబడుట: 'మర్త్యమైనది జీవముచేత మింగివేయబడునట్లు మేము నివాసమును ధరించుకొనగోరుచున్నాము'",
      "2 Corinthians 5:4",
      "That mortality may be swallowed up by life",
      "మర్త్యమైనది జీవముచేత మింగివేయబడునట్లు",
      "Glorification will consume every ache, frailty, and trace of earthly decay in the overwhelming ocean of resurrection life.",
      "పరలోకపు మహిమ శరీరమును ధరించినప్పుడు సమస్త రోగమరణములు నిత్య జీవముచేత సంపూర్ణముగా మింగివేయబడును."
    ],
    [
      "2 Corinthians 5:15 living no longer for ourselves but for Christ: 'He died for all, that those who live should live no longer for themselves, but for Him who died for them and rose again'",
      "2 కొరింథీయులకు 5:15 క్రీస్తుకొరకే జీవించుట: 'జీవించువారికమీదట తమకొరకు కాక, తమనిమిత్తము మృతిపొంది తిరిగి లేచినవానికొరకే జీవించుటకు ఆయన అందరికొరకు మృతిపొందెను'",
      "2 Corinthians 5:15",
      "Those who live should live no longer for themselves, but for Him who died for them and rose again",
      "జీవించువారికమీదట తమకొరకు కాక, తమనిమిత్తము మృతిపొంది తిరిగి లేచినవానికొరకే జీవించుటకు ఆయన మృతిపొందెను",
      "Redemption abolishes selfish autonomy; every breath belongs to the crucified and resurrected Savior.",
      "క్రీస్తు సిలువ మరణము మనలను విడిపించెను గనుక ఇకపై మన స్వార్థముకొరకు కాక ఆయన మహిమకొరకే జీవించవలెను."
    ],
    [
      "Galatians 2:19 dying to the law that one might live to God: 'For I through the law died to the law that I might live to God'",
      "గలతీయులకు 2:19 దేవుని నిమిత్తము జీవించుటకు ధర్మశాస్త్రము విషయమై చనిపోవుట: 'నేను దేవుని నిమిత్తము జీవించునట్లు ధర్మశాస్త్రమువలన ధర్మశాస్త్రము విషయమై చనిపోతిని'",
      "Galatians 2:19",
      "For I through the law died to the law that I might live to God",
      "నేను దేవుని నిమిత్తము జీవించునట్లు ధర్మశాస్త్రమువలన ధర్మశాస్త్రము విషయమై చనిపోతిని",
      "The condemnation of the law drove Paul to the cross, ending self-justification so that true spiritual life toward God could commence.",
      "స్వనీతిని విడిచి క్రీస్తు సిలువద్వారా ధర్మశాస్త్రపు శాపమునకు చనిపోయి దేవునికొరకే సజీవముగా జీవించుట."
    ],
    [
      "Galatians 2:20 Christ living in me: 'I have been crucified with Christ; it is no longer I who live, but Christ lives in me; and the life which I now live in the flesh I live by faith in the Son of God'",
      "గలతీయులకు 2:20 నాలో క్రీస్తే జీవించుచున్నాడు: 'నేను క్రీస్తుతోకూడ సిలువ వేయబడియున్నాను; ఇకను జీవించువాడను నేను కాను, క్రీస్తే నాయందు జీవించుచున్నాడు; నేను ఇప్పుడు శరీరమందు జీవించుచున్న జీవితము నన్ను ప్రేమించి నాకొరకు తన్నుతాను అప్పగించుకొనిన దేవుని కుమారునియందలి విశ్వాసమువలన జీవించుచున్నాను'",
      "Galatians 2:20",
      "I have been crucified with Christ; it is no longer I who live, but Christ lives in me; and the life which I now live in the flesh I live by faith in the Son of God, who loved me and gave Himself for me",
      "నేను క్రీస్తుతోకూడ సిలువ వేయబడియున్నాను; ఇకను జీవించువాడను నేను కాను, క్రీస్తే నాయందు జీవించుచున్నాడు; నేను ఇప్పుడు శరీరమందు జీవించుచున్న జీవితము నన్ను ప్రేమించి నాకొరకు తన్నుతాను అప్పగించుకొనిన దేవుని కుమారునియందలి విశ్వాసమువలన జీవించుచున్నాను",
      "The heart of Christian existence: ego is crucified, and Christ occupies the center, living His holy life through our mortal frame by faith.",
      "స్వీయ అహంకారము సిలువవేయబడి క్రీస్తే అంతరంగములో నివసించుచుండగా విశ్వాసముతో దైవిక జీవితమును గడుపుట."
    ],
    [
      "Galatians 3:11 the just living by faith: 'The just shall live by faith'",
      "గలతీయులకు 3:11 విశ్వాసమువలన నీతిమంతుడై బ్రదుకుట: 'నీతిమంతుడు విశ్వాసమూలముగా జీవించును'",
      "Galatians 3:11",
      "No one is justified by the law in the sight of God is evident, for 'the just shall live by faith'",
      "ధర్మశాస్త్రమువలన ఎవడును దేవునియెదుట నీతిమంతుడని తీర్చబడడను సంగతి స్పష్టమే; ఏలయనగా నీతిమంతుడు విశ్వాసమూలముగా జీవించును",
      "No sinner can achieve life through legalism; life is granted purely through faith in Christ's finished work.",
      "ధర్మశాస్త్రపు క్రియలవలన ఏ మనుష్యుడును జీవము పొందలేడు; కేవలము క్రీస్తునందలి విశ్వాసమువలననే బ్రదుకును."
    ],
    [
      "Galatians 3:21 the law unable to impart life: 'For if there had been a law given which could have given life, truly righteousness would have been by the law'",
      "గలతీయులకు 3:21 ధర్మశాస్త్రము జీవమియ్యలేకపోవుట: 'జీవమునియ్యజాలిన ధర్మశాస్త్రమేదైన ఇవ్వబడియుండినయెడల నిశ్చయముగా నీతి ధర్మశాస్త్రమూలముగానే కలుగును'",
      "Galatians 3:21",
      "For if there had been a law given which could have given life, truly righteousness would have been by the law",
      "జీవమునియ్యజాలిన ధర్మశాస్త్రమేదైన ఇవ్వబడియుండినయెడల నిశ్చయముగా నీతి ధర్మశాస్త్రమూలముగానే కలుగును",
      "The law can prescribe moral duty, but lacks the supernatural power to resuscitate a dead heart; life comes solely through Christ.",
      "ధర్మశాస్త్రము ఆజ్ఞాపించగలదు గాని జీవమును పోయలేదు; క్రీస్తు కృప మాత్రమే చచ్చిన పాపికి నూతన జీవమునిచ్చును."
    ],
    [
      "Galatians 5:25 living and walking in the Spirit: 'If we live in the Spirit, let us also walk in the Spirit'",
      "గలతీయులకు 5:25 ఆత్మానుసారముగా జీవించి నడుచుకొనుట: 'మనము ఆత్మవలన జీవించువారమైతిమా ఆత్మను అనుసరించి క్రమముగా నడుచుకొందము'",
      "Galatians 5:25",
      "If we live in the Spirit, let us also walk in the Spirit",
      "మనము ఆత్మవలన జీవించువారమైతిమా ఆత్మను అనుసరించి క్రమముగా నడుచుకొందము",
      "Spiritual regeneration must be matched by dynamic, step-by-step obedience aligned with the Holy Spirit's guidance.",
      "పరిశుద్ధాత్మవలన నూతన జన్మ పొందిన విశ్వాసి అనుదిన జీవితములో ఆత్మానుసారమైన పరిశుద్ధ నడతను కలిగియుండవలెను."
    ]
  ];

  return data.map(item => ({
    easyQ: `What transforming doctrine of spiritual vitality and growth is taught in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన ఆత్మీయ ఎదుగుదల మరియు జీవ సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does union with Christ manifest abundant life and power over sin?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం క్రీస్తుతోటి ఐక్యత విశ్వాసిలో సమృద్ధియైన జీవమును పాపముపై విజయమును ఎలా ప్రసాదించును?`,
    hardQ: `What theological reality does ${item[2]} establish regarding walking in the Spirit, spiritual resurrection, and victorious life?`,
    hardQTe: `${item[2]} ప్రకారం ఆత్మానుసారముగా నడుచుకొనుటను మరియు క్రీస్తు జీవపు మహిమను గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty cedar granaries in the hills of Ephraim", "He commanded seventy days of sackcloth at the stream of Kidron", "He cast thirty silver shields into the salt sea of Sodom"],
    optionsTelugu: [item[4], "ఎఫ్రాయిము కొండలలో నలభై దేవదారు ధాన్యాగారములను కట్టించెను", "కీద్రోను వాగుయొద్ద డెబ్బై దినముల గోనెపట్ట ధారణను ఆజ్ఞాపించెను", "సొదొమ ఉప్పు సముద్రములో ముప్పై వెండి డాలులను పడవేసెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Mastery Facts for Life (Eternal Life, Book of Life, Crown of Life, Tree of Life, River of Life)
function buildLifeMastery() {
  const data = [
    [
      "Galatians 6:8 sowing to the Spirit to reap everlasting life: 'He who sows to the Spirit will of the Spirit reap everlasting life'",
      "గలతీయులకు 6:8 ఆత్మవిషయమై విత్తి నిత్యజీవమును కోయుట: 'ఆత్మవిషయమై విత్తువాడు ఆత్మనుండి నిత్యజీవము అను పంట కోయును'",
      "Galatians 6:8",
      "He who sows to the Spirit will of the Spirit reap everlasting life",
      "ఆత్మవిషయమై విత్తువాడు ఆత్మనుండి నిత్యజీవము అను పంట కోయును",
      "Every spiritual investment in prayer, holiness, and love yields a glorious, unending harvest of eternal life.",
      "పరిశుద్ధాత్మ చిత్తమునకు తగినట్లు జీవించువాడు అంత్యమున దేవునివలన నిత్యజీవమను శాశ్వత పంటను కోయును."
    ],
    [
      "Ephesians 2:1 made alive when dead in trespasses: 'And you He made alive, who were dead in trespasses and sins'",
      "ఎఫెసీయులకు 2:1 అపరాధములలో చచ్చిన మనలను బ్రదికించుట: 'మీ అపరాధములచేతను పాపములచేతను మీరు చచ్చినవారై యుండగా ఆయన మిమ్మును బ్రదికించెను'",
      "Ephesians 2:1",
      "And you He made alive, who were dead in trespasses and sins",
      "మీ అపరాధములచేతను పాపములచేతను మీరు చచ్చినవారై యుండగా ఆయన మిమ్మును బ్రదికించెను",
      "Regeneration is spiritual resuscitation: the sinner was not merely sick or wounded, but spiritually dead until Christ breathed life.",
      "పాపపు స్థితిలో నైతికముగా చచ్చిన స్థితిలో ఉన్న మానవుని క్రీస్తు తన కృపచేత నూతనముగా బ్రదికించెను."
    ],
    [
      "Ephesians 2:4-5 rich in mercy making us alive together with Christ: 'Even when we were dead in trespasses, made us alive together with Christ (by grace you have been saved)'",
      "ఎఫెసీయులకు 2:4-5 క్రీస్తుతోకూడ మనలను జీవింపచేయుట: 'కనికర సంపన్నుడైన దేవుడు మనలను క్రీస్తుతోకూడ బ్రదికించెను; కృపచేత మీరు రక్షింపబడియున్నారు'",
      "Ephesians 2:5",
      "Even when we were dead in trespasses, made us alive together with Christ (by grace you have been saved)",
      "మనము అపరాధములచేత చచ్చినవారమై యుండినప్పుడు మనలను క్రీస్తుతోకూడ బ్రదికించెను; కృపచేత మీరు రక్షింపబడియున్నారు",
      "Grace bridges the infinite abyss: God united us to Christ's resurrection, lifting corpses into co-enthroned heavenly life.",
      "దేవుని అపార కనికరము సిలువవేసి లేపబడిన క్రీస్తుతోకూడ మనలను ఆత్మీయముగా బ్రదికించి రక్షించెను."
    ],
    [
      "Ephesians 4:18 alienated from the life of God: 'Having their understanding darkened, being alienated from the life of God, because of the ignorance that is in them'",
      "ఎఫెసీయులకు 4:18 దేవుని జీవములోనుండి వేరుపరచబడుట: 'తమ బుద్ధియందు అంధకారము గలవారై, తమ అజ్ఞానమువలన దేవునివలన కలుగు జీవములోనుండి వేరుపరచబడినవారై యున్నారు'",
      "Ephesians 4:18",
      "Being alienated from the life of God, because of the ignorance that is in them, because of the blindness of their heart",
      "తమ బుద్ధియందు అంధకారము గలవారై, తమ హృదయ కాఠిన్యమువలన కలిగిన అజ్ఞానముచేత దేవునివలన కలుగు జీవములోనుండి వేరుపరచబడినవారై యున్నారు",
      "The tragedy of unregenerate paganism: willful spiritual blindness severs humanity from the divine fountain of life.",
      "హృదయ కాఠిన్యము మరియు అవిశ్వాసము మానవుని దేవుని జీవమునుండి వేరుచేసి ఆత్మీయ అంధకారములో పడద్రోయును."
    ],
    [
      "Philippians 1:20 Christ magnified by life or death: 'Christ will be magnified in my body, whether by life or by death'",
      "ఫిలిప్పీయులకు 1:20 బ్రదుకువలననైనను మరణమువలననైనను క్రీస్తు ఘనపరచబడుట: 'బ్రదుకువలననైనను మరణమువలననైనను క్రీస్తు నా శరీరమందు ఘనపరచబడును'",
      "Philippians 1:20",
      "Christ will be magnified in my body, whether by life or by death",
      "బ్రదుకువలననైనను మరణమువలననైనను క్రీస్తు నా శరీరమందు ఘనపరచబడును",
      "The supreme goal of existence: living or dying as an altar where Christ's glory is visibly exalted.",
      "భూమిపై బ్రదికినను లేక క్రీస్తుకొరకు ప్రాణము అర్పించినను ఆయన నామము ఘనపరచబడుటయే పరమ సంకల్పము."
    ],
    [
      "Philippians 1:21 to live is Christ and to die is gain: 'For to me, to live is Christ, and to die is gain'",
      "ఫిలిప్పీయులకు 1:21 నాకైతే బ్రదుకుట క్రీస్తే చావైతే లాభము: 'నాకైతే బ్రదుకుట క్రీస్తే, చావైతే లాభము'",
      "Philippians 1:21",
      "For to me, to live is Christ, and to die is gain",
      "నాకైతే బ్రదుకుట క్రీస్తే, చావైతే లాభము",
      "The ultimate Christian motto: earthly life is defined entirely by serving Christ, while physical death is graduation into direct communion with Him.",
      "భూమిమీద జీవించుట క్రీస్తు పరిచర్యయే; మరణము ఆయనను ముఖాముఖిగా చూసే పరమ లాభము."
    ],
    [
      "Philippians 2:16 holding fast the word of life: 'Holding fast the word of life, so that I may rejoice in the day of Christ'",
      "ఫిలిప్పీయులకు 2:16 జీవవాక్యమును పట్టుకొనుట: 'క్రీస్తు దినమందు నేను సంతోషించునట్లు జీవవాక్యమును పట్టుకొని లోకమందు జ్యోతులవలె ప్రకాశించుడి'",
      "Philippians 2:16",
      "Holding fast the word of life, so that I may rejoice in the day of Christ",
      "క్రీస్తు దినమందు నేను సంతోషించునట్లు జీవవాక్యమును పట్టుకొనుడి",
      "In a crooked generation, saints illuminate darkness by faithfully guarding and displaying the life-giving gospel.",
      "ఈ లోకపు అంధకారములో విశ్వాసులు దేవుని జీవవాక్యమును గట్టిగా పట్టుకొని జ్యోతులవలె వెలగవలెను."
    ],
    [
      "Philippians 4:3 names written in the Book of Life: 'With Clement also, and the rest of my fellow workers, whose names are in the Book of Life'",
      "ఫిలిప్పీయులకు 4:3 జీవగ్రంథమందు పేర్లు వ్రాయబడుట: 'క్లేమెంటుతోను నా తోడిపనివారితోను సువార్తపనిలో నాతోకూడ ప్రయాసపడినవారే; వారి పేర్లు జీవగ్రంథమందున్నవి'",
      "Philippians 4:3",
      "Whose names are in the Book of Life",
      "వారి పేర్లు జీవగ్రంథమందున్నవి",
      "The celestial registry: faithful servants have their names indelibly recorded in heaven's golden roster of eternal life.",
      "దేవుని పరిచర్యలో నమ్మకముగా ప్రయాసపడిన భక్తుల పేర్లు పరలోకపు జీవగ్రంథమందు భద్రపరచబడియున్నవి."
    ],
    [
      "Colossians 1:27 Christ in you the hope of glory: 'Christ in you, the hope of glory'",
      "కొలొస్సయులకు 1:27 మీయందున్న క్రీస్తు మహిమ నిరీక్షణ: 'అన్యజనులలో ఈ మర్మముయొక్క మహిమైశ్వర్యము ఎట్టిదనగా, మీయందున్న క్రీస్తు మహిమ నిరీక్షణయై యున్నాడు'",
      "Colossians 1:27",
      "Christ in you, the hope of glory",
      "మీయందున్న క్రీస్తు మహిమ నిరీక్షణయై యున్నాడు",
      "The indwelling vitality of the living Christ inside the believer is the absolute pledge of future resurrected splendor.",
      "విశ్వాసి అంతరంగములో నివసించే క్రీస్తుయే నిత్య పరలోక మహిమకు తిరుగులేని ఆధారం."
    ],
    [
      "Colossians 2:13 made alive together with Him having forgiven all trespasses: 'And you, being dead in your trespasses and the uncircumcision of your flesh, He has made alive together with Him, having forgiven you all trespasses'",
      "కొలొస్సయులకు 2:13 సమస్త అపరాధములు క్షమించి క్రీస్తుతోకూడ జీవింపచేయుట: 'మీ అపరాధములవలనను మీ శరీరమందలి సున్నతిలేకపోవుటవలనను మీరు మృతులై యుండగా, ఆయన మీ అపరాధములన్నిటిని క్షమించి క్రీస్తుతోకూడ మిమ్మును జీవింపచేసెను'",
      "Colossians 2:13",
      "He has made alive together with Him, having forgiven you all trespasses",
      "ఆయన మీ అపరాధములన్నిటిని క్షమించి క్రీస్తుతోకూడ మిమ్మును జీవింపచేసెను",
      "Total pardon precedes resurrection: God obliterated our guilt and animated us with the shared life of His risen Son.",
      "క్రీస్తు సిలువద్వారా మన అపరాధములన్నిటిని పరిహరించి మనలను తనతోకూడ నూతనముగా జీవింపజేసెను."
    ],
    [
      "Colossians 3:3 your life hidden with Christ in God: 'For you died, and your life is hidden with Christ in God'",
      "కొలొస్సయులకు 3:3 మీ జీవము క్రీస్తుతోకూడ దేవునియందు దాచబడియున్నది: 'ఏలయనగా మీరు చనిపోతిరి, మీ జీవము క్రీస్తుతోకూడ దేవునియందు దాచబడియున్నది'",
      "Colossians 3:3",
      "For you died, and your life is hidden with Christ in God",
      "మీరు చనిపోతిరి, మీ జీవము క్రీస్తుతోకూడ దేవునియందు దాచబడియున్నది",
      "The believer's true identity and eternal life are sequestered in the invulnerable sanctuary of God's presence in Christ.",
      "విశ్వాసియొక్క నిజమైన జీవము ఈ లోకములో కాక క్రీస్తుతోకూడ దేవుని పరిశుద్ధ సన్నిధిలో సురక్షితముగా దాచబడియున్నది."
    ],
    [
      "Colossians 3:4 Christ who is our life appearing in glory: 'When Christ who is our life appears, then you also will appear with Him in glory'",
      "కొలొస్సయులకు 3:4 మనకు జీవమైయున్న క్రీస్తు ప్రత్యక్షమగుట: 'మనకు జీవమైయున్న క్రీస్తు ప్రత్యక్షమైనప్పుడు మీరును ఆయనతోకూడ మహిమయందు ప్రత్యక్షపరచబడుదురు'",
      "Colossians 3:4",
      "When Christ who is our life appears, then you also will appear with Him in glory",
      "మనకు జీవమైయున్న క్రీస్తు ప్రత్యక్షమైనప్పుడు మీరును ఆయనతోకూడ మహిమయందు ప్రత్యక్షపరచబడుదురు",
      "Christ is not merely a component of our life; He is our very life! When He returns, our hidden glory will be fully unveiled.",
      "క్రీస్తే స్వయముగా మన జీవమై యున్నాడు; ఆయన ద్వితీయ రాకడలో పరిశుద్ధులు ఆయనతోకూడ మహిమలో ప్రత్యక్షమగుదురు."
    ],
    [
      "1 Thessalonians 5:10 living together with Christ whether wake or sleep: 'Who died for us, that whether we wake or sleep, we should live together with Him'",
      "1 థెస్సలొనీకయులకు 5:10 మెలకువగా ఉన్నను నిద్రించినను ఆయనతోకూడ జీవించుట: 'మనము మెలకువగా ఉన్నను నిద్రించుచున్నను తనతోకూడ జీవించునట్లు ఆయన మనకొరకు మృతిపొందెను'",
      "1 Thessalonians 5:10",
      "That whether we wake or sleep, we should live together with Him",
      "మనము మెలకువగా ఉన్నను నిద్రించుచున్నను తనతోకూడ జీవించునట్లు ఆయన మనకొరకు మృతిపొందెను",
      "Physical life or physical death cannot interrupt the eternal fellowship we share with our resurrected Redeemer.",
      "భూమిపై సజీవులముగా ఉన్నను మరణించినను క్రీస్తుతోకూడ నిత్యము జీవించుటయే విశ్వాసికి గల నిశ్చయత."
    ],
    [
      "1 Timothy 1:16 Paul as a pattern for eternal life: 'For this reason I obtained mercy, that in me first Jesus Christ might show all longsuffering, as a pattern to those who are going to believe on Him for everlasting life'",
      "1 తిమోతి 1:16 నిత్యజీవముకొరకు విశ్వసించువారికి మాదిరి: 'నిత్యజీవముకొరకు తనయందు విశ్వాసముంచబోవువారికి నేను మాదిరిగా ఉండునట్లు... నాలోనే యేసుక్రీస్తు తన పూర్ణమైన దీర్ఘశాంతమును కనుపరచుటకు నేను కనికరింపబడితిని'",
      "1 Timothy 1:16",
      "As a pattern to those who are going to believe on Him for everlasting life",
      "నిత్యజీవముకొరకు తనయందు విశ్వాసముంచబోవువారికి నేను మాదిరిగా ఉండునట్లు",
      "The conversion of the chief of sinners proves that no rebel is beyond the reach of grace and everlasting life.",
      "పాపులలో ప్రధానుడైన పౌలు కనికరింపబడుట నిత్యజీవమును పొందబోయే సర్వ తరముల విశ్వాసులకు నిరీక్షణ మాదిరి."
    ],
    [
      "1 Timothy 4:8 godliness having promise of the present and coming life: 'Godliness is profitable for all things, having promise of the life that now is and of that which is to come'",
      "1 తిమోతి 4:8 దైవభక్తికి ఇహపర జీవముల వాగ్దానముండుట: 'దైవభక్తి ప్రస్తుతజీవము విషయములోను రాబోవు జీవము విషయములోను వాగ్దానముతో కూడినదైనందున అది అన్నిటియందును ప్రయోజనకరము'",
      "1 Timothy 4:8",
      "Godliness is profitable for all things, having promise of the life that now is and of that which is to come",
      "దైవభక్తి ప్రస్తుతజీవము విషయములోను రాబోవు జీవము విషయములోను వాగ్దానముతో కూడినదైనందున అది అన్నిటియందును ప్రయోజనకరము",
      "Spiritual devotion enriches everyday mortal existence with peace while simultaneously anchoring the soul in future glory.",
      "దేవుని భయభక్తులలో జీవించుట ప్రస్తుత లోకములోను మరియు రాబోవు నిత్యత్వములోను అపార ఆశీర్వాదకరము."
    ],
    [
      "1 Timothy 6:12 laying hold on eternal life: 'Fight the good fight of faith, lay hold on eternal life, to which you were also called and have confessed the good confession'",
      "1 తిమోతి 6:12 నిత్యజీవమును చేపట్టుట: 'విశ్వాససంబంధమైన మంచి పోరాటము పోరాడుము, నిత్యజీవమును చేపట్టుము; దానికొరకే నీవు పిలువబడి అనేకులయెదుట మంచి ఒప్పుకోలు ఒప్పుకొంటివి'",
      "1 Timothy 6:12",
      "Fight the good fight of faith, lay hold on eternal life, to which you were also called",
      "విశ్వాససంబంధమైన మంచి పోరాటము పోరాడుము, నిత్యజీవమును చేపట్టుము; దానికొరకే నీవు పిలువబడితివి",
      "Do not merely observe eternal life theoretically; seize it with vigorous faith, enduring battle until victory is secured.",
      "విశ్వాస పోరాటమును జయించి దేవుడు పిలిచిన నిత్యజీవ బహుమానమును గట్టిగా పట్టుకొనవలెను."
    ],
    [
      "1 Timothy 6:19 laying hold on eternal life through good works: 'Storing up for themselves a good foundation for the time to come, that they may lay hold on eternal life'",
      "1 తిమోతి 6:19 నిజమైన జీవమును సంపాదించుకొనుట: 'తాము నిజమైన జీవమును సంపాదించుకొనునట్లు, రాబోవు కాలమునకు మంచి పునాదియైన ధనమును తమకొరకు సమకూర్చుకొనుడి'",
      "1 Timothy 6:19",
      "That they may lay hold on eternal life",
      "తాము నిజమైన జీవమును సంపాదించుకొనునట్లు",
      "Generous distribution of earthly wealth converts fleeting currency into an eternal foundation in the kingdom of life.",
      "ఈ లోక ధనమును దేవుని రాజ్యముకొరకు వెచ్చించుట రాబోవు కాలములో నిజమైన నిత్యజీవమును పొందుకొనుటకు పునాది."
    ],
    [
      "2 Timothy 1:1 the promise of life in Christ Jesus: 'Paul, an apostle of Jesus Christ by the will of God, according to the promise of life which is in Christ Jesus'",
      "2 తిమోతి 1:1 క్రీస్తుయేసునందలి జీవపు వాగ్దానము: 'క్రీస్తుయేసునందలి జీవపు వాగ్దానమునుబట్టి దేవుని చిత్తమువలన క్రీస్తుయేసు అపొస్తలుడైన పౌలు'",
      "2 Timothy 1:1",
      "According to the promise of life which is in Christ Jesus",
      "క్రీస్తుయేసునందలి జీవపు వాగ్దానమునుబట్టి",
      "Apostolic mission is fueled by God's solemn pledge of supernatural, eternal life resident exclusively in Jesus.",
      "క్రీస్తుయేసునందు వెల్లడియైన నిత్యజీవపు వాగ్దానమే సువార్త పరిచర్యకు బలమైన మూలస్తంభము."
    ],
    [
      "2 Timothy 1:10 Christ abolishing death and bringing life and immortality to light: 'Our Savior Jesus Christ, who has abolished death and brought life and immortality to light through the gospel'",
      "2 తిమోతి 1:10 మరణమును రద్దుపరచి జీవమును వెలుగులోనికి తెచ్చుట: 'మన రక్షకుడైన క్రీస్తుయేసు ప్రత్యక్షతవలన బయలుపరచబడెను; ఆయన మరణమును రద్దుపరచి సువార్తవలన జీవమును అక్షయతను వెలుగులోనికి తెచ్చెను'",
      "2 Timothy 1:10",
      "Who has abolished death and brought life and immortality to light through the gospel",
      "ఆయన మరణమును రద్దుపరచి సువార్తవలన జీవమును అక్షయతను వెలుగులోనికి తెచ్చెను",
      "Christ dismantled death's legal authority and illuminated the dazzling reality of incorruptible resurrection life through the gospel.",
      "క్రీస్తు తన పునరుత్థానముద్వారా మరణముయొక్క అధికారమును కూల్చివేసి అక్షయమైన నిత్యజీవమును మానవాళికి అనుగ్రహించెను."
    ],
    [
      "Titus 1:2 hope of eternal life promised before time began: 'In hope of eternal life which God, who cannot lie, promised before time began'",
      "తీతుకు 1:2 అనాదికాలమునకు ముందే వాగ్దానము చేయబడిన నిత్యజీవ నిరీక్షణ: 'అబద్ధమాడనేరని దేవుడు అనాదికాలమునకు ముందే వాగ్దానము చేసిన నిత్యజీవమునుగూర్చిన నిరీక్షణనుబట్టి'",
      "Titus 1:2",
      "In hope of eternal life which God, who cannot lie, promised before time began",
      "అబద్ధమాడనేరని దేవుడు అనాదికాలమునకు ముందే వాగ్దానము చేసిన నిత్యజీవమునుగూర్చిన నిరీక్షణనుబట్టి",
      "Our eternal security is anchored in eternity past: God's immutable integrity guarantees the life He promised before creation.",
      "సృష్టి ఆరంభమునకు పూర్వమే అబద్ధమాడని దేవుడు నిత్యజీవమును వాగ్దానము చేసి మన నిరీక్షణను స్థిరపరచెను."
    ],
    [
      "Titus 3:7 justified by grace becoming heirs of eternal life: 'That having been justified by His grace we should become heirs according to the hope of eternal life'",
      "తీతుకు 3:7 కృపవలన నీతిమంతులమై నిత్యజీవపు వారసులమగుట: 'మనము ఆయన కృపవలన నీతిమంతులమని తీర్చబడి, నిత్యజీవమునుగూర్చిన నిరీక్షణనుబట్టి వారసులమగునట్లు పరిశుద్ధాత్మను మనమీద కుమ్మరించెను'",
      "Titus 3:7",
      "That having been justified by His grace we should become heirs according to the hope of eternal life",
      "మనము ఆయన కృపవలన నీతిమంతులమని తీర్చబడి, నిత్యజీవమునుగూర్చిన నిరీక్షణనుబట్టి వారసులమగునట్లు",
      "Justification clears our debt, while divine adoption instates us as full legal heirs of God's everlasting life.",
      "ఉచిత కృపచేత నీతిమంతులుగా తీర్చబడిన విశ్వాసులు నిత్యజీవపు పరమ వారసత్వమును పొందుదురు."
    ],
    [
      "Hebrews 7:16 the power of an endless life: 'Who has come, not according to the law of a fleshly commandment, but according to the power of an endless life'",
      "హెబ్రీయులకు 7:16 నాశనములేని జీవపు శక్తి: 'శరీరసంబంధమైన ఆజ్ఞగల ధర్మశాస్త్రమునుబట్టి కాక, నాశనములేని జీవముయొక్క శక్తినిబట్టి యాజకుడాయెను'",
      "Hebrews 7:16",
      "Not according to the law of a fleshly commandment, but according to the power of an endless life",
      "శరీరసంబంధమైన ఆజ్ఞగల ధర్మశాస్త్రమునుబట్టి కాక, నాశనములేని జీవముయొక్క శక్తినిబట్టి యాజకుడాయెను",
      "Levitical priests died, but Christ's high priesthood is eternal, founded on the indestructible dynamism of His endless life.",
      "క్రీస్తు ప్రధానయాజకత్వము నాశనములేని నిత్య జీవపు శక్తిపై ఆధారపడి నిరంతరము నిలుచును."
    ],
    [
      "Hebrews 10:20 consecrated by a new and living way: 'By a new and living way which He consecrated for us, through the veil, that is, His flesh'",
      "హెబ్రీయులకు 10:20 జీవముగల నూతన మార్గము: 'ఆయన తన శరీరమను తెరద్వారా మనకొరకు ప్రతిష్ఠించిన నూతనమైనదియు, జీవముగలదియునైన మార్గమున'",
      "Hebrews 10:20",
      "By a new and living way which He consecrated for us, through the veil, that is, His flesh",
      "ఆయన తన శరీరమను తెరద్వారా మనకొరకు ప్రతిష్ఠించిన నూతనమైనదియు, జీవముగలదియునైన మార్గమున",
      "Through Christ's torn flesh, an ever-living, dynamic access directly into the holy presence of God is opened forever.",
      "క్రీస్తు సిలువ శరీరముద్వారా పరమ తండ్రి సన్నిధికి జీవముగల నూతన మార్గము మనకొరకు తెరవబడెను."
    ],
    [
      "Hebrews 10:38 the just living by faith: 'Now the just shall live by faith; but if anyone draws back, My soul has no pleasure in him'",
      "హెబ్రీయులకు 10:38 నీతిమంతుడు విశ్వాసమూలముగా బ్రదుకుట: 'నా నీతిమంతుడు విశ్వాసమూలముగా జీవించును; అతడు వెనుకతీసినయెడల నా ఆత్మ అతనియందు సంతోషింపదు'",
      "Hebrews 10:38",
      "Now the just shall live by faith; but if anyone draws back, My soul has no pleasure in him",
      "నా నీతిమంతుడు విశ్వాసమూలముగా జీవించును; అతడు వెనుకతీసినయెడల నా ఆత్మ అతనియందు సంతోషింపదు",
      "Persevering faith is the sole avenue of true spiritual life; shrinking back in fear invites divine displeasure.",
      "శ్రమలలో వెనుకడుగు వేయక దేవునియందు విశ్వాసముంచి ముందుకు సాగువాడే నిత్యము జీవించును."
    ],
    [
      "Hebrews 12:9 subjection to the Father of spirits and live: 'Shall we not much more readily be in subjection to the Father of spirits and live?'",
      "హెబ్రీయులకు 12:9 ఆత్మల తండ్రికి లోబడి జీవించుట: 'ఆత్మల తండ్రికి మరి ఎక్కువగా లోబడి బ్రదుకవలెను గదా'",
      "Hebrews 12:9",
      "Shall we not much more readily be in subjection to the Father of spirits and live?",
      "ఆత్మల తండ్రికి మరి ఎక్కువగా లోబడి బ్రదుకవలెను గదా",
      "Submitting to divine paternal discipline purges sinful dross and leads into deep, holy vitality.",
      "తండ్రియైన దేవుని శిక్షణకు వినయముతో లోబడుట విశ్వాసికి పరిశుద్ధతను మరియు నిజమైన జీవమును చేకూర్చును."
    ],
    [
      "James 1:12 the crown of life for enduring temptation: 'Blessed is the man who endures temptation; for when he has been approved, he will receive the crown of life which the Lord has promised to those who love Him'",
      "యాకోబు 1:12 శోధనను సహించువాడు జీవకిరీటము పొందుట: 'శోధన సహించువాడు ధన్యుడు; అతడు శోధనకు నిలిచినవాడై ప్రభువు తన్ను ప్రేమించువారికి వాగ్దానము చేసిన జీవకిరీటము పొందును'",
      "James 1:12",
      "He will receive the crown of life which the Lord has promised to those who love Him",
      "ప్రభువు తన్ను ప్రేమించువారికి వాగ్దానము చేసిన జీవకిరీటము పొందును",
      "Tested fidelity under fiery trials qualifies the saint for the royal diadem of everlasting life bestowed by Christ.",
      "శోధనలను సహించి దేవునియందలి ప్రేమను కాపాడుకొను భక్తునికి ప్రభువు నిత్య జీవకిరీటమును ప్రసాదించును."
    ],
    [
      "James 4:14 mortal life as a fleeting vapor: 'For what is your life? It is even a vapor that appears for a little time and then vanishes away'",
      "యాకోబు 4:14 ఆవిరివంటి అల్ప జీవితము: 'మీ జీవము ఏపాటిది? మీరు కొంచెముసేపు కనబడి అంతలోనే మాయమైపోవు ఆవిరివంటివారే'",
      "James 4:14",
      "For what is your life? It is even a vapor that appears for a little time and then vanishes away",
      "మీ జీవము ఏపాటిది? మీరు కొంచెముసేపు కనబడి అంతలోనే మాయమైపోవు ఆవిరివంటివారే",
      "Human existence is fragile and transient like morning mist, demanding that we live every breath for God's eternal will.",
      "భూలోక జీవితము తాత్కాలికమైన ఆవిరివంటిది గనుక గర్వించక దేవుని చిత్తానుసారముగా బ్రదుకవలెను."
    ],
    [
      "1 Peter 1:3 begotten again to a living hope: 'Blessed be the God and Father of our Lord Jesus Christ, who according to His abundant mercy has begotten us again to a living hope through the resurrection of Jesus Christ from the dead'",
      "1 పేతురు 1:3 సజీవమైన నిరీక్షణ: 'యేసుక్రీస్తు మృతులలోనుండి లేచుటవలన జీవముతోకూడిన నిరీక్షణ మనకు కలుగునట్లు... తన విశేష కనికరముచొప్పున మనలను మరల జన్మింపజేసెను'",
      "1 Peter 1:3",
      "Has begotten us again to a living hope through the resurrection of Jesus Christ from the dead",
      "యేసుక్రీస్తు మృతులలోనుండి లేచుటవలన జీవముతోకూడిన నిరీక్షణ మనకు కలుగునట్లు మనలను మరల జన్మింపజేసెను",
      "Our regeneration is tied to Christ's empty tomb, birth-marking us into an indestructible living expectation.",
      "క్రీస్తు పునరుత్థానము ద్వారా దేవుడు మనలను నూతనముగా జన్మింపజేసి సజీవ నిరీక్షణతో నింపెను."
    ],
    [
      "1 Peter 2:24 dying to sins to live for righteousness: 'That we, having died to sins, might live for righteousness-by whose stripes you were healed'",
      "1 పేతురు 2:24 పాపముల విషయమై చనిపోయి నీతి విషయమై జీవించుట: 'మనము పాపముల విషయమై చనిపోయి, నీతివిషయమై జీవించునట్లు, ఆయన తానే తన శరీరమందు మన పాపములను మ్రానుమీద మోసుకొనెను'",
      "1 Peter 2:24",
      "That we, having died to sins, might live for righteousness-by whose stripes you were healed",
      "మనము పాపముల విషయమై చనిపోయి, నీతివిషయమై జీవించునట్లు, ఆయన తానే తన శరీరమందు మన పాపములను మ్రానుమీద మోసుకొనెను",
      "The vicarious atonement achieved our moral emancipation: dead to sin's tyranny, we are free to live for holy righteousness.",
      "క్రీస్తు సిలువ గాయములద్వారా పాపపు రోగమునుండి స్వస్థతపొంది నీతికొరకు జీవించే నూతన శక్తి సిద్ధించెను."
    ],
    [
      "1 Peter 3:7 husbands and wives as heirs together of the grace of life: 'Giving honor to the wife, as to the weaker vessel, and as being heirs together of the grace of life, that your prayers may not be hindered'",
      "1 పేతురు 3:7 జీవమను కృపావరములో పాలివారైన భార్యాభర్తలు: 'మీ ప్రార్థనలకు అభ్యంతరము కలుగకుండునట్లు... జీవమను కృపావరములో మీతోకూడ పాలివారై యున్నారని ఆమెను సన్మానించుడి'",
      "1 Peter 3:7",
      "As being heirs together of the grace of life, that your prayers may not be hindered",
      "జీవమను కృపావరములో మీతోకూడ పాలివారై యున్నారని ఆమెను సన్మానించుడి",
      "Christian marriage is a spiritual partnership of equals jointly inheriting God's gift of eternal life.",
      "భార్యాభర్తలిరువురు దేవుడిచ్చిన జీవ కృపావరములో సమాన వారసులుగా ఒకరినొకరు గౌరవించుకొనవలెను."
    ],
    [
      "1 Peter 3:10 loving life and seeing good days: 'He who would love life and see good days, let him refrain his tongue from evil, and his lips from speaking deceit'",
      "1 పేతురు 3:10 జీవమును ప్రేమించి మంచి దినములు చూడగోరువాడు: 'జీవమును ప్రేమించి మంచి దినములు చూడగోరువాడు చెడ్డదానినుండి తన నాలుకను, కపటపు మాటలనుండి తన పెదవులను కాచుకొనవలెను'",
      "1 Peter 3:10",
      "He who would love life and see good days, let him refrain his tongue from evil, and his lips from speaking deceit",
      "జీవమును ప్రేమించి మంచి దినములు చూడగోరువాడు చెడ్డదానినుండి తన నాలుకను, కపటపు మాటలనుండి తన పెదవులను కాచుకొనవలెను",
      "Experiencing abundant, blessed earthly days requires diligent tongue-taming, peace-pursuit, and moral integrity.",
      "సమాధానకరమైన మంచి దినములను అనుభవించగోరువాడు నాలుకను పాపమునుండి కాపాడుకొని సమాధానమును వెంటాడవలెను."
    ],
    [
      "1 Peter 4:6 living according to God in the spirit: 'That they might be judged according to men in the flesh, but live according to God in the spirit'",
      "1 పేతురు 4:6 ఆత్మవిషయములో దేవునిబట్టి జీవించుట: 'వారు శరీరవిషయములో మనుష్యులరీతిగా తీర్పుతీర్చబడినను, ఆత్మవిషయములో దేవునిబట్టి జీవించునట్లు మృతులకును సువార్త ప్రకటింపబడెను'",
      "1 Peter 4:6",
      "That they might be judged according to men in the flesh, but live according to God in the spirit",
      "ఆత్మవిషయములో దేవునిబట్టి జీవించునట్లు",
      "Though persecuted believers suffer bodily death under human judgment, they dwell perpetually alive before God in the spirit.",
      "లోకము విశ్వాసులను హింసించినను, వారు ఆత్మయందు దేవుని సన్నిధిలో నిత్యము జీవించుదురు."
    ],
    [
      "2 Peter 1:3 divine power giving all things that pertain to life and godliness: 'As His divine power has given to us all things that pertain to life and godliness, through the knowledge of Him'",
      "2 పేతురు 1:3 జీవమునకును భక్తికిని కావలసిన సమస్తము: 'తన మహిమనుబట్టియు గుణాతిశయమునుబట్టియు మనలను పిలిచినవానిని గూర్చిన అనుభవజ్ఞానముమూలముగా, ఆయన దైవికశక్తి జీవమునకును భక్తికిని కావలసినవాటన్నిటిని మనకు అనుగ్రహించియున్నది'",
      "2 Peter 1:3",
      "His divine power has given to us all things that pertain to life and godliness, through the knowledge of Him",
      "ఆయన దైవికశక్తి జీవమునకును భక్తికిని కావలసినవాటన్నిటిని మనకు అనుగ్రహించియున్నది",
      "Believers possess no spiritual shortages; Christ's almighty energy has already supplied every resource needed for holy, flourishing life.",
      "పరిశుద్ధముగా జీవించుటకు కావలసిన సమస్త ఆత్మీయ వరములను క్రీస్తు దైవిక శక్తి మనకు సమృద్ధిగా ఇచ్చెను."
    ],
    [
      "1 John 1:1 the Word of life from the beginning: 'That which was from the beginning, which we have heard, which we have seen with our eyes... concerning the Word of life'",
      "1 యోహాను 1:1 జీవవాక్యమైన క్రీస్తు: 'ఆదినుండి యున్నదానిని, మేము వినినదానిని, కన్నులార చూచినదానిని... జీవవాక్యమునుగూర్చి తెలియజేయుచున్నాము'",
      "1 John 1:1",
      "Concerning the Word of life",
      "జీవవాక్యమునుగూర్చి తెలియజేయుచున్నాము",
      "The pre-existent Logos entered historical tangible reality, allowing human hands and eyes to witness the embodiment of life.",
      "ఆదినుండి ఉన్న జీవవాక్యమైన క్రీస్తు మానవులమధ్య సశరీరిగా ప్రత్యక్షమై నిత్యజీవమును కనుపరచెను."
    ],
    [
      "1 John 1:2 the eternal life manifested to us: 'The life was manifested, and we have seen, and bear witness, and declare to you that eternal life which was with the Father and was manifested to us'",
      "1 యోహాను 1:2 తండ్రితో ఉండి ప్రత్యక్షమైన నిత్యజీవము: 'ఆ జీవము ప్రత్యక్షమాయెను; తండ్రియొద్ద ఉండి మాకు ప్రత్యక్షమైన ఆ నిత్యజీవమును మేము చూచి, ఆ జీవమునుగూర్చి సాక్ష్యమిచ్చుచు దానిని మీకు తెలియజేయుచున్నాము'",
      "1 John 1:2",
      "Declare to you that eternal life which was with the Father and was manifested to us",
      "తండ్రియొద్ద ఉండి మాకు ప్రత్యక్షమైన ఆ నిత్యజీవమును మేము చూచి దానిని మీకు తెలియజేయుచున్నాము",
      "Jesus Christ is the eternal uncreated life who co-existed with the Father from eternity and broke into human time to save us.",
      "తండ్రియొద్ద ఉన్న నిత్యజీవము క్రీస్తునందు ప్రత్యక్షపరచబడి విశ్వాసులకు రక్షణగా అనుగ్రహింపబడెను."
    ],
    [
      "1 John 2:16 the pride of life not of the Father: 'For all that is in the world-the lust of the flesh, the lust of the eyes, and the pride of life-is not of the Father but is of the world'",
      "1 యోహాను 2:16 జీవపుడంబము తండ్రివలన పుట్టినది కాదు: 'లోకములో ఉన్నదంతయు, అనగా శరీరాశయు నేత్రాశయు జీవపుడంబమును తండ్రివలన పుట్టినవి కావు, అవి లోకసంబంధమైనవే'",
      "1 John 2:16",
      "For all that is in the world-the lust of the flesh, the lust of the eyes, and the pride of life-is not of the Father but is of the world",
      "లోకములో ఉన్నదంతయు, అనగా శరీరాశయు నేత్రాశయు జీవపుడంబమును తండ్రివలన పుట్టినవి కావు",
      "Boasting in earthly status, wealth, and intellect is counterfeit vitality originating from the dying worldly system.",
      "ఈ లోక సంబంధమైన జీవపుడంబము మరియు అహంకారము దేవుని చిత్తమునకు విరుద్ధమైన నాశన మార్గములు."
    ],
    [
      "1 John 2:25 the promise of eternal life: 'And this is the promise that He has promised us-eternal life'",
      "1 యోహాను 2:25 నిత్యజీవ వాగ్దానము: 'ఆయన మనకు చేసిన వాగ్దానము ఇదే, అనగా నిత్యజీవమే'",
      "1 John 2:25",
      "And this is the promise that He has promised us-eternal life",
      "ఆయన మనకు చేసిన వాగ్దానము ఇదే, అనగా నిత్యజీవమే",
      "The crowning core of all biblical promises: God pledges to share His unending, glorious life with every believer.",
      "దేవుడు తన ప్రజలకు చేసిన వాగ్దానములన్నిటిలో పరమ శిఖరము నిత్యజీవమై యున్నది."
    ],
    [
      "1 John 3:14 passing from death to life through brotherly love: 'We know that we have passed from death to life, because we love the brethren. He who does not love his brother abides in death'",
      "1 యోహాను 3:14 సహోదర ప్రేమవలన మరణములోనుండి జీవములోనికి దాటుట: 'మనము సహోదరులను ప్రేమించుచున్నాము గనుక మరణములోనుండి జీవములోనికి దాటియున్నామని యెరుగుదుము. ప్రేమించనివాడు మరణమందు నిలిచియున్నాడు'",
      "1 John 3:14",
      "We know that we have passed from death to life, because we love the brethren",
      "మనము సహోదరులను ప్రేమించుచున్నాము గనుక మరణములోనుండి జీవములోనికి దాటియున్నామని యెరుగుదుము",
      "Unfeigned sacrificial love toward the body of Christ is the infallible diagnostic test proving that new life has ignited in the soul.",
      "సహోదరులను హృదయపూర్వకముగా ప్రేమించుటయే విశ్వాసి మరణమునుండి నిత్యజీవములోనికి దాటినాడనుటకు నిదర్శనము."
    ],
    [
      "1 John 3:15 no murderer having eternal life: 'Whoever hates his brother is a murderer, and you know that no murderer has eternal life abiding in him'",
      "1 యోహాను 3:15 సహోదరుని ద్వేషించువానిలో నిత్యజీవము లేకుండుట: 'తన సహోదరుని ద్వేషించు ప్రతివాడును నరహంతకుడు; ఏ నరహంతకునియందును నిత్యజీవము ఉండదని మీరు ఎరుగుదురు'",
      "1 John 3:15",
      "Whoever hates his brother is a murderer, and you know that no murderer has eternal life abiding in him",
      "తన సహోదరుని ద్వేషించు ప్రతివాడును నరహంతకుడు; ఏ నరహంతకునియందును నిత్యజీవము ఉండదని మీరు ఎరుగుదురు",
      "Internal hatred is embryonic homicide; it proves an absolute absence of divine life inside the unrepentant heart.",
      "సహోదరునిపై ద్వేషము కలిగియుండుట నరహత్యతో సమానము; అట్టి హృదయములో దేవుని నిత్యజీవము నివసింపదు."
    ],
    [
      "1 John 3:16 laying down our lives for the brethren: 'By this we know love, because He laid down His life for us. And we also ought to lay down our lives for the brethren'",
      "1 యోహాను 3:16 సహోదరులకొరకు ప్రాణము పెట్టుట: 'ఆయన మననిమిత్తము తన ప్రాణము పెట్టెను గనుక దీనివలన ప్రేమ యెట్టిదని తెలిసికొనుచున్నాము; మనమును సహోదరుల నిమిత్తము మన ప్రాణములను పెట్ట బద్ధులమై యున్నాము'",
      "1 John 3:16",
      "By this we know love, because He laid down His life for us. And we also ought to lay down our lives for the brethren",
      "ఆయన మననిమిత్తము తన ప్రాణము పెట్టెను గనుక దీనివలన ప్రేమ యెట్టిదని తెలిసికొనుచున్నాము; మనమును సహోదరుల నిమిత్తము మన ప్రాణములను పెట్ట బద్ధులమై యున్నాము",
      "Christ's self-emptying on the cross sets the standard: possessors of eternal life gladly surrender temporal comfort for others.",
      "క్రీస్తు మనకొరకు తన ప్రాణమును అర్పించెను గనుక విశ్వాసులును సహోదరుల మేలుకొరకు త్యాగము చేయవలెను."
    ],
    [
      "1 John 5:11 eternal life given in the Son: 'And this is the testimony: that God has given us eternal life, and this life is in His Son'",
      "1 యోహాను 5:11 దేవుడిచ్చిన నిత్యజీవ సాక్ష్యము: 'ఆ సాక్ష్యమేదనగా, దేవుడు మనకు నిత్యజీవమును దయచేసెను; ఈ జీవము ఆయన కుమారునియందున్నది'",
      "1 John 5:11",
      "God has given us eternal life, and this life is in His Son",
      "దేవుడు మనకు నిత్యజీవమును దయచేసెను; ఈ జీవము ఆయన కుమారునియందున్నది",
      "Eternal life is not an abstract force; it is a divine Person! To receive Christ is to possess eternal life immediately.",
      "దేవుడు మనకిచ్చిన నిత్యజీవము ఆయన కుమారుడైన క్రీస్తుయేసునందే భద్రపరచబడియున్నది."
    ],
    [
      "1 John 5:12 he who has the Son has life: 'He who has the Son has life; he who does not have the Son of God does not have life'",
      "1 యోహాను 5:12 కుమారుని కలిగియున్నవాడే జీవముగలవాడు: 'దేవుని కుమారుని కలిగియున్నవాడే జీవము గలవాడు; దేవుని కుమారుని కలిగియుండనివాడు జీవము లేనివాడే'",
      "1 John 5:12",
      "He who has the Son has life; he who does not have the Son of God does not have life",
      "దేవుని కుమారుని కలిగియున్నవాడే జీవము గలవాడు; దేవుని కుమారుని కలిగియుండనివాడు జీవము లేనివాడే",
      "The stark binary of human destiny: having Jesus is life, lacking Jesus is spiritual death and forfeiture.",
      "క్రీస్తును కలిగియున్నవాడు నిత్యజీవము గలవాడు; క్రీస్తులేనివాడు ఆత్మీయ మరణమందు నశించిపోవును."
    ],
    [
      "1 John 5:13 knowing that you have eternal life: 'These things I have written to you who believe in the name of the Son of God, that you may know that you have eternal life'",
      "1 యోహాను 5:13 నిత్యజీవము కలిగియున్నామని నిశ్చయముగా తెలిసికొనుట: 'దేవుని కుమారుని నామమందు విశ్వాసముంచు మీరు నిత్యజీవము గలవారని తెలిసికొనునట్లు నేను ఈ సంగతులను మీకు వ్రాయుచున్నాను'",
      "1 John 5:13",
      "These things I have written to you who believe in the name of the Son of God, that you may know that you have eternal life",
      "దేవుని కుమారుని నామమందు విశ్వాసముంచు మీరు నిత్యజీవము గలవారని తెలిసికొనునట్లు నేను ఈ సంగతులను మీకు వ్రాయుచున్నాను",
      "Assurance is not presumptive arrogance; it is the confident, joyful certainty given to all who rest in Jesus.",
      "క్రీస్తును నమ్మిన విశ్వాసి తాను నిత్యజీవము కలిగియున్నానను తిరుగులేని ఆత్మీయ నిశ్చయతను కలిగియుండవచ్చును."
    ],
    [
      "1 John 5:20 the true God and eternal life: 'And we are in Him who is true, in His Son Jesus Christ. This is the true God and eternal life'",
      "1 యోహాను 5:20 నిజమైన దేవుడును నిత్యజీవమునైన యేసు: 'మనము ఆయన కుమారుడైన యేసుక్రీస్తునందున్నవారమై సత్యవంతుడైన వానియందున్నాము. ఈయనే నిజమైన దేవుడును నిత్యజీవమునై యున్నాడు'",
      "1 John 5:20",
      "This is the true God and eternal life",
      "ఈయనే నిజమైన దేవుడును నిత్యజీవమునై యున్నాడు",
      "The epistle closes with an emphatic declaration of Jesus' deity: He is the true God and the fountain of all eternal life.",
      "యేసుక్రీస్తే అద్వితీయ సత్యదేవుడు మరియు విశ్వాసులను నిత్యత్వములో నిలుపు నిత్యజీవమై యున్నాడు."
    ],
    [
      "Jude 1:21 looking for the mercy of our Lord Jesus Christ unto eternal life: 'Keep yourselves in the love of God, looking for the mercy of our Lord Jesus Christ unto eternal life'",
      "యూదా 1:21 నిత్యజీవార్థమైన కనికరమునకై కనిపెట్టుట: 'నిత్యజీవార్థమైన మన ప్రభువైన యేసుక్రీస్తు కనికరముకొరకు కనిపెట్టుచు, దేవుని ప్రేమలో మిమ్మును మీరు కాపాడుకొనుడి'",
      "Jude 1:21",
      "Looking for the mercy of our Lord Jesus Christ unto eternal life",
      "నిత్యజీవార్థమైన మన ప్రభువైన యేసుక్రీస్తు కనికరముకొరకు కనిపెట్టుచు, దేవుని ప్రేమలో మిమ్మును మీరు కాపాడుకొనుడి",
      "Persevering in an apostate world requires dwelling in divine love and anticipating the consummate mercy of eternal life.",
      "దేవుని ప్రేమలో మనలను కాపాడుకొనుచు క్రీస్తు రాకడలో పరిపూర్ణమగు నిత్యజీవమునకై కనిపెట్టవలెను."
    ],
    [
      "Revelation 2:7 the promise to eat from the Tree of Life: 'To him who overcomes I will give to eat from the tree of life, which is in the midst of the Paradise of God'",
      "ప్రకటన 2:7 దేవుని పరదైసులోని జీవవృక్ష ఫలము: 'జయించువానికి దేవుని పరదైసులో ఉన్న జీవవృక్ష ఫలములు భుజింపనిత్తును'",
      "Revelation 2:7",
      "To him who overcomes I will give to eat from the tree of life, which is in the midst of the Paradise of God",
      "జయించువానికి దేవుని పరదైసులో ఉన్న జీవవృక్ష ఫలములు భుజింపనిత్తును",
      "Paradise lost in Genesis is regained in Revelation; overcomers feast forever on the life-sustaining fruit of God's garden.",
      "ఆదికాండములో పోగొట్టుకొనిన పరదైసును జయించు విశ్వాసులు క్రీస్తుద్వారా పొంది జీవవృక్ష ఫలములను భుజింతురు."
    ],
    [
      "Revelation 2:10 the crown of life for faithfulness unto death: 'Be faithful until death, and I will give you the crown of life'",
      "ప్రకటన 2:10 మరణమువరకు నమ్మకముగా ఉండి జీవకిరీటము పొందుట: 'మరణమువరకు నమ్మకముగా ఉండుము, నేను నీకు జీవకిరీటమిచ్చెదను'",
      "Revelation 2:10",
      "Be faithful until death, and I will give you the crown of life",
      "మరణమువరకు నమ్మకముగా ఉండుము, నేను నీకు జీవకిరీటమిచ్చెదను",
      "Martyrdom is eclipsed by coronation; fidelity through the sharpest suffering is rewarded with the imperishable crown of life.",
      "శ్రమలలో మరణమువరకు నమ్మకముగా నిలిచిన విశ్వాసికి క్రీస్తు అమరమైన జీవకిరీటమును బహుమానముగా ఇచ్చును."
    ],
    [
      "Revelation 3:5 name not blotted out of the Book of Life: 'He who overcomes... I will not blot out his name from the Book of Life, but I will confess his name before My Father and before His angels'",
      "ప్రకటన 3:5 జీవగ్రంథములోనుండి పేరు తుడిచివేయబడకుండుట: 'జయించువాడు తెల్లని వస్త్రములు ధరించుకొనును; జీవగ్రంథములోనుండి అతని పేరును నేను ఎంతమాత్రమును తుడిచివేయక, నా తండ్రి యెదుటను ఆయన దూతల యెదుటను అతని పేరును ఒప్పుకొందును'",
      "Revelation 3:5",
      "I will not blot out his name from the Book of Life, but I will confess his name before My Father and before His angels",
      "జీవగ్రంథములోనుండి అతని పేరును నేను ఎంతమాత్రమును తుడిచివేయక, నా తండ్రి యెదుటను ఆయన దూతల యెదుటను అతని పేరును ఒప్పుకొందును",
      "Christ guarantees the eternal citizenship of overcoming saints, openly acknowledging their names before the celestial court.",
      "జయించువాని పేరు జీవగ్రంథమందు శాశ్వతముగా నిలుచును; క్రీస్తు పరలోకపు తండ్రియెదుట అతనిని తనవానిగా అంగీకరించును."
    ],
    [
      "Revelation 21:6 the fountain of the water of life freely: 'I will give of the fountain of the water of life freely to him who thirsts'",
      "ప్రకటన 21:6 దప్పిగొనువానికి ఉచితముగా జీవజలముల ఊట: 'దప్పిగొనువానికి జీవజలముల బుగ్గలోని జలమును నేను ఉచితముగా అనుగ్రహింతును'",
      "Revelation 21:6",
      "I will give of the fountain of the water of life freely to him who thirsts",
      "దప్పిగొనువానికి జీవజలముల బుగ్గలోని జలమును నేను ఉచితముగా అనుగ్రహింతును",
      "The thirsty soul needs no currency; the sovereign Lord dispenses eternal, soul-satisfying hydration as an unconditional gift.",
      "ఆత్మీయ దాహముతో వచ్చు ప్రతివానికి దేవుడు తన జీవజల ఊటలనుండి ఉచితముగా పరమ సంతృప్తిని ప్రసాదించును."
    ],
    [
      "Revelation 22:14 the right to the Tree of Life in the New Jerusalem: 'Blessed are those who do His commandments, that they may have the right to the tree of life, and may enter through the gates into the city'",
      "ప్రకటన 22:14 జీవవృక్షమునకు హక్కుదారులు: 'జీవవృక్షమునకు హక్కుదారులగునట్లును, గుమ్మములగుండ ఆ పట్టణములోనికి ప్రవేశించునట్లును, తమ వస్త్రములను ఉదుకుకొనువారు ధన్యులు'",
      "Revelation 22:14",
      "Blessed are those who do His commandments, that they may have the right to the tree of life, and may enter through the gates into the city",
      "జీవవృక్షమునకు హక్కుదారులగునట్లును, గుమ్మములగుండ ఆ పట్టణములోనికి ప్రవేశించునట్లును, తమ వస్త్రములను ఉదుకుకొనువారు ధన్యులు",
      "Washed in the blood of the Lamb, the redeemed stride boldly into the celestial city to partake forever of the Tree of Life.",
      "క్రీస్తు రక్తములో శుద్ధిచేయబడిన పరిశుద్ధులు పరలోకపు నూతన యెరూషలేములోనికి ప్రవేశించి నిత్య జీవవృక్షపు ఫలములను భుజింతురు."
    ]
  ];

  return data.map(item => ({
    easyQ: `What eschatological promise or eternal truth concerning life is revealed in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన యుగాంతపు వాగ్దానము లేదా నిత్య జీవ సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does God's promise of eternal life, the Book of Life, and the Tree of Life secure believers forever?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం జీవగ్రంథము, జీవవృక్షము మరియు నిత్యజీవపు వాగ్దానము విశ్వాసులను శాశ్వతముగా ఎలా భద్రపరచును?`,
    hardQ: `What theological reality does ${item[2]} establish regarding immortality, divine glory, and the eternal inheritance of the saints?`,
    hardQTe: `${item[2]} ప్రకారం పరిశుద్ధుల అక్షయతను మరియు నిత్య పరలోక జీవ వారసత్వమును గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty bronze cisterns by the gate of Samaria", "He proclaimed seventy days of solemn assembly on Mount Hor", "He sent fifty brass chariots to patrol the borders of Edom"],
    optionsTelugu: [item[4], "సమరయ గుమ్మమునొద్ద నలభై ఇత్తడి తొట్లను నిర్మించెను", "హోరు పర్వతముపై డెబ్బై దినముల పవిత్ర సభను ప్రకటించెను", "ఎదోము సరిహద్దులలో కావలికై యాభై కంచు రథములను పంపెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

const lifeFoundation = buildLifeFoundation();
const lifeGrowth = buildLifeGrowth();
const lifeMastery = buildLifeMastery();

console.log('Life Foundation facts count:', lifeFoundation.length);
console.log('Life Growth facts count:', lifeGrowth.length);
console.log('Life Mastery facts count:', lifeMastery.length);

buildBank('Life', 'lif', lifeFoundation, lifeGrowth, lifeMastery, 'LifeQuestionBank.ts');
