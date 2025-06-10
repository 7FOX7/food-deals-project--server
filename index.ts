import { db } from "./firebase-config"
import { collection, doc, setDoc } from "firebase/firestore"
import {schedule} from "node-cron"
import puppeteer from "puppeteer"
import {getProductCategory__funcBody} from "./utils/product-categories-regex"
import {Product, Products, ProductData, STORE_NAMES} from "./utils/types"
import {writeFile} from "fs"
// import StealthPlugin from "puppeteer-extra-plugin-stealth"

// enable the stealth plugin
// puppeteer.use(StealthPlugin())

// default for unavailable product data
enum Unavailable {
    ImageUri = "[COULD NOT GET PRODUCT IMAGE]", 
    Title = "[COULD NOT GET PRODUCT NAME]", 
    PrimaryPrice = "[COULD NOT GET PRODUCT PRIMARY PRICE]", 
    Units = "[COULD NOT GET PRODUCT UNIT DETAILS]"
}

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

// will be representing the amount of products we want to store in the array
// NOTE: the final product count might differ depending on how many products 
// there are in the page: 
const LIMIT_PRODUCT_COUNT = 200
// will be representing a delay time before sending a new request for the page 
// NOTE: we'll be using it if we could not connect to the page because of the server error
// or could not get a response in the first place: 
const DELAY_BEFORE_NEW_REQUEST = 120000
// will be representing the max number of retries to connect to the page
const MAX_RETRIES = 3

