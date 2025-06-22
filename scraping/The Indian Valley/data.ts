import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody, unitsRegex } from "../../utils/regexes"
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

// will be storing all the dollarama urls from which we will be getting product data
const urls = [
    "https://fineindia.ca/search?q=kurkure&options%5Bprefix%5D=last", 
    "https://fineindia.ca/search?q=shan&options%5Bprefix%5D=last", 
    "https://fineindia.ca/search?options%5Bprefix%5D=last&page=1&q=mdh", 
    "https://fineindia.ca/search?q=mago+rasmalai&options%5Bprefix%5D=last", 
    "https://fineindia.ca/search?q=frozen&options%5Bprefix%5D=last", 
    "https://fineindia.ca/search?q=lipton&options%5Bprefix%5D=last", 
    "https://fineindia.ca/search?q=pantry&options%5Bprefix%5D=last", 
    "https://fineindia.ca/search?q=unico&options%5Bprefix%5D=last", 
]

const getData = async (): Promise<Products> => {
    // will be storing products we will be pushing to the array: 
    const products: Products = []
    // will be storing the number of retries we made 
    // to connect to the page
    let numOfRetries = 0
    const browser = await puppeteer.launch({
        headless: false
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    try {
        // set the user agent (request will fail without setting it)
        for (const url of urls) {
            // check if we should add more products to the array: 
            if (products.length >= constants.LIMIT_PRODUCT_COUNT) return products
            // function will be called every time when need to extract product data from a new page
            await addProducts(url)   
        }
        // if for some reason 'if' condition inside the loop did not work (for example, if there are less products that the MAX_LIMIT), then return products from here
        
        return products
    }
    catch (err: any) {
        console.error(`Something went wrong. Was able to get only ${products.length} products (The Indian Valley): ${err.message}`)
        // still return some products
        return products
    }
    // will be executed regardless
    finally {
        // close the browser
        await browser.close()
    }

    async function addProducts(url: string) {
        try {
            // console.log("current url: " + url)
            const response = await page.goto(url, {
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
                return await new Promise(resolve => setTimeout(() => resolve(addProducts(url)), constants.DELAY_BEFORE_NEW_REQUEST))
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            // wait for the product container
            await page.waitForSelector("div.template-search__results ul.grid", { visible: true })
            // - pass a serialized (string) function body as a param to the '$$eval' method. 
            // - DON'T pass regexes directly because they lose their functionality inside the browser (meaning we cannot call 'test' method on them). 
            // - DON'T create a function inside the '$$eval' method because there will be an error. Instead, pass function body as a string, and inside, convert it to a normal function by using 'Function' constructor (pass all the params need to the function accordingly)
            
            // - the key is: pass whatever you wanna use in the browser as strings (functions, objects, regexes etc.) and convert them to the desired values when inside the browser
            const currentProducts = await page.$$eval("div.template-search__results ul.grid li.grid__item", (divProducts, getProductCategory__funcBody, unitsRegexString) => {
                // pass a param productTitle, and a function body.
                // This will create a new function which will be accepting 'productTitle'
                const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
                return divProducts.flatMap(div => {
                    // get the title
                    const title = div.querySelector("h3.card__heading a")?.textContent?.trim() ?? Unavailable.Title
                    // get the price
                    const primaryPrice = div.querySelector("div.price__regular span.price-item")?.textContent?.replace(/CAD/gi, "").trim() ?? Unavailable.PrimaryPrice
                    // get units match 
                    const unitsMatch = title.match(new RegExp(unitsRegexString, "ig"))
                    // get the units
                    const units = unitsMatch ? unitsMatch.join(" or ").toLowerCase() : Unavailable.Units
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
            }, getProductCategory__funcBody, unitsRegex.source)  

            // add products from the current page to the global products
            products.push(...currentProducts)
        }
        catch (err: any) {
            console.error(`Failed to get product data from '${url}' (The Indian Valley): ${err.message}`)
        }  
    }
}


export default getData