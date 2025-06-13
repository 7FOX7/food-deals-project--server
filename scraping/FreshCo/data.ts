import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody } from "../../utils/product-categories-regex"
import * as constants from "../../utils/constants"
import {writeFile} from "fs"

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
    // will be storing anchor id
    // NOTE: 
    // - this will help us to extract product data (there will be multiple containers defined by this id)
    // - set to 3 because product data is starting with this index
    const anchorId = 3
    // will be representing a browser: 
    const browser = await puppeteer.launch({
        headless: false, 
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36")
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://freshco.com/flyer`, {
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
            
            // wait for the iframe
            const frame = await page.waitForSelector("iframe.mainframe")
            if (!frame) throw new Error("no frame")
            // get the frame content
            const frameContent = await frame.contentFrame()
            // wait for the main container to appear
            await frameContent.waitForSelector("div[sfml-content-wrap]")
            // get the count of all the `sfml-flyer-image`
            // NOTE: 
            // - these are the containers where all the product data is stored 
            // - should be roughly 13 containers
            const flyerSectionCount = await frameContent.$$eval("div[sfml-content-wrap] sfml-flyer-image", divs => divs.length)


            // starting from the third `sfml-flyer-image` (because the first two contain ad garbage, start selecting all the data we need)
            for (let i = 3; i < flyerSectionCount; i++) {
                // just in case: wait for the `sfml-flyer-image`
                await frameContent.waitForSelector(`div[sfml-content-wrap] sfml-flyer-image[sfml-anchor-id="${i}"]`)    

                const currentProducts = await frameContent.$$eval(`div[sfml-content-wrap] sfml-flyer-image[sfml-anchor-id="${i}"] div button`, (currentProducts, getProductCategory__funcBody)=> {
                    // pass a param productTitle, and a function body.
                    // This will create a new function which will be accepting 'productTitle'
                    const getProductCategory = new Function("productTitle", getProductCategory__funcBody)

                    // filter foods
                    // NOTE: 
                    // - select only those foods that are on sale
                    const filteredProducts = currentProducts.filter(currentProduct => /SAVE/gi.test(currentProduct.ariaLabel ?? ""))
                    
                    return filteredProducts.flatMap(filteredProduct => {
                        // get product's label first
                        const label = filteredProduct.ariaLabel ?? ""
                        // if label is empty, then just skip working with this product
                        if (!label) return []
                        // split the label on `, SAVE`
                        const [title, price] = label.split(/,.*?SAVE[^,]*,\s*/i)
                        const priceMatch = price.match(/\d+(\.\d+)?/)
                        // get the title
                        title.trim() ?? Unavailable.Title
                        // get the primary price
                        const primaryPrice = priceMatch ? priceMatch[0].trim() : Unavailable.PrimaryPrice
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
                            // units will be empty (fuck it)
                            units: "", 
                            category, 
                        }
    
                        return product
                    })
                }, getProductCategory__funcBody)

                products.push(...currentProducts)
            }

            return products
        }
        catch (err: any) {
            console.error("Something went wrong (FreshCo): " + err.message)
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