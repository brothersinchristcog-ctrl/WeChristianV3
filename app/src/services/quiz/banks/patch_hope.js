const fs = require('fs');

const foundation20 = [
  {
    easyQ: "What divine deliverance does Psalm 33:18-19 promise to those who hope in God's mercy?",
    easyQTe: "కీర్తన 33:18-19 లో దేవుని కృపకొరకు కనిపెట్టువారికి (నిరీక్షించువారికి) ఏ దైవిక రక్షణ వాగ్దానము చేయబడినది?",
    medQ: "According to Psalm 33:18-19, how does the eye of the Lord watch over those who hope in His steadfast love during famine?",
    medQTe: "కీర్తన 33:18-19 ప్రకారం కరువుకాలములో ప్రాణములను కాపాడుటకు యెహోవా దృష్టి ఎవరిపై ఉండును?",
    hardQ: "What theological truth is established by God's providential eye delivering mortal souls from famine through covenant mercy?",
    hardQTe: "మరణమునుండి ప్రాణములను విడిపించుటకు యెహోవా కటాక్షము ఆయన కృపకొరకు కనిపెట్టువారిపై ఉండుట ఏ విశ్వాస నిశ్చయతను ఇచ్చును?",
    options: ["Behold, the eye of the Lord is on those who fear Him, on those who hope in His mercy, to deliver their soul from death, and to keep them alive in famine", "He relies on forty storehouses built by pagan governors", "He deposits sixty silver talents in the royal treasury", "He commands thirty chariots to guard the borders"],
    optionsTelugu: ["మరణమునుండి వారి ప్రాణమును విమిచించుటకును, కరవులో వారిని సజీవులనుగా కాపాడుటకును, యెహోవా దృష్టి ఆయనయందు భయభక్తులు గలవారిమీదను ఆయన కృపకొరకు కనిపెట్టువారిమీదను ఉన్నది", "అన్య గవర్నర్లు నిర్మించిన నలభై ధాన్యాగారములపై ఆయన ఆధారపడును", "రాజ ఖజానాలో అరవై వెండి తలాంతులను జమచేయును", "సరిహద్దులను కాపాడుటకు ముప్పది రథములను ఆదేశించును"],
    correctAnswer: "Behold, the eye of the Lord is on those who fear Him, on those who hope in His mercy, to deliver their soul from death, and to keep them alive in famine",
    bibleReference: "Psalm 33:18-19",
    explanation: "God's watchful eye guards those who reverently hope in His mercy, preserving their lives even through severe famine.",
    explanationTelugu: "మరణమునుండి వారి ప్రాణమును విమిచించుటకును, కరవులో వారిని సజీవులనుగా కాపాడుటకును యెహోవా దృష్టి ఆయన కృపకొరకు కనిపెట్టువారిమీద ఉన్నది."
  },
  {
    easyQ: "What unceasing resolve of hope does the psalmist declare in Psalm 71:14?",
    easyQTe: "కీర్తన 71:14 లో భక్తుడు నిరీక్షణను గూర్చి ఏ నిరంతర తీర్మానమును చేసెను?",
    medQ: "According to Psalm 71:14, how does continual hope fuel increasingly abundant praise toward God?",
    medQTe: "కీర్తన 71:14 ప్రకారం నిరంతర నిరీక్షణ దేవునికి చెల్లించే స్తుతిని ఎలా అధికము చేయును?",
    hardQ: "How does the discipline of hoping continually in God overcome the accumulating infirmities of advanced age?",
    hardQTe: "వృద్ధాప్య శ్రమలలో సైతం దేవునియందే నిత్యము నిరీక్షణయుంచుట ఆత్మకు ఏ నూతన స్తుతి బలమును ఇచ్చును?",
    options: ["But I will hope continually, and will praise You yet more and more", "I will hide in thirty dark caves of Judea", "I will offer forty rams on the high hills", "I will cease praying after sixty silent days"],
    optionsTelugu: ["నేనైతే ఎల్లప్పుడును నిరీక్షించుచు మరింత యెక్కువగా నిన్ను స్తుతించెదను", "యూదయలోని ముప్పది చీకటి గుహలలో దాగుకొందును", "ఎత్తయిన కొండలపై నలభై పొట్టేళ్లను బలియిచ్చెదను", "అరవై నిశ్శబ్ద దినముల తరువాత ప్రార్థించుట మానుకొందును"],
    correctAnswer: "But I will hope continually, and will praise You yet more and more",
    bibleReference: "Psalm 71:14",
    explanation: "The psalmist resolves to maintain uninterrupted hope, transforming patient waiting into ever-increasing praise.",
    explanationTelugu: "నేనైతే ఎల్లప్పుడును నిరీక్షించుచు మరింత యెక్కువగా నిన్ను స్తుతించెదను; నా నోరు రోజంతయు నీ నీతిని నీ రక్షణను వర్ణించును."
  },
  {
    easyQ: "According to Psalm 78:7, why must parents teach God's wondrous works to the next generation?",
    easyQTe: "కీర్తన 78:7 ప్రకారం రాబోవు తరములకు దేవుని ఆశ్చర్యకార్యములను ఎందుకు బోధించవలెను?",
    medQ: "In Psalm 78:6-7, what three generational fruits arise from passing down divine truth?",
    medQTe: "కీర్తన 78:6-7 లో దైవిక సత్యములను పిల్లలకు నేర్పుటవలన కలుగు మూడు ఆత్మీయ ఫలితములేవి?",
    hardQ: "How does transgenerational catechesis protect the covenant community from repeating historic ancestral apostasy?",
    hardQTe: "దేవునియందు నిరీక్షణయుంచి ఆయన ఆజ్ఞలను గైకొనునట్లు పిల్లలకు బోధించుట విశ్వాస వారసత్వమును ఎలా కాపాడును?",
    options: ["That they may set their hope in God, and not forget the works of God, but keep His commandments", "That they might amass sixty talents of gold in commerce", "That they might conquer forty Canaanite cities by force", "That they might build thirty royal palaces in Samaria"],
    optionsTelugu: ["వారు తమ నిరీక్షణను దేవునియందుంచి, దేవుని క్రియలను మరచిపోక ఆయన ఆజ్ఞలను గైకొనునట్లు తరములవారికి బోధింపవలెను", "వారు వాణిజ్యములో అరవై బంగారు తలాంతులను సంపాదించునట్లు", "నలభై కనాను నగరములను బలవంతముగా జయించునట్లు", "షమ్రోనులో ముప్పది రాజభవనములను నిర్మించునట్లు"],
    correctAnswer: "That they may set their hope in God, and not forget the works of God, but keep His commandments",
    bibleReference: "Psalm 78:7",
    explanation: "God commanded fathers to teach His mighty deeds so future generations would place their hope squarely in God and obey His commandments.",
    explanationTelugu: "వారు దేవుని క్రియలను మరచిపోక ఆయన ఆజ్ఞలను గైకొనుచు, తమ నిరీక్షణను దేవునియందుంచునట్లు వారి పిల్లలకు తెలియజేయవలెను."
  },
  {
    easyQ: "What harmonious balance between hope and obedience is expressed in Psalm 119:166?",
    easyQTe: "కీర్తన 119:166 లో నిరీక్షణకును ఆజ్ఞా పాలనకును గల పవిత్ర సంబంధమేమి?",
    medQ: "According to Psalm 119:166, how does hoping for God's salvation inspire diligent observance of His commandments?",
    medQTe: "కీర్తన 119:166 ప్రకారం దేవుని రక్షణకొరకైన నిరీక్షణ ఆయన ఆజ్ఞలను పాటించుటకు ఎలా నడిపించును?",
    hardQ: "Why is genuine biblical hope always ethically active rather than passive antinomian presumption?",
    hardQTe: "దేవుని రక్షణ నిరీక్షణగల విశ్వాసి కేవలము నిష్క్రియుడుగా ఉండక ఆయన కట్టడలను ఎలా ఉత్సాహముతో నెరవేర్చును?",
    options: ["Lord, I hope for Your salvation, and I do Your commandments", "Lord, I built forty stone gates in the temple", "Lord, I fasted sixty weeks in the wilderness", "Lord, I recited seventy legal statutes without faith"],
    optionsTelugu: ["యెహోవా, నీ రక్షణకొరకు నేను కనిపెట్టుచున్నాను (నిరీక్షించుచున్నాను), నీ ఆజ్ఞలను అనుసరించి నడుచుకొనుచున్నాను", "ప్రభువా, నేను ఆలయములో నలభై రాతి గుమ్మములను కట్టితిని", "ప్రభువా, నేను అరణ్యములో అరవై వారములు ఉపవాసముంటిని", "ప్రభువా, విశ్వాసము లేకుండ డెబ్బై ధర్మశాస్త్ర విధులను వల్లెవేసితిని"],
    correctAnswer: "Lord, I hope for Your salvation, and I do Your commandments",
    bibleReference: "Psalm 119:166",
    explanation: "True hope in God's ultimate salvation naturally manifests in joyful, daily obedience to His moral commands.",
    explanationTelugu: "యెహోవా, నీ రక్షణకొరకు నేను కనిపెట్టుచున్నాను, నీ ఆజ్ఞలను అనుసరించి నడుచుకొనుచున్నాను."
  },
  {
    easyQ: "What timeless call to hope closes the humble pilgrimage song in Psalm 131:3?",
    easyQTe: "కీర్తన 131:3 లో ఇశ్రాయేలునకు ఇవ్వబడిన నిత్య నిరీక్షణ పిలుపు ఏది?",
    medQ: "In Psalm 131:2-3, how does a soul calmed like a weaned child rest in hope from this time forth and forever?",
    medQTe: "కీర్తన 131:2-3 లో చనుబాలు విడిచిన పిల్లను పోలిన నెమ్మదిగల హృదయముతో దేవునియందు ఎలా నిరీక్షించవలెను?",
    hardQ: "How does weaning from self-aggrandizement liberate the community into perpetual, childlike hope in Yahweh?",
    hardQTe: "గర్వపు ఆలోచనలను విడిచి తల్లీయొద్దనున్న పాలువిడిచిన బిడ్డవలె శాంతపరచుకొని దేవునియందే నిరంతరము నిరీక్షణయుంచుట ఏ ఆత్మీయ ఉన్నతిని తెచ్చును?",
    options: ["O Israel, hope in the Lord from this time forth and forever", "O Israel, march forty days around Mount Hermon", "O Israel, gather sixty thousand spears for battle", "O Israel, build thirty altars on the high hills"],
    optionsTelugu: ["ఇశ్రాయేలూ, ఇది మొదలుకొని నిరంతరము యెహోవామీదనే నిరీక్షణ యుంచుము", "ఇశ్రాయేలూ, హెర్మోను పర్వతముచుట్టూ నలభై దినములు ప్రదక్షిణ చేయుము", "ఇశ్రాయేలూ, యుద్ధముకొరకు అరవై వేల ఈటెలను సమకూర్చుకొనుము", "ఇశ్రాయేలూ, ఎత్తయిన కొండలపై ముప్పది బలిపీఠములను నిర్మించుము"],
    correctAnswer: "O Israel, hope in the Lord from this time forth and forever",
    bibleReference: "Psalm 131:3",
    explanation: "After quieting pride like a weaned child, the psalmist summons Israel to unending hope in the Lord forever.",
    explanationTelugu: "ఇశ్రాయేలూ, ఇది మొదలుకొని నిరంతరము యెహోవామీదనే నిరీక్షణ యుంచుము."
  },
  {
    easyQ: "In Ezra 10:2, what encouraging word of hope did Shechaniah speak despite widespread covenant failure?",
    easyQTe: "ఎజ్రా 10:2 లో ప్రజలు చేసిన మహా పాపము మధ్యలో సైతం షెకన్యా పలికిన ఆదరణకరమైన నిరీక్షణ మాటేమి?",
    medQ: "According to Ezra 10:2, why was there still hope in Israel if the people truly repented before God?",
    medQTe: "ఎజ్రా 10:2 ప్రకారం దేవుని సన్నిధిలో పశ్చాత్తాపపడి సరిదిద్దుకొనినయెడల ఇశ్రాయేలునకు ఏ నిరీక్షణ మిగిలియున్నది?",
    hardQ: "How does redemptive hope differ from fatalistic despair when confronting severe spiritual backsliding?",
    hardQTe: "తీవ్రమైన పాపములో పడినను దేవుని కృపయందు నిరీక్షణయుంచి పశ్చాత్తాపపడుట సమాజమును సంపూర్ణ నాశనమునుండి ఎలా కాపాడును?",
    options: ["Yet now there is hope in Israel in spite of this", "Israel must endure forty years of wandering in Moab", "All sixty families must be exiled without pity", "There is no forgiveness under the ancient law"],
    optionsTelugu: ["ఈ సంగతినిగూర్చి యికను ఇశ్రాయేలీయులకు నిరీక్షణ కలదు", "ఇశ్రాయేలు మోయాబులో నలభై సంవత్సరముల సంచారమును అనుభవించవలెను", "అరవై కుటుంబములు కనికరములేకుండ వెలివేయబడవలెను", "పురాతన ధర్మశాస్త్రములో ఎట్టి క్షమాపణ లభించదు"],
    correctAnswer: "Yet now there is hope in Israel in spite of this",
    bibleReference: "Ezra 10:2",
    explanation: "Even after serious unfaithfulness, Shechaniah proclaimed that genuine repentance opens a door of divine hope for Israel.",
    explanationTelugu: "మేము మా దేవునికి విరోధముగా పాపము చేసితిమి... అయినను ఈ సంగతినిగూర్చి యికను ఇశ్రాయేలీయులకు నిరీక్షణ కలదు."
  },
  {
    easyQ: "What poignant reflection on maternal hope did Naomi express to her daughters-in-law in Ruth 1:12?",
    easyQTe: "రూతు 1:12 లో తన కోడండ్రతో నయోమి మాట్లాడినప్పుడు నిరీక్షణను గూర్చి ఏ వేదనభరితమైన మాట పలికెను?",
    medQ: "In Ruth 1:11-13, why did Naomi consider her natural prospects of providing sons completely hopeless?",
    medQTe: "రూతు 1:11-13 లో భౌతిక దృక్పథములో తనకు కుమారులు పుట్టునను ఆశ లేదని నయోమి ఎందుకు నిరాశ చెందెను?",
    hardQ: "How does the Book of Ruth demonstrate God's providence resurrecting family hope far beyond human biological limitations?",
    hardQTe: "మానవ అంచనాలకు అసాధ్యమైన పరిస్థితిలో దేవుని కృప రూతు బోయజులద్వారా నయోమి వంశమునకు ఎలా నూతన నిరీక్షణను చిగురింపజేసెను?",
    options: ["Turn back, my daughters... even if I should say I have hope, even if I should have a husband tonight and bear sons", "Follow me forty miles into the plains of Edom", "Offer sixty sheaves of barley at the gates of Moab", "Fast thirty days under the terebinth tree"],
    optionsTelugu: ["నా కుమార్తెలారా, తిరిగి వెళ్లుడి... నాకు నిరీక్షణ కలదని నేను అనుకొనినను, ఈ రాత్రియే నాకు పెనిమిటి కలిగి నేను కుమారులను కనినను", "నాతోకూడ ఎదోము మైదానములలోనికి నలభై మైళ్లు నడువుడి", "మోయాబు గుమ్మములయొద్ద అరవై యవల కట్టలను సమర్పించుడి", "మస్తకి వృక్షము క్రింద ముప్పది దినములు ఉపవాసముండుడి"],
    correctAnswer: "Turn back, my daughters... even if I should say I have hope, even if I should have a husband tonight and bear sons",
    bibleReference: "Ruth 1:12",
    explanation: "Naomi lamented that humanly speaking she had no hope of bearing more sons, setting the stage for God's supernatural redemptive provision.",
    explanationTelugu: "నా కుమార్తెలారా, తిరిగి వెళ్లుడి... నాకు నిరీక్షణ కలదని నేను అనుకొనినను, ఈ రాత్రియే నాకు పెనిమిటి కలిగి నేను కుమారులను కనినను, వారు పెద్దవారగువరకు మీరు కనిపెట్టుదురా?"
  },
  {
    easyQ: "What promise of global hope in God's arm is proclaimed in Isaiah 51:5?",
    easyQTe: "యెషయా 51:5 లో ద్వీపములు దేవుని బాహువుపై ఏ నిరీక్షణయుంచునని ప్రవచింపబడినది?",
    medQ: "According to Isaiah 51:5, how do the distant coastlands wait upon Yahweh and trust in His arm for righteousness?",
    medQTe: "యెషయా 51:5 ప్రకారం దూరపు ద్వీపములు దేవుని రక్షణ మరియు నీతికై ఆయన బాహుబలముమీద ఎలా నిరీక్షించును?",
    hardQ: "How does the prophetic extension of divine salvation to maritime Gentile nations fulfill the Abrahamic covenant?",
    hardQTe: "భూదిగంతముల ద్వీపవాసులు సైతం దేవుని బాహువుపై నిరీక్షణయుంచుదురను వాగ్దానము సర్వజనుల రక్షణ సంకల్పమును ఎలా చాటుచున్నది?",
    options: ["The coastlands will wait upon Me, and on My arm they will trust", "The islands will assemble forty warships of cedar", "The nations will bring sixty talents of copper to Zion", "The governors will establish thirty pagan sanctuaries"],
    optionsTelugu: ["ద్వీపములు నాకొరకు కనిపెట్టుచున్నవి, అవి నా బాహువుమీద నిరీక్షణ యుంచును", "ద్వీపములు నలభై దేవదారు యుద్ధనౌకలను సమకూర్చును", "జనములు సీయోనుకు అరవై రాగి తలాంతులను తెచ్చును", "అధికారులు ముప్పది అన్య పూజాస్థలములను నిర్మింతురు"],
    correctAnswer: "The coastlands will wait upon Me, and on My arm they will trust",
    bibleReference: "Isaiah 51:5",
    explanation: "God declares that distant Gentile nations and coastlands will place their hope and trust in His sovereign saving arm.",
    explanationTelugu: "నా నీతి సమీపముగా ఉన్నది, నా రక్షణ బయలువెళ్లుచున్నది, నా బాహువులు జనములకు న్యాయము తీర్చును; ద్వీపములు నాకొరకు కనిపెట్టుచున్నవి, అవి నా బాహువుమీద నిరీక్షణ యుంచును."
  },
  {
    easyQ: "What contrast between mortal Sheol and living praise did King Hezekiah express in Isaiah 38:18-19?",
    easyQTe: "యెషయా 38:18-19 లో హిజ్కియా రాజు పాతాళపు నిస్సహాయతకును జీవముగలవారి స్తుతికిని మధ్య ఏ తేడాను వివరించెను?",
    medQ: "According to Isaiah 38:18, why must those delivered from death praise God while they have earthly breath?",
    medQTe: "యెషయా 38:18 ప్రకారం సమాధిలోనికి దిగిపోవువారు దేవుని సత్యమునుగూర్చి నిరీక్షింపలేరు గనుక బ్రదికియున్నవారు ఏమి చేయవలెను?",
    hardQ: "How did Hezekiah's recovery from lethal illness anticipate the fuller New Testament revelation of eternal resurrection hope?",
    hardQTe: "మరణపు అంచునుండి హిజ్కియా పొందిన ఆయుష్షు పొడిగింపు దేవుని కనికరముయొక్క నిరీక్షణను ఎలా మహిమపరచెను?",
    options: ["Those who go down to the pit cannot hope for Your truth. The living, the living man, he shall praise You, as I do this day", "The dead will offer forty rams in the temple court", "Those in Sheol will build sixty stone altars", "The departed will send thirty letters to Jerusalem"],
    optionsTelugu: ["గోతిలోనికి దిగిపోవువారు నీ సత్యమునుగూర్చి నిరీక్షింపలేరు; సజీవులు, సజీవులే గదా నేను నేడు చేయునట్లు నిన్ను స్తుతించుదురు", "మృతులు ఆలయ ప్రాంగణములో నలభై పొట్టేళ్లను అర్పించెదరు", "పాతాళములో ఉన్నవారు అరవై రాతి బలిపీఠములను కట్టెదరు", "గతించినవారు యెరూషలేమునకు ముప్పది ఉత్తరములను పంపుదురు"],
    correctAnswer: "Those who go down to the pit cannot hope for Your truth. The living, the living man, he shall praise You, as I do this day",
    bibleReference: "Isaiah 38:18-19",
    explanation: "Hezekiah celebrated his healing, declaring that the living have the joyful privilege of hoping in God's truth and praising His holy name.",
    explanationTelugu: "పాతాళము నీకు కృతజ్ఞతాస్తుతులు చెల్లింపదు, మరణము నిన్ను స్తుతింపదు, గోతిలోనికి దిగిపోవువారు నీ సత్యమునుగూర్చి నిరీక్షింపలేరు; సజీవులు, సజీవులే గదా నేను నేడు చేయునట్లు నిన్ను స్తుతించుదురు."
  },
  {
    easyQ: "What confidence that none who hope in God will be put to shame opens Psalm 25:3?",
    easyQTe: "కీర్తన 25:3 లో దేవునికొరకు కనిపెట్టువారికి (నిరీక్షించువారికి) ఏ నిశ్చయమైన హామీ ఇవ్వబడినది?",
    medQ: "In Psalm 25:3, who will ultimately be ashamed compared to those who wait upon Yahweh?",
    medQTe: "కీర్తన 25:3 ప్రకారం దేవునికొరకు కనిపెట్టువారికి బదులుగా ఎవరు సిగ్గునొందుదురు?",
    hardQ: "How does the vindication of covenant trust establish the moral integrity of waiting patiently on God's vindication?",
    hardQTe: "యెహోవాకొరకు కనిపెట్టువారెవరును సిగ్గుపడరను వాగ్దానము విశ్వాసికి ఎటువంటి ఆత్మీయ స్థైర్యమును ఇచ్చును?",
    options: ["Indeed, let no one who waits on You be ashamed; let those be ashamed who deal treacherously without cause", "Let those who build forty stone monuments be praised", "Let those who gather sixty cavalry squadrons prevail", "Let those who hide in thirty mountain fortresses be safe"],
    optionsTelugu: ["నీకొరకు కనిపెట్టువారిలో ఎవడును సిగ్గుపడడు; హేతువులేకుండ ద్రోహము చేయువారు సిగ్గుపడుదురు", "నలభై రాతి స్తంభములను కట్టువారు ప్రశంసింపబడుదురు", "అరవై అశ్విక దళములను సమకూర్చుకొనువారు జయమొందుదురు", "ముప్పది పర్వత కోటలలో దాగుకొనువారు సురక్షితముగా ఉందురు"],
    correctAnswer: "Indeed, let no one who waits on You be ashamed; let those be ashamed who deal treacherously without cause",
    bibleReference: "Psalm 25:3",
    explanation: "David declares that genuine faith and patient hope in God will never end in humiliation or disgrace.",
    explanationTelugu: "నీకొరకు కనిపెట్టువారిలో ఎవడును సిగ్గుపడడు; హేతువులేకుండ ద్రోహము చేయువారే సిగ్గుపడుదురు."
  },
  {
    easyQ: "What prayer for all-day guidance in truth and hope is penned in Psalm 25:5?",
    easyQTe: "కీర్తన 25:5 లో దినమెల్ల దేవుని సత్యములో నడుచుచు నిరీక్షించుటకొరకు దావీదు చేసిన ప్రార్థన ఏది?",
    medQ: "According to Psalm 25:5, why does the psalmist wait on God all the day long?",
    medQTe: "కీర్తన 25:5 ప్రకారం భక్తుడు దినమెల్ల దేవునికొరకే ఎందుకు కనిపెట్టుచున్నాడు?",
    hardQ: "How does coupling divine instruction in truth with constant hope protect the pilgrim's path from doctrinal deception?",
    hardQTe: "దేవుని సత్యబోధను నిరంతర నిరీక్షణతో జోడించుట విశ్వాసి నడకను పాపపు మార్గములనుండి ఎలా కాపాడును?",
    options: ["Lead me in Your truth and teach me, for You are the God of my salvation; on You I wait all the day", "Give me forty chariots to travel securely through Edom", "Grant me sixty gold talents to purchase wisdom in Tyre", "Send thirty legions to enforce my kingdom's decrees"],
    optionsTelugu: ["నన్ను నీ సత్యముననుసరించి నడిపించుము, నాకు ఉపదేశము చేయుము; నీవే నా రక్షణకర్తవైన దేవుడవు, దినమెల్ల నీకొరకు కనిపెట్టుచున్నాను", "ఎదోము గుండా సురక్షితముగా వెళ్లుటకు నాకు నలభై రథములను ఇమ్ము", "తీరులో జ్ఞానమును కొనుగోలు చేయుటకు అరవై బంగారు తలాంతులను ఇమ్ము", "నా రాజ్యపు ఆజ్ఞలను అమలుచేయుటకు ముప్పది సైన్యములను పంపుము"],
    correctAnswer: "Lead me in Your truth and teach me, for You are the God of my salvation; on You I wait all the day",
    bibleReference: "Psalm 25:5",
    explanation: "David anchors his whole life in God, asking to be taught divine truth while waiting expectantly on the God of his salvation all day long.",
    explanationTelugu: "నన్ను నీ సత్యముననుసరించి నడిపించుము, నాకు ఉపదేశము చేయుము; నీవే నా రక్షణకర్తవైన దేవుడవు, దినమెల్ల నీకొరకు కనిపెట్టుచున్నాను."
  },
  {
    easyQ: "What two protective virtues does the psalmist pair with hope in Psalm 25:21?",
    easyQTe: "కీర్తన 25:21 లో నిరీక్షణతోపాటు భక్తుని కాపాడు రెండు నైతిక సుగుణములేవి?",
    medQ: "In Psalm 25:21, how do integrity and uprightness preserve the one who waits on Yahweh?",
    medQTe: "కీర్తన 25:21 ప్రకారం దేవునికొరకు కనిపెట్టువానిని యథార్థత నిర్దోషత్వములు ఎలా కాపాడును?",
    hardQ: "Why is patient hope in God counterfeit if divorced from ethical integrity and practical uprightness?",
    hardQTe: "నిజమైన నిరీక్షణ కేవలము మాటలతో సరిపెట్టుకొనక యథార్థమైన మరియు పవిత్రమైన జీవితముతో ఎలా కలిసియుండవలెను?",
    options: ["Let integrity and uprightness preserve me, for I wait for You", "Let sixty armed bodyguards encircle my palace gates", "Let forty bronze shields defend my mountain strongholds", "Let thirty treaties with foreign kings secure my throne"],
    optionsTelugu: ["నేను నీకొరకు కనిపెట్టుచున్నాను, యథార్థతయు నిర్దోషత్వమును నన్ను కాపాడును గాక", "నా రాజభవన ద్వారములను అరవైమంది సాయుధ రక్షకులు కాపాడుదురు గాక", "నా పర్వత కోటలను నలభై ఇత్తడి డాలులు రక్షించును గాక", "విదేశీ రాజులతో ముప్పది సంధులు నా సింహాసనమును స్థిరపరచును గాక"],
    correctAnswer: "Let integrity and uprightness preserve me, for I wait for You",
    bibleReference: "Psalm 25:21",
    explanation: "David prays that moral integrity and uprightness will guard his character while he patiently waits on the Lord.",
    explanationTelugu: "నేను నీకొరకు కనిపెట్టుచున్నాను; యథార్థతయు నిర్దోషత్వమును నన్ను కాపాడును గాక."
  },
  {
    easyQ: "What inheritance is promised to those who wait upon the Lord in Psalm 37:9?",
    easyQTe: "కీర్తన 37:9 లో యెహోవాకొరకు కనిపెట్టువారికి ఏ స్వాస్థ్యము వాగ్దానము చేయబడినది?",
    medQ: "According to Psalm 37:9, what contrasting fate awaits evildoers compared to those who hope in God?",
    medQTe: "కీర్తన 37:9 ప్రకారం చెడుచేయువారి ముగింపుతో పోలిస్తే దేవునికొరకు కనిపెట్టువారు పొందు ఆశీర్వాదమేమి?",
    hardQ: "How does the eschatological inheritance of the land reward the patient refusal to retaliate against triumphant wickedness?",
    hardQTe: "దుష్టుల తాత్కాలిక వైభవమును చూచి అసూయపడక దేవునికొరకే కనిపెట్టువారు భూమిని స్వతంత్రించుకొందురను సత్యము ఏ నిరీక్షణనిచ్చును?",
    options: ["Those who wait on the Lord, they shall inherit the earth", "Those who assemble forty swift chariots shall conquer the hills", "Those who pay sixty silver talents shall acquire palaces", "Those who negotiate thirty alliances shall reign supreme"],
    optionsTelugu: ["యెహోవాకొరకు కనిపెట్టుకొనువారు భూమిని స్వతంత్రించుకొందురు", "నలభై వేగవంతమైన రథములను సమకూర్చుకొనువారు కొండలను జయింతురు", "అరవై వెండి తలాంతులను చెల్లించువారు భవనములను సంపాదింతురు", "ముప్పది సంధులను కుదుర్చుకొనువారు రాజ్యమేలుదురు"],
    correctAnswer: "Those who wait on the Lord, they shall inherit the earth",
    bibleReference: "Psalm 37:9",
    explanation: "While evildoers are cut off, those who quietly wait upon the Lord receive the enduring inheritance of the earth.",
    explanationTelugu: "కీడుచేయువారు నిర్మూలమగుదురు; యెహోవాకొరకు కనిపెట్టుకొనువారు భూమిని స్వతంత్రించుకొందురు."
  },
  {
    easyQ: "What divine exaltation is promised to the faithful in Psalm 37:34?",
    easyQTe: "కీర్తన 37:34 లో యెహోవాకొరకు కనిపెట్టుకొని ఆయన మార్గమును గైకొనువారికి ఏ హెచ్చింపు వాగ్దానము చేయబడినది?",
    medQ: "In Psalm 37:34, what two commands form the prerequisite for being exalted to inherit the land?",
    medQTe: "కీర్తన 37:34 ప్రకారం భూమిని స్వతంత్రించుకొనునట్లు హెచ్చింపబడుటకు ఏ రెండు ఆజ్ఞలను పాటించవలెను?",
    hardQ: "How does holding fast to God's path while waiting prevent believers from adopting worldly shortcuts to success?",
    hardQTe: "లోకపు అక్రమ మార్గములను ఆశ్రయించక దేవుని మార్గమందే నిలిచి కనిపెట్టుకొనుట విశ్వాసిని ఎలా ఘనపరచును?",
    options: ["Wait on the Lord, and keep His way, and He shall exalt you to inherit the land", "Build forty fortified towers and amass sixty archers", "Collect thirty talents of silver before entering battle", "Seek forty days of political counsel from Egypt"],
    optionsTelugu: ["యెహోవాకొరకు కనిపెట్టుకొని యుండుము, ఆయన మార్గమును గైకొనుము, అప్పుడు భూమిని స్వతంత్రించుకొనునట్లు ఆయన నిన్ను హెచ్చించును", "నలభై బలమైన గోపురములను కట్టి అరవైమంది విలుకాండ్రను సమకూర్చుకొనుము", "యుద్ధమునకు వెళ్లుటకు ముందు ముప్పది వెండి తలాంతులను సేకరించుము", "ఐగుప్తునుండి నలభై దినముల రాజకీయ సలహాలను పొందుము"],
    correctAnswer: "Wait on the Lord, and keep His way, and He shall exalt you to inherit the land",
    bibleReference: "Psalm 37:34",
    explanation: "Scripture commands believers to wait on the Lord and walk faithfully in His ways; in due time, God Himself will exalt them.",
    explanationTelugu: "యెహోవాకొరకు కనిపెట్టుకొని యుండుము, ఆయన మార్గమును గైకొనుము, అప్పుడు భూమిని స్వతంత్రించుకొనునట్లు ఆయన నిన్ను హెచ్చించును; భక్తిహీనులు నిర్మూలమగుట నీవు చూచెదవు."
  },
  {
    easyQ: "What famous testimony of patient waiting and miraculous rescue opens Psalm 40:1-2?",
    easyQTe: "కీర్తన 40:1-2 లో ఓపికతో కనిపెట్టుటవలన దేవుడు చేసిన అద్భుత రక్షణను గూర్చి దావీదు చెప్పిన సాక్ష్యమేమి?",
    medQ: "According to Psalm 40:1-2, out of what horrible pit and miry clay did the Lord lift the psalmist?",
    medQTe: "కీర్తన 40:1-2 ప్రకారం నాశనకరమైన గుంటలోనుండి జిగటగల దొంగ ఊబిలోనుండి యెహోవా తన భక్తుని ఎలా పైకెత్తెను?",
    hardQ: "How does setting the believer's feet upon a rock and establishing their steps answer the spiritual agony of waiting?",
    hardQTe: "ఓపికతో యెహోవాకొరకు కనిపెట్టినప్పుడు ఆయన మొరనాలకించి బండపై పాదములు నిలిపి నూతన కీర్తననిచ్చుట ఏ ఆత్మీయ నిశ్చయతను ఇచ్చును?",
    options: ["I waited patiently for the Lord; and He inclined to me, and heard my cry. He also brought me up out of a horrible pit, out of the miry clay, and set my feet upon a rock", "I dispatched forty cavalry units to rescue my trapped soldiers", "I purchased my freedom with sixty talents of silver from Tyre", "I escaped by digging a tunnel thirty cubits beneath the wall"],
    optionsTelugu: ["యెహోవాకొరకు నేను సహనముతో కనిపెట్టుకొంటిని, ఆయన నాకు చెవియొగ్గి నా మొర నాలకించెను; నాశనకరమైన గుంటలోనుండియు జిగటగల ఊబిలోనుండియు ఆయన నన్ను పైకెత్తెను, నా పాదములను బండమీద నిలిపెను", "చిక్కుబడిన సైనికులను రక్షించుటకు నేను నలభై అశ్విక దళములను పంపితిని", "తీరునుండి అరవై వెండి తలాంతులు చెల్లించి నా విడుదలను కొనుక్కొంటిని", "గోడ క్రింద ముప్పది మూరల సొరంగమును తవ్వి నేను తప్పించుకొంటిని"],
    correctAnswer: "I waited patiently for the Lord; and He inclined to me, and heard my cry. He also brought me up out of a horrible pit, out of the miry clay, and set my feet upon a rock",
    bibleReference: "Psalm 40:1-2",
    explanation: "David testifies that patient hope was rewarded when God bent down, heard his desperate cry, and set his sinking feet firmly upon a solid rock.",
    explanationTelugu: "యెహోవాకొరకు నేను సహనముతో కనిపెట్టుకొంటిని, ఆయన నాకు చెవియొగ్గి నా మొర నాలకించెను; నాశనకరమైన గుంటలోనుండియు జిగటగల ఊబిలోనుండియు ఆయన నన్ను పైకెత్తెను, నా పాదములను బండమీద నిలిపి నా అడుగులను స్థిరపరచెను."
  },
  {
    easyQ: "What sweet resolve to wait upon God's name before His saints closes Psalm 52:9?",
    easyQTe: "కీర్తన 52:9 లో పరిశుద్ధుల యెదుట దేవుని నామముకొరకు కనిపెట్టుదునని దావీదు ఏ నిశ్చయతను వ్యక్తపరచెను?",
    medQ: "In Psalm 52:8-9, how does trusting in God's mercy like a green olive tree lead to perpetual waiting on His good name?",
    medQTe: "కీర్తన 52:8-9 ప్రకారం దేవుని మందిరములో పచ్చని ఒలీవ చెట్టువలె నిలిచి ఆయన నామముకొరకే ఎందుకు కనిపెట్టవలెను?",
    hardQ: "Why is public testimony to God's faithful goodness an essential outcome of answered hope?",
    hardQTe: "దుష్టుల హింసలమధ్య దేవుని కృపయందే నిరంతరము నమ్మకముంచి ఆయన పరిశుద్ధ నామముకొరకు ఎదురుచూచుట ఏ విజయమునిచ్చును?",
    options: ["I will praise You forever, because You have done it; and in the presence of Your saints I will wait on Your name, for it is good", "I will conquer forty Philistine strongholds with my sword", "I will build sixty stone pillars in the desert of Ziph", "I will demand thirty talents of tribute from Doeg"],
    optionsTelugu: ["నీవు ఈ కార్యము చేసితివి గనుక నేను నిత్యము నిన్ను స్తుతించెదను; నీ నామము ఉత్తమమైనది, నీ భక్తులయెదుట నేను దానికొరకు కనిపెట్టుచుందును", "నా ఖడ్గముతో నలభై ఫిలిష్తీయుల కోటలను నేను జయింతును", "జీపు అరణ్యములో అరవై రాతి స్తంభములను నేను నిలబెట్టెదను", "దోయేగునుండి ముప్పది తలాంతుల పన్నును నేను డిమాండ్ చేసెదను"],
    correctAnswer: "I will praise You forever, because You have done it; and in the presence of Your saints I will wait on Your name, for it is good",
    bibleReference: "Psalm 52:9",
    explanation: "David resolves to praise God perpetually and wait expectantly upon His trustworthy name in fellowship with the saints.",
    explanationTelugu: "నీవు ఈ కార్యము చేసితివి గనుక నేను నిత్యము నిన్ను స్తుతించెదను; నీ నామము ఉత్తమమైనది, నీ భక్తులయెదుట నేను దానికొరకు కనిపెట్టుచుందును."
  },
  {
    easyQ: "What warning against personal vengeance and call to wait on the Lord is given in Proverbs 20:22?",
    easyQTe: "సామెతలు 20:22 లో పగతీర్చుకొనుటకు బదులుగా యెహోవాకొరకు కనిపెట్టుకొనుటను గూర్చి ఏ బోధ కలదు?",
    medQ: "According to Proverbs 20:22, why should believers never say 'I will recompense evil'?",
    medQTe: "సామెతలు 20:22 ప్రకారం కీడునకు ప్రతికీడు చేయుటకు బదులుగా విశ్వాసి ఏమి చేయవలెను?",
    hardQ: "How does the discipline of waiting on God to vindicate and save free the human heart from toxic resentment?",
    hardQTe: "తీర్పును స్వయముగా తీర్చుకొనక దేవుని న్యాయముకొరకు నిరీక్షణతో కనిపెట్టుకొనుట విశ్వాసిని పాపపు పగనుండి ఎలా విడిపించును?",
    options: ["Do not say, 'I will recompense evil'; wait on the Lord, and He will save you", "Prepare forty chariots to avenge your family honor", "Pursue your enemies sixty leagues into the wilderness", "Demand thirty sheep as restitution for insult"],
    optionsTelugu: ["'కీడునకు ప్రతికీడు చేసెదననవద్దు; యెహోవాకొరకు కనిపెట్టుకొనుము, ఆయన నిన్ను రక్షించును'", "కుటుంబ గౌరవమును నిలుపుటకు నలభై రథములను సిద్ధపరచుము", "నీ శత్రువులను అరణ్యములో అరవై ఆమడల దూరం వెంటాడుము", "అవమానమునకు పరిహారముగా ముప్పది గొఱ్ఱెలను డిమాండ్ చేయుము"],
    correctAnswer: "Do not say, 'I will recompense evil'; wait on the Lord, and He will save you",
    bibleReference: "Proverbs 20:22",
    explanation: "Proverbs forbids personal retaliation, urging believers to wait patiently upon the Lord who will faithfully vindicate and deliver them.",
    explanationTelugu: "కీడునకు ప్రతికీడు చేసెదననవద్దు; యెహోవాకొరకు కనిపెట్టుకొనుము, ఆయన నిన్ను రక్షించును."
  },
  {
    easyQ: "What triumphant song of joyful vindication in God's salvation is prophesied in Isaiah 25:9?",
    easyQTe: "యెషయా 25:9 లో దేవుని రక్షణకొరకైన నిరీక్షణ నెరవేరినప్పుడు పరిశుద్ధులు పాడే విజయగానమేమి?",
    medQ: "In Isaiah 25:9, how do believers exult when Yahweh appears to fulfill their long-awaited hope?",
    medQTe: "యెషయా 25:9 ప్రకారం తాము కనిపెట్టిన దేవుడు ప్రత్యక్షమై రక్షించినప్పుడు విశ్వాసులు ఎలా ఆనందింతురు?",
    hardQ: "How does the repetition of 'we have waited for Him' underscore the ultimate vindication of patient biblical hope?",
    hardQTe: "'మనము కనిపెట్టుకొనిన మన దేవుడు ఈయనే; మనము ఆయన రక్షణయందు సంతోషించి ఉత్సహింతము' అను వాక్యము నిరీక్షణకు ఏ పరమ ముగింపునిచ్చును?",
    options: ["Behold, this is our God; we have waited for Him, and He will save us. This is the Lord; we have waited for Him; we will be glad and rejoice in His salvation", "We built sixty towers and thirty walls to secure our liberty", "We gathered forty kings to conquer the nations of the north", "We bought sixty silver shields from the merchants of Egypt"],
    optionsTelugu: ["'ఇదిగో మనలను రక్షించునని మనము కనిపెట్టుకొనియున్న మన దేవుడు ఈయనే; మనము కనిపెట్టుకొనిన యెహోవా ఈయనే, ఆయన రక్షణయందు సంతోషించి ఉత్సహింతము'", "మా స్వాతంత్ర్యముకొరకు మేము అరవై గోపురములను ముప్పది ప్రాకారములను కట్టితివి", "ఉత్తర దేశపు రాజ్యములను జయించుటకు నలభైమంది రాజులను సమకూర్చితివి", "ఐగుప్తు వర్తకులవద్దనుండి అరవై వెండి డాలులను కొనుగోలు చేసితివి"],
    correctAnswer: "Behold, this is our God; we have waited for Him, and He will save us. This is the Lord; we have waited for Him; we will be glad and rejoice in His salvation",
    bibleReference: "Isaiah 25:9",
    explanation: "The redeemed will shout with boundless joy when God finally arrives, proving that every moment of patient waiting was triumphantly justified.",
    explanationTelugu: "ఆ దినమున జనులు ఈలాగు చెప్పుదురు-ఇదిగో మనలను రక్షించునని మనము కనిపెట్టుకొనియున్న మన దేవుడు ఈయనే; మనము కనిపెట్టుకొనిన యెహోవా ఈయనే, ఆయన రక్షణయందు సంతోషించి ఉత్సహింతము."
  },
  {
    easyQ: "What source of everlasting consolation and good hope is invoked in 2 Thessalonians 2:16-17?",
    easyQTe: "2 థెస్సలొనీకయులకు 2:16-17 లో మన హృదయములను ఆదరించి బలపరచు నిత్య ఆదరణ మరియు శ్రేష్ఠమైన నిరీక్షణ ఎవరివలన కలుగును?",
    medQ: "According to 2 Thessalonians 2:16-17, through what divine attribute did God give us good hope?",
    medQTe: "2 థెస్సలొనీకయులకు 2:16-17 ప్రకారం దేవుడు తన ఏ గుణముద్వారా మనకు నిత్యమైన ఆదరణను మరియు నిరీక్షణను అనుగ్రహించెను?",
    hardQ: "How does 'good hope by grace' actively stabilize the believer's heart in every good word and work?",
    hardQTe: "కృపవలన కలిగిన శ్రేష్ఠమైన నిరీక్షణ విశ్వాసుల హృదయములను ప్రతి సత్కార్యమందును సద్వాక్యమందును ఎలా స్థిరపరచును?",
    options: ["Now may our Lord Jesus Christ Himself, and our God and Father, who has loved us and given us everlasting consolation and good hope by grace, comfort your hearts and establish you in every good word and work", "May forty philosophers of Greece instruct your assemblies in debate", "May sixty talents of silver protect your community from Roman taxation", "May thirty days of silent contemplation earn you spiritual security"],
    optionsTelugu: ["మన ప్రభువైన యేసుక్రీస్తును, మనలను ప్రేమించి కృపచేత నిత్యమైన ఆదరణయు శుభ నిరీక్షణయు అనుగ్రహించిన మన తండ్రియైన దేవుడును, మీ హృదయములను ఆదరించి ప్రతి సత్కార్యమందును సద్వాక్యమందును మిమ్మును స్థిరపరచును గాక", "గ్రీసు దేశపు నలభైమంది తత్వవేత్తలు మీ సమాజములకు వాదనలలో శిక్షణ ఇత్తురు గాక", "రోమా పన్నులనుండి అరవై వెండి తలాంతులు మీ సమాజమును కాపాడును గాక", "ముప్పది దినముల నిశ్శబ్ద ధ్యానము మీకు ఆత్మీయ భద్రతను సంపాదించిపెట్టును గాక"],
    correctAnswer: "Now may our Lord Jesus Christ Himself, and our God and Father, who has loved us and given us everlasting consolation and good hope by grace, comfort your hearts and establish you in every good word and work",
    bibleReference: "2 Thessalonians 2:16-17",
    explanation: "Paul prays that God the Father and the Lord Jesus Christ, who lavished eternal comfort and good hope upon us by grace, will anchor our hearts in all goodness.",
    explanationTelugu: "మన ప్రభువైన యేసుక్రీస్తును, మనలను ప్రేమించి కృపచేత నిత్యమైన ఆదరణయు శుభ నిరీక్షణయు అనుగ్రహించిన మన తండ్రియైన దేవుడును, మీ హృదయములను ఆదరించి, ప్రతి సత్కార్యమందును సద్వాక్యమందును మిమ్మును స్థిరపరచును గాక."
  },
  {
    easyQ: "What sublime Christological title opens 1 Timothy 1:1, designating Jesus as our hope?",
    easyQTe: "1 తిమోతి 1:1 లో యేసుక్రీస్తునకు ఇవ్వబడిన ఏ పరమ బిరుదు ఆయనను మన నిరీక్షణగా వర్ణించుచున్నది?",
    medQ: "According to 1 Timothy 1:1, by whose commandment was Paul appointed an apostle of Christ Jesus, our hope?",
    medQTe: "1 తిమోతి 1:1 ప్రకారం మన నిరీక్షణయైన క్రీస్తుయేసుయొక్క అపొస్తలునిగా పౌలు ఎవరి ఆజ్ఞచొప్పున నియమింపబడెను?",
    hardQ: "How does identifying the living Person of Jesus Christ as our hope transform abstract doctrine into vibrant personal communion?",
    hardQTe: "నిరీక్షణ అనునది కేవలము ఒక సిద్ధాంతము కాక 'యేసుక్రీస్తే మన నిరీక్షణ' అను సత్యము విశ్వాసి జీవితమును ఎలా రూపాంతరం చెందించును?",
    options: ["Paul, an apostle of Jesus Christ, by the commandment of God our Savior and the Lord Jesus Christ, our hope", "Paul, a magistrate appointed by forty Roman senators", "Paul, a philosopher commissioned by thirty scholars of Tarsus", "Paul, an inspector sent by sixty priests of Jerusalem"],
    optionsTelugu: ["మన రక్షకుడైన దేవునియొక్కయు, మన నిరీక్షణయైన క్రీస్తుయేసుయొక్కయు ఆజ్ఞప్రకారము యేసుక్రీస్తుయొక్క అపొస్తలుడైన పౌలు", "నలభైమంది రోమా సెనెటర్లచే నియమింపబడిన న్యాయాధికారియైన పౌలు", "తార్సులోని ముప్పదిమంది పండితులచే పంపబడిన తత్వవేత్తయైన పౌలు", "యెరూషలేములోని అరవైమంది యాజకులచే నియమింపబడిన అధికారియైన పౌలు"],
    correctAnswer: "Paul, an apostle of Jesus Christ, by the commandment of God our Savior and the Lord Jesus Christ, our hope",
    bibleReference: "1 Timothy 1:1",
    explanation: "Jesus Christ is not merely the giver of hope; He Himself is personally our living, embodied, eternal hope.",
    explanationTelugu: "మన రక్షకుడైన దేవునియొక్కయు, మన నిరీక్షణయైన క్రీస్తుయేసుయొక్కయు ఆజ్ఞప్రకారము క్రీస్తుయేసుయొక్క అపొస్తలుడైన పౌలు తిమోతికి శుభమని చెప్పి వ్రాయునది."
  }
];

