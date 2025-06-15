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
        // Bakery & Breakfast
        {
            imageUri: "my image", 
            title: "Small Coffee & Muffin Combo",
            primaryPrice: "$2.49",
            units: "340 mL + 100 g muffin",
            category: ProductCategories.BakeryAndBreakfast
        },
        {
            imageUri: "my image", 
            title: "Chocolate Chip Muffin",
            primaryPrice: "$1.49",
            units: "110 g, 1.35/100g",
            category: ProductCategories.BakeryAndBreakfast
        },
        {
            imageUri: "my image", 
            title: "Cheese Croissant",
            primaryPrice: "$2.29",
            units: "95 g, 2.41/100g",
            category: ProductCategories.BakeryAndBreakfast
        },
        {
            imageUri: "my image", 
            title: "Cinnamon Roll",
            primaryPrice: "$2.19",
            units: "120 g, 1.83/100g",
            category: ProductCategories.BakeryAndBreakfast
        },

        // Snacks & Sweets
        {
            imageUri: "my image", 
            title: "KitKat Chocolate Bar",
            primaryPrice: "$1.25",
            units: "45 g, 2.78/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Gummy Bears - Assorted Candy Bag",
            primaryPrice: "$1.99",
            units: "180 g, 1.11/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Twizzlers Strawberry",
            primaryPrice: "$1.79",
            units: "160 g, 1.12/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Skittles Fruit Candy",
            primaryPrice: "$1.99",
            units: "191 g, 1.04/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Reese's Peanut Butter Cups",
            primaryPrice: "$1.39",
            units: "42 g, 3.31/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "M&M's Chocolate Candies",
            primaryPrice: "$1.99",
            units: "200 g, 1.00/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Gummy Worms - Assorted",
            primaryPrice: "$1.89",
            units: "150 g, 1.26/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Pringles Original Chips - Small Can",
            primaryPrice: "$2.29",
            units: "130 g, 1.76/100g",
            category: ProductCategories.SnacksAndSweets
        },

        // Dairy & Eggs
        {
            imageUri: "my image", 
            title: "2% Milk",
            primaryPrice: "$2.49",
            units: "1 L, 0.25/100mL",
            category: ProductCategories.DairyAndEggs
        },
        {
            imageUri: "my image", 
            title: "String Cheese Snacks",
            primaryPrice: "$4.29",
            units: "168 g, 2.55/100g",
            category: ProductCategories.DairyAndEggs
        },
        {
            imageUri: "my image", 
            title: "Yogurt Cup - Strawberry",
            primaryPrice: "$1.39",
            units: "100 g, 1.39/100g",
            category: ProductCategories.DairyAndEggs
        },
        {
            imageUri: "my image", 
            title: "Mild Cheddar Cheese Block",
            primaryPrice: "$4.99",
            units: "250 g, 2.00/100g",
            category: ProductCategories.DairyAndEggs
        },
        {
            imageUri: "my image", 
            title: "Large White Eggs",
            primaryPrice: "$3.49",
            units: "12 eggs",
            category: ProductCategories.DairyAndEggs
        },

        // Frozen & Prepared Foods
        {
            imageUri: "my image", 
            title: "Microwave Burrito - Beef & Bean",
            primaryPrice: "$2.79",
            units: "142 g, 1.96/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Frozen Breakfast Sandwich",
            primaryPrice: "$3.49",
            units: "156 g, 2.24/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Frozen Butter Chicken Meal",
            primaryPrice: "$5.99",
            units: "320 g, 1.87/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Frozen Lasagna - Single Serve",
            primaryPrice: "$4.49",
            units: "280 g, 1.60/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Mini Frozen Pizza - Pepperoni",
            primaryPrice: "$3.99",
            units: "200 g, 2.00/100g",
            category: ProductCategories.FrozenAndPrepared
        },

        {
            imageUri: "my image", 
            title: "Instant Noodles - Chicken",
            primaryPrice: "$0.99",
            units: "85 g, 1.16/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Peanut Butter - Smooth",
            primaryPrice: "$3.79",
            units: "500 g, 0.76/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "White Bread Loaf",
            primaryPrice: "$2.29",
            units: "675 g, 0.34/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Mac & Cheese Box",
            primaryPrice: "$1.49",
            units: "200 g, 0.75/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Strawberry Jam",
            primaryPrice: "$2.99",
            units: "250 mL, 1.20/100mL",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Canned Tuna in Water",
            primaryPrice: "$1.79",
            units: "170 g, 1.05/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Salted Crackers",
            primaryPrice: "$2.29",
            units: "200 g, 1.14/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Canned Soup - Chicken Noodle",
            primaryPrice: "$2.19",
            units: "284 mL, 0.77/100mL",
            category: ProductCategories.PantryAndEssentials
        }
    ]

    return products
}


export default getData