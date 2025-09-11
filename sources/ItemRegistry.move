module MyItems::ItemRegistry {

    use std::string;
    use std::vector;
    use std::signer;

    /// Struct to represent an Item
    struct Item has store, key, copy, drop {
        item_type: string::String,
        item_name: string::String,
        order_id: string::String,
        pickup_date: string::String,
        pickup_time: string::String,
        wallet_address: string::String,
        sold_by: string::String,
    }

    /// Each user stores their own items
    struct ItemStore has key {
        items: vector<Item>,
    }

    /// Initialize store for user
    public entry fun init_store(account: &signer) {
        move_to(account, ItemStore { items: vector::empty<Item>() });
    }

    /// Add new item
    public entry fun add_item(
        account: &signer,
        item_type: string::String,
        item_name: string::String,
        order_id: string::String,
        pickup_date: string::String,
        pickup_time: string::String,
        wallet_address: string::String,
        sold_by: string::String
    ) acquires ItemStore {
        let store_ref = borrow_global_mut<ItemStore>(signer::address_of(account));
        let new_item = Item {
            item_type,
            item_name,
            order_id,
            pickup_date,
            pickup_time,
            wallet_address,
            sold_by,
        };
        vector::push_back(&mut store_ref.items, new_item);
    }

    /// View stored items
    public fun get_items(addr: address): vector<Item> acquires ItemStore {
        let store_ref = borrow_global<ItemStore>(addr);
        store_ref.items
    }
}