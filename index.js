let menuCache = null;
let geselecteerdeMenuItem = null;

init();

async function init() {
    try {
        const menu = await getAlleMenuItems();
        menuLaden(menu);
        setEventListeners();
    } catch (err) {
        console.error(err);
    }
}

function menuLaden(menu) {
    const sectionMap = {
        pizza: "pizzaSubsection",
        pasta: "pastaSubsection",
        salade: "saladeSubsection",
        dessert: "dessertSubsection",
        dranken: "drankenSubsection"
    };
    for (let i = 0; i < menu.length; i++) {
        switch (menu[i].category.toLowerCase()) {
            case "pizza":
                maakMenuItem(menu[i], sectionMap.pizza);
                break;
            case "pasta":
                maakMenuItem(menu[i], sectionMap.pasta);
                break;
            case "salad":
                maakMenuItem(menu[i], sectionMap.salade);
                break;
            case "dessert":
                maakMenuItem(menu[i], sectionMap.dessert);
                break;
            case "drinks":
                maakMenuItem(menu[i], sectionMap.dranken);
                break;
            default:
                console.warn(`Onbekende categorie: ${menu[i].category}`);
        }
    };
};

function maakMenuItem(menuItem, sectionId) {
    let productenElement = document.getElementById(sectionId);
    const article = document.createElement("article");
    article.classList.add("menu-item");
    article.dataset.veggie = menuItem.veggie.toString();

    const title = document.createElement("h2");
    const prijs = document.createElement("p");

    const afbeelding = menuItem.image ? { type: menuItem.image } : null;

    title.innerText = menuItem.name;
    prijs.innerText = "€" + menuItem.price;
    article.dataset.price = menuItem.price;

    const categoryElement = document.createElement("span");
    categoryElement.innerText = menuItem.category;

    if (menuItem.veggie) {
        const veggieImg = document.createElement("img");
        veggieImg.src = "./afbeeldingen/leaf-svgrepo-com.svg";
        veggieImg.alt = "veggie";
        veggieImg.style.width = "20px";
        veggieImg.style.height = "20px";
        veggieImg.style.marginLeft = "10px";
        title.appendChild(veggieImg);
    }

    if (afbeelding) {
        const img = document.createElement("img");
        img.src = afbeelding.type;
        img.alt = menuItem.name;
        img.style.width = "100%";
        article.appendChild(img);
    }

    article.appendChild(title);
    article.appendChild(prijs);
    article.appendChild(categoryElement);
    article.addEventListener("click", () => { openItemOptiesDialog(menuItem); });
    productenElement.appendChild(article);
}

