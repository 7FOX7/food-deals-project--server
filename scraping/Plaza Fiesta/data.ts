import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody, unitsRegex } from "../../utils/regexes"
import * as constants from "../../utils/constants"

// will be searching through each of this food
const foods = [
    "Hot Sauce Tapatio", 
    "Salsa de Guacamole Herdez", 
    "Salsa Cholula", 
    "Valentina Hot Sauce", 
    "Dried Arbol Chili Peppers", 
    "Dried Ancho Chili Peppers", 
    "Bijol Colouring and Seasoning", 
    "Tajin Seasoning", 
    "Yuca Harina Goya", 
    "Bunoelina Mix Colombiana", 
    "Natilla Mix Colombiana", 
    "Mazamorra Colombiana", 
    "Yuca Harina Colombiana", 
    "Maizena Corn Starch", 
    "Harina Churros", 
    "Corn Flour Tamales Maseca", 
    "Corn Flour Blanca Maseca", 
    "Chocomilk Drink", 
    "Milo Drink", 
    "Chocolate Abuelita", 
    "Chocolate Abuelita Powder", 
    "Corona Flash", 
    "La Lechera Condensed Milk", 
    "Piloncillo Artesanal", 
    "Conchita", 
    "Emilia yellow potato", 
    "Emilia Arracacha", 
    "Chirilagua Rio Grande", 
    "Plantains Big Banana", 
    "Yuca Bites", 
    "Saltin Noel",
    "Maria Gamesa", 
    "Polvorones Marinela", 
    "Barritas Marinela", 
    "Refried Beans Ducal", 
    "La costena", 
    "Juanitas", 
    "Poblano Peppers", 
    "Mole Xiqueno", 
    "White Hominy Goya", 
    "Takis", 
    "Cafe Sello Rojo Espresso"
]

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
        slowMo: 15
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    // get the length of all products
    console.log("all products length (Plaza Fiesta Latin Grocery and Cafe): " + foods.length)
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://shoplatinfoods.ca/search`, {
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
            // click on the search input container
            // await page.click('form.search-bar--page input.input-group-field')
            // wait for the input container
            // await page.waitForSelector("div.dfd-searchbox-main")
            // This will create a new function which will be accepting 'productTitle'
            const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
            // Iterate through each food
            for (const food of foods) {
                // wait for the input field
                await page.waitForSelector("form.search-bar--page")
                await Promise.all([
                    page.waitForSelector('form.search-bar--page input[type=search]'), 
                    page.waitForSelector("form.search-bar--page button[type=submit]")
                ])
                // type the name of a food to the search input
                // NOTE: 
                // - set the delay of at least 25 ms, otherwise, the products will not 
                // have enough time to load, and you will get a mess
                // wait for selector
                await page.type("form.search-bar--page input[type=search]", food, { delay: 5 })
                await Promise.all([
                    page.click("form.search-bar--page button[type=submit]"), 
                    page.waitForSelector("div.grid__item div.grid-uniform")
                ])
                // decide if the container is empty
                const isContainerEmpty = await page.$eval("div.grid__item div.grid-uniform", div => div.innerText.replace(/("+)|\s+/gi, "").length === 0)
                // if there is no a container, this means there is no product, just skip the current product
                if (isContainerEmpty) continue
                // wait for selector
                await page.waitForSelector("div.grid-product__wrapper")
                // get the title of the first product that match input
                const title = await page.$eval("span.grid-product__title", div => div.textContent?.trim()) ?? Unavailable.Title
                // get the title of the first product that match input
                const primaryPrice = await page.$eval("span.grid-product__price", span => span.innerText?.replace(/(regular price)|(\n+)|\+/gi, "").trim()) ?? Unavailable.PrimaryPrice
                // get units match 
                const unitsMatch = title.match(unitsRegex)
                // get the units
                const units = unitsMatch ? unitsMatch.join(" or ").toLowerCase() : Unavailable.Units
                // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                let category: ProductCategories = getProductCategory(title)
                // - if title ends with '...' (meaning the title is too long), then skip adding this product
                if (title.endsWith("...")) continue
                // if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then give it a default category
                if (category === ProductCategories.NoCategory) {
                    // give it a default category
                    category = ProductCategories.PantryAndEssentials
                }
                // get a new product
                const product: Product = {
                    imageUri: "my image", 
                    title, 
                    primaryPrice, 
                    units, 
                    category, 
                }
                // add product to the products
                products.push(product)
                // clear the input field
                await page.$eval("form.search-bar--page input[type=search]", input => input.value = "")
            }
            return products
        }
        catch (err: any) {
            console.error("Something went wrong (Plaza Fiesta Latin Grocery and Cafe): " + err.message)
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