const mastery9 = [
  ["Revelation 7:16-17 on the redeemed never hungering or thirsting anymore, the Lamb leading them to living fountains of waters, God wiping away every tear", "ప్రకటన 7:16-17 విమోచింపబడినవారు ఇకమీదట ఆకలిగొనరు దప్పిగొనరు, గొర్రెపిల్లయే జీవజలముల బుగ్గలయొద్దకు వారిని నడిపించును, దేవుడే వారి కన్నీళ్లన్నిటిని తుడిచివేయును", "Revelation 7:16-17", "\"They shall neither hunger anymore nor thirst anymore; the sun shall not strike them, nor any heat; for the Lamb who is in the midst of the throne will shepherd them and lead them to living fountains of waters. And God will wipe away every tear from their eyes\"", "\"వారు ఇకమీదట ఆకలిగొనరు, ఇకమీదట దప్పిగొనరు, ఎండయైనను ఏ ఉక్కయైనను వారిమీద పడదు; ఏలయనగా సింహాసనమధ్యమందుండు గొర్రెపిల్లయే వారికి కాపరియై, జీవజలముల బుగ్గలయొద్దకు వారిని నడిపించును; దేవుడే వారి కన్నులనుండి ప్రతి బాష్పబిందువును తుడిచివేయును\"", "Consummate pastoral comfort: the glorified Lamb personally shepherding saints in tearless eternal joy.", "సింహాసనమధ్యమందున్న గొర్రెపిల్లయైన క్రీస్తే స్వయముగా కాపరియై నిత్య జీవజలముల ఊటలయొద్దకు నడిపించి కన్నీరంతయు తుడిచివేయు పరమ నిరీక్షణ."],
  ["Revelation 20:6 on blessed and holy is he who has part in the first resurrection, over such the second death has no power", "ప్రకటన 20:6 మొదటి పునరుత్థానములో పాలుపొందువాడు ధన్యుడును పరిశుద్ధుడునై యుండును, అట్టివారిపై రెండవ మరణమునకు ఏ అధికారమును ఉండదు", "Revelation 20:6", "\"Blessed and holy is he who has part in the first resurrection. Over such the second death has no power, but they shall be priests of God and of Christ, and shall reign with Him a thousand years\"", "\"మొదటి పునరుత్థానములో పాలుగలవారు ధన్యులును పరిశుద్ధులునై యుందురు. ఇట్టివారిమీద రెండవ మరణమునకు ఏ అధికారమును లేదు; వీరు దేవునికిని క్రీస్తునకును యాజకులై క్రీస్తుతోకూడ వెయ్యి సంవత్సరములు రాజ్యపరిపాలన చేయుదురు\"", "The inviolable security of the resurrected: totally immune to the lake of fire, reigning with Christ in holy priesthood.", "మొదటి పునరుత్థానములో లేపబడిన పరిశుద్ధులు రెండవ మరణమునకు లోనుకాని అమరత్వమును పొంది క్రీస్తుతోకూడ పరిపాలించు నిరీక్షణ."],
  ["Revelation 21:4-5 on God wiping away every tear, no more death, nor sorrow, nor crying, no more pain, 'Behold, I make all things new'", "ప్రకటన 21:4-5 దేవుడు వారి కన్నీళ్లన్నిటిని తుడిచివేయును, ఇకమీదట మరణముండదు, దుఃఖమైనను ఏడ్పైనను వేదనయైనను ఇకమీదట ఉండదు, 'ఇదిగో సమస్తమును నూతనమైనవిగా చేయుచున్నాను'", "Revelation 21:4-5", "\"And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying. There shall be no more pain, for the former things have passed away. Then He who sat on the throne said, 'Behold, I make all things new'\"", "\"ఆయన వారి కన్నుల ప్రతి బాష్పబిందువును తుడిచివేయును, మరణము ఇక ఉండదు, దుఃఖమైనను ఏడ్పైనను వేదనయైనను ఇక ఉండదు; మొదటి సంగతులు గతించిపోయెను. అప్పుడు సింహాసనాసీనుడై యున్నవాడు-ఇదిగో నేను సమస్తమును నూతనమైనవిగా చేయుచున్నానని సెలవిచ్చెను\"", "The eradication of all fallen entropy: death, suffering, and tears permanently abolished by divine decree.", "సమస్త దుఃఖ వేదన మరణములను సమూలముగా నిర్మూలించి దేవుడే సమస్తమును నూతనముగా సృష్టించు అద్భుత నిరీక్షణ దర్శనము."],
  ["Revelation 21:22-23 on the holy city having no need of temple, sun, or moon, for the Lord God Almighty and the Lamb are its temple and its radiant light", "ప్రకటన 21:22-23 పరిశుద్ధ పట్టణములో ఏ దేవాలయమును కనబడదు, సర్వశక్తిగల దేవుడైన ప్రభువును గొర్రెపిల్లయు దానికి ఆలయమై యున్నారు, దేవుని మహిమయే దానిని ప్రకాశింపజేయును", "Revelation 21:23", "\"The city had no need of the sun or of the moon to shine in it, for the glory of God illuminated it. The Lamb is its light\"", "\"ఆ పట్టణములో ప్రకాశించుటకై సూర్యుడైనను చంద్రుడైనను దానికక్కరలేదు; దేవుని మహిమయే దానిలో ప్రకాశించుచున్నది, గొర్రెపిల్లయే దానికి దీపము\"", "Unmediated divine illumination: creation's astronomical lamps eclipsed by the uncreated glory of the Lamb.", "సూర్య చంద్రుల వెలుగు అవసరములేకుండ దేవుని మహిమయు గొర్రెపిల్లయైన క్రీస్తే నిత్య ప్రకాశముగా వెలుగు పరమ నిరీక్షణ."],
  ["Daniel 12:2-3 on those who sleep in dust awaking, some to everlasting life, those who turn many to righteousness shining like the stars forever and ever", "దానియేలు 12:2-3 నేలధూళిలో నిద్రించువారిలో అనేకులు నిత్యజీవము పొందుటకు మేల్కొందురు, అనేకులను నీతిమార్గమునకు నడిపించువారు నక్షత్రములవలె నిరంతరము ప్రకాశించుదురు", "Daniel 12:2-3", "\"And many of those who sleep in the dust of the earth shall awake, some to everlasting life... Those who are wise shall shine like the brightness of the firmament, and those who turn many to righteousness like the stars forever and ever\"", "\"మరియు నేలధూళిలో నిద్రించువారిలో అనేకులు మేల్కొందురు; కొందరు నిత్యజీవము ననుభవించుటకును, కొందరు నిందపాలును నిత్యావమానమును అనుభవించుటకును మేల్కొందురు. బుద్ధిమంతులైతే ఆకాశమండలములోని జ్యోతులనుపోలి ప్రకాశించెదరు, నీతిమార్గముననుసరించి నడుచుకొనునట్లు అనేకులను త్రిప్పువారు నక్షత్రములవలె నిరంతరము ప్రకాశించెదరు\"", "Old Testament resurrection pinnacle: somatic awakening from mortal dust to immortal stellar brilliance.", "ధూళిలోనుండి మేల్కొని నీతిమంతులు ఆకాశ నక్షత్రములవలె యుగయుగములు దేవుని మహిమతో ప్రకాశించు ప్రవచన నిరీక్షణ."],
  ["Isaiah 25:8 on He will swallow up death forever, and the Lord God will wipe away tears from all faces and take away the rebuke of His people", "యెషయా 25:8 ఆయన మరణమును శాశ్వతముగా మింగివేయును, ప్రభువైన యెహోవా ప్రతి ముఖముమీది బాష్పబిందువులను తుడిచివేయును", "Isaiah 25:8", "\"He will swallow up death forever, and the Lord God will wipe away tears from all faces; the rebuke of His people He will take away from all the earth; for the Lord has spoken\"", "\"మరణమును ఆయన సదాకాలమునకు మింగివేయును, ప్రభువైన యెహోవా ప్రతి ముఖముమీది బాష్పబిందువులను తుడిచివేయును, భూమియంతటనుండి తన ప్రజలమీది నిందను తీసివేయును; యెహోవా సెలవిచ్చియున్నాడు\"", "Total eschatological triumph: mortality swallowed in victory, every tear dried by God's sovereign tender hand.", "మరణమును శాశ్వతముగా జయించి సమస్త మానవ దుఃఖపు కన్నీటిని ప్రేమతో తుడిచివేయు యెహోవా విజయ వాగ్దానము."],
  ["Isaiah 26:19 declaring the resurrection of the dead: 'Your dead shall live; together with my dead body they shall arise. Awake and sing, you who dwell in dust!'", "యెషయా 26:19 'మృతులైన నీవారు బ్రదుకుదురు, శవముగా ఉన్న నావారు లేతురు; ధూళిలో పడియున్నవారలారా, మేల్కొని ఉత్సహించుడి'", "Isaiah 26:19", "\"Your dead shall live; together with my dead body they shall arise. Awake and sing, you who dwell in dust! For your dew is like the dew of herbs, and the earth shall cast out the dead\"", "\"మృతులైన నీవారు బ్రదుకుదురు, శవముగా ఉన్న నావారు లేతురు; ధూళిలో పడియున్నవారలారా, మేల్కొని ఉత్సహించుడి; నీ మంచు ప్రకాశమానమైన మంచువలె నున్నది, భూమి తనలోనున్న ప్రేతములను వెళ్లగ్రక్కును\"", "The vibrant Old Testament prophecy of bodily awakening: graves yielding up the redeemed to sing in the morning light.", "సమాధులలో నిద్రించు పరిశుద్ధులు ఉదయపు మంచువలె లేచి నూతన ఆనందగానము చేయుదురను పునరుత్థాన నిరీక్షణ."],
  ["1 John 3:1-2 on what manner of love the Father has bestowed on us, and when He is revealed, we shall be like Him, for we shall see Him as He is", "1 యోహాను 3:1-2 మనము దేవుని పిల్లలమని పిలువబడునట్లు తండ్రి మనకెట్టి ప్రేమను అనుగ్రహించెనో చూడుడి; ఆయన ప్రత్యక్షమైనప్పుడు ఆయన ఉన్నట్లుగానే ఆయనను చూతుము గనుక ఆయనను పోలియుందుము", "1 John 3:2", "\"Beloved, now we are children of God; and it has not yet been revealed what we shall be, but we know that when He is revealed, we shall be like Him, for we shall see Him as He is\"", "\"ప్రియులారా, యిప్పుడు మనము దేవుని పిల్లలమై యున్నాము; మనమికనేమి కాబోవుదుమో అది యింక ప్రత్యక్షపరచబడలేదు గాని ఆయన ప్రత్యక్షమైనప్పుడు ఆయన యున్నట్టుగానే ఆయనను చూతుము గనుక ఆయనను పోలియుందుమని యెరుగుదుము\"", "The transformative beatific vision: seeing the unvarnished glory of Christ instantly conforms our entire being to His likeness.", "క్రీస్తు ప్రత్యక్షమైనప్పుడు ఆయనను ముఖాముఖిగా చూచి ఆయన మహిమాన్విత స్వరూపమును పొందుదుమను పరమ నిరీక్షణ."],
  ["Ephesians 1:13-14 on being sealed with the Holy Spirit of promise, who is the guarantee (arrabon) of our inheritance until the redemption of the purchased possession", "ఎఫెసీయులకు 1:13-14 వాగ్దానము చేయబడిన పరిశుద్ధాత్మచేత ముద్రింపబడుట; దేవుని సంపాద్యమైన ప్రజలకు విమోచన కలుగువరకు ఆత్మ మన స్వాస్థ్యమునకు సంచకారమై యుండుట", "Ephesians 1:13-14", "\"Having believed, you were sealed with the Holy Spirit of promise, who is the guarantee of our inheritance until the redemption of the purchased possession, to the praise of His glory\"", "\"విశ్వసించి, వాగ్దానము చేయబడిన పరిశుద్ధాత్మచేత ముద్రింపబడితిరి. దేవుని మహిమయొక్క స్తుతికి కారణమగుటకై, ఆయన సంపాదించుకొనిన ప్రజలకు విమోచన కలుగునిమిత్తము ఈ ఆత్మ మన స్వాస్థ్యమునకు సంచకారముగా ఉన్నాడు\"", "The infallible pneumatic pledge: the indwelling Spirit is the unbreakable down-payment of our final cosmic inheritance.", "దేవుని సంపాద్యమైన మన శరీర విమోచనవరకు పరిశుద్ధాత్ముడే మన నిత్య పరలోక స్వాస్థ్యమునకు తిరుగులేని సంచకారముగా ఉన్నాడను నిరీక్షణ."]
];

