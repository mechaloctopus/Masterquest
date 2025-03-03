// Inventory System
const InventorySystem = (function() {
    // Private properties
    let initialized = false;
    let inventoryContainerElement = null;
    let inventoryToggleElement = null;
    let inventoryContentElement = null;
    let isCollapsed = true; // Start collapsed
    
    // Inventory data
    let items = [];
    let selectedItemIndex = -1;
    const maxSlots = 16; // 4x4 grid
    
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
        
        // Initialize with some example items
        addExampleItems();
        
        // Render the initial inventory
        render();
        
        initialized = true;
        
        // Log initialization if logger is available
        if (window.Logger) {
            Logger.log("> INVENTORY SYSTEM INITIALIZED");
        }
        
        return true;
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
    function createInventorySlot(index, item) {
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
            slot.title = `${item.name}\n${item.description}`;
            
            // Add click handler for selection
            slot.addEventListener('click', () => selectItem(index));
        } else {
            // Empty slot
            slot.classList.add('empty');
        }
        
        return slot;
    }
    
    // Add an item to the inventory
    function addItem(item) {
        if (!item || !item.id) return false;
        
        // Check if the item already exists in the inventory
        const existingIndex = items.findIndex(i => i.id === item.id);
        
        if (existingIndex !== -1) {
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
        
        // Emit item removed event
        if (window.EventSystem) {
            EventSystem.emit('inventory.itemRemoved', { id, count });
        }
        
        return true;
    }
    
    // Select an item in the inventory
    function selectItem(index) {
        if (index < 0 || index >= items.length) {
            selectedItemIndex = -1;
        } else {
            selectedItemIndex = index;
        }
        
        // Render the updated inventory
        render();
        
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
    
    // Clear the inventory
    function clearInventory() {
        items = [];
        selectedItemIndex = -1;
        
        // Render the updated inventory
        render();
        
        // Emit inventory cleared event
        if (window.EventSystem) {
            EventSystem.emit('inventory.cleared');
        }
    }
    
    // Check if inventory is collapsed
    function isInventoryCollapsed() {
        return isCollapsed;
    }
    
    // Show the inventory
    function show() {
        if (!inventoryContainerElement) return;
        
        inventoryContainerElement.style.display = 'block';
    }
    
    // Hide the inventory
    function hide() {
        if (!inventoryContainerElement) return;
        
        inventoryContainerElement.style.display = 'none';
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
        clearInventory,
        toggle: toggleInventory,
        isCollapsed: isInventoryCollapsed,
        show,
        hide
    };
})(); 