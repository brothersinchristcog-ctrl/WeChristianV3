const { buildBank } = require('./bank_builder.js');

// 50 Foundation Facts for Hope
const foundationFacts = [
  {
    easyQ: "What blessed prayer for abundant hope is penned in Romans 15:13?",
    easyQTe: "రోమీయులకు 15:13 లో ఆశీర్వాదకరమైన నిరీక్షణ సమృద్ధి కొరకు పౌలు చేసిన ప్రార్థన ఏది?",
    medQ: "According to Romans 15:13, through what divine person and power do believers abound in hope?",
    medQTe: "రోమీయులకు 15:13 ప్రకారం విశ్వాసులు ఏ దివ్య శక్తిద్వారా నిరీక్షణయందు విస్తరింపవలెను?",
    hardQ: "How do joy and peace in believing form the psychological soil from which supernatural hope abounds?",
    hardQTe: "విశ్వసించుటవలన కలుగు సంతోషసమాధానములు పరిశుద్ధాత్మ శక్తితో నిరీక్షణను ఎలా పుష్పింపజేయును?",
    options: ["May the God of hope fill you with all joy and peace in believing, that you may abound in hope by the power of the Holy Spirit", "May sixty silver talents from Macedonia enrich your earthly stores", "May forty iron chariots protect your journey to Jerusalem", "May you retreat into seven months of desert solitude"],
    optionsTelugu: ["పరిశుద్ధాత్మ శక్తిచేత మీకు నిరీక్షణ విస్తరించునట్లు, నిరీక్షణకర్తయైన దేవుడు విశ్వాసముద్వారా సమస్త ఆనందముతోను సమాధానముతోను మిమ్మును నింపును గాక", "మాసిదోనియనుండి అరవై వెండి తలాంతులు మీ సంపదను నింపును గాక", "యెరూషలేము ప్రయాణములో నలభై ఇనుప రథములు మీకు రక్షణగా ఉండును గాక", "ఏడు నెలల ఏకాంత అరణ్యవాసములోనికి మీరు విశ్రమించుదురు గాక"],
    correctAnswer: "May the God of hope fill you with all joy and peace in believing, that you may abound in hope by the power of the Holy Spirit",
    bibleReference: "Romans 15:13",
    explanation: "Paul prays to the 'God of hope' to flood believers with joy and peace so that hope overflows through the Holy Spirit's power.",
    explanationTelugu: "కాగా మీరు పరిశుద్ధాత్మ శక్తిచేత నిరీక్షణయందు విస్తరించునట్లు, నిరీక్షణకర్తయైన దేవుడు విశ్వాసముద్వారా సమస్త ఆనందముతోను సమాధానముతోను మిమ్మును నింపును గాక."
  },
  {
    easyQ: "In Hebrews 6:19, what metaphor describes hope as an unshakable security for the believer's soul?",
    easyQTe: "హెబ్రీయులకు 6:19 లో విశ్వాసి ఆత్మకు నిశ్చలమైన లంగరువలె ఉన్నది ఏదని వర్ణించబడినది?",
    medQ: "According to Hebrews 6:19, where does this sure and steadfast anchor of hope enter behind the veil?",
    medQTe: "హెబ్రీయులకు 6:19 ప్రకారం స్థిరమును నిశ్చలమునైన ఈ నిరీక్షణ లంగరు తెరలోపల ఎక్కడికి ప్రవేశించుచున్నది?",
    hardQ: "How does Jesus entering the inner sanctuary as our forerunner (prodromos) guarantee the celestial anchorage of Christian hope?",
    hardQTe: "యేసు మనకంటె ముందుగా ప్రధానయాజకునిగా తెరలోపలికి ప్రవేశించుట మన నిరీక్షణకు ఏ పరలోక నిశ్చయతను ఇచ్చుచున్నది?",
    options: ["This hope we have as an anchor of the soul, both sure and steadfast, and which enters the Presence behind the veil", "Hope is a fragile reed shaken by desert winds", "Hope is a golden crown kept in forty earthly palaces", "Hope is thirty years of legal disputation"],
    optionsTelugu: ["ఈ నిరీక్షణ నిశ్చలమును స్థిరమునై మన ఆత్మకు లంగరువలె ఉండి, తెరలోపలికి ప్రవేశించుచున్నది", "నిరీక్షణ ఎడారి గాలికి కదిలే బలహీనమైన రెల్లువంటిది", "నిరీక్షణ నలభై భూసంబంధమైన రాజభవనములలో దాచబడిన బంగారు కిరీటము", "నిరీక్షణ ముప్పది సంవత్సరముల చట్టపరమైన వివాదము"],
    correctAnswer: "This hope we have as an anchor of the soul, both sure and steadfast, and which enters the Presence behind the veil",
    bibleReference: "Hebrews 6:19",
    explanation: "Christian hope is anchored not in shifting earthly circumstances, but securely fastened in the very presence of God behind the heavenly veil.",
    explanationTelugu: "ఈ నిరీక్షణ నిశ్చలమును స్థిరమునై మన ఆత్మకు లంగరువలె ఉండి, తెరలోపలికి ప్రవేశించుచున్నది; యేసు నిరంతరము ప్రధానయాజకుడై మనకంటె ముందుగా అందులోనికి ప్రవేశించెను."
  },
  {
    easyQ: "What living hope did believers receive through the resurrection of Jesus Christ according to 1 Peter 1:3?",
    easyQTe: "1 పేతురు 1:3 ప్రకారం యేసుక్రీస్తు పునరుత్థానము ద్వారా విశ్వాసులు ఏ సజీవ నిరీక్షణను పొందిరి?",
    medQ: "In 1 Peter 1:3-4, to what undefiled, incorruptible inheritance does this living hope point?",
    medQTe: "1 పేతురు 1:3-4 లో ఈ సజీవమైన నిరీక్షణ పరలోకమందు భద్రపరచబడిన ఏ స్వాస్థ్యమువైపు నడిపించుచున్నది?",
    hardQ: "How does Christ's bodily resurrection transform subjective human wishful thinking into objective 'living hope' (elpida zosan)?",
    hardQTe: "క్రీస్తు పునరుత్థానము సాధారణ మానవ కోరికలను మించి ఆత్మీయంగా సజీవమైన నిశ్చయ నిరీక్షణగా ఎలా రూపాంతరం చెందించెను?",
    options: ["Begotten us again to a living hope through the resurrection of Jesus Christ from the dead", "Promised forty silver mines in the hills of Judea", "Established seventy military fortifications around Zion", "Granted seventy years of unbroken agricultural abundance"],
    optionsTelugu: ["మృతులలోనుండి యేసుక్రీస్తు లేచుటవలన జీవముతో కూడిన నిరీక్షణ మనకు కలుగునట్లు... తన మహా కనికరముచొప్పున మనలను మరల జన్మింపజేసెను", "యూదయ కొండలలో నలభై వెండి గనులను వాగ్దానము చేసెను", "సీయోను చుట్టూ డెబ్బై సైనిక కోటలను నిర్మించెను", "డెబ్బై సంవత్సరముల తిరుగులేని సమృద్ధి పంటను అనుగ్రహించెను"],
    correctAnswer: "Begotten us again to a living hope through the resurrection of Jesus Christ from the dead",
    bibleReference: "1 Peter 1:3",
    explanation: "God in His abundant mercy gave us new birth into a living hope through the historical resurrection of Jesus from the dead.",
    explanationTelugu: "మన ప్రభువైన యేసుక్రీస్తు తండ్రియైన దేవుడు స్తుతింపబడును గాక. మృతులలోనుండి యేసుక్రీస్తు లేచుటవలన జీవముతో కూడిన నిరీక్షణ మనకు కలుగునట్లు ఆయన మనలను మరల జన్మింపజేసెను."
  },
  {
    easyQ: "What well-known promise of a future and hope in exile is declared in Jeremiah 29:11?",
    easyQTe: "యిర్మీయా 29:11 లో నిర్వాసనలో ఉన్న ప్రజలకు భవిష్యత్తు మరియు నిరీక్షణను గూర్చి దేవుడు పలికిన ప్రసిద్ధ వాగ్దానమేమి?",
    medQ: "According to Jeremiah 29:11, what are God's thoughts toward His people rather than calamity?",
    medQTe: "యిర్మీయా 29:11 ప్రకారం తన ప్రజలయెడల దేవుడు తలంచుచున్న తలంపులు ఎట్టివి?",
    hardQ: "How does divine providence turn a devastating 70-year Babylonian exile into a planned crucible of spiritual hope and restoration?",
    hardQTe: "డెబ్బై ఏండ్ల బబులోను బానిసత్వమును సైతం సమాధానకరమైన ముగింపుగా మార్చు దేవుని సంకల్పము విశ్వాసి నిరీక్షణను ఎలా నిలుపును?",
    options: ["For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil, to give you a future and a hope", "I plan forty plagues upon your rebellious cities", "I will leave you sixty years without prophetic guidance", "I will deliver your daughters to seventy foreign rulers"],
    optionsTelugu: ["నేను మిమ్మునుగూర్చి తలంచుచున్న తలంపులను నేనెరుగుదును, అవి సమాధానకరమైన తలంపులే గాని హానికరమైనవి కావు, రాబోవు కాలమందు మీకు నిరీక్షణ కలుగునట్లుగా చేయుదును", "మీ తిరుగుబాటు నగరములపై నలభై తెగుళ్లను రప్పింప సంకల్పించితిని", "ప్రవచన వెలుగు లేకుండ అరవై సంవత్సరములు మిమ్మును విడిచిపెట్టెదను", "డెబ్బైమంది విదేశీ పాలకులకు మీ కుమార్తెలను అప్పగించెదను"],
    correctAnswer: "For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil, to give you a future and a hope",
    bibleReference: "Jeremiah 29:11",
    explanation: "God reveals His benevolent plans to give His chastened people a future full of peace, deliverance, and solid hope.",
    explanationTelugu: "నేను మిమ్మునుగూర్చి తలంచుచున్న తలంపులను నేనెరుగుదును, అవి సమాధానకరమైన తలంపులే గాని హానికరమైనవి కావు, రాబోవు కాలమందు మీకు నిరీక్షణ కలుగునట్లుగా చేయుదును అని యెహోవా సెలవిచ్చుచున్నాడు."
  },
  {
    easyQ: "How does the apostle Paul define the nature of unseen hope in Romans 8:24-25?",
    easyQTe: "రోమీయులకు 8:24-25 లో కనిపించనిదానికొరకు కనిపెట్టు నిరీక్షణ స్వభావమును పౌలు ఎలా నిర్వచించెను?",
    medQ: "According to Romans 8:25, if we hope for what we do not yet see, with what posture do we eagerly wait for it?",
    medQTe: "రోమీయులకు 8:25 ప్రకారం చూడనిదానికొరకు నిరీక్షించునప్పుడు మనము ఏ సహనముతో కనిపెట్టవలెను?",
    hardQ: "Why is empirical sight the boundary and termination of hope, while patient perseverance (hupomone) is its engine?",
    hardQTe: "కనిపించుదానికొరకు నిరీక్షించుట నిరీక్షణ కాదనియు, కంటికి కానరాని నిత్య మహిమకొరకు ఓపికతో కనిపెట్టుటయే నిజమైన క్రైస్తవ విశ్వాసమని పౌలు ఎలా నిరూపించెను?",
    options: ["Hope that is seen is not hope; for why does one still hope for what he sees? But if we hope for what we do not see, we eagerly wait for it with perseverance", "Hope requires forty physical proofs before believing", "Hope perishes when thirty days of sorrow arrive", "Hope is verified by seventy talents of gold"],
    optionsTelugu: ["చూచుచున్నదానినిగూర్చి ఎవడును నిరీక్షింపడు గదా? చూడనిదానినిగూర్చి నిరీక్షించినయెడల ఓపికతో దానికొరకు కనిపెట్టుదుము", "నమ్ముటకు ముందు నలభై భౌతిక రుజువులు నిరీక్షణకు అవసరము", "ముప్పది దినముల దుఃఖము రాగానే నిరీక్షణ నశించిపోవును", "డెబ్బై తలాంతుల బంగారముతో నిరీక్షణ రూఢిపరచబడును"],
    correctAnswer: "Hope that is seen is not hope; for why does one still hope for what he sees? But if we hope for what we do not see, we eagerly wait for it with perseverance",
    bibleReference: "Romans 8:24-25",
    explanation: "True hope looks beyond visible temporal realities to invisible eternal promises, persevering with patient endurance.",
    explanationTelugu: "మనము నిరీక్షణచేత రక్షింపబడితివి; నిరీక్షింపబడునది కంటికి కనబడునదైతే అది నిరీక్షణ కాదు. చూడనిదానినిగూర్చి నిరీక్షించినయెడల ఓపికతో దానికొరకు కనిపెట్టుదుము."
  },
  {
    easyQ: "What chain reaction starting with tribulation leads to hope in Romans 5:3-5?",
    easyQTe: "రోమీయులకు 5:3-5 లో శ్రమలనుండి ప్రారంభమై నిరీక్షణకు దారితీయు ఆత్మీయ గొలుసుకట్టు ఏది?",
    medQ: "In Romans 5:5, why does this biblical hope never put us to shame or disappoint?",
    medQTe: "రోమీయులకు 5:5 ప్రకారం ఈ నిరీక్షణ మనలను ఎందుకు సిగ్గుపరచదు?",
    hardQ: "How does the Holy Spirit pouring out God's love internally confirm the certainty of Christian hope against worldly despair?",
    hardQTe: "మన హృదయములలో కుమ్మరింపబడిన దేవుని ప్రేమ నిరీక్షణకు ఏ అంతరంగిక సాక్ష్యమును ధైర్యమును ఇచ్చుచున్నది?",
    options: ["Tribulation produces perseverance; and perseverance, character; and character, hope. Now hope does not disappoint", "Tribulation causes forty doubts and sixty apostasies", "Tribulation builds forty stone towers in the hills", "Tribulation ends all spiritual fruitfulness forever"],
    optionsTelugu: ["శ్రమ ఓర్పును, ఓర్పు పరీక్షను, పరీక్ష నిరీక్షణను కలుగజేయును; మరియు ఆ నిరీక్షణ మనలను సిగ్గుపరచదు", "శ్రమ నలభై అనుమానములను అరవై పతనములను తెచ్చును", "శ్రమ కొండలలో నలభై రాతి గోపురములను నిర్మించును", "శ్రమ సమస్త ఆత్మీయ ఫలములను శాశ్వతముగా తుడిచివేయును"],
    correctAnswer: "Tribulation produces perseverance; and perseverance, character; and character, hope. Now hope does not disappoint",
    bibleReference: "Romans 5:3-5",
    explanation: "Suffering refines perseverance, which builds tested character, which produces an unshakable hope grounded in God's poured-out love.",
    explanationTelugu: "శ్రమ ఓర్పును, ఓర్పు పరీక్షను, పరీక్ష నిరీక్షణను కలుగజేయునని యెరిగి శ్రమలయందును అతిశయపడుదము; మరియు ఆ నిరీక్షణ మనలను సిగ్గుపరచదు."
  },
  {
    easyQ: "What definition of faith and hope opens Hebrews 11:1?",
    easyQTe: "హెబ్రీయులకు 11:1 లో విశ్వాసమునకును నిరీక్షణకును గల సంబంధము ఏమని నిర్వచించబడినది?",
    medQ: "According to Hebrews 11:1, how does faith give tangible substance (hupostasis) to things hoped for?",
    medQTe: "హెబ్రీయులకు 11:1 ప్రకారం నిరీక్షింపబడువాటికి విశ్వాసము ఏ నిజస్వరూపమును ఆధారమును ఇచ్చును?",
    hardQ: "What epistemological reality is established by faith being the 'evidence of things not seen' (elenchos pragmaton ou blepomenon)?",
    hardQTe: "కంటికి కనిపించని ఆత్మీయ సంగతులకు విశ్వాసమే ఏకైక తిరుగులేని రుజువుగా ఎలా నిలుచుచున్నది?",
    options: ["Now faith is the substance of things hoped for, the evidence of things not seen", "Faith is forty days of philosophical reasoning in Athens", "Faith is the accumulation of sixty talents of temple silver", "Faith is the recitation of thirty ancient royal genealogies"],
    optionsTelugu: ["విశ్వాసమనునది నిరీక్షింపబడువాటియొక్క నిజస్వరూపమును, అదృశ్యమైన సంగతులు ఉన్నవనుటకు రుజువునై యున్నది", "విశ్వాసము ఏథెన్సులో నలభై దినముల తత్వశాస్త్ర వాదన", "విశ్వాసము దేవాలయపు అరవై వెండి తలాంతుల నిధి", "విశ్వాసము ముప్పది పూర్వ రాజ వంశావళుల వల్లెవేత"],
    correctAnswer: "Now faith is the substance of things hoped for, the evidence of things not seen",
    bibleReference: "Hebrews 11:1",
    explanation: "Faith acts as the solid reality and convincing proof of the invisible future promises for which believers hope.",
    explanationTelugu: "విశ్వాసమనునది నిరీక్షింపబడువాటియొక్క నిజస్వరూపమును, అదృశ్యమైన సంగతులు ఉన్నవనుటకు రుజువునై యున్నది."
  },
  {
    easyQ: "What apostolic duty regarding our hope is commanded in 1 Peter 3:15?",
    easyQTe: "1 పేతురు 3:15 లో మనలోనున్న నిరీక్షణను గూర్చి ఇతరులకు సమాధానము చెప్పుటకు ఏ ఆజ్ఞ ఇవ్వబడినది?",
    medQ: "In 1 Peter 3:15, with what two gentle attitudes must we present the defense of our hope?",
    medQTe: "1 పేతురు 3:15 ప్రకారం మన నిరీక్షణను గూర్చి సాక్ష్యమిచ్చునప్పుడు ఏ రెండు సాధు గుణములు కలిగియుండవలెను?",
    hardQ: "How does setting apart Christ as Lord in the heart generate a compelling evangelistic apologetic for Christian hope?",
    hardQTe: "హృదయమందు క్రీస్తును ప్రభువుగా ప్రతిష్టించుకొనుట మన నిరీక్షణను గూర్చి సమాధానము చెప్పుటకు ఏ ఆత్మీయ ధైర్యమునిచ్చును?",
    options: ["Always be ready to give a defense to everyone who asks you a reason for the hope that is in you, with meekness and fear", "Argue aggressively with forty philosophical insults", "Silence all questioners with thirty legal threats", "Flee into the desert whenever someone questions your doctrine"],
    optionsTelugu: ["మీలోనున్న నిరీక్షణనుగూర్చి మిమ్మును హేతువు అడుగు ప్రతివానికిని సాత్వికముతోను భయముతోను సమాధానము చెప్పుటకు ఎల్లప్పుడును సిద్ధముగా ఉండుడి", "నలభై తత్వశాస్త్ర దూషణలతో శత్రువులను ఎదిరించుడి", "ముప్పది చట్టపరమైన బెదిరింపులతో ప్రశ్నించేవారిని అణచివేయుడి", "మీ విశ్వాసమును గూర్చి ఎవరైనా అడిగినప్పుడు అరణ్యమునకు పారిపోవుడి"],
    correctAnswer: "Always be ready to give a defense to everyone who asks you a reason for the hope that is in you, with meekness and fear",
    bibleReference: "1 Peter 3:15",
    explanation: "Believers must always be prepared to explain the rationale of their Christian hope with gentleness and reverent humility.",
    explanationTelugu: "మీ హృదయములయందు క్రీస్తును ప్రభువుగా ప్రతిష్టించుడి; మీలోనున్న నిరీక్షణనుగూర్చి మిమ్మును హేతువు అడుగు ప్రతివానికిని సాత్వికముతోను భయముతోను సమాధానము చెప్పుటకు ఎల్లప్పుడును సిద్ధముగా ఉండుడి."
  },
  {
    easyQ: "What purifying effect does the hope of Christ's return produce according to 1 John 3:3?",
    easyQTe: "1 యోహాను 3:3 ప్రకారం క్రీస్తు ప్రత్యక్షతను గూర్చిన నిరీక్షణగల ప్రతివాడు ఏమి చేయును?",
    medQ: "In 1 John 3:2-3, what glorious transformation will take place when Christ appears, motivating holiness today?",
    medQTe: "1 యోహాను 3:2-3 ప్రకారం క్రీస్తు ప్రత్యక్షమైనప్పుడు మనము ఆయన రూపమును పొందుదుమను నిరీక్షణ ఏ పరిశుద్ధతను రగిలించును?",
    hardQ: "Why is eschatological hope for Christlikeness incompatible with lax antinomian living?",
    hardQTe: "క్రీస్తును చూచి ఆయనవలె ఉండెదమను నిరీక్షణ విశ్వాసిని పాపము విడిచి పరిశుద్ధముగా జీవించుటకు ఎలా ప్రేరేపించును?",
    options: ["Everyone who has this hope in Him purifies himself, just as He is pure", "He builds forty golden towers in Jerusalem", "He fasts sixty days to earn celestial status", "He condemns forty weaker brethren"],
    optionsTelugu: ["ఆయనయందు ఈ నిరీక్షణ పెట్టుకొనిన ప్రతివాడును, ఆయన పవిత్రుడై యున్నట్టుగా తన్నుతాను పవిత్రపరచుకొనును", "యెరూషలేములో నలభై బంగారు గోపురములను కట్టును", "పరలోక హోదాకొరకు అరవై దినములు ఉపవాసముండును", "నలభైమంది బలహీన సహోదరులను తీర్పుతీర్చును"],
    correctAnswer: "Everyone who has this hope in Him purifies himself, just as He is pure",
    bibleReference: "1 John 3:3",
    explanation: "The confident hope that we will see Jesus and be made like Him compels proactive personal purification in the present.",
    explanationTelugu: "ఆయనయందు ఈ నిరీక్షణ పెట్టుకొనిన ప్రతివాడును, ఆయన పవిత్రుడై యున్నట్టుగా తన్నుతాను పవిత్రపరచుకొనును."
  },
  {
    easyQ: "What glorious event is designated 'the blessed hope' in Titus 2:13?",
    easyQTe: "తీతుకు 2:13 లో 'ధన్యకరమైన నిరీక్షణ' అని ఏ పరమ సంభవమును పిలిచిరి?",
    medQ: "According to Titus 2:13, whose glorious appearing are Christians eagerly looking forward to?",
    medQTe: "తీతుకు 2:13 ప్రకారం విశ్వాసులు ఎవరి మహిమగల ప్రత్యక్షతకొరకు ఎదురుచూచుచున్నారు?",
    hardQ: "How does the Granville Sharp rule in the Greek of Titus 2:13 explicitly declare the full deity of Jesus Christ as our Great God and Savior?",
    hardQTe: "'మన మహద్దేవుడును రక్షకుడునైన యేసుక్రీస్తు' అను సంబోధన క్రీస్తుయొక్క సంపూర్ణ దైవత్వమును మరియు నిరీక్షణను ఎలా నిరూపించుచున్నది?",
    options: ["Looking for the blessed hope and glorious appearing of our great God and Savior Jesus Christ", "Awaiting forty years of Roman imperial tax relief", "Looking for the conquest of seventy pagan nations by kings", "Expecting the discovery of sixty silver mines in Carmel"],
    optionsTelugu: ["మహద్దేవుడును మన రక్షకుడునైన యేసుక్రీస్తు మహిమయొక్క ప్రత్యక్షతకొరకు ఎదురుచూచుచు నిరీక్షించుట", "నలభై సంవత్సరముల రోమా పన్నుల మినహాయింపుకొరకు ఎదురుచూచుట", "రాజులచేత డెబ్బై అన్య రాజ్యముల జయముకొరకు ఎదురుచూచుట", "కర్మెలులో అరవై వెండి గనులను కనుగొందుమని ఆశించుట"],
    correctAnswer: "Looking for the blessed hope and glorious appearing of our great God and Savior Jesus Christ",
    bibleReference: "Titus 2:13",
    explanation: "The blessed hope of the church is the imminent, glorious return of Jesus Christ, our great God and Savior.",
    explanationTelugu: "మహద్దేవుడును మన రక్షకుడునైన యేసుక్రీస్తు మహిమయొక్క ప్రత్యక్షతకొరకు ఎదురుచూచుచు, ధన్యకరమైన నిరీక్షణ నిమిత్తము కనిపెట్టుకొనియున్నాము."
  },
  {
    easyQ: "What sublime mystery among the Gentiles is declared in Colossians 1:27 to be 'the hope of glory'?",
    easyQTe: "కొలొస్సయులకు 1:27 లో అన్యజనులలో బయలుపరచబడిన 'మహిమ నిరీక్షణయైన' పరమ మర్మమేమి?",
    medQ: "According to Colossians 1:27, where does Christ reside to constitute this indwelling hope?",
    medQTe: "కొలొస్సయులకు 1:27 ప్రకారం క్రీస్తు ఎవరియందు నివసించుట మహిమ నిరీక్షణగా మారెను?",
    hardQ: "How does the internal indwelling of the risen Christ guarantee the future bodily glorification of the believer?",
    hardQTe: "'మీయందున్న క్రీస్తు మహిమ నిరీక్షణయై యున్నాడు' అను సత్యము పునరుత్థాన మహిమకు ఏ పూచీకత్తుగా ఉన్నది?",
    options: ["Christ in you, the hope of glory", "Solomon's temple standing forty cubits high", "The law inscribed on seventy stone tablets", "The conquest of thirty Greek cities by Judah"],
    optionsTelugu: ["మీయందున్న క్రీస్తు మహిమ నిరీక్షణయై యున్నాడు", "నలభై మూరల ఎత్తుగల సొలొమోను దేవాలయము", "డెబ్బై రాతి పలకలపై రాయబడిన ధర్మశాస్త్రము", "యూదాచేత ముప్పది గ్రీకు నగరముల జయము"],
    correctAnswer: "Christ in you, the hope of glory",
    bibleReference: "Colossians 1:27",
    explanation: "Paul reveals that the glorious mystery once hidden is now Christ living within believers, assuring them of future glory.",
    explanationTelugu: "అన్యజనులలో ఈ మర్మముయొక్క మహిమైశ్వర్యము ఎట్టిదో అది పరిశుద్ధులకు తెలియజేయబడెను; ఈ మర్మమేదనగా-మీయందున్న క్రీస్తు మహిమ నిరీక్షణయై యున్నాడు."
  },
  {
    easyQ: "What self-interrogation and exhortation does the psalmist repeat in Psalm 42:5 and 42:11?",
    easyQTe: "కీర్తన 42:5 మరియు 42:11 లో కృంగిపోయిన తన ప్రాణముతో భక్తుడు పలికిన హెచ్చరిక ఏది?",
    medQ: "In Psalm 42:5, what cure does David apply to a downcast, disquieted soul?",
    medQTe: "కీర్తన 42:5 లో కలవరపడుచున్న అంతరంగానికి దావీదు ఏ నిరీక్షణ ఔషధమును పూసెను?",
    hardQ: "How does preaching to one's own soul to 'Hope in God' demonstrate active spiritual warfare against clinical and spiritual despair?",
    hardQTe: "'దేవునియందు నిరీక్షణ యుంచుము' అని తన ప్రాణమునకు తానే బోధించుకొనుట ఆత్మీయ వ్యాకులతపై విజయమును ఎలా సాధించును?",
    options: ["Why are you cast down, O my soul? And why are you disquieted within me? Hope in God, for I shall yet praise Him", "Flee forty days into the caves of Mount Seir", "Demand sixty talents of tribute from Tyre", "Fast thirty nights without bread or water"],
    optionsTelugu: ["నా ప్రాణమా, నీవు ఏల కృంగియున్నావు? నాలో నీవేల తొందరపడుచున్నావు? దేవునియందు నిరీక్షణ యుంచుము, ఆయన ముఖకాంతివలన రక్షణ కలుగును గనుక నేను ఇంకను ఆయనను స్తుతించెదను", "శేయీరు పర్వత గుహలలోనికి నలభై దినములు పారిపోవుము", "తీరునుండి అరవై తలాంతుల కప్పమును డిమాండ్ చేయుము", "అన్నపానములు లేకుండ ముప్పది రాత్రులు ఉపవాసముండుము"],
    correctAnswer: "Why are you cast down, O my soul? And why are you disquieted within me? Hope in God, for I shall yet praise Him",
    bibleReference: "Psalm 42:5, 11; 43:5",
    explanation: "David commands his depressed soul to stop despairing and fix its hope resolutely on God, his sure salvation.",
    explanationTelugu: "నా ప్రాణమా, నీవు ఏల కృంగియున్నావు? నాలో నీవేల తొందరపడుచున్నావు? దేవునియందు నిరీక్షణ యుంచుము, ఆయన ముఖకాంతివలన రక్షణ కలుగును గనుక నేను ఇంకను ఆయనను స్తుతించెదను."
  },
  {
    easyQ: "What lifelong confession of hope does the aging psalmist declare in Psalm 71:5?",
    easyQTe: "కీర్తన 71:5 లో వృద్ధుడైన కీర్తనకారుడు తన నిరీక్షణను గూర్చి పలికిన సాక్ష్యమేమి?",
    medQ: "According to Psalm 71:5, from what early period of life had God been David's confidence?",
    medQTe: "కీర్తన 71:5 ప్రకారం ఏ చిన్ననాటినుండి యెహోవాయే భక్తునికి ఆశ్రయముగా ఉండెను?",
    hardQ: "How does cultivating hope in God during youth produce unbreakable spiritual resilience in old age?",
    hardQTe: "బాల్యమునుండి దేవునియందు నిరీక్షణను అభ్యసించుట వృద్ధాప్య బలహీనతలలో ఏ అచంచల విశ్వాసమును నిలుపును?",
    options: ["For You are my hope, O Lord God; You are my trust from my youth", "My hope is in my seventy war chariots", "My trust is in the high stone walls of Jerusalem", "My confidence was in forty merchant fleets of Tarshish"],
    optionsTelugu: ["ప్రభువైన యెహోవా, నీవే నా నిరీక్షణాస్పదమవు, నా బాల్యమునుండి నీవే నా ఆశ్రయమవు", "నా నలభై యుద్ధ రథములే నా నిరీక్షణ", "యెరూషలేము ఎత్తయిన రాతి ప్రాకారములే నా నమ్మకము", "తర్షీషు నలభై వర్తక ఓడలే నా ఆశ్రయము"],
    correctAnswer: "For You are my hope, O Lord God; You are my trust from my youth",
    bibleReference: "Psalm 71:5",
    explanation: "The psalmist rests upon a lifetime of divine faithfulness, affirming that God has been his unwavering hope since youth.",
    explanationTelugu: "ప్రభువైన యెహోవా, నీవే నా నిరీక్షణాస్పదమవు, నా బాల్యమునుండి నీవే నా ఆశ్రయమవు."
  },
  {
    easyQ: "What life-giving tree is contrasted with deferred hope in Proverbs 13:12?",
    easyQTe: "సామెతలు 13:12 లో ఆశ నెరవేరుట ఏ చెట్టుతో పోల్చబడినది?",
    medQ: "According to Proverbs 13:12, what painful emotional effect occurs when hope is continually postponed?",
    medQTe: "సామెతలు 13:12 ప్రకారం నిరీక్షణ ఆలస్యమగుటవలన హృదయమునకు ఏమి కలుగును?",
    hardQ: "How does the 'tree of life' symbolize the revitalization and joy of realized divine promises?",
    hardQTe: "'ఆశ నెరవేరుట జీవవృక్షము' అను జ్ఞానోపదేశము నెరవేరిన దైవిక వాగ్దానములు ప్రాణమును ఎలా పునరుజ్జీవింపజేయునో తెలుపుచున్నది?",
    options: ["Hope deferred makes the heart sick, but when the desire comes, it is a tree of life", "Hope deferred builds forty stone towers in the fields", "Hope deferred conquers seventy pagan provinces", "Hope deferred gathers thirty bags of cedar cones"],
    optionsTelugu: ["నిరీక్షణ ఆలస్యమగుటవలన హృదయము జబ్బుపడును, ఆశ నెరవేరుట జీవవృక్షము", "నిరీక్షణ ఆలస్యమగుట పొలములో నలభై రాతి గోపురములను కట్టును", "నిరీక్షణ ఆలస్యమగుట డెబ్బై అన్య రాజ్యములను జయించును", "నిరీక్షణ ఆలస్యమగుట ముప్పది సంచుల దేవదారు కాయలను కూర్చును"],
    correctAnswer: "Hope deferred makes the heart sick, but when the desire comes, it is a tree of life",
    bibleReference: "Proverbs 13:12",
    explanation: "Delayed hope brings heart sickness, but the arrival of what was promised flourishes like a vibrant tree of life.",
    explanationTelugu: "నిరీక్షణ ఆలస్యమగుటవలన హృదయము జబ్బుపడును, ఆశ నెరవేరుట జీవవృక్షము."
  },
  {
    easyQ: "What enduring assurance of a future hope is given to the wise in Proverbs 23:18 and 24:14?",
    easyQTe: "సామెతలు 23:18 మరియు 24:14 లో భక్తిపరుల నిరీక్షణను గూర్చి పలికిన అభయమేమి?",
    medQ: "According to Proverbs 23:18, what will surely happen to your hope in the hereafter?",
    medQTe: "సామెతలు 23:18 ప్రకారం రాబోవు కాలమందు నీ నిరీక్షణ ఏమి కాకపోవును?",
    hardQ: "How does the promise 'your hope will not be cut off' anchor the believer against the apparent prosperity of sinners?",
    hardQTe: "పాపుల తాత్కాలిక వైభవమును చూచి ఈర్ష్యపడక 'నీ నిరీక్షణ భంగము కాదు' అను వాగ్దానము విశ్వాసిని ఎలా కాపాడును?",
    options: ["For surely there is a hereafter, and your hope will not be cut off", "Your silver will multiply fortyfold in the city gates", "You shall inherit sixty chariots of bronze", "Your name shall be carved on seventy desert rocks"],
    optionsTelugu: ["నిశ్చయముగా ముందు గతి ఒకటి కలదు, నీ నిరీక్షణ భంగము కాదు", "పట్టణ ద్వారములలో నీ వెండి నలభై రెట్లు విస్తరించును", "డెబ్బై ఇనుప రథములను నీవు స్వాస్థ్యముగా పొందెదవు", "అరవై ఎడారి బండలపై నీ పేరు చెక్కబడును"],
    correctAnswer: "For surely there is a hereafter, and your hope will not be cut off",
    bibleReference: "Proverbs 23:18; 24:14",
    explanation: "Scripture guarantees that for those who fear God, there is an assured eternal future and their hope will never be shattered.",
    explanationTelugu: "నిశ్చయముగా ముందు గతి ఒకటి కలదు, నీ ఆశ భంగము కాదు (నీ నిరీక్షణ భంగము కాదు)."
  },
  {
    easyQ: "What soaring physical and spiritual renewal is promised in Isaiah 40:31 to those who hope in the Lord?",
    easyQTe: "యెషయా 40:31 లో యెహోవాకొరకు కనిపెట్టువారికి (నిరీక్షించువారికి) ఏ నూతన బలము వాగ్దానము చేయబడినది?",
    medQ: "According to Isaiah 40:31, like what majestic bird will those who wait upon the Lord mount up with wings?",
    medQTe: "యెషయా 40:31 ప్రకారం యెహోవాకొరకు కనిపెట్టువారు ఏ పక్షివలె రెక్కలు చాపి పైకి ఎగురుదురు?",
    hardQ: "How does the Hebrew qavah (waiting/hoping with tension) transform human exhaustion into unwearied walking and running?",
    hardQTe: "దేవునికొరకు నిరీక్షించుట (కనిపెట్టుట) నడచినను బడలిక లేకుండ పరుగెత్తినను అలయకుండ ఉండే దివ్య బలమును ఎలా ప్రసాదించును?",
    options: ["Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint", "They shall assemble forty battalions of foot soldiers", "They shall build sixty stone monuments in Babylon", "They shall fast thirty days on Mount Carmel"],
    optionsTelugu: ["యెహోవాకొరకు ఎదురుచూచువారు నూతన బలము పొందుదురు; వారు పక్షిరాజులవలె రెక్కలు చాపి పైకి ఎగురుదురు; అలయక పరుగెత్తుదురు, సొమ్మసిల్లక నడిచిపోవుదురు", "వారు నలభై దళముల పదాతి సైన్యమును సమకూర్తురు", "వారు బబులోనులో అరవై రాతి స్తంభములను నిలుపుదురు", "వారు కర్మెలు పర్వతముపై ముప్పది దినములు ఉపవాసముందురు"],
    correctAnswer: "Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint",
    bibleReference: "Isaiah 40:31",
    explanation: "Those who patiently hope in God receive continuous infusions of supernatural vigor, rising above trials like eagles soaring in flight.",
    explanationTelugu: "యెహోవాకొరకు ఎదురుచూచువారు నూతన బలము పొందుదురు; వారు పక్షిరాజులవలె రెక్కలు చాపి పైకి ఎగురుదురు; అలయక పరుగెత్తుదురు, సొమ్మసిల్లక నడిచిపోవుదురు."
  },
  {
    easyQ: "What memory restored hope to weeping Jeremiah amidst the smoking ruins of Jerusalem in Lamentations 3:21-24?",
    easyQTe: "విలాపవాక్యములు 3:21-24 లో నాశనమైన యెరూషలేమును చూచి ఏడ్చుచున్న యిర్మీయాకు ఏ తలంపు నూతన నిరీక్షణను తెచ్చెను?",
    medQ: "In Lamentations 3:24, what profound possession does Jeremiah's soul claim as the sole ground of hope?",
    medQTe: "విలాపవాక్యములు 3:24 లో 'యెహోవాయే నా స్వాస్థ్యము' అని చెప్పుకొనుచు భక్తుడు ఏ నిరీక్షణను పట్టుకొనెను?",
    hardQ: "How does declaring 'The Lord is my portion' allow hope to survive when all material, national, and temple structures are completely demolished?",
    hardQTe: "సమస్త భౌతిక ఆలయ సంపదలు నాశనమైనను దేవుడే నా వంతు అని నమ్ముట అసాధ్యమైన పరిస్థితులలో నిరీక్షణను ఎలా నిలబెట్టును?",
    options: ["This I recall to my mind, therefore I have hope: The Lord is my portion, says my soul, therefore I hope in Him!", "I recalled forty talents of silver hidden in the brook Kidron", "I remembered seventy horses of Pharaoh arriving to rescue Zion", "I trusted in the thirty unbreached walls of the citadel"],
    optionsTelugu: ["నేను దీని జ్ఞాపకము చేసికొనుచున్నాను గనుక నాకు నిరీక్షణ కలదు: యెహోవా నా వంతు అని నా మనస్సు అనుకొనుచున్నది, కావున నేను ఆయనయందు నిరీక్షణ యుంచుచున్నాను", "కీద్రోను వాగులో దాచబడిన నలభై వెండి నాణెములను నేను గుర్తుచేసికొంటిని", "సీయోనును రక్షించుటకు ఫరో డెబ్బై గుఱ్ఱములు వచ్చుచున్నవని నమ్మితిని", "కోటయందలి ముప్పది ప్రాకారములపై నేను ఆధారపడితిని"],
    correctAnswer: "This I recall to my mind, therefore I have hope: The Lord is my portion, says my soul, therefore I hope in Him!",
    bibleReference: "Lamentations 3:21-24",
    explanation: "Even in total devastation, Jeremiah rekindled hope by remembering God's unending mercies and claiming the Lord Himself as his portion.",
    explanationTelugu: "నేను దీని జ్ఞాపకము చేసికొనుచున్నాను గనుక నాకు నిరీక్షణ కలదు. యెహోవా నా వంతు అని నా మనస్సు అనుకొనుచున్నది, కావున నేను ఆయనయందు నిరీక్షణ యుంచుచున్నాను."
  },
  {
    easyQ: "What title of endearment and restoration is given to God's exiles in Zechariah 9:12?",
    easyQTe: "జెకర్యా 9:12 లో నిరీక్షణగల బందీలకు దేవుడు ఏ పిలుపునిచ్చి రెట్టింపు మేలును వాగ్దానము చేసెను?",
    medQ: "According to Zechariah 9:12, to what stronghold must these 'prisoners of hope' return?",
    medQTe: "జెకర్యా 9:12 ప్రకారం 'నిరీక్షణగల బంధీలు' ఏ కోటలోనికి మరలిరావలెను?",
    hardQ: "How does being a 'prisoner of hope' (asirei ha-tiqvah) overturn despair with the unbreakable guarantee of covenant restoration?",
    hardQTe: "'నిరీక్షణగల బంధీలు' అను పిలుపు శ్రమలలో ఉన్న విశ్వాసిని నిరాశనుండి విడిపించి రెట్టింపు ఆశీర్వాదమునకు ఎలా పాత్రునిగా చేయును?",
    options: ["Return to the stronghold, you prisoners of hope. Even today I declare that I will restore double to you", "Flee forty days into the caves of the wilderness of Paran", "Pay seventy pieces of silver to the governors of Samaria", "Surrender your thirty shields to the King of Greece"],
    optionsTelugu: ["నిరీక్షణగల బంధీలారా, కోటను ఆశ్రయించుడి; రెట్టింపుగా మేలు చేసెదనని నేడు నేను మీకు తెలియజేయుచున్నాను", "పారాను అరణ్య గుహలలోనికి నలభై దినములు పారిపోవుడి", "సమరయ అధిపతులకు డెబ్బై వెండి నాణెములను చెల్లించుడి", "గ్రీకు రాజునకు మీ ముప్పది డాలులను అప్పగించుడి"],
    correctAnswer: "Return to the stronghold, you prisoners of hope. Even today I declare that I will restore double to you",
    bibleReference: "Zechariah 9:12",
    explanation: "God addresses His people as 'prisoners of hope', calling them to the stronghold of His covenant and promising double restoration.",
    explanationTelugu: "నిరీక్షణగల బంధీలారా, కోటను ఆశ్రయించుడి; రెట్టింపుగా మేలు చేసెదనని నేడు నేను మీకు తెలియజేయుచున్నాను."
  },
  {
    easyQ: "What supreme declaration of trust in divine mercy is made in Psalm 33:22?",
    easyQTe: "కీర్తన 33:22 లో దేవుని కృప మరియు నిరీక్షణను గూర్చి పలికిన పరమ ప్రార్థన ఏది?",
    medQ: "In Psalm 33:20-22, how do waiting on the Lord and rejoicing in His holy name frame our hope?",
    medQTe: "కీర్తన 33:20-22 లో యెహోవాకొరకు కనిపెట్టుచు ఆయన పరిశుద్ధ నామమందు ఆనందించుట నిరీక్షణను ఎలా స్థిరపరచును?",
    hardQ: "How does the psalmist calibrate the measure of expected divine lovingkindness directly to the measure of our active hope?",
    hardQTe: "'మేము నీకొరకు కనిపెట్టుచున్నట్లు నీ కృప మామీద ఉండును గాక' అను విన్నపము దేవుని కృప మరియు నిరీక్షణల మధ్య గల సంబంధమును ఎలా చాటుచున్నది?",
    options: ["Let Your mercy, O Lord, be upon us, just as we hope in You", "Give us forty war horses from the plains of Sharon", "Let our armies subdue seventy fortresses in Moab", "Build sixty stone altars along the borders of Jordan"],
    optionsTelugu: ["యెహోవా, మేము నీకొరకు కనిపెట్టుచున్నట్లు నీ కృప మామీద ఉండును గాక", "షారోను మైదానములనుండి నలభై యుద్ధ గుఱ్ఱములను మాకిమ్ము", "మా సైన్యములు మోయాబులోని డెబ్బై కోటలను జయించును గాక", "యొర్దాను సరిహద్దులలో అరవై రాతి బలిపీఠములను కట్టుదము గాక"],
    correctAnswer: "Let Your mercy, O Lord, be upon us, just as we hope in You",
    bibleReference: "Psalm 33:22",
    explanation: "The psalmist asks for God's steadfast love to rest upon His people in direct proportion to their faithful hope in Him.",
    explanationTelugu: "యెహోవా, మేము నీకొరకు కనిపెట్టుచున్నట్లు నీ కృప మామీద ఉండును గాక."
  },
  {
    easyQ: "In Psalm 39:7, what searching question and resolute answer does David give regarding his hope?",
    easyQTe: "కీర్తన 39:7 లో జీవిత అస్థిరతను చూచిన దావీదు తన నిరీక్షణను గూర్చి పలికిన నిర్ణయమేమి?",
    medQ: "According to Psalm 39:6-7, why does the fleeting vanity of human wealth drive the believer straight to hope in God?",
    medQTe: "కీర్తన 39:6-7 ప్రకారం లోక ధనసంపాదన వ్యర్థమని గ్రహించిన భక్తుడు తన నిరీక్షణను ఎవరియందు నిలిపెను?",
    hardQ: "How does radical existential disillusionment with worldly mortality become the launchpad for pure, God-centered hope?",
    hardQTe: "మానవ జీవితపు అల్పత్వమును ఎరుగుట లోక భ్రమలనుండి విడిపించి కేవలము దేవునియందే నిరీక్షణ యుంచుటకు ఎలా తోడ్పడును?",
    options: ["And now, Lord, what do I wait for? My hope is in You", "And now, Lord, give me forty bags of Ophir gold", "My hope is in my seventy mighty men of valor", "My confidence rests in thirty royal treaties with Tyre"],
    optionsTelugu: ["ప్రభువా, నేను దేనికొరకు కనిపెట్టుచున్నాను? నీయందే నా నిరీక్షణ యున్నది", "ప్రభువా, ఓఫీరు బంగారముతో నలభై సంచులను నాకు దయచేయుము", "నా డెబ్బైమంది పరాక్రమశాలురైన వీరులయందే నా నిరీక్షణ", "తీరుతో చేసిన ముప్పది రాజరికపు ఒప్పందములే నా ఆశ్రయము"],
    correctAnswer: "And now, Lord, what do I wait for? My hope is in You",
    bibleReference: "Psalm 39:7",
    explanation: "Confronted by the transience of human life and riches, David pivots away from earth, declaring his entire hope is anchored in God.",
    explanationTelugu: "కావున ప్రభువా, నేను దేనికొరకు కనిపెట్టుచున్నాను? నీయందే నా నిరీక్షణ యున్నది."
  },
  {
    easyQ: "What steadfast anchor in God's Word is proclaimed in Psalm 119:114?",
    easyQTe: "కీర్తన 119:114 లో దేవుని వాక్యమునందు నిరీక్షణను గూర్చి కీర్తనకారుడు పలికిన ఒప్పుకోలు ఏది?",
    medQ: "In Psalm 119:114, what two defensive shelters does the Lord provide to the one who hopes in His word?",
    medQTe: "కీర్తన 119:114 ప్రకారం తన వాక్యమందు నిరీక్షణయుంచువానికి యెహోవా ఏ రెండు ఆశ్రయములుగా ఉన్నాడు?",
    hardQ: "How does scriptural revelation provide the objective, unshakeable bedrock foundation for all true Christian hope?",
    hardQTe: "దేవుని లిఖిత వాక్యము మానవ కల్పనలను దాటి ఆత్మీయ నిరీక్షణకు ఏ నిశ్చలమైన బండపునాదిని వేయుచున్నది?",
    options: ["You are my hiding place and my shield; I hope in Your word", "You give me forty chariots against the King of Syria", "You build sixty towers on the walls of Zion", "You grant thirty talents of silver every month"],
    optionsTelugu: ["నాకు మరుగైన చోటు నా కేడెము నీవే; నీ వాక్యముమీద నేను నిరీక్షణ యుంచుచున్నాను", "సిరియా రాజుపై పోరాడుటకు నలభై రథములను నాకిచ్చితివి", "సీయోను ప్రాకారములపై అరవై గోపురములను నిర్మించితివి", "ప్రతి నెలా ముప్పది వెండి తలాంతులను నాకిచ్చితివి"],
    correctAnswer: "You are my hiding place and my shield; I hope in Your word",
    bibleReference: "Psalm 119:114",
    explanation: "The psalmist takes refuge behind God as his hiding place and protective shield, staking his life on the promises of Scripture.",
    explanationTelugu: "నాకు మరుగైన చోటు నా కేడెము నీవే; నీ వాక్యముమీద నేను నిరీక్షణ యుంచుచున్నాను."
  },
  {
    easyQ: "What earnest posture of waiting and hoping for the Lord is described in Psalm 130:5-6?",
    easyQTe: "కీర్తన 130:5-6 లో ఉదయముకొరకు కనిపెట్టు కావలివారికంటె ఎక్కువగా దేవునికొరకు కనిపెట్టు నిరీక్షణ ఎలా వర్ణించబడినది?",
    medQ: "According to Psalm 130:7, why is Israel summoned to hope in the Lord regarding redemption?",
    medQTe: "కీర్తన 130:7 ప్రకారం యెహోవాయొద్ద ఏ కృపయు సమృద్ధియైన విమోచనయు ఉన్నందున ఇశ్రాయేలు ఆయనయందు నిరీక్షణ యుంచవలెను?",
    hardQ: "How does deep penitence out of the depths (de profundis) give birth to radiant, assured hope in God's abundant redemption?",
    hardQTe: "పాపపు అగాధములలోనుండి చేసిన పశ్చాత్తాప ప్రార్థన దేవుని క్షమాకృపయందు ఏ ప్రకాశమానమైన నిరీక్షణను చిగురింపజేయును?",
    options: ["I wait for the Lord, my soul waits, and in His word I do hope. My soul waits for the Lord more than those who watch for the morning", "I wait forty days for the arrival of caravan merchants", "My soul seeks seventy pieces of Egyptian gold", "I watch thirty nights on the battlements of Babylon"],
    optionsTelugu: ["యెహోవాకొరకు నేను కనిపెట్టుచున్నాను, నా ప్రాణము కనిపెట్టుచున్నది; ఆయన మాటమీద నేను నిరీక్షణ యుంచుచున్నాను. ఉదయముకొరకు కనిపెట్టు కావలివారికంటె ఎక్కువగా నా ప్రాణము ప్రభువుకొరకు కనిపెట్టుచున్నది", "వర్తక బృందముల రాకకొరకు నలభై దినములు నేను కనిపెట్టుచున్నాను", "నా ప్రాణము డెబ్బై ఐగుప్తు బంగారు నాణెములను వెదకుచున్నది", "బబులోను బురుజులపై ముప్పది రాత్రులు నేను కావలికాయుచున్నాను"],
    correctAnswer: "I wait for the Lord, my soul waits, and in His word I do hope. My soul waits for the Lord more than those who watch for the morning",
    bibleReference: "Psalm 130:5-7",
    explanation: "The psalmist's soul waits eagerly for the Lord, resting hope in His Word more intensely than night watchmen long for the dawn.",
    explanationTelugu: "యెహోవాకొరకు నేను కనిపెట్టుచున్నాను, నా ప్రాణము కనిపెట్టుచున్నది; ఆయన మాటమీద నేను నిరీక్షణ యుంచుచున్నాను. ఉదయముకొరకు కనిపెట్టు కావలివారికంటె ఎక్కువగా నా ప్రాణము ప్రభువుకొరకు కనిపెట్టుచున్నది."
  },
  {
    easyQ: "What beatitude of happiness is pronounced in Psalm 146:5 on the one who hopes in God?",
    easyQTe: "కీర్తన 146:5 లో తన దేవుడైన యెహోవామీద నిరీక్షణయుంచువానిని గూర్చి పలికిన ధన్యత ఏది?",
    medQ: "In Psalm 146:3-5, why does trusting in princes fail while hoping in the God of Jacob brings lasting blessedness?",
    medQTe: "కీర్తన 146:3-5 ప్రకారం రాజులయందు మనుష్యులయందు నమ్మకముంచుట వ్యర్థమనియు, యాకోబు దేవునిపై నిరీక్షణయుంచువాడు ఎందుకు ధన్యుడనియు చెప్పబడినది?",
    hardQ: "How does the mortality of human rulers contrast with the eternal reign of the Creator who guarantees the believer's hope?",
    hardQTe: "చనిపోయే మానవ అధిపతుల బలహీనతను దాటి సృష్టికర్తయైన దేవునియందు నిరీక్షణ యుంచుట ఏ శాశ్వత ధన్యతను తెచ్చును?",
    options: ["Happy is he who has the God of Jacob for his help, whose hope is in the Lord his God", "Happy is he who amasses forty chariots of bronze", "Happy is the king who rules seventy desert cities", "Happy is the merchant who owns sixty ships in Tyre"],
    optionsTelugu: ["ఎవనికి యాకోబు దేవుడు సహాయకుడగునో, ఎవడు తన దేవుడైన యెహోవామీద నిరీక్షణ యుంచునో వాడు ధన్యుడు", "నలభై ఇత్తడి రథములను కూడబెట్టుకొనువాడు ధన్యుడు", "డెబ్బై ఎడారి పట్టణములను ఏలు రాజు ధన్యుడు", "తీరు సముద్రములో అరవై ఓడలు గల వర్తకుడు ధన్యుడు"],
    correctAnswer: "Happy is he who has the God of Jacob for his help, whose hope is in the Lord his God",
    bibleReference: "Psalm 146:5",
    explanation: "True happiness belongs to the person who rejects fragile reliance on mortal rulers, anchoring all hope in the eternal God of Jacob.",
    explanationTelugu: "ఎవనికి యాకోబు దేవుడు సహాయకుడగునో, ఎవడు తన దేవుడైన యెహోవామీద నిరీక్షణ యుంచునో వాడు ధన్యుడు."
  },
  {
    easyQ: "What contrast between the hope of the righteous and the expectation of the wicked is drawn in Proverbs 10:28?",
    easyQTe: "సామెతలు 10:28 లో నీతిమంతుల నిరీక్షణకును భక్తిహీనుల ఆశకును మధ్య చూపబడిన వ్యత్యాసమేమి?",
    medQ: "According to Proverbs 10:28, what emotion is the ultimate fruit of the hope of the righteous?",
    medQTe: "సామెతలు 10:28 ప్రకారం నీతిమంతుల నిరీక్షణ చివరకు దేనిగా మారును?",
    hardQ: "Why does the hope of the righteous culminate in everlasting gladness while godless ambitions end in catastrophic ruin?",
    hardQTe: "నీతిమంతుల నిరీక్షణ సంతోషముగా ముగియుటకును భక్తిహీనుల ఆశ భంగమై నశించుటకును గల నిత్య ఆత్మీయ కారణమేమి?",
    options: ["The hope of the righteous will be gladness, but the expectation of the wicked will perish", "The hope of the righteous gathers forty shields of iron", "The wicked inherit sixty palaces in Zion", "Both righteous and wicked share thirty identical fates"],
    optionsTelugu: ["నీతిమంతుల నిరీక్షణ సంతోషము పుట్టించును, భక్తిహీనుల ఆశ భంగమగును", "నీతిమంతుల నిరీక్షణ నలభై ఇనుప డాలులను సమకూర్చును", "భక్తిహీనులు సీయోనులో అరవై రాజభవనములను పొందుదురు", "నీతిమంతులు దుష్టులు అందరును ముప్పది ఒకే విధమైన గతులను పంచుకొందురు"],
    correctAnswer: "The hope of the righteous will be gladness, but the expectation of the wicked will perish",
    bibleReference: "Proverbs 10:28",
    explanation: "The righteous will see their godly hopes blossom into eternal joy, whereas the selfish expectations of the wicked end in futility.",
    explanationTelugu: "నీతిమంతుల నిరీక్షణ సంతోషము పుట్టించును, భక్తిహీనుల ఆశ భంగమగును."
  },
  {
    easyQ: "What apostolic description of the gospel's eternal anchor is penned in Colossians 1:5?",
    easyQTe: "కొలొస్సయులకు 1:5 లో సువార్త సత్యవాక్యము ద్వారా పరలోకమందు భద్రపరచబడిన నిరీక్షణ ఏమని వర్ణించబడినది?",
    medQ: "According to Colossians 1:5, where is this hope safely stored up for believers?",
    medQTe: "కొలొస్సయులకు 1:5 ప్రకారం ఈ నిరీక్షణ విశ్వాసులకొరకు ఎక్కడ భద్రపరచబడియున్నది?",
    hardQ: "How does the objective heavenly reservation of our hope protect it against all earthly decay and persecution?",
    hardQTe: "పరలోకమందు మనకొరకు భద్రపరచబడిన నిరీక్షణ భూసంబంధమైన నష్టములు హింసలచేత ఎందుకు నాశనము కాజాలదు?",
    options: ["Because of the hope which is laid up for you in heaven, of which you heard before in the word of the truth of the gospel", "Because forty golden shields are kept in the temple treasury", "Because seventy kings guaranteed your tax exemptions", "Because your ancestors built thirty watchtowers in Judah"],
    optionsTelugu: ["పరలోకమందు మీకొరకు భద్రము చేయబడిన నిరీక్షణనుబట్టి... సువార్త సత్యవాక్యమువలన ఆ నిరీక్షణనుగూర్చి మీరు మునుపు వింటిరి", "దేవాలయ ఖజానాలో నలభై బంగారు డాలులు భద్రపరచబడినందున", "డెబ్బైమంది రాజులు మీ పన్ను మినహాయింపులకు హామీ ఇచ్చినందున", "యూదాలో మీ పూర్వీకులు ముప్పది కావలి బురుజులను నిర్మించినందున"],
    correctAnswer: "Because of the hope which is laid up for you in heaven, of which you heard before in the word of the truth of the gospel",
    bibleReference: "Colossians 1:5",
    explanation: "Christian hope is impervious to earthly loss because it is securely deposited in heaven, revealed through the truth of the Gospel.",
    explanationTelugu: "పరలోకమందు మీకొరకు భద్రము చేయబడిన నిరీక్షణనుబట్టి ఈ ప్రేమ మీకు కలిగెను. పూర్వమందు సత్యమును తెలియజేయు సువార్త వాక్యమువలన ఆ నిరీక్షణనుగూర్చి మీరు వింటిరి."
  },
  {
    easyQ: "What three abiding virtues are united by Paul in 1 Thessalonians 1:3?",
    easyQTe: "1 థెస్సలొనీకయులకు 1:3 లో విశ్వాసము, ప్రేమలతోపాటు నిరీక్షణ యొక్క ఏ గుణమును పౌలు స్మరించుకొనెను?",
    medQ: "In 1 Thessalonians 1:3, what specific work, labor, and patience are attributed to faith, love, and hope?",
    medQTe: "1 థెస్సలొనీకయులకు 1:3 ప్రకారం విశ్వాసమునకు, ప్రేమకు, నిరీక్షణకు ఆపాదించబడిన మూడు ఆత్మీయ కార్యములేవి?",
    hardQ: "How does 'patience of hope in our Lord Jesus Christ' enable sustained endurance through prolonged persecution?",
    hardQTe: "మన ప్రభువైన యేసుక్రీస్తునందలి నిరీక్షణవలన కలిగిన ఓర్పు శ్రమలలో విశ్వాసులను ఎలా నడిపించును?",
    options: ["Your work of faith, labor of love, and patience of hope in our Lord Jesus Christ in the sight of our God and Father", "Your building of forty synagogues across Macedonia", "Your collection of sixty talents of silver for Rome", "Your memorization of thirty traditional oral codes"],
    optionsTelugu: ["విశ్వాసముతో కూడిన మీ పనిని, ప్రేమతో కూడిన మీ ప్రయాసమును, మన ప్రభువైన యేసుక్రీస్తునందలి నిరీక్షణతో కూడిన మీ ఓర్పును జ్ఞాపకము చేసికొనుచున్నాము", "మాసిదోనియయంతటను నలభై సమాజమందిరములను మీరు నిర్మించుట", "రోముకొరకు అరవై వెండి తలాంతులను మీరు వసూలు చేయుట", "ముప్పది పారంపర్యాచార నియమములను మీరు కంఠస్థము చేయుట"],
    correctAnswer: "Your work of faith, labor of love, and patience of hope in our Lord Jesus Christ in the sight of our God and Father",
    bibleReference: "1 Thessalonians 1:3",
    explanation: "Paul celebrates the triad of active faith, sacrificial love, and patient hope anchored in Jesus Christ before God the Father.",
    explanationTelugu: "విశ్వాసముతో కూడిన మీ పనిని, ప్రేమతో కూడిన మీ ప్రయాసమును, మన ప్రభువైన యేసుక్రీస్తునందలి నిరీక్షణతో కూడిన మీ ఓర్పును మా దేవుడైన తండ్రియెదుట మేము మానక జ్ఞాపకము చేసికొనుచున్నాము."
  },
  {
    easyQ: "What helmet of protection does the Christian warrior put on in 1 Thessalonians 5:8?",
    easyQTe: "1 థెస్సలొనీకయులకు 5:8 లో ఆత్మీయ పోరాటములో విశ్వాసి శిరస్త్రాణముగా దేనిని ధరించుకొనవలెను?",
    medQ: "According to 1 Thessalonians 5:8, how does the 'hope of salvation' guard the believer's mind against deception and discouragement?",
    medQTe: "1 థెస్సలొనీకయులకు 5:8 ప్రకారం 'రక్షణ నిరీక్షణయను శిరస్త్రాణము' విశ్వాసి ఆలోచనలను మనస్సును ఎలా కాపాడును?",
    hardQ: "Why is the head (mind/intellect) specifically protected by the helmet of hope in spiritual warfare?",
    hardQTe: "ఆత్మీయ యుద్ధములో సందేహములు నిరాశలు రాకుండా తలకు రక్షణ నిరీక్షణయను శిరస్త్రాణమును ధరించుకొనుట ఏ నైతిక భద్రతనిచ్చును?",
    options: ["And as a helmet the hope of salvation", "A helmet of forty bronze plates from Syria", "A shield of thirty layers of cedar wood", "A crown of sixty golden laurel leaves"],
    optionsTelugu: ["రక్షణ నిరీక్షణయను శిరస్త్రాణమును ధరించుకొందము", "సిరియానుండి తెచ్చిన నలభై ఇత్తడి రేకుల శిరస్త్రాణము", "ముప్పది పొరల దేవదారు చెక్క డాలు", "అరవై బంగారు ఆకుల కిరీటము"],
    correctAnswer: "And as a helmet the hope of salvation",
    bibleReference: "1 Thessalonians 5:8",
    explanation: "Believers guard their thought-life against despair and lies by strapping on the unassailable helmet of the hope of final salvation.",
    explanationTelugu: "మనోనిబ్బరము కలిగి, విశ్వాసప్రేమలను కవచమును, రక్షణ నిరీక్షణయను శిరస్త్రాణమును ధరించుకొందము."
  },
  {
    easyQ: "What command regarding our confession of hope is given in Hebrews 10:23?",
    easyQTe: "హెబ్రీయులకు 10:23 లో మన నిరీక్షణ ఒప్పుకోలు విషయములో ఏ గంభీరమైన ఆజ్ఞ ఇవ్వబడినది?",
    medQ: "According to Hebrews 10:23, why can believers hold fast the confession of hope without wavering?",
    medQTe: "హెబ్రీయులకు 10:23 ప్రకారం చలించకుండ నిరీక్షణను గట్టిగా పట్టుకొనుటకు దేవుని ఏ సుగుణము కారణము?",
    hardQ: "How does the immutable faithfulness of the Promiser (pistos ho epaggeilamenos) undergird human perseverance in hope?",
    hardQTe: "వాగ్దానము చేసిన దేవుడు నమ్మదగినవాడై యుండుట విశ్వాసి నిరీక్షణను ఎన్నడును సడలనివ్వకుండా ఎలా కాపాడును?",
    options: ["Let us hold fast the confession of our hope without wavering, for He who promised is faithful", "Let us build forty altars to make new vows", "Let us retreat into sixty days of silent fasting", "Let us consult thirty elders in Jerusalem"],
    optionsTelugu: ["వాగ్దానము చేసినవాడు నమ్మదగినవాడు గనుక మన నిరీక్షణయొక్క ఒప్పుకోలును చలింపకుండ దృఢముగా పట్టుకొందము", "క్రొత్త మొక్కుబడులు చేయుటకు నలభై బలిపీఠములను కట్టుదము", "అరవై దినముల నిశ్శబ్ద ఉపవాసములోనికి వెళ్లిపోవుదము", "యెరూషలేములోని ముప్పదిమంది పెద్దలను సంప్రదించుదము"],
    correctAnswer: "Let us hold fast the confession of our hope without wavering, for He who promised is faithful",
    bibleReference: "Hebrews 10:23",
    explanation: "We are urged to grip our confession of hope tenaciously without flinching, anchored entirely on the unwavering faithfulness of God.",
    explanationTelugu: "వాగ్దానము చేసినవాడు నమ్మదగినవాడు గనుక మన నిరీక్షణయొక్క ఒప్పుకోలును చలింపకుండ దృఢముగా పట్టుకొందము."
  },
  {
    easyQ: "How does the apostle Paul encourage grieving Christians regarding deceased believers in 1 Thessalonians 4:13?",
    easyQTe: "1 థెస్సలొనీకయులకు 4:13 లో నిద్రించిన విశ్వాసుల విషయములో నిరీక్షణలేని ఇతరులవలె దుఃఖపడకూడదని పౌలు ఏమని ఓదార్చెను?",
    medQ: "According to 1 Thessalonians 4:13-14, why is Christian grief radically different from the despair of the world?",
    medQTe: "1 థెస్సలొనీకయులకు 4:13-14 ప్రకారం లోకపు నిరాశాపూరిత దుఃఖముకంటె క్రీస్తునందలి మరణపు దుఃఖము ఎలా వేరుగా ఉండును?",
    hardQ: "How does the bodily resurrection of Jesus Christ transform Christian bereavement with the absolute certainty of reunion?",
    hardQTe: "యేసు మృతిపొంది లేచెనను విశ్వాసము నిద్రించిన పరిశుద్ధుల పునరుత్థానమును మరియు క్రీస్తు రాకడలో నిత్య కలయికను ఎలా స్థిరపరచును?",
    options: ["Do not sorrow as others who have no hope, for if we believe that Jesus died and rose again, even so God will bring with Him those who sleep in Jesus", "Wail forty days and tear forty garments like the pagans", "Banish the memory of the dead into thirty years of silence", "Pay sixty silver talents for temple memorial inscriptions"],
    optionsTelugu: ["నిరీక్షణలేని ఇతరులవలె మీరు దుఃఖపడకుండునట్లు... యేసు మృతిపొంది లేచెనని మనము నమ్మినయెడల, క్రీస్తునందు నిద్రించినవారిని దేవుడాయనతోకూడ వెంటబెట్టుకొని వచ్చును", "అన్యజనులవలె నలభై దినములు రోదన చేసి నలభై వస్త్రములను చింపుకొనుడి", "ముప్పది సంవత్సరముల నిశ్శబ్దములో మరణించినవారి జ్ఞాపకములను మరచిపోవుడి", "దేవాలయ స్మారక స్తంభములకొరకు అరవై వెండి తలాంతులు చెల్లించుడి"],
    correctAnswer: "Do not sorrow as others who have no hope, for if we believe that Jesus died and rose again, even so God will bring with Him those who sleep in Jesus",
    bibleReference: "1 Thessalonians 4:13-14",
    explanation: "Christians do not mourn death with hopeless despair, because Jesus' resurrection guarantees the bodily resurrection and reunion of all saints.",
    explanationTelugu: "నిరీక్షణలేని ఇతరులవలె మీరు దుఃఖపడకుండునట్లు... యేసు మృతిపొంది లేచెనని మనము నమ్మినయెడల, అటువలెనే యేసునందు నిద్రించినవారిని దేవుడాయనతోకూడ వెంటబెట్టుకొని వచ్చును."
  },
  {
    easyQ: "What eternal doxology of hope in God's mercy concludes Psalm 147:11?",
    easyQTe: "కీర్తన 147:11 లో యెహోవా ఎవరియందు ఆనందించును మరియు ఎవరియందు సంతోషించును?",
    medQ: "According to Psalm 147:10-11, why does the Lord take no pleasure in the legs of a man or strength of a horse, but delights in those who hope in His mercy?",
    medQTe: "కీర్తన 147:10-11 ప్రకారం గుర్రముల బలమునందు కాక తన కృపకొరకు నిరీక్షించువారియందు దేవుడు ఎందుకు ఆనందించును?",
    hardQ: "Why does relying on military or physical strength alienate from grace, while humble hope in divine chesed attracts God's pleasure?",
    hardQTe: "మానవ బాహుబలముపై ఆధారపడుటను కాక దేవుని కృపయందే నిరీక్షణయుంచుట ఆయన హృదయమును ఎలా సంతోషపెట్టును?",
    options: ["The Lord takes pleasure in those who fear Him, in those who hope in His mercy", "The Lord delights in sixty swift chariots from Egypt", "The Lord favors those who build forty stone monuments", "The Lord rejoices in forty thousand armed horsemen"],
    optionsTelugu: ["యెహోవా తనయందు భయభక్తులు గలవారియందు, తన కృపకొరకు కనిపెట్టువారియందు (నిరీక్షించువారియందు) ఆనందించువాడై యున్నాడు", "ఐగుప్తునుండి వచ్చు అరవై వేగవంతమైన రథములయందు ప్రభువు ఆనందించును", "నలభై రాతి స్తంభములను నిలుపువారియందు దేవుడు ఇష్టపడును", "నలభై వేలమంది ఆయుధధారులైన రౌతులయందు ప్రభువు సంతోషించును"],
    correctAnswer: "The Lord takes pleasure in those who fear Him, in those who hope in His mercy",
    bibleReference: "Psalm 147:11",
    explanation: "God takes no delight in mortal military might, but finds His supreme joy in humble people who revere Him and rest their hope in His mercy.",
    explanationTelugu: "గుఱ్ఱముల బలమునందు ఆయన సంతోషింపడు, నరుల కాళ్లయందు ఆయన ఆనందింపడు; యెహోవా తనయందు భయభక్తులు గలవారియందు, తన కృపకొరకు కనిపెట్టువారియందు ఆనందించువాడై యున్నాడు."
  },
  {
      "easyQ": "What divine deliverance does Psalm 33:18-19 promise to those who hope in God's mercy?",
      "easyQTe": "కీర్తన 33:18-19 లో దేవుని కృపకొరకు కనిపెట్టువారికి (నిరీక్షించువారికి) ఏ దైవిక రక్షణ వాగ్దానము చేయబడినది?",
      "medQ": "According to Psalm 33:18-19, how does the eye of the Lord watch over those who hope in His steadfast love during famine?",
      "medQTe": "కీర్తన 33:18-19 ప్రకారం కరువుకాలములో ప్రాణములను కాపాడుటకు యెహోవా దృష్టి ఎవరిపై ఉండును?",
      "hardQ": "What theological truth is established by God's providential eye delivering mortal souls from famine through covenant mercy?",
      "hardQTe": "మరణమునుండి ప్రాణములను విడిపించుటకు యెహోవా కటాక్షము ఆయన కృపకొరకు కనిపెట్టువారిపై ఉండుట ఏ విశ్వాస నిశ్చయతను ఇచ్చును?",
      "options": [
          "Behold, the eye of the Lord is on those who fear Him, on those who hope in His mercy, to deliver their soul from death, and to keep them alive in famine",
          "He relies on forty storehouses built by pagan governors",
          "He deposits sixty silver talents in the royal treasury",
          "He commands thirty chariots to guard the borders"
      ],
      "optionsTelugu": [
          "మరణమునుండి వారి ప్రాణమును విమిచించుటకును, కరవులో వారిని సజీవులనుగా కాపాడుటకును, యెహోవా దృష్టి ఆయనయందు భయభక్తులు గలవారిమీదను ఆయన కృపకొరకు కనిపెట్టువారిమీదను ఉన్నది",
          "అన్య గవర్నర్లు నిర్మించిన నలభై ధాన్యాగారములపై ఆయన ఆధారపడును",
          "రాజ ఖజానాలో అరవై వెండి తలాంతులను జమచేయును",
          "సరిహద్దులను కాపాడుటకు ముప్పది రథములను ఆదేశించును"
      ],
      "correctAnswer": "Behold, the eye of the Lord is on those who fear Him, on those who hope in His mercy, to deliver their soul from death, and to keep them alive in famine",
      "bibleReference": "Psalm 33:18-19",
      "explanation": "God's watchful eye guards those who reverently hope in His mercy, preserving their lives even through severe famine.",
      "explanationTelugu": "మరణమునుండి వారి ప్రాణమును విమిచించుటకును, కరవులో వారిని సజీవులనుగా కాపాడుటకును యెహోవా దృష్టి ఆయన కృపకొరకు కనిపెట్టువారిమీద ఉన్నది."
  },
  {
      "easyQ": "What unceasing resolve of hope does the psalmist declare in Psalm 71:14?",
      "easyQTe": "కీర్తన 71:14 లో భక్తుడు నిరీక్షణను గూర్చి ఏ నిరంతర తీర్మానమును చేసెను?",
      "medQ": "According to Psalm 71:14, how does continual hope fuel increasingly abundant praise toward God?",
      "medQTe": "కీర్తన 71:14 ప్రకారం నిరంతర నిరీక్షణ దేవునికి చెల్లించే స్తుతిని ఎలా అధికము చేయును?",
      "hardQ": "How does the discipline of hoping continually in God overcome the accumulating infirmities of advanced age?",
      "hardQTe": "వృద్ధాప్య శ్రమలలో సైతం దేవునియందే నిత్యము నిరీక్షణయుంచుట ఆత్మకు ఏ నూతన స్తుతి బలమును ఇచ్చును?",
      "options": [
          "But I will hope continually, and will praise You yet more and more",
          "I will hide in thirty dark caves of Judea",
          "I will offer forty rams on the high hills",
          "I will cease praying after sixty silent days"
      ],
      "optionsTelugu": [
          "నేనైతే ఎల్లప్పుడును నిరీక్షించుచు మరింత యెక్కువగా నిన్ను స్తుతించెదను",
          "యూదయలోని ముప్పది చీకటి గుహలలో దాగుకొందును",
          "ఎత్తయిన కొండలపై నలభై పొట్టేళ్లను బలియిచ్చెదను",
          "అరవై నిశ్శబ్ద దినముల తరువాత ప్రార్థించుట మానుకొందును"
      ],
      "correctAnswer": "But I will hope continually, and will praise You yet more and more",
      "bibleReference": "Psalm 71:14",
      "explanation": "The psalmist resolves to maintain uninterrupted hope, transforming patient waiting into ever-increasing praise.",
      "explanationTelugu": "నేనైతే ఎల్లప్పుడును నిరీక్షించుచు మరింత యెక్కువగా నిన్ను స్తుతించెదను; నా నోరు రోజంతయు నీ నీతిని నీ రక్షణను వర్ణించును."
  },
  {
      "easyQ": "According to Psalm 78:7, why must parents teach God's wondrous works to the next generation?",
      "easyQTe": "కీర్తన 78:7 ప్రకారం రాబోవు తరములకు దేవుని ఆశ్చర్యకార్యములను ఎందుకు బోధించవలెను?",
      "medQ": "In Psalm 78:6-7, what three generational fruits arise from passing down divine truth?",
      "medQTe": "కీర్తన 78:6-7 లో దైవిక సత్యములను పిల్లలకు నేర్పుటవలన కలుగు మూడు ఆత్మీయ ఫలితములేవి?",
      "hardQ": "How does transgenerational catechesis protect the covenant community from repeating historic ancestral apostasy?",
      "hardQTe": "దేవునియందు నిరీక్షణయుంచి ఆయన ఆజ్ఞలను గైకొనునట్లు పిల్లలకు బోధించుట విశ్వాస వారసత్వమును ఎలా కాపాడును?",
      "options": [
          "That they may set their hope in God, and not forget the works of God, but keep His commandments",
          "That they might amass sixty talents of gold in commerce",
          "That they might conquer forty Canaanite cities by force",
          "That they might build thirty royal palaces in Samaria"
      ],
      "optionsTelugu": [
          "వారు తమ నిరీక్షణను దేవునియందుంచి, దేవుని క్రియలను మరచిపోక ఆయన ఆజ్ఞలను గైకొనునట్లు తరములవారికి బోధింపవలెను",
          "వారు వాణిజ్యములో అరవై బంగారు తలాంతులను సంపాదించునట్లు",
          "నలభై కనాను నగరములను బలవంతముగా జయించునట్లు",
          "షమ్రోనులో ముప్పది రాజభవనములను నిర్మించునట్లు"
      ],
      "correctAnswer": "That they may set their hope in God, and not forget the works of God, but keep His commandments",
      "bibleReference": "Psalm 78:7",
      "explanation": "God commanded fathers to teach His mighty deeds so future generations would place their hope squarely in God and obey His commandments.",
      "explanationTelugu": "వారు దేవుని క్రియలను మరచిపోక ఆయన ఆజ్ఞలను గైకొనుచు, తమ నిరీక్షణను దేవునియందుంచునట్లు వారి పిల్లలకు తెలియజేయవలెను."
  },
  {
      "easyQ": "What harmonious balance between hope and obedience is expressed in Psalm 119:166?",
      "easyQTe": "కీర్తన 119:166 లో నిరీక్షణకును ఆజ్ఞా పాలనకును గల పవిత్ర సంబంధమేమి?",
      "medQ": "According to Psalm 119:166, how does hoping for God's salvation inspire diligent observance of His commandments?",
      "medQTe": "కీర్తన 119:166 ప్రకారం దేవుని రక్షణకొరకైన నిరీక్షణ ఆయన ఆజ్ఞలను పాటించుటకు ఎలా నడిపించును?",
      "hardQ": "Why is genuine biblical hope always ethically active rather than passive antinomian presumption?",
      "hardQTe": "దేవుని రక్షణ నిరీక్షణగల విశ్వాసి కేవలము నిష్క్రియుడుగా ఉండక ఆయన కట్టడలను ఎలా ఉత్సాహముతో నెరవేర్చును?",
      "options": [
          "Lord, I hope for Your salvation, and I do Your commandments",
          "Lord, I built forty stone gates in the temple",
          "Lord, I fasted sixty weeks in the wilderness",
          "Lord, I recited seventy legal statutes without faith"
      ],
      "optionsTelugu": [
          "యెహోవా, నీ రక్షణకొరకు నేను కనిపెట్టుచున్నాను (నిరీక్షించుచున్నాను), నీ ఆజ్ఞలను అనుసరించి నడుచుకొనుచున్నాను",
          "ప్రభువా, నేను ఆలయములో నలభై రాతి గుమ్మములను కట్టితిని",
          "ప్రభువా, నేను అరణ్యములో అరవై వారములు ఉపవాసముంటిని",
          "ప్రభువా, విశ్వాసము లేకుండ డెబ్బై ధర్మశాస్త్ర విధులను వల్లెవేసితిని"
      ],
      "correctAnswer": "Lord, I hope for Your salvation, and I do Your commandments",
      "bibleReference": "Psalm 119:166",
      "explanation": "True hope in God's ultimate salvation naturally manifests in joyful, daily obedience to His moral commands.",
      "explanationTelugu": "యెహోవా, నీ రక్షణకొరకు నేను కనిపెట్టుచున్నాను, నీ ఆజ్ఞలను అనుసరించి నడుచుకొనుచున్నాను."
  },
  {
      "easyQ": "What timeless call to hope closes the humble pilgrimage song in Psalm 131:3?",
      "easyQTe": "కీర్తన 131:3 లో ఇశ్రాయేలునకు ఇవ్వబడిన నిత్య నిరీక్షణ పిలుపు ఏది?",
      "medQ": "In Psalm 131:2-3, how does a soul calmed like a weaned child rest in hope from this time forth and forever?",
      "medQTe": "కీర్తన 131:2-3 లో చనుబాలు విడిచిన పిల్లను పోలిన నెమ్మదిగల హృదయముతో దేవునియందు ఎలా నిరీక్షించవలెను?",
      "hardQ": "How does weaning from self-aggrandizement liberate the community into perpetual, childlike hope in Yahweh?",
      "hardQTe": "గర్వపు ఆలోచనలను విడిచి తల్లీయొద్దనున్న పాలువిడిచిన బిడ్డవలె శాంతపరచుకొని దేవునియందే నిరంతరము నిరీక్షణయుంచుట ఏ ఆత్మీయ ఉన్నతిని తెచ్చును?",
      "options": [
          "O Israel, hope in the Lord from this time forth and forever",
          "O Israel, march forty days around Mount Hermon",
          "O Israel, gather sixty thousand spears for battle",
          "O Israel, build thirty altars on the high hills"
      ],
      "optionsTelugu": [
          "ఇశ్రాయేలూ, ఇది మొదలుకొని నిరంతరము యెహోవామీదనే నిరీక్షణ యుంచుము",
          "ఇశ్రాయేలూ, హెర్మోను పర్వతముచుట్టూ నలభై దినములు ప్రదక్షిణ చేయుము",
          "ఇశ్రాయేలూ, యుద్ధముకొరకు అరవై వేల ఈటెలను సమకూర్చుకొనుము",
          "ఇశ్రాయేలూ, ఎత్తయిన కొండలపై ముప్పది బలిపీఠములను నిర్మించుము"
      ],
      "correctAnswer": "O Israel, hope in the Lord from this time forth and forever",
      "bibleReference": "Psalm 131:3",
      "explanation": "After quieting pride like a weaned child, the psalmist summons Israel to unending hope in the Lord forever.",
      "explanationTelugu": "ఇశ్రాయేలూ, ఇది మొదలుకొని నిరంతరము యెహోవామీదనే నిరీక్షణ యుంచుము."
  },
  {
      "easyQ": "In Ezra 10:2, what encouraging word of hope did Shechaniah speak despite widespread covenant failure?",
      "easyQTe": "ఎజ్రా 10:2 లో ప్రజలు చేసిన మహా పాపము మధ్యలో సైతం షెకన్యా పలికిన ఆదరణకరమైన నిరీక్షణ మాటేమి?",
      "medQ": "According to Ezra 10:2, why was there still hope in Israel if the people truly repented before God?",
      "medQTe": "ఎజ్రా 10:2 ప్రకారం దేవుని సన్నిధిలో పశ్చాత్తాపపడి సరిదిద్దుకొనినయెడల ఇశ్రాయేలునకు ఏ నిరీక్షణ మిగిలియున్నది?",
      "hardQ": "How does redemptive hope differ from fatalistic despair when confronting severe spiritual backsliding?",
      "hardQTe": "తీవ్రమైన పాపములో పడినను దేవుని కృపయందు నిరీక్షణయుంచి పశ్చాత్తాపపడుట సమాజమును సంపూర్ణ నాశనమునుండి ఎలా కాపాడును?",
      "options": [
          "Yet now there is hope in Israel in spite of this",
          "Israel must endure forty years of wandering in Moab",
          "All sixty families must be exiled without pity",
          "There is no forgiveness under the ancient law"
      ],
      "optionsTelugu": [
          "ఈ సంగతినిగూర్చి యికను ఇశ్రాయేలీయులకు నిరీక్షణ కలదు",
          "ఇశ్రాయేలు మోయాబులో నలభై సంవత్సరముల సంచారమును అనుభవించవలెను",
          "అరవై కుటుంబములు కనికరములేకుండ వెలివేయబడవలెను",
          "పురాతన ధర్మశాస్త్రములో ఎట్టి క్షమాపణ లభించదు"
      ],
      "correctAnswer": "Yet now there is hope in Israel in spite of this",
      "bibleReference": "Ezra 10:2",
      "explanation": "Even after serious unfaithfulness, Shechaniah proclaimed that genuine repentance opens a door of divine hope for Israel.",
      "explanationTelugu": "మేము మా దేవునికి విరోధముగా పాపము చేసితిమి... అయినను ఈ సంగతినిగూర్చి యికను ఇశ్రాయేలీయులకు నిరీక్షణ కలదు."
  },
  {
      "easyQ": "What poignant reflection on maternal hope did Naomi express to her daughters-in-law in Ruth 1:12?",
      "easyQTe": "రూతు 1:12 లో తన కోడండ్రతో నయోమి మాట్లాడినప్పుడు నిరీక్షణను గూర్చి ఏ వేదనభరితమైన మాట పలికెను?",
      "medQ": "In Ruth 1:11-13, why did Naomi consider her natural prospects of providing sons completely hopeless?",
      "medQTe": "రూతు 1:11-13 లో భౌతిక దృక్పథములో తనకు కుమారులు పుట్టునను ఆశ లేదని నయోమి ఎందుకు నిరాశ చెందెను?",
      "hardQ": "How does the Book of Ruth demonstrate God's providence resurrecting family hope far beyond human biological limitations?",
      "hardQTe": "మానవ అంచనాలకు అసాధ్యమైన పరిస్థితిలో దేవుని కృప రూతు బోయజులద్వారా నయోమి వంశమునకు ఎలా నూతన నిరీక్షణను చిగురింపజేసెను?",
      "options": [
          "Turn back, my daughters... even if I should say I have hope, even if I should have a husband tonight and bear sons",
          "Follow me forty miles into the plains of Edom",
          "Offer sixty sheaves of barley at the gates of Moab",
          "Fast thirty days under the terebinth tree"
      ],
      "optionsTelugu": [
          "నా కుమార్తెలారా, తిరిగి వెళ్లుడి... నాకు నిరీక్షణ కలదని నేను అనుకొనినను, ఈ రాత్రియే నాకు పెనిమిటి కలిగి నేను కుమారులను కనినను",
          "నాతోకూడ ఎదోము మైదానములలోనికి నలభై మైళ్లు నడువుడి",
          "మోయాబు గుమ్మములయొద్ద అరవై యవల కట్టలను సమర్పించుడి",
          "మస్తకి వృక్షము క్రింద ముప్పది దినములు ఉపవాసముండుడి"
      ],
      "correctAnswer": "Turn back, my daughters... even if I should say I have hope, even if I should have a husband tonight and bear sons",
      "bibleReference": "Ruth 1:12",
      "explanation": "Naomi lamented that humanly speaking she had no hope of bearing more sons, setting the stage for God's supernatural redemptive provision.",
      "explanationTelugu": "నా కుమార్తెలారా, తిరిగి వెళ్లుడి... నాకు నిరీక్షణ కలదని నేను అనుకొనినను, ఈ రాత్రియే నాకు పెనిమిటి కలిగి నేను కుమారులను కనినను, వారు పెద్దవారగువరకు మీరు కనిపెట్టుదురా?"
  },
  {
      "easyQ": "What promise of global hope in God's arm is proclaimed in Isaiah 51:5?",
      "easyQTe": "యెషయా 51:5 లో ద్వీపములు దేవుని బాహువుపై ఏ నిరీక్షణయుంచునని ప్రవచింపబడినది?",
      "medQ": "According to Isaiah 51:5, how do the distant coastlands wait upon Yahweh and trust in His arm for righteousness?",
      "medQTe": "యెషయా 51:5 ప్రకారం దూరపు ద్వీపములు దేవుని రక్షణ మరియు నీతికై ఆయన బాహుబలముమీద ఎలా నిరీక్షించును?",
      "hardQ": "How does the prophetic extension of divine salvation to maritime Gentile nations fulfill the Abrahamic covenant?",
      "hardQTe": "భూదిగంతముల ద్వీపవాసులు సైతం దేవుని బాహువుపై నిరీక్షణయుంచుదురను వాగ్దానము సర్వజనుల రక్షణ సంకల్పమును ఎలా చాటుచున్నది?",
      "options": [
          "The coastlands will wait upon Me, and on My arm they will trust",
          "The islands will assemble forty warships of cedar",
          "The nations will bring sixty talents of copper to Zion",
          "The governors will establish thirty pagan sanctuaries"
      ],
      "optionsTelugu": [
          "ద్వీపములు నాకొరకు కనిపెట్టుచున్నవి, అవి నా బాహువుమీద నిరీక్షణ యుంచును",
          "ద్వీపములు నలభై దేవదారు యుద్ధనౌకలను సమకూర్చును",
          "జనములు సీయోనుకు అరవై రాగి తలాంతులను తెచ్చును",
          "అధికారులు ముప్పది అన్య పూజాస్థలములను నిర్మింతురు"
      ],
      "correctAnswer": "The coastlands will wait upon Me, and on My arm they will trust",
      "bibleReference": "Isaiah 51:5",
      "explanation": "God declares that distant Gentile nations and coastlands will place their hope and trust in His sovereign saving arm.",
      "explanationTelugu": "నా నీతి సమీపముగా ఉన్నది, నా రక్షణ బయలువెళ్లుచున్నది, నా బాహువులు జనములకు న్యాయము తీర్చును; ద్వీపములు నాకొరకు కనిపెట్టుచున్నవి, అవి నా బాహువుమీద నిరీక్షణ యుంచును."
  },
  {
      "easyQ": "What contrast between mortal Sheol and living praise did King Hezekiah express in Isaiah 38:18-19?",
      "easyQTe": "యెషయా 38:18-19 లో హిజ్కియా రాజు పాతాళపు నిస్సహాయతకును జీవముగలవారి స్తుతికిని మధ్య ఏ తేడాను వివరించెను?",
      "medQ": "According to Isaiah 38:18, why must those delivered from death praise God while they have earthly breath?",
      "medQTe": "యెషయా 38:18 ప్రకారం సమాధిలోనికి దిగిపోవువారు దేవుని సత్యమునుగూర్చి నిరీక్షింపలేరు గనుక బ్రదికియున్నవారు ఏమి చేయవలెను?",
      "hardQ": "How did Hezekiah's recovery from lethal illness anticipate the fuller New Testament revelation of eternal resurrection hope?",
      "hardQTe": "మరణపు అంచునుండి హిజ్కియా పొందిన ఆయుష్షు పొడిగింపు దేవుని కనికరముయొక్క నిరీక్షణను ఎలా మహిమపరచెను?",
      "options": [
          "Those who go down to the pit cannot hope for Your truth. The living, the living man, he shall praise You, as I do this day",
          "The dead will offer forty rams in the temple court",
          "Those in Sheol will build sixty stone altars",
          "The departed will send thirty letters to Jerusalem"
      ],
      "optionsTelugu": [
          "గోతిలోనికి దిగిపోవువారు నీ సత్యమునుగూర్చి నిరీక్షింపలేరు; సజీవులు, సజీవులే గదా నేను నేడు చేయునట్లు నిన్ను స్తుతించుదురు",
          "మృతులు ఆలయ ప్రాంగణములో నలభై పొట్టేళ్లను అర్పించెదరు",
          "పాతాళములో ఉన్నవారు అరవై రాతి బలిపీఠములను కట్టెదరు",
          "గతించినవారు యెరూషలేమునకు ముప్పది ఉత్తరములను పంపుదురు"
      ],
      "correctAnswer": "Those who go down to the pit cannot hope for Your truth. The living, the living man, he shall praise You, as I do this day",
      "bibleReference": "Isaiah 38:18-19",
      "explanation": "Hezekiah celebrated his healing, declaring that the living have the joyful privilege of hoping in God's truth and praising His holy name.",
      "explanationTelugu": "పాతాళము నీకు కృతజ్ఞతాస్తుతులు చెల్లింపదు, మరణము నిన్ను స్తుతింపదు, గోతిలోనికి దిగిపోవువారు నీ సత్యమునుగూర్చి నిరీక్షింపలేరు; సజీవులు, సజీవులే గదా నేను నేడు చేయునట్లు నిన్ను స్తుతించుదురు."
  },
  {
      "easyQ": "What confidence that none who hope in God will be put to shame opens Psalm 25:3?",
      "easyQTe": "కీర్తన 25:3 లో దేవునికొరకు కనిపెట్టువారికి (నిరీక్షించువారికి) ఏ నిశ్చయమైన హామీ ఇవ్వబడినది?",
      "medQ": "In Psalm 25:3, who will ultimately be ashamed compared to those who wait upon Yahweh?",
      "medQTe": "కీర్తన 25:3 ప్రకారం దేవునికొరకు కనిపెట్టువారికి బదులుగా ఎవరు సిగ్గునొందుదురు?",
      "hardQ": "How does the vindication of covenant trust establish the moral integrity of waiting patiently on God's vindication?",
      "hardQTe": "యెహోవాకొరకు కనిపెట్టువారెవరును సిగ్గుపడరను వాగ్దానము విశ్వాసికి ఎటువంటి ఆత్మీయ స్థైర్యమును ఇచ్చును?",
      "options": [
          "Indeed, let no one who waits on You be ashamed; let those be ashamed who deal treacherously without cause",
          "Let those who build forty stone monuments be praised",
          "Let those who gather sixty cavalry squadrons prevail",
          "Let those who hide in thirty mountain fortresses be safe"
      ],
      "optionsTelugu": [
          "నీకొరకు కనిపెట్టువారిలో ఎవడును సిగ్గుపడడు; హేతువులేకుండ ద్రోహము చేయువారు సిగ్గుపడుదురు",
          "నలభై రాతి స్తంభములను కట్టువారు ప్రశంసింపబడుదురు",
          "అరవై అశ్విక దళములను సమకూర్చుకొనువారు జయమొందుదురు",
          "ముప్పది పర్వత కోటలలో దాగుకొనువారు సురక్షితముగా ఉందురు"
      ],
      "correctAnswer": "Indeed, let no one who waits on You be ashamed; let those be ashamed who deal treacherously without cause",
      "bibleReference": "Psalm 25:3",
      "explanation": "David declares that genuine faith and patient hope in God will never end in humiliation or disgrace.",
      "explanationTelugu": "నీకొరకు కనిపెట్టువారిలో ఎవడును సిగ్గుపడడు; హేతువులేకుండ ద్రోహము చేయువారే సిగ్గుపడుదురు."
  },
  {
      "easyQ": "What prayer for all-day guidance in truth and hope is penned in Psalm 25:5?",
      "easyQTe": "కీర్తన 25:5 లో దినమెల్ల దేవుని సత్యములో నడుచుచు నిరీక్షించుటకొరకు దావీదు చేసిన ప్రార్థన ఏది?",
      "medQ": "According to Psalm 25:5, why does the psalmist wait on God all the day long?",
      "medQTe": "కీర్తన 25:5 ప్రకారం భక్తుడు దినమెల్ల దేవునికొరకే ఎందుకు కనిపెట్టుచున్నాడు?",
      "hardQ": "How does coupling divine instruction in truth with constant hope protect the pilgrim's path from doctrinal deception?",
      "hardQTe": "దేవుని సత్యబోధను నిరంతర నిరీక్షణతో జోడించుట విశ్వాసి నడకను పాపపు మార్గములనుండి ఎలా కాపాడును?",
      "options": [
          "Lead me in Your truth and teach me, for You are the God of my salvation; on You I wait all the day",
          "Give me forty chariots to travel securely through Edom",
          "Grant me sixty gold talents to purchase wisdom in Tyre",
          "Send thirty legions to enforce my kingdom's decrees"
      ],
      "optionsTelugu": [
          "నన్ను నీ సత్యముననుసరించి నడిపించుము, నాకు ఉపదేశము చేయుము; నీవే నా రక్షణకర్తవైన దేవుడవు, దినమెల్ల నీకొరకు కనిపెట్టుచున్నాను",
          "ఎదోము గుండా సురక్షితముగా వెళ్లుటకు నాకు నలభై రథములను ఇమ్ము",
          "తీరులో జ్ఞానమును కొనుగోలు చేయుటకు అరవై బంగారు తలాంతులను ఇమ్ము",
          "నా రాజ్యపు ఆజ్ఞలను అమలుచేయుటకు ముప్పది సైన్యములను పంపుము"
      ],
      "correctAnswer": "Lead me in Your truth and teach me, for You are the God of my salvation; on You I wait all the day",
      "bibleReference": "Psalm 25:5",
      "explanation": "David anchors his whole life in God, asking to be taught divine truth while waiting expectantly on the God of his salvation all day long.",
      "explanationTelugu": "నన్ను నీ సత్యముననుసరించి నడిపించుము, నాకు ఉపదేశము చేయుము; నీవే నా రక్షణకర్తవైన దేవుడవు, దినమెల్ల నీకొరకు కనిపెట్టుచున్నాను."
  },
  {
      "easyQ": "What two protective virtues does the psalmist pair with hope in Psalm 25:21?",
      "easyQTe": "కీర్తన 25:21 లో నిరీక్షణతోపాటు భక్తుని కాపాడు రెండు నైతిక సుగుణములేవి?",
      "medQ": "In Psalm 25:21, how do integrity and uprightness preserve the one who waits on Yahweh?",
      "medQTe": "కీర్తన 25:21 ప్రకారం దేవునికొరకు కనిపెట్టువానిని యథార్థత నిర్దోషత్వములు ఎలా కాపాడును?",
      "hardQ": "Why is patient hope in God counterfeit if divorced from ethical integrity and practical uprightness?",
      "hardQTe": "నిజమైన నిరీక్షణ కేవలము మాటలతో సరిపెట్టుకొనక యథార్థమైన మరియు పవిత్రమైన జీవితముతో ఎలా కలిసియుండవలెను?",
      "options": [
          "Let integrity and uprightness preserve me, for I wait for You",
          "Let sixty armed bodyguards encircle my palace gates",
          "Let forty bronze shields defend my mountain strongholds",
          "Let thirty treaties with foreign kings secure my throne"
      ],
      "optionsTelugu": [
          "నేను నీకొరకు కనిపెట్టుచున్నాను, యథార్థతయు నిర్దోషత్వమును నన్ను కాపాడును గాక",
          "నా రాజభవన ద్వారములను అరవైమంది సాయుధ రక్షకులు కాపాడుదురు గాక",
          "నా పర్వత కోటలను నలభై ఇత్తడి డాలులు రక్షించును గాక",
          "విదేశీ రాజులతో ముప్పది సంధులు నా సింహాసనమును స్థిరపరచును గాక"
      ],
      "correctAnswer": "Let integrity and uprightness preserve me, for I wait for You",
      "bibleReference": "Psalm 25:21",
      "explanation": "David prays that moral integrity and uprightness will guard his character while he patiently waits on the Lord.",
      "explanationTelugu": "నేను నీకొరకు కనిపెట్టుచున్నాను; యథార్థతయు నిర్దోషత్వమును నన్ను కాపాడును గాక."
  },
  {
      "easyQ": "What inheritance is promised to those who wait upon the Lord in Psalm 37:9?",
      "easyQTe": "కీర్తన 37:9 లో యెహోవాకొరకు కనిపెట్టువారికి ఏ స్వాస్థ్యము వాగ్దానము చేయబడినది?",
      "medQ": "According to Psalm 37:9, what contrasting fate awaits evildoers compared to those who hope in God?",
      "medQTe": "కీర్తన 37:9 ప్రకారం చెడుచేయువారి ముగింపుతో పోలిస్తే దేవునికొరకు కనిపెట్టువారు పొందు ఆశీర్వాదమేమి?",
      "hardQ": "How does the eschatological inheritance of the land reward the patient refusal to retaliate against triumphant wickedness?",
      "hardQTe": "దుష్టుల తాత్కాలిక వైభవమును చూచి అసూయపడక దేవునికొరకే కనిపెట్టువారు భూమిని స్వతంత్రించుకొందురను సత్యము ఏ నిరీక్షణనిచ్చును?",
      "options": [
          "Those who wait on the Lord, they shall inherit the earth",
          "Those who assemble forty swift chariots shall conquer the hills",
          "Those who pay sixty silver talents shall acquire palaces",
          "Those who negotiate thirty alliances shall reign supreme"
      ],
      "optionsTelugu": [
          "యెహోవాకొరకు కనిపెట్టుకొనువారు భూమిని స్వతంత్రించుకొందురు",
          "నలభై వేగవంతమైన రథములను సమకూర్చుకొనువారు కొండలను జయింతురు",
          "అరవై వెండి తలాంతులను చెల్లించువారు భవనములను సంపాదింతురు",
          "ముప్పది సంధులను కుదుర్చుకొనువారు రాజ్యమేలుదురు"
      ],
      "correctAnswer": "Those who wait on the Lord, they shall inherit the earth",
      "bibleReference": "Psalm 37:9",
      "explanation": "While evildoers are cut off, those who quietly wait upon the Lord receive the enduring inheritance of the earth.",
      "explanationTelugu": "కీడుచేయువారు నిర్మూలమగుదురు; యెహోవాకొరకు కనిపెట్టుకొనువారు భూమిని స్వతంత్రించుకొందురు."
  },
  {
      "easyQ": "What divine exaltation is promised to the faithful in Psalm 37:34?",
      "easyQTe": "కీర్తన 37:34 లో యెహోవాకొరకు కనిపెట్టుకొని ఆయన మార్గమును గైకొనువారికి ఏ హెచ్చింపు వాగ్దానము చేయబడినది?",
      "medQ": "In Psalm 37:34, what two commands form the prerequisite for being exalted to inherit the land?",
      "medQTe": "కీర్తన 37:34 ప్రకారం భూమిని స్వతంత్రించుకొనునట్లు హెచ్చింపబడుటకు ఏ రెండు ఆజ్ఞలను పాటించవలెను?",
      "hardQ": "How does holding fast to God's path while waiting prevent believers from adopting worldly shortcuts to success?",
      "hardQTe": "లోకపు అక్రమ మార్గములను ఆశ్రయించక దేవుని మార్గమందే నిలిచి కనిపెట్టుకొనుట విశ్వాసిని ఎలా ఘనపరచును?",
      "options": [
          "Wait on the Lord, and keep His way, and He shall exalt you to inherit the land",
          "Build forty fortified towers and amass sixty archers",
          "Collect thirty talents of silver before entering battle",
          "Seek forty days of political counsel from Egypt"
      ],
      "optionsTelugu": [
          "యెహోవాకొరకు కనిపెట్టుకొని యుండుము, ఆయన మార్గమును గైకొనుము, అప్పుడు భూమిని స్వతంత్రించుకొనునట్లు ఆయన నిన్ను హెచ్చించును",
          "నలభై బలమైన గోపురములను కట్టి అరవైమంది విలుకాండ్రను సమకూర్చుకొనుము",
          "యుద్ధమునకు వెళ్లుటకు ముందు ముప్పది వెండి తలాంతులను సేకరించుము",
          "ఐగుప్తునుండి నలభై దినముల రాజకీయ సలహాలను పొందుము"
      ],
      "correctAnswer": "Wait on the Lord, and keep His way, and He shall exalt you to inherit the land",
      "bibleReference": "Psalm 37:34",
      "explanation": "Scripture commands believers to wait on the Lord and walk faithfully in His ways; in due time, God Himself will exalt them.",
      "explanationTelugu": "యెహోవాకొరకు కనిపెట్టుకొని యుండుము, ఆయన మార్గమును గైకొనుము, అప్పుడు భూమిని స్వతంత్రించుకొనునట్లు ఆయన నిన్ను హెచ్చించును; భక్తిహీనులు నిర్మూలమగుట నీవు చూచెదవు."
  },
  {
      "easyQ": "What famous testimony of patient waiting and miraculous rescue opens Psalm 40:1-2?",
      "easyQTe": "కీర్తన 40:1-2 లో ఓపికతో కనిపెట్టుటవలన దేవుడు చేసిన అద్భుత రక్షణను గూర్చి దావీదు చెప్పిన సాక్ష్యమేమి?",
      "medQ": "According to Psalm 40:1-2, out of what horrible pit and miry clay did the Lord lift the psalmist?",
      "medQTe": "కీర్తన 40:1-2 ప్రకారం నాశనకరమైన గుంటలోనుండి జిగటగల దొంగ ఊబిలోనుండి యెహోవా తన భక్తుని ఎలా పైకెత్తెను?",
      "hardQ": "How does setting the believer's feet upon a rock and establishing their steps answer the spiritual agony of waiting?",
      "hardQTe": "ఓపికతో యెహోవాకొరకు కనిపెట్టినప్పుడు ఆయన మొరనాలకించి బండపై పాదములు నిలిపి నూతన కీర్తననిచ్చుట ఏ ఆత్మీయ నిశ్చయతను ఇచ్చును?",
      "options": [
          "I waited patiently for the Lord; and He inclined to me, and heard my cry. He also brought me up out of a horrible pit, out of the miry clay, and set my feet upon a rock",
          "I dispatched forty cavalry units to rescue my trapped soldiers",
          "I purchased my freedom with sixty talents of silver from Tyre",
          "I escaped by digging a tunnel thirty cubits beneath the wall"
      ],
      "optionsTelugu": [
          "యెహోవాకొరకు నేను సహనముతో కనిపెట్టుకొంటిని, ఆయన నాకు చెవియొగ్గి నా మొర నాలకించెను; నాశనకరమైన గుంటలోనుండియు జిగటగల ఊబిలోనుండియు ఆయన నన్ను పైకెత్తెను, నా పాదములను బండమీద నిలిపెను",
          "చిక్కుబడిన సైనికులను రక్షించుటకు నేను నలభై అశ్విక దళములను పంపితిని",
          "తీరునుండి అరవై వెండి తలాంతులు చెల్లించి నా విడుదలను కొనుక్కొంటిని",
          "గోడ క్రింద ముప్పది మూరల సొరంగమును తవ్వి నేను తప్పించుకొంటిని"
      ],
      "correctAnswer": "I waited patiently for the Lord; and He inclined to me, and heard my cry. He also brought me up out of a horrible pit, out of the miry clay, and set my feet upon a rock",
      "bibleReference": "Psalm 40:1-2",
      "explanation": "David testifies that patient hope was rewarded when God bent down, heard his desperate cry, and set his sinking feet firmly upon a solid rock.",
      "explanationTelugu": "యెహోవాకొరకు నేను సహనముతో కనిపెట్టుకొంటిని, ఆయన నాకు చెవియొగ్గి నా మొర నాలకించెను; నాశనకరమైన గుంటలోనుండియు జిగటగల ఊబిలోనుండియు ఆయన నన్ను పైకెత్తెను, నా పాదములను బండమీద నిలిపి నా అడుగులను స్థిరపరచెను."
  },
  {
      "easyQ": "What sweet resolve to wait upon God's name before His saints closes Psalm 52:9?",
      "easyQTe": "కీర్తన 52:9 లో పరిశుద్ధుల యెదుట దేవుని నామముకొరకు కనిపెట్టుదునని దావీదు ఏ నిశ్చయతను వ్యక్తపరచెను?",
      "medQ": "In Psalm 52:8-9, how does trusting in God's mercy like a green olive tree lead to perpetual waiting on His good name?",
      "medQTe": "కీర్తన 52:8-9 ప్రకారం దేవుని మందిరములో పచ్చని ఒలీవ చెట్టువలె నిలిచి ఆయన నామముకొరకే ఎందుకు కనిపెట్టవలెను?",
      "hardQ": "Why is public testimony to God's faithful goodness an essential outcome of answered hope?",
      "hardQTe": "దుష్టుల హింసలమధ్య దేవుని కృపయందే నిరంతరము నమ్మకముంచి ఆయన పరిశుద్ధ నామముకొరకు ఎదురుచూచుట ఏ విజయమునిచ్చును?",
      "options": [
          "I will praise You forever, because You have done it; and in the presence of Your saints I will wait on Your name, for it is good",
          "I will conquer forty Philistine strongholds with my sword",
          "I will build sixty stone pillars in the desert of Ziph",
          "I will demand thirty talents of tribute from Doeg"
      ],
      "optionsTelugu": [
          "నీవు ఈ కార్యము చేసితివి గనుక నేను నిత్యము నిన్ను స్తుతించెదను; నీ నామము ఉత్తమమైనది, నీ భక్తులయెదుట నేను దానికొరకు కనిపెట్టుచుందును",
          "నా ఖడ్గముతో నలభై ఫిలిష్తీయుల కోటలను నేను జయింతును",
          "జీపు అరణ్యములో అరవై రాతి స్తంభములను నేను నిలబెట్టెదను",
          "దోయేగునుండి ముప్పది తలాంతుల పన్నును నేను డిమాండ్ చేసెదను"
      ],
      "correctAnswer": "I will praise You forever, because You have done it; and in the presence of Your saints I will wait on Your name, for it is good",
      "bibleReference": "Psalm 52:9",
      "explanation": "David resolves to praise God perpetually and wait expectantly upon His trustworthy name in fellowship with the saints.",
      "explanationTelugu": "నీవు ఈ కార్యము చేసితివి గనుక నేను నిత్యము నిన్ను స్తుతించెదను; నీ నామము ఉత్తమమైనది, నీ భక్తులయెదుట నేను దానికొరకు కనిపెట్టుచుందును."
  },
  {
      "easyQ": "What warning against personal vengeance and call to wait on the Lord is given in Proverbs 20:22?",
      "easyQTe": "సామెతలు 20:22 లో పగతీర్చుకొనుటకు బదులుగా యెహోవాకొరకు కనిపెట్టుకొనుటను గూర్చి ఏ బోధ కలదు?",
      "medQ": "According to Proverbs 20:22, why should believers never say 'I will recompense evil'?",
      "medQTe": "సామెతలు 20:22 ప్రకారం కీడునకు ప్రతికీడు చేయుటకు బదులుగా విశ్వాసి ఏమి చేయవలెను?",
      "hardQ": "How does the discipline of waiting on God to vindicate and save free the human heart from toxic resentment?",
      "hardQTe": "తీర్పును స్వయముగా తీర్చుకొనక దేవుని న్యాయముకొరకు నిరీక్షణతో కనిపెట్టుకొనుట విశ్వాసిని పాపపు పగనుండి ఎలా విడిపించును?",
      "options": [
          "Do not say, 'I will recompense evil'; wait on the Lord, and He will save you",
          "Prepare forty chariots to avenge your family honor",
          "Pursue your enemies sixty leagues into the wilderness",
          "Demand thirty sheep as restitution for insult"
      ],
      "optionsTelugu": [
          "'కీడునకు ప్రతికీడు చేసెదననవద్దు; యెహోవాకొరకు కనిపెట్టుకొనుము, ఆయన నిన్ను రక్షించును'",
          "కుటుంబ గౌరవమును నిలుపుటకు నలభై రథములను సిద్ధపరచుము",
          "నీ శత్రువులను అరణ్యములో అరవై ఆమడల దూరం వెంటాడుము",
          "అవమానమునకు పరిహారముగా ముప్పది గొఱ్ఱెలను డిమాండ్ చేయుము"
      ],
      "correctAnswer": "Do not say, 'I will recompense evil'; wait on the Lord, and He will save you",
      "bibleReference": "Proverbs 20:22",
      "explanation": "Proverbs forbids personal retaliation, urging believers to wait patiently upon the Lord who will faithfully vindicate and deliver them.",
      "explanationTelugu": "కీడునకు ప్రతికీడు చేసెదననవద్దు; యెహోవాకొరకు కనిపెట్టుకొనుము, ఆయన నిన్ను రక్షించును."
  },
  {
      "easyQ": "What triumphant song of joyful vindication in God's salvation is prophesied in Isaiah 25:9?",
      "easyQTe": "యెషయా 25:9 లో దేవుని రక్షణకొరకైన నిరీక్షణ నెరవేరినప్పుడు పరిశుద్ధులు పాడే విజయగానమేమి?",
      "medQ": "In Isaiah 25:9, how do believers exult when Yahweh appears to fulfill their long-awaited hope?",
      "medQTe": "యెషయా 25:9 ప్రకారం తాము కనిపెట్టిన దేవుడు ప్రత్యక్షమై రక్షించినప్పుడు విశ్వాసులు ఎలా ఆనందింతురు?",
      "hardQ": "How does the repetition of 'we have waited for Him' underscore the ultimate vindication of patient biblical hope?",
      "hardQTe": "'మనము కనిపెట్టుకొనిన మన దేవుడు ఈయనే; మనము ఆయన రక్షణయందు సంతోషించి ఉత్సహింతము' అను వాక్యము నిరీక్షణకు ఏ పరమ ముగింపునిచ్చును?",
      "options": [
          "Behold, this is our God; we have waited for Him, and He will save us. This is the Lord; we have waited for Him; we will be glad and rejoice in His salvation",
          "We built sixty towers and thirty walls to secure our liberty",
          "We gathered forty kings to conquer the nations of the north",
          "We bought sixty silver shields from the merchants of Egypt"
      ],
      "optionsTelugu": [
          "'ఇదిగో మనలను రక్షించునని మనము కనిపెట్టుకొనియున్న మన దేవుడు ఈయనే; మనము కనిపెట్టుకొనిన యెహోవా ఈయనే, ఆయన రక్షణయందు సంతోషించి ఉత్సహింతము'",
          "మా స్వాతంత్ర్యముకొరకు మేము అరవై గోపురములను ముప్పది ప్రాకారములను కట్టితివి",
          "ఉత్తర దేశపు రాజ్యములను జయించుటకు నలభైమంది రాజులను సమకూర్చితివి",
          "ఐగుప్తు వర్తకులవద్దనుండి అరవై వెండి డాలులను కొనుగోలు చేసితివి"
      ],
      "correctAnswer": "Behold, this is our God; we have waited for Him, and He will save us. This is the Lord; we have waited for Him; we will be glad and rejoice in His salvation",
      "bibleReference": "Isaiah 25:9",
      "explanation": "The redeemed will shout with boundless joy when God finally arrives, proving that every moment of patient waiting was triumphantly justified.",
      "explanationTelugu": "ఆ దినమున జనులు ఈలాగు చెప్పుదురు-ఇదిగో మనలను రక్షించునని మనము కనిపెట్టుకొనియున్న మన దేవుడు ఈయనే; మనము కనిపెట్టుకొనిన యెహోవా ఈయనే, ఆయన రక్షణయందు సంతోషించి ఉత్సహింతము."
  },
  {
      "easyQ": "What source of everlasting consolation and good hope is invoked in 2 Thessalonians 2:16-17?",
      "easyQTe": "2 థెస్సలొనీకయులకు 2:16-17 లో మన హృదయములను ఆదరించి బలపరచు నిత్య ఆదరణ మరియు శ్రేష్ఠమైన నిరీక్షణ ఎవరివలన కలుగును?",
      "medQ": "According to 2 Thessalonians 2:16-17, through what divine attribute did God give us good hope?",
      "medQTe": "2 థెస్సలొనీకయులకు 2:16-17 ప్రకారం దేవుడు తన ఏ గుణముద్వారా మనకు నిత్యమైన ఆదరణను మరియు నిరీక్షణను అనుగ్రహించెను?",
      "hardQ": "How does 'good hope by grace' actively stabilize the believer's heart in every good word and work?",
      "hardQTe": "కృపవలన కలిగిన శ్రేష్ఠమైన నిరీక్షణ విశ్వాసుల హృదయములను ప్రతి సత్కార్యమందును సద్వాక్యమందును ఎలా స్థిరపరచును?",
      "options": [
          "Now may our Lord Jesus Christ Himself, and our God and Father, who has loved us and given us everlasting consolation and good hope by grace, comfort your hearts and establish you in every good word and work",
          "May forty philosophers of Greece instruct your assemblies in debate",
          "May sixty talents of silver protect your community from Roman taxation",
          "May thirty days of silent contemplation earn you spiritual security"
      ],
      "optionsTelugu": [
          "మన ప్రభువైన యేసుక్రీస్తును, మనలను ప్రేమించి కృపచేత నిత్యమైన ఆదరణయు శుభ నిరీక్షణయు అనుగ్రహించిన మన తండ్రియైన దేవుడును, మీ హృదయములను ఆదరించి ప్రతి సత్కార్యమందును సద్వాక్యమందును మిమ్మును స్థిరపరచును గాక",
          "గ్రీసు దేశపు నలభైమంది తత్వవేత్తలు మీ సమాజములకు వాదనలలో శిక్షణ ఇత్తురు గాక",
          "రోమా పన్నులనుండి అరవై వెండి తలాంతులు మీ సమాజమును కాపాడును గాక",
          "ముప్పది దినముల నిశ్శబ్ద ధ్యానము మీకు ఆత్మీయ భద్రతను సంపాదించిపెట్టును గాక"
      ],
      "correctAnswer": "Now may our Lord Jesus Christ Himself, and our God and Father, who has loved us and given us everlasting consolation and good hope by grace, comfort your hearts and establish you in every good word and work",
      "bibleReference": "2 Thessalonians 2:16-17",
      "explanation": "Paul prays that God the Father and the Lord Jesus Christ, who lavished eternal comfort and good hope upon us by grace, will anchor our hearts in all goodness.",
      "explanationTelugu": "మన ప్రభువైన యేసుక్రీస్తును, మనలను ప్రేమించి కృపచేత నిత్యమైన ఆదరణయు శుభ నిరీక్షణయు అనుగ్రహించిన మన తండ్రియైన దేవుడును, మీ హృదయములను ఆదరించి, ప్రతి సత్కార్యమందును సద్వాక్యమందును మిమ్మును స్థిరపరచును గాక."
  },
  {
      "easyQ": "What sublime Christological title opens 1 Timothy 1:1, designating Jesus as our hope?",
      "easyQTe": "1 తిమోతి 1:1 లో యేసుక్రీస్తునకు ఇవ్వబడిన ఏ పరమ బిరుదు ఆయనను మన నిరీక్షణగా వర్ణించుచున్నది?",
      "medQ": "According to 1 Timothy 1:1, by whose commandment was Paul appointed an apostle of Christ Jesus, our hope?",
      "medQTe": "1 తిమోతి 1:1 ప్రకారం మన నిరీక్షణయైన క్రీస్తుయేసుయొక్క అపొస్తలునిగా పౌలు ఎవరి ఆజ్ఞచొప్పున నియమింపబడెను?",
      "hardQ": "How does identifying the living Person of Jesus Christ as our hope transform abstract doctrine into vibrant personal communion?",
      "hardQTe": "నిరీక్షణ అనునది కేవలము ఒక సిద్ధాంతము కాక 'యేసుక్రీస్తే మన నిరీక్షణ' అను సత్యము విశ్వాసి జీవితమును ఎలా రూపాంతరం చెందించును?",
      "options": [
          "Paul, an apostle of Jesus Christ, by the commandment of God our Savior and the Lord Jesus Christ, our hope",
          "Paul, a magistrate appointed by forty Roman senators",
          "Paul, a philosopher commissioned by thirty scholars of Tarsus",
          "Paul, an inspector sent by sixty priests of Jerusalem"
      ],
      "optionsTelugu": [
          "మన రక్షకుడైన దేవునియొక్కయు, మన నిరీక్షణయైన క్రీస్తుయేసుయొక్కయు ఆజ్ఞప్రకారము యేసుక్రీస్తుయొక్క అపొస్తలుడైన పౌలు",
          "నలభైమంది రోమా సెనెటర్లచే నియమింపబడిన న్యాయాధికారియైన పౌలు",
          "తార్సులోని ముప్పదిమంది పండితులచే పంపబడిన తత్వవేత్తయైన పౌలు",
          "యెరూషలేములోని అరవైమంది యాజకులచే నియమింపబడిన అధికారియైన పౌలు"
      ],
      "correctAnswer": "Paul, an apostle of Jesus Christ, by the commandment of God our Savior and the Lord Jesus Christ, our hope",
      "bibleReference": "1 Timothy 1:1",
      "explanation": "Jesus Christ is not merely the giver of hope; He Himself is personally our living, embodied, eternal hope.",
      "explanationTelugu": "మన రక్షకుడైన దేవునియొక్కయు, మన నిరీక్షణయైన క్రీస్తుయేసుయొక్కయు ఆజ్ఞప్రకారము క్రీస్తుయేసుయొక్క అపొస్తలుడైన పౌలు తిమోతికి శుభమని చెప్పి వ్రాయునది."
  }
];

