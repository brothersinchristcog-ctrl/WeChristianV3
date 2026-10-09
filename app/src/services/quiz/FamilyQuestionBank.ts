import { QuizQuestion, QuizDifficulty } from '../../types/Quiz';

export interface StageQuestions {
  foundation: QuizQuestion[];
  growth: QuizQuestion[];
  mastery: QuizQuestion[];
}

export const FAMILY_EASY_FOUNDATION: QuizQuestion[] = [
  {
    "id": "fam_e_s1_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who was the first husband and wife created by God in Genesis?",
    "questionTelugu": "ఆదికాండములో దేవుడు సృష్టించిన మొదటి భార్యాభర్తలు ఎవరు?",
    "options": [
      "Adam and Eve",
      "Abraham and Sarah",
      "Isaac and Rebekah",
      "Noah and his wife"
    ],
    "optionsTelugu": [
      "ఆదాము మరియు హవ్వ",
      "అబ్రాహాము మరియు శారా",
      "ఇస్సాకు మరియు రిబ్కా",
      "నోవహు మరియు ఆయన భార్య"
    ],
    "correctAnswer": "Adam and Eve",
    "bibleReference": "Genesis 2:21-25",
    "explanation": "God created Adam first and formed Eve from his side as his wife.",
    "explanationTelugu": "దేవుడు మొదట ఆదామును సృష్టించి, ఆ తరువాత హవ్వను భార్యగా చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which commandment says: \"Honor your father and your mother\"?",
    "questionTelugu": "\"నీ తండ్రిని నీ తల్లిని సన్మానించుము\" అని ఆజ్ఞాపించు ఆజ్ఞ ఏది?",
    "options": [
      "Fifth Commandment",
      "Second Commandment",
      "Seventh Commandment",
      "Ninth Commandment"
    ],
    "optionsTelugu": [
      "ఐదవ ఆజ్ఞ",
      "రెండవ ఆజ్ఞ",
      "ఏడవ ఆజ్ఞ",
      "తొమ్మిదవ ఆజ్ఞ"
    ],
    "correctAnswer": "Fifth Commandment",
    "bibleReference": "Exodus 20:12",
    "explanation": "Exodus 20:12 promises long life to those who honor their parents.",
    "explanationTelugu": "నిర్గమ 20:12 తల్లిదండ్రులను సన్మానించినప్పుడు దీర్ఘాయుష్షు లభిస్తుందని సెలవిచ్చుచున్నది.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who gave his favorite son Joseph an ornamental coat of many colors?",
    "questionTelugu": "తన ప్రియ కుమారుడైన యోసేపుకు రంగురంగుల నిలువుటంగీని ఇచ్చిన తండ్రి ఎవరు?",
    "options": [
      "Jacob",
      "Abraham",
      "Isaac",
      "Jesse"
    ],
    "optionsTelugu": [
      "యాకోబు",
      "అబ్రాహాము",
      "ఇస్సాకు",
      "యెష్షయి"
    ],
    "correctAnswer": "Jacob",
    "bibleReference": "Genesis 37:3",
    "explanation": "Jacob loved Joseph more than any of his other sons.",
    "explanationTelugu": "ఇశ్రాయేలు తన ఇతర కుమారులకంటె యోసేపును ఎక్కువగా ప్రేమించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which devoted daughter-in-law refused to leave Naomi?",
    "questionTelugu": "నయోమిని విడిచిపెట్టడానికి నిరాకరించిన భక్తిగల కోడలు ఎవరు?",
    "options": [
      "Ruth",
      "Orpah",
      "Michal",
      "Vashti"
    ],
    "optionsTelugu": [
      "రూతు",
      "ఓర్పా",
      "మీకాలు",
      "వష్తి"
    ],
    "correctAnswer": "Ruth",
    "bibleReference": "Ruth 1:16",
    "explanation": "Ruth declared: \"Where you go I will go, and where you stay I will stay.\"",
    "explanationTelugu": "రూతు: \"నీవు వెళ్ళుచోటికి నేను వచ్చెదను, నీ జనమే నా జనము\" అని పలికెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "Who announced: \"As for me and my household, we will serve the Lord\"?",
    "questionTelugu": "\"నేనును నా యింటివారును యెహోవాను సేవించెదము\" అని ప్రకటించినది ఎవరు?",
    "options": [
      "Joshua",
      "Moses",
      "Caleb",
      "Gideon"
    ],
    "optionsTelugu": [
      "యెహోషువ",
      "మోషే",
      "కాలేబు",
      "గిద్యోను"
    ],
    "correctAnswer": "Joshua",
    "bibleReference": "Joshua 24:15",
    "explanation": "Joshua made this covenant declaration before all Israel at Shechem.",
    "explanationTelugu": "యెహోషువ షెకెములో ఇశ్రాయేలు ప్రజలందరి యెదుట ఈ తీర్మానము చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "What holy union is formed when a man leaves father and mother and is joined to his wife?",
    "questionTelugu": "పురుషుడు తల్లిదండ్రులను విడిచి భార్యను హత్తుకొనుట ద్వారా ఏ పవిత్ర సంబంధము ఏర్పడును?",
    "options": [
      "Marriage",
      "Kingdom",
      "Synagogue",
      "Tabernacle"
    ],
    "optionsTelugu": [
      "వివాహము",
      "రాజ్యము",
      "సమాజమందిరము",
      "ప్రత్యక్షపు గుడారము"
    ],
    "correctAnswer": "Marriage",
    "bibleReference": "Genesis 2:24",
    "explanation": "Genesis 2:24 describes the divine institution of marriage.",
    "explanationTelugu": "ఆదికాండము 2:24 వివాహ వ్యవస్థను దైవికముగా స్థాపించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which twin brothers were born to Isaac and Rebekah?",
    "questionTelugu": "ఇస్సాకు మరియు రిబ్కాలకు జన్మించిన కవల సోదరులు ఎవరు?",
    "options": [
      "Jacob and Esau",
      "Cain and Abel",
      "Ephraim and Manasseh",
      "Moses and Aaron"
    ],
    "optionsTelugu": [
      "యాకోబు మరియు ఏశావు",
      "కయీను మరియు హేబెలు",
      "ఎఫ్రాయిము మరియు మనష్షే",
      "మోషే మరియు అహరోను"
    ],
    "correctAnswer": "Jacob and Esau",
    "bibleReference": "Genesis 25:24-26",
    "explanation": "Esau was born reddish and hairy, and Jacob held his heel.",
    "explanationTelugu": "ఏశావు ఎర్రని రోమములు గలవాడిగా, యాకోబు అతని మడమను పట్టుకొని జన్మించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "How many people in Noah’s immediate family were saved aboard the ark?",
    "questionTelugu": "నోవహు కుటుంబములో మొత్తం ఎంతమంది ఓడలో రక్షింపబడిరి?",
    "options": [
      "Eight people",
      "Four people",
      "Ten people",
      "Twelve people"
    ],
    "optionsTelugu": [
      "ఎనిమిది మంది",
      "నలుగురు",
      "పది మంది",
      "పన్నెండు మంది"
    ],
    "correctAnswer": "Eight people",
    "bibleReference": "1 Peter 3:20",
    "explanation": "Noah, his wife, his three sons, and their three wives made eight souls.",
    "explanationTelugu": "నోవహు, ఆయన భార్య, ముగ్గురు కుమారులు మరియు వారి భార్యలు కలిసి 8 మంది.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "Who was the youngest of Jesse’s eight sons, chosen as king?",
    "questionTelugu": "యెష్షయి ఎనిమిది మంది కుమారులలో రాజుగా ఎన్నుకోబడిన కనిష్ఠ కుమారుడు ఎవరు?",
    "options": [
      "David",
      "Eliab",
      "Shammah",
      "Abinadab"
    ],
    "optionsTelugu": [
      "దావీదు",
      "ఎలీయాబు",
      "షమ్మా",
      "అబీనాదాబు"
    ],
    "correctAnswer": "David",
    "bibleReference": "1 Samuel 16:10-13",
    "explanation": "The Lord looked on the heart and chose David the youngest.",
    "explanationTelugu": "యెహోవా హృదయమును లక్ష్యపెట్టి కనిష్ఠుడైన దావీదును ఎన్నుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "What are children declared to be in Psalm 127:3?",
    "questionTelugu": "కీర్తనలు 127:3 లో కుమారులు ఏమని పిలువబడిరి?",
    "options": [
      "A heritage from the Lord",
      "A worldly chore",
      "A financial debt",
      "A trial of patience"
    ],
    "optionsTelugu": [
      "యెహోవా అనుగ్రహించు స్వాస్థ్యము",
      "లౌకిక భారము",
      "ఆర్థిక ఋణము",
      "ఓర్పుకు పరీక్ష"
    ],
    "correctAnswer": "A heritage from the Lord",
    "bibleReference": "Psalm 127:3",
    "explanation": "\"Children are a heritage from the Lord, offspring a reward from Him.\"",
    "explanationTelugu": "\"కుమారులు యెహోవా అనుగ్రహించు స్వాస్థ్యము; గర్భఫలము ఆయన యిచ్చు బహుమానమే.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who was the godly mother of John the Baptist?",
    "questionTelugu": "బాప్తిస్మమిచ్చు యోహాను యొక్క భక్తిగల తల్లి ఎవరు?",
    "options": [
      "Elizabeth",
      "Salome",
      "Martha",
      "Joanna"
    ],
    "optionsTelugu": [
      "ఎలీసబెతు",
      "సలోమే",
      "మార్త",
      "యొహన్నా"
    ],
    "correctAnswer": "Elizabeth",
    "bibleReference": "Luke 1:5-13",
    "explanation": "Elizabeth was righteous before God and gave birth to John in old age.",
    "explanationTelugu": "ఎలీసబెతు దేవుని యెదుట నీతిమంతురాలై వృద్ధాప్యమందు యోహానును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which virgin of Nazareth was chosen to be the mother of the Savior?",
    "questionTelugu": "రక్షకుని తల్లిగా ఎన్నుకోబడిన నజరేతు కన్యక ఎవరు?",
    "options": [
      "Mary",
      "Hannah",
      "Dorcas",
      "Priscilla"
    ],
    "optionsTelugu": [
      "మరియ",
      "హన్నా",
      "దొర్కా",
      "ప్రిస్కిల్లా"
    ],
    "correctAnswer": "Mary",
    "bibleReference": "Luke 1:26-31",
    "explanation": "The angel Gabriel told Mary she was highly favored to bear Jesus.",
    "explanationTelugu": "గబ్రియేలు దూత మరియతో దేవుని వలన కృప పొందితివని తెలిపెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "What occupation did Joseph, Jesus’ earthly guardian, have in Nazareth?",
    "questionTelugu": "యేసు శరీరధారియైన తండ్రి యోసేపు నజరేతులో ఏ పని చేసెను?",
    "options": [
      "Carpenter",
      "Fisherman",
      "Tentmaker",
      "Tax collector"
    ],
    "optionsTelugu": [
      "వడ్రంగి",
      "జాలరి",
      "గుడారములు కుట్టువాడు",
      "సుంకపు గుత్తేదారు"
    ],
    "correctAnswer": "Carpenter",
    "bibleReference": "Matthew 13:55",
    "explanation": "People in Nazareth asked: \"Is not this the carpenter’s son?\"",
    "explanationTelugu": "నజరేతు ప్రజలు: \"ఇతడు వడ్రంగి కుమారుడు కాడా?\" అని అడిగిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which brother and two sisters welcomed Jesus into their home in Bethany?",
    "questionTelugu": "బేతనియలో యేసును తమ గృహములోనికి చేర్చుకున్న సహోదరుడు మరియు ఇద్దరు సహోదరీలు ఎవరు?",
    "options": [
      "Lazarus, Mary, and Martha",
      "Peter, Andrew, and James",
      "John, James, and Salome",
      "Aquila, Priscilla, and Phoebe"
    ],
    "optionsTelugu": [
      "లాజరు, మరియ, మరియు మార్త",
      "పేతురు, అంద్రెయ, మరియు యాకోబు",
      "యోహాను, యాకోబు, మరియు సలోమే",
      "అకుల, ప్రిస్కిల్లా, మరియు ఫేబే"
    ],
    "correctAnswer": "Lazarus, Mary, and Martha",
    "bibleReference": "John 11:1-3",
    "explanation": "Jesus deeply loved this family in Bethany and raised Lazarus from death.",
    "explanationTelugu": "యేసు ఈ బేతనియ కుటుంబాన్ని ఎంతగానో ప్రేమించి లాజరును లేపెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "What instruction is given to parents in Proverbs 22:6?",
    "questionTelugu": "సామెతలు 22:6 లో తల్లిదండ్రులకు ఇవ్వబడిన బోధ ఏమిటి?",
    "options": [
      "Train up a child in the way he should go",
      "Give a child all worldly wealth",
      "Leave a child to his own desires",
      "Shield a child from all work"
    ],
    "optionsTelugu": [
      "బాలుడు నడవవలసిన త్రోవను వానికి నేర్పుము",
      "సకల ఐశ్వర్యములను సమకూర్చుము",
      "వాని ఇష్టానుసారము విడిచిపెట్టుము",
      "ఎటువంటి పనీ చేయించవద్దు"
    ],
    "correctAnswer": "Train up a child in the way he should go",
    "bibleReference": "Proverbs 22:6",
    "explanation": "\"Train up a child in the way he should go: and when he is old, he will not depart from it.\"",
    "explanationTelugu": "\"బాలుడు నడవవలసిన త్రోవను వానికి నేర్పుము, అతడు పెద్దవాడైనప్పుడు దానినుండి తొలగిపోడు.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "Why was Eve given her name by Adam?",
    "questionTelugu": "ఆదాము హవ్వకు ఆ పేరు పెట్టడానికి కారణమేమిటి?",
    "options": [
      "Because she was the mother of all living",
      "Because she was formed from clay",
      "Because she named the animals",
      "Because she was an angel"
    ],
    "optionsTelugu": [
      "ఆమె జీవముగల ప్రతివానికిని తల్లియైనందున",
      "ఆమె మంటినుండి చేయబడినందున",
      "ఆమె జంతువులకు పేరు పెట్టినందున",
      "ఆమె దేవదూత అయినందున"
    ],
    "correctAnswer": "Because she was the mother of all living",
    "bibleReference": "Genesis 3:20",
    "explanation": "Adam named his wife Eve because she would become the mother of all the living.",
    "explanationTelugu": "హవ్వ జీవముగల ప్రతివానికిని తల్లియైనందున ఆదాము ఆమెకు ఆ పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "How old was Sarah when she gave birth to promised son Isaac?",
    "questionTelugu": "వాగ్దాన కుమారుడైన ఇస్సాకును కనినప్పుడు శారా వయస్సు ఎంత?",
    "options": [
      "90 years old",
      "70 years old",
      "50 years old",
      "100 years old"
    ],
    "optionsTelugu": [
      "90 సంవత్సరాలు",
      "70 సంవత్సరాలు",
      "50 సంవత్సరాలు",
      "100 సంవత్సరాలు"
    ],
    "correctAnswer": "90 years old",
    "bibleReference": "Genesis 17:17, 21:1-5",
    "explanation": "Sarah was 90 and Abraham was 100 when Isaac was born.",
    "explanationTelugu": "ఇస్సాకు పుట్టినప్పుడు శారాకు 90 ఏళ్లు, అబ్రాహాముకు 100 ఏళ్లు.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who watched over baby Moses as he floated in the Nile river basket?",
    "questionTelugu": "నైలు నది బుట్టలో తేలుచున్న శిశువైన మోషేను కనిపెట్టుకొని చూచిన సోదరి ఎవరు?",
    "options": [
      "Miriam",
      "Deborah",
      "Jael",
      "Dinah"
    ],
    "optionsTelugu": [
      "మిర్యాము",
      "దెబోరా",
      "యాయేలు",
      "దీనా"
    ],
    "correctAnswer": "Miriam",
    "bibleReference": "Exodus 2:4",
    "explanation": "His sister Miriam stood at a distance to see what would happen to him.",
    "explanationTelugu": "అతని సహోదరియైన మిర్యాము దూరముగా నిలిచి ఏమి జరుగునో చూచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "Who were the Levite parents of Moses, Aaron, and Miriam?",
    "questionTelugu": "మోషే, అహరోను, మరియు మిర్యాముల లేవీయ తల్లిదండ్రులు ఎవరు?",
    "options": [
      "Amram and Jochebed",
      "Elkanah and Hannah",
      "Zechariah and Elizabeth",
      "Boaz and Ruth"
    ],
    "optionsTelugu": [
      "అమ్రాము మరియు యోకెబెదు",
      "ఎల్కానా మరియు హన్నా",
      "జెకర్యా మరియు ఎలీసబెతు",
      "బోయజు మరియు రూతు"
    ],
    "correctAnswer": "Amram and Jochebed",
    "bibleReference": "Exodus 6:20",
    "explanation": "Amram married his father’s sister Jochebed, who bore him Aaron and Moses.",
    "explanationTelugu": "అమ్రాము యోకెబెదును వివాహము చేసుకొనెను; ఆమె అహరోనును మోషేను కనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "What is the command to children in Ephesians 6:1?",
    "questionTelugu": "ఎఫెసీయులకు 6:1 లో పిల్లలకు ఇవ్వబడిన ఆజ్ఞ ఏమిటి?",
    "options": [
      "Obey your parents in the Lord",
      "Argue with elders",
      "Leave your family early",
      "Follow worldly trends"
    ],
    "optionsTelugu": [
      "ప్రభువునందు మీ తల్లిదండ్రులకు విధేయులై యుండుడి",
      "పెద్దలతో వాదించుడి",
      "కుటుంబాన్ని త్వరగా వదిలేయుడి",
      "లోకపు రీతులను అనుసరించుడి"
    ],
    "correctAnswer": "Obey your parents in the Lord",
    "bibleReference": "Ephesians 6:1",
    "explanation": "\"Children, obey your parents in the Lord, for this is right.\"",
    "explanationTelugu": "\"పిల్లలారా, ప్రభువునందు మీ తల్లిదండ్రులకు విధేయులై యుండుడి, ఇది ధర్మమే.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which only son did Abraham willingly offer on Mount Moriah?",
    "questionTelugu": "మోరీయా పర్వతముపై అబ్రాహాము దేవునికి బలిగా అర్పించుటకు సిద్ధపడిన కుమారుడు ఎవరు?",
    "options": [
      "Isaac",
      "Ishmael",
      "Eliezer",
      "Midian"
    ],
    "optionsTelugu": [
      "ఇస్సాకు",
      "ఇష్మాయేలు",
      "ఎలీయెజెరు",
      "మిద్యాను"
    ],
    "correctAnswer": "Isaac",
    "bibleReference": "Genesis 22:2",
    "explanation": "God tested Abraham: \"Take your son, your only son Isaac, whom you love.\"",
    "explanationTelugu": "దేవుడు: \"నీవు ప్రేమించు నీ ఏకైక కుమారుడైన ఇస్సాకును తీసికొని బలిగా అర్పించుము\" అని సెలవిచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "How many sons did Jacob father, who formed the 12 tribes of Israel?",
    "questionTelugu": "ఇశ్రాయేలు పన్నెండు గోత్రములుగా మారిన యాకోబు కుమారుల సంఖ్య ఎంత?",
    "options": [
      "12 sons",
      "10 sons",
      "7 sons",
      "14 sons"
    ],
    "optionsTelugu": [
      "12 మంది కుమారులు",
      "10 మంది",
      "7 మంది",
      "14 మంది"
    ],
    "correctAnswer": "12 sons",
    "bibleReference": "Genesis 35:22",
    "explanation": "Jacob had twelve sons through Leah, Rachel, Bilhah, and Zilpah.",
    "explanationTelugu": "యాకోబుకు లేయా, రాహేలు, బిల్హా, మరియు జిల్పాలు ద్వారా 12 మంది కుమారులు పుట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "What did Hannah promise to do with her child if God gave her a son?",
    "questionTelugu": "దేవుడు తనకు కుమారుని ఇస్తే ఏమి చేస్తానని హన్నా మ్రొక్కుకొనెను?",
    "options": [
      "Dedicate him to the Lord for all his life",
      "Make him a wealthy merchant",
      "Keep him at home always",
      "Build a memorial palace"
    ],
    "optionsTelugu": [
      "అతని ఆయుష్కాలమంతయు యెహోవాకు సమర్పింతును",
      "ధనవంతుడైన వ్యాపారిగా చేయుదును",
      "ఎల్లప్పుడూ ఇంట్లోనే ఉంచుకొందును",
      "ఒక భవనము కట్టింతును"
    ],
    "correctAnswer": "Dedicate him to the Lord for all his life",
    "bibleReference": "1 Samuel 1:11",
    "explanation": "Hannah vowed: \"I will give him to the Lord all the days of his life.\"",
    "explanationTelugu": "హన్నా: \"అతని ఆయుష్కాలమంతయు యెహోవాకు సమర్పింతును\" అని మ్రొక్కుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which courageous mother coated a papyrus basket with pitch to save her son?",
    "questionTelugu": "తన కుమారుని రక్షించుటకు జమ్ముపెట్టెకు కీలు పూసి నైలునదిలో దాచిన ధైర్యవంతురాలైన తల్లి ఎవరు?",
    "options": [
      "Jochebed",
      "Rebekah",
      "Zipporah",
      "Abigail"
    ],
    "optionsTelugu": [
      "యోకెబెదు",
      "రిబ్కా",
      "సిప్పోరా",
      "అబీగయీలు"
    ],
    "correctAnswer": "Jochebed",
    "bibleReference": "Exodus 2:3",
    "explanation": "Jochebed hid baby Moses for three months and then placed him in the ark of bulrushes.",
    "explanationTelugu": "యోకెబెదు మూడు నెలలు దాచి, తరువాత జమ్ముపెట్టెలో పెట్టి నైలునదిలో ఉంచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Proverbs 1:8, what are young people advised regarding their mother?",
    "questionTelugu": "సామెతలు 1:8 ప్రకారం, యౌవనులు తమ తల్లి విషయములో ఏమి చేయకూడదు?",
    "options": [
      "Do not forsake your mother’s teaching",
      "Ignore her counsel",
      "Rely on outside friends instead",
      "Hide your heart from her"
    ],
    "optionsTelugu": [
      "నీ తల్లి ఉపదేశమును త్రోసివేయవద్దు",
      "ఆమె సలహాను నిర్లక్ష్యము చేయుము",
      "స్నేహితులనే నమ్ముకొనుము",
      "ఆమె నుండి దాచుము"
    ],
    "correctAnswer": "Do not forsake your mother’s teaching",
    "bibleReference": "Proverbs 1:8",
    "explanation": "\"Hear, my son, your father’s instruction, and do not forsake your mother’s teaching.\"",
    "explanationTelugu": "\"నా కుమారుడా, నీ తండ్రి ఉపదేశము నంగీకరింపుము, నీ తల్లి చెప్పు బోధను త్రోసివేయవద్దు.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which righteous patriarch prepared an ark for the saving of his household?",
    "questionTelugu": "తన ఇంటివారి రక్షణ కొరకు నమ్మకముతో ఓడను సిద్ధపరచిన నీతిమంతుడైన తండ్రి ఎవరు?",
    "options": [
      "Noah",
      "Lot",
      "Terah",
      "Enoch"
    ],
    "optionsTelugu": [
      "నోవహు",
      "లోతు",
      "తేరహు",
      "హనోకు"
    ],
    "correctAnswer": "Noah",
    "bibleReference": "Hebrews 11:7",
    "explanation": "By faith Noah prepared an ark to save his family when warned by God.",
    "explanationTelugu": "విశ్వాసమునుబట్టి నోవహు తన యింటివారి రక్షణ కొరకు ఓడను నిర్మించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Jesus’ parable, what did the prodigal son ask from his father before leaving?",
    "questionTelugu": "ఉపమానములో తప్పిపోయిన కుమారుడు ఇల్లు విడిచి వెళ్ళేముందు తండ్రిని ఏమి అడిగెను?",
    "options": [
      "His share of the estate / inheritance",
      "A royal chariot",
      "A pack of servants",
      "A wedding ring"
    ],
    "optionsTelugu": [
      "ఆస్తిలో తనకు రావలసిన భాగము",
      "రాజ రథము",
      "సేవకుల సమూహము",
      "వివాహపు ఉంగరము"
    ],
    "correctAnswer": "His share of the estate / inheritance",
    "bibleReference": "Luke 15:12",
    "explanation": "The younger son said: \"Father, give me the share of property that falls to me.\"",
    "explanationTelugu": "చిన్న కుమారుడు: \"తండ్రీ, ఆస్తిలో నాకు వచ్చు భాగమిమ్మని\" అడిగెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who took Ruth to be his wife in Bethlehem and redeemed the family line?",
    "questionTelugu": "బేత్లెహేములో రూతును వివాహమాడి కుటుంబ వంశమును పునరుద్ధరించిన బంధువు ఎవరు?",
    "options": [
      "Boaz",
      "Elimelech",
      "Mahlon",
      "Kilion"
    ],
    "optionsTelugu": [
      "బోయజు",
      "ఎలీమెలెకు",
      "మహ్లోను",
      "కిల్యోను"
    ],
    "correctAnswer": "Boaz",
    "bibleReference": "Ruth 4:13",
    "explanation": "Boaz married Ruth, and she gave birth to Obed, grandfather of King David.",
    "explanationTelugu": "బోయజు రూతును పెండ్లి చేసుకొనెను; ఆమె దావీదు తాతయైన ఓబేదును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Colossians 3:21, what are fathers commanded not to do to their children?",
    "questionTelugu": "కొలొస్సయులకు 3:21 లో తండ్రులు తమ పిల్లలకు ఏమి చేయకూడదని ఆజ్ఞాపించబడెను?",
    "options": [
      "Do not provoke or embitter them",
      "Do not teach them scriptures",
      "Do not feed them bread",
      "Do not let them work"
    ],
    "optionsTelugu": [
      "వారికి కోపము పుట్టింపకుడి / నిరుత్సాహపరచకుడి",
      "లేఖనములు నేర్పవద్దు",
      "ఆహారము పెట్టవద్దు",
      "పని చేయనివ్వవద్దు"
    ],
    "correctAnswer": "Do not provoke or embitter them",
    "bibleReference": "Colossians 3:21",
    "explanation": "\"Fathers, do not provoke your children, lest they become discouraged.\"",
    "explanationTelugu": "\"తండ్రులారా, మీ పిల్లలకు కోపము పుట్టింపకుడి; పుట్టించినయెడల వారు నిరుత్సాహపడుదురు.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "Who was the grandmother of young Timothy who had sincere faith?",
    "questionTelugu": "నిష్కపటమైన విశ్వాసము కలిగిన యువ తిమోతి యొక్క అవ్వ ఎవరు?",
    "options": [
      "Lois",
      "Eunice",
      "Rhoda",
      "Tabitha"
    ],
    "optionsTelugu": [
      "లోయిసు",
      "యునీకే",
      "రోదా",
      "తబితా"
    ],
    "correctAnswer": "Lois",
    "bibleReference": "2 Timothy 1:5",
    "explanation": "Paul remembered the sincere faith that dwelt first in grandmother Lois.",
    "explanationTelugu": "మొదట అవ్వయైన లోయిసులో నివసించిన నిష్కపటమైన విశ్వాసమును పౌలు గుర్తుచేసుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who was the faithful mother of Timothy praised alongside grandmother Lois?",
    "questionTelugu": "అవ్వయైన లోయిసుతో పాటు ప్రశంసించబడిన తిమోతి యొక్క విశ్వాసముగల తల్లి ఎవరు?",
    "options": [
      "Eunice",
      "Lydia",
      "Prisca",
      "Chloe"
    ],
    "optionsTelugu": [
      "యునీకే",
      "లూదియ",
      "ప్రిస్క",
      "క్లోయే"
    ],
    "correctAnswer": "Eunice",
    "bibleReference": "2 Timothy 1:5",
    "explanation": "Timothy was blessed with godly heritage through both Lois and his mother Eunice.",
    "explanationTelugu": "తిమోతి తన అవ్వ లోయిసు మరియు తల్లి యునీకేల ద్వారా దైవిక విశ్వాసమును పొందెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "What did the father do when he saw the returning prodigal son still far off?",
    "questionTelugu": "దూరముగా వచ్చుచున్న తప్పిపోయిన కుమారుని చూచినప్పుడు తండ్రి ఏమి చేసెను?",
    "options": [
      "Ran, embraced him, and kissed him",
      "Shut the gates and walked away",
      "Demanded repayment first",
      "Made him sleep in the field"
    ],
    "optionsTelugu": [
      "పరుగెత్తి కౌగిలించుకొని ముద్దుపెట్టుకొనెను",
      "తలుపులు మూసి వెళ్ళిపోయెను",
      "మొదట డబ్బంతా తిరిగి కట్టమనెను",
      "పొలములో పడుకోమనెను"
    ],
    "correctAnswer": "Ran, embraced him, and kissed him",
    "bibleReference": "Luke 15:20",
    "explanation": "While he was still a long way off, his father was filled with compassion and ran to him.",
    "explanationTelugu": "కుమారుడు ఇంక దూరముగా ఉన్నప్పుడే తండ్రి కనికరపడి పరుగెత్తి ముద్దుపెట్టుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who were the first two brothers born to Adam and Eve?",
    "questionTelugu": "ఆదాము హవ్వలకు జన్మించిన మొదటి ఇద్దరు సోదరులు ఎవరు?",
    "options": [
      "Cain and Abel",
      "Jacob and Esau",
      "Moses and Aaron",
      "Shem and Ham"
    ],
    "optionsTelugu": [
      "కయీను మరియు హేబెలు",
      "యాకోబు మరియు ఏశావు",
      "మోషే మరియు అహరోను",
      "షేము మరియు హాము"
    ],
    "correctAnswer": "Cain and Abel",
    "bibleReference": "Genesis 4:1-2",
    "explanation": "Eve gave birth to Cain first and next to Abel.",
    "explanationTelugu": "హవ్వ మొదట కయీనును, తరువాత హేబెలును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which woman became the beloved wife of Isaac after meeting at the well?",
    "questionTelugu": "బావి వద్ద కలుసుకున్న తరువాత ఇస్సాకుకు ప్రియమైన భార్యగా మారిన స్త్రీ ఎవరు?",
    "options": [
      "Rebekah",
      "Rachel",
      "Leah",
      "Keturah"
    ],
    "optionsTelugu": [
      "రిబ్కా",
      "రాహేలు",
      "లేయా",
      "కెతూరా"
    ],
    "correctAnswer": "Rebekah",
    "bibleReference": "Genesis 24:67",
    "explanation": "Isaac brought Rebekah into Sarah’s tent and she became his wife, and he loved her.",
    "explanationTelugu": "ఇస్సాకు రిబ్కాను తన తల్లి గుడారములోనికి తీసికొనివచ్చి వివాహము చేసుకొని ప్రేమించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "According to Ephesians 5:25, how should a husband love his wife?",
    "questionTelugu": "ఎఫెసీయులకు 5:25 ప్రకారం, భర్త తన భార్యను ఎలా ప్రేమించాలి?",
    "options": [
      "Just as Christ loved the church and gave Himself for her",
      "Only when she does everything right",
      "As a master rules a servant",
      "Only for his own convenience"
    ],
    "optionsTelugu": [
      "క్రీస్తు సంఘమును ప్రేమించి తననుతాను అప్పగించుకున్నట్లుగా",
      "ఆమె అన్ని పనులూ సరిగ్గా చేసినప్పుడు మాత్రమే",
      "యజమాని సేవకుని ఏలినట్లు",
      "తన స్వార్థము కొరకు మాత్రమే"
    ],
    "correctAnswer": "Just as Christ loved the church and gave Himself for her",
    "bibleReference": "Ephesians 5:25",
    "explanation": "Husbands are called to sacrificial, Christ-like love for their wives.",
    "explanationTelugu": "క్రీస్తు సంఘము కొరకు ప్రాణమిచ్చినట్లుగా భర్తలు భార్యలను త్యాగపూరితముగా ప్రేమించాలి.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "Why was priest Zechariah unable to speak until after his son John was born?",
    "questionTelugu": "కుమారుడైన యోహాను పుట్టేవరకు యాజకుడైన జెకర్యా మూగవాడై ఎందుకు ఉండెను?",
    "options": [
      "Because he doubted the angel Gabriel’s words",
      "Because of a throat sickness",
      "Because he made a silent vow",
      "Because the temple was quiet"
    ],
    "optionsTelugu": [
      "గబ్రియేలు దూత మాటలను నమ్మనందున",
      "గొంతు జబ్బు వలన",
      "మౌన వ్రతము చేసినందున",
      "మందిరము నిశ్శబ్దముగా ఉన్నందున"
    ],
    "correctAnswer": "Because he doubted the angel Gabriel’s words",
    "bibleReference": "Luke 1:20",
    "explanation": "Gabriel said: \"You will be silent and unable to speak until the day these things happen, because you did not believe my words.\"",
    "explanationTelugu": "దూత: \"తగిన కాలమందు నెరవేరబోవు నా మాటలు నీవు నమ్మలేదు గనుక మూగవాడవై యుందువు\" అని పలికెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "Who consoled Hannah when she wept bitterly over not having children?",
    "questionTelugu": "పిల్లలు లేక కన్నీరు కార్చిన హన్నాను ఓదార్చిన ఆమె భర్త ఎవరు?",
    "options": [
      "Elkanah",
      "Eli",
      "Peninnah",
      "Jesse"
    ],
    "optionsTelugu": [
      "ఎల్కానా",
      "ఏలీ",
      "పెనిన్నా",
      "యెష్షయి"
    ],
    "correctAnswer": "Elkanah",
    "bibleReference": "1 Samuel 1:8",
    "explanation": "Elkanah said: \"Hannah, why are you weeping? Am I not better to you than ten sons?\"",
    "explanationTelugu": "ఎల్కానా: \"హన్నా, ఎందుకు ఏడ్చెదవు? పదిమంది కుమారులకంటె నేను నీకు శ్రేష్ఠుడను కానా?\" అని ఓదార్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which Roman officer invited his relatives and close friends to hear Peter preach?",
    "questionTelugu": "పేతురు ప్రసంగము వినుటకు తన బంధువులను మరియు స్నేహితులను పిలిపించిన రోమా శతాధిపతి ఎవరు?",
    "options": [
      "Cornelius",
      "Julius",
      "Felix",
      "Festus"
    ],
    "optionsTelugu": [
      "కొర్నేలియు",
      "యూలియు",
      "ఫేలిక్సు",
      "ఫేస్తు"
    ],
    "correctAnswer": "Cornelius",
    "bibleReference": "Acts 10:24",
    "explanation": "Cornelius had called together his relatives and close friends in Caesarea.",
    "explanationTelugu": "కొర్నేలియు తన బంధువులను ప్రాణస్నేహితులను పిలిపించి కనిపెట్టుకొని యుండెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "What took place in the home of the Philippian jailer at midnight?",
    "questionTelugu": "అర్ధరాత్రి వేళ ఫిలిప్పీ చెరసాల నాయకుని గృహములో ఏమి జరిగెను?",
    "options": [
      "He and all his household were baptized in faith",
      "He fled the country with his family",
      "He sent Paul away in secret",
      "He locked his family in cells"
    ],
    "optionsTelugu": [
      "అతడును అతని యింటివారందరును విశ్వసించి బాప్తిస్మము పొందిరి",
      "దేశము విడిచి పారిపోయెను",
      "పౌలును రహస్యముగా పంపివేసెను",
      "కుటుంబాన్ని గదులలో బంధించెను"
    ],
    "correctAnswer": "He and all his household were baptized in faith",
    "bibleReference": "Acts 16:33-34",
    "explanation": "The jailer and all his family were baptized without delay and rejoiced.",
    "explanationTelugu": "చెరసాల నాయకుడును అతని ఇంటివారందరును వెంటనే బాప్తిస్మము పొంది సంతోషించిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Psalm 128:3, what is a godly wife compared to in her home?",
    "questionTelugu": "కీర్తనలు 128:3 లో భక్తిగల భార్య దేనితో పోల్చబడెను?",
    "options": [
      "A fruitful vine",
      "A cedar tree",
      "A roaring lion",
      "A hidden pearl"
    ],
    "optionsTelugu": [
      "ఫలించు ద్రాక్షావల్లి",
      "దేవదారు వృక్షము",
      "గర్జించు సింహము",
      "దాచబడిన ముత్యము"
    ],
    "correctAnswer": "A fruitful vine",
    "bibleReference": "Psalm 128:3",
    "explanation": "\"Your wife will be like a fruitful vine within your house; your children like olive shoots.\"",
    "explanationTelugu": "\"నీ యింటి లోపల నీ భార్య ఫలించు ద్రాక్షావల్లివలె నుండును; నీ భోజనపు బల్లచుట్టు నీ పిల్లలు ఒలీవ మొక్కలవలె నుందురు.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which Christian couple hosted church meetings in their home and traveled with Paul?",
    "questionTelugu": "తమ గృహములో సంఘ కూడికలను జరిపి పౌలుతో ప్రయాణించిన క్రైస్తవ దంపతులు ఎవరు?",
    "options": [
      "Aquila and Priscilla",
      "Ananias and Sapphira",
      "Felix and Drusilla",
      "Ahab and Jezebel"
    ],
    "optionsTelugu": [
      "అకుల మరియు ప్రిస్కిల్లా",
      "అననీయ మరియు సప్పీరా",
      "ఫేలిక్సు మరియు దృసిల్ల",
      "ఆహాబు మరియు యెజెబెలు"
    ],
    "correctAnswer": "Aquila and Priscilla",
    "bibleReference": "Acts 18:2-3, Romans 16:3-5",
    "explanation": "Aquila and Priscilla risked their lives for Paul and hosted the church.",
    "explanationTelugu": "అకుల మరియు ప్రిస్కిల్లా పౌలు కొరకు ప్రాణములను సైతము తెగించి సంఘమును పోషించిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "What parting advice did aging father King David give to his son Solomon?",
    "questionTelugu": "వృద్ధుడైన దావీదు రాజు తన కుమారుడైన సొలొమోనుకు ఇచ్చిన కడవరి ఉపదేశము ఏమిటి?",
    "options": [
      "Be strong and walk in the ways of God",
      "Conquer all foreign nations by war",
      "Accumulate silver and gold",
      "Build yourself grand palaces"
    ],
    "optionsTelugu": [
      "ధైర్యము వహించి దేవుని మార్గములలో నడువుము",
      "యుద్ధముతో రాజ్యములను జయించుము",
      "వెండిబంగారములను కూడబెట్టుము",
      "భవనములను నిర్మించుకొనుము"
    ],
    "correctAnswer": "Be strong and walk in the ways of God",
    "bibleReference": "1 Kings 2:2-3",
    "explanation": "David said: \"Be strong, act like a man, and observe what the Lord your God requires.\"",
    "explanationTelugu": "దావీదు: \"నీవు ధైర్యము తెచ్చుకొని పురుషుడవై యుండి నీ దేవుడైన యెహోవా మార్గములలో నడువుము\" అని చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who stood before King David to ensure her son Solomon became king as promised?",
    "questionTelugu": "వాగ్దానము ప్రకారం తన కుమారుడు సొలొమోను రాజగుటకు దావీదు యెదుట నిలిచిన తల్లి ఎవరు?",
    "options": [
      "Bathsheba",
      "Abigail",
      "Maakah",
      "Haggith"
    ],
    "optionsTelugu": [
      "బత్షెబ",
      "అబీగయీలు",
      "మయకా",
      "హగ్గీతు"
    ],
    "correctAnswer": "Bathsheba",
    "bibleReference": "1 Kings 1:15-30",
    "explanation": "Bathsheba reminded David of his oath before God that Solomon would reign.",
    "explanationTelugu": "బత్షెబ సొలొమోను సింహాసనము ఎక్కునని దావీదు ప్రమాణము చేసిన మాటను గుర్తుచేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which of Jacob’s wives gave birth to both Joseph and Benjamin?",
    "questionTelugu": "యోసేపు మరియు బెన్యామీను ఇద్దరికీ జన్మనిచ్చిన యాకోబు భార్య ఎవరు?",
    "options": [
      "Rachel",
      "Leah",
      "Bilhah",
      "Zilpah"
    ],
    "optionsTelugu": [
      "రాహేలు",
      "లేయా",
      "బిల్హా",
      "జిల్పా"
    ],
    "correctAnswer": "Rachel",
    "bibleReference": "Genesis 35:24",
    "explanation": "Rachel died giving birth to her second son Benjamin near Bethlehem.",
    "explanationTelugu": "రాహేలు బెత్లెహేము మార్గములో బెన్యామీనును కని మరణించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "In 1 Timothy 5:8, what is said about a believer who refuses to care for relatives?",
    "questionTelugu": "1 తిమోతి 5:8 లో స్వకీయులను పోషించని విశ్వాసిని గూర్చి ఏమి చెప్పబడెను?",
    "options": [
      "He has denied the faith and is worse than an unbeliever",
      "He is merely busy",
      "He is forgiven automatically",
      "He should receive an award"
    ],
    "optionsTelugu": [
      "అతడు విశ్వాసత్యాగము చేసి అవిశ్వాసికంటె చెడ్డవాడై యున్నాడు",
      "అతనికి తీరిక లేదనుకోవాలి",
      "ఆటోమేటిగ్గా క్షమించబడును",
      "అతనికి బహుమతి ఇవ్వాలి"
    ],
    "correctAnswer": "He has denied the faith and is worse than an unbeliever",
    "bibleReference": "1 Timothy 5:8",
    "explanation": "\"Anyone who does not provide for their relatives, especially their own household, has denied the faith.\"",
    "explanationTelugu": "\"ఎవడైనను స్వకీయులను, విశేషముగా తన యింటివారిని సంరక్షింపక పోయినయెడల అతడు విశ్వాసత్యాగము చేసినవాడై అవిశ్వాసికంటె చెడ్డవాడై యుండును.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who lovingly adopted and raised his orphaned cousin Esther in Susa?",
    "questionTelugu": "షూషనులో అనాథయైన తన పినతండ్రి కుమార్తె ఎస్తేరును తన సొంత కుమార్తెగా పెంచినది ఎవరు?",
    "options": [
      "Mordecai",
      "Haman",
      "Hegai",
      "Nehemiah"
    ],
    "optionsTelugu": [
      "మొర్దెకై",
      "హామాను",
      "హేగై",
      "నెహెమ్యా"
    ],
    "correctAnswer": "Mordecai",
    "bibleReference": "Esther 2:7",
    "explanation": "Mordecai took Esther as his own daughter when her parents died.",
    "explanationTelugu": "ఎస్తేరు తల్లిదండ్రులు చనిపోయినప్పుడు మొర్దెకై ఆమెను తన కుమార్తెగా స్వీకరించి పెంచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "How did Joseph react when his brothers came to Egypt during the famine?",
    "questionTelugu": "కరువు కాలములో అన్నదమ్ములు ఈజిప్టుకు వచ్చినప్పుడు యోసేపు ఎలా స్పందించెను?",
    "options": [
      "Wept, forgave them, and provided for their families",
      "Put them all to death",
      "Banished them to the desert",
      "Took their land away"
    ],
    "optionsTelugu": [
      "కన్నీరు కార్చి, క్షమించి, వారి కుటుంబాలను పోషించెను",
      "అందరినీ చంపించెను",
      "ఎడారిలోనికి వెళ్లగొట్టెను",
      "వారి భూమిని లాక్కునెను"
    ],
    "correctAnswer": "Wept, forgave them, and provided for their families",
    "bibleReference": "Genesis 45:1-11",
    "explanation": "Joseph said: \"Do not be distressed; God sent me ahead of you to preserve life.\"",
    "explanationTelugu": "యోసేపు: \"నన్ను ఇక్కడికి పంపినందుకు చింతింపకుడి; ప్రాణరక్షణ కొరకు దేవుడే నన్ను ముందే పంపెను\" అని క్షమించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "When should parents speak of God’s words to their children according to Deuteronomy 6:7?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 6:7 ప్రకారం, తల్లిదండ్రులు దేవుని వాక్యములను పిల్లలకు ఎప్పుడు బోధించాలి?",
    "options": [
      "When sitting at home, walking on the way, lying down and rising up",
      "Only on major festivals",
      "Only in the temple courts",
      "Once a year"
    ],
    "optionsTelugu": [
      "ఇంట కూర్చున్నప్పుడు, దారిని నడుచునప్పుడు, పండుకొనునప్పుడు, లేచునప్పుడు",
      "పండుగ దినములలో మాత్రమే",
      "మందిరములో మాత్రమే",
      "సంవత్సరానికి ఒక్కసారి"
    ],
    "correctAnswer": "When sitting at home, walking on the way, lying down and rising up",
    "bibleReference": "Deuteronomy 6:7",
    "explanation": "God’s commands should be woven into every daily family activity.",
    "explanationTelugu": "దేవుని వాక్యములను దినచర్యలన్నిటిలో శ్రద్ధగా పిల్లలకు నేర్పించాలని ఆజ్ఞాపించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "What tender family provision did Jesus make from the cross for His mother Mary?",
    "questionTelugu": "సిలువపై నుండి యేసు తన తల్లి మరియను ఏ శిష్యుని సంరక్షణకు అప్పగించెను?",
    "options": [
      "Entrusted her to the beloved disciple John",
      "Gave her temple treasury money",
      "Asked the Roman soldiers to guard her",
      "Sent her away to Rome"
    ],
    "optionsTelugu": [
      "తాను ప్రేమించిన శిష్యుడైన యోహాను సంరక్షణకు అప్పగించెను",
      "మందిరపు ధనమును ఇచ్చెను",
      "రోమా సైనికులను కాపలా ఉంచెను",
      "రోమాకు పంపించెను"
    ],
    "correctAnswer": "Entrusted her to the beloved disciple John",
    "bibleReference": "John 19:26-27",
    "explanation": "Jesus said to His mother: \"Woman, behold your son!\" and to John: \"Behold, your mother!\"",
    "explanationTelugu": "యేసు మరియతో: \"అమ్మా, యిదిగో నీ కుమారుడు!\" అనియు, యోహానుతో: \"యిదిగో నీ తల్లి!\" అనియు పలికెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s1_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "What do the children of the virtuous woman in Proverbs 31 do?",
    "questionTelugu": "సామెతలు 31 లోని గుణవతియైన స్త్రీ యొక్క పిల్లలు ఏమి చేయుదురు?",
    "options": [
      "Arise and call her blessed",
      "Complain about her food",
      "Ignore her hard work",
      "Leave without speaking"
    ],
    "optionsTelugu": [
      "లేచి ఆమెను ధన్యురాలు అని పిలుతురు",
      "ఆహారమును గూర్చి సణుగుదురు",
      "ఆమె కష్టాన్ని పట్టించుకోరు",
      "మాట్లాడకుండా వెళ్ళిపోవుదురు"
    ],
    "correctAnswer": "Arise and call her blessed",
    "bibleReference": "Proverbs 31:28",
    "explanation": "\"Her children arise and call her blessed; her husband also, and he praises her.\"",
    "explanationTelugu": "\"ఆమె పిల్లలు లేచి ఆమెను ధన్యురాలు అందురు; ఆమె పెనిమిటియు లేచి ఆమెను పొగడును.\"",
    "marks": 1
  }
];

export const FAMILY_EASY_GROWTH: QuizQuestion[] = [
  {
    "id": "fam_e_s2_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who was the third son born to Eve after the murder of Abel?",
    "questionTelugu": "హేబెలు చంపబడిన తరువాత హవ్వకు పుట్టిన మూడవ కుమారుడు ఎవరు?",
    "options": [
      "Seth",
      "Enoch",
      "Methuselah",
      "Lamech"
    ],
    "optionsTelugu": [
      "షేతు",
      "హనోకు",
      "మెతూషెల",
      "లామెకు"
    ],
    "correctAnswer": "Seth",
    "bibleReference": "Genesis 4:25",
    "explanation": "Eve said: \"God has granted me another child in place of Abel.\"",
    "explanationTelugu": "హవ్వ: \"కయీను చంపిన హేబెలునకు ప్రతిగా దేవుడు నాకు మరియొక సంతానమును నియమించెను\" అని చెప్పి అతనికి షేతు అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which brother secretly intended to rescue Joseph from the pit and bring him home?",
    "questionTelugu": "యోసేపును గోతిలో నుండి రక్షించి తండ్రి వద్దకు చేర్చాలని రహస్యముగా అనుకున్న అన్న ఎవరు?",
    "options": [
      "Reuben",
      "Simeon",
      "Levi",
      "Dan"
    ],
    "optionsTelugu": [
      "రూబేను",
      "షిమ్యోను",
      "లేవి",
      "దాను"
    ],
    "correctAnswer": "Reuben",
    "bibleReference": "Genesis 37:21-22",
    "explanation": "Reuben tried to deliver Joseph out of their hands to return him to his father.",
    "explanationTelugu": "రూబేను అతనిని వారి చేతుల్లో నుండి తప్పించి తండ్రి యొద్దకు చేర్చాలని ప్రయత్నించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "What was the relationship between Abraham and Lot?",
    "questionTelugu": "అబ్రాహాము మరియు లోతులకు మధ్య గల బంధుత్వమేమిటి?",
    "options": [
      "Uncle and nephew",
      "Father and son",
      "Cousins",
      "Brothers"
    ],
    "optionsTelugu": [
      "మేనమామ / పెదనాన్న మరియు మేనల్లుడు",
      "తండ్రి మరియు కుమారుడు",
      "బావబావమరుదులు",
      "సొంత అన్నదమ్ములు"
    ],
    "correctAnswer": "Uncle and nephew",
    "bibleReference": "Genesis 12:5",
    "explanation": "Lot was the son of Haran, who was Abraham’s brother.",
    "explanationTelugu": "లోతు అబ్రాహాము సహోదరుడైన హారాను కుమారుడు (మేనల్లుడు).",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "Who was the Egyptian maidservant who bore Ishmael to Abraham?",
    "questionTelugu": "అబ్రాహామునకు ఇష్మాయేలును కనిన ఐగుప్తీయురాలైన దాసి ఎవరు?",
    "options": [
      "Hagar",
      "Keturah",
      "Bilhah",
      "Zilpah"
    ],
    "optionsTelugu": [
      "హాగరు",
      "కెతూరా",
      "బిల్హా",
      "జిల్పా"
    ],
    "correctAnswer": "Hagar",
    "bibleReference": "Genesis 16:1-3",
    "explanation": "Sarah gave her Egyptian servant Hagar to Abraham as a wife.",
    "explanationTelugu": "శారా తన దాసియైన హాగరును అబ్రాహామునకు భార్యగా ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which older brother served as Moses’ prophetic spokesman before Pharaoh?",
    "questionTelugu": "ఫరో యెదుట మోషేకు ప్రవక్తగా మరియు నోరుగా ఉండిన అన్న ఎవరు?",
    "options": [
      "Aaron",
      "Hur",
      "Joshua",
      "Eleazar"
    ],
    "optionsTelugu": [
      "అహరోను",
      "హూరు",
      "యెహోషువ",
      "ఎలియాజరు"
    ],
    "correctAnswer": "Aaron",
    "bibleReference": "Exodus 4:14-16",
    "explanation": "God appointed Aaron the Levite to speak for his brother Moses.",
    "explanationTelugu": "దేవుడు అహరోనును మోషేకు నోరుగా మరియు ప్రతినిధిగా నియమించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "For what dish did hungry Esau surrender his precious family birthright?",
    "questionTelugu": "ఆకలితో ఉన్న ఏశావు తన శ్రేష్ఠమైన జ్యేష్ఠత్వపు హక్కును దేనికొరకు అమ్మివేసెను?",
    "options": [
      "A bowl of red lentil stew",
      "A roasted lamb",
      "A cup of sweet wine",
      "A loaf of barley bread"
    ],
    "optionsTelugu": [
      "ఎర్రని ఎర్ర కందిపప్పు చిక్కని కూర",
      "కాల్చిన గొర్రెపిల్ల",
      "ద్రాక్షారసపు గిన్నె",
      "యవల రొట్టె"
    ],
    "correctAnswer": "A bowl of red lentil stew",
    "bibleReference": "Genesis 25:29-34",
    "explanation": "Esau despised his birthright for a single bowl of stew.",
    "explanationTelugu": "ఏశావు ఒక్క పూట కూటి కొరకు తన జ్యేష్ఠత్వమును తృణీకరించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which two sons were born to Joseph and Asenath in Egypt?",
    "questionTelugu": "ఈజిప్టులో యోసేపు మరియు ఆస్నతులకు జన్మించిన ఇద్దరు కుమారులు ఎవరు?",
    "options": [
      "Manasseh and Ephraim",
      "Gershom and Eliezer",
      "Phinehas and Hophni",
      "Nadab and Abihu"
    ],
    "optionsTelugu": [
      "మనష్షే మరియు ఎఫ్రాయిము",
      "గేర్షోము మరియు ఎలీయెజెరు",
      "ఫీనెహాసు మరియు హొఫ్నీ",
      "నాదాబు మరియు అబీహు"
    ],
    "correctAnswer": "Manasseh and Ephraim",
    "bibleReference": "Genesis 41:50-52",
    "explanation": "Before the famine, two sons were born to Joseph: Manasseh and Ephraim.",
    "explanationTelugu": "కరువు రాకమునుపే యోసేపునకు మనష్షే, ఎఫ్రాయిము జన్మించిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who was the deceptive uncle and father-in-law of Jacob in Haran?",
    "questionTelugu": "హారానులో యాకోబు యొక్క మేనమామ మరియు మామగారు ఎవరు?",
    "options": [
      "Laban",
      "Bethuel",
      "Nahor",
      "Lot"
    ],
    "optionsTelugu": [
      "లాబాను",
      "బెతూయేలు",
      "నాహోరు",
      "లోతు"
    ],
    "correctAnswer": "Laban",
    "bibleReference": "Genesis 29:13-26",
    "explanation": "Laban was Rebekah’s brother and father to Leah and Rachel.",
    "explanationTelugu": "లాబాను రిబ్కా సహోదరుడు మరియు లేయా, రాహేలుల తండ్రి.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which older daughter was given to Jacob first instead of Rachel?",
    "questionTelugu": "రాహేలుకు బదులుగా మోసముతో యాకోబుకు మొదట ఇవ్వబడిన పెద్ద కుమార్తె ఎవరు?",
    "options": [
      "Leah",
      "Dinah",
      "Tamar",
      "Keziah"
    ],
    "optionsTelugu": [
      "లేయా",
      "దీనా",
      "తామారు",
      "కెజీయా"
    ],
    "correctAnswer": "Leah",
    "bibleReference": "Genesis 29:23-25",
    "explanation": "Laban substituted Leah on the wedding night, saying the older must wed first.",
    "explanationTelugu": "పెద్ద కుమార్తె ఉండగా చిన్నదానిని ఇచ్చుట మా దేశాచారము కాదని లాబాను లేయాను ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "How did elderly Jacob position his hands when blessing Ephraim and Manasseh?",
    "questionTelugu": "ఎఫ్రాయిము మనష్షేలను ఆశీర్వదించునప్పుడు వృద్ధుడైన యాకోబు తన చేతులను ఎలా ఉంచెను?",
    "options": [
      "Crossed his hands intentionally",
      "Lifted only his left hand",
      "Laid both hands on the older only",
      "Refused to touch them"
    ],
    "optionsTelugu": [
      "చేతులను కావాలని మార్చి (క్రాస్ చేసి) ఉంచెను",
      "ఎడమ చేతిని మాత్రమే ఎత్తెను",
      "పెద్దవానిపై మాత్రమే రెండు చేతులూ ఉంచెను",
      "తాకడానికి నిరాకరించెను"
    ],
    "correctAnswer": "Crossed his hands intentionally",
    "bibleReference": "Genesis 48:14",
    "explanation": "Jacob crossed his hands guiding them knowingly, putting the right hand on younger Ephraim.",
    "explanationTelugu": "యాకోబు కావాలని చేతులు మార్చి, చిన్నవాడైన ఎఫ్రాయిము తలపై తన కుడిచేతిని ఉంచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who was the Hittite soldier whose family was shattered by King David’s sin?",
    "questionTelugu": "దావీదు రాజు పాపము వలన కుటుంబము నాశనమైన హిత్తీయుడైన సైనికుడు ఎవరు?",
    "options": [
      "Uriah",
      "Joab",
      "Abner",
      "Benaiah"
    ],
    "optionsTelugu": [
      "ఊరియా",
      "యోవాబు",
      "అబ్నేరు",
      "బెనాయా"
    ],
    "correctAnswer": "Uriah",
    "bibleReference": "2 Samuel 11:3-17",
    "explanation": "Uriah the Hittite was the faithful husband of Bathsheba.",
    "explanationTelugu": "ఊరియా బత్షెబ యొక్క నమ్మకమైన భర్త.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "What wise counsel did father-in-law Jethro give to Moses in the wilderness?",
    "questionTelugu": "అరణ్యములో మోషే మామగారైన యిత్రో అతనికి ఇచ్చిన జ్ఞానయుక్తమైన సలహా ఏమిటి?",
    "options": [
      "Delegate judicial disputes to God-fearing leaders",
      "Dismiss the people back to Egypt",
      "Build stone walls around the camp",
      "Demand taxes from the tribes"
    ],
    "optionsTelugu": [
      "దేవునికి భయపడు సమర్థులైన నాయకులను నియమించి భారమును పంచుకొనుము",
      "ప్రజలను తిరిగి ఐగుప్తుకు పంపుము",
      "శిబిరము చుట్టూ రాతిగోడలు కట్టుము",
      "ప్రజల నుండి పన్నులు వసూలు చేయుము"
    ],
    "correctAnswer": "Delegate judicial disputes to God-fearing leaders",
    "bibleReference": "Exodus 18:17-24",
    "explanation": "Jethro saw Moses exhausting himself and advised appointing leaders of thousands, hundreds, fifties, and tens.",
    "explanationTelugu": "మోషే ఒక్కడే తీర్పు తీర్చుచు అలసిపోవుట చూచి సహచర నాయకులను నియమించమని యిత్రో సలహా ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which royal prince made a brotherly covenant of love with young David?",
    "questionTelugu": "యౌవనుడైన దావీదుతో ప్రాణసమానమైన నిబంధన చేసుకున్న రాజకుమారుడు ఎవరు?",
    "options": [
      "Jonathan",
      "Ish-Bosheth",
      "Adonijah",
      "Rehoboam"
    ],
    "optionsTelugu": [
      "యోనాతాను",
      "ఈష్బోషెతు",
      "అదోనీయా",
      "రెహబాము"
    ],
    "correctAnswer": "Jonathan",
    "bibleReference": "1 Samuel 18:1-3",
    "explanation": "Jonathan stripped off his robe and armor and gave them to David in loyalty.",
    "explanationTelugu": "యోనాతాను తన అంగీని, ఆయుధములను దావీదుకు ఇచ్చి నిబంధన చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which handsome son of David rebelled against his father to steal the throne?",
    "questionTelugu": "సింహాసనమును ఆక్రమించుటకు తండ్రియైన దావీదుపై తిరుగుబాటు చేసిన కుమారుడు ఎవరు?",
    "options": [
      "Absalom",
      "Amnon",
      "Solomon",
      "Chileab"
    ],
    "optionsTelugu": [
      "అబ్షాలోము",
      "అమ్నోను",
      "సొలొమోను",
      "కిల్యాబు"
    ],
    "correctAnswer": "Absalom",
    "bibleReference": "2 Samuel 15:1-12",
    "explanation": "Absalom stole the hearts of the men of Israel and revolted against David.",
    "explanationTelugu": "అబ్షాలోము ఇశ్రాయేలు ప్రజల మనస్సులను దొంగిలించి తండ్రిపై తిరుగుబాటు చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "What heart-wrenching lamentation did King David cry upon hearing of Absalom’s death?",
    "questionTelugu": "అబ్షాలోము మరణవార్త విన్నప్పుడు దావీదు రాజు కన్నీటితో పలికిన రోదన ఏమిటి?",
    "options": [
      "\"O my son Absalom! If only I had died instead of you!\"",
      "\"Justice has finally been served!\"",
      "\"Now my throne is safe!\"",
      "\"Rejoice with singing!\""
    ],
    "optionsTelugu": [
      "\"నా కుమారుడా అబ్షాలోమా, నీకు బదులుగా నేను చనిపోయిన మేలైయుండును!\"",
      "\"ఎట్టకేలకు న్యాయము జరిగినది!\"",
      "\"ఇక నా సింహాసనము భద్రముగా నుండును!\"",
      "\"గానములతో సంతోషించుడి!\""
    ],
    "correctAnswer": "\"O my son Absalom! If only I had died instead of you!\"",
    "bibleReference": "2 Samuel 18:33",
    "explanation": "David wept bitterly: \"O my son Absalom, my son, my son Absalom!\"",
    "explanationTelugu": "దావీదు మిక్కిలి దుఃఖపడి మేడగదికి వెళ్లి రోదించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which fearless prophet confronted David with the story of the rich man’s stolen ewe lamb?",
    "questionTelugu": "ఒక పేదవాని గొర్రెపిల్లను దొంగిలించిన ధనవంతుని కథతో దావీదును గద్దించిన ప్రవక్త ఎవరు?",
    "options": [
      "Nathan",
      "Gad",
      "Samuel",
      "Ahijah"
    ],
    "optionsTelugu": [
      "నాతాను",
      "గాదు",
      "సమూయేలు",
      "అహీయా"
    ],
    "correctAnswer": "Nathan",
    "bibleReference": "2 Samuel 12:1-7",
    "explanation": "Nathan pointed his finger and proclaimed: \"You are the man!\"",
    "explanationTelugu": "నాతాను దావీదుతో: \"ఆ మనుష్యుడవు నీవే!\" అని దేవుని తీర్పును ప్రకటించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "Why did God bring judgment upon the priestly house of Eli?",
    "questionTelugu": "యాజకుడైన ఏలీ కుటుంబముపైకి దేవుని తీర్పు రావడానికి కారణమేమిటి?",
    "options": [
      "Because his sons were corrupt and he failed to restrain them",
      "Because they did not burn incense",
      "Because Eli became blind in old age",
      "Because they moved away from Shiloh"
    ],
    "optionsTelugu": [
      "కుమారులు దేవుని దూషించుచుండగా తండ్రి వారిని అడ్డగించనందున",
      "ధూపము వేయనందున",
      "ఏలీ కన్నులు మందగించినందున",
      "షీలోహును విడిచి వెళ్ళినందున"
    ],
    "correctAnswer": "Because his sons were corrupt and he failed to restrain them",
    "bibleReference": "1 Samuel 3:13",
    "explanation": "God judged Eli’s house because his sons blasphemed God and he failed to restrain them.",
    "explanationTelugu": "కుమారులు ఘోర పాపములు చేయుచుండగా వారిని గద్దింపక చూసీచూడనట్లు ఉన్నందున తీర్పు వచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who became Moses’ wife during his forty-year stay in Midian?",
    "questionTelugu": "మిద్యాను దేశములో నలభై ఏళ్ల కాలములో మోషేకు భార్యగా మారిన స్త్రీ ఎవరు?",
    "options": [
      "Zipporah",
      "Asenath",
      "Cozbi",
      "Milcah"
    ],
    "optionsTelugu": [
      "సిప్పోరా",
      "ఆస్నతు",
      "కొజ్బీ",
      "మిల్కా"
    ],
    "correctAnswer": "Zipporah",
    "bibleReference": "Exodus 2:21",
    "explanation": "Reuel (Jethro) gave his daughter Zipporah to Moses in marriage.",
    "explanationTelugu": "రెగూవేలు (యిత్రో) తన కుమార్తెయైన సిప్పోరాను మోషేకు భార్యగా ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "What were the names of Moses and Zipporah’s two sons?",
    "questionTelugu": "మోషే మరియు సిప్పోరాల ఇద్దరు కుమారుల పేర్లు ఏమిటి?",
    "options": [
      "Gershom and Eliezer",
      "Nadab and Abihu",
      "Hophni and Phinehas",
      "Jacob and Esau"
    ],
    "optionsTelugu": [
      "గేర్షోము మరియు ఎలీయెజెరు",
      "నాదాబు మరియు అబీహు",
      "హొఫ్నీ మరియు ఫీనెహాసు",
      "యాకోబు మరియు ఏశావు"
    ],
    "correctAnswer": "Gershom and Eliezer",
    "bibleReference": "Exodus 18:3-4",
    "explanation": "Gershom meant \"alien in a foreign land\" and Eliezer meant \"God is my help.\"",
    "explanationTelugu": "గేర్షోము అనగా పరదేశియనియు, ఎలీయెజెరు అనగా దేవుడు నాకు సహాయకుడనియు అర్థము.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "What promise does Malachi 4:6 make concerning the family?",
    "questionTelugu": "మలాకీ 4:6 లో కుటుంబ పునరుద్ధరణను గూర్చి ఏ వాగ్దానము చేయబడెను?",
    "options": [
      "He will turn the hearts of the fathers to their children and children to fathers",
      "He will give every family bags of gold",
      "Families will never move to another city",
      "Earthly families will dissolve"
    ],
    "optionsTelugu": [
      "తండ్రుల హృదయములను పిల్లలతట్టును, పిల్లల హృదయములను తండ్రులతట్టును త్రిప్పును",
      "ప్రతి కుటుంబానికి బంగారు సంచులు ఇచ్చును",
      "కుటుంబాలు వేరే ఊరికి వెళ్లవు",
      "భూసంబంధ కుటుంబాలు రద్దగును"
    ],
    "correctAnswer": "He will turn the hearts of the fathers to their children and children to fathers",
    "bibleReference": "Malachi 4:6",
    "explanation": "God promised reconciliation between generations before the coming day of the Lord.",
    "explanationTelugu": "యెహోవా దినము రాకమునుపు తరాల మధ్య సమాధానము కలుగునని ప్రవచించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which Danite husband and wife received the angel’s announcement concerning Samson’s birth?",
    "questionTelugu": "సంసోను జననమును గూర్చి దైవదూత ప్రత్యక్షమైన దాను గోత్రీకులైన దంపతులు ఎవరు?",
    "options": [
      "Manoah and his wife",
      "Elkanah and Hannah",
      "Boaz and Ruth",
      "Amram and Jochebed"
    ],
    "optionsTelugu": [
      "మనోహ మరియు ఆయన భార్య",
      "ఎల్కానా మరియు హన్నా",
      "బోయజు మరియు రూతు",
      "అమ్రాము మరియు యోకెబెదు"
    ],
    "correctAnswer": "Manoah and his wife",
    "bibleReference": "Judges 13:2-14",
    "explanation": "Manoah prayed for the Man of God to return and teach them how to raise the child.",
    "explanationTelugu": "పిల్లాడిని ఎలా పెంచాలో నేర్పించమని మనోహ దేవునిని ప్రార్థించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which daughter of Saul helped David escape through a bedroom window from assassins?",
    "questionTelugu": "హంతకుల నుండి తప్పించుకొనుటకు దావీదును కిటికీ గుండా క్రిందికి దించిన సౌలు కుమార్తె ఎవరు?",
    "options": [
      "Michal",
      "Merab",
      "Athaliah",
      "Jezebel"
    ],
    "optionsTelugu": [
      "మీకాలు",
      "మేరబు",
      "అతల్యా",
      "యెజెబెలు"
    ],
    "correctAnswer": "Michal",
    "bibleReference": "1 Samuel 19:11-12",
    "explanation": "Michal lowered David through a window and placed an idol in the bed to delay Saul’s guards.",
    "explanationTelugu": "మీకాలు దావీదును ప్రేమించి కిటికీ గుండా తప్పించి ప్రాణము కాపాడెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "What kindness did the wealthy woman of Shunem show to prophet Elisha?",
    "questionTelugu": "షూనేమీయురాలైన ధనిక స్త్రీ ఎలీషా ప్రవక్త కొరకు ఏ విశేష ఉపకారము చేసెను?",
    "options": [
      "Built and furnished a rooftop guest room for him",
      "Bought him a golden chariot",
      "Paid off all his debts",
      "Cooked banquets for his school of prophets"
    ],
    "optionsTelugu": [
      "మేడపై ఒక చిన్న గది కట్టించి మంచము, బల్ల, దీపస్తంభము ఉంచెను",
      "బంగారు రథమును కొనిచ్చెను",
      "అప్పులన్నీ తీర్చివేసెను",
      "రోజూ విందులు చేసెను"
    ],
    "correctAnswer": "Built and furnished a rooftop guest room for him",
    "bibleReference": "2 Kings 4:8-10",
    "explanation": "She urged her husband to make a small furnished room on the roof for the holy man of God.",
    "explanationTelugu": "ఆమె తన భర్తతో మాట్లాడి ఎలీషా కొరకు మేడమీద ఒక గదిని సిద్ధపరచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "What miracle did God perform through Elisha for the Shunammite family?",
    "questionTelugu": "షూనేము కుటుంబము కొరకు ఎలీషా ద్వారా దేవుడు చేసిన గొప్ప అద్భుతము ఏమిటి?",
    "options": [
      "Raised her young son back to life from the dead",
      "Turned their well into sweet milk",
      "Multiplied her silver ten times",
      "Healed her servants of leprosy"
    ],
    "optionsTelugu": [
      "చనిపోయిన ఆమె చిన్న కుమారుని తిరిగి బ్రతికించెను",
      "బావి నీటిని పాలుగా మార్చెను",
      "వెండిని పదిరెట్లు చేసెను",
      "దాసుల కుష్ఠరోగమును బాగుచేసెను"
    ],
    "correctAnswer": "Raised her young son back to life from the dead",
    "bibleReference": "2 Kings 4:32-37",
    "explanation": "Elisha stretched himself over the child and God restored the boy’s life.",
    "explanationTelugu": "ఎలీషా ప్రార్థన చేయగా ఆ బాలుడు ఏడుమారులు తుమ్మి కన్నులు తెరచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "What does Proverbs 17:21 say about a parent who raises a foolish child?",
    "questionTelugu": "సామెతలు 17:21 లో బుద్ధిహీనుడైన కుమారుని కనిన తండ్రిని గూర్చి ఏమి చెప్పబడెను?",
    "options": [
      "To father a fool brings grief; the father of a fool has no joy",
      "He will be rewarded in town",
      "He will inherit great lands",
      "He will laugh continually"
    ],
    "optionsTelugu": [
      "బుద్ధిహీనుని కనినవానికి దుఃఖమే కలుగును; వానికి సంతోషముండదు",
      "ఊరిలో సన్మానింపబడును",
      "భూములను పొందును",
      "ఎల్లప్పుడూ నవ్వుతూ ఉండును"
    ],
    "correctAnswer": "To father a fool brings grief; the father of a fool has no joy",
    "bibleReference": "Proverbs 17:21",
    "explanation": "\"To have a fool for a child brings grief; there is no joy for the parent of a godless fool.\"",
    "explanationTelugu": "\"బుద్ధిహీనుని కనినవానికి దుఃఖమే కలుగును, మూర్ఖుని తండ్రికి సంతోషము కలగదు.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who took a timbrel in her hand and led the women in songs of praise to God after the Red Sea?",
    "questionTelugu": "ఎర్రసముద్రము దాటిన తరువాత చేతిలో తంబుర పట్టుకొని స్త్రీలందరితో కలిసి దేవుని స్తుతించిన మోషే సహోదరి ఎవరు?",
    "options": [
      "Miriam the prophetess",
      "Deborah the judge",
      "Huldah the prophetess",
      "Anna the prophetess"
    ],
    "optionsTelugu": [
      "ప్రవక్త్రియైన మిర్యాము",
      "న్యాయాధిపతియైన దెబోరా",
      "హుల్దా ప్రవక్త్రి",
      "అన్నమ్మ ప్రవక్త్రి"
    ],
    "correctAnswer": "Miriam the prophetess",
    "bibleReference": "Exodus 15:20",
    "explanation": "Miriam the prophetess, Aaron’s sister, took a tambourine and led all the women.",
    "explanationTelugu": "అహరోను సహోదరియు ప్రవక్త్రియునైన మిర్యాము తంబురను చేతపట్టుకొని నాట్యము చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "What was the lineage connecting Ruth to King David?",
    "questionTelugu": "రూతు నుండి దావీదు రాజుకు గల వంశావళి క్రమము ఏమిటి?",
    "options": [
      "Ruth bore Obed, Obed fathered Jesse, Jesse fathered David",
      "Ruth bore Jesse, Jesse fathered David",
      "Ruth was David’s direct mother",
      "Ruth was David’s daughter"
    ],
    "optionsTelugu": [
      "రూతు ఓబేదును కనెను, ఓబేదు యెష్షయిని కనెను, యెష్షయి దావీదును కనెను",
      "రూతు నేరుగా యెష్షయిని కనెను",
      "రూతు దావీదుకు సొంత తల్లి",
      "రూతు దావీదు కుమార్తె"
    ],
    "correctAnswer": "Ruth bore Obed, Obed fathered Jesse, Jesse fathered David",
    "bibleReference": "Ruth 4:17, 21-22",
    "explanation": "Boaz fathered Obed by Ruth, Obed fathered Jesse, and Jesse fathered David.",
    "explanationTelugu": "బోయజు రూతు వలన ఓబేదును, ఓబేదు యెష్షయిని, యెష్షయి దావీదును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which brother was a skilled hunter who enjoyed the outdoors, favored by Isaac?",
    "questionTelugu": "వేటాడుటలో సమర్థుడై ఇస్సాకుకు ఇష్టుడైన అడవి మనిషి ఎవరు?",
    "options": [
      "Esau",
      "Jacob",
      "Ishmael",
      "Nimrod"
    ],
    "optionsTelugu": [
      "ఏశావు",
      "యాకోబు",
      "ఇష్మాయేలు",
      "నిమ్రోదు"
    ],
    "correctAnswer": "Esau",
    "bibleReference": "Genesis 25:27-28",
    "explanation": "Esau became a skillful hunter, a man of the open country, while Jacob was content at home.",
    "explanationTelugu": "ఏశావు వేటగాడై అడవియందు తిరుగు మనుష్యుడాయెను, ఇస్సాకు ఏశావును ప్రేమించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "How many children was Job blessed with at the end of his great trials?",
    "questionTelugu": "శోధనలు ముగిసిన తరువాత యోబుకు దేవుడు అనుగ్రహించిన కుమారుల కుమార్తెల సంఖ్య ఎంత?",
    "options": [
      "Seven sons and three daughters",
      "Twelve sons and two daughters",
      "Ten sons and no daughters",
      "Five sons and five daughters"
    ],
    "optionsTelugu": [
      "ఏడుగురు కుమారులు మరియు ముగ్గురు కుమార్తెలు",
      "పన్నెండుగురు కుమారులు",
      "పదిమంది కుమారులు మాత్రమే",
      "ఐదుగురు కుమారులు ఐదుగురు కుమార్తెలు"
    ],
    "correctAnswer": "Seven sons and three daughters",
    "bibleReference": "Job 42:13",
    "explanation": "The Lord blessed the latter part of Job’s life with seven sons and three beautiful daughters.",
    "explanationTelugu": "దేవుడు యోబునకు మరల ఏడుగురు కుమారులను ముగ్గురు సౌందర్యవంతులైన కుమార్తెలను ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "Why does 1 Peter 3:7 instruct husbands to treat wives with honor as fellow heirs?",
    "questionTelugu": "1 పేతురు 3:7 లో భార్యలను సహవారసులుగా భావించి గౌరవించకపోతే ఏమి ఆటంకపడునని చెప్పబడెను?",
    "options": [
      "So that nothing will hinder their prayers",
      "So they can gain church office",
      "To prevent bad weather",
      "To avoid public criticism"
    ],
    "optionsTelugu": [
      "వారి ప్రార్థనలకు ఏ ఆటంకము కలుగకుండునట్లు",
      "సంఘములో పెద్ద పదవి వచ్చుటకు",
      "వాతావరణము బాగుండుటకు",
      "నలుగురిలో పరువు పోకుండా ఉండుటకు"
    ],
    "correctAnswer": "So that nothing will hinder their prayers",
    "bibleReference": "1 Peter 3:7",
    "explanation": "Husbands must treat wives with respect as co-heirs of the grace of life, so prayers are not hindered.",
    "explanationTelugu": "జీవమను కృపావరములో సహవారసులని ఎరిగి వారిని ఘనపరచినప్పుడే ప్రార్థనలకు ఆటంకముండదు.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "Why could Joseph’s brothers not speak a kind word to him in Genesis 37?",
    "questionTelugu": "ఆదికాండము 37 లో అన్నలు యోసేపుతో సమాధానముగా ఎందుకు మాట్లాడలేకపోయిరి?",
    "options": [
      "Because their father loved him more than all of them",
      "Because Joseph took all their sheep",
      "Because Joseph refused to work",
      "Because Joseph did not know their language"
    ],
    "optionsTelugu": [
      "తండ్రి అందరికంటె యోసేపును ఎక్కువగా ప్రేమించుట చూచి అసూయపడినందున",
      "యోసేపు గొర్రెలన్నిటినీ తీసేసుకున్నందున",
      "యోసేపు పని చేయనందున",
      "భాష రానందున"
    ],
    "correctAnswer": "Because their father loved him more than all of them",
    "bibleReference": "Genesis 37:4",
    "explanation": "When his brothers saw that their father loved him more, they hated him and could not speak peaceably.",
    "explanationTelugu": "తండ్రి అతనిని ఎక్కువగా ప్రేమించుట చూచి వారు ద్వేషించి సమాధానముగా మాట్లాడలేకపోయిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which brother pled with Joseph in Egypt, offering himself as a slave in place of Benjamin?",
    "questionTelugu": "బెన్యామీనుకు బదులుగా తానే బానిసగా ఉంటానని యోసేపు యెదుట కన్నీటితో వేడుకున్న అన్న ఎవరు?",
    "options": [
      "Judah",
      "Dan",
      "Naphtali",
      "Asher"
    ],
    "optionsTelugu": [
      "యూదా",
      "దాను",
      "నఫ్తాలి",
      "ఆషేరు"
    ],
    "correctAnswer": "Judah",
    "bibleReference": "Genesis 44:33",
    "explanation": "Judah said: \"Now then, please let your servant remain here as my lord’s slave in place of the boy.\"",
    "explanationTelugu": "యూదా: \"చిన్నవానికి బదులుగా నీ దాసుడనైన నన్ను బానిసగా ఉండనిమ్ము\" అని ప్రార్థించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "What special arrangement did Pharaoh’s daughter make for baby Moses’ nursing?",
    "questionTelugu": "శిశువైన మోషేకు పాలిచ్చి పెంచుటకు ఫరో కుమార్తె ఎవరిని పిలిపించెను?",
    "options": [
      "She unwittingly hired Moses’ own mother Jochebed",
      "She hired an Egyptian temple priestess",
      "She fed him camel milk",
      "She placed him in an orphanage"
    ],
    "optionsTelugu": [
      "మోషే కన్నతల్లియైన యోకెబెదునే జీతమిచ్చి పిలిపించెను",
      "ఐగుప్తు పూజారిణిని పిలిపించెను",
      "ఒంటె పాలు పట్టించెను",
      "అనాథాశ్రమంలో ఉంచెను"
    ],
    "correctAnswer": "She unwittingly hired Moses’ own mother Jochebed",
    "bibleReference": "Exodus 2:7-9",
    "explanation": "Pharaoh’s daughter told Jochebed: \"Take this baby and nurse him for me, and I will pay you.\"",
    "explanationTelugu": "ఫరో కుమార్తె: \"ఈ పిల్లను తీసికొనిపోయి నా కొరకు పాలిచ్చి పెంచుము, నేను నీకు జీతమిచ్చెదను\" అనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "What desperate plea did synagogue leader Jairus make at the feet of Jesus?",
    "questionTelugu": "సమాజమందిరపు అధికారియైన యాయీరు యేసు పాదాలపై పడి ఏమి వేడుకొనెను?",
    "options": [
      "\"My little daughter is dying; come lay Your hands on her so she will live\"",
      "\"Give my family gold from the treasury\"",
      "\"Make me high priest in Jerusalem\"",
      "\"Expel the Romans from Galilee\""
    ],
    "optionsTelugu": [
      "\"నా చిన్న కుమార్తె చనిపోవు స్థితిలో ఉన్నది; వచ్చి ఆమెపై చెయ్యి ఉంచుము, ఆమె బ్రతుకును\"",
      "\"మందిరము నుండి బంగారము ఇమ్ము\"",
      "\"నన్ను ప్రధాన యాజకునిగా చేయుము\"",
      "\"రోమీయులను వెళ్లగొట్టుము\""
    ],
    "correctAnswer": "\"My little daughter is dying; come lay Your hands on her so she will live\"",
    "bibleReference": "Mark 5:23",
    "explanation": "Jairus pleaded earnestly for his only daughter, twelve years of age.",
    "explanationTelugu": "తన పన్నెండేళ్ల ఏకైక కుమార్తె మరణావస్థలో ఉండగా వచ్చి బ్రతికించమని వేడుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Proverbs 15:20, what does a wise child bring to a parent?",
    "questionTelugu": "సామెతలు 15:20 ప్రకారం, జ్ఞానముగల కుమారుడు తండ్రికి ఏమి కలుగజేయును?",
    "options": [
      "Gladness / joy",
      "Bankruptcy",
      "Boredom",
      "Anxiety"
    ],
    "optionsTelugu": [
      "సంతోషము",
      "దివాలా",
      "విసుగు",
      "ఆందోళన"
    ],
    "correctAnswer": "Gladness / joy",
    "bibleReference": "Proverbs 15:20",
    "explanation": "\"A wise son brings joy to his father, but a foolish man despises his mother.\"",
    "explanationTelugu": "\"జ్ఞానముగల కుమారుడు తండ్రిని సంతోషపరచును, బుద్ధిహీనుడు తల్లిని తిరస్కరించును.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who prompted Syrian general Naaman’s household to seek healing from the prophet of Israel?",
    "questionTelugu": "సిరియా సేనాధిపతియైన నైమాను ఇశ్రాయేలు ప్రవక్త వద్దకు వెళ్ళునట్లు సలహా ఇచ్చినది ఎవరు?",
    "options": [
      "A captive young Hebrew servant girl",
      "The King of Syria",
      "Naaman’s chief soldier",
      "A foreign sorcerer"
    ],
    "optionsTelugu": [
      "బానిసగా తేబడిన ఒక చిన్న ఇశ్రాయేలు బాలిక",
      "సిరియా రాజు",
      "నైమాను ప్రధాన సైనికుడు",
      "ఒక శకునగాడు"
    ],
    "correctAnswer": "A captive young Hebrew servant girl",
    "bibleReference": "2 Kings 5:2-3",
    "explanation": "The little girl said to her mistress: \"If only my master would see the prophet who is in Samaria!\"",
    "explanationTelugu": "ఆ చిన్నది: \"నా యజమానుడు సమరయలోని ప్రవక్త యొద్దకు వెళ్లినయెడల బాగుపడును\" అని చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "Who was the fisherman father of disciples James and John mending nets by the sea?",
    "questionTelugu": "సముద్ర తీరములో వలలు బాగుచేసుకొనుచున్న శిష్యులైన యాకోబు యోహానుల తండ్రి ఎవరు?",
    "options": [
      "Zebedee",
      "Jonas",
      "Alphaeus",
      "Cleopas"
    ],
    "optionsTelugu": [
      "జెబెదయి",
      "యోనా",
      "అల్ఫయి",
      "క్లియోపా"
    ],
    "correctAnswer": "Zebedee",
    "bibleReference": "Matthew 4:21-22",
    "explanation": "Jesus called James and John who were in the boat with their father Zebedee.",
    "explanationTelugu": "యేసు వారి తండ్రియైన జెబెదయియొద్ద దోనెలో వలలు బాగుచేయుచున్న యాకోబు యోహానులను పిలిచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "Whose mother-in-law was lying sick with a fever until Jesus touched her hand?",
    "questionTelugu": "తీవ్రమైన జ్వరముతో మంచము పట్టియుండగా యేసు చెయ్యి పట్టుకొని బాగుచేసినది ఎవరి అత్తగారిని?",
    "options": [
      "Peter’s mother-in-law",
      "Andrew’s mother-in-law",
      "Matthew’s mother-in-law",
      "Philip’s mother-in-law"
    ],
    "optionsTelugu": [
      "పేతురు అత్తగారు",
      "అంద్రెయ అత్తగారు",
      "మత్తయి అత్తగారు",
      "ఫిలిప్పు అత్తగారు"
    ],
    "correctAnswer": "Peter’s mother-in-law",
    "bibleReference": "Matthew 8:14-15",
    "explanation": "Jesus touched her hand, the fever left her, and she got up and waited on Him.",
    "explanationTelugu": "యేసు ఆమె చెయ్యి ముట్టగానే జ్వరము ఆమెను విడిచెను; ఆమె లేచి ఆయనకు ఉపచారము చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "Why was the older brother resentful when his father celebrated the prodigal son’s return?",
    "questionTelugu": "తప్పిపోయిన కుమారుని రాకతో తండ్రి విందు చేయగా పెద్ద కుమారుడు ఎందుకు కోపగించుకొనెను?",
    "options": [
      "He felt his years of faithful labor were overlooked without a feast",
      "He wanted the farm sold",
      "He disliked music and dancing",
      "He wanted to live in the city"
    ],
    "optionsTelugu": [
      "తాను ఇన్ని సంవత్సరాలు నమ్మకముగా పనిచేసినా ఎప్పుడూ విందు చేయలేదని భావించినందున",
      "పొలమంతా అమ్మేయాలని అనుకున్నందున",
      "సంగీతము నృత్యము గిట్టనందున",
      "పట్టణములో స్థిరపడాలనుకున్నందున"
    ],
    "correctAnswer": "He felt his years of faithful labor were overlooked without a feast",
    "bibleReference": "Luke 15:28-30",
    "explanation": "The older son complained that his father had never given him even a young goat to celebrate with friends.",
    "explanationTelugu": "పెద్దవాడు: \"నేను ఇన్నేళ్లుగా నీ ఆజ్ఞ మీరలేదు, నాకు ఎన్నడూ ఒక మేకపిల్లను కూడా ఇవ్వలేదు\" అని కోపించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "What does Psalm 68:6 declare God does for the lonely and solitary?",
    "questionTelugu": "కీర్తనలు 68:6 లో ఏకాంగులైన వారి కొరకు దేవుడు ఏమి చేయునని రాయబడెను?",
    "options": [
      "Sets them in families / homes",
      "Leaves them isolated in deserts",
      "Sends them away from towns",
      "Counts them as forgotten"
    ],
    "optionsTelugu": [
      "ఏకాంగులను కుటుంబములలో నివసింపజేయును",
      "ఎడారిలో వదిలివేయును",
      "ఊరి నుండి వెళ్లగొట్టును",
      "మరచిపోవును"
    ],
    "correctAnswer": "Sets them in families / homes",
    "bibleReference": "Psalm 68:6",
    "explanation": "\"God sets the solitary in families: He brings out those who are bound into prosperity.\"",
    "explanationTelugu": "\"దేవుడు ఏకాంగులను కుటుంబములలో నివసింపజేయును; ఆయన బంధింపబడినవారిని విడిపించి వర్ధిల్లజేయును.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which seller of purple cloth in Philippi believed and opened her home to Paul’s missionary team?",
    "questionTelugu": "ఫిలిప్పీలో ఊదారంగు బట్టలు అమ్ముచుండి విశ్వసించి తన యింటిని పౌలు బృందానికి తెరిచిన స్త్రీ ఎవరు?",
    "options": [
      "Lydia",
      "Rhoda",
      "Syntyche",
      "Euodia"
    ],
    "optionsTelugu": [
      "లూదియ",
      "రోదా",
      "సుంటుకే",
      "యూవొదియ"
    ],
    "correctAnswer": "Lydia",
    "bibleReference": "Acts 16:14-15",
    "explanation": "Lydia and the members of her household were baptized, and she welcomed them into her home.",
    "explanationTelugu": "లూదియ మరియు ఆమె యింటివారందరును బాప్తిస్మము పొంది శిష్యులను చేర్చుకొనిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which physical half-brother of Jesus later led the Jerusalem church and authored an epistle?",
    "questionTelugu": "యేసు శరీరధారియైన సహోదరుడై యెరూషలేము సంఘమునకు నాయకుడై పత్రికను రాసినది ఎవరు?",
    "options": [
      "James",
      "Jude (Thaddaeus)",
      "Simon the Zealot",
      "Bartholomew"
    ],
    "optionsTelugu": [
      "యాకోబు",
      "యూదా (తద్దయి)",
      "సీమోను",
      "బర్తొలొమయి"
    ],
    "correctAnswer": "James",
    "bibleReference": "Galatians 1:19, James 1:1",
    "explanation": "James the brother of the Lord was a pillar of the early church in Jerusalem.",
    "explanationTelugu": "ప్రభువు సహోదరుడైన యాకోబు యెరూషలేము సంఘములో ముఖ్య స్తంభముగా ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "What duty are older women assigned regarding younger women in Titus 2:4?",
    "questionTelugu": "తీతుకు 2:4 లో వృద్ధ స్త్రీలు యౌవన స్త్రీలకు ఏమి నేర్పించాలని ఆజ్ఞాపించబడెను?",
    "options": [
      "Train them to love their husbands and children",
      "Teach them worldly politics",
      "Encourage them to gossip from house to house",
      "Leave all household chores behind"
    ],
    "optionsTelugu": [
      "తమ భర్తలను పిల్లలను ప్రేమించుటకు బుద్ధి చెప్పవలెను",
      "రాజకీయాలు నేర్పించవలెను",
      "ఇంటింటికి తిరిగి కాలక్షేపము చేయవలెను",
      "పనులను విడిచిపెట్టవలెను"
    ],
    "correctAnswer": "Train them to love their husbands and children",
    "bibleReference": "Titus 2:4",
    "explanation": "Older women should teach what is good, training younger women to love their husbands and children.",
    "explanationTelugu": "యౌవన స్త్రీలు తమ భర్తలను పిల్లలను ప్రేమించువారై యుండునట్లు వృద్ధ స్త్రీలు బుద్ధి చెప్పాలి.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Hebrews 12:7, how does the discipline of earthly parents compare to God’s discipline?",
    "questionTelugu": "హెబ్రీయులకు 12:7 లో శరీరసంబంధులైన తండ్రుల శిక్ష దేవుని శిక్షతో ఎలా పోల్చబడెను?",
    "options": [
      "God disciplines us as beloved children for our good",
      "God punishes out of cruel anger",
      "God never disciplines believers",
      "Parents have no authority"
    ],
    "optionsTelugu": [
      "దేవుడు మన మేలుకొరకు ప్రేమించు కుమారులనుగా శిక్షించుచున్నాడు",
      "దేవుడు కక్షతో కొట్టును",
      "దేవుడు ఎన్నడూ శిక్షించడు",
      "తల్లిదండ్రులకు అధికారము లేదు"
    ],
    "correctAnswer": "God disciplines us as beloved children for our good",
    "bibleReference": "Hebrews 12:7",
    "explanation": "God treats you as His children. For what children are not disciplined by their father?",
    "explanationTelugu": "దేవుడు కుమారులనుగా మిమ్మును చేర్చుకొనుచున్నాడు; తండ్రి శిక్షింపని కుమారుడెవడు?",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "Why did God commend Abraham regarding his children in Genesis 18:19?",
    "questionTelugu": "ఆదికాండము 18:19 లో అబ్రాహాము తన సంతానము విషయములో ఏమి చేయునని దేవుడు నమ్మెను?",
    "options": [
      "He would direct his children and household to keep the way of the Lord",
      "He would build an empire of gold",
      "He would teach them military conquest",
      "He would make them kings of Egypt"
    ],
    "optionsTelugu": [
      "నీతి న్యాయములను జరిగించుచు యెహోవా మార్గమును గైకొనుటకు తన పిల్లలకు ఆజ్ఞాపించును",
      "బంగారు సామ్రాజ్యాన్ని కట్టును",
      "యుద్ధ విద్యలను నేర్పును",
      "ఐగుప్తు రాజులుగా చేయును"
    ],
    "correctAnswer": "He would direct his children and household to keep the way of the Lord",
    "bibleReference": "Genesis 18:19",
    "explanation": "God chose Abraham so that he would direct his children and his household to keep the way of the Lord.",
    "explanationTelugu": "యెహోవా మార్గమును గైకొనుటకు తన పిల్లలకును ఇంటివారికిని ఆజ్ఞాపించునని దేవుడు ఎరిగెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which cousin of Barnabas left Paul on an early journey, but was later reconciled as helpful for ministry?",
    "questionTelugu": "మొదటి ప్రయాణములో పౌలును విడిచి వెళ్లి తరువాత సేవకు ఉపయోగపడిన బర్నబా బంధువు ఎవరు?",
    "options": [
      "John Mark",
      "Silas",
      "Luke",
      "Titus"
    ],
    "optionsTelugu": [
      "మార్కు అను యోహాను",
      "సీల",
      "లూకా",
      "తీతు"
    ],
    "correctAnswer": "John Mark",
    "bibleReference": "Colossians 4:10, 2 Timothy 4:11",
    "explanation": "Paul wrote in his final letter: \"Get Mark and bring him with you, because he is helpful to me.\"",
    "explanationTelugu": "పౌలు కడవరి పత్రికలో: \"మార్కును వెంటబెట్టుకొని రమ్ము, అతడు పరిచర్య నిమిత్తము నాకు ప్రయోజనకరమై యున్నాడు\" అని రాసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "Who was the only named daughter born to Jacob and Leah in Genesis?",
    "questionTelugu": "ఆదికాండములో యాకోబు మరియు లేయాలకు పుట్టిన ఏకైక కుమార్తె ఎవరు?",
    "options": [
      "Dinah",
      "Tamar",
      "Serah",
      "Asenath"
    ],
    "optionsTelugu": [
      "దీనా",
      "తామారు",
      "శెరహు",
      "ఆస్నతు"
    ],
    "correctAnswer": "Dinah",
    "bibleReference": "Genesis 30:21",
    "explanation": "After bearing six sons, Leah gave birth to a daughter and named her Dinah.",
    "explanationTelugu": "ఆరుగురు కుమారుల తరువాత లేయా ఒక కుమార్తెను కని ఆమెకు దీనా అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "In 1 Corinthians 7:14, how is an unbelieving spouse sanctified in the home?",
    "questionTelugu": "1 కొరింథీయులకు 7:14 ప్రకారం, అవిశ్వాసియైన భర్త లేదా భార్య కుటుంబములో దేని ద్వారా పవిత్రపరచబడును?",
    "options": [
      "Through the believing marriage partner",
      "Through buying temple items",
      "By living in a holy city",
      "By divorce"
    ],
    "optionsTelugu": [
      "విశ్వాసియైన భాగస్వామి ద్వారా",
      "మందిరపు వస్తువులను కొనుట ద్వారా",
      "పవిత్ర నగరములో నివసించుట వలన",
      "విడాకులు తీసుకొనుట వలన"
    ],
    "correctAnswer": "Through the believing marriage partner",
    "bibleReference": "1 Corinthians 7:14",
    "explanation": "The unbelieving husband has been sanctified through his believing wife, and vice versa.",
    "explanationTelugu": "అవిశ్వాసియైన భర్త భార్యనుబట్టియు, అవిశ్వాసియైన భార్య విశ్వాసియైన సహోదరునిబట్టియు పవిత్రపరచబడును.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "What great household salvation promise was given by Paul and Silas in Acts 16:31?",
    "questionTelugu": "అపొస్తలుల కార్యములు 16:31 లో పౌలు మరియు సీల ప్రకటించిన కుటుంబ రక్షణ వాగ్దానము ఏది?",
    "options": [
      "\"Believe in the Lord Jesus, and you will be saved—you and your household\"",
      "\"Pay your taxes on time and you will prosper\"",
      "\"Build altars on every hill\"",
      "\"Keep quiet about your faith\""
    ],
    "optionsTelugu": [
      "\"ప్రభువైన యేసునందు విశ్వాసముంచుము, అప్పుడు నీవును నీ యింటివారును రక్షణ పొందుదురు\"",
      "\"పన్నులు సకాలములో కట్టుము\"",
      "\"ప్రతి కొండపై బలిపీఠములు కట్టుము\"",
      "\"విశ్వాసమును గూర్చి ఎవరికీ చెప్పవద్దు\""
    ],
    "correctAnswer": "\"Believe in the Lord Jesus, and you will be saved—you and your household\"",
    "bibleReference": "Acts 16:31",
    "explanation": "Paul proclaimed salvation not only for the jailer individually, but for his whole family.",
    "explanationTelugu": "ప్రభువైన యేసునందు విశ్వాసముంచుము, అప్పుడు నీవును నీ యింటివారును రక్షణ పొందుదురని పలికిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s2_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "According to Proverbs 17:17, when is a brother specially born for?",
    "questionTelugu": "సామెతలు 17:17 ప్రకారం, సహోదరుడు ముఖ్యముగా ఏ సమయము కొరకు పుట్టును?",
    "options": [
      "Born for a time of adversity / trouble",
      "Born to attend parties",
      "Born to share inheritances only",
      "Born to compete for honor"
    ],
    "optionsTelugu": [
      "ఆపత్కాలము కొరకు జన్మించును",
      "విందుల కొరకు మాత్రమే",
      "ఆస్తి పంచుకోవడానికి మాత్రమే",
      "పదవుల కొరకు పోటీపడుటకు"
    ],
    "correctAnswer": "Born for a time of adversity / trouble",
    "bibleReference": "Proverbs 17:17",
    "explanation": "\"A friend loves at all times, and a brother is born for a time of adversity.\"",
    "explanationTelugu": "\"నిజమైన స్నేహితుడు విడువక ప్రేమించును; సహోదరుడు ఆపత్కాలము కొరకు జన్మించియున్నాడు.\"",
    "marks": 1
  }
];

export const FAMILY_EASY_MASTERY: QuizQuestion[] = [
  {
    "id": "fam_e_s3_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which ancestral family was commended by God through Jeremiah for steadfastly obeying their father Jonadab’s command?",
    "questionTelugu": "తమ పూర్వీకుడైన యోనాదాబు ఆజ్ఞను తూచా తప్పక పాటించినందుకు యిర్మీయా ద్వారా దేవుని మెప్పు పొందిన కుటుంబము ఏది?",
    "options": [
      "The Rechabites",
      "The Kenites",
      "The Gibeonites",
      "The Korahites"
    ],
    "optionsTelugu": [
      "రేకాబీయులు",
      "కేనీయులు",
      "గిబియోనీయులు",
      "కోరహీయులు"
    ],
    "correctAnswer": "The Rechabites",
    "bibleReference": "Jeremiah 35:1-19",
    "explanation": "The Rechabites refused wine, faithfully keeping the charge given by their ancestor Jonadab son of Rekab.",
    "explanationTelugu": "రేకాబీయులు తమ పూర్వీకుడైన యోనాదాబు ఆజ్ఞను కాపాడుకొని ద్రాక్షారసము త్రాగక నమ్మకముగా నిలిచిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "What Old Testament law required a man to marry his deceased brother’s widow to preserve the family name?",
    "questionTelugu": "చనిపోయిన సహోదరుని వంశనామము అంతరించిపోకుండా అతని భార్యను వివాహమాడవలసిన ధర్మశాస్త్ర విధి ఏది?",
    "options": [
      "Levirate marriage",
      "Jubilee release",
      "Nazirite vow",
      "Cities of refuge"
    ],
    "optionsTelugu": [
      "మరుది వివాహ ధర్మము (లెవిరేట్ వివాహము)",
      "సువర్ణ సంవత్సర విడుదల",
      "నాజీరు వ్రతము",
      "ఆశ్రయ పురముల విధి"
    ],
    "correctAnswer": "Levirate marriage",
    "bibleReference": "Deuteronomy 25:5-10",
    "explanation": "If a man died without children, his brother was to marry the widow to raise up offspring for the brother.",
    "explanationTelugu": "నిస్సంతుగా చనిపోయిన సహోదరుని పేరు ఇశ్రాయేలులో నుండి తుడిచిపెట్టబడకుండునట్లు మరుది ఆమెను వివాహము చేసుకోవలెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which four notable women are explicitly mentioned in Jesus’ family genealogy in Matthew 1?",
    "questionTelugu": "మత్తయి 1 లోని యేసుక్రీస్తు వంశావళిలో విశేషముగా పేర్కొనబడిన నలుగురు స్త్రీలు ఎవరు?",
    "options": [
      "Tamar, Rahab, Ruth, and Bathsheba",
      "Sarah, Rebekah, Leah, and Rachel",
      "Hannah, Elizabeth, Mary, and Martha",
      "Miriam, Deborah, Huldah, and Esther"
    ],
    "optionsTelugu": [
      "తామారు, రాహాబు, రూతు, మరియు బత్షెబ",
      "శారా, రిబ్కా, లేయా, మరియు రాహేలు",
      "హన్నా, ఎలీసబెతు, మరియ, మరియు మార్త",
      "మిర్యాము, దెబోరా, హుల్దా, మరియు ఎస్తేరు"
    ],
    "correctAnswer": "Tamar, Rahab, Ruth, and Bathsheba",
    "bibleReference": "Matthew 1:3-6",
    "explanation": "Matthew highlights God’s grace by including Tamar, Rahab, Ruth, and the wife of Uriah.",
    "explanationTelugu": "మత్తయి సువార్తికుడు దేవుని అద్భుత కృపను చాటుతూ ఈ నలుగురు స్త్రీలను వంశావళిలో ప్రస్తావించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which five courageous daughters successfully petitioned Moses for their father’s land inheritance?",
    "questionTelugu": "కుమారులు లేనందున తమ తండ్రి భూభాగము తమకు ఇవ్వాలని మోషే వద్ద న్యాయము పొందిన ఐదుగురు కుమార్తెలు ఎవరి పిల్లలు?",
    "options": [
      "Daughters of Zelophehad",
      "Daughters of Laban",
      "Daughters of Job",
      "Daughters of Philip"
    ],
    "optionsTelugu": [
      "సెలొపెహాదు కుమార్తెలు",
      "లాబాను కుమార్తెలు",
      "యోబు కుమార్తెలు",
      "ఫిలిప్పు కుమార్తెలు"
    ],
    "correctAnswer": "Daughters of Zelophehad",
    "bibleReference": "Numbers 27:1-7",
    "explanation": "Mahlah, Noah, Hoglah, Milcah, and Tirzah claimed their inheritance and God granted it.",
    "explanationTelugu": "సెలొపెహాదు కుమార్తెలైన మహలా, నోయా, హొగ్లా, మిల్కా, తిర్సాలు ధైర్యముగా అడిగి స్వాస్థ్యమును పొందిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "How many unmarried daughters who had the spiritual gift of prophecy did Philip the evangelist have?",
    "questionTelugu": "సువార్తికుడైన ఫిలిప్పుకు ప్రవచించు వరము కలిగిన అవివాహిత కుమార్తెలు ఎంతమంది ఉండిరి?",
    "options": [
      "Four daughters",
      "Two daughters",
      "Seven daughters",
      "Three daughters"
    ],
    "optionsTelugu": [
      "నలుగురు కుమార్తెలు",
      "ఇద్దరు కుమార్తెలు",
      "ఏడుగురు కుమార్తెలు",
      "ముగ్గురు కుమార్తెలు"
    ],
    "correctAnswer": "Four daughters",
    "bibleReference": "Acts 21:8-9",
    "explanation": "Philip had four unmarried daughters who possessed the gift of prophecy.",
    "explanationTelugu": "కైసరయలోని ఫిలిప్పునకు ప్రవచన వరము గల కన్యకలైన నలుగురు కుమార్తెలు ఉండిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which household in Corinth were the first converts in Achaia, devoting themselves to serving the saints?",
    "questionTelugu": "అకయలో ప్రథమఫలమై పరిశుద్ధులకు పరిచర్య చేయుటకు తమ్మునుతాము సమర్పించుకున్న కుటుంబము ఏది?",
    "options": [
      "Household of Stephanas",
      "Household of Crispus",
      "Household of Gaius",
      "Household of Chloe"
    ],
    "optionsTelugu": [
      "స్తెఫను ఇంటివారు",
      "క్రిస్పు ఇంటివారు",
      "గాయి ఇంటివారు",
      "క్లోయే ఇంటివారు"
    ],
    "correctAnswer": "Household of Stephanas",
    "bibleReference": "1 Corinthians 16:15",
    "explanation": "The household of Stephanas were the firstfruits of Achaia and devoted themselves to ministry.",
    "explanationTelugu": "స్తెఫను ఇంటివారు పరిశుద్ధులకు పరిచర్య చేయుటకు తమ్మునుతాము అర్పించుకొనిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "How did Paul plead with Philemon to receive back runaway servant Onesimus?",
    "questionTelugu": "పారిపోయిన దాసుడైన ఒనేసిమును ఫిలేమోను ఎలా చేర్చుకోవాలని పౌలు వేడుకొనెను?",
    "options": [
      "No longer as a slave, but as a beloved brother in Christ",
      "As a criminal under heavy guard",
      "To sell him to foreign traders",
      "To place him in prison irons"
    ],
    "optionsTelugu": [
      "ఇకమీదట దాసునిగా కాక ప్రియ సహోదరునిగా",
      "కాపలా క్రింద ఉన్న నేరస్థునిగా",
      "విదేశీయులకు బానిసగా అమ్ముటకు",
      "చెరసాలలో బంధించుటకు"
    ],
    "correctAnswer": "No longer as a slave, but as a beloved brother in Christ",
    "bibleReference": "Philemon 1:16",
    "explanation": "Paul urged Philemon to receive Onesimus as family in the Lord Jesus.",
    "explanationTelugu": "క్రీస్తునందు ప్రియ సహోదరునిగా అతనిని ప్రేమతో చేర్చుకోవాలని పౌలు రాసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "What covenant sign in Genesis 17 was given to Abraham and all male members of his household?",
    "questionTelugu": "ఆదికాండము 17 లో అబ్రాహామునకు మరియు అతని ఇంటి పురుషులందరికి ఇవ్వబడిన నిబంధన సూచన ఏది?",
    "options": [
      "Circumcision",
      "Anointing with oil",
      "Wearing a white mantle",
      "Water baptism"
    ],
    "optionsTelugu": [
      "సున్నతి సంస్కారము",
      "తైలాభిషేకము",
      "తెల్లని వస్త్రము ధరించుట",
      "నీటి బాప్తిస్మము"
    ],
    "correctAnswer": "Circumcision",
    "bibleReference": "Genesis 17:10-14",
    "explanation": "Every male throughout your generations shall be circumcised as a sign of the covenant.",
    "explanationTelugu": "తరతరములకు మీలోని ప్రతి మగవాడును సున్నతి పొందవలెనని నిబంధన చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "Where was Moses reunited with his wife Zipporah and his two sons after the Exodus from Egypt?",
    "questionTelugu": "ఐగుప్తు విడుదల తరువాత మోషే తన భార్య సిప్పోరా మరియు కుమారులను ఎక్కడ తిరిగి కలుసుకునెను?",
    "options": [
      "At the mountain of God (Sinai / Horeb)",
      "In the land of Goshen",
      "In the city of Jericho",
      "At the Red Sea crossing"
    ],
    "optionsTelugu": [
      "దేవుని పర్వతము వద్ద (సీనాయి / హోరేబు)",
      "గోషెను దేశములో",
      "యెరికో నగరములో",
      "ఎర్రసముద్రపు ఒడ్డున"
    ],
    "correctAnswer": "At the mountain of God (Sinai / Horeb)",
    "bibleReference": "Exodus 18:5",
    "explanation": "Jethro came with Moses’ sons and wife to Moses in the wilderness where he camped at the mountain of God.",
    "explanationTelugu": "యిత్రో మోషే భార్యను కుమారులను తీసికొని అరణ్యములో దేవుని పర్వతము వద్ద మోషే యొద్దకు వచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "How deeply did patriarch Jacob grieve when his sons brought Joseph’s blood-soaked tunic?",
    "questionTelugu": "రక్తముతో తడిసిన యోసేపు నిలువుటంగీని చూచినప్పుడు యాకోబు ఎంతగా విలపించెను?",
    "options": [
      "Tore his clothes, put on sackcloth, and refused to be comforted",
      "Immediately bought another coat",
      "Praised his other ten sons",
      "Left Canaan forever"
    ],
    "optionsTelugu": [
      "వస్త్రములు చింపుకొని, గోనెపట్ట కట్టుకొని, ఓదార్పు పొందనొల్లక రోదించెను",
      "వెంటనే మరియొక అంగీని కుట్టించెను",
      "తక్కిన పదిమందిని మెచ్చుకొనెను",
      "కనానును విడిచి వెళ్లిపోయెను"
    ],
    "correctAnswer": "Tore his clothes, put on sackcloth, and refused to be comforted",
    "bibleReference": "Genesis 37:34-35",
    "explanation": "Jacob tore his garments, mourned for his son many days, and said he would go down to Sheol mourning.",
    "explanationTelugu": "యాకోబు తన కుమారులందరు ఓదార్చజూచినను ఓదార్పు పొందనొల్లక దుఃఖముతో పాతాళమునకు దిగిపోదుననెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "What triumphant declaration opens Hannah’s prayer song of praise in 1 Samuel 2?",
    "questionTelugu": "1 సమూయేలు 2 లో హన్నా స్తుతి ప్రార్థన ఏ విజయ ప్రకటనతో ప్రారంభమగును?",
    "options": [
      "\"My heart rejoices in the Lord; in the Lord my horn is lifted high\"",
      "\"Woe is me, for I am undone\"",
      "\"The battle is lost\"",
      "\"Listen to my complaints\""
    ],
    "optionsTelugu": [
      "\"నా హృదయము యెహోవాయందు ఉల్లసించుచున్నది; యెహోవాయందు నా శృంగము హెచ్చింపబడెను\"",
      "\"అయ్యో నాకు శ్రమ\"",
      "\"యుద్ధములో ఓడిపోతిమి\"",
      "\"నా ఫిర్యాదులను వినుము\""
    ],
    "correctAnswer": "\"My heart rejoices in the Lord; in the Lord my horn is lifted high\"",
    "bibleReference": "1 Samuel 2:1",
    "explanation": "Hannah rejoiced in God who exalts the humble and gives children to the barren.",
    "explanationTelugu": "హన్నా గొడ్రాలికి సంతానమిచ్చి శృంగమును హెచ్చించిన దేవుని ఘనపరుస్తూ స్తుతించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "Why did Leah give the name \"Judah\" to her fourth son in Genesis 29:35?",
    "questionTelugu": "ఆదికాండము 29:35 లో లేయా తన నాల్గవ కుమారునికి \"యూదా\" అని పేరు పెట్టుటకు గల కారణమేమిటి?",
    "options": [
      "She said: \"This time I will praise the Lord\"",
      "She said: \"My husband will now obey me\"",
      "She wanted him to be a farmer",
      "Because he was born at night"
    ],
    "optionsTelugu": [
      "\"ఈసారి నేను యెహోవాను స్తుతించెదను\" అని పలికినందున",
      "\"ఇక నా భర్త నాకు లోబడును\" అన్నందున",
      "వ్యవసాయము చేయాలన్నందున",
      "రాత్రివేళ జన్మించినందున"
    ],
    "correctAnswer": "She said: \"This time I will praise the Lord\"",
    "bibleReference": "Genesis 29:35",
    "explanation": "Judah means \"praise\", expressing Leah’s shift from seeking man’s approval to praising God.",
    "explanationTelugu": "యూదా అనగా స్తుతి; లేయా మనుష్యుల ప్రేమకంటె దేవుని స్తుతించుటకు ప్రాధాన్యతనిచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which Gileadite judge made a tragic, rash vow regarding whoever came out of his house?",
    "questionTelugu": "తన ఇంటి గుమ్మము నుండి ఎదురొచ్చిన వారిని దేవునికి అర్పించెదనని తొందరపడి మొక్కుకొని దుఃఖపడిన న్యాయాధిపతి ఎవరు?",
    "options": [
      "Jephthah",
      "Samson",
      "Barak",
      "Ibzan"
    ],
    "optionsTelugu": [
      "యెఫ్తా",
      "సంసోను",
      "బారాకు",
      "ఇబ్సాను"
    ],
    "correctAnswer": "Jephthah",
    "bibleReference": "Judges 11:30-35",
    "explanation": "Jephthah made a rash vow, and his only daughter came out to meet him dancing with tambourines.",
    "explanationTelugu": "యెఫ్తా తొందరపడి మ్రొక్కుకొనగా అతని ఏకైక కుమార్తె తంబురలతో ఎదురొచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "What family qualification is required for an overseer / bishop in 1 Timothy 3:4-5?",
    "questionTelugu": "1 తిమోతి 3:4-5 ప్రకారం సంఘములో అధ్యక్షునిగా ఉండవలసిన వానికి ఉండవలసిన కుటుంబ అర్హత ఏది?",
    "options": [
      "He must manage his own family well and see that his children obey him with respect",
      "He must have ten adult sons",
      "He must live isolated from relatives",
      "He must be an unmarried monk"
    ],
    "optionsTelugu": [
      "తన సొంత యింటివారిని బాగుగా ఏలుచు సంపూర్ణ గౌరవముతో పిల్లలను లోబరచుకొనువాడై యుండవలెను",
      "పదిమంది కుమారులు ఉండాలి",
      "బంధువులకు దూరముగా ఉండాలి",
      "సన్యాసిగా ఉండాలి"
    ],
    "correctAnswer": "He must manage his own family well and see that his children obey him with respect",
    "bibleReference": "1 Timothy 3:4-5",
    "explanation": "If anyone does not know how to manage his own family, how can he take care of God’s church?",
    "explanationTelugu": "ఎవడైనను తన సొంత యింటివారిని ఏలనేరకపోయినయెడల అతడు దేవుని సంఘమును ఎలాగు పాలించును?",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which wise woman intervened with gifts and humble words to save her household from slaughter?",
    "questionTelugu": "తన భర్త బుద్ధిహీనత వలన రాబోయిన నాశనము నుండి బహుమానములతో దావీదును శాంతింపజేసి ఇంటిని కాపాడిన స్త్రీ ఎవరు?",
    "options": [
      "Abigail",
      "Bathsheba",
      "Jezebel",
      "Athaliah"
    ],
    "optionsTelugu": [
      "అబీగయీలు",
      "బత్షెబ",
      "యెజెబెలు",
      "అతల్యా"
    ],
    "correctAnswer": "Abigail",
    "bibleReference": "1 Samuel 25:18-35",
    "explanation": "Abigail acted quickly to make peace for her foolish husband Nabal and their whole household.",
    "explanationTelugu": "అబీగయీలు వివేకముతో దావీదుకు ఆహారము సిద్ధపరచి రక్తసిక్తమైన పగను ఆపి కుటుంబాన్ని కాపాడెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who delivered the inspired royal proverbs found in Proverbs 31:1-9 to King Lemuel?",
    "questionTelugu": "సామెతలు 31:1-9 లో లెమూయేలు రాజునకు దైవిక ఉపదేశమును అందించినది ఎవరు?",
    "options": [
      "His mother",
      "His chief general",
      "The high priest",
      "An Egyptian scholar"
    ],
    "optionsTelugu": [
      "అతని కన్నతల్లి",
      "ప్రధాన సేనాధిపతి",
      "ప్రధాన యాజకుడు",
      "ఐగుప్తు పండితుడు"
    ],
    "correctAnswer": "His mother",
    "bibleReference": "Proverbs 31:1",
    "explanation": "\"The sayings of King Lemuel—an inspired utterance his mother taught him.\"",
    "explanationTelugu": "\"లెమూయేలు రాజు పలికిన సామెతలు; అతని తల్లి అతనికి నేర్పిన ఉపదేశము.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "What painful family breakdown in times of corruption does the prophet Micah describe in Micah 7:6?",
    "questionTelugu": "మీకా 7:6 లో భ్రష్ట సమాజములో కుటుంబ సభ్యుల మధ్య ఎటువంటి విరోధము కలుగునని ప్రవచించెను?",
    "options": [
      "A son dishonors his father, daughter rises against mother, a man’s enemies are members of his house",
      "Families live in perpetual unity",
      "Children bow before elder brothers",
      "Mothers rule as queens"
    ],
    "optionsTelugu": [
      "కుమారుడు తండ్రిని అవమానించును, కుమార్తె తల్లిపై లేచును, ఒకని శత్రువులు వాని యింటివారే యగుదురు",
      "అందరూ నిత్యము ఐక్యముగా ఉందురు",
      "పిల్లలు అన్నలకు సాష్టాంగపడుదురు",
      "తల్లులు రాణులుగా ఏలుదురు"
    ],
    "correctAnswer": "A son dishonors his father, daughter rises against mother, a man’s enemies are members of his house",
    "bibleReference": "Micah 7:6",
    "explanation": "Micah warned of moral decay tearing apart families before God’s redemption.",
    "explanationTelugu": "పాపము వలన సొంత ఇంటివారే ఒకరికొకరు విరోధులగుదురని మీకా ప్రవచించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "What radical call to discipleship did Jesus speak in Matthew 10:37?",
    "questionTelugu": "మత్తయి 10:37 లో యేసు ప్రభువు శిష్యత్వమును గూర్చి ఏ కఠినమైన సత్యమును పలికెను?",
    "options": [
      "\"Anyone who loves their father or mother more than Me is not worthy of Me\"",
      "\"Hate your relatives openly\"",
      "\"Never speak to your children again\"",
      "\"Family members cannot be saved\""
    ],
    "optionsTelugu": [
      "\"తండ్రినైనను తల్లినైనను నాకంటె ఎక్కువగా ప్రేమించువాడు నాకు పాత్రుడు కాడు\"",
      "\"బంధువులను ద్వేషించుము\"",
      "\"పిల్లలతో మాట్లాడవద్దు\"",
      "\"కుటుంబ సభ్యులకు రక్షణ దొరకదు\""
    ],
    "correctAnswer": "\"Anyone who loves their father or mother more than Me is not worthy of Me\"",
    "bibleReference": "Matthew 10:37",
    "explanation": "Jesus must hold supreme loyalty over even our most cherished earthly relationships.",
    "explanationTelugu": "యేసుప్రభువుకు మన జీవితములో అత్యున్నతమైన మొదటి స్థానము ఉండాలని స్పష్టము చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "Whose home was richly blessed by the Lord because the Ark of God rested there for three months?",
    "questionTelugu": "దేవుని మందసము మూడు నెలలు నివసించినందున యెహోవా వలన సమస్తమునందు ఆశీర్వదింపబడిన ఇల్లు ఎవరిది?",
    "options": [
      "Household of Obed-Edom",
      "Household of Uzzah",
      "Household of Saul",
      "Household of Eli"
    ],
    "optionsTelugu": [
      "ఓబేదెదోము ఇంటివారు",
      "ఉజ్జా ఇంటివారు",
      "సౌలు ఇంటివారు",
      "ఏలీ ఇంటివారు"
    ],
    "correctAnswer": "Household of Obed-Edom",
    "bibleReference": "2 Samuel 6:11-12",
    "explanation": "The Lord blessed Obed-Edom and his entire household because of the Ark of God.",
    "explanationTelugu": "మందసము ఓబేదెదోము ఇంట ఉండగా యెహోవా అతనిని అతని సమస్తమును ఆశీర్వదించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which lame son of Jonathan was welcomed by King David to continually eat at the king’s royal table?",
    "questionTelugu": "యోనాతానుతో చేసిన నిబంధననుబట్టి రాజబల్ల వద్ద ఎల్లప్పుడూ భోజనము చేయుటకు దావీదు చేర్చుకున్న కుంటివాడైన కుమారుడు ఎవరు?",
    "options": [
      "Mephibosheth",
      "Mica",
      "Hananiah",
      "Ahimaaz"
    ],
    "optionsTelugu": [
      "మెఫీబోషెతు",
      "మీకా",
      "హనన్యా",
      "అహిమయస్సు"
    ],
    "correctAnswer": "Mephibosheth",
    "bibleReference": "2 Samuel 9:7-13",
    "explanation": "David restored all Saul’s land to Mephibosheth and fed him as one of the king’s sons.",
    "explanationTelugu": "దావీదు యోనాతాను నిమిత్తము మెఫీబోషెతునకు దయచూపి తన బల్ల వద్ద స్థానమిచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which prophet was commanded by God to marry an unfaithful woman named Gomer as a living picture?",
    "questionTelugu": "ఇశ్రాయేలు అవిశ్వాసతను చిత్రించుటకు గోమెరు అను స్త్రీని పెండ్లిచేసుకొనుమని దేవుని ఆజ్ఞ పొందిన ప్రవక్త ఎవరు?",
    "options": [
      "Hosea",
      "Amos",
      "Joel",
      "Habakkuk"
    ],
    "optionsTelugu": [
      "హోషేయ",
      "ఆమోసు",
      "యోవేలు",
      "హబక్కూకు"
    ],
    "correctAnswer": "Hosea",
    "bibleReference": "Hosea 1:2-3",
    "explanation": "Hosea’s marriage demonstrated God’s unfailing covenant love for wayward Israel.",
    "explanationTelugu": "హోషేయ వివాహము దేవునికి ఇశ్రాయేలుపై గల విడదీయరాని నిబంధన ప్రేమకు సాదృశ్యముగా ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "What prophetic names were given to Hosea and Gomer’s children?",
    "questionTelugu": "హోషేయ మరియు గోమెరుల పిల్లలకు దేవుడు పెట్టిన ప్రవచనార్థక పేర్లు ఏమిటి?",
    "options": [
      "Jezreel, Lo-Ruhamah (Not Loved), and Lo-Ammi (Not My People)",
      "Shem, Ham, and Japheth",
      "Mahershalalhashbaz and Shear-Jashub",
      "Nadab, Abihu, and Eleazar"
    ],
    "optionsTelugu": [
      "యెజ్రెయేలు, లోరూహామా (కనికరము పొందనిది), మరియు లోఅమ్మీ (నా ప్రజలు కారు)",
      "షేము, హాము, మరియు యాపేతు",
      "మహేరు షాలాల్ హాష్ బజ్ మరియు షెయార్ జాషూబు",
      "నాదాబు, అబీహు, మరియు ఎలియాజరు"
    ],
    "correctAnswer": "Jezreel, Lo-Ruhamah (Not Loved), and Lo-Ammi (Not My People)",
    "bibleReference": "Hosea 1:4-9",
    "explanation": "The children’s names depicted God’s unfolding message to Israel, followed by restoration.",
    "explanationTelugu": "దేవుని తీర్పును మరియు ఆ తరువాత కలుగబోవు కనికరమును ఆ పేర్లు సూచించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "Where did Ruth respectfully lie down at the feet of Boaz as her kinsman-redeemer?",
    "questionTelugu": "బంధువుడు మరియు విమోచకుడైన బోయజు పాదముల వద్ద రూతు ఎక్కడ పండుకొనెను?",
    "options": [
      "At the threshing floor at night",
      "In the city gate at noon",
      "At the temple altar",
      "In the king’s palace"
    ],
    "optionsTelugu": [
      "రాత్రివేళ కళ్ళములో ధాన్యపు కుప్ప వద్ద",
      "మధ్యాహ్నము ఊరి గుమ్మము వద్ద",
      "బలిపీఠము యొద్ద",
      "రాజభవనములో"
    ],
    "correctAnswer": "At the threshing floor at night",
    "bibleReference": "Ruth 3:7-9",
    "explanation": "Ruth followed Naomi’s guidance and asked Boaz to spread his garment over her as redeemer.",
    "explanationTelugu": "నయోమి ఉపదేశమును బట్టి రూతు బోయజు పాదముల వైపు పండుకొని విమోచించమని కోరెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "What ambitious request did the mother of James and John make to Jesus?",
    "questionTelugu": "యాకోబు యోహానుల తల్లి యేసును ఏ ఆధిక్యత కొరకు అడిగెను?",
    "options": [
      "That her two sons sit on His right and left in His kingdom",
      "That her sons be given lots of silver",
      "That her sons return home to fish",
      "That her sons build new synagogues"
    ],
    "optionsTelugu": [
      "తన ఇద్దరు కుమారులు నీ రాజ్యములో నీ కుడివైపున ఒకడును ఎడమవైపున ఒకడును కూర్చుండ సెలవిమ్ము",
      "వెండిని ఇప్పించమని",
      "చేపలు పట్టుకోవడానికి ఇంటికి పంపమని",
      "మందిరములను కట్టించుటకు"
    ],
    "correctAnswer": "That her two sons sit on His right and left in His kingdom",
    "bibleReference": "Matthew 20:20-21",
    "explanation": "She knelt before Jesus asking high seats of kingdom honor for her two boys.",
    "explanationTelugu": "జెబెదయి కుమారుల తల్లి యేసునకు నమస్కారము చేసి వారి కొరకు ఉన్నత స్థానములను కోరెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "What was the widow of Zarephath doing when Elijah asked her for water and a small loaf of bread?",
    "questionTelugu": "ఏలీయా ప్రవక్త నీళ్ళు రొట్టె అడిగినప్పుడు సారెపతు విధవరాలు ఏమి చేయుచుండెను?",
    "options": [
      "Gathering two sticks to prepare her last meal for herself and her son to die",
      "Baking for a village wedding",
      "Harvesting a huge barley crop",
      "Buying goods at market"
    ],
    "optionsTelugu": [
      "తనకును తన కుమారునికిని కడవరి భోజనము సిద్ధపరచి చనిపోవుటకు రెండు కట్టెలు ఏరుచుండెను",
      "పెండ్లి విందు వండుచుండెను",
      "పంట కోయుచుండెను",
      "సంతలో సరుకులు కొనుచుండెను"
    ],
    "correctAnswer": "Gathering two sticks to prepare her last meal for herself and her son to die",
    "bibleReference": "1 Kings 17:12",
    "explanation": "She had only a handful of flour in a jar and a little oil in a jug before God multiplied it.",
    "explanationTelugu": "తొట్టెలో పిడికెడు పిండియు బుడ్డిలో కొంచెము నూనెయు మాత్రమే ఉండగా దేవుడు దానిని తరిగిపోనివ్వలేదు.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "What funeral procession in the town of Nain did Jesus stop out of deep compassion for a mother?",
    "questionTelugu": "నాయీను గ్రామములో ఏకైక కుమారుని కోల్పోయిన తల్లిని చూచి కనికరపడి యేసు ఏ శవయాత్రను ఆపెను?",
    "options": [
      "The funeral of a widow’s only son",
      "The funeral of a centurion",
      "The burial of King Herod",
      "The funeral of a Pharisee"
    ],
    "optionsTelugu": [
      "విధవరాలి యొక్క ఏకైక కుమారుని శవయాత్ర",
      "శతాధిపతి అంత్యక్రియలు",
      "హేరోదు రాజు సమాధి",
      "పరిసయ్యుని అంత్యక్రియలు"
    ],
    "correctAnswer": "The funeral of a widow’s only son",
    "bibleReference": "Luke 7:11-15",
    "explanation": "Jesus touched the bier, said: \"Young man, get up!\" and gave him back to his mother.",
    "explanationTelugu": "యేసు పాడెను ముట్టి: \"యౌవనుడా, లెమ్మని\" చెప్పి బ్రతికించి అతని తల్లికి అప్పగించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "How did the Canaanite (Syrophoenician) mother persist in faith for her tormented daughter?",
    "questionTelugu": "దయ్యము పట్టిన తన కుమార్తె స్వస్థత కొరకు కనానీయురాలైన తల్లి ఏ విశ్వాసముతో వేడుకొనెను?",
    "options": [
      "\"Even the dogs eat the crumbs that fall from their masters’ table\"",
      "\"I demand my share as an equal citizen\"",
      "\"I will pay you double wages\"",
      "\"I will consult another teacher\""
    ],
    "optionsTelugu": [
      "\"కుక్కపిల్లలు కూడా తమ యజమానుల బల్లపైనుండి పడు ముక్కలను తినును గదా!\"",
      "\"నాకు సమాన హక్కు ఉన్నది\"",
      "\"రెట్టింపు డబ్బులిస్తాను\"",
      "\"వేరే బోధకుని వద్దకు వెళ్తాను\""
    ],
    "correctAnswer": "\"Even the dogs eat the crumbs that fall from their masters’ table\"",
    "bibleReference": "Matthew 15:27",
    "explanation": "Jesus praised her great faith and her daughter was healed that very hour.",
    "explanationTelugu": "యేసు: \"అమ్మా, నీ విశ్వాసము గొప్పది; నీవు కోరినట్టే అగునుగాక\" అని సెలవిచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "What did the royal official in Capernaum discover regarding the exact hour his dying son recovered?",
    "questionTelugu": "కపెర్నహూములోని రాజోద్యోగి తన కుమారుని జ్వరము విడిచిన ఖచ్చితమైన సమయమును గూర్చి ఏమి తెలుసుకొనెను?",
    "options": [
      "It was the very hour Jesus had told him: \"Your son will live\"",
      "It happened when physicians arrived from Rome",
      "It was late in the night",
      "It happened days later"
    ],
    "optionsTelugu": [
      "\"నీ కుమారుడు బ్రదుకుచున్నాడు\" అని యేసు పలికిన అదే గడియలో జ్వరము విడిచెను",
      "వైద్యులు వచ్చినప్పుడు",
      "రాత్రివేళ",
      "కొన్ని రోజుల తరువాత"
    ],
    "correctAnswer": "It was the very hour Jesus had told him: \"Your son will live\"",
    "bibleReference": "John 4:52-53",
    "explanation": "The father and his whole household believed when they realized the exact moment of Jesus’ word.",
    "explanationTelugu": "ఆ తండ్రికి ఆ సమయము యేసు చెప్పిన సమయమే అని తెలిసి అతడును అతని యింటివారందరును విశ్వసించిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "What sobering prophecy did Isaiah give to King Hezekiah concerning his future family lineage?",
    "questionTelugu": "హిజ్కియా రాజు సంతానమును గూర్చి యెషయా ప్రవక్త పలికిన హెచ్చరిక ప్రవచనము ఏమిటి?",
    "options": [
      "His descendants would be carried off to become officials in the palace of the king of Babylon",
      "His family would conquer all of Egypt",
      "His sons would build golden ships",
      "His daughters would rule Persia"
    ],
    "optionsTelugu": [
      "అతని కుమారులు బబులోను రాజు నగరులో నపుంసకులుగా చెరపట్టబడుదురు",
      "ఐగుప్తును జయింతురు",
      "బంగారు ఓడలను కట్టుదురు",
      "పార్శీ దేశాన్ని ఏలుదురు"
    ],
    "correctAnswer": "His descendants would be carried off to become officials in the palace of the king of Babylon",
    "bibleReference": "2 Kings 20:17-18",
    "explanation": "Hezekiah showed all his treasures, and Isaiah warned of the coming Babylonian captivity.",
    "explanationTelugu": "హిజ్కియా నిధులన్నిటినీ చూపించినందున రాబోవు బబులోను చెరను గూర్చి యెషయా ప్రవచించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "What solemn gathering did dying patriarch Jacob call in Genesis 49?",
    "questionTelugu": "ఆదికాండము 49 లో వృద్ధుడైన యాకోబు తన కుమారులందరినీ పిలిపించి ఏమి చేసెను?",
    "options": [
      "Gathered his twelve sons to prophesy their tribal destinies and bless them",
      "Divided his sheep equally among servants",
      "Cursed the land of Canaan",
      "Appointed Joseph as sole king"
    ],
    "optionsTelugu": [
      "పన్నెండుగురు కుమారులను పిలిపించి కడవరి దినములలో వారికి సంభవింపబోవు సంగతులను ప్రవచించెను",
      "గొర్రెలను సేవకులకు పంచెను",
      "కనానును శపించెను",
      "యోసేపును ఒక్కడినే రాజుగా చేసెను"
    ],
    "correctAnswer": "Gathered his twelve sons to prophesy their tribal destinies and bless them",
    "bibleReference": "Genesis 49:1-28",
    "explanation": "Jacob called his sons: \"Gather around so I can tell you what will happen to you in days to come.\"",
    "explanationTelugu": "యాకోబు: \"కూడి రండి, అంత్యదినములలో మీకు సంభవింపబోవు సంగతులను తెలియజెప్పెదను\" అని దీవించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "How did Moses bless the tribal families of Israel before his death on Mount Nebo?",
    "questionTelugu": "నెబో పర్వతముపై మరణించకముందు మోషే ఇశ్రాయేలు గోత్రముల కుటుంబాలను ఎలా దీవించెను?",
    "options": [
      "Pronounced a unique prophetic blessing upon each tribe",
      "Gave each tribe an iron sword",
      "Transferred the ark to Egypt",
      "Dissolved tribal boundaries"
    ],
    "optionsTelugu": [
      "ప్రతి గోత్రమునకు ప్రత్యేకమైన ప్రవచన ఆశీర్వాదములను ఉచ్చరించెను",
      "ఇనుప కత్తులను ఇచ్చెను",
      "మందసమును ఐగుప్తుకు పంపెను",
      "సరిహద్దులను రద్దు చేసెను"
    ],
    "correctAnswer": "Pronounced a unique prophetic blessing upon each tribe",
    "bibleReference": "Deuteronomy 33:1-29",
    "explanation": "Deuteronomy 33 records the blessing that Moses the man of God pronounced on the Israelites before his death.",
    "explanationTelugu": "దైవజనుడైన మోషే తన మరణమునకు ముందు ఇశ్రాయేలు గోత్రములను ఆశీర్వదించిన ఆశీర్వాదము.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "Why were extensive ancestral genealogies recorded in 1 Chronicles 1–9?",
    "questionTelugu": "1 దినవృత్తాంతములు 1–9 లో సుదీర్ఘమైన వంశావళులు ఎందుకు నమోదు చేయబడెను?",
    "options": [
      "To prove covenant inheritance, tribal land rights, and priestly descent after the exile",
      "To show who paid the most taxes",
      "To list soldiers for Rome",
      "To record merchant guilds"
    ],
    "optionsTelugu": [
      "చెరనుండి తిరిగివచ్చిన తరువాత నిబంధన వారసత్వమును, భూభాగములను, యాజక వంశమును నిర్ధారించుటకు",
      "పన్నులు ఎవరు ఎక్కువ కట్టారో చూపుటకు",
      "రోమా సైనికుల పట్టిక కొరకు",
      "వ్యాపారుల సంఘము కొరకు"
    ],
    "correctAnswer": "To prove covenant inheritance, tribal land rights, and priestly descent after the exile",
    "bibleReference": "1 Chronicles 9:1",
    "explanation": "Genealogies established authentic belonging in the covenant community returning to Jerusalem.",
    "explanationTelugu": "యెరూషలేమునకు తిరిగివచ్చిన ప్రజలలో ఎవరి స్థానము గోత్రముల ప్రకారం నిర్ధారించబడెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "For which loyal household did Paul pray: \"May the Lord grant mercy to the household of...\"?",
    "questionTelugu": "పౌలు బంధకములలో ఉండగా సిగ్గుపడక వెదకి ఆదరించిన ఏ కుటుంబము కొరకు పౌలు కనికరము కోరెను?",
    "options": [
      "Household of Onesiphorus",
      "Household of Demas",
      "Household of Alexander the coppersmith",
      "Household of Hymenaeus"
    ],
    "optionsTelugu": [
      "ఒనేసిఫోరు ఇంటివారు",
      "దేమా ఇంటివారు",
      "కంచరి అలెక్సండరు ఇంటివారు",
      "హుమెనై ఇంటివారు"
    ],
    "correctAnswer": "Household of Onesiphorus",
    "bibleReference": "2 Timothy 1:16-18",
    "explanation": "Onesiphorus often refreshed Paul and was not ashamed of his prison chains.",
    "explanationTelugu": "ఒనేసిఫోరు పౌలు సంకెళ్లను చూచి సిగ్గుపడక రోమాలో ఆతురముగా వెదకి ఆదరించినందున అతని ఇంటిని దీవించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "To whom did the elder apostle John address his second epistle in 2 John 1:1?",
    "questionTelugu": "2 యోహాను 1:1 లో అపొస్తలుడైన యోహాను తన పత్రికను ఎవరికి సంబోధించి రాసెను?",
    "options": [
      "\"To the elect lady and her children, whom I love in the truth\"",
      "\"To the governor of Syria\"",
      "\"To the priests in Alexandria\"",
      "\"To the emperor in Rome\""
    ],
    "optionsTelugu": [
      "\"ఏర్పరచబడిన శ్రీమతికిని ఆమె పిల్లలకును సత్యమునుబట్టి నేను ప్రేమించుచున్నాను\"",
      "\"సిరియా అధిపతికి\"",
      "\"అలెక్సాండ్రియా యాజకులకు\"",
      "\"రోమా చక్రవర్తికి\""
    ],
    "correctAnswer": "\"To the elect lady and her children, whom I love in the truth\"",
    "bibleReference": "2 John 1:1",
    "explanation": "John wrote to a Christian family and church community walking faithfully in God’s truth.",
    "explanationTelugu": "సత్యమందు నడుచుకొనుచున్న ఏర్పరచబడిన శ్రీమతికిని ఆమె పిల్లలకును యోహాను ఈ పత్రిక రాసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "What definitive words did Jesus speak on the permanence of marriage in Matthew 19:6?",
    "questionTelugu": "మత్తయి 19:6 లో వివాహ బంధపు పవిత్రతను గూర్చి యేసు పలికిన స్పష్టమైన మాట ఏమిటి?",
    "options": [
      "\"What therefore God has joined together, let not man separate\"",
      "\"Marriages are temporary contracts\"",
      "\"Divorce for any reason you please\"",
      "\"Men may dissolve marriages at will\""
    ],
    "optionsTelugu": [
      "\"కాబట్టి దేవుడు జతపరచినవారిని మనుష్యుడు వేరుపరచకూడదు\"",
      "\"వివాహము ఒక తాత్కాలిక ఒప్పందము\"",
      "\"ఏ కారణము చేతనైనా విడాకులు ఇవ్వవచ్చు\"",
      "\"పురుషులు ఇష్టము వచ్చినప్పుడు విడదీయవచ్చు\""
    ],
    "correctAnswer": "\"What therefore God has joined together, let not man separate\"",
    "bibleReference": "Matthew 19:6",
    "explanation": "Jesus affirmed God’s original design that husband and wife become one flesh permanently.",
    "explanationTelugu": "దేవుడు ఏకశరీరముగా జతపరచిన భార్యాభర్తలను ఏ మనుష్యుడును విడదీయకూడదని యేసు బోధించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "What profound spiritual mystery does human marriage illustrate in Ephesians 5:31-32?",
    "questionTelugu": "ఎఫెసీయులకు 5:31-32 ప్రకారం, వివాహ వ్యవస్థ ఏ గొప్ప ఆధ్యాత్మిక మర్మమును సూచించుచున్నది?",
    "options": [
      "Christ and the Church",
      "Moses and the Law",
      "David and Jonathan",
      "Angels and the stars"
    ],
    "optionsTelugu": [
      "క్రీస్తు మరియు సంఘము",
      "మోషే మరియు ధర్మశాస్త్రము",
      "దావీదు మరియు యోనాతాను",
      "దేవదూతలు మరియు నక్షత్రములు"
    ],
    "correctAnswer": "Christ and the Church",
    "bibleReference": "Ephesians 5:31-32",
    "explanation": "\"This is a profound mystery—but I am talking about Christ and the church.\"",
    "explanationTelugu": "\"ఈ మర్మము గొప్పది; అయితే నేను క్రీస్తును గూర్చియు సంఘమును గూర్చియు చెప్పుచున్నాను.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "Under the decree of King Cyrus, who returned to rebuild the temple according to Ezra 1:5?",
    "questionTelugu": "కోరెషు రాజు ఆజ్ఞ చొప్పున ఎజ్రా 1:5 ప్రకారం మందిరమును కట్టుటకు లేచినది ఎవరు?",
    "options": [
      "The family heads of Judah and Benjamin, priests, and Levites whose hearts God had moved",
      "Only Roman mercenaries",
      "Foreign builders from Tyre only",
      "No families returned"
    ],
    "optionsTelugu": [
      "దేవుడు ఎవరి మనస్సును రేపెనో ఆ యూదా బెన్యామీను కుటుంబ పెద్దలు, యాజకులు, లేవీయులు",
      "రోమా సైనికులు మాత్రమే",
      "తూరు దేశపు కూలీలు మాత్రమే",
      "ఎవరూ రాలేదు"
    ],
    "correctAnswer": "The family heads of Judah and Benjamin, priests, and Levites whose hearts God had moved",
    "bibleReference": "Ezra 1:5",
    "explanation": "God stirred the family leaders to return and rebuild the house of the Lord in Jerusalem.",
    "explanationTelugu": "దేవుని ప్రేరణ పొందిన పితరుల కుటుంబ పెద్దలందరు యెరూషలేమునకు ప్రయాణమైరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "What protective priestly intercession did Job perform early in the morning for each of his children?",
    "questionTelugu": "యోబు ప్రతి ఉదయమున తన కుమారుల కుమార్తెల కొరకు ఏమి చేయువాడు?",
    "options": [
      "Offered a burnt offering for each of them lest they had sinned in their hearts",
      "Wrote down their financial debts",
      "Counted their camel herds",
      "Reprimanded them before the elders"
    ],
    "optionsTelugu": [
      "వారు హృదయములో పాపము చేసారేమోనని వారి సంఖ్య చొప్పున దహనబలులను అర్పించుచుండెను",
      "వారి అప్పులను లెక్కపెట్టెను",
      "ఒంటెలను లెక్కించెను",
      "పెద్దల యెదుట తిట్టెను"
    ],
    "correctAnswer": "Offered a burnt offering for each of them lest they had sinned in their hearts",
    "bibleReference": "Job 1:5",
    "explanation": "Job thought: \"Perhaps my children have sinned and cursed God in their hearts.\" This was his regular custom.",
    "explanationTelugu": "యోబు నిత్యము ఉదయమున లేచి తన పిల్లలందరి నిమిత్తము బలులను అర్పించి ప్రార్థించువాడు.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "What warning does Proverbs 11:29 give to anyone who mistreats or brings trouble on their own family?",
    "questionTelugu": "సామెతలు 11:29 లో తన స్వంత యింటిని బాధపరచువానికి ఏమి ప్రాప్తించునని చెప్పబడెను?",
    "options": [
      "Whoever brings ruin on their family will inherit only wind",
      "He will become exceedingly rich",
      "He will be crowned as judge",
      "He will conquer cities"
    ],
    "optionsTelugu": [
      "తన యింటిని బాధపరచువాడు గాలిని స్వాస్థ్యముగా పొందును",
      "మిక్కిలి ధనవంతుడగును",
      "న్యాయాధిపతిగా నియమింపబడును",
      "పట్టణాలను జయించును"
    ],
    "correctAnswer": "Whoever brings ruin on their family will inherit only wind",
    "bibleReference": "Proverbs 11:29",
    "explanation": "\"Whoever brings ruin on their family will inherit only wind, and the fool will be servant to the wise.\"",
    "explanationTelugu": "\"తన యింటిని బాధపరచువాడు గాలిని స్వాస్థ్యముగా పొందును, మూఢుడు జ్ఞానహృదయునికి దాసుడగును.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "What special inheritance blessing did faithful Caleb grant to his daughter Achsah in Joshua 15?",
    "questionTelugu": "యెహోషువ 15 లో విశ్వాసపాత్రుడైన కాలేబు తన కుమార్తె అక్సా అడిగినప్పుడు ఏమి ఇచ్చెను?",
    "options": [
      "Gave her the upper and lower springs of water in addition to the Southland",
      "A golden chariot and royal crown",
      "Ten cities in Samaria",
      "Silver vessels from Egypt"
    ],
    "optionsTelugu": [
      "దక్షిణభూమితో పాటు పై ఊటలను క్రింది ఊటలను ఇచ్చెను",
      "బంగారు రథము కిరీటము",
      "సమరయలోని పది పట్టణములు",
      "ఐగుప్తు వెండి పాత్రలు"
    ],
    "correctAnswer": "Gave her the upper and lower springs of water in addition to the Southland",
    "bibleReference": "Joshua 15:18-19",
    "explanation": "Achsah asked her father for springs of water, and Caleb generously gave her both upper and lower springs.",
    "explanationTelugu": "అక్సా: \"నాకు దీవెన దయచేయుము, నాకు నీటి ఊటలను ఇమ్ము\" అని అడుగగా కాలేబు ఊటలను ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which two nations traced their origins back to the sons born to Lot’s daughters after fleeing Sodom?",
    "questionTelugu": "సొదొమ నుండి తప్పించుకున్న తరువాత లోతు కుమార్తెలకు పుట్టిన కుమారుల నుండి వచ్చిన రెండు జాతులు ఏవి?",
    "options": [
      "Moabites and Ammonites",
      "Edomites and Midianites",
      "Philistines and Amalekites",
      "Assyrians and Babylonians"
    ],
    "optionsTelugu": [
      "మోయాబీయులు మరియు అమ్మోనీయులు",
      "ఎదోమీయులు మరియు మిద్యానీయులు",
      "ఫిలిష్తీయులు మరియు అమాలేకీయులు",
      "అష్షూరీయులు మరియు బబులోనీయులు"
    ],
    "correctAnswer": "Moabites and Ammonites",
    "bibleReference": "Genesis 19:36-38",
    "explanation": "The older daughter named her son Moab (father of Moabites) and the younger Ben-Ammi (Ammonites).",
    "explanationTelugu": "పెద్ద కుమార్తె కుమారునికి మోయాబు అనియు, చిన్న కుమార్తె కుమారునికి బెనమ్మీ అనియు పేరు పెట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which brother took distressed sister Tamar into his household to care for her after Amnon disgraced her?",
    "questionTelugu": "అమ్నోను అవమానించిన తరువాత దుఃఖితురాలైన సహోదరి తామారును తన యింట చేర్చుకొని ఆదరించిన అన్న ఎవరు?",
    "options": [
      "Absalom",
      "Solomon",
      "Adonijah",
      "Shephatiah"
    ],
    "optionsTelugu": [
      "అబ్షాలోము",
      "సొలొమోను",
      "అదోనీయా",
      "షెఫట్యా"
    ],
    "correctAnswer": "Absalom",
    "bibleReference": "2 Samuel 13:20",
    "explanation": "Absalom told her: \"Be quiet for now, my sister.\" So Tamar lived in her brother Absalom’s house.",
    "explanationTelugu": "అబ్షాలోము: \"చెల్లెలా, ఊరకుండుము\" అని చెప్పి ఆమెను తన యింట ఉంచుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "At what young age did King Josiah begin seeking the God of his forefather David while still a boy?",
    "questionTelugu": "యోషీయా రాజు యౌవనములో ఎన్నవ ఏట తన పితరుడైన దావీదు దేవుని వెదకనారంభించెను?",
    "options": [
      "At sixteen years old (eighth year of his reign)",
      "At forty years old",
      "At thirty years old",
      "At fifty years old"
    ],
    "optionsTelugu": [
      "పదహారవ ఏట (తన రాజ్యపరిపాలన ఎనిమిదవ ఏట)",
      "నలభై ఏళ్ల వయస్సులో",
      "ముప్పై ఏళ్ల వయస్సులో",
      "యాభై ఏళ్ల వయస్సులో"
    ],
    "correctAnswer": "At sixteen years old (eighth year of his reign)",
    "bibleReference": "2 Chronicles 34:3",
    "explanation": "In the eighth year of his reign, while he was still young, he began to seek the God of his ancestor David.",
    "explanationTelugu": "యోషీయా బాలుడై యుండగానే తన పితరుడైన దావీదు దేవుని చిత్తమును వెదకుటకు ఆరంభించెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "Why was Noah’s entire family spared when judgment fell on the ancient world in Genesis 7:1?",
    "questionTelugu": "ఆదికాండము 7:1 ప్రకారం, పురాతన లోకముపై తీర్పు వచ్చినప్పుడు నోవహు కుటుంబమంతా ఎందుకు తప్పింపబడెను?",
    "options": [
      "Because God found Noah righteous in his generation before Him",
      "Because they had paid tribute money",
      "Because the ark was made of iron",
      "Because they were related to kings"
    ],
    "optionsTelugu": [
      "ఈ తరము వారిలో నోవహు ఒక్కడే దేవుని యెదుట నీతిమంతుడుగా కనబడినందున",
      "డబ్బు చెల్లించినందున",
      "ఓడ ఇనుముతో చేయబడినందున",
      "రాజుల బంధువులైనందున"
    ],
    "correctAnswer": "Because God found Noah righteous in his generation before Him",
    "bibleReference": "Genesis 7:1",
    "explanation": "The Lord said to Noah: \"Go into the ark, you and your whole family, because I have found you righteous.\"",
    "explanationTelugu": "యెహోవా నోవహుతో: \"ఈ తరము వారిలో నీవే నా యెదుట నీతిమంతుడవుగా ఉండుట చూచితిని, కాబట్టి నీ యింటివారందరు ఓడలో ప్రవేశించుడి\" అనెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which high imperial household contained Christian believers who sent greetings to the church in Philippi?",
    "questionTelugu": "ఫిలిప్పీ సంఘమునకు ప్రత్యేకముగా వందనములు తెలియజేసిన క్రైస్తవ విశ్వాసులు ఏ రాజభవనపు కుటుంబములోనివారు?",
    "options": [
      "Caesar’s household",
      "Pharaoh’s household",
      "Nebuchadnezzar’s court",
      "Herod’s household"
    ],
    "optionsTelugu": [
      "కైసరు ఇంటివారు",
      "ఫరో ఇంటివారు",
      "నెబుకద్నెజరు ఆస్థానము",
      "హేరోదు ఇంటివారు"
    ],
    "correctAnswer": "Caesar’s household",
    "bibleReference": "Philippians 4:22",
    "explanation": "\"All God’s people here send you greetings, especially those who belong to Caesar’s household.\"",
    "explanationTelugu": "\"పరిశుద్ధులందరును, విశేషముగా కైసరు ఇంటివారిలో ఉన్నవారును మీకు వందనములు చెప్పుచున్నారు.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "What special priority for doing good is commanded in Galatians 6:10?",
    "questionTelugu": "గలతీయులకు 6:10 లో మేలు చేయుటలో ఏ కుటుంబమునకు మొదటి ప్రాధాన్యత ఇవ్వాలని చెప్పబడెను?",
    "options": [
      "Especially to those who belong to the family of believers / faith",
      "Only to foreign dignitaries",
      "Only to people of royal blood",
      "To those who pay high interest"
    ],
    "optionsTelugu": [
      "విశేషముగా విశ్వాసగృహమునకు చేరినవారికి",
      "విదేశీ అధికారులకు మాత్రమే",
      "రాజవంశీకులకు మాత్రమే",
      "వడ్డీ కట్టేవారికి మాత్రమే"
    ],
    "correctAnswer": "Especially to those who belong to the family of believers / faith",
    "bibleReference": "Galatians 6:10",
    "explanation": "\"Therefore, as we have opportunity, let us do good to all people, especially to those who belong to the family of believers.\"",
    "explanationTelugu": "\"కాబట్టి మనకు సమయము దొరికినకొలది అందరియెడలను, విశేషముగా విశ్వాసగృహమునకు చేరినవారియెడలను మేలు చేయుదము.\"",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "How did the estranged twin brothers Jacob and Esau reunite after twenty years of separation?",
    "questionTelugu": "ఇరవై సంవత్సరాల ఎడబాటు తరువాత అన్నదమ్ములైన యాకోబు ఏశావులు ఎలా కలుసుకునిరి?",
    "options": [
      "Esau ran to meet Jacob, embraced him, fell on his neck and kissed him, and they wept",
      "They fought with swords until nightfall",
      "Esau refused to see Jacob",
      "They divided the land with iron chains"
    ],
    "optionsTelugu": [
      "ఏశావు పరుగెత్తుకొని వచ్చి అతనిని కౌగిలించుకొని మెడపై పడి ముద్దుపెట్టుకొనెను, ఇద్దరును ఏడ్చిరి",
      "కత్తులతో యుద్ధము చేసిరి",
      "ఏశావు చూడటానికి నిరాకరించెను",
      "ఇనుప గొలుసులతో సరిహద్దులు వేసిరి"
    ],
    "correctAnswer": "Esau ran to meet Jacob, embraced him, fell on his neck and kissed him, and they wept",
    "bibleReference": "Genesis 33:4",
    "explanation": "God answered Jacob’s prayers and granted total brotherly reconciliation and tears of joy.",
    "explanationTelugu": "దేవుడు యాకోబు ప్రార్థనను విని వారి మధ్య సంపూర్ణ సమాధానమును మరియు సంతోషభాష్పములను దయచేసెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "What timeless threefold priestly blessing was commanded to be put upon the children of Israel in Numbers 6?",
    "questionTelugu": "సంఖ్యాకాండము 6 లో ఇశ్రాయేలు పిల్లలపై ఉంచవలసిన శాశ్వతమైన యాజక ఆశీర్వాదము ఏది?",
    "options": [
      "\"The Lord bless you and keep you; make His face shine upon you and give you peace\"",
      "\"The Lord make you kings of Egypt\"",
      "\"The Lord grant you silver and iron\"",
      "\"The Lord destroy all foreign cities\""
    ],
    "optionsTelugu": [
      "\"యెహోవా నిన్ను ఆశీర్వదించి నిన్ను కాపాడును గాక; యెహోవా నీకు సమాధానము కలుగజేయును గాక\"",
      "\"ఐగుప్తు రాజులుగా చేయును గాక\"",
      "\"వెండిని ఇనుమును ఇచ్చును గాక\"",
      "\"పట్టణాలను నాశనము చేయును గాక\""
    ],
    "correctAnswer": "\"The Lord bless you and keep you; make His face shine upon you and give you peace\"",
    "bibleReference": "Numbers 6:24-26",
    "explanation": "Aaron and his sons placed God’s name upon the families of Israel with this blessing.",
    "explanationTelugu": "ఈ ఆశీర్వాదము ద్వారా దేవుడు తన నామమును ఇశ్రాయేలు కుటుంబాలపై ఉంచెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "How is the Holy City, the New Jerusalem, described in Revelation 21:2?",
    "questionTelugu": "ప్రకటన 21:2 లో నూతన యెరూషలేము ఏ కుటుంబ రూపములో అలంకరింపబడినట్లు కనబడెను?",
    "options": [
      "Prepared as a bride beautifully adorned for her husband",
      "Built as an empty fortress",
      "Designed as a Roman senate",
      "Formed as an army battalion"
    ],
    "optionsTelugu": [
      "తన భర్తకొరకు అలంకరింపబడిన పెండ్లికుమార్తెవలె సిద్ధపడియుండెను",
      "శూన్యమైన కోటవలె",
      "రోమా న్యాయసభవలె",
      "సైనిక దళమువలె"
    ],
    "correctAnswer": "Prepared as a bride beautifully adorned for her husband",
    "bibleReference": "Revelation 21:2",
    "explanation": "The ultimate destiny of God’s redeemed people is portrayed in marriage imagery with the Lamb.",
    "explanationTelugu": "గొఱ్ఱెపిల్లయైన క్రీస్తుతో నిత్య సమాగమము వివాహ పెండ్లికుమార్తె సాదృశ్యములో వర్ణించబడెను.",
    "marks": 1
  },
  {
    "id": "fam_e_s3_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "To whom does the apostle Paul bow his knees in prayer in Ephesians 3:14-15?",
    "questionTelugu": "ఎఫెసీయులకు 3:14-15 లో అపొస్తలుడైన పౌలు మోకాళ్లూని ప్రార్థించిన తండ్రిని గూర్చి ఏమి చెప్పెను?",
    "options": [
      "The Father, from whom every family in heaven and on earth derives its name",
      "The earthly emperor in Rome",
      "The high priest in Jerusalem",
      "The elders of Ephesus"
    ],
    "optionsTelugu": [
      "పరలోకమందును భూమిమీదను ఉన్న ప్రతి కుటుంబము ఏ తండ్రినిబట్టి కుటుంబమని పిలువబడుచున్నదో ఆ తండ్రి యెదుట",
      "రోమా చక్రవర్తి యెదుట",
      "యెరూషలేము ప్రధాన యాజకుని యెదుట",
      "ఎఫెసు పెద్దల యెదుట"
    ],
    "correctAnswer": "The Father, from whom every family in heaven and on earth derives its name",
    "bibleReference": "Ephesians 3:14-15",
    "explanation": "God the Father is the ultimate source and design of every family in heaven and on earth.",
    "explanationTelugu": "పరలోకములోను భూమిమీదను ఉన్న సమస్త కుటుంబములకు మూలకర్తయైన పరమ తండ్రి యెదుట పౌలు మోకరించెను.",
    "marks": 1
  }
];

export const FAMILY_MEDIUM_FOUNDATION: QuizQuestion[] = [
  {
    "id": "fam_m_s1_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "How old was Adam when his son Seth was born in Genesis 5:3?",
    "questionTelugu": "ఆదికాండము 5:3 లో కుమారుడైన షేతు పుట్టినప్పుడు ఆదాము వయస్సు ఎంత?",
    "options": [
      "130 years old",
      "100 years old",
      "70 years old",
      "200 years old"
    ],
    "optionsTelugu": [
      "130 సంవత్సరాలు",
      "100 సంవత్సరాలు",
      "70 సంవత్సరాలు",
      "200 సంవత్సరాలు"
    ],
    "correctAnswer": "130 years old",
    "bibleReference": "Genesis 5:3",
    "explanation": "Adam lived 130 years and had a son in his own likeness, and named him Seth.",
    "explanationTelugu": "ఆదాము 130 యేండ్లు బ్రదికి తన పోలిక చొప్పున కుమారుని కని అతనికి షేతు అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which ancestral cave did Abraham purchase from Ephron the Hittite to bury Sarah?",
    "questionTelugu": "తన భార్య శారాను సమాధి చేయుటకు అబ్రాహాము ఎఫ్రోను అను హిత్తీయుని నుండి కొన్న గుహ ఏది?",
    "options": [
      "Cave of Machpelah",
      "Cave of Adullam",
      "Cave of Makkedah",
      "Cave of En Gedi"
    ],
    "optionsTelugu": [
      "మక్పేలా గుహ",
      "అదుల్లాము గుహ",
      "మక్కేదా గుహ",
      "ఏన్గెదీ గుహ"
    ],
    "correctAnswer": "Cave of Machpelah",
    "bibleReference": "Genesis 23:9, 19",
    "explanation": "Abraham bought the field of Machpelah near Mamre (Hebron) for 400 shekels of silver as a family burial site.",
    "explanationTelugu": "అబ్రాహాము కుటుంబ సమాధి కొరకు మమ్రే యెదుటనున్న మక్పేలా భూమిని 400 తులముల వెండికి కొనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "Whom did childless Abraham consider his heir before Isaac was promised by God?",
    "questionTelugu": "ఇస్సాకు వాగ్దానము రాకముందు సంతానము లేని అబ్రాహాము తన ఆస్తికి వారసుడగునని భావించిన దాసుడు ఎవరు?",
    "options": [
      "Eliezer of Damascus",
      "Ishmael",
      "Lot",
      "Abimelech"
    ],
    "optionsTelugu": [
      "దమస్కు వాడైన ఎలీయెజెరు",
      "ఇష్మాయేలు",
      "లోతు",
      "అబీమెలెకు"
    ],
    "correctAnswer": "Eliezer of Damascus",
    "bibleReference": "Genesis 15:2",
    "explanation": "Abram said: \"Sovereign Lord, what can You give me since I remain childless and the one who will inherit my estate is Eliezer of Damascus?\"",
    "explanationTelugu": "అబ్రాము: \"ప్రభువైన యెహోవా, నా యింటి దాసుడైన ఈ దమస్కు ఎలీయెజెరు నా ఆస్తికి కర్తయగును గదా\" అని పలికెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "Who became Abraham’s wife after Sarah passed away, bearing him six sons?",
    "questionTelugu": "శారా మరణించిన తరువాత అబ్రాహామును వివాహమాడి ఆరుగురు కుమారులను కనిన స్త్రీ ఎవరు?",
    "options": [
      "Keturah",
      "Hagar",
      "Bilhah",
      "Zilpah"
    ],
    "optionsTelugu": [
      "కెతూరా",
      "హాగరు",
      "బిల్హా",
      "జిల్పా"
    ],
    "correctAnswer": "Keturah",
    "bibleReference": "Genesis 25:1-2",
    "explanation": "Abraham took another wife, whose name was Keturah, who bore Zimran, Jokshan, Medan, Midian, Ishbak, and Shuah.",
    "explanationTelugu": "అబ్రాహాము కెతూరా అను మరియొక భార్యను చేసుకొనెను; ఆమె ఆరుగురు కుమారులను కనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "How long did Isaac pray to the Lord for his barren wife Rebekah before she conceived twins?",
    "questionTelugu": "తన భార్య రిబ్కా గొడ్రాలై యుండగా ఇస్సాకు యెహోవాను వేడుకొని ఎంతకాలము కనిపెట్టెను?",
    "options": [
      "Twenty years",
      "Seven years",
      "Forty years",
      "Ten years"
    ],
    "optionsTelugu": [
      "ఇరవై సంవత్సరాలు",
      "ఏడు సంవత్సరాలు",
      "నలభై సంవత్సరాలు",
      "పది సంవత్సరాలు"
    ],
    "correctAnswer": "Twenty years",
    "bibleReference": "Genesis 25:20-26",
    "explanation": "Isaac was 40 when he married Rebekah and 60 when the twins were born, praying 20 years.",
    "explanationTelugu": "ఇస్సాకు వివాహమప్పుడు 40 ఏళ్లు, పిల్లలు పుట్టినప్పుడు 60 ఏళ్లు; 20 ఏళ్లు ప్రార్థన చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "What divine oracle was spoken to pregnant Rebekah concerning the struggle in her womb?",
    "questionTelugu": "తన గర్భములో పోరాడుచున్న పిల్లల విషయములో రిబ్కాకు దేవుడు ఇచ్చిన ప్రత్యుత్తరము ఏమిటి?",
    "options": [
      "\"Two nations are in your womb; the older will serve the younger\"",
      "\"You will bear three kings of the east\"",
      "\"Your sons will build the temple in Salem\"",
      "\"They will never be separated\""
    ],
    "optionsTelugu": [
      "\"రెండు జనములు నీ గర్భములో నున్నవి; పెద్దవాడు చిన్నవానికి దాసుడగును\"",
      "\"తూర్పు దేశపు ముగ్గురు రాజులను కందువు\"",
      "\"వారు మందిరమును నిర్మింతురు\"",
      "\"వారు ఎన్నడూ విడిపోరు\""
    ],
    "correctAnswer": "\"Two nations are in your womb; the older will serve the younger\"",
    "bibleReference": "Genesis 25:23",
    "explanation": "The Lord revealed that two peoples would be separated from her body, and the elder would serve the younger.",
    "explanationTelugu": "యెహోవా: \"రెండు జనములు నీ గర్భమందు కలవు, పెద్దవాడు చిన్నవానికి దాసుడగును\" అని సెలవిచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which Hittite wives did forty-year-old Esau marry that were a grief of mind to Isaac and Rebekah?",
    "questionTelugu": "నలభై ఏళ్ల ఏశావు వివాహమాడి తల్లిదండ్రులైన ఇస్సాకు రిబ్కాలకు మనోవేదన కలిగించిన హిత్తీయుల కుమార్తెలు ఎవరు?",
    "options": [
      "Judith and Basemath",
      "Adah and Zillah",
      "Rachel and Leah",
      "Orpah and Ruth"
    ],
    "optionsTelugu": [
      "యెహూదీతు మరియు బాశెమతు",
      "ఆదా మరియు సిల్లా",
      "రాహేలు మరియు లేయా",
      "ఓర్పా మరియు రూతు"
    ],
    "correctAnswer": "Judith and Basemath",
    "bibleReference": "Genesis 26:34-35",
    "explanation": "When Esau was forty, he married Judith daughter of Beeri the Hittite and Basemath, which brought bitterness to his parents.",
    "explanationTelugu": "ఏశావు హిత్తీయుల కుమార్తెలను పెండ్లిచేసికొని ఇస్సాకునకును రిబ్కాకును మనోవేదన కలుగజేసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "To which ancestral city in Paddan Aram did Rebekah urge Jacob to flee from Esau’s deadly wrath?",
    "questionTelugu": "ఏశావు కోపము చల్లారువరకు తన సహోదరుడైన లాబాను యొద్దకు పారిపొమ్మని రిబ్కా యాకోబును పంపిన పట్టణము ఏది?",
    "options": [
      "Haran",
      "Ur of the Chaldees",
      "Shechem",
      "Damascus"
    ],
    "optionsTelugu": [
      "హారాను",
      "కల్దీయుల ఊరు",
      "షెకెము",
      "దమస్కు"
    ],
    "correctAnswer": "Haran",
    "bibleReference": "Genesis 27:43",
    "explanation": "Rebekah said: \"Flee at once to my brother Laban in Haran until your brother’s fury subsides.\"",
    "explanationTelugu": "రిబ్కా: \"నీవు లేచి హారానులోనున్న నా సహోదరుడైన లాబాను యొద్దకు పారిపొమ్ము\" అని చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "What covenant place did Jacob name Bethel (\"House of God\") after dreaming of the stairway to heaven?",
    "questionTelugu": "పరలోకపు నిచ్చెన దర్శనము తరువాత యాకోబు బేతేలు (దేవుని ఇల్లు) అని పేరు పెట్టిన ఆ స్థలము యొక్క పూర్వ నామమేమిటి?",
    "options": [
      "Luz",
      "Salem",
      "Hebron",
      "Beersheba"
    ],
    "optionsTelugu": [
      "లూజు",
      "షాలేము",
      "హెబ్రోను",
      "బేయేర్షెబా"
    ],
    "correctAnswer": "Luz",
    "bibleReference": "Genesis 28:19",
    "explanation": "Jacob called the name of that place Bethel, though the city used to be called Luz.",
    "explanationTelugu": "యాకోబు ఆ స్థలమునకు బేతేలు అని పేరు పెట్టెను; మొదట ఆ ఊరి పేరు లూజు.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "What gallant deed did Jacob perform at the well when he first met his cousin Rachel?",
    "questionTelugu": "బావి యొద్ద రాహేలును మొదటిసారి చూచినప్పుడు యాకోబు చేసిన సాహసోపేతమైన పని ఏమిటి?",
    "options": [
      "Rolled the heavy stone from the well mouth to water her sheep",
      "Fought off desert bandits",
      "Dug a new spring of water",
      "Built an altar of ten stones"
    ],
    "optionsTelugu": [
      "బావి మూతపైనున్న పెద్ద రాయిని దొర్లించి ఆమె గొర్రెలకు నీరు పెట్టెను",
      "దొంగలతో పోరాడెను",
      "క్రొత్త బావిని తవ్వెను",
      "బలిపీఠమును కట్టెను"
    ],
    "correctAnswer": "Rolled the heavy stone from the well mouth to water her sheep",
    "bibleReference": "Genesis 29:10",
    "explanation": "Jacob rolled the stone away from the mouth of the well single-handedly and watered the flock of his uncle Laban.",
    "explanationTelugu": "యాకోబు బావి మూతమీది రాయిని దొర్లించి తన మేనమామ గొర్రెలకు నీరు తాగించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which maidservants were given by Laban to his daughters Leah and Rachel as wedding gifts?",
    "questionTelugu": "లాబాను తన కుమార్తెలైన లేయా మరియు రాహేలులకు దాసీలుగా ఇచ్చిన స్త్రీలు ఎవరు?",
    "options": [
      "Zilpah to Leah, and Bilhah to Rachel",
      "Hagar and Keturah",
      "Bilhah to Leah, and Zilpah to Rachel",
      "Puah and Shiphrah"
    ],
    "optionsTelugu": [
      "లేయాకు జిల్పాను, రాహేలుకు బిల్హాను",
      "హాగరు మరియు కెతూరా",
      "లేయాకు బిల్హాను, రాహేలుకు జిల్పాను",
      "పూవా మరియు షిఫ్రా"
    ],
    "correctAnswer": "Zilpah to Leah, and Bilhah to Rachel",
    "bibleReference": "Genesis 29:24, 29",
    "explanation": "Laban gave his maidservant Zilpah to Leah, and Bilhah to his daughter Rachel as her maidservant.",
    "explanationTelugu": "లాబాను లేయాకు దాసిగా జిల్పాను, రాహేలుకు దాసిగా బిల్హాను ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which two sons of Jacob were born to Rachel’s maidservant Bilhah?",
    "questionTelugu": "రాహేలు దాసియైన బిల్హా ద్వారా యాకోబుకు జన్మించిన ఇద్దరు కుమారులు ఎవరు?",
    "options": [
      "Dan and Naphtali",
      "Gad and Asher",
      "Issachar and Zebulun",
      "Ephraim and Manasseh"
    ],
    "optionsTelugu": [
      "దాను మరియు నఫ్తాలి",
      "గాదు మరియు ఆషేరు",
      "ఇశ్శాఖారు మరియు జెబూలూను",
      "ఎఫ్రాయిము మరియు మనష్షే"
    ],
    "correctAnswer": "Dan and Naphtali",
    "bibleReference": "Genesis 30:4-8",
    "explanation": "Rachel gave her servant Bilhah to Jacob, and she bore Dan and Naphtali.",
    "explanationTelugu": "బిల్హా గర్భవతియై యాకోబునకు దానును నఫ్తాలిని కనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "What exclamation of joy did Leah make when naming Zilpah’s second son Asher in Genesis 30:13?",
    "questionTelugu": "ఆదికాండము 30:13 లో జిల్పా రెండవ కుమారుడైన ఆషేరు పుట్టినప్పుడు లేయా పలికిన సంతోషపు మాట ఏమిటి?",
    "options": [
      "\"How happy I am! The women will call me blessed\"",
      "\"God has judged me\"",
      "\"Now my husband will live with me\"",
      "\"A band of raiders is coming\""
    ],
    "optionsTelugu": [
      "\"నేను ధన్యురాలను, స్త్రీలు నన్ను ధన్యురాలందురు\"",
      "\"దేవుడు నాకు న్యాయము తీర్చెను\"",
      "\"ఇక నా భర్త నాతో కాపురము చేయును\"",
      "\"దండు వచ్చుచున్నది\""
    ],
    "correctAnswer": "\"How happy I am! The women will call me blessed\"",
    "bibleReference": "Genesis 30:13",
    "explanation": "Leah named him Asher (\"happy/blessed\") declaring: \"How happy I am! Women will call me blessed.\"",
    "explanationTelugu": "లేయా: \"నేను ధన్యురాలను, స్త్రీలు నన్ను ధన్యురాలందురు\" అని చెప్పి అతనికి ఆషేరు అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "What plant did Reuben bring in from the field during wheat harvest that Rachel asked for?",
    "questionTelugu": "గోధుమల కోత కాలములో రూబేను పొలములో కనిపెట్టి రాహేలు కోరిన మొక్క ఏది?",
    "options": [
      "Mandrakes (love apples)",
      "Bitter herbs",
      "Pomegranate blossoms",
      "Frankincense flowers"
    ],
    "optionsTelugu": [
      "దూదాయీలు (మంచి సువాసనగల పండ్లు)",
      "చేదుకూరలు",
      "దానిమ్మ పువ్వులు",
      "సాంబ్రాణి మొక్కలు"
    ],
    "correctAnswer": "Mandrakes (love apples)",
    "bibleReference": "Genesis 30:14",
    "explanation": "Reuben found mandrakes in the field and brought them to his mother Leah, which Rachel bargained for.",
    "explanationTelugu": "రూబేను పొలములో దూదాయీలను కనుగొని తన తల్లి లేయా యొద్దకు తెచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which fifth and sixth sons did Leah bear to Jacob after the mandrake incident?",
    "questionTelugu": "దూదాయీల సంఘటన తరువాత లేయా యాకోబునకు కనిన ఐదవ మరియు ఆరవ కుమారులు ఎవరు?",
    "options": [
      "Issachar and Zebulun",
      "Joseph and Benjamin",
      "Gad and Asher",
      "Dan and Naphtali"
    ],
    "optionsTelugu": [
      "ఇశ్శాఖారు మరియు జెబూలూను",
      "యోసేపు మరియు బెన్యామీను",
      "గాదు మరియు ఆషేరు",
      "దాను మరియు నఫ్తాలి"
    ],
    "correctAnswer": "Issachar and Zebulun",
    "bibleReference": "Genesis 30:17-20",
    "explanation": "God listened to Leah, and she bore Issachar (\"reward\") and then Zebulun (\"honor\").",
    "explanationTelugu": "దేవుడు లేయా మొర వినినందున ఆమె ఇశ్శాఖారును జెబూలూనును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "Where did Rachel conceal her father Laban’s stolen household idols (teraphim)?",
    "questionTelugu": "తన తండ్రి లాబాను యొక్క గృహదేవతల విగ్రహములను రాహేలు ఎక్కడ దాచెను?",
    "options": [
      "Inside her camel’s saddle bag and sat on it",
      "In a water cistern",
      "Buried under a pomegranate tree",
      "Inside an earthen grain jar"
    ],
    "optionsTelugu": [
      "ఒంటె జీను సంచిలో పెట్టి దానిమీద కూర్చుండెను",
      "నీటి తొట్టిలో",
      "దానిమ్మ చెట్టు క్రింద",
      "ధాన్యపు కుండలో"
    ],
    "correctAnswer": "Inside her camel’s saddle bag and sat on it",
    "bibleReference": "Genesis 31:34",
    "explanation": "Rachel had taken the household gods, put them in her camel’s saddle, and was sitting on them when Laban searched.",
    "explanationTelugu": "రాహేలు ఆ విగ్రహములను ఒంటె జీనులో దాచి దానిమీద కూర్చుండినందున లాబానుకు దొరకలేదు.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "How many total livestock animals did Jacob send in spaced droves as gifts to pacify Esau?",
    "questionTelugu": "ఏశావు మనస్సును శాంతింపజేయుటకు యాకోబు బహుమానముగా వరుసలుగా పంపిన మొత్తం పశువుల సంఖ్య సుమారు ఎంత?",
    "options": [
      "550 animals (goats, sheep, camels, cattle, donkeys)",
      "100 sheep only",
      "1,000 horses",
      "70 oxen only"
    ],
    "optionsTelugu": [
      "550 పశువులు (మేకలు, గొర్రెలు, ఒంటెలు, ఆవులు, గాడిదలు)",
      "100 గొర్రెలు మాత్రమే",
      "1,000 గుర్రాలు",
      "70 ఎద్దులు మాత్రమే"
    ],
    "correctAnswer": "550 animals (goats, sheep, camels, cattle, donkeys)",
    "bibleReference": "Genesis 32:13-15",
    "explanation": "Jacob sent 200 she-goats, 20 he-goats, 200 ewes, 20 rams, 30 camels with colts, 40 cows, 10 bulls, 20 female donkeys, 10 foals.",
    "explanationTelugu": "యాకోబు ఏశావు కొరకు మేకలు, గొర్రెలు, ఒంటెలు, ఆవులు, గాడిదలతో కూడిన 550 పశువుల బహుమానమును పంపెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "What new covenant name was bestowed upon Jacob at Peniel after wrestling with God until daybreak?",
    "questionTelugu": "తెల్లవారుజాము వరకు దేవునితో పోరాడిన తరువాత పెనూయేలు వద్ద యాకోబునకు ఇవ్వబడిన క్రొత్త నిబంధన పేరు ఏమిటి?",
    "options": [
      "Israel (\"he struggles with God\")",
      "Jeshurun",
      "Melchizedek",
      "Ephraim"
    ],
    "optionsTelugu": [
      "ఇశ్రాయేలు (దేవునితోను మనుష్యులతోను పోరాడి జయించినవాడు)",
      "యెషూరును",
      "మెల్కీసెదెకు",
      "ఎఫ్రాయిము"
    ],
    "correctAnswer": "Israel (\"he struggles with God\")",
    "bibleReference": "Genesis 32:28",
    "explanation": "\"Your name will no longer be Jacob, but Israel, because you have struggled with God and with humans and have overcome.\"",
    "explanationTelugu": "\"నీవు దేవునితోను మనుష్యులతోను పోరాడి జయించితివి గనుక ఇకమీదట నీ పేరు ఇశ్రాయేలనబడును.\"",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which two zealous sons of Jacob attacked the city of Shechem to avenge their disgraced sister Dinah?",
    "questionTelugu": "తమ సహోదరియైన దీనాను అవమానించినందుకు ప్రతీకారముగా షెకెము పట్టణముపై పడి దాడిచేసిన యాకోబు కుమారులు ఎవరు?",
    "options": [
      "Simeon and Levi",
      "Reuben and Judah",
      "Dan and Naphtali",
      "Issachar and Zebulun"
    ],
    "optionsTelugu": [
      "షిమ్యోను మరియు లేవి",
      "రూబేను మరియు యూదా",
      "దాను మరియు నఫ్తాలి",
      "ఇశ్శాఖారు మరియు జెబూలూను"
    ],
    "correctAnswer": "Simeon and Levi",
    "bibleReference": "Genesis 34:25",
    "explanation": "Simeon and Levi, Dinah’s full brothers, took their swords and attacked the city while the men were recovering.",
    "explanationTelugu": "దీనా సహోదరులైన షిమ్యోను లేవులు కత్తులు దూసి పట్టణములోని పురుషులందరినీ హతము చేసిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "Under what notable tree below Bethel was Deborah, Rebekah’s beloved family nurse, buried?",
    "questionTelugu": "బేతేలు క్రిందనున్న ఏ చెట్టు కింద రిబ్కా యొక్క దాదియైన దెబోరా సమాధి చేయబడెను?",
    "options": [
      "Allon-Bakuth (\"Oak of Weeping\")",
      "The Great Terebinth of Mamre",
      "The Broom Tree of Beersheba",
      "The Cedar of Lebanon"
    ],
    "optionsTelugu": [
      "అల్లోన్ బాగూతు (రోదన సింధూర వృక్షము)",
      "మమ్రే యొక్క సింధూర వృక్షము",
      "బేయేర్షెబా బదరీ వృక్షము",
      "లెబానోను దేవదారు వృక్షము"
    ],
    "correctAnswer": "Allon-Bakuth (\"Oak of Weeping\")",
    "bibleReference": "Genesis 35:8",
    "explanation": "Deborah, Rebekah’s nurse, died and was buried under the oak below Bethel, named Allon-Bakuth (\"Oak of Weeping\").",
    "explanationTelugu": "రిబ్కా దాదియైన దెబోరా చనిపోగా బేతేలు క్రింద సింధూర వృక్షము క్రింద సమాధి చేసి ఆ చెట్టుకు అల్లోన్ బాగూతు అని పేరు పెట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "What sorrowful name did dying Rachel give to newborn Benjamin before her husband changed it?",
    "questionTelugu": "మరణావస్థలో ఉన్న రాహేలు తన చిన్న కుమారునికి పెట్టిన దుఃఖపు పేరు ఏమిటి?",
    "options": [
      "Ben-Oni (\"Son of my sorrow\")",
      "Ichabod",
      "Jabez",
      "Gershom"
    ],
    "optionsTelugu": [
      "బెనోనీ (నా దుఃఖపు కుమారుడు)",
      "ఈకాబోదు",
      "యాబేజు",
      "గేర్షోము"
    ],
    "correctAnswer": "Ben-Oni (\"Son of my sorrow\")",
    "bibleReference": "Genesis 35:18",
    "explanation": "As she breathed her last, she named him Ben-Oni. But his father named him Benjamin (\"Son of my right hand\").",
    "explanationTelugu": "ఆమె ప్రాణము పోవుచుండగా అతనికి బెనోనీ అని పేరు పెట్టెను, అయితే అతని తండ్రి అతనికి బెన్యామీను అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which two wicked older sons of Judah were struck down by the Lord in the land of Canaan?",
    "questionTelugu": "కనాను దేశములో యెహోవా దృష్టికి చెడ్డవారై చనిపోయిన యూదా పెద్ద కుమారులు ఇద్దరు ఎవరు?",
    "options": [
      "Er and Onan",
      "Nadab and Abihu",
      "Hophni and Phinehas",
      "Perez and Zerah"
    ],
    "optionsTelugu": [
      "ఏరు మరియు ఓనాను",
      "నాదాబు మరియు అబీహు",
      "హొఫ్నీ మరియు ఫీనెహాసు",
      "పెరెసు మరియు జెరహు"
    ],
    "correctAnswer": "Er and Onan",
    "bibleReference": "Genesis 38:6-10",
    "explanation": "Judah’s firstborn Er was wicked in the Lord’s sight, and so was Onan; the Lord put both to death.",
    "explanationTelugu": "యూదా జ్యేష్ఠ కుమారుడైన ఏరు మరియు ఓనాను యెహోవా దృష్టికి చెడ్డవారై చనిపోయిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which twin sons were born to Tamar and Judah, becoming royal ancestors of King David and Jesus Christ?",
    "questionTelugu": "తామారు మరియు యూదాలకు జన్మించి దావీదు రాజునకు మరియు యేసుక్రీస్తునకు పూర్వీకులైన కవలలు ఎవరు?",
    "options": [
      "Perez and Zerah",
      "Jacob and Esau",
      "Ephraim and Manasseh",
      "Phinehas and Eleazar"
    ],
    "optionsTelugu": [
      "పెరెసు మరియు జెరహు",
      "యాకోబు మరియు ఏశావు",
      "ఎఫ్రాయిము మరియు మనష్షే",
      "ఫీనెహాసు మరియు ఎలియాజరు"
    ],
    "correctAnswer": "Perez and Zerah",
    "bibleReference": "Genesis 38:29-30, Matthew 1:3",
    "explanation": "Tamar gave birth to Perez and Zerah; through Perez the messianic genealogy continues.",
    "explanationTelugu": "తామారు పెరెసును జెరహును కనెను; పెరెసు వంశములో దావీదు మరియు యేసుక్రీస్తు జన్మించిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "What steadfast response did Joseph give to Potiphar’s wife when tempted to betray his master’s household?",
    "questionTelugu": "పోతీఫరు భార్య పాపము చేయుటకు ప్రేరేపించినప్పుడు యోసేపు ఇచ్చిన స్థిరమైన సమాధానము ఏమిటి?",
    "options": [
      "\"How could I do such a wicked thing and sin against God?\"",
      "\"Pay me silver first\"",
      "\"Wait until next harvest\"",
      "\"Let me consult the priests\""
    ],
    "optionsTelugu": [
      "\"నేనెట్లు ఇంత ఘోరమైన దుష్కార్యము చేసి దేవునికి విరోధముగా పాపము కట్టుకొందును?\"",
      "\"నాకు వెండిని ఇవ్వుము\"",
      "\"వచ్చే కోత వరకు ఆగుము\"",
      "\"యాజకులను అడుగుతాను\""
    ],
    "correctAnswer": "\"How could I do such a wicked thing and sin against God?\"",
    "bibleReference": "Genesis 39:9",
    "explanation": "Joseph honored his master’s trust and feared God, fleeing her presence.",
    "explanationTelugu": "యోసేపు తన యజమాని నమ్మకమును కాపాడుకొనుచు దేవునికి భయపడి పాపమునకు దూరముగా పారిపోయెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "In whose grain sack was Joseph’s personal silver cup placed to test his brothers’ family loyalty?",
    "questionTelugu": "అన్నదమ్ముల కుటుంబ ప్రేమను పరీక్షించుటకు యోసేపు తన వెండి గిన్నెను ఎవరి గోనెసంచిలో దాచించెను?",
    "options": [
      "Benjamin’s sack",
      "Reuben’s sack",
      "Judah’s sack",
      "Simeon’s sack"
    ],
    "optionsTelugu": [
      "బెన్యామీను గోనెసంచిలో",
      "రూబేను సంచిలో",
      "యూదా సంచిలో",
      "షిమ్యోను సంచిలో"
    ],
    "correctAnswer": "Benjamin’s sack",
    "bibleReference": "Genesis 44:2",
    "explanation": "Joseph instructed his steward: \"Put my cup, the silver one, in the mouth of the youngest one’s sack.\"",
    "explanationTelugu": "యోసేపు: \"నా వెండి గిన్నెను చిన్నవాని సంచి మూతిలో ఉంచుమని\" తన గృహనిర్వాహకునికి ఆజ్ఞాపించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "How many total direct family members of Jacob’s household migrated into Egypt according to Genesis 46:27?",
    "questionTelugu": "ఆదికాండము 46:27 ప్రకారం యాకోబు కుటుంబములో ఐగుప్తులోనికి వచ్చిన మొత్తం వ్యక్తుల సంఖ్య ఎంత?",
    "options": [
      "Seventy people",
      "Twelve people",
      "One hundred and twenty people",
      "Forty people"
    ],
    "optionsTelugu": [
      "డెబ్బై మంది",
      "పన్నెండు మంది",
      "నూట ఇరవై మంది",
      "నలభై మంది"
    ],
    "correctAnswer": "Seventy people",
    "bibleReference": "Genesis 46:27",
    "explanation": "All the persons of the house of Jacob who came into Egypt were seventy.",
    "explanationTelugu": "ఐగుప్తునకు వచ్చిన యాకోబు కుటుంబపు వారందరు మొత్తం 70 మంది.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which fertile pasture region of Egypt did Pharaoh grant to Joseph’s family to settle with their flocks?",
    "questionTelugu": "యోసేపు తండ్రికి మరియు అన్నదమ్ములకు పశువులను మేపుకొనుటకు ఫరో ఇచ్చిన ఐగుప్తు సారవంతమైన ప్రాంతము ఏది?",
    "options": [
      "Land of Goshen",
      "Thebes",
      "Alexandria",
      "Memphis"
    ],
    "optionsTelugu": [
      "గోషెను దేశము",
      "థీబ్స్",
      "అలెక్సాండ్రియా",
      "మెంఫిస్"
    ],
    "correctAnswer": "Land of Goshen",
    "bibleReference": "Genesis 47:6",
    "explanation": "Pharaoh said to Joseph: \"Let your father and brothers live in the best part of the land; let them live in Goshen.\"",
    "explanationTelugu": "ఫరో: \"గోషెను దేశమందు నీ తండ్రిని నీ సహోదరులను నివసింపజేయుము\" అని సెలవిచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "What solemn oath did dying Jacob demand from Joseph regarding his burial place?",
    "questionTelugu": "వృద్ధుడైన యాకోబు చనిపోయేముందు తన సమాధిని గూర్చి యోసేపు వద్ద చేయించుకున్న ప్రమాణము ఏమిటి?",
    "options": [
      "\"Do not bury me in Egypt; carry me out to lie with my fathers in Machpelah\"",
      "\"Build me a pyramid in Memphis\"",
      "\"Cast my bones into the Nile\"",
      "\"Bury me in the palace gardens\""
    ],
    "optionsTelugu": [
      "\"నన్ను ఐగుప్తులో పాతిపెట్టకుము, నా పితరుల సమాధియైన మక్పేలాలో నన్ను పాతిపెట్టుము\"",
      "\"ఐగుప్తులో పిరమిడ్ కట్టించుము\"",
      "\"నా ఎముకలను నైలునదిలో వేయుము\"",
      "\"రాజభవనములో సమాధి చేయుము\""
    ],
    "correctAnswer": "\"Do not bury me in Egypt; carry me out to lie with my fathers in Machpelah\"",
    "bibleReference": "Genesis 47:29-30",
    "explanation": "Jacob made Joseph swear to carry his body out of Egypt to be buried in the tomb of Abraham and Isaac.",
    "explanationTelugu": "యాకోబు: \"నన్ను ఐగుప్తులో పాతిపెట్టక నా పితరుల యొద్ద నన్ను పాతిపెట్టుమని\" ప్రమాణము చేయించుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which two courageous Hebrew midwives feared God and defied Pharaoh’s decree to drown Hebrew baby boys?",
    "questionTelugu": "ఫరో రాజాజ్ఞను ధిక్కరించి దేవునికి భయపడి మగపిల్లలను బ్రతికించిన ఇద్దరు హీబ్రూ మంత్రసానులు ఎవరు?",
    "options": [
      "Shiphrah and Puah",
      "Jochebed and Miriam",
      "Tamar and Rahab",
      "Bilhah and Zilpah"
    ],
    "optionsTelugu": [
      "షిఫ్రా మరియు పూవా",
      "యోకెబెదు మరియు మిర్యాము",
      "తామారు మరియు రాహాబు",
      "బిల్హా మరియు జిల్పా"
    ],
    "correctAnswer": "Shiphrah and Puah",
    "bibleReference": "Exodus 1:15-17",
    "explanation": "The midwives feared God and did not do what the king of Egypt commanded them, letting the boys live.",
    "explanationTelugu": "షిఫ్రా పూవా అను మంత్రసానులు దేవునికి భయపడి ఐగుప్తు రాజు ఆజ్ఞాపించినట్లు చేయక మగపిల్లలను బ్రతికించిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "How was the Passover lamb allocated among the Israelites in Exodus 12:3-4?",
    "questionTelugu": "నిర్గమకాండము 12:3-4 లో పస్కా గొర్రెపిల్లను ఇశ్రాయేలీయులు ఎలా పంచుకోవాలని ఆజ్ఞాపించబడెను?",
    "options": [
      "One lamb per household / family, sharing with smaller neighbor households if needed",
      "One lamb for the entire nation",
      "One lamb for every soldier only",
      "Only priests were allowed to eat"
    ],
    "optionsTelugu": [
      "ప్రతి కుటుంబమునకు ఒక గొర్రెపిల్ల చొప్పున, అవసరమైతే పొరుగువారితో పంచుకొనునట్లు",
      "దేశమంతటికీ కలిపి ఒక్కటే",
      "సైనికులకు మాత్రమే",
      "యాజకులకు మాత్రమే"
    ],
    "correctAnswer": "One lamb per household / family, sharing with smaller neighbor households if needed",
    "bibleReference": "Exodus 12:3-4",
    "explanation": "Each man was to take a lamb for his family, one for each household according to the number of people.",
    "explanationTelugu": "ప్రతివాడును తన కుటుంబము చొప్పున ఒక్కొక్క గొర్రెపిల్లను తీసికొని సిద్ధపరచవలెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who was the noble wife of Aaron the High Priest, daughter of Amminadab and sister of Nahshon?",
    "questionTelugu": "అమ్మీనాదాబు కుమార్తెయు నయస్సోను సహోదరియునైన ప్రధాన యాజకుడు అహరోను భార్య ఎవరు?",
    "options": [
      "Elisheba",
      "Jochebed",
      "Zipporah",
      "Cozbi"
    ],
    "optionsTelugu": [
      "ఎలీషెబ",
      "యోకెబెదు",
      "సిప్పోరా",
      "కొజ్బీ"
    ],
    "correctAnswer": "Elisheba",
    "bibleReference": "Exodus 6:23",
    "explanation": "Aaron married Elisheba, daughter of Amminadab and sister of Nahshon, and she bore him Nadab, Abihu, Eleazar, and Ithamar.",
    "explanationTelugu": "అహరోను అమ్మీనాదాబు కుమార్తెయు నయస్సోను సహోదరియునైన ఎలీషెబను వివాహము చేసుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which two elder sons of Aaron were consumed by fire from the Lord for offering unauthorized profane incense?",
    "questionTelugu": "యెహోవా ఆజ్ఞాపింపని అన్య అగ్నిని ధూపార్తిలో ఉంచి సమర్పించినందున దేవుని అగ్నికి మరణించిన అహరోను కుమారులు ఎవరు?",
    "options": [
      "Nadab and Abihu",
      "Eleazar and Ithamar",
      "Hophni and Phinehas",
      "Gershom and Eliezer"
    ],
    "optionsTelugu": [
      "నాదాబు మరియు అబీహు",
      "ఎలియాజరు మరియు ఈతామారు",
      "హొఫ్నీ మరియు ఫీనెహాసు",
      "గేర్షోము మరియు ఎలీయెజెరు"
    ],
    "correctAnswer": "Nadab and Abihu",
    "bibleReference": "Leviticus 10:1-2",
    "explanation": "Nadab and Abihu offered unauthorized fire before the Lord, and fire came out from the presence of the Lord and consumed them.",
    "explanationTelugu": "నాదాబు అబీహులు అన్య అగ్నిని తెచ్చినందున యెహోవా సన్నిధినుండి అగ్ని బయలువెడలి వారిని కాల్చివేసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "On which mountain did Moses strip Aaron of his high priestly garments to place them on his son Eleazar?",
    "questionTelugu": "అహరోను ప్రధాన యాజక వస్త్రములను తీసి అతని కుమారుడైన ఎలియాజరునకు తొడిగించిన పర్వతము ఏది?",
    "options": [
      "Mount Hor",
      "Mount Sinai",
      "Mount Nebo",
      "Mount Carmel"
    ],
    "optionsTelugu": [
      "హోరు పర్వతము",
      "సీనాయి పర్వతము",
      "నెబో పర్వతము",
      "కర్మెలు పర్వతము"
    ],
    "correctAnswer": "Mount Hor",
    "bibleReference": "Numbers 20:25-28",
    "explanation": "Moses took Aaron and his son Eleazar up Mount Hor and transferred the priestly garments before Aaron died there.",
    "explanationTelugu": "మోషే హోరు పర్వతముపై అహరోను వస్త్రములను తీసి ఎలియాజరునకు తొడిగించెను; అహరోను అక్కడే మరణించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which zealous grandson of Aaron turned away God’s wrath at Peor, receiving an enduring covenant of peace?",
    "questionTelugu": "బయల్పెయోరు పాపము వద్ద దేవుని రోషము కలిగి తీర్పును ఆపి శాశ్వత సమాధాన నిబంధనను పొందిన అహరోను మనుమడు ఎవరు?",
    "options": [
      "Phinehas son of Eleazar",
      "Ithamar",
      "Gershon",
      "Merari"
    ],
    "optionsTelugu": [
      "ఎలియాజరు కుమారుడైన ఫీనెహాసు",
      "ఈతామారు",
      "గేర్షోను",
      "మెరారి"
    ],
    "correctAnswer": "Phinehas son of Eleazar",
    "bibleReference": "Numbers 25:11-13",
    "explanation": "God gave Phinehas His covenant of peace and a permanent priesthood because he was zealous for his God.",
    "explanationTelugu": "ఫీనెహాసు తన దేవుని కొరకు రోషము కలిగి ప్రాయశ్చిత్తము చేసినందున దేవుడు అతనికి శాశ్వత యాజక నిబంధన ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "From which tribe was Joshua son of Nun, who faithfully served Moses from his youth?",
    "questionTelugu": "చిన్ననాటి నుండి మోషేకు నమ్మకముగా పరిచర్య చేసిన నూను కుమారుడైన యెహోషువ ఏ గోత్రమునకు చెందినవాడు?",
    "options": [
      "Tribe of Ephraim",
      "Tribe of Judah",
      "Tribe of Levi",
      "Tribe of Benjamin"
    ],
    "optionsTelugu": [
      "ఎఫ్రాయిము గోత్రము",
      "యూదా గోత్రము",
      "లేవీ గోత్రము",
      "బెన్యామీను గోత్రము"
    ],
    "correctAnswer": "Tribe of Ephraim",
    "bibleReference": "Numbers 13:8, 1 Chronicles 7:27",
    "explanation": "Joshua son of Nun was from the tribe of Ephraim, son of Joseph.",
    "explanationTelugu": "యెహోషువ ఎఫ్రాయిము గోత్రమునకు చెందిన నాయకుడు.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "What family protection did Rahab secure with the scarlet cord tied in her window in Jericho?",
    "questionTelugu": "యెరికో గోడపైనున్న తన కిటికీకి ఎర్రని త్రాడు కట్టి రాహాబు తన కుటుంబము కొరకు ఏ రక్షణ పొందుకొనెను?",
    "options": [
      "Her father, mother, brothers, and all who belonged to her household were spared alive",
      "She received half of Jericho’s gold",
      "Her brothers were made city judges",
      "Her house was transported to Gilgal"
    ],
    "optionsTelugu": [
      "ఆమె తండ్రి, తల్లి, సహోదరులు మరియు ఆమె ఇంటివారందరు ప్రాణములతో రక్షింపబడిరి",
      "యెరికో బంగారములో సగము పొందెను",
      "ఆమె సహోదరులు న్యాయాధిపతులైరి",
      "ఆమె ఇల్లు గిల్గాలుకు మార్చబడెను"
    ],
    "correctAnswer": "Her father, mother, brothers, and all who belonged to her household were spared alive",
    "bibleReference": "Joshua 2:12-13, 6:23",
    "explanation": "Joshua spared Rahab and her entire father’s household because she had hidden the messengers.",
    "explanationTelugu": "రాహాబు వేగులవారిని దాచినందున ఆమె కుటుంబమంతయు నాశనము నుండి సజీవముగా కాపాడబడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which man took forbidden plunder at Jericho, bringing defeat and destruction upon his entire household at the Valley of Achor?",
    "questionTelugu": "యెరికో శాపగ్రస్తమైన సొమ్మును దొంగిలించి ఆకోరు లోయలో తన కుటుంబమంతటికీ వినాశనము తెచ్చినది ఎవరు?",
    "options": [
      "Achan son of Carmi",
      "Zimri son of Salu",
      "Korah son of Izhar",
      "Dathan son of Eliab"
    ],
    "optionsTelugu": [
      "కర్మీ కుమారుడైన ఆకాను",
      "సాలూ కుమారుడైన జిమ్రీ",
      "ఇస్హారు కుమారుడైన కోరహు",
      "ఎలీయాబు కుమారుడైన దాతాను"
    ],
    "correctAnswer": "Achan son of Carmi",
    "bibleReference": "Joshua 7:1, 24-26",
    "explanation": "Achan coveted a Babylonian robe, two hundred shekels of silver, and a bar of gold, bringing disaster on Israel and his house.",
    "explanationTelugu": "ఆకాను షీనారు వస్త్రమును వెండిబంగారములను దాచిపెట్టి ఇశ్రాయేలుపైకి తీర్పు తెచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "Where did prophetess Deborah, wife of Lappidoth, hold court under a palm tree to judge Israel?",
    "questionTelugu": "లప్పీదోతు భార్యయైన దెబోరా ప్రవక్త్రి ఇశ్రాయేలుకు న్యాయము తీర్చుటకు ఏ తాటిచెట్టు క్రింద కూర్చుండువాడు?",
    "options": [
      "Between Ramah and Bethel in the hill country of Ephraim",
      "In the valley of Jezreel",
      "Near the springs of Jericho",
      "By the brook Kidron"
    ],
    "optionsTelugu": [
      "ఎఫ్రాయిము మన్యమందలి రామాకును బేతేలునకును మధ్యనున్న దెబోరా తాటిచెట్టు క్రింద",
      "యెజ్రెయేలు లోయలో",
      "యెరికో ఊటల వద్ద",
      "కీద్రోను వాగు వద్ద"
    ],
    "correctAnswer": "Between Ramah and Bethel in the hill country of Ephraim",
    "bibleReference": "Judges 4:4-5",
    "explanation": "Deborah, wife of Lappidoth, was judging Israel, holding court under the Palm of Deborah between Ramah and Bethel.",
    "explanationTelugu": "దెబోరా రామాకును బేతేలునకును మధ్యనున్న తాటిచెట్టు క్రింద కూర్చుండగా ప్రజలు న్యాయపు తీర్పుల కొరకు ఆమె యొద్దకు వచ్చిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "What was Gideon son of Joash the Abiezrite doing when the Angel of the Lord appeared and called him \"mighty warrior\"?",
    "questionTelugu": "దైవదూత ప్రత్యక్షమై \"పరాక్రమముగల బలాఢ్యుడా\" అని పిలిచినప్పుడు అబీఎజెరీయుడైన యోవాషు కుమారుడు గిద్యోను ఏమి చేయుచుండెను?",
    "options": [
      "Threshing wheat in a winepress to keep it from the Midianites",
      "Building a stone tower",
      "Plowing with oxen in the open field",
      "Sleeping inside his father’s tent"
    ],
    "optionsTelugu": [
      "మిద్యానీయుల కంటబడకుండా గోధుమలను ద్రాక్షల తొట్టిలో దుళ్లగొట్టుచుండెను",
      "రాతి గోపురమును కట్టుచుండెను",
      "పొలములో ఎడ్లతో దున్నుచుండెను",
      "గుడారములో నిద్రించుచుండెను"
    ],
    "correctAnswer": "Threshing wheat in a winepress to keep it from the Midianites",
    "bibleReference": "Judges 6:11-12",
    "explanation": "Gideon was threshing wheat in a winepress to hide it from the Midianites when the Lord greeted him.",
    "explanationTelugu": "గిద్యోను మిద్యానీయులకు దాచుకొనుటకై ద్రాక్షల తొట్టిలో గోధుమలను బాదుచుండగా దూత కనబడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "How many of his own half-brothers did murderous Abimelech slaughter on a single stone at Ophrah?",
    "questionTelugu": "ఒఫ్రాలో ఒకే రాతిమీద క్రూరుడైన అబీమెలెకు హతము చేసిన తన సొంత సహోదరుల సంఖ్య ఎంత?",
    "options": [
      "Seventy brothers",
      "Twelve brothers",
      "Ten brothers",
      "Forty brothers"
    ],
    "optionsTelugu": [
      "డెబ్బై మంది సహోదరులు",
      "పన్నెండు మంది",
      "పది మంది",
      "నలభై మంది"
    ],
    "correctAnswer": "Seventy brothers",
    "bibleReference": "Judges 9:5",
    "explanation": "Abimelech went to his father’s house at Ophrah and murdered his seventy brothers, the sons of Jerub-Baal, on one stone.",
    "explanationTelugu": "అబీమెలెకు యెరుబ్బయలు కుమారులైన తన డెబ్బైమంది సహోదరులను ఒకే రాతిమీద చంపివేసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which sole surviving youngest brother escaped Abimelech’s slaughter and delivered the fable of the trees from Mount Gerizim?",
    "questionTelugu": "అబీమెలెకు హత్యకాండ నుండి తప్పించుకొని గెరిజీము పర్వతముపై నుండి చెట్ల ఉపమానమును చాటిన చిన్న తమ్ముడు ఎవరు?",
    "options": [
      "Jotham",
      "Gaal",
      "Zebul",
      "Jonathan"
    ],
    "optionsTelugu": [
      "యోతాము",
      "గయలు",
      "జెబూలు",
      "యోనాతాను"
    ],
    "correctAnswer": "Jotham",
    "bibleReference": "Judges 9:5, 7-15",
    "explanation": "Jotham, the youngest son of Jerub-Baal, escaped by hiding and delivered the famous bramble parable.",
    "explanationTelugu": "చిన్నవాడైన యోతాము దాగుకొని తప్పించుకొని చెట్లు ముండ్లకంపను రాజుగా చేసిన ఉపమానము చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "Why did Naomi instruct the women of Bethlehem: \"Don’t call me Naomi; call me Mara\"?",
    "questionTelugu": "నయోమి బేత్లెహేము స్త్రీలతో: \"నన్ను నయోమి అనవద్దు, మారా అని పిలువుడి\" అని ఎందుకు చెప్పెను?",
    "options": [
      "\"Because the Almighty has made my life very bitter; I went away full, but the Lord brought me back empty\"",
      "\"Because I love bitter herbs\"",
      "\"Because Mara is a royal Egyptian name\"",
      "\"Because I lost my gold\""
    ],
    "optionsTelugu": [
      "\"సర్వశక్తుడు నాకు మిక్కిలి దుఃఖము కలుగజేసెను; నేను సమృద్ధిగా వెళ్లితిని, యెహోవా నన్ను రిక్తురాలిగా తిరిగి రప్పించెను\"",
      "\"చేదు ఆకులు ఇష్టమైనందున\"",
      "\"మారా అనునది రాజవంశపు పేరు అయినందున\"",
      "\"బంగారము పోగొట్టుకున్నందున\""
    ],
    "correctAnswer": "\"Because the Almighty has made my life very bitter; I went away full, but the Lord brought me back empty\"",
    "bibleReference": "Ruth 1:20-21",
    "explanation": "Naomi means \"pleasant,\" whereas Mara means \"bitter,\" reflecting her deep family loss of husband and two sons.",
    "explanationTelugu": "నయోమి అనగా మనోహరమైనది, మారా అనగా చేదు; భర్తను ఇద్దరు కుమారులను కోల్పోయిన వేదనను అది తెలిపినది.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "Why did the closer guardian-redeemer in Ruth 4 refuse to redeem Elimelech’s land and marry Ruth?",
    "questionTelugu": "రూతు 4 లో సమీప బంధువైన విమోచకుడు ఎలీమెలెకు భూమిని విడిపించి రూతును పెండ్లి చేసుకొనుటకు ఎందుకు నిరాకరించెను?",
    "options": [
      "He feared endangering or impairing his own family estate / inheritance",
      "He did not have enough barley",
      "He had moved to Moab",
      "The elders forbade him"
    ],
    "optionsTelugu": [
      "తన సొంత స్వాస్థ్యమునకు నష్టము కలుగునేమోనని భయపడినందున",
      "యవలు లేనందున",
      "మోయాబుకు వెళ్లినందున",
      "పెద్దలు వద్దన్నందున"
    ],
    "correctAnswer": "He feared endangering or impairing his own family estate / inheritance",
    "bibleReference": "Ruth 4:6",
    "explanation": "The guardian-redeemer said: \"I cannot redeem it because I might endanger my own estate. You redeem it yourself.\"",
    "explanationTelugu": "సమీప బంధువు: \"నా స్వాస్థ్యమును పాడుచేసికొనకుండునట్లు నేను విడిపింపలేను, నీవే విడిపించుకొనుము\" అని తన చెప్పును తీసి ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "How did rival wife Peninnah persistently mistreat Hannah every year at the house of the Lord in Shiloh?",
    "questionTelugu": "షీలోహులోని మందిరములో పెనిన్నా ప్రతి సంవత్సరము హన్నాను ఎలా వేధించుచుండెను?",
    "options": [
      "Taunted and provoked her bitterly to irritate her because the Lord had closed her womb",
      "Stole her portion of sacrificial meat",
      "Hid her prayer shawls",
      "Locked her outside the temple gates"
    ],
    "optionsTelugu": [
      "యెహోవా ఆమెకు గర్భఫలము ఇయ్యనందున ఆమెను విసికించునట్లు తీవ్రముగా అవమానించి దుఃఖపెట్టెను",
      "ఆమె ఆహారపు వంతును లాక్కునెను",
      "ఆమె వస్త్రాలను దాచెను",
      "మందిరపు తలుపులు మూసెను"
    ],
    "correctAnswer": "Taunted and provoked her bitterly to irritate her because the Lord had closed her womb",
    "bibleReference": "1 Samuel 1:6-7",
    "explanation": "Her rival kept provoking her to irritate her year after year, reducing Hannah to weeping without eating.",
    "explanationTelugu": "పెనిన్నా హన్నాను దుఃఖపెట్టుటకై ఆమెను ఎగతాళి చేయుచుండెను; అందుచేత హన్నా ఏడ్చుచు భోజనము చేయకపోయెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "Where was child Samuel resting when the Lord called his name three times in the night?",
    "questionTelugu": "రాత్రివేళ దేవుడు మూడుసార్లు పేరుపెట్టి పిలిచినప్పుడు బాలుడైన సమూయేలు ఎక్కడ పండుకొని యుండెను?",
    "options": [
      "In the temple of the Lord near the Ark of God where the lamp was burning",
      "In his parents’ home in Ramah",
      "In the city gate of Shiloh",
      "In the fields tending sheep"
    ],
    "optionsTelugu": [
      "దేవుని మందసమున్న యెహోవా మందిరములో దేవుని దీపము ఇంకా ఆరిపోకమునుపు",
      "రామాలోని తల్లిదండ్రుల ఇంట్లో",
      "షీలోహు గుమ్మము వద్ద",
      "గొర్రెల కాపరుల వద్ద"
    ],
    "correctAnswer": "In the temple of the Lord near the Ark of God where the lamp was burning",
    "bibleReference": "1 Samuel 3:3-4",
    "explanation": "The lamp of God had not yet gone out, and Samuel was lying down in the house of the Lord where the Ark of God was.",
    "explanationTelugu": "దేవుని మందసమున్న మందిరములో దీపము ఇంకా వెలుగుచుండగా సమూయేలు పండుకొనియుండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "How did ninety-eight-year-old high priest Eli die upon hearing the tragic family and national news?",
    "questionTelugu": "తన కుమారులు చనిపోయి దేవుని మందసము పట్టబడెనని విన్నప్పుడు 98 ఏళ్ల ఏలీ ఎలా మరణించెను?",
    "options": [
      "Fell backward off his chair beside the gate, broke his neck and died",
      "Died peacefully in bed",
      "Was struck by Philistine archers",
      "Drowned in the Jordan river"
    ],
    "optionsTelugu": [
      "గుమ్మము వద్దనున్న పీటపై నుండి వెనుకకు పడి మెడ విరిగి చనిపోయెను",
      "మంచముపై నిద్రలోనే",
      "బాణములు తగిలి",
      "నదిలో మునిగి"
    ],
    "correctAnswer": "Fell backward off his chair beside the gate, broke his neck and died",
    "bibleReference": "1 Samuel 4:18",
    "explanation": "When the messenger mentioned the Ark of God, Eli fell backward off his chair by the gate; his neck broke because he was old and heavy.",
    "explanationTelugu": "దేవుని మందసమను మాట వినగానే ఏలీ గుమ్మము ప్రక్కనున్న పీటమీదినుండి వెనుకకు పడి మెడ విరిగి చనిపోయెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "What tragic name did Phinehas’ dying wife give to her newborn child upon hearing the Ark was captured?",
    "questionTelugu": "దేవుని మందసము పట్టబడెనని విన్న ఫీనెహాసు భార్య చనిపోవుచు తన బిడ్డకు ఏమని పేరు పెట్టెను?",
    "options": [
      "Ichabod (\"The glory has departed\")",
      "Ben-Oni",
      "Gershom",
      "Lo-Ammi"
    ],
    "optionsTelugu": [
      "ఈకాబోదు (ప్రభావము ఇశ్రాయేలులో నుండి పోయెను)",
      "బెనోనీ",
      "గేర్షోము",
      "లోఅమ్మీ"
    ],
    "correctAnswer": "Ichabod (\"The glory has departed\")",
    "bibleReference": "1 Samuel 4:21-22",
    "explanation": "She named the boy Ichabod, saying: \"The glory has departed from Israel, for the Ark of God has been captured.\"",
    "explanationTelugu": "దేవుని మందసము పట్టబడినందున ప్రభావము ఇశ్రాయేలులో నుండి పోయెనని చెప్పి అతనికి ఈకాబోదు అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who was the father of King Saul, described as a wealthy, influential man of the tribe of Benjamin?",
    "questionTelugu": "సౌలు రాజు తండ్రియైన బెన్యామీను గోత్రీకుడైన బలవంతుడు మరియు ధనవంతుడు ఎవరు?",
    "options": [
      "Kish",
      "Abiel",
      "Ner",
      "Abner"
    ],
    "optionsTelugu": [
      "కీషు",
      "అబీయేలు",
      "నేరు",
      "అబ్నేరు"
    ],
    "correctAnswer": "Kish",
    "bibleReference": "1 Samuel 9:1-2",
    "explanation": "There was a Benjamite, a man of standing, whose name was Kish, and he had a son named Saul.",
    "explanationTelugu": "బెన్యామీనీయులలో కీషు అను ఒక పరాక్రమశాలి యుండెను; అతనికి సౌలు అను కుమారుడు కలడు.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which rocky crags did prince Jonathan and his armor-bearer climb to strike the Philistine garrison?",
    "questionTelugu": "ఫిలిష్తీయుల దండుపై దాడిచేయుటకు యోనాతాను మరియు అతని ఆయుధధారి ఎక్కిన కొండ బండల పేర్లు ఏమిటి?",
    "options": [
      "Bozez and Seneh",
      "Ebal and Gerizim",
      "Horeb and Sinai",
      "Pisgah and Peor"
    ],
    "optionsTelugu": [
      "బోసేసు మరియు సెనె",
      "ఏబాలు మరియు గెరిజీము",
      "హోరేబు మరియు సీనాయి",
      "పిస్గా మరియు పెయోరు"
    ],
    "correctAnswer": "Bozez and Seneh",
    "bibleReference": "1 Samuel 14:4-5",
    "explanation": "On each side of the pass that Jonathan intended to cross stood a cliff; one was called Bozez and the other Seneh.",
    "explanationTelugu": "యోనాతాను వెళ్లదలచిన మార్గమున ఇరుప్రక్కల బోసేసు, సెనె అను రెండు కొండ శిఖరములు ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s1_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "What sweet food did Jonathan innocently taste with the end of his staff, violating his father Saul’s rash fast?",
    "questionTelugu": "తండ్రి పెట్టిన తొందరపాటు శపథము తెలియక యోనాతాను తన చేతికర్ర కొనతో అడవిలో దేనిని రుచిచూసెను?",
    "options": [
      "Wild honey dripping from a honeycomb",
      "Fresh figs",
      "Clusters of wild grapes",
      "Pomegranate seeds"
    ],
    "optionsTelugu": [
      "నేలమీద కారుచున్న తేనె",
      "అంజూరపు పండ్లు",
      "ద్రాక్ష గుత్తులు",
      "దానిమ్మ గింజలు"
    ],
    "correctAnswer": "Wild honey dripping from a honeycomb",
    "bibleReference": "1 Samuel 14:27",
    "explanation": "Jonathan reached out the end of his staff and dipped it into the honeycomb, ate it, and his eyes brightened.",
    "explanationTelugu": "యోనాతాను తన చేతికర్ర కొనను తేనెపట్టులో ముంచి తేనె తినినప్పుడు అతని కన్నులు ప్రకాశించెను.",
    "marks": 1
  }
];

export const FAMILY_MEDIUM_GROWTH: QuizQuestion[] = [
  {
    "id": "fam_m_s2_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which sister of King David was the mother of three mighty military commanders: Joab, Abishai, and Asahel?",
    "questionTelugu": "యోవాబు, అబీషై, మరియు ఆశాహేలు అను ముగ్గురు పరాక్రమశాలురైన సేనాధిపతులకు తల్లియైన దావీదు సహోదరి ఎవరు?",
    "options": [
      "Zeruiah",
      "Abigail",
      "Tamar",
      "Michal"
    ],
    "optionsTelugu": [
      "సెరూయా",
      "అబీగయీలు",
      "తామారు",
      "మీకాలు"
    ],
    "correctAnswer": "Zeruiah",
    "bibleReference": "2 Samuel 2:18, 1 Chronicles 2:16",
    "explanation": "Zeruiah was David’s sister, and her three sons were valiant warriors in David’s army.",
    "explanationTelugu": "సెరూయా దావీదు సహోదరి; ఆమె కుమారులు దావీదు దండులో ప్రధాన యోధులు.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which other sister of David gave birth to Amasa, who later commanded Absalom’s army?",
    "questionTelugu": "అబ్షాలోము సైన్యమునకు సేనాధిపతియైన అమాశాను కనిన దావీదు యొక్క మరియొక సహోదరి ఎవరు?",
    "options": [
      "Abigail",
      "Zeruiah",
      "Maakah",
      "Merab"
    ],
    "optionsTelugu": [
      "అబీగయీలు",
      "సెరూయా",
      "మయకా",
      "మేరబు"
    ],
    "correctAnswer": "Abigail",
    "bibleReference": "1 Chronicles 2:16-17",
    "explanation": "David’s sisters were Zeruiah and Abigail; Abigail bore Amasa, whose father was Jether the Ishmaelite.",
    "explanationTelugu": "దావీదు సహోదరియైన అబీగయీలు అమాశాను కనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "What tragic fate struck foolish wealthy Nabal ten days after Abigail restrained David from bloodshed?",
    "questionTelugu": "అబీగయీలు దావీదును ఆపిన పది దినముల తరువాత బుద్ధిహీనుడైన నాబాలునకు ఏమి సంభవించెను?",
    "options": [
      "His heart failed and became like stone, and the Lord struck him dead",
      "He fled to Moab with his sheep",
      "He was crowned king in Hebron",
      "He became a desert hermit"
    ],
    "optionsTelugu": [
      "అతని గుండె రాయివలె ఆగిపోయెను, పది దినముల తరువాత యెహోవా అతనిని మొత్తగా చనిపోయెను",
      "మోయాబుకు పారిపోయెను",
      "హెబ్రోనులో రాజాయెను",
      "సన్యాసిగా మారెను"
    ],
    "correctAnswer": "His heart failed and became like stone, and the Lord struck him dead",
    "bibleReference": "1 Samuel 25:37-38",
    "explanation": "When his wife told him what happened, Nabal’s heart died within him, and about ten days later the Lord struck him.",
    "explanationTelugu": "భార్య జరిగిన సంగతి చెప్పగానే నాబాలు గుండె రాయివలె చచ్చినదాయెను, యెహోవా అతనిని మొత్తెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "To which man did King Saul give his daughter Michal after driving David into the wilderness?",
    "questionTelugu": "దావీదును అరణ్యములోనికి వెళ్లగొట్టిన తరువాత సౌలు తన కుమార్తె మీకాలును ఎవరికి ఇచ్చి పెండ్లి చేసెను?",
    "options": [
      "Paltiel (Palti) son of Laish",
      "Abner son of Ner",
      "Doeg the Edomite",
      "Jonathan"
    ],
    "optionsTelugu": [
      "లాయిషు కుమారుడైన పల్తీయేలు",
      "నేరు కుమారుడైన అబ్నేరు",
      "దోయేగు",
      "యోనాతాను"
    ],
    "correctAnswer": "Paltiel (Palti) son of Laish",
    "bibleReference": "1 Samuel 25:44",
    "explanation": "Saul had given his daughter Michal, David’s wife, to Paltiel son of Laish of Gallim.",
    "explanationTelugu": "సౌలు దావీదు భార్యయైన మీకాలును గల్లీము వాడైన లాయిషు కుమారుడు పల్తీకి ఇచ్చియుండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "Why did Mephibosheth become lame in both feet when he was five years old?",
    "questionTelugu": "యోనాతాను కుమారుడైన మెఫీబోషెతుకు ఐదేళ్ల ప్రాయములో రెండు కాళ్లు కుంటివగుటకు కారణమేమిటి?",
    "options": [
      "His nurse dropped him in haste when news arrived that Saul and Jonathan were killed",
      "He was injured in battle at Gilboa",
      "He caught a childhood fever",
      "He was wounded by enemy archers"
    ],
    "optionsTelugu": [
      "సౌలు యోనాతానులు చనిపోయిన సమాచారము విని అతని దాది భయముతో పరుగెత్తుచుండగా క్రింద పడవేసినందున",
      "యుద్ధములో గాయపడినందున",
      "జ్వరము వలన",
      "శత్రువుల బాణము తగిలినందున"
    ],
    "correctAnswer": "His nurse dropped him in haste when news arrived that Saul and Jonathan were killed",
    "bibleReference": "2 Samuel 4:4",
    "explanation": "His nurse picked him up to flee in haste, and as she fled, he fell and became lame.",
    "explanationTelugu": "దాది తొందరపడి పారిపోవుచుండగా బాలుడు క్రిందపడి రెండు కాళ్ళు కుంటివాడాయెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which two sons of Abinadab guided the new cart carrying the Ark of the Covenant from Kiriath Jearim?",
    "questionTelugu": "కిర్యాத்யారీము నుండి మందసమును క్రొత్త బండిపై తోలుచు వచ్చిన అబీనాదాబు కుమారులు ఇద్దరు ఎవరు?",
    "options": [
      "Uzzah and Ahio",
      "Hophni and Phinehas",
      "Eleazar and Ithamar",
      "Nadab and Abihu"
    ],
    "optionsTelugu": [
      "ఉజ్జా మరియు అహ్యో",
      "హొఫ్నీ మరియు ఫీనెహాసు",
      "ఎలియాజరు మరియు ఈతామారు",
      "నాదాబు మరియు అబీహు"
    ],
    "correctAnswer": "Uzzah and Ahio",
    "bibleReference": "2 Samuel 6:3",
    "explanation": "Uzzah and Ahio, sons of Abinadab, guided the new cart carrying the Ark of God.",
    "explanationTelugu": "అబీనాదాబు కుమారులైన ఉజ్జా మరియు అహ్యో ఆ క్రొత్త బండిని తోలుచు వచ్చిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "What lifelong family consequence befell Michal daughter of Saul after she despised King David’s dancing?",
    "questionTelugu": "మందసము యెదుట దావీదు నృత్యము చేయుట చూచి హేళన చేసినందుకు సౌలు కుమార్తె మీకాలునకు కలిగిన శాపమేమిటి?",
    "options": [
      "She had no children to the day of her death",
      "She was banished from Jerusalem",
      "She was stricken with leprosy",
      "She lost all her royal dowry"
    ],
    "optionsTelugu": [
      "ఆమె చనిపోవు దినము వరకు ఆమెకు పిల్లలు కలుగలేదు",
      "నగరము నుండి వెళ్లగొట్టబడెను",
      "కుష్ఠరోగము వచ్చెను",
      "ఆమె ఆస్తి పోయెను"
    ],
    "correctAnswer": "She had no children to the day of her death",
    "bibleReference": "2 Samuel 6:23",
    "explanation": "Michal daughter of Saul had no children to the day of her death.",
    "explanationTelugu": "సౌలు కుమార్తెయైన మీకాలు తాను మరణించిన దినమువరకు పిల్లలు కనకపోయెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "How large was the family household of Ziba, the former servant of King Saul’s house?",
    "questionTelugu": "సౌలు గృహ సేవకుడైన సీబా కుటుంబములో ఎంతమంది కుమారులు మరియు సేవకులు ఉండిరి?",
    "options": [
      "Fifteen sons and twenty servants",
      "Ten sons and twelve servants",
      "Seven sons and three servants",
      "Twelve sons and fifty servants"
    ],
    "optionsTelugu": [
      "పదిహేనుమంది కుమారులు మరియు ఇరవైమంది సేవకులు",
      "పదిమంది కుమారులు",
      "ఏడుగురు కుమారులు",
      "పన్నెండుమంది కుమారులు"
    ],
    "correctAnswer": "Fifteen sons and twenty servants",
    "bibleReference": "2 Samuel 9:10",
    "explanation": "Ziba had fifteen sons and twenty servants who farmed the land for Mephibosheth.",
    "explanationTelugu": "సీబాకు 15 మంది కుమారులు మరియు 20 మంది సేవకులు ఉండిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "What was the name of Mephibosheth’s young son who lived with him in Jerusalem?",
    "questionTelugu": "యెరూషలేములో మెఫీబోషెతుతో నివసించిన అతని చిన్న కుమారుని పేరు ఏమిటి?",
    "options": [
      "Mica",
      "Jonathan",
      "Merib-Baal",
      "Ahimaaz"
    ],
    "optionsTelugu": [
      "మీకా",
      "యోనాతాను",
      "మెరీబ్బయలు",
      "అహిమయస్సు"
    ],
    "correctAnswer": "Mica",
    "bibleReference": "2 Samuel 9:12",
    "explanation": "Mephibosheth had a young son named Mica, and all the members of Ziba’s household were his servants.",
    "explanationTelugu": "మెఫీబోషెతునకు మీకా అను ఒక చిన్న కుమారుడు ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "Why did Uriah the Hittite refuse to go home to sleep with his wife when David called him from battle?",
    "questionTelugu": "దావీదు యుద్ధము నుండి పిలిపించినప్పుడు ఊరియా తన ఇంటికి వెళ్లి భార్యతో పండుకొనుటకు ఎందుకు నిరాకరించెను?",
    "options": [
      "\"The Ark and Israel and Judah are staying in tents; shall I go to my house to eat and drink?\"",
      "\"I made a vow of silence\"",
      "\"I must guard the king’s chariot\"",
      "\"My house has collapsed\""
    ],
    "optionsTelugu": [
      "\"మందసమును ఇశ్రాయేలు యూదావారును గుడారములలో ఉండగా నేను నా యింటికి వెళ్లి భుజించుటకు పండుకొనుటకు తగునా?\"",
      "\"మౌన వ్రతము చేసాను\"",
      "\"రాజు రథమును కాపాడాలి\"",
      "\"నా ఇల్లు కూలిపోయింది\""
    ],
    "correctAnswer": "\"The Ark and Israel and Judah are staying in tents; shall I go to my house to eat and drink?\"",
    "bibleReference": "2 Samuel 11:11",
    "explanation": "Uriah was faithful to his fellow soldiers and the Ark of God, refusing personal comfort.",
    "explanationTelugu": "తోటి సైనికులు యుద్ధరంగములో ఉండగా తాను ఇంట్లో విశ్రాంతి తీసుకోనని ఊరియా నిష్కల్మషమైన విధేయత చూపెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "What second special name did the prophet Nathan give to newborn Solomon by the Lord’s word?",
    "questionTelugu": "యెహోవా ఆజ్ఞ చొప్పున నాతాను ప్రవక్త సొలొమోనునకు పెట్టిన రెండవ ప్రియమైన పేరు ఏమిటి?",
    "options": [
      "Jedidiah (\"Loved by the Lord\")",
      "Immanuel",
      "Zadok",
      "Adonijah"
    ],
    "optionsTelugu": [
      "యెదీద్యా (యెహోవాకు ప్రియుడు)",
      "ఇమ్మానుయేలు",
      "సాదోకు",
      "అదోనీయా"
    ],
    "correctAnswer": "Jedidiah (\"Loved by the Lord\")",
    "bibleReference": "2 Samuel 12:25",
    "explanation": "Nathan named him Jedidiah because the Lord loved him.",
    "explanationTelugu": "యెహోవా సొలొమోనును ప్రేమించినందున నాతాను ద్వారా అతనికి యెదీద్యా అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which shrewd cousin of Amnon, son of David’s brother Shimeah, devised the trap against Tamar?",
    "questionTelugu": "దావీదు సహోదరుడైన షిమ్యా కుమారుడై తామారును మోసగించుటకు అమ్నోనునకు కుయుక్తి సలహా ఇచ్చినది ఎవరు?",
    "options": [
      "Jonadab",
      "Ahithophel",
      "Hushai",
      "Joab"
    ],
    "optionsTelugu": [
      "యోనాదాబు",
      "అహీతోఫెలు",
      "హుషై",
      "యోవాబు"
    ],
    "correctAnswer": "Jonadab",
    "bibleReference": "2 Samuel 13:3-5",
    "explanation": "Jonadab was a very shrewd man and devised the sickbed scheme.",
    "explanationTelugu": "యోనాదాబు మిక్కిలి తెలివిగలవాడై అమ్నోనునకు దురాలోచన చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "Where did Absalom invite his royal brothers for a sheep-shearing feast where Amnon was struck down?",
    "questionTelugu": "అమ్నోనును హతమార్చుటకు అబ్షాలోము రాజకుమారులందరినీ గొర్రెల బొచ్చు కత్తిరించు విందుకు పిలిచిన స్థలము ఏది?",
    "options": [
      "Baal Hazor near Ephraim",
      "Hebron",
      "Bethlehem",
      "Shechem"
    ],
    "optionsTelugu": [
      "ఎఫ్రాయిము సమీపమునందలి బయల్హాసోరు",
      "హెబ్రోను",
      "బేత్లెహేము",
      "షెకెము"
    ],
    "correctAnswer": "Baal Hazor near Ephraim",
    "bibleReference": "2 Samuel 13:23",
    "explanation": "Absalom had sheep shearers at Baal Hazor and invited all the king’s sons to feast.",
    "explanationTelugu": "అబ్షాలోము బయల్హాసోరులో విందు సిద్ధపరచి అన్నలందరినీ ఆహ్వానించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "To which maternal grandfather, King Talmai of Geshur, did Absalom flee in exile for three years?",
    "questionTelugu": "అమ్నోనును చంపిన తరువాత అబ్షాలోము మూడు సంవత్సరాలు తలదాచుకున్న గెషూరు రాజైన అతని తాత ఎవరు?",
    "options": [
      "Talmai son of Ammihud",
      "Hiram of Tyre",
      "Hadadezer",
      "Nahash of Ammon"
    ],
    "optionsTelugu": [
      "అమ్మీహూదు కుమారుడైన తల్మై",
      "హీరాము",
      "హదదేజెరు",
      "నాహాషు"
    ],
    "correctAnswer": "Talmai son of Ammihud",
    "bibleReference": "2 Samuel 13:37-38",
    "explanation": "Absalom fled and stayed three years in Geshur with his grandfather King Talmai.",
    "explanationTelugu": "అబ్షాలోము గెషూరు రాజైన తన తాత తల్మై యొద్దకు పారిపోయి మూడు సంవత్సరములు ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "What bold action did Absalom take to force a meeting with commander Joab in Jerusalem?",
    "questionTelugu": "యోవాబు తన వద్దకు రానందుకు అబ్షాలోము అతనిని రప్పించుటకు చేసిన పనేమిటి?",
    "options": [
      "Set Joab’s adjacent barley field on fire",
      "Arrested Joab’s servants",
      "Surrounded Joab’s house with soldiers",
      "Stole Joab’s chariot horses"
    ],
    "optionsTelugu": [
      "యోవాబుకు చెందిన యవల చేనుకు నిప్పు పెట్టించెను",
      "సేవకులను బంధించెను",
      "ఇంటిని ముట్టడించెను",
      "గుర్రాలను దొంగిలించెను"
    ],
    "correctAnswer": "Set Joab’s adjacent barley field on fire",
    "bibleReference": "2 Samuel 14:30-31",
    "explanation": "Absalom’s servants set Joab’s field on fire, causing Joab to come immediately.",
    "explanationTelugu": "అబ్షాలోము సేవకులు యోవాబు చేనుకు నిప్పు పెట్టగా యోవాబు లేచి అబ్షాలోము యొద్దకు వచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "How many sons and daughters were born to Absalom in Jerusalem?",
    "questionTelugu": "యెరూషలేములో అబ్షాలోమునకు జన్మించిన కుమారుల మరియు కుమార్తెల సంఖ్య ఎంత?",
    "options": [
      "Three sons and one beautiful daughter named Tamar",
      "Five sons and no daughters",
      "Seven sons and two daughters",
      "Two sons and four daughters"
    ],
    "optionsTelugu": [
      "ముగ్గురు కుమారులు మరియు తామారు అను సౌందర్యవతియైన కుమార్తె",
      "ఐదుగురు కుమారులు",
      "ఏడుగురు కుమారులు",
      "ఇద్దరు కుమారులు"
    ],
    "correctAnswer": "Three sons and one beautiful daughter named Tamar",
    "bibleReference": "2 Samuel 14:27",
    "explanation": "Three sons were born to Absalom, and one daughter whose name was Tamar, a woman of beautiful appearance.",
    "explanationTelugu": "అబ్షాలోమునకు ముగ్గురు కుమారులును, తామారు అను సురూపియైన కుమార్తెయు పుట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which Philistine commander from Gath demonstrated supreme family loyalty to exiled King David?",
    "questionTelugu": "దావీదు యెరూషలేమును విడిచి పారిపోవుచుండగా ఆయనను విడువక వెంబడించిన గాతు వాడైన సేనాని ఎవరు?",
    "options": [
      "Ittai the Gittite",
      "Abner",
      "Benaiah",
      "Goliath"
    ],
    "optionsTelugu": [
      "గిత్తీయుడైన ఇత్తై",
      "అబ్నేరు",
      "బెనాయా",
      "గొల్యాతు"
    ],
    "correctAnswer": "Ittai the Gittite",
    "bibleReference": "2 Samuel 15:19-21",
    "explanation": "Ittai declared: \"As surely as the Lord lives, wherever my lord the king may be, whether for life or death, there will your servant be.\"",
    "explanationTelugu": "ఇత్తై: \"యెహోవా జీవముతోడు, రాజైన నా ప్రభువు మరణమందైనను జీవమందైనను ఎక్కడ ఉండునో నీ దాసుడనైన నేను అక్కడే ఉందును\" అని పలికెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which two high priests carried the Ark of God out toward Mount Olives before David sent them back?",
    "questionTelugu": "దావీదుతో పాటు మందసమును మోసుకొనివచ్చి తిరిగి నగరములోనికి పంపబడిన ఇద్దరు ప్రధాన యాజకులు ఎవరు?",
    "options": [
      "Zadok and Abiathar",
      "Hophni and Phinehas",
      "Nadab and Abihu",
      "Eleazar and Ithamar"
    ],
    "optionsTelugu": [
      "సాదోకు మరియు అబ్యాతారు",
      "హొఫ్నీ మరియు ఫీనెహాసు",
      "నాదాబు మరియు అబీహు",
      "ఎలియాజరు మరియు ఈతామారు"
    ],
    "correctAnswer": "Zadok and Abiathar",
    "bibleReference": "2 Samuel 15:24-29",
    "explanation": "David told Zadok and Abiathar to carry the Ark of God back into the city of Jerusalem.",
    "explanationTelugu": "దావీదు సాదోకుతో: \"దేవుని మందసమును నగరములోనికి తిరిగి తీసికొనిపొమ్ము\" అని ఆజ్ఞాపించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "How did King David ascend the Mount of Olives while fleeing from his son Absalom?",
    "questionTelugu": "అబ్షాలోము తిరుగుబాటు వలన పారిపోవుచున్న దావీదు ఒలీవల కొండను ఎలా ఎక్కెను?",
    "options": [
      "Weeping as he went, with his head covered and walking barefoot",
      "Riding a golden royal chariot with trumpets",
      "Marching in full battle armor with songs",
      "Carried in a velvet litter by soldiers"
    ],
    "optionsTelugu": [
      "తల కప్పుకొని, చెప్పులు లేక పాదచారియై ఏడ్చుచు ఎక్కెను",
      "బంగారు రథముపై",
      "యుద్ధ కవచముతో",
      "పల్లకీలో"
    ],
    "correctAnswer": "Weeping as he went, with his head covered and walking barefoot",
    "bibleReference": "2 Samuel 15:30",
    "explanation": "David continued up the Mount of Olives, weeping as he went; his head was covered and he was barefoot.",
    "explanationTelugu": "దావీదు తల కప్పుకొని చెప్పులు లేక ఒలీవల కొండ ఎక్కుచు ఏడ్చెను; అతనితో ఉన్న ప్రజలందరును ఏడ్చిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "Who hurled curses and stones at King David at Bahurim, calling him a \"man of blood\"?",
    "questionTelugu": "బహూరీము వద్ద దావీదుపై రాళ్లు రువ్వుచు \"నరహంతకుడా\" అని శపించిన సౌలు వంశపు మనుష్యుడు ఎవరు?",
    "options": [
      "Shimei son of Gera",
      "Ziba",
      "Doeg",
      "Nabal"
    ],
    "optionsTelugu": [
      "గేరా కుమారుడైన షిమీ",
      "సీబా",
      "దోయేగు",
      "నాబాలు"
    ],
    "correctAnswer": "Shimei son of Gera",
    "bibleReference": "2 Samuel 16:5-7",
    "explanation": "Shimei pelted David and his officials with stones and cursed him continually.",
    "explanationTelugu": "సౌలు కుటుంబీకుడైన షిమీ దావీదు మీద రాళ్లు రువ్వుచు ధూళినెగురగొట్టుచు శపించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "What treacherous counsel did Ahithophel give Absalom to irrevocably destroy any reconciliation with his father?",
    "questionTelugu": "తండ్రితో ఎన్నడూ రాజీపడకుండా ఉండుటకు అహీతోఫెలు అబ్షాలోమునకు ఇచ్చిన దుష్ట సలహా ఏమిటి?",
    "options": [
      "Pitch a tent on the palace roof and sleep with his father’s concubines in the sight of all Israel",
      "Execute all the city elders",
      "Burn down the temple",
      "Flee to Egypt"
    ],
    "optionsTelugu": [
      "రాజభవనపు మేడమీద గుడారము వేసి ఇశ్రాయేలీయులందరి యెదుట తండ్రి ఉపపత్నుల యొద్దకు ప్రవేశించుము",
      "పెద్దలందరినీ చంపుము",
      "మందిరమును తగులబెట్టుము",
      "ఐగుప్తుకు పారిపొమ్ము"
    ],
    "correctAnswer": "Pitch a tent on the palace roof and sleep with his father’s concubines in the sight of all Israel",
    "bibleReference": "2 Samuel 16:21-22",
    "explanation": "Ahithophel advised this to show that Absalom was totally committed against his father, fulfilling Nathan’s prophecy.",
    "explanationTelugu": "ఇది నాతాను ప్రవచించినట్లుగా దావీదు ఇంటిపై జరిగిన బహిరంగ తీర్పు నెరవేర్పు.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "Where did priest messengers Jonathan and Ahimaaz hide when Absalom’s soldiers searched Bahurim?",
    "questionTelugu": "అబ్షాలోము సైనికులు వెదకుచుండగా యాజక కుమారులైన యోనాతాను అహిమయస్సులు బహూరీములో ఎక్కడ దాగిరి?",
    "options": [
      "Inside an empty courtyard well, covered by a woman with grain spread over it",
      "Under sheepskins in a cave",
      "In a temple secret cellar",
      "In a mountain tomb"
    ],
    "optionsTelugu": [
      "ఇంటి ముంగిటి బావిలో దిగగా ఒక స్త్రీ బావి మూతపై ధాన్యము చల్లెను",
      "గొర్రె చర్మాల కింద",
      "మందిరపు నేలమాళిగలో",
      "సమాధిలో"
    ],
    "correctAnswer": "Inside an empty courtyard well, covered by a woman with grain spread over it",
    "bibleReference": "2 Samuel 17:18-19",
    "explanation": "A woman took a covering and spread it over the well’s mouth and scattered grain over it, saving them.",
    "explanationTelugu": "ఒక స్త్రీ బావి మూతపై గుడ్డ పరిచి ధాన్యము ఆరబోసినందున సైనికులు వారిని కనుగొనలేకపోయిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "What did proud counselor Ahithophel do when he saw that his advice was rejected for Hushai’s?",
    "questionTelugu": "తన సలహాను తోసిపుచ్చి హుషై సలహాను అంగీకరించారని చూచినప్పుడు అహీతోఫెలు ఏమి చేసెను?",
    "options": [
      "Saddled his donkey, went home, set his house in order, and hanged himself",
      "Joined the Philistine army",
      "Begged David for pardon",
      "Became a shepherd"
    ],
    "optionsTelugu": [
      "గాడిదను కట్టుకొని తన ఊరికి వెళ్లి ఇంటిని చక్కబెట్టుకొని ఉరిపెట్టుకొని చనిపోయెను",
      "ఫిలిష్తీయులలో చేరెను",
      "దావీదును క్షమాపణ కోరెను",
      "గొర్రెల కాపరియాయెను"
    ],
    "correctAnswer": "Saddled his donkey, went home, set his house in order, and hanged himself",
    "bibleReference": "2 Samuel 17:23",
    "explanation": "Ahithophel put his house in order and hanged himself, knowing Absalom’s rebellion would fail.",
    "explanationTelugu": "అహీతోఫెలు తన ఇంటిని చక్కబెట్టుకొని ఉరివేసికొని చనిపోయెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "Which three generous chieftains brought beds, basins, cheese, and roasted grain to exhausted David at Mahanaim?",
    "questionTelugu": "మహనయీము వద్ద అలసిపోయిన దావీదు సైన్యమునకు మంచములు, పాత్రలు, తేనె, వెన్నెలను తెచ్చిన ముగ్గురు పెద్దలు ఎవరు?",
    "options": [
      "Shobi, Makir, and Barzillai the Gileadite",
      "Joab, Abishai, and Asahel",
      "Ephron, Abimelech, and Phicol",
      "Zadok, Abiathar, and Jonathan"
    ],
    "optionsTelugu": [
      "షోబీ, మాకీరు, మరియు గిలాదీయుడైన బర్జిల్లయి",
      "యోవాబు, అబీషై, మరియు ఆశాహేలు",
      "ఎఫ్రోను, అబీమెలెకు, మరియు ఫీకోలు",
      "సాదోకు, అబ్యాతారు, మరియు యోనాతాను"
    ],
    "correctAnswer": "Shobi, Makir, and Barzillai the Gileadite",
    "bibleReference": "2 Samuel 17:27-29",
    "explanation": "They brought supplies saying: \"The people have become exhausted and hungry and thirsty in the wilderness.\"",
    "explanationTelugu": "అరణ్యములో ప్రజలు ఆకలిగొని అలసియున్నారని వారు సమృద్ధిగా ఆహార సామగ్రిని తెచ్చిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "How did Absalom meet his unexpected death in the thick forest of Ephraim?",
    "questionTelugu": "ఎఫ్రాయిము అడవిలో అబ్షాలోము ఎలా చిక్కుకొని మరణించెను?",
    "options": [
      "His long hair got caught in the boughs of a great oak, leaving him dangling between heaven and earth",
      "Fell into a pit of lions",
      "Was trampled by his own horses",
      "Drowned in the Jordan river"
    ],
    "optionsTelugu": [
      "కంచరగాడిదపై పోవుచుండగా పెద్ద సింధూర వృక్షపు కొమ్మలలో తల చిక్కుకొని వేలాడెను",
      "సింహాల గోతిలో పడెను",
      "గుర్రాల క్రింద పడెను",
      "నదిలో మునిగెను"
    ],
    "correctAnswer": "His long hair got caught in the boughs of a great oak, leaving him dangling between heaven and earth",
    "bibleReference": "2 Samuel 18:9-14",
    "explanation": "Absalom’s head caught fast in the oak while his mule ran on, and Joab thrust three spears into his heart.",
    "explanationTelugu": "అబ్షాలోము తల చెట్టు కొమ్మల్లో చిక్కుకొనగా గాడిద వెళ్లిపోయెను; యోవాబు అతని గుండెల్లో ఈటెలను నాటెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "How did commander Joab harshly rebuke King David for demoralizing his victorious family of soldiers?",
    "questionTelugu": "విజయము పొందిన సైన్యమును నిరుత్సాహపరచినందుకు యోవాబు దావీదును ఎలా గద్దించెను?",
    "options": [
      "\"Today you have humiliated all your men who just saved your life and the lives of your sons and daughters\"",
      "\"Give me all your gold\"",
      "\"Step down as king immediately\"",
      "\"Execute the Cushite runner\""
    ],
    "optionsTelugu": [
      "\"ఈ దినమున నీ ప్రాణమును నీ కుమారుల కుమార్తెల ప్రాణములను రక్షించిన నీ దాసులందరినీ సిగ్గుపరిచితివి\"",
      "\"బంగారమంతా నాకు ఇమ్ము\"",
      "\"సింహాసనమును దిగిపొమ్ము\"",
      "\"వార్తాహరుని చంపుము\""
    ],
    "correctAnswer": "\"Today you have humiliated all your men who just saved your life and the lives of your sons and daughters\"",
    "bibleReference": "2 Samuel 19:5-6",
    "explanation": "Joab warned that if David did not go out and encourage the men, not one soldier would stay with him by nightfall.",
    "explanationTelugu": "యోవాబు: \"నీవు వెళ్లి సైనికులను ఓదార్చనియెడల ఒక్కడును నీయొద్ద ఉండడని\" గద్దించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "How old was loyal patriarch Barzillai the Gileadite when he escorted King David across the Jordan?",
    "questionTelugu": "దావీదు రాజును యొర్దాను దాటించుటకు వచ్చిన గిలాదీయుడైన బర్జిల్లయి వయస్సు ఎంత?",
    "options": [
      "Eighty years old",
      "One hundred years old",
      "Sixty years old",
      "Seventy years old"
    ],
    "optionsTelugu": [
      "ఎనభై సంవత్సరాలు",
      "నూరు సంవత్సరాలు",
      "అరవై సంవత్సరాలు",
      "డెబ్బై సంవత్సరాలు"
    ],
    "correctAnswer": "Eighty years old",
    "bibleReference": "2 Samuel 19:32, 35",
    "explanation": "Barzillai was eighty years old and declined royal palace living, asking that his son Chimham go instead.",
    "explanationTelugu": "బర్జిల్లయికి 80 ఏళ్లు; తాను వృద్ధుడైనందున తన కుమారుడైన కిమ్హామును రాజు వెంట పంపెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "How did a wise woman save the entire city of Abel Beth Maakah from Joab’s siege army in 2 Samuel 20?",
    "questionTelugu": "2 సమూయేలు 20 లో అబేల్బేత్మయకా నగరమును నాశనము కాకుండా కాపాడిన జ్ఞానముగల స్త్రీ ఏమి చేసెను?",
    "options": [
      "Had rebel Sheba son of Bikri beheaded and his head thrown over the wall to Joab",
      "Paid ten talents of gold",
      "Opened the gates to surrender the whole town",
      "Poisoned the city wells"
    ],
    "optionsTelugu": [
      "ద్రోహియైన బిఖ్రీ కుమారుడైన షెబ తలను కోసి గోడపైనుండి యోవాబు వద్దకు పడవేయించెను",
      "బంగారము చెల్లించెను",
      "పట్టణాన్ని అప్పగించెను",
      "బావులలో విషము కలిపెను"
    ],
    "correctAnswer": "Had rebel Sheba son of Bikri beheaded and his head thrown over the wall to Joab",
    "bibleReference": "2 Samuel 20:16-22",
    "explanation": "The woman spoke with Joab, convinced the townspeople, and threw Sheba’s head over the wall, preserving the peaceful city.",
    "explanationTelugu": "ఆ జ్ఞానవంతురాలైన స్త్రీ నగర ప్రజలను ఒప్పించి షెబ తలను గోడమీద నుండి క్రిందికి పడవేసి శాంతిని కాపాడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "Where did King David bury the recovered bones of Saul and his son Jonathan?",
    "questionTelugu": "సౌలు మరియు యోనాతానుల ఎముకలను తెప్పించి దావీదు ఏ కుటుంబ సమాధిలో పాతిపెట్టెను?",
    "options": [
      "In the ancestral tomb of Kish at Zela in Benjamin",
      "In the Cave of Machpelah",
      "In the City of David",
      "On Mount Carmel"
    ],
    "optionsTelugu": [
      "బెన్యామీను దేశమందలి సేలాలోని కీషు కుటుంబ సమాధిలో",
      "మక్పేలా గుహలో",
      "దావీదు పురములో",
      "కర్మెలు పర్వతముపై"
    ],
    "correctAnswer": "In the ancestral tomb of Kish at Zela in Benjamin",
    "bibleReference": "2 Samuel 21:14",
    "explanation": "They buried the bones of Saul and his son Jonathan in the tomb of Saul’s father Kish at Zela.",
    "explanationTelugu": "సౌలు తండ్రియైన కీషు కుటుంబ సమాధియందు వారి ఎముకలను గౌరవముగా పాతిపెట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which of David’s older sons exalted himself as king at the stone of Zoheleth near En Rogel while David was elderly?",
    "questionTelugu": "దావీదు వృద్ధుడై యుండగా ఏన్ రోగెలు వద్ద జొహెలెతు రాతియొద్ద తననుతాను హెచ్చించుకొని రాజైన దావీదు కుమారుడు ఎవరు?",
    "options": [
      "Adonijah son of Haggith",
      "Solomon",
      "Shephatiah",
      "Ithream"
    ],
    "optionsTelugu": [
      "హగ్గీతు కుమారుడైన అదోనీయా",
      "సొలొమోను",
      "షెఫట్యా",
      "ఇత్రెయాము"
    ],
    "correctAnswer": "Adonijah son of Haggith",
    "bibleReference": "1 Kings 1:5, 9",
    "explanation": "Adonijah conferred with Joab and Abiathar the priest and sacrificed sheep and cattle to crown himself.",
    "explanationTelugu": "అదోనీయా తనే రాజనని చాటుకొని యోవాబును అబ్యాతారును పిలిపించి విందు చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "At which sacred spring was young Solomon anointed king by Zadok the priest and Nathan the prophet?",
    "questionTelugu": "సాదోకు యాజకుడు మరియు నాతాను ప్రవక్తలచే సొలొమోను ఏ నీటి ఊట యొద్ద రాజుగా అభిషేకింపబడెను?",
    "options": [
      "Spring of Gihon",
      "En Rogel",
      "Pool of Siloam",
      "Pool of Bethesda"
    ],
    "optionsTelugu": [
      "గీహోను ఊట యొద్ద",
      "ఏన్ రోగెలు",
      "సిలోయము కోనేరు",
      "బేతెస్ద కోనేరు"
    ],
    "correctAnswer": "Spring of Gihon",
    "bibleReference": "1 Kings 1:38-39",
    "explanation": "Zadok took the horn of oil from the sacred tent and anointed Solomon at Gihon, and all the people blew trumpets.",
    "explanationTelugu": "సాదోకు గుడారము నుండి తైలపు కొమ్మును తెచ్చి గీహోను వద్ద సొలొమోనును అభిషేకించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "How did King Solomon expose the true mother in the famous baby dispute in 1 Kings 3?",
    "questionTelugu": "1 రాజులు 3 లో సజీవముగా ఉన్న బిడ్డ యొక్క నిజమైన తల్లిని సొలొమోను ఎలా కనిపెట్టెను?",
    "options": [
      "Ordered the baby cut in half with a sword, knowing the true mother would rather forfeit her child than see him die",
      "Weighed the child against gold",
      "Asked the temple priests to cast lots",
      "Looked at facial resemblance"
    ],
    "optionsTelugu": [
      "కత్తితో బిడ్డను రెండు ముక్కలుగా చేయుమనెను; నిజమైన తల్లి బిడ్డ చావకూడదని బిడ్డను వేరొక స్త్రీకి ఇవ్వమంది",
      "బంగారముతో తూచెను",
      "చీట్లు వేయించెను",
      "ముఖ పోలికలను చూచెను"
    ],
    "correctAnswer": "Ordered the baby cut in half with a sword, knowing the true mother would rather forfeit her child than see him die",
    "bibleReference": "1 Kings 3:25-27",
    "explanation": "The woman whose son was alive was filled with compassion for her child and said: \"Please, my lord, give her the living baby!\"",
    "explanationTelugu": "బిడ్డ తల్లి పేగులు కరిగిపోయి: \"నా యేలినవాడా, బిడ్డను చంపవద్దు, ఆమెకే ఇచ్చివేయుము\" అని ప్రాధేయపడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who was the master bronze craftsman of Tyre, whose mother was a widow from the tribe of Naphtali?",
    "questionTelugu": "నఫ్తాలి గోత్రపు విధవరాలి కుమారుడై సొలొమోను మందిరపు ఇత్తడి స్తంభములను చేసిన నిపుణుడు ఎవరు?",
    "options": [
      "Huram (Hiram)",
      "Bezalel",
      "Oholiab",
      "Adoniram"
    ],
    "optionsTelugu": [
      "హూరాము (హీరాము)",
      "బెసలేలు",
      "ఒహోలీయాబు",
      "అదోనీరాము"
    ],
    "correctAnswer": "Huram (Hiram)",
    "bibleReference": "1 Kings 7:13-14",
    "explanation": "King Solomon brought Huram from Tyre; his mother was a widow from Naphtali and his father had been a bronze worker.",
    "explanationTelugu": "హూరాము నఫ్తాలి గోత్రపు విధవరాలి కుమారుడు; ఇత్తడి పనియంతటిలో గొప్ప ప్రజ్ఞావంతుడు.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "What names were given to the two colossal bronze pillars erected at the entrance of Solomon’s temple portico?",
    "questionTelugu": "సొలొమోను మందిరపు మంటపము వద్ద నిలబెట్టిన రెండు ఇత్తడి స్తంభముల పేర్లు ఏమిటి?",
    "options": [
      "Jachin (\"He establishes\") and Boaz (\"In Him is strength\")",
      "Urim and Thummim",
      "Mahlon and Kilion",
      "Ichabod and Ebenezer"
    ],
    "optionsTelugu": [
      "యాకీను (ఆయన స్థిరపరచును) మరియు బోయజు (ఆయనయందే బలమున్నది)",
      "ఊరీము మరియు తుమ్మీము",
      "మహ్లోను మరియు కిల్యోను",
      "ఈకాబోదు మరియు ఎబినెజరు"
    ],
    "correctAnswer": "Jachin (\"He establishes\") and Boaz (\"In Him is strength\")",
    "bibleReference": "1 Kings 7:21",
    "explanation": "He erected the pillars at the portico of the temple: the south pillar Jachin and the north pillar Boaz.",
    "explanationTelugu": "కుడివైపు స్తంభమునకు యాకీను అనియు, ఎడమవైపు స్తంభమునకు బోయజు అనియు పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "How did foreign royal wives eventually turn aged King Solomon’s heart away from God in 1 Kings 11?",
    "questionTelugu": "1 రాజులు 11 లో వృద్ధుడైన సొలొమోను రాజు హృదయమును అతని అన్య భార్యలు ఎలా త్రిప్పివేసిరి?",
    "options": [
      "Led him to build high places and worship Ashtoreth, Chemosh, and Molech",
      "Persuaded him to destroy the temple",
      "Forced him to live in Egypt",
      "Robbed his royal treasury"
    ],
    "optionsTelugu": [
      "అష్తోరెతు, కెమోషు, మరియు మోలెకు విగ్రహములకు బలిపీఠములు కట్టి పూజించునట్లు చేసిరి",
      "మందిరమును పడగొట్టించిరి",
      "ఐగుప్తులో నివసించమనిరి",
      "ఖజానాను దోచుకొనిరి"
    ],
    "correctAnswer": "Led him to build high places and worship Ashtoreth, Chemosh, and Molech",
    "bibleReference": "1 Kings 11:4-8",
    "explanation": "As Solomon grew old, his wives turned his heart after other gods, and his heart was not fully devoted to the Lord his God.",
    "explanationTelugu": "సొలొమోను వృద్ధాప్యమందు అతని భార్యలు అతని హృదయమును అన్య దేవతలవైపు త్రిప్పివేసిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which prophet tore his new cloak into twelve pieces and gave ten to Jeroboam son of Nebat?",
    "questionTelugu": "తన క్రొత్త వస్త్రమును పన్నెండు ముక్కలుగా చింపి పది ముక్కలను నెబాతు కుమారుడైన యరొబామునకు ఇచ్చిన ప్రవక్త ఎవరు?",
    "options": [
      "Ahijah the Shilonite",
      "Shemaiah",
      "Nathan",
      "Jehu son of Hanani"
    ],
    "optionsTelugu": [
      "షీలోనియుడైన అహీయా",
      "షెమయా",
      "నాతాను",
      "హనానీ కుమారుడైన యెహూ"
    ],
    "correctAnswer": "Ahijah the Shilonite",
    "bibleReference": "1 Kings 11:29-31",
    "explanation": "Ahijah said: \"Take ten pieces for yourself, for the Lord God of Israel says: I am going to tear the kingdom out of Solomon’s hand and give you ten tribes.\"",
    "explanationTelugu": "అహీయా: \"పది ముక్కలను తీసికొనుము; యెహోవా పది గోత్రములను నీ చేతికిచ్చును\" అని ప్రవచించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "Whose arrogant advice did King Rehoboam follow that fractured the united kingdom of Israel?",
    "questionTelugu": "ఇశ్రాయేలు ఐక్య రాజ్యము రెండుగా చీలిపోవుటకు రెహబాము రాజు ఎవరి అవివేక సలహాను అనుసరించెను?",
    "options": [
      "The young men who had grown up with him and were serving him",
      "The elder counselors of Solomon",
      "The High Priest",
      "The Queen Mother"
    ],
    "optionsTelugu": [
      "తనతోపాటు పెరిగి తన యెదుట నిలిచిన యౌవనస్థుల సలహాను",
      "వృద్ధులైన పెద్దల సలహాను",
      "ప్రధాన యాజకుని మాటను",
      "రాజమాత మాటను"
    ],
    "correctAnswer": "The young men who had grown up with him and were serving him",
    "bibleReference": "1 Kings 12:8-14",
    "explanation": "Rehoboam rejected the advice the elders gave him and answered the people harshly on the advice of the young men.",
    "explanationTelugu": "రెహబాము పెద్దల సలహాను త్రోసిపుచ్చి తన తోటి యౌవనుల సలహా ప్రకారం ప్రజలతో కఠినముగా మాట్లాడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "Why did King Asa of Judah strip his own grandmother Maakah of her royal title of Queen Mother?",
    "questionTelugu": "యూదా రాజైన ఆసా తన అవ్వయైన మయకాను పట్టపురాణి పదవినుండి ఎందుకు తొలగించెను?",
    "options": [
      "Because she had made an abominable Asherah pole for idolatry",
      "Because she stole temple silver",
      "Because she allied with Egypt",
      "Because of her old age"
    ],
    "optionsTelugu": [
      "ఆమె ఒక అసహ్యకరమైన అషేరా విగ్రహమును చేయించినందున",
      "మందిరపు వెండిని దొంగిలించినందున",
      "ఐగుప్తుతో స్నేహము చేసినందున",
      "వృద్ధురాలైనందున"
    ],
    "correctAnswer": "Because she had made an abominable Asherah pole for idolatry",
    "bibleReference": "1 Kings 15:13",
    "explanation": "King Asa deposed his grandmother Maakah from her position as queen mother because she had made a repulsive Asherah pole.",
    "explanationTelugu": "ఆసా తన అవ్వయైన మయకా అషేరా విగ్రహమును చేయించినందున ఆమెను పట్టపురాణి పదవినుండి తీసివేసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "What curse of Joshua was fulfilled when Hiel of Bethel rebuilt the ruined city of Jericho?",
    "questionTelugu": "బేతేలు వాడైన హీయేలు యెరికోను తిరిగి కట్టినప్పుడు నెరవేరిన యెహోషువ శాపవాక్యము ఏమిటి?",
    "options": [
      "Laid its foundation at the cost of his firstborn Abiram, and set up its gates at the cost of his youngest Segub",
      "Lost all his gold to raiders",
      "The walls collapsed in an earthquake",
      "His servants fled to Syria"
    ],
    "optionsTelugu": [
      "దాని పునాది వేయుటలో జ్యేష్ఠ కుమారుడైన అబీరామును, గుమ్మములను ఎత్తుటలో కనిష్ఠుడైన సెగూబును కోల్పోయెను",
      "బంగారమంతా పోయెను",
      "గోడలు భూకంపములో కూలెను",
      "దాసులు పారిపోయిరి"
    ],
    "correctAnswer": "Laid its foundation at the cost of his firstborn Abiram, and set up its gates at the cost of his youngest Segub",
    "bibleReference": "1 Kings 16:34, Joshua 6:26",
    "explanation": "In Ahab’s time, Hiel rebuilt Jericho at the cost of his firstborn and youngest sons, fulfilling Joshua’s prophecy.",
    "explanationTelugu": "యెహోషువ పలికిన శాపము చొప్పున హీయేలు తన పెద్ద కుమారుని చిన్న కుమారుని ప్రాణముల మూల్యముతో యెరికోను కట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "How did godly palace administrator Obadiah risk his life to save the Lord’s prophets during Jezebel’s purge?",
    "questionTelugu": "యెజెబెలు ప్రవక్తలను చంపించుచుండగా దేవునికి భయపడు గృహనిర్వాహకుడైన ఓబద్యా ఏమి చేసెను?",
    "options": [
      "Hid a hundred prophets in two caves by fifties and supplied them with food and water",
      "Fought Jezebel’s army single-handedly",
      "Helped them flee across the Euphrates",
      "Paid bribes to Phoenician merchants"
    ],
    "optionsTelugu": [
      "నూరుమంది ప్రవక్తలను గుహలలో ఏబదేసిమంది చొప్పున దాచి వారికి అన్నపానములను ఇచ్చి పోషించెను",
      "సైన్యముతో పోరాడెను",
      "యూఫ్రటీసు నది దాటించెను",
      "లంచము ఇచ్చెను"
    ],
    "correctAnswer": "Hid a hundred prophets in two caves by fifties and supplied them with food and water",
    "bibleReference": "1 Kings 18:3-4",
    "explanation": "While Jezebel was killing the Lord’s prophets, Obadiah hid a hundred prophets in two caves and supplied them with bread and water.",
    "explanationTelugu": "ఓబద్యా యెహోవాయందు మిక్కిలి భయభక్తులు గలవాడై నూరుమంది ప్రవక్తలను గుహలలో దాచి కాపాడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "Why did righteous Naboth the Jezreelite refuse King Ahab’s royal offer to buy his vineyard?",
    "questionTelugu": "యెజ్రెయేలీయుడైన నాబోతు తన ద్రాక్షతోటను ఆహాబు రాజునకు అమ్ముటకు ఎందుకు నిరాకరించెను?",
    "options": [
      "\"The Lord forbid that I should give you the inheritance of my ancestors\"",
      "\"The price of silver offered was too low\"",
      "\"He preferred selling wine to Damascus\"",
      "\"The king’s palace was too loud\""
    ],
    "optionsTelugu": [
      "\"నా పిత్రార్జితమైన స్వాస్థ్యమును నీకిచ్చుటకు యెహోవా నన్ను అడ్డగించును గాక\"",
      "\"వెండి తక్కువైనందున\"",
      "\"దమస్కుకు అమ్మాలని\"",
      "\"రాజభవనము శబ్దముగా ఉన్నందున\""
    ],
    "correctAnswer": "\"The Lord forbid that I should give you the inheritance of my ancestors\"",
    "bibleReference": "1 Kings 21:3",
    "explanation": "Naboth strictly adhered to the Levitical law forbidding permanent alienation of family ancestral lands.",
    "explanationTelugu": "పిత్రార్జితమైన స్వాస్థ్యమును అన్యాయముగా విక్రయించకూడదను దేవుని ధర్మశాస్త్రమును నాబోతు గౌరవించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "How did wicked Queen Jezebel orchestrate the judicial murder of Naboth?",
    "questionTelugu": "నాబోతును అన్యాయముగా రాళ్లతో కొట్టి చంపించుటకు దుష్ట రాణియైన యెజెబెలు ఏ కుట్ర చేసెను?",
    "options": [
      "Proclaimed a fast and hired two scoundrels to falsely testify that Naboth cursed God and the king",
      "Poisoned his well water",
      "Sent foreign archers at night",
      "Burned down his house"
    ],
    "optionsTelugu": [
      "ఉపవాస దినము ప్రకటించి నాబోతు దేవునిని రాజును దూషించెనని ఇద్దరు పనికిమాలిన మనుష్యులచేత అబద్ధ సాక్ష్యము పలికించెను",
      "బావిలో విషము కలిపెను",
      "బాణములతో కొట్టించెను",
      "ఇంటిని తగులబెట్టెను"
    ],
    "correctAnswer": "Proclaimed a fast and hired two scoundrels to falsely testify that Naboth cursed God and the king",
    "bibleReference": "1 Kings 21:8-13",
    "explanation": "Two scoundrels falsely accused Naboth, and they took him outside the city and stoned him to death.",
    "explanationTelugu": "ఆమె ఆహాబు పేరున ఉత్తరములు రాసి అబద్ధ సాక్ష్యముతో నాబోతును ఊరి వెలుపల రాళ్లతో కొట్టించి చంపించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "What remarkable divine intervention spared Ahab from seeing the destruction of his family during his own lifetime?",
    "questionTelugu": "ఆహాబు తన జీవితకాలములో ఆ తీర్పు చూడకుండా తప్పించుకొనుటకు కారణమైన అతని ప్రతిస్పందన ఏమిటి?",
    "options": [
      "He tore his clothes, put on sackcloth, fasted, and walked softly before God in humble repentance",
      "He built ten new altars",
      "He sent Jezebel away to Tyre",
      "He gave away all his chariots"
    ],
    "optionsTelugu": [
      "బట్టలు చింపుకొని, గోనెపట్ట కట్టుకొని, ఉపవాసముండి వినయముగా నడచుకొనుచు పశ్చాత్తాపపడినందున",
      "క్రొత్త బలిపీఠములు కట్టినందున",
      "యెజెబెలును వెళ్లగొట్టినందున",
      "రథములను దానము చేసినందున"
    ],
    "correctAnswer": "He tore his clothes, put on sackcloth, fasted, and walked softly before God in humble repentance",
    "bibleReference": "1 Kings 21:27-29",
    "explanation": "Because Ahab humbled himself, the Lord said: \"I will not bring disaster in his day, but in his son’s days.\"",
    "explanationTelugu": "ఆహాబు దేవుని యెదుట తన్నుతాను తగ్గించుకొనినందున అతని దినములలో కాక అతని కుమారుని దినములలో ఆ తీర్పు వచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "What special miracle did Elisha perform for the destitute widow of a prophet whose two boys were to be taken as slaves?",
    "questionTelugu": "తన ఇద్దరు కుమారులు అప్పులవాళ్లకు బానిసలుగా పోవుచుండగా ప్రవక్తల శిష్యుని విధవరాలి కొరకు ఎలీషా చేసిన అద్భుతము ఏమిటి?",
    "options": [
      "Multiplied her single small flask of oil until it filled every borrowed vessel to pay all debts",
      "Gave her gold coins from Samaria",
      "Turned stones into bread loaves",
      "Commanded the creditor to die"
    ],
    "optionsTelugu": [
      "కుండలోని కొంచెము నూనెను పొరుగువారి పాత్రలన్నిటిలో నిండువరకు విస్తరింపజేసి అప్పులన్నీ తీర్చెను",
      "బంగారు నాణేలు ఇచ్చెను",
      "రాళ్లను రొట్టెలుగా చేసెను",
      "అప్పులవానిని శపించెను"
    ],
    "correctAnswer": "Multiplied her single small flask of oil until it filled every borrowed vessel to pay all debts",
    "bibleReference": "2 Kings 4:1-7",
    "explanation": "She poured oil into all the jars until none were left, sold the oil, paid her debts, and lived on the rest with her sons.",
    "explanationTelugu": "ఆమె ఆ నూనెను అమ్మి అప్పు తీర్చి శేషించిన దానితో తన కుమారులతో కలిసి జీవించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "What severe family consequence fell upon Elisha’s servant Gehazi for greedily extracting gifts from Naaman?",
    "questionTelugu": "నైమాను నుండి అత్యాశతో వెండి బట్టలు దొంగిలించినందుకు ఎలీషా సేవకుడైన గేహజీకి మరియు అతని సంతానమునకు వచ్చిన శిక్ష ఏది?",
    "options": [
      "Naaman’s leprosy clung to Gehazi and his descendants forever",
      "He was banished to Damascus",
      "He was struck blind immediately",
      "His children became beggars"
    ],
    "optionsTelugu": [
      "నైమాను కుష్ఠరోగము గేహజీకిని అతని సంతానమునకును శాశ్వతముగా అంటుకొనెను",
      "దమస్కుకు వెళ్లగొట్టబడెను",
      "గ్రుడ్డివాడాయెను",
      "పిల్లలు భిక్షగాళ్లైరి"
    ],
    "correctAnswer": "Naaman’s leprosy clung to Gehazi and his descendants forever",
    "bibleReference": "2 Kings 5:27",
    "explanation": "Elisha pronounced: \"Naaman’s leprosy will cling to you and to your descendants forever.\" And Gehazi left snow-white with leprosy.",
    "explanationTelugu": "ఎలీషా: \"నైమాను కుష్ఠరోగము నీకును నీ సంతానమునకును ఎల్లప్పుడును అంటుకొనును\" అనగానే అతడు హిమమువలె తెల్లని కుష్ఠుగలవాడై బయటకు వెళ్లెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which courageous princess of Judah, daughter of King Jehoram, hid baby prince Joash from murderous Athaliah?",
    "questionTelugu": "రాజవంశపు పిల్లలందరినీ చంపిన అతల్యా నుండి తప్పించి శిశువైన యోవాషును రహస్యముగా దాచిన రాజకుమారి ఎవరు?",
    "options": [
      "Jehosheba (Jehoshabeath)",
      "Athaliah",
      "Huldah",
      "Maakah"
    ],
    "optionsTelugu": [
      "యెహోషెబ (యెహోషబ్యాతు)",
      "అతల్యా",
      "హుల్దా",
      "మయకా"
    ],
    "correctAnswer": "Jehosheba (Jehoshabeath)",
    "bibleReference": "2 Kings 11:2-3, 2 Chronicles 22:11",
    "explanation": "Jehosheba, sister of King Ahaziah and wife of Jehoiada the priest, hid Joash in a bedroom for six years.",
    "explanationTelugu": "యెహోషెబ యెహోయాదా యాజకుని భార్యయై యుండి ఆ శిశువును ఆరు సంవత్సరములు మందిరపు గదిలో దాచి కాపాడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "How old was Joash when High Priest Jehoiada brought him out and crowned him king in the house of the Lord?",
    "questionTelugu": "ప్రధాన యాజకుడైన యెహోయాదా యోవాషును బయటకు తెచ్చి కిరీటము ధరింపజేసి రాజుగా చేసినప్పుడు అతని వయస్సు ఎంత?",
    "options": [
      "Seven years old",
      "Twelve years old",
      "Sixteen years old",
      "Ten years old"
    ],
    "optionsTelugu": [
      "ఏడు సంవత్సరాలు",
      "పన్నెండు సంవత్సరాలు",
      "పదహారు సంవత్సరాలు",
      "పది సంవత్సరాలు"
    ],
    "correctAnswer": "Seven years old",
    "bibleReference": "2 Kings 11:12, 21",
    "explanation": "Jehoiada brought out the king’s son and put the crown on him. Joash was seven years old when he began to reign.",
    "explanationTelugu": "యోవాషు ఏడేండ్ల వాడై యుండి పరిపాలన ఆరంభించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "Why did King Amaziah spare the children of the assassins who had murdered his father King Joash?",
    "questionTelugu": "తన తండ్రి యోవాషును చంపిన హంతకుల పిల్లలను అమాజ్యా రాజు ఎందుకు చంపక విడిచిపెట్టెను?",
    "options": [
      "In obedience to the Law of Moses: \"Fathers shall not be put to death for their children, nor children for their fathers\"",
      "Because they paid huge fines",
      "Because they were too young to remember",
      "Because the priests intervened"
    ],
    "optionsTelugu": [
      "\"తండ్రుల నిమిత్తము పిల్లలును పిల్లల నిమిత్తము తండ్రులును మరణశిక్ష పొందకూడదు\" అను మోషే ధర్మశాస్త్ర వాక్యము చొప్పున",
      "జరిమానా కట్టినందున",
      "వారు చిన్నపిల్లలైనందున",
      "యాజకులు బ్రతిమాలినందున"
    ],
    "correctAnswer": "In obedience to the Law of Moses: \"Fathers shall not be put to death for their children, nor children for their fathers\"",
    "bibleReference": "2 Kings 14:6, Deuteronomy 24:16",
    "explanation": "Amaziah executed the assassins but spared their sons according to the commandment that each dies for his own sin.",
    "explanationTelugu": "ప్రతివాడు తన పాపము నిమిత్తమే మరణశిక్ష పొందవలెనని ధర్మశాస్త్రములో రాయబడిన ఆజ్ఞను అమాజ్యా పాటించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "How did good King Hezekiah seek to unite divided northern and southern families in 2 Chronicles 30?",
    "questionTelugu": "2 దినవృత్తాంతములు 30 లో హిజ్కియా రాజు విడిపోయిన ఉత్తర దక్షిణ కుటుంబాలను ఐక్యపరుచుటకు ఏమి చేసెను?",
    "options": [
      "Sent royal couriers throughout all Israel from Beersheba to Dan inviting all families to celebrate Passover in Jerusalem",
      "Sent soldiers to annex Samaria",
      "Demanded heavy gold tribute",
      "Built a dividing wall at Bethel"
    ],
    "optionsTelugu": [
      "బేయేర్షెబా నుండి దాను వరకు ఇశ్రాయేలు కుటుంబాలన్నిటికీ దూతలను పంపి యెరూషలేములో పస్కాను ఆచరించుటకు పిలిచెను",
      "సైన్యమును పంపెను",
      "పన్నులు వసూలు చేసెను",
      "గోడ కట్టించెను"
    ],
    "correctAnswer": "Sent royal couriers throughout all Israel from Beersheba to Dan inviting all families to celebrate Passover in Jerusalem",
    "bibleReference": "2 Chronicles 30:1-6",
    "explanation": "Couriers went throughout all Israel and Judah inviting estranged families to return to the Lord God of Abraham, Isaac, and Israel.",
    "explanationTelugu": "విడిపోయిన కుటుంబాలన్నిటినీ పస్కా పండుగలో దేవుని యెదుట ఒకే గృహముగా కలుపుటకు హిజ్కియా ఆహ్వానము పంపెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s2_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which prophetess, wife of Shallum keeper of the royal wardrobe, delivered God’s word of mercy to young King Josiah?",
    "questionTelugu": "రాజవస్త్రశాల సంరక్షకుడైన షల్లూము భార్యయై యౌవనుడైన యోషీయా రాజునకు దేవుని కనికరపు సమాధానమును అందించిన ప్రవక్త్రి ఎవరు?",
    "options": [
      "Huldah",
      "Deborah",
      "Miriam",
      "Noadiah"
    ],
    "optionsTelugu": [
      "హుల్దా",
      "దెబోరా",
      "మిర్యాము",
      "నోవద్యా"
    ],
    "correctAnswer": "Huldah",
    "bibleReference": "2 Kings 22:14-20",
    "explanation": "The high priest Hilkiah and the king’s officials consulted Huldah the prophetess who lived in Jerusalem in the New Quarter.",
    "explanationTelugu": "యాజకుడైన హిల్కీయా యోషీయా తరఫున హుల్దా ప్రవక్త్రి యొద్దకు వెళ్లి దేవుని చిత్తమును విచారించెను.",
    "marks": 1
  }
];

export const FAMILY_MEDIUM_MASTERY: QuizQuestion[] = [
  {
    "id": "fam_m_s3_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "How did Persian King Ahasuerus (Xerxes) react when Queen Vashti refused his royal banquet summons in Esther 1?",
    "questionTelugu": "ఎస్తేరు 1 లో రాణియైన వష్తి రాజు విందుకు రమ్మన్న పిలుపును తిరస్కరించినప్పుడు అహష్వేరోషు రాజు ఏమి చేసెను?",
    "options": [
      "Deposed her as queen and issued a royal decree to uphold marital respect across the empire",
      "Forgave her immediately",
      "Made her supreme commander",
      "Sent her to live in Babylon"
    ],
    "optionsTelugu": [
      "ఆమెను పట్టపురాణి పదవినుండి తొలగించి భార్యలు భర్తలను గౌరవించవలెనని సామ్రాజ్యమంతట శాసనము చేసెను",
      "క్షమించెను",
      "సేనాధిపతిగా చేసెను",
      "బబులోనుకు పంపెను"
    ],
    "correctAnswer": "Deposed her as queen and issued a royal decree to uphold marital respect across the empire",
    "bibleReference": "Esther 1:12, 19-22",
    "explanation": "Memukan advised the king that Vashti’s refusal would cause women across Persia to look with contempt on their husbands.",
    "explanationTelugu": "భార్యలందరు తమ భర్తలను ఘనపరచునట్లు రాజు శాసనము చేసి వష్తిని రాణి పదవినుండి తొలగించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "What memorable three-day fast did Queen Esther call among all the Jewish families in Susa before approaching the king?",
    "questionTelugu": "రాజు యొద్దకు వెళ్ళుటకు ముందు షూషనులోని యూదా కుటుంబాలన్నిటికీ ఎస్తేరు రాణి చెప్పిన మూడు దినముల ఉపవాస నియమము ఏమిటి?",
    "options": [
      "\"Do not eat or drink for three days, night or day; I and my attendants will fast as you do\"",
      "\"Eat only vegetables and drink water\"",
      "\"Fast until noon only\"",
      "\"Offer sacrifices of bulls and rams\""
    ],
    "optionsTelugu": [
      "\"మూడు దినములు రాత్రింబగళ్లు అన్నపానములు పుచ్చుకొనకుడి; నేనును నా పనికత్తెలును ఉపవాసముందుము\"",
      "\"కూరగాయలు మాత్రమే తినుడి\"",
      "\"మధ్యాహ్నము వరకు మాత్రమే ఉపవాసముండుడి\"",
      "\"ఎడ్లను బలి అర్పించుడి\""
    ],
    "correctAnswer": "\"Do not eat or drink for three days, night or day; I and my attendants will fast as you do\"",
    "bibleReference": "Esther 4:16",
    "explanation": "Esther resolved: \"When this is done, I will go to the king, even though it is against the law. And if I perish, I perish.\"",
    "explanationTelugu": "ఎస్తేరు: \"నేను నశించిన నశించెదను\" అని పలికి ప్రజలందరితో కలిసి మూడు దినములు ఉపవాసముండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "What did despairing wife of Job say to him when his health broke down with painful boils from head to foot?",
    "questionTelugu": "నడినెత్తినుండి అరికాలువరకు కురుపులు లేచినప్పుడు యోబు భార్య నిరాశతో అతనితో పలికిన మాట ఏమిటి?",
    "options": [
      "\"Are you still maintaining your integrity? Curse God and die!\"",
      "\"Go wash in the Jordan seven times\"",
      "\"Call for the physicians of Egypt\"",
      "\"Let us borrow silver from neighbors\""
    ],
    "optionsTelugu": [
      "\"నీవు ఇంకను యథార్థతను వదలక యుందువా? దేవుని దూషించి మరణము కమ్ము!\"",
      "\"యొర్దానులో ఏడుమారులు మునుగుము\"",
      "\"వైద్యులను పిలువుము\"",
      "\"అప్పు తెచ్చుకొందము\""
    ],
    "correctAnswer": "\"Are you still maintaining your integrity? Curse God and die!\"",
    "bibleReference": "Job 2:9",
    "explanation": "Job answered her: \"You are talking like a foolish woman. Shall we accept good from God, and not trouble?\"",
    "explanationTelugu": "యోబు ఆమెతో: \"ఒక మూర్ఖురాలు మాట్లాడునట్లు నీవు మాట్లాడుచున్నావు; దేవుని వలన మేలు అనుభవించి కీడును అనుభవింపకపోదుమా?\" అనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "How long did Job’s three friends sit on the ground with him in total silence before anyone uttered a word?",
    "questionTelugu": "యోబు దుఃఖమును చూచి అతని ముగ్గురు స్నేహితులు నేలపై కూర్చుండి మౌనముగా ఎన్ని దినములు ఉండిరి?",
    "options": [
      "Seven days and seven nights",
      "Three days and three nights",
      "Forty days and forty nights",
      "One full month"
    ],
    "optionsTelugu": [
      "ఏడు రాత్రింబగళ్లు",
      "మూడు రాత్రింబగళ్లు",
      "నలభై రాత్రింబగళ్లు",
      "ఒక నెల దినములు"
    ],
    "correctAnswer": "Seven days and seven nights",
    "bibleReference": "Job 2:13",
    "explanation": "They sat on the ground with him for seven days and seven nights, and no one said a word because they saw how great his suffering was.",
    "explanationTelugu": "అతని బాధ మిక్కిలి గొప్పదని చూచి ఏడు దినములు రాత్రింబగళ్లు అతనితో ఒక్క మాటయైనను మాట్లాడక నేలపై కూర్చుండిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "Why did young Elihu son of Barachel the Buzite restrain himself from speaking earlier in the book of Job?",
    "questionTelugu": "యోబు గ్రంథములో బూజీయుడైన బరకెలు కుమారుడైన ఎలీహు మొదట మాట్లాడకుండా ఎందుకు ఆగియుండెను?",
    "options": [
      "Because the other three friends were older in years than he was",
      "Because he had made a Nazirite vow",
      "Because he did not know the language",
      "Because Job’s wife forbade him"
    ],
    "optionsTelugu": [
      "వారు తనకంటె వయస్సులో పెద్దవారైనందున గౌరవించి ఆగియుండెను",
      "నాజీరు వ్రతము చేసినందున",
      "భాష రానందున",
      "యోబు భార్య వద్దన్నందున"
    ],
    "correctAnswer": "Because the other three friends were older in years than he was",
    "bibleReference": "Job 32:4-6",
    "explanation": "Elihu had waited to speak to Job because they were older than he, believing age should speak first.",
    "explanationTelugu": "ఎలీహు: \"నేను వయస్సులో చిన్నవాడను, మీరు వృద్ధులు; అందుచేత నా తలంపును బయలుపరచుటకు భయపడితిని\" అని చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "How does Psalm 103:13 describe the tender fatherly nature of God toward His children?",
    "questionTelugu": "కీర్తనలు 103:13 లో దేవుని తండ్రి హృదయము ఎలా వర్ణించబడెను?",
    "options": [
      "\"As a father has compassion on his children, so the Lord has compassion on those who fear Him\"",
      "\"As a ruler demands high taxes\"",
      "\"As an army commander orders soldiers\"",
      "\"As an impartial judge without mercy\""
    ],
    "optionsTelugu": [
      "\"తండ్రి తన కుమారులయెడల జాలిపడునట్లు యెహోవా తనయందు భయభక్తులు గలవారియెడల జాలిపడును\"",
      "\"పన్నులు వసూలు చేయు అధిపతివలె\"",
      "\"సేనాధిపతివలె\"",
      "\"కనికరము లేని న్యాయాధిపతివలె\""
    ],
    "correctAnswer": "\"As a father has compassion on his children, so the Lord has compassion on those who fear Him\"",
    "bibleReference": "Psalm 103:13",
    "explanation": "God knows our frame and remembers that we are dust, showing gentle paternal compassion.",
    "explanationTelugu": "మనము మంటివారమని ఆయన జ్ఞాపకము చేసికొని తండ్రివలె కనికరపడును.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "What sweet blessing of family harmony is celebrated in Psalm 133:1?",
    "questionTelugu": "కీర్తనలు 133:1 లో సహోదరుల ఐక్యతను గూర్చి ఏ శ్రేష్ఠమైన మాట రాయబడెను?",
    "options": [
      "\"Behold, how good and how pleasant it is for brethren to dwell together in unity!\"",
      "\"Better is a dry crust alone in a forest\"",
      "\"Children should leave family land behind\"",
      "\"Solitude is greater than family\""
    ],
    "optionsTelugu": [
      "\"సహోదరులు ఐక్యత కలిగి నివసించుట ఎంత మేలు! ఎంత మనోహరము!\"",
      "\"అరణ్యములో ఒంటరిగా ఉండుట మేలు\"",
      "\"కుటుంబాన్ని విడిచిపెట్టాలి\"",
      "\"ఏకాంతమే శ్రేష్ఠము\""
    ],
    "correctAnswer": "\"Behold, how good and how pleasant it is for brethren to dwell together in unity!\"",
    "bibleReference": "Psalm 133:1",
    "explanation": "Brotherly unity is likened to precious anointing oil on Aaron’s head and the dew of Mount Hermon.",
    "explanationTelugu": "సహోదరుల ఐక్యత అహరోను తలపై పోయబడిన పరిమళ తైలమువలెను హెర్మోను మంచువలెను ఆశీర్వాదకరమైనది.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Proverbs 14:1, what contrast is drawn regarding a woman and her family home?",
    "questionTelugu": "సామెతలు 14:1 లో స్త్రీ తన ఇంటిని కట్టుటను గూర్చి ఏ వ్యత్యాసము చెప్పబడెను?",
    "options": [
      "\"The wise woman builds her house, but with her own hands the foolish one tears hers down\"",
      "\"A woman’s role is only in the marketplace\"",
      "\"A house builds itself without effort\"",
      "\"Fools build stronger homes than the wise\""
    ],
    "optionsTelugu": [
      "\"జ్ఞానవంతురాలు తన యింటిని కట్టును; మూఢురాలు తన చేతులతో దానిని ఊడబీకును\"",
      "\"స్త్రీ వ్యాపారము మాత్రమే చేయాలి\"",
      "\"ఇల్లు దానంతటదే కట్టబడును\"",
      "\"మూర్ఖులే మంచి ఇల్లు కడతారు\""
    ],
    "correctAnswer": "\"The wise woman builds her house, but with her own hands the foolish one tears hers down\"",
    "bibleReference": "Proverbs 14:1",
    "explanation": "Wisdom builds stability, peace, and spiritual strength into a household, while folly destroys it.",
    "explanationTelugu": "జ్ఞానముగల స్త్రీ తన కుటుంబాన్ని చక్కబెట్టును, బుద్ధిలేని స్త్రీ తన తొందరపాటుతో నాశనము చేసుకొనును.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "According to Proverbs 19:14, how do material houses and wealth differ from a prudent wife?",
    "questionTelugu": "సామెతలు 19:14 ప్రకారం, ఇండ్లు ఆస్తులు ఎవరి నుండి వచ్చును, బుద్ధిగల భార్య ఎవరి నుండి లభించును?",
    "options": [
      "Houses and wealth are inherited from parents, but a prudent wife is from the Lord",
      "A prudent wife is bought with gold",
      "Parents choose wives, but God gives houses",
      "All things come from human effort only"
    ],
    "optionsTelugu": [
      "ఇల్లును ఆస్తియు పిత్రార్జితము; బుద్ధిగల భార్య యెహోవా అనుగ్రహము",
      "బుద్ధిగల భార్యను బంగారముతో కొనవచ్చును",
      "తల్లిదండ్రులే భార్యను ఇస్తారు",
      "అన్నీ మనుష్యుల కష్టార్జితమే"
    ],
    "correctAnswer": "Houses and wealth are inherited from parents, but a prudent wife is from the Lord",
    "bibleReference": "Proverbs 19:14",
    "explanation": "Earthly possessions may be handed down by ancestors, but a wise, god-fearing spouse is a gift from God.",
    "explanationTelugu": "ఆస్తిపాస్తులు పితరుల నుండి వారసత్వముగా రావచ్చును కానీ వివేకముగల భార్య యెహోవా ఇచ్చే దైవిక బహుమానము.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "What marital counsel does Ecclesiastes 9:9 give to a husband in this fleeting earthly life?",
    "questionTelugu": "ప్రసంగి 9:9 లో ఈ వ్యర్థమైన జీవిత దినములన్నిటిలో భర్తకు ఇవ్వబడిన ఆనందకరమైన ఉపదేశము ఏమిటి?",
    "options": [
      "\"Enjoy life with your wife, whom you love, all the days of this meaningless life\"",
      "\"Store up treasure and neglect your spouse\"",
      "\"Travel to foreign cities alone\"",
      "\"Marry multiple wives for wealth\""
    ],
    "optionsTelugu": [
      "\"నీవు ప్రేమించు నీ భార్యతో సుఖించుము; ఈ వ్యర్థమైన ఆయుష్కాలమంతయు ఆమెతో సంతోషించుము\"",
      "\"భార్యను పట్టించుకోకుండా ధనము కూడబెట్టుము\"",
      "\"ఒంటరిగా ప్రయాణాలు చేయుము\"",
      "\"ఆస్తి కొరకు అనేక పెండ్లిండ్లు చేసుకొనుము\""
    ],
    "correctAnswer": "\"Enjoy life with your wife, whom you love, all the days of this meaningless life\"",
    "bibleReference": "Ecclesiastes 9:9",
    "explanation": "Solomon advises treasuring one’s lifelong marital companionship as God’s portion under the sun.",
    "explanationTelugu": "సూర్యుని క్రింద నీవు పడు కష్టమంతటిలో నీ ప్రియమైన భార్యతో కలిసి సంతోషించుటయే నీకు దొరుకు భాగము.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "How are Isaiah’s wife and his two sons described in Isaiah 8:18 as living family signs in Israel?",
    "questionTelugu": "యెషయా 8:18 లో యెషయా భార్య మరియు అతని ఇద్దరు కుమారులు ఇశ్రాయేలులో దేనిగా నియమింపబడిరి?",
    "options": [
      "\"Here am I, and the children the Lord has given me. We are signs and symbols in Israel from the Lord Almighty\"",
      "\"We are wealthy merchants in Jerusalem\"",
      "\"We are commanders of the palace guard\"",
      "\"We are builders of the wall\""
    ],
    "optionsTelugu": [
      "\"యిదిగో నేనును, యెహోవా నాకిచ్చిన పిల్లలును సైన్యములకధిపతియైన యెహోవా వలన ఇశ్రాయేలీయులలో సూచనలుగాను మహత్కార్యములుగాను ఉన్నాము\"",
      "\"యెరూషలేము వర్తకులము\"",
      "\"సేనాపతులము\"",
      "\"గోడలను కట్టువారము\""
    ],
    "correctAnswer": "\"Here am I, and the children the Lord has given me. We are signs and symbols in Israel from the Lord Almighty\"",
    "bibleReference": "Isaiah 8:18",
    "explanation": "Isaiah and his sons Shear-Jashub and Maher-Shalal-Hash-Baz carried prophetic names bearing divine messages.",
    "explanationTelugu": "యెషయా మరియు అతని కుమారుల పేర్లు ఇశ్రాయేలు రక్షణ మరియు తీర్పునకు దైవిక సూచనలుగా ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "Why did the Lord strictly command prophet Jeremiah not to marry or have children in Jerusalem in Jeremiah 16?",
    "questionTelugu": "యిర్మీయా 16 లో యెరూషలేములో పెండ్లి చేసుకొనకూడదనియు పిల్లలను కనకూడదనియు దేవుడు యిర్మీయాను ఎందుకు ఆజ్ఞాపించెను?",
    "options": [
      "Because disastrous deaths, disease, and war would sweep away parents and children alike in the impending judgment",
      "Because celibacy was required of all prophets",
      "Because priests were not allowed to wed",
      "Because there were no women in Judah"
    ],
    "optionsTelugu": [
      "రాబోవు తీర్పులో తల్లులు తండ్రులు పిల్లలు భయంకరమైన వ్యాధులకు ఖడ్గమునకు బలవుదురని చూపించుటకు",
      "ప్రవక్తలందరూ బ్రహ్మచారులుగా ఉండాలన్నందున",
      "యాజకులకు పెండ్లి కూడదన్నందున",
      "యూదాలో స్త్రీలు లేనందున"
    ],
    "correctAnswer": "Because disastrous deaths, disease, and war would sweep away parents and children alike in the impending judgment",
    "bibleReference": "Jeremiah 16:1-4",
    "explanation": "Jeremiah’s unmarried state served as a living prophetic sign of the devastating siege coming upon Jerusalem’s families.",
    "explanationTelugu": "యెరూషలేము కుటుంబాలపైకి రాబోవు ఘోరమైన మరణములను చాటుటకు యిర్మీయా ఒంటరిగా ఉండవలసి వచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "What heartbreaking family loss did prophet Ezekiel endure when God called his wife \"the desire of your eyes\"?",
    "questionTelugu": "యెహెజ్కేలు 24 లో \"నీ కన్నులకు ఇష్టమైనదానిని\" అని పిలువబడిన తన భార్య విషయములో యెహెజ్కేలు ఏ బాధను అనుభవించెను?",
    "options": [
      "She died suddenly in the evening, and Ezekiel was forbidden to mourn publicly as a sign to the exiles",
      "She was captured by Babylonians",
      "She divorced him in Tel Abib",
      "She was stricken with blindness"
    ],
    "optionsTelugu": [
      "ఆమె సాయంకాలమున హఠాత్తుగా చనిపోయెను; ప్రజలకు సూచనగా అతడు బహిరంగముగా ఏడవకూడదని ఆజ్ఞాపించబడెను",
      "బబులోనీయులు ఆమెను చెరపట్టిరి",
      "విడాకులు ఇచ్చెను",
      "గ్రుడ్డితనం వచ్చెను"
    ],
    "correctAnswer": "She died suddenly in the evening, and Ezekiel was forbidden to mourn publicly as a sign to the exiles",
    "bibleReference": "Ezekiel 24:16-18",
    "explanation": "Ezekiel’s personal grief mirrored the impending destruction of the temple in Jerusalem, the delight of Israel’s eyes.",
    "explanationTelugu": "ఇశ్రాయేలు కన్నులకు ఆనందమైన మందిరము నాశనమగుటకు సాదృశ్యముగా యెహెజ్కేలు భార్య మరణము ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "What joyous physical response occurred in Elizabeth’s womb when Mary greeted her in the Judean hill country?",
    "questionTelugu": "యూదయ కొండసీమలో మరియ పలకరింపు వినినప్పుడు ఎలీసబెతు గర్భములోని శిశువు ఏమి చేసెను?",
    "options": [
      "The baby leaped for joy in her womb, and Elizabeth was filled with the Holy Spirit",
      "The baby remained asleep",
      "Elizabeth felt severe labor pains",
      "Elizabeth lost her voice"
    ],
    "optionsTelugu": [
      "ఆమె గర్భములోని శిశువు ఆనందముతో గంతులు వేసెను, ఎలీసబెతు పరిశుద్ధాత్మతో నింపబడెను",
      "శిశువు నిద్రించెను",
      "ప్రసవ వేదన వచ్చెను",
      "గొంతు మూగబోయెను"
    ],
    "correctAnswer": "The baby leaped for joy in her womb, and Elizabeth was filled with the Holy Spirit",
    "bibleReference": "Luke 1:41, 44",
    "explanation": "Elizabeth exclaimed: \"As soon as the sound of your greeting reached my ears, the baby in my womb leaped for joy.\"",
    "explanationTelugu": "ఎలీసబెతు: \"నీ వందనపు మాట నా చెవిన పడగానే నా గర్భములోని శిశువు ఆనందముతో గంతులు వేసెను\" అని బిగ్గరగా చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "How long had elderly prophetess Anna, daughter of Phanuel of the tribe of Asher, served in the temple courts?",
    "questionTelugu": "ఆషేరు గోత్రపు ఫనూయేలు కుమార్తెయైన ప్రవక్త్రి అన్నమ్మ దేవాలయములో ఎన్ని సంవత్సరాలు నిత్యోపవాసములతో పరిచర్య చేసెను?",
    "options": [
      "A widow to the age of eighty-four, never leaving the temple night and day",
      "For twenty years only",
      "She was only fifty years old",
      "She came once a week"
    ],
    "optionsTelugu": [
      "ఎనుబది నాలుగు సంవత్సరాల విధవరాలై రాత్రింబగళ్లు ఉపవాస ప్రార్థనలతో మందిరమును విడిచిపోక ఉండెను",
      "ఇరవై సంవత్సరాలు",
      "యాభై ఏళ్లు మాత్రమే",
      "వారానికి ఒక్కసారి మాత్రమే"
    ],
    "correctAnswer": "A widow to the age of eighty-four, never leaving the temple night and day",
    "bibleReference": "Luke 2:36-38",
    "explanation": "Anna gave thanks to God and spoke about the child to all who were looking forward to the redemption of Jerusalem.",
    "explanationTelugu": "అన్నమ్మ ఆ గడియలోనే లోపలికి వచ్చి దేవుని స్తుతించి రక్షణ కొరకు ఎదురుచూచువారితో ఆయనను గూర్చి మాట్లాడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "What poignant family confession did aging Simeon speak to Mary when blessing infant Jesus in Luke 2?",
    "questionTelugu": "లూకా 2 లో శిశువైన యేసును ఎత్తుకొని దీవించినప్పుడు వృద్ధుడైన షిమ్యోను మరియతో పలికిన మర్మపు మాట ఏమిటి?",
    "options": [
      "\"A sword will pierce through your own soul too, so that the thoughts of many hearts may be revealed\"",
      "\"You will be made the queen of Judea\"",
      "\"You will travel to Rome in glory\"",
      "\"You will never taste sorrow\""
    ],
    "optionsTelugu": [
      "\"అనేకుల హృదయాలోచనలు బయలుపడునట్లు నీ స్వంత హృదయమును ఒక ఖడ్గము దూసికొనిపోవును\"",
      "\"యూదయ రాణివి అగుదువు\"",
      "\"రోమాకు వెళ్లుదువు\"",
      "\"నీకు ఎన్నడూ దుఃఖముండదు\""
    ],
    "correctAnswer": "\"A sword will pierce through your own soul too, so that the thoughts of many hearts may be revealed\"",
    "bibleReference": "Luke 2:34-35",
    "explanation": "Simeon foretold the maternal agony Mary would endure seeing Jesus rejected and crucified.",
    "explanationTelugu": "సిలువపై కుమారుని మరణమును చూచునప్పుడు తల్లియైన మరియ అనుభవించు గుండెకోతను షిమ్యోను ముందే ప్రవచించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "How long did anxious parents Mary and Joseph search for twelve-year-old Jesus before finding Him in the temple?",
    "questionTelugu": "పన్నెండేళ్ల యేసు తప్పిపోయినప్పుడు మరియ యోసేపులు ఎంతకాలము దుఃఖముతో వెదకిన తరువాత మందిరములో కనుగొనిరి?",
    "options": [
      "After three days of searching",
      "After one hour",
      "After one week",
      "After thirty days"
    ],
    "optionsTelugu": [
      "మూడు దినముల తరువాత",
      "ఒక గంట తరువాత",
      "ఒక వారము తరువాత",
      "ముప్పై దినముల తరువాత"
    ],
    "correctAnswer": "After three days of searching",
    "bibleReference": "Luke 2:46",
    "explanation": "After three days they found Him in the temple courts, sitting among the teachers, listening to them and asking questions.",
    "explanationTelugu": "మూడు దినములైన తరువాత ఆయన మందిరములో బోధకుల మధ్య కూర్చుండి వారి మాటలను వినుచు ప్రశ్నలు అడుగుచుండగా కనుగొనిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "How did Jesus respond to His mother Mary when she asked why He had stayed behind in Jerusalem?",
    "questionTelugu": "తమను ఎందుకు ఇంతగా వేదనపెట్టితివని తల్లి మరియ అడిగినప్పుడు యేసు ఇచ్చిన సమాధానము ఏమిటి?",
    "options": [
      "\"Why were you searching for Me? Didn’t you know I had to be in My Father’s house / about My Father’s business?\"",
      "\"I got lost in the crowded streets\"",
      "\"I wanted to visit the Roman fortress\"",
      "\"I forgot the way to Nazareth\""
    ],
    "optionsTelugu": [
      "\"మీరు నన్నేల వెదకుచుంటిరి? నేను నా తండ్రి కార్యములమీద ఉండవలెనని మీరెరుగరా?\"",
      "\"దారి తప్పిపోయాను\"",
      "\"కోటను చూడాలనుకున్నాను\"",
      "\"నజరేతు దారి మరచిపోయాను\""
    ],
    "correctAnswer": "\"Why were you searching for Me? Didn’t you know I had to be in My Father’s house / about My Father’s business?\"",
    "bibleReference": "Luke 2:49",
    "explanation": "Jesus revealed His divine consciousness of His Heavenly Father, yet returned to Nazareth and was obedient to His parents.",
    "explanationTelugu": "యేసు తన పరలోక తండ్రి చిత్తమును బయలుపరుస్తూనే, నజరేతుకు వెళ్లి తల్లిదండ్రులకు లోబడి యుండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "What family attitude did Jesus maintain in Nazareth toward Joseph and Mary in Luke 2:51?",
    "questionTelugu": "లూకా 2:51 లో నజరేతులో యేసు తన తల్లిదండ్రులైన యోసేపు మరియల యెడల ఏ విధేయతను కనబరచెను?",
    "options": [
      "He was submissive and obedient to them, growing in wisdom and favor with God and man",
      "He acted independently without consulting them",
      "He departed immediately to live in the desert",
      "He refused household chores"
    ],
    "optionsTelugu": [
      "ఆయన వారికి లోబడియుండి జ్ఞానమందును వయస్సునందును దేవుని దయయందును మనుష్యుల దయయందును వర్ధిల్లుచుండెను",
      "వారి మాట వినలేదు",
      "అరణ్యములోనికి వెళ్లిపోయెను",
      "ఇంటి పనులు చేయలేదు"
    ],
    "correctAnswer": "He was submissive and obedient to them, growing in wisdom and favor with God and man",
    "bibleReference": "Luke 2:51-52",
    "explanation": "Jesus set the ultimate example of filial submissiveness and honor within a godly home.",
    "explanationTelugu": "యేసు తన శరీరధారియైన తల్లిదండ్రులకు సంపూర్ణ విధేయత చూపిస్తూ భక్తిగల కుటుంబ జీవితమునకు మాదిరిగా నిలిచెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "At which village family celebration did Jesus perform His first miracle at the prompting of His mother Mary?",
    "questionTelugu": "తన తల్లి మరియ చెప్పిన మాటనుబట్టి యేసు తన మొదటి అద్భుతమును ఏ గ్రామపు వివాహ విందులో చేసెను?",
    "options": [
      "Wedding at Cana in Galilee",
      "Banquet at Capernaum",
      "Feast at Bethany",
      "Supper at Emmaus"
    ],
    "optionsTelugu": [
      "గలీలయలోని కానా విందులో",
      "కపెర్నహూము విందులో",
      "బేతనియ విందులో",
      "ఎమ్మాయు భోజనములో"
    ],
    "correctAnswer": "Wedding at Cana in Galilee",
    "bibleReference": "John 2:1-11",
    "explanation": "Jesus turned six stone jars of water into wine, revealing His glory, and His disciples believed in Him.",
    "explanationTelugu": "యేసు ఆరు రాతిబానల నీటిని శ్రేష్ఠమైన ద్రాక్షారసముగా మార్చి వివాహ గౌరవమును కాపాడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "How did four loyal friends bring their paralyzed companion to Jesus when the house in Capernaum was overflowing?",
    "questionTelugu": "కపెర్నహూములో ఇల్లు కిక్కిరిసి ఉండగా పక్షవాయువుగల స్నేహితుని నలుగురు వ్యక్తులు యేసు వద్దకు ఎలా చేర్చిరి?",
    "options": [
      "Removed the roof above Jesus and lowered the mat on which the paralyzed man lay",
      "Broke down the wooden front door",
      "Waited until the next week",
      "Shouted through the courtyard window"
    ],
    "optionsTelugu": [
      "యేసు ఉన్న ఇంటి కప్పును విప్పి పక్షవాయువుగలవానిని మంచముతో సహా క్రిందికి దించిరి",
      "తలుపును బద్దలుకొట్టిరి",
      "వచ్చే వారం వరకు ఆగిరి",
      "కిటికీలోనుండి అరిచిరి"
    ],
    "correctAnswer": "Removed the roof above Jesus and lowered the mat on which the paralyzed man lay",
    "bibleReference": "Mark 2:4",
    "explanation": "When Jesus saw their active faith, He said to the paralyzed man: \"Son, your sins are forgiven; get up, take your mat and walk.\"",
    "explanationTelugu": "యేసు వారి విశ్వాసమును చూచి: \"కుమారుడా, నీ పాపములు క్షమింపబడియున్నవి, లేచి నడువుము\" అని స్వస్థపరచెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "What redemptive blessing did Jesus proclaim when visiting the Jericho home of chief tax collector Zacchaeus?",
    "questionTelugu": "యెరికోలో సుంకపు గుత్తేదారుడైన జక్కయ్య ఇంటికి వెళ్లినప్పుడు యేసు ఆ కుటుంబమును గూర్చి ఏ ప్రకటన చేసెను?",
    "options": [
      "\"Today salvation has come to this house, because this man, too, is a son of Abraham\"",
      "\"You must pay a heavy fine to the poor\"",
      "\"You must leave your hometown\"",
      "\"Tax collectors cannot enter the kingdom\""
    ],
    "optionsTelugu": [
      "\"ఇతడును అబ్రాహాము కుమారుడే; నేడు ఈ యింటికి రక్షణ వచ్చియున్నది\"",
      "\"పేదలకు జరిమానా కట్టుము\"",
      "\"ఊరు విడిచి వెళ్లిపొమ్ము\"",
      "\"సుంకరులకు రక్షణ దొరకదు\""
    ],
    "correctAnswer": "\"Today salvation has come to this house, because this man, too, is a son of Abraham\"",
    "bibleReference": "Luke 19:9",
    "explanation": "For the Son of Man came to seek and to save the lost, bringing transformation to Zacchaeus’ home.",
    "explanationTelugu": "నశించినదానిని వెదకి రక్షించుటకు మనుష్యకుమారుడు వచ్చెనని యేసు ఆ కుటుంబమునకు రక్షణ ప్రకటించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "How did Jesus tenderly address the trembling woman healed of twelve years of hemorrhage when she fell at His feet?",
    "questionTelugu": "పన్నెండేళ్లుగా రక్తస్రావ రోగముతో ఉండి తన వస్త్రపు చెంగును ముట్టిన స్త్రీతో యేసు ఏ వాత్సల్యపు మాట పలికెను?",
    "options": [
      "\"Daughter, your faith has healed you. Go in peace and be freed from your suffering\"",
      "\"Woman, why did you touch Me without asking?\"",
      "\"Go show yourself to the governor\"",
      "\"Pay the temple offering first\""
    ],
    "optionsTelugu": [
      "\"కుమారీ, నీ విశ్వాసము నిన్ను స్వస్థపరచెను; సమాధానము గలదానవై వెళ్లుము\"",
      "\"నన్ను ఎందుకు ముట్టితివి?\"",
      "\"అధికారి వద్దకు వెళ్లుము\"",
      "\"కానుక చెల్లించుము\""
    ],
    "correctAnswer": "\"Daughter, your faith has healed you. Go in peace and be freed from your suffering\"",
    "bibleReference": "Mark 5:34",
    "explanation": "Jesus restored her socially and spiritually into the family of God, calling her \"Daughter.\"",
    "explanationTelugu": "సమాజములో వెలివేయబడిన ఆమెను యేసు \"కుమారీ\" అని పిలిచి దైవిక కుటుంబ సభ్యురాలిగా చేర్చుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "How did Jesus define spiritual family relationship when told His mother and brothers were standing outside?",
    "questionTelugu": "నీ తల్లియు సహోదరులును బయట నిలిచియున్నారని చెప్పినప్పుడు యేసు ఆత్మీయ కుటుంబమును ఎలా నిర్వచించెను?",
    "options": [
      "\"Whoever does God’s will is My brother and sister and mother\"",
      "\"Only those born in Nazareth are My family\"",
      "\"Family ties do not matter in heaven\"",
      "\"Earthly relations are enemies\""
    ],
    "optionsTelugu": [
      "\"దేవుని చిత్తమును జరిగించువాడే నా సహోదరుడును నా సహోదరియు నా తల్లియునై యున్నాడు\"",
      "\"నజరేతులో పుట్టినవారే నా కుటుంబము\"",
      "\"పరలోకములో కుటుంబాలు ఉండవు\"",
      "\"శరీర సంబంధులు శత్రువులు\""
    ],
    "correctAnswer": "\"Whoever does God’s will is My brother and sister and mother\"",
    "bibleReference": "Mark 3:35",
    "explanation": "Jesus expanded family to encompass all believers who obey and do the will of God.",
    "explanationTelugu": "దేవుని చిత్తమును గైకొనువారందరును క్రీస్తునందు అత్యున్నతమైన ఆత్మీయ కుటుంబ సభ్యులని యేసు బోధించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "What contrast between two sisters in Bethany did Jesus highlight in Luke 10:41-42?",
    "questionTelugu": "లూకా 10:41-42 లో బేతనియలోని మార్త మరియు మరియల మధ్య యేసు ఏ ఆత్మీయ వ్యత్యాసమును చూపించెను?",
    "options": [
      "Martha was anxious and troubled about many things, while Mary chose the good portion which will not be taken away",
      "Martha was righteous, while Mary was lazy",
      "Mary should have spent all day cooking",
      "Both were equally distracted"
    ],
    "optionsTelugu": [
      "మార్త అనేకమైన పనులను గూర్చి విచారము కలిగియుండెను, మరియ ఉత్తమమైన దానిని ఏర్పరచుకొనెను; అది ఆమెయొద్దనుండి తీసివేయబడదు",
      "మార్త మాత్రమే నీతిమంతురాలు",
      "మరియ కూడా వంటగదిలోనే ఉండాల్సింది",
      "ఇద్దరూ విసిగిపోయిరి"
    ],
    "correctAnswer": "Martha was anxious and troubled about many things, while Mary chose the good portion which will not be taken away",
    "bibleReference": "Luke 10:41-42",
    "explanation": "Jesus commended Mary for sitting at His feet to hear His word as the supreme priority for every household.",
    "explanationTelugu": "ప్రభువు పాదాల యొద్ద కూర్చుండి వాక్యము వినుటయే ప్రతి కుటుంబమునకు అత్యంత ప్రాముఖ్యమైన ఉత్తమ భాగము.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which married couple in early Acts conspired together to deceive the church and fell dead at Peter’s feet?",
    "questionTelugu": "అపొస్తలుల కార్యములలో పరిశుద్ధాత్మను మోసగించుటకు ఏకాభిప్రాయపడి పేతురు పాదముల యెదుట ప్రాణము విడిచిన దంపతులు ఎవరు?",
    "options": [
      "Ananias and Sapphira",
      "Aquila and Priscilla",
      "Felix and Drusilla",
      "Ahab and Jezebel"
    ],
    "optionsTelugu": [
      "అననీయ మరియు సప్పీరా",
      "అకుల మరియు ప్రిస్కిల్లా",
      "ఫేలిక్సు మరియు దృసిల్ల",
      "ఆహాబు మరియు యెజెబెలు"
    ],
    "correctAnswer": "Ananias and Sapphira",
    "bibleReference": "Acts 5:1-10",
    "explanation": "Peter asked: \"How could you conspire to test the Spirit of the Lord?\" and both fell dead for their deceit.",
    "explanationTelugu": "ప్రభువు ఆత్మను శోధించుటకు మీరు ఏల ఏకీభవించితిరని పేతురు అడుగగానే ఇద్దరును చనిపోయిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which beloved disciple of Joppa, known for making tunics and coats for weeping widows, was raised from death by Peter?",
    "questionTelugu": "విధవరాండ్ర కొరకు అంగీలను వస్త్రములను కుట్టి దానధర్మములు చేసి చనిపోగా పేతురుచే బ్రతికింపబడిన శిష్యురాలు ఎవరు?",
    "options": [
      "Tabitha (Dorcas)",
      "Lydia",
      "Rhoda",
      "Phoebe"
    ],
    "optionsTelugu": [
      "తబితా (దొర్కా)",
      "లూదియ",
      "రోదా",
      "ఫేబే"
    ],
    "correctAnswer": "Tabitha (Dorcas)",
    "bibleReference": "Acts 9:36-40",
    "explanation": "Peter knelt and prayed, then turned toward the dead body and said: \"Tabitha, get up!\" and she opened her eyes.",
    "explanationTelugu": "పేతురు మోకాళ్లూని ప్రార్థనచేసి: \"తబితా, లెమ్మనగా\" ఆమె కన్నులు తెరచి పేతురును చూచి లేచి కూర్చుండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which joyful servant girl forgot to unlock the outer gate because she recognized Peter’s voice at Mary’s prayer meeting?",
    "questionTelugu": "మార్కు అను యోహాను తల్లియైన మరియ ఇంట ప్రార్థన జరుగుచుండగా పేతురు స్వరం విని సంతోషముతో తలుపు తీయక లోపలికి పరుగెత్తిన చిన్నది ఎవరు?",
    "options": [
      "Rhoda",
      "Dorcas",
      "Priscilla",
      "Damaris"
    ],
    "optionsTelugu": [
      "రోదా",
      "దొర్కా",
      "ప్రిస్కిల్లా",
      "దమరి"
    ],
    "correctAnswer": "Rhoda",
    "bibleReference": "Acts 12:13-14",
    "explanation": "When she recognized Peter’s voice, she was so overjoyed she ran back without opening it and exclaimed: \"Peter is at the door!\"",
    "explanationTelugu": "రోదా పేతురు స్వరమును గుర్తించి సంతోషముచేత తలుపు తీయక లోపలికి పరుగెత్తి పేతురు గుమ్మము వద్ద ఉన్నాడని చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "What mixed family heritage did young Timothy possess when Paul met him at Lystra in Acts 16?",
    "questionTelugu": "అపొస్తలుల కార్యములు 16 లో లుస్త్రలో పౌలు కలుసుకున్నప్పుడు తిమోతికి గల మిశ్రమ కుటుంబ నేపథ్యమేమిటి?",
    "options": [
      "His mother was a Jewish believer, but his father was a Greek",
      "Both his parents were Roman senators",
      "His parents were Samaritan priests",
      "He was an orphan raised by Pharisees"
    ],
    "optionsTelugu": [
      "అతని తల్లి విశ్వసించిన యూదురాలు, అయితే అతని తండ్రి గ్రీసుదేశస్థుడు (హెల్లేనీయుడు)",
      "తల్లిదండ్రులు రోమా అధికారులు",
      "సమరయ యాజకులు",
      "పరిసయ్యుల వద్ద పెరిగిన అనాథ"
    ],
    "correctAnswer": "His mother was a Jewish believer, but his father was a Greek",
    "bibleReference": "Acts 16:1",
    "explanation": "Timothy was the son of a Jewish woman who was a believer, but his father was a Greek.",
    "explanationTelugu": "తిమోతి విశ్వాసముగల యూదా స్త్రీ కుమారుడు; అతని తండ్రి గ్రీసుదేశస్థుడై యుండెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "How did godly couple Priscilla and Aquila assist gifted preacher Apollos when he arrived in Ephesus?",
    "questionTelugu": "ఎఫెసునకు వచ్చిన విద్వాంసుడైన అపొల్లోకు ప్రిస్కిల్లా అకుల దంపతులు ఏ ఆత్మీయ ఉపకారము చేసిరి?",
    "options": [
      "Invited him to their home and explained to him the way of God more accurately",
      "Publicly condemned him in the synagogue",
      "Sent him back to Alexandria",
      "Forbade him to preach"
    ],
    "optionsTelugu": [
      "తమ యింటికి చేర్చుకొని దేవుని మార్గమును అతనికి మరింత స్పష్టముగా విశదపరచిరి",
      "సమాజమందిరములో తిట్టిరి",
      "అలెక్సాండ్రియాకు పంపిరి",
      "బోధించవద్దనిరి"
    ],
    "correctAnswer": "Invited him to their home and explained to him the way of God more accurately",
    "bibleReference": "Acts 18:26",
    "explanation": "When Priscilla and Aquila heard him, they invited him to their home and explained the way of God more adequately.",
    "explanationTelugu": "వారు అపొల్లో మాటలు విని అతనిని తమ యింటికి చేర్చుకొని దేవుని మార్గమును మరీ పూర్తిగా అతనికి వివరించిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who fell into a deep sleep and plunged from a third-story windowsill during Paul’s prolonged midnight sermon at Troas?",
    "questionTelugu": "త్రోయలో అర్ధరాత్రి వరకు పౌలు ప్రసంగించుచుండగా గాఢనిద్రపట్టి మూడవ అంతస్తు కిటికీలోనుండి క్రిందపడి చనిపోయిన యౌవనుడు ఎవరు?",
    "options": [
      "Eutychus",
      "Tychicus",
      "Erastus",
      "Tertius"
    ],
    "optionsTelugu": [
      "ఐతుకు",
      "తుకికు",
      "ఎరస్తు",
      "తెర్తియు"
    ],
    "correctAnswer": "Eutychus",
    "bibleReference": "Acts 20:9-12",
    "explanation": "Paul went down, threw himself on the young man, and said: \"Don’t be alarmed; he’s alive!\" and they took the boy home comforted.",
    "explanationTelugu": "ఐతుకు చనిపోగా పౌలు అతనిపై పడి కౌగిలించుకొని బ్రతికించెను; వారు ఆ బాలుని సజీవముగా ఇంటికి తీసికొనిపోయిరి.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "Which alert young family member uncovered an assassination plot of forty men in Jerusalem to save Paul’s life?",
    "questionTelugu": "యెరూషలేములో నలభైమంది చేసిన హత్య కుట్రను కనిపెట్టి రోమా సహస్రాధిపతికి తెలిపి పౌలు ప్రాణమును కాపాడిన కుటుంబ సభ్యుడు ఎవరు?",
    "options": [
      "Paul’s nephew (son of Paul’s sister)",
      "Paul’s younger brother",
      "Paul’s uncle",
      "Timothy’s cousin"
    ],
    "optionsTelugu": [
      "పౌలు మేనల్లుడు (పౌలు సహోదరి కుమారుడు)",
      "పౌలు తమ్ముడు",
      "పౌలు బాబాయి",
      "తిమోతి బావ"
    ],
    "correctAnswer": "Paul’s nephew (son of Paul’s sister)",
    "bibleReference": "Acts 23:16-22",
    "explanation": "When the son of Paul’s sister heard of this plot, he went into the barracks and told Paul, who sent him to the commander.",
    "explanationTelugu": "పౌలు సహోదరి కుమారుడు ఈ కుట్రను విని కోటలోనికి వెళ్లి పౌలుకు మరియు సహస్రాధిపతికి తెలిపి రక్షించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "What spirit of adoption is granted to all believers in Romans 8:15 regarding our relationship with God?",
    "questionTelugu": "రోమీయులకు 8:15 లో విశ్వాసులందరికీ ఇవ్వబడిన దత్తపుత్రాత్మను బట్టి మనము దేవునిని ఏమని పిలుచుచున్నాము?",
    "options": [
      "\"Abba, Father!\"",
      "\"O distant Sovereign\"",
      "\"Master of slaves\"",
      "\"Unreachable King\""
    ],
    "optionsTelugu": [
      "\"అబ్బా, తండ్రీ!\"",
      "\"దూరపు ప్రభువా\"",
      "\"బానిసల యజమానీ\"",
      "\"చేరరాని రాజా\""
    ],
    "correctAnswer": "\"Abba, Father!\"",
    "bibleReference": "Romans 8:15",
    "explanation": "The Spirit you received does not make you slaves to fear, but brought about your adoption to sonship. By Him we cry: \"Abba, Father!\"",
    "explanationTelugu": "మనము మరల భయపడుటకు దాస్యపు ఆత్మను పొందలేదుగాని దత్తపుత్రాత్మను పొందితివి; దానివలన \"అబ్బా, తండ్రీ\" అని మొరపెట్టుచున్నాము.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "To which Christian brother and his mother did Paul send personal greetings in Romans 16:13, calling her \"a mother to me too\"?",
    "questionTelugu": "రోమీయులకు 16:13 లో \"నాకును తల్లియైన ఆమెకును\" అని పౌలు ఎవరికి మరియు అతని తల్లికి వందనములు సమర్పించెను?",
    "options": [
      "Rufus and his mother",
      "Apollos and his mother",
      "Silas and his mother",
      "Luke and his mother"
    ],
    "optionsTelugu": [
      "రూఫునకు మరియు అతని తల్లికి",
      "అపొల్లోకు మరియు అతని తల్లికి",
      "సీలకు మరియు అతని తల్లికి",
      "లూకాకు మరియు అతని తల్లికి"
    ],
    "correctAnswer": "Rufus and his mother",
    "bibleReference": "Romans 16:13",
    "explanation": "Paul wrote: \"Greet Rufus, chosen in the Lord, and his mother, who has been a mother to me, too.\"",
    "explanationTelugu": "ప్రభువునందు ఏర్పరచబడిన రూఫునకును, నాకును తల్లియైన అతని తల్లికిని వందనములు అని పౌలు ఆప్యాయముగా రాసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "What tender family metaphors did Paul use in 1 Thessalonians 2 to describe his ministry among the believers?",
    "questionTelugu": "1 థెస్సలొనీకయులకు 2 లో విశ్వాసుల మధ్య తన పరిచర్యను పౌలు ఏ కుటుంబ సంబంధములతో పోల్చెను?",
    "options": [
      "Gentle as a nursing mother caring for her children, and encouraging as a father dealing with his own children",
      "Stern as a Roman judge",
      "Demanding as an Egyptian taskmaster",
      "Distant as a foreign ambassador"
    ],
    "optionsTelugu": [
      "పిల్లలను పోషించు తల్లివలెను, తన పిల్లలను హెచ్చరించు తండ్రివలెను వాత్సల్యము చూపితిమి",
      "రోమా న్యాయాధిపతివలె",
      "ఐగుప్తు గైడ్వలె",
      "విదేశీ రాయబారివలె"
    ],
    "correctAnswer": "Gentle as a nursing mother caring for her children, and encouraging as a father dealing with his own children",
    "bibleReference": "1 Thessalonians 2:7, 11",
    "explanation": "Paul loved the church with both maternal gentleness and paternal exhortation and comfort.",
    "explanationTelugu": "పౌలు తల్లి పాలిచ్చి పెంచునట్లును, తండ్రి తన పిల్లలను ఓదార్చి ధైర్యపరచునట్లును వారిని ప్రేమించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "How does Paul instruct Timothy to relate to church members of various ages in 1 Timothy 5:1-2?",
    "questionTelugu": "1 తిమోతి 5:1-2 లో సంఘములోని వివిధ వయస్సుల వారి యెడల తిమోతి ఎలా ప్రవర్తించాలని ఆజ్ఞాపించబడెను?",
    "options": [
      "Treat older men as fathers, younger men as brothers, older women as mothers, younger women as sisters in all purity",
      "Command everyone as subordinates",
      "Associate only with wealthy patrons",
      "Exclude young people from fellowship"
    ],
    "optionsTelugu": [
      "వృద్ధులను తండ్రులుగాను, యౌవనులను సహోదరులుగాను, వృద్ధ స్త్రీలను తల్లులుగాను, యౌవన స్త్రీలను పవిత్రతతో సహోదరీలుగాను భావింపుము",
      "అందరినీ నౌకరులవలె ఆజ్ఞాపించుము",
      "ధనవంతులతో మాత్రమే సహవాసము చేయుము",
      "యౌవనులను దూరం పెట్టుము"
    ],
    "correctAnswer": "Treat older men as fathers, younger men as brothers, older women as mothers, younger women as sisters in all purity",
    "bibleReference": "1 Timothy 5:1-2",
    "explanation": "The local church is instructed to function with the warmth, purity, and respect of a godly extended family.",
    "explanationTelugu": "సంఘము ఒక దైవిక కుటుంబమువలె పరస్పర గౌరవముతో మరియు పవిత్రతతో మెలగాలని పౌలు ఉపదేశించెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "What lifelong spiritual foundation was Timothy blessed with according to 2 Timothy 3:15?",
    "questionTelugu": "2 తిమోతి 3:15 ప్రకారం తిమోతికి చిన్ననాటి నుండి లభించిన అమూల్యమైన కుటుంబ ఆధిక్యత ఏమిటి?",
    "options": [
      "From infancy you have known the holy Scriptures, which are able to make you wise for salvation through faith in Christ Jesus",
      "He inherited a chain of silver mines",
      "He was trained in Greek philosophy",
      "He traveled to Athens as a boy"
    ],
    "optionsTelugu": [
      "క్రీస్తుయేసునందలి విశ్వాసముద్వారా రక్షణార్థమైన జ్ఞానము కలుగజేయుటకు శక్తిగల పరిశుద్ధ లేఖనములను నీవు బాల్యమునుండి ఎరుగుదువు",
      "వెండి గనులను పొందెను",
      "గ్రీకు తత్వశాస్త్రము నేర్చుకొనెను",
      "ఏథెన్సుకు వెళ్లెను"
    ],
    "correctAnswer": "From infancy you have known the holy Scriptures, which are able to make you wise for salvation through faith in Christ Jesus",
    "bibleReference": "2 Timothy 3:15",
    "explanation": "Timothy’s mother and grandmother taught him God’s Word from early childhood.",
    "explanationTelugu": "తిమోతి బాల్యమునుండి తల్లి అవ్వల ద్వారా లేఖనములను నేర్చుకొని విశ్వాసములో స్థిరపడెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "How does James 1:27 define pure and undefiled religion before God the Father?",
    "questionTelugu": "యాకోబు 1:27 లో తండ్రియైన దేవుని యెదుట పవిత్రమైన నిష్కళంకమైన భక్తి ఏదని చెప్పబడెను?",
    "options": [
      "To look after orphans and widows in their distress and to keep oneself unstained by the world",
      "To build golden cathedrals",
      "To recite long theological poems",
      "To fast twice a week for praise"
    ],
    "optionsTelugu": [
      "దిక్కులేని పిల్లలను విధవరాండ్రను వారి ఇబ్బందిలో పరామర్శించుటయు, ఇహలోక మాలిన్యము తనకంటకుండా కాపాడుకొనుటయు",
      "బంగారు మందిరములు కట్టుట",
      "కవితలు చదువుట",
      "మెప్పు కొరకు ఉపవాసముండుట"
    ],
    "correctAnswer": "To look after orphans and widows in their distress and to keep oneself unstained by the world",
    "bibleReference": "James 1:27",
    "explanation": "Caring for vulnerable family members who lack earthly protection is the heart of true Christian worship.",
    "explanationTelugu": "దిక్కులేని అనాథలను విధవరాండ్రను ఆదరించుటయే దేవుని దృష్టిలో నిజమైన పరిపూర్ణ భక్తి.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "What magnificent family status does the apostle John celebrate in 1 John 3:1?",
    "questionTelugu": "1 యోహాను 3:1 లో అపొస్తలుడైన యోహాను విశ్వాసులకు లభించిన ఏ గొప్ప కుటుంబ భాగ్యమును స్తుతించెను?",
    "options": [
      "\"See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!\"",
      "\"We are the rulers of earthly nations\"",
      "\"We are immune to physical pain\"",
      "\"We know all future dates\""
    ],
    "optionsTelugu": [
      "\"మనము దేవుని పిల్లలమని పిలువబడునట్లు తండ్రి మనకెట్టి ప్రేమను అనుగ్రహించెనో చూడుడి! మనము దేవుని పిల్లలమే!\"",
      "\"భూమికి రాజులము\"",
      "\"బాధలు ఉండవు\"",
      "\"భవిష్యత్తు దినాలు తెలుసును\""
    ],
    "correctAnswer": "\"See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!\"",
    "bibleReference": "1 John 3:1",
    "explanation": "God’s supreme love has adopted believers into His own intimate household as His beloved children.",
    "explanationTelugu": "దేవుని అపరిమితమైన ప్రేమ మనలను ఆయన స్వంత పిల్లలుగా తన కుటుంబములో చేర్చుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "How is the final consummation of the redeemed church depicted in Revelation 19:7?",
    "questionTelugu": "ప్రకటన 19:7 లో రక్షింపబడిన సంఘము యొక్క అంతిమ నిత్య ఆనందము ఏ కుటుంబ వేడుకతో పోల్చబడెను?",
    "options": [
      "The Marriage of the Lamb has come, and His bride has made herself ready",
      "A great military parade in Rome",
      "A gathering of philosopher councils",
      "A division of earthly territories"
    ],
    "optionsTelugu": [
      "గొఱ్ఱెపిల్ల వివాహోత్సవ సమయము వచ్చినది, ఆయన భార్య తన్నుతాను సిద్ధపరచుకొనియున్నది",
      "సైనిక కవాతు",
      "పండిత సభ",
      "భూముల పంపకము"
    ],
    "correctAnswer": "The Marriage of the Lamb has come, and His bride has made herself ready",
    "bibleReference": "Revelation 19:7",
    "explanation": "The eternal union of Christ and His redeemed people is celebrated as the joyous wedding feast of the Lamb.",
    "explanationTelugu": "క్రీస్తుతో సంఘమునకు గల శాశ్వతమైన ఐక్యత గొఱ్ఱెపిల్ల పెండ్లి విందుగా పరలోకములో జరుపబడును.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "What command regarding church support of elderly widows is given in 1 Timothy 5:4?",
    "questionTelugu": "1 తిమోతి 5:4 లో వృద్ధ విధవరాండ్ర సంరక్షణ విషయములో పిల్లలకు మరియు మనుమలకు ఏ బాధ్యత అప్పగించబడెను?",
    "options": [
      "\"Let children and grandchildren learn first to show piety at home and repay their parents, for this is pleasing to God\"",
      "\"Leave all widows to public charity\"",
      "\"Send them to foreign cities\"",
      "\"Ignore their household needs\""
    ],
    "optionsTelugu": [
      "\"పిల్లలు లేక మనుమలున్నయెడల వీరు తమ స్వంత యింటియెడల భక్తి కనబరుచుటకును, తల్లిదండ్రులకు ప్రత్యుపకారము చేయుటకును మొదట నేర్చుకొనవలెను\"",
      "\"ధర్మశాలలకు పంపవలెను\"",
      "\"విదేశాలకు పంపవలెను\"",
      "\"పట్టించుకోవద్దు\""
    ],
    "correctAnswer": "\"Let children and grandchildren learn first to show piety at home and repay their parents, for this is pleasing to God\"",
    "bibleReference": "1 Timothy 5:4",
    "explanation": "Caring for elderly parents and grandparents is an essential Christian duty pleasing in God’s sight.",
    "explanationTelugu": "తల్లిదండ్రులను వృద్ధాప్యమందు సంరక్షించి ప్రత్యుపకారము చేయుట దేవుని దృష్టికి మిక్కిలి అనుకూలమైన భక్తి.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "What special promise did God speak in Psalm 27:10 for those who experience earthly parental abandonment?",
    "questionTelugu": "కీర్తనలు 27:10 లో తల్లిదండ్రులు విడిచిపెట్టినవారి కొరకు దేవుడు ఇచ్చిన ఓదార్పు వాగ్దానము ఏది?",
    "options": [
      "\"Though my father and mother forsake me, the Lord will receive / take me up\"",
      "\"I will wander without shelter\"",
      "\"Wealth will replace family\"",
      "\"No one will care for me\""
    ],
    "optionsTelugu": [
      "\"నా తండ్రియు నా తల్లియు నన్ను విడిచినను యెహోవా నన్ను చేర్చుకొనును\"",
      "\"దిక్కులేక తిరుగుదును\"",
      "\"డబ్బే కుటుంబమగును\"",
      "\"ఎవరూ చూడరు\""
    ],
    "correctAnswer": "\"Though my father and mother forsake me, the Lord will receive / take me up\"",
    "bibleReference": "Psalm 27:10",
    "explanation": "Even if human parents fail or forsake, the Lord’s loving embrace is unconditional and eternal.",
    "explanationTelugu": "కన్నతల్లిదండ్రులు విడిచిపెట్టినను పరమ తండ్రియైన దేవుడు తన పిల్లలను హత్తుకొని చేర్చుకొనును.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "How did God reveal His mother-like comfort to His grieving people in Isaiah 66:13?",
    "questionTelugu": "యెషయా 66:13 లో దేవుడు తన ప్రజలను ఎలా ఓదారుస్తానని మాతృప్రేమతో వాగ్దానము చేసెను?",
    "options": [
      "\"As a mother comforts her child, so will I comfort you; and you will be comforted over Jerusalem\"",
      "\"As an army crushes enemies\"",
      "\"As fire burns chaff\"",
      "\"As a winter blizzard freezes\""
    ],
    "optionsTelugu": [
      "\"ఒకని తల్లి వానిని ఆదరించునట్లు నేను మిమ్మును ఆదరించెదను; యెరూషలేములోనే మీరు ఆదరింపబడుదురు\"",
      "\"సైన్యము నాశనము చేయునట్లు\"",
      "\"అగ్ని కాల్చునట్లు\"",
      "\"మంచు గడ్డకట్టునట్లు\""
    ],
    "correctAnswer": "\"As a mother comforts her child, so will I comfort you; and you will be comforted over Jerusalem\"",
    "bibleReference": "Isaiah 66:13",
    "explanation": "God reveals His tender compassion using the deepest maternal imagery of comfort.",
    "explanationTelugu": "కన్నతల్లి తన బిడ్డను ఆదరించినట్లుగా దేవుడు తన వాత్సల్యముతో తన ప్రజలను ఓదార్చును.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "What legacy did Philip the evangelist pass on to his home in Caesarea according to Acts 21:8-9?",
    "questionTelugu": "అపొస్తలుల కార్యములు 21:8-9 లో కైసరయలోని సువార్తికుడైన ఫిలిప్పు ఇంటికి గల ఆత్మీయ సాక్ష్యము ఏమిటి?",
    "options": [
      "A hospitable home where Paul’s company lodged, blessed with four prophesying virgin daughters",
      "A merchant trading post",
      "A Roman garrison fortress",
      "A monastic retreat"
    ],
    "optionsTelugu": [
      "పౌలు బృందమును చేర్చుకున్న ఆతిథ్య గృహము, ప్రవచించు వరము గల నలుగురు భక్తిగల కుమార్తెలు గల ఇల్లు",
      "వ్యాపార కేంద్రము",
      "రోమా సైనిక కోట",
      "ఏకాంత ఆశ్రమము"
    ],
    "correctAnswer": "A hospitable home where Paul’s company lodged, blessed with four prophesying virgin daughters",
    "bibleReference": "Acts 21:8-9",
    "explanation": "Philip opened his home to missionaries and raised four godly daughters walking in the Holy Spirit.",
    "explanationTelugu": "ఫిలిప్పు తన కుటుంబాన్ని దేవుని పరిచర్యకు ఆతిథ్యమునకు మరియు ప్రవచన వరములకు నిలయముగా చేసెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "What blessing did King David speak over his own royal house at the conclusion of his life in 2 Samuel 23:5?",
    "questionTelugu": "2 సమూయేలు 23:5 లో తన జీవిత కడవరి మాటలలో దావీదు రాజు తన కుటుంబ నిబంధనను గూర్చి ఏమి పలికెను?",
    "options": [
      "\"Has not God made with me an everlasting covenant, ordered in all things and secure?\"",
      "\"My kingdom will vanish into dust\"",
      "\"Silver alone will save my children\"",
      "\"My sons will reign in Egypt\""
    ],
    "optionsTelugu": [
      "\"నిశ్చయముగా నా యిల్లు దేవుని యెదుట స్థిరముగా నున్నది గదా; సమస్త విషయములలో ఏర్పరచబడి భద్రము చేయబడిన నిత్య నిబంధనను ఆయన నాతో చేసియున్నాడు\"",
      "\"నా రాజ్యము ధూళియగును\"",
      "\"వెండి మాత్రమే రక్షించును\"",
      "\"ఐగుప్తులో ఏలుదురు\""
    ],
    "correctAnswer": "\"Has not God made with me an everlasting covenant, ordered in all things and secure?\"",
    "bibleReference": "2 Samuel 23:5",
    "explanation": "David rejoiced in God’s unfailing covenant promise to his household that culminated in the Messiah.",
    "explanationTelugu": "దేవుడు తన కుటుంబముతో చేసిన నిత్య నిబంధనను బట్టి దావీదు రక్షణానందముతో దేవుని ఘనపరచెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "What timeless encouragement is given to weary parents in Galatians 6:9?",
    "questionTelugu": "గలతీయులకు 6:9 లో అలసిపోయిన తల్లిదండ్రులకు ఇవ్వబడిన నిరీక్షణ వాక్యము ఏది?",
    "options": [
      "\"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up\"",
      "\"Give up when children do not listen\"",
      "\"Stop praying when answers delay\"",
      "\"Rely on worldly courts\""
    ],
    "optionsTelugu": [
      "\"మనోహరమైన మేలు చేయుటయందు మనము విసుకక యుందము; మనము అలయక యుండినయెడల తగిన కాలమందు పంట కోతుము\"",
      "\"పిల్లలు వినకపోతే వదిలివేయండి\"",
      "\"ప్రార్థన ఆపివేయండి\"",
      "\"కోర్టులను ఆశ్రయించండి\""
    ],
    "correctAnswer": "\"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up\"",
    "bibleReference": "Galatians 6:9",
    "explanation": "Faithful parenting and godly sowing will reap an eternal harvest in God’s appointed season.",
    "explanationTelugu": "కుటుంబములో మేలు చేయుటయందు విసుగక ప్రార్థించినయెడల దేవుడు తగిన కాలమందు ఆత్మీయ పంటను దయచేయును.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "How did patriarch Jacob bless Joseph’s family uniquely above his other brothers in Genesis 48:22?",
    "questionTelugu": "ఆదికాండము 48:22 లో తన ఇతర సహోదరులకంటె ఎక్కువగా యోసేపు కుటుంబమునకు యాకోబు ఏ స్వాస్థ్యమును ఇచ్చెను?",
    "options": [
      "Gave him one more portion of land (ridge of Shechem) taken from the Amorites with sword and bow",
      "Gave him all the gold of Egypt",
      "Made him ruler of Canaan alone",
      "Built him a palace in Bethel"
    ],
    "optionsTelugu": [
      "తన ఖడ్గముతో వింటితో అమోరీయుల చేతినుండి తీసికొన్న ఒక భాగమును (షెకెము భూభాగమును) అదనముగా ఇచ్చెను",
      "ఐగుప్తు బంగారమంతా ఇచ్చెను",
      "ఒక్కడినే కనాను రాజుగా చేసెను",
      "భవనము కట్టించెను"
    ],
    "correctAnswer": "Gave him one more portion of land (ridge of Shechem) taken from the Amorites with sword and bow",
    "bibleReference": "Genesis 48:22",
    "explanation": "Jacob granted Joseph a double portion through his two sons Ephraim and Manasseh.",
    "explanationTelugu": "ఎఫ్రాయిము మనష్షేకలను రెండు గోత్రములుగా చేసి యోసేపునకు జ్యేష్ఠత్వపు రెండంతల భాగమును ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "What great household covenant assurance did Peter proclaim to families at Pentecost in Acts 2:39?",
    "questionTelugu": "అపొస్తలుల కార్యములు 2:39 లో పెంతెకొస్తు దినమున పేతురు కుటుంబాల కొరకు ప్రకటించిన నిబంధన వాగ్దానము ఏది?",
    "options": [
      "\"The promise is for you and your children and for all who are far off—for all whom the Lord our God will call\"",
      "\"Salvation is limited to our generation only\"",
      "\"Children must wait until age thirty\"",
      "\"Only priests can receive the Spirit\""
    ],
    "optionsTelugu": [
      "\"ఈ వాగ్దానము మీకును మీ పిల్లలకును దూరస్థులైన వారికందరికిని, ప్రభువైన మన దేవుడు తనయొద్దకు పిలిచిన వారికందరికిని చెందును\"",
      "\"రక్షణ మన తరముతోనే అయిపోవును\"",
      "\"పిల్లలు 30 ఏళ్లు వచ్చేదాకా ఆగాలి\"",
      "\"యాజకులు మాత్రమే ఆత్మను పొందుదురు\""
    ],
    "correctAnswer": "\"The promise is for you and your children and for all who are far off—for all whom the Lord our God will call\"",
    "bibleReference": "Acts 2:39",
    "explanation": "The covenant promise of the Holy Spirit extends across generations to children and future families.",
    "explanationTelugu": "పరిశుద్ధాత్మ వాగ్దానము మనకును మన పిల్లలకును రాబోవు తరములకందరికిని దేవుడు అనుగ్రహించిన నిత్య వాగ్దానము.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "How is the beauty of God’s covenant household described in Psalm 144:12?",
    "questionTelugu": "కీర్తనలు 144:12 లో భక్తిగల కుటుంబములోని కుమారులు కుమార్తెలు దేనితో పోల్చబడిరి?",
    "options": [
      "\"Sons like plants full grown in their youth, daughters like corner pillars cut for a palace\"",
      "\"Sons like wild thorns, daughters like dust\"",
      "\"Children like wandering clouds\"",
      "\"Families like falling leaves\""
    ],
    "optionsTelugu": [
      "\"మన కుమారులు తమ యౌవనమందు ఎదిగిన మొక్కలవలెను, మన కుమార్తెలు నగరు శైలితో చెక్కబడిన మూలరాళ్లవలెను ఉందురు\"",
      "\"కుమారులు ముండ్లవలె\"",
      "\"పిల్లలు మేఘాలవలె\"",
      "\"రాలే ఆకులవలె\""
    ],
    "correctAnswer": "\"Sons like plants full grown in their youth, daughters like corner pillars cut for a palace\"",
    "bibleReference": "Psalm 144:12",
    "explanation": "God’s blessing makes sons sturdy and fruitful, and daughters elegant, dignified, and supportive like palace corner pillars.",
    "explanationTelugu": "దేవుని ఆశీర్వాదము వలన కుమారులు బలమైన మొక్కలవలెను, కుమార్తెలు రాజమందిరపు సుందరమైన మూలస్తంభములవలెను ఉందురు.",
    "marks": 1
  },
  {
    "id": "fam_m_s3_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "What closing benediction in Hebrews 13:20-21 commits every Christian family to the Great Shepherd?",
    "questionTelugu": "హెబ్రీయులకు 13:20-21 లో గొర్రెల గొప్ప కాపరియైన యేసు ద్వారా ప్రతి కుటుంబము కొరకు పలికిన ఆశీర్వాదము ఏది?",
    "options": [
      "\"May the God of peace, through the blood of the eternal covenant, equip you with everything good for doing His will\"",
      "\"May you gain earthly riches only\"",
      "\"May you never leave your home city\"",
      "\"May you reign as Roman emperors\""
    ],
    "optionsTelugu": [
      "\"నిత్యమైన నిబంధన రక్తమునుబట్టి గొఱ్ఱెల గొప్ప కాపరియైన యేసుక్రీస్తు ద్వారా సమాధానకర్తయైన దేవుడు తన చిత్తమును నెరవేర్చుటకు ప్రతి సత్కార్యమందును మిమ్మును సిద్ధపరచును గాక\"",
      "\"కేవలము భూసంబంధ ఐశ్వర్యము లభించును గాక\"",
      "\"ఊరు విడిచి వెళ్లకూడదు\"",
      "\"చక్రవర్తులుగా ఏలుదురు గాక\""
    ],
    "correctAnswer": "\"May the God of peace, through the blood of the eternal covenant, equip you with everything good for doing His will\"",
    "bibleReference": "Hebrews 13:20-21",
    "explanation": "The eternal covenant established by Jesus Christ sanctifies, strengthens, and preserves God’s people in every generation.",
    "explanationTelugu": "యేసుక్రీస్తు నిత్య నిబంధన రక్తము ద్వారా దేవుడు మనలను సమస్త సత్కార్యముల యందు సంపూర్ణులుగా చేసి తన చిత్తమును జరిగించును గాక.",
    "marks": 1
  }
];

export const FAMILY_HARD_FOUNDATION: QuizQuestion[] = [
  {
    "id": "fam_h_s1_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "According to Genesis 4:19-22, who was the first polygamist in Scripture, marrying two wives named Adah and Zillah?",
    "questionTelugu": "ఆదికాండము 4:19-22 ప్రకారం, ఆదా మరియు సిల్లా అను ఇద్దరు భార్యలను వివాహమాడిన బైబిలులోని మొదటి బహుభార్యాత్వపు పురుషుడు ఎవరు?",
    "options": [
      "Lamech",
      "Enoch",
      "Jubal",
      "Methusael"
    ],
    "optionsTelugu": [
      "లెమెకు",
      "హనోకు",
      "యూబాలు",
      "మెతూషాయేలు"
    ],
    "correctAnswer": "Lamech",
    "bibleReference": "Genesis 4:19",
    "explanation": "Lamech, of the line of Cain, took two wives: Adah and Zillah.",
    "explanationTelugu": "కయీను వంశీయుడైన లెమెకు ఆదా మరియు సిల్లా అను ఇద్దరు స్త్రీలను పెండ్లి చేసుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "What family craft was pioneered by Jubal, son of Adah and Lamech, in Genesis 4:21?",
    "questionTelugu": "ఆదికాండము 4:21 లో ఆదా మరియు లెమెకుల కుమారుడైన యూబాలు ఏ కళకు పితరుడయ్యాడు?",
    "options": [
      "Father of all who play stringed instruments and pipes",
      "Father of metal forging",
      "Father of nomadic tent dwellers",
      "Father of stone masons"
    ],
    "optionsTelugu": [
      "సితారా మరియు వేణువు ఊదు ప్రతివానికి పితరుడు",
      "ఇత్తడి ఇనుము పనిముట్లు చేయువాడు",
      "గుడారములలో నివసించువారికి పితరుడు",
      "రాతి పనివారికి పితరుడు"
    ],
    "correctAnswer": "Father of all who play stringed instruments and pipes",
    "bibleReference": "Genesis 4:21",
    "explanation": "Jubal was the father of all such as handle the harp and organ (stringed instruments and pipes).",
    "explanationTelugu": "యూబాలు సితారాలను పిల్లనగ్రోవులను వాయించు ప్రతివానికి మూలపురుషుడాయెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who was the sister of Tubal-Cain mentioned in the genealogy of Genesis 4:22?",
    "questionTelugu": "ఆదికాండము 4:22 లోని వంశావళిలో తూబల్కయీను సహోదరిగా పేర్కొనబడిన స్త్రీ ఎవరు?",
    "options": [
      "Naamah",
      "Milcah",
      "Basemath",
      "Keturah"
    ],
    "optionsTelugu": [
      "నయమా",
      "మిల్కా",
      "బాశెమతు",
      "కెతూరా"
    ],
    "correctAnswer": "Naamah",
    "bibleReference": "Genesis 4:22",
    "explanation": "Genesis 4:22 states that the sister of Tubal-Cain was Naamah.",
    "explanationTelugu": "ఆదికాండము 4:22 లో తూబల్కయీను సహోదరి పేరు నయమా అని వ్రాయబడెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Genesis 10:25, which patriarch was named because in his days the earth was divided?",
    "questionTelugu": "ఆదికాండము 10:25 ప్రకారం, తన దినములలో భూమి విభజింపబడినందున పేరు పెట్టబడిన వంశకర్త ఎవరు?",
    "options": [
      "Peleg",
      "Joktan",
      "Eber",
      "Reu"
    ],
    "optionsTelugu": [
      "పేలెగు",
      "యొక్తాను",
      "ఏబెరు",
      "రయూ"
    ],
    "correctAnswer": "Peleg",
    "bibleReference": "Genesis 10:25",
    "explanation": "To Eber were born two sons; the name of one was Peleg, for in his days the earth was divided.",
    "explanationTelugu": "ఏబెరుకు ఇద్దరు కుమారులు పుట్టిరి; వారిలో ఒకని దినములలో భూమి పంపకమైనందున వానికి పేలెగు అని పేరు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "Who was the father of Terah and grandfather of Abraham in Genesis 11:24?",
    "questionTelugu": "ఆదికాండము 11:24 లో తేరహు యొక్క తండ్రి మరియు అబ్రాహాము యొక్క తాత ఎవరు?",
    "options": [
      "Nahor",
      "Serug",
      "Reu",
      "Eber"
    ],
    "optionsTelugu": [
      "నాహోరు",
      "సెరూగు",
      "రయూ",
      "ఏబెరు"
    ],
    "correctAnswer": "Nahor",
    "bibleReference": "Genesis 11:24",
    "explanation": "Serug was the father of Nahor, and Nahor lived 29 years and fathered Terah.",
    "explanationTelugu": "సెరూగు కుమారుడైన నాహోరు ఇరువది తొమ్మిది ఏండ్లు బ్రదికి తేరహును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "Whom did Abraham marry after the death of Sarah, as recorded in Genesis 25:1?",
    "questionTelugu": "ఆదికాండము 25:1 ప్రకారం శారా మరణించిన తరువాత అబ్రాహాము వివాహము చేసుకున్న భార్య ఎవరు?",
    "options": [
      "Keturah",
      "Hagar",
      "Milcah",
      "Basemath"
    ],
    "optionsTelugu": [
      "కెతూరా",
      "హాగరు",
      "మిల్కా",
      "బాశెమతు"
    ],
    "correctAnswer": "Keturah",
    "bibleReference": "Genesis 25:1",
    "explanation": "Abraham took another wife, whose name was Keturah.",
    "explanationTelugu": "అబ్రాహాము మరియొక స్త్రీని పెండ్లిచేసికొనెను, ఆమె పేరు కెతూరా.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "How many sons were born to Abraham through Keturah in Genesis 25:2?",
    "questionTelugu": "ఆదికాండము 25:2 లో కెతూరా ద్వారా అబ్రాహాముకు ఎంతమంది కుమారులు పుట్టిరి?",
    "options": [
      "Six sons (Zimran, Jokshan, Medan, Midian, Ishbak, Shuah)",
      "Three sons",
      "Twelve sons",
      "Eight sons"
    ],
    "optionsTelugu": [
      "ఆరుగురు కుమారులు (జిమ్రాను, యొక్షాను, మెదాను, మిద్యాను, ఇష్బాకు, షూవహు)",
      "ముగ్గురు",
      "పండ్రెండుగురు",
      "ఎనిమిదిమంది"
    ],
    "correctAnswer": "Six sons (Zimran, Jokshan, Medan, Midian, Ishbak, Shuah)",
    "bibleReference": "Genesis 25:2",
    "explanation": "Keturah bore him Zimran, Jokshan, Medan, Midian, Ishbak, and Shuah.",
    "explanationTelugu": "కెతూరా అబ్రాహామునకు జిమ్రాను, యొక్షాను, మెదాను, మిద్యాను, ఇష్బాకు, షూవహు అను ఆరుగురు కుమారులను కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who was the firstborn son of Ishmael whose descendants are listed in Genesis 25:13?",
    "questionTelugu": "ఆదికాండము 25:13 లో పేర్కొనబడిన ఇష్మాయేలు యొక్క జ్యేష్ఠ కుమారుడు ఎవరు?",
    "options": [
      "Nebaioth",
      "Kedar",
      "Dumah",
      "Tema"
    ],
    "optionsTelugu": [
      "నెబాయోతు",
      "కేదారు",
      "దూమా",
      "తేమా"
    ],
    "correctAnswer": "Nebaioth",
    "bibleReference": "Genesis 25:13",
    "explanation": "The firstborn of Ishmael was Nebaioth, followed by Kedar, Adbeel, and others.",
    "explanationTelugu": "ఇష్మాయేలు జ్యేష్ఠ కుమారుడు నెబాయోతు, తరువాత కేదారు, అద్బేయేలు మొదలగువారు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Genesis 36:12, who was the concubine of Esau's son Eliphaz that gave birth to Amalek?",
    "questionTelugu": "ఆదికాండము 36:12 లో అమాలేకును కనిన ఏశావు కుమారుడైన ఎలీఫజు యొక్క ఉపపత్ని ఎవరు?",
    "options": [
      "Timna",
      "Basemath",
      "Oholibamah",
      "Mahalath"
    ],
    "optionsTelugu": [
      "తిమ్నా",
      "బాశెమతు",
      "అహోలీబామా",
      "మహలతు"
    ],
    "correctAnswer": "Timna",
    "bibleReference": "Genesis 36:12",
    "explanation": "Timna was a concubine of Esau's son Eliphaz and bore him Amalek.",
    "explanationTelugu": "తిమ్నా ఏశావు కుమారుడైన ఎలీఫజునకు ఉపపత్నియై అతనికి అమాలేకును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "Which daughter of Ishmael did Esau also marry in Genesis 28:9 to appease his parents?",
    "questionTelugu": "ఆదికాండము 28:9 లో తన తలిదండ్రులను సంతోషపెట్టుటకు ఏశావు వివాహము చేసుకున్న ఇష్మాయేలు కుమార్తె ఎవరు?",
    "options": [
      "Mahalath sister of Nebaioth",
      "Adah",
      "Zillla",
      "Keturah"
    ],
    "optionsTelugu": [
      "నెబాయోతు సహోదరియైన మహలతు",
      "ఆదా",
      "సిల్లా",
      "కెతూరా"
    ],
    "correctAnswer": "Mahalath sister of Nebaioth",
    "bibleReference": "Genesis 28:9",
    "explanation": "Esau went to Ishmael and took Mahalath the sister of Nebaioth to be his wife.",
    "explanationTelugu": "ఏశావు ఇష్మాయేలు నొద్దకు పోయి నెబాయోతు సహోదరియైన మహలతును వివాహము చేసికొనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "Which two full brothers took their swords to defend their sister Dinah's honor in Genesis 34:25?",
    "questionTelugu": "ఆదికాండము 34:25 లో తమ సొంత సహోదరి దీనా అవమానమును బట్టి ఖడ్గము చేతబూని షెకెము వారిని సంహరించిన ఇద్దరు అన్నదమ్ములు ఎవరు?",
    "options": [
      "Simeon and Levi",
      "Reuben and Judah",
      "Dan and Naphtali",
      "Issachar and Zebulun"
    ],
    "optionsTelugu": [
      "షిమ్యోను మరియు లేవి",
      "రూబేను మరియు యూదా",
      "దాను మరియు నఫ్తాలి",
      "ఇశ్శాఖారు మరియు జెబూలూను"
    ],
    "correctAnswer": "Simeon and Levi",
    "bibleReference": "Genesis 34:25",
    "explanation": "Simeon and Levi, Dinah's full brothers by Leah, took up swords against Shechem.",
    "explanationTelugu": "లేయా కుమారులైన షిమ్యోను లేవులు దీనా యొక్క సహోదరులై ఖడ్గము ధరించి పట్టణముమీదికి వచ్చిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "Who was the mother of Judah's son Shelah in Genesis 38:5?",
    "questionTelugu": "ఆదికాండము 38:5 లో యూదా కుమారుడైన షేలా యొక్క తల్లి ఎవరు?",
    "options": [
      "The daughter of Shua the Canaanite",
      "Tamar",
      "Asenath",
      "Zilpah"
    ],
    "optionsTelugu": [
      "కనానీయుడైన షూవ కుమార్తె",
      "తామారు",
      "ఆస్నతు",
      "జిల్పా"
    ],
    "correctAnswer": "The daughter of Shua the Canaanite",
    "bibleReference": "Genesis 38:2-5",
    "explanation": "Judah married the daughter of a Canaanite named Shua, who bore Er, Onan, and Shelah.",
    "explanationTelugu": "యూదా షూవ అను కనానీయుని కుమార్తెను పెండ్లి చేసుకొనగా ఆమె ఏరు, ఓనాను, షేలా అనువారిని కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Genesis 41:45, who was the father of Asenath, the Egyptian wife given to Joseph by Pharaoh?",
    "questionTelugu": "ఆదికాండము 41:45 లో ఫరో యోసేపునకు భార్యగా ఇచ్చిన ఆస్నతు యొక్క తండ్రి ఎవరు?",
    "options": [
      "Potiphera, priest of On",
      "Potiphar, captain of the guard",
      "Jethro, priest of Midian",
      "Pharaoh himself"
    ],
    "optionsTelugu": [
      "ఓను పట్టణపు యాజకుడైన పోతీఫెర",
      "రాజదేహ సంరక్షకుల అధిపతియైన పోతీఫరు",
      "మిద్యాను యాజకుడైన యిత్రో",
      "ఫరో స్వయంగా"
    ],
    "correctAnswer": "Potiphera, priest of On",
    "bibleReference": "Genesis 41:45",
    "explanation": "Pharaoh gave Joseph Asenath daughter of Potiphera, priest of On, as his wife.",
    "explanationTelugu": "ఫరో ఓను పట్టణపు యాజకుడైన పోతీఫెర కుమార్తె ఆస్నతును యోసేపునకు భార్యగా ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "According to Exodus 6:20, what was the familial relationship between Moses' father Amram and mother Jochebed?",
    "questionTelugu": "నిర్గమకాండము 6:20 ప్రకారం, మోషే తండ్రి అమ్రాము మరియు తల్లి యోకెబెదుల మధ్య ఉన్న బంధుత్వ సంబంధము ఏమిటి?",
    "options": [
      "Jochebed was Amram's father's sister (aunt)",
      "They were first cousins",
      "She was his brother's daughter",
      "She was unrelated by blood"
    ],
    "optionsTelugu": [
      "యోకెబెదు అమ్రాము యొక్క తండ్రి సహోదరి (మేనత్త)",
      "వారిద్దరూ మేనబావ మేనకోడలు",
      "ఆమె అమ్రాము సహోదరుని కుమార్తె",
      "వారికి రక్తసంబంధము లేదు"
    ],
    "correctAnswer": "Jochebed was Amram's father's sister (aunt)",
    "bibleReference": "Exodus 6:20",
    "explanation": "Amram took Jochebed his father's sister as wife, and she bore him Aaron and Moses.",
    "explanationTelugu": "అమ్రాము తన తండ్రి సహోదరియైన యోకెబెదును పెండ్లి చేసికొనెను; ఆమె అహరోనును మోషేను కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "Who was Aaron's wife and from which prominent Judahite leader was she a sister, according to Exodus 6:23?",
    "questionTelugu": "నిర్గమకాండము 6:23 ప్రకారం, అహరోను భార్య ఎవరు, మరియు ఆమె యూదా గోత్రపు ఏ నాయకుని సహోదరి?",
    "options": [
      "Elisheba, sister of Nahshon",
      "Zipporah, sister of Hobab",
      "Miriam, sister of Hur",
      "Shelomith, sister of Dibri"
    ],
    "optionsTelugu": [
      "నయెష్షోను సహోదరియైన ఎలీషెబ",
      "హోబాబు సహోదరియైన సిప్పోరా",
      "హూరు సహోదరియైన మిర్యాము",
      "దిబ్రీ సహోదరియైన షెలోమీతు"
    ],
    "correctAnswer": "Elisheba, sister of Nahshon",
    "bibleReference": "Exodus 6:23",
    "explanation": "Aaron married Elisheba, daughter of Amminadab and sister of Nahshon, uniting the priestly and royal lines.",
    "explanationTelugu": "అహరోను అమీ్మనాదాబు కుమార్తెయు నయెష్షోను సహోదరియునైన ఎలీషెబను పెండ్లి చేసికొనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Numbers 27:1, from which tribe were the five daughters of Zelophehad who advocated for their father's inheritance?",
    "questionTelugu": "సంఖ్యాకాండము 27:1 లో తమ తండ్రి స్వాస్థ్యము కొరకు విన్నవించిన సెలోపెహాదు ఐదుగురు కుమార్తెలు ఏ గోత్రమునకు చెందినవారు?",
    "options": [
      "Manasseh son of Joseph",
      "Ephraim son of Joseph",
      "Judah",
      "Benjamin"
    ],
    "optionsTelugu": [
      "యోసేపు కుమారుడైన మనష్షే గోత్రము",
      "యోసేపు కుమారుడైన ఎఫ్రాయిము గోత్రము",
      "యూదా గోత్రము",
      "బెన్యామీను గోత్రము"
    ],
    "correctAnswer": "Manasseh son of Joseph",
    "bibleReference": "Numbers 27:1",
    "explanation": "Zelophehad was of the families of Manasseh son of Joseph.",
    "explanationTelugu": "సెలోపెహాదు యోసేపు కుమారుడైన మనష్షే వంశస్థుడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "What were the names of all five daughters of Zelophehad listed in Numbers 27:1 and 36:11?",
    "questionTelugu": "సంఖ్యాకాండము 27:1 మరియు 36:11 లో పేర్కొనబడిన సెలోపెహాదు ఐదుగురు కుమార్తెల పేర్లు ఏమిటి?",
    "options": [
      "Mahlah, Noah, Hoglah, Milcah, and Tirzah",
      "Miriam, Deborah, Huldah, Ruth, and Esther",
      "Rachel, Leah, Bilhah, Zilpah, and Dinah",
      "Elisheba, Jochebed, Zipporah, Cozbi, and Shelomith"
    ],
    "optionsTelugu": [
      "మహలా, నోయా, హొగ్లా, మిల్కా, తిర్సా",
      "మిర్యాము, దెబోరా, హుల్దా, రూతు, ఎస్తేరు",
      "రాహేలు, లేయా, బిల్హా, జిల్పా, దీనా",
      "ఎలీషెబ, యోకెబెదు, సిప్పోరా, కొజ్బీ, షెలోమీతు"
    ],
    "correctAnswer": "Mahlah, Noah, Hoglah, Milcah, and Tirzah",
    "bibleReference": "Numbers 27:1",
    "explanation": "The daughters were Mahlah, Noah, Hoglah, Milcah, and Tirzah.",
    "explanationTelugu": "ఆ కుమార్తెల పేర్లు మహలా, నోయా, హొగ్లా, మిల్కా, తిర్సా అనునవి.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "Under the Mosaic ruling in Numbers 36:6-9, to whom were inheritance-bearing daughters required to marry?",
    "questionTelugu": "సంఖ్యాకాండము 36:6-9 ప్రకారం, స్వాస్థ్యము పొందిన కుమార్తెలు కుటుంబ స్వాస్థ్యము మారకుండునట్లు ఎవరిని వివాహమాడవలెను?",
    "options": [
      "Only within a family of their father's tribe",
      "Only to levitical priests",
      "Any man of Israel freely",
      "Foreign converts exclusively"
    ],
    "optionsTelugu": [
      "తమ తండ్రి గోత్రపు వంశములోని వారిని మాత్రమే",
      "లేవి యాజకులను మాత్రమే",
      "ఇశ్రాయేలీయులలో ఎవరినైనా",
      "అన్యులను మాత్రమే"
    ],
    "correctAnswer": "Only within a family of their father's tribe",
    "bibleReference": "Numbers 36:6",
    "explanation": "They were commanded to marry within the clan of their father's tribe so that no inheritance moved across tribes.",
    "explanationTelugu": "వారు తమ తండ్రి గోత్రపు వంశములోని వానినే వివాహమాడవలెను, తద్వారా స్వాస్థ్యము వేరొక గోత్రమునకు పోదు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "Who was Phinehas' father, through whose zealous lineage God granted a covenant of permanent priesthood in Numbers 25:11-13?",
    "questionTelugu": "సంఖ్యాకాండము 25:11-13 లో దేవుడు నిత్యయాజక నిబంధన ఇచ్చిన ఫీనెహాసు యొక్క తండ్రి ఎవరు?",
    "options": [
      "Eleazar son of Aaron",
      "Ithamar son of Aaron",
      "Nadab",
      "Gershon"
    ],
    "optionsTelugu": [
      "అహరోను కుమారుడైన ఎలియాజరు",
      "అహరోను కుమారుడైన ఈతామారు",
      "నాదాబు",
      "గెర్షోను"
    ],
    "correctAnswer": "Eleazar son of Aaron",
    "bibleReference": "Numbers 25:11",
    "explanation": "Phinehas was the son of Eleazar, the son of Aaron the high priest.",
    "explanationTelugu": "ఫీనెహాసు అహరోను కుమారుడైన ఎలియాజరు యొక్క కుమారుడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Leviticus 24:11, who was the mother of the man who blasphemed the Name in the wilderness camp?",
    "questionTelugu": "లేవీయకాండము 24:11 లో అరణ్యములో యెహోవా నామమును దూషించిన వాని తల్లి ఎవరు?",
    "options": [
      "Shelomith daughter of Dibri, of the tribe of Dan",
      "Cozbi daughter of Zur",
      "Jochebed daughter of Levi",
      "Peninnah wife of Elkanah"
    ],
    "optionsTelugu": [
      "దాను గోత్రపు దిబ్రీ కుమార్తెయైన షెలోమీతు",
      "సూరు కుమార్తెయైన కొజ్బీ",
      "లేవి కుమార్తెయైన యోకెబెదు",
      "ఎల్కానా భార్యయైన పెనిన్నా"
    ],
    "correctAnswer": "Shelomith daughter of Dibri, of the tribe of Dan",
    "bibleReference": "Leviticus 24:11",
    "explanation": "His mother's name was Shelomith, daughter of Dibri of the tribe of Dan.",
    "explanationTelugu": "వాని తల్లి పేరు షెలోమీతు; ఆమె దాను గోత్రపు దిబ్రీ కుమార్తె.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "Whom did Caleb give as a wife to Othniel when he conquered Kiriath-sepher in Joshua 15:16-17?",
    "questionTelugu": "యెహోషువ 15:16-17 ప్రకారం కిర్యత్సెపెరును పట్టుకొనిన ఒత్నీయేలుకు కాలేబు భార్యగా ఇచ్చిన తన కుమార్తె ఎవరు?",
    "options": [
      "Achsah",
      "Merab",
      "Michal",
      "Abital"
    ],
    "optionsTelugu": [
      "అక్సా",
      "మేరబు",
      "మీకాలు",
      "అబీతలు"
    ],
    "correctAnswer": "Achsah",
    "bibleReference": "Joshua 15:16-17",
    "explanation": "Caleb gave his daughter Achsah to Othniel son of Kenaz as wife.",
    "explanationTelugu": "కాలేబు తన కుమార్తెయైన అక్సాను తన తమ్ముడైన కనజు కుమారుడగు ఒత్నీయేలుకు ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "What specific wedding gift did Achsah ask of her father Caleb in Joshua 15:19?",
    "questionTelugu": "యెహోషువ 15:19 లో అక్సా తన తండ్రి కాలేబును అడిగిన ప్రత్యేక వివాహ బహుమానము ఏమిటి?",
    "options": [
      "Water springs (the upper and lower springs)",
      "Herds of sheep",
      "Golden necklaces",
      "Fields of olive vineyards"
    ],
    "optionsTelugu": [
      "నీటి ఊటలు (ఎగువ ఊటలు మరియు దిగువ ఊటలు)",
      "గొఱ్ఱెల మందలు",
      "బంగారు ఆభరణాలు",
      "ఒలీవ తోటలు"
    ],
    "correctAnswer": "Water springs (the upper and lower springs)",
    "bibleReference": "Joshua 15:19",
    "explanation": "Achsah asked for water springs because Caleb had given her land in the Negev, and he gave her upper and lower springs.",
    "explanationTelugu": "అక్సా: నాకు దీవెన దయచేయుము, నాకు దక్షిణ భూమి ఇచ్చితివి గనుక నీటి ఊటలను కూడా దయచేయుమనెను; కాలేబు ఎగువ ఊటలను దిగువ ఊటలను ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "From which town and family clan was Manoah, the father of Samson, in Judges 13:2?",
    "questionTelugu": "న్యాయాధిపతులు 13:2 ప్రకారం, సమ్సోను తండ్రియైన మనోహ ఏ పట్టణము మరియు ఏ వంశమునకు చెందినవాడు?",
    "options": [
      "Zorah, of the clan of the Danites",
      "Bethlehem, of the clan of Judah",
      "Shiloh, of the clan of Ephraim",
      "Hebron, of the Levites"
    ],
    "optionsTelugu": [
      "జొర్యా పట్టణస్థుడు, దాను వంశస్థుడు",
      "బేత్లెహేము, యూదా వంశస్థుడు",
      "షీలోహు, ఎఫ్రాయిము వంశస్థుడు",
      "హెబ్రోను, లేవీయుడు"
    ],
    "correctAnswer": "Zorah, of the clan of the Danites",
    "bibleReference": "Judges 13:2",
    "explanation": "Manoah was from Zorah, belonging to the Danite clan.",
    "explanationTelugu": "దానీయుల వంశస్థుడైన జొర్యా పట్టణపు మనోహ అను ఒక మనుష్యుడు ఉండెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Judges 11:34, how is Jephthah's familial relationship to the daughter who met him described?",
    "questionTelugu": "న్యాయాధిపతులు 11:34 లో యెఫ్తాను ఎదుర్కొన్న కుమార్తెను గూర్చి ఆమె అతని కుటుంబములో ఎలాంటి సంతానమని వ్రాయబడెను?",
    "options": [
      "She was his only child, beside whom he had neither son nor daughter",
      "She was his youngest daughter among many",
      "She was his adopted niece",
      "She was his firstborn stepchild"
    ],
    "optionsTelugu": [
      "ఆమె అతని ఏకైక కుమార్తె; ఆమె తప్ప అతనికి కుమారుడైనను కుమార్తెయైనను లేకుండెను",
      "అతని అనేక కుమార్తెలలో చిన్నది",
      "అతడు పెంచుకున్న మేనకోడలు",
      "అతని సవతి కుమార్తె"
    ],
    "correctAnswer": "She was his only child, beside whom he had neither son nor daughter",
    "bibleReference": "Judges 11:34",
    "explanation": "She was his one and only child; beside her he had neither son nor daughter.",
    "explanationTelugu": "ఆమె అతని ఏకైక సంతానము; ఆమె తప్ప అతనికి కుమారుడైనను కుమార్తెయైనను లేకుండెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "What tragic act did the mother of Micah perform with silver in Judges 17:1-3?",
    "questionTelugu": "న్యాయాధిపతులు 17:1-3 లో మీకా తల్లి తన వెండితో చేసిన పాపపు కార్యము ఏమిటి?",
    "options": [
      "Dedicated eleven hundred shekels of silver to make a carved and metal image",
      "Gave it all to the high priest at Shiloh",
      "Buried it under an oak tree",
      "Distributed it to poor orphans"
    ],
    "optionsTelugu": [
      "చెక్కబడిన విగ్రహమును పోతవిగ్రహమును చేయుటకు పదకొండు వందల తులముల వెండిని ప్రతిష్టించెను",
      "షీలోహు ప్రధాన యాజకునికిచ్చెను",
      "సిందూర వృక్షము క్రింద దాచెను",
      "అనాథలకు పంచెను"
    ],
    "correctAnswer": "Dedicated eleven hundred shekels of silver to make a carved and metal image",
    "bibleReference": "Judges 17:1-3",
    "explanation": "Micah returned 1,100 shekels of silver to his mother, who used 200 shekels to make an idol in their household.",
    "explanationTelugu": "మీకా తల్లి ఆ వెండిలో రెండు వందల తులములు తీసి ఒక విగ్రహమును పోతవిగ్రహమును చేసి మీకా ఇంట నుంచెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Ruth 1:2, what was the ancestral region in Judah from which Elimelech and Naomi originated?",
    "questionTelugu": "రూతు 1:2 లో ఎలీమెలెకు నయోమీలు యూదాలోని ఏ పూర్వీక ప్రాంతమునకు చెందినవారు?",
    "options": [
      "Ephrathites from Bethlehem of Judah",
      "Korathites from Hebron",
      "Gileadites from Ramoth",
      "Benjamites from Gibeah"
    ],
    "optionsTelugu": [
      "యూదా బేత్లెహేమునకు చెందిన ఎఫ్రాతీయులు",
      "హెబ్రోను కోరహీయులు",
      "రామోతు గిలాదీయులు",
      "గిబియా బెన్యామీనీయులు"
    ],
    "correctAnswer": "Ephrathites from Bethlehem of Judah",
    "bibleReference": "Ruth 1:2",
    "explanation": "They were Ephrathites of Bethlehem in Judah who migrated to Moab during a famine.",
    "explanationTelugu": "వారు యూదా బేత్లెహేమునకు చెందిన ఎఫ్రాతీయులై మోయాబు దేశమునకు వెళ్లిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "What were the names of Naomi's two sons whose deaths left her family completely without male heirs in Moab?",
    "questionTelugu": "రూతు 1:2-5 లో మోయాబులో మరణించి కుటుంబములో పురుష సంతానము లేకుండ చేసిన నయోమి ఇద్దరు కుమారుల పేర్లు ఏమిటి?",
    "options": [
      "Mahlon and Chilion",
      "Hophni and Phinehas",
      "Nadab and Abihu",
      "Er and Onan"
    ],
    "optionsTelugu": [
      "మహలోను మరియు కిల్యోను",
      "హొఫ్నీ మరియు ఫీనెహాసు",
      "నాదాబు మరియు అబీహు",
      "ఏరు మరియు ఓనాను"
    ],
    "correctAnswer": "Mahlon and Chilion",
    "bibleReference": "Ruth 1:2",
    "explanation": "Her two sons were Mahlon (who married Ruth) and Chilion (who married Orpah).",
    "explanationTelugu": "ఆమె కుమారుల పేర్లు మహలోను మరియు కిల్యోను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "Under ancient custom in Ruth 4:7, how did the nearer kinsman confirm the transfer of his redemption right to Boaz?",
    "questionTelugu": "రూతు 4:7 లోని ప్రాచీన పద్ధతి ప్రకారం, స్వాస్థ్య విమోచన హక్కును బోయజుకు దఖలుపరచుటకు సమీప బంధువు ఏమి చేసెను?",
    "options": [
      "He took off his sandal and handed it to the other party",
      "He poured oil on the town gate",
      "He broke an earthen jar before the elders",
      "He cut a branch of an olive tree"
    ],
    "optionsTelugu": [
      "తన పాదరక్షను తీసి తోటివానికి ఇచ్చెను",
      "పట్టణ ద్వారముపై నూనె పోసెను",
      "పెద్దల ఎదుట మట్టిపాత్రను పగలగొట్టెను",
      "ఒలీవ కొమ్మను నరికెను"
    ],
    "correctAnswer": "He took off his sandal and handed it to the other party",
    "bibleReference": "Ruth 4:7-8",
    "explanation": "In Israel, this was the manner concerning redeeming: a man removed his sandal and gave it to his neighbor.",
    "explanationTelugu": "ఇశ్రాయేలులో విమోచనను స్థిరపరచు పద్ధతి ఏదనగా, ఒకడు తన చెప్పును విప్పి తన తోటివానికి ఇచ్చువాడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "According to Deuteronomy 25:5-6, what was the primary biblical purpose of Levirate marriage (Yibbum)?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 25:5-6 ప్రకారం మరుది పెండ్లి (మృతి చెందిన సహోదరుని భార్యను వివాహమాడుట) యొక్క ముఖ్య ఉద్దేశము ఏమిటి?",
    "options": [
      "To perpetuate the deceased brother's name in Israel so it wouldn't be blotted out",
      "To merge the wealth of two separate tribes",
      "To release widows from manual labor",
      "To provide soldiers for the national army"
    ],
    "optionsTelugu": [
      "చనిపోయిన సహోదరుని పేరు ఇశ్రాయేలులో తుడిచిపెట్టబడకుండునట్లు అతని పేరు నిలుపుట",
      "రెండు గోత్రాల ఆస్తిని కలుపుట",
      "విధవరాండ్రను శ్రమనుండి విడిపించుట",
      "సైన్యానికి సైనికులను సమకూర్చుట"
    ],
    "correctAnswer": "To perpetuate the deceased brother's name in Israel so it wouldn't be blotted out",
    "bibleReference": "Deuteronomy 25:6",
    "explanation": "The firstborn son shall succeed in the name of his dead brother, that his name may not be blotted out of Israel.",
    "explanationTelugu": "ఆమె కను మొదటి కుమారుడు చనిపోయిన సహోదరుని పేరు ఇశ్రాయేలులో తుడిచిపెట్టబడకుండునట్లు అతని పేరట నిలువవలెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "What blessing did the town elders of Bethlehem pronounce over Boaz's marriage to Ruth in Ruth 4:11?",
    "questionTelugu": "రూతు 4:11 లో బేత్లెహేము పెద్దలు బోయజు రూతుల వివాహముపై పలికిన ఆశీర్వాదము ఏమిటి?",
    "options": [
      "May she be like Rachel and Leah, who together built up the house of Israel",
      "May she conquer the cities of Philistia",
      "May she reign as queen of Jerusalem",
      "May she be wealthier than all daughters of the east"
    ],
    "optionsTelugu": [
      "ఇశ్రాయేలు వంశమును కట్టిన రాహేలు లేయాలవలె దేవుడు ఈ స్త్రీని చేయును గాక",
      "ఫిలిష్తీయుల పట్టణాలను జయించును గాక",
      "యెరూషలేము రాణిగా ఏలును గాక",
      "తూర్పు కుమార్తెలందరి కంటే ధనవంతురాలగును గాక"
    ],
    "correctAnswer": "May she be like Rachel and Leah, who together built up the house of Israel",
    "bibleReference": "Ruth 4:11",
    "explanation": "The elders prayed: 'The Lord make the woman like Rachel and Leah, which two did build the house of Israel.'",
    "explanationTelugu": "పెద్దలు: నీ యింటికి వచ్చుచున్న ఈ స్త్రీని ఇశ్రాయేలు వంశమును నిర్మించిన రాహేలు లేయాలవలె చేయును గాక అని దీవించిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "In 1 Chronicles 2:13-15, David is listed as which numbered son of Jesse?",
    "questionTelugu": "1 దినవృత్తాంతములు 2:13-15 ప్రకారం, యెష్షయి కుమారులలో దావీదు ఎన్నవ కుమారుడు?",
    "options": [
      "Seventh son",
      "Eighth son",
      "Sixth son",
      "Fifth son"
    ],
    "optionsTelugu": [
      "ఏడవ కుమారుడు",
      "ఎనిమిదవ కుమారుడు",
      "ఆరవ కుమారుడు",
      "ఐదవ కుమారుడు"
    ],
    "correctAnswer": "Seventh son",
    "bibleReference": "1 Chronicles 2:15",
    "explanation": "1 Chronicles 2:15 explicitly lists David as the seventh son born to Jesse.",
    "explanationTelugu": "1 దినవృత్తాంతములు 2:15 లో దావీదు యెష్షయి యొక్క ఏడవ కుమారుడని వ్రాయబడెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "Who was David's sister and the mother of military commander Amasa in 1 Chronicles 2:16-17?",
    "questionTelugu": "1 దినవృత్తాంతములు 2:16-17 లో సైన్యాధిపతియైన అమాశా యొక్క తల్లి మరియు దావీదు సహోదరి ఎవరు?",
    "options": [
      "Abigail",
      "Zeruiah",
      "Tamar",
      "Michal"
    ],
    "optionsTelugu": [
      "అబీగయీలు",
      "సెరూయా",
      "తామారు",
      "మీకాలు"
    ],
    "correctAnswer": "Abigail",
    "bibleReference": "1 Chronicles 2:17",
    "explanation": "Abigail bore Amasa; the father of Amasa was Jether the Ishmaelite.",
    "explanationTelugu": "అబీగయీలు అమాశాను కనెను; అమాశా తండ్రి ఇష్మాయేలీయుడైన యెతెరు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which of David's sons was born to Maacah daughter of Talmai, king of Geshur, in 2 Samuel 3:3?",
    "questionTelugu": "2 సమూయేలు 3:3 లో గెషూరు రాజైన తల్మయి కుమార్తెయైన మయకాకు దావీదు వలన పుట్టిన కుమారుడు ఎవరు?",
    "options": [
      "Absalom",
      "Adonijah",
      "Amnon",
      "Shephatiah"
    ],
    "optionsTelugu": [
      "అబ్షాలోము",
      "అదోనీయా",
      "అమ్నోను",
      "షెఫట్య"
    ],
    "correctAnswer": "Absalom",
    "bibleReference": "2 Samuel 3:3",
    "explanation": "His third son was Absalom, whose mother was Maacah daughter of Talmai king of Geshur.",
    "explanationTelugu": "మూడవవాడు గెషూరు రాజైన తల్మయి కుమార్తెయైన మయకా కుమారుడగు అబ్షాలోము.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "In 2 Samuel 19:37-38, which son of elderly Barzillai the Gileadite did King David receive and care for in Jerusalem like his own household?",
    "questionTelugu": "2 సమూయేలు 19:37-38 లో వృద్ధుడైన బర్జిల్లయి కోరిక మేరకు దావీదు రాజు యెరూషలేములో తన స్వంత కుటుంబమువలె ఆదరించిన అతని కుమారుడు ఎవరు?",
    "options": [
      "Chimham",
      "Ittai the Gittite",
      "Ahimaaz",
      "Jonathan son of Abiathar"
    ],
    "optionsTelugu": [
      "కింహాము",
      "గిత్తీయుడైన ఇత్తయి",
      "అహిమయస్సు",
      "అబ్యాతారు కుమారుడైన యోనాతాను"
    ],
    "correctAnswer": "Chimham",
    "bibleReference": "2 Samuel 19:37-38",
    "explanation": "David took Chimham across the Jordan and showed him royal favor in honor of his father Barzillai.",
    "explanationTelugu": "దావీదు బర్జిల్లయి కుమారుడైన కింహామును తనతో తోడుకొనిపోయి రాజమర్యాదలతో పోషించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "Who was Adonijah's mother who bore him to David in 2 Samuel 3:4?",
    "questionTelugu": "2 సమూయేలు 3:4 ప్రకారం దావీదు వలన అదోనీయాను కనిన అతని తల్లి ఎవరు?",
    "options": [
      "Haggith",
      "Abital",
      "Eglah",
      "Ahinoam"
    ],
    "optionsTelugu": [
      "హగ్గీతు",
      "అబీతలు",
      "ఎగ్లా",
      "అహీనోయము"
    ],
    "correctAnswer": "Haggith",
    "bibleReference": "2 Samuel 3:4",
    "explanation": "The fourth son born to David was Adonijah, the son of Haggith.",
    "explanationTelugu": "నాలుగవవాడు హగ్గీతు కుమారుడైన అదోనీయా.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "Who was the mother of King Rehoboam identified in 1 Kings 14:21?",
    "questionTelugu": "1 రాజులు 14:21 లో రెహబాము రాజు యొక్క తల్లిగా పేర్కొనబడిన స్త్రీ ఎవరు?",
    "options": [
      "Naamah the Ammonitess",
      "Maacah daughter of Absalom",
      "Tahpenes of Egypt",
      "Jezebel of Sidon"
    ],
    "optionsTelugu": [
      "అమ్మోనీయురాలైన నయమా",
      "అబ్షాలోము కుమార్తెయైన మయకా",
      "ఐగుప్తు తహ్పేనేసు",
      "సీదోను యెజెబెలు"
    ],
    "correctAnswer": "Naamah the Ammonitess",
    "bibleReference": "1 Kings 14:21",
    "explanation": "Rehoboam was forty-one years old when he became king; his mother's name was Naamah the Ammonitess.",
    "explanationTelugu": "రెహబాము ఏలనారంభించినప్పుడు నలువదియొకటవ యేటివాడు; అతని తల్లి అమ్మోనీయురాలైన నయమా.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "Why did King Asa remove his grandmother Maacah from her royal position as Queen Mother in 1 Kings 15:13?",
    "questionTelugu": "1 రాజులు 15:13 లో ఆసా రాజు తన అవ్వయైన మయకాను పట్టపురాణి పదవినుండి ఎందుకు తొలగించెను?",
    "options": [
      "She had made an abominable image for Asherah",
      "She conspired with the king of Syria",
      "She refused to pay temple tithes",
      "She allied with the house of Jeroboam"
    ],
    "optionsTelugu": [
      "ఆమె అషేరాకు అసహ్యకరమైన ప్రతిమను చేయించినందున",
      "సిరియా రాజుతో కుట్ర పన్నినందున",
      "దేవాలయ దశమభాగము చెల్లించనందున",
      "యరొబాము ఇంటివారితో చేతులు కలిపినందున"
    ],
    "correctAnswer": "She had made an abominable image for Asherah",
    "bibleReference": "1 Kings 15:13",
    "explanation": "Asa deposed Maacah because she had made an obscene image for Asherah; he cut it down and burned it.",
    "explanationTelugu": "ఆమె అషేరాదేవికి అసహ్యమైన విగ్రహము చేయించినందున ఆసా రాజు ఆమెను పట్టపురాణి పదవినుండి తొలగించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which courageous aunt, the wife of priest Jehoiada, hid young baby Joash from Queen Athaliah in 2 Kings 11:2?",
    "questionTelugu": "2 రాజులు 11:2 లో యెహోయాదా యాజకుని భార్యయై, అథల్యా బారినుండి యోవాషు అను పసిబిడ్డను ప్రాణముతో దాచిన మేనత్త ఎవరు?",
    "options": [
      "Jehosheba (Jehoshabeath)",
      "Huldah",
      "Athaliah",
      "Shelomith"
    ],
    "optionsTelugu": [
      "యెహోషెబ (యెహోషబ్యాతు)",
      "హుల్దా",
      "అథల్యా",
      "షెలోమీతు"
    ],
    "correctAnswer": "Jehosheba (Jehoshabeath)",
    "bibleReference": "2 Kings 11:2",
    "explanation": "Jehosheba daughter of King Joram and sister of Ahaziah hid Joash and his nurse in a bedroom.",
    "explanationTelugu": "యోరాము రాజు కుమార్తెయు అహజ్యా సహోదరియునైన యెహోషెబ యోవాషును అతని దాదిని పడకగదిలో దాచెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "In 2 Chronicles 26:3, who was the mother of King Uzziah (Azariah) from Jerusalem?",
    "questionTelugu": "2 దినవృత్తాంతములు 26:3 లో ఉజ్జియా రాజు యొక్క యెరూషలేము పట్టణస్థురాలైన తల్లి ఎవరు?",
    "options": [
      "Jecoliah",
      "Jehoaddan",
      "Azubah",
      "Zibiah"
    ],
    "optionsTelugu": [
      "యెకోల్యా",
      "యెహోయద్దాను",
      "అజూబా",
      "జిబ్యా"
    ],
    "correctAnswer": "Jecoliah",
    "bibleReference": "2 Chronicles 26:3",
    "explanation": "Uzziah was sixteen years old when he became king, and his mother's name was Jecoliah of Jerusalem.",
    "explanationTelugu": "ఉజ్జియా ఏలనారంభించినప్పుడు పదునారేండ్లవాడు; అతని తల్లి పేరు యెరూషలేము కాపురస్థురాలైన యెకోల్యా.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "Who was the grandmother and mother of King Josiah in 2 Kings 22:1?",
    "questionTelugu": "2 రాజులు 22:1 ప్రకారం యోషీయా రాజు యొక్క తల్లి ఎవరు మరియు ఆమె ఏ ఊరి సంబంధి?",
    "options": [
      "Jedidah daughter of Adaiah of Bozkath",
      "Hamutal daughter of Jeremiah of Libnah",
      "Nehushta daughter of Elnathan",
      "Meshullemeth daughter of Haruz"
    ],
    "optionsTelugu": [
      "బొజ్కతు కాపురస్థుడైన అదాయా కుమార్తెయైన యెదీదా",
      "లిబ్నా వాసియైన యిర్మీయా కుమార్తెయైన హమూటలు",
      "ఎల్నితాను కుమార్తెయైన నెహుష్టా",
      "హారూసు కుమార్తెయైన మెషుల్లేమెతు"
    ],
    "correctAnswer": "Jedidah daughter of Adaiah of Bozkath",
    "bibleReference": "2 Kings 22:1",
    "explanation": "Josiah was eight years old when he became king, and his mother's name was Jedidah daughter of Adaiah of Bozkath.",
    "explanationTelugu": "యోషీయా ఏలనారంభించినప్పుడు ఎనిమిదేండ్లవాడు; అతని తల్లి బొజ్కతు కాపురస్థుడైన అదాయా కుమార్తెయైన యెదీదా.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "What were the names of the three daughters born to Job after his trials and restoration in Job 42:14?",
    "questionTelugu": "యోబు 42:14 లో శ్రమల తరువాత దేవుని ఆశీర్వాదముతో యోబునకు పుట్టిన ముగ్గురు కుమార్తెల పేర్లు ఏమిటి?",
    "options": [
      "Jemimah, Keziah, and Keren-Happuch",
      "Mahlah, Noah, and Hoglah",
      "Rachel, Leah, and Dinah",
      "Miriam, Deborah, and Huldah"
    ],
    "optionsTelugu": [
      "యెమీమా, కెజీయా, కెరెంహప్పుకు",
      "మహలా, నోయా, హొగ్లా",
      "రాహేలు, లేయా, దీనా",
      "మిర్యాము, దెబోరా, హుల్దా"
    ],
    "correctAnswer": "Jemimah, Keziah, and Keren-Happuch",
    "bibleReference": "Job 42:14",
    "explanation": "Job named the first Jemimah, the second Keziah, and the third Keren-Happuch.",
    "explanationTelugu": "అతడు మొదటిదానికి యెమీమా అనియు, రెండవదానికి కెజీయా అనియు, మూడవదానికి కెరెంహప్పుకు అనియు పేర్లు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "What unique right regarding family inheritance did Job give to his three daughters in Job 42:15?",
    "questionTelugu": "యోబు 42:15 లో తన ముగ్గురు కుమార్తెలకు యోబు ఏ అరుదైన కుటుంబ హక్కును దయచేసెను?",
    "options": [
      "He gave them an inheritance among their brothers",
      "He dedicated them to serve at the tabernacle",
      "He gave them all his gold without land",
      "He reserved the family home solely for them"
    ],
    "optionsTelugu": [
      "వారి సహోదరులతో సమానముగా వారికి స్వాస్థ్యములను ఇచ్చెను",
      "గుడారములో సేవ చేయుటకు ప్రతిష్టించెను",
      "భూమి కాకుండా బంగారము మాత్రమే ఇచ్చెను",
      "కుటుంబ గృహమును వారి పేరట రాసెను"
    ],
    "correctAnswer": "He gave them an inheritance among their brothers",
    "bibleReference": "Job 42:15",
    "explanation": "Their father granted them an inheritance along with their brothers.",
    "explanationTelugu": "వారి తండ్రి వారి సహోదరులతో సమానముగా వారికి స్వాస్థ్యములను ఇచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "Who was the father of Gomer, whom Hosea took as wife in Hosea 1:3?",
    "questionTelugu": "హోషేయ 1:3 లో హోషేయ వివాహము చేసికొనిన గోమెరు యొక్క తండ్రి ఎవరు?",
    "options": [
      "Diblaim",
      "Beeri",
      "Amittai",
      "Barachel"
    ],
    "optionsTelugu": [
      "దిబ్లయీము",
      "బేయేరి",
      "అమిత్తయి",
      "బరకెలు"
    ],
    "correctAnswer": "Diblaim",
    "bibleReference": "Hosea 1:3",
    "explanation": "Hosea went and took Gomer daughter of Diblaim, who conceived and bore him a son.",
    "explanationTelugu": "హోషేయ వెళ్లి దిబ్లయీము కుమార్తెయైన గోమెరును పెండ్లి చేసికొనెను; ఆమె గర్భవతియై అతనికి కుమారుని కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "What prophetic name was given to Hosea's daughter in Hosea 1:6, meaning 'Not Pitied'?",
    "questionTelugu": "హోషేయ 1:6 లో 'జాలి నొందనిది' అను భావముగల ఏ ప్రవచనార్థకమైన పేరు హోషేయ కుమార్తెకు పెట్టబడెను?",
    "options": [
      "Lo-Ruhamah",
      "Lo-Ammi",
      "Jezreel",
      "Hepzibah"
    ],
    "optionsTelugu": [
      "లోరుహామా",
      "లోఅమ్మీ",
      "యెజ్రెయేలు",
      "హెఫ్సీబా"
    ],
    "correctAnswer": "Lo-Ruhamah",
    "bibleReference": "Hosea 1:6",
    "explanation": "God said to him, 'Name her Lo-Ruhamah, for I will no longer show love to Israel.'",
    "explanationTelugu": "దేవుడు: ఆమెకు లోరుహామా అను పేరు పెట్టుము; ఇకమీదట నేను ఇశ్రాయేలు వంశస్థులయెడల ఎంతమాత్రమును జాలిపడను అని సెలవిచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Zechariah 12:12-14, which specific royal and priestly family clans are prophesied to mourn individually in repentance?",
    "questionTelugu": "జెకర్యా 12:12-14 లో మారుమనస్సు పొంది ప్రత్యేకముగా దుఃఖింపబోవు కుటుంబాలుగా పేర్కొనబడిన రాజ మరియు యాజక వంశాలు ఏవి?",
    "options": [
      "The family of the house of David, Nathan, Levi, and Shimei",
      "The family of Saul, Jonathan, Eli, and Phinehas",
      "The family of Jeroboam, Baasha, Omri, and Jehu",
      "The family of Caleb, Joshua, Gideon, and Samson"
    ],
    "optionsTelugu": [
      "దావీదు వంశము, నాతాను వంశము, లేవి వంశము, షిమీ వంశము",
      "సౌలు వంశము, యోనాతాను, ఏలీ, ఫీనెహాసు వంశాలు",
      "యరొబాము, బాషా, ఓమ్రీ, యేహూ వంశాలు",
      "కాలేబు, యెహోషువ, గిద్యోను, సమ్సోను వంశాలు"
    ],
    "correctAnswer": "The family of the house of David, Nathan, Levi, and Shimei",
    "bibleReference": "Zechariah 12:12-14",
    "explanation": "The scripture names the house of David, the house of Nathan, the house of Levi, and the house of Shimei mourning apart with their wives apart.",
    "explanationTelugu": "దావీదు సంతతివారును వారి స్త్రీలును, నాతాను సంతతివారును, లేవి సంతతివారును, షిమీ సంతతివారును ప్రత్యేకముగా దుఃఖింతురు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Luke 1:5, to which priestly division did Zechariah belong, and from whose daughters was Elizabeth his wife?",
    "questionTelugu": "లూకా 1:15 లో జెకర్యా ఏ యాజక తరగతికి చెందినవాడు, మరియు అతని భార్య ఎలీసబెతు ఎవరి కుమార్తెలలోనిది?",
    "options": [
      "Division of Abijah; of the daughters of Aaron",
      "Division of Zadok; of the daughters of Moses",
      "Division of Ithamar; of the daughters of David",
      "Division of Asaph; of the daughters of Levi"
    ],
    "optionsTelugu": [
      "అబీయా తరగతికి చెందినవాడు; అహరోను కుమార్తెలలోనిది",
      "సాదోకు తరగతి; మోషే కుమార్తెలలోనిది",
      "ఈతామారు తరగతి; దావీదు కుమార్తె",
      "ఆసాపు తరగతి; లేవి కుమార్తె"
    ],
    "correctAnswer": "Division of Abijah; of the daughters of Aaron",
    "bibleReference": "Luke 1:5",
    "explanation": "Zechariah belonged to the priestly division of Abijah; his wife Elizabeth was also a descendant of Aaron.",
    "explanationTelugu": "అబీయా తరగతిలో జెకర్యా అను ఒక యాజకుడుండెను. అతని భార్య అహరోను కుమార్తెలలో ఒకతె, ఆమె పేరు ఎలీసబెతు.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "In 2 Timothy 1:5, who were the two generations of faithful family matriarchs who nurtured Timothy's faith?",
    "questionTelugu": "2 తిమోతి 1:5 లో తిమోతి యొక్క నిష్కపటమైన విశ్వాసమునకు పునాది వేసిన అతని అవ్వ మరియు తల్లి పేర్లు ఏమిటి?",
    "options": [
      "Grandmother Lois and mother Eunice",
      "Grandmother Anna and mother Salome",
      "Grandmother Martha and mother Mary",
      "Grandmother Joanna and mother Susanna"
    ],
    "optionsTelugu": [
      "అవ్వయైన లోయి మరియు తల్లియైన యునీకే",
      "అవ్వయైన అన్నా మరియు తల్లియైన సలోమే",
      "అవ్వయైన మార్త మరియు తల్లియైన మరియ",
      "అవ్వయైన యోహన్నా మరియు తల్లియైన సుసన్న"
    ],
    "correctAnswer": "Grandmother Lois and mother Eunice",
    "bibleReference": "2 Timothy 1:5",
    "explanation": "Paul recalls the sincere faith that dwelt first in grandmother Lois and mother Eunice.",
    "explanationTelugu": "మొదట నీ అవ్వయైన లోయిలోను నీ తల్లియైన యునీకేలోను నివసించిన ఆ నిష్కపటమైన విశ్వాసము.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Acts 21:8-9, who was the evangelist residing at Caesarea whose four unmarried daughters possessed the spiritual gift of prophecy?",
    "questionTelugu": "అపొస్తలుల కార్యములు 21:8-9 లో కైసరయలో నివసించిన ఏ సువార్తికుని నలుగురు అవివాహిత కుమార్తెలు ప్రవచించు వరము కలిగియుండిరి?",
    "options": [
      "Philip the evangelist",
      "Stephen the martyr",
      "Barnabas of Cyprus",
      "Apollos of Alexandria"
    ],
    "optionsTelugu": [
      "సువార్తికుడైన ఫిలిప్పు",
      "హతసాక్షియైన స్తెఫను",
      "కుప్రవాసియైన బర్నబా",
      "అలెగ్జాండ్రియా వాసియైన అపొల్లో"
    ],
    "correctAnswer": "Philip the evangelist",
    "bibleReference": "Acts 21:8-9",
    "explanation": "Philip the evangelist, one of the seven, had four unmarried daughters who prophesied.",
    "explanationTelugu": "ఏడుగురిలో ఒకడైన ఫిలిప్పు అను సువార్తికుని ఇంట ప్రవేశించితిమి; అతనికి ప్రవచనవరముగల కన్యకలైన నలుగురు కుమార్తెలుండిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Philemon 1:1-2, which woman is greeted by Paul alongside Philemon as 'our sister' and likely his wife?",
    "questionTelugu": "ఫిలేమోనుకు 1:1-2 లో పౌలు ఫిలేమోనుతో పాటు 'సహోదరియైన' అని సంబోధించిన గృహపత్ని ఎవరు?",
    "options": [
      "Apphia",
      "Priscilla",
      "Chloe",
      "Phoebe"
    ],
    "optionsTelugu": [
      "అప్పియా",
      "ప్రిస్కిల్లా",
      "క్లోయే",
      "ఫేబే"
    ],
    "correctAnswer": "Apphia",
    "bibleReference": "Philemon 1:2",
    "explanation": "Paul writes to Philemon our beloved fellow worker, and to Apphia our sister, and Archippus our fellow soldier.",
    "explanationTelugu": "ప్రియుడును తోడి పనివాడునైన ఫిలేమోనుకును, సహోదరియైన అప్పియకును, తోడిజోదు అయిన అర్ఖిప్పుకును పౌలు వ్రాయునది.",
    "marks": 1
  },
  {
    "id": "fam_h_s1_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Romans 16:13, whose biological mother does the apostle Paul affectionately embrace as having been a mother to himself?",
    "questionTelugu": "రోమీయులకు 16:13 లో అపొస్తలుడైన పౌలు ఎవరి తల్లిని 'నాకును తల్లి' అని ప్రేమపూర్వకముగా సంబోధించెను?",
    "options": [
      "Mother of Rufus",
      "Mother of Mark",
      "Mother of Timothy",
      "Mother of James and John"
    ],
    "optionsTelugu": [
      "రూఫు యొక్క తల్లి",
      "మార్కు యొక్క తల్లి",
      "తిమోతి యొక్క తల్లి",
      "యాకోబు యోహానుల తల్లి"
    ],
    "correctAnswer": "Mother of Rufus",
    "bibleReference": "Romans 16:13",
    "explanation": "Paul writes: 'Greet Rufus, chosen in the Lord, and his mother, who has been a mother to me, too.'",
    "explanationTelugu": "ప్రభువునందు ఏర్పరచబడిన రూఫునకును, నాకును తల్లియైన అతని తల్లికిని నా వందనములు చెప్పుడి.",
    "marks": 1
  }
];

export const FAMILY_HARD_GROWTH: QuizQuestion[] = [
  {
    "id": "fam_h_s2_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "According to Genesis 5:25, how old was Methuselah when he fathered Lamech?",
    "questionTelugu": "ఆదికాండము 5:25 ప్రకారం, మెతూషెల లెమెకును కనినప్పుడు అతని వయస్సు ఎంత?",
    "options": [
      "187 years old",
      "182 years old",
      "365 years old",
      "65 years old"
    ],
    "optionsTelugu": [
      "187 సంవత్సరాలు",
      "182 సంవత్సరాలు",
      "365 సంవత్సరాలు",
      "65 సంవత్సరాలు"
    ],
    "correctAnswer": "187 years old",
    "bibleReference": "Genesis 5:25",
    "explanation": "Methuselah lived one hundred and eighty-seven years and fathered Lamech.",
    "explanationTelugu": "మెతూషెల నూట ఎనుబది యేడేండ్లు బ్రదికి లెమెకును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Genesis 10:8-9, who was the father of Nimrod, who grew to be a mighty warrior on the earth?",
    "questionTelugu": "ఆదికాండము 10:8-9 లో భూమిమీద పరాక్రమశాలియైన నిమ్రోదు యొక్క తండ్రి ఎవరు?",
    "options": [
      "Cush",
      "Mizraim",
      "Put",
      "Canaan"
    ],
    "optionsTelugu": [
      "కూషు",
      "మిస్రాయిము",
      "పూతు",
      "కనాను"
    ],
    "correctAnswer": "Cush",
    "bibleReference": "Genesis 10:8",
    "explanation": "Cush fathered Nimrod; he became a mighty one on the earth.",
    "explanationTelugu": "కూషు నిమ్రోదును కనెను; అతడు భూమిమీద పరాక్రమశాలియై యుండనారంభించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "Which brother of Abram died before his father Terah in Ur of the Chaldeans, leaving his son Lot behind in Genesis 11:27-28?",
    "questionTelugu": "ఆదికాండము 11:27-28 లో కల్దీయుల ఊరులో తన తండ్రి తేరహు బ్రదికియుండగానే మరణించిన అబ్రాము సహోదరుడు ఎవరు?",
    "options": [
      "Haran",
      "Nahor",
      "Serug",
      "Peleg"
    ],
    "optionsTelugu": [
      "హారాను",
      "నాహోరు",
      "సెరూగు",
      "పేలెగు"
    ],
    "correctAnswer": "Haran",
    "bibleReference": "Genesis 11:28",
    "explanation": "Haran died before his father Terah in his native land, in Ur of the Chaldeans.",
    "explanationTelugu": "హారాను తాను పుట్టిన దేశమైన కల్దీయుల ఊరను పట్టణమందు తన తండ్రియైన తేరహు కంటే ముందుగా మృతిబొందెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Genesis 22:20-22, how many sons did Milcah bear to Abraham's brother Nahor in Mesopotamia?",
    "questionTelugu": "ఆదికాండము 22:20-22 లో అబ్రాహాము సహోదరుడైన నాహోరుకు మిల్కా ఎంతమంది కుమారులను కనెను?",
    "options": [
      "Eight sons (including Uz, Buz, and Bethuel)",
      "Four sons",
      "Twelve sons",
      "Six sons"
    ],
    "optionsTelugu": [
      "ఎనిమిదిమంది కుమారులు (ఊజు, బూజు, బెతూయేలు మొదలగువారు)",
      "నలుగురు",
      "పండ్రెండుగురు",
      "ఆరుగురు"
    ],
    "correctAnswer": "Eight sons (including Uz, Buz, and Bethuel)",
    "bibleReference": "Genesis 22:20-23",
    "explanation": "Milcah bore eight sons to Abraham's brother Nahor, of whom Bethuel fathered Rebekah.",
    "explanationTelugu": "మిల్కా అబ్రాహాము సహోదరుడైన నాహోరునకు ఎనిమిదిమంది కుమారులను కనెను; బెతూయేలు రిబ్కాను కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Genesis 25:25, how was the firstborn twin Esau described physically at birth?",
    "questionTelugu": "ఆదికాండము 25:25 లో పుట్టుకతోనే జ్యేష్ఠుడైన ఏశావు యొక్క శరీర రూపము ఎలా వర్ణించబడెను?",
    "options": [
      "Red all over, like a hairy garment",
      "Smooth and fair",
      "Tall and muscular",
      "With white hair"
    ],
    "optionsTelugu": [
      "ఎర్రగాను ఒళ్లంతయు రోమముల కంబళివలెను",
      "నునుపుగా మరియు తెల్లగా",
      "పొడుగుగా బలముగా",
      "నెరిసిన తెల్లని వెంట్రుకలతో"
    ],
    "correctAnswer": "Red all over, like a hairy garment",
    "bibleReference": "Genesis 25:25",
    "explanation": "The first came out red, all over like a hairy coat; so they called his name Esau.",
    "explanationTelugu": "మొదటివాడు ఎర్రనివాడుగాను ఒళ్లంతయు రోమముల కంబళివలెను ఉండెను, గనుక అతనికి ఏశావు అను పేరు పెట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Genesis 24:15 and 29:5, who was the father of Laban and Rebekah in Paddan-aram?",
    "questionTelugu": "ఆదికాండము 24:15 మరియు 29:5 ప్రకారం పద్దనరాములో లాబాను మరియు రిబ్కాల తండ్రి ఎవరు?",
    "options": [
      "Bethuel son of Milcah",
      "Nahor son of Terah",
      "Chesed",
      "Haran"
    ],
    "optionsTelugu": [
      "మిల్కా కుమారుడైన బెతూయేలు",
      "తేరహు కుమారుడైన నాహోరు",
      "కెసెదు",
      "హారాను"
    ],
    "correctAnswer": "Bethuel son of Milcah",
    "bibleReference": "Genesis 24:15",
    "explanation": "Rebekah was born to Bethuel son of Milcah, the wife of Abraham's brother Nahor.",
    "explanationTelugu": "రిబ్కా అబ్రాహాము సహోదరుడైన నాహోరు భార్యయైన మిల్కా కుమారుడగు బెతూయేలుకు పుట్టినది.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "What did Rachel declare regarding her family rivalry with Leah when Naphtali was born in Genesis 30:8?",
    "questionTelugu": "ఆదికాండము 30:8 లో నఫ్తాలి పుట్టినప్పుడు రాహేలు తన అక్కతోడి కుటుంబ పోరాటమును గూర్చి ఏమి పలికెను?",
    "options": [
      "\"With great wrestlings I have wrestled with my sister and have prevailed\"",
      "\"The Lord has taken away my reproach\"",
      "\"God has given me my hire\"",
      "\"A troop comes!\""
    ],
    "optionsTelugu": [
      "\"దేవుని పోరాటములవంటి పోరాటములతో నేను నా అక్కతో పోరాడి గెలిచితినని చెప్పెను\"",
      "\"దేవుడు నా నిందను తొలగించెను\"",
      "\"దేవుడు నా జీతమిచ్చెను\"",
      "\"దళము వచ్చుచున్నది\""
    ],
    "correctAnswer": "\"With great wrestlings I have wrestled with my sister and have prevailed\"",
    "bibleReference": "Genesis 30:8",
    "explanation": "Rachel said, 'With mighty wrestlings I have wrestled with my sister and have prevailed,' so she named him Naphtali.",
    "explanationTelugu": "రాహేలు: నేను నా అక్కతో పోరాడి గెలిచితినని చెప్పి అతనికి నఫ్తాలి అను పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "Where did Rachel hide her father Laban's household idols (teraphim) when he searched the tents in Genesis 31:34?",
    "questionTelugu": "ఆదికాండము 31:34 లో లాబాను గుడారాలను శోధించినప్పుడు రాహేలు తన తండ్రి విగ్రహములను ఎక్కడ దాచెను?",
    "options": [
      "Inside the camel's saddle and sat upon them",
      "Buried under the hearth stone",
      "Inside a grain storage sack",
      "Underneath her mother's bed"
    ],
    "optionsTelugu": [
      "ఒంటె జీనులో పెట్టి వాటిమీద కూర్చుండెను",
      "పొయ్యి క్రింద గుంట తవ్వి",
      "ధాన్యపు సంచిలో",
      "తల్లి మంచము క్రింద"
    ],
    "correctAnswer": "Inside the camel's saddle and sat upon them",
    "bibleReference": "Genesis 31:34",
    "explanation": "Rachel had taken the household gods, put them in the camel's saddle, and sat on them.",
    "explanationTelugu": "రాహేలు ఆ విగ్రహములను తీసి ఒంటె జీనులో పెట్టి వాటిమీద కూర్చుండెను; లాబాను గుడారమంతయు వెదకినను దొరకలేదు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Genesis 35:8, who was Rebekah's beloved nurse who died and was buried beneath Bethel under Allon-bacuth (Oak of Weeping)?",
    "questionTelugu": "ఆదికాండము 35:8 లో బేతేలు క్రింద అల్లోన్-బాకూతు (రోదన వృక్షము) క్రింద సమాధి చేయబడిన రిబ్కా యొక్క దాది ఎవరు?",
    "options": [
      "Deborah",
      "Milcah",
      "Hagar",
      "Puah"
    ],
    "optionsTelugu": [
      "దెబోరా",
      "మిల్కా",
      "హాగరు",
      "పూవా"
    ],
    "correctAnswer": "Deborah",
    "bibleReference": "Genesis 35:8",
    "explanation": "Deborah, Rebekah's nurse, died and was buried below Bethel under an oak named Allon-bacuth.",
    "explanationTelugu": "రిబ్కా దాదియైన దెబోరా మృతిబొంది బేతేలు దిగువనున్న సిందూర వృక్షము క్రింద పాతిపెట్టబడెను; దానికి అల్లోన్-బాకూతు అని పేరు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "According to Genesis 35:28, at what age did Isaac die when gathered to his people?",
    "questionTelugu": "ఆదికాండము 35:28 ప్రకారం ఇస్సాకు తన పితరుల యొద్దకు చేర్చబడినప్పుడు అతని ఆయుష్షు ఎన్ని సంవత్సరాలు?",
    "options": [
      "180 years old",
      "175 years old",
      "147 years old",
      "120 years old"
    ],
    "optionsTelugu": [
      "180 సంవత్సరాలు",
      "175 సంవత్సరాలు",
      "147 సంవత్సరాలు",
      "120 సంవత్సరాలు"
    ],
    "correctAnswer": "180 years old",
    "bibleReference": "Genesis 35:28",
    "explanation": "The days of Isaac were one hundred and eighty years.",
    "explanationTelugu": "ఇస్సాకు దినములు నూట ఎనుబది యేండ్లు; అతడు వృద్ధుడై కాలము నిండినవాడై మృతిబొందెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Genesis 38:28-30, what identifying token did the midwife tie around baby Zerah's wrist at his birth?",
    "questionTelugu": "ఆదికాండము 38:28-30 లో తామారు ప్రసవించినప్పుడు మంత్రసాని జేరహు చేతికి కట్టిన గురుతు ఏమిటి?",
    "options": [
      "A scarlet thread",
      "A blue cord",
      "A golden ring",
      "A piece of fine linen"
    ],
    "optionsTelugu": [
      "ఎర్రని దారము",
      "నీలి నూలు దారము",
      "బంగారు ఉంగరము",
      "సన్నపు నార గుడ్డ"
    ],
    "correctAnswer": "A scarlet thread",
    "bibleReference": "Genesis 38:28",
    "explanation": "The midwife took and bound upon his hand a scarlet thread, saying, 'This one came out first.'",
    "explanationTelugu": "మంత్రసాని ఎర్రని నూలుపోగు తీసి వాని చేతికి కట్టి: వీడు మొదట బయటికి వచ్చెననెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "According to Genesis 46:26, how many direct biological offspring of Jacob (excluding sons' wives) came with him into Egypt?",
    "questionTelugu": "ఆదికాండము 46:26 ప్రకారం కోడండ్రను లెక్కించకుండా యాకోబు స్వంత సంతానమై ఐగుప్తునకు వచ్చిన వారి సంఖ్య ఎంత?",
    "options": [
      "Sixty-six",
      "Seventy",
      "Seventy-five",
      "Twelve"
    ],
    "optionsTelugu": [
      "అరువది ఆరుగురు (66)",
      "డెబ్బది మంది (70)",
      "డెబ్బది ఐదుగురు (75)",
      "పండ్రెండుగురు"
    ],
    "correctAnswer": "Sixty-six",
    "bibleReference": "Genesis 46:26",
    "explanation": "All the persons belonging to Jacob who came into Egypt, who were his own offspring, not including the wives of Jacob's sons, were sixty-six.",
    "explanationTelugu": "యాకోబు కోడండ్రు కాక అతని గర్భవాసమున పుట్టి అతనితో కూడ ఐగుప్తునకు వచ్చిన వారందరు అరువది ఆరుగురు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Genesis 48:5, which two grandsons did Jacob adopt as his own full sons for tribal inheritance?",
    "questionTelugu": "ఆదికాండము 48:5 లో యాకోబు రూబేను షిమ్యోనులతో సమానముగా తన సొంత కుమారులుగా స్వాస్థ్యము పొందుటకు దత్తత తీసుకున్న మనుమలు ఎవరు?",
    "options": [
      "Ephraim and Manasseh",
      "Er and Onan",
      "Gershon and Kohath",
      "Phinehas and Eleazar"
    ],
    "optionsTelugu": [
      "ఎఫ్రాయిము మరియు మనష్షే",
      "ఏరు మరియు ఓనాను",
      "గెర్షోను మరియు కహాతు",
      "ఫీనెహాసు మరియు ఎలియాజరు"
    ],
    "correctAnswer": "Ephraim and Manasseh",
    "bibleReference": "Genesis 48:5",
    "explanation": "Jacob said: 'Ephraim and Manasseh shall be mine, as Reuben and Simeon are.'",
    "explanationTelugu": "యాకోబు: రూబేను షిమ్యోనులవలె ఎఫ్రాయిము మనష్షేలు నావారై యుందురనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "How did aged Israel position his hands when blessing Joseph's sons in Genesis 48:14?",
    "questionTelugu": "ఆదికాండము 48:14 లో యోసేపు కుమారులను ఆశీర్వదించునప్పుడు వృద్ధుడైన ఇశ్రాయేలు తన చేతులను ఎలా ఉంచెను?",
    "options": [
      "Crossed his hands: right hand on younger Ephraim, left hand on firstborn Manasseh",
      "Right hand on firstborn Manasseh, left hand on Ephraim",
      "Both hands on Ephraim only",
      "Laid hands upon Joseph's shoulders"
    ],
    "optionsTelugu": [
      "చేతులను మార్చి: చిన్నవాడైన ఎఫ్రాయిము తలపై కుడిచేతిని, జ్యేష్ఠుడైన మనష్షే తలపై ఎడమచేతిని ఉంచెను",
      "మనష్షేపై కుడిచేయి, ఎఫ్రాయిముపై ఎడమచేయి",
      "రెండూ ఎఫ్రాయిముపైనే",
      "యోసేపు భుజాలపై చేతులు ఉంచెను"
    ],
    "correctAnswer": "Crossed his hands: right hand on younger Ephraim, left hand on firstborn Manasseh",
    "bibleReference": "Genesis 48:14",
    "explanation": "Israel stretched out his right hand and laid it upon Ephraim's head who was the younger, crossing his hands knowingly.",
    "explanationTelugu": "ఇశ్రాయేలు తన కుడిచేయి చాపి చిన్నవాడైన ఎఫ్రాయిము తలమీదను, మనష్షే తలమీద తన ఎడమచేయియు తెలివిగా ఉంచెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Genesis 50:22-23, to what generation of descendants was Joseph blessed to see before dying at age 110?",
    "questionTelugu": "ఆదికాండము 50:22-23 లో నూట పది సంవత్సరముల వయస్సులో మరణించుటకు ముందు యోసేపు ఎవరి మూడవ తరము సంతానమును చూచెను?",
    "options": [
      "Children of Ephraim to the third generation, and children of Machir son of Manasseh",
      "Great-grandchildren of Benjamin only",
      "Descendants of Judah only",
      "Children of Levi"
    ],
    "optionsTelugu": [
      "ఎఫ్రాయిము యొక్క మూడవ తరము పిల్లలను మరియు మనష్షే కుమారుడైన మాకీరు పిల్లలను",
      "బెన్యామీను పిల్లలను మాత్రమే",
      "యూదా సంతానమును మాత్రమే",
      "లేవి పిల్లలను"
    ],
    "correctAnswer": "Children of Ephraim to the third generation, and children of Machir son of Manasseh",
    "bibleReference": "Genesis 50:23",
    "explanation": "Joseph saw Ephraim's children of the third generation; the children of Machir son of Manasseh were brought up upon Joseph's knees.",
    "explanationTelugu": "యోసేపు ఎఫ్రాయిము యొక్క మూడవ తరము పిల్లలను చూచెను; మనష్షే కుమారుడైన మాకీరు పిల్లలును యోసేపు ఒడిలో పెంచబడిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Exodus 6:16, what were the names of Levi's three sons from whom all levitical families derived?",
    "questionTelugu": "నిర్గమకాండము 6:16 లో సమస్త లేవీయ వంశములకు మూలకర్తలైన లేవి ముగ్గురు కుమారుల పేర్లు ఏమిటి?",
    "options": [
      "Gershon, Kohath, and Merari",
      "Aaron, Moses, and Miriam",
      "Nadab, Abihu, and Eleazar",
      "Phinehas, Ithamar, and Korah"
    ],
    "optionsTelugu": [
      "గెర్షోను, కహాతు, మెరారి",
      "అహరోను, మోషే, మిర్యాము",
      "నాదాబు, అబీహు, ఎలియాజరు",
      "ఫీనెహాసు, ఈతామారు, కోరహు"
    ],
    "correctAnswer": "Gershon, Kohath, and Merari",
    "bibleReference": "Exodus 6:16",
    "explanation": "The names of the sons of Levi according to their generations were Gershon, Kohath, and Merari.",
    "explanationTelugu": "లేవి కుమారుల పేర్లు గెర్షోను, కహాతు, మెరారి అనునవి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Exodus 6:18, who were the four sons of Kohath through whom the priestly line descended?",
    "questionTelugu": "నిర్గమకాండము 6:18 లో యాజక వంశమునకు పూర్వీకులైన కహాతు నలుగురు కుమారుల పేర్లు ఏమిటి?",
    "options": [
      "Amram, Izhar, Hebron, and Uzziel",
      "Gershon, Libni, Shimei, and Mahli",
      "Korah, Nepheg, Zichri, and Mishael",
      "Nadab, Abihu, Eleazar, and Ithamar"
    ],
    "optionsTelugu": [
      "అమ్రాము, ఇస్హారు, హెబ్రోను, ఉజ్జీయేలు",
      "గెర్షోను, లిబ్నీ, షిమీ, మహలి",
      "కోరహు, నెఫెగు, జిఖ్రీ, మీషాయేలు",
      "నాదాబు, అబీహు, ఎలియాజరు, ఈతామారు"
    ],
    "correctAnswer": "Amram, Izhar, Hebron, and Uzziel",
    "bibleReference": "Exodus 6:18",
    "explanation": "The sons of Kohath were Amram, Izhar, Hebron, and Uzziel.",
    "explanationTelugu": "కహాతు కుమారులు అమ్రాము, ఇస్హారు, హెబ్రోను, ఉజ్జీయేలు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Exodus 6:21 and Numbers 16:1, whose son was Korah who led the rebellion against Moses and Aaron?",
    "questionTelugu": "నిర్గమకాండము 6:21 మరియు సంఖ్యాకాండము 16:1 లో మోషే అహరోనులపై తిరుగుబాటు చేసిన కోరహు ఎవరి కుమారుడు?",
    "options": [
      "Izhar son of Kohath",
      "Amram son of Kohath",
      "Hebron son of Kohath",
      "Uzziel son of Kohath"
    ],
    "optionsTelugu": [
      "కహాతు కుమారుడైన ఇస్హారు",
      "కహాతు కుమారుడైన అమ్రాము",
      "కహాతు కుమారుడైన హెబ్రోను",
      "కహాతు కుమారుడైన ఉజ్జీయేలు"
    ],
    "correctAnswer": "Izhar son of Kohath",
    "bibleReference": "Exodus 6:21",
    "explanation": "The sons of Izhar were Korah, Nepheg, and Zichri. Korah was Moses and Aaron's first cousin.",
    "explanationTelugu": "ఇస్హారు కుమారులు కోరహు, నెఫెగు, జిఖ్రీ; కాబట్టి కోరహు మోషే అహరోనులకు పినతండ్రి కుమారుడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Leviticus 10:4, which cousins of Aaron were summoned by Moses to carry Nadab and Abihu's bodies out of the camp?",
    "questionTelugu": "లేవీయకాండము 10:4 లో నాదాబు అబీహుల శరీరములను శిబిరము వెలుపలికి మోసికొనిపోవుటకు మోషే పిలిచిన అహరోను పినతండ్రి కుమారులు ఎవరు?",
    "options": [
      "Mishael and Elzaphan, sons of Uzziel",
      "Phinehas and Eleazar",
      "Korah and Nepheg",
      "Gershon and Merari"
    ],
    "optionsTelugu": [
      "ఉజ్జీయేలు కుమారులైన మీషాయేలు మరియు ఎల్జాపాను",
      "ఫీనెహాసు మరియు ఎలియాజరు",
      "కోరహు మరియు నెఫెగు",
      "గెర్షోను మరియు మెరారి"
    ],
    "correctAnswer": "Mishael and Elzaphan, sons of Uzziel",
    "bibleReference": "Leviticus 10:4",
    "explanation": "Moses called Mishael and Elzaphan, sons of Uzziel the uncle of Aaron, to carry their relatives out of the camp.",
    "explanationTelugu": "మోషే అహరోను పినతండ్రియైన ఉజ్జీయేలు కుమారులగు మీషాయేలును ఎల్జాపానును పిలిచి వారిని శిబిరము బయటికి మోయించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "According to Numbers 3:15, from what age were the male Levites numbered according to their fathers' households?",
    "questionTelugu": "సంఖ్యాకాండము 3:15 ప్రకారం లేవీయుల పురుషులు తమ పితరుల కుటుంబాల చొప్పున ఏ వయస్సునుండి లెక్కించబడవలెను?",
    "options": [
      "From a month old and upward",
      "From twenty years old and upward",
      "From thirty years old and upward",
      "From birth"
    ],
    "optionsTelugu": [
      "ఒక నెల మొదలుకొని పైబడిన ప్రతి పురుషుడు",
      "ఇరువది ఏండ్లు మొదలుకొని పైబడినవారు",
      "ముప్పది ఏండ్లు మొదలుకొని",
      "పుట్టిన వెంటనే"
    ],
    "correctAnswer": "From a month old and upward",
    "bibleReference": "Numbers 3:15",
    "explanation": "Number the children of Levi after the house of their fathers: every male from a month old and upward.",
    "explanationTelugu": "లేవీయులను వారి పితరుల కుటుంబముల చొప్పున లెక్కింపుము; నెల మొదలుకొని పైబడిన ప్రతి మగవానిని లెక్కింపవలెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "According to Deuteronomy 21:15-17, what portion of inheritance must a father give his firstborn son, even if born to an unloved wife?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 21:15-17 ప్రకారం ద్వేషింపబడిన భార్య కన్న జ్యేష్ఠ కుమారునికి తండ్రి ఇవ్వవలసిన స్వాస్థ్య భాగము ఎంత?",
    "options": [
      "A double portion of all that he has",
      "An equal single share with other brothers",
      "A half share",
      "No inheritance"
    ],
    "optionsTelugu": [
      "తన సమస్తములో రెండంతల భాగము",
      "మిగిలిన కుమారులతో సమాన భాగము",
      "సగము భాగము",
      "ఎట్టి స్వాస్థ్యము లేదు"
    ],
    "correctAnswer": "A double portion of all that he has",
    "bibleReference": "Deuteronomy 21:17",
    "explanation": "He shall acknowledge the firstborn by giving him a double portion of all that he has.",
    "explanationTelugu": "ద్వేషింపబడినదాని కుమారుని జ్యేష్ఠునిగా అంగీకరించి తనకు కలిగిన సమస్తములో రెండంతల పాలు అతనికియ్యవలెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Deuteronomy 24:5, for how long was a newly married man exempt from military service to bring happiness to his bride?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 24:5 ప్రకారం కొత్తగా పెండ్లి చేసికొనిన పురుషుడు తన భార్యను సంతోషపెట్టుటకు ఎన్ని సంవత్సరాలు సైనిక సేవనుండి మినహాయింపు పొందెను?",
    "options": [
      "One full year",
      "Six months",
      "Three months",
      "Seven years"
    ],
    "optionsTelugu": [
      "ఒక సంవత్సరము పూర్తిగా",
      "ఆరు నెలలు",
      "మూడు నెలలు",
      "ఏడు సంవత్సరాలు"
    ],
    "correctAnswer": "One full year",
    "bibleReference": "Deuteronomy 24:5",
    "explanation": "When a man has taken a new wife, he shall not go out to war for one year, but stay free at home to cheer his wife.",
    "explanationTelugu": "ఒకడు క్రొత్తగా పెండ్లి చేసికొనినయెడల అతడు యుద్ధమునకు పోకూడదు; ఒక సంవత్సరము అతడు తన యింట స్వేచ్ఛగా ఉండి పెండ్లాడిన భార్యను సంతోషపెట్టవలెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "Under Numbers 30:3-5, who had the legal authority to confirm or nullify an unmarried young woman's vow?",
    "questionTelugu": "సంఖ్యాకాండము 30:3-5 ప్రకారం వివాహము కాని కన్యక యొక్క మొక్కుబడిని స్థిరపరచుటకు లేక రద్దుచేయుటకు ఎవరికి అధికారముండెను?",
    "options": [
      "Her father, on the day he heard it",
      "The high priest at the sanctuary",
      "The town elders at the gate",
      "Her eldest brother"
    ],
    "optionsTelugu": [
      "ఆమె తండ్రి, అతడు విన్న దినమందే",
      "పరిశుద్ధ స్థలమందలి ప్రధాన యాజకుడు",
      "పట్టణ ద్వారము వద్ద పెద్దలు",
      "ఆమె జ్యేష్ఠ సహోదరుడు"
    ],
    "correctAnswer": "Her father, on the day he heard it",
    "bibleReference": "Numbers 30:5",
    "explanation": "If her father overrules her on the day he hears it, none of her vows or pledges shall stand.",
    "explanationTelugu": "ఆమె తండ్రి విన్న దినమందు ఆమెను ఆక్షేపించినయెడల ఆమె మొక్కుబళ్లలో ఏదియు నిలువదు; ఆమె తండ్రి ఆమెను ఆక్షేపించెను గనుక యెహోవా ఆమెను క్షమించును.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Leviticus 19:3, which family parent is mentioned first in the command: 'Every one of you shall revere his mother and his father'?",
    "questionTelugu": "లేవీయకాండము 19:3 లో \"మీలో ప్రతివాడును తన తల్లికిని తన తండ్రికిని భయపడవలెను\" అను ఆజ్ఞలో మొదట ఎవరిని పేర్కొనెను?",
    "options": [
      "Mother",
      "Father",
      "Grandfather",
      "Elder brother"
    ],
    "optionsTelugu": [
      "తల్లి",
      "తండ్రి",
      "తాత",
      "పెద్దన్న"
    ],
    "correctAnswer": "Mother",
    "bibleReference": "Leviticus 19:3",
    "explanation": "Leviticus 19:3 intentionally lists mother before father: 'Every one of you shall revere his mother and his father.'",
    "explanationTelugu": "లేవీయకాండము 19:3 లో తండ్రికంటే ముందుగా తల్లిని పేర్కొని: మీలో ప్రతివాడును తన తల్లికిని తన తండ్రికిని భయపడవలెను అని ఆజ్ఞాపించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "According to Deuteronomy 27:16, what solemn pronouncement was echoed by all the people on Mount Ebal?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 27:16 లో ఏబాలు పర్వతముపై ప్రజలందరు ఆమెన్ అని పలకవలసిన శాపవాక్యము ఏది?",
    "options": [
      "\"Cursed is anyone who dishonors their father or mother\"",
      "\"Cursed is anyone who moves boundary stones\"",
      "\"Cursed is anyone who withholds bread\"",
      "\"Cursed is the city of idols\""
    ],
    "optionsTelugu": [
      "\"తన తండ్రినైనను తల్లినైనను నిందించువాడు శాపగ్రస్తుడు\"",
      "\"పొలిమేర రాయిని జరుపువాడు శాపగ్రస్తుడు\"",
      "\"రొట్టెను దాచువాడు శాపగ్రస్తుడు\"",
      "\"విగ్రహ పట్టణము శాపగ్రస్తము\""
    ],
    "correctAnswer": "\"Cursed is anyone who dishonors their father or mother\"",
    "bibleReference": "Deuteronomy 27:16",
    "explanation": "Cursed be he that sets light by his father or his mother, and all the people shall say, Amen.",
    "explanationTelugu": "తన తండ్రినైనను తల్లినైనను తేలికగా చూచువాడు శాపగ్రస్తుడు; ప్రజలందరు ఆమెన్ అనవలెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Joshua 24:2, which ancestral fathers of Israel are named as having served other gods beyond the Euphrates River?",
    "questionTelugu": "యెహోషువ 24:2 లో యూఫ్రటీసు నదికి అద్దరిన నివసించి ఇతర దేవతలను పూజించిన పూర్వ పితరులు ఎవరు?",
    "options": [
      "Terah the father of Abraham and father of Nahor",
      "Noah and Shem",
      "Isaac and Jacob",
      "Amram and Kohath"
    ],
    "optionsTelugu": [
      "అబ్రాహామునకును నాహోరునకును తండ్రియైన తేరహు",
      "నోవహు మరియు షేము",
      "ఇస్సాకు మరియు యాకోబు",
      "అమ్రాము మరియు కహాతు"
    ],
    "correctAnswer": "Terah the father of Abraham and father of Nahor",
    "bibleReference": "Joshua 24:2",
    "explanation": "Joshua said: 'Long ago your fathers, Terah the father of Abraham and Nahor, lived beyond the Euphrates and served other gods.'",
    "explanationTelugu": "యెహోషువ: పూర్వకాలమున అబ్రాహామునకును నాహోరునకును తండ్రియైన తేరహు అను మీ పితరులు యూఫ్రటీసు నదికి అద్దరిని నివసించి ఇతర దేవతలను పూజించిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Judges 1:16, which Kenite relative of Moses had descendants who settled with the people of Judah in the wilderness of Arad?",
    "questionTelugu": "న్యాయాధిపతులు 1:16 ప్రకారం అరాదు దక్షిణారణ్యములో యూదా సంతతివారితో కలిసి స్థిరపడిన మోషే మామ ఏ తెగకు చెందినవాడు?",
    "options": [
      "Moses' father-in-law, the Kenite",
      "Moses' Egyptian foster-brother",
      "Moses' Midianite nephew",
      "Moses' Amalekite ally"
    ],
    "optionsTelugu": [
      "మోషే మామయైన కేనీయుడు",
      "మోషే ఐగుప్తు పెంపుడు సహోదరుడు",
      "మోషే మిద్యాను మేనల్లుడు",
      "మోషే అమాలేకీయుల స్నేహితుడు"
    ],
    "correctAnswer": "Moses' father-in-law, the Kenite",
    "bibleReference": "Judges 1:16",
    "explanation": "The descendants of Moses' father-in-law, the Kenite, went up with the people of Judah into the wilderness of Judah south of Arad.",
    "explanationTelugu": "మోషే మామయైన కేనీయుని సంతతివారు యూదా సంతతివారితో కూడ అరాదు దక్షిణపు అరణ్యమునకు పోయి ప్రజలలో కాపురముండిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Judges 4:11, who was Jael's husband, who had separated himself from the Kenites of Hobab, Moses' brother-in-law?",
    "questionTelugu": "న్యాయాధిపతులు 4:11 లో మోషే బావయైన హోబాబు సంతతికి చెందిన కేనీయుల నుండి వేరుపడి గుడారము వేసికొనిన యాయేలు భర్త ఎవరు?",
    "options": [
      "Heber the Kenite",
      "Othniel",
      "Sisera",
      "Barak"
    ],
    "optionsTelugu": [
      "కేనీయుడైన హెబెరు",
      "ఒత్నీయేలు",
      "సీసెర",
      "బారాకు"
    ],
    "correctAnswer": "Heber the Kenite",
    "bibleReference": "Judges 4:11",
    "explanation": "Heber the Kenite had separated from the Kenites, the descendants of Hobab Moses' brother-in-law.",
    "explanationTelugu": "కేనీయుడైన హెబెరు మోషే బావయైన హోబాబు సంతతివారైన కేనీయులను విడిచి గుడారము వేసికొనియుండెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "How many sons did Gideon have by his many wives, according to Judges 8:30?",
    "questionTelugu": "న్యాయాధిపతులు 8:30 ప్రకారం అనేకమంది భార్యలవలన గిద్యోనునకు పుట్టిన కుమారుల సంఖ్య ఎంత?",
    "options": [
      "Seventy sons",
      "Thirty sons",
      "Twelve sons",
      "Forty sons"
    ],
    "optionsTelugu": [
      "డెబ్బదిమంది కుమారులు",
      "ముప్పదిమంది",
      "పండ్రెండుగురు",
      "నలువదిమంది"
    ],
    "correctAnswer": "Seventy sons",
    "bibleReference": "Judges 8:30",
    "explanation": "Gideon had seventy sons of his own body begotten, for he had many wives.",
    "explanationTelugu": "గిద్యోనునకు అనేకమంది భార్యలున్నందున అతని ఔరసపుత్రులు డెబ్బదిమంది.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Judges 12:8-9, which judge of Bethlehem arranged marriages outside his clan for his thirty sons and thirty daughters?",
    "questionTelugu": "న్యాయాధిపతులు 12:8-9 లో తన ముప్పదిమంది కుమారులకు ముప్పదిమంది కుమార్తెలకు బయటి వంశములలో సంబంధములు చేసిన బేత్లెహేము న్యాయాధిపతి ఎవరు?",
    "options": [
      "Ibzan of Bethlehem",
      "Elon the Zebulunite",
      "Abdon son of Hillel",
      "Tola son of Puah"
    ],
    "optionsTelugu": [
      "బేత్లెహేము వాసియైన ఇబ్సాను",
      "జెబూలూనీయుడైన ఏలోను",
      "హిల్లేలు కుమారుడైన అబ్దోను",
      "పూవా కుమారుడైన తోలా"
    ],
    "correctAnswer": "Ibzan of Bethlehem",
    "bibleReference": "Judges 12:8-9",
    "explanation": "Ibzan had thirty sons and thirty daughters whom he gave in marriage outside his clan, bringing in thirty wives for his sons.",
    "explanationTelugu": "ఇబ్సానునకు ముప్పదిమంది కుమారులును ముప్పదిమంది కుమార్తెలును ఉండిరి; అతడు తన కుమార్తెలను బయటివారికిచ్చి, బయటినుండి ముప్పదిమంది కన్యకలను కోడండ్రుగా తెచ్చెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "In 1 Samuel 1:1, what was the ancestral genealogy of Samuel's father Elkanah?",
    "questionTelugu": "1 సమూయేలు 1:1 లో సమూయేలు తండ్రియైన ఎల్కానా యొక్క పితృ వంశావళి పూర్వీకులు ఎవరు?",
    "options": [
      "Son of Jeroham, son of Elihu, son of Tohu, son of Zuph",
      "Son of Kish, son of Abiel",
      "Son of Jesse, son of Obed",
      "Son of Hilkiah, son of Shallum"
    ],
    "optionsTelugu": [
      "సూపు కుమారుడైన తోహునకు పుట్టిన ఎలీహు కుమారుడగు యెరోహాము కుమారుడైన ఎల్కానా",
      "అబీయేలు కుమారుడైన కీషు కుమారుడు",
      "ఓబేదు కుమారుడైన యెష్షయి కుమారుడు",
      "షల్లూము కుమారుడైన హిల్కీయా కుమారుడు"
    ],
    "correctAnswer": "Son of Jeroham, son of Elihu, son of Tohu, son of Zuph",
    "bibleReference": "1 Samuel 1:1",
    "explanation": "Elkanah was the son of Jeroham, son of Elihu, son of Tohu, son of Zuph, an Ephraimite.",
    "explanationTelugu": "ఎల్కానా సూపు కుమారుడైన తోహునకు పుట్టిన ఎలీహు కుమారుడగు యెరోహాము కుమారుడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "In 1 Samuel 9:1, who was the grandfather of Saul, king of Israel?",
    "questionTelugu": "1 సమూయేలు 9:1 లో ఇశ్రాయేలు రాజైన సౌలు యొక్క తాత ఎవరు?",
    "options": [
      "Abiel son of Zeror",
      "Kish",
      "Ner",
      "Becorath"
    ],
    "optionsTelugu": [
      "జెరోరు కుమారుడైన అబీయేలు",
      "కీషు",
      "నేరు",
      "బెకోరతు"
    ],
    "correctAnswer": "Abiel son of Zeror",
    "bibleReference": "1 Samuel 9:1",
    "explanation": "Kish was the son of Abiel, son of Zeror, son of Becorath, son of Aphiah, making Abiel Saul's grandfather.",
    "explanationTelugu": "కీషు అఫీయహు కుమారుడైన బెకోరతునకు పుట్టిన జెరోరు కుమారుడగు అబీయేలు కుమారుడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "What was the name of Saul's wife and queen, identified in 1 Samuel 14:50?",
    "questionTelugu": "1 సమూయేలు 14:50 లో పేర్కొనబడిన సౌలు భార్యయు రాణియునైన స్త్రీ పేరు ఏమిటి?",
    "options": [
      "Ahinoam daughter of Ahimaaz",
      "Rizpah daughter of Aiah",
      "Merab",
      "Michal"
    ],
    "optionsTelugu": [
      "అహీమయస్సు కుమార్తెయైన అహీనోయము",
      "అయ్యా కుమార్తెయైన రిస్పా",
      "మేరబు",
      "మీకాలు"
    ],
    "correctAnswer": "Ahinoam daughter of Ahimaaz",
    "bibleReference": "1 Samuel 14:50",
    "explanation": "The name of Saul's wife was Ahinoam the daughter of Ahimaaz.",
    "explanationTelugu": "సౌలు భార్య పేరు అహీనోయము, ఆమె అహీమయస్సు కుమార్తె.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "What was the familial relationship between King Saul and his army commander Abner in 1 Samuel 14:50?",
    "questionTelugu": "1 సమూయేలు 14:50 ప్రకారం సౌలు రాజుకు మరియు అతని సైన్యాధిపతి అబ్నేరుకు మధ్యగల రక్తసంబంధము ఏమిటి?",
    "options": [
      "Abner was the son of Ner, Saul's uncle (first cousin)",
      "Abner was Saul's brother-in-law",
      "Abner was Saul's nephew",
      "Abner was Saul's son-in-law"
    ],
    "optionsTelugu": [
      "అబ్నేరు సౌలు పినతండ్రియైన నేరు కుమారుడు (సొంత బావమరది/దాయాది)",
      "సౌలు బావమరిది",
      "సౌలు మేనల్లుడు",
      "సౌలు అల్లుడు"
    ],
    "correctAnswer": "Abner was the son of Ner, Saul's uncle (first cousin)",
    "bibleReference": "1 Samuel 14:50",
    "explanation": "The name of the commander of his army was Abner son of Ner, Saul's uncle.",
    "explanationTelugu": "అతని సైన్యాధిపతి పేరు అబ్నేరు; ఇతడు సౌలు పినతండ్రియైన నేరు కుమారుడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "In 1 Samuel 20:30, what fierce verbal insult did angry Saul shout at Jonathan for his loyalty to David?",
    "questionTelugu": "1 సమూయేలు 20:30 లో దావీదు పట్ల చూపిన విశ్వాసమును బట్టి కోపోద్రిక్తుడైన సౌలు యోనాతానును ఏమని నిందించెను?",
    "options": [
      "\"You son of a perverse and rebellious woman!\"",
      "\"You coward of the tribe of Benjamin!\"",
      "\"You traitor to your ancestral throne!\"",
      "\"You despised son of sheep-keepers!\""
    ],
    "optionsTelugu": [
      "\"వక్రబుద్ధిగల తిరుగుబాటుదాని కుమారుడా!\"",
      "\"బెన్యామీను పిరికివాడా!\"",
      "\"సింహాసన ద్రోహివి!\"",
      "\"గొఱ్ఱెల కాపరుల కుమారుడా!\""
    ],
    "correctAnswer": "\"You son of a perverse and rebellious woman!\"",
    "bibleReference": "1 Samuel 20:30",
    "explanation": "Saul's anger burned against Jonathan and he said to him, 'You son of a perverse, rebellious woman!'",
    "explanationTelugu": "సౌలు కోపము యోనాతాను మీద రగులుకొని: వక్రబుద్ధిగల తిరుగుబాటుదాని కుమారుడా, నీకు సిగ్గు కలుగునట్లు యెష్షయి కుమారుని కోరుకొంటివని నాకు తెలియదా అని అరచెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "In 2 Samuel 3:2-5, how many sons were born to David during his seven-and-a-half-year reign in Hebron?",
    "questionTelugu": "2 సమూయేలు 3:2-5 లో హెబ్రోనులో ఏడున్నర సంవత్సరములు పాలించిన కాలములో దావీదునకు ఎంతమంది కుమారులు పుట్టిరి?",
    "options": [
      "Six sons (by six different wives)",
      "Twelve sons",
      "Three sons",
      "Ten sons"
    ],
    "optionsTelugu": [
      "ఆరుగురు కుమారులు (ఆరుగురు వేర్వేరు భార్యల వలన)",
      "పండ్రెండుగురు",
      "ముగ్గురు",
      "పదిమంది"
    ],
    "correctAnswer": "Six sons (by six different wives)",
    "bibleReference": "2 Samuel 3:2-5",
    "explanation": "Six sons were born to David in Hebron: Amnon, Kileab (Daniel), Absalom, Adonijah, Shephatiah, and Ithream.",
    "explanationTelugu": "హెబ్రోనులో దావీదునకు అమ్నోను, కిల్యాబు, అబ్షాలోము, అదోనీయా, షెఫట్య, ఇత్రెయాము అను ఆరుగురు కుమారులు పుట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "What physical judgment befell Saul's daughter Michal after she despised David dancing before the Ark in 2 Samuel 6:23?",
    "questionTelugu": "2 సమూయేలు 6:23 లో మందసము ఎదుట నాట్యమాడిన దావీదును చూచి హృదయములో తృణీకరించిన మీకాలునకు ఏ తీర్పు సంభవించెను?",
    "options": [
      "Michal daughter of Saul had no children to the day of her death",
      "She was struck with leprosy",
      "She went into exile in Moab",
      "She became blind in her old age"
    ],
    "optionsTelugu": [
      "సౌలు కుమార్తెయైన మీకాలు తాను మరణించు దినమువరకు పిల్లలు లేనిదాయెను",
      "కుష్ఠురోగియాయెను",
      "మోయాబు దేశమునకు చెరగా పోయెను",
      "వృద్ధాప్యమందు గ్రుడ్డిదాయెను"
    ],
    "correctAnswer": "Michal daughter of Saul had no children to the day of her death",
    "bibleReference": "2 Samuel 6:23",
    "explanation": "Therefore Michal the daughter of Saul had no child unto the day of her death.",
    "explanationTelugu": "కావున సౌలు కుమార్తెయైన మీకాలు తాను మరణించు దినమువరకు పిల్లలు కనినది కాదు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "What second name did Nathan the prophet give to baby Solomon by the word of the Lord in 2 Samuel 12:25?",
    "questionTelugu": "2 సమూయేలు 12:25 లో యెహోవా సెలవిచ్చిన మాట ప్రకారము నాతాను ప్రవక్త సాల్మోనునకు పెట్టిన మరియొక పేరు ఏమిటి?",
    "options": [
      "Jedidiah (Beloved of the Lord)",
      "Immanuel",
      "Shelomoh",
      "Zerubbabel"
    ],
    "optionsTelugu": [
      "యెదీద్యా (యెహోవాకు ప్రియుడు)",
      "ఇమ్మానుయేలు",
      "షెలోమో",
      "జెరుబ్బాబెలు"
    ],
    "correctAnswer": "Jedidiah (Beloved of the Lord)",
    "bibleReference": "2 Samuel 12:25",
    "explanation": "Because the Lord loved him, he sent word through Nathan the prophet to name him Jedidiah.",
    "explanationTelugu": "యెహోవా అతని ప్రేమించెను గనుక నాతాను ప్రవక్త ద్వారా వర్తమానము పంపి అతనికి యెదీద్యా అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "In 2 Samuel 21:8, who was Saul's concubine who vigilantly protected the bodies of her two executed sons from scavengers?",
    "questionTelugu": "2 సమూయేలు 21:8-10 లో మరణశిక్ష పొందిన తన ఇద్దరు కుమారుల కళేబరాలను పక్షులు క్రూరమృగాలు తినకుండ రాత్రింబగళ్లు కాపాడిన సౌలు ఉపపత్ని ఎవరు?",
    "options": [
      "Rizpah daughter of Aiah",
      "Ahinoam",
      "Abital",
      "Haggith"
    ],
    "optionsTelugu": [
      "అయ్యా కుమార్తెయైన రిస్పా",
      "అహీనోయము",
      "అబీతలు",
      "హగ్గీతు"
    ],
    "correctAnswer": "Rizpah daughter of Aiah",
    "bibleReference": "2 Samuel 21:8-10",
    "explanation": "Rizpah the daughter of Aiah took sackcloth and spread it upon the rock, protecting her dead sons Armoni and Mephibosheth.",
    "explanationTelugu": "అయ్యా కుమార్తెయైన రిస్పా గోనెపట్ట తెచ్చుకొని పగలు ఆకాశపక్షులైనను రాత్రి పొలముజంతువులైనను వాటిమీద వాలనియ్యక కాపాడెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "According to 1 Kings 11:3, how many wives of royal birth and concubines did Solomon possess?",
    "questionTelugu": "1 రాజులు 11:3 ప్రకారం సొలొమోనుకు రాజవంశపు భార్యలు మరియు ఉపపత్నులు ఎంతమంది ఉండిరి?",
    "options": [
      "700 wives, princesses, and 300 concubines",
      "300 wives and 700 concubines",
      "100 wives and 200 concubines",
      "40 wives and 60 concubines"
    ],
    "optionsTelugu": [
      "ఏడువందలమంది రాణులు మరియు మూడువందలమంది ఉపపత్నులు",
      "మూడువందలమంది భార్యలు, ఏడువందలమంది ఉపపత్నులు",
      "నూరుగురు భార్యలు, రెండువందలమంది ఉపపత్నులు",
      "నలువదిమంది భార్యలు, అరవైమంది ఉపపత్నులు"
    ],
    "correctAnswer": "700 wives, princesses, and 300 concubines",
    "bibleReference": "1 Kings 11:3",
    "explanation": "He had seven hundred wives of royal birth and three hundred concubines, and his wives led him astray.",
    "explanationTelugu": "అతనికి రాజకుమార్తెలైన ఏడువందలమంది భార్యలును మూడువందలమంది ఉపపత్నులును ఉండిరి; అతని భార్యలు అతని హృదయమును తిప్పివేసిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "In 1 Kings 16:31, who was the royal father of wicked Queen Jezebel, king of the Sidonians?",
    "questionTelugu": "1 రాజులు 16:31 లో దుష్టురాలైన యెజెబెలు యొక్క తండ్రి మరియు సీదోనీయుల రాజైన వ్యక్తి ఎవరు?",
    "options": [
      "Ethbaal",
      "Hiram",
      "Ben-hadad",
      "Hadadezer"
    ],
    "optionsTelugu": [
      "ఎత్బయలు",
      "హీరాము",
      "బెన్హదదు",
      "హదదేజెరు"
    ],
    "correctAnswer": "Ethbaal",
    "bibleReference": "1 Kings 16:31",
    "explanation": "Ahab took as wife Jezebel the daughter of Ethbaal king of the Sidonians.",
    "explanationTelugu": "అహాబు సీదోనీయుల రాజైన ఎత్బయలు కుమార్తెయైన యెజెబెలును పెండ్లిచేసికొనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "In 2 Kings 4:1, what desperate threat faced the widow of the sons of the prophets regarding her two children?",
    "questionTelugu": "2 రాజులు 4:1 లో ప్రవక్తల శిష్యులలో ఒకని భార్యయైన విధవరాలి ఇద్దరు కుమారులకు ఎలాంటి అపాయము ఎదురాయెను?",
    "options": [
      "The creditor was coming to take her two boys as slaves",
      "They were sentenced to death by King Joram",
      "They were to be expelled into the desert",
      "They were summoned to forced temple labor"
    ],
    "optionsTelugu": [
      "రుణమిచ్చినవాడు వచ్చి ఆమె ఇద్దరు కుమారులను దాసులుగా పట్టుకొనిపోవుటకు వచ్చెను",
      "రాజదండన విధించబడెను",
      "అరణ్యమునకు వెళ్లగొట్టబడిరి",
      "వెట్టిచాకిరీకి పిలువబడిరి"
    ],
    "correctAnswer": "The creditor was coming to take her two boys as slaves",
    "bibleReference": "2 Kings 4:1",
    "explanation": "The creditor is coming to take my two boys as his slaves, cried the widow to Elisha.",
    "explanationTelugu": "ఋణమిచ్చినవాడు నా ఇద్దరు కుమారులను తనకు దాసులుగా చేసికొనుటకు వచ్చియున్నాడని ఎలీషా ఎదుట మొఱ్ఱపెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "In 2 Chronicles 24:15, at what exceptionally venerable age did high priest Jehoiada die after counseling King Joash?",
    "questionTelugu": "2 దినవృత్తాంతములు 24:15 ప్రకారం యెహోయాదా యాజకుడు దేవునియెడలను దేవాలయముయెడలను మేలు చేసి ఏ వయస్సున మృతిబొందెను?",
    "options": [
      "130 years old",
      "110 years old",
      "120 years old",
      "95 years old"
    ],
    "optionsTelugu": [
      "130 సంవత్సరాలు",
      "110 సంవత్సరాలు",
      "120 సంవత్సరాలు",
      "95 సంవత్సరాలు"
    ],
    "correctAnswer": "130 years old",
    "bibleReference": "2 Chronicles 24:15",
    "explanation": "Jehoiada grew old and full of days, and he died; he was a hundred and thirty years old when he died.",
    "explanationTelugu": "యెహోయాదా వృద్ధుడై కాలము నిండినవాడై మృతిబొందెను; అతడు చనిపోయినప్పుడు నూట ముప్పది యేండ్లవాడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Isaiah 8:3, what prophetic name was given to Isaiah's son, signifying swift destruction upon Israel's enemies?",
    "questionTelugu": "యెషయా 8:3 లో శత్రువుల త్వరితగతిన జరుగు నాశనమునకు సూచనగా యెషయా కుమారునికి దేవుడు పెట్టిన పేరేమిటి?",
    "options": [
      "Maher-Shalal-Hash-Baz",
      "Shear-Jashub",
      "Immanuel",
      "Mahershalal"
    ],
    "optionsTelugu": [
      "మహేరు షాలాలు హాషు బజు",
      "షెయార్యాషూబు",
      "ఇమ్మానుయేలు",
      "నాతాను"
    ],
    "correctAnswer": "Maher-Shalal-Hash-Baz",
    "bibleReference": "Isaiah 8:3",
    "explanation": "The Lord said to Isaiah, 'Call his name Maher-Shalal-Hash-Baz (quick to the plunder, swift to the spoil).'",
    "explanationTelugu": "యెహోవా నాకు సెలవిచ్చినదేమనగా: అతనికి మహేరు షాలాలు హాషు బజు అని పేరు పెట్టుము.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Jeremiah 35:2-6, which family clan refused to drink wine in obedience to their forefather Jonadab son of Rechab?",
    "questionTelugu": "యిర్మీయా 35:2-6 లో తమ పితరుడైన రేకాబు కుమారుడగు యోనాదాబు ఆజ్ఞను పాటించి ద్రాక్షారసము త్రాగని కుటుంబ వంశము ఏది?",
    "options": [
      "The Rechabites",
      "The Kenites",
      "The Korahites",
      "The Gibeonites"
    ],
    "optionsTelugu": [
      "రేకాబీయులు",
      "కేనీయులు",
      "కోరహీయులు",
      "గిబియోనీయులు"
    ],
    "correctAnswer": "The Rechabites",
    "bibleReference": "Jeremiah 35:6",
    "explanation": "They answered: 'We will drink no wine, for Jonadab the son of Rechab, our father, commanded us.'",
    "explanationTelugu": "వారు: మేము ద్రాక్షారసము త్రాగము; మా పితరుడైన రేకాబు కుమారుడగు యోనాదాబు మాకు ఆజ్ఞాపించెను అనిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "How many specific women from the Old Testament are named in Matthew 1:3-6 in the genealogy of Jesus?",
    "questionTelugu": "మత్తయి 1:3-6 లో యేసుక్రీస్తు వంశావళిలో ప్రత్యేకముగా పేర్లు పేర్కొనబడిన నలుగురు పాతనిబంధన స్త్రీలు ఎవరు?",
    "options": [
      "Tamar, Rahab, Ruth, and Uriah's wife (Bathsheba)",
      "Sarah, Rebekah, Leah, and Rachel",
      "Miriam, Deborah, Huldah, and Esther",
      "Elizabeth, Mary, Anna, and Salome"
    ],
    "optionsTelugu": [
      "తామారు, రాహాబు, రూతు, మరియు ఊరియా భార్య (బత్షెబ)",
      "శారా, రిబ్కా, లేయా, రాహేలు",
      "మిర్యాము, దెబోరా, హుల్దా, ఎస్తేరు",
      "ఎలీసబెతు, మరియ, అన్నా, సలోమే"
    ],
    "correctAnswer": "Tamar, Rahab, Ruth, and Uriah's wife (Bathsheba)",
    "bibleReference": "Matthew 1:3-6",
    "explanation": "Matthew's genealogy includes Tamar, Rahab, Ruth, and Uriah's wife Bathsheba before Mary.",
    "explanationTelugu": "మత్తయి వంశావళిలో మరియ కాకుండా నలుగురు స్త్రీలు: తామారు, రాహాబు, రూతు, మరియు ఊరియా భార్య పేర్కొనబడిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Mark 1:19-20, whom did James and John leave in the fishing boat with the hired hands to follow Jesus?",
    "questionTelugu": "మార్కు 1:19-20 లో యాకోబు యోహానులు యేసును వెంబడించుటకు పడవలో కూలివారితో పాటు విడిచిపెట్టిన తమ తండ్రి ఎవరు?",
    "options": [
      "Their father Zebedee",
      "Their father Alphaeus",
      "Their grandfather Jonah",
      "Their father Cleopas"
    ],
    "optionsTelugu": [
      "తమ తండ్రియైన జెబెదయి",
      "తమ తండ్రియైన అల్ఫయి",
      "తమ తాతయైన యోనా",
      "తమ తండ్రియైన క్లెయోపా"
    ],
    "correctAnswer": "Their father Zebedee",
    "bibleReference": "Mark 1:20",
    "explanation": "Immediately Jesus called them, and they left their father Zebedee in the boat with the hired servants and went after Him.",
    "explanationTelugu": "వెంటనే ఆయన వారిని పిలిచెను; వారు తమ తండ్రియైన జెబెదయిని పడవలో కూలివారితో విడిచి ఆయనను వెంబడించిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "According to Luke 3:38, to whom does Luke's genealogical record of Jesus trace all human origins back?",
    "questionTelugu": "లూకా 3:38 ప్రకారం, లూకా సువార్తలోని యేసు వంశావళి మానవ మూలమును ఎక్కడివరకు తీసుకొనిపోవును?",
    "options": [
      "Adam, the son of God",
      "Abraham, the father of faith",
      "David, the anointed king",
      "Noah, the righteous preacher"
    ],
    "optionsTelugu": [
      "దేవుని కుమారుడైన ఆదాము వరకు",
      "విశ్వాసుల తండ్రియైన అబ్రాహాము వరకు",
      "అభిషిక్తుడైన దావీదు రాజు వరకు",
      "నీతిమంతుడైన నోవహు వరకు"
    ],
    "correctAnswer": "Adam, the son of God",
    "bibleReference": "Luke 3:38",
    "explanation": "Luke traces the lineage back through Seth, Enosh, to 'Adam, the son of God.'",
    "explanationTelugu": "లూకా వంశావళి ఆదామువరకు చేర్చి: ఆదాము దేవుని కుమారుడు అని ముగించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "In John 19:25, which family aunt of Jesus is listed standing by the cross alongside Mary His mother?",
    "questionTelugu": "యోహాను 19:25 లో సిలువ యొద్ద యేసు తల్లియైన మరియ ప్రక్కన నిలిచిన ఆమె సహోదరి ఎవరు?",
    "options": [
      "Mary the wife of Clopas (His mother's sister)",
      "Salome the daughter of Herod",
      "Joanna wife of Chuza",
      "Martha of Bethany"
    ],
    "optionsTelugu": [
      "క్లోపా భార్యయైన మరియ (ఆయన తల్లి సహోదరి)",
      "హేరోదు కుమార్తెయైన సలోమే",
      "కూజా భార్యయైన యోహన్నా",
      "బేతని మార్త"
    ],
    "correctAnswer": "Mary the wife of Clopas (His mother's sister)",
    "bibleReference": "John 19:25",
    "explanation": "Standing near the cross of Jesus were His mother, and His mother's sister, Mary the wife of Clopas, and Mary Magdalene.",
    "explanationTelugu": "యేసు సిలువ యొద్ద ఆయన తల్లియు, ఆయన తల్లి సహోదరియు, క్లోపా భార్యయైన మరియయు, మగ్దలేనే మరియయు నిలువబడియుండిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s2_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "In 2 John 1:13, how does the apostle John conclude his epistle to the household of faith?",
    "questionTelugu": "2 యోహాను 1:13 లో విశ్వాస గృహమునకు వ్రాసిన పత్రికను అపొస్తలుడైన యోహాను ఏ కుటుంబపు వందనములతో ముగించెను?",
    "options": [
      "\"The children of your elect sister greet you. Amen.\"",
      "\"Grace to all the kings of the earth\"",
      "\"All the saints of Rome salute you\"",
      "\"Greet the synagogue of Ephesus\""
    ],
    "optionsTelugu": [
      "\"ఏర్పరచబడిన నీ సహోదరియొక్క పిల్లలు నీకు వందనములు చెప్పుచున్నారు. ఆమెన్.\"",
      "\"భూరాజులందరికి కృప కలుగును గాక\"",
      "\"రోమా పరిశుద్ధులందరు వందనములు చెప్పుచున్నారు\"",
      "\"ఎఫెసు సమాజమందిరమునకు వందనములు\""
    ],
    "correctAnswer": "\"The children of your elect sister greet you. Amen.\"",
    "bibleReference": "2 John 1:13",
    "explanation": "John concludes: 'The children of your elect sister greet you. Amen.'",
    "explanationTelugu": "ఏర్పరచబడిన నీ సహోదరియొక్క పిల్లలు నీకు వందనములు చెప్పుచున్నారు. ఆమెన్.",
    "marks": 1
  }
];

export const FAMILY_HARD_MASTERY: QuizQuestion[] = [
  {
    "id": "fam_h_s3_q01",
    "order": 1,
    "questionType": "single_choice",
    "question": "According to Genesis 5:32, at what age was Noah when he fathered Shem, Ham, and Japheth?",
    "questionTelugu": "ఆదికాండము 5:32 ప్రకారం, నోవహు షేము హాము యాపెతు అను కుమారులను కనినప్పుడు అతని వయస్సు ఎంత?",
    "options": [
      "500 years old",
      "600 years old",
      "450 years old",
      "350 years old"
    ],
    "optionsTelugu": [
      "ఐదువందల సంవత్సరాలు (500)",
      "ఆరువందల సంవత్సరాలు",
      "నాలుగువందల యాభై",
      "మూడువందల యాభై"
    ],
    "correctAnswer": "500 years old",
    "bibleReference": "Genesis 5:32",
    "explanation": "After Noah was 500 years old, he became the father of Shem, Ham, and Japheth.",
    "explanationTelugu": "నోవహు ఐదువందల యేండ్లు గలవాడై షేమును హామును యాపెతును కనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q02",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Genesis 9:25, which specific son of Ham did Noah curse following Ham's dishonorable conduct?",
    "questionTelugu": "ఆదికాండము 9:25 లో హాము ప్రవర్తనను బట్టి నోవహు శపించిన హాము యొక్క నిర్దిష్ట కుమారుడు ఎవరు?",
    "options": [
      "Canaan",
      "Cush",
      "Mizraim",
      "Put"
    ],
    "optionsTelugu": [
      "కనాను",
      "కూషు",
      "మిస్రాయిము",
      "పూతు"
    ],
    "correctAnswer": "Canaan",
    "bibleReference": "Genesis 9:25",
    "explanation": "Noah said, 'Cursed be Canaan; a servant of servants shall he be to his brothers.'",
    "explanationTelugu": "నోవహు: కనాను శపించబడినవాడై తన సహోదరులకు దాసానుదాసుడగును అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q03",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Genesis 14:14, how many trained men born in his own household did Abram mobilize to rescue his nephew Lot?",
    "questionTelugu": "ఆదికాండము 14:14 లో తన సహోదరుని కుమారుడైన లోతును విడిపించుటకు అబ్రాము తన ఇంట పుట్టి శిక్షణ పొందిన ఎంతమంది సేవకులను నడిపించెను?",
    "options": [
      "318 trained men",
      "300 men",
      "700 men",
      "120 men"
    ],
    "optionsTelugu": [
      "318 మంది శిక్షణ పొందిన దాసులు",
      "300 మంది",
      "700 మంది",
      "120 మంది"
    ],
    "correctAnswer": "318 trained men",
    "bibleReference": "Genesis 14:14",
    "explanation": "Abram led forth his trained men, born in his house, 318 of them, and went in pursuit as far as Dan.",
    "explanationTelugu": "అబ్రాము తన ఇంట పుట్టి అలవరచబడిన మూడువందల పదునెనిమిదిమందిని వెంటబెట్టుకొని దాను వరకు వారిని తరిమెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q04",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Genesis 17:17, what were the respective ages of Abraham and Sarah when God promised they would bear Isaac?",
    "questionTelugu": "ఆదికాండము 17:17 లో ఇస్సాకు పుట్టుక వాగ్దానము చేయబడినప్పుడు అబ్రాహాము మరియు శారాల వయస్సులు వరుసగా ఎంత?",
    "options": [
      "Abraham 100 years old, Sarah 90 years old",
      "Abraham 99 years old, Sarah 89 years old",
      "Abraham 120 years old, Sarah 100 years old",
      "Abraham 85 years old, Sarah 75 years old"
    ],
    "optionsTelugu": [
      "అబ్రాహాముకు 100 సంవత్సరాలు, శారాకు 90 సంవత్సరాలు",
      "అబ్రాహాముకు 99, శారాకు 89",
      "అబ్రాహాముకు 120, శారాకు 100",
      "అబ్రాహాముకు 85, శారాకు 75"
    ],
    "correctAnswer": "Abraham 100 years old, Sarah 90 years old",
    "bibleReference": "Genesis 17:17",
    "explanation": "Abraham fell on his face and laughed, thinking: 'Shall a child be born to a man who is a hundred years old? Shall Sarah, who is ninety years old, bear a child?'",
    "explanationTelugu": "అబ్రాహాము సాగిలపడి నవ్వి: నూరేండ్ల వానికి సంతానము కలుగునా? తొంబది యేండ్ల శారా కనునా? అని తన హృదయములో అనుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q05",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Genesis 21:14, what did Abraham place on Hagar's shoulder when sending her and Ishmael into the Beersheba wilderness?",
    "questionTelugu": "ఆదికాండము 21:14 లో హాగరును ఇష్మాయేలును బెయేర్షెబా అరణ్యమునకు పంపివేయునప్పుడు అబ్రాహాము ఆమె భుజముపై ఏమి పెట్టెను?",
    "options": [
      "Bread and a skin of water",
      "A bag of gold coins",
      "Two young lambs",
      "A vessel of sweet wine"
    ],
    "optionsTelugu": [
      "రొట్టెను నీళ్ల తిత్తిని",
      "బంగారు నాణేల సంచి",
      "రెండు గొఱ్ఱెపిల్లలు",
      "మధురమైన ద్రాక్షారస పాత్ర"
    ],
    "correctAnswer": "Bread and a skin of water",
    "bibleReference": "Genesis 21:14",
    "explanation": "Abraham took bread and a skin of water and gave it to Hagar, putting it on her shoulder along with the child.",
    "explanationTelugu": "అబ్రాహాము తెల్లవారజామున లేచి రొట్టెను నీళ్ల తిత్తిని తీసికొని హాగరు భుజముమీద పెట్టి ఆ పిల్లవానిని ఆమెకిచ్చి ఆమెను పంపివేసెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q06",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Genesis 24:2-3, what ancient covenant gesture did Abraham require of his head servant when swearing not to take a Canaanite wife for Isaac?",
    "questionTelugu": "ఆదికాండము 24:2-3 లో ఇస్సాకునకు కనానీయుల కుమార్తెలలో భార్యను తీసికొనకూడదని అబ్రాహాము తన ప్రధాన దాసునితో చేయించిన ప్రమాణపు పద్ధతి ఏమిటి?",
    "options": [
      "Put your hand under my thigh",
      "Raise your right hand to heaven",
      "Pour oil upon an altar stone",
      "Touch the horns of the altar"
    ],
    "optionsTelugu": [
      "నీ చెయ్యి నా తొడక్రింద ఉంచుము",
      "పరలోకమువైపు కుడిచేయి ఎత్తుము",
      "బలిపీఠపు రాయిపై నూనె పోయుము",
      "బలిపీఠపు కొమ్ములను తాకుము"
    ],
    "correctAnswer": "Put your hand under my thigh",
    "bibleReference": "Genesis 24:2",
    "explanation": "Abraham said to the oldest servant of his house, 'Put your hand under my thigh, and I will make you swear by the Lord.'",
    "explanationTelugu": "అబ్రాహాము తన దాసునితో: నీ చెయ్యి నా తొడక్రింద ఉంచుము; పరలోకపు దేవుడైన యెహోవా తోడని నీచేత ప్రమాణము చేయించెదను అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q07",
    "order": 2,
    "questionType": "single_choice",
    "question": "What family blessing did Rebekah's mother and brother pronounce over her departure in Genesis 24:60?",
    "questionTelugu": "ఆదికాండము 24:60 లో రిబ్కా బయలుదేరుచుండగా ఆమె తల్లియు సహోదరుడును ఆమెను దీవించిన దీవెన ఏమిటి?",
    "options": [
      "\"Our sister, may you become thousands of ten thousands, and may your offspring possess the gates of their enemies!\"",
      "\"May you rule over the kings of Egypt\"",
      "\"May you dwell in palaces of cedar\"",
      "\"May silver and gold never depart from your hands\""
    ],
    "optionsTelugu": [
      "\"మా సహోదరీ, నీవు వేవేలకు తల్లివగుదువు గాక; నీ సంతానము తమ శత్రువుల గవునులను స్వాధీనపరచుకొనును గాక!\"",
      "\"నీవు ఐగుప్తు రాజులపై ఏలుబడి చేయుదువు గాక\"",
      "\"దేవదారు నగరులలో నివసింతువు గాక\"",
      "\"వెండి బంగారములు నీ చేతులనుండి తొలగిపోకుండును గాక\""
    ],
    "correctAnswer": "\"Our sister, may you become thousands of ten thousands, and may your offspring possess the gates of their enemies!\"",
    "bibleReference": "Genesis 24:60",
    "explanation": "They blessed Rebekah: 'Our sister, be the mother of thousands of ten thousands, and let your offspring possess the gate of those who hate them.'",
    "explanationTelugu": "వారు రిబ్కాను దీవించి: మా సహోదరీ, నీవు వేవేలకు తల్లివగుదువు గాక; నీ సంతానము తమ శత్రువుల ద్వారములను స్వాధీనపరచుకొనును గాక అనిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q08",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Genesis 27:39-40, what prophetic word did Isaac speak concerning Esau's familial future under his brother?",
    "questionTelugu": "ఆదికాండము 27:39-40 లో తన సహోదరుని క్రింద ఏశావు భవిష్యత్తును గూర్చి ఇస్సాకు పలికిన ప్రవచనార్థకమైన మాట ఏమిటి?",
    "options": [
      "\"By your sword you shall live, and you shall serve your brother; but when you grow restless you shall break his yoke from your neck\"",
      "\"You shall forever be a king over Israel\"",
      "\"Your descendants shall inherit Canaan\"",
      "\"You shall dwell in peace in Mesopotamia\""
    ],
    "optionsTelugu": [
      "\"నీవు నీ ఖడ్గముచేత జీవించుచు నీ సహోదరునికి దాసుడవై యుందువు; నీవు తిరుగుబాటు చేయునప్పుడు అతని కాడిని నీ మెడమీదనుండి విరుగదన్నుదువు\"",
      "\"నీవు నిత్యము ఇశ్రాయేలుపై రాజువగుదువు\"",
      "\"నీ సంతానము కనానును పొందును\"",
      "\"పద్దనరాములో శాంతితో జీవింతువు\""
    ],
    "correctAnswer": "\"By your sword you shall live, and you shall serve your brother; but when you grow restless you shall break his yoke from your neck\"",
    "bibleReference": "Genesis 27:40",
    "explanation": "Isaac prophesied: 'By your sword you shall live, and you shall serve your brother; and it shall come to pass when you break loose, you shall shake his yoke from off your neck.'",
    "explanationTelugu": "ఇస్సాకు: నీవు నీ ఖడ్గముచేత జీవించుచు నీ సహోదరునికి దాసుడవై యుందువు; నీవు విసుగుచెంది తిరుగుబాటు చేయునప్పుడు అతని కాడిని నీ మెడమీదనుండి విరుగదన్నుదువనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q09",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Genesis 28:1-2, to whose house did Isaac instruct Jacob to flee and seek a godly wife?",
    "questionTelugu": "ఆదికాండము 28:1-2 లో వివాహము చేసుకొనుటకు ఎవరి ఇంటికి వెళ్లవలెనని ఇస్సాకు యాకోబునకు ఆజ్ఞాపించెను?",
    "options": [
      "The house of Bethuel, his mother's father",
      "The house of Ishmael",
      "The house of Melchizedek",
      "The house of Abimelech"
    ],
    "optionsTelugu": [
      "తన తల్లికి తండ్రియైన బెతూయేలు ఇంటికి",
      "ఇష్మాయేలు ఇంటికి",
      "మెల్కీసెదెకు ఇంటికి",
      "అబీమెలెకు ఇంటికి"
    ],
    "correctAnswer": "The house of Bethuel, his mother's father",
    "bibleReference": "Genesis 28:2",
    "explanation": "Isaac told Jacob: 'Arise, go to Paddan-aram to the house of Bethuel your mother's father, and take a wife from there of the daughters of Laban.'",
    "explanationTelugu": "ఇస్సాకు: నీవు లేచి పద్దనరాములోనున్న నీ తల్లికి తండ్రియైన బెతూయేలు ఇంటికి వెళ్లి అక్కడ నీ తల్లి సహోదరుడైన లాబాను కుమార్తెలలో ఒకదానిని పెండ్లి చేసికొనుమనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q10",
    "order": 5,
    "questionType": "single_choice",
    "question": "At which river crossing did Jacob send his two wives, two maidservants, and eleven sons across in Genesis 32:22?",
    "questionTelugu": "ఆదికాండము 32:22 లో తన ఇద్దరు భార్యలను, ఇద్దరు దాసీలను, పదకొండుమంది పిల్లలను యాకోబు రాత్రివేళ దాటించిన నదీ రేవు ఏది?",
    "options": [
      "The Ford of Jabbok",
      "The River Jordan",
      "The Brook Cherith",
      "The River Arnon"
    ],
    "optionsTelugu": [
      "యబ్బోకు రేవు",
      "యొర్దాను నది",
      "కెరీతు వాగు",
      "అర్నోను నది"
    ],
    "correctAnswer": "The Ford of Jabbok",
    "bibleReference": "Genesis 32:22",
    "explanation": "That night Jacob got up and took his two wives, his two female servants, and his eleven sons and crossed the ford of the Jabbok.",
    "explanationTelugu": "ఆ రాత్రియందే అతడు లేచి తన యిద్దరు భార్యలను తన యిద్దరు దాసీలను తన పదునొకండుమంది కుమారులను తీసికొని యబ్బోకు రేవు దాటించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q11",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Genesis 35:18, what name did dying Rachel give to her newborn son, and what name did Jacob confer instead?",
    "questionTelugu": "ఆదికాండము 35:18 లో ప్రాణము పోవుచుండగా రాహేలు తన కుమారునికి పెట్టిన పేరు ఏమిటి, మరియు తండ్రియైన యాకోబు అతనికి ఏ పేరు పెట్టెను?",
    "options": [
      "Rachel called him Ben-Oni (Son of My Sorrow); Jacob named him Benjamin (Son of My Right Hand)",
      "Rachel named him Joseph; Jacob called him Manasseh",
      "Rachel named him Dan; Jacob named him Naphtali",
      "Rachel named him Judah; Jacob called him Levi"
    ],
    "optionsTelugu": [
      "రాహేలు బెనోనీ (నా శ్రమ కుమారుడు) అనెను; తండ్రి అతనికి బెన్యామీను (కుడిచేతి కుమారుడు) అని పేరు పెట్టెను",
      "రాహేలు యోసేపు అనెను; తండ్రి మనష్షే అనెను",
      "రాహేలు దాను అనెను; తండ్రి నఫ్తాలి అనెను",
      "రాహేలు యూదా అనెను; తండ్రి లేవి అనెను"
    ],
    "correctAnswer": "Rachel called him Ben-Oni (Son of My Sorrow); Jacob named him Benjamin (Son of My Right Hand)",
    "bibleReference": "Genesis 35:18",
    "explanation": "As her soul was departing, she called his name Ben-Oni; but his father called him Benjamin.",
    "explanationTelugu": "ఆమె మృతిబొందుచు తన ప్రాణము పోవు సమయమందు అతనికి బెనోనీ అని పేరు పెట్టెను; అయితే అతని తండ్రి అతనికి బెన్యామీను అని పేరు పెట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q12",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Genesis 46:10, which son of Simeon is noted as having been born of a Canaanite woman?",
    "questionTelugu": "ఆదికాండము 46:10 లో కనానీయురాలైన స్త్రీకి పుట్టినవాడుగా ప్రత్యేకముగా పేర్కొనబడిన షిమ్యోను కుమారుడు ఎవరు?",
    "options": [
      "Shaul",
      "Jemuel",
      "Jamin",
      "Ohad"
    ],
    "optionsTelugu": [
      "షావూలు",
      "యెమూయేలు",
      "యామీను",
      "ఓహదు"
    ],
    "correctAnswer": "Shaul",
    "bibleReference": "Genesis 46:10",
    "explanation": "The sons of Simeon included Shaul the son of a Canaanite woman.",
    "explanationTelugu": "షిమ్యోను కుమారులలో షావూలు కనానీయురాలైన స్త్రీకి పుట్టినవాడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q13",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Genesis 49:3-4, what serious familial offense caused firstborn Reuben to lose his preeminence in Jacob's final blessing?",
    "questionTelugu": "ఆదికాండము 49:3-4 లో మొదటి కుమారుడైన రూబేను తన శ్రేష్ఠతను కోల్పోవుటకు కారణమైన ఏ కుటుంబ పాపమును యాకోబు ప్రస్తావించెను?",
    "options": [
      "He defiled his father's bed by lying with Bilhah his father's concubine",
      "He sold Joseph to Midianite traders",
      "He refused to go into Egypt for grain",
      "He struck an altar of stone"
    ],
    "optionsTelugu": [
      "తన తండ్రి ఉపపత్నియైన బిల్హాతో శయనించి తండ్రి మంచమును అపవిత్రపరచెను",
      "యోసేపును మిద్యాను వర్తకులకు అమ్మివేసెను",
      "ధాన్యము కొరకు ఐగుప్తునకు వెళ్లననెను",
      "రాతి బలిపీఠమును పగలగొట్టెను"
    ],
    "correctAnswer": "He defiled his father's bed by lying with Bilhah his father's concubine",
    "bibleReference": "Genesis 49:4",
    "explanation": "Jacob declared: 'Unstable as water, you shall not excel, because you went up to your father's bed; then you defiled it.'",
    "explanationTelugu": "యాకోబు: నీవు నీళ్లవలె చంచలుడవై శ్రేష్ఠత నొందవు; నీవు నీ తండ్రి మంచముమీదికి ఎక్కితివి, దానిని అపవిత్రము చేసితివి అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q14",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Genesis 49:8-10, what eternal royal prophecy was given to the lineage of Judah?",
    "questionTelugu": "ఆదికాండము 49:8-10 లో యూదా వంశమునకు ఇవ్వబడిన నిత్య రాజరికపు ప్రవచనము ఏమిటి?",
    "options": [
      "\"The scepter shall not depart from Judah, nor a lawgiver from between his feet, until Shiloh comes\"",
      "\"He shall build tabernacles across the Euphrates\"",
      "\"He shall possess the mountains of Seir\"",
      "\"He shall shepherd the flocks of Lebanon\""
    ],
    "optionsTelugu": [
      "\"షిలోహు వచ్చువరకు యూదా యొద్దనుండి దండము తొలగదు, అతని కాళ్ల మధ్యనుండి రాజదండము తొలగిపోదు\"",
      "\"యూఫ్రటీసు నదియంతటా గుడారాలు వేయును\"",
      "\"శేయీరు పర్వతములను స్వాధీనపరచుకొనును\"",
      "\"లెబానోను మందలను మేపును\""
    ],
    "correctAnswer": "\"The scepter shall not depart from Judah, nor a lawgiver from between his feet, until Shiloh comes\"",
    "bibleReference": "Genesis 49:10",
    "explanation": "The scepter will not depart from Judah, nor the ruler's staff from between his feet, until he to whom it belongs shall come (Shiloh).",
    "explanationTelugu": "షిలోహు వచ్చువరకు యూదా యొద్దనుండి దండము తొలగదు, అతని కాళ్ల మధ్యనుండి రాజదండము తొలగదు; ప్రజలు అతనికి విధేయులగుదురు.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q15",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Genesis 49:22, how is Joseph's fruitful family legacy poetically characterized by Jacob?",
    "questionTelugu": "ఆదికాండము 49:22 లో యోసేపు యొక్క విస్తారమైన కుటుంబ ఆశీర్వాదమును యాకోబు ఏ కవితారూపములో వర్ణించెను?",
    "options": [
      "\"A fruitful bough by a spring, whose branches run over the wall\"",
      "\"A roaring lion leaping upon prey\"",
      "\"A swift deer bounding across peaks\"",
      "\"A cedar tree in the midst of snow\""
    ],
    "optionsTelugu": [
      "\"నీటి ఊటయొద్ద ఫలించెడి కొమ్మ, గోడపైకి ఎక్కి వ్యాపించు కొమ్మలు గల ఫలభరితమైన కొమ్మ\"",
      "\"వేటపైకి దుముకు గర్జించు సింహము\"",
      "\"కొండకొమ్ములపై దూకు దుప్పి\"",
      "\"మంచులోనున్న దేవదారు వృక్షము\""
    ],
    "correctAnswer": "\"A fruitful bough by a spring, whose branches run over the wall\"",
    "bibleReference": "Genesis 49:22",
    "explanation": "Jacob blessed him: 'Joseph is a fruitful bough, a fruitful bough by a spring; his branches run over the wall.'",
    "explanationTelugu": "యోసేపు ఫలించెడి కొమ్మ, ఊటయొద్ద ఫలించెడి కొమ్మ; దాని కొమ్మలు గోడమీదికి ఎక్కి వ్యాపించును.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q16",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Exodus 1:15, what were the names of the two courageous Hebrew midwives who feared God and preserved the newborn infant boys?",
    "questionTelugu": "నిర్గమకాండము 1:15 లో దేవునికి భయపడి రాజు ఆజ్ఞను ధిక్కరించి మగపిల్లలను బ్రదికించిన ఇద్దరు హెబ్రీ మంత్రసానుల పేర్లు ఏమిటి?",
    "options": [
      "Shiphrah and Puah",
      "Miriam and Jochebed",
      "Elisheba and Zipporah",
      "Deborah and Huldah"
    ],
    "optionsTelugu": [
      "షిప్రా మరియు పూవా",
      "మిర్యాము మరియు యోకెబెదు",
      "ఎలీషెబ మరియు సిప్పోరా",
      "దెబోరా మరియు హుల్దా"
    ],
    "correctAnswer": "Shiphrah and Puah",
    "bibleReference": "Exodus 1:15",
    "explanation": "The king of Egypt said to the Hebrew midwives, whose names were Shiphrah and Puah, to kill the baby boys, but they feared God.",
    "explanationTelugu": "ఐగుప్తు రాజు షిప్రా పూవా అను హెబ్రీ మంత్రసానులతో మాట్లాడి మగపిల్లలను చంపుడనెను; అయితే వారు దేవునికి భయపడి పిల్లలను బ్రదికించిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q17",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Exodus 4:24-26, what dramatic covenant action did Zipporah take with a flint knife at the lodging place to save Moses' life?",
    "questionTelugu": "నిర్గమకాండము 4:24-26 లో సత్రములో మోషే ప్రాణమును కాపాడుటకు సిప్పోరా వాడియైన రాతితో ఏ నిబంధన క్రియను చేసెను?",
    "options": [
      "Cut off her son's foreskin, touched Moses' feet, and declared: 'Surely a bridegroom of blood are you to me!'",
      "Sacrificed an unblemished lamb upon the threshold",
      "Poured virgin olive oil upon the doorposts",
      "Fastened blue cords upon Moses' garment"
    ],
    "optionsTelugu": [
      "రాతి చురకత్తి తీసి తన కుమారునికి సున్నతి చేసి ఆ చర్మమును మోషే పాదములకు తగిలించి: నిజముగా నీవు నాకు రక్తసంబంధమైన పెండ్లికుమారుడవు అనెను",
      "నిర్దోషమైన గొఱ్ఱెపిల్లను గడపపై వధించెను",
      "ద్వారబంధములపై ఒలీవ నూనె పోసెను",
      "నీలి నూలు దారములను వస్త్రమునకు కట్టెను"
    ],
    "correctAnswer": "Cut off her son's foreskin, touched Moses' feet, and declared: 'Surely a bridegroom of blood are you to me!'",
    "bibleReference": "Exodus 4:25-26",
    "explanation": "Zipporah took a sharp flint and cut off the foreskin of her son and cast it at his feet, saying: 'Surely a bridegroom of blood you are to me.'",
    "explanationTelugu": "సిప్పోరా వాడియైన రాయి తీసి తన కుమారుని చర్మమును కోసి అతని పాదములయొద్ద పడవేసి: నిజముగా నీవు నాకు రక్తసంబంధమైన పెండ్లికుమారుడవు అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q18",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Exodus 18:2-4, what were the names and biblical meanings of Moses' two sons by Zipporah?",
    "questionTelugu": "నిర్గమకాండము 18:2-4 లో సిప్పోరా ద్వారా మోషేకు పుట్టిన ఇద్దరు కుమారుల పేర్లు మరియు వాటి అర్థములు ఏమిటి?",
    "options": [
      "Gershom ('sojourner in a foreign land') and Eliezer ('my father's God was my help')",
      "Nadab and Abihu",
      "Eleazar and Ithamar",
      "Phinehas and Hophni"
    ],
    "optionsTelugu": [
      "గెర్షోము (పరదేశమందు పరవాసినైతిని) మరియు ఎలీయెజెరు (నా తండ్రి దేవుడు నాకు సహాయకుడాయెను)",
      "నాదాబు మరియు అబీహు",
      "ఎలియాజరు మరియు ఈతామారు",
      "ఫీనెహాసు మరియు హొఫ్నీ"
    ],
    "correctAnswer": "Gershom ('sojourner in a foreign land') and Eliezer ('my father's God was my help')",
    "bibleReference": "Exodus 18:3-4",
    "explanation": "One son was named Gershom, for Moses said, 'I have been a stranger in a strange land,' and the other was Eliezer, 'for the God of my father was my help.'",
    "explanationTelugu": "ఒకని పేరు గెర్షోము, ఏలయనగా: పరదేశమందు నేను పరవాసినైతిననెను; రెండవవాని పేరు ఎలీయెజెరు, ఏలయనగా: నా తండ్రి దేవుడు నాకు సహాయకుడై ఫరో ఖడ్గమునుండి నన్ను తప్పించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q19",
    "order": 4,
    "questionType": "single_choice",
    "question": "According to Leviticus 21:1-3, for which specific close blood relatives was an ordinary priest permitted to mourn and defile himself?",
    "questionTelugu": "లేవీయకాండము 21:1-3 ప్రకారం సాధారణ యాజకుడు అపవిత్రత సంభవించునట్లు ఎవరి శవము నిమిత్తము మాత్రమే దుఃఖింపవచ్చును?",
    "options": [
      "Mother, father, son, daughter, brother, and unmarried virgin sister",
      "Any member of his tribe of Levi",
      "Any family elder in Israel",
      "His close neighbors and cousins"
    ],
    "optionsTelugu": [
      "తన తల్లి, తండ్రి, కుమారుడు, కుమార్తె, సహోదరుడు, వివాహము కాని కన్యకయైన సహోదరి",
      "లేవి గోత్రపు ఎవరి శవమైనా",
      "ఇశ్రాయేలులోని పెద్దల శవము",
      "తన ఇరుగుపొరుగు మరియు మేనబావలు"
    ],
    "correctAnswer": "Mother, father, son, daughter, brother, and unmarried virgin sister",
    "bibleReference": "Leviticus 21:2-3",
    "explanation": "A priest could only defile himself for his nearest kin: his mother, his father, his son, his daughter, his brother, and his virgin sister who has no husband.",
    "explanationTelugu": "యాజకుడు తన తల్లి, తండ్రి, కుమారుడు, కుమార్తె, సహోదరుడు, మరియు పెండ్లికాని తన కన్యకయైన సహోదరి అను సమీప రక్తసంబంధుల నిమిత్తమే అపవిత్రపడవచ్చును.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q20",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Leviticus 21:13-14, whom was the High Priest strictly commanded to marry?",
    "questionTelugu": "లేవీయకాండము 21:13-14 ప్రకారం ప్రధాన యాజకుడు వివాహమాడవలసిన స్త్రీకి సంబంధించిన పవిత్ర నిబంధన ఏమిటి?",
    "options": [
      "Only a virgin of his own people",
      "A widow of another priest",
      "A divorced godly woman",
      "Any woman of the twelve tribes"
    ],
    "optionsTelugu": [
      "తన ప్రజలలోని కన్యకను మాత్రమే",
      "వేరొక యాజకుని భార్యయైన విధవరాలు",
      "విడాకులు పొందిన భక్తిగల స్త్రీ",
      "పండ్రెండు గోత్రములలో ఎవరినైనా"
    ],
    "correctAnswer": "Only a virgin of his own people",
    "bibleReference": "Leviticus 21:13-14",
    "explanation": "The High Priest shall take a wife in her virginity; a widow, or a divorced woman, or profane woman he shall not take, but a virgin of his own people.",
    "explanationTelugu": "ప్రధాన యాజకుడు కన్యకను భార్యగా చేసికొనవలెను; విధవరాలినైనను విడాకులు పొందినదానినైనను తీసికొనకూడదు, తన స్వజనులలోని కన్యకనే పెండ్లి చేసికొనవలెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q21",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Numbers 12:1-2, what was the underlying familial pretext used by Miriam and Aaron to criticize Moses' leadership?",
    "questionTelugu": "సంఖ్యాకాండము 12:1-2 లో మిర్యాము అహరోనులు మోషే నాయకత్వమును విమర్శించుటకు నెపముగా చూపిన అతని కుటుంబ విషయము ఏది?",
    "options": [
      "Because of the Cushite woman whom Moses had married",
      "Because Moses did not circumcise his sons in Egypt",
      "Because Jethro advised the appointing of seventy elders",
      "Because Gershom was not made high priest"
    ],
    "optionsTelugu": [
      "మోషే పెండ్లిచేసికొనిన కూషీయురాలైన స్త్రీని బట్టి",
      "మోషే తన కుమారులకు ఐగుప్తులో సున్నతి చేయనందున",
      "యిత్రో సలహామేరకు డెబ్బదిమంది పెద్దలను ఏర్పరచినందుకు",
      "గెర్షోమును ప్రధాన యాజకునిగా చేయనందుకు"
    ],
    "correctAnswer": "Because of the Cushite woman whom Moses had married",
    "bibleReference": "Numbers 12:1",
    "explanation": "Miriam and Aaron spoke against Moses because of the Cushite woman whom he had married, for he had married a Cushite.",
    "explanationTelugu": "మోషే కూషీయురాలైన స్త్రీని పెండ్లి చేసికొనియుండెను గనుక అతడు పెండ్లి చేసికొనిన ఆ స్త్రీనిబట్టి మిర్యాము అహరోనులు అతనికి విరోధముగా మాట్లాడిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q22",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Numbers 32:16-17, what provision did the tribes of Reuben and Gad promise to make for their families before crossing the Jordan to fight?",
    "questionTelugu": "సంఖ్యాకాండము 32:16-17 లో యుద్ధమునకు ముందుగా యొర్దానుకు తూర్పున తమ కుటుంబాల కొరకు ఏమి కట్టింతుమని రూబేనీయులు గాదీయులు వాగ్దానము చేసిరి?",
    "options": [
      "Build sheepfolds for flocks and fortified cities for little children to dwell safely",
      "Send them back to Egypt for security",
      "Leave them in tents without defense",
      "Appoint guards from the Levites"
    ],
    "optionsTelugu": [
      "మందలకొరకు దొడ్లను, చిన్నపిల్లల కొరకు ప్రాకారములుగల పట్టణములను కట్టింతుము",
      "రక్షణకొరకు వారిని ఐగుప్తునకు పంపుదుము",
      "రక్షణలేని గుడారములలో విడిచిపెట్టుదుము",
      "లేవీయులను కావలి ఉంచుదుము"
    ],
    "correctAnswer": "Build sheepfolds for flocks and fortified cities for little children to dwell safely",
    "bibleReference": "Numbers 32:16",
    "explanation": "They came near to Moses and said: 'We will build sheepfolds here for our livestock, and cities for our little ones.'",
    "explanationTelugu": "వారు మోషే సమీపమునకు వచ్చి: మేము మా మందలకొరకు ఇక్కడ దొడ్లను, మా పిల్లలకొరకు పట్టణములను కట్టుకొందుము అనిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q23",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Deuteronomy 24:16, what fundamental biblical principle protects family members from collective capital punishment?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 24:16 ప్రకారం, కుటుంబ సభ్యులను సామూహిక మరణశిక్ష నుండి కాపాడు ఏ ప్రాథమిక న్యాయ సూత్రము విధించబడెను?",
    "options": [
      "\"Fathers shall not be put to death for their children, nor children for their fathers; each shall die for their own sin\"",
      "\"The whole family must bear the penalty of the father\"",
      "\"Children are sold as slaves to pay a parent's debt\"",
      "\"Fathers must take their children's place in execution\""
    ],
    "optionsTelugu": [
      "\"పిల్లల నిమిత్తము తండ్రులును, తండ్రుల నిమిత్తము పిల్లలును చంపబడకూడదు; ఎవరి పాపము నిమిత్తము వారే చంపబడవలెను\"",
      "\"కుటుంబమంతయు తండ్రి శిక్షను భరించాలి\"",
      "\"తల్లిదండ్రుల అప్పులకొరకు పిల్లలను బానిసలుగా అమ్మాలి\"",
      "\"పిల్లల బదులుగా తండ్రులే శిక్ష అనుభవించాలి\""
    ],
    "correctAnswer": "\"Fathers shall not be put to death for their children, nor children for their fathers; each shall die for their own sin\"",
    "bibleReference": "Deuteronomy 24:16",
    "explanation": "Scripture establishes individual responsibility: 'Fathers shall not be put to death for their children, nor shall children be put to death for their fathers; each shall die for his own sin.'",
    "explanationTelugu": "వ్యక్తిగత బాధ్యతను స్థిరపరుస్తూ: పిల్లల నిమిత్తము తండ్రులు చంపబడకూడదు, తండ్రుల నిమిత్తము పిల్లలు చంపబడకూడదు; ఎవరి పాపము నిమిత్తము వారే చంపబడవలెను అని ధర్మశాస్త్రము ఆజ్ఞాపించుచున్నది.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q24",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Deuteronomy 25:9-10, what shameful epithet was attached to a brother who refused to build up his deceased brother's house?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 25:9-10 లో చనిపోయిన సహోదరుని ఇంటిని కట్టుటకు ఇష్టపడనివాని ఇంటికి సమాజములో ఏ అవమానకరమైన పేరు పెట్టబడెను?",
    "options": [
      "\"The house of him who had his sandal pulled off\"",
      "\"The house of the uncircumcised\"",
      "\"The clan of barrenness\"",
      "\"The dwelling of rebellious sons\""
    ],
    "optionsTelugu": [
      "\"చెప్పు విప్పబడినవాని యిల్లు\"",
      "\"సున్నతిలేనివాని యిల్లు\"",
      "\"గొడ్రాలితనపు వంశము\"",
      "\"తిరుగుబాటు కుమారుల గుడారము\""
    ],
    "correctAnswer": "\"The house of him who had his sandal pulled off\"",
    "bibleReference": "Deuteronomy 25:10",
    "explanation": "His name shall be called in Israel: 'The house of him who had his sandal removed.'",
    "explanationTelugu": "ఇశ్రాయేలులో వాని పేరు 'చెప్పు విప్పబడినవాని యిల్లు' అని పిలువబడును.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q25",
    "order": 5,
    "questionType": "single_choice",
    "question": "Under Deuteronomy 21:18-21, what extreme communal measure was legislated for a stubbornly rebellious, drunken son who defied parents?",
    "questionTelugu": "ద్వితీయోపదేశకాండము 21:18-21 ప్రకారం తల్లిదండ్రుల మాటకు ఎంతమాత్రము వినని మొండివాడును త్రాగుబోతునైన కుమారునికి పెద్దల తీర్పు ఏమిటి?",
    "options": [
      "All the men of his city shall stone him to death with stones to purge evil from Israel",
      "Exile beyond the River Jordan for seven years",
      "Permanent enslavement to the town elders",
      "Disinheritance with forty lashes"
    ],
    "optionsTelugu": [
      "ఇశ్రాయేలులోనుండి ఆ చెడుతనమును పరిహరించునట్లు అతని పట్టణపు మనుష్యులందరు రాళ్లతో కొట్టి చంపవలెను",
      "ఏడు సంవత్సరములు యొర్దాను అవతలికి బహిష్కరణ",
      "పట్టణ పెద్దలకు శాశ్వత దాసత్వము",
      "స్వాస్థ్య రద్దు మరియు నలువది కొరడా దెబ్బలు"
    ],
    "correctAnswer": "All the men of his city shall stone him to death with stones to purge evil from Israel",
    "bibleReference": "Deuteronomy 21:21",
    "explanation": "Then all the men of his city shall stone him to death with stones; so you shall put away the evil from your midst.",
    "explanationTelugu": "అప్పుడు అతని పట్టణపు జనులందరు రాళ్లతో అతని చావగొట్టవలెను; ఆలాగున నీ మధ్యనుండి ఆ చెడుతనమును పరిహరింపవలెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q26",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Joshua 15:14, which three formidable sons of Anak did aged Caleb drive out from Hebron?",
    "questionTelugu": "యెహోషువ 15:14 లో హెబ్రోను నుండి వృద్ధుడైన కాలేబు వెళ్లగొట్టిన అనాకీయుల ముగ్గురు కుమారుల పేర్లు ఏమిటి?",
    "options": [
      "Sheshai, Ahiman, and Talmai",
      "Og, Sihon, and Balak",
      "Goliath, Lahmi, and Ishbi-benob",
      "Eglon, Sisera, and Jabin"
    ],
    "optionsTelugu": [
      "శేషై, అహీమాను, తల్మై",
      "ఓగు, సీహోను, బాలాకు",
      "గొల్యాతు, లహ్మీ, ఇష్బీ-బెనోబు",
      "ఎగ్లోను, సీసెర, యాబీను"
    ],
    "correctAnswer": "Sheshai, Ahiman, and Talmai",
    "bibleReference": "Joshua 15:14",
    "explanation": "Caleb drove out from there the three sons of Anak: Sheshai, Ahiman, and Talmai, the children of Anak.",
    "explanationTelugu": "కాలేబు అక్కడనుండి అనాకీయుడైన శేషై, అహీమాను, తల్మై అను అనాకు ముగ్గురు కుమారులను వెళ్లగొట్టెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q27",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Judges 9:5, how many of his half-brothers did ruthless Abimelech murder on a single stone at Ophrah to seize power?",
    "questionTelugu": "న్యాయాధిపతులు 9:5 లో అధికారము కొరకు ఒఫ్రాలో ఒకే రాతిమీద క్రూరుడైన అబీమెలెకు చంపించిన తన సవతి సహోదరుల సంఖ్య ఎంత?",
    "options": [
      "Seventy brothers, except Jotham the youngest who hid himself",
      "Twelve brothers",
      "Thirty brothers",
      "Ten brothers"
    ],
    "optionsTelugu": [
      "డెబ్బదిమంది సహోదరులు (దాగుకొని తప్పించుకున్న చిన్నవాడైన యోతాము తప్ప)",
      "పండ్రెండుగురు",
      "ముప్పదిమంది",
      "పదిమంది"
    ],
    "correctAnswer": "Seventy brothers, except Jotham the youngest who hid himself",
    "bibleReference": "Judges 9:5",
    "explanation": "He went to his father's house at Ophrah and killed his brothers, the seventy sons of Jerubbaal, upon one stone; but Jotham the youngest hid.",
    "explanationTelugu": "అతడు ఒఫ్రాలోని తన తండ్రి యింటికి పోయి యెరుబ్బయలు కుమారులైన డెబ్బదిమంది తన సహోదరులను ఒక్క రాతిమీద చంపెను; అయితే యోతాము దాగుకొని తప్పించుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q28",
    "order": 3,
    "questionType": "single_choice",
    "question": "From which mountain summit did surviving brother Jotham deliver his famous parable exposing his brothers' murderers in Judges 9:7?",
    "questionTelugu": "న్యాయాధిపతులు 9:7 లో తప్పించుకొనిన యోతాము ఏ పర్వత శిఖరముపై నిలిచి అబీమెలెకు మరియు షెకెము పెద్దలకు చెట్ల సామెతను వినిపించెను?",
    "options": [
      "Mount Gerizim",
      "Mount Ebal",
      "Mount Carmel",
      "Mount Nebo"
    ],
    "optionsTelugu": [
      "గెరిజీము పర్వతము",
      "ఏబాలు పర్వతము",
      "కర్మెలు పర్వతము",
      "నెబో పర్వతము"
    ],
    "correctAnswer": "Mount Gerizim",
    "bibleReference": "Judges 9:7",
    "explanation": "When they told Jotham, he went and stood on top of Mount Gerizim and shouted out his parable of the trees.",
    "explanationTelugu": "జనులు యోతామునకు ఆ సంగతి తెలియజేయగా అతడు వెళ్లి గెరిజీము పర్వతశిఖరముమీద నిలిచి ఎలుగెత్తి అరిచి ఆ ఉపమానము చెప్పెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q29",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Judges 14:3, how did Samson's parents protest his desire to marry a woman from Timnah?",
    "questionTelugu": "న్యాయాధిపతులు 14:3 లో తిమ్నాలోని స్త్రీని పెండ్లిచేసికొనవలెనన్న సమ్సోను కోరికను అతని తల్లిదండ్రులు ఏమని వారించిరి?",
    "options": [
      "\"Is there no woman among the daughters of your brethren or among all our people, that you must take a wife from uncircumcised Philistines?\"",
      "\"You must marry a Levite maiden\"",
      "\"The law of Moses strictly forbids traveling to Timnah\"",
      "\"Her father will demand forty oxen\""
    ],
    "optionsTelugu": [
      "\"సున్నతిలేని ఫిలిష్తీయులలోనుండి భార్యను తెచ్చుకొనుటకు నీ సహోదరుల కుమార్తెలలోనైనను మన ప్రజలందరిలోనైనను ఒక్క స్త్రీయు లేదా?\"",
      "\"నీవు లేవి గోత్రపు కన్యకనే చేసుకోవాలి\"",
      "\"తిమ్నాకు పోవుట మోషే ధర్మశాస్త్రములో నిషిద్ధము\"",
      "\"ఆమె తండ్రి నలువది ఎడ్లను అడుగును\""
    ],
    "correctAnswer": "\"Is there no woman among the daughters of your brethren or among all our people, that you must take a wife from uncircumcised Philistines?\"",
    "bibleReference": "Judges 14:3",
    "explanation": "His father and mother said: 'Is there not a woman among the daughters of your relatives, or among all our people, that you go to take a wife from the uncircumcised Philistines?'",
    "explanationTelugu": "అతని తండ్రియు తల్లియు: సున్నతిలేని ఫిలిష్తీయులలోనుండి భార్యను తెచ్చుకొనుటకు నీ సహోదరుల కుమార్తెలలోనైనను మన ప్రజలందరిలోనైనను ఒక్క స్త్రీయు లేదా అని అడిగిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q30",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Judges 16:31, where did Samson's brothers and father's family lovingly lay his body to rest after his death?",
    "questionTelugu": "న్యాయాధిపతులు 16:31 లో సమ్సోను మరణించిన తరువాత అతని సహోదరులు మరియు తండ్రి యింటివారందరు అతని శవమును ఎక్కడ సమాధి చేసిరి?",
    "options": [
      "Between Zorah and Eshtaol in the tomb of Manoah his father",
      "In the cave of Machpelah at Hebron",
      "Under the oak of Shechem",
      "At the gates of Gaza"
    ],
    "optionsTelugu": [
      "జొర్యాకును ఎష్తాయోలుకును మధ్యనున్న అతని తండ్రియైన మనోహ సమాధిలో",
      "హెబ్రోనులోని మక్పేలా గుహలో",
      "షెకెము సిందూర వృక్షము క్రింద",
      "గాజా పట్టణపు ద్వారము వద్ద"
    ],
    "correctAnswer": "Between Zorah and Eshtaol in the tomb of Manoah his father",
    "bibleReference": "Judges 16:31",
    "explanation": "Then his brothers and all his father's house came down, took his body, brought him up, and buried him between Zorah and Eshtaol in the tomb of Manoah his father.",
    "explanationTelugu": "అతని సహోదరులును అతని తండ్రి యింటివారందరును వచ్చి అతనిని తీసికొనిపోయి జొర్యాకును ఎష్తాయోలుకును మధ్యనున్న అతని తండ్రియైన మనోహ సమాధిలో పాతిపెట్టిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q31",
    "order": 1,
    "questionType": "single_choice",
    "question": "In 1 Samuel 2:34, what divine sign of doom was announced concerning Eli's two corrupt priest sons?",
    "questionTelugu": "1 సమూయేలు 2:34 లో ఏలీ కుమారులైన హొఫ్నీ ఫీనెహాసులకు సంభవింపబోవు నాశనమునకు దేవుడు ఇచ్చిన సూచన ఏమిటి?",
    "options": [
      "Both of them shall die on the same day",
      "They shall be exiled to the Philistines",
      "They shall lose their eyesight at forty",
      "They shall fall by leprosy"
    ],
    "optionsTelugu": [
      "ఒక్క దినమందే వారిద్దరును మరణింతురు",
      "ఫిలిష్తీయుల దేశమునకు చెరగా పోవుదురు",
      "నలువది ఏండ్లకే గ్రుడ్డివారగుదురు",
      "కుష్ఠురోగముతో పడిపోవుదురు"
    ],
    "correctAnswer": "Both of them shall die on the same day",
    "bibleReference": "1 Samuel 2:34",
    "explanation": "This shall be the sign to you that will come upon your two sons, Hophni and Phinehas: in one day both of them shall die.",
    "explanationTelugu": "నీ ఇద్దరు కుమారులైన హొఫ్నీకిని ఫీనెహాసునకును సంభవింపబోవు సంగతియే నీకు సూచనగా ఉండును; ఒక్క దినమందే వారిద్దరును చనిపోవుదురు.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q32",
    "order": 2,
    "questionType": "single_choice",
    "question": "In 1 Samuel 8:1-3, what were the names of Samuel's two sons whom he appointed judges in Beersheba, who tragically turned aside after dishonest gain?",
    "questionTelugu": "1 సమూయేలు 8:1-3 లో బెయేర్షెబాలో న్యాయాధిపతులుగా ఉండి అన్యాయపు లాభమును ఆశించి తీర్పును తారుమారు చేసిన సమూయేలు ఇద్దరు కుమారుల పేర్లు ఏమిటి?",
    "options": [
      "Joel the firstborn and Abijah the second",
      "Hophni and Phinehas",
      "Nadab and Abihu",
      "Gershom and Eliezer"
    ],
    "optionsTelugu": [
      "జ్యేష్ఠుడైన యోవేలు మరియు రెండవవాడైన అబీయా",
      "హొఫ్నీ మరియు ఫీనెహాసు",
      "నాదాబు మరియు అబీహు",
      "గెర్షోము మరియు ఎలీయెజెరు"
    ],
    "correctAnswer": "Joel the firstborn and Abijah the second",
    "bibleReference": "1 Samuel 8:2",
    "explanation": "The name of his firstborn was Joel, and the name of his second, Abijah; they were judges in Beersheba.",
    "explanationTelugu": "అతని జ్యేష్ఠకుమారుని పేరు యోవేలు, రెండవవాని పేరు అబీయా; వారు బెయేర్షెబాలో న్యాయాధిపతులుగా ఉండిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q33",
    "order": 3,
    "questionType": "single_choice",
    "question": "In 1 Samuel 22:1, to which refuge did David flee, where all his brothers and his entire father's household joined him?",
    "questionTelugu": "1 సమూయేలు 22:1 లో దావీదు తప్పించుకొనిపోయినప్పుడు అతని సహోదరులు మరియు అతని తండ్రి యింటివారందరు ఏ గుహలో అతనితో చేరిరి?",
    "options": [
      "The cave of Adullam",
      "The cave of Engedi",
      "The cave of Machpelah",
      "The stronghold of Masada"
    ],
    "optionsTelugu": [
      "అదుల్లాము గుహ",
      "ఏన్గెదీ గుహ",
      "మక్పేలా గుహ",
      "మసదా కోట"
    ],
    "correctAnswer": "The cave of Adullam",
    "bibleReference": "1 Samuel 22:1",
    "explanation": "David escaped to the cave of Adullam, and when his brothers and all his father's house heard of it, they went down there to him.",
    "explanationTelugu": "దావీదు అక్కడనుండి తప్పించుకొని అదుల్లాము గుహలోనికి పోయెను; అతని సహోదరులును అతని తండ్రి యింటివారందరును అది విని అక్కడనున్న అతనియొద్దకు వచ్చిరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q34",
    "order": 4,
    "questionType": "single_choice",
    "question": "In 1 Samuel 22:20, who was the single son of high priest Ahimelech who escaped Saul's massacre of the priests at Nob to find safety with David?",
    "questionTelugu": "1 సమూయేలు 22:20 లో నోబు పట్టణమందలి యాజకుల ఊచకోతనుండి తప్పించుకొని దావీదు యొద్దకు పారిపోయి వచ్చిన అహీమెలెకు ఏకైక కుమారుడు ఎవరు?",
    "options": [
      "Abiathar",
      "Zadok",
      "Ahimaaz",
      "Jonathan"
    ],
    "optionsTelugu": [
      "అబ్యాతారు",
      "సాదోకు",
      "అహీమయస్సు",
      "యోనాతాను"
    ],
    "correctAnswer": "Abiathar",
    "bibleReference": "1 Samuel 22:20",
    "explanation": "One of the sons of Ahimelech son of Ahitub, named Abiathar, escaped and fled after David.",
    "explanationTelugu": "అహీతూబు కుమారుడైన అహీమెలెకు కుమారులలో అబ్యాతారు అను ఒకడు తప్పించుకొని దావీదునొద్దకు పారిపోయెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q35",
    "order": 5,
    "questionType": "single_choice",
    "question": "In 2 Samuel 13:20, what comforting words did Absalom speak to his devastated sister Tamar before taking her to reside desolately in his house?",
    "questionTelugu": "2 సమూయేలు 13:20 లో అమ్నోను వలన అవమానింపబడిన తన సొంత సహోదరి తామారును ఓదార్చుటకు అబ్షాలోము పలికిన మాట ఏమిటి?",
    "options": [
      "\"Be quiet for now, my sister; he is your brother. Do not take this thing to heart.\"",
      "\"Flee immediately across the Jordan to Geshur\"",
      "\"Let us appeal to the high priest\"",
      "\"Weep loudly before King David's throne\""
    ],
    "optionsTelugu": [
      "\"నా సహోదరీ, ఇప్పుడేమియు మాట్లాడకుము; అతడు నీ సహోదరుడే గదా, ఈ సంగతిని నీ మనస్సున నుంచుకొనకుము\"",
      "\"వెంటనే యొర్దాను దాటి గెషూరునకు పారిపొమ్ము\"",
      "\"ప్రధాన యాజకుని యొద్దకు వెళ్తాము\"",
      "\"దావీదు సింహాసనము ఎదుట బిగ్గరగా ఏడువుము\""
    ],
    "correctAnswer": "\"Be quiet for now, my sister; he is your brother. Do not take this thing to heart.\"",
    "bibleReference": "2 Samuel 13:20",
    "explanation": "Absalom her brother said to her: 'Has Amnon your brother been with you? Be quiet now, my sister; he is your brother. Do not take this matter to heart.'",
    "explanationTelugu": "ఆమె సహోదరుడైన అబ్షాలోము: నా సహోదరీ, ఊరకుండుము; అతడు నీ సహోదరుడు, ఈ సంగతి మనస్సులో పెట్టుకొనకుము అని చెప్పి ఆమెను తన యింట దిక్కులేనిదానిగా ఉంచెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q36",
    "order": 1,
    "questionType": "single_choice",
    "question": "In 2 Samuel 14:2, to which town did Joab send to recruit a wise woman to present a simulated family inheritance grievance before David?",
    "questionTelugu": "2 సమూయేలు 14:2 లో అబ్షాలోమును తిరిగి రప్పించుటకు దావీదు ఎదుట కల్పిత కుటుంబ కథను చెప్పుటకు యోవాబు ఏ ఊరినుండి జ్ఞానముగల స్త్రీని పిలిపించెను?",
    "options": [
      "Tekoa",
      "Bethlehem",
      "Shiloh",
      "Hebron"
    ],
    "optionsTelugu": [
      "తెకోవ",
      "బేత్లెహేము",
      "షీలోహు",
      "హెబ్రోను"
    ],
    "correctAnswer": "Tekoa",
    "bibleReference": "2 Samuel 14:2",
    "explanation": "Joab sent to Tekoa and brought from there a wise woman and said to her, 'Pretend to be a mourner.'",
    "explanationTelugu": "యోవాబు తెకోవాకు దూతలను పంపి అక్కడనుండి ఒక జ్ఞానముగల స్త్రీని పిలిపించి: నీవు దుఃఖించుదానివలె నటింపుము అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q37",
    "order": 2,
    "questionType": "single_choice",
    "question": "In 1 Kings 1:6, what parental failure of David toward his ambitious fourth son Adonijah is specifically highlighted by Scripture?",
    "questionTelugu": "1 రాజులు 1:6 లో దావీదు తన నాల్గవ కుమారుడైన అదోనీయా విషయములో చేసిన ఏ పెంపకపు లోపమును బైబిలు ప్రత్యేకముగా ఎత్తిచూపినది?",
    "options": [
      "His father had never at any time displeased him by asking: 'Why have you done so?'",
      "He never gave him land in Judah",
      "He never invited him to royal banquets",
      "He failed to teach him the Mosaic law"
    ],
    "optionsTelugu": [
      "అతని తండ్రి ఎన్నడును: నీవెందుకు ఈలాగు చేసితివని అతని నొప్పించి అడుగలేదు",
      "యూదాలో అతనికి భూమి ఇవ్వలేదు",
      "రాజవిందులకు పిలువలేదు",
      "మోషే ధర్మశాస్త్రమును నేర్పలేదు"
    ],
    "correctAnswer": "His father had never at any time displeased him by asking: 'Why have you done so?'",
    "bibleReference": "1 Kings 1:6",
    "explanation": "His father had never at any time displeased him by asking, 'Why have you done so?' He was also very handsome, born next after Absalom.",
    "explanationTelugu": "అతని తండ్రి: నీవెందుకు ఈలాగు చేసితివని ఎన్నడును అతని నొప్పించి అడుగలేదు; అతడు మిక్కిలి సౌందర్యవంతుడై అబ్షాలోము తరువాత పుట్టినవాడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q38",
    "order": 3,
    "questionType": "single_choice",
    "question": "In 1 Kings 2:19, what royal deference did King Solomon demonstrate when his mother Bathsheba entered to speak with him?",
    "questionTelugu": "1 రాజులు 2:19 లో తన తల్లియైన బత్షెబ తనతో మాట్లాడుటకు వచ్చినప్పుడు సొలొమోను రాజు చూపిన గౌరవాదరణ ఏమిటి?",
    "options": [
      "The king rose to meet her, bowed down to her, and sat on his throne with a seat brought for the king's mother at his right hand",
      "He sent his soldiers to escort her out",
      "He remained seated while she prostrated",
      "He gave her a royal seal of ivory"
    ],
    "optionsTelugu": [
      "రాజు ఆమెను ఎదుర్కొనుటకు లేచి సాగిలపడి, తన కుడిపార్శ్వమందు ఆమె కొరకు సింహాసనము వేయించి కూర్చుండబెట్టెను",
      "సైనికులను పంపి వెళ్లగొట్టెను",
      "తాను కూర్చుండియే ఉండెను",
      "దంతపు ముద్రను ఇచ్చెను"
    ],
    "correctAnswer": "The king rose to meet her, bowed down to her, and sat on his throne with a seat brought for the king's mother at his right hand",
    "bibleReference": "1 Kings 2:19",
    "explanation": "Solomon rose up to meet his mother, bowed down to her, sat on his throne, and had a throne set for the king's mother at his right hand.",
    "explanationTelugu": "రాజు ఆమెను ఎదుర్కొనుటకు లేచి ఆమెకు వందనము చేసి తన సింహాసనముమీద కూర్చుండి, రాజు తల్లికొరకు ఒక సింహాసనము తెప్పించెను; ఆమె అతని కుడిపార్శ్వమున కూర్చుండెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q39",
    "order": 4,
    "questionType": "single_choice",
    "question": "In 1 Kings 3:26, how did King Solomon identify the true biological mother of the living infant?",
    "questionTelugu": "1 రాజులు 3:26 లో జీవముగల బిడ్డకు అసలైన కన్నతల్లిని సొలొమోను రాజు ఏ హృదయ భావము ద్వారా గుర్తించెను?",
    "options": [
      "Her heart yearned with deep compassion for her son, so she said: 'Give her the living child, do not kill him!'",
      "She offered ten shekels of gold",
      "She recited the child's exact birthmark",
      "She produced a legal witness from the market"
    ],
    "optionsTelugu": [
      "తన బిడ్డ విషయమై ఆమె పేగులు తరుక్కుపోయినందున: అయ్యా, జీవముగల ఆ బిడ్డను ఆమెకే ఇమ్ము, చంపవద్దని మొఱ్ఱపెట్టెను",
      "పది తులముల బంగారము సమర్పించెను",
      "పుట్టుమచ్చను చూపించెను",
      "అంగడినుండి సాక్షిని తెచ్చెను"
    ],
    "correctAnswer": "Her heart yearned with deep compassion for her son, so she said: 'Give her the living child, do not kill him!'",
    "bibleReference": "1 Kings 3:26",
    "explanation": "The woman whose son was alive spoke to the king, for her heart yearned over her son: 'O my lord, give her the living child, and by no means slay it.'",
    "explanationTelugu": "జీవముగల బిడ్డ తల్లి తన బిడ్డమీద పేగులు తరుక్కుపోగా రాజుతో: నా యేలినవాడా, జీవముగల ఆ బిడ్డను ఆమెకే ఇమ్ము, దానిని చంపవద్దనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q40",
    "order": 5,
    "questionType": "single_choice",
    "question": "In 1 Chronicles 3:1-9, which sister is specially recorded along with the sons of David born to his wives in Jerusalem?",
    "questionTelugu": "1 దినవృత్తాంతములు 3:1-9 లో దావీదు కుమారులందరి వంశావళి ముగింపులో ప్రత్యేకముగా పేరు పేర్కొనబడిన వారి సహోదరి ఎవరు?",
    "options": [
      "Tamar",
      "Michal",
      "Abigail",
      "Zeruiah"
    ],
    "optionsTelugu": [
      "తామారు",
      "మీకాలు",
      "అబీగయీలు",
      "సెరూయా"
    ],
    "correctAnswer": "Tamar",
    "bibleReference": "1 Chronicles 3:9",
    "explanation": "All these were the sons of David, besides the sons of the concubines, and Tamar was their sister.",
    "explanationTelugu": "ఉపపత్నుల కుమారులు గాక వీరందరును దావీదు కుమారులు; తామారు వీరి సహోదరి.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q41",
    "order": 1,
    "questionType": "single_choice",
    "question": "In 1 Kings 17:18, what sorrowful accusation did the widow of Zarephath make to Elijah when her only son fell mortally sick?",
    "questionTelugu": "1 రాజులు 17:18 లో తన కుమారుడు జబ్బుపడి చనిపోయినప్పుడు సారెపతు విధవరాలు ఏల్యాపై పలికిన వేదనకరమైన మాట ఏమిటి?",
    "options": [
      "\"What have I to do with you, O man of God? Have you come to bring my sin to remembrance and slay my son?\"",
      "\"You have stolen my remaining oil\"",
      "\"The prophets of Baal were more merciful than you\"",
      "\"You have brought famine into Phoenicia\""
    ],
    "optionsTelugu": [
      "\"దైవజనుడా, నాతో నీకేమి పని? నా పాపమును జ్ఞాపకము చేసి నా కుమారుని చంపుటకు నా యొద్దకు వచ్చితివా?\"",
      "\"నా మిగిలిన నూనెను దొంగిలించితివి\"",
      "\"బయలు ప్రవక్తలు నీకంటే దయగలవారు\"",
      "\"ఫీనికే దేశమునకు కరవు తెచ్చితివి\""
    ],
    "correctAnswer": "\"What have I to do with you, O man of God? Have you come to bring my sin to remembrance and slay my son?\"",
    "bibleReference": "1 Kings 17:18",
    "explanation": "She said to Elijah: 'What have I to do with you, O man of God? Are you come unto me to call my sin to remembrance, and to slay my son?'",
    "explanationTelugu": "ఆమె ఏలీయాతో: దైవజనుడా, నాతో నీకేమి పని? నా పాపమును జ్ఞాపకము చేసి నా కుమారుని చంపుటకు నా యొద్దకు వచ్చితివా అని అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q42",
    "order": 2,
    "questionType": "single_choice",
    "question": "In 2 Kings 4:9-10, what hospitable home addition did the noble Shunammite woman and her husband build for Elisha?",
    "questionTelugu": "2 రాజులు 4:9-10 లో షూనేమీయురాలైన స్త్రీ తన భర్తతో మాట్లాడి ఎలీషా కొరకు తమ మిద్దెపై సిద్ధపరచిన గదిలో ఏయే వస్తువులు ఉంచిరి?",
    "options": [
      "A small upper room with a bed, a table, a chair, and a lampstand",
      "A large hall with golden vessels",
      "A stone altar and courtyard tent",
      "A stable with fine horses"
    ],
    "optionsTelugu": [
      "ఒక మంచము, బల్ల, పీట, దీపస్తంభము గల చిన్న మేడగది",
      "బంగారు పాత్రలుగల విశాలమైన మందిరము",
      "రాతి బలిపీఠము మరియు గుడారము",
      "గుఱ్ఱాల సాల"
    ],
    "correctAnswer": "A small upper room with a bed, a table, a chair, and a lampstand",
    "bibleReference": "2 Kings 4:10",
    "explanation": "She urged her husband: 'Let us make a small upper room on the roof, and put there for him a bed, a table, a stool, and a candlestick.'",
    "explanationTelugu": "ఆమె: మనము గోడమీద చిన్న మేడగది కట్టించి, అందులో అతనికొరకు మంచమును బల్లను పీటను దీపస్తంభమును ఉంచుదము అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q43",
    "order": 3,
    "questionType": "single_choice",
    "question": "In 2 Chronicles 11:21, which wife did King Rehoboam love above all his eighteen wives and sixty concubines?",
    "questionTelugu": "2 దినవృత్తాంతములు 11:21 ప్రకారం రెహబాము రాజు తన పదునెనిమిదిమంది భార్యలు, అరవైమంది ఉపపత్నులందరికంటే ఎవరిని ఎక్కువగా ప్రేమించెను?",
    "options": [
      "Maacah the daughter (granddaughter) of Absalom",
      "Mahalath daughter of Jerimoth",
      "Abihail daughter of Eliab",
      "Naamah the Ammonitess"
    ],
    "optionsTelugu": [
      "అబ్షాలోము కుమార్తెయైన మయకా",
      "యెరీమోతు కుమార్తెయైన మహలతు",
      "ఎలీయాబు కుమార్తెయైన అబీహాయిలు",
      "అమ్మోనీయురాలైన నయమా"
    ],
    "correctAnswer": "Maacah the daughter (granddaughter) of Absalom",
    "bibleReference": "2 Chronicles 11:21",
    "explanation": "Rehoboam loved Maacah the daughter of Absalom above all his wives and his concubines.",
    "explanationTelugu": "రెహబాము తన భార్యలందరిలోను ఉపపత్నులందరిలోను అబ్షాలోము కుమార్తెయైన మయకాను మిక్కిలి ప్రేమించెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q44",
    "order": 4,
    "questionType": "single_choice",
    "question": "In Esther 2:7, what was the family adoption background of Hadassah (Esther) raised by Mordecai?",
    "questionTelugu": "ఎస్తేరు 2:7 లో మొర్దెకై పెంచి పెద్దచేసిన హదస్సా (ఎస్తేరు) యొక్క కుటుంబ పెంపకపు నేపథ్యము ఏమిటి?",
    "options": [
      "She was his uncle's daughter, an orphan with neither father nor mother, adopted as his own daughter",
      "She was his biological younger sister",
      "She was his niece from Babylon",
      "She was a rescued captive servant"
    ],
    "optionsTelugu": [
      "ఆమె అతని పినతండ్రి కుమార్తె; ఆమెకు తలిదండ్రులు లేనందున ఆమెను తన సొంత కుమార్తెగా పెంచుకొనెను",
      "అతని సొంత చెల్లెలు",
      "బబులోనునుండి వచ్చిన మేనకోడలు",
      "చెరనుండి విడిపించిన దాసి"
    ],
    "correctAnswer": "She was his uncle's daughter, an orphan with neither father nor mother, adopted as his own daughter",
    "bibleReference": "Esther 2:7",
    "explanation": "Mordecai brought up Hadassah, that is Esther, his uncle's daughter; for she had neither father nor mother, and he took her as his own daughter.",
    "explanationTelugu": "మొర్దెకై తన పినతండ్రి కుమార్తెయైన హదస్సాను పెంచుచుండెను, ఆమెయే ఎస్తేరు; ఆమె తలిదండ్రులు చనిపోగా మొర్దెకై ఆమెను తన సొంత కుమార్తెగా పెంచుకొనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q45",
    "order": 5,
    "questionType": "single_choice",
    "question": "In Malachi 4:6, what ultimate intergenerational reconciliation is prophesied before the coming of the great and dreadful day of the Lord?",
    "questionTelugu": "మలాకీ 4:6 లో యెహోవా యొక్క భయంకరమైన మహాదినము రాకమునుపు కుటుంబాలలో నెరవేరబోవు ఏ అనుసంధానము ప్రవచించబడెను?",
    "options": [
      "\"He will turn the hearts of the fathers to their children, and the hearts of the children to their fathers\"",
      "\"He will divide nations into twelve tribes\"",
      "\"He will rebuild the walls of ancient Babylon\"",
      "\"He will crown kings with double diadems\""
    ],
    "optionsTelugu": [
      "\"ఆయన తండ్రుల హృదయములను పిల్లలతట్టును, పిల్లల హృదయములను తండ్రులతట్టును త్రిప్పును\"",
      "\"జాతులను పండ్రెండు గోత్రాలుగా విభజించును\"",
      "\"బబులోను ప్రాకారాలను తిరిగి కట్టును\"",
      "\"రాజులకు రెండంతల కిరీటములను ధరింపజేయును\""
    ],
    "correctAnswer": "\"He will turn the hearts of the fathers to their children, and the hearts of the children to their fathers\"",
    "bibleReference": "Malachi 4:6",
    "explanation": "He shall turn the heart of the fathers to the children, and the heart of the children to their fathers, lest I come and strike the earth with a curse.",
    "explanationTelugu": "నేను వచ్చి భూమిని శపించకుండునట్లు అతడు తండ్రుల హృదయములను పిల్లలతట్టును పిల్లల హృదయములను తండ్రులతట్టును త్రిప్పును.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q46",
    "order": 1,
    "questionType": "single_choice",
    "question": "In Matthew 10:37, what radical priority of devotion to Christ above family does Jesus declare?",
    "questionTelugu": "మత్తయి 10:37 లో కుటుంబ ప్రేమకంటే క్రీస్తుపై భక్తికి ఉండవలసిన ప్రాధాన్యతను గూర్చి యేసు ఏమని సెలవిచ్చెను?",
    "options": [
      "\"Whoever loves father or mother more than Me is not worthy of Me, and whoever loves son or daughter more than Me is not worthy of Me\"",
      "\"Fathers must abandon their households\"",
      "\"Families must not gather for worship\"",
      "\"Parents have no authority over children\""
    ],
    "optionsTelugu": [
      "\"తండ్రినైనను తల్లినైనను నాకంటే ఎక్కువగా ప్రేమించువాడు నాకు పాత్రుడు కాడు; కుమారునైనను కుమార్తెనైనను నాకంటే ఎక్కువగా ప్రేమించువాడు నాకు పాత్రుడు కాడు\"",
      "\"తండ్రులు తమ ఇండ్లను విడిచిపెట్టాలి\"",
      "\"కుటుంబాలు ఆరాధనకు రాకూడదు\"",
      "\"పిల్లలపై తలిదండ్రులకు అధికారము లేదు\""
    ],
    "correctAnswer": "\"Whoever loves father or mother more than Me is not worthy of Me, and whoever loves son or daughter more than Me is not worthy of Me\"",
    "bibleReference": "Matthew 10:37",
    "explanation": "Jesus declared: 'He who loves father or mother more than Me is not worthy of Me. And he who loves son or daughter more than Me is not worthy of Me.'",
    "explanationTelugu": "తండ్రినైనను తల్లినైనను నాకంటే ఎక్కువగా ప్రేమించువాడు నాకు పాత్రుడు కాడు; కుమారునైనను కుమార్తెనైనను నాకంటే ఎక్కువగా ప్రేమించువాడు నాకు పాత్రుడు కాడు.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q47",
    "order": 2,
    "questionType": "single_choice",
    "question": "In Luke 2:48-49, how did twelve-year-old Jesus answer His anxious earthly parents when found in the Jerusalem temple?",
    "questionTelugu": "లూకా 2:48-49 లో యెరూషలేము దేవాలయములో కనబడిన పన్నెండేండ్ల యేసు తనను వెదకిన తల్లిదండ్రులకు ఏమని సమాధానమిచ్చెను?",
    "options": [
      "\"Why did you seek Me? Did you not know that I must be about My Father's business?\"",
      "\"I had forgotten the way home to Nazareth\"",
      "\"The teachers of the law commanded me to stay\"",
      "\"I will never return to Galilee\""
    ],
    "optionsTelugu": [
      "\"మీరెందుకు నన్ను వెదకుచుంటిరి? నేను నా తండ్రి పనులమీద ఉండవలెనని మీరెరుగరా?\"",
      "\"నజరేతుకు పోవు దారిని మరచితిని\"",
      "\"బోధకులు నన్ను ఉండమన్నారు\"",
      "\"నేను గలిలయకు ఎన్నడూ రాను\""
    ],
    "correctAnswer": "\"Why did you seek Me? Did you not know that I must be about My Father's business?\"",
    "bibleReference": "Luke 2:49",
    "explanation": "Jesus said to them, 'Why were you looking for Me? Did you not know that I must be in My Father's house (about My Father's business)?'",
    "explanationTelugu": "ఆయన: మీరెందుకు నన్ను వెదకుచుంటిరి? నేను నా తండ్రి పనులమీద ఉండవలెనని మీరెరుగరా అని వారితో అనెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q48",
    "order": 3,
    "questionType": "single_choice",
    "question": "In Luke 15:31, what loving reassurance did the father speak to the resentful older son in the parable of the prodigal?",
    "questionTelugu": "లూకా 15:31 లో తప్పిపోయిన కుమారుని ఉపమానములో కోపగించుకొనిన పెద్ద కుమారునితో తండ్రి పలికిన ప్రేమపూర్వకమైన భరోసా ఏమిటి?",
    "options": [
      "\"Son, you are always with me, and all that I have is yours\"",
      "\"You have failed as the firstborn\"",
      "\"Your younger brother shall inherit your field\"",
      "\"Depart from my feast outside\""
    ],
    "optionsTelugu": [
      "\"కుమారుడా, నీవు ఎల్లప్పుడును నాతోనే ఉన్నావు, నాదంతయు నీదే\"",
      "\"జ్యేష్ఠునిగా నీవు ఓడిపోతివి\"",
      "\"నీ తమ్ముడు నీ పొలమును పంచుకొనును\"",
      "\"నా విందు విడిచి బయటికి పొమ్ము\""
    ],
    "correctAnswer": "\"Son, you are always with me, and all that I have is yours\"",
    "bibleReference": "Luke 15:31",
    "explanation": "The father said to him: 'Son, you are always with me, and all that is mine is yours. It was fitting to celebrate and be glad.'",
    "explanationTelugu": "అందుకు తండ్రి: కుమారుడా, నీవు ఎల్లప్పుడును నాతోనే ఉన్నావు, నాదంతయు నీదే; అయితే ఈ నీ తమ్ముడు చనిపోయి మరల బ్రదికెను గనుక సంతోషపడవలెననెను.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q49",
    "order": 4,
    "questionType": "single_choice",
    "question": "According to John 7:3-5, how did Jesus' biological brothers regard His ministry prior to the resurrection?",
    "questionTelugu": "యోహాను 7:3-5 ప్రకారం పునరుత్థానమునకు ముందుగా యేసు యొక్క స్వంత సహోదరులు ఆయన పరిచర్యను ఎలా చూచిరి?",
    "options": [
      "For even His brothers did not believe in Him",
      "They were His most faithful disciples",
      "They financed His journeys throughout Galilee",
      "They preached alongside the seventy apostles"
    ],
    "optionsTelugu": [
      "ఆయన సహోదరులైనను ఆయనయందు విశ్వాసముంచలేదు",
      "వారే ఆయన మిక్కిలి నమ్మకమైన శిష్యులు",
      "గలిలయ అంతటా ఆయన ప్రయాణ ఖర్చులు భరించిరి",
      "డెబ్బదిమంది శిష్యులతో కలసి బోధించిరి"
    ],
    "correctAnswer": "For even His brothers did not believe in Him",
    "bibleReference": "John 7:5",
    "explanation": "Scripture states plainly: 'For even His brothers did not believe in Him.'",
    "explanationTelugu": "ఆయన సహోదరులైనను ఆయనయందు విశ్వాసముంచలేదు అని లేఖనము స్పష్టముగా సెలవిచ్చుచున్నది.",
    "marks": 1
  },
  {
    "id": "fam_h_s3_q50",
    "order": 5,
    "questionType": "single_choice",
    "question": "In 1 Corinthians 1:16, which specific household does the apostle Paul recall personally baptizing in Corinth?",
    "questionTelugu": "1 కొరింథీయులకు 1:16 లో కొరింథులో అపొస్తలుడైన పౌలు స్వయముగా బాప్తిస్మమిచ్చిన నిర్దిష్ట గృహము ఎవరిది?",
    "options": [
      "The household of Stephanas",
      "The household of Cornelius",
      "The household of the Philippian jailer",
      "The household of Lydia"
    ],
    "optionsTelugu": [
      "స్తెఫను ఇంటివారు",
      "కొర్నేలి ఇంటివారు",
      "ఫిలిప్పి బందిఖానా అధికారి ఇంటివారు",
      "లూదియ ఇంటివారు"
    ],
    "correctAnswer": "The household of Stephanas",
    "bibleReference": "1 Corinthians 1:16",
    "explanation": "Paul wrote: 'Yes, I also baptized the household of Stephanas; beyond that, I do not know whether I baptized any other.'",
    "explanationTelugu": "పౌలు: స్తెఫను ఇంటివారికిని నేను బాప్తిస్మమిచ్చితిని; ఇదియు గాక మరి ఎవరికైనను బాప్తిస్మమిచ్చితినో నేనెరుగను అనెను.",
    "marks": 1
  }
];

export const FAMILY_QUESTION_REGISTRY: Record<QuizDifficulty, StageQuestions> = {
  easy: {
    foundation: FAMILY_EASY_FOUNDATION,
    growth: FAMILY_EASY_GROWTH,
    mastery: FAMILY_EASY_MASTERY
  },
  medium: {
    foundation: FAMILY_MEDIUM_FOUNDATION,
    growth: FAMILY_MEDIUM_GROWTH,
    mastery: FAMILY_MEDIUM_MASTERY
  },
  hard: {
    foundation: FAMILY_HARD_FOUNDATION,
    growth: FAMILY_HARD_GROWTH,
    mastery: FAMILY_HARD_MASTERY
  }
};

/**
 * Returns the exact 50 unique questions for the given difficulty and stage (1: Foundation, 2: Growth, 3: Mastery)
 */
export function getFamilyStageQuestions(difficulty: QuizDifficulty, stage: 1 | 2 | 3): QuizQuestion[] {
  const diffKey = (difficulty || 'easy').toLowerCase() as QuizDifficulty;
  const stageMap = FAMILY_QUESTION_REGISTRY[diffKey] || FAMILY_QUESTION_REGISTRY.easy;
  if (stage === 1) return stageMap.foundation;
  if (stage === 2) return stageMap.growth;
  return stageMap.mastery;
}

/**
 * Returns the exact 5 unique questions for a specific level (1-30)
 * Level 1-10: Foundation (50 questions, 5 per level)
 * Level 11-20: Growth (50 questions, 5 per level)
 * Level 21-30: Mastery (50 questions, 5 per level)
 */
export function getFamilyLevelQuestions(difficulty: QuizDifficulty, level: number): QuizQuestion[] {
  const stage = level <= 10 ? 1 : level <= 20 ? 2 : 3;
  const stagePool = getFamilyStageQuestions(difficulty, stage);
  const offset = (level - 1) % 10;
  const startIndex = offset * 5;
  return stagePool.slice(startIndex, startIndex + 5);
}