function filterVeggie(keuze) {
    const items = document.querySelectorAll(".menu-item");

    items.forEach(item => {
        const isVeggie = item.dataset.veggie;

        if (keuze === "all" || isVeggie === keuze) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}

function sorteerPrijs(orde) {
    const sections = document.querySelectorAll(".producten");

    sections.forEach(section => {
        // Pak alleen de menu-items, geen h2
        const items = Array.from(section.querySelectorAll(".menu-item"));

        // Sorteer de items
        items.sort((a, b) => {
            const prijsA = parseFloat(a.dataset.price);
            const prijsB = parseFloat(b.dataset.price);
            return orde === "hoog" ? prijsB - prijsA : prijsA - prijsB;
        });

        // Voeg de items opnieuw toe in de juiste volgorde
        items.forEach(item => section.appendChild(item));
    });
}

async function openItemOptiesDialog(menuItem) {
    geselecteerdeMenuItem = menuItem;

    const opties = await getOptiesByMenuItem(menuItem.id);
    const optiesDiv = document.getElementById("optiesDialoogKeuze");
    optiesDiv.innerHTML = "";

    opties.forEach(optie => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.value = optie.id;
        checkbox.dataset.price = optie.price;
        checkbox.dataset.label = optie.label;

        label.appendChild(checkbox);
        label.append(` ${optie.label} (+€${optie.price})`);

        optiesDiv.appendChild(label);
        optiesDiv.appendChild(document.createElement("br"));
    });

    document.getElementById("optiesDialoog").showModal();
}

function setEventListeners() {
    //Opties dialoog sluiten
    document.getElementById("sluitenKnop").addEventListener("click", () => {
        geselecteerdeMenuItem = null;
        document.getElementById("optiesDialoog").close();
    });

    //Opties dialoog toevoegen knop
    document.getElementById("toevoegenKnop").addEventListener("click", () => {
    if (!geselecteerdeMenuItem) return;
    itemToevoegen(geselecteerdeMenuItem);}); 
    
}

function itemToevoegen(menuItem) {
    const geselecteerdeOpties = Array.from(document.querySelectorAll("#optiesDialoogKeuze input:checked")).map(input => ({
        id: input.value,
        label: input.dataset.label,
        price: Number(input.dataset.price)
    }));

    // 2. Totale prijs
    const prijsOpties = geselecteerdeOpties.reduce((sum, o) => sum + o.price, 0);
    const totalePrijs = menuItem.price + prijsOpties;

    // 3. Winkelwagen item aanmaken
    const winkelWagenItem = {
        menuItemId: menuItem.id,
        name: menuItem.name,
        menuItemPrijs: menuItem.price,
        geselecteerdeOpties: geselecteerdeOpties,
        totalePrijs: totalePrijs,
        aantal: 1
    };

    // Haal huidige winkelwagen op
    const winkelwagen = getWinkelwagen();

    // Check of item al bestaat (zelfde menuItemId + dezelfde geselecteerde opties)
    const bestaandItem = winkelwagen.find(item => 
        item.menuItemId === winkelWagenItem.menuItemId &&
        JSON.stringify(item.geselecteerdeOpties.sort()) === JSON.stringify(winkelWagenItem.geselecteerdeOpties.sort())
    );

    if (bestaandItem) {
        // Item bestaat al, verhoog aantal
        bestaandItem.aantal += 1;
        // Optioneel: totalePrijs bijwerken
        bestaandItem.totalePrijs += winkelWagenItem.totalePrijs;
    } else {
        // Nieuw item toevoegen
        winkelwagen.push(winkelWagenItem);
    }
    // Opslaan in localStorage
    saveWinkelwagen(winkelwagen);
    // 5. Dialog sluiten
    document.getElementById("optiesDialoog").close();
}

function getWinkelwagen() {
    return JSON.parse(localStorage.getItem("winkelwagen")) || [];
}

function saveWinkelwagen(winkelwagen) {
    localStorage.setItem("winkelwagen", JSON.stringify(winkelwagen));
}

async function loadMenu() {
    if (menuCache) return menuCache;
    const response = await fetch("./db/menu.json");
    if (!response.ok) {
        throw new Error("Netwerkfout");
    }
    menuCache = await response.json();
    return menuCache;
}

async function getAlleMenuItems() {
    return await loadMenu();
}

async function getMenuItemById(id) {
    const menu = await loadMenu();
    return menu.find(item => item.id === id) || null;
}

async function getOptiesByMenuItem(menuItemId) {
    // 1. Menu laden
    const menu = await loadMenu();

    // 2. Menu-item zoeken
    const menuItem = menu.find(item => item.id === menuItemId);
    if (!menuItem) return [];

    // 3. Opties laden
    const response = await fetch("./db/opties.json");
    if (!response.ok) {
        throw new Error("Netwerkfout");
    }

    const opties = await response.json();

    // 4. Opties filteren op optionIds
    return opties.filter(optie =>
        menuItem.optionIds.includes(optie.id)
    );
}

function toonWinkelwagen() {
    // Placeholder functie om winkelwagen te tonen
    const winkelwagen = getWinkelwagen();
    alert("Winkelwagen: " + JSON.stringify(winkelwagen));
}