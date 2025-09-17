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
                abort 1;
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
        if (!exists<ItemStore>(addr)) {
            abort 2;
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
        abort 3;
    }

    // View stored items
    #[view]
    public fun get_items(addr: address): vector<Item> acquires ItemStore {
        if (!exists<ItemStore>(addr)) {
            return vector::empty<Item>()
        };
        let store_ref = borrow_global<ItemStore>(addr);
        store_ref.items
    }

    // Get specific item by order_id
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
}