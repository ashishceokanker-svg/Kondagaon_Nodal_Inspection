import json, re

with open('f:/Website/Nodel/scripts/extracted_schools.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

# Official Hindi Panchayats per block from constants.js
BLOCK_PANCHAYATS_HI = {
  'बड़ेराजपुर': ['बाँसकोट', 'तितरवण्ड', 'बड़बत्तर', 'ढोढरा', 'रामपुर', 'बस्तरबुड्रा', 'पिटेचुवा', 'खरगांव', 'जिरीपारा', 'बैजनपुरी', 'खलारी', 'कोसमी', 'हात्मा', 'कोरहोबेड़ा', 'कोरगांव', 'टेंवसा', 'कलगांव', 'कोंगेरा', 'सोनपुर', 'पेण्ड्रावन', 'होनावण्डी', 'बाड़ागांव', 'काँदेकरा', 'मचली', 'पारोण्ड', 'खजरावण्ड', 'आमगांव', 'बड़ेराजपुर', 'छोटेराजपुर', 'माड़ोकी खरगांव', 'कोपरा', 'छिन्दली', 'धामनपुरी', 'किबड़ा', 'बालेंगा', 'लिहागांव', 'पलना', 'चिचाड़ी', 'सालना', 'मारंगपुरी', 'केरागांव', 'हरवेल', 'पीढ़ापाल', 'नौकाबेड़ा', 'जोड़ेकेरा', 'गम्हरी', "विश्रामपुरी 'अ'", "विश्रामपुरी 'ब'", 'बीरापारा', 'विश्रामपुरी A', 'विश्रामपुरी B', 'बांसकोट', 'कोसामी', 'पेण्ड्रावण्ड', 'मांदोकी खरगांव'],
  'केशकाल': ['खालेमुरवेण्ड', 'तोषकापाल', 'सिवनीपाल', 'धनोरा', 'कोहकामेटा', 'प्रधानचेर्रा', 'बदवर', 'डुण्डाबेड़मा', 'सिंगनपुर', 'कुंए', 'नवागढ़', 'एटेकोन्हाडी', 'गौरगांव', 'गारावण्डी', 'हिचका', 'सालेभाट', 'ढोढेरापाल', 'चिपरेल', 'होनहेड़', 'उमरादाह', 'माड़गांव', 'रावबेड़ा', 'बटराली', 'गढ़धनोरा', 'जामगांव', 'कोदोभाट', 'सिदावण्ड', 'गुड़ीपारा', 'अड़ेंगा', 'डोहलापारा', 'बाण्डापारा', 'ठाकुरपारा', 'निराछिन्दली', 'उन्दरी', 'गुलबापारा', 'गारका', 'बंधापारा', 'टाटीरास', 'आंवरी', 'कोरकोटी', 'करमरी', 'बड़ेखौली', 'पड़डे', 'तोड़ासी', 'ईरागांव', 'चुरेगांव', 'कानागांव', 'कलेपाल', 'बिन्झे', 'कर्रारमेटा', 'भाटगांव', 'सवाला', 'बनियागांव', 'सिलाटी', 'अरण्डी', 'तेन्दूभाटा', 'डुमरपदर', 'बेड़मा', 'सिकागांव', 'पीपरा', 'बड़ेठेमली', 'आंवराभाटा', 'खुटपदर', 'बहीगांव', 'मस्सूकोकोड़ा', 'खेतरपाल', 'चारभाटा', 'पलोरा', 'नयानार', 'कुये', 'खलेमुरवेंड', 'डोंडरपाल', 'बांदे', 'कुयेगांव'],
  'कोण्डागांव': ['खड़का', 'बेतबेड़ा', 'बादालूर', 'खण्डाम', 'पलारी', 'नवागांव', 'पुसपाल', 'गोलावण्ड', 'नरिहा', 'मयूरडोंगर', 'माकड़ी', 'चेरंग', 'बफना', 'छोटेउसरी', 'मसोरा', 'भोगाड़ी', 'चिलपुटी', 'डोंगरीगुड़ा', 'लेमड़ी', 'चिखलपुटी', 'हथकली', 'धनपुर', 'तोतर', 'पोलंग', 'रेंगागोंदी', 'केजंग', 'मूंगवाल', 'पेरमापाल', 'बयानार', 'जोगीआलवाड़', 'टेमरूगांव', 'चिमड़ी', 'चलका', 'चौड़ंग', 'पाला', 'कोंगेरा', 'किबाईबालेंगा', 'मालाकोट', 'बुड़ाकसा', 'बनजुगानी', 'बांसगांव', 'मड़ागांव', 'तोड़म', 'चिचडोंगरी', 'बुनागांव', 'उमरगांव अ', 'बनसिरसी', 'भीरागांव ब', 'कुम्हारपारा', 'गिरोला', 'सातगांव', 'पल्ली', 'सितली', 'नेवता', 'मुलमुला', 'फूकागिरोला', 'बड़ेसिलाटी', 'सिंघनपुर', 'भीरागांव अ', 'मालगांव', 'कुम्हारी', 'निलजी', 'चिपावण्ड', 'उमरगांव ब', 'कुलझर', 'भगदेवा', 'बड़ेभिरवण्ड', 'छोटेभिरवण्ड', 'बोलबोला', 'छोटेबंजोड़ा', 'बड़ेबेन्दरी', 'बड़ेकनेरा', 'कमेला', 'कुकाड़गारकापाल', 'बाखरा', 'करंजी', 'कोकोड़ी', 'बनियागांव', 'दहीकोंगा', 'राजागांव', 'सुकूरपाल', 'जोबा', 'घोड़ागांव', 'बनउसरी', 'मोहलई', 'मुनगापदर', 'करनपुर', 'खचगांव', 'बोटीकनेरा', 'बड़ेबेजोड़ा', 'पुसावण्ड', 'सोनाबाल', 'मड़ानार', 'सम्बलपुर', 'बम्हनी', 'कारसिंग', 'कुसमा', 'कचोरा', 'इसलनार', 'चमई', 'हंगवा', 'आदनार', 'चेमा', 'बोरगांव', 'झारा', 'कांगा', 'मर्दापाल', 'चांगेर', 'मूलनार', 'नाहकानार', 'लखापुरी', 'हड़ेली', 'कड़ेनार', 'बेचा', 'रानापाल', 'बड़ेकुरुषनार', 'जोड़ेगा', 'खड़पड़ी', 'कोरमेल', 'हसलनार', 'मटवाल', 'पदनार', 'टेकापाल', 'कुधुर', 'तुमड़ीवाल', 'नगरी', 'उमरगांव-अ', 'उमरगांव-ब', 'भीरागांव-अ', 'भीरागांव-ब', 'बड़े बेन्दरी', 'बडे कनेरा', 'बडे कुरुषनार'],
  'माकड़ी': ['बड़ेघोड़सोड़ा', 'मांझीबोरण्ड', 'बड़ेसोंहगा', 'माकड़ी', 'गारे', 'बवई', 'मिरमिंडा', 'तमरावण्ड', 'तरईबेड़ा', 'उदेंगा', 'छतोड़ी', 'सोनाबेड़ा', 'छोटेसलना', 'करमरी', 'उलेरा', 'ओण्डारगांव', 'कोसाहरदूली', 'बागबेड़ा', 'कोकोड़ी', 'गुहाबोरण्ड', 'पुसापाल', 'मगेदा', 'ओटेण्डा', 'पीढ़ापाल', 'जरण्डी', 'लुभा', 'ठेमगांव', 'रांधना', 'बरकई', 'भीरागांव', 'बालोण्ड', 'काटागांव', 'ओण्डरी', 'सोड़िसिवनी', 'लभा', 'बुडरा', 'हांडीगांव', 'धारली', 'उड़िदगांव', 'कुरलूबहार', 'इंगरा', 'हीरापुर', 'हीरावण्डी', 'तौरेंगा', 'बेलोण्डी', 'तोरण्डी', 'राकसबेड़ा', 'सोड़मा', 'उमरगांव', 'बेलगांव', 'कावरा', 'मारागांव', 'हुक्काबेड़ापाथरी', 'बिवला', 'बाडरा', 'केरावाही', 'शामपुर', 'करण्डी', 'देवगांव', 'एरला', 'अनतपुर', 'बीजापुर', 'अमरावती', 'बेलगांव (अ)', 'देउरबाल', 'बिंजोली', 'छिनारी'],
  'फरसगांव': ['फुण्डर', 'मोहलई', 'बाड़ागांव', 'बनचपई', 'लंजोड़ा', 'भानपुरी', 'कोसागांव', 'झाकरी', 'बड़ेओड़ागांव', 'बड़गई', 'पावड़ा', 'मोदेबेड़मा', 'जैतपुरी', 'बोरगांव', 'सोड़मा', 'बंजोड़ा', 'मोहपाल', 'बंगोली', 'बड़ेडोंगर', 'चनियागांव', 'देवगांव', 'जामगांव', 'छिन्दलीबेड़ा', 'गवाड़ी', 'बोकराबेड़ा', 'हाटचपई', 'कोकोड़ाजुगानार', 'परोदा', 'मांझीआंठगांव', 'चिचाड़ी', 'बानगांव', 'गटटीपलना', 'पतोड़ा', 'कोराड़बड़गांव', 'भण्डारवण्डी', 'आलोर', 'झाटीबन', 'मोदे', 'कन्हारगांव', 'कोनगुड़', 'उरन्दाबेड़ा', 'आमगांव', 'शंकरपुर', 'फूफगांव', 'बोरगांव (पूर्वी)', 'पाण्डेआठगांव', 'चांदागांव', 'सिंगारपुरी', 'चुरेगांव', 'हिरी', 'भूमका', 'गोड़मा', 'कोरई', 'तोरण्ड', 'कोटपाड़', 'खण्डसरा', 'मांदागांव', 'भोंगापाल', 'चांदाबेड़ा', 'छिंदली', 'जुगानीकलार', 'कुल्हाड़गांव', 'भण्डारसिवनी', 'चरकई', 'सिरपुर', 'कुम्हारबड़गांव', 'पलना', 'चिंगनार', 'कसई फरसगांव', 'मैनपुर', 'मोड़ेगा', 'सिरसीकलार', 'कबोंगा', 'झांकरी', 'बोकरबेड़ा', 'चंदाबेड़ा', 'फूफागांव', 'पांडेआठगांव', 'बोरगांव पूर्वी', 'मांझीआटगांव']
}

PANCHAYAT_MAP = {
    'khargaon': 'खरगांव', 'baderajpur': 'बड़ेराजपुर', 'chichadi': 'चिचाड़ी', 'banskot': 'बाँसकोट',
    'salna': 'सालना', 'palna': 'पलना', 'vishrampuria': "विश्रामपुरी 'अ'", 'vishrampurib': "विश्रामपुरी 'ब'",
    'pendrawand': 'पेण्ड्रावन', 'kongera': 'कोंगेरा', 'mandokikhargaon': 'माड़ोकी खरगांव', 'machali': 'मचली',
    'bastarbudra': 'बस्तरबुड्रा', 'kalgaon': 'कलगांव', 'korgaon': 'कोरगांव', 'harwel': 'हरवेल',
    'titrawand': 'तितरवण्ड', 'gamhri': 'गम्हरी', 'dondra': 'ढोढरा', 'dhamanpuri': 'धामनपुरी',
    'marangpuri': 'मारंगपुरी', 'chhoterajpur': 'छोटेराजपुर', 'badagaon': 'बाड़ागांव', 'parond': 'पारोण्ड',
    'badbattar': 'बड़बत्तर', 'korhobeda': 'कोरहोबेड़ा', 'balenga': 'बालेंगा', 'kosami': 'कोसमी',
    'tenwsa': 'टेंवसा', 'khalari': 'खलारी', 'khajrawand': 'खजरावण्ड', 'honawandi': 'होनावण्डी',
    'sonpur': 'सोनपुर', 'naukabeda': 'नौकाबेड़ा', 'birapara': 'बीरापारा', 'tatipara': 'टाटीपारा',
    'lihagaon': 'लिहागांव', 'jodekera': 'जोड़ेकेरा', 'baijanpuri': 'बैजनपुरी', 'chhindli': 'छिन्दली',
    'pidapal': 'पीढ़ापाल', 'kopra': 'कोपरा', 'kibda': 'किबड़ा', 'jirapara': 'जिरीपारा',
    'kaundkera': 'कौदोकेरा', 'hatma': 'हात्मा', 'boirpara': 'बोईरपारा', 'gut tAdihi': 'गुट्टाडीही',
    'patripara': 'पत्रीपारा', 'kodapara': 'कोड़ापारा', 'bharrapara': 'भर्रापारा', 'nayaparakhlari': 'नयापारा खलारी',
    'murkhedapara': 'मुरखेड़ापारा', 'ravanaguda': 'रावणगुड़ा', 'badeparakongera': 'बड़ेपारा कोंगेरा',
    'dantapara': 'दांतापारा', 'halda': 'हलदा', 'aamganon': 'आमगांव', 'aamgaon': 'आमगांव',
    'pitechua': 'पिटेचुवा', 'nayanar': 'नयानार', 'garhdhanora': 'गढ़धनोरा', 'kuye': 'कुंए',
    'dhanora': 'धनोरा', 'bahigaon': 'बहीगांव', 'korkoti': 'कोरकोटी', 'todasi': 'तोड़ासी',
    'hichka': 'हिचका', 'madgaon': 'माड़गांव', 'kanagaon': 'कानागांव', 'kalepal': 'कलेपाल',
    'atekonhadi': 'एटेकोन्हाडी', 'padde': 'पड़डे', 'eragaon': 'ईरागांव', 'tendubhata': 'तेन्दूभाटा',
    'kodobhat': 'कोदोभाट', 'gudripara': 'गुड़ीपारा', 'undari': 'उन्दरी', 'palora': 'पलोरा',
    'badwar': 'बदवर', 'garawandi': 'गारावण्डी', 'badekhauli': 'बड़ेखौली', 'nirachhindli': 'निराछिन्दली',
    'sikagaon': 'सिकागांव', 'anwarabhata': 'आंवराभाटा', 'pipra': 'पीपरा', 'khalemurwend': 'खालेमुरवेण्ड',
    'chiprel': 'चिपरेल', 'umaradah': 'उमरादाह', 'bandhapara': 'बंधापारा', 'masukokoda': 'मस्सूकोकोड़ा',
    'binjhe': 'बिन्झे', 'karmari': 'करमरी', 'honhed': 'होनहेड़', 'salebhat': 'सालेभाट',
    'charbhata': 'चारभाटा', 'adenga': 'अड़ेंगा', 'garka': 'गारका', 'aawari': 'आंवरी',
    'silati': 'सिलाटी', 'sawala': 'सवाला', 'arandi': 'अरण्डी', 'singanpur': 'सिंगनपुर',
    'bedma': 'बेड़मा', 'donderapal': 'डोंडरपाल', 'batrali': 'बटराली', 'toskapal': 'तोषकापाल',
    'jamgaon': 'जामगांव', 'kohkameta': 'कोहकामेटा', 'dohlapara': 'डोहलापारा', 'khetarpal': 'खेतरपाल',
    'pradhancherra': 'प्रधानचेर्रा', 'tatiras': 'टाटीरास', 'gulbapara': 'गुलबापारा', 'badedhemli': 'बड़ेठेमली',
    'dundabedma': 'डुण्डाबेड़मा', 'sivanipal': 'सिवनीपाल', 'churbhata': 'चारभाटा', 'gourgaon': 'गौरगांव',
    'sidhawand': 'सिदावण्ड', 'khutpadar': 'खुटपदर', 'churegaon': 'चुरेगांव', 'raobeda': 'रावबेड़ा',
    'bhatgaon': 'भाटगांव', 'baniyagaon': 'बनियागांव', 'sambalpur': 'सम्बलपुर', 'hangwa': 'हंगवा',
    'banjugani': 'बनजुगानी', 'mayurdongar': 'मयूरडोंगर', 'dahikonga': 'दहीकोंगा', 'bafana': 'बफना',
    'nevta': 'नेवता', 'masora': 'मसोरा', 'mulmula': 'मुलमुला', 'badekanera': 'बड़ेकनेरा',
    'bayanar': 'बयानार', 'bunagaon': 'बुनागांव', 'kudhur': 'कुधुर', 'mungapadar': 'मुनगापदर',
    'chhotebanjoda': 'छोटेबंजोड़ा', 'permapal': 'पेरमापाल', 'chilputi': 'चिलपुटी', 'umargaonb': 'उमरगांव ब',
    'umargaona': 'उमरगांव अ', 'ghodagaon': 'घोड़ागांव', 'chipawand': 'चिपावण्ड', 'sonabal': 'सोनाबाल',
    'bansgaon': 'बांसगांव', 'dongariguda': 'डोंगरीगुड़ा', 'chikhalputi': 'चिखलपुटी', 'puspal': 'पुसपाल',
    'malgaon': 'मालगांव', 'hathkali': 'हथकली', 'malakot': 'मालाकोट', 'badebendari': 'बड़ेबेन्दरी',
    'rajgaon': 'राजागांव', 'kejang': 'केजंग', 'bhiragaona': 'भीरागांव अ', 'bhiragaonb': 'भीरागांव ब',
    'palari': 'पलारी', 'becha': 'बेचा', 'palli': 'पल्ली', 'mardapal': 'मर्दापाल',
    'mohlai': 'मोहलई', 'borgaon': 'बोरगांव', 'kanga': 'कांगा', 'totar': 'तोतर',
    'mungwal': 'मूंगवाल', 'nilji': 'निलजी', 'temarugaon': 'टेमरूगांव', 'matwal': 'मटवाल',
    'ranapal': 'रानापाल', 'changer': 'चांगेर', 'chhateusari': 'छोटेउसरी', 'golawand': 'गोलावण्ड',
    'karanpur': 'करनपुर', 'betbeda': 'बेतबेड़ा', 'polang': 'पोलंग', 'kamela': 'कमेला',
    'kibaibalenga': 'किबाईबालेंगा', 'kumharpara': 'कुम्हारपारा', 'makdi': 'माकड़ी', 'kachora': 'कचोरा',
    'hadeli': 'हड़ेली', 'isalanar': 'इसलनार', 'choudang': 'चौड़ंग', 'khachgaon': 'खचगांव',
    'bhagdewa': 'भगदेवा', 'chichdongari': 'चिचडोंगरी', 'tekapal': 'टेकापाल', 'hasalnar': 'हसलनार',
    'kadentar': 'कड़ेनार', 'badekurusnar': 'बड़ेकुरुषनार', 'jodega': 'जोड़ेगा', 'khadpadi': 'खड़पड़ी',
    'kormel': 'कोरमेल', 'padnaar': 'पदनार', 'tumdiwal': 'तुमड़ीवाल', 'nagari': 'नगरी',
    'badesilati': 'बड़ेसिलाटी', 'badebhirawand': 'बड़ेभिरवण्ड', 'chhotebhirawand': 'छोटेभिरवण्ड',
    'bolbola': 'बोलबोला', 'kukadgarkapal': 'कुकाड़गारकापाल', 'bakhra': 'बाखरा', 'karanji': 'करंजी',
    'kokodi': 'कोकोड़ी', 'sukurpal': 'सुकूरपाल', 'joba': 'जोबा', 'banusari': 'बनउसरी',
    'botikenera': 'बोटीकनेरा', 'badebejoda': 'बड़ेबेजोड़ा', 'pusawand': 'पुसावण्ड', 'madanar': 'मड़ानार',
    'bamhani': 'बम्हनी', 'karsing': 'कारसिंग', 'kusma': 'कुसमा', 'chamai': 'चमई',
    'adnar': 'आदनार', 'chema': 'चेमा', 'jhara': 'झारा', 'mulnaar': 'मूलनार',
    'nahkanaar': 'नाहकानार', 'lakhapuri': 'लखापुरी', 'phukagirola': 'फूकागिरोला',
    'sonabeda': 'सोनाबेड़ा', 'karandi': 'करण्डी', 'labha': 'लभा', 'badesohanga': 'बड़ेसोंहगा',
    'koshaharduli': 'कोसाहरदूली', 'chhatodi': 'छतोड़ी', 'sodsivani': 'सोड़िसिवनी', 'sampur': 'शामपुर',
    'babai': 'बवई', 'ingra': 'इंगरा', 'katagaon': 'काटागांव', 'uridgaon': 'उड़िदगांव',
    'pusapal': 'पुसापाल', 'hukkabedapathri': 'हुक्काबेड़ापाथरी', 'torenga': 'तौरेंगा', 'otenda': 'ओटेण्डा',
    'lubha': 'लुभा', 'kerawahi': 'केरावाही', 'taraibeda': 'तरईबेड़ा', 'hirapur': 'हीरापुर',
    'anatpur': 'अनतपुर', 'temgaon': 'ठेमगांव', 'maragaon': 'मारागांव', 'jarandi': 'जरण्डी',
    'kurlubahar': 'कुरलूबहार', 'udendga': 'उदेंगा', 'arla': 'अमरावती', 'badegodsoda': 'बड़ेघोड़सोड़ा',
    'tamrawand': 'तमरावण्ड', 'randna': 'रांधना', 'budra': 'बुडरा', 'ondri': 'ओण्डरी',
    'mirminda': 'मिरमिंडा', 'binjoli': 'बिंजोली', 'rakasbeda': 'राकसबेड़ा', 'balond': 'बालोण्ड',
    'guhaborand': 'गुहाबोरण्ड', 'bagbeda': 'बागबेड़ा', 'mageda': 'मगेदा', 'belondi': 'बेलोण्डी',
    'torandi': 'तोरण्डी', 'belgaon': 'बेलगांव', 'kavra': 'कावरा', 'bivla': 'बिवला',
    'badra': 'बाडरा', 'erla': 'एरला', 'bijapur': 'बीजापुर', 'amravati': 'अमरावती',
    'deurbal': 'देउरबाल', 'chhinari': 'छिनारी', 'phundar': 'फुण्डर', 'banchapai': 'बनचपई',
    'lanjoda': 'लंजोड़ा', 'bhanpuri': 'भानपुरी', 'kosagaon': 'कोसागांव', 'jhakari': 'झाकरी',
    'badeodagaon': 'बड़ेओड़ागांव', 'badgai': 'बड़गई', 'pawda': 'पावड़ा', 'modebedma': 'मोदेबेड़मा',
    'jaitpuri': 'जैतपुरी', 'sodma': 'सोड़मा', 'banjoda': 'बंजोड़ा', 'mohpal': 'मोहपाल',
    'bangoli': 'बंगोली', 'badedongar': 'बड़ेडोंगर', 'chaniyagaon': 'चनियागांव', 'deogaon': 'देवगांव',
    'chhindlibeda': 'छिन्दलीबेड़ा', 'gawadi': 'गवाड़ी', 'bokrabeda': 'बोकराबेड़ा', 'hatchapai': 'हाटचपई',
    'kokodajuganar': 'कोकोड़ाजुगानार', 'paroda': 'परोदा', 'bangaon': 'बानगांव', 'gattipalna': 'गटटीपलना',
    'koradbadgaon': 'कोराड़बड़गांव', 'bhandarvandi': 'भण्डारवण्डी', 'alor': 'आलोर', 'jhatiban': 'झाटीबन',
    'mode': 'मोदे', 'kanhargaon': 'कन्हारगांव', 'kongud': 'कोनगुड़', 'urandabeda': 'उरन्दाबेड़ा',
    'shankarpur': 'शंकरपुर', 'phuphgaon': 'फूफगांव', 'pandeyaatgaon': 'पाण्डेआठगांव', 'chandagaon': 'चांदागांव',
    'singarpuri': 'सिंगारपुरी', 'hiri': 'हिरी', 'bhumka': 'भूमका', 'godma': 'गोड़मा',
    'korai': 'कोरई', 'torand': 'तोरण्ड', 'kotpad': 'कोटपाड़', 'khandsara': 'खण्डसरा',
    'mandagaon': 'मांदागांव', 'bhongapal': 'भोंगापाल', 'chandabeda': 'चांदाबेड़ा', 'chindli': 'छिंदली',
    'juganikalar': 'जुगानीकलार', 'kulhadgaon': 'कुल्हाड़गांव', 'bhandarseoni': 'भण्डारसिवनी',
    'charkai': 'चरकई', 'sirpur': 'सिरपुर', 'kumharbadgaon': 'कुम्हारबड़गांव', 'chingnar': 'चिंगनार',
    'kasaipharasgaon': 'कसई फरसगांव', 'mainpur': 'मैनपुर', 'modega': 'मोड़ेगा', 'sirsikalar': 'सिरसीकलार',
    'kaboga': 'कबोंगा', 'chhotesalna': 'छोटेसलना'
}

WORD_MAP = {
    'GOVT': '', 'SSA': '', 'TWD': '', 'EDU': '', 'JANPAD': '', 'GJ': '', 'PRI': '', 'SCH': '', 'SCHOOL': '',
    'PRIMARY': '', 'MIDDLE': '', 'HIGH': '', 'HIGHER': '', 'SECONDARY': '', 'SECONDRY': '',
    'SWAMI': 'स्वामी', 'ATMANAND': 'आत्मानंद', 'ENGLISH': 'अंग्रेजी', 'MEDIUM': 'माध्यम', 'HINDI': 'हिंदी',
    'PS': 'P.S.', 'UPS': 'U.P.S.', 'MS': 'M.S.', 'HS': 'H.S.', 'HSS': 'H.S.S.',
    'KGBV': 'के.जी.बी.वी.', 'ASHRAM': 'आश्रम', 'ASHRAMA': 'आश्रम', 'ASRAM': 'आश्रम', 'ASRAMA': 'आश्रम',
    'KANYA': 'कन्या', 'BALAK': 'बालक', 'BOYS': 'बालक', 'GIRLS': 'कन्या', 'SHALA': 'शाला',
    'NAVEEN': 'नवीन', 'NAVIN': 'नवीन', 'NAV': 'नवीन', 'CENTRAL': 'केंद्रीय',
    'KHARGAON': 'खरगांव', 'BADERAJPUR': 'बड़ेराजपुर', 'CHICHADI': 'चिचाड़ी', 'BANSKOT': 'बाँसकोट',
    'SALNA': 'सालना', 'PALNA': 'पालना', 'PUJARIPARA': 'पुजारीपारा', 'VISHRAMPURI': 'विश्रामपुरी',
    'PENDRAVAN': 'पेण्ड्रावन', 'KONGERA': 'कोंगेरा', 'MANDOKIDIHI': 'मांडोकीडीही', 'UDIDGAON': 'उड़िदगांव',
    'BASTARBUDRA': 'बस्तरबुड्रा', 'KALGAON': 'कलगांव', 'BANDHAPARA': 'बांधापारा', 'TARAIBEDA': 'तराईबेड़ा',
    'PITISHPAL': 'पितीशपाल', 'GUDRIPARAGAMHARI': 'गुड़ीपारा गमहरी', 'GAMHARI': 'गमहरी', 'GAMHRI': 'गमहरी',
    'RAVASHVAHI': 'रवाशवाही', 'DHONDRA': 'ढोढरा', 'DHAMANPURI': 'धामनपुरी', 'KORGAON': 'कोरगांव',
    'MARANGPURI': 'मारंगपुरी', 'DIHIPARABANSKOT': 'डीहीपारा बाँसकोट', 'MANJHIPARATORAIPARA': 'मांझीपारा तोरईपारा',
    'MANIKPUR': 'मानिकपुर', 'PAROND': 'पारोण्ड', 'PATVARIPARA': 'पटवारीपारा', 'KANKERIYAPARABADERAJPUR': 'कांकेरियापारा बड़ेराजपुर',
    'KOLIYARIDIHI': 'कोलियरिडीही', 'BADBATTAR': 'बड़बत्तर', 'PLAT': 'प्लाट',
    'AMADIHI': 'अमाडीही', 'PATVARIPARAKORGAON': 'पटवारीपारा कोरगांव', 'BAIJANPURIKORHOBEDA': 'बैजनपुरी कोरहोबेड़ा',
    'LOHATIPARABALENGA': 'लोहाटीपारा बालेंगा', 'BALENGA': 'बालेंगा', 'KOSMI': 'कोसमी', 'TENVSHA': 'टेंवसा',
    'TENWVSA': 'टेंवसा', 'NAHARPARAKHARGAON': 'नहरपारा खरगांव', 'MANJHIPARAKORHOBEDA': 'मांझीपारा कोरहोबेड़ा',
    'PATELPARAKHALARI': 'पटेलपारा खलारी', 'KHALARI': 'खलारी', 'KHAJARAWAND': 'खजरावण्ड', 'DIHIPARAHONAWAND': 'डीहीपारा होनावण्डी',
    'HONAWANDI': 'होनावण्डी', 'MAINPUR': 'मैनपुर', 'ONDKAPARA': 'ओंडकापारा', 'RAHATIPARABALENGA': 'राहाटीपारा बालेंगा',
    'JODEKERA': 'जोड़ेकेरा', 'FARSADIHI': 'फरसाडीही', 'SONPUR': 'सोनपुर', 'NOUKABEDA': 'नौकाबेड़ा', 'KOSAMI': 'कोसमी',
    'BIRAPARA': 'बीरापारा', 'TATIPARA': 'टाटीपारा', 'LIHAGAON': 'लिहागांव', 'KARMARI': 'करमरी', 'VISHRAM': 'विश्राम',
    'MARHANGUHAN': 'मरहानगुहान', 'RAHTIPARA': 'राहटीपारा', 'PADOKI': 'पडोकी', 'GATEPARA': 'गेटपारा',
    'JABURDIHI': 'जाबुरडीही', 'THEGAPARA': 'ठेगापारा', 'DIHIPARADONDRA': 'डीहीपारा ढोढरा', 'BAJARPARABAJARPARA': 'बाजारपारा',
    'KHALEPARA': 'खालेपारा', 'HARVEL': 'हरवेल', 'RAUTPARA': 'राउतपारा', 'MANDOKI': 'मांडोकी', 'DHODGAPARA': 'ढोढगापारा',
    'CHINDLI': 'छिन्दली', 'MANJHIPARALIHAGAON': 'मांझीपारा लिहागांव', 'TENWSA': 'टेंवसा', 'KOPRA': 'कोपरा',
    'KORHOBEDA': 'कोरहोबेड़ा', 'PIDHAPAL': 'पीढ़ापाल', 'BANNUPARA': 'बन्नूपारा', 'THAKURPARACHINDLI': 'ठाकुरपारा छिन्दली',
    'KANYA': 'कन्या', 'HALBAPARA': 'हलबापारा', 'JHODIAPARASALNA': 'झोड़ियापारा सालना', 'DHAVRABHATA': 'धौराभाटा',
    'MACHLI': 'मचली', 'TORAIPARA': 'तोरईपारा', 'PANDEYPARA': 'पांडेयपारा', 'MUNDAPARA': 'मुंडापारा', 'BHARRIDIHI': 'भर्रीडीही',
    'KERADIHI': 'केराडीही', 'TITARWAND': 'तितरवण्ड', 'UPARPARA': 'ऊपरपारा', 'CHOTERAJPUR': 'छोटेराजपुर', 'TRIBAL': '',
    'GARANJIDIHI': 'गरंजीडीही', 'JARHIDIHI': 'जरहीडीही', 'ROGADIHI': 'रोगाडीही', 'JIRRAPARA': 'जिर्रापारा',
    'MONDOKIPARA': 'मांडोकीपारा', 'GYANJYOTI': 'ज्ञानज्योति', 'BHURKADIHI': 'भुरकाडीही',
    'CHOTEMAALGAON': 'छोटेमालगांव', 'KHASHPARAKHAJRAWAND': 'खासपारा खजरावण्ड', 'KAUDOKERA': 'कौदोकेरा',
    'NAYAPARABASTARBUDRA': 'नयापारा बस्तरबुड्रा', 'NAKAPARAHATMA': 'नाकापारा हात्मा', 'HATMA': 'हात्मा', 'DIHIPARACHINDALI': 'डीहीपारा छिन्दली',
    'BOIRPARA': 'बोईरपारा', 'BAVANPURI': 'बवनपुरी', 'AWASHPARALIHAGAON': 'आवासपारा लिहागांव', 'KOPANKONADI': 'कोपनकोनाड़ी',
    'GUTTADIHI': 'गुट्टाडीही', 'PANDEYDIHI': 'पांडेयडीही', 'PATRIPARA': 'पत्रीपारा', 'KODAPARA': 'कोड़ापारा', 'BHARRAPARA': 'भर्रापारा',
    'DIHIPARA': 'डीहीपारा', 'MURKHEDAPARA': 'मुरखेड़ापारा', 'DUMRAPARASALNA': 'डुमरापारा सालना', 'RAVANAGUDA': 'रावणगुड़ा',
    'UPERPARALIHAGAON': 'ऊपरपारा लिहागांव', 'BADEPARAKONGERA': 'बड़ेपारा कोंगेरा', 'DANTAPARA': 'दांतापारा', 'HALDA': 'हलदा',
    'BAIJANPURI': 'बैजनपुरी', 'DONGARIPARAKALGAON': 'डोंगरीपारा कलगांव',
    'KULDADIHI': 'कुलदाडीही', 'MARI': 'मारी', 'RAJAGAON': 'राजागांव', 'KEJANG': 'केजंग', 'SHIVNAPADAR': 'शिवनापदर',
    'BHIRAGAON': 'भीरागांव', 'DABDIBEDA': 'दबडीबेड़ा', 'KARIYAKANTA': 'करियाकांटा', 'BADKOTPARA': 'बड़कोटपारा',
    'BADEBHIRAWAND': 'बड़ेभिराउण्ड', 'PANDAPALLI': 'पांडापल्ली', 'OLAJHAR': 'ओलाझार', 'MOHLAI': 'मोहलई',
    'SHIVNA': 'शिवना', 'BHATA': 'भाटा', 'BOARGAON': 'बोरगांव', 'BAFNA': 'बफना', 'MASORA': 'मसोरा', 'KANGA': 'कांगा',
    'CHOTEBANJODA': 'छोटेबंजोड़ा', 'MUNDATIKRA': 'मुंडाटिकरा', 'DARSHALIPARA': 'दर्शालीपारा', 'KOKODI': 'कोकोड़ी',
    'CHIKHLAPARA': 'चिखलापारा', 'TOTAR': 'तोतर', 'CHHUIDHODA': 'छुईधोड़ा', 'KHAS': 'खास', 'THOTHI': 'थोथी', 'MADANAR': 'मडानार',
    'KATAWAND': 'काटावण्ड', 'TEMRUGAON': 'टेमरूगांव', 'DHANPURMULMULA': 'धनपुर मुलमुला', 'TENGANAPKHANA': 'टेंगानापखाना',
    'TELANGA': 'तेलंगा', 'HATHKALI': 'हथकली', 'RANAPAL': 'राणापाल', 'DONGRIPARA': 'डोंगरीपारा', 'PALLI': 'पल्ली', 'MALGAON': 'मालगांव',
    'GAJRIJHORKICHANGER': 'गजरीजहोर की चांगेर', 'DAHIKONGA': 'दहीकोंगा', 'KOHKADI': 'कोहकड़ी',
    'GOLAWAND': 'गोलावण्ड', 'JONDHARABEDA': 'जोंधराबेड़ा', 'DONGER': 'डोंगर', 'SILATI': 'सिलाटी', 'SARPANCH': 'सरपंच',
    'SATBAHANI': 'सतबहनी', 'DHOLMANDARI': 'ढोलमंड़ारी', 'POLANG': 'पोलंग', 'KODKANAR': 'कोड़कनार', 'PUJARI': 'पुजारी',
    'KAMELA': 'कमेला', 'BADE': 'बड़े', 'KIBAIBALENGA': 'किबाईबालेंगा', 'KUMHARPARA': 'कुम्हारपारा', 'MAKDI': 'माकड़ी',
    'KACHORA': 'कचोरा', 'HADELI': 'हड़ेली', 'ISALNAR': 'इसलनार', 'CHOUDANG': 'चौड़ंग', 'KHACHGAON': 'खचगांव',
    'BHAGDEVA': 'भगदेवा', 'CHICHDONGRI': 'चिचडोंगरी', 'TEKAPAL': 'टेकापाल', 'HASALNAR': 'हसलनार',
    'KADENAR': 'कडेनार', 'BADEKURUSNAR': 'बड़ेकुरुषनार', 'JODEGA': 'जोड़ेगा', 'KHADPADI': 'खड़पड़ी',
    'KORMEL': 'कोरमेल', 'PADNAAR': 'पदनार', 'TUMDIWAL': 'तुमड़ीवाल', 'NAGARI': 'नगरी',
    'BADESILATI': 'बड़ेसिलाटी', 'BADEBHIRAWAND': 'बड़ेभिरवण्ड', 'CHHOTEBHIRAWAND': 'छोटेभिरवण्ड',
    'KUKADGARKAPAL': 'कुकाड़गारकापाल', 'BAKHRA': 'बाखरा', 'KARANJI': 'करंजी',
    'SUKURPAL': 'सुकूरपाल', 'BANUSARI': 'बनउसरी',
    'BOTIKENERA': 'बोटीकनेरा', 'BADEBEJODA': 'बड़ेबेजोड़ा', 'PUSAWAND': 'पुसावण्ड',
    'BAMHANI': 'बम्हनी', 'KARSING': 'कारसिंग', 'KUSMA': 'कुसमा', 'CHAMAI': 'चमई',
    'ADNAR': 'आदनार', 'CHEMA': 'चेमा', 'JHARA': 'झारा', 'MULNAAR': 'मूलनार',
    'NAHKANAAR': 'नाहकानार', 'LAKHAPURI': 'लखापुरी', 'PHUKAGIROLA': 'फूकागिरोला',
    'SONABEDA': 'सोनाबेड़ा', 'KARANDI': 'करण्डी', 'LABHA': 'लभा', 'BADESOHANGA': 'बड़ेसोंहगा',
    'KOSHAHARDULI': 'कोसाहरदूली', 'CHHATODI': 'छतोड़ी', 'SODSIVANI': 'सोड़िसिवनी', 'SAMPUR': 'शामपुर',
    'BABAI': 'बवई', 'INGRA': 'इंगरा', 'KATAGAON': 'काटागांव', 'URIDGAON': 'उड़िदगांव',
    'PUSAPAL': 'पुसापाल', 'HUKKABEDAPATHRI': 'हुक्काबेड़ापाथरी', 'TORENGA': 'तौरेंगा', 'OTENDA': 'ओटेण्डा',
    'LUBHA': 'लुभा', 'KERAWAHI': 'केरावाही', 'TARAIBEDA': 'तरईबेड़ा', 'HIRAPUR': 'हीरापुर',
    'ANATPUR': 'अनतपुर', 'TEMGAON': 'ठेमगांव', 'MARAGAON': 'मारागांव', 'JARANDI': 'जरण्डी',
    'KURLUBAHAR': 'कुरलूबहार', 'UDENDGA': 'उदेंगा', 'ARLA': 'अमरावती', 'BADEGODSODA': 'बड़ेघोड़सोड़ा',
    'TAMRAWAND': 'तमरावण्ड', 'RANDNA': 'रांधना', 'BUDRA': 'बुडरा', 'ONDRI': 'ओण्डरी',
    'MIRMINDA': 'मिरमिंडा', 'BINJOLI': 'बिंजोली', 'RAKASBEDA': 'राकसबेड़ा', 'BALOND': 'बालोण्ड',
    'GUHABORAND': 'गुहाबोरण्ड', 'BAGBEDA': 'बागबेड़ा', 'MAGEDA': 'मगेदा', 'BELONDI': 'बेलोण्डी',
    'TORANDI': 'तोरण्डी', 'BELGAON': 'बेलगांव', 'KAVRA': 'कावरा', 'BIVLA': 'बिवला',
    'BADRA': 'बाडरा', 'ERLA': 'एरला', 'BIJAPUR': 'बीजापुर', 'AMRAVATI': 'अमरावती',
    'DEURBAL': 'देउरबाल', 'CHHINARI': 'छिनारी', 'PHUNDAR': 'फुण्डर', 'BANCHAPAI': 'बनचपई',
    'LANJODA': 'लंजोड़ा', 'BHANPURI': 'भानपुरी', 'KOSAGAON': 'कोसागांव', 'JHAKARI': 'झाकरी',
    'BADEODAGAON': 'बड़ेओड़ागांव', 'BADGAI': 'बड़गई', 'PAWDA': 'पावड़ा', 'MODEBEDMA': 'मोदेबेड़मा',
    'JAITPURI': 'जैतपुरी', 'SODMA': 'सोड़मा', 'BANJODA': 'बंजोड़ा', 'MOHPAL': 'मोहपाल',
    'BANGOLI': 'बंगोली', 'BADEDONGAR': 'बड़ेडोंगर', 'CHANIYAGAON': 'चनियागांव', 'DEOGAON': 'देवगांव',
    'CHHINDLIBEDA': 'छिन्दलीबेड़ा', 'GAWADI': 'गवाड़ी', 'BOKRABEDA': 'बोकराबेड़ा', 'HATCHAPAI': 'हाटचपई',
    'KOKADAJUGANAR': 'कोकोड़ाजुगानार', 'PARODA': 'परोदा', 'BANGAON': 'बानगांव', 'GATTIPALNA': 'गटटीपलना',
    'KORADBADGAON': 'कोराड़बड़गांव', 'BHANDARVANDI': 'भण्डारवण्डी', 'ALOR': 'आलोर', 'JHATIBAN': 'झाटीबन',
    'MODE': 'मोदे', 'KANHARGAON': 'कन्हारगांव', 'KONGUD': 'कोनगुड़', 'URANDABEDA': 'उरन्दाबेड़ा',
    'SHANKARPUR': 'शंकरपुर', 'PHUPHGAON': 'फूफगांव', 'PANDEYAATGAON': 'पाण्डेआठगांव', 'CHANDAGAON': 'चांदागांव',
    'SINGARPURI': 'सिंगारपुरी', 'HIRI': 'हिरी', 'BHUMKA': 'भूमका', 'GODMA': 'गोड़मा',
    'KORAI': 'कोरई', 'TORAND': 'तोरण्ड', 'KOTPAD': 'कोटपाड़', 'KHANDSARA': 'खण्डसरा',
    'MANDAGAON': 'मांदागांव', 'BHONGAPAL': 'भोंगापाल', 'CHANDABEDA': 'चांदाबेड़ा', 'CHINDLI': 'छिंदली',
    'JUGANIKALAR': 'जुगानीकलार', 'KULHADGAON': 'कुल्हाड़गांव', 'BHANDARSEONI': 'भण्डारसिवनी',
    'CHARKAI': 'चरकई', 'SIRPUR': 'सिरपुर', 'KUMHARBADGAON': 'कुम्हारबड़गांव', 'CHINGNAR': 'चिंगनार',
    'KASAIPHARASGAON': 'कसई फरसगांव', 'MAINPUR': 'मैनपुर', 'MODEGA': 'मोड़ेगा', 'SIRSIKALAR': 'सिरसीकलार',
    'KABOGA': 'कबोंगा', 'CHHOTESALNA': 'छोटेसलना'
}

def transliterate_word(w):
    w_up = w.upper()
    if w_up in WORD_MAP:
        return WORD_MAP[w_up]
    
    res = w_up
    res = re.sub(r'PARA$', 'पारा', res)
    res = re.sub(r'BEDA$', 'बेड़ा', res)
    res = re.sub(r'GAON$', 'गांव', res)
    res = re.sub(r'PUR$', 'पुर', res)
    res = re.sub(r'DIHI$', 'डीही', res)
    res = re.sub(r'WAND$', 'वण्ड', res)
    
    char_map = [
        ('KHARGAON', 'खरगांव'), ('KONDAGAON', 'कोण्डागांव'), ('BADERAJPUR', 'बड़ेराजपुर'),
        ('PHARASGAON', 'फरसगांव'), ('KESHKAL', 'केशकाल'), ('MAKADI', 'माकड़ी'),
        ('KH', 'ख'), ('GH', 'घ'), ('CH', 'च'), ('JH', 'झ'), ('TH', 'थ'), ('DH', 'ध'), ('PH', 'फ'), ('BH', 'भ'), ('SH', 'श'),
        ('KA', 'का'), ('KI', 'कि'), ('KU', 'कु'), ('KE', 'के'), ('KO', 'को'), ('K', 'क'),
        ('GA', 'गा'), ('GI', 'गि'), ('GU', 'गु'), ('GE', 'गे'), ('GO', 'गो'), ('G', 'ग'),
        ('CHA', 'चा'), ('CHI', 'चि'), ('CHU', 'चु'), ('CHE', 'चे'), ('CHO', 'चो'), ('C', 'च'),
        ('JA', 'जा'), ('JI', 'जि'), ('JU', 'जु'), ('JE', 'जे'), ('JO', 'जो'), ('J', 'ज'),
        ('TA', 'ता'), ('TI', 'ति'), ('TU', 'तु'), ('TE', 'ते'), ('TO', 'तो'), ('T', 'त'),
        ('DA', 'दा'), ('DI', 'दि'), ('DU', 'दु'), ('DE', 'दे'), ('DO', 'दो'), ('D', 'द'),
        ('NA', 'ना'), ('NI', 'नि'), ('NU', 'नु'), ('NE', 'ने'), ('NO', 'नो'), ('N', 'न'),
        ('PA', 'पा'), ('PI', 'पि'), ('PU', 'पु'), ('PE', 'पे'), ('PO', 'पो'), ('P', 'प'),
        ('BA', 'बा'), ('BI', 'बि'), ('BU', 'बु'), ('BE', 'बे'), ('BO', 'बो'), ('B', 'ब'),
        ('MA', 'मा'), ('MI', 'मि'), ('MU', 'मु'), ('ME', 'मे'), ('MO', 'मो'), ('M', 'म'),
        ('YA', 'या'), ('YI', 'यि'), ('YU', 'यु'), ('YE', 'ये'), ('YO', 'यो'), ('Y', 'य'),
        ('RA', 'रा'), ('RI', 'रि'), ('RU', 'रु'), ('RE', 'रे'), ('RO', 'रो'), ('R', 'र'),
        ('LA', 'ला'), ('LI', 'लि'), ('LU', 'लु'), ('LE', 'ले'), ('LO', 'लो'), ('L', 'ल'),
        ('VA', 'वा'), ('VI', 'वि'), ('VU', 'वु'), ('VE', 'वे'), ('VO', 'वो'), ('V', 'व'), ('W', 'व'),
        ('SA', 'सा'), ('SI', 'सि'), ('SU', 'सु'), ('SE', 'से'), ('SO', 'सो'), ('S', 'स'),
        ('HA', 'हा'), ('HI', 'हि'), ('HU', 'हु'), ('HE', 'हे'), ('HO', 'हो'), ('H', 'ह')
    ]
    for k, v in char_map:
        res = res.replace(k, v)
    res = re.sub(r'[A-Za-z]', '', res)
    return res

def get_hindi_panchayat(en_p, block_hi):
    if not en_p:
        return ''
    clean = en_p.lower().replace(' ', '').replace('-', '').replace('.', '').replace('\'', '')
    if clean in PANCHAYAT_MAP:
        return PANCHAYAT_MAP[clean]
    
    h_list = BLOCK_PANCHAYATS_HI.get(block_hi, [])
    for h in h_list:
        h_clean = h.lower().replace(' ', '').replace('-', '').replace('.', '').replace('\'', '')
        if clean == h_clean:
            return h
    
    words = en_p.split()
    return ' '.join([transliterate_word(w) for w in words])

def format_school_name(raw_name, cat_raw, panchayat_hi):
    u_raw = raw_name.upper()
    c_raw = cat_raw.upper()
    
    level_prefix = ''
    if 'HIGHER SECONDARY' in u_raw or 'HIGHER SECONDRY' in u_raw or 'H.S.S.' in u_raw or '10 -' in c_raw or '5 -' in c_raw or '3 -' in c_raw:
        level_prefix = 'H.S.S.'
    elif 'HIGH SCHOOL' in u_raw or 'H.S.' in u_raw or '8 -' in c_raw or '7 -' in c_raw or '6 -' in c_raw:
        level_prefix = 'H.S.'
    elif 'MIDDLE SCHOOL' in u_raw or ' M.S.' in u_raw or 'MS ' in u_raw or '4 -' in c_raw:
        level_prefix = 'M.S.'
    elif 'UPS' in u_raw or 'UPPER PRIMARY' in u_raw or '2 -' in c_raw:
        level_prefix = 'U.P.S.'
    elif 'PS' in u_raw or 'PRIMARY' in u_raw or '1 -' in c_raw:
        level_prefix = 'P.S.'
    else:
        level_prefix = 'P.S.'
    
    is_atmanand = 'SWAMI ATMANAND' in u_raw
    is_ashram = 'ASHRAM' in u_raw or 'ASRAM' in u_raw
    is_kgbv = 'KGBV' in u_raw
    
    prefixes_re = re.compile(r'^\s*(?:SWAMI\s+ATMANAND\s+GOVT\s+(?:ENGLISH|HINDI)\s+MEDIUM\s+SCHOOL|SWAMI\s+ATMANAND\s+GOVT\s+(?:ENGLISH|HINDI)\s+MEDIUM|SWAMI\s+ATMANAND|GOVT\.SSA\.NAVEEN\s+PS|GOVT\.SSA\.NAVIN\s+PS|GOVT\.SSA\.GJ\s+PS|GOVT\.SSA\.PS|GOVT\.SSA\.UPS|GOVT\.SSA\.MS|GOVT\.SSA|GOVT\.TWD\.MS|GOVT\.TWD\.PS|GOVT\.TWD\.UPS|GOVT\.TWD|GOVT\.EDU\.PS|GOVT\.EDU\.MS|GOVT\.EDU\.UPS|GOVT\.EDU\s+JPS|GOVT\.EDU\s+PS|GOVT\.EDU|GOVT\.JANPAD\s+PS|GOVT\.JANPAD|GOVT\.GJ\s+PS|GOVT\.GJ|GOVT\.TRIBAL\s+PS|GOVT\.TRIBAL|GOVT\.PRI\.SCH\.|GOVT\.PRI\.SCH|GOVT\.HIGH\s+SCHOOL\.|GOVT\.HIGH\s+SCHOOL|GOVT\.HIGHER\s+SECONDARY\s+SCHOOL|GOVT\.HIGHER\s+SECONDRY\s+SCHOOL|GOVT\.MIDDLE\s+SCHOOL|GOVT\.PRIMARY\s+SCHOOL|GOVT\.UPS\.|GOVT\.UPS|GOVT\.MS\.|GOVT\.MS|GOVT\.PS\.|GOVT\.PS|GOVT\.H\.S\.|GOVT\s+H\.S\.|GOVT\.|GOVT|SSA\.|SSA|TWD\.|TWD|EDU\.|EDU|JANPAD|GJ|PS|UPS|MS|HIGH SCHOOL|HIGHER SECONDARY SCHOOL|MIDDLE SCHOOL)[\.\s]*', re.I)
    
    curr = raw_name
    prev = ''
    while curr != prev:
        prev = curr
        curr = prefixes_re.sub('', curr).strip()
    
    rem_words = [w.strip() for w in re.split(r'[\s\.\,\(\)\-]+', curr) if w.strip()]
    hi_words = []
    for w in rem_words:
        w_up = w.upper()
        if w_up in WORD_MAP:
            hi_w = WORD_MAP[w_up]
            if hi_w:
                hi_words.append(hi_w)
        else:
            hi_words.append(transliterate_word(w))
    
    loc_hi = ' '.join(hi_words).strip()
    if not loc_hi:
        loc_hi = panchayat_hi
    
    if is_atmanand:
        return f"स्वामी आत्मानंद {level_prefix} {loc_hi}".strip()
    elif is_kgbv:
        return f"कस्तूरबा (KGBV) {level_prefix} {loc_hi}".strip()
    elif is_ashram:
        if 'KANYA' in u_raw or 'GIRLS' in u_raw:
            return f"कन्या आश्रम {loc_hi}".strip()
        else:
            return f"बालक आश्रम {loc_hi}".strip()
    else:
        return f"{level_prefix} {loc_hi}".strip()

master = {}

for r in records:
    block_hi = r['block_hi']
    panchayat_hi = get_hindi_panchayat(r['panchayat_en'], block_hi)
    if not panchayat_hi:
        continue
    
    school_name_hi = format_school_name(r['school_raw'], r['category_raw'], panchayat_hi)
    
    master.setdefault(block_hi, {})
    master[block_hi].setdefault(panchayat_hi, [])
    
    existing = master[block_hi][panchayat_hi]
    if not any(s['name'] == school_name_hi for s in existing):
        existing.append({
            'name': school_name_hi,
            'raw': r['school_raw'],
            'category': r['category_raw']
        })

print(f"Dataset generated. Block count: {len(master)}")

js_content = f"""// Schools Master Dataset grouped by Block & Gram Panchayat
// Auto-generated from district PDF list with cleaned short names & Hindi transliteration

export const SCHOOL_MASTER_DATA = {json.dumps(master, ensure_ascii=False, indent=2)};

const matchBlock = (b1, b2) => {{
  if (!b1 || !b2) return false;
  if (b1 === b2) return true;
  const s1 = b1.replace(/[\\u093c\\s]/g, '').replace(/ड़/g, 'ड').replace(/ि/g, 'ी');
  const s2 = b2.replace(/[\\u093c\\s]/g, '').replace(/ड़/g, 'ड').replace(/ि/g, 'ी');
  if (s1 === s2) return true;
  if (s1.includes('फरस') && s2.includes('फरस')) return true;
  if (s1.includes('राजपुर') && s2.includes('राजपुर')) return true;
  if ((s1.includes('कोण्डा') || s1.includes('कोंडा')) && (s2.includes('कोण्डा') || s2.includes('कोंडा'))) return true;
  if (s1.includes('माकड') && s2.includes('माकड')) return true;
  if (s1.includes('केश') && s2.includes('केश')) return true;
  return false;
}};

const normalizeStr = (str) => {{
  if (!str) return '';
  let s = str.trim();
  return s
    .replace(/['"()]/g, '')
    .replace(/[\\u093c]/g, '') // strip nukta
    .replace(/\\s+/g, '')
    .replace(/िं/g, 'ी')
    .replace(/ि/g, 'ी')
    .replace(/ुं/g, 'ू')
    .replace(/ु/g, 'ू')
    .replace(/ण्ड/g, 'ंड')
    .replace(/ड़/g, 'ड')
    .replace(/ढ़/g, 'ढ');
}};

export const getSchoolsForPanchayat = (blockName, panchayatName) => {{
  if (!blockName || !panchayatName) return [];

  // Match block key
  const blockKey = Object.keys(SCHOOL_MASTER_DATA).find(b => matchBlock(b, blockName));
  if (!blockKey) return [];

  const blockData = SCHOOL_MASTER_DATA[blockKey];
  if (!blockData) return [];

  // Direct match
  if (blockData[panchayatName]) return blockData[panchayatName];

  // Normalized match
  const normPanch = normalizeStr(panchayatName);
  for (const [pName, list] of Object.entries(blockData)) {{
    if (normalizeStr(pName) === normPanch) return list;
  }}

  // Partial substring match fallback
  for (const [pName, list] of Object.entries(blockData)) {{
    const normKey = normalizeStr(pName);
    if ((normKey.includes(normPanch) || normPanch.includes(normKey)) && normKey.length >= 4 && normPanch.length >= 4) {{
      return list;
    }}
  }}

  return [];
}};
"""

with open('f:/Website/Nodel/client/src/data/schoolMasterData.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully generated schoolMasterData.js!")
