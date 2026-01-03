let menuCache = null;
let geselecteerdeMenuItem = null;

let promocodes = [
    {code: "PIZZA5", korting: 5, oneTime: true},
    {code: "PASTA10", korting: 10, oneTime: false},
    {code: "SALAD15", korting: 15, oneTime: true}
];

let actievekorting= null;

function controleerkorting() {
    const invulcode = document.getElementById("kortingcode").value.trim().toUpperCase();
    const kortingcontroleren = document.getElementById("kortingcontroleren");

    const gevondencode = promocodes.find(p=> p.code === invulcode);
    if (gevondencode) {
        actievekorting = gevondencode;
        alert(`Kortingscode ${gevondencode.code} geaccepteerd! Je krijgt ${gevondencode.korting}% korting.`);
        sluitkortingformulier();
    } else {
        alert("Ongeldige kortingscode. Probeer het opnieuw.");
    }
}

leegWinkelwagenBijRefresh();
init();

function leegWinkelwagenBijRefresh() {
    localStorage.removeItem("winkelwagen");
}


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
        pizza: "pizzaSection",
        pasta: "pastaSection",
        salade: "saladeSection",
        dessert: "dessertSection",
        dranken: "drankenSection"
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

    const afbeelding = menuItem.afbeelding ? { type: menuItem.afbeelding } : null;

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

    const winkelwagenKnop = document.createElement("img");
    winkelwagenKnop.src = "afbeeldingen/shopping-cart-svgrepo-com.svg";
    winkelwagenKnop.alt = "Voeg toe aan winkelwagen";
    winkelwagenKnop.style.width = "20px";
    winkelwagenKnop.style.height = "20px";
    winkelwagenKnop.style.cursor = "pointer";
    winkelwagenKnop.addEventListener("click", () => openItemOptiesDialog(menuItem));
    article.appendChild(winkelwagenKnop);
    productenElement.appendChild(article);
    winkelwagenKnop.classList.add("winkelwagenKnop");

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

function openItemOptiesDialog(menuItem) {
    geselecteerdeMenuItem = menuItem;
    const optiesDiv = document.getElementById("optiesDialoogKeuze");
    optiesDiv.innerHTML = "";

    menuItem.options.forEach(optie => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.value = optie.key;
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
        aantal: 1,
        maxAantal: menuItem.maxPerOrder || 5
    };

    // Haal huidige winkelwagen op
    const winkelwagen = getWinkelwagen();

    // Check of item al bestaat (zelfde menuItemId + dezelfde geselecteerde opties)
    const bestaandItem = winkelwagen.find(item =>
        item.menuItemId === winkelWagenItem.menuItemId &&
        JSON.stringify(item.geselecteerdeOpties.sort()) === JSON.stringify(winkelWagenItem.geselecteerdeOpties.sort())
    );

    if (bestaandItem) {

        if (bestaandItem.aantal + 1 > bestaandItem.maxAantal) {
            toonMaximumMelding(menuItem.name, bestanaadItem.maxAantal);
            return;
        }
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

function toonMaximumMelding(itemNaam, maxAantal) {
    let alertBoodschap = document.getElementById("max-alert");
    if (!alertBoodschap) {
        alertBoodschap = document.createElement("div");
        alertBoodschap.id = "max-alert";
        alertBoodschap.style.color = "#3c36a1";
        alertBoodschap.style.margin = "10px";
        document.body.prepend(alertBoodschap);
    }

    alertBoodschap.innerText = `Je kunt niet meer dan ${maxAantal} van ${itemNaam} toevoegen aan je winkelmand.`;

    setTimeout(() => {
        alertBoodschap.innerText = "";
    }, 3000);
}

function getWinkelwagen() {
    return JSON.parse(localStorage.getItem("winkelwagen")) || [];
}

function saveWinkelwagen(winkelwagen) {
    localStorage.setItem("winkelwagen", JSON.stringify(winkelwagen));
}

async function loadMenu() {
    if (menuCache) return menuCache;
    const response = await fetch("./menu.json");
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

function toonWinkelwagen() {
    const winkelwagen = getWinkelwagen();

    if (winkelwagen.length === 0) {
        alert("Je winkelmand is leeg.");
        return;
    }

    let totaalPrijs = 0;
    let boodschap = "Jouw winkelmand:";

    winkelwagen.forEach(item => {
        boodschap += `${item.aantal}x ${item.name} -€${item.totalePrijs.toFixed(2)}\n`;

        if (item.geselecteerdeOpties.length > 0) {
            item.geselecteerdeOpties.forEach(optie => {
                boodschap += `   + ${optie.label} (€${optie.price})\n`;
            });
        }

        totaalPrijs += item.totalePrijs;

    });

    let kortingbedrag = 0;

    if (actievekorting) {
        kortingbedrag = totaalPrijs * (actievekorting.korting / 100);
        totaalPrijs -= kortingbedrag;
        boodschap += `korting (${actievekorting.code}): -€${kortingbedrag.toFixed(2)}\n`;
    }

    boodschap += `Totaalprijs: €${totaalPrijs.toFixed(2)}`;

    alert(boodschap);

    if (actievekorting && actievekorting.oneTime) {
        promocodes = promocodes.filter(p => p.code !== actievekorting.code);
        actievekorting = null;
    }

}

const juistegebruikersnaam = "oregano2025";
const juistewachtwoord = "LekkerstePizza!";

function login() {
    const gebruikersnaam = document.getElementById("gebruikersnaam").value;
    const wachtwoord = document.getElementById("wachtwoord").value;

    if (gebruikersnaam === juistegebruikersnaam &&
        wachtwoord === juistewachtwoord) {
        alert("Inloggen succesvol!");
    } else { alert("Inloggen mislukt, foutieve gebruikersnaam of wachtwoord.");
    }
}

function openkortingformulier() {
    document.getElementById("kortingdialog").showModal();
}

function sluitkortingformulier() {
    document.getElementById("kortingdialog").close();
}
