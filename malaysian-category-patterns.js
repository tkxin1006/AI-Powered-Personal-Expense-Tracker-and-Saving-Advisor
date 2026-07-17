/**
 * Malaysian Category Detection Patterns (Deep Expanded)
 *
 * All keywords are consolidated directly under the 10 DB expense parent
 * categories and 5 DB income parent categories.
 */

const malaysianCategoryPatterns = {

    // ═══════════════════════════════════════════════════════════════════
    // 1. FOOD & DRINKS
    // ═══════════════════════════════════════════════════════════════════
    'Food & Drinks': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── Fast Food & Chains ─────────────────────────────────
            'mcdonalds', 'mcd', 'mekdi', 'kfc', 'pizza hut', 'dominos', 'subway',
            'burger king', 'texas chicken', 'marrybrown', 'a&w', 'kyochon', '4fingers',
            'nandos', 'sushi king', 'sushi mentai', 'sushi zanmai', 'sakae sushi',
            'empire sushi', 'dolly dim sum', 'din tai fung', 'hai di lao', 'jollibee',
            'richeese factory', 'kenny rogers', 'carls jr', 'taco bell', 'us pizza',
            'seoul garden', 'boat noodle', 'absolute thai', 'kanna curry house',
            'papparich', 'oldtown', 'oriental kopi', 'ali muthu & ah hock', 'nando',
            // ── Local & Street Food (Branded & Non-Branded) ────────
            'ramly', 'burger ramly', 'burger kaw kaw', 'murni discovery', 'pelita',
            'nasi kandar pelita', 'deen maju', 'hameediyah', 'line clear',
            'restaurant', 'restoran', 'mamak', 'kopitiam', 'food court', 'medan selera',
            'hawker', 'gerai', 'warung', 'pasar malam', 'bazaar', 'food truck',
            'nasi lemak', 'roti canai', 'mixed rice', 'chap fan', 'nasi campur',
            'nasi kandar', 'bak kut teh', 'dim sum', 'satay', 'sate', 'nasi ayam',
            'chicken rice', 'char kuey teow', 'laksa', 'tomyam', 'maggi goreng',
            'nasi goreng', 'mee goreng', 'rojak', 'cendol', 'ikan bakar', 'sup ekor',
            'pisang goreng', 'goreng pisang', 'keropok lekor', 'apam balik', 'kuih muih',
            'nasi kerabu', 'nasi dagang', 'nasi tomato', 'nasi minyak',
            'dine', 'dinner', 'lunch', 'breakfast', 'supper', 'makan', 'lepak',
            'belanja makan', 'ikat tepi', 'eat', 'minum', 'tapau', 'bungkus', 'takeaway',
            // ── Cafes, Boba & Drinks ───────────────────────────────
            'starbucks', 'coffee bean', 'cbtl', 'zus coffee', 'gigi coffee',
            'bask bear', 'san francisco coffee', 'chagee', 'bawangchaji',
            'koi', 'gong cha', 'chatime', 'coolblog', 'mixue', 'macao imperial',
            'daboba', 'tiger sugar', 'hainan tea', 'kenangan coffee',
            'husk', 'tealive', 'richiamo coffee', 'kopi saigon', 'heytea', 'llaollao',
            'teh tarik', 'kopi', 'nescafe', 'milo', 'horlicks', 'sirap', 'bandung',
            'teh o ais', 'kopi ais', 'teh ais', 'teh ais cincau', 'juice', 'jus', 
            'mineral water', 'soda', 'coke', 'pepsi', '100 plus', 'sprite', 'red bull', 
            'livita', 'boba', 'bubble tea', 'coffee', 'tea', 'cafe', 'beverage', 'drink',
            // ── Desserts & Snacks ──────────────────────────────────
            'secret recipe', 'baskin robbins', 'inside scoop', 'yole',
            'mykori', 'mixue', 'bingxue', 'rotiboy', 'auntie anne', 'famous amos', 'hokkaido baked',
            'ice cream', 'aiskrim', 'cake', 'pudding', 'chocolate',
            'candy', 'kuih', 'keropok', 'kerepek', 'biscuit', 'cookies', 'muffin',
            'snack', 'junk food', 'dessert', 'waffle', 'pancake', 'donut', 'doughnut',
            // ── Groceries & Supermarkets ───────────────────────────
            'jaya grocer', 'village grocer', 'bens independent', 'b.i.g',
            'mydin', 'econsave', 'hero market', 'nsk', 'segi fresh',
            'tf value-mart', 'cs grocer', 'aeon big', 'lotuss', 'giant',
            'cold storage', 'mercato', 'supermarket', 'hypermarket', 
            'pasar borong', 'pasar basah', 'wet market', 'pasar',
            // ── Convenience & Sundry Stores ────────────────────────
            'familymart', 'fami', 'family mart', 'family-mart',
            '7-eleven', '7eleven', 'seven eleven', '7-11', '7 11',
            'kk mart', 'kk supermart', 'mynews', 'my news', 'cu mart', 'emart24',
            'bila bila mart', '99 speedmart', 'speedmart', 'st rosyam mart',
            'convenience store', 'mini mart', 'minimart', 'kedai runcit', 'kedai acheh',
            // ── Food Delivery ──────────────────────────────────────
            'foodpanda', 'grabfood', 'grab food', 'shopeefood', 'shopee food',
            'bungkus it', 'beepit', 'pop meals', 'delivereat', 'oda makan',
            'food delivery', 'hantar makanan', 'order food',
            // ── Cooking Ingredients ────────────────────────────────
            'chicken', 'ayam', 'beef', 'daging', 'fish', 'ikan', 'pork', 'babi',
            'mutton', 'kambing', 'seafood', 'udang', 'sotong', 'ketam', 'telur',
            'rice', 'beras', 'noodle', 'mee', 'pasta', 'spaghetti', 'macaroni',
            'maggi', 'mamee', 'instant noodle', 'bread', 'roti', 'gardenia', 'massimo',
            'milk', 'susu', 'vegetable', 'sayur', 'kangkung', 'cabbage', 'fruit', 'buah', 
            'apple', 'banana', 'orange', 'watermelon', 'durian', 'mangga',
            'oil', 'minyak masak', 'salt', 'garam', 'sugar', 'gula',
            'soy sauce', 'kicap', 'kicap kipas udang', 'chili', 'cili', 'onion', 'bawang', 
            'garlic', 'rempah', 'santan', 'paste', 'seasoning', 'sos tiram', 'food',
            'ikan bilis', 'belacan', 'tempoyak', 'cincalok', 'serbuk kari', 'rempah ratus',
            'barang dapur'
        ],
        exclusions: ['cat food', 'dog food', 'pet food', 'grab driver', 'foodpanda rider',
                     'minyak kereta', 'minyak motor', 'cooking oil', 'mr diy'],
        confidence: 0.88
    },

    // ═══════════════════════════════════════════════════════════════════
    // 2. TRANSPORT
    // ═══════════════════════════════════════════════════════════════════
    'Transport': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── E-Hailing & Taxi ───────────────────────────────────
            'grab', 'grabcar', 'grab car', 'taxi', 'teksi',
            'indrive', 'maxim', 'mycar', 'airasia ride',
            'socar', 'trevo', 'ezcab', 'kumpool', 'gocar', 'buddy driver',
            'ride hailing', 'e-hailing', 'cab',
            // ── Public Transport ───────────────────────────────────
            'mrt', 'lrt', 'ktm', 'komuter', 'monorail', 'erl', 'mrt putrajaya', 'lrt kelana jaya',
            'klia transit', 'klia ekspres', 'rapidkl', 'my50', 'my100',
            'rapid penang', 'rapid kuantan', 'bus', 'bas', 'train', 'keretapi',
            'ets', 'prasarana', 'public transport', 'pengangkutan awam',
            'touch n go reload', 'tng reload', 'rapid bas',
            // ── Fuel ───────────────────────────────────────────────
            'petronas', 'shell', 'petron', 'caltex', 'bhppetrol', 'buraqoil',
            'petrol', 'diesel', 'fuel', 'minyak kereta', 'minyak motor',
            'ron95', 'ron97', 'setel', 'pump petrol', 'isi minyak',
            'petrol station', 'stesen minyak',
            // ── Toll & Parking ─────────────────────────────────────
            'toll', 'tol', 'tng', 'touch n go', 'touchngo', 'rfid', 'smarttag',
            'parking', 'car park', 'tiket parking', 'parkir', 'kuala lumpur parking',
            'jomparking', 'parkit', 'smart selangor parking', 'flexi parking', 'paydirect',
            'ez smart park', 'plus highway', 'litrak', 'kesas', 'sprint', 'mex highway',
            'duke highway', 'npe', 'nkve', 'lksa', 'silk', 'mae parking',
            // ── Flight & Long Distance ─────────────────────────────
            'flight', 'tiket kapal terbang', 'tiket flight',
            'malaysia airlines', 'mas', 'airasia', 'batik air', 'firefly', 'scoot', 'myairline',
            'aeroline', 'plusliner', 'transnasional', 'sani express', 'konsortium', 'mara liner',
            'ferry', 'feri', 'expressbus', 'intercity',
            // ── Vehicle Maintenance ────────────────────────────────
            'car wash', 'cuci kereta', 'car service', 'servis kereta',
            'perodua service', 'proton service', 'honda service', 'toyota service',
            'tyre', 'tayar', 'battery', 'bateri', 'engine oil', 'minyak enjin',
            'bateriku', 'carput', 'spare part', 'bengkel', 'workshop', 'wiper',
            'alignment', 'balancing', 'lim tayar', 'kereta rosak', 'repair kereta',
            'brake', 'brake pad', 'absorber', 'timing belt', 'radiator', 'tinted tingkap',
            // ── Road Tax & Admin ───────────────────────────────────
            'roadtax', 'road tax', 'cukai jalan', 'jpj', 'puspakom',
            'lesen memandu', 'driving license', 'myeg', 'vehicle registration',
            'geran kereta', 'inspeksi', 'inspection', 'saman trafik',
            // ── General ────────────────────────────────────────────
            'transport', 'travel', 'commute', 'perjalanan'
        ],
        exclusions: [
            'grab driver', 'grabdriver', 'grab rider', 'grabrider',
            'grab food', 'grabfood', 'grab express', 'grab income',
            'foodpanda rider', 'delivery rider', 'lalamove driver',
            'minyak masak', 'cooking oil'
        ],
        confidence: 0.90
    },

    // ═══════════════════════════════════════════════════════════════════
    // 3. HOUSING & UTILITIES
    // ═══════════════════════════════════════════════════════════════════
    'Housing & Utilities': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── Rent & Mortgage ────────────────────────────────────
            'rent', 'sewa', 'rental', 'sewa rumah', 'sewa bilik', 'room rent',
            'speedhome', 'ibilik', 'deposit', 'tenancy agreement', 'stamping fee', 
            'booking fee', 'mortgage', 'housing loan', 'pinjaman perumahan', 'lppsa', 
            'home loan', 'ansuran rumah', 'loan rumah',
            // ── Electricity & Water ────────────────────────────────
            'tnb', 'electricity', 'bil elektrik', 'tenaga nasional', 'sesb', 'elektrik',
            'sarawak energy', 'electric bill', 'bayar elektrik', 'bayar tnb',
            'air selangor', 'syabas', 'saj', 'ranhill saj', 'pba', 'sada', 'lap', 
            'sains', 'air kelantan', 'jba', 'samb', 'syarikat air melaka', 'water bill', 
            'bil air', 'bayar air', 'indah water', 'iwk', 'sewerage', 'cukai kumbahan',
            // ── Internet & Phone Bill ──────────────────────────────
            'unifi', 'tm', 'telekom', 'time fiber', 'time dotcom', 'allo', 'viewqwest', 
            'wifi', 'broadband', 'internet bill', 'astro', 'njoi', 'cable tv', 'fiber', 
            'internet', 'maxis', 'digi', 'celcom', 'celcomdigi', 'umobile', 'hotlink',
            'xox', 'yes', 'redone', 'tune talk', 'yoodo', 'halo telco', 'altel',
            'unifi mobile', 'phone bill', 'postpaid', 'prepaid reload', 'topup',
            // ── Water Appliances ───────────────────────────────────
            'cuckoo', 'coway', 'cuckoo service', 'coway service', 'sk magic', 
            'water filter', 'penapis air', 'lg puricare', 'ruhens', 'water dispenser', 
            'air purifier',
            // ── Maintenance & Repairs ──────────────────────────────
            'plumber', 'paip', 'electrician', 'pest control', 'termite',
            'renovation', 'repair rumah', 'cleaner', 'maid', 'cucian',
            'contractor', 'kontraktor', 'tukang', 'painter', 'cat rumah',
            'nippon paint', 'mr paint', 'roof repair', 'baiki rumah', 'fix rumah',
            'bocor', 'wiring',
            // ── Condo & Service Fees ───────────────────────────────
            'maintenance fee', 'management fee', 'service charge',
            'yuran penyelenggaraan', 'condo fee', 'apartment fee',
            'jmb', 'sinking fund', 'security fee', 'guard fee',
            'parking sticker', 'access card', 'visitor pass',
            // ── Property Tax ───────────────────────────────────────
            'cukai pintu', 'cukai taksiran', 'cukai tanah', 'quit rent',
            'assessment tax', 'dbkl', 'mbpj', 'mbsa', 'mbpp', 'mpkj',
            'mbsj', 'mbmb', 'mphtj', 'mpk', 'local council', 'majlis bandaraya',
            // ── Home Furnishing ────────────────────────────────────
            'ikea', 'ssf', 'kaison', 'hooga', 'ace hardware',
            'furniture', 'perabot', 'mattress', 'tilam', 'curtain', 'langsir',
            'cadar', 'bedsheet', 'broom', 'penyapu', 'mop', 'sofa',
            'shelf', 'rack', 'almari', 'wardrobe', 'hardware store',
            'kedai hardware', 'home decor', 'utilities', 'rumah', 'bil', 'bill', 'house', 'home'
        ],
        exclusions: ['car repair', 'bengkel kereta', 'internet shopping', 'shopee', 'lazada'],
        confidence: 0.88
    },

    // ═══════════════════════════════════════════════════════════════════
    // 4. SHOPPING
    // ═══════════════════════════════════════════════════════════════════
    'Shopping': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── Online Shopping ────────────────────────────────────
            'shopee', 'lazada', 'zalora', 'amazon', 'tiktok shop', 'tiktok live',
            'shopee live', 'taobao', 'shein', 'alibaba', 'mudah.my', 'carousell', 
            'pg mall', 'online shop', 'online order', 'e-commerce', 'pdd',
            // ── Buy Now Pay Later ──────────────────────────────────
            'spaylater', 'atome', 'grab paylater', 'akulaku',
            'bnpl', 'buy now pay later', 'split payment', 'installment payment',
            'bayar ansuran',
            // ── Clothing, Fashion & Thrift ─────────────────────────
            'uniqlo', 'h&m', 'padini', 'brands outlet', 'cotton on', 'zara',
            'mango', 'monki', 'duck', 'naelofar', 'dian pelangi', 'vincci', 'nose',
            'bundle', 'thrift', 'jalan jalan japan', 'jbr bundle', 'family bundle',
            'uptown', 'downtown', 'pasar karat', 'bazaar karat',
            'clothes', 'shirt', 'pants', 'jeans', 'dress', 'baju', 'seluar',
            'tshirt', 'baju kurung', 'baju melayu', 'tudung', 'jubah', 'kebaya',
            'fashion', 'apparel', 'pakaian',
            // ── Shoes & Accessories ────────────────────────────────
            'bata', 'nike', 'adidas', 'puma', 'skechers', 'vans', 'converse', 'fipper',
            'kasut', 'shoes', 'sneakers', 'selipar', 'slippers', 'sandal',
            'bag', 'handbag', 'beg', 'wallet', 'dompet',
            'watch', 'jam tangan', 'jewelry', 'jewellery', 'cincin', 'gelang',
            'necklace', 'rantai', 'habib jewels', 'poh kong', 'tomei',
            'sunglasses', 'belt', 'tali pinggang', 'scarf', 'accessories',
            // ── Electronics ────────────────────────────────────────
            'apple store', 'machines', 'harvey norman', 'senheng', 'courts', 'all it hypermarket',
            'sri komputer', 'low yat', 'digital mall',
            'samsung', 'huawei', 'xiaomi', 'oppo', 'vivo', 'realme',
            'phone', 'telefon', 'laptop', 'komputer', 'computer', 'tablet',
            'charger', 'cable', 'earphone', 'headphone', 'powerbank', 'casing',
            'fan', 'kipas', 'iron', 'seterika', 'blender', 'aircon', 'air conditioner',
            'washing machine', 'mesin basuh', 'fridge', 'peti sejuk',
            'tv', 'television', 'speaker', 'keyboard', 'mouse', 'monitor',
            'printer', 'router', 'gadget', 'electronic',
            // ── Personal Care & Beauty ─────────────────────────────
            'sephora', 'watsons', 'guardian', 'caring pharmacy', 'sasa',
            'bath and body works', 'watson', 'magicboo',
            'silkygirl', 'simplysiti', 'wardah', 'in2it',
            'skincare', 'makeup', 'kosmetik', 'perfume', 'minyak wangi',
            'sunscreen', 'lipbalm', 'lipstick', 'foundation', 'powder', 'serum',
            'shampoo', 'syampu', 'body wash', 'sabun mandi', 'conditioner',
            'toothpaste', 'ubat gigi', 'toothbrush', 'berus gigi',
            'razor', 'shaving', 'deodorant', 'hair dye', 'cat rambut',
            'nail polish', 'facial wash', 'toner', 'moisturizer', 'eye cream',
            'beauty', 'grooming', 'salon', 'barber', 'barbershop', 'hair cut',
            'potong rambut', 'manicure', 'pedicure', 'spa treatment',
            // ── Household Supplies ─────────────────────────────────
            'tissue', 'tisu', 'toilet paper', 'tisu tandas', 'kitchen roll',
            'pampers', 'diapers', 'pad', 'sanitary pad', 'pantyliner', 'tampon',
            'detergent', 'sabun basuh', 'softener', 'pelembut pakaian',
            'dynamo', 'breeze', 'downy', 'attack', 'top',
            'dishwash', 'sabun pinggan', 'floor cleaner', 'toilet cleaner',
            'garbage bag', 'beg sampah', 'cling wrap', 'aluminium foil',
            'light bulb', 'batteries', 'household', 'keperluan rumah',
            // ── Sports & Outdoor ───────────────────────────────────
            'decathlon', 'sports direct', 'al-ikhsan', 'vshub',
            'yonex', 'victor', 'lining', 'apacs', 'fleet', 'felet', 'racket', 'raket', 
            'shuttlecock', 'bulu tangkis', 'grip', 'tali raket', 'stringing', 
            'sports equipment', 'gym equipment', 'jersey', 'sports wear',
            'badminton', 'futsal', 'football', 'basketball', 'swimming', 'swimming goggles',
            'hiking', 'cycling', 'basikal', 'bicycle', 'outdoor gear', 'yoga mat',
            'camping', 'tent', 'backpack', 'sports shoe', 'kasut sukan', 'kasut futsal', 
            'studs', 'weightlifting belt', 'dumbell', 'knee guard', 'ankle guard',
            // ── Budget Store ───────────────────────────────────────
            'eco shop', 'daiso', 'miniso', 'yubiso', 'ninso', 'noko',
            'super save', 'mr diy', 'mr dollar', 'dollar store', 'kedai murah', 'kedai rm2',
            // ── Tobacco & Vape ─────────────────────────────────────
            'vape', 'pod', 'flavor', 'liquid vape', 'coil', 'nanostix', 'relx',
            'rokok', 'cigarettes', 'cigarette', 'tobacco', 'dunhill',
            'marlboro', 'winston', 'pall mall', 'mevius', 'tembakau',
            // ── General ────────────────────────────────────────────
            'shopping', 'shop', 'store', 'mall', 'buy', 'purchase',
            'beli', 'belah', 'kedai'
        ],
        exclusions: [
            'restaurant', 'mamak', 'kopitiam', 'food court', 'cat food',
            'dog food', 'pet food', 'watsons pharmacy', 'guardian pharmacy',
            'caring prescription', 'ubat', 'medicine', 'klinik', 'pet grooming', 'vet'
        ],
        confidence: 0.85
    },

    // ═══════════════════════════════════════════════════════════════════
    // 5. ENTERTAINMENT & LIFESTYLE
    // ═══════════════════════════════════════════════════════════════════
    'Entertainment & Lifestyle': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── Streaming & Subscriptions ──────────────────────────
            'netflix', 'spotify', 'youtube premium', 'disney+', 'hotstar',
            'viu', 'iqiyi', 'wetv', 'apple music', 'joox', 'bilibili',
            'crunchyroll', 'hbo go', 'amazon prime', 'sooka', 'tonton',
            'discord nitro', 'patreon', 'onlyfans', 'tiktok coins',
            'twitch', 'subscription', 'langganan', 'monthly subscription',
            'chatgpt plus', 'gemini advanced', 'claude pro', 'canva pro', 
            'microsoft 365', 'google one', 'apple one',
            // ── Cinema & Movies ────────────────────────────────────
            'gsc', 'tgv', 'dadi cinema', 'mmcineplexes', 'lfs cinemas',
            'aurum theatre', 'mbo', 'cinema', 'movie', 'wayang',
            'tiket wayang', 'tiket movie', 'popcorn',
            // ── Gaming ─────────────────────────────────────────────
            'steam', 'playstation', 'psn', 'xbox', 'nintendo', 'epic games',
            'roblox', 'mobile legends', 'mlbb', 'pubg', 'genshin impact',
            'valorant', 'riot points', 'codashop', 'garena', 'razer gold',
            'unipin', 'seagm', 'game topup', 'gaming', 'esports',
            'steam wallet', 'psn credit', 'xbox credit', 'cyber cafe', 'cc',
            // ── Karaoke ────────────────────────────────────────────
            'red box', 'neway', 'loud speaker', 'kbox', 'ceo karaoke', 'karaoke', 'ktv',
            // ── Recreation & Court Bookings ────────────────────────
            'bowling', 'billiards', 'snooker', 'escape room', 'laser tag',
            'roller skate', 'ice skating', 'concert', 'konsert', 'live show',
            'paintball', 'archery', 'rock climbing', 'go kart', 'trampoline',
            'sewa court', 'booking court', 'badminton court', 'futsal court', 
            'tennis court', 'basketball court', 'padang', 'sports arena', 'awana',
            'court futsal', 'court badminton', 'sewa kasut bowling',
            // ── Theme Parks ────────────────────────────────────────
            'sunway lagoon', 'genting', 'legoland', 'escape penang',
            'berjaya times square theme park', 'water park', 'taman tema',
            'zoo negara', 'zoo', 'aquaria', 'bird park', 'museum', 'muzium',
            'theme park', 'amusement park', 'melaka wonderland', 'a famosa',
            // ── Hobbies & Reading ──────────────────────────────────
            'kinokuniya', 'popular bookstore', 'mph', 'books', 'buku',
            'comic', 'komik', 'manga', 'board game', 'puzzle',
            'craft', 'art supplies', 'painting', 'diorama', 'figure', 'gunpla',
            'collection', 'hobby', 'hobi',
            // ── Gym & Fitness ──────────────────────────────────────
            'gym', 'fitness', 'celebrity fitness', 'true fitness', 'gymnation',
            'fitness first', 'anytime fitness', 'f45', 'crossfit',
            'yoga', 'pilates', 'zumba', 'gym membership', 'personal trainer',
            'protein', 'supplement gym', 'whey', 'creatine',
            // ── Pets ───────────────────────────────────────────────
            'pet lovers centre', 'pet smart', 'pet store', 'jojo pets',
            'royal canin', 'whiskas', 'purina', 'pedigree', 'smartheart',
            'cat food', 'dog food', 'pet food', 'fish food', 'bird food',
            'vet clinic', 'klinik haiwan', 'veterinary', 'vet',
            'pet grooming', 'grooming kucing', 'grooming anjing',
            'aquarium', 'cat litter', 'pasir kucing', 'pet', 'kucing', 'anjing',
            // ── Travel & Hotel ─────────────────────────────────────
            'hotel', 'airbnb', 'booking.com', 'agoda', 'resort', 'hostel',
            'travel package', 'pakej percutian', 'travel agent',
            'vacation', 'holiday', 'bercuti', 'percutian',
            'check in', 'check out', 'staycation', 'chalet', 'homestay',
            // ── General ────────────────────────────────────────────
            'entertainment', 'fun', 'leisure', 'lifestyle', 'hiburan', 'enjoy'
        ],
        exclusions: [],
        confidence: 0.88
    },

    // ═══════════════════════════════════════════════════════════════════
    // 6. HEALTHCARE
    // ═══════════════════════════════════════════════════════════════════
    'Healthcare': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── Hospital & Clinics ─────────────────────────────────
            'kpj', 'pantai hospital', 'columbia asia', 'gleneagles',
            'sunway medical', 'ijn', 'prince court', 'assunta', 'beacon hospital',
            'thomson hospital', 'avisena', 'mahkota medical', 'pantai ayer keroh',
            'hospital', 'emergency', 'a&e', 'ward', 'admission', 'opd',
            'klinik', 'clinic', 'klinik kesihatan', 'poliklinik', 'klinik mediviron',
            'megaklinik zahran', 'klinik anda', 'klinik ajwa',
            'doctor', 'doktor', 'specialist', 'pakar', 'pediatrician',
            'gynaecologist', 'gp', 'general practitioner',
            'mc', 'medical certificate', 'konsultasi', 'consultation',
            'checkup', 'pemeriksaan', 'flu', 'selesema', 'fever', 'demam',
            'cough', 'batuk', 'injection', 'suntikan', 'vaccine', 'vaksin',
            // ── Dental ─────────────────────────────────────────────
            'klinik gigi', 'dentist', 'dental', 'cabut gigi', 'tooth extraction',
            'braces', 'scaling', 'root canal', 'filling', 'crown', 'veneer',
            'teeth whitening', 'retainer', 'wisdom tooth', 'gigi bongsu',
            // ── Pharmacy & Medicine ────────────────────────────────
            'alpro', 'big pharmacy', 'ampm', 'aa pharmacy', 'rx pharmacy', 'joy pharmacy',
            'sunway multicare', 'health lane', 'caring', 'farmasi', 'pharmacy',
            'ubat', 'medicine', 'panadol', 'paracetamol', 'minyak angin', 'cap kapak',
            'cough syrup', 'ubat batuk', 'lozenge', 'strepsils', 'woods',
            'vitamin', 'supplement', 'blackmores', 'appeton', 'scott', 'flavettes',
            'antibiotic', 'antifungal', 'antiseptic', 'antihistamine',
            'eye drop', 'ear drop', 'nasal spray', 'inhaler',
            // ── Medical Procedures & Mental Health ─────────────────
            'blood test', 'ujian darah', 'urine test', 'scan', 'ultrasound',
            'mri', 'ct scan', 'xray', 'x-ray', 'ecg', 'echocardiogram',
            'colonoscopy', 'endoscopy', 'surgery', 'pembedahan',
            'operation', 'operasi', 'procedure', 'prosedur',
            'terapi', 'kaunseling', 'counseling', 'psychiatrist', 'psikiatri', 'psychologist',
            // ── Optical ────────────────────────────────────────────
            'focus point', 'a-look', 'pott glasses', 'optical', 'kedai cermin mata',
            'optometrist', 'spectacles', 'glasses', 'cermin mata', 'spek',
            'contact lens', 'kanta lekap', 'eye test', 'ujian mata', 'lens solution',
            // ── Wellness & Therapy ─────────────────────────────────
            'physiotherapy', 'fisioterapi', 'chiropractor', 'massage', 'urut',
            'bekam', 'cupping', 'acupuncture', 'akupunktur',
            'traditional medicine', 'herbal', 'sinseh',
            'reflexology', 'reflexologi', 'urut badan', 'therapy', 'terapi',
            // ── Medical Supplies ───────────────────────────────────
            'plaster', 'bandage', 'first aid', 'kit pertolongan cemas',
            'thermometer', 'termometer', 'blood pressure monitor', 'glucometer',
            'nebuliser', 'wheelchair', 'crutches', 'brace', 'knee support',
            'surgical mask', 'latex glove', 'medical equipment', 'cpr',
            // ── General ────────────────────────────────────────────
            'health', 'medical', 'kesihatan', 'rawatan', 'treatment'
        ],
        exclusions: ['pet grooming', 'vet', 'klinik haiwan', 'watsons beauty', 'guardian beauty'],
        confidence: 0.90
    },

    // ═══════════════════════════════════════════════════════════════════
    // 7. EDUCATION
    // ═══════════════════════════════════════════════════════════════════
    'Education': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── School & Kindergarten ──────────────────────────────
            'tadika', 'kindergarten', 'taska', 'kemas', 'pasti', 'brainy bunch',
            'sekolah', 'school', 'primary school', 'secondary school',
            'sekolah rendah', 'sekolah menengah', 'yuran pibg', 'yuran asrama',
            'school fee', 'baju sekolah', 'kasut sekolah', 'beg sekolah',
            'kelengkapan sekolah', 'bayar sekolah', 'yuran sekolah',
            // ── University & College ───────────────────────────────
            'uitm', 'um', 'ukm', 'usm', 'upm', 'utm', 'taylors',
            'sunway university', 'monash', 'inti', 'tarc', 'utar', 'msu',
            'segi', 'apiit', 'apu', 'mmu', 'utem', 'college', 'kolej',
            'politeknik', 'mara', 'ikm', 'university', 'universiti',
            'tuition fee', 'yuran pengajian', 'semester fee',
            // ── Tuition & Classes ──────────────────────────────────
            'tuition', 'tuisyen', 'kelas tambahan', 'kumon', 'smart reader',
            'seminar', 'webinar', 'training', 'latihan',
            'kursus', 'course', 'class', 'kelas', 'language class',
            'music class', 'art class', 'swimming lesson', 'driving lesson',
            // ── Online Learning ────────────────────────────────────
            'udemy', 'coursera', 'edx', 'skillshare', 'linkedin learning',
            'masterclass', 'pluralsight', 'tutorial', 'e-learning', 'online course',
            'short course', 'digital course',
            // ── Student Loans ──────────────────────────────────────
            'ptptn', 'mara loan', 'pinjaman pelajaran', 'biasiswa',
            'jpa', 'student loan', 'loan study', 'bayar ptptn',
            'bayar mara', 'scholarship repayment',
            // ── Exam Fees ──────────────────────────────────────────
            'exam fee', 'spm', 'stpm', 'muet', 'ielts', 'toefl',
            'upsr', 'pt3', 'registration fee', 'certification exam',
            'lcci', 'acca', 'cpa', 'exam registration',
            // ── Stationery & Supplies ──────────────────────────────
            'pen', 'pencil', 'pensel', 'notebook', 'buku nota', 'buku tulis',
            'kertas', 'paper', 'a4', 'file', 'folder', 'calculator',
            'kalkulator', 'casio', 'alat tulis', 'stationery', 'marker',
            'highlighter', 'ruler', 'scissors', 'gunting', 'glue', 'gam',
            'correction tape', 'stapler', 'punch hole', 'smo bookstore', 
            'pustaka rakyat', 'shopee books', 'dewan bahasa dan pustaka', 'dbp',
            // ── General ────────────────────────────────────────────
            'education', 'pendidikan', 'belajar', 'study', 'learning'
        ],
        exclusions: [],
        confidence: 0.88
    },

    // ═══════════════════════════════════════════════════════════════════
    // 8. FINANCIAL & OBLIGATIONS
    // ═══════════════════════════════════════════════════════════════════
    'Financial & Obligations': {
        transactionType: 'expense',
        priority: true,
        keywords: [
            // ── Insurance ──────────────────────────────────────────
            'aia', 'zurich', 'prudential', 'prubsn', 'great eastern',
            'allianz', 'etiqa', 'tokio marine', 'fwd', 'takaful ikhlas',
            'hong leong assurance', 'berjaya sompo', 'ammetlife', 'gibraltar', 'mcis',
            'life insurance', 'insurans', 'takaful', 'medical card',
            'premium', 'policy', 'polisi', 'hibah', 'personal accident',
            'pa insurance', 'term life', 'endowment',
            // ── Car Insurance ──────────────────────────────────────
            'car insurance', 'insurans kereta', 'motor insurance',
            'vehicle insurance', 'takaful kenderaan', 'allianz motor',
            'etiqa motor', 'kurnia', 'lonpac', 'pacific & orient',
            'comprehensive coverage', 'third party', 'pihak ketiga',
            // ── Taxes ──────────────────────────────────────────────
            'cukai pendapatan', 'income tax', 'lhdn', 'hasil', 'pcb', 'cukai lhdn',
            'sst', 'service tax', 'cukai perkhidmatan', 'gst',
            'tax payment', 'bayar cukai', 'tax return', 'efiling',
            // ── Zakat ──────────────────────────────────────────────
            'zakat', 'zakat fitrah', 'zakat pendapatan', 'zakat harta',
            'zakat perniagaan', 'ppz', 'lzs', 'maiamp', 'zakat emas',
            'bayar zakat', 'fitrah',
            // ── EPF & SOCSO ────────────────────────────────────────
            'epf', 'kwsp', 'socso', 'perkeso', 'eis', 'sip',
            'contribution', 'caruman', 'employer contribution',
            'kwsp contribution', 'voluntary contribution', 'i-saraan',
            // ── Loan Repayments ────────────────────────────────────
            'personal loan', 'car loan', 'hire purchase', 'ansuran kereta',
            'loan repayment', 'bayar loan', 'bayar ansuran',
            'credit card bill', 'credit card payment', 'bayar kad kredit',
            'overdraft', 'bank instalment', 'monthly instalment',
            'pinjaman peribadi', 'pinjaman kereta',
            // ── Bank Fees ──────────────────────────────────────────
            'bank charge', 'caj bank', 'annual fee', 'yuran tahunan',
            'processing fee', 'convenience fee', 'late charge', 'caj lewat',
            'transaction fee', 'transfer fee', 'service fee',
            'atm fee', 'maintenance fee bank', 'bank fee',
            // ── Fines & Penalties ──────────────────────────────────
            'saman', 'denda', 'fine', 'penalty', 'penalti', 'kompaun',
            'pdrm', 'traffic summon', 'mbpj saman', 'dbkl saman',
            'jpj saman', 'parking summon', 'speeding fine',
            // ── General ────────────────────────────────────────────
            'financial', 'obligation', 'kewangan', 'bayaran', 'payment'
        ],
        exclusions: [
            'cukai pintu', 'cukai tanah', 'assessment tax',
            'housing loan', 'mortgage', 'ptptn', 'mara loan'
        ],
        confidence: 0.90
    },

    // ═══════════════════════════════════════════════════════════════════
    // 9. DONATIONS & GIFTS
    // ═══════════════════════════════════════════════════════════════════
    'Donations & Gifts': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── Religious & Charity ────────────────────────────────
            'donation', 'derma', 'sedekah', 'sumbangan', 'tabung', 'sedekah jumaat',
            'masjid', 'mosque', 'surau', 'church', 'gereja', 'temple', 'kuil',
            'charity', 'ngo', 'mercy malaysia', 'aman palestin', 'mycare',
            'save the children', 'wwf', 'spca', 'beneficiary', 'infaq', 'infaq masjid',
            'wakaf', 'amal', 'derma masjid', 'tabung masjid', 'tabung palestin', 
            'gofundme', 'kitafund',
            // ── Festive Gifts ──────────────────────────────────────
            'duit raya bagi', 'angpao bagi', 'ang pow bagi', 'e-angpao bagi',
            'birthday gift bagi', 'hadiah hari jadi', 'wedding gift', 'duit kahwin',
            'christmas gift', 'deepavali gift', 'chinese new year gift',
            'balik raya', 'hamper', 'buah tangan', 'door gift',
            // ── Sponsorship ────────────────────────────────────────
            'sponsor', 'tajaan', 'sponsorship', 'patronage',
            'reward given', 'ganjaran', 'prize given',
            // ── General ────────────────────────────────────────────
            'gift', 'hadiah bagi', 'pemberian', 'charity', 'amal'
        ],
        exclusions: [],
        confidence: 0.88
    },

    // ═══════════════════════════════════════════════════════════════════
    // 10. MISCELLANEOUS
    // ═══════════════════════════════════════════════════════════════════
    'Miscellaneous': {
        transactionType: 'expense',
        priority: false,
        keywords: [
            // ── Personal Transfers & E-Wallets ─────────────────────
            'duit kopi', 'tips', 'hutang', 'bayar balik', 'bayar hutang',
            'transfer', 'pindahan', 'duit syiling', 'baki', 'paw', 'belanja kawan',
            'topup wallet', 'reload wallet', 'tng topup', 'boost topup',
            'grabpay topup', 'touch n go', 'boost', 'grabpay',
            'bigpay', 'fave', 'shopeepay', 'mae', 'tng ewallet', 'setel topup',
            'apple pay', 'samsung pay',
            // ── Lost & Scam ────────────────────────────────────────
            'lost money', 'hilang duit', 'scam', 'tertipu', 'fraud', 'scam alert',
            'penipuan', 'phishing', 'stolen', 'kecurian', 'missing money',
            // ── General ────────────────────────────────────────────
            'misc', 'others', 'other', 'lain-lain', 'random', 'unknown', 'caj tak dikenali',
            'pelbagai', 'etc', 'miscellaneous', 'not sure', 'something else'
        ],
        exclusions: [],
        confidence: 0.40
    },

    // ═══════════════════════════════════════════════════════════════════
    // INCOME CATEGORIES
    // ═══════════════════════════════════════════════════════════════════

    // ── 1. Salary ──────────────────────────────────────────────────────
    'Salary': {
        transactionType: 'income',
        priority: true,
        keywords: [
            'salary', 'gaji', 'gaji bulanan', 'monthly salary', 'paycheck',
            'payslip', 'net pay', 'gross pay', 'gaji pokok', 'basic salary',
            'gaji bersih', 'gaji gomen', 'government salary', 'civil servant pay',
            'bonus', 'bonus tahunan', 'annual bonus', 'performance bonus',
            'incentive', 'insentif', 'kpi bonus', 'hari raya bonus',
            'year end bonus', 'bonus gaji',
            'allowance', 'elaun', 'elaun makan', 'elaun perjalanan',
            'elaun telefon', 'housing allowance', 'car allowance',
            'per diem', 'daily allowance', 'pocket money', 'wang saku',
            'overtime', 'ot', 'extra hours', 'kerja lebih masa',
            'weekend work', 'public holiday pay', 'shift allowance',
            'epf withdrawal', 'kwsp pengeluaran', 'kwsp i-sinar',
            'kwsp i-citra', 'pengeluaran khas', 'akaun 2 kwsp',
            'pcb refund', 'tax refund', 'refund lhdn', 'socso claim', 'eis claim',
            'tuntutan', 'claim mileage', 'claim medical',
            'wages', 'upah', 'pendapatan', 'income', 'payroll', 'gaji masuk'
        ],
        exclusions: ['freelance', 'grab driver', 'foodpanda', 'commission', 'rental'],
        confidence: 0.90
    },

    // ── 2. Freelance ───────────────────────────────────────────────────
    'Freelance': {
        transactionType: 'income',
        priority: true,
        keywords: [
            'grab driver', 'grabdriver', 'grab rider', 'grabrider',
            'grab express', 'grab income', 'grab earnings', 'e-hailing income',
            'lalamove', 'lalamove driver', 'borzo', 'goget',
            'foodpanda rider', 'delivery rider', 'rider income',
            'shopee express', 'ninjavan', 'j&t', 'poslaju rider',
            'bungkusit rider', 'delivery income', 'rider earnings',
            'project', 'projek', 'freelance project', 'contract work',
            'upwork', 'fiverr', 'freelancer.com', 'guru.com', 'peopleperhour',
            'design work', 'coding', 'programming', 'web design', 'upah design', 'upah repair',
            'photography', 'videography', 'video editing', 'content creation',
            'writing', 'penulisan', 'translation', 'terjemahan',
            'commission', 'komisen', 'komisen jualan', 'sales commission',
            'agent', 'agen', 'insurance agent', 'property agent',
            'dropship', 'dropshipping', 'dropship komisen', 'shopee affiliate', 'tiktok affiliate',
            'tiktok shop affiliate', 'komisen affiliate',
            'involve asia', 'lazada affiliate', 'referral', 'referral income',
            'affiliate marketing', 'makeup artist', 'mua', 'wedding planner',
            'tutor', 'tuition teacher', 'guru tuisyen', 'online tutor',
            'teaching income', 'pendapatan mengajar', 'kelas tuisyen',
            'private tutor', 'music teacher', 'sports coach', 'coaching',
            'freelance', 'kerja bebas', 'part time', 'kerja sambilan',
            'gig', 'side income', 'pendapatan sampingan'
        ],
        exclusions: [],
        confidence: 0.90
    },

    // ── 3. Investment ──────────────────────────────────────────────────
    'Investment': {
        transactionType: 'income',
        priority: false,
        keywords: [
            'dividend', 'dividen', 'interest', 'faedah', 'profit sharing',
            'hibah tabung haji', 'unit trust return', 'asb dividend', 'asnb dividend',
            'kwsp dividend', 'th dividend', 'public mutual dividend',
            'fixed deposit return', 'fd return', 'simpanan tetap return',
            'bank interest', 'savings interest',
            'stock', 'saham', 'etf', 'capital gain', 'bursa',
            'rakuten trade', 'moomoo', 'mplus', 'hlib', 'cgs-cimb',
            'kenanga', 'shariah stock', 'blue chip', 'sell stock',
            'unit trust', 'amanah saham', 'asb', 'asn', 'asw', 'asm', 'asnb',
            'tabung haji', 'th', 'public mutual', 'principal asset',
            'affin hwang', 'kenanga investors', 'wahed', 'stashaway',
            'versa', 'kdi', 'mytheo', 'akamate',
            'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'kripto',
            'luno', 'binance', 'bybit', 'huobi', 'sinegy', 'tokenize',
            'cryptocurrency', 'defi', 'nft', 'staking reward', 'mining',
            'gold', 'emas', 'pamp', 'kijang emas', 'hello gold',
            'public gold', 'maybank gold', 'cimb cgha', 'gold selling', 'jual emas',
            'rental income', 'sewa rumah terima', 'kutipan sewa', 'tenant payment',
            'airbnb income', 'property income', 'room rental income',
            'investment', 'pelaburan', 'return', 'pulangan', 'profit',
            'keuntungan', 'passive income'
        ],
        exclusions: [],
        confidence: 0.88
    },

    // ── 4. Gift ────────────────────────────────────────────────────────
    'Gift': {
        transactionType: 'income',
        priority: false,
        keywords: [
            'duit raya', 'angpao', 'ang pow', 'e-angpao',
            'raya money', 'gong xi', 'chinese new year money',
            'deepavali gift received', 'christmas gift received',
            'salam kaut', 'wedding angpao', 'birthday gift received',
            'duit hantaran', 'mas kahwin',
            'str', 'sumbangan tunai rahmah', 'bkm', 'br1m', 'brim',
            'epemula', 'ebelia', 'dana bantuan', 'bantuan awal persekolahan',
            'bap', 'wang ehsan', 'bantuan kerajaan', 'government aid',
            'bantuan sara hidup', 'bsh', 'program bantuan', 'subsidi',
            'family support', 'parents', 'ibu bapa', 'duit dari ibu',
            'duit dari bapa', 'duit dari suami', 'duit dari isteri',
            'kasi duit', 'belanja', 'allowance from family', 'support from parents',
            'duit belanja', 'tajaan pelajaran', 'tajaan',
            'gift received', 'hadiah terima', 'pemberian'
        ],
        exclusions: [],
        confidence: 0.85
    },

    // ── 5. Other Income ────────────────────────────────────────────────
    'Other Income': {
        transactionType: 'income',
        priority: false,
        keywords: [
            'refund', 'pulangan wang', 'cashback', 'pulangan tunai',
            'rebate', 'rebat', 'shopback', 'claim refund', 'refund shopee',
            'returned money', 'duit dipulangkan', 'bayar balik duit',
            'insurance claim', 'warranty claim', 'product return',
            'sell', 'jual', 'jual barang', 'preloved', 'second hand',
            'sell preloved', 'carousell sell', 'trade in',
            'garage sale', 'jual kereta', 'jual motor', 'jual laptop',
            'jual telefon', 'jual emas', 'recycle', 'kitar semula',
            'jualan garaj', 'car boot sale', 'jualan car boot',
            'found money', 'jumpa duit', 'lucky draw', 'cabutan bertuah',
            'prize', 'hadiah menang', 'competition prize', 'survey reward',
            'points redemption', 'voucher received', 'duit lebih',
            'other income', 'misc income', 'pendapatan lain',
            'extra income', 'side money'
        ],
        exclusions: [],
        confidence: 0.70
    }
};

// ─── Export ──────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
    module.exports = malaysianCategoryPatterns;
}

if (typeof window !== 'undefined') {
    window.malaysianCategoryPatterns = malaysianCategoryPatterns;
    console.log(
        '✅ Category patterns loaded (' +
        Object.keys(malaysianCategoryPatterns).length +
        ' categories)'
    );
}