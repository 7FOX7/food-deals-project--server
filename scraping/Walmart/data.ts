/*
    NOTE: 
    - For the sake of simplicity: 
    - `data` is shared between all stores that start with `Walmart` (they contain the same products anyway)
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
    // will be storing the number of retries we made 
    // to connect to the page
    let numOfRetries = 0
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

    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://www.walmart.ca/en/shop/weekly-flyer-features/6000196190101`, {
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
                return await new Promise(resolve => setTimeout(() => resolve(addProducts()), 
                constants.DELAY_BEFORE_NEW_REQUEST))
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            // get a new html content
            // NOTE: 
            // - We are doing this because by default there are duplicates on the first page. 
            // - So, you might want to select the node of a specific element first, and then within it select the elements need (titles, prices, units etc.)
            const htmlContent = await page.$eval("#results-container", container => container.nextElementSibling?.outerHTML)                
            // if there is no `htmlContent` (might happen if there is no element with id `results-container`)
            if (!htmlContent) throw new Error("Could not set a new html content. Check if element with id `results-container` exists")
            // set a new page content
            // NOTE: 
            // - all the elements will be selected within this content
            await page.setContent(htmlContent)
            // - pass a serialized (string) function body as a param to the '$$eval' method. 
            // - DON'T pass regexes directly because they lose their functionality inside the browser (meaning we cannot call 'test' method on them). 
            // - DON'T create a function inside the '$$eval' method because there will be an error. Instead, pass function body as a string, and inside, convert it to a normal function by using 'Function' constructor (pass all the params need to the function accordingly)
            
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

            return products
        }
        catch (err: any) {
            console.error("Something went wrong (Walmart): " + err.message)
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
    return await addProducts()   
}


export default getData