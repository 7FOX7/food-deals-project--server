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
        headless: false
    })
    // create a new page
    const page = await browser.newPage()

    const handle = async () => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://thenewfoodbox.ca/collections/all?filter.v.availability=1&filter.v.price.gte=&filter.v.price.lte=&sort_by=best-selling`, {
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
                    await page.waitForSelector("ul[id=product-grid]", { visible: true })
                    // check if we should add more products to the array: 
                    if (products.length >= constants.LIMIT_PRODUCT_COUNT) {
                        // return products
                        return products
                    }
                    // get the current products
                    const currentProducts = await page.$$("ul[id=product-grid] li.grid__item")
                    // iterate through each product
                    for (const currentProduct of currentProducts) {
                        // get the title 
                        const title = await currentProduct.evaluate(el => el.querySelector("h3.card__heading a")?.textContent?.trim()) ?? Unavailable.Title
                        // get the price
                        const primaryPrice = await currentProduct.evaluate(el => el.querySelector("div.price__regular span.price-item--regular")?.textContent?.trim()) ?? Unavailable.PrimaryPrice
                        // get units match 
                        const unitsMatch = title.match(unitsRegex)
                        // get the units
                        const units = unitsMatch ? unitsMatch.join(" or ").toLowerCase() : Unavailable.Units
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

                    // get the navigation container
                    await page.waitForSelector("nav.pagination ul.pagination__list", { visible: true })
                    // check if this is the last page (then we don't need to wait for the `next` button)
                    const isLastPage = await page.$eval("nav.pagination ul.pagination__list", div => div.querySelector("a.pagination__item--prev") === null)
                    // if this is the last page, then just return existing products
                    if (isLastPage) return products
                    // wait for the `next` button
                    await page.waitForSelector("ul.pagination__list a.pagination__item--prev", { visible: true })
                    // click on the `next` button and wait for navigation
                    await Promise.all([
                        page.click("ul.pagination__list a.pagination__item--prev"), 
                        // page.waitForNavigation()     this will not work (it will navigate to the next page, it never recognizes that we navigated to the next page)
                    ])
                    // wait for a bit, otherwise, there might be duplicates
                    // await new Promise(resolve => setTimeout(resolve, 2000))
                    // call the function again
                    return await addProducts()
                }
                catch (err: any) {
                    throw new Error("Recursion failed: " + err.message)
                }  
            }
        }
        catch (err: any) {
            console.error("Something went wrong (The New Food Box): " + err)
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