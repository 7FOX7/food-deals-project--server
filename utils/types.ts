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
    "Thai Binh Asian Food": () => Products,     // no data for this store       
    "The Red Barn Farm Market and Bakery": () => Products,      // no data for this store  
    "Independent Grocery store - Phil's": () => Promise<Products>,  
    "Charlie Asian Grocery Inc.": () => Products,               // no data for this store  
    "Patty's Delights Peruvian Culinary": () => Products,       // no data for this store
    "Gallagher's": () => Promise<Products>,   
    "Raja Grocers": () => Promise<Products>,
    "Peanut Mill": () => Promise<Products>, 
    "Joe's Your Independent Grocer": () => Promise<Products>, 
    "The Indian Valley": () => Products,        // no data for this store
    "Real Canadian Superstore": () => Promise<Products>, 
    "Bodner's Market": () => Products,          // no data for this store
    "Food Basket": () => Promise<Products>,  
    "The Healthy Cupboard": () => Products,     // no data for this store
    "Costco Wholesale": () => Promise<Products>,
    "Brandon's No Frills": () => Promise<Products>,  
    "Pupo's Food Market": () => Products,       // no data for this store
    "The New Food Box": () => Promise<Products>,  
    "Kim's Variety": () => Products,            // no data for this store
    "Bombay Mart": () => Promise<Products>,  
    "Polonia European Market & Deli": () => Promise<Products>, 
    "Eastern Food Market": () => Promise<Products>,   
    "Foodland": () => Promise<Products>,
    "Lococo's": () => Promise<Products>,
    "Zehrs": () => Promise<Products>,  
    "Walmart Supercentre": () => Promise<Products>,  
    "Avondale": () => Products,         // no data for this store
    "Vineland Foodland - Supermarket": () => Promise<Products>,  
    "Pistachio's": () => Products,  
    "Jim's No Frills": () => Promise<Products>,  
    "Metro": () => Promise<Products>,  
    "Mark's No Frills": () => Promise<Products>,  
    "Chippawa Foodland": () => Promise<Products>,
    "Wholesale Club": () => Products,  
    "Ebeano Super Market": () => Products,  
}