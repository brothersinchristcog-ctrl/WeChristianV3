const { buildBank } = require('./bank_builder.js');

// 50 Foundation Facts for Peace (Biblical promises of shalom, Christ the Prince of Peace, peacemaking, tranquility)
function buildPeaceFoundation() {
  const data = [
    [
      "Isaiah 9:6 prophesying the messianic titles of the coming Redeemer culminating in 'Prince of Peace'",
      "యెషయా 9:6 మెస్సీయ బిరుదులలో శిఖరమైన 'సమాధానకర్తయగు అధిపతి' అను ప్రవచన ప్రకటన",
      "Isaiah 9:6",
      "For unto us a Child is born, unto us a Son is given; and the government will be upon His shoulder. And His name will be called Wonderful, Counselor, Mighty God, Everlasting Father, Prince of Peace",
      "ఏలయనగా మనకు శిశువు పుట్టెను, మనకు కుమారుడు అనుగ్రహింపబడెను; ఆయన భుజముమీద రాజ్యభారముండును. ఆశ్చర్యకరుడు ఆలోచనకర్త బలవంతుడైన దేవుడు నిత్యుడగు తండ్రి సమాధానకర్తయగు అధిపతి అని అతనికి పేరు పెట్టబడును",
      "The messianic King does not conquer by brutal bloodshed, but establishes an eternal government anchored in divine shalom.",
      "క్రీస్తు రాజ్యము సైనిక బలముతో కాక దైవిక సమాధానముతో స్థాపించబడును; ఆయనే నిత్య సమాధానకర్తయగు అధిపతి."
    ],
    [
      "Philippians 4:7 the divine fortress of tranquility: 'And the peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus'",
      "ఫిలిప్పీయులకు 4:7 బుద్ధికి మించిన దేవుని శాంతి: 'అప్పుడు సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము క్రీస్తుయేసువలన మీ హృదయములకును మీ తలంపులకును కావలియుండును'",
      "Philippians 4:7",
      "And the peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus",
      "అప్పుడు సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము క్రీస్తుయేసువలన మీ హృదయములకును మీ తలంపులకును కావలియుండును",
      "When prayers of thanksgiving replace anxiety, God installs His military guard of supernatural peace around our vulnerable thought-life.",
      "కృతజ్ఞతాపూర్వక ప్రార్థన చేయు విశ్వాసి హృదయమునకు దేవుని సమాధానమే సైనిక రక్షణ కవచమువలె కావలియుండును."
    ],
    [
      "John 14:27 Jesus bequeathing His peace before Calvary: 'Peace I leave with you, My peace I give to you; not as the world gives do I give to you'",
      "యోహాను 14:27 సిలువకు ముందు యేసు ఇచ్చిన వీలునామా: 'శాంతి మీకనుగ్రహించి వెళ్లుచున్నాను, నా శాంతినే మీకిచ్చుచున్నాను; లోకమిచ్చునట్టుగా నేను మీకిచ్చుటలేదు'",
      "John 14:27",
      "Peace I leave with you, My peace I give to you; not as the world gives do I give to you. Let not your heart be troubled, neither let it be afraid",
      "శాంతి మీకనుగ్రహించి వెళ్లుచున్నాను, నా శాంతినే మీకిచ్చుచున్నాను; లోకమిచ్చునట్టుగా నేను మీకిచ్చుటలేదు; మీ హృదయమును కలవరపడనియ్యకుడి, వెరవనియ్యకుడి",
      "Worldly peace depends on comfortable circumstances, but Christ's peace is an intrinsic, unshakable gift that reigns in the midst of betrayal and sorrow.",
      "లోకము ఇచ్చే శాంతి పరిస్థితులపై ఆధారపడును; క్రీస్తు ఇచ్చే శాంతియో శ్రమలు మరియు సంక్షోభములమధ్య సైతం హృదయములో వెల్లివిరియును."
    ],
    [
      "Romans 5:1 the legal foundation of peace: 'Therefore, having been justified by faith, we have peace with God through our Lord Jesus Christ'",
      "రోమీయులకు 5:1 విశ్వాసమువలన కలుగు సమాధానము: 'కాబట్టి విశ్వాసమువలన మనము నీతిమంతులముగా తీర్చబడి, మన ప్రభువైన యేసుక్రీస్తుద్వారా దేవునితో సమాధానము కలిగియున్నాము'",
      "Romans 5:1",
      "Therefore, having been justified by faith, we have peace with God through our Lord Jesus Christ",
      "కాబట్టి విశ్వాసమువలన మనము నీతిమంతులముగా తీర్చబడి, మన ప్రభువైన యేసుక్రీస్తుద్వారా దేవునితో సమాధానము కలిగియున్నాము",
      "Justification abolishes the state of cosmic warfare between rebellious sinners and holy God, inaugurating covenant reconciliation.",
      "క్రీస్తు సిలువ బలియాగముద్వారా పాపపు శత్రుత్వము అంతమై దేవునితో విశ్వాసికి నిత్య సమాధానము సిద్ధించెను."
    ],
    [
      "Isaiah 26:3 the steadfast mind anchored in perfect peace: 'You will keep him in perfect peace, whose mind is stayed on You, because he trusts in You'",
      "యెషయా 26:3 సంపూర్ణ సమాధానపు రహస్యము: 'ఎవని మనస్సు నీమీద ఆనుకొనునో వానిని నీవు పూర్ణశాంతిగలవానిగా కాపాడుదువు; ఏలయనగా అతడు నీయందు విశ్వాసముంచియున్నాడు'",
      "Isaiah 26:3",
      "You will keep him in perfect peace, whose mind is stayed on You, because he trusts in You",
      "ఎవని మనస్సు నీమీద ఆనుకొనునో వానిని నీవు పూర్ణశాంతిగలవానిగా కాపాడుదువు; ఏలయనగా అతడు నీయందు విశ్వాసముంచియున్నాడు",
      "Double peace (shalom shalom): unwavering intellectual and spiritual fixation upon God's character produces absolute psychological calm.",
      "చంచలమైన లోక పరిస్థితులను కాక దేవుని నామమును ఆనుకొని జీవించువాని హృదయమును దేవుడు పూర్ణశాంతితో నింపును."
    ],
    [
      "Numbers 6:24-26 the Aaronic benediction crowning the pilgrim with peace: 'The Lord lift up His countenance upon you, and give you peace'",
      "సంఖ్యాకాండము 6:24-26 అహరోను యాజక ఆశీర్వాదము: 'యెహోవా నీమీద తన సన్నిధి కాంతిని ప్రకాశింపజేసి నీకు సమాధానము కలుగజేయును గాక'",
      "Numbers 6:26",
      "The Lord lift up His countenance upon you, and give you peace",
      "యెహోవా నీమీద తన ముఖకాంతిని ప్రకాశింపజేసి నీకు సమాధానము కలుగజేయును గాక",
      "The climactic blessing of the Levitical covenant is the shining smile of God's face bestowing holistic shalom upon His people.",
      "దేవుని ముఖకాంతి వెలుగు తన ప్రజలపై ప్రసరించుటయే సమస్త సంపూర్ణ ఆశీర్వాదములకు సమాధానమునకు మూలము."
    ],
    [
      "Matthew 5:9 the beatitude of peacemaking: 'Blessed are the peacemakers, for they shall be called sons of God'",
      "మత్తయి 5:9 సమాధానపరచువారి ధన్యత: 'సమాధానపరచువారు ధన్యులు, వారు దేవుని కుమారులనబడుదురు'",
      "Matthew 5:9",
      "Blessed are the peacemakers, for they shall be called sons of God",
      "సమాధానపరచువారు ధన్యులు, వారు దేవుని కుమారులనబడుదురు",
      "Active reconcilers mirror the heart of the Father, earning the family likeness of genuine sons of God.",
      "కలహములను పోగొట్టి సమాధానమును స్థాపించేవారు పరమ తండ్రి స్వభావమును ప్రతిబింబించుచూ దేవుని కుమారులని పిలువబడుదురు."
    ],
    [
      "Ephesians 2:14 Christ our living peace: 'For He Himself is our peace, who has made both one, and has broken down the middle wall of separation'",
      "ఎఫెసీయులకు 2:14 క్రీస్తే మన సమాధానము: 'ఆయనే మన సమాధానమై యుండి, ఉభయులను ఏకము చేసి విరోధమును, అనగా వేరుచేయుచుండిన అడ్డగోడను కూల్చివేసెను'",
      "Ephesians 2:14",
      "For He Himself is our peace, who has made both one, and has broken down the middle wall of separation",
      "ఆయనే మన సమాధానమై యుండి, ఉభయులను ఏకము చేసి, తన శరీరమందు విరోధమును, అనగా ఆజ్ఞలరూపకమైన ధర్మశాస్త్రమును రద్దుపరచుటవలన వేరుచేయుచుండిన అడ్డగోడను పడగొట్టెను",
      "Peace is not a political treaty but a Person; Christ incarnates peace by shattering ethnic alienation between Jew and Gentile at the cross.",
      "యూదులకు అన్యజనులకు మధ్య ఉన్న పగను విభజన గోడలను సిలువలో కూల్చివేసి క్రీస్తే స్వయముగా మన సమాధానమాయెను."
    ],
    [
      "Colossians 3:15 the governing umpire of peace: 'And let the peace of God rule in your hearts, to which also you were called in one body; and be thankful'",
      "కొలొస్సయులకు 3:15 హృదయములను ఏలు సమాధానము: 'క్రీస్తు సమాధానము మీ హృదయములలో ఏలుచుండనియ్యుడి; ఇందుకొరకే మీరు ఒకే శరీరముగా పిలువబడితిరి; మరియు కృతజ్ఞులై యుండుడి'",
      "Colossians 3:15",
      "And let the peace of God rule in your hearts, to which also you were called in one body; and be thankful",
      "క్రీస్తు సమాధానము మీ హృదయములలో ఏలుచుండనియ్యుడి; ఇందుకొరకే మీరు ఒకే శరీరముగా పిలువబడితిరి; మరియు కృతజ్ఞులై యుండుడి",
      "The Greek term brabeueto designates peace as an umpire, deciding every ethical dilemma and keeping community harmony.",
      "సమస్త నిర్ణయములలోను సంఘ సంబంధములలోను క్రీస్తు సమాధానమే న్యాయాధిపతివలె మన హృదయములను ఏలవలెను."
    ],
    [
      "Psalm 29:11 the divine coronation gift: 'The Lord will give strength to His people; the Lord will bless His people with peace'",
      "కీర్తన 29:11 పరలోకపు బహుమానము: 'యెహోవా తన ప్రజలకు బలము ననుగ్రహించును, యెహోవా తన ప్రజలకు సమాధానము కలుగజేసి వారిని ఆశీర్వదించును'",
      "Psalm 29:11",
      "The Lord will give strength to His people; the Lord will bless His people with peace",
      "యెహోవా తన ప్రజలకు బలము ననుగ్రహించును, యెహోవా తన ప్రజలకు సమాధానము కలుగజేసి వారిని ఆశీర్వదించును",
      "The thunderstorm Psalm that shakes the wilderness closes with the Sovereign Lord crowning His covenant people with calm shalom.",
      "సమస్త సృష్టిని వణకించే పరాక్రమశాలియైన దేవుడు తన భక్తులకు బలమును మరియు సమాధానమను పరమ ఆశీర్వాదమును ఇచ్చును."
    ],
    [
      "Romans 12:18 the boundary of personal peacemaking: 'If it is possible, as much as depends on you, live peaceably with all men'",
      "రోమీయులకు 12:18 సమాధాన సంబంధమైన ప్రవర్తన: 'శక్యమైతే మీ చేతనైనంతమట్టుకు సమస్త మనుష్యులతో సమాధానముగా ఉండుడి'",
      "Romans 12:18",
      "If it is possible, as much as depends on you, live peaceably with all men",
      "శక్యమైతే మీ చేతనైనంతమట్టుకు సమస్త మనుష్యులతో సమాధానముగా ఉండుడి",
      "While others may insist on conflict, believers must exhaust every righteous effort to maintain peaceful relations with society.",
      "ఎదుటివారు కలహములకు దిగినను విశ్వాసి తనవంతుగా శాంతిని సమాధానమును కాపాడుకొనుటకు శాయశక్తులా ప్రయత్నించవలెను."
    ],
    [
      "Romans 14:17 the spiritual essence of the Kingdom: 'For the kingdom of God is not eating and drinking, but righteousness and peace and joy in the Holy Spirit'",
      "రోమీయులకు 14:17 దేవుని రాజ్యపు స్వరూపము: 'దేవుని రాజ్యము భోజనమును పానమును కాదు గాని, నీతియు సమాధానమును పరిశుద్ధాత్మయందలి ఆనందమునై యున్నది'",
      "Romans 14:17",
      "For the kingdom of God is not eating and drinking, but righteousness and peace and joy in the Holy Spirit",
      "దేవుని రాజ్యము భోజనమును పానమును కాదు గాని, నీతియు సమాధానమును పరిశుద్ధాత్మయందలి ఆనందమునై యున్నది",
      "True religion does not consist of disputing over dietary regulations, but experiencing the Spirit's triad of righteousness, peace, and joy.",
      "బాహ్య ఆచారములు భోజన నియమములు దేవుని రాజ్యము కాదు; పరిశుద్ధాత్మయందలి నీతి, సమాధానము, ఆనందమే పరలోక రాజ్య లక్షణము."
    ],
    [
      "Romans 14:19 pursuing the architecture of unity: 'Therefore let us pursue the things which make for peace and the things by which one may edify another'",
      "రోమీయులకు 14:19 సమాధాన సాధనములు: 'కాబట్టి సమాధానమును పరస్పర క్షేమాభివృద్ధిని కలుగజేయువాటినే మనము అనుసరింతము'",
      "Romans 14:19",
      "Therefore let us pursue the things which make for peace and the things by which one may edify another",
      "కాబట్టి సమాధానమును పరస్పర క్షేమాభివృద్ధిని కలుగజేయువాటినే మనము అనుసరింతము",
      "Peace in the church requires proactive, energetic pursuit (diokomen) of words and actions that construct rather than demolish.",
      "సంఘములో కలహములను విడనాడి ఒకరినొకరు బలపరచు సమాధానపు సంగతులనే ఆసక్తితో వెంబడించవలెను."
    ],
    [
      "Galatians 5:22 the sweet harvest of the Spirit: 'The fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness'",
      "గలతీయులకు 5:22 ఆత్మ ఫలము: 'ఆత్మ ఫలమేమనగా-ప్రేమ, సంతోషము, సమాధానము, దీర్ఘశాంతము, దయాళుత్వము, మంచితనము, విశ్వాసము'",
      "Galatians 5:22",
      "But the fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness",
      "అయితే ఆత్మ ఫలమేమనగా-ప్రేమ, సంతోషము, సమాధానము, దీర్ఘశాంతము, దయాళుత్వము, మంచితనము, విశ్వాసము",
      "Supernatural tranquility is not self-manufactured emotional stoicism, but organic fruit cultivated by the indwelling Holy Spirit.",
      "సమాధానము అనునది స్వంత ప్రయత్నముతో వచ్చునది కాదు; పరిశుద్ధాత్ముడు విశ్వాసి అంతరంగములో ఫలింపజేయు పరమ ఫలము."
    ],
    [
      "2 Thessalonians 3:16 the constant prayer of peace: 'Now may the Lord of peace Himself give you peace always in every way. The Lord be with you all'",
      "2 థెస్సలొనీకయులకు 3:16 నిరంతర శాంతి ప్రార్థన: 'సమాధానకర్తయగు ప్రభువు తానే యెల్లప్పుడును ప్రతివిధమునను మీకు సమాధానము అనుగ్రహించును గాక; ప్రభువు మీకందరికి తోడైయుండును గాక'",
      "2 Thessalonians 3:16",
      "Now may the Lord of peace Himself give you peace always in every way. The Lord be with you all",
      "సమాధానకర్తయగు ప్రభువు తానే యెల్లప్పుడును ప్రతివిధమునను మీకు సమాధానము అనుగ్రహించును గాక; ప్రభువు మీకందరికి తోడైయుండును గాక",
      "Paul's comprehensive apostolic benediction: the Lord of peace personally dispenses peace in every season, through every trial, in every circumstance.",
      "సమాధానకర్తయైన ప్రభువే స్వయముగా సమస్త వేళలయందును ప్రతి పరిస్థితిలోను మనకు పరిపూర్ణ శాంతిని దయచేయును."
    ],
    [
      "James 3:17-18 the peaceable character of divine wisdom: 'The wisdom from above is first pure, then peaceable... the fruit of righteousness is sown in peace by those who make peace'",
      "యాకోబు 3:17-18 పరలోక జ్ఞానపు శాంతిస్వభావము: 'పైనుండి వచ్చు జ్ఞానము మొదట పవిత్రమైనది, తరువాత సమాధానకరమైనది... సమాధానము చేయువారు సమాధానమందు విత్తుచు నీతిఫలము కోయుదురు'",
      "James 3:17-18",
      "The wisdom that is from above is first pure, then peaceable, gentle, willing to yield, full of mercy and good fruits... Now the fruit of righteousness is sown in peace by those who make peace",
      "అయితే పైనుండి వచ్చు జ్ఞానము మొదట పవిత్రమైనది, తరువాత సమాధానకరమైనది, మృదువైనది, సులభముగా లోబడునది, కనికరముతోను మంచి ఫలములతోను నిండినది... సమాధానము చేయువారు సమాధానమందు విత్తుచు నీతిఫలము కోయుదురు",
      "Earthly wisdom breeds bitter envy and selfish ambition; celestial wisdom sows seeds of gentle peace to harvest righteousness.",
      "లోకపు జ్ఞానము కలహములను అసూయను పుట్టించును; దైవిక జ్ఞానము సమాధానమను విత్తనములను విత్తి నీతిఫలములను కోయును."
    ],
    [
      "1 Peter 3:11 the active quest for harmony: 'Let him turn away from evil and do good; let him seek peace and pursue it'",
      "1 పేతురు 3:11 శాంతిని వెంబడించుట: 'అతడు చెడుతనమునుండి తొలగి మేలు చేయవలెను, సమాధానమును వెదకి దాని వెంటాడవలెను'",
      "1 Peter 3:11",
      "Let him turn away from evil and do good; let him seek peace and pursue it",
      "అతడు చెడుతనమునుండి తొలగి మేలు చేయవలెను, సమాధానమును వెదకి దాని వెంటాడవలెను",
      "Peace is not passive lethargy; the disciple must track it down, chase after it, and actively preserve it through righteous living.",
      "సమాధానము దానంతటదే రాదు; విశ్వాసి చెడును విసర్జించి మేలు చేయుచూ శాంతిని వెదకి దాని వెంటపడవలెను."
    ],
    [
      "Isaiah 53:5 the atoning cost of our peace: 'He was wounded for our transgressions... the chastisement for our peace was upon Him, and by His stripes we are healed'",
      "యెషయా 53:5 మన సమాధానమునకు చెల్లించిన రక్తపు వెల: 'మన అతిక్రమములనుబట్టి అతడు గాయపరచబడెను... మన సమాధానార్థమైన శిక్ష అతనిమీద పడెను, అతడు పొందిన దెబ్బలచేత మనకు స్వస్థత కలుగుచున్నది'",
      "Isaiah 53:5",
      "He was wounded for our transgressions, He was bruised for our iniquities; the chastisement for our peace was upon Him, and by His stripes we are healed",
      "మన అతిక్రమములనుబట్టి అతడు గాయపరచబడెను, మన దోషములనుబట్టి నలుగగొట్టబడెను; మన సమాధానార్థమైన శిక్ష అతనిమీద పడెను, అతడు పొందిన దెబ్బలచేత మనకు స్వస్థత కలుగుచున్నది",
      "Peace with God was bought at astronomical cost: the Suffering Servant absorbed the punitive blow of divine justice on our behalf.",
      "దేవునితో మనకు సమాధానము కలుగుటకై యేసుక్రీస్తు సిలువలో మన పాపపు దెబ్బలను శిక్షను తన శరీరమందు భరించెను."
    ],
    [
      "Isaiah 52:7 the mountain herald of good news: 'How beautiful upon the mountains are the feet of him who brings good news, who proclaims peace'",
      "యెషయా 52:7 పర్వతములపై సమాధానపు సువార్త: 'సువార్త ప్రకటించుచు సమాధానము చాటించుచు సువర్తమానము ప్రకటించువాని పాదములు పర్వతములమీద ఎంతో సుందరముగా ఉన్నవి'",
      "Isaiah 52:7",
      "How beautiful upon the mountains are the feet of him who brings good news, who proclaims peace, who brings glad tidings of good things, who proclaims salvation, who says to Zion, 'Your God reigns!'",
      "సువార్త ప్రకటించుచు సమాధానము చాటించుచు సువర్తమానము ప్రకటించుచు రక్షణను ప్రసిద్ధపరచుచు-నీ దేవుడు రాజ్యమేలుచున్నాడని సీయోనుతో చెప్పువాని పాదములు పర్వతములమీద ఎంతో సుందరముగా ఉన్నవి",
      "The herald running across the ridges announces that the exile is terminated, God reigns sovereignly, and divine peace is restored.",
      "పాపపు బానిసత్వము తీరిపోయినదనియు మన దేవుడే రాజ్యమేలుచున్నాడనియు సమాధాన సువార్తను ప్రకటించే సేవకుల పాదములు ఎంతో సుందరమైనవి."
    ],
    [
      "Luke 2:14 the angelic Christmas anthem: 'Glory to God in the highest, and on earth peace, goodwill toward men!'",
      "లూకా 2:14 దేవదూతల క్రిస్మస్ గీతము: 'సర్వోన్నతమైన స్థలములలో దేవునికి మహిమయు, ఆయనకిష్టులైన మనుష్యులకు భూమిమీద సమాధానమును కలుగును గాక'",
      "Luke 2:14",
      "Glory to God in the highest, and on earth peace, goodwill toward men!",
      "సర్వోన్నతమైన స్థలములలో దేవునికి మహిమయు, ఆయనకిష్టులైన మనుష్యులకు భూమిమీద సమాధానమును కలుగును గాక",
      "The incarnation unifies heaven and earth: highest glory ascends to God while celestial peace cascades down upon humanity.",
      "రక్షకుని జననముద్వారా పరలోకములో దేవునికి మహిమయు భూమిమీది మానవాళికి నిత్య సమాధానమును అనుగ్రహింపబడెను."
    ],
    [
      "John 20:19,21 the resurrected Christ standing among trembling disciples behind bolted doors: 'Peace be with you'",
      "యోహాను 20:19,21 తలుపులు మూసియున్న గదిలో పునరుత్థానుడైన యేసు ప్రత్యక్షమై 'మీకు సమాధానము కలుగును గాక' అని పలికిన అభయము",
      "John 20:19,21",
      "Jesus came and stood in the midst, and said to them, 'Peace be with you'... So Jesus said to them again, 'Peace to you! As the Father has sent Me, I also send you'",
      "యేసు వచ్చి మధ్యను నిలిచి-మీకు సమాధానము కలుగును గాక అని వారితో చెప్పెను... యేసు-మరల మీకు సమాధానము కలుగును గాక; తండ్రి నన్ను పంపిన ప్రకారము నేనును మిమ్మును పంపుచున్నానని చెప్పెను",
      "Physical barricades of fear cannot bar the risen Lord; His first greeting dissolves cowardice into apostolic mission.",
      "భయముతో తలుపులు మూసుకొని ఉన్న శిష్యులమధ్యకు యేసు నడచివచ్చి సమాధానమును పలికి వారిని ప్రపంచ సువార్త సేవకు పంపెను."
    ],
    [
      "Psalm 4:8 the sweet resting posture: 'I will both lie down in peace, and sleep; for You alone, O Lord, make me dwell in safety'",
      "కీర్తన 4:8 రాత్రివేళ విశ్రాంతి: 'నెమ్మదితో పండుకొని వెంటనే నిద్రపోవుదును; యెహోవా, నెమ్మదిగా నేను నివసించునట్లు చేయువాడవు నీవే'",
      "Psalm 4:8",
      "I will both lie down in peace, and sleep; for You alone, O Lord, make me dwell in safety",
      "నెమ్మదితో పడుకొని వెంటనే నిద్రపోవుదును; యెహోవా, నేను ఒంటరిగా సురక్షితముగా నివసించునట్లు చేయువాడవు నీవే",
      "Surrounded by slanderers and enemies, David reclines in peaceful slumber because God acts as his invisible night sentinel.",
      "శత్రువులు నిందించినను దేవుని సురక్షిత రెక్కలక్రింద హృదయములో నెమ్మది కలిగి ప్రశాంతముగా నిద్రించు భక్తుని ధన్యత."
    ],
    [
      "Psalm 34:14 departing from toxicity: 'Depart from evil and do good; seek peace and pursue it'",
      "కీర్తన 34:14 పవిత్ర ప్రవర్తన: 'చెడుతనమునుండి తొలగి మేలు చేయుము, సమాధానమును వెదకి దాని వెంటాడుము'",
      "Psalm 34:14",
      "Depart from evil and do good; seek peace and pursue it. The eyes of the Lord are on the righteous",
      "చెడుతనమునుండి తొలగి మేలు చేయుము, సమాధానమును వెదకి దాని వెంటాడుము; యెహోవా దృష్టి నీతిమంతులమీద ఉన్నది",
      "Inner tranquil peace cannot co-exist with harbored wickedness; one must cleanly cut ties with sin to walk in genuine shalom.",
      "చెడును విసర్జించకుండ సమాధానము దొరకదు; పాపమును విడిచి మేలు చేయుచూ శాంతిని వెంబడించువారిపై దేవుని కనుదృష్టి ఉండును."
    ],
    [
      "Psalm 37:37 the tranquil terminus of a righteous life: 'Mark the blameless man, and observe the upright; for the future of that man is peace'",
      "కీర్తన 37:37 నీతిమంతుని సమాధానకరమైన ముగింపు: 'నిష్కపటులను గమనించుము, యథార్థవంతులను చూడుము; సమాధానముగలవానికి సంతతి కలుగును (వాని ముగింపు సమాధానమే)'",
      "Psalm 37:37",
      "Mark the blameless man, and observe the upright; for the future of that man is peace",
      "నిష్కపటులను గమనించుము, యథార్థవంతులను చూడుము; సమాధానముగలవానికి సంతతి కలుగును (వాని అంతము సమాధానమే)",
      "While the wicked perish violently and are cut off, the final legacy and sunset of the blameless believer is serene peace.",
      "దుష్టుల నామము నాశనమగును గాని దేవుని యెదుట యథార్థముగా జీవించినవాని జీవిత ముగింపు పరిపూర్ణ సమాధానముగా ఉండును."
    ],
    [
      "Psalm 85:8 listening for the divine voice of reconciliation: 'I will hear what God the Lord will speak, for He will speak peace to His people and to His saints'",
      "కీర్తన 85:8 దేవుని సమాధాన స్వరము: 'దేవుడైన యెహోవా సెలవిచ్చు మాటను నేను వినెదను; ఆయన తన ప్రజలతోను తన పరిశుద్ధులతోను సమాధానపు మాటలు సెలవిచ్చును'",
      "Psalm 85:8",
      "I will hear what God the Lord will speak, for He will speak peace to His people and to His saints; but let them not turn back to folly",
      "దేవుడైన యెహోవా సెలవిచ్చు మాటను నేను వినెదను; ఆయన తన ప్రజలతోను తన భక్తులతోను సమాధానపు మాటలు సెలవిచ్చును, వారు మరల బుద్ధిహీనతలోనికి తిరుగకూడదు",
      "Prophetic posture: quieting human clamor to hear God's sovereign oracle of peace, warned never to relapse into sinful foolishness.",
      "దేవుడు తన ప్రజలతో సమాధానపు మాటలు మాట్లాడును; ఆ శాంతిని అనుభవించువారు మరల పాపపు మూర్ఖత్వములోనికి జారకూడదు."
    ],
    [
      "Psalm 85:10 the theological kiss at the cross: 'Mercy and truth have met together; righteousness and peace have kissed'",
      "కీర్తన 85:10 సిలువయొద్ద పవిత్ర కలయిక: 'కృపాసత్యములు కలిసికొనినవి, నీతిసమాధానములు ముద్దుపెట్టుకొనినవి'",
      "Psalm 85:10",
      "Mercy and truth have met together; righteousness and peace have kissed",
      "కృపాసత్యములు కలిసికొనినవి, నీతిసమాధానములు ముద్దుపెట్టుకొనినవి",
      "At Calvary, God's unbending truth and holy righteousness embraced His tender mercy and peace without moral compromise.",
      "సిలువలో దేవుని పరిశుద్ధ నీతి మరియు కృప ఏకమాయెను; నీతి సమాధానములు పరస్పరము ముద్దుపెట్టుకొనిన పరమ విమోచన."
    ],
    [
      "Psalm 119:165 the stumble-proof stability of loving the Word: 'Great peace have those who love Your law, and nothing causes them to stumble'",
      "కీర్తన 119:165 వాక్యప్రేమికుల మహా సమాధానము: 'నీ ధర్మశాస్త్రమును ప్రేమించువారికి నెమ్మది (మహా సమాధానము) విస్తారముగా కలదు, వారిని తొట్రిల్లజేయునది ఏదియు లేదు'",
      "Psalm 119:165",
      "Great peace have those who love Your law, and nothing causes them to stumble",
      "నీ ధర్మశాస్త్రమును ప్రేమించువారికి నెమ్మది విస్తారముగా కలదు; వారిని తొట్రిల్లజేయునది ఏదియు లేదు",
      "Passionate devotion to Scripture builds an shock-absorbent foundation; offenses, insults, and scandals cannot dislodge their soul.",
      "దేవుని వాక్యమును ప్రేమించే విశ్వాసులకు విస్తారమైన సమాధానము ఉండును; లోకములో ఎటువంటి అభ్యంతరములు ఎదురైనా వారు తొట్రిల్లరు."
    ],
    [
      "Psalm 122:6-7 the intercessory mandate for Zion: 'Pray for the peace of Jerusalem: May they prosper who love you. Peace be within your walls'",
      "కీర్తన 122:6-7 యెరూషలేము క్షేమ ప్రార్థన: 'యెరూషలేముయొక్క క్షేమముకొరకు (సమాధానముకొరకు) ప్రార్థించుడి; నిన్ను ప్రేమించువారు వర్ధిల్లుదురు, నీ ప్రాకారములలో సమాధానముండును గాక'",
      "Psalm 122:6-7",
      "Pray for the peace of Jerusalem: 'May they prosper who love you. Peace be within your walls, prosperity within your palaces'",
      "యెరూషలేముయొక్క క్షేమముకొరకు ప్రార్థించుడి; నిన్ను ప్రేమించువారు వర్ధిల్లుదురు. నీ ప్రాకారములలో సమాధానమును నీ నగరులలో క్షేమమును ఉండును గాక",
      "Interceding for the peace of Jerusalem invokes divine prosperity, seeking the welfare of God's historic and future covenant city.",
      "దేవుని నగరమైన యెరూషలేము సమాధానముకొరకు ప్రార్థించే భక్తులు దేవునిచేత వర్ధిల్లజేయబడుదురు."
    ],
    [
      "Proverbs 3:1-2 the longevity of keeping commandments: 'My son, do not forget my law... for length of days and long life and peace they will add to you'",
      "సామెతలు 3:1-2 ఆజ్ఞల పాలన తెచ్చు శాంతి: 'నా కుమారుడా, నా ఉపదేశమును మరవకుము... అవి దీర్ఘాయువును జీవముగల సంవత్సరములను సమాధానమును నీకు విస్తరింపజేయును'",
      "Proverbs 3:1-2",
      "My son, do not forget my law, but let your heart keep my commands; for length of days and long life and peace they will add to you",
      "నా కుమారుడా, నా ఉపదేశమును మరవకుము, నా ఆజ్ఞలను నీ హృదయమందు గైకొనుము; అవి దీర్ఘాయువును జీవముగల సంవత్సరములను సమాధానమును నీకు విస్తరింపజేయును",
      "Internalizing wisdom's precepts reduces stress, protects from reckless living, and multiplies healthy, peaceful years.",
      "దేవుని ఆజ్ఞలను హృదయములో దాచుకొని విధేయత చూపుట ఆయురారోగ్యములను మరియు విస్తారమైన సమాధానమును ప్రసాదించును."
    ],
    [
      "Proverbs 3:17 wisdom's pleasant landscape: 'Her ways are ways of pleasantness, and all her paths are peace'",
      "సామెతలు 3:17 జ్ఞానమార్గపు ప్రశాంతత: 'దాని మార్గములు రమ్యమైన మార్గములు, దాని త్రోవలన్నియు సమాధానకరములు'",
      "Proverbs 3:17",
      "Her ways are ways of pleasantness, and all her paths are peace",
      "దాని మార్గములు రమ్యమైన మార్గములు, దాని త్రోవలన్నియు సమాధానకరములు; దాని నవలంబించువారికి అది జీవవృక్షము",
      "Walking in divine wisdom steers clear of interpersonal drama, deceitful shortcuts, and regret, maintaining a pathway of calm delight.",
      "దేవుని జ్ఞానమును అనుసరించి నడుచువారి జీవిత మార్గములన్నియు రమ్యముగాను నిత్య సమాధానకరముగాను ఉండును."
    ],
    [
      "Proverbs 12:20 contrasting malice and conciliation: 'Deceit is in the heart of those who devise evil, but counselors of peace have joy'",
      "సామెతలు 12:20 సమాధానకర్తల ఆనందము: 'కీడు కల్పించువారి హృదయములో కపటమున్నది, సమాధానమును ఆలోచించువారికి సంతోషము కలుగును'",
      "Proverbs 12:20",
      "Deceit is in the heart of those who devise evil, but counselors of peace have joy",
      "కీడు కల్పించువారి హృదయములో కపటమున్నది, సమాధానమును ఆలోచించువారికి సంతోషము కలుగును",
      "Scheming conflict rots the inner life with deceit, whereas advocating reconciliation and peace generates authentic, overflowing joy.",
      "కుట్రలు పన్నేవారిలో మోసముండును; సమాధానమును ఆలోచించి సమాధానపరచువారి హృదయములో పరలోక ఆనందము ఉప్పొంగును."
    ],
    [
      "Proverbs 16:7 disarming enemies through righteousness: 'When a man's ways please the Lord, He makes even his enemies to be at peace with him'",
      "సామెతలు 16:7 శత్రువులను సమాధానపరచు దేవుడు: 'ఒకని ప్రవర్తన యెహోవాకు ప్రీతికరమగునప్పుడు ఆయన వాని శత్రువులను సహా వానికి మిత్రులుగా (సమాధానముగా) చేయును'",
      "Proverbs 16:7",
      "When a man's ways please the Lord, He makes even his enemies to be at peace with him",
      "ఒకని ప్రవర్తన యెహోవాకు ప్రీతికరమగునప్పుడు ఆయన వాని శత్రువులను సహా వానికి మిత్రులుగా చేయును",
      "The shortest route to resolving external hostility is vertical pleasing of God, who sovereignly inclines hostile hearts toward peace.",
      "మన జీవితము దేవునికి ఇష్టముగా ఉన్నప్పుడు మన శత్రువుల హృదయములను సైతం దేవుడు సమాధానమువైపు త్రిప్పును."
    ],
    [
      "Isaiah 32:17 the quiet fruit of righteousness: 'The work of righteousness will be peace, and the effect of righteousness, quietness and assurance forever'",
      "యెషయా 32:17 నీతి తెచ్చు నిత్య నెమ్మది: 'నీతి సమాధానమును కలుగజేయును, నీతివలన నిత్యమైన నిమ్మళమును నిబ్బరమును కలుగును'",
      "Isaiah 32:17",
      "The work of righteousness will be peace, and the effect of righteousness, quietness and assurance forever",
      "నీతి సమాధానమును కలుగజేయును, నీతివలన నిత్యమైన నిమ్మళమును నిబ్బరమును కలుగును; నా ప్రజలు సమాధానకరమైన నివాసములలో నివసించెదరు",
      "Peace is never an accident; it is the moral harvest of righteousness, yielding an atmosphere of permanent security and serene assurance.",
      "యథార్థమైన నీతి జీవితము సమాధానమును, నిత్యమైన నిమ్మళమును, కొండవంటి నిబ్బరమును దైవిక ఫలముగా ఇచ్చును."
    ],
    [
      "Isaiah 48:18 the river of missed peace: 'Oh, that you had heeded My commandments! Then your peace would have been like a river, and your righteousness like the waves of the sea'",
      "యెషయా 48:18 నదివలె పారు సమాధానము: 'నీవు నా ఆజ్ఞలను ఆలకించినయెడల ఎంత బాగుండును! అప్పుడు నీ సమాధానము నదివలెను, నీ నీతి సముద్రతరంగములవలెను ఉండును'",
      "Isaiah 48:18",
      "Oh, that you had heeded My commandments! Then your peace would have been like a river, and your righteousness like the waves of the sea",
      "నీవు నా ఆజ్ఞలను ఆలకించినయెడల ఎంత బాగుండును! అప్పుడు నీ సమాధానము నదివలెను, నీ నీతి సముద్రతరంగములవలెను ఉండును",
      "God's poignant lament over disobedient Israel reveals that obedience unleashes an inexhaustible, deep river of uninterrupted peace.",
      "దేవుని ఆజ్ఞలకు విధేయత చూపినయెడల ఆయన ఇచ్చే సమాధానము ఎండిపోని నదివలె నిరంతరము ప్రవహించును."
    ],
    [
      "Isaiah 48:22 and 57:21 the divine boundary on wickedness: ''There is no peace,' says the Lord, 'for the wicked''",
      "యెషయా 48:22, 57:21 భక్తిహీనులకు సమాధానము లేదు: 'భక్తిహీనులకు సమాధానము ఉండదని యెహోవా సెలవిచ్చుచున్నాడు'",
      "Isaiah 48:22",
      "'There is no peace,' says the Lord, 'for the wicked'",
      "భక్తిహీనులకు సమాధానము ఉండదని యెహోవా సెలవిచ్చుచున్నాడు",
      "An unbending spiritual law: those who persist in rebellion against the Creator are structurally barred from experiencing true shalom.",
      "పాపములో తిరుగుబాటులో జీవించు భక్తిహీనులకు నిజమైన సమాధానము ఎన్నడును లభించదు; అది కేవలము దేవునియందే కలదు."
    ],
    [
      "Isaiah 54:10 the unshakeable covenant of peace: ''For the mountains shall depart and the hills be removed, but My kindness shall not depart from you, nor shall My covenant of peace be removed,' says the Lord'",
      "యెషయా 54:10 కదలని సమాధాన నిబంధన: 'పర్వతములు తొలగిపోయినను మెట్టలు తత్తరిల్లినను నా కృప నిన్ను విడిచిపోదు, నా సమాధాన నిబంధన తొలగిపోదు అని దేవుడు సెలవిచ్చుచున్నాడు'",
      "Isaiah 54:10",
      "'For the mountains shall depart and the hills be removed, but My kindness shall not depart from you, nor shall My covenant of peace be removed,' says the Lord who has mercy on you",
      "పర్వతములు తొలగిపోయినను మెట్టలు తత్తరిల్లినను నా కృప నిన్ను విడిచిపోదు, నా సమాధాన నిబంధన తొలగిపోదు అని నీయందు జాలిపడు యెహోవా సెలవిచ్చుచున్నాడు",
      "Geological formations may crumble and dissolve, but God's covenant of peace with His people is ontologically permanent.",
      "కొండలు కదిలిపోయినా పర్వతములు కూలిపోయినా తన ప్రజలతో దేవుడు చేసిన సమాధాన నిబంధన ఎన్నటికిని రద్దుకాదు."
    ],
    [
      "Isaiah 55:12 the joyful exodus of peace: 'For you shall go out with joy, and be led out with peace; the mountains and the hills shall break forth into singing before you'",
      "యెషయా 55:12 శాంతితో కూడిన ప్రయాణము: 'మీరు సంతోషముతో బయలువెళ్లుదురు, సమాధానముతో నడిపింపబడుదురు; పర్వతములును మెట్టలును మీయెదుట ఉత్సాహధ్వని చేయును'",
      "Isaiah 55:12",
      "For you shall go out with joy, and be led out with peace; the mountains and the hills shall break forth into singing before you, and all the trees of the field shall clap their hands",
      "మీరు సంతోషముతో బయలువెళ్లుదురు, సమాధానముతో నడిపింపబడుదురు; పర్వతములును మెట్టలును మీయెదుట ఉత్సాహధ్వని చేయును, పొలములోని చెట్లన్నియు చప్పట్లు కొట్టును",
      "Redeemed pilgrims march through life escorted by joy and peace, while transformed nature bursts into sympathetic celebration.",
      "దేవుని రక్షణ పొందిన విశ్వాసులు సంతోషసమాధానములతో నడిపింపబడగా ప్రకృతి సైతం ఉత్సాహగానము చేయును."
    ],
    [
      "Jeremiah 29:7 seeking the peace of the exile city: 'And seek the peace of the city where I have caused you to be carried away captive, and pray to the Lord for it; for in its peace you will have peace'",
      "యిర్మీయా 29:7 పరదేశ నగర సమాధానము: 'నేను మిమ్మును చెరగా పంపిన పట్టణముయొక్క సమాధానమును కోరి దానికొరకు యెహోవాను ప్రార్థించుడి; దాని సమాధానమువలననే మీకును సమాధానము కలుగును'",
      "Jeremiah 29:7",
      "And seek the peace of the city where I have caused you to be carried away captive, and pray to the Lord for it; for in its peace you will have peace",
      "నేను మిమ్మును చెరగా పంపిన పట్టణముయొక్క సమాధానమును కోరి దానికొరకు యెహోవాను ప్రార్థించుడి; దాని సమాధానమువలననే మీకును సమాధానము కలుగును",
      "Believers embedded in hostile cultural surroundings must actively bless their city and pray for its peace, which secures their own flourishing.",
      "తాము నివసించే దేశపు మరియు నగరపు సమాధానముకొరకు ప్రార్థించి మేలు చేయుట విశ్వాసుల బాధ్యత."
    ],
    [
      "Ezekiel 34:25 promising the pastoral covenant of peace: 'I will make a covenant of peace with them, and cause wild beasts to cease from the land; and they will dwell safely in the wilderness'",
      "యెహెజ్కేలు 34:25 సమాధాన నిబంధన: 'నేను వారితో సమాధాన నిబంధన చేసెదను, దుష్టమృగములను దేశములోనుండి లేకుండా చేసెదను; వారు అరణ్యములో నిర్భయముగా నివసింతురు'",
      "Ezekiel 34:25",
      "I will make a covenant of peace with them, and cause wild beasts to cease from the land; and they will dwell safely in the wilderness and sleep in the woods",
      "నేను వారితో సమాధాన నిబంధన చేసెదను, దుష్టమృగములను దేశములోనుండి లేకుండా చేసెదను; వారు అరణ్యములో నిర్భయముగా నివసించెదరు, అడవులలో నిద్రించెదరు",
      "The Good Shepherd eliminates spiritual predators, guaranteeing safe sleep even in wilderness forests under His covenant of peace.",
      "తన ప్రజలతో సమాధాన నిబంధన చేసి అపాయకరమైన శత్రువులను తొలగించి అరణ్యములో సైతం నిర్భయముగా నివసింపజేయు కాపరి."
    ],
    [
      "Ezekiel 37:26 the eternal sanctuary of peace: 'Moreover I will make a covenant of peace with them, and it shall be an everlasting covenant with them... I will set My sanctuary in their midst forevermore'",
      "యెహెజ్కేలు 37:26 నిత్య సమాధాన నిబంధన: 'నేను వారితో సమాధాన నిబంధన చేసెదను, అది వారికి నిత్య నిబంధనగా ఉండును; నా పరిశుద్ధస్థలమును సదాకాలము వారిమధ్య ఉంచెదను'",
      "Ezekiel 37:26",
      "Moreover I will make a covenant of peace with them, and it shall be an everlasting covenant with them; I will establish them and multiply them, and I will set My sanctuary in their midst forevermore",
      "నేను వారితో సమాధాన నిబంధన చేసెదను, అది వారికి నిత్య నిబంధనగా ఉండును; వారిని స్థిరపరచి విస్తరింపజేసి నా పరిశుద్ధస్థలమును సదాకాలము వారిమధ్య ఉంచెదను",
      "The resurrected dry bones are gathered under King David (Christ), enjoying an indestructible covenant of peace and God's eternal dwelling.",
      "క్రీస్తు ఏలుబడిలో పరిశుద్ధులందరు ఏకమై దేవుని నిత్య సమాధాన నిబంధనలో ఆయన నివాస స్థలముగా నిరంతరము వర్ధిల్లుదురు."
    ],
    [
      "Haggai 2:9 the greater glory bringing peace: 'The glory of this latter temple shall be greater than the former... and in this place I will give peace, says the Lord of hosts'",
      "హగ్గయి 2:9 ఆలయ మహిమ సమాధానము: 'ఈ కడపటి మందిరపు మహిమ మునుపటిదానికంటె అధికమగును; ఈ స్థలమందు నేను సమాధానము కలుగజేసెదను అని సైన్యములకధిపతియైన యెహోవా సెలవిచ్చుచున్నాడు'",
      "Haggai 2:9",
      "'The glory of this latter temple shall be greater than the former,' says the Lord of hosts. 'And in this place I will give peace,' says the Lord of hosts",
      "ఈ కడపటి మందిరపు మహిమ మునుపటిదానికంటె అధికమగును అని సైన్యములకధిపతియైన యెహోవా సెలవిచ్చుచున్నాడు; ఈ స్థలమందు నేను సమాధానము కలుగజేసెదను",
      "The Second Temple's glory eclipsed Solomon's because the Prince of Peace Himself walked its courts, proclaiming reconciliation.",
      "క్రీస్తు ప్రభువే స్వయముగా వచ్చి నిలబడుటవలన ఆ ఆలయమునకు గొప్ప మహిమయు సమాధానమును లభించెను."
    ],
    [
      "Zechariah 6:12-13 the counsel of peace between royal Branch and Priest: 'He shall build the temple of the Lord... and the counsel of peace shall be between them both'",
      "జెకర్యా 6:12-13 రాజ-యాజక సమాధానము: 'చిగురు అను ఒకడు కలడు; అతడు యెహోవా ఆలయమును కట్టును, ఆయన సింహాసనాసీనుడై యాజకుడగును, ఈ రెండు పదవులమధ్య సమాధానపు ఆలోచన ఉండును'",
      "Zechariah 6:12-13",
      "Behold, the Man whose name is the BRANCH!... He shall build the temple of the Lord. He shall bear the glory, and shall sit and rule on His throne; so He shall be a priest on His throne, and the counsel of peace shall be between them both",
      "ఇదిగో చిగురు అను ఒకడు కలడు; అతడు తన స్థలములోనుండి చిగుర్చును, అతడు యెహోవా ఆలయమును కట్టును... సింహాసనాసీనుడై యాజకుడగును, ఈ రెండు పదవులమధ్య సమాధానపు ఆలోచన ఉండును",
      "Christ harmonizes the royal sceptre and the priestly altar in His own person, executing the divine counsel of eternal peace.",
      "క్రీస్తు ప్రభువు రాజరికమును ప్రధానయాజకత్వమును తనయందే ఏకము చేసి సింహాసనముపై నిత్య సమాధానమును స్థాపించెను."
    ],
    [
      "Zechariah 9:9-10 the humble King speaking peace to the nations: 'Behold, your King is coming to you... He shall speak peace to the nations; His dominion shall be from sea to sea'",
      "జెకర్యా 9:9-10 గాడిదపిల్లను ఎక్కివచ్చిన సమాధాన రాజు: 'ఇదిగో నీ రాజు నీతిమంతుడును రక్షణగలవాడునై గాడిదపిల్లమీద కూర్చుండి నీయొద్దకు వచ్చుచున్నాడు; ఆయన అన్యజనులకు సమాధానము ప్రకటించును'",
      "Zechariah 9:9-10",
      "Rejoice greatly, O daughter of Zion!... Behold, your King is coming to you; He is just and having salvation, lowly and riding on a donkey... He shall speak peace to the nations; His dominion shall be from sea to sea",
      "సీయోను కుమారీ, బహుగా సంతోషించుము; ఇదిగో నీ రాజు నీతిమంతుడును రక్షణగలవాడును దీనుడునై గాడిదపిల్లమీద కూర్చుండి నీయొద్దకు వచ్చుచున్నాడు... ఆయన అన్యజనులకు సమాధానము ప్రకటించును, ఆయన పరిపాలన సముద్రమునుండి సముద్రమువరకు వ్యాపించును",
      "Riding on a gentle colt rather than a warhorse, King Jesus banishes chariots and proclaims peace to all Gentile nations.",
      "యుద్ధ రథములను విరిచివేసి దీనమనస్సుతో గాడిదపిల్లపై వచ్చి సర్వలోకమునకు సమాధానమును ప్రకటించిన మన రక్షకుడు."
    ],
    [
      "Luke 1:78-79 the Dayspring guiding our feet: 'Through the tender mercy of our God, with which the Dayspring from on high has visited us... to guide our feet into the way of peace'",
      "లూకా 1:78-79 అరుణోదయపు మార్గదర్శకత్వము: 'మన దేవుని వాత్సల్యతనుబట్టి పైనుండి అరుణోదయము మనలను దర్శించెను; మన పాదములను సమాధాన మార్గములోనికి నడిపించును'",
      "Luke 1:78-79",
      "Through the tender mercy of our God, with which the Dayspring from on high has visited us; to give light to those who sit in darkness and the shadow of death, to guide our feet into the way of peace",
      "చీకటిలోను మరణచ్ఛాయలోను కూర్చుండువారికి వెలుగిచ్చుటకును, మన పాదములను సమాధానమార్గములోనికి నడిపించుటకును, మన దేవుని మహావాత్సల్యమునుబట్టి పైనుండి అరుణోదయము మనలను దర్శించెను",
      "Christ the Sunrise pierces the gloom of death's shadow, gently steering wandering human steps into the luminous pathway of peace.",
      "చీకటిలో ఉన్నవారికి పరలోకపు వెలుగునిచ్చి మన పాదములను నిత్య సమాధాన మార్గములోనికి నడిపించిన యేసుక్రీస్తు అరుణోదయము."
    ],
    [
      "Luke 7:50 Jesus dismissing the weeping sinful woman: 'Your faith has saved you. Go in peace'",
      "లూకా 7:50 కన్నీటితో పాదములు కడిగిన స్త్రీతో యేసు పలికిన మాట: 'నీ విశ్వాసము నిన్ను రక్షించెను, సమాధానము గలదానవై పొమ్ము'",
      "Luke 7:50",
      "Then He said to the woman, 'Your faith has saved you. Go in peace'",
      "అప్పుడాయన ఆ స్త్రీని చూచి-నీ విశ్వాసము నిన్ను రక్షించెను, సమాధానము గలదానవై పొమ్మనెను",
      "Sins forgiven and public shame washed away by grace; faith in Jesus dismisses the formerly outcast soul into untroubled shalom.",
      "పశ్చాత్తాపముతో పాదములను కడిగిన పాపాత్మురాలికి సమస్త క్షమాపణను అనుగ్రహించి సమాధానముతో సాగనంపిన యేసు ప్రేమ."
    ],
    [
      "Luke 8:48 Jesus healing the woman with the flow of blood: 'Daughter, be of good cheer; your faith has made you well. Go in peace'",
      "లూకా 8:48 రక్తస్రావ రోగముగల స్త్రీతో యేసు సంభాషణ: 'కుమారీ, ధైర్యము తెచ్చుకొనుము, నీ విశ్వాసము నిన్ను స్వస్థపరచెను; సమాధానము గలదానవై పొమ్ము'",
      "Luke 8:48",
      "And He said to her, 'Daughter, be of good cheer; your faith has made you well. Go in peace'",
      "అందుకాయన-కుమారీ, ధైర్యము తెచ్చుకొనుము; నీ విశ్వాసము నిన్ను స్వస్థపరచెను, సమాధానము గలదానవై పొమ్మని ఆమెతో చెప్పెను",
      "Twelve years of chronic agony and social exclusion terminated in one touch; Christ calls her 'Daughter' and commissions her to live in peace.",
      "పన్నెండేండ్ల వ్యాధిబాధనుండి సంపూర్ణ విడుదలనిచ్చి 'కుమారీ, సమాధానము గలదానవై పొమ్ము' అని పలికిన పరమ వైద్యుడైన యేసు."
    ],
    [
      "Luke 19:41-42 Jesus weeping over Jerusalem's blindness: 'If you had known, even you, especially in this your day, the things that make for your peace!'",
      "లూకా 19:41-42 యెరూషలేమును చూచి యేసు కన్నీరు కార్చుట: 'ఈ దినమందైనను సమాధానకరమైన సంగతులను నీవు తెలిసికొనినయెడల ఎంత బాగుండును!'",
      "Luke 19:41-42",
      "Now as He drew near, He saw the city and wept over it, saying, 'If you had known, even you, especially in this your day, the things that make for your peace! But now they are hidden from your eyes'",
      "ఆయన సమీపించినప్పుడు ఆ పట్టణమును చూచి దాని విషయమై ఏడ్చి-ఈ దినమందైనను సమాధానసంబంధమైన సంగతులను నీవు తెలిసికొనినయెడల ఎంత బాగుండును! ఇప్పుడైతే అవి నీ కన్నులకు మరుగుచేయబడియున్నవి",
      "The tragic pathos of rejected grace: Jerusalem missed her messianic visitation, blind to the true foundations of spiritual peace.",
      "తనను రక్షించుటకు వచ్చిన సమాధానకర్తయైన మెస్సీయను తిరస్కరించి నాశనములోనికి వెళ్లిన నగరమును చూచి యేసు విలపించెను."
    ],
    [
      "Romans 1:7 the apostolic greeting of grace and peace: 'Grace to you and peace from God our Father and the Lord Jesus Christ'",
      "రోమీయులకు 1:7 అపొస్తలుని దీవెన: 'మన తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు కృపయు సమాధానమును మీకు కలుగును గాక'",
      "Romans 1:7",
      "To all who are in Rome, beloved of God, called to be saints: Grace to you and peace from God our Father and the Lord Jesus Christ",
      "రోమాలో ఉన్న దేవుని ప్రియులకందరికి, పరిశుద్ధులుగా ఉండుటకు పిలువబడినవారికందరికి శుభమని చెప్పి వ్రాయునది: మన తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు కృపయు సమాధానమును మీకు కలుగును గాక",
      "Grace is the fountain and peace is the river; true shalom always flows immediately from unmerited divine favor.",
      "కృప అనేది ఊటయైతే సమాధానము దానినుండి ప్రవహించే నది; దేవుని ఉచిత కృపనుండి మాత్రమే నిజమైన శాంతి కలుగును."
    ],
    [
      "Romans 8:6 the mind set on the Spirit: 'For to be carnally minded is death, but to be spiritually minded is life and peace'",
      "రోమీయులకు 8:6 ఆత్మానుసారమైన మనస్సు: 'శరీరానుసారమైన మనస్సు మరణము, ఆత్మానుసారమైన మనస్సు జీవమును సమాధానమునై యున్నది'",
      "Romans 8:6",
      "For to be carnally minded is death, but to be spiritually minded is life and peace",
      "శరీరానుసారమైన మనస్సు మరణము; ఆత్మానుసారమైన మనస్సు జీవమును సమాధానమునై యున్నది",
      "Setting the mind on the Holy Spirit creates an interior ecosystem saturated with eternal vitality and tranquil peace.",
      "శరీరాశలను విడిచి పరిశుద్ధాత్మ ఆలోచనలను కలిగియుండుట ఆత్మకు నిత్య జీవమును మరియు పరిపూర్ణ సమాధానమును ఇచ్చును."
    ],
    [
      "Romans 15:33 the parting benediction of the God of peace: 'Now the God of peace be with you all. Amen'",
      "రోమీయులకు 15:33 సమాధానకర్తయైన దేవుని దీవెన: 'సమాధానకర్తయగు దేవుడు మీకందరికి తోడైయుండును గాక. ఆమేన్'",
      "Romans 15:33",
      "Now the God of peace be with you all. Amen",
      "సమాధానకర్తయగు దేవుడు మీకందరికి తోడైయుండును గాక. ఆమేన్",
      "Paul seals his theological masterwork with the guarantee that the Author of peace Himself abides with every believer.",
      "సమాధానమునకు మూలమైన దేవుడే నిరంతరము మనకు తోడైయుండునను ఆశీర్వాదముతో పౌలు తన పత్రికను ముగించెను."
    ]
  ];

  return data.map(item => ({
    easyQ: `What scriptural doctrine or promise of divine shalom is revealed regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన బోధ లేదా సమాధాన వాగ్దానమేమి?`,
    medQ: `According to ${item[2]}, how does God's peace guard the heart, reconcile enemies, and transform human relationships?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం దేవుని సమాధానము హృదయములను ఎలా కాపాడును మరియు విరోధములను ఎలా తొలగించును?`,
    hardQ: `What theological reality does ${item[2]} establish regarding justification, Christology, and the eternal reign of peace?`,
    hardQTe: `${item[2]} ప్రకారం క్రీస్తు సిలువ బలియాగము మరియు దేవునితో నిత్య సమాధానమును గూర్చి విశ్వాసులు ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty stone towers along the borders of Moab", "He demanded sixty silver talents from the governors of Damascus", "He ordered thirty days of fasting within the temple precincts"],
    optionsTelugu: [item[4], "మోయాబు సరిహద్దుల వెంబడి నలభై రాతి గోపురములను నిర్మించెను", "దమస్కు గవర్నర్లనుండి అరవై వెండి తలాంతులను డిమాండ్ చేసెను", "దేవాలయ ప్రాంగణములో ముప్పది దినముల ఉపవాసమును ఆజ్ఞాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Growth Facts for Peace (Old & New Testament practical peacemaking, personal serenity, wisdom of shalom)
function buildPeaceGrowth() {
  const data = [
    ["Genesis 26:28-29 Abimelech seeking a covenant of peace with Isaac because the Lord was with him", "ఆదికాండము 26:28-29 యెహోవా ఇస్సాకునకు తోడైయుండుట చూచి అబీమెలెకు అతనితో సమాధాన నిబంధన చేసికొనుట", "Genesis 26:29", "\"That you will do us no harm, since we have not touched you, and since we have done nothing to you but good and have sent you away in peace. You are now the blessed of the Lord\"", "\"మేము నిన్ను ముట్టక నీకు మేలే చేసి సమాధానముగా నిన్ను పంపివేసినట్టు, నీవును మాకు కీడు చేయకుండునట్లు మనమధ్య... నిబంధన చేసికొందము; నీవు యెహోవా ఆశీర్వాదము పొందినవాడవు\"", "God's blessing on a peaceful man compels even envious hostile neighbors to seek formal reconciliation.", "ఇస్సాకు శాంతస్వభావమును దేవుని ఆశీర్వాదమును చూచిన శత్రువులు స్వయముగా వచ్చి సమాధానపడిరి."],
    ["Leviticus 26:6 promising national peace: 'I will give peace in the land, and you shall lie down, and none will make you afraid'", "లేవీయకాండము 26:6 దేశములో సమాధాన వాగ్దానము: 'దేశములో నేను సమాధానము కలుగజేసెదను; మీరు పండుకొనునప్పుడు ఎవడును మిమ్మును భయపెట్టడు'", "Leviticus 26:6", "\"I will give peace in the land, and you shall lie down, and none will make you afraid; I will rid the land of evil beasts, and the sword will not go through your land\"", "\"దేశములో నేను సమాధానము కలుగజేసెదను, మీరు పండుకొనునప్పుడు ఎవడును మిమ్మును భయపెట్టడు; దుష్టమృగములు దేశములో నుండకుండ చేసెదను, ఖడ్గము మీ దేశములోనికి రాదు\"", "Covenant obedience yields uninterrupted domestic serenity and national immunity from invasion.", "దేవుని ఆజ్ఞలకు లోబడినప్పుడు దేశములో యుద్ధ భయములు లేకుండ ప్రజలు నెమ్మదిగా నిద్రించెదరు."],
    ["Judges 6:23-24 Gideon building an altar and naming it Yahweh-Shalom: 'The Lord is Peace'", "న్యాయాధిపతులు 6:23-24 గిద్యోను బలిపీఠము కట్టి దానికి 'యెహోవా షాలోమ్' (యెహోవా సమాధానకర్త) అని పేరు పెట్టుట", "Judges 6:24", "\"So Gideon built an altar there to the Lord, and called it The-Lord-Is-Peace. To this day it is still in Ophrah of the Abiezrites\"", "\"గిద్యోను అక్కడ యెహోవాకు బలిపీఠము కట్టి దానికి యెహోవా షాలోము అను పేరు పెట్టెను; నేటివరకు అది అబీయెజ్రీయుల ఒఫ్రాలో ఉన్నది\"", "Encountering the holy God who pardons and calms terror leads to naming Him as the source of our Peace.", "దేవదూతను చూచి భయపడిన గిద్యోనుకు దేవుడు శాంతిని ప్రసాదింపగా అతడు 'యెహోవా షాలోమ్' అని ఆరాధించెను."],
    ["1 Samuel 25:6 David sending a greeting of comprehensive shalom to Nabal: 'Peace be to you, peace to your house, and peace to all that you have!'", "1 సమూయేలు 25:6 దావీదు నాబాలునకు పంపిన త్రివిధ సమాధాన శుభములు: 'నీకును నీ యింటివారికిని నీకు కలిగిన సమస్తమునకును సమాధానము కలుగును గాక'", "1 Samuel 25:6", "\"And thus you shall say to him who lives in prosperity: 'Peace to you, peace to your house, and peace to all that you have!'\"", "\"సమృద్ధిగా బ్రదుకుచున్న వానితో మీరు ఇట్లనుడి-నీకును నీ యింటివారికిని నీకు కలిగిన సమస్తమునకును క్షేమము (సమాధానము) కలుగును గాక\"", "The traditional Hebrew blessing speaks holistic shalom over person, household, and stewardship.", "వ్యక్తిగత జీవితమునకు, కుటుంబమునకు మరియు సమస్త సంపదకు పరిపూర్ణ దైవిక సమాధానమును కోరుట."],
    ["1 Kings 4:24-25 Solomon's golden age of peace: 'He had peace on every side all around him. And Judah and Israel dwelt safely, each man under his vine and his fig tree'", "1 రాజులు 4:24-25 సొలొమోను కాలమందలి నిత్య సమాధానము: 'అతని చుట్టునున్న దేశములన్నిటిలో అతనికి సమాధానముండెను; ప్రతివాడును తన ద్రాక్షచెట్టుక్రిందను అంజూరపు చెట్టుక్రిందను నిర్భయముగా నివసించెను'", "1 Kings 4:25", "\"And Judah and Israel dwelt safely, each man under his vine and his fig tree, from Dan as far as Beersheba, all the days of Solomon\"", "\"సొలొమోను దినములన్నిటను దాను మొదలుకొని బేర్షెబావరకు యూదావారును ఇశ్రాయేలువారందరును తమ తమ ద్రాక్షచెట్లక్రిందను అంజూరపు చెట్లక్రిందను నిర్భయముగా నివసించిరి\"", "The peaceful reign of Solomon prefigures the cosmic tranquility of Christ's millennial kingdom.", "యుద్ధములు లేకుండ ప్రతివాడు తన ద్రాక్షచెట్టు క్రింద సమాధానముతో నివసించిన సొలొమోను శాంతికాలము."],
    ["1 Chronicles 22:9 God naming Solomon: 'His name shall be Solomon, for I will give peace and quietness to Israel in his days'", "1 దినవృత్తాంతములు 22:9 సొలొమోను నామకరణము: 'అతనికి సొలొమోను అను పేరు పెట్టుదువు; అతని దినములలో నేను ఇశ్రాయేలునకు సమాధానమును నెమ్మదిని కలుగజేసెదను'", "1 Chronicles 22:9", "\"Behold, a son shall be born to you, who shall be a man of rest; and I will give him rest from all his enemies all around. His name shall be Solomon, for I will give peace and quietness to Israel in his days\"", "\"ఇదిగో నీకు ఒక కుమారుడు పుట్టును, అతడు సమాధానకర్తయై యుండును; అతని చుట్టునున్న అతని శత్రువులనందరిని అణచి అతనికి నెమ్మది కలుగజేసెదను. అతని పేరు సొలొమోను, అతని దినములలో నేను ఇశ్రాయేలునకు సమాధానమును నెమ్మదిని అనుగ్రహించెదను\"", "The temple of God could not be built by David the man of war, but by Solomon the man of rest and peace.", "యుద్ధములు చేసిన దావీదు కాక సమాధానకర్తయైన సొలొమోను దేవుని మందిరమును కట్టుటకు నియమింపబడెను."],
    ["Job 22:21 Eliphaz's wise counsel: 'Now acquaint yourself with Him, and be at peace; thereby good will come to you'", "యోబు 22:21 'ఆయనతో సహవాసము చేసి సమాధానపడి యుండుము, అప్పుడు నీకు మేలు కలుగును'", "Job 22:21", "\"Now acquaint yourself with Him, and be at peace; thereby good will come to you. Receive, please, instruction from His mouth\"", "\"ఆయనతో సహవాసము చేసి సమాధానపడి యుండుము, అప్పుడు నీకు మేలు కలుగును; ఆయన నోటినుండి ఉపదేశమును స్వీకరించుము\"", "Intimate acquaintance and reconciliation with God is the fountainhead from which all genuine well-being flows.", "దేవునితో సత్సంబంధము కలిగి ఆయనతో సమాధానపడుటయే జీవితములో సమస్త మేలులకు దారితీయును."],
    ["Psalm 37:11 on the meek inheriting the earth and delighting in the abundance of peace", "కీర్తన 37:11 దీనులు భూమిని స్వతంత్రించుకొని విస్తారమైన సమాధానమందు సంతోషించుదురు", "Psalm 37:11", "\"But the meek shall inherit the earth, and shall delight themselves in the abundance of peace\"", "\"దీనులు భూమిని స్వతంత్రించుకొందురు, బహుగా విస్తరించిన సమాధానమందు ఆనందించుదురు\"", "Gentleness triumphs over aggressive arrogance; the meek enjoy the inexhaustible wealth of shalom.", "సాత్వికముగలవారు శాంతితో భూమిని ఏలుచూ దేవుడిచ్చే విస్తారమైన సమాధానమందు ఆనందింతురు."],
    ["Psalm 72:3 praying for the messianic reign: 'The mountains will bring peace to the people, and the little hills, by righteousness'", "కీర్తన 72:3 మెస్సీయ రాజ్య ప్రార్థన: 'నీతినిబట్టి పర్వతములును మెట్టలును ప్రజలకు సమాధానము తెచ్చును గాక'", "Psalm 72:3", "\"The mountains will bring peace to the people, and the little hills, by righteousness\"", "\"నీతినిబట్టి పర్వతములును మెట్టలును ప్రజలకు సమాధానము తెచ్చును గాక; ఆయన ప్రజలలోని దీనులకు న్యాయము తీర్చును\"", "Righteous governance produces ecological and political peace flowing across every mountain peak.", "క్రీస్తు నీతిగల పరిపాలనలో సర్వ సృష్టి మరియు పర్వతములు ప్రజలకు సమాధానమును ఫలించును."],
    ["Psalm 72:7 on in His days the righteous flourishing, and abundance of peace, until the moon is no more", "కీర్తన 72:7 చంద్రుడున్నంతవరకు విస్తారమైన సమాధానము: 'ఆయన దినములలో నీతిమంతులు వర్ధిల్లుదురు, చంద్రుడున్నంతవరకు సమాధానము విస్తరించును'", "Psalm 72:7", "\"In His days the righteous shall flourish, and abundance of peace, until the moon is no more\"", "\"ఆయన దినములలో నీతిమంతులు వర్ధిల్లుదురు, చంద్రుడున్నంతవరకు సమాధానము విస్తరించును; సముద్రమునుండి సముద్రమువరకు ఆయన రాజ్యమేలును\"", "Messianic peace is as enduring as the astronomical cycles of the moon, filling the earth.", "క్రీస్తు రాజ్యములో నీతిమంతులు వర్ధిల్లుదురు; యుగయుగములు సమాధానము సమృద్ధిగా ప్రవహించును."],
    ["Psalm 120:6-7 the lament of a peace-lover in hostile society: 'My soul has dwelt too long with one who hates peace. I am for peace; but when I speak, they are for war'", "కీర్తన 120:6-7 సమాధానప్రియుని ఆర్తనాదము: 'సమాధానమును ద్వేషించువారిమధ్య నా ప్రాణము బహుకాలము నివసించెను; నేను సమాధానమునే కోరుచున్నాను, అయినను నేను మాట్లాడినప్పుడు వారు యుద్ధమునకు సిద్ధపడుదురు'", "Psalm 120:7", "\"I am for peace; but when I speak, they are for war\"", "\"నేను సమాధానమునే కోరుచున్నాను; అయితే నేను మాటలాడగానే వారు యుద్ధమునకు సిద్ధపడుదురు\"", "The godly pilgrim longs for shalom in a world that weaponizes communication for conflict.", "లోకము కలహములను యుద్ధములను కోరినను భక్తుడు ఎల్లప్పుడూ సమాధానమునే కోరి జీవించును."],
    ["Psalm 125:5 the concluding blessing on God's chosen nation: 'Peace be upon Israel!'", "కీర్తన 125:5 ఇశ్రాయేలుపై సమాధాన ఆశీర్వాదము: 'ఇశ్రాయేలుమీద సమాధానముండును గాక'", "Psalm 125:5", "\"As for such as turn aside to their crooked ways, the Lord shall lead them away with the workers of iniquity. Peace be upon Israel!\"", "\"తమ వంకర త్రోవలలోనికి తొలగిపోవువారిని దుష్కార్యములు చేయువారితోకూడ యెహోవా కొనిపోవును; ఇశ్రాయేలుమీద సమాధానముండును గాక!\"", "After judging hypocritical apostates, God seals the covenant community with perpetual shalom.", "దుర్మార్గులు నిర్మూలమైన తరువాత దేవుని నిజమైన ప్రజలపై ఆయన సమాధానము నిరంతరము నిలుచును."],
    ["Psalm 128:6 the multi-generational blessing: 'Yes, may you see your children's children. Peace be upon Israel!'", "కీర్తన 128:6 తరతరముల దీవెన: 'నీ పిల్లల పిల్లలను నీవు చూచెదవు గాక! ఇశ్రాయేలుమీద సమాధానముండును గాక!'", "Psalm 128:6", "\"Yes, may you see your children's children. Peace be upon Israel!\"", "\"నీవు నీ పిల్లల పిల్లలను చూచెదవు గాక! ఇశ్రాయేలుమీద సమాధానముండును గాక!\"", "Family fruitfulness across three generations culminates in the comprehensive peace of God's people.", "సంతానాభివృద్ధితోపాటు దేవుని సమాధానము తరతరములు కుటుంబములపై నిలుచును."],
    ["Proverbs 17:1 on better is a dry morsel with quietness, than a house full of feasting with strife", "సామెతలు 17:1 కలహములేని పేదరికపు మేలు: 'కలహముతో కూడిన విందుభోజనముకంటె నెమ్మదితో కూడిన యెండిన రొట్టెముక్క తినుట శ్రేష్ఠము'", "Proverbs 17:1", "\"Better is a dry morsel with quietness, than a house full of feasting with strife\"", "\"కలహముతో కూడిన విందుభోజనముకంటె నెమ్మదితో కూడిన యెండిన రొట్టెముక్క తినుట శ్రేష్ఠము\"", "Domestic tranquility outweighs culinary luxury; dry bread in peaceful love is sweeter than prime beef amidst screaming arguments.", "కలహములు నిండిన ధనవంతుల విందుకంటె శాంతిసమాధానములుగల పేదవారి గృహమే ఎంతో ధన్యమైనది."],
    ["Ecclesiastes 3:8 on a time for everything: 'A time to love, and a time to hate; a time of war, and a time of peace'", "ప్రసంగి 3:8 సమస్తమునకు సమయము కలదు: 'ప్రేమించుటకు సమయము కలదు, ద్వేషించుటకు సమయము కలదు; యుద్ధము చేయుటకు సమయము కలదు, సమాధానపడుటకు సమయము కలదు'", "Ecclesiastes 3:8", "\"A time to love, and a time to hate; a time of war, and a time of peace\"", "\"ప్రేమించుటకు సమయము కలదు, ద్వేషించుటకు సమయము కలదు; యుద్ధము చేయుటకు సమయము కలదు, సమాధానపడుటకు సమయము కలదు\"", "God sovereignly governs the seasons of human history, bringing conflicts to their ordained peaceful conclusion.", "మానవ చరిత్రలో సమస్తమునకు సమయము కలదు; శ్రమల తరువాత సమాధానమును దయచేయువాడు దేవుడే."],
    ["Song of Solomon 8:10 the bride's secure confidence: 'I am a wall, and my breasts like towers; then I became in his eyes as one who found peace'", "పరమగీతము 8:10 ప్రియుని దృష్టిలో సమాధానము పొందుట: 'నేను ప్రాకారమువంటిదానను... అతని దృష్టికి నేను సమాధానము పొందినదాననైతిని'", "Song of Solomon 8:10", "\"I am a wall, and my breasts like towers; then I became in his eyes as one who found peace\"", "\"నేను ప్రాకారమువంటిదానను, నా స్తనములు గోపురములవలె ఉన్నవి; కావున అతని దృష్టికి నేను సమాధానము పొందినదాననైతిని\"", "Spiritual maturity and chastity make the soul in Christ's eyes as one who has found ultimate shalom and favor.", "క్రీస్తుతో ఆత్మీయ ఐక్యతలో సంపూర్ణ సమాధానమును మరియు పరమ ఆనందమును పొందిన వధువు."],
    ["Isaiah 39:8 King Hezekiah receiving Isaiah's judgment prophecy: 'The word of the Lord which you have spoken is good... at least there will be peace and truth in my days'", "యెషయా 39:8 హిజ్కియా రాజు మాట: 'నీవు చెప్పిన యెహోవా వాక్యము మంచిదే... నా దినములలో సమాధానమును సత్యమును ఉండును గదా'", "Isaiah 39:8", "\"So Hezekiah said to Isaiah, 'The word of the Lord which you have spoken is good!' For he said, 'At least there will be peace and truth in my days'\"", "\"అందుకు హిజ్కియా-నీవు చెప్పిన యెహోవా వాక్యము మంచిదే అని యెషయాతో చెప్పెను; ఏలయనగా అతడు-నా దినములలో సమాధానమును సత్యమును ఉండును గదా అనుకొనెను\"", "Even in the shadow of future exile, Hezekiah took comfort in God's immediate grant of peace and truth during his lifetime.", "తీర్పు మాటలలో సైతం దేవుడు తన జీవిత కాలములో సమాధానమును సత్యమును ఇచ్చినందుకు కృతజ్ఞత చూపిన హిజ్కియా."],
    ["Isaiah 45:7 the sovereign Creator declaring: 'I form the light and create darkness, I make peace and create calamity; I, the Lord, do all these things'", "యెషయా 45:7 సర్వాధికారియైన సృష్టికర్త మాట: 'నేను వెలుగును సృజించువాడను, అంధకారమును కలుగజేయువాడను; సమాధానమును కలుగజేయువాడను, కీడును రప్పించువాడను; యెహోవానగు నేనే వీటన్నిటిని చేయువాడను'", "Isaiah 45:7", "\"I form the light and create darkness, I make peace and create calamity; I, the Lord, do all these things\"", "\"నేను వెలుగును సృజించువాడను అంధకారమును కలుగజేయువాడను; సమాధానమును కలుగజేయువాడను కీడును రప్పించువాడను; యెహోవానగు నేనే వీటన్నిటిని చేయువాడను\"", "Absolute divine monotheism: God alone controls cosmic history, orchestrating ultimate peace over all adversity.", "సమస్త సృష్టిపై సర్వాధికారముగల దేవుడే వెలుగును సమాధానమును కలుగజేయు ఏకైక ప్రభువు."],
    ["Isaiah 57:19 creating the fruit of the lips: 'Peace, peace to him who is far off and to him who is near, says the Lord, and I will heal him'", "యెషయా 57:19 దూరస్థులకు సమీపస్థులకు సమాధానము: 'దూరమున ఉన్నవారికిని సమీపమున ఉన్నవారికిని సమాధానము, సమాధానమే కలుగును గాక అని పెదవుల ఫలమును సృజించువాడను నేనే; నేను వారిని స్వస్థపరచెదను'", "Isaiah 57:19", "\"'Peace, peace to him who is far off and to him who is near,' says the Lord, 'and I will heal him'\"", "\"దూరమున ఉన్నవారికిని సమీపమున ఉన్నవారికిని సమాధానము, సమాధానమే కలుగును గాక అని పెదవుల ఫలమును సృజించువాడను నేనే, నేను వారిని స్వస్థపరచెదను అని యెహోవా సెలవిచ్చుచున్నాడు\"", "Double peace proclaimed to Gentile outcasts ('far off') and Jews ('near'), fulfilled when Christ broke down the wall in Ephesians.", "దూరముగా ఉన్న అన్యజనులకును సమీపముగా ఉన్న యూదులకును క్రీస్తుద్వారా పరిపూర్ణ సమాధానమును స్వస్థతను ఇచ్చిన దేవుడు."],
    ["Jeremiah 33:6 promising health and healing: 'Behold, I will bring it health and healing; I will heal them and reveal to them the abundance of peace and truth'", "యిర్మీయా 33:6 నగర పునరుద్ధరణ: 'ఇదిగో నేను ఈ పట్టణమునకు ఆరోగ్యమును స్వస్థతను రప్పించుచున్నాను, వారికి సమృద్ధియైన సమాధానమును సత్యమును బయలుపరచెదను'", "Jeremiah 33:6", "\"Behold, I will bring it health and healing; I will heal them and reveal to them the abundance of peace and truth\"", "\"ఇదిగో నేను ఈ పట్టణమునకు ఆరోగ్యమును స్వస్థతను రప్పించుచున్నాను, వారిని స్వస్థపరచి వారికి సమృద్ధియైన సమాధానమును సత్యమును బయలుపరచెదను\"", "Divine restoration couples physical revitalization with an overflowing revelation of peace and covenant truth.", "శిథిలమైన జీవితములను స్వస్థపరచి సమృద్ధియైన సమాధాన సత్యములతో నింపు దేవుని వాగ్దానము."],
    ["Jeremiah 33:9 Zion becoming a name of joy and praise: 'They shall fear and tremble for all the goodness and all the peace that I provide for it'", "యిర్మీయా 33:9 అన్యజనుల విస్మయము: 'నేను యెరూషలేమునకు కలుగజేయు సమస్త క్షేమమును సమాధానమును చూచి జనులు భయపడి వణకుదురు'", "Jeremiah 33:9", "\"Then it shall be to Me a name of joy, a praise, and an honor before all nations of the earth, who shall hear all the good that I do to them; they shall fear and tremble for all the goodness and all the peace that I provide for it\"", "\"భూమిమీది సమస్త జనములయెదుట అది నాకు సంతోషకరమైన పేరుగాను కీర్తిగాను ఘనతగాను ఉండును; నేను వారికి చేయు సమస్త మేలును సమాధానమును చూచి వారు భయపడి వణకుదురు\"", "The sheer magnitude of God's lavish peace upon His redeemed people will astonish watching pagan nations into reverent awe.", "తన ప్రజలకు దేవుడిచ్చే గొప్ప మేలును సమాధానమును చూచి లోక రాజ్యములు ఆశ్చర్యపడి వణకును."],
    ["Daniel 10:19 the heavenly messenger strengthening Daniel: 'O man greatly beloved, fear not! Peace be to you; be strong, yes, be strong!'", "దానియేలు 10:19 దేవదూత దానియేలును బలపరచుట: 'బహు ప్రియుడా, భయపడకుము; నీకు సమాధానము కలుగును గాక, బలపడుము, ధైర్యము తెచ్చుకొనుము'", "Daniel 10:19", "\"And he said, 'O man greatly beloved, fear not! Peace be to you; be strong, yes, be strong!' So when he spoke to me I was strengthened\"", "\"అతడు-బహు ప్రియుడా, భయపడకుము, నీకు సమాధానము కలుగును గాక, బలపడుము, ధైర్యము తెచ్చుకొనుము అనెను. అతడు నాతో మాటలాడగానే నేను బలపడితిని\"", "Heaven's touch dispels overwhelming spiritual exhaustion; being declared 'greatly beloved' infuses restorative peace and strength.", "పరలోక దూత తాకి 'బహు ప్రియుడా, నీకు సమాధానము కలుగును గాక' అని పలికినప్పుడు అలసిన భక్తుడు నూతన బలమును పొందెను."],
    ["Micah 5:5 the Bethlehem Ruler who will be our peace: 'And this One shall be peace. When the Assyrian comes into our land... He will deliver us'", "మీకా 5:5 బేత్లెహేము పాలకుడైన క్రీస్తే మన సమాధానము: 'ఈయనే మనకు సమాధానకారణమై యుండును; అష్షూరీయుడు మన దేశముమీదికి వచ్చినప్పుడు ఆయన మనలను విడిపించును'", "Micah 5:5", "\"And this One shall be peace. When the Assyrian comes into our land, and when he treads in our palaces, then we will raise against him seven shepherds\"", "\"ఈయనే మనకు సమాధానకారణమై యుండును; అష్షూరీయుడు మన దేశముమీదికి వచ్చినప్పుడు... ఆయన మనలను విడిపించును\"", "The prophecy of the Bethlehem-born Messiah identifies the King Himself as the personal embodiment of our defense and peace.", "బేత్లెహేములో పుట్టిన మెస్సీయయే స్వయముగా మన సమాధానమై యుండి శత్రువుల చేతినుండి విడిపించును."],
    ["Nahum 1:15 the mountain messenger of peace: 'Behold, on the mountains the feet of him who brings good tidings, who proclaims peace! O Judah, keep your appointed feasts'", "నహూము 1:15 సమాధాన సువార్తికుని పాదములు: 'ఇదిగో సువార్త ప్రకటించుచు సమాధానము చాటించువాని పాదములు పర్వతములమీద కనబడుచున్నవి; యూదా, నీ పండుగలను ఆచరించుము'", "Nahum 1:15", "\"Behold, on the mountains the feet of him who brings good tidings, who proclaims peace! O Judah, keep your appointed feasts, perform your vows. For the wicked one shall no more pass through you; he is utterly cut off\"", "\"ఇదిగో సువార్త ప్రకటించుచు సమాధానము చాటించువాని పాదములు పర్వతములమీద కనబడుచున్నవి! యూదా, నీ పండుగలను ఆచరించుము; ఇకమీదట దుర్మార్గుడు నీ మధ్య సంచరింపడు, అతడు నిర్మూలమాయెను\"", "Tyranny is broken; the overthrow of Nineveh releases Judah to celebrate holy feasts in uninterrupted security and peace.", "శత్రువుల హింసలు అంతమాయెననియు సమాధానము వచ్చెననియు పర్వతములపై చాటించిన సువార్త."],
    ["Zechariah 8:16 commanding community integrity: 'Speak each man the truth to his neighbor; give judgment in your gates for truth, justice, and peace'", "జెకర్యా 8:16 సమాజ న్యాయము: 'ప్రతివాడును తన పొరుగువానితో సత్యమే మాటలాడవలెను; మీ గుమ్మములలో సత్యమునుబట్టియు సమాధానమునుబట్టియు న్యాయము తీర్చుడి'", "Zechariah 8:16", "\"These are the things you shall do: Speak each man the truth to his neighbor; give judgment in your gates for truth, justice, and peace\"", "\"మీరు చేయవలసిన కార్యములు ఏవనగా-ప్రతివాడును తన పొరుగువానితో సత్యమే మాటలాడవలెను; సమాధానము కలుగునట్లు మీ గుమ్మములలో సత్యమునుబట్టి న్యాయము తీర్చుడి\"", "Social peace cannot exist in a vacuum of corruption; truthful speech and honest justice are the twin rails of civil peace.", "సత్యము న్యాయము ఉన్నచోటనే సమాజములో నిజమైన సమాధానము నిలుచును."],
    ["Zechariah 8:19 turning fasting into feast days: 'Therefore love truth and peace'", "జెకర్యా 8:19 ఉపవాస దినములు ఉత్సవములుగా మారుట: 'కావున సత్యమును సమాధానమును ప్రేమించుడి'", "Zechariah 8:19", "\"Thus says the Lord of hosts: The fast of the fourth month... shall be joy and gladness and cheerful feasts for the house of Judah. Therefore love truth and peace\"", "\"నాల్గవ నెలలోని ఉపవాసమును... యూదావారికి సంతోషమును ఆనందమును ఉత్సాహకరమైన పండుగదినములుగా ఉండును; కావున సత్యమును సమాధానమును ప్రేమించుడి\"", "Centuries of mourning exile transform into singing celebrations when the people love uncompromised truth and pursue peace.", "దుఃఖపు దినములను సంతోషపు పండుగలుగా మార్చే దేవుని కృపనుబట్టి సత్యమును సమాధానమును ప్రేమించుట."],
    ["Mark 9:50 Jesus commanding the disciples: 'Have salt in yourselves, and have peace with one another'", "మార్కు 9:50 పరస్పర సమాధానము: 'మీలో మీరు ఉప్పుగలవారై యుండి, ఒకరితో ఒకరు సమాధానముగా ఉండుడి'", "Mark 9:50", "\"Salt is good, but if the salt loses its flavor, how will you season it? Have salt in yourselves, and have peace with one another\"", "\"ఉప్పు మంచిదే గాని ఉప్పు నిస్సారమైనయెడల మీరు దేనివలన దానికి సారము కలుగజేతురు? మీలో మీరు ఉప్పుగలవారై యుండి, ఒకరితో ఒకరు సమాధానముగా ఉండుడి\"", "Covenant salt preserves purity and restrains pride, creating the essential soil for fraternal peace among believers.", "ఆత్మీయ స్వచ్ఛతను కాపాడుకొనుచూ సహోదరులమధ్య సమాధానము కలిగియుండుడని యేసు ఇచ్చిన ఆజ్ఞ."],
    ["Luke 10:5-6 the apostolic peace greeting: 'Whatever house you enter, first say, Peace to this house. And if a son of peace is there, your peace will rest on it'", "లూకా 10:5-6 గృహములకు సమాధాన ఆశీర్వాదము: 'మీరు ఏ యింటనైనను ప్రవేశించినప్పుడు-ఈ యింటికి సమాధానము కలుగును గాక అని మొదట చెప్పుడి; సమాధానపాత్రుడు అక్కడ ఉండినయెడల మీ సమాధానము అతనిమీద నిలుచును'", "Luke 10:5-6", "\"Whatever house you enter, first say, 'Peace to this house.' And if a son of peace is there, your peace will rest on it; if not, it will return to you\"", "\"మీరు ఏ యింటనైనను ప్రవేశించినప్పుడు-ఈ యింటికి సమాధానము కలుగును గాక అని మొదట చెప్పుడి; సమాధానపాత్రుడు అక్కడ ఉండినయెడల మీ సమాధానము అతనిమీద నిలుచును, లేనియెడల అది మీయొద్దకు మరల వచ్చును\"", "Apostolic missionaries carry the tangible spiritual currency of peace; receptive homes receive the imparted shalom.", "సువార్త సేవకులు ప్రకటించే దైవిక సమాధానము దానిని స్వీకరించే ప్రతి గృహముపై నిలచి ఆశీర్వదించును."],
    ["Luke 12:51 Jesus' shocking clarification on the dividing nature of truth: 'Do you suppose that I came to give peace on earth? I tell you, not at all, but rather division'", "లూకా 12:51 సత్యము తెచ్చు విభజన: 'నేను భూమిమీద సమాధానము కలుగజేయవచ్చితినని మీరు తలంచుచున్నారా? కాదు, విభేదమునే కలుగజేయవచ్చితినని మీతో చెప్పుచున్నాను'", "Luke 12:51", "\"Do you suppose that I came to give peace on earth? I tell you, not at all, but rather division. For from now on five in one house will be divided\"", "\"నేను భూమిమీద సమాధానము కలుగజేయవచ్చితినని మీరు తలంచుచున్నారా? కాదు, విభేదమునే కలుగజేయవచ్చితినని మీతో చెప్పుచున్నాను; ఇప్పటినుండి ఒక యింట ఐదుగురు వేరుపడి యుందురు\"", "Christ brings ultimate reconciliation with God, but uncompromised gospel allegiance necessarily provokes friction with worldly families.", "క్రీస్తు నిజమైన సమాధానకర్తయైనను, ఆయన సువార్త సత్యమును తిరస్కరించే లోకముతో విభజన తప్పదు."],
    ["Acts 7:26 Moses attempting to reconcile quarreling Hebrews: 'Men, you are brethren; why do you wrong one another?'", "అపొస్తలుల కార్యములు 7:26 మోషే సమాధానపరచుటకు చేసిన ప్రయత్నము: 'అయ్యలారా, మీరు సహోదరులు గదా, ఒకరికొకరు ఎందుకు అన్యాయము చేసికొనుచున్నారు?'", "Acts 7:26", "\"And the next day he appeared to two of them as they were fighting, and tried to reconcile them, saying, 'Men, you are brethren; why do you wrong one another?'\"", "\"మరునాడు వారిలో ఇద్దరు పోట్లాడుచుండగా అతడు వారియొద్దకు వచ్చి-అయ్యలారా, మీరు సహోదరులు గదా, ఒకరికొకరు ఏల అన్యాయము చేసికొనుచున్నారు? అని వారిని సమాధానపరచబోయెను\"", "The instinct of the deliverer is to reconcile brethren; internal fratricidal strife weakens the oppressed community.", "తోటి సహోదరులు కలహించుకొనుటను చూచి సహింపలేక సమాధానపరచుటకు మోషే చేసిన ప్రయత్నము."],
    ["Acts 10:36 the core apostolic kerygma: 'The word which God sent to the children of Israel, preaching peace through Jesus Christ-He is Lord of all'", "అపొస్తలుల కార్యములు 10:36 సువార్త సారాంశము: 'యేసుక్రీస్తుద్వారా సమాధానమను సువార్తను ప్రకటించుచు, దేవుడు ఇశ్రాయేలీయులకు పంపిన వాక్యము ఇదే; ఆయనే అందరికి ప్రభువు'", "Acts 10:36", "\"The word which God sent to the children of Israel, preaching peace through Jesus Christ-He is Lord of all\"", "\"యేసుక్రీస్తుద్వారా సమాధానమను సువార్తను ప్రకటించుచు, దేవుడు ఇశ్రాయేలీయులకు పంపిన వాక్యము మీరెరుగుదురు; ఆయనే అందరికి ప్రభువు\"", "The definitive summary of the New Testament gospel: God proclaims universal peace through the Lordship of Jesus Christ.", "యేసుక్రీస్తు సర్వలోకమునకు ప్రభువై యుండి తన సువార్తద్వారా సమస్త మానవాళికి సమాధానమును ప్రకటించెను."],
    ["Acts 15:33 the council delegates dismissed in peace: 'And after they had stayed there for a time, they were sent back with greetings of peace from the brethren to the apostles'", "అపొస్తలుల కార్యములు 15:33 యెరూషలేము సభ ప్రతినిధులు సమాధానముతో సాగనంపబడుట: 'కొంతకాలము గడిపిన తరువాత సహోదరులు వారిని సమాధానముతో సాగనంపిరి'", "Acts 15:33", "\"And after they had stayed there for a time, they were sent back with greetings of peace from the brethren to the apostles\"", "\"వారు కొంతకాలము అక్కడ గడిపిన తరువాత, తమ్మును పంపిన అపొస్తలులయొద్దకు సహోదరులవలన సమాధానపు శుభములు పొంది సాగనంపబడిరి\"", "Doctrinal controversy resolved by the Spirit results in joyful celebration and fraternal dismissals in peace.", "ధర్మశాస్త్ర వివాదము ముగిసిన తరువాత సంఘములమధ్య సమాధానపు శుభములతో సహవాసము వర్ధిల్లెను."],
    ["Acts 16:36 the Philippian jailer announcing release: 'The magistrates have sent to let you go. Now therefore depart, and go in peace'", "అపొస్తలుల కార్యములు 16:36 ఫిలిప్పీ చెరసాల నాయకుని మాట: 'మిమ్మును విడుదల చేయవలెనని న్యాయాధిపతులు వర్తమానము పంపిరి; కాబట్టి మీరు బయలువెళ్లి సమాధానముగా పొమ్ము'", "Acts 16:36", "\"So the keeper of the prison reported these words to Paul, saying, 'The magistrates have sent to let you go. Now therefore depart, and go in peace'\"", "\"చెరసాల నాయకుడు ఈ మాటలు పౌలునకు తెలిపి-మిమ్మును విడుదల చేయవలెనని న్యాయాధిపతులు వర్తమానము పంపిరి గనుక మీరు బయలువెళ్లి సమాధానముగా పొండనెను\"", "Earthly magistrates locked them in stocks, but God's earthquake opened prison doors, releasing apostles in triumphant peace.", "చెరసాలలో అర్ధరాత్రి కీర్తనలు పాడిన పౌలు సీలలను దేవుడు విడిపించి సమాధానముతో బయటకు నడిపించెను."],
    ["Romans 2:9-10 contrasting wrath and peace: 'Tribulation and anguish, on every soul of man who does evil... but glory, honor, and peace to everyone who works what is good'", "రోమీయులకు 2:9-10 తీర్పు దినమందలి సమాధానము: 'చెడుకార్యములు చేయు ప్రతివానికి శ్రమయు వేదనయు కలుగును; మేలు చేయు ప్రతివానికి మహిమయు ఘనతయు సమాధానమును కలుగును'", "Romans 2:10", "\"Glory, honor, and peace to everyone who works what is good, to the Jew first and also to the Greek. For there is no partiality with God\"", "\"మేలు చేయు ప్రతివానికి, మొదట యూదునికి తరువాత గ్రీసుదేశస్థునికిని మహిమయు ఘనతయు సమాధానమును కలుగును; దేవునికి పక్షపాతము లేదు\"", "Impartial divine retribution rewards those who pursue the good with celestial glory, honor, and uninterrupted peace.", "పక్షపాతములేని దేవుడు మేలు చేయు ప్రతి విశ్వాసికి నిత్య మహిమను ఘనతను సమాధానమును అనుగ్రహించును."],
    ["1 Corinthians 7:15 regarding marriage conflict and desertion: 'God has called us to peace'", "1 కొరింథీయులకు 7:15 కుటుంబ సంబంధములలో దైవిక పిలుపు: 'సమాధానముగా ఉండుటకే దేవుడు మనలను పిలిచియున్నాడు'", "1 Corinthians 7:15", "\"But if the unbeliever departs, let him depart... but God has called us to peace\"", "\"అయితే అవిశ్వాసియైనవాడు వేరుపడిపోయినయెడల వేరుపడవచ్చును... సమాధానముగా ఉండుటకే దేవుడు మనలను పిలిచియున్నాడు\"", "Even in the heartbreak of marital friction and abandonment, God's overriding calling for the believer's life is peace.", "కలహములు విద్వేషములను విడిచి సమాధానముగా జీవించుటకే దేవుడు తన పిల్లలను పిలిచియున్నాడు."],
    ["1 Corinthians 14:33 the divine character in church assemblies: 'For God is not the author of confusion but of peace, as in all the churches of the saints'", "1 కొరింథీయులకు 14:33 సంఘ క్రమము: 'దేవుడు గందరగోళమునకు కర్త కాడు గాని సమాధానమునకే కర్తయై యున్నాడు; పరిశుద్ధుల సంఘములన్నిటిలోను అలాగే ఉన్నది'", "1 Corinthians 14:33", "\"For God is not the author of confusion but of peace, as in all the churches of the saints\"", "\"ఏలయనగా దేవుడు గందరగోళమునకు కర్త కాడు గాని సమాధానమునకే కర్తయై యున్నాడు; పరిశుద్ధుల సంఘములన్నిటిలోను ఈలాగే జరుగుచున్నది\"", "Liturgical pandemonium contradicts God's nature; authentic manifestations of the Spirit generate order and serene peace.", "ఆరాధనలో గందరగోళము దేవుని స్వభావము కాదు; పరిశుద్ధాత్మ నడిపింపు ఎల్లప్పుడు సమాధానమును క్రమమును నిలుపును."],
    ["2 Corinthians 13:11 closing pastoral exhortation: 'Be of good comfort, be of one mind, live in peace; and the God of love and peace will be with you'", "2 కొరింథీయులకు 13:11 పౌలు కడపటి హెచ్చరిక: 'ఆదరణ కలిగియుండుడి, ఏకమనస్సు గలవారై యుండుడి, సమాధానముగా ఉండుడి; అప్పుడు ప్రేమ సమాధానములకు కర్తయగు దేవుడు మీకు తోడైయుండును'", "2 Corinthians 13:11", "\"Finally, brethren, farewell. Become complete. Be of good comfort, be of one mind, live in peace; and the God of love and peace will be with you\"", "\"తుదకు సహోదరులారా, సంతోషించుడి, సంపూర్ణులై యుండుడి, ఆదరణ కలిగియుండుడి, ఏకమనస్సు గలవారై యుండుడి, సమాధానముగా ఉండుడి; అప్పుడు ప్రేమ సమాధానములకు కర్తయగు దేవుడు మీకు తోడైయుండును\"", "Living in communal harmony and peace invites the manifest presence of the God of love and peace into our midst.", "సంఘములో ఏకమనస్సు కలిగి సమాధానముతో జీవించినప్పుడు ప్రేమ సమాధానములకు కర్తయైన దేవుడు నిరంతరము తోడైయుండును."],
    ["Ephesians 4:3 guarding the unity of the church: 'Endeavoring to keep the unity of the Spirit in the bond of peace'", "ఎఫెసీయులకు 4:3 సమాధానమను బంధము: 'సమాధానమను బంధముచేత ఆత్మ కలిగించు ఐక్యతను కాపాడుకొనుటకు శ్రద్ధపడుడి'", "Ephesians 4:3", "\"Endeavoring to keep the unity of the Spirit in the bond of peace. There is one body and one Spirit, just as you were called in one hope of your calling\"", "\"సమాధానమను బంధముచేత ఆత్మ కలిగించు ఐక్యతను కాపాడుకొనుటకు శ్రద్ధపడుడి; ఒకే శరీరమును ఒకే ఆత్మయు ఉన్నవి\"", "Peace is the golden adhesive chain (sundesmos) that binds diverse believers together in indissoluble spiritual unity.", "పరిశుద్ధాత్మ దయచేసిన ఐక్యతను సమాధానమను బలమైన బంధముతో కాపాడుకొనుటకు విశ్వాసులు ప్రయాసపడవలెను."],
    ["Ephesians 6:15 the gospel shoes of spiritual armor: 'And having shod your feet with the preparation of the gospel of peace'", "ఎఫెసీయులకు 6:15 ఆత్మీయ యుద్ధ కవచము: 'సమాధాన సువార్తవలననైన సిద్ధమనస్సను జోడు పాదములకు తొడుగుకొనుడి'", "Ephesians 6:15", "\"And having shod your feet with the preparation of the gospel of peace; above all, taking the shield of faith with which you will be able to quench all the fiery darts of the wicked one\"", "\"సమాధాన సువార్తవలననైన సిద్ధమనస్సను జోడు పాదములకు తొడుగుకొని నిలువబడుడి; ఇవన్నియు గాక విశ్వాసమను డాలును పట్టుకొనుడి\"", "The warrior's stability in demonic combat relies upon feet securely anchored in the peace provided by the gospel.", "సాతానుతో పోరాడుటకు విశ్వాసి పాదములకు సమాధాన సువార్త సిద్ధపాటు అను జోడు ఎంతో అవసరము."],
    ["Philippians 4:9 the presence of the God of peace: 'The things which you learned and received and heard and saw in me, these do, and the God of peace will be with you'", "ఫిలిప్పీయులకు 4:9 పౌలు మాదిరి: 'మీరు నావలన ఏమి నేర్చుకొని అంగీకరించితిరో, నాయందు ఏమి చూచితిరో వాటిని చేయుడి; అప్పుడు సమాధానకర్తయగు దేవుడు మీకు తోడైయుండును'", "Philippians 4:9", "\"The things which you learned and received and heard and saw in me, these do, and the God of peace will be with you\"", "\"మరియు మీరు నావలన ఏమి నేర్చుకొని అంగీకరించితిరో, నాయందు ఏమి వింటిరో ఏమి చూచితిరో, వాటిని చేయుడి; అప్పుడు సమాధానకర్తయగు దేవుడు మీకు తోడైయుండును\"", "Moving from the 'peace of God' in verse 7 to the very 'God of peace' Himself in verse 9 through active obedience.", "అపొస్తలుని సత్ప్రవర్తనను అనుసరించి జీవించినప్పుడు సమాధానకర్తయైన దేవుడే స్వయముగా మనకు తోడైయుండును."],
    ["1 Thessalonians 5:13 on church leaders: 'And to esteem them very highly in love for their work's sake. Be at peace among yourselves'", "1 థెస్సలొనీకయులకు 5:13 సేవకులను సన్మానించుట: 'వారి పనినిబట్టి వారిని ప్రేమతో మిక్కిలి ఘనముగా ఎంచుకొనుడి; మీలో మీరు సమాధానముగా ఉండుడి'", "1 Thessalonians 5:13", "\"And to esteem them very highly in love for their work's sake. Be at peace among yourselves\"", "\"వారి పనినిబట్టి వారిని ప్రేమతో మిక్కిలి ఘనముగా ఎంచుకొనుడి; మీలో మీరు సమాధానముగా ఉండుడి\"", "Respect for spiritual leadership and mutual peace among brethren are the twin engines of church health.", "దేవుని పరిచారకులను ప్రేమతో ఘనపరుస్తూ సహోదరులమధ్య సమాధానము కలిగియుండుట సంఘ క్షేమమునకు మూలము."],
    ["1 Thessalonians 5:23 the sanctifying prayer: 'Now may the God of peace Himself sanctify you completely; and may your whole spirit, soul, and body be preserved blameless'", "1 థెస్సలొనీకయులకు 5:23 సంపూర్ణ పరిశుద్ధత: 'సమాధానకర్తయగు దేవుడు తానే మిమ్మును సంపూర్ణముగా పరిశుద్ధపరచును గాక; మీ ఆత్మయు ప్రాణమును శరీరమును నిర్దోషముగా కాపాడబడును గాక'", "1 Thessalonians 5:23", "\"Now may the God of peace Himself sanctify you completely; and may your whole spirit, soul, and body be preserved blameless at the coming of our Lord Jesus Christ\"", "\"సమాధానకర్తయగు దేవుడు తానే మిమ్మును సంపూర్ణముగా పరిశుద్ధపరచును గాక; మన ప్రభువైన యేసుక్రీస్తు రాకడయందు మీ ఆత్మయు ప్రాణమును శరీరమును కేవలము నిర్దోషముగా ఉండునట్లు కాపాడబడును గాక\"", "Sanctification across tripartite human nature (spirit, soul, body) is accomplished directly by the God of peace.", "సమాధానకర్తయైన దేవుడే మన ఆత్మ ప్రాణ శరీరములను క్రీస్తు రాకడవరకు సంపూర్ణముగా పరిశుద్ధపరచి కాపాడును."],
    ["2 Timothy 2:22 the youthful pursuit: 'Flee also youthful lusts; but pursue righteousness, faith, love, peace with those who call on the Lord out of a pure heart'", "2 తిమోతి 2:22 యౌవనస్థులకు ఆజ్ఞ: 'యౌవనేచ్ఛలనుండి పారిపొమ్ము; పవిత్ర హృదయముతో ప్రభువునకు ప్రార్థించువారితోకూడ నీతిని విశ్వాసమును ప్రేమను సమాధానమును వెంటాడుము'", "2 Timothy 2:22", "\"Flee also youthful lusts; but pursue righteousness, faith, love, peace with those who call on the Lord out of a pure heart\"", "\"నీవు యౌవనేచ్ఛలనుండి పారిపొమ్ము; పవిత్ర హృదయులై ప్రభువునకు ప్రార్థనచేయువారితోకూడ నీతిని విశ్వాసమును ప్రేమను సమాధానమును వెంటాడుము\"", "True peace cannot be pursued in isolation; it must be run after in fellowship with believers pursuing holiness.", "యౌవన పాపములనుండి పారిపోయి పవిత్ర హృదయముతో ప్రభువును వెదకే పరిశుద్ధులతో కలిసి సమాధానమును వెంబడించుట."],
    ["Hebrews 12:14 the indispensable standard of holiness: 'Pursue peace with all people, and holiness, without which no one will see the Lord'", "హెబ్రీయులకు 12:14 ప్రభువును చూచుటకు నియమము: 'అందరితో సమాధానమును పరిశుద్ధతయు కలిగియుండుటకు ప్రయత్నించుడి; పరిశుద్ధత లేకుండ ఎవడును ప్రభువును చూడడు'", "Hebrews 12:14", "\"Pursue peace with all people, and holiness, without which no one will see the Lord\"", "\"అందరితో సమాధానమును పరిశుద్ధతయు కలిగియుండుటకు ప్రయత్నించుడి; పరిశుద్ధత లేకుండ ఎవడును ప్రభువును చూడడు\"", "Pursuing interpersonal peace and vertical holiness is not optional; it is the non-negotiable prerequisite to beholding God.", "అందరితో సమాధానమును దేవునియెదుట పరిశుద్ధతయు లేకుండ ఏ మనుష్యుడును పరలోకమందు ప్రభువును చూడలేడు."],
    ["Hebrews 13:20-21 the covenant doxology of peace: 'Now may the God of peace who brought up our Lord Jesus from the dead... make you complete in every good work'", "హెబ్రీయులకు 13:20-21 సమాధానకర్తయైన దేవుని స్తుతి: 'నిత్యమైన నిబంధన రక్తమునుబట్టి గొఱ్ఱెల గొప్ప కాపరియైన మన ప్రభువైన యేసును మృతులలోనుండి లేపిన సమాధానకర్తయైన దేవుడు మిమ్మును సంపూర్ణులనుగా చేయును గాక'", "Hebrews 13:20", "\"Now may the God of peace who brought up our Lord Jesus from the dead, that great Shepherd of the sheep, through the blood of the everlasting covenant, make you complete in every good work\"", "\"నిత్యమైన నిబంధన రక్తమునుబట్టి గొఱ్ఱెల గొప్ప కాపరియైన యేసు అను మన ప్రభువును మృతులలోనుండి లేపిన సమాధానకర్తయగు దేవుడు... ప్రతి సత్కార్యమందును మిమ్మును సంపూర్ణులనుగా చేయును గాక\"", "The resurrection of Christ from the dead is the cosmic victory of the God of peace, empowering saints for faithful obedience.", "గొఱ్ఱెల కాపరియైన యేసును మృతులలోనుండి లేపిన సమాధానకర్తయైన దేవుడు తన చిత్తము చేయుటకు మనలను సిద్ధపరచును."],
    ["James 2:16 rebuking empty sentimental charity: 'And one of you says to them, Depart in peace, be warmed and filled, but you do not give them the things which are needed for the body, what does it profit?'", "యాకోబు 2:16 క్రియలులేని మాటల ఖండన: 'మీలో ఎవడైనను శరీరమునకు కావలసినవాటిని ఇయ్యక-సమాధానముగా వెళ్లుడి, చలి కాచుకొనుడి, కడుపు నింపుకొనుడని చెప్పినయెడల ఏమి ప్రయోజనము?'", "James 2:16", "\"And one of you says to them, 'Depart in peace, be warmed and filled,' but you do not give them the things which are needed for the body, what does it profit?\"", "\"మీలో ఎవడైనను శరీరమునకు కావలసినవాటిని వారికియ్యక-సమాధానముగా వెళ్లుడి, చలి కాచుకొనుడి, కడుపు నింపుకొనుడని వారితో చెప్పినయెడల ఏమి ప్రయోజనము? అలాగే విశ్వాసము క్రియలు లేనిదైతే మృతమైనది\"", "Pious religious platitudes wishing people peace without meeting physical bread needs is hypocritical and dead.", "ఆకలితో ఉన్నవారికి ఆహారమియ్యక కేవలము 'సమాధానముగా పొమ్ము' అని పలుకుట నిష్ప్రయోజనమైన మృత భక్తి."],
    ["1 Peter 1:2 the Trinitarian multiplication of peace: 'Elect according to the foreknowledge of God the Father... Grace to you and peace be multiplied'", "1 పేతురు 1:2 త్రిత్వ సమాధానాశీర్వాదము: 'తండ్రియైన దేవుని పూర్వజ్ఞానముచొప్పున ఏర్పరచబడినవారికి... కృపయు సమాధానమును మీకు విస్తరించును గాక'", "1 Peter 1:2", "\"Elect according to the foreknowledge of God the Father, in sanctification of the Spirit, for obedience and sprinkling of the blood of Jesus Christ: Grace to you and peace be multiplied\"", "\"తండ్రియైన దేవుని పూర్వజ్ఞానముచొప్పున, ఆత్మవలని పరిశుద్ధత పొందినవారై, విధేయులగుటకును యేసుక్రీస్తు రక్తము చిలకరింపబడుటకును ఏర్పరచబడినవారికి... కృపయు సమాధానమును మీకు విస్తరించును గాక\"", "The Trinitarian dynamic of election, sanctification, and atonement unleashes an exponential multiplication of peace in the believer's life.", "తండ్రి సంకల్పములో ఏర్పరచబడి క్రీస్తు రక్తముచేత కడుగబడిన విశ్వాసులకు కృపయు సమాధానమును అంతకంతకు విస్తరించును."],
    ["1 Peter 5:14 the closing fraternal kiss of peace: 'Greet one another with a kiss of love. Peace to you all who are in Christ Jesus. Amen'", "1 పేతురు 5:14 పత్రిక ముగింపు శాంతి: 'ఒకనినొకడు ప్రేమముద్దుతో పలకరించుకొనుడి; క్రీస్తునందున్న మీకందరికిని సమాధానము కలుగును గాక. ఆమేన్'", "1 Peter 5:14", "\"Greet one another with a kiss of love. Peace to you all who are in Christ Jesus. Amen\"", "\"ఒకనినొకడు ప్రేమముద్దుతో పలకరించుకొనుడి. క్రీస్తునందున్న మీకందరికిని సమాధానము కలుగును గాక. ఆమేన్\"", "Peter concludes his epistle to persecuted diaspora saints by binding them together in Christ's unassailable shalom.", "శ్రమలనొందుచున్న విశ్వాసులకందరికి క్రీస్తుయేసునందలి నిత్య సమాధానమును ప్రకటించి ముగించిన పేతురు పత్రిక."],
    ["2 Peter 1:2 Peter's prayer for flourishing peace: 'Grace and peace be multiplied to you in the knowledge of God and of Jesus our Lord'", "2 పేతురు 1:2 జ్ఞానమువలన విస్తరించే శాంతి: 'దేవుని గూర్చినట్టియు మన ప్రభువైన యేసును గూర్చినట్టియు అనుభవజ్ఞానమువలన మీకు కృపయు సమాధానమును విస్తరించును గాక'", "2 Peter 1:2", "\"Grace and peace be multiplied to you in the knowledge of God and of Jesus our Lord\"", "\"దేవుని గూర్చినట్టియు మన ప్రభువైన యేసును గూర్చినట్టియు అనుభవజ్ఞానమువలన మీకు కృపయు సమాధానమును విస్తరించును గాక\"", "Experiential, relational knowledge of God and Jesus Christ is the soil where peace multiplies beyond measure.", "దేవుని గూర్చిన లోతైన అనుభవజ్ఞానములోనే విశ్వాసి హృదయములో కృపయు సమాధానమును సమృద్ధిగా వర్ధిల్లును."],
    ["2 Peter 3:14 the eschatological diligence: 'Therefore, beloved, looking forward to these things, be diligent to be found by Him in peace, without spot and blameless'", "2 పేతురు 3:14 క్రీస్తు రాకడలో సమాధానముగా కనబడుట: 'ప్రియులారా, వీటికొరకు మీరు కనిపెట్టుచున్నారు గనుక ఆయన దృష్టికి నిష్కళంకులుగాను నిర్దోషులుగాను సమాధానముగలవారై కనబడునట్లు జాగ్రత్తపడుడి'", "2 Peter 3:14", "\"Therefore, beloved, looking forward to these things, be diligent to be found by Him in peace, without spot and blameless\"", "\"కాబట్టి ప్రియులారా, వీటికొరకు మీరు కనిపెట్టుచున్నారు గనుక శాంతిగలవారై (సమాధానముగలవారై), ఆయన దృష్టికి నిష్కళంకులుగాను నిర్దోషులుగాను కనబడునట్లు జాగ్రత్తపడుడి\"", "Awaiting the new heavens and new earth, believers must actively guard their hearts to be found living in peace and spotlessness when Christ returns.", "నూతన ఆకాశము కొరకు ఎదురుచూచుచున్న విశ్వాసులు క్రీస్తు ప్రత్యక్షతయందు ఏ కళంకములేక సమాధానముగలవారిగా కనబడవలెను."]
  ];

  return data.map(item => ({
    easyQ: `What biblical truth or ethical practice regarding peace is taught in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన బోధ లేదా సమాధాన సూత్రమేమి?`,
    medQ: `According to ${item[2]}, how does cultivating peace impact the believer's character, community, and witness?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం సమాధానమును వెంబడించుట విశ్వాసి జీవితమును మరియు సంఘ సహవాసమును ఎలా ఆశీర్వదించును?`,
    hardQ: `What theological principle does ${item[2]} reveal about covenant shalom, spiritual sanctification, and divine providence?`,
    hardQTe: `${item[2]} లేఖనము ద్వారా దేవుని సమాధాన నిబంధనను మరియు పరిశుద్ధతలో ఎదుగుటను గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty storehouses on the plain of Jezreel", "He dispatched sixty envoys to negotiate with Pharaoh", "He commanded thirty sacrifices offered at the high place of Gibeon"],
    optionsTelugu: [item[4], "యెజ్రెయేలు మైదానములో నలభై కొట్లను నిర్మించెను", "ఫరోతో సంప్రదింపులు జరుపుటకు అరవైమంది రాయబారులను పంపెను", "గిబియోను బలిపీఠముపై ముప్పది బలులను అర్పించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Mastery Facts for Peace (Cosmic Eschatological peace, Reconciled Cosmos, Christ our Peace, New Jerusalem)
function buildPeaceMastery() {
  const data = [
    [
      "Colossians 1:19-20 the cosmic reconciliation at the cross: 'For it pleased the Father that in Him all the fullness should dwell, and by Him to reconcile all things to Himself, having made peace through the blood of His cross'",
      "కొలొస్సయులకు 1:19-20 సిలువ రక్తముద్వారా సర్వ సృష్టి సమాధానపడుట: 'తన సిలువ రక్తముచేత సమాధానము పరచి, పరలోకమందున్నవాటినైనను భూమిమీద ఉన్నవాటినైనను సమస్తమును ఆయనద్వారా తనతో సమాధానపరచుకొనుటకు తండ్రికి ఇష్టమాయెను'",
      "Colossians 1:20",
      "And by Him to reconcile all things to Himself, by Him, whether things on earth or things in heaven, having made peace through the blood of His cross",
      "తన సిలువ రక్తముచేత సమాధానము పరచి, ఆయనద్వారా సమస్తమును, అవి భూమిమీద ఉన్నవైనను పరలోకమందున్నవైనను, తనతో సమాధానపరచుకొనుటకు తండ్రికి ఇష్టమాయెను",
      "The blood of Christ's cross is cosmic in scope; it pacifies the broken universe and reconciles all alienated realities back into harmony with God.",
      "క్రీస్తు సిలువ రక్తము కేవలము మానవులను మాత్రమే కాక సమస్త సృష్టిని దేవునితో సమాధానపరచే పరమ విమోచన సాధనము."
    ],
    [
      "Ephesians 2:15-17 on Christ abolishing in His flesh the enmity, creating in Himself one new man from the two, thus making peace, and preaching peace to you who were far off and to those who were near",
      "ఎఫెసీయులకు 2:15-17 ఇరుపక్షములను ఏకము చేసి నూతన మానవునిగా సృష్టించి సమాధానపరచుట: 'తన శరీరమందు విరోధమును కొట్టివేసి, ఇద్దరిని తనయందు ఒకే నూతన మనుష్యునిగా సృష్టించి సమాధానపరచెను; దూరస్థులైన మీకును సమీపస్థులైన వారికిని సమాధాన సువార్తను ప్రకటించెను'",
      "Ephesians 2:15,17",
      "Having abolished in His flesh the enmity, that is, the law of commandments contained in ordinances, so as to create in Himself one new man from the two, thus making peace... And He came and preached peace to you who were far off and to those who were near",
      "ఆయన వేరుచేయుచుండిన అడ్డగోడను పడగొట్టి, తన శరీరమందు విరోధమును రద్దుపరచెను; ఇద్దరిని తనయందు ఒక్క నూతన మనుష్యునిగా సృష్టించి సమాధానపరచుటకును... వచ్చి దూరస్థులైన మీకును సమీపస్థులైన వారికిని సమాధాన సువార్తను ప్రకటించెను",
      "Christ dissolved millennia of racial hatred between Jew and Gentile, forging a brand-new redeemed race ('one new man') bathed in gospel peace.",
      "ధర్మశాస్త్రపు అడ్డగోడలను కూల్చివేసి యూదులను అన్యులను క్రీస్తునందు ఒక్క నూతన సృష్టిగా చేసి సమాధానమును స్థాపించెను."
    ],
    [
      "Isaiah 11:6-9 the Edenic peace of the Messianic Kingdom: 'The wolf also shall dwell with the lamb, the leopard shall lie down with the young goat... They shall not hurt nor destroy in all My holy mountain'",
      "యెషయా 11:6-9 మెస్సీయ రాజ్యమందలి పరమ శాంతి: 'తోడేలు గొఱ్ఱెపిల్లతో నివసించును, చిరుతపులి మేకపిల్లతో పండుకొనును; నా పరిశుద్ధ పర్వతమందంతటను ఏ హానియు జరుగదు'",
      "Isaiah 11:6,9",
      "The wolf also shall dwell with the lamb, the leopard shall lie down with the young goat, the calf and the young lion and the fatling together; and a little child shall lead them... They shall not hurt nor destroy in all My holy mountain, for the earth shall be full of the knowledge of the Lord",
      "తోడేలు గొఱ్ఱెపిల్లతో నివసించును, చిరుతపులి మేకపిల్లతో పండుకొనును, దూడయు కొదమసింహమును పెంచబడిన కోడెయు కలిసియుండును, ఒక చిన్నబాలుడు వాటిని తోలును... నా పరిశుద్ధ పర్వతమందంతటను అవి ఏ హానియు చేయవు నాశనము చేయవు, సముద్రము జలములతో నిండియున్నట్టు భూమి యెహోవా జ్ఞానముతో నిండియుండును",
      "The curse of Genesis 3 is reversed; predator and prey live in vegetarian harmony as divine shalom saturates the renewed cosmos.",
      "పాపపు శాపము తొలగిపోయి క్రూర మృగములు సైతం శాంతిగా జీవించు మెస్సీయ రాజ్యపు నూతన సృష్టి దర్శనము."
    ],
    [
      "Isaiah 65:25 the renewed creation where the wolf and the lamb feed together: 'The wolf and the lamb shall feed together, the lion shall eat straw like the ox, and dust shall be the serpent's food'",
      "యెషయా 65:25 నూతన ఆకాశము నూతన భూమియందలి సమాధానము: 'తోడేలును గొఱ్ఱెపిల్లను కలిసి మేయును, సింహము ఎద్దువలె గడ్డి తినును; నా పరిశుద్ధ పర్వతమందంతటను అవి హాని చేయవు'",
      "Isaiah 65:25",
      "The wolf and the lamb shall feed together, the lion shall eat straw like the ox, and dust shall be the serpent's food. They shall not hurt nor destroy in all My holy mountain, says the Lord",
      "తోడేలును గొఱ్ఱెపిల్లను కలిసి మేయును, సింహము ఎద్దువలె గడ్డి తినును, సర్పమునకు ధూళియే ఆహారమగును; నా పరిశుద్ధ పర్వతమందంతటను అవి హాని చేయవు నాశనము చేయవు అని యెహోవా సెలవిచ్చుచున్నాడు",
      "Eschatological recreation: the predatory cycle of death is eliminated forever in the holy mountain of God's eternal peace.",
      "హింస మరియు మరణములు అంతమై సమస్త జీవకోటి దేవుని పరిశుద్ధ పర్వతమందు శాంతితో వర్ధిల్లు నిత్య రాజ్య మహిమ."
    ],
    [
      "Isaiah 2:4 the universal beatitude of disarmament: 'They shall beat their swords into plowshares, and their spears into pruning hooks; nation shall not lift up sword against nation, neither shall they learn war anymore'",
      "యెషయా 2:4 సర్వదేశముల నిరాయుధీకరణ: 'వారు తమ ఖడ్గములను నాగటినక్కులుగాను తమ ఈటెలను మచ్చుకత్తులుగాను సాగగొట్టుదురు; జనముమీదికి జనము ఖడ్గము ఎత్తదు, ఇకను వారు యుద్ధము చేయ నేర్చుకొనరు'",
      "Isaiah 2:4",
      "He shall judge between the nations, and rebuke many people; they shall beat their swords into plowshares, and their spears into pruning hooks; nation shall not lift up sword against nation, neither shall they learn war anymore",
      "ఆయన అన్యజనులకు న్యాయము తీర్చును, అనేక జనములను సరిచేయును; వారు తమ ఖడ్గములను నాగటినక్కులుగాను తమ ఈటెలను మచ్చుకత్తులుగాను సాగగొట్టుదురు; జనముమీదికి జనము ఖడ్గము ఎత్తదు, ఇకను వారు యుద్ధము చేయ నేర్చుకొనరు",
      "When the law goes forth from Zion, all global military budgets and weapons of destruction are recycled into agrarian tools of life and peace.",
      "క్రీస్తు పరిపాలనలో సర్వ దేశములు యుద్ధములను విరమించి తమ ఆయుధములను వ్యవసాయ పనిముట్లుగా మార్చుకొను నిత్య శాంతి."
    ],
    [
      "Micah 4:3-4 the millennial tranquility: 'Nation shall not lift up sword against nation... but everyone shall sit under his vine and under his fig tree, and no one shall make them afraid'",
      "మీకా 4:3-4 భయములేని నివాసము: 'జనముమీదికి జనము ఖడ్గము ఎత్తదు, యుద్ధము చేయ నేర్చుకొనరు; ప్రతివాడును తన ద్రాక్షచెట్టుక్రిందను అంజూరపు చెట్టుక్రిందను కూర్చుండును, వారిని భయపెట్టువాడెవడును ఉండడు'",
      "Micah 4:3-4",
      "Nation shall not lift up sword against nation, neither shall they learn war anymore. But everyone shall sit under his vine and under his fig tree, and no one shall make them afraid; for the mouth of the Lord of hosts has spoken",
      "జనముమీదికి జనము ఖడ్గము ఎత్తదు, ఇకను వారు యుద్ధము చేయ నేర్చుకొనరు. ప్రతివాడును తన ద్రాక్షచెట్టుక్రిందను తన అంజూరపు చెట్టుక్రిందను కూర్చుండును, వారిని భయపెట్టువాడెవడును ఉండడు; సైన్యములకధిపతియైన యెహోవా నోరు సెలవిచ్చెను",
      "Geopolitical disarmament guarantees absolute domestic security; terror is permanently banished by the decree of the Lord of hosts.",
      "సైన్యములకధిపతియైన యెహోవా మాట ప్రకారము సమస్త యుద్ధములు నశించి ప్రతివాడు నిర్భయముగా జీవించు దినము వచ్చును."
    ],
    [
      "Romans 16:20 the eschatological crushing of Satan: 'And the God of peace will crush Satan under your feet shortly. The grace of our Lord Jesus Christ be with you'",
      "రోమీయులకు 16:20 సాతాను తల చితకద్రొక్కబడుట: 'సమాధానకర్తయగు దేవుడు సాతానును మీ కాళ్లక్రింద శీఘ్రముగా చితకద్రొక్కించును; మన ప్రభువైన యేసుక్రీస్తు కృప మీకు తోడైయుండును గాక'",
      "Romans 16:20",
      "And the God of peace will crush Satan under your feet shortly. The grace of our Lord Jesus Christ be with you. Amen",
      "సమాధానకర్తయగు దేవుడు సాతానును మీ కాళ్లక్రింద శీఘ్రముగా చితకద్రొక్కించును. మన ప్రభువైన యేసుక్రీస్తు కృప మీకు తోడైయుండును గాక",
      "The divine paradox: the 'God of peace' acts as a victorious warrior to crush the serpent beneath the feet of His redeemed church.",
      "సమాధానకర్తయైన దేవుడే విశ్వాసుల కాళ్లక్రింద సాతాను తలను శీఘ్రముగా చితకద్రొక్కించి నిత్య విజయమును అనుగ్రహించును."
    ],
    [
      "Revelation 21:3-4 the tears wiped away in the eternal metropolis of peace: 'Behold, the tabernacle of God is with men... there shall be no more death, nor sorrow, nor crying. There shall be no more pain'",
      "ప్రకటన 21:3-4 కన్నీరులేని నిత్య సమాధాన నగరము: 'ఇదిగో దేవుని నివాసము మనుష్యులతోకూడ ఉన్నది... ఆయన వారి కన్నీళ్లన్నిటిని తుడిచివేయును, ఇకమీదట మరణముండదు, దుఃఖమైనను ఏడ్పైనను వేదనయైనను ఇక ఉండదు'",
      "Revelation 21:3-4",
      "Behold, the tabernacle of God is with men, and He will dwell with them, and they shall be His people. God Himself will be with them and be their God. And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying. There shall be no more pain",
      "ఇదిగో దేవుని నివాసము మనుష్యులతోకూడ ఉన్నది, ఆయన వారితో కాపురముండును, వారు ఆయన ప్రజలై యుందురు; దేవుడు తానే వారికి తోడైయుండి వారి దేవుడై యుండును. ఆయన వారి కన్నుల ప్రతి బాష్పబిందువును తుడిచివేయును; మరణము ఇక ఉండదు, దుఃఖమైనను ఏడ్పైనను వేదనయైనను ఇక ఉండదు",
      "The consummate telos of peace: God tabernacles unhindered with humanity; sorrow, pain, and death are permanently abolished.",
      "దేవుడే స్వయముగా మనుష్యులమధ్య నివసించి కన్నీరంతయు తుడిచివేసి మరణ వేదనలను తీసివేయు పరమ సమాధాన రాజ్యము."
    ],
    [
      "Revelation 22:1-2 the River of the Water of Life flowing from the throne bringing healing and peace to the nations",
      "ప్రకటన 22:1-2 సింహాసనమునుండి పారు జీవజలముల నది: 'దేవునియొక్కయు గొర్రెపిల్లయొక్కయు సింహాసనమునొద్దనుండి స్పటికమువలె స్వచ్ఛమైన జీవజలముల నది... ఆ వృక్షపు ఆకులు జనములను స్వస్థపరచుటకై ఉపయోగించును'",
      "Revelation 22:1-2",
      "And he showed me a pure river of water of life, clear as crystal, proceeding from the throne of God and of the Lamb. In the middle of its street, and on either side of the river, was the tree of life... And the leaves of the tree were for the healing of the nations",
      "మరియు స్పటికమువలె నిర్మలమైన జీవజలముల నది దేవునియొక్కయు గొర్రెపిల్లయొక్కయు సింహాసనమునొద్దనుండి బయలువెళ్లుట ఆ దూత నాకు చూపించెను. ఆ నదికి ఇరుప్రక్కలను జీవవృక్షముండెను... ఆ వృక్షపు ఆకులు జనములను స్వస్థపరచుటకై ఉపయోగించును",
      "The pure crystal stream of eternal life issues from the throne, providing therapeutic leaves that sustain the everlasting health and peace of all nations.",
      "దేవుని సింహాసనమునుండి ప్రవహించే జీవజలముల నది మరియు ఆకులు సర్వ జనములకు నిత్య స్వస్థతను సమాధానమును ఇచ్చును."
    ],
    [
      "Revelation 22:3-5 the banishment of the curse: 'There shall be no more curse, but the throne of God and of the Lamb shall be in it... and they shall reign forever and ever'",
      "ప్రకటన 22:3-5 శాపములు లేని నిత్య పరిపాలన: 'ఇకమీదట ఏ శాపమును ఉండదు; దేవుని యొక్కయు గొర్రెపిల్ల యొక్కయు సింహాసనము దానిలో ఉండును... వారు యుగయుగములు రాజ్యపరిపాలన చేయుదురు'",
      "Revelation 22:3,5",
      "And there shall be no more curse, but the throne of God and of the Lamb shall be in it, and His servants shall serve Him... and they shall reign forever and ever",
      "ఇకమీదట ఏ శాపమును ఉండదు; దేవునియొక్కయు గొర్రెపిల్లయొక్కయు సింహాసనము దానిలో ఉండును. ఆయన దాసులు ఆయనను సేవించుదురు... వారు యుగయుగములు రాజ్యపరిపాలన చేయుదురు",
      "The final victory of peace: every trace of the Edenic curse is wiped away as the saints gaze into God's radiant face in eternal glory.",
      "సమస్త శాపములు తొలగిపోయి దేవుని ముఖదర్శనమును చూస్తూ పరిశుద్ధులు నిత్య సమాధానముతో రాజ్యమేలుదురు."
    ]
  ];

  // We have 10 deep Mastery facts here. We need 40 more to make 50 facts for Mastery!
  return data.map(item => ({
    easyQ: `What eschatological doctrine or cosmic revelation of eternal peace is established in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన యుగాంతపు ప్రవచనము లేదా నిత్య సమాధాన సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does Christ's eternal kingdom permanently abolish war, conflict, and the curse of sin?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం క్రీస్తు రాజ్యము సమస్త యుద్ధములను మరియు పాపపు శాపములను ఎలా శాశ్వతముగా తుడిచివేయును?`,
    hardQ: `What theological reality does ${item[2]} establish regarding cosmic reconciliation, the new creation, and the beatific peace of the saints?`,
    hardQTe: `${item[2]} ప్రకారం సర్వ సృష్టి సమాధానపడుటను మరియు పరిశుద్ధుల నిత్య పరలోక శాంతిని గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty bronze watchtowers across the plain of Megiddo", "He commanded seventy days of silent lamentation in Babylon", "He instituted sixty silver trumpets sounded at the river Euphrates"],
    optionsTelugu: [item[4], "మెగిద్దో మైదానములో నలభై ఇత్తడి కావలి గోపురములను నిర్మించెను", "బబులోనులో డెబ్బై దినముల మౌన రోదనను విధించెను", "యూఫ్రటీసు నదియొద్ద అరవై వెండి బూరలను ఊదవలెనని ఆజ్ఞాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 40 Additional Mastery Facts for Peace (To complete exactly 50 Mastery Facts)
function getAdditionalPeaceMastery40() {
  const extra = [
    ["Luke 1:79 on Dayspring guiding our feet into the way of peace", "లూకా 1:79 అరుణోదయము మన పాదములను సమాధాన మార్గములోనికి నడిపించుట", "Luke 1:79", "\"To guide our feet into the way of peace\"", "\"మన పాదములను సమాధానమార్గములోనికి నడిపించును\"", "Guiding our feet into the eternal way of peace.", "మన పాదములను నిత్య సమాధాన మార్గములో నడిపించు అరుణోదయము."],
    ["Acts 24:2 Tertullus acknowledging: 'Seeing that through you we enjoy great peace'", "అపొస్తలుల కార్యములు 24:2 తెర్తుల్లు పలికిన మాట: 'నీవలన మేము బహుగా సమాధానము అనుభవించుచున్నాము'", "Acts 24:2", "\"Seeing that through you we enjoy great peace, and prosperity is being brought to this nation by your foresight\"", "\"నీవలన మేము బహుగా సమాధానము అనుభవించుచున్నాము గనుక మేము నిన్ను సన్మానించుచున్నాము\"", "Political rhetoric contrasted with the true supernatural peace of Christ.", "లౌకిక రాజకీయ శాంతికి క్రీస్తు ఇచ్చే పరలోక సమాధానమునకు గల తేడా."],
    ["Romans 3:17 on the path of fallen humanity: 'And the way of peace they have not known'", "రోమీయులకు 3:17 పాపపు మానవాళి దుస్థితి: 'సమాధానమార్గము వారు ఎరుగరు'", "Romans 3:17", "\"And the way of peace they have not known. There is no fear of God before their eyes\"", "\"సమాధానమార్గము వారు ఎరుగరు; వారి కన్నులయెదుట దైవభయము లేదు\"", "Total depravity blinds fallen mortals from finding genuine reconciliation.", "దైవభయము లేని పాపపు మానవాళికి సమాధాన మార్గము ఎన్నడును తెలియదు."],
    ["Romans 10:15 citing Isaiah: 'How beautiful are the feet of those who preach the gospel of peace, who bring glad tidings of good things!'", "రోమీయులకు 10:15 'సమాధాన సువార్తను ప్రకటించువారి పాదములు ఎంతో సుందరమైనవి'", "Romans 10:15", "\"How beautiful are the feet of those who preach the gospel of peace, who bring glad tidings of good things!\"", "\"శాంతి సువార్తను ప్రకటించువారి పాదములు ఎంతో సుందరమైనవి\"", "Apostolic heralds crossing mountains to impart the gospel of peace.", "పర్వతములపై సమాధాన సువార్తను మోసుకొనివచ్చు సేవకుల పాదముల సౌందర్యము."],
    ["1 Corinthians 1:3 the Pauline signature: 'Grace to you and peace from God our Father and the Lord Jesus Christ'", "1 కొరింథీయులకు 1:3 అపొస్తలుని శుభములు: 'మన తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు కృపయు సమాధానమును మీకు కలుగును గాక'", "1 Corinthians 1:3", "\"Grace to you and peace from God our Father and the Lord Jesus Christ\"", "\"మన తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు కృపయు సమాధానమును మీకు కలుగును గాక\"", "Grace precedes peace; unmerited favor originates divine shalom.", "దేవుని ఉచిత కృపనుండి మాత్రమే నిత్య సమాధానము ప్రవహించును."],
    ["Romans 14:17 the nature of God's kingdom: 'For the kingdom of God is not eating and drinking, but righteousness and peace and joy in the Holy Spirit'", "రోమీయులకు 14:17 దేవుని రాజ్య స్వభావము: 'దేవుని రాజ్యము భోజనమును పానమును కాదు గాని, నీతియు సమాధానమును పరిశుద్ధాత్మయందలి ఆనందమునై యున్నది'", "Romans 14:17", "\"For the kingdom of God is not eating and drinking, but righteousness and peace and joy in the Holy Spirit\"", "\"దేవుని రాజ్యము భోజనమును పానమును కాదు గాని, నీతియు సమాధానమును పరిశుద్ధాత్మయందలి ఆనందమునై యున్నది\"", "The essence of the kingdom of God is not ritual diets, but spiritual righteousness, deep peace, and divine joy.", "దేవుని రాజ్యము ఆహార నియమములవంటి బాహ్య ఆచారములలో లేదు గాని పరిశుద్ధాత్మ సమాధానములో ఉన్నది."],
    ["Galatians 1:3 proclaiming: 'Grace to you and peace from God the Father and our Lord Jesus Christ, who gave Himself for our sins'", "గలతీయులకు 1:3 'మన తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు కృపయు సమాధానమును కలుగును గాక'", "Galatians 1:3", "\"Grace to you and peace from God the Father and our Lord Jesus Christ, who gave Himself for our sins, that He might deliver us from this present evil age\"", "\"మన తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు కృపయు సమాధానమును మీకు కలుగును గాక; ఆయన మనలను ప్రస్తుతపు దుష్టకాలములోనుండి విడిపించుటకై తన్నుతాను అప్పగించుకొనెను\"", "Deliverance from this present evil age is the gateway to eternal peace.", "ఈ దుష్ట లోకమునుండి మనలను విడిపించుటకు తన్నుతాను అర్పించుకొనిన క్రీస్తు శాంతి."],
    ["Galatians 6:16 pronouncing the rule of new creation: 'And as many as walk according to this rule, peace and mercy be upon them, and upon the Israel of God'", "గలతీయులకు 6:16 నూతన సృష్టి నియమము: 'ఈ నియమముచొప్పున నడుచుకొనువారికందరికిని, అనగా దేవుని ఇశ్రాయేలునకు సమాధానమును కనికరమును కలుగును గాక'", "Galatians 6:16", "\"And as many as walk according to this rule, peace and mercy be upon them, and upon the Israel of God\"", "\"ఈ నియమముచొప్పున నడుచుకొనువారికందరికిని, అనగా దేవుని ఇశ్రాయేలునకు సమాధానమును కనికరమును కలుగును గాక\"", "Walking according to the cross-centered new creation secures eternal peace and mercy.", "బాహ్య సున్నతిని కాక క్రీస్తుయొక్క నూతన సృష్టిని వెంబడించువారిపై సమాధానము నిలుచును."],
    ["Numbers 6:24-26 the Aaronic benediction: 'The Lord bless you and keep you; the Lord make His face shine upon you, and be gracious to you; the Lord lift up His countenance upon you, and give you peace'", "సంఖ్యాకాండము 6:24-26 అహరోను దీవెన: 'యెహోవా నిన్ను ఆశీర్వదించి నిన్ను కాపాడును గాక; యెహోవా తన సన్నిధిని నీపై ప్రకాశింపజేసి నిన్ను కరుణించును గాక; యెహోవా తన ముఖకాంతిని నీమీద ప్రసరింపజేసి నీకు సమాధానము కలుగజేయును గాక'", "Numbers 6:24-26", "\"The Lord bless you and keep you; the Lord make His face shine upon you, and be gracious to you; the Lord lift up His countenance upon you, and give you peace\"", "\"యెహోవా నిన్ను ఆశీర్వదించి నిన్ను కాపాడును గాక; యెహోవా తన సన్నిధిని నీపై ప్రకాశింపజేసి నిన్ను కరుణించును గాక; యెహోవా తన ముఖకాంతిని నీమీద ప్రసరింపజేసి నీకు సమాధానము కలుగజేయును గాక\"", "The high priestly blessing peaks with the gift of divine shalom flowing from the luminous countenance of God.", "యాజక ఆశీర్వాదపు పరమ శిఖరము దేవుని ముఖదర్శనమునుండి ప్రవహించే నిత్య సమాధానమై యున్నది."],
    ["Ephesians 6:23 closing benediction: 'Peace to the brethren, and love with faith, from God the Father and the Lord Jesus Christ'", "ఎఫెసీయులకు 6:23 ఎఫెసు పత్రిక ముగింపు శాంతి: 'తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు సహోదరులకు సమాధానమును ప్రేమయు కలుగును గాక'", "Ephesians 6:23", "\"Peace to the brethren, and love with faith, from God the Father and the Lord Jesus Christ. Grace be with all those who love our Lord Jesus Christ in sincerity\"", "\"తండ్రియైన దేవునినుండియు ప్రభువైన యేసుక్రీస్తునుండియు సహోదరులకు సమాధానమును విశ్వాసముతోకూడిన ప్రేమయు కలుగును గాక\"", "Sealing the armor of God with the fraternal impartation of peace, love, and faith.", "ఆత్మీయ కవచమును ధరించిన విశ్వాసులకు సమాధానమును నిష్కపటమైన ప్రేమను ప్రసాదించుట."],
    ["Ezekiel 34:25 covenant of secure dwelling: 'I will make a covenant of peace with them, and cause wild beasts to cease from the land; and they will dwell safely in the wilderness and sleep in the woods'", "యెహెజ్కేలు 34:25 సమాధాన నిబంధన: 'నేను వారితో సమాధాన నిబంధన చేసెదను, దుష్టమృగములను దేశములో ఉండకుండ చేసెదను, వారు అరణ్యములో సురక్షితముగా నివసించి అడవులలో పండుకొందురు'", "Ezekiel 34:25", "\"I will make a covenant of peace with them, and cause wild beasts to cease from the land; and they will dwell safely in the wilderness and sleep in the woods\"", "\"నేను వారితో సమాధాన నిబంధన చేసెదను, దుష్టమృగములను దేశములో ఉండకుండ చేసెదను; వారు అరణ్యములో సురక్షితముగా నివసించి అడవులలో పండుకొందురు\"", "God's pastoral covenant of peace eliminates ferocious perils, granting peaceful rest even in wilderness terrain.", "దేవుని సమాధాన నిబంధన సమస్త భయములను తొలగించి అరణ్యములో సైతం సురక్షితమైన నెమ్మదిని ఇచ్చును."],
    ["Ezekiel 37:26 the everlasting covenant of peace: 'Moreover I will make a covenant of peace with them, and it shall be an everlasting covenant with them; I will establish them and multiply them'", "యెహెజ్కేలు 37:26 నిత్య సమాధాన నిబంధన: 'నేను వారితో సమాధాన నిబంధన చేసెదను, అది వారికి నిత్య నిబంధనగా ఉండును; నేను వారిని స్థిరపరచి వారిని విస్తరింపజేసెదను'", "Ezekiel 37:26", "\"Moreover I will make a covenant of peace with them, and it shall be an everlasting covenant with them; I will establish them and multiply them, and I will set My sanctuary in their midst forevermore\"", "\"మరియు నేను వారితో సమాధాన నిబంధన చేసెదను, అది వారికి నిత్య నిబంధనగా ఉండును; నేను వారిని స్థిరపరచి వారిని విస్తరింపజేసి వారిమధ్య నా పరిశుద్ధస్థలమును ఎల్లప్పుడును ఉంచెదను\"", "An enduring Messianic covenant where God plants His holy dwelling eternally in the midst of multiplied saints.", "దేవుడు తన పరిశుద్ధ స్థలమును తన ప్రజలమధ్య నిరంతరము ఉంచి నిత్య సమాధాన నిబంధనతో వారిని వర్ధిల్లజేయును."],
    ["1 Thessalonians 5:23 on total sanctification: 'Now may the God of peace Himself sanctify you completely; and may your whole spirit, soul, and body be preserved blameless at the coming of our Lord Jesus Christ'", "1 థెస్సలొనీకయులకు 5:23 పూర్ణ పరిశుద్ధత: 'సమాధానకర్తయగు దేవుడే మిమ్మును సంపూర్ణముగా పరిశుద్ధపరచును గాక; మీ ఆత్మయు జీవమును శరీరమును మన ప్రభువైన యేసుక్రీస్తు రాకడయందు నిందారహితముగా ఉండునట్లు కాపాడబడును గాక'", "1 Thessalonians 5:23", "\"Now may the God of peace Himself sanctify you completely; and may your whole spirit, soul, and body be preserved blameless at the coming of our Lord Jesus Christ\"", "\"సమాధానకర్తయగు దేవుడే మిమ్మును సంపూర్ణముగా పరిశుద్ధపరచును గాక; మన ప్రభువైన యేసుక్రీస్తు రాకడయందు మీ ఆత్మయు ప్రాణమును శరీరమును నిరపరాధముగా ఉండునట్లు కాపాడబడును గాక\"", "Sanctification across every dimension of the human person is executed by the God of peace until Christ's coming.", "సమాధానకర్తయైన దేవుడే విశ్వాసియొక్క ఆత్మను, ప్రాణమును, శరీరమును సంపూర్ణముగా పరిశుద్ధపరచి కాపాడును."],
    ["2 Thessalonians 3:16 the perpetual benediction: 'Now may the Lord of peace Himself give you peace always in every way. The Lord be with you all'", "2 థెస్సలొనీకయులకు 3:16 నిరంతర సమాధాన దీవెన: 'సమాధానకర్తయగు ప్రభువు తానే ఎల్లప్పుడును ప్రతివిధమునను మీకు సమాధానమును అనుగ్రహించును గాక. ప్రభువు మీకందరికిని తోడైయుండును గాక'", "2 Thessalonians 3:16", "\"Now may the Lord of peace Himself give you peace always in every way. The Lord be with you all\"", "\"సమాధానకర్తయగు ప్రభువు తానే ఎల్లప్పుడును ప్రతివిధమునను మీకు సమాధానమును అనుగ్రహించును గాక; ప్రభువు మీకందరికి తోడైయుండును గాక\"", "Christ as the Lord of peace promises an unwavering supply of peace spanning every circumstance without interruption.", "క్రీస్తే సమాధానకర్తయైన ప్రభువై సమస్త పరిస్థితులలో ఎల్లప్పుడును ప్రతి విధమునను సమాధానమును ప్రసాదించును."],
    ["1 Timothy 1:2 greeting: 'Grace, mercy, and peace from God our Father and Jesus Christ our Lord'", "1 తిమోతి 1:2 తిమోతికి కృపాకనికర సమాధానములు", "1 Timothy 1:2", "\"To Timothy, a true son in the faith: Grace, mercy, and peace from God our Father and Jesus Christ our Lord\"", "\"విశ్వాసమునుబట్టి నా నిజమైన కుమారుడైన తిమోతికి శుభమని చెప్పి వ్రాయునది: మన తండ్రియైన దేవునినుండియు మన ప్రభువైన క్రీస్తుయేసునుండియు కృపయు కనికరమును సమాధానమును కలుగును గాక\"", "The threefold pastoral blessing: adding 'mercy' alongside grace and peace for the solitary shepherd.", "పరిచర్య భారమును మోసే సేవకునికి కృప, కనికరము మరియు సమాధానముల త్రివిధ ఆశీర్వాదము."],
    ["2 Timothy 1:2 greeting: 'Grace, mercy, and peace from God the Father and Christ Jesus our Lord'", "2 తిమోతి 1:2 ప్రియ కుమారునికి సమాధాన దీవెన", "2 Timothy 1:2", "\"To Timothy, a beloved son: Grace, mercy, and peace from God the Father and Christ Jesus our Lord\"", "\"నా ప్రియ కుమారుడైన తిమోతికి శుభమని చెప్పి వ్రాయునది: తండ్రియైన దేవునినుండియు మన ప్రభువైన క్రీస్తుయేసునుండియు కృపయు కనికరమును సమాధానమును కలుగును గాక\"", "Imprisoned on death row, Paul still dispenses celestial peace to his spiritual son.", "మరణ ఖైదీగా ఉండి సైతం పరలోక సమాధానమును తన కుమారునికి దీవించిన పౌలు."],
    ["Titus 1:4 greeting: 'Grace, mercy, and peace from God the Father and the Lord Jesus Christ our Savior'", "తీతుకు 1:4 తీతునకు కృపాకనికర సమాధానములు", "Titus 1:4", "\"To Titus, a true son in our common faith: Grace, mercy, and peace from God the Father and the Lord Jesus Christ our Savior\"", "\"సాధారణ విశ్వాసమునుబట్టి నా నిజమైన కుమారుడైన తీతుకు శుభమని చెప్పి వ్రాయునది: తండ్రియైన దేవునినుండియు మన రక్షకుడైన క్రీస్తుయేసునుండియు కృపయు కనికరమును సమాధానమును కలుగును గాక\"", "Equipping an apostolic legate in corrupt Crete with heavenly peace and authority.", "క్రేతు ద్వీపములో సంఘములను సరిచేయుటకు దైవిక సమాధానముతో కూడిన పిలుపు."],
    ["Hebrews 13:20-21 the eternal covenant benediction: 'Now may the God of peace who brought up our Lord Jesus from the dead, that great Shepherd of the sheep, through the blood of the everlasting covenant, make you complete in every good work'", "హెబ్రీయులకు 13:20-21 నిత్య నిబంధన రక్తాశీర్వాదము: 'గొఱ్ఱెల గొప్ప కాపరియైన యేసు అను మన ప్రభువును నిత్యమైన నిబంధన రక్తమునుబట్టి మృతులలోనుండి లేపిన సమాధానకర్తయగు దేవుడు తన చిత్తము చేయుటకు ప్రతి సత్కార్యమందును మిమ్మును సిద్ధపరచును గాక'", "Hebrews 13:20-21", "\"Now may the God of peace who brought up our Lord Jesus from the dead, that great Shepherd of the sheep, through the blood of the everlasting covenant, make you complete in every good work to do His will\"", "\"గొఱ్ఱెల గొప్ప కాపరియైన యేసు అను మన ప్రభువును నిత్యమైన నిబంధన రక్తమునుబట్టి మృతులలోనుండి లేపిన సమాధానకర్తయగు దేవుడు తన చిత్తము చేయుటకు ప్రతి సత్కార్యమందును మిమ్మును సంపూర్ణులనుగా చేయును గాక\"", "The resurrection of Christ seals an everlasting covenant of peace, empowering saints for every good deed.", "నిత్య నిబంధన రక్తముద్వారా మృతులలోనుండి లేచిన క్రీస్తు సమాధానకర్తయైన దేవుని సంపూర్ణ చిత్తమును నెరవేర్చుటకు మనలను బలపరచును."],
    ["Hebrews 7:1-2 Melchizedek designated 'king of Salem, meaning king of peace'", "హెబ్రీయులకు 7:1-2 మెల్కీసెదెకు 'సాలేము రాజు, అనగా సమాధానపు రాజు'", "Hebrews 7:2", "\"To whom also Abraham gave a tenth part of all, first being translated 'king of righteousness,' and then also king of Salem, meaning 'king of peace'\"", "\"అతనికి అబ్రాహాము అన్నిటిలో పదియవ వంతు ఇచ్చెను. అతని పేరుకు మొదట నీతికి రాజనియు, తరువాత సాలేము రాజనగా సమాధానపు రాజనియు అర్థము\"", "Melchizedek prefigures Christ: righteousness must precede peace, uniting the priesthood and throne.", "మొదట నీతికి రాజు, తరువాత సమాధానపు రాజైన క్రీస్తు ప్రధానయాజకత్వపు నిత్యత్వము."],
    ["2 Peter 3:11 on looking for the dissolution of elements and living in holy peace", "2 పేతురు 3:11 లోకము లయమైపోవునప్పుడు సమాధానముగా జీవించుట", "2 Peter 3:11", "\"Therefore, since all these things will be dissolved, what manner of persons ought you to be in holy conduct and godliness\"", "\"ఇవన్నియు ఇట్లు లయమైపోవునవి గనుక... మీరు పరిశుద్ధమైన ప్రవర్తనతోను భక్తితోను ఎంతో జాగ్రత్తపడవలెను\"", "Detachment from temporary matter generates peace anchored in the eternal new cosmos.", "లయమైపోయే ఈ లోక సంపదను కాక నిత్య సమాధానముతో దేవుని రాకడకై కనిపెట్టుట."],
    ["2 John 1:3 the Johannine greeting: 'Grace, mercy, and peace will be with you from God the Father and from the Lord Jesus Christ, the Son of the Father, in truth and love'", "2 యోహాను 1:3 సత్యప్రేమలలో సమాధానము: 'తండ్రియైన దేవునినుండియు తండ్రి కుమారుడైన యేసుక్రీస్తునుండియు కృపయు కనికరమును సమాధానమును సత్యప్రేమలలో మనకు తోడైయుండును'", "2 John 1:3", "\"Grace, mercy, and peace will be with you from God the Father and from the Lord Jesus Christ, the Son of the Father, in truth and love\"", "\"తండ్రియైన దేవునినుండియు తండ్రి కుమారుడైన యేసుక్రీస్తునుండియు కృపయు కనికరమును సమాధానమును సత్యప్రేమలలో మనకు తోడైయుండును\"", "Peace flourishes exclusively within the guardrails of divine truth and sacrificial love.", "సత్యము మరియు ప్రేమ ఉన్నచోటనే దైవిక సమాధానము నిరంతరము నిలుచును."],
    ["3 John 1:14 the parting blessing of friendship: 'Peace to you. Our friends greet you. Greet the friends by name'", "3 యోహాను 1:14 స్నేహితులకు సమాధాన దీవెన: 'నీకు సమాధానము కలుగును గాక; స్నేహితులు నీకు వందనములు చెప్పుచున్నారు'", "3 John 1:14", "\"Peace to you. Our friends greet you. Greet the friends by name\"", "\"నీకు సమాధానము కలుగును గాక. స్నేహితులు నీకు వందనములు చెప్పుచున్నారు; స్నేహితులను పేరుపేరున వందనములు చెప్పుము\"", "Pastoral affection uniting individual saints in the warm fellowship of peace.", "పరిశుద్ధుల సహవాసములో ఒకరికొకరు సమాధానమును పంచుకొను ఆత్మీయ ఆనందము."],
    ["Jude 1:2 multiplying shalom: 'Mercy, peace, and love be multiplied to you'", "యూదా 1:2 విస్తరించే సమాధానము: 'కనికరమును సమాధానమును ప్రేమయు మీకు విస్తరించును గాక'", "Jude 1:2", "\"Mercy, peace, and love be multiplied to you\"", "\"కనికరమును సమాధానమును ప్రేమయు మీకు విస్తరించును గాక\"", "In days of dark apostasy, Jude prays for the exponential expansion of mercy, peace, and love.", "దుర్బోధల కాలములో సైతం విశ్వాసుల హృదయములలో సమాధానమును ప్రేమను విస్తరింపజేయు ప్రార్థన."],
    ["Revelation 1:4 the Johannine Apocalypse greeting: 'Grace to you and peace from Him who is and who was and who is to come, and from the seven Spirits... and from Jesus Christ'", "ప్రకటన 1:4 త్రిత్వ సింహాసన సమాధానము: 'వర్తమాన భూత భవిష్యత్కాలములలో ఉండువానినుండియు... యేసుక్రీస్తునుండియు కృపయు సమాధానమును మీకు కలుగును గాక'", "Revelation 1:4", "\"Grace to you and peace from Him who is and who was and who is to come, and from the seven Spirits who are before His throne, and from Jesus Christ, the faithful witness\"", "\"వర్తమాన భూత భవిష్యత్కాలములలో ఉండువానినుండియు, ఆయన సింహాసనము ఎదుటనున్న యేడు ఆత్మలనుండియు, నమ్మకమైన సాక్షియు... యేసుక్రీస్తునుండియు కృపయు సమాధానమును మీకు కలుగును గాక\"", "The seven churches are braced for apocalyptic persecution by an infusion of peace directly from the eternal Trinity.", "రాబోవు శ్రమలను జయించుటకు త్రిత్వ దేవుని సింహాసనమునుండి ప్రవహించే పరమ సమాధానము."],
    ["Leviticus 26:9 on God confirming His covenant of peace and fruitful multiplication", "లేవీయకాండము 26:9 సమాధాన నిబంధనను స్థిరపరచుట", "Leviticus 26:9", "\"For I will look on you favorably and make you fruitful, multiply you and confirm My covenant with you\"", "\"నేను మీతట్టు తిరిగి మీకు సంతానమిచ్చి మిమ్మును విస్తరింపజేసి మీతో నా నిబంధనను స్థిరపరచెదను\"", "Favorable divine gaze conferring generational fruitfulness and peace.", "దేవుని దయాదృష్టి ప్రజలపై ఉండి వారిని సమాధానముతో విస్తరింపజేయుట."],
    ["Numbers 25:12 Phinehas receiving the covenant of peace for his holy zeal", "సంఖ్యాకాండము 25:12 ఫీనెహాసు పొందిన సమాధాన నిబంధన", "Numbers 25:12", "\"Therefore say, 'Behold, I give to him My covenant of peace'\"", "\"కాబట్టి నీవు వారితో ఇట్లనుము-ఇదిగో నేను అతనికి నా సమాధాన నిబంధనను ఇచ్చుచున్నాను; అతడు దేవునికొరకు రోషము కలిగి ప్రాయశ్చిత్తము చేసెను\"", "God awards an everlasting covenant of peace to uncompromising zeal for holiness.", "దేవుని పరిశుద్ధతకొరకు రోషము చూపిన ఫీనెహాసుకు అనుగ్రహింపబడిన నిత్య సమాధాన నిబంధన."],
    ["Deuteronomy 20:10 commanding offering peace to a besieged city first", "ద్వితీయోపదేశకాండము 20:10 నగరమును ముట్టడించుటకు ముందు సమాధాన వర్తమానము పంపుట", "Deuteronomy 20:10", "\"When you go near a city to fight against it, then proclaim an offer of peace to it\"", "\"నీవు ఒక పట్టణముమీద యుద్ధము చేయుటకు దాని సమీపమునకు వచ్చునప్పుడు దానికి సమాధానపు వర్తమానము తెలియజేయవలెను\"", "Biblical warfare ethics prioritizes an opportunity for reconciliation and peaceful surrender.", "యుద్ధము చేయుటకు ముందు సమాధానమును కోరి శాంతి వర్తమానమును పంపు దైవిక నియమము."],
    ["Joshua 9:15 Joshua making peace with the Gibeonites", "యెహోషువ 9:15 గిబియోనీయులతో యెహోషువ చేసిన సమాధాన నిబంధన", "Joshua 9:15", "\"So Joshua made peace with them, and made a covenant with them to let them live; and the rulers of the congregation swore to them\"", "\"యెహోషువ వారితో సమాధానపడి వారిని బ్రదుకనిచ్చునట్లు వారితో నిబంధన చేసెను, సమాజపు ప్రధానులును వారితో ప్రమాణము చేసిరి\"", "A sworn covenant of peace must be honored even when entered under deception.", "దేవుని నామమున చేసిన సమాధాన నిబంధనను ఎన్నడును మీరకూడదను సత్యము."],
    ["1 Kings 5:12 the Lord giving Solomon wisdom, and there was peace between Hiram and Solomon", "1 రాజులు 5:12 హీరాముతో సొలొమోనునకు సమాధానముండుట", "1 Kings 5:12", "\"And the Lord gave Solomon wisdom, as He had promised him; and there was peace between Hiram and Solomon, and the two of them made a treaty together\"", "\"యెహోవా సొలొమోనునకు సెలవిచ్చినట్లు అతనికి జ్ఞానము దయచేసెను; హీరామునకును సొలొమోనునకును సమాధానము కలిగియుండెను, వారిద్దరును నిబంధన చేసికొనిరి\"", "God-given wisdom produces international diplomacy rooted in honorable peace and mutual cooperation.", "దైవిక జ్ఞానము దేశములమధ్య సమాధానమును మరియు పరస్పర సహకారమును పెంపొందించును."],
    ["2 Chronicles 14:6-7 King Asa building fortified cities during undisturbed peace: 'For the Lord had given him rest'", "2 దినవృత్తాంతములు 14:6-7 ఆసా రాజు నెమ్మదిగల కాలమందు కోటలను నిర్మించుట: 'యెహోవా అతనికి నెమ్మది దయచేసియుండెను'", "2 Chronicles 14:6", "\"And he built fortified cities in Judah, for the land had rest; he had no war in those years, because the Lord had given him rest\"", "\"దేశము నెమ్మదిగా నుండెను గనుక అతడు యూదాలో ప్రాకారములుగల పట్టణములను కట్టించెను; యెహోవా అతనికి నెమ్మది దయచేసియుండెను గనుక ఆ సంవత్సరములలో అతనికి యుద్ధము లేకుండెను\"", "Using providential seasons of peace strategically to fortify spiritual defenses and advance God's work.", "దేవుడిచ్చిన సమాధాన కాలమును ఆత్మీయ రక్షణలను బలపరచుకొనుటకు సద్వినియోగము చేసికొనుట."],
    ["Job 5:23-24 promising: 'You shall know that your tent is in peace; you shall visit your dwelling and find nothing amiss'", "యోబు 5:23-24 గుడారపు సమాధానము: 'నీ గుడారము సమాధానముగా ఉండుట నీవు తెలిసికొందువు, నీ నివాసమును తనిఖీ చేసి ఏదియు కొదువలేకుండుట చూచెదవు'", "Job 5:24", "\"You shall know that your tent is in peace; you shall visit your dwelling and find nothing amiss\"", "\"నీ గుడారము క్షేమముగా ఉండుట (సమాధానముగా ఉండుట) నీవు తెలిసికొందువు; నీ నివాసస్థలమును పరిశీలించి చూచునప్పుడు ఏదియు కొదువపడదు\"", "God's providential guard secures domestic tranquility and household wholeness.", "దేవుని భయభక్తులలో జీవించేవాని గృహము నిరంతర క్షేమసమాధానములతో వర్ధిల్లును."],
    ["Psalm 28:3 warning against hypocrites: 'Who speak peace to their neighbors, but evil is in their hearts'", "కీర్తన 28:3 కపట సమాధానమునకు హెచ్చరిక: 'తమ పొరుగువారితో సమాధానముగా మాటలాడుచు హృదయములలో కీడుంచుకొను భక్తిహీనులు'", "Psalm 28:3", "\"Who speak peace to their neighbors, but evil is in their hearts\"", "\"తమ పొరుగువారితో సమాధానముగా మాటలాడుచు హృదయములలో కీడుంచుకొను భక్తిహీనులతో నన్ను లాగివేయకుము\"", "A clean heart rejects superficial smiles concealing malice; godly shalom is authentic.", "పైకి సమాధానముగా మాట్లాడుతూ అంతరంగములో కీడు తలంచే కపట భక్తికి దూరముగా ఉండుట."],
    ["Psalm 35:27 on let the Lord be magnified, who has pleasure in the prosperity (shalom) of His servant", "కీర్తన 35:27 దేవుని దాసుని క్షేమము: 'తన సేవకుని క్షేమమును (సమాధానమును) చూచి ఆనందించు యెహోవా ఘనపరచబడును గాక'", "Psalm 35:27", "\"Let the Lord be magnified, who has pleasure in the prosperity of His servant\"", "\"తన సేవకుని క్షేమమును చూచి ఆనందించు యెహోవా ఘనపరచబడును గాక అని వారు నిత్యము చెప్పుదురు గాక\"", "God takes intense personal delight in the total shalom, flourishing, and peace of His servants.", "తన సేవకులు సమాధానముతో వర్ధిల్లుటను చూచి హృదయపూర్వకముగా సంతోషించే పరమ తండ్రి."],
    ["Psalm 73:3 Asaph confessing stumbling when seeing the prosperity (shalom) of the wicked", "కీర్తన 73:3 ఆసాపు పొరపాటు: 'భక్తిహీనుల క్షేమమును (సమాధానమును) చూచి వారిమీద అసూయపడితిని'", "Psalm 73:3", "\"For I was envious of the boastful, when I saw the prosperity of the wicked\"", "\"భక్తిహీనుల క్షేమమును నేను చూచినప్పుడు గర్వించువారినిబట్టి అసూయపడితిని; మరణమందు వారికి బాధలు లేవు\"", "Temporary earthly peace enjoyed by the wicked is a phantom that dissolves in eternity.", "దుష్టుల తాత్కాలిక భోగములను చూచి అసూయపడక దేవుని సన్నిధిలో వారి అంతమును గ్రహించుట."],
    ["Proverbs 16:14 on a king's wrath being messengers of death, but a wise man will pacify it", "సామెతలు 16:14 సమాధానపరచే జ్ఞాని: 'రాజు క్రోధము మరణదూత వంటిది, అయితే జ్ఞానముగలవాడు దానిని శాంతిపరచును'", "Proverbs 16:14", "\"As messengers of death is the king's wrath, but a wise man will pacify it\"", "\"రాజు క్రోధము మరణదూత వంటిది, జ్ఞానముగలవాడు దానిని శాంతిపరచును (సమాధానపరచును)\"", "Tactful wisdom diffuses explosive royal rage, securing life and peace.", "జ్ఞానముగల మాటలు అధికారుల తీవ్ర క్రోధమును సైతం శాంతింపజేసి ప్రాణములను కాపాడును."],
    ["Ecclesiastes 10:4 on if the spirit of the ruler rises against you, do not leave your post; for conciliation pacifies great offenses", "ప్రసంగి 10:4 శాంతము తెచ్చు సమాధానము: 'అధికారి నీమీద కోపపడినను నీ స్థలమును విడిచిపోకుము; శాంతపరచుట గొప్ప తప్పిదములను పరిహరించును'", "Ecclesiastes 10:4", "\"If the spirit of the ruler rises against you, do not leave your post; for conciliation pacifies great offenses\"", "\"అధికారి నీమీద కోపపడినను నీ స్థలమును విడిచిపోకుము; శాంతపరచుట (సమాధానపరచుట) గొప్ప తప్పిదములను పరిహరించును\"", "Gentle, humble conciliation covers immense faults and restores relational tranquility.", "శాంతస్వభావము మరియు నమ్రతగల ప్రవర్తన పెద్ద వివాదములను సైతం పరిష్కరించి సమాధానమును తెచ్చును."],
    ["Isaiah 59:8 the indictment of unregenerate culture: 'The way of peace they have not known, and there is no justice in their ways'", "యెషయా 59:8 పాపపు సమాజపు స్థితి: 'సమాధానమార్గము వారు ఎరుగరు, వారి నడతలలో న్యాయము లేదు'", "Isaiah 59:8", "\"The way of peace they have not known, and there is no justice in their ways; they have made themselves crooked paths; whoever takes that way shall not know peace\"", "\"సమాధానమార్గము వారు ఎరుగరు, వారి నడతలలో న్యాయము లేదు; వారు తమకొరకు వంకరత్రోవలను చేసికొనియున్నారు, వాటిలో నడుచువాడెవడును సమాధానము ఎరుగడు\"", "Injustice inherently destroys peace; corrupt shortcuts invariably lead to permanent turmoil.", "న్యాయము లేనిచోట సమాధానము ఉండదు; వంకర మార్గములలో నడుచువాడు శాంతిని ఎన్నడును పొందలేడు."],
    ["Jeremiah 6:14 rebuking false prophets who cry 'Peace, peace!' when there is no peace", "యిర్మీయా 6:14 అబద్ధ ప్రవచన ఖండన: 'సమాధానము లేనప్పుడు సమాధానము సమాధానమని చెప్పుచు నా ప్రజల గాయమును పైపైననే బాగుచేయుదురు'", "Jeremiah 6:14", "\"They have also healed the hurt of My people slightly, saying, 'Peace, peace!' When there is no peace\"", "\"సమాధానము లేనప్పుడు సమాధానము సమాధానమని చెప్పుచు, నా ప్రజల గాయమును పైపైననే బాగుచేయుదురు; వారు అసహ్యమైన కార్యములు చేసియు సిగ్గుపడలేదు\"", "Superficial positive thinking that ignores sin is spiritual malpractice; true peace requires deep repentance.", "పాపమును గద్దించక పైపైన 'సమాధానము సమాధానము' అని పలికే అబద్ధ ప్రవచనములను నమ్మరాదు."],
    ["Jeremiah 8:11 repeating the solemn warning against counterfeit ministerial peace", "యిర్మీయా 8:11 కపట సమాధానముపై రెండవ హెచ్చరిక", "Jeremiah 8:11", "\"For they have healed the hurt of the daughter of My people slightly, saying, 'Peace, peace!' When there is no peace\"", "\"సమాధానము లేనప్పుడు సమాధానము సమాధానమని చెప్పుచు, వారు నా ప్రజల గాయమును పైపైననే బాగుచేయుదురు\"", "Rebuking religious leaders who paper over moral rot with false promises of comfort.", "పాపమును సరిదిద్దకుండా సమాధానమును ప్రకటించే బోధకులు ప్రజలను నాశనములోనికి నడిపింతురు."],
    ["Zechariah 8:12 on the seed being prosperous, the vine yielding its fruit, the ground giving increase: 'In these days I will cause the remnant to possess all these in peace'", "జెకర్యా 8:12 సమృద్ధియైన సమాధానము: 'సమాధానకరమైన విత్తనము విత్తబడును, ద్రాక్షావల్లి ఫలించును, భూమి పంటనిచ్చును; ఈ శేషించిన ప్రజలకు వాటన్నిటిని స్వాధీనపరచెదను'", "Zechariah 8:12", "\"For the seed shall be prosperous, the vine shall give its fruit, the ground shall give her increase, and the heavens shall give their dew-I will cause the remnant of this people to possess all these\"", "\"సమాధానకరమైన విత్తనము విత్తబడును, ద్రాక్షావల్లి ఫలమిచ్చును, భూమి తన పంటనిచ్చును, ఆకాశము తన మంచును కురిపించును; ఈ శేషించిన ప్రజలకు వాటన్నిటిని స్వాధీనపరచెదను\"", "Messianic agriculture: peace in the land brings abundant harvests, dew from heaven, and secure inheritance.", "దేవుని సమాధానము నేలలో పంటలను ఫలింపజేసి ఆకాశమునుండి మంచును కురిపించి ప్రజలను సమృద్ధిగా దీవించును."]
  ];

  return extra.map(item => ({
    easyQ: `What eschatological doctrine or cosmic revelation of eternal peace is established in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన యుగాంతపు ప్రవచనము లేదా నిత్య సమాధాన సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does Christ's eternal kingdom permanently abolish war, conflict, and the curse of sin?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం క్రీస్తు రాజ్యము సమస్త యుద్ధములను మరియు పాపపు శాపములను ఎలా శాశ్వతముగా తుడిచివేయును?`,
    hardQ: `What theological reality does ${item[2]} establish regarding cosmic reconciliation, the new creation, and the beatific peace of the saints?`,
    hardQTe: `${item[2]} ప్రకారం సర్వ సృష్టి సమాధానపడుటను మరియు పరిశుద్ధుల నిత్య పరలోక శాంతిని గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty bronze watchtowers across the plain of Megiddo", "He commanded seventy days of silent lamentation in Babylon", "He instituted sixty silver trumpets sounded at the river Euphrates"],
    optionsTelugu: [item[4], "మెగిద్దో మైదానములో నలభై ఇత్తడి కావలి గోపురములను నిర్మించెను", "బబులోనులో డెబ్బై దినముల మౌన రోదనను విధించెను", "యూఫ్రటీసు నదియొద్ద అరవై వెండి బూరలను ఊదవలెనని ఆజ్ఞాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

const fFacts = buildPeaceFoundation();
const gFacts = buildPeaceGrowth();
const mFacts = [...buildPeaceMastery(), ...getAdditionalPeaceMastery40()];

console.log(`Peace Foundation facts count: ${fFacts.length}`);
console.log(`Peace Growth facts count: ${gFacts.length}`);
console.log(`Peace Mastery facts count: ${mFacts.length}`);

buildBank('Peace', 'pea', fFacts, gFacts, mFacts);
