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
    const browser = await puppeteer.launch()
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
            const response = await page.goto(`https://pepperpalace.com/collections/all?page=${pageNum}`, {
                waitUntil: "domcontentloaded"
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
            const currentProducts = await page.$$eval("[data-product-item-content]", (divProducts) => {
                return divProducts.flatMap(div => {
                    // check if the item is not sold out
                    const buttonText = div.querySelector("span.atc-button--text")?.textContent?.trim()
                    // if there is no a button text, or it is sold out, then skip the current iteration
                    if (!buttonText || /sold out/ig.test(buttonText)) return []
                    // get the title
                    const title = div.querySelector("h2.productitem--title")?.textContent?.trim() ?? Unavailable.Title
                    // get the primary price and remove all the '$' from it
                    const primaryPrice = div.querySelector("[data-price]")?.textContent?.replaceAll("$", "").trim() ?? Unavailable.PrimaryPrice
                    // there are no units for this product
                    const units = ""
                    // all the products are pantry essentials by default (sauces)
                    const category: ProductCategories = ProductCategories.PantryAndEssentials
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
            })  
            // if there are no current products (most likely there is no content we need), then just exit the function
            if (!currentProducts || currentProducts.length === 0) return products
            // add products from the current page to the global products
            products.push(...currentProducts)
            // increment the page num to move to the next page
            pageNum ++ 
            // call the function again
            return await addProducts(pageNum)
        }
        catch (err: any) {
            console.error("Something went wrong (No Frills): " + err.message)
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