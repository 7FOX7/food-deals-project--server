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
        headless: false
    })
    // NOTE: 
    // - this value will be used to determine if we should look for the `next` button at all
    // - if the number of products for the current page is less than this number, then we need to just return existing products (we cannot go to the next page)
    const EXPECTED_NUM_OF_PRODUCTS_PER_PAGE = 20
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()

    const handle = async () => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://gallaghersfarmmarket.ca/shop/ols/products`, {
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
                return await new Promise<Products>(resolve => setTimeout(() => resolve(handle()), 
                constants.DELAY_BEFORE_NEW_REQUEST))
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            // This will create a new function which will be accepting 'productTitle'
            const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
            // start function execution
            return await addProducts()
            // uncomment for debugging:
            // let pageNum = 1

            // recursive function we will be calling every time
            // to go to the next page (there are no products left in the current page)
            async function addProducts() {
                try {
                    // uncomment for debugging:
                    // console.log("page: " + pageNum)
                    // pageNum += 1
                    // wait for the container
                    await page.waitForSelector("div[data-ux=Grid]", { visible: true })
                    // check if we should add more products to the array: 
                    if (products.length >= constants.LIMIT_PRODUCT_COUNT) {
                        // return products
                        return products
                    }
                    // get the current products
                    const currentProducts = await page.$$("div[data-ux=CommerceCardItem]")
                    // iterate through each product
                    for (const currentProduct of currentProducts) {
                        // test if the item is sold out
                        const soldOut = await currentProduct.evaluate(el => /out/gi.test(el.querySelector("p[data-ux=DetailsMinor]")?.textContent ?? ""))
                        // if the item is sold out, then just skip the current product
                        if (soldOut) continue
                        // get the title 
                        const title = await currentProduct.evaluate(el => el.querySelector("h4[data-ux=CommerceCardTitle]")?.textContent?.trim()) ?? Unavailable.Title
                        // get the price
                        const primaryPrice = await currentProduct.evaluate(el => el.querySelector("div[data-ux=CommerceItemPrice]")?.textContent?.replace(/C/gi, "").trim()) ?? Unavailable.PrimaryPrice
                        // get units match 
                        // NOTE: 
                        // \b ... \b - word boundary (the whole word should match the pattern)
                        // (\d+(\s+)?(\.|\-)(\s+)?)? - optional number that comes BEFORE the decimal point, or `-`
                        // (\d+) - any number of digits (this might be either a single number), or the second number after decimal `.` or range `-`
                        // (\s+)? - any number of whitespaces (if any)
                        // (\/)? - optional `/` that will match: 44/kg
                        // (kg|g|ea|ml|l|gm|pk) - the pattern should match one of those words
    
                        // - result: 
                        // `44ml` - pass
                        // `44           g` - pass (any number of whitespaces)
                        // `44 hello g` - fail (only whitespaces between number and unit are allowed)
                        // `1 grade 44 g` - only `44 g` will pass (because there is a word boundary)
                        // `44-256 ML` - pass (`-` is allowed between the digits)
                        // `17.24 kg` - pass (`.` is allowed between the digits)
                        const unitsMatch = title.match(/\b(\d+(\s+)?(\.|\-|x)(\s+)?)?(\d+)(\s+)?(\/)?(kg|g|ea|ml|l|gm|pk|cnt|packs?|lb|litre)\b/ig)
                        // get the units
                        const units = unitsMatch ? unitsMatch.join(" or ") : Unavailable.Units
                        // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                        const category: ProductCategories = getProductCategory(title)
                        if (category === ProductCategories.NoCategory) continue
                        // get a new product
                        const product: Product = {
                            imageUri: "my image", 
                            title, 
                            primaryPrice, 
                            units, 
                            category, 
                        }
                        
                        // if there is a valid product then push it to the array
                        product && products.push(product)
                        // uncomment for debugging:
                        // console.log(`title: ${title}`)
                    }  

                    // wait for the product container
                    await page.waitForSelector("div[data-ux=Grid]", { visible: true })
                    // get the number of products for the current page
                    const productsCount = await page.$eval("div[data-ux=Grid]", div => div.querySelectorAll("div[data-ux=CommerceCardItem]").length)
                    // check if this is the last page (then we don't need to wait for the `next` button)
                    const isLastPage = productsCount < EXPECTED_NUM_OF_PRODUCTS_PER_PAGE
                    // if this is the last page, then just return existing products
                    if (isLastPage) return products
                    // wait for the `next` button
                    await page.waitForSelector("a[data-aid=PAGINATION_ARROW_FORWARD]", { visible: true })
                    // click on the `next` button and wait for navigation
                    await Promise.all([
                        page.click("a[data-aid=PAGINATION_ARROW_FORWARD]"), 
                        page.waitForNavigation()
                    ])
                    // wait for a bit, otherwise, there might be duplicates
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    // call the function again
                    return await addProducts()
                }
                catch (err: any) {
                    throw new Error("Recursion failed: " + err.message)
                }  
            }
        }
        catch (err: any) {
            console.error("Something went wrong (Gallagher's): " + err)
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