// TODO: create an object which is going to contain names of stores as keys
// and an async function for fetching (or scraping) product data as values
const productData: ProductData = {
    "Walmart": async (): Promise<Products> => {
        // will be storing products we will be pushing to the array: 
        const products: Products = []
        // will be representing a browser: 
        const browser = await puppeteer.launch()
        // TODO: add a cron job logic
        // create a new page
        const page = await browser.newPage()
        // set the user agent (request will fail without setting it)
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36")
        // set extra HTTP headers (strongly recommended)
        await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9"
        })

        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://www.walmart.ca/en/shop/weekly-flyer-features/6000196190101`, {
                // set it to `networkidle0`, otherwise, it might block us when we go to the 2nd page
                waitUntil: "networkidle2", 
                // set referer (request will fail without it)
                referer: "https://www.walmart.ca"
            })
            // if connection to the page failed (and it is not our API's fault, then send a new request after delay time)
            if (!response || /^5[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                const reason = await response?.content()
                throw new Error("Server error: " + reason?.toString())
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                const reason = await response.content()
                throw new Error("Check if a client request is valid: " + reason.toString())
            }

            // recursive function we will be calling every time
            // to go to the next page (there are no products left in the current page)
            const addProducts = async (): Promise<Products> => {
                // check if we should add more products to the array: 
                if (products.length >= LIMIT_PRODUCT_COUNT) return products
                // get the page content
                const content = await page.content()
                // write a file
                // NOTE: 
                // - will help us to check if by the time we extract the content a `Forbidden` error was not thrown
                writeFile("my-file.txt", content, () => {
                    console.log("file written success")
                })
                
                // get the string version of `htmlContent`
                const htmlContent = await page.$eval("#results-container", div => div.nextElementSibling?.outerHTML)
                // check if there is an `htmlContent`
                if (!htmlContent) throw new Error("Could not generate a new html content. Make sure `#results-container` exists on Walmart's page")
                // NOTE: 
                // - `[data-ite-id]` selector is like selecting by a class name but is more specific
                // - in this case this will return `div` elements
                const currentProducts = await page.$$eval("[data-item-id]", (divProducts, getProductCategory__funcBody) => {
                    // pass a param productTitle, and a function body.
                    // This will create a new function which will be accepting 'productTitle'
                    const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
                    return divProducts.flatMap(div => {
                        // get the product's title
                        const title = div.querySelector("[data-automation-id=product-title]")?.textContent ?? Unavailable.Title
                        // get the products's price
                        // NOTE: 
                        // method `.replace(/(\$|now)/ig, "").trim()` - replaces all occurences of `$` and `now` with empty string
                        const primaryPrice = div.querySelector("[data-automation-id=product-price]")?.firstElementChild?.textContent?.replace(/(\$|now)/ig, "").trim() ?? Unavailable.PrimaryPrice
                        // get the product's units
                        const units = div.querySelector("[data-automation-id=product-price]")?.lastElementChild?.textContent ?? Unavailable.Units
                        // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                        const category: ProductCategories = getProductCategory(title)
                        // if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then skip adding this product
                        // by returning [] (this will be flattened -> as if a product never added)
                        if (category === ProductCategories.NoCategory) return []
                        // get a new product
                        const product: Product = {
                            imageUri: "my image", 
                            title, 
                            primaryPrice, 
                            units, 
                            category, 
                        }

                        return product
                    })
                }, getProductCategory__funcBody)  
                
                // add products from the current page to the global products
                products.push(...currentProducts)
                // wait for a bit
                await new Promise(resolve => setTimeout(resolve, 6000))
                // log should appear in X time (just to make sure you are actually waiting)
                console.log("now, try again!")
                // press on the button to go to the next page and wait 
                // till it actually navigates
                await Promise.all([
                    page.waitForSelector("#results-container"), 
                    page.click("[data-testid=NextPage]")
                ])
                // call the function again
                return await addProducts()
            }

            return await addProducts()
        }
        catch (err: any) {
            console.error(`Something went wrong. Was able to get only ${products.length} products: ` + err.message)
           // still return products that have been added: 
            return products
        }  
        // will be executed regardless
        finally {
            // close the browser
            await browser.close()
        }
    },   
    "No Frills - Supermarket": () => [{
        imageUri: "No Frills - Supermarket", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Dollarama": () => [{
        imageUri: "Dollarama", 
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
    "Ryan's No Frills": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
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
    "Food Basics": async (): Promise<Products> => {
        // will be storing products we will be pushing to the array: 
        const products: Products = []
        // will be storing a current page number: 
        let pageNum = 1
        // will be storing the number of retries we made 
        // to connect to the page
        let numOfRetries = 0
        // will be representing a browser: 
        const browser = await puppeteer.launch()
        // TODO: add a cron job logic
        // create a new page
        const page = await browser.newPage()

        // recursive function we will be calling every time
        // to go to the next page (there are no products left in the current page)
        const addProducts = async (pageNum: number): Promise<Products> => {
            // check if we should add more products to the array: 
            if (products.length >= LIMIT_PRODUCT_COUNT) {
                // return products
                return products
            }

            try {
                // connect to the specified url (watch page number)
                const response = await page.goto(`https://www.foodbasics.ca/search-page-${pageNum}?sortOrder=relevance&filter=%3Arelevance%3Adeal%3AFlyer+%26+Deals&fromEcomFlyer=true`, {
                    waitUntil: "networkidle2"
                })
                // if connection to the page failed (and it is not our API's fault, then send a new request after delay time)
                if (!response || /^5[0-9][0-9]$/.test(response.status().toString())) {
                    // check if we reached maximum retries, in this case there is no sense to make another request, throw an error
                    if (numOfRetries === MAX_RETRIES) {
                        // return an error
                        // TODO: return the cached Product data (firestore)
                        throw new Error("reached maximum retry count. Consider incrementing the delay time, and sure a request is valid")
                    }
                    // increment the number of retries
                    numOfRetries ++
                    // try to send a new request for the page after some time
                    return await new Promise(resolve => setTimeout(() => resolve(addProducts(pageNum)), 
                    DELAY_BEFORE_NEW_REQUEST))
                }
                // if connection to the page failed and this is our API's fault, then throw an error
                else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                    // return an error
                    // TODO: return the cached Product data (firestore)
                    throw new Error("check if a request is valid")
                }
                // - pass a serialized (string) function body as a param to the '$$eval' method. 
                // - DON'T pass regexes directly because they lose their functionality inside the browser (meaning we cannot call 'test' method on them). 
                // - DON'T create a function inside the '$$eval' method because there will be an error. Instead, pass function body as a string, and inside, convert it to a normal function by using 'Function' constructor (pass all the params need to the function accordingly)
                
                // - the key is: pass whatever you wanna use in the browser as strings (functions, objects, regexes etc.) and convert them to the desired values when inside the browser
                const currentProducts = await page.$$eval("div.tile-product", (divProducts, getProductCategory__funcBody) => {
                    // pass a param productTitle, and a function body.
                    // This will create a new function which will be accepting 'productTitle'
                    const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
                    
                    return divProducts.flatMap(div => {
                        const title = div.querySelector("div.head__title")?.textContent ?? Unavailable.Title
                        // get the primary price and remove all the '$' from it
                        const primaryPrice = div.querySelector("span.price-update")?.textContent?.replaceAll("$", "").trim() ?? Unavailable.PrimaryPrice
                        const secondaryPrice = div.querySelector("div.pricing__secondary-price span")?.textContent ?? ""
                        // merge units with secondary price into a single string
                        const units = div.querySelector("span.head__unit-details")?.textContent?.concat(`, ${secondaryPrice}`) ?? Unavailable.Units
                        
                        // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                        const category: ProductCategories = getProductCategory(title)
                        // if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then skip adding this product
                        // by returning [] (this will be flattened -> as if a product never added)
                        if (category === ProductCategories.NoCategory) return []
                        // get a new product
                        const product: Product = {
                            imageUri: "my image", 
                            title, 
                            primaryPrice, 
                            units, 
                            category, 
                        }

                        return product
                    })
                }, getProductCategory__funcBody)  

                // add products from the current page to the global products
                products.push(...currentProducts)
                // increment the page num to move to the next page
                pageNum ++ 
                // call the function again
                return await addProducts(pageNum)
            }
            catch (err: any) {
                console.error("Something went wrong: " + err.message)
                // still return products that have been added: 
                return products
            }  
            // will be executed regardless
            finally {
                // close the browser
                await browser.close()
            }
        }

        // start function execution
        return await addProducts(pageNum)
    },  
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
    "Brandon's No Frills": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
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
    "Zehrs": async (): Promise<Products> => {
        // will be storing products we will be pushing to the array: 
        const products: Products = []
        // will be storing a current page number: 
        let pageNum = 1
        // will be storing the number of retries we made 
        // to connect to the page
        let numOfRetries = 0
        // will be representing a browser: 
        const browser = await puppeteer.launch()
        // TODO: add a cron job logic
        // create a new page
        const page = await browser.newPage()
        // recursive function we will be calling every time
        // to go to the next page (there are no products left in the current page)
        const addProducts = async (pageNum: number): Promise<Products> => {
            // check if we should add more products to the array: 
            if (products.length >= LIMIT_PRODUCT_COUNT) {
                // return products
                return products
            }

            try {
                // connect to the specified url (watch page number)
                const response = await page.goto(`https://www.zehrs.ca/en/food/c/27985?page=${pageNum}&promotions=Price+Reduction`, {
                    waitUntil: "networkidle2"
                })
                // if connection to the page failed (and it is not our API's fault, then send a new request after delay time)
                if (!response || /^5[0-9][0-9]$/.test(response.status().toString())) {
                    // check if we reached maximum retries, in this case there is no sense to make another request, throw an error
                    if (numOfRetries === MAX_RETRIES) {
                        // return an error
                        // TODO: return the cached Product data (firestore)
                        throw new Error("reached maximum retry count. Consider incrementing the delay time, and sure a request is valid")
                    }
                    // increment the number of retries
                    numOfRetries ++
                    // try to send a new request for the page after some time
                    return await new Promise(resolve => setTimeout(() => resolve(addProducts(pageNum)), 
                    DELAY_BEFORE_NEW_REQUEST))
                }
                // if connection to the page failed and this is our API's fault, then throw an error
                else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                    // return an error
                    // TODO: return the cached Product data (firestore)
                    throw new Error("check if a request is valid")
                }
                
                // - pass a serialized (string) function body as a param to the '$$eval' method. 
                // - DON'T pass regexes directly because they lose their functionality inside the browser (meaning we cannot call 'test' method on them). 
                // - DON'T create a function inside the '$$eval' method because there will be an error. Instead, pass function body as a string, and inside, convert it to a normal function by using 'Function' constructor (pass all the params need to the function accordingly)
                
                // - the key is: pass whatever you wanna use in the browser as strings (functions, objects, regexes etc.) and convert them to the desired values when inside the browser
                const currentProducts = await page.$$eval("div.css-qoklea", (divProducts, getProductCategory__funcBody) => {
                    // pass a param productTitle, and a function body.
                    // This will create a new function which will be accepting 'productTitle'
                    const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
                    
                    return divProducts.flatMap(div => {
                        const title = div.querySelector("h3.css-6qrhwc")?.textContent ?? Unavailable.Title
                        // get the primary price and remove all the '$' from it
                        const primaryPrice = div.querySelector("span.css-o93gbd")?.lastChild?.textContent?.replaceAll("$", "").trim() ?? Unavailable.PrimaryPrice
                        const units = div.querySelector("p.css-1yftjin")?.textContent ?? Unavailable.Units
                        // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                        const category: ProductCategories = getProductCategory(title)
                        // if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then skip adding this product
                        // by returning [] (this will be flattened -> as if a product never added)
                        if (category === ProductCategories.NoCategory) return []
                        // get a new product
                        const product: Product = {
                            imageUri: "my image", 
                            title, 
                            primaryPrice, 
                            units, 
                            category, 
                        }

                        return product
                    })
                }, getProductCategory__funcBody)  

                // add products from the current page to the global products
                products.push(...currentProducts)
                // increment the page num to move to the next page
                pageNum ++ 
                // call the function again
                return await addProducts(pageNum)
            }
            catch (err: any) {
                console.error("Something went wrong: " + err.message)
                // still return products that have been added: 
                return products
            }  
            // will be executed regardless
            finally {
                // close the browser
                await browser.close()
            }
        }

        // start function execution
        return await addProducts(pageNum)
    }, 
    "Walmart Supercentre": async (): Promise<Products> => {
        // will be storing products we will be pushing to the array: 
        const products: Products = []
        // will be representing a browser: 
        const browser = await puppeteer.launch()
        // TODO: add a cron job logic
        // create a new page
        const page = await browser.newPage()
        // set the user agent (request will fail without setting it)
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36")
        // set extra HTTP headers (strongly recommended)
        await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9"
        })

        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://www.walmart.ca/en/shop/weekly-flyer-features/6000196190101`, {
                // set it to `networkidle0`, otherwise, it might block us when we go to the 2nd page
                waitUntil: "networkidle2", 
                // set referer (request will fail without it)
                referer: "https://www.walmart.ca"
            })
            // if connection to the page failed (and it is not our API's fault, then send a new request after delay time)
            if (!response || /^5[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                const reason = await response?.content()
                throw new Error("Server error: " + reason?.toString())
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                const reason = await response.content()
                throw new Error("Check if a client request is valid: " + reason.toString())
            }

            // recursive function we will be calling every time
            // to go to the next page (there are no products left in the current page)
            const addProducts = async (): Promise<Products> => {
                // check if we should add more products to the array: 
                if (products.length >= LIMIT_PRODUCT_COUNT) return products
                // get the page content
                const content = await page.content()
                // write a file
                // NOTE: 
                // - will help us to check if by the time we extract the content a `Forbidden` error was not thrown
                writeFile("my-file.txt", content, () => {
                    console.log("file written success")
                })
                
                // get the string version of `htmlContent`
                const htmlContent = await page.$eval("#results-container", div => div.nextElementSibling?.outerHTML)
                // check if there is an `htmlContent`
                if (!htmlContent) throw new Error("Could not generate a new html content. Make sure `#results-container` exists on Walmart's page")
                // NOTE: 
                // - `[data-ite-id]` selector is like selecting by a class name but is more specific
                // - in this case this will return `div` elements
                const currentProducts = await page.$$eval("[data-item-id]", (divProducts, getProductCategory__funcBody) => {
                    // pass a param productTitle, and a function body.
                    // This will create a new function which will be accepting 'productTitle'
                    const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
                    return divProducts.flatMap(div => {
                        // get the product's title
                        const title = div.querySelector("[data-automation-id=product-title]")?.textContent ?? Unavailable.Title
                        // get the products's price
                        // NOTE: 
                        // method `.replace(/(\$|now)/ig, "").trim()` - replaces all occurences of `$` and `now` with empty string
                        const primaryPrice = div.querySelector("[data-automation-id=product-price]")?.firstElementChild?.textContent?.replace(/(\$|now)/ig, "").trim() ?? Unavailable.PrimaryPrice
                        // get the product's units
                        const units = div.querySelector("[data-automation-id=product-price]")?.lastElementChild?.textContent ?? Unavailable.Units
                        // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                        const category: ProductCategories = getProductCategory(title)
                        // if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then skip adding this product
                        // by returning [] (this will be flattened -> as if a product never added)
                        if (category === ProductCategories.NoCategory) return []
                        // get a new product
                        const product: Product = {
                            imageUri: "my image", 
                            title, 
                            primaryPrice, 
                            units, 
                            category, 
                        }

                        return product
                    })
                }, getProductCategory__funcBody)  
                
                // add products from the current page to the global products
                products.push(...currentProducts)
                // wait for a bit
                await new Promise(resolve => setTimeout(resolve, 6000))
                // log should appear in X time (just to make sure you are actually waiting)
                console.log("now, try again!")
                // press on the button to go to the next page and wait 
                // till it actually navigates
                await Promise.all([
                    page.waitForSelector("#results-container"), 
                    page.click("[data-testid=NextPage]")
                ])
                // call the function again
                return await addProducts()
            }

            return await addProducts()
        }
        catch (err: any) {
            console.error(`Something went wrong. Was able to get only ${products.length} products: ` + err.message)
           // still return products that have been added: 
            return products
        }  
        // will be executed regardless
        finally {
            // close the browser
            await browser.close()
        }
    },   
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
    "Jim's No Frills": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Metro": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
    "Mark's No Frills": () => [{
        imageUri: "hello from product data (server)", 
        title: "hello from product data (server)", 
        units: "hello from product data (server)", 
        primaryPrice: "4", 
category: ProductCategories.NoCategory
    }],  
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
    schedule("49 * * * *", async () => {
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
        const products = await productData["Walmart"]()
        console.log("products: " + JSON.stringify(products))
        console.log("products length: " + products.length)
    }
    catch (err: any) {
        console.error("failed to update products: " + err.me)
    }   
}

// testProducts()
updateProducts()

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

/*

*/