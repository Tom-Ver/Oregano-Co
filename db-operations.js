let menuCache = null;

async function loadMenu() {
    if (menuCache) return menuCache;
    const response = await fetch("./db/menu.json");
    if (!response.ok) {
        throw new Error("Netwerkfout");
    }
    menuCache = await response.json();
    return menuCache;
}

export async function getAlleMenuItems() {
    return await loadMenu();
}

export async function getMenuItemById(id) {
    const menu = await loadMenu();
    return menu.find(item => item.id === id) || null;
}

export async function getOptiesByMenuItem(menuItemId) {
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
