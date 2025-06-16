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
    const browser = await puppeteer.launch({
        headless: false, 
        slowMo: 20
    })
    // NOTE: 
    // - this value will be used to determine if we should look for the `next` button at all
    // - if the number of products for the current page is less than this number, then we need to just return existing products (we cannot go to the next page)
    const EXPECTED_NUM_OF_PRODUCTS_PER_PAGE = 60
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()

    const handle = async () => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://lapaisana.shopsettings.com/search?categories=100695029,100710016,100848003,100868020,100868027,100902003,102160046,103897128,103897166,103965137,105969386,105997406,106489180,129917559`, {
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
                return await new Promise<Products>(resolve => setTimeout(() => resolve(handle()), 
                constants.DELAY_BEFORE_NEW_REQUEST))
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            // start function execution
            return await addProducts()
            // recursive function we will be calling every time
            // to go to the next page (there are no products left in the current page)
            async function addProducts() {
                try {
                    // wait for the container
                    await page.waitForSelector("div.ec-filters__products", { visible: true })
                    // check if we should add more products to the array: 
                    if (products.length >= constants.LIMIT_PRODUCT_COUNT) {
                        // return products
                        return products
                    }
                    // - pass a serialized (string) function body as a param to the '$$eval' method. 
                    // - DON'T pass regexes directly because they lose their functionality inside the browser (meaning we cannot call 'test' method on them). 
                    // - DON'T create a function inside the '$$eval' method because there will be an error. Instead, pass function body as a string, and inside, convert it to a normal function by using 'Function' constructor (pass all the params need to the function accordingly)
                    
                    // - the key is: pass whatever you wanna use in the browser as strings (functions, objects, regexes etc.) and convert them to the desired values when inside the browser
                    const currentProducts = await page.$$eval("div.grid-product__wrap-inner", (divProducts, getProductCategory__funcBody) => {
                        // pass a param productTitle, and a function body.
                        // This will create a new function which will be accepting 'productTitle'
                        const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
                        
                        return divProducts.flatMap(div => {
                            // check if the item is not sold out
                            const buttonText = div.querySelector("div.grid-product__buy-now span")?.textContent?.trim()
                            // if there is no a button text, or it is sold out, then skip the current iteration
                            if (!buttonText || /out/ig.test(buttonText)) return []
                            // get the title
                            const title = div.querySelector("div.grid-product__title-inner")?.textContent?.trim() ?? Unavailable.Title
                            // get the FULL price info
                            const primaryPrice = div.querySelector("div.grid-product__price-value")?.textContent?.replace(/c/ig, " ").trim() ?? Unavailable.PrimaryPrice
                            // get the units
                            const units = Unavailable.Units
                            // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                            const category: ProductCategories = getProductCategory(title)
                            // - if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then skip adding this product
                            // - if title ends with '...' (meaning the title is too long), then skip adding this product
                            // by returning [] (this will be flattened -> as if a product never added)
                            if (category === ProductCategories.NoCategory || title.endsWith("...")) return []
                            // get a new product
                            const product: Product = {
                                imageUri: "my image", 
                                title, 
                                primaryPrice, 
                                units, 
                                category
                            }

                            return product
                        })
                    }, getProductCategory__funcBody)  

                    // add products from the current page to the global products
                    products.push(...currentProducts)
                    // wait for the product container
                    await page.waitForSelector("div.grid__wrap-inner div.grid__products", { visible: true })
                    // get the number of products for the current page
                    const productsCount = await page.$eval("div.grid__wrap-inner div.grid__products", div => div.querySelectorAll("div.grid-product").length)
                    // check if this is the last page (then we don't need to wait for the `next` button)
                    const isLastPage = productsCount < EXPECTED_NUM_OF_PRODUCTS_PER_PAGE
                    // if this is the last page, then just return existing products
                    if (isLastPage) return products
                    // wait for the `next` button
                    await page.waitForSelector("a.pager__button--next", { visible: true })
                    // click on the `next` button and wait for navigation
                    await Promise.all([
                        page.click("a.pager__button--next"), 
                        page.waitForNavigation()
                    ])
                    // call the function again
                    return await addProducts()
                }
                catch (err: any) {
                    throw new Error("Recursion failed: " + err.message)
                }  
            }
        }
        catch (err: any) {
            console.error("Something went wrong (La Paisana): " + err)
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
    return await handle()
}

export default getData