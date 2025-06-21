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

const getData = async (): Promise<Products> => {
    // will be storing products we will be pushing to the array: 
    const products: Products = []
    // will be storing the number of retries we made 
    // to connect to the page
    let numOfRetries = 0
    // will be representing a browser: 
    const browser = await puppeteer.launch({
        headless: false, 
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    // set a bigger viewport so all products are within the viewport
    // NOTE: 
    // - we are doing it because the website is using 'lazy loading' technique meaning we are not able to get the content until we scroll to it.
    // - setting a bigger viewport makes sure that we can see all the content from the beginning
    await page.setViewport({
        width: 3840, 
        height: 2300, 
        deviceScaleFactor: 1
    })
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://www.ubereats.com/ca/store/shell-4790-dorchester-rd/QmRVfU__Xle5o1FzKs9tuA/4264557d-4fff-5e57-b9a3-51732acf6db8/9d480d3e-7d0b-4fbc-b32e-def34363dc45?diningMode=DELIVERY&oscats=9d480d3e-7d0b-4fbc-b32e-def34363dc45&ps=1&scats=9d480d3e-7d0b-4fbc-b32e-def34363dc45&scatsubs=`, {
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
            // wait for the product container
            await page.waitForSelector('div[data-testid=store-catalog-section-vertical-grid] ul', { visible: true })
            // This will create a new function which will be accepting 'productTitle'
            const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
            // will be storing product urls
            const urls: string[] = []
            // iterate through each product
            const currentProducts = await page.$$('div[data-testid=store-catalog-section-vertical-grid] ul li a[tabindex="0"]')
            for (const currentProduct of currentProducts) {
                // get the url of a product link
                const url = await currentProduct.evaluate(el => el.href)
                // if there is no url, just skip the current product
                if (!url) continue
                // add url to the array
                urls.push(url)
            }
            // iterate through each url
            for (const url of urls) {
                // go to the product url
                await page.goto(url, {
                    waitUntil: "domcontentloaded"
                })
                // wait for the title to load
                const titleSelector = await page.waitForSelector("h1[data-testid=menu-item-title]")
                // get the title
                const title = await titleSelector?.evaluate(el => el?.innerText.trim()) ?? Unavailable.Title
                // wait for the price to load
                const priceSelector = await page.waitForSelector("span[data-testid=menu-item-price]")
                // get the price
                const primaryPrice = await priceSelector?.evaluate(el => el.firstElementChild?.textContent?.trim()) ?? Unavailable.PrimaryPrice
                // get units match 
                const unitsMatch = title.match(unitsRegex)
                // get the units
                const units = unitsMatch ? unitsMatch.join(" or ").toLowerCase() : Unavailable.Units
                // get category
                const category: ProductCategories = getProductCategory(title)
                // if there is no category for the current product, just skip it
                if (category === ProductCategories.NoCategory) continue
                // get a new product
                const product: Product = {
                    imageUri: "my image", 
                    title, 
                    primaryPrice, 
                    units, 
                    category, 
                }
                // add the current product to products
                products.push(product)
            }
            // return products
            return products
        }
        catch (err: any) {
            console.error("Something went wrong (Zest Mart): " + err.message)
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