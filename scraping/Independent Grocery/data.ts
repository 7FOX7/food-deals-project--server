/*
    NOTE: 
    - For the sake of simplicity: 
    - `data` is shared between all stores that start with `Independent Grocery` (they contain ALMOST the same products anyway (the order might be different but filters and url are the same))
*/

import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody } from "../../utils/product-categories-regex"
import * as constants from "../../utils/constants"

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

const getData = async (): Promise<Products> => {
    // will be storing products we will be pushing to the array: 
    const products: Products = []
    // will be storing a current page number: 
    let pageNum = 1
    // will be storing the number of retries we made 
    // to connect to the page
    let numOfRetries = 0
    // will be representing a browser: 
    const browser = await puppeteer.launch({
        headless: false
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (pageNum: number): Promise<Products> => {
        // check if we should add more products to the array: 
        if (products.length >= constants.LIMIT_PRODUCT_COUNT) {
            // return products
            return products
        }

        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://www.yourindependentgrocer.ca/en/food/c/27985?page=${pageNum}&promotions=Price+Reduction&promotions=Multi-Buy&promotions=Price+Reduction&promotions=Multi-Buy&promotions=Price+Reductio`, {
                waitUntil: "networkidle2"
            })
            // if connection to the page failed (and it is not our API's fault, then send a new request after delay time)
            if (!response || /^5[0-9][0-9]$/.test(response.status().toString())) {
                // check if we reached maximum retries, in this case there is no sense to make another request, throw an error
                if (numOfRetries === constants.MAX_RETRIES) {
                    // return an error
                    // TODO: return the cached Product data (firestore)
                    throw new Error("reached maximum retry count. Consider incrementing the delay time, and sure a request is valid")
                }
                // increment the number of retries
                numOfRetries ++
                // try to send a new request for the page after some time
                return await new Promise(resolve => setTimeout(() => resolve(addProducts(pageNum)), 
                constants.DELAY_BEFORE_NEW_REQUEST))
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
                    // get the title
                    const title = div.querySelector("h3.css-6qrhwc")?.textContent?.trim() ?? Unavailable.Title
                    // will be storing the primary price
                    let primaryPrice: string = ""
                    // get the secondary price (will only be present if the product is multi-buy)
                    const multiBuyPrice = div.querySelector("span.css-1wji473")?.textContent?.trim()
                    // if the product is multi-buy, then handle two prices
                    if (multiBuyPrice) {
                        primaryPrice = `${div.querySelector("span.css-o93gbd")?.lastChild?.textContent?.trim()} OR ${multiBuyPrice} ea`
                    } else {
                        // get a single price
                        primaryPrice = div.querySelector("span.css-o93gbd")?.lastChild?.textContent?.trim() ?? Unavailable.PrimaryPrice
                    }
                    // get the units
                    const units = div.querySelector("p.css-1yftjin")?.textContent?.trim() ?? Unavailable.Units
                    // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                    const category: ProductCategories = getProductCategory(title)
                    // - if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then skip adding this product
                    // - if title has more than 40 characters (meaning it will not contain the full title), then skip adding this product
                    // by returning [] (this will be flattened -> as if a product never added)
                    if (category === ProductCategories.NoCategory || title.endsWith("...")) return []
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
            console.error("Something went wrong (Independent Grocery): " + err.message)
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
}


export default getData