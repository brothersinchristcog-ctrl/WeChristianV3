import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

const VERSES: Record<string, {ref: string, text: string}[]> = {
  birthday: [
    {ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.'},
    {ref: 'Psalm 20:4', text: 'May he give you the desire of your heart and make all your plans succeed.'},
    {ref: 'Numbers 6:24-26', text: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.'},
    {ref: 'Psalm 91:11', text: 'For he will command his angels concerning you to guard you in all your ways.'},
    {ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding.'},
    {ref: 'Isaiah 41:10', text: 'Do not fear, for I am with you... I will strengthen you and help you.'},
    {ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.'},
    {ref: 'Psalm 37:4', text: 'Delight yourself in the Lord, and he will give you the desires of your heart.'},
    {ref: 'Romans 15:13', text: 'May the God of hope fill you with all joy and peace as you trust in him.'},
    {ref: 'Joshua 1:9', text: 'Be strong and courageous... for the Lord your God will be with you wherever you go.'},
    {ref: 'Psalm 118:24', text: 'This is the day the Lord has made; let us rejoice and be glad in it.'},
    {ref: '3 John 1:2', text: 'I pray that you may enjoy good health and that all may go well with you.'},
    {ref: 'James 1:17', text: 'Every good and perfect gift is from above.'},
    {ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.'},
    {ref: 'Lamentations 3:22-23', text: 'His mercies are new every morning; great is your faithfulness.'},
    {ref: 'Proverbs 16:3', text: 'Commit to the Lord whatever you do, and he will establish your plans.'},
    {ref: 'Psalm 121:8', text: 'The Lord will watch over your coming and going both now and forevermore.'},
    {ref: 'Isaiah 40:31', text: 'Those who hope in the Lord will renew their strength.'},
    {ref: 'Ephesians 3:20', text: 'Now to him who is able to do immeasurably more than all we ask or imagine.'},
    {ref: 'John 10:10', text: 'I have come that they may have life, and have it abundantly.'},
    {ref: 'Psalm 90:12', text: 'Teach us to number our days, that we may gain a heart of wisdom.'},
    {ref: 'Romans 8:28', text: 'In all things God works for the good of those who love him.'},
    {ref: '2 Corinthians 9:8', text: 'God is able to bless you abundantly.'},
    {ref: 'Psalm 16:11', text: 'You make known to me the path of life.'},
    {ref: 'Deuteronomy 31:8', text: 'The Lord himself goes before you and will be with you.'},
    {ref: 'Colossians 3:15', text: 'Let the peace of Christ rule in your hearts.'},
    {ref: 'Hebrews 13:8', text: 'Jesus Christ is the same yesterday and today and forever.'},
    {ref: '1 Thessalonians 5:16-18', text: 'Rejoice always, pray continually, give thanks in all circumstances.'},
    {ref: 'Psalm 65:11', text: 'You crown the year with your bounty.'},
    {ref: 'Psalm 139:14', text: 'I praise you because I am fearfully and wonderfully made.'},
  ],
  wedding: [
    {ref: 'Genesis 2:24', text: 'Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh.'},
    {ref: 'Ecclesiastes 4:9', text: 'Two are better than one, because they have a good reward for their labor.'},
    {ref: 'Ecclesiastes 4:12', text: 'A cord of three strands is not quickly broken.'},
    {ref: 'Ephesians 4:2-3', text: 'Be completely humble and gentle; be patient, bearing with one another in love.'},
    {ref: 'Ephesians 5:25', text: 'Husbands, love your wives, just as Christ loved the church and gave himself up for her.'},
    {ref: 'Colossians 3:14', text: 'Above all these put on love, which binds everything together in perfect harmony.'},
    {ref: '1 Corinthians 13:4-5', text: 'Love is patient, love is kind... It is not self-seeking or easily angered.'},
    {ref: '1 Corinthians 13:7', text: 'Love always protects, always trusts, always hopes, always perseveres.'},
    {ref: '1 Corinthians 16:14', text: 'Do everything in love.'},
    {ref: 'Romans 12:10', text: 'Be devoted to one another in love. Honor one another above yourselves.'},
    {ref: 'Romans 15:5', text: 'May the God who gives endurance and encouragement give you the same attitude of mind toward each other.'},
    {ref: 'Proverbs 3:3-4', text: 'Let love and faithfulness never leave you.'},
    {ref: 'Proverbs 18:22', text: 'He who finds a wife finds a good thing and obtains favor from the Lord.'},
    {ref: 'Song of Solomon 8:7', text: 'Many waters cannot quench love.'},
    {ref: 'Psalm 128:1', text: 'Blessed are all who fear the Lord, who walk in obedience to him.'},
    {ref: 'Psalm 128:3', text: 'Your wife will be like a fruitful vine within your house.'},
    {ref: 'Psalm 128:4', text: 'Yes, this will be the blessing for the man who fears the Lord.'},
    {ref: 'Joshua 24:15', text: 'As for me and my house, we will serve the Lord.'},
    {ref: 'Philippians 2:2', text: 'Be like-minded, having the same love, being one in spirit and of one mind.'},
    {ref: 'Philippians 1:9', text: 'May your love abound more and more.'},
    {ref: '1 Peter 4:8', text: 'Above all, love each other deeply.'},
    {ref: '1 Peter 3:8', text: 'Be like-minded, be sympathetic, love one another.'},
    {ref: 'Hebrews 13:4', text: 'Marriage should be honored by all.'},
    {ref: 'Matthew 19:6', text: 'What God has joined together, let no one separate.'},
    {ref: 'Mark 10:9', text: 'Therefore what God has joined together, let no one separate.'},
    {ref: 'Ruth 1:16', text: 'Where you go I will go, and where you stay I will stay.'},
    {ref: '1 John 4:19', text: 'We love because he first loved us.'},
    {ref: 'Psalm 37:5', text: 'Commit your way to the Lord; trust in him.'},
    {ref: 'Psalm 33:22', text: 'May your unfailing love be with us, Lord.'},
    {ref: 'Numbers 6:24-26', text: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.'},
  ],
  baptism: [
    {ref: 'Romans 6:4', text: 'We were therefore buried with him through baptism into death in order that, just as Christ was raised from the dead... we too may live a new life.'},
    {ref: '2 Corinthians 5:17', text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!'},
    {ref: 'Galatians 3:27', text: 'For all of you who were baptized into Christ have clothed yourselves with Christ.'},
    {ref: 'Acts 2:38', text: 'Repent and be baptized... in the name of Jesus Christ for the forgiveness of your sins.'},
    {ref: 'Mark 16:16', text: 'Whoever believes and is baptized will be saved.'},
    {ref: 'Colossians 2:12', text: 'Having been buried with him in baptism... you were also raised with him through your faith.'},
    {ref: 'Titus 3:5', text: 'He saved us through the washing of rebirth and renewal by the Holy Spirit.'},
    {ref: '1 Peter 3:21', text: 'Baptism... now saves you by the resurrection of Jesus Christ.'},
    {ref: 'Matthew 28:19', text: 'Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.'},
    {ref: 'John 3:5', text: 'No one can enter the kingdom of God unless they are born of water and the Spirit.'},
    {ref: 'Isaiah 43:1', text: 'Fear not, for I have redeemed you; I have called you by name; you are mine.'},
    {ref: 'Ezekiel 36:26', text: 'I will give you a new heart and put a new spirit in you.'},
    {ref: 'Romans 8:1', text: 'There is now no condemnation for those who are in Christ Jesus.'},
    {ref: 'John 1:12', text: 'To all who received him... he gave the right to become children of God.'},
    {ref: 'Ephesians 2:8', text: 'For it is by grace you have been saved, through faith.'},
    {ref: 'Philippians 1:6', text: 'He who began a good work in you will carry it on to completion.'},
    {ref: 'Psalm 40:2', text: 'He lifted me out of the pit... and set my feet on a rock.'},
    {ref: 'Isaiah 12:2', text: 'Surely God is my salvation; I will trust and not be afraid.'},
    {ref: 'Psalm 119:105', text: 'Your word is a lamp to my feet and a light to my path.'},
    {ref: 'Joshua 1:9', text: 'Be strong and courageous... the Lord your God will be with you wherever you go.'},
    {ref: 'Romans 10:9', text: 'If you declare with your mouth, "Jesus is Lord," and believe in your heart... you will be saved.'},
    {ref: 'John 8:12', text: 'I am the light of the world. Whoever follows me will never walk in darkness.'},
    {ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.'},
    {ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart.'},
    {ref: 'Isaiah 41:10', text: 'Do not fear, for I am with you.'},
    {ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.'},
    {ref: 'Hebrews 12:2', text: 'Fixing our eyes on Jesus, the pioneer and perfecter of faith.'},
    {ref: 'James 1:12', text: 'Blessed is the one who perseveres under trial.'},
    {ref: 'Revelation 21:5', text: 'Behold, I am making all things new.'},
    {ref: 'Numbers 6:24-26', text: 'The Lord bless you and keep you; the Lord make his face shine upon you and be gracious to you; the Lord turn his face toward you and give you peace.'},
  ],
};
const VERSES_TE: Record<string, {ref: string, text: string}[]> = {
  birthday: [
    {ref: 'యిర్మీయా 29:11', text: 'నేను మీ విషయమై ఉద్దేశించిన సంకల్పములను నేనెరుగుదును.'},
    {ref: 'కీర్తనలు 20:4', text: 'నీ హృదయ వాంఛను ఆయన నీకు అనుగ్రహించును.'},
    {ref: 'సంఖ్యాకాండము 6:24-26', text: 'యెహోవా నిన్ను ఆశీర్వదించి నిన్ను కాపాడును.'},
    {ref: 'కీర్తనలు 91:11', text: 'తన దూతలను నీ విషయమై ఆజ్ఞాపించును.'},
    {ref: 'సామెతలు 3:5-6', text: 'నీ పూర్ణ హృదయముతో యెహోవాయందు నమ్మిక ఉంచుము.'},
    {ref: 'యెషయా 41:10', text: 'భయపడకుము, నేను నీతో ఉన్నాను.'},
    {ref: 'ఫిలిప్పీయులకు 4:13', text: 'నన్ను బలపరచువానియందు నేను సమస్తమును చేయగలను.'},
    {ref: 'కీర్తనలు 37:4', text: 'యెహోవానందు ఆనందించుము.'},
    {ref: 'రోమీయులకు 15:13', text: 'సమాధానమును, సంతోషమును మీకు కలుగజేయును.'},
    {ref: 'యెహోషువ 1:9', text: 'ధైర్యముగా ఉండుము.'},
    {ref: 'కీర్తనలు 118:24', text: 'ఈ దినమును యెహోవా ఏర్పరచెను.'},
    {ref: '3 యోహాను 1:2', text: 'నీవు క్షేమముగా ఉండాలని ప్రార్థిస్తున్నాను.'},
    {ref: 'యాకోబు 1:17', text: 'ప్రతి మంచి వరము దేవుని నుండియే వచ్చును.'},
    {ref: 'కీర్తనలు 23:1', text: 'యెహోవా నా కాపరి.'},
    {ref: 'విలాపవాక్యములు 3:22-23', text: 'ఆయన కనికరములు ప్రతి ఉదయం క్రొత్తవి.'},
    {ref: 'సామెతలు 16:3', text: 'నీ కార్యములను యెహోవాకు అప్పగించుము.'},
    {ref: 'కీర్తనలు 121:8', text: 'యెహోవా నీ రాకపోకలను కాపాడును.'},
    {ref: 'యెషయా 40:31', text: 'యెహోవాకై కనిపెట్టువారు నూతన బలము పొందుదురు.'},
    {ref: 'ఎఫెసీయులకు 3:20', text: 'మనము అడిగిన దానికంటె అధికముగా చేయగలవాడు.'},
    {ref: 'యోహాను 10:10', text: 'సమృద్ధిగల జీవము కలుగుటకై వచ్చాను.'},
    {ref: 'కీర్తనలు 90:12', text: 'మా దినములను లెక్కించుట నేర్పుము.'},
    {ref: 'రోమీయులకు 8:28', text: 'దేవుని ప్రేమించువారికి సమస్తము మేలు కలుగును.'},
    {ref: '2 కొరింథీయులకు 9:8', text: 'దేవుడు సమస్త కృపను విస్తారముగా అనుగ్రహించును.'},
    {ref: 'కీర్తనలు 16:11', text: 'జీవ మార్గమును నాకు తెలియజేయుదువు.'},
    {ref: 'ద్వితీయోపదేశకాండము 31:8', text: 'యెహోవా నీకు ముందుగా నడుచును.'},
    {ref: 'కొలస్సయులకు 3:15', text: 'క్రీస్తు సమాధానము మీ హృదయములను ఏలుగాక.'},
    {ref: 'హెబ్రీయులకు 13:8', text: 'యేసుక్రీస్తు నిన్న, నేడు, నిరంతరము ఒకే విధంగా ఉన్నాడు.'},
    {ref: '1 థెస్సలొనీకయులకు 5:16-18', text: 'ఎల్లప్పుడూ సంతోషించుడి.'},
    {ref: 'కీర్తనలు 65:11', text: 'నీవు సంవత్సరమును నీ మేలుతో కిరీటముగా ధరింపజేయుచున్నావు.'},
    {ref: 'కీర్తనలు 139:14', text: 'నేను ఆశ్చర్యకరముగా నిర్మింపబడితిని.'},
  ],
  wedding: [
    {ref: 'ఆదికాండము 2:24', text: 'మనుష్యుడు తన తండ్రిని తన తల్లిని విడిచి తన భార్యను హత్తుకొనును; వారు ఒక శరీరముగా ఉండుదురు.'},
    {ref: 'ప్రసంగి 4:9', text: 'ఒంటరివానికంటె ఇద్దరు మేలు; వారి శ్రమకు మంచి ప్రతిఫలము కలుగును.'},
    {ref: 'ప్రసంగి 4:12', text: 'మూడుపేటల తాడు త్వరగా తెగిపోదు.'},
    {ref: 'ఎఫెసీయులకు 4:2-3', text: 'పూర్ణమైన వినయముతోను సాత్వికముతోను దీర్ఘశాంతముతోను ప్రేమచేత ఒకరినొకరు సహించుచు సమాధాన బంధముచేత ఆత్మ యొక్క ఐక్యతను కాపాడుడి.'},
    {ref: 'ఎఫెసీయులకు 5:25', text: 'భర్తలారా, క్రీస్తు సంఘమును ప్రేమించినట్లు మీ భార్యలను ప్రేమించుడి.'},
    {ref: 'కొలస్సయులకు 3:14', text: 'వీటన్నిటి మీద ప్రేమను ధరించుకొనుడి; అది పరిపూర్ణతకు బంధము.'},
    {ref: '1 కొరింథీయులకు 13:4-5', text: 'ప్రేమ దీర్ఘశాంతము కలది, దయాళువు; అసూయపడదు, అతిశయపడదు, గర్వపడదు.'},
    {ref: '1 కొరింథీయులకు 13:7', text: 'ప్రేమ అన్నిటిని సహించును, అన్నిటిని నమ్మును, అన్నిటిని నిరీక్షించును, అన్నిటిని ఓర్చుకొనును.'},
    {ref: '1 కొరింథీయులకు 16:14', text: 'మీరు చేయు ప్రతి కార్యము ప్రేమతో జరగునుగాక.'},
    {ref: 'రోమీయులకు 12:10', text: 'సహోదర ప్రేమయందు ఒకరినొకరు ప్రేమించుకొనుడి.'},
    {ref: 'రోమీయులకు 15:5', text: 'సహనమును ఆదరణను అనుగ్రహించు దేవుడు మీకు ఏకమనస్సును దయచేయును గాక.'},
    {ref: 'సామెతలు 3:3-4', text: 'కృపయు సత్యమును నిన్ను విడువకుండునట్లు చూచుకొనుము.'},
    {ref: 'సామెతలు 18:22', text: 'భార్యను పొందువాడు మేలును పొందును; యెహోవా అనుగ్రహమును పొందును.'},
    {ref: 'పరమగీతము 8:7', text: 'అనేక జలములు ప్రేమను ఆర్పలేవు.'},
    {ref: 'కీర్తనలు 128:1', text: 'యెహోవాయందు భయభక్తులు కలిగినవాడు ధన్యుడు.'},
    {ref: 'కీర్తనలు 128:3', text: 'నీ భార్య నీ ఇంటిలో ఫలించు ద్రాక్షావల్లివలె ఉండును.'},
    {ref: 'కీర్తనలు 128:4', text: 'యెహోవాయందు భయపడువాడు ఈలాగు ఆశీర్వదింపబడును.'},
    {ref: 'యెహోషువ 24:15', text: 'నేను నా ఇంటివారము యెహోవాను సేవింతుము.'},
    {ref: 'ఫిలిప్పీయులకు 2:2', text: 'ఒకే ప్రేమగలవారై, ఒకే మనస్సుతో ఉండుడి.'},
    {ref: 'ఫిలిప్పీయులకు 1:9', text: 'మీ ప్రేమ మరింత అధికముగా వర్ధిల్లునుగాక.'},
    {ref: '1 పేతురు 4:8', text: 'అన్నిటికంటె ముఖ్యముగా ఒకరినొకరు గాఢముగా ప్రేమించుకొనుడి.'},
    {ref: '1 పేతురు 3:8', text: 'ఒక మనస్సుగలవారై, ప్రేమగలవారై ఉండుడి.'},
    {ref: 'హెబ్రీయులకు 13:4', text: 'వివాహము అందరిలో ఘనమైనదై యుండవలెను.'},
    {ref: 'మత్తయి 19:6', text: 'దేవుడు జతపరచినదాన్ని మనుష్యుడు వేరు చేయకూడదు.'},
    {ref: 'మార్కు 10:9', text: 'దేవుడు కలిపినదాన్ని మనుష్యుడు వేరు చేయకూడదు.'},
    {ref: 'రూతు 1:16', text: 'నీవు వెళ్లినచోట నేను వెళ్లెదను.'},
    {ref: '1 యోహాను 4:19', text: 'ఆయన మొదట మనలను ప్రేమించెను గనుక మనము ప్రేమించుచున్నాము.'},
    {ref: 'కీర్తనలు 37:5', text: 'నీ మార్గమును యెహోవాకు అప్పగించుము.'},
    {ref: 'కీర్తనలు 33:22', text: 'యెహోవా, నీ కృప మామీద ఉండునుగాక.'},
    {ref: 'సంఖ్యాకాండము 6:24-26', text: 'యెహోవా నిన్ను ఆశీర్వదించి నిన్ను కాపాడును.'},
  ],
  baptism: [
    {ref: 'రోమీయులకు 6:4', text: 'క్రీస్తు లేపబడినట్లే మనమును నూతన జీవితములో నడుచుకొనవలెను.'},
    {ref: '2 కొరింథీయులకు 5:17', text: 'ఎవడైనను క్రీస్తునందు ఉన్నయెడల అతడు నూతన సృష్టి.'},
    {ref: 'గలతీయులకు 3:27', text: 'క్రీస్తునందు బాప్తిస్మము పొందిన మీరందరు క్రీస్తును ధరించుకొనియున్నారు.'},
    {ref: 'అపొస్తలుల కార్యములు 2:38', text: 'మనస్సు మార్పు పొంది బాప్తిస్మము పొందుడి.'},
    {ref: 'మార్కు 16:16', text: 'నమ్మి బాప్తిస్మము పొందినవాడు రక్షింపబడును.'},
    {ref: 'కొలస్సయులకు 2:12', text: 'బాప్తిస్మములో ఆయనతో సమాధి చేయబడి ఆయనతో కూడ లేపబడితిరి.'},
    {ref: 'తీతుకు 3:5', text: 'పునర్జన్మస్నానము ద్వారా మనలను రక్షించెను.'},
    {ref: '1 పేతురు 3:21', text: 'బాప్తిస్మము ఇప్పుడు మిమ్మును రక్షించుచున్నది.'},
    {ref: 'మత్తయి 28:19', text: 'తండ్రి, కుమారుడు, పరిశుద్ధాత్మ నామమున బాప్తిస్మము ఇచ్చుడి.'},
    {ref: 'యోహాను 3:5', text: 'నీరు మరియు ఆత్మ ద్వారా జన్మించనిదే దేవుని రాజ్యములో ప్రవేశింపలేడు.'},
    {ref: 'యెషయా 43:1', text: 'నేను నిన్ను పేరుపెట్టి పిలిచితిని; నీవు నావాడవు.'},
    {ref: 'యెహెజ్కేలు 36:26', text: 'నేను మీకు క్రొత్త హృదయమును ఇచ్చెదను.'},
    {ref: 'రోమీయులకు 8:1', text: 'క్రీస్తు యేసునందున్నవారికి శిక్షావిధి లేదు.'},
    {ref: 'యోహాను 1:12', text: 'ఆయనను స్వీకరించినవారికి దేవుని పిల్లలగు అధికారము ఇచ్చెను.'},
    {ref: 'ఎఫెసీయులకు 2:8', text: 'కృపచేత విశ్వాసము ద్వారా మీరు రక్షింపబడితిరి.'},
    {ref: 'ఫిలిప్పీయులకు 1:6', text: 'మీలో మంచి కార్యము ప్రారంభించినవాడు దానిని సంపూర్ణము చేయును.'},
    {ref: 'కీర్తనలు 40:2', text: 'ఆయన నా పాదములను బండమీద నిలిపెను.'},
    {ref: 'యెషయా 12:2', text: 'దేవుడే నా రక్షణ.'},
    {ref: 'కీర్తనలు 119:105', text: 'నీ వాక్యము నా పాదములకు దీపము.'},
    {ref: 'యెహోషువ 1:9', text: 'ధైర్యముగా ఉండుము; భయపడకుము.'},
    {ref: 'రోమీయులకు 10:9', text: 'యేసును ప్రభువని ఒప్పుకొని విశ్వసించినయెడల రక్షింపబడుదువు.'},
    {ref: 'యోహాను 8:12', text: 'నేనే లోకమునకు వెలుగు.'},
    {ref: 'కీర్తనలు 23:1', text: 'యెహోవా నా కాపరి.'},
    {ref: 'సామెతలు 3:5-6', text: 'యెహోవాయందు నమ్మిక ఉంచుము.'},
    {ref: 'యెషయా 41:10', text: 'భయపడకుము, నేను నీతో ఉన్నాను.'},
    {ref: 'ఫిలిప్పీయులకు 4:13', text: 'నన్ను బలపరచువానియందు నేను సమస్తమును చేయగలను.'},
    {ref: 'హెబ్రీయులకు 12:2', text: 'యేసునందే మన దృష్టిని నిలుపుదము.'},
    {ref: 'యాకోబు 1:12', text: 'శోధనను సహించినవాడు ధన్యుడు.'},
    {ref: 'ప్రకటన గ్రంథము 21:5', text: 'ఇదిగో, సమస్తమును నూతనముగా చేయుచున్నాను.'},
    {ref: 'సంఖ్యాకాండము 6:24-26', text: 'యెహోవా నిన్ను ఆశీర్వదించి నిన్ను కాపాడును.'},
  ],
};

export default function AdminCelebrationsVersePicker({ category, selectedVerseRef, onBack, onSelectVerse }: { category: string, selectedVerseRef?: string, onBack: () => void, onSelectVerse: (verse: {ref: string, text: string}) => void }) {
  const [language, setLanguage] = React.useState<'en' | 'te'>('en');
  let normalizedCategory = 'birthday';
  if (category.toLowerCase().includes('wedding') || category.toLowerCase().includes('anniversary')) normalizedCategory = 'wedding';
  if (category.toLowerCase().includes('baptism')) normalizedCategory = 'baptism';
  
  const verses = (language === 'te' ? VERSES_TE[normalizedCategory] : VERSES[normalizedCategory]) || (language === 'te' ? VERSES_TE.birthday : VERSES.birthday);
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft stroke="#162057" width={20} height={20} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerSubtitle}>Prepare Wish</Text>
          <Text style={styles.headerTitle}>Bible Verse</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.langToggle}>
        <TouchableOpacity 
          style={[styles.langBtn, language === 'en' && styles.langBtnActive]} 
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langTxt, language === 'en' && styles.langTxtActive]}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.langBtn, language === 'te' && styles.langBtnActive]} 
          onPress={() => setLanguage('te')}
        >
          <Text style={[styles.langTxt, language === 'te' && styles.langTxtActive, { fontFamily: undefined }]}>తెలుగు (Telugu)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>SELECT BIBLE VERSE</Text>
        <Text style={styles.subtext}>Suggested for {categoryLabel.toLowerCase()}</Text>

        <View style={styles.list}>
          {verses.map(v => {
            const isSelected = selectedVerseRef === v.ref;
            return (
              <TouchableOpacity 
                key={v.ref} 
                style={[styles.verseCard, isSelected && styles.verseCardSelected]}
                onPress={() => onSelectVerse(v)}
              >
                <Text style={[styles.verseText, language === 'te' && { fontFamily: undefined }]}>"{v.text}"</Text>
                <Text style={[styles.verseRef, language === 'te' && { fontFamily: undefined }]}>{v.ref}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FAF8F2',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2A63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitles: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#BE9A3A',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 20,
    color: '#162057',
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#EBE7DF',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  langTxt: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  langTxtActive: {
    color: '#162057',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#64748B',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#F5C242',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1E2A63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verseCardSelected: {
    borderLeftColor: '#162057',
    backgroundColor: '#EBE7DF',
  },
  verseText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 12,
  },
  verseRef: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#162057',
    letterSpacing: 0.3,
  },
});
