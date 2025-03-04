// Inventory System
const InventorySystem = (function() {
    // Private properties
    let initialized = false;
    let expandedInventoryElement = null;
    let isPaused = false;
    
    // Inventory data
    let items = [];
    let selectedItemIndex = -1;
    const maxSlots = 16; // 4x4 grid for regular inventory
    
    // Equipment slots
    const equipmentSlots = {
        helmet: { id: 'helmet', name: 'Helmet', item: null },
        amulet: { id: 'amulet', name: 'Amulet', item: null },
        armor: { id: 'armor', name: 'Armor', item: null },
        cloak: { id: 'cloak', name: 'Cloak', item: null },
        bracers: { id: 'bracers', name: 'Bracers', item: null },
        gloves: { id: 'gloves', name: 'Gloves', item: null },
        pants: { id: 'pants', name: 'Pants', item: null },
        boots: { id: 'boots', name: 'Boots', item: null },
        rightHand: { id: 'rightHand', name: 'Right Hand', item: null },
        leftHand: { id: 'leftHand', name: 'Left Hand', item: null }
    };
    
    // Initialize the inventory
    function init() {
        if (initialized) return;
        
        try {
            console.log("[Inventory] Initializing inventory system");
            
            // Setup expanded inventory
            createExpandedInventory();
            
            // Add example items (for testing)
            addExampleItems();
            
            // Key event listener for 'I' key to toggle inventory
            window.addEventListener('keydown', (e) => {
                if (e.key === 'i' || e.key === 'I') {
                    toggleExpandedInventory();
                }
                if (e.key === 'Escape') {
                    if (expandedInventoryElement && !expandedInventoryElement.classList.contains('hidden')) {
                        toggleExpandedInventory(true); // Force close
                    }
                }
            });
            
            initialized = true;
            console.log("[Inventory] Inventory system initialized successfully");
            return true;
        } catch (e) {
            console.error("[Inventory] Failed to initialize inventory:", e);
            return false;
        }
    }
    
    // Create the expanded inventory UI
    function createExpandedInventory() {
        // Check if expanded inventory already exists
        if (document.getElementById('expandedInventory')) {
            expandedInventoryElement = document.getElementById('expandedInventory');
            return;
        }
        
        // Create expanded inventory container
        expandedInventoryElement = document.createElement('div');
        expandedInventoryElement.id = 'expandedInventory';
        expandedInventoryElement.className = 'expanded-inventory hidden';
        
        // Create inventory header
        const header = document.createElement('div');
        header.className = 'expanded-inventory-header';
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = 'INVENTORY';
        header.appendChild(title);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'expanded-inventory-close';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', function() {
            toggleExpandedInventory(true); // Force close
        });
        header.appendChild(closeButton);
        
        expandedInventoryElement.appendChild(header);
        
        // Create inventory content
        const content = document.createElement('div');
        content.className = 'expanded-inventory-content';
        
        // Create equipment side
        const equipmentSide = document.createElement('div');
        equipmentSide.className = 'equipment-side';
        
        // Create character silhouette
        const characterContainer = document.createElement('div');
        characterContainer.className = 'character-container';
        
        const characterSilhouette = document.createElement('div');
        characterSilhouette.className = 'character-silhouette';
        characterContainer.appendChild(characterSilhouette);
        
        // Create equipment slots
        for (const slotId in equipmentSlots) {
            const slotElement = createEquipmentSlot(slotId, equipmentSlots[slotId]);
            characterContainer.appendChild(slotElement);
        }
        
        equipmentSide.appendChild(characterContainer);
        
        // Create items side
        const itemsSide = document.createElement('div');
        itemsSide.className = 'items-side';
        
        const itemsTitle = document.createElement('h3');
        itemsTitle.textContent = 'ITEMS';
        itemsSide.appendChild(itemsTitle);
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'items-grid';
        itemsSide.appendChild(itemsGrid);
        
        // Add sides to content
        content.appendChild(equipmentSide);
        content.appendChild(itemsSide);
        expandedInventoryElement.appendChild(content);
        
        // Add to document body
        document.body.appendChild(expandedInventoryElement);
    }
    
    // Create equipment slot element
    function createEquipmentSlot(slotId, slotInfo) {
        const slot = document.createElement('div');
        slot.className = `equipment-slot ${slotId}-slot ${slotInfo.item ? '' : 'empty'}`;
        slot.dataset.slot = slotId;
        
        if (slotInfo.item) {
            const img = document.createElement('img');
            img.src = slotInfo.item.image;
            img.alt = slotInfo.item.name;
            slot.appendChild(img);
        }
        
        const label = document.createElement('div');
        label.className = 'equipment-slot-label';
        label.textContent = slotInfo.name;
        slot.appendChild(label);
        
        // Add click event
        slot.addEventListener('click', function() {
            handleEquipmentSlotClick(slotId);
        });
        
        return slot;
    }
    
    // Handle equipment slot click
    function handleEquipmentSlotClick(slotId) {
        const slot = equipmentSlots[slotId];
        const selectedItem = getSelectedItem();
        
        // If no item is selected, and the slot has an item, unequip it
        if (!selectedItem && slot.item) {
            const unequippedItem = slot.item;
            
            // Add the item back to inventory
            addItem(unequippedItem);
            
            // Clear the slot
            slot.item = null;
            
            // Log
            if (window.Logger) {
                Logger.log(`Unequipped ${unequippedItem.name} from ${slot.name}`);
            }
        }
        // If an item is selected, try to equip it
        else if (selectedItem) {
            // Check if the slot is valid for this item type
            if (selectedItem.slot === slotId) {
                // Remove from inventory first
                removeItem(selectedItem.id);
                
                // If slot already has an item, put it back in inventory
                if (slot.item) {
                    addItem(slot.item);
                }
                
                // Equip the new item
                slot.item = selectedItem;
                
                // Log
                if (window.Logger) {
                    Logger.log(`Equipped ${selectedItem.name} to ${slot.name}`);
                }
                
                // Clear selection
                selectedItemIndex = -1;
            } else {
                // Log
                if (window.Logger) {
                    Logger.log(`Cannot equip ${selectedItem.name} to ${slot.name}`);
                }
            }
        }
        
        // Update the UI
        renderExpandedInventory();
    }
    
    // Render expanded inventory UI
    function renderExpandedInventory() {
        // Find the items grid
        const itemsGrid = expandedInventoryElement.querySelector('.items-grid');
        if (!itemsGrid) return;
        
        // Clear previous items
        itemsGrid.innerHTML = '';
        
        // Add all items to the grid
        for (let i = 0; i < maxSlots; i++) {
            const item = i < items.length ? items[i] : null;
            const slotElement = createInventorySlot(i, item, true);
            itemsGrid.appendChild(slotElement);
        }
        
        // Update equipment slots
        for (const slotId in equipmentSlots) {
            const slotInfo = equipmentSlots[slotId];
            const slotElement = expandedInventoryElement.querySelector(`.${slotId}-slot`);
            
            if (slotElement) {
                // Update class based on whether slot has an item
                if (slotInfo.item) {
                    slotElement.classList.remove('empty');
                    
                    // Update or add image
                    let img = slotElement.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        slotElement.appendChild(img);
                    }
                    img.src = slotInfo.item.image;
                    img.alt = slotInfo.item.name;
                } else {
                    slotElement.classList.add('empty');
                    const img = slotElement.querySelector('img');
                    if (img) {
                        slotElement.removeChild(img);
                    }
                }
            }
        }
    }
    
    // Add example items
    function addExampleItems() {
        addItem({
            id: 'sword',
            name: 'Neon Blade',
            description: 'A glowing sword that pulsates with energy.',
            slot: 'rightHand',
            image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHJlY3QgeD0iNyIgeT0iMiIgd2lkdGg9IjIiIGhlaWdodD0iMTIiIGZpbGw9IiMwMGZmZmYiLz48cmVjdCB4PSI1IiB5PSI0IiB3aWR0aD0iNiIgaGVpZ2h0PSIyIiBmaWxsPSIjZmYwMGZmIi8+PHJlY3QgeD0iNiIgeT0iMTQiIHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmZmMDAiLz48L3N2Zz4='
        });
        
        addItem({
            id: 'helmet',
            name: 'Cyber Helmet',
            description: 'A helmet with integrated HUD.',
            slot: 'helmet',
            image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTQsNiBBNiw1IDAgMCAxIDE2LDYgTDE1LDEwIEwxLDEwIFoiIGZpbGw9IiMwMGZmZmYiLz48L3N2Zz4='
        });
        
        addItem({
            id: 'potion',
            name: 'Health Potion',
            description: 'Restores 50 health points.',
            count: 3,
            image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTYsMyBMNiw2IEw0LDggTDQsMTMgTDEyLDEzIEwxMiw4IEwxMCw2IEwxMCwzIFoiIGZpbGw9IiNmZjAwMDAiIGZpbHRlcj0idXJsKCNnbG93KSIvPjxmaWx0ZXIgaWQ9Imdsb3ciPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjEiIHJlc3VsdD0iYmx1ciIvPjxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj0iYmx1ciIvPjxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPjwvZmVNZXJnZT48L2ZpbHRlcj48L3N2Zz4='
        });
    }
    
    // Create an inventory slot element
    function createInventorySlot(index, item, isExpanded = false) {
        const slot = document.createElement('div');
        slot.className = 'inventory-item';
        
        if (index === selectedItemIndex) {
            slot.classList.add('selected');
        }
        
        if (item) {
            const img = document.createElement('img');
            img.className = 'inventory-item-image';
            img.src = item.image;
            img.alt = item.name;
            slot.appendChild(img);
            
            if (item.count && item.count > 1) {
                const count = document.createElement('div');
                count.className = 'inventory-item-count';
                count.textContent = item.count;
                slot.appendChild(count);
            }
            
            // Add tooltip with item name when hovering (using title for simplicity)
            slot.title = item.name;
        }
        
        // Add click event
        slot.addEventListener('click', function() {
            selectItem(index, isExpanded);
        });
        
        return slot;
    }
    
    // Add an item to the inventory
    function addItem(item) {
        // Handle stackable items
        if (item.count) {
            // Look for existing item to stack with
            const existingIndex = items.findIndex(i => i.id === item.id);
            
            if (existingIndex >= 0) {
                // Stack with existing item
                items[existingIndex].count = (items[existingIndex].count || 1) + (item.count || 1);
                
                // Update UI
                if (expandedInventoryElement && !expandedInventoryElement.classList.contains('hidden')) {
                    renderExpandedInventory();
                }
                
                return true;
            }
        }
        
        // Check if inventory is full
        if (items.length >= maxSlots) {
            if (window.Logger) {
                Logger.log("Inventory is full!");
            }
            return false;
        }
        
        // Add new item
        items.push(item);
        
        // Update UI
        if (expandedInventoryElement && !expandedInventoryElement.classList.contains('hidden')) {
            renderExpandedInventory();
        }
        
        return true;
    }
    
    // Remove an item from inventory
    function removeItem(id, count = 1) {
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) {
            return false;
        }
        
        const item = items[index];
        
        // Handle stackable items
        if (item.count && item.count > count) {
            item.count -= count;
        } else {
            // Remove item completely
            items.splice(index, 1);
            
            // Reset selection if the selected item was removed
            if (selectedItemIndex === index) {
                selectedItemIndex = -1;
            } else if (selectedItemIndex > index) {
                // Adjust selection index if an item before it was removed
                selectedItemIndex--;
            }
        }
        
        // Update UI
        if (expandedInventoryElement && !expandedInventoryElement.classList.contains('hidden')) {
            renderExpandedInventory();
        }
        
        return true;
    }
    
    // Select an item in the inventory
    function selectItem(index, isExpanded = false) {
        if (index >= items.length) {
            return;
        }
        
        // Toggle selection if clicking the same item
        if (selectedItemIndex === index) {
            selectedItemIndex = -1;
        } else {
            selectedItemIndex = index;
        }
        
        // Update UI to show selected state
        if (isExpanded) {
            renderExpandedInventory();
        }
        
        // Return the selected item for convenience
        return selectedItemIndex >= 0 ? items[selectedItemIndex] : null;
    }
    
    // Get the currently selected item
    function getSelectedItem() {
        return selectedItemIndex >= 0 && selectedItemIndex < items.length ? items[selectedItemIndex] : null;
    }
    
    // Get all inventory items
    function getAllItems() {
        return [...items]; // Return a copy to prevent external modification
    }
    
    // Get all equipped items
    function getEquippedItems() {
        const equipped = {};
        for (const slotId in equipmentSlots) {
            if (equipmentSlots[slotId].item) {
                equipped[slotId] = equipmentSlots[slotId].item;
            }
        }
        return equipped;
    }
    
    // Clear the inventory
    function clearInventory() {
        // Clear all items
        items = [];
        selectedItemIndex = -1;
        
        // Clear equipment slots
        for (const slotId in equipmentSlots) {
            equipmentSlots[slotId].item = null;
        }
        
        // Update UI
        if (expandedInventoryElement && !expandedInventoryElement.classList.contains('hidden')) {
            renderExpandedInventory();
        }
        
        if (window.Logger) {
            Logger.log("Inventory cleared.");
        }
        
        return true;
    }
    
    // Pause the game
    function pauseGame() {
        if (isPaused) return;
        
        isPaused = true;
        
        // Emit pause event
        if (window.EventSystem) {
            EventSystem.emit('game:pause');
        }
    }
    
    // Unpause the game
    function unpauseGame() {
        if (!isPaused) return;
        
        isPaused = false;
        
        // Emit unpause event
        if (window.EventSystem) {
            EventSystem.emit('game:unpause');
        }
    }
    
    // Toggle expanded inventory
    function toggleExpandedInventory(forceClose) {
        if (forceClose || !expandedInventoryElement.classList.contains('hidden')) {
            expandedInventoryElement.classList.add('hidden');
            unpauseGame();
            return;
        }
        
        // Show inventory and render items
        expandedInventoryElement.classList.remove('hidden');
        renderExpandedInventory();
        pauseGame();
    }
    
    // Public API
    return {
        init: init,
        toggleInventory: toggleExpandedInventory,
        addItem: addItem,
        removeItem: removeItem,
        getSelectedItem: getSelectedItem,
        getAllItems: getAllItems,
        getEquippedItems: getEquippedItems,
        clearInventory: clearInventory
    };
})();

// Initialize the inventory system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    InventorySystem.init();
}); 