import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { QuizQuestion, QuizDifficulty, MemberCategoryProgress } from '../types/Quiz';
import { CategoryQuestionBank } from './quiz/CategoryQuestionBank';

export interface LevelQuizData {
  category: string;
  difficulty: QuizDifficulty;
  level: number;
  title: string;
  passPercentage: number;
  questions: QuizQuestion[];
}

// Curated Bible Question Bank for Categories
const SEED_QUESTIONS: Record<string, QuizQuestion[]> = {
  Family: [
    {
      id: 'fam_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Who was the first husband and wife created by God in Genesis?',
      questionTelugu: 'ఆదికాండములో దేవుడు సృష్టించిన మొదటి భార్యాభర్తలు ఎవరు?',
      options: ['Abraham and Sarah', 'Adam and Eve', 'Isaac and Rebekah', 'Noah and his wife'],
      optionsTelugu: ['అబ్రాహాము మరియు శారా', 'ఆదాము మరియు హవ్వ', 'ఇస్సాకు మరియు రిబ్కా', 'నోవహు మరియు ఆయన భార్య'],
      correctAnswer: 'Adam and Eve',
      bibleReference: 'Genesis 2:21-25',
      explanation: 'God created Adam first and then created Eve as his helper and wife.',
      explanationTelugu: 'దేవుడు మొదట ఆదామును సృష్టించి, ఆ తరువాత అతనికి సాటియైన సహాయకారిగా మరియు భార్యగా హవ్వను చేసెను.',
      marks: 1,
    },
    {
      id: 'fam_2',
      order: 2,
      questionType: 'single_choice',
      question: 'Which commandment is the first with a promise: "Honor your father and your mother"?',
      questionTelugu: '"నీ తండ్రిని నీ తల్లిని సన్మానించుము" అనే వాగ్దానముతో కూడిన మొదటి ఆజ్ఞ ఏది?',
      options: ['Third Commandment', 'Fifth Commandment', 'Seventh Commandment', 'Tenth Commandment'],
      optionsTelugu: ['మూడవ ఆజ్ఞ', 'ఐదవ ఆజ్ఞ', 'ఏడవ ఆజ్ఞ', 'పదవ ఆజ్ఞ'],
      correctAnswer: 'Fifth Commandment',
      bibleReference: 'Exodus 20:12',
      explanation: 'Exodus 20:12 commands us to honor our parents so our days may be long.',
      explanationTelugu: 'నిర్గమకాండము 20:12 ప్రకారం, తల్లిదండ్రులను సన్మానించినప్పుడు దీర్ఘాయుష్షు లభిస్తుందని దేవుడు వాగ్దానం చేసెను.',
      marks: 1,
    },
    {
      id: 'fam_3',
      order: 3,
      questionType: 'single_choice',
      question: 'Who gave his son Joseph a special coat of many colors?',
      questionTelugu: 'తన కుమారుడైన యోసేపుకు రంగురంగుల నిలువుటంగీని బహుమతిగా ఇచ్చిన తండ్రి ఎవరు?',
      options: ['Abraham', 'Isaac', 'Jacob (Israel)', 'Jesse'],
      optionsTelugu: ['అబ్రాహాము', 'ఇస్సాకు', 'యాకోబు (ఇశ్రాయేలు)', 'యెష్షయి'],
      correctAnswer: 'Jacob (Israel)',
      bibleReference: 'Genesis 37:3',
      explanation: 'Israel loved Joseph more than any of his other children and made him a richly ornamented robe.',
      explanationTelugu: 'ఇశ్రాయేలు తన ఇతర కుమారులకంటె యోసేపును ఎక్కువగా ప్రేమించి, అతనికి విచిత్రమైన రంగురంగుల నిలువుటంగీని కుట్టించెను.',
      marks: 1,
    },
    {
      id: 'fam_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Which mother-in-law and daughter-in-law pair showed deep family loyalty in the Bible?',
      questionTelugu: 'బైబిల్లో గొప్ప కుటుంబ విశ్వాసమును కనబరిచిన అత్తాకోడళ్ల జంట ఎవరు?',
      options: ['Naomi and Ruth', 'Elizabeth and Mary', 'Sarah and Hagar', 'Leah and Rachel'],
      optionsTelugu: ['నయోమి మరియు రూతు', 'ఎలీసబెతు మరియు మరియ', 'శారా మరియు హాగరు', 'లేయా మరియు రాహేలు'],
      correctAnswer: 'Naomi and Ruth',
      bibleReference: 'Ruth 1:16-17',
      explanation: 'Ruth declared: "Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God."',
      explanationTelugu: 'రూతు తన అత్తతో: "నీవు వెళ్ళుచోటికి నేను వచ్చెదను, నీ జనమే నా జనము, నీ దేవుడే నా దేవుడు" అని నిష్కల్మషమైన ప్రేమతో పలికెను.',
      marks: 1,
    },
    {
      id: 'fam_5',
      order: 5,
      questionType: 'single_choice',
      question: 'Who said: "As for me and my household, we will serve the Lord"?',
      questionTelugu: '"నేనును నా యింటివారును యెహోవాను సేవించెదము" అని నిశ్చయముగా పలికిన నాయకుడు ఎవరు?',
      options: ['Moses', 'Joshua', 'David', 'Solomon'],
      optionsTelugu: ['మోషే', 'యెహోషువ', 'దావీదు', 'సొలొమోను'],
      correctAnswer: 'Joshua',
      bibleReference: 'Joshua 24:15',
      explanation: 'Joshua made this famous declaration before all the tribes of Israel.',
      explanationTelugu: 'యెహోషువ ఇశ్రాయేలు గోత్రములన్నిటి యెదుట దేవుని మాత్రమే సేవిస్తానని ధైర్యముగా తీర్మానించెను.',
      marks: 1,
    },
  ],
  Friends: [
    {
      id: 'frn_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Who were the two famous biblical friends whose souls were "knit together"?',
      questionTelugu: 'బైబిల్లో ప్రాణస్నేహితులుగా ప్రాణములు ఒకటిగా అల్లబడిన స్నేహితుల జంట ఎవరు?',
      options: ['David and Jonathan', 'Peter and John', 'Paul and Silas', 'Moses and Aaron'],
      optionsTelugu: ['దావీదు మరియు యోనాతాను', 'పేతురు మరియు యోహాను', 'పౌలు మరియు సీల', 'మోషే మరియు అహరోను'],
      correctAnswer: 'David and Jonathan',
      bibleReference: '1 Samuel 18:1',
      explanation: 'Jonathan loved David as his own soul, demonstrating one of the greatest friendships in Scripture.',
      marks: 1,
    },
    {
      id: 'frn_2',
      order: 2,
      questionType: 'single_choice',
      question: 'Jesus said: "Greater love has no one than this: to lay down one\'s life for one\'s ______."',
      questionTelugu: 'యేసు ప్రభువు చెప్పారు: "తన ______ కొరకు తన ప్రాణము పెట్టువానికంటె ఎక్కువైన ప్రేమగలవాడెవడును లేడు."',
      options: ['Family', 'Friends', 'Teachers', 'Neighbors'],
      optionsTelugu: ['కుటుంబం', 'స్నేహితులు', 'బోధకులు', 'పొరుగువారు'],
      correctAnswer: 'Friends',
      bibleReference: 'John 15:13',
      explanation: 'Jesus taught that the greatest demonstration of love is sacrificing one’s life for friends.',
      marks: 1,
    },
    {
      id: 'frn_3',
      order: 3,
      questionType: 'single_choice',
      question: 'According to Proverbs 17:17, when does a friend love?',
      questionTelugu: 'సామెతలు 17:17 ప్రకారం, నిజమైన స్నేహితుడు ఎప్పుడు ప్రేమిస్తాడు?',
      options: ['Only in good times', 'At all times', 'When asked', 'When it is easy'],
      optionsTelugu: ['మంచి సమయాల్లో మాత్రమే', 'నిజమైన స్నేహితుడు విడువక ప్రేమించును', 'అడిగినప్పుడు మాత్రమే', 'సులభమైన సమయాల్లో'],
      correctAnswer: 'At all times',
      bibleReference: 'Proverbs 17:17',
      explanation: '"A friend loves at all times, and a brother is born for a time of adversity."',
      marks: 1,
    },
    {
      id: 'frn_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Who was called the "friend of God" in the Bible?',
      questionTelugu: 'బైబిల్లో "దేవుని స్నేహితుడు" అని పిలువబడిన భక్తుడు ఎవరు?',
      options: ['Moses', 'Abraham', 'Elijah', 'Noah'],
      optionsTelugu: ['మోషే', 'అబ్రాహాము', 'ఏలీయా', 'నోవహు'],
      correctAnswer: 'Abraham',
      bibleReference: 'James 2:23',
      explanation: 'Abraham believed God, and it was credited to him as righteousness, and he was called God’s friend.',
      marks: 1,
    },
    {
      id: 'frn_5',
      order: 5,
      questionType: 'single_choice',
      question: 'Which three friends were thrown into the fiery furnace together for refusing to bow to an idol?',
      questionTelugu: 'విగ్రహానికి సాష్టాంగపడటానికి నిరాకరించి అగ్నిగుండములో వేయబడిన ముగ్గురు స్నేహితులు ఎవరు?',
      options: ['Peter, James, and John', 'Shadrach, Meshach, and Abednego', 'Paul, Silas, and Timothy', 'Shem, Ham, and Japheth'],
      optionsTelugu: ['పేతురు, యాకోబు, యోహాను', 'షద్రకు, మేషకు, అబేద్నెగో', 'పౌలు, సీల, తిమోతి', 'షేము, హాము, యాపేతు'],
      correctAnswer: 'Shadrach, Meshach, and Abednego',
      bibleReference: 'Daniel 3:16-20',
      explanation: 'These three faithful friends stood firm together in faith in Babylon.',
      marks: 1,
    },
  ],
  Mother: [
    {
      id: 'mth_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Who was the earthly mother of Jesus Christ?',
      questionTelugu: 'యేసుక్రీస్తు శరీరధారియైన భూలోక తల్లి ఎవరు?',
      options: ['Mary', 'Martha', 'Elizabeth', 'Salome'],
      optionsTelugu: ['కన్యక మరియ', 'మార్త', 'ఎలీసబెతు', 'సలోమే'],
      correctAnswer: 'Mary',
      bibleReference: 'Luke 1:30-31',
      explanation: 'The angel Gabriel appeared to Mary and announced she would give birth to Jesus.',
      marks: 1,
    },
    {
      id: 'mth_2',
      order: 2,
      questionType: 'single_choice',
      question: 'Which mother prayed deeply at the tabernacle for a son and named him Samuel?',
      questionTelugu: 'దేవుని మందిరములో కన్నీటితో ప్రార్థించి కుమారుని పొంది సమూయేలు అని పేరుపెట్టిన తల్లి ఎవరు?',
      options: ['Hannah', 'Peninnah', 'Rachel', 'Rebekah'],
      optionsTelugu: ['హన్నా', 'పెనిన్నా', 'రాహేలు', 'రిబ్కా'],
      correctAnswer: 'Hannah',
      bibleReference: '1 Samuel 1:20',
      explanation: 'Hannah wept and prayed to God for a child, and God blessed her with Samuel.',
      marks: 1,
    },
    {
      id: 'mth_3',
      order: 3,
      questionType: 'single_choice',
      question: 'Who gave birth to Isaac at the age of ninety?',
      questionTelugu: 'తొంభై ఏళ్ల వయస్సులో దేవుని వాగ్దాన కుమారుడైన ఇస్సాకును కన్నది ఎవరు?',
      options: ['Sarah', 'Hagar', 'Keturah', 'Leah'],
      optionsTelugu: ['శారా', 'హాగరు', 'కెతూరా', 'లేయా'],
      correctAnswer: 'Sarah',
      bibleReference: 'Genesis 21:1-3',
      explanation: 'God fulfilled His promise to Abraham and Sarah in their old age.',
      marks: 1,
    },
    {
      id: 'mth_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Who was the mother of John the Baptist and a relative of Mary?',
      questionTelugu: 'బాప్తిస్మమిచ్చు యోహాను తల్లి మరియు మరియ యొక్క బంధువు ఎవరు?',
      options: ['Elizabeth', 'Anna', 'Eunice', 'Lois'],
      optionsTelugu: ['ఎలీసబెతు', 'అన్నమ్మ', 'యునీకే', 'లోయిసు'],
      correctAnswer: 'Elizabeth',
      bibleReference: 'Luke 1:57-60',
      explanation: 'Elizabeth and Zechariah were blessed with John the Baptist in their old age.',
      marks: 1,
    },
    {
      id: 'mth_5',
      order: 5,
      questionType: 'single_choice',
      question: 'Which young man was taught the scriptures by his mother Eunice and grandmother Lois?',
      questionTelugu: 'తన తల్లి యునీకే మరియు అవ్వయైన లోయిసుల చేత చిన్ననాటి నుండి లేఖనములు నేర్పించబడిన శిష్యుడు ఎవరు?',
      options: ['Timothy', 'Titus', 'Barnabas', 'Mark'],
      optionsTelugu: ['తిమోతి', 'తీతు', 'బర్నబా', 'మార్కు'],
      correctAnswer: 'Timothy',
      bibleReference: '2 Timothy 1:5',
      explanation: 'Paul remembered the sincere faith that lived first in Timothy’s grandmother Lois and his mother Eunice.',
      marks: 1,
    },
  ],
  Father: [
    {
      id: 'fth_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Who was the earthly father / adoptive guardian of Jesus?',
      questionTelugu: 'యేసుక్రీస్తు యొక్క భూలోక తండ్రి / సంరక్షకుడు ఎవరు?',
      options: ['Joseph', 'Zechariah', 'Simeon', 'Nicodemus'],
      optionsTelugu: ['యోసేపు', 'జెకర్యా', 'షిమ్యోను', 'నికోదేము'],
      correctAnswer: 'Joseph',
      bibleReference: 'Matthew 1:19-21',
      explanation: 'Joseph of Nazareth was a righteous man who cared for Mary and baby Jesus.',
      marks: 1,
    },
    {
      id: 'fth_2',
      order: 2,
      questionType: 'single_choice',
      question: 'Who is called the "father of many nations" in the Bible?',
      questionTelugu: 'బైబిల్లో "అనేక జనములకు తండ్రి" అని పిలువబడిన పితృపాదుడు ఎవరు?',
      options: ['Abraham', 'Noah', 'Adam', 'Jacob'],
      optionsTelugu: ['అబ్రాహాము', 'నోవహు', 'ఆదాము', 'యాకోబు'],
      correctAnswer: 'Abraham',
      bibleReference: 'Genesis 17:4-5',
      explanation: 'God changed Abram’s name to Abraham, meaning "father of many nations."',
      marks: 1,
    },
    {
      id: 'fth_3',
      order: 3,
      questionType: 'single_choice',
      question: 'In Jesus’ parable of the Prodigal Son, how did the father react when the lost son returned?',
      questionTelugu: 'తప్పిపోయిన కుమారుని ఉపమానంలో, కుమారుడు తిరిగి వచ్చినప్పుడు తండ్రి ఎలా స్పందించెను?',
      options: [
        'He punished him severely',
        'He ran, hugged him, and celebrated',
        'He sent him to work with the servants',
        'He locked the gate',
      ],
      optionsTelugu: [
        'కఠినంగా శిక్షించెను',
        'పరుగెత్తుకొని పోయి, కౌగిలించుకొని విందు చేసెను',
        'జీతగాళ్ళతో కలిసి పనిచేయమని పంపెను',
        'ద్వారము మూసివేసెను',
      ],
      correctAnswer: 'He ran, hugged him, and celebrated',
      bibleReference: 'Luke 15:20-24',
      explanation: 'The father ran to meet him, threw his arms around him, and celebrated his return.',
      marks: 1,
    },
    {
      id: 'fth_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Who was the father of King Solomon, known as a man after God’s own heart?',
      questionTelugu: 'దేవుని హృదయానుసారుడైన భక్తుడిగా ప్రసిద్ధి చెందిన సొలొమోను రాజు తండ్రి ఎవరు?',
      options: ['King David', 'King Saul', 'Samuel', 'Jesse'],
      optionsTelugu: ['దావీదు రాజు', 'సౌలు రాజు', 'సమూయేలు', 'యెష్షయి'],
      correctAnswer: 'King David',
      bibleReference: '1 Kings 2:1-4',
      explanation: 'David charged his son Solomon to walk in obedience to God.',
      marks: 1,
    },
    {
      id: 'fth_5',
      order: 5,
      questionType: 'single_choice',
      question: 'What prayer did Jesus teach His disciples starting with "Our Father"?',
      questionTelugu: '"పరలోకమందున్న మా తండ్రీ" అని ప్రారంభమయ్యే ఏ ప్రార్థనను యేసు తన శిష్యులకు నేర్పించెను?',
      options: ['The Lord’s Prayer', 'The Shema', 'The Aaronic Blessing', 'The Benedictus'],
      optionsTelugu: ['ప్రభువు ప్రార్థన (పరలోక ప్రార్థన)', 'షెమా ప్రార్థన', 'యాజక ఆశీర్వాదం', 'బెనెడిక్టస్'],
      correctAnswer: 'The Lord’s Prayer',
      bibleReference: 'Matthew 6:9',
      explanation: 'Jesus taught us to pray: "Our Father in heaven, hallowed be your name."',
      marks: 1,
    },
  ],
  Love: [
    {
      id: 'lov_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Which famous Bible verse says: "For God so loved the world that He gave His one and only Son"?',
      questionTelugu: '"దేవుడు లోకమును ఎంతో ప్రేమించెను, కాగా ఆయన తన అద్వితీయకుమారునిగా ఇచ్చినను" అని ఏ వాక్యం తెలుపుతుంది?',
      options: ['Romans 8:28', 'John 3:16', '1 Corinthians 13:4', 'Psalm 23:1'],
      optionsTelugu: ['రోమీయులకు 8:28', 'యోహాను 3:16', '1 కొరింథీయులకు 13:4', 'కీర్తనలు 23:1'],
      correctAnswer: 'John 3:16',
      bibleReference: 'John 3:16',
      explanation: 'John 3:16 expresses God’s supreme love in sending Jesus Christ for our salvation.',
      marks: 1,
    },
    {
      id: 'lov_2',
      order: 2,
      questionType: 'single_choice',
      question: 'Which chapter in the New Testament is universally known as the "Love Chapter"?',
      questionTelugu: 'క్రొత్త నిబంధనలో "ప్రేమ అధ్యాయము" గా పిలువబడే విశిష్ట అధ్యాయము ఏది?',
      options: ['1 Corinthians 13', 'Romans 12', 'Hebrews 11', 'Ephesians 4'],
      optionsTelugu: ['1 కొరింథీయులకు 13', 'రోమీయులకు 12', 'హెబ్రీయులకు 11', 'ఎఫెసీయులకు 4'],
      correctAnswer: '1 Corinthians 13',
      bibleReference: '1 Corinthians 13:1-13',
      explanation: 'Paul details the characteristics of divine agape love in 1 Corinthians 13.',
      marks: 1,
    },
    {
      id: 'lov_3',
      order: 3,
      questionType: 'single_choice',
      question: 'What are the two greatest commandments Jesus gave regarding love?',
      questionTelugu: 'ప్రేమను గూర్చి యేసు ప్రభువు ఇచ్చిన రెండు ప్రధాన ఆజ్ఞలు ఏవి?',
      options: [
        'Love God and love your neighbor',
        'Love money and love work',
        'Love knowledge and love power',
        'Love rules and love rituals',
      ],
      optionsTelugu: [
        'దేవుని ప్రేమించుము మరియు పొరుగువాని ప్రేమించుము',
        'ధనమును ప్రేమించుము మరియు పనిని ప్రేమించుము',
        'జ్ఞానమును ప్రేమించుము మరియు అధికారమును ప్రేమించుము',
        'నిబంధనలను ప్రేమించుము మరియు ఆచారములను ప్రేమించుము',
      ],
      correctAnswer: 'Love God and love your neighbor',
      bibleReference: 'Matthew 22:37-39',
      explanation: 'Jesus stated that loving God with all your heart and loving your neighbor summarize the Law.',
      marks: 1,
    },
    {
      id: 'lov_4',
      order: 4,
      questionType: 'single_choice',
      question: 'According to 1 John 4:8, what is God?',
      questionTelugu: '1 యోహాను 4:8 ప్రకారం, దేవుడు ఎవరైయున్నాడు?',
      options: ['God is knowledge', 'God is love', 'God is mystery', 'God is power'],
      optionsTelugu: ['దేవుడు జ్ఞానమైయున్నాడు', 'దేవుడు ప్రేమాస్వరూపి', 'దేవుడు మర్మమైయున్నాడు', 'దేవుడు అధికారమైయున్నాడు'],
      correctAnswer: 'God is love',
      bibleReference: '1 John 4:8',
      explanation: '"Whoever does not love does not know God, because God is love."',
      marks: 1,
    },
    {
      id: 'lov_5',
      order: 5,
      questionType: 'single_choice',
      question: 'According to 1 Corinthians 13:13, what is the greatest of faith, hope, and love?',
      questionTelugu: '1 కొరింథీయులకు 13:13 ప్రకారం, విశ్వాసము, నిరీక్షణ, ప్రేమలలో అన్నిటికంటె శ్రేష్ఠమైనది ఏది?',
      options: ['Faith', 'Hope', 'Love', 'All are equal'],
      optionsTelugu: ['విశ్వాసము', 'నిరీక్షణ', 'ప్రేమ', 'అన్నీ సమానమే'],
      correctAnswer: 'Love',
      bibleReference: '1 Corinthians 13:13',
      explanation: '"And now these three remain: faith, hope and love. But the greatest of these is love."',
      marks: 1,
    },
  ],
  Hope: [
    {
      id: 'hop_1',
      order: 1,
      questionType: 'single_choice',
      question: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you ______."',
      options: ['Riches and gold', 'A hope and a future', 'Easy times', 'Fame'],
      correctAnswer: 'A hope and a future',
      bibleReference: 'Jeremiah 29:11',
      explanation: 'God promised the exiled Israelites a glorious hope and future.',
      marks: 1,
    },
    {
      id: 'hop_2',
      order: 2,
      questionType: 'single_choice',
      question: 'In Hebrews 6:19, what is our hope described as for our soul?',
      options: ['A shield', 'An anchor', 'A crown', 'A sword'],
      correctAnswer: 'An anchor',
      bibleReference: 'Hebrews 6:19',
      explanation: '"We have this hope as an anchor for the soul, firm and secure."',
      marks: 1,
    },
    {
      id: 'hop_3',
      order: 3,
      questionType: 'single_choice',
      question: 'Those who hope in the Lord will renew their strength and soar on wings like ______.',
      options: ['Doves', 'Eagles', 'Sparrows', 'Hawks'],
      correctAnswer: 'Eagles',
      bibleReference: 'Isaiah 40:31',
      explanation: 'Isaiah 40:31 promises that those who trust in the Lord will mount up with wings like eagles.',
      marks: 1,
    },
    {
      id: 'hop_4',
      order: 4,
      questionType: 'single_choice',
      question: 'According to Romans 5:5, why does hope not put us to shame?',
      options: [
        'Because we work hard',
        'Because God\'s love has been poured into our hearts',
        'Because of our good deeds',
        'Because we never fail',
      ],
      correctAnswer: 'Because God\'s love has been poured into our hearts',
      bibleReference: 'Romans 5:5',
      explanation: 'God’s love is poured into our hearts through the Holy Spirit.',
      marks: 1,
    },
    {
      id: 'hop_5',
      order: 5,
      questionType: 'single_choice',
      question: 'Who against all hope, in hope believed that he would become the father of many nations?',
      options: ['Abraham', 'David', 'Joseph', 'Peter'],
      correctAnswer: 'Abraham',
      bibleReference: 'Romans 4:18',
      explanation: 'Abraham anchored his trust in God’s promise even when circumstances seemed impossible.',
      marks: 1,
    },
  ],
  Failure: [
    {
      id: 'fai_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Which disciple denied Jesus three times, but was lovingly restored by Jesus and became a pillar of the early church?',
      options: ['Judas', 'Peter', 'Thomas', 'James'],
      correctAnswer: 'Peter',
      bibleReference: 'John 21:15-17',
      explanation: 'Peter wept bitterly after his denial, but the risen Jesus restored him three times by the sea of Galilee.',
      marks: 1,
    },
    {
      id: 'fai_2',
      order: 2,
      questionType: 'single_choice',
      question: 'Proverbs 24:16 says: "Though a righteous person falls ______ times, they rise again."',
      options: ['Three', 'Seven', 'Ten', 'Twelve'],
      correctAnswer: 'Seven',
      bibleReference: 'Proverbs 24:16',
      explanation: 'Scripture encourages believers that God lifts up the righteous even when they fall.',
      marks: 1,
    },
    {
      id: 'fai_3',
      order: 3,
      questionType: 'single_choice',
      question: 'Who ran away from God to Tarshish, was swallowed by a great fish, but was given a second chance?',
      options: ['Jonah', 'Elijah', 'Jeremiah', 'Hosea'],
      correctAnswer: 'Jonah',
      bibleReference: 'Jonah 1-3',
      explanation: 'God gave Jonah a second chance to preach to Nineveh after his failure and repentance.',
      marks: 1,
    },
    {
      id: 'fai_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Which king wrote Psalm 51 asking God for a clean heart after his deep failure?',
      options: ['King Saul', 'King David', 'King Solomon', 'King Hezekiah'],
      correctAnswer: 'King David',
      bibleReference: 'Psalm 51:10',
      explanation: 'David repented deeply before God: "Create in me a pure heart, O God."',
      marks: 1,
    },
    {
      id: 'fai_5',
      order: 5,
      questionType: 'single_choice',
      question: 'In 2 Corinthians 12:9, God told Paul: "My grace is sufficient for you, for My power is made perfect in ______."',
      options: ['Strength', 'Weakness', 'Victory', 'Wealth'],
      correctAnswer: 'Weakness',
      bibleReference: '2 Corinthians 12:9',
      explanation: 'God\'s supernatural power works mightily through human weakness.',
      marks: 1,
    },
  ],
  Fear: [
    {
      id: 'fea_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Which famous Psalm declares: "The Lord is my shepherd; I shall not want... Even though I walk through the valley of the shadow of death, I will fear no evil"?',
      options: ['Psalm 23', 'Psalm 91', 'Psalm 121', 'Psalm 46'],
      correctAnswer: 'Psalm 23',
      bibleReference: 'Psalm 23:1-4',
      explanation: 'David expresses complete trust in God the Shepherd amidst fear and danger.',
      marks: 1,
    },
    {
      id: 'fea_2',
      order: 2,
      questionType: 'single_choice',
      question: '"For God has not given us a spirit of fear, but of ______."',
      options: [
        'Doubt, worry, and pride',
        'Power, love, and a sound mind',
        'Silence and hiding',
        'Anger and judgment',
      ],
      correctAnswer: 'Power, love, and a sound mind',
      bibleReference: '2 Timothy 1:7',
      explanation: 'Paul reminds Timothy that the Spirit within believers is one of power, love, and self-control.',
      marks: 1,
    },
    {
      id: 'fea_3',
      order: 3,
      questionType: 'single_choice',
      question: 'What did Jesus say to the disciples when He walked on water in the storm and they were afraid?',
      options: [
        'Why did you look?',
        'Take courage! It is I. Don\'t be afraid.',
        'Swim back to the boat.',
        'Call the authorities.',
      ],
      correctAnswer: 'Take courage! It is I. Don\'t be afraid.',
      bibleReference: 'Matthew 14:27',
      explanation: 'Jesus brought immediate peace to their fearful hearts on the troubled sea.',
      marks: 1,
    },
    {
      id: 'fea_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Isaiah 41:10 says: "So do not fear, for I am with you; do not be dismayed, for ______."',
      options: [
        'I am your God',
        'Life will be easy',
        'The storms will vanish today',
        'People will praise you',
      ],
      correctAnswer: 'I am your God',
      bibleReference: 'Isaiah 41:10',
      explanation: 'God promises: "I will strengthen you and help you; I will uphold you with my righteous right hand."',
      marks: 1,
    },
    {
      id: 'fea_5',
      order: 5,
      questionType: 'single_choice',
      question: 'According to 1 John 4:18, what drives out fear?',
      options: ['Perfect love', 'Great wealth', 'Human courage', 'Armies'],
      correctAnswer: 'Perfect love',
      bibleReference: '1 John 4:18',
      explanation: '"There is no fear in love. But perfect love drives out fear."',
      marks: 1,
    },
  ],
  Peace: [
    {
      id: 'pea_1',
      order: 1,
      questionType: 'single_choice',
      question: 'What title is given to Jesus Christ in Isaiah 9:6?',
      options: ['King of Gold', 'Prince of Peace', 'Prophet of Fire', 'Lord of Storms'],
      correctAnswer: 'Prince of Peace',
      bibleReference: 'Isaiah 9:6',
      explanation: 'The Messiah is prophesied as "Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace."',
      marks: 1,
    },
    {
      id: 'pea_2',
      order: 2,
      questionType: 'single_choice',
      question: 'In John 14:27, Jesus said: "Peace I leave with you; my peace I give you. I do not give to you as the ______ gives."',
      options: ['Church', 'World', 'Pharisees', 'Kings'],
      correctAnswer: 'World',
      bibleReference: 'John 14:27',
      explanation: 'Jesus gives divine, lasting peace that surpasses the temporary peace of the world.',
      marks: 1,
    },
    {
      id: 'pea_3',
      order: 3,
      questionType: 'single_choice',
      question: 'Philippians 4:7 promises: "And the peace of God, which transcends all understanding, will guard your ______."',
      options: ['Money and house', 'Hearts and minds in Christ Jesus', 'Clothes and health', 'Reputation'],
      correctAnswer: 'Hearts and minds in Christ Jesus',
      bibleReference: 'Philippians 4:7',
      explanation: 'God’s peace stands as a fortress guarding the believer’s inner emotional and mental life.',
      marks: 1,
    },
    {
      id: 'pea_4',
      order: 4,
      questionType: 'single_choice',
      question: 'What did Jesus say to the raging storm on the Sea of Galilee?',
      options: ['Wait and watch!', 'Quiet! Be still!', 'Blow elsewhere!', 'Help us!'],
      correctAnswer: 'Quiet! Be still!',
      bibleReference: 'Mark 4:39',
      explanation: 'Jesus rebuked the wind and said to the waves: "Quiet! Be still!" and completely calmed the tempest.',
      marks: 1,
    },
    {
      id: 'pea_5',
      order: 5,
      questionType: 'single_choice',
      question: 'In the Beatitudes, what blessing is given to peacemakers?',
      options: [
        'They will inherit gold',
        'They will be called children of God',
        'They will lead nations',
        'They will live forever on earth',
      ],
      correctAnswer: 'They will be called children of God',
      bibleReference: 'Matthew 5:9',
      explanation: '"Blessed are the peacemakers, for they will be called children of God."',
      marks: 1,
    },
  ],
  Life: [
    {
      id: 'lif_1',
      order: 1,
      questionType: 'single_choice',
      question: 'Jesus declared: "I am the way and the truth and the ______."',
      options: ['Light', 'Life', 'Law', 'Power'],
      correctAnswer: 'Life',
      bibleReference: 'John 14:6',
      explanation: 'Jesus is the source of eternal, abundant life, and the only way to the Father.',
      marks: 1,
    },
    {
      id: 'lif_2',
      order: 2,
      questionType: 'single_choice',
      question: 'In John 10:10, Jesus said He came so that we may have life and have it ______.',
      options: ['Comfortably', 'To the full (Abundantly)', 'Quietly', 'Strictly'],
      correctAnswer: 'To the full (Abundantly)',
      bibleReference: 'John 10:10',
      explanation: '"I have come that they may have life, and have it to the full."',
      marks: 1,
    },
    {
      id: 'lif_3',
      order: 3,
      questionType: 'single_choice',
      question: 'What tree was placed in the middle of the Garden of Eden alongside the tree of knowledge?',
      options: ['Tree of Life', 'Tree of Gold', 'Tree of Olive', 'Tree of Cedar'],
      correctAnswer: 'Tree of Life',
      bibleReference: 'Genesis 2:9',
      explanation: 'The tree of life stood in the midst of the Garden of Eden and reappears in the New Jerusalem (Revelation 22:2).',
      marks: 1,
    },
    {
      id: 'lif_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Who said: "For to me, to live is Christ and to die is gain"?',
      options: ['Apostle Paul', 'Apostle Peter', 'John the Baptist', 'Stephen'],
      correctAnswer: 'Apostle Paul',
      bibleReference: 'Philippians 1:21',
      explanation: 'Paul expressed his unwavering commitment to live for Jesus Christ.',
      marks: 1,
    },
    {
      id: 'lif_5',
      order: 5,
      questionType: 'single_choice',
      question: 'According to Psalm 139:14, how are our lives created by God?',
      options: [
        'By random chance',
        'Fearfully and wonderfully made',
        'Weakly and quietly',
        'Accidentally',
      ],
      correctAnswer: 'Fearfully and wonderfully made',
      bibleReference: 'Psalm 139:14',
      explanation: 'David praises God: "I praise you because I am fearfully and wonderfully made."',
      marks: 1,
    },
  ],
  Wisdom: [
    {
      id: 'wis_1',
      order: 1,
      questionType: 'single_choice',
      question: 'According to Proverbs 9:10, what is the beginning of wisdom?',
      options: [
        'Reading many books',
        'The fear of the Lord',
        'Accumulating wealth',
        'Growing older',
      ],
      correctAnswer: 'The fear of the Lord',
      bibleReference: 'Proverbs 9:10',
      explanation: '"The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding."',
      marks: 1,
    },
    {
      id: 'wis_2',
      order: 2,
      questionType: 'single_choice',
      question: 'Which king of Israel asked God for wisdom to lead his people instead of riches or long life?',
      options: ['King David', 'King Solomon', 'King Josiah', 'King Jehoshaphat'],
      correctAnswer: 'King Solomon',
      bibleReference: '1 Kings 3:9-12',
      explanation: 'God was pleased with Solomon’s request and granted him wisdom unmatched by any king.',
      marks: 1,
    },
    {
      id: 'wis_3',
      order: 3,
      questionType: 'single_choice',
      question: 'James 1:5 instructs: "If any of you lacks wisdom, you should ask ______."',
      options: ['Your elders', 'God, who gives generously', 'Philosophers', 'Friends'],
      correctAnswer: 'God, who gives generously',
      bibleReference: 'James 1:5',
      explanation: 'God generously gives wisdom to anyone who asks in faith without doubting.',
      marks: 1,
    },
    {
      id: 'wis_4',
      order: 4,
      questionType: 'single_choice',
      question: 'Which book in the Old Testament is primarily composed of wise sayings, many written by Solomon?',
      options: ['Proverbs', 'Leviticus', 'Numbers', 'Nehemiah'],
      correctAnswer: 'Proverbs',
      bibleReference: 'Proverbs 1:1',
      explanation: 'The Book of Proverbs contains divinely inspired practical wisdom for everyday living.',
      marks: 1,
    },
    {
      id: 'wis_5',
      order: 5,
      questionType: 'single_choice',
      question: 'In Jesus’ parable, what did the wise man build his house on?',
      options: ['Sand', 'Rock', 'Grass', 'Water'],
      correctAnswer: 'Rock',
      bibleReference: 'Matthew 7:24',
      explanation: 'The wise man heard Jesus’ words and put them into practice, building upon solid rock.',
      marks: 1,
    },
  ],
  Care: [
    {
      id: 'car_1',
      order: 1,
      questionType: 'single_choice',
      question: '1 Peter 5:7 says: "Cast all your anxiety on Him because He ______ for you."',
      options: ['Judges', 'Cares', 'Watches', 'Waits'],
      correctAnswer: 'Cares',
      bibleReference: '1 Peter 5:7',
      explanation: 'God invites us to cast all our burdens and cares upon Him because He deeply loves and cares for us.',
      marks: 1,
    },
    {
      id: 'car_2',
      order: 2,
      questionType: 'single_choice',
      question: 'In the parable of the Good Samaritan, who stopped and took care of the wounded traveler?',
      options: ['The Priest', 'The Levite', 'The Samaritan', 'The Innkeeper only'],
      correctAnswer: 'The Samaritan',
      bibleReference: 'Luke 10:33-34',
      explanation: 'The Samaritan had compassion, bandaged the man’s wounds, and paid for his lodging and care.',
      marks: 1,
    },
    {
      id: 'car_3',
      order: 3,
      questionType: 'single_choice',
      question: 'Jesus taught that even the hairs of your head are all numbered, and God cares even for the little ______.',
      options: ['Sparrows', 'Fishes', 'Foxes', 'Ants'],
      correctAnswer: 'Sparrows',
      bibleReference: 'Matthew 10:29-31',
      explanation: 'Jesus assured: "You are worth more than many sparrows."',
      marks: 1,
    },
    {
      id: 'car_4',
      order: 4,
      questionType: 'single_choice',
      question: 'According to Galatians 6:2, how do we fulfill the law of Christ?',
      options: [
        'By carrying each other\'s burdens',
        'By memorizing all laws',
        'By judging wrongdoers',
        'By fasting silently',
      ],
      correctAnswer: 'By carrying each other\'s burdens',
      bibleReference: 'Galatians 6:2',
      explanation: '"Carry each other’s burdens, and in this way you will fulfill the law of Christ."',
      marks: 1,
    },
    {
      id: 'car_5',
      order: 5,
      questionType: 'single_choice',
      question: 'In Matthew 25, Jesus said whatever you did for one of the least of these brothers and sisters of mine, you did for ______.',
      options: ['The church', 'Me', 'The poor', 'Yourself'],
      correctAnswer: 'Me',
      bibleReference: 'Matthew 25:40',
      explanation: 'Caring for the hungry, sick, stranger, and needy is directly honoring Jesus Christ.',
      marks: 1,
    },
  ],
};

