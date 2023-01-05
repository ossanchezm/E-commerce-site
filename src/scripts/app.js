//Contentful token
const client = contentful.createClient({
    space: "qpxykk4zsh64",
    accessToken: "c4XIMgKMR6yatoGQcOWd0U53uC9Id8enXIIJlQTcIQQ"
});

//variables
const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');


//This are global variables that help us simulate a database. Since we dont have one, we populate this variables dinamically and
//then use the local storage

//Cart array
let cart = [];

//Buttons array
let buttonsDOM = [];


//Class for getting the products
class Products {

    //Function to get the products
    async getProducts(){
        try {

            let contentful = await client.getEntries({
                content_type: "marsellaProducts"
            });

            let products = contentful.items;

            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} = item.sys
                const image = item.fields.image.fields.file.url

                return {title, price, id, image}
            });
            
            return products

        } catch (error) {
            console.log(error);
        }
    }
}


// Class for display the products
class UI {

    //Function to display the products
    displayProducts(products) {
        let result = '';
        products.forEach(product => {
            result += `
            <!--Single product-->
            <article class="product">
                <div class="img-container">
                    <img src=${product.image} alt="product" class="product-img"/>
                    <button class="bag-btn" data-id=${product.id}>
                        <i class="fas fa-shopping-cart"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>
            <!-- End Single product-->
            `;
        });
        productsDOM.innerHTML = result;
    }

    //Function to get the bag buttons
    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === id);
            if(inCart){
                button.innerText = "In Cart";
                button.areaDisabled = true; ////HEREEEEEEEEE
            }
            button.addEventListener('click', (event) => {
            event.target.innerText = "In Cart";
            event.target.disabled = true;

            //get product from products based on id
            let cartItem = {...Storage.getProduct(id), amount:1};

            //add product to the cart
            cart = [...cart, cartItem];

            //save the cart in the local storage
            Storage.saveCart(cart);

            //set cart values
            this.setCartValues(cart);

            //display cart item
            this.addCartItem(cartItem);

            //show the cart
            this.showCart();

            });
        });
    }

    //Function to set the cart values
    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });

        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }

    //Function to add an item to the cart
    addCartItem(item) {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `<img src=${item.image} alt="product">
        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id = ${item.id}>remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id = ${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id = ${item.id}></i>
        </div>`;

        cartContent.appendChild(div);

    }

    //Function to show the cart
    showCart() {
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }

    //Function to set up the app
    setupApp() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener('click', this.showCart);
        closeCartBtn.addEventListener('click', this.hideCart);
    }

    //Function to populate the cart with the local storage
    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item));
    }

    //Function to hide the cart
    hideCart(cart) {
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }

    //Function for the cart logic
    cartLogic() {
        //Clear cart button
        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        });

        //Cart functionality
        cartContent.addEventListener('click', event => {
            if(event.target.classList.contains('remove-item')) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            }
            else if (event.target.classList.contains('fa-chevron-up')) {
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            }
            else if (event.target.classList.contains('fa-chevron-down')) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;

                if(tempItem.amount > 0){
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;

                }
                else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }

    //Function to clear the cart
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        console.log(cartContent.children);
        while(cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }

        this.hideCart();
    }

    //Function to remove an item
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i> add to cart"`
    }

    //Function to get a single button
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}


//Class of the storage
class Storage {

    //Function to save the products
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    //Function to get the products
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }

    //Function to save the cart
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    //Function to get the cart
    static getCart(){
        return localStorage.getItem('cart')? JSON.parse(localStorage.getItem('cart')):[];
    }
}

//When the dom is loaded...
document.addEventListener("DOMContentLoaded", ()=> {

    //Inizialize the variables
    const ui = new UI();
    const products = new Products();

    //Set up app
    ui.setupApp()

    //get all products
    products.getProducts().then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
});