// 50 Growth Facts for Hope (Old & New Testament, practical encouragement, endurance)
function buildHopeGrowth() {
  const data = [
    ["Job 13:15 declaring indomitable hope: 'Though He slay me, yet will I trust in Him'", "యోబు 13:15 'ఆయన నన్ను చంపినను నేను ఆయనకొరకే కనిపెట్టుదును' అను అజేయమైన నిరీక్షణ", "Job 13:15", "\"Though He slay me, yet will I trust in Him. Even so, I will defend my own ways before Him\"", "\"ఇదిగో ఆయన నన్ను చంపినను నేను ఆయనకొరకే కనిపెట్టుదును; అయినను నా ప్రవర్తన ఆయనయెదుట సమర్థించుకొందును\"", "Hope that survives even the apparent hostility of God Himself.", "దేవుడే తనను సంహరించినను ఆయనయందే నిరీక్షణ యుంచుదునన్న యోబు విశ్వాస శిఖరము."],
    ["Job 14:7 on there being hope for a tree, if it is cut down, that it will sprout again", "యోబు 14:7 చెట్టు నరకబడినను అది మరల చిగుర్చునను నిరీక్షణ కలదు", "Job 14:7", "\"For there is hope for a tree, if it is cut down, that it will sprout again, and that its tender shoots will not cease\"", "\"చెట్టు నరకబడినను అది చిగుర్చునను నిరీక్షణ కలదు, దానికి లేతకొమ్మలు వేయక మానవు\"", "Even when severed to the root, creation models the hope of restorative resurrection.", "చెట్టు వేరు నరకబడినను నీటివాసన తగలగానే మరల చిగుర్చునట్లు భక్తునికి నిరీక్షణ కలదు."],
    ["Job 19:25-27 triumphant resurrection hope: 'For I know that my Redeemer lives, and He shall stand at last on the earth'", "యోబు 19:25-27 'నా విమోచకుడు సజీవుడనియు, అంత్యమందు ఆయన భూమిపై నిలుచుననియు నేనెరుగుదును'", "Job 19:25", "\"For I know that my Redeemer lives, and He shall stand at last on the earth; and after my skin is destroyed, this I know, that in my flesh I shall see God\"", "\"నా విమోచకుడు సజీవుడనియు, అంత్యమందు ఆయన భూమిమీద నిలుచుననియు నేనెరుగుదును; ఈలాగు నా చర్మము చీకిపోయిన తరువాత శరీరముతో నేను దేవుని చూచెదను\"", "The ancient bedrock of bodily resurrection hope shining through unbearable agony.", "శరీరమంతయు కుష్ఠుతో కుళ్లిపోయినను అంత్యదినమున సజీవుడైన విమోచకుని చూచెదనను యోబు నిరీక్షణ."],
    ["Psalm 9:18 on the needy not always being forgotten, and the expectation of the poor not perishing forever", "కీర్తన 9:18 దరిద్రులు ఎల్లప్పుడును మరచిపోబడరు, దీనుల నిరీక్షణ ఎన్నటికిని భంగము కాదు", "Psalm 9:18", "\"For the needy shall not always be forgotten; the expectation of the poor shall not perish forever\"", "\"ఏలయనగా దరిద్రులు ఎల్లప్పుడును మరచిపోబడరు, దీనుల నిరీక్షణ ఎన్నటికిని భంగముకాదు\"", "God sovereignly vindicates the patient expectations of the oppressed.", "లోకములో అణగద్రొక్కబడిన పేదల నిరీక్షణను దేవుడు ఎన్నడును వ్యర్థము కానియ్యడు."],
    ["Psalm 16:9-10 messianic resurrection hope: 'My flesh also will rest in hope; for You will not leave my soul in Sheol'", "కీర్తన 16:9-10 మెస్సీయ పునరుత్థాన నిరీక్షణ: 'నా శరీరముకూడ సురక్షితముగా నివసించును; నీవు నా ఆత్మను పాతాళములో విడిచిపెట్టవు'", "Psalm 16:9-10", "\"Therefore my heart is glad, and my glory rejoices; my flesh also will rest in hope. For You will not leave my soul in Sheol, nor will You allow Your Holy One to see corruption\"", "\"కావున నా హృదయము సంతోషించుచున్నది, నా ఆత్మ ఉల్లసించుచున్నది, నా శరీరముకూడ సురక్షితముగా నివసించును; ఏలయనగా నీవు నా ఆత్మను పాతాళములో విడిచిపెట్టవు, నీ పరిశుద్ధుని కుళ్లు చూడనియ్యవు\"", "David and Christ resting in the unassailable hope of rising from death.", "సమాధియందు కుళ్లుపట్టకుండా మూడవ దినమున లేచెదనను క్రీస్తు పునరుత్థాన నిరీక్షణ."],
    ["Psalm 27:14 exhorting: 'Wait on the Lord; be of good courage, and He shall strengthen your heart; wait, I say, on the Lord!'", "కీర్తన 27:14 'యెహోవాకొరకు కనిపెట్టుకొని యుండుము, ధైర్యము తెచ్చుకొని నీ హృదయమును దృఢపరచుకొనుము'", "Psalm 27:14", "\"Wait on the Lord; be of good courage, and He shall strengthen your heart; wait, I say, on the Lord!\"", "\"యెహోవాకొరకు కనిపెట్టుకొని యుండుము, ధైర్యము తెచ్చుకొని నీ హృదయమును దృఢపరచుకొనుము; యెహోవాకొరకు కనిపెట్టుకొని యుండుము\"", "Active, courageous waiting on God's timetable infuses supernatural stamina.", "నిరుత్సాహపడక ధైర్యముతో యెహోవాకొరకు కనిపెట్టుకొనుట హృదయమునకు నూతన బలమిచ్చును."],
    ["Psalm 31:24 commanding: 'Be of good courage, and He shall strengthen your heart, all you who hope in the Lord'", "కీర్తన 31:24 'యెహోవాకొరకు కనిపెట్టువారలారా (నిరీక్షించువారలారా), మీరందరు మనస్సున ధైర్యము వహించి నిబ్బరముగా ఉండుడి'", "Psalm 31:24", "\"Be of good courage, and He shall strengthen your heart, all you who hope in the Lord\"", "\"యెహోవాకొరకు కనిపెట్టువారలారా, మీరందరు మనస్సున ధైర్యము వహించి నిబ్బరముగా ఉండుడి; ఆయన మీ హృదయములను బలపరచును\"", "Hope produces courageous psychological fortitude against intimidation.", "దేవునియందు నిరీక్షణయుంచు విశ్వాసుల హృదయములను ఆయన అద్భుతముగా బలపరచును."],
    ["Psalm 38:15 praying amidst physical and social suffering: 'For in You, O Lord, I hope; You will hear, O Lord my God'", "కీర్తన 38:15 శ్రమలమధ్య దావీదు ప్రార్థన: 'యెహోవా, నీకొరకే నేను కనిపెట్టుచున్నాను; నా దేవుడవైన ప్రభువా, నీవే ఉత్తరమిచ్చెదవు'", "Psalm 38:15", "\"For in You, O Lord, I hope; You will hear, O Lord my God. For I said, 'Hear me, lest they rejoice over me'\"", "\"యెహోవా, నీకొరకే నేను కనిపెట్టుచున్నాను; నా దేవుడవైన ప్రభువా, నీవే ఉత్తరమిచ్చెదవు\"", "When human friends abandon and enemies mock, silent hope looks solely to God's reply.", "మిత్రులు విడిచినను శత్రువులు నిందించినను దేవుడే ఉత్తరమిచ్చునను అచంచల నిరీక్షణ."],
    ["Psalm 62:5 commanding one's soul: 'My soul, wait silently for God alone, for my expectation is from Him'", "కీర్తన 62:5 'నా ప్రాణమా, దేవునిసన్నిధిని మౌనముగా ఉండుము, ఆయనవలననే నాకు నిరీక్షణ కలుగుచున్నది'", "Psalm 62:5", "\"My soul, wait silently for God alone, for my expectation is from Him. He only is my rock and my salvation\"", "\"నా ప్రాణమా, దేవునిసన్నిధిని మౌనముగా ఉండుము, ఆయనవలననే నాకు నిరీక్షణ కలుగుచున్నది; ఆయనే నా శైలము నా రక్షణ\"", "Excluding all creaturely idols: total expectation focused exclusively on God.", "లోక సహాయములను విడిచి కేవలము దేవుని సన్నిధిలో మౌనముగా కనిపెట్టుటయే నిజమైన నిరీక్షణ."],
    ["Psalm 65:5 celebrating God as 'the confidence of all the ends of the earth and the far seas'", "కీర్తన 65:5 భూదిగంతముల నివాసులకందరికిని దూర సముద్రములమీది వారికిని నమ్మకమైన ఆశ్రయము", "Psalm 65:5", "\"By awesome deeds in righteousness You will answer us, O God of our salvation, You who are the confidence of all the ends of the earth\"", "\"మా రక్షణకర్తవైన దేవా, నీతినిబట్టి భయంకరమైన క్రియలచేత నీవు మాకుత్తరమిచ్చుచున్నావు; భూదిగంతముల నివాసులకందరికిని దూర సముద్రములమీది వారికిని నీవే నమ్మకమైన ఆశ్రయము\"", "The global cosmic scope: the God of Israel is the true hope of all human shores.", "సమస్త భూదిగంతములలో నివసించు సకల మానవాళికి ఏకైక నిరీక్షణాస్పదుడైన దేవుడు."],
    ["Psalm 119:49 praying: 'Remember the word to Your servant, upon which You have caused me to hope'", "కీర్తన 119:49 'నీవు నాకు నిరీక్షణ కలుగజేసిన నీ సేవకుని మాటను జ్ఞాపకము చేసికొనుము'", "Psalm 119:49", "\"Remember the word to Your servant, upon which You have caused me to hope. This is my comfort in my affliction, for Your word has given me life\"", "\"నీవు నాకు నిరీక్షణ కలుగజేసిన నీ సేవకుని మాటను జ్ఞాపకము చేసికొనుము; నీ వాక్యము నన్ను బ్రదికించియున్నది, నా బాధలో ఇదే నాకు నెమ్మది కలిగించుచున్నది\"", "Pleading God's own inspired promises back to Him in times of affliction.", "దేవుడు స్వయముగా తన వాక్యముద్వారా ఇచ్చిన నిరీక్షణను ఆయన సన్నిధిలో ఎత్తిపట్టి ప్రార్థించుట."],
    ["Psalm 119:74 on those who fear God rejoicing when they see me, because I have hoped in Your word", "కీర్తన 119:74 నేను నీ వాక్యమునందు నిరీక్షణ యుంచుట చూచి దైవజనులు సంతోషించుదురు", "Psalm 119:74", "\"Those who fear You will be glad when they see me, because I have hoped in Your word\"", "\"నీ యందు భయభక్తులు గలవారు నన్ను చూచి సంతోషించుదురు; ఏలయనగా నేను నీ వాక్యమునందు నిరీక్షణ యుంచియున్నాను\"", "A believer's steadfast hope in Scripture becomes an encouraging beacon to the whole community.", "వాక్యమందు నిరీక్షణయుంచి జీవించు విశ్వాసి తోటి భక్తులకు గొప్ప ఆత్మీయ ప్రోత్సాహముగా నిలుచును."],
    ["Psalm 119:81 on my soul fainting for Your salvation, but I hope in Your word", "కీర్తన 119:81 నీ రక్షణకొరకు నా ప్రాణము సొమ్మసిల్లుచున్నది, అయినను నీ వాక్యముమీద నేను నిరీక్షణ యుంచుచున్నాను", "Psalm 119:81", "\"My soul faints for Your salvation, but I hope in Your word. My eyes fail from searching Your word, saying, 'When will You comfort me?'\"", "\"నీ రక్షణకొరకు నా ప్రాణము సొమ్మసిల్లుచున్నది, నీ వాక్యముమీద నేను నిరీక్షణ యుంచుచున్నాను; నన్నెప్పుడు ఆదరించెదవని నా కన్నులు నీ మాటకొరకు కనిపెట్టి క్షీణించుచున్నవి\"", "Even when physical strength collapses in waiting, spiritual hope remains anchored in the promise.", "శరీరము సొమ్మసిల్లినను దేవుని వాగ్దానపు నిరీక్షణను విడువక పట్టుకొను భక్తుని ఆత్మీయ దాహము."],
    ["Psalm 119:116 praying: 'Uphold me according to Your word, that I may live; and do not let me be ashamed of my hope'", "కీర్తన 119:116 'నేను బ్రదుకునట్లు నీ మాటచొప్పున నన్ను ఆదుకొనుము; నా నిరీక్షణ విషయములో నన్ను సిగ్గుపరచకుము'", "Psalm 119:116", "\"Uphold me according to Your word, that I may live; and do not let me be ashamed of my hope. Hold me up, and I shall be safe\"", "\"నేను బ్రదుకునట్లు నీ మాటచొప్పున నన్ను ఆదుకొనుము; నా నిరీక్షణ విషయములో నన్ను సిగ్గుపరచకుము; నన్ను ఉద్ధరించుము, అప్పుడు నేను సురక్షితముగా నుందును\"", "A holy plea that God will vindicate our public trust and never permit hope to be embarrassed.", "దేవుని వాక్యముపై ఆధారపడిన నిరీక్షణ ఎన్నడును సిగ్గుపడకుండా దేవుడే ఆదుకొనును."],
    ["Psalm 119:147 rising before the dawning of the morning crying out, hoping in Your word", "కీర్తన 119:147 తెల్లవారకమునుపే లేచి మొరపెట్టుచు నీ వాక్యముమీద నిరీక్షణ యుంచుట", "Psalm 119:147", "\"I rise before the dawning of the morning, and cry for help; I hope in Your word. My eyes are awake through the night watches\"", "\"తెల్లవారకమునుపే నేను లేచి మొరపెట్టితిని, నీ మాటలమీద నేను నిరీక్షణ యుంచియున్నాను; నీ వాక్యమును ధ్యానించుటకై నా కన్నులు రాత్రిజాములకు ముందే తెరచుకొనును\"", "Early morning prayer and midnight vigils sustained by expectant hope in Scripture.", "వేకువజామునే లేచి దేవుని వాక్యమందలి నిరీక్షణతో ప్రార్థించు భక్తి జీవితము."],
    ["Proverbs 11:7 on when a wicked man dies, his expectation perishes, and the hope of the unjust vanishes", "సామెతలు 11:7 భక్తిహీనుడు చనిపోవునప్పుడు వాని ఆశ నశించును, అన్యాయస్థుల నిరీక్షణ వ్యర్థమగును", "Proverbs 11:7", "\"When a wicked man dies, his expectation will perish, and the hope of the unjust perishes\"", "\"భక్తిహీనుడు చనిపోవునప్పుడు వాని ఆశ నశించును, అక్రమము చేయువారి నిరీక్షణ వ్యర్థమగును\"", "Death is the absolute cemetery of all worldly ambition, but the portal to glory for godly hope.", "భక్తిహీనుని సమస్త లోక ఆశలు మరణముతో అంతమగును; దైవజనుని నిరీక్షణయో నిత్యత్వములో నిలుచును."],
    ["Proverbs 14:32 on the wicked banished in calamity, but the righteous having refuge in his death", "సామెతలు 14:32 భక్తిహీనుడు ఆపదలో కూలిపోవును, నీతిమంతుడు తన మరణమందును నిరీక్షణ గలవాడై యుండును", "Proverbs 14:32", "\"The wicked is banished in his wickedness, but the righteous has a refuge in his death\"", "\"భక్తిహీనుడు తనకు ఆపద రాగానే కూలిపోవును; అయితే నీతిమంతుడు తన మరణమందును ఆశ్రయము (నిరీక్షణ) గలవాడై యుండును\"", "Even in the final threshold of physical death, the righteous possess an invincible refuge.", "మరణ ఘడియలో సైతం దేవునియందు నిరీక్షణను ఆశ్రయమును కలిగియుండు నీతిమంతుని ధన్యత."],
    ["Isaiah 8:17 declaring: 'And I will wait on the Lord, who hides His face from the house of Jacob; and I will hope in Him'", "యెషయా 8:17 'యాకోబు కుటుంబమునకు తన ముఖమును మరుగుచేసికొను యెహోవాకొరకు నేను కనిపెట్టుదును, ఆయనయందు నిరీక్షణ యుంచుదును'", "Isaiah 8:17", "\"And I will wait on the Lord, who hides His face from the house of Jacob; and I will hope in Him\"", "\"యాకోబు కుటుంబమునకు తన ముఖమును మరుగుచేసికొనియున్న యెహోవాకొరకు నేను కనిపెట్టుకొని యుందును, ఆయనయందు నిరీక్షణ యుంచుదును\"", "Faithful perseverance when God is temporarily silent and hiding His visible favor.", "దేవుని ముఖము మరుగైనట్లు కనిపించినను అవిశ్వాసములో పడక ఆయనకొరకే కనిపెట్టు ప్రవచన నిరీక్షణ."],
    ["Isaiah 26:8 on in the way of Your judgments, O Lord, we have waited for You; the desire of our soul is to Your name", "యెషయా 26:8 యెహోవా, నీ న్యాయపు తీర్పుల మార్గమందు మేము నీకొరకు కనిపెట్టుచున్నాము; నీ నామస్మరణయే మా ఆశ", "Isaiah 26:8", "\"Yes, in the way of Your judgments, O Lord, we have waited for You; the desire of our soul is for Your name and for the remembrance of You\"", "\"యెహోవా, నీ న్యాయపు తీర్పుల మార్గమందు మేము నీకొరకు కనిపెట్టుచున్నాము; నీ నామమును నీ స్మరణయు మా ప్రాణమునకు వాంఛనీయములు\"", "Hope that persists through corporate historical chastisements, desiring only God's glory.", "కఠినమైన శోధన తీర్పుల మార్గములో సైతం దేవుని నామ మహిమకొరకు కనిపెట్టు సంఘ నిరీక్షణ."],
    ["Isaiah 30:18 on the Lord longing to be gracious to you: 'Blessed are all those who wait for Him'", "యెషయా 30:18 మీయందు దయచూపుటకు యెహోవా కనిపెట్టుచున్నాడు; ఆయనకొరకు కనిపెట్టువారందరు ధన్యులు", "Isaiah 30:18", "\"Therefore the Lord will wait, that He may be gracious to you; and therefore He will be exalted, that He may have mercy on you... Blessed are all those who wait for Him\"", "\"కావున మీయందు దయచూపవలెనని యెహోవా కనిపెట్టుచున్నాడు, మిమ్మును కరుణింపవలెనని ఆయన హెచ్చింపబడును... ఆయనకొరకు కనిపెట్టువారందరు ధన్యులు\"", "Astonishing reciprocity: while we wait on God, God is eagerly waiting for the right moment to show lavish grace.", "మనకు మేలు చేయుటకు దేవుడే కనిపెట్టుచుండగా, ఆయనకొరకు నిరీక్షించువారందరు ఎంతయో ధన్యులు."],
    ["Isaiah 33:2 praying: 'O Lord, be gracious to us; we have waited for You. Be their arm every morning, our salvation also in the time of trouble'", "యెషయా 33:2 'యెహోవా, మమ్మును కరుణించుము; మేము నీకొరకు కనిపెట్టుచున్నాము; ప్రతి ఉదయమున వారికి బాహువుగా ఉండుము'", "Isaiah 33:2", "\"O Lord, be gracious to us; we have waited for You. Be their arm every morning, our salvation also in the time of trouble\"", "\"యెహోవా, మమ్మును కరుణించుము, మేము నీకొరకు కనిపెట్టుచున్నాము; ప్రతి ఉదయమున వారికి బాహువుగాను, ఆపత్కాలమందు మాకు రక్షణగాను ఉండుము\"", "Daily morning supplies of strength granted to all who wait expectantly upon the Lord.", "ప్రతి ఉదయమున నూతన బాహుబలమును ఆపత్కాలములో రక్షణను దయచేయు దేవుని కనికరము."],
    ["Isaiah 64:4 on God acting for the one who waits for Him, things unheard of from of old", "యెషయా 64:4 తనకొరకు కనిపెట్టువాని విషయములో సమస్తమును జరిగించు దేవుని అద్భుత కార్యములు", "Isaiah 64:4", "\"For since the beginning of the world men have not heard nor perceived by the ear, nor has the eye seen any God besides You, who acts for the one who waits for Him\"", "\"తనకొరకు కనిపెట్టువాని విషయమై సమస్తమును జరిగించు నీవు తప్ప, అనాదికాలమునుండి మనుష్యులు ఏ దేవునిగూర్చియు వినలేదు, గ్రహింపలేదు, ఏ కన్నును చూడలేదు\"", "God reserves His most astonishing, unprecedented interventions for those who patiently hope.", "లోకము ఎన్నడును చూడని వినని అద్భుతములను తనకొరకు కనిపెట్టు విశ్వాసుల పక్షమున జరిగించు దేవుడు."],
    ["Jeremiah 14:8-9 calling God 'the Hope of Israel, his Savior in time of trouble'", "యిర్మీయా 14:8-9 'ఇశ్రాయేలు నిరీక్షణాస్పదుడా, ఆపత్కాలమందు దానిని రక్షించువాడా' అని మొరపెట్టుట", "Jeremiah 14:8", "\"O the Hope of Israel, his Savior in time of trouble, why should You be like a stranger in the land, and like a traveler who turns aside to tarry for a night?\"", "\"ఇశ్రాయేలు నిరీక్షణాస్పదుడా, ఆపత్కాలమందు దానిని రక్షించువాడా, ఈ దేశములో నీవు పరదేశివలెను, ఒక రాత్రి బసచేయుటకు వచ్చిన బాటసారివలెను ఎందుకు ఉండవలెను?\"", "Interceding with God by His covenant title as the sole Hope and Savior of His people.", "ఆపదలో రక్షణనిచ్చు ఇశ్రాయేలు ఏకైక నిరీక్షణాస్పదుడైన దేవుని పాదములను పట్టుకొనిన ప్రార్థన."],
    ["Jeremiah 14:22 asking: 'Are there any among the idols of the nations that can cause rain? Therefore we will wait for You, for You have made all these'", "యిర్మీయా 14:22 'అన్యజనుల వ్యర్థమైన విగ్రహములలో వర్షము కురిపింపగలవి ఏవైనా ఉన్నవా? కావున మేము నీకొరకే కనిపెట్టుచున్నాము'", "Jeremiah 14:22", "\"Are there any among the idols of the nations that can cause rain? Or can the heavens give showers? Are You not He, O Lord our God? Therefore we will wait for You\"", "\"అన్యజనుల వ్యర్థమైన విగ్రహములలో వర్షము కురిపింపగలవి ఏవైనా ఉన్నవా? ఆకాశము వర్షము నియ్యగలదా? మా దేవుడవైన యెహోవా, నీవే గదా దానిని చేయువాడవు? కావున మేము నీకొరకే కనిపెట్టుచున్నాము\"", "Pagan idols are powerless to provide rain; hope rests solely on the Creator who commands the clouds.", "నిర్జీవ విగ్రహములు వర్షమునియ్యలేవు; సమస్తమును సృష్టించిన జీవముగల దేవునికొరకే నిరీక్షణతో కనిపెట్టుట."],
    ["Jeremiah 17:7-8 on blessed is the man who trusts in the Lord, and whose hope is the Lord, like a tree planted by waters", "యిర్మీయా 17:7-8 యెహోవాను ఆశ్రయించి యెహోవామీద నిరీక్షణయుంచువాడు ధన్యుడు; అతడు జలములయొద్ద నాటబడిన చెట్టువలె నుండును", "Jeremiah 17:7-8", "\"Blessed is the man who trusts in the Lord, and whose hope is the Lord. For he shall be like a tree planted by the waters, which spreads out its roots by the river\"", "\"యెహోవాను ఆశ్రయించి యెహోవామీద నమ్మకముంచువాడు ధన్యుడు; అతడు జలములయొద్ద నాటబడినదై కాలువయొద్ద వేళ్లు తన్ను చెట్టువలె నుండును, ఎండ తగిలినను భయపడదు\"", "Hope in God acts as deep roots drawing life during scorching droughts of circumstance.", "ఎండ తీవ్రతకు ఎండిపోక నిరంతరము పచ్చగా ఫలిస్తూ జలములయొద్ద వేళ్లుతన్ను చెట్టువంటి నిరీక్షణ."],
    ["Jeremiah 17:13 declaring: 'O Lord, the hope of Israel, all who forsake You shall be ashamed'", "యిర్మీయా 17:13 'ఇశ్రాయేలునకు నిరీక్షణాధారమైన యెహోవా, నిన్ను విసర్జించువారందరు సిగ్గుపడుదురు'", "Jeremiah 17:13", "\"O Lord, the hope of Israel, all who forsake You shall be ashamed. Those who depart from Me shall be written in the earth, because they have forsaken the fountain of living waters\"", "\"ఇశ్రాయేలునకు నిరీక్షణాధారమైన యెహోవా, నిన్ను విసర్జించువారందరు సిగ్గుపడుదురు; జీవజలముల ఊటయైన యెహోవాను వారు విసర్జించియున్నారు\"", "Abandoning God, the spring of living water, leads to dry shame; clinging to Him gives eternal life.", "జీవజలముల ఊటయైన దేవుని విడిచిపెట్టక ఆయననే నిరీక్షణాధారముగా చేసికొనుట."],
    ["Jeremiah 17:17 Jeremiah praying: 'Do not be a terror to me; You are my hope in the day of doom'", "యిర్మీయా 17:17 'నీవు నాకు భయకారణముగా ఉండకుము; ఆపద్దినమందు నీవే నా నిరీక్షణవు'", "Jeremiah 17:17", "\"Do not be a terror to me; You are my hope in the day of doom. Let them be ashamed who persecute me, but do not let me be put to shame\"", "\"నీవు నాకు భయకారణముగా ఉండకుము, ఆపద్దినమందు నీవే నా ఆశ్రయమవు (నా నిరీక్షణవు); నన్ను హింసించువారు సిగ్గుపడుదురు గాక గాని నన్ను సిగ్గుపడనియ్యకుము\"", "When catastrophic judgment strikes the nation, God remains the personal sanctuary of hope for His servant.", "సర్వనాశన దినమున సైతం భయమునకు తావియ్యక దేవునియందే తన నిరీక్షణను నిలుపుకొనిన యిర్మీయా."],
    ["Jeremiah 31:17 promising weeping Rachel: 'There is hope in your future, says the Lord, that your children shall come back to their own border'", "యిర్మీయా 31:17 ఏడ్చుచున్న రాహేలుకు దేవుని ఓదార్పు: 'రాబోవు కాలమునందు నీకు నిరీక్షణ కలదు, నీ పిల్లలు తమ స్వదేశమునకు తిరిగి వత్తురు'", "Jeremiah 31:17", "\"There is hope in your future, says the Lord, that your children shall come back to their own border. Restrain your voice from weeping, and your eyes from tears\"", "\"రాబోవు కాలమునందు నీకు నిరీక్షణ కలదు, నీ పిల్లలు తమ స్వదేశమునకు తిరిగి వత్తురు అని యెహోవా సెలవిచ్చుచున్నాడు; నీవు ఏడ్వక యుండునట్లు నీ స్వరమును అణచుకొనుము\"", "Maternal tears for slaughtered and exiled children wiped away by the promise of national restoration.", "తన బిడ్డలకొరకు ఏడ్చుచున్న తల్లి కన్నీటిని తుడిచి రాబోవు కాలమందు నిరీక్షణను వాగ్దానము చేసిన దేవుడు."],
    ["Lamentations 3:25-26 on the Lord being good to those who wait for Him, to the soul who seeks Him; it is good that one should hope quietly", "విలాపవాక్యములు 3:25-26 తనకొరకు కనిపెట్టువారియెడల యెహోవా దయాళుడు; మనుష్యుడు మౌనముగా ఉండి యెహోవా రక్షణకొరకు కనిపెట్టుట మంచిది", "Lamentations 3:25-26", "\"The Lord is good to those who wait for Him, to the soul who seeks Him. It is good that one should hope and wait quietly for the salvation of the Lord\"", "\"తనకొరకు కనిపెట్టువారియెడల తనను వెదకువారియెడల యెహోవా దయాళుడు; నరులు మౌనముగా ఉండి యెహోవా రక్షణకొరకు కనిపెట్టుట మంచిది\"", "The spiritual virtue of quiet, patient expectancy in the furnace of affliction.", "ఆందోళనతో తొందరపడక మౌనముగా దేవుని రక్షణకొరకు కనిపెట్టుటయే ఆత్మీయ క్షేమము."],
    ["Lamentations 3:29 on putting one's mouth in the dust, if so there may be hope", "విలాపవాక్యములు 3:29 నిరీక్షణ కలుగునేమో అని ఒకడు తన నోరు ధూళిలో పెట్టుకొనుట", "Lamentations 3:29", "\"Let him put his mouth in the dust—there may yet be hope. Let him give his cheek to the one who strikes him, and be full of reproach\"", "\"ఒకవేళ నిరీక్షణ కలుగునేమో అని వాడు తన నోరు ధూళిలో పెట్టుకొనవలెను; తన్ను కొట్టువానితట్టు తన చెంపను తిప్పవలెను\"", "Profound posture of total self-humiliation before God that opens the gate to divine mercy.", "దైవిక తీర్పుయెదుట సంపూర్ణముగా తగ్గింపబడి ధూళిలో పడుట నూతన నిరీక్షణకు ద్వారము తెరుచును."],
    ["Hosea 2:15 on God giving the Valley of Achor (Trouble) as a door of hope", "హోషేయ 2:15 ఆకోరు లోయను (శ్రమల లోయను) నిరీక్షణ ద్వారముగా దేవుడు మార్చుట", "Hosea 2:15", "\"I will give her her vineyards from there, and the Valley of Achor as a door of hope; she shall sing there, as in the days of her youth\"", "\"అక్కడనుండి ఆమెకు ద్రాక్షతోటలను, నిరీక్షణ ద్వారముగా ఆకోరు లోయను ఇచ్చెదను; ఆమె తన బాల్యదినములలో పాడినట్లు అక్కడ పాడును\"", "God transforms the tragic place of past sin and failure (Achan's Valley of Achor) into a gateway of hope.", "శాపమునకు తీర్పునకు గుర్తుగా ఉన్న ఆకోరు లోయను రక్షణ ఆనంద నిరీక్షణ ద్వారముగా మార్చిన దేవుని కృప."],
    ["Joel 3:16 on the Lord roaring from Zion, but the Lord being a hope (shelter) for His people and strength for Israel", "యోవేలు 3:16 యెహోవా సీయోనునుండి గర్జించునప్పుడు ఆయన తన ప్రజలకు ఆశ్రయముగాను (నిరీక్షణగాను) ఇశ్రాయేలీయులకు కోటగాను ఉండుట", "Joel 3:16", "\"The Lord also will roar from Zion, and utter His voice from Jerusalem; the heavens and earth will shake; but the Lord will be a shelter for His people, and the strength of the children of Israel\"", "\"యెహోవా సీయోనులోనుండి గర్జించుచున్నాడు, యెరూషలేములోనుండి తన స్వరము వినబడజేయుచున్నాడు, భూమ్యాకాశములు వణకుచున్నవి; అయినను యెహోవా తన ప్రజలకు ఆశ్రయముగాను (నిరీక్షణాస్పదముగాను) ఇశ్రాయేలీయులకు కోటగాను ఉండును\"", "In the apocalyptic shaking of cosmic powers, God is the unshakeable shelter of His flock.", "భూమ్యాకాశములు దద్దరిల్లు తీర్పు దినమున సైతం తన ప్రజలకు సురక్షితమైన నిరీక్షణా కోటగా నిలుచు యెహోవా."],
    ["Micah 7:7 testifying: 'Therefore I will look to the Lord; I will wait for the God of my salvation; my God will hear me'", "మీకా 7:7 'నేనైతే యెహోవాకొరకు ఎదురుచూచెదను, నా రక్షకుడైన దేవునికొరకు కనిపెట్టెదను; నా దేవుడు నా ప్రార్థన ఆలకించును'", "Micah 7:7", "\"Therefore I will look to the Lord; I will wait for the God of my salvation; my God will hear me\"", "\"నేనైతే యెహోవాకొరకు కనిపెట్టెదను, నా రక్షణకర్తయైన దేవునికొరకు ఎదురుచూచెదను; నా దేవుడు నా ప్రార్థన ఆలకించును.\"", "When civil society decays and families turn treacherous, the prophet fixes hope on God alone.", "సమాజములో న్యాయము నశించి బంధువులు శత్రువులైన సమయములో రక్షణకర్తయైన దేవునిపైనే నిలిచిన నిరీక్షణ."],
    ["Habakkuk 2:3 on the vision being for an appointed time; though it tarries, wait for it, because it will surely come", "హబక్కూకు 2:3 దర్శన విషయము ఇంక నిర్ణయకాలమున జరుగును, అది ఆలస్యమైనను దానికొరకు కనిపెట్టుము, అది నిశ్చయముగా వచ్చును", "Habakkuk 2:3", "\"For the vision is yet for an appointed time; but at the end it will speak, and it will not lie. Though it tarries, wait for it; because it will surely come, it will not tarry\"", "\"ఆ దర్శనవిషయము ఇంక నిర్ణయకాలమున జరుగును, సమాప్తియందు అది నెరవేరును, అది తప్పక నెరవేరును; అది ఆలస్యముగా వచ్చినను దానికొరకు కనిపెట్టుము, అది నిశ్చయముగా వచ్చును, అది ఆలస్యము చేయదు\"", "Prophetic promises operate on God's sovereign calendar; delays are tests of steadfast hope.", "దేవుడు నిర్ణయించిన కాలములో దర్శనము తప్పక నెరవేరును గనుక విశ్వాసముతో కనిపెట్టుకొనుట."],
    ["Zephaniah 3:8 commanding: 'Therefore wait for Me, says the Lord, until the day I rise up for plunder'", "జెఫన్యా 3:8 'యెహోవా సెలవిచ్చునదేమనగా-నేను తీర్పు తీర్చు దినమువరకు నాకొరకు కనిపెట్టుకొని యుండుడి'", "Zephaniah 3:8", "\"Therefore wait for Me, says the Lord, until the day I rise up for plunder; My determination is to gather the nations\"", "\"కాబట్టి యెహోవా సెలవిచ్చునదేమనగా-నేను దోపుడుసొమ్ము పట్టుకొనుటకు లేచు దినమువరకు నాకొరకు కనిపెట్టుకొని యుండుడి; నా ఉగ్రతను వారిమీద కుమ్మరించుటకు రాజ్యములను సమకూర్చుట నా తీర్మానము\"", "Believers are told to wait patiently for God's cosmic vindication rather than taking private revenge.", "దేవుడే స్వయముగా సర్వలోక అన్యాయములకు తీర్పుతీర్చి తన ప్రజలను హెచ్చించువరకు కనిపెట్టు నిరీక్షణ."],
    ["Luke 2:25-26 devout Simeon waiting for the Consolation of Israel, guided by the Holy Spirit to see the Christ", "లూకా 2:25-26 ఇశ్రాయేలుయొక్క ఆదరణకొరకు కనిపెట్టుచున్న నీతిమంతుడైన సుమెయోను ప్రభువు క్రీస్తును చూచుట", "Luke 2:25", "\"And behold, there was a man in Jerusalem whose name was Simeon, and this man was just and devout, waiting for the Consolation of Israel, and the Holy Spirit was upon him\"", "\"యెరూషలేమునందు సుమెయోనను ఒక మనుష్యుడుండెను. అతడు నీతిమంతుడును భక్తిపరుడునై యుండి, ఇశ్రాయేలుయొక్క ఆదరణకొరకు కనిపెట్టువాడు; పరిశుద్ధాత్మ అతనిమీద ఉండెను\"", "Decades of patient, Spirit-filled hope rewarded by embracing baby Jesus, the Messiah.", "జీవితాంతము నిరీక్షణతో కనిపెట్టి రక్షకుడైన శిశువును తన చేతులలోనికి ఎత్తికొని దేవుని స్తుతించిన సుమెయోను."],
    ["Luke 2:36-38 elderly prophetess Anna serving God with fastings and prayers, speaking of the Child to all who looked for redemption", "లూకా 2:36-38 ఎనుబది నాలుగు సంవత్సరములు ఉపవాస ప్రార్థనలతో కనిపెట్టి విమోచనకొరకు ఎదురుచూచువారందరితో క్రీస్తును గూర్చి మాటలాడిన అన్న", "Luke 2:38", "\"And coming in that instant she gave thanks to the Lord, and spoke of Him to all those who looked for redemption in Jerusalem\"", "\"ఆ గడియలోనే ఆమెయు లోపలికి వచ్చి దేవుని స్తుతించి, యెరూషలేములో విమోచనకొరకు కనిపెట్టుచున్న వారందరితో ఆయననుగూర్చి మాటలాడుచుండెను\"", "Eighty-four years of widowhood filled with tireless, prayerful hope in the coming Redeemer.", "రక్షణ కొరకు కనిపెట్టిన భక్తులకు క్రీస్తు దర్శనముతో లభించిన సంపూర్ణ నిరీక్షణ నెరవేర్పు."],
    ["Luke 23:50-51 Joseph of Arimathea, a good and just counselor, who himself was waiting for the kingdom of God", "లూకా 23:50-51 దేవుని రాజ్యముకొరకు కనిపెట్టుచుండిన సజ్జనుడును నీతిమంతుడునైన అరిమతైయ యోసేపు ధైర్యముగా యేసు దేహమును అడుగుట", "Luke 23:51", "\"He was from Arimathea, a city of the Jews, who himself was also waiting for the kingdom of God. This man went to Pilate and asked for the body of Jesus\"", "\"అరిమతైయ పట్టణపువాడైన యోసేపు అను సజ్జనుడును నీతిమంతుడునునైన ఆలోచనకర్త ఒకడుండెను; అతడు దేవుని రాజ్యముకొరకు కనిపెట్టుచుండినవాడు; అతడు పిలాతునొద్దకు వెళ్లి యేసు దేహమును అడిగెను\"", "Quiet, secret discipleship anchored in kingdom hope emerging boldly at the foot of the cross.", "దేవుని రాజ్య నిరీక్షణతో నిండి క్రీస్తు సిలువ మరణ ఘడియలో ధైర్యముగా ముందుకువచ్చిన యోసేపు."],
    ["Acts 24:14-15 Paul confessing before Governor Felix: 'I have hope in God... that there will be a resurrection of the dead'", "అపొస్తలుల కార్యములు 24:14-15 అధిపతియైన ఫేలిక్సు ఎదుట పౌలు సాక్ష్యము: 'నీతిమంతులకును అనీతిమంతులకును పునరుత్థానము కలుగునని దేవునియందు నిరీక్షణ కలిగియున్నాను'", "Acts 24:15", "\"I have hope in God, which they themselves also accept, that there will be a resurrection of the dead, both of the just and the unjust\"", "\"నీతిమంతులకును అనీతిమంతులకును పునరుత్థానము కలుగుబోవుచున్నదని వీరు ఎదురుచూచుచున్నట్టు, నేనును దేవునియందు నిరీక్షణ కలిగియున్నాను\"", "Resurrection hope forms the legal and theological core of Paul's defense before Roman rulers.", "పునరుత్థాన నిరీక్షణయే క్రైస్తవ విశ్వాసమునకు మరియు అపొస్తల బోధకు ప్రాణాధారమని నిరూపించుట."],
    ["Acts 26:6-7 Paul testifying before King Agrippa: 'And now I stand and am judged for the hope of the promise made by God to our fathers'", "అపొస్తలుల కార్యములు 26:6-7 అగ్రిప్ప రాజు ఎదుట పౌలు: 'మన పితరులకు దేవుడు చేసిన వాగ్దానమును గూర్చిన నిరీక్షణనుబట్టియే నేడు విచారణలో నిలిచియున్నాను'", "Acts 26:6-7", "\"And now I stand and am judged for the hope of the promise made by God to our fathers. To this promise our twelve tribes, earnestly serving God night and day, hope to attain\"", "\"దేవుడు మన పితరులకు చేసిన వాగ్దానమునుగూర్చిన నిరీక్షణనిమిత్తమే నేను విచారణలో నిలువబడియున్నాను; రాత్రింబగళ్లు ఆసక్తితో దేవుని సేవించుచు మన పన్నెండు గోత్రములవారు ఆ వాగ్దానము పొందుదుమని నిరీక్షించుచున్నారు\"", "The hope of Israel fulfilled completely in the resurrected Messiah Jesus.", "పితరులకు దేవుడు చేసిన నిత్య నిబంధన వాగ్దానపు నిరీక్షణయే క్రీస్తునందు సంపూర్ణముగా నెరవేరెను."],
    ["Acts 28:20 Paul declaring to the Jewish leaders in Rome: 'For the hope of Israel I am bound with this chain'", "అపొస్తలుల కార్యములు 28:20 రోములోని యూదా పెద్దలతో పౌలు: 'ఇశ్రాయేలుయొక్క నిరీక్షణ నిమిత్తమే నేను ఈ సంకెళ్లతో కట్టబడియున్నాను'", "Acts 28:20", "\"For this reason therefore I have called for you, to see you and speak with you, because for the hope of Israel I am bound with this chain\"", "\"ఈ హేతువుచేతనే మిమ్మును చూచి మాటలాడవలెనని పిలిపించితిని; ఏలయనగా ఇశ్రాయేలుయొక్క నిరీక్షణ నిమిత్తమే నేను ఈ గొలుసుతో కట్టబడియున్నాను\"", "Apostolic martyrdom and chains suffered gladly for the sake of the messianic hope.", "ఇశ్రాయేలు ప్రజలందరి అసలైన రక్షణ నిరీక్షణయైన క్రీస్తు కోసమే పౌలు బంధకములను సహించెను."],
    ["Romans 4:18 on Abraham, contrary to hope, in hope believing, so that he became the father of many nations", "రోమీయులకు 4:18 నిరీక్షణకు ఆధారము లేనప్పుడును అతడు నిరీక్షణ కలిగి నమ్మెను, అందువలన అనేక జనములకు తండ్రి ఆయెను", "Romans 4:18", "\"Who, contrary to hope, in hope believed, so that he became the father of many nations, according to what was spoken, 'So shall your descendants be'\"", "\"నీ సంతానము ఈలాగు ఉండునని చెప్పబడినదానినిబట్టి, తాను అనేక జనములకు తండ్రి యగునట్లు, నిరీక్షణకు ఆధారము లేనప్పుడు అతడు నిరీక్షణ కలిగి నమ్మెను\"", "Supernatural hope believing God's bare Word against all biological impossibility.", "శరీరము చచ్చినదైనను దేవుని వాగ్దానమును నమ్మి అసాధ్యములో నిరీక్షించిన అబ్రాహాము విశ్వాస మాదిరి."],
    ["Romans 12:12 commanding: 'Rejoicing in hope, patient in tribulation, continuing steadfastly in prayer'", "రోమీయులకు 12:12 'నిరీక్షణగలవారై సంతోషించుచు, శ్రమయందు ఓర్పుగలవారై, ప్రార్థనయందు పట్టుదల కలిగియుండుడి'", "Romans 12:12", "\"Rejoicing in hope, patient in tribulation, continuing steadfastly in prayer\"", "\"నిరీక్షణగలవారై సంతోషించుచు, శ్రమయందు ఓర్పుగలవారై, ప్రార్థనయందు పట్టుదల కలిగియుండుడి.\"", "The balanced Christian life: joyful hope fueling patient endurance and relentless prayer.", "భవిష్యత్ నిరీక్షణలో ఆనందిస్తూ ప్రస్తుత శ్రమలలో ఓర్పువహించి నిత్యము ప్రార్థించు ఆత్మీయ జీవన విధానము."],
    ["1 Corinthians 9:10 on he who plows should plow in hope, and he who threshes in hope should be partaker of his hope", "1 కొరింథీయులకు 9:10 దున్నువాడు నిరీక్షణతో దున్నవలెను, నూర్చువాడు ఫలములో పాలుపొందుదునను నిరీక్షణతో నూర్చవలెను", "1 Corinthians 9:10", "\"He who plows should plow in hope, and he who threshes in hope should be partaker of his hope\"", "\"దున్నువాడు నిరీక్షణతో దున్నవలెననియు, నూర్చువాడు ఫలములో పాలుపొందుదునను నిరీక్షణతో నూర్చవలెననియు... మనకొరకే గదా ఈలాగు చెప్పుచున్నాడు?\"", "Gospel ministry labor energized by the confident hope of spiritual harvest.", "సువార్త పొలములో కష్టపడు సేవకుడు ఆత్మీయ పంటఫలమును పొందుదునను నిరీక్షణతో పనిచేయవలెను."],
    ["1 Corinthians 13:7 on love bearing all things, believing all things, hoping all things, enduring all things", "1 కొరింథీయులకు 13:7 ప్రేమ అన్నిటిని తాళుకొనును, అన్నిటిని నమ్మును, అన్నిటిని నిరీక్షించును, అన్నిటిని ఓర్చుకొనును", "1 Corinthians 13:7", "\"Bears all things, believes all things, hopes all things, endures all things. Love never fails\"", "\"ప్రేమ అన్నిటిని తాళుకొనును, అన్నిటిని నమ్మును, అన్నిటిని నిరీక్షించును, అన్నిటిని ఓర్చుకొనును; ప్రేమ ఎన్నడును గతించదు\"", "Agape love never surrenders to cynical despair; it tenaciously keeps hope alive for people.", "ఇతరులు పడిపోయినను వారి రక్షణ పునరుద్ధరణ కొరకు ఎన్నడును నిరీక్షణ కోల్పోని క్రీస్తు ప్రేమ."],
    ["2 Corinthians 1:9-10 on God delivering us from so great a death, and we trust that He will still deliver us", "2 కొరింథీయులకు 1:9-10 అంత గొప్ప మరణమునుండి మమ్మును విడిపించిన దేవుడు ఇకముందును విడిపించునని ఆయనయందు నిరీక్షణ యుంచుట", "2 Corinthians 1:10", "\"Who delivered us from so great a death, and does deliver us; in whom we trust that He will still deliver us\"", "\"ఆయన అంత గొప్ప మరణమునుండి మమ్మును విడిపించెను, ఇకముందును విడిపించును; మరియు మాకొరకు ఇంకను విడిపించునని ఆయనయందు నిరీక్షణ యుంచియున్నాము\"", "Past deliverances construct the launching ramp for present trust and future hope.", "గతములో అద్భుతముగా మరణమునుండి తప్పించిన దేవుడే భవిష్యత్తులోను నిశ్చయముగా విడిపించునను నిరీక్షణ."],
    ["2 Corinthians 3:12 on having such hope, we use great boldness of speech", "2 కొరింథీయులకు 3:12 ఇట్టి నిరీక్షణ మనకు కలిగియున్నందున మిక్కిలి ధైర్యముగా మాటలాడుచున్నాము", "2 Corinthians 3:12", "\"Therefore, since we have such hope, we use great boldness of speech—unlike Moses, who put a veil over his face\"", "\"కాబట్టి మనమిట్టి నిరీక్షణ గలవారమై, మోషేవలె కాక బహు ధైర్యముగా మాటలాడుచున్నాము; మోషే ముఖముమీద ముసుగు వేసికొనెను గాని...\"", "New covenant hope eradicates timid concealment, unleashing transparent, courageous gospel proclamation.", "క్రీస్తు సువార్త నిరీక్షణ విశ్వాసికి ఎటువంటి ముసుగు లేని నిర్భయమైన సాక్ష్యపు ధైర్యమునిచ్చును."],
    ["Ephesians 1:18 praying that the eyes of your understanding being enlightened, you may know what is the hope of His calling", "ఎఫెసీయులకు 1:18 మీరు ఆయన పిలుపువలన ఏర్పడిన నిరీక్షణ ఎట్టిదో తెలిసికొనునట్లు మీ హృదయ నేత్రములు వెలిగింపబడును గాక", "Ephesians 1:18", "\"The eyes of your understanding being enlightened; that you may know what is the hope of His calling, what are the riches of the glory of His inheritance in the saints\"", "\"మీరు ఆయన పిలుపువలన ఏర్పడిన నిరీక్షణ ఎట్టిదో, పరిశుద్ధులలో ఆయన స్వాస్థ్యముయొక్క మహిమైశ్వర్యమెట్టిదో మీరు తెలిసికొనునట్లు, మీ హృదయ నేత్రములు వెలిగింపబడవలెనని ప్రార్థించుచున్నాను\"", "Spiritual illumination revealing the staggering wealth and certainty of our calling's hope.", "పరిశుద్ధాత్మ దేవుడు విశ్వాసి హృదయ కన్నులను తెరిచి దైవిక పిలుపుయొక్క ఉన్నత నిరీక్షణను గ్రహింపజేయును."],
    ["Ephesians 4:4 on there being one body and one Spirit, just as you were called in one hope of your calling", "ఎఫెసీయులకు 4:4 శరీరమొక్కటే, ఆత్మయు ఒక్కడే; ఆ ప్రకారమే మీ పిలుపువిషయములో ఒక్కటే నిరీక్షణ యుండుటకు పిలువబడితిరి", "Ephesians 4:4", "\"There is one body and one Spirit, just as you were called in one hope of your calling; one Lord, one faith, one baptism; one God and Father of all\"", "\"శరీరమొక్కటే, ఆత్మయు ఒక్కడే; ఆ ప్రకారమే మీ పిలుపువిషయమై ఏర్పడిన నిరీక్షణ యొకటే; ప్రభువు ఒక్కడే, విశ్వాసమొక్కటే, బాప్తిస్మమొక్కటే; అందరికి తండ్రియైన దేవుడొక్కడే\"", "The singular, unifying destiny of the global church sharing identical eternal hope.", "సమస్త జాతుల విశ్వాసులందరినీ ఏకము చేయు పరలోక రాజ్యపు ఏకైక రక్షణ నిరీక్షణ."],
    ["Philippians 1:20 on according to my earnest expectation and hope that in nothing I shall be ashamed, but that Christ will be magnified in my body", "ఫిలిప్పీయులకు 1:20 దేనియందును సిగ్గుపడక బ్రదుకువలననైనను చావవలననైనను క్రీస్తు నా శరీరమందు ఘనపరచబడునను నా ఆశయు నిరీక్షణయు", "Philippians 1:20", "\"According to my earnest expectation and hope that in nothing I shall be ashamed, but with all boldness, as always, so now also Christ will be magnified in my body, whether by life or by death\"", "\"నేను దేనియందును సిగ్గుపడక, ఎప్పటివలెనే యిప్పుడును పూర్ణధైర్యముతో మాటలాడుటవలన, నా బ్రదుకువలననైనను చావవలననైనను క్రీస్తు నా శరీరమందు ఘనపరచబడునని నేను మిక్కిలి ఆపేక్షతో కనిపెట్టుచు నిరీక్షించుచున్నాను\"", "Apostolic life or death subordinated completely to the triumphant hope of glorifying Jesus.", "జీవించినను మరణించినను క్రీస్తును మహిమపరచుటలోనే తన సమస్త నిరీక్షణను కేంద్రీకరించిన పౌలు భక్తి."]
  ];

  return data.map((item, idx) => ({
    easyQ: `What scriptural truth or testimony of persevering faith is taught regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన బోధ లేదా సాక్ష్యమేమి?`,
    medQ: `According to ${item[2]}, how does the believer maintain hope in God during difficult trials?`,
    medQTe: `${item[2]} లేఖనము ప్రకారం శోధనలు శ్రమలు ఎదురైనప్పుడు విశ్వాసి దేవునియందు నిరీక్షణను ఎలా కాపాడుకొనవలెను?`,
    hardQ: `What theological principle does ${item[2]} reveal about the origin, anchor, and ultimate victory of biblical hope?`,
    hardQTe: `${item[2]} ప్రకారం బైబిలు నిరీక్షణ యొక్క మూలము, ఆధారము మరియు నిత్య జయమును గూర్చి విశ్వాసులు ఏమి గ్రహించవలెను?`,
    options: [item[3], "To retreat into forty days of silent despair in the desert", "To pay seventy pieces of gold to foreign astrologers", "To build sixty bronze altars outside the city walls"],
    optionsTelugu: [item[4], "అరణ్యములో నలభై దినములు మౌన నిరాశతో కృంగిపోవుట", "విదేశీ జ్యోతిష్కులకు డెబ్బై బంగారు నాణెములను సమర్పించుట", "పట్టణ ప్రాకారముల వెలుపల అరవై ఇత్తడి బలిపీఠములను కట్టుట"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

// 50 Mastery Facts for Hope (Eschatology, Resurrection, Covenant Theology, Trinitarian Dimensions)
function buildHopeMastery() {
  const data = [
    ["Romans 8:18-21 on the earnest expectation of creation waiting for the revealing of the sons of God, creation itself delivered into glorious liberty", "రోమీయులకు 8:18-21 సృష్టి దేవుని కుమారుల ప్రత్యక్షతకొరకు మిక్కిలి ఆశతో కనిపెట్టుచున్నది, క్షయతకు దాస్యములోనుండి మహిమయొక్క స్వాతంత్ర్యములోనికి విడుదల పొందును", "Romans 8:19-21", "\"For the earnest expectation of the creation eagerly waits for the revealing of the sons of God... because the creation itself also will be delivered from the bondage of corruption into the glorious liberty of the children of God\"", "\"ఏలయనగా దేవుని కుమారుల ప్రత్యక్షతకొరకు సృష్టి మిక్కిలి ఆశతో కనిపెట్టుచున్నది... సృష్టియు క్షయతయొక్క దాస్యములోనుండి విడిపింపబడి, దేవుని పిల్లలు పొందబోవు మహిమగల స్వాతంత్ర్యము పొందును\"", "Cosmic eschatology: creation itself shares in the redeemed hope of bodily resurrection.", "సమస్త సృష్టియు పాపపు క్షయతనుండి విడిపింపబడి దేవుని పిల్లలతోపాటు నిత్య మహిమను పొందునను నిరీక్షణ."],
    ["Romans 8:23 on believers having the firstfruits of the Spirit groaning within ourselves, eagerly waiting for the adoption, the redemption of our body", "రోమీయులకు 8:23 ఆత్మయొక్క ప్రథమఫలములను పొందిన మనము దత్తపుత్రత్వము కొరకు, అనగా మన శరీర విమోచనకొరకు వేచియుండుట", "Romans 8:23", "\"Not only that, but we also who have the firstfruits of the Spirit, even we ourselves groan within ourselves, eagerly waiting for the adoption, the redemption of our body\"", "\"అంతేకాదు, ఆత్మయొక్క ప్రథమఫలముల నొందిన మనముకూడ దత్తపుత్రత్వము కొరకు, అనగా మన శరీరముయొక్క విమోచనకొరకు కనిపెట్టుచు మనలో మనము మూలుగుచున్నాము\"", "Somatic redemption: hope is not ethereal escape from flesh, but the physical resurrection of the body.", "శరీరమునుండి పారిపోవుట కాక క్రీస్తు పునరుత్థాన మహిమరూపములోనికి మన శరీరము మార్చబడునను నిరీక్షణ."],
    ["1 Corinthians 15:19 on if in this life only we have hope in Christ, we are of all men the most pitiable", "1 కొరింథీయులకు 15:19 ఈ జీవితమునకై మాత్రమే మనము క్రీస్తునందు నిరీక్షించువారమైనయెడల మనుష్యులందరికంటె దౌర్భాగ్యులమై యుందుము", "1 Corinthians 15:19", "\"If in this life only we have hope in Christ, we are of all men the most pitiable. But now Christ is risen from the dead, and has become the firstfruits of those who have fallen asleep\"", "\"ఈ జీవితమునకై మాత్రమే మనము క్రీస్తునందు నిరీక్షించువారమైనయెడల మనుష్యులందరికంటె దౌర్భాగ్యులమై యుందుము; అయితే నిద్రించినవారిలో ప్రథమఫలముగా క్రీస్తు మృతులలోనుండి లేపబడియున్నాడు\"", "Christianity rises or collapses upon the bodily resurrection; hope spans into eternity.", "కేవలము ఈ లోక ఆశీర్వాదముల కొరకే కాక నిత్య పునరుత్థాన మహిమకొరకే క్రీస్తునందలి నిజమైన నిరీక్షణ."],
    ["1 Corinthians 15:51-54 on we shall not all sleep, but we shall all be changed in a moment, in the twinkling of an eye at the last trumpet", "1 కొరింథీయులకు 15:51-54 మనమందరము నిద్రించము గాని కడబూర మ్రోగగానే క్షణములో ఒక రెప్పపాటున మనమందరము మార్పు పొందుదుము", "1 Corinthians 15:52", "\"In a moment, in the twinkling of an eye, at the last trumpet. For the trumpet will sound, and the dead will be raised incorruptible, and we shall be changed\"", "\"ఒక రెప్పపాటున, కడబూర మ్రోగగానే క్షణములో మనమందరము మార్పుపొందుదుము. బూర మ్రోగును, అప్పుడు మృతులు అక్షయులుగా లేపబడుదురు, మనము మార్పు పొందుదుము\"", "The climactic transfiguration of mortality: corruption putting on incorruption at Christ's trumpet.", "కడబూర మ్రోగగానే మృతులు అక్షయులుగా లేపబడి సజీవులు మహిమ శరీరమును ధరించుకొను పరమ నిరీక్షణ."],
    ["1 Corinthians 15:55-57 triumphant shout: 'O Death, where is your sting? O Hades, where is your victory?' Thanks be to God who gives us the victory through our Lord Jesus Christ", "1 కొరింథీయులకు 15:55-57 'ఓ మరణమా, నీ ముల్లు ఎక్కడ? ఓ పాతాళమా, నీ జయమెక్కడ? మన ప్రభువైన యేసుక్రీస్తుద్వారా మనకు జయము నిచ్చుచున్న దేవునికి స్తోత్రము'", "1 Corinthians 15:55,57", "\"O Death, where is your sting? O Hades, where is your victory?... But thanks be to God, who gives us the victory through our Lord Jesus Christ\"", "\"ఓ మరణమా, నీ ముల్లు ఎక్కడ? ఓ పాతాళమా, నీ జయమెక్కడ?... అయినను మన ప్రభువైన యేసుక్రీస్తుద్వారా మనకు జయము అనుగ్రహించుచున్న దేవునికి స్తోత్రము కలుగును గాక\"", "The utter decapitation of death and hell: complete victory secured for the believer.", "మరణముయొక్క విషపు ముల్లును విరిచి పాతాళముపై సంపూర్ణ జయమునిచ్చిన క్రీస్తుయొక్క నిత్య విజయోత్సవము."],
    ["2 Corinthians 4:16-18 on our light affliction which is but for a moment working for us a far more exceeding and eternal weight of glory", "2 కొరింథీయులకు 4:16-18 క్షణమాత్రముండు మా తేలికపాటి శ్రమ మాకొరకు అంతకంతకు అత్యధికమైన నిత్య మహిమభారమును కలుగజేయుచున్నది", "2 Corinthians 4:17-18", "\"For our light affliction, which is but for a moment, is working for us a far more exceeding and eternal weight of glory, while we do not look at the things which are seen, but at the things which are not seen\"", "\"మేము కనబడువాటిని చూడక కనబడనివాటినే నిదానించి చూచుచున్నాము గనుక, క్షణమాత్రముండు మా తేలికపాటి శ్రమ మాకొరకు అంతకంతకు అత్యధికమైన నిత్యమైన మహిమభారమును కలుగజేయుచున్నది\"", "The cosmic scale: momentary earthly anguish is infinitely outweighed by eternal glory.", "కనిపించే తాత్కాలిక శ్రమలను దాటి కనబడని నిత్య మహిమభారమును నిదానించి చూచు నిరీక్షణ."],
    ["2 Corinthians 5:1-4 on knowing that if our earthly house, this tent, is destroyed, we have a building from God, a house not made with hands, eternal in the heavens", "2 కొరింథీయులకు 5:1-4 భూమిమీది మన గుడారమైన ఈ నివాసము శిథిలమైపోయినను, చేతిపని కాక దేవునివలన కలుగు నిత్యమైన నివాసము పరలోకమందు మనకున్నదని యెరుగుదుము", "2 Corinthians 5:1", "\"For we know that if our earthly house, this tent, is destroyed, we have a building from God, a house not made with hands, eternal in the heavens\"", "\"భూమిమీది మన గుడారమైన యీ నివాసము శిథిలమైపోయినను, చేతిపని కాక దేవునివలన కలుగు నిత్యమైన నివాసము, అనగా పరలోకసంబంధమైన యిల్లు ఒకటి మనకున్నదని యెరుగుదుము\"", "Replacing fragile mortal biology (tent) with imperishable resurrection architecture (temple/building).", "మట్టి గుడారమువంటి ఈ శరీరము అంతరించినను పరలోకమందు దేవుడిచ్చు నిత్య మహిమ శరీరము మనకున్నదను నిరీక్షణ."],
    ["2 Corinthians 5:6-8 on being confident, knowing that while we are at home in the body we are absent from the Lord; we walk by faith, not by sight", "2 కొరింథీయులకు 5:6-8 శరీరములో నివసించుచున్నంతకాలము ప్రభువునకు దూరముగా ఉన్నామని యెరిగియుండియు విశ్వాసమువలననే నడుచుకొనుచున్నాము", "2 Corinthians 5:7-8", "\"For we walk by faith, not by sight. We are confident, yes, well pleased rather to be absent from the body and to be present with the Lord\"", "\"విశ్వాసమువలననే నడుచుకొనుచున్నాము గాని చూపువలన కాదు. ఇట్లు ధైర్యము గలిగి యీ శరీరమును విడిచిపెట్టి ప్రభువునొద్ద నివసించుటకు ఇష్టపడుచున్నాము\"", "Conscious intermediate fellowship: death ushers the believer immediately into Christ's presence.", "శరీరమును విడిచిన మరుక్షణమే పరలోకములో క్రీస్తుతోకూడ ముఖాముఖిగా నివసించు ఆత్మీయ నిశ్చయత."],
    ["Philippians 3:20-21 on our citizenship being in heaven, from which we eagerly wait for the Savior, who will transform our lowly body into His glorious body", "ఫిలిప్పీయులకు 3:20-21 మన పౌరస్థితి పరలోకమందున్నది, అక్కడినుండి రక్షకునికొరకు కనిపెట్టుచున్నాము; ఆయన మన దీనశరీరమును తన మహిమగల శరీరమునకు సమరూపముగా మార్చును", "Philippians 3:20-21", "\"For our citizenship is in heaven, from which we also eagerly wait for the Savior, the Lord Jesus Christ, who will transform our lowly body that it may be conformed to His glorious body\"", "\"మన పౌరస్థితి పరలోకమందున్నది; అక్కడినుండి ప్రభువైన యేసుక్రీస్తు అను రక్షకునికొరకు కనిపెట్టుకొనియున్నాము. సమస్తమును తనకు లోపరచుకొనజాలిన తన ప్రభావముచొప్పున ఆయన మన దీనశరీరమును తన మహిమగల శరీరమునకు సమరూపముగలదానిగా మార్చును\"", "Cosmic citizenship: the almighty energy of Christ conforming our mortal frame to His resurrected splendor.", "మన పౌరసత్వము పరలోకమందున్నదనియు, రక్షకుడైన యేసు మన దీన శరీరమును తన మహిమ శరీరమువలె మార్చుననియు నమ్ముట."],
    ["Colossians 3:3-4 on you died, and your life is hidden with Christ in God; when Christ who is our life appears, then you also will appear with Him in glory", "కొలొస్సయులకు 3:3-4 మీరు మృతిపొందితిరి, మీ జీవము క్రీస్తుతోకూడ దేవునియందు దాచబడియున్నది; మనకు జీవమై యున్న క్రీస్తు ప్రత్యక్షమైనప్పుడు మీరును ఆయనతోకూడ మహిమయందు ప్రత్యక్షపరచబడుదురు", "Colossians 3:3-4", "\"For you died, and your life is hidden with Christ in God. When Christ who is our life appears, then you also will appear with Him in glory\"", "\"ఏలయనగా మీరు మృతిపొందితిరి, మీ జీవము క్రీస్తుతోకూడ దేవునియందు దాచబడియున్నది; మనకు జీవమై యున్న క్రీస్తు ప్రత్యక్షమైనప్పుడు మీరును ఆయనతోకూడ మహిమయందు ప్రత్యక్షపరచబడుదురు\"", "The hidden spiritual life of believers bursts forth into public cosmic glory when Christ returns.", "క్రీస్తునందు దాచబడిన మన ఆత్మీయ జీవము ఆయన రాకడలో సర్వలోకము ఎదుట మహిమతో ప్రకాశించును."],
    ["1 Thessalonians 4:16-17 on the Lord Himself descending from heaven with a shout, the dead in Christ rising first, then we caught up together in the clouds", "1 థెస్సలొనీకయులకు 4:16-17 ఆర్భాటముతోను ప్రధానదూత శబ్దముతోను దేవుని బూరతోను పరలోకమునుండి ప్రభువు దిగివచ్చును, క్రీస్తునందు నిద్రించినవారు మొదట లేతురు", "1 Thessalonians 4:16-17", "\"For the Lord Himself will descend from heaven with a shout... And the dead in Christ will rise first. Then we who are alive and remain shall be caught up together with them in the clouds to meet the Lord in the air\"", "\"ఆర్భాటముతోను, ప్రధానదూత శబ్దముతోను, దేవుని బూరతోను పరలోకమునుండి ప్రభువు దిగివచ్చును; క్రీస్తునందుండి మృతులైనవారు మొదట లేతురు. ఆమీదట సజీవులమై శేషించియుండు మనము వారితోకూడ ఏకముగా ప్రభువును ఎదుర్కొనుటకు మేఘములమీద కొనిపోబడుదుము\"", "The glorious snatching away (harpazo/rapture) uniting living and resurrected saints with Christ forever.", "ప్రభువు బూరధ్వనితో దిగిరాగా పరిశుద్ధులందరు ఆకాశమండలములో ఆయనను ఎదుర్కొనుటకు కొనిపోబడు పరమ నిరీక్షణ."],
    ["1 Thessalonians 4:18 closing the rapture revelation: 'Therefore comfort one another with these words'", "1 థెస్సలొనీకయులకు 4:18 'కాబట్టి మీరు ఈ మాటలచేత ఒకరినొకరు ఆదరించుకొనుడి'", "1 Thessalonians 4:18", "\"Therefore comfort one another with these words\"", "\"కాబట్టి మీరు ఈ మాటలచేత ఒకరినొకరు ఆదరించుకొనుడి.\"", "Eschatological prophecy is not intended for idle theological debate but for tender mutual pastoral comfort.", "క్రీస్తు రాకడ పునరుత్థాన సత్యము శ్రమలనొందు విశ్వాసులకు ఒకరినొకరు ఓదార్చుకొనుటకు దైవిక సాధనము."],
    ["2 Thessalonians 1:7-10 on when the Lord Jesus is revealed from heaven with His mighty angels, coming to be glorified in His saints and admired in all who believe", "2 థెస్సలొనీకయులకు 1:7-10 ప్రభువైన యేసు తన ప్రభావమును కనుపరచు దూతలతో పరలోకమునుండి ప్రత్యక్షమగునప్పుడు పరిశుద్ధులయందు మహిమపరచబడుటకు వచ్చుట", "2 Thessalonians 1:10", "\"When He comes, in that Day, to be glorified in His saints and to be admired among all those who believe, because our testimony among you was believed\"", "\"ఆ దినమున తన పరిశుద్ధులయందు మహిమపరచబడుటకును, విశ్వసించినవారందరియందు ప్రశంసింపబడుటకును ఆయన వచ్చినప్పుడు...\"", "Christ's second coming: ungodly persecutors receive holy retribution while believers reflect His blinding beauty.", "తన ప్రభావముగల దూతలతో ప్రభువు ప్రత్యక్షమై శత్రువులకు తీర్పుతీర్చి విశ్వాసులమధ్య ప్రశంసింపబడు నిరీక్షణ దినము."],
    ["2 Thessalonians 2:13-14 on God choosing you from the beginning for salvation through sanctification by the Spirit, for the obtaining of the glory of our Lord Jesus Christ", "2 థెస్సలొనీకయులకు 2:13-14 మన ప్రభువైన యేసుక్రీస్తుయొక్క మహిమను పొందుటకై ఆత్మ పరిశుద్ధపరచుటవలన రక్షణ పొందుటకు దేవుడు మిమ్మును ఏర్పరచుకొనుట", "2 Thessalonians 2:14", "\"To which He called you by our gospel, for the obtaining of the glory of our Lord Jesus Christ\"", "\"మన ప్రభువైన యేసుక్రీస్తుయొక్క మహిమను పొందవలెనని, మా సువార్తవలన ఆయన ఆ రక్షణకు మిమ్మును పిలిచెను\"", "The eternal arc of election: chosen before time, called through the gospel, destined to inherit Christ's own glory.", "అనాది సంకల్పములో ఏర్పరచబడి క్రీస్తుతోపాటు నిత్య మహిమను పొందుటకు పిలువబడిన పరమ ఆధిక్యత."],
    ["1 Timothy 6:17 commanding the rich in this present age not to trust in uncertain riches but in the living God, who gives us richly all things to enjoy", "1 తిమోతి 6:17 ఈ లోకమందు ధనవంతులైనవారు అస్థిరమైన ధనమునందు నమ్మకముంచక, అనుభవించుటకు సమస్తమును ధారాళముగా అనుగ్రహించు జీవముగల దేవునియందే నిరీక్షణ యుంచుట", "1 Timothy 6:17", "\"Command those who are rich in this present age not to be haughty, nor to trust in uncertain riches but in the living God, who gives us richly all things to enjoy\"", "\"ఇహమందు ధనవంతులైనవారు గర్విష్టులు కాక, అస్థిరమైన ధనమునందు నమ్మకముంచక, మన అనుభవమునకు సమస్తమును ధారాళముగా దయచేయు దేవునియందే నిరీక్షణ యుంచుడని ఆజ్ఞాపించుము\"", "Dethroning the idol of volatile earthly wealth to anchor wholehearted confidence in the living God.", "ఎగిరిపోయే లోక ధనమును నమ్ముకొనక సమస్తమును సమృద్ధిగా అనుగ్రహించే జీవముగల దేవునియందే నిరీక్షణ యుంచుట."],
    ["2 Timothy 1:12 Paul testifying from death row: 'For I know whom I have believed and am persuaded that He is able to keep what I have committed to Him until that Day'", "2 తిమోతి 1:12 'నేను నమ్మినవానిని ఎరుగుదును, నేను ఆయనకు అప్పగించినదానిని ఆ దినమువరకు కాపాడుటకు ఆయన సమర్థుడని రూఢిగా నమ్ముచున్నాను'", "2 Timothy 1:12", "\"For I know whom I have believed and am persuaded that He is able to keep what I have committed to Him until that Day\"", "\"నేను నమ్మినవానిని ఎరుగుదును, నేను ఆయనకు అప్పగించినదానిని ఆ దినమువరకు కాపాడుటకు ఆయన సమర్థుడని రూఢిగా నమ్ముచున్నాను; ఇందువలననే నేను ఈ శ్రమలను అనుభవించుచున్నాను గాని సిగ్గుపడను\"", "Apostolic trust committing one's eternal soul and life's deposit into Christ's infallible bank.", "మరణశిక్షకు సిద్ధపడుతూ సైతం తాను నమ్మిన ప్రభువు తన ఆత్మను అంత్యదినమువరకు కాపాడునని పౌలు పలికిన అద్భుత నిరీక్షణ."],
    ["2 Timothy 4:7-8 on 'I have fought the good fight, I have finished the race, I have kept the faith. Finally, there is laid up for me the crown of righteousness'", "2 తిమోతి 4:7-8 'మంచి పోరాటము పోరాడితిని, నా పరుగు కడముట్టించితిని, విశ్వాసము కాపాడుకొంటిని; ఇకమీదట నాకొరకు నీతికిరీటము ఉంచబడియున్నది'", "2 Timothy 4:7-8", "\"Finally, there is laid up for me the crown of righteousness, which the Lord, the righteous Judge, will give to me on that Day, and not to me only but also to all who have loved His appearing\"", "\"ఇకమీదట నాకొరకు నీతికిరీటము ఉంచబడియున్నది; ఆ దినమందు నీతిగల న్యాయాధిపతియైన ప్రభువు అది నాకును, నాకు మాత్రమే కాక తన ప్రత్యక్షతను అపేక్షించువారికందరికిని అనుగ్రహించును\"", "The dying champion anticipating the victor's wreath awarded by the righteous Judge to all who love His return.", "తన పరుగు ముగించి పరలోకమందు సిద్ధపరచబడిన నీతికిరీటముకొరకు ఎదురుచూచిన పౌలుయొక్క పరమ విజయ నిరీక్షణ."],
    ["Titus 1:1-2 on the hope of eternal life which God, who cannot lie, promised before time began", "తీతుకు 1:1-2 అబద్ధమాడనేరని దేవుడు అనాదికాలమునకు ముందే వాగ్దానము చేసిన నిత్యజీవపు నిరీక్షణ", "Titus 1:2", "\"In hope of eternal life which God, who cannot lie, promised before time began, but has in due time manifested His word through preaching\"", "\"నిత్యజీవమునుగూర్చిన నిరీక్షణతో కూడినదై యున్నది; అబద్ధమాడనేరని దేవుడు అనాదికాలముననే ఈ నిత్యజీవమును వాగ్దానము చేసెను; సమయము వచ్చినప్పుడు తన వాక్యమును ప్రత్యక్షపరచెను\"", "The ontological guarantee: God cannot lie; eternal life was covenanted within the Trinity before creation.", "సృష్టికి ముందే త్రిత్వములో నిర్ణయింపబడి అబద్ధమాడని దేవునిచేత వాగ్దానము చేయబడిన నిత్యజీవ నిరీక్షణ."],
    ["Titus 3:7 on having been justified by His grace, we should become heirs according to the hope of eternal life", "తీతుకు 3:7 మనము ఆయన కృపవలన నీతిమంతులమని తీర్చబడి, నిత్యజీవపు నిరీక్షణనుబట్టి వారసులమగుట", "Titus 3:7", "\"That having been justified by His grace we should become heirs according to the hope of eternal life\"", "\"మనము ఆయన కృపవలన నీతిమంతులమని తీర్చబడి, నిత్యజీవమునుగూర్చిన నిరీక్షణనుబట్టి వారసులమగుటకై... మన రక్షకుడైన యేసుక్రీస్తుద్వారా ఆయన మనమీద ఆ ఆత్మను సమృద్ధిగా కుమ్మరించెను\"", "Legal acquittal and familial adoption: justified sinners crowned as covenant heirs of eternal life.", "క్రీస్తు కృపద్వారా ఉచితముగా నీతిమంతులుగా తీర్చబడి పరలోక రాజ్య వారసత్వ నిరీక్షణను పొందుట."],
    ["Hebrews 3:6 on Christ as a Son over His own house, whose house we are if we hold fast the confidence and the rejoicing of the hope firm to the end", "హెబ్రీయులకు 3:6 క్రీస్తు కుమారుడై ఉండి దేవుని యింటిపై నమ్మకముగా ఉండెను; మన నిరీక్షణయొక్క ధైర్యమును అతిశయమును అంతమువరకు గట్టిగా పట్టుకొనినయెడల మనమే ఆయన యిల్లు", "Hebrews 3:6", "\"Christ as a Son over His own house, whose house we are if we hold fast the confidence and the rejoicing of the hope firm to the end\"", "\"క్రీస్తు అయితే ఆయన యింటిమీద కుమారుడై యుండి నమ్మకముగా ఉండెను; మన నిరీక్షణవిషయమైన ధైర్యమును అతిశయమును అంతమువరకు గట్టిగా పట్టుకొనినయెడల మనమే ఆయన యిల్లు\"", "Perseverance of the saints: authentic identification with God's spiritual household verified by holding hope to the end.", "క్రీస్తుయొక్క నిజమైన విశ్వాస గృహముగా నిరూపింపబడుటకు నిరీక్షణ ధైర్యమును తుదివరకు కాపాడుకొనుట."],
    ["Hebrews 6:11-12 desiring each of you show the same diligence to the full assurance of hope until the end, imitating those who through faith and patience inherit the promises", "హెబ్రీయులకు 6:11-12 మీరు మందమతులు కాక, విశ్వాసముచేతను ఓర్పుచేతను వాగ్దానములను స్వతంత్రించుకొనువారిని పోలి నడుచుకొనుచు నిరీక్షణ పరిపూర్ణమగునట్లు ఆసక్తి కనుపరచుడి", "Hebrews 6:11-12", "\"And we desire that each one of you show the same diligence to the full assurance of hope until the end, that you do not become sluggish, but imitate those who through faith and patience inherit the promises\"", "\"మీలో ప్రతివాడును మీ నిరీక్షణ పరిపూర్ణమగునట్లు తుదివరకు అట్టి ఆసక్తిని కనుపరచవలెనని ఆశించుచున్నాము; విశ్వాసముచేతను ఓర్పుచేతను వాగ్దానములను స్వతంత్రించుకొనువారిని పోలి నడుచుకొనుడి\"", "Diligent spiritual vigor moving from flickering desire to the unshakable 'full assurance of hope' (plerophorian tes elpidos).", "సోమరితనమును విడిచి విశ్వాసము ఓర్పుద్వారా వాగ్దానములను పొందిన భక్తులను పోలి నిరీక్షణలో కొనసాగుట."],
    ["Hebrews 7:19 on the law making nothing perfect, on the other hand, there is the bringing in of a better hope, through which we draw near to God", "హెబ్రీయులకు 7:19 ధర్మశాస్త్రము దేనిని సంపూర్ణసిద్ధికి తేలేదు, దేవునియొద్దకు మనలను చేర్చు శ్రేష్ఠమైన నిరీక్షణ ప్రవేశపెట్టబడెను", "Hebrews 7:19", "\"For the law made nothing perfect; on the other hand, there is the bringing in of a better hope, through which we draw near to God\"", "\"ధర్మశాస్త్రము దేనిని సంపూర్ణసిద్ధికి తేలేదు గనుక దేవునియొద్దకు మనలను చేర్చు శ్రేష్ఠమైన నిరీక్షణ దానివెంట ప్రవేశపెట్టబడెను; దీనిద్వారా మనము దేవునియొద్దకు చేరుచున్నాము\"", "The Levitical system could never bring sinners into God's immediate presence; Christ's priesthood introduces the 'better hope'.", "ధర్మశాస్త్ర ఆచారములు చేయలేనిదానిని క్రీస్తు ప్రధానయాజకత్వము శ్రేష్ఠమైన నిరీక్షణద్వారా దేవుని సన్నిధికి చేర్చెను."],
    ["Hebrews 11:10 on Abraham waiting for the city which has foundations, whose builder and maker is God", "హెబ్రీయులకు 11:10 అబ్రాహాము దేవుడు కట్టి నిర్మించిన పునాదులుగల పట్టణముకొరకు కనిపెట్టుచు గుడారములలో నివసించుట", "Hebrews 11:10", "\"For he waited for the city which has foundations, whose builder and maker is God\"", "\"ఏలయనగా దేవుడు ఏ పట్టణమునకు శిల్పియు నిర్మాణకుడునై యున్నాడో, పునాదులుగల ఆ పట్టణముకొరకు అతడు కనిపెట్టుచుండెను\"", "Patriarchal pilgrim perspective: living detached in tents because one's heart is anchored in the architectural New Jerusalem.", "భూమిపై గుడారములలో నివసించినను పరలోకమందు దేవుడే నిర్మించిన నిత్య పట్టణముకొరకు ఎదురుచూచిన అబ్రాహాము నిరీక్షణ."],
    ["Hebrews 11:13-16 on having seen the promises afar off, embraced them, confessing that they were strangers and pilgrims on the earth, desiring a better, heavenly country", "హెబ్రీయులకు 11:13-16 వాగ్దానములు దూరమునుండి చూచి వందనము చేసి, భూమిమీద తాము పరదేశులమనియు యాత్రికులమనియు ఒప్పుకొని శ్రేష్ఠమైన పరలోక దేశమును కోరుకొనుట", "Hebrews 11:14,16", "\"For those who say such things declare plainly that they seek a homeland... But now they desire a better, that is, a heavenly country. Therefore God is not ashamed to be called their God\"", "\"ఈలాగు చెప్పువారు తాము స్వదేశమును వెదకుచున్నామని విశదపరచుచున్నారు... అయితే వారు మరి శ్రేష్ఠమైన దేశమును, అనగా పరలోకసంబంధమైన దేశమును కోరుచున్నారు; అందుచేత దేవుడు వారికి ఒక పట్టణము సిద్ధపరచి వారి దేవుడనిపించుకొనుటకు సిగ్గుపడడు\"", "Holy homesickness: believers embrace earthly marginalization because their citizenship belongs to the heavenly metropolis.", "భూలోకములో యాత్రికులవలె జీవిస్తూ దేవుడు సిద్ధపరచిన పరలోక పట్టణముకొరకు ఆశతో ఎదురుచూచిన పితరుల నిరీక్షణ."],
    ["Hebrews 11:35 on women receiving their dead raised to life again, others tortured, not accepting deliverance, that they might obtain a better resurrection", "హెబ్రీయులకు 11:35 స్త్రీలు మృతులైన తమవారిని పునరుత్థానమువలన మరల పొందిరి, మరికొందరు శ్రేష్ఠమైన పునరుత్థానమును పొందుటకై విడుదల కోరక హింసింపబడిరి", "Hebrews 11:35", "\"Women received their dead raised to life again. Others were tortured, not accepting deliverance, that they might obtain a better resurrection\"", "\"స్త్రీలు మృతులైన తమవారిని పునరుత్థానమువలన మరల పొందిరి. మరికొందరు మరి శ్రేష్ఠమైన పునరుత్థానమును పొందగోరి, విడుదల పొందనొల్లక యాతనలు భరించిరి\"", "Sublime martyrdom: refusing political compromise because their eyes were fixed on the 'better resurrection'.", "తాత్కాలిక విడుదలను కోరుకొనక రాబోవు లోకములో శ్రేష్ఠమైన పునరుత్థానమును పొందుటకు ప్రాణత్యాగము చేసిన భక్తుల నిరీక్షణ."],
    ["Hebrews 12:1-2 on looking unto Jesus, the author and finisher of our faith, who for the joy that was set before Him endured the cross, despising the shame", "హెబ్రీయులకు 12:1-2 విశ్వాసమునకు కర్తయు దానిని సంపూర్ణము చేయువాడునైన యేసువైపు చూచుచు, తనయెదుట ఉంచబడిన ఆనందముకొరకై సిలువను సహించిన రక్షకుడు", "Hebrews 12:2", "\"Looking unto Jesus, the author and finisher of our faith, who for the joy that was set before Him endured the cross, despising the shame, and has sat down at the right hand of the throne of God\"", "\"విశ్వాసమునకు కర్తయు దానిని సంపూర్ణము చేయువాడునైన యేసువైపు చూచుచు... ఆయన తనయెదుట ఉంచబడిన ఆనందముకొరకై, అవమానమును నిర్లక్ష్యపెట్టి, సిలువను సహించి, దేవుని సింహాసనముయొక్క కుడిపార్శ్వమున ఆసీనుడై యున్నాడు\"", "Christ's own paradigm of hope: enduring the shame of Calvary because His gaze was locked on the resurrection joy set before Him.", "సిలువ శ్రమలను అవమానములను లెక్కచేయక తనయెదుట ఉన్న పరలోక ఆనందముకొరకు సహించిన యేసుక్రీస్తు మాదిరి."],
    ["James 5:7-8 commanding: 'Therefore be patient, brethren, until the coming of the Lord. See how the farmer waits for the precious fruit of the earth... Establish your hearts, for the coming of the Lord is at hand'", "యాకోబు 5:7-8 'సహోదరులారా, ప్రభువు రాకడవరకు సహనము కలిగియుండుడి; రైతు భూమియొక్క అమూల్యమైన ఫలముకొరకు ఎలాగు కనిపెట్టునో చూడుడి'", "James 5:7-8", "\"Therefore be patient, brethren, until the coming of the Lord. See how the farmer waits for the precious fruit of the earth... You also be patient. Establish your hearts, for the coming of the Lord is at hand\"", "\"సహోదరులారా, ప్రభువు రాకడవరకు సహనము కలిగియుండుడి. చూడుడి; వ్యవసాయకుడు తొలకరి వర్షమును కడవరి వర్షమును పడువరకు అమూల్యమైన భూఫలముకొరకు కనిపెట్టుచు దానివిషయమై ఓపిక కలిగియుండును గదా? మీరును ఓపిక కలిగియుండుడి, మీ హృదయములను స్థిరపరచుకొనుడి, ప్రభువు రాకడ సమీపించుచున్నది\"", "Agrarian patience: enduring dry seasons with steadfast hearts because the Lord's harvest arrival is imminent.", "తొలకరి కడవరి వర్షముల కొరకు కనిపెట్టే రైతువలె ప్రభువు రాకడ సమీపించుచున్నదని హృదయములను స్థిరపరచుకొనుట."],
    ["1 Peter 1:13 commanding: 'Gird up the loins of your mind, be sober, and rest your hope fully upon the grace that is to be brought to you at the revelation of Jesus Christ'", "1 పేతురు 1:13 'మీ మనస్సును నడుము కట్టుకొని, నిబ్బరమైన బుద్ధిగలవారై, యేసుక్రీస్తు ప్రత్యక్షమైనప్పుడు మీకు తేబడు కృపమీదనే సంపూర్ణ నిరీక్షణ యుంచుడి'", "1 Peter 1:13", "\"Therefore gird up the loins of your mind, be sober, and rest your hope fully upon the grace that is to be brought to you at the revelation of Jesus Christ\"", "\"కాబట్టి మీ మనస్సులను నడుము కట్టుకొని, నిబ్బరమైన బుద్ధిగలవారై, యేసుక్రీస్తు ప్రత్యక్షమైనప్పుడు మీకు తేబడు కృపమీదనే సంపూర్ణ నిరీక్షణ యుంచుడి\"", "Intellectual sobriety and focus: staking 100% of one's ultimate expectation upon the grace unveiled at Christ's return.", "మనస్సును ఏకాగ్రతతో సిద్ధపరచుకొని క్రీస్తు ప్రత్యక్షతయందు అనుగ్రహింపబడు నిత్య కృపమీదనే సంపూర్ణ నిరీక్షణ యుంచుట."],
    ["1 Peter 1:20-21 on Christ being foreordained before the foundation of the world, raised from the dead, so that your faith and hope are in God", "1 పేతురు 1:20-21 జగత్తు పునాది వేయబడకమునుపే నియమింపబడిన క్రీస్తును దేవుడు మృతులలోనుండి లేపగా మీ విశ్వాసమును నిరీక్షణయు దేవునియందు ఉంచబడుట", "1 Peter 1:21", "\"Who through Him believe in God, who raised Him from the dead and gave Him glory, so that your faith and hope are in God\"", "\"క్రీస్తుద్వారా దేవునియందు విశ్వాసముంచువారైతిరి; దేవుడు ఆయనను మృతులలోనుండి లేపి ఆయనకు మహిమనిచ్చెను; ఇందువలన మీ విశ్వాసమును నిరీక్షణయు దేవునియందు ఉంచబడియున్నవి\"", "Trinitarian redemption: Christ's pre-temporal appointment and historical resurrection anchor human faith and hope directly into God.", "సృష్టికి ముందే నియమింపబడి పునరుత్థానుడైన క్రీస్తుద్వారా దేవునియందు స్థిరపరచబడిన విశ్వాస నిరీక్షణలు."],
    ["1 Peter 4:12-13 on beloved, do not think it strange concerning the fiery trial which is to try you, but rejoice to the extent you partake of Christ's sufferings, that when His glory is revealed, you may also be glad with exceeding joy", "1 పేతురు 4:12-13 ప్రియులారా, మీలో కలుగుచున్న అగ్నివంటి శోధనను వింతయైనట్టు ఎంచక, క్రీస్తు మహిమ ప్రత్యక్షమైనప్పుడు బహుగా ఆనందించునట్లు ఆయన శ్రమలలో పాలుపొందుటయందు సంతోషించుడి", "1 Peter 4:13", "\"Rejoice to the extent that you partake of Christ's sufferings, that when His glory is revealed, you may also be glad with exceeding joy\"", "\"క్రీస్తు మహిమ బయలుపరచబడినప్పుడు మీరు బహుగా సంతోషించి ఆనందించునట్లు, ఆయన శ్రమలలో మీరు పాలివారై యున్నంతగా సంతోషించుడి\"", "Fiery persecution is not divine abandonment, but the threshold where sharing Christ's cross guarantees sharing His triumphant glory.", "అగ్నివంటి శ్రమలను చూచి భయపడక క్రీస్తుతోకూడ శ్రమనొందుటద్వారా ఆయన రాకడ మహిమలో పరిపూర్ణ ఆనందమును పొందుదుమను నిరీక్షణ."],
    ["1 Peter 5:10 blessing: 'May the God of all grace, who called us to His eternal glory by Christ Jesus, after you have suffered a while, perfect, establish, strengthen, and settle you'", "1 పేతురు 5:10 క్రీస్తునందు తన నిత్య మహిమకు మిమ్మును పిలిచిన సర్వకృపానిధియైన దేవుడు, కొంచెముకాలము మీరు శ్రమపడిన తరువాత మిమ్మును పరిపూర్ణులుగా చేసి స్థిరపరచి బలపరచును గాక", "1 Peter 5:10", "\"May the God of all grace, who called us to His eternal glory by Christ Jesus, after you have suffered a while, perfect, establish, strengthen, and settle you. To Him be the glory and dominion forever and ever\"", "\"క్రీస్తుయేసునందు తన నిత్యమహిమకు మిమ్మును పిలిచిన సర్వకృపానిధియైన దేవుడు, కొంచెముకాలము మీరు శ్రమపడిన తరువాత, తానే మిమ్మును పరిపూర్ణులుగా చేసి స్థిరపరచి బలపరచి నిలువును గాక; ఆయనకు యుగయుగములు ప్రభావము కలుగును గాక\"", "The fourfold divine restoration: momentary earthly affliction gives way to eternal perfection, stability, strength, and security in glory.", "కొంచెముకాలపు శ్రమల తరువాత సర్వకృపానిధియైన దేవుడే స్వయముగా మనలను పరిపూర్ణులుగా చేసి స్థిరపరచునను ఆదరణకరమైన నిరీక్షణ."],
    ["2 Peter 3:11-13 on looking for and hastening the coming of the day of God, looking for new heavens and a new earth in which righteousness dwells", "2 పేతురు 3:11-13 దేవుని దినపు రాకడకొరకు కనిపెట్టుచు దానిని త్వరపెట్టుచు, నీతి నివసించు నూతన ఆకాశముకొరకును నూతన భూమికొరకును నిరీక్షించుట", "2 Peter 3:13", "\"Nevertheless we, according to His promise, look for new heavens and a new earth in which righteousness dwells\"", "\"అయినను ఆయన వాగ్దానమునుబట్టి మనము నీతి నివసించు నూతన ఆకాశముకొరకును నూతన భూమికొరకును కనిపెట్టుచున్నాము (నిరీక్షించుచున్నాము)\"", "Eschatological recreation: beyond the dissolution of fallen elements lies a brand-new cosmos saturated with divine righteousness.", "ప్రస్తుత లోకము గతించినను దేవుని వాగ్దానముచొప్పున నీతి నివసించు నూతన ఆకాశమును నూతన భూమిని పొందుదుమను పరమ నిరీక్షణ."],
    ["1 John 2:28 exhorting: 'And now, little children, abide in Him, that when He appears, we may have confidence and not be ashamed before Him at His coming'", "1 యోహాను 2:28 చిన్నపిల్లలారా, ఆయన ప్రత్యక్షమగునప్పుడు మనము ఆయన రాకడయందు సిగ్గుపడక ధైర్యము కలిగియుండునట్లు ఆయనయందు నిలిచియుండుడి", "1 John 2:28", "\"And now, little children, abide in Him, that when He appears, we may have confidence and not be ashamed before Him at His coming\"", "\"కాబట్టి చిన్నపిల్లలారా, ఆయన ప్రత్యక్షమగునప్పుడు మనము ఆయన రాకడయందు సిగ్గుపడక ధైర్యము కలిగియుండునట్లు ఆయనయందు నిలిచియుండుడి.\"", "Abiding fellowship produces unblushing boldness (parrhesia) rather than cowering terror when Christ appears.", "క్రీస్తుయందు నిత్యము నివసించుట ద్వారా ఆయన రాకడ సమయములో ఏ సిగ్గులేక ధైర్యముతో నిలువబడు నిరీక్షణ."],
    ["Jude 1:21 commanding: 'Keep yourselves in the love of God, looking for the mercy of our Lord Jesus Christ unto eternal life'", "యూదా 1:21 నిత్యజీవార్థమైన మన ప్రభువైన యేసుక్రీస్తు కనికరముకొరకు కనిపెట్టుచు, దేవుని ప్రేమలో మిమ్మును మీరు కాపాడుకొనుడి", "Jude 1:21", "\"Keep yourselves in the love of God, looking for the mercy of our Lord Jesus Christ unto eternal life\"", "\"నిత్యజీవార్థమైన మన ప్రభువైన యేసుక్రీస్తు కనికరముకొరకు కనిపెట్టుచు, దేవుని ప్రేమలో మిమ్మును మీరు కాపాడుకొనుడి.\"", "The expectant stance of the pilgrim: resting under the umbrella of the Father's love while waiting for Christ's final resurrecting mercy.", "క్రీస్తు రాకడలో అనుగ్రహింపబడు నిత్యజీవపు కనికరముకొరకు నిరీక్షిస్తూ దేవుని ప్రేమలో మనలను కాపాడుకొనుట."],
    ["Revelation 1:7 proclaiming: 'Behold, He is coming with clouds, and every eye will see Him, even they who pierced Him'", "ప్రకటన 1:7 'ఇదిగో ఆయన మేఘారూఢుడై వచ్చుచున్నాడు; ప్రతి కన్నును ఆయనను చూచును, ఆయనను పొడిచినవారును చూతురు'", "Revelation 1:7", "\"Behold, He is coming with clouds, and every eye will see Him, even they who pierced Him. And all the tribes of the earth will mourn because of Him. Even so, Amen\"", "\"ఇదిగో ఆయన మేఘారూఢుడై వచ్చుచున్నాడు; ప్రతి కన్నును ఆయనను చూచును, ఆయనను పొడిచినవారును చూతురు; భూమిమీది సమస్త గోత్రములవారును ఆయనను చూచి రొమ్ము కొట్టుకొందురు. అవును, ఆమేన్.\"", "The universal, public, undeniable epiphany of Jesus Christ returning in uncreated majesty.", "రహస్యముగా కాక మేఘారూఢుడై సర్వలోక కన్నులయెదుట మహిమతో దిగివచ్చు యేసుక్రీస్తు దర్శన నిరీక్షణ."],
    ["Revelation 2:10 on 'Be faithful until death, and I will give you the crown of life'", "ప్రకటన 2:10 'మరణమువరకు నమ్మకముగా ఉండుము, నేను నీకు జీవకిరీటమిచ్చెదను'", "Revelation 2:10", "\"Do not fear any of those things which you are about to suffer... Be faithful until death, and I will give you the crown of life\"", "\"నీవు పొందబోవు శ్రమలకు భయపడకుము... మరణమువరకు నమ్మకముగా ఉండుము, నేను నీకు జీవకిరీటమిచ్చెదను.\"", "Martyrdom eclipsed by the glorious crown of eternal life promised by the risen Christ.", "హింసలు శ్రమలు మరణము ఎదురైనను క్రీస్తు ఇచ్చే జీవకిరీటపు నిరీక్షణతో నమ్మకముగా నిలుచుట."],
    ["Revelation 3:11 promising: 'Behold, I am coming quickly! Hold fast what you have, that no one may take your crown'", "ప్రకటన 3:11 'నేను త్వరగా వచ్చుచున్నాను; ఎవడును నీ కిరీటమును అపహరింపకుండునట్లు నీకు కలిగినదానిని గట్టిగా పట్టుకొనుము'", "Revelation 3:11", "\"Behold, I am coming quickly! Hold fast what you have, that no one may take your crown. He who overcomes, I will make him a pillar in the temple of My God\"", "\"నేను త్వరగా వచ్చుచున్నాను; ఎవడును నీ కిరీటమును అపహరింపకుండునట్లు నీకు కలిగినదానిని గట్టిగా పట్టుకొనుము. జయించువానిని నా దేవుని ఆలయములో ఒక స్తంభముగా చేసెదను\"", "Imminent parousia incentivizing urgent fidelity and preserving our eternal heavenly reward.", "త్వరగా వచ్చుచున్న ప్రభువు వాగ్దానమును నమ్మి మన కిరీటము పోకుండ వాక్యమును గట్టిగా పట్టుకొనుట."],
    ["Revelation 19:6-9 the roar of the multitude: 'Alleluia! For the Lord God Omnipotent reigns! Let us be glad and rejoice and give Him glory, for the marriage of the Lamb has come'", "ప్రకటన 19:6-9 'సర్వశక్తిగల మన దేవుడైన ప్రభువు ఏలుచున్నాడు; మనము సంతోషించి ఉత్సహించి ఆయనను మహిమపరచెదము, గొర్రెపిల్ల వివాహోత్సవ సమయము వచ్చినది'", "Revelation 19:6-7", "\"Alleluia! For the Lord God Omnipotent reigns! Let us be glad and rejoice and give Him glory, for the marriage of the Lamb has come, and His wife has made herself ready\"", "\"హల్లెలూయా, సర్వశక్తిగల మన దేవుడైన ప్రభువు ఏలుచున్నాడు; గొర్రెపిల్ల వివాహోత్సవ సమయము వచ్చినది, ఆయన భార్య తన్నుతాను సిద్ధపరచుకొనియున్నది; మనము సంతోషించి ఉత్సహించి ఆయనను మహిమపరచెదము\"", "The cosmic wedding feast consummating the eternal love story between Christ and His redeemed bride.", "సమస్త యుగముల నిరీక్షణ నెరవేరిన గొర్రెపిల్లయైన క్రీస్తుతో సంఘమునకు జరుగు నిత్య వివాహోత్సవ ఆనందము."],
    ["Revelation 21:1-3 on seeing a new heaven and a new earth; the holy city, New Jerusalem, coming down out of heaven, and God Himself dwelling with them", "ప్రకటన 21:1-3 నూతన ఆకాశమును నూతన భూమిని పరలోకమునుండి దిగివచ్చు పరిశుద్ధ పట్టణమైన నూతన యెరూషలేమును చూచుట; దేవుడు తానే వారికి తోడైయుండును", "Revelation 21:1-3", "\"Now I saw a new heaven and a new earth... And I heard a loud voice from heaven saying, 'Behold, the tabernacle of God is with men, and He will dwell with them, and they shall be His people'\"", "\"నేను క్రొత్త ఆకాశమును క్రొత్త భూమిని చూచితిని; పరిశుద్ధ పట్టణమైన నూతన యెరూషలేము తన భర్తకొరకు అలంకరింపబడిన పెండ్లికుమార్తెవలె సిద్ధపడి పరలోకమందున్న దేవునియొద్దనుండి దిగివచ్చుట చూచితిని. ఇదిగో దేవుని నివాసము మనుష్యులతోకూడ ఉన్నది, ఆయన వారితో కాపురముండును...\"", "The ultimate telos of biblical hope: unhindered, face-to-face communion of God dwelling with redeemed humanity.", "దేవుడే స్వయముగా మనుష్యులమధ్య నివసించి వారికి నిత్య తోడుగా ఉండు నూతన యెరూషలేము పరమ నిరీక్షణ దర్శనము."],
    ["Revelation 22:3-5 on there shall be no more curse, but the throne of God and of the Lamb shall be in it; they shall see His face, and His name shall be on their foreheads", "ప్రకటన 22:3-5 ఇకమీదట ఏ శాపమును ఉండదు; దేవుని యొక్కయు గొర్రెపిల్ల యొక్కయు సింహాసనము దానిలో ఉండును; వారు ఆయన ముఖదర్శనము చేతురు", "Revelation 22:3-4", "\"And there shall be no more curse, but the throne of God and of the Lamb shall be in it, and His servants shall serve Him. They shall see His face, and His name shall be on their foreheads\"", "\"ఇకమీదట ఏ శాపమును ఉండదు; దేవునియొక్కయు గొర్రెపిల్లయొక్కయు సింహాసనము దానిలో ఉండును. ఆయన దాసులు ఆయనను సేవించుచు ఆయన ముఖదర్శనము చేతురు; ఆయన నామము వారి నొసళ్లయందు ఉండును\"", "The Beatific Vision: the final banishment of all curses, beholding God's face in eternal glory.", "సమస్త శాపములు తొలగిపోయి దేవుని ముఖదర్శనమును నిరంతరము పొందుచు ఆయనను సేవించే నిత్య ధన్యత."],
    ["Revelation 22:20 the closing cry of Scripture and the church: 'He who testifies to these things says, Surely I am coming quickly. Amen. Even so, come, Lord Jesus!'", "ప్రకటన 22:20 బైబిలు గ్రంథపు ఆఖరి వాగ్దానము మరియు సంఘపు నిరీక్షణ ప్రార్థన: 'అవును, నేను త్వరగా వచ్చుచున్నాను. ఆమేన్, ప్రభువైన యేసూ, రమ్ము'", "Revelation 22:20", "\"He who testifies to these things says, 'Surely I am coming quickly.' Amen. Even so, come, Lord Jesus!\"", "\"ఈ సంగతులనుగూర్చి సాక్ష్యమిచ్చువాడు-అవును, త్వరగా వచ్చుచున్నానని సెలవిచ్చుచున్నాడు. ఆమేన్, ప్రభువైన యేసూ, రమ్ము!\"", "The final beat of the biblical heart: Christ's promise of rapid arrival answered by the expectant longing of the Bride.", "బైబిలు గ్రంథపు ఆఖరి శ్వాస: 'త్వరగా వచ్చుచున్నాను' అను రక్షకుని మాటకు 'ప్రభువైన యేసూ, రమ్ము' అను సంఘపు నిరీక్షణ ఆర్తనాదము."],
    ["Revelation 7:16-17 on the redeemed never hungering or thirsting anymore, the Lamb leading them to living fountains of waters, God wiping away every tear","ప్రకటన 7:16-17 విమోచింపబడినవారు ఇకమీదట ఆకలిగొనరు దప్పిగొనరు, గొర్రెపిల్లయే జీవజలముల బుగ్గలయొద్దకు వారిని నడిపించును, దేవుడే వారి కన్నీళ్లన్నిటిని తుడిచివేయును","Revelation 7:16-17","\"They shall neither hunger anymore nor thirst anymore; the sun shall not strike them, nor any heat; for the Lamb who is in the midst of the throne will shepherd them and lead them to living fountains of waters. And God will wipe away every tear from their eyes\"","\"వారు ఇకమీదట ఆకలిగొనరు, ఇకమీదట దప్పిగొనరు, ఎండయైనను ఏ ఉక్కయైనను వారిమీద పడదు; ఏలయనగా సింహాసనమధ్యమందుండు గొర్రెపిల్లయే వారికి కాపరియై, జీవజలముల బుగ్గలయొద్దకు వారిని నడిపించును; దేవుడే వారి కన్నులనుండి ప్రతి బాష్పబిందువును తుడిచివేయును\"","Consummate pastoral comfort: the glorified Lamb personally shepherding saints in tearless eternal joy.","సింహాసనమధ్యమందున్న గొర్రెపిల్లయైన క్రీస్తే స్వయముగా కాపరియై నిత్య జీవజలముల ఊటలయొద్దకు నడిపించి కన్నీరంతయు తుడిచివేయు పరమ నిరీక్షణ."],
    ["Revelation 20:6 on blessed and holy is he who has part in the first resurrection, over such the second death has no power","ప్రకటన 20:6 మొదటి పునరుత్థానములో పాలుపొందువాడు ధన్యుడును పరిశుద్ధుడునై యుండును, అట్టివారిపై రెండవ మరణమునకు ఏ అధికారమును ఉండదు","Revelation 20:6","\"Blessed and holy is he who has part in the first resurrection. Over such the second death has no power, but they shall be priests of God and of Christ, and shall reign with Him a thousand years\"","\"మొదటి పునరుత్థానములో పాలుగలవారు ధన్యులును పరిశుద్ధులునై యుందురు. ఇట్టివారిమీద రెండవ మరణమునకు ఏ అధికారమును లేదు; వీరు దేవునికిని క్రీస్తునకును యాజకులై క్రీస్తుతోకూడ వెయ్యి సంవత్సరములు రాజ్యపరిపాలన చేయుదురు\"","The inviolable security of the resurrected: totally immune to the lake of fire, reigning with Christ in holy priesthood.","మొదటి పునరుత్థానములో లేపబడిన పరిశుద్ధులు రెండవ మరణమునకు లోనుకాని అమరత్వమును పొంది క్రీస్తుతోకూడ పరిపాలించు నిరీక్షణ."],
    ["Revelation 21:4-5 on God wiping away every tear, no more death, nor sorrow, nor crying, no more pain, 'Behold, I make all things new'","ప్రకటన 21:4-5 దేవుడు వారి కన్నీళ్లన్నిటిని తుడిచివేయును, ఇకమీదట మరణముండదు, దుఃఖమైనను ఏడ్పైనను వేదనయైనను ఇకమీదట ఉండదు, 'ఇదిగో సమస్తమును నూతనమైనవిగా చేయుచున్నాను'","Revelation 21:4-5","\"And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying. There shall be no more pain, for the former things have passed away. Then He who sat on the throne said, 'Behold, I make all things new'\"","\"ఆయన వారి కన్నుల ప్రతి బాష్పబిందువును తుడిచివేయును, మరణము ఇక ఉండదు, దుఃఖమైనను ఏడ్పైనను వేదనయైనను ఇక ఉండదు; మొదటి సంగతులు గతించిపోయెను. అప్పుడు సింహాసనాసీనుడై యున్నవాడు-ఇదిగో నేను సమస్తమును నూతనమైనవిగా చేయుచున్నానని సెలవిచ్చెను\"","The eradication of all fallen entropy: death, suffering, and tears permanently abolished by divine decree.","సమస్త దుఃఖ వేదన మరణములను సమూలముగా నిర్మూలించి దేవుడే సమస్తమును నూతనముగా సృష్టించు అద్భుత నిరీక్షణ దర్శనము."],
    ["Revelation 21:22-23 on the holy city having no need of temple, sun, or moon, for the Lord God Almighty and the Lamb are its temple and its radiant light","ప్రకటన 21:22-23 పరిశుద్ధ పట్టణములో ఏ దేవాలయమును కనబడదు, సర్వశక్తిగల దేవుడైన ప్రభువును గొర్రెపిల్లయు దానికి ఆలయమై యున్నారు, దేవుని మహిమయే దానిని ప్రకాశింపజేయును","Revelation 21:23","\"The city had no need of the sun or of the moon to shine in it, for the glory of God illuminated it. The Lamb is its light\"","\"ఆ పట్టణములో ప్రకాశించుటకై సూర్యుడైనను చంద్రుడైనను దానికక్కరలేదు; దేవుని మహిమయే దానిలో ప్రకాశించుచున్నది, గొర్రెపిల్లయే దానికి దీపము\"","Unmediated divine illumination: creation's astronomical lamps eclipsed by the uncreated glory of the Lamb.","సూర్య చంద్రుల వెలుగు అవసరములేకుండ దేవుని మహిమయు గొర్రెపిల్లయైన క్రీస్తే నిత్య ప్రకాశముగా వెలుగు పరమ నిరీక్షణ."],
    ["Daniel 12:2-3 on those who sleep in dust awaking, some to everlasting life, those who turn many to righteousness shining like the stars forever and ever","దానియేలు 12:2-3 నేలధూళిలో నిద్రించువారిలో అనేకులు నిత్యజీవము పొందుటకు మేల్కొందురు, అనేకులను నీతిమార్గమునకు నడిపించువారు నక్షత్రములవలె నిరంతరము ప్రకాశించుదురు","Daniel 12:2-3","\"And many of those who sleep in the dust of the earth shall awake, some to everlasting life... Those who are wise shall shine like the brightness of the firmament, and those who turn many to righteousness like the stars forever and ever\"","\"మరియు నేలధూళిలో నిద్రించువారిలో అనేకులు మేల్కొందురు; కొందరు నిత్యజీవము ననుభవించుటకును, కొందరు నిందపాలును నిత్యావమానమును అనుభవించుటకును మేల్కొందురు. బుద్ధిమంతులైతే ఆకాశమండలములోని జ్యోతులనుపోలి ప్రకాశించెదరు, నీతిమార్గముననుసరించి నడుచుకొనునట్లు అనేకులను త్రిప్పువారు నక్షత్రములవలె నిరంతరము ప్రకాశించెదరు\"","Old Testament resurrection pinnacle: somatic awakening from mortal dust to immortal stellar brilliance.","ధూళిలోనుండి మేల్కొని నీతిమంతులు ఆకాశ నక్షత్రములవలె యుగయుగములు దేవుని మహిమతో ప్రకాశించు ప్రవచన నిరీక్షణ."],
    ["Isaiah 25:8 on He will swallow up death forever, and the Lord God will wipe away tears from all faces and take away the rebuke of His people","యెషయా 25:8 ఆయన మరణమును శాశ్వతముగా మింగివేయును, ప్రభువైన యెహోవా ప్రతి ముఖముమీది బాష్పబిందువులను తుడిచివేయును","Isaiah 25:8","\"He will swallow up death forever, and the Lord God will wipe away tears from all faces; the rebuke of His people He will take away from all the earth; for the Lord has spoken\"","\"మరణమును ఆయన సదాకాలమునకు మింగివేయును, ప్రభువైన యెహోవా ప్రతి ముఖముమీది బాష్పబిందువులను తుడిచివేయును, భూమియంతటనుండి తన ప్రజలమీది నిందను తీసివేయును; యెహోవా సెలవిచ్చియున్నాడు\"","Total eschatological triumph: mortality swallowed in victory, every tear dried by God's sovereign tender hand.","మరణమును శాశ్వతముగా జయించి సమస్త మానవ దుఃఖపు కన్నీటిని ప్రేమతో తుడిచివేయు యెహోవా విజయ వాగ్దానము."],
    ["Isaiah 26:19 declaring the resurrection of the dead: 'Your dead shall live; together with my dead body they shall arise. Awake and sing, you who dwell in dust!'","యెషయా 26:19 'మృతులైన నీవారు బ్రదుకుదురు, శవముగా ఉన్న నావారు లేతురు; ధూళిలో పడియున్నవారలారా, మేల్కొని ఉత్సహించుడి'","Isaiah 26:19","\"Your dead shall live; together with my dead body they shall arise. Awake and sing, you who dwell in dust! For your dew is like the dew of herbs, and the earth shall cast out the dead\"","\"మృతులైన నీవారు బ్రదుకుదురు, శవముగా ఉన్న నావారు లేతురు; ధూళిలో పడియున్నవారలారా, మేల్కొని ఉత్సహించుడి; నీ మంచు ప్రకాశమానమైన మంచువలె నున్నది, భూమి తనలోనున్న ప్రేతములను వెళ్లగ్రక్కును\"","The vibrant Old Testament prophecy of bodily awakening: graves yielding up the redeemed to sing in the morning light.","సమాధులలో నిద్రించు పరిశుద్ధులు ఉదయపు మంచువలె లేచి నూతన ఆనందగానము చేయుదురను పునరుత్థాన నిరీక్షణ."],
    ["1 John 3:1-2 on what manner of love the Father has bestowed on us, and when He is revealed, we shall be like Him, for we shall see Him as He is","1 యోహాను 3:1-2 మనము దేవుని పిల్లలమని పిలువబడునట్లు తండ్రి మనకెట్టి ప్రేమను అనుగ్రహించెనో చూడుడి; ఆయన ప్రత్యక్షమైనప్పుడు ఆయన ఉన్నట్లుగానే ఆయనను చూతుము గనుక ఆయనను పోలియుందుము","1 John 3:2","\"Beloved, now we are children of God; and it has not yet been revealed what we shall be, but we know that when He is revealed, we shall be like Him, for we shall see Him as He is\"","\"ప్రియులారా, యిప్పుడు మనము దేవుని పిల్లలమై యున్నాము; మనమికనేమి కాబోవుదుమో అది యింక ప్రత్యక్షపరచబడలేదు గాని ఆయన ప్రత్యక్షమైనప్పుడు ఆయన యున్నట్టుగానే ఆయనను చూతుము గనుక ఆయనను పోలియుందుమని యెరుగుదుము\"","The transformative beatific vision: seeing the unvarnished glory of Christ instantly conforms our entire being to His likeness.","క్రీస్తు ప్రత్యక్షమైనప్పుడు ఆయనను ముఖాముఖిగా చూచి ఆయన మహిమాన్విత స్వరూపమును పొందుదుమను పరమ నిరీక్షణ."],
    ["Ephesians 1:13-14 on being sealed with the Holy Spirit of promise, who is the guarantee (arrabon) of our inheritance until the redemption of the purchased possession","ఎఫెసీయులకు 1:13-14 వాగ్దానము చేయబడిన పరిశుద్ధాత్మచేత ముద్రింపబడుట; దేవుని సంపాద్యమైన ప్రజలకు విమోచన కలుగువరకు ఆత్మ మన స్వాస్థ్యమునకు సంచకారమై యుండుట","Ephesians 1:13-14","\"Having believed, you were sealed with the Holy Spirit of promise, who is the guarantee of our inheritance until the redemption of the purchased possession, to the praise of His glory\"","\"విశ్వసించి, వాగ్దానము చేయబడిన పరిశుద్ధాత్మచేత ముద్రింపబడితిరి. దేవుని మహిమయొక్క స్తుతికి కారణమగుటకై, ఆయన సంపాదించుకొనిన ప్రజలకు విమోచన కలుగునిమిత్తము ఈ ఆత్మ మన స్వాస్థ్యమునకు సంచకారముగా ఉన్నాడు\"","The infallible pneumatic pledge: the indwelling Spirit is the unbreakable down-payment of our final cosmic inheritance.","దేవుని సంపాద్యమైన మన శరీర విమోచనవరకు పరిశుద్ధాత్ముడే మన నిత్య పరలోక స్వాస్థ్యమునకు తిరుగులేని సంచకారముగా ఉన్నాడను నిరీక్షణ."]
  ];

  return data.map((item, idx) => ({
    easyQ: `What eschatological promise or covenant truth of resurrection is revealed regarding ${item[0]}?`,
    easyQTe: `${item[1]} గూర్చి లేఖనములో ఇవ్వబడిన ప్రవచన వాగ్దానము లేదా పునరుత్థాన సత్యమేమి?`,
    medQ: `In ${item[2]}, what specific statement anchors the church's ultimate hope in Christ's return and eternal kingdom?`,
    medQTe: `${item[2]} లో క్రీస్తు రాకడ మరియు నిత్య రాజ్యమును గూర్చి సంఘము నమ్మవలసిన ఏ నిర్దిష్ట ప్రకటన ఉన్నది?`,
    hardQ: `What theological reality does ${item[2]} establish regarding the consummation of redemption and the final state of the saints?`,
    hardQTe: `${item[2]} లేఖనము ప్రకారం పరిశుద్ధుల సంపూర్ణ రక్షణ మరియు నిత్య మహిమను గూర్చి సంఘ సిద్ధాంతమేమి?`,
    options: [item[3], "He commanded seventy iron pillars erected in Babylon", "He decreed forty years of silence across the kingdoms", "He ordered sixty war chariots stationed at Megiddo"],
    optionsTelugu: [item[4], "బబులోనులో డెబ్బై ఇనుప స్తంభములను నిలుపుడని ఆజ్ఞాపించెను", "రాజ్యములన్నిటిలో నలభై సంవత్సరముల నిశ్శబ్దమును విధించెను", "మెగిద్దోలో అరవై యుద్ధ రథములను నిలపవలెనని ఆదేశించెను"],
    correctAnswer: item[3],
    bibleReference: item[2],
    explanation: item[5],
    explanationTelugu: item[6]
  }));
}

const fFacts = foundationFacts;
const gFacts = buildHopeGrowth();
const mFacts = buildHopeMastery();

console.log(`Hope Foundation facts count: ${fFacts.length}`);
console.log(`Hope Growth facts count: ${gFacts.length}`);
console.log(`Hope Mastery facts count: ${mFacts.length}`);

buildBank('Hope', 'hop', fFacts, gFacts, mFacts);
