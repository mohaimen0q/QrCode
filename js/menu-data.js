// Venecia menu content, transcribed from "VENECIA MENU.pdf".
// To change a dish or a price, edit it here — the page rebuilds itself from this list.
// n = name, p = price in dinar, d = description (optional), d2 = second description line (optional)
// nEn / dEn / d2En / titleEn = the same text in English, shown when the customer switches language
// img = photo (optional): put the file at assets/dishes/<img>.jpg and add img: "<img>" to the dish.
window.VENECIA_MENU = [
  {
    id: "soups",
    title: "الشوربات",
    titleEn: "Soups",
    items: [
      { img: "soups-01", n: "تشكن كريم", p: 20, d: "دجاج - كريم - فطر", nEn: "Chicken Cream", dEn: "Chicken - cream - mushroom" },
      { img: "soups-02", n: "جمبري", p: 25, d: "شوربة جمبري", nEn: "Shrimp", dEn: "Shrimp soup" },
      { img: "soups-03", n: "فينيسيا", p: 30, d: "فواكه بحر - كريمة", nEn: "Venecia", dEn: "Seafood - cream" }
    ]
  },
  {
    id: "starters",
    title: "المقبلات الساخنة",
    titleEn: "Hot Starters",
    items: [
      { img: "starters-01", n: "بروسكيتا", p: 15, d: "3 قطع خبز محمص مع الجبنة والطماطم والبيستو", nEn: "Bruschetta", dEn: "3 pieces of toasted bread with cheese, tomato and pesto" },
      { img: "starters-02", n: "ميني كالزوني فونغي", p: 10, d: "جبنة و فقاع مع خضار", nEn: "Mini Calzone Funghi", dEn: "Cheese and mushrooms with vegetables" },
      { img: "starters-03", n: "ميني كالزوني تشكن", p: 12, d: "جبنة و دجاج", nEn: "Mini Calzone Chicken", dEn: "Cheese and chicken" },
      { img: "starters-04", n: "ميني كالزوني تن", p: 12, d: "جبنة وتن", nEn: "Mini Calzone Tuna", dEn: "Cheese and tuna" },
      { img: "starters-05", n: "مشكل ميني كالزوني", p: 30, d: "دجاج - تن - فونغي", nEn: "Mixed Mini Calzone", dEn: "Chicken - tuna - funghi" },
      { img: "starters-06", n: "موزاريلا فينقرز", p: 30, d: "5 أصابع موزاريلا مقلية", nEn: "Mozzarella Fingers", dEn: "5 fried mozzarella fingers" },
      { img: "starters-07", n: "تشيكن ستريبس", p: 30, d: "قطع دجاج مقلية", nEn: "Chicken Strips", dEn: "Fried chicken pieces" },
      { img: "starters-08", n: "سردين مقلي", p: 25, nEn: "Fried Sardines" },
      { img: "starters-09", n: "قرنيط", p: 38, d: "قطع القرنيط الطازج مع الخضروات والصوص الحار", nEn: "Octopus", dEn: "Fresh octopus pieces with vegetables and spicy sauce" }
    ]
  },
  {
    id: "salads",
    title: "السلطات",
    titleEn: "Salads",
    items: [
      { img: "salads-01", n: "يونانية", p: 28, d: "خيار - فلفل حلو - بصل - جبنة الفيتا - زيتون", nEn: "Greek", dEn: "Cucumber - sweet pepper - onion - feta cheese - olives" },
      { img: "salads-02", n: "تونا", p: 25, d: "خس - جرجير - طماطم - خيار - فلفل حلو - كبار - تن - زيتون", nEn: "Tuna", dEn: "Lettuce - arugula - tomato - cucumber - sweet pepper - capers - tuna - olives" },
      { img: "salads-03", n: "روكولا", p: 20, d: "جرجير - برمجان - زيتون", nEn: "Rucola", dEn: "Arugula - parmesan - olives" },
      { img: "salads-04", n: "ايطاليانا", p: 30, d: "خس - جرجير - طماطم - خيار - موزاريلا - تفاح - زيتون", nEn: "Italiana", dEn: "Lettuce - arugula - tomato - cucumber - mozzarella - apple - olives" },
      { img: "salads-05", n: "كابريزي", p: 28, d: "موزاريلا طازجة - طماطم - ريحان - زيت زيتون", nEn: "Caprese", dEn: "Fresh mozzarella - tomato - basil - olive oil" },
      { img: "salads-06", n: "سلطة سيزر", p: 30, d: "صوص السيزر - خبز محمص - قطع دجاج - موزاريلا - برمجان", nEn: "Caesar Salad", dEn: "Caesar sauce - croutons - chicken pieces - mozzarella - parmesan" },
      { img: "salads-07", n: "فروتي دي ماري", p: 35, d: "خس - ثمار البحر - خلطة ايطالية", nEn: "Frutti di Mare", dEn: "Lettuce - seafood - Italian mix" }
    ]
  },
  {
    id: "pasta",
    title: "الباستا",
    titleEn: "Pasta",
    items: [
      { img: "pasta-01", n: "البومودورو", p: 30, d: "صلصلة الطماطم", nEn: "Al Pomodoro", dEn: "Tomato sauce" },
      { img: "pasta-02", n: "ارابياتا", p: 30, d: "صلصلة الطماطم الحارة", nEn: "Arrabbiata", dEn: "Spicy tomato sauce" },
      { img: "pasta-03", n: "البيستو", p: 45, d: "دجاج - صوص الريحان - برمجان", nEn: "Al Pesto", dEn: "Chicken - basil sauce - parmesan" },
      { img: "pasta-04", n: "بيانكا", p: 30, d: "زيت زيتون - ثوم - برمجان - بقدونس", nEn: "Bianca", dEn: "Olive oil - garlic - parmesan - parsley" },
      { img: "pasta-05", n: "كانيلوني", p: 45, d: "باللحم المفروم - البشاميل - موزاريلا", nEn: "Cannelloni", dEn: "Minced meat - béchamel - mozzarella" },
      { img: "pasta-06", n: "تارتوفو نيرو", p: 55, d: "صوص الترفاس - قطع لحم فيليه - كريمة - بارميجان", nEn: "Tartufo Nero", dEn: "Truffle sauce - beef fillet pieces - cream - parmesan" },
      { img: "pasta-07", n: "كاربونارا", p: 35, d: "قطع السلامي - صفار بيض - برمجان", nEn: "Carbonara", dEn: "Salami pieces - egg yolk - parmesan" },
      { img: "pasta-08", n: "دى فونجي", p: 38, d: "صوص الكريم - الفطر - برمجان", nEn: "Di Funghi", dEn: "Cream sauce - mushrooms - parmesan" },
      { img: "pasta-09", n: "الفريدو", p: 45, d: "صوص الالفريدو - دجاج - الفطر - برمجان", nEn: "Alfredo", dEn: "Alfredo sauce - chicken - mushrooms - parmesan" },
      { img: "pasta-10", n: "بولونيزي", p: 45, d: "بصلصة الطماطم مع لحم المفروم", nEn: "Bolognese", dEn: "Tomato sauce with minced meat" },
      { img: "pasta-11", n: "كواترو فورماجي", p: 40, d: "اربع اجبان موزاريلا - شيدر - جبنة مدخنة - بارميجان", nEn: "Quattro Formaggi", dEn: "Four cheeses: mozzarella - cheddar - smoked cheese - parmesan" },
      { img: "pasta-12", n: "لازانيا", p: 45, d: "باللحم المفروم - البشاميل - موزاريلا", nEn: "Lasagna", dEn: "Minced meat - béchamel - mozzarella" },
      { img: "pasta-13", n: "بوتانيسكا", p: 35, d: "صوص الطماطم - انشوجة - فلفل حار", nEn: "Puttanesca", dEn: "Tomato sauce - anchovies - chili pepper" },
      { img: "pasta-14", n: "كون مانزو", p: 50, d: "صوص وردي - قطع اللحم - فلفل حلو - زيتون", nEn: "Con Manzo", dEn: "Pink sauce - beef pieces - sweet pepper - olives" },
      { img: "pasta-15", n: "فروتي دى ماري", p: 50, d: "صوص الطماطم - فواكه بحر", nEn: "Frutti di Mare", dEn: "Tomato sauce - seafood" },
      { img: "pasta-16", n: "دى قمبري", p: 55, d: "صوص وردي - القمبري - الكافيار", nEn: "Di Gamberi", dEn: "Pink sauce - shrimp - caviar" },
      { img: "pasta-17", n: "كون سلمون", p: 55, d: "صوص وردي - قطع السلمون", nEn: "Con Salmone", dEn: "Pink sauce - salmon pieces" }
    ]
  },
  {
    id: "risotto",
    title: "الريزوتو",
    titleEn: "Risotto",
    items: [
      { img: "risotto-01", n: "دي فونغي", p: 38, d: "صوص الكريم - الفطر - برمجان", nEn: "Di Funghi", dEn: "Cream sauce - mushrooms - parmesan" },
      { img: "risotto-02", n: "كواترو فورماجي", p: 40, d: "صوص الكريم - جبنة مدخنة - موزاريلا - برمجان - شيدر", nEn: "Quattro Formaggi", dEn: "Cream sauce - smoked cheese - mozzarella - parmesan - cheddar" },
      { img: "risotto-03", n: "تشيكن فونغي", p: 45, d: "صوص الكريم - دجاج - الفطر - برمجان", nEn: "Chicken Funghi", dEn: "Cream sauce - chicken - mushrooms - parmesan" },
      { img: "risotto-04", n: "فروتي دي ماري", p: 50, d: "صوص الطماطم الحار خلطة ثمار البحر", nEn: "Frutti di Mare", dEn: "Spicy tomato sauce with mixed seafood" },
      { img: "risotto-05", n: "كون جمبريتو", p: 55, d: "صوص وردي - جمبري - كافيار", nEn: "Con Gamberetto", dEn: "Pink sauce - shrimp - caviar" }
    ]
  },
  {
    id: "meat",
    title: "اللحوم",
    titleEn: "Meat",
    items: [
      { img: "meat-01", n: "دي نيرو", p: 62, d: "فيليه مشوي - الكريم - حبات الفلفل الاسود + خضار مطهوة", nEn: "Di Nero", dEn: "Grilled fillet - cream - black peppercorns + cooked vegetables" },
      { img: "meat-02", n: "سيلفاجو", p: 65, d: "فيليه بصوص حار - كريم - فطر - خضار مقلية - خضار مطهوة", d2: "الخضار المقلية: كوسة - بتنجان - فلفل حلو", nEn: "Selvaggio", dEn: "Fillet in spicy sauce - cream - mushrooms - fried vegetables - cooked vegetables", d2En: "Fried vegetables: zucchini - eggplant - sweet pepper" },
      { img: "meat-03", n: "ليوني", p: 65, d: "فيليه مشوي - بصوص البصل + خضار مطهوة", nEn: "Leoni", dEn: "Grilled fillet - onion sauce + cooked vegetables" },
      { img: "meat-04", n: "دى فونغي", p: 65, d: "فيليه بصوص الكريم والفطر + خضار مطهوة", nEn: "Di Funghi", dEn: "Fillet in cream and mushroom sauce + cooked vegetables" },
      { img: "meat-05", n: "بيكانتو", p: 65, d: "صلصلة الكريم مع خضروات مشوية مطحونة + خضار مطهوة", nEn: "Piccanto", dEn: "Cream sauce with ground grilled vegetables + cooked vegetables" },
      { img: "meat-06", n: "كوستيليا خروف مشوي", p: 75, d: "أرز + بطاطا", nEn: "Grilled Lamb Chops", dEn: "Rice + potatoes" }
    ]
  },
  {
    id: "chicken",
    title: "الدجاج",
    titleEn: "Chicken",
    items: [
      { img: "chicken-01", n: "دي فونغي", p: 50, d: "صدر دجاج مشوي - صوص الكريم و الفطر", nEn: "Di Funghi", dEn: "Grilled chicken breast - cream and mushroom sauce" },
      { img: "chicken-02", n: "زنجارا", p: 50, d: "صدر دجاج مشوي - صوص - خضار مقلية - خضار مطهوة", d2: "الخضار المقلية: كوسة - بتنجان - فلفل حلو", nEn: "Zingara", dEn: "Grilled chicken breast - sauce - fried vegetables - cooked vegetables", d2En: "Fried vegetables: zucchini - eggplant - sweet pepper" },
      { img: "chicken-03", n: "ليموني", p: 50, d: "صدر دجاج مشوي - صوص الكريم والليمون - خضار مطهوة", nEn: "Limone", dEn: "Grilled chicken breast - cream and lemon sauce - cooked vegetables" },
      { img: "chicken-04", n: "بولو ليوني", p: 50, d: "صدر دجاج مشوي بصوص الباربكيو + خضار مطهوة", nEn: "Pollo Leoni", dEn: "Grilled chicken breast in barbecue sauce + cooked vegetables" }
    ]
  },
  {
    id: "fish",
    title: "الأسماك",
    titleEn: "Seafood",
    items: [
      { img: "fish-01", n: "جمبري مشوي", p: 60, d: "6 قطع جمبري مشوي - أرز - تشيبس", nEn: "Grilled Shrimp", dEn: "6 grilled shrimp - rice - fries" },
      { img: "fish-02", n: "جمبري ليموني", p: 65, d: "جمبري مع صوص الكريم و الليمون - أرز - تشيبس", nEn: "Lemon Shrimp", dEn: "Shrimp with cream and lemon sauce - rice - fries" },
      { img: "fish-03", n: "كلماري و جمبري مقلي", p: 70, d: "كلمار - 3 قطع جمبري - أرز - تشيبس", nEn: "Fried Calamari & Shrimp", dEn: "Calamari - 3 shrimp - rice - fries" },
      { img: "fish-04", n: "كلماري مقلي", p: 65, d: "كلمار مقلي - أرز - تشيبس", nEn: "Fried Calamari", dEn: "Fried calamari - rice - fries" },
      { img: "fish-05", n: "جمبري مقلي", p: 65, d: "جمبري مقلي - أرز - تشيبس", nEn: "Fried Shrimp", dEn: "Fried shrimp - rice - fries" },
      { img: "fish-06", n: "مشكل سمك", p: 75, d: "شرائح سمك مشوي - جمبري مشوي - أرز - خضار", nEn: "Mixed Fish", dEn: "Grilled fish fillets - grilled shrimp - rice - vegetables" }
    ]
  },
  {
    id: "pizza",
    title: "البيتزا",
    titleEn: "Pizza",
    items: [
      { img: "pizza-01", n: "مارغريتا", p: 28, d: "صلصة الطماطم - موزاريلا", nEn: "Margherita", dEn: "Tomato sauce - mozzarella" },
      { img: "pizza-02", n: "تشيبولا", p: 30, d: "صلصة الطماطم - موزاريلا - بصل - زيتون", nEn: "Cipolla", dEn: "Tomato sauce - mozzarella - onion - olives" },
      { img: "pizza-03", n: "روكولا", p: 30, d: "صلصة طماطم - موزاريلا - جرجير - زيتون", nEn: "Rucola", dEn: "Tomato sauce - mozzarella - arugula - olives" },
      { img: "pizza-04", n: "نابوليتانا", p: 35, d: "صلصة الطماطم - موزاريلا - انشوجة - زيتون", nEn: "Napoletana", dEn: "Tomato sauce - mozzarella - anchovies - olives" },
      { img: "pizza-05", n: "فوريستا", p: 35, d: "صلصة الطماطم - موزاريلا - فطر - زيتون", nEn: "Foresta", dEn: "Tomato sauce - mozzarella - mushrooms - olives" },
      { img: "pizza-06", n: "بيبيروني", p: 38, d: "صلصة الطماطم - موزاريلا - سلامي - زيتون", nEn: "Pepperoni", dEn: "Tomato sauce - mozzarella - salami - olives" },
      { img: "pizza-07", n: "دي تونو", p: 38, d: "صلصة الطماطم - موزاريلا - تن - فلفل حلو - بصل - زيتون", nEn: "Di Tonno", dEn: "Tomato sauce - mozzarella - tuna - sweet pepper - onion - olives" },
      { img: "pizza-08", n: "مكسيكانا", p: 38, d: "صلصة الطماطم - موزاريلا - دجاج - بصل + فلفل حلو", d2: "فلفل حار + فقاع + زيتون", nEn: "Mexicana", dEn: "Tomato sauce - mozzarella - chicken - onion + sweet pepper", d2En: "Chili pepper + mushrooms + olives" },
      { img: "pizza-09", n: "باربكيو تشيكن", p: 38, d: "صلصة الطماطم - موزاريلا - دجاج - صوص الباربكيو", d2: "جبنة مدخنة - فلفل حلو - زيتون", nEn: "Barbecue Chicken", dEn: "Tomato sauce - mozzarella - chicken - barbecue sauce", d2En: "Smoked cheese - sweet pepper - olives" },
      { img: "pizza-10", n: "فيجيتاريانا", p: 35, d: "صلصة الطماطم - موزاريلا - بصل - فقاع - كوسة - بتنجان", d2: "فلفل حلو - زيتون", nEn: "Vegetariana", dEn: "Tomato sauce - mozzarella - onion - mushrooms - zucchini - eggplant", d2En: "Sweet pepper - olives" },
      { img: "pizza-11", n: "كواترو فورماجي", p: 35, d: "صلصة بيضاء - موزاريلا - شيدر - برمجان - جبنة مدخنة", nEn: "Quattro Formaggi", dEn: "White sauce - mozzarella - cheddar - parmesan - smoked cheese" },
      { img: "pizza-12", n: "كواترو ستاجيوني", p: 35, d: "صلصة الطماطم - موزاريلا - دجاج - خضروات - فقاع", d2: "سلامي - زيتون", nEn: "Quattro Stagioni", dEn: "Tomato sauce - mozzarella - chicken - vegetables - mushrooms", d2En: "Salami - olives" },
      { img: "pizza-13", n: "جمبريتو", p: 45, d: "صلصة الطماطم - موزاريلا - جمبري - جرجير - زيتون", nEn: "Gamberetto", dEn: "Tomato sauce - mozzarella - shrimp - arugula - olives" },
      { img: "pizza-14", n: "فروتي دى ماري", p: 45, d: "صلصة الطماطم موزاريلا - فواكه البحر - زيتون - جرجير", nEn: "Frutti di Mare", dEn: "Tomato sauce - mozzarella - seafood - olives - arugula" },
      { img: "pizza-15", n: "بيانكا دي بولو", p: 40, d: "صلصة بيضاء - دجاج - ذرة - بصل مكرمل - فطر", nEn: "Bianca di Pollo", dEn: "White sauce - chicken - corn - caramelized onion - mushrooms" },
      { img: "pizza-16", n: "بانوزو دي بولو", p: 30, d: "ساندوتش - دجاج - جبنة - صوص بيستو - بطاطا مقلية", nEn: "Panuozzo di Pollo", dEn: "Sandwich - chicken - cheese - pesto sauce - fries" }
    ]
  },
  {
    id: "dessert",
    title: "تحلية",
    titleEn: "Desserts",
    items: [
      { img: "dessert-01", n: "تشيز كيك لوتس", p: 18, nEn: "Lotus Cheesecake" },
      { img: "dessert-02", n: "تشيز كيك بستاشيو", p: 18, nEn: "Pistachio Cheesecake" },
      { img: "dessert-03", n: "بانوفي", p: 18, nEn: "Banoffee" },
      { img: "dessert-04", n: "ايس كريم", p: 15, d: "نكهتين", nEn: "Ice Cream", dEn: "Two flavours" }
    ]
  }
];
