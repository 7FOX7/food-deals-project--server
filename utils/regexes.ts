import { ProductCategories } from "./types"

// type FoodTypes = ReadonlyArray<"Fresh Produce" | "Meat & Seafood" | "Dairy & Eggs" | "Frozen & Prepared Foods" | "Bakery & Breakfast" | "Snacks & Sweets" | "Pantry & Essentials">

// "Fresh Produce" regex
const freshProduceRegex = /\b(apples?|bananas?|oranges?|grapes?|cherr(y|ies)|peach(es)?|plums?|pears?|kiwis?|pineapples?|mangos?|melons?|cantaloupes?|lemons?|limes?|avocados?|tomato(s|es)?|cucumbers?|peppers?|carrots?|broccoli|cauliflower|spinach|kale|lettuce|arugula|beets?|radish(es)?|beans?|peas?|zucchini|eggplants?|potatoes?|onions?|garlic|corn|asparagus|brussels?| sprouts?|artichokes?|celery|mushrooms?|cabbage|bok choy|turnips?|parsnips?|chives?|dill|basil|cilantro|parsley|thyme|mint|tarragon|jicama|plantains?|lychee|persimmon|kumquat|guava|figs?|dates?|pomegranates?|carambola|buddha's hand|calamondin|yuzu|kohlrabi|celeriac|endive|edamame|chayote|lotus root|fiddleheads?|black truffles?|berr(y|ies)|vegetables?|greens|culinary herbs|sprouts)\b/i

// "Meat & Seafood" regex
const meatProductsRegex = /\b(meat|beef|pork|chicken|turkey|lamb|goat|duck|venison|rabbit|bacon|ham|sausage|salami|prosciutto|chorizo|meatballs|steaks?|filet mignon|brisket|ribs|cutlets|tenderloin|crown roast|spareribs|taco meat|bologna|drumsticks|thighs|fish|salmon|tuna|trout|cod|haddock|halibut|sardines?|mackerel|tilapia|catfish|shrimp|prawns|lobster|crabs?|scallops|clams|oysters|mussels|squid|octopus|crawfish|langoustine|fish roe|caviar|sushi|ceviche|tartar|fish fillet|seafood|shellfish|whitefish|carp|bass|snapper|flounder|perch|barramundi|swordfish|mahi-mahi|rockfish|monkfish|grouper|anchovies|kelp|bisons?|elks?|wagyu|chops?|lamb|bear)\b/i

// "Dairy & Eggs" regex
const dairyProductsRegex = /\b(milk|cheese|yogurt|cream|cottage cheese|ricotta|mozzarella|parmesan|cheddar|gouda|brie|feta|provolone|mascarpone|kefir|gelato|eggs?|omelette|quiche|frittata|custard|soufflé|cheesecake|dairy|butter|falooda|lactose|rognoni|formaggi|guffanti)\b/i

// "Frozen & Prepared Foods" regex
const frozenProductsRegex = /\b(frozen|prepared|ready|sambhar|patty|chaat|pav|jalebi)\b/i

// "Bakery & Breakfast" regex
const bakeryProductsRegex = /\b(breads?|buns?|croissants?|bagels?|muffins?|scones?|pancakes?|waffles?|toasts?|biscuits?|danish(es)?|pastry|pastries|rolls?|cakes?|brownies?|cookies?|doughnuts?|pies?|tarts?|quiche|granola|cereal|oats?|porridge|breakfast|jam|jelly|syrup|smoothie bowl|cinnamon roll|coffee|sourdough|flatbread|ciabatta|focaccia|samosas?|vada pav|dilbahaar|sub|cannolis?|tortillas?|focaccias?)\b/i

// "Snacks & Sweets" regex
const snacksProductsRegex = /\b(chips|pretzels|popcorn|cakes?|nachos|cheese puffs|nuts?|trail mix|snacks?|bars?|chocolates?|brownies|cookies?|biscotti|macarons|meringues?|pudding|gelato|sorbet|gum|bubblegum|cand(y|ies)?|lollipops|taffy|marshmallows?|snickers?|milky way|twix|kit kat|caramel|s'mores|churros|biscuits?|mini quiches|dried fruits?|motichur laddu|kulfi rolls?|rasgullas|burfi|gulab jamun|burger|dhoklas?|pakoras?|tikkis?|puri)\b/i

// "Pantry & Essentials" regex
const pantryProductsRegex = /\b(oils?|vinegar|sauces?|ketchup|mustard|mayonnaise|salad|honey|agave nectar|sugar|powder|salt|black pepper|white pepper|cayenne pepper|paprika|cumin|oregano|basil|thyme|rosemary|sage|parsley|cilantro|ginger|turmeric|cinnamon|cloves|cardamom|extract|baking soda|yeast|flour|bread|cornstarch|rice|pasta|quinoa|couscous|barley|cereal|dried beans|lentils|chickpeas|jelly|jam|seeds?|coffee|tea|spices|pani puri|papri chaat|bhel puri|babaghanouj|lasagna|noodles?)\b/i

// will be storing function body (we will be using it when creating a function with 'Function' constructor)
// NOTE: we wrap "${ProductCategories.FrozenAndPrepared}" in quotes so the value returned is a string
export const getProductCategory__funcBody = `
    // based on the product title, return product category
    if (${frozenProductsRegex}.test(productTitle)) return "${ProductCategories.FrozenAndPrepared}"
    else if (${dairyProductsRegex}.test(productTitle)) return "${ProductCategories.DairyAndEggs}"
    else if (${snacksProductsRegex}.test(productTitle)) return "${ProductCategories.SnacksAndSweets}"
    else if (${bakeryProductsRegex}.test(productTitle)) return "${ProductCategories.BakeryAndBreakfast}"
    else if (${meatProductsRegex}.test(productTitle)) return "${ProductCategories.MeatAndSeafood}"
    else if (${pantryProductsRegex}.test(productTitle)) return "${ProductCategories.PantryAndEssentials}"
    else if (${freshProduceRegex}.test(productTitle)) return "${ProductCategories.FreshProduce}"
    // will be returned if none of the categories match
    else return "${ProductCategories.NoCategory}"
`

// we will be matching product details against this regex to get the units info
// get units match 

// NOTE: 
// \b ... \b - word boundary (the whole word should match the pattern)
// (\d+(\s+)?(\.|\-)(\s+)?)? - optional number that comes BEFORE the decimal point, or `-`
// (\d+) - any number of digits (this might be either a single number), or the second number after decimal `.` or range `-`
// (\s+)? - any number of whitespaces (if any)
// (\/(\s+)?)? - optional `/` with a space (if any) after it that will match: 44/kg and 44/  kg 
// (kg|g|ea|ml|l|gm|pk|cnt|packs?|lb|litre|piece|oz) - the pattern should match one of those words

// - result: 
// `44ml` - pass
// `44           g` - pass (any number of whitespaces)
// `44 hello g` - fail (only whitespaces between number and unit are allowed)
// `1 grade 44 g` - only `44 g` will pass (because there is a word boundary)
// `44-256 ML` - pass (`-` is allowed between the digits)
// `17.24 kg` - pass (`.` is allowed between the digits)
export const unitsRegex = /\b(\d+(\s+)?(\.|\-|x|×|\/)(\s+)?)?(\d+)(\s+)?(\/(\s+)?)?(kg|g|ea|ml|l|gm|pk|cnt|packs?|lb|litre|piece|oz|cans?|pcs?)\b/ig