export class BibleQuizBank {
  private static PROGRESS_KEY_PREFIX = '@wechristian_quiz_progress_';
  private static progressMemoryCache: Map<string, MemberCategoryProgress> = new Map();

  /**
   * Get questions for a specific category, difficulty, and level.
   * Merges questions from Firestore (if an admin created one for this category/difficulty/level),
   * or falls back to the curated question bank.
   */
  static async getLevelQuiz(
    category: string,
    difficulty: QuizDifficulty = 'easy',
    level: number = 1,
    churchId?: string
  ): Promise<LevelQuizData> {
    try {
      // 1. Check if admin published a specific quiz for this category, difficulty, and level
      if (churchId && churchId !== 'global') {
        try {
          const snaps = await firestore()
            .collection('churches')
            .doc(churchId)
            .collection('bibleQuizzes')
            .where('category', '==', category)
            .where('difficulty', '==', difficulty)
            .where('level', '==', level)
            .where('status', '==', 'published')
            .limit(1)
            .get();

          if (!snaps.empty) {
            const data = snaps.docs[0].data();
            if (data.questions && data.questions.length > 0) {
              return {
                category,
                difficulty,
                level,
                title: data.title || `${category} - Level ${level}`,
                passPercentage: data.passPercentage || 70,
                questions: data.questions,
              };
            }
          }
        } catch {
          // ignore error and proceed to seed bank
        }
      }

      // 2. Built-in seed bank via CategoryQuestionBank (50 unique per stage, 5 per level):
      const selected = CategoryQuestionBank.getLevelQuestions(category, difficulty, level);

      return {
        category,
        difficulty,
        level,
        title: `${category} · ${difficulty.toUpperCase()} · Level ${level}`,
        passPercentage: 70,
        questions: selected,
      };
    } catch (err) {
      console.warn('[BibleQuizBank] Error fetching level quiz:', err);
      const fallback = SEED_QUESTIONS.Family;
      return {
        category,
        difficulty,
        level,
        title: `${category} - Level ${level}`,
        passPercentage: 70,
        questions: fallback,
      };
    }
  }

