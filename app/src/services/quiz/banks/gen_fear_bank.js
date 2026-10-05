const { buildBank } = require('./bank_builder.js');

// 50 Foundation Facts for Fear (Key narratives, "Fear Not" promises, deliverance from terror, holy reverence)
function buildFearFoundation() {
  const data = [
    [
      "Isaiah 41:10 God's universal antidote to fear: 'Fear not, for I am with you; be not dismayed, for I am your God'",
      "యెషయా 41:10 భయమునకు దేవుడు ఇచ్చిన పరమ ఔషధము: 'భయపడకుము నేను నీకు తోడైయున్నాను, దిగులుపడకుము నేను నీ దేవుడనై యున్నాను'",
      "Isaiah 41:10",
      "Fear not, for I am with you; be not dismayed, for I am your God. I will strengthen you, yes, I will help you, I will uphold you with My righteous right hand",
      "భయపడకుము నేను నీకు తోడైయున్నాను, దిగులుపడకుము నేను నీ దేవుడనై యున్నాను; నేను నిన్ను బలపరతును నీకు సహాయము చేయువాడను నేనే, నా నీతియను దక్షిణహస్తముతో నిన్ను ఆదుకొందును",
      "God dispels human fear not by removing every hardship, but by pledging His personal, indwelling presence and righteous upholding hand.",
      "దేవుడు మనకు తోడైయుండి తన నీతిగల దక్షిణహస్తముతో ఆదుకొనునను నిశ్చయత సమస్త భయములను మరియు దిగుళ్లను పారద్రోలును."
    ],
    [
      "2 Timothy 1:7 declaring the divine nature of the Spirit: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind'",
      "2 తిమోతి 1:7 పరిశుద్ధాత్మ స్వభావమును చాటుచు: 'దేవుడు మనకు భయముగల ఆత్మను ఇవ్వలేదు గాని శక్తియు ప్రేమయు నిబ్బరముగల మనస్సును ఇచ్చెను'",
      "2 Timothy 1:7",
      "For God has not given us a spirit of fear, but of power and of love and of a sound mind",
      "దేవుడు మనకు భయముగల ఆత్మను ఇయ్యలేదు గాని శక్తియు ప్రేమయు నిబ్బరముగల మనస్సును ఇచ్చెను",
      "Paralyzing fear is demonic in origin; the Holy Spirit imparts supernatural power, self-sacrificing love, and disciplined mental clarity.",
      "పిరికితనము మరియు భయము దేవునివలన కలుగునవి కావు; దేవుడిచ్చిన ఆత్మ శక్తిని, ప్రేమను, ఆలోచనా స్థిరత్వమును మనలో నింపును."
    ],
    [
      "Psalm 27:1 David's opening triumphal declaration: 'The Lord is my light and my salvation; whom shall I fear?'",
      "కీర్తన 27:1 దావీదు విజయ గర్జన: 'యెహోవా నాకు వెలుగును రక్షణయునై యున్నాడు, నేను ఎవరికి భయపడుదును?'",
      "Psalm 27:1",
      "The Lord is my light and my salvation; whom shall I fear? The Lord is the strength of my life; of whom shall I be afraid?",
      "యెహోవా నాకు వెలుగును రక్షణయునై యున్నాడు, నేను ఎవరికి భయపడుదును? యెహోవా నా ప్రాణదుర్గము, నేను ఎవరికి వెరతును?",
      "When God is our radiant light banishing darkness and our fortress safeguarding life, fear is stripped of all rational authority.",
      "యెహోవాయే మన వెలుగు, రక్షణ మరియు ప్రాణదుర్గమై యుండగా ఈ లోకములో ఏ శత్రువునకును భయపడవలసిన పనిలేదు."
    ],
    [
      "Joshua 1:9 God's mandate to Joshua stepping into Moses' shoes: 'Have I not commanded you? Be strong and of good courage; do not be afraid'",
      "యెహోషువ 1:9 మోషే తరువాత నాయకత్వము వహించిన యెహోషువకు దేవుని ఆజ్ఞ: 'నేను నీకాజ్ఞాపించి యున్నాను గదా, నిబ్బరము కలిగి ధైర్యముగా ఉండుము; భయపడకుము'",
      "Joshua 1:9",
      "Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the Lord your God is with you wherever you go",
      "నేను నీకాజ్ఞాపించి యున్నాను గదా, నిబ్బరము కలిగి ధైర్యముగా ఉండుము, దిగులుపడకుము, భయపడకుము; నీవు నడుచు మార్గమంతటిలో నీ దేవుడైన యెహోవా నీకు తోడైయుండును",
      "Courage is not the absence of danger but obedience to God's command backed by His omnipresent companionship.",
      "ఎదురుగా యొర్దాను నది, యెరికో కోటలు ఉన్నను దేవుని తోడ్పాటును నమ్మి భయపడక ధైర్యముతో ముందుకు సాగుటయే విశ్వాస లక్షణము."
    ],
    [
      "Psalm 56:3-4 David in Gath among the Philistines: 'Whenever I am afraid, I will trust in You... I will not fear. What can flesh do to me?'",
      "కీర్తన 56:3-4 ఫిలిష్తీయులమధ్య గాతులో దావీదు చేసిన ప్రార్థన: 'నాకు భయము కలుగు దినమున నేను నిన్ను నమ్ముకొందును; నరులు నాకేమి చేయగలరు?'",
      "Psalm 56:3-4",
      "Whenever I am afraid, I will trust in You. In God (I will praise His word), in God I have put my trust; I will not fear. What can flesh do to me?",
      "నాకు భయము కలుగు దినమున నేను నిన్ను నమ్ముకొందును. దేవునిబట్టి నేను ఆయన మాటను స్తుతించెదను, దేవునియందు నమ్మికయుంచియున్నాను, నేను భయపడను; శరీరులు నాకేమి చేయగలరు?",
      "Faith is the deliberate choice to redirect the terrified heart toward praising God's trustworthy word in times of mortal danger.",
      "భయము ఎదురైన క్షణములోనే దేవుని వాగ్దానమును ధ్యానించి ఆయనపై నమ్మకముంచుట ద్వారా మానవ భయము అదృశ్యమగును."
    ],
    [
      "Psalm 91:5-6 the shield against nocturnal dread: 'You shall not be afraid of the terror by night, nor of the arrow that flies by day'",
      "కీర్తన 91:5-6 సమస్త భయములనుండి దైవిక కవచము: 'రాత్రివేళ కలుగు భయమునకైనను పగటివేళ ఎగురు బాణమునకైనను నీవు భయపడకుందువు'",
      "Psalm 91:5-6",
      "You shall not be afraid of the terror by night, nor of the arrow that flies by day, nor of the pestilence that walks in darkness, nor of the destruction that lays waste at noonday",
      "రాత్రివేళ కలుగు భయమునకైనను, పగటివేళ ఎగురు బాణమునకైనను, చీకటిలో సంచరించు తెగులునకైనను, మధ్యాహ్నమందు పాడుచేయు రోగమునకైనను నీవు భయపడకుందువు",
      "Dwelling in the secret place of the Most High immunizes the believer from creeping night terror and daytime violence alike.",
      "మహోన్నతుని చాటున నివసించు భక్తుడు రాత్రివేళ చీకటి భయములకు గాని పగటివేళ శత్రువు బాణములకు గాని భయపడడు."
    ],
    [
      "Jesus rebuking the raging tempest on the Sea of Galilee and questioning the terrified disciples: 'Why are you fearful, O you of little faith?'",
      "గలలీ సముద్రముపై తుఫానును గద్దించి భయపడిన శిష్యులను చూచి 'అల్పవిశ్వాసులారా, ఎందుకు భయపడుచున్నారు?' అని యేసు ప్రశ్నించుట",
      "Matthew 8:26; Mark 4:39-40",
      "He arose and rebuked the winds and the sea, and there was a great calm. But He said to them, 'Why are you so fearful? How is it that you have no faith?'",
      "ఆయన లేచి గాలులను సముద్రమును గద్దింపగా మిక్కిలి నిమ్మళమాయెను. అప్పుడాయన వారితో-మీరెందుకు ఇంత భయపడుచున్నారు? మీరింకను నమ్మికలేక యున్నారా? అని పలికెను",
      "Jesus reveals that sudden panic in earthly storms stems from forgetting that the Creator of wind and wave is inside the boat.",
      "సముద్రముపై అలలు ముంచివేయుచున్నను సమస్త సృష్టికర్తయైన యేసు తమతోనే ఉన్నాడని మరచి శిష్యులు భయపడిరి."
    ],
    [
      "Jesus walking across turbulent waves at the fourth watch of the night comforting terrified disciples: 'Be of good cheer! It is I; do not be afraid'",
      "రాత్రి నాలుగవ జామున అలలపై నడచివచ్చి దయ్యమని భయపడిన శిష్యులతో 'ధైర్యము తెచ్చుకొనుడి, నేనే, భయపడకుడి' అని యేసు పలికిన అభయము",
      "Matthew 14:27; John 6:20",
      "Immediately Jesus spoke to them, saying, 'Be of good cheer! It is I; do not be afraid'",
      "వెంటనే యేసు వారితో మాటలాడి-ధైర్యము తెచ్చుకొనుడి; నేనే, భయపడకుడి అని చెప్పెను",
      "In the darkest, stormiest hour, Christ treads upon the very waves that threaten to sink us, announcing His sovereign 'I AM'.",
      "మమ్మును ముంచివేయుననుకున్న అలలమీదనే నడచివచ్చి 'నేనే, భయపడకుడి' అని యేసు పలికిన మాట సర్వ భయములను శాంతింపజేసెను."
    ],
    [
      "The Angel Gabriel calming young Mary in Nazareth: 'Do not be afraid, Mary, for you have found favor with God'",
      "నజరేతులో యౌవనస్థురాలైన మరియను చూచి గాబ్రియేలు దూత 'మరియా, భయపడకుము, దేవునివలన నీవు కృపపొందితివి' అని పలికిన దర్శనము",
      "Luke 1:30",
      "Then the angel said to her, 'Do not be afraid, Mary, for you have found favor with God'",
      "దూత ఆమెను చూచి-మరియా, భయపడకుము; దేవునివలన నీవు కృపపొందితివి అని చెప్పెను",
      "Heavenly encounters shatter earthly expectations, but divine grace immediately dispels human trembling.",
      "దేవదూత ప్రత్యక్షతకు నివ్వెరపోయిన మరియతో దేవుని కృప తోడుగా ఉన్నదనియు భయపడవద్దనియు పరలోక దూత ధైర్యపరిచెను."
    ],
    [
      "The Angel of the Lord to aged Zacharias ministering at the incense altar: 'Do not be afraid, Zacharias, for your prayer is heard'",
      "ధూపవేదికయొద్ద యాజక సేవచేయుచున్న జెకర్యాను చూచి దేవదూత 'జెకర్యా, భయపడకుము, నీ ప్రార్థన వినబడెను' అని పలికిన సమాధానము",
      "Luke 1:13",
      "The angel said to him, 'Do not be afraid, Zacharias, for your prayer is heard; and your wife Elizabeth will bear you a son, and you shall call his name John'",
      "దూత అతనితో-జెకర్యా, భయపడకుము, నీ ప్రార్థన వినబడినది; నీ భార్యయైన ఎలీసబెతు నీకు కుమారుని కనును, అతనికి యోహాను అను పేరు పెట్టుదువు అనెను",
      "God's long-delayed answer arrived in holy awe; the angel first dismantled fear so the promise could be embraced.",
      "ముసలితనములో సైతం ప్రార్థన మరచిపోని దేవుడు ఆలయములో దూతద్వారా భయమును తొలగించి వాగ్దాన కుమారుని శుభవార్తను ప్రకటించెను."
    ],
    [
      "The Angel of the Lord appearing to terrified shepherds on Bethlehem fields surrounded by glory: 'Do not be afraid, for behold, I bring you good tidings of great joy'",
      "బేత్లెహేము పొలములలో గొఱ్ఱెల కాపరులను దేవుని మహిమ చుట్టుముట్టగా 'భయపడకుడి, సర్వప్రజలకు కలుగు మహా సంతోషకరమైన సువార్తను మీకు తెలియజేయుచున్నాను' అని దూత పలికిన మాట",
      "Luke 2:10",
      "Then the angel said to them, 'Do not be afraid, for behold, I bring you good tidings of great joy which will be to all people'",
      "అయితే ఆ దూత-భయపడకుడి; ఇదిగో ప్రజలందరికిని కలుగబోవు మహా సంతోషకరమైన సువార్తను నేను మీకు తెలియజేయుచున్నాను",
      "The blinding glory of the Lord initially terrified humble shepherds, but the gospel message transforms terror into jubilant worship.",
      "పరలోకపు మహిమ వెలుగునకు భయపడి వణికిన గొఱ్ఱెల కాపరులకు రక్షకుని పుట్టుకయను మహా ఆనంద సువార్త వినిపించెను."
    ],
    [
      "The Angel at the empty tomb speaking to the weeping women: 'Do not be afraid, for I know that you seek Jesus who was crucified. He is not here; for He is risen'",
      "ఖాళీ సమాధియొద్ద ఏడ్చుచున్న స్త్రీలను చూచి దేవదూత 'మీరు భయపడకుడి, సిలువవేయబడిన యేసును మీరు వెదకుచున్నారని నాకు తెలియును; ఆయన ఇక్కడ లేడు, ఆయన లేచియున్నాడు' అని పలికిన దర్శనము",
      "Matthew 28:5-6",
      "The angel answered and said to the women, 'Do not be afraid, for I know that you seek Jesus who was crucified. He is not here; for He is risen, as He said'",
      "దూత ఆ స్త్రీలను చూచి-మీరు భయపడకుడి; సిలువవేయబడిన యేసును మీరు వెదకుచున్నారని నాకు తెలియును; ఆయన ఇక్కడ లేడు, తాను చెప్పినట్టే ఆయన లేచియున్నాడు",
      "The Roman guards shook with fear and became like dead men, while faithful women were liberated from fear by the fact of the resurrection.",
      "సమాధి కావలివారు భయముచేత చచ్చినవారివలె కాగా, భయపడకుడని దేవదూత స్త్రీలకు పునరుత్థాన జయవార్తను ప్రకటించెను."
    ],
    [
      "Moses at the Red Sea trapped by Pharaoh's chariots commanding panic-stricken Israel: 'Do not be afraid. Stand still, and see the salvation of the Lord'",
      "ఎర్రసముద్రము యెదుట ఫరో రథములను చూచి భయపడిన ప్రజలతో మోషే 'భయపడకుడి, ఊరక నిలువబడి యెహోవా మీకు కలుగజేయు రక్షణను చూడుడి' అని పలికిన ధైర్యము",
      "Exodus 14:13",
      "Moses said to the people, 'Do not be afraid. Stand still, and see the salvation of the Lord, which He will accomplish for you today. For the Egyptians whom you see today, you shall see again no more forever'",
      "మోషే-భయపడకుడి, యెహోవా మీకు నేడు కలుగజేయు రక్షణను మీరు ఊరక నిలువబడి చూడుడి; మీరు నేడు చూచిన ఐగుప్తీయులను ఇకమీదట ఎన్నటికిని చూడరు అని ప్రజలతో చెప్పెను",
      "Trapped between impassable waters and an approaching army, panic cries out, but faith commands stillness to watch God part the sea.",
      "ముందు సముద్రము వెనుక శత్రు సైన్యము ఉన్నను భయపడక నిశ్చలముగా నిలిచి దేవుని అద్భుత రక్షణను కనులారా చూచుట."
    ],
    [
      "God appearing to Abram in a vision after victorious battle: 'Do not be afraid, Abram. I am your shield, your exceedingly great reward'",
      "యుద్ధ విజయము తరువాత దర్శనములో అబ్రాముతో దేవుడు 'అబ్రామా, భయపడకుము; నేను నీకు కేడెమును బహు గొప్ప బహుమానమునై యున్నాను' అని పలికిన నిబంధన",
      "Genesis 15:1",
      "After these things the word of the Lord came to Abram in a vision, saying, 'Do not be afraid, Abram. I am your shield, your exceedingly great reward'",
      "ఈ సంగతులు జరిగిన తరువాత యెహోవా వాక్యము దర్శనమందు అబ్రామునకు వచ్చి-అబ్రామా, భయపడకుము; నేను నీకు కేడెమును బహు గొప్ప బహుమానమునై యున్నానని సెలవిచ్చెను",
      "Fearing retaliation from Mesopotamian kings, Abram was comforted that God Himself, not military alliances, is his impenetrable armor.",
      "శత్రువుల ప్రతీకారమునకు భయపడవద్దనియు, దేవుడే స్వయముగా అతనికి రక్షణ కేడెమును సర్వోన్నత బహుమానమునై యున్నాడనియు ధైర్యపరచెను."
    ],
    [
      "God calling to destitute Hagar weeping over dying Ishmael in the desert of Beersheba: 'What ails you, Hagar? Fear not, for God has heard the voice of the lad'",
      "బేర్షెబా అరణ్యములో దాహముతో చనిపోవుచున్న బిడ్డను చూచి ఏడ్చుచున్న హాగరుతో దేవుడు 'హాగరూ, నీకేమి వచ్చినది? భయపడకుము, దేవుడు ఆ చిన్నవాని మొరను వినియున్నాడు' అని పలికిన జాలి",
      "Genesis 21:17",
      "God heard the voice of the lad. Then the angel of God called to Hagar out of heaven, and said to her, 'What ails you, Hagar? Fear not, for God has heard the voice of the lad where he is'",
      "దేవుడు ఆ చిన్నవాని మొరను వినెను; అప్పుడు దేవదూత ఆకాశమునుండి హాగరును పిలిచి-హాగరూ, నీకేమి వచ్చినది? భయపడకుము, ఆ చిన్నవాడున్న చోట దేవుడు వాని మొరను వినియున్నాడు అని సెలవిచ్చెను",
      "In the hopeless desert of abandoned despair, divine compassion heard a child's faint cry and opened eyes to a spring of fresh water.",
      "దిక్కులేని అరణ్యములో మరణ భయముతో ఏడ్చిన దాసి కన్నీటిని చూచి భయపడవద్దని నీటి ఊటను చూపించిన దేవుని వాత్సల్యము."
    ],
    [
      "God reassuring Isaac at Beersheba amid Philistine hostility: 'I am the God of your father Abraham; do not fear, for I am with you'",
      "ఫిలిష్తీయుల వివాదములమధ్య బేర్షెబాలో ఇస్సాకుతో దేవుడు 'నేను నీ తండ్రియైన అబ్రాహాము దేవుడను; భయపడకుము, నేను నీకు తోడైయున్నాను' అని పలికిన వాగ్దానము",
      "Genesis 26:24",
      "The Lord appeared to him the same night and said, 'I am the God of your father Abraham; do not fear, for I am with you. I will bless you and multiply your descendants'",
      "ఆ రాత్రియే యెహోవా అతనికి ప్రత్యక్షమై-నేను నీ తండ్రియైన అబ్రాహాము దేవుడను, భయపడకుము; నేను నీకు తోడైయుండి నిన్ను ఆశీర్వదించి నా దాసుడైన అబ్రాహామునుబట్టి నీ సంతానమును విస్తరింపజేసెదననెను",
      "Inheriting his father's covenant, gentle Isaac received the identical assurance of divine presence that extinguished generational fear.",
      "శత్రువులు బావులను పూడ్చివేసినను దేవుని తోడ్పాటును నమ్మి భయపడక సమాధానముతో నివసించిన ఇస్సాకు ఆశీర్వాదము."
    ],
    [
      "Jacob trembling before meeting estranged Esau crying out in prayer at the Jabbok: 'Deliver me, I pray, from the hand of my brother... for I fear him'",
      "నాలుగువందలమందితో వచ్చుచున్న ఏశావును ఎదుర్కొనుటకు ప్రాణభయముతో వణికిన యాకోబు యబ్బోకు రేవున 'నా సహోదరుని చేతిలోనుండి నన్ను రక్షించుము, నేను అతనికి భయపడుచున్నాను' అని చేసిన ప్రార్థన",
      "Genesis 32:11",
      "Deliver me, I pray, from the hand of my brother, from the hand of Esau; for I fear him, lest he come and attack me and the mother with the children",
      "నా సహోదరుడైన ఏశావు చేతిలోనుండి దయచేసి నన్ను తప్పించుము; అతడు వచ్చి పిల్లలతోకూడ తల్లులను నన్ను కొట్టునేమో అని నేను అతనికి భయపడుచున్నాను",
      "Paralyzing guilt over past deceit magnified fear, driving Jacob to spend the night wrestling with God until he was blessed and reconciled.",
      "గత పాపపు భయము యాకోబును వెంటాడినప్పుడు అతడు దేవుని పాదములు పట్టుకొని ప్రార్థించగా దేవుడు ఏశావు హృదయమును మార్చెను."
    ],
    [
      "Joseph soothing the dread of his guilty brothers after Jacob's death: 'Do not be afraid, for am I in the place of God? You meant evil against me, but God meant it for good'",
      "తండ్రి చనిపోయిన తరువాత ప్రతీకారము తీర్చుకొనునేమో అని భయపడిన అన్నలతో యోసేపు 'భయపడకుడి, నేను దేవుని స్థానమందున్నానా? మీరు నాకు కీడు చేయనుద్దేశించితిరి గాని దేవుడు దానిని మేలుగా మార్చెను' అని పలికిన శాంతి",
      "Genesis 50:19-20",
      "Joseph said to them, 'Do not be afraid, for am I in the place of God? But as for you, you meant evil against me; but God meant it for good, in order to bring it about as it is this day, to save many people alive'",
      "యోసేపు వారితో-భయపడకుడి; నేను దేవుని స్థానమందున్నానా? మీరు నాకు కీడు చేయనుద్దేశించితిరి గాని అనేక ప్రజలను బ్రదికించునట్లుగా... దేవుడు దానిని మేలుకే ఉద్దేశించెను",
      "Sovereign theological perspective dispels interpersonal paranoia and retaliatory fear, turning past evil into providential preservation.",
      "పగతీర్చుకొనుటకు బదులుగా దేవుని సంకల్పమును గుర్తించి భయపడిన అన్నలను ప్రేమతో ఆదరించి పోషించిన యోసేపు క్షమాగుణము."
    ],
    [
      "Moses charging Joshua and the assembly of Israel on the plains of Moab: 'The Lord, He is the One who goes before you... do not fear nor be dismayed'",
      "మోయాబు మైదానములో యెహోషువను సమాజమును చూచి మోషే 'నీ ముందర నడుచువాడు యెహోవాయే, ఆయన నీకు తోడైయుండును; భయపడకుము, దిగులుపడకుము' అని పలికిన కడపటి వీడ్కోలు",
      "Deuteronomy 31:8",
      "And the Lord, He is the One who goes before you. He will be with you, He will not leave you nor forsake you; do not fear nor be dismayed",
      "నీ ముందర నడుచువాడు యెహోవాయే; ఆయన నీకు తోడైయుండును, ఆయన నిన్ను విడువడు నిన్ను ఎడబాయడు; భయపడకుము, దిగులుపడకుము",
      "Transition of leadership produces natural anxiety, but Moses anchored Israel's confidence in the divine Vanguard who marches ahead.",
      "నాయకుడు మారినను దేవుని నడిపింపు మారదు; యెహోవాయే మన ముందు నడుచువాడై యుండగా ఏ భయమునకు తావులేదు."
    ],
    [
      "Young David defying the giant Goliath whose mocking threats terrorized the entire army of Israel: 'I come to you in the name of the Lord of hosts'",
      "ఇశ్రాయేలు సైన్యమంతటిని నలభై దినములు భయకంపితము చేసిన గొల్యాతును చూచి 'సైన్యములకధిపతియైన యెహోవా నామమున నేను నీయొద్దకు వచ్చుచున్నాను' అని దావీదు సాగించిన విజయ పోరాటము",
      "1 Samuel 17:45",
      "Then David said to the Philistine, 'You come to me with a sword, with a spear, and with a javelin. But I come to you in the name of the Lord of hosts, the God of the armies of Israel, whom you have defied'",
      "దావీదు ఆ ఫిలిష్తీయునితో-నీవు కత్తియు ఈటెయు బల్లెమును ధరించుకొని నాయొద్దకు వచ్చుచున్నావు; అయితే నీవు తిరస్కరించిన ఇశ్రాయేలీయుల సైన్యముల దేవుడైన సైన్యములకధిపతియైన యెహోవా నామమున నేను నీయొద్దకు వచ్చుచున్నాను",
      "Physical giants paralyze worldly sight, but faith looks at Goliath in light of Almighty God and finds the giant minuscule.",
      "మానవ నేత్రములకు భయానకముగా కనిపించిన రాక్షసుని సైతం జీవముగల దేవుని నామముపై నమ్మకముంచి ఒక్క రాతితో నేలకూల్చిన దావీదు విశ్వాసము."
    ],
    [
      "Elisha praying for his terrified servant in besieged Dothan: 'Do not fear, for those who are with us are more than those who are with them'",
      "దోతాను పట్టణమును సిరియా సైన్యము చుట్టుముట్టగా భయపడిన సేవకుని కొరకు ఎలీషా 'భయపడకుము, వారికంటె మన పక్షమున ఉన్నవారు అనేకులు' అని ప్రార్థించి అగ్ని రథములను చూపించుట",
      "2 Kings 6:16-17",
      "He answered, 'Do not fear, for those who are with us are more than those who are with them.' And Elisha prayed, and said, 'Lord, I pray, open his eyes that he may see.' Then the Lord opened the eyes of the young man, and he saw... horses and chariots of fire",
      "అందుకు అతడు-భయపడకుము; మన పక్షమున ఉన్నవారు వారికంటె అనేకులనెను. ఎలీషా ప్రార్థనచేసి-యెహోవా, ఇతడు చూచునట్లు దయచేసి ఇతని కన్నులు తెరువుమనగా యెహోవా ఆ పనివాని కన్నులు తెరచెను; అతడు కొండ అంతయు ఎలీషా చుట్టును అగ్ని రథములతోను గుఱ్ఱములతోను నిండియుండుట చూచెను",
      "Fear vanishes when spiritual eyes are opened to perceive the invisible celestial hosts defending the saints of God.",
      "లౌకిక నేత్రములకు శత్రు సైన్యపు ముట్టడి కనిపించినను ఆత్మీయ నేత్రములు తెరవబడినప్పుడు దేవుని అగ్ని రథముల రక్షణ దర్శనమగును."
    ],
    [
      "King Jehoshaphat standing before Judah when surrounded by a vast allied horde: 'Do not be afraid nor dismayed because of this great multitude, for the battle is not yours, but God's'",
      "మోయాబీయులు అమ్మోనీయుల మహా సైన్యము విరుచుకుపడినప్పుడు యెహోషాపాతు ప్రజలతో 'ఈ గొప్ప సైన్యమునకు భయపడకుడి దిగులుపడకుడి, యుద్ధము మీది కాదు దేవునిదే' అని పలికిన ప్రవచన ధైర్యము",
      "2 Chronicles 20:15",
      "And he said, 'Listen, all you of Judah and you inhabitants of Jerusalem, and you, King Jehoshaphat! Thus says the Lord to you: Do not be afraid nor dismayed because of this great multitude, for the battle is not yours, but God's'",
      "అతడు ఇట్లనెను-యూదావారలారా, యెరూషలేము కాపురస్థులారా, రాజైన యెహోషాపాతు, మీరందరును ఆలకించుడి; యెహోవా మీకీలాగు సెలవిచ్చుచున్నాడు-ఈ గొప్ప సైన్యమునకు మీరు భయపడకుడి, అధైర్యపడకుడి; ఈ యుద్ధము మీరు కాదు దేవుడే జరిగించును",
      "When mortal resources are overwhelmed, holy worship takes the lead; God fights the battle while His people sing praises.",
      "మహా సైన్యమును చూచి ఉపవాసముండి ప్రార్థించినప్పుడు 'యుద్ధము దేవునిదే' అను వాక్యముతో స్తుతిగానము చేసి రక్షణ పొందిన యెహోషాపాతు అనుభవము."
    ],
    [
      "King Hezekiah fortifying Jerusalem against the terrifying assault of Sennacherib: 'Be strong and courageous; do not be afraid... for there are more with us than with him'",
      "అష్షూరు రాజైన సన్హెరీబు బెదిరింపులకు గురైన యెరూషలేము ప్రజలను చూచి హిజ్కియా 'ధైర్యము వహించి నిబ్బరముగా ఉండుడి, భయపడకుడి; అతనికున్నది మాంసపు బాహువే, మనకు సహాయము చేయుటకు మన దేవుడైన యెహోవా ఉన్నాడు' అని ధైర్యపరచుట",
      "2 Chronicles 32:7-8",
      "Be strong and courageous; do not be afraid nor dismayed before the king of Assyria, nor before all the multitude that is with him; for there are more with us than with him. With him is an arm of flesh; but with us is the Lord our God, to help us and to fight our battles",
      "నిబ్బరము కలిగి ధైర్యముగా ఉండుడి; అష్షూరు రాజుకైనను అతనితో కూడనున్న సైన్యమంతటికైనను భయపడకుడి, విస్మయమొందకుడి; అతనికున్నది మాంసపు బాహువే, మనకు సహాయము చేయుటకును మన యుద్ధములను జరిగించుటకును మన దేవుడైన యెహోవా మనకు తోడైయున్నాడు",
      "Worldly tyrants rely upon the fragile arm of human flesh, which shatters instantly before the living God who fights for His people.",
      "అపారమైన అష్షూరు సైన్యము కేవలము మాంసపు బాహువనియు, మన పక్షమున యుద్ధము చేయువాడు సర్వశక్తిగల దేవుడనియు నమ్మి భయమును జయించుట."
    ],
    [
      "Daniel sleeping peacefully in the lions' den, untouched by the ferocious beasts: 'My God sent His angel and shut the lions' mouths'",
      "రాజు ఆజ్ఞకు భయపడక ప్రార్థించి సింహముల గుహలో పడవేయబడినను దేవుని దూతచేత సింహముల నోళ్లు మూయించబడిన దానియేలు నిర్భయ విశ్వాసము",
      "Daniel 6:22",
      "My God sent His angel and shut the lions' mouths, so that they have not hurt me, because I was found innocent before Him; and also, O king, I have done no wrong before you",
      "నేను ఆయన దృష్టికి నిర్దోషినిగా కనబడితిని గనుకను, రాజా, నీ దృష్టికి నేను ఏ తప్పిదమును చేసినవాడను కాను గనుకను, నా దేవుడు తన దూతను పంపి సింహములు నాకు ఏ హానియు చేయకుండ వాటి నోళ్లు మూయించెను",
      "Uncompromising faithfulness to God conquers the terror of savage predators; angels stand sentinel around the blameless.",
      "మనుష్యుల చట్టములకు బెదిరింపులకు భయపడక దేవునికి ప్రార్థించిన దానియేలును సింహముల నోటినుండి దేవుని దూత అద్భుతముగా కాపాడెను."
    ],
    [
      "Shadrach, Meshach, and Abednego refusing to tremble before Nebuchadnezzar's seven-times heated furnace: 'Our God whom we serve is able to deliver us'",
      "ఏడంతలు వేడిచేయబడిన అగ్నిగుండమునకు భయపడక బంగారు విగ్రహమునకు నమస్కరింపనొల్లని షద్రకు మేషకు అబేద్నెగోల నిర్భయ సాక్ష్యము",
      "Daniel 3:17-18",
      "Our God whom we serve is able to deliver us from the burning fiery furnace, and He will deliver us from your hand, O king. But if not, let it be known to you... that we do not serve your gods",
      "మేము సేవించుచున్న మా దేవుడు మండుచున్న వేడిమిగల యీ అగ్నిగుండములోనుండి మమ్మును రక్షించుటకు సమర్థుడు; మరియు ఆయన నీ చేతిలోనుండి మమ్మును విడిపించును; విడిపింపకపోయినను... మేము నీ దేవతలను పూజింపము",
      "True courage is not dependent upon guaranteed rescue, but upon wholehearted allegiance to God even unto the flames.",
      "దేవుడు అగ్నిగుండములోనుండి రక్షించినను రక్షింపకపోయినను విగ్రహమునకు మొక్కబోమని మరణభయమును తృణీకరించిన యౌవనుల విశ్వాస శిఖరము."
    ],
    [
      "Nehemiah refusing to hide in the temple when warned of an assassination plot: 'Should such a man as I flee? And who is there such as I who would go into the temple to save his life?'",
      "ప్రాణహత్య బెదిరింపులకు భయపడి దేవాలయములో దాగుకొనుమని శత్రువులు కుట్రపన్నగా 'నాలాంటివాడు పారిపోవునా?' అని గర్జించిన నెహెమ్యా ధైర్యము",
      "Nehemiah 6:11",
      "And I said, 'Should such a man as I flee? And who is there such as I who would go into the temple to save his life? I will not go in!'",
      "అందుకు నేను-నాలాంటివాడు పారిపోవునా? నాలాంటివాడెవడైనను ప్రాణము దక్కించుకొనుటకై దేవాలయములో చొచ్చునా? నేను పోను అంటిని",
      "A leader motivated by God's honor refuses to let manufactured terror compromise his post or violate holy ordinances.",
      "శత్రువులు భయపెట్టి నిరుత్సాహపరచాలని చూచినను దేవుని ప్రాకార నిర్మాణ పనిని విడిచి పారిపోనని నిలిచిన నెహెమ్యా స్థైర్యము."
    ],
    [
      "Esther risking her life to enter King Ahasuerus's presence uninvited to save her condemned people: 'If I perish, I perish!'",
      "పిలువబడకుండ అంతఃపురములోనికి వెళ్లినయెడల మరణశిక్ష విధించబడునని తెలిసియు 'నేను నశించిన నశించెదను' అని ప్రాణమును పణముగా పెట్టిన ఎస్తేరు సాహసము",
      "Esther 4:16",
      "Go, gather all the Jews who are present in Shushan, and fast for me... and so I will go to the king, which is against the law; and if I perish, I perish!",
      "నీవు వెళ్లి షూషనులో కనబడిన యూదులనందరిని సమకూర్చి, నాకొరకు ఉపవాసముండుడి... నేనును నా పనికత్తెలును ఉపవాసముందుము; తరువాత నేను చట్టమును మీరి రాజునొద్దకు ప్రవేశించెదను, నేను నశించిన నశించెదను",
      "Overcoming the natural dread of execution through fasting, intercession, and sacrificial surrender for the redemption of God's people.",
      "తన జాతి సర్వనాశనము కాకుండా కాపాడుటకు మరణ భయమును సైతం పక్కనబెట్టి ఉపవాస ప్రార్థనతో రాజు సముఖమునకు వెళ్లిన ఎస్తేరు త్యాగము."
    ],
    [
      "Jesus consoling the synagogue ruler Jairus after receiving news that his daughter had died: 'Do not be afraid; only believe, and she will be made well'",
      "తన కుమార్తె చనిపోయినదని వర్తమానము వచ్చినప్పుడు సమాజమందిరపు అధికారియైన యాయీరుతో 'భయపడకుము, నమ్మికమాత్రముంచుము, ఆమె బాగుపడును' అని యేసు పలికిన అభయము",
      "Luke 8:50; Mark 5:36",
      "When Jesus heard it, He answered him, saying, 'Do not be afraid; only believe, and she will be made well'",
      "యేసు ఆ మాట విని-భయపడకుము, నమ్మికమాత్రముంచుము, ఆమె బాగుపడునని అతనితో చెప్పెను",
      "Even when the worst earthly catastrophe (death) strikes, Christ commands faith to displace fear, culminating in resurrecting victory.",
      "వైద్యమునకు అందని మరణ ఘడియలో సైతం భయమునకు తావియ్యక నమ్మికమాత్రముంచినప్పుడు యేసు ఆ బాలికను బ్రతికించెను."
    ],
    [
      "Jesus teaching the proper hierarchy of reverence: 'Do not fear those who kill the body but cannot kill the soul. But rather fear Him who is able to destroy both soul and body in hell'",
      "శరీరమును చంపువారికి భయపడక ఆత్మను శరీరమును నరకములో నశింపజేయగల దేవునికే భయపడుడని యేసు బోధించిన పరమ సత్యము",
      "Matthew 10:28",
      "And do not fear those who kill the body but cannot kill the soul. But rather fear Him who is able to destroy both soul and body in hell",
      "శరీరమును చంపి ఆత్మను చంపనేరనివారికి భయపడకుడి గాని, ఆత్మను శరీరమును కూడ నరకములో నశింపజేయగలవానికే మిక్కిలి భయపడుడి",
      "The holy dread of God is the great liberator from human intimidation; tyrants can only touch mortal biology, not eternal destiny.",
      "మానవ హింసలకు భయపడక నిత్య ఆత్మను రక్షించగల పరలోకపు దేవునియందే పవిత్ర భయభక్తులు కలిగియుండుట."
    ],
    [
      "Jesus reassuring His vulnerable disciples regarding God's tender care: 'Do not fear, little flock, for it is your Father's good pleasure to give you the kingdom'",
      "అల్పులైన శిష్యులను చూచి 'చిన్న మందా, భయపడకుడి, మీకు రాజ్యము నిచ్చుటకు మీ తండ్రికి ఇష్టమైయున్నది' అని యేసు పలికిన పరమ ఆదరణ",
      "Luke 12:32",
      "Do not fear, little flock, for it is your Father's good pleasure to give you the kingdom",
      "చిన్న మందా, భయపడకుడి, మీకు రాజ్యము నిచ్చుటకు మీ తండ్రికి ఇష్టమైయున్నది",
      "Though earthly believers resemble defenseless sheep in a predatory world, the Sovereign Shepherd guarantees them the eternal kingdom.",
      "లోకములో బలహీనమైన చిన్న మందవలె కనిపించినను పరలోక రాజ్యమును స్వాస్థ్యముగా ఇచ్చుటకు దేవుడు ఇష్టపడుచున్నాడు గనుక భయములేదు."
    ],
    [
      "The Lord appearing to Paul in a vision during intense opposition at Corinth: 'Do not be afraid, but speak, and do not keep silent; for I am with you'",
      "కొరింథులో తీవ్ర వ్యతిరేకత ఎదురైనప్పుడు రాత్రి దర్శనములో పౌలుతో ప్రభువు 'భయపడకుము, మౌనముగా ఉండక మాట్లాడుము; నేను నీకు తోడైయున్నాను' అని పలికిన ధైర్యము",
      "Acts 18:9-10",
      "Now the Lord spoke to Paul in the night by a vision, 'Do not be afraid, but speak, and do not keep silent; for I am with you, and no one will attack you to hurt you; for I have many people in this city'",
      "రాత్రియందు ప్రభువు దర్శనముచేత పౌలుతో-నీవు భయపడక మాటలాడుము, మౌనముగా ఉండకుము; నేను నీకు తోడైయున్నాను, నీకు హాని చేయుటకు ఎవడును నీమీదికి రాడు; ఈ పట్టణములో నాకు బహుజనము కలరనెను",
      "Divine sovereignty overrules urban hostility; Christ guarantees safety to His ambassador so the gospel proclamation continues unhindered.",
      "సువార్త సేవలో ప్రాణభయము ఎదురైనప్పుడు ప్రభువే స్వయముగా దర్శనమిచ్చి తోడుగా ఉంటానని వాగ్దానము చేసి పౌలును బలపరచెను."
    ],
    [
      "The Angel standing beside Paul in the catastrophic Mediterranean hurricane: 'Do not be afraid, Paul; you must be brought before Caesar; and indeed God has granted you all those who sail with you'",
      "సముద్రములో పదునాలుగు దినములు సూర్యచంద్రులు కానరాని తుఫానులో పౌలు పక్కన దేవదూత నిలిచి 'పౌలా, భయపడకుము, నీవు కైసరు ఎదుట నిలువవలసియున్నది; ఓడలోని వారందరిని దేవుడు నీకు ఇచ్చియున్నాడు' అని పలికిన అభయము",
      "Acts 27:24",
      "Do not be afraid, Paul; you must be brought before Caesar; and indeed God has granted you all those who sail with you",
      "పౌలా, భయపడకుము; నీవు కైసరు ఎదుట నిలువవలసియున్నది; ఇదిగో నీతోకూడ ఓడలో ప్రయాణము చేయుచున్న వారినందరిని దేవుడు నీకు అనుగ్రహించియున్నాడు",
      "A shipwreck storm stripped 276 passengers of all hope, but one man's unshakable faith in God's 'Fear not' preserved every soul alive.",
      "ఓడ బ్రద్దలయ్యే భయంకర తుఫానులో సైతం దేవుని వాగ్దానపు ధైర్యముతో తోటి ప్రయాణికులందరిలో ఆశను నింపిన పౌలు విశ్వాసము."
    ],
    [
      "The glorified Christ placing His right hand upon the prostrated apostle John on Patmos: 'Do not be afraid; I am the First and the Last. I am He who lives, and was dead'",
      "పత్మాసు దీవిలో క్రీస్తు మహిమను చూచి చచ్చినవానివలె పడిన యోహానుపై ప్రభువు తన కుడిచేతిని ఉంచి 'భయపడకుము; నేను మొదటివాడను కడపటివాడను, జీవించువాడను; మృతిపొందితిని గాని యుగయుగములు సజీవుడనై యున్నాను' అని పలికిన పరమ దర్శనము",
      "Revelation 1:17-18",
      "He laid His right hand on me, saying to me, 'Do not be afraid; I am the First and the Last. I am He who lives, and was dead, and behold, I am alive forevermore. Amen. And I have the keys of Hades and of Death'",
      "ఆయన తన కుడిచేతిని నామీద ఉంచి నాతో ఇట్లనెను-భయపడకుము; నేను మొదటివాడను కడపటివాడను జీవించువాడను; మృతిపొందితిని గాని ఇదిగో యుగయుగములు సజీవుడనై యున్నాను; మరియు మరణముయొక్కయు పాతాళముయొక్కయు తాళపుచెవులు నా స్వాధీనములో ఉన్నవి",
      "The glorified Conqueror of death holds the keys to eternity; His comforting hand upon our shoulder eradicates every fear of mortality.",
      "మరణముయొక్కయు పాతాళముయొక్కయు తాళపుచెవులను చేతబట్టిన సజీవుడైన యేసుక్రీస్తు తన కుడిచేతిని మనపై ఉంచి సమస్త భయములను తొలగించును."
    ],
    [
      "Psalm 23:4 the pilgrim's anthem in mortal perils: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil; for You are with me'",
      "కీర్తన 23:4 మరణపు లోయలో విశ్వాసి విజయ గీతము: 'గాఢాంధకారపు లోయలో నేను సంచరించినను ఏ అపాయమునకు భయపడను, నీవు నాకు తోడైయుందువు'",
      "Psalm 23:4",
      "Yea, though I walk through the valley of the shadow of death, I will fear no evil; for You are with me; Your rod and Your staff, they comfort me",
      "గాఢాంధకారపు లోయలో నేను సంచరించినను ఏ అపాయమునకు భయపడను, నీవు నాకు తోడైయుందువు; నీ దుడ్డుకఱ్ఱయు నీ దండమును నన్ను ఆదరించును",
      "Shadows cannot harm; the presence of the Good Shepherd converts the most terrifying terrain into a guided path of safety.",
      "మరణపు నీడలు కమ్ముకున్న చీకటి లోయలలో సైతం మన మంచి కాపరియైన దేవుని తోడ్పాటును దుడ్డుకఱ్ఱను నమ్మి ఏ కీడునకు భయపడకుండుట."
    ],
    [
      "Psalm 34:4 David testifying to total psychological deliverance: 'I sought the Lord, and He heard me, and delivered me from all my fears'",
      "కీర్తన 34:4 సంపూర్ణ విడుదల గూర్చి దావీదు సాక్ష్యము: 'నేను యెహోవాయొద్ద విచారణచేయగా ఆయన నాకు ఉత్తరమిచ్చెను, నాకు కలిగిన భయములన్నిటిలోనుండి ఆయన నన్ను తప్పించెను'",
      "Psalm 34:4",
      "I sought the Lord, and He heard me, and delivered me from all my fears",
      "నేను యెహోవాయొద్ద విచారణచేయగా ఆయన నాకుత్తరమిచ్చెను, నాకు కలిగిన భయములన్నిటిలోనుండి ఆయన నన్ను తప్పించెను",
      "Prayer does not merely rescue us from external enemies, but liberates the internal soul from the torment of chronic phobias.",
      "దేవుని సన్నిధిలో మొరపెట్టినప్పుడు ఆయన కేవలము బాహ్య శత్రువుల నుండియే కాక హృదయమును పీడించే సమస్త అంతరంగిక భయములనుండి విడిపించును."
    ],
    [
      "Psalm 46:1-2 the fortress amidst cosmic upheaval: 'God is our refuge and strength, a very present help in trouble. Therefore we will not fear, even though the earth be removed'",
      "కీర్తన 46:1-2 సమస్త లోక విపత్తులలో ఆశ్రయము: 'దేవుడు మనకు ఆశ్రయమును దుర్గమునై యున్నాడు, ఆపత్కాలములో ఆయన నమ్ముకొనదగిన సహాయకుడు; కావున భూమి మారినను పర్వతములు కదిలినను మేము భయపడము'",
      "Psalm 46:1-2",
      "God is our refuge and strength, a very present help in trouble. Therefore we will not fear, even though the earth be removed, and though the mountains be carried into the midst of the sea",
      "దేవుడు మనకు ఆశ్రయమును దుర్గమునై యున్నాడు, ఆపత్కాలములో ఆయన నమ్ముకొనదగిన సహాయకుడు. కావున భూమి మారినను పర్వతములు సముద్రమధ్యమున కదిలినను మేము భయపడము",
      "Even if geopolitical orders dissolve and seismic nature collapses, the city of God stands unshakeable upon divine presence.",
      "భూకంపములు వచ్చి పర్వతములు సముద్రములో మునిగిపోయినను మనకు దుర్గమైన దేవుని సన్నిధిలో ఉన్నంతవరకు ఎన్నడును భయపడము."
    ],
    [
      "Psalm 112:7-8 describing the fearless stability of the righteous: 'He will not be afraid of evil tidings; his heart is steadfast, trusting in the Lord'",
      "కీర్తన 112:7-8 నీతిమంతుని అచంచల మనస్సు: 'వాడు దుర్వార్తకు జడియడు, యెహోవాను ఆశ్రయించి వాని హృదయము స్థిరముగా నుండును'",
      "Psalm 112:7-8",
      "He will not be afraid of evil tidings; his heart is steadfast, trusting in the Lord. His heart is established; he will not be afraid, until he sees his desire upon his enemies",
      "వాడు దుర్వార్తకు జడియడు, యెహోవాను ఆశ్రయించి వాని హృదయము స్థిరముగా నుండును; వాని హృదయము నిబ్బరముగా నుండును, వాడు భయపడడు",
      "The upright person does not flinch when sudden bad news arrives, because their emotional anchor is locked into God's sovereignty.",
      "హఠాత్తుగా చెడ్డ వార్తలు వచ్చినప్పుడు గుండె జారిపోక దేవునియందే హృదయమును స్థిరపరచుకొని నిబ్బరముగా ఉండే నీతిమంతుని ధన్యత."
    ],
    [
      "Psalm 118:6 the covenant defiance of human intimidation: 'The Lord is on my side; I will not fear. What can man do to me?'",
      "కీర్తన 118:6 మానవ బెదిరింపులను త్రోసిపుచ్చుచు: 'యెహోవా నా పక్షమున ఉన్నాడు, నేను భయపడను; నరులు నాకేమి చేయగలరు?'",
      "Psalm 118:6",
      "The Lord is on my side; I will not fear. What can man do to me? The Lord is for me among those who help me",
      "యెహోవా నా పక్షమున ఉన్నాడు, నేను భయపడను; నరులు నాకేమి చేయగలరు? నాకు సహాయము చేయువారిలో యెహోవా నా పక్షమున ఉన్నాడు",
      "Having the Almighty God as our personal ally renders all mortal threats ultimately toothless and temporary.",
      "సర్వసృష్టికర్తయైన యెహోవా మన పక్షమున నిలబడియుండగా మర్త్యులైన మనుష్యులు మనకు చేయగల హాని ఏదియు లేదు."
    ],
    [
      "Proverbs 3:25-26 wisdom guarding against sudden panic: 'Do not be afraid of sudden terror... for the Lord will be your confidence, and will keep your foot from being caught'",
      "సామెతలు 3:25-26 ఆకస్మిక భయమునకు విరుగుడు: 'ఆకస్మికముగా కలుగు భయమునకైనను భక్తిహీనులకు వచ్చు నాశనమునకైనను భయపడకుము; యెహోవా నీకు ఆధారమగును'",
      "Proverbs 3:25-26",
      "Do not be afraid of sudden terror, nor of trouble from the wicked when it comes; for the Lord will be your confidence, and will keep your foot from being caught",
      "ఆకస్మికముగా కలుగు భయమునకైనను భక్తిహీనులకు వచ్చు నాశనమునకైనను భయపడకుము; యెహోవా నీకు ఆధారమగును, నీ కాలు చిక్కుబడకుండ ఆయన నిన్ను కాపాడును",
      "True wisdom delivers from the hypervigilant anxiety of impending doom, knowing God personally guards our footsteps.",
      "హఠాత్తుగా విపత్తులు విరుచుకుపడినను దేవునియందు నమ్మకముంచి కాలు చిక్కుబడకుండ కాపాడబడు శాంతికరమైన జీవితము."
    ],
    [
      "Proverbs 29:25 the deadly trap of human intimidation: 'The fear of man brings a snare, but whoever trusts in the Lord shall be safe'",
      "సామెతలు 29:25 మనుష్యులకు భయపడుట తెచ్చు ఉరి: 'నరులకు భయపడుటవలన ఉరి వచ్చును, యెహోవాయందు నమ్మికయుంచువాడు సురక్షితముగా నుండును'",
      "Proverbs 29:25",
      "The fear of man brings a snare, but whoever trusts in the Lord shall be safe",
      "నరులకు భయపడుటవలన ఉరి వచ్చును, యెహోవాయందు నమ్మికయుంచువాడు సురక్షితముగా నుండును",
      "Obsessing over human opinions and threats traps the soul like an animal in a net; trusting God lifts one to an inaccessible high tower.",
      "మనుష్యుల మెప్పుకొరకు లేదా వారి బెదిరింపులకు లొంగిపోవుట ఆత్మీయ ఉరివంటిది; దేవునిపై ఆధారపడుటయే సంపూర్ణ సురక్షిత దుర్గము."
    ],
    [
      "Isaiah 12:2 the triumphal hymn of redemption: 'Behold, God is my salvation, I will trust and not be afraid; for Yah, the Lord, is my strength and song'",
      "యెషయా 12:2 రక్షణానంద కీర్తన: 'ఇదిగో దేవుడే నా రక్షణ, నేను భయపడక ఆయనను నమ్ముకొందును; యెహోవాయే నా బలము నా గానము'",
      "Isaiah 12:2",
      "Behold, God is my salvation, I will trust and not be afraid; for Yah, the Lord, is my strength and song; He also has become my salvation",
      "ఇదిగో దేవుడే నా రక్షణ, నేను భయపడక ఆయనను నమ్ముకొనుచున్నాను; యెహోవాయను ప్రభువే నా బలము నా గానము, ఆయన నాకు రక్షణాధారమాయెను",
      "Experiencing God's sovereign salvation turns fearful stuttering into melodic anthems of praise.",
      "దేవుడే స్వయముగా మన రక్షణ అయినప్పుడు భయము తొలగిపోయి హృదయములో ఆనంద గానము మరియు బలము వెల్లివిరియును."
    ],
    [
      "Isaiah 35:4 healing the trembling hearts: 'Say to those who are fearful-hearted, Be strong, do not fear! Behold, your God will come with vengeance... He will come and save you'",
      "యెషయా 35:4 పిరికి హృదయముగలవారికి ఓదార్పు: 'తత్తరిల్లు హృదయముగలవారితో ఇట్లనుడి-భయపడక ధైర్యముగా ఉండుడి, ఇదిగో మీ దేవుడు ప్రతికారము చేయుటకు వచ్చును, ఆయనే వచ్చి మిమ్మును రక్షించును'",
      "Isaiah 35:4",
      "Say to those who are fearful-hearted, 'Be strong, do not fear! Behold, your God will come with vengeance, with the recompense of God; He will come and save you'",
      "తత్తరిల్లు హృదయముగలవారితో ఇట్లనుడి-భయపడక ధైర్యముగా ఉండుడి, ఇదిగో మీ దేవుడు ప్రతికారము చేయుటకు వచ్చును, దేవుడు చేయు ప్రతికారము వచ్చును, ఆయన వచ్చి మిమ్మును రక్షించును",
      "Prophetic therapy commands trembling knees and fainting hearts to stand firm in the certainty of God's coming vindication.",
      "భయముతో తత్తరిల్లే హృదయములకు దేవుని ప్రత్యక్షత నూతన బలమును మరియు రక్షణ నిశ్చయతను అనుగ్రహించును."
    ],
    [
      "Isaiah 43:1-2 the pledge through deep waters and fire: 'Fear not, for I have redeemed you; I have called you by your name; you are Mine. When you pass through the waters, I will be with you'",
      "యెషయా 43:1-2 అగ్నిజలములలో దైవిక వాగ్దానము: 'భయపడకుము నేను నిన్ను విమోచించియున్నాను, పేరుపెట్టి నిన్ను పిలిచియున్నాను, నీవు నా సొత్తు; నీవు జలములలో బడి వెళ్లునప్పుడు నేను నీకు తోడైయుందును'",
      "Isaiah 43:1-2",
      "Fear not, for I have redeemed you; I have called you by your name; you are Mine. When you pass through the waters, I will be with you; and through the rivers, they shall not overflow you. When you walk through the fire, you shall not be burned",
      "భయపడకుము నేను నిన్ను విమోచించియున్నాను, పేరుపెట్టి నిన్ను పిలిచియున్నాను, నీవు నా సొత్తు. నీవు జలములలో బడి వెళ్లునప్పుడు నేను నీకు తోడైయుందును, నదులలో బడి వెళ్లునప్పుడు అవి నీమీద పొర్లిపారవు; నీవు అగ్నిమధ్యను నడుచునప్పుడు కాలిపోవు, జ్వాలలు నిన్ను దహింపవు",
      "Divine ownership ('you are Mine') renders believers indestructible; floods cannot drown and fire cannot burn those held by God.",
      "మనము దేవుని స్వంత సంపాద్యమై యున్నాము గనుక ఏ నదులైనను మనలను ముంచలేవు, ఏ అగ్నిజ్వాలలైనను మనలను కాల్చలేవు."
    ],
    [
      "Isaiah 44:2 the tender comfort to Jacob: 'Thus says the Lord who made you and formed you from the womb, who will help you: Fear not, O Jacob My servant'",
      "యెషయా 44:2 గర్భమున నిన్ను నిర్మించిన సృష్టికర్త మాట: 'నిన్ను సృజించి గర్భమున నిన్ను నిర్మించి నీకు సహాయము చేయు యెహోవా సెలవిచ్చునదేమనగా-నా సేవకుడవైన యాకోబూ, భయపడకుము'",
      "Isaiah 44:2",
      "Thus says the Lord who made you and formed you from the womb, who will help you: 'Fear not, O Jacob My servant; and you, Jeshurun, whom I have chosen'",
      "నిన్ను సృజించి గర్భమున నిన్ను నిర్మించి నీకు సహాయము చేయు యెహోవా ఈలాగు సెలవిచ్చుచున్నాడు-నా సేవకుడవైన యాకోబూ, నేను ఏర్పరచుకొనిన యెషూరూనూ, భయపడకుము",
      "The intimate Architect who knit our fragile bodies in the womb guarantees lifelong providential assistance, disarming fear.",
      "తల్లి గర్భములో మనలను విచిత్రముగా నిర్మించిన దేవుడే జీవితాంతము సహాయకుడై ఉండునని వాగ్దానము చేయుచున్నాడు."
    ],
    [
      "Isaiah 54:4 banishing historical shame: 'Do not fear, for you will not be ashamed; neither be disgraced, for you will not be put to shame; for you will forget the shame of your youth'",
      "యెషయా 54:4 గతకాలపు సిగ్గును తొలగించుచు: 'భయపడకుము నీవు సిగ్గుపడనక్కరలేదు, లజ్జపడకుము నీవు అవమానము పొందవు; నీ యౌవనకాలపు సిగ్గును నీవు మరచిపోవుదువు'",
      "Isaiah 54:4",
      "Do not fear, for you will not be ashamed; neither be disgraced, for you will not be put to shame; for you will forget the shame of your youth, and will not remember the reproach of your widowhood anymore",
      "భయపడకుము నీవు సిగ్గుపడనక్కరలేదు, లజ్జపడకుము నీవు అవమానము పొందవు; నీ యౌవనకాలపు సిగ్గును నీవు మరచిపోవుదువు, నీ వైధవ్యపు నిందను ఇకమీదట జ్ఞాపకము చేసికొనవు",
      "God redeems failing, barren, and disgraced history, assuring that covenant reconciliation completely buries past reproach.",
      "గతకాలపు వైఫల్యముల నిందలను అవమానములను దేవుడు సమూలముగా తుడిచివేసి నూతన గౌరవమును ఆనందమును ప్రసాదించును."
    ],
    [
      "Jeremiah 1:8 commissioning a trembling young prophet: 'Do not be afraid of their faces, for I am with you to deliver you, says the Lord'",
      "యిర్మీయా 1:8 యౌవనస్థుడైన యిర్మీయా ప్రవక్తకు దేవుని ధైర్యవచనము: 'వారి ముఖములకు భయపడకుము, నిన్ను విడిపించుటకు నేను నీకు తోడైయున్నాను'",
      "Jeremiah 1:8",
      "Do not be afraid of their faces, for I am with you to deliver you, says the Lord",
      "వారి ముఖములకు భయపడకుము, నిన్ను విడిపించుటకు నేను నీకు తోడైయున్నాను అని యెహోవా సెలవిచ్చుచున్నాడు",
      "Preachers and prophets often quail before hostile, scowling faces; divine commissioning places an iron wall around the messenger.",
      "ప్రజల కఠినమైన ముఖములకు బెదిరింపులకు భయపడక దేవుని వాక్యమును నిర్భయముగా ప్రకటించుటకు దైవిక రక్షణ వాగ్దానము."
    ],
    [
      "Zephaniah 3:16-17 the joyful shout over restored Zion: 'In that day it shall be said to Jerusalem: Do not fear; Zion, let not your hands be weak. The Lord your God in your midst, the Mighty One, will save'",
      "జెఫన్యా 3:16-17 పునరుద్ధరింపబడిన సీయోనుతో దేవుని వాగ్దానము: 'ఆ దినమున యెరూషలేముతో ఇట్లనుదురు-భయపడకుము; సీయోనూ, నీ చేతులను సడలనియ్యకుము; నీ దేవుడైన యెహోవా నీ మధ్య ఉన్నాడు, ఆయన రక్షించు సమర్థుడు'",
      "Zephaniah 3:16-17",
      "In that day it shall be said to Jerusalem: 'Do not fear; Zion, let not your hands be weak. The Lord your God in your midst, the Mighty One, will save; He will rejoice over you with gladness, He will quiet you with His love, He will rejoice over you with singing'",
      "ఆ దినమున యెరూషలేముతో ఇట్లనుదురు-భయపడకుము; సీయోనూ, నీ చేతులను సడలనియ్యకుము. నీ దేవుడైన యెహోవా నీ మధ్య ఉన్నాడు, ఆయన రక్షించు సమర్థుడు; ఆయన నీయందు బహుగా ఆనందించును, తన ప్రేమచేత నిన్ను శాంతపరచును, ఉత్సాహగానముతో నీయందు సంతోషించును",
      "The ultimate expulsion of fear: God Himself rejoices over us with exuberant singing and quiets every panic in His tender love.",
      "దేవుడే స్వయముగా మనమధ్య నివసించి రక్షించుచూ తన ప్రేమతో శాంతపరచి మన విషయములో ఉత్సాహగానము చేయు పరమ ఆనందము."
    ],
    [
      "Romans 8:15 the transition from slavery to sonship: 'For you did not receive the spirit of bondage again to fear, but you received the Spirit of adoption by whom we cry out, Abba, Father'",
      "రోమీయులకు 8:15 బానిసత్వమునుండి కుమారత్వములోనికి విడుదల: 'మరల భయపడుటకు మీరు దాస్యపు ఆత్మను పొందలేదు గాని దత్తపుత్రత్వపు ఆత్మను పొందితిరి; ఆ ఆత్మకలిగినవారమై అబ్బా తండ్రీ అని మొరపెట్టుచున్నాము'",
      "Romans 8:15",
      "For you did not receive the spirit of bondage again to fear, but you received the Spirit of adoption by whom we cry out, 'Abba, Father'",
      "ఏలయనగా మరల భయపడుటకు మీరు దాస్యపు ఆత్మను పొందలేదు గాని దత్తపుత్రత్వపు ఆత్మను పొందితిరి; ఆ ఆత్మకలిగినవారమై మనము-అబ్బా, తండ్రీ! అని మొరపెట్టుచున్నాము",
      "The Holy Spirit shatters the cowering terror of a slave before a tyrant, granting intimate filial access to the Father's lap.",
      "దేవుని సన్నిధికి భయముతో వణకవలసిన పనిలేదు; క్రీస్తుద్వారా దత్తపుత్రులమై 'అబ్బా తండ్రీ' అని ప్రేమతో పిలిచే చనువును పొందితిమి."
    ],
    [
      "Hebrews 13:6 the bold confession of every believer: 'So we may boldly say: The Lord is my helper; I will not fear. What can man do to me?'",
      "హెబ్రీయులకు 13:6 ప్రతి విశ్వాసి చేయు ధైర్యపు ఒప్పుకోలు: 'ప్రభువు నాకు సహాయకుడు, నేను భయపడను; నరుడు నాకేమి చేయగలడు?'",
      "Hebrews 13:6",
      "So we may boldly say: 'The Lord is my helper; I will not fear. What can man do to me?'",
      "కాబట్టి-ప్రభువు నాకు సహాయకుడు, నేను భయపడను, నరుడు నాకేమి చేయగలడు? అని మంచి ధైర్యముతో చెప్పగలవారమై యున్నాము",
      "Contentment in God's promises fuels unblushing boldness that looks mortal threats in the face without trembling.",
      "ధనాశను విడిచి దేవుని నిరంతర తోడ్పాటును నమ్మి 'ప్రభువే నా సహాయకుడు, నేను భయపడను' అని ధైర్యముగా సాక్ష్యమిచ్చుట."
    ],
    [
      "1 John 4:18 the expulsion of dread by agape: 'There is no fear in love; but perfect love casts out fear, because fear involves torment. But he who fears has not been made perfect in love'",
      "1 యోహాను 4:18 ప్రేమచేత భయము పారద్రోలబడుట: 'ప్రేమలో భయముండదు; అంతేకాదు, పరిపూర్ణ ప్రేమ భయమును వెలికి త్రోసివేయును; భయము బాధతో కూడినది'",
      "1 John 4:18",
      "There is no fear in love; but perfect love casts out fear, because fear involves torment. But he who fears has not been made perfect in love",
      "ప్రేమలో భయముండదు; అంతేకాదు, పరిపూర్ణ ప్రేమ భయమును వెలికి త్రోసివేయును; భయము బాధతో కూడినది, భయపడువాడు ప్రేమయందు పరిపూర్ణము చేయబడినవాడు కాడు",
      "God's perfected love toward us at the cross eliminates all dread of divine wrath, bringing holy, peaceful intimacy.",
      "దేవుని పరిపూర్ణ ప్రేమ మన హృదయములో నిండినప్పుడు సమస్త శిక్షాభయములు మరియు వేదనలు పటాపంచలగును."
    ]
  ];

  return data.map(item => ({
    easyQ: `What scriptural promise or historical event of overcoming fear is recorded regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన అభయ వాగ్దానము లేదా చారిత్రక సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does God's word empower believers to stand fearless in the face of threats?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం భయము మరియు ఆందోళనలు ఎదురైనప్పుడు విశ్వాసులు ఎలా ధైర్యము కలిగియుండవలెను?`,
    hardQ: `What theological principle does ${item[2]} reveal about divine sovereignty, holy reverence, and the eradication of sinful fear?`,
    hardQTe: `${item[2]} లేఖనము ద్వారా దేవుని సార్వభౌమత్వమును మరియు పిరికితనపు భయమును నిర్మూలించు దైవిక ప్రేమను గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He built forty towers of cedar on the peaks of Lebanon", "He levied sixty talents of gold upon the citizens of Gilead", "He decreed seventy days of isolation within the city gates"],
    optionsTelugu: [item[4], "లెబానోను శిఖరములపై నలభై దేవదారు గోపురములను నిర్మించెను", "గిలాదు పౌరులపై అరవై బంగారు తలాంతుల పన్నును విధించెను", "పట్టణ ద్వారముల లోపల డెబ్బై దినముల ఏకాంతమును ఆజ్ఞాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Growth Facts for Fear (Old Testament Wisdom, Proverbs, Psalms on holy fear of God vs snare of fear of man)
function buildFearGrowth() {
  const data = [
    ["Proverbs 1:7 declaring: 'The fear of the Lord is the beginning of knowledge, but fools despise wisdom and instruction'", "సామెతలు 1:7 'యెహోవాయందు భయభక్తులు కలిగియుండుట తెలివికి మూలము, మూర్ఖులు జ్ఞానమును ఉపదేశమును తిరస్కరింతురు'", "Proverbs 1:7", "\"The fear of the Lord is the beginning of knowledge, but fools despise wisdom and instruction\"", "\"యెహోవాయందు భయభక్తులు కలిగియుండుట తెలివికి మూలము; మూర్ఖులు జ్ఞానమును ఉపదేశమును తృణీకరింతురు\"", "Holy reverence for God is the foundation of all true epistemology and moral discernment.", "దేవునియందలి భయభక్తులే సమస్త జ్ఞానమునకు పునాది; దానిని నిర్లక్ష్యము చేయువాడు బుద్ధిహీనుడగును."],
    ["Proverbs 9:10 declaring: 'The fear of the Lord is the beginning of wisdom, and the knowledge of the Holy One is understanding'", "సామెతలు 9:10 'యెహోవాయందు భయభక్తులు కలిగియుండుటయే జ్ఞానమునకు మూలము, పరిశుద్ధ దేవుని గూర్చిన జ్ఞానమే వివేకము'", "Proverbs 9:10", "\"The fear of the Lord is the beginning of wisdom, and the knowledge of the Holy One is understanding\"", "\"యెహోవాయందు భయభక్తులు కలిగియుండుటయే జ్ఞానమునకు మూలము, పరిశుద్ధ దేవుని గూర్చిన జ్ఞానమే వివేకము\"", "Wisdom starts where sinful self-exaltation ends-in awe of the transcendent Holy One.", "పరిశుద్ధుడైన దేవుని పరిశుద్ధతను ఎరిగి భయభక్తులు కలిగియుండుటయే నిజమైన వివేచన."],
    ["Proverbs 14:26 on in the fear of the Lord there is strong confidence, and His children will have a place of refuge", "సామెతలు 14:26 యెహోవాయందు భయభక్తులు కలిగియుండుట బలమైన ఆశ్రయమునిచ్చును, ఆయన పిల్లలకు అది శరణార్థ స్థలమగును", "Proverbs 14:26", "\"In the fear of the Lord there is strong confidence, and His children will have a place of refuge\"", "\"యెహోవాయందు భయభక్తులు కలిగియుండువానికి బలమైన ఆశ్రయము కలదు, వాని పిల్లలకు శరణార్థ స్థలము దొరుకును\"", "Fearing God does not produce neurotic dread, but invincible confidence and generational security.", "దేవునికి భయపడుట విశ్వాసికి కొండవంటి ధైర్యమును మరియు అతని సంతానమునకు సురక్షితమైన కోటను ఇచ్చును."],
    ["Proverbs 14:27 on the fear of the Lord being a fountain of life, to turn one away from the snares of death", "సామెతలు 14:27 యెహోవాయందలి భయభక్తులు జీవపు ఊట, అది మరణపు ఉరులనుండి తప్పించును", "Proverbs 14:27", "\"The fear of the Lord is a fountain of life, to turn one away from the snares of death\"", "\"యెహోవాయందు భయభక్తులు కలిగియుండుట జీవపు ఊట, అది మరణపు ఉరులలోనుండి మనుష్యులను తప్పించును\"", "Awe of God functions as a living spring delivering from the hidden, lethal traps of sin.", "దైవభయము అనునది ఆత్మను తృప్తిపరచే జీవజలముల ఊటవలె ఉండి పాపపు మరణపు ఉరులనుండి కాపాడును."],
    ["Proverbs 15:16 on better is a little with the fear of the Lord, than great treasure with turmoil", "సామెతలు 15:16 నెమ్మదిలేని గొప్ప సంపదకంటె యెహోవాయందలి భయభక్తులతో కూడిన కొంచెమే మేలు", "Proverbs 15:16", "\"Better is a little with the fear of the Lord, than great treasure with turmoil\"", "\"నెమ్మదిలేకుండ గొప్ప కలిమి యుండుటకంటె యెహోవాయందలి భయభక్తులతో కూడిన కొంచెమైనను కలిగియుండుట శ్రేష్ఠము\"", "Spiritual contentment in divine reverent fear far surpasses anxiety-ridden earthly wealth.", "ఆందోళనలు కలహములతో కూడిన లౌకిక ధనముకంటె దేవుని భయభక్తులతో కూడిన సాధారణ జీవితమే ఎంతో మేలు."],
    ["Proverbs 15:33 on the fear of the Lord being the instruction of wisdom, and before honor is humility", "సామెతలు 15:33 యెహోవాయందలి భయభక్తులు జ్ఞానాభ్యాసమునకు సాధనము, ఘనతకు ముందు వినయము నడుచును", "Proverbs 15:33", "\"The fear of the Lord is the instruction of wisdom, and before honor is humility\"", "\"యెహోవాయందు భయభక్తులు కలిగియుండుట జ్ఞానాభ్యాసమునకు సాధనము, ఘనతకు ముందు వినయము నడుచును\"", "Reverence trains the human mind; bowing before God is the indispensable precursor to true honor.", "దేవుని యెదుట వినయముతో భయపడుటయే పరలోకపు ఘనతను పొందుటకు మార్గము."],
    ["Proverbs 16:6 on in mercy and truth atonement is provided for iniquity, and by the fear of the Lord one departs from evil", "సామెతలు 16:6 కృపాసత్యములవలన దోషమునకు ప్రాయశ్చిత్తము కలుగును, యెహోవాయందలి భయభక్తులవలన మనుష్యులు చెడుతనమునుండి తొలగిపోవుదురు", "Proverbs 16:6", "\"In mercy and truth atonement is provided for iniquity; and by the fear of the Lord one departs from evil\"", "\"కృపాసత్యములవలన దోషమునకు ప్రాయశ్చిత్తము కలుగును, యెహోవాయందలి భయభక్తులవలన మనుష్యులు చెడుతనమునుండి తొలగిపోవుదురు\"", "Reverential fear of God acts as a powerful moral compass actively steering the believer away from wickedness.", "హృదయములో దైవభయము ఉన్నవాడు ఏ పాపపు శోధన ఎదురైనా చెడుతనమునుండి దూరముగా పారిపోవును."],
    ["Proverbs 19:23 on the fear of the Lord leading to life, and he who has it will abide in satisfaction, not visited by evil", "సామెతలు 19:23 యెహోవాయందలి భయభక్తులు జీవసాధనములు, అవిగలవాడు తృప్తుడై నివసించును, కీడు వానిని ముట్టదు", "Proverbs 19:23", "\"The fear of the Lord leads to life, and he who has it will abide in satisfaction; he will not be visited with evil\"", "\"యెహోవాయందు భయభక్తులు కలిగియుండుట జీవసాధనము, అది కలిగినవాడు తృప్తుడై నివసించును, కీడు వానిని ముట్టదు\"", "Sanctified satisfaction: living in holy fear insulates from the bite of spiritual evil and grants deep soul-rest.", "దేవునికి భయపడు జీవితము పరిపూర్ణ ఆత్మ తృప్తిని ఇచ్చును; ఎటువంటి అపాయము వానిని తాకదు."],
    ["Proverbs 22:4 on by humility and the fear of the Lord are riches and honor and life", "సామెతలు 22:4 వినయమునకును యెహోవాయందలి భయభక్తులకును వచ్చు ప్రతిఫలము ఐశ్వర్యమును ఘనతయు జీవమును", "Proverbs 22:4", "\"By humility and the fear of the Lord are riches and honor and life\"", "\"వినయమునకును యెహోవాయందలి భయభక్తులకును వచ్చు ప్రతిఫలము ఐశ్వర్యమును ఘనతయు జీవమును\"", "The divine paradox: lowliness and godly fear yield eternal, imperishable wealth and life.", "దేవుని సన్నిధిలో వినయముతో భయపడుట నిజమైన ఘనతను నిత్య జీవపు సంపదను తెచ్చిపెట్టును."],
    ["Proverbs 23:17 commanding: 'Do not let your heart envy sinners, but be zealous for the fear of the Lord all the day'", "సామెతలు 23:17 'పాపులను చూచి నీ హృదయములో అసూయపడకుము, దినమెల్ల యెహోవాయందు భయభక్తులు కలిగియుండుము'", "Proverbs 23:17", "\"Do not let your heart envy sinners, but be zealous for the fear of the Lord all the day; for surely there is a hereafter, and your hope will not be cut off\"", "\"పాపులను చూచి నీ హృదయమున అసూయపడకుము, దినమెల్ల యెహోవాయందు భయభక్తులు కలిగియుండుము; నిశ్చయముగా ముగింపు అనునది ఒకటి కలదు, నీ నిరీక్షణ భంగము కాదు\"", "Constant holy reverence throughout the day acts as a vaccine against envying worldly wickedness.", "దుష్టుల తాత్కాలిక భోగములను చూచి అసూయపడక రోజంతయు దైవభయమును కాపాడుకొనుట."],
    ["Psalm 2:11 commanding earthly kings: 'Serve the Lord with fear, and rejoice with trembling'", "కీర్తన 2:11 భూరాజులకు హెచ్చరిక: 'భయభక్తులు కలిగి యెహోవాను సేవించుడి, గడగడ వణుకుచు సంతోషించుడి'", "Psalm 2:11", "\"Serve the Lord with fear, and rejoice with trembling. Kiss the Son, lest He be angry, and you perish in the way\"", "\"భయభక్తులు కలిగి యెహోవాను సేవించుడి, గడగడ వణుకుచు సంతోషించుడి; ఆయన కోపపడునేమో... కుమారుని ముద్దుపెట్టుకొనుడి\"", "Holy worship combines awe and adoration; joy before the Sovereign is grounded in trembling reverence.", "దేవుని సేవించుటలో పవిత్ర భయమును ఆయన సన్నిధిలో వణుకుతో కూడిన ఆనందమును కలిగియుండుట."],
    ["Psalm 15:4 on the citizen of Zion honoring those who fear the Lord", "కీర్తన 15:4 సీయోను పౌరుడు యెహోవాయందు భయభక్తులు గలవారిని ఘనపరచును", "Psalm 15:4", "\"In whose eyes a vile person is despised, but he honors those who fear the Lord; he who swears to his own hurt and does not change\"", "\"వాని దృష్టికి తిరస్కారార్హుడు నీచుడుగా ఎంచబడును, అతడు యెహోవాయందు భయభక్తులు గలవారిని ఘనపరచును; ప్రమాణము చేయగా నష్టము వచ్చినను మాట తప్పడు\"", "True spiritual values prioritize and cherish those who walk in the fear of the Lord.", "లోకపు అధికారులను కాక దేవునియందు భయభక్తులు గల విశ్వాసులను హృదయపూర్వకముగా సన్మానించుట."],
    ["Psalm 19:9 on the fear of the Lord being clean, enduring forever, true and righteous altogether", "కీర్తన 19:9 యెహోవాయందలి భయము నిర్మలమైనది, అది నిత్యము నిలుచును, ఆయన న్యాయవిధులు సత్యమైనవి", "Psalm 19:9", "\"The fear of the Lord is clean, enduring forever; the judgments of the Lord are true and righteous altogether\"", "\"యెహోవాయందలి భయము నిర్మలమైనది, అది నిత్యము నిలుచును; యెహోవా న్యాయవిధులు సత్యమైనవి, అవి యెల్లప్పుడును నీతియుక్తమైనవి\"", "Unlike polluted earthly dread, holy awe of God is pure, cleansing, and imperishable.", "దేవుని భయము మలినము లేని పవిత్రమైనది; అది మానవ ఆత్మను శుద్ధి చేసి నిత్యత్వమువరకు నిలుచును."],
    ["Psalm 22:23 exhorting: 'You who fear the Lord, praise Him! All you descendants of Jacob, glorify Him, and fear Him, all you offspring of Israel!'", "కీర్తన 22:23 'యెహోవాయందు భయభక్తులు గలవారలారా, ఆయనను స్తుతించుడి; ఇశ్రాయేలు సంతతివారలారా, ఆయనకు భయపడుడి'", "Psalm 22:23", "\"You who fear the Lord, praise Him! All you descendants of Jacob, glorify Him, and fear Him, all you offspring of Israel!\"", "\"యెహోవాయందు భయభక్తులు గలవారలారా, ఆయనను స్తుతించుడి; యాకోబు సంతతివారలారా, మీరందరు ఆయనను ఘనపరచుడి; ఇశ్రాయేలు సంతతివారలారా, మీరందరు ఆయనకు భయపడుడి\"", "Messianic psalm summoning all who revere Yahweh to erupt in corporate doxology.", "సిలువ విజయము తరువాత సమస్త దైవజనులు దేవునికి భయపడుచూ ఆయనను స్తుతించవలెనన్న పిలుపు."],
    ["Psalm 25:12 asking: 'Who is the man that fears the Lord? Him shall He teach in the way He chooses'", "కీర్తన 25:12 'యెహోవాయందు భయభక్తులు గలవాడెవడో వాడు కోరుకొనవలసిన మార్గమును ఆయన వానికి నేర్పును'", "Psalm 25:12", "\"Who is the man that fears the Lord? Him shall He teach in the way He chooses. He himself shall dwell in prosperity, and his descendants shall inherit the earth\"", "\"యెహోవాయందు భయభక్తులు గలవాడెవడో వాడు కోరుకొనవలసిన మార్గమును ఆయన వానికి నేర్పును; వాని ప్రాణము నెమ్మదిగా నుండును, వాని సంతానము భూమిని స్వతంత్రించుకొనును\"", "Divine guidance is promised specifically to those who bow in holy fear; God directs their decisions.", "దేవునికి భయపడి జీవించే భక్తునికి సరైన జీవిత మార్గమును దేవుడే స్వయముగా బోధించి నడిపించును."],
    ["Psalm 25:14 on the secret of the Lord being with those who fear Him, and He will show them His covenant", "కీర్తన 25:14 యెహోవా మర్మము ఆయనయందు భయభక్తులు గలవారికి తెలిసియున్నది, ఆయన వారికి తన నిబంధనను తెలియజేయును", "Psalm 25:14", "\"The secret of the Lord is with those who fear Him, and He will show them His covenant\"", "\"యెహోవా మర్మము ఆయనయందు భయభక్తులు గలవారికి తెలిసియున్నది, ఆయన వారికి తన నిబంధనను తెలియజేయును\"", "Intimate friendship with the Almighty is reserved for those who hold Him in holy reverence.", "పరలోకపు రహస్యములను మరియు నిబంధన లోతులను దేవుడు తనయందు భయభక్తులు గలవారికే బయలుపరచును."],
    ["Psalm 31:19 praising: 'Oh, how great is Your goodness, which You have laid up for those who fear You, which You have prepared for those who trust in You'", "కీర్తన 31:19 'నీయందు భయభక్తులు గలవారి నిమిత్తము నీవు దాచియుంచిన మేలు ఎంతో గొప్పది! నీ శరణుజొచ్చినవారికి నీవు సిద్ధపరచిన మేలు ఎంతో గొప్పది!'", "Psalm 31:19", "\"Oh, how great is Your goodness, which You have laid up for those who fear You, which You have prepared for those who trust in You before the sons of men!\"", "\"నీయందు భయభక్తులు గలవారి నిమిత్తము నీవు దాచియుంచిన మేలు ఎంతో గొప్పది! నరులయెదుట నీ శరణుజొచ్చినవారి నిమిత్తము నీవు సిద్ధపరచిన మేలు ఎంతో గొప్పది!\"", "God stockpiles unimaginable treasuries of goodness specifically for those who revere His name.", "దేవునికి భయపడే విశ్వాసుల కొరకు పరలోకములో దాచబడిన ఆశీర్వాదములు ఊహాతీతమైనవి."],
    ["Psalm 33:8 commanding: 'Let all the earth fear the Lord; let all the inhabitants of the world stand in awe of Him'", "కీర్తన 33:8 'సర్వభూమి యెహోవాకు భయపడును గాక, లోకనివాసులందరు ఆయనకు భయభక్తులు కలిగియుందురు గాక'", "Psalm 33:8", "\"Let all the earth fear the Lord; let all the inhabitants of the world stand in awe of Him. For He spoke, and it was done; He commanded, and it stood fast\"", "\"సర్వభూమి యెహోవాకు భయపడును గాక, లోకనివాసులందరు ఆయనకు భయభక్తులు కలిగియుందురు గాక; ఏలయనగా ఆయన ఆజ్ఞాపింపగా అది కలిగెను, ఆయన సెలవియ్యగా కార్యము స్థిరపడెను\"", "Cosmic mandate: the creative word that spoke galaxies into existence demands universal awe from every creature.", "మాట మాత్రముచేత సమస్త సృష్టిని కలుగజేసిన సర్వశక్తిమంతునికి సమస్త లోకము భయపడి నిలువవలెను."],
    ["Psalm 33:18 on behold, the eye of the Lord is on those who fear Him, on those who hope in His mercy", "కీర్తన 33:18 యెహోవా దృష్టి ఆయనయందు భయభక్తులు గలవారిమీదను, ఆయన కృపకొరకు కనిపెట్టువారిమీదను ఉన్నది", "Psalm 33:18", "\"Behold, the eye of the Lord is on those who fear Him, on those who hope in His mercy, to deliver their soul from death, and to keep them alive in famine\"", "\"మరణమునుండి వారి ప్రాణమును విమిచించుటకును, కరవులో వారిని సజీవులనుగా కాపాడుటకును, యెహోవా దృష్టి ఆయనయందు భయభక్తులు గలవారిమీదను ఆయన కృపకొరకు కనిపెట్టువారిమీదను ఉన్నది\"", "The omniscient gaze of the Father constantly tracks and protects those who revere Him.", "దేవునికి భయపడుతూ ఆయన కనికరముకై కనిపెట్టే భక్తులను కాపాడుటకు ఆయన కనుదృష్టి ఎల్లప్పుడూ వారిపైనే ఉండును."],
    ["Psalm 34:7 promising: 'The angel of the Lord encamps all around those who fear Him, and delivers them'", "కీర్తన 34:7 'యెహోవాయందు భయభక్తులు గలవారిచుట్టు ఆయన దూత కావలియుండి వారిని విడిపించును'", "Psalm 34:7", "\"The angel of the Lord encamps all around those who fear Him, and delivers them\"", "\"యెహోవాయందు భయభక్తులు గలవారిచుట్టు ఆయన దూత కావలియుండి వారిని విడిపించును\"", "A celestial military garrison permanently pitches its tents around every God-fearing believer.", "దేవునియందు భయభక్తులు గలవారి చుట్టూ పరలోకపు సైన్యపు దూత రక్షణ కవచముగా నిలిచి విడిపించును."],
    ["Psalm 34:9 commanding: 'Oh, fear the Lord, you His saints! There is no want to those who fear Him'", "కీర్తన 34:9 'యెహోవా పరిశుద్ధులారా, ఆయనయందు భయభక్తులు కలిగియుండుడి; ఆయనయందు భయభక్తులు గలవారికి ఏమియు కొదువలేదు'", "Psalm 34:9", "\"Oh, fear the Lord, you His saints! There is no want to those who fear Him. The young lions lack and suffer hunger; but those who seek the Lord shall not lack any good thing\"", "\"యెహోవా పరిశుద్ధులారా, ఆయనయందు భయభక్తులు కలిగియుండుడి; ఆయనయందు భయభక్తులు గలవారికి ఏమియు కొదువలేదు. సింహపు పిల్లలు లేమిగలవై ఆకలిగొనును; యెహోవాను ఆశ్రయించువారికి ఏ మేలును కొదువయై యుండదు\"", "Even mighty predators face starvation, but the God-fearing saints will never lack any genuine good.", "బలమైన సింహపు పిల్లలైనా ఆకలితో అలమటించవచ్చును గాని దేవునికి భయపడేవారికి ఏ మేలును కొదువయుండదు."],
    ["Psalm 34:11 inviting: 'Come, you children, listen to me; I will teach you the fear of the Lord'", "కీర్తన 34:11 'పిల్లలారా, వచ్చి నా మాట వినుడి; యెహోవాయందలి భయభక్తులను మీకు నేర్పించెదను'", "Psalm 34:11", "\"Come, you children, listen to me; I will teach you the fear of the Lord. Who is the man who desires life, and loves many days, that he may see good?\"", "\"పిల్లలారా, వచ్చి నా మాట వినుడి; యెహోవాయందలి భయభక్తులను మీకు నేర్పించెదను. బ్రదుకగోరువాడెవడైన ఉన్నాడా? మేలుచూచుచు అనేక దినములు జీవింపగోరువాడెవడైన ఉన్నాడా?\"", "The fear of the Lord is a teachable lifestyle rooted in tongue-restraint, departing from evil, and pursuing peace.", "నాలుకను చెడుతనమునుండి కాచుకొని శాంతిని వెదకుటద్వారా దైవభయములో జీవించు విధానమును నేర్చుకొనుట."],
    ["Psalm 60:4 declaring: 'You have given a banner to those who fear You, that it may be displayed because of the truth'", "కీర్తన 60:4 'సత్యమునుబట్టి ఎత్తుటకు నీయందు భయభక్తులు గలవారికి నీవొక ధ్వజము నిచ్చియున్నావు'", "Psalm 60:4", "\"You have given a banner to those who fear You, that it may be displayed because of the truth. Selah\"", "\"సత్యమునుబట్టి ఎత్తుటకు నీయందు భయభక్తులు గలవారికి నీవొక ధ్వజము నిచ్చియున్నావు (సెలా)\"", "God gives His reverent people a triumphant rally-point banner to unfurl against falsehood.", "సత్యమును చాటుటకు దేవునియందు భయభక్తులు గలవారి చేతికి ఆయన విజయ ధ్వజమును అనుగ్రహించెను."],
    ["Psalm 61:5 praying: 'For You, O God, have heard my vows; You have given me the heritage of those who fear Your name'", "కీర్తన 61:5 'దేవా, నీవు నా మొక్కుబడులను వినియున్నావు; నీ నామమందు భయభక్తులు గలవారి స్వాస్థ్యమును నీవు నాకిచ్చియున్నావు'", "Psalm 61:5", "\"For You, O God, have heard my vows; You have given me the heritage of those who fear Your name\"", "\"దేవా, నీవు నా మొక్కుబడులను వినియున్నావు; నీ నామమందు భయభక్తులు గలవారి స్వాస్థ్యమును నీవు నాకిచ్చియున్నావు\"", "The eternal heritage of Abraham is bequeathed exclusively to those who revere God's holy name.", "దేవుని నామమందు భయభక్తులు గల పరిశుద్ధుల నిత్య పరలోక స్వాస్థ్యములో పాలుపొందు ధన్యత."],
    ["Psalm 85:9 declaring: 'Surely His salvation is near to those who fear Him, that glory may dwell in our land'", "కీర్తన 85:9 'మన దేశములో మహిమ నివసించునట్లు ఆయన రక్షణ ఆయనయందు భయభక్తులు గలవారికి సమీపముగా ఉన్నది'", "Psalm 85:9", "\"Surely His salvation is near to those who fear Him, that glory may dwell in our land\"", "\"మన దేశములో మహిమ నివసించునట్లు ఆయన రక్షణ ఆయనయందు భయభక్తులు గలవారికి నిజముగా సమీపముగా ఉన్నది\"", "Salvation draws close to a reverent community, welcoming divine glory to reside among them.", "దేవునియందు భయభక్తులు గల ప్రజలకు ఆయన రక్షణ అత్యంత సమీపముగా ఉండి దేశములో మహిమను నింపును."],
    ["Psalm 86:11 praying: 'Teach me Your way, O Lord; I will walk in Your truth; unite my heart to fear Your name'", "కీర్తన 86:11 దావీదు ప్రార్థన: 'యెహోవా, నీ మార్గమును నాకు బోధించుము, నేను నీ సత్యముననుసరించి నడిచెదను; నీ నామమునకు భయపడునట్లు నా హృదయమును ఏకముఖము చేయుము'", "Psalm 86:11", "\"Teach me Your way, O Lord; I will walk in Your truth; unite my heart to fear Your name\"", "\"యెహోవా, నీ మార్గమును నాకు బోధించుము, నేను నీ సత్యముననుసరించి నడిచెదను; నీ నామమునకు భయపడునట్లు నా హృదయమును ఏకముఖము చేయుము\"", "Praying for an undivided, focused heart cured of double-mindedness to revere God's singular majesty.", "చెదిరిపోయిన ఆలోచనలను విడిచి దేవుని నామమునకే భయపడునట్లు హృదయమును ఏకాగ్రతగలదానిగా చేయుమని వేడుకొనుట."],
    ["Psalm 102:15 on the nations fearing the name of the Lord, and all the kings of the earth Your glory", "కీర్తన 102:15 అన్యజనులు యెహోవా నామమునకును భూరాజులందరు నీ మహిమకును భయపడుదురు", "Psalm 102:15", "\"So the nations shall fear the name of the Lord, and all the kings of the earth Your glory\"", "\"అన్యజనులు యెహోవా నామమునకును భూరాజులందరు నీ మహిమకును భయపడుదురు; ఏలయనగా యెహోవా సీయోనును నిర్మించి తన మహిమతో ప్రత్యక్షమాయెను\"", "Global eschatological worship: all monarchs and gentile tribes will bow before Yahweh's blinding glory.", "సమస్త అన్య రాజ్యములు మరియు లోక చక్రవర్తులు దేవుని మహిమగల నామమునకు భయపడి మోకాళ్లూను దినము వచ్చుచున్నది."],
    ["Psalm 103:11 on as the heavens are high above the earth, so great is His mercy toward those who fear Him", "కీర్తన 103:11 భూమికంటె ఆకాశము ఎంత ఉన్నతముగా ఉన్నదో ఆయనయందు భయభక్తులు గలవారియెడల ఆయన కృప అంత గొప్పది", "Psalm 103:11", "\"For as the heavens are high above the earth, so great is His mercy toward those who fear Him\"", "\"భూమికంటె ఆకాశము ఎంత యెత్తుగా ఉన్నదో ఆయనయందు భయభక్తులు గలవారియెడల ఆయన కృప అంత గొప్పదిగా ఉన్నది\"", "The infinite vertical expanse of astronomical space measures God's steadfast chesed toward His reverent children.", "ఆకాశము భూమికి ఎంత ఉన్నతమో దేవునికి భయపడేవారిపై ఆయన చూపే నిబంధన కృప అంత అనంతమైనది."],
    ["Psalm 103:13 on as a father pities his children, so the Lord pities those who fear Him", "కీర్తన 103:13 తండ్రి తన పిల్లలయెడల జాలిపడునట్లు యెహోవా తనయందు భయభక్తులు గలవారియెడల జాలిపడును", "Psalm 103:13", "\"As a father pities his children, so the Lord pities those who fear Him\"", "\"తండ్రి తన కుమారులయెడల జాలిపడునట్లు యెహోవా తనయందు భయభక్తులు గలవారియెడల జాలిపడును; మన నిర్మితి ఆయనకు తెలిసేయున్నది\"", "Reverent fear does not alienate; it ushers the believer into the tenderest paternal affection of God.", "దైవభయముగల భక్తులను పరమ తండ్రి తన కన్నబిడ్డలవలె అమితమైన ప్రేమతో జాలితో హత్తుకొనును."],
    ["Psalm 103:17 on the mercy of the Lord being from everlasting to everlasting on those who fear Him, and His righteousness to children's children", "కీర్తన 103:17 యెహోవా భయభక్తులు గలవారిమీద ఆయన కృప యుగయుగములు ఉండును, వారి పిల్లల పిల్లలకు ఆయన నీతి నిలుచును", "Psalm 103:17", "\"But the mercy of the Lord is from everlasting to everlasting on those who fear Him, and His righteousness to children's children\"", "\"అయితే యెహోవా నిబంధనను గైకొనుచు... ఆయనయందు భయభక్తులు గలవారిమీద ఆయన కృప యుగయుగములు ఉండును, వారి పిల్లల పిల్లలకు ఆయన నీతి నిలుచును\"", "An eternal dynasty of divine blessing flows across generations for families that revere God.", "దేవునియందు భయభక్తులు గలవారి వంశములపై ఆయన కృప మరియు నీతి తరతరములు నిరంతరము వర్ధిల్లును."],
    ["Psalm 111:5 on He having given food to those who fear Him; He will ever be mindful of His covenant", "కీర్తన 111:5 తనయందు భయభక్తులు గలవారికి ఆయన ఆహారము అనుగ్రహించియున్నాడు, ఆయన నిత్యము తన నిబంధనను జ్ఞాపకము చేసికొనును", "Psalm 111:5", "\"He has given food to those who fear Him; He will ever be mindful of His covenant\"", "\"తనయందు భయభక్తులు గలవారికి ఆయన ఆహారము అనుగ్రహించియున్నాడు, ఆయన నిత్యము తన నిబంధనను జ్ఞాపకము చేసికొనును\"", "God's providential pantry guarantees daily sustenance to all who live in holy reverence of His covenant.", "దేవునికి భయపడువారి దైనందిన ఆహార కొరతలను తీర్చి నిరంతరము తన నిబంధనను నెరవేర్చు నమ్మకమైన ప్రభువు."],
    ["Psalm 111:10 on the fear of the Lord being the beginning of wisdom; a good understanding have all those who do His commandments", "కీర్తన 111:10 యెహోవాయందలి భయము జ్ఞానమునకు మూలము; ఆయన ఆజ్ఞలను గైకొనువారందరు మంచి వివేకము గలవారు", "Psalm 111:10", "\"The fear of the Lord is the beginning of wisdom; a good understanding have all those who do His commandments. His praise endures forever\"", "\"యెహోవాయందలి భయము జ్ఞానమునకు మూలము; ఆయన కట్టడలను అనుసరించువారందరు మంచి వివేకము గలవారు, ఆయన స్తుతి నిత్యము నిలుచును\"", "Intellect without obedience is delusion; true discernment operates through practical obedience flowing from godly fear.", "దేవుని ఆజ్ఞలను పాటిస్తూ ఆయనయందు భయభక్తులు కలిగియుండుటయే అత్యున్నతమైన నిజమైన జ్ఞానము."],
    ["Psalm 115:11 exhorting: 'You who fear the Lord, trust in the Lord; He is their help and their shield'", "కీర్తన 115:11 'యెహోవాయందు భయభక్తులు గలవారలారా, ఆయనను నమ్ముకొనుడి; ఆయన వారికి సహాయమును కేడెమునై యున్నాడు'", "Psalm 115:11", "\"You who fear the Lord, trust in the Lord; He is their help and their shield\"", "\"యెహోవాయందు భయభక్తులు గలవారలారా, యెహోవాను నమ్ముకొనుడి; ఆయన వారికి సహాయమును కేడెమునై యున్నాడు\"", "Reverence and trust are inseparable twins; the God whom we revere becomes our active Defender and Shield.", "నిర్జీవ విగ్రహములను నమ్ముకొనక సజీవుడైన దేవునియందు భయభక్తులుంచువారికే ఆయన రక్షణ కేడెముగా నిలుచును."],
    ["Psalm 115:13 promising: 'He will bless those who fear the Lord, both small and great'", "కీర్తన 115:13 'పిన్నలనేమి పెద్దలనేమి తనయందు భయభక్తులు గలవారిని యెహోవా ఆశీర్వదించును'", "Psalm 115:13", "\"He will bless those who fear the Lord, both small and great\"", "\"పిన్నలనేమి పెద్దలనేమి తనయందు భయభక్తులు గలవారిని ఆయన ఆశీర్వదించును; యెహోవా మిమ్మును మీ పిల్లలను అంతకంతకు వృద్ధిపొందించును\"", "Egalitarian blessing: whether high status or humble child, God lavishly crowns all who revere Him.", "హోదాలతో నిమిత్తములేక పిన్నలైనా పెద్దలైనా దేవునియందు భయభక్తులు గలవారినందరిని ఆయన సమృద్ధిగా దీవించును."],
    ["Psalm 118:4 commanding: 'Let those who fear the Lord now say, His mercy endures forever'", "కీర్తన 118:4 'ఆయన కృప నిరంతరము ఉండునని యెహోవాయందు భయభక్తులు గలవారు ఇప్పుడు పలుకుదురు గాక'", "Psalm 118:4", "\"Let those who fear the Lord now say, 'His mercy endures forever'\"", "\"ఆయన కృప నిరంతరముండునని యెహోవాయందు భయభక్తులు గలవారు ఇప్పుడు పలుకుదురు గాక\"", "The community of godly fear is the choir that heralds the eternal endurance of God's steadfast love.", "దేవుని నిత్య కృపను గూర్చి లోకమంతటా ఎలుగెత్తి చాటే పరిశుద్ధ భక్తుల స్తుతి సమూహము."],
    ["Psalm 119:63 declaring: 'I am a companion of all who fear You, and of those who keep Your precepts'", "కీర్తన 119:63 భక్తుని సహవాసము: 'నీయందు భయభక్తులు గలవారికందరికిని నీ కట్టడలను అనుసరించువారికిని నేను చెలికాడను'", "Psalm 119:63", "\"I am a companion of all who fear You, and of those who keep Your precepts\"", "\"నీయందు భయభక్తులు గలవారికందరికిని నీ కట్టడలను అనుసరించువారికిని నేను చెలికాడను\"", "Spiritual friendship is determined not by worldly status, but by shared reverence for God and His Word.", "లోక స్నేహములను విడిచి దేవునియందు భయభక్తులు కలిగి ఆయన ఆజ్ఞలను పాటించే పరిశుద్ధుల సహవాసమునే కోరుకొనుట."],
    ["Psalm 119:79 praying: 'Let those who fear You turn to me, those who know Your testimonies'", "కీర్తన 119:79 'నీయందు భయభక్తులు గలవారును నీ శాసనములను ఎరిగినవారును నా వైపునకు తిరుగుదురు గాక'", "Psalm 119:79", "\"Let those who fear You turn to me, those who know Your testimonies\"", "\"నీయందు భయభక్తులు గలవారును నీ శాసనములను ఎరిగినవారును నాయొద్దకు తిరుగుదురు గాక\"", "A godly leader desires to attract fellow reverent believers who treasure divine truth.", "దైవభయముగల భక్తులతో కూడిన సహవాసము ఆత్మీయ క్షేమాభివృద్ధికి బలమైన సాధనముగా ఉండును."],
    ["Psalm 119:120 trembling before God's judgment: 'My flesh trembles for fear of You, and I am afraid of Your judgments'", "కీర్తన 119:120 దేవుని న్యాయపు తీర్పులకు వణుకుచు: 'నీ భయమువలన నా శరీరము వణకుచున్నది, నీ న్యాయపు తీర్పులకు నేను భయపడుచున్నాను'", "Psalm 119:120", "\"My flesh trembles for fear of You, and I am afraid of Your judgments\"", "\"నీ భయమువలన నా శరీరము వణకుచున్నది, నీ న్యాయపు తీర్పులకు నేను భయపడుచున్నాను\"", "A profound physiological and spiritual awe in the presence of God's unbending moral righteousness.", "దేవుని పరిశుద్ధ తీర్పుల తీవ్రతను గ్రహించి పాపమునకు దూరముగా ఉండుటకు శరీరమంతయు వణకు పవిత్ర భయము."],
    ["Psalm 128:1-2 declaring: 'Blessed is everyone who fears the Lord, who walks in His ways. When you eat the labor of your hands, you shall be happy, and it shall be well with you'", "కీర్తన 128:1-2 గృహ ఆశీర్వాదము: 'యెహోవాయందు భయభక్తులు కలిగి ఆయన మార్గములయందు నడుచువారందరు ధన్యులు; నీవు నీ చేతుల కష్టార్జితము ననుభవించెదవు, నీకు క్షేమము కలుగును'", "Psalm 128:1-2", "\"Blessed is everyone who fears the Lord, who walks in His ways. When you eat the labor of your hands, you shall be happy, and it shall be well with you\"", "\"యెహోవాయందు భయభక్తులు కలిగి ఆయన మార్గములయందు నడుచువారందరు ధన్యులు. నిశ్చయముగా నీవు నీ చేతుల కష్టార్జితము అనుభవించెదవు, నీవు ధన్యుడవు నీకు మంచి కలుగును\"", "Godly fear translates into practical family thriving, productive labor, and deep domestic tranquility.", "దేవుని భయభక్తులలో జీవించే ప్రతి కుటుంబము చేతుల కష్టార్జితమును అనుభవిస్తూ క్షేమముగా వర్ధిల్లును."],
    ["Psalm 128:3-4 describing the flourishing family: 'Your wife shall be like a fruitful vine in the very heart of your house, your children like olive plants... behold, thus shall the man be blessed who fears the Lord'", "కీర్తన 128:3-4 భక్తిగల గృహస్థునికి దీవెన: 'నీ లోగిట నీ భార్య ఫలించు ద్రాక్షావల్లివలె నుండును, నీ బల్లచుట్టు నీ పిల్లలు ఒలీవ మొక్కలవలె నుందురు; యెహోవాయందు భయభక్తులు గలవాడు ఈలాగు ఆశీర్వదింపబడును'", "Psalm 128:3-4", "\"Your wife shall be like a fruitful vine in the very heart of your house, your children like olive plants all around your table. Behold, thus shall the man be blessed who fears the Lord\"", "\"నీ లోగిట నీ భార్య ఫలించు ద్రాక్షావల్లివలె నుండును, నీ బల్లచుట్టు నీ పిల్లలు ఒలీవ మొక్కలవలె నుందురు. యెహోవాయందు భయభక్తులు గలవాడు ఈలాగు ఆశీర్వదింపబడును\"", "Generational fruitfulness and domestic peace are God's covenant rewards for the man who fears Him.", "దైవభయముగల విశ్వాసి ఇల్లు ద్రాక్షావల్లివలె ఫలిస్తూ పిల్లలు ఒలీవ మొక్కలవలె దేవుని బల్లచుట్టూ ఎదుగుదురు."],
    ["Psalm 135:20 exhorting: 'Bless the Lord, O house of Levi! You who fear the Lord, bless the Lord!'", "కీర్తన 135:20 ఆరాధనా పిలుపు: 'లేవీ వంశస్థులారా, యెహోవాను సన్నుతించుడి; యెహోవాయందు భయభక్తులు గలవారలారా, యెహోవాను సన్నుతించుడి'", "Psalm 135:20", "\"Bless the Lord, O house of Levi! You who fear the Lord, bless the Lord! Blessed be the Lord out of Zion, who dwells in Jerusalem! Praise the Lord!\"", "\"లేవీ వంశస్థులారా, యెహోవాను సన్నుతించుడి; యెహోవాయందు భయభక్తులు గలవారలారా, యెహోవాను సన్నుతించుడి; యెరూషలేములో నివసించు యెహోవా సీయోనులోనుండి స్తుతింపబడును గాక, హల్లెలూయా\"", "Reverent fear culminates in enthusiastic, liturgical praise echoing from Zion throughout the earth.", "దేవునియందు భయభక్తులు గల పరిశుద్ధులందరు ఏకమై హల్లెలూయా అని ప్రభువును స్తుతించు పరమ ఆనందము."],
    ["Psalm 145:19 promising: 'He will fulfill the desire of those who fear Him; He also will hear their cry and save them'", "కీర్తన 145:19 'తనయందు భయభక్తులు గలవారి కోరికను ఆయన నెరవేర్చును, వారి మొరను ఆలకించి వారిని రక్షించును'", "Psalm 145:19", "\"He will fulfill the desire of those who fear Him; He also will hear their cry and save them. The Lord preserves all who love Him\"", "\"తనయందు భయభక్తులు గలవారి కోరికను ఆయన నెరవేర్చును, వారి మొరను ఆలకించి వారిని రక్షించును; యెహోవా తన్ను ప్రేమించువారినందరిని కాపాడును\"", "God harmonizes the desires of the reverent soul with His sovereign will and swiftly answers their cries.", "దేవునికి భయపడి జీవించేవారి హృదయ వాంఛలను ఆయన సంతోషముతో నెరవేర్చి వారి మొరనాలకించి రక్షించును."],
    ["Psalm 147:11 declaring: 'The Lord takes pleasure in those who fear Him, in those who hope in His mercy'", "కీర్తన 147:11 'యెహోవా తనయందు భయభక్తులు గలవారియందు, తన కృపకొరకు కనిపెట్టువారియందు ఆనందించువాడై యున్నాడు'", "Psalm 147:11", "\"The Lord takes pleasure in those who fear Him, in those who hope in His mercy\"", "\"యెహోవా తనయందు భయభక్తులు గలవారియందు, తన కృపకొరకు కనిపెట్టువారియందు ఆనందించువాడై యున్నాడు\"", "God rejects military cavalry and human muscle, finding His exquisite delight in humble people who revere Him.", "గుర్రముల బలమునందు కాక తన సన్నిధిలో వినయముతో భయపడుతూ కృపకై కనిపెట్టువారియందే దేవుడు ఆనందించును."],
    ["Ecclesiastes 12:13 the grand conclusion of Solomon's quest: 'Let us hear the conclusion of the whole matter: Fear God and keep His commandments, for this is man's all'", "ప్రసంగి 12:13 మానవ జీవిత సారాంశము: 'సమస్తమును విన్న తరువాత తేలిన ముగింపు ఇదే: దేవునియందు భయభక్తులు కలిగియుండి ఆయన ఆజ్ఞలను గైకొనుము, మానవకోటికి ఇదియే విధి'", "Ecclesiastes 12:13", "\"Let us hear the conclusion of the whole matter: Fear God and keep His commandments, for this is man's all. For God will bring every work into judgment\"", "\"ఇదంతయు విన్న తరువాత తేలిన ముగింపు ఇదే: దేవునియందు భయభక్తులు కలిగియుండి ఆయన ఆజ్ఞలను గైకొనుము; మానవకోటికి ఇదియే విధి. గూఢమైన ప్రతి విషయమును గూర్చి దేవుడు తీర్పుతీర్చును\"", "After exhausting all earthly pleasures and philosophies, the meaning of human existence boils down to holy fear and obedience.", "సమస్త లోక భోగములను శోధించిన తరువాత ప్రసంగి చెప్పిన సత్యము: దేవునికి భయపడి ఆయన ఆజ్ఞలను పాటించుటయే మానవ జీవిత ధన్యత."],
    ["Isaiah 8:12-13 commanding: 'Do not fear what they fear, nor be terrified. The Lord of hosts, Him you shall hallow; let Him be your fear, and let Him be your dread'", "యెషయా 8:12-13 'వారు భయపడుదానికి మీరు భయపడకుడి, దిగులుపడకుడి; సైన్యములకధిపతియైన యెహోవాయే పరిశుద్ధుడని యెంచుడి, ఆయనే మీకు భయకారణముగా ఉండవలెను'", "Isaiah 8:12-13", "\"Do not say, 'A conspiracy,' concerning all that this people call a conspiracy, nor be afraid of their threats, nor be troubled. The Lord of hosts, Him you shall hallow; let Him be your fear, and let Him be your dread\"", "\"ఈ జనులు కట్టుకథ అని చెప్పుదానినంతటిని కట్టుకథ అని చెప్పకుడి; వారు భయపడుదానికి భయపడకుడి, దిగులుపడకుడి. సైన్యములకధిపతియైన యెహోవాయే పరిశుద్ధుడని యెంచుడి; ఆయనే మీకు భయకారణముగాను భయంకరుడుగాను ఉండవలెను\"", "When God is your ultimate fear, all human conspiracies, political threats, and cultural panics lose their power to intimidate.", "లోకము భయపడే సంగతులకు భయపడక సర్వశక్తిగల యెహోవాకే భయపడినప్పుడు ఏ కుట్రలైనా భయపెట్టలేవు."],
    ["Isaiah 33:6 on the fear of the Lord being His treasure: 'Wisdom and knowledge will be the stability of your times, and the strength of salvation; the fear of the Lord is His treasure'", "యెషయా 33:6 దైవభయమను రత్నభాండారము: 'నీ కాలములలో స్థిరత్వమును రక్షణ బాహుళ్యమును జ్ఞాన వివేకములును కలుగును; యెహోవాయందలి భయభక్తులు ఆయన నిధి'", "Isaiah 33:6", "\"Wisdom and knowledge will be the stability of your times, and the strength of salvation; the fear of the Lord is His treasure\"", "\"నీ కాలములలో స్థిరత్వమును రక్షణబాహుళ్యమును జ్ఞానవివేకములును కలుగును; యెహోవాయందలి భయభక్తులు ఆయన నిధి (ఐశ్వర్యము)\"", "God's supreme national and personal treasure is the reverent fear of His people, which anchors turbulent eras in peace.", "సంక్షోభ సమయములలో దేశమునకు స్థిరత్వమును రక్షణను ఇచ్చే అమూల్యమైన దైవిక సంపద యెహోవాయందలి భయభక్తులే."],
    ["Isaiah 50:10 on who among you fears the Lord and obeys the voice of His Servant, walking in darkness and having no light, let him trust in the name of the Lord and rely upon his God", "యెషయా 50:10 చీకటిలో నడుచుచున్న భక్తునికి ఆదరణ: 'మీలో యెహోవాకు భయపడి ఆయన దాసుని మాట వినువాడెవడు? వెలుగులేక చీకటిలో నడుచువాడు యెహోవా నామమును ఆశ్రయించి తన దేవునిమీద ఆధారపడవలెను'", "Isaiah 50:10", "\"Who among you fears the Lord? Who obeys the voice of His Servant? Who walks in darkness and has no light? Let him trust in the name of the Lord and rely upon his God\"", "\"మీలో యెహోవాకు భయపడి ఆయన దాసుని మాట వినువాడెవడు? వెలుగులేక చీకటిలో నడుచువాడు యెహోవా నామమును ఆశ్రయించి తన దేవునిమీద ఆధారపడవలెను\"", "Even when God-fearing servants walk through providential darkness without visible sunlight, they lean completely upon Yahweh's character.", "దేవునికి భయపడుతూ జీవితములో చీకటి అనుభవములు ఎదురైనను స్వంత నిప్పులను వెలిగించుకొనక దేవుని నామముపైనే ఆధారపడుట."],
    ["Jeremiah 32:40 promising the indwelling covenant fear: 'I will put My fear in their hearts so that they will not depart from Me'", "యిర్మీయా 32:40 నూతన నిబంధన వాగ్దానము: 'వారు నన్ను విడిచిపోకుండునట్లు నా భయమును వారి హృదయములలో ఉంచెదను'", "Jeremiah 32:40", "\"And I will make an everlasting covenant with them, that I will not turn away from doing them good; but I will put My fear in their hearts so that they will not depart from Me\"", "\"నేను వారికి మేలు చేయుట మానకుండునట్లు వారిని విడిచిపోని నిత్య నిబంధనను వారితో చేసెదను; వారు నన్ను విడిచిపోకుండునట్లు నా భయమును వారి హృదయములలో ఉంచెదను\"", "Under the New Covenant, God supernaturally implants filial reverent fear directly into our regenerated hearts to guarantee perseverance.", "మనము దేవుని విడిచిపోకుండా ఆయన స్వయముగా తన పవిత్ర భయమును మన హృదయములలో నింపి నిత్యము కాపాడును."],
    ["Malachi 3:16 on those who feared the Lord speaking often to one another, and a book of remembrance written before Him for those who fear Him and meditate on His name", "మలాకీ 3:16 'యెహోవాయందు భయభక్తులు గలవారు ఒకరితో ఒకరు మాటలాడుకొనుచుండగా యెహోవా చెవియొగ్గి వినెను; ఆయనయందు భయభక్తులు గలవారికి జ్ఞాపకార్థ గ్రంథము రాయబడెను'", "Malachi 3:16", "\"Then those who feared the Lord spoke to one another, and the Lord listened and heard them; so a book of remembrance was written before Him for those who fear the Lord and who meditate on His name\"", "\"అప్పుడు యెహోవాయందు భయభక్తులు గలవారు ఒకరితో ఒకరు మాటలాడుకొనుచుండగా యెహోవా చెవియొగ్గి ఆలకించెను. యెహోవాయందు భయభక్తులు కలిగి ఆయన నామమును స్మరించుచుండువారికి జ్ఞాపకార్థ గ్రంథము ఒకటి ఆయన సముఖమందు రాయబడెను\"", "In times of cultural apostasy, God eavesdrops on the quiet fellowship of reverent believers and records their names in a celestial memorial scroll.", "సమాజములో భక్తిహీనత పెరిగినప్పుడు దేవుని భయభక్తులలో సహవాసము చేయు పరిశుద్ధుల మాటలను దేవుడు ఆలకించి పరలోక గ్రంథములో లిఖించును."],
    ["Malachi 4:2 the dawn of the messianic Sun of Righteousness: 'But to you who fear My name the Sun of Righteousness shall arise with healing in His wings'", "మలాకీ 4:2 మెస్సీయ రాకడ వాగ్దానము: 'అయితే నా నామమందు భయభక్తులు గలవారైన మీకు నీతి సూర్యుడు ఉదయించును, ఆయన రెక్కలు ఆరోగ్యము కలుగజేయును'", "Malachi 4:2", "\"But to you who fear My name the Sun of Righteousness shall arise with healing in His wings; and you shall go out and grow fat like stall-fed calves\"", "\"అయితే నా నామమందు భయభక్తులు గలవారైన మీకు నీతిసూర్యుడు ఉదయించును, ఆయన రెక్కలు ఆరోగ్యము కలుగజేయును గనుక మీరు బయలువెళ్లి కొట్టములో పెంచిన దూడలవలె గంతులు వేయుదురు\"", "For all who revere Yahweh, Christ the Sun of Righteousness rises with restorative healing, bathing their souls in fearless light and joyful liberation.", "దేవుని నామమునందు భయభక్తులు గలవారిపై నీతిసూర్యుడైన యేసు తన కృపా కిరణములతో ఉదయించి సమస్త భయములను రోగములను స్వస్థపరచును."]
  ];

  return data.map(item => ({
    easyQ: `What scriptural truth or eternal blessing regarding holy fear is taught in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన బోధ లేదా ఆశీర్వాదమేమి?`,
    medQ: `According to ${item[2]}, how does reverent fear of God deliver believers from worldly terror, anxiety, and moral compromise?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం దేవునియందలి పవిత్ర భయభక్తులు మనుష్యులను లోక భయములనుండి మరియు పాపమునుండి ఎలా కాపాడును?`,
    hardQ: `What theological principle does ${item[2]} establish regarding the fear of the Lord as the foundation of wisdom, intimacy, and generational flourishing?`,
    hardQTe: `${item[2]} ప్రకారం యెహోవాయందలి భయభక్తులు నిజమైన జ్ఞానమునకు, దైవిక సహవాసమునకు మరియు తరతరముల దీవెనకు ఎలా మూలమగుచున్నది?`,
    options: [item[3], "He built sixty bronze storehouses on the plain of Sharon", "He gathered forty thousand chariots from the borders of Syria", "He imposed thirty pieces of silver upon the priests of Bethel"],
    optionsTelugu: [item[4], "షారోను మైదానములో అరవై ఇత్తడి కొట్లను నిర్మించెను", "సిరియా సరిహద్దులనుండి నలభై వేల రథములను సమకూర్చెను", "బేతేలు యాజకులపై ముప్పది వెండి నాణెములను విధించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Mastery Facts for Fear (New Testament Theology, Deliverance from Fear of Death, Christ's Overcoming, Boldness)
function buildFearMastery() {
  const data = [
    [
      "Hebrews 2:14-15 on Christ destroying through death him who had the power of death, the devil, and releasing those who through fear of death were subject to lifelong bondage",
      "హెబ్రీయులకు 2:14-15 మరణముయొక్క బలముగల సాతానును తన మరణముద్వారా నశింపజేసి, జీవితకాలమంతయు మరణభయముచేత దాస్యమునకు లోనైనవారిని విడిపించిన క్రీస్తు విజయోత్సవము",
      "Hebrews 2:14-15",
      "That through death He might destroy him who had the power of death, that is, the devil, and release those who through fear of death were all their lifetime subject to bondage",
      "మరణముయొక్క బలముగలవానిని, అనగా అపవాదిని మరణముద్వారా నశింపజేయుటకును, జీవితకాలమంతయు మరణభయముచేత దాస్యమునకు లోనైనవారిని విడిపించుటకును, ఆయన రక్తమాంసములలో పాలివాడాయెను",
      "The incarnation and crucifixion dismantled the devil's master weapon: the existential fear of death that held humanity in lifelong terror.",
      "మానవాళిని జీవితకాలమంతయు బానిసలుగా ఉంచిన మరణభయమును క్రీస్తు తన సిలువ మరణము మరియు పునరుత్థానము ద్వారా సమూలముగా నాశనము చేసెను."
    ],
    [
      "Romans 8:31 asking the ultimate rhetorical question of confidence: 'What then shall we say to these things? If God is for us, who can be against us?'",
      "రోమీయులకు 8:31 తిరుగులేని విశ్వాస నిశ్చయత: 'ఇట్లుండగా ఏమందుము? దేవుడు మన పక్షముననుండగా మనకు విరోధియెవడు?'",
      "Romans 8:31",
      "What then shall we say to these things? If God is for us, who can be against us? He who did not spare His own Son, but delivered Him up for us all",
      "ఇట్లుండగా ఏమందుము? దేవుడు మన పక్షముననుండగా మనకు విరోధియెవడు? తన సొంత కుమారుని అనుగ్రహించుటకు వెనుతీయక మన అందరికొరకు ఆయనను అప్పగించినవాడు...",
      "The sovereign alliance of God with His redeemed people renders all adversarial threats inconsequential and powerless.",
      "సర్వసృష్టికర్తయైన దేవుడే మన పక్షమున నిలబడి తన సొంత కుమారుని మనకొరకు ఇచ్చినప్పుడు ఈ లోకములో మనలను భయపెట్టగల విరోధి ఎవడును లేడు."
    ],
    [
      "Romans 8:35-37 on who shall separate us from the love of Christ: 'In all these things we are more than conquerors through Him who loved us'",
      "రోమీయులకు 8:35-37 క్రీస్తు ప్రేమనుండి మనలను ఎడబాపునదెవరు? శ్రమయైనను ఉపద్రవమైనను ఖడ్గమైనను మనలను ప్రేమించినవానిద్వారా మనము వీటన్నిటిలో సంపూర్ణ జయము పొందుచున్నాము",
      "Romans 8:37",
      "Yet in all these things we are more than conquerors through Him who loved us",
      "అయినను మనలను ప్రేమించినవానిద్వారా మనము వీటన్నిటియందు ముమ్మాటికి (సంపూర్ణముగా) విజయము పొందుచున్నాము",
      "Super-conquerors (hupernikomen): believers do not merely survive persecutions and terrors, but triumph overwhelmingly through Christ's unquenchable love.",
      "శ్రమలు హింసలు కరువు ఖడ్గము వంటి భయంకర శోధనలు ఎదురైనను క్రీస్తు ప్రేమద్వారా మనము సంపూర్ణ విజేతలముగా నిలుతుము."
    ],
    [
      "Philippians 1:28 commanding: 'And not in any way terrified by your adversaries, which is to them a proof of perdition, but to you of salvation, and that from God'",
      "ఫిలిప్పీయులకు 1:28 'ఎందులోను విరోధులకు భయపడకుడి; ఇది వారికి నాశనమునకును మీకు రక్షణకును సూచనయై యున్నది, ఇది దేవునివలన కలుగునదే'",
      "Philippians 1:28",
      "And not in any way terrified by your adversaries, which is to them a proof of perdition, but to you of salvation, and that from God",
      "ఏ విషయమందును విరోధులవలన భయపడకుడి; ఇది వారికి నాశనమునకును మీకు రక్షణకును సూచనయై యున్నది, ఇది దేవునివలన కలుగునదే",
      "Unflinching Christian fearlessness in the face of persecution is a supernatural sign confirming the enemy's doom and the saints' salvation.",
      "శత్రువుల హింసలకు ఏమాత్రము భయపడక స్థిరముగా నిలుచుట వారికి రాబోవు నాశనమునకును విశ్వాసులకు రక్షణకును దైవిక రుజువుగా ఉన్నది."
    ],
    [
      "Philippians 4:6-7 the divine prescription for chronic anxiety: 'Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God; and the peace of God... will guard your hearts and minds'",
      "ఫిలిప్పీయులకు 4:6-7 ఆందోళనకు దైవిక పరిష్కారము: 'దేనినిగూర్చియు చింతపడకుడి గాని ప్రతి విషయములోను కృతజ్ఞతాపూర్వకముగా ప్రార్థన విజ్ఞాపనలచేత మీ విన్నపములను దేవునికి తెలియజేయుడి; అప్పుడు సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము మీ హృదయములను తలంపులను కావలియుండును'",
      "Philippians 4:6-7",
      "Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God; and the peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus",
      "దేనినిగూర్చియు చింతపడకుడి గాని ప్రతి విషయములోను కృతజ్ఞతాపూర్వకముగా ప్రార్థన విజ్ఞాపనలచేత మీ విన్నపములను దేవునికి తెలియజేయుడి. అప్పుడు సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము క్రీస్తుయేసువలన మీ హృదయములకును మీ తలంపులకును కావలియుండును",
      "Thanksgiving in prayer discharges anxious dread, commissioning the garrison peace of God to stand sentry over our thoughts.",
      "చింతలను భయములను విడిచి కృతజ్ఞతతో దేవునికి ప్రార్థించినప్పుడు సమస్త బుద్ధికి మించిన పరలోక సమాధానము మన మనస్సులకు కావలియుండును."
    ],
    [
      "Acts 4:29-31 the early church praying under legal threats: 'Lord, look on their threats, and grant to Your servants that with all boldness they may speak Your word... and they were all filled with the Holy Spirit'",
      "అపొస్తలుల కార్యములు 4:29-31 బెదిరింపులమధ్య ఆదిమ సంఘ ప్రార్థన: 'ప్రభువా, వారి బెదిరింపులను చూచి, నీ దాసులు మిక్కిలి ధైర్యముతో నీ వాక్యమును బోధించునట్లు అనుగ్రహించుము; వారందరు పరిశుద్ధాత్మతో నిండిరి'",
      "Acts 4:29,31",
      "Now, Lord, look on their threats, and grant to Your servants that with all boldness they may speak Your word... And when they had prayed, the place where they were assembled together was shaken; and they were all filled with the Holy Spirit, and they spoke the word of God with boldness",
      "ఇప్పుడైతే ప్రభువా, వారి బెదిరింపులను చూచి, రోగములను స్వస్థపరచుటకును... నీ దాసులు మిక్కిలి ధైర్యముతో నీ వాక్యమును బోధించునట్లు అనుగ్రహించుము. వారు ప్రార్థన చేయగానే వారు కూడియున్న స్థలము కంపించెను; అప్పుడు వారందరు పరిశుద్ధాత్మతో నిండినవారై దేవుని వాక్యమును ధైర్యముగా బోధించిరి",
      "Persecution does not silence the Spirit-filled church; believers pray not for escape from danger, but for supernatural boldness to advance.",
      "అధికారుల బెదిరింపులకు భయపడక ప్రార్థించగా పరిశుద్ధాత్మ శక్తితో నింపబడి భూమి కంపించగా అపొస్తలులు మరింత ధైర్యముతో వాక్యమును ప్రకటించిరి."
    ],
    [
      "Acts 5:29 the apostolic defiance before the Sanhedrin: 'We ought to obey God rather than men'",
      "అపొస్తలుల కార్యములు 5:29 యూదా మహాసభ యెదుట పేతురు పలికిన నిర్భయ ప్రకటన: 'మనుష్యులకు కాక దేవునికే మేము లోబడవలెను గదా'",
      "Acts 5:29",
      "But Peter and the other apostles answered and said: 'We ought to obey God rather than men'",
      "అందుకు పేతురును అపొస్తలులును-మనుష్యులకు కాక దేవునికే మేము లోబడవలెను గదా",
      "Holy fear of God liberates from the tyranny of human mandates; when state laws contradict God, obedience belongs solely to heaven.",
      "మనుష్యుల చట్టములకు జైలు శిక్షలకు భయపడక సర్వోన్నతుడైన దేవుని ఆజ్ఞకే తలవొగ్గుట క్రైస్తవ సాక్ష్యముయొక్క పునాది."
    ],
    [
      "Acts 9:31 on the churches throughout Judea, Galilee, and Samaria having peace and being edified, walking in the fear of the Lord and the comfort of the Holy Spirit",
      "అపొస్తలుల కార్యములు 9:31 యూదయ గలలీ సమరయ సంఘములు సమాధానము కలిగి భక్తివృద్ధినొందుచు, ప్రభువునందలి భయమునందును పరిశుద్ధాత్మ ఆదరణయందును నడుచుకొనుట",
      "Acts 9:31",
      "Then the churches throughout all Judea, Galilee, and Samaria had peace and were edified. And walking in the fear of the Lord and in the comfort of the Holy Spirit, they were multiplied",
      "కావున యూదయ గలిలయ సమరయలందంతటను సంఘము సమాధానము కలిగి భక్తివృద్ధినొందుచు, ప్రభువునందలి భయమునందును పరిశుద్ధాత్మ ఆదరణయందును నడుచుకొనుచు విస్తరించుచుండెను",
      "Healthy ecclesial growth balances two essential pillars: deep reverence for the Lord paired with the sweet comfort of the Spirit.",
      "సంఘములు దేవుని భయమందును పరిశుద్ధాత్మ ఆదరణయందును నడుచుకొన్నప్పుడు బాహ్య శత్రువుల భయము నశించి ఆత్మీయ విస్తరణ కలిగెను."
    ],
    [
      "Acts 20:22-24 Paul marching toward Jerusalem: 'None of these things move me; nor do I count my life dear to myself, so that I may finish my race with joy'",
      "అపొస్తలుల కార్యములు 20:22-24 బంధకములు శ్రమలు ఎదురుచూచుచున్నను పౌలు స్థిరచిత్తము: 'నేను ఏ మాత్రమును నా ప్రాణమును ప్రియమైనదిగా ఎంచుకొనను; నా పరుగును తుదముట్టించిన చాలును'",
      "Acts 20:24",
      "But none of these things move me; nor do I count my life dear to myself, so that I may finish my race with joy, and the ministry which I received from the Lord Jesus",
      "అయితే దేవుని కృపాసువార్తనుగూర్చి సాక్ష్యమిచ్చుటయందు నా పరుగును, నేను ప్రభువైన యేసువలన పొందిన పరిచర్యను తుదముట్టింపవలెనని, నా ప్రాణమును నాకొక లెక్కగా ఎంచుకొనను",
      "Complete surrender of self-preservation neutralizes all fear of imprisonment, suffering, and death.",
      "క్రీస్తు పరిచర్యను ముగించుటకై తన ప్రాణమును సైతం లెక్కచేయని పౌలు అచంచల భక్తి సమస్త భయములను జయించెను."
    ],
    [
      "Romans 13:3-4 on rulers not being a terror to good works, but to evil: 'Do you want to be unafraid of the authority? Do what is good'",
      "రోమీయులకు 13:3-4 అధికారుల భయమును గూర్చి పౌలు బోధ: 'ప్రభుత్వమునకు భయపడక ఉండగోరుదువా? మేలు చేయుము, అప్పుడు దానివలన నీకు మెప్పు కలుగును'",
      "Romans 13:3",
      "For rulers are not a terror to good works, but to evil. Do you want to be unafraid of the authority? Do what is good, and you will have praise from the same",
      "ప్రభుత్వము చేయువారికి సత్కార్యములు చేయువారు కాదు గాని దుష్కార్యములు చేయువారే భయపడుదురు. నీవు వారికి భయపడక ఉండగోరుదువా? మేలు చేయుము, అప్పుడు వారివలన నీకు మెప్పు కలుగును",
      "A clean conscience walking in moral uprightness lives without fear of civil justice and judicial wrath.",
      "న్యాయమైన సత్కార్యములను చేయుచు పవిత్రమైన మనస్సాక్షితో జీవించువాడు అధికారుల దండనకు ఏమాత్రము భయపడడు."
    ],
    [
      "1 Corinthians 2:3 Paul confessing his human weakness in Corinth: 'I was with you in weakness, in fear, and in much trembling... that your faith should not be in the wisdom of men but in the power of God'",
      "1 కొరింథీయులకు 2:3 కొరింథులో పౌలు పరిచర్య వైఖరి: 'బలహీనతతోను భయముతోను ఎంతో వణకుతోను మీయొద్ద ఉంటిని; మీ విశ్వాసము మనుష్యుల జ్ఞానముపై కాక దేవుని శక్తిపై ఆధారపడవలెనని'",
      "1 Corinthians 2:3-5",
      "I was with you in weakness, in fear, and in much trembling. And my speech and my preaching were not with persuasive words of human wisdom, but in demonstration of the Spirit and of power",
      "బలహీనతతోను భయముతోను ఎంతో వణకుతోను మీయొద్ద ఉంటిని. మీ విశ్వాసము మనుష్యుల జ్ఞానమునందుండక దేవుని శక్తియందుండవలెనని, నేను మాటలాడినను సువార్త ప్రకటించినను జ్ఞానయుక్తమైన రమ్యమైన మాటలను ఉపయోగింపక, ఆత్మయు శక్తియు కనుపరచు దృష్టాంతములనే ఉపయోగించితిని",
      "Apostolic humility is not macho bravado; Paul felt trembling vulnerability so that Christ's power alone would shine.",
      "పౌలు తన స్వంత పాండిత్యమును ప్రదర్శింపక దేవుని శక్తియే ప్రకాశించునట్లు భయకంపితములతో సువార్తను ప్రకటించెను."
    ],
    [
      "2 Corinthians 5:10-11 knowing the terror of the Lord: 'For we must all appear before the judgment seat of Christ... Knowing, therefore, the terror of the Lord, we persuade men'",
      "2 కొరింథీయులకు 5:10-11 ప్రభువు భయమును ఎరిగి సువార్త ప్రకటించుట: 'మనమందరమును క్రీస్తు న్యాయపీఠము ఎదుట ప్రత్యక్షము కావలెను; కావున ప్రభువు భయమును ఎరిగి మనుష్యులను ఒప్పించుచున్నాము'",
      "2 Corinthians 5:10-11",
      "For we must all appear before the judgment seat of Christ, that each one may receive the things done in the body... Knowing, therefore, the terror of the Lord, we persuade men",
      "ఎందుకనగా తాను జరిగించిన క్రియలచొప్పున... ప్రతివాడును తన శరీరముతో చేసినవాటి ఫలమును పొందునట్లు, మనమందరమును క్రీస్తు న్యాయపీఠము ఎదుట ప్రత్యక్షము కావలెను. కావున మేము ప్రభువు భయమును ఎరిగి మనుష్యులను ఒప్పించుచున్నాము",
      "The sober reality of standing before Christ's bema seat fuels urgent evangelistic persuasion, rescuing sinners from divine judgment.",
      "క్రీస్తు న్యాయపీఠపు పవిత్ర భయమును ఎరిగియుండుట సువార్తికులను ఆత్మలను రక్షించుటకు రోషముతో నడిపించును."
    ],
    [
      "2 Corinthians 7:1 commanding: 'Therefore, having these promises, beloved, let us cleanse ourselves from all filthiness of the flesh and spirit, perfecting holiness in the fear of God'",
      "2 కొరింథీయులకు 7:1 పరిశుద్ధతను సంపూర్ణము చేసికొనుట: 'ప్రియులారా, మనకు ఈ వాగ్దానములు ఉన్నవి గనుక దేవుని భయముతో పరిశుద్ధతను సంపూర్ణము చేసికొనుచు, శరీరమునకును ఆత్మకును కలిగిన సమస్త కల్మషమునుండి మనలను పవిత్రపరచుకొందము'",
      "2 Corinthians 7:1",
      "Therefore, having these promises, beloved, let us cleanse ourselves from all filthiness of the flesh and spirit, perfecting holiness in the fear of God",
      "ప్రియులారా, మనకు ఈ వాగ్దానములు ఉన్నవి గనుక దేవుని భయముతో పరిశుద్ధతను సంపూర్ణము చేసికొనుచు, శరీరమునకును ఆత్మకును కలిగిన సమస్త కల్మషమునుండి మనలను పవిత్రపరచుకొందము",
      "Godly fear is the essential catalyst for personal sanctification, driving believers to purge compromise from flesh and spirit.",
      "దేవుని భయభక్తులలో జీవించుటయే విశ్వాసిని సమస్త లోక పాపపు మలినమునుండి కడిగి పరిశుద్ధతలో సంపూర్ణునిగా చేయును."
    ],
    [
      "Ephesians 5:21 the foundation of mutual submission: 'Submitting to one another in the fear of God'",
      "ఎఫెసీయులకు 5:21 పరస్పర విధేయతకు మూలము: 'క్రీస్తునందలి భయముతో ఒకనికnetworkడు లోబడియుండుడి'",
      "Ephesians 5:21",
      "Submitting to one another in the fear of God",
      "క్రీస్తునందలి భయముతో ఒకనికnetworkడు లోబడియుండుడి",
      "Interpersonal humility and church harmony flow not from social convention, but out of reverent awe for Christ our Lord.",
      "సంఘములో మరియు కుటుంబములో పరస్పర ప్రేమ విధేయతలు క్రీస్తునందలి పవిత్ర భయమునుండి మాత్రమే ఉద్భవించును."
    ],
    [
      "Philippians 2:12-13 commanding: 'Work out your own salvation with fear and trembling; for it is God who works in you both to will and to do for His good pleasure'",
      "ఫిలిప్పీయులకు 2:12-13 రక్షణను కొనసాగించుట: 'భయముతోను వణకుతోను మీ సొంత రక్షణను కొనసాగించుకొనుడి; ఏలయనగా తన సుయిష్టము నెరవేర్చుటకు మీలో కార్యసిద్ధి కలుగజేయువాడు దేవుడే'",
      "Philippians 2:12-13",
      "Therefore, my beloved, as you have always obeyed... work out your own salvation with fear and trembling; for it is God who works in you both to will and to do for His good pleasure",
      "కాబట్టి నా ప్రియులారా... భయముతోను వణకుతోను మీ సొంత రక్షణను కొనసాగించుకొనుడి. ఏలయనగా మీరు ఇచ్ఛయించుటకును కార్యసిద్ధి కలుగజేసికొనుటకును, తన సుయిష్టముచొప్పున మీలో కార్యసిద్ధి కలుగజేయువాడు దేవుడే",
      "Working out salvation involves no slavish panic, but solemn reverent trembling because Almighty God Himself is indwelling and empowering us.",
      "మనలో నివసించి కార్యము జరిగించువాడు సర్వశక్తిగల దేవుడే గనుక పవిత్ర భయకంపితములతో మన రక్షణ ఫలములను ఫలించవలెను."
    ],
    [
      "Colossians 3:22 commanding servants: 'Bondservants, obey in all things your masters according to the flesh, not with eyeservice, as men-pleasers, but in sincerity of heart, fearing God'",
      "కొలొస్సయులకు 3:22 యజమానులకు సేవచేయుట: 'మనుష్యులను సంతోషపెట్టువారైనట్టు కంటికి కనబడునట్లు కాక, యథార్థమైన హృదయముతో ప్రభువునకు భయపడుచు సమస్త విషయములలో మీ యజమానులకు లోబడుడి'",
      "Colossians 3:22",
      "Bondservants, obey in all things your masters according to the flesh, not with eyeservice, as men-pleasers, but in sincerity of heart, fearing God",
      "దాసులారా, మనుష్యులను సంతోషపెట్టువారైనట్టు కంటికి కనబడుటకే కాక, ప్రభువునకు భయపడుచు శుద్ధాంతఃకరణముగలవారై, శరీరరీత్యా మీ యజమానులైనవారికి అన్నివిషయములలో లోబడుడి",
      "Fearing God elevates earthly employment into sacred service; we work conscientiously because our ultimate Master is in heaven.",
      "మనుష్యుల మెప్పుకొరకు కాక పరలోకపు యజమానుడైన క్రీస్తునకు భయపడుచూ యథార్థ హృదయముతో దైనందిన పనులను చేయుట."
    ],
    [
      "Hebrews 11:7 on Noah being divinely warned of things not yet seen, moved with godly fear, preparing an ark for the saving of his household",
      "హెబ్రీయులకు 11:7 నోవహు విశ్వాసము: 'ఇంకను చూడని సంగతులనుగూర్చి దేవునిచేత హెచ్చరింపబడి భయభక్తులు గలవాడై, తన యింటివారి రక్షణకొరకు ఓడను సిద్ధము చేసెను'",
      "Hebrews 11:7",
      "By faith Noah, being divinely warned of things not yet seen, moved with godly fear, prepared an ark for the saving of his household, by which he condemned the world and became heir of the righteousness which is according to faith",
      "విశ్వాసమునుబట్టి నోవహు ఇంకను చూడని సంగతులనుగూర్చి దేవునిచేత హెచ్చరింపబడి భయభక్తులు గలవాడై, తన యింటివారి రక్షణకొరకు ఒక ఓడను సిద్ధము చేసెను; అందువలన అతడు లోకముమీద నేరస్థాపన చేసి విశ్వాసమునుబట్టి కలుగు నీతికి వారసుడాయెను",
      "Godly fear (eulabetheis) moves the believer to build according to divine blueprints long before the impending judgment clouds appear.",
      "వర్షపు చుక్కయైనా లేని దినములలో రాబోవు జలప్రళయమును గూర్చి దేవుని మాటకు భయపడి నూట ఇరువది ఏండ్లు ఓడను నిర్మించిన నోవహు విశ్వాసము."
    ],
    [
      "Hebrews 12:28-29 on receiving a kingdom which cannot be shaken, serving God acceptably with reverence and godly fear: 'For our God is a consuming fire'",
      "హెబ్రీయులకు 12:28-29 నిశ్చలమైన రాజ్యమును పొందుట: 'కదలింపబడని రాజ్యమును పొందియున్నాము గనుక కృప కలిగియుందము; ఆ కృపకలిగి భయభక్తులతో దేవునికి ప్రీతికరముగా సేవచేయుదము; ఏలయనగా మన దేవుడు దహించు అగ్నియై యున్నాడు'",
      "Hebrews 12:28-29",
      "Therefore, since we are receiving a kingdom which cannot be shaken, let us have grace, by which we may serve God acceptably with reverence and godly fear. For our God is a consuming fire",
      "అందువలన మనము కదలింపబడని రాజ్యమును పొందియున్నాము గనుక కృప కలిగియుందము; ఆ కృపకలిగి వినయభయభక్తులతో దేవునికి ప్రీతికరముగా సేవచేయుదము. ఏలయనగా మన దేవుడు దహించు అగ్నియై యున్నాడు",
      "The unshakeable character of the New Covenant does not breed flippant presumption; our God remains an all-consuming, holy fire.",
      "ఎన్నడును కదలింపబడని పరలోక రాజ్య పౌరులమైన మనము దహించు అగ్నియైన దేవుని సన్నిధిలో పవిత్ర భయభక్తులతో సేవ చేయవలెను."
    ],
    [
      "1 Peter 1:17 commanding: 'And if you call on the Father, who without partiality judges according to each one's work, conduct yourselves throughout the time of your stay here in fear'",
      "1 పేతురు 1:17 పరదేశ ప్రయాణము: 'పక్షపాతము లేకుండ ప్రతివాని క్రియలచొప్పున తీర్పుతీర్చువానిని మీరు తండ్రి అని పిలుచుచున్నారు గనుక మీరు ఇక్కడ పరదేశులై యుండు కాలమంతయు భయముతో గడుపుడి'",
      "1 Peter 1:17",
      "And if you call on the Father, who without partiality judges according to each one's work, conduct yourselves throughout the time of your stay here in fear; knowing that you were not redeemed with corruptible things, like silver or gold",
      "పక్షపాతము లేకుండ ప్రతివాని క్రియలచొప్పున తీర్పుతీర్చువానిని మీరు తండ్రి అని పిలుచుచున్నారు గనుక మీరు ఇక్కడ పరదేశులై యుండు కాలమంతయు భయముతో గడుపుడి. వ్యర్థమైన మీ పూర్వప్రవర్తననుండి వెండి బంగారములవంటి క్షయవస్తువులచేత మీరు విమోచింపబడలేదు గాని అమూల్యమైన రక్తముచేత... విమోచింపబడితిరి",
      "Because we were ransomed not with perishable gold but with the precious blood of Christ, our earthly pilgrimage must be governed by reverent sobriety.",
      "క్రీస్తు అమూల్యమైన రక్తముచేత కొనబడిన పరిశుద్ధులము గనుక ఈ లోక యాత్రలో పక్షపాతములేని తండ్రికి భయపడి పవిత్రముగా జీవించవలెను."
    ],
    [
      "1 Peter 2:17 the fourfold apostolic duty: 'Honor all people. Love the brotherhood. Fear God. Honor the king'",
      "1 పేతురు 2:17 నలుగురియెడల విశ్వాసి బాధ్యత: 'అందరిని సన్మానించుడి, సహోదరులను ప్రేమించుడి, దేవునికి భయపడుడి, రాజును సన్మానించుడి'",
      "1 Peter 2:17",
      "Honor all people. Love the brotherhood. Fear God. Honor the king",
      "అందరిని సన్మానించుడి, సహోదరులను ప్రేమించుడి, దేవునికి భయపడుడి, రాజును సన్మానించుడి",
      "A vital distinction: we 'honor' earthly magistrates and fellow human beings, but we reserve absolute 'fear' (phobeisthe) solely for God alone.",
      "తోటి మనుష్యులను అధికారులను గౌరవింపవలెను గాని సంపూర్ణ భయభక్తులు కేవలము సృష్టికర్తయైన దేవునికే చెల్లించవలెను."
    ],
    [
      "1 Peter 3:14-15 on suffering for righteousness' sake: 'And do not be afraid of their threats, nor be troubled. But sanctify the Lord God in your hearts'",
      "1 పేతురు 3:14-15 నీతినిమిత్తము శ్రమనొందుట: 'వారి బెదిరింపునకు భయపడకుడి, కలవరపడకుడి; మీ హృదయములయందు క్రీస్తును ప్రభువుగా ప్రతిష్టించుడి'",
      "1 Peter 3:14-15",
      "And do not be afraid of their threats, nor be troubled. But sanctify the Lord God in your hearts, and always be ready to give a defense to everyone who asks you a reason for the hope that is in you",
      "ఒకవేళ మీరు నీతినిమిత్తము శ్రమపడినను మీరు ధన్యులే; వారి బెదిరింపునకు భయపడకుడి, కలవరపడకుడి. మీ హృదయములయందు క్రీస్తును ప్రభువుగా ప్రతిష్టించుడి",
      "When Christ is enshrined as Lord in the throne-room of the heart, the terrifying threats of hostile persecutors become utterly harmless.",
      "శత్రువుల హింసలకు బెదిరింపులకు భయపడక హృదయములో క్రీస్తును ప్రభువుగా నిలిపినప్పుడు ఆత్మీయ సమాధానము ధైర్యము కలుగును."
    ],
    [
      "1 Peter 3:6 praising holy women of old: 'As Sarah obeyed Abraham, calling him lord, whose daughters you are if you do good and are not afraid with any terror'",
      "1 పేతురు 3:6 శారా విశ్వాసపు మాదిరి: 'శారా అబ్రాహామును యజమానుడని పిలుచుచు అతనికి లోబడెను; మీరును మేలు చేయుచు ఏ భయమునకును బెదరక యున్నయెడల ఆమెకు పిల్లలగుదురు'",
      "1 Peter 3:6",
      "As Sarah obeyed Abraham, calling him lord, whose daughters you are if you do good and are not afraid with any terror",
      "అటువలె శారా అబ్రాహామును యజమానుడని పిలుచుచు అతనికి లోబడెను; మీరును మేలు చేయుచు ఏ భయమునకును బెదరక యున్నయెడల ఆమెకు పిల్లలగుదురు",
      "Christian women inherit Sarah's spiritual nobility by pursuing gentle godliness while refusing to be intimidated by sudden panic or domestic anxiety.",
      "దేవునియందు నమ్మకముంచి ఏ బెదిరింపులకు భయపడక మేలు చేయుచు శాంతస్వభావము కలిగియుండు స్త్రీలు శారాకు నిజమైన కుమార్తెలు."
    ],
    [
      "Jude 1:22-23 on evangelistic rescue: 'And on some have compassion, making a distinction; but others save with fear, pulling them out of the fire, hating even the garment defiled by the flesh'",
      "యూదా 1:22-23 అగ్నిలోనుండి ఆత్మలను రక్షించుట: 'సందేహపడువారిమీద కనికరము చూపుడి; అగ్నిలోనుండి లాగినట్టు కొందరిని భయముతో రక్షించుడి, శరీరేచ్ఛలవలన మరకపడిన వస్త్రమును సహితము అసహ్యించుకొనుడి'",
      "Jude 1:22-23",
      "And on some have compassion, making a distinction; but others save with fear, pulling them out of the fire, hating even the garment defiled by the flesh",
      "సందేహపడువారిమీద కనికరము చూపుడి; అగ్నిలోనుండి లాగినట్టు కొందరిని రక్షించుడి; శరీరసంబంధమైన అపవిత్రతగల వస్త్రమును సహితము అసహ్యించుకొనుచు భయముతో కొందరిని కనికరించుడి",
      "Rescuing apostates demands spiritual urgency tempered with holy vigilance, lest the rescuer become infected by the moral contamination.",
      "నాశనపు అగ్నిలోనికి జారిపోవువారిని భయముతో లాగి రక్షించుచూ, వారి పాపపు మరకలు తమకు అంటకుండ చూచుకొనుట."
    ],
    [
      "Revelation 2:10 Christ comforting the persecuted church in Smyrna: 'Do not fear any of those things which you are about to suffer... Be faithful until death, and I will give you the crown of life'",
      "ప్రకటన 2:10 స్ముర్న సంఘమునకు ప్రభువు అభయము: 'నీవు పొందబోవు శ్రమలకు భయపడకుము; మరణమువరకు నమ్మకముగా ఉండుము, నేను నీకు జీవకిరీటమిచ్చెదను'",
      "Revelation 2:10",
      "Do not fear any of those things which you are about to suffer. Indeed, the devil is about to throw some of you into prison, that you may be tested... Be faithful until death, and I will give you the crown of life",
      "నీవు పొందబోవు శ్రమలకు భయపడకుము; ఇదిగో మీరు శోధింపబడునట్లు అపవాది మీలో కొందరిని చెరసాలలో వేయబోవుచున్నాడు... మరణమువరకు నమ్మకముగా ఉండుము, నేను నీకు జీవకిరీటమిచ్చెదను",
      "Christ does not promise exemption from prison or martyrdom, but disarms fear by guaranteeing the imperishable crown of eternal life.",
      "రాబోవు హింసలకు చెరసాల బాధలకు భయపడక మరణమువరకు నమ్మకముగా నిలిచిన పరిశుద్ధులకు క్రీస్తు నిత్య జీవకిరీటమును వాగ్దానము చేసెను."
    ],
    [
      "Revelation 11:18 the heavenly chorus at the seventh trumpet: 'The nations were angry, and Your wrath has come, and the time of the dead, that they should be judged, and that You should reward Your servants the prophets and the saints, and those who fear Your name, small and great'",
      "ప్రకటన 11:18 ఏడవ బూరధ్వనియొద్ద పరలోక స్తుతి: 'జనములు కోపగించెను గాని నీ ఉగ్రత వచ్చెను; మృతులు తీర్పుపొందు కాలము వచ్చెను, నీ దాసులైన ప్రవక్తలకును పరిశుద్ధులకును నీ నామమందు భయభక్తులు గల చిన్నలకును పెద్దలకును జీతమిచ్చు కాలము వచ్చెను'",
      "Revelation 11:18",
      "The nations were angry, and Your wrath has come, and the time of the dead, that they should be judged, and that You should reward Your servants the prophets and the saints, and those who fear Your name, small and great",
      "జనములు కోపగించెను గాని నీ ఉగ్రత వచ్చెను; మృతులు తీర్పుపొందు కాలము వచ్చెను, నీ దాసులైన ప్రవక్తలకును పరిశుద్ధులకును నీ నామమందు భయభక్తులు గల చిన్నలకును పెద్దలకును జీతమిచ్చుటకును... సమయము వచ్చెను",
      "Eschatological judgment vindicates all who revered God's name, rewarding every saint regardless of earthly prominence.",
      "తీర్పుదినమందు దేవుని నామమందు భయభక్తులు గల చిన్నవారికైనా పెద్దవారికైనా ఆయన నిత్య పరలోక బహుమానమును అనుగ్రహించును."
    ],
    [
      "Revelation 14:6-7 the everlasting gospel proclaimed to every nation: 'Fear God and give glory to Him, for the hour of His judgment has come; and worship Him who made heaven and earth, the sea and springs of water'",
      "ప్రకటన 14:6-7 ఆకాశమధ్యమున దూత ప్రకటించిన నిత్య సువార్త: 'దేవునికి భయపడి ఆయనను మహిమపరచుడి; ఆయన తీర్పుతీర్చు గడియ వచ్చెను గనుక ఆకాశమును భూమిని సముద్రమును జలధారలను సృజించినవానికే నమస్కారము చేయుడి'",
      "Revelation 14:7",
      "Saying with a loud voice, 'Fear God and give glory to Him, for the hour of His judgment has come; and worship Him who made heaven and earth, the sea and springs of water'",
      "ఆయన-దేవునికి భయపడి ఆయనను మహిమపరచుడి, ఆయన తీర్పుతీర్చు గడియ వచ్చెను గనుక ఆకాశమును భూమిని సముద్రమును జలధారలను సృజించినవానికే నమస్కారము చేయుడి అని గొప్ప స్వరముతో చెప్పెను",
      "The global angelic proclamation commands all rebellious humanity to abandon pagan idols and fear the sovereign Creator.",
      "సమస్త సృష్టిని కలుగజేసిన దేవునికి భయపడి ఆయనను మాత్రమే ఆరాధించుడని సర్వలోకమునకు ప్రకటించబడిన అంత్య సువార్త."
    ],
    [
      "Revelation 15:3-4 the song of Moses and the Lamb: 'Who shall not fear You, O Lord, and glorify Your name? For You alone are holy. For all nations shall come and worship before You'",
      "ప్రకటన 15:3-4 మోషే మరియు గొర్రెపిల్ల కీర్తన: 'ప్రభువా, ఎవడు నీకు భయపడకుండును? నీ నామమును మహిమపరచకుండును? నీవు మాత్రమే పరిశుద్ధుడవు; అన్యజనులందరు వచ్చి నీ సముఖమందు నమస్కారము చేతురు'",
      "Revelation 15:4",
      "Who shall not fear You, O Lord, and glorify Your name? For You alone are holy. For all nations shall come and worship before You, for Your judgments have been manifested",
      "ప్రభువా, ఎవడు నీకు భయపడకుండును? నీ నామమును మహిమపరచకుండును? నీవు మాత్రమే పరిశుద్ధుడవు, నీ న్యాయవిధులు ప్రత్యక్షపరచబడినవి గనుక సర్వజనులు వచ్చి నీ సన్నిధిని నమస్కారము చేతురు",
      "The redeemed overcomers standing on the sea of glass proclaim the inescapable universality of the fear and worship of God.",
      "గాజు సముద్రముపై నిలిచి మృగమును జయించిన పరిశుద్ధులు దేవుని పరిశుద్ధతను చాటుచూ 'ఎవడు నీకు భయపడకుండును?' అని గానము చేయుట."
    ],
    [
      "Revelation 19:5 a voice from the throne commanding universal praise: 'Praise our God, all you His servants and those who fear Him, both small and great!'",
      "ప్రకటన 19:5 సింహాసనమునుండి వచ్చిన దైవిక స్వరము: 'ఆయన దాసులారా, ఆయనకు భయపడువారలారా, చిన్నవారైనను పెద్దవారైనను మీరందరు మన దేవుని స్తుతించుడి'",
      "Revelation 19:5",
      "Then a voice came from the throne, saying, 'Praise our God, all you His servants and those who fear Him, both small and great!'",
      "మరియు-ఆయన దాసులారా, ఆయనకు భయపడువారలారా, చిన్నవారైనను పెద్దవారైనను మీరందరు మన దేవుని స్తుతించుడి అని చెప్పుచున్న ఒక స్వరము సింహాసనమునుండి వచ్చెను",
      "Heaven's climactic liturgy unites all who fear God across all social ranks into one thunderous symphony of hallelujahs.",
      "పరలోక సింహాసనమునుండి వెలువడిన ఆజ్ఞ: దేవునికి భయపడు చిన్న పెద్దలందరు ఏకమై హల్లెలూయా అని స్తుతించుడి."
    ],
    [
      "Revelation 21:8 the tragic roll call of the lost: 'But the cowardly, unbelieving, abominable, murderers, sexually immoral, sorcerers, idolaters, and all liars shall have their part in the lake which burns with fire and brimstone, which is the second death'",
      "ప్రకటన 21:8 అగ్నిగుండములో పాలుపొందువారి జాబితా: 'పిరికివారును, అవిశ్వాసులును, అసహ్యులును, నరహంతకులును, వ్యభిచారులును... అగ్నిగంధకములతో మండు గుండములో పాలుపొందుదురు; ఇది రెండవ మరణము'",
      "Revelation 21:8",
      "But the cowardly, unbelieving, abominable, murderers, sexually immoral, sorcerers, idolaters, and all liars shall have their part in the lake which burns with fire and brimstone, which is the second death",
      "పిరికివారును, అవిశ్వాసులును, అసహ్యులును, నరహంతకులును, వ్యభిచారులును, మాంత్రికులును, విగ్రహారాధకులును, అబద్ధికులందరును అగ్నిగంధకములతో మండు గుండములో పాలుపొందుదురు; ఇది రెండవ మరణము",
      "Startlingly, 'the cowardly' (deilois)-those who caved to fear rather than confessing Christ-head the list of those consigned to the second death.",
      "లోకమునకు భయపడి క్రీస్తును విడిచిపెట్టిన పిరికివారు అగ్నిగుండపు రెండవ మరణములో పాలుపొందుదురను గంభీరమైన హెచ్చరిక."
    ],
    [
      "Revelation 22:12-14 on the imminent parousia banishing all fear of injustice: 'Behold, I am coming quickly, and My reward is with Me, to give to every one according to his work'",
      "ప్రకటన 22:12-14 క్రీస్తు రాకడ సమస్త అన్యాయపు భయములను తీసివేయుట: 'ఇదిగో త్వరగా వచ్చుచున్నాను; వాని వాని క్రియచొప్పున ప్రతివానికిచ్చుటకు నా యొద్ద జీతమున్నది'",
      "Revelation 22:12-13",
      "And behold, I am coming quickly, and My reward is with Me, to give to every one according to his work. I am the Alpha and the Omega, the Beginning and the End, the First and the Last",
      "ఇదిగో త్వరగా వచ్చుచున్నాను; వాని వాని క్రియచొప్పున ప్రతివానికిచ్చుటకు నేను సిద్ధపరచిన జీతము నాయొద్ద ఉన్నది. నేనే అల్ఫాయు ఓమెగయు, మొదటివాడను కడపటివాడను, అలయు అంతమునై యున్నాను",
      "The rapid arrival of the Alpha and Omega assures embattled saints that every persecution, trial, and moment of fearless fidelity will receive eternal recompense.",
      "త్వరగా వచ్చుచున్న ఆల్ఫాయు ఓమెగయునైన ప్రభువు తన భక్తుల కన్నీళ్లను తుడిచి శ్రమలను భరించి నిలిచినవారికి నిత్య కిరీటమును ప్రసాదించును."
    ]
  ];

  return data.map(item => ({
    easyQ: `What NT revelation or doctrine regarding deliverance from fear is established in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి క్రొత్త నిబంధనలో ఇవ్వబడిన బోధ లేదా విమోచన సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does Christ's victory over death and the devil liberate believers from fear?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం మరణముపై సాతానుపై క్రీస్తు సాధించిన జయము విశ్వాసులను భయమునుండి ఎలా విడిపించుచున్నది?`,
    hardQ: `What theological principle does ${item[2]} reveal about holy reverence, spiritual warfare, and eternal victory over demonic intimidation?`,
    hardQTe: `${item[2]} ప్రకారం దేవునియందలి పవిత్ర భయభక్తులు మరియు సాతాను భయములను జయించు పరలోక రక్షణను గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He commanded seventy golden chariots stationed in the streets of Athens", "He ordered forty days of enforced seclusion in the hills of Galatia", "He established sixty stone altars outside the fortress of Antonia"],
    optionsTelugu: [item[4], "ఏథెన్సు వీధులలో డెబ్బై బంగారు రథములను నిలపవలెనని ఆజ్ఞాపించెను", "గలతీయ కొండలలో నలభై దినముల నిర్బంధ ఏకాంతమును విధించెను", "అంతోనియా కోట వెలుపల అరవై రాతి బలిపీఠములను స్థాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// Notice buildFearMastery has 30 items so far. We need 20 more to make exactly 50!
function getAdditionalFearMastery20() {
  const extra = [
    [
      "Luke 1:73-75 Zacharias's prophecy of fearless worship: 'To grant us that we, being delivered from the hand of our enemies, might serve Him without fear, in holiness and righteousness'",
      "లూకా 1:73-75 నిర్భయముగా ఆరాధించుటను గూర్చి జెకర్యా ప్రవచనము: 'శత్రువుల చేతినుండి విడిపింపబడి, మన జీవిత దినములన్నియు నిష్కళంకమైన పరిశుద్ధతతో భయములేకుండ ఆయనను సేవింప ననుగ్రహించుట'",
      "Luke 1:74-75",
      "To grant us that we, being delivered from the hand of our enemies, might serve Him without fear, in holiness and righteousness before Him all the days of our life",
      "మన శత్రువుల చేతినుండి విడిపింపబడి, మన జీవిత దినములన్నియు నిర్భయులమై ఆయన సన్నిధిని పరిశుద్ధతతోను నీతితోను ఆయనను సేవింప ననుగ్రహించుటకును... ఈ రక్షణ కలుగజేసెను",
      "Redemption delivers us from enemy oppression specifically so we can enjoy joyful, fearless, holy worship all our earthly days.",
      "శత్రువుల చేతినుండి విడిపింపబడిన విశ్వాసులు ఎటువంటి భయములేక జీవితాంతము దేవుని సన్నిధిలో పరిశుద్ధతతో ఆరాధించవచ్చును."
    ],
    [
      "Matthew 28:10 the risen Jesus to the women: 'Do not be afraid. Go and tell My brethren to go to Galilee, and there they will see Me'",
      "మత్తయి 28:10 పునరుత్థానుడైన యేసు స్త్రీలతో పలికిన మొదటి మాటలు: 'భయపడకుడి; మీరు వెళ్లి నా సహోదరులు గలిలయకు వెళ్లవలెననియు, అక్కడ వారు నన్ను చూతురనియు చెప్పుడి'",
      "Matthew 28:10",
      "Then Jesus said to them, 'Do not be afraid. Go and tell My brethren to go to Galilee, and there they will see Me'",
      "అప్పుడు యేసు-భయపడకుడి; మీరు వెళ్లి, నా సహోదరులు గలిలయకు వెళ్లవలెననియు, అక్కడ వారు నన్ను చూతురనియు వారికి తెలియజెప్పుడనెను",
      "The risen Christ immediately banishes resurrection shock, inviting His stumbling brothers into restored fellowship.",
      "పునరుత్థానుడైన రక్షకుడు ఎదురై పలికిన మొదటి మాట 'భయపడకుడి'; వైఫల్యములో ఉన్న శిష్యులను సహోదరులని పిలిచి సమాధానపరచెను."
    ],
    [
      "John 14:27 Jesus bequeathing His peace before the cross: 'Peace I leave with you, My peace I give to you... Let not your heart be troubled, neither let it be afraid'",
      "యోహాను 14:27 సిలువకు ముందు యేసు ఇచ్చిన శాంతి: 'శాంతి మీకనుగ్రహించి వెళ్లుచున్నాను, నా శాంతినే మీకిచ్చుచున్నాను... మీ హృదయమును కలవరపడనియ్యకుడి, వెరవనియ్యకుడి'",
      "John 14:27",
      "Peace I leave with you, My peace I give to you; not as the world gives do I give to you. Let not your heart be troubled, neither let it be afraid",
      "శాంతి మీకనుగ్రహించి వెళ్లుచున్నాను, నా శాంతినే మీకిచ్చుచున్నాను; లోకమిచ్చునట్టుగా నేను మీకిచ్చుటలేదు; మీ హృదయమును కలవరపడనియ్యకుడి, వెరవనియ్యకుడి",
      "Christ's supernatural shalom is a fortress that actively repels anxiety and terror in the darkest hours.",
      "లోకము ఇచ్చే తాత్కాలిక నెమ్మది వంటిది కాక తుఫానులలో సైతం హృదయమును భయపడకుండా కాపాడే క్రీస్తు శాంతి."
    ],
    [
      "John 16:33 Christ's final discourse guarantee: 'These things I have spoken to you, that in Me you may have peace. In the world you will have tribulation; but be of good cheer, I have overcome the world'",
      "యోహాను 16:33 లోకమును జయించిన రక్షకుని మాట: 'నాయందు మీకు సమాధానము కలుగునట్లు ఈ సంగతులు మీతో చెప్పితిని; లోకములో మీకు శ్రమ కలుగును, అయినను ధైర్యము తెచ్చుకొనుడి, నేను లోకమును జయించియున్నాను'",
      "John 16:33",
      "These things I have spoken to you, that in Me you may have peace. In the world you will have tribulation; but be of good cheer, I have overcome the world",
      "నాయందు మీకు సమాధానము కలుగునట్లు ఈ సంగతులు మీతో చెప్పితిని. లోకములో మీకు శ్రమ కలుగును; అయినను ధైర్యము తెచ్చుకొనుడి, నేను లోకమును జయించియున్నాను",
      "Tribulation is an earthly certainty, but fear is conquered because Christ has already decisively defeated the cosmos.",
      "లోకములో శ్రమలు తప్పవు గాని సర్వలోకమును జయించిన క్రీస్తు మనలో ఉన్నాడు గనుక ఏ శ్రమకైనా భయపడక ధైర్యము వహించవచ్చును."
    ],
    [
      "Acts 2:43 on holy fear falling upon every soul at Pentecost: 'Then fear came upon every soul, and many wonders and signs were done through the apostles'",
      "అపొస్తలుల కార్యములు 2:43 పెంతెకొస్తు తరువాత దిగిన పవిత్ర భయము: 'అప్పుడు ప్రతివానికిని భయము కలిగెను; మరియు అనేక మహత్కార్యములును సూచకక్రియలును అపొస్తలులద్వారా చేయబడెను'",
      "Acts 2:43",
      "Then fear came upon every soul, and many wonders and signs were done through the apostles",
      "అప్పుడు ప్రతివానికిని భయము కలిగెను; మరియు అనేక మహత్కార్యములును సూచకక్రియలును అపొస్తలులద్వారా చేయబడెను",
      "The supernatural presence of the Holy Spirit generates an electric holy awe that cleanses the church and arrests society.",
      "పరిశుద్ధాత్మ శక్తి దిగివచ్చినప్పుడు సమాజమంతటిపై దైవభయము కమ్మి అద్భుతములు సూచకక్రియలు విస్తారముగా జరిగెను."
    ],
    [
      "Acts 5:11 on the solemn fear falling after Ananias and Sapphira: 'So great fear came upon all the church and upon all who heard these things'",
      "అపొస్తలుల కార్యములు 5:11 అననీయ సప్పీరాల తీర్పు తరువాత సంఘమంతటిపై కలిగిన మహా భయము",
      "Acts 5:11",
      "So great fear came upon all the church and upon all who heard these things",
      "సంఘమంతటికిని ఈ సంగతులు విన్నవారికందరికిని మిక్కిలి భయము కలిగెను",
      "Divine discipline purges the church of hypocritical flippancy, anchoring believers in deep, reverent holiness.",
      "కపట భక్తిపై దేవుని తీర్పును చూచినప్పుడు సంఘములో పవిత్రమైన దైవభయము ప్రవేశించి పాపమునకు దూరముగా ఉండెను."
    ],
    [
      "Acts 10:34-35 Peter discovering the universal scope of grace at Cornelius's house: 'In truth I perceive that God shows no partiality. But in every nation whoever fears Him and works righteousness is accepted by Him'",
      "అపొస్తలుల కార్యములు 10:34-35 కొర్నేలి ఇంటిలో పేతురు గ్రహించిన సత్యము: 'దేవుడు పక్షపాతి కాడని నిజముగా గ్రహించియున్నాను; ప్రతి జనములోను ఆయనకు భయపడి నీతిగా నడుచుకొనువానిని ఆయన అంగీకరించును'",
      "Acts 10:34-35",
      "Then Peter opened his mouth and said: 'In truth I perceive that God shows no partiality. But in every nation whoever fears Him and works righteousness is accepted by Him'",
      "అప్పుడు పేతురు నోరుదెరచి యిట్లనెను-దేవుడు పక్షపాతి కాడని నిజముగా గ్రహించియున్నాను. ప్రతి జనములోను ఆయనకు భయపడి నీతిగా నడుచుకొనువానిని ఆయన అంగీకరించును",
      "Ethnic barriers collapse before the gospel: God accepts anyone from any nation who reveres Him and walks in righteousness.",
      "కుల మత జాతి విభేదములను దాటి దేవునికి భయపడి నీతిగా జీవించే ప్రతివానిని ఆయన ప్రేమతో స్వీకరించును."
    ],
    [
      "Acts 19:17 on the sons of Sceva failing and the name of the Lord Jesus being magnified: 'This became known both to all Jews and Greeks dwelling in Ephesus; and fear fell on them all, and the name of the Lord Jesus was magnified'",
      "అపొస్తలుల కార్యములు 19:17 ఎఫెసులో స్కేవ కుమారుల సంఘటన తరువాత: 'ఎఫెసులో కాపురమున్న యూదులకందరికిని గ్రీసుదేశస్థులకందరికిని ఇది తెలిసినప్పుడు వారికందరికిని భయము కలిగెను, ప్రభువైన యేసు నామము ఘనపరచబడెను'",
      "Acts 19:17",
      "This became known both to all Jews and Greeks dwelling in Ephesus; and fear fell on them all, and the name of the Lord Jesus was magnified",
      "ఎఫెసులో కాపురమున్న యూదులకందరికిని గ్రీసుదేశస్థులకందరికిని ఇది తెలిసినప్పుడు వారికందరికిని భయము కలిగెను, అంతట ప్రభువైన యేసు నామము ఘనపరచబడెను",
      "Counterfeit spirituality was exposed; demonic power trembled, causing an entire pagan city to revere the name of Jesus.",
      "దయ్యములు సైతం యేసు నామమునకు వణకినప్పుడు ప్రజల హృదయములలో దైవభయము రగిలి క్రీస్తు నామము మహిమపరచబడెను."
    ],
    [
      "Romans 3:18 identifying the core root of all human depravity: 'There is no fear of God before their eyes'",
      "రోమీయులకు 3:18 మానవ పాపపు మూలకారణము: 'వారి కన్నులయెదుట దైవభయము లేదు'",
      "Romans 3:18",
      "There is no fear of God before their eyes",
      "వారి కన్నులయెదుట దైవభయము లేదు",
      "Apostolic indictment of fallen humanity: every sin, injustice, and moral collapse stems from the absence of the fear of God.",
      "సమస్త పాపములకు అక్రమములకు మానవ పతనమునకు ఏకైక కారణము హృదయములో దైవభయము లేకపోవుటయే."
    ],
    [
      "Romans 11:20-21 warning Gentile believers against arrogance: 'Do not be haughty, but fear. For if God did not spare the natural branches, He may not spare you either'",
      "రోమీయులకు 11:20-21 అన్యులైన విశ్వాసులకు పౌలు హెచ్చరిక: 'గర్వపడక భయపడుము; దేవుడు సహజమైన కొమ్మలను విడిచిపెట్టనియెడల నిన్నును విడిచిపెట్టకపోవును'",
      "Romans 11:20-21",
      "Do not be haughty, but fear. For if God did not spare the natural branches, He may not spare you either",
      "వారు అవిశ్వాసమునుబట్టి విరిచివేయబడిరి, నీవైతే విశ్వాసమువలననే నిలిచియున్నావు; గర్వపడక భయపడుము. దేవుడు సహజమైన కొమ్మలను విడిచిపెట్టనియెడల నిన్నును విడిచిపెట్టకపోవును",
      "Holy trembling safeguards against spiritual presumption; standing in grace demands continual humility before God's severity.",
      "దేవుని కృపలో నిలిచియున్నామని గర్వించక పవిత్ర భయముతో వినయము కలిగియుండవలెనన్న హెచ్చరిక."
    ],
    [
      "1 Corinthians 16:10-11 regarding young Timothy: 'Now if Timothy comes, see that he may be with you without fear; for he does the work of the Lord, as I also do'",
      "1 కొరింథీయులకు 16:10-11 తిమోతిని గూర్చి పౌలు ఆదేశము: 'తిమోతి వచ్చినయెడల అతడు మీయొద్ద నిర్భయముగా ఉండునట్లు చూచుకొనుడి; ఏలయనగా అతడు ప్రభువు పని చేయుచున్నాడు'",
      "1 Corinthians 16:10",
      "Now if Timothy comes, see that he may be with you without fear; for he does the work of the Lord, as I also do",
      "తిమోతి వచ్చినయెడల అతడు మీయొద్ద నిర్భయముగా ఉండునట్లు చూచుకొనుడి; ఏలయనగా నావలెనే అతడును ప్రభువు పని చేయుచున్నాడు",
      "Churches must cultivate a welcoming culture of honor and safety so young ministers can serve free from intimidation.",
      "దేవుని సేవకులు సంఘమునకు వచ్చినప్పుడు వారిని ఏ భయములేక స్వేచ్ఛగా పరిచర్య చేయునట్లు ప్రేమతో ఆదరించు బాధ్యత."
    ],
    [
      "2 Corinthians 7:15 on Titus remembering the obedience of the Corinthians: 'How with fear and trembling you received him'",
      "2 కొరింథీయులకు 7:15 తీతుకు కొరింథీయులు చూపిన విధేయత: 'మీరందరు భయముతోను వణకుతోను నన్ను చేర్చుకొంటిరి'",
      "2 Corinthians 7:15",
      "And his affections are greater for you as he remembers the obedience of all of you, how with fear and trembling you received him",
      "మీరందరు ఏలాగు విధేయులైతిరో, భయముతోను వణకుతోను అతనిని ఏలాగు చేర్చుకొంటిరో జ్ఞాపకము చేసికొనునప్పుడు అతని హృదయము మీయెడల మరి విశేషముగా కనికరపడుచున్నది",
      "Receiving God's messengers with reverent humility demonstrates a church's repentant submission to apostolic authority.",
      "దేవుని సేవకుని మాటలను దైవభయముతో వణకుతో అంగీకరించి విధేయత చూపిన కొరింథీ సంఘపు పశ్చాత్తాపము."
    ],
    [
      "Ephesians 6:5 on servant obedience: 'Bondservants, be obedient to those who are your masters according to the flesh, with fear and trembling, in sincerity of heart, as to Christ'",
      "ఎఫెసీయులకు 6:5 యజమానులకు లోబడుట: 'దాసులారా, క్రీస్తునకువలె భయముతోను వణకుతోను నిష్కపటమైన హృదయముగలవారై శరీరరీత్యా మీ యజమానులైనవారికి లోబడుడి'",
      "Ephesians 6:5",
      "Bondservants, be obedient to those who are your masters according to the flesh, with fear and trembling, in sincerity of heart, as to Christ",
      "దాసులారా, క్రీస్తునకువలె భయముతోను వణకుతోను నిష్కపటమైన హృదయముగలవారై శరీరరీత్యా మీ యజమానులైనవారికి లోబడుడి",
      "Working conscientiously under human authority as if serving the Lord Jesus Himself purges workplace sloth and hypocrisy.",
      "మనుష్యుల మెప్పుకొరకు కాక క్రీస్తుకే భయపడి నిష్కపట హృదయముతో విధేయత చూపు క్రైస్తవ పనితత్వము."
    ],
    [
      "1 Timothy 5:20 on elders who persist in sin: 'Those who are sinning rebuke in the presence of all, that the rest also may fear'",
      "1 తిమోతి 5:20 పాపములో కొనసాగు పెద్దలను గద్దించుట: 'తక్కినవారును భయపడునట్లు పాపము చేయువారిని అందరియెదుట గద్దించుము'",
      "1 Timothy 5:20",
      "Those who are sinning rebuke in the presence of all, that the rest also may fear",
      "తక్కినవారును భయపడునట్లు పాపము చేయువారిని అందరియెదుట గద్దించుము",
      "Public ecclesiastical accountability for sinning leaders instills healthy, deterrent reverent fear across the congregation.",
      "నాయకులు పాపము చేసినప్పుడు పక్షపాతములేక గద్దించుట సంఘమంతటిలో పాపము చేయకుండ పవిత్ర భయమును నిలుపును."
    ],
    [
      "Hebrews 10:31 solemn warning regarding apostasy: 'It is a fearful thing to fall into the hands of the living God'",
      "హెబ్రీయులకు 10:31 దేవుని తీర్పును గూర్చి భయంకర హెచ్చరిక: 'జీవముగల దేవుని చేతిలో పడుట భయంకరము'",
      "Hebrews 10:31",
      "It is a fearful thing to fall into the hands of the living God",
      "జీవముగల దేవుని చేతిలో పడుట భయంకరము",
      "Deliberately trampling the Son of God invites terrifying retribution; God's holy justice cannot be mocked with impunity.",
      "క్రీస్తు రక్తమును తృణీకరించి కృపానిధియైన ఆత్మను అవమానించిన తిరుగుబాటుదారులకు దేవుని న్యాయపు తీర్పు అత్యంత భయంకరముగా ఉండును."
    ],
    [
      "Hebrews 4:1 on the promise of entering His rest: 'Therefore, since a promise remains of entering His rest, let us fear lest any of you seem to have come short of it'",
      "హెబ్రీయులకు 4:1 పరలోక విశ్రాంతిని కోల్పోకుండుట: 'ఆయనయొక్క విశ్రాంతిలో ప్రవేశించుదుమను వాగ్దానము ఇంకను నిలిచియుండగా, మీలో ఎవడైనను ఒకవేళ తప్పిపోవునేమో అని భయపడదము'",
      "Hebrews 4:1",
      "Therefore, since a promise remains of entering His rest, let us fear lest any of you seem to have come short of it",
      "కాబట్టి ఆయనయొక్క విశ్రాంతిలో ప్రవేశించుదుమను వాగ్దానము ఇంకను నిలిచియుండగా, మీలో ఎవడైనను ఒకవేళ ఆ విశ్రాంతిని పొందకుండ తప్పిపోవునేమో అని భయము కలిగియుందము",
      "A healthy, vigilant fear of forfeiting God's eternal rest through unbelief drives relentless perseverance in the faith.",
      "ఇశ్రాయేలీయులవలె అవిశ్వాసముచేత పరలోక విశ్రాంతిని కోల్పోకుండ పరిశుద్ధ భయముతో జాగ్రత్తపడవలెనన్న బోధ."
    ],
    [
      "Revelation 1:17 John collapsing before the exalted Christ: 'When I saw Him, I fell at His feet as dead. But He laid His right hand on me, saying to me, Do not be afraid'",
      "ప్రకటన 1:17 మహిమోన్నతుడైన క్రీస్తు పాదములయొద్ద పడిన యోహానుకు అభయము: 'నేను ఆయనను చూడగానే చచ్చినవానివలె ఆయన పాదములయొద్ద పడితిని; ఆయన తన కుడిచేతిని నామీద ఉంచి-భయపడకుము అనెను'",
      "Revelation 1:17",
      "And when I saw Him, I fell at His feet as dead. But He laid His right hand on me, saying to me, 'Do not be afraid; I am the First and the Last'",
      "నేను ఆయనను చూడగానే చచ్చినవానివలె ఆయన పాదములయొద్ద పడితిని; ఆయన తన కుడిచేతిని నామీద ఉంచి నాతో ఇట్లనెను-భయపడకుము; నేను మొదటివాడను కడపటివాడను",
      "Even the beloved disciple who leaned on Jesus' breast was overwhelmed by His unveiled cosmic majesty, immediately comforted by His right hand.",
      "క్రీస్తు అపరిమిత మహిమను చూచి మనుష్యుడు నిలువలేడు; అయితే ఆయన ప్రేమగల కుడిచేయి తాకగానే సర్వ భయము అదృశ్యమగును."
    ],
    [
      "Revelation 18:9-10 on the kings of the earth weeping over Babylon: 'Standing at a distance for fear of her torment, saying, Alas, alas, that great city Babylon'",
      "ప్రకటన 18:9-10 బబులోను పతనమును చూచి భూరాజుల భయకంపితము: 'దాని యాతనకు భయపడి దూరముగా నిలువబడి-అయ్యో, అయ్యో, బబులోనా, మహా పట్టణమా అని ఏడ్చుదురు'",
      "Revelation 18:10",
      "Standing at a distance for fear of her torment, saying, 'Alas, alas, that great city Babylon, that mighty city! For in one hour your judgment has come'",
      "దాని యాతనకు భయపడి దూరముగా నిలువబడి-అయ్యో, అయ్యో, బబులోనా, మహా పట్టణమా, బలమైన పట్టణమా, ఒక్క గడియలోనే నీకు తీర్పు వచ్చెనే అని చెప్పుదురు",
      "Worldly powers that indulged in corrupt luxury watch from afar in absolute panic as God's overnight judgment obliterates Babylon.",
      "లోక భోగములలో జీవించిన మహా నగరము ఒక్క గడియలోనే కాలిపోవుట చూచి లోక రాజులు భయముతో వణికిపోవుదురు."
    ],
    [
      "Luke 12:4-5 Jesus commanding holy priorities: 'I say to you, My friends, do not be afraid of those who kill the body... Yes, I say to you, fear Him!'",
      "లూకా 12:4-5 స్నేహితులతో యేసు పలికిన మాట: 'నా స్నేహితులైన మీతో చెప్పుచున్నాను-శరీరమును చంపిన తరువాత మరి ఏమియు చేయనేరనివారికి భయపడకుడి; ఎవరికి భయపడవలెనో మీకు చూపెదను, నరకములో పడద్రోయు శక్తిగల దేవునికే భయపడుడి'",
      "Luke 12:4-5",
      "And I say to you, My friends, do not be afraid of those who kill the body, and after that have no more that they can do. But I will show you whom you should fear: Fear Him who, after He has killed, has power to cast into hell; yes, I say to you, fear Him!",
      "నా స్నేహితులైన మీతో చెప్పుచున్నాను-శరీరమును చంపిన తరువాత మరి ఏమియు చేయనేరనివారికి భయపడకుడి. మీరు ఎవరికి భయపడవలెనో మీకు చూపెదను; చంపిన తరువాత నరకములో పడద్రోయుటకు అధికారముగలవానికి భయపడుడి; అవును ఆయనకే భయపడుడని మీతో చెప్పుచున్నాను",
      "Jesus calls His disciples 'My friends' as He liberates them from the fear of physical martyrdom through clear theological perspective.",
      "మనలను స్నేహితులని పిలిచిన యేసు, తాత్కాలిక మరణమును తెచ్చే మనుష్యులకు భయపడక నిత్యత్వమునకు అధిపతియైన దేవునికే భయపడవలెనని నేర్పెను."
    ],
    [
      "Revelation 2:17 promising hidden manna and a white stone with a new name to the fearless overcomer",
      "ప్రకటన 2:17 శ్రమలలో భయపడక జయించినవానికి దాచబడిన మన్నాను మరియు క్రొత్త పేరుగల తెల్లరాతిని ఇచ్చెదనను వాగ్దానము",
      "Revelation 2:17",
      "To him who overcomes I will give some of the hidden manna to eat. And I will give him a white stone, and on the stone a new name written which no one knows except him who receives it",
      "జయించువానికి దాచబడిన మన్నాను భుజింపనిత్తును; మరియు అతనికి తెల్లరాతిని, ఆ రాతిమీద చెక్కబడిన యొక క్రొత్త పేరును ఇచ్చెదను; పొందినవానికే గాని మరి ఎవనికిని ఆ పేరు తెలియదు",
      "Enduring worldly terror with steadfast fidelity wins intimate heavenly nourishment and the personalized token of Christ's eternal favor.",
      "లోక బెదిరింపులకు లొంగిపోక జయించిన విశ్వాసికి పరలోకమందు దాచబడిన మన్నాను క్రీస్తు ఇచ్చే నూతన నామముగల తెల్లరాతిని బహుమానముగా పొందును."
    ]
  ];

  return extra.map(item => ({
    easyQ: `What NT revelation or doctrine regarding deliverance from fear is established in ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి క్రొత్త నిబంధనలో ఇవ్వబడిన బోధ లేదా విమోచన సత్యమేమి?`,
    medQ: `According to ${item[2]}, how does Christ's victory over death and the devil liberate believers from fear?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం మరణముపై సాతానుపై క్రీస్తు సాధించిన జయము విశ్వాసులను భయమునుండి ఎలా విడిపించుచున్నది?`,
    hardQ: `What theological principle does ${item[2]} reveal about holy reverence, spiritual warfare, and eternal victory over demonic intimidation?`,
    hardQTe: `${item[2]} ప్రకారం దేవునియందలి పవిత్ర భయభక్తులు మరియు సాతాను భయములను జయించు పరలోక రక్షణను గూర్చి ఏమి గ్రహించవలెను?`,
    options: [item[3], "He commanded seventy golden chariots stationed in the streets of Athens", "He ordered forty days of enforced seclusion in the hills of Galatia", "He established sixty stone altars outside the fortress of Antonia"],
    optionsTelugu: [item[4], "ఏథెన్సు వీధులలో డెబ్బై బంగారు రథములను నిలపవలెనని ఆజ్ఞాపించెను", "గలతీయ కొండలలో నలభై దినముల నిర్బంధ ఏకాంతమును విధించెను", "అంతోనియా కోట వెలుపల అరవై రాతి బలిపీఠములను స్థాపించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

const fFacts = buildFearFoundation();
const gFacts = buildFearGrowth();
const mFacts = [...buildFearMastery(), ...getAdditionalFearMastery20()];

console.log(`Fear Foundation facts count: ${fFacts.length}`);
console.log(`Fear Growth facts count: ${gFacts.length}`);
console.log(`Fear Mastery facts count: ${mFacts.length}`);

buildBank('Fear', 'fea', fFacts, gFacts, mFacts);
