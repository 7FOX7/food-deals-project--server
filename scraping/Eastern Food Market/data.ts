import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody, unitsRegex } from "../../utils/regexes"
import * as constants from "../../utils/constants"
import { connect } from "puppeteer-real-browser"

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
    // get the browser and the page
    // NOTE: 
    // `turnstile` - will help us to disable cloudflare?
    const {browser} = await connect({
        headless: false, 
        turnstile: true
    })
   
    // get a new page
    const page = await browser.newPage()
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://www.doordash.com/store/eastern-food-market-hamilton-29906066/38329173/`, {
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
                return await new Promise(resolve => setTimeout(() => resolve(addProducts()), 
                constants.DELAY_BEFORE_NEW_REQUEST))
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            // await new Promise(resolve => setTimeout(resolve, 1000))
            // await page.mouse.wheel({
            //     "deltaY": 1000, 
            //     "deltaX": 0
            // })
            // - pass a serialized (string) function body as a param to the '$$eval' method. 
            // - DON'T pass regexes directly because they lose their functionality inside the browser (meaning we cannot call 'test' method on them). 
            // - DON'T create a function inside the '$$eval' method because there will be an error. Instead, pass function body as a string, and inside, convert it to a normal function by using 'Function' constructor (pass all the params need to the function accordingly)
            // wait for the selector
            await page.waitForSelector("div[data-anchor-id=MenuItem]", { visible: true })
            const _products = await page.$$("div[data-anchor-id=MenuItem]")
            for (const product of _products) {
                const title = await product.evaluate(el => el.innerText)
                console.log("title: " + title)
            }
            // for each product
            const currentProducts = await page.$$eval("div[data-anchor-id=MenuItem]", (divProducts, getProductCategory__funcBody, unitsRegexString) => {
                // pass a param productTitle, and a function body.
                // This will create a new function which will be accepting 'productTitle'
                const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
                return divProducts.flatMap(div => {
                    // get the product's title
                    const title = div.querySelector("h3[data-telemetry-id=storeMenuItem.title]")?.textContent?.trim() ?? Unavailable.Title
                    // get the products's price
                    const primaryPrice = div.querySelector("span[data-anchor-id=StoreMenuItemPrice]")?.textContent?.trim() ?? Unavailable.PrimaryPrice
                    // get units match 
                    const unitsMatch = title.match(new RegExp(unitsRegexString, "ig"))
                    // get the units
                    const units = unitsMatch ? unitsMatch.join(" or ").toLowerCase() : Unavailable.Units
                    // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                    const category: ProductCategories = getProductCategory(title)
                    if (category === ProductCategories.NoCategory) return []
                    // get a new product
                    const product: Product = {
                        imageUri: "my image", 
                        title, 
                        primaryPrice, 
                        units, 
                        category, 
                    }
                    // return the product
                    return product
                })
            }, getProductCategory__funcBody, unitsRegex.source)  

            // add products from the current page to the global products
            products.push(...currentProducts)
            // return products
            return products
        }
        catch (err: any) {
            console.error("Something went wrong (Eastern Food Market): " + err.message)
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