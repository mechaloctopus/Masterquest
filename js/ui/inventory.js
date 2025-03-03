// Inventory System
const InventorySystem = (function() {
    // Private properties
    let initialized = false;
    let inventoryContainerElement = null;
    let inventoryToggleElement = null;
    let inventoryContentElement = null;
    let expandedInventoryElement = null;
    let isCollapsed = true; // Start collapsed
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
        if (initialized) return true;
        
        // Get inventory elements
        inventoryContainerElement = document.getElementById('inventoryContainer');
        if (!inventoryContainerElement) {
            console.error("Inventory container element not found!");
            return false;
        }
        
        inventoryToggleElement = document.getElementById('inventoryToggle');
        inventoryContentElement = document.getElementById('inventoryContent');
        
        // Set up toggle functionality
        if (inventoryToggleElement) {
            inventoryToggleElement.addEventListener('click', toggleInventory);
        }
        
        // Create expanded inventory if it doesn't exist
        createExpandedInventory();
        
        // Add pause button
        createPauseButton();
        
        // Initialize with some example items
        addExampleItems();
        
        // Render the initial inventory
        render();
        
        // Key event listener for 'I' key to toggle inventory
        window.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                toggleExpandedInventory();
            }
            if (e.key === 'Escape') {
                if (!isCollapsed) {
                    toggleExpandedInventory(true); // Force close
                }
            }
        });
        
        initialized = true;
        
        // Log initialization if logger is available
        if (window.Logger) {
            Logger.log("> INVENTORY SYSTEM INITIALIZED");
        }
        
        return true;
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
        
        const title = document.createElement('h2');
        title.textContent = 'INVENTORY';
        header.appendChild(title);
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.className = 'expanded-inventory-close';
        closeBtn.addEventListener('click', () => toggleExpandedInventory(true));
        header.appendChild(closeBtn);
        
        expandedInventoryElement.appendChild(header);
        
        // Create main inventory content
        const content = document.createElement('div');
        content.className = 'expanded-inventory-content';
        
        // Left side - Character equipment
        const equipmentSide = document.createElement('div');
        equipmentSide.className = 'equipment-side';
        
        const characterContainer = document.createElement('div');
        characterContainer.className = 'character-container';
        
        // Create character silhouette
        const character = document.createElement('div');
        character.className = 'character-silhouette';
        characterContainer.appendChild(character);
        
        // Create equipment slots
        Object.keys(equipmentSlots).forEach(slotId => {
            const slot = createEquipmentSlot(slotId, equipmentSlots[slotId]);
            characterContainer.appendChild(slot);
        });
        
        equipmentSide.appendChild(characterContainer);
        
        // Right side - Items grid
        const itemsSide = document.createElement('div');
        itemsSide.className = 'items-side';
        
        const itemsTitle = document.createElement('h3');
        itemsTitle.textContent = 'ITEMS';
        itemsSide.appendChild(itemsTitle);
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'items-grid';
        itemsGrid.id = 'expandedItemsGrid';
        itemsSide.appendChild(itemsGrid);
        
        content.appendChild(equipmentSide);
        content.appendChild(itemsSide);
        expandedInventoryElement.appendChild(content);
        
        // Add to document body
        document.body.appendChild(expandedInventoryElement);
    }
    
    // Create a pause button
    function createPauseButton() {
        // Create a pause button if it doesn't exist
        if (!document.getElementById('pauseButton')) {
            const pauseButton = document.createElement('button');
            pauseButton.id = 'pauseButton';
            pauseButton.className = 'pause-button';
            pauseButton.textContent = 'INVENTORY';
            pauseButton.addEventListener('click', toggleExpandedInventory);
            document.body.appendChild(pauseButton);
        }
    }
    
    // Toggle expanded inventory and pause the game
    function toggleExpandedInventory(forceClose) {
        if (!expandedInventoryElement) return;
        
        const shouldClose = forceClose || !expandedInventoryElement.classList.contains('hidden');
        
        if (shouldClose) {
            // Close inventory
            expandedInventoryElement.classList.add('hidden');
            unpauseGame();
        } else {
            // Open inventory, populate items and pause game
            expandedInventoryElement.classList.remove('hidden');
            renderExpandedInventory();
            pauseGame();
        }
    }
    
    // Create an equipment slot element
    function createEquipmentSlot(slotId, slotInfo) {
        const slot = document.createElement('div');
        slot.className = `equipment-slot ${slotId}-slot`;
        slot.dataset.slot = slotId;
        
        const slotLabel = document.createElement('span');
        slotLabel.className = 'equipment-slot-label';
        slotLabel.textContent = slotInfo.name;
        slot.appendChild(slotLabel);
        
        if (slotInfo.item) {
            // If item is equipped, show it
            const itemImg = document.createElement('img');
            itemImg.src = slotInfo.item.image;
            itemImg.alt = slotInfo.item.name;
            slot.appendChild(itemImg);
            
            // Add tooltip
            slot.title = slotInfo.item.name;
        } else {
            // Empty slot
            slot.classList.add('empty');
            slot.title = `Empty ${slotInfo.name} Slot`;
        }
        
        // Add click handler for equipping/unequipping
        slot.addEventListener('click', () => {
            handleEquipmentSlotClick(slotId);
        });
        
        return slot;
    }
    
    // Handle clicks on equipment slots
    function handleEquipmentSlotClick(slotId) {
        if (selectedItemIndex === -1) {
            // No item selected, unequip if something is equipped
            if (equipmentSlots[slotId].item) {
                const unequippedItem = equipmentSlots[slotId].item;
                equipmentSlots[slotId].item = null;
                addItem(unequippedItem);
                renderExpandedInventory();
                
                if (window.EventSystem) {
                    EventSystem.emit('inventory.itemUnequipped', { 
                        slot: slotId,
                        item: unequippedItem
                    });
                }
            }
        } else {
            // Try to equip selected item
            const selectedItem = items[selectedItemIndex];
            
            // Check if item can be equipped in this slot (simplified check)
            let canEquip = false;
            
            switch(slotId) {
                case 'helmet':
                    canEquip = selectedItem.type === 'helmet' || selectedItem.type === 'hat';
                    break;
                case 'amulet':
                    canEquip = selectedItem.type === 'amulet' || selectedItem.type === 'jewelry';
                    break;
                case 'armor':
                    canEquip = selectedItem.type === 'armor' || selectedItem.type === 'chest';
                    break;
                case 'cloak':
                    canEquip = selectedItem.type === 'cloak' || selectedItem.type === 'back';
                    break;
                case 'bracers':
                    canEquip = selectedItem.type === 'bracers' || selectedItem.type === 'wrist';
                    break;
                case 'gloves':
                    canEquip = selectedItem.type === 'gloves' || selectedItem.type === 'hands';
                    break;
                case 'pants':
                    canEquip = selectedItem.type === 'pants' || selectedItem.type === 'legs';
                    break;
                case 'boots':
                    canEquip = selectedItem.type === 'boots' || selectedItem.type === 'feet';
                    break;
                case 'rightHand':
                case 'leftHand':
                    canEquip = selectedItem.type === 'weapon' || selectedItem.type === 'tool' || selectedItem.type === 'shield';
                    break;
                default:
                    canEquip = false;
            }
            
            if (canEquip) {
                // Unequip current item if there is one
                if (equipmentSlots[slotId].item) {
                    addItem(equipmentSlots[slotId].item);
                }
                
                // Remove the item from inventory and equip it
                items.splice(selectedItemIndex, 1);
                equipmentSlots[slotId].item = selectedItem;
                selectedItemIndex = -1;
                
                renderExpandedInventory();
                
                if (window.EventSystem) {
                    EventSystem.emit('inventory.itemEquipped', { 
                        slot: slotId,
                        item: selectedItem
                    });
                }
            } else {
                // Show error message - can't equip this item here
                if (window.Logger) {
                    Logger.warning(`Cannot equip ${selectedItem.name} in ${equipmentSlots[slotId].name} slot`);
                }
            }
        }
    }
    
    // Render expanded inventory
    function renderExpandedInventory() {
        // Render equipment slots
        Object.keys(equipmentSlots).forEach(slotId => {
            const slotElement = expandedInventoryElement.querySelector(`.${slotId}-slot`);
            if (slotElement) {
                // Remove all children except the label
                const label = slotElement.querySelector('.equipment-slot-label');
                slotElement.innerHTML = '';
                if (label) slotElement.appendChild(label);
                
                if (equipmentSlots[slotId].item) {
                    // If item is equipped, show it
                    const itemImg = document.createElement('img');
                    itemImg.src = equipmentSlots[slotId].item.image;
                    itemImg.alt = equipmentSlots[slotId].item.name;
                    slotElement.appendChild(itemImg);
                    
                    // Add tooltip
                    slotElement.title = equipmentSlots[slotId].item.name;
                    slotElement.classList.remove('empty');
                } else {
                    // Empty slot
                    slotElement.classList.add('empty');
                    slotElement.title = `Empty ${equipmentSlots[slotId].name} Slot`;
                }
            }
        });
        
        // Render items grid
        const itemsGrid = document.getElementById('expandedItemsGrid');
        if (itemsGrid) {
            itemsGrid.innerHTML = '';
            
            // Create slots for each item
            for (let i = 0; i < maxSlots; i++) {
                const item = i < items.length ? items[i] : null;
                const slot = createInventorySlot(i, item, true);
                itemsGrid.appendChild(slot);
            }
        }
    }
    
    // Add some example items for testing
    function addExampleItems() {
        addItem({
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 25 health points',
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="%23ff0066"/></svg>',
            count: 3,
            type: 'consumable'
        });
        
        addItem({
            id: 'energy_cell',
            name: 'Energy Cell',
            description: 'Provides power to electronic devices',
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><rect x="6" y="4" width="12" height="16" fill="%2300ffcc"/></svg>',
            count: 10,
            type: 'component'
        });
        
        // Add equipment items example
        addItem({
            id: 'neon_helmet',
            name: 'Neon Helmet',
            description: 'A stylish helmet with neon accents',
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C9 2 6.5 3 5 5c-1 2-1 4.5-1 5v2c0 .5 0 1 .5 1.5l.5.5v2c0 1 .5 2 1.5 2h11c1 0 1.5-1 1.5-2v-2l.5-.5c.5-.5.5-1 .5-1.5v-2c0-.5 0-3-1-5-1.5-2-4-3-7-3z" fill="%2300ffcc" stroke="%23ff00cc" stroke-width="1"/></svg>',
            count: 1,
            type: 'helmet'
        });
        
        addItem({
            id: 'laser_sword',
            name: 'Laser Sword',
            description: 'A powerful energy blade',
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><rect x="11" y="4" width="2" height="16" fill="%23cccccc"/><rect x="7" y="4" width="10" height="2" fill="%23cccccc"/><rect x="11" y="2" width="2" height="2" fill="%23cccccc"/><rect x="9" y="18" width="6" height="2" fill="%23ff00cc"/></svg>',
            count: 1,
            type: 'weapon'
        });
    }
    
    // Toggle inventory collapsed state
    function toggleInventory() {
        if (!inventoryContainerElement) return;
        
        isCollapsed = !isCollapsed;
        
        if (isCollapsed) {
            inventoryContainerElement.classList.add('collapsed');
            if (inventoryToggleElement) {
                inventoryToggleElement.textContent = '▲';
            }
        } else {
            inventoryContainerElement.classList.remove('collapsed');
            if (inventoryToggleElement) {
                inventoryToggleElement.textContent = '▼';
            }
        }
        
        // Emit inventory toggle event
        if (window.EventSystem) {
            EventSystem.emit('inventory.toggled', { collapsed: isCollapsed });
        }
    }
    
    // Pause the game
    function pauseGame() {
        if (isPaused) return;
        
        isPaused = true;
        
        // Emit pause event
        if (window.EventSystem) {
            EventSystem.emit('game.paused', { source: 'inventory' });
        }
    }
    
    // Unpause the game
    function unpauseGame() {
        if (!isPaused) return;
        
        isPaused = false;
        
        // Emit unpause event
        if (window.EventSystem) {
            EventSystem.emit('game.resumed', { source: 'inventory' });
        }
    }
    
    // Render the inventory
    function render() {
        if (!inventoryContentElement) return;
        
        // Clear the inventory container
        inventoryContentElement.innerHTML = '';
        
        // Create slots for each item
        for (let i = 0; i < maxSlots; i++) {
            const item = i < items.length ? items[i] : null;
            const slot = createInventorySlot(i, item);
            inventoryContentElement.appendChild(slot);
        }
    }
    
    // Create an inventory slot element
    function createInventorySlot(index, item, isExpanded = false) {
        const slot = document.createElement('div');
        slot.className = 'inventory-item';
        slot.dataset.index = index;
        
        if (item) {
            // Item exists in this slot
            const image = document.createElement('img');
            image.className = 'inventory-item-image';
            image.src = item.image;
            image.alt = item.name;
            slot.appendChild(image);
            
            // Add count if more than 1
            if (item.count > 1) {
                const count = document.createElement('div');
                count.className = 'inventory-item-count';
                count.textContent = item.count;
                slot.appendChild(count);
            }
            
            // Add selected state if this is the selected item
            if (index === selectedItemIndex) {
                slot.classList.add('selected');
            }
            
            // Add tooltip with item info on hover
            slot.title = `${item.name}\n${item.description}\nType: ${item.type}`;
            
            // Add click handler for selection
            slot.addEventListener('click', () => selectItem(index, isExpanded));
        } else {
            // Empty slot
            slot.classList.add('empty');
        }
        
        return slot;
    }
    
    // Add an item to the inventory
    function addItem(item) {
        if (!item || !item.id) return false;
        
        // Check if the item already exists in the inventory and is stackable
        const isStackable = item.type === 'consumable' || item.type === 'component' || item.type === 'material';
        const existingIndex = isStackable ? items.findIndex(i => i.id === item.id) : -1;
        
        if (existingIndex !== -1 && isStackable) {
            // Increment count of existing item
            items[existingIndex].count += item.count || 1;
        } else {
            // Add new item if there's space
            if (items.length < maxSlots) {
                // Ensure count is at least 1
                item.count = item.count || 1;
                items.push(item);
            } else {
                // Inventory is full
                if (window.Logger) {
                    Logger.warning("Inventory is full!");
                }
                return false;
            }
        }
        
        // Render the updated inventory
        render();
        if (!expandedInventoryElement?.classList.contains('hidden')) {
            renderExpandedInventory();
        }
        
        // Emit item added event
        if (window.EventSystem) {
            EventSystem.emit('inventory.itemAdded', { item });
        }
        
        return true;
    }
    
    // Remove an item from the inventory
    function removeItem(id, count = 1) {
        if (!id) return false;
        
        // Find the item
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) return false;
        
        // Decrement the count
        items[index].count -= count;
        
        // Remove the item if count is zero or less
        if (items[index].count <= 0) {
            items.splice(index, 1);
            
            // Update selected item index if necessary
            if (selectedItemIndex === index) {
                selectedItemIndex = -1;
            } else if (selectedItemIndex > index) {
                selectedItemIndex--;
            }
        }
        
        // Render the updated inventory
        render();
        if (!expandedInventoryElement?.classList.contains('hidden')) {
            renderExpandedInventory();
        }
        
        // Emit item removed event
        if (window.EventSystem) {
            EventSystem.emit('inventory.itemRemoved', { id, count });
        }
        
        return true;
    }
    
    // Select an item in the inventory
    function selectItem(index, isExpanded = false) {
        // Toggle selection if clicking the same item
        if (selectedItemIndex === index) {
            selectedItemIndex = -1;
        } else if (index >= 0 && index < items.length) {
            selectedItemIndex = index;
        } else {
            selectedItemIndex = -1;
        }
        
        // Render the updated inventory
        if (isExpanded) {
            renderExpandedInventory();
        } else {
            render();
        }
        
        // Emit item selected event
        if (selectedItemIndex !== -1 && window.EventSystem) {
            EventSystem.emit('inventory.itemSelected', { 
                item: items[selectedItemIndex],
                index: selectedItemIndex
            });
        }
        
        return selectedItemIndex !== -1 ? items[selectedItemIndex] : null;
    }
    
    // Get the currently selected item
    function getSelectedItem() {
        return selectedItemIndex !== -1 ? items[selectedItemIndex] : null;
    }
    
    // Get all items in the inventory
    function getAllItems() {
        return [...items];
    }
    
    // Get all equipped items
    function getEquippedItems() {
        const equipped = {};
        Object.keys(equipmentSlots).forEach(slot => {
            equipped[slot] = equipmentSlots[slot].item;
        });
        return equipped;
    }
    
    // Clear the inventory
    function clearInventory() {
        items = [];
        selectedItemIndex = -1;
        
        // Clear equipment slots
        Object.keys(equipmentSlots).forEach(slot => {
            equipmentSlots[slot].item = null;
        });
        
        // Render updates
        render();
        if (!expandedInventoryElement?.classList.contains('hidden')) {
            renderExpandedInventory();
        }
        
        // Emit inventory cleared event
        if (window.EventSystem) {
            EventSystem.emit('inventory.cleared', {});
        }
    }
    
    // Check if inventory is collapsed
    function isInventoryCollapsed() {
        return isCollapsed;
    }
    
    // Show the inventory
    function show() {
        if (inventoryContainerElement) {
            inventoryContainerElement.style.display = 'block';
        }
    }
    
    // Hide the inventory
    function hide() {
        if (inventoryContainerElement) {
            inventoryContainerElement.style.display = 'none';
        }
    }
    
    // Initialize when the DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        addItem,
        removeItem,
        selectItem,
        getSelectedItem,
        getAllItems,
        getEquippedItems,
        clearInventory,
        isInventoryCollapsed,
        show,
        hide,
        toggleInventory,
        toggleExpandedInventory,
        pauseGame,
        unpauseGame
    };
})(); 