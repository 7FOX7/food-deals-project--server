import { db } from "./firebase-config"
import { collection, doc, setDoc } from "firebase/firestore"
import {schedule} from "node-cron"
import {ProductData} from "./utils/types"
import {STORE_NAMES} from "./utils/constants"

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

// TODO: create an object which is going to contain names of stores as keys
// and an async function for fetching (or scraping) product data as values
const productData: ProductData = {
    // NOTE: 
    // - `data` is shared between all stores that start with `Walmart` (they contain the same products anyway)
    "Walmart": () => import("./scraping/Walmart/data").then(mod => mod.default()),   
    "No Frills - Supermarket": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Dollarama": () => [{
        imageUri: "No Frills - Supermarket", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Busy Bee Food Mart": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Outlet Collection at Niagara - Pepper Palace": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Your Deli": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Plaza Fiesta Latin Groceries & Cafe": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Ryan's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Antipastos": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Giant Tiger": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Zest Mart": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "FreshCo": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Food Basics": () => import("./scraping/Food Basics/data").then(mod => mod.default()), 
    "Metro Lakeshore": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "La Paisana Latin Groceries": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Al Noor": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Sobeys": () => [{
        imageUri: "Sobeys", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "B & R European Deli": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Roman Cheese": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Dinh Dinh Asian Foods": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Independent Grocery Store - Hendriks": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Yogibear's Jellystone Park Camp Resort- Ice Cream/Convenience Store": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Commisso's Fresh Food": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Farm Boy": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Thai Binh Asian Food": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "The Red Barn Farm Market and Bakery": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Independent Grocery store - Phil's": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Charlie Asian Grocery Inc.": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Patty's Delights Peruvian Culinary": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Gallagher's": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Raja Grocers": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Peanut Mill": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Joe's Your Independent Grocer": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "The Indian Valley": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Real Canadian Superstore": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Bodner's Market": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Food Basket": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "The Healthy Cupboard": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Costco Wholesale": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Brandon's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Pupo's Food Market": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "The New Food Box": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Kim's Variety": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Bombay Mart": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Polonia European Market & Deli": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Eastern Food Market": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Foodland": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Lococo's": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Zehrs": () => import("./scraping/Zehrs/data").then(mod => mod.default()), 
    // NOTE: 
    // - `data` is shared between all stores that start with `Walmart` (they contain the same products anyway)
    "Walmart Supercentre": () => import("./scraping/Walmart/data").then(mod => mod.default()),   
    "Avondale": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Vineland Foodland - Supermarket": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Pistachio's": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Jim's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Metro": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Mark's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Chippawa Foodland": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Wholesale Club": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Ebeano Super Market": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],    
}

// will be updating products every night at 3AM
function updateProducts() {
    console.log("will promise to update products at 3AM")

    // schedule a cron job to run every night at 3AM
    schedule("28 * * * *", async () => {
        try {
            // get the products 
            for (let storeName of STORE_NAMES) {
                // skip adding products for this store as it will break our loop
                if (storeName === "Yogibear's Jellystone Park Camp Resort- Ice Cream/Convenience Store") continue
                // get products
                const products = await productData[storeName]()
                // create a collection reference
                const collectionRef = collection(db, "/stores-and-products")
                
                // add products to the document: 
                await setDoc(doc(collectionRef, storeName), { products })
            }
            // log a message after adding all stores and products
            console.log("Successfully added all stores and products!")
        }
        catch (err: any) {
            console.error("Failed to update products: " + err.message)
        }
    })
}

async function testProducts() {
    console.log("will promise to execute!")
    try {
        const products = await productData["Food Basics"]()
        console.log("products: " + JSON.stringify(products))
        console.log("products length: " + products.length)
    }
    catch (err: any) {
        console.error("failed to update products: " + err.me)
    }   
}

testProducts()
// updateProducts()

/*
    1. Question: firebase-config.ts file - will I be able to to import the variables from it in my APIs, or not (when preparing my project for production)?
    2. Why do I even care? : because, APIs as not part of our Expo project, will be served from a host provider, and knowing if I can 'remember' those file paths will help me to figure out if I need to add 'firebase config' to the server file (index.ts / cached-products.ts) directly, or can create a reference for it. 

   

    Possible answer: 
    - Let's first discuss about host providers and how they work: 
    - Server provider is usually a remote version of our code, that is hosted not on our machine (local host) but on the remote server (internet).

    - In order to add the local workspace to the remote server you need to create a folder that would contain the 'build' of your local directory. That 'build' folder (which contains files and folders you specify in the build config) is sent to the remote hoster

    - Which means, you can also add all other files to that folder, and => you don't need to store everything in one file

    - At that point you have your server up and running, you receive a url, to which you can now refer, and by sending a request to the remote server, you can expect the same behaviour as if the server was hosted on your local machine in the form of a 'index.ts', 'cached-products+api.ts' files. 
    

    => No, you DON'T need to pull everything to a single file, you can still have 'firebase config' in a separate file, and import variables from it, because your 'build' folder will be a representation of your current workspace, and, when added to the server, it will be served as it is. 
*/