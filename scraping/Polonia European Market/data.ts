import { Products } from "../../utils/types" 

// we will be storing food categories: 
// NOTE: food categories MUST match 'FoodTypes' type from our client app
enum ProductCategories {
    FreshProduce = "Fresh Produce",
    MeatAndSeafood = "Meat & Seafood", 
    DairyAndEggs = "Dairy & Eggs", 
    FrozenAndPrepared = "Frozen & Prepared Foods", 
    BakeryAndBreakfast = "Bakery & Breakfast", 
    SnacksAndSweets = "Snacks & Sweets", 
    PantryAndEssentials = "Pantry & Essentials", 

    // this category will be used as a placeholder for the product 
    // whose food category does not match any of the above (DON'T USE IT IN YOUR client app)
    NoCategory = "[NO CATEGORY]"
}

const getData = async (): Promise<Products> => {
    const products: Products = [
        { 
            imageUri: "my image", 
            title: "Pierogies (assorted: meat, cheddar, sauerkraut, cottage cheese)", primaryPrice: "$6.99 / 8pcs, $9.99 / 12pcs", 
            units: "8pcs, 12pcs", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pate in bun - PASZTECIKI z mięsem", 
            primaryPrice: "$19.90", 
            units: "10pcs", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Potato Dumplings", 
            primaryPrice: "$2.99", 
            units: "6pcs", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Cabbage Rolls with tomato sauce - GOŁĄBKI", 
            primaryPrice: "$1.69 / 100g, $7.68 / lb", 
            units: "100g", 
            category: ProductCategories.SnacksAndSweets
        },
        { 
            imageUri: "my image", 
            title: "Roasted Potatoes - GRILLOWANE ZIEMNIAKI", 
            primaryPrice: "$1.49 / 100g, $6.77 / lb", 
            units: "100g", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pork Stew - GULASZ WIEPRZOWY", 
            primaryPrice: "$1.99 / 100g, $9.05 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Beef Stew - GULASZ WOŁOWY", 
            primaryPrice: "$2.19 / 100g, $9.95 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Stew with veggies", 
            primaryPrice: "$2.19 / 100g, $9.95 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pork Schnitzel - KOTLET SCHABOWY", 
            primaryPrice: "$1.99 / 100g, $9.05 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Schnitzel - KOTLET DROBIOWY", 
            primaryPrice: "$2.19 / 100g, $9.95 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Roasted Pork Loin - SCHAB PIECZONY", 
            primaryPrice: "$1.99 / 100g, $9.05 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Polish Hunter's Stew - BIGOS", 
            primaryPrice: "$1.69 / 100g, $7.68 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Breton Beans - FASOLKA PO BRETOŃSKU", 
            primaryPrice: "$1.49 / 100g, $6.77 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Ground Pork Cutlet - MIELONY", 
            primaryPrice: "$1.99 / 100g, $9.05 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pork Skewer - PATYCZKI wieprzowe", 
            primaryPrice: "$1.99 / 100g, $9.05 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Skewer - PATYCZKI drobiowe", 
            primaryPrice: "$2.19 / 100g, $9.95 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Cutlet with Veggies", 
            primaryPrice: "$2.19 / 100g, $9.95 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pork Roulade with Bacon, Carrot, Pickle", 
            primaryPrice: "$1.99 / 100g, $9.05 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Roulade with Spinach, Ricotta", 
            primaryPrice: "$2.19 / 100g, $9.95 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Devolaille", 
            primaryPrice: "$2.19 / 100g, $9.95 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Baked Breaded Haddock", 
            primaryPrice: "$2.49 / 100g, $13.59 / lb", 
            units: "100g, lb", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Croquettes with Sauerkraut & Mushroom", 
            primaryPrice: "$3.99", 
            units: "pc", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Croquettes with Meat", 
            primaryPrice: "$3.49", 
            units: "pc", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Croquettes with Cheese & Mushroom", 
            primaryPrice: "$3.99", 
            units: "pc", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Sweet Crepes with Cheese", 
            primaryPrice: "$3.49", 
            units: "pc", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pork Terrine (8oz / 250ml)", 
            primaryPrice: "$3.49", 
            units: "pc", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Terrine (8oz / 250ml)", 
            primaryPrice: "$3.49", 
            units: "pc", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Ham Sandwich (customized)", 
            primaryPrice: "$4.99", 
            units: "pc", 
            category: ProductCategories.BakeryAndBreakfast
        },
        { 
            imageUri: "my image", 
            title: "Schnitzel Sandwich (pork or chicken)", 
            primaryPrice: "$8.99", 
            units: "pc", 
            category: ProductCategories.BakeryAndBreakfast
        },
        { 
            imageUri: "my image", 
            title: "Lunch Box (potatoes + meat + salad)", 
            primaryPrice: "$9.99", 
            units: "pc", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Barley Soup - KRUPNIK", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Broccoli Cream - BROKUŁOWA", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Chicken Noodle Soup - ROSÓŁ", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Forest Mushroom Soup - GRZYBOWA", 
            primaryPrice: "$5.99 / 16oz, $9.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Mushroom Soup - PIECZARKOWA", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pickle Soup - OGÓRKOWA", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Pure Red Borscht - BARSZCZ CZERWONY", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Sour Cabbage Soup - KAPUŚNIAK", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Sour Rye Soup - ŻUREK", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Tomato Soup - POMIDOROWA", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Ukrainian Borscht - BARSZCZ UKRAIŃSKI", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        },
        { 
            imageUri: "my image", 
            title: "Vegetable Soup - JARZYNOWA", 
            primaryPrice: "$4.99 / 16oz, $7.99 / 32oz", 
            units: "16oz, 32oz", 
            category: ProductCategories.FrozenAndPrepared
        }
    ]

    return products
}


export default getData