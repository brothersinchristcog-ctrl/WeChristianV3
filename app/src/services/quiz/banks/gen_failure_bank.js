const { buildBank } = require('./bank_builder.js');

// 50 Foundation Facts for Failure (Biblical characters, key failures, repentance, and divine restoration)
function buildFailureFoundation() {
  const data = [
    [
      "Peter's three denials of Jesus in the high priest's courtyard followed by bitter weeping",
      "ప్రధానయాజకుని ముంగిట పేతురు యేసును మూడుసార్లు ఎరుగనని బొంకి చేదుగా ఏడ్చుట",
      "Luke 22:61-62",
      "The Lord turned and looked at Peter; and Peter remembered the word of the Lord... so Peter went out and wept bitterly",
      "ప్రభువు తిరిగి పేతురువైపు చూచెను; అప్పుడు పేతురు ప్రభువు చెప్పిన మాట జ్ఞాపకము చేసికొని వెలుపలికి వెళ్లి చేదుగా ఏడ్చెను",
      "Peter's failure of overconfidence collapsed in cowardice, but Christ's grieving look ignited sorrow that led to repentance.",
      "తన స్వంత బలమును నమ్ముకొనిన పేతురు శోధనలో పడిపోయినను, యేసు ప్రేమపూర్వక చూపు అతనిలో పశ్చాత్తాపపు కన్నీటిని రగిల్చెను."
    ],
    [
      "Christ's three-fold restoration of Peter by the Sea of Galilee commissioning him to feed His sheep",
      "గలలీ సముద్రతీరమందు పేతురును మూడుసార్లు ప్రేమను గూర్చి ప్రశ్నించి తన గొఱ్ఱెలను మేపుటకు యేసు పునరుద్ధరించుట",
      "John 21:17",
      "He said to him the third time, 'Simon, son of Jonah, do you love Me?' Peter was grieved... and he said to Him, 'Lord, You know all things; You know that I love You.' Jesus said to him, 'Feed My sheep'",
      "మూడవసారి ఆయన-యోనా కుమారుడవైన సీమోనూ, నన్ను ప్రేమించుచున్నావా? అని అడిగెను. మూడవసారి నన్ను ప్రేమించుచున్నావా అని అడిగినందుకు పేతురు వ్యసనపడి-ప్రభువా, నీవు సమస్తమును ఎరుగుదువు, నిన్ను ప్రేమించుచున్నానని నీవే ఎరుగుదువనెను; యేసు-నా గొఱ్ఱెలను మేపుము అని చెప్పెను",
      "Jesus healed Peter's threefold denial with a threefold confession of love, restoring him from humiliating failure to apostolic leadership.",
      "మూడుసార్లు బొంకిన పేతురుచేత మూడుసార్లు ప్రేమ ఒప్పుకోలు చేయించి, అతని వైఫల్యమును చెరిపివేసి తన గొఱ్ఱెలను కాచే కాపరిగా యేసు నిలబెట్టెను."
    ],
    [
      "David's moral collapse with Bathsheba and the prophetic confrontation by Nathan declaring 'You are the man!'",
      "బత్షెబతో దావీదు పాపములో పడుట మరియు 'ఆ మనుష్యుడవు నీవే' అని నాతాను ప్రవక్త గద్దించుట",
      "2 Samuel 12:7,13",
      "Then Nathan said to David, 'You are the man!'... So David said to Nathan, 'I have sinned against the Lord.' And Nathan said to David, 'The Lord also has put away your sin; you shall not die'",
      "అప్పుడు నాతాను దావీదుతో-ఆ మనుష్యుడవు నీవే అని చెప్పెను... దావీదు నాతానుతో-నేను యెహోవాకు విరోధముగా పాపము చేసితిననెను; అందుకు నాతాను-యెహోవా నీ పాపమును పరిహరించెను, నీవు చావవు అని పలికెను",
      "David failed catastrophically in adultery and murder, but unlike proud Saul, he immediately confessed his sin and received divine pardon.",
      "మహా భక్తుడైన దావీదు భయంకరమైన పాపములో పడినను, ప్రవక్త గద్దించగానే కపటములేకుండ ఒప్పుకొని దేవుని క్షమాపణను పొందెను."
    ],
    [
      "David's agonizing prayer of repentance in Psalm 51 pleading for a clean heart and steadfast spirit",
      "కీర్తన 51 లో పవిత్ర హృదయమును మరియు స్థిరమైన మనస్సును దయచేయుమని దావీదు చేసిన పశ్చాత్తాప ప్రార్థన",
      "Psalm 51:10,17",
      "Create in me a clean heart, O God, and renew a steadfast spirit within me... The sacrifices of God are a broken spirit, a broken and a contrite heart-these, O God, You will not despise",
      "దేవా, నాయందు శుద్ధహృదయము కలుగజేయుము, నా అంతరంగములో స్థిరమైన మనస్సును నూతనముగా పుట్టించుము... విరిగిన మనస్సే దేవునికిష్టమైన బలులు; దేవా, విరిగి నలిగిన హృదయమును నీవు తృణీకరింపవు",
      "True recovery from moral failure begins with deep contrition, asking God to regenerate purity and spiritual integrity.",
      "వైఫల్యమునుండి నూతనత్వము పొందుటకు విరిగి నలిగిన హృదయముతో దేవుని సన్నిధిలో పశ్చాత్తాపపడుటయే ఏకైక మార్గము."
    ],
    [
      "Samson's moral failure with Delilah losing his Nazarite strength, eyes, and freedom to the Philistines",
      "దెలీలా మోసములో పడి సమసోను తన నాజీరు బలాన్ని, కన్నులను, స్వేచ్ఛను కోల్పోయి ఫిలిష్తీయుల బానిసగా మారుట",
      "Judges 16:20-21",
      "He awoke from his sleep, and said, 'I will go out as before... and shake myself free!' But he did not know that the Lord had departed from him. Then the Philistines took him and put out his eyes",
      "అతడు నిద్రమేల్కొని-ఎప్పటివలె నేను బయలువెళ్లి విదిలించుకొందుననుకొనెను గాని యెహోవా తన్ను విడిచిపోయెనని అతనికి తెలియకపోయెను; అప్పుడు ఫిలిష్తీయులు అతని పట్టుకొని అతని కన్నులు ఊడదీసిరి",
      "Samson toyed with compromise until he was blind, bound, and grinding in a Philistine prison, demonstrating the bitter wages of disobedience.",
      "దేవుడిచ్చిన అభిషేకమును నిర్లక్ష్యము చేసి శరీరాశలకు లొంగిపోయిన సమసోను కన్నులు కోల్పోయి శత్రువుల చేతిలో అపహాస్యమాయెను."
    ],
    [
      "Samson's final prayer of repentance and restoration of strength pushing down the pillars of Dagon's temple",
      "దాగోను గుడి స్తంభములను కూల్చుటకు చివరిసారిగా దేవునికి మొరపెట్టి సమసోను పొందిన ఆఖరి విజయము",
      "Judges 16:28,30",
      "Then Samson called to the Lord, saying, 'O Lord God, remember me, I pray! Strengthen me, I pray, just this once'... and the temple fell on the lords and all the people who were in it",
      "సమసోను యెహోవాకు మొరపెట్టి-ప్రభువైన యెహోవా, నన్ను జ్ఞాపకము చేసికొనుము; దేవా, యీ ఒక్కమారు నన్ను బలపరచుమని వేడుకొనెను... అతడు బలముగా వంగగా ఆ యిల్లు దానిలోని సర్దారులమీదను జనులందరిమీదను పడెను",
      "Even in the ashes of personal ruin, God answered Samson's humble cry, proving that failure is never the final word when faith cries out.",
      "తన జీవితాంతములో పశ్చాత్తాపముతో మొరపెట్టిన సమసోను ప్రార్థనను దేవుడు విని, మరణమందు అతనికి గొప్ప జయమునిచ్చెను."
    ],
    [
      "Jonah's rebellious flight to Tarshish running from God's mission to preach repentance to Nineveh",
      "నీనెవెకు సువార్త చెప్పక యెహోవా సన్నిధినుండి తర్షీషుకు పారిపోవుటకు ఓడ ఎక్కిన యోనా వైఫల్యము",
      "Jonah 1:3",
      "But Jonah arose to flee to Tarshish from the presence of the Lord. He went down to Joppa, and found a ship going to Tarshish; so he paid the fare, and went down into it",
      "అయితే యోనా యెహోవా సన్నిధికి పోక తర్షీషునకు పారిపోవలెనని లేచి య ఒప్పాకు దిగివెళ్లి తర్షీషునకు పోవు ఓడ నొకదాని చూచి, యెహోవా సన్నిధికి పోక ఓడలోనివారితో కూడ తర్షీషునకు వచ్చుటకు ఓడకూలి ఇచ్చి అందులో ఎక్కెను",
      "Jonah thought he could escape divine purpose through geographical distance, learning that disobedience leads steadily downward.",
      "దేవుని పిలుపుకు అవిధేయత చూపి పారిపోవాలని చూచిన యోనా తుదకు సముద్రపు అగాధములోనికి జారిపోయెను."
    ],
    [
      "Jonah's cry of repentance from the fish's belly and God commanding the fish to vomit him onto dry land",
      "చేప కడుపులోనుండి యోనా చేసిన పశ్చాత్తాప ప్రార్థన మరియు అతనికి దేవుడు ఇచ్చిన రెండవ అవకాశము",
      "Jonah 2:1-2,10; 3:1",
      "I cried out to the Lord because of my affliction, and He answered me... So the Lord spoke to the fish, and it vomited Jonah onto dry land. Now the word of the Lord came to Jonah the second time",
      "నా శ్రమలో నేను యెహోవాకు మొరపెట్టగా ఆయన నాకుత్తరమిచ్చెను... అప్పుడు యెహోవా ఆ మత్స్యమునకు ఆజ్ఞాపించగా అది యోనాను నేలమీద గ్రక్కివేసెను. తరువాత యెహోవా వాక్యము రెండవమారు యోనాకు ప్రత్యక్షమై సెలవిచ్చెను",
      "God is the God of the second chance; Jonah's failure in the storm was redeemed when he confessed salvation belongs to the Lord.",
      "అగాధములోనుండి దేవునికి మొరపెట్టిన యోనాను రక్షించి, ఆయన తన వాక్యమును రెండవమారు అతనికిచ్చి తన పరిచర్యను పునరుద్ధరించెను."
    ],
    [
      "Elijah fleeing into the wilderness from Jezebel's death threat and wishing he could die under a broom tree",
      "యెజెబెలు బెదిరింపులకు భయపడి అరణ్యమునకు పారిపోయి బదరీ వృక్షము క్రింద చనిపోవుటకు కోరుకున్న ఏలీయా బలహీనత",
      "1 Kings 19:4",
      "He sat down under a broom tree. And he prayed that he might die, and said, 'It is enough! Now, Lord, take my life, for I am no better than my fathers!'",
      "అతడు ఒక బదరీ వృక్షముక్రింద కూర్చుండి, ఇక చాలును, యెహోవా, నా ప్రాణము తీసికొనుము; నేను నా పితరులకంటె మంచివాడను కానని చెప్పి మరణమును కోరెను",
      "After the massive triumph on Mount Carmel, Elijah collapsed into psychological exhaustion and despair, feeling like an utter failure.",
      "కర్మెలు పర్వతముపై అగ్నిని రప్పించిన మహా ప్రవక్త సైతం మానసిక అలసటతో కృంగిపోయి చావును కోరుకొనుట మానవ బలహీనతను చాటుచున్నది."
    ],
    [
      "God tenderly nourishing exhausted Elijah with angel's bread and speaking to him in a still small voice at Horeb",
      "హోరేబు పర్వతమందు అలసిన ఏలీయాను దేవదూత ఆహారముతో పోషించి మెల్లనైన మెల్లని స్వరముతో దేవుడు సరిదిద్దుట",
      "1 Kings 19:11-12,18",
      "And after the earthquake a fire, but the Lord was not in the fire; and after the fire a still small voice... 'Yet I have reserved seven thousand in Israel, all whose knees have not bowed to Baal'",
      "భూకంపము తరువాత అగ్ని పుట్టెను గాని అగ్నియందు యెహోవా లేడు; అగ్ని తరువాత మెల్లనైన సున్నితమైన స్వరము వినబడెను... బయలునకు మోకాళ్లూనని ఏడువేలమందిని ఇశ్రాయేలులో నేను శేషముగా ఉంచుకొనియున్నాను",
      "God did not scold Elijah's depression; He gave him physical rest, food, gentle revelation, and reassuring truth that he was not alone.",
      "దేవుడు కృంగిన సేవకుని దూషింపక ఆహారమిచ్చి నిద్రనిచ్చి, మెల్లని స్వరముతో మాట్లాడి ఇంకా ఏడువేలమంది భక్తులున్నారని ధైర్యపరిచెను."
    ],
    [
      "The Prodigal Son squandering his entire inheritance in wild living and ending up starving among swine",
      "దుర్వ్యాపారమువలన తన ఆస్తినంతటిని పాడుచేసి పందుల పొట్టుతో కడుపు నింపుకొనుటకు దిగజారిన తప్పిపోయిన కుమారుడు",
      "Luke 15:13-15",
      "The younger son gathered all together, journeyed to a far country, and there wasted his possessions with prodigal living... and he sent him into his fields to feed swine",
      "చిన్న కుమారుడు సమస్తమును కూర్చుకొని దూరదేశమునకు ప్రయాణమైపోయి, అక్కడ దుర్వ్యాపారమువలన తన ఆస్తిని పాడుచేసెను... అతడు ఆ దేశస్థులలో ఒకనిని ఆశ్రయించగా అతడు తన పొలములో పందులను మేపుటకు అతనిని పంపెను",
      "Selfish rebellion culminated in total destitution and degradation, feeding unclean swine while dying of hunger.",
      "తండ్రిని విడిచి స్వతంత్రముగా జీవించాలనుకున్న కుమారుడు సమస్తమును కోల్పోయి పందుల తొట్టియొద్ద అవమానకరమైన వైఫల్యమును చేరెను."
    ],
    [
      "The Prodigal Son coming to himself, returning home, and being lavished with the Father's running embrace and royal robe",
      "బుద్ధి తెచ్చుకొని తండ్రియింటికి తిరిగి రాగానే పరుగెత్తుకొని వచ్చి కౌగిలించుకొని ఉత్తమ వస్త్రమును తొడిగించిన తండ్రి ప్రేమ",
      "Luke 15:17,20,22",
      "When he came to himself, he said, 'How many of my father's hired servants have bread enough and to spare, and I perish with hunger!'... But when he was still a great way off, his father saw him and had compassion, and ran and fell on his neck and kissed him",
      "అయితే బుద్ధి వచ్చినప్పుడు అతడు-నా తండ్రియొద్ద ఎంతోమంది కూలివారికి తిండి సమృద్ధిగా ఉన్నది, నేనిక్కడ ఆకలికి చచ్చిపోవుచున్నాను... అతడు ఇంక దూరముగా ఉన్నప్పుడే అతని తండ్రి అతని చూచి కనికరపడి, పరుగెత్తి అతని మెడమీద పడి ముద్దుపెట్టుకొనెను",
      "Repentance brought the failed son home, where the father's grace completely erased his shame with a ring, robe, and celebration.",
      "పశ్చాత్తాపముతో తిరిగి వచ్చిన కుమారుని తండ్రి కనికరముతో చేర్చుకొని, అతని పూర్వ వైఫల్యమును లెక్కచేయక నూతన ఘనతను ఇచ్చెను."
    ],
    [
      "King Saul's premature sacrifice at Gilgal failing the test of patient obedience to Samuel's prophetic timing",
      "గిల్గాలులో సమూయేలు వచ్చువరకు ఆగలేక తానే బలి అర్పించి దేవుని ఆజ్ఞను మీరిన సౌలు తొందరపాటు వైఫల్యము",
      "1 Samuel 13:13-14",
      "Samuel said to Saul, 'You have done foolishly. You have not kept the commandment of the Lord your God... But now your kingdom shall not continue'",
      "సమూయేలు సౌలుతో-నీవు అవివేకపు పని చేసితివి; నీ దేవుడైన యెహోవా నీకాజ్ఞాపించిన కట్టడను నీవు గైకొనలేదు... ఇప్పుడైతే నీ రాజ్యము నిలువదు",
      "Saul feared the scattering people more than he feared God, substituting religious ritual for exact obedience and losing his dynasty.",
      "ప్రజలు చెదిరిపోవుచున్నారని భయపడి సమూయేలు మాట వినక బలి అర్పించిన సౌలు దేవుని నమ్మకత్వాన్ని కోల్పోయెను."
    ],
    [
      "King Saul's failure in sparing King Agag and the best of the Amalekite spoil under religious pretexts",
      "అమలేకీయుల రాజైన అగగును మరియు మంచి పశువులను సంహరింపక దాచిపెట్టి దేవుని వాక్యమును తృణీకరించిన సౌలు తిరుగుబాటు",
      "1 Samuel 15:22-23",
      "Has the Lord as great delight in burnt offerings and sacrifices, as in obeying the voice of the Lord? Behold, to obey is better than sacrifice... Because you have rejected the word of the Lord, He also has rejected you from being king",
      "యెహోవా ఆజ్ఞను గైకొనుటవలన కలిగినంత సంతోషము ఆయన దహనబలులవలనను బలులవలనను పొందునా? ఆలోచించుము, బలులర్పించుటకంటె ఆజ్ఞను గైకొనుటయు... శ్రేష్ఠము; నీవు యెహోవా వాక్యమును విసర్జించితివి గనుక ఆయన నీవు రాజుగా ఉండకుండ నిన్ను విసర్జించెను",
      "Saul rationalized his disobedience by claiming the spoils were for sacrifice, proving that partial obedience is outright rebellion.",
      "దేవునికి బలి అర్పించుటకై మంచివాటిని దాచితినని సాకు చెప్పిన సౌలు అవిధేయత దేవుని దృష్టికి మంత్రగాండ్ర పాపముతో సమానముగా ఎంచబడెను."
    ],
    [
      "Moses failing to sanctify the Lord at Meribah by angrily striking the rock twice instead of speaking to it",
      "మెరీబాయొద్ద బండతో మాట్లాడవలసియుండగా కోపముతో రెండుసార్లు కొట్టి దేవుని పరిశుద్ధపరచని మోషే వైఫల్యము",
      "Numbers 20:11-12",
      "Then Moses lifted his hand and struck the rock twice with his rod... Then the Lord spoke to Moses and Aaron, 'Because you did not believe Me, to hallow Me in the eyes of the children of Israel, therefore you shall not bring this assembly into the land'",
      "అప్పుడు మోషే తన చెయ్యి యెత్తి తన కర్రతో ఆ బండను రెండుమారులు కొట్టగా నీళ్లు సమృద్ధిగా బయలువెళ్లెను... అప్పుడు యెహోవా మోషే అహరోనులతో-మీరు ఇశ్రాయేలీయుల కన్నులయెదుట నన్ను పరిశుద్ధపరచునట్లు నన్ను నమ్ముకొనకపోతిరి గనుక ఈ సమాజమునకు నేనిచ్చిన దేశములోనికి మీరు దాని తోడుకొనిపోరు అని సెలవిచ్చెను",
      "Even the meekest man on earth let frustration provoke disobedience, demonstrating that leaders face strict accountability before God.",
      "ప్రజల తిరుగుబాటుకు విసిగిపోయి కోపముతో బండను కొట్టిన మోషే కనాను దేశములో ప్రవేశించే గొప్ప అవకాశమును కోల్పోయెను."
    ],
    [
      "Abraham lying about Sarah in Egypt claiming she was his sister out of fear for his personal safety",
      "ఐగుప్తులో ప్రాణభయముచేత శారా తన భార్య కాదని తన సహోదరియని అబద్ధమాడిన అబ్రాహాము బలహీనత",
      "Genesis 12:12-13,18-19",
      "Please say you are my sister, that it may be well with me for your sake, and that my soul may live... Pharaoh said, 'What is this you have done to me?... Why did you say, She is my sister?'",
      "నా ప్రాణము దక్కునట్లు దయచేసి నీవు నా సహోదరివని చెప్పుము... అప్పుడు ఫరో అబ్రాహామును పిలిపించి-నీవు నాకు చేసినది ఏమిటి?... ఈమె నా సహోదరి అని నీవెందుకు చెప్పితివి? అని గద్దించెను",
      "The father of faith stumbled into deceitful self-preservation, but God's covenant grace preserved Sarah and rebuked Pharaoh.",
      "విశ్వాసులకు తండ్రియైన అబ్రాహాము సైతం కరువు కాలములో ప్రాణభయముతో అబద్ధమాడినను దేవుని కృప శారాను కాపాడెను."
    ],
    [
      "Abraham and Sarah resorting to human effort through Hagar to produce an heir, resulting in strife",
      "దేవుని వాగ్దానముకొరకు కనిపెట్టలేక హాగరుద్వారా సంతానమును పొందగోరి కుటుంబములో కలహము తెచ్చుకున్న శారా అబ్రాహాముల వైఫల్యము",
      "Genesis 16:2,4",
      "So Sarai said to Abram, 'See now, the Lord has restrained me from bearing children. Please, go in to my maid; perhaps I shall obtain children by her.' And Abram heeded the voice of Sarai",
      "శారయి-ఇదిగో నేను పిల్లలు కనకుండ యెహోవా చేసియున్నాడు; దయచేసి నా దాసియొద్దకు పోవుము, ఒకవేళ ఆమెవలన నాకు సంతానము కలుగుననెను; అబ్రాము శారయి మాట వినెను",
      "Impatience with God's timetable birthed Ishmael through the flesh, illustrating the perpetual conflict between human works and divine promise.",
      "దేవుని సమయమువరకు ఓపికతో కనిపెట్టక స్వబుద్ధిపై ఆధారపడి చేసిన నిర్ణయము తరతరములకు సమస్యగా మారెను."
    ],
    [
      "Adam and Eve succumbing to the serpent's deception eating the forbidden fruit and hiding among trees",
      "ఏదెను తోటలో సర్పము మోసమునకు లొంగి నిషేధించబడిన పండును తిని దేవుని సన్నిధికి భయపడి చెట్లమధ్య దాగుకొనిన ఆది దంపతుల పతనము",
      "Genesis 3:6,8",
      "So when the woman saw that the tree was good for food... she took of its fruit and ate. She also gave to her husband with her, and he ate... and Adam and his wife hid themselves from the presence of the Lord",
      "ఆ స్త్రీ ఆ వృక్షము ఆహారమునకు మంచిదియు... వివేకమిచ్చునదియునై యుండుట చూచినప్పుడు ఆమె దాని ఫలములలో కొన్ని తీసికొని తిని తనతోపాటు తన భర్తకును ఇచ్చెను, అతడును తినెను... ఆదామును అతని భార్యయు యెహోవా దేవుని సన్నిధికి కనబడకుండ తోట చెట్లమధ్యను దాగుకొనిరి",
      "Original human failure introduced guilt, shame, and alienation from God, met immediately by God's promise of the seed of the woman.",
      "సాతాను మాటలు నమ్మి దేవుని ఆజ్ఞను మీరిన మానవాళి పాపములో పడిపోయినను, దేవుడు స్త్రీ సంతానముద్వారా విమోచన వాగ్దానము చేసెను."
    ],
    [
      "The Golden Calf apostasy at Mount Sinai when the Israelites fashioned an idol while Moses delayed",
      "మోషే కొండపై ఆలస్యము చేయగా అహరోను నాయకత్వములో బంగారు దూడను చేసుకొని విగ్రహారాధన చేసిన ఇశ్రాయేలీయుల మహా పతనము",
      "Exodus 32:4,19",
      "And he received the gold from their hand, and he fashioned it with an engraving tool, and made a molded calf. Then they said, 'This is your god, O Israel, that brought you out of the land of Egypt!'",
      "అతడు వారియొద్దనుండి ఆ బంగారును తీసికొని పోతపోసిన దూడగా చేసెను; అప్పుడు వారు-ఇశ్రాయేలూ, ఐగుప్తు దేశములోనుండి నిన్ను రప్పించిన నీ దేవుడు ఇదే అనిరి",
      "Within days of hearing the audible Ten Commandments, Israel failed catastrophically, requiring Moses' passionate intercession to avert destruction.",
      "దేవుని స్వరమును విన్న కొద్ది దినములకే బంగారు దూడను పూజించి ఘోర వైఫల్యమును మూటగట్టుకున్న ప్రజలకొరకు మోషే విజ్ఞాపన చేసెను."
    ],
    [
      "Israel's rebellion at Kadesh Barnea weeping at the report of the ten faithless spies and refusing to enter Canaan",
      "కాదేషు బర్నేయలో పదిమంది అవిశ్వాస వేగులవారి మాట విని రాత్రంతయు ఏడ్చి కనానులోనికి వెళ్లనొల్లని ప్రజల అవిశ్వాస వైఫల్యము",
      "Numbers 14:2-3,11",
      "All the children of Israel complained against Moses and Aaron... 'Why has the Lord brought us to this land to fall by the sword?'... Then the Lord said, 'How long will these people reject Me?'",
      "ఇశ్రాయేలీయులందరు మోషే అహరోనులమీద సణుగుచు-మేము ఖడ్గముచేత కూలునట్లు యెహోవా మమ్మును ఈ దేశమునకు ఎందుకు తోడుకొని వచ్చుచున్నాడు అనిరి... అప్పుడు యెహోవా-ఎంతవరకు ఈ జనులు నన్ను తృణీకరింతురు? అని మోషేతో అనెను",
      "Unbelief forfeited an entire generation from entering the Promised Land, resulting in forty years of desert wandering.",
      "రాక్షసులవంటి శత్రువులను చూచి భయపడి దేవుని వాగ్దానమును తృణీకరించిన ఆ తరం అరణ్యములోనే రాలిపోయెను."
    ],
    [
      "Israel's humiliating defeat at Ai caused by Achan's secret theft of devoted spoils in Jericho",
      "యెరికో శాపగ్రస్తమైన వస్తువులలో ఆకాను చేసిన రహస్య దొంగతనమువలన హాయి పట్టణము యెదుట ఇశ్రాయేలు పరాజయము",
      "Joshua 7:1,11",
      "The children of Israel committed a trespass regarding the accursed things, for Achan... took of the accursed things; so the anger of the Lord burned... 'Israel has sinned, and they have also transgressed My covenant'",
      "ఇశ్రాయేలీయులు శాపగ్రస్తమైనదాని విషయములో తిరుగుబాటు చేసిరి; ఏలయనగా ఆకాను శాపగ్రస్తమైనదానిలో కొంత తీసికొనెను గనుక యెహోవా కోపము ఇశ్రాయేలీయులమీద రగులుకొనెను... ఇశ్రాయేలీయులు పాపము చేసియున్నారు, నేను వారితో చేసిన నిబంధనను వారు మీరియున్నారు",
      "Hidden individual compromise brought corporate disaster, teaching that unchecked sin paralyses spiritual victory until judged.",
      "ఒక్క వ్యక్తి దాచిన పాపము సర్వ సమాజమునకు పరాజయమును తెచ్చెను; పాపమును సరిచేసేవరకు దేవుని సన్నిధి తోడుగా ఉండదు."
    ],
    [
      "John Mark abandoning Paul and Barnabas in Pamphylia and his subsequent restoration into profitable ministry",
      "పంఫులియలో పౌలు బర్నబాలను విడిచి వెళ్లిపోయిన మార్కు వైఫల్యము మరియు తరువాత ఉపయుక్తమైన సేవకునిగా ఎదుగుట",
      "Acts 15:38; 2 Timothy 4:11",
      "Paul insisted that they should not take with them the one who had departed from them in Pamphylia... [Later Paul wrote:] 'Get Mark and bring him with you, for he is useful to me for ministry'",
      "పంఫులియలో తమను విడిచి పనికి రానివాని వెంటబెట్టుకొని పోవుట యుక్తము కాదని పౌలు తలంచెను... [తరువాత పౌలు వ్రాయుచు:] మార్కును వెంటబెట్టుకొని రమ్ము; అతడు పరిచర్యనిమిత్తము నాకు ప్రయోజనకరమై యున్నాడు",
      "Mark failed on his first mission but matured under Barnabas and Peter, earning Paul's ultimate commendation from prison.",
      "మొదటి మిషనరీ ప్రయాణములో భయపడి వెనుదిరిగిన మార్కు, తరువాత నమ్మకమైన సేవకునిగా మారి పౌలు ప్రశంసను మరియు సువార్త గ్రంథకర్త ఘనతను పొందెను."
    ],
    [
      "Thomas refusing to believe the resurrection without physical proof and his subsequent confession 'My Lord and my God!'",
      "గాయములను ముట్టుకుంటేనే నమ్ముదునని పలికిన తోమా అవిశ్వాస వైఫల్యము మరియు 'నా ప్రభువా నా దేవా' అను పరమ ఒప్పుకోలు",
      "John 20:25,28",
      "Unless I see in His hands the print of the nails... I will not believe... And Thomas answered and said to Him, 'My Lord and my God!'",
      "నేనాయన చేతులలో మేకుల గుర్తును చూచి... నమ్మనే నమ్మననెను... అందుకు తోమా-నా ప్రభువా, నా దేవా! అని ఆయనతో అనెను",
      "Jesus did not excommunicate the doubting disciple; He met him at his point of weakness, eliciting the highest Christological confession.",
      "అనుమానముతో కొట్టుమిట్టాడిన తోమాను యేసు త్రోసిపుచ్చక దర్శనమిచ్చి, అతని చేత 'నా ప్రభువా నా దేవా' అని సాక్ష్యమిప్పించెను."
    ],
    [
      "All the disciples deserting Jesus and fleeing into the darkness at Gethsemane during His arrest",
      "గెత్సేమనే తోటలో యేసును బంధించినప్పుడు శిష్యులందరు ఆయనను విడిచి పారిపోయిన సామూహిక వైఫల్యము",
      "Matthew 26:56",
      "Then all the disciples forsook Him and fled",
      "అప్పుడు శిష్యులందరును ఆయనను విడిచి పారిపోయిరి",
      "Despite bold promises to die with Him, human courage collapsed before mob violence, proving that salvation rested solely on Christ alone.",
      "ప్రాణమిచ్చెదనని ప్రగల్భాలు పలికిన శిష్యులందరు ప్రాణభయముతో పారిపోగా, యేసు ఒంటరిగానే సిలువ శ్రమలను భరించెను."
    ],
    [
      "King Solomon's tragic spiritual failure in his old age being seduced into idolatry by foreign wives",
      "వృద్ధాప్యమందు అన్య స్త్రీల మోహములో పడి హృదయమును దేవునినుండి విగ్రహారాధనవైపు త్రిప్పుకున్న సొలొమోను వైఫల్యము",
      "1 Kings 11:4,9",
      "For it was so, when Solomon was old, that his wives turned his heart after other gods; and his heart was not loyal to the Lord his God... So the Lord became angry with Solomon",
      "సొలొమోను వృద్ధుడైనప్పుడు అతని భార్యలు అతని హృదయమును ఇతర దేవతలతట్టు త్రిప్పగా అతని హృదయము తన తండ్రియైన దావీదు హృదయమువలె తన దేవుడైన యెహోవాయెడల యథార్థముగా ఉండకపోయెను... అందువలన యెహోవా సొలొమోనుమీద కోపపడెను",
      "The wisest man succumbed to sensual compromise, dividing his kingdom and warning all future believers against spiritual complacency.",
      "సమస్త లోక జ్ఞానముగల సొలొమోను సైతం అన్య స్త్రీల మోసములో పడి విగ్రహములను పూజించి తన సంతతికి శాపమును మిగిల్చెను."
    ],
    [
      "Jacob deceiving blind father Isaac with goat skins to steal Esau's blessing, resulting in twenty years of exile",
      "మేక చర్మములను ధరించి గ్రుడ్డివాడైన తండ్రిని మోసగించి ఏశావు ఆశీర్వాదమును దొంగిలించిన యాకోబు కుట్ర వైఫల్యము",
      "Genesis 27:19,41",
      "Jacob said to his father, 'I am Esau your firstborn; I have done just as you told me'... So Esau hated Jacob because of the blessing... and Jacob fled",
      "యాకోబు-నేను నీ జ్యేష్ఠపుత్రుడైన ఏశావును, నీవు నాకు చెప్పినట్లు చేసితిని... తండ్రి తనకిచ్చిన దీవెననుబట్టి ఏశావు యాకోబుమీద పగపట్టెను... యాకోబు పారిపోయెను",
      "Jacob relied on deceit rather than trusting God's prophecy, reaping decades of reciprocal deceit under uncle Laban.",
      "దేవుని వాగ్దానమును నమ్మక మోసముతో ఆశీర్వాదమును పొందగోరిన యాకోబు తన స్వంత ఇంటిని విడిచి ఇరువది ఏండ్లు పరదేశిగా శ్రమనొందెను."
    ],
    [
      "Jacob wrestling all night at Peniel with God, crippled in his hip, and clinging until blessed with the new name Israel",
      "పెనూయేలు వద్ద రాత్రంతయు దేవునితో పోరాడి తొడగూడు మడతపడి నూతన నామము పొందిన యాకోబు రూపాంతరము",
      "Genesis 32:26,28",
      "And He said, 'Let Me go, for the day breaks.' But he said, 'I will not let You go unless You bless me!' So He said to him, 'Your name shall no longer be called Jacob, but Israel'",
      "ఆయన-తెల్లవారుచున్నది గనుక నన్ను పోనిమ్మనగా అతడు-నీవు నన్ను ఆశీర్వదించితేనే గాని నిన్ను పోనియ్యననెను. ఆయన-నీ పేరేమని అడుగగా అతడు-యాకోబు అని చెప్పెను; అప్పుడాయన-నీవు దేవునితోను మనుష్యులతోను పోరాడి గెలిచితివి గనుక ఇకమీదట నీ పేరు ఇశ్రాయేలే గాని యాకోబు అనబడదని చెప్పెను",
      "Broken of self-sufficiency, the deceiver became a prevailing prince with God when he stopped manipulating and started clinging.",
      "తన స్వంత బలమంతయు విరిగిన తరువాత దేవుని పాదములను పట్టుకొని కన్నీటితో వేడుకొనిన యాకోబు ఆశీర్వదింపబడి ఇశ్రాయేలుగా మారెను."
    ],
    [
      "Lot's catastrophic choice pitching his tent toward sinful Sodom and losing his home, wife, and honor",
      "పచ్చని మైదానములను చూచి సొదొమవైపు గుడారము వేసుకొని ఆస్తిని, భార్యను, పవిత్రతను కోల్పోయిన లోతు భయంకర వైఫల్యము",
      "Genesis 13:12-13; 19:26",
      "Abram dwelt in the land of Canaan, and Lot dwelt in the cities of the plain and pitched his tent even as far as Sodom. But the men of Sodom were exceedingly wicked... But his wife looked back behind him, and she became a pillar of salt",
      "లోతు ఆ మైదానపు పట్టణములలో కాపురముండి సొదొమవరకు తన గుడారమును వేసికొనెను. సొదొమ మనుష్యులు దుష్టులును యెహోవా దృష్టికి బహు పాపులునై యుండిరి... అయితే లోతు భార్య అతని వెనుకనుండి వెనుకకు చూచి ఉప్పు స్తంభమాయెను",
      "Worldly ambition lured Lot into spiritual compromise that ended in fire, brimstone, and tragic family ruin.",
      "లోకాశలతో దుష్ట నగరమైన సొదొమవైపు అడుగులు వేసిన లోతు సర్వస్వమును అగ్నిలో కాల్చివేయబడి ప్రాణముతో మాత్రమే బయటపడెను."
    ],
    [
      "Judas Iscariot's tragic betrayal of Jesus for thirty pieces of silver followed by hopeless despair and suicide",
      "ముప్పది వెండి నాణెములకు యేసును అప్పగించి క్షమాపణను కోరక నిరాశతో ఉరిపెట్టుకొని చనిపోయిన యూదా ఇస్కరియోతు నాశనము",
      "Matthew 27:3-5",
      "Then Judas, His betrayer, seeing that He had been condemned, was remorseful and brought back the thirty pieces of silver... threw down the pieces of silver in the temple and departed, and went and hanged himself",
      "ఆయనను అప్పగించిన యూదా ఆయనకు శిక్ష విధింపబడగా చూచి పశ్చాత్తాపపడి, ఆ ముప్పది వెండి నాణెములు ప్రధానయాజకులయొద్దకును పెద్దలయొద్దకును మరల తెచ్చి... ఆ వెండి నాణెములను దేవాలయములో పారవేసి, పోయి ఉరిపెట్టుకొనెను",
      "Judas experienced worldly remorse that led to suicide, contrasting sharply with Peter whose godly sorrow led to life-giving repentance.",
      "ధనాశతో గురువును మోసగించిన యూదా కేవలము నిష్ప్రయోజనకరమైన పశ్చాత్తాపముతో నిరాశచెంది ఆత్మహత్యకు పాల్పడెను."
    ],
    [
      "Ananias and Sapphira conspiring to lie to the Holy Spirit regarding the price of their land and falling dead",
      "భూమి క్రయధనములో కొంత దాచుకొని పరిశుద్ధాత్మతో అబద్ధమాడి ప్రాణములను కోల్పోయిన అననీయ సప్పీరాల కపట వైఫల్యము",
      "Acts 5:3-5",
      "Peter said, 'Ananias, why has Satan filled your heart to lie to the Holy Spirit and keep back part of the price of the land for yourself?... You have not lied to men but to God.' Then Ananias, hearing these words, fell down and breathed his last",
      "పేతురు-అననీయా, భూమి వెలలో కొంత దాచుకొని పరిశుద్ధాత్మను మోసపుచ్చుటకు సాతాను ఎందుకు నీ హృదయమును ప్రేరేపించెను?... నీవు మనుష్యులతో కాదు దేవునితోనే అబద్ధమాడితివనెను. అననీయ ఈ మాటలు వినుచునే పడి ప్రాణము విడిచెను",
      "Hypocrisy seeking unearned spiritual reputation brought instant divine judgment, purifying the early apostolic church.",
      "మనుష్యుల మెప్పుకొరకు పరిశుద్ధాత్మతో అబద్ధమాడిన ఈ దంపతుల మరణము ప్రారంభ సంఘములో దైవభయమును నింపెను."
    ],
    [
      "Demas abandoning the apostle Paul in his final imprisonment having loved this present world",
      "ఇహలోకమును ప్రేమించి చెరసాలలో ఉన్న పౌలును విడిచి థెస్సలొనీకకు వెళ్లిపోయిన దేమా అవిశ్వాస వైఫల్యము",
      "2 Timothy 4:10",
      "For Demas has forsaken me, having loved this present world, and has departed for Thessalonica",
      "దేమా యీ ప్రస్తుత లోకమును ప్రేమించి నన్ను విడిచి థెస్సలొనీకకు వెళ్లెను",
      "A once-trusted fellow laborer faltered under the cost of martyrdom, choosing temporal comfort over eternal reward.",
      "సువార్త భారమును మోయలేక లోకపు భోగములకు ఆకర్షితుడై వృద్ధాప్యములో ఉన్న పౌలును విడిచిపోయిన దేమా పతనము హెచ్చరికగా ఉన్నది."
    ],
    [
      "King Hezekiah's failure of pride showing his royal treasures and armory to the envoys of Babylon",
      "తన సంపదనంతటిని ఆయుధాగారమును బబులోను రాయబారులకు గర్వముతో చూపించిన హిజ్కియా రాజు వైఫల్యము",
      "Isaiah 39:2,6",
      "And Hezekiah was pleased with them, and showed them the house of his treasures... 'Behold, the days are coming when all that is in your house... shall be carried to Babylon; nothing shall be left'",
      "హిజ్కియా వారిని చూచి సంతోషించి, తన రత్నభాండారమును... సమస్త వస్తువులను వారికి చూపించెను; హిజ్కియా తన నగరులోనున్న వాటిలో దేనిని వారికి చూపక యుంచలేదు... ఇదిగో దినములు వచ్చుచున్నవి, అప్పుడు నీ నగరులోనున్న సమస్తమును... బబులోనునకు కొనిపోబడును",
      "After miraculous healing, Hezekiah exhibited vain glory to foreigners, opening the doorway to future Babylonian exile.",
      "మరణమునుండి బ్రదికింపబడిన తరువాత గర్వించి దేవుని మహిమను చాటక తన ధనమును చూపిన హిజ్కియా దేశముపైకి బబులోను చెరను తెచ్చుకొనెను."
    ],
    [
      "King Uzziah's pride presuming to burn incense on the altar in the temple and being struck with leprosy",
      "దేవుని ఆలయములో యాజకులు మాత్రమే చేయవలసిన ధూపమును వేయుటకు సాహసించి కుష్ఠురోగిగా మారిన ఉజ్జియా గర్వ వైఫల్యము",
      "2 Chronicles 26:16,19",
      "When he was strong his heart was lifted up, to his destruction, for he transgressed against the Lord his God by entering the temple to burn incense... while he was angry with the priests, leprosy broke out on his forehead",
      "అతడు బలపడగానే తాను చెడిపోవునట్లు అతని మనస్సు గర్వించెను. అతడు ధూపపీఠముమీద ధూపము వేయుటకు యెహోవా ఆలయములో ప్రవేశించి తన దేవుడైన యెహోవామీద ద్రోహము చేసెను... అతడు యాజకులమీద కోపపడగా అతని నొసట కుష్ఠు పుట్టెను",
      "Military and economic success inflated Uzziah's pride until he violated God's holy order, living the rest of his days isolated.",
      "దేవుడు తనను బలపరచగానే గర్వించి దైవిక సరిహద్దులను అతిక్రమించిన ఉజ్జియా మరణదినమువరకు కుష్ఠురోగిగా వెలివేయబడెను."
    ],
    [
      "King Asa's spiritual decline relying on the king of Syria and seeking physicians rather than God in his illness",
      "సిరియా రాజు సహాయమును ఆశ్రయించి తన పాదముల జబ్బులో దేవుని వెదకక వైద్యులనే నమ్ముకున్న ఆసా రాజు వైఫల్యము",
      "2 Chronicles 16:7,12",
      "Because you have relied on the king of Syria, and have not relied on the Lord your God, therefore the army of the king of Syria has escaped... yet in his disease he did not seek the Lord, but the physicians",
      "నీవు నీ దేవుడైన యెహోవాను నమ్ముకొనక సిరియా రాజును నమ్ముకొంటివి గనుక సిరియా రాజు యొక్క సైన్యము నీ చేతిలోనుండి తప్పించుకొనెను... ఆసా తన జబ్బులో యెహోవాను వెదకక వైద్యులనే వెదకెను",
      "A king who began with revival ended his reign embittered, relying on secular treaties and human remedies instead of God.",
      "ప్రారంభములో విశ్వాసముతో జయముపొందిన ఆసా రాజు, అంతములో దేవుని మరచి మనుష్యుల బాహుబలముపై ఆధారపడి పతనమాయెను."
    ],
    [
      "King Josiah's rash rush into battle at Megiddo against Pharaoh Necho despite divine warnings",
      "ఫరో నెకో పలికిన దేవుని హెచ్చరికను వినక మారువేషము వేసుకొని మెగిద్దో యుద్ధములో ప్రాణము కోల్పోయిన యోషీయా తొందరపాటు",
      "2 Chronicles 35:21-23",
      "Necho sent messengers to him, saying, 'What have I to do with you, king of Judah?... God commanded me to make haste. Refrain from meddling with God'... Nevertheless Josiah would not turn his face... and the archers shot King Josiah",
      "నెకో అతనియొద్దకు దూతలను పంపి-యూదా రాజా, నాతో నీకేమి పని?... నన్ను త్వరపడవలెనని దేవుడు ఆజ్ఞాపించెను; నాతోకూడ నున్న దేవునిని ఎదురింపకుము... అయినను యోషీయా అతనిని విడిచిపోక... విలుకాండ్రు యోషీయా రాజుమీద బాణములు వేసిరి",
      "Even a great reforming king died prematurely when he meddled in a foreign war outside of God's revealed will.",
      "గొప్ప ఆత్మీయ ఉజ్జీవమును తెచ్చిన భక్తుడైన యోషీయా సైతం దేవుని చిత్తములేని యుద్ధములోనికి తొందరపడి ప్రాణమును కోల్పోయెను."
    ],
    [
      "Eli the high priest failing to restrain the blasphemous corruption of his sons Hophni and Phinehas",
      "తన కుమారులైన హోఫ్నీ ఫీనెహాసులు చేసిన ఘోరమైన అక్రమములను గద్దించి అణచలేకపోయిన ఏలీ యాజకుని వైఫల్యము",
      "1 Samuel 2:29; 3:13",
      "Why do you honor your sons more than Me, to make yourselves fat with the best of all the offerings?... For I have told him that I will judge his house forever for the iniquity which he knows, because his sons made themselves vile, and he did not restrain them",
      "నా అర్పణలలో శ్రేష్ఠమైనవాటిని మీరనుభవించుచు నాకంటె నీ కుమారులను నీవు ఏల ఘనపరచుచున్నావు?... తన కుమారులు తమను తాము శాపగ్రస్తులుగా చేసికొనుచుండగా అతడు వారిని వారింపక తాను ఎరిగిన దోషమునుబట్టి నేను అతని యింటికి సదాకాలము తీర్పుతీర్చబోవుచున్నానని నేను అతనికి తెలియజేసితిని",
      "Passive parental indulgence prioritised family sentiment over holy worship, resulting in the tragic Ichabod departure of God's glory.",
      "దేవునికంటె కుమారులను ఎక్కువ ప్రేమించి వారి పాపములను ఖండించని ఏలీ కుటుంబము దేవుని ఘోరమైన తీర్పునకు గురాయెను."
    ],
    [
      "Miriam and Aaron speaking seditiously against Moses' leadership and Miriam being struck with snow-white leprosy",
      "మోషే నాయకత్వముపై అసూయతో తిరుగుబాటు చేసి మాట్లాడగా మిర్యాము మంచువలె తెల్లని కుష్ఠురోగిగా మారిన వైఫల్యము",
      "Numbers 12:1-2,10",
      "Then Miriam and Aaron spoke against Moses because of the Ethiopian woman whom he had married... 'Has the Lord indeed spoken only through Moses?'... And suddenly Miriam became leprous, as white as snow",
      "మోషే పెండ్లిచేసికొనిన కూషు దేశపు స్త్రీనిబట్టి మిర్యాము అహరోనులు అతనికి విరోధముగా మాట్లాడిరి... యెహోవా మోషే చేత మాత్రమే మాట్లాడించెనా?... అప్పుడు మిర్యాము మంచువలె తెల్లని కుష్ఠుగలదాయెను",
      "Envy of God's appointed servant brought instantaneous divine chastisement, healed only by Moses' meek intercession.",
      "దేవుని సేవకునిపై గర్వముతో విమర్శలు చేసిన మిర్యాము కుష్ఠురోగిగా మారి సంఘము వెలుపల ఏడు దినములు ఉండవలసి వచ్చెను."
    ],
    [
      "Joseph's ten brothers selling him into Egyptian slavery out of bitter jealousy and their later crushing guilt",
      "అసూయతో యోసేపును ఐగుప్తు బానిసత్వమునకు అమ్మివేసి దశాబ్దాల తరువాత తీరని అపరాధ భావముతో కుమిలిపోయిన సహోదరుల వైఫల్యము",
      "Genesis 37:28; 42:21",
      "Then Midianite traders passed by; so the brothers pulled Joseph up and lifted him out of the pit, and sold him to the Ishmaelites for twenty shekels of silver... And they said to one another, 'We are truly guilty concerning our brother'",
      "మిద్యానీయులైన వర్తకులు ఆ మార్గమున వెళ్లుచుండగా వారు ఆ గుంటలోనుండి యోసేపును పైకి తీసి, ఇరువది తులముల వెండికి ఇష్మాయేలీయులకు అతనిని అమ్మివేసిరి... వారు-నిజముగా మనము మన సహోదరునియెడల నేరస్థులము అని ఒకరితో ఒకరు చెప్పుకొనిరి",
      "Cruel fraternal jealousy shattered a family for twenty years until God used famine and Joseph's grace to redeem the broken brothers.",
      "సహోదరునిపై అసూయతో చేసిన ఘోర పాపము వారి మనస్సాక్షిని వెంటాడినను, తుదకు దేవుని అద్భుత సంకల్పము వారిని క్షమాపణలోనికి నడిపించెను."
    ],
    [
      "The foolish man who built his house upon shifting sand only for it to collapse with great ruin in the storm",
      "బండపై కాక ఇసుకపై ఇల్లు కట్టుకొని వరదలు రాగానే మహా పతనమును పొందిన బుద్ధిహీనుని వైఫల్యము",
      "Matthew 7:26-27",
      "Everyone who hears these sayings of Mine and does not do them will be like a foolish man who built his house on the sand: and the rain descended, the floods came... and it fell. And great was its fall",
      "నా ఈ మాటలు విని వాటిచొప్పున చేయని ప్రతివాడును ఇసుకమీద తన యిల్లు కట్టుకొనిన బుద్ధిహీనుని పోలియుండును. వాన కురిసెను, వరదలు వచ్చెను... అది పడెను, దాని పడుట గొప్పది",
      "Hearing God's word without doing it builds an unstable life destined for catastrophic collapse when the storms of judgment strike.",
      "వాక్యమును విని దానిప్రకారము జీవించనివాడు ఇసుకపై ఇల్లు కట్టినవానివలె శోధన సమయములో నిలువలేక సమూలముగా కూలిపోవును."
    ],
    [
      "The five foolish virgins failing to take oil in their vessels and being locked out of the wedding banquet",
      "తమ దివిటీలతోపాటు పాత్రలలో నూనె తీసికొనక సిద్ధపాటులేక పెండ్లి విందునుండి వెలివేయబడిన ఐదుగురు బుద్ధిలేని కన్యకల వైఫల్యము",
      "Matthew 25:3,11-12",
      "Those who were foolish took their lamps and took no oil with them... Afterward the other virgins came also, saying, 'Lord, Lord, open to us!' But he answered and said, 'Assuredly, I say to you, I do not know you'",
      "బుద్ధిలేనివారు తమ దివిటీలు పట్టుకొని తమతోకూడ నూనె తీసికొనిపోలేదు... ఆ తరువాత తక్కిన కన్యకలు వచ్చి-అయ్యా, అయ్యా, మాకు తలుపు తీయుమని అడుగగా అతడు-మిమ్మును నేనెరుగనని మీతో నిశ్చయముగా చెప్పుచున్నాననెను",
      "Superficial external religion without the indwelling oil of the Spirit leads to eternal exclusion when the Bridegroom arrives.",
      "పైపై భక్తి కలిగి అంతరంగములో పరిశుద్ధాత్మ నూనె లేనివారు ప్రభువు రాకడ దినమందు నిత్య రాజ్యమునుండి తోసివేయబడుదురు."
    ],
    [
      "The wicked servant burying his talent in the earth out of fearful excuses and losing all reward",
      "యజమానుని గూర్చి తప్పుడు ఆలోచనతో భయపడి తన తలాంతును నేలలో దాచిపెట్టి సర్వస్వమును కోల్పోయిన సోమరి సేవకుని వైఫల్యము",
      "Matthew 25:24-25,30",
      "Lord, I knew you to be a hard man... And I was afraid, and went and hid your talent in the ground... And cast the unprofitable servant into the outer darkness. There will be weeping and gnashing of teeth",
      "అయ్యా, నీవు విత్తనిచోట కోయువాడవును... అని నేనెరుగుదును గనుక నేను భయపడి, వెళ్లి నీ తలాంతును నేలలో దాచిపెట్టితిని... ప్రయోజనములేని ఆ దాసుని వెలుపటి చీకటిలోనికి త్రోసివేయుడి, అక్కడ ఏడ్పును పండ్లు కొరుకుటయు నుండును",
      "Fear, sloth, and a distorted view of God's character produce useless inactivity that invites severe divine condemnation.",
      "దేవుడిచ్చిన తలాంతులను ఉపయోగించక భయముతో దాచిపెట్టినవాడు తన సమస్తమును కోల్పోయి తీర్పునకు పాత్రుడాయెను."
    ],
    [
      "The rich fool obsessively building larger storehouses while failing to be rich toward God, losing his soul that night",
      "తన ప్రాణముకొరకు ధాన్యాగారములను పెద్దవిగా కట్టుకొని దేవునియెడల ధనవంతుడు కాక అదే రాత్రి ప్రాణమును కోల్పోయిన ధనవంతుని మూర్ఖత్వము",
      "Luke 12:18-20",
      "I will pull down my barns and build greater... But God said to him, 'Fool! This night your soul will be required of you; then whose will those things be which you have provided?'",
      "నేను నా కొట్లను విప్పి వాటికంటె పెద్దవాటిని కట్టించి... అప్పుడు దేవుడు-వెఱ్ఱివాడా, యీ రాత్రి నీ ప్రాణమును అడుగుచున్నారు; నీవు సిద్ధపరచినవి ఎవనివగునని అతనితో చెప్పెను",
      "Material accumulation without eternal perspective is divine foolishness, ending abruptly at the inescapable judgment of God.",
      "లోక సంపదను కూడబెట్టుకొనుటయందే కాలము గడిపి దేవునిని మరచినవాడు శాశ్వతమైన ఆత్మ నాశనమును కొనితెచ్చుకొనును."
    ],
    [
      "The elder brother in the prodigal parable failing in self-righteous bitterness and refusing to celebrate restoration",
      "తప్పిపోయిన తమ్ముడు తిరిగి రాగా తండ్రి కనికరమును చూచి అసూయతో లోపలికి వెళ్లనొల్లని పెద్ద కుమారుని స్వనీతి వైఫల్యము",
      "Luke 15:28,30",
      "He was angry and would not go in. Therefore his father came out and pleaded with him... 'This son of yours has wasted your possessions with harlots'",
      "అయితే అతడు కోపపడి లోపలికి వెళ్లనొల్లకపోయెను గనుక అతని తండ్రి వెలుపలికి వచ్చి అతనిని బ్రతిమాలుకొనెను... వేశ్యలతో కలిసి నీ ఆస్తిని పాడుచేసిన ఈ నీ కుమారుడు రాగానే...",
      "Self-righteous legalism is just as alienated from the father's heart as rebellious prodigality, blinded by bitter envy.",
      "బయటకు విధేయునిగా కనబడినను హృదయములో కనికరములేని స్వనీతిపరుడు తండ్రి ఇచ్చే పవిత్ర ఆనందములో పాలుపొందలేకపోయెను."
    ],
    [
      "Aaron yielding to peer pressure to cast the golden calf while offering empty excuses to Moses",
      "ప్రజల ఒత్తిడికి లొంగిపోయి బంగారు దూడను పోతపోసి 'అగ్నిలో వేయగా దూడ బయటకు వచ్చెను' అని అబద్ధపు సాకులు చెప్పిన అహరోను బలహీనత",
      "Exodus 32:22,24",
      "Aaron said, 'Do not let the anger of my lord become hot. You know the people, that they are set on evil... So I said to them, Whoever has any gold... and I cast it into the fire, and this calf came out'",
      "అందుకు అహరోను-నా యేలినవాడా, కోపపడకుము; ఈ జనులు దుర్మార్గులని నీకు తెలియును గదా... నేను వారిని అడుగగా వారు తమ బంగారమును తీసి నాకిచ్చిరి; నేను దానిని అగ్నిలో వేయగా ఈ దూడ బయలుపడెననెను",
      "A leader who fears men rather than God invents absurd excuses to evade responsibility for spiritual catastrophe.",
      "ప్రజలకు భయపడి రాజీపడిన నాయకుడు తన స్వంత చేతులతో చేసిన విగ్రహారాధనకు సిగ్గుచేటైన సాకులను చెప్పెను."
    ],
    [
      "Nadab and Abihu offering profane fire before the Lord and being consumed instantly by fire from heaven",
      "యెహోవా ఆజ్ఞాపింపని అన్య అగ్నిని సన్నిధిలోనికి తెచ్చి అక్కడికక్కడే అగ్నిచేత దహింపబడిన నాదాబు అబీహుల ఘోర వైఫల్యము",
      "Leviticus 10:1-2",
      "Nadab and Abihu, the sons of Aaron, each took his censer and put fire in it, put incense on it, and offered profane fire before the Lord, which He had not commanded them. So fire went out from the Lord and devoured them",
      "అహరోను కుమారులైన నాదాబు అబీహులు తమ తమ ధూపార్తులను తీసికొని వాటిలో నిప్పులుంచి వాటిపై ధూపద్రవ్యము వేసి, యెహోవా తమకాజ్ఞాపింపని అన్య అగ్నిని ఆయన సన్నిధికి తెచ్చిరి. అప్పుడు యెహోవా సన్నిధినుండి అగ్ని బయలువెడలి వారిని కాల్చివేసెను",
      "Casual, presumptuous flippancy toward God's holy commandments in worship brings instantaneous divine judgment.",
      "దేవుని పరిశుద్ధతను నిర్లక్ష్యము చేసి స్వంత ఆలోచనతో ఆరాధన చేయబోయిన యాజకులు దేవుని ఉగ్రతాగ్నికి ఆహారమైరి."
    ],
    [
      "Gideon's post-victory failure making a golden ephod that became a snare to his family and all Israel",
      "మిద్యానీయులను జయించిన తరువాత బంగారు ఆభరణములతో ఏఫోదును చేయించి కుటుంబమునకు ఉరిగా మార్చిన గిద్యోను వైఫల్యము",
      "Judges 8:27",
      "Gideon made it into an ephod and set it up in his city, Ophrah. And all Israel played the harlot with it there. It became a snare to Gideon and to his house",
      "గిద్యోను దానితో ఒక ఏఫోదును చేయించి తన పట్టణమైన ఒఫ్రాలో దానిని ఉంచెను. ఇశ్రాయేలీయులందరు దానివైపు వ్యభిచరించిరి, అది గిద్యోనునకును అతని యింటివారికిని ఉరియాయెను",
      "A mighty warrior of faith introduced an unauthorized religious object after victory that corrupted his family line.",
      "యుద్ధములో గొప్ప జయముపొందిన గిద్యోను, తరువాత చేసిన ఒకే ఒక్క ఏఫోదు విగ్రహమువలె మారి తరతరములకు ఉరిగా పరిణమించెను."
    ],
    [
      "Jephthah making a rash vow before battle that brought devastating grief upon his only daughter",
      "యుద్ధమునకు ముందు విచక్షణారహితమైన మొక్కుబడి చేసి తన ఏకైక కుమార్తె జీవితమును దుఃఖభరితము చేసిన యెఫ్తా తొందరపాటు",
      "Judges 11:30-31,35",
      "Jephthah made a vow to the Lord, and said, 'If You will indeed deliver the people of Ammon into my hands, then it will be that whatever comes out of the doors of my house to meet me... shall surely be the Lord's'... And when he saw her, he tore his clothes",
      "యెఫ్తా యెహోవాకు మొక్కుబడి చేసి-నీవు నా చేతికి అమ్మోనీయులను నిశ్చయముగా అప్పగించినయెడల... నన్ను ఎదుర్కొనుటకు నా యింటి ద్వారమునుండి ఏది బయలువెళ్లునో అది యెహోవాకే చెందును అనెను... అతడు ఆమెను చూడగానే తన బట్టలు చింపుకొనెను",
      "Manipulative bargaining with God through unscriptural rash vows reaped an agonizing harvest of personal sorrow.",
      "దేవుని కృపను నమ్మక తొందరపాటుతో చేసిన ప్రమాణము యెఫ్తా కుటుంబములో తీరని విషాదమును నింపెను."
    ],
    [
      "Gehazi pursuing Naaman out of covetous greed, lying to Elisha, and being struck with Naaman's leprosy",
      "ధనాశతో నెయెమాను వెంటపడి వెండి వస్త్రములను దొంగిలించి ఎలీషాకు అబద్ధమాడి కుష్ఠురోగిగా మారిన గేహజీ పతనము",
      "2 Kings 5:20,27",
      "Gehazi, the servant of Elisha... said, 'As the Lord lives, I will run after him and take something from him'... 'Therefore the leprosy of Naaman shall cling to you and your descendants forever.' And he went out from his presence leprous, as white as snow",
      "దైవజనుడైన ఎలీషా సేవకుడైన గేహజీ-యెహోవా జీవముతోడు నేను అతనివెంట పరుగెత్తిపోయి అతనియొద్ద ఏదైనను తీసికొందుననుకొని... నెయెమానునకు కలిగిన కుష్ఠు నీకును నీ సంతానమునకును ఎల్లప్పుడును అంటుకొనుననెను; అప్పుడు అతడు మంచువలె తెల్లని కుష్ఠుగలవాడై ఆయన సన్నిధినుండి బయలువెళ్లెను",
      "Coveting material riches at the expense of God's free grace brought generational ruin upon the prophet's servant.",
      "ఉచితమైన దేవుని రక్షణను అమ్ముకొనజూచిన గేహజీ ధనాశ అతని జీవితమును మరియు సంతానమును కుష్ఠు శాపములోనికి నెట్టెను."
    ],
    [
      "King Belshazzar's blasphemous feast drinking from temple vessels and the handwriting on the wall 'Mene, Mene, Tekel, Upharsin'",
      "యెరూషలేము దేవాలయ పాత్రలలో ద్రాక్షారసము తాగుతూ విగ్రహములను పొగిడి గోడమీది రాతద్వారా తీర్పునొందిన బెల్షస్సరు పతనము",
      "Daniel 5:2-4,25-27",
      "Belshazzar gave orders to bring the gold and silver vessels which his father Nebuchadnezzar had taken from the temple... Then they brought the gold vessels... and drank from them... 'TEKEL: You have been weighed in the balances, and found wanting'",
      "బెల్షస్సరు ద్రాక్షారసము తాగుచుండగా తన తండ్రియైన నెబుకద్నెజరు యెరూషలేము ఆలయములోనుండి తెచ్చిన బంగారు వెండి పాత్రలను తెమ్మని ఆజ్ఞాపించెను... వారు వాటిలో తాగి బంగారు వెండి విగ్రహములను స్తుతించిరి... 'తెకేల్: నీవు త్రాసులో తూచబడి తక్కువగా కనబడితివి'",
      "Arrogant desecration of sacred vessels met terrifying, overnight divine judgment, terminating the Babylonian empire.",
      "దేవుని పరిశుద్ధతను అపహాస్యము చేసిన అహంకారియైన బెల్షస్సరు దేవుని త్రాసులో తూచబడి అదే రాత్రి ప్రాణమును రాజ్యాన్ని కోల్పోయెను."
    ],
    [
      "King Nebuchadnezzar's boasting over Great Babylon resulting in seven years of insanity living like a beast in the field",
      "తాను కట్టిన బబులోనును గూర్చి గర్వించి మాట్లాడగానే బుద్ధి కోల్పోయి ఏడు కాలములు పశువువలె గడ్డితిన్న నెబుకద్నెజరు గర్వ భంగము",
      "Daniel 4:30,33",
      "The king spoke, saying, 'Is not this great Babylon, that I have built for a royal dwelling by my mighty power and for the honor of my majesty?'... and he was driven from men and ate grass like oxen",
      "రాజు-నేను నా బలాధిక్యతను నా ప్రభావ ఘనతను కనుపరచుకొనుటకై నిర్మించిన మహా బబులోను ఇదే గదా అని తనలో అనుకొనెను... ఆ గడియలోనే ఆ మాట నెబుకద్నెజరు విషయములో నెరవేరెను; అతడు మనుష్యులలోనుండి వెలివేయబడి పశువులవలె గడ్డి తినెను",
      "God humbles the proudest monarchs into bestial degradation until they acknowledge that heaven rules supreme.",
      "సర్వశక్తిమంతుడైన పరలోక దేవుని ఘనపరచక తన బాహుబలమును అతిశయించిన మహా చక్రవర్తి పశువుగా మార్చబడి గర్వము అణచబడెను."
    ]
  ];

  return data.map(item => ({
    easyQ: `What biblical event or tragic consequence of human failure is recorded regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో వ్రాయబడిన వైఫల్యము లేదా పశ్చాత్తాప సత్యమేమి?`,
    medQ: `According to ${item[2]}, what specific scripture marks the turning point of conviction, confession, or consequence?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం పాపము బయలుపడినప్పుడు లేదా పశ్చాత్తాపపడినప్పుడు జరిగిన సంగతేమి?`,
    hardQ: `What profound theological warning or principle of divine restoration does ${item[2]} reveal to believers confronting failure?`,
    hardQTe: `${item[2]} లేఖనము ద్వారా మానవ వైఫల్యమును దేవుని క్షమాపణను గూర్చి విశ్వాసులు ఏ ఆత్మీయ పాఠమును గ్రహించవలెను?`,
    options: [item[3], "He gathered sixty iron chariots to seize the throne of Damascus", "He built forty stone altars across the desert of Moab", "He commanded seventy days of enforced silence across the land"],
    optionsTelugu: [item[4], "దమస్కు సింహాసనమును పట్టుకొనుటకు అరవై ఇనుప రథములను సమకూర్చెను", "మోయాబు అరణ్యమంతటను నలభై రాతి బలిపీఠములను కట్టెను", "దేశమంతటను డెబ్బై దినముల బలవంతపు నిశ్శబ్దమును విధించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Growth Facts for Failure (Old Testament Wisdom, Psalms, Prophets on stumbling, falling, rising again, and God's mercy)
function buildFailureGrowth() {
  const data = [
    ["Proverbs 24:16 on the righteous falling seven times and rising again, while the wicked stumble into calamity", "సామెతలు 24:16 నీతిమంతుడు ఏడుమారులు పడినను మరల లేచును, భక్తిహీనులు ఆపదలో కూలుదురు", "Proverbs 24:16", "\"For a righteous man may fall seven times and rise again, but the wicked shall fall by calamity\"", "\"నీతిమంతుడు ఏడుమారులు పడినను తిరుగ లేచును; భక్తిహీనులు విపత్తులో కూలుదురు\"", "Resilience defines righteousness; failing is not final because God's hand lifts the repentant believer.", "నీతిమంతుడు బలహీనతలో పడిపోయినను దేవుని కృపచేత లేచును; భక్తిహీనుని వలె వైఫల్యములో కూలిపోడు."],
    ["Psalm 37:23-24 on though the righteous fall, he shall not be utterly cast down, for the Lord upholds him with His hand", "కీర్తన 37:23-24 నీతిమంతుడు పడినను యెహోవా తన చేతితో అతనిని ఆదుకొనును గనుక అతడు నేలను పడియుండడు", "Psalm 37:24", "\"Though he fall, he shall not be utterly cast down; for the Lord upholds him with His hand\"", "\"యెహోవా అతని చెయ్యి పట్టుకొనియున్నాడు గనుక అతడు నేలను పడద్రోయబడడు (కూలిపోడు)\"", "God's grasp is stronger than our stumble; His covenant hand prevents fatal destruction.", "విశ్వాసి అడుగు జారినను దేవుని బలమైన చెయ్యి పట్టుకొని ఆదుకొనును గనుక అతడు శాశ్వతముగా నాశనము కాడు."],
    ["Psalm 145:14 on the Lord upholding all who fall and raising up all who are bowed down", "కీర్తన 145:14 పడిపోవువారినందరిని యెహోవా ఆదుకొనును, కృంగిపోయినవారినందరిని లేవనెత్తును", "Psalm 145:14", "\"The Lord upholds all who fall, and raises up all who are bowed down\"", "\"యెహోవా పడిపోవువారినందరిని ఆదుకొనువాడు, కృంగిపోయినవారినందరిని లేవనెత్తువాడు\"", "Universal divine posture toward human fragility: God is the lifter of bowed heads and failing feet.", "తన బలహీనతలో పడిపోయి కృంగినవారిని ప్రేమతో పైకి లేవనెత్తి నిలబెట్టువాడు మన దేవుడు."],
    ["Micah 7:8 declaring defiant faith amidst failure: 'Do not rejoice over me, my enemy; when I fall, I will arise; when I sit in darkness, the Lord will be a light to me'", "మీకా 7:8 'నా శత్రువా, నామీద సంతోషింపవద్దు; నేను పడినను లేతును, చీకటిలో కూర్చుండినను యెహోవా నాకు వెలుగుగా ఉండును'", "Micah 7:8", "\"Do not rejoice over me, my enemy; when I fall, I will arise; when I sit in darkness, the Lord will be a light to me\"", "\"నా శత్రువా, నామీద అతిశయింపవద్దు; నేను క్రిందపడినను మరల లేతును, నేను చీకటిలో కూర్చుండినను యెహోవా నాకు వెలుగుగా ఉండును\"", "Defiant hope rebukes the mocking enemy; the darkness of failure is pierced by God's personal light.", "శత్రువులు అపహాస్యము చేసినను దేవుని కృపను నమ్మి పడినచోటనుండే లేచి నిలువబడు భక్తుని విజయ గర్జన."],
    ["Psalm 34:18 on the Lord being near to those who have a broken heart and saving such as have a contrite spirit", "కీర్తన 34:18 విరిగిన హృదయముగలవారికి యెహోవా ఆసన్నుడు, నలిగిన మనస్సుగలవారిని ఆయన రక్షించును", "Psalm 34:18", "\"The Lord is near to those who have a broken heart, and saves such as have a contrite spirit\"", "\"విరిగిన హృదయముగలవారికి యెహోవా ఆసన్నుడు, నలిగిన మనస్సుగలవారిని ఆయన రక్షించును\"", "When failure crushes self-reliance, God draws extraordinarily near with saving healing.", "వైఫల్యము వలన హృదయము విరిగి నలిగినప్పుడు దేవుడు అత్యంత సమీపముగా ఉండి ఓదార్చును."],
    ["Psalm 73:26 declaring: 'My flesh and my heart fail; but God is the strength of my heart and my portion forever'", "కీర్తన 73:26 'నా శరీరమును నా హృదయమును క్షీణించిపోయినను, దేవుడు నిత్యము నా హృదయమునకు బండయు నా స్వాస్థ్యమునై యున్నాడు'", "Psalm 73:26", "\"My flesh and my heart fail; but God is the strength of my heart and my portion forever\"", "\"నా శరీరమును నా హృదయమును క్షీణించిపోయినను, దేవుడు నిత్యము నా హృదయమునకు ఆశ్రయదుర్గమును నా భాగమునై యున్నాడు\"", "Total physical and emotional failure is superseded by God's eternal strength and portion.", "మానవ శక్తినంతయు క్షీణించినను దేవుడే విశ్వాసికి నిరంతర ఆశ్రయదుర్గముగా నిలుచును."],
    ["Proverbs 28:13 on he who covers his sins will not prosper, but whoever confesses and forsakes them will have mercy", "సామెతలు 28:13 అతిక్రమములను దాచిపెట్టువాడు వర్ధిల్లడు, వాటిని ఒప్పుకొని విడిచిపెట్టువాడు కనికరము పొందును", "Proverbs 28:13", "\"He who covers his sins will not prosper, but whoever confesses and forsakes them will have mercy\"", "\"తన అతిక్రమములను దాచిపెట్టువాడు వర్ధిల్లడు, వాటిని ఒప్పుకొని విడిచిపెట్టువాడు కనికరము పొందును\"", "The divine formula for recovery from failure: honest confession coupled with genuine repentance unlocks mercy.", "పాపపు వైఫల్యమును దాచగోరువాడు నాశనమగును; దానిని యథార్థముగా ఒప్పుకొని విడిచిపెట్టువాడు కనికరమును పొందును."],
    ["Psalm 103:10-12 on He has not dealt with us according to our sins, nor punished us according to our iniquities", "కీర్తన 103:10-12 మన పాపములనుబట్టి ఆయన మనకు ప్రతికారము చేయలేదు, తూర్పునకు పడమర ఎంత దూరమో అంత దూరముగా మన అతిక్రమములను తొలగించెను", "Psalm 103:12", "\"As far as the east is from the west, so far has He removed our transgressions from us\"", "\"తూర్పునకు పడమర ఎంత దూరమో ఆయన మన అతిక్రమములను మనకు అంత దూరము చేసియున్నాడు\"", "Infinite cosmic pardon: God measures the distance of forgiveness across infinite horizons.", "విశ్వాసి వైఫల్యములను దేవుడు లెక్కకట్టక తూర్పునకు పడమరకు ఉన్నంత అనంత దూరముగా విసిరివేయును."],
    ["Psalm 103:13-14 on the Lord remembering our frame, knowing that we are dust", "కీర్తన 103:13-14 మన నిర్మితి ఆయనకు తెలిసేయున్నది, మనము ధూళియై యున్నామని ఆయన జ్ఞాపకము చేసికొనుచున్నాడు", "Psalm 103:14", "\"For He knows our frame; He remembers that we are dust\"", "\"మన నిర్మితి ఆయనకు తెలిసేయున్నది, మనము ధూళియై యున్నామని ఆయన జ్ఞాపకము చేసికొనుచున్నాడు\"", "Compassionate realism: God knows our creaturely limitations and pities failing mortals like a loving father.", "మట్టితో చేయబడిన మన బలహీనతలను దేవుడు ఎరిగియుండి తండ్రి కుమారులను కరుణించునట్లు కనికరించును."],
    ["Psalm 130:3-4 declaring: 'If You, Lord, should mark iniquities, O Lord, who could stand? But there is forgiveness with You, that You may be feared'", "కీర్తన 130:3-4 'యెహోవా, నీవు దోషములను కనిపెట్టి చూచినయెడల ఎవడు నిలువగలడు? అయినను జనులు నీయందు భయభక్తులు నిలుపునట్లు నీయొద్ద క్షమాపణ దొరుకును'", "Psalm 130:3-4", "\"If You, Lord, should mark iniquities, O Lord, who could stand? But there is forgiveness with You, that You may be feared\"", "\"యెహోవా, నీవు దోషములను కనిపెట్టి చూచినయెడల ప్రభువా, ఎవడు నిలువగలడు? అయినను జనులు నీయందు భయభక్తులు నిలుపునట్లు నీయొద్ద క్షమాపణ దొరుకును\"", "Absolute failure before divine scrutiny is met by the breathtaking reality of holy forgiveness.", "దేవుడు మన తప్పులను ఎంచితే ఎవరము నిలువలేము; అయితే ఆయనయొద్ద క్షమాపణ కలదు గనుక భయభక్తులు కలిగి జీవింతుము."],
    ["Isaiah 1:18 on though your sins are like scarlet, they shall be as white as snow; though red like crimson, like wool", "యెషయా 1:18 'మీ పాపములు రక్తమువలె ఎర్రనివైనను హిమమువలె తెల్లబడును, కెంపువలె ఎర్రనివైనను అవి గొఱ్ఱెబొచ్చువలె అగును'", "Isaiah 1:18", "\"Come now, and let us reason together, says the Lord: though your sins are like scarlet, they shall be as white as snow; though they are red like crimson, they shall be as wool\"", "\"రండి, మన వివాదము తీర్చుకొందము అని యెహోవా సెలవిచ్చుచున్నాడు; మీ పాపములు రక్తమువలె ఎర్రనివైనను అవి హిమమువలె తెల్లబడును; కెంపువలె ఎర్రనివైనను అవి గొఱ్ఱెబొచ్చువలె అగును\"", "Sovereign detergent grace: God purges the deepest, most permanent stains of moral failure.", "ఘోరమైన పాపపు మరకలను సైతం యేసు రక్తము హిమముకంటె తెల్లగా కడిగి పవిత్రపరచును."],
    ["Isaiah 42:3 on a bruised reed He will not break, and smoking flax He will not quench", "యెషయా 42:3 నలిగిన రెల్లును ఆయన విరువడు, మసకబారిన దీపపు వత్తిని ఆయన ఆర్పడు", "Isaiah 42:3", "\"A bruised reed He will not break, and smoking flax He will not quench; He will bring forth justice for truth\"", "\"నలిగిన రెల్లును అతడు విరువడు, మసకబారిన దీపపు వత్తిని ఆర్పడు; అతడు సత్యమునుబట్టి న్యాయమును తీర్చును\"", "Tender messianic compassion: Christ does not discard damaged, smoking, or broken lives.", "వైఫల్యముచేత నలిగిపోయిన జీవితములను క్రీస్తు విరిచివేయక, ఆరిపోయే విశ్వాసపు దీపమును మరల వెలిగించును."],
    ["Isaiah 43:25 on I, even I, am He who blots out your transgressions for My own sake; and I will not remember your sins", "యెషయా 43:25 'నేను నేనే నా నిమిత్తమై నీ అతిక్రమములను తుడిచివేయుచున్నాను, నీ పాపములను ఇకను జ్ఞాపకము చేసికొనను'", "Isaiah 43:25", "\"I, even I, am He who blots out your transgressions for My own sake; and I will not remember your sins\"", "\"నేను నేనే నా నిమిత్తమై నీ అతిక్రమములను తుడిచివేయుచున్నాను, నేను నీ పాపములను జ్ఞాపకము చేసికొనను\"", "Divine amnesia driven by sovereign love: God blots out failures and permanently buries their memory.", "తన స్వంత మహిమకొరకే దేవుడు మన పాపములను తుడిచివేసి ఇక ఎన్నడును జ్ఞాపకము చేసికొనడు."],
    ["Isaiah 55:7 on letting the wicked forsake his way, and returning to the Lord who will abundantly pardon", "యెషయా 55:7 భక్తిహీనులు తమ మార్గమును విడిచి యెహోవాయొద్దకు తిరుగవలెను, ఆయన బహుగా క్షమించును", "Isaiah 55:7", "\"Let the wicked forsake his way, and the unrighteous man his thoughts; let him return to the Lord, and He will have mercy on him; and to our God, for He will abundantly pardon\"", "\"భక్తిహీనులు తమ మార్గమును విడువవలెను, నీతిబాహ్యులు తమ తలంపులను మానవలెను; వారు యెహోవాయొద్దకు తిరిగినయెడల ఆయన వారిని కరుణించును, మన దేవునియొద్దకు తిరిగినయెడల ఆయన బహుగా క్షమించును\"", "Generous, overflowing pardon awaits every straying sinner who abandons foolish ways.", "పాపపు మార్గములను విడిచి దేవునియొద్దకు వచ్చువారికి ఆయన సమృద్ధియైన క్షమాపణను సిద్ధపరచియున్నాడు."],
    ["Jeremiah 3:22 calling: 'Return, you backsliding children, and I will heal your backslidings'", "యిర్మీయా 3:22 'తిరుగుబాటు చేసిన పిల్లలారా, తిరిగి రండి; నేను మీ తిరుగుబాటుతనమును స్వస్థపరచెదను'", "Jeremiah 3:22", "\"Return, you backsliding children, and I will heal your backslidings. Indeed we do come to You, for You are the Lord our God\"", "\"తిరుగుబాటు చేసిన పిల్లలారా, తిరిగి రండి; నేను మీ తిరుగుబాటుతనమును స్వస్థపరచెదను. ఇదిగో మేము నీయొద్దకు వచ్చుచున్నాము; నీవే మా దేవుడవైన యెహోవావు\"", "Therapeutic grace: God treats backsliding and chronic failure not merely as a crime, but as a sickness to be healed.", "దేవుని విడిచి పడిపోయిన స్థితిని కేవలము శిక్షించక ప్రేమతో స్వస్థపరచు తండ్రి పిలుపు."],
    ["Lamentations 3:31-33 on the Lord not casting off forever, though He causes grief He will show compassion", "విలాపవాక్యములు 3:31-33 ప్రభువు సదాకాలము విడనాడడు, ఆయన బాధ కలుగజేసినను తన కృపాసమృద్ధినిబట్టి జాలిపడును", "Lamentations 3:31-32", "\"For the Lord will not cast off forever. Though He causes grief, yet He will show compassion according to the multitude of His mercies\"", "\"ప్రభువు సదాకాలము విడనాడడు; ఆయన బాధ కలుగజేసినను తన కృపాబాహుళ్యముచొప్పున జాలిపడును\"", "Chastening is temporal; covenant compassion is eternal and boundless.", "పాపమువలన శ్రమలు వచ్చినను దేవుడు శాశ్వతముగా విడిచిపెట్టక తన అపార కృపచేత మరల ఆదరించును."],
    ["Ezekiel 18:21-23 on if a wicked man turns from his sins, he shall surely live; God has no pleasure in the death of the wicked", "యెహెజ్కేలు 18:21-23 దుష్టుడు పశ్చాత్తాపపడి నీతిని జరిగించినయెడల అతడు నిశ్చయముగా బ్రదుకును, దుష్టుని మరణమందు దేవునికి ఏ మాత్రము సంతోషము లేదు", "Ezekiel 18:23", "\"Do I have any pleasure at all that the wicked should die? says the Lord God, and not that he should turn from his ways and live?\"", "\"దుష్టుడు మరణించుటవలన నాకేమైన సంతోషము కలుగునా? అతడు తన ప్రవర్తనను దిద్దుకొని బ్రదుకుటయే గదా నాకు సంతోషము? అని ప్రభువైన యెహోవా సెలవిచ్చుచున్నాడు\"", "God's heart beats for life and restoration, celebrating repentance over punitive destruction.", "పాపి నాశనమగుట దేవునికి ఇష్టములేదు; అతడు తన మార్గమును దిద్దుకొని జీవించుటయే దేవుని పరమ సంతోషము."],
    ["Ezekiel 33:11 swearing by His own life: 'As I live, says the Lord God, I have no pleasure in the death of the wicked, but that the wicked turn from his way and live'", "యెహెజ్కేలు 33:11 'నా జీవముతోడు దుష్టుడు మరణించుటవలన నాకు సంతోషము లేదు, దుష్టుడు తన మార్గమునుండి మరలి బ్రదుకుటయే నాకు సంతోషము'", "Ezekiel 33:11", "\"Say to them: As I live, says the Lord God, I have no pleasure in the death of the wicked, but that the wicked turn from his way and live. Turn, turn from your evil ways! For why should you die?\"", "\"వారితో ఇట్లనుము-నా జీవముతోడు దుష్టుడు మరణించుటవలన నాకు సంతోషము లేదు, దుష్టుడు తన మార్గమునుండి మరలి బ్రదుకుటయే నాకు సంతోషము; ఇశ్రాయేలు వంశస్థులారా, మళ్లుకొనుడి, మీ చెడు ప్రవర్తననుండి మళ్లుకొనుడి; మీరెందుకు మరణింతురు? అని ప్రభువైన యెహోవా సెలవిచ్చుచున్నాడు\"", "An urgent prophetic plea: divine oath guaranteeing salvation to any failing rebel who turns.", "తన జీవముతోడు ప్రమాణము చేసి దేవుడు పాపులను నాశనమునుండి రక్షించుటకు పిలుచుచున్న ప్రేమ స్వరము."],
    ["Hosea 6:1 declaring: 'Come, and let us return to the Lord; for He has torn, but He will heal us; He has stricken, but He will bind us up'", "హోషేయ 6:1 'రండి, మనము యెహోవాయొద్దకు తిరుగుదము; ఆయన మనలను గాయపరచెను, ఆయనే మనలను బాగుచేయును'", "Hosea 6:1", "\"Come, and let us return to the Lord; for He has torn, but He will heal us; He has stricken, but He will bind us up. After two days He will revive us; on the third day He will raise us up\"", "\"రండి, మనము యెహోవాయొద్దకు తిరుగుదము; ఆయన మనలను చీల్చివేసెను గాని ఆయనే మనలను బాగుచేయును, ఆయన మనలను గాయపరచెను గాని ఆయనే గాయము కట్టును; రెండు దినములైన తరువాత ఆయన మనలను బ్రదికించును, మూడవ దినమున మనలను లేపును\"", "The same holy God who convicts and wounds our pride will tenderly bind and heal our brokenness.", "మన పాపములను గద్దించి శిక్షించిన దేవుడే తన ప్రేమతో మన గాయములను కట్టి పునరుద్ధరించును."],
    ["Hosea 14:4 promising: 'I will heal their backsliding, I will love them freely, for My anger has turned away from him'", "హోషేయ 14:4 'వారు నన్ను విడిచిపోయిన దోషమును నేను నివారించెదను, వారిమీది నా కోపము చల్లారెను గనుక వారిని మనఃపూర్వకముగా ప్రేమించెదను'", "Hosea 14:4", "\"I will heal their backsliding, I will love them freely, for My anger has turned away from him. I will be like the dew to Israel; he shall grow like the lily\"", "\"వారు నన్ను విడిచిపోయిన దోషమును నేను నివారించెదను, వారిమీది నా కోపము చల్లారెను గనుక వారిని మనఃపూర్వకముగా ప్రేమించెదను; నేను ఇశ్రాయేలునకు మంచువంటివాడనగుదును, అతడు కలువవలె వికసించును\"", "Unconditional covenant restoration: God loves failing wanderers freely and restores their flourishing.", "పడిపోయిన ప్రజలను ఉచితముగా ప్రేమించి మంచువలె వారిపై దిగివచ్చి వికసింపజేయు దేవుని వాగ్దానము."],
    ["Joel 2:12-13 commanding: 'Turn to Me with all your heart, with fasting, with weeping, and with mourning; so rend your heart, and not your garments'", "యోవేలు 2:12-13 'మీ వస్త్రములను కాక మీ హృదయములను చింపుకొని మీ దేవుడైన యెహోవాయొద్దకు తిరుగుడి; ఆయన దయాదాక్షిణ్యములు గలవాడు'", "Joel 2:13", "\"So rend your heart, and not your garments; return to the Lord your God, for He is gracious and merciful, slow to anger, and of great kindness\"", "\"మీ దేవుడైన యెహోవా దయాదాక్షిణ్యములు గలవాడును, శాంతమూర్తియు, కృపాబాహుళ్యము గలవాడును, బాధను నివారించుటకు సంతాపపడువాడునై యున్నాడు గనుక మీ వస్త్రములను కాక మీ హృదయములను చింపుకొని ఆయనతట్టు తిరుగుడి\"", "Inward repentance over outward theatrical display unlocks the treasury of God's abundant kindness.", "పైపై ఆచారములను మాని హృదయమును పశ్చాత్తాపముతో దేవుని సన్నిధిలో కుమ్మరించుటయే నిజమైన విడుదల."],
    ["Joel 2:25 promising: 'So I will restore to you the years that the swarming locust has eaten'", "యోవేలు 2:25 'మిడతలు తినివేసిన సంవత్సరముల పంటను నేను మీకు మరల ఇచ్చెదను'", "Joel 2:25", "\"So I will restore to you the years that the swarming locust has eaten, the crawling locust, the consuming locust, and the chewing locust, My great army which I sent among you\"", "\"మిమ్మును బాధించుటకై నేను పంపిన నా గొప్ప సైన్యమైన మిడతలును గొంగళిపురుగులును పచ్చపురుగులును చీడపురుగులును తినివేసిన సంవత్సరముల పంటను మీకు మరల ఇచ్చెదను\"", "Divine compensation: God can miraculously restore wasted, broken years squandered in spiritual failure.", "పాపమువలన శత్రువు తినివేసిన వ్యర్థమైన సంవత్సరముల ఆశీర్వాదములను దేవుడు రెట్టింపుగా పునరుద్ధరించును."],
    ["Amos 9:11 promising: 'On that day I will raise up the tabernacle of David, which has fallen down, and repair its damages'", "ఆమోసు 9:11 'ఆ దినమున పడిపోయిన దావీదు గుడారమును నేను మరల లేపెదను, దాని గోడల బీటలను బాగుచేసెదను'", "Amos 9:11", "\"On that day I will raise up the tabernacle of David, which has fallen down, and repair its damages; I will raise up its ruins, and rebuild it as in the days of old\"", "\"ఆ దినమున పడిపోయిన దావీదు గుడారమును నేను మరల లేపెదను, దాని గోడల బీటలను బాగుచేసెదను, దాని శిథిలములను బాగుచేసి పూర్వపువలె దాని నిర్మించెదను\"", "Messianic resurrection power repairs historical ruin, turning fallen dynasties into Christ's eternal kingdom.", "శిథిలమై పడిపోయిన దావీదు వంశమునుండి మెస్సీయను లేపి నిత్య రాజ్యముగా స్థాపించిన దేవుని రక్షణ ప్రణాళిక."],
    ["Zechariah 3:1-4 on Joshua the high priest standing in filthy garments before the Angel, Satan accusing him, and God clothing him in rich robes", "జెకర్యా 3:1-4 మురికి బట్టలు ధరించిన ప్రధానయాజకుడైన యెహోషువను సాతాను నిందింపగా, 'మురికి బట్టలను తీసివేసి విలువైన వస్త్రములను తొడిగించుడి' అను దైవిక క్షమాపణ", "Zechariah 3:3-4", "\"Now Joshua was clothed with filthy garments, and was standing before the Angel... 'Take away the filthy garments from him... See, I have removed your iniquity from you, and I will clothe you with rich robes'\"", "\"యెహోషువ మురికి బట్టలు ధరించుకొని దూతయెదుట నిలువబడియుండగా... దూత-ఇతని మురికి బట్టలను తీసివేయుడని ఆజ్ఞాపించెను; మరియు ఆయన-చూడుము, నీ దోషమును పరిహరించితిని, విచిత్రమైన వస్త్రములు నీకు ధరింపజేసెదననెను\"", "Justification by grace: Satan's legal accusations silenced when God removes our filthy sins and clothes us in Christ's righteousness.", "మన పాపపు మురికి వస్త్రములను తీసివేసి సాతాను నోరు మూయించి క్రీస్తు నీతి వస్త్రములను ధరింపజేయు విమోచన సత్యము."],
    ["Zechariah 4:6 proclaiming: 'Not by might nor by power, but by My Spirit, says the Lord of hosts'", "జెకర్యా 4:6 'శక్తిచేతనైనను బలముచేతనైనను కాదు గాని నా ఆత్మచేతనే ఇది జరుగునని సైన్యములకధిపతియైన యెహోవా సెలవిచ్చుచున్నాడు'", "Zechariah 4:6", "\"So he answered and said to me: This is the word of the Lord to Zerubbabel: Not by might nor by power, but by My Spirit, says the Lord of hosts\"", "\"అతడు నాతో ఇట్లనెను-జెరుబ్బాబెలునకు వచ్చిన యెహోవా వాక్కు ఇదే: శక్తిచేతనైనను బలముచేతనైనను కాదు గాని నా ఆత్మచేతనే ఇది జరుగునని సైన్యములకధిపతియైన యెహోవా సెలవిచ్చుచున్నాడు\"", "When human resources fail utterly, God's Holy Spirit accomplishes sovereign spiritual reconstruction.", "మానవ బాహుబలము విఫలమైనచోట దేవుని పరిశుద్ధాత్మ బలమే కార్యసిద్ధిని కలుగజేయును."],
    ["Malachi 3:6 declaring: 'For I am the Lord, I do not change; therefore you are not consumed, O sons of Jacob'", "మలాకీ 3:6 'యెహోవానైన నేను మార్పులేనివాడను గనుక యాకోబు సంతతివారైన మీరు లయము కాలేదు'", "Malachi 3:6", "\"For I am the Lord, I do not change; therefore you are not consumed, O sons of Jacob\"", "\"యెహోవానైన నేను మార్పులేనివాడను గనుక యాకోబు సంతతివారైన మీరు లయము కాలేదు\"", "Divine immutability is our salvation; we are preserved through our chronic failures solely by God's unchanging nature.", "మనము తరచుగా తప్పిపోయినను దేవుడు తన మార్పులేని నమ్మకత్వమునుబట్టి మనలను నాశనము కాకుండ కాపాడుచున్నాడు."],
    ["Psalm 19:12-13 praying: 'Who can understand his errors? Cleanse me from secret faults. Keep back Your servant also from presumptuous sins'", "కీర్తన 19:12-13 'ఎవడు తన తప్పిదములను గ్రహింపగలడు? రహస్యమైన తప్పులనుండి నన్ను పవిత్రపరచుము; దురహంకార పాపములలో పడకుండ నీ సేవకుని ఆపుము'", "Psalm 19:12-13", "\"Who can understand his errors? Cleanse me from secret faults. Keep back Your servant also from presumptuous sins; let them not have dominion over me\"", "\"ఎవడు తన తప్పిదములను గ్రహింపగలడు? రహస్యమైన తప్పులనుండి నన్ను పవిత్రపరచుము; దురహంకార పాపములలో పడకుండ నీ సేవకుని ఆపుము, అవి నామీద ఏలుబడి చేయనియ్యకుము\"", "Humility recognizes unconscious blind spots and seeks preventative grace against wilful failure.", "తెలియక చేసిన రహస్య పాపములనుండి క్షమాపణ కోరుచూ దురహంకార పాపములలో పడకుండా కాపాడమని చేయు ప్రార్థన."],
    ["Psalm 23:3 promising: 'He restores my soul; He leads me in the paths of righteousness for His name's sake'", "కీర్తన 23:3 'ఆయన నా ప్రాణమునకు పునరుజ్జీవనము కలుగజేయుచున్నాడు, తన నామమునుబట్టి నన్ను నీతిమార్గములలో నడిపించుచున్నాడు'", "Psalm 23:3", "\"He restores my soul; He leads me in the paths of righteousness for His name's sake\"", "\"ఆయన నా ప్రాణమునకు పునరుజ్జీవనము కలుగజేయుచున్నాడు; తన నామమునుబట్టి నన్ను నీతిమార్గములలో నడిపించుచున్నాడు\"", "The Good Shepherd searches out wandering sheep and revives their exhausted, stumbling souls.", "దారి తప్పి పడిపోయిన గొఱ్ఱెలను మంచి కాపరియైన యేసు వెదకి తెచ్చి ప్రాణమును పునరుజ్జీవింపజేయును."],
    ["Psalm 25:6-7 praying: 'Remember, O Lord, Your tender mercies... Do not remember the sins of my youth, nor my transgressions'", "కీర్తన 25:6-7 'యెహోవా, నీ కనికరములను జ్ఞాపకము చేసికొనుము... నా యౌవనకాలపు పాపములను నా అతిక్రమములను జ్ఞాపకము చేసికొనకుము'", "Psalm 25:7", "\"Do not remember the sins of my youth, nor my transgressions; according to Your mercy remember me, for Your goodness' sake, O Lord\"", "\"నా యౌవనకాలపు పాపములను నా అతిక్రమములను జ్ఞాపకము చేసికొనకుము; యెహోవా, నీ దయనుబట్టి నీ కృపచొప్పున నన్ను జ్ఞాపకము చేసికొనుము\"", "Pleading God's character against one's historical baggage; resting in pure covenant benevolence.", "యౌవనదశలో అజ్ఞానముతో చేసిన పూర్వ వైఫల్యములను దేవుడు తన కృపచేత తుడిచివేయవలెనని వేడుకొనుట."],
    ["Psalm 25:11 pleading: 'For Your name's sake, O Lord, pardon my iniquity, for it is great'", "కీర్తన 25:11 'యెహోవా, నా దోషము గొప్పది, నీ నామమునుబట్టి దానిని క్షమించుము'", "Psalm 25:11", "\"For Your name's sake, O Lord, pardon my iniquity, for it is great\"", "\"యెహోవా, నా దోషము గొప్పది; నీ నామమునుబట్టి దానిని క్షమించుము\"", "Astonishing logic of grace: using the sheer magnitude of one's guilt as the argument for the greatness of God's pardoning glory.", "నా పాపము బహు గొప్పదని దాచక ఒప్పుకొని దేవుని నామ మహిమకొరకై క్షమాపణను వేడుకొను వినయము."],
    ["Psalm 32:1-2 declaring: 'Blessed is he whose transgression is forgiven, whose sin is covered. Blessed is the man to whom the Lord does not impute iniquity'", "కీర్తన 32:1-2 'తన అతిక్రమమునకు పరిహారము నొందినవాడు, తన పాపము కప్పబడినవాడు ధన్యుడు; యెహోవా చేత నిర్దోషి అని ఎంచబడినవాడు ధన్యుడు'", "Psalm 32:1-2", "\"Blessed is he whose transgression is forgiven, whose sin is covered. Blessed is the man to whom the Lord does not impute iniquity, and in whose spirit there is no deceit\"", "\"తన అతిక్రమమునకు పరిహారము నొందినవాడు, తన పాపము కప్పబడినవాడు ధన్యుడు; యెహోవాచేత నిర్దోషి అని ఎంచబడినవాడు ధన్యుడు, వాని ఆత్మలో కపటమేమియు లేదు\"", "The profound beatitude of justification: freedom from the crushing burden of unconfessed failure.", "పాపపు భారాన్ని దాచకుండా ఒప్పుకొని దేవునిచేత నీతిమంతునిగా తీర్చబడిన విశ్వాసి పొందే పరమ ధన్యత."],
    ["Psalm 32:5 testifying: 'I acknowledged my sin to You, and my iniquity I have not hidden. I said, I will confess my transgressions... and You forgave the iniquity of my sin'", "కీర్తన 32:5 'నా దోషమును కప్పుకొనక నీయెదుట నా పాపమును ఒప్పుకొంటిని; నా అతిక్రమములను యెహోవా సన్నిధిని ఒప్పుకొందుననుకొంటిని, అంతట నీవు నా పాపదోషమును పరిహరించితివి'", "Psalm 32:5", "\"I acknowledged my sin to You, and my iniquity I have not hidden. I said, 'I will confess my transgressions to the Lord,' and You forgave the iniquity of my sin\"", "\"నా దోషమును కప్పుకొనక నీయెదుట నా పాపమును ఒప్పుకొంటిని; నా అతిక్రమములను యెహోవా సన్నిధిని ఒప్పుకొందుననుకొంటిని, అంతట నీవు నా పాపదోషమును పరిహరించితివి\"", "Instantaneous release follows open confession; unburdening the conscience in God's presence.", "దేవుని సన్నిధిలో కపటములేక పాపమును ఒప్పుకొనిన మరుక్షణమే దేవుడు దానిని పూర్తిగా క్షమించివేసెను."],
    ["Psalm 40:12 on innumerable evils surrounding me, my iniquities have overtaken me, my heart fails me", "కీర్తన 40:12 లెక్కలేని దోషములు నన్ను చుట్టుకొనినవి, నా దోషములు నన్ను తరుమగా నేను చూడలేకపోతిని, నా గుండె కరిగిపోయినది", "Psalm 40:12", "\"For innumerable evils have surrounded me; my iniquities have overtaken me, so that I am not able to look up; they are more than the hairs of my head; therefore my heart fails me\"", "\"లెక్కలేని అపాయములు నన్ను చుట్టుకొనియున్నవి, నా దోషములు నన్ను తరుమగా నేను చూడలేకపోతిని; అవి నా తలవెండ్రుకలకంటె విస్తారముగా ఉన్నవి, నా హృదయము కరిగిపోయెను\"", "Honest assessment of the crushing weight of cumulative moral failure, driving the psalmist to cry for deliverance.", "తన దోషములు తలవెండ్రుకలకంటె విస్తారమై గుండె కరిగిపోయినప్పుడు దేవుని రక్షణకొరకై మొరపెట్టిన భక్తుడు."],
    ["Psalm 41:4 praying: 'Lord, be merciful to me; heal my soul, for I have sinned against You'", "కీర్తన 41:4 'యెహోవా, నన్ను కరుణించుము; నీకు విరోధముగా నేను పాపము చేసితిని, నా ప్రాణమును స్వస్థపరచుము'", "Psalm 41:4", "\"I said, 'Lord, be merciful to me; heal my soul, for I have sinned against You'\"", "\"యెహోవా, నన్ను కరుణించుము, నీకు విరోధముగా పాపము చేసితిని, నన్ను స్వస్థపరచుము అని నేనంటిని\"", "Viewing personal sin as a soul-sickness requiring the Divine Physician's restorative touch.", "పాపము ఆత్మకు తెచ్చిన రోగమును స్వస్థపరచుమని పరమ వైద్యుడైన దేవుని సన్నిధిలో చేసిన ప్రార్థన."],
    ["Psalm 56:13 praising: 'For You have delivered my soul from death. Have You not kept my feet from falling, that I may walk before God in the light of the living?'", "కీర్తన 56:13 'జీవపు వెలుగులో నేను దేవునిసన్నిధిని నడుచునట్లు నీవు నా ప్రాణమును మరణమునుండియు నా పాదములను జారకుండను తప్పించితివి గదా?'", "Psalm 56:13", "\"For You have delivered my soul from death. Have You not kept my feet from falling, that I may walk before God in the light of the living?\"", "\"నేను జీవపు వెలుగులో దేవునిసన్నిధిని నడుచునట్లు నీవు మరణమునుండి నా ప్రాణమును, జారకుండ నా పాదములను తప్పించితివి గదా?\"", "Deliverance from past stumbling empowers the believer to walk forward in divine light.", "పాదములు జారకుండ కాపాడి మరణమునుండి విడిపించిన దేవుని సన్నిధిలో జీవపు వెలుగులో నడుచుట."],
    ["Psalm 65:3 on iniquities prevailing against me; as for our transgressions, You will provide atonement for them", "కీర్తన 65:3 'దోషములు నాకంటె బలమైనవాయెను, మా అతిక్రమములకు నీవే ప్రాయశ్చిత్తము చేయుదువు'", "Psalm 65:3", "\"Iniquities prevail against me; as for our transgressions, You will provide atonement for them\"", "\"దోషములు నాకంటె బలమైనవాయెను; మా అతిక్రమములకు నీవే ప్రాయశ్చిత్తము చేయుదువు\"", "When our failures overwhelm our personal ability to resist, God Himself steps in to atone for our sin.", "పాపపు అలలు మనకంటె బలమైనప్పుడు మన స్వంత బలము చాలదు; దేవుడే సిలువలో ప్రాయశ్చిత్తము చేసెను."],
    ["Psalm 79:8-9 praying: 'Oh, do not remember former iniquities against us! Let Your tender mercies meet us speedily, for we have been brought very low'", "కీర్తన 79:8-9 'మా పూర్వికుల దోషములనుబట్టి మామీద పగపట్టకుము; మేము బహుగా కృంగియున్నాము గనుక నీ వాత్సల్యత త్వరగా మమ్మును ఎదుర్కొనును గాక'", "Psalm 79:8-9", "\"Oh, do not remember former iniquities against us! Let Your tender mercies speedily meet us, for we have been brought very low. Help us, O God of our salvation, for the glory of Your name\"", "\"మా పూర్వికుల దోషములనుబట్టి మామీద పగపట్టకుము; మేము బహుగా కృంగియున్నాము, నీ వాత్సల్యత త్వరగా మమ్మును ఎదుర్కొనును గాక. మా రక్షణకర్తవైన దేవా, నీ నామప్రభావమునుబట్టి మాకు సహాయము చేయుము\"", "Corporate confession pleading that generational failures will be met by urgent, proactive divine mercy.", "పూర్వ పాపములచేత సమాజము కృంగిపోయినప్పుడు దేవుని నామ మహిమకొరకై త్వరగా కనికరించుమని వేడుకొనుట."],
    ["Psalm 85:2 declaring: 'You have forgiven the iniquity of Your people; You have covered all their sin. Selah'", "కీర్తన 85:2 'నీవు నీ ప్రజల దోషమును పరిహరించియున్నావు, వారి పాపమంతయు కప్పియున్నావు'", "Psalm 85:2", "\"You have forgiven the iniquity of Your people; You have covered all their sin. Selah\"", "\"నీవు నీ ప్రజల దోషమును పరిహరించియున్నావు, వారి పాపమంతయు కప్పియున్నావు (సెలా)\"", "Atoning grace wraps a protective mantle over every dark failure of God's covenant family.", "తన ప్రజల సమస్త దోషములను పరిహరించి వారి బలహీనతలను తన కనికరపు వస్త్రముతో కప్పిన దేవుడు."],
    ["Psalm 86:5 praising: 'For You, Lord, are good, and ready to forgive, and abundant in mercy to all those who call upon You'", "కీర్తన 86:5 'ప్రభువా, నీవు దయాళుడవు క్షమించుటకు సిద్ధముగా ఉన్న మనస్సుగలవాడవు, నీకు మొరపెట్టువారికందరియెడల కృపాబాహుళ్యము గలవాడవు'", "Psalm 86:5", "\"For You, Lord, are good, and ready to forgive, and abundant in mercy to all those who call upon You\"", "\"ప్రభువా, నీవు దయాళుడవు క్షమించుటకు సిద్ధముగా ఉన్న మనస్సుగలవాడవు, నీకు మొరపెట్టువారికందరియెడల కృపాబాహుళ్యము గలవాడవు\"", "God's posture is never reluctant; His hand is perpetually extended, ready to forgive at the first cry.", "క్షమించుటకు ఎల్లప్పుడూ సిద్ధముగా ఉన్న దేవుని దయగల మనస్సు వైఫల్యములో ఉన్నవారికి నిరీక్షణనిచ్చును."],
    ["Psalm 89:30-34 on if his sons forsake My law, I will punish their transgression with the rod, nevertheless My lovingkindness I will not utterly take from him", "కీర్తన 89:30-34 అతని కుమారులు నా ధర్మశాస్త్రమును విడిచినయెడల బెత్తముతో వారి తిరుగుబాటును దండించెదను, అయినను నా కృపను అతనికి దూరం చేయను", "Psalm 89:32-33", "\"Then I will punish their transgression with the rod, and their iniquity with stripes. Nevertheless My lovingkindness I will not utterly take from him, nor allow My faithfulness to fail\"", "\"నేను బెత్తముతో వారి తిరుగుబాటును, దెబ్బలతో వారి దోషమును దండించెదను. అయినను నా కృపను అతనికి దూరం చేయను, నా నమ్మకత్వము తప్పిపోనియ్యను\"", "Covenant discipline differs fundamentally from total rejection; God disciplines to restore, never to destroy.", "తప్పిపోయిన బిడ్డలను దేవుడు శిక్షించినను తన నిబంధన ప్రేమను నమ్మకత్వమును ఎన్నడును విడిచిపెట్టడు."],
    ["Psalm 94:18 testifying: 'If I say, My foot slips, Your mercy, O Lord, will hold me up'", "కీర్తన 94:18 'నా కాలు జారెనని నేననుకొనగా, యెహోవా, నీ కృప నన్ను బలపరచుచున్నది (ఆదుకొనుచున్నది)'", "Psalm 94:18", "\"If I say, 'My foot slips,' Your mercy, O Lord, will hold me up\"", "\"నా కాలు జారెనని నేననుకొనగా, యెహోవా, నీ కృప నన్ను బలపరచుచున్నది\"", "The microsecond of stumbling is anticipated by God's steadfast chesed catching us before impact.", "కాలు జారుచున్న ఆ ప్రమాదపు క్షణములో సైతం దేవుని అద్భుత కృప వచ్చి మనలను పడిపోకుండా ఆదుకొనును."],
    ["Psalm 116:6-8 praising: 'I was brought low, and He saved me. Return to your rest, O my soul, for the Lord has dealt bountifully with you'", "కీర్తన 116:6-8 'నేను కృంగియుండగా ఆయన నన్ను రక్షించెను; నా ప్రాణమా, నీ విశ్రాంతిలోనికి మరల రమ్ము, యెహోవా నీకు ఉపకారము చేసియున్నాడు'", "Psalm 116:6-7", "\"The Lord preserves the simple; I was brought low, and He saved me. Return to your rest, O my soul, for the Lord has dealt bountifully with you\"", "\"యెహోవా నిష్కపటులను కాపాడువాడు; నేను కృంగియుండగా ఆయన నన్ను రక్షించెను. నా ప్రాణమా, యెహోవా నీకు ఉపకారము చేసియున్నాడు, నీ విశ్రాంతిలోనికి మరల రమ్ము\"", "Emerging from the valley of humiliation into deep spiritual tranquility through God's bountiful rescue.", "వైఫల్యమువలన అణగద్రొక్కబడిన ప్రాణమును దేవుడు రక్షించి తన పరమ విశ్రాంతిలోనికి నడిపించును."],
    ["Psalm 119:67 confessing: 'Before I was afflicted I went astray, but now I keep Your word'", "కీర్తన 119:67 'శ్రమ కలుగకమునుపు నేను త్రోవ విడిచితిని, ఇప్పుడైతే నీ వాక్యమును అనుసరించి నడుచుకొనుచున్నాను'", "Psalm 119:67", "\"Before I was afflicted I went astray, but now I keep Your word\"", "\"శ్రమ కలుగకమునుపు నేను త్రోవ విడిచితిని, ఇప్పుడైతే నీ వాక్యమును అనుసరించి నడుచుకొనుచున్నాను\"", "Sanctified suffering: adversity serves as God's guardrail to redirect wandering steps back to Scripture.", "శోధనలు శ్రమలు విశ్వాసి తప్పిపోయిన మార్గమునుండి సరిచేసి దేవుని వాక్యమందు నడుచునట్లు చేయును."],
    ["Psalm 119:71 declaring: 'It is good for me that I have been afflicted, that I may learn Your statutes'", "కీర్తన 119:71 'నేను నీ కట్టడలను నేర్చుకొనునట్లు శ్రమనొంది యుండుట నాకు మేలాయెను'", "Psalm 119:71", "\"It is good for me that I have been afflicted, that I may learn Your statutes\"", "\"నేను నీ కట్టడలను నేర్చుకొనునట్లు శ్రమనొంది యుండుట నాకు మేలాయెను\"", "Redemptive retrospect: looking back on painful failure and recognizing the spiritual wisdom it imparted.", "శ్రమల అనుభవము దేవుని కట్టడలను లోతుగా నేర్చుకొనుటకు మరియు ఆత్మీయంగా బలపడుటకు మేలుగా మారెను."],
    ["Psalm 119:176 closing the Great Psalm: 'I have gone astray like a lost sheep; seek Your servant, for I do not forget Your commandments'", "కీర్తన 119:176 కీర్తనల గ్రంథపు మహా కీర్తన ముగింపు: 'తప్పిపోయిన గొఱ్ఱెవలె నేను త్రోవ తప్పిపోతిని, నీ దాసుని వెదకుము; నేను నీ ఆజ్ఞలను మరచువాడను కాను'", "Psalm 119:176", "\"I have gone astray like a lost sheep; seek Your servant, for I do not forget Your commandments\"", "\"తప్పిపోయిన గొఱ్ఱెవలె నేను త్రోవ తప్పిపోతిని, నీ దాసుని వెదకుము; నేను నీ ఆజ్ఞలను మరచువాడను కాను\"", "Even after 175 verses praising God's word, the author closes by confessing his propensity to wander and begging the Shepherd to seek him.", "వాక్యమంతటిని ధ్యానించిన భక్తుడు సైతం తన బలహీనతను ఒప్పుకొని 'తప్పిపోయిన గొఱ్ఱెనైన నన్ను వెదకి పట్టుకొనుము' అని వేడుకొనుట."],
    ["Proverbs 16:18 warning: 'Pride goes before destruction, and a haughty spirit before a fall'", "సామెతలు 16:18 'నాశనమునకు ముందు గర్వము నడుచును, పడిపోవుటకు ముందు అహంకారపు మనస్సు నడుచును'", "Proverbs 16:18", "\"Pride goes before destruction, and a haughty spirit before a fall\"", "\"నాశనమునకు ముందు గర్వము నడుచును, పడిపోవుటకు ముందు అహంకారపు మనస్సు నడుచును\"", "The universal diagnosis of spiritual collapse: self-exaltation inevitably paves the highway to devastating failure.", "గర్వము మనుష్యుని వినాశనమునకు నడిపించును; పడిపోవుటకు ముందు హృదయమందు అహంకారము ప్రవేశించును."],
    ["Proverbs 18:12 on before destruction the heart of a man is haughty, and before honor is humility", "సామెతలు 18:12 నాశనమునకు ముందు హృదయపు గర్వముండును, ఘనతకు ముందు వినయము నడుచును", "Proverbs 18:12", "\"Before destruction the heart of a man is haughty, and before honor is humility\"", "\"నాశనమునకు ముందు నరుని హృదయము గర్వించును, ఘనతకు ముందు వినయముండును\"", "Spiritual gravity: pride pulls down into destruction, while humility elevates the fallen into divine honor.", "అహంకారము పతనమును తెచ్చును; విరిగిన హృదయముతో కూడిన వినయమే దేవుని ఘనతను పొందుకొనును."],
    ["Ecclesiastes 7:20 on there is not a just man on earth who does good and does not sin", "ప్రసంగి 7:20 భూమిమీద పాపము చేయక మేలే చేయుచుండు నీతిమంతుడు ఒక్కడైనను లేడు", "Ecclesiastes 7:20", "\"For there is not a just man on earth who does good and does not sin\"", "\"పాపము చేయక మేలే చేయుచుండు నీతిమంతుడు భూమిమీద ఒకడైనను లేడు\"", "Universal mortal fallibility: recognizing universal weakness disarms self-righteous hypocrisy.", "సమస్త మానవాళి బలహీనతలకు లోనగువారే; ఏ ఒక్కడును స్వంత బలముచేత సంపూర్ణ నీతిమంతుడు కాలేడు."],
    ["Ecclesiastes 4:9-10 on two being better than one, for if they fall, one will lift up his companion, but woe to him who is alone when he falls", "ప్రసంగి 4:9-10 ఒక్కనికంటె ఇద్దరు కూడుట మేలు; వారు పడిపోయినయెడల ఒకడు తన తోడివానిని లేవనెత్తును, ఒంటరిగా ఉండి పడిపోయినవానికి శ్రమ", "Ecclesiastes 4:10", "\"For if they fall, one will lift up his companion. But woe to him who is alone when he falls, for he has no one to help him up\"", "\"వారు పడిపోయినయెడల ఒకడు తన తోడివానిని లేవనెత్తును; అయితే ఒంటరిగా ఉండి పడిపోయినవానికి శ్రమ, వానిని లేవనెత్తుటకు రెండవవాడు లేకపోవును\"", "Community therapy: spiritual fellowship provides the loving hands needed to raise up a fallen brother.", "విశ్వాస జీవితములో ఒంటరితనము ప్రమాదకరము; సహవాసము పడిపోయిన విశ్వాసిని ప్రేమతో పైకి లేవనెత్తును."],
    ["Isaiah 57:15 on the High and Lofty One who inhabits eternity dwelling with him who has a contrite and humble spirit to revive the heart of the contrite", "యెషయా 57:15 మహోన్నతుడును నిత్యనివాసియునైన దేవుడు నలిగినవారి మనస్సును బ్రదికించుటకు విరిగి నలిగిన దీనులయొద్ద నివసించును", "Isaiah 57:15", "\"For thus says the High and Lofty One who inhabits eternity, whose name is Holy: 'I dwell in the high and holy place, with him who has a contrite and humble spirit, to revive the spirit of the humble, and to revive the heart of the contrite ones'\"", "\"మహోన్నతుడును నిత్యనివాసియు పరిశుద్ధుడునను నామము గలవాడు ఈలాగు సెలవిచ్చుచున్నాడు-నేను మహోన్నతమైన పరిశుద్ధస్థలమందు నివసించువాడను, అయినను వినయముగలవారి ప్రాణమును ఉజ్జీవింపజేయుటకును నలిగినవారి హృదయమును బ్రదికించుటకును, విరిగి నలిగిన మనస్సుగలవారియొద్ద నివసించుచున్నాను\"", "The transcendent Sovereign chooses as His temple the crushed, humbled heart of the repentant soul.", "మహా ఘనుడైన దేవుడు తన వైఫల్యమునుబట్టి విరిగి నలిగిన దీనుల హృదయములలో నివసించి వారిని నూతనముగా ఉజ్జీవింపజేయును."]
  ];

  return data.map(item => ({
    easyQ: `What biblical truth or promise of recovery from failure is taught regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన బోధ లేదా వాగ్దానమేమి?`,
    medQ: `According to ${item[2]}, how does God respond to the fallen believer who repents?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం పడిపోయిన విశ్వాసి పశ్చాత్తాపపడినప్పుడు దేవుడు ఎలా స్పందించును?`,
    hardQ: `What theological principle does ${item[2]} reveal about divine grace, restoration, and perseverance through failure?`,
    hardQTe: `${item[2]} ప్రకారం వైఫల్యమును జయించుటకు దేవుని కృప మరియు ఆత్మీయ పునరుద్ధరణను గూర్చి విశ్వాసులు ఏమి గ్రహించవలెను?`,
    options: [item[3], "He commands fifty silver trumpets sounded across the desert of Edom", "He requires forty days of legal disputation before the elders", "He ordains sixty stone pillars erected at the valley of Hinnom"],
    optionsTelugu: [item[4], "ఎదోము అరణ్యములో యాబై వెండి బూరలను ఊదవలెనని ఆజ్ఞాపించెను", "పెద్దలయెదుట నలభై దినముల చట్టపరమైన వాదనలు చేయవలెనని కోరెను", "హిన్నోము లోయలో అరవై రాతి స్తంభములను నిలుపుటకు నియమించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Mastery Facts for Failure (New Testament Grace, Cross, Advocate, Romans 8, Overcoming, Restoration of the Fallen)
function buildFailureMastery() {
  const data = [
    [
      "1 Corinthians 10:12-13 warning: 'Let him who thinks he stands take heed lest he fall' and promising God will make a way of escape",
      "1 కొరింథీయులకు 10:12-13 'తాను నిలుచుచున్నానని తలంచుకొనువాడు పడిపోకుండునట్లు జాగ్రత్తగా చూచుకొనవలెను'; శోధనను సహించుటకు దేవుడు తప్పించుకొను మార్గము కలుగజేయును",
      "1 Corinthians 10:12-13",
      "Therefore let him who thinks he stands take heed lest he fall. No temptation has overtaken you except such as is common to man; but God is faithful, who will not allow you to be tempted beyond what you are able",
      "తాను నిలుచుచున్నానని తలంచుకొనువాడు పడిపోకుండునట్లు జాగ్రత్తగా చూచుకొనవలెను. సాధారణముగా మనుష్యులకు కలుగు శోధన తప్ప మరి ఏదియు మీకు సంభవింపలేదు; దేవుడు నమ్మదగినవాడు, మీరు సహింపగలిగినంతకంటె ఎక్కువగా ఆయన మిమ్మును శోధింపబడనియ్యడు",
      "Overconfidence precedes falling; God's covenant faithfulness guarantees a divine exit route in every trial.",
      "స్వనీతితో విర్రవీగువాడు పడిపోవును; శోధన ఎదురైనప్పుడు సహించుటకు దేవుడే నమ్మకముగా తప్పించుకొను మార్గమును చూపును."
    ],
    [
      "Galatians 6:1-2 commanding the spiritual restoration of fallen believers in a spirit of gentleness, considering oneself",
      "గలతీయులకు 6:1-2 ఎవరైనా తప్పిదములో పడినయెడల ఆత్మసంబంధులైనవారు సాత్వికమైన మనస్సుతో అట్టివానిని స్థిరపరచవలెను; నీవును శోధింపబడకుండునట్లు చూచుకొనుము",
      "Galatians 6:1",
      "Brethren, if a man is overtaken in any trespass, you who are spiritual restore such a one in a spirit of gentleness, considering yourself lest you also be tempted",
      "సహోదరులారా, ఒకడు ఏ తప్పిదములోనైనను చిక్కుబడినయెడల ఆత్మసంబంధులైన మీలో ప్రతివాడును తానును శోధింపబడుదునేమో అని తన్నుతాను చూచుకొనుచు, సాత్వికమైన మనస్సుతో అట్టివానిని మంచిదారికి తీసికొనిరావలెను",
      "The church's mandate toward fallen saints is surgical, gentle restoration (katartizo), mindful of our own frailty.",
      "పడిపోయిన సహోదరుని నిందింపక తానూ బలహీనుడనేనని గుర్తించి సాత్వికముతో మంచిదారికి తెచ్చుటయే క్రీస్తు నియమము."
    ],
    [
      "1 John 1:8-9 on if we confess our sins, He is faithful and just to forgive us our sins and cleanse us from all unrighteousness",
      "1 యోహాను 1:8-9 మన పాపములను మనము ఒప్పుకొనినయెడల, ఆయన నమ్మదగినవాడును నీతిమంతుడును గనుక మన పాపములను క్షమించి సమస్త దుర్నీతినుండి మనలను పవిత్రపరచును",
      "1 John 1:9",
      "If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness",
      "మన పాపములను మనము ఒప్పుకొనినయెడల, ఆయన నమ్మదగినవాడును నీతిమంతుడును గనుక ఆయన మన పాపములను క్షమించి సమస్త దుర్నీతినుండి మనలను పవిత్రపరచును",
      "Pardon is anchored in God's fidelity and justice satisfied at the cross, permanently removing moral contamination.",
      "పాపమును కపటములేకుండ ఒప్పుకొనుటవలన క్రీస్తు రక్తము సమస్త అపవిత్రతనుండి మనలను సంపూర్ణముగా కడిగివేయును."
    ],
    [
      "1 John 2:1-2 on if anyone sins, we have an Advocate with the Father, Jesus Christ the righteous, the propitiation for our sins",
      "1 యోహాను 2:1-2 ఎవడైనను పాపము చేసినయెడల నీతిమంతుడైన యేసుక్రీస్తు అను ఉత్తరవాది తండ్రియొద్ద మనకున్నాడు; ఆయనే మన పాపములకు ప్రాయశ్చిత్తమై యున్నాడు",
      "1 John 2:1-2",
      "My little children, these things I write to you, so that you may not sin. And if anyone sins, we have an Advocate with the Father, Jesus Christ the righteous. And He Himself is the propitiation for our sins",
      "నా చిన్నపిల్లలారా, మీరు పాపము చేయకుండుటకై ఈ సంగతులను మీకు వ్రాయుచున్నాను; ఎవడైనను పాపము చేసినయెడల నీతిమంతుడైన యేసుక్రీస్తు అను ఉత్తరవాది తండ్రియొద్ద మనకున్నాడు; ఆయనే మన పాపములకు శాంతికరమై యున్నాడు",
      "When believers fail, Christ our Paraclete pleads His own blood and righteousness at the Father's right hand.",
      "విశ్వాసి పొరపాటున పాపములో పడినను పరలోకమందు మన పక్షమున వాదించే నీతిమంతుడైన యేసుక్రీస్తే మన నిత్య విమోచకుడు."
    ],
    [
      "Romans 8:1 proclaiming: 'There is therefore now no condemnation to those who are in Christ Jesus'",
      "రోమీయులకు 8:1 'కాబట్టి ఇప్పుడు క్రీస్తుయేసునందున్నవారికి ఏ శిక్షావిధియు లేదు'",
      "Romans 8:1",
      "There is therefore now no condemnation to those who are in Christ Jesus, who do not walk according to the flesh, but according to the Spirit",
      "కాబట్టి ఇప్పుడు క్రీస్తుయేసునందున్నవారికి ఏ శిక్షావిధియు లేదు",
      "The legal verdict of justification nullifies Satan's condemnation; our standing in Christ remains unbreakable.",
      "క్రీస్తునందున్న విశ్వాసికి ఎటువంటి నరక శిక్షావిధి లేదు; ఆయన సిలువ త్యాగము మనలను శాశ్వతముగా నిర్దోషులుగా చేసెను."
    ],
    [
      "Romans 8:28 declaring that all things work together for good to those who love God, even redeeming past failures",
      "రోమీయులకు 8:28 దేవుని ప్రేమించువారికి, అనగా ఆయన సంకల్పముచొప్పున పిలువబడినవారికి సమస్తమును మేలుకొరకే సమకూడి జరుగుచున్నవి",
      "Romans 8:28",
      "And we know that all things work together for good to those who love God, to those who are the called according to His purpose",
      "దేవుని ప్రేమించువారికి, అనగా ఆయన సంకల్పముచొప్పున పిలువబడినవారికి సమస్తమును మేలుకొరకై సమకూడి జరుగుచున్నవని యెరుగుదుము",
      "God's providence weaves even our past errors and repented failures into His grand redemptive tapestry for our sanctification.",
      "విశ్వాసి జీవితములో జరిగిన చేదు అనుభవములను సైతం దేవుడు తన సంకల్పముద్వారా పరమ మేలుగా మార్చగల సమర్థుడు."
    ],
    [
      "Romans 8:33-34 asking: 'Who shall bring a charge against God's elect? It is God who justifies. Who is he who condemns? It is Christ who died'",
      "రోమీయులకు 8:33-34 'దేవునిచేత ఏర్పరచబడినవారిమీద నేరము మోపువాడెవడు? నీతిమంతులుగా తీర్చువాడు దేవుడే; శిక్ష విధించువాడెవడు? చనిపోయిన క్రీస్తే'",
      "Romans 8:33-34",
      "Who shall bring a charge against God's elect? It is God who justifies. Who is he who condemns? It is Christ who died, and furthermore is also risen, who is even at the right hand of God, who also makes intercession for us",
      "దేవునిచేత ఏర్పరచబడినవారిమీద నేరము మోపువాడెవడు? నీతిమంతులుగా తీర్చువాడు దేవుడే; శిక్ష విధించువాడెవడు? చనిపోయినవాడును, అంతేకాదు లేచినవాడును, దేవుని కుడిపార్శ్వమున ఉన్నవాడును, మనకొరకు విజ్ఞాపనము చేయువాడును క్రీస్తుయేసే",
      "Every forensic charge of the adversary is dismissed by God the Judge because Christ died, rose, and intercedes.",
      "సాతాను మన వైఫల్యములను ఎత్తిచూపి నేరము మోపజూచినను, దేవుడే మనలను నీతిమంతులుగా తీర్చియున్నాడు గనుక ఎవడును శిక్ష విధింపలేడు."
    ],
    [
      "Romans 8:38-39 declaring that neither death nor life nor any creature shall be able to separate us from the love of God in Christ",
      "రోమీయులకు 8:38-39 మరణమైనను జీవమైనను మరే సృష్టియైనను మన ప్రభువైన క్రీస్తుయేసునందలి దేవుని ప్రేమనుండి మనలను ఎడబాపనేరదు",
      "Romans 8:38-39",
      "For I am persuaded that neither death nor life, nor angels nor principalities nor powers... shall be able to separate us from the love of God which is in Christ Jesus our Lord",
      "మరణమైనను జీవమైనను దేవదూతలైనను ప్రధానులైనను... మరే సృష్టియైనను మన ప్రభువైన క్రీస్తుయేసునందలి దేవుని ప్రేమనుండి మనలను ఎడబాపనేరవని రూఢిగా నమ్ముచున్నాను",
      "The unbreakable golden chain of eternal security: our failures cannot sever the sovereign grip of God's love.",
      "ఎటువంటి శోధనలైనా శ్రమలైనా మన బలహీనతలైనా మన ప్రభువైన క్రీస్తుయొక్క నిత్య ప్రేమనుండి మనలను వేరుచేయలేవు."
    ],
    [
      "2 Corinthians 12:9-10 on Christ's reply to Paul's thorn: 'My grace is sufficient for you, for My strength is made perfect in weakness'",
      "2 కొరింథీయులకు 12:9-10 'నా కృప నీకు చాలును, బలహీనతయందు నా బలము సంపూర్ణమగుచున్నది' అని ప్రభువు పలికిన పరమ ధైర్యము",
      "2 Corinthians 12:9",
      "And He said to me, 'My grace is sufficient for you, for My strength is made perfect in weakness.' Therefore most gladly I will rather boast in my infirmities, that the power of Christ may rest upon me",
      "అందుకు నా కృప నీకు చాలును, బలహీనతయందు నా బలము సంపూర్ణమగుచున్నదని ఆయన నాతో చెప్పెను. కాబట్టి క్రీస్తు ప్రభావము నామీద నిలిచియుండు నిమిత్తము, విశేషముగా నా బలహీనతలయందే బహు సంతోషముగా అతిశయపడుదును",
      "Human insufficiency is the chosen platform for Christ's omnipotent power to manifest.",
      "మన బలహీనతలే దేవుని శక్తి సంపూర్ణముగా ప్రకాశించుటకు వేదికలగును; ఆయన కృప మనకు సమస్త పరిస్థితులలో చాలును."
    ],
    [
      "2 Corinthians 7:10 on godly sorrow producing repentance leading to salvation, not to be regretted, but the sorrow of the world producing death",
      "2 కొరింథీయులకు 7:10 దైవచిత్తానుసారమైన దుఃఖము రక్షణార్థమైన మారుమనస్సును కలుగజేయును; లోకసంబంధమైన దుఃఖమో మరణమును తెచ్చును",
      "2 Corinthians 7:10",
      "For godly sorrow produces repentance leading to salvation, not to be regretted; but the sorrow of the world produces death",
      "దైవచిత్తానుసారమైన దుఃఖము రక్షణార్థమైన పశ్చాత్తాపమును పుట్టించును, ఈ పశ్చాత్తాపము దుఃఖమును పుట్టింపదు; అయితే లోకసంబంధమైన దుఃఖము మరణమును కలుగజేయును",
      "Two reactions to failure: Peter's godly sorrow birthed life and restoration, while Judas' worldly sorrow birthed suicidal despair.",
      "దేవుని దృష్టిలో కన్నీరు కార్చి సరిదిద్దుకొనుట రక్షణనిచ్చును; లోకపు స్వార్థపూరిత నిరాశా దుఃఖము ఆత్మహత్యకు మరణమునకు దారితీయును."
    ],
    [
      "Hebrews 4:15-16 on having a High Priest who sympathizes with our weaknesses, inviting us to come boldly to the throne of grace to find mercy",
      "హెబ్రీయులకు 4:15-16 మన బలహీనతలయందు మనతో సహనము చూపగల ప్రధానయాజకుడు మనకున్నాడు గనుక సమయోచిత సహాయముకొరకు కృపాసనమునొద్దకు ధైర్యముగా వచ్చుట",
      "Hebrews 4:16",
      "Let us therefore come boldly to the throne of grace, that we may obtain mercy and find grace to help in time of need",
      "గనుక మనము కనికరింపబడి సమయోచితమైన సహాయముకొరకు కృప పొందునట్లు ధైర్యముతో కృపాసనమునొద్దకు చేరుదము",
      "Because Jesus was tempted in all points like us yet without sin, failing mortals can approach His throne with bold confidence.",
      "మన శోధనలన్నిటిని అనుభవించిన యేసు మన బలహీనతలను ఎరిగియున్నాడు గనుక ఏ భయములేక కృపాసనమునొద్దకు వచ్చి సహాయము పొందవచ్చును."
    ],
    [
      "Hebrews 12:5-6 exhorting: 'Do not despise the chastening of the Lord, nor be discouraged when you are rebuked by Him; for whom the Lord loves He chastens'",
      "హెబ్రీయులకు 12:5-6 'ప్రభువు యొక్క శిక్షను తృణీకరింపవద్దు, ఆయన గద్దించినప్పుడు విసుకవద్దు; ప్రభువు తాను ప్రేమించువానిని శిక్షించును'",
      "Hebrews 12:6",
      "For whom the Lord loves He chastens, and scourges every son whom He receives",
      "ప్రభువు తాను ప్రేమించువానిని శిక్షించి, తాను స్వీకరించు ప్రతి కుమారుని దండించును",
      "Divine discipline following failure is the undeniable certificate of legitimate sonship, not of rejection.",
      "పడిపోయినప్పుడు దేవుడు మనలను గద్దించి శిక్షించుట మనము ఆయన నిజమైన కుమారులమని నిరూపించు ప్రేమ చిహ్నము."
    ],
    [
      "Hebrews 12:12-13 commanding: 'Strengthen the hands which hang down, and the feeble knees, and make straight paths for your feet, so that what is lame may not be dislocated, but rather be healed'",
      "హెబ్రీయులకు 12:12-13 'వ్రేలాడు చేతులను సడలిన మోకాళ్లను బలపరచుడి; కుంటిది తొలగిపోక బాగుపడునట్లు మీ పాదములకు చక్కని మార్గములను సిద్ధపరచుకొనుడి'",
      "Hebrews 12:12-13",
      "Therefore strengthen the hands which hang down, and the feeble knees, and make straight paths for your feet, so that what is lame may not be dislocated, but rather be healed",
      "కాబట్టి వ్రేలాడు చేతులను సడలిన మోకాళ్లను బలపరచుడి. కుంటిది తొలగిపోక బాగుపడునట్లు మీ పాదములకు చక్కని మార్గములను సిద్ధపరచుకొనుడి",
      "Pastoral triage: failure dislocates spiritual limbs; the community must gently reset and heal limping saints.",
      "వైఫల్యముచేత కుంటుతున్న విశ్వాసులను తోసివేయక, వారి బలహీన మోకాళ్లను బలపరచి స్వస్థతలోనికి నడిపించు సంఘ బాధ్యత."
    ],
    [
      "James 3:2 declaring: 'For we all stumble in many things. If anyone does not stumble in word, he is a perfect man'",
      "యాకోబు 3:2 'మనమందరమును అనేక విషయములలో తప్పిపోవుచున్నాము; ఎవడైనను మాటయందు తప్పనియెడల అతడే పరిపూర్ణుడు'",
      "James 3:2",
      "For we all stumble in many things. If anyone does not stumble in word, he is a perfect man, able also to bridle the whole body",
      "మనమందరమును అనేక విషయములలో తప్పిపోవుచున్నాము; ఎవడైనను మాటయందు తప్పనియెడల అట్టివాడు లోపములేనివాడై, తన సర్వశరీరమును స్వాధీనమందుంచుకొన శక్తుడగును",
      "Apostolic candor regarding universal fallibility destroys self-righteous posturing and promotes mutual mercy.",
      "సంపూర్ణులైనవారెవరును లేరనియు, మనమందరము అనేక విషయములలో తప్పిపోవువారమనియు గ్రహించుట మనలను కనికరముగలవారిగా చేయును."
    ],
    [
      "James 5:19-20 on he who turns a sinner from the error of his way saving a soul from death and covering a multitude of sins",
      "యాకోబు 5:19-20 సత్యమునుండి తొలగిపోయినవానిని ఎవడైనను మరలించినయెడల, అతడు ఒక ఆత్మను మరణమునుండి రక్షించి అనేక పాపములను కప్పివేయును",
      "James 5:19-20",
      "Brethren, if anyone among you wanders from the truth, and someone turns him back, let him know that he who turns a sinner from the error of his way will save a soul from death and cover a multitude of sins",
      "నా సహోదరులారా, మీలో ఎవడైనను సత్యమునుండి తొలగిపోగా మరియొకడు అతనిని సత్యమునకు మరలించినయెడల, పాపిని అతని తప్పుమార్గమునుండి మరలించువాడు మరణమునుండి ఒక ఆత్మను రక్షించి అనేక పాపములను కప్పివేయునని తెలియవలెను",
      "Rescuing backsliders from destructive failure is one of the highest expressions of Christian pastoral love.",
      "దారి తప్పిన సహోదరుని కనికరముతో వెదకి రక్షించుట పరలోకమందు గొప్ప ఆనందమును మరియు అనేక పాపముల క్షమాపణను తెచ్చును."
    ],
    [
      "Luke 22:31-32 Jesus praying for Peter: 'Simon, Simon! Indeed, Satan has asked for you... but I have prayed for you, that your faith should not fail; and when you have returned to Me, strengthen your brethren'",
      "లూకా 22:31-32 'సీమోనూ, సాతాను మిమ్మును గోధుమలవలె జల్లించుటకు కోరుకొనెను గాని నీ విశ్వాసము తప్పిపోకుండునట్లు నేను నీకొరకు ప్రార్థించితిని; నీవు మనస్సు తిరిగిన తరువాత నీ సహోదరులను స్థిరపరచుము'",
      "Luke 22:31-32",
      "And the Lord said, 'Simon, Simon! Indeed, Satan has asked for you, that he may sift you as wheat. But I have prayed for you, that your faith should not fail; and when you have returned to Me, strengthen your brethren'",
      "సీమోనూ, సీమోనూ, ఇదిగో సాతాను మిమ్మును గోధుమలవలె జల్లించుటకు మిమ్మును కోరుకొనెను గాని నీ విశ్వాసము తప్పిపోకుండునట్లు నేను నీకొరకు వేడుకొంటిని; నీవు మనస్సు తిరిగిన తరువాత నీ సహోదరులను స్థిరపరచుము అని ప్రభువు చెప్పెను",
      "Christ's pre-emptive intercession ensured that Peter's collapse was a bend, not a break; his restored life strengthened the entire church.",
      "పేతురు పడిపోకముందే యేసు అతనికొరకు విజ్ఞాపన చేసెను; వైఫల్యమునుండి తిరిగి వచ్చిన పేతురు తోటి సహోదరులకు బలమైన స్తంభమాయెను."
    ],
    [
      "Revelation 2:4-5 to the church in Ephesus: 'You have left your first love. Remember therefore from where you have fallen; repent and do the first works'",
      "ప్రకటన 2:4-5 ఎఫెసు సంఘమునకు హెచ్చరిక: 'మొదటి ప్రేమను నీవు విడిచితివి; నీవు ఏ స్థితిలోనుండి పడితివో జ్ఞాపకము చేసికొని మారుమనస్సు పొంది ఆ మొదటి క్రియలను చేయుము'",
      "Revelation 2:5",
      "Remember therefore from where you have fallen; repent and do the first works, or else I will come to you quickly and remove your lampstand from its place-unless you repent",
      "కాబట్టి నీవు ఏ స్థితిలోనుండి పడితివో అది జ్ఞాపకము చేసికొని మారుమనస్సు పడి ఆ మొదటి క్రియలను చేయుము; లేనియెడల నేను నీయొద్దకు వచ్చి, నీవు మారుమనస్సు పొందితేనే గాని, నీ దీపస్తంభమును దాని చోటనుండి తీసివేతును",
      "The threefold remedy for institutional or spiritual decline: remember previous intimacy, repent deeply, and repeat initial passionate obedience.",
      "తొలిప్రేమను కోల్పోయిన సంఘమునకు యేసు ఇచ్చిన మార్గము: పూర్వ వైభవమును జ్ఞాపకము చేసికొనుట, పశ్చాత్తాపపడుట, మొదటి క్రియలను చేయుట."
    ],
    [
      "Revelation 3:1-3 to the church in Sardis: 'You have a name that you are alive, but you are dead. Be watchful, and strengthen the things which remain, that are ready to die'",
      "ప్రకటన 3:1-3 సార్దీసు సంఘమునకు హెచ్చరిక: 'జీవించుచున్నావను పేరుమాత్రమున్నది గాని నీవు చచ్చినవాడవే; చావనైయున్న మిగిలినవాటిని బలపరచుము'",
      "Revelation 3:2",
      "Be watchful, and strengthen the things which remain, that are ready to die, for I have not found your works perfect before God",
      "నీ క్రియలు నా దేవునియెదుట సంపూర్ణమైనవిగా నాకు కనబడలేదు గనుక జాగరూకుడవై, చావనైయున్న మిగిలినవాటిని బలపరచుము",
      "Even in a spiritually dead, failing church, Christ commands believers to fan the remaining embers of devotion into flame.",
      "పైకి భక్తిపరులమని చెప్పుకొనుచూ ఆత్మీయంగా చనిపోయిన స్థితినుండి మేల్కొని మిగిలిన విశ్వాసపు నిప్పులను వెలిగించవలెను."
    ],
    [
      "Revelation 3:17-19 to the lukewarm Laodicean church: 'As many as I love, I rebuke and chasten. Therefore be zealous and repent'",
      "ప్రకటన 3:17-19 వెచ్చగనైనను చల్లగనైనను లేని లవొదికయ సంఘమునకు హెచ్చరిక: 'నేను ప్రేమించువారినందరిని గద్దించి శిక్షించుచున్నాను గనుక ఆసక్తి కలిగి మారుమనస్సు పొందుము'",
      "Revelation 3:19-20",
      "As many as I love, I rebuke and chasten. Therefore be zealous and repent. Behold, I stand at the door and knock. If anyone hears My voice and opens the door, I will come in to him and dine with him",
      "నేను ప్రేమించువారినందరిని గద్దించి శిక్షించుచున్నాను గనుక ఆసక్తి కలిగి మారుమనస్సు పొందుము. ఇదిగో నేను తలుపునొద్ద నిలిచి తట్టుచున్నాను; ఎవడైనను నా స్వరము విని తలుపు తీసినయెడల నేను అతనియొద్దకు వచ్చి అతనితోను అతడు నాతోను భోజనము చేయుదుము",
      "The most wretched, self-deceived church receives Christ's tenderest knock; rebuke is motivated solely by relentless love.",
      "స్వయం తృప్తితో గుడ్డితనములో పడిపోయిన లవొదికయ సంఘపు తలుపునొద్ద నిలిచి ప్రేమతో తట్టుచున్న రక్షకుని స్వరం."
    ],
    [
      "Jude 1:24-25 doxology praising: 'Now to Him who is able to keep you from stumbling, and to present you faultless before the presence of His glory with exceeding joy'",
      "యూదా 1:24-25 'తడబడకుండ (జారకుండ) మిమ్మును కాపాడుటకును, తన మహిమయెదుట ఆనందముతో నిర్దోషులనుగా నిలువబెట్టుటకును శక్తిగల మన దేవుడు'",
      "Jude 1:24-25",
      "Now to Him who is able to keep you from stumbling, and to present you faultless before the presence of His glory with exceeding joy, to God our Savior, who alone is wise, be glory and majesty",
      "తడబడకుండ మిమ్మును కాపాడుటకును, తన మహిమయెదుట నిర్దోషులుగాను ఆనందముతోను మిమ్మును నిలువబెట్టుటకును శక్తిగల మన రక్షకుడైన అద్వితీయ దేవునికి... ప్రభావమును యుగయుగములు కలుగును గాక",
      "The ultimate guarantee against terminal failure: Christ's sovereign power keeps us from falling and presents us flawless in glory.",
      "మన అడుగులు జారిపోకుండా కాపాడి తన నిత్య మహిమలో ఆనందముతో నిర్దోషులుగా నిలబెట్టే సర్వశక్తిగల దేవుని స్తుతి."
    ],
    [
      "Philippians 3:13-14 on forgetting those things which are behind and reaching forward to those things which are ahead, pressing toward the goal",
      "ఫిలిప్పీయులకు 3:13-14 'వెనుక ఉన్నవాటిని మరచి, ముందున్నవాటికొరకై వేగిరపడుచు క్రీస్తుయేసునందు దేవుని ఉన్నతమైన పిలుపునకు కలుగు బహుమానమును పొందవలెనని గురియొద్దకే పరుగెత్తుచున్నాను'",
      "Philippians 3:13-14",
      "Brethren, I do not count myself to have apprehended; but one thing I do, forgetting those things which are behind and reaching forward to those things which are ahead, I press toward the goal for the prize",
      "సహోదరులారా, నేనిదివరకే పట్టుకొనియున్నానని యెంచుకొనను; అయితే ఒకటి చేయుచున్నాను; వెనుక ఉన్నవాటిని మరచి, ముందున్నవాటికొరకై వేగిరపడుచు క్రీస్తుయేసునందు దేవుని ఉన్నతమైన పిలుపునకు కలుగు బహుమానమును పొందవలెనని గురియొద్దకే పరుగెత్తుచున్నాను",
      "Spiritual progress demands amnesia regarding past failures and past pedigree, focusing entirely on Christ's celestial prize.",
      "గతకాలపు వైఫల్యములను తలంచుకుంటూ కృంగిపోక వాటన్నిటిని మరచి క్రీస్తు పిలుపునకు తగినట్లు పరలోక గురియొద్దకే పరుగెత్తుట."
    ],
    [
      "Romans 5:20 declaring: 'Where sin abounded, grace abounded much more'",
      "రోమీయులకు 5:20 'పాపము ఎక్కడ విస్తరించెనో అక్కడ కృప అపరిమితముగా విస్తరించెను'",
      "Romans 5:20",
      "Moreover the law entered that the offense might abound. But where sin abounded, grace abounded much more",
      "అతిక్రమము విస్తరించునట్లు ధర్మశాస్త్రము ప్రవేశించెను; అయినను పాపము ఎక్కడ విస్తరించెనో అక్కడ కృప అపరిమితముగా విస్తరించెను",
      "Super-abounding grace (huper-eperisseusen): human failure can never exhaust the infinite ocean of God's redemptive mercy.",
      "మానవ పాపము మరియు వైఫల్యము ఎంతగా విస్తరించినను, దానిని ముంచివేయు దేవుని కృప అంతకంతకు అత్యధికముగా ప్రవహించును."
    ],
    [
      "Romans 7:24-25 Paul's cry of agonizing failure in flesh: 'O wretched man that I am! Who will deliver me from this body of death? I thank God-through Jesus Christ our Lord!'",
      "రోమీయులకు 7:24-25 శరీరాశల పోరాటములో పౌలు ఆర్తనాదము: 'అయ్యో, నేనెంత దౌర్భాగ్యుడను! ఇట్టి మరణమునకు లోనగు శరీరమునుండి నన్నెవడు విడిపించును? మన ప్రభువైన యేసుక్రీస్తుద్వారా దేవునికి స్తోత్రము'",
      "Romans 7:24-25",
      "O wretched man that I am! Who will deliver me from this body of death? I thank God-through Jesus Christ our Lord! So then, with the mind I myself serve the law of God, but with the flesh the law of sin",
      "అయ్యో, నేనెంత దౌర్భాగ్యుడను! ఇట్టి మరణమునకు లోనగు శరీరమునుండి నన్నెవడు విడిపించును? మన ప్రభువైన యేసుక్రీస్తుద్వారా దేవునికి స్తోత్రము కలుగును గాక",
      "The honest despair of trying to overcome sin through willpower yields immediately to triumphant doxology through Jesus Christ.",
      "స్వంత బలముతో పాపమును జయించలేక అలసిన ఆత్మకు యేసుక్రీస్తు ద్వారా మాత్రమే సంపూర్ణ విడుదల మరియు జయము లభించును."
    ],
    [
      "Romans 6:1-2 refuting antinomian abuse of grace: 'Shall we continue in sin that grace may abound? Certainly not! How shall we who died to sin live any longer in it?'",
      "రోమీయులకు 6:1-2 'కృప విస్తరింపవలెనని పాపమందు నిలిచియుందుమా? అట్లనరాదు; పాపమువిషయమై చనిపోయిన మనము ఇకమీదట దానిలో ఏలాగు జీవించుదుము?'",
      "Romans 6:1-2",
      "What shall we say then? Shall we continue in sin that grace may abound? Certainly not! How shall we who died to sin live any longer in it?",
      "హా! ఏమందుము? కృప విస్తరింపవలెనని పాపమందు నిలిచియుందుమా? అట్లనరాదు; పాపమువిషయమై చనిపోయిన మనము ఇకమీదట ఏలాగు దానిలో జీవించుదుము?",
      "Grace pardons failure but never licenses sin; union with Christ in death and resurrection inaugurates a transformed life.",
      "దేవుని కృప పాపములను క్షమించును గనుక ఇష్టానుసారముగా పాపములో జీవించకూడదు; క్రీస్తుతోకూడ పాపమునకు చనిపోయినవారముగా జీవించవలెను."
    ],
    [
      "2 Corinthians 5:17 proclaiming: 'If anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new'",
      "2 కొరింథీయులకు 5:17 'ఎవడైనను క్రీస్తునందున్నయెడల వాడు నూతన సృష్టి; పాతవి గతించెను, ఇదిగో క్రొత్తవాయెను'",
      "2 Corinthians 5:17",
      "Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new",
      "కాగా ఎవడైనను క్రీస్తునందున్నయెడల వాడు నూతన సృష్టి; పాతవి గతించెను, ఇదిగో సమస్తమును నూతనమాయెను",
      "Regeneration erases our past identification with failure and reconstitutes our identity entirely in the risen Christ.",
      "క్రీస్తునందున్న ప్రతి విశ్వాసి పూర్వ పాపపు వైఫల్యములను దాటి దేవునిచేత సరికొత్త సృష్టిగా రూపాంతరం చెందును."
    ],
    [
      "Galatians 2:20 Paul declaring: 'I have been crucified with Christ; it is no longer I who live, but Christ lives in me'",
      "గలతీయులకు 2:20 'నేను క్రీస్తుతోకూడ సిలువ వేయబడియున్నాను; ఇకను జీవించువాడను నేను కాను, క్రీస్తే నాయందు జీవించుచున్నాడు'",
      "Galatians 2:20",
      "I have been crucified with Christ; it is no longer I who live, but Christ lives in me; and the life which I now live in the flesh I live by faith in the Son of God, who loved me and gave Himself for me",
      "నేను క్రీస్తుతోకూడ సిలువ వేయబడియున్నాను; ఇకను జీవించువాడను నేను కాను, క్రీస్తే నాయందు జీవించుచున్నాడు; నేనిప్పుడు శరీరమందు జీవించుచున్న జీవితము నన్ను ప్రేమించి నాకొరకు తన్నుతాను అప్పగించుకొనిన దేవుని కుమారునియందలి విశ్వాసమువలన జీవించుచున్నాను",
      "The old self prone to stumbling is dead; the resurrected Christ Himself animates victorious daily living.",
      "పడిపోయే స్వభావముగల పాత మనుష్యుడు క్రీస్తుతోకూడ సిలువవేయబడగా, క్రీస్తే మనలో నివసించి జయజీవితమును అనుగ్రహించును."
    ],
    [
      "Ephesians 2:4-5 declaring: 'God, who is rich in mercy, because of His great love with which He loved us, even when we were dead in trespasses, made us alive together with Christ'",
      "ఎఫెసీయులకు 2:4-5 'దేవుడు కరుణాసంపన్నుడై యుండి, మనము మన అపరాధములవలన చచ్చినవారమై యుండినప్పుడు సహితము తన మహాప్రేమచేత మనలను క్రీస్తుతోకూడ బ్రదికించెను'",
      "Ephesians 2:4-5",
      "But God, who is rich in mercy, because of His great love with which He loved us, even when we were dead in trespasses, made us alive together with Christ (by grace you have been saved)",
      "అయినను దేవుడు కరుణాసంపన్నుడై యుండి, మనము మన అపరాధములవలన చచ్చినవారమై యుండినప్పుడు సహితము మనలను ప్రేమించిన తన మహాప్రేమచేత మనలను క్రీస్తుతోకూడ బ్రదికించెను; కృపచేత మీరు రక్షింపబడియున్నారు",
      "Resurrection from moral death: God intervened when we were utterly incapable of lifting ourselves.",
      "పాపపు అపరాధములలో ఆత్మీయంగా చనిపోయి నిస్సహాయులమైన మనలను దేవుడు తన అపార ప్రేమచేత క్రీస్తుతోకూడ సజీవులనుగా చేసెను."
    ],
    [
      "Colossians 2:13-14 on He forgave us all trespasses, having wiped out the handwriting of requirements that was against us, nailing it to the cross",
      "కొలొస్సయులకు 2:13-14 మన అపరాధములన్నిటిని క్షమించి, మనకు విరోధముగా ఉండిన ఆజ్ఞల సంబంధమైన చేవ్రాతను సిలువకు మేకులు కొట్టి రద్దుపరచెను",
      "Colossians 2:13-14",
      "And you, being dead in your trespasses and the uncircumcision of your flesh, He has made alive together with Him, having forgiven you all trespasses, having wiped out the handwriting of requirements that was against us... having nailed it to the cross",
      "మరియు అపరాధములవలనను శరీరమందు సున్నతి పొందకపోవుటవలనను మీరు మృతులై యుండగా, దేవుడు మన అపరాధములన్నిటిని క్షమించి, మనమీద మోపబడిన ఆజ్ఞల సంబంధమైన చేవ్రాతను తుడిచివేసి, దానిని సిలువకు మేకులు కొట్టి రద్దుపరచెను",
      "The legal ledger of all our failures was permanently cancelled, paid in full, and pinned to the cross of Calvary.",
      "మన పాపపు అప్పుల పత్రమును దేవుడు సిలువపై మేకులతో కొట్టి ఎన్నటికి తీర్చలేనంతగా సంపూర్ణముగా రద్దుపరచెను."
    ],
    [
      "1 Timothy 1:15-16 Paul testifying: 'Christ Jesus came into the world to save sinners, of whom I am chief. However, for this reason I obtained mercy, that in me first Jesus Christ might show all longsuffering'",
      "1 తిమోతి 1:15-16 'పాపులను రక్షించుటకు క్రీస్తుయేసు లోకమునకు వచ్చెను; వారిలో నేను ప్రధాన పాపిని; అయినను యేసుక్రీస్తు తన పూర్ణమైన దీర్ఘశాంతమును మొదట నాయందు కనుపరచునట్లు కనికరింపబడితిని'",
      "1 Timothy 1:15-16",
      "This is a faithful saying and worthy of all acceptance, that Christ Jesus came into the world to save sinners, of whom I am chief. However, for this reason I obtained mercy, that in me first Jesus Christ might show all longsuffering, as a pattern to those who are going to believe",
      "పాపులను రక్షించుటకు క్రీస్తుయేసు లోకమునకు వచ్చెనను మాట నమ్మదగినదియు పూర్ణాంగీకారమునకు యోగ్యమైనదియునై యున్నది; అట్టివారిలో నేను ప్రధానుడను. అయినను రాబోవు కాలమందు తనను విశ్వసింపబోవువారికి నేను మాదిరిగా ఉండునట్లు యేసుక్రీస్తు నాయందే తన పూర్ణమైన దీర్ఘశాంతమును కనుపరచుటకు కనికరింపబడితిని",
      "The chief of sinners became the premier exhibit of God's patient grace, proving that no failing human is beyond redemption.",
      "సంఘమును హింసించిన ప్రధాన పాపినైన నన్నే క్షమించిన క్రీస్తు, ఎటువంటి ఘోర పాపినైనా రక్షించగలడని పౌలు తన సాక్ష్యమును చాటెను."
    ]
  ];

  return data.map(item => ({
    easyQ: `What NT doctrine of grace or triumph over failure is revealed regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి క్రొత్త నిబంధనలో ఇవ్వబడిన కృపా సిద్ధాంతము లేదా ఆత్మీయ జయమేమి?`,
    medQ: `According to ${item[2]}, how does Christ's finished work atone for, lift, and restore failing believers?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం పడిపోయిన విశ్వాసులను క్రీస్తు సిలువ కార్యం ఎలా రక్షించి పునరుద్ధరించుచున్నది?`,
    hardQ: `What theological truth does ${item[2]} establish regarding our eternal justification and perseverance against Satan's accusations?`,
    hardQTe: `${item[2]} ప్రకారం సాతాను నిందలను తోసిపుచ్చి విశ్వాసికి నిత్య నీతిని భద్రతను ఇచ్చు దేవుని పరమ సంకల్పమేమి?`,
    options: [item[3], "He instituted thirty days of ceremonial washings in Antioch", "He gathered sixty legions of soldiers to defend the temple", "He commanded forty sacrifices offered at the altar in Corinth"],
    optionsTelugu: [item[4], "అంతియొకయలో ముప్పది దినముల ఆచార శుద్ధీకరణలను నియమించెను", "దేవాలయ రక్షణకొరకు అరవై సైన్యపు దళములను సమకూర్చెను", "కొరింథులోని బలిపీఠముపై నలభై బలులను అర్పింపవలెనని ఆజ్ఞాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// Notice buildFailureMastery has 30 items so far. We need 20 more to make exactly 50!
// Let's add the remaining 20 Mastery items (31 to 50):
function getAdditionalMastery20() {
  const extra = [
    [
      "2 Peter 1:9-10 on he who lacks these virtues being shortsighted even to blindness, having forgotten that he was cleansed from his old sins; be diligent to make your call and election sure",
      "2 పేతురు 1:9-10 ఈ సద్గుణములు లేనివాడు తన పూర్వ పాపములనుండి శుద్ధి పొందిన సంగతిని మరచి గుడ్డివాడగును; మీ పిలుపును ఏర్పరచుకొనుటను నిశ్చయము చేసికొనుటకు మరి జాగ్రత్తపడుడి",
      "2 Peter 1:9-10",
      "For he who lacks these things is shortsighted, even to blindness, and has forgotten that he was cleansed from his old sins. Therefore, brethren, be even more diligent to make your call and election sure, for if you do these things you will never stumble",
      "ఇవి ఎవనికి లేకపోవునో వాడు గ్రుడ్డివాడును, దూరదృష్టిలేనివాడునై, తన పూర్వపాపములనుండి శుద్ధి పొందిన సంగతిని మరచిపోవును. కావున సహోదరులారా, మీ పిలుపును మీ యేర్పరచుకొనుటను నిశ్చయము చేసికొనుటకు మరి జాగ్రత్తపడుడి; మీరు వీటిని చేయుచున్నయెడల ఎన్నడును తొట్రిల్లరు",
      "Active pursuit of spiritual growth insulates the believer from blindness and catastrophic stumbling.",
      "పూర్వ పాపముల క్షమాపణను మరచిపోక విశ్వాసములో సద్గుణములను పెంచుకొనుచు ఎన్నడును తొట్రిల్లకుండ స్థిరముగా నడుచుకొనుట."
    ],
    [
      "2 Peter 2:9 declaring: 'The Lord knows how to deliver the godly out of temptations and to reserve the unjust under punishment for the day of judgment'",
      "2 పేతురు 2:9 'భక్తిపరులను శోధనలోనుండి తప్పించుటకును, శిక్షలో ఉన్న అనీతిమంతులను తీర్పుదినమువరకు కాపాడుటకును ప్రభువు సమర్థుడు'",
      "2 Peter 2:9",
      "Then the Lord knows how to deliver the godly out of temptations and to reserve the unjust under punishment for the day of judgment",
      "భక్తిపరులను శోధనలోనుండి తప్పించుటకును, శిక్షలో ఉన్న అనీతిమంతులను తీర్పుదినమువరకు కాపాడుటకును ప్రభువు సమర్థుడై యున్నాడు",
      "God's omniscient power reliably extracts His vulnerable saints from overwhelming trials.",
      "శోధనలలో పడిపోకుండ తన భక్తులను అద్భుతముగా విడిపించుటకు సర్వశక్తిగల దేవుడు సమర్థుడై యున్నాడు."
    ],
    [
      "2 Peter 3:17-18 warning: 'Beware lest you also fall from your own steadfastness, being led away with the error of the wicked; but grow in the grace and knowledge of our Lord'",
      "2 పేతురు 3:17-18 'దుర్మార్గుల తప్పుమార్గమున నడిపింపబడి మీ స్థిరత్వమునుండి పడిపోకుండ జాగ్రత్తపడుడి; మన ప్రభువు కృపయందును జ్ఞానమందును ఎదుగుడి'",
      "2 Peter 3:17-18",
      "You therefore, beloved, since you know this beforehand, beware lest you also fall from your own steadfastness, being led away with the error of the wicked; but grow in the grace and knowledge of our Lord and Savior Jesus Christ",
      "ప్రియులారా, మీరు ఈ సంగతులు ముందుగా ఎరిగియున్నారు గనుక మీరు దుర్మార్గుల తప్పుమార్గమున నడిపింపబడి, మీ స్థిరత్వమునుండి పడిపోకుండ చూచుకొనుడి. మన ప్రభువును రక్షకుడునైన యేసుక్రీస్తు కృపయందును జ్ఞానమందును ఎదుగుడి",
      "Growth in grace is the only antidote to doctrinal drift and moral collapse.",
      "దుర్బోధల మోసములో పడి స్థిరత్వమును కోల్పోకుండ నిరంతరము క్రీస్తు కృపలో జ్ఞానములో ఎదుగుచుండుటయే భద్రత."
    ],
    [
      "1 Corinthians 15:9-10 Paul testifying: 'For I am the least of the apostles, who am not worthy to be called an apostle, because I persecuted the church of God. But by the grace of God I am what I am'",
      "1 కొరింథీయులకు 15:9-10 'దేవుని సంఘమును హింసించినందున నేను అపొస్తలులలో అందరికంటె అల్పుడను; అయినను దేవుని కృపవలన నేను ఏమైయున్నానో అదియై యున్నాను'",
      "1 Corinthians 15:9-10",
      "For I am the least of the apostles, who am not worthy to be called an apostle, because I persecuted the church of God. But by the grace of God I am what I am, and His grace toward me was not in vain",
      "ఏలయనగా నేను అపొస్తలులందరిలో అల్పుడను, దేవుని సంఘమును హింసించినందున అపొస్తలుడనని పిలువబడుటకు యోగ్యుడను కాను; అయినను నేనేమై యున్నానో అది దేవుని కృపవలననే అయియున్నాను; మరియు నాకు అనుగ్రహింపబడిన ఆయన కృప నిష్ప్రయోజనము కాలేదు",
      "Past shameful failure as a persecutor was completely transformed by grace into unflagging apostolic labor.",
      "గతములో సంఘమును హింసించిన ఘోర వైఫల్యమును దేవుని కృప తుడిచివేసి, పౌలును సమస్త అపొస్తలులకంటె ఎక్కువ ప్రయాసపడు సేవకునిగా నిలబెట్టెను."
    ],
    [
      "2 Corinthians 1:8-10 on being burdened beyond measure so that we despaired even of life, but trusting in God who raises the dead, who delivered us",
      "2 కొరింథీయులకు 1:8-10 బ్రదుకుటపై ఆశ లేకుండ అపరిమితమైన భారము నొందితిమి; అయితే మృతులను లేపు దేవునియందే నమ్మకముంచితివి, ఆయనే మమ్మును తప్పించెను",
      "2 Corinthians 1:9-10",
      "Yes, we had the sentence of death in ourselves, that we should not trust in ourselves but in God who raises the dead, who delivered us from so great a death, and does deliver us; in whom we trust that He will still deliver us",
      "మృతులను లేపు దేవునియందే గాని మనయందే మనము నమ్మకముంచకుండునట్లు, మరణమవుదుమను నిశ్చయము మనలో మనకు కలిగియుండెను. ఆయన అట్టి గొప్ప మరణమునుండి మమ్మును తప్పించెను, ఇకముందును తప్పించును; మరియు తప్పించునని ఆయనయందు నిరీక్షణ యుంచియున్నాము",
      "Human failure and utter despair of life serve the purpose of destroying self-reliance and casting us solely upon the resurrecting God.",
      "మానవ శక్తి అంతరించినప్పుడు మనపై మనము ఆధారపడక మృతులను లేపే దేవునిమీదనే ఆధారపడినప్పుడు ఆయన అద్భుత రక్షణ దొరుకును."
    ],
    [
      "2 Corinthians 4:8-9 on hard-pressed on every side, yet not crushed; perplexed, but not in despair; persecuted, but not forsaken; struck down, but not destroyed",
      "2 కొరింథీయులకు 4:8-9 ఎటుచూచినను ఇబ్బందిపడుచున్నను నలిగిపోము; అపాయములో నున్నను నిరాశపడము; హింసింపబడుచున్నను దిక్కులేనివారము కాము; పడద్రోయబడినను నశించిపోము",
      "2 Corinthians 4:8-9",
      "We are hard-pressed on every side, yet not crushed; we are perplexed, but not in despair; persecuted, but not forsaken; struck down, but not destroyed",
      "ఎటుచూచినను ఇబ్బందిపడుచున్నను నలిగిపోవువారము కాము; అపాయములో నున్నను నిరాశపడువారము కాము; హింసింపబడుచున్నను దిక్కులేనివారము కాము; పడద్రోయబడినను నశించిపోవువారము కాము",
      "The paradox of Christian resilience: struck down repeatedly by trials and weaknesses, but never destroyed.",
      "ఎన్నిసార్లు క్రింద పడద్రోయబడినను దేవుని ప్రభావమువలన నశించిపోక మరల లేచి నిలువబడు క్రైస్తవ ఆత్మీయ అజేయత."
    ],
    [
      "2 Corinthians 13:4 on though He was crucified in weakness, yet He lives by the power of God; for we also are weak in Him, but we shall live with Him by the power of God",
      "2 కొరింథీయులకు 13:4 'ఆయన బలహీనతనుబట్టి సిలువ వేయబడినను దేవుని శక్తినిబట్టి జీవించుచున్నాడు; మనమును ఆయనయందు బలహీనులమైనను దేవుని శక్తివలన ఆయనతోకూడ జీవింతుము'",
      "2 Corinthians 13:4",
      "For though He was crucified in weakness, yet He lives by the power of God. For we also are weak in Him, but we shall live with Him by the power of God toward you",
      "ఏలయనగా ఆయన బలహీనతనుబట్టి సిలువ వేయబడినను, దేవుని శక్తినిబట్టి జీవించుచున్నాడు; మేమును ఆయనయందు బలహీనులమైనను, మీయెడల కనబడిన దేవుని శక్తినిబట్టి ఆయనతోకూడ జీవింతుము",
      "The crucifixion of Christ reveals that apparent defeat and weakness are the divine vehicle for eternal resurrection power.",
      "క్రీస్తు సిలువ బలహీనతగా కనిపించినను దేవుని పునరుత్థాన మహాశక్తిగా మారినట్లు, మన బలహీనతలలో దైవశక్తి సంపూర్ణమగును."
    ],
    [
      "Ephesians 4:31-32 commanding: 'Let all bitterness, wrath, anger, clamor, and evil speaking be put away from you... and be kind to one another, tenderhearted, forgiving one another, even as God in Christ forgave you'",
      "ఎఫెసీయులకు 4:31-32 'సమస్తమైన చేదును కోపమును క్రోధమును అల్లరిని దూషణను విసర్జించుడి; క్రీస్తునందు దేవుడు మిమ్మును క్షమించిన ప్రకారము ఒకరినొకరు క్షమించుడి'",
      "Ephesians 4:32",
      "And be kind to one another, tenderhearted, forgiving one another, even as God in Christ forgave you",
      "ఒకరియెడల ఒకరు దయాళువులును సంపూర్ణ మనస్కులునై, దేవుడు క్రీస్తునందు మిమ్మును క్షమించిన ప్రకారము మీరును ఒకరినొకరు క్షమించుడి",
      "The standard for dealing with others' failures is the staggering, unconditional forgiveness we received in Christ.",
      "తోటివారి తప్పులను క్షమించుటకు కొలమానము: క్రీస్తు సిలువలో మన ఘోర పాపములను దేవుడు ఉచితముగా క్షమించిన ప్రేమయే."
    ],
    [
      "Colossians 3:12-13 commanding: 'Therefore, as the elect of God, holy and beloved, put on tender mercies, kindness, humility... bearing with one another, and forgiving one another, if anyone has a complaint against another; even as Christ forgave you, so you also must do'",
      "కొలొస్సయులకు 3:12-13 'దేవునిచేత ఏర్పరచబడిన పరిశుద్ధులును ప్రియులునైనవారికి తగినట్లు కనికరమును దయాళుత్వమును ధరించుకొనుడి; ఒకరినొకరు సహించుచు ప్రభువు మిమ్మును క్షమించినలాగున మీరును క్షమించుడి'",
      "Colossians 3:13",
      "Bearing with one another, and forgiving one another, if anyone has a complaint against another; even as Christ forgave you, so you also must do",
      "ఎవడైనను తనకు మరియొకనిమీద ఫిర్యాదు కలవాడైతే ఒకనినొకడు సహించుచు ఒకనినొకడు క్షమించుడి; ప్రభువు మిమ్మును క్షమించినలాగున మీరును క్షమించుడి",
      "Mutual forbearance absorbs interpersonal offenses, reflecting Christ's pardon toward failing humanity.",
      "ఇతరుల బలహీనతలను లోపములను సహనముతో భరించి క్రీస్తు క్షమించినట్లు పూర్ణహృదయముతో క్షమించుటే పరిశుద్ధుల లక్షణము."
    ],
    [
      "1 Timothy 1:12-14 Paul giving thanks: 'I thank Christ Jesus our Lord who has enabled me, because He counted me faithful, putting me into the ministry, although I was formerly a blasphemer, a persecutor, and an insolent man'",
      "1 తిమోతి 1:12-14 'పూర్వము దూషకుడను హింసకుడను హానికరమైనవాడనైన నన్ను నమ్మకమైనవానిగా ఎంచి పరిచర్యకు నియమించిన మన ప్రభువైన క్రీస్తుయేసునకు కృతజ్ఞుడనై యున్నాను'",
      "1 Timothy 1:12-13",
      "And I thank Christ Jesus our Lord who has enabled me, because He counted me faithful, putting me into the ministry, although I was formerly a blasphemer, a persecutor, and an insolent man; but I obtained mercy because I did it ignorantly in unbelief",
      "పూర్వము దూషకుడను హింసకుడను హానికరుడనైన నన్ను తన పరిచర్యకు నియమించి నమ్మకమైనవానిగా ఎంచినందుకు, నన్ను బలపరచిన మన ప్రభువైన క్రీస్తుయేసునకు కృతజ్ఞుడనై యున్నాను; అవిశ్వాసమువలన అజ్ఞానముతో చేసితిని గనుక కనికరింపబడితిని",
      "Sovereign grace takes disqualified blasphemers and appoints them as trusted ministers of the gospel.",
      "పూర్వపు ఘోర పాపములను దూషణలను దేవుడు క్షమించి, సువార్తను ప్రకటించే నమ్మకమైన పరిచారకునిగా నియమించిన అద్భుత కృప."
    ],
    [
      "2 Timothy 2:11-13 declaring: 'If we died with Him, we shall also live with Him. If we endure, we shall also reign with Him. If we deny Him, He also will deny us. If we are faithless, He remains faithful; He cannot deny Himself'",
      "2 తిమోతి 2:11-13 'మనము నమ్మదగనివారమైనను ఆయన నమ్మదగినవాడుగానే యుండును; ఆయన తన స్వభావమునకు విరోధముగా ఏదియు చేయలేడు'",
      "2 Timothy 2:13",
      "If we are faithless, He remains faithful; He cannot deny Himself",
      "మనము నమ్మదగనివారమైనను ఆయన నమ్మదగినవాడుగానే యుండును; ఆయన తన స్వభావమునకు విరోధముగా ఏదియు చేయలేడు",
      "God's covenant faithfulness is grounded ontologically in His own nature, not in human consistency.",
      "మనము అప్పుడప్పుడు బలహీనులమై నమ్మకత్వము తప్పినను, దేవుడు తన వాగ్దానములయందు ఎన్నడును మార్పులేని నమ్మకస్థుడై యున్నాడు."
    ],
    [
      "2 Timothy 2:24-26 on a servant of the Lord not quarreling but being gentle to all, in humility correcting those who are in opposition, if God perhaps will grant them repentance so that they may escape the snare of the devil",
      "2 తిమోతి 2:24-26 ప్రభువు దాసుడు కలహింపక అందరియెడల సాధువుగా ఉండి, సాతాను ఉరిలో చిక్కుబడినవారు విడిపింపబడునట్లు సాత్వికముతో దిద్దవలెను",
      "2 Timothy 2:25-26",
      "In humility correcting those who are in opposition, if God perhaps will grant them repentance, so that they may know the truth, and that they may come to their senses and escape the snare of the devil, having been taken captive by him to do his will",
      "సత్యవిషయమైన అనుభవజ్ఞానము వారికి కలుగుటకై దేవుడొకవేళ మారుమనస్సు దయచేసినయెడల, సాతాను తన చిత్తము నెరవేర్చుటకు పట్టిన ఉరిలోనుండి వారు తప్పించుకొని మేల్కొందురేమో అని, ఎదురాడువారిని సాత్వికముతో శిక్షించుచు అందరియెడల సాధువుగా ఉండవలెను",
      "Gentle pastoral instruction provides the atmosphere where God grants supernatural repentance to rescue deceived souls from satanic snares.",
      "సాతాను ఉరిలో పడిపోయినవారిని కోపముతో కాక సాత్వికముతో ఉపదేశించి దేవుని సత్యములోనికి మారుమనస్సు పొందునట్లు నడిపించుట."
    ],
    [
      "Titus 3:3-5 on for we ourselves were also once foolish, disobedient, deceived, serving various lusts and pleasures; but when the kindness and the love of God our Savior toward man appeared, not by works of righteousness, but according to His mercy He saved us",
      "తీతుకు 3:3-5 'ఏలయనగా పూర్వము మనముకూడ అవివేకులను అవిధేయులను మోసపోయినవారమై యుంటివి; అయితే మన రక్షకుడైన దేవుని దయయు ప్రేమయు ప్రత్యక్షమైనప్పుడు తన కనికరముచొప్పుననే మనలను రక్షించెను'",
      "Titus 3:4-5",
      "But when the kindness and the love of God our Savior toward man appeared, not by works of righteousness which we have done, but according to His mercy He saved us, through the washing of regeneration and renewing of the Holy Spirit",
      "అయితే మన రక్షకుడైన దేవునియొక్క దయయు మనుష్యులయెడల ఆయనకున్న ప్రేమయు ప్రత్యక్షమైనప్పుడు, మనము చేసిన నీతిక్రియలమూలముగా కాక, తన కనికరముచొప్పుననే పునర్జన్మసంబంధమైన స్నానముద్వారాను, పరిశుద్ధాత్మ మనకు నూతనస్వభావము కలుగజేయుటద్వారాను మనలను రక్షించెను",
      "Remembering our own former rebellion cures self-righteous arrogance; salvation is purely an act of unmerited mercy.",
      "మనమును ఒకప్పుడు మోసపోయి పాపములో పడిపోయినవారమే అని జ్ఞాపకము చేసికొని, దేవుని ఉచిత కనికరమువలననే రక్షింపబడితిమని స్తుతించుట."
    ],
    [
      "Hebrews 2:17-18 on in all things He had to be made like His brethren, that He might be a merciful and faithful High Priest, for in that He Himself has suffered, being tempted, He is able to aid those who are tempted",
      "హెబ్రీయులకు 2:17-18 తాను శోధింపబడి శ్రమ పొందెను గనుక శోధింపబడువారికి సహాయము చేయగల సమర్థుడు; కనికరమును నమ్మకమునుగల ప్రధానయాజకుడు",
      "Hebrews 2:18",
      "For in that He Himself has suffered, being tempted, He is able to aid those who are tempted",
      "తాను శోధింపబడి శ్రమ పొందెను గనుక శోధింపబడువారికిని సహాయము చేయగలవాడై యున్నాడు",
      "Experiential empathy: Christ's own battle with temptation equips Him to succor failing saints in their darkest moments.",
      "యేసు తానే శోధనలను శ్రమలను భరించి జయించెను గనుక శోధనలలో పడిపోవువారికి సమయోచిత సహాయము చేయుటకు ఆయన సమర్థుడు."
    ],
    [
      "Hebrews 7:25 declaring: 'Therefore He is also able to save to the uttermost those who come to God through Him, since He always lives to make intercession for them'",
      "హెబ్రీయులకు 7:25 'తనద్వారా దేవునియొద్దకు వచ్చువారి పక్షమున విజ్ఞాపనము చేయుటకు నిరంతరము జీవించుచున్నాడు గనుక వారిని సంపూర్ణముగా రక్షించుటకు సమర్థుడై యున్నాడు'",
      "Hebrews 7:25",
      "Therefore He is also able to save to the uttermost those who come to God through Him, since He always lives to make intercession for them",
      "ఈయన తనద్వారా దేవునియొద్దకు వచ్చువారి పక్షమున విజ్ఞాపనము చేయుటకు నిరంతరము జీవించుచున్నాడు గనుక వారిని సంపూర్ణముగా రక్షించుటకు సమర్థుడై యున్నాడు",
      "Jesus saves 'to the uttermost' (eis to panteles); His perpetual heavenly intercession insulates against final failure.",
      "పరలోకమందు మన పక్షమున అనుక్షణము విజ్ఞాపన చేయుచున్న యేసుక్రీస్తు మనలను తుదివరకు సంపూర్ణముగా రక్షించుటకు సమర్థుడు."
    ],
    [
      "1 Peter 2:24-25 on who Himself bore our sins in His own body on the tree, that we, having died to sins, might live for righteousness; by whose stripes you were healed; for you were like sheep going astray, but have now returned to the Shepherd and Overseer of your souls",
      "1 పేతురు 2:24-25 ఆయన తానే తన శరీరమందు మన పాపములను సిలువపై మోసెను; ఆయన పొందిన గాయములచేత మీరు స్వస్థత పొందితిరి; మీరు గొఱ్ఱెలవలె దారితప్పిపోయితిరి గాని యిప్పుడు మీ ఆత్మల కాపరియు అధ్యక్షుడునైన ఆయనయొద్దకు మళ్లియున్నారు",
      "1 Peter 2:24-25",
      "Who Himself bore our sins in His own body on the tree, that we, having died to sins, might live for righteousness-by whose stripes you were healed. For you were like sheep going astray, but have now returned to the Shepherd and Overseer of your souls",
      "మనము పాపములవిషయమై చనిపోయి, నీతివిషయమై జీవించునట్లు, ఆయన తానే తన శరీరమందు మన పాపములను మ్రానుమీద మోసుకొనెను; ఆయన పొందిన గాయములచేత మీరు స్వస్థత పొందితిరి. మీరు గొఱ్ఱెలవలె దారితప్పిపోతిరి గాని యిప్పుడు మీ ఆత్మల కాపరియు అధ్యక్షుడునైన ఆయనయొద్దకు మళ్లియున్నారు",
      "Atonement heals the fatal sickness of sin, welcoming straying wanderers back to the supreme Shepherd of souls.",
      "సిలువలో మన పాపములన్నిటిని మోసి గాయములు పొంది మనలను స్వస్థపరచి తన మందలోనికి చేర్చుకున్న ఆత్మల కాపరియైన యేసు."
    ],
    [
      "1 Peter 4:8 commanding: 'Above all things have fervent love for one another, for love will cover a multitude of sins'",
      "1 పేతురు 4:8 'అన్నిటికంటె ముఖ్యముగా ఒకనియెడల ఒకడు మిక్కిలి ప్రేమగలవారై యుండుడి; ప్రేమ అనేక పాపములను కప్పును'",
      "1 Peter 4:8",
      "And above all things have fervent love for one another, for 'love will cover a multitude of sins'",
      "ప్రేమ అనేక పాపములను కప్పును గనుక అన్నిటికంటె ముఖ్యముగా ఒకనియెడల ఒకడు మిక్కిలి ప్రేమగలవారై యుండుడి",
      "Fervent Christian love refuses to gossip or broadcast the failures of brothers, covering them with redemptive grace.",
      "సహోదరుల బలహీనతలను లోకమునకు చాటక క్రీస్తు ప్రేమతో వాటిని కప్పి క్షమించుట సంఘైక్యతకు అత్యంత ముఖ్యము."
    ],
    [
      "1 Peter 5:8-10 warning: 'Be sober, be vigilant; because your adversary the devil walks about like a roaring lion, seeking whom he may devour... But may the God of all grace, after you have suffered a while, perfect, establish, strengthen, and settle you'",
      "1 పేతురు 5:8-10 'నిబ్బరమైన బుద్ధిగలవారై మెలకువగా ఉండుడి; మీ విరోధియైన అపవాది గర్జించు సింహమువలె ఎవరిని మింగుదునా అని వెదకుచు తిరుగుచున్నాడు; సర్వకృపానిధియైన దేవుడు మిమ్మును పరిపూర్ణులుగా చేసి స్థిరపరచును'",
      "1 Peter 5:10",
      "May the God of all grace, who called us to His eternal glory by Christ Jesus, after you have suffered a while, perfect, establish, strengthen, and settle you",
      "క్రీస్తుయేసునందు తన నిత్యమహిమకు మిమ్మును పిలిచిన సర్వకృపానిధియైన దేవుడు, కొంచెముకాలము మీరు శ్రమపడిన తరువాత, తానే మిమ్మును పరిపూర్ణులుగా చేసి స్థిరపరచి బలపరచి నిలువును గాక",
      "The roaring lion seeks our destruction through failure, but the God of all grace restores, anchors, and settles the embattled soul.",
      "సాతాను మనలను పడద్రోయాలని చూచినను, సర్వకృపానిధియైన దేవుడే శ్రమల తరువాత మనలను పరిపూర్ణులుగా చేసి బలపరచి నిలబెట్టును."
    ],
    [
      "Revelation 12:10-11 the loud voice in heaven: 'Then I heard a loud voice saying in heaven, Now salvation, and strength, and the kingdom of our God, and the power of His Christ have come, for the accuser of our brethren, who accused them before our God day and night, has been cast down. And they overcame him by the blood of the Lamb and by the word of their testimony'",
      "ప్రకటన 12:10-11 'మన దేవునియెదుట రాత్రింబగళ్లు వారిమీద నేరము మోపు మన సహోదరులమీది నేరస్థుడు పడద్రోయబడియున్నాడు; గొర్రెపిల్ల రక్తమువలనను తామిచ్చిన సాక్ష్యపు వాక్యమువలనను వారు వానిని జయించియున్నారు'",
      "Revelation 12:10-11",
      "For the accuser of our brethren, who accused them before our God day and night, has been cast down. And they overcame him by the blood of the Lamb and by the word of their testimony, and they did not love their lives to the death",
      "మన దేవునియెదుట రాత్రింబగళ్లు వారిమీద నేరము మోపు మన సహోదరులమీది నేరస్థుడు పడద్రోయబడియున్నాడు. వారు గొర్రెపిల్ల రక్తమునుబట్టియు, తామిచ్చిన సాక్ష్యపు వాక్యమునుబట్టియు వానిని జయించిరి; మరియు మరణమువరకు తమ ప్రాణములను ప్రేమించలేదు",
      "The relentless accuser who weaponizes our past failures is forever cast down; saints overcome every demonic condemnation through the blood of the Lamb.",
      "రాత్రింబగళ్లు మన పాపములను ఎత్తిచూపు సాతాను గొర్రెపిల్ల రక్తమువలన ఓడింపబడెను; క్రీస్తు రక్తమే విశ్వాసులకు సంపూర్ణ విజయ సాధనము."
    ],
    [
      "Revelation 21:5-7 on He who sat on the throne saying, 'Behold, I make all things new... He who overcomes shall inherit all things, and I will be his God and he shall be My son'",
      "ప్రకటన 21:5-7 'సింహాసనాసీనుడై యున్నవాడు-ఇదిగో నేను సమస్తమును నూతనమైనవిగా చేయుచున్నానని సెలవిచ్చెను; జయించువాడు వీటిని స్వతంత్రించుకొనును, నేను అతనికి దేవుడనై యుందును అతడు నాకు కుమారుడై యుండును'",
      "Revelation 21:5,7",
      "Then He who sat on the throne said, 'Behold, I make all things new.' And He said to me, 'Write, for these words are true and faithful'... He who overcomes shall inherit all things, and I will be his God and he shall be My son",
      "అప్పుడు సింహాసనాసీనుడై యున్నవాడు-ఇదిగో నేను సమస్తమును నూతనమైనవిగా చేయుచున్నానని సెలవిచ్చెను... జయించువాడు వీటిని స్వతంత్రించుకొనును, నేను అతనికి దేవుడనై యుందును అతడు నాకు కుమారుడై యుండును",
      "The grand finale of redemptive history: all ruin and failure eradicated forever as God re-creates all things new for His victorious children.",
      "సమస్త పాపము శ్రమ కన్నీరు గతించిపోగా దేవుడు సమస్తమును నూతనముగా చేసి జయించిన పరిశుద్ధులను తన నిత్య కుమారులుగా స్వీకరించు పరమ ముగింపు."
    ],
    [
      "Hebrews 13:20-21 benediction: 'Now may the God of peace who brought up our Lord Jesus from the dead... make you complete in every good work to do His will, working in you what is well pleasing in His sight, through Jesus Christ'",
      "హెబ్రీయులకు 13:20-21 'గొఱ్ఱెల గొప్ప కాపరియైన మన ప్రభువైన యేసును నిత్యమైన నిబంధన రక్తమునుబట్టి మృతులలోనుండి లేపిన సమాధానకర్తయైన దేవుడు తన చిత్తము చేయుటకు ప్రతి సత్కార్యములో మిమ్మును సంపూర్ణులనుగా చేయును గాక'",
      "Hebrews 13:20-21",
      "Now may the God of peace who brought up our Lord Jesus from the dead, that great Shepherd of the sheep, through the blood of the everlasting covenant, make you complete in every good work to do His will, working in you what is well pleasing in His sight, through Jesus Christ",
      "నిత్యమైన నిబంధన రక్తమునుబట్టి గొఱ్ఱెల గొప్ప కాపరియైన యేసును మృతులలోనుండి లేపిన సమాధానకర్తయైన దేవుడు, యేసుక్రీస్తుద్వారా తన దృష్టికి అనుకూలమైనదానిని మనలో జరిగించుచు, తన చిత్తము చేయుటకు ప్రతి సత్కార్యమందును మిమ్మును సంపూర్ణులనుగా చేయును గాక",
      "The eternal covenant blood of Christ guarantees that the God of peace will complete what is lacking in our brokenness and empower pleasing obedience.",
      "నిత్య నిబంధన రక్తముద్వారా మన బలహీనతలను సంపూర్ణముగా సరిచేసి తన చిత్తము చేయుటకు మనలను సిద్ధపరచే దేవుని ఆశీర్వాదము."
    ]
  ];

  return extra.map(item => ({
    easyQ: `What NT doctrine of grace or triumph over failure is revealed regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి క్రొత్త నిబంధనలో ఇవ్వబడిన కృపా సిద్ధాంతము లేదా ఆత్మీయ జయమేమి?`,
    medQ: `According to ${item[2]}, how does Christ's finished work atone for, lift, and restore failing believers?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం పడిపోయిన విశ్వాసులను క్రీస్తు సిలువ కార్యం ఎలా రక్షించి పునరుద్ధరించుచున్నది?`,
    hardQ: `What theological truth does ${item[2]} establish regarding our eternal justification and perseverance against Satan's accusations?`,
    hardQTe: `${item[2]} ప్రకారం సాతాను నిందలను తోసిపుచ్చి విశ్వాసికి నిత్య నీతిని భద్రతను ఇచ్చు దేవుని పరమ సంకల్పమేమి?`,
    options: [item[3], "He instituted thirty days of ceremonial washings in Antioch", "He gathered sixty legions of soldiers to defend the temple", "He commanded forty sacrifices offered at the altar in Corinth"],
    optionsTelugu: [item[4], "అంతియొకయలో ముప్పది దినముల ఆచార శుద్ధీకరణలను నియమించెను", "దేవాలయ రక్షణకొరకు అరవై సైన్యపు దళములను సమకూర్చెను", "కొరింథులోని బలిపీఠముపై నలభై బలులను అర్పింపవలెనని ఆజ్ఞాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

const fFacts = buildFailureFoundation();
const gFacts = buildFailureGrowth();
const mFacts = [...buildFailureMastery(), ...getAdditionalMastery20()];

console.log(`Failure Foundation facts count: ${fFacts.length}`);
console.log(`Failure Growth facts count: ${gFacts.length}`);
console.log(`Failure Mastery facts count: ${mFacts.length}`);

buildBank('Failure', 'fai', fFacts, gFacts, mFacts);