let src = fs.readFileSync('gen_hope_bank.js', 'utf8');

// 1. Insert foundation20 before line 425
const fMarker = "bibleReference: \"Psalm 147:11\",\n    explanation: \"God takes no delight in mortal military might, but finds His supreme joy in humble people who revere Him and rest their hope in His mercy.\",\n    explanationTelugu: \"గుఱ్ఱముల బలమునందు ఆయన సంతోషింపడు, నరుల కాళ్లయందు ఆయన ఆనందింపడు; యెహోవా తనయందు భయభక్తులు గలవారియందు, తన కృపకొరకు కనిపెట్టువారియందు ఆనందించువాడై యున్నాడు.\"\n  }\n];";

const fReplacement = "bibleReference: \"Psalm 147:11\",\n    explanation: \"God takes no delight in mortal military might, but finds His supreme joy in humble people who revere Him and rest their hope in His mercy.\",\n    explanationTelugu: \"గుఱ్ఱముల బలమునందు ఆయన సంతోషింపడు, నరుల కాళ్లయందు ఆయన ఆనందింపడు; యెహోవా తనయందు భయభక్తులు గలవారియందు, తన కృపకొరకు కనిపెట్టువారియందు ఆనందించువాడై యున్నాడు.\"\n  },\n" +
  foundation20.map(item => "  " + JSON.stringify(item, null, 4).replace(/\n/g, '\n  ')).join(',\n') +
  "\n];";

