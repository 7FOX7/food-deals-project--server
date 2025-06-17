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
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://sobeys.com/en/flyer/`, {
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
            // wait for the main frame 
            // NOTE: 
            // - this is where ALL the products will appear
            const mainFrame = await page.waitForSelector("iframe.mainframe")
            if (!mainFrame) throw new Error("`iframe.mainframe` is not found")
            // get the main frame content
            const mainFrameContent = await mainFrame.contentFrame()
            // wait for the main container to appear
            await mainFrameContent.waitForSelector("div[sfml-content-wrap]")
            // wait for the aside frame to appear 
            // NOTE: 
            // - `iframe.asideframe` - this should appear on the right, and contain the product information for each individual product
            const asideFrame = await page.waitForSelector("iframe.asideframe")
            if (!asideFrame) throw new Error("`iframe.asideframe` is not found")
            // get the aside frame content
            const asideFrameContent = await asideFrame.contentFrame()
            // get the count of all the `sfml-flyer-image`
            // NOTE: 
            // - these are the containers where all the product data is stored 
            // - should be roughly 13 containers
            const flyerSectionCount = await mainFrameContent.$$eval("div[sfml-content-wrap] sfml-flyer-image", divs => divs.length)
            // This will create a new function which will be accepting 'productTitle'
            const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
            // starting from the third `sfml-flyer-image` (because the first two contain ad garbage, start selecting all the data we need)
            for (let i = 3; i < flyerSectionCount; i++) {
                // if the number of products is more than the limit, then just return products
                if (products.length >= constants.LIMIT_PRODUCT_COUNT) {
                    return products
                }
                // just in case: wait for the `sfml-flyer-image`
                await mainFrameContent.waitForSelector(`div[sfml-content-wrap] sfml-flyer-image[sfml-anchor-id="${i}"]`, { visible: true })   
                // get current products
                const currentProducts = await mainFrameContent.$$(`div[sfml-content-wrap] sfml-flyer-image[sfml-anchor-id="${i}"] div button`)
                // iterate through each filtered product and get the data we need
                for (const currentProduct of currentProducts) {
                    // click on the button
                    // NOTE: 
                    // - DON'T use `currentProduct.click()` as it will make duplicate products
                    await currentProduct.evaluate(el => el.click())
                    // wait for a bit
                    await new Promise(resolve => setTimeout(resolve, 300))
                    // will be determing if we need to wait for the header to be displayed before selecting it
                    let waitForHeader = true
                    while (waitForHeader) {
                        // check if there is a header
                        const noHeader = await asideFrameContent.$eval("flipp-router", router => router.querySelector("h2.primary-info-header") === null)
                        // if there is no a header, then give it time to load and execute again
                        if (noHeader) {
                            waitForHeader = true
                            await new Promise(resolve => setTimeout(resolve, 300))
                        } else {    // otherwise, exit the loop (header is in place)
                            waitForHeader = false
                        }
                    }
                    // wait for the selector (just in case)
                    await asideFrameContent.waitForSelector("h2.primary-info-header", { visible: true })
                    // get the title 
                    const title = (await asideFrameContent.$eval("h2.primary-info-header", header => header.textContent))?.trim() ?? Unavailable.Title
                    // wait for the price container
                    await asideFrameContent.waitForSelector("flipp-primary-info div.grey-zone", { visible: true })
                    // check if there is a price
                    const noPrice = await asideFrameContent.$eval("flipp-primary-info div.grey-zone", zone => zone.querySelector("span.price-value") === null)
                    // if there is no price, then just skip to the next product
                    if (noPrice) continue
                    // wait for the price
                    await asideFrameContent.waitForSelector("span.price-value", { visible: true })
                    // get the price
                    const primaryPrice = (await asideFrameContent.$eval("span.price-value", price => price.textContent))?.trim() ?? Unavailable.PrimaryPrice
                    // wait for the description container
                    await asideFrameContent.waitForSelector("flipp-tab-info", { visible: true })
                    // check for the description container (if there is a container it means there is a description)
                    const noDescription = await asideFrameContent.$eval("flipp-tab-info", tabConroller => tabConroller.querySelector("flipp-tabpanel") === null)
                    // if there is no description, then just skip the product
                    if (noDescription) continue
                    await asideFrameContent.waitForSelector("p.flipp-description", { visible: true })
                    // get the product description
                    const description = (await asideFrameContent.$eval("p.flipp-description", desc => desc.textContent))?.trim() ?? ""
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
                    const unitsMatch = description.match(/\b(\d+(\s+)?(\.|\-|x)(\s+)?)?(\d+)(\s+)?(\/)?(kg|g|ea|ml|l|gm|pk)\b/ig)
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
                        // units will be empty (fuck it)
                        units, 
                        category, 
                    }
                    
                    // if there is a valid product then push it to the array
                    product && products.push(product)
                }
            }
            
            return products
        }
        catch (err: any) {
            console.error("Something went wrong (Sobeys): " + err.message)
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