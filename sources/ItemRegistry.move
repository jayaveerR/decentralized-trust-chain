module MyItems::ItemRegistry {
    use std::string;
    use std::vector;
    use std::signer;

    /// Original Item struct - keeping the EXACT same layout as before
    struct Item has store, key, copy, drop {
        item_type: string::String,
        item_name: string::String,
        order_id: string::String,
        pickup_date: string::String,
        pickup_time: string::String,
        wallet_address: string::String,
        sold_by: string::String,
        transaction_hash: string::String,
    }

    /// Each user stores their own items
    struct ItemStore has key {
        items: vector<Item>,
    }

    /// Error codes
    const E_DUPLICATE_ORDER_ID: u64 = 1;
    const E_STORE_NOT_EXISTS: u64 = 2;
    const E_ITEM_NOT_FOUND: u64 = 3;
    const E_INVALID_SIGNER: u64 = 4;

    /// Initialize store for user (only if not exists)
    public entry fun init_store(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<ItemStore>(addr)) {
            move_to(account, ItemStore { items: vector::empty<Item>() });
        };
    }

    /// Original add_item function - keeping EXACT same parameters as deployed version
    public entry fun add_item(
        account: &signer,
        item_type: string::String,
        item_name: string::String,
        order_id: string::String,
        pickup_date: string::String,
        pickup_time: string::String,
        wallet_address: string::String,
        sold_by: string::String,
        transaction_hash: string::String
    ) acquires ItemStore {
        let addr = signer::address_of(account);
        
        // ensure store exists
        if (!exists<ItemStore>(addr)) {
            move_to(account, ItemStore { items: vector::empty<Item>() });
        };
        
        let store_ref = borrow_global_mut<ItemStore>(addr);

        // duplicate check: iterate existing items and compare order_id
        let len = vector::length(&store_ref.items);
        let i = 0;
        while (i < len) {
            let existing = vector::borrow(&store_ref.items, i);
            // Compare strings by converting to bytes
            if (*string::bytes(&existing.order_id) == *string::bytes(&order_id)) {
                abort E_DUPLICATE_ORDER_ID;
            };
            i = i + 1;
        };

        // push new item
        let new_item = Item {
            item_type,
            item_name,
            order_id,
            pickup_date,
            pickup_time,
            wallet_address,
            sold_by,
            transaction_hash,
        };
        vector::push_back(&mut store_ref.items, new_item);
    }

    /// Update transaction hash for an item identified by order_id
    public entry fun update_txn_hash(
        account: &signer,
        order_id: string::String,
        txn_hash: string::String
    ) acquires ItemStore {
        let addr = signer::address_of(account);
        
        // Check if store exists
        if (!exists<ItemStore>(addr)) {
            abort E_STORE_NOT_EXISTS;
        };
        
        let store_ref = borrow_global_mut<ItemStore>(addr);
        let len = vector::length(&store_ref.items);
        let i = 0;
        
        while (i < len) {
            let item_ref = vector::borrow_mut(&mut store_ref.items, i);
            // Compare strings by converting to bytes
            if (*string::bytes(&item_ref.order_id) == *string::bytes(&order_id)) {
                item_ref.transaction_hash = txn_hash;
                return;
            };
            i = i + 1;
        };
        
        // If we reach here, item was not found
        abort E_ITEM_NOT_FOUND;
    }

    /// Update multiple fields of an item by order_id
    public entry fun update_item(
        account: &signer,
        order_id: string::String,
        item_type: string::String,
        item_name: string::String,
        pickup_date: string::String,
        pickup_time: string::String,
        wallet_address: string::String,
        sold_by: string::String,
        transaction_hash: string::String
    ) acquires ItemStore {
        let addr = signer::address_of(account);
        
        if (!exists<ItemStore>(addr)) {
            abort E_STORE_NOT_EXISTS;
        };
        
        let store_ref = borrow_global_mut<ItemStore>(addr);
        let len = vector::length(&store_ref.items);
        let i = 0;
        
        while (i < len) {
            let item_ref = vector::borrow_mut(&mut store_ref.items, i);
            if (*string::bytes(&item_ref.order_id) == *string::bytes(&order_id)) {
                item_ref.item_type = item_type;
                item_ref.item_name = item_name;
                item_ref.pickup_date = pickup_date;
                item_ref.pickup_time = pickup_time;
                item_ref.wallet_address = wallet_address;
                item_ref.sold_by = sold_by;
                item_ref.transaction_hash = transaction_hash;
                return;
            };
            i = i + 1;
        };
        
        abort E_ITEM_NOT_FOUND;
    }

    /// Remove an item by order_id
    public entry fun remove_item(
        account: &signer,
        order_id: string::String
    ) acquires ItemStore {
        let addr = signer::address_of(account);
        
        if (!exists<ItemStore>(addr)) {
            abort E_STORE_NOT_EXISTS;
        };
        
        let store_ref = borrow_global_mut<ItemStore>(addr);
        let len = vector::length(&store_ref.items);
        let i = 0;
        
        while (i < len) {
            let item = vector::borrow(&store_ref.items, i);
            if (*string::bytes(&item.order_id) == *string::bytes(&order_id)) {
                vector::remove(&mut store_ref.items, i);
                return;
            };
            i = i + 1;
        };
        
        abort E_ITEM_NOT_FOUND;
    }

    /// Get total count of items for a user
    #[view]
    public fun get_items_count(addr: address): u64 acquires ItemStore {
        if (!exists<ItemStore>(addr)) {
            return 0
        };
        let store_ref = borrow_global<ItemStore>(addr);
        vector::length(&store_ref.items)
    }

    /// Check if an order_id already exists for a user
    #[view]
    public fun order_id_exists(addr: address, order_id: string::String): bool acquires ItemStore {
        if (!exists<ItemStore>(addr)) {
            return false
        };
        
        let store_ref = borrow_global<ItemStore>(addr);
        let len = vector::length(&store_ref.items);
        let i = 0;
        
        while (i < len) {
            let item = vector::borrow(&store_ref.items, i);
            if (*string::bytes(&item.order_id) == *string::bytes(&order_id)) {
                return true;
            };
            i = i + 1;
        };
        
        false
    }

    /// Get items by item_type filter
    #[view]
    public fun get_items_by_type(addr: address, item_type: string::String): vector<Item> acquires ItemStore {
        if (!exists<ItemStore>(addr)) {
            return vector::empty<Item>()
        };
        
        let store_ref = borrow_global<ItemStore>(addr);
        let filtered_items = vector::empty<Item>();
        let len = vector::length(&store_ref.items);
        let i = 0;
        
        while (i < len) {
            let item = vector::borrow(&store_ref.items, i);
            if (*string::bytes(&item.item_type) == *string::bytes(&item_type)) {
                vector::push_back(&mut filtered_items, *item);
            };
            i = i + 1;
        };
        
        filtered_items
    }

    /// View stored items
    #[view]
    public fun get_items(addr: address): vector<Item> acquires ItemStore {
        if (!exists<ItemStore>(addr)) {
            return vector::empty<Item>()
        };
        let store_ref = borrow_global<ItemStore>(addr);
        store_ref.items
    }

    /// Get specific item by order_id
    #[view]
    public fun get_item_by_order_id(addr: address, order_id: string::String): Item acquires ItemStore {
        if (!exists<ItemStore>(addr)) {
            // Return empty item instead of aborting
            return Item {
                item_type: string::utf8(b""),
                item_name: string::utf8(b""),
                order_id: string::utf8(b""),
                pickup_date: string::utf8(b""),
                pickup_time: string::utf8(b""),
                wallet_address: string::utf8(b""),
                sold_by: string::utf8(b""),
                transaction_hash: string::utf8(b""),
            }
        };
        
        let store_ref = borrow_global<ItemStore>(addr);
        let len = vector::length(&store_ref.items);
        let i = 0;
        
        while (i < len) {
            let item = vector::borrow(&store_ref.items, i);
            if (*string::bytes(&item.order_id) == *string::bytes(&order_id)) {
                return *item;
            };
            i = i + 1;
        };
        
        // Return empty item if not found
        Item {
            item_type: string::utf8(b""),
            item_name: string::utf8(b""),
            order_id: string::utf8(b""),
            pickup_date: string::utf8(b""),
            pickup_time: string::utf8(b""),
            wallet_address: string::utf8(b""),
            sold_by: string::utf8(b""),
            transaction_hash: string::utf8(b""),
        }
    }

    /// Check if store exists for an address
    #[view]
    public fun store_exists(addr: address): bool {
        exists<ItemStore>(addr)
    }
}