if (!src.includes(fMarker)) {
  console.error("Could not find fMarker in src!");
  process.exit(1);
}

src = src.replace(fMarker, fReplacement);

// 2. Insert mastery9 before end of data in buildHopeMastery
const mMarker = "[\"Revelation 22:20 the closing cry of Scripture and the church: 'He who testifies to these things says, Surely I am coming quickly. Amen. Even so, come, Lord Jesus!'\", \"ప్రకటన 22:20 బైబిలు గ్రంథపు ఆఖరి వాగ్దానము మరియు సంఘపు నిరీక్షణ ప్రార్థన: 'అవును, నేను త్వరగా వచ్చుచున్నాను. ఆమేన్, ప్రభువైన యేసూ, రమ్ము'\", \"Revelation 22:20\", \"\\\"He who testifies to these things says, 'Surely I am coming quickly.' Amen. Even so, come, Lord Jesus!\\\"\", \"\\\"ఈ సంగతులనుగూర్చి సాక్ష్యమిచ్చువాడు-అవును, త్వరగా వచ్చుచున్నానని సెలవిచ్చుచున్నాడు. ఆమేన్, ప్రభువైన యేసూ, రమ్ము!\\\"\", \"The final beat of the biblical heart: Christ's promise of rapid arrival answered by the expectant longing of the Bride.\", \"బైబిలు గ్రంథపు ఆఖరి శ్వాస: 'త్వరగా వచ్చుచున్నాను' అను రక్షకుని మాటకు 'ప్రభువైన యేసూ, రమ్ము' అను సంఘపు నిరీక్షణ ఆర్తనాదము.\"]\n  ];";

