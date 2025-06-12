import { ProductCategories } from "./types"

// type FoodTypes = ReadonlyArray<"Fresh Produce" | "Meat & Seafood" | "Dairy & Eggs" | "Frozen & Prepared Foods" | "Bakery & Breakfast" | "Snacks & Sweets" | "Pantry & Essentials">

// "Fresh Produce" regex
const freshProduceRegex = /(apples?|bananas?|oranges?|grapes?|cherr(y|ies)|peach(es)?|plums?|pears?|kiwis?|pineapples?|mangos?|melons?|cantaloupes?|lemons?|limes?|avocados?|tomato(s|es)?|cucumbers?|peppers?|carrots?|broccoli|cauliflower|spinach|kale|lettuce|arugula|beets?|radish(es)?|beans?|peas?|zucchini|eggplants?|potatoes?|onions?|garlic|corn|asparagus|brussels sprouts?|artichokes?|celery|mushrooms?|cabbage|bok choy|turnips?|parsnips?|chives?|dill|basil|cilantro|parsley|thyme|mint|tarragon|jicama|plantains?|lychee|persimmon|kumquat|guava|figs?|dates?|pomegranates?|carambola|buddha's hand|calamondin|yuzu|kohlrabi|celeriac|endive|edamame|chayote|lotus root|fiddleheads?|black truffles?|berr(y|ies)|vegetables?|greens|culinary herbs|sprouts)/i

// "Meat & Seafood" regex
const meatProductsRegex = /(beef|pork|chicken|turkey|lamb|goat|duck|venison|rabbit|bacon|ham|sausage|salami|prosciutto|chorizo|meatballs|steak|filet mignon|brisket|ribs|cutlets|tenderloin|crown roast|spareribs|taco meat|bologna|drumsticks|thighs|fish|salmon|tuna|trout|cod|haddock|halibut|sardines|mackerel|tilapia|catfish|shrimp|prawns|lobster|crab|scallops|clams|oysters|mussels|squid|octopus|crawfish|langoustine|fish roe|caviar|sushi|ceviche|tartar|tuna steak|fish fillet|seafood|shellfish|whitefish|carp|bass|snapper|flounder|perch|barramundi|swordfish|mahi-mahi|rockfish|monkfish|grouper|anchovies|kelp)/i

// "Dairy & Eggs" regex
const dairyProductsRegex = /(milk|cheese|yogurt|cream|cottage cheese|ricotta|mozzarella|parmesan|cheddar|gouda|brie|feta|provolone|mascarpone|kefir|gelato|eggs?|omelette|quiche|frittata|custard|soufflé|cheesecake|dairy|butter)/i

// "Frozen & Prepared Foods" regex
const frozenProductsRegex = /(frozen|prepared|ready)/i

// "Bakery & Breakfast" regex
const bakeryProductsRegex = /(breads?|croissants?|bagels?|muffins?|scones?|pancakes?|waffles?|toasts?|biscuits?|danish(es)?|pastry|pastries|rolls?|cakes?|brownies?|cookies?|doughnuts?|pies?|tarts?|quiche|granola|cereal|oatmeal|porridge|breakfast|jam|jelly|honey|syrup|smoothie bowl|cinnamon roll|coffee|sourdough|flatbread|ciabatta|focaccia)/i

// "Snacks & Sweets" regex
const snacksProductsRegex = /(chips|pretzels|popcorn|cakes?|nachos|cheese puffs|nuts?|trail mix|snacks?|bars?|chocolates?|brownies|cookies?|biscotti|macarons|meringues?|pudding|gelato|sorbet|gummy bears|cand(y|ies)?|lollipops|taffy|marshmallows?|snickers?|milky way|twix|kit kat|caramel|s'mores|churros|biscuits?|mini quiches|dried fruits?)/i

// "Pantry & Essentials" regex
const pantryProductsRegex = /(oils?|vinegar|sauces?|ketchup|mustard|mayonnaise|salad dressing|honey|agave nectar|sugar|powder|salt|black pepper|white pepper|cayenne pepper|paprika|cumin|oregano|basil|thyme|rosemary|sage|parsley|cilantro|ginger|turmeric|cinnamon|cloves|cardamom|extract|baking soda|yeast|flour|bread|cornstarch|rice|pasta|quinoa|couscous|barley|oats|cereal|dried beans|lentils|chickpeas|jelly|jam|seeds|coffee|tea|spices)/i

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