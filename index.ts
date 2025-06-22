import { db } from "./firebase-config"
import { collection, doc, setDoc } from "firebase/firestore"
import {schedule} from "node-cron"
import {ProductData} from "./utils/types"
import {STORE_NAMES} from "./utils/constants"

// TODO: create an object which is going to contain names of stores as keys
// and an async function for fetching (or scraping) product data as values
const productData: ProductData = {
    // NOTE: 
    // - `data` is shared between all stores that start with `Walmart` (they contain the same products anyway)
    "Walmart": () => import("./scraping/Walmart/data").then(mod => mod.default()),   
    "No Frills - Supermarket": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Dollarama": () => import("./scraping/Dollarama/data").then(mod => mod.default()),
    "Busy Bee Food Mart": () => import("./scraping/Busy Bee/data").then(mod => mod.default()),
    "Outlet Collection at Niagara - Pepper Palace": () => import("./scraping/Pepper Palace/data").then(mod => mod.default()),
    "Your Deli": () => import("./scraping/Your Deli/data").then(mod => mod.default()),
    "Plaza Fiesta Latin Groceries & Cafe": () => import("./scraping/Plaza Fiesta/data").then(mod => mod.default()),
    "Ryan's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Antipastos": () => import("./scraping/Antipastos/data").then(mod => mod.default()),
    "Giant Tiger": () => import("./scraping/Giant Tiger/data").then(mod => mod.default()),
    "Zest Mart": () => import("./scraping/Zest Mart/data").then(mod => mod.default()),
    "FreshCo": () => import("./scraping/FreshCo/data").then(mod => mod.default()), 
    "Food Basics": () => import("./scraping/Food Basics/data").then(mod => mod.default()), 
    "Metro Lakeshore": () => import("./scraping/Metro/data").then(mod => mod.default()),
    "La Paisana Latin Groceries": () => import("./scraping/La Paisana/data").then(mod => mod.default()),
    "Al Noor": () => import("./scraping/Al Noor/data").then(mod => mod.default()),
    "Sobeys": () => import("./scraping/Sobeys/data").then(mod => mod.default()),
    "B & R European Deli": () => [],    // no data for this store
    "Roman Cheese": () => import("./scraping/Roman Cheese/data").then(mod => mod.default()),
    "Dinh Dinh Asian Foods": () => import("./scraping/Dinh Dinh/data").then(mod => mod.default()), 
    "Independent Grocery Store - Hendriks": () => import("./scraping/Independent Grocery/data").then(mod => mod.default()),
    "Yogibear's Jellystone Park Camp Resort- Ice Cream/Convenience Store": () => [],    // no data for this store
    "Commisso's Fresh Food": () => import("./scraping/Commisso's Fresh Food/data").then(mod => mod.default()),
    "Farm Boy": () => import("./scraping/Farm Boy/data").then(mod => mod.default()),
    "Thai Binh Asian Food": () => import("./scraping/Thai Binh/data").then(mod => mod.default()),
    "The Red Barn Farm Market and Bakery": () => import("./scraping/The Red Barn/data").then(mod => mod.default()),  
    "Independent Grocery store - Phil's": () => import("./scraping/Independent Grocery/data").then(mod => mod.default()),
    "Charlie Asian Grocery Inc.": () => [],  // no data for this store 
    "Patty's Delights Peruvian Culinary": () => [],         // no data for this store  
    "Gallagher's": () => import("./scraping/Gallagher's/data").then(mod => mod.default()),
    "Raja Grocers": () => import("./scraping/Raja Grocers/data").then(mod => mod.default()),
    "Peanut Mill": () => import("./scraping/Peanut Mill/data").then(mod => mod.default()),
    "Joe's Your Independent Grocer": () => import("./scraping/Independent Grocery/data").then(mod => mod.default()),
    "The Indian Valley": () => [],          // no data for this store  
    "Real Canadian Superstore": () => import("./scraping/Superstore/data").then(mod => mod.default()),
    "Bodner's Market": () => [],            // no data for this store 
    "Food Basket": () => import("./scraping/Food Basket/data").then(mod => mod.default()),
    "The Healthy Cupboard": () => [],       // no data for this store  
    "Costco Wholesale": () => import("./scraping/Costco Wholesale/data").then(mod => mod.default()),
    "Brandon's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Pupo's Food Market": () => [],     // no data for this store  
    "The New Food Box": () => import("./scraping/New Food Box/data").then(mod => mod.default()),
    "Kim's Variety": () => [],          // no data for this store 
    "Bombay Mart": () => import("./scraping/Bombay Mart/data").then(mod => mod.default()),
    "Polonia European Market & Deli": () => import("./scraping/Polonia European Market/data").then(mod => mod.default()),
    "Eastern Food Market": () => import("./scraping/Eastern Food Market/data").then(mod => mod.default()),
    // NOTE: 
    // - `data` is shared between all stores that contain the word `Foodland` (they contain the same products anyway)
    "Foodland": () => import("./scraping/Foodland/data").then(mod => mod.default()),
    "Lococo's": () => import("./scraping/Lococo's/data").then(mod => mod.default()),
    "Zehrs": () => import("./scraping/Zehrs/data").then(mod => mod.default()), 
    "Walmart Supercentre": () => import("./scraping/Walmart/data").then(mod => mod.default()),   
    "Avondale": () => [],           // no data for this store 
    "Vineland Foodland - Supermarket": () => import("./scraping/Foodland/data").then(mod => mod.default()),
    "Pistachio's": () => [],         // this store doesn't sell any food  
    "Jim's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Metro": () => import("./scraping/Metro/data").then(mod => mod.default()),
    "Mark's No Frills": () => import("./scraping/No Frills/data").then(mod => mod.default()),
    "Chippawa Foodland": () => import("./scraping/Foodland/data").then(mod => mod.default()),
    "Wholesale Club": () => import("./scraping/Wholesale Club/data").then(mod => mod.default()),
    "Ebeano Super Market": () => import("./scraping/Ebeano Super Market/data").then(mod => mod.default()),
}

// will be updating products every night at 3AM
function updateProducts() {
    console.log("will promise to update products at 3AM")

    // schedule a cron job to run every night at 3AM
    schedule("8 * * * *", async () => {
        try {
            // get the products 
            for (let storeName of STORE_NAMES) {
                // skip adding products for this store as it will break our loop
                if (storeName === "Yogibear's Jellystone Park Camp Resort- Ice Cream/Convenience Store") continue
                // skip adding products for this store
                if (storeName === "Walmart Supercentre") continue
                // if current store is Walmart, then add the same products to the Walmart Supercentre (they have the same products anyway)
                if (storeName === "Walmart") {
                    const products = await productData[storeName]()
                    // create a collection reference
                    const collectionRef = collection(db, "/stores-and-products")
                    // add products for Walmart
                    await Promise.all([
                        setDoc(doc(collectionRef, "Walmart"), { products }), 
                        // add the same products for Walmart Supercentre
                        setDoc(doc(collectionRef, "Walmart Supercentre"), { products })
                    ])
                    // go to the next
                    continue
                }
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
        const products = await productData["The Red Barn Farm Market and Bakery"]()
        console.log("products: " + JSON.stringify(products))
        console.log("products length: " + products.length)
    }
    catch (err: any) {
        console.error("failed to update products: " + err.message)
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