const mReplacement = "[\"Revelation 22:20 the closing cry of Scripture and the church: 'He who testifies to these things says, Surely I am coming quickly. Amen. Even so, come, Lord Jesus!'\", \"ప్రకటన 22:20 బైబిలు గ్రంథపు ఆఖరి వాగ్దానము మరియు సంఘపు నిరీక్షణ ప్రార్థన: 'అవును, నేను త్వరగా వచ్చుచున్నాను. ఆమేన్, ప్రభువైన యేసూ, రమ్ము'\", \"Revelation 22:20\", \"\\\"He who testifies to these things says, 'Surely I am coming quickly.' Amen. Even so, come, Lord Jesus!\\\"\", \"\\\"ఈ సంగతులనుగూర్చి సాక్ష్యమిచ్చువాడు-అవును, త్వరగా వచ్చుచున్నానని సెలవిచ్చుచున్నాడు. ఆమేన్, ప్రభువైన యేసూ, రమ్ము!\\\"\", \"The final beat of the biblical heart: Christ's promise of rapid arrival answered by the expectant longing of the Bride.\", \"బైబిలు గ్రంథపు ఆఖరి శ్వాస: 'త్వరగా వచ్చుచున్నాను' అను రక్షకుని మాటకు 'ప్రభువైన యేసూ, రమ్ము' అను సంఘపు నిరీక్షణ ఆర్తనాదము.\"],\n" +
  mastery9.map(item => "    " + JSON.stringify(item)).join(',\n') +
  "\n  ];";

if (!src.includes(mMarker)) {
  console.error("Could not find mMarker in src!");
  process.exit(1);
}

src = src.replace(mMarker, mReplacement);

fs.writeFileSync('gen_hope_bank.js', src, 'utf8');
console.log('Successfully patched gen_hope_bank.js!');
