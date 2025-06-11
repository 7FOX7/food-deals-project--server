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
            title: "Pork & Beef Cabbage Rolls",
            primaryPrice: "6.99",
            units: "400 g, 1.75/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Vegetarian Cabbage Rolls",
            primaryPrice: "6.49",
            units: "400 g, 1.62/100g",
            category: ProductCategories.FreshProduce
        },
        {
            imageUri: "my image", 
            title: "Pork Schnitzel (Breaded)",
            primaryPrice: "5.49",
            units: "180 g, 3.05/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Chicken Schnitzel (Breaded)",
            primaryPrice: "5.99",
            units: "180 g, 3.33/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Sausage & Sauerkraut Stew",
            primaryPrice: "4.99",
            units: "320 g, 1.56/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Grilled Pork Meat on a Stick",
            primaryPrice: "3.99",
            units: "150 g, 2.66/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Pork Aspic (Head Cheese)",
            primaryPrice: "4.49",
            units: "200 g, 2.25/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Potato Pancake (Latke)",
            primaryPrice: "2.29",
            units: "120 g, 1.91/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Homestyle Veggie Salad",
            primaryPrice: "3.79",
            units: "250 g, 1.52/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Gourmet Soup - Chicken Noodle",
            primaryPrice: "4.29",
            units: "400 mL, 1.07/100mL",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Fresh Ground Pork",
            primaryPrice: "5.49",
            units: "500 g, 1.10/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Mennonite Roaster Chicken (Whole)",
            primaryPrice: "14.99",
            units: "1.5 kg, 1.00/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Mennonite Roaster Rabbit (Whole)",
            primaryPrice: "16.99",
            units: "1.2 kg, 1.41/100g",
            category: ProductCategories.MeatAndSeafood
        },
        {
            imageUri: "my image", 
            title: "Frozen Pelmeni - Pork",
            primaryPrice: "7.99",
            units: "700 g, 1.14/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Homestyle Dumplings - Potato",
            primaryPrice: "5.49",
            units: "600 g, 0.91/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Cheddar & Potato Pierogies",
            primaryPrice: "4.99",
            units: "650 g, 0.77/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Meat-Filled Tortellini",
            primaryPrice: "6.99",
            units: "500 g, 1.40/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Frozen Puff Pastry Dough",
            primaryPrice: "3.29",
            units: "450 g, 0.73/100g",
            category: ProductCategories.FrozenAndPrepared
        },
        {
            imageUri: "my image", 
            title: "Farm Style Cottage Cheese",
            primaryPrice: "3.49",
            units: "300 g, 1.16/100g",
            category: ProductCategories.DairyAndEggs
        },
        {
            imageUri: "my image", 
            title: "Old Country Sour Cream",
            primaryPrice: "2.49",
            units: "250 mL, 1.00/100mL",
            category: ProductCategories.DairyAndEggs
        },
        {
            imageUri: "my image", 
            title: "Mild Cheddar Cheese",
            primaryPrice: "6.49",
            units: "400 g, 1.62/100g",
            category: ProductCategories.DairyAndEggs
        },
        {
            imageUri: "my image", 
            title: "Loose Black Tea",
            primaryPrice: "3.99",
            units: "200 g, 2.00/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Traditional Rye Bread Loaf",
            primaryPrice: "3.49",
            units: "600 g, 0.58/100g",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Russian Mustard",
            primaryPrice: "2.29",
            units: "250 mL, 0.91/100mL",
            category: ProductCategories.PantryAndEssentials
        },
        {
            imageUri: "my image", 
            title: "Chocolate Wafer Cake",
            primaryPrice: "2.99",
            units: "150 g, 1.99/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Zephyr Marshmallow",
            primaryPrice: "3.49",
            units: "200 g, 1.75/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Assorted European Candies",
            primaryPrice: "4.99",
            units: "300 g, 1.66/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Chocolate Covered Prunes",
            primaryPrice: "5.29",
            units: "250 g, 2.12/100g",
            category: ProductCategories.SnacksAndSweets
        },
        {
            imageUri: "my image", 
            title: "Honey & Nut Bar",
            primaryPrice: "1.99",
            units: "60 g, 3.32/100g",
            category: ProductCategories.SnacksAndSweets
        }
    ];

    return products
}


export default getData