// we will be storing food categories: 
// NOTE: food categories MUST match 'FoodTypes' type from our client app
export enum ProductCategories {
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

// will be representing a single product 
export type Product = {
    imageUri: string, 
    title: string, 
    primaryPrice: string,  
    units: string, 
    // will be storing ONE of the food categories
    category: ProductCategories,     
}

// will be storing products for store X
export type Products = Product[]

/**
 * Will be storing a function for fetching product data for each store
*/
export type ProductData = {
    "Walmart": () => Promise<Products>, 
    "No Frills - Supermarket": () => Promise<Products>,  
    "Dollarama": () => Products,  
    "Busy Bee Food Mart": () => Promise<Products>,  
    "Outlet Collection at Niagara - Pepper Palace": () => Promise<Products>, 
    "Your Deli": () => Promise<Products>, 
    "Plaza Fiesta Latin Groceries & Cafe": () => Promise<Products>,  
    "Ryan's No Frills": () => Promise<Products>,  
    "Antipastos": () => Promise<Products>,  
    "Giant Tiger": () => Promise<Products>,  
    "Zest Mart": () => Products,                // no data for this store
    "FreshCo": () => Promise<Products>, 
    // TODO: implement
    "Food Basics": () => Promise<Products>,  
    "Metro Lakeshore": () => Promise<Products>,   
    "La Paisana Latin Groceries": () => Promise<Products>,   
    "Al Noor": () => Products,                  // no data for this store
    "Sobeys": () => Promise<Products>, 
    "B & R European Deli": () => Products,      // no data for this store
    "Roman Cheese": () => Promise<Products>,  
    "Dinh Dinh Asian Foods": () => Products,    // no data for this store  
    "Independent Grocery Store - Hendriks": () => Promise<Products>,  
    "Yogibear's Jellystone Park Camp Resort- Ice Cream/Convenience Store": () => Products,  
    "Commisso's Fresh Food": () => Promise<Products>, 
    "Farm Boy": () => Promise<Products>, 
    "Thai Binh Asian Food": () => Products,  
    "The Red Barn Farm Market and Bakery": () => Products,  
    "Independent Grocery store - Phil's": () => Products,  
    "Charlie Asian Grocery Inc.": () => Products,  
    "Patty's Delights Peruvian Culinary": () => Products,  
    "Gallagher's": () => Products,  
    "Raja Grocers": () => Products,  
    "Peanut Mill": () => Products,  
    "Joe's Your Independent Grocer": () => Products,  
    "The Indian Valley": () => Products,  
    "Real Canadian Superstore": () => Products,  
    "Bodner's Market": () => Products,  
    "Food Basket": () => Products,  
    "The Healthy Cupboard": () => Products,  
    "Costco Wholesale": () => Products,  
    "Brandon's No Frills": () => Promise<Products>,  
    "Pupo's Food Market": () => Products,  
    "The New Food Box": () => Products,  
    "Kim's Variety": () => Products,  
    "Bombay Mart": () => Products,  
    "Polonia European Market & Deli": () => Products,  
    "Eastern Food Market": () => Products,  
    "Foodland": () => Products,  
    "Lococo's": () => Products,  
    "Zehrs": () => Promise<Products>,  
    "Walmart Supercentre": () => Promise<Products>,  
    "Avondale": () => Products,  
    "Vineland Foodland - Supermarket": () => Products,  
    "Pistachio's": () => Products,  
    "Jim's No Frills": () => Promise<Products>,  
    "Metro": () => Promise<Products>,  
    "Mark's No Frills": () => Promise<Products>,  
    "Chippawa Foodland": () => Products,  
    "Wholesale Club": () => Products,  
    "Ebeano Super Market": () => Products,  
}