  /**
   * Get member progress for a category & difficulty (unlocked levels and past completions).
   */
  static async getMemberCategoryProgress(
    userId: string = 'guest',
    category: string,
    difficulty: QuizDifficulty = 'easy'
  ): Promise<MemberCategoryProgress> {
    const key = `${this.PROGRESS_KEY_PREFIX}${userId}_${category}_${difficulty}`;
    if (this.progressMemoryCache.has(key)) {
      return this.progressMemoryCache.get(key)!;
    }
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.progressMemoryCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // fallback
    }

    // Default: Level 1 is unlocked, no completed levels yet
    const defaultProgress: MemberCategoryProgress = {
      category,
      difficulty,
      unlockedLevel: 1,
      completedLevels: {},
    };
    this.progressMemoryCache.set(key, defaultProgress);
    return defaultProgress;
  }

  /**
   * Check if a level is unlocked.
   * Requirement 6:
   * Stage 1 – Foundation -> Level 1 is unlocked by default.
   * Stage 2 – Growth -> Level 11 is unlocked by default.
   * Stage 3 – Mastery -> Level 21 is unlocked by default.
   * Remaining levels unlock progressively when the previous level is completed with pass percentage (>= 70%).
   */
  static isLevelUnlocked(level: number, progress?: MemberCategoryProgress | null): boolean {
    if (level === 1 || level === 11 || level === 21) {
      return true;
    }
    if (!progress || !progress.completedLevels) return false;
    const prevCompleted = progress.completedLevels[level - 1];
    if (prevCompleted && prevCompleted.percentage >= 70) {
      return true;
    }
    return false;
  }

  /**
   * Save level attempt and unlock next level if passed (percentage >= passThreshold).
   */
  static async recordLevelResult(
    userId: string = 'guest',
    category: string,
    difficulty: QuizDifficulty = 'easy',
    level: number,
    score: number,
    total: number,
    passPercentage: number = 70
  ): Promise<{ passed: boolean; nextLevelUnlocked: boolean; newUnlockedLevel: number }> {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = percentage >= passPercentage;

    const currentProgress = await this.getMemberCategoryProgress(userId, category, difficulty);
    const prevCompleted = currentProgress.completedLevels[level];

    // Calculate stars: 100% = 3 stars, 80%+ = 2 stars, 70%+ = 1 star
    let stars = 1;
    if (percentage === 100) stars = 3;
    else if (percentage >= 80) stars = 2;

    currentProgress.completedLevels[level] = {
      score: Math.max(score, prevCompleted?.score || 0),
      total,
      percentage: Math.max(percentage, prevCompleted?.percentage || 0),
      stars: Math.max(stars, prevCompleted?.stars || 0),
      completedAt: new Date().toISOString(),
    };

    let nextLevelUnlocked = false;
    if (passed && level < 30) {
      currentProgress.unlockedLevel = Math.max(currentProgress.unlockedLevel || 1, level + 1);
      nextLevelUnlocked = true;
    }

    const key = `${this.PROGRESS_KEY_PREFIX}${userId}_${category}_${difficulty}`;
    this.progressMemoryCache.set(key, currentProgress);
    AsyncStorage.setItem(key, JSON.stringify(currentProgress)).catch((e) => {
      console.warn('[BibleQuizBank] Failed to persist progress:', e);
    });

    return {
      passed,
      nextLevelUnlocked,
      newUnlockedLevel: currentProgress.unlockedLevel,
    };
  }
}
